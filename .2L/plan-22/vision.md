# Project Vision: Comprehensive Test Coverage (80%+)

**Created:** 2025-12-10T14:00:00Z
**Plan:** plan-22

---

## Problem Statement

Mirror of Dreams has grown to 267+ TypeScript files with sophisticated features, but test coverage remains at ~21% line coverage despite having 991 tests. This creates risk for:
- Regressions when refactoring
- Bugs in edge cases
- Confidence issues for deployment
- Difficulty onboarding contributors

**Current State:**
- 991 tests passing (758 unit + 233 component)
- ~21% line coverage
- Critical files with near-zero coverage
- No enforced coverage gates in CI

**Target State:**
- 80%+ line coverage across all categories
- Enforced coverage thresholds blocking CI
- Comprehensive test documentation
- All critical paths covered

---

## Target Users

**Primary:** Development team
- Need confidence in code changes
- Want fast feedback on regressions
- Require clear test patterns to follow

**Secondary:** Future contributors
- Need test examples to learn codebase
- Require documentation on testing patterns

---

## Core Value Proposition

**Transform Mirror of Dreams from a fragile codebase to a fortress of confidence** where every change is validated by comprehensive automated tests, enabling fearless refactoring and rapid feature development.

**Key Benefits:**
1. Catch bugs before production
2. Enable safe refactoring of complex components
3. Document expected behavior through tests
4. Speed up development with fast feedback loops
5. Reduce manual QA burden

---

## Current Coverage Analysis

### Critical Gaps (Priority 1)

| File/Area | Current | Target | Gap |
|-----------|---------|--------|-----|
| `server/trpc/routers/reflection.ts` | 5.95% | 85% | 79% |
| `server/trpc/routers/clarify.ts` | 15.97% | 85% | 69% |
| `server/trpc/routers/evolution.ts` | ~10% | 85% | 75% |
| `server/trpc/routers/visualizations.ts` | ~10% | 85% | 75% |
| `MobileReflectionFlow.tsx` (812 lines) | 0% | 80% | 80% |
| `lib/clarify/context-builder.ts` | ~20% | 90% | 70% |
| `lib/clarify/consolidation.ts` | ~15% | 90% | 75% |

### Medium Gaps (Priority 2)

| File/Area | Current | Target | Gap |
|-----------|---------|--------|-----|
| `server/trpc/routers/dreams.ts` | ~30% | 85% | 55% |
| `server/trpc/routers/users.ts` | ~25% | 85% | 60% |
| `hooks/useReflectionForm.ts` | 0% | 90% | 90% |
| `hooks/useReflectionViewMode.ts` | 0% | 90% | 90% |
| `components/reflection/views/*` | 0% | 80% | 80% |
| `components/dashboard/*` | ~10% | 75% | 65% |

### Adequate Coverage (Priority 3)

| File/Area | Current | Target | Gap |
|-----------|---------|--------|-----|
| `lib/utils/*` | ~60% | 90% | 30% |
| `types/*` | ~70% | 90% | 20% |
| `server/lib/config.ts` | ~80% | 95% | 15% |
| `server/lib/rate-limiter.ts` | ~75% | 90% | 15% |

---

## Feature Breakdown

### Phase 1: Foundation & Refactoring (Iterations 1-2)

#### 1.1 MobileReflectionFlow.tsx Refactoring

**Problem:** 812-line mega-component is untestable
**Solution:** Extract hooks and view components (mirror MirrorExperience.tsx pattern)

**Deliverables:**
- `hooks/useMobileReflectionForm.ts` - Form state management
- `hooks/useMobileReflectionFlow.ts` - Flow/step management
- `components/reflection/mobile/views/MobileDreamSelectionView.tsx`
- `components/reflection/mobile/views/MobileQuestionnaireView.tsx`
- `components/reflection/mobile/views/MobileReflectionOutputView.tsx`
- Refactored `MobileReflectionFlow.tsx` < 300 lines

**Acceptance Criteria:**
- [ ] MobileReflectionFlow.tsx reduced to < 300 lines
- [ ] All extracted components have 80%+ coverage
- [ ] Existing functionality preserved (manual verification)
- [ ] TypeScript strict mode passes

#### 1.2 Test Infrastructure Hardening

**Deliverables:**
- Enhanced `test/setup.ts` with comprehensive mocks
- `test/factories/` directory with test data factories
- `test/helpers/` with testing utilities
- Coverage configuration enforcing 80% threshold

