/**
 * NVIDIA NIM API provider.
 *
 * NVIDIA NIM (NVIDIA Inference Microservices) exposes an OpenAI-compatible
 * chat completions API at https://integrate.api.nvidia.com/v1
 *
 * Environment variables:
 *   NVIDIA_API_KEY          — required
 *   NVIDIA_MODEL            — optional, default: nvidia/llama-3.1-nemotron-70b-instruct
 *   NVIDIA_EMBEDDING_MODEL  — optional, default: nvidia/nv-embed-v2
 *   NVIDIA_BASE_URL         — optional, default: https://integrate.api.nvidia.com/v1
 */

import type { AIProvider, AIRequest, AIResponse } from '../types'

const DEFAULT_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'
const DEFAULT_EMBEDDING_MODEL = 'nvidia/nv-embed-v2'
const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIChatChoice {
  message: OpenAIMessage
  finish_reason: string
  logprobs?: {
    content?: Array<{ logprob: number }>
  }
}

interface OpenAIChatResponse {
  id: string
  choices: OpenAIChatChoice[]
  usage?: {
    total_tokens: number
    prompt_tokens: number
    completion_tokens: number
  }
  model: string
}

interface OpenAIStreamChunk {
  choices: Array<{
    delta: { content?: string }
    finish_reason: string | null
  }>
}

/**
 * Convert raw logprobs to a confidence score 0–1.
 * Average token probability across the response.
 * Returns 1.0 when logprobs are not available (provider didn't emit them).
 */
function logprobsToConfidence(
  logprobs?: Array<{ logprob: number }>
): number {
  if (!logprobs || logprobs.length === 0) return 1.0
  const avg = logprobs.reduce((sum, t) => sum + t.logprob, 0) / logprobs.length
  // logprob is ln(p), so p = e^logprob. Clamp to [0,1].
  return Math.max(0, Math.min(1, Math.exp(avg)))
}

export class NvidiaProvider implements AIProvider {
  readonly name = 'nvidia'

  private readonly apiKey: string
  private readonly model: string
  private readonly embeddingModel: string
  private readonly baseUrl: string

  constructor() {
    const apiKey = process.env.NVIDIA_API_KEY
    if (!apiKey) {
      throw new Error(
        '[AI/NVIDIA] NVIDIA_API_KEY is not set. ' +
          'Get a free key at https://build.nvidia.com'
      )
    }
    this.apiKey = apiKey
    this.model = process.env.NVIDIA_MODEL || DEFAULT_MODEL
    this.embeddingModel =
      process.env.NVIDIA_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
    this.baseUrl = process.env.NVIDIA_BASE_URL || DEFAULT_BASE_URL
  }

  private buildMessages(request: AIRequest): OpenAIMessage[] {
    const msgs: OpenAIMessage[] = []
    if (request.systemPrompt) {
      msgs.push({ role: 'system', content: request.systemPrompt })
    }
    for (const m of request.messages) {
      msgs.push({ role: m.role as OpenAIMessage['role'], content: m.content })
    }
    return msgs
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const url = `${this.baseUrl}/chat/completions`
    const body = {
      model: (request.options?.model as string) || this.model,
      messages: this.buildMessages(request),
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      logprobs: true,
      top_logprobs: 1,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errMsg = `NVIDIA API error ${res.status}`
      try {
        const errData = await res.json()
        if (errData?.detail) errMsg = String(errData.detail)
        else if (errData?.message) errMsg = String(errData.message)
      } catch {
        // non-JSON body
      }
      throw new Error(`[AI/NVIDIA] ${errMsg}`)
    }

    const data = (await res.json()) as OpenAIChatResponse
    const choice = data.choices[0]
    const logprobs = choice.logprobs?.content
    const confidence = logprobsToConfidence(logprobs)

    return {
      content: choice.message.content,
      confidence,
      tokensUsed: data.usage?.total_tokens ?? 0,
      model: data.model || this.model,
      finishReason: choice.finish_reason || 'stop',
    }
  }

  async *stream(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const url = `${this.baseUrl}/chat/completions`
    const body = {
      model: (request.options?.model as string) || this.model,
      messages: this.buildMessages(request),
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      stream: true,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok || !res.body) {
      let errMsg = `NVIDIA streaming error ${res.status}`
      try {
        const errData = await res.json()
        if (errData?.detail) errMsg = String(errData.detail)
      } catch {
        // ignore
      }
      throw new Error(`[AI/NVIDIA] ${errMsg}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') return

          try {
            const chunk = JSON.parse(data) as OpenAIStreamChunk
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) yield delta
          } catch {
            // malformed SSE chunk — skip
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async embed(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/embeddings`
    const body = {
      model: this.embeddingModel,
      input: [text],
      input_type: 'query',
      encoding_format: 'float',
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errMsg = `NVIDIA embedding error ${res.status}`
      try {
        const errData = await res.json()
        if (errData?.detail) errMsg = String(errData.detail)
      } catch {
        // ignore
      }
      throw new Error(`[AI/NVIDIA] ${errMsg}`)
    }

    const data = await res.json()
    const embedding = data?.data?.[0]?.embedding
    if (!Array.isArray(embedding)) {
      throw new Error('[AI/NVIDIA] Invalid embedding response shape')
    }
    return embedding as number[]
  }
}
