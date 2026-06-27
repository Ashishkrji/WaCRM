"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Plus, RefreshCw, Calendar, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import type { BiReport } from "@/types"

export function ReportBuilder() {
  const [reports, setReports] = useState<BiReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', report_type: 'sales', export_format: 'csv' })

  useEffect(() => { loadReports() }, [])

  async function loadReports() {
    const res = await fetch('/api/analytics/reports')
    const d = await res.json()
    setReports(d.reports ?? [])
    setLoading(false)
  }

  async function create() {
    if (!form.name) { toast.error('Report name required'); return }
    await fetch('/api/analytics/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    toast.success('Report created')
    setShowCreate(false)
    loadReports()
  }

  async function generate(id: string, format: string) {
    setGenerating(id)
    const res = await fetch('/api/analytics/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', report_id: id, format }),
    })

    if (format === 'csv') {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'report.csv'
      a.click()
    } else {
      const d = await res.json()
      console.log('Report data:', d.result)
      toast.success('Report generated — check console')
    }
    setGenerating(null)
    loadReports()
  }

  if (loading) return <div className="flex h-48 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Saved Reports</h3>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> New Report
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Report name..." className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Type</label>
              <select value={form.report_type} onChange={e => setForm(p => ({ ...p, report_type: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100">
                {['sales','customers','employees','ai','marketing','financial','custom'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Format</label>
              <select value={form.export_format} onChange={e => setForm(p => ({ ...p, export_format: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100">
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="flex-1 rounded-md bg-primary py-2 text-xs font-medium text-white hover:bg-primary/90">Create</button>
            <button onClick={() => setShowCreate(false)} className="rounded-md border border-slate-600 px-3 py-2 text-xs text-slate-400 hover:text-slate-200">Cancel</button>
          </div>
        </div>
      )}

      {reports.length === 0 && !showCreate && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <BarChart2 className="mx-auto h-8 w-8 text-slate-700" />
          <p className="mt-2 text-sm text-slate-500">No saved reports yet</p>
        </div>
      )}

      <div className="space-y-2">
        {reports.map(r => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-slate-200">{r.name}</p>
                <p className="text-xs text-slate-500 capitalize">{r.report_type} · {r.export_format} · {r.generate_count} exports</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {r.last_generated_at && (
                <span className="hidden text-[10px] text-slate-600 lg:block">
                  {new Date(r.last_generated_at).toLocaleDateString()}
                </span>
              )}
              <button
                onClick={() => generate(r.id, r.export_format)}
                disabled={generating === r.id}
                className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                {generating === r.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
