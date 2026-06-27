import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { createAgent } from '@/lib/ai/agent-builder'

// GET /api/ai/npc-agents
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data } = await db.from('ai_agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json({ agents: data ?? [] })
}

// POST /api/ai/npc-agents
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const agent = await createAgent({
    userId: user.id,
    name: body.name,
    agentType: body.agent_type ?? 'support',
    description: body.description,
    systemPrompt: body.system_prompt,
    persona: body.persona,
    model: body.model,
  })

  return NextResponse.json({ agent }, { status: 201 })
}