**Acceptance Criteria:**
- [ ] CI blocks on coverage below 80%
- [ ] Test factories for User, Dream, Reflection, ClarifySession
- [ ] Mock utilities for Supabase, Anthropic, tRPC context
- [ ] Documentation in `docs/testing.md`

---

### Phase 2: tRPC Router Tests (Iterations 3-5)

#### 2.1 Reflection Router Tests

**File:** `server/trpc/routers/reflection.ts`
**Current:** 5.95% → **Target:** 85%

**Test Cases:**
1. `create` mutation
   - Successfully creates reflection with valid data
   - Validates required fields (dreamId, responses, tone)
   - Enforces tier limits (free: 10/month, seeker: 50, dreamer: unlimited)
   - Handles Anthropic API errors gracefully
   - Processes extended thinking responses
   - Caches invalidation after creation

2. `getById` query
   - Returns reflection for owner
   - Returns 404 for non-existent reflection
   - Denies access to other users' reflections
   - Includes dream data when requested

3. `getByDreamId` query
   - Returns all reflections for a dream
   - Respects pagination
   - Orders by creation date
   - Handles empty results

4. `getRecent` query
   - Returns user's recent reflections
   - Respects limit parameter
   - Orders by recency

5. `delete` mutation
   - Deletes user's own reflection
   - Denies deletion of others' reflections
   - Handles non-existent reflection

**Acceptance Criteria:**
- [ ] 85%+ line coverage for reflection.ts
- [ ] All mutations tested with success and error cases
- [ ] Tier limit enforcement tested
- [ ] Anthropic mock covers streaming and non-streaming

#### 2.2 Clarify Router Tests

**File:** `server/trpc/routers/clarify.ts`
**Current:** 15.97% → **Target:** 85%

**Test Cases:**
1. `startSession` mutation
   - Creates new session with context
   - Builds context from user data correctly
   - Handles missing user data gracefully
   - Enforces session limits per tier

2. `sendMessage` mutation
   - Sends message and gets response
   - Handles tool use (createDream, createReflection)
   - Processes extended thinking
   - Handles streaming responses
   - Rate limits appropriately

3. `getSession` query
   - Returns session with messages
   - Denies access to other users' sessions
   - Handles non-existent session

4. `getSessions` query
   - Lists user's sessions
   - Respects pagination
   - Orders by recency

5. `endSession` mutation
   - Ends session gracefully
   - Updates session status

**Acceptance Criteria:**
- [ ] 85%+ line coverage for clarify.ts
- [ ] Tool use tested (createDream, createReflection tools)
- [ ] Context building tested thoroughly
- [ ] Streaming response handling tested

#### 2.3 Evolution Router Tests

**File:** `server/trpc/routers/evolution.ts`
**Current:** ~10% → **Target:** 85%

**Test Cases:**
1. `evolveDream` mutation
   - Successfully evolves dream
   - Validates dream exists and is owned by user
   - Handles Anthropic API with extended thinking
   - Updates dream status correctly
   - Tier limits enforced

2. `getEvolutionHistory` query
   - Returns evolution history for dream
   - Orders by evolution date
   - Handles empty history

**Acceptance Criteria:**
- [ ] 85%+ line coverage
- [ ] Extended thinking response handling tested
- [ ] Dream state transitions tested

#### 2.4 Visualizations Router Tests

**File:** `server/trpc/routers/visualizations.ts`
**Current:** ~10% → **Target:** 85%

**Test Cases:**
1. `generateVisualization` mutation
   - Generates visualization for dream
   - Handles different visualization types
   - Processes Anthropic responses correctly

2. `getVisualizations` query
   - Returns user's visualizations
   - Filters by dream if specified

**Acceptance Criteria:**
- [ ] 85%+ line coverage
- [ ] All visualization types tested

#### 2.5 Dreams Router Tests

**File:** `server/trpc/routers/dreams.ts`
**Current:** ~30% → **Target:** 85%

**Test Cases:**
1. `create` mutation - all validation paths
2. `update` mutation - ownership, validation
3. `delete` mutation - cascade behavior
4. `getById` query - access control
5. `getAll` query - filtering, pagination
6. `archive`/`unarchive` mutations
7. `complete` mutation - ceremony creation

