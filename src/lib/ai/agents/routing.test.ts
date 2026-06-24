import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeIntent } from '../intent'
import { tryGetAIProvider } from '../provider-factory'

vi.mock('../provider-factory', () => {
  return {
    tryGetAIProvider: vi.fn(),
  }
})

describe('AI Agent Intent Routing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should route pricing queries to the sales executive agent', async () => {
    const mockProvider = {
      name: 'gemini',
      chat: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          intent: 'pricing',
          sentiment: 'neutral',
          language: 'en',
          wantsHuman: false,
          selectedAgent: 'sales',
        }),
        confidence: 1.0,
        tokensUsed: 10,
        model: 'gemini-1.5-flash',
        finishReason: 'stop',
      }),
    }
    vi.mocked(tryGetAIProvider).mockReturnValue(mockProvider as any)

    const result = await analyzeIntent('How much does a website cost?')
    expect(result.selectedAgent).toBe('sales')
    expect(result.intent).toBe('pricing')
  })

  it('should route technical website queries to the website consultant agent', async () => {
    const mockProvider = {
      name: 'gemini',
      chat: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          intent: 'question',
          sentiment: 'neutral',
          language: 'en',
          wantsHuman: false,
          selectedAgent: 'website_consultant',
        }),
        confidence: 1.0,
        tokensUsed: 10,
        model: 'gemini-1.5-flash',
        finishReason: 'stop',
      }),
    }
    vi.mocked(tryGetAIProvider).mockReturnValue(mockProvider as any)

    const result = await analyzeIntent('Should I build my site on WordPress or Shopify?')
    expect(result.selectedAgent).toBe('website_consultant')
  })

  it('should route meeting requests to the scheduler agent', async () => {
    const mockProvider = {
      name: 'gemini',
      chat: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          intent: 'booking',
          sentiment: 'neutral',
          language: 'en',
          wantsHuman: false,
          selectedAgent: 'scheduler',
        }),
        confidence: 1.0,
        tokensUsed: 10,
        model: 'gemini-1.5-flash',
        finishReason: 'stop',
      }),
    }
    vi.mocked(tryGetAIProvider).mockReturnValue(mockProvider as any)

    const result = await analyzeIntent('Can we schedule a call tomorrow?')
    expect(result.selectedAgent).toBe('scheduler')
    expect(result.intent).toBe('booking')
  })

  it('should fallback to general agent on invalid response', async () => {
    const mockProvider = {
      name: 'gemini',
      chat: vi.fn().mockResolvedValue({
        content: 'Not a JSON response',
        confidence: 1.0,
        tokensUsed: 10,
        model: 'gemini-1.5-flash',
        finishReason: 'stop',
      }),
    }
    vi.mocked(tryGetAIProvider).mockReturnValue(mockProvider as any)

    const result = await analyzeIntent('Hello')
    expect(result.selectedAgent).toBe('general')
  })
})
