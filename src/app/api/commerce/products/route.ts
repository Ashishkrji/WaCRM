import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { syncProductToWhatsApp, getOrderStats } from '@/lib/commerce/catalog-manager'

// GET /api/commerce/products
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const resource = url.searchParams.get('resource')

  if (resource === 'stats') {
    const stats = await getOrderStats(user.id)
    return NextResponse.json({ stats })
  }

  const db = supabaseAdmin()
  let query = db.from('commerce_products').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

  const category = url.searchParams.get('category')
  const synced = url.searchParams.get('synced')
  if (category) query = query.eq('category', category)
  if (synced === 'true') query = query.eq('is_synced_to_whatsapp', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data ?? [] })
}

// POST /api/commerce/products
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const db = supabaseAdmin()

  if (body.action === 'sync_whatsapp' && body.product_id) {
    const result = await syncProductToWhatsApp(body.product_id, user.id)
    return NextResponse.json(result)
  }

  const { data, error } = await db.from('commerce_products').insert({
    user_id: user.id,
    name: body.name,
    description: body.description,
    price: body.price,
    sale_price: body.sale_price,
    sku: body.sku,
    category: body.category,
    brand: body.brand,
    images: body.images ?? [],
    tags: body.tags ?? [],
    stock_quantity: body.stock_quantity ?? 0,
    tax_rate: body.tax_rate ?? 18,
    hsn_code: body.hsn_code,
    is_active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}
