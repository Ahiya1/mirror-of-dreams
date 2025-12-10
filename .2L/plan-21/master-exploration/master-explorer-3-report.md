# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
Testing Infrastructure Architecture

## Vision Summary
Transform Mirror of Dreams testing infrastructure from a state with 12 unhandled promise rejections and no component/E2E tests to a comprehensive testing suite that blocks CI deployments on failure.

---

## Requirements Analysis

### Scope Assessment
- **Total testing features identified:** 4 major features (Fix unhandled rejections, CI blocking, E2E tests, component tests)
- **User stories/acceptance criteria:** 16 specific criteria from vision
- **Estimated total work:** 10-14 hours for testing iteration

### Complexity Rating
**Overall Complexity: MEDIUM**

**Rationale:**
- Unhandled promise rejection issue is well-understood (specific test files, specific cause pattern)
- Playwright setup for Next.js 14 is well-documented with official support
- Component testing infrastructure exists (Vitest + happy-dom configured)
- CI workflow modification is straightforward (remove `continue-on-error: true`)

---

## Current Testing Infrastructure Analysis

### Existing Test Stack

**Configuration Files:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` - Vitest with v8 coverage, happy-dom environment
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` - Environment setup with mock env vars

**Current Test Count:** 586 tests passing
- `lib/utils/__tests__/*.test.ts` - 3 test files (limits, retry, anthropic-retry)
- `server/**/__tests__/*.test.ts` - 8 test files (middleware, auth-security, cost-calculator, etc.)
- `test/integration/**/*.test.ts` - 6 integration test files (auth, dreams, users, reflections)
- `types/__tests__/schemas.test.ts` - Schema validation tests

**Test Infrastructure:**
- Provider: Vitest 2.1.x
- Environment: happy-dom (fast DOM simulation)
- Coverage: v8 provider with text/json/html reporters
- Path aliases: @/, @/components, @/lib, @/types, @/server, @/test

---

## Unhandled Promise Rejection Analysis

### Root Cause Identification

**Source Files:**
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts` - 7 rejections
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/anthropic-retry.test.ts` - 5 rejections

**Pattern Identified:**
The unhandled rejections occur when tests mock functions that return rejected promises but the test advances timers before the promise is handled. Specifically:

```typescript
// PROBLEMATIC PATTERN (in retry.test.ts and anthropic-retry.test.ts)
const fn = vi.fn().mockRejectedValue(error);
const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

// Timer advances trigger internal promise rejections before test handles them
await vi.advanceTimersByTimeAsync(1000);

// By now, intermediate rejections have already fired unhandled
await expect(resultPromise).rejects.toEqual(error);
```

**Specific Tests Causing Issues:**
1. `throws after max retries exceeded` - retry.test.ts
2. `respects custom maxRetries value` - retry.test.ts
3. `applies exponential backoff (delays increase)` - retry.test.ts
4. `respects maxDelayMs cap` - retry.test.ts
5. `adds randomness to delays when jitter factor > 0` - retry.test.ts
6. `does not add jitter when jitter factor is 0` - retry.test.ts
7. `calls onRetry callback on each retry` - retry.test.ts
8. `stops retrying when max retries exceeded` - anthropic-retry.test.ts
9. `transitions from retryable to non-retryable error` - anthropic-retry.test.ts
10. `applies exponential backoff to rate limit errors` - anthropic-retry.test.ts
11. `handles complete API outage` - anthropic-retry.test.ts
12. Additional rejection from test/mocks/anthropic.ts loading

**Fix Strategy:**
1. Add `onUnhandledRejection: 'ignore'` to vitest.config.ts for these specific test files, OR
2. Refactor tests to use proper promise handling with `try/finally` blocks
3. Ensure all mock rejections are caught before timer advancement

