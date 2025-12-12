# Explorer 2 Report: E2E Test Coverage Analysis

## Executive Summary

The current E2E test suite covers 6 core pages (landing, signin, signup, dashboard, dreams, reflection) with a well-structured Page Object Model pattern and authentication fixtures. However, significant gaps exist in admin functionality, subscription flows, profile management, Clarify feature, and several secondary pages. Approximately 40-50% of application routes lack E2E coverage.

## Current E2E Coverage Map

### Pages with E2E Tests (COVERED)

| Page | Spec File | Test Count | Coverage Quality |
|------|-----------|------------|------------------|
| Landing (`/`) | `landing/landing.spec.ts` | 31 tests | EXCELLENT - Hero, features, footer, mobile, SEO |
| Sign In (`/auth/signin`) | `auth/signin.spec.ts` | 16 tests | GOOD - Form, validation, navigation, accessibility |
| Sign Up (`/auth/signup`) | `auth/signup.spec.ts` | 18 tests | GOOD - Form, password strength, validation |
| Dashboard (`/dashboard`) | `dashboard/dashboard.spec.ts` | 19 tests | GOOD - Cards, navigation, mobile |
| Dreams (`/dreams`) | `dreams/dreams.spec.ts` | 24 tests | GOOD - Filters, cards, modal, mobile |
| Reflection (`/reflection`) | `reflection/reflection.spec.ts` | 27 tests | GOOD - Selection, form, tones, mobile |

**Total Current Coverage: ~135 tests across 6 pages**

### Pages WITHOUT E2E Tests (GAPS)

| Page | Route | Priority | Complexity |
|------|-------|----------|------------|
| Admin Dashboard | `/admin` | **HIGH** | HIGH - Admin-only access |
| Profile | `/profile` | **HIGH** | MEDIUM - User account management |
| Settings | `/settings` | **HIGH** | MEDIUM - Preferences |
| Pricing | `/pricing` | **HIGH** | LOW - Public page |
| Clarify List | `/clarify` | **HIGH** | MEDIUM - Paid feature |
| Clarify Session | `/clarify/[sessionId]` | **HIGH** | HIGH - Chat interface |
| Reflections List | `/reflections` | **MEDIUM** | MEDIUM - Filter/pagination |
| Reflection Detail | `/reflections/[id]` | **MEDIUM** | LOW - Read-only view |
| Dream Detail | `/dreams/[id]` | **MEDIUM** | MEDIUM - Detail view |
| Evolution | `/evolution` | **MEDIUM** | LOW - Report list |
| Evolution Detail | `/evolution/[id]` | **MEDIUM** | LOW - Report view |
| Visualizations | `/visualizations` | **LOW** | LOW - Pattern display |
| Onboarding | `/onboarding` | **MEDIUM** | MEDIUM - 4-step wizard |
| Subscription Success | `/subscription/success` | **MEDIUM** | LOW - Redirect flow |
| Subscription Cancel | `/subscription/cancel` | **LOW** | LOW - Redirect flow |
| About | `/about` | **LOW** | LOW - Static content |
| Verify Required | `/auth/verify-required` | **LOW** | LOW - Info page |

## Missing Critical Flows

### 1. Admin Functionality (CRITICAL GAP)
**Route:** `/admin`
**Current Coverage:** NONE

**Needs Testing:**
- Admin/Creator authorization check
- Non-admin redirect to dashboard
- Stats overview cards display
- Recent users table rendering
- Webhook events table rendering
- Data refresh functionality

**Page Structure Insights:**
```tsx
// Admin authorization check
if (!user?.isAdmin && !user?.isCreator) {
  router.push('/dashboard');
}
// Stats display: Total users, Free/Pro/Unlimited counts
// Tables: Recent users, Webhook events
```

**Challenge:** Requires admin user fixture - cannot use demo user.

### 2. Profile Management (HIGH PRIORITY)
**Route:** `/profile`
**Current Coverage:** NONE

**Needs Testing:**
- Account info section (name editing)
- Email change flow (requires password)
- Password change flow
- Subscription status card display
- Usage statistics display
- Delete account modal and flow
- Demo user banner (read-only mode)

