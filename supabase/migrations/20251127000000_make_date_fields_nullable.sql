-- Plan-4 Iteration 1: Make date fields nullable
-- Reason: hasDate and dreamDate questions removed from reflection flow
-- These columns remain for historical data but new reflections don't use them

-- Make has_date nullable and remove CHECK constraint
ALTER TABLE public.reflections 
  ALTER COLUMN has_date DROP NOT NULL;

-- Remove CHECK constraint on has_date
ALTER TABLE public.reflections 
  DROP CONSTRAINT IF EXISTS reflections_has_date_check;

-- Add new CHECK constraint allowing NULL
ALTER TABLE public.reflections 
  ADD CONSTRAINT reflections_has_date_check 
  CHECK (has_date IS NULL OR has_date IN ('yes', 'no'));

-- dream_date is already nullable (no change needed)

-- Comment explaining the change
COMMENT ON COLUMN public.reflections.has_date IS 
  'DEPRECATED: Date question removed in plan-4 iteration-1. NULL for new reflections, preserved for historical data.';

COMMENT ON COLUMN public.reflections.dream_date IS 
  'DEPRECATED: Date question removed in plan-4 iteration-1. NULL for new reflections, preserved for historical data.';
