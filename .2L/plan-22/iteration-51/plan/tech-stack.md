# Technology Stack - E2E Test Expansion

## Core Framework

**Decision:** Playwright Test (`@playwright/test@^1.49.0`)

**Rationale:**
- Already configured and working in the project
- Excellent Page Object Model support
- Built-in device emulation for mobile testing
- Parallel execution with `fullyParallel: true`
- Automatic retries in CI (2 retries configured)

**Existing Configuration:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts`

## Browser Matrix

| Browser | CI | Local | Device Preset |
|---------|-----|-------|---------------|
| Chromium | Yes | Yes | `Desktop Chrome` |
| Firefox | No | Yes | `Desktop Firefox` |
| Mobile Safari | No | Yes | `iPhone 13` |

**Rationale:** CI uses Chromium-only for speed; local development tests across browsers.

## Test Configuration

**Timeouts (from existing config):**
- Test timeout: 60 seconds
- Action timeout: 15 seconds
- Navigation timeout: 30 seconds
- Expect timeout: 10 seconds

**Execution:**
- Parallel execution enabled (`fullyParallel: true`)
- CI: 1 worker for reliability
- Local: Auto-detected workers

**Artifacts:**
- Screenshots on failure only
- Video on first retry
- Trace on first retry
- HTML + list reporters

## Authentication Strategy

**Decision:** Use existing `authenticatedPage` fixture for all authenticated tests

**Rationale:**
- Demo login pattern already implemented and tested
- Fixture handles errors gracefully
- Consistent authentication across all test files

**Implementation:**
```typescript
// All authenticated tests use this import
import { test, expect } from '../fixtures/auth.fixture';

test('authenticated test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // Page is already logged in via demo
});
```

## Page Object Model Pattern

**Decision:** Extend existing POM structure with new page classes

**Existing Examples:**
- `e2e/pages/signin.page.ts` - SignInPage class
- `e2e/pages/signup.page.ts` - SignUpPage class

**Pattern Structure:**
```typescript
// Each page object follows this structure:
export class PageName {
  readonly page: Page;

  // Locators as class properties
  readonly element: Locator;

  constructor(page: Page) {
    this.page = page;
    this.element = page.locator('selector');
  }

  // Navigation methods
  async goto(): Promise<void> {}

  // Action methods
  async clickButton(): Promise<void> {}

  // Assertion methods (prefixed with 'expect')
  async expectElementVisible(): Promise<void> {}
}
```

## Mobile Testing Strategy

**Decision:** Use Playwright's device emulation within `test.describe` blocks

**Rationale:**
- Consistent viewport across test runs
- Realistic device emulation (touch events, etc.)
- Same test file can cover desktop and mobile

**Implementation:**
```typescript
import { devices } from '@playwright/test';

test.describe('Mobile Dashboard', () => {
  test.use({ ...devices['iPhone 13'] });

  test('displays mobile navigation', async ({ page }) => {
    // Mobile-specific assertions
  });
});
```

## Wait Strategies

**Decision:** Explicit waits only - no `waitForTimeout`

**Approved Wait Methods:**
1. `await page.waitForSelector('[data-testid="element"]')`
2. `await expect(locator).toBeVisible({ timeout: 10000 })`
3. `await page.waitForURL('/expected-path')`
4. `await page.waitForLoadState('networkidle')`

**Forbidden:**
- `await page.waitForTimeout(2000)` - Never use arbitrary delays

## Selector Priority

**Decision:** Prioritize stable selectors in this order:

1. `data-testid` attributes (most stable)
2. Semantic HTML selectors (`button[type="submit"]`)
3. ARIA attributes (`[aria-label="Close"]`)
4. CSS classes (when stable, e.g., `.dashboard-card`)
5. Text content (last resort, via `.filter({ hasText: })`)

## Test Data Management

**Decision:** Create shared test constants in `e2e/fixtures/test-data.fixture.ts`

**Rationale:**
- Consistent test data across all test files
- Easy to update test values
- Unique identifiers prevent conflicts

## Test Organization

**Decision:** One spec file per major feature area

| Feature | Spec File | Approximate Tests |
|---------|-----------|-------------------|
| Dashboard | `dashboard/dashboard.spec.ts` | ~15 |
| Dreams | `dreams/dreams.spec.ts` | ~15 |
| Reflection | `reflection/reflection.spec.ts` | ~20 |
| Landing | `landing/landing.spec.ts` | ~12 |

**Rationale:** Easier to maintain, clearer organization, better parallelization.

## Test Grouping Convention

**Decision:** Use `test.describe` blocks for logical grouping

```typescript
test.describe('Feature Name', () => {
  test.describe('Page Display', () => {
    // Visibility tests
  });

  test.describe('Navigation', () => {
    // Navigation tests
  });

  test.describe('Interaction', () => {
    // User interaction tests
  });

  test.describe('Mobile', () => {
    test.use({ ...devices['iPhone 13'] });
    // Mobile-specific tests
  });
});
```

## Dependencies

**Existing (no new dependencies needed):**
- `@playwright/test@^1.49.0` - Test framework
- Playwright browsers via `npx playwright install`

## Performance Considerations

- Tests run in parallel locally
- Single worker in CI for reliability
- Screenshots/video only on failure
- Reuse existing dev server (no restart per test)
