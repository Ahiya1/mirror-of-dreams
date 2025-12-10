# Builder Task Breakdown

## Overview

**2** primary builders will work in parallel.
Builder-2 depends on Builder-1's output (cache utility).

## Builder Assignment Strategy

- **Builder-1** creates the cache utility as a standalone, testable module
- **Builder-2** integrates caching into context builder and adds invalidation hooks
- Builders work on separate files with minimal overlap
- Builder-2 should wait for Builder-1 to complete cache utility before starting integration

---

## Builder-1: Cache Utility & Unit Tests

### Scope

Create the Redis caching utility (`server/lib/cache.ts`) with fail-open circuit breaker pattern, complete with comprehensive unit tests. This is the foundation module that Builder-2 will depend on.

### Complexity Estimate

**MEDIUM**

Well-defined scope based on existing `rate-limiter.ts` pattern. Testing adds complexity but patterns are established.

### Success Criteria

- [ ] `server/lib/cache.ts` created with all exports documented in patterns.md
- [ ] `cacheGet<T>()` returns cached value or null (fail-open)
- [ ] `cacheSet<T>()` stores value with configurable TTL (fire-and-forget)
- [ ] `cacheDelete()` removes single key
- [ ] `cacheDeleteUserContext()` removes all user context keys
- [ ] Circuit breaker opens after 3 consecutive failures
- [ ] Circuit breaker recovers after 15 seconds (half-open)
- [ ] `CACHE_TTL` constants exported with correct values
- [ ] `cacheKeys` generators exported for all 5 data types
- [ ] `getCacheCircuitStatus()` returns monitoring info
- [ ] `resetCacheCircuitBreaker()` for testing
- [ ] `isCacheEnabled()` returns availability status
- [ ] Graceful degradation when Redis not configured (env vars missing)
- [ ] Unit test coverage >= 85%
- [ ] All tests pass

### Files to Create

| File | Purpose |
|------|---------|
| `server/lib/cache.ts` | Redis caching utility module |
| `server/lib/__tests__/cache.test.ts` | Unit tests for cache utility |

### Dependencies

**Depends on:** Nothing (standalone module)
**Blocks:** Builder-2 (context builder integration)

### Implementation Notes

1. **Follow rate-limiter.ts pattern exactly** for Redis client initialization and circuit breaker

2. **Key differences from rate-limiter:**
   - Fail-OPEN (not fail-closed) - cache failures never block requests
   - Lower failure threshold (3 vs 5)
   - Shorter recovery timeout (15s vs 30s)
   - No half-open request quota needed (simpler recovery)

3. **Redis client conditional creation:**
   ```typescript
   const redis = REDIS_URL && REDIS_TOKEN
     ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
     : null;
   ```

4. **All operations must check for null redis first**

5. **Use structured logging via `logger` (not `dbLogger`)**

6. **TTL values (in seconds):**
   - USER_CONTEXT: 300 (5 min)
   - DREAMS: 120 (2 min)
   - PATTERNS: 600 (10 min)
   - SESSIONS: 60 (1 min)
   - REFLECTIONS: 300 (5 min)

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Cache Utility Structure** for complete implementation
- Follow **Test File Structure** for test organization
- Use **Mocking Redis** pattern for tests

### Testing Requirements

**Unit Tests Required:**

```typescript
describe('Cache Utility', () => {
  describe('cacheGet', () => {
    it('returns null when Redis not configured');
    it('returns cached value when present');
    it('returns null on cache miss');
    it('returns null when circuit is open');
    it('records success on successful get');
    it('records failure on get error');
  });

  describe('cacheSet', () => {
    it('does nothing when Redis not configured');
    it('sets value with correct TTL');
    it('uses default TTL when not specified');
    it('does nothing when circuit is open');
    it('records success on successful set');
    it('records failure on set error');
  });

  describe('cacheDelete', () => {
    it('does nothing when Redis not configured');
    it('removes key from cache');
    it('handles non-existent keys gracefully');
    it('does nothing when circuit is open');
  });

  describe('cacheDeleteUserContext', () => {
    it('deletes all 5 context keys for user');
    it('handles partial failures gracefully');
  });

  describe('Circuit Breaker', () => {
    it('opens after 3 consecutive failures');
    it('resets on successful operation');
    it('allows half-open request after 15s timeout');
    it('logs when circuit opens');
    it('logs when circuit recovers');
  });

  describe('cacheKeys', () => {
    it('generates correct key for userContext');
    it('generates correct key for dreams');
    it('generates correct key for patterns');
    it('generates correct key for sessions');
    it('generates correct key for reflections');
  });

  describe('CACHE_TTL', () => {
    it('has correct value for USER_CONTEXT (300)');
    it('has correct value for DREAMS (120)');
    it('has correct value for PATTERNS (600)');
    it('has correct value for SESSIONS (60)');
    it('has correct value for REFLECTIONS (300)');
  });
});
```

