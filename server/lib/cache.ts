// server/lib/cache.ts - Redis caching utility with fail-open circuit breaker

import { Redis } from '@upstash/redis';

import { logger } from './logger';

// =====================================================
// TYPES
// =====================================================

/**
 * Redis client interface for cache operations.
 * Used for dependency injection and testing.
 */
export interface RedisClient {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, options?: { ex?: number }) => Promise<string | null>;
  del: (key: string) => Promise<number>;
}

// =====================================================
// REDIS CLIENT INITIALIZATION
// =====================================================

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client (or null if not configured)
// Use type assertion as Upstash Redis is compatible with our interface
const defaultRedis: RedisClient | null =
  REDIS_URL && REDIS_TOKEN
    ? (new Redis({
        url: REDIS_URL,
        token: REDIS_TOKEN,
      }) as unknown as RedisClient)
    : null;

// =====================================================
// TTL CONFIGURATION (in seconds)
// =====================================================

export const CACHE_TTL = {
  USER_CONTEXT: 5 * 60, // 5 minutes - user data changes rarely
  DREAMS: 2 * 60, // 2 minutes - dreams can be updated
  PATTERNS: 10 * 60, // 10 minutes - patterns consolidated infrequently
  SESSIONS: 1 * 60, // 1 minute - sessions update with messages
  REFLECTIONS: 5 * 60, // 5 minutes - reflections are read-only
} as const;

// =====================================================
// CACHE KEY GENERATORS
// =====================================================

export const cacheKeys = {
  userContext: (userId: string) => `ctx:user:${userId}`,
  dreams: (userId: string) => `ctx:dreams:${userId}`,
  patterns: (userId: string) => `ctx:patterns:${userId}`,
  sessions: (userId: string) => `ctx:sessions:${userId}`,
  reflections: (userId: string) => `ctx:reflections:${userId}`,
} as const;

// =====================================================
// CIRCUIT BREAKER (Cache-specific, fail-open)
// =====================================================

const CACHE_CIRCUIT = {
  FAILURE_THRESHOLD: 3, // Open after 3 failures (vs 5 for rate limiter)
  RECOVERY_TIMEOUT_MS: 15000, // 15 seconds (vs 30 for rate limiter)
};

let cacheCircuitState = {
  failures: 0,
  openedAt: 0,
};

function isCacheCircuitOpen(): boolean {
  if (cacheCircuitState.failures >= CACHE_CIRCUIT.FAILURE_THRESHOLD) {
    const elapsed = Date.now() - cacheCircuitState.openedAt;
    if (elapsed < CACHE_CIRCUIT.RECOVERY_TIMEOUT_MS) {
      return true;
    }
    // Half-open: reset to allow one test request
    cacheCircuitState.failures = CACHE_CIRCUIT.FAILURE_THRESHOLD - 1;
  }
  return false;
}

function recordCacheSuccess(): void {
  if (cacheCircuitState.failures > 0) {
    logger.info(
      { service: 'cache', previousFailures: cacheCircuitState.failures },
      'Cache circuit breaker: Redis recovered'
    );
  }
  cacheCircuitState = { failures: 0, openedAt: 0 };
}

function recordCacheFailure(): void {
  cacheCircuitState.failures++;
  if (cacheCircuitState.failures === CACHE_CIRCUIT.FAILURE_THRESHOLD) {
    cacheCircuitState.openedAt = Date.now();
    logger.warn(
      {
        service: 'cache',
        failureCount: cacheCircuitState.failures,
        recoveryTimeMs: CACHE_CIRCUIT.RECOVERY_TIMEOUT_MS,
      },
      'Cache circuit breaker OPEN: Falling back to database'
    );
  }
}

// =====================================================
// CACHE OPERATIONS
// =====================================================

export interface CacheOptions {
  ttl?: number; // TTL in seconds
}

/**
 * Get value from cache.
 * Returns null on miss or error (fail-open behavior).
 *
 * @param key - The cache key to fetch
 * @param client - Optional Redis client (defaults to configured client, pass null to disable)
 */
