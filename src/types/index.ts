export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  availability?: 'online' | 'busy' | 'away';
  last_seen_at?: string;
  /**
   * Opted-in beta feature keys for this account. The column survives
   * for future beta gates; no current feature reads it (Flows was
   * the last user and went to soft-GA in PR #134). Defaults to `[]`
   * for every profile; toggled per-account via a direct UPDATE on
   * the `profiles` row.
   */
  beta_features?: string[];
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  phone: string;
  name?: string;
  email?: string;
  company?: string;
  avatar_url?: string;
  website?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  language?: string;
  timezone?: string;
  business_type?: string;
  lead_source?: string;
  status?: string;
  owner_id?: string;
  last_activity_at?: string;
  preferred_language?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ContactTag {
  id: string;
  contact_id: string;
  tag_id: string;
}

export interface CustomField {
  id: string;
  user_id: string;
  field_name: string;
  field_type: string;
  field_options?: Record<string, unknown>;
  created_at: string;
}

export interface ContactCustomValue {
  id: string;
  contact_id: string;
  custom_field_id: string;
  value?: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  user_id: string;
  note_text: string;
  created_at: string;
}

export type ConversationStatus = 'open' | 'pending' | 'closed';

export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  status: ConversationStatus;
  assigned_agent_id?: string;
  last_message_text?: string;
  last_message_at?: string;
  unread_count: number;
  pinned?: boolean;
  favorite?: boolean;
  spam?: boolean;
  blocked?: boolean;
  sla_first_response_time?: number;
  sla_avg_response_time?: number;
  sla_resolution_time?: number;
  sla_breached?: boolean;
  created_at: string;
  updated_at: string;
  contact?: Contact;
}

export type SenderType = 'customer' | 'agent' | 'bot';
export type ContentType =
  | 'text'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'location'
  | 'template'
  /** Customer tapped a reply button or list row on a message we sent. */
  | 'interactive';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_id?: string;
  content_type: ContentType;
  content_text?: string;
  media_url?: string;
  template_name?: string;
  message_id?: string;
  status: MessageStatus;
  created_at: string;
  reply_to_message_id?: string;
  is_internal?: boolean;
  /**
   * Only set when `content_type === 'interactive'` — the stable id of
   * the button or list row the customer tapped. The Flows engine uses
   * this to route the next node; the inbox bubble uses it as a styling
   * cue (renders with a "↩ button reply" affordance).
   */
  interactive_reply_id?: string;
}

export type ReactionActor = 'customer' | 'agent';

export interface MessageReaction {
  id: string;
  message_id: string;
  conversation_id: string;
  actor_type: ReactionActor;
  actor_id?: string;
  emoji: string;
  created_at: string;
}

export interface WhatsAppConfig {
  id: string;
  user_id: string;
  phone_number_id: string;
  waba_id?: string;
  access_token: string;
  verify_token?: string;
  status: 'connected' | 'disconnected';
  connected_at?: string;
}

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  category: 'Marketing' | 'Utility' | 'Authentication';
  language?: string;
  header_type?: 'text' | 'image' | 'video' | 'document';
  header_content?: string;
  body_text: string;
  footer_text?: string;
  buttons?: Record<string, unknown>[];
  status?: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string;
  created_at: string;
}

export interface QuickReply {
  id: string;
  user_id: string;
  shortcut: string;
  message_text: string;
  category?: string;
  created_at: string;
}

export interface ContactSegment {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  filter_criteria: Record<string, unknown>;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image_url?: string;
  in_stock: boolean;
  created_at: string;
}

export type DealStatus = 'open' | 'won' | 'lost';

export interface Deal {
  id: string;
  user_id: string;
  pipeline_id: string;
  stage_id: string;
  /**
   * Nullable after migration 004 — becomes NULL when the referenced
   * contact is deleted (ON DELETE SET NULL). History preserved.
   */
  contact_id: string | null;
  conversation_id?: string;
  assigned_to?: string;
  title: string;
  value: number;
  currency?: string;
  notes?: string;
  expected_close_date?: string;
  status?: DealStatus;
  probability?: number;
  expected_revenue?: number;
  priority?: 'low' | 'medium' | 'high';
  services?: string[];
  proposal_id?: string;
  quotation_id?: string;
  created_at: string;
  updated_at?: string;
  contact?: Contact;
  stage?: PipelineStage;
  assignee?: Profile;
}

export interface Task {
  id: string;
  user_id: string;
  contact_id?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  status: 'pending' | 'completed';
  recurring?: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  assignee?: Profile;
}

