"use client"

import { useState, useEffect } from "react"
import { LayoutGrid, Activity, TrendingUp, DollarSign, Users, Zap, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Bot, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExecutiveDashboardData, AIInsight, AnalyticsAlertEvent } from "@/types"

export function ExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/executive')
      .then(r => r.json())
      .then(d => setData(d.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Alerts Banner */}
      {data.alerts.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-none" />
          <span className="text-sm text-red-300">
            {data.alerts.length} alert{data.alerts.length > 1 ? 's' : ''} require your attention
          </span>
          {data.alerts.slice(0, 2).map((a) => (
            <span key={a.id} className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">{a.message.slice(0, 40)}</span>
          ))}
        </div>
      )}

      {/* Today's KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Revenue Today" value={`₹${data.today.revenue.toLocaleString('en-IN')}`} icon={DollarSign} color="emerald" />
        <KpiCard label="New Leads" value={data.today.leads} icon={Users} color="blue" />
        <KpiCard label="Conversations" value={data.today.conversations} icon={Activity} color="violet" />
        <KpiCard label="Deals Won" value={data.today.deals_won} icon={CheckCircle2} color="green" />
        <KpiCard label="AI Requests" value={data.today.ai_requests.toLocaleString()} icon={Bot} color="purple" />
        <KpiCard label="AI Cost" value={`$${data.ai.cost_usd.toFixed(4)}`} icon={Zap} color="orange" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MiniChart title="Revenue (7 days)" data={data.trends.revenue_7d} color="#10b981" prefix="₹" />
        <MiniChart title="New Leads (7 days)" data={data.trends.leads_7d} color="#6366f1" />
      </div>

      {/* Pipeline + Workflow + AI Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard title="Pipeline" items={[
          { label: "Total Value", value: `₹${data.pipeline.total_value.toLocaleString('en-IN')}` },
          { label: "Open Deals", value: data.pipeline.open_count },
          { label: "Pending Proposals", value: data.pipeline.pending_proposals },
          { label: "Pending Quotations", value: data.pipeline.pending_quotations },
        ]} />
        <StatCard title="Workflow Engine" items={[
          { label: "Active Workflows", value: data.workflows.active_count },
          { label: "Executions Today", value: data.workflows.executions_today },
          { label: "Success Rate", value: `${(data.workflows.success_rate * 100).toFixed(1)}%` },
          { label: "Pending Approvals", value: data.workflows.pending_approvals, alert: data.workflows.pending_approvals > 0 },
        ]} />
        <StatCard title="AI Performance" items={[
          { label: "Total Requests", value: data.ai.total_requests.toLocaleString() },
          { label: "Success Rate", value: `${(data.ai.success_rate * 100).toFixed(1)}%` },
          { label: "Avg Latency", value: `${data.ai.avg_latency_ms}ms` },
          { label: "Cost Today", value: `$${data.ai.cost_usd.toFixed(4)}` },
        ]} />
      </div>

      {/* AI Insights */}
      {data.insights.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-300">AI Business Insights</h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {data.insights.map((ins) => <InsightCard key={ins.id} insight={ins} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── KPI Card ───────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
  violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400',
  green: 'from-green-500/20 to-green-600/5 border-green-500/20 text-green-400',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
  orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400',
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof DollarSign; color: string }) {
  const cls = COLOR_MAP[color]
  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-gradient-to-br p-4", cls)}>
      <div className="flex items-center justify-between">
        <Icon className={cn("h-5 w-5", cls.split(' ')[3])} />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  )
}

// ─── Mini Sparkline Chart ────────────────────────

function MiniChart({ title, data, color, prefix = '' }: { title: string; data: Array<{ date: string; value: number }>; color: string; prefix?: string }) {
  if (!data || data.length === 0) return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <p className="mt-4 text-center text-xs text-slate-600">No data yet</p>
    </div>
  )

  const max = Math.max(...data.map(d => d.value), 1)
  const min = Math.min(...data.map(d => d.value))
  const range = max - min || 1
  const h = 60
  const w = 300

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((d.value - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  const current = data[data.length - 1]?.value ?? 0
  const prev = data[data.length - 2]?.value ?? current
  const pct = prev > 0 ? ((current - prev) / prev) * 100 : 0
  const up = pct >= 0

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-300">{title}</p>
        <span className={cn("flex items-center gap-1 text-xs font-medium", up ? "text-emerald-400" : "text-red-400")}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(pct).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold text-slate-100">{prefix}{current.toLocaleString('en-IN')}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" style={{ height: h }}>
        <polyline fill="none" stroke={color} strokeWidth={2} points={points} />
        <polyline fill={color + '20'} points={`0,${h} ${points} ${w},${h}`} />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-slate-600">
        {data.slice(0, 1).map(d => <span key={d.date}>{d.date.slice(5)}</span>)}
        {data.slice(-1).map(d => <span key={d.date}>{d.date.slice(5)}</span>)}
      </div>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────

function StatCard({ title, items }: { title: string; items: Array<{ label: string; value: string | number; alert?: boolean }> }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-300">{title}</p>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{item.label}</span>
            <span className={cn("text-sm font-semibold", item.alert ? "text-orange-400" : "text-slate-200")}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Insight Card ─────────────────────────────────

const SENTIMENT_STYLE: Record<string, string> = {
  positive: 'border-emerald-500/30 bg-emerald-500/5',
  negative: 'border-red-500/30 bg-red-500/5',
  warning: 'border-orange-500/30 bg-orange-500/5',
  neutral: 'border-slate-700 bg-slate-900',
}

function InsightCard({ insight }: { insight: AIInsight }) {
  return (
    <div className={cn("rounded-xl border p-4", SENTIMENT_STYLE[insight.sentiment])}>
      <p className="text-sm font-semibold text-slate-200">{insight.title}</p>
      <p className="mt-1 text-xs text-slate-400 line-clamp-3">{insight.body}</p>
      {insight.action && (
        <button className="mt-2 text-xs font-medium text-primary hover:underline">{insight.action} →</button>
      )}
    </div>
  )
}
