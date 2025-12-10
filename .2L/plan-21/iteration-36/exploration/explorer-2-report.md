# Explorer 2 Report: Redis Caching Architecture for Context Builder

## Executive Summary

The Mirror of Dreams application already has Upstash Redis infrastructure established for rate limiting with a robust circuit breaker pattern. This report provides a comprehensive design for extending Redis usage to cache context builder data, significantly reducing database queries for AI operations. The caching layer will target user context, dreams, patterns, reflections, and sessions with appropriate TTLs and graceful fallback strategies.

## Discoveries

### Current Redis Infrastructure

The application uses `@upstash/redis` (v1.35.0) and `@upstash/ratelimit` (v2.0.7) for rate limiting:

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts`

```typescript
// Existing Redis client initialization
const redis =
  REDIS_URL && REDIS_TOKEN
    ? new Redis({
        url: REDIS_URL,
        token: REDIS_TOKEN,
      })
    : null;
```

Key observations:
- Redis client is conditionally created (graceful degradation when unconfigured)
- Circuit breaker pattern already implemented with 5-failure threshold
- Fail-closed security approach for rate limiting
- Environment variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Context Builder Analysis

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts`

The `buildClarifyContext()` function makes **5 sequential database queries** per Clarify session message:
1. User data (name, tier, totals)
2. Active dreams (up to 5)
3. Patterns (up to 10, strength >= 3)
4. Recent sessions (up to 3)
5. Recent reflections (up to 3)

This is a prime candidate for caching - these queries are:
- Read-heavy (same data accessed repeatedly within a session)
- Slow to change (user data, dreams, patterns change infrequently)
- Token-budget aware (already has trimming logic)

### Data Entities to Cache

| Entity | Current Location | Update Frequency | Access Pattern |
|--------|-----------------|------------------|----------------|
| User Context | `users` table | Low (profile edits) | Every AI call |
| Active Dreams | `dreams` table | Medium (CRUD) | Every AI call |
| Patterns | `clarify_patterns` table | Low (consolidated) | Every Clarify message |
| Recent Sessions | `clarify_sessions` table | Medium (new sessions) | Every Clarify message |
| Recent Reflections | `reflections` table | Medium (new reflections) | Every AI call |

## Patterns Identified

### Pattern 1: Cache-Aside with Fallback
**Description:** Check cache first, fetch from DB on miss, populate cache
**Use Case:** All cached data types
**Example:**
```typescript
async function getCachedUserContext(userId: string): Promise<UserContext | null> {
  const cacheKey = `ctx:user:${userId}`;
  
  // Try cache first
  const cached = await cache.get<UserContext>(cacheKey);
  if (cached) return cached;
  
  // Fallback to database
  const data = await fetchUserContextFromDB(userId);
  if (data) {
    await cache.set(cacheKey, data, { ttl: CACHE_TTL.USER_CONTEXT });
  }
  
  return data;
}
```
**Recommendation:** Implement for all context builder data

### Pattern 2: Hierarchical Cache Keys
**Description:** Use structured key namespaces for easy invalidation
**Use Case:** All cached data
**Example:**
```
ctx:user:{userId}              - User context
ctx:dreams:{userId}            - Active dreams list
ctx:patterns:{userId}          - User patterns
ctx:sessions:{userId}          - Recent sessions
ctx:reflections:{userId}       - Recent reflections
```
**Recommendation:** Use colons as separators, prefix with `ctx:` for context builder namespace

### Pattern 3: Circuit Breaker Reuse
**Description:** Extend existing circuit breaker for cache operations
**Use Case:** All cache operations
**Example:**
```typescript
// Reuse rate-limiter circuit breaker pattern
async function cacheGet<T>(key: string): Promise<T | null> {
  if (isCircuitOpen()) {
    return null; // Fail open for cache (non-critical)
  }
  
  try {
    const result = await redis.get(key);
    recordSuccess();
    return result ? JSON.parse(result) : null;
  } catch (e) {
    recordFailure();
    return null; // Graceful degradation
  }
}
```
**Recommendation:** Cache operations should fail-OPEN (unlike rate limiting which fails-CLOSED)

