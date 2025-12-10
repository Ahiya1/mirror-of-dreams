# Builder Task Breakdown

## Overview

2 primary builders will work in parallel.
No splitting expected - both tasks are MEDIUM complexity.

## Builder Assignment Strategy

- Builder-1 focuses on unit test fixes and CI hardening
- Builder-2 focuses on Playwright E2E infrastructure
- Builders work on isolated features with minimal overlap
- Integration required for shared files (package.json, ci.yml, .gitignore)

---

## Builder-1: Unit Test Fixes & CI Hardening

### Scope

Fix all 12 unhandled promise rejection errors in retry test files and harden CI configuration to properly fail on test failures. Add coverage thresholds to ensure code quality.

### Complexity Estimate

**MEDIUM**

This task involves well-defined, repetitive fixes following a single pattern. No architectural decisions required.

### Success Criteria

- [ ] Zero unhandled promise rejections when running `npm run test:run`
- [ ] All 8 tests in retry.test.ts fixed with proper async pattern
- [ ] All 4 tests in anthropic-retry.test.ts fixed with proper async pattern
- [ ] `continue-on-error: true` removed from CI workflow (line 60)
- [ ] Coverage thresholds added to vitest.config.ts
- [ ] All tests pass: `npm run test:run` exits with code 0

### Files to Modify

| File | Changes |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts` | Fix 8 tests with async rejection pattern |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/anthropic-retry.test.ts` | Fix 4 tests with async rejection pattern |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml` | Remove continue-on-error on line 60 |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` | Add coverage thresholds |

### Dependencies

**Depends on:** Nothing (can start immediately)
**Blocks:** CI must pass before Builder-2's E2E tests can run in CI

### Implementation Notes

#### Fix Pattern for Each Test

The fix is identical for all 12 tests. For each test that causes an unhandled rejection:

1. Find the line where `expect(resultPromise).rejects` is called
2. Move it BEFORE `vi.advanceTimersByTimeAsync()`
3. Store the assertion in a variable
4. Await the assertion AFTER timer advancement

**Example transformation:**

```typescript
// BEFORE (line ~236-248 in retry.test.ts)
it('throws after max retries exceeded', async () => {
  const error = { status: 429, message: 'Rate limited' };
  const fn = vi.fn().mockRejectedValue(error);

  const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

  await vi.advanceTimersByTimeAsync(1000);

  await expect(resultPromise).rejects.toEqual(error);
  expect(fn).toHaveBeenCalledTimes(4);
});

// AFTER
it('throws after max retries exceeded', async () => {
  const error = { status: 429, message: 'Rate limited' };
  const fn = vi.fn().mockRejectedValue(error);

  const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

  // Attach rejection handler BEFORE advancing timers
  const assertion = expect(resultPromise).rejects.toEqual(error);

  await vi.advanceTimersByTimeAsync(1000);

  await assertion;
  expect(fn).toHaveBeenCalledTimes(4);
});
```

#### Tests to Fix in retry.test.ts

1. **Line 236-248:** `throws after max retries exceeded`
2. **Line 250-261:** `respects custom maxRetries value`
3. **Line 277-301:** `applies exponential backoff (delays increase)`
4. **Line 303-327:** `respects maxDelayMs cap`
5. **Line 335-366:** `adds randomness to delays when jitter factor > 0`
6. **Line 368-390:** `does not add jitter when jitter factor is 0`
7. **Line 440-460:** `calls onRetry callback on each retry`
8. **Line 832-844:** `throws after 3 retries (maxRetries default)`

#### Tests to Fix in anthropic-retry.test.ts

1. **Line 270-281:** `stops retrying when max retries exceeded`
2. **Line 283-298:** `transitions from retryable to non-retryable error`
3. **Line 302-322:** `applies exponential backoff to rate limit errors`
4. **Line 382-397:** `handles complete API outage`

#### CI Workflow Fix

Remove line 60 in `.github/workflows/ci.yml`:

```yaml
# REMOVE THIS LINE:
continue-on-error: true
```

#### Coverage Thresholds

Add to vitest.config.ts coverage section:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts'],
  exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
  // ADD THIS:
  thresholds: {
    statements: 70,
    branches: 65,
    functions: 70,
    lines: 70,
  },
},
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "CRITICAL: Async Rejection Pattern with Fake Timers" for all test fixes
- Follow "Coverage Thresholds in Vitest Config" for vitest.config.ts

### Testing Requirements

- Run `npm run test:run` after each file fix to verify
- Run `npm run test:run 2>&1 | grep -i "unhandled"` to check for remaining issues
- Verify coverage thresholds with `npm run test:coverage`

### Verification Commands

```bash
# After fixing retry.test.ts
npm run test:run -- lib/utils/__tests__/retry.test.ts

# After fixing anthropic-retry.test.ts
npm run test:run -- lib/utils/__tests__/anthropic-retry.test.ts

# Full test suite
npm run test:run

# Check for unhandled rejections
npm run test:run 2>&1 | grep -i "unhandled"

# Verify coverage thresholds
npm run test:coverage
```

---

## Builder-2: Playwright E2E Infrastructure

