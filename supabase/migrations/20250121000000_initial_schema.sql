-- Mirror of Truth - Complete Database Schema
-- Delete existing tables and create new schema

-- Drop existing tables (run this first)
DROP TABLE IF EXISTS public.evolution_reports CASCADE;
DROP TABLE IF EXISTS public.usage_tracking CASCADE;
DROP TABLE IF EXISTS public.subscription_gifts CASCADE;
DROP TABLE IF EXISTS public.reflections CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE - Core user management with subscriptions
-- =====================================================
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Subscription Management
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'essential', 'premium')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trialing')),
    subscription_id TEXT, -- External subscription ID (Stripe/PayPal)
    subscription_period TEXT DEFAULT 'monthly' CHECK (subscription_period IN ('monthly', 'yearly')),
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Usage Tracking
    last_reflection_at TIMESTAMP WITH TIME ZONE,
    reflection_count_this_month INTEGER DEFAULT 0,
    total_reflections INTEGER DEFAULT 0,
    current_month_year TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
    
    -- Special Users
    is_creator BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'he')),
    timezone TEXT DEFAULT 'UTC',
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE
);

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_users_current_month ON public.users(current_month_year);

-- =====================================================
-- REFLECTIONS TABLE - All user reflections with metadata
-- =====================================================
CREATE TABLE public.reflections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Reflection Content
    dream TEXT NOT NULL,
    plan TEXT NOT NULL,
    has_date TEXT NOT NULL CHECK (has_date IN ('yes', 'no')),
    dream_date DATE,
    relationship TEXT NOT NULL,
    offering TEXT NOT NULL,
    
    -- AI Response
    ai_response TEXT NOT NULL,
    tone TEXT NOT NULL DEFAULT 'fusion' CHECK (tone IN ('gentle', 'intense', 'fusion')),
    
    -- Metadata
    is_premium BOOLEAN DEFAULT FALSE,
    word_count INTEGER,
    estimated_read_time INTEGER, -- in minutes
    
    -- Search and Organization
    title TEXT, -- Auto-generated or user-set title
    tags TEXT[], -- For categorization
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE
);

-- Reflections indexes
CREATE INDEX idx_reflections_user_id ON public.reflections(user_id);
CREATE INDEX idx_reflections_created_at ON public.reflections(created_at DESC);
CREATE INDEX idx_reflections_is_premium ON public.reflections(is_premium);
CREATE INDEX idx_reflections_tone ON public.reflections(tone);
CREATE INDEX idx_reflections_tags ON public.reflections USING GIN(tags);

-- =====================================================
-- USAGE_TRACKING TABLE - Monthly usage by user
-- =====================================================
CREATE TABLE public.usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
    reflection_count INTEGER DEFAULT 0,
    tier_at_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, month_year)
);

-- Usage tracking indexes
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_month_year ON public.usage_tracking(month_year);

-- =====================================================
-- EVOLUTION_REPORTS TABLE - Growth analysis reports
-- =====================================================
CREATE TABLE public.evolution_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Report Content
    analysis TEXT NOT NULL,
    insights JSONB, -- Structured insights data
    
    -- Report Metadata
    report_type TEXT NOT NULL CHECK (report_type IN ('essential', 'premium')),
    reflections_analyzed UUID[] NOT NULL, -- Array of reflection IDs
    reflection_count INTEGER NOT NULL,
    
    -- Analysis Metadata
    time_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    patterns_detected TEXT[],
    growth_score INTEGER CHECK (growth_score BETWEEN 1 AND 100)
);

-- Evolution reports indexes
CREATE INDEX idx_evolution_reports_user_id ON public.evolution_reports(user_id);
CREATE INDEX idx_evolution_reports_created_at ON public.evolution_reports(created_at DESC);
CREATE INDEX idx_evolution_reports_report_type ON public.evolution_reports(report_type);

