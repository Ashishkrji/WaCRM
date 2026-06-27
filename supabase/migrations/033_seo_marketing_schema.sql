-- ========================================================
-- 033_seo_marketing_schema.sql
-- SEO Projects, Keyword Tracking & Content Planning
-- ========================================================

-- ─── SEO Projects ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  target_country TEXT DEFAULT 'IN',
  target_language TEXT DEFAULT 'en',
  search_engine TEXT DEFAULT 'google',
  monthly_traffic INTEGER DEFAULT 0,
  domain_authority INTEGER DEFAULT 0,
  backlink_count INTEGER DEFAULT 0,
  indexed_pages INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  competitor_domains TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Keywords ────────────────────────────────────────────

CREATE TYPE keyword_intent AS ENUM ('informational', 'navigational', 'commercial', 'transactional');

CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  location TEXT DEFAULT 'India',
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0,      -- 0-100
  cpc NUMERIC(8,2) DEFAULT 0,
  intent keyword_intent DEFAULT 'informational',
  current_rank INTEGER,
  previous_rank INTEGER,
  best_rank INTEGER,
  target_rank INTEGER DEFAULT 1,
  ranking_url TEXT,
  is_tracked BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, keyword)
);

-- ─── Keyword Rank History ────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_rank_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID REFERENCES seo_keywords(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rank INTEGER,
  url TEXT,
  search_volume INTEGER,
  check_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Backlinks ───────────────────────────────────────────

CREATE TYPE backlink_status AS ENUM ('active', 'lost', 'nofollow', 'redirect');

CREATE TABLE IF NOT EXISTS seo_backlinks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  domain_authority INTEGER DEFAULT 0,
  is_dofollow BOOLEAN DEFAULT true,
  status backlink_status DEFAULT 'active',
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  lost_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Content Plan ────────────────────────────────────────

CREATE TYPE content_status AS ENUM ('idea', 'planned', 'in_progress', 'written', 'reviewed', 'published', 'archived');
CREATE TYPE content_type AS ENUM ('blog_post', 'landing_page', 'product_page', 'case_study', 'guide', 'faq', 'infographic', 'video');

CREATE TABLE IF NOT EXISTS seo_content_plan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_keywords TEXT[] DEFAULT '{}',
  primary_keyword TEXT,
  content_type content_type DEFAULT 'blog_post',
  status content_status DEFAULT 'idea',
  target_word_count INTEGER DEFAULT 1000,
  target_publish_date DATE,
  published_url TEXT,
  assigned_to TEXT,
  ai_outline TEXT,
  ai_brief TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── SEO Audits ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audit_url TEXT NOT NULL,
  overall_score INTEGER DEFAULT 0,     -- 0-100
  issues JSONB DEFAULT '[]',           -- Array of {type, severity, description, recommendation}
  passed JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  meta JSONB DEFAULT '{}',
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_seo_projects_user_id ON seo_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_project_id ON seo_keywords(project_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_user_id ON seo_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_rank_history_keyword_id ON seo_rank_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_project_id ON seo_backlinks(project_id);
CREATE INDEX IF NOT EXISTS idx_seo_content_plan_project_id ON seo_content_plan(project_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_project_id ON seo_audits(project_id);

-- ─── RLS ─────────────────────────────────────────────────

ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_rank_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_content_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['seo_projects','seo_keywords','seo_rank_history','seo_backlinks','seo_content_plan','seo_audits'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_user_policy" ON %s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;
