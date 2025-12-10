# Project Vision: Full Code Excellence

**Created:** 2025-12-10T12:15:00Z
**Plan:** plan-21

---

## Problem Statement

Mirror of Dreams has achieved functional completeness through 20 plans and 34+ iterations. However, a comprehensive 10-agent deep analysis revealed critical gaps that prevent it from being an "excellent" codebase:

**Current pain points:**
- **Security**: JWT expiry not enforced, rate limiter fails-open on Redis failure
- **Observability**: No error monitoring (Sentry), errors only go to stdout
- **Performance**: Sequential DB queries in Clarify context (~250-500ms overhead per message)
- **Testing**: 12 unhandled promise rejections, no component tests, no E2E tests, CI doesn't block
- **Code Quality**: 71 `any` types, 0 React.memo usage, large components (1504 LOC)
- **TypeScript**: Missing type guards for API responses, noUncheckedIndexedAccess disabled

---

## Target Users

**Primary user:** Developers maintaining Mirror of Dreams
- Need confidence in production stability (error monitoring)
- Need fast, responsive Clarify conversations (performance)
- Need type-safe codebase (TypeScript strictness)

**Secondary users:**
- End users experiencing smoother Clarify interactions
- DevOps verifying production health

---

## Core Value Proposition

Transform Mirror of Dreams from "production-ready" (7.8/10) to "excellent" (9+/10) through comprehensive hardening across security, performance, testing, and code quality.

**Key benefits:**
1. Production-grade error monitoring with Sentry
2. 250-500ms faster Clarify conversations
3. Type-safe codebase catching errors at compile time
4. Comprehensive test coverage preventing regressions
5. Optimized React rendering for smoother UX

---

## Feature Breakdown

### Must-Have (MVP) - Critical Fixes

#### 1. **JWT Expiry Enforcement**
- Description: JWT tokens currently only verify signature, not expiration
- Location: `server/trpc/context.ts`
- User story: As a system, I need to reject expired tokens to prevent indefinite sessions
- Acceptance criteria:
  - [ ] Add `if (decoded.exp && decoded.exp < Date.now() / 1000)` check
  - [ ] Return null user for expired tokens
  - [ ] Add test for token expiry rejection

#### 2. **Rate Limiter Fail-Closed**
- Description: Rate limiter returns `{ success: true }` if Redis unavailable, allowing unlimited requests
- Location: `server/lib/rate-limiter.ts:77`
- User story: As a system, I need rate limiting to fail safely to prevent abuse
- Acceptance criteria:
  - [ ] Change catch block to log error AND reject request (fail-closed)
  - [ ] Add circuit breaker pattern (after N failures, reject for M seconds)
  - [ ] Add monitoring alert for Redis failures
  - [ ] Update tests to verify fail-closed behavior

#### 3. **Sentry Error Monitoring Integration**
- Description: No external error monitoring - errors only go to stdout
- User story: As a developer, I need to see production errors in a dashboard with context
- Acceptance criteria:
  - [ ] Install @sentry/nextjs via wizard
  - [ ] Configure source maps for production debugging
  - [ ] Replace "future: integrate with Sentry" comments in error.tsx files
  - [ ] Add Sentry to AI API call error paths
  - [ ] Add Sentry to PayPal webhook error paths
  - [ ] Configure error grouping and alerts
  - [ ] Test error capture in development

#### 4. **Config Validation at Startup**
- Description: Missing env vars fail at runtime, not startup
- User story: As a developer, I need immediate feedback if config is invalid
- Acceptance criteria:
  - [ ] Create `server/lib/config.ts` with Zod schema for all env vars
  - [ ] Validate on server startup (imported by context.ts)
  - [ ] Throw clear error message identifying missing vars
  - [ ] Add ConfigError type for structured handling

### Must-Have (MVP) - Performance

#### 5. **Parallelize Clarify Context Queries**
- Description: `buildClarifyContext()` makes 5 sequential DB queries (~250-500ms overhead)
- Location: `lib/clarify/context-builder.ts:29-174`
- User story: As a user, I want faster Clarify responses
- Acceptance criteria:
  - [ ] Refactor to use `Promise.all()` for independent queries (user, dreams, patterns)
  - [ ] Keep dependent queries sequential only where necessary
  - [ ] Measure before/after timing (target: 50-100ms)
  - [ ] Add performance logging for context building

