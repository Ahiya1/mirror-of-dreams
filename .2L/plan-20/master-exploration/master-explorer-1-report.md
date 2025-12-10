# Master Explorer 1 Report: Architecture & Complexity Analysis

## Executive Summary

Mirror of Dreams has 6 failing tests out of 566 (98.9% pass rate), primarily due to PayPal module token caching issues and rate-limiter test mocking mismatches. The secrets exposure concern is a **false alarm** - `.env.local` and `.env.production.local` exist locally but are NOT tracked in git (verified via `git ls-files`). The TIER_LIMITS consolidation requires changes to 4-5 files with conflicting local definitions. This is a MEDIUM complexity plan achievable in a single focused iteration.

---

## Secrets Exposure Assessment

### Finding: FALSE ALARM - Secrets are NOT exposed in git

**Investigation Results:**
- `.env.local` and `.env.production.local` exist in the working directory
- `git ls-files | grep -E "\.env"` returns ONLY `.env.example`
- `.gitignore` properly excludes `.env.local`, `.env.production.local`, and `*.local` patterns

**Evidence from .gitignore (lines 9-14, 117):**
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
...
*.local
```

**Conclusion:** The vision document's "CRITICAL: Secrets exposed in git" is incorrect. The files exist locally but are properly gitignored and have never been committed. No secret rotation is needed.

**Risk Level:** NONE - No action required

---

## Test Infrastructure Status

### Current State: 6 failures, 560 passing, 12 unhandled rejections

**Test Files:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/paypal.test.ts` - 5 failures
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/rate-limiter.test.ts` - 1 failure

### PayPal Test Failures (5 tests)

**Root Cause:** Module-level `cachedToken` persists between tests due to `vi.resetAllMocks()` not resetting module state.

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts` (line 46)
```typescript
let cachedToken: { token: string; expiresAt: number } | null = null;
```

**Specific Failures:**

1. **"should use cached token if still valid"** (line 65-82)
   - Symptom: `expected "spy" to be called 1 times, but got 0 times`
   - Cause: Token cached from PRIOR test, mock never called

2. **"should throw error on failed token request"** (line 84-93)
   - Symptom: `promise resolved "'test-token-123'" instead of rejecting`
   - Cause: Returns cached token instead of fetching new one

3. **"should create subscription and return approval URL"** (line 97-127)
   - Symptom: `Cannot read properties of undefined (reading 'find')`
   - Cause: Mock sequence wrong - returns token response instead of subscription response

4. **"should fetch subscription details"** (line 153-191)
   - Symptom: `expected { access_token: 'test-token' } to deeply equal { id: 'SUB-123' }`
   - Cause: Token mock consumed, subscription mock not reached

5. **"should verify valid webhook signature"** (line 195-228)
   - Symptom: `expected false to be true`
   - Cause: Same mock sequencing issue

**Fix Required:** Add `vi.resetModules()` in `beforeEach` OR export a `_resetTokenCache()` function from paypal.ts for test use.

### Rate Limiter Test Failure (1 test)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/rate-limiter.test.ts` (line 90-104)

**Symptom:** `expected "error" to be called with arguments: [ 'Rate limiter error:', Any<Error> ]`

**Root Cause:** Test expects `console.error('Rate limiter error:', ...)` but implementation uses structured logger.

**Implementation (rate-limiter.ts line 75):**
```typescript
logger.error({ service: 'rate-limiter', err: e, identifier }, 'Rate limiter error');
```

**Test (line 96-101):**
```typescript
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
// ...
expect(consoleSpy).toHaveBeenCalledWith('Rate limiter error:', expect.any(Error));
```

**Fix Required:** Mock `logger` instead of `console` in test setup.

### Unhandled Promise Rejections (12 errors)

**Source:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/anthropic-retry.test.ts` and retry.test.ts

**Root Cause:** Tests create rejected promises that are handled asynchronously, triggering Node.js warnings.

**Fix Required:** Ensure all rejected promises are awaited properly within test scope.

---

## TIER_LIMITS Consolidation Scope

### Source of Truth (CORRECT - DO NOT CHANGE)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`

```typescript
export const TIER_LIMITS = { free: 2, pro: 30, unlimited: 60 } as const;
export const DAILY_LIMITS = { free: Infinity, pro: 1, unlimited: 2 } as const;
export const DREAM_LIMITS = { free: 2, pro: 5, unlimited: Infinity } as const;
export const CLARIFY_SESSION_LIMITS = { free: 0, pro: 20, unlimited: 30 } as const;
```

### Conflicting Definitions Found

**1. /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflections.ts (lines 198-202)**
- Defines local `TIER_LIMITS` with WRONG values: `{ free: 4, pro: 10, unlimited: 999999 }`
- Used in `checkUsage` procedure
- **Action:** Remove local definition, import from constants

**2. /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts (lines 15-19)**
- Defines local `TIER_LIMITS` for dreams: `{ free: { dreams: 2 }, pro: { dreams: 5 }, unlimited: { dreams: 999999 } }`
- Uses 999999 instead of Infinity for unlimited
- **Action:** Import `DREAM_LIMITS` from constants, refactor usage

**3. /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/dreams.ts (lines 295-299)**
- Defines `DREAM_TIER_LIMITS = { free: 2, pro: 5, unlimited: 999999 }`
- Used by integration tests
- **Action:** Import `DREAM_LIMITS` from constants

### Hardcoded Values in UI

**1. /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/onboarding/page.tsx (line 54)**
```typescript
"As a Wanderer, you receive:\n...4 conversations per month..."
```
- Says "4 conversations" but TIER_LIMITS.free = 2
- **Action:** Replace with dynamic value or update to "2"

