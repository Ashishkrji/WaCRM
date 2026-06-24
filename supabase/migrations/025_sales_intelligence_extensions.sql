-- ============================================================
-- 025_sales_intelligence_extensions.sql
-- Upgrades CRM schema to support Sales Intelligence, Lead qualification,
-- Meeting Intelligence, and Proposal/Quotation billing linkages.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. MEETING BOOKINGS EXTENSIONS
-- Adds Meeting Agenda, Notes, Summary, Recording, and Platform.
-- ============================================================
ALTER TABLE public.meeting_bookings
  ADD COLUMN IF NOT EXISTS agenda TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS recording_link TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'other';

-- Re-apply check constraint for platform if it doesn't exist
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

-- ============================================================
-- 2. INVOICES & PAYMENTS EXTENSIONS
-- Links invoices and payments directly to proposals and quotations.
-- ============================================================
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposal_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES public.quotation_requests(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposal_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES public.quotation_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_proposal ON public.invoices(proposal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quotation ON public.invoices(quotation_id);
CREATE INDEX IF NOT EXISTS idx_payments_proposal ON public.payments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_payments_quotation ON public.payments(quotation_id);

-- ============================================================
-- 3. DEALS / OPPORTUNITY EXTENSIONS
-- Adds Lead Score, Lead Category, Urgency, and Timeline.
-- ============================================================
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_category TEXT DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS urgency TEXT,
  ADD COLUMN IF NOT EXISTS timeline TEXT;

-- Re-apply check constraint for lead_category if it doesn't exist
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
