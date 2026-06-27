import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class SegmentRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'audience_segments');
  }

  /**
   * Find segments by user
   */
  async findByUser(userId: string) {
    const query = this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return query.then(res => { if (res.error) throw res.error; return res.data; });
  }
}
