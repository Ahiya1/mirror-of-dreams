-- Mirror of Dreams - PayPal Integration Migration
-- This migration transitions from Stripe to PayPal and renames tiers

-- ============================================
-- PART 1: Add PayPal columns
-- ============================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT,
ADD COLUMN IF NOT EXISTS reflections_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reflection_date DATE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- ============================================
-- PART 2: Update tier constraint
-- ============================================
-- First drop old constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;

-- Add new constraint with both old and new values (for safe migration)
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'essential', 'premium', 'pro', 'unlimited'));

-- Migrate existing data
UPDATE public.users SET tier = 'pro' WHERE tier = 'essential';
UPDATE public.users SET tier = 'unlimited' WHERE tier = 'premium';

-- Drop and re-add constraint with only new values
ALTER TABLE public.users DROP CONSTRAINT users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'pro', 'unlimited'));

-- ============================================
-- PART 3: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_paypal_subscription_id
ON public.users(paypal_subscription_id)
WHERE paypal_subscription_id IS NOT NULL;

-- ============================================
-- PART 4: Create webhook_events table
-- ============================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB,
  user_id UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type
ON public.webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
ON public.webhook_events(event_id);

-- ============================================
-- PART 5: Update database functions
-- ============================================

-- Update reflection limit check with new tier names and limits
CREATE OR REPLACE FUNCTION check_reflection_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    current_count INTEGER;
    max_reflections INTEGER;
    is_creator_user BOOLEAN;
    is_admin_user BOOLEAN;
BEGIN
    SELECT tier, reflection_count_this_month, is_creator, is_admin
    INTO user_tier, current_count, is_creator_user, is_admin_user
    FROM public.users WHERE id = user_uuid;

    -- Creators and admins have unlimited access
    IF is_creator_user = true OR is_admin_user = true THEN
        RETURN true;
    END IF;

    -- Set tier limits: free=2, pro=30, unlimited=60
    CASE user_tier
        WHEN 'free' THEN max_reflections := 2;
        WHEN 'pro' THEN max_reflections := 30;
        WHEN 'unlimited' THEN max_reflections := 60;
        ELSE max_reflections := 0;
    END CASE;

    RETURN current_count < max_reflections;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily limit checking function (NEW)
CREATE OR REPLACE FUNCTION check_daily_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    user_timezone TEXT;
    today_date DATE;
    last_date DATE;
    current_count INTEGER;
    max_daily INTEGER;
    is_creator_user BOOLEAN;
    is_admin_user BOOLEAN;
BEGIN
    SELECT tier, timezone, last_reflection_date, reflections_today, is_creator, is_admin
    INTO user_tier, user_timezone, last_date, current_count, is_creator_user, is_admin_user
    FROM public.users WHERE id = user_uuid;

    -- Creators and admins have unlimited access
    IF is_creator_user = true OR is_admin_user = true THEN
        RETURN true;
    END IF;

    -- Use UTC if no timezone set
    IF user_timezone IS NULL OR user_timezone = '' THEN
        user_timezone := 'UTC';
    END IF;

    -- Calculate today in user's timezone
    today_date := (NOW() AT TIME ZONE user_timezone)::DATE;

    -- If new day, user can always create (will reset counter elsewhere)
    IF last_date IS NULL OR last_date != today_date THEN
        RETURN true;
    END IF;

    -- Set daily limits: Free has no daily limit, Pro=1, Unlimited=2
    CASE user_tier
        WHEN 'free' THEN max_daily := 999999;  -- No daily limit for free tier
        WHEN 'pro' THEN max_daily := 1;
        WHEN 'unlimited' THEN max_daily := 2;
        ELSE max_daily := 0;
    END CASE;

    RETURN current_count < max_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update dream limit function with new tier names
CREATE OR REPLACE FUNCTION check_dream_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    active_dream_count INTEGER;
    max_dreams INTEGER;
    is_creator_user BOOLEAN;
    is_admin_user BOOLEAN;
BEGIN
    SELECT tier, is_creator, is_admin
    INTO user_tier, is_creator_user, is_admin_user
    FROM public.users WHERE id = user_uuid;

    -- Creators and admins have unlimited access
    IF is_creator_user = true OR is_admin_user = true THEN
        RETURN true;
    END IF;

    SELECT COUNT(*) INTO active_dream_count
    FROM public.dreams WHERE user_id = user_uuid AND status = 'active';

    -- Set dream limits: free=2, pro=5, unlimited=∞
    CASE user_tier
        WHEN 'free' THEN max_dreams := 2;
        WHEN 'pro' THEN max_dreams := 5;
        WHEN 'unlimited' THEN max_dreams := 999999;  -- Effectively unlimited
        ELSE max_dreams := 0;
    END CASE;

    RETURN active_dream_count < max_dreams;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: Comments for documentation
-- ============================================
COMMENT ON COLUMN public.users.paypal_subscription_id IS 'PayPal subscription ID for active subscriptions';
COMMENT ON COLUMN public.users.paypal_payer_id IS 'PayPal payer ID for the customer';
COMMENT ON COLUMN public.users.reflections_today IS 'Count of reflections created today (resets daily)';
COMMENT ON COLUMN public.users.last_reflection_date IS 'Date of last reflection in user timezone (for daily limit tracking)';
COMMENT ON COLUMN public.users.cancel_at_period_end IS 'Whether subscription is set to cancel at end of current period';
COMMENT ON TABLE public.webhook_events IS 'Stores PayPal webhook events for idempotency and auditing';
