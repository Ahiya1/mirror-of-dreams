# Master Exploration Report

## Explorer ID
master-explorer-4

## Focus Area
E2E Testing Strategy & User Flows

## Vision Summary
Expand E2E test coverage from 6 spec files to 12+ spec files, covering critical user flows including Profile, Subscription, Admin, Clarify, and Error Handling pages.

---

## Current E2E Test Inventory

### Existing Spec Files (6 total, ~1705 lines)

| Spec File | Test Count | Coverage Focus | Status |
|-----------|------------|----------------|--------|
| `landing/landing.spec.ts` | ~50 tests | Landing page, navigation, features, footer, mobile, accessibility, SEO | COMPLETE |
| `auth/signin.spec.ts` | ~20 tests | Sign in form, navigation, accessibility, form submission | COMPLETE |
| `auth/signup.spec.ts` | ~20 tests | Sign up form, password strength, navigation, accessibility | COMPLETE |
| `dashboard/dashboard.spec.ts` | ~25 tests | Dashboard cards, hero, navigation, mobile responsiveness | COMPLETE |
| `dreams/dreams.spec.ts` | ~30 tests | Dreams list, filters, cards, empty state, create modal, mobile | COMPLETE |
| `reflection/reflection.spec.ts` | ~30 tests | Reflection flow, dream selection, form, tone selection, mobile, demo user | COMPLETE |

### Existing Page Object Models (7 files)

| Page Object | Location | Purpose |
|-------------|----------|---------|
| `signin.page.ts` | `e2e/pages/` | Sign in form interactions |
| `signup.page.ts` | `e2e/pages/` | Sign up form interactions |
| `landing.page.ts` | `e2e/pages/` | Landing page interactions |
| `dashboard.page.ts` | `e2e/pages/` | Dashboard page interactions |
| `dreams.page.ts` | `e2e/pages/` | Dreams list interactions |
| `reflection.page.ts` | `e2e/pages/` | Reflection flow interactions |

### Existing Fixtures (2 files)

| Fixture | Location | Purpose |
|---------|----------|---------|
| `auth.fixture.ts` | `e2e/fixtures/` | Demo login, authenticated page context |
| `test-data.fixture.ts` | `e2e/fixtures/` | Shared test data, constants, timeouts |

---

## Critical User Flows Analysis

### Analyzed Application Routes

Based on exploration of `app/` directory:

**Covered Routes:**
- `/` - Landing page (covered)
- `/auth/signin` - Sign in (covered)
- `/auth/signup` - Sign up (covered)
- `/dashboard` - Dashboard (covered)
- `/dreams` - Dreams list (covered)
- `/reflection` - Reflection flow (covered)

**Uncovered Routes (Critical Gaps):**

| Route | Page Type | Priority | Complexity |
|-------|-----------|----------|------------|
| `/profile` | Authenticated | P0 | MEDIUM |
| `/settings` | Authenticated | P1 | LOW |
| `/pricing` | Public/Authenticated | P1 | MEDIUM |
| `/admin` | Admin-only | P1 | HIGH |
| `/clarify` | Paid users only | P1 | HIGH |
| `/clarify/[sessionId]` | Paid users only | P1 | HIGH |
| `/subscription/success` | Post-payment | P2 | LOW |
| `/subscription/cancel` | Post-payment | P2 | LOW |
| `/dreams/[id]` | Dream detail | P2 | MEDIUM |
| `/dreams/[id]/ceremony` | Dream ceremony | P2 | LOW |
| `/dreams/[id]/ritual` | Dream ritual | P2 | LOW |
| `/evolution` | Evolution list | P2 | MEDIUM |
| `/evolution/[id]` | Evolution detail | P2 | MEDIUM |
| `/reflections` | Reflections list | P2 | MEDIUM |
| `/reflections/[id]` | Reflection detail | P2 | MEDIUM |
| `/visualizations` | Visualizations list | P2 | MEDIUM |
| `/auth/verify-required` | Auth flow | P2 | LOW |
| `/auth/forgot-password` | Auth flow | P2 | LOW |
| `/onboarding` | New user flow | P2 | MEDIUM |

---

## Gaps in E2E Coverage

### Gap 1: Profile & Account Management (HIGH PRIORITY)

**Missing Tests:**
- Profile page display (account info, subscription status, usage stats)
- Edit name functionality
- Change email flow (with password verification)
- Change password flow
- Danger zone / delete account flow (with confirmation)
- Demo user restrictions

