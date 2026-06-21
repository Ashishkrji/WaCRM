import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { connectToDatabase } from '@/lib/mongodb'
import { type SupabaseClient } from '@supabase/supabase-js'
import { ingestText, fetchWebsiteContent, deleteDocumentEmbeddings } from '@/lib/ai/knowledge/ingest'
import crypto from 'crypto'

async function requireUser(): Promise<
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; status: number; body: { error: string } }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, body: { error: 'Unauthorized' } }
  }
  return { ok: true, userId: user.id, supabase }
}

export async function GET() {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  try {
    const { db } = await connectToDatabase()
    const documents = await db.collection('knowledge_base')
      .find({ user_id: guard.userId })
      .sort({ created_at: -1 })
      .toArray()

    const formatted = documents.map(doc => ({
      id: doc.id || doc._id.toString(),
      title: doc.title,
      doc_type: doc.doc_type,
      status: doc.status,
      chunk_count: doc.chunk_count || 0,
      error_message: doc.error_message || null,
      created_at: doc.created_at,
    }))

    return NextResponse.json({ documents: formatted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  const { userId } = guard

  try {
    const body = (await request.json().catch(() => null)) as {
      title?: string
      doc_type?: string
      content?: string
      source_url?: string
    } | null

    if (!body || typeof body.title !== 'string' || typeof body.doc_type !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: title, doc_type' },
        { status: 400 }
      )
    }

    const title = body.title
    const doc_type = body.doc_type
    const { content, source_url } = body
    const docId = crypto.randomUUID()

    const { db } = await connectToDatabase()

    const doc = {
      id: docId,
      user_id: userId,
      title,
      doc_type,
      content: content || null,
      source_url: source_url || null,
      status: 'pending',
      chunk_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    }

    await db.collection('knowledge_base').insertOne(doc)

    // Trigger background ingestion
    if (content) {
      void ingestText({
        userId,
        knowledgeBaseId: docId,
        content,
      }).catch((err) => {
        console.error('[knowledge/ingest] Background ingest failed:', err)
      })
    } else if (doc_type === 'website' && source_url) {
      void (async () => {
        try {
          const fetchedContent = await fetchWebsiteContent(source_url)
          
          const { db: innerDb } = await connectToDatabase()
          await innerDb.collection('knowledge_base').updateOne(
            { id: docId },
            { $set: { content: fetchedContent, updated_at: new Date() } }
          )

          await ingestText({
            userId,
            knowledgeBaseId: docId,
            content: fetchedContent,
          })
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          console.error('[knowledge/ingest] Website fetch/ingest failed:', errMsg)
          
          const { db: innerDb } = await connectToDatabase()
          await innerDb.collection('knowledge_base').updateOne(
            { id: docId },
            { $set: { status: 'failed', error_message: `Fetch failed: ${errMsg}`, updated_at: new Date() } }
          )
        }
      })()
    }

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/ai/knowledge] POST error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  const { supabase, userId } = guard
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 })
  }

  try {
    const { db } = await connectToDatabase()
    
    const doc = await db.collection('knowledge_base').findOne({
      id: id,
      user_id: userId
    })

    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Delete embeddings first from MongoDB
    await deleteDocumentEmbeddings(doc.id)

    // Delete file from Supabase Storage if storage_path exists
    if (doc.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from('knowledge-base')
        .remove([doc.storage_path])

      if (storageErr) {
        console.warn(`[api/ai/knowledge] Failed to delete storage file ${doc.storage_path}:`, storageErr.message)
      }
    }

    // Delete from MongoDB knowledge_base
    await db.collection('knowledge_base').deleteOne({ id: doc.id })

    return NextResponse.json({ success: true, message: 'Document deleted successfully' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/ai/knowledge] DELETE error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