**Recommended Fix (Option 2 - Proper Fix):**
```typescript
// FIXED PATTERN
const fn = vi.fn().mockRejectedValue(error);

// Wrap in try-finally to ensure promise is awaited
let resultPromise: Promise<any> | null = null;
try {
  resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
  await vi.advanceTimersByTimeAsync(1000);
  await resultPromise;
} catch (e) {
  // Expected rejection - verify it
  expect(e).toEqual(error);
}
```

---

## CI/CD Workflow Analysis

### Current State

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml`

**Problem at Line 60:**
```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  continue-on-error: true  # <-- THIS ALLOWS FAILING TESTS TO PASS CI
```

**Current Pipeline Structure:**
1. `quality` job: typecheck, lint, format:check (required)
2. `test` job: test:coverage (NOT required due to continue-on-error)
3. `build` job: depends on both quality and test (but test always "passes")

**Impact:** Failing tests do not block deployment to Vercel.

### Recommended CI Configuration

```yaml
test:
  name: Tests
  runs-on: ubuntu-latest
  needs: quality

  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests with coverage
      run: npm run test:coverage
      # REMOVED: continue-on-error: true

    - name: Check coverage threshold
      run: |
        # Extract coverage percentage and fail if below threshold
        npm run test:coverage -- --reporter=json-summary
        # Add coverage threshold check script

    - name: Run security audit
      run: npm audit --audit-level=moderate
      continue-on-error: true  # Advisory only

    - name: Upload coverage report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: coverage-report
        path: coverage/
        retention-days: 7
```

---

## Playwright E2E Testing Strategy

### Setup Requirements

**Installation:**
```bash
npm install -D @playwright/test playwright
npx playwright install --with-deps chromium
```

**Configuration File:** `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Test Database Strategy

**Options Analyzed:**

1. **In-Memory SQLite (Not Recommended)**
   - Pros: Fast, isolated
   - Cons: Supabase client won't work with SQLite

2. **Supabase Test Instance (Recommended for Production)**
   - Pros: Real database behavior, same API
   - Cons: Requires separate project setup, slower

3. **Mocked Supabase with Fixtures (Recommended for MVP)**
   - Pros: Fast, deterministic, no external dependencies
   - Cons: May miss integration bugs

**Recommended Approach:**
Use mocked Supabase with fixtures for CI (fast, deterministic), with optional real Supabase testing locally.

```typescript
// e2e/fixtures/test-database.ts
export const testUsers = {
  freeUser: {
    id: 'e2e-free-user',
    email: 'e2e-free@test.com',
    tier: 'free',
  },
  proUser: {
    id: 'e2e-pro-user',
    email: 'e2e-pro@test.com',
    tier: 'pro',
  },
};
```

### Critical E2E Test Cases

**Test 1: Authentication Flow**
```
/e2e/auth.spec.ts
- Navigate to signup page
- Fill registration form
- Submit and verify redirect to dashboard
- Logout and verify redirect to landing
```

**Test 2: Dream Creation**
```
/e2e/dreams.spec.ts
- Login as test user
- Click "New Dream" button
- Fill dream form (name, category, description)
- Submit and verify dream appears in list
```

**Test 3: Reflection Flow**
```
/e2e/reflections.spec.ts
- Login with dream user
- Navigate to reflection page
- Select dream, answer questions
- Select tone
- Submit and wait for AI response
- Verify reflection saved
```

**Test 4: Upgrade Flow (Mocked PayPal)**
```
/e2e/subscription.spec.ts
- Login as free user
- Navigate to pricing
- Select Pro plan
- Mock PayPal approval
- Verify tier update
```

---

## Component Testing Strategy

### Missing Test Library

**Current State:** @testing-library/react is NOT installed (only mentioned in vision.md)

**Required Installation:**
```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**Vitest Setup Addition:**
```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

### Target Components for Testing

