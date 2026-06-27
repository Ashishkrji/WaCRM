"use client"

import { useState } from "react"
import { getTemplates, getTemplatesByCategory, type TemplateDefinition } from "@/lib/workflows/templates"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Zap, RefreshCw, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowCategory } from "@/types"

const CATEGORY_COLORS: Record<string, string> = {
  lead: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  sales: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  marketing: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  support: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  payment: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  retention: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  proposal: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  meeting: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
  crm: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  custom: 'bg-slate-700/50 border-slate-600 text-slate-400',
}

export function TemplateGallery() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [importing, setImporting] = useState<string | null>(null)
  const grouped = getTemplatesByCategory()
  const allTemplates = getTemplates()
  const shown = activeCategory === 'all' ? allTemplates : (grouped[activeCategory] ?? [])

  async function importTemplate(t: TemplateDefinition) {
    setImporting(t.slug)
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: t.name,
          description: t.description,
          trigger_type: t.trigger_type,
          category: t.category,
          nodes: t.nodes,
          edges: t.edges,
          is_active: false,
          status: 'draft',
        }),
      })
      if (!res.ok) throw new Error('Import failed')
      const d = await res.json()
      toast.success(`Template imported: ${t.name}`)
      router.push(`/workflows/${d.workflow.id}`)
    } catch {
      toast.error('Failed to import template')
    } finally {
      setImporting(null)
    }
  }

  const categories = ['all', ...Object.keys(grouped)]

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
              activeCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-slate-700 text-slate-400 hover:text-slate-200",
            )}
          >
            {cat} {cat !== 'all' && <span className="ml-1 text-slate-600">({(grouped[cat] ?? []).length})</span>}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map(t => (
          <div key={t.slug} className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-black/20">
            <div className="flex items-start justify-between">
              <div className={cn("rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.custom)}>
                {t.category}
              </div>
              <div className="text-[10px] text-slate-600">{t.nodes.length} nodes</div>
            </div>

            <h3 className="mt-3 text-sm font-semibold text-slate-200">{t.name}</h3>
            <p className="mt-1 flex-1 text-xs text-slate-500 line-clamp-2">{t.description}</p>

            <div className="mt-3 flex flex-wrap gap-1">
              {t.tags.map(tag => (
                <span key={tag} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">{tag}</span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] text-slate-600">Trigger: <span className="text-slate-500">{t.trigger_type.replace(/_/g, ' ')}</span></span>
              <button
                onClick={() => importTemplate(t)}
                disabled={importing === t.slug}
                className="ml-auto flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {importing === t.slug ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Use Template
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
