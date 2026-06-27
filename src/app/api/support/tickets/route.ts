import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { createTicket, classifyTicketWithAI, checkSLABreaches } from '@/lib/support/sla-engine'

// GET /api/support/tickets
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const slaCheck = searchParams.get('sla_check') === 'true'

  if (slaCheck) {
    const escalated = await checkSLABreaches(user.id)
    return NextResponse.json({ escalated })
  }

  const db = supabaseAdmin()
  let query = db
    .from('support_tickets')
    .select('*, contacts(name, phone)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tickets: data ?? [], count, page })
}

// POST /api/support/tickets
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { title, description, contact_id, priority, channel, category, product, tags, source_message_id } = body
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  // AI classification
  const aiClass = await classifyTicketWithAI(title, description ?? '')

  const ticket = await createTicket({
    userId: user.id,
    contactId: contact_id,
    title,
    description,
    priority: priority ?? aiClass.priority,
    channel,
    category: category ?? aiClass.category,
    product,
    tags,
    sourceMessageId: source_message_id,
  })

  // Store AI suggestions
  await supabaseAdmin()
    .from('support_tickets')
    .update({ ai_suggested_category: aiClass.category, ai_suggested_priority: aiClass.priority as never })
    .eq('id', (ticket as Record<string, string>).id)

  return NextResponse.json({ ticket }, { status: 201 })
}
