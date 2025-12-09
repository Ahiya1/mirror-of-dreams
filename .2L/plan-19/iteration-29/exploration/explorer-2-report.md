# Explorer 2 Report: Testing Infrastructure Analysis

## Executive Summary

The Mirror of Dreams project has minimal testing infrastructure with only one existing test file using Vitest. No formal Jest or Vitest configuration files exist at the project root. Critical business logic in `/lib/utils/limits.ts`, `/server/lib/cost-calculator.ts`, and `/server/lib/temporal-distribution.ts` are pure functions ideal for unit testing. The project would benefit significantly from establishing a comprehensive Vitest testing framework with proper configuration, mocking strategies for Supabase, and test fixtures for database operations.

## Discoveries

### Existing Test Infrastructure

- **Single test file found:** `/server/lib/__tests__/paypal.test.ts` (299 lines)
- **Framework:** Vitest (uses `describe`, `test`, `expect`, `beforeEach`, `vi` from 'vitest')
- **No vitest.config.ts** at project root
- **No jest.config.js** at project root
- **Test script in package.json:** `"test": "echo 'Tests would go here'"` (placeholder)
- **No GitHub Actions CI/CD** configuration exists (`.github/` directory empty)

### Testing Packages Status

**Currently Installed (None in package.json):**
- Neither Vitest nor Jest packages are in dependencies or devDependencies
- The existing test file imports from `vitest` but the package is not declared
- This suggests tests may have been written but dependency not added, or it's globally available

**Will Need Installation:**
```
vitest
@vitest/coverage-v8
@vitest/ui
happy-dom (for component testing)
```

### Critical Business Logic Files

#### 1. `/lib/utils/limits.ts`
**Functions to test:**
- `checkReflectionLimits(user: User)` - Core function checking monthly/daily limits

**Test cases needed:**
- Free tier at monthly limit
- Pro tier at daily limit
- Unlimited tier with remaining capacity
- Date boundary conditions (midnight rollover)
- First reflection of the day

#### 2. `/server/lib/cost-calculator.ts`
**Functions to test:**
- `calculateCost(usage: TokenUsage)` - Calculates API costs
- `getModelIdentifier()` - Returns model ID
- `getThinkingBudget(tier)` - Returns thinking tokens per tier
- `formatCost(cost: number)` - Formats cost for display

**Test cases needed:**
- Zero tokens
- Large token counts
- Edge case pricing calculations
- All three tiers for thinking budget

#### 3. `/server/lib/temporal-distribution.ts`
**Functions to test:**
- `selectTemporalContext(allReflections, contextLimit)` - Core algorithm
- `getContextLimit(tier, reportType)` - Tier-based limits
- `meetsEvolutionThreshold(reflectionCount, reportType)` - Threshold checks

**Test cases needed:**
- Empty reflection array
- Fewer reflections than limit
- Even distribution across periods
- Edge cases (exact multiples of 3)
- All tier/report type combinations

#### 4. `/types/schemas.ts`
**Zod Schemas to test:**
- `signupSchema`, `signinSchema`
- `createReflectionSchema`
- `reflectionListSchema`
- `updatePreferencesSchema`

**Test cases needed:**
- Valid input validation
- Invalid email formats
- Password length requirements
- Field length limits (min/max)
- Enum value validation

### Additional Testable Files Discovered

| File | Functions | Priority |
|------|-----------|----------|
| `/lib/utils/wordCount.ts` | `countWords`, `formatWordCount`, `getWordCountState` | HIGH |
| `/lib/utils/dateRange.ts` | `getDateRangeFilter`, `filterByDateRange` | HIGH |
| `/lib/clarify/context-builder.ts` | `estimateTokens`, `buildClarifyContext` | MEDIUM |
| `/lib/clarify/consolidation.ts` | `extractPatternsFromSession` | MEDIUM |
| `/types/user.ts` | `userRowToUser` | HIGH |
| `/server/lib/paypal.ts` | Multiple functions | COVERED |

## Patterns Identified

