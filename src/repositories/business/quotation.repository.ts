import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class QuotationRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) { super(client, 'quotation_requests'); }
  async getRecentQuotationRequests(contactId: string, limit = 3) {
    const { data } = await this.client.from(this.tableName).select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(limit);
    return data || [];
  }
  async createQuotationRequest(userId: string, contactId: string, conversationId: string, serviceRequired: string, items: any[], totalAmount: number) {
    const { data } = await this.client.from(this.tableName).insert({ user_id: userId, contact_id: contactId, conversation_id: conversationId, service_required: serviceRequired, items, total_amount: totalAmount, status: 'pending' }).select('id').single();
    return data?.id || null;
  }
}
