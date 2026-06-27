import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/services/ai/orchestrator'
import type { AIMessage } from '@/services/ai/types'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, body: { error: 'Unauthorized' } }
  }
  return { ok: true, userId: user.id }
}

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      messages?: AIMessage[]
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
    } | null

    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request: "messages" array is required' },
        { status: 400 }
      )
    }

    const provider = getAIProvider()
    const response = await provider.chat({
      messages: body.messages,
      systemPrompt: body.systemPrompt,
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens ?? 1024,
    })

    return NextResponse.json(response)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/ai/chat] Chat error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
