import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbService } from '@/services/db'
import { type SupabaseClient } from '@supabase/supabase-js'

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
    // Fetch logs from MongoDB Atlas using the Database Service Layer
    const logs = await dbService.ai.listAIUsageLogs(guard.userId)

    const formatted = logs.map(l => ({
      id: l._id.toString(),
      operation: l.operation,
      provider: l.provider,
      model: l.model,
      total_tokens: l.total_tokens || 0,
      confidence: l.confidence ?? null,
      finish_reason: l.finish_reason ?? null,
      created_at: l.created_at,
    }))

    return NextResponse.json(formatted)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
