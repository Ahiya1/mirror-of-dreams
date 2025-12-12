# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Test Infrastructure Analysis

## Vision Summary
Increase test coverage from 79% to 95%+ by closing gaps in server-side code (clarify router, auth router, cookies, supabase client, tRPC core), component testing (subscription, clarify, dashboard components), and expanding E2E test suite from 6 to 12+ spec files.

---

## Current Test Infrastructure Assessment

### Test Framework Configuration

**Vitest Configuration (`vitest.config.ts`):**
- Framework: Vitest with v8 coverage provider
- Environment: happy-dom (fast DOM simulation)
- React support: @vitejs/plugin-react
- Setup file: `./vitest.setup.ts`
- Coverage reporters: text, json, html, lcov, json-summary

**Current Coverage Thresholds:**
| Metric | Threshold | Current |
|--------|-----------|---------|
| Lines | 78% | 79.04% |
| Statements | 78% | 79.01% |
| Branches | 71% | 71.81% |
| Functions | 71% | 71.57% |

**Coverage Include Patterns:**
- `lib/**/*.ts`
- `server/**/*.ts`
- `types/**/*.ts`
- `components/**/*.tsx`

**Path Aliases:**
- `@/` -> project root
- `@/components` -> ./components
- `@/lib` -> ./lib
- `@/types` -> ./types
- `@/server` -> ./server
- `@/test` -> ./test

### E2E Test Infrastructure (Playwright)

**Playwright Configuration (`playwright.config.ts`):**
- Test directory: `./e2e`
- Base URL: `http://localhost:3000`
- Browsers: Chromium (CI), Chromium + Firefox + Mobile Safari (local)
- Web server: Auto-starts `npm run dev`
- Timeouts: 60s test, 15s action, 30s navigation
- Retries: 2 in CI, 0 locally
- Artifacts: Screenshots on failure, trace on first retry

**Current E2E Test Files (6):**
1. `/e2e/auth/signin.spec.ts` - Sign-in flow tests
2. `/e2e/auth/signup.spec.ts` - Sign-up flow tests
3. `/e2e/landing/landing.spec.ts` - Landing page tests
4. `/e2e/dashboard/dashboard.spec.ts` - Dashboard tests
5. `/e2e/dreams/dreams.spec.ts` - Dreams CRUD tests
6. `/e2e/reflection/reflection.spec.ts` - Reflection flow tests

**E2E Page Objects (`/e2e/pages/`):**
- `signin.page.ts`, `signup.page.ts` (auth)
- `dashboard.page.ts`, `dreams.page.ts`, `reflection.page.ts`, `landing.page.ts`

**E2E Fixtures (`/e2e/fixtures/`):**
- `auth.fixture.ts` - Authentication helpers
- `test-data.fixture.ts` - Test data generation

### Test Utilities & Mocks

**Mock Infrastructure (`/test/mocks/`):**
1. **`supabase.ts`** - Comprehensive Supabase client mock
   - `createSupabaseQueryMock()` - Chainable query builder mock
   - `createSupabaseAuthMock()` - Auth operations mock
   - `createSupabaseStorageMock()` - Storage operations mock
   - Common error scenarios predefined

2. **`anthropic.ts`** - Anthropic AI client mock
   - For mocking AI responses in clarify tests

3. **`cookies.ts`** - Cookie handling mock
   - For testing auth cookie operations

**Test Factories (`/test/factories/`):**
- `user.factory.ts` - User creation (free, pro, unlimited, creator, admin, demo)
- `dream.factory.ts` - Dream entity creation
- `clarify.factory.ts` - Clarify session/message creation
- `reflection.factory.ts` - Reflection creation
- `index.ts` - Export aggregation

