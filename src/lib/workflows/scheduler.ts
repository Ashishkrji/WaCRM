/**
 * Scheduler Engine
 *
 * Manages one-time, recurring, and cron-based workflow scheduling.
 * Supports business hours awareness and holiday calendars.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import type { WorkflowSchedule, ScheduleType } from '@/types'

export interface CreateScheduleInput {
  workflowId: string
  userId: string
  scheduleType: ScheduleType
  scheduleValue: string
  timezone?: string
  businessHoursOnly?: boolean
  holidayDates?: string[]
  maxFires?: number
}

/**
 * Register a new schedule for a workflow.
 */
export async function createSchedule(input: CreateScheduleInput): Promise<WorkflowSchedule> {
  const db = supabaseAdmin()

  const nextFireAt = computeNextFireAt(input.scheduleType, input.scheduleValue, input.timezone ?? 'Asia/Kolkata')

  const { data, error } = await db
    .from('workflow_schedules')
    .insert({
      workflow_id: input.workflowId,
      user_id: input.userId,
      schedule_type: input.scheduleType,
      schedule_value: input.scheduleValue,
      timezone: input.timezone ?? 'Asia/Kolkata',
      business_hours_only: input.businessHoursOnly ?? false,
      holiday_dates: input.holidayDates ?? [],
      is_active: true,
      next_fire_at: nextFireAt,
      fire_count: 0,
      max_fires: input.maxFires ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to create schedule: ${error?.message}`)
  return data as WorkflowSchedule
}

/**
 * Process all due schedules (called by the cron API endpoint every minute).
 * Returns the number of workflows triggered.
 */
export async function processDueSchedules(): Promise<number> {
  const db = supabaseAdmin()
  const now = new Date().toISOString()

  const { data: schedules } = await db
    .from('workflow_schedules')
    .select('*')
    .eq('is_active', true)
    .lte('next_fire_at', now)

  if (!schedules || schedules.length === 0) return 0

  let fired = 0
  for (const schedule of schedules as WorkflowSchedule[]) {
    try {
      // Check business hours
      if (schedule.business_hours_only && !isBusinessHours(schedule.timezone)) {
        // Reschedule to next business hour
        const next = nextBusinessHour(schedule.timezone)
        await db.from('workflow_schedules').update({ next_fire_at: next.toISOString() }).eq('id', schedule.id)
        continue
      }

      // Check holiday
      const today = new Date().toISOString().split('T')[0]
      if (schedule.holiday_dates.includes(today)) {
        // Skip today, schedule for tomorrow same time
        const next = new Date(Date.now() + 86_400_000)
        await db.from('workflow_schedules').update({ next_fire_at: next.toISOString() }).eq('id', schedule.id)
        continue
      }

      // Trigger the workflow
      const { runWorkflow } = await import('./engine')
      await runWorkflow(schedule.workflow_id, schedule.user_id, {
        trigger_data: { scheduled: true, schedule_id: schedule.id },
        vars: { schedule_type: schedule.schedule_type },
      } as Record<string, unknown>)

      // Update schedule
      const newFireCount = schedule.fire_count + 1
      const maxReached = schedule.max_fires != null && newFireCount >= schedule.max_fires
      const nextFire = maxReached
        ? null
        : computeNextFireAt(schedule.schedule_type, schedule.schedule_value, schedule.timezone)

      await db
        .from('workflow_schedules')
        .update({
          last_fired_at: now,
          fire_count: newFireCount,
          next_fire_at: nextFire,
          is_active: !maxReached,
        })
        .eq('id', schedule.id)

      fired++
    } catch (err) {
      console.error('[scheduler] failed to fire schedule:', schedule.id, err)
    }
  }

  return fired
}

/**
 * Process pending workflow delays (called by the cron endpoint).
 */
export async function processPendingDelays(): Promise<number> {
  const db = supabaseAdmin()
  const now = new Date().toISOString()

  // Check if the table exists first (it's created inline by the engine)
  const { data: pending } = await db
    .from('workflow_pending_delays')
    .select('*')
    .eq('status', 'pending')
    .lte('resume_at', now)
    .limit(50)

  if (!pending || pending.length === 0) return 0

  let resumed = 0
  for (const item of pending) {
    try {
      // Mark as processing
      await db.from('workflow_pending_delays').update({ status: 'processing' }).eq('id', item.id)

      // Resume workflow from the delayed node
      const { runWorkflow } = await import('./engine')
      await runWorkflow(item.workflow_id, item.user_id, item.context ?? {})

      await db.from('workflow_pending_delays').update({ status: 'done' }).eq('id', item.id)
      resumed++
    } catch (err) {
      console.error('[scheduler] resume failed:', item.id, err)
      await db.from('workflow_pending_delays').update({ status: 'failed' }).eq('id', item.id)
    }
  }

  return resumed
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function computeNextFireAt(type: ScheduleType, value: string, timezone: string): string | null {
  const now = new Date()

  switch (type) {
    case 'once':
      // value is an ISO datetime string
      return new Date(value) > now ? value : null

    case 'cron':
      // Parse simple cron expressions (subset)
      return parseCronNextFire(value, now)?.toISOString() ?? null

    case 'recurring': {
      // value is like "1h", "30m", "1d", "1w"
      const ms = parseRecurringInterval(value)
      return ms ? new Date(Date.now() + ms).toISOString() : null
    }

    default:
      return null
  }
}

function parseRecurringInterval(value: string): number | null {
  const match = value.match(/^(\d+)([mhdw])$/)
  if (!match) return null
  const [, n, unit] = match
  const num = parseInt(n)
  switch (unit) {
    case 'm': return num * 60_000
    case 'h': return num * 3_600_000
    case 'd': return num * 86_400_000
    case 'w': return num * 7 * 86_400_000
    default: return null
  }
}

function parseCronNextFire(cron: string, from: Date): Date | null {
  // Simple cron parser for common patterns
  // Full cron parsing would use a library like croner
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return null

  // For now: always fire next minute (production would use proper cron parsing)
  // In production, use: import { Cron } from 'croner'
  const next = new Date(from)
  next.setMinutes(next.getMinutes() + 1, 0, 0)
  return next
}

function isBusinessHours(timezone: string): boolean {
  const now = new Date()
  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const hour = local.getHours()
  const day = local.getDay() // 0=Sun, 6=Sat
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18
}

function nextBusinessHour(timezone: string): Date {
  const now = new Date()
  const next = new Date(now)
  next.setHours(9, 0, 0, 0)
  // Move to next day if after 18:00
  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  if (local.getHours() >= 18) {
    next.setDate(next.getDate() + 1)
  }
  // Skip weekends
  const day = next.getDay()
  if (day === 6) next.setDate(next.getDate() + 2)
  if (day === 0) next.setDate(next.getDate() + 1)
  return next
}
