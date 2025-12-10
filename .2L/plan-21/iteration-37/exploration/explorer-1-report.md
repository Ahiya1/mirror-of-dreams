# Explorer 1 Report: Unhandled Promise Rejections & CI Blocking

## Executive Summary

The test suite currently has 12 unhandled promise rejection errors that occur during test execution, primarily in `retry.test.ts` (8 errors) and `anthropic-retry.test.ts` (4 errors). These arise from a common anti-pattern: creating promises that reject before attaching proper error handlers. Additionally, CI currently uses `continue-on-error: true` for tests, allowing broken tests to pass. Both issues require immediate fixes to ensure test reliability and CI integrity.

## Root Cause Analysis

### The Core Problem: Asynchronous Promise Rejection Handling

The unhandled rejections occur because of a specific pattern in the test code:

```typescript
// PROBLEMATIC PATTERN (causes unhandled rejection)
const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

await vi.advanceTimersByTimeAsync(1000);  // Promise already rejected here!

await expect(resultPromise).rejects.toEqual(error);  // Handler attached too late
```

**What Happens:**
1. `withRetry(fn, ...)` returns a promise immediately
2. The mock `fn` rejects synchronously with fake timers
3. The promise rejects BEFORE `expect().rejects` is attached
4. Node detects an unhandled rejection
5. Later, when `expect().rejects` runs, Node logs "Promise rejection was handled asynchronously"

### Why This Occurs With Fake Timers

When using `vi.useFakeTimers()`, the retry mechanism's `setTimeout` calls are processed synchronously during `vi.advanceTimersByTimeAsync()`. This means:
- All retries complete instantly during the timer advance
- The promise resolves/rejects before the next line of code

## Unhandled Rejection Sources

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts`

| Test Name | Line | Error Type | Rejection Source |
|-----------|------|------------|------------------|
| throws after max retries exceeded | 236-248 | Rate limited (429) | Promise rejects before expect() |
| respects custom maxRetries value | 250-261 | Service unavailable (503) | Promise rejects before expect() |
| applies exponential backoff (delays increase) | 277-301 | Rate limited (429) | Promise rejects before expect() |
| respects maxDelayMs cap | 303-327 | Service unavailable (503) | Promise rejects before expect() |
| adds randomness to delays when jitter factor > 0 | 335-366 | Rate limited (429) | Promise rejects before expect() |
| does not add jitter when jitter factor is 0 | 368-390 | Rate limited (429) | Promise rejects before expect() |
| calls onRetry callback on each retry | 440-460 | Rate limited (429) | Promise rejects before expect() |
| throws after 3 retries (maxRetries default) | 832-844 | Rate limited (429) | `anthropicErrors.rateLimited` |

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/anthropic-retry.test.ts`

| Test Name | Line | Error Type | Rejection Source |
|-----------|------|------------|------------------|
| stops retrying when max retries exceeded | 270-281 | Rate limited (429) | `anthropicErrors.rateLimited` |
| transitions from retryable to non-retryable error | 283-298 | Unauthorized (401) | `anthropicErrors.unauthorized` |
| applies exponential backoff to rate limit errors | 302-322 | Rate limited (429) | `anthropicErrors.rateLimited` |
| handles complete API outage | 382-397 | Service unavailable (503) | `createAnthropicError()` at line 385 |

## Fix Patterns

### Pattern 1: Use `expect().rejects` BEFORE Timer Advancement (Recommended)

```typescript
// CORRECT PATTERN - Attach handler BEFORE advancing time
it('throws after max retries exceeded', async () => {
  const error = { status: 429, message: 'Rate limited' };
  const fn = vi.fn().mockRejectedValue(error);

  const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

  // Attach the rejection handler FIRST, THEN advance timers
  const assertion = expect(resultPromise).rejects.toEqual(error);
  
  await vi.advanceTimersByTimeAsync(1000);
  
  await assertion;
  expect(fn).toHaveBeenCalledTimes(4);
});
```

**Why This Works:** `expect(promise).rejects` returns a new promise that's tracking the rejection. By calling it before advancing timers, we ensure the rejection handler is attached before the rejection occurs.

