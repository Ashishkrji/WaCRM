import { connectToDatabase } from '@/lib/mongodb';

export interface WebhookLogArgs {
  userId: string;
  direction: 'inbound' | 'outbound';
  payload: any;
  status: string;
  error?: string | null;
}

export interface AutomationLogArgs {
  userId: string;
  automationId: string;
  contactId: string;
  triggerType: string;
  success: boolean;
  stepsExecuted: any[];
  error?: string | null;
}

export interface PromptLogArgs {
  userId: string;
  messages: any[];
  systemPrompt?: string;
  reply: string;
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface SentimentAnalysisLogArgs {
  userId: string;
  contactId: string;
  conversationId: string;
  text: string;
  intent: string;
  sentiment: string;
  language: string;
  wantsHuman: boolean;
}

export async function logWebhook(args: WebhookLogArgs): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('webhook_logs').insertOne({
      user_id: args.userId,
      direction: args.direction,
      payload: args.payload,
      status: args.status,
      error: args.error || null,
      created_at: new Date(),
    });
  } catch (err) {
    console.error('[MongoDB/Logger] logWebhook failed:', err);
  }
}

export async function logAutomation(args: AutomationLogArgs): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('automation_logs').insertOne({
      user_id: args.userId,
      automation_id: args.automationId,
      contact_id: args.contactId,
      trigger_type: args.triggerType,
      success: args.success,
      steps_executed: args.stepsExecuted,
      error: args.error || null,
      created_at: new Date(),
    });
  } catch (err) {
    console.error('[MongoDB/Logger] logAutomation failed:', err);
  }
}

export async function logPrompt(args: PromptLogArgs): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('prompt_history').insertOne({
      user_id: args.userId,
      messages: args.messages,
      system_prompt: args.systemPrompt || null,
      reply: args.reply,
      provider: args.provider,
      model: args.model,
      tokens_used: args.tokensUsed,
      latency_ms: args.latencyMs,
      created_at: new Date(),
    });
  } catch (err) {
    console.error('[MongoDB/Logger] logPrompt failed:', err);
  }
}

export async function logSentimentAnalysis(args: SentimentAnalysisLogArgs): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('sentiment_analysis_logs').insertOne({
      user_id: args.userId,
      contact_id: args.contactId,
      conversation_id: args.conversationId,
      text: args.text,
      intent: args.intent,
      sentiment: args.sentiment,
      language: args.language,
      wants_human: args.wantsHuman,
      created_at: new Date(),
    });
  } catch (err) {
    console.error('[MongoDB/Logger] logSentimentAnalysis failed:', err);
  }
}
