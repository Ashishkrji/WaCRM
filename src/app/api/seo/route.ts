import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { auditURL } from '@/lib/seo/audit-engine'

// GET /api/seo/projects
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource')

  const db = supabaseAdmin()

  if (resource === 'keywords') {
    const projectId = searchParams.get('project_id')
    if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
    const { data, error } = await db.from('seo_keywords').select('*').eq('project_id', projectId).order('search_volume', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ keywords: data ?? [] })
  }

  if (resource === 'content') {
    const projectId = searchParams.get('project_id')
    if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
    const { data, error } = await db.from('seo_content_plan').select('*').eq('project_id', projectId).order('target_publish_date')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ content: data ?? [] })
  }

  const { data, error } = await db.from('seo_projects').select('*, seo_keywords(count), seo_backlinks(count)').eq('user_id', user.id).order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data ?? [] })
}

// POST /api/seo/projects
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { action } = body
  const db = supabaseAdmin()

  if (action === 'audit') {
    const { url, project_id } = body
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

    const result = await auditURL(url)

    if (project_id) {
      await db.from('seo_audits').insert({
        project_id,
        user_id: user.id,
        audit_url: url,
        overall_score: result.overall_score,
        issues: result.issues,
        passed: result.passed,
        warnings: result.warnings,
        meta: result.meta,
        ai_summary: result.ai_summary,
      })
    }

    return NextResponse.json({ audit: result })
  }

  if (action === 'add_keyword') {
    const { project_id, keywords } = body
    if (!project_id || !Array.isArray(keywords)) return NextResponse.json({ error: 'project_id and keywords array required' }, { status: 400 })

    const rows = keywords.map((kw: string) => ({ project_id, user_id: user.id, keyword: kw }))
    const { data, error } = await db.from('seo_keywords').insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ keywords: data ?? [] }, { status: 201 })
  }

  // Create project
  const { name, domain, target_country = 'IN', target_language = 'en' } = body
  if (!name || !domain) return NextResponse.json({ error: 'name and domain required' }, { status: 400 })

  const { data, error } = await db.from('seo_projects').insert({ user_id: user.id, name, domain, target_country, target_language }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data }, { status: 201 })
}