export interface CustomerFile {
  id: string;
  user_id: string;
  contact_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  created_at: string;
}

export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';

export interface Broadcast {
  id: string;
  user_id: string;
  name: string;
  template_name: string;
  template_language: string;
  template_variables?: Record<string, unknown>;
  audience_filter?: Record<string, unknown>;
  scheduled_at?: string;
  status: BroadcastStatus;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  replied_count: number;
  failed_count: number;
  created_at: string;
}

export interface BroadcastRecipient {
  id: string;
  broadcast_id: string;
  /**
   * Nullable after migration 004 — becomes NULL when the referenced
   * contact is deleted (ON DELETE SET NULL). History preserved; the
   * UI renders "Unknown" for orphaned rows.
   */
  contact_id: string | null;
  status: RecipientStatus;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  replied_at?: string;
  error_message?: string;
  /**
   * Meta's message id, persisted when the broadcast send succeeds so
   * the webhook can mirror status updates back onto the recipient row.
   * Added in migration 003.
   */
  whatsapp_message_id?: string;
  created_at: string;
  contact?: Contact;
}

// ============================================================
// Automations (migration 006)
// ============================================================

export type AutomationTriggerType =
  | 'new_message_received'
  | 'first_inbound_message'
  | 'keyword_match'
  | 'new_contact_created'
  | 'conversation_assigned'
  | 'tag_added'
  | 'time_based';

export type AutomationStepType =
  | 'send_message'
  | 'send_template'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_conversation'
  | 'update_contact_field'
  | 'create_deal'
  | 'wait'
  | 'condition'
  | 'send_webhook'
  | 'close_conversation';

export type AutomationLogStatus = 'success' | 'partial' | 'failed';

export interface KeywordMatchTriggerConfig {
  keywords: string[];
  match_type: 'exact' | 'contains';
  case_sensitive?: boolean;
}

export interface TagTriggerConfig {
  tag_id: string;
}

export interface TimeBasedTriggerConfig {
  /** Cron expression or simple HH:mm string; engine can accept either. */
  schedule: string;
  timezone?: string;
}

export type AutomationTriggerConfig =
  | Record<string, never>
  | KeywordMatchTriggerConfig
  | TagTriggerConfig
  | TimeBasedTriggerConfig
  | Record<string, unknown>;

export interface SendMessageStepConfig {
  text: string;
}

export interface SendTemplateStepConfig {
  template_name: string;
  language?: string;
  variables?: Record<string, string>;
}

export interface TagStepConfig {
  tag_id: string;
}

export interface AssignConversationStepConfig {
  mode: 'specific' | 'round_robin';
  agent_id?: string;
}

export interface UpdateContactFieldStepConfig {
  field: string;
  value: string;
}

export interface CreateDealStepConfig {
  pipeline_id: string;
  stage_id: string;
  title: string;
  value?: number;
}

export interface WaitStepConfig {
  amount: number;
  unit: 'minutes' | 'hours' | 'days';
}

export type ConditionSubject =
  | 'contact_field'
  | 'tag_presence'
  | 'message_content'
  | 'time_of_day';

export interface ConditionStepConfig {
  subject: ConditionSubject;
  /** e.g. field name, tag id, substring, or "HH:mm-HH:mm" depending on subject */
  operand?: string;
  /** For contact_field equals / message_content contains — comparison value */
  value?: string;
}

export interface SendWebhookStepConfig {
  url: string;
  headers?: Record<string, string>;
  body_template?: string;
}

export type AutomationStepConfig =
  | SendMessageStepConfig
  | SendTemplateStepConfig
  | TagStepConfig
  | AssignConversationStepConfig
  | UpdateContactFieldStepConfig
  | CreateDealStepConfig
  | WaitStepConfig
  | ConditionStepConfig
  | SendWebhookStepConfig
  | Record<string, never>
  | Record<string, unknown>;

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: AutomationTriggerType;
  trigger_config: AutomationTriggerConfig;
  is_active: boolean;
  execution_count: number;
  last_executed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationStep {
  id: string;
  automation_id: string;
  parent_step_id?: string | null;
  branch?: 'yes' | 'no' | null;
  step_type: AutomationStepType;
  step_config: AutomationStepConfig;
  position: number;
  created_at: string;
}

export interface AutomationLogStepResult {
  step_id: string;
  step_type: AutomationStepType;
  status: 'success' | 'skipped' | 'failed';
  detail?: string;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  user_id: string;
  contact_id: string | null;
  trigger_event: string;
  steps_executed: AutomationLogStepResult[];
  status: AutomationLogStatus;
  error_message?: string | null;
  created_at: string;
  contact?: Contact;
}

