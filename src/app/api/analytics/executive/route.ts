import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExecutiveDashboardData } from '@/lib/analytics/bi-engine'

// GET /api/analytics/executive — executive dashboard data bundle
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await getExecutiveDashboardData(user.id)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[analytics/executive] failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
