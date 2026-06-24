import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { phonesMatch } from '@/lib/whatsapp/phone-utils'

let _adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      throw new Error('Supabase URL or Service Role Key is missing in env')
    }
    _adminClient = createClient(url, serviceKey)
  }
  return _adminClient
}

export class BusinessService {
  private getClient(customClient?: SupabaseClient): SupabaseClient {
    return customClient || getSupabaseAdmin()
  }

  // ==========================================
  // Contacts & Leads
  // ==========================================

  async findContactById(contactId: string, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .maybeSingle()

    if (error) {
      console.error('[BusinessService] findContactById failed:', error)
      throw error
    }
    return data
  }

  async findContactByPhone(userId: string, phone: string, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data: contacts, error } = await client
      .from('contacts')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('[BusinessService] findContactByPhone failed:', error)
      throw error
    }

    return contacts?.find((c) => phonesMatch(c.phone, phone)) || null
  }

  async createContact(userId: string, phone: string, name: string, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('contacts')
      .insert({
        user_id: userId,
        phone,
        name: name || phone,
      })
      .select()
      .single()

    if (error) {
      console.error('[BusinessService] createContact failed:', error)
      throw error
    }
    return data
  }

  async updateContact(contactId: string, updates: Record<string, any>, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .select()
      .single()

    if (error) {
      console.error('[BusinessService] updateContact failed:', error)
      throw error
    }
    return data
  }

  // ==========================================
  // Conversations
  // ==========================================

  async findConversationById(conversationId: string, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle()

    if (error) {
      console.error('[BusinessService] findConversationById failed:', error)
      throw error
    }
    return data
  }

  async findConversationByContact(userId: string, contactId: string, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('[BusinessService] findConversationByContact failed:', error)
      throw error
    }
    return data || null
  }

  async findConversationsByIds(conversationIds: string[], customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('conversations')
      .select(`
        id,
        last_message_text,
        last_message_at,
        contacts (
          id,
          name,
          phone
        )
      `)
      .in('id', conversationIds)

    if (error) {
      console.error('[BusinessService] findConversationsByIds failed:', error)
      throw error
    }
    return data || []
  }

  async createConversation(userId: string, contactId: string, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('conversations')
      .insert({
        user_id: userId,
        contact_id: contactId,
      })
      .select()
      .single()

    if (error) {
      console.error('[BusinessService] createConversation failed:', error)
      throw error
    }
    return data
  }

  async updateConversation(conversationId: string, updates: Record<string, any>, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      console.error('[BusinessService] updateConversation failed:', error)
      throw error
    }
    return data
  }

  // ==========================================
  // Messages
  // ==========================================

  async createMessage(messageData: Record<string, any>, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('[BusinessService] createMessage failed:', error)
      throw error
    }
    return data
  }

  async updateMessageStatus(messageId: string, status: string, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('messages')
      .update({ status })
      .eq('message_id', messageId)
      .select()

    if (error) {
      console.error('[BusinessService] updateMessageStatus failed:', error)
      throw error
    }
    return data
  }

  async countCustomerMessages(conversationId: string, customClient?: SupabaseClient): Promise<number> {
    const client = this.getClient(customClient)
    const { count, error } = await client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'customer')

    if (error) {
      console.error('[BusinessService] countCustomerMessages failed:', error)
      throw error
    }
    return count ?? 0
  }

  async countTotalMessages(conversationId: string, customClient?: SupabaseClient): Promise<number> {
    const client = this.getClient(customClient)
    const { count, error } = await client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('[BusinessService] countTotalMessages failed:', error)
      throw error
    }
    return count ?? 0
  }

  async getRecentMessages(conversationId: string, limit = 20, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('messages')
      .select('sender_type, content_text, created_at')
      .eq('conversation_id', conversationId)
      .not('content_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[BusinessService] getRecentMessages failed:', error)
      throw error
    }
    return data || []
  }

  // ==========================================
  // Settings
  // ==========================================

  async getAIRouterConfig(userId: string, customClient?: SupabaseClient) {
    const client = this.getClient(customClient)
    const { data, error } = await client
      .from('ai_router_config')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[BusinessService] getAIRouterConfig failed:', error)
      throw error
    }
    return data || null
  }

  // ==========================================
  // Meeting Bookings, Quotes, Proposals, Deals & Pipelines
  // ==========================================

  async createMeetingBooking(
    userId: string,
    contactId: string,
    conversationId: string,
    title: string,
    startTime: string,
    endTime: string,
    meetingLink: string
  ) {
    const client = this.getClient()
    const { data, error } = await client
      .from('meeting_bookings')
      .insert({
        user_id: userId,
        contact_id: contactId,
        conversation_id: conversationId,
        title,
        start_time: startTime,
        end_time: endTime,
        meeting_link: meetingLink,
        status: 'scheduled',
      })
      .select('id')
      .single()

    if (error) throw error
    return data?.id || null
  }

  async createQuotationRequest(
    userId: string,
    contactId: string,
    conversationId: string,
    serviceRequired: string,
    items: any[],
    totalAmount: number
  ) {
    const client = this.getClient()
    const { data, error } = await client
      .from('quotation_requests')
      .insert({
        user_id: userId,
        contact_id: contactId,
        conversation_id: conversationId,
        service_required: serviceRequired,
        items,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw error
    return data?.id || null
  }

  async createProposalRequest(
    userId: string,
    contactId: string,
    conversationId: string,
    serviceRequired: string,
    details: any
  ) {
    const client = this.getClient()
    const { data, error } = await client
      .from('proposal_requests')
      .insert({
        user_id: userId,
        contact_id: contactId,
        conversation_id: conversationId,
        service_required: serviceRequired,
        details,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw error
    return data?.id || null
  }

  async upsertLeadScore(
    userId: string,
    contactId: string,
    score: number,
    tier: string,
    reasoning: string,
    provider: string
  ) {
    const client = this.getClient()
    const { error } = await client
      .from('lead_scores')
      .upsert(
        {
          user_id: userId,
          contact_id: contactId,
          score,
          tier,
          reasoning,
          provider,
          scored_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,contact_id' }
      )

    if (error) throw error
  }

  async getActiveDeal(contactId: string) {
    const client = this.getClient()
    const { data, error } = await client
      .from('deals')
      .select('id')
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .limit(1)

    if (error) throw error
    return data || null
  }

  async getUserPipeline(userId: string) {
    const client = this.getClient()
    const { data, error } = await client
      .from('pipelines')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data || null
  }

  async getFirstPipelineStage(pipelineId: string) {
    const client = this.getClient()
    const { data, error } = await client
      .from('pipeline_stages')
      .select('id, name')
      .eq('pipeline_id', pipelineId)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data || null
  }

  async createDeal(dealData: Record<string, any>) {
    const client = this.getClient()
    const { data, error } = await client
      .from('deals')
      .insert(dealData)
      .select('id')
      .single()

    if (error) throw error
    return data?.id || null
  }

  async getRecentMeetingBookings(contactId: string, limit = 5) {
    const client = this.getClient()
    const { data, error } = await client
      .from('meeting_bookings')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  async getRecentQuotationRequests(contactId: string, limit = 5) {
    const client = this.getClient()
    const { data, error } = await client
      .from('quotation_requests')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  async getRecentProposalRequests(contactId: string, limit = 5) {
    const client = this.getClient()
    const { data, error } = await client
      .from('proposal_requests')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  async getRecentDeals(contactId: string, limit = 5) {
    const client = this.getClient()
    const { data, error } = await client
      .from('deals')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}
