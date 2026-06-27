/**
 * Subscription Manager — SaaS plan lifecycle management.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'

export interface PlanDetails {
  id: string
  name: string
  code: string
  price_monthly: number
  price_yearly: number
  currency: string
  features: Record<string, boolean>
  limits: Record<string, number>
}

// ─────────────────────────────────────────────
// Get all plans
// ─────────────────────────────────────────────

export async function getPlans(): Promise<PlanDetails[]> {
  const db = supabaseAdmin()
  const { data } = await db.from('subscription_plans').select('*').eq('is_active', true).order('price_monthly')
  return (data ?? []) as PlanDetails[]
}

// ─────────────────────────────────────────────
// Get user subscription
// ─────────────────────────────────────────────

export async function getUserSubscription(userId: string) {
  const db = supabaseAdmin()
  const { data } = await db
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', userId)
    .single()
  return data
}

// ─────────────────────────────────────────────
// Activate / upgrade subscription
// ─────────────────────────────────────────────

export async function activateSubscription(params: {
  userId: string
  planCode: string
  billingCycle: 'monthly' | 'yearly'
  gatewaySubscriptionId?: string
  gatewayCustomerId?: string
}): Promise<void> {
  const db = supabaseAdmin()
  const { data: plan } = await db.from('subscription_plans').select('id').eq('code', params.planCode).single()
  if (!plan) throw new Error(`Plan ${params.planCode} not found`)

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + (params.billingCycle === 'yearly' ? 12 : 1))

  await db.from('user_subscriptions').upsert({
    user_id: params.userId,
    plan_id: plan.id,
    status: 'active',
    billing_cycle: params.billingCycle,
    current_period_start: now.toISOString().split('T')[0],
    current_period_end: periodEnd.toISOString().split('T')[0],
    gateway_subscription_id: params.gatewaySubscriptionId,
    gateway_customer_id: params.gatewayCustomerId,
    cancel_at_period_end: false,
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' })
}

// ─────────────────────────────────────────────
// Start trial
// ─────────────────────────────────────────────

export async function startTrial(userId: string, trialDays = 14): Promise<void> {
  const db = supabaseAdmin()
  const { data: plan } = await db.from('subscription_plans').select('id').eq('code', 'growth').single()

  const trialEnd = new Date(Date.now() + trialDays * 86_400_000)
  await db.from('user_subscriptions').upsert({
    user_id: userId,
    plan_id: plan?.id,
    status: 'trial',
    billing_cycle: 'monthly',
    trial_end: trialEnd.toISOString().split('T')[0],
    current_period_start: new Date().toISOString().split('T')[0],
    current_period_end: trialEnd.toISOString().split('T')[0],
  }, { onConflict: 'user_id' })
}

// ─────────────────────────────────────────────
// Cancel subscription
// ─────────────────────────────────────────────

export async function cancelSubscription(userId: string, immediately = false): Promise<void> {
  const db = supabaseAdmin()
  if (immediately) {
    await db.from('user_subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('user_id', userId)
  } else {
    await db.from('user_subscriptions').update({ cancel_at_period_end: true, updated_at: new Date().toISOString() }).eq('user_id', userId)
  }
}

// ─────────────────────────────────────────────
// Check if trial expired → downgrade
// ─────────────────────────────────────────────

export async function processExpiredTrials(): Promise<number> {
  const db = supabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const { data: expiredTrials } = await db
    .from('user_subscriptions')
    .select('user_id')
    .eq('status', 'trial')
    .lt('trial_end', today)

  if (!expiredTrials || expiredTrials.length === 0) return 0

  const { data: freePlan } = await db.from('subscription_plans').select('id').eq('code', 'free').single()
  for (const sub of expiredTrials) {
    await db.from('user_subscriptions').update({
      status: 'active',
      plan_id: freePlan?.id,
      billing_cycle: 'monthly',
      updated_at: new Date().toISOString(),
    }).eq('user_id', sub.user_id)
  }
  return expiredTrials.length
}
