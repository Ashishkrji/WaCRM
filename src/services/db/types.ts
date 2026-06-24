import type { MessageIntent } from '@/lib/ai/types'

export interface MongoWebhookLog {
  _id?: any
  user_id: string
  direction: 'inbound' | 'outbound'
  payload: any
  status: string
  error: string | null
  created_at: Date
}

export interface MongoAutomationLog {
  _id?: any
  user_id: string
  automation_id: string
  contact_id: string
  trigger_type: string
  success: boolean
  steps_executed: any[]
  error: string | null
  created_at: Date
}

export interface MongoPromptHistory {
  _id?: any
  user_id: string
  messages: any[]
  system_prompt: string | null
  reply: string
  provider: string
  model: string
  tokens_used: number
  latency_ms: number
  created_at: Date
}

export interface MongoSentimentAnalysisLog {
  _id?: any
  user_id: string
  contact_id: string
  conversation_id: string
  text: string
  intent: string
  sentiment: string
  language: string
  wants_human: boolean
  created_at: Date
}

export interface MongoConversationSummary {
  _id?: any
  conversation_id: string
  user_id: string
  summary: string
  message_count_at_summary: number
  provider: string
  model: string
  tokens_used: number
  updated_at: Date
  created_at: Date
}

export interface MongoPromptTemplate {
  _id?: any
  id?: string // UUID standard
  user_id: string
  name: string
  system_prompt: string
  is_active: boolean
  created_at: Date
}

export interface MongoAIConversation {
  _id?: any
  conversation_id: string
  user_id: string
  total_ai_messages: number
  ai_active: boolean
  handed_off_at: Date | null
  provider: string
  model: string
  updated_at: Date
  created_at: Date
}

export interface MongoKnowledgeBaseDoc {
  _id?: any
  id: string // UUID format
  user_id: string
  title: string
  content: string
  status: string
  created_at: Date
  updated_at?: Date
}

export interface MongoKnowledgeEmbeddingDoc {
  _id?: any
  user_id: string
  knowledge_base_id: string
  content: string
  embedding: number[]
  category?: string
  tags?: string[]
  source_url?: string | null
  created_at?: Date
}

export interface MongoAIMemory {
  _id?: any
  user_id: string
  contact_id: string
  facts: Record<string, string>
  last_intent: MessageIntent | null
  last_language: string
  last_sentiment: string
  total_interactions: number
  updated_at: Date
  created_at: Date
}
