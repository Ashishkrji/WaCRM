import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class WebhookConfigRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'webhook_configurations');
  }
}
