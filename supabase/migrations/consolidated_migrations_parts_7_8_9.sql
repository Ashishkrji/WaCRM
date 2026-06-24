-- ============================================================================
-- CONSOLIDATED MIGRATIONS — PARTS 7, 8, & 9 (CRM, SALES & MARKETING)
-- ============================================================================
-- This consolidated script contains all schema extensions for:
--   - Part 7: Enterprise CRM, Shared Inbox, and Tasks
--   - Part 8: Sales Intelligence, Proposals, Quotations, and Revenue Forecasting
--   - Part 9: Marketing Automation, Campaigns, Emails, Referrals, and UTMs
--
-- Running this in the Supabase SQL Editor will configure all required tables,
-- columns, indexes, Row-Level Security (RLS) policies, and triggers.
-- Safe and idempotent: can be run multiple times without losing data.
-- ============================================================================

-- ============================================================================
-- 1. BASE TABLE UPGRADES & COLUMNS (CONVERSATIONS, CONTACTS, DEALS, PROFILES)
-- ============================================================================

-- CONVERSATIONS channel and metrics
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS spam BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sla_first_response_time INTEGER,
  ADD COLUMN IF NOT EXISTS sla_avg_response_time INTEGER,
  ADD COLUMN IF NOT EXISTS sla_resolution_time INTEGER,
  ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_pinned ON public.conversations(pinned) WHERE pinned = TRUE;

-- MESSAGES internal flags
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

-- CONTACTS enterprise upgrades & marketing flags
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON public.contacts(owner_id);

-- PROFILES availability status & permissions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'online' CHECK (availability IN ('online', 'busy', 'away')),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- QUICK REPLIES category
ALTER TABLE public.quick_replies
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- ============================================================================
-- 2. CRM TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  recurring TEXT, -- 'daily', 'weekly', 'monthly', or NULL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON public.tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.tasks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. PROPOSALS, QUOTATIONS & MEETING BOOKINGS
-- ============================================================================

-- MEETING BOOKINGS extensions
ALTER TABLE public.meeting_bookings
  ADD COLUMN IF NOT EXISTS agenda TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS recording_link TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'other';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'meeting_bookings_platform_check' 
      AND conrelid = 'public.meeting_bookings'::regclass
  ) THEN
    ALTER TABLE public.meeting_bookings
      ADD CONSTRAINT meeting_bookings_platform_check 
      CHECK (platform IN ('google_meet', 'zoom', 'teams', 'other'));
  END IF;
END $$;

-- ============================================================================
-- 4. BILLING & FINANCIAL SUITE (INVOICES & PAYMENTS)
-- ============================================================================

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date TIMESTAMPTZ,
  services TEXT[] DEFAULT '{}',
  proposal_id UUID REFERENCES public.proposal_requests(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotation_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact ON public.invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_proposal ON public.invoices(proposal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quotation ON public.invoices(quotation_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.invoices;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  transaction_id TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  proposal_id UUID REFERENCES public.proposal_requests(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotation_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_contact ON public.payments(contact_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_proposal ON public.payments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_payments_quotation ON public.payments(quotation_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own payments" ON public.payments;
CREATE POLICY "Users can manage own payments"
  ON public.payments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 5. DEALS & PIPELINES
-- ============================================================================
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS probability NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_revenue NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposal_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES public.quotation_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_category TEXT DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS urgency TEXT,
  ADD COLUMN IF NOT EXISTS timeline TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'deals_lead_category_check' 
      AND conrelid = 'public.deals'::regclass
  ) THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_lead_category_check 
      CHECK (lead_category IN ('hot', 'warm', 'cold', 'dormant', 'vip', 'enterprise'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deals_lead_score ON public.deals(lead_score);
CREATE INDEX IF NOT EXISTS idx_deals_lead_category ON public.deals(lead_category);

-- ============================================================================
-- 6. AUDIENCE SEGMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audience_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}', -- e.g. { "lead_category": "hot", "tags": ["SEO"] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audience_segments_user ON public.audience_segments(user_id);

ALTER TABLE public.audience_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own audience_segments" ON public.audience_segments;
CREATE POLICY "Users can manage own audience_segments"
  ON public.audience_segments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.audience_segments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.audience_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. BROADCAST CAMPAIGNS (UPGRADED)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed')),
  sent_count INTEGER DEFAULT 0,
  delivery_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  audience_segment_id UUID REFERENCES public.audience_segments(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}', -- Stores email body, templates, drip sequence steps
  media_url TEXT,
  scheduled_at TIMESTAMPTZ,
  cost NUMERIC(12,2) DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  category TEXT DEFAULT 'promotional',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-apply constraints
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_type_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_type_check 
  CHECK (type IN ('whatsapp', 'email', 'sms', 'telegram', 'messenger', 'instagram', 'custom'));

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_segment ON public.campaigns(audience_segment_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON public.campaigns(category);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage own campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.campaigns;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. EMAIL CAMPAIGNS Details
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_campaign ON public.email_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user ON public.email_campaigns(user_id);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own email_campaigns" ON public.email_campaigns;
CREATE POLICY "Users can manage own email_campaigns"
  ON public.email_campaigns FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.email_campaigns;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. ADVOCACY & REFERRALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  referred_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'paid')),
  reward_details TEXT,
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_referred UNIQUE (referred_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_user ON public.referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_contact_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_contact_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own referrals" ON public.referrals;
CREATE POLICY "Users can manage own referrals"
  ON public.referrals FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.referrals;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. UTM CAMPAIGN & CLICK ATTRIBUTION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.utm_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  url_path TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  device_type TEXT,
  location_country TEXT,
  conversion_type TEXT, -- e.g. 'lead_form', 'meeting_booked'
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utm_tracking_user ON public.utm_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_contact ON public.utm_tracking(contact_id);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_source ON public.utm_tracking(utm_source);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_campaign ON public.utm_tracking(utm_campaign);

ALTER TABLE public.utm_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own utm_tracking" ON public.utm_tracking;
CREATE POLICY "Users can manage own utm_tracking"
  ON public.utm_tracking FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 11. CUSTOMER JOURNEY TIMELINES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('visitor', 'lead', 'qualified', 'meeting', 'proposal', 'quotation', 'payment', 'project', 'support', 'retention', 'upsell')),
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  exited_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_journeys_user ON public.customer_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_contact ON public.customer_journeys(contact_id);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_stage ON public.customer_journeys(stage);

ALTER TABLE public.customer_journeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own customer_journeys" ON public.customer_journeys;
CREATE POLICY "Users can manage own customer_journeys"
  ON public.customer_journeys FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 12. CRM SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crm_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  settings JSONB DEFAULT '{}', -- stores custom pipeline stages, SLA config, custom roles mapping
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_settings_user ON public.crm_settings(user_id);

ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own crm_settings" ON public.crm_settings;
CREATE POLICY "Users can manage own crm_settings"
  ON public.crm_settings FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.crm_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.crm_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