#### 6. **Redis Caching Layer for Hot Data**
- Description: User data, patterns, dream stats fetched fresh on every request
- User story: As a user, I want faster page loads
- Acceptance criteria:
  - [ ] Add Redis caching utility with TTL support
  - [ ] Cache user context (5-minute TTL)
  - [ ] Cache pattern data (10-minute TTL, invalidate on consolidation)
  - [ ] Cache dream stats (1-minute TTL)
  - [ ] Add cache hit/miss metrics to logging

### Must-Have (MVP) - Testing

#### 7. **Fix Unhandled Promise Rejections**
- Description: 12 unhandled promise rejections in test output
- Location: `lib/utils/__tests__/retry.test.ts` and others
- User story: As a developer, I want clean test output
- Acceptance criteria:
  - [ ] Identify all sources of unhandled rejections
  - [ ] Add proper try/catch or expect().rejects patterns
  - [ ] Ensure all async tests properly await
  - [ ] Zero unhandled rejections in test output

#### 8. **CI Tests Block on Failure**
- Description: `continue-on-error: true` in GitHub Actions allows deployment with failing tests
- Location: `.github/workflows/ci.yml`
- User story: As a team, we need tests to gate deployments
- Acceptance criteria:
  - [ ] Remove `continue-on-error: true` from test job
  - [ ] Add coverage threshold (70% minimum)
  - [ ] Add npm audit to CI pipeline
  - [ ] Configure branch protection requiring CI pass

#### 9. **Add E2E Tests with Playwright**
- Description: No E2E tests for critical user flows
- User story: As a developer, I need confidence that user journeys work end-to-end
- Acceptance criteria:
  - [ ] Install Playwright with Next.js configuration
  - [ ] Create test for: Signup -> Login -> Create Dream -> View Dashboard
  - [ ] Create test for: Login -> Create Reflection -> View Output
  - [ ] Create test for: Upgrade flow (mock PayPal)
  - [ ] Add E2E tests to CI pipeline
  - [ ] Configure test database for E2E

#### 10. **Add Component Tests**
- Description: 48+ React components have no tests
- User story: As a developer, I need to verify component behavior
- Acceptance criteria:
  - [ ] Install @testing-library/react if not present
  - [ ] Add tests for ReflectionQuestionCard (props, events)
  - [ ] Add tests for ToneSelection (selection, accessibility)
  - [ ] Add tests for GlassInput (validation, counter)
  - [ ] Add tests for DashboardCard (rendering, animation)
  - [ ] Target: 10 component test files minimum

### Must-Have (MVP) - Code Quality

#### 11. **Remove `any` Types from API Layer**
- Description: 71 `any` types defeat TypeScript safety
- Priority files: evolution.ts (10), visualizations.ts (4), clarify.ts (1)
- User story: As a developer, I want compile-time error detection
- Acceptance criteria:
  - [ ] Create types for Anthropic API responses
  - [ ] Replace `any` in requestConfig objects
  - [ ] Add type predicates for content block validation
  - [ ] Enable noUncheckedIndexedAccess (fix ~40 locations)
  - [ ] Target: < 20 `any` usages remaining (test files excluded)

#### 12. **Refactor MirrorExperience.tsx**
- Description: 1,504 lines violates single responsibility
- Location: `components/reflection/MirrorExperience.tsx`
- User story: As a developer, I need maintainable components
- Acceptance criteria:
  - [ ] Extract useReflectionForm hook (form state, validation)
  - [ ] Extract useReflectionViewMode hook (view state management)
  - [ ] Extract DreamSelectionView component
  - [ ] Extract ReflectionFormView component
  - [ ] Extract ReflectionOutputView component
  - [ ] Main component reduced to < 400 lines
  - [ ] Consolidate duplicates with MobileReflectionFlow.tsx

#### 13. **Add React.memo to Pure Components**
- Description: 0 React.memo usage, unnecessary re-renders on large lists
- User story: As a user, I want smooth animations and scrolling
- Acceptance criteria:
  - [ ] Add React.memo to ReflectionQuestionCard
  - [ ] Add React.memo to ToneSelection
  - [ ] Add React.memo to ProgressBar
  - [ ] Add React.memo to all dashboard cards
  - [ ] Add custom comparison functions where needed
  - [ ] Verify with React DevTools Profiler

