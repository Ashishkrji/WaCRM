"use client"

import { useState, useEffect } from "react"
import { Cpu, DollarSign, Zap, Clock, RefreshCw, CheckCircle2, XCircle } from "lucide-react"

export function AIAnalytics() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/ai-usage?range=${range}`)
      .then(r => r.json())
      .then(d => setData(d.ai_usage))
      .finally(() => setLoading(false))
  }, [range])

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>
  if (!data) return null

  const ai = data as {
    total_requests: number; total_tokens: number; total_cost_usd: number;
    avg_latency_ms: number; success_rate: number;
    by_provider: Array<{ provider: string; requests: number; tokens: number; cost_usd: number; avg_latency_ms: number; success_rate: number }>;
    by_model: Array<{ model: string; requests: number; tokens: number; cost_usd: number }>;
    daily_usage: Array<{ date: string; requests: number; tokens: number; cost_usd: number }>;
  }

  return (
    <div className="space-y-6">
      {/* Range */}
      <div className="flex gap-2">
        {[7, 30, 90].map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${range === r ? 'bg-primary text-white' : 'border border-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {r}D
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total Requests", value: (ai.total_requests || 0).toLocaleString(), icon: Cpu, color: "text-violet-400" },
          { label: "Total Tokens", value: (ai.total_tokens || 0).toLocaleString(), icon: Zap, color: "text-blue-400" },
          { label: "Total Cost", value: `$${(ai.total_cost_usd || 0).toFixed(4)}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Avg Latency", value: `${ai.avg_latency_ms || 0}ms`, icon: Clock, color: "text-orange-400" },
          { label: "Success Rate", value: `${((ai.success_rate || 0) * 100).toFixed(1)}%`, icon: CheckCircle2, color: "text-green-400" },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <p className="mt-2 text-xl font-bold text-slate-100">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* By Provider */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">Usage by Provider</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-2 text-left">Provider</th>
                <th className="pb-2 text-right">Requests</th>
                <th className="pb-2 text-right">Tokens</th>
                <th className="pb-2 text-right">Cost USD</th>
                <th className="pb-2 text-right">Latency</th>
                <th className="pb-2 text-right">Success</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {(ai.by_provider || []).map(p => (
                <tr key={p.provider}>
                  <td className="py-2 text-slate-200 font-medium capitalize">{p.provider}</td>
                  <td className="py-2 text-right text-slate-400">{p.requests.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-400">{p.tokens.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-400">${p.cost_usd.toFixed(4)}</td>
                  <td className="py-2 text-right text-slate-400">{p.avg_latency_ms}ms</td>
                  <td className="py-2 text-right">
                    <span className={`font-medium ${(p.success_rate * 100) >= 95 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {(p.success_rate * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Usage Sparkbar */}
      {(ai.daily_usage || []).length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Daily Requests</h3>
          <div className="flex items-end gap-1 h-20">
            {(ai.daily_usage || []).slice(-30).map(d => {
              const maxR = Math.max(...(ai.daily_usage || []).map(x => x.requests), 1)
              const pct = (d.requests / maxR) * 100
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-slate-200 text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date}: {d.requests}
                  </div>
                  <div className="w-full rounded-sm bg-primary/70 transition-all hover:bg-primary" style={{ height: `${Math.max(pct, 2)}%` }} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
