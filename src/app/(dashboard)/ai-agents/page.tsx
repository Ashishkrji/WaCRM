"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Bot, Plus, MessageSquare, Settings, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Agent { id: string; name: string; agent_type: string; status: string; conversation_count: number; resolution_rate: number; model: string; is_default: boolean }

const TYPE_COLORS: Record<string, string> = {
  support: 'text-blue-400 bg-blue-500/10', sales: 'text-emerald-400 bg-emerald-500/10', marketing: 'text-purple-400 bg-purple-500/10',
  onboarding: 'text-yellow-400 bg-yellow-500/10', faq: 'text-slate-400 bg-slate-500/10', custom: 'text-pink-400 bg-pink-500/10',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400', draft: 'text-slate-400', paused: 'text-yellow-400', training: 'text-blue-400',
}

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', agent_type: 'support', description: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/ai/npc-agents')
    const d = await res.json()
    setAgents(d.agents ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.name) return toast.error('Name required')
    setSaving(true)
    const res = await fetch('/api/ai/npc-agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.agent) { setShowCreate(false); load() } else { toast.error('Failed to create agent') }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI Chat Agents</h1>
          <p className="text-sm text-slate-500 mt-0.5">NVIDIA NIM-powered conversational agents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"><Plus className="h-4 w-4" /> New Agent</button>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm">Create New AI Agent</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Agent Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Support Agent" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select value={form.agent_type} onChange={e => setForm(f => ({ ...f, agent_type: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none">
                {['support','sales','marketing','onboarding','faq','custom'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Agents', value: agents.length },
          { label: 'Active', value: agents.filter(a => a.status === 'active').length },
          { label: 'Conversations', value: agents.reduce((s, a) => s + (a.conversation_count ?? 0), 0) },
          { label: 'Avg Resolution', value: `${agents.length > 0 ? Math.round(agents.reduce((s, a) => s + (a.resolution_rate ?? 0), 0) / agents.length) : 0}%` },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-2xl font-bold text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {agents.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-16 text-center">
          <Bot className="mx-auto h-12 w-12 text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-400">No AI agents yet</h2>
          <button onClick={() => setShowCreate(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Create First Agent</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <div key={agent.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{agent.name}</h3>
                    <span className={cn("text-[10px] capitalize font-semibold", STATUS_COLORS[agent.status] ?? 'text-slate-500')}>{agent.status}</span>
                  </div>
                </div>
                <span className={cn("text-[9px] capitalize rounded-full px-1.5 py-0.5 font-semibold", TYPE_COLORS[agent.agent_type] ?? '')}>{agent.agent_type}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-slate-800/50 py-2">
                  <p className="font-bold text-slate-200">{agent.conversation_count ?? 0}</p>
                  <p className="text-[10px] text-slate-600">Conversations</p>
                </div>
                <div className="rounded-lg bg-slate-800/50 py-2">
                  <p className="font-bold text-slate-200">{Math.round(agent.resolution_rate ?? 0)}%</p>
                  <p className="text-[10px] text-slate-600">Resolved</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/ai-agents/${agent.id}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-2 text-xs text-slate-400 hover:text-white">
                  <Settings className="h-3 w-3" /> Configure
                </Link>
                <Link href={`/ai-agents/${agent.id}?tab=chat`} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 py-2 text-xs text-primary hover:bg-primary/20">
                  <MessageSquare className="h-3 w-3" /> Test Chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
