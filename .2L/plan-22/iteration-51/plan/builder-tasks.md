# Builder Task Breakdown - E2E Test Expansion

## Overview

2 primary builders will work in parallel, each responsible for approximately 30 E2E tests.

**Current State:** 39 E2E tests (auth only)
**Target State:** 100+ E2E tests

---

## Builder-1: Dashboard + Dreams E2E Tests

### Scope

Create comprehensive E2E tests for the Dashboard and Dreams pages, including Page Object Models, test fixtures, and spec files. Tests should cover page display, navigation, interactions, and mobile responsiveness.

### Complexity Estimate

**MEDIUM**

Both pages have well-defined UI structures with cards, filters, and navigation. No complex AI interactions or streaming responses.

### Success Criteria

- [ ] `e2e/pages/dashboard.page.ts` created with all locators and methods
- [ ] `e2e/pages/dreams.page.ts` created with all locators and methods
- [ ] `e2e/dashboard/dashboard.spec.ts` with 15+ passing tests
- [ ] `e2e/dreams/dreams.spec.ts` with 15+ passing tests
- [ ] All tests use `authenticatedPage` fixture for auth
- [ ] Mobile viewport tests included
- [ ] No flaky tests (explicit waits only)

### Files to Create

1. `e2e/pages/dashboard.page.ts` - Dashboard Page Object Model
2. `e2e/pages/dreams.page.ts` - Dreams Page Object Model
3. `e2e/dashboard/dashboard.spec.ts` - Dashboard E2E tests
4. `e2e/dreams/dreams.spec.ts` - Dreams E2E tests
5. `e2e/fixtures/test-data.fixture.ts` - Shared test data constants

### Dependencies

**Depends on:** None (can start immediately)
**Blocks:** None (no other builders depend on this)

### Implementation Notes

1. **Dashboard Page (`/dashboard`):**
   - Requires authentication (use `authenticatedPage`)
   - Has 6-7 cards depending on user tier (free vs paid)
   - Cards: Dreams, Reflections, Progress, Evolution, Visualization, Subscription, Clarify (paid only)
   - Has hero section with greeting and reflect CTA
   - Has bottom navigation on mobile only
   - Uses stagger animations (wait for animations)

