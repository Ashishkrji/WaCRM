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

import { knowledgeRepo, aiDataRepo } from '@/repositories'
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
  category?: string
  tags?: string[]
  sourceUrl?: string | null
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
    // Mark as processing via dbService
    await aiDataRepo.updateKnowledgeDoc(knowledgeBaseId, {
      status: 'processing',
    })

    const chunks = chunkText(content)
    const provider = (process.env.AI_PROVIDER || 'nvidia').toLowerCase()
    const embeddingModel =
      process.env.NVIDIA_EMBEDDING_MODEL ||
      process.env.OPENAI_EMBEDDING_MODEL ||
      'nvidia/nv-embed-v2'

    const category = options.category || 'General'
    const tags = options.tags || []
    const sourceUrl = options.sourceUrl || null

    let successCount = 0
    const rows: Array<{
      user_id: string
      knowledge_base_id: string
      content: string
      chunk_index: number
      embedding: number[] | null
      category: string
      tags: string[]
      source_url: string | null
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
        category,
        tags,
        source_url: sourceUrl,
        metadata: { provider, chunk_index: i, total_chunks: chunks.length },
        created_at: new Date(),
      })
      successCount++
    }

    // Delete existing embeddings via dbService
    await knowledgeRepo.deleteKnowledgeEmbeddings(knowledgeBaseId)

    // Batch insert chunks to MongoDB via dbService
    if (rows.length > 0) {
      await knowledgeRepo.insertKnowledgeEmbeddings(rows)
    }

    // Mark as ready via dbService
    await aiDataRepo.updateKnowledgeDoc(knowledgeBaseId, {
      status: 'ready',
      chunk_count: successCount,
      embedding_model: embeddingModel,
    })

    return successCount
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[AI/ingest] ingestText failed:', msg)
    try {
      await aiDataRepo.updateKnowledgeDoc(knowledgeBaseId, {
        status: 'failed',
        error_message: msg,
      })
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
      'User-Agent': 'MJChatSyncs-KnowledgeBot/1.0 (+https://MJChatSyncs.tech)',
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
    await knowledgeRepo.deleteKnowledgeEmbeddings(knowledgeBaseId)
  } catch (error) {
    console.error('[AI/ingest] deleteDocumentEmbeddings failed:', error)
  }
}

/**
 * Recursively crawl a website starting at startUrl up to maxDepth and maxPages.
 * Extracts title, clean text content, and returns an array of page objects.
 */
export async function crawlWebsite(
  startUrl: string,
  maxDepth = 1,
  maxPages = 10
): Promise<Array<{ url: string; content: string; title: string }>> {
  const pages: Array<{ url: string; content: string; title: string }> = []
  const visited = new Set<string>()
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 1 }]

  let parsedStartUrl: URL
  try {
    parsedStartUrl = new URL(startUrl)
  } catch {
    throw new Error(`Invalid start URL: ${startUrl}`)
  }

  const hostname = parsedStartUrl.hostname

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift()!
    
    // Normalize URL by removing hash fragment
    let urlToFetch = current.url
    try {
      const u = new URL(urlToFetch)
      u.hash = ''
      urlToFetch = u.toString()
    } catch {
      continue
    }

    if (visited.has(urlToFetch)) continue
    visited.add(urlToFetch)

    try {
      console.log(`[Crawler] Fetching: ${urlToFetch} at depth ${current.depth}`)
      const res = await fetch(urlToFetch, {
        headers: {
          'User-Agent': 'MJChatSyncs-KnowledgeBot/1.0 (+https://MJChatSyncs.tech)',
          Accept: 'text/html,text/plain',
        },
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) continue
      const html = await res.text()

      // Extract Title
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : 'Scraped Page'

      // Extract Clean Text
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

      if (text.length > 0) {
        pages.push({ url: urlToFetch, content: text, title })
      }

      // If we haven't reached maxDepth, extract and queue links
      if (current.depth < maxDepth) {
        const linkMatches = html.matchAll(/href="([^"]+)"/gi)
        for (const match of linkMatches) {
          const href = match[1]
          try {
            const absoluteUrl = new URL(href, urlToFetch)
            // Only crawl same domain and http/https schemes
            if (
              absoluteUrl.hostname === hostname &&
              ['http:', 'https:'].includes(absoluteUrl.protocol)
            ) {
              const cleanedUrl = absoluteUrl.toString().split('#')[0]
              if (!visited.has(cleanedUrl) && !queue.some(q => q.url === cleanedUrl)) {
                queue.push({ url: cleanedUrl, depth: current.depth + 1 })
              }
            }
          } catch {
            // skip invalid URLs
          }
        }
      }
    } catch (err) {
      console.warn(`[Crawler] Failed to fetch ${urlToFetch}:`, err)
    }
  }

  return pages
}