**Estimated Test Count:** 15-20 tests

**Complexity:** MEDIUM - Forms with validation, modals, API mutations

### Gap 2: Settings Page (MEDIUM PRIORITY)

**Missing Tests:**
- Settings page display (notification, reflection, display, privacy sections)
- Toggle settings (immediate save)
- Select dropdowns (tone, reminder frequency)
- Tristate options (reduce motion)
- Setting persistence

**Estimated Test Count:** 10-15 tests

**Complexity:** LOW - Toggle interactions with API calls

### Gap 3: Pricing & Subscription Flow (HIGH PRIORITY)

**Missing Tests:**
- Pricing page display (3 tier cards, billing period toggle)
- Unauthenticated vs authenticated view
- Feature comparison display
- FAQ accordion
- Upgrade button behavior (PayPal integration - mocked)
- Current tier highlighting
- Subscription status card on profile

**Estimated Test Count:** 15-20 tests

**Complexity:** MEDIUM - Requires PayPal SDK mocking

### Gap 4: Admin Dashboard (HIGH PRIORITY)

**Missing Tests:**
- Admin authorization (redirect non-admins)
- Stats display (users, reflections, evolution reports)
- Recent users table
- Webhook events table
- Admin/Creator role differentiation

**Estimated Test Count:** 12-15 tests

**Complexity:** HIGH - Requires admin user fixture, authorization testing

### Gap 5: Clarify Agent (HIGH PRIORITY)

**Missing Tests:**
- Clarify page display (session list, limits)
- Free user redirect to pricing
- Create new session
- Session list filtering (active, archived, all)
- Session card interactions (click, dropdown menu)
- Archive/restore/delete session actions
- Empty state with CTA

**Missing for Session Page:**
- Chat interface display
- Message sending (mocked AI response)
- Tool interactions display
- Session title update
- Message streaming indication

**Estimated Test Count:** 25-30 tests

**Complexity:** HIGH - Requires paid user fixture, streaming mocks

### Gap 6: Error Handling (MEDIUM PRIORITY)

**Missing Tests:**
- Error boundary display
- Retry button functionality
- Go home navigation from error
- Network error simulation
- Session expiry handling (401 redirect)
- Rate limit display

**Estimated Test Count:** 8-10 tests

**Complexity:** MEDIUM - Error simulation, network mocking

### Gap 7: Detail Pages (LOW PRIORITY)

**Missing Tests:**
- Dream detail page (`/dreams/[id]`)
- Reflection detail page (`/reflections/[id]`)
- Evolution detail page (`/evolution/[id]`)
- Visualization detail page (`/visualizations/[id]`)

**Estimated Test Count:** 15-20 tests (4-5 per page)

**Complexity:** LOW-MEDIUM - Navigation, data display

---

## Recommended New E2E Test Specs

### Iteration 3 Scope (Per Vision Document)

Based on the vision document Phase 3 (E2E Expansion), recommend the following new spec files:

#### 1. Profile E2E Tests (`e2e/profile/profile.spec.ts`)

```
Priority: P0
Estimated Tests: 18-20
Page Object: profile.page.ts

Test Groups:
- Page Display (5 tests)
  - Loads profile page when authenticated
  - Displays account information section
  - Displays subscription status card
  - Displays usage statistics
  - Displays danger zone

- Account Information (5 tests)
  - Name is editable
  - Can save new name
  - Email is displayed (not editable directly)
  - Change email modal works
  - Demo user sees restrictions

- Password Management (4 tests)
  - Change password section exists
  - Password change requires current password
  - Validation for new password
  - Success/error feedback

- Danger Zone (4 tests)
  - Delete account requires confirmation
  - Email confirmation must match
  - Password required for deletion
  - Cancel closes modal without action
```

#### 2. Subscription E2E Tests (`e2e/subscription/subscription.spec.ts`)

```
Priority: P1
Estimated Tests: 15-18
Page Object: pricing.page.ts

Test Groups:
- Pricing Page Display (5 tests)
  - Displays three pricing tiers
  - Billing period toggle works
  - FAQ accordion expands/collapses
  - Shows correct prices for monthly/yearly
  - Current tier is highlighted for logged-in users

- Subscription Flow (5 tests)
  - Upgrade button visible on lower tiers
  - Free users see upgrade prompts
  - PayPal checkout modal (mocked)
  - Success page redirect
  - Cancel page redirect

- Usage Limits (5 tests)
  - Usage displayed on profile
  - Warning when approaching limit
  - Feature lock overlay (for free users on paid features)
```

