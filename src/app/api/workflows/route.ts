import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'

// GET /api/workflows — list all workflows for the authenticated user
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')

  const db = supabaseAdmin()
  let query = db
    .from('workflows')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ workflows: data ?? [] })
}

// POST /api/workflows — create a new workflow
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const {
    name, description, trigger_type, trigger_config = {},
    category = 'custom', nodes = [], edges = [],
    is_active = false,
  } = body

  if (!name || !trigger_type) {
    return NextResponse.json({ error: 'name and trigger_type are required' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Create workflow
  const { data: workflow, error: wfErr } = await db
    .from('workflows')
    .insert({
      user_id: user.id,
      name,
      description: description ?? null,
      trigger_type,
      trigger_config,
      category,
      is_active,
      status: is_active ? 'published' : 'draft',
      version: 1,
    })
    .select()
    .single()

  if (wfErr || !workflow) {
    return NextResponse.json({ error: wfErr?.message ?? 'insert failed' }, { status: 500 })
  }

  // Insert nodes
  if (nodes.length > 0) {
    const nodeRows = nodes.map((n: Record<string, unknown>) => ({
      ...n,
      workflow_id: workflow.id,
      user_id: user.id,
    }))
    const { error: nodesErr } = await db.from('workflow_nodes').insert(nodeRows)
    if (nodesErr) console.error('[workflows] node insert failed:', nodesErr)
  }

  // Insert edges (after nodes to avoid FK issues)
  if (edges.length > 0) {
    const edgeRows = edges.map((e: Record<string, unknown>) => ({
      ...e,
      workflow_id: workflow.id,
      user_id: user.id,
    }))
    const { error: edgesErr } = await db.from('workflow_edges').insert(edgeRows)
    if (edgesErr) console.error('[workflows] edge insert failed:', edgesErr)
  }

  // Save initial version
  await db.from('workflow_versions').insert({
    workflow_id: workflow.id,
    version_number: 1,
    nodes,
    edges,
    trigger_config,
    changelog: 'Initial version',
  })

  return NextResponse.json({ workflow }, { status: 201 })
}
