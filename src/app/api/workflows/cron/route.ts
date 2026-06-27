import { NextResponse } from 'next/server'
import { processDueSchedules, processPendingDelays } from '@/lib/workflows/scheduler'
import { escalateOverdueApprovals } from '@/lib/workflows/approval'
import { computeDailySnapshot, generateAndStoreInsights, detectAnomaliesAndAlert } from '@/lib/analytics/bi-engine'
import { supabaseAdmin } from '@/lib/automations/admin-client'

// This endpoint is called by an external cron service (e.g. Vercel Cron, GitHub Actions)
// at minimum every minute. Also handles daily BI tasks at midnight.

export async function GET(request: Request) {
  // Validate cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  try {
    // 1. Process due scheduled workflows
    results.scheduled_workflows = await processDueSchedules()
  } catch (err) {
    console.error('[cron] processDueSchedules failed:', err)
    results.scheduled_workflows = { error: String(err) }
  }

  try {
    // 2. Resume parked workflow delays
    results.resumed_delays = await processPendingDelays()
  } catch (err) {
    console.error('[cron] processPendingDelays failed:', err)
    results.resumed_delays = { error: String(err) }
  }

  try {
    // 3. Escalate overdue approvals
    results.escalated_approvals = await escalateOverdueApprovals()
  } catch (err) {
    console.error('[cron] escalateOverdueApprovals failed:', err)
    results.escalated_approvals = { error: String(err) }
  }

  // 4. Run daily BI tasks (once per day, around midnight)
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 1) {
    try {
      // Compute snapshots for all active users
      const db = supabaseAdmin()
      const { data: users } = await db.from('profiles').select('user_id').limit(500)
      let snapshots = 0
      for (const u of users ?? []) {
        await computeDailySnapshot(u.user_id)
        await detectAnomaliesAndAlert(u.user_id)
        snapshots++
      }
      results.daily_snapshots = snapshots

      // Generate AI insights (less frequent — once per day is fine)
      for (const u of (users ?? []).slice(0, 50)) {
        await generateAndStoreInsights(u.user_id)
      }
      results.ai_insights = 'generated'
    } catch (err) {
      console.error('[cron] daily BI tasks failed:', err)
      results.daily_bi = { error: String(err) }
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...results,
  })
}
