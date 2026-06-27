/**
 * AI Agent Builder — NVIDIA NIM Agent Factory (Part 17)
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'

const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''

// ─────────────────────────────────────────────
// Chat with agent (inference)
// ─────────────────────────────────────────────

export async function chatWithAgent(params: {
  agentId: string
  userId: string
  contactId?: string
  conversationId?: string
  userMessage: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}): Promise<{ reply: string; intent?: string; action?: string; confidence?: number }> {
  const db = supabaseAdmin()

  const { data: agent } = await db
    .from('ai_agents')
    .select('*, agent_intents(name, example_phrases, response_template, action)')
    .eq('id', params.agentId)
    .single()

  if (!agent) throw new Error('Agent not found')

  // Build system prompt
  const persona = agent.persona as Record<string, string>
  const systemPrompt = agent.system_prompt ?? `You are ${agent.name}, a ${persona?.tone ?? 'professional'} AI assistant. ${persona?.greeting ?? ''}`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(params.history ?? []),
    { role: 'user' as const, content: params.userMessage },
  ]

  const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NVIDIA_API_KEY}` },
    body: JSON.stringify({
      model: agent.model ?? 'nvidia/llama-3.1-nemotron-70b-instruct',
      messages,
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.max_tokens ?? 512,
    }),
  })

  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  const data = await res.json()
  const reply = data.choices?.[0]?.message?.content ?? agent.fallback_message

  // Update session metrics
  await db.from('ai_agents').update({ conversation_count: (agent.conversation_count ?? 0) + 1 }).eq('id', params.agentId)

  return { reply }
}

// ─────────────────────────────────────────────
// Create agent
// ─────────────────────────────────────────────

export async function createAgent(params: {
  userId: string
  name: string
  agentType: string
  description?: string
  systemPrompt?: string
  persona?: Record<string, string>
  model?: string
}): Promise<Record<string, unknown>> {
  const db = supabaseAdmin()
  const slug = `${params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`

  const { data, error } = await db.from('ai_agents').insert({
    user_id: params.userId,
    name: params.name,
    slug,
    agent_type: params.agentType,
    description: params.description,
    system_prompt: params.systemPrompt,
    persona: params.persona ?? {},
    model: params.model ?? 'nvidia/llama-3.1-nemotron-70b-instruct',
    status: 'draft',
  }).select().single()

  if (error) throw new Error(error.message)
  return data
}

// ─────────────────────────────────────────────
// Get agent analytics
// ─────────────────────────────────────────────

export async function getAgentAnalytics(agentId: string) {
  const db = supabaseAdmin()
  const { data: sessions } = await db.from('agent_sessions').select('status, created_at').eq('agent_id', agentId)
  const total = sessions?.length ?? 0
  const resolved = sessions?.filter(s => s.status === 'resolved').length ?? 0
  const handedOff = sessions?.filter(s => s.status === 'handed_off').length ?? 0
  return { total_sessions: total, resolved, handed_off: handedOff, resolution_rate: total > 0 ? Math.round((resolved / total) * 100) : 0 }
}
