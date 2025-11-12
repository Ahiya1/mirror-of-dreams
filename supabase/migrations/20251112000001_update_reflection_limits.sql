-- =====================================================
-- Migration: Update reflection tier limits
-- Date: 2025-11-12
-- Purpose: Align reflection limits with vision
-- =====================================================

-- Update check_reflection_limit function to match vision:
-- Free: 4 reflections/month (was 1)
-- Essential: 10 reflections/month (was 5)
-- Optimal: 30 reflections/month (new tier)
-- Premium: Unlimited (999999)

CREATE OR REPLACE FUNCTION check_reflection_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    current_count INTEGER;
    max_reflections INTEGER;
    is_creator_user BOOLEAN;
    is_admin_user BOOLEAN;
BEGIN
    -- Get user's current tier, usage, and special flags
    SELECT tier, reflection_count_this_month, is_creator, is_admin
    INTO user_tier, current_count, is_creator_user, is_admin_user
    FROM public.users
    WHERE id = user_uuid;

    -- Creators and admins have unlimited access
    IF is_creator_user = true OR is_admin_user = true THEN
        RETURN true;
    END IF;

    -- Set limits based on tier (aligned with vision)
    CASE user_tier
        WHEN 'free' THEN max_reflections := 4;       -- Vision: 4/month
        WHEN 'essential' THEN max_reflections := 10; -- Between free and optimal
        WHEN 'optimal' THEN max_reflections := 30;   -- Vision: 30/month
        WHEN 'premium' THEN max_reflections := 999999; -- Unlimited
        ELSE max_reflections := 0;
    END CASE;

    -- Return true if under limit
    RETURN current_count < max_reflections;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_reflection_limit IS
'Check if user can create another reflection based on tier limits.
Aligned with vision: Free=4/month, Essential=10/month, Optimal=30/month, Premium=Unlimited';