## Complexity Assessment

### High Complexity Areas

- **Cache Invalidation Strategy**: Ensuring data consistency across distributed cache requires careful design. Need to invalidate on:
  - Dream CRUD operations
  - Reflection creation
  - User profile updates
  - Pattern consolidation

**Estimated effort:** 4-6 hours

### Medium Complexity Areas

- **TTL Tuning**: Finding optimal TTLs that balance freshness vs performance
- **Serialization**: JSON serialization of complex objects with dates
- **Testing**: Mocking Redis for unit tests while maintaining integration test coverage

**Estimated effort:** 2-3 hours each

### Low Complexity Areas

- **Cache Utility Implementation**: Straightforward wrapper around Upstash Redis
- **Cache Key Generation**: Simple string templating

**Estimated effort:** 1-2 hours each

## Technology Recommendations

### Primary Stack (Already in Place)
- **Redis Provider:** Upstash Redis (serverless, REST API)
- **Client:** `@upstash/redis` (v1.35.0)
- **Connection:** HTTPS REST API (serverless-friendly)

### Cache Utility Design

**Proposed location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/cache.ts`

```typescript
// server/lib/cache.ts - Redis caching utility

import { Redis } from '@upstash/redis';
import { logger } from './logger';

// Environment check (reuse same pattern as rate-limiter)
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
// TTL CONFIGURATION (in seconds)
// =====================================================

export const CACHE_TTL = {
  USER_CONTEXT: 5 * 60,       // 5 minutes - user data changes rarely
  DREAMS: 2 * 60,             // 2 minutes - dreams can be updated
  PATTERNS: 10 * 60,          // 10 minutes - patterns are consolidated infrequently
  SESSIONS: 1 * 60,           // 1 minute - sessions update with messages
  REFLECTIONS: 5 * 60,        // 5 minutes - reflections are read-only after creation
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
  
  // Pattern for invalidation
  allUserKeys: (userId: string) => `ctx:*:${userId}`,
} as const;

// =====================================================
// CIRCUIT BREAKER (Cache-specific, fail-open)
// =====================================================

const CACHE_CIRCUIT = {
  FAILURE_THRESHOLD: 3,
  RECOVERY_TIMEOUT_MS: 15000, // 15 seconds
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
    // Half-open: allow one request
    cacheCircuitState.failures = CACHE_CIRCUIT.FAILURE_THRESHOLD - 1;
  }
  return false;
}

function recordCacheSuccess(): void {
  cacheCircuitState = { failures: 0, openedAt: 0 };
}

function recordCacheFailure(): void {
  cacheCircuitState.failures++;
  if (cacheCircuitState.failures === CACHE_CIRCUIT.FAILURE_THRESHOLD) {
    cacheCircuitState.openedAt = Date.now();
    logger.warn({ service: 'cache' }, 'Cache circuit breaker OPEN');
  }
}

// =====================================================
// CACHE OPERATIONS
// =====================================================

export interface CacheOptions {
  ttl?: number; // TTL in seconds
}

/**
 * Get value from cache
 * Returns null on miss or error (fail-open)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  if (isCacheCircuitOpen()) return null;

  try {
    const data = await redis.get<T>(key);
    recordCacheSuccess();
    return data;
  } catch (e) {
    logger.warn({ err: e, key, service: 'cache' }, 'Cache get failed');
    recordCacheFailure();
    return null;
  }
}

/**
 * Set value in cache
 * Fails silently (non-blocking)
 */
export async function cacheSet<T>(
  key: string, 
  value: T, 
  options: CacheOptions = {}
): Promise<void> {
  if (!redis) return;
  if (isCacheCircuitOpen()) return;

  try {
    const ttl = options.ttl || CACHE_TTL.USER_CONTEXT;
    await redis.set(key, value, { ex: ttl });
    recordCacheSuccess();
  } catch (e) {
    logger.warn({ err: e, key, service: 'cache' }, 'Cache set failed');
    recordCacheFailure();
  }
}

