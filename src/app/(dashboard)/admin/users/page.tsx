"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, UserPlus, Shield, Ban, CheckCircle, RefreshCw, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface User { user_id: string; full_name: string; email: string; role: string; status: string; created_at: string; last_login_at?: string; avatar_url?: string }

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'text-red-400 bg-red-500/10', admin: 'text-orange-400 bg-orange-500/10',
  manager: 'text-blue-400 bg-blue-500/10', staff: 'text-slate-400 bg-slate-500/10', user: 'text-slate-400 bg-slate-500/10',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '30' })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/admin/users?${params}`)
    const d = await res.json()
    setUsers(d.users ?? [])
    setTotal(d.count ?? 0)
    setLoading(false)
  }, [page, search, roleFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const action = async (userId: string, act: string, extra?: Record<string, unknown>) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action: act, ...extra }),
    })
    if (res.ok) { toast.success('Done'); load() } else { toast.error('Failed') }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">User Management</h1><p className="text-sm text-slate-500">{total} total users</p></div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"><UserPlus className="h-4 w-4" /> Invite User</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search users..." className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:border-primary focus:outline-none">
          <option value="">All Roles</option>
          {['super_admin', 'admin', 'manager', 'staff', 'user'].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:border-primary focus:outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button onClick={load} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Last Login</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.map(u => (
              <tr key={u.user_id} className="hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {u.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", ROLE_COLORS[u.role] ?? 'text-slate-400 bg-slate-800')}>{u.role?.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-IN') : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {u.status === 'active'
                      ? <button onClick={() => action(u.user_id, 'suspend')} className="rounded-lg border border-red-900 p-1.5 text-red-400 hover:bg-red-900/20" title="Suspend"><Ban className="h-3.5 w-3.5" /></button>
                      : <button onClick={() => action(u.user_id, 'activate')} className="rounded-lg border border-emerald-900 p-1.5 text-emerald-400 hover:bg-emerald-900/20" title="Activate"><CheckCircle className="h-3.5 w-3.5" /></button>
                    }
                    <button onClick={() => action(u.user_id, 'force_password_reset')} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-white" title="Force Password Reset"><Shield className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && <tr><td colSpan={6} className="py-12 text-center text-slate-600">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 30 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {Math.min((page - 1) * 30 + 1, total)}–{Math.min(page * 30, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40 hover:text-white">Prev</button>
            <button disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)} className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40 hover:text-white">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