**Test Helpers (`/test/helpers/`):**
- `trpc.ts` - Comprehensive tRPC mock utilities
  - `createMockQueryResult<T>()` - Success state
  - `createMockLoadingResult<T>()` - Loading state
  - `createMockErrorResult<T>()` - Error state
  - `createMockMutation<I, O>()` - Mutation mocks
  - `createMockInfiniteQueryResult<T>()` - Pagination mocks
  - `createMockContext()` - tRPC context for direct procedure testing
- `index.ts` - Export aggregation

**Test Fixtures (`/test/fixtures/`):**
- `users.ts`, `dreams.ts`, `reflections.ts`, `evolution.ts`
- `visualizations.ts`, `subscriptions.ts`, `lifecycle.ts`, `form-data.ts`

**Integration Test Setup (`/test/integration/setup.ts`):**
- Centralized test caller setup
- Mock configuration for Anthropic, cache, and Supabase

---

## Codebase Structure Analysis

### Server-Side Code Organization

```
server/
├── lib/
│   ├── __tests__/           # Unit tests for lib modules
│   ├── api-rate-limit.ts
│   ├── cache.ts
│   ├── config.ts
│   ├── cookies.ts           # 42 lines - 33.33% coverage
│   ├── cost-calculator.ts
│   ├── email.ts
│   ├── logger.ts
│   ├── paypal.ts
│   ├── prompts.ts
│   ├── rate-limiter.ts
│   ├── supabase.ts          # 9 lines - 0% coverage
│   └── temporal-distribution.ts
└── trpc/
    ├── __tests__/           # tRPC core tests
    ├── context.ts           # 88.88% coverage
    ├── middleware.ts        # 100% coverage
    ├── trpc.ts              # 45 lines - 57.14% coverage
    └── routers/
        ├── __tests__/       # Router tests (empty directory)
        ├── _app.ts
        ├── admin.ts         # 100% coverage
        ├── artifact.ts      # 100% coverage
        ├── auth.ts          # 445 lines - 70.21% coverage
        ├── clarify.ts       # 731 lines - 45.62% coverage (HIGHEST PRIORITY)
        ├── dreams.ts
        ├── evolution.ts
        ├── lifecycle.ts
        ├── reflection.ts
        ├── reflections.ts
        ├── subscriptions.ts
        ├── users.ts         # 90% coverage
        └── visualizations.ts
```

### Component Structure Analysis

```
components/
├── auth/                    # AuthLayout tested
├── clarify/
│   └── ClarifyCard.tsx      # 0% - NEEDS TESTING
├── dashboard/
│   ├── __tests__/
│   │   └── DashboardHero.test.tsx
│   ├── cards/
│   │   ├── __tests__/       # Has DreamsCard, EvolutionCard, ReflectionsCard, VisualizationCard, UsageCard tests
│   │   ├── DreamsCard.tsx   # 100% coverage (done)
│   │   ├── EvolutionCard.tsx # 100% coverage (done)
│   │   ├── ProgressStatsCard.tsx  # NEEDS TESTING (was QuickStatsCard)
│   │   ├── ReflectionsCard.tsx
│   │   ├── SubscriptionCard.tsx
│   │   ├── UsageCard.tsx
│   │   └── VisualizationCard.tsx
│   └── shared/              # Has tests
├── dreams/
│   └── __tests__/           # Has DreamCard, CreateDreamModal, EvolutionHistory, EvolutionModal tests
├── error/                   # Has ErrorFallback test
├── icons/                   # Has icon tests
├── landing/                 # Has landing tests
├── navigation/
├── profile/
├── providers/
├── reflection/              # Comprehensive tests
├── reflections/             # Has tests
├── shared/
│   ├── __tests__/           # Has Toast, EmptyState, DemoBanner, MarkdownPreview, LandingNavigation tests
│   ├── AppNavigation.tsx
│   ├── CosmicBackground.tsx
│   ├── DemoBanner.tsx       # Tested
│   ├── EmptyState.tsx       # Tested
│   ├── LandingNavigation.tsx # Tested
│   ├── MarkdownPreview.tsx  # Tested
│   ├── MobileNavigationMenu.tsx # NEEDS TESTING
│   ├── NavigationBase.tsx   # NEEDS TESTING
│   ├── Toast.tsx            # Tested
│   └── UserDropdownMenu.tsx # NEEDS TESTING
├── subscription/
│   ├── __tests__/           # Has CheckoutButton, FeatureLockOverlay, PricingCard, UpgradeModal, UsageWarningBanner tests
│   ├── CancelSubscriptionModal.tsx # NEEDS TESTING
│   ├── CheckoutButton.tsx   # Tested
│   ├── FeatureLockOverlay.tsx # Tested
│   ├── PayPalCheckoutModal.tsx # NEEDS TESTING
│   ├── PricingCard.tsx      # Tested
│   ├── SubscriptionStatusCard.tsx # NEEDS TESTING
│   ├── UpgradeModal.tsx     # Tested
│   └── UsageWarningBanner.tsx # Tested
└── ui/                      # Comprehensive tests
```

