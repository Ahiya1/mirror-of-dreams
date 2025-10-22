-- Migration: Delete Gift Feature
-- Date: 2025-10-22
-- Purpose: Remove subscription_gifts table and all related gift functionality
-- This is a DESTRUCTIVE migration - backup data before running

-- Step 1: Export unredeemed gifts to CSV manually (run this first!)
-- COMMENT OUT AFTER BACKUP:
-- COPY (SELECT * FROM public.subscription_gifts WHERE is_redeemed = FALSE)
-- TO '/tmp/unredeemed_gifts_backup.csv' CSV HEADER;

-- Step 2: Drop RLS policies for subscription_gifts
DROP POLICY IF EXISTS "Anyone can view gifts by code" ON public.subscription_gifts;
DROP POLICY IF EXISTS "Anyone can insert gifts" ON public.subscription_gifts;
DROP POLICY IF EXISTS "Recipients can update their gifts" ON public.subscription_gifts;

-- Step 3: Drop indexes
DROP INDEX IF EXISTS public.idx_subscription_gifts_gift_code;
DROP INDEX IF EXISTS public.idx_subscription_gifts_giver_email;
DROP INDEX IF EXISTS public.idx_subscription_gifts_recipient_email;
DROP INDEX IF EXISTS public.idx_subscription_gifts_is_redeemed;

-- Step 4: Drop the subscription_gifts table (CASCADE removes dependencies)
DROP TABLE IF EXISTS public.subscription_gifts CASCADE;

-- Step 5: Verify no functions reference subscription_gifts
-- (Manual check - search for any functions/triggers that might reference the table)

-- Migration complete!
-- Note: This is a one-way migration. If rollback is needed, restore from backup.
