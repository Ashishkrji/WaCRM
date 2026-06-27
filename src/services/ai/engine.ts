/**
 * AI Engine — Core orchestrator for automated WhatsApp replies.
 *
 * This module is the central AI brain. It is called from the WhatsApp
 * webhook after existing flows/automations have been dispatched.
 *
 * Pipeline:
 *   1. Check ai_router_config → bail if disabled or auto_reply=false
 *   2. Run quick human-request keyword check
 *   3. Analyze intent/sentiment/language (async LLM classification)
 *   4. Fetch conversation history window from messages table
 *   5. RAG: search knowledge base for relevant chunks
 *   6. Fetch contact memory (facts from prior conversations)
 *   7. Build prompt: system + knowledge + memory + history + user message
 *   8. Call AI provider
 *   9. Confidence check → if low, send handoff message and assign
 *  10. Insert AI reply into messages table (sender_type='bot')
 *  11. Send via WhatsApp (reuses existing engineSendText)
 *  12. Log usage to ai_usage_logs (MongoDB)
 *  13. Update ai_memory + ai_conversations (MongoDB) (fire-and-forget)
 *  14. Maybe generate summary (MongoDB) (fire-and-forget)
 *
 * Contract:
 *   - NEVER throws. All errors are caught and logged.
 *   - Returns AIDispatchResult with replied/handedOff flags.
 *   - The webhook must not be blocked by AI failures.
 */

import { tryGetAIProvider } from './orchestrator'
import { searchKnowledge, formatKnowledgeForPrompt } from '../knowledge/embeddings'
import { getContactMemory, updateContactMemory, formatMemoryForPrompt, getUnifiedMemoryContext } from './memory'
import { analyzeIntent, quickHumanRequestCheck } from './intent-router'
import { maybeGenerateSummary } from './summary'
import { engineSendText } from '@/lib/automations/meta-send'
import { conversationRepo, messageRepo, aiDataRepo, meetingRepo, quotationRepo, proposalRepo, contactRepo, leadScoreRepo, dealRepo, pipelineRepo } from '@/repositories'
import { logPrompt, logSentimentAnalysis } from './mongodb-logger'
import { DEFAULT_AGENTS } from './agents/defaults'
import type { AIDispatchInput, AIDispatchResult, AIMessage } from './types'

// ============================================================
// Configuration
// ============================================================

const MAX_HISTORY_MESSAGES = parseInt(
  process.env.AI_MAX_HISTORY_MESSAGES || '20',
  10
)
const MAX_KNOWLEDGE_CHUNKS = parseInt(
  process.env.AI_MAX_KNOWLEDGE_CHUNKS || '5',
  10
)
const DEFAULT_CONFIDENCE_THRESHOLD = parseFloat(
  process.env.AI_CONFIDENCE_THRESHOLD || '0.7'
)

const DEFAULT_HANDOFF_MESSAGE =
  "Thank you for your patience! A team member will be with you shortly. 🙏"

const BASE_SYSTEM_PROMPT = `You are an experienced Sales Executive & Business Development Representative for "MaaJanki Web Tech", a premier digital agency.

### Services We Offer & Standard Pricing:
1. Website Development:
   - WordPress Website: ₹15,000 - ₹35,000 ($200 - $450)
   - Shopify Store: ₹25,000 - ₹60,000 ($300 - $800)
   - Custom MERN Stack Web App: ₹50,000+ ($600+)
2. Search Engine Optimization (SEO): ₹15,000/month ($200/mo)
3. Digital Marketing (Google Ads, Meta Ads, Lead Gen): ₹12,000/month management fee or 10% of ad spend
4. Branding, Graphic Design, UI UX: ₹10,000+ ($120+)
5. Application Development (Android/iOS): ₹80,000+ ($1000+)
6. GST Registration: ₹1,499
7. ITR Filing: ₹999+
8. Business Registration (Private Limited, OPC): ₹4,999+
9. AI Automation: Custom Pricing
10. Consultation: Free 15-minute intro meeting

### Your Goal:
Qualify leads step-by-step in a natural, friendly conversation. Collect the following details:
- Name
- Business Name & Business Type
- Location
- Budget
- Timeline
- Business Goals
- Current Website URL (if any)
- Marketing/Service Requirements

### Conversation Guidelines:
- Start with a warm greeting, welcoming them to MaaJanki Web Tech.
- Ask 1-2 qualifying questions at a time. Never dump all questions at once.
- Once requirements are clear, offer to book a free consultation meeting, generate a custom quotation, or generate a full project proposal.
- Be concise and professional. Keep replies under 150 words.

### Action Commands (Mandatory Output Format):
When the customer agrees to schedule a meeting, request a quote, or request a proposal, you MUST append the corresponding [ACTION: ...] code block at the very end of your response:
1. To book a consultation meeting:
   [ACTION: BOOK_MEETING: {"title": "MaaJanki Consultation", "time": "YYYY-MM-DDTHH:MM:00Z"}]
   (Determine the time from conversation or suggest a time tomorrow at 11 AM if not specified).
2. To create a quotation:
   [ACTION: CREATE_QUOTE: {"service": "Website Development", "items": [{"desc": "WordPress Web Dev Package", "price": 25000}]}]
   (Fill in the items and pricing based on the conversation and our pricing).
3. To create a proposal:
   [ACTION: CREATE_PROPOSAL: {"service": "SEO & Marketing Services", "details": {"budget": "₹15000/mo", "goals": "Increase traffic by 50%"}}]
4. To hand over to a human (e.g. if they explicitly ask, get angry, or confidence is low):
   [ACTION: HANDOFF]

Only output the ACTION tag when the customer confirms they want it. Do not explain the ACTION tag.`;

