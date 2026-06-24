import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dispatchAIReply } from '../engine'
import { tryGetAIProvider } from '../provider-factory'

// Create a builder for Supabase query chaining
const createMockChain = (resolvedValue: any) => {
  const chain: any = {
    select: vi.fn().mockImplementation(() => chain),
    insert: vi.fn().mockImplementation(() => chain),
    update: vi.fn().mockImplementation(() => chain),
    upsert: vi.fn().mockImplementation(() => chain),
    eq: vi.fn().mockImplementation(() => chain),
    not: vi.fn().mockImplementation(() => chain),
    order: vi.fn().mockImplementation(() => chain),
    limit: vi.fn().mockImplementation(() => chain),
    single: vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    then: (resolve: any) => Promise.resolve(resolve(resolvedValue)),
  };
  return chain;
};

vi.mock('@/services/db', () => {
  return {
    dbService: {
      business: {
        getAIRouterConfig: vi.fn().mockResolvedValue({
          enabled: true,
          auto_reply: true,
          ai_provider: 'gemini',
          confidence_threshold: 0.5,
          system_prompt: 'Global prompt',
        }),
        getRecentMessages: vi.fn().mockResolvedValue([]),
        createMessage: vi.fn().mockResolvedValue({}),
        updateConversation: vi.fn().mockResolvedValue({}),
        findConversationById: vi.fn().mockResolvedValue({ contact_id: 'contact-456' }),
        updateContact: vi.fn().mockResolvedValue({}),
        upsertLeadScore: vi.fn().mockResolvedValue({}),
        countTotalMessages: vi.fn().mockResolvedValue(1),
      },
      ai: {
        getAIConversation: vi.fn().mockResolvedValue(null),
        upsertAIConversation: vi.fn().mockResolvedValue({}),
        logAIUsage: vi.fn().mockResolvedValue({}),
        getAIAgent: vi.fn(),
      },
    },
  }
})

vi.mock('../mongodb-logger', () => {
  return {
    logPrompt: vi.fn().mockResolvedValue(undefined),
    logSentimentAnalysis: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('../provider-factory', () => {
  return {
    tryGetAIProvider: vi.fn(),
  }
})

vi.mock('../knowledge/embeddings', () => {
  return {
    searchKnowledge: vi.fn().mockResolvedValue([]),
    formatKnowledgeForPrompt: vi.fn().mockReturnValue(''),
  }
})

vi.mock('../memory', () => {
  return {
    getContactMemory: vi.fn().mockResolvedValue(null),
    formatMemoryForPrompt: vi.fn().mockReturnValue(''),
    updateContactMemory: vi.fn().mockResolvedValue(null),
    getUnifiedMemoryContext: vi.fn().mockResolvedValue(''),
  }
})

vi.mock('../intent', () => {
  return {
    analyzeIntent: vi.fn().mockResolvedValue({
      intent: 'question',
      sentiment: 'neutral',
      language: 'en',
      wantsHuman: false,
      selectedAgent: 'website_consultant',
    }),
    quickHumanRequestCheck: vi.fn().mockReturnValue(false),
  }
})

vi.mock('@/lib/automations/meta-send', () => {
  return {
    engineSendText: vi.fn().mockResolvedValue({ success: true }),
  }
})

import { dbService } from '@/services/db'

describe('AI Agent Dispatch Custom Overrides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should apply model overrides and custom prompts from MongoDB agent configurations', async () => {
    // Setup agent config override in DB mock
    vi.mocked(dbService.ai.getAIAgent).mockResolvedValue({
      userId: 'user-123',
      agentId: 'website_consultant',
      enabled: true,
      name: 'Custom Web Agent',
      description: 'Custom description',
      systemPrompt: 'CUSTOM_AGENT_PROMPT_OVERRIDE_abc',
      provider: 'openai',
      model: 'gpt-4o-custom-agent',
      temperature: 0.2,
      priority: 8,
      tools: ['knowledge_search'],
      updatedAt: new Date().toISOString(),
    } as any)

    const mockProvider = {
      name: 'openai',
      chat: vi.fn().mockResolvedValue({
        content: 'I can build custom Next.js sites.',
        confidence: 0.95,
        tokensUsed: 80,
        model: 'gpt-4o-custom-agent',
        finishReason: 'stop',
      }),
    }
    vi.mocked(tryGetAIProvider).mockImplementation((name) => {
      if (name === 'openai') return mockProvider as any
      return null
    })

    const result = await dispatchAIReply({
      userId: 'user-123',
      contactId: 'contact-456',
      conversationId: 'conversation-789',
      inboundText: 'Can you build a custom website?',
      messageType: 'text',
    })

    expect(result.replied).toBe(true)
    expect(result.replyContent).toBe('I can build custom Next.js sites.')

    // Ensure the custom provider/model/temperature overrides were checked
    expect(tryGetAIProvider).toHaveBeenCalledWith('openai')
    expect(mockProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('CUSTOM_AGENT_PROMPT_OVERRIDE_abc'),
        temperature: 0.2,
        options: { model: 'gpt-4o-custom-agent' },
      })
    )
  })
})
