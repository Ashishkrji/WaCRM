"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, TrendingUp, TrendingDown, Minus, Globe, Search, BarChart3, RefreshCw, FileText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Project { id: string; name: string; domain: string; status: string; monthly_traffic: number; domain_authority: number }
interface Keyword { id: string; keyword: string; current_rank: number | null; previous_rank: number | null; search_volume: number; difficulty: number; intent: string }

export default function SEOPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: "", domain: "" })
  const [saving, setSaving] = useState(false)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/seo")
    const d = await res.json()
    setProjects(d.projects ?? [])
    if (d.projects?.length > 0 && !activeProject) setActiveProject(d.projects[0])
    setLoading(false)
  }, [activeProject])

  const loadKeywords = useCallback(async (projectId: string) => {
    const res = await fetch(`/api/seo?resource=keywords&project_id=${projectId}`)
    const d = await res.json()
    setKeywords(d.keywords ?? [])
  }, [])

  useEffect(() => { loadProjects() }, [])
  useEffect(() => { if (activeProject) loadKeywords(activeProject.id) }, [activeProject, loadKeywords])

  const createProject = async () => {
    if (!newProject.name || !newProject.domain) return toast.error("Name and domain required")
    setSaving(true)
    const res = await fetch("/api/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newProject) })
    const d = await res.json()
    if (d.project) { setProjects(p => [...p, d.project]); setActiveProject(d.project); setShowNewProject(false); setNewProject({ name: "", domain: "" }) }
    setSaving(false)
  }

  const RankBadge = ({ current, previous }: { current: number | null; previous: number | null }) => {
    if (!current) return <span className="text-xs text-slate-600">—</span>
    const diff = previous ? previous - current : 0
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-slate-200">#{current}</span>
        {diff > 0 && <span className="flex items-center text-[10px] text-emerald-400"><TrendingUp className="h-2.5 w-2.5" />+{diff}</span>}
        {diff < 0 && <span className="flex items-center text-[10px] text-red-400"><TrendingDown className="h-2.5 w-2.5" />{diff}</span>}
        {diff === 0 && previous && <span className="text-[10px] text-slate-600"><Minus className="h-2.5 w-2.5" /></span>}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">SEO & Digital Marketing</h1>
          <p className="text-sm text-slate-500 mt-1">Keyword tracking, audits, and content planning</p>
        </div>
        <button onClick={() => setShowNewProject(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* New Project Form */}
      {showNewProject && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">New SEO Project</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Project Name</label>
              <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="My Website SEO" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Domain</label>
              <input value={newProject.domain} onChange={e => setNewProject(p => ({ ...p, domain: e.target.value }))} placeholder="example.com" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createProject} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Creating..." : "Create Project"}
            </button>
            <button onClick={() => setShowNewProject(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-16 text-center">
          <Globe className="mx-auto h-12 w-12 text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-400">No SEO projects yet</h2>
          <p className="mt-1 text-sm text-slate-600">Create a project to start tracking keywords</p>
          <button onClick={() => setShowNewProject(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Create First Project</button>
        </div>
      ) : (
        <>
          {/* Project tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {projects.map(p => (
              <button key={p.id} onClick={() => setActiveProject(p)}
                className={cn("flex-none rounded-lg border px-4 py-2 text-sm transition-colors", activeProject?.id === p.id ? "border-primary bg-primary/10 text-primary" : "border-slate-700 text-slate-400 hover:text-white")}>
                <Globe className="mr-2 inline h-3.5 w-3.5" />{p.name}
              </button>
            ))}
          </div>

          {activeProject && (
            <div className="space-y-4">
              {/* Project KPIs */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Domain Authority", value: activeProject.domain_authority || "—" },
                  { label: "Monthly Traffic", value: activeProject.monthly_traffic?.toLocaleString() || "—" },
                  { label: "Keywords Tracked", value: keywords.length },
                  { label: "Top 10", value: keywords.filter(k => k.current_rank && k.current_rank <= 10).length },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-2xl font-bold text-slate-100">{k.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                <Link href={`/seo/${activeProject.id}/keywords`} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1"><Search className="h-3 w-3" /> Keywords</Link>
                <Link href={`/seo/${activeProject.id}/audit`} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Audit</Link>
                <Link href={`/seo/${activeProject.id}/content`} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1"><FileText className="h-3 w-3" /> Content Plan</Link>
              </div>

              {/* Keyword Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-300">Keywords</h3>
                  <Link href={`/seo/${activeProject.id}/keywords`} className="text-xs text-primary hover:underline">Manage All</Link>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="px-4 py-3 text-left">Keyword</th>
                      <th className="px-4 py-3 text-center">Rank</th>
                      <th className="px-4 py-3 text-right">Volume</th>
                      <th className="px-4 py-3 text-right">Difficulty</th>
                      <th className="px-4 py-3 text-left">Intent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {keywords.slice(0, 15).map(kw => (
                      <tr key={kw.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-slate-200">{kw.keyword}</td>
                        <td className="px-4 py-3 text-center"><RankBadge current={kw.current_rank} previous={kw.previous_rank} /></td>
                        <td className="px-4 py-3 text-right text-slate-400">{kw.search_volume?.toLocaleString() ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1 w-12 rounded-full bg-slate-800"><div className="h-1 rounded-full" style={{ width: `${kw.difficulty}%`, backgroundColor: kw.difficulty > 70 ? "#ef4444" : kw.difficulty > 40 ? "#f59e0b" : "#10b981" }} /></div>
                            <span className="text-slate-400">{kw.difficulty}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-500">{kw.intent}</td>
                      </tr>
                    ))}
                    {keywords.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-700">No keywords tracked. Add keywords to start.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
