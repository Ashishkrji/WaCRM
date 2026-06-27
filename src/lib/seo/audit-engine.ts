/**
 * SEO Audit Engine
 * AI-powered on-page SEO analysis using NVIDIA NIM.
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''
const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'

export interface SEOIssue {
  type: string
  severity: 'critical' | 'warning' | 'info'
  description: string
  recommendation: string
  impact: number    // 0-100
}

export interface SEOAuditResult {
  url: string
  overall_score: number
  issues: SEOIssue[]
  passed: string[]
  warnings: string[]
  meta: {
    title_length?: number
    description_length?: number
    h1_count?: number
    word_count?: number
    load_time_ms?: number
    mobile_friendly?: boolean
    has_ssl?: boolean
    has_sitemap?: boolean
    has_robots?: boolean
    canonical_url?: string
    og_tags?: Record<string, string>
  }
  ai_summary: string
  ai_recommendations: string[]
}

// ─────────────────────────────────────────────
// On-page SEO check (from URL metadata)
// ─────────────────────────────────────────────

export async function auditURL(url: string, content?: string): Promise<SEOAuditResult> {
  const issues: SEOIssue[] = []
  const passed: string[] = []
  const warnings: string[] = []
  const meta: SEOAuditResult['meta'] = {}

  // Basic checks
  if (url.startsWith('https://')) {
    passed.push('SSL/HTTPS enabled')
    meta.has_ssl = true
  } else {
    issues.push({ type: 'ssl', severity: 'critical', description: 'Site not using HTTPS', recommendation: 'Enable SSL certificate immediately', impact: 90 })
    meta.has_ssl = false
  }

  // Content checks if available
  if (content) {
    const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i)
    const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    const h1Match = content.match(/<h1[^>]*>/gi)
    const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length

    meta.word_count = wordCount
    meta.h1_count = h1Match?.length ?? 0

    if (titleMatch) {
      const titleLen = titleMatch[1].length
      meta.title_length = titleLen
      if (titleLen < 30) issues.push({ type: 'title_too_short', severity: 'warning', description: `Title tag is too short (${titleLen} chars)`, recommendation: 'Write a title between 50-60 characters', impact: 60 })
      else if (titleLen > 60) issues.push({ type: 'title_too_long', severity: 'warning', description: `Title tag too long (${titleLen} chars)`, recommendation: 'Keep title under 60 characters', impact: 50 })
      else passed.push('Title length is optimal')
    } else {
      issues.push({ type: 'missing_title', severity: 'critical', description: 'Missing title tag', recommendation: 'Add a unique, descriptive title tag', impact: 95 })
    }

    if (descMatch) {
      const descLen = descMatch[1].length
      meta.description_length = descLen
      if (descLen < 120) warnings.push('Meta description is short (< 120 chars)')
      else if (descLen > 160) warnings.push('Meta description too long (> 160 chars)')
      else passed.push('Meta description length is optimal')
    } else {
      issues.push({ type: 'missing_meta_desc', severity: 'warning', description: 'Missing meta description', recommendation: 'Add a compelling meta description (120-160 chars)', impact: 70 })
    }

    if (!meta.h1_count || meta.h1_count === 0) {
      issues.push({ type: 'missing_h1', severity: 'critical', description: 'No H1 tag found', recommendation: 'Add exactly one H1 tag with your primary keyword', impact: 85 })
    } else if (meta.h1_count > 1) {
      warnings.push(`Multiple H1 tags found (${meta.h1_count}) — use only one`)
    } else {
      passed.push('Single H1 tag present')
    }

    if (wordCount < 300) {
      issues.push({ type: 'thin_content', severity: 'warning', description: `Thin content (${wordCount} words)`, recommendation: 'Expand content to at least 300 words for better rankings', impact: 65 })
    } else {
      passed.push(`Good content length (${wordCount} words)`)
    }
  }

  // Calculate score
  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const overallScore = Math.max(0, 100 - (criticalCount * 25) - (warningCount * 10))

  // AI recommendations
  const aiSummary = await generateAISummary(url, issues, overallScore)

  return {
    url,
    overall_score: overallScore,
    issues,
    passed,
    warnings,
    meta,
    ai_summary: aiSummary.summary,
    ai_recommendations: aiSummary.recommendations,
  }
}

async function generateAISummary(url: string, issues: SEOIssue[], score: number): Promise<{ summary: string; recommendations: string[] }> {
  try {
    const issueText = issues.slice(0, 5).map(i => `- ${i.type}: ${i.description}`).join('\n')
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{
          role: 'user',
          content: `SEO audit for ${url} scored ${score}/100. Issues:\n${issueText}\n\nProvide JSON: {"summary":"2 sentence summary","recommendations":["action1","action2","action3"]}`
        }],
        temperature: 0.2,
        max_tokens: 300,
      }),
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: '', recommendations: [] }
  } catch {
    return { summary: `SEO audit complete. Score: ${score}/100.`, recommendations: [] }
  }
}
