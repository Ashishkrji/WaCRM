-- ============================================================
-- 017_admin_permissions_logs.sql
-- ============================================================

-- Add custom permissions array, suspension status, and last_login tracker to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Drop and recreate the role check constraint to support CRM hierarchy
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'user'));

-- Create audit activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;
CREATE POLICY "Admins can view all logs" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() AND profiles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Anyone can insert logs" ON public.activity_logs;
CREATE POLICY "Anyone can insert logs" ON public.activity_logs 
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- OVERWRITE ON-SIGNUP TRIGGER TO ENABLE AUTO SUPER_ADMIN
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count INTEGER;
  assigned_role TEXT;
  assigned_permissions TEXT[];
BEGIN
  -- Check if any Super Admin exists in the platform
  SELECT COUNT(*) INTO super_admin_count FROM public.profiles WHERE role = 'super_admin';
  
  -- If none exist, the first signup becomes the Super Admin
  IF super_admin_count = 0 THEN
    assigned_role := 'super_admin';
    assigned_permissions := ARRAY[
      'contacts_access', 'messaging_access', 'analytics_access', 
      'settings_access', 'automation_access', 'broadcast_access', 
      'team_management', 'api_access', 'whatsapp_management', 'billing_access'
    ];
  ELSE
    assigned_role := 'staff';
    assigned_permissions := ARRAY['contacts_access', 'messaging_access'];
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, role, permissions, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'CRM User'),
    NEW.email,
    assigned_role,
    assigned_permissions,
    'active'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