**Coverage target:** 85%+

### Estimated Time

2-3 hours

---

## Builder-2: Context Builder Optimization & Cache Integration

### Scope

Optimize `buildClarifyContext()` with query parallelization via `Promise.all()`, integrate Redis caching using the cache utility from Builder-1, add performance timing logs, and add cache invalidation hooks to all relevant routers.

### Complexity Estimate

**HIGH**

Multiple files to modify, integration with external module, testing requires mocking both Supabase and cache layer.

### Success Criteria

- [ ] All 5 database queries execute in parallel via `Promise.all()`
- [ ] Cache-aside pattern implemented for all 5 data types
- [ ] Cache hits return immediately without database query
- [ ] Cache misses populate cache after database fetch
- [ ] Performance logging captures duration, cache hits/misses
- [ ] Integration tests verify caching behavior
- [ ] Cache invalidation added to `dreams.ts` (create, update, delete, updateStatus)
- [ ] Cache invalidation added to `reflection.ts` (create)
- [ ] Cache invalidation added to `clarify.ts` (createSession)
- [ ] Cache invalidation added to `users.ts` (updateProfile)
- [ ] All existing tests still pass
- [ ] Test coverage >= 80% for context builder

### Files to Create

| File | Purpose |
|------|---------|
| `lib/clarify/__tests__/context-builder.test.ts` | Integration tests for context builder |

### Files to Modify

| File | Changes |
|------|---------|
| `lib/clarify/context-builder.ts` | Parallelization + caching + logging |
| `server/trpc/routers/dreams.ts` | Add cache invalidation |
| `server/trpc/routers/reflection.ts` | Add cache invalidation |
| `server/trpc/routers/clarify.ts` | Add cache invalidation |
| `server/trpc/routers/users.ts` | Add cache invalidation |

### Dependencies

**Depends on:** Builder-1 (cache utility must be complete)
**Blocks:** Nothing

### Implementation Notes

#### 1. Context Builder Changes (`lib/clarify/context-builder.ts`)

**Add imports at top:**
```typescript
import { dbLogger } from '@/server/lib/logger';
import {
  cacheGet,
  cacheSet,
  cacheKeys,
  CACHE_TTL,
} from '@/server/lib/cache';
```

**Define types for cached data:**
```typescript
interface CachedUserContext {
  name: string | null;
  tier: string;
  total_reflections: number;
  total_clarify_sessions: number;
}

interface CachedDream {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
}

// ... similar for patterns, sessions, reflections
```

**Implement cache-aside for each data type:**
```typescript
// Example for user context
let user = await cacheGet<CachedUserContext>(cacheKeys.userContext(userId));
let userCacheHit = !!user;

if (!user) {
  const { data } = await supabase
    .from('users')
    .select('name, tier, total_reflections, total_clarify_sessions')
    .eq('id', userId)
    .single();

  if (data) {
    user = data;
    cacheSet(cacheKeys.userContext(userId), data, { ttl: CACHE_TTL.USER_CONTEXT });
  }
}
```

**Parallel execution pattern:**
```typescript
const startTime = performance.now();
let cacheHits = 0;
let cacheMisses = 0;

// Try cache first for all data types
const [
  cachedUser,
  cachedDreams,
  cachedPatterns,
  cachedSessions,
  cachedReflections,
] = await Promise.all([
  cacheGet<CachedUserContext>(cacheKeys.userContext(userId)),
  cacheGet<CachedDream[]>(cacheKeys.dreams(userId)),
  cacheGet<CachedPattern[]>(cacheKeys.patterns(userId)),
  cacheGet<CachedSession[]>(cacheKeys.sessions(userId)),
  cacheGet<CachedReflection[]>(cacheKeys.reflections(userId)),
]);

// Track hits/misses
if (cachedUser) cacheHits++; else cacheMisses++;
if (cachedDreams) cacheHits++; else cacheMisses++;
// ... etc

// Fetch missing data from database (only cache misses)
const dbQueries: Promise<any>[] = [];
const queryIndices: string[] = [];

if (!cachedUser) {
  queryIndices.push('user');
  dbQueries.push(
    supabase.from('users').select('...').eq('id', userId).single()
  );
}
if (!cachedDreams) {
  queryIndices.push('dreams');
  dbQueries.push(
    supabase.from('dreams').select('...').eq('user_id', userId)...
  );
}
// ... etc for other cache misses

// Execute all DB queries in parallel
const dbResults = await Promise.all(dbQueries);

// Map results back to variables and populate cache
let user = cachedUser;
let dreams = cachedDreams;
// ... etc

for (let i = 0; i < queryIndices.length; i++) {
  const type = queryIndices[i];
  const result = dbResults[i];

  if (type === 'user' && result.data) {
    user = result.data;
    cacheSet(cacheKeys.userContext(userId), result.data, { ttl: CACHE_TTL.USER_CONTEXT });
  }
  // ... etc
}
```