2. **Dreams Page (`/dreams`):**
   - Requires authentication (use `authenticatedPage`)
   - Has status filters: Active, Achieved, Archived, All
   - Shows limits info (X / Y dreams)
   - Dream cards with reflect/evolve/visualize actions
   - Empty state when no dreams exist
   - Create dream button (modal, don't test full CRUD)

3. **Locator Strategy:**
   - Prefer class-based selectors matching component names
   - Use `data-testid` where available
   - Use text content with `filter({ hasText: })` as fallback

4. **Wait Strategy:**
   - Wait for loader to disappear before assertions
   - Wait for `networkidle` after navigation
   - Use `waitFor({ state: 'visible' })` for dynamic content

### Test Specifications

#### Dashboard Tests (~15 tests)

```
Dashboard
  Page Display
    - displays hero section
    - displays personalized greeting (Good morning/afternoon/evening)
    - displays dreams card
    - displays reflections card
    - displays progress stats card
    - displays evolution card
    - displays visualization card
    - displays subscription card
  Navigation
    - dreams card navigates to /dreams
    - reflections card navigates to /reflections
    - reflect CTA navigates to /reflection
    - evolution card navigates to /evolution
  Interaction
    - refresh button triggers data refresh
  Mobile
    - displays bottom navigation on mobile viewport
    - cards stack vertically on mobile
```

#### Dreams Tests (~15 tests)

```
Dreams
  Page Display
    - displays page title "Your Dreams"
    - displays create dream button
    - displays limits info (X / Y dreams)
    - displays filter buttons
    - active filter is selected by default
  Filters
    - can filter by active status
    - can filter by achieved status
    - can filter by archived status
    - can show all dreams
  Empty State
    - displays empty state when no dreams match filter
    - empty state has create dream CTA
  Dream Cards
    - displays dream cards when dreams exist
    - dream card shows title and description
    - dream card shows category
    - dream card has reflect action button
  Navigation
    - clicking dream card navigates to detail page
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Page Object Model Pattern** for DashboardPage and DreamsPage
- Use **Auth Fixture Pattern** for authenticated tests
- Use **Wait Strategy Patterns** for loading states
- Use **Mobile Test Block Pattern** for mobile viewport tests
- Use **Standard Spec File Structure** for test organization

### Testing Requirements

- All tests must pass in CI (Chromium)
- All tests must pass locally (multi-browser)
- No arbitrary `waitForTimeout` calls
- Tests must be independent (no shared state)

---

## Builder-2: Reflection + Landing E2E Tests

### Scope

Create comprehensive E2E tests for the Reflection flow (desktop and mobile) and Landing page (homepage). Includes Page Object Models, test fixtures, and spec files covering all user journeys.

### Complexity Estimate

**MEDIUM-HIGH**

Reflection flow has multiple steps (dream selection, form, tone, output) and separate mobile flow component. Landing page is simpler but has scroll-triggered animations.

### Success Criteria

- [ ] `e2e/pages/reflection.page.ts` created with all locators and methods
- [ ] `e2e/pages/landing.page.ts` created with all locators and methods
- [ ] `e2e/reflection/reflection.spec.ts` with 20+ passing tests
- [ ] `e2e/landing/landing.spec.ts` with 12+ passing tests
- [ ] All authenticated tests use `authenticatedPage` fixture
- [ ] Mobile reflection flow tests included
- [ ] Desktop reflection flow tests included
- [ ] No flaky tests (explicit waits only)

### Files to Create

1. `e2e/pages/reflection.page.ts` - Reflection Page Object Model
2. `e2e/pages/landing.page.ts` - Landing Page Object Model
3. `e2e/reflection/reflection.spec.ts` - Reflection E2E tests
4. `e2e/landing/landing.spec.ts` - Landing E2E tests

### Dependencies

**Depends on:** None (can start immediately)
**Blocks:** None (no other builders depend on this)

### Implementation Notes

1. **Reflection Page (`/reflection`):**
   - Requires authentication (use `authenticatedPage`)
   - Desktop flow: Dream selection -> Form -> Tone -> Submit -> Output
   - Mobile flow: `MobileReflectionFlow` component with step-based UI
   - Form fields: dream, plan, relationship, offering (textareas)
   - Tone options: Fusion, Gentle, Intense
   - Gazing overlay during submission
   - Output view shows reflection content
   - Demo users see special CTA instead of form
   - URL params: `?dreamId=X` pre-selects dream, `?id=X` shows output

2. **Landing Page (`/`):**
   - No authentication required (public page)
   - Navigation with Sign In / Sign Up links
   - Hero section with title and CTAs
   - Features section with 3 feature cards
   - Footer with links and copyright
   - Scroll-triggered animations

3. **Special Considerations:**
   - Don't actually submit reflections (would create data)
   - Test up to submission button visibility
   - For output tests, use URL with existing reflection ID if available
   - Mobile tests use `devices['iPhone 13']` preset

4. **Locator Strategy:**
   - Form fields: Look for textareas or inputs by name
   - Tone buttons: Look for buttons with tone text
   - Use class-based selectors for components

### Test Specifications

#### Reflection Tests (~20 tests)

```
Reflection
  Page Display
    - displays reflection page when authenticated
    - displays dream selection when no dream selected
    - displays form when dream is selected
    - displays tone selector
    - displays submit button
  Dream Selection
    - shows user's active dreams
    - can select a dream from list
    - shows message when no dreams available
  Form Interaction
    - form fields are editable
    - can fill dream field
    - can fill plan field
    - can fill relationship field
    - can fill offering field
  Tone Selection
    - can select fusion tone
    - can select gentle tone
    - can select intense tone
    - fusion is default selection
  URL Parameters
    - pre-selects dream from ?dreamId parameter
    - shows output view for ?id parameter
  Mobile Flow
    - displays mobile flow on mobile viewport
    - mobile flow has navigation buttons
    - mobile flow shows gazing overlay
  Demo User
    - demo user sees signup CTA instead of form
  Accessibility
    - form fields have labels
    - submit button is enabled when form is valid
```

#### Landing Tests (~12 tests)

```
Landing
  Page Display
    - displays landing page
    - displays navigation
    - displays hero section
    - displays hero title
    - displays CTA buttons
  Navigation
    - sign in link navigates to signin page
    - sign up / get started navigates to signup page
    - pricing link navigates to pricing page
  Features Section
    - displays features section
    - displays 3 feature cards
    - features have titles and descriptions
  Footer
    - displays footer
    - displays copyright notice
    - footer has legal links (Privacy, Terms)
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Page Object Model Pattern** for ReflectionPage and LandingPage
- Use **Auth Fixture Pattern** for reflection tests
- Use **Standard Test Pattern** for landing tests (no auth needed)
- Use **Mobile Test Block Pattern** for mobile reflection tests
- Use **Race Conditions Pattern** for waiting on dream selection OR empty state

### Testing Requirements

- All tests must pass in CI (Chromium)
- All tests must pass locally (multi-browser)
- No arbitrary `waitForTimeout` calls
- Tests must be independent (no shared state)
- Do not submit actual reflections (avoid creating test data)

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

Both builders can start immediately in parallel:

- **Builder-1:** Dashboard + Dreams E2E (~30 tests)
- **Builder-2:** Reflection + Landing E2E (~32 tests)

### Integration Notes

1. **No file conflicts expected:**
   - Builder-1 creates: `dashboard.page.ts`, `dreams.page.ts`, `dashboard.spec.ts`, `dreams.spec.ts`
   - Builder-2 creates: `reflection.page.ts`, `landing.page.ts`, `reflection.spec.ts`, `landing.spec.ts`

2. **Shared fixture file:**
   - Builder-1 creates `e2e/fixtures/test-data.fixture.ts`
   - Builder-2 can import from it if needed (or use inline constants)

3. **Merge verification:**
   - After both builders complete, run full test suite: `npm run test:e2e`
   - Expected result: 100+ tests passing

4. **Final test count:**
   | Category | Existing | Builder-1 | Builder-2 | Total |
   |----------|----------|-----------|-----------|-------|
   | Auth | 39 | 0 | 0 | 39 |
   | Dashboard | 0 | 15 | 0 | 15 |
   | Dreams | 0 | 15 | 0 | 15 |
   | Reflection | 0 | 0 | 20 | 20 |
   | Landing | 0 | 0 | 12 | 12 |
   | **Total** | **39** | **30** | **32** | **101** |

---

## Quick Reference: File Locations

### Builder-1 Files

```
e2e/
  fixtures/
    test-data.fixture.ts     # NEW - Shared test data
  pages/
    dashboard.page.ts        # NEW - Dashboard POM
    dreams.page.ts           # NEW - Dreams POM
  dashboard/
    dashboard.spec.ts        # NEW - Dashboard tests
  dreams/
    dreams.spec.ts           # NEW - Dreams tests
```

### Builder-2 Files

```
e2e/
  pages/
    reflection.page.ts       # NEW - Reflection POM
    landing.page.ts          # NEW - Landing POM
  reflection/
    reflection.spec.ts       # NEW - Reflection tests
  landing/
    landing.spec.ts          # NEW - Landing tests
```

### Existing Files (Do Not Modify)

```
e2e/
  fixtures/
    auth.fixture.ts          # EXISTING - Auth helpers (import for authenticated tests)
  pages/
    signin.page.ts           # EXISTING - SignIn POM (reference for patterns)
    signup.page.ts           # EXISTING - SignUp POM (reference for patterns)
  auth/
    signin.spec.ts           # EXISTING - 20 tests
    signup.spec.ts           # EXISTING - 19 tests
playwright.config.ts         # EXISTING - Playwright config
```
