# Explorer 1 Report: E2E Test Infrastructure and Coverage Analysis

## Executive Summary

The Mirror of Dreams application has a solid Playwright E2E testing foundation with well-structured Page Object Model (POM) patterns and test fixtures. However, current E2E coverage is limited to authentication flows only (39 tests across signin/signup), leaving critical user journeys like Dreams, Reflection, Clarify, Dashboard, and Settings completely untested. To meet the vision.md target of 100+ E2E tests, approximately 61+ new tests need to be added across 6+ new test suites covering all major application features.

## Current E2E Infrastructure

### Playwright Configuration (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts`)

**Strengths:**
- Well-configured with parallel execution (`fullyParallel: true`)
- Smart CI/local differentiation:
  - CI: Chromium only, 1 worker, 2 retries
  - Local: Multi-browser (Chromium, Firefox, Mobile Safari)
- Robust timeout configuration:
  - Test timeout: 60 seconds
  - Action timeout: 15 seconds
  - Navigation timeout: 30 seconds
  - Expect timeout: 10 seconds
- Auto-starts dev server with 2-minute startup timeout
- Screenshot/video on failure
- HTML + list reporters, GitHub Actions integration for CI

**Current Browser Matrix:**
| Browser | CI | Local |
|---------|-----|-------|
| Chromium (Desktop Chrome) | Yes | Yes |
| Firefox (Desktop Firefox) | No | Yes |
| Mobile Safari (iPhone 13) | No | Yes |

### Directory Structure

```
e2e/
├── auth/
│   ├── signin.spec.ts    # 20 tests
│   └── signup.spec.ts    # 19 tests
├── fixtures/
│   └── auth.fixture.ts   # Auth test helpers
└── pages/
    ├── signin.page.ts    # SignInPage POM
    └── signup.page.ts    # SignUpPage POM
```

### Test Infrastructure Patterns

**Page Object Model (POM):**
- Clean separation of concerns
- Reusable locators via class properties
- Action methods: `fillEmail()`, `fillPassword()`, `submit()`
- Assertion methods: `expectFormElementsVisible()`, `expectError()`, `expectRedirectToDashboard()`
- Navigation methods: `goto()`, `navigateToSignup()`

**Test Fixtures (`auth.fixture.ts`):**
- `generateTestEmail()`: Creates unique test emails
- `TEST_USER`: Standard test user constants
- `authenticatedPage` fixture: Demo login for authenticated tests
- `authWaits`: Wait utilities for redirects, errors, success messages

## Existing Test Coverage

### Authentication Tests (39 total)

**Sign In Flow (`signin.spec.ts`) - 20 tests:**
- Page Display (5 tests): Form elements, title, links, auto-focus
- Form Behavior (6 tests): Editable fields, fill operations, button state
- Navigation (2 tests): Signup link, forgot password link
- Accessibility (4 tests): Labels, focus management, keyboard nav
- Form Submission (2 tests): Click submit, Enter key submit

**Sign Up Flow (`signup.spec.ts`) - 19 tests:**
- Page Display (4 tests): Form elements, title, links, password strength
- Password Strength Indicator (2 tests): Updates, singular form
- Form Interaction (4 tests): Editable fields, fill all, button state
- Navigation (1 test): Signin link
- Accessibility (3 tests): Labels, required fields, autocomplete
- Security (2 tests): Password masking, unique emails
- Input Behavior (3 tests): Name, email, password inputs

### Completely Missing Coverage

