# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── lib/
│   ├── clarify/
│   │   ├── context-builder.ts    # MODIFIED: Parallelization + caching
│   │   └── __tests__/
│   │       └── context-builder.test.ts  # NEW
│   └── utils/
│       └── constants.ts          # Existing constants
├── server/
│   ├── lib/
│   │   ├── cache.ts              # NEW: Redis caching utility
│   │   ├── __tests__/
│   │   │   └── cache.test.ts     # NEW
│   │   ├── rate-limiter.ts       # Reference (no changes)
│   │   ├── logger.ts             # Existing loggers
│   │   └── supabase.ts           # Existing client
│   └── trpc/routers/
│       ├── dreams.ts             # MODIFIED: Add invalidation
│       ├── reflection.ts         # MODIFIED: Add invalidation
│       ├── clarify.ts            # MODIFIED: Add invalidation
│       └── users.ts              # MODIFIED: Add invalidation
└── vitest.config.ts              # Existing test config
```

## Naming Conventions

- Files: camelCase (`context-builder.ts`, `rate-limiter.ts`)
- Test files: `{module}.test.ts` pattern
- Constants: SCREAMING_SNAKE_CASE (`CACHE_TTL`, `CIRCUIT_BREAKER`)
- Functions: camelCase (`cacheGet`, `buildClarifyContext`)
- Types/Interfaces: PascalCase (`CacheOptions`, `ContextSection`)
- Cache keys: lowercase with colons (`ctx:user:{userId}`)

## Import Order Convention

```typescript
// 1. Node built-ins (if any)
import path from 'path';

// 2. External packages (alphabetically)
import { Redis } from '@upstash/redis';
import { z } from 'zod';

// 3. Internal absolute imports (alphabetically)
import { CLARIFY_CONTEXT_LIMITS } from '@/lib/utils/constants';
import { dbLogger } from '@/server/lib/logger';
import { supabase } from '@/server/lib/supabase';

// 4. Relative imports
import { cacheGet, cacheSet, cacheKeys, CACHE_TTL } from './cache';

// 5. Type-only imports (last)
import type { ClarifyPattern } from '@/types/pattern';
```

---

## Cache Utility Patterns

### Cache Utility Structure

**File:** `server/lib/cache.ts`

```typescript
// server/lib/cache.ts - Redis caching utility with fail-open circuit breaker

import { Redis } from '@upstash/redis';

import { logger } from './logger';

// =====================================================
// REDIS CLIENT INITIALIZATION
// =====================================================

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
  USER_CONTEXT: 5 * 60,     // 5 minutes - user data changes rarely
  DREAMS: 2 * 60,           // 2 minutes - dreams can be updated
  PATTERNS: 10 * 60,        // 10 minutes - patterns consolidated infrequently
  SESSIONS: 1 * 60,         // 1 minute - sessions update with messages
  REFLECTIONS: 5 * 60,      // 5 minutes - reflections are read-only
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
  FAILURE_THRESHOLD: 3,       // Open after 3 failures (vs 5 for rate limiter)
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
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  if (isCacheCircuitOpen()) return null;

  try {
    const data = await redis.get<T>(key);
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
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  if (!redis) return;
  if (isCacheCircuitOpen()) return;

  try {
    const ttl = options.ttl ?? CACHE_TTL.USER_CONTEXT;
    await redis.set(key, value, { ex: ttl });
    recordCacheSuccess();
  } catch (error) {
    logger.warn({ err: error, key, service: 'cache' }, 'Cache set failed');
    recordCacheFailure();
  }
}

/**
 * Delete value from cache (for invalidation).
 * Fails silently.
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return;
  if (isCacheCircuitOpen()) return;

  try {
    await redis.del(key);
    recordCacheSuccess();
  } catch (error) {
    logger.warn({ err: error, key, service: 'cache' }, 'Cache delete failed');
    recordCacheFailure();
  }
}

/**
 * Delete all context cache keys for a user.
 * Used when invalidating all user data.
 */
export async function cacheDeleteUserContext(userId: string): Promise<void> {
  if (!redis) return;

  const keysToDelete = [
    cacheKeys.userContext(userId),
    cacheKeys.dreams(userId),
    cacheKeys.patterns(userId),
    cacheKeys.sessions(userId),
    cacheKeys.reflections(userId),
  ];

  try {
    await Promise.all(keysToDelete.map((key) => redis.del(key)));
    recordCacheSuccess();
  } catch (error) {
    logger.warn(
      { err: error, userId, service: 'cache' },
      'Cache user context delete failed'
    );
    recordCacheFailure();
  }
}

