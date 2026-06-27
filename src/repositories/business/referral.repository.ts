import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class ReferralRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'referrals');
  }
}