/**
 * Delete value from cache (for invalidation)
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return;
  if (isCacheCircuitOpen()) return;

  try {
    await redis.del(key);
    recordCacheSuccess();
  } catch (e) {
    logger.warn({ err: e, key, service: 'cache' }, 'Cache delete failed');
    recordCacheFailure();
  }
}

/**
 * Delete multiple keys matching a pattern
 * Note: Upstash doesn't support SCAN, so we track keys explicitly
 */
export async function cacheDeletePattern(userId: string): Promise<void> {
  if (!redis) return;

  const keysToDelete = [
    cacheKeys.userContext(userId),
    cacheKeys.dreams(userId),
    cacheKeys.patterns(userId),
    cacheKeys.sessions(userId),
    cacheKeys.reflections(userId),
  ];

  try {
    await Promise.all(keysToDelete.map(key => redis.del(key)));
    recordCacheSuccess();
  } catch (e) {
    logger.warn({ err: e, userId, service: 'cache' }, 'Cache pattern delete failed');
    recordCacheFailure();
  }
}

/**
 * Check if cache is available
 */
export function isCacheEnabled(): boolean {
  return redis !== null && !isCacheCircuitOpen();
}

/**
 * Reset circuit breaker (for testing)
 */
export function resetCacheCircuitBreaker(): void {
  cacheCircuitState = { failures: 0, openedAt: 0 };
}
```

## TTL Recommendations

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User Context | 5 minutes | Profile data changes rarely, but monthly usage counters update |
| Dreams | 2 minutes | Users may create/update dreams during a session |
| Patterns | 10 minutes | Patterns are consolidated infrequently (background job) |
| Sessions | 1 minute | Session metadata updates with each message |
| Reflections | 5 minutes | Reflections are immutable after creation |

### TTL Strategy Considerations

1. **Short enough for freshness**: Users expect immediate updates after actions
2. **Long enough for performance**: Reduce DB queries during multi-turn conversations
3. **Aligned with usage patterns**: Clarify sessions typically last 5-15 minutes

## Cache Invalidation Strategy

### Invalidation Triggers

| Event | Keys to Invalidate | Location |
|-------|-------------------|----------|
| Dream created | `ctx:dreams:{userId}` | `dreams.ts:create` |
| Dream updated | `ctx:dreams:{userId}` | `dreams.ts:update` |
| Dream deleted | `ctx:dreams:{userId}` | `dreams.ts:delete` |
| Reflection created | `ctx:reflections:{userId}` | `reflection.ts:create` |
| User profile updated | `ctx:user:{userId}` | `users.ts:updateProfile` |
| Session created | `ctx:sessions:{userId}` | `clarify.ts:createSession` |
| Pattern consolidated | `ctx:patterns:{userId}` | Pattern consolidation job |

### Implementation Pattern

```typescript
// In dream router after mutation
await cacheDelete(cacheKeys.dreams(userId));

// In reflection router after creation
await cacheDelete(cacheKeys.reflections(userId));
```

## Integration Points

### Context Builder Integration

**File to modify:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts`

```typescript
import { 
  cacheGet, 
  cacheSet, 
  cacheKeys, 
  CACHE_TTL 
} from '@/server/lib/cache';

export async function buildClarifyContext(
  userId: string,
  currentSessionId: string
): Promise<string> {
  const budget = CLARIFY_CONTEXT_LIMITS.maxContextTokens;
  const sections: ContextSection[] = [];

  // 1. Fetch user data (with cache)
  let user = await cacheGet<UserContext>(cacheKeys.userContext(userId));
  if (!user) {
    const { data } = await supabase
      .from('users')
      .select('name, tier, total_reflections, total_clarify_sessions')
      .eq('id', userId)
      .single();
    
    if (data) {
      user = data;
      await cacheSet(cacheKeys.userContext(userId), user, { 
        ttl: CACHE_TTL.USER_CONTEXT 
      });
    }
  }

  // ... similar pattern for dreams, patterns, sessions, reflections
}
```

