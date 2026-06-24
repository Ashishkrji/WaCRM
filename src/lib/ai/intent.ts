/**
 * Intent, sentiment, and language detection.
 *
 * Uses the active AI provider to classify incoming messages.
 * These classifications drive:
 *   - Human handoff decisions (wantsHuman)
 *   - Language-aware responses (language)
 *   - Lead scoring (intent + sentiment)
 *   - Analytics (ai_conversations, ai_memory)
 *
 * All detection is done in a single lightweight LLM call to minimize
 * latency and token cost. The prompt asks for a structured JSON response.
 */

import { tryGetAIProvider } from './provider-factory'
import type { IntentAnalysis, MessageIntent, MessageSentiment, AIAgentId } from './types'

// Fast, cheap model for classification — override per provider if needed
const INTENT_MAX_TOKENS = 150
const INTENT_TEMPERATURE = 0.1 // low for deterministic classification

const INTENT_SYSTEM_PROMPT = `You are a message classifier for a digital agency (MaaJanki Web Tech) customer service system.
Analyze the customer message and respond ONLY with valid JSON in this exact format:
{
  "intent": "<one of: question|complaint|booking|pricing|greeting|farewell|human_request|other>",
  "sentiment": "<one of: positive|neutral|negative>",
  "language": "<ISO 639-1 code e.g. en|hi|ar|es|fr|pt|zh>",
  "wantsHuman": <true|false>,
  "selectedAgent": "<one of: receptionist|sales|website_consultant|seo_consultant|digital_marketing|business_registration|proposal_writer|quotation_generator|scheduler|support|general>"
}

wantsHuman should be true if the customer explicitly asks for a human, agent, or person.

Choose the most suitable selectedAgent:
- receptionist: First-time greetings, introductions, or when they speak a different language and we need to collect basic details.
- sales: Service inquiries, package questions, standard budgets, or buying interest.
- website_consultant: Custom website development, WordPress, Shopify, React/Next.js/MERN technical queries.
- seo_consultant: Search Engine Optimization, Google rankings, backlinks, GBP optimization.
- digital_marketing: Google/Meta Ads campaigns, Instagram/Facebook ads spend, funnel marketing.
- business_registration: GST registration, ITR tax filings, Private Limited or corporate startup compliance.
- proposal_writer: Custom scope, timeline, deliverables, or contract proposal details.
- quotation_generator: Quotation summaries, billing estimates, discount math.
- scheduler: Requesting a consultation, booking a meeting time slot, scheduling calls.
- support: Refunds, policies, maintenance agreements, complaints, hosting setup.
- general: Any general questions that don't fit the above categories.

Do not include any explanation or markdown — only the JSON object.`

/**
 * Analyze intent, sentiment, and language of an inbound message.
 * Returns a safe default if the AI provider is unavailable or the call fails.
 */
export async function analyzeIntent(text: string): Promise<IntentAnalysis> {
  const defaultResult: IntentAnalysis = {
    intent: 'other',
    sentiment: 'neutral',
    language: 'en',
    wantsHuman: false,
    selectedAgent: 'general',
  }

  if (!text.trim()) return defaultResult

  const provider = tryGetAIProvider()
  if (!provider) return defaultResult

  try {
    const response = await provider.chat({
      messages: [{ role: 'user', content: text }],
      systemPrompt: INTENT_SYSTEM_PROMPT,
      maxTokens: INTENT_MAX_TOKENS,
      temperature: INTENT_TEMPERATURE,
    })

    const raw = response.content.trim()
    // Extract JSON from the response — sometimes providers wrap it in backticks
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return defaultResult

    const parsed = JSON.parse(jsonMatch[0])

    const validIntents: MessageIntent[] = [
      'question', 'complaint', 'booking', 'pricing',
      'greeting', 'farewell', 'human_request', 'other',
    ]
    const validSentiments: MessageSentiment[] = ['positive', 'neutral', 'negative']
    const validAgents: AIAgentId[] = [
      'receptionist', 'sales', 'website_consultant', 'seo_consultant',
      'digital_marketing', 'business_registration', 'proposal_writer',
      'quotation_generator', 'scheduler', 'support', 'general',
    ]

    return {
      intent: validIntents.includes(parsed.intent) ? parsed.intent : 'other',
      sentiment: validSentiments.includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
      language: typeof parsed.language === 'string' ? parsed.language.slice(0, 5) : 'en',
      wantsHuman: Boolean(parsed.wantsHuman),
      selectedAgent: validAgents.includes(parsed.selectedAgent)
        ? parsed.selectedAgent
        : 'general',
    }
  } catch (err) {
    console.warn('[AI/intent] analyzeIntent failed (non-fatal):', err)
    return defaultResult
  }
}

/**
 * Quick human-request detector — checks for common patterns without an LLM call.
 * Used as a fast pre-check before the full intent analysis.
 */
export function quickHumanRequestCheck(text: string): boolean {
  const lower = text.toLowerCase()
  const humanKeywords = [
    'human', 'agent', 'person', 'staff', 'support', 'representative',
    'real person', 'talk to someone', 'speak to someone', 'speak with',
    'live chat', 'call me', 'manager', 'supervisor',
    // Hindi/Urdu
    'insaan', 'banda', 'aadmi',
    // Arabic
    'إنسان', 'موظف', 'شخص',
    // Spanish
    'persona', 'agente humano',
    // French
    'humain', 'personne réelle',
    // Portuguese
    'pessoa', 'agente humano',
  ]
  return humanKeywords.some((kw) => lower.includes(kw))
}