### Test File Count
- **Total test files:** 275
- **Server lib tests:** 16 files
- **Component tests:** ~58 files
- **Integration tests:** ~20 files
- **E2E tests:** 6 files

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 17 (15 must-have + 2 should-have)
- **User stories/acceptance criteria:** ~75 acceptance criteria items
- **Estimated total work:** 18-24 hours

### Complexity Rating
**Overall Complexity: MEDIUM**

**Rationale:**
1. Well-established test infrastructure already exists (mocks, factories, helpers)
2. Most low-coverage files are smaller modules (cookies 42 lines, supabase 9 lines, trpc.ts 45 lines)
3. Clarify router (731 lines, 45.62% coverage) is the largest gap but has integration test patterns available
4. Component testing follows established patterns in the codebase
5. E2E infrastructure is mature - just need more spec files

---

## Architectural Analysis

### Test Categories

1. **Server-Side Unit/Integration Tests**
   - **Purpose:** Test tRPC routers, services, and utilities
   - **Complexity:** MEDIUM-HIGH for clarify router (AI mocking, tool use flows)
   - **Existing patterns:** `test/integration/` has comprehensive examples

2. **Component Unit Tests**
   - **Purpose:** Test React components in isolation
   - **Complexity:** LOW-MEDIUM (existing patterns available)
   - **Existing patterns:** `components/**/__tests__/` with testing-library

3. **E2E Tests**
   - **Purpose:** Test user flows end-to-end
   - **Complexity:** MEDIUM (page objects exist, fixtures available)
   - **Existing patterns:** `e2e/` with Playwright + page object model

### Critical Code Analysis

**Clarify Router (`server/trpc/routers/clarify.ts` - 731 lines, 45.62%):**
- 12 procedures: createSession, getSession, listSessions, sendMessage, archiveSession, restoreSession, updateTitle, deleteSession, getLimits, getPatterns
- Complex AI interaction with Anthropic SDK
- Tool use flows (createDream tool)
- Session/message management
- Rate limiting and access control
- **Risk:** AI mocking complexity, async streaming patterns

**Auth Router (`server/trpc/routers/auth.ts` - 445 lines, 70.21%):**
- 10 procedures: signup, signin, verifyToken, signout, me, updateProfile, changePassword, deleteAccount, loginDemo
- JWT token generation/validation
- Password hashing with bcrypt
- Email verification flow
- Demo user handling
- **Risk:** Security-critical code needs careful testing

**Cookies Module (`server/lib/cookies.ts` - 42 lines, 33.33%):**
- 3 functions: setAuthCookie, getAuthCookie, clearAuthCookie
- Uses Next.js cookies() API
- **Challenge:** next/headers requires mocking

**Supabase Client (`server/lib/supabase.ts` - 9 lines, 0%):**
- Single export: supabase client instance
- Uses environment variables for config
- **Challenge:** Client initialization testing

