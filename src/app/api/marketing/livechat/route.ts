import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/services/ai/orchestrator'
import { searchKnowledge } from '@/services/knowledge/embeddings'
import { contactRepo, conversationRepo, messageRepo, dealRepo, meetingRepo, quotationRepo, proposalRepo, pipelineRepo, leadScoreRepo, syncRepo, aiRouterRepo, knowledgeRepo, memoryRepo, aiDataRepo } from '@/repositories';

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = (await request.json().catch(() => null)) as {
      organizationId?: string
      contactId?: string
      name?: string
      email?: string
      phone?: string
      message?: string
      wantsHuman?: boolean
    } | null

    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { organizationId, contactId, name, email, phone, message, wantsHuman = false } = body

    // 1. Resolve workspace owner user_id
    let ownerId = organizationId
    if (!ownerId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        ownerId = user.id
      } else {
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
      let contactQuery = supabase.from('contacts').select('id').eq('user_id', ownerId)
      if (email) {
        contactQuery = contactQuery.eq('email', email)
      } else if (phone) {
        contactQuery = contactQuery.eq('phone', phone)
      }

      const { data: existingContact } = await contactQuery.limit(1).maybeSingle()
      if (existingContact) {
        finalContactId = existingContact.id
      }
    }

    // Create guest contact if none exists
    if (!finalContactId) {
      const guestName = name || (email ? email.split('@')[0] : `Guest-${Math.floor(1000 + Math.random() * 9000)}`)
      const { data: guestContact, error: insertErr } = await supabase
        .from('contacts')
        .insert({
          user_id: ownerId,
          name: guestName,
          email: email || null,
          phone: phone || null,
          lead_source: 'Live Chat',
          tags: ['Live Chat', 'Website Lead'],
          marketing_opt_in: true,
        })
        .select()
        .single()

      if (insertErr) {
        throw insertErr
      }
      if (guestContact) {
        finalContactId = guestContact.id
        
        // Log customer journey stage as qualified / lead
        await supabase.from('customer_journeys').insert({
          user_id: ownerId,
          contact_id: finalContactId,
          stage: 'lead',
          notes: 'Created via Website Live Chat widget'
        })
      }
    }

    if (!finalContactId) {
      return NextResponse.json({ error: 'Failed to resolve or create contact' }, { status: 500 })
    }

    // 3. Resolve or create livechat conversation
    let conversation = null
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('contact_id', finalContactId)
      .eq('channel', 'livechat')
      .limit(1)
      .maybeSingle()

    if (existingConv) {
      conversation = existingConv
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          user_id: ownerId,
          contact_id: finalContactId,
          channel: 'livechat',
          status: 'open',
        })
        .select()
        .single()

      if (convErr) throw convErr
      conversation = newConv
    }

    const conversationId = conversation.id

    // 4. Handle Human Takeover Request
    if (wantsHuman) {
      // Mark conversation as pending human takeover
      await supabase
        .from('conversations')
        .update({
          status: 'pending',
          last_message_text: 'Requested human agent takeover.',
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId)

      // Add a system bot message
      const takeoverMsg = 'Understood! I am notifying a human support representative to join this chat. They will be with you shortly.'
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'bot',
        content_type: 'text',
        content_text: takeoverMsg,
        message_id: `livechat_takeover_${Date.now()}`,
        status: 'sent',
      })

      // Update AI Conversation in MongoDB Atlas
      await aiDataRepo.upsertAIConversation(conversationId, {
        organizationId: ownerId,
        aiActive: false,
        handedOffAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        conversationId,
        contactId: finalContactId,
        reply: takeoverMsg,
        handedOff: true,
      })
    }

    if (!message) {
      return NextResponse.json({ error: 'message is required for query' }, { status: 400 })
    }

    // 5. Ingest Visitor's Message in Supabase
    const visitorMsgId = `livechat_visitor_${Date.now()}`
    const { error: visitorMsgErr } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'contact',
      content_type: 'text',
      content_text: message,
      message_id: visitorMsgId,
      status: 'read',
    })
    if (visitorMsgErr) throw visitorMsgErr

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_text: message,
        last_message_at: new Date().toISOString(),
        unread_count: 1,
      })
      .eq('id', conversationId)

    // 6. RAG Knowledge Base Search
    const searchResults = await searchKnowledge(ownerId, message, {
      threshold: 0.65,
      topK: 3,
    })

    const contextText = searchResults.length > 0
      ? searchResults.map((chunk, index) => `[Source ${index + 1}: ${chunk.source}]\n${chunk.content}`).join('\n\n')
      : 'No relevant catalog or price list items found.'

    // 7. Call NVIDIA AI to draft RAG-backed response
    const provider = getAIProvider()
    
    const systemPrompt = `You are a premium, expert AI Live Chat assistant representing our enterprise.
Your goal is to answer visitor questions accurately, helpfully, and professionally.
You MUST rely strictly on the provided RAG Context for pricing, rates, and package details. Do NOT invent prices or details that are not in the context.
For example, if the context lists E-commerce portal package pricing as ₹90,000, state that price exactly.
If the query asks about pricing but it is not in the context, politely say that a human representative will provide a custom quote, and offer to notify them.
Keep your response concise, engaging, and friendly (use a few emojis where appropriate). Do not include any HTML or markdown formatting other than paragraphs.`

    const prompt = `Visitor Query: "${message}"

RAG Context:
${contextText}

Draft a helpful response to the visitor:`

    const aiResponse = await provider.chat({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt,
      temperature: 0.5,
      maxTokens: 800,
    })

    const replyText = aiResponse.content.trim()

    // 8. Ingest Bot Reply in Supabase
    const botMsgId = `livechat_bot_${Date.now()}`
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'bot',
      content_type: 'text',
      content_text: replyText,
      message_id: botMsgId,
      status: 'sent',
    })

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_text: replyText,
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      })
      .eq('id', conversationId)

    // Save AI Conversation in MongoDB Atlas
    await aiDataRepo.upsertAIConversation(conversationId, {
      organizationId: ownerId,
      aiActive: true,
      handedOffAt: null,
    })

    // Log Sentiment Analysis to MongoDB Atlas
    await aiDataRepo.logSentimentAnalysis({
      organizationId: ownerId,
      contactId: finalContactId,
      conversationId,
      text: message,
      intent: 'question',
      sentiment: 'neutral',
      language: 'en',
      wantsHuman: false,
    })

    return NextResponse.json({
      success: true,
      conversationId,
      contactId: finalContactId,
      reply: replyText,
      handedOff: false,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[api/marketing/livechat] Live Chat error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

