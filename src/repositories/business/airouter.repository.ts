import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class AIRouterConfigRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'ai_router_config');
  }

  async getByUserId(userId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error(`[AIRouterConfigRepository] getByUserId failed:`, error);
      throw error;
    }
    return data || null;
  }
}
