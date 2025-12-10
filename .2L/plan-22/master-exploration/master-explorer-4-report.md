# Master Exploration Report: Iteration Planning & Dependency Mapping

## Explorer ID
master-explorer-4

## Focus Area
Iteration Planning & Dependency Mapping

## Vision Summary
Transform Mirror of Dreams from ~21% test coverage to 80%+ through a comprehensive 13-iteration plan covering component refactoring, tRPC router tests, hooks, components, libraries, integration tests, E2E expansion, and documentation.

---

## Executive Summary

After thorough analysis of the vision document, existing codebase, test infrastructure, and CI/CD pipeline, I validate the **13-iteration breakdown as appropriate and well-structured**. The iterations follow a logical progression from foundation work through to polish, with clear dependencies between phases.

**Key Findings:**
1. **Iteration count is justified** - The scope genuinely requires 13 iterations given the complexity (2,818 lines of router code alone, 812-line component to refactor)
2. **Dependencies are well-identified** - Critical path flows naturally from refactoring (Iter 1) through infrastructure (Iter 2) to testing phases
3. **Existing infrastructure is solid** - Good test infrastructure already exists (`test/mocks/`, `test/fixtures/`, `test/integration/setup.ts`)
4. **CI/CD foundation is in place** - GitHub Actions workflow with quality, test, e2e, and build jobs already configured
5. **Minor optimization possible** - Iterations 8 and 9 could potentially be combined if timeline is tight

**Overall Assessment: APPROVE with minor recommendations**

---

## Iteration Breakdown Validation

### Phase 1: Foundation & Refactoring (Iterations 1-2)

#### Iteration 1: MobileReflectionFlow Refactoring
**Status: VALIDATED - CRITICAL PATH**

| Aspect | Assessment |
|--------|------------|
| Scope | Appropriate - 812 lines to <300 lines |
| Dependencies | None - Foundation iteration |
| Risk Level | HIGH - Breaking changes possible |
| Duration Estimate | 4-6 hours |

