import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class DealRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) { super(client, 'deals'); }
  async getRecentDeals(contactId: string, limit = 3) {
    const { data } = await this.client.from(this.tableName).select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(limit);
    return data || [];
  }
  async getActiveDeal(contactId: string) {
    const { data } = await this.client.from(this.tableName).select('*').eq('contact_id', contactId).neq('status', 'lost').neq('status', 'won').order('created_at', { ascending: false }).limit(1).maybeSingle();
    return data || null;
  }
}
