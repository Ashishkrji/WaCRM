-- ============================================================
-- 021_enterprise_ai_additions.sql
-- Creates tables for Meeting Bookings, Proposals, Quotations, and Model Settings.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- MEETING_BOOKINGS
-- Tracks client consultations scheduled by AI.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meeting_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_bookings_user ON public.meeting_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_contact ON public.meeting_bookings(contact_id);

ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own meeting_bookings" ON public.meeting_bookings;
CREATE POLICY "Users can manage own meeting_bookings"
  ON public.meeting_bookings FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.meeting_bookings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.meeting_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- PROPOSAL_REQUESTS
-- Stores AI-generated digital agency proposals.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proposal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  service_required TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  proposal_pdf_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'signed', 'sent', 'failed')),
  client_signature TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_requests_user ON public.proposal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_requests_contact ON public.proposal_requests(contact_id);

ALTER TABLE public.proposal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own proposal_requests" ON public.proposal_requests;
CREATE POLICY "Users can manage own proposal_requests"
  ON public.proposal_requests FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.proposal_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.proposal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- QUOTATION_REQUESTS
-- Stores AI-generated client quotations with item details.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  service_required TEXT NOT NULL,
  items JSONB DEFAULT '[]', -- [{description, quantity, price}]
  total_amount NUMERIC(12,2) DEFAULT 0,
  quote_pdf_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'paid', 'sent', 'failed')),
  client_signature TEXT,
  signed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_requests_user ON public.quotation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quotation_requests_contact ON public.quotation_requests(contact_id);

ALTER TABLE public.quotation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own quotation_requests" ON public.quotation_requests;
CREATE POLICY "Users can manage own quotation_requests"
  ON public.quotation_requests FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.quotation_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.quotation_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- MODEL_SETTINGS
-- Per-user, per-provider customized model settings.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.model_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1024,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_model_settings_user ON public.model_settings(user_id);

ALTER TABLE public.model_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own model_settings" ON public.model_settings;
CREATE POLICY "Users can manage own model_settings"
  ON public.model_settings FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.model_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.model_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