/**
 * Check if cache is available and circuit is closed.
 */
export function isCacheEnabled(): boolean {
  return redis !== null && !isCacheCircuitOpen();
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
```

---

## Query Parallelization Pattern

### Promise.all() for Independent Queries

**When to use:** Multiple async operations with no data dependencies between them.

**Before (Sequential - BAD):**

```typescript
// BAD: Each query waits for the previous one to complete
const { data: user } = await supabase.from('users').select(...);
const { data: dreams } = await supabase.from('dreams').select(...);
const { data: patterns } = await supabase.from('clarify_patterns').select(...);
// Total time: query1 + query2 + query3 = ~250-500ms
```

**After (Parallel - GOOD):**

```typescript
// GOOD: All queries execute simultaneously
const [
  { data: user },
  { data: dreams },
  { data: patterns },
  { data: sessions },
  { data: reflections },
] = await Promise.all([
  supabase
    .from('users')
    .select('name, tier, total_reflections, total_clarify_sessions')
    .eq('id', userId)
    .single(),

  supabase
    .from('dreams')
    .select('id, title, description, status, category')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxDreams),

  supabase
    .from('clarify_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('strength', PATTERN_CONSOLIDATION.minStrengthThreshold)
    .order('strength', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxPatterns),

  supabase
    .from('clarify_sessions')
    .select('id, title, created_at, message_count')
    .eq('user_id', userId)
    .neq('id', currentSessionId)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxCrossSessions),

  supabase
    .from('reflections')
    .select('id, tone, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxReflections),
]);
// Total time: max(query1, query2, query3, query4, query5) = ~50-100ms
```

**Key points:**
- Destructuring maintains variable names for downstream processing
- Each query result is still nullable (Supabase returns `{ data: T | null }`)
- If one query fails, `Promise.all()` rejects - but Supabase client returns errors in result, not throws

---

## Cache-Aside Pattern

### Standard Cache-Aside with Fallback

**When to use:** All cached data types in context builder.

**Code example:**

```typescript
import {
  cacheGet,
  cacheSet,
  cacheKeys,
  CACHE_TTL,
} from '@/server/lib/cache';

// Type definition for cached data
interface CachedUserContext {
  name: string | null;
  tier: string;
  total_reflections: number;
  total_clarify_sessions: number;
}

async function fetchUserWithCache(userId: string): Promise<CachedUserContext | null> {
  // 1. Try cache first
  const cached = await cacheGet<CachedUserContext>(cacheKeys.userContext(userId));
  if (cached) {
    return cached;
  }

  // 2. Cache miss - fetch from database
  const { data } = await supabase
    .from('users')
    .select('name, tier, total_reflections, total_clarify_sessions')
    .eq('id', userId)
    .single();

  // 3. Populate cache for next time
  if (data) {
    // Fire-and-forget - don't await
    cacheSet(cacheKeys.userContext(userId), data, { ttl: CACHE_TTL.USER_CONTEXT });
  }

  return data;
}
```

**Key points:**
- Cache read is awaited (need the data)
- Cache write is fire-and-forget (don't block response)
- Null handling: cache miss returns null, DB miss returns null
- TTL specified explicitly per data type

---

## Cache Invalidation Pattern

### Single Key Invalidation

**When to use:** After CRUD operations on cached entities.

**Code example:**

```typescript
// In dreams.ts router after create/update/delete
import { cacheDelete, cacheKeys } from '@/server/lib/cache';

// After successful mutation
await cacheDelete(cacheKeys.dreams(userId));
```

### Router Integration Example

```typescript
// server/trpc/routers/dreams.ts

import { cacheDelete, cacheKeys } from '@/server/lib/cache';

export const dreamsRouter = router({
  create: protectedProcedure
    .input(createDreamSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // ... existing create logic ...

      // Invalidate cache after successful create
      await cacheDelete(cacheKeys.dreams(userId));

      return result;
    }),

  update: protectedProcedure
    .input(updateDreamSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // ... existing update logic ...

      // Invalidate cache after successful update
      await cacheDelete(cacheKeys.dreams(userId));

      return result;
    }),

  delete: protectedProcedure
    .input(dreamIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // ... existing delete logic ...

      // Invalidate cache after successful delete
      await cacheDelete(cacheKeys.dreams(userId));

      return result;
    }),
});
```

### Invalidation Mapping

| Event | Cache Key to Invalidate | Router Location |
|-------|------------------------|-----------------|
| Dream created/updated/deleted | `ctx:dreams:{userId}` | `dreams.ts` |
| Reflection created | `ctx:reflections:{userId}` | `reflection.ts` |
| User profile updated | `ctx:user:{userId}` | `users.ts` |
| Session created | `ctx:sessions:{userId}` | `clarify.ts` |
| Patterns consolidated | `ctx:patterns:{userId}` | Pattern job |

---

## Performance Timing Pattern

### Structured Performance Logging

**When to use:** All performance-critical operations.

**Code example:**

```typescript
import { dbLogger } from '@/server/lib/logger';

