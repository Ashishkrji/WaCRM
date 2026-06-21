/**
 * Conversation summarization.
 *
 * Generates LLM summaries for long conversations and stores them
 * in MongoDB collections. Called asynchronously (fire-and-forget)
 * from the AI engine when a conversation exceeds the trigger threshold.
 */

import { createClient } from '@supabase/supabase-js'
import { tryGetAIProvider } from './provider-factory'
import { connectToDatabase } from '@/lib/mongodb'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _admin: any = null
function supabaseAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _admin
}

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
  userId: string,
  conversationId: string
): Promise<void> {
  const db = supabaseAdmin()

  // Count messages in this conversation
  const { count } = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  if ((count ?? 0) < SUMMARY_TRIGGER_COUNT) return

  try {
    const { db: mongoDb } = await connectToDatabase()

    // Check if we already have a summary in MongoDB
    const existingSummary = await mongoDb.collection('conversation_summaries')
      .findOne(
        { conversation_id: conversationId },
        { sort: { created_at: -1 } }
      )

    // Skip if the existing summary is less than 20 messages old
    if (
      existingSummary &&
      (count ?? 0) - (existingSummary.message_count_at_summary || 0) < 20
    ) {
      return
    }

    await generateConversationSummary(userId, conversationId, count ?? 0)
  } catch (err) {
    console.error('[AI/summary] maybeGenerateSummary failed:', err)
  }
}

/**
 * Generate and store a conversation summary.
 */
export async function generateConversationSummary(
  userId: string,
  conversationId: string,
  messageCount: number
): Promise<string | null> {
  const provider = tryGetAIProvider()
  if (!provider) return null

  const db = supabaseAdmin()

  // Fetch recent messages
  const { data: messages, error: msgErr } = await db
    .from('messages')
    .select('sender_type, content_text, created_at')
    .eq('conversation_id', conversationId)
    .not('content_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(MAX_MESSAGES_FOR_SUMMARY)

  if (msgErr || !messages || messages.length === 0) return null

  // Build the conversation transcript (oldest first)
  const transcript = messages
    .reverse()
    .map((m: { sender_type: string; content_text: string }) => {
      const role =
        m.sender_type === 'customer'
          ? 'Customer'
          : m.sender_type === 'bot'
            ? 'AI Agent'
            : 'Agent'
      return `${role}: ${m.content_text}`
    })
    .join('\n')

  try {
    const response = await provider.chat({
      messages: [{ role: 'user', content: transcript }],
      systemPrompt: SUMMARY_SYSTEM_PROMPT,
      maxTokens: SUMMARY_MAX_TOKENS,
      temperature: SUMMARY_TEMPERATURE,
    })

    const summary = response.content.trim()
    if (!summary) return null

    const { db: mongoDb } = await connectToDatabase()

    // Upsert the summary in MongoDB
    await mongoDb.collection('conversation_summaries').updateOne(
      { conversation_id: conversationId },
      {
        $set: {
          user_id: userId,
          summary,
          message_count_at_summary: messageCount,
          provider: provider.name,
          model: process.env.NVIDIA_MODEL || process.env.OPENAI_MODEL || 'default',
          tokens_used: response.tokensUsed,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    )

    return summary
  } catch (err) {
    console.warn('[AI/summary] generateConversationSummary failed (non-fatal):', err)
    return null
  }
}
