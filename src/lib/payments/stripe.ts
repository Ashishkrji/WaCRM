/**
 * Stripe Payment Gateway Integration
 * Subscriptions, one-time payments, and webhook handling.
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-12-18.acacia' as any })

export { stripe }

// ─────────────────────────────────────────────
// Customer
// ─────────────────────────────────────────────

export async function createStripeCustomer(params: {
  email: string
  name: string
  metadata?: Record<string, string>
}): Promise<Stripe.Customer> {
  return stripe.customers.create({ email: params.email, name: params.name, metadata: params.metadata ?? {} })
}

// ─────────────────────────────────────────────
// One-time payment
// ─────────────────────────────────────────────

export async function createPaymentIntent(params: {
  amount: number   // in smallest currency unit (paise/cents)
  currency?: string
  customerId?: string
  metadata?: Record<string, string>
  description?: string
}): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100),
    currency: params.currency ?? 'inr',
    customer: params.customerId,
    metadata: params.metadata ?? {},
    description: params.description,
    automatic_payment_methods: { enabled: true },
  })
}

// ─────────────────────────────────────────────
// Subscriptions
// ─────────────────────────────────────────────

export async function createSubscription(params: {
  customerId: string
  priceId: string
  trialDays?: number
  metadata?: Record<string, string>
}): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    trial_period_days: params.trialDays,
    metadata: params.metadata ?? {},
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true): Promise<Stripe.Subscription> {
  if (atPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
  }
  return stripe.subscriptions.cancel(subscriptionId)
}

export async function updateSubscription(subscriptionId: string, priceId: string): Promise<Stripe.Subscription> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: sub.items.data[0].id, price: priceId }],
    proration_behavior: 'create_prorations',
  })
}

// ─────────────────────────────────────────────
// Checkout Session
// ─────────────────────────────────────────────

export async function createCheckoutSession(params: {
  customerId?: string
  priceId: string
  mode: 'payment' | 'subscription'
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: params.mode,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata ?? {},
    allow_promotion_codes: true,
  })
}

// ─────────────────────────────────────────────
// Customer Portal
// ─────────────────────────────────────────────

export async function createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })
}

// ─────────────────────────────────────────────
// Webhook verification
// ─────────────────────────────────────────────

export function constructStripeEvent(payload: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// ─────────────────────────────────────────────
// Refund
// ─────────────────────────────────────────────

export async function createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount: Math.round(amount * 100) }),
  })
}
