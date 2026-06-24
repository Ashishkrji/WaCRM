import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbService } from '@/services/db'
import { DEFAULT_AGENTS } from '@/lib/ai/agents/defaults'
import type { AIAgentId, AIAgentConfig } from '@/lib/ai/types'

async function requireUser(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true, userId: user.id }
}

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { userId } = auth

  try {
    const dbAgents = await dbService.ai.listAIAgents(userId)
    const dbAgentsMap = new Map(dbAgents.map((a) => [a.agentId, a]))

    // Merge defaults with DB overrides
    const mergedAgents: AIAgentConfig[] = Object.entries(DEFAULT_AGENTS).map(
      ([id, def]) => {
        const agentId = id as AIAgentId
        const dbOverride = dbAgentsMap.get(agentId)

        return {
          userId,
          agentId,
          enabled: dbOverride ? dbOverride.enabled : true,
          name: dbOverride?.name || def.name,
          description: dbOverride?.description || def.description,
          systemPrompt: dbOverride?.systemPrompt || def.systemPrompt,
          provider: dbOverride?.provider || '',
          model: dbOverride?.model || '',
          temperature: dbOverride?.temperature ?? 0.7,
          priority: dbOverride?.priority ?? def.priority,
          tools: dbOverride?.tools || def.tools,
          updatedAt: dbOverride?.updatedAt || new Date().toISOString(),
        }
      }
    )

    return NextResponse.json({ agents: mergedAgents })
  } catch (error: any) {
    console.error('[API/agents] GET error:', error.message || error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { userId } = auth

  try {
    const body = await req.json()
    const {
      agentId,
      enabled,
      name,
      description,
      systemPrompt,
      provider,
      model,
      temperature,
      priority,
      tools,
    } = body

    if (!agentId || !DEFAULT_AGENTS[agentId as AIAgentId]) {
      return NextResponse.json({ error: 'Invalid agentId' }, { status: 400 })
    }

    const updates: Partial<AIAgentConfig> = {}
    if (enabled !== undefined) updates.enabled = Boolean(enabled)
    if (name !== undefined) updates.name = String(name)
    if (description !== undefined) updates.description = String(description)
    if (systemPrompt !== undefined) updates.systemPrompt = String(systemPrompt)
    if (provider !== undefined) updates.provider = String(provider)
    if (model !== undefined) updates.model = String(model)
    if (temperature !== undefined) updates.temperature = Number(temperature)
    if (priority !== undefined) updates.priority = Number(priority)
    if (tools !== undefined) updates.tools = Array.isArray(tools) ? tools.map(String) : []

    await dbService.ai.upsertAIAgent(userId, agentId, updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API/agents] POST error:', error.message || error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
