# Builder Task Breakdown - E2E Test Expansion

## Overview

4 primary builders will work on this iteration.
Builder-1 must complete infrastructure before Builders 2-4 can fully execute.

## Builder Assignment Strategy

- Builder-1: Infrastructure - fixtures and page objects (BLOCKING)
- Builder-2: Profile + Settings E2E specs
- Builder-3: Admin + Subscription E2E specs
- Builder-4: Clarify + Error handling E2E specs

---

## Builder-1: Infrastructure (Fixtures + Page Objects)

### Scope

Create the foundational testing infrastructure: 3 new fixtures and 6 new page objects that all other builders depend on.

### Complexity Estimate

**HIGH**

This builder creates the foundation. Quality here determines success of all other builders.

### Success Criteria

- [ ] `admin.fixture.ts` created with admin authentication helper
- [ ] `paid-user.fixture.ts` created with paid tier access helper
- [ ] `network.fixture.ts` created with network simulation utilities
- [ ] `profile.page.ts` created with full Page Object Model
- [ ] `settings.page.ts` created with full Page Object Model
- [ ] `pricing.page.ts` created with full Page Object Model
- [ ] `admin.page.ts` created with full Page Object Model
- [ ] `clarify-list.page.ts` created with full Page Object Model
- [ ] `clarify-session.page.ts` created with full Page Object Model
- [ ] All fixtures export properly typed interfaces
- [ ] All page objects follow existing POM patterns

### Files to Create

| File | Purpose |
|------|---------|
| `e2e/fixtures/admin.fixture.ts` | Admin/Creator authentication fixture |
| `e2e/fixtures/paid-user.fixture.ts` | Paid tier user authentication fixture |
| `e2e/fixtures/network.fixture.ts` | Network error simulation utilities |
| `e2e/pages/profile.page.ts` | Profile page interactions |
| `e2e/pages/settings.page.ts` | Settings page interactions |
| `e2e/pages/pricing.page.ts` | Pricing page interactions |
| `e2e/pages/admin.page.ts` | Admin dashboard interactions |
| `e2e/pages/clarify-list.page.ts` | Clarify list page interactions |
| `e2e/pages/clarify-session.page.ts` | Clarify chat session interactions |

### Dependencies

**Depends on:** Nothing (first to execute)
**Blocks:** Builder-2, Builder-3, Builder-4

### Implementation Notes

1. **Admin Fixture Strategy:**
   - Demo user has `isCreator: true` which grants admin access
   - Use demo login flow (via "Try It" button)
   - No separate admin credentials needed
   - Export `adminPage` fixture for admin-authenticated context

2. **Paid User Fixture Strategy:**
   - Demo user has creator privileges = bypasses tier restrictions
   - Same implementation as admin fixture
   - Export `paidUserPage` fixture
   - Include helper `hasPaidAccess()` for verification

3. **Network Fixture Strategy:**
   - Use Playwright's `page.route()` for interception
   - Create `withNetworkOffline()` - abort all API requests
   - Create `withSlowNetwork(delayMs)` - add delay to requests
   - Create `withApiError(urlPattern, statusCode)` - return error responses
   - Export utility functions and extended test fixture

4. **Page Object Pattern:**
   - Follow existing patterns in `e2e/pages/dashboard.page.ts`
   - Constructor receives `Page`, initializes `Locator` properties
   - Include `goto()`, `waitForLoad()` methods
   - Include `expect*()` assertion methods
   - Use semantic selectors (aria, role, text) where possible
   - Fallback to CSS classes matching existing conventions

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use admin.fixture.ts pattern for admin authentication
- Use page object structure from profile.page.ts pattern
- Follow network.fixture.ts pattern for simulation utilities

### Testing Requirements

- No spec files required from Builder-1
- Fixtures should be manually verified by creating a simple test
- Page objects will be validated by Builders 2-4

### Estimated Duration

2-3 hours

---

## Builder-2: Profile E2E + Settings E2E

### Scope

Create comprehensive E2E tests for the Profile and Settings pages, covering display, interactions, and mobile responsiveness.

### Complexity Estimate

**MEDIUM**

Straightforward page testing with well-defined page objects from Builder-1.

### Success Criteria

- [ ] `e2e/profile/profile.spec.ts` created with ~15 tests
- [ ] `e2e/settings/settings.spec.ts` created with ~10 tests
- [ ] All tests pass locally
- [ ] Mobile viewport tests included
- [ ] Demo user restrictions tested
- [ ] Settings toggle behavior tested

### Files to Create

| File | Purpose |
|------|---------|
| `e2e/profile/profile.spec.ts` | Profile page E2E tests |
| `e2e/settings/settings.spec.ts` | Settings page E2E tests |

### Dependencies

