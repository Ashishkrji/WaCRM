import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/rbac'
import { getSystemHealth } from '@/lib/admin/system-health'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const health = await getSystemHealth()
  return NextResponse.json(health)
}