**1. ReflectionQuestionCard** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ReflectionQuestionCard.tsx`)
- Lines: 64
- Props: questionNumber, totalQuestions, questionText, guidingText, placeholder, value, onChange, maxLength
- Test Cases:
  - Renders question number and text correctly
  - Calls onChange when user types
  - Shows guiding text
  - Respects maxLength prop

**2. ToneSelection** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ToneSelection.tsx`)
- Lines: 97
- Props: selectedTone, onSelect, disabled
- Test Cases:
  - Renders all three tone options (gentle, intense, fusion)
  - Shows selected state with ring-2 styling
  - Calls onSelect with tone ID on click
  - Keyboard navigation (Enter/Space)
  - ARIA attributes (radiogroup, aria-live)
  - Disabled state prevents selection

**3. GlassInput** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassInput.tsx`)
- Lines: 245
- Complex component with:
  - Text input and textarea variants
  - Password toggle
  - Character/word counter
  - Error/success states
  - Focus animations
- Test Cases:
  - Renders as input or textarea based on variant
  - Password toggle shows/hides password
  - Character counter updates on input
  - Word counter with custom formatting
  - Error message displays
  - Success checkmark displays
  - Focus styling applies
  - Required field asterisk

**4. DashboardCard** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/DashboardCard.tsx`)
- Lines: 198
- Props: children, className, isLoading, hasError, onClick, variant, animated, hoverable, breathing
- Test Cases:
  - Renders children
  - Loading overlay displays
  - Error overlay displays
  - Click handler fires
  - Hover state applies classes
  - Variant classes (default, premium, creator)
  - Ripple effect on click

### Component Test Example

```typescript
// components/reflection/__tests__/ToneSelection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ToneSelection from '../ToneSelection';

describe('ToneSelection', () => {
  it('renders all three tone options', () => {
    const onSelect = vi.fn();
    render(<ToneSelection selectedTone="gentle" onSelect={onSelect} />);

    expect(screen.getByText('Gentle')).toBeInTheDocument();
    expect(screen.getByText('Intense')).toBeInTheDocument();
    expect(screen.getByText('Fusion')).toBeInTheDocument();
  });

  it('calls onSelect when tone clicked', () => {
    const onSelect = vi.fn();
    render(<ToneSelection selectedTone="gentle" onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Intense'));
    expect(onSelect).toHaveBeenCalledWith('intense');
  });

  it('shows sparkle indicator for selected tone', () => {
    const onSelect = vi.fn();
    render(<ToneSelection selectedTone="fusion" onSelect={onSelect} />);

    // The sparkle appears only for selected tone
    const sparkles = screen.getAllByText('sparkles');
    expect(sparkles).toHaveLength(1);
  });

  it('prevents selection when disabled', () => {
    const onSelect = vi.fn();
    render(<ToneSelection selectedTone="gentle" onSelect={onSelect} disabled />);

    fireEvent.click(screen.getByText('Intense'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

---

## Coverage Analysis

### Current Coverage Summary

| Category | Coverage |
|----------|----------|
| lib/utils | 50-100% |
| server/lib | 58% avg |
| server/trpc | 25% avg |
| server/trpc/routers | 27% avg |
| types | 69% avg |

**Low Coverage Areas:**
- `server/trpc/routers/clarify.ts` - 16%
- `server/trpc/routers/evolution.ts` - 6.47%
- `server/trpc/routers/reflection.ts` - 5.98%
- `server/trpc/routers/lifecycle.ts` - 14.37%
- `server/trpc/routers/visualizations.ts` - 9.31%

**High Coverage Areas:**
- `lib/utils/limits.ts` - 100%
- `lib/utils/retry.ts` - 98.31%
- `server/lib/cost-calculator.ts` - 100%
- `types/schemas.ts` - 100%

### Coverage Threshold Recommendation

**Recommended Thresholds for CI:**
```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  thresholds: {
    global: {
      statements: 70,
      branches: 60,
      functions: 60,
      lines: 70,
    },
  },
}
```

---

## Dependency Graph

```
Fix Unhandled Rejections (Phase 1)
|-- Update retry.test.ts
|-- Update anthropic-retry.test.ts
|-- Verify clean test output
    |
    v
