# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis for Test Coverage Expansion

## Vision Summary
Transform Mirror of Dreams from ~21% test coverage to 80%+ line coverage through systematic test expansion, component refactoring (MobileReflectionFlow.tsx), and CI enforcement gates.

---

## Executive Summary

This project requires a **multi-iteration approach (13 iterations)** to achieve comprehensive test coverage. The codebase has a solid foundation with 991 existing tests, well-structured mock utilities, and established test patterns. However, critical gaps exist in:

1. **tRPC router coverage** (5-30% current vs 85% target)
2. **MobileReflectionFlow.tsx** (812 lines, 0% coverage, untestable in current state)
3. **Hook testing** (useReflectionForm, useReflectionViewMode at 0%)
4. **E2E expansion** (39 tests vs 100+ target)

The existing test infrastructure is **mature and well-designed**, with comprehensive mocks for Supabase, Anthropic, and rate limiting. This reduces risk significantly for the expansion effort.

**Overall Complexity: COMPLEX**

---

## Architecture Analysis

### Current Test Infrastructure Architecture

```
test/
  fixtures/        # Test data factories (users, dreams, reflections)
  mocks/           # Supabase, Anthropic, cookies mock utilities
  integration/     # tRPC router integration tests
    auth/          # signin, signup, signout
    dreams/        # create, list, crud
    reflections/   # list, getById
    users/         # user operations

components/**/__tests__/   # Co-located component tests
lib/**/__tests__/          # Utility library tests
server/**/__tests__/       # Server library tests

e2e/                       # Playwright E2E tests
  auth/                    # Auth flow tests
```

### Major System Components

#### 1. tRPC Router Layer (Priority 1 for testing)

| Router File | Lines | Current Coverage | Complexity | Test Priority |
|-------------|-------|------------------|------------|---------------|
| `reflection.ts` | 239 | 5.95% | HIGH | Critical |
| `clarify.ts` | 732 | 15.97% | VERY HIGH | Critical |
| `evolution.ts` | 622 | ~10% | HIGH | High |
| `dreams.ts` | 452 | ~30% | MEDIUM | High |
| `visualizations.ts` | ~200 | ~10% | MEDIUM | Medium |
| `users.ts` | ~300 | ~25% | MEDIUM | Medium |

**Architecture Pattern:** All routers use:
- Zod schema validation
- `protectedProcedure` / `usageLimitedProcedure` middleware
- Supabase database operations
- Anthropic API calls (for AI-powered routers)
- Cache invalidation patterns

**Testability Assessment:**
- Middleware pattern is well-established and mockable
- `test/integration/setup.ts` provides excellent `createTestCaller()` utility
- Anthropic mock exists but needs enhancement for tool use and streaming
- Supabase query chain mock is comprehensive

#### 2. MobileReflectionFlow.tsx (812 lines - Refactoring Required)

**Current Structure Analysis:**

```typescript
// Located: components/reflection/mobile/MobileReflectionFlow.tsx

// Key concerns for testability:
1. Monolithic component with 812 lines
2. 6 wizard steps in single component (dreamSelect, q1-q4, tone)
3. Multiple state variables (currentStepIndex, direction, isTextareaFocused, etc.)
4. Complex animation logic (framer-motion)
5. LocalStorage persistence
6. Browser navigation prevention (beforeunload)
7. Keyboard height handling
8. Exit confirmation modal
9. Gazing overlay with particle effects
```

**Dependencies:**
- `@/components/reflection/ToneSelectionCard`
- `@/components/ui/glass/*` (GlowButton, CosmicLoader, GlassInput, ProgressOrbs)
- `@/contexts/NavigationContext` (useHideBottomNav)
- `@/hooks` (useKeyboardHeight)
- `@/lib/animations/variants`
- `@/lib/utils/constants` (QUESTION_LIMITS)
- `@/lib/utils/haptics`

**Recommended Extraction Pattern (Mirror MirrorExperience.tsx):**

```
hooks/
  useMobileReflectionForm.ts      # Form state management
  useMobileReflectionFlow.ts      # Step/wizard management

components/reflection/mobile/views/
  MobileDreamSelectionView.tsx    # Dream picker (lines 301-367)
  MobileQuestionnaireView.tsx     # Questions q1-q4 (lines 369-438)
  MobileToneSelectionView.tsx     # Tone picker (lines 440-486)
  MobileGazingOverlay.tsx         # Submission overlay (lines 529-761)
  MobileExitConfirmation.tsx      # Exit modal (lines 764-805)
```

**Target:** Refactored MobileReflectionFlow.tsx < 300 lines

#### 3. Hook Architecture

