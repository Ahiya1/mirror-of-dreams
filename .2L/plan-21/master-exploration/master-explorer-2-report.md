# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Performance & Caching Architecture

## Vision Summary
Optimize Clarify conversation response times from 250-500ms to <100ms by parallelizing sequential database queries and implementing Redis caching with Upstash for frequently-accessed user data.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 2 performance features (query parallelization, Redis caching layer)
- **User stories/acceptance criteria:** 8 specific acceptance criteria in vision.md
- **Estimated total work:** 6-10 hours

### Complexity Rating
**Overall Complexity: MEDIUM**

**Rationale:**
- Existing Upstash Redis infrastructure already configured and working (rate-limiter.ts)
- Clear parallelization opportunities with well-defined query boundaries
- Low risk of breaking changes since we're optimizing existing functionality
- Standard caching patterns with well-established TTL strategies

---

## Current State Analysis

### Sequential Query Pattern in `buildClarifyContext()`

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts:29-174`

**Current Flow (Sequential - 5 queries):**

```
1. Fetch user data -------> ~50ms
2. Fetch active dreams ---> ~50ms
3. Fetch patterns --------> ~50ms
4. Fetch recent sessions -> ~50ms
5. Fetch reflections -----> ~50ms
                           --------
                           ~250ms total (sequential)
```

**Query Analysis:**

| Query | Table | Filters | Est. Latency | Dependencies |
|-------|-------|---------|--------------|--------------|
| 1. User data | `users` | `eq('id', userId)` | 50ms | None |
| 2. Active dreams | `dreams` | `eq('user_id', userId), eq('status', 'active')` | 50ms | None |
| 3. Patterns | `clarify_patterns` | `eq('user_id', userId), gte('strength', 3)` | 50ms | None |
| 4. Recent sessions | `clarify_sessions` | `eq('user_id', userId), neq('id', currentSessionId)` | 50ms | None |
| 5. Reflections | `reflections` | `eq('user_id', userId)` | 50ms | None |

**Key Finding:** ALL 5 queries are independent - they can run in parallel with `Promise.all()`.

---

## Parallelization Strategy

### Proposed Optimization

**New Flow (Parallel):**

```
                    /--> Fetch user data
                   /---> Fetch active dreams
Promise.all() ----|----> Fetch patterns       --> ~50-80ms total
                   \---> Fetch recent sessions
                    \--> Fetch reflections
```

**Expected Improvement:**
- Current: ~250-500ms (sequential)
- Target: ~50-100ms (parallel)
- Improvement: **70-80% reduction** in context build time

### Implementation Pattern

```typescript
// Recommended approach
const [userResult, dreamsResult, patternsResult, sessionsResult, reflectionsResult] =
  await Promise.all([
    supabase.from('users').select('...').eq('id', userId).single(),
    supabase.from('dreams').select('...').eq('user_id', userId).eq('status', 'active'),
    supabase.from('clarify_patterns').select('...').eq('user_id', userId),
    supabase.from('clarify_sessions').select('...').eq('user_id', userId),
    supabase.from('reflections').select('...').eq('user_id', userId),
  ]);
```

### Error Handling Considerations

- Use `Promise.allSettled()` if graceful degradation is preferred over fail-fast
- Individual query failures should not break entire context building
- Log failures but continue with available data

---

## Redis Caching Architecture

### Existing Infrastructure

**Current Redis Usage:** Rate limiting only (server/lib/rate-limiter.ts)

```typescript
// Existing Redis client setup
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

**Assessment:** Upstash Redis is already configured and operational. We can reuse the same client for caching.

### Caching Strategy

#### Data Categories & TTLs

| Data Type | Cache Key Pattern | TTL | Invalidation Trigger |
|-----------|-------------------|-----|----------------------|
| User context | `ctx:user:{userId}` | 5 min | User update, subscription change |
| Active dreams | `ctx:dreams:{userId}` | 5 min | Dream CRUD operations |
| Patterns | `ctx:patterns:{userId}` | 10 min | Pattern consolidation job |
| Recent sessions | `ctx:sessions:{userId}` | 2 min | New session/message |
| Reflections summary | `ctx:reflections:{userId}` | 5 min | New reflection |

#### TTL Rationale

1. **User context (5 min):** User data changes infrequently (name, tier)
2. **Dreams (5 min):** Dreams are updated occasionally, 5 min staleness acceptable
3. **Patterns (10 min):** Patterns consolidated hourly via cron, longer TTL safe
4. **Sessions (2 min):** More dynamic, shorter TTL to show recent activity
5. **Reflections (5 min):** Created ~1-2 per day per user, 5 min is generous

### Cache Key Design

