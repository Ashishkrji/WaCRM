import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contactRepo, conversationRepo, messageRepo, dealRepo, meetingRepo, quotationRepo, proposalRepo, pipelineRepo, leadScoreRepo, syncRepo, aiRouterRepo, knowledgeRepo, memoryRepo, aiDataRepo } from '@/repositories';
import { tryGetAIProvider } from '@/services/ai/orchestrator';

export async function GET(
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
    // 1. Fetch Contact Details to verify ownership
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

    // 2. Fetch associated conversation messages
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, last_message_text')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();

    const [recentMessages, contactNotes, activeDeals] = await Promise.all([
      conversation
        ? messageRepo.getRecentMessages(conversation.id, 25).catch(() => [])
        : Promise.resolve([]),
      supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(res => res.data || []),
      supabase
        .from('deals')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }),
    ]);

    const messagesText = recentMessages
      .slice(0, 25)
      .reverse()
      .map((m: any) => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content_text || ''}`)
      .join('\n');

    const notesText = contactNotes
      .map((n: any) => `- [${new Date(n.created_at).toLocaleDateString()}] ${n.note_text}`)
      .join('\n');

    const dealsText = (activeDeals.data || [])
      .map((d: any) => `- ${d.title} (Value: ${d.value}, Status: ${d.status}, Prob: ${d.probability || 50}%)`)
      .join('\n');

    // 3. Define fallback analysis structure
    let leadAnalysis = {
      qualification: {
        businessType: 'Unknown',
        industry: 'Unknown',
        businessSize: 'Unknown',
        budget: 'Unknown',
        urgency: 'Medium',
        timeline: 'Immediate',
        decisionMaker: 'Yes',
        technicalRequirements: [],
        problems: [],
        communicationFrequency: 'Regular',
        engagementLevel: 'Medium',
      },
      leadScore: 50,
      leadCategory: 'cold',
      buyingIntent: 'Neutral interest in services',
      recommendations: {
        bestService: 'Core Web Development',
        bestPackage: 'Standard Package',
        bestTechnology: 'Next.js & Supabase',
        estimatedTimeline: '4-6 Weeks',
        estimatedBudget: 'Medium',
        upsells: ['Annual Maintenance Contract (AMC)', 'Advanced SEO Package'],
        crossSells: ['Meta Marketing Campaign setup'],
        futureUpgrades: ['AI Chatbot Automation Integration'],
      },
      clv: {
        estimatedValue: 2000,
        averagePurchase: 1500,
        recurringRevenue: 120,
        retentionRate: 85,
        upsellProbability: 30,
        crossSellProbability: 25,
        repeatPurchaseProbability: 40,
      },
      salesInsights: 'Customer is exploring options but has not committed yet. Needs targeted follow-up.',
      followUpStrategy: 'Schedule an introductory consultation within 48 hours to lock requirements.',
    };

    // 4. Call NVIDIA AI to perform deep sales intelligence scoring
    const routerConfig = await aiRouterRepo.getByUserId(userId);
    const activeProviderName = routerConfig?.ai_provider || 'nvidia';
    const provider = tryGetAIProvider(activeProviderName);

    if (provider) {
      try {
        const systemPrompt = `
