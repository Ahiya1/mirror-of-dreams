-- =====================================================
-- Migration: Clarify Memory Layer (Iteration 25)
-- Date: 2025-12-11
-- Features: Patterns Table, Consolidated Flag
-- =====================================================

-- =====================================================
-- CLARIFY PATTERNS TABLE
-- Stores extracted patterns from user conversations
-- =====================================================

CREATE TABLE public.clarify_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.clarify_sessions(id) ON DELETE SET NULL,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('recurring_theme', 'tension', 'potential_dream', 'identity_signal')),
    content TEXT NOT NULL,
    strength INTEGER DEFAULT 1 CHECK (strength BETWEEN 1 AND 10),
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_clarify_patterns_user_id ON public.clarify_patterns(user_id);
CREATE INDEX idx_clarify_patterns_type ON public.clarify_patterns(pattern_type);
CREATE INDEX idx_clarify_patterns_strength ON public.clarify_patterns(strength DESC);
CREATE INDEX idx_clarify_patterns_session ON public.clarify_patterns(session_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.clarify_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view their own patterns
CREATE POLICY "Users can view own patterns"
  ON public.clarify_patterns FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all patterns (for consolidation job)
CREATE POLICY "Service can insert patterns"
  ON public.clarify_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update patterns"
  ON public.clarify_patterns FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service can delete patterns"
  ON public.clarify_patterns FOR DELETE
  USING (true);

-- =====================================================
-- ADD CONSOLIDATED FLAG TO MESSAGES
-- =====================================================

ALTER TABLE public.clarify_messages
ADD COLUMN IF NOT EXISTS consolidated BOOLEAN DEFAULT FALSE;

-- Index for finding unconsolidated messages
CREATE INDEX IF NOT EXISTS idx_clarify_messages_consolidated
ON public.clarify_messages(consolidated) WHERE consolidated = FALSE;

-- =====================================================
-- UPDATE TRIGGER FOR PATTERNS
-- =====================================================

CREATE OR REPLACE FUNCTION update_clarify_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clarify_patterns_updated_at
    BEFORE UPDATE ON public.clarify_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_clarify_patterns_updated_at();

-- =====================================================
-- Migration Complete
-- =====================================================
