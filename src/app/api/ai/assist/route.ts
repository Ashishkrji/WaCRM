import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contactRepo, conversationRepo, messageRepo, dealRepo, meetingRepo, quotationRepo, proposalRepo, pipelineRepo, leadScoreRepo, syncRepo, aiRouterRepo, knowledgeRepo, memoryRepo, aiDataRepo } from '@/repositories';
import { tryGetAIProvider } from '@/services/ai/orchestrator'
import { searchKnowledge, formatKnowledgeForPrompt } from '@/services/knowledge/embeddings'
import { getUnifiedMemoryContext } from '@/services/ai/memory'
import { DEFAULT_AGENTS } from '@/services/ai/agents/defaults'

import { type SupabaseClient } from '@supabase/supabase-js'

async function requireUser(): Promise<
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true, userId: user.id, supabase }
}

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  const { userId, supabase } = auth

  try {
    const body = await req.json().catch(() => null)
    const conversationId = body?.conversationId
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    // Fetch conversation details to get contact_id and verify user ownership
    const conversation = await conversationRepo.findById(conversationId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized conversation access' }, { status: 403 })
    }

    const contactId = conversation.contact_id

    // Fetch recent messages (history)
    const recentMessages = await messageRepo.getRecentMessages(conversationId, 20)
    
    // Map to AIMessage format and reverse to chronological order
    const history = [...recentMessages]
      .reverse()
      .map((m) => ({
        role: m.sender_type === 'customer' ? ('user' as const) : ('assistant' as const),
        content: m.content_text || '',
      }))

    // Get query text for RAG (e.g. from last customer message or last message)
    const lastCustomerMsg = [...recentMessages].find((m) => m.sender_type === 'customer')
    const queryText = lastCustomerMsg?.content_text || conversation.last_message_text || 'hello'

    // Retrieve knowledge base context
    let knowledgeContext = ''
    try {
      const knowledgeChunks = await searchKnowledge(userId, queryText, {
        threshold: 0.6,
        topK: 5,
        category: 'support',
      })
      knowledgeContext = formatKnowledgeForPrompt(knowledgeChunks)
    } catch (ragErr) {
      console.warn('[AI/assist] searchKnowledge failed:', ragErr)
    }

    // Retrieve memory context (contact facts/details)
    let memoryContext = ''
    try {
      memoryContext = await getUnifiedMemoryContext(userId, contactId)
    } catch (memErr) {
      console.warn('[AI/assist] getUnifiedMemoryContext failed:', memErr)
    }

    // Get team assistant configuration
    let agentConfig = await aiDataRepo.getAIAgent(userId, 'team_assistant')
    if (!agentConfig || !agentConfig.enabled) {
      const defaultDef = DEFAULT_AGENTS['team_assistant']
      agentConfig = {
        userId,
        agentId: 'team_assistant',
        enabled: true,
        name: defaultDef.name,
        description: defaultDef.description,
        systemPrompt: defaultDef.systemPrompt,
        priority: defaultDef.priority,
        tools: defaultDef.tools,
        updatedAt: new Date().toISOString(),
      }
    }

    // Fetch quick replies to recommend
    const { data: quickReplies } = await supabase
      .from('quick_replies')
      .select('*')
      .eq('user_id', userId)

    // Resolve provider/model overrides
    const routerConfig = await aiRouterRepo.getByUserId(userId)
    const activeProviderName = agentConfig.provider || routerConfig?.ai_provider || 'nvidia'
    const activeModelName = agentConfig.model || routerConfig?.model
    const activeTemperature = agentConfig.temperature ?? 0.7
    const systemPromptBase = agentConfig.systemPrompt || DEFAULT_AGENTS['team_assistant'].systemPrompt

    // Compose system prompt with facts & knowledge context
    const systemPromptParts = [systemPromptBase]
    if (knowledgeContext) systemPromptParts.push(knowledgeContext)
    if (memoryContext) systemPromptParts.push(memoryContext)

    systemPromptParts.push(`
### INSTRUCTION FOR AI TEAM ASSISTANT:
You are the AI Team Assistant. Your job is to draft a professional, helpful, and highly accurate reply suggestion that a human teammate can review, edit, and send to the customer.
Read the conversation history, the retrieved RAG knowledge context, and any client memory facts.
Draft ONLY the suggested reply text itself.
Do NOT output any markdown tags outside the response, JSON, comments, or prefixes like "Here is a draft:" or "Suggested Reply:".
Keep the reply under 150 words. Personalize using the customer's name or company details if available.
`)

    if (quickReplies && quickReplies.length > 0) {
      const repliesList = quickReplies.map(qr => `- Shortcut: ${qr.shortcut}\n  Text: ${qr.message_text}`).join('\n')
      systemPromptParts.push(`
### SAVED QUICK REPLIES:
Here are the available pre-configured quick replies:
${repliesList}

At the very end of your response, on a new line, write exactly:
RECOMMENDED_REPLIES: [/shortcut1, /shortcut2]
containing up to 3 shortcuts of the quick replies that are most relevant to the customer's latest query, or output RECOMMENDED_REPLIES: [] if none are relevant.
`)
    }

    const fullSystemPrompt = systemPromptParts.join('\n\n')

    // Call AI provider
    const provider = tryGetAIProvider(activeProviderName)
    if (!provider) {
      return NextResponse.json({ error: 'AI provider not available' }, { status: 500 })
    }

    const response = await provider.chat({
      messages: history,
      systemPrompt: fullSystemPrompt,
      maxTokens: 512,
      temperature: activeTemperature,
      options: activeModelName ? { model: activeModelName } : undefined,
    })

    let rawContent = response.content.trim()
    let draft = rawContent
    let recommendedReplies: any[] = []

    const match = rawContent.match(/RECOMMENDED_REPLIES:\s*\[(.*?)\]/)
    if (match) {
      draft = rawContent.replace(/RECOMMENDED_REPLIES:\s*\[.*?\]/, '').trim()
      const shortcuts = match[1]
        .split(',')
        .map(s => s.trim())
        .filter(s => s.startsWith('/'))
      if (quickReplies && shortcuts.length > 0) {
        recommendedReplies = quickReplies.filter(qr => shortcuts.includes(qr.shortcut))
      }
    }

    return NextResponse.json({ draft, recommendedReplies })
  } catch (error: any) {
    console.error('[API/ai/assist] error:', error.message || error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

