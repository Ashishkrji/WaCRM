"use client"

import { useState, useEffect, useCallback } from "react"
import { Activity, CheckCircle2, AlertCircle, XCircle, RefreshCw, Database, Bot, Globe, Server } from "lucide-react"
import { cn } from "@/lib/utils"

interface HealthReport {
  overall: string
  timestamp: string
  components: Array<{ name: string; status: string; latency_ms: number | null; message?: string }>
  metrics: { active_conversations: number; active_users: number; pending_jobs: number; error_rate_1h: number; ai_requests_today: number }
}

const ICONS: Record<string, typeof Database> = { 'Supabase DB': Database, 'NVIDIA AI': Bot, 'WhatsApp API': Globe }
const STATUS_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  healthy: { border: 'border-emerald-800/40', bg: 'bg-emerald-900/10', text: 'text-emerald-400' },
  degraded: { border: 'border-yellow-800/40', bg: 'bg-yellow-900/10', text: 'text-yellow-400' },
  down: { border: 'border-red-800/40', bg: 'bg-red-900/10', text: 'text-red-400' },
  unknown: { border: 'border-slate-700', bg: 'bg-slate-900/10', text: 'text-slate-500' },
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<Array<{ time: string; status: string }>>([])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/system-health')
    if (res.ok) {
      const d = await res.json()
      setHealth(d)
      setHistory(h => [{ time: new Date().toLocaleTimeString(), status: d.overall }, ...h.slice(0, 9)])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(load, 60_000); return () => clearInterval(t) }, [load])

  const overallStyle = STATUS_STYLES[health?.overall ?? 'unknown']

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">System Health</h1><p className="text-sm text-slate-500">Auto-refreshes every 60 seconds</p></div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Overall Status */}
      <div className={cn("rounded-xl border p-6", overallStyle?.border, overallStyle?.bg)}>
        <div className="flex items-center gap-3">
          {health?.overall === 'healthy' ? <CheckCircle2 className="h-8 w-8 text-emerald-400" /> : health?.overall === 'degraded' ? <AlertCircle className="h-8 w-8 text-yellow-400" /> : <XCircle className="h-8 w-8 text-red-400" />}
          <div>
            <p className={cn("text-2xl font-bold capitalize", overallStyle?.text)}>{health?.overall ?? 'Unknown'}</p>
            <p className="text-xs text-slate-500">Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}</p>
          </div>
        </div>
      </div>

      {/* Component Status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(health?.components ?? []).map(c => {
          const style = STATUS_STYLES[c.status] ?? STATUS_STYLES.unknown
          const Icon = ICONS[c.name] ?? Server
          return (
            <div key={c.name} className={cn("rounded-xl border p-5 space-y-3", style.border, style.bg)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", style.text)} />
                  <span className="font-medium text-slate-200 text-sm">{c.name}</span>
                </div>
                <span className={cn("text-xs capitalize font-semibold rounded-full px-2 py-0.5", style.text, style.bg)}>{c.status}</span>
              </div>
              {c.latency_ms !== null && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Latency</span>
                  <span className={c.latency_ms > 500 ? 'text-yellow-400' : 'text-emerald-400'}>{c.latency_ms}ms</span>
                </div>
              )}
              {c.message && <p className="text-[10px] text-slate-600">{c.message}</p>}
            </div>
          )
        })}
      </div>

      {/* Metrics */}
      {health?.metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Active Conversations', value: health.metrics.active_conversations },
            { label: 'Active Users', value: health.metrics.active_users },
            { label: 'Pending Jobs', value: health.metrics.pending_jobs },
            { label: 'Error Rate (1h)', value: `${health.metrics.error_rate_1h}%` },
            { label: 'AI Requests Today', value: health.metrics.ai_requests_today },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xl font-bold text-slate-100">{m.value}</p>
              <p className="text-[10px] text-slate-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Check History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Recent Checks</h2>
          <div className="flex gap-2">
            {history.map((h, i) => (
              <div key={i} className="text-center">
                <div className={cn("h-6 w-3 rounded-full mx-auto", h.status === 'healthy' ? 'bg-emerald-500' : h.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500')} title={h.status} />
                <p className="text-[8px] text-slate-600 mt-1">{h.time.split(':').slice(0,2).join(':')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
