"use client"

import { useState, useEffect, useCallback } from "react"
import { Cpu, RefreshCw, CheckCircle2, XCircle, Zap, Sliders } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProviderConfig { id?: string; provider: string; is_enabled: boolean; priority: number; default_model: string; temperature: number; max_tokens: number; streaming: boolean; monthly_cost_limit?: number; health_status: string; current_month_requests: number; current_month_cost: number }
interface SupportedProvider { code: string; name: string; defaultModel: string; models: string[] }

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [supported, setSupported] = useState<SupportedProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<ProviderConfig>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/ai-config')
    const d = await res.json()
    setConfigs(d.config ?? [])
    setSupported(d.supported_providers ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!editing || !draft) return
    setSaving(true)
    const res = await fetch('/api/admin/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: editing, ...draft }),
    })
    if (res.ok) { toast.success('Saved'); setEditing(null); load() } else { toast.error('Failed') }
    setSaving(false)
  }

  const STATUS = { healthy: 'text-emerald-400', degraded: 'text-yellow-400', down: 'text-red-400', unknown: 'text-slate-500' }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">AI Configuration</h1><p className="text-sm text-slate-500">Configure AI providers, models, and limits</p></div>
        <button onClick={load} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {supported.map(sp => {
          const config = configs.find(c => c.provider === sp.code)
          const isEditing = editing === sp.code

          return (
            <div key={sp.code} className={cn("rounded-xl border bg-slate-900 p-5 space-y-4 transition-colors", config?.is_enabled ? "border-slate-700" : "border-slate-800 opacity-60")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-slate-200">{sp.name}</h3>
                    {config && <span className={cn("text-[10px] capitalize", STATUS[config.health_status as keyof typeof STATUS] ?? STATUS.unknown)}>{config.health_status}</span>}
                  </div>
                  {config && (
                    <p className="text-xs text-slate-500 mt-1">{config.current_month_requests?.toLocaleString()} reqs • ₹{config.current_month_cost?.toFixed(2)} this month</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {config?.is_enabled
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    : <XCircle className="h-5 w-5 text-slate-600" />}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-xs text-slate-400">
                    <span>Enabled</span>
                    <input type="checkbox" checked={draft.is_enabled ?? config?.is_enabled ?? false} onChange={e => setDraft(d => ({ ...d, is_enabled: e.target.checked }))} className="h-4 w-4 accent-primary" />
                  </label>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Default Model</label>
                    <select value={draft.default_model ?? config?.default_model ?? sp.defaultModel} onChange={e => setDraft(d => ({ ...d, default_model: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none">
                      {sp.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Temperature ({draft.temperature ?? config?.temperature ?? 0.7})</label>
                      <input type="range" min="0" max="1" step="0.1" value={draft.temperature ?? config?.temperature ?? 0.7} onChange={e => setDraft(d => ({ ...d, temperature: parseFloat(e.target.value) }))} className="w-full accent-primary" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Max Tokens</label>
                      <input type="number" value={draft.max_tokens ?? config?.max_tokens ?? 2048} onChange={e => setDraft(d => ({ ...d, max_tokens: parseInt(e.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50">{saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />} Save</button>
                    <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Model</span><span className="text-slate-300 font-mono truncate max-w-40">{config?.default_model ?? sp.defaultModel}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Temperature</span><span className="text-slate-300">{config?.temperature ?? 0.7}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Max Tokens</span><span className="text-slate-300">{config?.max_tokens ?? 2048}</span>
                  </div>
                  <button onClick={() => { setEditing(sp.code); setDraft({}) }} className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg border border-slate-700 py-2 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                    <Sliders className="h-3 w-3" /> Configure
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
