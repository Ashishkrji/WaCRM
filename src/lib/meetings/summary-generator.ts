/**
 * AI Meeting Summary Generator (Part 19)
 * Generates meeting summaries, action items, and key topics using NVIDIA NIM.
 */
import { supabaseAdmin } from '@/lib/automations/admin-client'

const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''

// ─────────────────────────────────────────────
// Generate AI meeting summary
// ─────────────────────────────────────────────

export async function generateMeetingSummary(meetingId: string, userId: string): Promise<{
  summary: string
  key_topics: string[]
  action_items: Array<{ description: string; priority: string; ai_generated: boolean }>
  sentiment: string
  next_steps: string
  outcome: string
}> {
  const db = supabaseAdmin()
  const { data: meeting } = await db.from('meetings').select('*, meeting_attendees(*), meeting_action_items(*)').eq('id', meetingId).single()
  if (!meeting) throw new Error('Meeting not found')

  const transcript = meeting.transcript ?? `Meeting: ${meeting.title}\nType: ${meeting.meeting_type}\nDuration: ${meeting.duration_minutes} minutes`

  const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NVIDIA_API_KEY}` },
    body: JSON.stringify({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      messages: [{
        role: 'user',
        content: `Analyze this meeting and generate a comprehensive summary.
Meeting: ${meeting.title}
Type: ${meeting.meeting_type}
Duration: ${meeting.duration_minutes} minutes
Notes/Transcript: ${transcript}

Respond with JSON:
{
  "summary": "2-3 sentence executive summary",
  "key_topics": ["topic1", "topic2", "topic3"],
  "action_items": [{"description": "action", "priority": "high|medium|low"}],
  "sentiment": "positive|neutral|negative",
  "next_steps": "Brief next steps",
  "outcome": "interested|not_interested|follow_up|deal_closed|no_outcome"
}`,
      }],
      temperature: 0.2,
      max_tokens: 800,
    }),
  })

  const defaultResult = {
    summary: `Meeting: ${meeting.title} (${meeting.duration_minutes} min)`,
    key_topics: [],
    action_items: [],
    sentiment: 'neutral',
    next_steps: '',
    outcome: 'no_outcome',
  }

  if (!res.ok) return defaultResult

  try {
    const d = await res.json()
    const content = d.choices?.[0]?.message?.content ?? '{}'
    const json = content.match(/\{[\s\S]*\}/)
    const result = json ? JSON.parse(json[0]) : defaultResult
    const actionItems = (result.action_items ?? []).map((a: Record<string, string>) => ({ ...a, ai_generated: true }))

    // Save to DB
    await db.from('meetings').update({
      ai_summary: result.summary,
      key_topics: result.key_topics ?? [],
      sentiment: result.sentiment,
      next_steps: result.next_steps,
      outcome: result.outcome,
      updated_at: new Date().toISOString(),
    }).eq('id', meetingId)

    // Save action items
    if (actionItems.length > 0) {
      await db.from('meeting_action_items').insert(
        actionItems.map((item: { description: string; priority: string; ai_generated: boolean }) => ({
          meeting_id: meetingId,
          user_id: userId,
          description: item.description,
          priority: item.priority ?? 'medium',
          ai_generated: true,
          status: 'pending',
        }))
      )
    }

    return { ...result, action_items: actionItems }
  } catch {
    return defaultResult
  }
}

// ─────────────────────────────────────────────
// Create a meeting
// ─────────────────────────────────────────────

export async function createMeeting(params: {
  userId: string
  title: string
  meetingType: string
  contactId?: string
  scheduledAt: string
  durationMinutes?: number
  location?: string
  meetLink?: string
  description?: string
}): Promise<Record<string, unknown>> {
  const db = supabaseAdmin()
  const { data, error } = await db.from('meetings').insert({
    user_id: params.userId,
    title: params.title,
    meeting_type: params.meetingType,
    contact_id: params.contactId,
    scheduled_at: params.scheduledAt,
    duration_minutes: params.durationMinutes ?? 30,
    location: params.location,
    meet_link: params.meetLink,
    description: params.description,
    status: 'scheduled',
  }).select('*, contacts(name, phone)').single()

  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}