### Router Integration (Invalidation)

**Files to modify:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts`

## Risks & Challenges

### Technical Risks

1. **Stale Data Display**
   - **Impact:** Medium - Users see outdated dream lists after edits
   - **Mitigation:** Short TTLs + aggressive invalidation on mutations

2. **Cache Stampede**
   - **Impact:** Low - Multiple requests hit DB when cache expires
   - **Mitigation:** Not critical for this use case (low concurrency per user)

3. **Serialization Edge Cases**
   - **Impact:** Low - Date objects, circular references
   - **Mitigation:** Use simple data structures, test thoroughly

### Complexity Risks

1. **Invalidation Coverage**
   - **Likelihood:** Medium
   - **Issue:** Missing invalidation in some code paths
   - **Mitigation:** Centralize invalidation helpers, comprehensive testing

2. **Testing Complexity**
   - **Likelihood:** Medium
   - **Issue:** Mocking Redis in tests
   - **Mitigation:** Use vitest mocks following rate-limiter test patterns

## Recommendations for Planner

1. **Create cache utility first** (`server/lib/cache.ts`) as a standalone module that can be tested independently

2. **Integrate incrementally:**
   - Phase 1: Cache user context only (lowest risk, highest frequency)
   - Phase 2: Cache dreams and patterns
   - Phase 3: Cache sessions and reflections

3. **Add cache metrics** to existing logging for observability (hit/miss rates)

4. **Consider cache warming** - Pre-populate cache when user signs in

5. **Test with Redis disabled** to verify graceful fallback works

## Resource Map

### Critical Files/Directories

| Path | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts` | Existing Redis usage pattern (reference) |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/cache.ts` | NEW: Cache utility to create |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts` | Context builder to modify |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts` | Add invalidation hooks |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` | Add invalidation hooks |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts` | Add invalidation hooks |

### Key Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@upstash/redis` | 1.35.0 | Redis client (already installed) |
| `vitest` | 2.1.0 | Testing framework |

### Testing Infrastructure

| Tool | Purpose |
|------|---------|
| Vitest | Unit and integration tests |
| `vi.mock('@upstash/redis')` | Mock Redis for unit tests |
| Existing rate-limiter tests | Pattern reference for cache tests |

## Test Requirements

### Unit Tests for Cache Utility

```typescript
// server/lib/__tests__/cache.test.ts

describe('Cache Utility', () => {
  describe('cacheGet', () => {
    it('returns null when Redis not configured', async () => {});
    it('returns cached value when present', async () => {});
    it('returns null on cache miss', async () => {});
    it('returns null when circuit is open', async () => {});
  });

  describe('cacheSet', () => {
    it('does nothing when Redis not configured', async () => {});
    it('sets value with correct TTL', async () => {});
    it('does nothing when circuit is open', async () => {});
  });

  describe('cacheDelete', () => {
    it('removes key from cache', async () => {});
    it('handles non-existent keys gracefully', async () => {});
  });

  describe('Circuit Breaker', () => {
    it('opens after 3 consecutive failures', async () => {});
    it('resets on successful operation', async () => {});
    it('allows half-open request after timeout', async () => {});
  });
});
```

### Integration Tests for Context Builder

```typescript
// lib/clarify/__tests__/context-builder.test.ts

describe('buildClarifyContext with caching', () => {
  it('uses cached user context when available', async () => {});
  it('falls back to database on cache miss', async () => {});
  it('populates cache after database fetch', async () => {});
  it('works correctly when Redis unavailable', async () => {});
});
```

## Questions for Planner

1. Should cache warming be implemented on user login, or lazy-load on first access?

2. Should we add cache hit/miss metrics to the existing logging infrastructure?

3. Is there a need for manual cache invalidation (admin endpoint)?

4. Should we implement different circuit breaker thresholds for caching vs rate limiting?

---

*Report generated for Iteration 36, Plan 21 - Redis Caching Architecture*
