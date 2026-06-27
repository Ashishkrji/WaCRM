import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { createSchedule } from '@/lib/workflows/scheduler'

// GET /api/workflows/schedules
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('workflow_schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedules: data ?? [] })
}

// POST /api/workflows/schedules
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { workflow_id, schedule_type, schedule_value, timezone, business_hours_only, max_fires } = body
  if (!workflow_id || !schedule_type || !schedule_value) {
    return NextResponse.json({ error: 'workflow_id, schedule_type, schedule_value required' }, { status: 400 })
  }

  try {
    const schedule = await createSchedule({ workflowId: workflow_id, userId: user.id, scheduleType: schedule_type, scheduleValue: schedule_value, timezone, businessHoursOnly: business_hours_only, maxFires: max_fires })
    return NextResponse.json({ schedule }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
