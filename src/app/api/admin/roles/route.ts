import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/rbac'
import { getRolesWithPermissions, setRolePermission } from '@/lib/admin/rbac'
import { supabaseAdmin } from '@/lib/automations/admin-client'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const db = supabaseAdmin()
  const [roles, { data: permissions }] = await Promise.all([
    getRolesWithPermissions(),
    db.from('crm_permissions').select('module, action, code, description').order('module').order('action'),
  ])

  return NextResponse.json({ roles, permissions: permissions ?? [] })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => null)
  if (!body?.role_code || !body?.permission_code) {
    return NextResponse.json({ error: 'role_code and permission_code required' }, { status: 400 })
  }

  await setRolePermission(body.role_code, body.permission_code, body.granted ?? true)
  return NextResponse.json({ success: true })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.code) return NextResponse.json({ error: 'name and code required' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db.from('crm_roles').insert({
    user_id: auth.user.id,
    name: body.name,
    code: body.code,
    description: body.description,
    is_system: false,
    is_active: true,
    priority: body.priority ?? 100,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ role: data }, { status: 201 })
}
