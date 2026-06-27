import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { verifyWebhookSignature } from '@/lib/payments/razorpay'

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''

// POST /api/payments/razorpay-webhook
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  // Verify webhook signature
  if (RAZORPAY_WEBHOOK_SECRET && !verifyWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try { event = JSON.parse(body) }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const db = supabaseAdmin()
  const eventType = String(event.event)
  const payload = event.payload as Record<string, unknown>

  if (eventType === 'payment.captured') {
    const payment = (payload.payment as { entity: Record<string, unknown> })?.entity
    if (payment) {
      const orderId = String(payment.order_id ?? '')
      const notes = payment.notes as Record<string, string> ?? {}
      const invoiceId = notes.invoice_id ?? notes.reference_id ?? null
      const amount = Number(payment.amount) / 100

      // Record payment
      await db.from('payments').upsert({
        gateway_payment_id: String(payment.id),
        gateway_order_id: orderId,
        amount,
        currency: String(payment.currency ?? 'INR'),
        method: String(payment.method ?? 'razorpay') as never,
        gateway: 'razorpay',
        status: 'success',
        payment_date: new Date().toISOString().split('T')[0],
        invoice_id: invoiceId,
      }, { onConflict: 'gateway_payment_id' })

      // Update invoice if linked
      if (invoiceId) {
        const { data: inv } = await db.from('gst_invoices').select('grand_total, amount_paid').eq('id', invoiceId).single()
        if (inv) {
          const newPaid = Number(inv.amount_paid) + amount
          const balance = Math.max(0, Number(inv.grand_total) - newPaid)
          const status = balance <= 0 ? 'paid' : 'partially_paid'
          await db.from('gst_invoices').update({
            amount_paid: newPaid,
            balance_due: balance,
            status,
            ...(status === 'paid' && { paid_at: new Date().toISOString() }),
          }).eq('id', invoiceId)
        }
      }
    }
  }

  if (eventType === 'payment.failed') {
    const payment = (payload.payment as { entity: Record<string, unknown> })?.entity
    if (payment) {
      await db.from('payments').upsert({
        gateway_payment_id: String(payment.id),
        gateway_order_id: String(payment.order_id ?? ''),
        amount: Number(payment.amount) / 100,
        method: String(payment.method ?? 'razorpay') as never,
        gateway: 'razorpay',
        status: 'failed',
      }, { onConflict: 'gateway_payment_id' })
    }
  }

  return NextResponse.json({ received: true })
}