### Existing Test Pattern (from paypal.test.ts)

**Description:** Well-structured test file using Vitest idioms
**Structure:**
```typescript
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('Module Name', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.assign(process.env, mockEnv);
  });

  describe('function name', () => {
    test('should do expected behavior', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({...});
      
      // Act
      const result = await functionUnderTest();
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Recommendation:** Use this pattern as the project standard. It demonstrates proper mocking, async handling, and organized test structure.

### Pure Function Pattern

**Description:** Many business logic functions are pure (no side effects)
**Example files:** `limits.ts`, `cost-calculator.ts`, `temporal-distribution.ts`, `wordCount.ts`
**Recommendation:** These are ideal for unit testing - no mocking required, deterministic outputs.

### Database Interaction Pattern

**Description:** Functions that call Supabase require mocking
**Example files:** `context-builder.ts`, `consolidation.ts`
**Mocking approach:**
```typescript
vi.mock('@/server/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockData, error: null }))
        }))
      }))
    }))
  }
}));
```

## Complexity Assessment

### High Complexity Areas

- **Supabase Mocking Strategy:** Database interaction mocking requires careful setup of the chained query builder pattern. Recommend creating a shared mock factory.
- **Temporal Distribution Algorithm:** The `selectTemporalContext` function has complex period division logic that needs thorough edge case testing.

### Medium Complexity Areas

- **Environment Variable Handling:** Many functions depend on `process.env`. Tests need consistent environment setup/teardown.
- **Zod Schema Testing:** Comprehensive schema testing requires structured approach covering all validation rules.

### Low Complexity Areas

- **Pure utility functions:** `countWords`, `formatCost`, `getDateRangeFilter` - straightforward input/output testing
- **Constant-based functions:** `getThinkingBudget`, `getContextLimit` - simple lookup testing

## Technology Recommendations

### Primary Testing Stack

- **Framework:** Vitest 2.x - Already established in codebase, faster than Jest, native TypeScript support
- **Coverage:** @vitest/coverage-v8 - V8 coverage is more accurate for TypeScript
- **DOM Testing:** happy-dom (lighter than jsdom, sufficient for this project)

### Supporting Libraries

- **msw (Mock Service Worker):** For API mocking in integration tests
- **@testing-library/react:** For component testing if needed
- **faker-js:** For generating test data

### Vitest Configuration Recommendation

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts'],
      exclude: ['**/*.d.ts', '**/__tests__/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './types'),
      '@/server': path.resolve(__dirname, './server'),
    },
  },
});
```

## Integration Points

### External APIs Requiring Mocks

- **PayPal API:** Already has test patterns established (fetch mocking)
- **Anthropic API:** Needs mocking for `consolidation.ts` and reflection generation
- **Supabase:** Primary database - needs comprehensive mock factory

### Internal Integrations

- `lib/utils/constants.ts` <-> `limits.ts`: Constants drive limit calculations
- `types/user.ts` <-> Multiple files: User type transformation used throughout
- `server/lib/supabase.ts` <-> All database operations: Single client instance

## Test Database Strategy

### Supabase Local Development

**Current Setup:**
- Supabase local configuration exists in `/supabase/config.toml`
- Local PostgreSQL on port 54322
- Seed data in `/supabase/seed.sql`
- Migrations tracked in `/supabase/migrations/`

**Test Strategy Options:**

1. **Mock-based Unit Tests (Recommended for most tests)**
   - Mock Supabase client at module level
   - Fast, isolated, no database setup
   - Best for business logic testing

2. **Integration Tests with Local Supabase**
   - Use existing local Supabase instance
   - Create test-specific seed data
   - Reset database between test runs using migrations

3. **Test Fixtures Needed:**
   - User with free tier (0 reflections)
   - User with pro tier (at daily limit)
   - User with unlimited tier (at monthly limit)
   - User with various reflection histories
   - Dreams in different states

### Suggested Test Fixture Factory

