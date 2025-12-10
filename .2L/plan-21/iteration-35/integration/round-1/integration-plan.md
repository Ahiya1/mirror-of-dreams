# Integration Plan - Round 1

**Created:** 2025-12-10T12:00:00Z
**Iteration:** plan-21/iteration-35
**Total builders to integrate:** 3

---

## Executive Summary

All three builders completed their tasks successfully with minimal overlap. The primary integration challenge is merging changes to `.env.example` from Builder-1 and Builder-3. All other files are distinct with no conflicts. The builders created well-tested, production-ready code that follows established patterns.

Key insights:
- All builders completed with status COMPLETE - no splits required
- Only shared file is `.env.example` (documentation only - low risk merge)
- Total of 125 new tests added across all builders (61 + 52 + 12)
- No code conflicts - builders worked on completely separate modules

---

## Builders to Integrate

### Primary Builders
- **Builder-1:** Config Validation & JWT Expiry - Status: COMPLETE
- **Builder-2:** Rate Limiter Fail-Closed with Circuit Breaker - Status: COMPLETE
- **Builder-3:** Sentry Integration - Status: COMPLETE

### Sub-Builders (if applicable)
- None - all builders completed without splitting

**Total outputs to integrate:** 3

---

## Integration Zones

### Zone 1: Environment Configuration Documentation

**Builders involved:** Builder-1, Builder-3

**Conflict type:** File Modifications

**Risk level:** LOW

**Description:**
Both Builder-1 and Builder-3 modified `.env.example` to add documentation for their respective features. Builder-1 added validation requirements documentation for all existing environment variables. Builder-3 added a new Sentry variables section. These are additive changes to different sections of the file.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.env.example`
  - Builder-1: Added validation requirement comments (format rules, length requirements)
  - Builder-3: Added Sentry section (SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN)

**Integration strategy:**
1. Start with Builder-1's version (more extensive documentation updates)
2. Merge Builder-3's Sentry section at the end of the file
3. Ensure consistent formatting across sections
4. Verify no duplicate variable definitions

**Expected outcome:**
A comprehensive `.env.example` with:
- Validation requirements documented for existing variables
- New Sentry section with all required variables
- Consistent formatting throughout

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 2: Configuration Validation System

**Builders involved:** Builder-1 (standalone)

**Conflict type:** Independent Feature

**Risk level:** NONE

**Description:**
Builder-1 created a new centralized configuration validation system. All files created are new (no modifications to existing files except JWT error handling improvements). This zone can be integrated directly.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/config.ts` - NEW FILE
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/config.test.ts` - NEW FILE
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/__tests__/jwt-expiry.test.ts` - NEW FILE
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts` - MODIFIED (JWT error handling)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts` - MODIFIED (JWT error handling)

**Integration strategy:**
1. Copy all new files directly
2. Apply modifications to context.ts and clarify/stream/route.ts
3. Run config validation tests to verify

**Expected outcome:**
- Centralized configuration with Zod validation
- Enhanced JWT error handling with specific error types
- 61 passing tests

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 3: Rate Limiter Circuit Breaker

**Builders involved:** Builder-2 (standalone)

**Conflict type:** Independent Feature

**Risk level:** NONE

**Description:**
Builder-2 transformed the rate limiter to fail-closed behavior with circuit breaker pattern. All changes are isolated to rate-limiter.ts and middleware.ts with no overlap with other builders.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts` - MODIFIED
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` - MODIFIED (error messages)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/rate-limiter.test.ts` - MODIFIED (complete rewrite)

**Integration strategy:**
1. Apply all modifications directly (no conflicts)
2. Run rate limiter tests to verify circuit breaker functionality
3. Verify middleware error messages are correct

**Expected outcome:**
- Fail-closed rate limiting behavior
- Circuit breaker with 5-failure threshold and 30-second recovery
- 52 passing tests with 91.85% coverage

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 4: Sentry Error Monitoring

**Builders involved:** Builder-3 (standalone)

**Conflict type:** Independent Feature

**Risk level:** LOW

**Description:**
Builder-3 integrated Sentry error monitoring with 4 new config files, 6 error boundary updates, and tRPC integration. No conflicts with other builders except the shared `.env.example` addressed in Zone 1.

**Files affected:**

New Files:
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.client.config.ts` - NEW FILE
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.server.config.ts` - NEW FILE
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.edge.config.ts` - NEW FILE
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/instrumentation.ts` - NEW FILE
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/__tests__/sentry-integration.test.ts` - NEW FILE

