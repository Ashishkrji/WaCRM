import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { getUserFeatures, getTenantUsage } from '@/lib/saas/feature-flags'

// GET /api/saas/admin - tenant overview
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource') ?? 'summary'

  const db = supabaseAdmin()

  if (resource === 'features') {
    const features = await getUserFeatures(user.id)
    return NextResponse.json({ features })
  }

  if (resource === 'usage') {
    const tenantId = searchParams.get('tenant_id')
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
    const usage = await getTenantUsage(tenantId)
    return NextResponse.json({ usage })
  }

  if (resource === 'plans') {
    const { data } = await db.from('subscription_plans').select('*').eq('is_active', true)
    return NextResponse.json({ plans: data ?? [] })
  }

  if (resource === 'tenants') {
    const { data } = await db.from('tenants').select('*, tenant_members(count), subscription_plans(name)').eq('owner_id', user.id)
    return NextResponse.json({ tenants: data ?? [] })
  }

  // Summary
  const [{ data: sub }, { data: features }] = await Promise.all([
    db.from('user_subscriptions').select('*, subscription_plans(*)').eq('user_id', user.id).single(),
    db.from('feature_flags').select('feature_key, name'),
  ])

  const userFeatures = await getUserFeatures(user.id)

  return NextResponse.json({
    subscription: sub,
    features: userFeatures,
    plan: (sub?.subscription_plans as Record<string, unknown>) ?? null,
  })
}

// POST /api/saas/admin
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { action } = body
  const db = supabaseAdmin()

  if (action === 'create_tenant') {
    const { name, slug } = body
    if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
    const { data, error } = await db.from('tenants').insert({ name, slug, owner_id: user.id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Add owner as member
    await db.from('tenant_members').insert({ tenant_id: data.id, user_id: user.id, role: 'owner', joined_at: new Date().toISOString() })
    return NextResponse.json({ tenant: data }, { status: 201 })
  }

  if (action === 'update_subscription') {
    const { plan_id, billing_cycle } = body
    const { data, error } = await db.from('user_subscriptions').upsert({
      user_id: user.id, plan_id, billing_cycle, status: 'active',
      current_period_start: new Date().toISOString().split('T')[0],
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0],
    }, { onConflict: 'user_id' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ subscription: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
