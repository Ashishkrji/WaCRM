/**
 * OpenAI-compatible provider.
 *
 * Works for:
 *   - OpenAI (AI_PROVIDER=openai, OPENAI_API_KEY, base: https://api.openai.com/v1)
 *   - OpenRouter (AI_PROVIDER=openrouter, OPENROUTER_API_KEY, base: https://openrouter.ai/api/v1)
 *   - Local LLM (AI_PROVIDER=local, LOCAL_LLM_BASE_URL, e.g. Ollama)
 *
 * All three use the same OpenAI chat completions schema.
 */

import type { AIProvider, AIRequest, AIResponse } from '../types'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIChatResponse {
  choices: Array<{
    message: OpenAIMessage
    finish_reason: string
  }>
  usage?: { total_tokens: number }
  model: string
}

interface OpenAIStreamChunk {
  choices: Array<{
    delta: { content?: string }
    finish_reason: string | null
  }>
}

type OpenAIVariant = 'openai' | 'openrouter' | 'local'

function resolveConfig(variant: OpenAIVariant): {
  apiKey: string
  baseUrl: string
  defaultModel: string
} {
  switch (variant) {
    case 'openai':
      return {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      }
    case 'openrouter':
      return {
        apiKey: process.env.OPENROUTER_API_KEY || '',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel:
          process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      }
    case 'local':
      return {
        apiKey: process.env.LOCAL_LLM_API_KEY || 'ollama',
        baseUrl:
          process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434/v1',
        defaultModel: process.env.LOCAL_LLM_MODEL || 'llama3',
      }
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: string

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly model: string
  private readonly extraHeaders: Record<string, string>

  constructor(variant: OpenAIVariant = 'openai') {
    this.name = variant
    const cfg = resolveConfig(variant)
    if (!cfg.apiKey) {
      throw new Error(
        `[AI/${variant.toUpperCase()}] API key is not set. ` +
          `Check your environment variables.`
      )
    }
    this.apiKey = cfg.apiKey
    this.baseUrl = cfg.baseUrl
    this.model = cfg.defaultModel
    // OpenRouter requires these headers for rate-limit identification
    this.extraHeaders =
      variant === 'openrouter'
        ? {
            'HTTP-Referer':
              process.env.NEXT_PUBLIC_SITE_URL || 'https://wacrm.tech',
            'X-Title': 'WaCRM',
          }
        : {}
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
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...this.extraHeaders,
      },
      body: JSON.stringify({
        model: (request.options?.model as string) || this.model,
        messages: this.buildMessages(request),
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.7,
      }),
    })

    if (!res.ok) {
      let errMsg = `${this.name} API error ${res.status}`
      try {
        const errData = await res.json()
        if (errData?.error?.message) errMsg = String(errData.error.message)
      } catch {
        // ignore
      }
      throw new Error(`[AI/${this.name}] ${errMsg}`)
    }

    const data = (await res.json()) as OpenAIChatResponse
    return {
      content: data.choices[0].message.content,
      confidence: 1.0, // OpenAI doesn't emit logprobs by default here
      tokensUsed: data.usage?.total_tokens ?? 0,
      model: data.model || this.model,
      finishReason: data.choices[0].finish_reason || 'stop',
    }
  }

  async *stream(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...this.extraHeaders,
      },
      body: JSON.stringify({
        model: (request.options?.model as string) || this.model,
        messages: this.buildMessages(request),
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.7,
        stream: true,
      }),
    })

    if (!res.ok || !res.body) {
      throw new Error(`[AI/${this.name}] Streaming error ${res.status}`)
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
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') return
          try {
            const chunk = JSON.parse(data) as OpenAIStreamChunk
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) yield delta
          } catch {
            // skip malformed chunk
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async embed(text: string): Promise<number[]> {
    const embeddingModel =
      this.name === 'openai'
        ? process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
        : this.model

    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...this.extraHeaders,
      },
      body: JSON.stringify({ model: embeddingModel, input: text }),
    })

    if (!res.ok) {
      throw new Error(`[AI/${this.name}] Embedding error ${res.status}`)
    }

    const data = await res.json()
    return data?.data?.[0]?.embedding as number[]
  }
}
