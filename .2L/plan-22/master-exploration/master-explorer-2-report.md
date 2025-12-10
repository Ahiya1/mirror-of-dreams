# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment for Test Coverage Expansion

## Vision Summary
Transform Mirror of Dreams from ~21% line coverage to 80%+ coverage through a comprehensive 13-iteration test expansion plan, focusing on tRPC router testing, component tests, hook tests, and E2E expansion.

---

## Executive Summary

The test coverage expansion plan requires significant infrastructure investment before test writing can proceed efficiently. The project has **solid foundational test tooling** (Vitest 2.1.0, RTL 16.3.0, Playwright 1.49.0) but **critical gaps in mock utilities and test factories** that will bottleneck iteration 3+ work.

**Key Findings:**
- Test infrastructure is 60% ready - missing hook test utilities, clarify session factories, tRPC context helpers
- 13 tRPC routers totaling ~5,000 lines need 85%+ coverage (currently ~15% average)
- MobileReflectionFlow.tsx at 812 lines matches vision document - refactoring is prerequisite
- CI/CD already runs tests but lacks coverage gates and PR reporting
- Existing test patterns are solid - can be expanded with low friction

**Risk Level: MEDIUM** - Primary risks are in Anthropic streaming mocks and integration test complexity

---

## Test Framework Analysis

### Current Test Stack

| Tool | Version | Status | Notes |
|------|---------|--------|-------|
| Vitest | ^2.1.0 | Installed | Modern, fast test runner |
| @vitest/coverage-v8 | ^2.1.0 | Installed | Coverage provider configured |
| @vitest/ui | ^2.1.0 | Installed | Test UI available |
| @testing-library/react | ^16.3.0 | Installed | Component testing ready |
| @testing-library/jest-dom | ^6.9.1 | Installed | DOM matchers |
| @testing-library/user-event | ^14.6.1 | Installed | User interaction simulation |
| @playwright/test | ^1.49.0 | Installed | E2E testing configured |
| happy-dom | ^15.11.0 | Installed | Fast DOM environment |

### Vitest Configuration Analysis

**Current Settings (`vitest.config.ts`):**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    statements: 35,  // Target: 80
    branches: 55,    // Target: 75
    functions: 60,   // Target: 80
    lines: 35,       // Target: 80
  },
}
```

**Gap Assessment:**
- Current thresholds (35-60%) are far below vision target (75-80%)
- Missing `lcov` reporter needed for CI badge integration
- No per-file thresholds for critical router files
- Coverage includes array correct but missing `hooks/**/*.ts`

### Playwright Configuration Analysis

**Current Settings (`playwright.config.ts`):**
- Test directory: `./e2e`
- Parallel execution enabled
- CI runs Chromium only (correct for speed)
- Local runs multi-browser (Chromium, Firefox, Mobile Safari)
- Retry logic: 2 retries in CI
- Web server auto-starts dev server

**Gap Assessment:**
- Only 2 E2E spec files exist (auth/signin.spec.ts, auth/signup.spec.ts)
- Missing E2E test fixtures and helpers
- No page object model patterns established
- No authenticated session management utilities

---

## Dependency Assessment

### Feature Dependency Chain

```
Iteration 1: MobileReflectionFlow Refactor
    |
    +-- No dependencies, can start immediately
    |
    v
Iteration 2: Test Infrastructure
    |
    +-- Depends on: Understanding of patterns from Iteration 1
    +-- Outputs: Factories, helpers, mocks
    |
    v
Iterations 3-6: Router & Hook Tests
    |
    +-- Depends on: Test infrastructure (Iteration 2)
    +-- Can run in parallel after Iteration 2
    |
    v
Iterations 7-9: Component Tests
    |
    +-- Depends on: Some hook tests for integration
    +-- Mostly parallel-capable
    |
    v
Iterations 10-11: Library & Integration Tests
    |
    +-- Depends on: All mock infrastructure
    |
    v
Iteration 12: E2E Expansion
    |
    +-- Depends on: Working application, stable tests
    |
    v
Iteration 13: Documentation & Polish
    |
    +-- Depends on: All previous iterations
