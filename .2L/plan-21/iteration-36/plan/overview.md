# 2L Iteration Plan - Performance Optimization (Query Parallelization & Redis Caching)

## Project Vision

Iteration 36 focuses on significant performance optimization for the Clarify AI conversation feature. The `buildClarifyContext()` function currently executes 5 sequential database queries per AI message, creating unnecessary latency of 250-500ms. This iteration parallelizes these independent queries using `Promise.all()` and introduces a Redis caching layer to further reduce database load and response times.

The result will be a 70-80% reduction in context build latency, from ~250-500ms to ~50-100ms for cache misses, and near-zero latency for cache hits.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] All 5 database queries in `buildClarifyContext()` execute in parallel via `Promise.all()`
- [ ] Redis caching utility created with fail-open circuit breaker pattern
- [ ] Context builder uses cache-aside pattern for all 5 data types (user, dreams, patterns, sessions, reflections)
- [ ] Performance logging captures query duration and cache hit/miss metrics
- [ ] Graceful fallback to database when Redis is unavailable or fails
- [ ] Cache invalidation hooks added to CRUD operations (dreams, reflections, sessions)
- [ ] Unit tests achieve 85%+ coverage for cache utility
- [ ] Integration tests verify context builder with and without caching
- [ ] No regression in existing functionality - all current tests pass

## MVP Scope

**In Scope:**
- Query parallelization in `buildClarifyContext()` using `Promise.all()`
- Redis caching utility (`server/lib/cache.ts`) with circuit breaker
- Cache-aside pattern integration in context builder
- TTL-based cache expiration (5 min user, 2 min dreams, 10 min patterns, 1 min sessions, 5 min reflections)
- Cache invalidation on CRUD mutations
- Performance timing logs with structured logging
- Unit tests for cache utility
- Integration tests for context builder

**Out of Scope (Post-MVP):**
- Cache warming on user login
- Cache hit/miss analytics dashboard
- Admin cache invalidation endpoint
- Distributed cache invalidation (pub/sub)
- Second-level caching for other features

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current (this document)
3. **Building** - Estimated 4-6 hours (2 parallel builders)
4. **Integration** - Estimated 30 minutes
5. **Validation** - Estimated 30 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 4-6 hours (parallel builders)
  - Builder-1 (Cache Utility): 2-3 hours
  - Builder-2 (Context Builder): 2-3 hours
- Integration: 30 minutes
- Validation: 30 minutes
- Total: ~5-7 hours

## Risk Assessment

### High Risks

1. **Stale Data in Cache**: Users may see outdated information after edits
   - Mitigation: Short TTLs (1-5 minutes) combined with aggressive invalidation on mutations
   - Mitigation: TTLs aligned with typical session duration (5-15 minutes)

### Medium Risks

1. **Cache Stampede on High Traffic**: Multiple requests hit DB when cache expires
   - Mitigation: Acceptable for current user scale; monitor and add jittered expiration if needed

2. **Redis Connection Issues**: Upstash outage could impact performance
   - Mitigation: Fail-open circuit breaker - cache failures never block requests
   - Mitigation: 15-second recovery timeout with half-open testing

3. **Invalidation Coverage Gaps**: Missed invalidation in some code paths
   - Mitigation: Centralized `cacheKeys` object for consistency
   - Mitigation: Code review and integration tests

### Low Risks

1. **Serialization Edge Cases**: Date objects or complex types in cached data
   - Mitigation: Upstash Redis handles JSON automatically; test with real data shapes

## Integration Strategy

Builder outputs will be integrated as follows:

1. **Builder-1** creates `server/lib/cache.ts` as a standalone module
2. **Builder-2** depends on Builder-1's cache utility
3. Integration sequence:
   - Verify cache utility tests pass
   - Integrate cache calls into context builder
   - Add invalidation hooks to routers
   - Run full test suite
   - Manual verification with real Redis instance

**Potential Conflict Areas:**
- None expected - builders work on separate files
- Shared dependency: `@/server/lib/logger` (read-only)

## Deployment Plan

1. **Pre-deployment Checklist:**
   - All tests pass (`npm run test`)
   - Type check passes (`npm run typecheck`)
   - Lint passes (`npm run lint`)
   - Build succeeds (`npm run build`)

2. **Environment Variables Required:**
   - `UPSTASH_REDIS_REST_URL` (already configured)
   - `UPSTASH_REDIS_REST_TOKEN` (already configured)

3. **Deployment Steps:**
   - Merge PR to main branch
   - Vercel auto-deploys from main
   - Monitor logs for cache operations
   - Verify performance improvement in production

4. **Rollback Strategy:**
   - Cache utility is fail-open - can be disabled by removing Redis env vars
   - Feature flag not required due to graceful degradation

---

*Plan created: 2025-12-10*
*Iteration: 36 | Plan: plan-21*
*Focus: Performance Optimization - Query Parallelization & Redis Caching*
