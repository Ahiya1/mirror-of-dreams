// server/lib/supabase.ts - Supabase client singleton

import { createClient } from '@supabase/supabase-js';

// Use placeholder values for build time (will fail at runtime if not set properly)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
