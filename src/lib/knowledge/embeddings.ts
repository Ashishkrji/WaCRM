/**
 * NVIDIA NIM Embeddings Client
 * Generates vector embeddings for knowledge base articles and queries.
 * Uses MongoDB Atlas Vector Search for storage and retrieval.
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''
const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'
const EMBEDDING_MODEL = 'nvidia/nv-embedqa-e5-v5'

// ─────────────────────────────────────────────
// NVIDIA NIM Embedding
// ─────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const truncated = text.slice(0, 8192) // Token limit

  const res = await fetch(`${NVIDIA_API_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: [truncated],
      input_type: 'passage',
      encoding_format: 'float',
      truncate: 'END',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`NVIDIA embedding failed: ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const res = await fetch(`${NVIDIA_API_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: [query],
      input_type: 'query',
      encoding_format: 'float',
      truncate: 'END',
    }),
  })

  if (!res.ok) throw new Error(`NVIDIA query embedding failed: ${await res.text()}`)
  const data = await res.json()
  return data.data[0].embedding as number[]
}

// ─────────────────────────────────────────────
// Cosine Similarity (for in-memory comparison)
// ─────────────────────────────────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

// ─────────────────────────────────────────────
// MongoDB Atlas Vector Search client
// ─────────────────────────────────────────────

export interface KBDocument {
  _id?: string
  article_id: string
  user_id: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  category: string
  embedding: number[]
  created_at: string
  updated_at: string
}

export interface SearchResult {
  article_id: string
  title: string
  excerpt: string
  score: number
  tags: string[]
  category: string
}

/**
 * Store article embedding in MongoDB Atlas.
 * Falls back gracefully if MongoDB connection unavailable.
 */
export async function storeArticleEmbedding(doc: Omit<KBDocument, '_id'>): Promise<string | null> {
  const MONGODB_API_URL = process.env.MONGODB_API_URL
  const MONGODB_API_KEY = process.env.MONGODB_API_KEY

  if (!MONGODB_API_URL || !MONGODB_API_KEY) {
    console.warn('[embeddings] MongoDB not configured, skipping vector store')
    return null
  }

  try {
    const res = await fetch(`${MONGODB_API_URL}/action/insertOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_API_KEY,
      },
      body: JSON.stringify({
        collection: 'knowledge_embeddings',
        database: 'wacrm',
        dataSource: 'WaCRM',
        document: doc,
      }),
    })

    if (!res.ok) return null
    const d = await res.json()
    return d.insertedId ?? null
  } catch {
    return null
  }
}

/**
 * Semantic search using MongoDB Atlas Vector Search.
 * Falls back to keyword search if vector search unavailable.
 */
export async function vectorSearch(
  query: string,
  userId: string,
  limit = 5,
): Promise<SearchResult[]> {
  const MONGODB_API_URL = process.env.MONGODB_API_URL
  const MONGODB_API_KEY = process.env.MONGODB_API_KEY

  if (!MONGODB_API_URL || !MONGODB_API_KEY) {
    return [] // Return empty — will fall back to Supabase FTS
  }

  try {
    const queryEmbedding = await generateQueryEmbedding(query)

    const res = await fetch(`${MONGODB_API_URL}/action/aggregate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_API_KEY,
      },
      body: JSON.stringify({
        collection: 'knowledge_embeddings',
        database: 'wacrm',
        dataSource: 'WaCRM',
        pipeline: [
          {
            $vectorSearch: {
              index: 'knowledge_vector_index',
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: 50,
              limit,
              filter: { user_id: userId },
            },
          },
          {
            $project: {
              article_id: 1,
              title: 1,
              excerpt: 1,
              tags: 1,
              category: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ],
      }),
    })

    if (!res.ok) return []
    const d = await res.json()
    return (d.documents ?? []).map((doc: Record<string, unknown>) => ({
      article_id: String(doc.article_id),
      title: String(doc.title),
      excerpt: String(doc.excerpt ?? ''),
      score: Number(doc.score),
      tags: Array.isArray(doc.tags) ? doc.tags as string[] : [],
      category: String(doc.category ?? ''),
    }))
  } catch {
    return []
  }
}
