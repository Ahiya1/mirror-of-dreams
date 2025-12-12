# Explorer 1 Report: E2E Test Infrastructure Analysis

## Executive Summary

The Mirror of Dreams project has a well-established E2E testing infrastructure using Playwright, with 6 existing spec files covering auth, landing, dashboard, dreams, and reflection flows. The infrastructure uses a Page Object Model (POM) pattern with dedicated fixtures for authentication and test data. For Iteration 58, we need to add 5 new spec files (profile, subscription, admin, clarify, error handling) to double E2E coverage from 6 to 12+ specs.

## Discoveries

### Current E2E Structure

```
e2e/
├── auth/
│   ├── signin.spec.ts     (55 tests)
│   └── signup.spec.ts     (42 tests)
├── dashboard/
│   └── dashboard.spec.ts  (40 tests)
├── dreams/
│   └── dreams.spec.ts     (45 tests)
├── fixtures/
│   ├── auth.fixture.ts    (authentication helper)
│   └── test-data.fixture.ts (test data constants)
├── landing/
│   └── landing.spec.ts    (35 tests)
├── pages/
│   ├── signin.page.ts
│   ├── signup.page.ts
│   ├── dashboard.page.ts
│   ├── dreams.page.ts
│   ├── landing.page.ts
│   └── reflection.page.ts
└── reflection/
    └── reflection.spec.ts (55 tests)
```

**Total: ~272 E2E tests across 6 spec files**

### Playwright Configuration

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts`

Key settings:
- **Test directory:** `./e2e`
- **Base URL:** `http://localhost:3000`
- **Parallel execution:** Enabled (`fullyParallel: true`)
- **Workers:** 1 in CI (reliability), unlimited locally
- **Retries:** 2 in CI, 0 locally
- **Timeouts:** 
  - Test: 60,000ms
  - Action: 15,000ms
  - Navigation: 30,000ms
  - Expect: 10,000ms
- **Browsers:** Chromium in CI; Chromium, Firefox, mobile Safari locally
- **Web server:** Auto-starts `npm run dev` in CI, reuses existing server locally
- **Artifacts:** Screenshot/video on failure, trace on first retry

### Existing Fixtures

#### auth.fixture.ts
**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/auth.fixture.ts`

Provides:
- `generateTestEmail()` - Creates unique test emails with timestamp
- `TEST_USER` - Standard test user credentials
- `loginWithDemo()` - Demo login via landing page "Try It" button
- `authenticatedPage` fixture - Pre-authenticated page context
- `authWaits` - Wait utilities for auth flows (redirect, error, success, form ready)

Usage pattern:
```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('authenticated test', async ({ authenticatedPage }) => {
  // Page is already logged in via demo user
  await authenticatedPage.goto('/dashboard');
});
```

**Critical insight:** Demo login uses the "Try It" button on landing page, which calls `loginDemo` tRPC mutation. This is the ONLY reliable way to authenticate in E2E tests.

#### test-data.fixture.ts
**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/test-data.fixture.ts`

Provides:
- `TEST_DREAM` - Sample dream data
- `TEST_REFLECTION` - Sample reflection answers
- `DREAM_CATEGORIES` - Valid category values
- `DREAM_STATUSES` - Valid status values
- `REFLECTION_TONES` - fusion, gentle, intense
- `CATEGORY_EMOJIS` / `STATUS_EMOJIS` - Emoji mappings
- `generateTestDreamTitle()` - Unique dream titles
- `TEST_TIMEOUTS` - Standard timeout values
- `MOBILE_VIEWPORTS` - Mobile viewport configs (iPhone 13, iPhone SE, Android)
- `DASHBOARD_CARDS` - Card names for validation
- `getExpectedGreeting()` - Time-of-day greeting helper

### Page Object Patterns

All page objects follow a consistent pattern:

1. **Constructor:** Receives `Page` from Playwright, initializes `Locator` properties
2. **Locators:** Uses CSS selectors, text matchers, aria attributes
3. **Actions:** Methods like `goto()`, `fill*()`, `click*()`, `submit()`
4. **Assertions:** Methods prefixed with `expect*()` for common validations
5. **Helpers:** `waitForLoad()`, state getters, visibility checks

Example structure from `signin.page.ts`:
```typescript
export class SignInPage {
  readonly page: Page;
  
  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  
  // Messages
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#signin-email');
    this.passwordInput = page.locator('input[type="password"]');
    // ...
  }
  
  async goto(): Promise<void> { /* ... */ }
  async fillCredentials(email: string, password: string): Promise<void> { /* ... */ }
  async expectError(message?: string | RegExp): Promise<void> { /* ... */ }
}
```