**tRPC Core (`server/trpc/trpc.ts` - 45 lines, 57.14%):**
- Router, procedure, middleware exports
- Error formatter with Sentry integration
- **Challenge:** Testing error formatting with Sentry mock

---

## Recommended Test Patterns

### Pattern 1: Server Router Integration Tests
```typescript
// Using existing test/integration/setup.ts pattern
import { createTestCaller, supabaseMock } from '../setup';
import { proTierUser } from '@/test/factories/user.factory';

describe('router.procedure', () => {
  it('should handle success case', async () => {
    // Configure Supabase mock
    supabaseMock.from.mockReturnValue(createSupabaseQueryMock({ data: mockData }));

    const { caller } = createTestCaller(proTierUser);
    const result = await caller.router.procedure(input);

    expect(result).toEqual(expected);
  });
});
```

### Pattern 2: Component Tests with tRPC Mocks
```typescript
// Using existing test/helpers/trpc.ts pattern
import { createMockQueryResult, createMockMutation } from '@/test/helpers/trpc';
import { renderWithProviders } from '@/test/utils';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    router: {
      query: { useQuery: vi.fn() },
      mutation: { useMutation: vi.fn() },
    },
  },
}));

describe('Component', () => {
  it('renders with data', () => {
    vi.mocked(trpc.router.query.useQuery).mockReturnValue(
      createMockQueryResult(mockData)
    );

    render(<Component />);
    expect(screen.getByText('expected')).toBeInTheDocument();
  });
});
```

### Pattern 3: E2E Tests with Page Objects
```typescript
// Using existing e2e/pages pattern
import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pages/profile.page';

test.describe('Profile Flow', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('displays profile information', async () => {
    await profilePage.expectProfileVisible();
  });
});
```

---

## Iteration Breakdown Recommendation

### Recommendation: MULTI-ITERATION (3 phases)

**Rationale:**
- Clear separation between server-side, component, and E2E testing
- Each iteration builds on previous work (server -> components -> E2E)
- Allows progressive coverage increases with verification at each stage
- Estimated total work: ~18-24 hours

---

### Iteration 1: Server-Side Gap Closure (P0)

**Vision:** Eliminate all server-side coverage gaps by testing remaining routers and modules.

**Scope:**
- Clarify router tests (45% -> 90%): ~180 tests across 12 procedures
- Auth router tests (70% -> 90%): ~80 tests for remaining procedures
- Cookies module tests (33% -> 90%): ~15 tests using next/headers mock
- Supabase client tests (0% -> 90%): ~5 tests for client initialization
- tRPC core tests (57% -> 90%): ~10 tests for error formatting

**Dependencies:** None (foundation iteration)

**Estimated Duration:** 6-8 hours

**Risk Level:** MEDIUM
- Clarify router AI mocking is complex
- next/headers mocking for cookies needs careful setup

**Success Criteria:**
- All server-side modules at 90%+ coverage
- No breaking changes to existing tests
- All tests pass in CI

---

### Iteration 2: Component Coverage (P1)

**Vision:** Achieve comprehensive component test coverage for all untested UI components.

**Scope:**
- Subscription components:
  - CancelSubscriptionModal tests (~20 tests)
  - PayPalCheckoutModal tests (~25 tests) - requires PayPal SDK mock
  - SubscriptionStatusCard tests (~15 tests)
- Clarify components:
  - ClarifyCard tests (~20 tests) - uses tRPC hooks
- Dashboard components:
  - ProgressStatsCard tests (~15 tests)
- Shared components:
  - NavigationBase tests (~10 tests)
  - UserDropdownMenu tests (~15 tests)
  - MobileNavigationMenu tests (~15 tests)

**Dependencies:**
- Iteration 1 completion (server coverage established)
- Existing tRPC mock helpers

**Estimated Duration:** 5-7 hours