| Feature Area | Routes | Critical User Journeys |
|--------------|--------|------------------------|
| Dreams | `/dreams`, `/dreams/[id]`, `/dreams/[id]/ceremony`, `/dreams/[id]/ritual` | Create, Edit, Delete, Archive, Ceremony |
| Reflection | `/reflection`, `/reflection/output`, `/reflections`, `/reflections/[id]` | Full reflection flow, View history |
| Clarify | `/clarify`, `/clarify/[sessionId]` | Start session, Send messages, Tool use |
| Dashboard | `/dashboard` | View cards, Navigate, Quick actions |
| Settings | `/settings` | Update preferences, Toggle settings |
| Profile | `/profile` | View/edit profile |
| Evolution | `/evolution`, `/evolution/[id]` | Trigger evolution, View history |
| Visualizations | `/visualizations`, `/visualizations/[id]` | Generate, View |
| Subscription | `/pricing`, `/subscription/*` | Checkout flow, Cancel |
| Onboarding | `/onboarding` | New user setup |
| Landing | `/` | Homepage, CTA navigation |

## Priority E2E Tests Needed

### HIGH PRIORITY (Must-Have for 100+ target)

#### 1. Dreams Flow (`e2e/dreams/`) - ~15 tests
**Critical User Journey:** Create and manage life dreams

| Test | Description |
|------|-------------|
| displays dreams list | Authenticated user sees their dreams |
| creates dream with all categories | Test Career, Health, Relationships, Personal Growth, Financial, Creative, Adventure |
| validates required fields | Title required, description optional |
| shows tier limits | Free tier sees limit, paid sees usage |
| filters by status | Active, Achieved, Archived, All |
| navigates to dream detail | Click dream card opens detail |
| edits existing dream | Update title, description, target date |
| archives dream | Move to archived status |
| unarchives dream | Restore from archived |
| deletes dream | Permanent removal with confirmation |
| completes dream ceremony | Achievement flow |
| shows empty state | No dreams prompts creation |
| triggers reflection from dream | Navigate to reflection with dreamId |
| triggers evolution from dream | Navigate to evolution with dreamId |
| mobile responsive | Works on iPhone viewport |

**Page Objects Needed:**
- `DreamsPage` - List page
- `DreamDetailPage` - Individual dream
- `CreateDreamModal` - Modal interactions

#### 2. Reflection Flow (`e2e/reflection/`) - ~20 tests
**Critical User Journey:** Core app experience

| Test | Description |
|------|-------------|
| displays dream selection | Shows user's active dreams |
| selects dream from list | Click to select |
| shows questionnaire form | Step-by-step questions |
| validates responses | Character limits, required fields |
| selects reflection tone | Fusion, Gentle, Intense |
| submits reflection | Full submission flow |
| shows loading/gazing state | Animated waiting state |
| displays reflection output | Rendered markdown response |
| saves to localStorage | Form persistence |
| clears form after completion | Fresh start |
| handles tier limits | Shows upgrade modal at limit |
| navigates to output from URL | Direct link to reflection |
| mobile flow (MobileReflectionFlow) | Swipe/step-based mobile UI |
| mobile dream selection | Bottom sheet selector |
| mobile tone selection | Optimized tone UI |
| mobile question steps | Progressive disclosure |
| mobile gazing overlay | Full-screen loading |
| mobile output view | Mobile-optimized result |
| keyboard accessibility | Tab through form |
| screen reader support | ARIA labels, live regions |

**Page Objects Needed:**
- `ReflectionPage` - Main experience
- `MobileReflectionPage` - Mobile-specific
- `ReflectionOutputPage` - Result display

#### 3. Dashboard Flow (`e2e/dashboard/`) - ~12 tests
**Critical User Journey:** User home base

| Test | Description |
|------|-------------|
| displays all cards | Dreams, Reflections, Progress, Evolution, etc. |
| shows personalized greeting | User name, time-based |
| dreams card links | Navigate to dreams |
| reflections card links | Navigate to reflections |
| evolution card links | Navigate to evolution |
| visualizations card links | Navigate to visualizations |
| clarify card (paid) | Shows for paid users |
| subscription card | Shows tier, upgrade CTA |
| usage warning banner | At limit, near limit states |
| refresh button works | Data updates |
| mobile responsive | Cards stack on mobile |
| stagger animation | Cards animate in sequence |

