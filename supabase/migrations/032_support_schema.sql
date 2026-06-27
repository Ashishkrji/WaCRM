-- ========================================================
-- 032_support_schema.sql
-- Customer Support Ticket System with SLA & Escalation
-- ========================================================

CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'escalated', 'resolved', 'closed', 'reopened');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
CREATE TYPE ticket_channel AS ENUM ('whatsapp', 'email', 'phone', 'chat', 'api', 'manual');

-- ─── SLA Policies ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS sla_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  first_response_hours NUMERIC(6,2) NOT NULL DEFAULT 4,
  resolution_hours NUMERIC(6,2) NOT NULL DEFAULT 24,
  escalation_hours NUMERIC(6,2) DEFAULT 8,
  applies_to_priority ticket_priority[] DEFAULT '{medium, high, urgent, critical}',
  business_hours_only BOOLEAN DEFAULT false,
  business_start_hour INTEGER DEFAULT 9,
  business_end_hour INTEGER DEFAULT 18,
  business_days INTEGER[] DEFAULT '{1,2,3,4,5}',  -- Mon-Fri
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Support Tickets ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  channel ticket_channel DEFAULT 'whatsapp',

  -- Relations
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_team TEXT,

  -- SLA
  sla_policy_id UUID REFERENCES sla_policies(id),
  first_response_due_at TIMESTAMPTZ,
  resolution_due_at TIMESTAMPTZ,
  first_responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  sla_first_response_breached BOOLEAN DEFAULT false,

  -- Tags & Meta
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  product TEXT,
  ai_suggested_category TEXT,
  ai_suggested_priority ticket_priority,
  ai_auto_resolved BOOLEAN DEFAULT false,
  resolution_note TEXT,
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,

  -- Source
  source_message_id TEXT,          -- WhatsApp message ID
  conversation_id UUID,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Ticket Comments ─────────────────────────────────────

CREATE TYPE comment_type AS ENUM ('public', 'internal', 'system', 'ai');

CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  comment_type comment_type DEFAULT 'public',
  is_ai_generated BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Ticket Escalations ───────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_escalations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  escalated_by UUID REFERENCES auth.users(id),
  escalated_to UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  previous_priority ticket_priority,
  new_priority ticket_priority,
  auto_escalated BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Canned Responses ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Ticket Watchers ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_watchers (
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (ticket_id, user_id)
);

-- ─── Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_contact_id ON support_tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_escalations_ticket_id ON ticket_escalations(ticket_id);

-- ─── RLS ─────────────────────────────────────────────────

ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['sla_policies','support_tickets','ticket_comments','ticket_escalations','canned_responses'] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_user_policy" ON %s FOR ALL USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;

-- ─── Default SLA Policies ────────────────────────────────

INSERT INTO sla_policies (id, user_id, name, first_response_hours, resolution_hours, escalation_hours, applies_to_priority, is_default)
SELECT gen_random_uuid(), id, name, frh, rh, eh, atp::ticket_priority[], is_def
FROM auth.users, (VALUES
  ('Standard SLA', 4, 24, 8, '{medium,high}', true),
  ('Urgent SLA', 1, 4, 2, '{urgent,critical}', false),
  ('Low Priority SLA', 24, 72, 48, '{low}', false)
) AS slap(name, frh, rh, eh, atp, is_def)
ON CONFLICT DO NOTHING;

-- ─── Sequence for ticket numbers ─────────────────────────

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1001;
