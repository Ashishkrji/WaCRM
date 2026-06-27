-- ============================================================
-- 027_enterprise_workflow_automation.sql
-- Enterprise Workflow Automation Engine Database Schema
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. WORKFLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'custom',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.workflows(trigger_type) WHERE is_active = TRUE;

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workflows" ON public.workflows;
CREATE POLICY "Users can manage own workflows"
  ON public.workflows FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.workflows;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 2. WORKFLOW_VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  changelog TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow ON public.workflow_versions(workflow_id, version_number DESC);

ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workflow_versions" ON public.workflow_versions;
CREATE POLICY "Users can manage own workflow_versions"
  ON public.workflow_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows w
      WHERE w.id = workflow_versions.workflow_id
        AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows w
      WHERE w.id = workflow_versions.workflow_id
        AND w.user_id = auth.uid()
    )
  );


-- ============================================================
-- 3. WORKFLOW_EXECUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  trigger_event TEXT NOT NULL,
  steps_executed JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running', 'pending_approval')),
  error_message TEXT,
  elapsed_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_user ON public.workflow_executions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON public.workflow_executions(workflow_id);

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own executions" ON public.workflow_executions;
CREATE POLICY "Users can view own executions"
  ON public.workflow_executions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 4. WORKFLOW_APPROVALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'timed_out')),
  approvers JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of user ids / roles allowed to approve
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sequential BOOLEAN NOT NULL DEFAULT FALSE,
  current_approver_index INTEGER NOT NULL DEFAULT 0,
  timeout_hours INTEGER DEFAULT 24,
  timeout_at TIMESTAMPTZ,
  escalated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_approvals_execution ON public.workflow_approvals(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_status ON public.workflow_approvals(status);

ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workflow_approvals" ON public.workflow_approvals;
CREATE POLICY "Users can manage own workflow_approvals"
  ON public.workflow_approvals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows w
      WHERE w.id = workflow_approvals.workflow_id
        AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows w
      WHERE w.id = workflow_approvals.workflow_id
        AND w.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS set_updated_at ON public.workflow_approvals;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.workflow_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 5. WORKFLOW_SCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  cron_expression TEXT, -- NULL for one-time delay jobs
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed', 'cancelled')),
  task_type TEXT NOT NULL DEFAULT 'run_workflow',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_due ON public.workflow_schedules(run_at) WHERE status = 'pending';

ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workflow_schedules" ON public.workflow_schedules;
CREATE POLICY "Users can manage own workflow_schedules"
  ON public.workflow_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows w
      WHERE w.id = workflow_schedules.workflow_id
        AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows w
      WHERE w.id = workflow_schedules.workflow_id
        AND w.user_id = auth.uid()
    )
  );


-- ============================================================
-- 6. WORKFLOW_NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'dashboard' CHECK (channel IN ('dashboard', 'whatsapp', 'email', 'push')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'sent', 'failed')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_notifications_user ON public.workflow_notifications(user_id, status);

ALTER TABLE public.workflow_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notifications" ON public.workflow_notifications;
CREATE POLICY "Users can manage own notifications"
  ON public.workflow_notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 7. WORKFLOW_TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public templates are readable by all authenticated users
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read templates" ON public.workflow_templates;
CREATE POLICY "Anyone can read templates"
  ON public.workflow_templates FOR SELECT
  TO authenticated
  USING (TRUE);


-- ============================================================
-- 8. WEBHOOK_CONFIGURATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  retry_limit INTEGER NOT NULL DEFAULT 3,
  rate_limit INTEGER NOT NULL DEFAULT 60, -- requests/minute
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhook_configurations(user_id);

ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own webhooks" ON public.webhook_configurations;
CREATE POLICY "Users can manage own webhooks"
  ON public.webhook_configurations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 9. Realtime Subscriptions
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'workflow_executions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workflow_executions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'workflow_approvals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workflow_approvals;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'workflow_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workflow_notifications;
  END IF;
END $$;
