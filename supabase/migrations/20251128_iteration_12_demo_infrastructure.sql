-- Migration: Iteration 12 - Demo Infrastructure
-- Builder: Builder-1
-- Date: 2025-11-28
--
-- Changes:
-- 1. Add `preferences` JSONB column for user settings
-- 2. Add `is_demo` boolean flag for demo user identification
-- 3. Create index for demo user lookup
-- 4. Seed demo user account

-- Add preferences JSONB column for user settings
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;

-- Add is_demo flag for demo user identification
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create index for demo user lookup (partial index for performance)
CREATE INDEX IF NOT EXISTS idx_users_is_demo
ON public.users(is_demo)
WHERE is_demo = true;

-- Add documentation comments
COMMENT ON COLUMN public.users.preferences IS
  'User settings stored as JSONB: notification_email, reflection_reminders, evolution_email, marketing_emails, default_tone, show_character_counter, reduce_motion_override, analytics_opt_in';

COMMENT ON COLUMN public.users.is_demo IS
  'True if this is the demo account (read-only, cached for performance). Only one demo user should exist.';

-- Seed demo user (placeholder - actual content via seeding script)
INSERT INTO public.users (
  email,
  password_hash,
  name,
  tier,
  is_demo,
  email_verified,
  subscription_status,
  subscription_period,
  reflection_count_this_month,
  total_reflections,
  current_month_year,
  language,
  is_creator,
  is_admin,
  preferences,
  created_at,
  last_sign_in_at,
  updated_at
) VALUES (
  'demo@mirrorofdreams.com',
  'demo-account-no-password', -- Special value, login via JWT without password
  'Demo User',
  'premium', -- Show all premium features
  true,
  true,
  'active',
  'yearly',
  0, -- Will be updated by seeding script
  0, -- Will be updated by seeding script
  TO_CHAR(NOW(), 'YYYY-MM'),
  'en',
  false,
  false,
  '{
    "notification_email": true,
    "reflection_reminders": "off",
    "evolution_email": true,
    "marketing_emails": false,
    "default_tone": "fusion",
    "show_character_counter": true,
    "reduce_motion_override": null,
    "analytics_opt_in": true
  }'::JSONB,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  is_demo = EXCLUDED.is_demo,
  tier = EXCLUDED.tier,
  preferences = EXCLUDED.preferences,
  updated_at = NOW();
