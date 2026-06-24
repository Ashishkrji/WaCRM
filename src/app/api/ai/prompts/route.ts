import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbService } from '@/services/db'
import { type SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

async function requireUser(): Promise<
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; status: number; body: { error: string } }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, body: { error: 'Unauthorized' } }
  }
  return { ok: true, userId: user.id, supabase }
}

export async function GET() {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  try {
    // Fetch templates from MongoDB Atlas using the Database Service Layer
    const templates = await dbService.ai.listPromptTemplates(guard.userId)

    const formatted = templates.map(t => ({
      id: t.id || t._id.toString(),
      name: t.name,
      description: t.description,
      content: t.content,
      is_default: t.is_default,
      intent_filter: t.intent_filter || [],
      created_at: t.created_at,
    }))

    return NextResponse.json(formatted)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  try {
    const body = await request.json()
    const { name, description, content, is_default, intent_filter, id } = body

    if (!name || !content) {
       return NextResponse.json({ error: 'Missing name or content' }, { status: 400 })
    }

    const templateId = id || crypto.randomUUID()

    // If setting as default, unset other defaults for this user via dbService
    if (is_default) {
      await dbService.ai.unsetDefaultPromptTemplates(guard.userId)
    }

    // Upsert prompt template via dbService
    await dbService.ai.upsertPromptTemplate(guard.userId, templateId, {
      name,
      description,
      content,
      is_default: !!is_default,
      intent_filter,
    })

    return NextResponse.json({ success: true, id: templateId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    // Delete prompt template via dbService
    await dbService.ai.deletePromptTemplate(guard.userId, id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
