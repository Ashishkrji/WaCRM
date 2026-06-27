import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import Link from 'next/link'
import { Plus, BookOpen, Search, TrendingUp, Brain, FileText } from 'lucide-react'

export const metadata: Metadata = { title: 'Knowledge Base | WaCRM', description: 'AI-powered knowledge management' }

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabaseAdmin()
  const [{ data: articles, count }, { data: categories }, { data: topArticles }] = await Promise.all([
    db.from('knowledge_articles').select('*', { count: 'exact' }).eq('user_id', user.id).order('updated_at', { ascending: false }).limit(5),
    db.from('knowledge_categories').select('*, knowledge_articles(count)').eq('user_id', user.id).order('sort_order'),
    db.from('knowledge_articles').select('id, title, ai_use_count, view_count').eq('user_id', user.id).eq('status', 'published').order('ai_use_count', { ascending: false }).limit(5),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Knowledge Base</h1>
          <p className="text-sm text-slate-500 mt-1">AI-powered articles and contact memory system</p>
        </div>
        <Link href="/knowledge/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Articles', value: count ?? 0, icon: BookOpen, color: 'text-violet-400' },
          { label: 'Published', value: (articles ?? []).filter(a => a.status === 'published').length, icon: FileText, color: 'text-emerald-400' },
          { label: 'Categories', value: categories?.length ?? 0, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Top AI Used', value: (topArticles?.[0]?.ai_use_count ?? 0) + ' times', icon: Brain, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <p className="mt-2 text-2xl font-bold text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Categories */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Categories</h2>
          <div className="space-y-2">
            {(categories ?? []).map(cat => (
              <Link key={cat.id} href={`/knowledge?category=${cat.slug}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 hover:border-slate-700 transition-colors group">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{cat.name}</span>
                </div>
                <span className="text-xs text-slate-600">{cat.article_count} articles</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top AI-Used Articles */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Most Used by AI</h2>
          <div className="space-y-3">
            {(topArticles ?? []).map(a => (
              <Link key={a.id} href={`/knowledge/${a.id}`}
                className="flex items-center justify-between hover:opacity-80 transition-opacity">
                <span className="text-sm text-slate-300 truncate flex-1">{a.title}</span>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-none ml-3">
                  <span className="flex items-center gap-1"><Brain className="h-3 w-3" /> {a.ai_use_count}</span>
                  <span className="flex items-center gap-1"><Search className="h-3 w-3" /> {a.view_count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300">Recent Articles</h2>
          <Link href="/knowledge/all" className="text-xs text-primary hover:underline">View All</Link>
        </div>
        <div className="space-y-2">
          {(articles ?? []).map(a => (
            <Link key={a.id} href={`/knowledge/${a.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 hover:border-slate-700 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-200">{a.title}</p>
                <p className="text-xs text-slate-600 capitalize">{a.article_type} · {a.status}</p>
              </div>
              <span className="text-[10px] text-slate-600">{new Date(a.updated_at).toLocaleDateString()}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
