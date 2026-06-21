/**
 * Contact Memory — read/write per-contact AI memory.
 *
 * The ai_memory collection stores key facts extracted from conversations
 * (e.g. customer preferences, previous issues, language, sentiment).
 * This provides continuity across multiple conversations.
 */

import { connectToDatabase } from '@/lib/mongodb'
import type { ContactMemory } from './types'

/**
 * Fetch the AI memory for a contact from MongoDB.
 * Returns null if no memory exists yet (first interaction).
 */
export async function getContactMemory(
  userId: string,
  contactId: string
): Promise<ContactMemory | null> {
  try {
    const { db } = await connectToDatabase()
    const data = await db.collection('ai_memory').findOne({
      user_id: userId,
      contact_id: contactId,
    })

    if (!data) return null

    return {
      userId: data.user_id,
      contactId: data.contact_id,
      facts: (data.facts as Record<string, string>) || {},
      lastIntent: data.last_intent,
      lastLanguage: data.last_language,
      lastSentiment: data.last_sentiment,
      totalInteractions: data.total_interactions || 0,
      updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
    }
  } catch (err) {
    console.error('[AI/memory] getContactMemory failed:', err)
    return null
  }
}

/**
 * Upsert AI memory for a contact in MongoDB.
 * Merges new facts with existing ones — existing keys are overwritten,
 * new keys are added.
 */
export async function updateContactMemory(
  userId: string,
  contactId: string,
  updates: Partial<Omit<ContactMemory, 'userId' | 'contactId' | 'updatedAt'>>
): Promise<void> {
  try {
    const { db } = await connectToDatabase()

    // Fetch existing record to merge facts
    const existing = await db.collection('ai_memory').findOne({
      user_id: userId,
      contact_id: contactId,
    })

    const mergedFacts = {
      ...(existing?.facts || {}),
      ...(updates.facts || {}),
    }

    await db.collection('ai_memory').updateOne(
      {
        user_id: userId,
        contact_id: contactId,
      },
      {
        $set: {
          facts: mergedFacts,
          last_intent: updates.lastIntent ?? existing?.last_intent ?? null,
          last_language: updates.lastLanguage ?? existing?.last_language ?? 'en',
          last_sentiment: updates.lastSentiment ?? existing?.last_sentiment ?? 'neutral',
          total_interactions:
            (existing?.total_interactions || 0) + (updates.totalInteractions || 0),
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    )
  } catch (err) {
    console.error('[AI/memory] updateContactMemory failed:', err)
  }
}

/**
 * Format contact memory as a brief context string for the AI prompt.
 */
export function formatMemoryForPrompt(memory: ContactMemory | null): string {
  if (!memory) return ''

  const parts: string[] = []

  if (memory.lastLanguage && memory.lastLanguage !== 'en') {
    parts.push(`Customer's preferred language: ${memory.lastLanguage}`)
  }

  const facts = Object.entries(memory.facts)
  if (facts.length > 0) {
    const factLines = facts
      .slice(0, 10) // limit to top 10 facts
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n')
    parts.push(`Known facts about this customer:\n${factLines}`)
  }

  if (memory.totalInteractions > 0) {
    parts.push(`Previous AI interactions: ${memory.totalInteractions}`)
  }

  if (parts.length === 0) return ''
  return `--- CUSTOMER CONTEXT ---\n${parts.join('\n')}\n--- END CONTEXT ---`
}