```

### Critical Path Analysis

**Blocking Dependencies:**
1. **Iteration 2 is critical path** - All subsequent router/hook tests depend on test factories
2. **Anthropic mock** exists but needs streaming enhancements for clarify router tests
3. **tRPC test caller** exists and is well-designed - reusable across iterations 3-6

**Parallel Opportunities:**
- Iterations 3 (Reflection) and 4 (Clarify) can run in parallel after Iteration 2
- Iterations 5 (Evolution/Visualizations) can start when Iteration 3 completes
- Component tests (Iterations 7-9) have minimal cross-dependencies

### External Service Dependencies

| Service | Current Mock Status | Gap |
|---------|---------------------|-----|
| Supabase | Complete chainable mock | None - well implemented |
| Anthropic API | Basic mock exists | Missing streaming mock enhancement |
| PayPal | Environment vars set | No mock - not needed per scope |
| Rate Limiter | Bypassed in tests | None - correctly handled |
| Logger | Fully mocked | None |
| Cookies | Mocked | None |
| Email | Mocked | None |

---

## Mock Infrastructure Gaps

### Current Mock Inventory

**Available (`/test/mocks/`):**
1. `anthropic.ts` - Message response mocks, streaming basic, error scenarios
2. `supabase.ts` - Full query chain mock, auth mock, storage mock
3. `cookies.ts` - Auth cookie mock

**Available (`/test/integration/setup.ts`):**
- `createTestCaller()` - tRPC caller with mocked context
- `mockQuery()` / `mockQueries()` - Table response mocking
- Rate limiter bypass
- Logger suppression
- Email mocking

### Missing Mock Utilities

| Mock | Priority | Effort | Blocking |
|------|----------|--------|----------|
| Hook test helpers (`renderHook` wrapper) | HIGH | 2h | Iteration 6 |
| Enhanced Anthropic streaming | HIGH | 4h | Iterations 3-4 |
| Extended thinking response mock | MEDIUM | 2h | Iterations 3, 5 |
| Tool use (createDream, createReflection) mock | MEDIUM | 3h | Iteration 4 |
| Clarify session context builder mock | MEDIUM | 2h | Iteration 4 |
| tRPC error helper functions | LOW | 1h | Nice-to-have |
| E2E auth session management | HIGH | 4h | Iteration 12 |

### Streaming Mock Gap Detail

The current Anthropic streaming mock in `test/mocks/anthropic.ts` provides basic async iterator:

```typescript
createMessagesStreamMock = () => {
  // Only yields: content_block_start, content_block_delta,
  // content_block_stop, message_stop
}
```

**Missing for Clarify router tests:**
- Tool use blocks (`tool_use`, `tool_result`)
- Thinking blocks with streaming
- Error scenarios during stream
- Partial message recovery

---

## Test Factory Requirements

### Current Factory Inventory

**Available (`/test/fixtures/`):**
1. `users.ts` - Comprehensive user factory with 15+ scenarios
2. `dreams.ts` - Dream factory with tier limits, status variations
3. `reflections.ts` - Reflection factory with tone variations

### Factory Quality Assessment

| Factory | Completeness | Pattern | Notes |
|---------|--------------|---------|-------|
| Users | 95% | createMockUser + scenarios | Excellent - all tiers covered |
| Dreams | 90% | createMockDream + scenarios | Good - status transitions covered |
| Reflections | 85% | createMockReflection + scenarios | Good - missing some edge cases |

### Missing Factories

| Factory | Priority | Needed For | Effort |
|---------|----------|------------|--------|
| `clarify-session.factory.ts` | HIGH | Iteration 4 (Clarify Router) | 4h |
| `evolution.factory.ts` | MEDIUM | Iteration 5 (Evolution Router) | 2h |
| `visualization.factory.ts` | MEDIUM | Iteration 5 (Visualizations Router) | 2h |
| `subscription.factory.ts` | LOW | Iteration integration tests | 1h |

### Clarify Session Factory Requirements

The clarify router (731 lines) requires complex session state mocking:

```typescript
// Required factory capabilities:
createMockClarifySession({
  userId: string,
  messageHistory: Message[],
  toolUseHistory: ToolUse[],
  context: BuildContext,
  status: 'active' | 'ended',
});

createMockClarifyMessage({
  role: 'user' | 'assistant',
  content: string | ContentBlock[],
  toolUse?: ToolUse,
});

