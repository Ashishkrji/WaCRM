import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class CampaignRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'campaigns');
  }

  /**
   * Find campaigns by audience segment
   */
  async findBySegmentId(userId: string, segmentId: string) {
    const query = this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('audience_segment_id', segmentId)
      .order('created_at', { ascending: false });

    return query.then(res => { if (res.error) throw res.error; return res.data; });
  }

  /**
   * Find active campaigns
   */
  async findActiveCampaigns(userId: string) {
    const query = this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return query.then(res => { if (res.error) throw res.error; return res.data; });
  }

  /**
   * Update campaign analytics
   */
  async updateAnalytics(campaignId: string, analytics: { cost?: number; revenue?: number; click_count?: number; response_count?: number; conversion_count?: number }) {
    const query = this.client
      .from(this.tableName)
      .update(analytics)
      .eq('id', campaignId)
      .select()
      .single();

    return query.then(res => { if (res.error) throw res.error; return res.data; });
  }
}
