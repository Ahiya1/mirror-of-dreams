# Explorer 1 Report: Current Test Infrastructure Assessment

## Executive Summary

The Mirror of Dreams test infrastructure has a solid foundation with well-organized mocks (Supabase, Anthropic, Cookies), comprehensive user fixtures, and a functional integration test setup via `createTestCaller`. However, critical gaps exist: no `test/helpers/` or `test/factories/` directories, missing ClarifySession fixtures, no custom render wrapper for component tests, no tRPC client helpers, and coverage thresholds are not being met (currently 29.53% lines vs 35% threshold, 44.49% functions vs 60% threshold). CI uploads coverage reports but does NOT enforce coverage gates that block merges.

## Current Infrastructure Analysis

### File Structure

```
test/
  integration/
    setup.ts           # Comprehensive tRPC caller with mocks (318 lines)
    auth/
      signin.test.ts
      signout.test.ts
      signup.test.ts
    dreams/
      create.test.ts
      crud.test.ts
      list.test.ts
    reflections/
      reflections.test.ts
    users/
      users.test.ts
  mocks/
    anthropic.ts       # Well-structured (252 lines)
    cookies.ts         # Simple mock (23 lines)
    supabase.ts        # Comprehensive chain mock (160 lines)
  fixtures/
    users.ts           # Excellent coverage (342 lines)
    dreams.ts          # Good coverage (300 lines)
    reflections.ts     # Good coverage (245 lines)
    form-data.ts       # Form scenarios (125 lines)
```

### Key Configuration Files

**vitest.config.ts** (Current):
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts', 'components/**/*.tsx'],
  exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
  thresholds: {
    statements: 35,
    branches: 55,
    functions: 60,
    lines: 35,
  },
}
```

**vitest.setup.ts**:
- Sets up `@testing-library/jest-dom/vitest`
- Mocks haptic feedback
- Sets test environment variables (Supabase, PayPal, Anthropic, JWT)
- Resets mocks between tests via `beforeEach`
- Global fetch mock

### Current Infrastructure Strengths

1. **Integration Test Setup (`test/integration/setup.ts`)**
   - Comprehensive `createTestCaller()` function
   - Mocks Supabase with chainable query builders
   - Mocks Anthropic with streaming support
   - Rate limiter bypass for tests
   - Logger mocking to suppress output
   - `mockQuery()` and `mockQueries()` helpers for table responses
   - TypeScript types for mock utilities

2. **Anthropic Mock (`test/mocks/anthropic.ts`)**
   - `createMockMessageResponse()` factory with overrides
   - `createMockThinkingResponse()` for extended thinking
   - `createMessagesStreamMock()` for streaming responses
   - Pre-built response scenarios (reflection, clarify, evolution)
   - Error factories (`anthropicErrors.unauthorized`, etc.)

3. **User Fixtures (`test/fixtures/users.ts`)**
   - `createMockUser()` factory with overrides
   - `createMockUserRow()` for database representation
   - Pre-configured scenarios: freeTierUser, proTierUser, unlimitedTierUser
   - Tier limit scenarios: freeTierAtLimit, proTierAtDailyLimit
   - Special users: adminUser, creatorUser, demoUser, hebrewUser
   - Utility factories: `createUserWithTier()`, `createUserWithReflections()`

4. **Dream Fixtures (`test/fixtures/dreams.ts`)**
   - `createMockDream()` factory with overrides
   - Status scenarios: activeDream, achievedDream, archivedDream, releasedDream
   - Priority scenarios: highPriorityDream, lowPriorityDream
   - Date scenarios: overdueDream, futureDream, openEndedDream
   - Batch creators: `createMockDreams()`, `createFreeTierDreams()`, `createProTierDreams()`
   - Tier limits exported: `DREAM_TIER_LIMITS`

5. **Reflection Fixtures (`test/fixtures/reflections.ts`)**
   - `createMockReflection()` simple factory
   - `createMockReflectionRow()` full database row factory
   - Tone variations: gentleReflection, intenseReflection
   - Special scenarios: premiumReflection, ratedReflection, legacyReflection
   - Utility factories: `createReflectionForUser()`, `createReflectionForDream()`

## Existing Mocks Assessment

| Mock | File | Quality | Gap |
|------|------|---------|-----|
| Supabase Client | `test/mocks/supabase.ts` | Excellent | None - comprehensive chain mock |
| Supabase (Integration) | `test/integration/setup.ts` | Excellent | Duplicates mocks/supabase.ts patterns |
| Anthropic | `test/mocks/anthropic.ts` | Excellent | None - includes streaming + thinking |
| Cookies | `test/mocks/cookies.ts` | Good | Simple but sufficient |
| Rate Limiter | `test/integration/setup.ts` | Good | Inlined, could be extracted |
| Logger | `test/integration/setup.ts` | Good | Inlined, could be extracted |
| Email | `test/integration/setup.ts` | Basic | Only `sendVerificationEmail` |

### Integration Setup Analysis

The `test/integration/setup.ts` file (318 lines) provides:

```typescript
// Example usage pattern
const { caller, mockQuery } = createTestCaller(freeTierUser);
mockQuery('dreams', { data: mockDream, error: null });
const result = await caller.dreams.create(input);
```

**Strengths:**
- Single function creates fully mocked tRPC caller
- Type-safe Supabase mock with all query methods
- Returns utilities for per-test customization

**Weaknesses:**
- All mocks are inlined via `vi.hoisted()` - not reusable outside integration tests
- No helper for component tests
- No tRPC client mock for frontend testing

## Factory Gap Analysis

### Currently Exists

| Factory | File | Status |
|---------|------|--------|
| User | `test/fixtures/users.ts` | Complete |
| UserRow | `test/fixtures/users.ts` | Complete |
| Dream | `test/fixtures/dreams.ts` | Complete |
| Reflection | `test/fixtures/reflections.ts` | Complete |
| ReflectionRow | `test/fixtures/reflections.ts` | Complete |
| FormData | `test/fixtures/form-data.ts` | Complete |

### Missing Factories (Required by Vision)

| Factory | Status | Complexity | Notes |
|---------|--------|------------|-------|
| ClarifySession | MISSING | Medium | Types exist in `types/clarify.ts` |
| ClarifySessionRow | MISSING | Low | Database row version |
| ClarifyMessage | MISSING | Low | Message type exists |
| ClarifyMessageRow | MISSING | Low | Database row version |
| ClarifyPattern | MISSING | Low | Pattern extraction types |

### Recommended ClarifySession Factory Structure

Based on `types/clarify.ts`:

```typescript
// test/factories/clarify.factory.ts
export const createMockClarifySession = (
  overrides: Partial<ClarifySession> = {}
): ClarifySession => ({
  id: 'session-uuid-1234',
  userId: 'test-user-uuid-1234',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  title: 'Test Clarify Session',
  lastMessageAt: new Date().toISOString(),
  messageCount: 0,
  status: 'active',
  dreamId: null,
  ...overrides,
});

