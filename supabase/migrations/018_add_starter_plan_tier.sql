-- ============================================================
-- 018_add_starter_plan_tier.sql
-- ============================================================

-- Drop old check constraint and recreate it to support Starter plan tier
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_tier_check CHECK (plan_tier IN ('free', 'starter', 'growth', 'enterprise'));
