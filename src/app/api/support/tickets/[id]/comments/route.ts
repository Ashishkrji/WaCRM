import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { addTicketComment } from '@/lib/support/ticket-manager'

// GET /api/support/tickets/[id]/comments
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabaseAdmin()
    .from('ticket_comments')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

// POST /api/support/tickets/[id]/comments
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body?.content) return NextResponse.json({ error: 'content required' }, { status: 400 })

  await addTicketComment({
    ticketId: id,
    userId: user.id,
    content: body.content,
    commentType: body.comment_type ?? 'public',
    isAiGenerated: body.is_ai_generated ?? false,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