### Pattern 2: Use Promise.allSettled for Multiple Operations

```typescript
// For tests that need both timer advancement and rejection checking
it('applies exponential backoff to rate limit errors', async () => {
  const fn = vi.fn().mockRejectedValue(anthropicErrors.rateLimited);
  const delays: number[] = [];

  const resultPromise = withRetry(fn, {
    maxRetries: 3,
    baseDelayMs: 100,
    backoffMultiplier: 2,
    jitterFactor: 0,
    onRetry: (_attempt, _error, delay) => delays.push(delay),
  });

  // Create assertion promise before advancing time
  const assertionPromise = expect(resultPromise).rejects.toThrow();
  
  await vi.advanceTimersByTimeAsync(10000);
  
  await assertionPromise;
  expect(delays).toEqual([100, 200, 400]);
});
```

### Pattern 3: Wrap in try/catch for Complex Scenarios

```typescript
// For tests where you need to inspect the error object
it('transitions from retryable to non-retryable error', async () => {
  const fn = vi
    .fn()
    .mockRejectedValueOnce(anthropicErrors.rateLimited)
    .mockRejectedValue(anthropicErrors.unauthorized);

  const resultPromise = withRetry(fn, { baseDelayMs: 50 });

  // Create assertion immediately
  const assertion = expect(resultPromise).rejects.toThrow('Invalid API key');
  
  await vi.advanceTimersByTimeAsync(500);
  
  await assertion;
  expect(fn).toHaveBeenCalledTimes(2);
});
```

### Pattern 4: Use `vi.waitFor` for Dynamic Assertions

```typescript
// Alternative using waitFor
it('handles complete API outage', async () => {
  const mockApiCall = vi
    .fn()
    .mockRejectedValue(createAnthropicError('Service unavailable', 'api_error', 503));

  const resultPromise = withAIRetry(() => mockApiCall(), {
    operation: 'evolution.generate',
  });

  // Attach rejection handler immediately
  const rejectionHandler = resultPromise.catch(() => {});
  
  await vi.advanceTimersByTimeAsync(60000);

  await expect(resultPromise).rejects.toThrow('Service unavailable');
  expect(mockApiCall).toHaveBeenCalledTimes(4);
});
```

## CI Workflow Changes Required

### Current State (Line 60 in `.github/workflows/ci.yml`)

```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  continue-on-error: true  # <-- THIS IS THE PROBLEM
```

### Required Change

```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  # Remove continue-on-error to make CI fail on test failures
```

### Why This Matters

With `continue-on-error: true`:
- Tests can fail but CI passes
- The build job still runs (since test job "succeeds")
- Broken code can be deployed
- Test failures go unnoticed

## Coverage Threshold Configuration

### Current Vitest Config (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts`)

The current config does not have coverage thresholds:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts'],
  exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
},
```

### Recommended Threshold Configuration

Add to `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts'],
  exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
  thresholds: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
},
```

This will cause the test:coverage command to fail if coverage drops below thresholds.

## Implementation Checklist

### High Priority (Must Fix)

1. **Fix retry.test.ts unhandled rejections** (8 tests)
   - Lines: 236, 250, 277, 303, 335, 368, 440, 832
   - Pattern: Move `expect().rejects` before `vi.advanceTimersByTimeAsync()`

2. **Fix anthropic-retry.test.ts unhandled rejections** (4 tests)
   - Lines: 270, 283, 302, 382
   - Pattern: Same as above

3. **Remove continue-on-error from CI**
   - File: `.github/workflows/ci.yml`, line 60
   - Action: Delete `continue-on-error: true`

### Medium Priority (Should Fix)

4. **Add coverage thresholds**
   - File: `vitest.config.ts`
   - Add thresholds object to coverage config

5. **Update vitest.setup.ts to suppress PromiseRejectionHandledWarning during tests** (optional)
   - Only if tests are intentionally testing rejection handling

## Detailed Test Fixes Required

### `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts`

**Test: "throws after max retries exceeded" (lines 236-248)**
```typescript
// BEFORE (causes unhandled rejection)
const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
await vi.advanceTimersByTimeAsync(1000);
await expect(resultPromise).rejects.toEqual(error);

