"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Users, Activity, MessageSquare, Bot, Shield, Database, RefreshCw,
  CheckCircle2, AlertCircle, XCircle, ArrowUpRight, ScrollText,
  Zap, TrendingUp, Server, Cpu, Globe
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardData {
  users: { total: number; active: number; suspended: number; admins: number }
  health: { overall: string; components: Array<{ name: string; status: string; latency_ms: number | null }> }
  active_conversations: number
  recent_activity: Array<{ action: string; module: string; created_at: string }>
  ai_providers: Array<{ provider: string; is_enabled: boolean; health_status: string; current_month_requests: number }>
}

const STATUS_COLORS: Record<string, string> = {
  healthy: 'text-emerald-400', degraded: 'text-yellow-400', down: 'text-red-400', unknown: 'text-slate-500'
}
const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  healthy: CheckCircle2, degraded: AlertCircle, down: XCircle, unknown: AlertCircle
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/dashboard')
    if (res.ok) {
      const d = await res.json()
      setData(d)
      setLastRefresh(new Date())
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const HealthIcon = ({ status }: { status: string }) => {
    const Icon = STATUS_ICONS[status] ?? AlertCircle
    return <Icon className={cn("h-4 w-4", STATUS_COLORS[status])} />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Control Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Enterprise management dashboard</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span className="text-[10px] text-slate-600">{lastRefresh.toLocaleTimeString()}</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Users", value: data?.users.total ?? "—", icon: Users, color: "text-blue-400", sub: `${data?.users.active ?? 0} active` },
          { label: "Active Conversations", value: data?.active_conversations ?? "—", icon: MessageSquare, color: "text-emerald-400", sub: "Open chats" },
          { label: "Suspended Users", value: data?.users.suspended ?? "—", icon: Shield, color: "text-red-400", sub: "Blocked accounts" },
          { label: "AI Providers", value: data?.ai_providers?.filter(p => p.is_enabled).length ?? "—", icon: Bot, color: "text-purple-400", sub: "Active providers" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{k.label}</p>
              <k.icon className={cn("h-4 w-4", k.color)} />
            </div>
            <p className="text-2xl font-bold text-slate-100">{k.value}</p>
            <p className="text-[10px] text-slate-600">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* System Health */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-200">System Health</h2>
          </div>
          <div className={cn("flex items-center gap-1.5 text-xs font-semibold capitalize rounded-full px-2 py-0.5",
            data?.health.overall === 'healthy' ? "bg-emerald-500/10 text-emerald-400" :
            data?.health.overall === 'degraded' ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", data?.health.overall === 'healthy' ? "bg-emerald-400" : data?.health.overall === 'degraded' ? "bg-yellow-400" : "bg-red-400")} />
            {data?.health.overall ?? 'Checking...'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(data?.health.components ?? []).map(c => (
            <div key={c.name} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <HealthIcon status={c.status} />
                <span className="text-sm text-slate-300">{c.name}</span>
              </div>
              <div className="text-right">
                <p className={cn("text-xs capitalize", STATUS_COLORS[c.status])}>{c.status}</p>
                {c.latency_ms && <p className="text-[10px] text-slate-600">{c.latency_ms}ms</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Providers + Quick Links */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* AI Providers */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-slate-200">AI Providers</h2></div>
            <Link href="/admin/ai-config" className="text-xs text-primary hover:underline">Configure</Link>
          </div>
          <div className="space-y-2">
            {(data?.ai_providers ?? []).map(p => (
              <div key={p.provider} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", p.is_enabled && p.health_status === 'healthy' ? "bg-emerald-400" : p.is_enabled ? "bg-yellow-400" : "bg-slate-700")} />
                  <span className="capitalize text-slate-300">{p.provider}</span>
                </div>
                <span className="text-xs text-slate-500">{p.current_month_requests?.toLocaleString() ?? 0} reqs</span>
              </div>
            ))}
            {(data?.ai_providers ?? []).length === 0 && <p className="text-xs text-slate-600">No providers configured</p>}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><ScrollText className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-slate-200">Recent Activity</h2></div>
            <Link href="/admin/audit-logs" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {(data?.recent_activity ?? []).slice(0, 6).map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-slate-500">{log.action}</span>
                <span className="text-slate-700">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
            {(data?.recent_activity ?? []).length === 0 && <p className="text-xs text-slate-600">No recent activity</p>}
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { href: "/admin/users", icon: Users, label: "Users" },
          { href: "/admin/roles", icon: Shield, label: "Roles" },
          { href: "/admin/ai-config", icon: Cpu, label: "AI Config" },
          { href: "/admin/security", icon: Database, label: "Security" },
          { href: "/admin/audit-logs", icon: ScrollText, label: "Audit Logs" },
          { href: "/admin/developer", icon: Zap, label: "Developer" },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors group">
            <item.icon className="h-5 w-5 text-slate-500 group-hover:text-primary transition-colors" />
            <span className="text-xs text-slate-400 group-hover:text-slate-200">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
