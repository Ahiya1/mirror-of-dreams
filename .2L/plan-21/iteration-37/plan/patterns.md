# Code Patterns & Conventions

## File Structure

```
{project-root}/
  lib/
    utils/
      __tests__/
        retry.test.ts           # Unit tests for retry utility
        anthropic-retry.test.ts # Anthropic-specific retry tests
      retry.ts                  # Retry utility implementation
  e2e/
    fixtures/
      auth.fixture.ts           # Authentication test fixture
    pages/
      signin.page.ts            # Sign in page object model
      signup.page.ts            # Sign up page object model
    auth/
      signin.spec.ts            # Sign in E2E tests
      signup.spec.ts            # Sign up E2E tests
  test/
    fixtures/                   # Existing test data fixtures
    mocks/                      # Existing mock implementations
  .github/
    workflows/
      ci.yml                    # CI/CD workflow
  playwright.config.ts          # Playwright configuration
  vitest.config.ts              # Vitest configuration
```

## Naming Conventions

- E2E Tests: `*.spec.ts` (in e2e/ directory)
- Unit Tests: `*.test.ts` (in __tests__/ directories)
- Page Objects: `*.page.ts`
- Fixtures: `*.fixture.ts`

---

## Testing Patterns

### CRITICAL: Async Rejection Pattern with Fake Timers

**The Problem:**
When using `vi.useFakeTimers()`, promises that reject during timer advancement cause unhandled rejection errors if `expect().rejects` is attached AFTER the rejection occurs.

**WRONG Pattern (causes unhandled rejection):**
```typescript
it('throws after max retries exceeded', async () => {
  const error = { status: 429, message: 'Rate limited' };
  const fn = vi.fn().mockRejectedValue(error);

  const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

  // PROBLEM: Promise rejects during timer advancement
  await vi.advanceTimersByTimeAsync(1000);

  // TOO LATE: Rejection already happened without a handler
  await expect(resultPromise).rejects.toEqual(error);
  expect(fn).toHaveBeenCalledTimes(4);
});
```

**CORRECT Pattern (attach handler BEFORE advancing timers):**
```typescript
it('throws after max retries exceeded', async () => {
  const error = { status: 429, message: 'Rate limited' };
  const fn = vi.fn().mockRejectedValue(error);

  const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

  // CORRECT: Attach rejection handler FIRST
  const assertion = expect(resultPromise).rejects.toEqual(error);

  // THEN advance timers
  await vi.advanceTimersByTimeAsync(1000);

  // Wait for the assertion to complete
  await assertion;
  expect(fn).toHaveBeenCalledTimes(4);
});
```

**Key Points:**
- `expect(promise).rejects` returns a new promise that tracks the rejection
- By calling it before advancing timers, the handler is attached before rejection
- The `assertion` variable holds this tracking promise
- Await the assertion AFTER advancing timers

### Test File Structure for Async Tests

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('AsyncFunctionWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Success case - no special handling needed
  it('succeeds on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
  });

  // Success after retry - timer advancement is safe
  it('succeeds after retry', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValue('success');

    const resultPromise = withRetry(fn, { baseDelayMs: 100 });

    // Safe: Promise will resolve, not reject
    await vi.advanceTimersByTimeAsync(200);

    const result = await resultPromise;
    expect(result).toBe('success');
  });

  // Rejection case - MUST attach handler BEFORE timer advancement
  it('fails after max retries', async () => {
    const error = { status: 429, message: 'Rate limited' };
    const fn = vi.fn().mockRejectedValue(error);

    const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

    // CRITICAL: Attach handler BEFORE advancing timers
    const assertion = expect(resultPromise).rejects.toEqual(error);

    await vi.advanceTimersByTimeAsync(1000);

    await assertion;
    expect(fn).toHaveBeenCalledTimes(4);
  });
});
```

### Mocking Strategies

```typescript
// Mock console methods to suppress output
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Restore in afterEach
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock Math.random for deterministic jitter testing
const mockRandom = vi.spyOn(Math, 'random');
mockRandom.mockReturnValueOnce(0.5).mockReturnValueOnce(0.3);

// Don't forget to restore
mockRandom.mockRestore();
```

### Coverage Expectations by Module Type

| Module Type | Minimum Coverage | Target Coverage |
|-------------|------------------|-----------------|
| Utils/Helpers | 90% | 95% |
| API Routes | 80% | 90% |
| Services | 85% | 90% |
| Components | 70% | 80% |
| Hooks | 75% | 85% |

### Test Data Factories (Existing)

Located in `/test/mocks/anthropic.ts`:

```typescript
import {
  anthropicErrors,
  createAnthropicError,
  createMockMessageResponse,
} from '@/test/mocks/anthropic';

// Use pre-defined error objects
anthropicErrors.rateLimited  // 429 rate limit error
anthropicErrors.serverError  // 500 internal server error
anthropicErrors.overloaded   // 529 overloaded error
anthropicErrors.unauthorized // 401 auth error
anthropicErrors.invalidRequest // 400 bad request

// Create custom errors
const error = createAnthropicError('Custom message', 'api_error', 503);

