import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class WorkflowScheduleRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'workflow_schedules');
  }
}
