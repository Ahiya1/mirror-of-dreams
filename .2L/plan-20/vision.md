# Project Vision: Code Excellence & Test Stability

**Created:** 2025-12-10T08:50:00Z
**Plan:** plan-20

---

## Problem Statement

Mirror of Dreams has grown through rapid iteration with 19 previous plans and 33+ iterations. While feature-complete and production-ready, the codebase has accumulated technical debt that impacts maintainability, test reliability, and developer experience.

**Current pain points:**
- **CRITICAL: Secrets exposed in git** - `.env.local` and `.env.production.local` contain production API keys
- 6 tests failing out of 566 (98.9% pass rate) - but should be 100%
- TIER_LIMITS defined in 3+ places with conflicting values (P0)
- MirrorExperience.tsx at 1504 lines violates single responsibility (P1)
- 96 uses of `any` type defeating TypeScript's safety
- 150+ console.log statements in production code
- Test mocking issues causing unhandled promise rejections
- PayPal test module has token caching conflicts between tests
- Timing attack vulnerabilities in admin/cron authentication
- Weak password requirements (only 6 characters minimum)
- nodemailer CVE vulnerability (version 6.10.1)

---

## Target Users

**Primary user:** Developers maintaining Mirror of Dreams
- Need confidence that tests catch regressions
- Need clear, maintainable code to work with
- Need fast feedback loops when making changes

**Secondary users:**
- Future developers onboarding to the project
- Automated CI/CD pipelines requiring 100% test pass

---

## Core Value Proposition

Transform Mirror of Dreams from "it works" to "it's excellent" - achieving 100% test pass rate, eliminating type safety gaps, and establishing patterns for sustainable growth.

**Key benefits:**
1. 100% test pass rate enabling confident deployments
2. Single source of truth for tier configuration
3. Reduced cognitive load through smaller, focused components
4. Type-safe codebase catching errors at compile time

---

## Feature Breakdown

### Must-Have (MVP)

1. **CRITICAL: Rotate Exposed Secrets**
   - Description: Production secrets were found committed to git - must be rotated immediately
   - User story: As a system owner, I need all exposed credentials invalidated to prevent unauthorized access
   - Acceptance criteria:
     - [ ] Rotate Anthropic API key (production)
     - [ ] Rotate PayPal client ID and secret (live mode)
     - [ ] Rotate Supabase service role key
     - [ ] Rotate JWT secret
     - [ ] Rotate Gmail app password
     - [ ] Rotate CRON_SECRET
     - [ ] Remove `.env.local` and `.env.production.local` from git tracking
     - [ ] Clean git history using BFG or git-filter-repo
     - [ ] Verify .gitignore properly excludes .env* files
     - [ ] Update Vercel environment variables with new secrets

2. **Fix 6 Failing Tests**
   - Description: Resolve test failures in paypal.test.ts (5 failures) and rate-limiter.test.ts (1 failure)
   - User story: As a developer, I want all tests to pass so that CI is green and I can deploy with confidence
   - Acceptance criteria:
     - [ ] PayPal token caching test passes (reset cachedToken between tests)
     - [ ] PayPal error handling test passes (mock properly rejects)
     - [ ] PayPal createSubscription test passes (mock returns links array)
     - [ ] PayPal getSubscriptionDetails test passes (proper response mocking)
     - [ ] PayPal verifyWebhookSignature test passes
     - [ ] Rate limiter graceful degradation test passes (uses logger not console.error)
     - [ ] `npm run test:run` shows 566/566 passing
     - [ ] No unhandled promise rejections

