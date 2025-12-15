-- Migration: Fix Demo User Creator Flag
-- Purpose: Set demo user is_creator=true to allow admin panel access in E2E tests
-- Date: 2025-12-16
--
-- The demo user was originally created with is_creator=false, but the admin
-- panel requires creator or admin access. Setting is_creator=true allows
-- the demo user to access admin features for demonstration purposes.

UPDATE public.users
SET is_creator = true, updated_at = NOW()
WHERE is_demo = true AND is_creator = false;

-- Add comment explaining the change
COMMENT ON COLUMN public.users.is_creator IS
  'True if user is a creator (has admin panel access). Demo users have this set to true for demonstration purposes.';
