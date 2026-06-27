import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { generateGSTR1, generateGSTR3B } from '@/lib/gst/report-generator'

// GET /api/gst/reports?type=GSTR1&month=6&year=2026
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'GSTR1'
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  const db = supabaseAdmin()
  const { data: config } = await db.from('gst_config').select('gstin').eq('user_id', user.id).single()
  const gstin = config?.gstin ?? ''

  try {
    let report: unknown
    if (type === 'GSTR1') {
      report = await generateGSTR1(user.id, month, year, gstin)
    } else if (type === 'GSTR3B') {
      report = await generateGSTR3B(user.id, month, year, gstin)
    } else {
      return NextResponse.json({ error: 'Unsupported type. Use GSTR1 or GSTR3B' }, { status: 400 })
    }

    return NextResponse.json({ type, period: { month, year }, data: report })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/gst/reports — save/mark as filed
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { gstr_type, month, year, arn, status = 'prepared', data: reportData } = body

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('gst_returns')
    .upsert({
      user_id: user.id,
      gstr_type,
      period_month: month,
      period_year: year,
      status,
      data: reportData ?? {},
      arn,
      ...(status === 'filed' && { filed_at: new Date().toISOString() }),
    }, { onConflict: 'user_id,gstr_type,period_month,period_year' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ return: data })
}