| Hook | Lines | Current Coverage | Testability |
|------|-------|------------------|-------------|
| `useReflectionForm.ts` | 169 | 0% | HIGH |
| `useReflectionViewMode.ts` | 63 | 0% | HIGH |
| `useKeyboardHeight.ts` | ~50 | 0% | MEDIUM |
| `useAuth.ts` | ~100 | 0% | MEDIUM |
| `useDashboard.ts` | ~150 | 0% | MEDIUM |
| `useIsMobile.ts` | ~20 | 0% | HIGH |

**Pattern:** All hooks use:
- React hooks (useState, useEffect, useCallback)
- localStorage for persistence
- URL search params (useSearchParams)
- Toast context for notifications

**Testing Approach:** `@testing-library/react` with `renderHook`

#### 4. Component Architecture (86 TSX files)

**Categories:**
- **Reflection Components:** 12 files, ~10 with tests needed
- **Dashboard Components:** 9 files, 1 with tests
- **UI/Glass Components:** 12 files, 3 with tests
- **Auth Components:** 4 files, 0 with tests
- **Icons:** 2 files, 2 with tests (complete)

**Existing Test Pattern (Excellent):**

```typescript
// Example: ToneBadge.test.tsx - 116 lines
describe('ToneBadge', () => {
  describe('rendering', () => { /* ... */ });
  describe('tone colors', () => { /* ... */ });
  describe('glow effect', () => { /* ... */ });
  describe('styling', () => { /* ... */ });
  describe('custom className', () => { /* ... */ });
});
```

---

## Complexity Assessment

### Overall Complexity Rating: COMPLEX

**Rationale:**

1. **Large Scope:** 267+ TypeScript files requiring coverage analysis
2. **Mixed Test Types:** Unit, component, integration, E2E all need expansion
3. **Refactoring Required:** MobileReflectionFlow.tsx must be split before testing
4. **AI Mock Complexity:** Anthropic SDK needs enhanced mocking for:
   - Extended thinking responses
   - Tool use (createDream, createReflection)
   - Streaming responses
5. **13 Planned Iterations:** Vision document already outlines comprehensive plan
6. **CI/CD Integration:** Coverage gates must be configured and enforced

### Complexity by Area

| Area | Complexity | Effort Estimate | Risk |
|------|------------|-----------------|------|
| MobileReflectionFlow Refactor | HIGH | 6-8 hours | MEDIUM |
| Test Infrastructure Hardening | MEDIUM | 4-6 hours | LOW |
| tRPC Router Tests (6 routers) | HIGH | 15-20 hours | MEDIUM |
| Hook Tests | MEDIUM | 4-6 hours | LOW |
| Component Tests (3 iterations) | MEDIUM | 12-15 hours | LOW |
| Library Tests | MEDIUM | 4-6 hours | LOW |
| Integration Tests | HIGH | 6-8 hours | MEDIUM |
| E2E Expansion | HIGH | 8-10 hours | MEDIUM |
| Documentation & Polish | LOW | 3-4 hours | LOW |

**Total Estimated Effort:** 62-83 hours across 13 iterations

---

## Testing Infrastructure Current State

### Strengths (Existing)

1. **Comprehensive Mock Utilities:**
   - `/test/mocks/supabase.ts` - Full query chain mock
   - `/test/mocks/anthropic.ts` - Message response mocks
   - `/test/integration/setup.ts` - `createTestCaller()` pattern

2. **Test Data Factories:**
   - `/test/fixtures/users.ts` - User tier variants
   - `/test/fixtures/dreams.ts` - Dream scenarios
   - `/test/fixtures/reflections.ts` - Reflection variants

3. **Established Patterns:**
   - Component tests use `@testing-library/react`
   - Integration tests use `createTestCaller()` with mock injection
   - E2E tests use Playwright with auth fixtures

4. **Configuration:**
   - `vitest.config.ts` properly configured
   - Path aliases working
   - Coverage thresholds defined (currently 35% lines)

### Gaps to Address

1. **Missing Factories:**
   - `test/factories/clarify-session.factory.ts`
   - `test/factories/evolution-report.factory.ts`

2. **Anthropic Mock Enhancements Needed:**
   - Tool use block handling (`ToolUseBlock`, `ToolResultBlock`)
   - Extended thinking response format
   - Streaming mock improvements

3. **No Coverage Enforcement:**
   - Current threshold: 35% (too low)
   - Target threshold: 80%
   - No CI blocking on coverage

4. **Missing Test Helpers:**
   - `test/helpers/render.tsx` - Custom render with providers
   - `test/helpers/trpc.ts` - tRPC test client helpers
   - `test/helpers/localStorage.ts` - LocalStorage mock

---

## Refactoring Recommendations for MobileReflectionFlow

### Phase 1: Extract Hooks (Iteration 1, Part A)

**Create `hooks/useMobileReflectionForm.ts`:**

