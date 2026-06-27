"use client"

import { useState, useEffect } from "react"
import { BarChart2, TrendingUp, Target, Package, RefreshCw } from "lucide-react"

export function SalesAnalytics() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/sales?range=${range}`)
      .then(r => r.json())
      .then(d => setData(d.sales))
      .finally(() => setLoading(false))
  }, [range])

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>
  if (!data) return null

  const sales = data as {
    pipeline_value: number; won_deals_count: number; won_deals_value: number;
    avg_deal_size: number; conversion_rate: number; deals_by_stage: Array<{ stage: string; count: number; value: number }>;
    revenue_by_month: Array<{ month: string; revenue: number }>; top_services: Array<{ service: string; value: number }>;
    lead_sources: Array<{ source: string; count: number }>
  }

  return (
    <div className="space-y-6">
      {/* Range Selector */}
      <div className="flex items-center gap-2">
        {[7, 30, 90].map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${range === r ? 'bg-primary text-white' : 'border border-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {r}D
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Pipeline Value", value: `₹${(sales.pipeline_value || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: "text-blue-400" },
          { label: "Won Deals", value: `₹${(sales.won_deals_value || 0).toLocaleString('en-IN')}`, icon: Target, color: "text-emerald-400" },
          { label: "Avg Deal Size", value: `₹${(sales.avg_deal_size || 0).toLocaleString('en-IN')}`, icon: BarChart2, color: "text-violet-400" },
          { label: "Conversion", value: `${((sales.conversion_rate || 0) * 100).toFixed(1)}%`, icon: Package, color: "text-orange-400" },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <p className="mt-2 text-xl font-bold text-slate-100">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline by Stage */}
      {(sales.deals_by_stage || []).length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Pipeline by Stage</h3>
          <div className="space-y-3">
            {(sales.deals_by_stage || []).map(stage => {
              const maxVal = Math.max(...(sales.deals_by_stage || []).map(s => s.value), 1)
              const pct = Math.round((stage.value / maxVal) * 100)
              return (
                <div key={stage.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{stage.stage}</span>
                    <span className="text-slate-300">₹{stage.value.toLocaleString('en-IN')} ({stage.count})</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Services + Lead Sources */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Top Services by Revenue</h3>
          <div className="space-y-2">
            {(sales.top_services || []).slice(0, 8).map(s => (
              <div key={s.service} className="flex justify-between text-xs">
                <span className="text-slate-400 capitalize">{s.service.replace(/_/g, ' ')}</span>
                <span className="text-slate-200 font-medium">₹{s.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Lead Sources</h3>
          <div className="space-y-2">
            {(sales.lead_sources || []).map(s => (
              <div key={s.source} className="flex justify-between text-xs">
                <span className="text-slate-400">{s.source}</span>
                <span className="text-slate-200 font-medium">{s.count} leads</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
