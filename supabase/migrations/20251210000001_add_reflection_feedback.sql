-- Migration: Add feedback columns to reflections table
-- This enables users to rate their reflections and provide feedback

-- Add rating column (1-10 scale)
ALTER TABLE public.reflections
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 10);

-- Add user_feedback column for text feedback
ALTER TABLE public.reflections
ADD COLUMN IF NOT EXISTS user_feedback TEXT;

-- Create index on rating for feedback queries
CREATE INDEX IF NOT EXISTS idx_reflections_rating ON public.reflections(rating)
WHERE rating IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.reflections.rating IS 'User rating of the reflection (1-10 scale)';
COMMENT ON COLUMN public.reflections.user_feedback IS 'Optional text feedback from user about the reflection';