createMockClarifyContext({
  userPatterns: Pattern[],
  dreamHistory: Dream[],
  reflectionHistory: Reflection[],
});
```

---

## Risk Assessment

### High Risks

**Risk 1: MobileReflectionFlow Refactoring Breaks Production**
- **Description:** The 812-line component refactoring may introduce regressions
- **Impact:** Critical user flow broken, production incidents
- **Probability:** Medium (30-40%)
- **Mitigation:**
  - Add E2E test for mobile reflection flow BEFORE refactoring
  - Manual QA protocol after refactoring
  - Feature flag for gradual rollout
- **Recommendation:** Add E2E coverage in Iteration 1 before refactoring

**Risk 2: Anthropic Streaming Mock Complexity**
- **Description:** Clarify router uses complex streaming with tool use
- **Impact:** Iteration 4 tests incomplete or flaky
- **Probability:** Medium (25-35%)
- **Mitigation:**
  - Build streaming mock utilities early in Iteration 2
  - Create reusable scenarios for common streaming patterns
  - Consider MSW for more realistic mocking (optional)
- **Recommendation:** Allocate extra time in Iteration 2 for streaming mocks

### Medium Risks

**Risk 3: Test Suite Performance Degradation**
- **Description:** 2000+ tests may significantly slow CI
- **Impact:** Developer productivity, CI costs
- **Probability:** Medium (40%)
- **Current State:** ~30 seconds for 991 tests
- **Projected:** 2-4 minutes for 2000+ tests
- **Mitigation:**
  - Parallelize test runs
  - Use `vitest run --shard` in CI
  - Optimize setup/teardown
- **Recommendation:** Monitor test runtime, implement sharding if >2 min

**Risk 4: E2E Test Flakiness**
- **Description:** E2E tests historically flaky in complex apps
- **Impact:** CI failures, developer frustration
- **Probability:** High (50%)
- **Mitigation:**
  - Strict waiting strategies (not arbitrary timeouts)
  - Stable data-testid selectors
  - Retry logic already configured (2 retries in CI)
  - Isolated test data per run
- **Recommendation:** Establish E2E patterns early in Iteration 12

**Risk 5: Coverage Gaming**
- **Description:** Tests written for coverage, not quality
- **Impact:** False confidence, bugs in production
- **Probability:** Low-Medium (20%)
- **Mitigation:**
  - Code review focus on test quality
  - Mutation testing (optional, future)
  - Enforce assertion density
- **Recommendation:** Include test quality in code review checklist

### Low Risks

**Risk 6: CI Resource Constraints**
- **Description:** Extended test runs may hit GitHub Actions limits
- **Probability:** Low (10%)
- **Mitigation:** Monitor usage, optimize as needed

**Risk 7: Test Data Cleanup**
- **Description:** Integration tests may leave orphaned data
- **Probability:** Low (15%)
- **Mitigation:** Mocks don't hit real database, E2E uses isolated accounts

---

## CI/CD Tooling Analysis

### Current CI Pipeline (`.github/workflows/ci.yml`)

```yaml
Jobs:
1. quality    - TypeScript, ESLint, Prettier
2. test       - Vitest with coverage (uploads artifact)
3. e2e        - Playwright (Chromium only)
4. build      - Next.js build
```

### Missing CI Features

| Feature | Priority | Effort | Iteration |
|---------|----------|--------|-----------|
| Coverage threshold enforcement | HIGH | 1h | 2 |
| Coverage PR comments | MEDIUM | 2h | 13 |
| Coverage badge in README | LOW | 1h | 13 |
| Separate test jobs (unit/integration) | MEDIUM | 2h | 13 |
| Test result summary annotations | LOW | 1h | 13 |
| Codecov/Coveralls integration | MEDIUM | 2h | 13 |

### Recommended CI Enhancements

**Iteration 2 - Coverage Gates:**
```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Check coverage thresholds
  run: |
    # Fail if thresholds not met
    # Thresholds configured in vitest.config.ts
```

**Iteration 13 - PR Reporting:**
```yaml
- name: Coverage Report
  uses: codecov/codecov-action@v4
  with:
    files: coverage/lcov.info
    fail_ci_if_error: true
