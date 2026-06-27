import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // 1. Get user's employee record to find their role
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('role_id')
      .eq('id', userId)
      .single();

    if (empError || !employee?.role_id) {
      // If no employee record or role, deny access
      return false;
    }

    // 2. Check if the role is a system Super Admin (optional fast path)
    const { data: role } = await supabase
      .from('roles')
      .select('name, is_system')
      .eq('id', employee.role_id)
      .single();

    if (role?.name === 'Super Admin' && role.is_system) {
      return true; // Super admins can do everything
    }

    // 3. Query permissions for this role
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select(`
        permissions!inner(module, action)
      `)
      .eq('role_id', employee.role_id);

    if (permError || !permissions) {
      return false;
    }

    // 4. Verify if the requested module and action exist in the user's permissions
    const hasAccess = permissions.some(
      (rp: any) => rp.permissions.module === module && rp.permissions.action === action
    );

    return hasAccess;
  } catch (err) {
    console.error('RBAC Error:', err);
    return false;
  }
}
