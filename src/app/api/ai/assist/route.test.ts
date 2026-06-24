import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { dbService } from '@/services/db'
import { tryGetAIProvider } from '@/lib/ai/provider-factory'

vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [] }),
      }),
    }),
  }
})

vi.mock('@/services/db', () => {
  return {
    dbService: {
      business: {
        findConversationById: vi.fn().mockResolvedValue({
          id: 'conversation-789',
          user_id: 'user-123',
          contact_id: 'contact-456',
          last_message_text: 'I want a website',
        }),
        getRecentMessages: vi.fn().mockResolvedValue([
          { sender_type: 'customer', content_text: 'I want a website' }
        ]),
        getAIRouterConfig: vi.fn().mockResolvedValue({
          ai_provider: 'gemini',
          model: 'gemini-1.5-flash',
        }),
      },
      ai: {
        getAIAgent: vi.fn().mockResolvedValue({
          enabled: true,
          provider: 'gemini',
          model: 'gemini-1.5-flash',
          systemPrompt: 'System Prompt override',
          temperature: 0.7,
        }),
      },
    },
  }
})

vi.mock('@/lib/ai/provider-factory', () => {
  return {
    tryGetAIProvider: vi.fn(),
  }
})

vi.mock('@/lib/ai/knowledge/embeddings', () => {
  return {
    searchKnowledge: vi.fn().mockResolvedValue([]),
    formatKnowledgeForPrompt: vi.fn().mockReturnValue(''),
  }
})

vi.mock('@/lib/ai/memory', () => {
  return {
    getUnifiedMemoryContext: vi.fn().mockResolvedValue(''),
  }
})

describe('AI Assist reply drafting route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should draft a reply with RAG & memory context', async () => {
    const mockProvider = {
      name: 'gemini',
      chat: vi.fn().mockResolvedValue({
        content: 'Sure, we can help you build a website at MaaJanki Web Tech.',
        confidence: 1.0,
        tokensUsed: 50,
        model: 'gemini-1.5-flash',
        finishReason: 'stop',
      }),
    }
    vi.mocked(tryGetAIProvider).mockReturnValue(mockProvider as any)

    const request = new Request('http://localhost/api/ai/assist', {
      method: 'POST',
      body: JSON.stringify({ conversationId: 'conversation-789' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    
    const body = await response.json()
    expect(body.draft).toBe('Sure, we can help you build a website at MaaJanki Web Tech.')
    expect(mockProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('System Prompt override'),
        temperature: 0.7,
      })
    )
  })
})
