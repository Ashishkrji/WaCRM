/**
 * Feature Flag Manager
 * Plan-based feature gating for SaaS multi-tenancy.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'

// ─────────────────────────────────────────────
// Check if a feature is enabled for a user
// ─────────────────────────────────────────────

export async function isFeatureEnabled(userId: string, featureKey: string): Promise<boolean> {
  const db = supabaseAdmin()

  // Check tenant feature override first
  const { data: override } = await db
    .from('tenant_feature_overrides')
    .select('is_enabled, expires_at')
    .eq('feature_key', featureKey)
    .eq('tenant_id', db.from('tenant_members').select('tenant_id').eq('user_id', userId).limit(1) as never)
    .single()

  if (override) {
    if (override.expires_at && new Date(override.expires_at) < new Date()) return false
    return override.is_enabled
  }

  // Check plan-based access
  const { data: sub } = await db
    .from('user_subscriptions')
    .select('status, plan_id, subscription_plans(code)')
    .eq('user_id', userId)
    .single()

  const plans = sub?.subscription_plans as any
  const planCode = (Array.isArray(plans) ? plans[0]?.code : plans?.code) ?? 'free'
  const subStatus = sub?.status ?? 'trial'

  // Trial has full access
  if (subStatus === 'trial') return true

  const { data: flag } = await db
    .from('feature_flags')
    .select('is_global, plan_codes')
    .eq('feature_key', featureKey)
    .single()

  if (!flag) return false
  if (flag.is_global) return true

  return (flag.plan_codes as string[]).includes(planCode)
}

// ─────────────────────────────────────────────
// Get all features for a user
// ─────────────────────────────────────────────

export async function getUserFeatures(userId: string): Promise<Record<string, boolean>> {
  const db = supabaseAdmin()

  const { data: flags } = await db
    .from('feature_flags')
    .select('feature_key, is_global, plan_codes')

  if (!flags) return {}

  const { data: sub } = await db
    .from('user_subscriptions')
    .select('status, subscription_plans(code)')
    .eq('user_id', userId)
    .single()

  const plans = sub?.subscription_plans as any
  const planCode = (Array.isArray(plans) ? plans[0]?.code : plans?.code) ?? 'free'
  const isTrialOrActive = sub?.status === 'trial' || sub?.status === 'active'

  const result: Record<string, boolean> = {}
  for (const flag of flags) {
    if (flag.is_global) {
      result[flag.feature_key] = true
    } else if (isTrialOrActive && sub?.status === 'trial') {
      result[flag.feature_key] = true
    } else {
      result[flag.feature_key] = (flag.plan_codes as string[]).includes(planCode)
    }
  }

  return result
}

// ─────────────────────────────────────────────
// Usage quota check and increment
// ─────────────────────────────────────────────

export async function checkAndIncrementUsage(
  tenantId: string,
  resource: string,
  quantity = 1,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const db = supabaseAdmin()

  const { data: quota } = await db
    .from('usage_quotas')
    .select('current_value, limit_value, is_hard_limit')
    .eq('tenant_id', tenantId)
    .eq('resource', resource)
    .single()

  if (!quota) {
    // No quota configured = unlimited
    await db.from('usage_events').insert({ tenant_id: tenantId, resource, quantity })
    return { allowed: true, current: quantity, limit: -1 }
  }

  const limit = quota.limit_value
  const current = quota.current_value

  if (limit > 0 && quota.is_hard_limit && current + quantity > limit) {
    return { allowed: false, current, limit }
  }

  // Increment
  await db
    .from('usage_quotas')
    .update({ current_value: current + quantity, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('resource', resource)

  await db.from('usage_events').insert({ tenant_id: tenantId, resource, quantity })

  return { allowed: true, current: current + quantity, limit }
}

// ─────────────────────────────────────────────
// Get tenant usage summary
// ─────────────────────────────────────────────

export async function getTenantUsage(tenantId: string): Promise<Record<string, { current: number; limit: number; pct: number }>> {
  const db = supabaseAdmin()
  const { data: quotas } = await db
    .from('usage_quotas')
    .select('resource, current_value, limit_value')
    .eq('tenant_id', tenantId)

  const result: Record<string, { current: number; limit: number; pct: number }> = {}
  for (const q of quotas ?? []) {
    const current = Number(q.current_value)
    const limit = Number(q.limit_value)
    const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0
    result[q.resource] = { current, limit, pct }
  }
  return result
}
