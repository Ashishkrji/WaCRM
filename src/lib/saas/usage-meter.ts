/**
 * Usage Meter — per-tenant usage tracking and quota enforcement.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import { checkAndIncrementUsage } from './feature-flags'

export { checkAndIncrementUsage }

// ─────────────────────────────────────────────
// Initialize quotas for a new tenant from plan limits
// ─────────────────────────────────────────────

export async function initializeTenantQuotas(tenantId: string, planCode: string): Promise<void> {
  const db = supabaseAdmin()
  const { data: plan } = await db.from('subscription_plans').select('limits').eq('code', planCode).single()
  const limits = (plan?.limits as Record<string, number>) ?? {}

  const rows = Object.entries(limits).map(([resource, limit]) => ({
    tenant_id: tenantId,
    resource,
    limit_value: limit,
    current_value: 0,
    reset_period: ['messages', 'ai_requests'].includes(resource) ? 'monthly' : 'never',
    is_hard_limit: resource !== 'contacts',
  }))

  await db.from('usage_quotas').upsert(rows, { onConflict: 'tenant_id,resource' })
}

// ─────────────────────────────────────────────
// Reset monthly quotas (called by cron)
// ─────────────────────────────────────────────

export async function resetMonthlyQuotas(): Promise<number> {
  const db = supabaseAdmin()
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data } = await db
    .from('usage_quotas')
    .update({ current_value: 0, reset_at: now.toISOString() })
    .eq('reset_period', 'monthly')
    .lt('reset_at', firstOfMonth)
    .select('id')

  return (data ?? []).length
}

// ─────────────────────────────────────────────
// Get usage report for a tenant
// ─────────────────────────────────────────────

export async function getUsageReport(tenantId: string) {
  const db = supabaseAdmin()

  const [{ data: quotas }, { data: recentEvents }] = await Promise.all([
    db.from('usage_quotas').select('resource, current_value, limit_value, reset_period').eq('tenant_id', tenantId),
    db.from('usage_events').select('resource, quantity, created_at').eq('tenant_id', tenantId).gte('created_at', new Date(Date.now() - 30 * 86_400_000).toISOString()).order('created_at', { ascending: false }).limit(100),
  ])

  const byResource: Record<string, { daily: number[]; total: number }> = {}
  for (const ev of recentEvents ?? []) {
    if (!byResource[ev.resource]) byResource[ev.resource] = { daily: new Array(30).fill(0), total: 0 }
    const daysAgo = Math.floor((Date.now() - new Date(ev.created_at).getTime()) / 86_400_000)
    if (daysAgo < 30) byResource[ev.resource].daily[daysAgo] += ev.quantity
    byResource[ev.resource].total += ev.quantity
  }

  return {
    quotas: (quotas ?? []).map(q => ({
      resource: q.resource,
      used: q.current_value,
      limit: q.limit_value,
      pct: q.limit_value > 0 ? Math.min(100, Math.round((q.current_value / q.limit_value) * 100)) : 0,
      reset_period: q.reset_period,
    })),
    trend: byResource,
  }
}

// ─────────────────────────────────────────────
// Track specific CRM actions
// ─────────────────────────────────────────────

export async function trackContactCreated(tenantId: string): Promise<boolean> {
  const { allowed } = await checkAndIncrementUsage(tenantId, 'contacts', 1)
  return allowed
}

export async function trackMessageSent(tenantId: string): Promise<boolean> {
  const { allowed } = await checkAndIncrementUsage(tenantId, 'messages', 1)
  return allowed
}

export async function trackAIRequest(tenantId: string): Promise<boolean> {
  const { allowed } = await checkAndIncrementUsage(tenantId, 'ai_requests', 1)
  return allowed
}

export async function trackWorkflowExecution(tenantId: string): Promise<boolean> {
  const { allowed } = await checkAndIncrementUsage(tenantId, 'workflows', 1)
  return allowed
}
