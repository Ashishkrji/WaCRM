-- ============================================================
-- 036_ai_agents_schema.sql
-- AI Agents, NPC Personas, Training Data, Intent Patterns
-- ============================================================

CREATE TYPE agent_type AS ENUM ('sales','support','marketing','onboarding','faq','custom');
CREATE TYPE agent_status AS ENUM ('draft','training','active','paused','archived');

-- ─── AI Agent Profiles ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  agent_type agent_type DEFAULT 'support',
  status agent_status DEFAULT 'draft',
  persona JSONB DEFAULT '{}',           -- {tone, language, greeting, signature}
  system_prompt TEXT,
  fallback_message TEXT DEFAULT 'I''ll connect you to a human agent.',
  handoff_conditions JSONB DEFAULT '[]', -- [{trigger, action}]
  ai_provider TEXT DEFAULT 'nvidia',
  model TEXT DEFAULT 'nvidia/llama-3.1-nemotron-70b-instruct',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 512,
  knowledge_base_ids UUID[] DEFAULT '{}',
  intent_confidence_threshold NUMERIC(3,2) DEFAULT 0.7,
  response_delay_ms INTEGER DEFAULT 500,
  is_default BOOLEAN DEFAULT false,
  conversation_count INTEGER DEFAULT 0,
  resolution_rate NUMERIC(5,2) DEFAULT 0,
  avg_response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- ─── Intent Patterns ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  example_phrases TEXT[] DEFAULT '{}',
  response_template TEXT,
  action TEXT,               -- 'reply','handoff','escalate','create_ticket','create_lead'
  action_config JSONB DEFAULT '{}',
  confidence_boost NUMERIC(3,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Training Data ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  intent_label TEXT,
  quality_score NUMERIC(3,2),
  source TEXT DEFAULT 'manual',  -- 'manual','conversation','import'
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Agent Conversation Sessions ────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','resolved','handed_off','abandoned')),
  message_count INTEGER DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  handed_off_at TIMESTAMPTZ,
  handoff_reason TEXT,
  session_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_agents_user ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_intents_agent ON agent_intents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent ON agent_sessions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_training_agent ON agent_training_data(agent_id);

-- ─── RLS ────────────────────────────────────────────────────

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['ai_agents','agent_intents','agent_training_data','agent_sessions'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_user" ON public.%s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;