-- =====================================================
-- SUBSCRIPTION_GIFTS TABLE - Gifted subscriptions
-- =====================================================
CREATE TABLE public.subscription_gifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gift_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Giver Information
    giver_name TEXT NOT NULL,
    giver_email TEXT NOT NULL,
    giver_user_id UUID REFERENCES public.users(id), -- If giver has account
    
    -- Recipient Information
    recipient_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_user_id UUID REFERENCES public.users(id), -- Set when redeemed
    
    -- Gift Details
    subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('essential', 'premium')),
    subscription_duration INTEGER NOT NULL, -- Duration in months
    amount DECIMAL(10,2) NOT NULL,
    
    -- Payment Information
    payment_method TEXT NOT NULL,
    payment_id TEXT,
    
    -- Redemption
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    
    -- Message
    personal_message TEXT,
    
    -- Metadata
    language TEXT DEFAULT 'en'
);

-- Subscription gifts indexes
CREATE INDEX idx_subscription_gifts_gift_code ON public.subscription_gifts(gift_code);
CREATE INDEX idx_subscription_gifts_giver_email ON public.subscription_gifts(giver_email);
CREATE INDEX idx_subscription_gifts_recipient_email ON public.subscription_gifts(recipient_email);
CREATE INDEX idx_subscription_gifts_is_redeemed ON public.subscription_gifts(is_redeemed);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON public.reflections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly usage count
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
DECLARE
    current_month_year TEXT;
BEGIN
    current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Update users who need month reset
    UPDATE public.users 
    SET 
        reflection_count_this_month = 0,
        current_month_year = current_month_year
    WHERE current_month_year != TO_CHAR(NOW(), 'YYYY-MM');
END;
$$ LANGUAGE plpgsql;

-- Function to check reflection limits
CREATE OR REPLACE FUNCTION check_reflection_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    current_count INTEGER;
    max_reflections INTEGER;
BEGIN
    -- Get user's current tier and usage
    SELECT tier, reflection_count_this_month 
    INTO user_tier, current_count
    FROM public.users 
    WHERE id = user_uuid;
    
    -- Set limits based on tier
    CASE user_tier
        WHEN 'free' THEN max_reflections := 1;
        WHEN 'essential' THEN max_reflections := 5;
        WHEN 'premium' THEN max_reflections := 10;
        ELSE max_reflections := 0;
    END CASE;
    
    -- Return true if under limit
    RETURN current_count < max_reflections;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_gifts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Reflections policies
CREATE POLICY "Users can view own reflections" ON public.reflections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections" ON public.reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reflections" ON public.reflections
    FOR UPDATE USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Evolution reports policies
CREATE POLICY "Users can view own reports" ON public.evolution_reports
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.evolution_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscription gifts policies (more permissive for gifting)
CREATE POLICY "Anyone can view gifts by code" ON public.subscription_gifts
    FOR SELECT USING (true);
CREATE POLICY "Anyone can insert gifts" ON public.subscription_gifts
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Recipients can update their gifts" ON public.subscription_gifts
    FOR UPDATE USING (recipient_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create Ahiya as the creator/admin user (you'll need to hash the password)
INSERT INTO public.users (
    id,
    email,
    password_hash,
    name,
    tier,
    is_creator,
    is_admin,
    email_verified
) VALUES (
    uuid_generate_v4(),
    'ahiya.butman@gmail.com',
    '$2b$10$placeholder_hash_replace_with_real_hash', -- Replace with actual bcrypt hash
    'Ahiya',
    'premium',
    true,
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- HELPFUL QUERIES FOR DEVELOPMENT
-- =====================================================

/*
-- Get user with reflection stats
SELECT 
    u.*,
    COUNT(r.id) as total_reflections,
    MAX(r.created_at) as last_reflection
FROM users u 
LEFT JOIN reflections r ON u.id = r.user_id 
WHERE u.email = 'user@example.com'
GROUP BY u.id;

-- Get user's recent reflections
SELECT * FROM reflections 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
ORDER BY created_at DESC 
LIMIT 10;

-- Check if user can create reflection
SELECT check_reflection_limit((SELECT id FROM users WHERE email = 'user@example.com'));

-- Reset monthly usage (run monthly)
SELECT reset_monthly_usage();
*/