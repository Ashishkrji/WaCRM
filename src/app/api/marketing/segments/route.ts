import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, body: { error: 'Unauthorized' } }
  }
  return { ok: true, userId: user.id }
}

// GET all audience segments
export async function GET() {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  const supabase = await createClient()
  try {
    const { data: segments, error } = await supabase
      .from('audience_segments')
      .select('*')
      .eq('user_id', guard.userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(segments)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: Create or evaluate a segment
export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status })
  }

  const supabase = await createClient()
  try {
    const body = (await request.json().catch(() => null)) as {
      name?: string
      description?: string
      rules?: {
        tags?: string[]
        lead_category?: string
        stage?: string
        lead_source?: string
        marketing_opt_in?: boolean
      }
      save?: boolean
      segmentId?: string
    } | null

    if (!body || !body.rules) {
      return NextResponse.json(
        { error: 'Rules are required' },
        { status: 400 }
      )
    }

    const { name, description, rules, save = false, segmentId } = body

    // 1. Fetch contacts and deals to run the segment rules engine
    const { data: contacts, error: contactsErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', guard.userId)

    if (contactsErr) throw contactsErr

    const { data: deals, error: dealsErr } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', guard.userId)

    if (dealsErr) throw dealsErr

    // 2. Evaluate contacts against the rules
    const matchedContacts = (contacts || []).filter(contact => {
      // Opt-in check (default: only include opt-in contacts unless explicitly ignored)
      const optInRule = rules.marketing_opt_in !== undefined ? rules.marketing_opt_in : true
      if (optInRule && contact.marketing_opt_in === false) {
        return false
      }

      // Tag check
      if (rules.tags && rules.tags.length > 0) {
        const contactTags = Array.isArray(contact.tags) ? contact.tags : []
        const hasMatchingTag = contactTags.some((t: string) => rules.tags!.includes(t))
        if (!hasMatchingTag) return false
      }

      // Lead Source check
      if (rules.lead_source && contact.lead_source !== rules.lead_source) {
        return false
      }

      // Lead Category or Deal Stage checks
      if (rules.lead_category || rules.stage) {
        const contactDeals = (deals || []).filter(d => d.contact_id === contact.id)
        if (contactDeals.length === 0) return false

        if (rules.lead_category) {
          const hasMatchingCategory = contactDeals.some(d => d.lead_category === rules.lead_category)
          if (!hasMatchingCategory) return false
        }

        if (rules.stage) {
          const hasMatchingStage = contactDeals.some(d => d.stage === rules.stage)
          if (!hasMatchingStage) return false
        }
      }

      return true
    })

    let savedSegment = null

    // 3. Save segment if requested
    if (save && name) {
      if (segmentId) {
        const { data, error } = await supabase
          .from('audience_segments')
          .update({
            name,
            description,
            rules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', segmentId)
          .eq('user_id', guard.userId)
          .select()
          .single()

        if (error) throw error
        savedSegment = data
      } else {
        const { data, error } = await supabase
          .from('audience_segments')
          .insert({
            user_id: guard.userId,
            name,
            description,
            rules,
          })
          .select()
          .single()

        if (error) throw error
        savedSegment = data
      }
    }

    return NextResponse.json({
      success: true,
      segment: savedSegment,
      count: matchedContacts.length,
      contacts: matchedContacts.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        tags: c.tags,
        lead_source: c.lead_source,
        marketing_opt_in: c.marketing_opt_in,
      })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/marketing/segments] Segmentation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
