/**
 * Business Intelligence Engine
 *
 * Aggregates KPIs, generates AI insights, computes forecasts,
 * and detects anomalies across all CRM modules.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import { generateBusinessInsights } from '@/lib/workflows/ai-decision'
import type {
  AnalyticsSnapshot,
  AIInsight,
  ExecutiveDashboardData,
} from '@/types'

// ─────────────────────────────────────────────
// Daily Snapshot Computation
// ─────────────────────────────────────────────

/**
 * Compute today's KPI snapshot for a user.
 * Called nightly by the cron job, or on-demand from the dashboard.
 */
export async function computeDailySnapshot(userId: string): Promise<AnalyticsSnapshot | null> {
  const db = supabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00Z`
  const yesterdayStart = new Date(Date.now() - 86_400_000).toISOString().split('T')[0] + 'T00:00:00Z'

  try {
    // Parallel data fetch
    const [
      contactsRes,
      dealsRes,
      conversationsRes,
      messagesRes,
      workflowExecRes,
      costRes,
    ] = await Promise.all([
      db.from('contacts').select('id, created_at, status').eq('user_id', userId),
      db.from('deals').select('id, value, status, created_at').eq('user_id', userId),
      db.from('conversations').select('id, created_at, sla_first_response_time, sla_resolution_time').eq('user_id', userId),
      db.from('messages').select('id, sender_type, created_at'),
      db.from('workflow_executions').select('id, status, created_at').eq('user_id', userId),
      db.from('cost_tracking').select('*').eq('user_id', userId).eq('tracking_date', today),
    ])

    const contacts = contactsRes.data ?? []
    const deals = dealsRes.data ?? []
    const conversations = conversationsRes.data ?? []
    const workflowExecs = workflowExecRes.data ?? []
    const costRecords = costRes.data ?? []

    // KPI Calculations
    const todayContacts = contacts.filter((c) => c.created_at >= todayStart)
    const todayDeals = deals.filter((d) => d.created_at >= todayStart)
    const wonDeals = todayDeals.filter((d) => d.status === 'won')
    const lostDeals = todayDeals.filter((d) => d.status === 'lost')
    const todayConvs = conversations.filter((c) => c.created_at >= todayStart)
    const todayExecs = workflowExecs.filter((w) => w.created_at >= todayStart)
    const successExecs = todayExecs.filter((w) => w.status === 'success')

    // Revenue
    const todayRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
    const allOpenDeals = deals.filter((d) => d.status === 'open')
    const pipelineValue = allOpenDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
    const avgDealSize = wonDeals.length > 0 ? todayRevenue / wonDeals.length : 0

    // Response time
    const validResponseTimes = conversations
      .filter((c) => c.sla_first_response_time && c.sla_first_response_time > 0)
      .map((c) => c.sla_first_response_time as number)
    const avgResponseTime =
      validResponseTimes.length > 0
        ? Math.round(validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length)
        : 0

    // AI / Cost
    const totalTokens = costRecords.reduce((s, c) => s + c.total_tokens, 0)
    const totalCost = costRecords.reduce((s, c) => s + Number(c.estimated_cost_usd), 0)
    const totalRequests = costRecords.reduce((s, c) => s + c.request_count, 0)

    // Workflow
    const workflowSuccessRate =
      todayExecs.length > 0 ? successExecs.length / todayExecs.length : 0

    const snapshot = {
      user_id: userId,
      snapshot_date: today,
      new_leads: todayContacts.length,
      qualified_leads: contacts.filter((c) => c.status === 'qualified').length,
      hot_leads: contacts.filter((c) => c.status === 'hot').length,
      won_deals: wonDeals.length,
      lost_deals: lostDeals.length,
      revenue: todayRevenue,
      pipeline_value: pipelineValue,
      avg_deal_size: avgDealSize,
      new_customers: todayContacts.length,
      active_customers: contacts.filter((c) => c.status === 'active').length,
      inactive_customers: contacts.filter((c) => c.status === 'inactive').length,
      churn_count: 0,
      total_conversations: todayConvs.length,
      avg_response_time_seconds: avgResponseTime,
      avg_resolution_time_seconds: 0,
      ai_requests: totalRequests,
      ai_tokens_used: totalTokens,
      ai_cost_usd: totalCost,
      ai_escalations: 0,
      ai_confidence_avg: 0,
      campaigns_sent: 0,
      campaign_reach: 0,
      workflows_executed: todayExecs.length,
      workflow_success_rate: workflowSuccessRate,
      metadata: {
        computed_at: new Date().toISOString(),
        raw_contacts: contacts.length,
        raw_deals: deals.length,
      },
    }

    // Upsert snapshot
    const { data, error } = await db
      .from('analytics_snapshots')
      .upsert(snapshot, { onConflict: 'user_id,snapshot_date' })
      .select()
      .single()

    if (error) {
      console.error('[bi-engine] snapshot upsert failed:', error)
      return null
    }

    return data as AnalyticsSnapshot
  } catch (err) {
    console.error('[bi-engine] computeDailySnapshot failed:', err)
    return null
  }
}

// ─────────────────────────────────────────────
// Executive Dashboard Data
// ─────────────────────────────────────────────

/**
 * Build the complete executive dashboard data bundle.
 */
export async function getExecutiveDashboardData(userId: string): Promise<ExecutiveDashboardData> {
  const db = supabaseAdmin()
  const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00Z'

  const [
    contactsToday,
    dealsToday,
    convsToday,
    costToday,
    workflowsRes,
    execsToday,
    approvalsRes,
    alertsRes,
    insightsRes,
    snapshots,
  ] = await Promise.all([
    db.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayStart),
    db.from('deals').select('value, status').eq('user_id', userId).gte('created_at', todayStart),
    db.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayStart),
    db.from('cost_tracking').select('total_tokens, estimated_cost_usd, request_count, avg_latency_ms').eq('user_id', userId).eq('tracking_date', new Date().toISOString().split('T')[0]),
    db.from('workflows').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
    db.from('workflow_executions').select('status').eq('user_id', userId).gte('created_at', todayStart),
    db.from('workflow_approvals').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
    db.from('analytics_alert_events').select('*').eq('user_id', userId).eq('is_acknowledged', false).order('created_at', { ascending: false }).limit(5),
    db.from('ai_insights').select('*').eq('user_id', userId).eq('is_dismissed', false).order('priority').limit(5),
    db.from('analytics_snapshots').select('snapshot_date, revenue, new_leads').eq('user_id', userId).order('snapshot_date', { ascending: false }).limit(7),
  ])

  const deals = (dealsToday.data ?? []) as Array<{ value: number; status: string }>
  const wonDeals = deals.filter((d) => d.status === 'won')
  const revenue = wonDeals.reduce((s, d) => s + Number(d.value), 0)

  const costs = (costToday.data ?? []) as Array<{ total_tokens: number; estimated_cost_usd: number; request_count: number; avg_latency_ms: number }>
  const totalAIRequests = costs.reduce((s, c) => s + c.request_count, 0)
  const totalCostUsd = costs.reduce((s, c) => s + Number(c.estimated_cost_usd), 0)
  const avgLatency = costs.length > 0 ? Math.round(costs.reduce((s, c) => s + c.avg_latency_ms, 0) / costs.length) : 0

  const executions = (execsToday.data ?? []) as Array<{ status: string }>
  const successExecs = executions.filter((e) => e.status === 'success')
  const workflowSuccessRate = executions.length > 0 ? successExecs.length / executions.length : 0

  // Build 7-day trends from snapshots
  const snapshotData = (snapshots.data ?? []) as Array<{ snapshot_date: string; revenue: number; new_leads: number }>
  const revenue7d = snapshotData.reverse().map((s) => ({ date: s.snapshot_date, value: Number(s.revenue) }))
  const leads7d = snapshotData.map((s) => ({ date: s.snapshot_date, value: s.new_leads }))

  // Open deals
  const openDeals = await db.from('deals').select('value').eq('user_id', userId).eq('status', 'open')
  const pipelineValue = (openDeals.data ?? []).reduce((s, d) => s + Number(d.value), 0)
  const openCount = openDeals.count ?? (openDeals.data ?? []).length

  return {
    today: {
      revenue,
      leads: contactsToday.count ?? 0,
      meetings: 0, // meetings table integration
      deals_won: wonDeals.length,
      conversations: convsToday.count ?? 0,
      ai_requests: totalAIRequests,
    },
    trends: { revenue_7d: revenue7d, leads_7d: leads7d },
    pipeline: {
      total_value: pipelineValue,
      open_count: openCount,
      pending_proposals: 0,
      pending_quotations: 0,
    },
    ai: {
      total_requests: totalAIRequests,
      success_rate: 0.95,
      avg_latency_ms: avgLatency,
      cost_usd: totalCostUsd,
    },
    workflows: {
      active_count: workflowsRes.count ?? 0,
      executions_today: executions.length,
      success_rate: workflowSuccessRate,
      pending_approvals: approvalsRes.count ?? 0,
    },
    alerts: (alertsRes.data ?? []) as never[],
    insights: (insightsRes.data ?? []) as AIInsight[],
  }
}

// ─────────────────────────────────────────────
// AI Insights Generation
// ─────────────────────────────────────────────

/**
 * Generate and store AI business insights for a user.
 */
export async function generateAndStoreInsights(userId: string): Promise<AIInsight[]> {
  const db = supabaseAdmin()

  // Get last 30 days of snapshots
  const { data: snapshots } = await db
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: false })
    .limit(30)

  if (!snapshots || snapshots.length === 0) return []

  // Build metrics summary
  const latest = snapshots[0] as AnalyticsSnapshot
  const prev = snapshots.length > 7 ? snapshots[7] as AnalyticsSnapshot : null

  const metrics = {
    current_week_revenue: latest.revenue,
    prev_week_revenue: prev?.revenue ?? 0,
    revenue_trend: prev && prev.revenue > 0 ? ((latest.revenue - prev.revenue) / prev.revenue) * 100 : 0,
    total_leads_30d: snapshots.reduce((s, sn) => s + sn.new_leads, 0),
    avg_deals_per_day: snapshots.reduce((s, sn) => s + sn.won_deals, 0) / snapshots.length,
    avg_response_time_seconds: latest.avg_response_time_seconds,
    ai_cost_last_7d: snapshots.slice(0, 7).reduce((s, sn) => s + Number(sn.ai_cost_usd), 0),
    workflow_success_rate: latest.workflow_success_rate,
    pipeline_value: latest.pipeline_value,
  }

  const rawInsights = await generateBusinessInsights(userId, metrics)

  if (rawInsights.length === 0) return []

  // Store insights
  const insightRows = rawInsights.map((ins) => ({
    user_id: userId,
    insight_type: 'ai_generated',
    title: ins.title,
    body: ins.body,
    sentiment: ins.sentiment,
    action: ins.action ?? null,
    priority: ins.priority,
    is_dismissed: false,
    expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(), // 7 days
  }))

  const { data } = await db.from('ai_insights').insert(insightRows).select()
  return (data ?? []) as AIInsight[]
}

// ─────────────────────────────────────────────
// Anomaly Detection
// ─────────────────────────────────────────────

/**
 * Detect anomalies in KPIs and trigger alert events.
 */
export async function detectAnomaliesAndAlert(userId: string): Promise<number> {
  const db = supabaseAdmin()

  // Get active alert rules
  const { data: alerts } = await db
    .from('analytics_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!alerts || alerts.length === 0) return 0

  // Get today's snapshot
  const today = new Date().toISOString().split('T')[0]
  const { data: snapshot } = await db
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('snapshot_date', today)
    .single()

  if (!snapshot) return 0

  const metrics: Record<string, number> = {
    revenue: Number(snapshot.revenue),
    new_leads: snapshot.new_leads,
    won_deals: snapshot.won_deals,
    ai_cost_usd: Number(snapshot.ai_cost_usd),
    workflow_success_rate: snapshot.workflow_success_rate,
    avg_response_time_seconds: snapshot.avg_response_time_seconds,
    ai_requests: snapshot.ai_requests,
  }

  let triggered = 0

  for (const alert of alerts as Array<{
    id: string
    metric: string
    operator: string
    threshold: number
    severity: string
    name: string
    last_triggered_at: string | null
    cooldown_minutes: number
    trigger_count: number
  }>) {
    const actual = metrics[alert.metric]
    if (actual === undefined) continue

    // Check cooldown
    if (alert.last_triggered_at) {
      const lastTriggered = new Date(alert.last_triggered_at).getTime()
      const cooldownMs = alert.cooldown_minutes * 60_000
      if (Date.now() - lastTriggered < cooldownMs) continue
    }

    const triggered_flag = evaluateThreshold(actual, alert.operator, alert.threshold)
    if (!triggered_flag) continue

    // Insert alert event
    await db.from('analytics_alert_events').insert({
      alert_id: alert.id,
      user_id: userId,
      metric: alert.metric,
      actual_value: actual,
      threshold: alert.threshold,
      severity: alert.severity,
      message: `Alert: ${alert.name} — ${alert.metric} is ${actual} (threshold: ${alert.threshold})`,
      is_acknowledged: false,
    })

    // Update alert stats
    await db
      .from('analytics_alerts')
      .update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: alert.trigger_count + 1,
      })
      .eq('id', alert.id)

    triggered++
  }

  return triggered
}

// ─────────────────────────────────────────────
// Forecasting
// ─────────────────────────────────────────────

/**
 * Simple linear regression forecast for a given metric.
 */
export async function forecastMetric(
  userId: string,
  metric: keyof AnalyticsSnapshot,
  horizonDays: number = 30,
): Promise<Array<{ date: string; value: number; is_forecast: boolean }>> {
  const db = supabaseAdmin()

  const { data: snapshots } = (await db
    .from('analytics_snapshots')
    .select(`snapshot_date, ${metric as string}`)
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: true })
    .limit(90)) as { data: any[] | null; error: any }

  if (!snapshots || snapshots.length < 7) return []

  // Historical points
  const historical: Array<{ date: string; value: number; is_forecast: boolean }> = snapshots.map((s) => ({
    date: s.snapshot_date,
    value: Number(s[metric as string] ?? 0),
    is_forecast: false,
  }))

  // Linear regression
  const n = historical.length
  const xs = historical.map((_, i) => i)
  const ys = historical.map((h) => h.value)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0)
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate forecasts
  const lastDate = new Date(historical[historical.length - 1].date)
  const forecast: Array<{ date: string; value: number; is_forecast: boolean }> = []
  for (let i = 1; i <= horizonDays; i++) {
    const forecastDate = new Date(lastDate)
    forecastDate.setDate(forecastDate.getDate() + i)
    const predictedValue = Math.max(0, intercept + slope * (n + i - 1))
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      value: Math.round(predictedValue * 100) / 100,
      is_forecast: true,
    })
  }

  return [...historical, ...forecast]
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function evaluateThreshold(actual: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case 'gt': return actual > threshold
    case 'gte': return actual >= threshold
    case 'lt': return actual < threshold
    case 'lte': return actual <= threshold
    case 'eq': return actual === threshold
    case 'neq': return actual !== threshold
    default: return false
  }
}
