"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Clock, User, RefreshCw, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { WorkflowApproval } from "@/types"

export function ApprovalManager() {
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { loadApprovals() }, [])

  async function loadApprovals() {
    const res = await fetch('/api/workflows/approvals')
    const d = await res.json()
    setApprovals(d.approvals ?? [])
    setLoading(false)
  }

  async function act(id: string, action: 'approved' | 'rejected', comment = '') {
    setActing(id)
    const res = await fetch(`/api/workflows/approvals/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment }),
    })
    const d = await res.json()
    if (res.ok) {
      toast.success(`Approval ${action}`)
      loadApprovals()
    } else {
      toast.error(d.error)
    }
    setActing(null)
  }

  if (loading) return <div className="flex h-48 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Pending Approvals</h3>
        <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400">{approvals.length}</span>
      </div>

      {approvals.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/50" />
          <p className="mt-2 text-sm text-slate-500">No pending approvals</p>
        </div>
      )}

      {approvals.map(ap => (
        <div key={ap.id} className="rounded-xl border border-orange-500/20 bg-slate-900 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-200">{ap.title}</p>
              {ap.description && <p className="mt-1 text-xs text-slate-500">{ap.description}</p>}
              <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-600">
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ap.approvers.length} approver(s)</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(ap.created_at).toLocaleDateString()}</span>
                <span className="capitalize">{ap.approval_mode.replace('_', ' ')}</span>
              </div>
            </div>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-400">Pending</span>
          </div>

          {/* Context preview */}
          {Object.keys(ap.context).length > 0 && (
            <div className="mt-3 rounded-lg bg-slate-800/50 px-3 py-2 text-[10px] text-slate-500 font-mono">
              {JSON.stringify(ap.context).slice(0, 120)}...
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => act(ap.id, 'approved')}
              disabled={acting === ap.id}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
            <button
              onClick={() => act(ap.id, 'rejected')}
              disabled={acting === ap.id}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
