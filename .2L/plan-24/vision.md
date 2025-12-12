# Project Vision: Test Supremacy - From 79% to 95%+ Coverage

**Created:** 2025-12-11T14:45:00Z
**Updated:** 2025-12-12
**Plan:** plan-24

---

## Problem Statement

The Mirror of Dreams has achieved 79% test coverage (3477 tests passing), meeting the adjusted CI threshold. However, branches (71.81%) and functions (71.57%) lag behind, and significant gaps remain in component testing and E2E flows. The goal is now to reach 95%+ coverage with comprehensive test quality.

**Current state (as of 2025-12-12):**
- Lines: 79.04% (threshold: 78%)
- Statements: 79.01% (threshold: 78%)
- Branches: 71.81% (threshold: 71%)
- Functions: 71.57% (threshold: 71%)
- Total tests: 3477

**Completed in prior work:**
- Admin router: 100% coverage
- Artifact router: 100% coverage
- Users router: 90% coverage
- tRPC Context: 88.88% coverage
- Email service: 91.42% coverage
- Prompts: 100% coverage
- Voice module: 100% coverage
- Middleware: 100% coverage
- Type transformations: 100% coverage
- Rate limiter: 98.14% coverage
- PayPal service: 89.39% coverage

**Remaining pain points:**
- Clarify router at 45.62% - agent conversation logic undertested
- Auth router at 70.21% - some auth flows missing tests
- Cookies module at 33.33% - cookie handling untested
- Supabase client at 0% - database client wrapper untested
- tRPC core at 57.14% - router setup untested
- Many dashboard components at 0% - QuickStatsCard, DreamsStatsCard, etc.
- Subscription components at 0% - payment UI completely untested
- Clarify components at 0% - agent UI untested
- Only 6 E2E test files - critical user flows missing

---

## Target Users

**Primary user:** Development team
- Needs confidence in deployments
- Wants fast feedback on regressions
- Requires safe refactoring capability

**Secondary users:**
- CI/CD pipeline - needs passing coverage gates
- Future maintainers - need living documentation via tests

---

## Core Value Proposition

Transform from "good coverage" to "exceptional coverage" - reaching 95%+ with no blind spots in business-critical code.

**Key benefits:**
1. Reach 95% coverage across all metrics
2. Eliminate all 0% coverage areas
3. Add comprehensive E2E test suite
4. Enable fearless major refactoring

---

## Feature Breakdown

### Must-Have (MVP) - Phase 1: Close Remaining Server Gaps

#### 1. **Clarify Router Tests (45.62% -> 90%+)**
   - Description: Full test coverage for clarify agent conversations
   - User story: As a developer, I want clarify logic tested so AI conversations work reliably
   - Acceptance criteria:
     - [ ] Session creation/management tested
     - [ ] Message handling tested
     - [ ] Tool use flows tested
     - [ ] Pattern extraction tested
     - [ ] Error recovery tested

#### 2. **Auth Router Tests (70.21% -> 90%+)**
   - Description: Complete auth flow testing
   - User story: As a developer, I want auth routes tested so login/signup works reliably
   - Acceptance criteria:
     - [ ] Sign up flow with email verification
     - [ ] Login flow with various scenarios
     - [ ] Password reset flow
     - [ ] Session refresh logic
     - [ ] Demo user handling

#### 3. **Cookies Module Tests (33.33% -> 90%+)**
   - Description: Test cookie handling for auth
   - User story: As a developer, I want cookie logic tested for secure auth
   - Acceptance criteria:
     - [ ] Cookie creation tested
     - [ ] Cookie parsing tested
     - [ ] Secure flags verified
     - [ ] Expiration handling tested

#### 4. **Supabase Client Tests (0% -> 90%+)**
   - Description: Test database client wrapper
   - User story: As a developer, I want DB client tested for reliability
   - Acceptance criteria:
     - [ ] Client initialization tested
     - [ ] Connection handling tested
     - [ ] Error scenarios tested