**Acceptance Criteria:**
- [ ] 85%+ line coverage
- [ ] All CRUD operations tested
- [ ] Status transitions tested
- [ ] Tier limits tested

#### 2.6 Users Router Tests

**File:** `server/trpc/routers/users.ts`
**Current:** ~25% → **Target:** 85%

**Test Cases:**
1. `getProfile` query
2. `updateProfile` mutation
3. `getUsageStats` query
4. `deleteAccount` mutation
5. Subscription-related queries

**Acceptance Criteria:**
- [ ] 85%+ line coverage
- [ ] Profile operations tested
- [ ] Usage tracking tested

---

### Phase 3: Hook Tests (Iteration 6)

#### 3.1 Reflection Hooks

**Files:**
- `hooks/useReflectionForm.ts` (0% → 90%)
- `hooks/useReflectionViewMode.ts` (0% → 90%)
- `hooks/useMobileReflectionForm.ts` (new, 90%)
- `hooks/useMobileReflectionFlow.ts` (new, 90%)

**Test Approach:** Use `@testing-library/react` with `renderHook`

**Test Cases per Hook:**
1. Initial state correctness
2. State updates on actions
3. Validation logic
4. LocalStorage persistence
5. URL synchronization (where applicable)
6. Error handling
7. Edge cases (empty data, invalid input)

**Acceptance Criteria:**
- [ ] 90%+ coverage for all reflection hooks
- [ ] All state transitions tested
- [ ] Persistence mechanisms tested

#### 3.2 Other Hooks

**Files:**
- `hooks/useAuth.ts`
- `hooks/useDreams.ts`
- `hooks/useDebounce.ts`
- `hooks/useMediaQuery.ts`
- `hooks/usePrevious.ts`

**Acceptance Criteria:**
- [ ] 85%+ coverage for utility hooks
- [ ] Auth state transitions tested
- [ ] Debounce timing tested

---

### Phase 4: Component Tests (Iterations 7-9)

#### 4.1 Reflection Components

**Files:**
- `components/reflection/views/DreamSelectionView.tsx`
- `components/reflection/views/ReflectionFormView.tsx`
- `components/reflection/views/ReflectionOutputView.tsx`
- `components/reflection/mobile/views/*.tsx` (new from refactor)
- `components/reflection/ReflectionQuestionCard.tsx` (enhance)
- `components/reflection/ToneSelection.tsx` (enhance)

**Test Cases:**
1. Renders correctly with props
2. User interactions (clicks, inputs)
3. Callback invocations
4. Loading states
5. Error states
6. Empty states
7. Accessibility (keyboard nav, ARIA)

**Acceptance Criteria:**
- [ ] 80%+ coverage for all reflection components
- [ ] User interactions tested with userEvent
- [ ] Accessibility tested

#### 4.2 Dashboard Components

**Files:**
- `components/dashboard/DreamsCard.tsx`
- `components/dashboard/ReflectionsCard.tsx`
- `components/dashboard/EvolutionCard.tsx`
- `components/dashboard/PatternsCard.tsx`
- `components/dashboard/JourneyCard.tsx`
- `components/dashboard/QuickActionsCard.tsx`
- `components/dashboard/WelcomeCard.tsx`
- `components/dashboard/shared/*.tsx`

**Acceptance Criteria:**
- [ ] 75%+ coverage for dashboard components
- [ ] Data display tested
- [ ] Loading/error states tested

#### 4.3 UI Components

**Files:**
- `components/ui/glass/*.tsx`
- `components/ui/forms/*.tsx`
- `components/ui/*.tsx`
- `components/icons/*.tsx`

**Acceptance Criteria:**
- [ ] 80%+ coverage for UI components
- [ ] Props variations tested
- [ ] Interaction states tested

#### 4.4 Auth Components

**Files:**
- `components/auth/SignInForm.tsx`
- `components/auth/SignUpForm.tsx`
- `components/auth/ForgotPasswordForm.tsx`
- `components/auth/ResetPasswordForm.tsx`

**Acceptance Criteria:**
- [ ] 85%+ coverage for auth components
- [ ] Form validation tested
- [ ] Submission flows tested
- [ ] Error handling tested

---

### Phase 5: Library Tests (Iteration 10)

#### 5.1 Clarify Library

**Files:**
- `lib/clarify/context-builder.ts` (20% → 90%)
- `lib/clarify/consolidation.ts` (15% → 90%)
- `lib/clarify/tools.ts`
- `lib/clarify/prompts.ts`