**Key Components:**
- `AccountInfoSection`
- `AccountActionsSection`
- `DangerZoneSection`
- `SubscriptionStatusCard`

### 3. Settings Preferences (HIGH PRIORITY)
**Route:** `/settings`
**Current Coverage:** NONE

**Needs Testing:**
- Notification preferences toggles
- Reflection preferences (default tone, character counter)
- Display preferences (reduce motion)
- Privacy preferences (analytics, marketing)
- Immediate save on toggle
- Optimistic update with error rollback

### 4. Clarify Feature (HIGH PRIORITY - Paid Feature)
**Routes:** `/clarify`, `/clarify/[sessionId]`
**Current Coverage:** NONE

**Needs Testing:**
- Access control (free tier redirect to pricing)
- Session list display
- Create new session
- Session status filters (Active, Archived, All)
- Archive/Restore/Delete actions
- Chat interface navigation
- Message sending (non-streaming UI verification)
- Session header and back navigation
- Session limit display

**Challenge:** Requires paid user fixture or admin bypass.

### 5. Subscription/Payment Flows (MEDIUM PRIORITY)
**Routes:** `/pricing`, `/subscription/success`, `/subscription/cancel`
**Current Coverage:** NONE

**Needs Testing:**
- Pricing page display (public and authenticated views)
- Tier card rendering (Wanderer, Seeker, Devoted)
- Billing period toggle (Monthly/Yearly)
- FAQ accordion functionality
- Success page redirect flow
- Cancel page redirect flow
- URL parameter handling (?subscription=success/canceled/error)

### 6. Onboarding Wizard (MEDIUM PRIORITY)
**Route:** `/onboarding`
**Current Coverage:** NONE

**Needs Testing:**
- 4-step wizard progression
- Progress indicator (ProgressOrbs)
- Step content display
- Skip functionality
- Complete button behavior
- Redirect to dashboard on completion
- Unverified email redirect

## E2E Infrastructure Analysis

### Existing Page Objects

| Page Object | Location | Quality |
|-------------|----------|---------|
| SignInPage | `e2e/pages/signin.page.ts` | GOOD |
| SignUpPage | `e2e/pages/signup.page.ts` | GOOD |
| LandingPage | `e2e/pages/landing.page.ts` | GOOD |
| DashboardPage | `e2e/pages/dashboard.page.ts` | GOOD |
| DreamsPage | `e2e/pages/dreams.page.ts` | GOOD |
| ReflectionPage | `e2e/pages/reflection.page.ts` | GOOD |

### Missing Page Objects Needed

| Page Object | Priority |
|-------------|----------|
| AdminPage | HIGH |
| ProfilePage | HIGH |
| SettingsPage | HIGH |
| PricingPage | HIGH |
| ClarifyListPage | HIGH |
| ClarifySessionPage | HIGH |
| ReflectionsListPage | MEDIUM |
| OnboardingPage | MEDIUM |

### Fixtures Analysis

**Current Fixtures:**
- `auth.fixture.ts` - Demo user login via "Try It" button
- `test-data.fixture.ts` - Constants, viewports, timeouts

**Missing Fixtures:**
1. **Admin user fixture** - For admin dashboard tests
2. **Paid user fixture** - For Clarify and premium features
3. **Fresh user fixture** - For onboarding tests

## Priority Order for New Tests

### Priority 1: Core User Flows (MUST HAVE)

1. **Profile Page Tests** (~15 tests)
   - Dependencies: Existing auth fixture
   - Effort: MEDIUM
   
2. **Settings Page Tests** (~12 tests)
   - Dependencies: Existing auth fixture
   - Effort: MEDIUM

3. **Pricing Page Tests** (~10 tests)
   - Dependencies: None (public page)
   - Effort: LOW

### Priority 2: Paid Features (SHOULD HAVE)

4. **Clarify List Tests** (~12 tests)
   - Dependencies: Paid user fixture OR admin user
   - Effort: HIGH
   
5. **Clarify Session Tests** (~8 tests)
   - Dependencies: Paid user fixture, existing session
   - Effort: HIGH

### Priority 3: Admin & Secondary (NICE TO HAVE)

