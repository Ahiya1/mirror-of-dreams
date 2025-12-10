# Builder 1 Report: Test Fixes

## Status: COMPLETE

## Summary

Fixed 6 failing tests as assigned:
- 1 rate-limiter test: Updated to mock the logger module instead of console.error
- 5 PayPal tests: Added `_resetTokenCache()` function and called it in beforeEach to reset module-level state between tests

## Changes Made

### File: `server/lib/paypal.ts`
- Added `_resetTokenCache()` export function at the end of the file
- This function resets the module-level `cachedToken` variable to `null`
- Clearly documented as FOR TESTING ONLY

### File: `server/lib/__tests__/paypal.test.ts`
- Imported `_resetTokenCache` from `../paypal`
- Added `_resetTokenCache()` call in `beforeEach()` to ensure tests don't affect each other through cached state

### File: `server/lib/__tests__/rate-limiter.test.ts`
- Added mock for the logger module using `vi.mock('../logger', ...)` with inline mock definition (required because vi.mock is hoisted)
- Updated the "returns success true on Redis error (graceful degradation)" test to assert on `mockLogger.error` instead of `console.error`
- Updated the "returns success true on Redis timeout (graceful degradation)" test similarly
- Removed unused console.error spy calls

## Test Results

```
npm run test:run

 server/lib/__tests__/rate-limiter.test.ts (32 tests) PASSED
 server/lib/__tests__/paypal.test.ts (19 tests) PASSED
```

All 6 previously failing tests now pass:
- rate-limiter: "returns success true on Redis error (graceful degradation)" - FIXED
- paypal: 5 tests that were failing due to cached token state - FIXED

**Note:** The remaining 2 failing tests in `test/integration/reflections/reflections.test.ts` are related to TIER_LIMITS values and are assigned to Builder-2 (not my scope).

## Issues Encountered

### Issue 1: vi.mock hoisting
- **Problem:** Initially tried to define `mockLogger` as a const before `vi.mock`, but `vi.mock` is hoisted to the top of the file, so the variable wasn't available.
- **Solution:** Defined the mock object inline within the `vi.mock` factory function, then imported the mocked logger after to use in assertions.

### Issue 2: Test isolation for PayPal
- **Root Cause:** The `cachedToken` variable in `paypal.ts` persists at module level, causing the "should use cached token if still valid" test to behave inconsistently depending on test execution order.
- **Solution:** Added `_resetTokenCache()` export function and called it in `beforeEach` to ensure each test starts with a clean slate.

## Files Modified

| File | Change Description |
|------|-------------------|
| `server/lib/paypal.ts` | Added `_resetTokenCache()` export function |
| `server/lib/__tests__/paypal.test.ts` | Import and call `_resetTokenCache()` in beforeEach |
| `server/lib/__tests__/rate-limiter.test.ts` | Mock logger module; update error assertions |

## Verification

Both test files pass independently and as part of the full suite:
- `server/lib/__tests__/rate-limiter.test.ts`: 32 tests passing
- `server/lib/__tests__/paypal.test.ts`: 19 tests passing
