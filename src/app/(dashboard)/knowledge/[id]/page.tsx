import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Brain, Eye, ThumbsUp, Search, Pencil, Globe, Clock } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const db = supabaseAdmin()
  const { data } = await db.from('knowledge_articles').select('title, meta_description').eq('id', id).single()
  return { title: `${data?.title ?? 'Article'} | Knowledge Base | WaCRM`, description: data?.meta_description ?? '' }
}

export default async function KnowledgeArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabaseAdmin()
  const { data: article } = await db.from('knowledge_articles').select('*, knowledge_categories(name, slug)').eq('id', id).eq('user_id', user.id).single()
  if (!article) redirect('/knowledge')

  // Increment view count
  await db.from('knowledge_articles').update({ view_count: (article.view_count ?? 0) + 1 }).eq('id', id)

  const cat = article.knowledge_categories as { name: string; slug: string } | null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <Link href="/knowledge" className="text-slate-500 hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
        {cat && <Link href={`/knowledge?category=${cat.slug}`} className="text-xs text-slate-500 hover:text-primary">{cat.name}</Link>}
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-400 truncate">{article.title}</span>
      </div>

      {/* Article */}
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-100 leading-snug">{article.title}</h1>
            <Link href={`/knowledge/${id}/edit`} className="flex-none flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <Pencil className="h-3 w-3" /> Edit
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className={`rounded-full px-2 py-0.5 capitalize text-[10px] font-semibold ${article.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>{article.status}</span>
            <span className="capitalize">{article.article_type?.replace('_', ' ')}</span>
            {cat && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{cat.name}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(article.updated_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count} views</span>
            <span className="flex items-center gap-1"><Brain className="h-3 w-3" />{article.ai_use_count} AI uses</span>
          </div>

          {(article.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(article.tags as string[]).map(tag => (
                <span key={tag} className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">{article.content}</div>
        </div>

        {/* Feedback */}
        <div className="border-t border-slate-800 p-4 flex items-center gap-4">
          <p className="text-xs text-slate-500">Was this article helpful?</p>
          <button className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-emerald-400 hover:border-emerald-700 transition-colors">
            <ThumbsUp className="h-3 w-3" /> Yes ({article.helpful_count})
          </button>
          <button className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:border-red-700 transition-colors">
            Not helpful ({article.not_helpful_count})
          </button>
        </div>
      </div>
    </div>
  )
}
