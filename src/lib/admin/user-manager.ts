/**
 * User Manager — Admin user lifecycle operations.
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { auditLog } from './audit-logger'

// ─────────────────────────────────────────────
// Get all users with profiles
// ─────────────────────────────────────────────

export async function getAllUsers(params: { page?: number; limit?: number; role?: string; status?: string; search?: string }) {
  const db = supabaseAdmin()
  const limit = params.limit ?? 50
  const page = params.page ?? 1

  let query = db
    .from('profiles')
    .select('*, user_roles(role_code, is_active)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (params.role) query = query.eq('role', params.role)
  if (params.status) query = query.eq('status', params.status)
  if (params.search) query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)
  return { users: data ?? [], count: count ?? 0 }
}

// ─────────────────────────────────────────────
// Suspend / activate user
// ─────────────────────────────────────────────

export async function setUserStatus(targetUserId: string, adminUserId: string, status: 'active' | 'suspended'): Promise<void> {
  const db = supabaseAdmin()
  await db.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('user_id', targetUserId)
  await auditLog({ userId: adminUserId, action: status === 'suspended' ? 'user.suspended' : 'user.activated', module: 'users', resourceId: targetUserId, severity: 'warning' })
}

// ─────────────────────────────────────────────
// Update user role
// ─────────────────────────────────────────────

export async function updateUserRole(targetUserId: string, adminUserId: string, role: string): Promise<void> {
  const db = supabaseAdmin()
  const allowedRoles = ['super_admin', 'admin', 'manager', 'staff', 'user']
  if (!allowedRoles.includes(role)) throw new Error('Invalid role')
  await db.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('user_id', targetUserId)
  await auditLog({ userId: adminUserId, action: 'role.assigned', module: 'users', resourceId: targetUserId, newValue: { role }, severity: 'warning' })
}

// ─────────────────────────────────────────────
// Force password reset
// ─────────────────────────────────────────────

export async function forcePasswordReset(targetUserId: string, adminUserId: string): Promise<void> {
  const db = supabaseAdmin()
  await db.from('profiles').update({ force_password_reset: true }).eq('user_id', targetUserId)
  await auditLog({ userId: adminUserId, action: 'user.updated', module: 'users', resourceId: targetUserId, newValue: { force_password_reset: true } })
}

// ─────────────────────────────────────────────
// Get user detail with sessions and login history
// ─────────────────────────────────────────────

export async function getUserDetail(userId: string) {
  const db = supabaseAdmin()
  const [{ data: profile }, { data: roles }, { data: auditLogs }] = await Promise.all([
    db.from('profiles').select('*').eq('user_id', userId).single(),
    db.from('user_roles').select('role_code, granted_at, is_active').eq('user_id', userId),
    db.from('activity_logs').select('action, module, ip_address, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ])
  return { profile, roles: roles ?? [], recent_activity: auditLogs ?? [] }
}

// ─────────────────────────────────────────────
// Get dashboard user stats
// ─────────────────────────────────────────────

export async function getUserStats() {
  const db = supabaseAdmin()
  const { data: profiles } = await db.from('profiles').select('status, role, created_at')
  const all = profiles ?? []
  return {
    total: all.length,
    active: all.filter(p => p.status === 'active').length,
    suspended: all.filter(p => p.status === 'suspended').length,
    admins: all.filter(p => ['super_admin', 'admin'].includes(p.role)).length,
    this_month: all.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth()).length,
  }
}
