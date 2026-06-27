/**
 * System Health Monitor
 * Aggregates health status of all CRM infrastructure components.
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'

export interface ComponentHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  latency_ms: number | null
  message?: string
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'down'
  timestamp: string
  components: ComponentHealth[]
  metrics: {
    active_conversations: number
    active_users: number
    pending_jobs: number
    error_rate_1h: number
    ai_requests_today: number
  }
}

// ─────────────────────────────────────────────
// Check database health
// ─────────────────────────────────────────────

async function checkDatabase(): Promise<ComponentHealth> {
  const db = supabaseAdmin()
  const start = Date.now()
  try {
    await db.from('profiles').select('id').limit(1)
    return { name: 'Supabase DB', status: 'healthy', latency_ms: Date.now() - start }
  } catch (e) {
    return { name: 'Supabase DB', status: 'down', latency_ms: null, message: String(e) }
  }
}

// ─────────────────────────────────────────────
// Check NVIDIA AI health
// ─────────────────────────────────────────────

async function checkNvidiaAI(): Promise<ComponentHealth> {
  const start = Date.now()
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) return { name: 'NVIDIA AI', status: 'healthy', latency_ms: Date.now() - start }
    return { name: 'NVIDIA AI', status: 'degraded', latency_ms: Date.now() - start, message: `HTTP ${res.status}` }
  } catch (e) {
    return { name: 'NVIDIA AI', status: 'down', latency_ms: null, message: String(e) }
  }
}

// ─────────────────────────────────────────────
// Check WhatsApp API health
// ─────────────────────────────────────────────

async function checkWhatsAppAPI(): Promise<ComponentHealth> {
  const start = Date.now()
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneId || !token) return { name: 'WhatsApp API', status: 'unknown', latency_ms: null, message: 'Not configured' }
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
      ? { name: 'WhatsApp API', status: 'healthy', latency_ms: Date.now() - start }
      : { name: 'WhatsApp API', status: 'degraded', latency_ms: Date.now() - start, message: `HTTP ${res.status}` }
  } catch (e) {
    return { name: 'WhatsApp API', status: 'down', latency_ms: null, message: String(e) }
  }
}

// ─────────────────────────────────────────────
// Collect system metrics
// ─────────────────────────────────────────────

async function getMetrics() {
  const db = supabaseAdmin()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [{ count: convCount }, { count: userCount }, { count: aiCount }] = await Promise.all([
    db.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('ai_usage_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).catch(() => ({ count: 0 })),
  ])

  return {
    active_conversations: convCount ?? 0,
    active_users: userCount ?? 0,
    pending_jobs: 0,
    error_rate_1h: 0,
    ai_requests_today: aiCount ?? 0,
  }
}

// ─────────────────────────────────────────────
// Full health check
// ─────────────────────────────────────────────

export async function getSystemHealth(): Promise<SystemHealthReport> {
  const [dbHealth, aiHealth, waHealth, metrics] = await Promise.all([
    checkDatabase(),
    checkNvidiaAI(),
    checkWhatsAppAPI(),
    getMetrics(),
  ])

  const components = [dbHealth, aiHealth, waHealth]
  const hasDown = components.some(c => c.status === 'down')
  const hasDegraded = components.some(c => c.status === 'degraded')
  const overall = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy'

  const report: SystemHealthReport = { overall, timestamp: new Date().toISOString(), components, metrics }

  // Save snapshot
  const db = supabaseAdmin()
  await db.from('system_health_snapshots').insert({
    db_status: dbHealth.status,
    db_latency_ms: dbHealth.latency_ms,
    ai_status: aiHealth.status,
    ai_latency_ms: aiHealth.latency_ms,
    whatsapp_status: waHealth.status,
  }).catch(() => {})

  return report
}