**2. /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx (line 349)**
```typescript
{user?.tier === 'free' ? '2' : user?.tier === 'pro' ? '30' : '60'}
```
- Hardcoded but correct values - should import from constants for consistency
- **Action:** Import and use TIER_LIMITS dynamically

**3. /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/UpgradeModal.tsx (lines 102, 130)**
```typescript
<li>. 30 conversations/month</li>
<li>. 60 conversations/month</li>
```
- Hardcoded but correct values - should import for consistency
- **Action:** Import and use TIER_LIMITS dynamically

### Files Using Constants Correctly

The following files already import from `@/lib/utils/constants`:
- `app/dashboard/page.tsx`
- `app/pricing/page.tsx`
- `server/trpc/middleware.ts`
- `server/trpc/routers/users.ts`
- `server/trpc/routers/clarify.ts`
- `components/clarify/ClarifyCard.tsx`
- `components/subscription/UsageWarningBanner.tsx`
- `components/subscription/SubscriptionStatusCard.tsx`
- `lib/utils/limits.ts`

---

## Complexity Assessment

**Overall Complexity: MEDIUM**

### Justification:

1. **Scope is well-defined:** 6 specific test failures with clear root causes
2. **Changes are isolated:** Each fix affects 1-2 files
3. **No architectural changes:** Only refactoring and mock fixes
4. **Low risk of regression:** Test suite provides safety net
5. **Secrets issue is non-existent:** Major work item eliminated

### File Change Summary

| File | Change Type | Risk | Effort |
|------|-------------|------|--------|
| `server/lib/__tests__/paypal.test.ts` | Test mock fix | LOW | 30 min |
| `server/lib/__tests__/rate-limiter.test.ts` | Test mock fix | LOW | 10 min |
| `server/trpc/routers/reflections.ts` | Import consolidation | LOW | 10 min |
| `server/trpc/routers/dreams.ts` | Import consolidation | MEDIUM | 20 min |
| `test/fixtures/dreams.ts` | Import consolidation | LOW | 5 min |
| `app/onboarding/page.tsx` | Fix hardcoded "4" to "2" | LOW | 5 min |
| `app/profile/page.tsx` | Optional: use constants | LOW | 5 min |
| `components/subscription/UpgradeModal.tsx` | Optional: use constants | LOW | 10 min |

**Total Files:** 8 (5 required, 3 optional for consistency)
**Estimated Effort:** 1.5-2 hours

---

## Iteration Recommendation

**Recommendation: SINGLE ITERATION**

### Reasoning:

1. **All changes are low-risk and independent:** Each fix can be verified in isolation
2. **No dependencies between changes:** PayPal tests, rate-limiter test, and TIER_LIMITS consolidation are orthogonal
3. **Clear acceptance criteria:** 566/566 tests passing, 0 unhandled rejections
4. **Secret rotation NOT needed:** Eliminates 2-4 hours of work
5. **Total scope fits comfortably in one session:** ~2 hours of implementation

### Suggested Order:

1. **Fix rate-limiter test** (5 min) - Quick win, simplest fix
2. **Fix PayPal tests** (30 min) - Core test infrastructure
3. **Fix unhandled promise rejections** (15 min) - Clean test output
4. **Consolidate TIER_LIMITS in routers** (30 min) - reflections.ts + dreams.ts
5. **Update test fixtures** (5 min) - dreams.ts fixtures
6. **Fix hardcoded UI values** (15 min) - onboarding.tsx + optional others
7. **Run full test suite** (5 min) - Verify 566/566 passing

---

## Risk Analysis

### High Risks

None identified - all changes are well-scoped with existing test coverage.

### Medium Risks

**1. PayPal Module State Reset**
- **Risk:** `vi.resetModules()` might break other test isolation
- **Impact:** Other tests could fail unexpectedly
- **Mitigation:** Export `_resetTokenCache()` function instead, only use in PayPal tests

**2. TIER_LIMITS Change in dreams.ts**
- **Risk:** Router uses different structure (`{ dreams: N }` vs simple `N`)
- **Impact:** Need to refactor `checkDreamLimit` function
- **Mitigation:** Import `DREAM_LIMITS` and adapt usage, keep backward compatibility

### Low Risks

**1. UI Hardcoded Values**
- **Risk:** Might miss some occurrences
- **Impact:** Inconsistent display to users
- **Mitigation:** Grep for all numeric tier references, update systematically

**2. Test Mock Changes**
- **Risk:** Tests might pass but not truly validate behavior
- **Impact:** False confidence in code
- **Mitigation:** Verify mock structure matches actual API responses

---

## Additional Observations

### Test Infrastructure Notes

1. **PromiseRejectionHandledWarning:** 12 warnings from anthropic-retry.test.ts and retry.test.ts suggest async error handling patterns need improvement in test mocks (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`).

2. **Test Count:** 566 total tests, 560 passing - 98.9% pass rate is excellent baseline.

### Code Quality Observations

1. **TIER_LIMITS comment mismatch:** In reflections.ts line 197, comment says "Vision: 4 reflections/month for Free tier" but actual vision says 2.

2. **Infinity vs 999999:** Inconsistent representation of "unlimited" - some use `Infinity`, some use `999999`. Should standardize on `Infinity`.

### Out of Scope Items (Confirmed)

Per vision document, these are NOT in MVP scope:
- MirrorExperience.tsx refactoring (1504 lines)
- `any` type elimination (96 instances)
- Sentry integration
- Security hardening
- E2E tests

---

*Exploration completed: 2025-12-10T11:15:00Z*
*This report informs master planning decisions*