#### 4. Clarify Flow (`e2e/clarify/`) - ~12 tests
**Critical User Journey:** AI conversation (paid feature)

| Test | Description |
|------|-------------|
| shows upgrade for free users | Redirects to pricing |
| displays session list | Active sessions |
| creates new session | Start conversation |
| sends message | User input |
| receives AI response | Streamed response |
| shows session history | Message thread |
| archives session | Move to archived |
| restores session | From archived |
| deletes session | With confirmation |
| filters by status | Active, Archived, All |
| session limits | Monthly limit display |
| mobile responsive | Chat UI on mobile |

#### 5. Settings Flow (`e2e/settings/`) - ~10 tests
**Critical User Journey:** User preferences

| Test | Description |
|------|-------------|
| displays all sections | Notification, Reflection, Display, Privacy |
| toggles notification email | On/off |
| changes reminder frequency | Off, Daily, Weekly |
| toggles evolution email | On/off |
| changes default tone | Fusion, Gentle, Intense |
| toggles character counter | On/off |
| changes reduce motion | Browser, Reduce, Full |
| toggles analytics | On/off |
| toggles marketing | On/off |
| shows save feedback | Toast on change |

### MEDIUM PRIORITY (Nice-to-Have)

#### 6. Profile Flow (`e2e/profile/`) - ~5 tests
| Test | Description |
|------|-------------|
| displays user info | Name, email, tier |
| updates display name | Edit and save |
| shows usage stats | Reflections, dreams count |
| links to settings | Navigation |
| account deletion | With confirmation |

#### 7. Evolution Flow (`e2e/evolution/`) - ~6 tests
| Test | Description |
|------|-------------|
| triggers dream evolution | Start process |
| shows loading state | AI processing |
| displays evolution result | Report view |
| shows evolution history | Past evolutions |
| tier limits | Free vs paid |
| navigation from dream | Via dream card |

#### 8. Landing/Auth Flow Expansion (`e2e/landing/`) - ~8 tests
| Test | Description |
|------|-------------|
| homepage loads | Hero, features visible |
| CTA navigates to signup | Get started button |
| pricing page loads | Plans displayed |
| pricing CTA works | Checkout flow |
| forgot password flow | Email sent |
| reset password flow | Token validation |
| email verification | From link |
| demo login | If available |

### LOW PRIORITY (Future Enhancement)

#### 9. Visualizations Flow - ~5 tests
#### 10. Subscription/Billing Flow - ~5 tests

## Implementation Recommendations

### 1. Test File Structure

```
e2e/
├── auth/
│   ├── signin.spec.ts       (existing)
│   ├── signup.spec.ts       (existing)
│   ├── forgot-password.spec.ts  (new)
│   └── reset-password.spec.ts   (new)
├── dreams/
│   ├── dreams-list.spec.ts      (new)
│   ├── dream-crud.spec.ts       (new)
│   └── dream-ceremony.spec.ts   (new)
├── reflection/
│   ├── reflection-flow.spec.ts  (new)
│   ├── reflection-mobile.spec.ts (new)
│   └── reflection-output.spec.ts (new)
├── dashboard/
│   └── dashboard.spec.ts        (new)
├── clarify/
│   ├── clarify-list.spec.ts     (new)
│   └── clarify-session.spec.ts  (new)
├── settings/
│   └── settings.spec.ts         (new)
├── fixtures/
│   ├── auth.fixture.ts      (existing)
│   ├── dreams.fixture.ts    (new)
│   └── reflection.fixture.ts (new)
└── pages/
    ├── signin.page.ts       (existing)
    ├── signup.page.ts       (existing)
    ├── dreams.page.ts       (new)
    ├── reflection.page.ts   (new)
    ├── dashboard.page.ts    (new)
    ├── clarify.page.ts      (new)
    └── settings.page.ts     (new)
```

