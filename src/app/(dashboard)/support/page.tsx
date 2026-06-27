"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCw, MoreHorizontal, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface Ticket {
  id: string
  ticket_number: string
  title: string
  status: string
  priority: string
  channel: string
  sla_breached: boolean
  first_response_due_at: string | null
  resolution_due_at: string | null
  created_at: string
  contacts?: { name: string; phone: string } | null
}

const STATUS_COLS = [
  { key: "open", label: "Open", color: "border-blue-500/50 bg-blue-500/5" },
  { key: "in_progress", label: "In Progress", color: "border-yellow-500/50 bg-yellow-500/5" },
  { key: "waiting_customer", label: "Waiting", color: "border-orange-500/50 bg-orange-500/5" },
  { key: "escalated", label: "Escalated", color: "border-red-500/50 bg-red-500/5" },
  { key: "resolved", label: "Resolved", color: "border-emerald-500/50 bg-emerald-500/5" },
]

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-slate-400", medium: "text-blue-400", high: "text-orange-400", urgent: "text-red-400", critical: "text-red-500 font-bold",
}

function SLABadge({ dueAt, breached }: { dueAt: string | null; breached: boolean }) {
  if (!dueAt) return null
  const remaining = new Date(dueAt).getTime() - Date.now()
  const hours = Math.floor(remaining / 3_600_000)
  if (breached || remaining < 0) return <span className="text-[10px] text-red-400 flex items-center gap-0.5"><AlertTriangle className="h-2.5 w-2.5" /> Breached</span>
  if (hours < 2) return <span className="text-[10px] text-orange-400">{hours}h left</span>
  return <span className="text-[10px] text-slate-600">{hours}h</span>
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/support/tickets?limit=100")
    const d = await res.json()
    setTickets(d.tickets ?? [])
    // Stats
    const all: Ticket[] = d.tickets ?? []
    setStats({
      total: all.length,
      open: all.filter(t => t.status === "open").length,
      escalated: all.filter(t => t.status === "escalated").length,
      sla_breached: all.filter(t => t.sla_breached).length,
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const byStatus = (status: string) => tickets.filter(t => t.status === status)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Customer Support</h1>
          <p className="text-sm text-slate-500 mt-1">Ticket board with SLA tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-white">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <Link href="/support/new" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">+ New Ticket</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Tickets", value: stats.total ?? 0, color: "text-slate-100" },
          { label: "Open", value: stats.open ?? 0, color: "text-blue-400" },
          { label: "Escalated", value: stats.escalated ?? 0, color: "text-red-400" },
          { label: "SLA Breached", value: stats.sla_breached ?? 0, color: "text-orange-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STATUS_COLS.map(col => (
              <div key={col.key} className={`w-72 rounded-xl border p-3 ${col.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{col.label}</h3>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{byStatus(col.key).length}</span>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {byStatus(col.key).map(ticket => (
                    <Link key={ticket.id} href={`/support/${ticket.id}`}
                      className="block rounded-lg border border-slate-800 bg-slate-900 p-3 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-slate-200 leading-snug flex-1">{ticket.title}</p>
                        {ticket.sla_breached && <AlertTriangle className="h-3 w-3 text-red-400 flex-none mt-0.5" />}
                      </div>
                      <p className="mt-1 text-[10px] font-mono text-slate-600">{ticket.ticket_number}</p>
                      {ticket.contacts && <p className="text-[10px] text-slate-500 mt-1">{ticket.contacts.name}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-[10px] capitalize ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                        <SLABadge dueAt={ticket.resolution_due_at} breached={ticket.sla_breached} />
                      </div>
                    </Link>
                  ))}
                  {byStatus(col.key).length === 0 && (
                    <div className="py-8 text-center text-[10px] text-slate-700">No tickets</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