export async function buildClarifyContext(
  userId: string,
  currentSessionId: string
): Promise<string> {
  const startTime = performance.now();
  let cacheHits = 0;
  let cacheMisses = 0;

  // ... fetch data with cache tracking ...

  // Example cache tracking
  const user = await cacheGet<UserContext>(cacheKeys.userContext(userId));
  if (user) {
    cacheHits++;
  } else {
    cacheMisses++;
    // ... fetch from DB ...
  }

  // ... rest of function ...

  // Log performance metrics at end
  const duration = Math.round(performance.now() - startTime);

  dbLogger.info(
    {
      operation: 'clarify.buildContext',
      userId,
      sessionId: currentSessionId,
      durationMs: duration,
      cacheHits,
      cacheMisses,
      sectionsIncluded: includedSections.length,
      tokensUsed: usedTokens,
    },
    'Context build complete'
  );

  return contextString;
}
```

**Key points:**
- Use `performance.now()` for high-resolution timing
- Round duration to avoid decimal noise in logs
- Track cache hits/misses for observability
- Include all relevant context in structured log object

---

## Testing Patterns

### Test File Naming Conventions

- Unit tests: `{module}.test.ts` (in `__tests__/` directory next to module)
- Integration tests: Same pattern, differentiated by test content

### Test File Structure

```typescript
// server/lib/__tests__/cache.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @upstash/redis before any imports that use it
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  })),
}));

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// Import module AFTER mocks are set up
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheKeys,
  CACHE_TTL,
  getCacheCircuitStatus,
  resetCacheCircuitBreaker,
} from '../cache';

describe('Cache Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCacheCircuitBreaker();
  });

  afterEach(() => {
    vi.resetModules();
    vi.useRealTimers();
  });

  describe('cacheGet', () => {
    it('returns cached value when present', async () => {
      // Arrange
      const mockData = { name: 'Test User', tier: 'free' };
      const { Redis } = await import('@upstash/redis');
      const mockRedis = new Redis({ url: '', token: '' });
      (mockRedis.get as any).mockResolvedValue(mockData);

      // Act
      const result = await cacheGet('ctx:user:123');

      // Assert
      expect(result).toEqual(mockData);
    });

    it('returns null on cache miss', async () => {
      // ... test implementation
    });

    it('returns null when circuit breaker is open', async () => {
      // ... test implementation
    });
  });
});
```

### Mocking Redis

```typescript
// Mock Redis client for unit tests
vi.mock('@upstash/redis', () => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockDel = vi.fn();

  return {
    Redis: vi.fn().mockImplementation(() => ({
      get: mockGet,
      set: mockSet,
      del: mockDel,
    })),
    __mockGet: mockGet,
    __mockSet: mockSet,
    __mockDel: mockDel,
  };
});

// Access mocks in tests
const redisMocks = await vi.importMock('@upstash/redis');
(redisMocks.__mockGet as any).mockResolvedValue({ name: 'Test' });
```

### Mocking Supabase for Context Builder Tests

```typescript
// lib/clarify/__tests__/context-builder.test.ts

vi.mock('@/server/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));
```

### Test Data Factories

```typescript
// lib/clarify/__tests__/test-utils.ts

export function createMockUser(overrides: Partial<UserContext> = {}): UserContext {
  return {
    name: 'Test User',
    tier: 'free',
    total_reflections: 5,
    total_clarify_sessions: 3,
    ...overrides,
  };
}

export function createMockDream(overrides: Partial<Dream> = {}): Dream {
  return {
    id: 'dream-123',
    title: 'Test Dream',
    description: 'A test dream description',
    status: 'active',
    category: 'personal_growth',
    ...overrides,
  };
}

export function createMockPattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: 'pattern-123',
    user_id: 'user-123',
    pattern_type: 'recurring_theme',
    content: 'Test pattern content',
    strength: 5,
    ...overrides,
  };
}
```

### Coverage Expectations

| Module | Minimum Coverage | Target Coverage |
|--------|------------------|-----------------|
| `server/lib/cache.ts` | 85% | 90% |
| `lib/clarify/context-builder.ts` | 80% | 85% |
| Router invalidation hooks | 70% | 80% |

---

## Error Handling Patterns

### Cache Error Handling (Fail-Open)

```typescript
// Cache errors should NEVER block the request
try {
  const cached = await redis.get<T>(key);
  recordCacheSuccess();
  return cached;
} catch (error) {
  // Log for observability
  logger.warn({ err: error, key, service: 'cache' }, 'Cache get failed');
  // Record for circuit breaker
  recordCacheFailure();
  // Return null - caller falls back to database
  return null;
}
```

**Key points:**
- Always catch cache errors
- Log with structured context
- Update circuit breaker state
- Return null (never throw)

### Database Error Handling

```typescript
// Database errors may need to propagate
const { data, error } = await supabase
  .from('users')
  .select('...')
  .eq('id', userId)
  .single();

