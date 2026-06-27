import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processApproval } from '@/lib/workflows/approval'

type Params = { params: Promise<{ id: string }> }

// POST /api/workflows/approvals/[id] — approve or reject
export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { action, comment } = body
  if (!action || !['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'action must be "approved" or "rejected"' }, { status: 400 })
  }

  try {
    const result = await processApproval({
      approvalId: id,
      approverId: user.id,
      action,
      comment,
    })

    return NextResponse.json({
      approval: result.approval,
      should_resume: result.shouldResume,
      resume_branch: result.resumeBranch,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
