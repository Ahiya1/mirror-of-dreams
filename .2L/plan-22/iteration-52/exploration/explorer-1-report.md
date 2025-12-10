# Explorer 1 Report: Testing Documentation and Configuration Analysis

## Executive Summary

The Mirror of Dreams project has a robust test infrastructure (factories, helpers, mocks) but is missing the testing documentation outlined in vision.md. The vitest.config.ts coverage thresholds are set well below the 80% target (currently at 29% lines, 55% branches). The README lacks a coverage badge, and the CI workflow uploads coverage artifacts but does not publish them to PR comments or enforce threshold gates. This iteration needs to focus on: (1) updating coverage thresholds to 80%, (2) creating comprehensive testing documentation, (3) adding a coverage badge to README, and (4) enhancing CI with coverage reporting to PR comments.

---

## Current Configuration Status

### Vitest Coverage Configuration

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts`

**Current Thresholds:**
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Statements | 29% | 80% | 51% |
| Branches | 55% | 75% | 20% |
| Functions | 44% | 80% | 36% |
| Lines | 29% | 80% | 51% |

**Current Coverage Include:**
```typescript
include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts', 'components/**/*.tsx']
```

**Issue:** Missing `hooks/**/*.ts` and `app/**/*.{ts,tsx}` from coverage includes (per vision.md target configuration).

**Current Reporters:**
```typescript
reporter: ['text', 'json', 'html', 'lcov', 'json-summary']
```

This is good - includes all necessary formats for badge generation and CI reporting.

### CI Workflow Configuration

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml`

**Current State:**
- Runs `npm run test:coverage` 
- Uploads coverage artifacts to GitHub Actions
- No coverage threshold enforcement (CI will pass even with low coverage)
- No PR comment integration for coverage reports
- No coverage badge generation

**Missing Features:**
1. Coverage threshold enforcement (fail CI if below 80%)
2. PR comment integration showing coverage delta
3. Coverage badge updating workflow
4. Separate jobs for unit vs integration tests

### Package.json Test Scripts

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/package.json`

**Current Scripts:**
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage",
"test:ui": "vitest --ui",
"test:e2e": "playwright test"
```

These are adequate for the current needs.

---

## Documentation Status

### Existing Documentation

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/docs/`

**Current Files:**
1. `philosophy.md` - Project philosophy (not testing related)
2. `PRODUCTION_SETUP.md` - Production deployment guide (not testing related)
3. `prompt-transformation-map.md` - AI prompt documentation
4. `sacred-contract.md` - Project principles
5. `voice-bible.md` - Voice/tone guidelines

**Missing Testing Documentation (per vision.md):**
1. `docs/testing/overview.md` - Testing philosophy and strategy
2. `docs/testing/patterns.md` - Common test patterns with examples
3. `docs/testing/mocking.md` - How to mock Supabase, Anthropic, etc.
4. `docs/testing/factories.md` - Using test data factories
5. `docs/testing/e2e.md` - E2E testing guide
6. `docs/testing/debugging.md` - Debugging failing tests

### README Coverage Badge Status

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/README.md`

**Current State:** No coverage badge present. The README has extensive documentation about the application but no testing metrics or badges.

**Required Addition:** Coverage badge showing current test coverage percentage.

---

## Test Infrastructure Assessment

### Test Factories (Excellent State)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/factories/`

**Available Factories:**
1. `user.factory.ts` - User creation with tier variations
2. `dream.factory.ts` - Dream creation with categories/statuses
3. `reflection.factory.ts` - Reflection creation with tones
4. `clarify.factory.ts` - Clarify session/message/pattern factories

**Exports:** 70+ factory functions and pre-configured scenarios

**Assessment:** Factories are well-documented with JSDoc comments, properly typed, and provide comprehensive test data generation. This is ready for documentation.

### Test Helpers (Excellent State)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/helpers/`

**Available Helpers:**
1. `render.tsx` - `renderWithProviders`, `createTestQueryClient`
2. `trpc.ts` - `createMockQueryResult`, `createMockMutation`, `createMockContext`
3. `index.ts` - Barrel exports with comprehensive JSDoc

**Re-exports:** All Testing Library utilities for single-import convenience

**Assessment:** Helpers are well-structured with clear documentation. Ready for formal documentation.

### Test Mocks (Excellent State)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/`

**Available Mocks:**
1. `anthropic.ts` - Claude API mock with streaming support, error scenarios
2. `supabase.ts` - Full Supabase client mock (query builder, auth, storage)
3. `cookies.ts` - Cookie handling mocks

**Pre-built Scenarios:**
- `mockResponses.reflection`, `mockResponses.clarify`, `mockResponses.evolution`
- `anthropicErrors.unauthorized`, `anthropicErrors.rateLimited`
- `supabaseErrors.notFound`, `supabaseErrors.unauthorized`

**Assessment:** Mocks are comprehensive with pre-built error scenarios. These need formal documentation explaining usage patterns.

