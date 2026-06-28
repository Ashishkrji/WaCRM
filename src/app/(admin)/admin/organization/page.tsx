"use client"

import { useState, useEffect, useCallback } from "react"
import { Building2, Save, RefreshCw, Upload, Globe, Phone, MapPin } from "lucide-react"
import { toast } from "sonner"

export default function OrganizationSettingsPage() {
  const [form, setForm] = useState({ name: '', legal_name: '', website: '', phone: '', email: '', address: '', city: '', state: '', country: 'India', zip: '', tax_id: '', currency: 'INR', timezone: 'Asia/Kolkata' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/organization')
    if (res.ok) {
      const d = await res.json()
      if (d.settings) setForm(f => ({ ...f, ...d.settings }))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/organization', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) toast.success('Settings saved')
    else toast.error('Failed to save settings')
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Organization Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your business profile, tax info, and localization.</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-slate-600" /></div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-2">Business Profile</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-800 flex items-center justify-center border border-dashed border-slate-600"><Building2 className="h-6 w-6 text-slate-600" /></div>
                  <button className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"><Upload className="h-3.5 w-3.5" /> Upload Logo</button>
                </div>
              </div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Legal Name</label><input value={form.legal_name} onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Website</label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Phone</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-2">Address & Tax</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="col-span-2"><label className="block text-xs font-medium text-slate-400 mb-1">Street Address</label><div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">State / Province</label><input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Country</label><input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">ZIP / Postal Code</label><input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Tax ID / GSTIN</label><input value={form.tax_id} onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none uppercase" /></div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={load} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
