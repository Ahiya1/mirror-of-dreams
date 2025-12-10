# End-to-End Testing Guide

This guide covers Playwright setup, Page Object Model patterns, authentication fixtures, and best practices for writing E2E tests in Mirror of Dreams.

## Table of Contents

- [Setup and Configuration](#setup-and-configuration)
- [Page Object Model](#page-object-model)
- [Authentication Fixtures](#authentication-fixtures)
- [Writing E2E Tests](#writing-e2e-tests)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Setup and Configuration

### Playwright Configuration

The Playwright configuration is in `playwright.config.ts`:

```typescript
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Parallel execution
  fullyParallel: true,

  // Fail build on test.only in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Limit workers in CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],

  // Shared settings
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Browser projects
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Additional browsers in local dev only
    ...(process.env.CI
      ? []
      : [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
        ]),
  ],

  // Auto-start dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Key Configuration Notes

| Setting               | Development             | CI          |
| --------------------- | ----------------------- | ----------- |
| `retries`             | 0                       | 2           |
| `workers`             | Auto                    | 1           |
| `forbidOnly`          | false                   | true        |
| `reuseExistingServer` | true                    | false       |
| Browsers              | Chrome, Firefox, Safari | Chrome only |

### Directory Structure

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts      # Authentication helpers
│   └── test-data.fixture.ts # Shared test constants
├── pages/
│   ├── signin.page.ts       # Sign in page object
│   ├── signup.page.ts       # Sign up page object
│   ├── dashboard.page.ts    # Dashboard page object
│   ├── dreams.page.ts       # Dreams page object
│   ├── landing.page.ts      # Landing page object
│   └── reflection.page.ts   # Reflection page object
├── auth/
│   ├── signin.spec.ts       # Sign in tests
│   └── signup.spec.ts       # Sign up tests
├── dashboard/
│   └── dashboard.spec.ts    # Dashboard tests
├── dreams/
│   └── dreams.spec.ts       # Dreams feature tests
├── landing/
│   └── landing.spec.ts      # Landing page tests
└── reflection/
    └── reflection.spec.ts   # Reflection flow tests
```

## Page Object Model

Page Objects encapsulate page interactions for maintainable tests.

### Page Object Structure

```typescript
// e2e/pages/example.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;

  // Locators
  readonly title: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators in constructor
    this.title = page.locator('h1');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  // Navigation
  async goto(): Promise<void> {
    await this.page.goto('/example');
    await this.page.waitForLoadState('networkidle');
  }

  // Actions
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  // Assertions
  async expectTitleVisible(): Promise<void> {
    await expect(this.title).toBeVisible();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### Using Page Objects

```typescript
// e2e/example/example.spec.ts
import { test, expect } from '@playwright/test';
import { ExamplePage } from '../pages/example.page';

test.describe('Example Feature', () => {
  let examplePage: ExamplePage;

  test.beforeEach(async ({ page }) => {
    examplePage = new ExamplePage(page);
    await examplePage.goto();
  });

  test('displays title', async () => {
    await examplePage.expectTitleVisible();
  });

  test('shows error on invalid submit', async () => {
    await examplePage.clickSubmit();
    await examplePage.expectError('Validation failed');
  });
});
```

### Existing Page Objects

#### SignInPage

```typescript
import { SignInPage } from '../pages/signin.page';

// Locators
signinPage.emailInput; // #signin-email
signinPage.passwordInput; // input[type="password"]
signinPage.submitButton; // button[type="submit"]
signinPage.errorMessage; // .status-box-error
signinPage.signupLink; // a[href="/auth/signup"]

// Actions
await signinPage.goto();
await signinPage.fillEmail('user@example.com');
await signinPage.fillPassword('password');
await signinPage.fillCredentials('user@example.com', 'password');
await signinPage.submit();
await signinPage.signin('user@example.com', 'password');
await signinPage.navigateToSignup();

// Assertions
await signinPage.expectFormElementsVisible();
await signinPage.expectError('Invalid credentials');
await signinPage.expectRedirectToDashboard();
```

#### DashboardPage

```typescript
import { DashboardPage } from '../pages/dashboard.page';

// Locators
dashboardPage.heroSection;
dashboardPage.greetingText;
dashboardPage.reflectNowButton;
dashboardPage.dreamsCard;
dashboardPage.reflectionsCard;
dashboardPage.evolutionCard;

// Actions
await dashboardPage.goto();
await dashboardPage.waitForLoad();
await dashboardPage.clickReflectNow();
await dashboardPage.clickDreamsViewAll();

// Assertions
await dashboardPage.expectLoaded();
await dashboardPage.expectGreetingVisible();
await dashboardPage.expectDreamsCardVisible();
await dashboardPage.expectMinimumCards(5);
```

#### DreamsPage

```typescript
import { DreamsPage } from '../pages/dreams.page';

// Locators
dreamsPage.pageTitle;
dreamsPage.createDreamButton;
dreamsPage.dreamCards;
dreamsPage.filterActive;
dreamsPage.filterAchieved;
dreamsPage.emptyState;

// Actions
await dreamsPage.goto();
await dreamsPage.clickCreateDream();
await dreamsPage.filterByStatus('active');
await dreamsPage.clickDreamCard(0);
await dreamsPage.clickDreamReflect(0);

// Assertions
await dreamsPage.expectLoaded();
await dreamsPage.expectDreamsVisible(2);
await dreamsPage.expectEmptyState();
await dreamsPage.expectCreateButtonEnabled();
```

#### LandingPage

```typescript
import { LandingPage } from '../pages/landing.page';

// Locators
landingPage.heroTitle;
landingPage.ctaTryIt;
landingPage.ctaBegin;
landingPage.signInButton;
landingPage.featuresSection;
landingPage.footer;

// Actions
await landingPage.goto();
await landingPage.clickTryIt();
await landingPage.clickBegin();
await landingPage.clickSignIn();
await landingPage.scrollToFeatures();

// Assertions
await landingPage.expectHeroVisible();
await landingPage.expectCtaButtonsVisible();
await landingPage.expectFeatureCards(3);
await landingPage.expectFooterVisible();
```

## Authentication Fixtures

### Using Demo Login

The app provides a demo login feature for testing authenticated flows:

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click "Try It" demo button
    const demoButton = page.locator('button').filter({ hasText: 'Try It' });
    await demoButton.click();

    // Wait for dashboard redirect
    await page.waitForURL('/dashboard', { timeout: 30000 });

    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### Using Authenticated Fixture

```typescript
// e2e/dashboard/dashboard.spec.ts
import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Dashboard (Authenticated)', () => {
  test('should display user dashboard', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    await dashboard.expectLoaded();
    await dashboard.expectGreetingVisible();
    await dashboard.expectDreamsCardVisible();
  });
});
```

### Auth Wait Utilities

```typescript
import { authWaits } from '../fixtures/auth.fixture';

// Wait for login redirect
await authWaits.forLoginRedirect(page);

// Wait for error message
await authWaits.forErrorMessage(page);

// Wait for success message
await authWaits.forSuccessMessage(page);

// Wait for form ready
await authWaits.forFormReady(page, 'form#signin');
```

### Test Data Fixtures

```typescript
// e2e/fixtures/test-data.fixture.ts

export const TEST_DREAM = {
  title: 'E2E Test Dream',
  description: 'A dream created by E2E tests',
  category: 'career',
};

export const TEST_REFLECTION = {
  dream: 'My aspiration to grow professionally.',
  plan: 'Take small steps each day.',
  relationship: 'Connects to my desire for fulfillment.',
  offering: 'My patience and persistence.',
};

export const DREAM_CATEGORIES = [
  'career',
  'health',
  'relationships',
  'personal_growth',
  'financial',
  'creative',
  'adventure',
];

export const TEST_TIMEOUTS = {
  pageLoad: 30000,
  navigation: 15000,
  animation: 5000,
  networkIdle: 10000,
  elementVisible: 10000,
};

// Generate unique test data
export function generateTestDreamTitle(): string {
  return `E2E Dream ${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export function generateTestEmail(): string {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.local`;
}
```

## Writing E2E Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { SignInPage } from '../pages/signin.page';

test.describe('Sign In Flow', () => {
  let signinPage: SignInPage;

  test.beforeEach(async ({ page }) => {
    signinPage = new SignInPage(page);
    await signinPage.goto();
  });

  test('displays form elements', async () => {
    await signinPage.expectFormElementsVisible();
  });

  test('navigates to signup page', async ({ page }) => {
    await signinPage.navigateToSignup();
    await expect(page).toHaveURL('/auth/signup');
  });
});
```

### Testing User Flows

```typescript
test.describe('Create Dream Flow', () => {
  test('user can create a new dream', async ({ authenticatedPage }) => {
    const dreams = new DreamsPage(authenticatedPage);

    // Navigate to dreams page
    await dreams.goto();
    await dreams.expectLoaded();

    // Click create button
    await dreams.clickCreateDream();
    await dreams.expectCreateModalVisible();

    // Fill form
    await authenticatedPage.fill('[name="title"]', 'E2E Test Dream');
    await authenticatedPage.selectOption('[name="category"]', 'career');

    // Submit
    await authenticatedPage.click('button:has-text("Create")');

    // Verify creation
    await dreams.expectDreamsVisible(1);
    await expect(authenticatedPage.locator('text=E2E Test Dream')).toBeVisible();
  });
});
```

### Testing Responsive Design

```typescript
import { MOBILE_VIEWPORTS } from '../fixtures/test-data.fixture';

test.describe('Mobile Navigation', () => {
  test.use({ viewport: MOBILE_VIEWPORTS.iphone13 });

  test('shows mobile menu button', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.expectMobileMenuButtonVisible();
    await landing.openMobileMenu();
    await landing.expectMobileMenuOpen();
  });

  test('bottom navigation is visible on dashboard', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    await dashboard.goto();
    await dashboard.expectBottomNavVisible();
  });
});
```

### Testing Accessibility

```typescript
test.describe('Accessibility', () => {
  test('form inputs have proper labels', async ({ page }) => {
    const signin = new SignInPage(page);
    await signin.goto();

    // Check for labels
    const emailLabel = page.locator('label[for="signin-email"]');
    await expect(emailLabel).toBeVisible();

    const passwordLabel = page.locator('label').filter({ hasText: /password/i });
    await expect(passwordLabel).toBeVisible();
  });

  test('keyboard navigation works', async ({ page }) => {
    const signin = new SignInPage(page);
    await signin.goto();

    // Tab through form
    await signin.emailInput.focus();
    await expect(signin.emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    // Continue tabbing through focusable elements
  });
});
```

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run e2e

# Run with UI mode (interactive)
npm run e2e:ui

# Run specific test file
npx playwright test e2e/auth/signin.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test by title
npx playwright test -g "displays form elements"

# Run with specific browser
npx playwright test --project=chromium

# Debug mode (step through tests)
npx playwright test --debug

# Run with trace viewer
npx playwright test --trace on
```

### Viewing Reports

```bash
# Generate HTML report
npx playwright test

# Open report
npx playwright show-report

# View trace file
npx playwright show-trace trace.zip
```

### Common Commands

```bash
# Update snapshots
npx playwright test --update-snapshots

# List all tests
npx playwright test --list

# Run tests matching pattern
npx playwright test --grep "auth"

# Exclude tests matching pattern
npx playwright test --grep-invert "slow"
```

## CI/CD Integration

### GitHub Actions Workflow

Playwright tests run as part of the CI pipeline. The configuration handles:

1. **Automatic server startup**: `webServer` config starts dev server in CI
2. **Single browser**: Only Chromium in CI for speed
3. **Retries**: 2 retries for flaky tests
4. **Single worker**: Sequential execution for reliability
5. **Artifacts**: Screenshots, videos, and traces on failure

### CI-Specific Behavior

```typescript
// playwright.config.ts
{
  // Only in CI
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // CI reporters
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],

  // Don't reuse server in CI
  webServer: {
    reuseExistingServer: !process.env.CI,
  },
}
```

## Best Practices

### 1. Use Page Objects

Always encapsulate page interactions:

```typescript
// Good
await signinPage.fillCredentials(email, password);
await signinPage.submit();