**Test Cases:**
1. Context building with various user states
2. Consolidation logic for large conversations
3. Tool definitions and execution
4. Prompt generation

**Acceptance Criteria:**
- [ ] 90%+ coverage for clarify lib
- [ ] All context scenarios tested
- [ ] Tool execution tested

#### 5.2 Anthropic Library

**Files:**
- `lib/anthropic/types.ts`
- `lib/anthropic/type-guards.ts`

**Test Cases:**
1. Type guard correctness for all block types
2. Helper function behavior

**Acceptance Criteria:**
- [ ] 95%+ coverage for anthropic lib
- [ ] All type guards tested

#### 5.3 Server Libraries

**Files:**
- `server/lib/cache.ts` (enhance)
- `server/lib/config.ts` (enhance)
- `server/lib/rate-limiter.ts` (enhance)
- `server/lib/temporal-distribution.ts`

**Acceptance Criteria:**
- [ ] 90%+ coverage for server libs
- [ ] Cache operations tested
- [ ] Rate limiter scenarios tested
- [ ] Config validation tested

---

### Phase 6: Integration Tests (Iteration 11)

#### 6.1 tRPC Integration Tests

**Scope:** End-to-end tRPC calls with mocked external services

**Test Scenarios:**
1. Full reflection creation flow
2. Full dream lifecycle (create → reflect → evolve → complete)
3. Clarify conversation flow with tool use
4. User registration → profile setup → usage tracking

**Acceptance Criteria:**
- [ ] Critical user flows tested end-to-end
- [ ] Database interactions verified
- [ ] Error propagation tested

#### 6.2 API Route Tests

**Files:**
- `app/api/auth/*`
- `app/api/webhooks/*`
- `app/api/cron/*`

**Acceptance Criteria:**
- [ ] 80%+ coverage for API routes
- [ ] Webhook signature verification tested
- [ ] Cron job logic tested

---

### Phase 7: E2E Test Expansion (Iteration 12)

#### 7.1 Current E2E Status

- 39 Playwright tests exist
- Focus on auth flows

#### 7.2 E2E Expansion

**New Test Suites:**

1. **Dreams Flow** (`e2e/dreams/`)
   - Create dream (all categories)
   - Edit dream
   - Delete dream
   - Archive/unarchive
   - Dream completion ceremony

2. **Reflection Flow** (`e2e/reflection/`)
   - Full reflection creation (desktop)
   - Full reflection creation (mobile)
   - View reflection history
   - Delete reflection

3. **Clarify Flow** (`e2e/clarify/`)
   - Start conversation
   - Send messages
   - Tool use (create dream from conversation)
   - Session history

4. **Dashboard Flow** (`e2e/dashboard/`)
   - View all cards
   - Navigate to details
   - Quick actions work

5. **Settings Flow** (`e2e/settings/`)
   - Update profile
   - Change password
   - Manage subscription

6. **Mobile Responsive** (`e2e/mobile/`)
   - All flows work on mobile viewport
   - Touch interactions work
   - Navigation works

**Acceptance Criteria:**
- [ ] 100+ E2E tests (from current 39)
- [ ] All critical user journeys covered
- [ ] Mobile viewport tests included
- [ ] Tests run in CI on every PR

---

### Phase 8: Documentation & Tooling (Iteration 13)

#### 8.1 Testing Documentation

**Files to Create:**
- `docs/testing/overview.md` - Testing philosophy and strategy
- `docs/testing/patterns.md` - Common test patterns with examples
- `docs/testing/mocking.md` - How to mock Supabase, Anthropic, etc.
- `docs/testing/factories.md` - Using test data factories
- `docs/testing/e2e.md` - E2E testing guide
- `docs/testing/debugging.md` - Debugging failing tests

#### 8.2 Test Utilities

**Files to Create/Enhance:**
- `test/factories/user.factory.ts`
- `test/factories/dream.factory.ts`
- `test/factories/reflection.factory.ts`
- `test/factories/clarify-session.factory.ts`
- `test/helpers/render.tsx` - Custom render with providers
- `test/helpers/trpc.ts` - tRPC test client helpers
- `test/helpers/supabase.ts` - Supabase mock helpers

#### 8.3 CI/CD Enhancements

**Improvements:**
- Coverage reports uploaded to PR comments
- Coverage badges in README
- Separate test jobs (unit, integration, e2e)
- Test result summaries

