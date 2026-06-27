-- ============================================================
-- 037_lead_scoring_schema.sql
-- Lead Scoring, Behavioral Signals, Conversion Predictions
-- ============================================================

-- ─── Lead Scores ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id UUID,    -- references CRM leads table if exists
  total_score INTEGER DEFAULT 0,       -- 0-100
  demographic_score INTEGER DEFAULT 0,
  behavioral_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  fit_score INTEGER DEFAULT 0,
  score_grade TEXT DEFAULT 'C' CHECK (score_grade IN ('A+','A','B','C','D','F')),
  is_mql BOOLEAN DEFAULT false,        -- Marketing Qualified Lead
  is_sql BOOLEAN DEFAULT false,        -- Sales Qualified Lead
  conversion_probability NUMERIC(5,2) DEFAULT 0,  -- 0-100%
  predicted_deal_value NUMERIC(12,2),
  predicted_close_date DATE,
  last_scored_at TIMESTAMPTZ DEFAULT now(),
  score_history JSONB DEFAULT '[]',    -- [{score, date, reason}]
  ai_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

-- ─── Behavioral Signals ──────────────────────────────────────

CREATE TYPE signal_type AS ENUM (
  'page_visit','form_submit','email_open','email_click','whatsapp_reply',
  'whatsapp_open','document_view','pricing_page','demo_request','webinar_attend',
  'content_download','chat_start','call_made','meeting_booked','proposal_viewed',
  'invoice_opened','cart_abandon','product_view','custom'
);

CREATE TABLE IF NOT EXISTS public.lead_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  signal_type signal_type NOT NULL,
  signal_value INTEGER DEFAULT 1,    -- Point weight
  source TEXT,
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Scoring Rules ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT DEFAULT 'behavioral' CHECK (rule_type IN ('demographic','behavioral','engagement','fit')),
  condition_field TEXT NOT NULL,
  condition_operator TEXT NOT NULL,  -- 'equals','contains','gt','lt','exists'
  condition_value TEXT,
  score_points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Conversion Predictions History ─────────────────────────

CREATE TABLE IF NOT EXISTS public.conversion_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  probability NUMERIC(5,2) NOT NULL,
  predicted_value NUMERIC(12,2),
  predicted_close_date DATE,
  model_version TEXT DEFAULT '1.0',
  ai_reasoning TEXT,
  actual_outcome TEXT,  -- 'converted','lost',null (pending)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_lead_scores_user ON lead_scores(user_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_signals_contact ON lead_signals(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_signals_user ON lead_signals(user_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_conversion_predictions_contact ON conversion_predictions(contact_id, created_at DESC);

-- ─── RLS ────────────────────────────────────────────────────

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_predictions ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['lead_scores','lead_signals','scoring_rules','conversion_predictions'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_user" ON public.%s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;

-- ─── Default Scoring Rules ───────────────────────────────────

INSERT INTO public.scoring_rules (user_id, name, rule_type, condition_field, condition_operator, condition_value, score_points, is_active)
SELECT 
  id as user_id,
  rule_name, rule_type, cond_field, cond_op, cond_val, pts, true
FROM auth.users,
(VALUES
  ('WhatsApp Reply',       'behavioral',  'signal_type', 'equals', 'whatsapp_reply',   15),
  ('Demo Request',         'behavioral',  'signal_type', 'equals', 'demo_request',     30),
  ('Pricing Page Visit',   'behavioral',  'signal_type', 'equals', 'pricing_page',     20),
  ('Form Submission',      'behavioral',  'signal_type', 'equals', 'form_submit',      25),
  ('Document View',        'behavioral',  'signal_type', 'equals', 'document_view',    10),
  ('Meeting Booked',       'behavioral',  'signal_type', 'equals', 'meeting_booked',   35),
  ('Has Phone',            'demographic', 'phone',       'exists', NULL,               10),
  ('Has Company',          'demographic', 'company',     'exists', NULL,               15)
) AS rules(rule_name, rule_type, cond_field, cond_op, cond_val, pts)
ON CONFLICT DO NOTHING;
