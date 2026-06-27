-- ============================================================
-- 035_enterprise_admin_schema.sql
-- Enterprise Admin Control Center — RBAC, Employees, Org,
-- AI Config, Security, Audit, API Keys, System Health, Backup
-- ============================================================

-- ─── Extend profiles with employee fields ───────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"start":"09:00","end":"18:00"}',
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'online' CHECK (availability IN ('online','busy','away','offline')),
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS devices JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ─── Roles ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crm_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = system role
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,  -- lower = higher authority
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.crm_roles (name, code, description, is_system, priority) VALUES
  ('Super Admin',        'super_admin',        'Full system access', true, 0),
  ('Administrator',      'admin',              'All CRM modules', true, 10),
  ('Manager',            'manager',            'Team management', true, 20),
  ('Sales Manager',      'sales_manager',      'Sales team lead', true, 30),
  ('Sales Executive',    'sales_executive',    'Sales rep', true, 40),
  ('Support Manager',    'support_manager',    'Support team lead', true, 30),
  ('Support Executive',  'support_executive',  'Support agent', true, 40),
  ('Marketing Manager',  'marketing_manager',  'Marketing team lead', true, 30),
  ('Marketing Executive','marketing_executive','Campaign manager', true, 40),
  ('Accountant',         'accountant',         'Finance access', true, 40),
  ('HR',                 'hr',                 'HR module access', true, 40),
  ('Developer',          'developer',          'Dev tools access', true, 30)
ON CONFLICT (code) DO NOTHING;

-- ─── Permissions ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crm_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,  -- e.g. "contacts.create"
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed permission matrix
DO $$ 
DECLARE 
  modules TEXT[] := ARRAY['contacts','inbox','leads','deals','meetings','tasks','campaigns','broadcast','reports','analytics','knowledge','prompts','ai_providers','workflows','settings','billing','audit_logs','api','webhooks','developer','users','employees','roles','support','seo','gst'];
  actions TEXT[] := ARRAY['view','create','update','delete','approve','export','import'];
  m TEXT; a TEXT;
BEGIN
  FOREACH m IN ARRAY modules LOOP
    FOREACH a IN ARRAY actions LOOP
      INSERT INTO public.crm_permissions (module, action, code, description)
      VALUES (m, a, m || '.' || a, initcap(a) || ' ' || initcap(m))
      ON CONFLICT (code) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ─── Role ↔ Permission Matrix ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT NOT NULL REFERENCES public.crm_roles(code) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES public.crm_permissions(code) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_code, permission_code)
);

-- ─── User Role Assignments ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES public.crm_roles(code) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_code)
);

-- ─── Organization Settings ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT 'My Company',
  logo_url TEXT,
  favicon_url TEXT,
  brand_primary_color TEXT DEFAULT '#6366f1',
  brand_secondary_color TEXT DEFAULT '#8b5cf6',
  business_type TEXT DEFAULT 'b2b',
  gstin TEXT,
  pan TEXT,
  address JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  business_hours JSONB DEFAULT '{"start":"09:00","end":"18:00"}',
  currency TEXT DEFAULT 'INR',
  language TEXT DEFAULT 'en',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  email TEXT,
  phone TEXT,
  website TEXT,
  support_email TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_series INTEGER DEFAULT 1001,
  fiscal_year_start INTEGER DEFAULT 4,  -- April
  smtp_config JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ─── AI Provider Configuration ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,   -- 'nvidia','openai','gemini','claude','openrouter'
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,  -- 1=primary, 2=fallback
  api_key_encrypted TEXT,
  api_base_url TEXT,
  default_model TEXT,
  available_models TEXT[] DEFAULT '{}',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  top_p NUMERIC(3,2) DEFAULT 0.9,
  top_k INTEGER DEFAULT 40,
  streaming BOOLEAN DEFAULT false,
  monthly_cost_limit NUMERIC(10,2),
  monthly_request_limit INTEGER,
  current_month_cost NUMERIC(10,2) DEFAULT 0,
  current_month_requests INTEGER DEFAULT 0,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy','degraded','down','unknown')),
  last_health_check TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- ─── Security Policies ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_symbols BOOLEAN DEFAULT false,
  password_expiry_days INTEGER DEFAULT 90,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  session_timeout_minutes INTEGER DEFAULT 480,
  max_sessions_per_user INTEGER DEFAULT 3,
  force_2fa_for_admins BOOLEAN DEFAULT false,
  ip_whitelist TEXT[] DEFAULT '{}',
  ip_blacklist TEXT[] DEFAULT '{}',
  allowed_domains TEXT[] DEFAULT '{}',
  require_email_verification BOOLEAN DEFAULT true,
  audit_all_actions BOOLEAN DEFAULT true,
  rate_limit_per_minute INTEGER DEFAULT 60,
  api_rate_limit_per_hour INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ─── API Keys ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,           -- First 8 chars (visible)
  key_hash TEXT NOT NULL UNIQUE,      -- Hashed full key
  scopes TEXT[] DEFAULT '{"read"}',
  rate_limit_per_hour INTEGER DEFAULT 1000,
  allowed_ips TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- ─── System Health Snapshots ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  db_status TEXT DEFAULT 'unknown',
  db_latency_ms INTEGER,
  ai_status TEXT DEFAULT 'unknown',
  ai_latency_ms INTEGER,
  whatsapp_status TEXT DEFAULT 'unknown',
  queue_size INTEGER DEFAULT 0,
  active_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  cpu_usage NUMERIC(5,2),
  memory_usage NUMERIC(5,2),
  storage_used_bytes BIGINT,
  error_rate NUMERIC(5,2),
  request_rate NUMERIC(8,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_health_created ON system_health_snapshots(created_at DESC);

-- ─── Backup Records ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.backup_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('database','knowledge','workflows','prompts','settings','full')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  triggered_by TEXT DEFAULT 'manual',  -- 'manual','scheduled','auto'
  metadata JSONB DEFAULT '{}'
);

-- ─── Admin Notifications ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','warning','critical','error')),
  category TEXT DEFAULT 'system',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_user ON admin_notifications(user_id, is_read, created_at DESC);

-- ─── Prompt Management ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',  -- [{name, description, default}]
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  test_result TEXT,
  use_count INTEGER DEFAULT 0,
  avg_response_quality NUMERIC(3,2),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Extended Audit Log ────────────────────────────────────

ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS resource TEXT,
  ADD COLUMN IF NOT EXISTS resource_id TEXT,
  ADD COLUMN IF NOT EXISTS old_value JSONB,
  ADD COLUMN IF NOT EXISTS new_value JSONB,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action, created_at DESC);

-- ─── RLS ──────────────────────────────────────────────────

ALTER TABLE public.crm_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Roles: visible to all authenticated, editable by admins only
CREATE POLICY IF NOT EXISTS "crm_roles_read" ON public.crm_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "crm_permissions_read" ON public.crm_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "role_permissions_read" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "user_roles_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- User-scoped tables
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['organization_settings','ai_provider_config','security_policies','api_keys','system_health_snapshots','backup_records','admin_notifications','prompt_templates'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_owner" ON public.%s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;

CREATE POLICY IF NOT EXISTS "prompt_versions_owner" ON public.prompt_versions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.prompt_templates pt WHERE pt.id = prompt_id AND pt.user_id = auth.uid())
);