**Depends on:** Builder-1 (profile.page.ts, settings.page.ts, auth.fixture.ts)
**Blocks:** Nothing

### Implementation Notes

#### Profile Tests (~15 tests)

**Page Display (6 tests):**
- loads profile page successfully
- displays page title
- displays demo user banner for demo account
- displays account information section
- displays usage statistics section
- displays subscription status card

**Edit Name (2 tests):**
- displays edit name button
- edit name button is disabled for demo user (or shows warning)

**Account Actions (3 tests):**
- displays change password option
- displays delete account button
- delete account button opens confirmation modal

**Usage Statistics (2 tests):**
- displays reflections this month count
- displays total reflections count

**Mobile (2 tests):**
- displays correctly on mobile viewport
- all sections are visible on mobile

#### Settings Tests (~10 tests)

**Page Display (3 tests):**
- loads settings page successfully
- displays all preference sections
- displays notification preferences section

**Toggle Behavior (4 tests):**
- toggles email notifications
- changes default tone selection
- toggles analytics preference
- changes reflection reminders selection

**Save Behavior (2 tests):**
- shows success feedback after toggle
- persists setting change on page reload

**Mobile (1 test):**
- displays correctly on mobile viewport

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use Profile Spec Pattern for test structure
- Follow test naming convention
- Use mobile viewport pattern with manual demo login

### Testing Requirements

- All tests use `authenticatedPage` fixture from `auth.fixture.ts`
- Mobile tests require manual demo login due to fixture limitations
- Use `test.skip()` gracefully if demo login unavailable

### Estimated Duration

1.5-2 hours

---

## Builder-3: Admin E2E + Subscription E2E

### Scope

Create comprehensive E2E tests for the Admin Dashboard and Subscription/Pricing pages, including authorization checks and tier card display.

### Complexity Estimate

**MEDIUM-HIGH**

Admin tests require proper authorization handling. Subscription tests need billing toggle verification.

### Success Criteria

- [ ] `e2e/admin/admin.spec.ts` created with ~12 tests
- [ ] `e2e/subscription/subscription.spec.ts` created with ~12 tests
- [ ] Admin authorization tests verify redirect behavior
- [ ] All stats cards tested
- [ ] Pricing page tier cards tested
- [ ] Billing period toggle tested
- [ ] FAQ accordion tested

### Files to Create

| File | Purpose |
|------|---------|
| `e2e/admin/admin.spec.ts` | Admin dashboard E2E tests |
| `e2e/subscription/subscription.spec.ts` | Pricing/subscription E2E tests |

### Dependencies

**Depends on:** Builder-1 (admin.page.ts, pricing.page.ts, admin.fixture.ts)
**Blocks:** Nothing

### Implementation Notes

#### Admin Tests (~12 tests)

**Authorization (3 tests):**
- allows admin/creator access to admin page
- redirects non-authenticated users to signin
- displays admin or creator role badge

**Stats Display (4 tests):**
- displays total users stat card
- displays tier breakdown stats (free, pro, unlimited)
- displays total reflections stat
- displays evolution reports and artifacts stats

**Users Table (3 tests):**
- displays recent users section header
- shows user table with columns (email, tier, status)
- displays at least one user row (or empty state)

**Webhook Events (2 tests):**
- displays webhook events section
- shows webhook table or empty state message

#### Subscription Tests (~12 tests)

**Page Display (4 tests):**
- loads pricing page successfully
- displays page title and subtitle
- displays three tier cards (Wanderer, Seeker, Devoted)
- marks Seeker as popular tier

**Billing Toggle (3 tests):**
- displays monthly/yearly toggle buttons
- switches to yearly billing on click
- displays "Save 17%" badge on yearly option

**Tier Cards (3 tests):**
- displays feature lists on each card
- shows correct pricing for selected billing period
- displays CTA buttons on each card

**FAQ Section (2 tests):**
- displays FAQ section with questions
- expands FAQ item on click

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use Admin Spec Pattern for authorization tests
- Use admin.fixture.ts for authenticated admin tests
- Use base test for non-authenticated redirect tests

### Testing Requirements

- Admin tests use `adminPage` fixture from `admin.fixture.ts`
- Non-admin redirect test uses base Playwright `test`
- Subscription tests can use `page` (no auth required for pricing)
- Authenticated subscription tests use `authenticatedPage`

### Estimated Duration

1.5-2 hours

---

## Builder-4: Clarify E2E + Error Handling E2E

### Scope

Create comprehensive E2E tests for the Clarify feature (sessions list and chat) and error handling scenarios (network errors, session expiry).

### Complexity Estimate

**HIGH**

Clarify has access control complexity. Error handling requires network mocking.

### Success Criteria

