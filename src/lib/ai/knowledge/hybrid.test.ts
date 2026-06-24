import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchKnowledge } from './embeddings'
import { dbService } from '@/services/db'
import { tryGetAIProvider } from '../provider-factory'

// Mock the database service
vi.mock('@/services/db', () => {
  return {
    dbService: {
      ai: {
        hybridSearchKnowledge: vi.fn(),
        logKnowledgeSearch: vi.fn().mockResolvedValue({}),
        logKnowledgeUsage: vi.fn().mockResolvedValue({}),
        getKnowledgeDocTitles: vi.fn(),
      },
    },
  }
})

// Mock the AI provider factory
vi.mock('../provider-factory', () => {
  const mockProvider = {
    name: 'mock-provider',
    embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    chat: vi.fn(),
  }
  return {
    tryGetAIProvider: vi.fn().mockReturnValue(mockProvider),
  }
})

describe('Hybrid Search Knowledge Base', () => {
  const userId = 'user-123'
  const queryText = 'e-commerce website pricing'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty array if embedding generation fails', async () => {
    const mockProvider = tryGetAIProvider()
    vi.mocked(mockProvider!.embed).mockRejectedValueOnce(new Error('Embedding error'))

    const results = await searchKnowledge(userId, queryText)
    expect(results).toEqual([])
    expect(dbService.ai.hybridSearchKnowledge).not.toHaveBeenCalled()
  })

  it('should call hybridSearchKnowledge and log successful search analytics', async () => {
    const mockEmbedding = [0.1, 0.2, 0.3]
    const mockSearchResults = [
      {
        _id: 'chunk-1',
        content: 'E-commerce website cost starts at INR 50,000.',
        knowledge_base_id: 'doc-1',
        similarity: 0.85,
      },
      {
        _id: 'chunk-2',
        content: 'WordPress packages range from INR 15,000 to 35,000.',
        knowledge_base_id: 'doc-2',
        similarity: 0.72,
      },
      {
        _id: 'chunk-3',
        content: 'Unrelated low scoring chunk.',
        knowledge_base_id: 'doc-3',
        similarity: 0.55,
      },
    ]

    const mockProvider = tryGetAIProvider()
    vi.mocked(mockProvider!.embed).mockResolvedValueOnce(mockEmbedding)
    vi.mocked(dbService.ai.hybridSearchKnowledge).mockResolvedValueOnce(mockSearchResults)
    vi.mocked(dbService.ai.getKnowledgeDocTitles).mockResolvedValueOnce([
      { id: 'doc-1', title: 'E-commerce Dev Pricing' },
      { id: 'doc-2', title: 'WordPress Packages' },
      { id: 'doc-3', title: 'Unrelated Doc' },
    ])

    const results = await searchKnowledge(userId, queryText, { threshold: 0.7 })

    // Check query calls
    expect(dbService.ai.hybridSearchKnowledge).toHaveBeenCalledWith(
      userId,
      mockEmbedding,
      queryText,
      { category: undefined, tags: [] },
      5
    )

    // Check threshold filter (similarity >= 0.7)
    expect(results.length).toBe(2)
    expect(results[0]).toEqual({
      id: 'chunk-1',
      content: 'E-commerce website cost starts at INR 50,000.',
      source: 'E-commerce Dev Pricing',
      similarity: 0.85,
    })
    expect(results[1]).toEqual({
      id: 'chunk-2',
      content: 'WordPress packages range from INR 15,000 to 35,000.',
      source: 'WordPress Packages',
      similarity: 0.72,
    })

    // Check async analytics and usage logs were triggered
    expect(dbService.ai.logKnowledgeSearch).toHaveBeenCalledWith(
      userId,
      queryText,
      2,
      expect.any(Number),
      true
    )
    expect(dbService.ai.logKnowledgeUsage).toHaveBeenCalledTimes(2)
    expect(dbService.ai.logKnowledgeUsage).toHaveBeenNthCalledWith(1, userId, 'chunk-1')
    expect(dbService.ai.logKnowledgeUsage).toHaveBeenNthCalledWith(2, userId, 'chunk-2')
  })

  it('should cache search results and return cached data on second call', async () => {
    const mockEmbedding = [0.1, 0.2, 0.3]
    const mockSearchResults = [
      {
        _id: 'chunk-cache',
        content: 'Cached content text.',
        knowledge_base_id: 'doc-cache',
        similarity: 0.95,
      },
    ]

    const mockProvider = tryGetAIProvider()
    vi.mocked(mockProvider!.embed).mockResolvedValue(mockEmbedding)
    vi.mocked(dbService.ai.hybridSearchKnowledge).mockResolvedValue(mockSearchResults)
    vi.mocked(dbService.ai.getKnowledgeDocTitles).mockResolvedValue([{ id: 'doc-cache', title: 'Cached Doc' }])

    // First call (populates cache)
    const results1 = await searchKnowledge(userId, 'unique query text', { threshold: 0.7 })
    expect(results1.length).toBe(1)
    expect(dbService.ai.hybridSearchKnowledge).toHaveBeenCalledTimes(1)

    // Second call (hits cache)
    const results2 = await searchKnowledge(userId, 'unique query text', { threshold: 0.7 })
    expect(results2).toEqual(results1)
    // hybridSearchKnowledge should still only have been called once
    expect(dbService.ai.hybridSearchKnowledge).toHaveBeenCalledTimes(1)
  })
})
