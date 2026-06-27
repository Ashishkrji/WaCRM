import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithAgent } from '@/lib/ai/agent-builder'
import { supabaseAdmin } from '@/lib/automations/admin-client'

// GET /api/ai/npc-agents/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = supabaseAdmin()
  const { data: agent } = await db.from('ai_agents').select('*, agent_intents(*)').eq('id', id).eq('user_id', user.id).single()
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: sessions } = await db.from('agent_sessions').select('status').eq('agent_id', id)
  const total = sessions?.length ?? 0
  const resolved = sessions?.filter(s => s.status === 'resolved').length ?? 0

  return NextResponse.json({ agent, stats: { total_sessions: total, resolved, resolution_rate: total > 0 ? Math.round((resolved / total) * 100) : 0 } })
}

// PATCH /api/ai/npc-agents/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db.from('ai_agents').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ agent: data })
}
