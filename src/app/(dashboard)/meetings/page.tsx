"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Calendar, Plus, Clock, Users, CheckSquare, RefreshCw, Video, MapPin, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Meeting { id: string; title: string; meeting_type: string; status: string; scheduled_at: string; duration_minutes: number; location?: string; meet_link?: string; ai_summary?: string; contacts?: { name: string; phone: string }; meeting_action_items?: Array<{ status: string }> }

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'text-blue-400 bg-blue-500/10', completed: 'text-emerald-400 bg-emerald-500/10',
  cancelled: 'text-red-400 bg-red-500/10', in_progress: 'text-yellow-400 bg-yellow-500/10', no_show: 'text-slate-400 bg-slate-800',
}
const TYPE_LABELS: Record<string, string> = {
  discovery: 'Discovery', demo: 'Demo', proposal: 'Proposal', negotiation: 'Negotiation',
  follow_up: 'Follow-up', onboarding: 'Onboarding', support: 'Support', internal: 'Internal', review: 'Review',
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({ title: '', meeting_type: 'discovery', scheduled_at: '', duration_minutes: 30, location: '', meet_link: '' })
  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    const res = await fetch(`/api/meetings?${p}`)
    const d = await res.json()
    setMeetings(d.meetings ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.title || !form.scheduled_at) return toast.error('Title and date required')
    setSaving(true)
    const res = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.meeting) { setShowCreate(false); load() } else { toast.error('Failed') }
    setSaving(false)
  }

  const summarize = async (id: string) => {
    setSummarizing(id)
    const res = await fetch(`/api/meetings/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'summarize' }) })
    if (res.ok) { toast.success('Summary generated!'); load() } else { toast.error('Failed') }
    setSummarizing(null)
  }

  const upcoming = meetings.filter(m => m.status === 'scheduled')
  const completed = meetings.filter(m => m.status === 'completed')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Meeting Intelligence</h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule, track, and get AI summaries of all meetings</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Schedule Meeting
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm">New Meeting</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select value={form.meeting_type} onChange={e => setForm(f => ({ ...f, meeting_type: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date & Time *</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Duration (min)</label>
              <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Location / Platform</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Google Meet / Office" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Meet Link</label>
              <input value={form.meet_link} onChange={e => setForm(f => ({ ...f, meet_link: e.target.value }))} placeholder="https://meet.google.com/..." className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Scheduling...' : 'Schedule'}</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Upcoming', value: upcoming.length },
          { label: 'Completed', value: completed.length },
          { label: 'With AI Summary', value: meetings.filter(m => m.ai_summary).length },
          { label: 'Total', value: meetings.length },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-2xl font-bold text-slate-100">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'scheduled', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors", statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-slate-700 text-slate-400 hover:text-white")}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {meetings.map(m => {
          const dt = new Date(m.scheduled_at)
          const actionsDone = (m.meeting_action_items ?? []).filter(a => a.status === 'completed').length
          const actionsTotal = m.meeting_action_items?.length ?? 0
          return (
            <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-200">{m.title}</h3>
                  <p className="text-xs text-slate-500">{TYPE_LABELS[m.meeting_type]} • {m.contacts?.name ?? 'No contact'}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize flex-none", STATUS_COLORS[m.status] ?? '')}>{m.status.replace('_', ' ')}</span>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{dt.toLocaleDateString('en-IN')}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-700" />{m.duration_minutes}min</span>
                {m.meet_link && <span className="flex items-center gap-1 text-primary"><Video className="h-3 w-3" />Online</span>}
                {m.location && !m.meet_link && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>}
              </div>
              {m.ai_summary && <p className="text-xs text-slate-400 bg-slate-800/50 rounded-lg p-3 leading-relaxed">{m.ai_summary}</p>}
              {actionsTotal > 0 && <p className="text-xs text-slate-500 flex items-center gap-1"><CheckSquare className="h-3 w-3" />{actionsDone}/{actionsTotal} action items</p>}
              <div className="flex gap-2">
                <Link href={`/meetings/${m.id}`} className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs text-center text-slate-400 hover:text-white">View Detail</Link>
                {m.status === 'completed' && !m.ai_summary && (
                  <button onClick={() => summarize(m.id)} disabled={summarizing === m.id} className="flex-none flex items-center gap-1 rounded-lg bg-purple-900/20 border border-purple-700/40 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-900/30 disabled:opacity-50">
                    <Sparkles className="h-3 w-3" />{summarizing === m.id ? '...' : 'AI Summary'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {meetings.length === 0 && !loading && (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-700 p-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-700" />
            <h2 className="mt-4 text-lg font-semibold text-slate-400">No meetings yet</h2>
            <button onClick={() => setShowCreate(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Schedule First Meeting</button>
          </div>
        )}
      </div>
    </div>
  )
}