```typescript
// test/fixtures/users.ts
export const createMockUser = (overrides = {}): User => ({
  id: 'test-user-uuid',
  email: 'test@example.com',
  name: 'Test User',
  tier: 'free',
  subscriptionStatus: 'active',
  reflectionCountThisMonth: 0,
  reflectionsToday: 0,
  lastReflectionDate: null,
  totalReflections: 0,
  ...overrides,
});

export const freeTierAtLimit = createMockUser({
  tier: 'free',
  reflectionCountThisMonth: 2,
});

export const proTierAtDailyLimit = createMockUser({
  tier: 'pro',
  reflectionsToday: 1,
  lastReflectionDate: new Date().toISOString().split('T')[0],
});
```

## Risks & Challenges

### Technical Risks

- **Missing Vitest Package:** The existing test file imports Vitest but it's not in package.json. Need to install before tests can run.
- **Path Alias Resolution:** TypeScript path aliases (`@/`) need matching Vitest configuration.
- **Environment Variables:** Tests need consistent environment variable handling.

### Complexity Risks

- **Supabase Mock Complexity:** The chained query builder API is verbose to mock. Creating a shared mock factory is essential.
- **Date-sensitive Tests:** `limits.ts` and `dateRange.ts` have date-dependent logic that could cause flaky tests if not handled with fixed dates.

## Recommendations for Planner

1. **Install Vitest and Related Packages First**
   Priority: HIGH
   ```bash
   npm install -D vitest @vitest/coverage-v8 @vitest/ui happy-dom
   ```

2. **Create Vitest Configuration**
   Priority: HIGH
   - `/vitest.config.ts` with path aliases matching tsconfig.json
   - `/vitest.setup.ts` for global test setup (environment variables, mocks)

3. **Build Supabase Mock Factory**
   Priority: HIGH
   - Create `/test/mocks/supabase.ts` with reusable query builder mock
   - Reduces boilerplate in individual test files

4. **Test Coverage Priority Order:**
   1. Pure utility functions (`cost-calculator.ts`, `temporal-distribution.ts`, `wordCount.ts`)
   2. Type transformations (`userRowToUser`)
   3. Business logic with mocks (`limits.ts`, `context-builder.ts`)
   4. Zod schema validation (`schemas.ts`)

5. **CI/CD Pipeline Setup**
   Priority: MEDIUM
   - Create `.github/workflows/test.yml`
   - Run tests on PR and push to main
   - Include coverage reporting

6. **Test Database Fixtures**
   Priority: MEDIUM
   - Create test fixture factories
   - Document expected test data structure

## Resource Map

### Critical Files/Directories

- `/server/lib/__tests__/paypal.test.ts` - Reference implementation for test patterns
- `/lib/utils/constants.ts` - Constants used throughout business logic
- `/types/user.ts` - User type definition and transformation
- `/types/schemas.ts` - Zod validation schemas
- `/supabase/` - Database configuration and migrations

### Key Dependencies

- **vitest** - Test framework (needs installation)
- **@vitest/coverage-v8** - Coverage reporting (needs installation)
- **zod** - Already installed, schemas need testing
- **@supabase/supabase-js** - Already installed, needs mocking strategy

### Testing Infrastructure to Create

- `/vitest.config.ts` - Vitest configuration
- `/vitest.setup.ts` - Global test setup
- `/test/mocks/supabase.ts` - Supabase mock factory
- `/test/fixtures/` - Test data factories
- `/.github/workflows/test.yml` - CI/CD workflow

## Questions for Planner

1. Should component testing (React components) be included in this iteration or deferred to a later phase?

2. What coverage thresholds should be enforced initially? (Suggested: 80% for statements/functions, 75% for branches)

3. Should integration tests with actual local Supabase be pursued, or is mocking sufficient for this iteration?

4. Is there a preference for test file location? Options:
   - Co-located: `lib/utils/__tests__/limits.test.ts`
   - Separate directory: `/test/unit/lib/utils/limits.test.ts`
   
5. Should the test infrastructure support E2E testing preparation, or is that out of scope for iteration 29?
