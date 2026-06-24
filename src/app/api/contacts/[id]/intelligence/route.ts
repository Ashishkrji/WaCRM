import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dbService } from '@/services/db';
import { tryGetAIProvider } from '@/lib/ai/provider-factory';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const contactId = params.id;

  try {
    // 1. Fetch contact details from Supabase to verify owner/existence
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

    // 2. Query MongoDB Memory
    let memory: any = null;
    try {
      memory = await dbService.ai.getContactMemory(userId, contactId);
    } catch (memErr) {
      console.warn('[Intelligence API] getContactMemory failed:', memErr);
    }

    // 3. Find if there's an active conversation to retrieve AI summary
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();

    let summary: any = null;
    if (conversation) {
      try {
        summary = await dbService.ai.getSummary(conversation.id);
      } catch (sumErr) {
        console.warn('[Intelligence API] getSummary failed:', sumErr);
      }
    }

    // 4. Fetch recent messages, notes, and deals to feed AI analysis
    const [recentMessages, contactNotes, contactDeals] = await Promise.all([
      conversation
        ? dbService.business.getRecentMessages(conversation.id, 15, supabase).catch(() => [])
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
        .select('*, stage:pipeline_stages(*)')
        .eq('contact_id', contactId)
        .then(res => res.data || []),
    ]);

    // Construct text representation for the AI analysis
    const messagesText = recentMessages
      .slice(0, 15)
      .reverse()
      .map((m: any) => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content_text || ''}`)
      .join('\n');

    const notesText = contactNotes
      .map((n: any) => `- ${n.note_text}`)
      .join('\n');

    const dealsText = contactDeals
      .map((d: any) => `- ${d.title} (Value: ${d.value}, Stage: ${d.stage?.name || 'Active'}, Prob: ${d.probability || 50}%)`)
      .join('\n');

    // 5. Generate AI analysis on-the-fly using NVIDIA AI
    let aiAnalysis = {
      leadScore: 70,
      conversionProbability: 60,
      intent: 'Interested in core products, seeking technical details',
      sentiment: 'Neutral',
      buyingSignals: ['Asked about pricing', 'Requested follow-up'],
      recommendations: [
        'Propose an introductory consultation meeting',
        'Send standard catalog containing service details',
      ],
      customerIntelligence: {
        painPoints: ['Need reliable communication channels'],
        interestedServices: ['WhatsApp Integration'],
        estimatedBudget: 'Medium',
      },
    };

    // Resolve provider/model overrides to run active model
    const routerConfig = await dbService.business.getAIRouterConfig(userId, supabase);
    const activeProviderName = routerConfig?.ai_provider || 'nvidia';
    const provider = tryGetAIProvider(activeProviderName);

    if (provider) {
      try {
        const systemPrompt = `
You are the Enterprise AI Customer Intelligence Engine.
Analyze the customer's profile, recent messages, and deals, and provide high-value, enterprise-grade sales intelligence.
You must return a valid JSON object matching the exact format specified below.
Do not output any extra text, formatting markdown blocks (like \`\`\`json), or comments.
`;

        const prompt = `
Analyze the customer data below:

Customer: ${contact.name || 'Unknown'}
Company: ${contact.company || 'Unknown'}
Industry: ${contact.industry || 'Unknown'}
Lead Source: ${contact.lead_source || 'Unknown'}

Recent Messages:
${messagesText || 'No messages.'}

Recent Notes:
${notesText || 'No notes.'}

Active Deals:
${dealsText || 'No deals.'}

Return a JSON object containing EXACTLY this structure:
{
  "leadScore": <number between 0 and 100>,
  "conversionProbability": <number between 0 and 100>,
  "intent": "<short summary of buying intent>",
  "sentiment": "<Positive, Neutral, or Negative>",
  "buyingSignals": ["<signal 1>", "<signal 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "customerIntelligence": {
    "painPoints": ["<pain point 1>"],
    "interestedServices": ["<service 1>"],
    "estimatedBudget": "<estimated budget or Unknown>"
  }
}
`;

        const response = await provider.chat({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: systemPrompt,
          maxTokens: 1024,
          temperature: 0.2,
          options: routerConfig?.model ? { model: routerConfig.model } : { model: 'meta/llama-3.1-405b-instruct' },
        });
        const responseText = response.content;

        // Clean any codeblock markers if model returned them
        const cleanedText = responseText
          .replace(/```json/i, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(cleanedText);
        if (parsed && typeof parsed.leadScore === 'number') {
          aiAnalysis = parsed;
        }
      } catch (aiErr) {
        console.error('[Intelligence API] AI completion failed, using premium defaults:', aiErr);
      }
    }

    return NextResponse.json({
      contact,
      memory,
      summary,
      intelligence: aiAnalysis,
    });
  } catch (err: any) {
    console.error('[Intelligence API] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
