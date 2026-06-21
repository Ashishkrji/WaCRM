-- ============================================================
-- 022_workspace_branding_enhancements.sql
-- ============================================================

-- Add custom domain, support email, white-label toggles, and brand color accent to business_workspaces
ALTER TABLE public.business_workspaces
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS support_email TEXT,
ADD COLUMN IF NOT EXISTS white_label_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#6366f1'; -- Indigo default

-- Create a public view for workspaces for white-labeled client portals to read branding settings anonymously
CREATE OR REPLACE VIEW public.public_workspace_branding AS
SELECT id, name, logo_url, custom_domain, support_email, white_label_enabled, brand_color
FROM public.business_workspaces;
