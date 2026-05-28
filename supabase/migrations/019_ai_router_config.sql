-- ============================================================
-- 019_ai_router_config.sql
-- ============================================================

-- Create ai_router_config table to store custom chatbot settings
CREATE TABLE IF NOT EXISTS public.ai_router_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  endpoint TEXT,
  api_key TEXT,
  system_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.ai_router_config ENABLE ROW LEVEL SECURITY;

-- Add RLS Policy
DROP POLICY IF EXISTS "Users can manage own ai config" ON public.ai_router_config;
CREATE POLICY "Users can manage own ai config" ON public.ai_router_config 
FOR ALL USING (auth.uid() = user_id);
