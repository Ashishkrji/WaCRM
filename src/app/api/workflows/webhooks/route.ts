import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { processIncomingWebhook } from '@/lib/workflows/webhook-manager'

// GET /api/workflows/webhooks — list webhooks
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('workflow_webhooks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ webhooks: data ?? [] })
}

// POST /api/workflows/webhooks — create webhook
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { name, direction, workflow_id, target_url, secret, headers, endpoint_slug } = body
  if (!name || !direction) {
    return NextResponse.json({ error: 'name and direction required' }, { status: 400 })
  }

  // Auto-generate slug for incoming webhooks
  const slug = direction === 'incoming'
    ? (endpoint_slug ?? `wh-${Math.random().toString(36).slice(2, 10)}`)
    : null

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('workflow_webhooks')
    .insert({
      user_id: user.id,
      name,
      direction,
      workflow_id: workflow_id ?? null,
      target_url: target_url ?? null,
      secret: secret ?? null,
      headers: headers ?? {},
      endpoint_slug: slug,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ webhook: data }, { status: 201 })
}
