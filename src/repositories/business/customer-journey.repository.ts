import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class CustomerJourneyRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'customer_journeys');
  }
}
