import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class EmailCampaignRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'email_campaigns');
  }

  async findByCampaignId(userId: string, campaignId: string) {
    const query = this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    return query.then(res => { if (res.error) throw res.error; return res.data; });
  }
}
