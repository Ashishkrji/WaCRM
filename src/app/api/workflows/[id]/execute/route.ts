import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runWorkflow } from '@/lib/workflows/engine'

type Params = { params: Promise<{ id: string }> }

// POST /api/workflows/[id]/execute — manually trigger a workflow
export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { contact_id, trigger_data = {}, vars = {} } = body

  const result = await runWorkflow(id, user.id, {
    contact_id,
    trigger_data,
    vars,
    trigger_event: 'manual_trigger',
  })

  return NextResponse.json({ result }, { status: result.status === 'failed' ? 500 : 200 })
}