export interface Invoice {
  id: string;
  user_id: string;
  contact_id: string;
  invoice_number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
  services?: string[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  contact_id: string;
  invoice_id?: string;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  payment_date?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  type: 'whatsapp' | 'email' | 'sms';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';
  sent_count: number;
  delivery_count: number;
  read_count: number;
  created_at: string;
  updated_at: string;
}

export interface CrmSettings {
  id: string;
  user_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Enterprise Workflow Automation Engine (migrations 027–028)
// ============================================================

export type WorkflowNodeType =
  | 'trigger'
  | 'condition'
  | 'decision'
  | 'delay'
  | 'loop'
  | 'approval'
  | 'action'
  | 'webhook'
  | 'ai_node'
  | 'end';

export type WorkflowStatus = 'draft' | 'published' | 'archived';
export type WorkflowCategory =
  | 'crm' | 'lead' | 'sales' | 'marketing' | 'support' | 'ai'
  | 'meeting' | 'proposal' | 'quotation' | 'payment' | 'retention' | 'custom';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'timed_out';
export type ApprovalMode = 'sequential' | 'parallel' | 'any_one';
export type ScheduleType = 'once' | 'recurring' | 'cron';
export type WebhookDirection = 'incoming' | 'outgoing';

// Workflow (extends the existing `workflows` table from migration 027)
export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  version: number;
  status: WorkflowStatus;
  is_template: boolean;
  category: WorkflowCategory;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Populated joins
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  execution_count?: number;
}

// Visual canvas node
export interface WorkflowNode {
  id: string;
  workflow_id: string;
  user_id: string;
  node_type: WorkflowNodeType;
  label: string;
  config: WorkflowNodeConfig;
  pos_x: number;
  pos_y: number;
  created_at: string;
  updated_at: string;
}

// Node config union
export type WorkflowNodeConfig =
  | TriggerNodeConfig
  | ConditionNodeConfig
  | DecisionNodeConfig
  | DelayNodeConfig
  | ActionNodeConfig
  | ApprovalNodeConfig
  | WebhookNodeConfig
  | AINodeConfig
  | Record<string, unknown>;

export interface TriggerNodeConfig {
  event: string;
  filter?: Record<string, unknown>;
}

export interface ConditionNodeConfig {
  subject: string;
  operator?: string;
  value?: string | number | boolean;
}

export interface DecisionNodeConfig {
  use_ai: boolean;
  ai_prompt?: string;
  conditions?: Array<{ field: string; operator: string; value: unknown; target: string }>;
}

export interface DelayNodeConfig {
  amount: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
  reference?: string; // e.g. 'due_date', 'meeting_date'
}

export interface ActionNodeConfig {
  action: string; // e.g. 'send_message', 'create_task', 'assign_agent', 'send_invoice' ...
  [key: string]: unknown;
}

export interface ApprovalNodeConfig {
  title: string;
  description?: string;
  approvers: string[];
  approval_mode: ApprovalMode;
  escalation_after_hours?: number;
  escalate_to?: string;
}

export interface WebhookNodeConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body_template?: string;
}

export interface AINodeConfig {
  agent_type: string;
  prompt?: string;
  search_knowledge?: boolean;
  generate_offer?: boolean;
  model?: string;
}

// Canvas edge (connection between nodes)
export interface WorkflowEdge {
  id: string;
  workflow_id: string;
  user_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_label: string; // 'default', 'yes', 'no', custom branch label
  created_at: string;
}

