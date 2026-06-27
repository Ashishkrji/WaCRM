/**
 * Conversation summarization.
 *
 * Generates LLM summaries for long conversations and stores them
 * in MongoDB collections. Called asynchronously (fire-and-forget)
 * from the AI engine when a conversation exceeds the trigger threshold.
 */

import { messageRepo, aiDataRepo } from '@/repositories'
import { tryGetAIProvider } from './orchestrator'

const SUMMARY_MAX_TOKENS = 300
const SUMMARY_TEMPERATURE = 0.3
const SUMMARY_TRIGGER_COUNT = parseInt(
  process.env.AI_SUMMARY_TRIGGER_COUNT || '50',
  10
)
const MAX_MESSAGES_FOR_SUMMARY = 100 // send at most 100 messages to the LLM

const SUMMARY_SYSTEM_PROMPT = `You are a CRM assistant. Summarize the following WhatsApp customer conversation in 3-5 bullet points.
Focus on:
- What the customer needed or asked about
- Key issues or complaints mentioned
- Any commitments made by the agent
- The outcome or current status
- Customer sentiment

Keep each bullet point concise (one sentence). Start with "•".`

/**
 * Check if a conversation needs a summary and generate one if so.
 * This is a fire-and-forget operation — call with .catch() to swallow errors.
 */
export async function maybeGenerateSummary(
  organizationId: string,
  conversationId: string
): Promise<void> {
  try {
    // Count messages in this conversation via Business Service (Supabase)
    const count = await messageRepo.countTotalMessages(conversationId)

    if (count < SUMMARY_TRIGGER_COUNT) return

    // Check if we already have a summary in MongoDB via AI Service
    const existingSummary = await aiDataRepo.getSummary(conversationId)

    // Skip if the existing summary is less than 20 messages old
    if (
      existingSummary &&
      count - (existingSummary.message_count_at_summary || 0) < 20
    ) {
      return
    }

    await generateConversationSummary(organizationId, conversationId, count)
  } catch (err) {
    console.error('[AI/summary] maybeGenerateSummary failed:', err)
  }
}

/**
 * Generate and store a conversation summary.
 */
export async function generateConversationSummary(
  organizationId: string,
  conversationId: string,
  messageCount: number
): Promise<string | null> {
  const provider = tryGetAIProvider()
  if (!provider) return null

  try {
    // Fetch recent messages via Business Service (Supabase)
    const messages = await messageRepo.getRecentMessages(conversationId, MAX_MESSAGES_FOR_SUMMARY)

    if (!messages || messages.length === 0) return null

    // Build the conversation transcript (oldest first)
    const transcript = [...messages]
      .reverse()
      .map((m: { sender_type: string; content_text: string | null }) => {
        const role =
          m.sender_type === 'customer'
            ? 'Customer'
            : m.sender_type === 'bot'
              ? 'AI Agent'
              : 'Agent'
        return `${role}: ${m.content_text || ''}`
      })
      .join('\n')

    const response = await provider.chat({
      messages: [{ role: 'user', content: transcript }],
      systemPrompt: SUMMARY_SYSTEM_PROMPT,
      maxTokens: SUMMARY_MAX_TOKENS,
      temperature: SUMMARY_TEMPERATURE,
    })

    const summary = response.content.trim()
    if (!summary) return null

    // Upsert the summary in MongoDB via AI Service
    await aiDataRepo.upsertSummary(conversationId, {
      organizationId,
      summary,
      messageCountAtSummary: messageCount,
      provider: provider.name,
      model: process.env.NVIDIA_MODEL || process.env.OPENAI_MODEL || 'default',
      tokensUsed: response.tokensUsed,
    })

    return summary
  } catch (err) {
    console.warn('[AI/summary] generateConversationSummary failed (non-fatal):', err)
    return null
  }
}