export const createMockClarifyMessage = (
  overrides: Partial<ClarifyMessage> = {}
): ClarifyMessage => ({
  id: 'message-uuid-1234',
  sessionId: 'session-uuid-1234',
  createdAt: new Date().toISOString(),
  role: 'user',
  content: 'Test message content',
  tokenCount: 50,
  toolUse: null,
  ...overrides,
});
```

## Helper Gap Analysis

### Currently Exists

| Helper | Location | Purpose |
|--------|----------|---------|
| `createTestCaller` | `test/integration/setup.ts` | tRPC integration testing |
| `mockQuery` / `mockQueries` | `test/integration/setup.ts` | Table-level Supabase mocking |
| `createPartialMock` | `test/integration/setup.ts` | TypeScript escape hatch |

### Missing Helpers (Required by Vision)

| Helper | Priority | Purpose |
|--------|----------|---------|
| `test/helpers/render.tsx` | HIGH | Custom render with providers (tRPC, auth context) |
| `test/helpers/trpc.ts` | HIGH | tRPC client helpers for component tests |
| `test/helpers/supabase.ts` | MEDIUM | Reusable Supabase mock utilities |
| `test/helpers/wait.ts` | LOW | waitFor utilities, async test helpers |

### Recommended Render Helper

```typescript
// test/helpers/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

interface TestProviderProps {
  children: React.ReactNode;
  user?: User | null;
  // Add other context providers as needed
}

