import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { connectToDatabase } from '@/lib/mongodb'
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

  const { supabase, userId } = guard

  try {
    const { db } = await connectToDatabase()
    
    // Fetch AI conversations from MongoDB Atlas
    const mongoAIConvs = await db.collection('ai_conversations')
      .find({ user_id: userId })
      .sort({ updated_at: -1 })
      .toArray()

    if (mongoAIConvs.length === 0) {
      return NextResponse.json([])
    }

    const conversationIds = mongoAIConvs.map(c => c.conversation_id)

    // Fetch corresponding details from Supabase to join contacts & last messages
    const { data: supabaseConvs, error: supabaseErr } = await supabase
      .from('conversations')
      .select(`
        id,
        last_message_text,
        last_message_at,
        contacts (
          id,
          name,
          phone
        )
      `)
      .in('id', conversationIds)

    if (supabaseErr) {
      return NextResponse.json({ error: supabaseErr.message }, { status: 500 })
    }

    const supabaseMap = new Map<string, any>(
      (supabaseConvs || []).map(c => [c.id, c])
    )

    // Map hybrid database records
    const result = mongoAIConvs.map(mongoConv => {
      const supDetail = supabaseMap.get(mongoConv.conversation_id)
      return {
        id: mongoConv.conversation_id,
        total_ai_messages: mongoConv.total_ai_messages,
        ai_active: mongoConv.ai_active,
        handed_off_at: mongoConv.handed_off_at || null,
        provider: mongoConv.provider,
        model: mongoConv.model,
        created_at: mongoConv.created_at,
        conversations: supDetail ? {
          id: supDetail.id,
          last_message_text: supDetail.last_message_text,
          last_message_at: supDetail.last_message_at,
          contacts: supDetail.contacts ? {
            id: supDetail.contacts.id,
            name: supDetail.contacts.name,
            phone: supDetail.contacts.phone
          } : null
        } : null
      }
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
