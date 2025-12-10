# Builder Tasks - Iteration 34

## Builder 1: Test Fixes

### Task 1.1: Fix Rate Limiter Test
**File:** `server/lib/__tests__/rate-limiter.test.ts`

The test at lines 90-104 expects `console.error` but implementation uses `logger.error`.

**Fix:**
1. Add mock for logger module at top of file
2. Update the test assertion to expect `logger.error` instead of `console.error`

### Task 1.2: Fix PayPal Tests (5 failures)
**File:** `server/lib/paypal.ts` - Add cache reset function
**File:** `server/lib/__tests__/paypal.test.ts` - Use cache reset in beforeEach

**Root Cause:** Module-level `cachedToken` (line 46) persists between tests.

**Fix:**
1. In `paypal.ts`, export a `_resetTokenCache()` function for testing
2. In `paypal.test.ts`, import and call `_resetTokenCache()` in `beforeEach`

### Success Criteria
- All 6 failing tests now pass
- `npm run test:run` shows 566/566 passing
- No unhandled promise rejection warnings

---

## Builder 2: TIER_LIMITS Consolidation

### Task 2.1: Fix reflections.ts
**File:** `server/trpc/routers/reflections.ts`

Remove the local TIER_LIMITS definition at lines 197-202 (inside checkUsage procedure).
Import TIER_LIMITS from `@/lib/utils/constants`.

**Current (WRONG values):**
```typescript
const TIER_LIMITS = {
  free: 4,      // WRONG: should be 2
  pro: 10,      // WRONG: should be 30
  unlimited: 999999,
};
```

**Fix:** Import and use the correct values from constants.ts

### Task 2.2: Fix dreams.ts
**File:** `server/trpc/routers/dreams.ts`

Remove the local TIER_LIMITS definition at lines 12-19.
Import DREAM_LIMITS from `@/lib/utils/constants`.

**Current:**
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  pro: { dreams: 5 },
  unlimited: { dreams: 999999 },
};
```

**Fix:**
1. Import `DREAM_LIMITS` from constants
2. Update `checkDreamLimit` function to use `DREAM_LIMITS[tier]` directly

### Success Criteria
- `grep "const TIER_LIMITS" server/trpc/routers/` returns empty
- TypeScript compilation passes
- All tests still pass

---

## Source of Truth (DO NOT MODIFY)

**File:** `lib/utils/constants.ts`
```typescript
export const TIER_LIMITS = { free: 2, pro: 30, unlimited: 60 };
export const DREAM_LIMITS = { free: 2, pro: 5, unlimited: Infinity };
```
