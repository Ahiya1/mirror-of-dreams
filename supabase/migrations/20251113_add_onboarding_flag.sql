-- Migration: Add onboarding tracking to users table
-- Iteration: 21 (Plan plan-3)
-- Builder: Builder-2
-- Date: 2025-11-13

-- Add onboarding tracking columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Admin users skip onboarding (already know product)
UPDATE users
SET onboarding_completed = TRUE,
    onboarding_completed_at = NOW()
WHERE is_admin = TRUE OR is_creator = TRUE;

-- Create index for frequent queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
ON users(onboarding_completed);

-- Rollback script (comment out, keep for reference)
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed_at;
-- DROP INDEX IF EXISTS idx_users_onboarding_completed;
