"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, FileText, DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, Send, Download, RefreshCw, Search, Filter } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  buyer_name: string
  buyer_gstin: string
  grand_total: number
  amount_paid: number
  balance_due: number
  status: string
  invoice_type: string
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'text-slate-400 bg-slate-700/50 border-slate-600',
  sent: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  partially_paid: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  overdue: 'text-red-400 bg-red-500/10 border-red-500/30',
  cancelled: 'text-slate-500 bg-slate-800 border-slate-700',
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 })
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
    const res = await fetch(`/api/gst/invoices${params}`)
    const d = await res.json()
    const list: Invoice[] = d.invoices ?? []
    setInvoices(list)

    // Compute stats
    setStats({
      total: list.reduce((s, i) => s + i.grand_total, 0),
      paid: list.filter(i => i.status === 'paid').reduce((s, i) => s + i.grand_total, 0),
      pending: list.filter(i => ['sent', 'partially_paid'].includes(i.status)).reduce((s, i) => s + i.balance_due, 0),
      overdue: list.filter(i => i.status === 'overdue').reduce((s, i) => s + i.balance_due, 0),
    })
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const INR = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Billing & Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">GST-compliant invoicing and payment tracking</p>
        </div>
        <div className="flex gap-2">
          <Link href="/gst-reports" className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-600 transition-colors">
            <FileText className="h-4 w-4" /> GST Reports
          </Link>
          <Link href="/billing/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> New Invoice
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Invoiced', value: INR(stats.total), icon: FileText, color: 'text-violet-400' },
          { label: 'Amount Received', value: INR(stats.paid), icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Pending', value: INR(stats.pending), icon: Clock, color: 'text-blue-400' },
          { label: 'Overdue', value: INR(stats.overdue), icon: XCircle, color: 'text-red-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <k.icon className={`h-5 w-5 ${k.color}`} />
            <p className="mt-2 text-xl font-bold text-slate-100">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
              statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-slate-700 text-slate-400 hover:text-slate-200")}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-400">No invoices yet</h2>
          <Link href="/billing/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Create Your First Invoice
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="px-4 py-3 text-left">Invoice #</th>
                <th className="px-4 py-3 text-left">Buyer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{inv.invoice_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{inv.buyer_name}</p>
                    {inv.buyer_gstin && <p className="text-[10px] text-slate-600">{inv.buyer_gstin}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(inv.due_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-200">{INR(inv.grand_total)}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span className={inv.balance_due > 0 ? 'text-orange-400' : 'text-emerald-400'}>{INR(inv.balance_due)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", STATUS_STYLES[inv.status])}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/billing/${inv.id}`} className="text-xs text-primary hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