### 2. Authentication Strategy

All authenticated tests should use the existing `authenticatedPage` fixture:

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('authenticated test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // Page is already logged in via demo
});
```

### 3. Mobile Testing Strategy

Use Playwright's device emulation for mobile tests:

```typescript
import { devices } from '@playwright/test';

test.describe('Mobile Reflection Flow', () => {
  test.use({ ...devices['iPhone 13'] });
  
  test('completes reflection on mobile', async ({ page }) => {
    // Mobile-specific assertions
  });
});
```

### 4. Test Data Management

Create factories in fixtures:

```typescript
// e2e/fixtures/dreams.fixture.ts
export const TEST_DREAM = {
  title: 'E2E Test Dream',
  description: 'Created by E2E test',
  category: 'career',
  targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
};

export function generateTestDream() {
  return {
    ...TEST_DREAM,
    title: `E2E Dream ${Date.now()}`,
  };
}
```

### 5. Wait Strategies

Avoid `waitForTimeout` in favor of explicit waits:

```typescript
// Bad
await page.waitForTimeout(2000);

// Good
await page.waitForSelector('[data-testid="reflection-output"]');
await expect(page.locator('.dream-card')).toHaveCount(3);
await page.waitForLoadState('networkidle');
```

### 6. Cross-Browser Testing

Expand Playwright config for CI cross-browser:

```typescript
// playwright.config.ts enhancement
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
],
```

## Test Count Projection

| Category | Current | New | Total |
|----------|---------|-----|-------|
| Auth (signin/signup) | 39 | 8 | 47 |
| Dreams | 0 | 15 | 15 |
| Reflection | 0 | 20 | 20 |
| Dashboard | 0 | 12 | 12 |
| Clarify | 0 | 12 | 12 |
| Settings | 0 | 10 | 10 |
| Profile | 0 | 5 | 5 |
| Evolution | 0 | 6 | 6 |
| Landing | 0 | 8 | 8 |
| **TOTAL** | **39** | **96** | **135** |

This exceeds the vision.md target of 100+ E2E tests.

## Complexity Assessment

### High Complexity
- **Reflection Flow (Desktop + Mobile):** Multiple steps, form persistence, AI integration, tier limits
- **Clarify Flow:** Streaming responses, tool use, session management

### Medium Complexity
- **Dreams CRUD:** Standard CRUD with modals and filters
- **Dashboard:** Multiple cards, data fetching, responsive grid
- **Settings:** Toggle states, immediate persistence

### Low Complexity
- **Auth expansion:** Similar patterns to existing tests
- **Profile/Landing:** Static-ish pages

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Demo login unavailable | Blocks all authenticated tests | Add fallback test user creation |
| Flaky AI responses | Random test failures | Mock AI responses or use deterministic test mode |
| Slow test suite | CI bottleneck | Parallelize, shard across runners |
| Mobile viewport differences | Visual inconsistencies | Use Playwright's device presets consistently |
| Rate limiting | Tests fail at scale | Add retry logic, stagger test execution |

## Questions for Planner

1. Should authenticated tests use demo login or create real test users?
2. Should AI/Anthropic responses be mocked for deterministic testing?
3. What is the acceptable E2E test suite runtime (currently ~30s auth-only)?
4. Should cross-browser testing run on every PR or only on release branches?
5. Should mobile tests be separate spec files or use `test.describe` blocks?

## Resource Map

### Critical Files
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/playwright.config.ts` - Main config
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/fixtures/auth.fixture.ts` - Auth helpers
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/pages/signin.page.ts` - POM example

### Key Application Routes
- `/dashboard` - User home
- `/dreams` - Dreams list
- `/reflection` - Core reflection flow
- `/clarify` - AI conversation
- `/settings` - User preferences

### Testing Dependencies
- `@playwright/test@^1.49.0` - Test framework
- Playwright browsers installed via `npx playwright install`
