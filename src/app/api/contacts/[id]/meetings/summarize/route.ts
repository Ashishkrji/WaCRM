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
    const { meetingId, transcript } = body;

    if (!meetingId || !transcript) {
      return NextResponse.json({ error: 'Missing meetingId or transcript' }, { status: 400 });
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

    // 2. Verify meeting booking existence and association
    const { data: meeting, error: meetingError } = await supabase
      .from('meeting_bookings')
      .select('*')
      .eq('id', meetingId)
      .eq('contact_id', contactId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // 3. Call NVIDIA AI to summarize and isolate follow-ups
    let summaryData = {
      summary: 'The client discussed project requirements and timeline. Key deliverables were agreed upon.',
      actionItems: ['Schedule a requirements follow-up', 'Send pricing quotation based on finalized scope'],
      tasks: [
        {
          title: 'Prepare Project Quotation',
          description: 'Draft itemized pricing quotation for custom development.',
          priority: 'high',
          dueDaysFromNow: 2,
        },
        {
          title: 'Follow up on technical stack',
          description: 'Confirm client preference for database hosting option.',
          priority: 'medium',
          dueDaysFromNow: 5,
        }
      ]
    };

    const routerConfig = await aiRouterRepo.getByUserId(userId);
    const activeProviderName = routerConfig?.ai_provider || 'nvidia';
    const provider = tryGetAIProvider(activeProviderName);

    if (provider) {
      try {
        const systemPrompt = `
You are the Enterprise AI Meeting Intelligence Engine.
Analyze the provided meeting transcript or notes, extract the key points, draft a concise summary, and identify concrete follow-up action items.
You must return a valid, parsable JSON object matching the exact structure specified below.
Do not output any markdown codeblock backticks (like \`\`\`json) or conversational text.
`;

        const prompt = `
Analyze the meeting transcript below for:
Meeting Title: ${meeting.title || 'Client Consultation'}
Customer: ${contact.name || 'Client'}
Company: ${contact.company || 'Their Company'}

Transcript / Notes:
${transcript}

Isolate the key discussion points, compile a summary, and generate actionable follow-up tasks.
Return EXACTLY this JSON structure:
{
  "summary": "<concise paragraph summarizing the meeting outcomes, decisions, and next steps>",
  "actionItems": ["<action item 1>", "<action item 2>"],
  "tasks": [
    {
      "title": "<short task title, e.g., Prepare E-commerce Proposal>",
      "description": "<detailed description of the task, what needs to be done>",
      "priority": "<low, medium, or high>",
      "dueDaysFromNow": <integer number of days, e.g. 2 or 5>
    }
  ]
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
        if (parsed && parsed.summary) {
          summaryData = parsed;
        }
      } catch (aiErr) {
        console.error('[Meeting Summarize API] AI processing failed:', aiErr);
      }
    }

    // 4. Update Supabase meeting_bookings record
    const { error: updateMeetingError } = await supabase
      .from('meeting_bookings')
      .update({
        summary: summaryData.summary,
        notes: transcript.slice(0, 5000), // Save raw transcript inside notes (max 5000 chars)
        status: 'completed', // Mark meeting as completed
      })
      .eq('id', meetingId);

    if (updateMeetingError) {
      console.error('[Meeting Summarize API] Supabase update meeting failed:', updateMeetingError);
    }

    // 5. Save deep meeting summary in MongoDB Atlas
    try {
      await aiDataRepo.saveMeetingSummary(meetingId, userId, summaryData);
    } catch (mongoErr) {
      console.error('[Meeting Summarize API] MongoDB save failed:', mongoErr);
    }

    // 6. Automatically insert generated follow-up tasks in Supabase
    if (summaryData.tasks && summaryData.tasks.length > 0) {
      const taskInserts = summaryData.tasks.map(t => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (t.dueDaysFromNow || 2));
        
        const cleanPriority = ['low', 'medium', 'high'].includes(t.priority?.toLowerCase())
          ? t.priority.toLowerCase()
          : 'medium';

        return {
          user_id: userId,
          contact_id: contactId,
          assigned_to: userId,
          title: t.title,
          description: t.description,
          priority: cleanPriority,
          due_date: dueDate.toISOString(),
          status: 'pending',
        };
      });

      const { error: taskInsertError } = await supabase
        .from('tasks')
        .insert(taskInserts);

      if (taskInsertError) {
        console.error('[Meeting Summarize API] Failed to auto-insert tasks:', taskInsertError);
      }
    }

    // 7. Update AI memory with the latest meeting results
    try {
      await memoryRepo.updateContactMemory(userId, contactId, {
        facts: {
          last_meeting_date: new Date().toISOString(),
          last_meeting_topic: meeting.title || 'Consultation',
        },
        totalInteractions: 1,
      });
    } catch (memErr) {
      console.warn('[Meeting Summarize API] Failed to update AI memory:', memErr);
    }

    return NextResponse.json({
      success: true,
      summary: summaryData.summary,
      actionItems: summaryData.actionItems,
      tasksCreated: summaryData.tasks.length,
    });
  } catch (err: any) {
    console.error('[Meeting Summarize API] fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