**Rationale:**
- File is currently 812 lines (confirmed: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/MobileReflectionFlow.tsx`)
- Must extract hooks and views before testing
- Pattern exists in MirrorExperience.tsx to follow
- All subsequent reflection component tests depend on this

**Recommended Approach:**
1. Extract `useMobileReflectionForm.ts` hook
2. Extract `useMobileReflectionFlow.ts` hook
3. Create `views/MobileDreamSelectionView.tsx`
4. Create `views/MobileQuestionnaireView.tsx`
5. Create `views/MobileReflectionOutputView.tsx`
6. Reduce main component to orchestration only

---

#### Iteration 2: Test Infrastructure Hardening
**Status: VALIDATED - CRITICAL PATH**

| Aspect | Assessment |
|--------|------------|
| Scope | Appropriate - Infrastructure foundation |
| Dependencies | Iter 1 (for mobile hook factories) |
| Risk Level | MEDIUM |
| Duration Estimate | 3-4 hours |

**Rationale:**
- Existing infrastructure is solid (`test/mocks/anthropic.ts`, `test/integration/setup.ts`)
- Need factories for: User, Dream, Reflection, ClarifySession
- Coverage thresholds currently at 35% (per `vitest.config.ts`) - need to raise to 80%
- CI already uploads coverage reports

**Current Infrastructure Status:**
```
test/
  fixtures/    - users.ts, dreams.ts, reflections.ts (PARTIAL)
  mocks/       - anthropic.ts, cookies.ts, supabase.ts (GOOD)
  integration/ - setup.ts + tests (GOOD)
```

**Needed Additions:**
- `test/factories/` directory with proper factory functions
- `test/helpers/render.tsx` for component testing
- `test/helpers/trpc.ts` for tRPC test utilities
- Update `vitest.config.ts` thresholds from 35% to 80%

---

### Phase 2: tRPC Router Tests (Iterations 3-5)

#### Iteration 3: Reflection Router Tests
**Status: VALIDATED**

| Aspect | Assessment |
|--------|------------|
| File Size | 238 lines |
| Current Coverage | ~5.95% |
| Target Coverage | 85% |
| Dependencies | Iter 2 (factories, mocks) |
| Duration Estimate | 3-4 hours |

**Test Scope:**
- `create` mutation - tier limits, Anthropic integration, caching
- `getById` query - access control, 404 handling
- `getByDreamId` query - pagination, ordering
- `getRecent` query - limit parameter
- `delete` mutation - authorization

---

#### Iteration 4: Clarify Router Tests
**Status: VALIDATED**

| Aspect | Assessment |
|--------|------------|
| File Size | 731 lines (LARGEST router) |
| Current Coverage | ~15.97% |
| Target Coverage | 85% |
| Dependencies | Iter 2-3 |
| Duration Estimate | 4-6 hours |

**High Complexity Areas:**
- Tool use (createDream, createReflection)
- Extended thinking processing
- Streaming response handling
- Context building

**Recommendation:** This is the most complex router - allocate extra time.

---

#### Iteration 5: Evolution + Visualizations Router Tests
**Status: VALIDATED - COMBINED ITERATION**

| Aspect | Assessment |
|--------|------------|
| Combined File Size | 1,034 lines (621 + 413) |
| Current Coverage | ~10% each |
| Target Coverage | 85% |
| Dependencies | Iter 2-4 |
| Duration Estimate | 4-5 hours |

**Rationale for Combining:**
- Both routers have similar patterns (AI integration, user ownership)
- Neither is as complex as clarify.ts
- Can share testing utilities developed in Iter 3-4

---

### Phase 3: Hook Tests (Iteration 6)

#### Iteration 6: Hook Tests
**Status: VALIDATED**

| Aspect | Assessment |
|--------|------------|
| Files to Test | 13 hooks total |
| Priority Hooks | useReflectionForm.ts, useReflectionViewMode.ts (0% coverage) |
| Dependencies | Iter 1 (for mobile hooks), Iter 2 (test helpers) |
| Duration Estimate | 4-5 hours |

**Hooks Inventory:**
- `hooks/useReflectionForm.ts` - 0% (CRITICAL)
- `hooks/useReflectionViewMode.ts` - 0% (CRITICAL)
- `hooks/useMobileReflectionForm.ts` - NEW (from Iter 1)
- `hooks/useMobileReflectionFlow.ts` - NEW (from Iter 1)
- `hooks/useAuth.ts`
- `hooks/useDashboard.ts`
- `hooks/useIsMobile.ts`
- `hooks/useKeyboardHeight.ts`
- `hooks/useAnimatedCounter.ts`
- `hooks/useReducedMotion.ts`
- `hooks/useBreathingEffect.ts`
- `hooks/usePortalState.ts`
- `hooks/useScrollDirection.ts`

---

### Phase 4: Component Tests (Iterations 7-9)

#### Iteration 7: Reflection Component Tests
**Status: VALIDATED**

| Aspect | Assessment |
|--------|------------|
| Components | 20 files in reflection/ |
| Dependencies | Iter 1 (refactored components), Iter 6 (tested hooks) |
| Duration Estimate | 4-5 hours |

**Components to Test:**
- `views/DreamSelectionView.tsx`
- `views/ReflectionFormView.tsx`
- `views/ReflectionOutputView.tsx`
- `mobile/views/*.tsx` (from Iter 1)
- `ReflectionQuestionCard.tsx`
- `ToneSelection.tsx`, `ToneBadge.tsx`
- `ProgressBar.tsx`, `ProgressIndicator.tsx`

---

#### Iteration 8: Dashboard Component Tests
**Status: VALIDATED - POTENTIALLY COMBINABLE**

| Aspect | Assessment |
|--------|------------|
| Components | 15 files in dashboard/ |
| Target Coverage | 75% |
| Dependencies | Iter 2 |
| Duration Estimate | 3-4 hours |

**Components:**
- `cards/DreamsCard.tsx`
- `cards/ReflectionsCard.tsx`
- `cards/EvolutionCard.tsx`
- `cards/ProgressStatsCard.tsx`
- `cards/SubscriptionCard.tsx`
- `cards/UsageCard.tsx`
- `cards/VisualizationCard.tsx`
- `shared/DashboardCard.tsx`
- `shared/DashboardGrid.tsx`
- `shared/TierBadge.tsx` (already has tests)
- `shared/ProgressRing.tsx`
- `shared/ReflectionItem.tsx`
- `shared/WelcomeSection.tsx`
- `DashboardHero.tsx`

---

#### Iteration 9: UI + Auth Component Tests
**Status: VALIDATED - POTENTIALLY COMBINABLE**

| Aspect | Assessment |
|--------|------------|
| UI Components | Multiple directories |
| Auth Components | 1 file (`AuthLayout.tsx`) |
| Dependencies | Iter 2 |
| Duration Estimate | 3-4 hours |

**Note:** Auth components are minimal (only `AuthLayout.tsx` found). The vision mentions forms that may be in `app/` directory.

**Potential Optimization:** If timeline is tight, Iter 8 and 9 could be combined into a single "UI Component Tests" iteration (estimated 5-6 hours combined).

---

### Phase 5: Library Tests (Iteration 10)

#### Iteration 10: Library Tests
**Status: VALIDATED**

| Aspect | Assessment |
|--------|------------|
| Clarify Lib | context-builder.ts, consolidation.ts |
| Anthropic Lib | type-guards.ts, types.ts |
| Server Libs | 12 files in server/lib/ |
| Dependencies | Iter 2 |
| Duration Estimate | 4-5 hours |

**Priority Files:**
- `lib/clarify/context-builder.ts` (~20% to 90%)
- `lib/clarify/consolidation.ts` (~15% to 90%)
- `lib/anthropic/type-guards.ts` (target 95%)
- `server/lib/cache.ts`
- `server/lib/rate-limiter.ts`
- `server/lib/temporal-distribution.ts`

---

### Phase 6: Integration Tests (Iteration 11)

#### Iteration 11: Integration Tests
**Status: VALIDATED**

| Aspect | Assessment |
|--------|------------|
| Existing Tests | 7 files in test/integration/ |
| Scope | End-to-end tRPC flows |
| Dependencies | Iter 3-10 (uses all prior work) |
| Duration Estimate | 4-5 hours |

**Existing Integration Tests:**
- `auth/signin.test.ts`
- `auth/signup.test.ts`
- `auth/signout.test.ts`
- `dreams/create.test.ts`
- `dreams/crud.test.ts`
- `dreams/list.test.ts`
- `users/users.test.ts`
- `reflections/reflections.test.ts`

**Needed Additions:**
- Full reflection creation flow
- Dream lifecycle (create -> reflect -> evolve -> complete)
- Clarify conversation flow with tool use
- User registration -> profile setup -> usage tracking

---

### Phase 7: E2E Test Expansion (Iteration 12)

#### Iteration 12: E2E Expansion
**Status: VALIDATED**

| Aspect | Assessment |
|--------|------------|
| Current E2E Tests | 2 spec files (auth/signin.spec.ts, auth/signup.spec.ts) |
| Target | 100+ E2E tests |
| Infrastructure | Playwright configured, fixtures exist |
| Dependencies | Iter 1-11 (all functionality must work) |
| Duration Estimate | 5-7 hours |

**Current E2E Structure:**
```
e2e/
  auth/
    signin.spec.ts
    signup.spec.ts
  fixtures/
    auth.fixture.ts
  pages/
    signin.page.ts
    signup.page.ts
```

**Needed Test Suites:**
- Dreams flow (create, edit, delete, archive)
- Reflection flow (desktop + mobile)
- Clarify flow (conversation, tool use)
- Dashboard flow
- Settings flow
- Mobile responsive tests

---

### Phase 8: Documentation & Polish (Iteration 13)

#### Iteration 13: Documentation & Polish
**Status: VALIDATED**

| Aspect | Assessment |
|--------|------------|
| Docs to Create | 6 markdown files |
| Utilities to Enhance | Factories, helpers |
| CI Improvements | Coverage badges, PR comments |
| Dependencies | All prior iterations |
| Duration Estimate | 3-4 hours |

**Deliverables:**
- `docs/testing/overview.md`
- `docs/testing/patterns.md`
- `docs/testing/mocking.md`
- `docs/testing/factories.md`
- `docs/testing/e2e.md`
- `docs/testing/debugging.md`
- Coverage badge in README
- Enhanced factory functions

---

## Dependency Mapping

### Critical Dependencies Graph

```
Iteration 1: MobileReflectionFlow Refactor
    |
    +--> Iteration 6: Hook Tests (mobile hooks)
    |         |
    |         +--> Iteration 7: Reflection Component Tests
    |
Iteration 2: Test Infrastructure
    |
    +--> Iteration 3: Reflection Router Tests
    |         |
    |         +--> Iteration 4: Clarify Router Tests
    |                   |
    |                   +--> Iteration 5: Evolution + Viz Router Tests
    |
    +--> Iteration 6: Hook Tests
    |
    +--> Iteration 8: Dashboard Component Tests
    |
    +--> Iteration 9: UI + Auth Component Tests
    |
    +--> Iteration 10: Library Tests
    |
    +--> Iteration 11: Integration Tests
              |
              +--> Iteration 12: E2E Expansion
                        |
                        +--> Iteration 13: Documentation & Polish
```

### Dependency Matrix

| Iteration | Depends On | Blocks |
|-----------|------------|--------|
| 1 | None | 6, 7 |
| 2 | 1 (partial) | 3, 4, 5, 6, 8, 9, 10, 11 |
| 3 | 2 | 4, 11 |
| 4 | 2, 3 | 5, 11 |
| 5 | 2, 3, 4 | 11 |
| 6 | 1, 2 | 7 |
| 7 | 1, 6 | 12 |
| 8 | 2 | 12 |
| 9 | 2 | 12 |
| 10 | 2 | 11 |
| 11 | 3, 4, 5, 10 | 12 |
| 12 | 7, 8, 9, 11 | 13 |
| 13 | All | None |

### Blocking Dependencies (CRITICAL)

1. **Iteration 1 blocks Iteration 6 and 7** - Cannot test mobile hooks/components without refactoring
2. **Iteration 2 blocks all testing iterations (3-11)** - Infrastructure must be in place
3. **Iteration 11 blocks Iteration 12** - Integration tests should pass before E2E
4. **All iterations block Iteration 13** - Documentation describes completed work

---

## Critical Path Analysis

### Primary Critical Path
```
Iter 1 (4-6h) --> Iter 2 (3-4h) --> Iter 3 (3-4h) --> Iter 4 (4-6h) -->
Iter 5 (4-5h) --> Iter 11 (4-5h) --> Iter 12 (5-7h) --> Iter 13 (3-4h)

Total: 30-41 hours
```

### Secondary Critical Path
```
Iter 1 (4-6h) --> Iter 6 (4-5h) --> Iter 7 (4-5h) --> Iter 12 (5-7h)

Total: 17-23 hours
```

### Parallel Work Opportunities

The following iterations can run in parallel once their dependencies are met:

**After Iteration 2 completes:**
- Iterations 3, 6, 8, 9, 10 can all start in parallel (if different developers)

**For single developer (sequential):**
- Primary path takes precedence
- Component tests (7, 8, 9) can be batched together

---

## Optimization Recommendations

### Recommendation 1: Combine Iterations 8 and 9
**Rationale:** Dashboard and UI/Auth components have similar testing patterns and dependencies. Combined iteration would be 6-7 hours.

**Impact:** Reduces total iterations from 13 to 12.

**Risk:** Increased cognitive load in single iteration.

**Verdict:** OPTIONAL - only if timeline pressure exists.

### Recommendation 2: Start Iteration 6 Earlier
**Rationale:** Hook tests only depend on Iteration 1 (for mobile hooks) and 2 (for test utilities). Non-mobile hooks can be tested after Iteration 2 alone.

**Implementation:**
- Start testing existing hooks (useAuth, useDebounce, etc.) immediately after Iter 2
- Add mobile hook tests after Iter 1 completes

### Recommendation 3: Parallelize E2E Test Writing
**Rationale:** E2E test suites are independent of each other.

**Implementation:**
- Split Iter 12 into sub-tasks:
  - Dreams flow tests
  - Reflection flow tests
  - Clarify flow tests
  - Dashboard/Settings tests
- Write in parallel if resources allow

### Recommendation 4: Early CI Threshold Enforcement
**Rationale:** Catch coverage regressions early.

**Implementation:**
- In Iteration 2, set intermediate threshold of 50%
- Increment by 10% every 2 iterations
- Final 80% threshold in Iteration 11

---

## CI/CD Integration Strategy

### Current CI/CD State
```yaml
# .github/workflows/ci.yml
Jobs:
  quality (lint, typecheck, format)
     |
     v
  test (vitest with coverage)
     |
     v
  e2e (playwright - chromium only in CI)
     |
     v
  build
```

### Iteration-Specific CI Enhancements

#### Iteration 2: Test Infrastructure
- Update `vitest.config.ts` thresholds progressively
- Add lcov reporter for coverage tools
- Configure coverage to include new directories

```typescript
// vitest.config.ts updates needed
coverage: {
  thresholds: {
    statements: 50, // Start at 50%, increase over time
    branches: 45,
    functions: 50,
    lines: 50,
  },
  include: [
    'app/**/*.{ts,tsx}',  // ADD
    'hooks/**/*.{ts,tsx}', // ADD
    // existing includes...
  ],
}
```

#### Iteration 11: Integration Tests
- Add integration test job (separate from unit tests)
- Configure test database for integration tests if needed

```yaml
# Add to ci.yml
integration:
  name: Integration Tests
  runs-on: ubuntu-latest
  needs: test
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run test:integration
```

#### Iteration 12: E2E Expansion
- Add matrix strategy for different browsers (optional)
- Add mobile viewport testing

```yaml
# Update e2e job
e2e:
  strategy:
    matrix:
      browser: [chromium]
      viewport: [desktop, mobile]