- [ ] `e2e/clarify/clarify.spec.ts` created with ~15 tests
- [ ] `e2e/error/error.spec.ts` created with ~10 tests
- [ ] Access control (free vs paid) tested
- [ ] Session list management tested
- [ ] Network error scenarios tested
- [ ] Session expiry handling tested

### Files to Create

| File | Purpose |
|------|---------|
| `e2e/clarify/clarify.spec.ts` | Clarify feature E2E tests |
| `e2e/error/error.spec.ts` | Error handling E2E tests |

### Dependencies

**Depends on:** Builder-1 (clarify-list.page.ts, clarify-session.page.ts, paid-user.fixture.ts, network.fixture.ts)
**Blocks:** Nothing

### Implementation Notes

#### Clarify Tests (~15 tests)

**Access Control (3 tests):**
- allows paid user access to clarify page
- displays clarify page for creator/admin users
- would redirect free users to pricing (test with mock or verify demo has access)

**Page Display (4 tests):**
- displays page title and subtitle
- displays session limits card
- displays filter buttons (Active, Archived, All)
- displays new conversation button

**Session List (4 tests):**
- displays session cards when sessions exist
- shows empty state when no sessions
- shows session title and message count
- shows timestamp on session cards

**Session Management (2 tests):**
- can filter sessions by status (Active/Archived)
- displays session options dropdown on hover

**Chat Interface (2 tests):**
- navigates to session page on card click
- displays message input on session page

#### Error Handling Tests (~10 tests)

**Network Errors (4 tests):**
- handles offline state gracefully
- shows error indication when API unavailable
- recovers when network restored
- handles slow network without crashing

**API Errors (3 tests):**
- handles 500 server error gracefully
- handles 401 unauthorized error
- displays meaningful error message to user

**Session Expiry (3 tests):**
- redirects to signin when session expired
- handles cleared cookies gracefully
- preserves URL for post-login redirect (if applicable)

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use paid-user.fixture.ts for Clarify access
- Use network.fixture.ts for error simulation
- Use Error Handling Spec Pattern structure

### Testing Requirements

- Clarify tests use `paidUserPage` fixture (demo user has access)
- Error tests use `networkPage` fixture with simulation helpers
- Session expiry tests use `authenticatedPage` then clear cookies
- Handle race conditions in network tests gracefully

### Special Considerations

1. **Clarify AI Responses:**
   - Do NOT test AI response content (non-deterministic)
   - Test UI states: loading, input visible, message sent
   - Verify navigation and list management

2. **Network Error Recovery:**
   - Use `page.unrouteAll()` to restore network
   - Verify page can recover after error

3. **Session Expiry:**
   - Use `context.clearCookies()` to simulate expiry
   - Verify redirect happens without crash

### Estimated Duration

2-2.5 hours

---

## Builder Execution Order

### Phase 1 (Sequential - BLOCKING)

```
Builder-1: Infrastructure (fixtures + page objects)
Duration: 2-3 hours
```

### Phase 2 (Parallel - after Builder-1 completes)

```
Builder-2: Profile + Settings E2E ─┐
                                   ├── All can run in parallel
Builder-3: Admin + Subscription E2E┤
                                   │
Builder-4: Clarify + Error E2E ────┘

Duration: 1.5-2.5 hours each
```

### Total Timeline

- Builder-1: 2-3 hours (sequential)
- Builders 2-4: 2-2.5 hours (parallel)
- **Total: ~4-5 hours**

---

## Integration Notes

### No File Conflicts Expected

Each builder works in isolated directories:
- Builder-1: `e2e/fixtures/`, `e2e/pages/`
- Builder-2: `e2e/profile/`, `e2e/settings/`
- Builder-3: `e2e/admin/`, `e2e/subscription/`
- Builder-4: `e2e/clarify/`, `e2e/error/`

### Shared Dependencies

All builders import from:
- `e2e/fixtures/auth.fixture.ts` (existing)
- `e2e/fixtures/test-data.fixture.ts` (existing)
- New fixtures created by Builder-1

### Validation

After all builders complete:
1. Run `npm run test:e2e` to verify all tests pass
2. Check for test isolation (no interdependencies)
3. Verify mobile tests work correctly
4. Run 3x to catch any flaky tests

---

## Summary Table

| Builder | Scope | Tests | Files | Duration | Complexity |
|---------|-------|-------|-------|----------|------------|
| Builder-1 | Infrastructure | 0 | 9 | 2-3h | HIGH |
| Builder-2 | Profile + Settings | ~25 | 2 | 1.5-2h | MEDIUM |
| Builder-3 | Admin + Subscription | ~24 | 2 | 1.5-2h | MEDIUM-HIGH |
| Builder-4 | Clarify + Error | ~25 | 2 | 2-2.5h | HIGH |

**Total New Tests: ~75**
**Total New Files: 15**
**Total E2E Spec Files After: 11 (was 6)**
