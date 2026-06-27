-- ============================================================
-- 039_commerce_enhanced_schema.sql
-- WhatsApp Commerce: Products, Catalog Sync, Orders, Cart
-- Extends existing 015_commerce_products.sql
-- ============================================================

-- ─── Extend existing products table ─────────────────────────

ALTER TABLE public.commerce_products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS weight NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_threshold INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 18,
  ADD COLUMN IF NOT EXISTS hsn_code TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_product_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_catalog_id TEXT,
  ADD COLUMN IF NOT EXISTS is_synced_to_whatsapp BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- ─── Product Categories ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- ─── WhatsApp Catalogs ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.whatsapp_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  vertical TEXT DEFAULT 'retail',
  is_active BOOLEAN DEFAULT true,
  product_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending','syncing','synced','failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, catalog_id)
);

-- ─── Orders ─────────────────────────────────────────────────

CREATE TYPE order_status AS ENUM ('pending','confirmed','processing','shipped','delivered','cancelled','refunded','returned');
CREATE TYPE payment_method_type AS ENUM ('cod','upi','card','netbanking','wallet','razorpay','stripe','whatsapp_pay');

CREATE TABLE IF NOT EXISTS public.commerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  shipping_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  payment_method payment_method_type DEFAULT 'upi',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_reference TEXT,
  shipping_address JSONB DEFAULT '{}',
  billing_address JSONB DEFAULT '{}',
  notes TEXT,
  coupon_code TEXT,
  source TEXT DEFAULT 'whatsapp' CHECK (source IN ('whatsapp','web','manual','api')),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Order Items ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commerce_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.commerce_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.commerce_products(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL,
  product_snapshot JSONB DEFAULT '{}'
);

-- ─── Cart / Checkout Sessions ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commerce_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  items JSONB DEFAULT '[]',   -- [{product_id, quantity, price, name, image}]
  total NUMERIC(12,2) DEFAULT 0,
  checkout_message_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','checkout_sent','ordered','abandoned')),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_commerce_orders_user ON commerce_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_contact ON commerce_orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_status ON commerce_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_commerce_order_items_order ON commerce_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_commerce_carts_contact ON commerce_carts(contact_id);

-- ─── RLS ─────────────────────────────────────────────────────

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_carts ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['product_categories','whatsapp_catalogs','commerce_orders','commerce_order_items','commerce_carts'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_user" ON public.%s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;
