-- =====================================================
-- Migration: Dream Lifecycle Completion (Iteration 23)
-- Date: 2025-12-09
-- Features: Evolution Events, Achievement Ceremonies, Release Rituals
-- =====================================================

-- =====================================================
-- 1. UPDATE DREAMS TABLE
-- =====================================================

-- Add tracking fields for lifecycle features
ALTER TABLE public.dreams
ADD COLUMN IF NOT EXISTS evolution_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_ceremony BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_ritual BOOLEAN DEFAULT FALSE;

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dreams_evolution_count_positive') THEN
    ALTER TABLE public.dreams
    ADD CONSTRAINT dreams_evolution_count_positive CHECK (evolution_count >= 0);
  END IF;
END $$;

-- =====================================================
-- 2. CREATE EVOLUTION_EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.evolution_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Before snapshot (what the dream was)
    old_title TEXT NOT NULL,
    old_description TEXT,
    old_target_date DATE,
    old_category TEXT,

    -- After snapshot (what it became)
    new_title TEXT NOT NULL,
    new_description TEXT,
    new_target_date DATE,
    new_category TEXT,

    -- User's reflection on why this evolution happened
    evolution_reflection TEXT NOT NULL CHECK (char_length(evolution_reflection) >= 10 AND char_length(evolution_reflection) <= 2000)
);

-- Indexes for evolution_events
CREATE INDEX IF NOT EXISTS idx_evolution_events_user_id ON public.evolution_events(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_events_dream_id ON public.evolution_events(dream_id);
CREATE INDEX IF NOT EXISTS idx_evolution_events_created_at ON public.evolution_events(created_at DESC);

-- RLS for evolution_events
ALTER TABLE public.evolution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evolution events"
  ON public.evolution_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own evolution events"
  ON public.evolution_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. CREATE ACHIEVEMENT_CEREMONIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.achievement_ceremonies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID UNIQUE NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dream snapshot at time of achievement
    dream_title TEXT NOT NULL,
    dream_description TEXT,
    dream_category TEXT,

    -- AI-generated synthesis (requires 1+ reflections)
    who_you_were TEXT,  -- NULL if no reflections
    who_you_became TEXT,  -- NULL if no reflections
    journey_synthesis TEXT,  -- NULL if no reflections

    -- User's optional closing words
    personal_note TEXT CHECK (char_length(personal_note) <= 2000),

    -- Metadata
    reflections_analyzed UUID[],
    reflection_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for achievement_ceremonies
CREATE INDEX IF NOT EXISTS idx_achievement_ceremonies_user_id ON public.achievement_ceremonies(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_ceremonies_dream_id ON public.achievement_ceremonies(dream_id);
CREATE INDEX IF NOT EXISTS idx_achievement_ceremonies_created_at ON public.achievement_ceremonies(created_at DESC);

-- RLS for achievement_ceremonies
ALTER TABLE public.achievement_ceremonies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ceremonies"
  ON public.achievement_ceremonies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ceremonies"
  ON public.achievement_ceremonies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ceremonies"
  ON public.achievement_ceremonies FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. CREATE RELEASE_RITUALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.release_rituals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID UNIQUE NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dream snapshot at time of release
    dream_title TEXT NOT NULL,
    dream_description TEXT,
    dream_category TEXT,

    -- 4-step wizard responses (all required except final_message)
    what_i_learned TEXT NOT NULL CHECK (char_length(what_i_learned) >= 10 AND char_length(what_i_learned) <= 2000),
    what_im_grateful_for TEXT NOT NULL CHECK (char_length(what_im_grateful_for) >= 10 AND char_length(what_im_grateful_for) <= 2000),
    what_i_release TEXT NOT NULL CHECK (char_length(what_i_release) >= 10 AND char_length(what_i_release) <= 2000),
    final_message TEXT CHECK (char_length(final_message) <= 2000),  -- Optional closing words

    -- Why releasing (for data insights)
    reason TEXT CHECK (reason IN ('evolved_beyond', 'no_longer_resonates', 'completed_differently', 'circumstances_changed', 'other')),

    -- Metadata
    reflection_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for release_rituals
CREATE INDEX IF NOT EXISTS idx_release_rituals_user_id ON public.release_rituals(user_id);
CREATE INDEX IF NOT EXISTS idx_release_rituals_dream_id ON public.release_rituals(dream_id);
CREATE INDEX IF NOT EXISTS idx_release_rituals_created_at ON public.release_rituals(created_at DESC);

-- RLS for release_rituals
ALTER TABLE public.release_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rituals"
  ON public.release_rituals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rituals"
  ON public.release_rituals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. HELPER FUNCTION: Update dream evolution count
-- =====================================================

CREATE OR REPLACE FUNCTION update_dream_evolution_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.dreams
    SET evolution_count = evolution_count + 1
    WHERE id = NEW.dream_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment evolution_count
DROP TRIGGER IF EXISTS increment_dream_evolution_count ON public.evolution_events;
CREATE TRIGGER increment_dream_evolution_count
AFTER INSERT ON public.evolution_events
FOR EACH ROW EXECUTE FUNCTION update_dream_evolution_count();

-- =====================================================
-- Migration Complete
-- =====================================================
