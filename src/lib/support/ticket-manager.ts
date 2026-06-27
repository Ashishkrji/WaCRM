/**
 * Ticket Manager — create, assign, escalate, resolve support tickets.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'

export async function assignTicket(ticketId: string, agentId: string, userId: string): Promise<void> {
  const db = supabaseAdmin()
  await db.from('support_tickets').update({ assigned_to: agentId, status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', ticketId).eq('user_id', userId)
  await addTicketComment({ ticketId, userId, content: `Ticket assigned to agent.`, commentType: 'system' })
}

export async function resolveTicket(ticketId: string, userId: string, note: string): Promise<void> {
  const db = supabaseAdmin()
  await db.from('support_tickets').update({
    status: 'resolved', resolution_note: note, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', ticketId).eq('user_id', userId)
  await addTicketComment({ ticketId, userId, content: `Ticket resolved: ${note}`, commentType: 'internal' })
}

export async function escalateTicket(ticketId: string, userId: string, reason: string, escalateTo?: string): Promise<void> {
  const db = supabaseAdmin()
  const { data: ticket } = await db.from('support_tickets').select('priority').eq('id', ticketId).single()
  const newPriority = ticket?.priority === 'low' ? 'medium' : ticket?.priority === 'medium' ? 'high' : 'urgent'

  await db.from('support_tickets').update({ status: 'escalated', priority: newPriority as never, updated_at: new Date().toISOString() }).eq('id', ticketId)
  await db.from('ticket_escalations').insert({ ticket_id: ticketId, user_id: userId, escalated_to: escalateTo, reason, previous_priority: ticket?.priority, new_priority: newPriority, auto_escalated: false })
  await addTicketComment({ ticketId, userId, content: `Escalated: ${reason}`, commentType: 'system' })
}

export async function reopenTicket(ticketId: string, userId: string): Promise<void> {
  const db = supabaseAdmin()
  await db.from('support_tickets').update({ status: 'reopened', resolved_at: null, updated_at: new Date().toISOString() }).eq('id', ticketId).eq('user_id', userId)
  await addTicketComment({ ticketId, userId, content: 'Ticket reopened by agent.', commentType: 'system' })
}

export async function addTicketComment(params: {
  ticketId: string
  userId: string
  content: string
  commentType?: 'public' | 'internal' | 'system' | 'ai'
  isAiGenerated?: boolean
}): Promise<void> {
  const db = supabaseAdmin()
  await db.from('ticket_comments').insert({
    ticket_id: params.ticketId,
    user_id: params.userId,
    author_id: params.userId,
    content: params.content,
    comment_type: params.commentType ?? 'internal',
    is_ai_generated: params.isAiGenerated ?? false,
  })
  // Mark first response time
  const { data: ticket } = await db.from('support_tickets').select('first_responded_at').eq('id', params.ticketId).single()
  if (!ticket?.first_responded_at && params.commentType === 'public') {
    await db.from('support_tickets').update({ first_responded_at: new Date().toISOString() }).eq('id', params.ticketId)
  }
}

export async function getTicketStats(userId: string): Promise<Record<string, number>> {
  const db = supabaseAdmin()
  const { data } = await db.from('support_tickets').select('status, priority, sla_breached').eq('user_id', userId)
  const tickets = data ?? []
  return {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    escalated: tickets.filter(t => t.status === 'escalated').length,
    sla_breached: tickets.filter(t => t.sla_breached).length,
    urgent: tickets.filter(t => t.priority === 'urgent' || t.priority === 'critical').length,
  }
}