#### 5. **tRPC Core Tests (57.14% -> 90%+)**
   - Description: Test router setup and initialization
   - User story: As a developer, I want tRPC core tested
   - Acceptance criteria:
     - [ ] Router registration tested
     - [ ] Middleware chain tested
     - [ ] Error formatting tested

### Must-Have (MVP) - Phase 2: Component Coverage

#### 6. **Dashboard Components (0-62% -> 90%+)**
   - Description: Test dashboard card components
   - Components to test:
     - [ ] QuickStatsCard (0%)
     - [ ] DreamsStatsCard (0%)
     - [ ] EvolutionCard (100% - done)
     - [ ] DreamsCard (100% - done)
   - Acceptance criteria:
     - [ ] All render states tested
     - [ ] Data loading tested
     - [ ] Error states tested

#### 7. **Subscription Components (0% -> 90%+)**
   - Description: Test all payment/subscription UI
   - Components to test:
     - [ ] CancelSubscriptionModal
     - [ ] CheckoutButton
     - [ ] FeatureLockOverlay
     - [ ] PayPalCheckoutModal
     - [ ] PricingCard
     - [ ] SubscriptionStatusCard
     - [ ] UpgradeModal
     - [ ] UsageWarningBanner
   - Acceptance criteria:
     - [ ] Render tests for all states
     - [ ] User interaction tests
     - [ ] Loading/error states
     - [ ] PayPal SDK mocking

#### 8. **Clarify Components (0% -> 90%+)**
   - Description: Test clarify agent UI
   - Components:
     - [ ] ClarifyCard
   - Acceptance criteria:
     - [ ] Streaming state handling
     - [ ] Tool use display
     - [ ] Error recovery

#### 9. **Dreams Components Gap Fill**
   - Description: Test remaining dream components
   - Components:
     - [ ] DreamCard
     - [ ] CreateDreamModal
     - [ ] EvolutionModal
     - [ ] EvolutionHistory
   - Acceptance criteria:
     - [ ] CRUD operations reflected in UI
     - [ ] Modal behavior tested
     - [ ] Loading states covered

#### 10. **Shared Components Gap Fill**
   - Description: Test remaining shared components
   - Components:
     - [ ] NavigationBase
     - [ ] UserDropdownMenu
     - [ ] MobileNavigationMenu
     - [ ] DemoBanner
     - [ ] Toast
     - [ ] MarkdownPreview
   - Acceptance criteria:
     - [ ] All render paths tested
     - [ ] Responsive behavior mocked
     - [ ] Accessibility tested

### Must-Have (MVP) - Phase 3: E2E Expansion

#### 11. **Profile E2E Tests**
   - Description: End-to-end tests for profile management
   - Acceptance criteria:
     - [ ] View profile flow
     - [ ] Edit profile flow
     - [ ] Change password flow

#### 12. **Subscription E2E Tests**
   - Description: End-to-end tests for subscription management
   - Acceptance criteria:
     - [ ] View subscription status
     - [ ] Upgrade flow (mocked PayPal)
     - [ ] Cancel flow
     - [ ] Usage limit enforcement

#### 13. **Admin E2E Tests**
   - Description: End-to-end tests for admin functionality
   - Acceptance criteria:
     - [ ] Admin login
     - [ ] User list view
     - [ ] User management actions

#### 14. **Clarify E2E Tests**
   - Description: End-to-end tests for clarify agent
   - Acceptance criteria:
     - [ ] Start conversation
     - [ ] Tool interactions
     - [ ] Dream creation via clarify

#### 15. **Error Handling E2E Tests**
   - Description: Test error scenarios end-to-end
   - Acceptance criteria:
     - [ ] Network failure recovery
     - [ ] Session expiry handling
     - [ ] Rate limit display

### Should-Have (Post-MVP) - Phase 4: Advanced Testing

#### 16. **Visual Regression Tests**
   - Description: Catch unintended UI changes
   - Acceptance criteria:
     - [ ] Screenshot comparison setup
     - [ ] Key pages captured
     - [ ] Mobile viewport coverage

#### 17. **Accessibility Tests**
   - Description: Automated a11y compliance
   - Acceptance criteria:
     - [ ] axe-core integration
     - [ ] WCAG 2.1 AA compliance
     - [ ] Keyboard navigation tests

