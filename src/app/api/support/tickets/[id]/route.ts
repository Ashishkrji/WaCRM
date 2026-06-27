import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'

// GET /api/support/tickets/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = supabaseAdmin()
  const { data, error } = await db.from('support_tickets').select('*, contacts(name, phone, email)').eq('id', id).eq('user_id', user.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ ticket: data })
}

// PATCH /api/support/tickets/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const db = supabaseAdmin()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  const allowed = ['status', 'priority', 'assigned_to', 'assigned_team', 'resolution_note', 'tags', 'category', 'customer_rating', 'customer_feedback']
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (body.status === 'resolved') updates.resolved_at = new Date().toISOString()
  if (body.status === 'closed') updates.closed_at = new Date().toISOString()

  const { data, error } = await db.from('support_tickets').update(updates).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ticket: data })
}

// DELETE /api/support/tickets/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabaseAdmin().from('support_tickets').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
