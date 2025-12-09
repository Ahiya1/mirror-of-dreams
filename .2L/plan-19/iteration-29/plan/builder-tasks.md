# Builder Task Breakdown

## Overview

**4 primary builders** will work in parallel on distinct areas of the codebase.

| Builder | Focus | Estimated Time |
|---------|-------|----------------|
| Builder 1 | ESLint + Prettier + Husky | 1-2 hours |
| Builder 2 | Vitest Setup + Mocks | 1-2 hours |
| Builder 3 | Unit Tests for Business Logic | 2-3 hours |
| Builder 4 | CI/CD Pipeline | 30-60 minutes |

## Builder Assignment Strategy

- Builders work on **isolated files** with minimal overlap
- Only `package.json` is shared - merge strategy defined
- Builder 3 depends on Builder 2 (test infrastructure must exist)
- Builder 4 depends on all builders (CI runs all quality checks)

---

## Builder-1: ESLint + Prettier + Pre-commit Hooks

### Scope

Establish code quality tooling: ESLint configuration with Next.js and TypeScript support, Prettier formatting, and Husky pre-commit hooks. Format the entire codebase to establish consistent style baseline.

### Complexity Estimate

**MEDIUM**

Straightforward configuration with one-time codebase formatting. Risk of ESLint errors requiring `eslint-disable` comments.

### Success Criteria

- [ ] ESLint flat config (`eslint.config.mjs`) created and working
- [ ] `npm run lint` passes (or only has acceptable warnings)
- [ ] Prettier configured with Tailwind plugin
- [ ] `npm run format` formats all files consistently
- [ ] Husky pre-commit hook runs lint-staged on commit
- [ ] All code formatted with Prettier (single "style:" commit)

### Files to Create

| File | Purpose |
|------|---------|
| `/eslint.config.mjs` | ESLint flat config with Next.js + TypeScript rules |
| `/.prettierrc` | Prettier configuration |
| `/.prettierignore` | Files to ignore during formatting |
| `/.husky/pre-commit` | Pre-commit hook script |

### Files to Modify

| File | Changes |
|------|---------|
| `/package.json` | Add devDependencies and scripts (see below) |

### Package.json Changes

**Add to devDependencies:**
```json
{
  "eslint": "^9.15.0",
  "@eslint/js": "^9.15.0",
  "@typescript-eslint/parser": "^8.15.0",
  "@typescript-eslint/eslint-plugin": "^8.15.0",
  "@next/eslint-plugin-next": "^15.0.0",
  "eslint-plugin-import": "^2.31.0",
  "eslint-plugin-jsx-a11y": "^6.10.0",
  "prettier": "^3.4.0",
  "eslint-config-prettier": "^9.1.0",
  "prettier-plugin-tailwindcss": "^0.6.0",
  "husky": "^9.1.0",
  "lint-staged": "^15.2.0"
}
```

**Add to scripts:**
```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "prepare": "husky"
}
```

**Add lint-staged config:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### Dependencies

**Depends on:** Nothing (can start immediately)
**Blocks:** Builder 3 (needs lint-passing code), Builder 4 (CI needs lint command)

### Implementation Notes

1. **ESLint Migration:** The project has no existing ESLint config. Use flat config format (eslint.config.mjs) as it's the modern standard.

2. **Next.js ESLint:** Do NOT use `next lint` command - it triggers interactive setup. Instead, configure ESLint directly with `@next/eslint-plugin-next`.

3. **Formatting Strategy:** Run Prettier on entire codebase in a single commit with message: `style: format codebase with Prettier`. This creates a clean baseline.

4. **ESLint Errors:** If many errors appear:
   - Fix obvious issues
   - Use `// eslint-disable-next-line` for complex cases
   - Set problematic rules to `warn` instead of `error`
   - Document any disabled rules in the config

