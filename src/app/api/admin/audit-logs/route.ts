import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/rbac'
import { getAuditLogs } from '@/lib/admin/audit-logger'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(request.url)
  const result = await getAuditLogs({
    userId: url.searchParams.get('user_id') ?? undefined,
    module: url.searchParams.get('module') ?? undefined,
    action: url.searchParams.get('action') ?? undefined,
    severity: url.searchParams.get('severity') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    page: parseInt(url.searchParams.get('page') ?? '1'),
    limit: parseInt(url.searchParams.get('limit') ?? '50'),
  })

  return NextResponse.json(result)
}
