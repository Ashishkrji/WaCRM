/**
 * Anthropic Claude provider.
 *
 * Uses the Anthropic Messages API.
 * Disabled by default — activate with AI_PROVIDER=claude + ANTHROPIC_API_KEY.
 *
 * Supported models: claude-3-5-sonnet-20241022 (default), claude-3-haiku-20240307
 */

import type { AIProvider, AIRequest, AIResponse } from '../types'

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022'
const CLAUDE_BASE = 'https://api.anthropic.com/v1'
const ANTHROPIC_VERSION = '2023-06-01'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
  stop_reason: string
  usage: { input_tokens: number; output_tokens: number }
  model: string
}

interface AnthropicStreamEvent {
  type: string
  delta?: { type: string; text?: string }
  usage?: { output_tokens: number }
}

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude'

  private readonly apiKey: string
  private readonly model: string

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('[AI/Claude] ANTHROPIC_API_KEY is not set.')
    }
    this.apiKey = apiKey
    this.model = process.env.CLAUDE_MODEL || DEFAULT_MODEL
  }

  private buildMessages(request: AIRequest): AnthropicMessage[] {
    // Claude doesn't accept 'system' role in the messages array
    return request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))
  }

  private systemPrompt(request: AIRequest): string | undefined {
    const fromMessages = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n')
    return [request.systemPrompt, fromMessages].filter(Boolean).join('\n') || undefined
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const system = this.systemPrompt(request)
    const body: Record<string, unknown> = {
      model: this.model,
      messages: this.buildMessages(request),
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
    }
    if (system) body.system = system

    const res = await fetch(`${CLAUDE_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errMsg = `Claude API error ${res.status}`
      try {
        const errData = await res.json()
        if (errData?.error?.message) errMsg = String(errData.error.message)
      } catch {
        // ignore
      }
      throw new Error(`[AI/Claude] ${errMsg}`)
    }

    const data = (await res.json()) as AnthropicResponse
    const text = data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return {
      content: text,
      confidence: 1.0,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      model: data.model || this.model,
      finishReason: data.stop_reason || 'stop',
    }
  }

  async *stream(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const system = this.systemPrompt(request)
    const body: Record<string, unknown> = {
      model: this.model,
      messages: this.buildMessages(request),
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      stream: true,
    }
    if (system) body.system = system

    const res = await fetch(`${CLAUDE_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok || !res.body) {
      throw new Error(`[AI/Claude] Streaming error ${res.status}`)
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
          try {
            const event = JSON.parse(data) as AnthropicStreamEvent
            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield event.delta.text
            }
          } catch {
            // skip
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Claude does not have a native embeddings endpoint.
   * Falls back to a warning — use a different provider for RAG embeddings.
   */
  async embed(_text: string): Promise<number[]> {
    throw new Error(
      '[AI/Claude] Claude does not support embeddings. ' +
        'Set NVIDIA_API_KEY or OPENAI_API_KEY for knowledge base features.'
    )
  }
}