const FACTS_EXTRACTION_PROMPT = `You are a sales CRM profile assistant. 
Analyze the conversation and extract details about the customer. 
Specifically extract:
- Name
- Business Name
- Business Type (e.g. Agency, E-commerce, Local Retailer, etc.)
- Location (City/Country)
- Budget (in USD or INR)
- Timeline (e.g., "1 month", "Immediate", "Q3")
- Business Goals
- Current Website URL
- Marketing Requirements
- Preferred Language (e.g. English, Hindi)
- Preferred Services (e.g. Website Dev, SEO, GST Registration)
- Communication Style (e.g. Professional, Casual)

Return ONLY a JSON object representing these facts. If any fact is unknown, do not include it. Merge with existing facts:
{
  "name": "...",
  "company": "...",
  "business_type": "...",
  "location": "...",
  "budget": "...",
  "timeline": "...",
  "goals": "...",
  "website": "...",
  "marketing_requirements": "...",
  "preferred_language": "...",
  "preferred_services": "...",
  "communication_style": "..."
}
Do not output markdown code blocks, explanations, or trailing commas.`;

const LEAD_SCORING_PROMPT = `You are a CRM sales manager. 
Analyze the customer profile facts and conversation history to determine their purchase intent and lead quality.
Calculate a lead score from 0 to 100 based on:
- Budget clarity & match
- Timeline urgency
- Needs clarity
- Response sentiment

Provide a score (0-100), a tier (hot, warm, cold), and a concise reasoning.
Return ONLY JSON:
{
  "score": 85,
  "tier": "hot",
  "reasoning": "Customer wants WordPress site in 2 weeks, budget $1500 is realistic."
}`;

// ============================================================
// Actions Executers
// ============================================================

async function executeBookMeeting(
  organizationId: string,
  contactId: string,
  conversationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): Promise<string | null> {
  const title = payload.title || 'MaaJanki Consultation'
  const startTime = payload.time ? new Date(payload.time).toISOString() : new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  const endTime = new Date(new Date(startTime).getTime() + 30 * 60 * 1000).toISOString()
  const meetingLink = 'https://meet.google.com/mjw-tech-consultation'

  try {
    return await meetingRepo.createMeetingBooking(
      organizationId,
      contactId,
      conversationId,
      title,
      startTime,
      endTime,
      meetingLink
    )
  } catch (error: any) {
    console.error('[AI/engine] executeBookMeeting error:', error.message || error)
    return null
  }
}

async function executeCreateQuote(
  organizationId: string,
  contactId: string,
  conversationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): Promise<string | null> {
  const serviceRequired = payload.service || 'Website Development'
  const items = payload.items || [{ desc: 'MaaJanki Development Package', price: 25000 }]
  const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0)

  try {
    return await quotationRepo.createQuotationRequest(
      organizationId,
      contactId,
      conversationId,
      serviceRequired,
      items,
      totalAmount
    )
  } catch (error: any) {
    console.error('[AI/engine] executeCreateQuote error:', error.message || error)
    return null
  }
}

