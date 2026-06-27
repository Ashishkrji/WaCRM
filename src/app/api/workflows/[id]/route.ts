import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'

type Params = { params: Promise<{ id: string }> }

// GET /api/workflows/[id]
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const [wfRes, nodesRes, edgesRes] = await Promise.all([
    db.from('workflows').select('*').eq('id', id).eq('user_id', user.id).single(),
    db.from('workflow_nodes').select('*').eq('workflow_id', id),
    db.from('workflow_edges').select('*').eq('workflow_id', id),
  ])

  if (wfRes.error || !wfRes.data) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  return NextResponse.json({
    workflow: {
      ...wfRes.data,
      nodes: nodesRes.data ?? [],
      edges: edgesRes.data ?? [],
    },
  })
}

// PATCH /api/workflows/[id] — update workflow
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const db = supabaseAdmin()

  // Verify ownership
  const { data: existing } = await db.from('workflows').select('id, version').eq('id', id).eq('user_id', user.id).single()
  if (!existing) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })

  const { nodes, edges, create_version, changelog, ...wfFields } = body

  // Update workflow metadata
  const allowedFields = ['name', 'description', 'trigger_type', 'trigger_config', 'category', 'is_active', 'status', 'metadata']
  const updates: Record<string, unknown> = {}
  allowedFields.forEach((k) => { if (k in wfFields) updates[k] = wfFields[k] })

  if (Object.keys(updates).length > 0) {
    await db.from('workflows').update(updates).eq('id', id)
  }

  // Update nodes/edges if provided
  if (nodes !== undefined) {
    await db.from('workflow_nodes').delete().eq('workflow_id', id)
    if (nodes.length > 0) {
      await db.from('workflow_nodes').insert(
        nodes.map((n: Record<string, unknown>) => ({ ...n, workflow_id: id, user_id: user.id }))
      )
    }
  }

  if (edges !== undefined) {
    await db.from('workflow_edges').delete().eq('workflow_id', id)
    if (edges.length > 0) {
      await db.from('workflow_edges').insert(
        edges.map((e: Record<string, unknown>) => ({ ...e, workflow_id: id, user_id: user.id }))
      )
    }
  }

  // Save version snapshot if requested
  if (create_version && nodes) {
    const newVersion = (existing.version ?? 1) + 1
    await db.from('workflow_versions').insert({
      workflow_id: id,
      version_number: newVersion,
      nodes: nodes ?? [],
      edges: edges ?? [],
      trigger_config: body.trigger_config ?? {},
      changelog: changelog ?? `Version ${newVersion}`,
    })
    await db.from('workflows').update({ version: newVersion }).eq('id', id)
  }

  const { data: updated } = await db.from('workflows').select('*').eq('id', id).single()
  return NextResponse.json({ workflow: updated })
}

// DELETE /api/workflows/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { error } = await db.from('workflows').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
