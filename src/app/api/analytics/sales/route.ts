import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadSalesAnalytics } from '@/lib/analytics/queries'
import { forecastMetric } from '@/lib/analytics/bi-engine'
import { createClient as createServerClient } from '@/lib/supabase/server'

// GET /api/analytics/sales?range=30
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const range = parseInt(searchParams.get('range') ?? '30')

  try {
    const [salesData, revenueForecast] = await Promise.all([
      loadSalesAnalytics(supabase, range),
      forecastMetric(user.id, 'revenue', 30),
    ])

    return NextResponse.json({ sales: salesData, revenue_forecast: revenueForecast })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