CI Test Blocking (Phase 2)
|-- Remove continue-on-error
|-- Add coverage threshold
|-- Add npm audit
    |
    v
Component Testing Setup (Phase 3A)
|-- Install @testing-library/react
|-- Update vitest.setup.ts
|-- Create component test files
    |
    v
Playwright E2E Setup (Phase 3B) [parallel with 3A]
|-- Install playwright
|-- Create playwright.config.ts
|-- Create e2e/ directory
|-- Create auth flow test
|-- Create dream flow test
|-- Create reflection flow test
    |
    v
CI Integration (Phase 4)
|-- Add Playwright to CI workflow
|-- Configure test database fixtures
|-- Run full test suite
```

---

## Risk Assessment

### Medium Risks

- **Timer/Promise Interaction in Tests:** The fake timer pattern in retry tests creates timing issues. Proper promise handling patterns must be followed.
  - **Impact:** Flaky tests, false positives
  - **Mitigation:** Use established patterns from Vitest documentation for async testing with fake timers

- **E2E Test Flakiness:** E2E tests are inherently more flaky due to network, timing, animations
  - **Impact:** CI may fail randomly
  - **Mitigation:** Add retries (2 in CI), use `waitFor` patterns, disable animations in test mode

### Low Risks

- **Coverage Threshold Breaking CI:** Setting threshold too high initially may break CI
  - **Impact:** Blocked deployments
  - **Mitigation:** Start at 70% statements (current is higher), increase gradually

- **Test Database Strategy:** Mocked approach may miss real integration bugs
  - **Impact:** Production bugs not caught in tests
  - **Mitigation:** Run periodic manual tests against real Supabase

---

## Integration Considerations

### Cross-Phase Integration Points

- **Vitest Configuration:** Shared by unit and component tests; E2E uses separate Playwright config
- **CI Workflow:** Single file manages all test types; must coordinate job dependencies
- **Test Utilities:** `test/integration/setup.ts` can be extended for component tests

### Potential Integration Challenges

- **Port Conflicts:** Playwright webServer needs port 3000; ensure no conflicts with dev server
- **Parallel Test Execution:** Component tests can run parallel; E2E should be sequential
- **Mock Consistency:** Supabase mocks in integration tests should match component test mocks

---

## Recommendations for Master Plan

1. **Fix Unhandled Rejections First**
   - This is a prerequisite for meaningful CI blocking
   - Estimated: 2 hours
   - Low risk, high confidence fix

2. **Enable CI Blocking Before Adding New Tests**
   - Establishes quality gate before expanding test suite
   - Ensures new tests matter
   - Estimated: 1 hour

3. **Parallel Track Component and E2E Setup**
   - These are independent and can be done simultaneously by different builders
   - Component tests: 4-5 hours (10 files target)
   - E2E tests: 4-5 hours (4 flows target)

4. **Consider Test Database Strategy Early**
   - Mocked approach is faster for MVP
   - Real Supabase testing can be added later as enhancement

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Vitest 2.1.x, happy-dom, v8 coverage
- **Patterns observed:** Integration tests use `createTestCaller` pattern with mocked Supabase
- **Opportunities:** Add @testing-library/react, Playwright
- **Constraints:** Must maintain happy-dom (used for DOM testing without browser)

### Package Additions

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

---

## Notes & Observations

- The codebase has 76 React components (found via glob), but 0 component tests currently
- Integration tests are well-structured with proper mocking patterns
- The existing `test/mocks/anthropic.ts` file is comprehensive and can be extended for component tests
- Coverage reports show clear gaps in AI-related routers (clarify, evolution, reflection) - these are hard to unit test due to streaming responses

---

*Exploration completed: 2025-12-10*
*This report informs master planning decisions for Testing Infrastructure iteration*
