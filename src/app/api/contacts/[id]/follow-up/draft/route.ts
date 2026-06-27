import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contactRepo, conversationRepo, messageRepo, dealRepo, meetingRepo, quotationRepo, proposalRepo, pipelineRepo, leadScoreRepo, syncRepo, aiRouterRepo, knowledgeRepo, memoryRepo, aiDataRepo } from '@/repositories';
import { tryGetAIProvider } from '@/services/ai/orchestrator';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { id: contactId } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const { triggerType } = body;

    if (!triggerType) {
      return NextResponse.json({ error: 'Missing triggerType' }, { status: 400 });
    }

    // 1. Verify contact ownership
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contact.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch context (recent messages, active deals)
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();

    const [recentMessages, activeDeals] = await Promise.all([
      conversation
        ? messageRepo.getRecentMessages(conversation.id, 10).catch(() => [])
        : Promise.resolve([]),
      supabase
        .from('deals')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }),
    ]);

    const messagesText = recentMessages
      .slice(0, 10)
      .reverse()
      .map((m: any) => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content_text || ''}`)
      .join('\n');

    const activeDeal = activeDeals.data && activeDeals.data.length > 0 ? activeDeals.data[0] : null;

    // 3. Draft the follow-up message using NVIDIA AI
    let draftedMessage = `Hi ${contact.name || 'there'},\n\nJust following up to see if you had a chance to review our previous message. Let us know if you have any questions!\n\nBest regards,\nMaaJanki Web Tech`;

    const routerConfig = await aiRouterRepo.getByUserId(userId);
    const activeProviderName = routerConfig?.ai_provider || 'nvidia';
    const provider = tryGetAIProvider(activeProviderName);

    if (provider) {
      try {
        const systemPrompt = `
You are the Enterprise AI Follow-up Message Drafter for MaaJanki Web Tech.
Compose a highly professional, polite, and persuasive follow-up WhatsApp message.
Your output must consist ONLY of the direct message copy to be sent to the customer.
Do not include subject lines, placeholders like [Your Name], greetings like "Here is your message:", or markdown wrappers. Keep it natural, warm, and ready to send.
`;

        let contextDescription = '';
        if (triggerType === 'proposal_sent') {
          contextDescription = 'The client was sent a project proposal 2 days ago and has not responded yet. Follow up to see if they reviewed it and ask if they would like to schedule a quick sync call.';
        } else if (triggerType === 'quotation_sent') {
          contextDescription = `The client was sent a commercial quotation for INR ${activeDeal ? Number(activeDeal.value).toLocaleString() : 'their project'} 3 days ago. Offer a brief check-in to clarify any line items or offer a package discount.`;
        } else if (triggerType === 'payment_pending') {
          contextDescription = 'An invoice or payment request is pending. Send a polite reminder about the payment link, emphasizing that we are ready to initiate/continue development once processed.';
        } else if (triggerType === 'meeting_completed') {
          contextDescription = 'A consultation call was completed recently. Thank them for their time, request feedback, and mention that we are preparing their proposal/quotation.';
        } else if (triggerType === 'lost_lead') {
          contextDescription = 'A lead that was marked as lost 30 days ago. Send a very gentle, low-pressure reconnection message checking if they have any new requirements or if their project needs have changed.';
        } else {
          contextDescription = 'No response received for a few days. Send a warm, helpful nudge checking if they need any assistance.';
        }

        const prompt = `
Draft a WhatsApp follow-up message for:
Customer Name: ${contact.name || 'Client'}
Company: ${contact.company || 'Their Business'}
Project Interest: ${activeDeal ? activeDeal.title : 'Web Development'}

Trigger Context:
${contextDescription}

Recent Chat Logs:
${messagesText || 'No recent chat history.'}

Compose a concise, impactful WhatsApp message. Use spacing and paragraphs. Avoid any brackets or templates.
`;

        const response = await provider.chat({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: systemPrompt,
          maxTokens: 512,
          temperature: 0.7, // Higher temperature for rich persuasive copy
          options: routerConfig?.model ? { model: routerConfig.model } : { model: 'meta/llama-3.1-405b-instruct' },
        });

        draftedMessage = response.content.trim();
      } catch (aiErr) {
        console.error('[Follow-up Drafter API] AI generation failed:', aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      draft: draftedMessage,
    });
  } catch (err: any) {
    console.error('[Follow-up Drafter API] fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