5. **Husky Setup:** Run `npx husky init` which creates `.husky/` directory automatically.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **ESLint Flat Config** pattern for `eslint.config.mjs`
- Use **Prettier Configuration** pattern for `.prettierrc`
- Use **Husky + lint-staged** pattern for hooks

### Testing Requirements

- Run `npm run lint` - should pass or have only warnings
- Run `npm run format:check` - should pass (all files formatted)
- Make a test commit - pre-commit hook should trigger
- Verify lint-staged only processes staged files

### Commit Strategy

1. First commit: `chore: add ESLint and Prettier configuration`
2. Second commit: `style: format codebase with Prettier`
3. Third commit: `chore: add Husky pre-commit hooks`

---

## Builder-2: Vitest Setup + Test Infrastructure

### Scope

Install and configure Vitest testing framework, create test utilities and mock factories, and migrate the existing Jest-style test file to Vitest syntax.

### Complexity Estimate

**MEDIUM**

Configuration requires matching path aliases from tsconfig.json. Mock factory for Supabase is moderately complex.

### Success Criteria

- [ ] Vitest installed and configured
- [ ] `npm test` runs Vitest in watch mode
- [ ] `npm run test:run` runs tests once (for CI)
- [ ] Path aliases (@/) resolve correctly in tests
- [ ] Existing paypal.test.ts runs successfully
- [ ] middleware.test.ts migrated to Vitest syntax and passing
- [ ] Supabase mock factory created
- [ ] User fixture factory created
- [ ] Coverage reporting works (`npm run test:coverage`)

### Files to Create

| File | Purpose |
|------|---------|
| `/vitest.config.ts` | Vitest configuration |
| `/vitest.setup.ts` | Global test setup (env vars, mocks) |
| `/test/mocks/supabase.ts` | Supabase client mock factory |
| `/test/fixtures/users.ts` | User test data factory |

### Files to Modify

| File | Changes |
|------|---------|
| `/package.json` | Add devDependencies and scripts |
| `/server/trpc/__tests__/middleware.test.ts` | Migrate Jest syntax to Vitest |

### Package.json Changes

**Add to devDependencies:**
```json
{
  "vitest": "^2.1.0",
  "@vitest/coverage-v8": "^2.1.0",
  "@vitest/ui": "^2.1.0",
  "happy-dom": "^15.11.0",
  "@vitejs/plugin-react": "^4.3.0"
}
```

**Add to scripts:**
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:ui": "vitest --ui"
}
```

### Dependencies

**Depends on:** Nothing (can start immediately)
**Blocks:** Builder 3 (needs test infrastructure), Builder 4 (CI needs test command)

### Implementation Notes

1. **Path Aliases:** The vitest.config.ts must mirror the path aliases in tsconfig.json exactly:
   ```typescript
   alias: {
     '@': path.resolve(__dirname, './'),
     '@/components': path.resolve(__dirname, './components'),
     '@/lib': path.resolve(__dirname, './lib'),
     '@/types': path.resolve(__dirname, './types'),
     '@/server': path.resolve(__dirname, './server'),
   }
   ```

2. **Middleware Test Migration:** The file `/server/trpc/__tests__/middleware.test.ts` uses Jest syntax:
   ```typescript
   // Change FROM:
   import { describe, it, expect } from '@jest/globals';

   // Change TO:
   import { describe, it, expect } from 'vitest';
   ```

3. **Environment Variables:** vitest.setup.ts must set all required environment variables for tests to run without real API keys.

4. **Supabase Mock:** Create a reusable mock factory that handles the chainable query builder pattern. See patterns.md for full implementation.

5. **Coverage:** Configure coverage to exclude test files and type definitions from reporting.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Vitest Configuration** pattern for config file
- Use **Vitest Setup** pattern for setup file
- Use **Supabase Mock Factory** pattern for mocks
- Use **User Mock Factory** pattern for fixtures

### Testing Requirements

- Run `npm test` - should start in watch mode
- Run `npm run test:run` - should run all tests and exit
- Both existing test files should pass
- Run `npm run test:coverage` - should generate coverage report

### Directory Structure

```
test/
├── mocks/
│   └── supabase.ts      # Supabase mock factory
└── fixtures/
    └── users.ts         # User data factory
