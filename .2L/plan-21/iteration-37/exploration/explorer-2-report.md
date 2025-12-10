# Explorer 2 Report: Playwright E2E Testing Infrastructure

## Executive Summary

This report provides comprehensive guidance for setting up Playwright E2E testing infrastructure for the Mirror of Dreams Next.js 14 application. The project currently uses Vitest for unit testing (with good test fixtures already established), but lacks E2E testing capability. Playwright will fill this gap by enabling end-to-end testing of critical user flows like authentication and reflection creation.

## Discoveries

### Current Testing Infrastructure

- **Unit Testing Framework:** Vitest configured with happy-dom environment
- **Test Location Pattern:** `**/*.test.ts` and `**/*.test.tsx` (unit tests)
- **Existing Fixtures Directory:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/`
  - `users.ts` - Comprehensive user fixture factory (freeTierUser, proTierUser, demoUser, etc.)
  - `reflections.ts` - Reflection data fixtures
  - `dreams.ts` - Dream data fixtures
- **CI Pipeline:** GitHub Actions workflow at `.github/workflows/ci.yml`
- **E2E Tests:** NOT present (no Playwright or e2e directory)

### @playwright/test Installation Status

**NOT INSTALLED** - The `@playwright/test` package is not present in `package.json` (checked both dependencies and devDependencies).

### Application Architecture Relevant to E2E

- **Framework:** Next.js 14 with App Router
- **Auth:** JWT-based with HTTP-only cookies via tRPC (`auth.signin`, `auth.signup`, `auth.loginDemo`)
- **API:** tRPC endpoints at `/api/trpc/[trpc]/route.ts`
- **Database:** Supabase (PostgreSQL) with local development support
- **Key Pages:**
  - `/auth/signin` - Sign in page
  - `/auth/signup` - Sign up page  
  - `/auth/verify-required` - Email verification required page
  - `/dashboard` - Main dashboard (protected)
  - `/reflection` - Create reflection (protected)
  - `/reflections` - View reflections list (protected)
  - `/dreams` - Dreams management (protected)

## Playwright Installation Steps

### 1. Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Add npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Playwright Configuration

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Mirror of Dreams E2E tests
 * 
 * Key considerations:
 * - Uses local Supabase instance for test database
 * - Starts Next.js dev server automatically
 * - Supports both desktop and mobile viewports
 */
export default defineConfig({
  // Look for test files in the e2e directory
  testDir: './e2e',
  
  // Run tests in parallel for speed
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Limit workers on CI to avoid resource issues
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3000',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Take screenshots on failure
    screenshot: 'only-on-failure',
    
    // Video recording on failure
    video: 'on-first-retry',
  },

  // Configure projects for different browsers
  projects: [
    // Setup project - runs before all tests to seed database
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Desktop Chrome - primary testing browser
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
      dependencies: ['setup'],
    },

    // Mobile Safari (for mobile responsive testing)
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
      },
      dependencies: ['setup'],
    },
  ],

  // Start local dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
    env: {
      // Use test environment variables
      NODE_ENV: 'test',
    },
  },
});
```

## Test File Structure

### Directory: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/`

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts      # Authenticated user fixture
│   └── test-data.ts         # Test user credentials
├── pages/
│   ├── signin.page.ts       # Sign in page object
│   ├── signup.page.ts       # Sign up page object
│   ├── dashboard.page.ts    # Dashboard page object
│   └── reflection.page.ts   # Reflection page object
├── auth/
│   ├── signup.spec.ts       # Signup flow tests
│   ├── signin.spec.ts       # Signin flow tests
│   └── logout.spec.ts       # Logout flow tests
├── reflection/
│   ├── create.spec.ts       # Create reflection tests
│   └── view.spec.ts         # View reflection tests
├── global.setup.ts          # Global setup (seed database)
└── global.teardown.ts       # Global teardown (cleanup)
```

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/auth.fixture.ts`

