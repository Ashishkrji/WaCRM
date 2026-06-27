import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/services/ai/orchestrator'
import { contactRepo, conversationRepo, messageRepo, dealRepo, meetingRepo, quotationRepo, proposalRepo, pipelineRepo, leadScoreRepo, syncRepo, aiRouterRepo, knowledgeRepo, memoryRepo, aiDataRepo } from '@/repositories';

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

export async function POST(request: Request) {
  const guard = await requireUser()
  if (!guard.ok || !guard.userId) {
    return NextResponse.json(guard.body || { error: 'Unauthorized' }, { status: guard.status || 401 })
  }
  const userId = guard.userId

  try {
    const body = (await request.json().catch(() => null)) as {
      objective?: string
      category?: string
      targetAudience?: string
      mediaPreference?: string
      offerDetails?: string
      campaignId?: string
    } | null

    if (!body || !body.objective || !body.category) {
      return NextResponse.json(
        { error: 'Objective and Category are required' },
        { status: 400 }
      )
    }

    const { objective, category, targetAudience = 'All Contacts', mediaPreference = 'None', offerDetails = 'None', campaignId } = body
    const provider = getAIProvider()

    const systemPrompt = `You are a premium AI Marketing Specialist and copywriter. Generate complete multi-channel campaign strategies, high-conversion copy, and engagement projections. 
You must respond with a VALID, RAW JSON object only, with no markdown formatting, no code blocks, and no backticks. The JSON structure must match this schema exactly:
{
  "strategyName": "Short descriptive campaign title",
  "whatsappCopy": "The WhatsApp message copy with emojis and friendly tone",
  "emailSubject": "High CTR Email Subject Line",
  "emailCopy": "Rich text/HTML friendly email body copy",
  "landingHeadline": "High-conversion landing page hero headline",
  "landingBody": "Supporting benefit-focused body copy for landing page",
  "suggestedOffers": ["Offer 1", "Offer 2"],
  "dripSequence": [
    { "day": 1, "subject": "Day 1 Subject/Focus", "content": "WhatsApp or email text for Day 1" },
    { "day": 3, "subject": "Day 3 Subject/Focus", "content": "WhatsApp or email text for Day 3" },
    { "day": 5, "subject": "Day 5 Subject/Focus", "content": "WhatsApp or email text for Day 5" }
  ],
  "callToAction": "Actionable CTA button text",
  "bestSendingTime": "e.g., Tuesday at 10:00 AM",
  "expectedEngagement": {
    "ctrPercent": 12.4,
    "optOutPercent": 0.4,
    "estimatedRoiMultiplier": 4.5
  }
}`

    const prompt = `Create a campaign strategy based on the following inputs:
- Campaign Objective: ${objective}
- Campaign Category: ${category}
- Target Audience Segment: ${targetAudience}
- Media Preference: ${mediaPreference}
- Offer Details: ${offerDetails}`

    const aiResponse = await provider.chat({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt,
      temperature: 0.7,
      maxTokens: 2048,
    })

    // Clean markdown wrapper backticks if they are returned by the model
    let cleanText = aiResponse.content.trim()
    if (cleanText.startsWith('```')) {
      // Remove starting ```json or ``` and ending ```
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    }

    let parsedStrategy
    try {
      parsedStrategy = JSON.parse(cleanText)
    } catch (e) {
      console.error('[AI/generateCampaign] Failed to parse JSON from AI response:', cleanText, e)
      // Fallback response structure
      parsedStrategy = {
        strategyName: `AI-Optimized ${category} Campaign`,
        whatsappCopy: `Hi there! We have an exciting update regarding: ${objective}. Check it out!`,
        emailSubject: `Exclusive Update: ${objective}`,
        emailCopy: `<p>Hello,</p><p>We are thrilled to share an exclusive update with you: ${objective}</p><p>Best regards,</p>`,
        landingHeadline: `Unlock the Power of ${objective}`,
        landingBody: `Maximize your results with our advanced marketing systems.`,
        suggestedOffers: [offerDetails],
        dripSequence: [
          { day: 1, subject: 'Welcome', content: `Introducing our latest details on ${objective}.` }
        ],
        callToAction: 'Learn More Now',
        bestSendingTime: 'Wednesday at 11:00 AM',
        expectedEngagement: {
          ctrPercent: 8.5,
          optOutPercent: 0.6,
          estimatedRoiMultiplier: 2.8
        }
      }
    }

    // Save generated strategy to MongoDB
    const targetCampaignId = campaignId || `temp_campaign_${Date.now()}`
    await aiDataRepo.saveCampaignStrategy(targetCampaignId, userId, parsedStrategy)
    await aiDataRepo.saveMarketingPredictions(targetCampaignId, parsedStrategy.expectedEngagement)

    return NextResponse.json({
      success: true,
      campaignId: targetCampaignId,
      strategy: parsedStrategy,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/marketing/campaigns/generate] Strategy generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
