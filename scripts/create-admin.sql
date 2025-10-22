-- Create/Update Admin User
-- Run this after signing up through the app

UPDATE public.users
SET
  is_admin = true,
  tier = 'premium',
  subscription_status = 'active'
WHERE email = 'ahiya.butman@gmail.com';

-- Verify the update
SELECT id, email, name, tier, is_admin, subscription_status
FROM public.users
WHERE email = 'ahiya.butman@gmail.com';
