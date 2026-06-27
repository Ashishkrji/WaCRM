import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class LeadScoreRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) { super(client, 'lead_scores'); }
  async upsertLeadScore(contactId: string, organizationId: string, score: number, aiRationale: string) {
    const { data } = await this.client.from(this.tableName).upsert({ contact_id: contactId, user_id: organizationId, score, ai_rationale: aiRationale, updated_at: new Date().toISOString() }, { onConflict: 'contact_id' }).select().single();
    return data || null;
  }
}
