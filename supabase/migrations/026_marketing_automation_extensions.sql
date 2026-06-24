-- ============================================================
-- 026_marketing_automation_extensions.sql
-- Upgrades schema to support Marketing Automation, Campaigns, Email,
-- Referrals, UTM Attribution, and Customer Journeys.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- 0. CONVERSATIONS TABLE CHANNEL UPGRADE
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'whatsapp';

-- 1. CONTACTS TABLE UPGRADES
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. AUDIENCE SEGMENTS TABLE
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

-- Trigger for updated_at on audience_segments
DROP TRIGGER IF EXISTS set_updated_at ON public.audience_segments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.audience_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. CAMPAIGNS TABLE UPGRADES & ENHANCEMENTS
-- Modify Campaign type check constraint to include more channels
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_type_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_type_check 
  CHECK (type IN ('whatsapp', 'email', 'sms', 'telegram', 'messenger', 'instagram', 'custom'));

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS audience_segment_id UUID REFERENCES public.audience_segments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}', -- Stores email body, templates, drip sequence steps
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cost NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'promotional';

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_segment ON public.campaigns(audience_segment_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON public.campaigns(category);

-- 4. EMAIL CAMPAIGNS DETAILS
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

-- Trigger for updated_at on email_campaigns
DROP TRIGGER IF EXISTS set_updated_at ON public.email_campaigns;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. REFERRALS TABLE
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

-- Trigger for updated_at on referrals
DROP TRIGGER IF EXISTS set_updated_at ON public.referrals;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. UTM TRACKING TABLE
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
  conversion_type TEXT, -- e.g. lead_form, quotation, payment
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

-- 7. CUSTOMER LIFECYCLE JOURNEY
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
