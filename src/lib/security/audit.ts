import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { AuditLog } from '@/types/security';

export async function logSecurityEvent(params: Omit<AuditLog, 'id' | 'created_at'>) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from('audit_logs').insert([
      {
        user_id: params.user_id,
        action: params.action,
        module: params.module,
        entity_id: params.entity_id,
        old_value: params.old_value,
        new_value: params.new_value,
        ip_address: params.ip_address,
        device_info: params.device_info,
      },
    ]);

    if (error) {
      console.error('Failed to write audit log:', error);
    }
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
}
