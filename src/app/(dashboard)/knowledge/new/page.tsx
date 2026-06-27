import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import Link from 'next/link'
import { Plus, BookOpen, ArrowLeft, Pencil } from 'lucide-react'

export const metadata: Metadata = { title: 'New Article | Knowledge Base | WaCRM' }

export default async function NewKnowledgeArticlePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabaseAdmin()
  const { data: categories } = await db.from('knowledge_categories').select('id, name, slug').eq('user_id', user.id).order('name')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/knowledge" className="text-slate-500 hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-100">New Knowledge Article</h1>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">Title *</label>
          <input id="kb-title" type="text" placeholder="Article title..." className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-lg text-slate-100 placeholder-slate-600 focus:border-primary focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Category</label>
            <select id="kb-category" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none">
              <option value="">— Select Category —</option>
              {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Type</label>
            <select id="kb-type" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none">
              {['article','faq','procedure','template','script','policy','guide'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Status</label>
            <select id="kb-status" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500">Tags (comma-separated)</label>
          <input id="kb-tags" type="text" placeholder="whatsapp, support, billing" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">Content (Markdown supported)</label>
          <textarea id="kb-content" rows={20} placeholder="Write your article content here...

## Introduction
...

## Main Content
...

## Conclusion
..." className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:border-primary focus:outline-none leading-relaxed" />
        </div>

        <div className="border-t border-slate-800 pt-4 flex gap-3">
          <button id="kb-save-btn" className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90">
            <BookOpen className="h-4 w-4" /> Save Article
          </button>
          <Link href="/knowledge" className="flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-400 hover:text-white">Cancel</Link>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('kb-save-btn').addEventListener('click', async () => {
          const title = document.getElementById('kb-title').value;
          const content = document.getElementById('kb-content').value;
          const category_id = document.getElementById('kb-category').value;
          const article_type = document.getElementById('kb-type').value;
          const status = document.getElementById('kb-status').value;
          const tags = document.getElementById('kb-tags').value.split(',').map(t => t.trim()).filter(Boolean);
          if (!title || !content) { alert('Title and content are required'); return; }
          const res = await fetch('/api/knowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, category_id: category_id || null, article_type, status, tags }) });
          const d = await res.json();
          if (d.article) { window.location.href = '/knowledge/' + d.article.id; } else { alert(d.error || 'Failed to save'); }
        });
      `}} />
    </div>
  )
}
