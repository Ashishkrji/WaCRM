/**
 * AI Content Planner
 * Generates SEO content calendar and article outlines using NVIDIA NIM.
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''
const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'
import { supabaseAdmin } from '@/lib/automations/admin-client'

export interface ContentIdea {
  title: string
  primary_keyword: string
  target_keywords: string[]
  content_type: string
  intent: string
  estimated_word_count: number
  target_publish_date?: string
  ai_outline?: string
  ai_brief?: string
}

// ─────────────────────────────────────────────
// Generate content calendar
// ─────────────────────────────────────────────

export async function generateContentCalendar(params: {
  projectId: string
  domain: string
  niche: string
  monthsAhead?: number
  articlesPerMonth?: number
}): Promise<ContentIdea[]> {
  const { domain, niche, monthsAhead = 3, articlesPerMonth = 4 } = params
  const total = monthsAhead * articlesPerMonth

  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{
          role: 'user',
          content: `Create a ${total}-article SEO content calendar for ${domain} (${niche} niche) targeting Indian audience.
Spread across ${monthsAhead} months. Return JSON array:
[{"title":"...","primary_keyword":"...","target_keywords":["kw1","kw2"],"content_type":"blog_post|guide|case_study|faq","intent":"informational|commercial","estimated_word_count":1500,"target_publish_date":"YYYY-MM-DD"}]`,
        }],
        temperature: 0.4,
        max_tokens: 3000,
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
// Generate article outline
// ─────────────────────────────────────────────

export async function generateArticleOutline(title: string, primaryKeyword: string, wordCount = 1500): Promise<string> {
  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{
          role: 'user',
          content: `Generate a detailed SEO article outline for: "${title}"
Primary keyword: ${primaryKeyword}
Target word count: ${wordCount}
Include: H2 sections, H3 subsections, key points per section, meta description suggestion, and intro/conclusion notes.`,
        }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  } catch {
    return ''
  }
}

// ─────────────────────────────────────────────
// Save content plan to DB
// ─────────────────────────────────────────────

export async function saveContentPlan(projectId: string, userId: string, ideas: ContentIdea[]): Promise<void> {
  const db = supabaseAdmin()
  const rows = ideas.map(idea => ({
    project_id: projectId,
    user_id: userId,
    title: idea.title,
    primary_keyword: idea.primary_keyword,
    target_keywords: idea.target_keywords,
    content_type: (idea.content_type ?? 'blog_post') as never,
    status: 'idea' as never,
    target_word_count: idea.estimated_word_count ?? 1000,
    target_publish_date: idea.target_publish_date ?? null,
    ai_outline: idea.ai_outline,
    ai_brief: idea.ai_brief,
  }))
  await db.from('seo_content_plan').insert(rows)
}
