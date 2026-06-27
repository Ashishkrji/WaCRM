import { aiDataRepo } from '@/repositories';

export interface WebhookLogArgs {
  organizationId: string;
  direction: 'inbound' | 'outbound';
  payload: any;
  status: string;
  error?: string | null;
}

export interface AutomationLogArgs {
  organizationId: string;
  automationId: string;
  contactId: string;
  triggerType: string;
  success: boolean;
  stepsExecuted: any[];
  error?: string | null;
}

export interface PromptLogArgs {
  organizationId: string;
  messages: any[];
  systemPrompt?: string;
  reply: string;
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface SentimentAnalysisLogArgs {
  organizationId: string;
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
    await aiDataRepo.logWebhook(args);
  } catch (err) {
    console.error('[MongoDB/Logger] logWebhook failed:', err);
  }
}

export async function logAutomation(args: AutomationLogArgs): Promise<void> {
  try {
    await aiDataRepo.logAutomation(args);
  } catch (err) {
    console.error('[MongoDB/Logger] logAutomation failed:', err);
  }
}

export async function logPrompt(args: PromptLogArgs): Promise<void> {
  try {
    await aiDataRepo.logPrompt(args);
  } catch (err) {
    console.error('[MongoDB/Logger] logPrompt failed:', err);
  }
}

export async function logSentimentAnalysis(args: SentimentAnalysisLogArgs): Promise<void> {
  try {
    await aiDataRepo.logSentimentAnalysis(args);
  } catch (err) {
    console.error('[MongoDB/Logger] logSentimentAnalysis failed:', err);
  }
}
