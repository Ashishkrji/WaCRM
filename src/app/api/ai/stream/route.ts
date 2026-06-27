import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/services/ai/orchestrator'
import type { AIMessage } from '@/services/ai/types'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true, userId: user.id }
}

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok) {
    return new Response(JSON.stringify({ error: guard.error }), {
      status: guard.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      messages?: AIMessage[]
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
    } | null

    if (!body || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: "messages" array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const provider = getAIProvider()
    const encoder = new TextEncoder()

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          const generator = provider.stream({
            messages: body.messages!,
            systemPrompt: body.systemPrompt,
            temperature: body.temperature ?? 0.7,
            maxTokens: body.maxTokens ?? 1024,
          })

          for await (const chunk of generator) {
            // Send chunk as SSE event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (streamErr) {
          const errMsg = streamErr instanceof Error ? streamErr.message : String(streamErr)
          console.error('[api/ai/stream] Generator error:', errMsg)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/ai/stream] SSE stream error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
