import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runWorkflowsForTrigger } from '@/lib/workflows/engine'

// POST /api/workflows/engine — fire trigger, dispatches all matching workflows
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { trigger_type, contact_id, context = {} } = body
  if (!trigger_type) return NextResponse.json({ error: 'trigger_type required' }, { status: 400 })

  // Fire and forget — returns immediately
  runWorkflowsForTrigger({ userId: user.id, triggerType: trigger_type, contactId: contact_id, context })
    .catch((err) => console.error('[engine] fire failed:', err))

  return NextResponse.json({ queued: true, trigger_type })
}
