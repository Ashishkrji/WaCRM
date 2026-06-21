-- ============================================================
-- 020_ai_engine.sql
-- Enterprise AI Engine — tables, extensions, and RLS policies.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Enable pgvector for semantic similarity search (knowledge base RAG).
-- This extension is available on all Supabase projects.
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- EXTEND ai_router_config (created in migration 019)
-- Add new columns for the native AI provider integration.
-- Existing columns (endpoint, api_key, system_prompt) are kept
-- for backward compatibility with the legacy external webhook mode.
-- ============================================================
ALTER TABLE public.ai_router_config
  ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'nvidia',
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS confidence_threshold NUMERIC(4,3) DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS auto_reply BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS human_handoff_message TEXT DEFAULT
    'Thank you for your patience! A team member will be with you shortly. 🙏';

-- ============================================================
-- AI_CONVERSATIONS
-- Links CRM conversations to AI session state.
-- Stores the sliding window of messages used as context.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  -- Total messages the AI has processed in this conversation
  total_ai_messages INTEGER DEFAULT 0,
  -- Whether AI is currently handling this conversation
  ai_active BOOLEAN DEFAULT TRUE,
  -- Whether the conversation was handed off to a human
  handed_off_at TIMESTAMPTZ,
  -- The provider/model that handled this conversation
  provider TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_conv ON ai_conversations(conversation_id);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own ai_conversations" ON public.ai_conversations;
CREATE POLICY "Users can manage own ai_conversations"
  ON public.ai_conversations FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.ai_conversations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AI_MEMORY
-- Per-contact memory extracted by the AI from conversations.
-- Facts are stored as JSONB for flexible schema evolution.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  -- Key facts extracted from conversations: {name, interests, last_issue, ...}
  facts JSONB DEFAULT '{}',
  -- Last detected intent
  last_intent TEXT,
  -- Last detected language (ISO 639-1)
  last_language TEXT DEFAULT 'en',
  -- Last detected sentiment
  last_sentiment TEXT DEFAULT 'neutral',
  -- Total number of AI interactions with this contact
  total_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_contact ON ai_memory(contact_id);

ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own ai_memory" ON public.ai_memory;
CREATE POLICY "Users can manage own ai_memory"
  ON public.ai_memory FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.ai_memory;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ai_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CONVERSATION_SUMMARY
