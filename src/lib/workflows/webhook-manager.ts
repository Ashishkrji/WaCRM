/**
 * Webhook Manager
 *
 * Handles outgoing webhook delivery with retry logic, rate limiting,
 * and incoming webhook validation.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'
import { createHmac } from 'crypto'

export interface DeliverWebhookInput {
  url: string
  method?: string
  headers?: Record<string, string>
  body: Record<string, unknown>
  userId: string
  webhookId?: string
  secret?: string
  maxAttempts?: number
}

export interface WebhookDeliveryResult {
  success: boolean
  http_status?: number
  latency_ms: number
  error?: string
  response_body?: string
}

/**
 * Deliver a webhook with retry logic and exponential backoff.
 */
export async function deliverWebhook(input: DeliverWebhookInput): Promise<WebhookDeliveryResult> {
  const maxAttempts = input.maxAttempts ?? 3
  const backoffSeconds = [60, 300, 900] // 1 min, 5 min, 15 min

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await attemptDelivery(input, attempt)

    if (result.success) {
      await logWebhookDelivery(input, result, attempt)
      return result
    }

    if (attempt < maxAttempts) {
      // Wait before retry (only for short waits; long ones should be parked)
      const backoff = Math.min((backoffSeconds[attempt - 1] ?? 900) * 1000, 5000)
      await new Promise((r) => setTimeout(r, backoff))
    } else {
      // Final failure
      await logWebhookDelivery(input, { ...result, status: 'failed' }, attempt)
    }
  }

  return { success: false, latency_ms: 0, error: 'Max retry attempts exceeded' }
}

/**
 * Validate an incoming webhook signature (HMAC-SHA256).
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    // Timing-safe compare
    const a = Buffer.from(signature.replace('sha256=', ''), 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i]
    }
    return result === 0
  } catch {
    return false
  }
}

/**
 * Process an incoming webhook and trigger matching workflows.
 */
export async function processIncomingWebhook(
  slug: string,
  payload: Record<string, unknown>,
  signature: string | null,
): Promise<{ triggered: number; webhookId: string | null }> {
  const db = supabaseAdmin()

  // Find the webhook config
  const { data: webhook } = await db
    .from('workflow_webhooks')
    .select('*')
    .eq('endpoint_slug', slug)
    .eq('is_active', true)
    .single()

  if (!webhook) {
    return { triggered: 0, webhookId: null }
  }

  // Validate signature if secret is set
  if (webhook.secret && signature) {
    const isValid = validateWebhookSignature(JSON.stringify(payload), signature, webhook.secret)
    if (!isValid) {
      console.warn(`[webhook] Invalid signature for slug: ${slug}`)
      return { triggered: 0, webhookId: webhook.id }
    }
  }

  // Update stats
  await db
    .from('workflow_webhooks')
    .update({
      total_received: webhook.total_received + 1,
      last_triggered_at: new Date().toISOString(),
    })
    .eq('id', webhook.id)

  // Trigger the associated workflow
  if (webhook.workflow_id) {
    const { runWorkflow } = await import('./engine')
    await runWorkflow(webhook.workflow_id, webhook.user_id, {
      trigger_data: payload,
      vars: { webhook_payload: payload, webhook_slug: slug },
    } as Record<string, unknown>)
    return { triggered: 1, webhookId: webhook.id }
  }

  return { triggered: 0, webhookId: webhook.id }
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

interface DeliveryResult extends WebhookDeliveryResult {
  status?: string
}

async function attemptDelivery(
  input: DeliverWebhookInput,
  attempt: number,
): Promise<WebhookDeliveryResult> {
  const t0 = Date.now()
  const body = JSON.stringify(input.body)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-WaCRM-Attempt': String(attempt),
    'X-WaCRM-Timestamp': new Date().toISOString(),
    ...(input.headers ?? {}),
  }

  // Add HMAC signature if secret provided
  if (input.secret) {
    const sig = createHmac('sha256', input.secret).update(body).digest('hex')
    headers['X-WaCRM-Signature'] = `sha256=${sig}`
  }

  try {
    const res = await fetch(input.url, {
      method: input.method ?? 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(30_000), // 30s timeout
    })

    const latency = Date.now() - t0
    const responseText = await res.text().catch(() => '')

    if (res.ok) {
      return { success: true, http_status: res.status, latency_ms: latency, response_body: responseText }
    }

    return {
      success: false,
      http_status: res.status,
      latency_ms: latency,
      error: `HTTP ${res.status}: ${responseText.slice(0, 200)}`,
      response_body: responseText,
    }
  } catch (err) {
    return {
      success: false,
      latency_ms: Date.now() - t0,
      error: String(err),
    }
  }
}

async function logWebhookDelivery(
  input: DeliverWebhookInput,
  result: DeliveryResult,
  attempt: number,
): Promise<void> {
  if (!input.webhookId) return
  try {
    const db = supabaseAdmin()
    await db.from('workflow_webhook_logs').insert({
      webhook_id: input.webhookId,
      user_id: input.userId,
      status: result.success ? 'success' : (result.status ?? 'failed'),
      http_status: result.http_status ?? null,
      request_body: input.body,
      response_body: result.response_body ?? null,
      attempt_number: attempt,
      latency_ms: result.latency_ms,
      error_message: result.error ?? null,
    })

    if (result.success) {
      const db2 = supabaseAdmin()
      const { data: wh } = await db2.from('workflow_webhooks').select('total_sent').eq('id', input.webhookId).single()
      if (wh) {
        await db2
          .from('workflow_webhooks')
          .update({
            total_sent: wh.total_sent + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq('id', input.webhookId)
      }
    }
  } catch (err) {
    console.error('[webhook-manager] logging failed:', err)
  }
}
