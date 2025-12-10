# Integration Plan - Round 1

**Created:** 2025-12-10T10:30:00Z
**Iteration:** plan-21/iteration-36
**Total builders to integrate:** 2

---

## Executive Summary

This integration round combines two complementary builder outputs that implement Redis caching for the Clarify AI feature. Builder-1 created a standalone cache utility with fail-open circuit breaker, while Builder-2 integrated caching into the context builder and added cache invalidation to 4 routers. The builders worked on separate files with no conflicts - Builder-2 correctly imports from Builder-1's cache module as designed.

Key insights:
- Both builders completed successfully with 99 combined new tests (69 + 30)
- No file conflicts exist - clean separation of concerns
- Integration is straightforward - merge both builder outputs directly
- All 758 tests in the codebase are passing

---

## Builders to Integrate

### Primary Builders
- **Builder-1:** Cache Utility (server/lib/cache.ts) - Status: COMPLETE
- **Builder-2:** Context Builder Optimization - Status: COMPLETE

### Sub-Builders (if applicable)
- None - both builders completed without splitting

**Total outputs to integrate:** 2

---

## Integration Zones

### Zone 1: Independent Feature Merge

**Builders involved:** Builder-1, Builder-2

**Conflict type:** None - Independent features with designed dependency

**Risk level:** LOW

**Description:**
Both builders worked on separate files as designed in the task breakdown. Builder-1 created the cache utility (`server/lib/cache.ts`) as a standalone module. Builder-2 modified existing files to integrate caching (`lib/clarify/context-builder.ts`) and added cache invalidation to 4 routers. The dependency is intentional and correctly implemented - Builder-2 imports from Builder-1's exports.

**Files affected:**
- `server/lib/cache.ts` - NEW (Builder-1)
- `server/lib/__tests__/cache.test.ts` - NEW (Builder-1)
- `lib/clarify/context-builder.ts` - MODIFIED (Builder-2)
- `lib/clarify/__tests__/context-builder.test.ts` - NEW (Builder-2)
- `server/trpc/routers/dreams.ts` - MODIFIED (Builder-2)
- `server/trpc/routers/reflection.ts` - MODIFIED (Builder-2)
- `server/trpc/routers/users.ts` - MODIFIED (Builder-2)
- `server/trpc/routers/clarify.ts` - MODIFIED (Builder-2)

**Integration strategy:**
1. Merge Builder-1 files first (cache utility is the dependency)
2. Merge Builder-2 files second (depends on cache utility)
3. Run full test suite to verify integration
4. Run typecheck to ensure imports resolve correctly

**Expected outcome:**
All files merged cleanly with working cache integration in context builder and proper invalidation in routers.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

## Independent Features (Direct Merge)

Both builder outputs can be merged directly as they have no conflicts:

- **Builder-1:** Cache Utility
  - Files: `server/lib/cache.ts`, `server/lib/__tests__/cache.test.ts`
  - These are new files with no existing counterparts

- **Builder-2:** Context Builder Optimization
  - Files: `lib/clarify/context-builder.ts` (modified), `lib/clarify/__tests__/context-builder.test.ts` (new)
  - Router modifications: `dreams.ts`, `reflection.ts`, `users.ts`, `clarify.ts`
  - Modifications are additive (imports and invalidation calls)

**Assigned to:** Integrator-1 (single integrator sufficient)

---

## Parallel Execution Groups

### Group 1 (Single Integrator - Sequential Merge)
- **Integrator-1:** Zone 1 - Direct merge of all builder outputs

**Rationale:** With no conflicts and low complexity, a single integrator can handle the entire integration efficiently. The merge order (Builder-1 first, then Builder-2) ensures the dependency is satisfied.

---

## Integration Order

**Recommended sequence:**

1. **Merge Builder-1 outputs first (cache utility)**
   - `server/lib/cache.ts` - new file
   - `server/lib/__tests__/cache.test.ts` - new test file
   - Verify: `npm run test -- server/lib/__tests__/cache.test.ts` (69 tests)