#### 3. Admin E2E Tests (`e2e/admin/admin.spec.ts`)

```
Priority: P1
Estimated Tests: 12-15
Fixtures: admin.fixture.ts (new)
Page Object: admin.page.ts

Test Groups:
- Authorization (4 tests)
  - Non-admin redirected to dashboard
  - Non-authenticated redirected to signin
  - Admin can access page
  - Creator can access page

- Stats Display (4 tests)
  - User stats cards visible
  - Reflection stats visible
  - Evolution report stats visible
  - Artifact stats visible

- Data Tables (4 tests)
  - Recent users table displays
  - Webhook events table displays
  - Tables show correct data format
  - Empty state when no data
```

#### 4. Clarify E2E Tests (`e2e/clarify/clarify.spec.ts`)

```
Priority: P1
Estimated Tests: 20-25
Fixtures: paid-user.fixture.ts (new)
Page Object: clarify.page.ts

Test Groups:
- Access Control (4 tests)
  - Free users redirected to pricing
  - Paid users can access
  - Demo users (paid tier) can access
  - Email verification required

- Session List (6 tests)
  - Displays session list
  - Shows session count limits
  - Filter by status works
  - Empty state with CTA
  - Session cards show message count
  - Session cards show last message time

- Session Actions (5 tests)
  - Can create new session
  - Can archive session
  - Can restore archived session
  - Can delete session (with confirmation)
  - Dropdown menu interactions

- Session Detail (6 tests)
  - Chat interface displays
  - Message input works
  - Previous messages display
  - Tool use indicators visible
  - Back navigation works
```

#### 5. Error Handling E2E Tests (`e2e/error/error.spec.ts`)

```
Priority: P1
Estimated Tests: 8-10
Page Object: error.page.ts (new)

Test Groups:
- Error Boundary (4 tests)
  - Error page displays on route error
  - Retry button triggers reset
  - Go home button navigates to landing
  - Error digest displayed

- Network Errors (3 tests)
  - Handles API timeout gracefully
  - Shows error toast on mutation failure
  - Maintains UI state on transient errors

- Session Handling (3 tests)
  - 401 redirects to signin
  - Session refresh on token expiry
  - Rate limit error display
```

---

## E2E Infrastructure Improvements Needed

### 1. New Fixtures Required

**`e2e/fixtures/admin.fixture.ts`**
- Admin user login (may require test admin account or mock)
- Creator user login
- Authorization context for admin tests

**`e2e/fixtures/paid-user.fixture.ts`**
- Paid tier user context
- Mock subscription status
- Elevated limits for Clarify testing

**`e2e/fixtures/network.fixture.ts`**
- Network error simulation
- API timeout simulation
- Rate limit simulation

### 2. New Page Objects Required

| Page Object | For Spec File | Complexity |
|-------------|---------------|------------|
| `profile.page.ts` | profile.spec.ts | MEDIUM |
| `pricing.page.ts` | subscription.spec.ts | MEDIUM |
| `admin.page.ts` | admin.spec.ts | HIGH |
| `clarify.page.ts` | clarify.spec.ts | HIGH |
| `clarify-session.page.ts` | clarify.spec.ts | HIGH |
| `error.page.ts` | error.spec.ts | LOW |

### 3. Mock Infrastructure

**PayPal SDK Mocking:**
- Intercept PayPal SDK loading
- Mock PayPal buttons and checkout flow
- Simulate success/cancel/error returns

**AI Response Mocking:**
- Mock Clarify agent streaming responses
- Mock tool use responses
- Simulate conversation flow

### 4. Playwright Configuration Updates

**Current Configuration Analysis:**
```typescript
// Current playwright.config.ts - GOOD
- testDir: './e2e' (correct)
- fullyParallel: true (correct)
- retries: CI ? 2 : 0 (correct for flaky protection)
- workers: CI ? 1 : undefined (conservative for CI)
- screenshot: 'only-on-failure' (correct)
- trace: 'on-first-retry' (correct for debugging)
- webServer configured (correct)
```

