/**
 * SLA Engine — Computes due dates, detects breaches, escalates tickets.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'

export interface SLAPolicy {
  id: string
  first_response_hours: number
  resolution_hours: number
  escalation_hours: number
  business_hours_only: boolean
  business_start_hour: number
  business_end_hour: number
  business_days: number[]
}

// ─────────────────────────────────────────────
// Compute SLA due dates
// ─────────────────────────────────────────────

export function computeFirstResponseDue(policy: SLAPolicy, createdAt: Date): Date {
  return addHours(createdAt, policy.first_response_hours, policy)
}

export function computeResolutionDue(policy: SLAPolicy, createdAt: Date): Date {
  return addHours(createdAt, policy.resolution_hours, policy)
}

export function computeEscalationTime(policy: SLAPolicy, createdAt: Date): Date {
  return addHours(createdAt, policy.escalation_hours ?? policy.first_response_hours * 2, policy)
}

function addHours(date: Date, hours: number, policy: SLAPolicy): Date {
  if (!policy.business_hours_only) {
    return new Date(date.getTime() + hours * 3_600_000)
  }

  // Business hours calculation
  let remaining = hours * 60  // minutes
  const current = new Date(date)

  while (remaining > 0) {
    if (!policy.business_days.includes(current.getDay())) {
      current.setDate(current.getDate() + 1)
      current.setHours(policy.business_start_hour, 0, 0, 0)
      continue
    }

    const startMin = policy.business_start_hour * 60
    const endMin = policy.business_end_hour * 60
    const nowMin = current.getHours() * 60 + current.getMinutes()

    if (nowMin < startMin) {
      current.setHours(policy.business_start_hour, 0, 0, 0)
      continue
    }

    if (nowMin >= endMin) {
      current.setDate(current.getDate() + 1)
      current.setHours(policy.business_start_hour, 0, 0, 0)
      continue
    }

    const availableToday = endMin - nowMin
    if (remaining <= availableToday) {
      current.setMinutes(current.getMinutes() + remaining)
      remaining = 0
    } else {
      remaining -= availableToday
      current.setDate(current.getDate() + 1)
      current.setHours(policy.business_start_hour, 0, 0, 0)
    }
  }

  return current
}

// ─────────────────────────────────────────────
// Create ticket with SLA
// ─────────────────────────────────────────────

export async function createTicket(params: {
  userId: string
  contactId?: string
  title: string
  description?: string
  priority?: string
  channel?: string
  category?: string
  product?: string
  tags?: string[]
  sourceMessageId?: string
}): Promise<Record<string, unknown>> {
  const db = supabaseAdmin()

  // Get default SLA policy
  const { data: slaPolicy } = await db
    .from('sla_policies')
    .select('*')
    .eq('user_id', params.userId)
    .eq('is_default', true)
    .single()

  const now = new Date()
  const ticketNumber = `TKT-${Date.now()}`

  let firstResponseDue: Date | null = null
  let resolutionDue: Date | null = null

  if (slaPolicy) {
    firstResponseDue = computeFirstResponseDue(slaPolicy, now)
    resolutionDue = computeResolutionDue(slaPolicy, now)
  }

  const { data: ticket, error } = await db
    .from('support_tickets')
    .insert({
      user_id: params.userId,
      contact_id: params.contactId,
      ticket_number: ticketNumber,
      title: params.title,
      description: params.description,
      priority: params.priority ?? 'medium',
      channel: params.channel ?? 'whatsapp',
      category: params.category,
      product: params.product,
      tags: params.tags ?? [],
      sla_policy_id: slaPolicy?.id ?? null,
      first_response_due_at: firstResponseDue?.toISOString(),
      resolution_due_at: resolutionDue?.toISOString(),
      source_message_id: params.sourceMessageId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return ticket
}

// ─────────────────────────────────────────────
// Check & update SLA breaches
// ─────────────────────────────────────────────

export async function checkSLABreaches(userId: string): Promise<number> {
  const db = supabaseAdmin()
  const now = new Date().toISOString()

  // First response breaches
  await db
    .from('support_tickets')
    .update({ sla_first_response_breached: true })
    .eq('user_id', userId)
    .is('first_responded_at', null)
    .lt('first_response_due_at', now)
    .eq('sla_first_response_breached', false)
    .in('status', ['open', 'in_progress'])

  // Resolution breaches
  const { data: resolved } = await db
    .from('support_tickets')
    .update({ sla_breached: true, status: 'escalated' })
    .eq('user_id', userId)
    .is('resolved_at', null)
    .lt('resolution_due_at', now)
    .eq('sla_breached', false)
    .in('status', ['open', 'in_progress', 'waiting_customer'])
    .select('id, contact_id, ticket_number, title')

  const escalated = (resolved ?? []).length

  // Log escalations
  for (const t of (resolved ?? []) as Array<Record<string, string>>) {
    await db.from('ticket_escalations').insert({
      ticket_id: t.id,
      user_id: userId,
      reason: 'SLA resolution time exceeded',
      auto_escalated: true,
    })
  }

  return escalated
}

// ─────────────────────────────────────────────
// AI auto-classification
// ─────────────────────────────────────────────

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''
const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'

export async function classifyTicketWithAI(title: string, description: string): Promise<{
  category: string
  priority: string
  sentiment: string
}> {
  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{
          role: 'user',
          content: `Classify this support ticket. Respond with JSON only.
Title: ${title}
Description: ${description}

Respond: {"category": "billing|technical|general|feature_request|complaint", "priority": "low|medium|high|urgent", "sentiment": "positive|neutral|negative|angry"}`
        }],
        temperature: 0.1,
        max_tokens: 100,
      }),
    })
    if (!res.ok) return { category: 'general', priority: 'medium', sentiment: 'neutral' }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { category: 'general', priority: 'medium', sentiment: 'neutral' }
  } catch {
    return { category: 'general', priority: 'medium', sentiment: 'neutral' }
  }
}