**Risk Level:** LOW-MEDIUM
- PayPal SDK mocking may require additional setup
- Most components follow established patterns

**Success Criteria:**
- All listed components at 90%+ coverage
- Component tests follow testing-library best practices
- No flaky tests

---

### Iteration 3: E2E Expansion (P1)

**Vision:** Double E2E test coverage with comprehensive user flow testing.

**Scope:**
- Profile E2E tests:
  - View profile, edit profile, change password flows
- Subscription E2E tests:
  - View status, upgrade flow (mocked PayPal), cancel flow
- Admin E2E tests:
  - Admin login, user list, user management
- Clarify E2E tests:
  - Start conversation, tool interactions, dream creation
- Error handling E2E tests:
  - Network failure recovery, session expiry, rate limits

**Dependencies:**
- Iterations 1 & 2 completion
- Existing E2E infrastructure (page objects, fixtures)

**Estimated Duration:** 5-7 hours

**Risk Level:** MEDIUM
- E2E tests more prone to flakiness
- PayPal/external service mocking in E2E context
- Admin tests need admin user fixture

**Success Criteria:**
- 12+ E2E spec files (from current 6)
- All E2E tests pass in headless mode
- Zero flaky tests over 10 CI runs

---

## Dependency Graph

```
Iteration 1: Server-Side Foundation
├── Clarify Router Tests (731 lines -> 90% coverage)
│   ├── getLimits (tested)
│   ├── createSession (needs AI mock)
│   ├── getSession (needs ownership verification)
│   ├── listSessions (needs pagination)
│   ├── sendMessage (needs AI + tool use mock)
│   ├── archiveSession
│   ├── restoreSession
│   ├── updateTitle
│   ├── deleteSession
│   └── getPatterns
├── Auth Router Tests (445 lines -> 90% coverage)
│   ├── signup (email verification flow)
│   ├── signin (password validation)
│   ├── verifyToken (JWT validation)
│   ├── signout (cookie clearing)
│   ├── me (protected route)
│   ├── updateProfile
│   ├── changePassword
│   ├── deleteAccount
│   └── loginDemo (demo user handling)
├── Cookies Module Tests (42 lines -> 90% coverage)
├── Supabase Client Tests (9 lines -> 90% coverage)
└── tRPC Core Tests (45 lines -> 90% coverage)
    ↓
Iteration 2: Component Coverage
├── Subscription Components
│   ├── CancelSubscriptionModal
│   ├── PayPalCheckoutModal (needs SDK mock)
│   └── SubscriptionStatusCard
├── Clarify Components
│   └── ClarifyCard (uses tRPC hooks from Iter 1)
├── Dashboard Components
│   └── ProgressStatsCard
└── Shared Components
    ├── NavigationBase
    ├── UserDropdownMenu
    └── MobileNavigationMenu
    ↓
Iteration 3: E2E Expansion
├── Profile E2E (view, edit, password)
├── Subscription E2E (status, upgrade, cancel)
├── Admin E2E (login, user management)
├── Clarify E2E (conversation, tools)
└── Error Handling E2E (recovery scenarios)
```

---

## Risk Assessment

### High Risks

1. **Clarify Router AI Mocking Complexity**
   - **Impact:** Could block 180+ tests if Anthropic mock fails
   - **Mitigation:** Existing `test/mocks/anthropic.ts` provides foundation; extend with tool use scenarios
   - **Recommendation:** Tackle early in Iteration 1, create reusable AI response fixtures

2. **PayPal SDK Mocking for E2E**
   - **Impact:** Could make subscription E2E tests impossible
   - **Mitigation:** Use network interception in Playwright to mock PayPal SDK responses
   - **Recommendation:** Research PayPal test/sandbox mode integration

### Medium Risks

1. **next/headers Mocking for Cookies**
   - **Impact:** Cookie tests may be difficult to implement correctly
   - **Mitigation:** Use dynamic imports with vi.mock() for Next.js server components
   - **Recommendation:** Create dedicated cookie mock utility

