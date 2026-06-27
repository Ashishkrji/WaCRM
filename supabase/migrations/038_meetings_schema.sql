-- ============================================================
-- 038_meetings_schema.sql
-- Meeting Intelligence, Calendar Integration, AI Summaries
-- ============================================================

CREATE TYPE meeting_type AS ENUM ('discovery','demo','proposal','negotiation','follow_up','onboarding','support','internal','review','other');
CREATE TYPE meeting_status AS ENUM ('scheduled','in_progress','completed','cancelled','no_show','rescheduled');

-- ─── Meetings ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type meeting_type DEFAULT 'discovery',
  status meeting_status DEFAULT 'scheduled',
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  ended_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  location TEXT,
  meet_link TEXT,
  google_event_id TEXT,
  google_calendar_id TEXT,
  recording_url TEXT,
  transcript TEXT,
  ai_summary TEXT,
  key_topics TEXT[] DEFAULT '{}',
  sentiment TEXT,             -- 'positive','neutral','negative'
  next_steps TEXT,
  outcome TEXT,               -- 'interested','not_interested','follow_up','deal_closed'
  deal_value NUMERIC(12,2),
  follow_up_date DATE,
  reminder_sent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Meeting Attendees ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attendee_email TEXT,
  attendee_name TEXT,
  role TEXT DEFAULT 'participant' CHECK (role IN ('organizer','participant','guest')),
  rsvp TEXT DEFAULT 'pending' CHECK (rsvp IN ('accepted','declined','tentative','pending')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ
);

-- ─── Action Items ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  completed_at TIMESTAMPTZ,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Calendar Sync Tokens ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'google' CHECK (provider IN ('google','microsoft','apple')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  calendar_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- ─── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_meetings_user ON meetings(user_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_contact ON meetings(contact_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting ON meeting_action_items(meeting_id);

-- ─── RLS ────────────────────────────────────────────────────

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['meetings','meeting_attendees','meeting_action_items','calendar_integrations'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_user" ON public.%s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;
