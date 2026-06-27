"use client"

import { useState } from "react"
import { ShieldAlert, Lock, AlertTriangle, KeyRound, Clock, ShieldCheck, Globe } from "lucide-react"

export default function SecurityCenterPage() {
  const [form, setForm] = useState({
    min_password_length: 12,
    require_symbols: true,
    require_numbers: true,
    require_uppercase: true,
    session_timeout_minutes: 120,
    mfa_enforced: false,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    ip_whitelist: '',
  })

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Security Center</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage password policies, sessions, and access controls</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-slate-200">Password Policy</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Minimum Length ({form.min_password_length})</label>
            <input type="range" min="8" max="32" value={form.min_password_length} onChange={e => setForm(f => ({ ...f, min_password_length: parseInt(e.target.value) }))} className="w-full accent-primary" />
          </div>
          <label className="flex items-center justify-between text-sm text-slate-300">
            Require Symbols <input type="checkbox" checked={form.require_symbols} onChange={e => setForm(f => ({ ...f, require_symbols: e.target.checked }))} className="h-4 w-4 accent-primary" />
          </label>
          <label className="flex items-center justify-between text-sm text-slate-300">
            Require Numbers <input type="checkbox" checked={form.require_numbers} onChange={e => setForm(f => ({ ...f, require_numbers: e.target.checked }))} className="h-4 w-4 accent-primary" />
          </label>
          <label className="flex items-center justify-between text-sm text-slate-300">
            Require Uppercase <input type="checkbox" checked={form.require_uppercase} onChange={e => setForm(f => ({ ...f, require_uppercase: e.target.checked }))} className="h-4 w-4 accent-primary" />
          </label>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-slate-200">Threat Protection</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Max Login Attempts</label>
            <input type="number" value={form.max_login_attempts} onChange={e => setForm(f => ({ ...f, max_login_attempts: parseInt(e.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Lockout Duration (minutes)</label>
            <input type="number" value={form.lockout_duration_minutes} onChange={e => setForm(f => ({ ...f, lockout_duration_minutes: parseInt(e.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary" />
          </div>
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-700/50 p-3 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200">Brute force protection is enabled. Accounts will be locked out after {form.max_login_attempts} failed attempts.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-200">Session Management</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Idle Session Timeout (minutes)</label>
            <input type="number" value={form.session_timeout_minutes} onChange={e => setForm(f => ({ ...f, session_timeout_minutes: parseInt(e.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-primary" />
          </div>
          <label className="flex items-center justify-between text-sm text-slate-300 pt-2 border-t border-slate-800">
            <span>Enforce MFA for all users</span> <input type="checkbox" checked={form.mfa_enforced} onChange={e => setForm(f => ({ ...f, mfa_enforced: e.target.checked }))} className="h-4 w-4 accent-primary" />
          </label>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Globe className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-200">Network Access</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">IP Whitelist (comma-separated, leave blank to allow all)</label>
            <textarea rows={3} value={form.ip_whitelist} onChange={e => setForm(f => ({ ...f, ip_whitelist: e.target.value }))} placeholder="e.g. 192.168.1.1, 203.0.113.5" className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 font-mono focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 flex items-center gap-2"><Lock className="h-4 w-4" /> Save Security Policies</button>
      </div>
    </div>
  )
}
