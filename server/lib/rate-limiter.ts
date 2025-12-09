// server/lib/rate-limiter.ts - Upstash rate limiting configuration

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { logger } from './logger';

// Check if Redis is configured
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client (or null if not configured)
const redis =
  REDIS_URL && REDIS_TOKEN
    ? new Redis({
        url: REDIS_URL,
        token: REDIS_TOKEN,
      })
    : null;

/**
 * Create a rate limiter with fallback for missing Redis config
 */
function createRateLimiter(
  limit: number,
  window: '1m' | '1h' | '1d',
  prefix: string
): Ratelimit | null {
  if (!redis) {
    logger.warn({ service: 'rate-limiter', prefix }, 'Rate limiter disabled: Redis not configured');
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
    analytics: true,
  });
}

// Auth endpoints: 5 requests per minute per IP (brute-force protection)
export const authRateLimiter = createRateLimiter(5, '1m', 'rl:auth');

// AI endpoints: 10 requests per minute per user (cost protection)
export const aiRateLimiter = createRateLimiter(10, '1m', 'rl:ai');

// Write endpoints: 30 requests per minute per user (spam protection)
export const writeRateLimiter = createRateLimiter(30, '1m', 'rl:write');

// Global: 100 requests per minute per IP (DDoS protection)
export const globalRateLimiter = createRateLimiter(100, '1m', 'rl:global');

/**
 * Check rate limit - returns true if allowed, false if blocked
 * Gracefully handles errors by allowing the request
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  if (!limiter) {
    // Rate limiting disabled - allow request
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (e) {
    logger.error({ service: 'rate-limiter', err: e, identifier }, 'Rate limiter error');
    // Graceful degradation - allow request if Redis fails
    return { success: true };
  }
}