```

#### Iteration 13: Documentation & Polish
- Add coverage badge to README
- Configure PR comments with coverage diff

```yaml
# Add coverage reporting
- name: Coverage Summary
  uses: irongut/CodeCoverageSummary@v1.3.0
  with:
    filename: coverage/cobertura-coverage.xml
    badge: true
    output: both
```

### CI Quality Gates by Phase

| Phase | Iterations | Line Coverage Gate |
|-------|------------|-------------------|
| Foundation | 1-2 | 35% (current) |
| Routers | 3-5 | 50% |
| Hooks | 6 | 60% |
| Components | 7-9 | 70% |
| Libraries | 10 | 75% |
| Integration | 11 | 80% |
| E2E | 12 | 80% (maintained) |
| Polish | 13 | 80% (enforced) |

---

## Final Iteration Plan

### CONFIRMED: 13 Iterations

| # | Name | Duration | Blocking Deps | Risk |
|---|------|----------|---------------|------|
| 1 | MobileReflectionFlow Refactor | 4-6h | None | HIGH |
| 2 | Test Infrastructure | 3-4h | 1 (partial) | MEDIUM |
| 3 | Reflection Router Tests | 3-4h | 2 | LOW |
| 4 | Clarify Router Tests | 4-6h | 2,3 | MEDIUM |
| 5 | Evolution + Viz Router Tests | 4-5h | 2,3,4 | LOW |
| 6 | Hook Tests | 4-5h | 1,2 | LOW |
| 7 | Reflection Component Tests | 4-5h | 1,6 | LOW |
| 8 | Dashboard Component Tests | 3-4h | 2 | LOW |
| 9 | UI + Auth Component Tests | 3-4h | 2 | LOW |
| 10 | Library Tests | 4-5h | 2 | LOW |
| 11 | Integration Tests | 4-5h | 3,4,5,10 | MEDIUM |
| 12 | E2E Expansion | 5-7h | 7,8,9,11 | MEDIUM |
| 13 | Documentation & Polish | 3-4h | All | LOW |

**Total Estimated Duration: 44-63 hours**

### Iteration Success Criteria

| Iteration | Success Criteria |
|-----------|-----------------|
| 1 | MobileReflectionFlow.tsx < 300 lines, hooks extracted, functionality preserved |
| 2 | Factories created, CI thresholds updated, test helpers documented |
| 3 | reflection.ts at 85%+ coverage |
| 4 | clarify.ts at 85%+ coverage |
| 5 | evolution.ts and visualizations.ts at 85%+ coverage |
| 6 | All hooks at 85%+ coverage |
| 7 | Reflection components at 80%+ coverage |
| 8 | Dashboard components at 75%+ coverage |
| 9 | UI/Auth components at 80%+ coverage |
| 10 | Library files at 90%+ coverage |
| 11 | Critical user flows have integration tests |
| 12 | 100+ E2E tests, all critical journeys covered |
| 13 | Docs complete, badge in README, CI reports on PRs |

---

## Risk Assessment

### High Risk Items

1. **MobileReflectionFlow Refactoring (Iter 1)**
   - **Risk:** Breaking existing functionality
   - **Mitigation:** Manual QA after refactor, comprehensive tests, keep backup

2. **Clarify Router Testing (Iter 4)**
   - **Risk:** Complex mocking for streaming and tool use
   - **Mitigation:** Build robust mock utilities in Iter 2, allocate extra time

### Medium Risk Items

1. **E2E Test Flakiness (Iter 12)**
   - **Risk:** Flaky tests blocking CI
   - **Mitigation:** Use stable selectors, add wait utilities, retry logic

2. **Coverage Gaming**
   - **Risk:** Tests that hit lines without meaningful assertions
   - **Mitigation:** Code review for test quality, focus on behavior testing

### Low Risk Items

1. **Documentation (Iter 13)**
   - Risk is low as this is documentation of completed work

---

## Notes & Observations

1. **Test Infrastructure is Better Than Expected**
   - Existing `test/integration/setup.ts` is comprehensive (318 lines)
   - Anthropic mock factory is well-designed
   - Supabase mock chain handles all query methods

2. **Current CI Workflow is Solid**
   - Already has separate jobs for quality, test, e2e, build
   - Coverage artifacts are uploaded
   - Proper concurrency management

3. **MobileReflectionFlow is the Biggest Blocker**
   - 812 lines is genuinely untestable
   - Refactoring pattern exists in MirrorExperience.tsx
   - This MUST complete before significant component testing

4. **Clarify Router is Most Complex**
   - 731 lines with tool use, streaming, context building
   - May need extra iteration time
   - Good mock foundation exists in anthropic.ts

5. **E2E Infrastructure Needs Expansion**
   - Only 2 spec files currently
   - Page object pattern started (signin.page.ts, signup.page.ts)
   - Need to scale to 100+ tests

---

*Exploration completed: 2025-12-10*
*This report validates and provides detailed analysis of the 13-iteration plan*