2. **Consolidate TIER_LIMITS (P0)**
   - Description: Enforce lib/utils/constants.ts as the ONLY source of truth for tier limits
   - User story: As a developer, I want tier limits in one place so changes don't break features
   - **Source of Truth (lib/utils/constants.ts) - DO NOT CHANGE:**
     - TIER_LIMITS: free=2, pro=30, unlimited=60 (reflections/month)
     - DAILY_LIMITS: free=Infinity, pro=1, unlimited=2
     - DREAM_LIMITS: free=2, pro=5, unlimited=Infinity
     - CLARIFY_SESSION_LIMITS: free=0, pro=20, unlimited=30
     - TIER_PRICING: Pro=$19/mo ($190/yr), Unlimited=$39/mo ($390/yr)
   - Acceptance criteria:
     - [ ] Remove local TIER_LIMITS from server/trpc/routers/reflections.ts (has WRONG values: 4/10/999999)
     - [ ] Remove local TIER_LIMITS from server/trpc/routers/dreams.ts (uses 999999 instead of Infinity)
     - [ ] Update test fixtures to import from @/lib/utils/constants
     - [ ] Replace hardcoded values in CancelSubscriptionModal.tsx (says "30/60" hardcoded)
     - [ ] Replace hardcoded "4 conversations" in onboarding/page.tsx (should say "2")
     - [ ] All tier-checking code imports from @/lib/utils/constants
     - [ ] TypeScript error if tier doesn't exist (exhaustive check)

3. **Fix Rate Limiter Test Expectation**
   - Description: The test expects console.error but implementation uses logger.error
   - User story: As a developer, I want tests to match implementation
   - Acceptance criteria:
     - [ ] Test expects logger.error (matching rate-limiter.ts line 75)
     - [ ] Or mock logger instead of console in test setup

### Should-Have (Post-MVP)

1. **Refactor MirrorExperience.tsx (P1)**
   - Extract 5 custom hooks (useReflectionForm, useReflectionViewMode, etc.)
   - Extract 5 view components (DreamSelectionView, ReflectionFormView, etc.)
   - Reduce main component from 1504 to ~350 lines
   - Consolidate duplicated constants with MobileReflectionFlow.tsx

2. **Reduce `any` Types**
   - Priority files: evolution.ts (10), visualizations.ts (4), clarify.ts (1)
   - Create proper types for AI response structures
   - Replace test file `any` with proper mock types

3. **Add Sentry Error Monitoring (P2)**
   - Install @sentry/nextjs
   - Configure error boundaries integration
   - Replace 150+ console.error with structured logging
   - Add Sentry to PayPal webhooks and AI calls

4. **Fix Unhandled Promise Rejections**
   - Ensure all retry tests properly await rejections
   - Add proper error boundaries in async test helpers

### Could-Have (Future)

1. **Add E2E Tests (P3)**
   - Install Playwright
   - Create critical path tests: signup -> reflection -> subscribe

2. **Enhance CI/CD (P3)**
   - Tests must pass to merge (remove continue-on-error)
   - Add dependency vulnerability scanning
   - Add Lighthouse performance checks

3. **Security Hardening (P1 - High Priority)**
   - Implement crypto.timingSafeEqual for admin/cron secret comparisons (timing attack fix)
   - Strengthen password requirements to 12+ characters with complexity
   - Upgrade nodemailer to 7.0.11+ to fix CVE (GHSA-mm7p-fcc7-pg87)
   - Add rate limiting to admin authentication endpoints
   - Replace inline `require('crypto')` with static import in email.ts

---

## User Flows

### Flow 1: Developer Runs Tests

**Steps:**
1. Developer runs `npm run test:run`
2. All 566 tests execute
3. All tests pass with no warnings
4. Developer sees green output

**Edge cases:**
- Network issues: Tests should not require real network (all mocked)
- Environment missing: Tests should work without .env (mocked in vitest.setup.ts)

**Error handling:**
- Clear error messages if mock setup fails
- No unhandled rejections polluting output

### Flow 2: Developer Changes Tier Limits

**Steps:**
1. Developer opens lib/utils/constants.ts
2. Changes TIER_LIMITS value
3. TypeScript shows all usages
4. All dependent code updates automatically
5. Tests validate new values

**Edge cases:**
- Adding new tier: Type system enforces handling
- Removing tier: Compiler errors guide cleanup

---

## Technical Requirements

**Must support:**
- Vitest 2.1.0 test framework
- TypeScript strict mode
- Next.js 14 app router patterns
- tRPC for API layer

**Constraints:**
- Cannot break existing functionality
- Changes must be backward compatible
- Tests must be deterministic (no flaky tests)

**Preferences:**
- Prefer smaller, focused changes
- Each fix should be independently verifiable
- Maintain existing code style (Prettier config)

---

## Success Criteria

**The MVP is successful when:**