```typescript
import { test as base, expect } from '@playwright/test';

// Test user credentials (will be seeded in database)
export const TEST_USER = {
  email: 'e2e-test@mirror-of-dreams.test',
  password: 'TestPassword123!',
  name: 'E2E Test User',
};

// Fixture that provides authenticated page context
export const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to signin
    await page.goto('/auth/signin');
    
    // Fill in credentials
    await page.fill('#signin-email', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify authenticated state
    await expect(page.locator('.dashboard')).toBeVisible();
    
    await use(page);
  },
});

export { expect };
```

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/pages/signin.page.ts`

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class SignInPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#signin-email');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.status-box-error');
    this.successMessage = page.locator('.status-box-success');
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

  async expectSuccess() {
    await expect(this.successMessage).toContainText('Welcome back');
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL('/dashboard');
  }
}
```

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/auth/signin.spec.ts`

```typescript
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
    await expect(signinPage.signupLink).toBeVisible();
  });

  test('shows error for invalid credentials', async () => {
    await signinPage.signin('invalid@email.com', 'wrongpassword');
    await signinPage.expectError('Invalid email or password');
  });

  test('shows error for empty fields', async ({ page }) => {
    await signinPage.submit();
    await signinPage.expectError('Please enter both email and password');
  });

  test('shows error for invalid email format', async () => {
    await signinPage.signin('not-an-email', 'password123');
    await signinPage.expectError('valid email');
  });

  test('successful signin redirects to dashboard', async () => {
    // Use seeded test user credentials
    await signinPage.signin('e2e-test@mirror-of-dreams.test', 'TestPassword123!');
    await signinPage.expectSuccess();
    await signinPage.expectRedirectToDashboard();
  });

  test('navigates to signup page', async ({ page }) => {
    await signinPage.signupLink.click();
    await page.waitForURL('/auth/signup');
  });
});
```

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/auth/signup.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sign Up Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup');
  });

  test('displays signup form elements', async ({ page }) => {
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('.status-box-error')).toBeVisible();
  });

  test('shows password mismatch error', async ({ page }) => {
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'newuser@test.com');
    await page.fill('#password', 'Password123!');
    await page.fill('#confirmPassword', 'DifferentPassword!');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=do not match')).toBeVisible();
  });

  test('shows password length error', async ({ page }) => {
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'newuser@test.com');
    await page.fill('#password', '12345');
    await page.fill('#confirmPassword', '12345');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=6 characters')).toBeVisible();
  });

  test('successful signup redirects to verify-required', async ({ page }) => {
    const uniqueEmail = `e2e-new-${Date.now()}@test.com`;
    
    await page.fill('#name', 'New Test User');
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'SecurePassword123!');
    await page.fill('#confirmPassword', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to email verification page
    await page.waitForURL('/auth/verify-required');
  });

  test('navigates to signin page', async ({ page }) => {
    await page.click('a[href="/auth/signin"]');
    await page.waitForURL('/auth/signin');
  });
});
```

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/reflection/create.spec.ts`

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Create Reflection Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start from dashboard (fixture handles auth)
    await authenticatedPage.goto('/dashboard');
  });

  test('can navigate to reflection page from dashboard', async ({ authenticatedPage }) => {
    // Click the "New Reflection" or hero CTA button
    await authenticatedPage.click('text=Begin Your Reflection');
    await authenticatedPage.waitForURL('/reflection');
    await expect(authenticatedPage.locator('.reflection-experience')).toBeVisible();
  });

  test('shows dream selection when no dream selected', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reflection');
    
    // Should show dream selection prompt
    await expect(authenticatedPage.locator('text=Which dream are you reflecting on')).toBeVisible();
  });

  test('can select a dream and fill reflection form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reflection');
    
    // Wait for dreams to load and click first dream
    await authenticatedPage.waitForSelector('.dream-selection-list');
    await authenticatedPage.click('.dream-selection-list > div:first-child');
    
    // Should now show the reflection form
    await expect(authenticatedPage.locator('.one-page-form')).toBeVisible();
    
    // Fill in the 4 questions
    const questions = [
      { selector: 'textarea:nth-of-type(1)', text: 'My dream is to create something meaningful' },
      { selector: 'textarea:nth-of-type(2)', text: 'I plan to work on it daily' },
      { selector: 'textarea:nth-of-type(3)', text: 'This dream represents my true self' },
      { selector: 'textarea:nth-of-type(4)', text: 'I offer my time and dedication' },
    ];
    
    for (const q of questions) {
      await authenticatedPage.fill(q.selector, q.text);
    }
    
    // Submit button should be enabled
    await expect(authenticatedPage.locator('text=Gaze into the Mirror')).toBeEnabled();
  });

  test('shows validation errors for empty questions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reflection');
    
    // Select a dream first
    await authenticatedPage.waitForSelector('.dream-selection-list');
    await authenticatedPage.click('.dream-selection-list > div:first-child');
    
    // Try to submit without filling form
    await authenticatedPage.click('text=Gaze into the Mirror');
    
    // Should show validation toast/error
    await expect(authenticatedPage.locator('text=Please elaborate')).toBeVisible();
  });
});
```

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/global.setup.ts`

```typescript
import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Seeds the test database with required test data
 */