```

---

## Builder-3: Unit Tests for Business Logic

### Scope

Write comprehensive unit tests for the core business logic functions identified in exploration. Focus on pure functions that don't require external dependencies.

### Complexity Estimate

**MEDIUM-HIGH**

Multiple test files to create, need to understand each function's behavior. Some functions have complex edge cases (temporal distribution, date handling).

### Success Criteria

- [ ] Tests for `/lib/utils/limits.ts` - all limit checking logic
- [ ] Tests for `/server/lib/cost-calculator.ts` - cost calculation functions
- [ ] Tests for `/server/lib/temporal-distribution.ts` - context selection algorithm
- [ ] Tests for `/lib/utils/wordCount.ts` - word counting utilities
- [ ] Tests for `/lib/utils/dateRange.ts` - date range filtering
- [ ] All tests pass with `npm run test:run`
- [ ] At least 80% coverage on tested files

### Files to Create

| File | Purpose |
|------|---------|
| `/lib/utils/__tests__/limits.test.ts` | Tests for reflection limit logic |
| `/lib/utils/__tests__/wordCount.test.ts` | Tests for word count utilities |
| `/lib/utils/__tests__/dateRange.test.ts` | Tests for date range filtering |
| `/server/lib/__tests__/cost-calculator.test.ts` | Tests for cost calculations |
| `/server/lib/__tests__/temporal-distribution.test.ts` | Tests for context selection |

### Dependencies

**Depends on:** Builder 2 (needs Vitest and fixtures)
**Blocks:** Builder 4 (CI needs tests to run)

### Implementation Notes

1. **Pure Functions First:** Focus on pure functions that take input and return output without side effects. These are easiest to test.

2. **Date Mocking:** For date-dependent tests (limits, dateRange), use Vitest's fake timers:
   ```typescript
   beforeEach(() => {
     vi.useFakeTimers();
     vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
   });
   afterEach(() => {
     vi.useRealTimers();
   });
   ```

3. **User Fixtures:** Import from `@/test/fixtures/users`:
   ```typescript
   import { createMockUser, freeTierAtLimit, proTierUser } from '@/test/fixtures/users';
   ```

4. **Test Organization:** Group tests by scenario (valid input, invalid input, edge cases):
   ```typescript
   describe('functionName', () => {
     describe('when input is valid', () => { ... });
     describe('when input is invalid', () => { ... });
     describe('edge cases', () => { ... });
   });
   ```

5. **Coverage Focus:** Aim for high coverage on tested files, but prioritize meaningful tests over coverage numbers.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Basic Unit Test Structure** for all tests
- Use **Date Handling in Tests** for time-sensitive functions
- Use **Test with Mocks** for functions with dependencies

### Testing Requirements

Each test file should cover:
- Happy path (valid inputs)
- Error cases (invalid inputs)
- Edge cases (boundary conditions)
- All function branches

### Test File Templates

#### limits.test.ts Structure
```typescript
describe('checkReflectionLimits', () => {
  describe('free tier', () => {
    test('should allow first reflection');
    test('should allow second reflection');
    test('should deny third reflection (at limit)');
  });

  describe('pro tier', () => {
    test('should check daily limit');
    test('should reset count after midnight');
  });

  describe('unlimited tier', () => {
    test('should always allow reflections');
  });
});
```

#### cost-calculator.test.ts Structure
```typescript
describe('calculateCost', () => {
  test('should return 0 for zero tokens');
  test('should calculate cost correctly');
  test('should handle large token counts');
});