1. **All Secrets Rotated**
   - Metric: Old credentials no longer work
   - Target: All 7 exposed secrets rotated, git history cleaned

2. **100% Test Pass Rate**
   - Metric: `npm run test:run` output
   - Target: 566/566 tests passing, 0 errors

3. **Single TIER_LIMITS Source**
   - Metric: grep for TIER_LIMITS definitions
   - Target: Exactly 1 definition in constants.ts

4. **No Unhandled Promise Rejections**
   - Metric: Test output warnings
   - Target: 0 unhandled rejections in test run

5. **CI Stays Green**
   - Metric: GitHub Actions workflow status
   - Target: Build + test jobs pass

---

## Out of Scope

**Explicitly not included in MVP:**
- Full MirrorExperience.tsx refactor (P1, should-have)
- Sentry integration (P2, should-have)
- E2E tests (P3, could-have)
- Security hardening (P3, could-have)
- Component performance optimization
- New feature development

**Why:** Focus on stability first. Fix the foundation before building higher.

---

## Assumptions

1. All test failures are due to mock/setup issues, not actual bugs
2. TIER_LIMITS consolidation won't change business logic
3. Existing vitest.setup.ts provides base mock infrastructure
4. The rate-limiter uses logger.error, not console.error

---

## Open Questions

1. Should PayPal tests reset `cachedToken` module state between tests, or use dependency injection?
2. Should we add a constants validation test to prevent future drift?
3. Are there any other tier constants outside TIER_LIMITS that need consolidation?

---

## Detailed Test Fix Analysis

### PayPal Test Failures (5 tests)

**Root Cause:** Module-level `cachedToken` persists between tests, and mock setup doesn't properly sequence token fetch + API calls.

**File:** `server/lib/__tests__/paypal.test.ts`

**Fixes needed:**

1. **"should use cached token if still valid"** (line 65-82)
   - Problem: First test already fetched token, cachedToken persists
   - Fix: Reset `cachedToken` to null before each test (need to export setter or use module reset)

2. **"should throw error on failed token request"** (line 84-93)
   - Problem: Returns cached token from previous test instead of fetching new one
   - Fix: Clear cache OR ensure test runs before cache is populated

3. **"should create subscription and return approval URL"** (line 97-127)
   - Problem: Mock doesn't return `links` array properly OR cached token issue
   - Fix: Verify mock chain: token mock -> subscription mock with links array

4. **"should fetch subscription details"** (line 153-191)
   - Problem: Response mock not being used (returns token response instead)
   - Fix: Ensure mockResolvedValueOnce sequence is correct

5. **"should verify valid webhook signature"** (line 195-228)
   - Problem: Similar mock sequencing issue
   - Fix: Proper mock chain for token + verification

**Solution Pattern:**
```typescript
// Option 1: Export a cache reset function from paypal.ts
export function _resetTokenCache() {
  cachedToken = null;
}

// Option 2: Use vi.resetModules() in beforeEach
beforeEach(() => {
  vi.resetAllMocks();
  vi.resetModules(); // This resets module-level state
});
```

### Rate Limiter Test Failure (1 test)

**File:** `server/lib/__tests__/rate-limiter.test.ts` line 90-104

**Problem:** Test expects `console.error('Rate limiter error:', ...)` but implementation uses `logger.error(...)`

**Current test:**
```typescript
expect(consoleSpy).toHaveBeenCalledWith('Rate limiter error:', expect.any(Error));
```

**Actual implementation (rate-limiter.ts:75):**
```typescript
logger.error({ service: 'rate-limiter', err: e, identifier }, 'Rate limiter error');
```

**Fix:** Mock logger instead of console:
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

## Implementation Order

1. **CRITICAL: Rotate all exposed secrets** (2-4 hrs) - Security emergency
   - Anthropic, PayPal, Supabase, JWT, Gmail, CRON secrets
   - Clean git history
   - Update Vercel env vars
2. **Fix rate-limiter test** (5 min) - Simple mock update
3. **Fix PayPal tests** (30 min) - Module cache reset
4. **Consolidate TIER_LIMITS** (30 min) - Single source of truth
5. **Update dependent code** (30 min) - Import from constants
6. **Verify all 566 tests pass** (5 min) - Final validation

---

## Next Steps

- [ ] Review and refine this vision
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
