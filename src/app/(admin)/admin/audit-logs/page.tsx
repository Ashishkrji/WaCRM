"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuditLog { id: string; action: string; module: string; resource?: string; ip_address?: string; created_at: string; severity: string; profiles?: { full_name: string; email: string } }

const SEV_STYLES: Record<string, string> = {
  info: 'text-slate-400', warning: 'text-yellow-400 bg-yellow-500/10', critical: 'text-red-400 bg-red-500/10', error: 'text-red-400'
}

const MODULES = ['users','contacts','inbox','leads','deals','meetings','campaigns','workflows','settings','billing','ai_providers','knowledge','support','seo']

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [module, setModule] = useState('')
  const [severity, setSeverity] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), limit: '50' })
    if (module) p.set('module', module)
    if (severity) p.set('severity', severity)
    if (search) p.set('action', search)
    const res = await fetch(`/api/admin/audit-logs?${p}`)
    const d = await res.json()
    setLogs(d.logs ?? [])
    setTotal(d.count ?? 0)
    setLoading(false)
  }, [page, module, severity, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1><p className="text-sm text-slate-500">{total.toLocaleString()} total events</p></div>
        <button onClick={load} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search actions..." className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
        </div>
        <select value={module} onChange={e => { setModule(e.target.value); setPage(1) }} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:border-primary focus:outline-none">
          <option value="">All Modules</option>
          {MODULES.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
        </select>
        <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1) }} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:border-primary focus:outline-none">
          <option value="">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Module</th>
              <th className="px-4 py-3 text-center">Severity</th>
              <th className="px-4 py-3 text-left">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-500 font-mono whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-IN')}</td>
                <td className="px-4 py-2.5">
                  {log.profiles ? <div><p className="text-slate-200">{log.profiles.full_name}</p><p className="text-slate-600">{log.profiles.email}</p></div> : <span className="text-slate-600">—</span>}
                </td>
                <td className="px-4 py-2.5 font-mono text-primary">{log.action}</td>
                <td className="px-4 py-2.5 capitalize text-slate-400">{log.module}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] capitalize", SEV_STYLES[log.severity] ?? '')}>{log.severity}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 font-mono">{log.ip_address ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && !loading && <tr><td colSpan={6} className="py-12 text-center text-slate-600">No logs found</td></tr>}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {Math.ceil(total / 50)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40 hover:text-white">Prev</button>
            <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)} className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40 hover:text-white">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
