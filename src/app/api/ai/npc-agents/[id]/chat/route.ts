import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithAgent } from '@/lib/ai/agent-builder'

// POST /api/ai/npc-agents/[id]/chat
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body?.message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const result = await chatWithAgent({
    agentId: id,
    userId: user.id,
    userMessage: body.message,
    history: body.history ?? [],
    contactId: body.contact_id,
    conversationId: body.conversation_id,
  })

  return NextResponse.json(result)
}