async function globalSetup(config: FullConfig) {
  console.log('Setting up E2E test environment...');
  
  // In a real setup, you would:
  // 1. Reset the test database
  // 2. Seed test users with known credentials
  // 3. Create test dreams and reflections
  
  // For now, we rely on the local Supabase instance having demo data
  // or a seeding script being run separately
  
  // Verify the app is running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    console.log('App is running and accessible');
  } catch (error) {
    console.error('App is not running. Please start with: npm run dev');
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('E2E setup complete');
}

export default globalSetup;
```

## Test Database Strategy

### Option 1: Local Supabase Instance (Recommended)

The project already supports local Supabase development. For E2E tests:

1. **Use existing local Supabase**: Tests run against `http://127.0.0.1:54321`
2. **Create test user during setup**: Seed a specific E2E test user
3. **Reset between test runs**: Truncate test data before each suite

### Environment Variables for E2E

Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.env.test`:

```bash
# E2E Test Environment Configuration
NODE_ENV=test

# Use local Supabase (same as development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>

# Test JWT secret (can be different from dev)
JWT_SECRET=e2e-test-jwt-secret-minimum-32-characters-long

# Anthropic - use test/mock key or real key with low limits
ANTHROPIC_API_KEY=sk-ant-api03-test-key

# Disable rate limiting for tests
RATE_LIMIT_ENABLED=false

# App configuration
DOMAIN=http://localhost:3000
PORT=3000
```

### Database Seeding Script

Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/scripts/seed-e2e.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const E2E_TEST_USER = {
  email: 'e2e-test@mirror-of-dreams.test',
  password: 'TestPassword123!',
  name: 'E2E Test User',
};

async function seedE2EDatabase() {
  console.log('Seeding E2E test database...');
  
  // Clean up existing test user
  await supabase
    .from('users')
    .delete()
    .eq('email', E2E_TEST_USER.email);
  
  // Create test user with known credentials
  const passwordHash = await bcrypt.hash(E2E_TEST_USER.password, 12);
  
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: E2E_TEST_USER.email,
      password_hash: passwordHash,
      name: E2E_TEST_USER.name,
      tier: 'free',
      subscription_status: 'active',
      reflection_count_this_month: 0,
      total_reflections: 0,
      current_month_year: new Date().toISOString().slice(0, 7),
      email_verified: true, // Skip email verification for E2E
      is_demo: false,
      is_admin: false,
      is_creator: false,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
  
  // Create a test dream for the user
  await supabase
    .from('dreams')
    .insert({
      user_id: user.id,
      title: 'E2E Test Dream',
      description: 'A dream created for E2E testing',
      category: 'personal_growth',
      priority: 5,
      status: 'active',
    });
  
  console.log('E2E database seeded successfully');
}

seedE2EDatabase().catch(console.error);
```

Add npm script:

```json
{
  "scripts": {
    "seed:e2e": "tsx scripts/seed-e2e.ts"
  }
}
```

## CI Workflow Integration

### Updated `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml`

Add new job after the existing `test` job:

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

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase
        run: |
          supabase start
          # Wait for Supabase to be ready
          sleep 10

      - name: Seed E2E Database
        run: npm run seed:e2e
        env:
          SUPABASE_URL: http://127.0.0.1:54321
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY_LOCAL }}

      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          CI: true
          NODE_ENV: test
          SUPABASE_URL: http://127.0.0.1:54321
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_LOCAL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY_LOCAL }}
          JWT_SECRET: ci-test-jwt-secret-32-chars-minimum
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          RATE_LIMIT_ENABLED: false

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Stop Supabase
        if: always()
        run: supabase stop
