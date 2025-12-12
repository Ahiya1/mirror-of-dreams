# Technology Stack - E2E Test Expansion

## Core Framework

**Decision:** Playwright with TypeScript (existing)

**Rationale:**
- Consistent with existing E2E infrastructure (6 spec files)
- Auto-waiting eliminates most timing issues
- Built-in route interception for network testing
- Multi-browser support (Chromium focus in CI)
- Excellent trace/screenshot debugging

**Configuration:** `playwright.config.ts` (no changes needed)

## Test Architecture

**Decision:** Page Object Model (POM) + Fixtures

**Rationale:**
- Matches existing patterns in `e2e/pages/`
- Separates page interactions from test logic
- Fixtures provide reusable authenticated contexts
- Maintainable and scalable

## Fixture Strategy

### admin.fixture.ts

**Purpose:** Provide admin-authenticated page context for admin-only route testing

**Implementation Strategy:**
- Use environment variables for admin credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Fall back to demo user with creator/admin flag check
- Since demo user has creator privileges, leverage that for most admin tests

**Key Decision:** Admin tests will use demo user because:
1. Demo user has `isCreator: true` which grants admin access
2. No need for separate admin credentials in test environment
3. Simpler setup, same coverage

### paid-user.fixture.ts

**Purpose:** Enable testing of paid-tier features (Clarify, enhanced limits)

**Implementation Strategy:**
- Admin/Creator users bypass tier restrictions in the app
- Demo user has creator privileges, granting paid feature access
- For free-tier-blocked tests, use regular demo auth then check redirect behavior

**Key Decision:** Paid user tests will:
1. Use demo user (has creator access = paid features)
2. Test free-tier blocking by attempting access before login or with mocked tier

### network.fixture.ts

**Purpose:** Simulate network failures, timeouts, and error states

**Implementation Strategy:**
- Use Playwright's `page.route()` for request interception
- Create reusable fixtures for common scenarios:
  - `withNetworkOffline` - Block all API requests
  - `withSlowNetwork` - Add artificial delay
  - `withApiError` - Return 500 for specific routes

## Page Objects Required

### New Page Objects

| Page Object | File | Priority |
|-------------|------|----------|
| ProfilePage | `e2e/pages/profile.page.ts` | HIGH |
| SettingsPage | `e2e/pages/settings.page.ts` | HIGH |
| PricingPage | `e2e/pages/pricing.page.ts` | HIGH |
| AdminPage | `e2e/pages/admin.page.ts` | HIGH |
| ClarifyListPage | `e2e/pages/clarify-list.page.ts` | HIGH |
| ClarifySessionPage | `e2e/pages/clarify-session.page.ts` | MEDIUM |

### Existing Page Objects (Reference)

| Page Object | File | Status |
|-------------|------|--------|
| DashboardPage | `e2e/pages/dashboard.page.ts` | Reference for patterns |
| SignInPage | `e2e/pages/signin.page.ts` | Reference for auth |
| LandingPage | `e2e/pages/landing.page.ts` | Reference for demo login |

## Test Directory Structure

```
e2e/
  fixtures/
    auth.fixture.ts          (existing)
    admin.fixture.ts         (NEW)
    paid-user.fixture.ts     (NEW)
    network.fixture.ts       (NEW)
    test-data.fixture.ts     (existing)
  pages/
    signin.page.ts           (existing)
    signup.page.ts           (existing)
    landing.page.ts          (existing)
    dashboard.page.ts        (existing)
    dreams.page.ts           (existing)
    reflection.page.ts       (existing)
    profile.page.ts          (NEW)
    settings.page.ts         (NEW)
    pricing.page.ts          (NEW)
    admin.page.ts            (NEW)
    clarify-list.page.ts     (NEW)
    clarify-session.page.ts  (NEW)
  auth/
    signin.spec.ts           (existing)
    signup.spec.ts           (existing)
  landing/
    landing.spec.ts          (existing)
  dashboard/
    dashboard.spec.ts        (existing)
  dreams/
    dreams.spec.ts           (existing)
  reflection/
    reflection.spec.ts       (existing)
  profile/
    profile.spec.ts          (NEW)
  settings/
    settings.spec.ts         (NEW)
  subscription/
    subscription.spec.ts     (NEW)
  admin/
    admin.spec.ts            (NEW)
  clarify/
    clarify.spec.ts          (NEW)
  error/
    error.spec.ts            (NEW)
```

## Selector Strategy

### Primary Selectors (in order of preference)

1. **Data Test ID:** `[data-testid="profile-name-input"]`
2. **Aria Attributes:** `[aria-label="Edit name"]`
3. **Role + Text:** `getByRole('button', { name: 'Save' })`
4. **CSS Class:** `.profile-card`, `.settings-toggle`
5. **Text Content:** `getByText('Save changes')`

### Existing CSS Class Conventions

| Pattern | Usage |
|---------|-------|
| `.{feature}-card` | Card components (dreams-card, subscription-card) |
| `.status-box-error` | Error message display |
| `.status-box-success` | Success message display |
| `.dashboard-hero` | Hero section components |
| `.dashboard-grid` | Grid layout containers |

## Environment Variables

### Required for E2E Tests

```bash
# Already configured (from existing setup)
# No new env vars needed - demo user has admin/creator access
```

### Optional (if separate admin needed)

```bash
ADMIN_TEST_EMAIL=admin@test.local
ADMIN_TEST_PASSWORD=TestPassword123!
```

## Timeout Configuration

Using existing Playwright config timeouts:

| Timeout Type | Value | Purpose |
|--------------|-------|---------|
| Test timeout | 60,000ms | Overall test duration |
| Action timeout | 15,000ms | Click, fill, etc. |
| Navigation timeout | 30,000ms | Page navigation |
| Expect timeout | 10,000ms | Assertion waits |

## Browser Configuration

**CI:** Chromium only (speed, reliability)
**Local:** Chromium, Firefox, Mobile Safari

No changes to existing `playwright.config.ts` required.

## Reporting

- HTML report in `playwright-report/`
- Screenshots on failure
- Videos on first retry
- Traces on first retry
- GitHub Actions integration in CI

## Performance Targets

- Each spec file should complete in < 60 seconds
- Total E2E suite should complete in < 10 minutes (parallel)
- No test should require more than 30 seconds individually