```typescript
// Recommended key structure
const cacheKeys = {
  userContext: (userId: string) => `ctx:user:${userId}`,
  dreams: (userId: string) => `ctx:dreams:${userId}`,
  patterns: (userId: string) => `ctx:patterns:${userId}`,
  sessions: (userId: string, currentSessionId: string) =>
    `ctx:sessions:${userId}:exclude:${currentSessionId}`,
  reflections: (userId: string) => `ctx:reflections:${userId}`,
};
```

### Cache Invalidation Strategies

#### Strategy 1: TTL-based Expiration (Recommended for MVP)
- Simple and reliable
- No additional code complexity
- Small staleness window (2-10 min) acceptable for context data

#### Strategy 2: Event-driven Invalidation (Future Enhancement)
- Invalidate on write operations (dream CRUD, pattern consolidation)
- More complex but fresher data
- Requires cache invalidation hooks in mutation endpoints

#### Strategy 3: Hybrid Approach
- Short TTL + optional manual invalidation for critical updates
- Best balance of freshness and simplicity

**Recommendation:** Start with TTL-based (Strategy 1), add event-driven invalidation in future iteration if needed.

---

## Caching Utility Design

### Proposed Interface

```typescript
// lib/cache/redis-cache.ts
interface CacheOptions {
  ttl: number; // seconds
  prefix?: string;
}

interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
  getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T>;
}
```

### Fallback Behavior

```typescript
// Graceful degradation when Redis unavailable
async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  try {
    const cached = await redis?.get(key);
    if (cached) {
      return cached as T;
    }
  } catch (err) {
    logger.warn({ err, key }, 'Cache read failed, falling back to fetcher');
  }

  const fresh = await fetcher();

  try {
    await redis?.set(key, fresh, { ex: ttl });
  } catch (err) {
    logger.warn({ err, key }, 'Cache write failed');
  }

  return fresh;
}
```

---

## Performance Monitoring Requirements

### Metrics to Track

| Metric | Purpose | Target |
|--------|---------|--------|
| `clarify.context_build_ms` | Total context build time | < 100ms P95 |
| `clarify.cache_hit_rate` | Cache effectiveness | > 80% after warmup |
| `clarify.query_parallel_ms` | Parallel query execution time | < 80ms P95 |
| `clarify.cache_read_ms` | Cache read latency | < 10ms P95 |
| `clarify.cache_write_ms` | Cache write latency | < 20ms P95 |

### Logging Integration

```typescript
// Recommended logging pattern
const contextLogger = logger.child({ service: 'clarify-context' });

// Before optimization
const start = Date.now();
const context = await buildClarifyContext(userId, sessionId);
const duration = Date.now() - start;

contextLogger.info({
  userId,
  sessionId,
  duration,
  cacheHit: wasCacheHit,
  sectionsIncluded: includedSections.length,
}, 'Context built');
```

### Dashboard Recommendations

1. **Vercel Analytics:** Built-in for Next.js, free tier available
2. **Custom Metrics:** Log to structured JSON, aggregate in Vercel logs
3. **Future:** Sentry Performance (when integrated in Iteration 1)

---

## Risk Assessment

### Low Risks

1. **Query parallelization:** Well-established pattern, all queries independent
2. **Redis availability:** Already handles graceful degradation in rate-limiter
3. **TTL misconfiguration:** Easy to adjust, no data loss risk

### Medium Risks

1. **Cache stampede:** Multiple requests rebuilding cache simultaneously
   - **Mitigation:** Implement cache-aside pattern with short stale-while-revalidate

2. **Memory pressure on Redis:** Upstash has limits on free tier
   - **Mitigation:** Monitor usage, keep TTLs reasonable, prefix keys for easy cleanup

3. **Data staleness:** Users may see slightly outdated context
   - **Mitigation:** Short TTLs (2-10 min), accept minor staleness for context data

### Potential Issues

1. **Supabase connection pooling:** Parallel queries may hit connection limits
   - **Mitigation:** Monitor, Supabase handles pooling internally

2. **Error propagation:** One failed query shouldn't break entire context
   - **Mitigation:** Use `Promise.allSettled()` or individual try/catch

---

## Testing Requirements

### Unit Tests

1. **Parallelization correctness:**
   - Verify all queries execute
   - Verify results properly assembled
   - Test partial failure scenarios

2. **Cache behavior:**
   - Cache hit returns cached data
   - Cache miss calls fetcher
   - TTL expiration works correctly
   - Redis failure falls back to fetcher

### Performance Tests

1. **Baseline measurement:**
   - Record current context build times (target: capture 250-500ms baseline)

2. **Post-optimization measurement:**
   - Verify < 100ms P95 target achieved

3. **Load testing:**
   - Simulate concurrent users
   - Verify cache hit rates under load

### Integration Tests

1. **End-to-end Clarify flow:**
   - Verify context building doesn't break Clarify conversations
   - Verify cached context produces valid AI responses

---

## Implementation Recommendations

