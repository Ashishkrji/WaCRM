/**
 * Google Gemini provider.
 *
 * Uses the Gemini REST API (not the SDK, to keep zero extra dependencies).
 * Disabled by default — activate with AI_PROVIDER=gemini + GEMINI_API_KEY.
 *
 * Supported models: gemini-1.5-flash (default), gemini-1.5-pro, gemini-2.0-flash-exp
 */

import type { AIProvider, AIRequest, AIResponse } from '../types'

const DEFAULT_MODEL = 'gemini-1.5-flash'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

interface GeminiContent {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

interface GeminiCandidate {
  content: GeminiContent
  finishReason: string
}

interface GeminiResponse {
  candidates: GeminiCandidate[]
  usageMetadata?: { totalTokenCount?: number }
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini'

  private readonly apiKey: string
  private readonly model: string

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error(
        '[AI/Gemini] GEMINI_API_KEY is not set.'
      )
    }
    this.apiKey = apiKey
    this.model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  }

  /** Gemini uses 'user'/'model' roles (not 'assistant'). */
  private buildContents(request: AIRequest): GeminiContent[] {
    const contents: GeminiContent[] = []
    for (const m of request.messages) {
      if (m.role === 'system') continue // system is handled via systemInstruction
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })
    }
    return contents
  }

  private systemInstruction(request: AIRequest): string | undefined {
    // Merge explicit systemPrompt with any system message in the messages array
    const fromMessages = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n')
    const combined = [request.systemPrompt, fromMessages]
      .filter(Boolean)
      .join('\n')
    return combined || undefined
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const url = `${GEMINI_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`
    const systemInst = this.systemInstruction(request)
    const body: Record<string, unknown> = {
      contents: this.buildContents(request),
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.7,
      },
    }
    if (systemInst) {
      body.systemInstruction = {
        parts: [{ text: systemInst }],
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errMsg = `Gemini API error ${res.status}`
      try {
        const errData = await res.json()
        if (errData?.error?.message) errMsg = String(errData.error.message)
      } catch {
        // ignore
      }
      throw new Error(`[AI/Gemini] ${errMsg}`)
    }

    const data = (await res.json()) as GeminiResponse
    const candidate = data.candidates?.[0]
    const text = candidate?.content?.parts?.map((p) => p.text).join('') ?? ''

    return {
      content: text,
      confidence: 1.0,
      tokensUsed: data.usageMetadata?.totalTokenCount ?? 0,
      model: this.model,
      finishReason: candidate?.finishReason?.toLowerCase() || 'stop',
    }
  }

  async *stream(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const url = `${GEMINI_BASE}/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`
    const systemInst = this.systemInstruction(request)
    const body: Record<string, unknown> = {
      contents: this.buildContents(request),
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.7,
      },
    }
    if (systemInst) {
      body.systemInstruction = { parts: [{ text: systemInst }] }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok || !res.body) {
      throw new Error(`[AI/Gemini] Streaming error ${res.status}`)
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
            const chunk = JSON.parse(data) as GeminiStreamChunk
            const text = chunk.candidates?.[0]?.content?.parts
              ?.map((p) => p.text ?? '')
              .join('')
            if (text) yield text
          } catch {
            // skip
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /** Gemini embedding via text-embedding-004. */
  async embed(text: string): Promise<number[]> {
    const embModel = 'text-embedding-004'
    const url = `${GEMINI_BASE}/models/${embModel}:embedContent?key=${this.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${embModel}`,
        content: { parts: [{ text }] },
      }),
    })
    if (!res.ok) {
      throw new Error(`[AI/Gemini] Embedding error ${res.status}`)
    }
    const data = await res.json()
    return data?.embedding?.values as number[]
  }
}
