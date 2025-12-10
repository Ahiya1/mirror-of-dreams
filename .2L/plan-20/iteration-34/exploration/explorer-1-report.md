# Iteration 34 Exploration Report

## Summary

This iteration focuses on fixing 6 failing tests and consolidating TIER_LIMITS definitions. The scope is well-defined and low-risk.

## Test Failures Analysis

### 1. PayPal Tests (5 failures)

**File:** `server/lib/__tests__/paypal.test.ts`

**Root Cause:** Module-level `cachedToken` (line 46 in paypal.ts) persists between tests. The `beforeEach` hook calls `vi.resetAllMocks()` but this doesn't reset module state.

**Solution:** Add `vi.resetModules()` before importing, or export a test-only cache reset function.

### 2. Rate Limiter Test (1 failure)

**File:** `server/lib/__tests__/rate-limiter.test.ts` line 90-104

**Root Cause:** Test expects `console.error('Rate limiter error:', ...)` but implementation uses `logger.error(...)`.

**Solution:** Mock the logger module instead of console.

## TIER_LIMITS Consolidation

### Source of Truth (DO NOT MODIFY)
**File:** `lib/utils/constants.ts`
- `TIER_LIMITS = { free: 2, pro: 30, unlimited: 60 }` - reflections/month
- `DREAM_LIMITS = { free: 2, pro: 5, unlimited: Infinity }` - active dreams

### Duplicate Definitions Found

1. **server/trpc/routers/dreams.ts:15-19** (DIFFERENT STRUCTURE)
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  pro: { dreams: 5 },
  unlimited: { dreams: 999999 },
};
```
**Action:** Import `DREAM_LIMITS` from constants, refactor `checkDreamLimit`

2. **server/trpc/routers/reflections.ts:198-202** (WRONG VALUES!)
```typescript
const TIER_LIMITS = {
  free: 4,       // WRONG: should be 2
  pro: 10,       // WRONG: should be 30
  unlimited: 999999,
};
```
**Action:** Import `TIER_LIMITS` from constants, delete local definition

## Files to Modify

### Test Files
1. `server/lib/__tests__/paypal.test.ts` - Fix mock reset
2. `server/lib/__tests__/rate-limiter.test.ts` - Fix logger mock

### Source Files
3. `server/trpc/routers/dreams.ts` - Import DREAM_LIMITS
4. `server/trpc/routers/reflections.ts` - Import TIER_LIMITS

## Builder Task Breakdown

### Builder 1: Test Fixes
- Fix PayPal test caching issue (5 tests)
- Fix rate limiter logger mock (1 test)
- Verify 566/566 tests pass

### Builder 2: Constants Consolidation
- Remove local TIER_LIMITS from dreams.ts, use DREAM_LIMITS
- Remove local TIER_LIMITS from reflections.ts, use constants
- Verify typecheck passes

---
*Exploration completed: 2025-12-10*