### Test Naming Conventions

Tests follow a hierarchical structure using `test.describe()`:
- **Top-level:** Feature area (e.g., "Sign In Flow", "Dashboard", "Dreams")
- **Second-level:** Test category (e.g., "Page Display", "Form Behavior", "Navigation", "Mobile")
- **Test names:** Descriptive, start with verb (e.g., "displays", "navigates", "can fill")

Pattern examples:
```typescript
test.describe('Dashboard', () => {
  test.describe('Page Display', () => {
    test('loads dashboard page successfully', async () => {});
    test('displays hero section', async () => {});
  });
  
  test.describe('Navigation', () => {
    test('dreams card View All navigates to /dreams', async () => {});
  });
});
```

### Mobile Testing Pattern

Mobile tests are handled in two ways:

1. **test.use() for viewport configuration:**
```typescript
test.describe('Dreams Mobile', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone13,
    isMobile: true,
    hasTouch: true,
  });
  // Tests run with mobile viewport
});
```

2. **Per-test setViewportSize:**
```typescript
test('hero section is visible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Test with mobile viewport
});
```

**Important:** Mobile tests that need authentication cannot use `authenticatedPage` fixture with `test.use()` due to Playwright restrictions. They must manually perform demo login.

## Patterns Identified

### Authentication Pattern for E2E Tests

**Description:** Demo login via landing page "Try It" button
**Use Case:** All authenticated tests
**Example:**
```typescript
// Via fixture (preferred)
test('dashboard test', async ({ authenticatedPage }) => {
  // Already logged in
});

// Manual (for mobile/special cases)
test('mobile test', async ({ page }) => {
  await page.goto('/');
  await page.locator('button:has-text("Try It")').click();
  await page.waitForURL('/dashboard', { timeout: 30000 });
});
```
**Recommendation:** Always use `authenticatedPage` fixture when possible.

### Error/Success Message Pattern

**Description:** Status boxes for form feedback
**Selectors:**
- Error: `.status-box-error`
- Success: `.status-box-success`
**Example:**
```typescript
await expect(page.locator('.status-box-error')).toBeVisible({ timeout: 10000 });
```

### Card/Component Detection Pattern

**Description:** Cards identified by class name prefixes
**Examples:**
- `.dreams-card`, `.reflections-card`, `.progress-card`
- `.evolution-card`, `.visualization-card`, `.subscription-card`
- `.clarify-card` (paid users only)

### Form Element ID Pattern

**Description:** Form inputs use explicit IDs
**Examples:**
- `#signin-email`, `#email`, `#password`, `#confirmPassword`, `#name`
- Labels linked via `label[for="fieldId"]`

## Complexity Assessment

### High Complexity Areas

#### Admin E2E Tests
- Requires admin authentication (no existing fixture)
- Admin-only routes with role validation
- Stats display with dynamic data
- User table interactions
- **Recommendation:** Create `admin.fixture.ts` with admin user setup

#### Clarify E2E Tests
- Access control (free vs paid users)
- Streaming AI responses (hard to test deterministically)
- Tool use interactions (createDream, pattern extraction)
- Session management
- **Recommendation:** May need to mock AI responses or use special test mode

#### Subscription E2E Tests
- PayPal SDK integration
- Payment flow simulation
- Usage limit enforcement
- Cancel/success flows
- **Recommendation:** Create `paid-user.fixture.ts`, may need PayPal SDK mocking in browser context

### Medium Complexity Areas

#### Profile E2E Tests
- Profile display and edit
- Password change flow
- Account deletion (careful - could delete test data)
- Demo user restrictions
- **Recommendation:** Use demo user carefully, avoid destructive actions

#### Error Handling E2E Tests
- Network failure simulation
- Session expiry handling
- Rate limit display
- **Recommendation:** May need network interception fixtures

### Low Complexity Areas

None of the required specs are low complexity - all involve authenticated flows and state management.

## Technology Recommendations

### Primary Stack (Already In Use)

- **Playwright:** E2E testing framework
- **TypeScript:** Type-safe test code
- **Page Object Model:** Maintainable test architecture

### New Fixtures Needed

1. **admin.fixture.ts**
   - Admin user authentication
   - Role validation helpers
   - Admin-specific wait utilities

2. **paid-user.fixture.ts**
   - Paid user authentication (not demo)
   - Subscription status helpers
   - Usage limit helpers

3. **network.fixture.ts** (optional)
   - Network failure simulation
   - Request interception
   - Rate limit mocking

### New Page Objects Needed

