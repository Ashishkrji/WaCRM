/**
 * SEO Keyword Tracker
 * SERP rank checking and keyword opportunity finder.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''
const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'

export interface KeywordOpportunity {
  keyword: string
  estimated_volume: number
  difficulty: number
  opportunity_score: number
  intent: string
  rationale: string
}

// ─────────────────────────────────────────────
// AI-powered keyword opportunities
// ─────────────────────────────────────────────

export async function findKeywordOpportunities(
  domain: string,
  niche: string,
  count = 10,
): Promise<KeywordOpportunity[]> {
  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{
          role: 'user',
          content: `Generate ${count} SEO keyword opportunities for a ${niche} business website (${domain}) targeting Indian market.
Return JSON array: [{"keyword":"...","estimated_volume":1000,"difficulty":45,"opportunity_score":78,"intent":"commercial","rationale":"..."}]
Focus on low-competition, high-intent keywords with good search volume in India.`,
        }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '[]'
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : []
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// Save rank check result
// ─────────────────────────────────────────────

export async function recordRankCheck(params: {
  keywordId: string
  userId: string
  rank: number | null
  url?: string
  searchVolume?: number
}): Promise<void> {
  const db = supabaseAdmin()

  await db.from('seo_rank_history').insert({
    keyword_id: params.keywordId,
    user_id: params.userId,
    rank: params.rank,
    url: params.url,
    search_volume: params.searchVolume,
    check_date: new Date().toISOString().split('T')[0],
  })

  // Update keyword current rank
  const { data: kw } = await db.from('seo_keywords').select('current_rank, best_rank').eq('id', params.keywordId).single()
  const bestRank = params.rank
    ? kw?.best_rank ? Math.min(kw.best_rank, params.rank) : params.rank
    : kw?.best_rank

  await db.from('seo_keywords').update({
    previous_rank: kw?.current_rank,
    current_rank: params.rank,
    best_rank: bestRank,
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', params.keywordId)
}

// ─────────────────────────────────────────────
// Keyword stats summary
// ─────────────────────────────────────────────

export async function getKeywordStats(projectId: string) {
  const db = supabaseAdmin()
  const { data: keywords } = await db.from('seo_keywords').select('*').eq('project_id', projectId).eq('is_tracked', true)
  const kws = keywords ?? []

  const improved = kws.filter(k => k.current_rank && k.previous_rank && k.current_rank < k.previous_rank).length
  const declined = kws.filter(k => k.current_rank && k.previous_rank && k.current_rank > k.previous_rank).length
  const top10 = kws.filter(k => k.current_rank && k.current_rank <= 10).length
  const top100 = kws.filter(k => k.current_rank && k.current_rank <= 100).length
  const avgRank = kws.filter(k => k.current_rank).reduce((s, k) => s + (k.current_rank ?? 0), 0) / (kws.filter(k => k.current_rank).length || 1)

  return { total: kws.length, improved, declined, top10, top100, avg_rank: Math.round(avgRank) }
}
