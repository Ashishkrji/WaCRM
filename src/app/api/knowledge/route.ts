import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { searchKnowledgeBase, indexArticle, logSearch } from '@/services/knowledge/vector-search'

// GET /api/knowledge?q=&category=&page=
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const category = searchParams.get('category') ?? undefined
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  // Semantic search mode
  if (q && q.length >= 3) {
    const results = await searchKnowledgeBase(q, user.id, limit, category)
    await logSearch({ userId: user.id, query: q, results })
    return NextResponse.json({ articles: results, query: q, search_mode: 'semantic' })
  }

  // Browse mode
  const db = supabaseAdmin()
  let query = db
    .from('knowledge_articles')
    .select('id, title, excerpt, article_type, status, tags, view_count, helpful_count, ai_use_count, category_id, created_at, updated_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (category) {
    const { data: cat } = await db.from('knowledge_categories').select('id').eq('user_id', user.id).eq('slug', category).single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const statusFilter = searchParams.get('status')
  if (statusFilter) query = query.eq('status', statusFilter)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ articles: data ?? [], count, page })
}

// POST /api/knowledge — create article
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { title, content, category_id, tags, article_type = 'article', status = 'draft', language = 'en', meta_title, meta_description } = body
  if (!title || !content) return NextResponse.json({ error: 'title and content required' }, { status: 400 })

  // Generate slug
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
  const excerpt = content.replace(/[#*`[\]]/g, '').slice(0, 200).trim()

  const db = supabaseAdmin()
  const { data: article, error } = await db
    .from('knowledge_articles')
    .insert({
      user_id: user.id, title, slug, content, excerpt, category_id, tags: tags ?? [], article_type, status, language, meta_title, meta_description,
      ...(status === 'published' && { published_at: new Date().toISOString() }),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Index for vector search asynchronously
  if (status === 'published') {
    indexArticle(article.id, user.id).catch(console.error)
  }

  return NextResponse.json({ article }, { status: 201 })
}
