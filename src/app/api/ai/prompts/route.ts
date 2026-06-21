import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { connectToDatabase } from '@/lib/mongodb'
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
    const { db } = await connectToDatabase()
    const templates = await db.collection('prompt_templates')
      .find({ user_id: guard.userId })
      .sort({ created_at: -1 })
      .toArray()

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

    const { db } = await connectToDatabase()
    const templateId = id || crypto.randomUUID()

    // If setting as default, unset other defaults for this user
    if (is_default) {
      await db.collection('prompt_templates').updateMany(
        { user_id: guard.userId },
        { $set: { is_default: false, updated_at: new Date() } }
      )
    }

    await db.collection('prompt_templates').updateOne(
      { id: templateId, user_id: guard.userId },
      {
        $set: {
          name,
          description: description || null,
          content,
          is_default: !!is_default,
          intent_filter: intent_filter || [],
          updated_at: new Date(),
        },
        $setOnInsert: {
          id: templateId,
          user_id: guard.userId,
          created_at: new Date(),
        }
      },
      { upsert: true }
    )

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

    const { db } = await connectToDatabase()
    await db.collection('prompt_templates').deleteOne({
      id: id,
      user_id: guard.userId
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
