import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contactRepo, conversationRepo, messageRepo, dealRepo, meetingRepo, quotationRepo, proposalRepo, pipelineRepo, leadScoreRepo, syncRepo, aiRouterRepo, knowledgeRepo, memoryRepo, aiDataRepo } from '@/repositories';
import { tryGetAIProvider } from '@/services/ai/orchestrator';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const contactId = resolvedParams.id;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { serviceRequired, customInstructions } = body;

    // 1. Verify contact existence and ownership
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

    // 2. Fetch associated conversation and context details
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();

    const [recentMessages, contactNotes, activeDeals] = await Promise.all([
      conversation
        ? messageRepo.getRecentMessages(conversation.id, 20).catch(() => [])
        : Promise.resolve([]),
      supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(res => res.data || []),
      supabase
        .from('deals')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }),
    ]);

    const messagesText = recentMessages
      .slice(0, 20)
      .reverse()
      .map((m: any) => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content_text || ''}`)
      .join('\n');

    const notesText = contactNotes
      .map((n: any) => `- ${n.note_text}`)
      .join('\n');

    const inferredService = serviceRequired || 
      (activeDeals.data && activeDeals.data.length > 0 ? activeDeals.data[0].title : 'Web Application Development');

    // 3. Draft the Proposal using NVIDIA AI
    let proposalData = {
      companyIntroduction: 'MaaJanki Web Tech is a premier digital technology agency providing end-to-end web, mobile, and automation solutions.',
      problemStatement: 'The client requires a high-performance web presence and automated CRM system to optimize operations.',
      solution: 'An enterprise-grade Next.js development integrated with a customized Supabase backend and WhatsApp automation.',
      deliverables: ['Custom Next.js Frontend', 'Supabase Database Integration', 'WhatsApp Cloud API Setup', 'Admin Dashboard Panel'],
      technologyStack: ['Next.js', 'React.js', 'Supabase', 'MongoDB Atlas', 'NVIDIA AI NIMs'],
      timeline: '4 to 6 weeks',
      pricing: 'INR 1,20,000 + GST (18%)',
      support: '1 year of hosting, security patches, and basic technical maintenance.',
      terms: '50% advance payment, 30% on milestone completion, 20% on final deployment.',
      nextSteps: 'Review and sign this digital proposal contract. A kickoff call will be scheduled within 24 hours of signature.',
    };

    const routerConfig = await aiRouterRepo.getByUserId(userId);
    const activeProviderName = routerConfig?.ai_provider || 'nvidia';
    const provider = tryGetAIProvider(activeProviderName);

    if (provider) {
      try {
        const systemPrompt = `
You are the Enterprise AI Proposal Generator for MaaJanki Web Tech (a premier software development and digital agency).
Draft a highly professional, comprehensive, and convincing B2B sales proposal.
You must return a valid, parsable JSON object matching the exact format specified below.
Do not output any markdown codeblock backticks (like \`\`\`json) or conversational filler.
`;

        const prompt = `
Generate a professional agency proposal for:
Customer: ${contact.name || 'Client'}
Company: ${contact.company || 'Their Company'}
Industry: ${contact.industry || 'Business'}
Required Service: ${inferredService}

Contextual Data:
- Recent Messages:
${messagesText || 'No conversation logged.'}
- Internal Notes:
${notesText || 'No staff notes.'}

${customInstructions ? `Additional Agent Instructions:\n${customInstructions}\n` : ''}

Generate a rich B2B proposal and return EXACTLY this JSON structure:
{
  "companyIntroduction": "<professional company overview of MaaJanki Web Tech>",
  "problemStatement": "<rich analysis of the client's current problems, bottlenecks, and needs>",
  "solution": "<highly detailed, customized solution architecture resolving their pain points>",
  "deliverables": ["<deliverable 1>", "<deliverable 2>", "<deliverable 3>", "<deliverable 4>"],
  "technologyStack": ["<tech 1>", "<tech 2>", "<tech 3>"],
  "timeline": "<in-depth phase-wise timeline, e.g., Phase 1: Planning (1 Week), Phase 2: Development (3 Weeks)...>",
  "pricing": "<formal pricing structure matching their scale, e.g., INR 1,50,000 + 18% GST>",
  "support": "<maintenance, SLA agreements, and support details>",
  "terms": "<standard payment terms and general conditions>",
  "nextSteps": "<clear description of how the client should proceed, including digital signature>"
}
`;

        const response = await provider.chat({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: systemPrompt,
          maxTokens: 2048,
          temperature: 0.3,
          options: routerConfig?.model ? { model: routerConfig.model } : { model: 'meta/llama-3.1-405b-instruct' },
        });

        const cleaned = response.content
          .replace(/```json/i, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        if (parsed && parsed.solution) {
          proposalData = parsed;
        }
      } catch (aiErr) {
        console.error('[Proposals API] AI generation failed, using standard proposal:', aiErr);
      }
    }

    // 4. Save draft in MongoDB Atlas
    try {
      await aiDataRepo.saveProposalDraft(contactId, userId, proposalData);
    } catch (mongoErr) {
      console.error('[Proposals API] MongoDB save failed:', mongoErr);
    }

    // 5. Register in Supabase proposal_requests
    const { data: proposalRequest, error: dbError } = await supabase
      .from('proposal_requests')
      .insert({
        user_id: userId,
        contact_id: contactId,
        conversation_id: conversation?.id || null,
        service_required: inferredService,
        details: proposalData,
        status: 'generated',
      })
      .select('*')
      .single();

    if (dbError) {
      throw dbError;
    }

    // 6. Automatically log action in contact timeline / update AI Memory
    try {
      await memoryRepo.updateContactMemory(userId, contactId, {
        facts: {
          last_proposal_service: inferredService,
          proposal_generated_at: new Date().toISOString(),
        },
        totalInteractions: 1,
      });
    } catch (memErr) {
      console.warn('[Proposals API] Failed to update AI memory:', memErr);
    }

    return NextResponse.json({
      success: true,
      proposal: proposalRequest,
    });
  } catch (err: any) {
    console.error('[Proposals API] fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
