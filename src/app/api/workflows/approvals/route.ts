import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { processApproval, getPendingApprovals } from '@/lib/workflows/approval'

// GET /api/workflows/approvals — list pending approvals
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const approvals = await getPendingApprovals(user.id)
  return NextResponse.json({ approvals })
}