// Create mock API responses
const response = createMockMessageResponse({
  content: [{ type: 'text', text: 'Custom response' }],
});
```

---

## E2E Testing Patterns

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Page Object Pattern

```typescript
// e2e/pages/signin.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class SignInPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#signin-email');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.status-box-error');
    this.signupLink = page.locator('a[href="/auth/signup"]');
  }

  async goto() {
    await this.page.goto('/auth/signin');
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async signin(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL('/dashboard');
  }
}
```

### E2E Test Spec Pattern

```typescript
// e2e/auth/signin.spec.ts
import { test, expect } from '@playwright/test';
import { SignInPage } from '../pages/signin.page';

test.describe('Sign In Flow', () => {
  let signinPage: SignInPage;

  test.beforeEach(async ({ page }) => {
    signinPage = new SignInPage(page);
    await signinPage.goto();
  });

  test('displays signin form elements', async () => {
    await expect(signinPage.emailInput).toBeVisible();
    await expect(signinPage.passwordInput).toBeVisible();
    await expect(signinPage.submitButton).toBeVisible();
  });

  test('shows error for invalid credentials', async () => {
    await signinPage.signin('invalid@email.com', 'wrongpassword');
    await signinPage.expectError('Invalid email or password');
  });

  test('navigates to signup page', async ({ page }) => {
    await signinPage.signupLink.click();
    await page.waitForURL('/auth/signup');
  });
});
```

### Authentication Fixture Pattern

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, expect } from '@playwright/test';

// Demo user credentials (uses app's demo login feature)
export const DEMO_USER = {
  // Demo login doesn't require credentials - it's a special flow
};

// Fixture that provides authenticated page context
export const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to signin page
    await page.goto('/auth/signin');

    // Click the demo login button (existing app feature)
    await page.click('button:has-text("Try Demo")');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Verify authenticated state
    await expect(page.locator('text=Welcome')).toBeVisible();

    await use(page);
  },
});

export { expect };
```

### E2E Wait Patterns

```typescript
// Wait for element to be visible
await expect(page.locator('.element')).toBeVisible();

// Wait for URL navigation
await page.waitForURL('/expected-path');

// Wait for network idle (useful after form submissions)
await page.waitForLoadState('networkidle');

// Wait with timeout
await expect(page.locator('.slow-element')).toBeVisible({ timeout: 10000 });

// Wait for element to disappear
await expect(page.locator('.loading')).not.toBeVisible();
```

---

## CI/CD Patterns

### Remove continue-on-error (CRITICAL FIX)

**Before (WRONG):**
```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  continue-on-error: true  # REMOVE THIS LINE
```

**After (CORRECT):**
```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  # Tests must pass for CI to succeed
```

### E2E Job in CI Workflow

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  needs: [quality, test]

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

    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium

    - name: Run E2E Tests
      run: npm run test:e2e -- --project=chromium
      env:
        CI: true

    - name: Upload Playwright Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

### Coverage Thresholds in Vitest Config

```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts'],
  exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
  thresholds: {
    statements: 70,
    branches: 65,
    functions: 70,
    lines: 70,
  },
},
```

---

## Error Handling Patterns

### Proper Rejection Handling in Async Functions

```typescript
// When testing functions that may reject
async function testRejection() {
  const promise = asyncFunctionThatMayReject();

  // Option 1: expect().rejects (preferred)
  await expect(promise).rejects.toThrow('Expected error');

  // Option 2: try-catch (for more complex assertions)
  try {
    await promise;
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error).toHaveProperty('status', 500);
  }
}
```

### Logging in Tests

```typescript
// Suppress logging during tests
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// If you need to capture logs for assertions
it('logs retry attempts', async () => {
  const consoleSpy = vi.spyOn(console, 'warn');

  // ... test code ...

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('[operation]'),
    expect.any(String)
  );
});
```

---

## Security Patterns

### Test Credentials

```typescript
// NEVER use real credentials in tests
// Use demo login flow for authenticated E2E tests
// Use unique emails for signup tests

// BAD - hardcoded real credentials
const USER = { email: 'real@user.com', password: 'real-password' };

// GOOD - unique test emails
const uniqueEmail = `e2e-test-${Date.now()}@test.local`;

// GOOD - use demo login (no credentials needed)
await page.click('button:has-text("Try Demo")');
```

### Environment Variable Usage

```typescript
// Always check for required env vars
const requiredEnvVars = ['SUPABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

---

## Import Order Convention

```typescript
// 1. Node.js built-ins (if any)
import path from 'path';

// 2. External packages
import { test, expect } from '@playwright/test';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

// 3. Internal modules (absolute imports with @/)
import { withRetry, isRetryableError } from '@/lib/utils/retry';
import { anthropicErrors } from '@/test/mocks/anthropic';

// 4. Relative imports
import { SignInPage } from '../pages/signin.page';
```

---

## Code Quality Standards

### Test Isolation
- Each test should be independent
- Use beforeEach/afterEach for setup/teardown
- Never rely on test execution order

### Deterministic Tests
- Mock Math.random for jitter tests
- Use fake timers for time-dependent tests
- Avoid network calls in unit tests

### Clear Assertions
- One logical assertion per test (may include multiple expect calls)
- Use descriptive test names
- Include expected values in error messages

### Cleanup
- Always restore mocks in afterEach
- Always reset timers after fake timer tests
- Clean up any created resources