---

## Coverage Targets by Area

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| server/trpc/routers/clarify.ts | 45.62% | 90% | P0 |
| server/trpc/routers/auth.ts | 70.21% | 90% | P0 |
| server/lib/cookies.ts | 33.33% | 90% | P0 |
| server/lib/supabase.ts | 0% | 90% | P0 |
| server/trpc/trpc.ts | 57.14% | 90% | P0 |
| components/subscription/* | 0% | 90% | P1 |
| components/clarify/* | 0% | 90% | P1 |
| components/dashboard/cards/QuickStatsCard | 0% | 90% | P1 |
| components/dreams/* | varies | 90% | P1 |
| components/shared/* (gaps) | varies | 90% | P1 |
| E2E test files | 6 | 12+ | P1 |
| **Overall Lines** | 79.04% | 95%+ | Goal |
| **Overall Branches** | 71.81% | 90%+ | Goal |
| **Overall Functions** | 71.57% | 90%+ | Goal |

---

## Technical Requirements

**Must support:**
- Vitest for unit/integration tests
- Playwright for E2E tests
- Coverage reporting with v8
- Parallel test execution
- CI/CD integration

**Constraints:**
- No flaky tests - all tests must be deterministic
- Tests must run in <5 minutes locally
- E2E tests must work in headless mode
- Mock external services (PayPal, Anthropic, Supabase, S3)

**Preferences:**
- Use MSW for API mocking where needed
- Use testing-library best practices
- Prefer user-centric E2E tests over implementation details
- Use data-testid sparingly, prefer accessible selectors

---

## Success Criteria

**The plan is successful when:**

1. **Coverage threshold met**
   - Metric: `npm run test:coverage` passes
   - Target: 95%+ lines, 90%+ functions, 90%+ branches

2. **Zero coverage gaps in critical paths**
   - Metric: No router/service at <50% coverage
   - Target: All routers >80%, all services >80%

3. **E2E coverage expanded**
   - Metric: Count of E2E test files
   - Target: 12+ E2E spec files (from current 6)

4. **Test stability**
   - Metric: Flaky test rate
   - Target: 0% flaky tests over 10 CI runs

---

## Iteration Breakdown (Recommended)

### Iteration 1: Server-Side Remaining Gaps (P0)
- Clarify router tests (45% -> 90%)
- Auth router tests (70% -> 90%)
- Cookies module tests (33% -> 90%)
- Supabase client tests (0% -> 90%)
- tRPC core tests (57% -> 90%)

### Iteration 2: Component Coverage (P1)
- All subscription components (0% -> 90%)
- Dashboard card gaps (QuickStatsCard, etc.)
- Clarify components (0% -> 90%)
- Dreams component gaps
- Shared component gaps

### Iteration 3: E2E Expansion
- Profile E2E
- Subscription E2E
- Admin E2E
- Clarify E2E
- Error handling E2E

---

## Estimated Test Count

| Category | Current | New Tests | Total |
|----------|---------|-----------|-------|
| Unit (Components) | ~800 | ~200 | ~1000 |
| Unit (Hooks/Utils) | ~400 | ~100 | ~500 |
| Integration (Routers) | ~1800 | ~300 | ~2100 |
| Integration (Services) | ~400 | ~100 | ~500 |
| E2E | ~75 | ~75 | ~150 |
| **Total** | ~3477 | ~775 | **~4250** |

---

## Out of Scope

**Explicitly not included:**
- Performance optimization (testing only, not fixing)
- New feature development
- UI/UX changes
- Database schema changes
- Third-party service integration changes

**Why:** This plan is purely about test coverage - we measure and verify, we don't change functionality.

---

## Assumptions

1. Existing tests are correct and should not be modified unless buggy
2. External services will be mocked (no live API calls in tests)
3. Test data fixtures are available or can be created
4. CI environment matches local test environment

---

## Next Steps

- [x] Review and refine this vision
- [ ] Run `/2l-prod` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning / Execution