You are the Enterprise AI Sales Intelligence & Lead Qualification Engine.
Analyze the customer's profile details, chat transcripts, internal notes, and deals, and provide deep, high-fidelity sales analytics.
You must return a valid, parsable JSON object matching the exact structure specified below.
Do not output any markdown codeblock backticks (like \`\`\`json) or conversational filler text.
`;

        const prompt = `
Analyze the customer data below:

Customer Profile:
- Name: ${contact.name || 'Unknown'}
- Company: ${contact.company || 'Unknown'}
- Industry: ${contact.industry || 'Unknown'}
- Lead Source: ${contact.lead_source || 'Unknown'}
- Location: ${contact.city || ''}, ${contact.country || ''}

Recent WhatsApp Conversation History:
${messagesText || 'No conversations logged.'}

Staff Internal Notes:
${notesText || 'No staff notes logged.'}

Deals Logged:
${dealsText || 'No active deals.'}

Generate a comprehensive sales intelligence report. Return EXACTLY this JSON structure:
{
  "qualification": {
    "businessType": "<B2B, B2C, Enterprise, SMB, etc.>",
    "industry": "<Extracted Industry or Unknown>",
    "businessSize": "<Small, Medium, Large, or Unknown>",
    "budget": "<Low, Medium, High, or Unknown>",
    "urgency": "<Immediate, High, Medium, Low>",
    "timeline": "<Expected project timeline, e.g., 1 Month, 3 Months, etc.>",
    "decisionMaker": "<Yes, No, or Undetermined>",
    "technicalRequirements": ["<requirement 1>", "<requirement 2>"],
    "problems": ["<customer pain point 1>", "<customer pain point 2>"],
    "communicationFrequency": "<High, Regular, Low>",
    "engagementLevel": "<High, Medium, Low>"
  },
  "leadScore": <integer between 0 and 100>,
  "leadCategory": "<hot, warm, cold, dormant, vip, or enterprise in lowercase>",
  "buyingIntent": "<Summary of customer's buying intent and signals>",
  "recommendations": {
    "bestService": "<Recommended primary service>",
    "bestPackage": "<Recommended package level>",
    "bestTechnology": "<Recommended tech stack, e.g. React, Next.js, WordPress, Shopify>",
    "estimatedTimeline": "<Recommended timeline>",
    "estimatedBudget": "<Recommended budget level, e.g. $2,000, High, etc.>",
    "upsells": ["<upsell suggestion 1>", "<upsell suggestion 2>"],
    "crossSells": ["<cross-sell suggestion 1>"],
    "futureUpgrades": ["<future feature expansion idea>"]
  },
  "clv": {
    "estimatedValue": <predicted customer lifetime value in USD, integer>,
    "averagePurchase": <average deal/purchase amount in USD, integer>,
    "recurringRevenue": <predicted monthly recurring hosting/support revenue in USD, integer>,
    "retentionRate": <estimated customer retention probability %, integer 0-100>,
    "upsellProbability": <upsell conversion probability %, integer 0-100>,
    "crossSellProbability": <cross-sell conversion probability %, integer 0-100>,
    "repeatPurchaseProbability": <repeat purchase probability %, integer 0-100>
  },
  "salesInsights": "<rich tactical summary of sales opportunities, blockers, and details>",
  "followUpStrategy": "<detailed timeline and messaging guide for next follow-ups>"
}
`;

        const response = await provider.chat({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: systemPrompt,
          maxTokens: 1536,
          temperature: 0.2,
          options: routerConfig?.model ? { model: routerConfig.model } : { model: 'meta/llama-3.1-405b-instruct' },
        });

        const cleaned = response.content
          .replace(/```json/i, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed.leadScore === 'number') {
          leadAnalysis = parsed;
        }
      } catch (aiErr) {
        console.error('[Sales Intelligence API] AI analysis failed, using premium defaults:', aiErr);
      }
    }

    // 5. Save Analysis in MongoDB Atlas Collections (Parallel)
    try {
      await Promise.all([
        aiDataRepo.saveLeadAnalysis(contactId, userId, leadAnalysis.qualification),
        aiDataRepo.saveSalesPredictions(contactId, userId, {
          clv: leadAnalysis.clv,
          leadScore: leadAnalysis.leadScore,
          leadCategory: leadAnalysis.leadCategory,
          buyingIntent: leadAnalysis.buyingIntent,
          salesInsights: leadAnalysis.salesInsights,
        }),
        aiDataRepo.saveAIRecommendations(contactId, userId, {
          recommendations: leadAnalysis.recommendations,
          followUpStrategy: leadAnalysis.followUpStrategy,
        }),
      ]);
    } catch (mongoErr) {
      console.error('[Sales Intelligence API] MongoDB Atlas save failed:', mongoErr);
    }

    // 6. Update corresponding active deal in Supabase (if exists)
    if (activeDeals.data && activeDeals.data.length > 0) {
      const activeDeal = activeDeals.data[0];
      
      const categoryMapping: Record<string, string> = {
        hot: 'hot',
        warm: 'warm',
        cold: 'cold',
        dormant: 'dormant',
        vip: 'vip',
        enterprise: 'enterprise',
      };
      
      const cleanCategory = categoryMapping[leadAnalysis.leadCategory.toLowerCase()] || 'cold';

      await supabase
        .from('deals')
        .update({
          lead_score: leadAnalysis.leadScore,
          lead_category: cleanCategory,
          urgency: leadAnalysis.qualification.urgency,
          timeline: leadAnalysis.qualification.timeline,
          expected_revenue: activeDeal.value * (leadAnalysis.leadScore / 100),
          probability: leadAnalysis.leadScore,
        })
        .eq('id', activeDeal.id);
    }

    return NextResponse.json({
      contactId,
      qualification: leadAnalysis.qualification,
      leadScore: leadAnalysis.leadScore,
      leadCategory: leadAnalysis.leadCategory,
      buyingIntent: leadAnalysis.buyingIntent,
      recommendations: leadAnalysis.recommendations,
      clv: leadAnalysis.clv,
      salesInsights: leadAnalysis.salesInsights,
      followUpStrategy: leadAnalysis.followUpStrategy,
    });

  } catch (err: any) {
    console.error('[Sales Intelligence API] fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
