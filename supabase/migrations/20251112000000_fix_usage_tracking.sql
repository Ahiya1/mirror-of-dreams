-- =====================================================
-- Migration: Fix usage_tracking schema mismatch
-- Date: 2025-11-12
-- Purpose: Change month_year (TEXT) to month (DATE)
-- =====================================================

-- This migration fixes a critical schema mismatch where:
-- - The usage_tracking table has month_year column (TEXT format 'YYYY-MM')
-- - The increment_usage_counter function expects month column (DATE type)
-- - The check_evolution_limit and check_visualization_limit functions expect month column (DATE type)

-- STEP 1: Rename column
ALTER TABLE public.usage_tracking
RENAME COLUMN month_year TO month;

-- STEP 2: Convert TEXT to DATE
-- If existing data is in 'YYYY-MM' format, convert to first day of month
ALTER TABLE public.usage_tracking
ALTER COLUMN month TYPE DATE
USING (month || '-01')::DATE;

-- STEP 3: Update unique constraint
ALTER TABLE public.usage_tracking
DROP CONSTRAINT IF EXISTS usage_tracking_user_id_month_year_key;

ALTER TABLE public.usage_tracking
ADD CONSTRAINT usage_tracking_user_id_month_key
UNIQUE (user_id, month);

-- STEP 4: Update index
DROP INDEX IF EXISTS idx_usage_tracking_month_year;
CREATE INDEX idx_usage_tracking_month ON public.usage_tracking(month);

-- STEP 5: Add comment for documentation
COMMENT ON COLUMN public.usage_tracking.month IS
'Usage tracking month - stored as first day of month in YYYY-MM-DD format';

-- STEP 6: Update the usage_tracking table to have a "reflections" column
-- The increment_usage_counter function references this column but it might not exist
ALTER TABLE public.usage_tracking
ADD COLUMN IF NOT EXISTS reflections INTEGER DEFAULT 0 CHECK (reflections >= 0);

-- =====================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- =====================================================

-- Verify column type changed:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'usage_tracking' AND column_name = 'month';

-- Verify unique constraint exists:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'usage_tracking' AND constraint_name LIKE '%month%';

-- Test increment_usage_counter function:
-- SELECT increment_usage_counter(
--   (SELECT id FROM users LIMIT 1),
--   DATE_TRUNC('month', CURRENT_DATE)::DATE,
--   'reflections'
-- );

-- =====================================================
-- ROLLBACK PLAN (if needed)
-- =====================================================

-- To rollback this migration:
-- ALTER TABLE public.usage_tracking RENAME COLUMN month TO month_year;
-- ALTER TABLE public.usage_tracking ALTER COLUMN month_year TYPE TEXT;
-- ALTER TABLE public.usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_month_key;
-- ALTER TABLE public.usage_tracking ADD CONSTRAINT usage_tracking_user_id_month_year_key UNIQUE (user_id, month_year);
-- DROP INDEX IF EXISTS idx_usage_tracking_month;
-- CREATE INDEX idx_usage_tracking_month_year ON public.usage_tracking(month_year);
