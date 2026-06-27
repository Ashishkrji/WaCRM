import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { createOrderFromCart } from '@/lib/commerce/catalog-manager'

// GET /api/commerce/orders
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const contactId = url.searchParams.get('contact_id')

  const db = supabaseAdmin()
  let query = db.from('commerce_orders').select('*, contacts(name, phone), commerce_order_items(product_name, quantity, line_total)').eq('user_id', user.id).order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (contactId) query = query.eq('contact_id', contactId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data ?? [] })
}

// POST /api/commerce/orders
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  if (body.action === 'from_cart' && body.cart_id) {
    const order = await createOrderFromCart(body.cart_id, user.id)
    return NextResponse.json({ order }, { status: 201 })
  }

  // Manual order
  const db = supabaseAdmin()
  const orderNumber = `ORD-${Date.now()}`
  const { data, error } = await db.from('commerce_orders').insert({
    user_id: user.id,
    order_number: orderNumber,
    contact_id: body.contact_id,
    status: 'pending',
    subtotal: body.subtotal ?? 0,
    tax_amount: body.tax_amount ?? 0,
    total: body.total ?? 0,
    currency: 'INR',
    payment_method: body.payment_method ?? 'upi',
    notes: body.notes,
    source: 'manual',
    payment_status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ order: data }, { status: 201 })
}