---

## User Flows

### Flow 1: Developer Deploys with Confidence

**Steps:**
1. Developer pushes to main branch
2. CI runs: typecheck, lint, unit tests, E2E tests
3. All tests pass (no continue-on-error)
4. Vercel deploys automatically
5. Sentry monitors for production errors
6. Developer receives alert if errors spike

**Error handling:**
- CI failure: Deployment blocked, PR must be fixed
- Sentry alert: On-call notified with stack trace and context

### Flow 2: User Has Fast Clarify Conversation

**Steps:**
1. User opens Clarify
2. Context built in <100ms (was 250-500ms)
3. User sends message
4. Response streams immediately
5. Session data cached for follow-up messages

**Edge cases:**
- Redis unavailable: Falls back to DB (slower but functional)
- Context too large: Truncated with priority ordering

---

## Data Model Overview

**New/Modified entities:**

1. **Config Schema (new)**
   - Zod schema validating all env vars
   - Loaded once at startup

2. **Cache Layer (new)**
   - Redis keys: `user:{id}:context`, `user:{id}:patterns`, `dream:{id}:stats`
   - TTL: 1-10 minutes depending on data type

---

## Technical Requirements

**Must support:**
- Next.js 14 App Router
- Vitest for unit/integration tests
- Playwright for E2E tests
- Sentry for error monitoring
- Upstash Redis for caching (existing)

**Constraints:**
- Cannot break existing functionality
- Performance improvements must be measurable
- Tests must be deterministic (no flaky tests)

**Preferences:**
- Use existing dependencies where possible
- Prefer smaller, incremental changes
- Each feature independently deployable

---

## Success Criteria

**The MVP is successful when:**

1. **JWT Expiry Enforced**
   - Metric: Tokens older than 30 days rejected
   - Target: 100% of expired tokens rejected

2. **Sentry Integrated**
   - Metric: Errors captured in Sentry dashboard
   - Target: All unhandled exceptions captured with context

3. **Clarify Context < 100ms**
   - Metric: P95 context build time
   - Target: < 100ms (from ~400ms baseline)

4. **CI Blocks on Test Failure**
   - Metric: Failed tests prevent deployment
   - Target: 100% enforcement

5. **E2E Tests Pass**
   - Metric: Playwright test suite
   - Target: 5 critical flows tested

6. **`any` Types Reduced**
   - Metric: `grep -r ": any" --include="*.ts" | wc -l`
   - Target: < 20 (excluding test files)

7. **MirrorExperience.tsx < 400 LOC**
   - Metric: Line count
   - Target: < 400 lines (from 1504)

8. **React.memo on Pure Components**
   - Metric: grep for React.memo
   - Target: 10+ components memoized

---

## Out of Scope

**Explicitly not included in MVP:**
- Database schema changes
- New feature development
- UI redesign
- Mobile app development
- Authentication method changes (OAuth, etc.)
- Internationalization

**Why:** Focus on hardening existing code, not adding new functionality.

---

## Assumptions

1. Existing tests are correct (just need unhandled rejections fixed)
2. Redis (Upstash) can handle additional caching load
3. Sentry free tier (5K errors/month) is sufficient for now
4. Component refactoring won't change business logic
5. Performance improvements will be measurable in production

---

## Open Questions

1. Should rate limiter circuit breaker auto-recover, or require manual reset?
2. What's the appropriate coverage threshold (70%? 80%)?
3. Should we use React.memo everywhere or be selective?
4. How aggressive should caching TTLs be?

---

## Implementation Order

**Iteration 1: Critical Fixes (Security & Observability)**
- JWT expiry enforcement
- Rate limiter fail-closed
- Sentry integration
- Config validation at startup

**Iteration 2: Performance Optimization**
- Parallelize Clarify context queries
- Redis caching layer
- Performance logging/metrics

**Iteration 3: Testing Infrastructure**
- Fix unhandled promise rejections
- CI test blocking
- Playwright E2E setup
- Initial E2E tests

**Iteration 4: Component Testing & TypeScript**
- Add component tests
- Remove `any` types
- Enable noUncheckedIndexedAccess
- Type guards for API responses

**Iteration 5: Code Quality & Optimization**
- Refactor MirrorExperience.tsx
- Add React.memo to components
- Consolidate duplicates
- Final verification

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
