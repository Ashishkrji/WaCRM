-- ========================================================
-- 034_saas_schema.sql
-- SaaS Multi-Tenancy, Subscription Management & Feature Flags
-- ========================================================

-- ─── Tenants ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,             -- Used for subdomain: slug.wacrm.app
  domain TEXT UNIQUE,                    -- Custom domain
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('trial','active','suspended','cancelled')),
  trial_end DATE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  country TEXT DEFAULT 'IN',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  currency TEXT DEFAULT 'INR',
  max_users INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Tenant Members ──────────────────────────────────────

CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'manager', 'agent', 'viewer');

CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role tenant_role DEFAULT 'agent',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE(tenant_id, user_id)
);

-- ─── Feature Flags ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_global BOOLEAN DEFAULT false,       -- On for everyone
  plan_codes TEXT[] DEFAULT '{}',        -- Plans that have this feature
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, feature_key)
);

-- ─── Usage Quotas ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  resource TEXT NOT NULL,                -- "contacts", "messages", "ai_requests", etc.
  limit_value INTEGER DEFAULT -1,        -- -1 = unlimited
  current_value INTEGER DEFAULT 0,
  reset_period TEXT DEFAULT 'monthly',   -- 'daily', 'monthly', 'yearly', 'never'
  reset_at TIMESTAMPTZ,
  is_hard_limit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, resource)
);

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resource TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Billing / Invoices for Tenants ──────────────────────

CREATE TABLE IF NOT EXISTS saas_billing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  gateway TEXT DEFAULT 'razorpay',
  gateway_invoice_id TEXT,
  gateway_payment_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- ─── Audit Log ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_tenant_id ON usage_quotas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_id ON usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_tenant_id ON tenant_audit_log(tenant_id);

-- ─── RLS ─────────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_audit_log ENABLE ROW LEVEL SECURITY;

-- Tenants visible to owner + members
CREATE POLICY IF NOT EXISTS "tenants_owner_policy" ON tenants FOR ALL USING (owner_id = auth.uid());
CREATE POLICY IF NOT EXISTS "tenant_members_user_policy" ON tenant_members FOR ALL USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "tenant_feature_overrides_member_policy" ON tenant_feature_overrides
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );
CREATE POLICY IF NOT EXISTS "usage_quotas_member_policy" ON usage_quotas
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- ─── Default Feature Flags ───────────────────────────────

INSERT INTO feature_flags (feature_key, name, description, plan_codes) VALUES
  ('whatsapp_inbox', 'WhatsApp Inbox', 'WhatsApp messaging', '{free,starter,growth,enterprise}'),
  ('workflow_engine', 'Workflow Engine', 'Multi-node automation', '{starter,growth,enterprise}'),
  ('analytics_bi', 'Business Intelligence', 'Advanced analytics', '{growth,enterprise}'),
  ('ai_agents', 'AI Agents', 'AI-powered agents', '{starter,growth,enterprise}'),
  ('knowledge_base', 'Knowledge Base', 'Knowledge management', '{starter,growth,enterprise}'),
  ('gst_invoicing', 'GST Invoicing', 'GST-compliant invoicing', '{starter,growth,enterprise}'),
  ('seo_module', 'SEO Module', 'Keyword tracking & SEO', '{growth,enterprise}'),
  ('support_tickets', 'Support Tickets', 'Customer support system', '{growth,enterprise}'),
  ('custom_ai_models', 'Custom AI Models', 'Custom NVIDIA AI models', '{enterprise}'),
  ('api_access', 'API Access', 'REST API access', '{growth,enterprise}'),
  ('multi_user', 'Multi User', 'Multiple team members', '{starter,growth,enterprise}'),
  ('white_label', 'White Label', 'Custom branding', '{enterprise}')
ON CONFLICT (feature_key) DO NOTHING;