6. **Admin Dashboard Tests** (~10 tests)
   - Dependencies: Admin user fixture
   - Effort: HIGH

7. **Reflections List Tests** (~10 tests)
   - Dependencies: Existing auth fixture
   - Effort: MEDIUM

8. **Onboarding Tests** (~8 tests)
   - Dependencies: Fresh user fixture
   - Effort: MEDIUM

## Dependencies Between Tests

```
auth.fixture (demo user)
    |
    +-- profile.spec.ts
    +-- settings.spec.ts
    +-- reflections.spec.ts
    +-- dreams-detail.spec.ts

pricing (no auth)
    |
    +-- pricing.spec.ts

admin.fixture (admin user) [NEEDS CREATION]
    |
    +-- admin.spec.ts
    +-- clarify.spec.ts (admin bypass for paid features)

paid-user.fixture [NEEDS CREATION]
    |
    +-- clarify.spec.ts (alternative to admin fixture)

fresh-user.fixture [NEEDS CREATION]
    |
    +-- onboarding.spec.ts
```

## Technical Recommendations

### 1. Fixture Strategy

**Option A: Admin User Fixture (Recommended)**
```typescript
// Create admin fixture that uses admin credentials
export const adminTest = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', process.env.ADMIN_EMAIL);
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
});
```

**Option B: Database Seeding**
- Seed test users with specific tiers before test run
- Requires test database setup

### 2. Page Object Patterns

Follow existing patterns:
```typescript
// e2e/pages/profile.page.ts
export class ProfilePage {
  readonly page: Page;
  readonly editNameButton: Locator;
  readonly nameInput: Locator;
  // ... additional locators
  
  async goto(): Promise<void> {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }
  
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/profile/);
  }
}
```

### 3. Test Structure Recommendations

```
e2e/
  auth/
    signin.spec.ts (exists)
    signup.spec.ts (exists)
  landing/
    landing.spec.ts (exists)
  dashboard/
    dashboard.spec.ts (exists)
  dreams/
    dreams.spec.ts (exists)
    dreams-detail.spec.ts (NEW)
  reflection/
    reflection.spec.ts (exists)
  reflections/
    reflections.spec.ts (NEW)
  profile/
    profile.spec.ts (NEW)
  settings/
    settings.spec.ts (NEW)
  pricing/
    pricing.spec.ts (NEW)
  clarify/
    clarify-list.spec.ts (NEW)
    clarify-session.spec.ts (NEW)
  admin/
    admin.spec.ts (NEW)
  onboarding/
    onboarding.spec.ts (NEW)
  fixtures/
    auth.fixture.ts (exists)
    admin.fixture.ts (NEW)
    test-data.fixture.ts (exists)
  pages/
    (all page objects)
```

## Estimated Coverage Improvement

| Phase | New Tests | Coverage Gain |
|-------|-----------|---------------|
| Priority 1 (Profile, Settings, Pricing) | ~37 tests | +15% |
| Priority 2 (Clarify) | ~20 tests | +10% |
| Priority 3 (Admin, Reflections, Onboarding) | ~28 tests | +10% |
| **Total** | **~85 tests** | **+35%** |

Final estimated E2E test count: ~220 tests covering all major user flows.

## Questions for Planner

1. Should admin tests use environment variables for credentials, or should we create a test admin user programmatically?

2. For Clarify tests, should we require a paid user fixture or can admin users bypass tier restrictions (current code suggests admin/creator bypass exists)?

3. Should onboarding tests actually call `completeOnboarding` mutation, or should we mock the API response?

4. Are there any pages that should explicitly NOT be E2E tested (e.g., `/design-system`, `/test-components`)?

## Resource Map

### Critical Files/Directories

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/` - All E2E tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/pages/` - Page objects
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/` - Test fixtures
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts` - Playwright config

### Key Application Routes

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/admin/page.tsx` - Admin dashboard
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx` - Profile management
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/settings/page.tsx` - User settings
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/page.tsx` - Clarify list
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx` - Clarify session
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/pricing/page.tsx` - Pricing page
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/onboarding/page.tsx` - Onboarding wizard
