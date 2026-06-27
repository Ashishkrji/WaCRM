"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { RefreshCw, CheckCircle2, ArrowUp, Send, MessageSquare, AlertTriangle, User, Clock } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Ticket { id: string; ticket_number: string; title: string; description: string; status: string; priority: string; channel: string; sla_breached: boolean; first_response_due_at: string | null; resolution_due_at: string | null; created_at: string; resolution_note: string | null; ai_suggested_category: string | null; contacts?: { name: string; phone: string } | null }
interface Comment { id: string; content: string; comment_type: string; is_ai_generated: boolean; created_at: string }

const STATUS_OPTIONS = ["open","in_progress","waiting_customer","escalated","resolved","closed"]
const PRIORITY_OPTIONS = ["low","medium","high","urgent","critical"]

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [commentType, setCommentType] = useState<"public" | "internal">("public")
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [tr, cr] = await Promise.all([
      fetch(`/api/support/tickets/${id}`),
      fetch(`/api/support/tickets/${id}/comments`),
    ])
    setTicket(await tr.json().then(d => d.ticket))
    setComments(await cr.json().then(d => d.comments ?? []))
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const updateStatus = async (status: string) => {
    await fetch(`/api/support/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    load()
  }

  const sendComment = async () => {
    if (!newComment.trim()) return
    setSending(true)
    const res = await fetch(`/api/support/tickets/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newComment, comment_type: commentType }) })
    if (res.ok) { setNewComment(""); load() } else toast.error("Failed to add comment")
    setSending(false)
  }

  if (loading) return <div className="flex h-96 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>
  if (!ticket) return <div className="p-6 text-slate-500">Ticket not found</div>

  const dueMs = ticket.resolution_due_at ? new Date(ticket.resolution_due_at).getTime() - Date.now() : null
  const dueHours = dueMs ? Math.floor(dueMs / 3_600_000) : null

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-mono text-primary">{ticket.ticket_number}</p>
          <h1 className="mt-1 text-xl font-bold text-slate-100">{ticket.title}</h1>
          {ticket.contacts && <p className="text-sm text-slate-500 mt-1"><User className="inline h-3 w-3 mr-1" />{ticket.contacts.name} · {ticket.contacts.phone}</p>}
        </div>
        <div className="flex gap-2 flex-none">
          <select value={ticket.status} onChange={e => updateStatus(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:border-primary focus:outline-none capitalize">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          {ticket.description && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-2 text-xs font-semibold text-slate-500">Description</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-500">Comments ({comments.length})</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className={cn("rounded-lg p-3 text-sm", c.comment_type === "internal" ? "border border-orange-800/40 bg-orange-900/10" : "border border-slate-800 bg-slate-800/50")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium uppercase ${c.comment_type === "internal" ? "text-orange-400" : "text-blue-400"}`}>{c.comment_type}</span>
                    {c.is_ai_generated && <span className="text-[10px] text-purple-400">AI</span>}
                    <span className="ml-auto text-[10px] text-slate-600">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-center text-xs text-slate-700 py-4">No comments yet</p>}
            </div>
            {/* Add comment */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div className="flex gap-2">
                {(["public","internal"] as const).map(t => (
                  <button key={t} onClick={() => setCommentType(t)} className={cn("rounded-full px-3 py-1 text-xs capitalize transition-colors", commentType === t ? "bg-primary text-white" : "text-slate-500 hover:text-white")}>{t}</button>
                ))}
              </div>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} placeholder={commentType === "public" ? "Reply to customer..." : "Internal note..."} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:outline-none" />
              <button onClick={sendComment} disabled={sending || !newComment.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500">Details</h3>
            {[
              { label: "Priority", value: <span className={`capitalize font-medium ${ticket.priority === "urgent" || ticket.priority === "critical" ? "text-red-400" : ticket.priority === "high" ? "text-orange-400" : "text-slate-300"}`}>{ticket.priority}</span> },
              { label: "Channel", value: <span className="capitalize text-slate-300">{ticket.channel}</span> },
              { label: "Category", value: <span className="capitalize text-slate-400">{ticket.ai_suggested_category ?? "—"}</span> },
              { label: "Created", value: <span className="text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</span> },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-slate-600">{row.label}</span>
                {row.value}
              </div>
            ))}
          </div>

          {/* SLA */}
          <div className={cn("rounded-xl border p-4 space-y-2", ticket.sla_breached ? "border-red-800/50 bg-red-900/10" : "border-slate-800 bg-slate-900")}>
            <h3 className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" /> SLA</h3>
            {ticket.sla_breached && <div className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle className="h-3 w-3" /> SLA Breached</div>}
            {ticket.resolution_due_at && (
              <div className="text-xs">
                <p className="text-slate-500">Resolution due</p>
                <p className={dueHours !== null && dueHours < 0 ? "text-red-400" : dueHours !== null && dueHours < 4 ? "text-orange-400" : "text-slate-300"}>{new Date(ticket.resolution_due_at).toLocaleString()}</p>
                {dueHours !== null && dueHours > 0 && <p className="text-slate-500">{dueHours}h remaining</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