if (error) {
  dbLogger.error({ err: error, userId }, 'Failed to fetch user');
  // Context builder handles null gracefully
  return null;
}

return data;
```

### Graceful Degradation in Context Builder

```typescript
// Each section is built independently - partial context is valid
if (user) {
  sections.push({
    priority: 1,
    content: buildUserSection(user),
    tokens: estimateTokens(userSection),
  });
}
// If user is null, this section is simply skipped

if (dreams && dreams.length > 0) {
  sections.push({
    priority: 2,
    content: buildDreamsSection(dreams),
    tokens: estimateTokens(dreamsSection),
  });
}
// If dreams is null or empty, this section is skipped
```

---

## Security Patterns

### Input Validation (Already in Place)

```typescript
// Validation happens at tRPC layer via Zod
const dreamIdSchema = z.object({
  id: z.string().uuid(),
});

// By the time we reach cache/DB, inputs are validated
export const deleteDream = protectedProcedure
  .input(dreamIdSchema)
  .mutation(async ({ ctx, input }) => {
    // input.id is guaranteed to be a valid UUID string
    await cacheDelete(cacheKeys.dreams(ctx.user.id));
  });
```

### Cache Key Safety

```typescript
// Cache keys use only userId (UUID) - never user-controlled content
export const cacheKeys = {
  userContext: (userId: string) => `ctx:user:${userId}`,
  // userId is always from session (trusted) not from request body
};

// Usage in router - userId comes from authenticated context
const userId = ctx.user.id; // From session, not request
await cacheDelete(cacheKeys.dreams(userId));
```

### Environment Variable Usage

```typescript
// Environment variables checked at module initialization
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis client only created if both are present
const redis =
  REDIS_URL && REDIS_TOKEN
    ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
    : null;

// All operations check for null redis
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null; // Graceful degradation
  // ...
}
```

---

## CI/CD Patterns

### Test Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- server/lib/__tests__/cache.test.ts

# Watch mode for development
npm run test -- --watch
```

### Pre-commit Checklist

```bash
# 1. Type check
npm run typecheck

# 2. Lint
npm run lint

# 3. Tests with coverage
npm run test:coverage

# 4. Build
npm run build
```

### GitHub Actions (Reference)

```yaml
# Tests run automatically on PR via existing CI workflow
# No changes needed to CI configuration

# Key jobs:
# - typecheck: Ensures TypeScript compiles
# - lint: Ensures code style
# - test: Runs vitest with coverage
# - build: Ensures production build succeeds
```

---

## Performance Patterns

### Parallel Execution for Independent Operations

```typescript
// Pattern: Use Promise.all for independent async operations
const [result1, result2, result3] = await Promise.all([
  operation1(),
  operation2(),
  operation3(),
]);

// Anti-pattern: Sequential awaits for independent operations
const result1 = await operation1(); // Waits
const result2 = await operation2(); // Then waits
const result3 = await operation3(); // Then waits
```

### Fire-and-Forget for Non-Critical Operations

```typescript
// Pattern: Don't await cache writes (non-critical)
if (data) {
  cacheSet(key, data, { ttl: CACHE_TTL.USER_CONTEXT }); // No await
}
return data;

// Only await when you need confirmation
// (rarely needed for cache operations)
```

### Early Return for Cache Hits

```typescript
// Pattern: Return immediately on cache hit
const cached = await cacheGet<T>(key);
if (cached) {
  return cached; // Skip all database work
}

// Only do expensive work on cache miss
const data = await expensiveDatabaseQuery();
cacheSet(key, data, { ttl }); // Fire-and-forget
return data;
```

---

*Patterns documented: 2025-12-10*
*Iteration: 36 | Plan: plan-21*
