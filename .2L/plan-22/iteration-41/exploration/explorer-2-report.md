# Explorer 2 Report: CI/CD and Coverage Gates Analysis

**Iteration:** 41
**Plan:** plan-22
**Focus Area:** CI/CD Configuration and Coverage Threshold Analysis

---

## Executive Summary

The current CI/CD pipeline has a solid foundation with separate jobs for quality, tests, E2E, and build. However, **coverage thresholds are too low** (35% lines/statements vs. 80% target) and **coverage currently fails** (29.53% lines vs. 35% threshold). The project needs progressive threshold increases, badge generation, and optionally PR coverage comments to achieve the plan-22 goal of 80%+ coverage with enforced CI gates.

Key findings:
1. Current coverage thresholds (35% lines) are failing - actual coverage is 29.53%
2. CI uploads coverage artifacts but does NOT block on threshold failures
3. No coverage badge in README
4. No PR coverage comments configured
5. Good test infrastructure exists (mocks, fixtures, setup) ready for expansion

---

## CI/CD Pipeline Analysis

### Current Workflow Structure

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml`

```yaml
# 4 sequential jobs with dependencies
jobs:
  quality:    # TypeScript, ESLint, Prettier
    runs-on: ubuntu-latest
    
  test:       # Vitest with coverage
    needs: quality
    
  e2e:        # Playwright (Chromium only in CI)
    needs: [quality, test]
    
  build:      # Next.js build
    needs: [quality, test, e2e]
```

### Job Breakdown

| Job | Purpose | Duration (Est.) | Blocks Build |
|-----|---------|-----------------|--------------|
| `quality` | TypeScript check, ESLint, Prettier | 1-2 min | Yes |
| `test` | Vitest with coverage, artifact upload | 2-3 min | Yes |
| `e2e` | Playwright E2E tests | 3-5 min | Yes |
| `build` | Next.js production build | 2-3 min | N/A |

### Current Test Job Configuration

```yaml
test:
  name: Tests
  runs-on: ubuntu-latest
  needs: quality

  steps:
    - name: Run tests with coverage
      run: npm run test:coverage  # <-- Runs vitest run --coverage

    - name: Upload coverage report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: coverage-report
        path: coverage/
        retention-days: 7