**Recommended Updates:**
```typescript
// Add to projects for admin/paid-user tests
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'chromium-admin',
    use: {
      ...devices['Desktop Chrome'],
      storageState: '.playwright/admin-storage.json'
    },
    testMatch: '**/admin/**',
  },
  {
    name: 'chromium-paid',
    use: {
      ...devices['Desktop Chrome'],
      storageState: '.playwright/paid-storage.json'
    },
    testMatch: '**/clarify/**',
  },
]
```

### 5. Test Data Management

**Recommended Test Data Strategy:**
- Use demo user for basic authenticated tests (current approach - GOOD)
- Create admin fixture with mock admin user context
- Create paid-user fixture with mock subscription context
- Avoid creating real test data that persists

---

## Implementation Recommendations

### Recommended Iteration Breakdown

**Sub-iteration 3A: Profile & Settings E2E (2-3 hours)**
- Create `profile.page.ts`
- Create `profile.spec.ts` (18-20 tests)
- Create `settings.spec.ts` (10-15 tests) - optional, lower priority

**Sub-iteration 3B: Subscription E2E (2-3 hours)**
- Create `pricing.page.ts`
- Create `subscription.spec.ts` (15-18 tests)
- Add PayPal mock infrastructure

**Sub-iteration 3C: Admin E2E (2-3 hours)**
- Create `admin.fixture.ts`
- Create `admin.page.ts`
- Create `admin.spec.ts` (12-15 tests)

**Sub-iteration 3D: Clarify E2E (3-4 hours)**
- Create `paid-user.fixture.ts`
- Create `clarify.page.ts` and `clarify-session.page.ts`
- Create `clarify.spec.ts` (20-25 tests)

**Sub-iteration 3E: Error Handling E2E (1-2 hours)**
- Create `network.fixture.ts`
- Create `error.page.ts`
- Create `error.spec.ts` (8-10 tests)

### Test Count Projections

| Spec File | Estimated Tests |
|-----------|-----------------|
| Existing (6 files) | ~175 tests |
| profile.spec.ts | 18-20 tests |
| subscription.spec.ts | 15-18 tests |
| admin.spec.ts | 12-15 tests |
| clarify.spec.ts | 20-25 tests |
| error.spec.ts | 8-10 tests |
| **Total** | **~250-265 tests** |

This exceeds the vision target of "~150 E2E tests" but provides comprehensive coverage.

---

## Risk Assessment

### High Risks

- **PayPal Integration Mocking:** Complex to mock PayPal SDK behavior accurately
  - **Mitigation:** Use Playwright route interception, focus on UI flows not payment processing
  - **Recommendation:** Start with simpler UI tests, add payment flow tests as infrastructure matures

- **Admin User Fixture:** May require test admin account in database
  - **Mitigation:** Use mock authorization context, not actual admin database records
  - **Recommendation:** Create fixture that mocks `useAuth` response for admin context

### Medium Risks

- **Clarify Streaming:** AI response streaming is complex to mock
  - **Mitigation:** Mock at network level, simulate incremental text updates
  - **Recommendation:** Focus on UI state changes, not actual AI responses

- **Test Flakiness:** New authenticated flows may be less stable than demo user
  - **Mitigation:** Use existing auth fixture patterns, add explicit waits
  - **Recommendation:** Run new tests 10x in CI before merge

### Low Risks

- **Page Object Patterns:** Well-established patterns exist
- **Test Data:** Demo user provides consistent baseline
- **Playwright Config:** Current config is well-optimized

---

## Summary

### Current State
- 6 E2E spec files covering core user journeys
- ~175 tests across landing, auth, dashboard, dreams, reflection
- Well-established Page Object Model patterns
- Robust auth fixture using demo login

### Target State
- 11+ E2E spec files (minimum 12 per vision)
- ~250-265 tests total
- Coverage of Profile, Subscription, Admin, Clarify, Error Handling
- Enhanced fixtures for admin and paid user contexts
- Mock infrastructure for external services (PayPal, AI)

### Key Success Criteria
1. All 6 existing spec files remain stable (0 regressions)
2. 5+ new spec files added covering vision Phase 3 requirements
3. All tests pass consistently (0% flaky rate)
4. E2E tests complete in <5 minutes locally
5. Admin and Clarify flows have dedicated test coverage

---

*Exploration completed: 2025-12-12T17:15:00Z*
*This report informs master planning decisions for Plan 24 E2E Expansion (Phase 3)*