**Add performance logging before return:**
```typescript
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
```

#### 2. Router Invalidation Hooks

**Add to top of each router file:**
```typescript
import { cacheDelete, cacheKeys } from '@/server/lib/cache';
```

**Add after each mutation's success:**
```typescript
// dreams.ts - create, update, delete, updateStatus
await cacheDelete(cacheKeys.dreams(ctx.user.id));

// reflection.ts - create
await cacheDelete(cacheKeys.reflections(ctx.user.id));

// clarify.ts - createSession
await cacheDelete(cacheKeys.sessions(ctx.user.id));

// users.ts - updateProfile
await cacheDelete(cacheKeys.userContext(ctx.user.id));
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Query Parallelization Pattern** for Promise.all() structure
- Use **Cache-Aside Pattern** for each data type
- Use **Cache Invalidation Pattern** for router hooks
- Use **Performance Timing Pattern** for logging
- Use **Mocking Supabase** for tests

### Testing Requirements

**Integration Tests Required:**

```typescript
// lib/clarify/__tests__/context-builder.test.ts

describe('buildClarifyContext', () => {
  describe('Query Parallelization', () => {
    it('executes all database queries in parallel');
    it('handles partial query failures gracefully');
    it('returns valid context when some queries return empty');
  });

  describe('Caching Integration', () => {
    it('returns cached data when all cache hits');
    it('fetches from database on cache miss');
    it('populates cache after database fetch');
    it('tracks cache hits and misses in logs');
    it('works correctly when cache is disabled');
    it('handles cache errors gracefully (fallback to DB)');
  });

  describe('Performance Logging', () => {
    it('logs duration in milliseconds');
    it('logs cache hit/miss counts');
    it('logs sections included and tokens used');
  });

  describe('Context Building', () => {
    it('builds valid context with all sections');
    it('respects token budget');
    it('prioritizes sections correctly');
    it('handles empty context gracefully');
  });
});
```

**Coverage target:** 80%+

### Potential Split Strategy

If this task proves too complex, consider splitting:

**Foundation (Builder-2):**
- Query parallelization only (no caching)
- Performance logging
- Estimated: 1-2 hours

**Sub-builder 2A: Cache Integration**
- Add caching to context builder
- Integration tests
- Estimated: 1-2 hours

**Sub-builder 2B: Router Invalidation**
- Add invalidation hooks to all routers
- Estimated: 1 hour

### Estimated Time

3-4 hours (or 4-5 hours if split)

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

- **Builder-1:** Cache Utility & Unit Tests

### Sequential (Depends on Group 1)

- **Builder-2:** Context Builder Optimization & Cache Integration
  - Wait for Builder-1 to complete `server/lib/cache.ts`
  - Can start test file setup while waiting

### Integration Notes

1. **No merge conflicts expected** - builders work on separate files
2. **Shared read-only dependencies:** `@/server/lib/logger`, `@/lib/utils/constants`
3. **Builder-2 depends on Builder-1 exports:**
   - `cacheGet`, `cacheSet`, `cacheDelete`
   - `cacheKeys`, `CACHE_TTL`

### Post-Builder Integration Steps

1. Run full test suite: `npm run test`
2. Run type check: `npm run typecheck`
3. Run lint: `npm run lint`
4. Run build: `npm run build`
5. Manual verification with real Redis (if available)

---

## Summary Table

| Builder | Scope | Files Created | Files Modified | Complexity | Time Est. |
|---------|-------|---------------|----------------|------------|-----------|
| Builder-1 | Cache Utility | 2 | 0 | MEDIUM | 2-3 hrs |
| Builder-2 | Context Builder | 1 | 5 | HIGH | 3-4 hrs |
| **Total** | | 3 | 5 | | 5-7 hrs |

---

*Builder tasks defined: 2025-12-10*
*Iteration: 36 | Plan: plan-21*