Modified Files:
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/next.config.js` - MODIFIED (withSentryConfig wrapper)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/trpc.ts` - MODIFIED (errorFormatter)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx` - MODIFIED (Sentry capture)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/global-error.tsx` - MODIFIED (Sentry capture)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/error.tsx` - MODIFIED (Sentry capture)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/error.tsx` - MODIFIED (Sentry capture)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/error.tsx` - MODIFIED (Sentry capture)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/error.tsx` - MODIFIED (Sentry capture)

**Integration strategy:**
1. Verify @sentry/nextjs package is in package.json
2. Copy all new Sentry config files
3. Apply next.config.js modification
4. Apply trpc.ts errorFormatter modification
5. Apply all 6 error boundary modifications
6. Run Sentry integration tests

**Expected outcome:**
- Sentry capturing errors across client, server, and edge runtimes
- All 6 error boundaries reporting to Sentry with appropriate tags
- Auth errors filtered out (not reported)
- 12 passing tests

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

## Independent Features (Direct Merge)

All zones are effectively independent and can be merged directly:

- **Zone 2 (Builder-1):** Config validation + JWT handling - No conflicts
- **Zone 3 (Builder-2):** Rate limiter circuit breaker - No conflicts
- **Zone 4 (Builder-3):** Sentry integration - No conflicts (except Zone 1 overlap)

**Assigned to:** Integrator-1 (single integrator can handle all zones)

---

## Parallel Execution Groups

### Group 1 (All Parallel - Can be done simultaneously)
- **Integrator-1:** All zones (1-4)

Since there are no dependencies between zones and only one shared file (`.env.example`), a single integrator can efficiently handle all integration work sequentially.

**Rationale for single integrator:**
- Low overall complexity
- Only one file conflict (Zone 1)
- All builders completed with COMPLETE status
- No circular dependencies
- Total integration time estimated: 15-20 minutes

---

## Integration Order

**Recommended sequence:**

1. **Zone 2: Config Validation (Builder-1)**
   - Copy new config files
   - Apply JWT error handling changes
   - Run config tests

2. **Zone 3: Rate Limiter Circuit Breaker (Builder-2)**
   - Apply rate-limiter.ts changes
   - Apply middleware.ts changes
   - Run rate limiter tests

3. **Zone 4: Sentry Integration (Builder-3)**
   - Copy Sentry config files
   - Apply next.config.js changes
   - Apply trpc.ts changes
   - Apply all error boundary changes
   - Run Sentry tests

4. **Zone 1: Environment Configuration (Merge)**
   - Merge .env.example from Builder-1 and Builder-3
   - Verify consistent formatting

5. **Final Verification**
   - Run full test suite
   - TypeScript compilation check
   - Lint check
   - Build verification

---

## Shared Resources Strategy

### Shared Files
**Issue:** `.env.example` modified by both Builder-1 and Builder-3

**Resolution:**
- Builder-1 changes: Validation requirement comments throughout existing vars
- Builder-3 changes: New Sentry section at end of file
- Merge strategy: Keep both changes (additive, different sections)

**Responsible:** Integrator-1 in Zone 1

### Package Dependencies
**Issue:** Builder-3 added @sentry/nextjs dependency

**Resolution:**
- Verify package.json includes @sentry/nextjs
- Run npm install if needed

**Responsible:** Integrator-1 in Zone 4

### Configuration Files
**Issue:** next.config.js modified by Builder-3

**Resolution:**
- Apply withSentryConfig wrapper
- No conflicts (only Builder-3 touched this file)

**Responsible:** Integrator-1 in Zone 4

---

## Expected Challenges

### Challenge 1: Package Installation Verification
**Impact:** Build could fail if @sentry/nextjs not properly installed
**Mitigation:** Verify package.json has dependency, run npm install before tests
**Responsible:** Integrator-1

