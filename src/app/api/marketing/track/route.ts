import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Website traffic ingestion can be public (called from website widgets without CRM auth),
  // but it must specify which workspace/user owns the lead.
  // We can pass a workspace owner's user_id or let the system resolve it, or fall back to an active user.
  const supabase = await createClient()

  try {
    const body = (await request.json().catch(() => null)) as {
      userId?: string // Owner user id
      contactId?: string
      email?: string
      phone?: string
      name?: string
      urlPath: string
      utmSource?: string
      utmMedium?: string
      utmCampaign?: string
      utmContent?: string
      utmTerm?: string
      deviceType?: string
      locationCountry?: string
      conversionType?: string // 'lead_form', 'meeting_booked', 'proposal_requested', 'quotation_requested', 'payment_completed'
    } | null

    if (!body || !body.urlPath) {
      return NextResponse.json(
        { error: 'urlPath is required' },
        { status: 400 }
      )
    }

    const {
      userId,
      contactId,
      email,
      phone,
      name,
      urlPath,
      utmSource = 'Direct',
      utmMedium = 'Web',
      utmCampaign,
      utmContent,
      utmTerm,
      deviceType = 'Desktop',
      locationCountry = 'IN',
      conversionType,
    } = body

    // 1. Resolve owner user_id
    let ownerId = userId
    if (!ownerId) {
      // If no ownerId passed, try to get current authenticated session as fallback
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        ownerId = user.id
      } else {
        // Find first active user in system as fallback
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
        if (profiles && profiles.length > 0) {
          ownerId = profiles[0].id
        }
      }
    }

    if (!ownerId) {
      return NextResponse.json({ error: 'No workspace owner resolved' }, { status: 400 })
    }

    // 2. Identify or create contact
    let finalContactId = contactId

    if (!finalContactId && (email || phone)) {
      // Try to find existing contact by email or phone
      let contactQuery = supabase.from('contacts').select('id').eq('user_id', ownerId)
      if (email) {
        contactQuery = contactQuery.eq('email', email)
      } else if (phone) {
        contactQuery = contactQuery.eq('phone', phone)
      }
      
      const { data: existingContact } = await contactQuery.limit(1).maybeSingle()
      
      if (existingContact) {
        finalContactId = existingContact.id
      } else {
        // Create new contact (lead generation!)
        const contactName = name || email?.split('@')[0] || phone || 'New Lead'
        const { data: newContact, error: insertErr } = await supabase
          .from('contacts')
          .insert({
            user_id: ownerId,
            name: contactName,
            email: email || null,
            phone: phone || null,
            lead_source: utmSource,
            tags: [utmSource, utmMedium].filter(Boolean),
            marketing_opt_in: true,
          })
          .select()
          .single()

        if (insertErr) {
          console.error('[api/marketing/track] Failed to create contact:', insertErr)
        } else if (newContact) {
          finalContactId = newContact.id

          // Log customer journey as 'lead'
          await supabase.from('customer_journeys').insert({
            user_id: ownerId,
            contact_id: finalContactId,
            stage: 'lead',
            notes: `Auto-generated from landing page UTM traffic. Source: ${utmSource}, Campaign: ${utmCampaign || 'None'}`
          })
        }
      }
    }

    // If still no contact, create a guest/visitor contact so we can track the visitor session
    if (!finalContactId) {
      const guestName = `Visitor-${Math.floor(1000 + Math.random() * 9000)}`
      const { data: guestContact } = await supabase
        .from('contacts')
        .insert({
          user_id: ownerId,
          name: guestName,
          lead_source: utmSource,
          tags: ['Visitor', utmSource].filter(Boolean),
          marketing_opt_in: true,
        })
        .select()
        .single()

      if (guestContact) {
        finalContactId = guestContact.id

        // Log customer journey as 'visitor'
        await supabase.from('customer_journeys').insert({
          user_id: ownerId,
          contact_id: finalContactId,
          stage: 'visitor',
          notes: `Anonymous visitor session tracked from ${urlPath}`
        })
      }
    }

    if (!finalContactId) {
      return NextResponse.json({ error: 'Failed to resolve or create contact context' }, { status: 500 })
    }

    // 3. Log UTM tracking record
    const utmRecord = {
      user_id: ownerId,
      contact_id: finalContactId,
      url_path: urlPath,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign || null,
      utm_content: utmContent || null,
      utm_term: utmTerm || null,
      device_type: deviceType,
      location_country: locationCountry,
      conversion_type: conversionType || null,
      converted_at: conversionType ? new Date().toISOString() : null,
    }

    const { error: trackErr } = await supabase
      .from('utm_tracking')
      .insert(utmRecord)

    if (trackErr) throw trackErr

    // 4. Update contact details and attribution
    if (conversionType) {
      // Update contact stage or notes
      const stageMap: Record<string, string> = {
        lead_form: 'lead',
        meeting_booked: 'meeting',
        proposal_requested: 'proposal',
        quotation_requested: 'quotation',
        payment_completed: 'payment',
      }

      const targetStage = stageMap[conversionType]
      if (targetStage) {
        // Check current latest stage to avoid downgrading
        const { data: latestJourney } = await supabase
          .from('customer_journeys')
          .select('stage')
          .eq('contact_id', finalContactId)
          .order('entered_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!latestJourney || latestJourney.stage !== targetStage) {
          // Exited previous stage if exists
          await supabase
            .from('customer_journeys')
            .update({ exited_at: new Date().toISOString() })
            .eq('contact_id', finalContactId)
            .is('exited_at', null)

          // Insert new stage
          await supabase.from('customer_journeys').insert({
            user_id: ownerId,
            contact_id: finalContactId,
            stage: targetStage,
            notes: `Conversion event triggered: ${conversionType}. Campaign: ${utmCampaign || 'None'}`
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      contactId: finalContactId,
      message: 'Attribution tracked successfully',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/marketing/track] Tracking error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
