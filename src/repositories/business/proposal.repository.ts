import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class ProposalRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) { super(client, 'proposal_requests'); }
  async getRecentProposalRequests(contactId: string, limit = 3) {
    const { data } = await this.client.from(this.tableName).select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(limit);
    return data || [];
  }
  async createProposalRequest(userId: string, contactId: string, conversationId: string, projectScope: string, estimatedBudget: number) {
    const { data } = await this.client.from(this.tableName).insert({ user_id: userId, contact_id: contactId, conversation_id: conversationId, project_scope: projectScope, estimated_budget: estimatedBudget, status: 'draft' }).select('id').single();
    return data?.id || null;
  }
}