// Bad
await page.fill('#signin-email', email);
await page.fill('input[type="password"]', password);
await page.click('button[type="submit"]');
```

### 2. Wait for State

Use explicit waits over arbitrary timeouts:

```typescript
// Good
await page.waitForURL('/dashboard');
await expect(element).toBeVisible({ timeout: 10000 });

// Bad
await page.waitForTimeout(5000);
```

### 3. Use Stable Selectors

Prefer semantic selectors:

```typescript
// Good (stable)
page.getByRole('button', { name: 'Submit' });
page.getByLabel('Email');
page.locator('[data-testid="submit-button"]');

// Bad (brittle)
page.locator('.btn-primary.submit');
page.locator('div > form > button:nth-child(2)');
```

### 4. Isolate Tests

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Start fresh
  signinPage = new SignInPage(page);
  await signinPage.goto();
});
```

### 5. Handle Async Operations

```typescript
// Good
await expect(async () => {
  const count = await dreams.getDreamCount();
  expect(count).toBeGreaterThan(0);
}).toPass({ timeout: 10000 });

// Or with explicit wait
await dreams.waitForLoad();
await expect(dreams.dreamCards.first()).toBeVisible();
```

### 6. Test Real User Scenarios

```typescript
// Good - tests actual user flow
test('user creates dream and reflects on it', async ({ authenticatedPage }) => {
  const dreams = new DreamsPage(authenticatedPage);
  const reflection = new ReflectionPage(authenticatedPage);

  await dreams.goto();
  await dreams.clickCreateDream();
  // ... create dream
  await dreams.clickDreamReflect(0);
  // ... complete reflection
});

// Bad - tests implementation details
test('modal state updates correctly', async () => {
  // Testing internal state instead of user behavior
});
```

### 7. Skip Unstable Tests Temporarily

```typescript
test.skip('flaky test pending fix', async ({ page }) => {
  // TODO: Fix timing issue in CI
});

test.fixme('known broken feature', async ({ page }) => {
  // TODO: Feature needs implementation
});
```

## Related Documentation

- [Testing Overview](./overview.md) - General testing strategy
- [Testing Patterns](./patterns.md) - Unit/integration test patterns
- [Debugging Tests](./debugging.md) - Troubleshooting E2E failures
