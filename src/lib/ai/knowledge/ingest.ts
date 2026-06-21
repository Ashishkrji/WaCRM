/**
 * Knowledge Base — Document ingestion pipeline.
 *
 * Handles chunking text documents and generating embeddings for storage
 * in MongoDB collections. Works with:
 *   - Plain text
 *   - PDF (text layer via a simple extraction approach)
 *   - DOCX (XML text extraction)
 *   - Website content (fetched as text)
 */

import { connectToDatabase } from '@/lib/mongodb'
import { generateEmbedding } from './embeddings'

// ============================================================
// Text chunking
// ============================================================

const CHUNK_SIZE = 500      // characters per chunk
const CHUNK_OVERLAP = 50    // overlap between chunks to preserve context

/**
 * Split text into overlapping chunks for embedding.
 * Uses sentence boundaries where possible to avoid mid-sentence splits.
 */
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (normalized.length <= chunkSize) return [normalized]

  const chunks: string[] = []
  let start = 0

  while (start < normalized.length) {
    let end = start + chunkSize

    if (end < normalized.length) {
      // Try to break at a sentence boundary ('. ', '! ', '? ', '\n\n')
      const sentenceEnd = normalized.lastIndexOf('. ', end)
      const paraEnd = normalized.lastIndexOf('\n\n', end)
      const breakAt = Math.max(sentenceEnd, paraEnd)
      if (breakAt > start + chunkSize * 0.5) {
        end = breakAt + 1 // include the period
      }
    }

    const chunk = normalized.slice(start, end).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    start = Math.max(start + 1, end - overlap)
  }

  return chunks
}

// ============================================================
// Core ingestion
// ============================================================

export interface IngestOptions {
  userId: string
  knowledgeBaseId: string
  content: string
  title?: string
}

/**
 * Chunk + embed + store a text document into knowledge_embeddings.
 * Updates the knowledge_base collection status on completion.
 *
 * Returns the number of chunks stored, or -1 on failure.
 */
export async function ingestText(options: IngestOptions): Promise<number> {
  const { userId, knowledgeBaseId, content } = options
  
  try {
    const { db } = await connectToDatabase()

    // Mark as processing
    await db.collection('knowledge_base').updateOne(
      { id: knowledgeBaseId },
      { $set: { status: 'processing', updated_at: new Date() } }
    )

    const chunks = chunkText(content)
    const provider = (process.env.AI_PROVIDER || 'nvidia').toLowerCase()
    const embeddingModel =
      process.env.NVIDIA_EMBEDDING_MODEL ||
      process.env.OPENAI_EMBEDDING_MODEL ||
      'nvidia/nv-embed-v2'

    let successCount = 0
    const rows: Array<{
      user_id: string
      knowledge_base_id: string
      content: string
      chunk_index: number
      embedding: number[] | null
      metadata: Record<string, unknown>
      created_at: Date
    }> = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = await generateEmbedding(chunk)
      rows.push({
        user_id: userId,
        knowledge_base_id: knowledgeBaseId,
        content: chunk,
        chunk_index: i,
        embedding,
        metadata: { provider, chunk_index: i, total_chunks: chunks.length },
        created_at: new Date(),
      })
      successCount++
    }

    // Delete existing embeddings (if re-ingesting)
    await db.collection('knowledge_embeddings').deleteMany({
      knowledge_base_id: knowledgeBaseId
    })

    // Batch insert chunks to MongoDB
    if (rows.length > 0) {
      await db.collection('knowledge_embeddings').insertMany(rows)
    }

    // Mark as ready
    await db.collection('knowledge_base').updateOne(
      { id: knowledgeBaseId },
      {
        $set: {
          status: 'ready',
          chunk_count: successCount,
          embedding_model: embeddingModel,
          updated_at: new Date(),
        }
      }
    )

    return successCount
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[AI/ingest] ingestText failed:', msg)
    try {
      const { db } = await connectToDatabase()
      await db.collection('knowledge_base').updateOne(
        { id: knowledgeBaseId },
        { $set: { status: 'failed', error_message: msg, updated_at: new Date() } }
      )
    } catch (dbErr) {
      console.error('[AI/ingest] Failed to update document failure status:', dbErr)
    }
    return -1
  }
}

// ============================================================
// Website content fetching
// ============================================================

/**
 * Fetch a URL and extract its text content for ingestion.
 * Strips HTML tags and normalizes whitespace.
 */
export async function fetchWebsiteContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'WaCRM-KnowledgeBot/1.0 (+https://wacrm.tech)',
      Accept: 'text/html,text/plain',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  // Strip HTML tags with a simple regex — good enough for basic content extraction
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()

  return text
}

// ============================================================
// Delete all embeddings for a document
// ============================================================

/**
 * Delete all embedding chunks for a knowledge_base document in MongoDB.
 * Called before re-ingesting or when the user deletes a document.
 */
export async function deleteDocumentEmbeddings(
  knowledgeBaseId: string
): Promise<void> {
  try {
    const { db } = await connectToDatabase()
    await db.collection('knowledge_embeddings').deleteMany({
      knowledge_base_id: knowledgeBaseId
    })
  } catch (error) {
    console.error('[AI/ingest] deleteDocumentEmbeddings failed:', error)
  }
}
