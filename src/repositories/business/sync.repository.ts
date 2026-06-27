import { SupabaseClient } from '@supabase/supabase-js';

export class SyncRepository {
  private client: SupabaseClient;
  constructor(client: SupabaseClient) { this.client = client; }

  async syncLead(organizationId: string, lead: any) {
    // Basic sync lead logic to avoid breaking anything
    const { data } = await this.client.from('contacts').upsert({ user_id: organizationId, phone: lead.phone, name: lead.name }, { onConflict: 'user_id,phone' }).select().single();
    return data;
  }
}
