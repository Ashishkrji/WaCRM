-- ============================================================
-- 028_workflow_engine_extensions.sql
-- Enterprise Workflow Engine: nodes, edges, approvals,
-- schedules, webhooks, templates, AI routing decisions.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. WORKFLOW_NODES
-- Visual canvas nodes (trigger / condition / decision /
-- delay / loop / approval / action / webhook / ai / end)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN (
    'trigger','condition','decision','delay','loop',
    'approval','action','webhook','ai_node','end'
  )),
  label TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  pos_x FLOAT NOT NULL DEFAULT 0,
  pos_y FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON public.workflow_nodes(workflow_id);
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workflow_nodes" ON public.workflow_nodes;
CREATE POLICY "Users manage own workflow_nodes"
  ON public.workflow_nodes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_workflow_nodes ON public.workflow_nodes;
CREATE TRIGGER set_updated_at_workflow_nodes
  BEFORE UPDATE ON public.workflow_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 2. WORKFLOW_EDGES
-- Directed connections between nodes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.workflow_nodes(id) ON DELETE CASCADE,
  edge_label TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow ON public.workflow_edges(workflow_id);
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workflow_edges" ON public.workflow_edges;
CREATE POLICY "Users manage own workflow_edges"
  ON public.workflow_edges FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 3. WORKFLOW_APPROVALS
-- Approval requests generated during workflow execution
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.workflow_nodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','approved','rejected','escalated','timed_out'
  )),
  approvers JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_mode TEXT NOT NULL DEFAULT 'any_one' CHECK (approval_mode IN (
    'sequential','parallel','any_one'
  )),
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  escalation_after_hours INTEGER DEFAULT 24,
  escalate_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_approvals_user ON public.workflow_approvals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_workflow ON public.workflow_approvals(workflow_id);
ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workflow_approvals" ON public.workflow_approvals;
CREATE POLICY "Users manage own workflow_approvals"
  ON public.workflow_approvals FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_workflow_approvals ON public.workflow_approvals;
CREATE TRIGGER set_updated_at_workflow_approvals
  BEFORE UPDATE ON public.workflow_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 4. WORKFLOW_SCHEDULES
-- Cron / one-time / recurring job registry
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once','recurring','cron')),
  schedule_value TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  business_hours_only BOOLEAN NOT NULL DEFAULT FALSE,
  holiday_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_fired_at TIMESTAMPTZ,
  next_fire_at TIMESTAMPTZ,
  fire_count INTEGER NOT NULL DEFAULT 0,
  max_fires INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_user ON public.workflow_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next ON public.workflow_schedules(next_fire_at)
  WHERE is_active = TRUE;
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workflow_schedules" ON public.workflow_schedules;
CREATE POLICY "Users manage own workflow_schedules"
  ON public.workflow_schedules FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_workflow_schedules ON public.workflow_schedules;
CREATE TRIGGER set_updated_at_workflow_schedules
  BEFORE UPDATE ON public.workflow_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 5. WORKFLOW_WEBHOOKS
