import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class WorkflowExecutionRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) {
    super(client, 'workflow_executions');
  }
}
