/**
 * Lead Scoring Engine (Part 18)
 * ML-style scoring with behavioral signals and NVIDIA AI predictions.
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'

const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''

const GRADE_MAP = (score: number) => {
  if (score >= 90) return 'A+'
  if (score >= 75) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
}

// ─────────────────────────────────────────────
// Score a single contact
// ─────────────────────────────────────────────

export async function scoreContact(userId: string, contactId: string): Promise<Record<string, unknown>> {
  const db = supabaseAdmin()

  // Get contact data
  const { data: contact } = await db.from('contacts').select('*').eq('id', contactId).single()
  if (!contact) throw new Error('Contact not found')

  // Get scoring rules
  const { data: rules } = await db.from('scoring_rules').select('*').eq('user_id', userId).eq('is_active', true)

  // Get behavioral signals (last 30 days)
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { data: signals } = await db.from('lead_signals').select('signal_type, signal_value').eq('contact_id', contactId).gte('occurred_at', since)

  let behavioralScore = 0
  let demographicScore = 0

  // Apply rules
  for (const rule of rules ?? []) {
    if (rule.rule_type === 'behavioral') {
      const matchingSignals = (signals ?? []).filter(s => s.signal_type === rule.condition_value)
      behavioralScore += matchingSignals.length * rule.score_points
    } else if (rule.rule_type === 'demographic') {
      const val = contact[rule.condition_field as keyof typeof contact]
      if (rule.condition_operator === 'exists' && val) demographicScore += rule.score_points
      else if (rule.condition_operator === 'equals' && val === rule.condition_value) demographicScore += rule.score_points
    }
  }

  // Engagement score (recent signals)
  const engagementScore = Math.min(30, (signals ?? []).length * 3)

  const totalScore = Math.min(100, behavioralScore + demographicScore + engagementScore)
  const grade = GRADE_MAP(totalScore)
  const isMQL = totalScore >= 50
  const isSQL = totalScore >= 75

  // AI conversion probability
  const convProb = await predictConversion(contact, totalScore, signals ?? [])

  // Upsert score
  const { data: score } = await db.from('lead_scores').upsert({
    user_id: userId,
    contact_id: contactId,
    total_score: totalScore,
    demographic_score: demographicScore,
    behavioral_score: behavioralScore,
    engagement_score: engagementScore,
    score_grade: grade,
    is_mql: isMQL,
    is_sql: isSQL,
    conversion_probability: convProb,
    last_scored_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,contact_id' }).select().single()

  return score as Record<string, unknown>
}

// ─────────────────────────────────────────────
// AI conversion prediction
// ─────────────────────────────────────────────

async function predictConversion(contact: Record<string, unknown>, score: number, signals: Array<{ signal_type: string }>): Promise<number> {
  try {
    const signalSummary = Object.entries(
      signals.reduce((acc, s) => { acc[s.signal_type] = (acc[s.signal_type] ?? 0) + 1; return acc }, {} as Record<string, number>)
    ).map(([k, v]) => `${k}: ${v}`).join(', ')

    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{
          role: 'user',
          content: `Lead scoring analysis. Lead score: ${score}/100. Contact: ${contact.name}, ${contact.company ?? 'No company'}, ${contact.phone ? 'Has phone' : 'No phone'}. Recent signals (30 days): ${signalSummary || 'none'}. 
Respond with JSON only: {"conversion_probability": 45, "reasoning": "brief 1-line reason"}`,
        }],
        temperature: 0.1,
        max_tokens: 80,
      }),
    })
    if (!res.ok) return score * 0.7 // fallback
    const d = await res.json()
    const content = d.choices?.[0]?.message?.content ?? '{}'
    const json = content.match(/\{[\s\S]*\}/)
    return json ? (JSON.parse(json[0]).conversion_probability ?? score * 0.7) : score * 0.7
  } catch {
    return score * 0.7
  }
}

// ─────────────────────────────────────────────
// Record behavioral signal
// ─────────────────────────────────────────────

export async function recordSignal(params: {
  userId: string
  contactId: string
  signalType: string
  signalValue?: number
  source?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const db = supabaseAdmin()
  await db.from('lead_signals').insert({
    user_id: params.userId,
    contact_id: params.contactId,
    signal_type: params.signalType,
    signal_value: params.signalValue ?? 1,
    source: params.source,
    metadata: params.metadata ?? {},
  })
}

// ─────────────────────────────────────────────
// Get top leads
// ─────────────────────────────────────────────

export async function getTopLeads(userId: string, limit = 20) {
  const db = supabaseAdmin()
  const { data } = await db
    .from('lead_scores')
    .select('*, contacts(name, phone, company, email)')
    .eq('user_id', userId)
    .order('total_score', { ascending: false })
    .limit(limit)
  return data ?? []
}
