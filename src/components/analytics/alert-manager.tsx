"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle2, XCircle, Plus, Trash2, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { AnalyticsAlert, AnalyticsAlertEvent } from "@/types"

export function AlertManager() {
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([])
  const [events, setEvents] = useState<AnalyticsAlertEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', metric: 'revenue', operator: 'lt', threshold: '', severity: 'warning' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const res = await fetch('/api/analytics/alerts')
    const d = await res.json()
    setAlerts(d.alerts ?? [])
    setEvents(d.events ?? [])
    setLoading(false)
  }

  async function acknowledgeAll() {
    const ids = events.map(e => e.id)
    if (!ids.length) return
    await fetch('/api/analytics/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_ids: ids }) })
    toast.success('All alerts acknowledged')
    loadData()
  }

  async function createAlert() {
    if (!form.name || !form.threshold) { toast.error('Fill all fields'); return }
    await fetch('/api/analytics/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, threshold: Number(form.threshold) }),
    })
    toast.success('Alert rule created')
    setShowCreate(false)
    loadData()
  }

  const SEVERITY_STYLE: Record<string, string> = {
    critical: 'text-red-400 border-red-500/30 bg-red-500/10',
    warning: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  }

  if (loading) return <div className="flex h-48 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      {/* Unacknowledged Events */}
      {events.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-orange-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Active Alerts ({events.length})
            </h3>
            <button onClick={acknowledgeAll} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">Acknowledge All</button>
          </div>
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className={cn("rounded-lg border px-3 py-2 text-xs", SEVERITY_STYLE[ev.severity])}>
                <span className="font-medium">{ev.message}</span>
                <span className="ml-2 text-slate-500">{new Date(ev.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Rules */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Alert Rules</h3>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Rule
          </button>
        </div>

        {showCreate && (
          <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Alert name..." className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs text-slate-100" />
            <div className="grid grid-cols-3 gap-2">
              <select value={form.metric} onChange={e => setForm(p => ({ ...p, metric: e.target.value }))} className="rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100">
                {['revenue','new_leads','won_deals','ai_cost_usd','workflow_success_rate','avg_response_time_seconds'].map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
              </select>
              <select value={form.operator} onChange={e => setForm(p => ({ ...p, operator: e.target.value }))} className="rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100">
                {[['gt','>'],['lt','<'],['gte','>='],['lte','<=']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input type="number" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))} placeholder="Threshold" className="rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100" />
            </div>
            <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} className="w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <div className="flex gap-2">
              <button onClick={createAlert} className="flex-1 rounded-md bg-primary py-1.5 text-xs font-medium text-white hover:bg-primary/90">Create</button>
              <button onClick={() => setShowCreate(false)} className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {alerts.length === 0 && <p className="text-center text-xs text-slate-600 py-4">No alert rules yet</p>}
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
              <div>
                <p className="text-xs font-medium text-slate-200">{alert.name}</p>
                <p className="text-[10px] text-slate-500">{alert.metric} {alert.operator} {alert.threshold} · {alert.trigger_count} triggers</p>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium border", SEVERITY_STYLE[alert.severity])}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