2. **E2E Test Flakiness**
   - **Impact:** CI reliability concerns
   - **Mitigation:** Use explicit waits, avoid timing-based assertions
   - **Recommendation:** Run E2E tests 10 times locally before PR

### Low Risks

1. **Component Test Patterns**
   - **Impact:** Minimal - patterns already established
   - **Mitigation:** Follow existing `__tests__` directory structure

2. **Test Count Growth**
   - **Impact:** Test runtime may increase
   - **Mitigation:** Vitest's parallel execution handles scale well

---

## Integration Considerations

### Cross-Phase Integration Points

1. **tRPC Mock Helpers**
   - Used in both Iteration 1 (router tests) and Iteration 2 (component tests)
   - Ensure mock utilities are robust before Iteration 2

2. **Supabase Mock Factory**
   - Used extensively across all iterations
   - Current implementation in `test/mocks/supabase.ts` is comprehensive

3. **User Factories**
   - Required across all iterations for test user creation
   - Existing factories cover all tier types

### Potential Integration Challenges

1. **Mock State Bleeding**
   - **Challenge:** Mocks persisting between tests
   - **Solution:** Ensure `beforeEach` resets all mocks (already done in `vitest.setup.ts`)

2. **Async Test Timing**
   - **Challenge:** Tests failing due to unresolved promises
   - **Solution:** Use `await` consistently, avoid `done()` callbacks

---

## Recommendations for Master Plan

1. **Prioritize Clarify Router First**
   - Largest coverage gap (45.62%, 731 lines)
   - Complex AI interactions need careful mock design
   - Success here proves AI testing patterns for future

2. **Create Reusable PayPal Mock**
   - Needed for both component tests (Iteration 2) and E2E tests (Iteration 3)
   - Invest time upfront to avoid duplicate work

3. **Run Coverage After Each Iteration**
   - Verify incremental progress toward 95% goal
   - Catch any regressions early

4. **Consider Phase 4 (Post-MVP) Optional**
   - Visual regression and a11y tests are nice-to-have
   - Core coverage goal (95%+) can be achieved in 3 iterations

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 14+, React 18, TypeScript, Vitest, Playwright
- **Patterns observed:**
  - Integration tests use `createTestCaller()` pattern
  - Component tests use testing-library with custom providers
  - E2E tests use page object model
  - All mocks centralized in `/test/mocks/`
- **Opportunities:**
  - Extend Anthropic mock with more response scenarios
  - Add PayPal SDK mock for subscription testing
- **Constraints:**
  - Must maintain existing mock patterns for consistency
  - Coverage thresholds already configured in vitest.config.ts

### Specific Recommendations

1. **For Clarify Router Testing:**
   - Create `test/fixtures/anthropic-responses.ts` with canned AI responses
   - Mock streaming responses with async iterators

2. **For Cookie Module Testing:**
   - Create `test/mocks/next-headers.ts` with cookies() mock

3. **For E2E Admin Tests:**
   - Add admin user to `e2e/fixtures/auth.fixture.ts`

---

## Notes & Observations

1. The vision document mentions "QuickStatsCard" and "DreamsStatsCard" but the actual component is named `ProgressStatsCard.tsx` - verify naming before testing

2. Some subscription components already have tests (CheckoutButton, FeatureLockOverlay, PricingCard, UpgradeModal, UsageWarningBanner) - update vision accuracy

3. Dream components also have more tests than indicated (DreamCard, CreateDreamModal, EvolutionHistory, EvolutionModal)

4. The clarify integration test file (`test/integration/clarify/clarify.test.ts`) already has substantial tests for getLimits - review for gaps

5. Total estimated new tests: ~775 to reach ~4250 total (aligns with vision estimate)

---

*Exploration completed: 2025-12-12T17:00:00Z*
*This report informs master planning decisions*