### Scope

Set up complete Playwright E2E testing infrastructure including configuration, page objects, and initial test specs for authentication flows.

### Complexity Estimate

**MEDIUM**

This task involves creating new files following established Playwright patterns. The structure is well-defined in exploration reports.

### Success Criteria

- [ ] @playwright/test installed as dev dependency
- [ ] E2E npm scripts added to package.json
- [ ] playwright.config.ts created with proper configuration
- [ ] e2e/ directory structure created
- [ ] Page objects created for signin and signup pages
- [ ] At least 5 E2E tests passing for signin flow
- [ ] At least 5 E2E tests passing for signup flow
- [ ] E2E job added to CI workflow
- [ ] Playwright artifacts added to .gitignore
- [ ] `npm run test:e2e` runs successfully

### Files to Create

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts` | Playwright configuration |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/auth.fixture.ts` | Authentication fixture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/pages/signin.page.ts` | Sign in page object |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/pages/signup.page.ts` | Sign up page object |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/auth/signin.spec.ts` | Sign in E2E tests |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/auth/signup.spec.ts` | Sign up E2E tests |

### Files to Modify

| File | Changes |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/package.json` | Add @playwright/test, E2E scripts |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml` | Add E2E job |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.gitignore` | Add Playwright artifacts |

### Dependencies

**Depends on:** Builder-1 should fix tests first so CI doesn't fail
**Blocks:** Nothing

### Implementation Notes

#### 1. Install Playwright

Add to devDependencies in package.json:
```json
"@playwright/test": "^1.40.0"
```

After package.json update, run:
```bash
npm install
npx playwright install chromium
```

#### 2. Add npm Scripts

Add to package.json scripts:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed",
"test:e2e:debug": "playwright test --debug"
```

#### 3. Create Playwright Config

See patterns.md for full configuration. Key settings:
- testDir: './e2e'
- fullyParallel: true
- retries: 2 (in CI)
- workers: 1 (in CI)
- webServer: starts dev server automatically

#### 4. Create Page Objects

Follow Page Object Pattern from patterns.md. Key locators based on exploration:
- Signin: `#signin-email`, `input[type="password"]`, `button[type="submit"]`
- Signup: `#name`, `#email`, `#password`, `#confirmPassword`
- Error messages: `.status-box-error`

#### 5. Create Test Specs

**signin.spec.ts tests:**
1. displays signin form elements
2. shows error for invalid credentials
3. shows error for empty fields
4. navigates to signup page
5. successful signin with demo (if demo button exists)

**signup.spec.ts tests:**
1. displays signup form elements
2. shows validation errors for empty fields
3. shows password mismatch error
4. shows password length error
5. navigates to signin page

#### 6. Add E2E Job to CI

Add after test job in ci.yml. Key configuration:
- runs-on: ubuntu-latest
- needs: [quality, test]
- Install Chromium only (for speed)
- Upload playwright-report artifact on failure

#### 7. Update .gitignore

Add these entries:
```
# Playwright
/playwright-report/
/playwright/.cache/
/test-results/
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Playwright Configuration" pattern
- Use "Page Object Pattern" for page classes
- Use "E2E Test Spec Pattern" for test files
- Use "E2E Job in CI Workflow" for CI configuration

### Testing Requirements

- Run E2E tests locally: `npm run test:e2e`
- Verify all tests pass in headless mode
- Test in headed mode to debug: `npm run test:e2e:headed`

### Verification Commands

```bash
# Install dependencies
npm install
npx playwright install chromium

# Run E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- e2e/auth/signin.spec.ts
```

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

Both builders can start immediately:

- **Builder-1:** Unit Test Fixes & CI Hardening
- **Builder-2:** Playwright E2E Infrastructure

### Integration Notes

**Shared Files:**
- `package.json` - Builder-1 doesn't modify; Builder-2 adds devDependency and scripts
- `.github/workflows/ci.yml` - Builder-1 removes continue-on-error; Builder-2 adds E2E job
- `.gitignore` - Builder-1 doesn't modify; Builder-2 adds Playwright entries

**Merge Strategy:**
1. Builder-1 completes first (smaller scope)
2. Builder-2 incorporates Builder-1's CI changes when adding E2E job
3. Both changes to ci.yml are in different sections, no conflicts expected

**Verification After Integration:**
```bash
# Run all unit tests
npm run test:run

# Run E2E tests
npm run test:e2e

# Check CI workflow syntax
act -l  # (if act is installed)
```

### Potential Conflict Areas

1. **CI Workflow:** Both modify ci.yml but different sections
   - Builder-1: Removes line 60 (continue-on-error)
   - Builder-2: Adds new e2e job at end
   - Resolution: Sequential merge, no conflict

2. **package.json:** Only Builder-2 modifies
   - No conflict expected

### Post-Integration Checklist

- [ ] All unit tests pass: `npm run test:run`
- [ ] Zero unhandled rejections: `npm run test:run 2>&1 | grep -i "unhandled"`
- [ ] Coverage thresholds pass: `npm run test:coverage`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] CI workflow valid (push to test branch to verify)
