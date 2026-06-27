import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/rbac'
import { getAllUsers, setUserStatus, updateUserRole, forcePasswordReset } from '@/lib/admin/user-manager'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '50')
  const role = url.searchParams.get('role') ?? undefined
  const status = url.searchParams.get('status') ?? undefined
  const search = url.searchParams.get('search') ?? undefined

  const result = await getAllUsers({ page, limit, role, status, search })
  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => null)
  if (!body?.user_id || !body?.action) return NextResponse.json({ error: 'user_id and action required' }, { status: 400 })

  switch (body.action) {
    case 'suspend':
      await setUserStatus(body.user_id, auth.user.id, 'suspended')
      return NextResponse.json({ success: true })
    case 'activate':
      await setUserStatus(body.user_id, auth.user.id, 'active')
      return NextResponse.json({ success: true })
    case 'set_role':
      if (!body.role) return NextResponse.json({ error: 'role required' }, { status: 400 })
      await updateUserRole(body.user_id, auth.user.id, body.role)
      return NextResponse.json({ success: true })
    case 'force_password_reset':
      await forcePasswordReset(body.user_id, auth.user.id)
      return NextResponse.json({ success: true })
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
