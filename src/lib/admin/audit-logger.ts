/**
 * Admin Audit Logger
 * Writes comprehensive audit events to activity_logs.
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'

export type AuditAction =
  | 'user.login' | 'user.logout' | 'user.created' | 'user.updated' | 'user.deleted' | 'user.suspended' | 'user.activated'
  | 'role.assigned' | 'role.revoked' | 'permission.changed'
  | 'org.settings.updated' | 'ai.config.updated' | 'security.policy.updated'
  | 'api_key.created' | 'api_key.revoked'
  | 'prompt.created' | 'prompt.updated' | 'prompt.approved'
  | 'backup.triggered' | 'backup.completed' | 'backup.failed'
  | 'lead.updated' | 'contact.updated' | 'deal.updated'
  | 'campaign.launched' | 'campaign.paused'
  | 'workflow.executed' | 'workflow.failed'
  | 'payment.received' | 'invoice.created'
  | 'system.error' | 'api.call' | 'webhook.received'
  | 'knowledge.indexed' | 'knowledge.deleted'

interface AuditParams {
  userId: string
  action: AuditAction
  module: string
  resource?: string
  resourceId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  severity?: 'info' | 'warning' | 'critical' | 'error'
}

export async function auditLog(params: AuditParams): Promise<void> {
  const db = supabaseAdmin()
  try {
    await db.from('activity_logs').insert({
      user_id: params.userId,
      action: params.action,
      module: params.module,
      resource: params.resource,
      resource_id: params.resourceId,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      session_id: params.sessionId,
      severity: params.severity ?? 'info',
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    // Never let audit failure crash the app
    console.error('[AuditLogger] Failed:', err)
  }
}

// ─────────────────────────────────────────────
// Get audit logs (paginated)
// ─────────────────────────────────────────────

export async function getAuditLogs(params: {
  userId?: string
  module?: string
  action?: string
  severity?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}) {
  const db = supabaseAdmin()
  const limit = params.limit ?? 50
  const page = params.page ?? 1

  let query = db
    .from('activity_logs')
    .select('*, profiles!activity_logs_user_id_fkey(full_name, email, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (params.userId) query = query.eq('user_id', params.userId)
  if (params.module) query = query.eq('module', params.module)
  if (params.action) query = query.ilike('action', `%${params.action}%`)
  if (params.severity) query = query.eq('severity', params.severity)
  if (params.from) query = query.gte('created_at', params.from)
  if (params.to) query = query.lte('created_at', params.to)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)
  return { logs: data ?? [], count: count ?? 0 }
}
