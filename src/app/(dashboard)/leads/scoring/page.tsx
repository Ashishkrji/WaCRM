"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { TrendingUp, Plus, Target, Trophy, Users, RefreshCw, Zap, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface LeadScore { id: string; total_score: number; score_grade: string; is_mql: boolean; is_sql: boolean; conversion_probability: number; contacts: { name: string; phone: string; company?: string; email?: string } }

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-300 bg-emerald-900/20 border-emerald-700/40', A: 'text-emerald-400 bg-emerald-900/10 border-emerald-800',
  B: 'text-blue-400 bg-blue-900/10 border-blue-800', C: 'text-yellow-400 bg-yellow-900/10 border-yellow-800',
  D: 'text-orange-400 bg-orange-900/10 border-orange-800', F: 'text-red-400 bg-red-900/10 border-red-800',
}

export default function LeadScoringPage() {
  const [scores, setScores] = useState<LeadScore[]>([])
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/leads/scoring?resource=top&limit=50')
    const d = await res.json()
    setScores(d.leads ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const scoreAll = async () => {
    setScoring(true)
    const res = await fetch('/api/leads/scoring', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'score_all' }) })
    const d = await res.json()
    if (d.success) { toast.success(`Scored ${d.scored} contacts`); load() } else { toast.error('Failed') }
    setScoring(false)
  }

  const mqls = scores.filter(s => s.is_mql).length
  const sqls = scores.filter(s => s.is_sql).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Lead Scoring & Intelligence</h1>
          <p className="text-sm text-slate-500 mt-0.5">AI-powered lead qualification and conversion prediction</p>
        </div>
        <button onClick={scoreAll} disabled={scoring} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
          <Zap className={cn("h-4 w-4", scoring && "animate-spin")} /> {scoring ? 'Scoring...' : 'Score All'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Scored', value: scores.length, icon: Users, color: 'text-slate-400' },
          { label: 'MQLs', value: mqls, icon: Target, color: 'text-blue-400' },
          { label: 'SQLs', value: sqls, icon: Trophy, color: 'text-emerald-400' },
          { label: 'A+ Leads', value: scores.filter(s => s.score_grade === 'A+').length, icon: TrendingUp, color: 'text-purple-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-2"><k.icon className={cn("h-4 w-4", k.color)} /></div>
            <p className="text-2xl font-bold text-slate-100">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Lead Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300">Top Leads by Score</h2>
          <button onClick={load} className="text-slate-500 hover:text-white"><RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /></button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3 text-center">Grade</th>
              <th className="px-4 py-3 text-center">MQL</th>
              <th className="px-4 py-3 text-center">SQL</th>
              <th className="px-4 py-3 text-right">Conversion</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {scores.map(s => (
              <tr key={s.id} className="hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{s.contacts?.name ?? '—'}</p>
                  <p className="text-xs text-slate-500">{s.contacts?.company ?? s.contacts?.email}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-slate-800">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${s.total_score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{s.total_score}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("rounded border px-2 py-0.5 text-xs font-bold", GRADE_COLORS[s.score_grade] ?? '')}>{s.score_grade}</span>
                </td>
                <td className="px-4 py-3 text-center">{s.is_mql ? <span className="text-blue-400 text-xs">✓ MQL</span> : <span className="text-slate-700 text-xs">—</span>}</td>
                <td className="px-4 py-3 text-center">{s.is_sql ? <span className="text-emerald-400 text-xs">✓ SQL</span> : <span className="text-slate-700 text-xs">—</span>}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-200">{Math.round(s.conversion_probability ?? 0)}%</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/contacts/${s.contacts?.name}`} className="text-xs text-primary hover:underline flex items-center gap-0.5 justify-end">View <ChevronRight className="h-3 w-3" /></Link>
                </td>
              </tr>
            ))}
            {scores.length === 0 && !loading && <tr><td colSpan={7} className="py-12 text-center text-slate-600">No scored leads yet. Click "Score All" to start.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
