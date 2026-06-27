import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreContact, getTopLeads, recordSignal } from '@/lib/leads/scoring-engine'
import { supabaseAdmin } from '@/lib/automations/admin-client'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const resource = url.searchParams.get('resource')

  if (resource === 'top') {
    const limit = parseInt(url.searchParams.get('limit') ?? '20')
    const leads = await getTopLeads(user.id, limit)
    return NextResponse.json({ leads })
  }

  if (resource === 'rules') {
    const db = supabaseAdmin()
    const { data } = await db.from('scoring_rules').select('*').eq('user_id', user.id).order('rule_type')
    return NextResponse.json({ rules: data ?? [] })
  }

  // Get all scored contacts
  const db = supabaseAdmin()
  const { data } = await db.from('lead_scores').select('*, contacts(name, phone, company, email)').eq('user_id', user.id).order('total_score', { ascending: false })
  return NextResponse.json({ scores: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  if (body.action === 'score' && body.contact_id) {
    const score = await scoreContact(user.id, body.contact_id)
    return NextResponse.json({ score })
  }

  if (body.action === 'signal' && body.contact_id && body.signal_type) {
    await recordSignal({ userId: user.id, contactId: body.contact_id, signalType: body.signal_type, signalValue: body.signal_value, source: body.source, metadata: body.metadata })
    return NextResponse.json({ success: true }, { status: 201 })
  }

  if (body.action === 'score_all') {
    const db = supabaseAdmin()
    const { data: contacts } = await db.from('contacts').select('id').eq('user_id', user.id).limit(100)
    for (const c of contacts ?? []) {
      await scoreContact(user.id, c.id).catch(() => {})
    }
    return NextResponse.json({ success: true, scored: contacts?.length ?? 0 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
