-- =====================================================
-- Migration: Clarify Agent Core (Iteration 24)
-- Date: 2025-12-10
-- Features: Clarify Sessions, Messages, Usage Tracking
-- =====================================================

-- =====================================================
-- 1. CLARIFY_SESSIONS TABLE
-- =====================================================

CREATE TABLE public.clarify_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Session Metadata
    title TEXT DEFAULT 'New Clarify Session',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),

    -- Linked Dream (if crystallized via function calling)
    dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL
);

-- Indexes for clarify_sessions
CREATE INDEX idx_clarify_sessions_user_id ON public.clarify_sessions(user_id);
CREATE INDEX idx_clarify_sessions_status ON public.clarify_sessions(status);
CREATE INDEX idx_clarify_sessions_updated_at ON public.clarify_sessions(updated_at DESC);
CREATE INDEX idx_clarify_sessions_last_message_at ON public.clarify_sessions(last_message_at DESC);

-- RLS for clarify_sessions
ALTER TABLE public.clarify_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clarify sessions"
  ON public.clarify_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clarify sessions"
  ON public.clarify_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clarify sessions"
  ON public.clarify_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clarify sessions"
  ON public.clarify_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. CLARIFY_MESSAGES TABLE
-- =====================================================

CREATE TABLE public.clarify_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.clarify_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Message Content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,

    -- Metadata
    token_count INTEGER,

    -- Tool Use (for createDream function calling)
    tool_use JSONB
);

-- Indexes for clarify_messages
CREATE INDEX idx_clarify_messages_session_id ON public.clarify_messages(session_id);
CREATE INDEX idx_clarify_messages_created_at ON public.clarify_messages(created_at ASC);

-- RLS for clarify_messages (access via session ownership)
ALTER TABLE public.clarify_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own sessions"
  ON public.clarify_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clarify_sessions
      WHERE clarify_sessions.id = clarify_messages.session_id
      AND clarify_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON public.clarify_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarify_sessions
      WHERE clarify_sessions.id = clarify_messages.session_id
      AND clarify_sessions.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. USER TABLE ADDITIONS
-- =====================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS clarify_sessions_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clarify_sessions INTEGER DEFAULT 0;

-- =====================================================
-- 4. DREAMS TABLE ADDITION
-- =====================================================

ALTER TABLE public.dreams
ADD COLUMN IF NOT EXISTS pre_session_id UUID REFERENCES public.clarify_sessions(id) ON DELETE SET NULL;

-- Index for pre_session_id lookup
CREATE INDEX IF NOT EXISTS idx_dreams_pre_session_id ON public.dreams(pre_session_id);

-- =====================================================
-- 5. HELPER FUNCTION: Update session message count
-- =====================================================

CREATE OR REPLACE FUNCTION update_clarify_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clarify_sessions
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment message_count
DROP TRIGGER IF EXISTS increment_clarify_message_count ON public.clarify_messages;
CREATE TRIGGER increment_clarify_message_count
AFTER INSERT ON public.clarify_messages
FOR EACH ROW EXECUTE FUNCTION update_clarify_session_message_count();

-- =====================================================
-- 6. HELPER FUNCTION: Auto-generate session title
-- =====================================================

CREATE OR REPLACE FUNCTION update_clarify_session_title()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update title if this is the first user message and title is default
    IF NEW.role = 'user' THEN
        UPDATE public.clarify_sessions
        SET title = LEFT(NEW.content, 60) || CASE WHEN LENGTH(NEW.content) > 60 THEN '...' ELSE '' END
        WHERE id = NEW.session_id
        AND title = 'New Clarify Session'
        AND message_count <= 1;  -- Only on first message
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set title from first message
DROP TRIGGER IF EXISTS set_clarify_session_title ON public.clarify_messages;
CREATE TRIGGER set_clarify_session_title
AFTER INSERT ON public.clarify_messages
FOR EACH ROW EXECUTE FUNCTION update_clarify_session_title();

-- =====================================================
-- Migration Complete
-- =====================================================