### Challenge 2: Test Suite Completion Time
**Impact:** 125 new tests may increase CI time
**Mitigation:** Tests are fast (unit tests), should add minimal time
**Responsible:** Integrator-1

### Challenge 3: Environment Variable Requirements in CI
**Impact:** Config validation may fail in CI without proper env vars
**Mitigation:** CI should have required env vars or tests should mock them
**Responsible:** Integrator-1

---

## Success Criteria for This Integration Round

- [ ] All zones successfully resolved
- [ ] No duplicate code remaining
- [ ] All imports resolve correctly
- [ ] TypeScript compiles with no errors
- [ ] Consistent patterns across integrated code
- [ ] No conflicts in shared files
- [ ] All builder functionality preserved
- [ ] All 125 new tests passing
- [ ] npm run typecheck passes
- [ ] npm run lint passes
- [ ] npm run build succeeds

---

## Notes for Integrators

**Important context:**
- All builders completed COMPLETE status - no partial work
- Production mode requires all test files to be included
- CI/CD workflow should already be present in repo
- Security patterns (fail-closed, auth error filtering) must be maintained

**Watch out for:**
- Ensure @sentry/nextjs is installed before running tests
- JWT error handling tests mock jsonwebtoken - ensure mocks work correctly
- Rate limiter tests use fake timers - ensure vi.useFakeTimers() works
- Sentry tests mock @sentry/nextjs - verify mock setup

**Patterns to maintain:**
- Reference `patterns.md` for all conventions
- Ensure error handling is consistent (warn for expected, error for unexpected)
- Keep naming conventions aligned (errorBoundary tags in kebab-case)
- Circuit breaker state management uses module-level singleton

---

## Files Summary

### New Files to Create (Total: 10)
| File | Builder | Zone |
|------|---------|------|
| server/lib/config.ts | Builder-1 | Zone 2 |
| server/lib/__tests__/config.test.ts | Builder-1 | Zone 2 |
| server/trpc/__tests__/jwt-expiry.test.ts | Builder-1 | Zone 2 |
| sentry.client.config.ts | Builder-3 | Zone 4 |
| sentry.server.config.ts | Builder-3 | Zone 4 |
| sentry.edge.config.ts | Builder-3 | Zone 4 |
| instrumentation.ts | Builder-3 | Zone 4 |
| server/trpc/__tests__/sentry-integration.test.ts | Builder-3 | Zone 4 |

### Files to Modify (Total: 14)
| File | Builder(s) | Zone |
|------|------------|------|
| server/trpc/context.ts | Builder-1 | Zone 2 |
| app/api/clarify/stream/route.ts | Builder-1 | Zone 2 |
| server/lib/rate-limiter.ts | Builder-2 | Zone 3 |
| server/trpc/middleware.ts | Builder-2 | Zone 3 |
| server/lib/__tests__/rate-limiter.test.ts | Builder-2 | Zone 3 |
| next.config.js | Builder-3 | Zone 4 |
| server/trpc/trpc.ts | Builder-3 | Zone 4 |
| app/error.tsx | Builder-3 | Zone 4 |
| app/global-error.tsx | Builder-3 | Zone 4 |
| app/dashboard/error.tsx | Builder-3 | Zone 4 |
| app/dreams/error.tsx | Builder-3 | Zone 4 |
| app/clarify/error.tsx | Builder-3 | Zone 4 |
| app/reflection/error.tsx | Builder-3 | Zone 4 |
| .env.example | Builder-1, Builder-3 | Zone 1 |

---

## Test Summary

| Builder | Test File | Test Count |
|---------|-----------|------------|
| Builder-1 | config.test.ts | 38 |
| Builder-1 | jwt-expiry.test.ts | 23 |
| Builder-2 | rate-limiter.test.ts | 52 |
| Builder-3 | sentry-integration.test.ts | 12 |
| **Total** | | **125** |

---

## Next Steps

1. Spawn single integrator (Integrator-1)
2. Integrator executes zones 2, 3, 4 sequentially
3. Merge .env.example (Zone 1)
4. Run full verification suite
5. Create integrator report
6. Proceed to ivalidator

---

**Integration Planner:** 2l-iplanner
**Plan created:** 2025-12-10T12:00:00Z
**Round:** 1
