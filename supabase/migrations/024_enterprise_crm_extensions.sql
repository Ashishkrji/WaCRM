-- ============================================================
-- 024_enterprise_crm_extensions.sql
-- Upgrades schema with Invoices, Payments, Campaigns, CRM Settings,
-- and automated activity triggers.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- PROFILES EXTENSIONS
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Add category to quick_replies
ALTER TABLE public.quick_replies
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- ============================================================
-- INVOICES
-- Tracks client billings, amounts, and payment states.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date TIMESTAMPTZ,
  services TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact ON public.invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.invoices;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PAYMENTS
-- Tracks invoice transactions and payment history.
-- ============================================================
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_contact ON public.payments(contact_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own payments" ON public.payments;
CREATE POLICY "Users can manage own payments"
  ON public.payments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- CAMPAIGNS
-- Tracks marketing campaigns and broadcasts across channels.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'whatsapp' CHECK (type IN ('whatsapp', 'email', 'sms')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed')),
  sent_count INTEGER DEFAULT 0,
  delivery_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage own campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.campaigns;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CRM_SETTINGS
-- Per-user/tenant workspace CRM configurations.
-- ============================================================
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

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.crm_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.crm_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTOMATED CONTACT LAST ACTIVITY TRIGGER
-- Automatically bumps contacts.last_activity_at on new interactions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_contact_last_activity_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  -- Determine contact_id based on the table firing the trigger
  IF TG_TABLE_NAME = 'messages' THEN
    SELECT contact_id INTO v_contact_id 
    FROM public.conversations 
    WHERE id = NEW.conversation_id;
  ELSIF TG_TABLE_NAME = 'meeting_bookings' OR TG_TABLE_NAME = 'tasks' OR TG_TABLE_NAME = 'invoices' OR TG_TABLE_NAME = 'payments' THEN
    v_contact_id := NEW.contact_id;
  END IF;

  -- Update contact's last activity timestamp if found
  IF v_contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET last_activity_at = NOW()
    WHERE id = v_contact_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Messages
DROP TRIGGER IF EXISTS trigger_update_last_activity_msg ON public.messages;
CREATE TRIGGER trigger_update_last_activity_msg
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_activity_fn();

-- Trigger on Meeting Bookings
DROP TRIGGER IF EXISTS trigger_update_last_activity_meeting ON public.meeting_bookings;
CREATE TRIGGER trigger_update_last_activity_meeting
  AFTER INSERT OR UPDATE ON public.meeting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_activity_fn();

-- Trigger on Tasks
DROP TRIGGER IF EXISTS trigger_update_last_activity_task ON public.tasks;
CREATE TRIGGER trigger_update_last_activity_task
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_activity_fn();

-- Trigger on Invoices
DROP TRIGGER IF EXISTS trigger_update_last_activity_invoice ON public.invoices;
CREATE TRIGGER trigger_update_last_activity_invoice
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_activity_fn();

-- Trigger on Payments
DROP TRIGGER IF EXISTS trigger_update_last_activity_payment ON public.payments;
CREATE TRIGGER trigger_update_last_activity_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_activity_fn();
