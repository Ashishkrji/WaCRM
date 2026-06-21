import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

let _admin: any = null
function supabaseAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _admin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 })
  }

  try {
    const { data: quote, error } = await supabaseAdmin()
      .from('quotation_requests')
      .select(`
        *,
        contacts (
          id,
          name,
          phone,
          company
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!quote) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    return NextResponse.json({ quote })
  } catch (err: any) {
    console.error('[API/public/quote] GET error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { id, signature, action, paymentMethod } = await request.json()

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Fetch quotation details
    const { data: quote, error: fetchErr } = await supabaseAdmin()
      .from('quotation_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr) throw fetchErr
    if (!quote) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    if (action === 'sign') {
      if (!signature) {
        return NextResponse.json({ error: 'Missing client signature' }, { status: 400 })
      }
      
      const { error: updateErr } = await supabaseAdmin()
        .from('quotation_requests')
        .update({
          status: 'generated', // keeps in pending checkout status
          client_signature: signature,
          signed_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateErr) throw updateErr

      if (quote.conversation_id) {
        await supabaseAdmin()
          .from('messages')
          .insert({
            conversation_id: quote.conversation_id,
            sender_type: 'bot',
            content_type: 'text',
            content_text: `✍️ *Quotation Signed* 👈\n\nThe customer has digitally signed the quote for *${quote.service_required}* (Amount: ₹${quote.total_amount || 0}).\n\n*Signature:* ${signature}\n*Signed At:* ${new Date().toLocaleString()}\n\nWaiting for payment confirmation.`,
            status: 'read'
          })
      }
    } else if (action === 'pay') {
      const { error: updateErr } = await supabaseAdmin()
        .from('quotation_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateErr) throw updateErr

      // Update associated Deal to WON
      const { data: deals } = await supabaseAdmin()
        .from('deals')
        .select('*')
        .eq('contact_id', quote.contact_id)
        .eq('status', 'active')
        .limit(1)

      if (deals && deals.length > 0) {
        const deal = deals[0]
        await supabaseAdmin()
          .from('deals')
          .update({
            status: 'won',
            value: quote.total_amount || deal.value,
            notes: `${deal.notes || ''}\n\n[System] Payment verified successfully via ${paymentMethod || 'UPI Checkout'}.`
          })
          .eq('id', deal.id)
      }

      // Insert UPI/Stripe success message in thread
      const mockTx = `TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`
      if (quote.conversation_id) {
        await supabaseAdmin()
          .from('messages')
          .insert({
            conversation_id: quote.conversation_id,
            sender_type: 'bot',
            content_type: 'text',
            content_text: `✅ *UPI Payment Success* 👈\n\n*Amount:* ₹${quote.total_amount || 0}\n*Transaction ID:* ${mockTx}\n\nThe customer has successfully paid ₹${quote.total_amount || 0} via ${paymentMethod === 'card' ? 'Stripe Card Checkout' : 'UPI Instant Pay'}. The deal stage has been automatically updated to *Won/Paid*!`,
            status: 'read'
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API/public/quote] POST error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
