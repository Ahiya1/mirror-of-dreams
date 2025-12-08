-- =============================================================================
-- Mirror of Dreams - Production Admin Seeding Script
-- =============================================================================
-- Purpose: Elevate ahiya.butman@gmail.com to admin status in production
--
-- This script is IDEMPOTENT - safe to run multiple times without side effects.
--
-- Prerequisites:
--   1. The user must have already signed up through the application
--   2. The user account must exist in the database
--
-- How to run:
--   Option 1: Supabase Dashboard
--     1. Go to your Supabase project
--     2. Navigate to SQL Editor
--     3. Paste this entire script
--     4. Click "Run"
--
--   Option 2: Supabase CLI
--     supabase link --project-ref <your-project-ref>
--     supabase db execute --file scripts/seed-admin-production.sql
--
--   Option 3: Direct psql connection
--     psql <connection-string> -f scripts/seed-admin-production.sql
--
-- =============================================================================

DO $$
DECLARE
    target_email TEXT := 'ahiya.butman@gmail.com';
    affected_rows INTEGER;
    user_found RECORD;
BEGIN
    -- =========================================================================
    -- Step 1: Check if user exists
    -- =========================================================================
    SELECT id, email, name, tier, is_admin, is_creator, email_verified
    INTO user_found
    FROM public.users
    WHERE email = target_email;

    IF NOT FOUND THEN
        -- User doesn't exist yet - they need to sign up first
        RAISE NOTICE '';
        RAISE NOTICE '============================================================';
        RAISE NOTICE 'USER NOT FOUND: %', target_email;
        RAISE NOTICE '============================================================';
        RAISE NOTICE '';
        RAISE NOTICE 'The user must sign up through the application first.';
        RAISE NOTICE 'After they sign up, run this script again.';
        RAISE NOTICE '';
        RETURN;
    END IF;

    -- =========================================================================
    -- Step 2: Update user to admin status
    -- =========================================================================
    UPDATE public.users
    SET
        is_admin = true,
        is_creator = true,
        tier = 'unlimited',
        subscription_status = 'active',
        email_verified = true,
        updated_at = NOW()
    WHERE email = target_email
      AND (
        -- Only update if something actually needs to change
        is_admin IS DISTINCT FROM true
        OR is_creator IS DISTINCT FROM true
        OR tier IS DISTINCT FROM 'unlimited'
        OR email_verified IS DISTINCT FROM true
      );

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    -- =========================================================================
    -- Step 3: Report results
    -- =========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ADMIN SEEDING COMPLETE';
    RAISE NOTICE '============================================================';

    IF affected_rows > 0 THEN
        RAISE NOTICE 'Status: UPDATED';
        RAISE NOTICE 'User: %', target_email;
        RAISE NOTICE '';
        RAISE NOTICE 'Applied changes:';
        RAISE NOTICE '  - is_admin: true';
        RAISE NOTICE '  - is_creator: true';
        RAISE NOTICE '  - tier: unlimited';
        RAISE NOTICE '  - subscription_status: active';
        RAISE NOTICE '  - email_verified: true';
    ELSE
        RAISE NOTICE 'Status: NO CHANGES NEEDED';
        RAISE NOTICE 'User: %', target_email;
        RAISE NOTICE '';
        RAISE NOTICE 'The user already has admin privileges.';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';

END $$;

-- =============================================================================
-- Verification Query
-- =============================================================================
-- Run this to verify the user's current status after running the script above
-- =============================================================================

SELECT
    id,
    email,
    name,
    tier,
    subscription_status,
    is_admin,
    is_creator,
    email_verified,
    created_at,
    updated_at
FROM public.users
WHERE email = 'ahiya.butman@gmail.com';