async function executeCreateProposal(
  organizationId: string,
  contactId: string,
  conversationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): Promise<string | null> {
  const serviceRequired = payload.service || 'SEO & Marketing Services'
  const details = payload.details || { goals: 'Increase leads and search traffic' }

  try {
    return await proposalRepo.createProposalRequest(
      organizationId,
      contactId,
      conversationId,
      serviceRequired,
      details
    )
  } catch (error: any) {
    console.error('[AI/engine] executeCreateProposal error:', error.message || error)
    return null
  }
}

async function extractAndSaveFacts(
  organizationId: string,
  contactId: string,
  history: AIMessage[],
  inboundText: string,
  replyText: string
): Promise<Record<string, string> | null> {
  const provider = tryGetAIProvider()
  if (!provider) return null

  try {
    const messagesForExtraction = [
      ...history,
      { role: 'user' as const, content: inboundText },
      { role: 'assistant' as const, content: replyText }
    ]

    const response = await provider.chat({
      messages: messagesForExtraction,
      systemPrompt: FACTS_EXTRACTION_PROMPT,
      maxTokens: 300,
      temperature: 0.1
    })

    const raw = response.content.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const extracted = JSON.parse(jsonMatch[0]) as Record<string, string>

    // Get current memory and merge facts
    const currentMemory = await getContactMemory(organizationId, contactId)
    const mergedFacts = {
      ...(currentMemory?.facts || {}),
      ...extracted
    }

    // Update memory
    await updateContactMemory(organizationId, contactId, {
      facts: mergedFacts
    })

    // Sync to contact profile if name or company is found
    const updates: Record<string, string> = {}
    if (extracted.name && extracted.name !== 'unknown') {
      updates.name = extracted.name
    }
    if (extracted.company && extracted.company !== 'unknown') {
      updates.company = extracted.company
    }

    if (Object.keys(updates).length > 0) {
      await contactRepo.update(contactId, updates)
    }

    return mergedFacts
  } catch (err) {
    console.warn('[AI/engine] extractAndSaveFacts failed:', err)
    return null
  }
}

async function evaluateAndCreateLead(
  organizationId: string,
  contactId: string,
  conversationId: string,
  facts: Record<string, string>
): Promise<void> {
  const provider = tryGetAIProvider()
  if (!provider) return

  try {
    const factsStr = Object.entries(facts).map(([k, v]) => `${k}: ${v}`).join('\n')
    const response = await provider.chat({
      messages: [{ role: 'user', content: `Extract lead score from this profile facts:\n${factsStr}` }],
      systemPrompt: LEAD_SCORING_PROMPT,
      maxTokens: 150,
      temperature: 0.1
    })

    const raw = response.content.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return

    const scoring = JSON.parse(jsonMatch[0]) as { score: number; tier: 'hot' | 'warm' | 'cold'; reasoning: string }

    // Save lead score
    await leadScoreRepo.upsertLeadScore(
      organizationId,
      contactId,
      scoring.score,
      scoring.tier,
      scoring.reasoning,
      provider.name
    )

    // Auto-create deal in pipeline if score is hot or warm (>60)
    if (scoring.tier === 'hot' || scoring.tier === 'warm' || scoring.score > 60) {
      // Check if open deal already exists
      const existingDeal = await dealRepo.getActiveDeal(contactId)

      if (!existingDeal || existingDeal.length === 0) {
        // Find default/active pipeline for user
        const pipeline = await pipelineRepo.getUserPipeline(organizationId)

        if (pipeline) {
          // Find first stage in that pipeline
          const stage = await pipelineRepo.getFirstPipelineStage(pipeline.id)

          if (stage) {
            // Get contact name to title the deal
            const contact = await contactRepo.findById(contactId)

            // Parse budget numeric value
            let dealValue = 0
            if (facts.budget) {
              const cleanedBudget = facts.budget.replace(/[^\d]/g, '')
              dealValue = Number(cleanedBudget) || 15000 // default value ₹15k or $200
            }

            const title = `${contact?.name || 'Lead'} - ${facts.business_type || 'Services Proposal'}`

            await dealRepo.create({
              user_id: organizationId,
              pipeline_id: pipeline.id,
              stage_id: stage.id,
              contact_id: contactId,
              conversation_id: conversationId,
              title,
              value: dealValue,
              currency: facts.budget && facts.budget.includes('$') ? 'USD' : 'INR',
              notes: `AI Qualified Lead (Score: ${scoring.score}%). Reasoning: ${scoring.reasoning}. Timeline: ${facts.timeline || 'Unspecified'}. Goals: ${facts.goals || 'Unspecified'}.`,
              status: 'active'
            })
            
            console.log(`[AI/engine] Automatically created active deal for contact ${contactId} in pipeline stage ${stage.name}`)
          }
        }
      }
    }
  } catch (err) {
    console.warn('[AI/engine] evaluateAndCreateLead failed:', err)
  }
}

