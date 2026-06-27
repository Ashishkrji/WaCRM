import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/rbac'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { auditLog } from '@/lib/admin/audit-logger'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const db = supabaseAdmin()
  const { data } = await db.from('organization_settings').select('*').eq('user_id', auth.user.id).single()
  return NextResponse.json({ settings: data })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db.from('organization_settings').upsert({
    user_id: auth.user.id,
    ...body,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await auditLog({ userId: auth.user.id, action: 'org.settings.updated', module: 'settings', newValue: body })
  return NextResponse.json({ settings: data })
}
