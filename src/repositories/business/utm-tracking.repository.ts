import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class UTMTrackingRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'utm_tracking');
  }
}
