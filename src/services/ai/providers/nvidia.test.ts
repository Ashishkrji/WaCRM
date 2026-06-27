import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NvidiaProvider } from './nvidia'

describe('NvidiaProvider Unit Tests', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('should throw an error during instantiation if NVIDIA_API_KEY is not defined', () => {
    delete process.env.NVIDIA_API_KEY
    expect(() => new NvidiaProvider()).toThrow('NVIDIA_API_KEY is not set')
  })

  it('should resolve default parameters when instantiated with only API key', () => {
    process.env.NVIDIA_API_KEY = 'test-key'
    const provider = new NvidiaProvider()
    expect(provider.name).toBe('nvidia')
  })

  it('should successfully make a chat request and parse the response with confidence', async () => {
    process.env.NVIDIA_API_KEY = 'test-key'
    const provider = new NvidiaProvider()

    const mockResponseData = {
      id: 'chat-123',
      choices: [
        {
          message: { role: 'assistant', content: 'Hello there!' },
          finish_reason: 'stop',
          logprobs: {
            content: [
              { logprob: -0.1 }, // e^-0.1 = ~0.90
              { logprob: -0.2 }, // e^-0.2 = ~0.82
            ],
          },
        },
      ],
      usage: {
        total_tokens: 15,
        prompt_tokens: 5,
        completion_tokens: 10,
      },
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponseData,
    } as Response)

    const response = await provider.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      systemPrompt: 'You are a helpful assistant',
      temperature: 0.5,
      maxTokens: 100,
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
      })
    )

    // Verify payload body
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    const requestBody = JSON.parse(fetchCall[1]?.body as string)
    expect(requestBody).toEqual({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hi' },
      ],
      max_tokens: 100,
      temperature: 0.5,
      logprobs: true,
      top_logprobs: 1,
    })

    expect(response.content).toBe('Hello there!')
    expect(response.tokensUsed).toBe(15)
    expect(response.finishReason).toBe('stop')
    
    // Average logprob is (-0.1 - 0.2) / 2 = -0.15. exp(-0.15) = ~0.8607
    expect(response.confidence).toBeCloseTo(Math.exp(-0.15), 4)
  })

  it('should yield chunks sequentially during streaming', async () => {
    process.env.NVIDIA_API_KEY = 'test-key'
    const provider = new NvidiaProvider()

    const mockChunks = [
      'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n',
      'data: {"choices":[{"delta":{"content":" world"},"finish_reason":null}]}\n',
      'data: [DONE]\n',
    ]

    let chunkIdx = 0
    const mockReader = {
      read: async () => {
        if (chunkIdx >= mockChunks.length) {
          return { done: true, value: undefined }
        }
        const chunk = mockChunks[chunkIdx++]
        return { done: false, value: new TextEncoder().encode(chunk) }
      },
      releaseLock: vi.fn(),
    }

    const mockReadableStream = {
      getReader: () => mockReader,
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    } as unknown as Response)

    const chunksGenerated: string[] = []
    const stream = provider.stream({
      messages: [{ role: 'user', content: 'Hi' }],
    })

    for await (const chunk of stream) {
      chunksGenerated.push(chunk)
    }

    expect(chunksGenerated).toEqual(['Hello', ' world'])
  })

  it('should successfully make an embedding request', async () => {
    process.env.NVIDIA_API_KEY = 'test-key'
    const provider = new NvidiaProvider()

    const mockEmbeddingData = {
      data: [
        {
          embedding: [0.1, 0.2, 0.3],
        },
      ],
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockEmbeddingData,
    } as Response)

    const embedding = await provider.embed('testing embeddings')

    expect(fetch).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'nvidia/nv-embed-v2',
          input: ['testing embeddings'],
          input_type: 'query',
          encoding_format: 'float',
        }),
      })
    )

    expect(embedding).toEqual([0.1, 0.2, 0.3])
  })

  it('should throw descriptive errors when API response is not OK', async () => {
    process.env.NVIDIA_API_KEY = 'test-key'
    const provider = new NvidiaProvider()

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid model requested' }),
    } as Response)

    await expect(
      provider.chat({
        messages: [{ role: 'user', content: 'Hi' }],
      })
    ).rejects.toThrow('[AI/NVIDIA] Invalid model requested')
  })
})
