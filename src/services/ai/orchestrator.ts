/**
 * AI Provider Factory.
 *
 * Reads the AI_PROVIDER environment variable and returns the correct
 * provider implementation. This is the single place where provider
 * selection logic lives — callers never import providers directly.
 *
 * Supported values for AI_PROVIDER:
 *   nvidia     — NVIDIA NIM API (default)
 *   gemini     — Google Gemini
 *   openai     — OpenAI
 *   openrouter — OpenRouter (OpenAI-compatible)
 *   local      — Local LLM via any OpenAI-compatible endpoint (e.g. Ollama)
 *   claude     — Anthropic Claude
 *
 * The factory is lazy: the provider is only instantiated when first
 * requested, and then cached for the lifetime of the process. This
 * avoids crashing at startup if a key is misconfigured but AI is disabled.
 */

import type { AIProvider, AIRequest, AIResponse } from './types'

import { NvidiaProvider } from './providers/nvidia'
import { GeminiProvider } from './providers/gemini'
import { OpenAICompatibleProvider } from './providers/openai'
import { ClaudeProvider } from './providers/claude'

// Configure Undici global dispatcher to disable connection timeout (unlimited)
if (typeof window === 'undefined') {
  try {
    const { Agent, setGlobalDispatcher } = require('undici');
    const agent = new Agent({
      connect: {
        timeout: 0, // Disable connection timeout (unlimited)
      },
      headersTimeout: 0, // Disable headers timeout (unlimited)
      bodyTimeout: 0, // Disable body timeout (unlimited)
    });
    setGlobalDispatcher(agent);
    console.log('[AI/Factory] Undici global dispatcher configured with unlimited timeout.');
  } catch (err) {
    console.warn('[AI/Factory] Failed to configure Undici global dispatcher:', err);
  }
}

let _cachedProvider: AIProvider | null = null

// Helper to check if API key is set for a provider name
function isProviderConfigured(name: string): boolean {
  switch (name) {
    case 'nvidia':
      return !!process.env.NVIDIA_API_KEY
    case 'gemini':
      return !!process.env.GEMINI_API_KEY
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'openrouter':
      return !!process.env.OPENROUTER_API_KEY
    case 'local':
      return true // local Ollama is assumed available
    case 'claude':
      return !!process.env.ANTHROPIC_API_KEY
    default:
      return false
  }
}

// Instantiates a provider by name
function createProviderByName(name: string): AIProvider {
  switch (name) {
    case 'nvidia': {
      return new NvidiaProvider()
    }
    case 'gemini': {
      return new GeminiProvider()
    }
    case 'openai': {
      return new OpenAICompatibleProvider('openai')
    }
    case 'openrouter': {
      return new OpenAICompatibleProvider('openrouter')
    }
    case 'local': {
      return new OpenAICompatibleProvider('local')
    }
    case 'claude': {
      return new ClaudeProvider()
    }
    default:
      throw new Error(`Unknown provider: ${name}`)
  }
}

// Compile list of available fallback providers
function getFallbacks(primaryName: string): AIProvider[] {
  const allProviders = ['nvidia', 'gemini', 'openai', 'claude', 'openrouter', 'local']
  const fallbacks: AIProvider[] = []
  for (const name of allProviders) {
    if (name !== primaryName && isProviderConfigured(name)) {
      try {
        fallbacks.push(createProviderByName(name))
      } catch (err) {
        // ignore setup failures for fallback candidates
      }
    }
  }
  return fallbacks
}

/**
 * Wrapper class that handles runtime fallback logic for chat, stream, and embed.
 */
class FallbackAIProviderWrapper implements AIProvider {
  constructor(
    public readonly primary: AIProvider,
    private readonly fallbacks: () => AIProvider[]
  ) {}

  get name() {
    return this.primary.name
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const providers = [this.primary, ...this.fallbacks()]
    const errors: Error[] = []
    
    for (const provider of providers) {
      try {
        console.log(`[AI/Fallback] Attempting chat with provider: ${provider.name}`)
        const res = await provider.chat(request)
        return {
          ...res,
          model: provider.name === this.primary.name ? res.model : `${provider.name}/${res.model}`
        }
      } catch (err) {
        console.warn(`[AI/Fallback] Provider ${provider.name} failed during chat:`, err)
        errors.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
    throw new Error(`[AI/Fallback] All providers failed. Errors: ${errors.map(e => e.message).join(' | ')}`)
  }

  async *stream(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const providers = [this.primary, ...this.fallbacks()]
    const errors: Error[] = []
    
    for (const provider of providers) {
      try {
        console.log(`[AI/Fallback] Attempting stream with provider: ${provider.name}`)
        const streamGenerator = provider.stream(request)
        for await (const chunk of streamGenerator) {
          yield chunk
        }
        return
      } catch (err) {
        console.warn(`[AI/Fallback] Provider ${provider.name} failed during stream:`, err)
        errors.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
    throw new Error(`[AI/Fallback] All providers failed for streaming. Errors: ${errors.map(e => e.message).join(' | ')}`)
  }

  async embed(text: string): Promise<number[]> {
    const providers = [this.primary, ...this.fallbacks()]
    const errors: Error[] = []
    
    for (const provider of providers) {
      if (provider.name === 'claude') continue // Claude doesn't support embeddings
      try {
        console.log(`[AI/Fallback] Attempting embed with provider: ${provider.name}`)
        return await provider.embed(text)
      } catch (err) {
        console.warn(`[AI/Fallback] Provider ${provider.name} failed during embed:`, err)
        errors.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
    throw new Error(`[AI/Fallback] All providers failed for embedding. Errors: ${errors.map(e => e.message).join(' | ')}`)
  }
}

/**
 * Return a singleton AIProvider instance based on AI_PROVIDER env var,
 * or the provided providerOverride.
 *
 * @throws If the provider's required API key is not set and no fallback works.
 */
export function getAIProvider(providerOverride?: string): AIProvider {
  if (_cachedProvider && !providerOverride) return _cachedProvider

  const providerName = (providerOverride || process.env.AI_PROVIDER || 'nvidia').toLowerCase().trim()

  try {
    const primary = createProviderByName(providerName)
    const fallbacks = () => getFallbacks(providerName)
    const wrapped = new FallbackAIProviderWrapper(primary, fallbacks)
    if (!providerOverride) {
      _cachedProvider = wrapped
    }
    return wrapped
  } catch (err) {
    console.warn(`[AI/Factory] Failed to instantiate primary provider ${providerName}. Attempting fallback...`)
    const working = ['nvidia', 'gemini', 'openai', 'claude', 'openrouter', 'local'].find(
      (name) => name !== providerName && isProviderConfigured(name)
    )
    if (working) {
      try {
        const primary = createProviderByName(working)
        const fallbacks = () => getFallbacks(working)
        const wrapped = new FallbackAIProviderWrapper(primary, fallbacks)
        if (!providerOverride) {
          _cachedProvider = wrapped
        }
        return wrapped
      } catch (innerErr) {
        // ignore
      }
    }
    throw err
  }
}

/**
 * Clear the cached provider singleton.
 * Useful in tests to force re-instantiation with different env vars.
 */
export function resetAIProviderCache(): void {
  _cachedProvider = null
}

/**
 * Safely try to get the AI provider.
 * Returns null instead of throwing — use this in webhook paths where
 * a missing API key must not crash the response.
 */
export function tryGetAIProvider(providerOverride?: string): AIProvider | null {
  try {
    return getAIProvider(providerOverride)
  } catch {
    return null
  }
}


