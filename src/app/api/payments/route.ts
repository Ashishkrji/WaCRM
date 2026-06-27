import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { verifyWebhookSignature } from '@/lib/payments/razorpay'
import { createRazorpayOrder, createPaymentLink } from '@/lib/payments/razorpay'

// GET /api/payments
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  const db = supabaseAdmin()
  const { data, count, error } = await db
    .from('payments')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payments: data ?? [], count, page })
}

// POST /api/payments — create payment or Razorpay order
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { action, invoice_id, amount, customer_name, customer_email, customer_phone } = body

  if (action === 'create_order') {
    if (!amount || !invoice_id) return NextResponse.json({ error: 'amount and invoice_id required' }, { status: 400 })

    const db = supabaseAdmin()
    const { data: inv } = await db.from('gst_invoices').select('invoice_number').eq('id', invoice_id).single()

    try {
      const order = await createRazorpayOrder({ amount, receipt: inv?.invoice_number ?? invoice_id })
      return NextResponse.json({ order })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  if (action === 'create_payment_link') {
    try {
      const link = await createPaymentLink({
        amount,
        description: `Payment for invoice`,
        customerName: customer_name ?? 'Customer',
        customerEmail: customer_email,
        customerPhone: customer_phone,
        invoiceId: invoice_id,
        expiresAt: new Date(Date.now() + 7 * 86_400_000), // 7 days
      })
      return NextResponse.json({ payment_link: link })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  // Record a manual payment
  const { method, payment_date, reference_no, notes, contact_id, gateway_payment_id } = body
  if (!amount || !method) return NextResponse.json({ error: 'amount and method required' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: payment, error } = await db
    .from('payments')
    .insert({ user_id: user.id, invoice_id, contact_id, amount, method, gateway_payment_id, payment_date, reference_no, notes, status: 'success' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update invoice paid amount
  if (invoice_id) {
    const { data: inv } = await db.from('gst_invoices').select('grand_total, amount_paid').eq('id', invoice_id).single()
    if (inv) {
      const newPaid = Number(inv.amount_paid) + Number(amount)
      const balance = Number(inv.grand_total) - newPaid
      const status = balance <= 0 ? 'paid' : 'partially_paid'
      await db.from('gst_invoices').update({
        amount_paid: newPaid, balance_due: Math.max(0, balance), status,
        ...(status === 'paid' && { paid_at: new Date().toISOString() }),
        updated_at: new Date().toISOString(),
      }).eq('id', invoice_id)
    }
  }

  return NextResponse.json({ payment }, { status: 201 })
}