### Phase 1: Query Parallelization (Priority: HIGH)

**Estimated effort:** 2-3 hours

1. Refactor `buildClarifyContext()` to use `Promise.all()`
2. Add timing logs to measure improvement
3. Add unit tests for parallel query execution
4. Measure before/after performance

**Files to modify:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts`

### Phase 2: Caching Utility (Priority: HIGH)

**Estimated effort:** 2-3 hours

1. Create `lib/cache/redis-cache.ts` with getOrSet pattern
2. Reuse existing Redis client from rate-limiter
3. Add graceful fallback for Redis failures
4. Add cache hit/miss logging

**Files to create/modify:**
- Create: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/cache/redis-cache.ts`
- Modify: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts`

### Phase 3: Cache Integration (Priority: HIGH)

**Estimated effort:** 2-3 hours

1. Wrap each query with caching layer
2. Configure appropriate TTLs
3. Add cache metrics logging
4. Test full flow

### Phase 4: Monitoring (Priority: MEDIUM)

**Estimated effort:** 1-2 hours

1. Add performance timing to logger
2. Create structured log format for metrics
3. Document how to query metrics from Vercel logs

---

## Architecture Diagram

```
                                  Clarify Message Request
                                           |
                                           v
                               +------------------------+
                               | buildClarifyContext()  |
                               +------------------------+
                                           |
                            +--------------+--------------+
                            |              |              |
                            v              v              v
                   +---------------+  +---------------+  +---------------+
                   | Redis Cache   |  | Redis Cache   |  | Redis Cache   |
                   | user:ctx      |  | dreams:ctx    |  | patterns:ctx  |
                   +-------+-------+  +-------+-------+  +-------+-------+
                           |                  |                  |
                      HIT? |             HIT? |             HIT? |
                           |                  |                  |
                   +-------v-------+  +-------v-------+  +-------v-------+
                   | Supabase      |  | Supabase      |  | Supabase      |
                   | users table   |  | dreams table  |  | patterns tbl  |
                   +---------------+  +---------------+  +---------------+
                            \              |              /
                             \             |             /
                              v            v            v
                               +------------------------+
                               | Promise.all() Results  |
                               | Assemble Context       |
                               +------------------------+
                                           |
                                           v
                               +------------------------+
                               | Token Budget Assembly  |
                               | Priority Sorting       |
                               +------------------------+
                                           |
                                           v
                               +------------------------+
                               | System Prompt + Context|
                               | -> Anthropic API       |
                               +------------------------+
```

---

## Dependency Graph

```
Phase 1: Parallelization (No dependencies)
|
v
Phase 2: Caching Utility (No dependencies)
|
+-> Uses existing Upstash Redis client
|
v
Phase 3: Cache Integration
|
+-> Depends on: Phase 1 (parallel queries), Phase 2 (cache utility)
|
v
Phase 4: Monitoring
|
+-> Depends on: Phase 3 (cache integration)
+-> Uses existing Pino logger infrastructure
```

---

## Success Criteria

| Criterion | Current | Target | Measurement Method |
|-----------|---------|--------|-------------------|
| Context build time P95 | ~400ms | < 100ms | Structured logging |
| Cache hit rate | N/A | > 80% | Log aggregation |
| Redis availability handling | N/A | 100% graceful | Integration tests |
| Zero performance regressions | Baseline | No degradation | Before/after comparison |

---

## Notes & Observations

1. **Upstash REST API:** Already configured, uses HTTP-based REST API which is well-suited for serverless (Vercel)

2. **Supabase client is singleton:** The current `supabase` import is a singleton, which means connection pooling is handled automatically

3. **Context token budget:** The `CLARIFY_CONTEXT_LIMITS.maxContextTokens = 8000` is generous; caching won't affect this logic

4. **Pattern consolidation job:** Exists at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/cron/consolidate-patterns/route.ts` - cache invalidation could hook into this

5. **No `any` types in context-builder:** One `as any` on line 196 for pattern type, should be typed properly as part of TypeScript improvements (Iteration 4)

6. **System prompt is already cached:** `cachedSystemPrompt` variable in clarify.ts and stream/route.ts - good pattern to follow

---

## Recommendations for Master Plan

1. **Prioritize parallelization over caching:** Parallelization is simpler and provides immediate 70-80% improvement with minimal risk

2. **Implement caching as enhancement:** After parallelization proves stable, add caching for further improvement

3. **Use consistent logging patterns:** Follow existing Pino logger conventions for observability

4. **Consider Sentry Performance integration:** When Sentry is added (Iteration 1), use it for performance monitoring instead of custom metrics

5. **Document Redis cache keys:** Add documentation for cache key patterns to prevent collisions and aid debugging

---

*Exploration completed: 2025-12-10*
*This report informs master planning decisions for Performance Optimization (Iteration 2)*
