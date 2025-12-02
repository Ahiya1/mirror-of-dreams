-- Iteration 2: Dreams Feature + Mirror of Dreams Rebrand
-- Migration to add dreams table and update reflections

-- =====================================================
-- DREAMS TABLE - User's life goals/dreams
-- =====================================================
CREATE TABLE public.dreams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dream Content
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
    description TEXT CHECK (char_length(description) <= 2000),

    -- Timeline
    target_date DATE,
    -- Note: days_left is calculated in application layer (not GENERATED column)
    -- because CURRENT_DATE is not immutable in PostgreSQL

    -- Status Management
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'archived', 'released')),
    achieved_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,

    -- Organization
    category TEXT CHECK (category IN (
        'health', 'career', 'relationships', 'financial', 'personal_growth',
        'creative', 'spiritual', 'entrepreneurial', 'educational', 'other'
    )),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),

    -- Metadata
    reflection_count INTEGER DEFAULT 0,
    last_reflection_at TIMESTAMP WITH TIME ZONE
);

-- Dreams indexes
CREATE INDEX idx_dreams_user_id ON public.dreams(user_id);
CREATE INDEX idx_dreams_status ON public.dreams(status);
CREATE INDEX idx_dreams_created_at ON public.dreams(created_at DESC);
CREATE INDEX idx_dreams_target_date ON public.dreams(target_date);
CREATE INDEX idx_dreams_category ON public.dreams(category);
CREATE INDEX idx_dreams_user_status ON public.dreams(user_id, status);

-- Updated_at trigger for dreams
CREATE TRIGGER update_dreams_updated_at BEFORE UPDATE ON public.dreams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADD dream_id TO REFLECTIONS TABLE
-- =====================================================
ALTER TABLE public.reflections
    ADD COLUMN dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL;

CREATE INDEX idx_reflections_dream_id ON public.reflections(dream_id);
CREATE INDEX idx_reflections_user_dream ON public.reflections(user_id, dream_id);

-- =====================================================
-- DATA MIGRATION: Create default dreams for existing users
-- =====================================================

-- For each existing user, create a default dream
DO $$
DECLARE
    user_record RECORD;
    default_dream_id UUID;
BEGIN
    -- Loop through all users who have reflections but no dreams
    FOR user_record IN
        SELECT DISTINCT u.id, u.email, u.name
        FROM public.users u
        WHERE EXISTS (SELECT 1 FROM public.reflections WHERE user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM public.dreams WHERE user_id = u.id)
    LOOP
        -- Create default dream for this user
        INSERT INTO public.dreams (user_id, title, description, status, category)
        VALUES (
            user_record.id,
            'My Journey',
            'A collection of reflections from my journey of self-discovery and growth.',
            'active',
            'personal_growth'
        )
        RETURNING id INTO default_dream_id;

        -- Link all existing reflections from this user to the default dream
        UPDATE public.reflections
        SET dream_id = default_dream_id
        WHERE user_id = user_record.id AND dream_id IS NULL;

        -- Update reflection count for the dream
        UPDATE public.dreams
        SET reflection_count = (
            SELECT COUNT(*) FROM public.reflections
            WHERE dream_id = default_dream_id
        ),
        last_reflection_at = (
            SELECT MAX(created_at) FROM public.reflections
            WHERE dream_id = default_dream_id
        )
        WHERE id = default_dream_id;

        RAISE NOTICE 'Created default dream for user % (%) with % reflections',
            user_record.name, user_record.email,
            (SELECT COUNT(*) FROM public.reflections WHERE dream_id = default_dream_id);
    END LOOP;
END $$;

-- =====================================================
-- UPDATE USERS TABLE - Add tier changes for Iteration 2
-- =====================================================

-- Update tier check constraint to include 'optimal' tier
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
    CHECK (tier IN ('free', 'essential', 'optimal', 'premium'));

-- =====================================================
-- CREATE/UPDATE ADMIN USER
-- =====================================================

-- Update existing admin user or create new one
INSERT INTO public.users (
    email,
    password_hash,
    name,
    tier,
    is_creator,
    is_admin,
    email_verified
) VALUES (
    'ahiya.butman@gmail.com',
    '$2b$10$YourActualBcryptHashHere', -- Replace with actual hash
    'Ahiya Butman',
    'premium',
    true,
    true,
    true
) ON CONFLICT (email) DO UPDATE SET
    tier = 'premium',
    is_creator = true,
    is_admin = true,
    email_verified = true,
    name = 'Ahiya Butman';

-- =====================================================
-- ROW LEVEL SECURITY FOR DREAMS
-- =====================================================

ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

-- Users can view own dreams
CREATE POLICY "Users can view own dreams" ON public.dreams
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own dreams
CREATE POLICY "Users can insert own dreams" ON public.dreams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own dreams
CREATE POLICY "Users can update own dreams" ON public.dreams
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own dreams
CREATE POLICY "Users can delete own dreams" ON public.dreams
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS FOR DREAMS
-- =====================================================

-- Function to check dream creation limits based on tier
CREATE OR REPLACE FUNCTION check_dream_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    active_dream_count INTEGER;
    max_dreams INTEGER;
BEGIN
    -- Get user's current tier
    SELECT tier INTO user_tier
    FROM public.users
    WHERE id = user_uuid;

    -- Count active dreams
    SELECT COUNT(*) INTO active_dream_count
    FROM public.dreams
    WHERE user_id = user_uuid AND status = 'active';

    -- Set limits based on tier
    CASE user_tier
        WHEN 'free' THEN max_dreams := 2;
        WHEN 'essential' THEN max_dreams := 5;
        WHEN 'optimal' THEN max_dreams := 7;
        WHEN 'premium' THEN max_dreams := 999999; -- Unlimited
        ELSE max_dreams := 0;
    END CASE;

    -- Return true if under limit
    RETURN active_dream_count < max_dreams;
END;
$$ LANGUAGE plpgsql;

-- Function to update dream reflection count
CREATE OR REPLACE FUNCTION update_dream_reflection_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.dreams
        SET
            reflection_count = reflection_count + 1,
            last_reflection_at = NEW.created_at
        WHERE id = NEW.dream_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.dreams
        SET reflection_count = reflection_count - 1
        WHERE id = OLD.dream_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update dream stats when reflections change
CREATE TRIGGER update_dream_stats_on_reflection
AFTER INSERT OR DELETE ON public.reflections
FOR EACH ROW EXECUTE FUNCTION update_dream_reflection_count();

-- =====================================================
-- HELPFUL QUERIES FOR DREAMS
-- =====================================================

/*
-- Get user's active dreams with stats
SELECT
    d.*,
    d.days_left,
    COUNT(r.id) as reflection_count,
    MAX(r.created_at) as last_reflection
FROM dreams d
LEFT JOIN reflections r ON d.id = r.dream_id
WHERE d.user_id = (SELECT id FROM users WHERE email = 'ahiya.butman@gmail.com')
AND d.status = 'active'
GROUP BY d.id
ORDER BY d.created_at DESC;

-- Check if user can create another dream
SELECT check_dream_limit((SELECT id FROM users WHERE email = 'ahiya.butman@gmail.com'));

-- Get dream with all reflections
SELECT
    d.title as dream_title,
    d.description,
    d.days_left,
    r.created_at,
    r.tone,
    LEFT(r.ai_response, 100) as response_preview
FROM dreams d
JOIN reflections r ON d.id = r.dream_id
WHERE d.id = 'dream-uuid-here'
ORDER BY r.created_at DESC;
*/
