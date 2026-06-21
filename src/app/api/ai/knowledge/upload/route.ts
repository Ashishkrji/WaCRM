import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type SupabaseClient } from '@supabase/supabase-js'
import { ingestText } from '@/lib/ai/knowledge/ingest'
import { connectToDatabase } from '@/lib/mongodb'
import crypto from 'crypto'

async function requireUser(): Promise<
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true, userId: user.id, supabase }
}

/**
 * A simple zero-dependency PDF text extractor.
 * Scans for BT...ET blocks and extracts text from Tj/TJ commands.
 */
function parsePdfText(buffer: Buffer): string {
  const str = buffer.toString('binary')
  const btBlocks = str.matchAll(/BT[\s\S]*?ET/g)
  const result: string[] = []
  
  for (const block of btBlocks) {
    const matches = block[0].matchAll(/\((.*?)\)/g)
    for (const match of matches) {
      let chunk = match[1]
        // Decode octal escapes (e.g. \303\241)
        .replace(/\\([\d]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        // Remove basic escape slashes
        .replace(/\\(.)/g, '$1')
      result.push(chunk)
    }
    // Add space between text blocks
    result.push(' ')
  }
  
  const extracted = result.join('').replace(/\s+/g, ' ').trim()
  return extracted || 'Empty PDF or scanned image (no selectable text)'
}

/**
 * A basic fallback DOCX text extractor.
 */
function parseDocxText(buffer: Buffer): string {
  const str = buffer.toString('binary')
  const matches = str.match(/[a-zA-Z0-9\s.,!?;:()'"-]{10,}/g)
  if (matches && matches.length > 0) {
    return matches.join(' ').replace(/\s+/g, ' ').trim()
  }
  return 'DOCX text extraction failed: XML file is compressed. Please convert to plain text or PDF.'
}

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 401 })
  }

  const { userId, supabase } = guard

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docType = formData.get('doc_type') as string | null // 'pdf' | 'docx' | 'txt' etc.

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    
    const detectedDocType = docType || (fileExtension === 'pdf' ? 'pdf' : fileExtension === 'docx' ? 'docx' : 'txt')

    // 1. Upload to Supabase Storage bucket 'knowledge-base'
    const storagePath = `${userId}/${Date.now()}_${fileName}`
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('knowledge-base')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadErr) {
      console.error('[API/knowledge/upload] Storage upload failed:', uploadErr.message)
      return NextResponse.json({ error: `Storage upload failed: ${uploadErr.message}` }, { status: 500 })
    }

    // 2. Parse file content depending on type
    let extractedText = ''
    if (detectedDocType === 'pdf') {
      extractedText = parsePdfText(buffer)
    } else if (detectedDocType === 'docx') {
      extractedText = parseDocxText(buffer)
    } else {
      // Default to plain text
      extractedText = buffer.toString('utf-8')
    }

    // 3. Create entry in knowledge_base (MongoDB)
    const finalDocType = ['pdf', 'docx', 'txt'].includes(detectedDocType) ? detectedDocType : 'txt'
    const docId = crypto.randomUUID()
    const doc = {
      id: docId,
      user_id: userId,
      title: fileName,
      doc_type: finalDocType,
      content: extractedText,
      storage_path: storagePath,
      status: 'pending',
      chunk_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const { db } = await connectToDatabase()
    await db.collection('knowledge_base').insertOne(doc)

    // 4. Trigger ingestion in the background
    void ingestText({
      userId,
      knowledgeBaseId: docId,
      content: extractedText,
    }).catch((err) => {
      console.error('[knowledge/ingest] Background ingest failed:', err)
    })

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/ai/knowledge/upload] Upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
