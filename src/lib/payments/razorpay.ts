/**
 * Razorpay Payment Gateway Integration
 * Creates orders, verifies signatures, and manages refunds.
 */

import crypto from 'crypto'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? ''
const RAZORPAY_API = 'https://api.razorpay.com/v1'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface RazorpayOrder {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  attempts: number
  notes: Record<string, string>
  created_at: number
}

export interface RazorpayPayment {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  order_id: string
  method: string
  captured: boolean
  email: string
  contact: string
  created_at: number
}

// ─────────────────────────────────────────────
// Order Creation
// ─────────────────────────────────────────────

/**
 * Create a Razorpay order for an invoice.
 * Amount must be in paise (1 INR = 100 paise).
 */
export async function createRazorpayOrder(params: {
  amount: number      // in rupees — converted to paise internally
  receipt: string     // invoice number
  notes?: Record<string, string>
  currency?: string
}): Promise<RazorpayOrder> {
  const { amount, receipt, notes = {}, currency = 'INR' } = params

  const body = {
    amount: Math.round(amount * 100), // paise
    currency,
    receipt,
    notes,
    payment_capture: 1,
  }

  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Razorpay create order failed: ${err}`)
  }

  return res.json()
}

// ─────────────────────────────────────────────
// Signature Verification
// ─────────────────────────────────────────────

/**
 * Verify Razorpay webhook/payment signature.
 */
export function verifyRazorpaySignature(params: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  const { orderId, paymentId, signature } = params
  const body = `${orderId}|${paymentId}`
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expected === signature
}

/**
 * Verify Razorpay webhook signature.
 */
export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return expected === signature
}

// ─────────────────────────────────────────────
// Payment Capture
// ─────────────────────────────────────────────

export async function captureRazorpayPayment(paymentId: string, amount: number): Promise<RazorpayPayment> {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
  const res = await fetch(`${RAZORPAY_API}/payments/${paymentId}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
    body: JSON.stringify({ amount: Math.round(amount * 100) }),
  })
  if (!res.ok) throw new Error(`Capture failed: ${await res.text()}`)
  return res.json()
}

// ─────────────────────────────────────────────
// Refunds
// ─────────────────────────────────────────────

export async function createRazorpayRefund(paymentId: string, amount?: number): Promise<unknown> {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
  const body = amount ? { amount: Math.round(amount * 100) } : {}
  const res = await fetch(`${RAZORPAY_API}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Refund failed: ${await res.text()}`)
  return res.json()
}

// ─────────────────────────────────────────────
// Payment Link
// ─────────────────────────────────────────────

export async function createPaymentLink(params: {
  amount: number
  description: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  invoiceId?: string
  expiresAt?: Date
}): Promise<{ id: string; short_url: string }> {
  const { amount, description, customerName, customerEmail, customerPhone, invoiceId, expiresAt } = params
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const body: Record<string, unknown> = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    description,
    customer: {
      name: customerName,
      ...(customerEmail && { email: customerEmail }),
      ...(customerPhone && { contact: customerPhone }),
    },
    notify: { sms: !!customerPhone, email: !!customerEmail },
    ...(expiresAt && { expire_by: Math.floor(expiresAt.getTime() / 1000) }),
    ...(invoiceId && { reference_id: invoiceId }),
  }

  const res = await fetch(`${RAZORPAY_API}/payment_links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Payment link failed: ${await res.text()}`)
  return res.json()
}

// ─────────────────────────────────────────────
// Checkout config for frontend
// ─────────────────────────────────────────────

export function getRazorpayCheckoutConfig(order: RazorpayOrder, customer: {
  name: string
  email?: string
  phone?: string
}): Record<string, unknown> {
  return {
    key: RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: 'WaCRM',
    order_id: order.id,
    prefill: {
      name: customer.name,
      email: customer.email,
      contact: customer.phone,
    },
    theme: { color: '#6366f1' },
  }
}
