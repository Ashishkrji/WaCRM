-- ============================================================
-- 016_saas_subscription_workspaces.sql
-- ============================================================

-- Alter profiles to support subscription plans
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'growth', 'enterprise'));

-- Create business_workspaces table for multi-identity/workspace support (Enterprise)
CREATE TABLE IF NOT EXISTS public.business_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on business_workspaces
ALTER TABLE public.business_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workspaces" ON public.business_workspaces;
CREATE POLICY "Users can manage own workspaces" ON public.business_workspaces 
FOR ALL USING (auth.uid() = user_id);

-- Apply updated_at trigger to business_workspaces
DROP TRIGGER IF EXISTS set_updated_at ON public.business_workspaces;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.business_workspaces 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Modify whatsapp_config to support workspaces and multiple numbers
-- 1. Drop the unique constraint on user_id to allow multiple numbers per user
ALTER TABLE public.whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_user_id_key;

-- 2. Add workspace_id (nullable, for backward compatibility)
ALTER TABLE public.whatsapp_config 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.business_workspaces(id) ON DELETE CASCADE;

-- 3. Add phone_number column
ALTER TABLE public.whatsapp_config 
ADD COLUMN IF NOT EXISTS phone_number TEXT;