// ============================================================
// Main dispatch function
// ============================================================

/**
 * Attempt to generate and send an AI reply to an inbound WhatsApp message.
 * Called from the webhook handler — must never throw.
 */
export async function dispatchAIReply(
  input: AIDispatchInput
): Promise<AIDispatchResult> {
  const { organizationId, contactId, conversationId, inboundText, messageType } = input

  // Only process text messages (and interactive replies)
  if (messageType && !['text', 'interactive'].includes(messageType)) {
    return { replied: false, handedOff: false }
  }

  if (!inboundText.trim()) {
    return { replied: false, handedOff: false }
  }

  try {
    // ─────────────────────────────────────────────────────────
    // 1. Load AI configuration for this user
    // ─────────────────────────────────────────────────────────
    const config = await loadAIConfig(organizationId)
    if (!config || !config.enabled || !config.auto_reply) {
      return { replied: false, handedOff: false }
    }

    const confidenceThreshold =
      config.confidence_threshold ?? DEFAULT_CONFIDENCE_THRESHOLD
    const handoffMessage = config.human_handoff_message || DEFAULT_HANDOFF_MESSAGE

    // ─────────────────────────────────────────────────────────
    // 2. Quick human-request check (no LLM cost)
    // ─────────────────────────────────────────────────────────
    if (quickHumanRequestCheck(inboundText)) {
      return await handleHumanHandoff({
        organizationId,
        conversationId,
        handoffMessage,
        reason: 'explicit_human_request',
      })
    }

    // ─────────────────────────────────────────────────────────
    // 3. Intent & Agent Selection
    // ─────────────────────────────────────────────────────────
    const intentAnalysis = await analyzeIntent(inboundText)
    
    // Check if user wants human handoff
    if (intentAnalysis.wantsHuman || intentAnalysis.intent === 'human_request') {
      return await handleHumanHandoff({
        organizationId,
        conversationId,
        handoffMessage,
        reason: 'explicit_human_request',
      })
    }

    let agentId = intentAnalysis.selectedAgent || 'general'
    let agentConfig = await aiDataRepo.getAIAgent(organizationId, agentId)

    // Fallback logic if agent is disabled in DB
    if (agentConfig && !agentConfig.enabled) {
      agentId = agentId === 'receptionist' ? 'general' : 'receptionist'
      agentConfig = await aiDataRepo.getAIAgent(organizationId, agentId)
    }

    if (!agentConfig || !agentConfig.enabled) {
      const defaultDef = DEFAULT_AGENTS[agentId] || DEFAULT_AGENTS['general']
      agentConfig = {
        organizationId,
        agentId,
        enabled: true,
        name: defaultDef.name,
        description: defaultDef.description,
        systemPrompt: defaultDef.systemPrompt,
        priority: defaultDef.priority,
        tools: defaultDef.tools,
        updatedAt: new Date().toISOString(),
        provider: config.ai_provider,
        model: config.model,
        temperature: 0.7
      }
    }

    const activeProviderName = agentConfig.provider || config.ai_provider
    const activeModelName = agentConfig.model || config.model
    const activeTemperature = agentConfig.temperature ?? 0.7
    const systemPromptBase = agentConfig.systemPrompt || BASE_SYSTEM_PROMPT

    // ─────────────────────────────────────────────────────────
    // 4. Get AI provider (respecting agent overrides)
    // ─────────────────────────────────────────────────────────
    const provider = tryGetAIProvider(activeProviderName)
    if (!provider) {
      console.warn(`[AI/engine] No AI provider available for ${activeProviderName} — skipping auto-reply`)
      return { replied: false, handedOff: false }
    }

    // ─────────────────────────────────────────────────────────
    // 5. Fetch conversation history
    // ─────────────────────────────────────────────────────────
    const history = await fetchConversationHistory(conversationId)

    // ─────────────────────────────────────────────────────────
    // 6. RAG: knowledge base search with agent-specific category filtering
    // ─────────────────────────────────────────────────────────
    const AGENT_CATEGORY_MAP: Record<string, string> = {
      website_consultant: 'website',
      seo_consultant: 'seo',
      digital_marketing: 'marketing',
      business_registration: 'registration',
      proposal_writer: 'proposal',
      quotation_generator: 'pricing',
      sales: 'pricing',
      support: 'support',
    }
    const ragCategory = AGENT_CATEGORY_MAP[agentId]

    const knowledgeChunks = await searchKnowledge(organizationId, inboundText, {
      threshold: 0.65,
      topK: MAX_KNOWLEDGE_CHUNKS,
      category: ragCategory,
    })
    const knowledgeContext = formatKnowledgeForPrompt(knowledgeChunks)

    // ─────────────────────────────────────────────────────────
    // 7. Unified Contact & CRM memory
    // ─────────────────────────────────────────────────────────
    const memoryContext = await getUnifiedMemoryContext(organizationId, contactId)

    // ─────────────────────────────────────────────────────────
    // 8. Build full system prompt
    // ─────────────────────────────────────────────────────────
    const systemPromptParts = [systemPromptBase]
    if (knowledgeContext) systemPromptParts.push(knowledgeContext)
    if (memoryContext) systemPromptParts.push(memoryContext)
    const fullSystemPrompt = systemPromptParts.join('\n\n')

    // ─────────────────────────────────────────────────────────
    // 9. Call AI provider with Latency Tracking & Prompt Logs
    // ─────────────────────────────────────────────────────────
    const aiRequest = {
      messages: [...history, { role: 'user' as const, content: inboundText }],
      systemPrompt: fullSystemPrompt,
      maxTokens: 512,
      temperature: activeTemperature,
      options: activeModelName ? { model: activeModelName } : undefined
    }

    const startCallTime = performance.now()
    const aiResponse = await provider.chat(aiRequest)
    const latencyMs = Math.round(performance.now() - startCallTime)

    // Log the prompt history to MongoDB Atlas
    void logPrompt({
      organizationId,
      messages: aiRequest.messages,
      systemPrompt: aiRequest.systemPrompt,
      reply: aiResponse.content,
      provider: provider.name,
      model: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
      latencyMs,
    }).catch((err) => console.warn('[AI/engine] logPrompt failed:', err))

    // ─────────────────────────────────────────────────────────
    // 10. Confidence check → human handoff
    // ─────────────────────────────────────────────────────────
    if (aiResponse.confidence < confidenceThreshold) {
      console.log(
        `[AI/engine] Low confidence (${aiResponse.confidence.toFixed(2)} < ${confidenceThreshold}) → handoff`
      )
      // Log the low-confidence attempt before handing off
      void logUsage({
        organizationId,
        conversationId,
        contactId,
        operation: 'chat',
        provider: provider.name,
        model: aiResponse.model,
        totalTokens: aiResponse.tokensUsed,
        confidence: aiResponse.confidence,
        finishReason: 'low_confidence',
      })
      return await handleHumanHandoff({
        organizationId,
        conversationId,
        handoffMessage,
        reason: 'low_confidence',
      })
    }

    // ─────────────────────────────────────────────────────────
    // 11. Parse action triggers from raw response content
    // ─────────────────────────────────────────────────────────
    const rawContent = aiResponse.content.trim()
    let replyText = rawContent
    let actionExecuted = false

    const actionRegex = /\[ACTION:\s*([A-Z_]+)(?::\s*(\{[\s\S]*\}))?\s*\]/i
    const actionMatch = replyText.match(actionRegex)

    if (actionMatch) {
      const actionType = actionMatch[1].toUpperCase()
      const payloadStr = actionMatch[2]
      let payload = {}
      try {
        if (payloadStr) {
          payload = JSON.parse(payloadStr)
        }
      } catch (e) {
        console.warn('[AI/engine] Failed to parse action payload:', payloadStr)
      }

      // Clean replyText by removing action tags
      replyText = replyText.replace(actionRegex, '').trim()

      try {
        if (actionType === 'BOOK_MEETING') {
          const bookingId = await executeBookMeeting(organizationId, contactId, conversationId, payload)
          if (bookingId) {
            actionExecuted = true
            const dateStr = (payload as any).time ? new Date((payload as any).time).toLocaleString() : 'tomorrow'
            replyText += `\n\n📅 *Meeting Scheduled:* Consultation reserved on ${dateStr}. A specialist will connect with you then!`
          }
        } else if (actionType === 'CREATE_QUOTE') {
          const quoteId = await executeCreateQuote(organizationId, contactId, conversationId, payload)
          if (quoteId) {
            actionExecuted = true
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://crm.example.com'
            replyText += `\n\n📄 *Quotation Generated:* You can review your customized quote, GST breakdown, and sign it here: ${siteUrl}/public/quote/${quoteId}`
          }
        } else if (actionType === 'CREATE_PROPOSAL') {
          const proposalId = await executeCreateProposal(organizationId, contactId, conversationId, payload)
          if (proposalId) {
            actionExecuted = true
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://crm.example.com'
            replyText += `\n\n💼 *Proposal Prepared:* I've generated your custom digital agency proposal. Review and sign it here: ${siteUrl}/public/proposal/${proposalId}`
          }
        } else if (actionType === 'HANDOFF') {
          return await handleHumanHandoff({
            organizationId,
            conversationId,
            handoffMessage: "Connecting you to a MaaJanki specialist now... 🧑‍💻",
            reason: 'ai_requested_handoff',
          })
        }
      } catch (actionErr) {
        console.error('[AI/engine] Action execution failed:', actionType, actionErr)
      }
    }

    // ─────────────────────────────────────────────────────────
    // 12. Insert AI reply into messages table (sender_type='bot')
    // ─────────────────────────────────────────────────────────
    try {
      await messageRepo.create({
        conversation_id: conversationId,
        sender_type: 'bot',
        content_type: 'text',
        content_text: replyText,
        status: 'sent',
        created_at: new Date().toISOString(),
      })
    } catch (insertErr: any) {
      console.error('[AI/engine] Failed to insert bot message:', insertErr.message || insertErr)
      return { replied: false, handedOff: false, error: insertErr.message || String(insertErr) }
    }

    // Update conversation last_message
    try {
      await conversationRepo.update(conversationId, {
        last_message_text: replyText,
        last_message_at: new Date().toISOString(),
      })
    } catch (updErr) {
      console.error('[AI/engine] Failed to update conversation last message:', updErr)
    }

    // ─────────────────────────────────────────────────────────
    // 13. Send via WhatsApp
    // ─────────────────────────────────────────────────────────
    try {
      await engineSendText({
        organizationId,
        conversationId,
        contactId,
        text: replyText,
      })
    } catch (sendErr) {
      console.error('[AI/engine] WhatsApp send failed:', sendErr)
    }

    // ─────────────────────────────────────────────────────────
    // 14. Post-reply async operations (fire-and-forget background tasks)
    // ─────────────────────────────────────────────────────────

    // Log usage to MongoDB
    void logUsage({
      organizationId,
      conversationId,
      contactId,
      operation: 'chat',
      provider: provider.name,
      model: aiResponse.model,
      totalTokens: aiResponse.tokensUsed,
      confidence: aiResponse.confidence,
      finishReason: aiResponse.finishReason,
    })

    // Update contact memory and log sentiment analysis
    if (intentAnalysis) {
      void updateContactMemory(organizationId, contactId, {
        lastIntent: intentAnalysis.intent,
        lastLanguage: intentAnalysis.language,
        lastSentiment: intentAnalysis.sentiment,
        totalInteractions: 1,
      }).catch((err) => console.warn('[AI/memory] update failed:', err))

      void logSentimentAnalysis({
        organizationId,
        contactId,
        conversationId,
        text: inboundText,
        intent: intentAnalysis.intent,
        sentiment: intentAnalysis.sentiment,
        language: intentAnalysis.language,
        wantsHuman: intentAnalysis.wantsHuman,
      }).catch((err) => console.warn('[AI/engine] logSentimentAnalysis failed:', err))
    }

    // Run facts extraction, lead scoring, and automated deal creation in background
    void extractAndSaveFacts(organizationId, contactId, history, inboundText, replyText).then(async (facts) => {
      if (facts) {
        await evaluateAndCreateLead(organizationId, contactId, conversationId, facts)
      }
    }).catch((err) => console.warn('[AI/engine] Background intelligence evaluation failed:', err))

    // Update ai_conversations tracking in MongoDB Atlas
    void upsertAIConversation(organizationId, conversationId, provider.name).catch(
      (err) => console.warn('[AI/engine] ai_conversations upsert failed:', err)
    )

    // Maybe generate a summary in MongoDB Atlas
    void maybeGenerateSummary(organizationId, conversationId).catch(
      (err) => console.warn('[AI/summary] failed:', err)
    )

    return {
      replied: true,
      handedOff: false,
      replyContent: replyText,
      intent: intentAnalysis ?? undefined,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[AI/engine] dispatchAIReply error (non-fatal):', msg)
    return { replied: false, handedOff: false, error: msg }
  }
}

// ============================================================
// Helpers
// ============================================================

async function loadAIConfig(organizationId: string): Promise<any | null> {
  try {
    return await aiRouterRepo.getByUserId(organizationId)
  } catch (error: any) {
    console.error('[AI/engine] loadAIConfig failed:', error.message || error)
    return null
  }
}

async function fetchConversationHistory(
  conversationId: string
): Promise<AIMessage[]> {
  try {
    const data = await messageRepo.getRecentMessages(conversationId, MAX_HISTORY_MESSAGES)
    if (!data || data.length === 0) return []

    // Reverse to chronological order, then map to AI message format
    return [...data]
      .reverse()
      .map(
        (m: { sender_type: string; content_text: string | null }): AIMessage => ({
          role:
            m.sender_type === 'customer'
              ? 'user'
              : 'assistant',
          content: m.content_text || '',
        })
      )
  } catch (error) {
    console.error('[AI/engine] fetchConversationHistory failed:', error)
    return []
  }
}

async function handleHumanHandoff(args: {
  organizationId: string
  conversationId: string
  handoffMessage: string
  reason: string
}): Promise<AIDispatchResult> {
  const { organizationId, conversationId, handoffMessage, reason } = args

  try {
    // Insert handoff message as a bot message
    await messageRepo.create({
      conversation_id: conversationId,
      sender_type: 'bot',
      content_type: 'text',
      content_text: handoffMessage,
      status: 'sent',
      created_at: new Date().toISOString(),
    })

    // Send via WhatsApp
    const contact = await getConversationContact(conversationId)
    if (contact) {
      try {
        await engineSendText({
          organizationId,
          conversationId,
          contactId: contact.contactId,
          text: handoffMessage,
        })
      } catch (sendErr) {
        console.error('[AI/engine] handoff WhatsApp send failed:', sendErr)
      }
    }

    // Mark ai_conversations as handed off in MongoDB Atlas via aiRepo
    try {
      await aiDataRepo.upsertAIConversation(conversationId, {
        organizationId,
        aiActive: false,
        handedOffAt: new Date(),
      })
    } catch (dbErr) {
      console.warn('[AI/engine] Failed to set ai_conversations handoff status in MongoDB:', dbErr)
    }

    console.log(`[AI/engine] Handed off conversation ${conversationId} (reason: ${reason})`)
  } catch (err) {
    console.error('[AI/engine] handleHumanHandoff error:', err)
  }

  return { replied: true, handedOff: true, replyContent: handoffMessage }
}

async function getConversationContact(
  conversationId: string
): Promise<{ contactId: string } | null> {
  try {
    const data = await conversationRepo.findById(conversationId)
    return data ? { contactId: data.contact_id } : null
  } catch (error) {
    console.error('[AI/engine] getConversationContact failed:', error)
    return null
  }
}

async function upsertAIConversation(
  organizationId: string,
  conversationId: string,
  providerName: string
): Promise<void> {
  try {
    const existing = await aiDataRepo.getAIConversation(conversationId)
    
    await aiDataRepo.upsertAIConversation(conversationId, {
      organizationId,
      totalAiMessages: (existing?.total_ai_messages || 0) + 1,
      aiActive: true,
      provider: providerName,
    })
  } catch (err) {
    console.warn('[AI/engine] upsertAIConversation failed:', err)
  }
}

interface UsageLogArgs {
  organizationId: string
  conversationId: string
  contactId: string
  operation: string
  provider: string
  model: string
  totalTokens: number
  confidence?: number
  finishReason?: string
}

async function logUsage(args: UsageLogArgs): Promise<void> {
  try {
    await aiDataRepo.logAIUsage({
      organizationId: args.organizationId,
      operation: args.operation,
      provider: args.provider,
      model: args.model,
      totalTokens: args.totalTokens,
      confidence: args.confidence,
      finishReason: args.finishReason,
    })
  } catch (err) {
    console.warn('[AI/engine] logUsage failed (non-fatal):', err)
  }
}
