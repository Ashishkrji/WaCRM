/**
 * Knowledge Base — Embedding generation and vector search.
 *
 * Provides two primary operations:
 *   1. generateEmbedding(text) — calls the active AI provider's embed() method
 *   2. searchKnowledge(userId, queryText, options) — RAG vector similarity search using MongoDB Atlas
 */

import { knowledgeRepo, aiDataRepo } from '@/repositories'
import { tryGetAIProvider } from '../ai/orchestrator'
import type { KnowledgeChunk } from '../ai/types'

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
  /** Filter by category, e.g. 'Pricing', 'Services' */
  category?: string
  /** Filter by tags */
  tags?: string[]
}

interface CacheEntry {
  chunks: KnowledgeChunk[]
  timestamp: number
}

const ragCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60000 // 1 minute cache TTL

/**
 * Search the knowledge base for chunks semantically and keyword similar to queryText.
 * Uses MongoDB Atlas Hybrid Vector & Keyword Search via the Database Service Layer.
 */
export async function searchKnowledge(
  userId: string,
  queryText: string,
  options: SearchOptions = {}
): Promise<KnowledgeChunk[]> {
  const threshold = options.threshold ?? 0.7
  const topK = options.topK ?? 5
  const category = options.category
  const tags = options.tags || []

  // Check in-memory cache first
  const cacheKey = `${userId}:${queryText}:${category || ''}:${tags.join(',')}:${topK}`
  const cached = ragCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[RAGCache] Cache hit for:', queryText)
    return cached.chunks
  }

  const startTime = performance.now()

  // Generate query embedding
  const embedding = await generateEmbedding(queryText)
  if (!embedding || embedding.length === 0) {
    return []
  }

  try {
    // Search using MongoDB Atlas via dbService
    const results = await knowledgeRepo.hybridSearchKnowledge(
      userId,
      embedding,
      queryText,
      { category, tags },
      topK
    )

    if (!results || results.length === 0) {
      // Log failed search
      const latencyMs = Math.round(performance.now() - startTime)
      void aiDataRepo.logKnowledgeSearch(userId, queryText, 0, latencyMs, false)
        .catch(err => console.warn('[AI/embeddings] logSearch failed:', err))
      return []
    }

    // Fetch source titles for context
    const kbIds = [...new Set(results.map(r => r.knowledge_base_id))]
    const kbDocs = await aiDataRepo.getKnowledgeDocTitles(kbIds)

    const titleMap = new Map<string, string>(
      kbDocs.map(d => [d.id, d.title])
    )

    const processedResults = results
      .filter(row => row.similarity >= threshold)
      .map(row => ({
        id: row._id.toString(),
        content: row.content,
        source: titleMap.get(row.knowledge_base_id) ?? 'Knowledge Base',
        similarity: row.similarity,
      }))

    const latencyMs = Math.round(performance.now() - startTime)
    const success = processedResults.length > 0

    // Log search analytics asynchronously
    void aiDataRepo.logKnowledgeSearch(userId, queryText, processedResults.length, latencyMs, success)
      .catch(err => console.warn('[AI/embeddings] logSearch failed:', err))

    // Log chunk usage statistics
    processedResults.forEach(row => {
      void aiDataRepo.logKnowledgeUsage(userId, row.id)
        .catch(err => console.warn('[AI/embeddings] logUsage failed:', err))
    })

    // Update Cache
    ragCache.set(cacheKey, {
      chunks: processedResults,
      timestamp: Date.now(),
    })

    return processedResults
  } catch (err) {
    console.error('[AI/embeddings] searchKnowledge Atlas Search failed:', err)
    const latencyMs = Math.round(performance.now() - startTime)
    void aiDataRepo.logKnowledgeSearch(userId, queryText, 0, latencyMs, false)
      .catch(e => console.warn('[AI/embeddings] logSearch failed:', e))
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
