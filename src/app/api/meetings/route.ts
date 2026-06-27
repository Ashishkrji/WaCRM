import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { createMeeting } from '@/lib/meetings/summary-generator'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status') ?? undefined
  const from = url.searchParams.get('from') ?? undefined
  const to = url.searchParams.get('to') ?? undefined
  const contactId = url.searchParams.get('contact_id') ?? undefined

  const db = supabaseAdmin()
  let query = db.from('meetings').select('*, contacts(name, phone, email), meeting_attendees(attendee_name, rsvp), meeting_action_items(id, status)').eq('user_id', user.id).order('scheduled_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (from) query = query.gte('scheduled_at', from)
  if (to) query = query.lte('scheduled_at', to)
  if (contactId) query = query.eq('contact_id', contactId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meetings: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.scheduled_at) return NextResponse.json({ error: 'title and scheduled_at required' }, { status: 400 })

  const meeting = await createMeeting({
    userId: user.id,
    title: body.title,
    meetingType: body.meeting_type ?? 'discovery',
    contactId: body.contact_id,
    scheduledAt: body.scheduled_at,
    durationMinutes: body.duration_minutes,
    location: body.location,
    meetLink: body.meet_link,
    description: body.description,
  })

  return NextResponse.json({ meeting }, { status: 201 })
}
