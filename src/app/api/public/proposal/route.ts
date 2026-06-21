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
    return NextResponse.json({ error: 'Missing proposal ID' }, { status: 400 })
  }

  try {
    const { data: proposal, error } = await supabaseAdmin()
      .from('proposal_requests')
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
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    return NextResponse.json({ proposal })
  } catch (err: any) {
    console.error('[API/public/proposal] GET error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { id, signature } = await request.json()

    if (!id || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Fetch the proposal to get details
    const { data: proposal, error: fetchErr } = await supabaseAdmin()
      .from('proposal_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr) throw fetchErr
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Update status in proposal_requests
    const { error: updateErr } = await supabaseAdmin()
      .from('proposal_requests')
      .update({
        status: 'signed',
        client_signature: signature,
        signed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateErr) throw updateErr

    // Insert system notification in conversation thread
    if (proposal.conversation_id) {
      await supabaseAdmin()
        .from('messages')
        .insert({
          conversation_id: proposal.conversation_id,
          sender_type: 'bot',
          content_type: 'text',
          content_text: `✍️ *Proposal Signed* 👈\n\nThe customer has digitally signed and accepted the proposal for *${proposal.service_required}*.\n\n*Signature:* ${signature}\n*Signed At:* ${new Date().toLocaleString()}`,
          status: 'read'
        })
    }

    // Update Deal stage if there is an active deal for this contact
    const { data: deals } = await supabaseAdmin()
      .from('deals')
      .select('*')
      .eq('contact_id', proposal.contact_id)
      .eq('status', 'active')
      .limit(1)

    if (deals && deals.length > 0) {
      // Find the "Proposal Sent" or "Negotiation" or similar stage in user's pipeline
      const deal = deals[0]
      const { data: stages } = await supabaseAdmin()
        .from('pipeline_stages')
        .select('id, name')
        .eq('pipeline_id', deal.pipeline_id)
        .order('position', { ascending: true })

      if (stages && stages.length > 0) {
        // Try to find stage named Negotiation or Proposal Accepted
        const targetStage = stages.find((s: any) => s.name.toLowerCase().includes('negotiation') || s.name.toLowerCase().includes('proposal')) 
          || stages[Math.min(stages.length - 1, 4)] // fall back to stage 4 or last stage

        await supabaseAdmin()
          .from('deals')
          .update({
            stage_id: targetStage.id,
            notes: `${deal.notes || ''}\n\n[System] Proposal signed by client: "${signature}".`
          })
          .eq('id', deal.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API/public/proposal] POST error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
