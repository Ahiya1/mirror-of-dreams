// server/trpc/context.ts - Request context creation with JWT verification

import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import jwt from 'jsonwebtoken';

import { getAuthCookie } from '@/server/lib/cookies';
import { authLogger } from '@/server/lib/logger';
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
      // Verify JWT (includes automatic expiry check)
      const decoded = jwt.verify(token, JWT_SECRET);
      const payload = decoded as JWTPayload;

      // Explicit expiry check with clear logging
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        authLogger.warn(
          {
            operation: 'context.create',
            userId: payload.userId,
            expiredAt: new Date(payload.exp * 1000).toISOString(),
            expiredAgo: `${Math.floor((now - payload.exp) / 60)} minutes`,
          },
          'JWT token expired'
        );
        user = null;
      } else {
        // Fetch fresh user data from database
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', payload.userId)
          .single();

        if (error) {
          authLogger.error(
            { err: error, operation: 'context.create', userId: payload.userId },
            'Context creation - Supabase error'
          );
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
      }
    } catch (e) {
      // Handle specific JWT errors with appropriate log levels
      if (e instanceof jwt.TokenExpiredError) {
        authLogger.warn(
          {
            operation: 'context.create',
            expiredAt: e.expiredAt?.toISOString(),
            message: e.message,
          },
          'JWT token expired (caught by jwt.verify)'
        );
      } else if (e instanceof jwt.JsonWebTokenError) {
        authLogger.warn(
          { operation: 'context.create', message: (e as Error).message },
          'Invalid JWT token'
        );
      } else if (e instanceof jwt.NotBeforeError) {
        authLogger.warn(
          { operation: 'context.create', date: (e as jwt.NotBeforeError).date?.toISOString() },
          'JWT token not yet valid'
        );
      } else {
        // Database or other unexpected error
        authLogger.error({ err: e, operation: 'context.create' }, 'Context creation error');
      }
      user = null;
    }
  }

  return {
    user,
    req, // Include request for rate limiting IP extraction
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
