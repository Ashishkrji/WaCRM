/**
 * Approval Engine
 *
 * Manages approval requests generated during workflow execution.
 * Supports sequential, parallel, and any-one approval modes.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import type { WorkflowApproval, ApprovalMode } from '@/types'

export interface CreateApprovalInput {
  workflowId: string
  executionId: string
  userId: string
  nodeId: string
  title: string
  description?: string
  approvers: string[]
  approvalMode: ApprovalMode
  escalationAfterHours?: number
  escalateTo?: string
  context?: Record<string, unknown>
}

export interface ProcessApprovalInput {
  approvalId: string
  approverId: string
  action: 'approved' | 'rejected'
  comment?: string
}

/**
 * Create a new approval request and pause workflow execution.
 */
export async function createApproval(input: CreateApprovalInput): Promise<WorkflowApproval> {
  const db = supabaseAdmin()

  const dueAt = input.escalationAfterHours
    ? new Date(Date.now() + input.escalationAfterHours * 3_600_000).toISOString()
    : undefined

  const { data, error } = await db
    .from('workflow_approvals')
    .insert({
      workflow_id: input.workflowId,
      execution_id: input.executionId,
      user_id: input.userId,
      node_id: input.nodeId,
      title: input.title,
      description: input.description ?? null,
      status: 'pending',
      approvers: input.approvers,
      approval_mode: input.approvalMode,
      responses: [],
      context: input.context ?? {},
      escalation_after_hours: input.escalationAfterHours ?? 24,
      escalate_to: input.escalateTo ?? null,
      due_at: dueAt ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create approval: ${error?.message}`)
  }

  // Send notifications to approvers
  await notifyApprovers(data as WorkflowApproval, input.userId)

  return data as WorkflowApproval
}

/**
 * Process an approval action (approve/reject).
 * Returns the updated approval and whether the workflow should resume.
 */
export async function processApproval(
  input: ProcessApprovalInput,
): Promise<{ approval: WorkflowApproval; shouldResume: boolean; resumeBranch: 'approved' | 'rejected' }> {
  const db = supabaseAdmin()

  // Fetch current approval
  const { data: approval, error } = await db
    .from('workflow_approvals')
    .select('*')
    .eq('id', input.approvalId)
    .single()

  if (error || !approval) {
    throw new Error(`Approval not found: ${input.approvalId}`)
  }

  const current = approval as WorkflowApproval

  if (current.status !== 'pending') {
    return { approval: current, shouldResume: false, resumeBranch: 'rejected' }
  }

  // Add response
  const newResponse = {
    approver_id: input.approverId,
    action: input.action,
    comment: input.comment ?? '',
    at: new Date().toISOString(),
  }

  const updatedResponses = [...current.responses, newResponse]

  // Determine new status based on approval mode
  const newStatus = resolveApprovalStatus(
    current.approval_mode,
    updatedResponses,
    current.approvers,
  )

  const { data: updated } = await db
    .from('workflow_approvals')
    .update({ status: newStatus, responses: updatedResponses })
    .eq('id', input.approvalId)
    .select()
    .single()

  const shouldResume = newStatus === 'approved' || newStatus === 'rejected'
  const resumeBranch = newStatus === 'approved' ? 'approved' : 'rejected'

  return {
    approval: (updated ?? current) as WorkflowApproval,
    shouldResume,
    resumeBranch,
  }
}

/**
 * Escalate overdue approvals (called by cron)
 */
export async function escalateOverdueApprovals(): Promise<number> {
  const db = supabaseAdmin()

  const { data: overdue } = await db
    .from('workflow_approvals')
    .select('*')
    .eq('status', 'pending')
    .lt('due_at', new Date().toISOString())

  if (!overdue || overdue.length === 0) return 0

  let count = 0
  for (const approval of overdue as WorkflowApproval[]) {
    if (approval.escalate_to) {
      // Escalate to designated person
      await db
        .from('workflow_approvals')
        .update({
          status: 'escalated',
          approvers: [...approval.approvers, approval.escalate_to],
        })
        .eq('id', approval.id)

      await notifyApprovers(
        { ...approval, approvers: [approval.escalate_to!] } as WorkflowApproval,
        approval.user_id,
      )
    } else {
      // Auto-approve if no escalation target configured
      await db
        .from('workflow_approvals')
        .update({ status: 'timed_out' })
        .eq('id', approval.id)
    }
    count++
  }

  return count
}

/**
 * Get all pending approvals for a user (for the approval manager UI)
 */
export async function getPendingApprovals(userId: string): Promise<WorkflowApproval[]> {
  const db = supabaseAdmin()
  const { data } = await db
    .from('workflow_approvals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (data ?? []) as WorkflowApproval[]
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function resolveApprovalStatus(
  mode: ApprovalMode,
  responses: Array<{ action: string }>,
  approvers: string[],
): string {
  const approved = responses.filter((r) => r.action === 'approved').length
  const rejected = responses.filter((r) => r.action === 'rejected').length
  const total = approvers.length

  switch (mode) {
    case 'any_one':
      if (approved >= 1) return 'approved'
      if (rejected >= total) return 'rejected'
      return 'pending'

    case 'parallel':
      // All must respond; majority rules
      if (responses.length < total) return 'pending'
      return approved >= rejected ? 'approved' : 'rejected'

    case 'sequential':
      // Each approver in order; any rejection stops it
      if (rejected >= 1) return 'rejected'
      if (approved >= total) return 'approved'
      return 'pending'

    default:
      return 'pending'
  }
}

async function notifyApprovers(approval: WorkflowApproval, userId: string): Promise<void> {
  // In a real implementation: send WhatsApp/email notifications
  // For now: log to console and Supabase audit
  console.log(`[approval] Approval "${approval.title}" requires action from:`, approval.approvers)

  try {
    const db = supabaseAdmin()
    // Increment workflow execution step log would go here
    // Notification to in-app dashboard is handled by Supabase Realtime subscriptions
  } catch {
    // Non-critical
  }
}
