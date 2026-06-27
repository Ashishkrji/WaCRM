import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/rbac'
import { getUserStats } from '@/lib/admin/user-manager'
import { getSystemHealth } from '@/lib/admin/system-health'
import { supabaseAdmin } from '@/lib/automations/admin-client'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const db = supabaseAdmin()

  const [userStats, health, { data: recentLogs }, { count: activeConvs }, { data: providerConfigs }] = await Promise.all([
    getUserStats(),
    getSystemHealth(),
    db.from('activity_logs').select('action, module, created_at, user_id').order('created_at', { ascending: false }).limit(10),
    db.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('ai_provider_config').select('provider, is_enabled, health_status, current_month_requests, current_month_cost').eq('user_id', auth.user.id),
  ])

  return NextResponse.json({
    users: userStats,
    health,
    active_conversations: activeConvs ?? 0,
    recent_activity: recentLogs ?? [],
    ai_providers: providerConfigs ?? [],
  })
}
