/**
 * Knowledge Base Vector Search
 * Hybrid search: vector similarity + Supabase full-text search fallback.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import { searchKnowledge, generateEmbedding } from './embeddings'
import { knowledgeRepo } from '@/repositories'

export interface KBSearchResult {
  id: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  category_id: string | null
  article_type: string
  score: number
  source: 'vector' | 'fulltext'
}

// ─────────────────────────────────────────────
// Vector Search Helper
// ─────────────────────────────────────────────

async function vectorSearch(
  query: string,
  userId: string,
  limit: number
): Promise<Array<{ article_id: string; title: string; excerpt: string; tags: string[]; score: number }>> {
  try {
    const embedding = await generateEmbedding(query)
    if (!embedding || embedding.length === 0) return []

    const results = await knowledgeRepo.hybridSearchKnowledge(userId, embedding, query, {}, limit)
    return results.map(r => ({
      article_id: r.knowledge_base_id,
      title: '',
      excerpt: '',
      tags: r.tags || [],
      score: r.similarity,
    }))
  } catch (err) {
    console.error('[kb] vectorSearch helper failed:', err)
    return []
  }
}

// ─────────────────────────────────────────────
// Hybrid Search
// ─────────────────────────────────────────────

export async function searchKnowledgeBase(
  query: string,
  userId: string,
  limit = 5,
  categorySlug?: string,
): Promise<KBSearchResult[]> {
  // Try vector search first
  const vectorResults = await vectorSearch(query, userId, limit)

  if (vectorResults.length >= limit) {
    // Enrich with full content from Supabase
    const articleIds = vectorResults.map(r => r.article_id)
    const db = supabaseAdmin()
    const { data: articles } = await db
      .from('knowledge_articles')
      .select('id, title, excerpt, content, tags, category_id, article_type')
      .in('id', articleIds)
      .eq('status', 'published')

    const articleMap = new Map((articles ?? []).map(a => [a.id, a]))

    return vectorResults.map(r => {
      const article = articleMap.get(r.article_id)
      return {
        id: r.article_id,
        title: article?.title ?? r.title,
        excerpt: article?.excerpt ?? r.excerpt,
        content: article?.content ?? '',
        tags: article?.tags ?? r.tags,
        category_id: article?.category_id ?? null,
        article_type: article?.article_type ?? 'article',
        score: r.score,
        source: 'vector' as const,
      }
    })
  }

  // Fallback: Supabase full-text search
  return fullTextSearch(query, userId, limit, categorySlug)
}

async function fullTextSearch(query: string, userId: string, limit: number, categorySlug?: string): Promise<KBSearchResult[]> {
  const db = supabaseAdmin()
  let q = db
    .from('knowledge_articles')
    .select('id, title, excerpt, content, tags, category_id, article_type')
    .eq('user_id', userId)
    .eq('status', 'published')
    .textSearch('title', query, { type: 'websearch' })
    .limit(limit)

  if (categorySlug) {
    const { data: cat } = await db.from('knowledge_categories').select('id').eq('user_id', userId).eq('slug', categorySlug).single()
    if (cat) q = q.eq('category_id', cat.id)
  }

  const { data } = await q
  return (data ?? []).map(a => ({ ...a, score: 0.5, source: 'fulltext' as const }))
}

// ─────────────────────────────────────────────
// Index an article
// ─────────────────────────────────────────────

export async function indexArticle(articleId: string, userId: string): Promise<void> {
  const db = supabaseAdmin()
  const { data: article } = await db
    .from('knowledge_articles')
    .select('id, title, content, excerpt, tags, category_id')
    .eq('id', articleId)
    .single()

  if (!article) return

  // Fetch category name
  const { data: cat } = article.category_id
    ? await db.from('knowledge_categories').select('name').eq('id', article.category_id).single()
    : { data: null }

  try {
    const embedding = await generateEmbedding(`${article.title}\n\n${article.content}`)
    const row = {
      knowledge_base_id: articleId,
      user_id: userId,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt ?? '',
      tags: article.tags ?? [],
      category: cat?.name ?? '',
      embedding,
      created_at: new Date(),
      updated_at: new Date(),
    }
    await knowledgeRepo.insertKnowledgeEmbeddings([row])

    await db
      .from('knowledge_articles')
      .update({ embedding_id: 'synced', embedding_synced_at: new Date().toISOString() })
      .eq('id', articleId)
  } catch (err) {
    console.error('[kb] indexing failed:', err)
  }
}

// ─────────────────────────────────────────────
// Log search + update article stats
// ─────────────────────────────────────────────

export async function logSearch(params: {
  userId: string
  query: string
  results: KBSearchResult[]
  agentType?: string
  contactId?: string
}): Promise<void> {
  const db = supabaseAdmin()
  const topResult = params.results[0]

  await db.from('knowledge_search_logs').insert({
    user_id: params.userId,
    query: params.query,
    results_count: params.results.length,
    top_article_id: topResult?.id ?? null,
    similarity_score: topResult?.score ?? null,
    agent_type: params.agentType,
    contact_id: params.contactId,
  })

  // Increment search hit count on top article
  if (topResult?.id) {
    try {
      const { error } = await db.rpc('increment_kb_search_hit', { article_id: topResult.id })
      if (error) throw error
    } catch {
      // Fallback: Fetch current value and increment
      const { data } = await db.from('knowledge_articles').select('search_hit_count').eq('id', topResult.id).single()
      const currentCount = data?.search_hit_count ?? 0
      await db.from('knowledge_articles')
        .update({ search_hit_count: currentCount + 1 })
        .eq('id', topResult.id)
    }
  }
}