1. **profile.page.ts** - Profile page interactions
2. **pricing.page.ts** - Pricing page and checkout
3. **subscription.page.ts** - Subscription management
4. **admin.page.ts** - Admin panel interactions
5. **clarify.page.ts** - Clarify agent interface
6. **error.page.ts** - Error boundary testing (optional)

## Integration Points

### Authentication Integration

All new specs must integrate with:
- Demo login flow (existing)
- Admin login flow (new)
- Paid user login flow (new)

### Navigation Integration

All pages connect via:
- AppNavigation (desktop)
- BottomNavigation (mobile)
- Direct URL navigation

### tRPC API Integration

E2E tests implicitly test:
- Profile mutations (profile spec)
- Subscription queries (subscription spec)
- Admin queries (admin spec)
- Clarify mutations (clarify spec)

## Risks & Challenges

### Technical Risks

1. **Admin User Creation**
   - Impact: HIGH - No existing admin test user
   - Mitigation: Create test admin or mock admin role

2. **Paid User Testing**
   - Impact: HIGH - Demo users are always free tier
   - Mitigation: Create paid test user or mock subscription status

3. **PayPal SDK in Browser**
   - Impact: MEDIUM - SDK loads in browser context
   - Mitigation: May need to intercept SDK script or use mock

4. **AI Streaming Responses**
   - Impact: MEDIUM - Non-deterministic AI responses
   - Mitigation: Test UI states, not content; use fixtures for expected states

### Stability Risks

1. **Flaky Network Tests**
   - Impact: HIGH - Network failure tests prone to flakiness
   - Mitigation: Use deterministic request interception

2. **Timing Issues with Streaming**
   - Impact: MEDIUM - Clarify streaming may have timing issues
   - Mitigation: Use robust wait conditions, avoid timeouts

## Recommendations for Planner

1. **Create Fixtures First**
   - Build `admin.fixture.ts` before admin spec
   - Build `paid-user.fixture.ts` before subscription/clarify specs
   - Consider `network.fixture.ts` for error handling spec

2. **Builder Assignment**
   - Builder 1: Profile E2E (lower complexity, good starting point)
   - Builder 2: Subscription E2E (requires paid-user fixture)
   - Builder 3: Admin E2E (requires admin fixture)
   - Builder 4: Clarify E2E (highest complexity, needs streaming handling)
   - Builder 5: Error Handling E2E (needs network fixture)

3. **Fixture Dependencies**
   - Admin fixture must be created before admin spec
   - Paid-user fixture must be created before subscription/clarify specs
   - Consider having one builder focus solely on fixtures

4. **Test Data Strategy**
   - Avoid creating/deleting real data in tests
   - Use demo user data as baseline
   - Mock destructive operations (delete account, cancel subscription)

5. **Mobile Coverage**
   - Each new spec should include mobile viewport tests
   - Follow existing pattern of separate mobile describe block

## Resource Map

### Critical Files/Directories

| Path | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts` | Playwright configuration |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/auth.fixture.ts` | Authentication fixture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/test-data.fixture.ts` | Test data constants |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/pages/` | Page object models |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/dashboard/dashboard.spec.ts` | Reference spec file |

### App Pages Needing E2E Coverage

| Page | Current Coverage | New Spec Needed |
|------|-----------------|-----------------|
| `/profile` | None | profile.spec.ts |
| `/settings` | None | profile.spec.ts |
| `/pricing` | None | subscription.spec.ts |
| `/subscription/*` | None | subscription.spec.ts |
| `/admin` | None | admin.spec.ts |
| `/clarify` | None | clarify.spec.ts |
| `/clarify/[sessionId]` | None | clarify.spec.ts |

### Existing Coverage

| Page | Spec File |
|------|-----------|
| `/` (landing) | landing.spec.ts |
| `/auth/signin` | signin.spec.ts |
| `/auth/signup` | signup.spec.ts |
| `/dashboard` | dashboard.spec.ts |
| `/dreams` | dreams.spec.ts |
| `/reflection` | reflection.spec.ts |

## Questions for Planner

1. **Admin Test User:** Should we create a permanent test admin user in the database, or mock the admin role check in tests?

2. **Paid User Testing:** How should we handle paid user tests - create a test paid user, mock subscription status, or both?

3. **Destructive Actions:** Should profile deletion and subscription cancellation tests actually perform the action, or just test the UI flow up to confirmation?

4. **AI Response Mocking:** For clarify tests, should we mock AI responses at the network level, or test the UI assuming responses are unpredictable?

5. **PayPal SDK:** Do we need to mock PayPal SDK in the browser, or can we test the checkout flow without actual PayPal interaction?

---

**Report Generated:** 2025-12-12
**Explorer:** Explorer-1
**Focus Area:** E2E Test Infrastructure Analysis