-- LLM-generated summaries of long conversations.
-- Generated async when message count exceeds a threshold.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversation_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  -- The generated summary text
  summary TEXT NOT NULL,
  -- Message count at time of summary generation
  message_count_at_summary INTEGER,
  -- Provider/model used for summarization
  provider TEXT,
  model TEXT,
  -- Token cost of generating the summary
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_summary_conv ON conversation_summary(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summary_user ON conversation_summary(user_id);

ALTER TABLE public.conversation_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own summaries" ON public.conversation_summary;
CREATE POLICY "Users can manage own summaries"
  ON public.conversation_summary FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.conversation_summary;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.conversation_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- KNOWLEDGE_BASE
-- Uploaded documents and their metadata.
-- The actual content chunks live in knowledge_embeddings.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Display name for the document
  title TEXT NOT NULL,
  -- Document type
  doc_type TEXT NOT NULL DEFAULT 'text'
    CHECK (doc_type IN ('pdf', 'docx', 'txt', 'website', 'faq', 'pricing', 'policy', 'portfolio', 'services', 'custom')),
  -- Raw text content (for re-embedding)
  content TEXT,
  -- Source URL (for website type)
  source_url TEXT,
  -- Supabase Storage path (for uploaded files)
  storage_path TEXT,
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  -- Number of chunks generated
  chunk_count INTEGER DEFAULT 0,
  -- Processing error if any
  error_message TEXT,
  -- Embedding model used
  embedding_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_user ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON knowledge_base(status);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own knowledge_base" ON public.knowledge_base;
CREATE POLICY "Users can manage own knowledge_base"
  ON public.knowledge_base FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.knowledge_base;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- KNOWLEDGE_EMBEDDINGS
-- Vector embeddings for semantic search (RAG).
-- Each row is one chunk of a knowledge_base document.
-- Vector dimension: 1024 (NVIDIA nv-embed-v2 / text-embedding-3-small compatible).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  -- The chunk text
  content TEXT NOT NULL,
  -- Position of this chunk within the document (0-indexed)
  chunk_index INTEGER NOT NULL DEFAULT 0,
  -- The vector embedding — dimension 1024
  embedding vector(1024),
  -- Metadata for filtering (e.g. {"section": "pricing"})
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_kb ON knowledge_embeddings(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_user ON knowledge_embeddings(user_id);

-- IVFFlat index for fast approximate nearest-neighbor search.
-- lists=100 is a good default for up to ~1M vectors per user.
-- Rebuild with REINDEX if you load significantly more data.
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector
  ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own embeddings" ON public.knowledge_embeddings;
CREATE POLICY "Users can manage own embeddings"
  ON public.knowledge_embeddings FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Service role policy for server-side embedding writes
DROP POLICY IF EXISTS "Service role can write embeddings" ON public.knowledge_embeddings;
CREATE POLICY "Service role can write embeddings"
  ON public.knowledge_embeddings FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- pgvector similarity search function
-- Called from the AI engine for RAG retrieval.
-- SECURITY DEFINER so the function can bypass RLS when searching.
-- We scope the search to the calling user's data via the p_user_id param.
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_knowledge(
  p_user_id UUID,
  p_embedding vector(1024),
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  knowledge_base_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    ke.id,
    ke.knowledge_base_id,
    ke.content,
    ke.metadata,
    1 - (ke.embedding <=> p_embedding) AS similarity
  FROM public.knowledge_embeddings ke
  JOIN public.knowledge_base kb ON kb.id = ke.knowledge_base_id
  WHERE
    ke.user_id = p_user_id
    AND kb.status = 'ready'
    AND 1 - (ke.embedding <=> p_embedding) > p_match_threshold
  ORDER BY ke.embedding <=> p_embedding
  LIMIT p_match_count;
$$;

-- ============================================================
-- LEAD_SCORES
-- AI-generated lead quality scores per contact.
-- Scored on first AI interaction and updated periodically.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  -- Score 0–100
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  -- Score tier derived from score
  tier TEXT NOT NULL DEFAULT 'cold'
    CHECK (tier IN ('hot', 'warm', 'cold')),
  -- Human-readable reason for the score
  reasoning TEXT,
  -- Provider/model used for scoring
  provider TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_user ON lead_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_contact ON lead_scores(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_score ON lead_scores(score DESC);

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own lead_scores" ON public.lead_scores;
CREATE POLICY "Users can manage own lead_scores"
  ON public.lead_scores FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.lead_scores;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.lead_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AI_USAGE_LOGS
-- Token consumption tracking per user + conversation.
-- Used for cost monitoring and rate limiting.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  -- Which operation triggered the token usage
  operation TEXT NOT NULL
    CHECK (operation IN ('chat', 'embed', 'summary', 'intent', 'lead_score')),
  -- Provider and model used
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  -- Token counts
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  -- AI response metadata
  confidence NUMERIC(5,4),
  finish_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_conv ON ai_usage_logs(conversation_id);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "Users can view own ai_usage_logs"
  ON public.ai_usage_logs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Service role inserts usage logs from server routes
DROP POLICY IF EXISTS "Service role can insert ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "Service role can insert ai_usage_logs"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- PROMPT_TEMPLATES
-- Reusable system prompt templates configurable per user.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- The template content. Supports {{company_name}}, {{agent_name}} placeholders.
  content TEXT NOT NULL,
  -- Whether this is the active system prompt
  is_default BOOLEAN DEFAULT FALSE,
  -- Optional: restrict to specific intents
  intent_filter TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_user ON prompt_templates(user_id);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own prompt_templates" ON public.prompt_templates;
CREATE POLICY "Users can manage own prompt_templates"
  ON public.prompt_templates FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.prompt_templates;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SUPABASE STORAGE — knowledge-base bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload knowledge files" ON storage.objects;
CREATE POLICY "Users can upload knowledge files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'knowledge-base'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- Authenticated users can read their own files
DROP POLICY IF EXISTS "Users can read own knowledge files" ON storage.objects;
CREATE POLICY "Users can read own knowledge files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'knowledge-base'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "Users can delete own knowledge files" ON storage.objects;
CREATE POLICY "Users can delete own knowledge files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'knowledge-base'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
