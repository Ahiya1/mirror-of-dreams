// server/lib/rate-limiter.ts - Upstash rate limiting configuration with fail-closed circuit breaker

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

// =====================================================
// CIRCUIT BREAKER CONFIGURATION
// =====================================================

const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 5, // Open after 5 consecutive failures
  RECOVERY_TIMEOUT_MS: 30000, // 30 seconds before half-open
  HALF_OPEN_REQUESTS: 3, // Allow 3 test requests in half-open
};

// Circuit breaker state (module-level singleton)
let circuitState = {
  failures: 0,
  lastFailure: 0,
  openedAt: 0, // When circuit first opened (for recovery timing)
  halfOpenRequests: 0,
};

/**
 * Check if circuit breaker should block requests
 * Uses openedAt timestamp to track when circuit opened (not last failure time)
 */
function isCircuitOpen(): boolean {
  const now = Date.now();

  // Check if circuit is open (at or above threshold)
  if (circuitState.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
    // Use openedAt for recovery timing, not lastFailure
    // openedAt is set when we first hit the threshold
    const timeSinceOpened = now - circuitState.openedAt;

    if (timeSinceOpened < CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS) {
      return true; // Circuit is open, block requests
    }

    // Transition to half-open: allow limited test requests
    if (circuitState.halfOpenRequests < CIRCUIT_BREAKER.HALF_OPEN_REQUESTS) {
      circuitState.halfOpenRequests++;
      return false; // Allow test request
    }

    return true; // Half-open quota exhausted, stay open
  }

  return false; // Circuit is closed, allow requests
}

/**
 * Record successful request (reset circuit breaker)
 */
function recordSuccess(): void {
  if (circuitState.failures > 0) {
    logger.info(
      { service: 'rate-limiter', previousFailures: circuitState.failures },
      'Circuit breaker: Redis recovered, resetting'
    );
  }
  circuitState = { failures: 0, lastFailure: 0, openedAt: 0, halfOpenRequests: 0 };
}

/**
 * Record failed request (increment circuit breaker)
 * During half-open state, failures keep the circuit open but don't reset halfOpenRequests
 */
function recordFailure(): void {
  const wasOpen = circuitState.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD;
  const now = Date.now();

  circuitState.failures++;
  circuitState.lastFailure = now;

  // Only reset halfOpenRequests when transitioning to open for the first time
  // During half-open, we want to preserve the count so all 3 test requests can be attempted
  if (!wasOpen) {
    circuitState.halfOpenRequests = 0;
  }

  // Set openedAt when circuit first opens (at exactly threshold)
  if (circuitState.failures === CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
    circuitState.openedAt = now;
    logger.error(
      {
        service: 'rate-limiter',
        failureCount: circuitState.failures,
        recoveryTimeMs: CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS,
      },
      'Circuit breaker OPEN: Rate limiting will reject all requests'
    );
  }
}

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
 * Check rate limit with fail-closed behavior
 * Returns success: false when Redis fails (security-first approach)
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number; circuitOpen?: boolean }> {
  // Rate limiting disabled via config - allow request
  if (!limiter) {
    return { success: true };
  }

  // Circuit breaker is open - reject request
  if (isCircuitOpen()) {
    logger.warn(
      { service: 'rate-limiter', identifier, circuitState },
      'Rate limit check rejected: Circuit breaker open'
    );
    return { success: false, circuitOpen: true };
  }

  try {
    const result = await limiter.limit(identifier);
    recordSuccess(); // Reset circuit breaker on success
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (e) {
    logger.error(
      { service: 'rate-limiter', err: e, identifier, failureCount: circuitState.failures + 1 },
      'Rate limiter error - FAIL-CLOSED: rejecting request'
    );
    recordFailure();
    // FAIL-CLOSED: Reject request when Redis fails
    return { success: false, circuitOpen: true };
  }
}

/**
 * Get current circuit breaker status (for monitoring)
 */
export function getCircuitBreakerStatus(): {
  isOpen: boolean;
  failures: number;
  timeSinceLastFailure: number | null;
  recoveryIn: number | null;
} {
  const now = Date.now();
  const isOpen = circuitState.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD;
  const timeSinceLastFailure = circuitState.lastFailure ? now - circuitState.lastFailure : null;
  // Use openedAt for recovery timing, not lastFailure
  const timeSinceOpened = circuitState.openedAt ? now - circuitState.openedAt : null;
  const recoveryIn =
    isOpen && timeSinceOpened !== null
      ? Math.max(0, CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS - timeSinceOpened)
      : null;

  return {
    isOpen,
    failures: circuitState.failures,
    timeSinceLastFailure,
    recoveryIn,
  };
}

/**
 * Reset circuit breaker state (for testing)
 */
export function resetCircuitBreaker(): void {
  circuitState = { failures: 0, lastFailure: 0, openedAt: 0, halfOpenRequests: 0 };
}