**Acceptance Criteria:**
- [ ] Comprehensive testing documentation
- [ ] Test factories for all major entities
- [ ] CI shows coverage on every PR
- [ ] README has coverage badge

---

## Success Criteria

### Primary Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Line Coverage | 21% | 80% | `npm run test:coverage` |
| Branch Coverage | ~15% | 75% | `npm run test:coverage` |
| Function Coverage | ~20% | 80% | `npm run test:coverage` |
| Statement Coverage | ~21% | 80% | `npm run test:coverage` |

### Secondary Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Total Tests | 991 | 2000+ |
| E2E Tests | 39 | 100+ |
| Component Tests | 233 | 500+ |
| Router Test Coverage | ~15% avg | 85%+ |

### Quality Gates

| Gate | Requirement |
|------|-------------|
| CI Coverage Check | Fails if < 80% |
| PR Coverage Delta | No decrease allowed |
| Critical File Coverage | Router files must be 85%+ |
| E2E Suite | Must pass before merge to main |

---

## Technical Requirements

### Test Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit and integration tests |
| React Testing Library | Component tests |
| Playwright | E2E tests |
| MSW | API mocking (optional, for integration) |
| Factory.ts | Test data factories |

### Coverage Configuration

```typescript
// vitest.config.ts coverage settings
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'server/**/*.{ts,tsx}',
    'types/**/*.{ts,tsx}',
  ],
  exclude: [
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/test/**',
    '**/__tests__/**',
  ],
  thresholds: {
    global: {
      lines: 80,
      branches: 75,
      functions: 80,
      statements: 80,
    },
  },
}
```

---

## Iteration Breakdown (13 Iterations)

| Iteration | Focus | Deliverables |
|-----------|-------|--------------|
| 1 | MobileReflectionFlow Refactor | Extracted hooks, views, <300 lines |
| 2 | Test Infrastructure | Factories, helpers, CI gates |
| 3 | Reflection Router Tests | 85%+ coverage |
| 4 | Clarify Router Tests | 85%+ coverage |
| 5 | Evolution + Visualizations Router Tests | 85%+ coverage |
| 6 | Hook Tests | All hooks at 85%+ |
| 7 | Reflection Component Tests | 80%+ coverage |
| 8 | Dashboard Component Tests | 75%+ coverage |
| 9 | UI + Auth Component Tests | 80%+ coverage |
| 10 | Library Tests | 90%+ coverage |
| 11 | Integration Tests | Critical flows covered |
| 12 | E2E Expansion | 100+ E2E tests |
| 13 | Documentation & Polish | Docs, badges, CI reports |

---

## Out of Scope

**Not included in this plan:**
- Performance/load testing
- Visual regression testing
- Security penetration testing
- Accessibility auditing (beyond basic tests)
- Test data seeding for staging/production
- Contract testing for external APIs

**Why:** Focus is on functional test coverage. These can be separate future plans.

---

## Assumptions

1. Current 991 tests remain stable and passing
2. Anthropic API can be effectively mocked
3. Supabase operations can be mocked at client level
4. Team is familiar with Vitest and React Testing Library
5. CI has sufficient resources for extended test runs

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MobileReflectionFlow refactor breaks functionality | High | Manual QA after refactor, comprehensive tests |
| Mocking complexity for Anthropic streaming | Medium | Build robust mock utilities early |
| Test suite becomes slow | Medium | Parallelize, optimize setup/teardown |
| Flaky E2E tests | Medium | Retry logic, stable selectors, wait utilities |
| Coverage gaming (meaningless tests) | Medium | Code review for test quality |

---

## Open Questions

1. Should we add MSW for more realistic API mocking?
2. Do we need snapshot testing for components?
3. Should E2E tests run against real Anthropic in staging?
4. What's the acceptable test suite runtime? (Currently ~30s, may grow to 2-3min)

---

## Definition of Done

This plan is complete when:

1. [ ] Line coverage is 80%+ across codebase
2. [ ] All tRPC routers have 85%+ coverage
3. [ ] MobileReflectionFlow.tsx is < 300 lines with full test coverage
4. [ ] 2000+ total tests
5. [ ] 100+ E2E tests
6. [ ] CI enforces coverage thresholds
7. [ ] Testing documentation is complete
8. [ ] Coverage badge displays in README

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
**Estimated Duration:** 13 iterations (~26-40 hours)