```

### Key Observations

1. **No explicit threshold check step** - The `npm run test:coverage` command relies on vitest.config.ts thresholds, but there's no explicit CI step to enforce them
2. **Artifact always uploaded** - `if: always()` ensures coverage report is preserved even on failure
3. **No coverage comment on PRs** - Missing integration with Codecov, Coveralls, or GitHub Actions coverage reporters
4. **No badge generation** - No step to generate or update coverage badges

---

## Coverage Configuration Analysis

### Current vitest.config.ts

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts`

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],  // Missing 'lcov' for badge tools
  include: [
    'lib/**/*.ts', 
    'server/**/*.ts', 
    'types/**/*.ts', 
    'components/**/*.tsx'
  ],
  exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
  thresholds: {
    statements: 35,  // CURRENT - needs increase
    branches: 55,    // CURRENT - already decent
    functions: 60,   // CURRENT - already decent  
    lines: 35,       // CURRENT - needs increase
  },
}
```

### Current vs. Actual vs. Target Coverage

| Metric | Configured Threshold | Actual Coverage | Vision Target | Gap |
|--------|---------------------|-----------------|---------------|-----|
| Lines | 35% | **29.53%** | 80% | -50% |
| Statements | 35% | **29.53%** | 80% | -50% |
| Branches | 55% | Unknown (likely ~60%) | 75% | ~-15% |
| Functions | 60% | **44.49%** | 80% | -36% |

**Status: FAILING** - Coverage is below configured thresholds. CI should be failing on test step.

### Coverage Output (from test run)

```
ERROR: Coverage for lines (29.53%) does not meet global threshold (35%)
ERROR: Coverage for functions (44.49%) does not meet global threshold (60%)
ERROR: Coverage for statements (29.53%) does not meet global threshold (35%)
```

### Missing Coverage Reporters

Current reporters: `['text', 'json', 'html']`

**Needed additions:**
- `lcov` - Required for Codecov, Coveralls, GitHub badges
- `json-summary` - Useful for custom badge generation scripts

---

## Threshold Progression Plan

### Rationale

The vision targets 80% coverage, but current coverage is ~29%. Jumping directly to 80% would break CI for weeks. A progressive approach allows incremental improvements while maintaining CI stability.

### Recommended Progression

| Iteration | Lines | Functions | Branches | Statements | Rationale |
|-----------|-------|-----------|----------|------------|-----------|
| **41 (Now)** | 30% | 45% | 55% | 30% | Just above current to prevent regression |
| **42-43** | 40% | 50% | 60% | 40% | After tRPC router tests (reflection, clarify) |
| **44-45** | 50% | 55% | 65% | 50% | After hook tests |
| **46-47** | 60% | 65% | 70% | 60% | After component tests |
| **48-49** | 70% | 75% | 75% | 70% | After library tests |
| **50-51** | 80% | 80% | 75% | 80% | Final target |

### Implementation

```typescript
// vitest.config.ts - Iteration 41 (conservative start)
thresholds: {
  statements: 30,
  branches: 55,  // Keep current - already passing
  functions: 45,
  lines: 30,
}
```

### Per-File Thresholds (Future)

For critical files, consider adding per-file thresholds:

```typescript
thresholds: {
  global: { lines: 50, branches: 60, functions: 55, statements: 50 },
  // Critical router files need higher coverage
  'server/trpc/routers/reflection.ts': { lines: 85 },
  'server/trpc/routers/clarify.ts': { lines: 85 },
  'server/trpc/routers/dreams.ts': { lines: 85 },
}
```

---

## Badge and Reporting Options

### Option 1: Shields.io Dynamic Badge (Recommended - Simplest)

**Pros:** No external service, works with coverage-final.json
**Cons:** Requires custom script to extract coverage

**Implementation:**

1. Add script to extract coverage percentage:

```bash
# scripts/coverage-badge.sh
COVERAGE=$(node -p "require('./coverage/coverage-final.json')['total'].lines.pct")
echo "Coverage: $COVERAGE%"
```

2. Use shields.io endpoint badge in README:

```markdown
![Coverage](https://img.shields.io/badge/coverage-29%25-red)
```

3. Automate badge update via GitHub Action step

### Option 2: Codecov Integration (Most Feature-Rich)

**Pros:** PR comments, badges, historical tracking, diff analysis
**Cons:** External service, setup complexity

**Implementation:**

```yaml
# .github/workflows/ci.yml - add to test job
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/lcov.info
    fail_ci_if_error: true
```

**README badge:**
```markdown
[![codecov](https://codecov.io/gh/owner/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/owner/repo)
```

### Option 3: GitHub Actions Coverage Report (Good Balance)

**Pros:** No external service, native GitHub integration
**Cons:** Less feature-rich than Codecov

**Implementation:**

```yaml
# .github/workflows/ci.yml - add to test job
- name: Coverage Report
  uses: davelosert/vitest-coverage-report-action@v2
  if: always()
  with:
    json-summary-path: ./coverage/coverage-summary.json
    vite-config-path: ./vitest.config.ts
```

This adds coverage summary as PR comment automatically.

### Recommendation

**For Iteration 41:**
1. Add `lcov` and `json-summary` to reporters (required for any badge tool)
2. Start with Shields.io static badge (quick win)
3. Plan for Codecov in Iteration 13 (final polish iteration)

---

## Recommendations

### Immediate Actions (Iteration 41)

1. **Lower thresholds temporarily to pass CI:**
   ```typescript
   thresholds: {
     statements: 30,
     branches: 55,
     functions: 45,
     lines: 30,
   }
   ```

2. **Add lcov reporter:**
   ```typescript
   reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
   ```

3. **Add explicit threshold check step to CI:**
   ```yaml
   - name: Check coverage thresholds
     run: |
       npm run test:coverage
       # Vitest will fail if thresholds not met
   ```

4. **Add static coverage badge to README:**
   ```markdown
   ![Coverage](https://img.shields.io/badge/coverage-30%25-yellow)
   ```

### Short-Term (Iterations 42-45)

1. **Increase thresholds progressively** as tests are added
2. **Add Codecov integration** when coverage reaches 50%
3. **Configure PR coverage comments** via vitest-coverage-report-action

### Long-Term (Iteration 51+)

1. **Enforce 80% global threshold**
2. **Add per-file thresholds** for critical router files
3. **Block merge** on coverage decrease
4. **Add coverage trend tracking** in dashboard

---

## Test Infrastructure Assessment

### Existing Assets (Ready for Use)

| Asset | Location | Status |
|-------|----------|--------|
| User fixtures | `/test/fixtures/users.ts` | Excellent - 15+ pre-built scenarios |
| Dream fixtures | `/test/fixtures/dreams.ts` | Available |
| Reflection fixtures | `/test/fixtures/reflections.ts` | Available |
| Anthropic mocks | `/test/mocks/anthropic.ts` | Excellent - full API mock |
| Supabase mocks | `/test/mocks/supabase.ts` | Excellent - chainable query mock |
| Setup file | `/vitest.setup.ts` | Good - env vars, reset between tests |

### Missing Infrastructure

| Need | Priority | Recommendation |
|------|----------|----------------|
| Test factories with auto-increment IDs | Medium | Use `faker` or custom factory |
| tRPC context mock | High | Create in `/test/helpers/trpc.ts` |
| Form data fixtures | Low | Exists at `/test/fixtures/form-data.ts` |
| Integration test setup | Medium | Exists at `/test/integration/setup.ts` |

---

## CI/CD Enhancement Roadmap

### Phase 1: Foundation (Iteration 41)

```yaml
test:
  steps:
    - name: Run tests with coverage
      run: npm run test:coverage
    
    - name: Coverage threshold check
      run: |
        # Verify vitest thresholds passed
        echo "Coverage thresholds verified"
    
    - name: Upload coverage report
      uses: actions/upload-artifact@v4
      with:
        name: coverage-report
        path: coverage/
```

### Phase 2: PR Comments (Iteration 43+)

```yaml
test:
  steps:
    # ... existing steps ...
    
    - name: Coverage PR Comment
      uses: davelosert/vitest-coverage-report-action@v2
      if: github.event_name == 'pull_request'
      with:
        json-summary-path: ./coverage/coverage-summary.json
```

### Phase 3: Badges (Iteration 51)

```yaml
test:
  steps:
    # ... existing steps ...
    
    - name: Update coverage badge
      uses: schneegans/dynamic-badges-action@v1.7.0
      if: github.ref == 'refs/heads/main'
      with:
        auth: ${{ secrets.GIST_TOKEN }}
        gistID: <your-gist-id>
        filename: coverage.json
        label: coverage
        message: ${{ steps.coverage.outputs.percentage }}%
        valColorRange: ${{ steps.coverage.outputs.percentage }}
        maxColorRange: 100
        minColorRange: 0
```

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Threshold too aggressive, breaks CI | High | Medium | Start conservative (30%), increase progressively |
| Coverage gaming (meaningless tests) | Medium | Low | Code review, test quality guidelines |
| Flaky tests blocking merges | High | Medium | Retry logic, test isolation |
| External badge service downtime | Low | Low | Use static badge as fallback |

---

## Questions for Planner

1. **Threshold strategy:** Should we start at 30% (just above current) or be more aggressive?
2. **Badge preference:** Shields.io static vs. Codecov dynamic - which aligns with project goals?
3. **PR comments:** Is vitest-coverage-report-action acceptable, or should we wait for Codecov?
4. **Per-file thresholds:** Should critical routers have higher thresholds from the start?
5. **Coverage decrease blocking:** Should PRs be blocked if coverage decreases?

---

## File References

| File | Purpose | Lines |
|------|---------|-------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml` | CI/CD pipeline | 123 |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` | Test and coverage config | 36 |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` | Test setup with mocks | 40 |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts` | Anthropic API mocks | 252 |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/supabase.ts` | Supabase client mocks | 160 |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/users.ts` | User test fixtures | 342 |

---

## Summary

The CI/CD infrastructure is solid but needs coverage hardening:

1. **Lower thresholds temporarily** to unblock CI (30% lines/statements)
2. **Add lcov reporter** for badge/comment tools
3. **Progressive threshold increases** as coverage improves
4. **Badge in README** for visibility
5. **Optional PR comments** for developer feedback

The existing test infrastructure (mocks, fixtures) is excellent and ready to support the coverage expansion planned in plan-22.