```typescript
// Extract from MobileReflectionFlow.tsx lines: 176-178, 112-113, 278-284
interface UseMobileReflectionFormReturn {
  formData: FormData;
  handleFieldChange: (field: keyof FormData, value: string) => void;
  isDirty: boolean;
  clearForm: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}
```

**Create `hooks/useMobileReflectionFlow.ts`:**

```typescript
// Extract from MobileReflectionFlow.tsx lines: 162-164, 186-239
interface UseMobileReflectionFlowReturn {
  currentStepIndex: number;
  currentStep: WizardStep;
  direction: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoNext: () => boolean;
  handleDragEnd: (event, info: PanInfo) => void;
}
```

### Phase 2: Extract View Components (Iteration 1, Part B)

**Target File Structure:**

```
components/reflection/mobile/
  MobileReflectionFlow.tsx        # < 300 lines (orchestrator)
  views/
    MobileDreamSelectionView.tsx  # 60-70 lines
    MobileQuestionStep.tsx        # 70-80 lines
    MobileToneStep.tsx            # 50-60 lines
  overlays/
    GazingOverlay.tsx             # 150-200 lines (already exists partially)
    ExitConfirmation.tsx          # 40-50 lines (already exists)
```

### Refactoring Risk Mitigation

1. **Manual QA Required:** After refactoring, manually verify all wizard steps work
2. **Snapshot Testing:** Consider adding visual snapshots before refactoring
3. **Feature Parity Checklist:**
   - Swipe navigation works
   - Keyboard height adjustment works
   - LocalStorage persistence works
   - Exit confirmation shows when dirty
   - Browser back/refresh prevention works
   - Progress orbs update correctly

---

## Risk Factors

### High Risks

1. **MobileReflectionFlow Refactoring**
   - **Impact:** Regression in mobile reflection flow (user-facing feature)
   - **Mitigation:** Comprehensive manual QA, add E2E test before refactoring
   - **Recommendation:** Tackle in Iteration 1 with thorough testing after

2. **Anthropic Mock Complexity for Tool Use**
   - **Impact:** Clarify router tests may be incomplete without proper tool mocking
   - **Mitigation:** Enhance anthropic mock with ToolUseBlock support
   - **Recommendation:** Invest in mock infrastructure in Iteration 2

### Medium Risks

1. **Test Suite Runtime Growth**
   - **Impact:** Slow CI feedback (currently ~30s, may grow to 2-3 min)
   - **Mitigation:** Parallelize tests, optimize setup/teardown
   - **Recommendation:** Monitor runtime, add parallel test config

2. **Coverage Gaming**
   - **Impact:** Tests that hit lines but don't verify behavior
   - **Mitigation:** Code review for test quality, require assertions
   - **Recommendation:** Establish test review guidelines

3. **Flaky E2E Tests**
   - **Impact:** CI unreliability, developer frustration
   - **Mitigation:** Use stable selectors, add retry logic, proper waits
   - **Recommendation:** Follow Playwright best practices

### Low Risks

1. **Existing Test Stability** - 991 tests already passing, foundation solid
2. **Mock Utilities** - Well-designed, just need extension
3. **Team Familiarity** - Patterns already established in codebase

---

## Iteration Recommendations

### Recommendation: MULTI-ITERATION (13 iterations as per vision)

The vision document's 13-iteration plan is well-structured and appropriate for the scope.

### Iteration Summary

| Iteration | Focus | Est. Hours | Dependencies |
|-----------|-------|------------|--------------|
| 1 | MobileReflectionFlow Refactor | 6-8 | None |
| 2 | Test Infrastructure Hardening | 4-6 | None |
| 3 | Reflection Router Tests | 4-5 | Iter 2 |
| 4 | Clarify Router Tests | 5-6 | Iter 2 |
| 5 | Evolution + Visualizations Router Tests | 4-5 | Iter 2 |
| 6 | Hook Tests | 4-6 | Iter 1 (hooks extracted) |
| 7 | Reflection Component Tests | 4-5 | Iter 1 |
| 8 | Dashboard Component Tests | 4-5 | None |
| 9 | UI + Auth Component Tests | 4-5 | None |
| 10 | Library Tests | 4-6 | None |
| 11 | Integration Tests | 6-8 | Iter 2-5 |
| 12 | E2E Expansion | 8-10 | All above |
| 13 | Documentation & Polish | 3-4 | All above |

### Critical Path

```
Iteration 1 (Refactor)
    |
    +---> Iteration 6 (Hook Tests) - depends on extracted hooks
    |
    +---> Iteration 7 (Reflection Component Tests) - depends on refactored views

Iteration 2 (Infrastructure)
    |
    +---> Iterations 3-5 (Router Tests) - depends on enhanced mocks
    |
    +---> Iteration 11 (Integration Tests) - depends on router tests

All Iterations
    |
    +---> Iteration 12 (E2E) - validates all features work together
    |
    +---> Iteration 13 (Docs) - documents final state
```