```

## Critical User Flows to Test

### 1. Authentication Flow (Priority: HIGH)

```
Signup -> Verify Email Required -> Login -> Dashboard
```

**Tests:**
- Valid signup creates account
- Duplicate email shows error
- Invalid email format validation
- Password strength validation
- Successful login with credentials
- Invalid credentials error
- Session persistence (refresh page)
- Logout clears session

### 2. Reflection Flow (Priority: HIGH)

```
Login -> Create Reflection -> View Reflection
```

**Tests:**
- Can navigate to reflection page
- Dream selection is required
- All 4 questions must be filled
- Tone selection works
- Submit creates reflection
- AI response is displayed
- Reflection appears in history
- Character limits are enforced

### 3. Dashboard Flow (Priority: MEDIUM)

```
Login -> Dashboard -> Navigate to sections
```

**Tests:**
- Dashboard loads with user data
- Dreams card displays correctly
- Reflections card shows recent
- Navigation to all sections works
- Usage limits displayed correctly

## Complexity Assessment

### High Complexity Areas

- **AI Response Generation:** E2E tests for reflection submission require either:
  - Mocking the Anthropic API (complex setup)
  - Using real API (expensive, slow)
  - **Recommendation:** Use real API in CI with low rate limits, or create a mock endpoint

### Medium Complexity Areas

- **Database Seeding:** Need to maintain test data consistency
- **Cookie-based Auth:** Playwright handles cookies well, but need proper setup

### Low Complexity Areas

- **Form Validation Tests:** Straightforward with page objects
- **Navigation Tests:** Simple URL checks
- **UI Element Tests:** Standard Playwright assertions

## Technology Recommendations

### Primary Stack

- **E2E Framework:** Playwright (`@playwright/test`) - Best-in-class for Next.js
- **Browser:** Chromium primary, Firefox and Safari secondary
- **Report:** HTML reporter with GitHub Actions integration

### Supporting Libraries

None additional needed - Playwright includes everything required.

## Risks & Challenges

### Technical Risks

1. **Flaky Tests:** Network-dependent tests may fail intermittently
   - **Mitigation:** Use `retries: 2` in CI, implement proper waits

2. **Slow Test Execution:** AI responses take time
   - **Mitigation:** Run reflection creation tests in serial, others in parallel

3. **Database State:** Tests may interfere with each other
   - **Mitigation:** Unique test user per test, cleanup in afterEach

### Complexity Risks

1. **Auth Cookie Handling:** HTTP-only cookies require careful handling
   - **Mitigation:** Playwright handles cookies automatically; use storageState for persistence

## Recommendations for Planner

1. **Start with Auth Tests:** These are foundational and verify the core flow works
2. **Use Page Object Pattern:** Maintainable and reusable test code
3. **Run Single Browser in CI Initially:** Add Firefox/Safari later for efficiency
4. **Mock AI in Most Tests:** Only test real AI response in one smoke test
5. **Add Visual Regression Later:** Start with functional tests first

## Resource Map

### Critical Files/Directories to Create

| Path | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts` | Playwright configuration |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/` | E2E test directory |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/auth.fixture.ts` | Auth test fixture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/pages/*.ts` | Page object models |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/scripts/seed-e2e.ts` | Database seeding script |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.env.test` | Test environment variables |

### Existing Files to Modify

| Path | Change |
|------|--------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/package.json` | Add @playwright/test and npm scripts |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml` | Add E2E test job |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.gitignore` | Add playwright artifacts |

### Key Dependencies

| Dependency | Purpose |
|------------|---------|
| `@playwright/test` | E2E testing framework |
| `tsx` | Run TypeScript seeding scripts |

### Testing Infrastructure

| Tool/Approach | Rationale |
|---------------|-----------|
| Playwright HTML Reporter | Rich failure debugging with screenshots |
| Page Object Pattern | Maintainable, reusable locators |
| Test Fixtures | DRY authentication setup |
| GitHub Actions Integration | Automated PR testing |

## Questions for Planner

1. Should E2E tests be blocking for PRs, or advisory only initially?
2. What is the acceptable E2E test execution time budget? (Recommend < 5 minutes)
3. Should we mock the Anthropic API entirely, or run one smoke test with real AI?
4. Is there a staging environment available for E2E tests, or only local Supabase?

---

*Report generated for Iteration 37, Plan 21*
*Focus: Playwright E2E Testing Infrastructure Setup*
