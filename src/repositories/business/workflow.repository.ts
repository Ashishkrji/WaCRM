import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class WorkflowRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'workflows');
  }

  async findActiveByTrigger(userId: string, triggerType: string) {
    const query = this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('trigger_type', triggerType);
    return query.then(res => { if (res.error) throw res.error; return res.data; });
  }
}
