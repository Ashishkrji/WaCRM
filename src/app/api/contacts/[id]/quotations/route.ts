import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contactRepo, conversationRepo, messageRepo, dealRepo, meetingRepo, quotationRepo, proposalRepo, pipelineRepo, leadScoreRepo, syncRepo, aiRouterRepo, knowledgeRepo, memoryRepo, aiDataRepo } from '@/repositories';
import { tryGetAIProvider } from '@/services/ai/orchestrator';
import { searchKnowledge, formatKnowledgeForPrompt } from '@/services/knowledge/embeddings';

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

    // 2. Query MongoDB conversation / context
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();

    const [recentMessages, contactNotes, activeDeals] = await Promise.all([
      conversation
        ? messageRepo.getRecentMessages(conversation.id, 15).catch(() => [])
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
      .slice(0, 15)
      .reverse()
      .map((m: any) => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content_text || ''}`)
      .join('\n');

    const notesText = contactNotes
      .map((n: any) => `- ${n.note_text}`)
      .join('\n');

    const inferredService = serviceRequired || 
      (activeDeals.data && activeDeals.data.length > 0 ? activeDeals.data[0].title : 'Enterprise Web Solution');

    // 3. STRICT RAG PRICING FETCH
    // Perform semantic vector search on the knowledge base for pricing lists
    let pricingContextText = '';
    try {
      const pricingChunks = await searchKnowledge(userId, `${inferredService} pricing package catalog fees`, {
        threshold: 0.3, // Lower threshold to ensure we capture any matching rates
        topK: 4,
        category: 'Pricing', // Prioritize pricing documents if categorized
      });
      pricingContextText = formatKnowledgeForPrompt(pricingChunks);
    } catch (ragErr) {
      console.warn('[Quotations API] RAG search failed, relying on system prompt rates:', ragErr);
    }

    // 4. Generate Itemized Quotation using NVIDIA AI
    let quotationData = {
      items: [
        { description: 'Enterprise Website & Dashboard Development (Custom Next.js & Supabase)', quantity: 1, price: 90000 },
        { description: 'WhatsApp Business API Integration & Multi-agent Team Inbox Config', quantity: 1, price: 45000 },
        { description: 'Advanced SEO Setup & Speed Optimization', quantity: 1, price: 15000 },
      ],
      discount: 10000,
      taxRate: 18, // 18% GST standard for IT Services in India
      taxAmount: 25200, // (140000 - 10000) * 18%
      subtotal: 150000,
      totalAmount: 155200, // subtotal - discount + tax
      validityDays: 30,
      paymentTerms: '50% advance to initiate project, 50% upon deployment/handover.',
    };

    const routerConfig = await aiRouterRepo.getByUserId(userId);
    const activeProviderName = routerConfig?.ai_provider || 'nvidia';
    const provider = tryGetAIProvider(activeProviderName);

    if (provider) {
      try {
        const systemPrompt = `
You are the Enterprise AI Quotation Engine for MaaJanki Web Tech (premier IT and Software Development agency).
Your goal is to construct a highly accurate, itemized billing quotation for a customer.
CRITICAL MANDATE: You must NEVER invent or hallucinate pricing figures. You MUST use official company pricing catalog details.
If the retrieved RAG Knowledge Base context does not contain specific rates for the requested service, you MUST strictly adhere to the following official company catalog:
- Basic Website: ₹15,000 (Single-page, HTML/CSS/React, 1-year basic support)
- Standard Dynamic Website: ₹45,000 (Up to 5 pages, custom Next.js/React, CMS, 1-year hosting/support)
- E-commerce Portal: ₹90,000 (Custom Next.js & Shopify/Stripe, up to 100 products, dashboard)
- Enterprise WhatsApp CRM: ₹1,50,000 (Custom WaCRM instance, multi-agent inbox, AI integration)
- Annual Maintenance Contract (AMC): ₹15,000 per year
- Advanced SEO & Marketing: ₹12,000 per month
- Premium Cloud Hosting: ₹8,000 per year

Calculate:
1. Subtotal: Sum of (price * quantity) of all items.
2. Discount: Reasonable package discount if multiple services are bought (e.g. ₹5,000 - ₹15,000 max), or ₹0.
3. Tax Rate: Standard 18% GST for software/agency services.
4. Tax Amount: (Subtotal - Discount) * 0.18.
5. Total Amount: (Subtotal - Discount) + Tax Amount.

You must return a valid, parsable JSON object matching the exact format specified below.
Do not output any markdown codeblocks (like \`\`\`json) or conversational text.
`;

        const prompt = `
Generate an itemized commercial quotation for:
Customer: ${contact.name || 'Client'}
Company: ${contact.company || 'Their Company'}
Required Service: ${inferredService}

Retrieved Pricing Documents from RAG Knowledge Base:
${pricingContextText || 'No specific RAG pricing records found. Adhere strictly to the official catalog.'}

WhatsApp Chats & Notes Context:
${messagesText || 'No conversation history.'}
${notesText || 'No staff notes.'}

${customInstructions ? `Additional Agent Instructions:\n${customInstructions}\n` : ''}

Compile the quotation and return EXACTLY this JSON structure:
{
  "items": [
    {
      "description": "<item description, e.g., Custom E-commerce Development>",
      "quantity": <integer quantity>,
      "price": <numeric unit price matching catalog exactly>
    }
  ],
  "discount": <numeric discount amount, e.g. 5000>,
  "taxRate": 18,
  "taxAmount": <calculated tax amount (subtotal - discount) * 0.18>,
  "subtotal": <calculated subtotal sum>,
  "totalAmount": <calculated grand total (subtotal - discount) + taxAmount>,
  "validityDays": 30,
  "paymentTerms": "<description of payment terms, milestones, and conditions>"
}
`;

        const response = await provider.chat({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: systemPrompt,
          maxTokens: 1024,
          temperature: 0.1, // Low temperature for high billing precision
          options: routerConfig?.model ? { model: routerConfig.model } : { model: 'meta/llama-3.1-405b-instruct' },
        });

        const cleaned = response.content
          .replace(/```json/i, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        if (parsed && parsed.items && parsed.items.length > 0) {
          quotationData = parsed;
        }
      } catch (aiErr) {
        console.error('[Quotations API] AI generation failed, using standard quote:', aiErr);
      }
    }

    // 5. Save draft in MongoDB Atlas
    try {
      await aiDataRepo.saveQuotationDraft(contactId, userId, quotationData);
    } catch (mongoErr) {
      console.error('[Quotations API] MongoDB save failed:', mongoErr);
    }

    // 6. Register in Supabase quotation_requests
    const { data: quotationRequest, error: dbError } = await supabase
      .from('quotation_requests')
      .insert({
        user_id: userId,
        contact_id: contactId,
        conversation_id: conversation?.id || null,
        service_required: inferredService,
        items: quotationData.items,
        total_amount: quotationData.totalAmount,
        status: 'generated',
      })
      .select('*')
      .single();

    if (dbError) {
      throw dbError;
    }

    // 7. Update AI memory of this quotation request
    try {
      await memoryRepo.updateContactMemory(userId, contactId, {
        facts: {
          last_quotation_amount: String(quotationData.totalAmount),
          quotation_generated_at: new Date().toISOString(),
        },
        totalInteractions: 1,
      });
    } catch (memErr) {
      console.warn('[Quotations API] Failed to update AI memory:', memErr);
    }

    return NextResponse.json({
      success: true,
      quotation: quotationRequest,
      fullDraft: quotationData,
    });
  } catch (err: any) {
    console.error('[Quotations API] fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
