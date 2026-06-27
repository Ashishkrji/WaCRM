/**
 * Analytics Query Functions
 *
 * Specialized query functions for all analytics sub-modules.
 * Pattern mirrors src/lib/dashboard/queries.ts.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

type DB = SupabaseClient

// ─────────────────────────────────────────────
// Sales Analytics
// ─────────────────────────────────────────────

export interface SalesAnalyticsData {
  pipeline_value: number
  won_deals_count: number
  won_deals_value: number
  lost_deals_count: number
  avg_deal_size: number
  avg_sales_cycle_days: number
  conversion_rate: number
  revenue_by_month: Array<{ month: string; revenue: number }>
  deals_by_stage: Array<{ stage: string; count: number; value: number }>
  top_services: Array<{ service: string; count: number; value: number }>
  lead_sources: Array<{ source: string; count: number }>
}

export async function loadSalesAnalytics(db: DB, rangeDays: number = 30): Promise<SalesAnalyticsData> {
  const since = new Date(Date.now() - rangeDays * 86_400_000).toISOString()

  const [dealsRes, stagesRes, contactsRes] = await Promise.all([
    db.from('deals').select('id, value, status, created_at, updated_at, services, stage_id').gte('created_at', since),
    db.from('pipeline_stages').select('id, name'),
    db.from('contacts').select('id, lead_source, created_at').gte('created_at', since),
  ])

  const deals = dealsRes.data ?? []
  const stages = stagesRes.data ?? []
  const contacts = contactsRes.data ?? []

  const stageMap = Object.fromEntries((stages as Array<{id: string; name: string}>).map((s) => [s.id, s.name]))

  const openDeals = deals.filter((d) => d.status === 'open')
  const wonDeals = deals.filter((d) => d.status === 'won')
  const lostDeals = deals.filter((d) => d.status === 'lost')

  const pipeline_value = openDeals.reduce((s, d) => s + Number(d.value), 0)
  const won_deals_value = wonDeals.reduce((s, d) => s + Number(d.value), 0)
  const avg_deal_size = wonDeals.length > 0 ? won_deals_value / wonDeals.length : 0
  const conversion_rate = deals.length > 0 ? wonDeals.length / deals.length : 0

  // Revenue by month
  const monthMap: Record<string, number> = {}
  wonDeals.forEach((d) => {
    const month = d.created_at.slice(0, 7)
    monthMap[month] = (monthMap[month] ?? 0) + Number(d.value)
  })
  const revenue_by_month = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }))

  // Deals by stage
  const stageCount: Record<string, { count: number; value: number }> = {}
  openDeals.forEach((d) => {
    const name = stageMap[d.stage_id] ?? 'Unknown'
    if (!stageCount[name]) stageCount[name] = { count: 0, value: 0 }
    stageCount[name].count++
    stageCount[name].value += Number(d.value)
  })
  const deals_by_stage = Object.entries(stageCount).map(([stage, s]) => ({ stage, ...s }))

  // Services
  const serviceCount: Record<string, { count: number; value: number }> = {}
  wonDeals.forEach((d) => {
    const services = (d.services as string[] | null) ?? []
    services.forEach((svc) => {
      if (!serviceCount[svc]) serviceCount[svc] = { count: 0, value: 0 }
      serviceCount[svc].count++
      serviceCount[svc].value += Number(d.value) / services.length
    })
  })
  const top_services = Object.entries(serviceCount)
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 10)
    .map(([service, s]) => ({ service, ...s }))

  // Lead sources
  const sourceCount: Record<string, number> = {}
  contacts.forEach((c) => {
    const src = c.lead_source ?? 'Direct'
    sourceCount[src] = (sourceCount[src] ?? 0) + 1
  })
  const lead_sources = Object.entries(sourceCount).map(([source, count]) => ({ source, count }))

  return {
    pipeline_value,
    won_deals_count: wonDeals.length,
    won_deals_value,
    lost_deals_count: lostDeals.length,
    avg_deal_size,
    avg_sales_cycle_days: 14, // TODO: compute from created_at → status update
    conversion_rate,
    revenue_by_month,
    deals_by_stage,
    top_services,
    lead_sources,
  }
}

// ─────────────────────────────────────────────
// Customer Analytics
// ─────────────────────────────────────────────

export interface CustomerAnalyticsData {
  total_customers: number
  new_this_month: number
  active: number
  inactive: number
  churn_rate: number
  retention_rate: number
  avg_ltv: number
  by_industry: Array<{ industry: string; count: number }>
  by_country: Array<{ country: string; count: number }>
  avg_response_time_seconds: number
}

export async function loadCustomerAnalytics(db: DB): Promise<CustomerAnalyticsData> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [allContactsRes, convRes] = await Promise.all([
    db.from('contacts').select('id, status, industry, country, created_at'),
    db.from('conversations').select('sla_first_response_time').not('sla_first_response_time', 'is', null),
  ])

  const contacts = (allContactsRes.data ?? []) as Array<{id: string; status?: string; industry?: string; country?: string; created_at: string}>
  const convs = (convRes.data ?? []) as Array<{sla_first_response_time: number}>

  const active = contacts.filter((c) => c.status === 'active').length
  const inactive = contacts.filter((c) => c.status === 'inactive').length

  const industryCount: Record<string, number> = {}
  contacts.forEach((c) => {
    const ind = c.industry ?? 'Unknown'
    industryCount[ind] = (industryCount[ind] ?? 0) + 1
  })

  const countryCount: Record<string, number> = {}
  contacts.forEach((c) => {
    const cnt = c.country ?? 'India'
    countryCount[cnt] = (countryCount[cnt] ?? 0) + 1
  })

  const responseTimes = convs.map((c) => c.sla_first_response_time)
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0

  return {
    total_customers: contacts.length,
    new_this_month: contacts.filter((c) => c.created_at >= monthStart).length,
    active,
    inactive,
    churn_rate: contacts.length > 0 ? inactive / contacts.length : 0,
    retention_rate: contacts.length > 0 ? active / contacts.length : 0,
    avg_ltv: 0,
    by_industry: Object.entries(industryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([industry, count]) => ({ industry, count })),
    by_country: Object.entries(countryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count })),
    avg_response_time_seconds: avgResponseTime,
  }
}

// ─────────────────────────────────────────────
// Employee Analytics
// ─────────────────────────────────────────────

export interface EmployeeAnalyticsData {
  leaderboard: Array<{
    id: string
    name: string
    role: string
    assigned_leads: number
    won_deals: number
    revenue_generated: number
    avg_response_text: string
    tasks_completed: number
    performance_score: number
  }>
}

export async function loadEmployeeAnalytics(db: DB): Promise<EmployeeAnalyticsData> {
  const [profilesRes, dealsRes, tasksRes, convsRes] = await Promise.all([
    db.from('profiles').select('id, full_name, role'),
    db.from('deals').select('assigned_to, value, status'),
    db.from('tasks').select('assigned_to, status'),
    db.from('conversations').select('assigned_agent_id, sla_first_response_time'),
  ])

  const profiles = (profilesRes.data ?? []) as Array<{id: string; full_name: string; role: string}>
  const deals = (dealsRes.data ?? []) as Array<{assigned_to?: string; value: number; status: string}>
  const tasks = (tasksRes.data ?? []) as Array<{assigned_to?: string; status: string}>
  const convs = (convsRes.data ?? []) as Array<{assigned_agent_id?: string; sla_first_response_time?: number}>

  const leaderboard = profiles.map((p) => {
    const myDeals = deals.filter((d) => d.assigned_to === p.id)
    const wonDeals = myDeals.filter((d) => d.status === 'won')
    const revenue = wonDeals.reduce((s, d) => s + Number(d.value), 0)
    const myTasks = tasks.filter((t) => t.assigned_to === p.id && t.status === 'completed')
    const myConvs = convs.filter((c) => c.assigned_agent_id === p.id && c.sla_first_response_time)
    const avgRT = myConvs.length > 0
      ? Math.round(myConvs.reduce((s, c) => s + (c.sla_first_response_time ?? 0), 0) / myConvs.length)
      : 0

    const performance_score = Math.min(100,
      (wonDeals.length * 20) + (myTasks.length * 5) + (revenue > 0 ? 30 : 0)
    )

    return {
      id: p.id,
      name: p.full_name,
      role: p.role,
      assigned_leads: myDeals.length,
      won_deals: wonDeals.length,
      revenue_generated: revenue,
      avg_response_text: avgRT > 0 ? formatSeconds(avgRT) : 'N/A',
      tasks_completed: myTasks.length,
      performance_score,
    }
  }).sort((a, b) => b.performance_score - a.performance_score)

  return { leaderboard }
}

// ─────────────────────────────────────────────
// AI / Provider Analytics
// ─────────────────────────────────────────────

export interface AIAnalyticsData {
  total_requests: number
  total_tokens: number
  total_cost_usd: number
  avg_latency_ms: number
  success_rate: number
  by_provider: Array<{
    provider: string
    requests: number
    tokens: number
    cost_usd: number
    avg_latency_ms: number
    success_rate: number
  }>
  by_model: Array<{
    model: string
    requests: number
    tokens: number
    cost_usd: number
  }>
  daily_usage: Array<{ date: string; requests: number; tokens: number; cost_usd: number }>
}

export async function loadAIAnalytics(db: DB, rangeDays: number = 30): Promise<AIAnalyticsData> {
  const since = new Date(Date.now() - rangeDays * 86_400_000).toISOString().split('T')[0]

  const { data } = await db
    .from('cost_tracking')
    .select('*')
    .gte('tracking_date', since)
    .order('tracking_date', { ascending: true })

  const records = (data ?? []) as Array<{
    provider: string; model: string; tracking_date: string;
    request_count: number; success_count: number; failure_count: number;
    total_tokens: number; estimated_cost_usd: number; avg_latency_ms: number
  }>

  const total_requests = records.reduce((s, r) => s + r.request_count, 0)
  const total_tokens = records.reduce((s, r) => s + r.total_tokens, 0)
  const total_cost_usd = records.reduce((s, r) => s + Number(r.estimated_cost_usd), 0)
  const total_success = records.reduce((s, r) => s + r.success_count, 0)
  const avg_latency_ms = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.avg_latency_ms, 0) / records.length)
    : 0

  // By provider
  const providerMap: Record<string, { requests: number; tokens: number; cost: number; latency: number; success: number; count: number }> = {}
  records.forEach((r) => {
    if (!providerMap[r.provider]) providerMap[r.provider] = { requests: 0, tokens: 0, cost: 0, latency: 0, success: 0, count: 0 }
    const p = providerMap[r.provider]
    p.requests += r.request_count
    p.tokens += r.total_tokens
    p.cost += Number(r.estimated_cost_usd)
    p.latency += r.avg_latency_ms
    p.success += r.success_count
    p.count++
  })

  const by_provider = Object.entries(providerMap).map(([provider, p]) => ({
    provider,
    requests: p.requests,
    tokens: p.tokens,
    cost_usd: Math.round(p.cost * 10000) / 10000,
    avg_latency_ms: p.count > 0 ? Math.round(p.latency / p.count) : 0,
    success_rate: p.requests > 0 ? p.success / p.requests : 0,
  }))

  // By model
  const modelMap: Record<string, { requests: number; tokens: number; cost: number }> = {}
  records.forEach((r) => {
    if (!modelMap[r.model]) modelMap[r.model] = { requests: 0, tokens: 0, cost: 0 }
    modelMap[r.model].requests += r.request_count
    modelMap[r.model].tokens += r.total_tokens
    modelMap[r.model].cost += Number(r.estimated_cost_usd)
  })
  const by_model = Object.entries(modelMap).map(([model, m]) => ({
    model,
    requests: m.requests,
    tokens: m.tokens,
    cost_usd: Math.round(m.cost * 10000) / 10000,
  }))

  // Daily usage
  const dailyMap: Record<string, { requests: number; tokens: number; cost_usd: number }> = {}
  records.forEach((r) => {
    if (!dailyMap[r.tracking_date]) dailyMap[r.tracking_date] = { requests: 0, tokens: 0, cost_usd: 0 }
    dailyMap[r.tracking_date].requests += r.request_count
    dailyMap[r.tracking_date].tokens += r.total_tokens
    dailyMap[r.tracking_date].cost_usd += Number(r.estimated_cost_usd)
  })
  const daily_usage = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, ...d }))

  return {
    total_requests,
    total_tokens,
    total_cost_usd: Math.round(total_cost_usd * 10000) / 10000,
    avg_latency_ms,
    success_rate: total_requests > 0 ? total_success / total_requests : 0,
    by_provider,
    by_model,
    daily_usage,
  }
}

// ─────────────────────────────────────────────
// Marketing Analytics
// ─────────────────────────────────────────────

export interface MarketingAnalyticsData {
  total_broadcasts: number
  total_recipients: number
  delivery_rate: number
  read_rate: number
  reply_rate: number
  campaigns: Array<{
    name: string
    sent: number
    delivered: number
    read: number
    replied: number
    failed: number
  }>
}

export async function loadMarketingAnalytics(db: DB, rangeDays: number = 30): Promise<MarketingAnalyticsData> {
  const since = new Date(Date.now() - rangeDays * 86_400_000).toISOString()

  const { data } = await db
    .from('broadcasts')
    .select('name, total_recipients, sent_count, delivered_count, read_count, replied_count, failed_count')
    .gte('created_at', since)

  const broadcasts = (data ?? []) as Array<{
    name: string
    total_recipients: number
    sent_count: number
    delivered_count: number
    read_count: number
    replied_count: number
    failed_count: number
  }>

  const totals = broadcasts.reduce(
    (acc, b) => ({
      recipients: acc.recipients + b.total_recipients,
      sent: acc.sent + b.sent_count,
      delivered: acc.delivered + b.delivered_count,
      read: acc.read + b.read_count,
      replied: acc.replied + b.replied_count,
    }),
    { recipients: 0, sent: 0, delivered: 0, read: 0, replied: 0 },
  )

  return {
    total_broadcasts: broadcasts.length,
    total_recipients: totals.recipients,
    delivery_rate: totals.sent > 0 ? totals.delivered / totals.sent : 0,
    read_rate: totals.delivered > 0 ? totals.read / totals.delivered : 0,
    reply_rate: totals.read > 0 ? totals.replied / totals.read : 0,
    campaigns: broadcasts.map((b) => ({
      name: b.name,
      sent: b.sent_count,
      delivered: b.delivered_count,
      read: b.read_count,
      replied: b.replied_count,
      failed: b.failed_count,
    })),
  }
}

// ─────────────────────────────────────────────
// Financial Analytics
// ─────────────────────────────────────────────

export interface FinancialAnalyticsData {
  total_revenue: number
  pending_payments: number
  overdue_payments: number
  avg_invoice_value: number
  by_month: Array<{ month: string; revenue: number; invoices: number }>
}

export async function loadFinancialAnalytics(db: DB): Promise<FinancialAnalyticsData> {
  const [invoicesRes, paymentsRes] = await Promise.all([
    db.from('invoices').select('amount, status, due_date, created_at'),
    db.from('payments').select('amount, status'),
  ])

  const invoices = (invoicesRes.data ?? []) as Array<{amount: number; status: string; due_date?: string; created_at: string}>
  const payments = (paymentsRes.data ?? []) as Array<{amount: number; status: string}>

  const paidInvoices = invoices.filter((i) => i.status === 'paid')
  const pendingInvoices = invoices.filter((i) => i.status === 'sent')
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue')

  const total_revenue = paidInvoices.reduce((s, i) => s + Number(i.amount), 0)
  const pending_payments = pendingInvoices.reduce((s, i) => s + Number(i.amount), 0)
  const overdue_payments = overdueInvoices.reduce((s, i) => s + Number(i.amount), 0)
  const avg_invoice_value = invoices.length > 0
    ? invoices.reduce((s, i) => s + Number(i.amount), 0) / invoices.length
    : 0

  const monthMap: Record<string, { revenue: number; invoices: number }> = {}
  paidInvoices.forEach((i) => {
    const month = i.created_at.slice(0, 7)
    if (!monthMap[month]) monthMap[month] = { revenue: 0, invoices: 0 }
    monthMap[month].revenue += Number(i.amount)
    monthMap[month].invoices++
  })

  return {
    total_revenue,
    pending_payments,
    overdue_payments,
    avg_invoice_value,
    by_month: Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v })),
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.round(s / 60)}m`
  return `${Math.round(s / 3600)}h`
}
