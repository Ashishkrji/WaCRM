/**
 * RBAC — Role-Based Access Control
 * Checks permissions for users at runtime.
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type Action = 'view' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'import'

// ─────────────────────────────────────────────
// Get user's effective permissions
// ─────────────────────────────────────────────

export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const db = supabaseAdmin()

  // Get user roles
  const { data: userRoles } = await db
    .from('user_roles')
    .select('role_code')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

  // Also get legacy profile role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single()

  const roleCodes = new Set<string>([
    ...(userRoles ?? []).map(r => r.role_code),
    ...(profile?.role ? [profile.role] : []),
  ])

  // Super admin gets everything
  if (roleCodes.has('super_admin')) {
    return new Set(['*'])
  }

  // Get permissions for all roles
  const { data: rolePerms } = await db
    .from('role_permissions')
    .select('permission_code')
    .in('role_code', Array.from(roleCodes))
    .eq('granted', true)

  return new Set((rolePerms ?? []).map(p => p.permission_code))
}

// ─────────────────────────────────────────────
// Check a single permission
// ─────────────────────────────────────────────

export async function hasPermission(userId: string, module: string, action: Action): Promise<boolean> {
  const perms = await getUserPermissions(userId)
  if (perms.has('*')) return true
  return perms.has(`${module}.${action}`)
}

// ─────────────────────────────────────────────
// Middleware: require admin role
// ─────────────────────────────────────────────

export async function requireAdmin(): Promise<{ user: { id: string }; profile: { role: string } } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data: profile } = await db.from('profiles').select('role, status').eq('user_id', user.id).single()

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (profile.status === 'suspended') {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  return { user, profile }
}

// ─────────────────────────────────────────────
// Get all roles with permission counts
// ─────────────────────────────────────────────

export async function getRolesWithPermissions() {
  const db = supabaseAdmin()
  const { data: roles } = await db.from('crm_roles').select('*, role_permissions(permission_code, granted)').order('priority')
  return roles ?? []
}

// ─────────────────────────────────────────────
// Grant / revoke permission for a role
// ─────────────────────────────────────────────

export async function setRolePermission(roleCode: string, permissionCode: string, granted: boolean): Promise<void> {
  const db = supabaseAdmin()
  await db.from('role_permissions').upsert({ role_code: roleCode, permission_code: permissionCode, granted }, { onConflict: 'role_code,permission_code' })
}

// ─────────────────────────────────────────────
// Assign role to user
// ─────────────────────────────────────────────

export async function assignUserRole(userId: string, roleCode: string, grantedBy: string, expiresAt?: string): Promise<void> {
  const db = supabaseAdmin()
  await db.from('user_roles').upsert({
    user_id: userId,
    role_code: roleCode,
    granted_by: grantedBy,
    expires_at: expiresAt ?? null,
    is_active: true,
    granted_at: new Date().toISOString(),
  }, { onConflict: 'user_id,role_code' })
}
