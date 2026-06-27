"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ShoppingCart, Plus, Package, TrendingUp, RefreshCw, Tag, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Product { id: string; name: string; price: number; sale_price?: number; stock_quantity: number; category?: string; is_synced_to_whatsapp: boolean; is_active: boolean; images?: string[] }
interface OrderStats { total_orders: number; pending: number; delivered: number; revenue_total: number; revenue_this_month: number }

const INR = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

export default function CommerceProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', stock_quantity: 0, category: '', tax_rate: 18, description: '' })
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [prodRes, statsRes] = await Promise.all([
      fetch('/api/commerce/products'),
      fetch('/api/commerce/products?resource=stats'),
    ])
    const [prodData, statsData] = await Promise.all([prodRes.json(), statsRes.json()])
    setProducts(prodData.products ?? [])
    setStats(statsData.stats)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.name || !form.price) return toast.error('Name and price required')
    setSaving(true)
    const res = await fetch('/api/commerce/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
    })
    const d = await res.json()
    if (d.product) { setShowCreate(false); load() } else { toast.error('Failed') }
    setSaving(false)
  }

  const syncToWhatsApp = async (productId: string) => {
    setSyncing(productId)
    const res = await fetch('/api/commerce/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync_whatsapp', product_id: productId }),
    })
    const d = await res.json()
    if (d.success) { toast.success('Synced to WhatsApp!'); load() } else { toast.error('Sync failed — check catalog config') }
    setSyncing(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage products and sync to WhatsApp Business Catalog</p>
        </div>
        <div className="flex gap-2">
          <Link href="/commerce/orders" className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white"><ShoppingCart className="h-4 w-4" /> Orders</Link>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"><Plus className="h-4 w-4" /> Add Product</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Total Orders', value: stats.total_orders },
            { label: 'Pending', value: stats.pending },
            { label: 'Delivered', value: stats.delivered },
            { label: 'Total Revenue', value: INR(stats.revenue_total) },
            { label: 'This Month', value: INR(stats.revenue_this_month) },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-lg font-bold text-slate-100">{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm">Add New Product</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Product Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Price (₹) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Stock Qty</label>
              <input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: parseInt(e.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Category</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">GST Rate (%)</label>
              <input type="number" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: parseInt(e.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Adding...' : 'Add Product'}</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {products.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-16 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-400">No products yet</h2>
          <button onClick={() => setShowCreate(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Add First Product</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-colors">
              <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : <Package className="h-12 w-12 text-slate-600" />}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm leading-snug">{p.name}</h3>
                  {p.category && <p className="text-[10px] text-slate-500 mt-0.5"><Tag className="h-2.5 w-2.5 inline mr-0.5" />{p.category}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-100">{INR(p.sale_price ?? p.price)}</p>
                    {p.sale_price && <p className="text-[10px] text-slate-500 line-through">{INR(p.price)}</p>}
                  </div>
                  <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", (p.stock_quantity ?? 0) > 0 ? "text-emerald-400 bg-emerald-900/20" : "text-red-400 bg-red-900/20")}>
                    {(p.stock_quantity ?? 0) > 0 ? `${p.stock_quantity} in stock` : 'Out of stock'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {p.is_synced_to_whatsapp
                    ? <span className="flex-1 text-center text-[10px] text-emerald-400 py-1">✓ Synced to WhatsApp</span>
                    : <button onClick={() => syncToWhatsApp(p.id)} disabled={syncing === p.id} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-900/20 border border-green-700/30 py-1.5 text-[10px] text-green-400 hover:bg-green-900/30 disabled:opacity-50">
                        <Zap className="h-2.5 w-2.5" />{syncing === p.id ? 'Syncing...' : 'Sync WhatsApp'}
                      </button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