```

---

## Security-Related Testing Dependencies

### Authentication Testing
- **Current:** `test/integration/auth/` has signin, signout, signup tests
- **Mock:** Cookie-based auth properly mocked
- **Gap:** No JWT validation edge case tests

### Rate Limiting Testing
- **Current:** Bypassed in tests (correct for unit tests)
- **Gap:** No integration tests verifying rate limits work
- **Recommendation:** Add 1-2 E2E tests for rate limit behavior

### Input Validation Testing
- **Current:** Zod schemas used throughout
- **Gap:** Limited negative test cases for malicious input
- **Recommendation:** Add validation edge cases in router tests

---

## Recommended Iteration Breakdown

### Updated Dependency-Aware Breakdown

| Iteration | Focus | Dependencies | Blockers Resolved |
|-----------|-------|--------------|-------------------|
| 1 | MobileReflectionFlow Refactor | None | Enables component testing |
| 2 | Test Infrastructure | None | Unblocks iterations 3-11 |
| 3 | Reflection Router Tests | Iteration 2 | - |
| 4 | Clarify Router Tests | Iteration 2, enhanced streaming mock | - |
| 5 | Evolution + Viz Router Tests | Iteration 2 | - |
| 6 | Hook Tests | Iteration 2, renderHook helper | - |
| 7 | Reflection Component Tests | Iteration 1 (refactored components) | - |
| 8 | Dashboard Component Tests | Iteration 2 | - |
| 9 | UI + Auth Component Tests | Iteration 2 | - |
| 10 | Library Tests | Iterations 2-4 (patterns established) | - |
| 11 | Integration Tests | All mocks complete | - |
| 12 | E2E Expansion | Working app, E2E auth helpers | - |
| 13 | Documentation & Polish | All previous | - |

### Risk-Adjusted Time Estimates

| Iteration | Base Estimate | Risk Buffer | Total |
|-----------|---------------|-------------|-------|
| 1 | 3h | +1h (refactoring risk) | 4h |
| 2 | 4h | +2h (streaming mocks) | 6h |
| 3 | 3h | +0.5h | 3.5h |
| 4 | 4h | +1h (tool use complexity) | 5h |
| 5 | 3h | +0.5h | 3.5h |
| 6 | 3h | +0.5h | 3.5h |
| 7 | 3h | +0.5h | 3.5h |
| 8 | 2h | +0.5h | 2.5h |
| 9 | 3h | +0.5h | 3.5h |
| 10 | 3h | +0.5h | 3.5h |
| 11 | 3h | +1h (integration complexity) | 4h |
| 12 | 4h | +2h (E2E flakiness) | 6h |
| 13 | 2h | +0.5h | 2.5h |
| **Total** | **40h** | **+11h** | **51h** |

---

## Recommendations for Master Plan

### Priority 1: Infrastructure Before Tests

**Recommendation:** Iteration 2 must be comprehensive before iterations 3-6 begin.

**Rationale:** The test infrastructure gap analysis shows missing:
- Clarify session factory (4h work)
- Enhanced streaming mocks (4h work)
- Hook testing utilities (2h work)

Without these, iterations 3-6 will face constant blockers.

### Priority 2: Add E2E Before Refactoring

**Recommendation:** Add basic E2E test for mobile reflection flow BEFORE Iteration 1 refactoring.

**Rationale:** The 812-line component refactoring is high-risk. Having E2E coverage first provides safety net.

**Suggested approach:**
- Add 1 E2E test covering mobile reflection happy path (30 min)
- Then proceed with refactoring

### Priority 3: Streaming Mock Investment

**Recommendation:** Budget 4-6 hours specifically for Anthropic streaming mock enhancement in Iteration 2.

**Rationale:** Clarify router (731 lines) is the second-largest router and has complex streaming with tool use. Inadequate mocking will cause Iteration 4 to fail or produce low-quality tests.

### Priority 4: Consider MSW for Integration Tests

**Recommendation:** Evaluate MSW (Mock Service Worker) for Iteration 11 integration tests.

**Rationale:** The vision document mentions MSW as optional. Given the complexity of Anthropic streaming and Supabase operations, MSW could provide more realistic mocking at the network level, reducing mock maintenance burden.

**Trade-off:** Additional dependency vs. more maintainable mocks.

---

## Technology Recommendations

### Existing Tooling - Keep

| Tool | Reason |
|------|--------|
| Vitest | Fast, modern, excellent DX |
| RTL | Standard for React testing |
| Playwright | Solid E2E framework |
| happy-dom | Faster than jsdom |

### Consider Adding

| Tool | Purpose | Priority |
|------|---------|----------|
| MSW | Network-level mocking | Medium (Iteration 11) |
| @faker-js/faker | Dynamic test data | Low (manual fixtures work) |
| fishery | Factory library | Low (current pattern works) |

### Do Not Add

| Tool | Reason |
|------|--------|
| Jest | Already using Vitest |
| Cypress | Already using Playwright |
| Enzyme | Deprecated pattern |

---

## Notes & Observations

### Test Pattern Quality

The existing test code in `/test/integration/` demonstrates excellent patterns:
- Clean separation of mocks and fixtures
- Consistent use of `createTestCaller()`
- Good error case coverage
- Clear test descriptions

These patterns should be extended, not replaced.

### Coverage Calculation Concern

The vision states "~21% line coverage" but current Vitest config excludes `hooks/**/*.ts` from coverage. Actual coverage may be lower when hooks are included.

### Router Complexity Distribution

```
Router Files by Complexity:
- clarify.ts: 731 lines (HIGHEST - streaming, tool use)
- lifecycle.ts: 642 lines (HIGH - multi-entity)
- evolution.ts: 621 lines (HIGH - AI integration)
- dreams.ts: 451 lines (MEDIUM)
- auth.ts: 445 lines (MEDIUM)
- admin.ts: 427 lines (MEDIUM)
- visualizations.ts: 413 lines (MEDIUM)
- users.ts: 364 lines (MEDIUM)
- subscriptions.ts: 264 lines (LOW)
- reflection.ts: 238 lines (LOW)
- reflections.ts: 217 lines (LOW)
- artifact.ts: 210 lines (LOW)
- _app.ts: 32 lines (TRIVIAL)
```

**Testing priority should follow complexity, not alphabetical order.**

---

*Exploration completed: 2025-12-10T14:30:00Z*
*This report informs master planning decisions for test coverage expansion*