function TestProviders({ children, user = null }: TestProviderProps) {
  return (
    <TRPCMockProvider>
      <AuthMockProvider user={user}>
        {children}
      </AuthMockProvider>
    </TRPCMockProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { user?: User | null }
) {
  const { user, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders user={user}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}
```

## Coverage Configuration Assessment

### Current Thresholds vs Vision Targets

| Metric | Current Threshold | Vision Target | Actual Current | Gap |
|--------|-------------------|---------------|----------------|-----|
| Lines | 35% | 80% | 29.53% | 50.47% |
| Branches | 55% | 75% | N/A* | 20% |
| Functions | 60% | 80% | 44.49% | 35.51% |
| Statements | 35% | 80% | 29.53% | 50.47% |

*Branches not reported in summary, but threshold is 55%

### Current Coverage by Area

| Area | Coverage | Vision Target | Gap |
|------|----------|---------------|-----|
| `server/trpc/routers/reflection.ts` | 5.95% | 85% | 79.05% |
| `server/trpc/routers/clarify.ts` | 15.97% | 85% | 69.03% |
| `server/trpc/routers/evolution.ts` | 6.54% | 85% | 78.46% |
| `server/trpc/routers/visualizations.ts` | 9.35% | 85% | 75.65% |
| `server/trpc/routers/dreams.ts` | 90.06% | 85% | MET |
| `lib/clarify/consolidation.ts` | 0% | 90% | 90% |
| `lib/clarify/context-builder.ts` | 86.38% | 90% | 3.62% |

### CI Configuration Analysis

**Current CI Workflow** (`.github/workflows/ci.yml`):

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: coverage-report
    path: coverage/
```

**Issues:**
1. Coverage is run but **failures do NOT block the build** (thresholds fail but CI continues)
2. No coverage comments on PRs
3. No coverage badge in README
4. No per-file enforcement for critical routers

### Recommended CI Coverage Gates

```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  # This will fail if thresholds not met - currently happening!

# Add: Coverage comment on PRs
- name: Comment Coverage on PR
  uses: 5monkeys/cobertura-action@master
  if: github.event_name == 'pull_request'
  with:
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    path: coverage/cobertura-coverage.xml
    minimum_coverage: 80
```

## Recommendations

### Priority 1: Fix Coverage Threshold Failures

Current tests are FAILING due to coverage thresholds not being met. Options:
1. **Lower thresholds temporarily** to current levels (29.53% lines, 44.49% functions)
2. **Remove thresholds** until iteration 41 builds sufficient coverage
3. **Keep thresholds** but ensure CI job failures actually block merges

**Recommendation:** Lower thresholds to current levels as intermediate step, then incrementally raise.

### Priority 2: Create Missing Factories

Create `test/factories/clarify.factory.ts`:
- `createMockClarifySession()`
- `createMockClarifySessionRow()`
- `createMockClarifyMessage()`
- `createMockClarifyMessageRow()`
- `createMockClarifyPattern()`
- Pre-configured scenarios: `activeSession`, `archivedSession`, `sessionWithMessages`

### Priority 3: Create Render Helper

Create `test/helpers/render.tsx`:
- Export `renderWithProviders()`
- Include tRPC provider mock
- Include auth context provider
- Support passing mock user

### Priority 4: Create tRPC Client Helpers

Create `test/helpers/trpc.ts`:
- Mock tRPC client for component tests
- Utilities for mocking specific procedures
- Integration with existing `@/lib/trpc` client

### Priority 5: Add CI Coverage Enforcement

Update `.github/workflows/ci.yml`:
- Ensure coverage failures actually block merges
- Add coverage comment bot for PRs
- Add coverage badge to README
- Consider per-file thresholds for critical routers

## Resource Map

### Critical Files/Directories

| Path | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts` | Main integration test utilities |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/` | Mock factories |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/` | Test data factories |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` | Coverage configuration |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` | Global test setup |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.github/workflows/ci.yml` | CI pipeline |

### Key Dependencies

| Dependency | Purpose |
|------------|---------|
| `vitest` | Test runner |
| `@testing-library/react` | Component testing |
| `@testing-library/jest-dom/vitest` | DOM matchers |
| `happy-dom` | DOM environment |
| `@vitejs/plugin-react` | React support in Vitest |
| `v8` | Coverage provider |

### Test Scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test"
}
```

## Questions for Planner

1. **Threshold Strategy:** Should we lower coverage thresholds immediately to unblock CI, or fix the failing tests first?

2. **Factory Location:** Should factories be in `test/factories/` (new directory) or remain in `test/fixtures/`? The vision doc mentions both.

3. **MSW Integration:** The vision asks about MSW for API mocking. Current infrastructure uses vi.mock() - is MSW needed for more realistic component testing?

4. **Coverage Badge:** Should coverage badge show overall coverage or specific metrics (lines/functions/branches)?

5. **Per-File Thresholds:** Should we configure per-file thresholds for critical routers (85%+) in vitest.config.ts?

---

**Report Generated:** 2025-12-10
**Explorer:** 1
**Focus Area:** Current Test Infrastructure Assessment
**Files Analyzed:** 15+
**Estimated Builder Work:** 
- Factory creation: 1-2 hours
- Helper creation: 2-3 hours
- CI configuration: 1 hour
- Coverage threshold adjustment: 30 minutes
