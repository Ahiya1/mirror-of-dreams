# Technology Stack

## Core Framework

**Decision:** Next.js 14 (App Router) - Already in use

**Rationale:**
- Application already uses Next.js 14 with App Router
- No framework changes required for this iteration
- Server-side caching integrates cleanly with existing API routes

## Cache Provider

**Decision:** Upstash Redis via `@upstash/redis` (v1.35.0)

**Rationale:**
- Already installed and configured for rate limiting in `server/lib/rate-limiter.ts`
- Serverless-compatible (REST API over HTTPS)
- No connection pooling concerns for Vercel Edge/Serverless
- Automatic JSON serialization/deserialization
- Existing environment variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Alternatives Considered:**
- In-memory cache (Map): Not suitable for serverless (ephemeral instances)
- Vercel KV: Would add another dependency; Upstash already configured
- node-cache: Same serverless issue as Map

## Parallelization Strategy

**Decision:** Native `Promise.all()` for query parallelization

**Rationale:**
- Zero dependencies - native JavaScript
- All 5 queries are completely independent (no data dependencies)
- Fail-fast behavior matches current error handling (individual query failures already handled gracefully)
- Simple, readable code pattern already established in codebase

**Alternatives Considered:**
- `Promise.allSettled()`: More complex, partial failures need handling; current code already handles null data
- p-limit: Unnecessary - only 5 concurrent queries, well within connection limits
- async.parallel: External dependency for no benefit

## Database Client

**Decision:** Supabase JavaScript Client (already in use)

**Location:** `@/server/lib/supabase`

**Notes:**
- No changes to database client
- Queries remain identical, only execution order changes
- Supabase connection pooling handles concurrent requests

## Logging

**Decision:** Pino structured logging via existing `dbLogger`

**Location:** `@/server/lib/logger`

**Usage:**
```typescript
import { dbLogger } from '@/server/lib/logger';

dbLogger.info({
  operation: 'clarify.buildContext',
  userId,
  sessionId,
  durationMs: 45,
  cacheHits: 3,
  cacheMisses: 2,
}, 'Context build complete');
```

**Rationale:**
- Consistent with existing logging patterns
- Structured JSON in production, pretty-printed in development
- Child logger already exists for database operations

## Testing Framework

**Decision:** Vitest (already configured)

**Version:** 2.1.0

**Rationale:**
- Already configured in `vitest.config.ts`
- Excellent mocking capabilities (`vi.mock`)
- Compatible with existing test patterns in `rate-limiter.test.ts`
- Fast, watch mode for development

## Environment Variables

All environment variables are already configured:

| Variable | Purpose | Status |
|----------|---------|--------|
| `UPSTASH_REDIS_REST_URL` | Redis REST API endpoint | Configured |
| `UPSTASH_REDIS_REST_TOKEN` | Redis authentication token | Configured |
| `NODE_ENV` | Environment detection for logging | Configured |
| `LOG_LEVEL` | Logging verbosity | Configured (optional) |

## Dependencies Overview

All dependencies are already installed:

| Package | Version | Purpose |
|---------|---------|---------|
| `@upstash/redis` | 1.35.0 | Redis client for caching |
| `pino` | * | Structured logging |
| `vitest` | 2.1.0 | Testing framework |

No new dependencies required for this iteration.

## Cache Architecture

### TTL Configuration

| Data Type | TTL (seconds) | Rationale |
|-----------|---------------|-----------|
| User Context | 300 (5 min) | Profile data changes rarely |
| Dreams | 120 (2 min) | Dreams can be created/updated during sessions |
| Patterns | 600 (10 min) | Patterns consolidated infrequently by background job |
| Sessions | 60 (1 min) | Session metadata updates with each message |
| Reflections | 300 (5 min) | Reflections are immutable after creation |

### Cache Key Schema

```
ctx:user:{userId}        - User context data
ctx:dreams:{userId}      - Active dreams list
ctx:patterns:{userId}    - User patterns (strength >= 3)
ctx:sessions:{userId}    - Recent sessions (excluding current)
ctx:reflections:{userId} - Recent reflections
```

### Circuit Breaker Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Failure Threshold | 3 | Open circuit faster than rate limiter (non-critical) |
| Recovery Timeout | 15s | Faster recovery for cache vs rate limiter |
| Behavior | Fail-OPEN | Cache failures never block requests |

**Contrast with Rate Limiter:**
- Rate limiter: 5 failures, 30s timeout, Fail-CLOSED (security)
- Cache: 3 failures, 15s timeout, Fail-OPEN (performance)

## Performance Targets

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Context build (cache miss) | 250-500ms | 50-100ms | Via parallelization |
| Context build (cache hit) | N/A | 5-20ms | Via caching |
| Cache hit rate | N/A | >70% | After warm-up |
| Circuit breaker recovery | N/A | 15s | Fast recovery |

## Security Considerations

1. **No sensitive data in cache keys**: Only userId (UUID) in key, no PII
2. **TTL prevents stale data**: Maximum 10 minutes for any cached data
3. **Fail-open is safe**: Cache failures only impact performance, not security
4. **Redis authentication**: Token-based auth via environment variables
5. **No cross-user data leakage**: Cache keys scoped to userId

## File Structure Impact

```
server/
  lib/
    cache.ts           # NEW: Redis caching utility
    __tests__/
      cache.test.ts    # NEW: Cache utility tests
    rate-limiter.ts    # Reference implementation (no changes)
    logger.ts          # No changes

lib/
  clarify/
    context-builder.ts # MODIFIED: Parallelization + caching
    __tests__/
      context-builder.test.ts  # NEW: Integration tests

server/trpc/routers/
    dreams.ts          # MODIFIED: Add cache invalidation
    reflection.ts      # MODIFIED: Add cache invalidation
    clarify.ts         # MODIFIED: Add cache invalidation
    users.ts           # MODIFIED: Add cache invalidation
```

---

*Technology decisions finalized: 2025-12-10*
*Iteration: 36 | Plan: plan-21*
