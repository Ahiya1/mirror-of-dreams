# Master Explorer 2 Report: Dependencies & Risk Assessment

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
Transform Mirror of Dreams from "it works" to "it's excellent" by achieving 100% test pass rate, fixing 6 failing tests, consolidating TIER_LIMITS to a single source of truth, and addressing critical security concerns including exposed secrets.

---

## Executive Summary

The codebase has 6 test failures (5 in PayPal tests, 1 in rate-limiter test) caused by module-level caching and mock expectation mismatches. TIER_LIMITS is defined in 3 different files with conflicting values, creating a maintenance and correctness risk. Security vulnerabilities exist in timing-unsafe secret comparisons and weak password requirements (6 chars). The work can be completed in a single iteration with low-to-medium risk if changes are made in the correct sequence.

---

## Test Failure Root Cause Analysis

### PayPal Tests (5 failures)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/paypal.test.ts`

**Root Cause:** Module-level `cachedToken` variable (line 46 in paypal.ts) persists between tests, causing token responses to be returned from cache instead of triggering new fetch calls.

| Test | Line | Expected Behavior | Actual Behavior | Root Cause |
|------|------|------------------|-----------------|------------|
| "should use cached token if still valid" | 65-82 | fetch called once then uses cache | fetch called 0 times | Cache already populated from previous test |
| "should throw error on failed token request" | 84-93 | throws PayPal token error | returns cached 'test-token-123' | Cache from previous test still valid |
| "should create subscription and return approval URL" | 97-127 | returns approval URL | TypeError on `response.links.find` | Only 1 mock call set up, but paypalFetch calls getPayPalAccessToken internally using cached token, so subscription mock never reached |
| "should fetch subscription details" | 153-191 | returns subscription object | returns token response | Mock sequence off - token mock consumed, subscription mock treated as 2nd token call |
| "should verify valid webhook signature" | 195-228 | returns true | returns false | Same mock sequencing issue |

**Fix Strategy:**
1. **Option A (Recommended):** Export a `_resetTokenCache()` function from paypal.ts for testing
2. **Option B:** Use `vi.resetModules()` in beforeEach (heavier, resets all module state)
3. **Option C:** Dependency injection for token cache (more invasive refactor)

**Code Analysis:**
```typescript
// paypal.ts line 46
let cachedToken: { token: string; expiresAt: number } | null = null;

// Fix: Add export for testing
export function _resetTokenCache() {
  cachedToken = null;
}
```

### Rate Limiter Test (1 failure)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/rate-limiter.test.ts`

**Test:** "returns success true on Redis error (graceful degradation)" (lines 90-104)

**Root Cause:** Test expects `console.error('Rate limiter error:', ...)` but implementation uses `logger.error(...)`.

**Evidence:**
- Test line 101: `expect(consoleSpy).toHaveBeenCalledWith('Rate limiter error:', expect.any(Error));`
- Implementation (rate-limiter.ts line 75): `logger.error({ service: 'rate-limiter', err: e, identifier }, 'Rate limiter error');`

**Fix Strategy:**
Mock the logger module instead of console.error:
```typescript
import { logger } from '../logger';
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// In test:
expect(logger.error).toHaveBeenCalledWith(
  expect.objectContaining({ service: 'rate-limiter' }),
  'Rate limiter error'
);
```

---

## Code Dependency Map

### TIER_LIMITS Sources (3 definitions - PROBLEM)

| File | Values | Status |
|------|--------|--------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` | free=2, pro=30, unlimited=60 | **SOURCE OF TRUTH** |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflections.ts` (line 198) | free=4, pro=10, unlimited=999999 | **WRONG VALUES** |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts` (line 15) | free=2, pro=5, unlimited=999999 (dreams) | Different limit type |

### Files Importing from constants.ts (Correct Pattern)

| File | Import |
|------|--------|
| `server/trpc/routers/users.ts` | TIER_LIMITS |
| `server/trpc/middleware.ts` | TIER_LIMITS, DAILY_LIMITS, CLARIFY_SESSION_LIMITS |
| `lib/utils/limits.ts` | TIER_LIMITS, DAILY_LIMITS |
| `app/dashboard/page.tsx` | TIER_LIMITS |
| `app/pricing/page.tsx` | TIER_LIMITS, TIER_PRICING, DAILY_LIMITS, DREAM_LIMITS |
| `components/subscription/UsageWarningBanner.tsx` | TIER_LIMITS |
| `components/subscription/SubscriptionStatusCard.tsx` | TIER_LIMITS |

### Files with Local TIER_LIMITS (Must be fixed)

| File | Line | Impact |
|------|------|--------|
| `server/trpc/routers/reflections.ts` | 198-202 | checkUsage endpoint returns wrong limits |
| `server/trpc/routers/dreams.ts` | 15-19 | Dream limit checking (separate concept but uses 999999 vs Infinity) |

### Test Fixtures

| File | Status |
|------|--------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/dreams.ts` | Has `DREAM_TIER_LIMITS` (lines 295-299) - matches dreams.ts router |

