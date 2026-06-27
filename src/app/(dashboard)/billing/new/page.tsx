"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Save, Send, RefreshCw, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { calculateInvoice } from "@/lib/gst/calculator"
import { cn } from "@/lib/utils"

interface LineItem { description: string; hsn_sac: string; quantity: number; rate: number; discount_pct: number; tax_rate: number; unit?: string }

const TAX_SLABS = [0, 5, 12, 18, 28]
const UNITS = ["NOS", "SQF", "MTR", "KG", "LTR", "HRS", "DAYS", "MONTHS", "PCS", "SET"]

export default function NewInvoicePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isInterstate, setIsInterstate] = useState(false)
  const [form, setForm] = useState({ buyer_name: "", buyer_gstin: "", buyer_email: "", buyer_phone: "", buyer_address: "", buyer_state_code: "09", invoice_date: new Date().toISOString().split("T")[0], due_date: "", notes: "" })
  const [items, setItems] = useState<LineItem[]>([{ description: "", hsn_sac: "", quantity: 1, rate: 0, discount_pct: 0, tax_rate: 18 }])

  const calc = calculateInvoice(items, { isInterstate })
  const INR = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

  const addItem = () => setItems(prev => [...prev, { description: "", hsn_sac: "", quantity: 1, rate: 0, discount_pct: 0, tax_rate: 18 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, key: keyof LineItem, value: string | number) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item))

  const save = async (send = false) => {
    if (!form.buyer_name) return toast.error("Buyer name is required")
    setSaving(true)
    try {
      const payload = { ...form, ...calc, invoice_type: "tax_invoice", status: send ? "sent" : "draft", is_interstate: isInterstate, items: calc.items }
      const res = await fetch("/api/gst/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error((await res.json()).error)
      const { invoice } = await res.json()
      toast.success(send ? "Invoice sent!" : "Invoice saved as draft")
      router.push(`/billing/${invoice.id}`)
    } catch (e) {
      toast.error(String(e))
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">New GST Invoice</h1>
        <div className="flex gap-2">
          <button onClick={() => save(false)} disabled={saving} className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 disabled:opacity-50">
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button onClick={() => save(true)} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Invoice
          </button>
        </div>
      </div>

      {/* Buyer Details */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Bill To</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { key: "buyer_name", label: "Buyer Name *", placeholder: "Company or Person" },
            { key: "buyer_gstin", label: "GSTIN", placeholder: "15-character GSTIN" },
            { key: "buyer_email", label: "Email", placeholder: "buyer@company.com" },
            { key: "buyer_phone", label: "Phone", placeholder: "+91 9876543210" },
          ].map(f => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-slate-500">{f.label}</label>
              <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:outline-none" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Address</label>
            <textarea value={form.buyer_address} onChange={e => setForm(p => ({ ...p, buyer_address: e.target.value }))} rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Invoice Date</label>
            <input type="date" value={form.invoice_date} onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Transaction Type</label>
            <select value={isInterstate ? "interstate" : "intrastate"} onChange={e => setIsInterstate(e.target.value === "interstate")}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none">
              <option value="intrastate">Intra-state (CGST+SGST)</option>
              <option value="interstate">Inter-state (IGST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Line Items</h2>
          <button onClick={addItem} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" /> Add Item</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-2 text-left w-40">Description</th>
                <th className="py-2 text-left w-24">HSN/SAC</th>
                <th className="py-2 text-right w-16">Qty</th>
                <th className="py-2 text-left w-16">Unit</th>
                <th className="py-2 text-right w-24">Rate (₹)</th>
                <th className="py-2 text-right w-16">Disc%</th>
                <th className="py-2 text-right w-16">GST%</th>
                <th className="py-2 text-right w-24">Amount</th>
                <th className="py-2 w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.map((item, i) => {
                const calcItem = calc.items[i]
                return (
                  <tr key={i}>
                    <td className="py-2 pr-2"><input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Description" className="w-full bg-transparent text-slate-200 placeholder-slate-700 focus:outline-none" /></td>
                    <td className="py-2 pr-2"><input value={item.hsn_sac} onChange={e => updateItem(i, "hsn_sac", e.target.value)} placeholder="HSN/SAC" className="w-full bg-transparent text-slate-400 placeholder-slate-700 focus:outline-none" /></td>
                    <td className="py-2 pr-2 text-right"><input type="number" min="0" value={item.quantity} onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-right text-slate-200 focus:outline-none" /></td>
                    <td className="py-2 pr-2"><select value={item.unit ?? "NOS"} onChange={e => updateItem(i, "unit" as keyof LineItem, e.target.value)} className="bg-transparent text-slate-400 focus:outline-none">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></td>
                    <td className="py-2 pr-2 text-right"><input type="number" min="0" value={item.rate} onChange={e => updateItem(i, "rate", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-right text-slate-200 focus:outline-none" /></td>
                    <td className="py-2 pr-2 text-right"><input type="number" min="0" max="100" value={item.discount_pct} onChange={e => updateItem(i, "discount_pct", parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-right text-slate-400 focus:outline-none" /></td>
                    <td className="py-2 pr-2 text-right">
                      <select value={item.tax_rate} onChange={e => updateItem(i, "tax_rate", parseInt(e.target.value))} className="bg-transparent text-slate-400 focus:outline-none">
                        {TAX_SLABS.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-2 text-right font-medium text-slate-200">{INR(calcItem?.total_amount ?? 0)}</td>
                    <td className="py-2">
                      {items.length > 1 && <button onClick={() => removeItem(i)} className="text-slate-600 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-slate-800 pt-4">
          <div className="ml-auto max-w-xs space-y-1.5 text-xs">
            {[
              { label: "Subtotal", value: INR(calc.subtotal) },
              ...(calc.discount_amount > 0 ? [{ label: "Discount", value: `-${INR(calc.discount_amount)}` }] : []),
              { label: "Taxable Value", value: INR(calc.taxable_value) },
              ...(!isInterstate ? [{ label: "CGST", value: INR(calc.cgst_amount) }, { label: "SGST", value: INR(calc.sgst_amount) }] : [{ label: "IGST", value: INR(calc.igst_amount) }]),
            ].map(r => (
              <div key={r.label} className="flex justify-between text-slate-400"><span>{r.label}</span><span>{r.value}</span></div>
            ))}
            <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-bold text-slate-100">
              <span>Total</span><span>{INR(calc.grand_total)}</span>
            </div>
            <p className="text-[10px] text-slate-600 italic">{calc.amount_in_words}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <label className="mb-2 block text-xs text-slate-500">Notes / Terms</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Payment terms, bank details, thank you note..." className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:outline-none" />
      </div>
    </div>
  )
}
