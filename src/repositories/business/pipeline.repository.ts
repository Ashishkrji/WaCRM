import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class PipelineRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) { super(client, 'pipelines'); }
  async getUserPipeline(userId: string) {
    const { data } = await this.client.from(this.tableName).select('*').eq('user_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle();
    return data || null;
  }
  async getFirstPipelineStage(pipelineId: string) {
    const { data } = await this.client.from('pipeline_stages').select('*').eq('pipeline_id', pipelineId).order('order_index', { ascending: true }).limit(1).maybeSingle();
    return data || null;
  }
}
