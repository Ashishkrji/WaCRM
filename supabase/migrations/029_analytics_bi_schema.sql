-- ============================================================
-- 029_analytics_bi_schema.sql
-- Analytics & Business Intelligence Platform Schema
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. ANALYTICS_SNAPSHOTS
-- Daily aggregated KPI snapshots per user/workspace
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  -- Sales KPIs
  new_leads INTEGER NOT NULL DEFAULT 0,
  qualified_leads INTEGER NOT NULL DEFAULT 0,
  hot_leads INTEGER NOT NULL DEFAULT 0,
  won_deals INTEGER NOT NULL DEFAULT 0,
  lost_deals INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  pipeline_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  avg_deal_size NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- Customer KPIs
  new_customers INTEGER NOT NULL DEFAULT 0,
  active_customers INTEGER NOT NULL DEFAULT 0,
  inactive_customers INTEGER NOT NULL DEFAULT 0,
  churn_count INTEGER NOT NULL DEFAULT 0,
  -- Conversation KPIs
  total_conversations INTEGER NOT NULL DEFAULT 0,
  avg_response_time_seconds INTEGER NOT NULL DEFAULT 0,
  avg_resolution_time_seconds INTEGER NOT NULL DEFAULT 0,
  -- AI KPIs
  ai_requests INTEGER NOT NULL DEFAULT 0,
  ai_tokens_used BIGINT NOT NULL DEFAULT 0,
  ai_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  ai_escalations INTEGER NOT NULL DEFAULT 0,
  ai_confidence_avg FLOAT NOT NULL DEFAULT 0,
  -- Marketing KPIs
  campaigns_sent INTEGER NOT NULL DEFAULT 0,
  campaign_reach INTEGER NOT NULL DEFAULT 0,
  -- Workflow KPIs
  workflows_executed INTEGER NOT NULL DEFAULT 0,
  workflow_success_rate FLOAT NOT NULL DEFAULT 0,
  -- Raw aggregated data for drill-down
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date ON public.analytics_snapshots(user_id, snapshot_date DESC);
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own analytics_snapshots" ON public.analytics_snapshots;
CREATE POLICY "Users manage own analytics_snapshots"
  ON public.analytics_snapshots FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 2. ANALYTICS_ALERTS
-- Configurable alert rules and triggered alert history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Alert condition
  metric TEXT NOT NULL,          -- e.g. 'revenue', 'ai_failure_rate', 'lead_aging_hours'
  operator TEXT NOT NULL CHECK (operator IN ('gt','lt','gte','lte','eq','neq')),
  threshold NUMERIC NOT NULL,
  -- 'critical' | 'warning' | 'info'
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('critical','warning','info')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- Cooldown: minimum minutes between repeat alerts
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  -- Notification channels: ['dashboard','whatsapp','email']
  channels TEXT[] NOT NULL DEFAULT '{"dashboard"}',
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_alerts_user ON public.analytics_alerts(user_id);
ALTER TABLE public.analytics_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own analytics_alerts" ON public.analytics_alerts;
CREATE POLICY "Users manage own analytics_alerts"
  ON public.analytics_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_analytics_alerts ON public.analytics_alerts;
CREATE TRIGGER set_updated_at_analytics_alerts
  BEFORE UPDATE ON public.analytics_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 3. ANALYTICS_ALERT_EVENTS
-- History of every time an alert fired
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_alert_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES public.analytics_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  actual_value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_alert_events_user ON public.analytics_alert_events(user_id, created_at DESC);
ALTER TABLE public.analytics_alert_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own alert_events" ON public.analytics_alert_events;
CREATE POLICY "Users manage own alert_events"
  ON public.analytics_alert_events FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 4. BI_REPORTS
-- Saved report configurations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bi_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- 'sales' | 'customers' | 'employees' | 'ai' | 'marketing' | 'financial' | 'custom'
  report_type TEXT NOT NULL DEFAULT 'custom',
  -- Report definition: columns, filters, chart_type, date_range
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Scheduled report: cron expression or null
  schedule TEXT,
  -- Recipients for scheduled reports
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- 'pdf' | 'csv' | 'json' | 'excel'
  export_format TEXT NOT NULL DEFAULT 'pdf',
  last_generated_at TIMESTAMPTZ,
  generate_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_reports_user ON public.bi_reports(user_id);
ALTER TABLE public.bi_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own bi_reports" ON public.bi_reports;
CREATE POLICY "Users manage own bi_reports"
  ON public.bi_reports FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_bi_reports ON public.bi_reports;
CREATE TRIGGER set_updated_at_bi_reports
  BEFORE UPDATE ON public.bi_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 5. KPI_TARGETS
-- User-defined KPI goals for comparison vs actuals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kpi_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  -- 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN (
    'daily','weekly','monthly','quarterly','annual'
  )),
  target_value NUMERIC NOT NULL,
  currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, metric, period)
);

CREATE INDEX IF NOT EXISTS idx_kpi_targets_user ON public.kpi_targets(user_id);
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own kpi_targets" ON public.kpi_targets;
CREATE POLICY "Users manage own kpi_targets"
  ON public.kpi_targets FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 6. COST_TRACKING
-- Per-provider AI token and cost records (daily rollup)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cost_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_date DATE NOT NULL,
  provider TEXT NOT NULL,          -- 'nvidia' | 'openai' | 'google' | 'anthropic' etc.
  model TEXT NOT NULL,
  prompt_tokens BIGINT NOT NULL DEFAULT 0,
  completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tracking_date, provider, model)
);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_user_date ON public.cost_tracking(user_id, tracking_date DESC);
ALTER TABLE public.cost_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own cost_tracking" ON public.cost_tracking;
CREATE POLICY "Users manage own cost_tracking"
  ON public.cost_tracking FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 7. AI_INSIGHTS
-- AI-generated business insights stored for dashboard display
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'revenue_trend' | 'lead_quality' | 'employee_performance' | 'campaign_roi' | 'custom'
  insight_type TEXT NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  -- 'positive' | 'negative' | 'neutral' | 'warning'
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  -- Recommended action
  action TEXT,
  action_url TEXT,
  -- Priority 1 (highest) to 5 (lowest)
  priority INTEGER NOT NULL DEFAULT 3,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_insights(user_id, created_at DESC)
  WHERE is_dismissed = FALSE;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ai_insights" ON public.ai_insights;
CREATE POLICY "Users manage own ai_insights"
  ON public.ai_insights FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 8. SEED: Default Alert Rules
-- Added only if the table is empty (first run)
-- ============================================================
-- Note: These are inserted as system defaults; user_id is NULL
-- meaning they're template rules shown as suggestions.
-- The UI clones them per-user on first login.

-- (No system-level inserts with NULL user_id to keep RLS simple.
--  The app seeds default alerts on first analytics page visit via API.)
