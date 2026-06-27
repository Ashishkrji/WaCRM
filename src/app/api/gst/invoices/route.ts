import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'

// GET /api/gst/invoices?status=&page=
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  const db = supabaseAdmin()
  let query = db
    .from('gst_invoices')
    .select('*, gst_invoice_items(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('invoice_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoices: data ?? [], count, page, limit })
}

// POST /api/gst/invoices
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const db = supabaseAdmin()

  // Get config for invoice number
  const { data: config } = await db.from('gst_config').select('*').eq('user_id', user.id).single()

  // Auto-generate invoice number
  const prefix = config?.invoice_prefix ?? 'INV'
  const num = config?.next_invoice_number ?? 1001
  const invoiceNumber = `${prefix}-${num}`

  // Update next number
  if (config) {
    await db.from('gst_config').update({ next_invoice_number: num + 1, updated_at: new Date().toISOString() }).eq('user_id', user.id)
  }

  const { items, ...invoiceData } = body

  // Insert invoice
  const { data: invoice, error: invErr } = await db
    .from('gst_invoices')
    .insert({ ...invoiceData, user_id: user.id, invoice_number: invoiceNumber })
    .select()
    .single()

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

  // Insert items
  if (Array.isArray(items) && items.length > 0) {
    const lineItems = items.map((item: Record<string, unknown>, i: number) => ({
      ...item, invoice_id: invoice.id, user_id: user.id, sort_order: i,
    }))
    const { error: itemErr } = await db.from('gst_invoice_items').insert(lineItems)
    if (itemErr) console.error('[invoice items]', itemErr.message)
  }

  // Log to tax ledger
  if (invoice.cgst_amount > 0) {
    const periodDate = new Date(invoice.invoice_date)
    await db.from('gst_tax_ledger').insert([
      { user_id: user.id, invoice_id: invoice.id, ledger_type: 'cgst_collected', period_month: periodDate.getMonth() + 1, period_year: periodDate.getFullYear(), amount: invoice.cgst_amount },
      { user_id: user.id, invoice_id: invoice.id, ledger_type: 'sgst_collected', period_month: periodDate.getMonth() + 1, period_year: periodDate.getFullYear(), amount: invoice.sgst_amount },
    ])
  }
  if (invoice.igst_amount > 0) {
    const periodDate = new Date(invoice.invoice_date)
    await db.from('gst_tax_ledger').insert([
      { user_id: user.id, invoice_id: invoice.id, ledger_type: 'igst_collected', period_month: periodDate.getMonth() + 1, period_year: periodDate.getFullYear(), amount: invoice.igst_amount },
    ])
  }

  return NextResponse.json({ invoice }, { status: 201 })
}
