-- ============================================================
-- 023_enterprise_crm_modules.sql
-- Upgrades tables to Enterprise-grade CRM capabilities:
-- Pinned/favorite inbox status, extended contact fields,
-- employee availability status, deal metrics, tasks, and file storage.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- CONVERSATIONS & MESSAGES EXTENSIONS
-- ============================================================
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS spam BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sla_first_response_time INTEGER,
  ADD COLUMN IF NOT EXISTS sla_avg_response_time INTEGER,
  ADD COLUMN IF NOT EXISTS sla_resolution_time INTEGER,
  ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_pinned ON public.conversations(pinned) WHERE pinned = TRUE;

-- ============================================================
-- CONTACTS EXTENSIONS
-- ============================================================
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON public.contacts(owner_id);

-- ============================================================
-- DEALS EXTENSIONS
-- ============================================================
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS probability NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_revenue NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposal_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES public.quotation_requests(id) ON DELETE SET NULL;

-- ============================================================
-- PROFILES EXTENSIONS
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'online' CHECK (availability IN ('online', 'busy', 'away')),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- TASKS
-- Tracks CRM follow-ups, tasks, and assignments.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  recurring TEXT, -- 'daily', 'weekly', 'monthly', or NULL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON public.tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.tasks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CUSTOMER_FILES
-- Tracks files attached to customers, stored in Supabase Storage.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_files_user ON public.customer_files(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_files_contact ON public.customer_files(contact_id);

ALTER TABLE public.customer_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own customer_files" ON public.customer_files;
CREATE POLICY "Users can manage own customer_files"
  ON public.customer_files FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- SUPABASE STORAGE — customer-files bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-files', 'customer-files', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload customer files" ON storage.objects;
CREATE POLICY "Users can upload customer files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'customer-files'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- Authenticated users can read their own files
DROP POLICY IF EXISTS "Users can read own customer files" ON storage.objects;
CREATE POLICY "Users can read own customer files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'customer-files'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "Users can delete own customer files" ON storage.objects;
CREATE POLICY "Users can delete own customer files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'customer-files'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
