/**
 * Knowledge Base — Embedding generation and vector search.
 *
 * Provides two primary operations:
 *   1. generateEmbedding(text) — calls the active AI provider's embed() method
 *   2. searchKnowledge(userId, queryText, options) — RAG vector similarity search using MongoDB Atlas
 */

import { connectToDatabase } from '@/lib/mongodb'
import { tryGetAIProvider } from '../provider-factory'
import type { KnowledgeChunk } from '../types'

// ============================================================
// Embedding generation
// ============================================================

/**
 * Generate a vector embedding for the given text using the active AI provider.
 * Returns null if the provider is unavailable (no API key set).
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const provider = tryGetAIProvider()
  if (!provider) return null

  try {
    return await provider.embed(text)
  } catch (err) {
    console.error('[AI/embeddings] generateEmbedding failed:', err)
    return null
  }
}

// ============================================================
// Vector search
// ============================================================

export interface SearchOptions {
  /** Minimum cosine similarity score (0–1). Default: 0.7 */
  threshold?: number
  /** Maximum number of chunks to return. Default: 5 */
  topK?: number
}

/**
 * Search the knowledge base for chunks semantically similar to queryText.
 * Uses MongoDB Atlas Vector Search.
 *
 * Returns an empty array if:
 *   - The AI provider is not configured (no API key)
 *   - The user has no knowledge base documents
 *   - No chunks exceed the similarity threshold
 */
export async function searchKnowledge(
  userId: string,
  queryText: string,
  options: SearchOptions = {}
): Promise<KnowledgeChunk[]> {
  const threshold = options.threshold ?? 0.7
  const topK = options.topK ?? 5

  // Generate query embedding
  const embedding = await generateEmbedding(queryText)
  if (!embedding || embedding.length === 0) {
    return []
  }

  try {
    const { db } = await connectToDatabase()

    // Query MongoDB Atlas using the $vectorSearch aggregation stage
    const results = await db.collection('knowledge_embeddings').aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100,
          limit: topK,
          filter: {
            user_id: userId
          }
        }
      },
      {
        $project: {
          _id: 1,
          knowledge_base_id: 1,
          content: 1,
          similarity: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray()

    if (!results || results.length === 0) return []

    // Fetch source titles for context
    const kbIds = [...new Set(results.map(r => r.knowledge_base_id))]
    const kbDocs = await db.collection('knowledge_base')
      .find({ id: { $in: kbIds } })
      .project({ id: 1, title: 1 })
      .toArray()

    const titleMap = new Map<string, string>(
      kbDocs.map(d => [d.id, d.title])
    )

    return results
      .filter(row => row.similarity >= threshold)
      .map(row => ({
        id: row._id.toString(),
        content: row.content,
        source: titleMap.get(row.knowledge_base_id) ?? 'Knowledge Base',
        similarity: row.similarity,
      }))
  } catch (err) {
    console.error('[AI/embeddings] searchKnowledge Atlas Vector Search failed:', err)
    return []
  }
}

// ============================================================
// Format knowledge chunks for injection into an AI prompt
// ============================================================

/**
 * Format retrieved knowledge chunks into a string suitable for
 * injection into an AI system prompt as context.
 */
export function formatKnowledgeForPrompt(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return ''

  const formatted = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.source} (relevance: ${(c.similarity * 100).toFixed(0)}%)]\n${c.content}`
    )
    .join('\n\n')

  return `--- RELEVANT KNOWLEDGE BASE CONTEXT ---\n${formatted}\n--- END CONTEXT ---`
}
