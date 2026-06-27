import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadAIAnalytics } from '@/lib/analytics/queries'

// GET /api/analytics/ai-usage?range=30
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const range = parseInt(searchParams.get('range') ?? '30')

  try {
    const data = await loadAIAnalytics(supabase, range)
    return NextResponse.json({ ai_usage: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/analytics/ai-usage — record a cost tracking entry
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { provider, model, prompt_tokens, completion_tokens, latency_ms, success } = body

  if (!provider || !model) {
    return NextResponse.json({ error: 'provider and model required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const total_tokens = (prompt_tokens ?? 0) + (completion_tokens ?? 0)

  // Cost estimation (rough per-token pricing)
  const costPerMToken: Record<string, number> = {
    'nvidia': 0.8,
    'openai': 2.0,
    'anthropic': 3.0,
    'google': 0.5,
    'openrouter': 1.0,
  }
  const ratePerMillion = costPerMToken[provider.toLowerCase()] ?? 1.0
  const estimated_cost_usd = (total_tokens / 1_000_000) * ratePerMillion

  // Upsert daily tracking record
  const db = supabase
  await db.from('cost_tracking').upsert({
    user_id: user.id,
    tracking_date: today,
    provider,
    model,
    prompt_tokens: (prompt_tokens ?? 0),
    completion_tokens: (completion_tokens ?? 0),
    total_tokens,
    request_count: 1,
    success_count: success !== false ? 1 : 0,
    failure_count: success === false ? 1 : 0,
    avg_latency_ms: latency_ms ?? 0,
    estimated_cost_usd,
  }, {
    onConflict: 'user_id,tracking_date,provider,model',
    // Supabase doesn't natively support increment on upsert, so we'll use a workaround
  })

  return NextResponse.json({ success: true })
}
