import { dbService } from '@/services/db';

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
    await dbService.ai.logWebhook(args);
  } catch (err) {
    console.error('[MongoDB/Logger] logWebhook failed:', err);
  }
}

export async function logAutomation(args: AutomationLogArgs): Promise<void> {
  try {
    await dbService.ai.logAutomation(args);
  } catch (err) {
    console.error('[MongoDB/Logger] logAutomation failed:', err);
  }
}

export async function logPrompt(args: PromptLogArgs): Promise<void> {
  try {
    await dbService.ai.logPrompt(args);
  } catch (err) {
    console.error('[MongoDB/Logger] logPrompt failed:', err);
  }
}

export async function logSentimentAnalysis(args: SentimentAnalysisLogArgs): Promise<void> {
  try {
    await dbService.ai.logSentimentAnalysis(args);
  } catch (err) {
    console.error('[MongoDB/Logger] logSentimentAnalysis failed:', err);
  }
}
