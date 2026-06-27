import { createClient } from '@supabase/supabase-js';
import { ContactRepository } from './business/contact.repository';
import { ConversationRepository } from './business/conversation.repository';
import { MessageRepository } from './business/message.repository';
import { AIRouterConfigRepository } from './business/airouter.repository';
import { DealRepository } from './business/deal.repository';
import { MeetingRepository } from './business/meeting.repository';
import { QuotationRepository } from './business/quotation.repository';
import { ProposalRepository } from './business/proposal.repository';
import { PipelineRepository } from './business/pipeline.repository';
import { LeadScoreRepository } from './business/leadscore.repository';
import { SyncRepository } from './business/sync.repository';
import { MongoVectorStoreProvider, MongoMemoryProvider, MongoAIDataServiceProvider } from '../services/db/providers';
import { CampaignRepository } from './business/campaign.repository';
import { SegmentRepository } from './business/segment.repository';
import { EmailCampaignRepository } from './business/email-campaign.repository';
import { ReferralRepository } from './business/referral.repository';
import { UTMTrackingRepository } from './business/utm-tracking.repository';
import { CustomerJourneyRepository } from './business/customer-journey.repository';
import { WorkflowRepository } from './business/workflow.repository';
import { WorkflowExecutionRepository } from './business/workflow-execution.repository';
import { WorkflowApprovalRepository } from './business/workflow-approval.repository';
import { WorkflowScheduleRepository } from './business/workflow-schedule.repository';
import { WebhookConfigRepository } from './business/webhook-config.repository';
// Initialize the Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Singleton instances - Supabase
export const contactRepo = new ContactRepository(supabaseClient);
export const conversationRepo = new ConversationRepository(supabaseClient);
export const messageRepo = new MessageRepository(supabaseClient);
export const aiRouterRepo = new AIRouterConfigRepository(supabaseClient);
export const dealRepo = new DealRepository(supabaseClient);
export const meetingRepo = new MeetingRepository(supabaseClient);
export const quotationRepo = new QuotationRepository(supabaseClient);
export const proposalRepo = new ProposalRepository(supabaseClient);
export const pipelineRepo = new PipelineRepository(supabaseClient);
export const leadScoreRepo = new LeadScoreRepository(supabaseClient);
export const syncRepo = new SyncRepository(supabaseClient);

// Marketing Repositories
export const campaignRepo = new CampaignRepository(supabaseClient);
export const segmentRepo = new SegmentRepository(supabaseClient);
export const emailCampaignRepo = new EmailCampaignRepository(supabaseClient);
export const referralRepo = new ReferralRepository(supabaseClient);
export const utmTrackingRepo = new UTMTrackingRepository(supabaseClient);
export const customerJourneyRepo = new CustomerJourneyRepository(supabaseClient);

// Workflow Repositories
export const workflowRepo = new WorkflowRepository(supabaseClient);
export const workflowExecutionRepo = new WorkflowExecutionRepository(supabaseClient);
export const workflowApprovalRepo = new WorkflowApprovalRepository(supabaseClient);
export const workflowScheduleRepo = new WorkflowScheduleRepository(supabaseClient);
export const webhookConfigRepo = new WebhookConfigRepository(supabaseClient);

// Singleton instances - Mongo
export const knowledgeRepo = new MongoVectorStoreProvider();
export const memoryRepo = new MongoMemoryProvider();
export const aiDataRepo = new MongoAIDataServiceProvider();

// Export classes
export * from './business/contact.repository';
export * from './business/conversation.repository';
export * from './business/message.repository';
export * from './business/airouter.repository';
export * from './business/deal.repository';
export * from './business/meeting.repository';
export * from './business/quotation.repository';
export * from './business/proposal.repository';
export * from './business/pipeline.repository';
export * from './business/leadscore.repository';
export * from './business/sync.repository';
export * from './business/campaign.repository';
export * from './business/segment.repository';
export * from './business/email-campaign.repository';
export * from './business/referral.repository';
export * from './business/utm-tracking.repository';
export * from './business/customer-journey.repository';
export * from './business/workflow.repository';
export * from './business/workflow-execution.repository';
export * from './business/workflow-approval.repository';
export * from './business/workflow-schedule.repository';
export * from './business/webhook-config.repository';
