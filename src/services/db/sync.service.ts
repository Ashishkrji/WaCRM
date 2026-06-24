import type { BusinessService } from './business.service'
import type { AIService } from './ai.service'

export class SyncService {
  constructor(
    private business: BusinessService,
    private ai: AIService
  ) {}

  /**
   * Synchronize lead information.
   * Creates/retrieves a contact in Supabase and ensures an AI Memory record is established
   * in MongoDB Atlas, linked by the same Lead/Contact ID.
   */
  async syncLead(
    userId: string,
    leadData: {
      phone: string
      name: string
      facts?: Record<string, string>
    }
  ) {
    // 1. Store structured lead information in Supabase
    let contact = await this.business.findContactByPhone(userId, leadData.phone)
    let wasCreated = false

    if (!contact) {
      contact = await this.business.createContact(userId, leadData.phone, leadData.name)
      wasCreated = true
    } else if (leadData.name && leadData.name !== contact.name) {
      contact = await this.business.updateContact(contact.id, { name: leadData.name })
    }

    const leadId = contact.id

    // 2. Initialize/Upsert AI Memory in MongoDB Atlas using the same Lead ID (contactId)
    const existingMemory = await this.ai.getContactMemory(userId, leadId)
    
    // Merge provided facts with existing or default facts
    const initialFacts = leadData.facts || {}
    
    await this.ai.updateContactMemory(userId, leadId, {
      facts: initialFacts,
      lastIntent: existingMemory?.lastIntent || null,
      lastLanguage: existingMemory?.lastLanguage || 'en',
      lastSentiment: existingMemory?.lastSentiment || 'neutral',
      totalInteractions: 0, // No new interaction, just syncing structure
    })

    return {
      leadId,
      contact,
      wasCreated,
      memoryInitialized: !existingMemory,
    }
  }
}