// AFTER (properly handles rejection)
const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
const assertion = expect(resultPromise).rejects.toEqual(error);
await vi.advanceTimersByTimeAsync(1000);
await assertion;
```

**Test: "respects custom maxRetries value" (lines 250-261)**
```typescript
// Same pattern - move expect().rejects before timer advance
const resultPromise = withRetry(fn, { maxRetries: 2, baseDelayMs: 10 });
const assertion = expect(resultPromise).rejects.toEqual(error);
await vi.advanceTimersByTimeAsync(500);
await assertion;
```

**Test: "applies exponential backoff (delays increase)" (lines 277-301)**
```typescript
const resultPromise = withRetry(fn, { /* config */ });
const assertion = expect(resultPromise).rejects.toEqual(error);
await vi.advanceTimersByTimeAsync(10000);
await assertion;
expect(delays).toHaveLength(3);
```

**Tests at lines 303, 335, 368, 440, 832** - All follow the same pattern.

### `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/anthropic-retry.test.ts`

**Test: "stops retrying when max retries exceeded" (lines 270-281)**
```typescript
// BEFORE
const resultPromise = withRetry(fn, { maxRetries: 2, baseDelayMs: 50 });
await vi.advanceTimersByTimeAsync(1000);
await expect(resultPromise).rejects.toThrow('Rate limit exceeded');

// AFTER
const resultPromise = withRetry(fn, { maxRetries: 2, baseDelayMs: 50 });
const assertion = expect(resultPromise).rejects.toThrow('Rate limit exceeded');
await vi.advanceTimersByTimeAsync(1000);
await assertion;
```

**Test: "transitions from retryable to non-retryable error" (lines 283-298)**
```typescript
const resultPromise = withRetry(fn, { baseDelayMs: 50 });
const assertion = expect(resultPromise).rejects.toThrow('Invalid API key');
await vi.advanceTimersByTimeAsync(500);
await assertion;
```

**Test: "applies exponential backoff to rate limit errors" (lines 302-322)**
```typescript
const resultPromise = withRetry(fn, { /* config */ });
const assertion = expect(resultPromise).rejects.toThrow();
await vi.advanceTimersByTimeAsync(10000);
await assertion;
```

**Test: "handles complete API outage" (lines 382-397)**
```typescript
const resultPromise = withAIRetry(() => mockApiCall(), {
  operation: 'evolution.generate',
});
const assertion = expect(resultPromise).rejects.toThrow('Service unavailable');
await vi.advanceTimersByTimeAsync(60000);
await assertion;
```

## Risk Assessment

### If Not Fixed

- **Test Reliability**: Tests may produce false positives/negatives
- **CI Trust**: Developers may lose confidence in CI results
- **Technical Debt**: Unhandled rejections will accumulate
- **Production Risk**: Bugs may slip through due to ignored test failures

### Fix Complexity

- **Low**: All fixes follow a single, well-documented pattern
- **Estimated Time**: 30-45 minutes for all fixes
- **Testing**: Each fix can be verified by running the specific test file

## Recommendations for Builder

1. **Start with retry.test.ts** - It has the most unhandled rejections (8)
2. **Run tests incrementally** - Fix one test, verify with `npm run test:run -- lib/utils/__tests__/retry.test.ts`
3. **Check for PromiseRejectionHandledWarning** - These warnings should disappear after fixes
4. **Remove CI continue-on-error LAST** - Only after all tests pass reliably
5. **Verify zero errors** - Run `npm run test:run 2>&1 | grep -i "unhandled"` to confirm

## Files to Modify

| File | Changes Required |
|------|------------------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts` | Fix 8 tests with async rejection pattern |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/anthropic-retry.test.ts` | Fix 4 tests with async rejection pattern |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml` | Remove `continue-on-error: true` on line 60 |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` | Add coverage thresholds (optional) |

## Summary

The unhandled promise rejections are a direct result of the test pattern where `expect().rejects` is called AFTER the promise has already rejected. The fix is straightforward: attach the rejection handler BEFORE advancing fake timers. Combined with removing the CI continue-on-error flag, this will restore test reliability and ensure CI properly blocks on failures.
