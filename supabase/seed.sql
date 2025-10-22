-- Mirror of Truth - Seed Data
-- This file seeds the database with initial data for local development

-- Create admin user with ahiya.butman@gmail.com
-- Password: mirror-creator
INSERT INTO public.users (
    id,
    email,
    password_hash,
    name,
    tier,
    is_creator,
    is_admin,
    email_verified,
    subscription_status
) VALUES (
    uuid_generate_v4(),
    'ahiya.butman@gmail.com',
    '$2b$10$.dKHS6iHX612ztdhAt/bMOuLvA4.T/0iEeVy/Obt3ijAl4V1gs7mO',
    'Ahiya',
    'premium',
    true,
    true,
    true,
    'active'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    tier = EXCLUDED.tier,
    is_creator = EXCLUDED.is_creator,
    is_admin = EXCLUDED.is_admin,
    email_verified = EXCLUDED.email_verified,
    subscription_status = EXCLUDED.subscription_status;

-- Optional: Add a test user for development
INSERT INTO public.users (
    id,
    email,
    password_hash,
    name,
    tier,
    email_verified
) VALUES (
    uuid_generate_v4(),
    'test@example.com',
    '$2b$10$vtPFXN5OOs8FSIOAdZQySuqlWDLieLHzxVXHwrGAdxXMimCcCbMxG',
    'Test User',
    'free',
    true
) ON CONFLICT (email) DO NOTHING;