export async function cacheGet<T>(
  key: string,
  client: RedisClient | null = defaultRedis
): Promise<T | null> {
  if (!client) return null;
  if (isCacheCircuitOpen()) return null;

  try {
    const data = await client.get<T>(key);
    recordCacheSuccess();
    return data;
  } catch (error) {
    logger.warn({ err: error, key, service: 'cache' }, 'Cache get failed');
    recordCacheFailure();
    return null;
  }
}

/**
 * Set value in cache.
 * Fails silently (non-blocking, fire-and-forget).
 *
 * @param key - The cache key
 * @param value - The value to cache
 * @param options - Cache options including TTL
 * @param client - Optional Redis client (defaults to configured client, pass null to disable)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {},
  client: RedisClient | null = defaultRedis
): Promise<void> {
  if (!client) return;
  if (isCacheCircuitOpen()) return;

  try {
    const ttl = options.ttl ?? CACHE_TTL.USER_CONTEXT;
    await client.set(key, value, { ex: ttl });
    recordCacheSuccess();
  } catch (error) {
    logger.warn({ err: error, key, service: 'cache' }, 'Cache set failed');
    recordCacheFailure();
  }
}

/**
 * Delete value from cache (for invalidation).
 * Fails silently.
 *
 * @param key - The cache key to delete
 * @param client - Optional Redis client (defaults to configured client, pass null to disable)
 */
export async function cacheDelete(
  key: string,
  client: RedisClient | null = defaultRedis
): Promise<void> {
  if (!client) return;
  if (isCacheCircuitOpen()) return;

  try {
    await client.del(key);
    recordCacheSuccess();
  } catch (error) {
    logger.warn({ err: error, key, service: 'cache' }, 'Cache delete failed');
    recordCacheFailure();
  }
}

/**
 * Delete all context cache keys for a user.
 * Used when invalidating all user data.
 *
 * @param userId - The user ID to invalidate cache for
 * @param client - Optional Redis client (defaults to configured client, pass null to disable)
 */
export async function cacheDeleteUserContext(
  userId: string,
  client: RedisClient | null = defaultRedis
): Promise<void> {
  if (!client) return;

  const keysToDelete = [
    cacheKeys.userContext(userId),
    cacheKeys.dreams(userId),
    cacheKeys.patterns(userId),
    cacheKeys.sessions(userId),
    cacheKeys.reflections(userId),
  ];

  try {
    await Promise.all(keysToDelete.map((key) => client.del(key)));
    recordCacheSuccess();
  } catch (error) {
    logger.warn({ err: error, userId, service: 'cache' }, 'Cache user context delete failed');
    recordCacheFailure();
  }
}

/**
 * Check if cache is available and circuit is closed.
 *
 * @param client - Optional Redis client to check (defaults to configured client)
 */
export function isCacheEnabled(client: RedisClient | null = defaultRedis): boolean {
  return client !== null && !isCacheCircuitOpen();
}

/**
 * Get circuit breaker status (for monitoring/testing).
 */
export function getCacheCircuitStatus(): {
  isOpen: boolean;
  failures: number;
  recoveryIn: number | null;
} {
  const isOpen = cacheCircuitState.failures >= CACHE_CIRCUIT.FAILURE_THRESHOLD;
  const timeSinceOpened = cacheCircuitState.openedAt
    ? Date.now() - cacheCircuitState.openedAt
    : null;
  const recoveryIn =
    isOpen && timeSinceOpened !== null
      ? Math.max(0, CACHE_CIRCUIT.RECOVERY_TIMEOUT_MS - timeSinceOpened)
      : null;

  return { isOpen, failures: cacheCircuitState.failures, recoveryIn };
}

/**
 * Reset circuit breaker state (for testing only).
 */
export function resetCacheCircuitBreaker(): void {
  cacheCircuitState = { failures: 0, openedAt: 0 };
}
