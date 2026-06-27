-- ========================================================
-- 030_gst_payment_schema.sql
-- GST Invoicing, Tax Ledger, Payment Gateway & Billing
-- ========================================================

-- ─── GST Configuration ──────────────────────────────────

CREATE TABLE IF NOT EXISTS gst_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  gstin TEXT NOT NULL,                        -- 15-char GSTIN
  pan TEXT,
  state_code TEXT NOT NULL DEFAULT '09',      -- Default: Uttar Pradesh
  address TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  upi_id TEXT,
  logo_url TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  next_invoice_number INTEGER DEFAULT 1001,
  default_payment_terms_days INTEGER DEFAULT 30,
  signature_url TEXT,
  terms_conditions TEXT,
  is_composition_dealer BOOLEAN DEFAULT false,
  composition_rate NUMERIC(5,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ─── GST Tax Slabs ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS gst_tax_slabs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                          -- e.g. "GST 18%"
  rate NUMERIC(5,2) NOT NULL,                  -- 0, 5, 12, 18, 28
  cgst_rate NUMERIC(5,2) NOT NULL,             -- rate/2
  sgst_rate NUMERIC(5,2) NOT NULL,             -- rate/2
  igst_rate NUMERIC(5,2) NOT NULL,             -- rate (interstate)
  cess_rate NUMERIC(5,2) DEFAULT 0,
  hsn_sac_codes TEXT[],                        -- HSN/SAC codes
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── GST Invoices ────────────────────────────────────────

CREATE TYPE invoice_type AS ENUM ('tax_invoice', 'proforma', 'receipt', 'credit_note', 'debit_note');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'written_off');
CREATE TYPE payment_type AS ENUM ('standard_rated', 'zero_rated', 'exempt', 'nil_rated');

CREATE TABLE IF NOT EXISTS gst_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_type invoice_type DEFAULT 'tax_invoice',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status invoice_status DEFAULT 'draft',
  payment_type payment_type DEFAULT 'standard_rated',

  -- Buyer
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_gstin TEXT,
  buyer_address TEXT,
  buyer_state_code TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,

  -- Amounts (INR, stored as paise / 100)
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  taxable_value NUMERIC(12,2) DEFAULT 0,
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  igst_amount NUMERIC(12,2) DEFAULT 0,
  cess_amount NUMERIC(12,2) DEFAULT 0,
  tds_amount NUMERIC(12,2) DEFAULT 0,
  total_tax NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) DEFAULT 0,
  amount_in_words TEXT,

  -- Currency & conversion
  currency TEXT DEFAULT 'INR',
  exchange_rate NUMERIC(10,4) DEFAULT 1.0,

  -- Transaction details
  place_of_supply TEXT,            -- state code
  reverse_charge BOOLEAN DEFAULT false,
  export_invoice BOOLEAN DEFAULT false,
  eway_bill_no TEXT,
  shipping_charges NUMERIC(10,2) DEFAULT 0,

  -- Meta
  notes TEXT,
  terms TEXT,
  payment_link TEXT,
  qr_code_url TEXT,

  -- Reference
  original_invoice_id UUID REFERENCES gst_invoices(id),  -- for credit/debit notes
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  proposal_id UUID,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

-- ─── Invoice Line Items ───────────────────────────────────

CREATE TABLE IF NOT EXISTS gst_invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES gst_invoices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  hsn_sac TEXT,
  quantity NUMERIC(10,3) DEFAULT 1,
  unit TEXT DEFAULT 'NOS',
  rate NUMERIC(12,2) NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  taxable_value NUMERIC(12,2) NOT NULL,
  tax_slab_id UUID REFERENCES gst_tax_slabs(id),
  tax_rate NUMERIC(5,2) DEFAULT 18,
  cgst_rate NUMERIC(5,2) DEFAULT 9,
  sgst_rate NUMERIC(5,2) DEFAULT 9,
  igst_rate NUMERIC(5,2) DEFAULT 0,
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  igst_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Payment Records ──────────────────────────────────────

CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'neft', 'rtgs', 'imps', 'cheque', 'card', 'razorpay', 'stripe', 'paypal', 'other');
CREATE TYPE payment_gateway AS ENUM ('razorpay', 'stripe', 'paytm', 'cashfree', 'phonepe', 'manual', 'none');

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES gst_invoices(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  method payment_method NOT NULL,
  gateway payment_gateway DEFAULT 'none',
  gateway_payment_id TEXT,          -- Razorpay/Stripe payment ID
  gateway_order_id TEXT,
  gateway_signature TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('pending','success','failed','refunded','partially_refunded')),
  payment_date DATE DEFAULT CURRENT_DATE,
  reference_no TEXT,
  notes TEXT,
  refund_amount NUMERIC(12,2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── GST Tax Ledger ───────────────────────────────────────

CREATE TYPE gst_ledger_type AS ENUM ('cgst_collected', 'sgst_collected', 'igst_collected', 'cgst_paid', 'sgst_paid', 'igst_paid', 'cess_collected', 'cess_paid', 'tds_deducted', 'tds_receivable');

CREATE TABLE IF NOT EXISTS gst_tax_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES gst_invoices(id) ON DELETE SET NULL,
  ledger_type gst_ledger_type NOT NULL,
  period_month INTEGER NOT NULL,   -- 1-12
  period_year INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── GSTR Returns ────────────────────────────────────────

CREATE TYPE gstr_type AS ENUM ('GSTR1', 'GSTR3B', 'GSTR9', 'GSTR9C');
CREATE TYPE gstr_status AS ENUM ('pending', 'prepared', 'filed', 'accepted', 'rejected');

CREATE TABLE IF NOT EXISTS gst_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gstr_type gstr_type NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  status gstr_status DEFAULT 'pending',
  data JSONB NOT NULL DEFAULT '{}',  -- GSTR JSON data
  tax_liability NUMERIC(12,2) DEFAULT 0,
  late_fee NUMERIC(12,2) DEFAULT 0,
  interest NUMERIC(12,2) DEFAULT 0,
  total_payable NUMERIC(12,2) DEFAULT 0,
  arn TEXT,           -- Acknowledgement Reference Number
  filed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, gstr_type, period_month, period_year)
);

-- ─── Subscription Plans (for SaaS preview) ──────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC(10,2) DEFAULT 0,
  price_yearly NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('trial','active','past_due','cancelled','paused')),
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start DATE,
  current_period_end DATE,
  trial_end DATE,
  gateway TEXT DEFAULT 'razorpay',
  gateway_subscription_id TEXT,
  gateway_customer_id TEXT,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gst_invoices_user_id ON gst_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_status ON gst_invoices(status);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_contact_id ON gst_invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_invoice_date ON gst_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_gst_invoice_items_invoice_id ON gst_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_gst_tax_ledger_user_period ON gst_tax_ledger(user_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_gst_returns_user_id ON gst_returns(user_id);

-- ─── Row Level Security ────────────────────────────────────

ALTER TABLE gst_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_tax_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_tax_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies (own data only)
DO $$ DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['gst_config','gst_tax_slabs','gst_invoices','payments','gst_tax_ledger','gst_returns','user_subscriptions'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_user_policy" ON %s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;

CREATE POLICY IF NOT EXISTS "gst_invoice_items_user_policy" ON gst_invoice_items
  FOR ALL USING (user_id = auth.uid());

-- ─── Default GST Slabs ───────────────────────────────────

INSERT INTO gst_tax_slabs (id, user_id, name, rate, cgst_rate, sgst_rate, igst_rate, is_default)
  SELECT gen_random_uuid(), id, name, rate, rate/2, rate/2, rate, rate = 18
  FROM auth.users, (VALUES
    ('GST 0%', 0),
    ('GST 5%', 5),
    ('GST 12%', 12),
    ('GST 18%', 18),
    ('GST 28%', 28)
  ) AS slabs(name, rate)
ON CONFLICT DO NOTHING;

-- ─── Default Subscription Plans ─────────────────────────

INSERT INTO subscription_plans (name, code, price_monthly, price_yearly, features, limits)
VALUES
  ('Free', 'free', 0, 0, '{"contacts":true,"inbox":true,"workflows":false,"analytics":false}', '{"contacts":100,"messages":1000,"workflows":0,"ai_requests":50}'),
  ('Starter', 'starter', 999, 9990, '{"contacts":true,"inbox":true,"workflows":true,"analytics":false}', '{"contacts":2000,"messages":20000,"workflows":5,"ai_requests":500}'),
  ('Growth', 'growth', 2499, 24990, '{"contacts":true,"inbox":true,"workflows":true,"analytics":true}', '{"contacts":10000,"messages":100000,"workflows":50,"ai_requests":5000}'),
  ('Enterprise', 'enterprise', 7999, 79990, '{"contacts":true,"inbox":true,"workflows":true,"analytics":true,"custom_ai":true}', '{"contacts":-1,"messages":-1,"workflows":-1,"ai_requests":-1}')
ON CONFLICT (code) DO NOTHING;
