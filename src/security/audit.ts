/**
 * Centralized Audit Logging Service
 */
import { createClient } from '@/lib/supabase/client';

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE_LEAD' 
  | 'UPDATE_LEAD'
  | 'DELETE_LEAD'
  | 'UPDATE_PERMISSION'
  | 'SETTINGS_CHANGE'
  | 'API_CALL'
  | 'SYSTEM_ERROR';

export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  action: AuditAction;
  module: string;
  ipAddress?: string;
  details: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
}

export async function logAuditAction(entry: AuditLogEntry) {
  try {
    // In a real environment, this inserts into a dedicated Supabase 'audit_logs' table.
    // Ensure you create the table `audit_logs` in Supabase with RLS enabled.
    
    const supabase = createClient();
    
    const { error } = await supabase.from('audit_logs').insert([
      {
        user_id: entry.userId,
        organization_id: entry.organizationId,
        action: entry.action,
        module: entry.module,
        ip_address: entry.ipAddress,
        details: entry.details,
        status: entry.status,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Audit log failed to insert:', error);
    }
  } catch (error) {
    // Fallback: don't crash the application if audit logging fails
    console.error('Audit logging error:', error);
  }
}
