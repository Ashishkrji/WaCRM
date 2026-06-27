/**
 * Tenant Manager — SaaS tenant isolation and management.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  domain: string | null
  status: string
  plan_name: string
  member_count: number
  owner_id: string
}

// ─────────────────────────────────────────────
// Resolve tenant from request
// ─────────────────────────────────────────────

export async function resolveTenant(hostOrSlug: string): Promise<TenantInfo | null> {
  const db = supabaseAdmin()
  // Try by custom domain first, then by slug
  const { data } = await db
    .from('tenants')
    .select('*, subscription_plans(name), tenant_members(count)')
    .or(`domain.eq.${hostOrSlug},slug.eq.${hostOrSlug}`)
    .single()

  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    domain: data.domain,
    status: data.status,
    plan_name: (data.subscription_plans as Record<string, string>)?.name ?? 'Free',
    member_count: Number((data.tenant_members as Array<{ count: number }>)?.[0]?.count ?? 0),
    owner_id: data.owner_id,
  }
}

// ─────────────────────────────────────────────
// Invite member
// ─────────────────────────────────────────────

export async function inviteTenantMember(tenantId: string, email: string, role: string, invitedBy: string): Promise<void> {
  const db = supabaseAdmin()
  // Look up user by email
  const { data: users } = await db.from('auth.users' as never).select('id').eq('email', email).limit(1)
  const userId = (users as Array<{ id: string }>)?.[0]?.id
  if (!userId) throw new Error(`User with email ${email} not found`)

  const { error } = await db.from('tenant_members').insert({
    tenant_id: tenantId,
    user_id: userId,
    role,
    invited_by: invitedBy,
    invited_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────
// Remove member
// ─────────────────────────────────────────────

export async function removeTenantMember(tenantId: string, userId: string): Promise<void> {
  const db = supabaseAdmin()
  await db.from('tenant_members').delete().eq('tenant_id', tenantId).eq('user_id', userId)
}

// ─────────────────────────────────────────────
// Log audit event
// ─────────────────────────────────────────────

export async function logAuditEvent(params: {
  tenantId: string
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  const db = supabaseAdmin()
  await db.from('tenant_audit_log').insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    action: params.action,
    resource: params.resource,
    resource_id: params.resourceId,
    changes: params.changes ?? {},
    ip_address: params.ipAddress,
  })
}

// ─────────────────────────────────────────────
// Suspend / reactivate tenant
// ─────────────────────────────────────────────

export async function updateTenantStatus(tenantId: string, status: 'active' | 'suspended' | 'cancelled'): Promise<void> {
  const db = supabaseAdmin()
  await db.from('tenants').update({ status, updated_at: new Date().toISOString() }).eq('id', tenantId)
}
