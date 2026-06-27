/**
 * AI Config Manager — AI provider configuration management.
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'

export const SUPPORTED_PROVIDERS = [
  { code: 'nvidia', name: 'NVIDIA NIM', defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct', models: ['nvidia/llama-3.1-nemotron-70b-instruct', 'nvidia/llama-3.3-70b-instruct', 'nvidia/mistral-nemo-12b-instruct', 'meta/llama-3.1-8b-instruct'] },
  { code: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o-mini', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { code: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-2.0-flash', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  { code: 'claude', name: 'Anthropic Claude', defaultModel: 'claude-3-5-haiku-20241022', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'] },
  { code: 'openrouter', name: 'OpenRouter', defaultModel: 'openai/gpt-4o-mini', models: [] },
]

// ─────────────────────────────────────────────
// Get AI config for user
// ─────────────────────────────────────────────

export async function getAIConfig(userId: string) {
  const db = supabaseAdmin()
  const { data } = await db.from('ai_provider_config').select('*').eq('user_id', userId).order('priority')
  return data ?? []
}

// ─────────────────────────────────────────────
// Save provider config
// ─────────────────────────────────────────────

export async function saveProviderConfig(userId: string, provider: string, config: {
  isEnabled?: boolean
  priority?: number
  defaultModel?: string
  temperature?: number
  maxTokens?: number
  streaming?: boolean
  monthlyCostLimit?: number
  monthlyRequestLimit?: number
}): Promise<void> {
  const db = supabaseAdmin()
  await db.from('ai_provider_config').upsert({
    user_id: userId,
    provider,
    is_enabled: config.isEnabled ?? true,
    priority: config.priority ?? 1,
    default_model: config.defaultModel,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 2048,
    streaming: config.streaming ?? false,
    monthly_cost_limit: config.monthlyCostLimit,
    monthly_request_limit: config.monthlyRequestLimit,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })
}

// ─────────────────────────────────────────────
// Get active primary model
// ─────────────────────────────────────────────

export async function getPrimaryModel(userId: string): Promise<{ provider: string; model: string }> {
  const db = supabaseAdmin()
  const { data } = await db.from('ai_provider_config').select('provider, default_model').eq('user_id', userId).eq('is_enabled', true).order('priority').limit(1).single()
  return { provider: data?.provider ?? 'nvidia', model: data?.default_model ?? 'nvidia/llama-3.1-nemotron-70b-instruct' }
}

// ─────────────────────────────────────────────
// Health check a provider
// ─────────────────────────────────────────────

export async function healthCheckProvider(provider: string, apiKey: string): Promise<boolean> {
  const endpoints: Record<string, string> = {
    nvidia: 'https://integrate.api.nvidia.com/v1/models',
    openai: 'https://api.openai.com/v1/models',
    gemini: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
  }
  const url = endpoints[provider]
  if (!url) return false
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}