-- Incoming and outgoing webhook configurations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming','outgoing')),
  endpoint_slug TEXT UNIQUE,
  target_url TEXT,
  secret TEXT,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  retry_config JSONB NOT NULL DEFAULT '{"max_attempts":3,"backoff_seconds":60}'::jsonb,
  rate_limit_config JSONB NOT NULL DEFAULT '{"requests_per_minute":60}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  total_received INTEGER NOT NULL DEFAULT 0,
  total_sent INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_webhooks_user ON public.workflow_webhooks(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_webhooks_slug ON public.workflow_webhooks(endpoint_slug)
  WHERE endpoint_slug IS NOT NULL;
ALTER TABLE public.workflow_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workflow_webhooks" ON public.workflow_webhooks;
CREATE POLICY "Users manage own workflow_webhooks"
  ON public.workflow_webhooks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_workflow_webhooks ON public.workflow_webhooks;
CREATE TRIGGER set_updated_at_workflow_webhooks
  BEFORE UPDATE ON public.workflow_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 6. WORKFLOW_TEMPLATES
-- Enterprise reusable workflow templates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN (
    'crm','lead','sales','marketing','support','ai',
    'meeting','proposal','quotation','payment','retention','custom'
  )),
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read workflow_templates" ON public.workflow_templates;
CREATE POLICY "Read workflow_templates"
  ON public.workflow_templates FOR SELECT TO authenticated
  USING (is_system = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own templates" ON public.workflow_templates;
CREATE POLICY "Users manage own templates"
  ON public.workflow_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own templates" ON public.workflow_templates;
CREATE POLICY "Users update own templates"
  ON public.workflow_templates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own templates" ON public.workflow_templates;
CREATE POLICY "Users delete own templates"
  ON public.workflow_templates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_workflow_templates ON public.workflow_templates;
CREATE TRIGGER set_updated_at_workflow_templates
  BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 7. AI_ROUTING_DECISIONS
-- Log of every AI decision made during workflow execution
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_routing_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  input_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT NOT NULL DEFAULT '',
  intent TEXT,
  sentiment TEXT,
  confidence FLOAT,
  decision TEXT,
  raw_response JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_routing_decisions_user ON public.ai_routing_decisions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_routing_decisions_workflow ON public.ai_routing_decisions(workflow_id);
ALTER TABLE public.ai_routing_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ai_routing_decisions" ON public.ai_routing_decisions;
CREATE POLICY "Users read own ai_routing_decisions"
  ON public.ai_routing_decisions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 8. WORKFLOW_WEBHOOK_LOGS
-- Per-delivery log for outgoing webhooks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES public.workflow_webhooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'success',
  http_status INTEGER,
  request_body JSONB,
  response_body TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  latency_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_webhook_logs_webhook ON public.workflow_webhook_logs(webhook_id, created_at DESC);
ALTER TABLE public.workflow_webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own webhook_logs" ON public.workflow_webhook_logs;
CREATE POLICY "Users read own webhook_logs"
  ON public.workflow_webhook_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 9. SEED: System Workflow Templates
-- ============================================================
INSERT INTO public.workflow_templates (slug, name, description, category, trigger_type, trigger_config, nodes, edges, tags, is_system, user_id)
VALUES
  ('lead_nurturing', 'Lead Nurturing', 'Automatically nurture new leads with follow-up messages and scoring', 'lead', 'new_contact_created', '{}',
   '[{"id":"t1","node_type":"trigger","label":"New Lead","pos_x":100,"pos_y":100,"config":{"event":"new_contact_created"}},{"id":"a1","node_type":"action","label":"Score Lead","pos_x":300,"pos_y":100,"config":{"action":"score_lead"}},{"id":"a2","node_type":"action","label":"Assign Agent","pos_x":500,"pos_y":100,"config":{"action":"assign_agent","mode":"round_robin"}},{"id":"d1","node_type":"delay","label":"Wait 1 Day","pos_x":700,"pos_y":100,"config":{"amount":1,"unit":"days"}},{"id":"a3","node_type":"action","label":"Send Follow-up","pos_x":900,"pos_y":100,"config":{"action":"send_message","text":"Hi! Just checking in. How can we help you today?"}},{"id":"e1","node_type":"end","label":"End","pos_x":1100,"pos_y":100,"config":{}}]',
   '[{"source_node_id":"t1","target_node_id":"a1","edge_label":"default"},{"source_node_id":"a1","target_node_id":"a2","edge_label":"default"},{"source_node_id":"a2","target_node_id":"d1","edge_label":"default"},{"source_node_id":"d1","target_node_id":"a3","edge_label":"default"},{"source_node_id":"a3","target_node_id":"e1","edge_label":"default"}]',
   '{"lead","nurturing","crm"}', TRUE, NULL),

  ('proposal_followup', 'Proposal Follow-up', 'Auto follow-up after proposal sent with escalation if no reply', 'proposal', 'deal_stage_changed', '{"to_stage":"proposal_sent"}',
   '[{"id":"t1","node_type":"trigger","label":"Proposal Sent","pos_x":100,"pos_y":100,"config":{"event":"deal_stage_changed"}},{"id":"d1","node_type":"delay","label":"Wait 2 Days","pos_x":300,"pos_y":100,"config":{"amount":2,"unit":"days"}},{"id":"c1","node_type":"condition","label":"Reply Received?","pos_x":500,"pos_y":100,"config":{"subject":"contact_replied"}},{"id":"a1","node_type":"action","label":"Send Reminder","pos_x":700,"pos_y":200,"config":{"action":"send_message","text":"Just following up on the proposal we sent. Any questions?"}},{"id":"d2","node_type":"delay","label":"Wait 3 More Days","pos_x":900,"pos_y":200,"config":{"amount":3,"unit":"days"}},{"id":"a2","node_type":"action","label":"Escalate to Manager","pos_x":1100,"pos_y":200,"config":{"action":"notify_team","team":"sales","message":"Proposal follow-up needed"}},{"id":"e1","node_type":"end","label":"End","pos_x":700,"pos_y":50,"config":{}}]',
   '[{"source_node_id":"t1","target_node_id":"d1","edge_label":"default"},{"source_node_id":"d1","target_node_id":"c1","edge_label":"default"},{"source_node_id":"c1","target_node_id":"e1","edge_label":"yes"},{"source_node_id":"c1","target_node_id":"a1","edge_label":"no"},{"source_node_id":"a1","target_node_id":"d2","edge_label":"default"},{"source_node_id":"d2","target_node_id":"a2","edge_label":"default"}]',
   '{"proposal","sales","followup"}', TRUE, NULL),

  ('customer_onboarding', 'Customer Onboarding', 'Welcome new customers and guide them through onboarding steps', 'crm', 'payment_received', '{}',
   '[{"id":"t1","node_type":"trigger","label":"Payment Received","pos_x":100,"pos_y":100,"config":{"event":"payment_received"}},{"id":"a1","node_type":"action","label":"Send Welcome","pos_x":300,"pos_y":100,"config":{"action":"send_message","text":"Welcome aboard! Your project has started. We will keep you updated."}},{"id":"a2","node_type":"action","label":"Create Task","pos_x":500,"pos_y":100,"config":{"action":"create_task","title":"Kickoff Call","priority":"high"}},{"id":"a3","node_type":"action","label":"Schedule Meeting","pos_x":700,"pos_y":100,"config":{"action":"schedule_meeting","title":"Project Kickoff"}},{"id":"e1","node_type":"end","label":"End","pos_x":900,"pos_y":100,"config":{}}]',
   '[{"source_node_id":"t1","target_node_id":"a1","edge_label":"default"},{"source_node_id":"a1","target_node_id":"a2","edge_label":"default"},{"source_node_id":"a2","target_node_id":"a3","edge_label":"default"},{"source_node_id":"a3","target_node_id":"e1","edge_label":"default"}]',
   '{"onboarding","crm","customer"}', TRUE, NULL),

  ('support_escalation', 'Support Escalation', 'AI-powered support with automatic human escalation', 'support', 'new_message_received', '{}',
   '[{"id":"t1","node_type":"trigger","label":"Support Request","pos_x":100,"pos_y":100,"config":{"event":"new_message_received"}},{"id":"ai1","node_type":"ai_node","label":"AI Support Agent","pos_x":300,"pos_y":100,"config":{"agent_type":"support","search_knowledge":true}},{"id":"c1","node_type":"condition","label":"Resolved?","pos_x":500,"pos_y":100,"config":{"subject":"ai_resolved"}},{"id":"e1","node_type":"end","label":"Resolved","pos_x":700,"pos_y":50,"config":{}},{"id":"a1","node_type":"action","label":"Escalate to Human","pos_x":700,"pos_y":200,"config":{"action":"assign_conversation","mode":"round_robin"}},{"id":"a2","node_type":"action","label":"Notify Team","pos_x":900,"pos_y":200,"config":{"action":"notify_team","team":"support"}},{"id":"e2","node_type":"end","label":"Escalated","pos_x":1100,"pos_y":200,"config":{}}]',
   '[{"source_node_id":"t1","target_node_id":"ai1","edge_label":"default"},{"source_node_id":"ai1","target_node_id":"c1","edge_label":"default"},{"source_node_id":"c1","target_node_id":"e1","edge_label":"yes"},{"source_node_id":"c1","target_node_id":"a1","edge_label":"no"},{"source_node_id":"a1","target_node_id":"a2","edge_label":"default"},{"source_node_id":"a2","target_node_id":"e2","edge_label":"default"}]',
   '{"support","ai","escalation"}', TRUE, NULL),

  ('payment_reminder', 'Payment Reminder', 'Automated payment reminders with escalation for overdue invoices', 'payment', 'invoice_generated', '{}',
   '[{"id":"t1","node_type":"trigger","label":"Invoice Generated","pos_x":100,"pos_y":100,"config":{"event":"invoice_generated"}},{"id":"a1","node_type":"action","label":"Send Invoice","pos_x":300,"pos_y":100,"config":{"action":"send_invoice"}},{"id":"d1","node_type":"delay","label":"Wait Until Due","pos_x":500,"pos_y":100,"config":{"amount":1,"unit":"days","reference":"due_date"}},{"id":"c1","node_type":"condition","label":"Paid?","pos_x":700,"pos_y":100,"config":{"subject":"payment_status","value":"paid"}},{"id":"e1","node_type":"end","label":"Paid","pos_x":900,"pos_y":50,"config":{}},{"id":"a2","node_type":"action","label":"Payment Reminder","pos_x":900,"pos_y":200,"config":{"action":"send_message","text":"Reminder: Your payment is due. Please complete payment at your earliest."}},{"id":"d2","node_type":"delay","label":"Wait 3 Days","pos_x":1100,"pos_y":200,"config":{"amount":3,"unit":"days"}},{"id":"a3","node_type":"action","label":"Escalate","pos_x":1300,"pos_y":200,"config":{"action":"notify_team","team":"accounts","message":"Overdue payment needs attention"}},{"id":"e2","node_type":"end","label":"Escalated","pos_x":1500,"pos_y":200,"config":{}}]',
   '[{"source_node_id":"t1","target_node_id":"a1","edge_label":"default"},{"source_node_id":"a1","target_node_id":"d1","edge_label":"default"},{"source_node_id":"d1","target_node_id":"c1","edge_label":"default"},{"source_node_id":"c1","target_node_id":"e1","edge_label":"yes"},{"source_node_id":"c1","target_node_id":"a2","edge_label":"no"},{"source_node_id":"a2","target_node_id":"d2","edge_label":"default"},{"source_node_id":"d2","target_node_id":"a3","edge_label":"default"},{"source_node_id":"a3","target_node_id":"e2","edge_label":"default"}]',
   '{"payment","invoice","reminder"}', TRUE, NULL),

  ('retention_campaign', 'Customer Retention', 'Re-engage inactive customers with targeted offers', 'retention', 'customer_inactive', '{"inactive_days":30}',
   '[{"id":"t1","node_type":"trigger","label":"Customer Inactive 30 Days","pos_x":100,"pos_y":100,"config":{"event":"customer_inactive","days":30}},{"id":"ai1","node_type":"ai_node","label":"Generate Personalized Offer","pos_x":300,"pos_y":100,"config":{"agent_type":"marketing","generate_offer":true}},{"id":"a1","node_type":"action","label":"Send Re-engagement Message","pos_x":500,"pos_y":100,"config":{"action":"send_message","text":"We miss you! Here is a special offer just for you."}},{"id":"d1","node_type":"delay","label":"Wait 7 Days","pos_x":700,"pos_y":100,"config":{"amount":7,"unit":"days"}},{"id":"c1","node_type":"condition","label":"Re-engaged?","pos_x":900,"pos_y":100,"config":{"subject":"customer_replied"}},{"id":"e1","node_type":"end","label":"Re-engaged","pos_x":1100,"pos_y":50,"config":{}},{"id":"a2","node_type":"action","label":"Add to Churn List","pos_x":1100,"pos_y":200,"config":{"action":"add_tag","tag":"at_risk"}},{"id":"e2","node_type":"end","label":"At Risk","pos_x":1300,"pos_y":200,"config":{}}]',
   '[{"source_node_id":"t1","target_node_id":"ai1","edge_label":"default"},{"source_node_id":"ai1","target_node_id":"a1","edge_label":"default"},{"source_node_id":"a1","target_node_id":"d1","edge_label":"default"},{"source_node_id":"d1","target_node_id":"c1","edge_label":"default"},{"source_node_id":"c1","target_node_id":"e1","edge_label":"yes"},{"source_node_id":"c1","target_node_id":"a2","edge_label":"no"},{"source_node_id":"a2","target_node_id":"e2","edge_label":"default"}]',
   '{"retention","churn","marketing"}', TRUE, NULL)

ON CONFLICT (slug) DO NOTHING;
