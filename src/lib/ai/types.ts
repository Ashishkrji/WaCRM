/**
 * Shared TypeScript types for the AI subsystem.
 *
 * These interfaces are provider-agnostic — every provider adapter must
 * satisfy the AIProvider interface, regardless of the underlying API shape.
 */

// ------------------------------------------------------------
// Message types
// ------------------------------------------------------------

export type AIRole = 'system' | 'user' | 'assistant'

export interface AIMessage {
  role: AIRole
  content: string
}

// ------------------------------------------------------------
// Request / Response
// ------------------------------------------------------------

export interface AIRequest {
  messages: AIMessage[]
  /** Override the system prompt from config. */
  systemPrompt?: string
  /** Max tokens for the response. Defaults to provider default. */
  maxTokens?: number
  /** Temperature (0–1). Lower = more deterministic. */
  temperature?: number
  /** If true, caller expects a streaming response. */
  stream?: boolean
  /** Additional provider-specific options. */
  options?: Record<string, unknown>
}

export interface AIResponse {
  /** The generated text content. */
  content: string
  /**
   * Confidence score 0–1. Providers that don't emit logprobs will return 1.0.
   * The engine compares this against the user's confidence_threshold to decide
   * on human handoff.
   */
  confidence: number
  /** Total tokens consumed (prompt + completion). */
  tokensUsed: number
  /** The model identifier that generated this response. */
  model: string
  /** Why the generation stopped: 'stop' | 'length' | 'content_filter' | 'error' */
  finishReason: string
}

// ------------------------------------------------------------
// Provider interface
// ------------------------------------------------------------

/**
 * Every AI provider adapter must implement this interface.
 * The factory creates the correct adapter based on AI_PROVIDER env var.
 */
export interface AIProvider {
  /** Provider identifier (e.g. 'nvidia', 'gemini', 'openai'). */
  readonly name: string

  /**
   * Send a chat completion request. Returns the full response once complete.
   */
  chat(request: AIRequest): Promise<AIResponse>

  /**
   * Send a chat completion request and stream the response.
   * Yields text chunks as they arrive.
   */
  stream(request: AIRequest): AsyncGenerator<string, void, unknown>

  /**
   * Generate a vector embedding for the given text.
   * Used by the RAG knowledge base pipeline.
   */
  embed(text: string): Promise<number[]>
}

// ------------------------------------------------------------
// Knowledge Base
// ------------------------------------------------------------

export interface KnowledgeChunk {
  id: string
  content: string
  /** Source document name / URL. */
  source: string
  /** Cosine similarity score from pgvector search (0–1). */
  similarity: number
}

// ------------------------------------------------------------
// Intent / Sentiment
// ------------------------------------------------------------

export type MessageIntent =
  | 'question'
  | 'complaint'
  | 'booking'
  | 'pricing'
  | 'greeting'
  | 'farewell'
  | 'human_request'
  | 'other'

export type MessageSentiment = 'positive' | 'neutral' | 'negative'

export interface IntentAnalysis {
  intent: MessageIntent
  sentiment: MessageSentiment
  /** ISO 639-1 language code, e.g. 'en', 'hi', 'ar'. */
  language: string
  /** True when the customer explicitly asked to speak to a human. */
  wantsHuman: boolean
}

// ------------------------------------------------------------
// AI Engine dispatch
// ------------------------------------------------------------

export interface AIDispatchInput {
  userId: string
  contactId: string
  conversationId: string
  inboundText: string
  /** Raw WhatsApp message type, e.g. 'text', 'image'. */
  messageType?: string
}

export interface AIDispatchResult {
  /** True if the AI generated and sent a reply. */
  replied: boolean
  /** True if the conversation was handed off to a human agent. */
  handedOff: boolean
  /** The AI's response content, if replied. */
  replyContent?: string
  /** Intent analysis result. */
  intent?: IntentAnalysis
  /** Error message if something went wrong (AI errors are non-fatal). */
  error?: string
}

// ------------------------------------------------------------
// Contact Memory
// ------------------------------------------------------------

export interface ContactMemory {
  userId: string
  contactId: string
  /** Key facts extracted from past conversations. */
  facts: Record<string, string>
  /** Last detected intent. */
  lastIntent?: MessageIntent
  /** Last detected language. */
  lastLanguage?: string
  /** Last detected sentiment. */
  lastSentiment?: string
  /** Number of times AI has interacted with this contact. */
  totalInteractions: number
  updatedAt: string
}

// ------------------------------------------------------------
// AI Router Config (mirrors DB row)
// ------------------------------------------------------------

export interface AIRouterConfig {
  id: string
  userId: string
  enabled: boolean
  /** External webhook endpoint (legacy — preserved for compatibility). */
  endpoint?: string
  /** External webhook API key (legacy — preserved for compatibility). */
  apiKey?: string
  systemPrompt?: string
  aiProvider: string
  model?: string
  confidenceThreshold: number
  autoReply: boolean
  humanHandoffMessage?: string
  createdAt: string
  updatedAt: string
}
