"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ShoppingBag, Search, Filter, RefreshCw, FileText, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Order { id: string; order_number: string; status: string; payment_status: string; total: number; currency: string; created_at: string; contacts?: { name: string; phone: string }; commerce_order_items?: Array<{ product_name: string; quantity: number }> }

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-500/10', confirmed: 'text-blue-400 bg-blue-500/10',
  shipped: 'text-purple-400 bg-purple-500/10', delivered: 'text-emerald-400 bg-emerald-500/10',
  cancelled: 'text-red-400 bg-red-500/10',
}

const INR = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function CommerceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    const res = await fetch(`/api/commerce/orders?${p}`)
    const d = await res.json()
    setOrders(d.orders ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = orders.filter(o => !search || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.contacts?.name.toLowerCase().includes(search.toLowerCase()) || o.contacts?.phone.includes(search))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage WhatsApp and manual orders</p>
        </div>
        <div className="flex gap-2">
          <Link href="/commerce/products" className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white">Catalog</Link>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">New Order</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order #, customer, phone..." className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:border-primary focus:outline-none">
          <option value="">All Status</option>
          {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <button onClick={load} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Payment</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <p className="font-mono text-primary font-medium">{o.order_number}</p>
                  <p className="text-[10px] text-slate-500">{o.commerce_order_items?.length} items</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{o.contacts?.name ?? '—'}</p>
                  <p className="text-xs text-slate-500">{o.contacts?.phone}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("rounded border px-2 py-0.5 text-xs font-bold capitalize", STATUS_COLORS[o.status] ?? '')}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", o.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400')}>{o.payment_status}</span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-200">{INR(o.total)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/commerce/orders/${o.id}`} className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">View <ChevronRight className="h-3 w-3" /></Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && <tr><td colSpan={7} className="py-12 text-center text-slate-600">No orders found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
