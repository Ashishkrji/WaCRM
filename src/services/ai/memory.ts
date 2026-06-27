/**
 * Contact Memory — read/write per-contact AI memory.
 *
 * The ai_memory collection stores key facts extracted from conversations
 * (e.g. customer preferences, previous issues, language, sentiment).
 * This provides continuity across multiple conversations.
 */

import { memoryRepo, dealRepo, meetingRepo, quotationRepo, proposalRepo } from '@/repositories'
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
    return await memoryRepo.getContactMemory(userId, contactId)
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
    await memoryRepo.updateContactMemory(userId, contactId, updates)
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

/**
 * Compile and format a unified context containing:
 *   1. Long-term memory: facts extracted from MongoDB
 *   2. Medium-term memory: recent CRM objects (deals, quotes, proposals, bookings) from PostgreSQL
 *   3. Short-term memory context: last intent, last language, last sentiment
 */
export async function getUnifiedMemoryContext(
  userId: string,
  contactId: string
): Promise<string> {
  const parts: string[] = []

  try {
    // 1. Fetch Long-term Memory from MongoDB Atlas
    const longTermMemory = await getContactMemory(userId, contactId)
    
    // 2. Fetch Medium-term Memory from Supabase PostgreSQL (via dbService)
    const [deals, bookings, quotes, proposals] = await Promise.all([
      dealRepo.getRecentDeals(contactId, 3).catch(() => []),
      meetingRepo.getRecentMeetingBookings(contactId, 3).catch(() => []),
      quotationRepo.getRecentQuotationRequests(contactId, 3).catch(() => []),
      proposalRepo.getRecentProposalRequests(contactId, 3).catch(() => []),
    ])

    // Format Long-term memory
    if (longTermMemory) {
      const facts = Object.entries(longTermMemory.facts)
      if (facts.length > 0) {
        const factLines = facts
          .map(([k, v]) => `- ${k}: ${v}`)
          .join('\n')
        parts.push(`### LONG-TERM CUSTOMER FACTS & PREFERENCES:\n${factLines}`)
      }
      
      // Short-term summary states
      const stParts: string[] = []
      if (longTermMemory.lastLanguage) stParts.push(`Preferred Language: ${longTermMemory.lastLanguage}`)
      if (longTermMemory.lastIntent) stParts.push(`Last Message Intent: ${longTermMemory.lastIntent}`)
      if (longTermMemory.lastSentiment) stParts.push(`Last Message Sentiment: ${longTermMemory.lastSentiment}`)
      if (longTermMemory.totalInteractions > 0) stParts.push(`Total AI Interactions: ${longTermMemory.totalInteractions}`)
      
      if (stParts.length > 0) {
        parts.push(`### SHORT-TERM CONTEXT & METRICS:\n${stParts.map(s => `- ${s}`).join('\n')}`)
      }
    }

    // Format Medium-term memory
    const crmLines: string[] = []
    
    if (deals && deals.length > 0) {
      deals.forEach((d: any) => {
        crmLines.push(`- Deal: "${d.title}" | Value: ${d.currency} ${d.value} | Status: ${d.status} (Created: ${new Date(d.created_at).toLocaleDateString()})`)
      })
    }
    
    if (bookings && bookings.length > 0) {
      bookings.forEach((b: any) => {
        crmLines.push(`- Scheduled Meeting: "${b.title}" | Time: ${new Date(b.start_time).toLocaleString()} | Status: ${b.status}`)
      })
    }

    if (quotes && quotes.length > 0) {
      quotes.forEach((q: any) => {
        crmLines.push(`- Quotation Request: "${q.service_required}" | Total: INR ${q.total_amount} | Status: ${q.status}`)
      })
    }

    if (proposals && proposals.length > 0) {
      proposals.forEach((p: any) => {
        crmLines.push(`- Proposal Request: "${p.service_required}" | Status: ${p.status}`)
      })
    }

    if (crmLines.length > 0) {
      parts.push(`### MEDIUM-TERM CRM HISTORY:\n${crmLines.join('\n')}`)
    }

  } catch (err) {
    console.error('[AI/memory] getUnifiedMemoryContext failed:', err)
  }

  if (parts.length === 0) return ''
  
  return `\n--- UNIFIED CUSTOMER CONTEXT & CRM MEMORY ---\n${parts.join('\n\n')}\n--- END CONTEXT ---\n`
}