// Approval request generated during workflow execution
export interface WorkflowApproval {
  id: string;
  workflow_id: string;
  execution_id?: string;
  user_id: string;
  node_id?: string;
  title: string;
  description?: string;
  status: ApprovalStatus;
  approvers: string[];
  approval_mode: ApprovalMode;
  responses: ApprovalResponse[];
  context: Record<string, unknown>;
  escalation_after_hours?: number;
  escalate_to?: string;
  due_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalResponse {
  approver_id: string;
  action: 'approved' | 'rejected';
  comment?: string;
  at: string;
}

// Scheduled job
export interface WorkflowSchedule {
  id: string;
  workflow_id: string;
  user_id: string;
  schedule_type: ScheduleType;
  schedule_value: string;
  timezone: string;
  business_hours_only: boolean;
  holiday_dates: string[];
  is_active: boolean;
  last_fired_at?: string;
  next_fire_at?: string;
  fire_count: number;
  max_fires?: number;
  created_at: string;
  updated_at: string;
}

// Webhook configuration
export interface WorkflowWebhook {
  id: string;
  user_id: string;
  workflow_id?: string;
  name: string;
  direction: WebhookDirection;
  endpoint_slug?: string;
  target_url?: string;
  secret?: string;
  headers: Record<string, string>;
  retry_config: { max_attempts: number; backoff_seconds: number };
  rate_limit_config: { requests_per_minute: number };
  is_active: boolean;
  total_received: number;
  total_sent: number;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

// Webhook delivery log
export interface WorkflowWebhookLog {
  id: string;
  webhook_id: string;
  user_id: string;
  status: string;
  http_status?: number;
  request_body?: Record<string, unknown>;
  response_body?: string;
  attempt_number: number;
  latency_ms?: number;
  error_message?: string;
  created_at: string;
}

// Enterprise workflow template
export interface WorkflowTemplate {
  id: string;
  user_id?: string;
  slug: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  tags: string[];
  is_system: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

// AI routing decision log
export interface AIRoutingDecision {
  id: string;
  user_id: string;
  workflow_id?: string;
  execution_id?: string;
  contact_id?: string;
  input_context: Record<string, unknown>;
  model: string;
  intent?: string;
  sentiment?: string;
  confidence?: number;
  decision?: string;
  raw_response?: Record<string, unknown>;
  latency_ms?: number;
  created_at: string;
}

// ============================================================
// Analytics & Business Intelligence (migration 029)
// ============================================================

// Daily aggregated KPI snapshot
export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  new_leads: number;
  qualified_leads: number;
  hot_leads: number;
  won_deals: number;
  lost_deals: number;
  revenue: number;
  pipeline_value: number;
  avg_deal_size: number;
  new_customers: number;
  active_customers: number;
  inactive_customers: number;
  churn_count: number;
  total_conversations: number;
  avg_response_time_seconds: number;
  avg_resolution_time_seconds: number;
  ai_requests: number;
  ai_tokens_used: number;
  ai_cost_usd: number;
  ai_escalations: number;
  ai_confidence_avg: number;
  campaigns_sent: number;
  campaign_reach: number;
  workflows_executed: number;
  workflow_success_rate: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Configurable alert rule
export interface AnalyticsAlert {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq';
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  is_active: boolean;
  cooldown_minutes: number;
  channels: string[];
  last_triggered_at?: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

// Alert triggered event
export interface AnalyticsAlertEvent {
  id: string;
  alert_id: string;
  user_id: string;
  metric: string;
  actual_value: number;
  threshold: number;
  severity: string;
  message: string;
  is_acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
}

// Saved report configuration
export interface BiReport {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  report_type: string;
  config: BiReportConfig;
  schedule?: string;
  recipients: string[];
  export_format: 'pdf' | 'csv' | 'json' | 'excel';
  last_generated_at?: string;
  generate_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface BiReportConfig {
  date_range?: { from: string; to: string } | { preset: string };
  columns?: string[];
  filters?: Record<string, unknown>[];
  chart_type?: 'bar' | 'line' | 'pie' | 'area' | 'table';
  group_by?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  limit?: number;
}

// KPI target
export interface KpiTarget {
  id: string;
  user_id: string;
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  target_value: number;
  currency?: string;
  created_at: string;
  updated_at: string;
}

// Daily AI cost tracking record
export interface CostTrackingRecord {
  id: string;
  user_id: string;
  tracking_date: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
  success_count: number;
  failure_count: number;
  avg_latency_ms: number;
  estimated_cost_usd: number;
  created_at: string;
}

// AI-generated business insight
export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: string;
  title: string;
  body: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'warning';
  action?: string;
  action_url?: string;
  priority: number;
  is_dismissed: boolean;
  expires_at?: string;
  created_at: string;
}

// Executive dashboard data bundle
export interface ExecutiveDashboardData {
  today: {
    revenue: number;
    leads: number;
    meetings: number;
    deals_won: number;
    conversations: number;
    ai_requests: number;
  };
  trends: {
    revenue_7d: Array<{ date: string; value: number }>;
    leads_7d: Array<{ date: string; value: number }>;
  };
  pipeline: {
    total_value: number;
    open_count: number;
    pending_proposals: number;
    pending_quotations: number;
  };
  ai: {
    total_requests: number;
    success_rate: number;
    avg_latency_ms: number;
    cost_usd: number;
  };
  workflows: {
    active_count: number;
    executions_today: number;
    success_rate: number;
    pending_approvals: number;
  };
  alerts: AnalyticsAlertEvent[];
  insights: AIInsight[];
}