### Hardcoded Values (Non-TIER_LIMITS)

| File | Line | Value | Should Be |
|------|------|-------|-----------|
| `app/onboarding/page.tsx` | 54 | "4 conversations per month" | "2 conversations per month" |

---

## Security Current State

### 1. Admin/Cron Authentication (Timing Attack Vulnerable)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/cron/consolidate-patterns/route.ts`

**Current Code (line 21):**
```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
```

**Vulnerability:** String comparison (`!==`) is vulnerable to timing attacks. An attacker can measure response times to determine correct characters.

**Fix:**
```typescript
import { timingSafeEqual } from 'crypto';

const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
const received = Buffer.from(authHeader || '');
if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
```

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/admin.ts`

**Current Code (lines 17, 34):**
```typescript
if (creatorSecret === process.env.CREATOR_SECRET_KEY) {
authenticated: input.key === process.env.CREATOR_SECRET_KEY,
```

**Same vulnerability** - uses direct string comparison.

### 2. Password Requirements (Weak)

**Current:** 6 characters minimum (types/schemas.ts line 11, supabase/config.toml line 142)

**Vision Requirement:** 12+ characters with complexity

**Files requiring update:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts` (line 11)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/config.toml` (line 142)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/auth/signup/page.tsx` (lines 96, 173-177)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx` (lines 162, 402)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/auth/reset-password/route.ts` (line 28)

### 3. Exposed Secrets (CRITICAL)

**Files committed to git (per vision):**
- `.env.local`
- `.env.production.local`

**Secrets requiring rotation:**
1. Anthropic API key
2. PayPal client ID and secret
3. Supabase service role key
4. JWT secret
5. Gmail app password
6. CRON_SECRET
7. CREATOR_SECRET_KEY

---

## Risk Assessment Matrix

| Change | Risk Level | Impact | Rollback Strategy | Time Estimate |
|--------|------------|--------|-------------------|---------------|
| Fix rate-limiter test (logger mock) | **LOW** | Test only | Revert test file | 5 min |
| Fix PayPal tests (cache reset) | **LOW** | Test + minimal production change | Revert test file + paypal.ts | 15-20 min |
| Remove reflections.ts TIER_LIMITS | **MEDIUM** | checkUsage returns different values | Revert import change | 10 min |
| Remove dreams.ts TIER_LIMITS | **MEDIUM** | Dream limit checking changes | Revert import change | 15 min |
| Fix onboarding hardcoded value | **LOW** | UI text only | Revert string | 2 min |
| Add timingSafeEqual to cron | **LOW** | Security improvement, no behavior change | Revert file | 5 min |
| Add timingSafeEqual to admin.ts | **LOW** | Security improvement, no behavior change | Revert file | 5 min |
| Strengthen password requirements | **MEDIUM** | Existing users unaffected, new signups require stronger | Revert schema + UI files | 20 min |
| Rotate exposed secrets | **HIGH** | Production impact - requires Vercel env update | Restore old secrets (if still accessible) | 2-4 hrs |
| Clean git history | **HIGH** | Irreversible | Backup repo first | 1-2 hrs |

---

## Builder Task Recommendation

### Recommended: Single Iteration with 2 Builders

**Rationale:** Tasks are independent enough to parallelize, but scope is small enough for one iteration.

### Builder 1: Test Fixes + TIER_LIMITS Consolidation

**Scope:**
1. Fix rate-limiter test (mock logger instead of console)
2. Fix PayPal tests (add _resetTokenCache export, update tests)
3. Remove local TIER_LIMITS from reflections.ts
4. Update dreams.ts to use DREAM_LIMITS from constants.ts
5. Fix onboarding.tsx hardcoded "4 conversations"

**Files Modified:**
- `server/lib/__tests__/rate-limiter.test.ts`
- `server/lib/paypal.ts` (add export)
- `server/lib/__tests__/paypal.test.ts`
- `server/trpc/routers/reflections.ts`
- `server/trpc/routers/dreams.ts`
- `app/onboarding/page.tsx`

**Estimated Time:** 45-60 minutes

### Builder 2: Security Hardening (Should-Have)

**Scope:**
1. Add crypto.timingSafeEqual to cron route
2. Add crypto.timingSafeEqual to admin.ts
3. Strengthen password validation to 12+ characters
4. Update related UI components for password feedback

**Files Modified:**
- `app/api/cron/consolidate-patterns/route.ts`
- `server/trpc/routers/admin.ts`
- `types/schemas.ts`
- `app/auth/signup/page.tsx`
- `app/profile/page.tsx`
- `app/api/auth/reset-password/route.ts`

**Estimated Time:** 30-40 minutes

### Manual Task: Secret Rotation (Not for automated builders)

**CRITICAL:** Must be done manually by repository owner:
1. Rotate all exposed secrets in provider dashboards
2. Update Vercel environment variables
3. Clean git history using BFG or git-filter-repo
4. Verify .gitignore excludes .env* files

---

## Sequencing Requirements

### Must Be Sequential

1. **PayPal tests depend on paypal.ts change** - Export `_resetTokenCache` before updating tests
2. **Rate-limiter test is standalone** - Can be done anytime

### Can Be Parallel

- Rate-limiter test fix (Builder 1)
- PayPal test fix (Builder 1)
- Security hardening (Builder 2)

### Recommended Order

```
Phase 1 (Parallel):
+-- Builder 1: Rate-limiter test fix
+-- Builder 1: PayPal test fix (paypal.ts first, then tests)
+-- Builder 2: Security hardening (timing + passwords)

Phase 2 (Sequential after Phase 1):
+-- Builder 1: TIER_LIMITS consolidation (reflections.ts)
+-- Builder 1: TIER_LIMITS consolidation (dreams.ts)
+-- Builder 1: Fix onboarding hardcoded value

Phase 3 (Validation):
+-- Run full test suite to verify 566/566 passing
```

---

## Dependency Graph

```
Test Fixes (Independent)
+-- rate-limiter.test.ts (mock logger)
+-- paypal.test.ts (depends on paypal.ts export)
    +-- paypal.ts (add _resetTokenCache export)

TIER_LIMITS Consolidation (Independent of tests)
+-- reflections.ts (remove local TIER_LIMITS, import from constants)
+-- dreams.ts (consider DREAM_LIMITS pattern from constants)
    +-- lib/utils/constants.ts (SOURCE OF TRUTH - no changes needed)

Security Hardening (Independent)
+-- Timing Attack Fixes
|   +-- app/api/cron/consolidate-patterns/route.ts
|   +-- server/trpc/routers/admin.ts
+-- Password Strength
    +-- types/schemas.ts
    +-- app/auth/signup/page.tsx
    +-- app/profile/page.tsx
    +-- app/api/auth/reset-password/route.ts

Manual (Owner Only)
+-- Secret Rotation + Git History Cleanup
```

---

## Additional Observations

### Unhandled Promise Rejections

The test run showed 12 "Unhandled Rejection" errors from retry tests (`anthropic-retry.test.ts`, `retry.test.ts`). These are caused by tests that throw errors but don't properly catch them. The vision mentions this as a separate issue to fix.

**Location:**
- `lib/utils/__tests__/anthropic-retry.test.ts`
- `lib/utils/__tests__/retry.test.ts`

**Suggested Fix:** Ensure tests properly await and catch expected rejections using `await expect(...).rejects.toThrow()` pattern.

### dreams.ts TIER_LIMITS Design Decision

The `dreams.ts` router has its own TIER_LIMITS with `{ dreams: N }` structure because it tracks a different limit (number of dreams, not reflections). Options:
1. **Keep separate but import base values** from constants.ts `DREAM_LIMITS`
2. **Add DREAM_LIMITS to constants.ts** (already exists with free=2, pro=5, unlimited=Infinity)

Recommendation: Update dreams.ts to import `DREAM_LIMITS` from constants.ts and remove local definition.

### Test Fixture Alignment

`test/fixtures/dreams.ts` has `DREAM_TIER_LIMITS` that should be updated to import from constants.ts rather than defining its own copy.

---

## Recommendations for Master Plan

1. **Single Iteration Sufficient** - Total work estimated at 2-3 hours with 2 parallel builders
2. **Secret Rotation is Manual** - Do NOT include in automated builder tasks
3. **Run Tests Early and Often** - Validate each fix independently before moving on
4. **Consider Adding Constants Validation Test** - Prevent future drift by testing that no other TIER_LIMITS definitions exist
5. **Prioritize Test Fixes First** - Green tests enable confident deployment

---

*Exploration completed: 2025-12-10*
*This report informs master planning decisions*