---

## Dependency Graph

```
Foundation Layer
  |
  +-- Test Infrastructure (Iteration 2)
  |     |-- Enhanced Anthropic mocks (tool use, streaming)
  |     |-- Test data factories (clarify, evolution)
  |     |-- Test helpers (render, trpc, localStorage)
  |     |-- Coverage configuration (80% threshold)
  |
  +-- MobileReflectionFlow Refactor (Iteration 1)
        |-- useMobileReflectionForm hook
        |-- useMobileReflectionFlow hook
        |-- View components (DreamSelection, Question, Tone)
        |-- Overlay components (Gazing, ExitConfirmation)

Core Testing Layer
  |
  +-- Router Tests (Iterations 3-5)
  |     |-- reflection.ts (85%+)
  |     |-- clarify.ts (85%+)
  |     |-- evolution.ts (85%+)
  |     |-- visualizations.ts (85%+)
  |     |-- dreams.ts (85%+)
  |     |-- users.ts (85%+)
  |
  +-- Hook Tests (Iteration 6)
  |     |-- useReflectionForm (90%+)
  |     |-- useReflectionViewMode (90%+)
  |     |-- useMobileReflectionForm (90%+)
  |     |-- useMobileReflectionFlow (90%+)
  |
  +-- Component Tests (Iterations 7-9)
        |-- Reflection components (80%+)
        |-- Dashboard components (75%+)
        |-- UI/Auth components (80%+)

Advanced Testing Layer
  |
  +-- Library Tests (Iteration 10)
  |     |-- clarify/context-builder (90%+)
  |     |-- clarify/consolidation (90%+)
  |     |-- anthropic/* (95%+)
  |     |-- server/lib/* (90%+)
  |
  +-- Integration Tests (Iteration 11)
  |     |-- Full reflection flow
  |     |-- Dream lifecycle
  |     |-- Clarify conversation with tool use
  |
  +-- E2E Tests (Iteration 12)
        |-- Dreams flow
        |-- Reflection flow (desktop + mobile)
        |-- Clarify flow
        |-- Dashboard flow

Documentation Layer (Iteration 13)
  |
  +-- docs/testing/*
  +-- CI/CD coverage reports
  +-- README coverage badge
```

---

## Technology Stack Implications

### Existing Stack (No Changes Required)

| Category | Technology | Notes |
|----------|------------|-------|
| Test Runner | Vitest 2.1 | Well-configured, working |
| Component Testing | React Testing Library 16.3 | Established patterns |
| E2E Testing | Playwright 1.49 | 39 tests working |
| Coverage | V8 via @vitest/coverage-v8 | Configured |
| Mocking | Vitest vi.mock | Comprehensive |

### Optional Additions (Consider)

| Tool | Purpose | Recommendation |
|------|---------|----------------|
| MSW | API mocking for integration | Consider for E2E stability |
| Factory.ts | Test data factories | Existing fixtures work well |
| Snapshot testing | Visual regression | Not required per vision |

---

## Security Considerations (Production Mode)

1. **Test Data Isolation:** Ensure fixtures don't contain real user data
2. **API Key Mocking:** Anthropic API key properly mocked in tests
3. **Coverage Reports:** Don't expose source code in public CI artifacts
4. **E2E Auth:** Use dedicated test accounts, not production credentials

---

## CI/CD Pipeline Needs

### Current State

- Tests run but don't block on coverage
- No coverage reporting to PRs
- E2E tests exist but not enforced

### Target State

```yaml
# CI Pipeline Structure
test:
  unit:
    - vitest run --coverage
    - Assert coverage >= 80%
  component:
    - vitest run --coverage (component tests)
  integration:
    - vitest run test/integration/
  e2e:
    - playwright test

coverage-report:
  - Upload coverage to Codecov/Coveralls
  - Comment coverage delta on PR
  - Block merge if coverage decreases
```

### Recommended CI Enhancements

1. Separate test jobs (unit, integration, e2e)
2. Coverage report upload to PR comments
3. Coverage badge in README
4. Block merge on coverage regression

---

## Notes & Observations

1. **Code Quality is High:** Existing code follows consistent patterns, making test writing straightforward

2. **Mock Infrastructure is Excellent:** The `createTestCaller()` pattern with `mockQueries()` is elegant and should be preserved

3. **Vision Document is Comprehensive:** The 13-iteration breakdown in the vision is well-thought-out; recommend following it closely

4. **Hooks are Well-Structured:** useReflectionForm and useReflectionViewMode are clean, testable hooks once extracted

5. **Component Co-location Pattern:** Tests in `__tests__` directories alongside components is a good pattern, continue using it

6. **Type Safety:** Strong TypeScript typing throughout makes test authoring easier

---

*Exploration completed: 2025-12-10*
*This report informs master planning decisions*
