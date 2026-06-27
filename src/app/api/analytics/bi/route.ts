import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { computeDailySnapshot } from '@/lib/analytics/bi-engine'

// GET /api/analytics/bi?date=2026-06-26 — fetch or recompute snapshot
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const recompute = searchParams.get('recompute') === 'true'

  if (recompute) {
    const snapshot = await computeDailySnapshot(user.id)
    return NextResponse.json({ snapshot })
  }

  const db = supabaseAdmin()
  const { data: snapshot, error } = await db
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .eq('snapshot_date', date)
    .single()

  if (error || !snapshot) {
    // Compute on demand
    const fresh = await computeDailySnapshot(user.id)
    return NextResponse.json({ snapshot: fresh })
  }

  return NextResponse.json({ snapshot })
}