describe('getThinkingBudget', () => {
  test('should return correct budget for free tier');
  test('should return correct budget for pro tier');
  test('should return correct budget for unlimited tier');
});
```

### Potential Split Strategy

If this task proves too complex:

**Builder 3A: Utility Tests**
- limits.test.ts
- wordCount.test.ts
- dateRange.test.ts

**Builder 3B: Server Logic Tests**
- cost-calculator.test.ts
- temporal-distribution.test.ts

---

## Builder-4: CI/CD Pipeline

### Scope

Create GitHub Actions workflow that runs on pull requests and pushes to main. The workflow should run lint, typecheck, and tests, blocking merge if any step fails.

### Complexity Estimate

**LOW**

Straightforward GitHub Actions configuration. All commands already defined by other builders.

### Success Criteria

- [ ] `.github/workflows/ci.yml` created
- [ ] CI triggers on PR to main
- [ ] CI triggers on push to main
- [ ] Lint step runs and reports errors
- [ ] TypeScript check step runs
- [ ] Test step runs all tests
- [ ] Failed steps block PR merge

### Files to Create

| File | Purpose |
|------|---------|
| `/.github/workflows/ci.yml` | CI pipeline configuration |

### Dependencies

**Depends on:** Builder 1 (lint command), Builder 2 (test command)
**Blocks:** Nothing

### Implementation Notes

1. **Workflow Triggers:** Run on both pull requests and pushes to main:
   ```yaml
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   ```

2. **Concurrency:** Cancel in-progress runs for the same PR:
   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```

3. **Node Version:** Use Node.js 20 to match the project's engine requirement:
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '20'
       cache: 'npm'
   ```

4. **Install Step:** Use `npm ci` for deterministic installs:
   ```yaml
   - run: npm ci
   ```

5. **Commands to Run:**
   - `npm run lint` - ESLint
   - `npm run typecheck` - TypeScript
   - `npm run test:run` - Vitest (non-watch mode)

6. **Keep It Simple:** Don't add complexity like:
   - Matrix builds for multiple Node versions
   - Separate jobs for each step (one job is fine)
   - Deployment steps (handled by Vercel)

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **GitHub Actions Workflow Pattern** for the complete file

### Testing Requirements

- Push a branch with a small change
- Create a PR
- Verify CI runs automatically
- Verify all steps complete (or fail appropriately)

### Workflow File Template

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run typecheck

      - name: Run tests
        run: npm run test:run
```

---

## Builder Execution Order

### Phase 1: Parallel Start (No dependencies)

- **Builder 1** - ESLint + Prettier + Husky
- **Builder 2** - Vitest Setup + Mocks

### Phase 2: Depends on Phase 1

- **Builder 3** - Unit Tests (needs Builder 2 complete)
- **Builder 4** - CI/CD Pipeline (needs Builder 1 and 2 for commands)

### Integration Timeline

```
Time 0h  ─────────────────────────────────────────────────────►

Builder 1: [======= ESLint + Prettier =======]
Builder 2: [======= Vitest Setup =======]
                                        Builder 3: [======= Unit Tests =======]
                                        Builder 4: [=== CI ===]
                                                                   Integration
```

---

## Integration Notes

### Merge Order

1. **Builder 1** first - establishes code style baseline
2. **Builder 2** second - adds test infrastructure
3. **Builder 3** third - adds test files
4. **Builder 4** last - CI can verify everything works

### Package.json Merge Strategy

All builders modify package.json. During integration:

1. Collect all `devDependencies` additions
2. Collect all `scripts` additions
3. Add Builder 1's `lint-staged` config
4. Run `npm install` to update lock file
5. Run `npm run lint && npm run typecheck && npm run test:run` to verify

### Potential Conflicts

| Files | Builders | Resolution |
|-------|----------|------------|
| `package.json` | All | Manual merge of devDependencies, scripts |
| None | N/A | Builders work on distinct files |

### Shared Configuration Validation

After integration, verify:

```bash
# All commands should work
npm run lint
npm run format:check
npm run typecheck
npm run test:run
```

---

*Builder tasks for Iteration 29: Code Quality & Testing Foundation*