2. **Merge Builder-2 outputs second (context builder + routers)**
   - `lib/clarify/context-builder.ts` - modified
   - `lib/clarify/__tests__/context-builder.test.ts` - new test file
   - `server/trpc/routers/dreams.ts` - modified (added cache invalidation)
   - `server/trpc/routers/reflection.ts` - modified (added cache invalidation)
   - `server/trpc/routers/users.ts` - modified (added cache invalidation)
   - `server/trpc/routers/clarify.ts` - modified (added cache invalidation)
   - Verify: `npm run test -- lib/clarify/__tests__/context-builder.test.ts` (30 tests)

3. **Full verification**
   - Run: `npm run typecheck`
   - Run: `npm run test -- --run`
   - Run: `npm run lint`
   - Run: `npm run build`

---

## Shared Resources Strategy

### Shared Dependencies (Read-Only)
**Issue:** None - both builders correctly use existing shared dependencies

**Shared imports used by both:**
- `@/server/lib/logger` - used by Builder-1 (cache logging) and Builder-2 (dbLogger for performance logging)

**Resolution:** No action needed - both builders use the logger correctly for their respective purposes.

### New Shared Module
**Created by:** Builder-1

**Module:** `@/server/lib/cache`

**Exports used by Builder-2:**
- `cacheGet`, `cacheSet`, `cacheDelete`, `cacheKeys`, `CACHE_TTL`

**Resolution:** Merge Builder-1 first to make these exports available for Builder-2's imports.

---

## Expected Challenges

### Challenge 1: Import Resolution
**Impact:** If Builder-1 files are not merged first, Builder-2's imports will fail
**Mitigation:** Strict merge order - Builder-1 before Builder-2
**Responsible:** Integrator-1

### Challenge 2: Test Isolation
**Impact:** Context builder tests mock the cache module - ensure mocks are correctly configured
**Mitigation:** Builder-2 already verified tests pass with mocks; integration should be seamless
**Responsible:** Integrator-1

---

## Success Criteria for This Integration Round

- [ ] All new files from Builder-1 merged to codebase
- [ ] All modified files from Builder-2 merged to codebase
- [ ] TypeScript compiles with no errors (`npm run typecheck`)
- [ ] All 758+ tests pass (`npm run test -- --run`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Cache imports resolve correctly in context-builder.ts
- [ ] Cache invalidation calls present in all 4 routers

---

## Notes for Integrators

**Important context:**
- Both builders report all tests passing (758 total)
- Builder-2 explicitly depends on Builder-1's exports - this is by design
- The cache utility uses fail-OPEN pattern (different from rate-limiter's fail-CLOSED)
- Router invalidation calls are additive - they don't modify existing logic

**Watch out for:**
- Ensure merge order is respected (Builder-1 first)
- Verify all 8 files are included in integration
- Check that no files were accidentally omitted

**Patterns to maintain:**
- Reference `patterns.md` for all conventions
- Cache-aside pattern in context builder
- Fail-open error handling in cache operations
- Fire-and-forget cache population (cacheSet not awaited)

---

## Files Summary

### New Files (3)
| File | Builder | Purpose |
|------|---------|---------|
| `server/lib/cache.ts` | Builder-1 | Redis caching utility |
| `server/lib/__tests__/cache.test.ts` | Builder-1 | Cache utility tests (69 tests) |
| `lib/clarify/__tests__/context-builder.test.ts` | Builder-2 | Context builder tests (30 tests) |

### Modified Files (5)
| File | Builder | Changes |
|------|---------|---------|
| `lib/clarify/context-builder.ts` | Builder-2 | Parallelization + caching + logging |
| `server/trpc/routers/dreams.ts` | Builder-2 | Cache invalidation on CRUD |
| `server/trpc/routers/reflection.ts` | Builder-2 | Cache invalidation on create |
| `server/trpc/routers/users.ts` | Builder-2 | Cache invalidation on updateProfile |
| `server/trpc/routers/clarify.ts` | Builder-2 | Cache invalidation on createSession |

---

## Next Steps

1. Spawn single integrator (Integrator-1)
2. Integrator merges all builder outputs in order
3. Integrator runs full verification suite
4. Integrator creates completion report
5. Proceed to ivalidator

---

**Integration Planner:** 2l-iplanner
**Plan created:** 2025-12-10T10:30:00Z
**Round:** 1
