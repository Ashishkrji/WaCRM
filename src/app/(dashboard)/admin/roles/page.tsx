"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, XCircle, Loader2, RefreshCw, Save } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PermRow { module: string; action: string; code: string }
interface Role { id: string; name: string; code: string; is_system: boolean; role_permissions: Array<{ permission_code: string; granted: boolean }> }

const MODULES = ['contacts','inbox','leads','deals','meetings','tasks','campaigns','broadcast','reports','analytics','knowledge','prompts','ai_providers','workflows','settings','billing','audit_logs','api','webhooks','developer','users','employees','roles','support','seo','gst']
const ACTIONS = ['view','create','update','delete','approve','export','import']

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<PermRow[]>([])
  const [activeRole, setActiveRole] = useState<string | null>(null)
  const [grantedMap, setGrantedMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/roles')
    const d = await res.json()
    setRoles(d.roles ?? [])
    setPermissions(d.permissions ?? [])
    if (d.roles?.[0] && !activeRole) setActiveRole(d.roles[0].code)
    setLoading(false)
  }, [activeRole])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!activeRole) return
    const role = roles.find(r => r.code === activeRole)
    if (!role) return
    const map: Record<string, boolean> = {}
    for (const rp of role.role_permissions ?? []) {
      map[rp.permission_code] = rp.granted
    }
    setGrantedMap(map)
  }, [activeRole, roles])

  const toggle = async (permCode: string) => {
    const current = grantedMap[permCode] ?? false
    const newVal = !current
    setGrantedMap(m => ({ ...m, [permCode]: newVal }))
    setSaving(permCode)

    const res = await fetch('/api/admin/roles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_code: activeRole, permission_code: permCode, granted: newVal }),
    })

    if (!res.ok) {
      setGrantedMap(m => ({ ...m, [permCode]: current }))
      toast.error('Failed to update permission')
    }
    setSaving(null)
  }

  const activeRoleData = roles.find(r => r.code === activeRole)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">Roles & Permissions</h1><p className="text-sm text-slate-500">Configure role-based access control</p></div>
        <button onClick={load} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {roles.map(r => (
          <button key={r.code} onClick={() => setActiveRole(r.code)}
            className={cn("rounded-lg border px-3 py-1.5 text-xs transition-colors capitalize", activeRole === r.code ? "border-primary bg-primary/10 text-primary" : "border-slate-700 text-slate-400 hover:text-white")}>
            {r.name} {r.is_system && <span className="text-[9px] text-slate-600 ml-1">system</span>}
          </button>
        ))}
      </div>

      {activeRoleData && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
          <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-200">{activeRoleData.name}</h2>
              <p className="text-xs text-slate-500">Click a cell to toggle. Changes save instantly.</p>
            </div>
            <p className="text-xs text-emerald-400">{Object.values(grantedMap).filter(Boolean).length} permissions granted</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="px-4 py-2.5 text-left sticky left-0 bg-slate-900 min-w-32">Module</th>
                {ACTIONS.map(a => <th key={a} className="px-3 py-2.5 text-center capitalize">{a}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {MODULES.map(module => (
                <tr key={module} className="hover:bg-slate-800/30">
                  <td className="px-4 py-2 font-medium text-slate-300 capitalize sticky left-0 bg-slate-900">{module.replace('_', ' ')}</td>
                  {ACTIONS.map(action => {
                    const code = `${module}.${action}`
                    const granted = grantedMap[code] ?? false
                    const isSaving = saving === code
                    return (
                      <td key={action} className="px-3 py-2 text-center">
                        <button onClick={() => toggle(code)} disabled={isSaving} className="mx-auto block transition-transform hover:scale-110">
                          {isSaving
                            ? <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                            : granted
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                              : <XCircle className="h-4 w-4 text-slate-700 mx-auto" />}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
