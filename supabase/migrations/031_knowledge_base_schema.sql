-- ========================================================
-- 031_knowledge_base_schema.sql
-- Knowledge Base, Vector Search & AI Memory System
-- ========================================================

-- ─── Knowledge Categories ────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT '#6366f1',
  parent_id UUID REFERENCES knowledge_categories(id),
  sort_order INTEGER DEFAULT 0,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- ─── Knowledge Articles ──────────────────────────────────

CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived', 'under_review');
CREATE TYPE article_type AS ENUM ('article', 'faq', 'procedure', 'template', 'script', 'policy', 'guide');

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  article_type article_type DEFAULT 'article',
  status article_status DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  author_id UUID REFERENCES auth.users(id),

  -- Vector embedding (MongoDB Atlas handles this, but store reference)
  embedding_id TEXT,               -- MongoDB document ID
  embedding_model TEXT DEFAULT 'nvidia/nv-embedqa-e5-v5',
  embedding_synced_at TIMESTAMPTZ,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  ai_use_count INTEGER DEFAULT 0,  -- Times used by AI agents
  search_hit_count INTEGER DEFAULT 0,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Source
  source_url TEXT,
  is_auto_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE(user_id, slug)
);

-- ─── Article Versions ────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_article_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES knowledge_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── AI Contact Memory ───────────────────────────────────

CREATE TYPE memory_type AS ENUM ('fact', 'preference', 'interaction', 'goal', 'concern', 'sentiment', 'product_interest', 'context');

CREATE TABLE IF NOT EXISTS contact_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  memory_type memory_type NOT NULL,
  content TEXT NOT NULL,
  source TEXT,                     -- "whatsapp", "ai", "manual"
  confidence NUMERIC(3,2) DEFAULT 0.9,  -- 0.0 to 1.0
  expires_at TIMESTAMPTZ,          -- Optional TTL
  is_active BOOLEAN DEFAULT true,
  embedding_id TEXT,               -- MongoDB vector reference
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Conversation Summaries ───────────────────────────────

CREATE TABLE IF NOT EXISTS conversation_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID,
  summary TEXT NOT NULL,
  key_points TEXT[] DEFAULT '{}',
  sentiment TEXT DEFAULT 'neutral',
  action_items TEXT[] DEFAULT '{}',
  next_steps TEXT,
  model_used TEXT DEFAULT 'nvidia/llama-3.1-nemotron-70b-instruct',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── AI Agent Memory Sessions ───────────────────────────

CREATE TABLE IF NOT EXISTS ai_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,        -- "support", "sales", "seo", etc.
  session_start TIMESTAMPTZ DEFAULT now(),
  session_end TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  knowledge_hits INTEGER DEFAULT 0,   -- KB articles used
  memory_hits INTEGER DEFAULT 0,      -- Contact memory items used
  is_resolved BOOLEAN DEFAULT false,
  resolution_type TEXT,            -- "ai_resolved", "escalated", "abandoned"
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Knowledge Search Logs ───────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_search_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  top_article_id UUID REFERENCES knowledge_articles(id) ON DELETE SET NULL,
  similarity_score NUMERIC(5,4),
  agent_type TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_user_id ON knowledge_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category_id ON knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tags ON knowledge_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contact_memories_contact_id ON contact_memories(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_memories_type ON contact_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_contact_id ON conversation_summaries(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_contact_id ON ai_sessions(contact_id);

-- ─── Row Level Security ────────────────────────────────────

ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_search_logs ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['knowledge_categories','knowledge_articles','contact_memories','conversation_summaries','ai_sessions','knowledge_search_logs'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_user_policy" ON %s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;

CREATE POLICY IF NOT EXISTS "kb_article_versions_policy" ON knowledge_article_versions FOR ALL USING (user_id = auth.uid());

-- ─── Default Categories ──────────────────────────────────

INSERT INTO knowledge_categories (id, user_id, name, slug, description, icon, color)
SELECT gen_random_uuid(), id, name, slug, desc, icon, color
FROM auth.users, (VALUES
  ('Products & Services', 'products-services', 'Information about our services', 'Package', '#6366f1'),
  ('Pricing & Billing', 'pricing-billing', 'Pricing, payment, and billing FAQs', 'DollarSign', '#10b981'),
  ('Technical Support', 'technical-support', 'Technical troubleshooting guides', 'Wrench', '#f59e0b'),
  ('GST & Tax', 'gst-tax', 'GST filing and tax guidance', 'FileText', '#ef4444'),
  ('Company Policies', 'company-policies', 'Terms, refunds, and policies', 'Shield', '#8b5cf6'),
  ('Getting Started', 'getting-started', 'Onboarding and setup guides', 'Rocket', '#06b6d4')
) AS cats(name, slug, desc, icon, color)
ON CONFLICT (user_id, slug) DO NOTHING;
