import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbService } from '@/services/db'
import { type SupabaseClient } from '@supabase/supabase-js'
import { ingestText, fetchWebsiteContent, crawlWebsite } from '@/lib/ai/knowledge/ingest'
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
    // Fetch documents from MongoDB Atlas via Database Service Layer
    const documents = await dbService.ai.listKnowledgeBase(guard.userId)

    const formatted = documents.map(doc => ({
      id: doc.id || doc._id.toString(),
      title: doc.title,
      doc_type: doc.doc_type,
      status: doc.status,
      chunk_count: doc.chunk_count || 0,
      error_message: doc.error_message || null,
      category: doc.category || 'General',
      tags: doc.tags || [],
      source_url: doc.source_url || null,
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
      category?: string
      tags?: string[]
      crawl_depth?: number
      max_pages?: number
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
    const category = body.category || 'General'
    const tags = body.tags || []
    
    // Cap depth to 3, max pages to 20 to prevent server timeouts
    const crawl_depth = Math.min(3, Math.max(1, body.crawl_depth || 1))
    const max_pages = Math.min(20, Math.max(1, body.max_pages || 10))

    const docId = crypto.randomUUID()

    const doc = {
      id: docId,
      user_id: userId,
      title,
      doc_type,
      content: content || null,
      source_url: source_url || null,
      category,
      tags,
      status: 'pending',
      chunk_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Insert doc via dbService
    await dbService.ai.insertKnowledgeDoc(doc)

    // Trigger background ingestion
    if (content) {
      void ingestText({
        userId,
        knowledgeBaseId: docId,
        content,
        category,
        tags,
        sourceUrl: source_url || null,
      }).catch((err) => {
        console.error('[knowledge/ingest] Background ingest failed:', err)
      })
    } else if (doc_type === 'website' && source_url) {
      void (async () => {
        try {
          // Crawl recursively
          const crawledPages = await crawlWebsite(source_url, crawl_depth, max_pages)

          if (crawledPages.length === 0) {
            await dbService.ai.updateKnowledgeDoc(docId, {
              status: 'failed',
              error_message: 'No readable pages crawled from start URL.',
              updated_at: new Date(),
            })
            return
          }

          // First page content updates the primary document
          const firstPage = crawledPages[0]
          await dbService.ai.updateKnowledgeDoc(docId, {
            title: firstPage.title || title,
            content: firstPage.content,
            updated_at: new Date(),
          })

          await ingestText({
            userId,
            knowledgeBaseId: docId,
            content: firstPage.content,
            category,
            tags,
            sourceUrl: firstPage.url,
          })

          // Additional pages create new sub-documents dynamically
          for (let i = 1; i < crawledPages.length; i++) {
            const page = crawledPages[i]
            const subDocId = crypto.randomUUID()

            const subDoc = {
              id: subDocId,
              user_id: userId,
              title: page.title || `${title} - Page ${i + 1}`,
              doc_type: 'website',
              content: page.content,
              source_url: page.url,
              category,
              tags,
              status: 'pending',
              chunk_count: 0,
              created_at: new Date(),
              updated_at: new Date(),
            }

            await dbService.ai.insertKnowledgeDoc(subDoc)

            await ingestText({
              userId,
              knowledgeBaseId: subDocId,
              content: page.content,
              category,
              tags,
              sourceUrl: page.url,
            }).catch((err) => {
              console.error('[knowledge/ingest] Background subDoc ingest failed:', err)
            })
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          console.error('[knowledge/ingest] Website crawl/ingest failed:', errMsg)
          
          await dbService.ai.updateKnowledgeDoc(docId, {
            status: 'failed',
            error_message: `Crawl failed: ${errMsg}`,
            updated_at: new Date(),
          }).catch((dbErr) => {
            console.error('[knowledge/ingest] Failed to update document failure status:', dbErr)
          })
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
    const doc = await dbService.ai.getKnowledgeDoc(userId, id)

    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Delete embeddings first via dbService
    await dbService.ai.deleteKnowledgeEmbeddings(doc.id)

    // Delete file from Supabase Storage if storage_path exists
    if (doc.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from('knowledge-base')
        .remove([doc.storage_path])

      if (storageErr) {
        console.warn(`[api/ai/knowledge] Failed to delete storage file ${doc.storage_path}:`, storageErr.message)
      }
    }

    // Delete from MongoDB knowledge_base via dbService
    await dbService.ai.deleteKnowledgeDoc(doc.id)

    return NextResponse.json({ success: true, message: 'Document deleted successfully' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/ai/knowledge] DELETE error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
