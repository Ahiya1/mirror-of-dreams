// server/trpc/context.ts - Request context creation with JWT verification

import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import jwt from 'jsonwebtoken';

import { getAuthCookie } from '@/server/lib/cookies';
import { supabase } from '@/server/lib/supabase';
import { type User, type JWTPayload, userRowToUser } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function createContext(opts: FetchCreateContextFnOptions) {
  const { req } = opts;

  // Try to get token from cookie first (preferred)
  const cookieToken = await getAuthCookie();

  // Fallback to Authorization header for backward compatibility
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');

  // Prefer cookie, fallback to header
  const token = cookieToken || headerToken;

  let user: User | null = null;

  if (token) {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      const payload = decoded as JWTPayload;

      // Fetch fresh user data from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();

      if (error) {
        console.error('Context creation - Supabase error:', error);
        user = null;
      } else if (data) {
        // Check if monthly usage needs reset
        const currentMonthYear = new Date().toISOString().slice(0, 7); // "2025-01"
        if (data.current_month_year !== currentMonthYear) {
          // Reset monthly counters
          await supabase
            .from('users')
            .update({
              reflection_count_this_month: 0,
              current_month_year: currentMonthYear,
            })
            .eq('id', data.id);

          data.reflection_count_this_month = 0;
          data.current_month_year = currentMonthYear;
        }

        user = userRowToUser(data);
      }
    } catch (e) {
      // Invalid token or database error
      console.error('Context creation error:', e);
      user = null;
    }
  }

  return {
    user,
    req, // Include request for rate limiting IP extraction
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
