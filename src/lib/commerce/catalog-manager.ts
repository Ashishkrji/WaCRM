/**
 * WhatsApp Catalog Manager (Part 20)
 * Syncs products to WhatsApp Business Catalog via Graph API.
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'

const GRAPH_API_VERSION = 'v19.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

// ─────────────────────────────────────────────
// Sync product to WhatsApp catalog
// ─────────────────────────────────────────────

export async function syncProductToWhatsApp(productId: string, userId: string): Promise<{ success: boolean; whatsapp_product_id?: string }> {
  const db = supabaseAdmin()
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? ''

  const { data: product } = await db.from('commerce_products').select('*').eq('id', productId).single()
  if (!product) throw new Error('Product not found')

  const { data: catalog } = await db.from('whatsapp_catalogs').select('catalog_id').eq('user_id', userId).eq('is_active', true).single()
  if (!catalog) throw new Error('No active WhatsApp catalog found')

  const payload = {
    retailer_id: product.id,
    name: product.name,
    description: product.description ?? '',
    price: Math.round((product.price ?? 0) * 100),  // in cents/paise
    currency: 'INR',
    availability: (product.stock_quantity ?? 0) > 0 ? 'in stock' : 'out of stock',
    image_url: (product.images as string[])?.[0] ?? product.image_url,
    url: product.url ?? '',
    brand: product.brand ?? '',
  }

  try {
    const res = await fetch(`${GRAPH_BASE}/${catalog.catalog_id}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message ?? `HTTP ${res.status}`)
    }

    const d = await res.json()
    await db.from('commerce_products').update({
      whatsapp_product_id: d.id,
      whatsapp_catalog_id: catalog.catalog_id,
      is_synced_to_whatsapp: true,
      last_synced_at: new Date().toISOString(),
    }).eq('id', productId)

    return { success: true, whatsapp_product_id: d.id }
  } catch (e) {
    return { success: false }
  }
}

// ─────────────────────────────────────────────
// Create WhatsApp order from cart
// ─────────────────────────────────────────────

export async function createOrderFromCart(cartId: string, userId: string): Promise<Record<string, unknown>> {
  const db = supabaseAdmin()
  const { data: cart } = await db.from('commerce_carts').select('*').eq('id', cartId).eq('user_id', userId).single()
  if (!cart) throw new Error('Cart not found')

  const items = cart.items as Array<{ product_id: string; quantity: number; price: number; name: string }>
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const taxAmount = subtotal * 0.18  // 18% GST
  const total = subtotal + taxAmount

  const orderNumber = `ORD-${Date.now()}`

  const { data: order, error } = await db.from('commerce_orders').insert({
    user_id: userId,
    contact_id: cart.contact_id,
    conversation_id: cart.conversation_id,
    order_number: orderNumber,
    status: 'pending',
    subtotal,
    tax_amount: taxAmount,
    total,
    currency: 'INR',
    source: 'whatsapp',
    payment_status: 'pending',
    payment_method: 'upi',
  }).select().single()

  if (error) throw new Error(error.message)

  // Create order items
  await db.from('commerce_order_items').insert(
    items.map(item => ({
      order_id: order.id,
      user_id: userId,
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      tax_rate: 18,
      tax_amount: item.price * item.quantity * 0.18,
      line_total: item.price * item.quantity * 1.18,
    }))
  )

  // Mark cart as ordered
  await db.from('commerce_carts').update({ status: 'ordered' }).eq('id', cartId)

  return order as Record<string, unknown>
}

// ─────────────────────────────────────────────
// Get order stats
// ─────────────────────────────────────────────

export async function getOrderStats(userId: string) {
  const db = supabaseAdmin()
  const { data: orders } = await db.from('commerce_orders').select('status, total, created_at').eq('user_id', userId)
  const all = orders ?? []
  const thisMonth = all.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth())
  return {
    total_orders: all.length,
    pending: all.filter(o => o.status === 'pending').length,
    confirmed: all.filter(o => o.status === 'confirmed').length,
    delivered: all.filter(o => o.status === 'delivered').length,
    revenue_total: all.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0),
    revenue_this_month: thisMonth.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0),
  }
}
