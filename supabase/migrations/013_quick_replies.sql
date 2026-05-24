-- Migration: 013_quick_replies.sql
-- Description: Create quick_replies table for canned responses.

CREATE TABLE quick_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shortcut TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure shortcuts are unique per user to avoid collision
    UNIQUE(user_id, shortcut)
);

-- Enable RLS
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own quick replies" 
ON quick_replies FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_quick_replies_user_id ON quick_replies(user_id);
