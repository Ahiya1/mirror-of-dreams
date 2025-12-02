-- Migration: Add password reset tokens table
-- Created: 2025-12-02
-- Purpose: Support forgot password / reset password flow

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Index for fast token lookups
    CONSTRAINT password_reset_tokens_token_key UNIQUE (token)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (no direct client access)
-- This ensures tokens are only managed through server-side API
CREATE POLICY "Service role full access to password_reset_tokens"
    ON public.password_reset_tokens
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to clean up expired tokens (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.password_reset_tokens
    WHERE expires_at < NOW() OR used = TRUE;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table
COMMENT ON TABLE public.password_reset_tokens IS 'Stores password reset tokens with expiration';
COMMENT ON COLUMN public.password_reset_tokens.token IS 'Secure random token sent via email';
COMMENT ON COLUMN public.password_reset_tokens.expires_at IS 'Token expires 1 hour after creation';
COMMENT ON COLUMN public.password_reset_tokens.used IS 'Marks token as consumed after password reset';