### E2E Tests Status

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/`

**Current Spec Files:**
1. `auth/signin.spec.ts`
2. `auth/signup.spec.ts`
3. `landing/landing.spec.ts`
4. `dashboard/dashboard.spec.ts`
5. `dreams/dreams.spec.ts`
6. `reflection/reflection.spec.ts`

**Total E2E Tests:** ~158 test definitions

**Assessment:** E2E tests expanded significantly from the original 39. Documentation should cover these test suites.

---

## Required Changes

### 1. Update vitest.config.ts Coverage Thresholds

**Priority:** HIGH

**Changes Required:**
```typescript
thresholds: {
  statements: 80,  // from 29
  branches: 75,    // from 55
  functions: 80,   // from 44
  lines: 80,       // from 29
}
```

**Also Update Include:**
```typescript
include: [
  'app/**/*.{ts,tsx}',     // ADD
  'components/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',   // ADD
  'lib/**/*.ts',
  'server/**/*.ts',
  'types/**/*.ts',
],
```

### 2. Create Testing Documentation

**Priority:** HIGH

**Files to Create:**

| File | Purpose | Content Focus |
|------|---------|---------------|
| `docs/testing/overview.md` | Testing strategy | Philosophy, tool choices, running tests |
| `docs/testing/patterns.md` | Common patterns | Unit, component, integration, hook testing |
| `docs/testing/mocking.md` | Mock usage | Anthropic, Supabase, tRPC mock examples |
| `docs/testing/factories.md` | Factory guide | All factory functions with examples |
| `docs/testing/e2e.md` | E2E guide | Playwright setup, fixtures, running tests |
| `docs/testing/debugging.md` | Debug guide | Common issues, CI debugging, coverage gaps |

### 3. Add Coverage Badge to README

**Priority:** MEDIUM

**Options:**
1. **Codecov** - Upload to Codecov service, use their badge
2. **Shields.io with JSON endpoint** - Read from `coverage/coverage-summary.json`
3. **Local badge generation** - Generate SVG during CI

**Recommended:** Use Codecov integration for simplest maintenance.

**Badge Location:** Near the top of README after the project title.

**Example:**
```markdown
![Coverage](https://codecov.io/gh/Ahiya1/mirror-of-truth-online/branch/main/graph/badge.svg)
```

### 4. Enhance CI Workflow

**Priority:** MEDIUM

**Required Additions:**

1. **Coverage threshold enforcement:**
```yaml
- name: Check coverage thresholds
  run: npm run test:coverage -- --coverage.thresholds.100=false
```

2. **PR coverage comments (using codecov/codecov-action):**
```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    fail_ci_if_error: true
```

3. **Coverage summary in workflow:**
```yaml
- name: Coverage Summary
  run: cat coverage/coverage-summary.json | jq '.total'
```

---

## Recommendations

### Documentation Structure

Create the following directory structure:

```
docs/
  testing/
    overview.md
    patterns.md
    mocking.md
    factories.md
    e2e.md
    debugging.md
    index.md (optional - table of contents)
```

### Documentation Content Guidelines

1. **overview.md** should include:
   - Testing philosophy (confidence, speed, maintainability)
   - Test pyramid breakdown (unit > integration > e2e)
   - How to run tests (npm scripts)
   - Coverage targets and enforcement

2. **patterns.md** should include:
   - Unit test structure (Arrange-Act-Assert)
   - Component test patterns (render, interact, assert)
   - Hook testing with renderHook
   - Integration test patterns for tRPC routers

3. **mocking.md** should include:
   - Anthropic API mock usage with examples
   - Supabase client mock configuration
   - tRPC context mocking
   - Error scenario testing

4. **factories.md** should include:
   - Factory function reference
   - Pre-configured scenarios
   - Custom factory creation
   - Combining factories for complex scenarios

5. **e2e.md** should include:
   - Playwright configuration
   - Test fixtures and page objects
   - Running e2e locally vs CI
   - Debugging failed e2e tests

6. **debugging.md** should include:
   - Reading coverage reports
   - Finding uncovered code paths
   - Common test failures and solutions
   - CI failure investigation

### Coverage Badge Implementation

**Recommended Approach:**

1. Sign up for Codecov (free for open source)
2. Add `CODECOV_TOKEN` to repository secrets
3. Add codecov-action to CI workflow
4. Add badge to README

**Alternative (No External Service):**

1. Generate badge during CI using `coverage-summary.json`
2. Commit badge SVG to repository
3. Reference local badge in README

### CI Enhancement Checklist

1. Add coverage threshold check step
2. Add Codecov upload step
3. Add coverage delta check for PRs
4. Consider splitting tests into parallel jobs (unit, integration, e2e)

---

## Resource Map

### Critical Files for This Iteration

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` | Update thresholds |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/README.md` | Add coverage badge |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml` | Enhance CI |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/docs/testing/*` | Create docs (new) |

### Reference Files (Existing Test Infrastructure)

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/factories/index.ts` | Factory exports |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/helpers/index.ts` | Helper exports |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts` | Anthropic mock |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/supabase.ts` | Supabase mock |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` | Test setup |

---

## Questions for Planner

1. Should coverage badge use Codecov (external service) or be generated locally during CI?
2. Should the CI workflow fail on coverage regression, or just report it?
3. Should testing docs include code examples from actual test files, or create standalone examples?
4. Should we create a `docs/testing/index.md` as a table of contents entry point?

---

## Summary

**What Exists:**
- Comprehensive test factories (70+ functions)
- Well-documented test helpers
- Full Anthropic and Supabase mocks
- 158+ E2E tests across 6 spec files
- CI workflow with coverage artifact upload

**What's Missing:**
- Coverage thresholds at 80% (currently 29%)
- Testing documentation (6 files needed)
- Coverage badge in README
- CI coverage reporting to PR comments
- CI coverage threshold enforcement

**Estimated Work:**
- vitest.config.ts update: 15 minutes
- Testing documentation (6 files): 2-3 hours
- README badge: 15 minutes
- CI workflow enhancement: 30 minutes

**Total Estimated Duration:** 3-4 hours
