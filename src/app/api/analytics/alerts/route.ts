import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'

// GET /api/analytics/alerts — list alert rules + recent events
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const [alertsRes, eventsRes] = await Promise.all([
    db.from('analytics_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    db.from('analytics_alert_events').select('*').eq('user_id', user.id).eq('is_acknowledged', false).order('created_at', { ascending: false }).limit(20),
  ])

  return NextResponse.json({
    alerts: alertsRes.data ?? [],
    events: eventsRes.data ?? [],
  })
}

// POST /api/analytics/alerts — create alert rule
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { name, metric, operator, threshold, severity = 'warning', channels = ['dashboard'], cooldown_minutes = 60 } = body
  if (!name || !metric || !operator || threshold === undefined) {
    return NextResponse.json({ error: 'name, metric, operator, threshold required' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('analytics_alerts')
    .insert({ user_id: user.id, name, metric, operator, threshold, severity, channels, cooldown_minutes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert: data }, { status: 201 })
}

// PATCH /api/analytics/alerts — acknowledge alert events
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { event_ids } = body ?? {}

  if (!Array.isArray(event_ids)) {
    return NextResponse.json({ error: 'event_ids array required' }, { status: 400 })
  }

  const db = supabaseAdmin()
  await db
    .from('analytics_alert_events')
    .update({ is_acknowledged: true, acknowledged_at: new Date().toISOString(), acknowledged_by: user.id })
    .in('id', event_ids)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
