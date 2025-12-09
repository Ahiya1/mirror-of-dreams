# Technology Stack

## Overview

This document details all technology decisions for Iteration 29: Code Quality & Testing Foundation. Each decision includes rationale tied to exploration findings and project requirements.

---

## Linting

### ESLint

**Decision:** ESLint 9.x with flat config format

**Rationale:**
1. Next.js 14 supports flat config format (eslint.config.mjs)
2. Flat config is the future of ESLint, legacy format deprecated
3. Better TypeScript integration with @typescript-eslint/eslint-plugin
4. Exploration found no existing ESLint config - start fresh with modern approach

**Alternatives Considered:**
- Legacy .eslintrc.json: Deprecated format, avoid
- Biome: Too new, less Next.js ecosystem support

**Configuration Approach:**
- Extend Next.js strict config as base
- Add TypeScript strict rules
- Add import sorting rules
- Add accessibility rules (jsx-a11y)

### ESLint Plugins

| Plugin | Version | Purpose |
|--------|---------|---------|
| `eslint-config-next` | ^14.2.0 | Next.js specific rules |
| `@typescript-eslint/parser` | ^8.0.0 | TypeScript parsing |
| `@typescript-eslint/eslint-plugin` | ^8.0.0 | TypeScript rules |
| `eslint-plugin-import` | ^2.29.0 | Import ordering/validation |
| `eslint-plugin-jsx-a11y` | ^6.8.0 | Accessibility rules |

---

## Formatting

### Prettier

**Decision:** Prettier 3.x with ESLint integration

**Rationale:**
1. Industry standard for code formatting
2. Opinionated - reduces bikeshedding
3. Exploration found inconsistent formatting (trailing commas, import spacing)
4. eslint-config-prettier prevents ESLint/Prettier conflicts

**Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Settings Rationale:**
- `singleQuote: true` - Matches existing codebase pattern
- `trailingComma: es5` - Safe for all environments, cleaner diffs
- `tabWidth: 2` - Matches existing indentation
- `printWidth: 100` - Reasonable line length for modern screens
- Tailwind plugin - Auto-sorts Tailwind classes

### Prettier Integration

| Package | Purpose |
|---------|---------|
| `prettier` | Core formatter |
| `eslint-config-prettier` | Disables conflicting ESLint rules |
| `prettier-plugin-tailwindcss` | Auto-sort Tailwind classes |

---

## Testing Framework

### Vitest

**Decision:** Vitest 2.x (over Jest)

**Rationale:**
1. Existing test file (paypal.test.ts) already uses Vitest syntax
2. Native ES modules support - no transformation needed
3. Faster execution than Jest (Vite-based)
4. Better TypeScript integration out of the box
5. Jest-compatible API for familiarity
6. Exploration recommended Vitest unanimously

**Alternatives Considered:**
- Jest: Slower, requires more config for ES modules
- Bun test runner: Too new, less documentation

### Vitest Configuration

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
    exclude: ['node_modules', '.next', '.2L'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts'],
      exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
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

### Testing Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^2.1.0 | Test framework |
| `@vitest/coverage-v8` | ^2.1.0 | Code coverage |
| `@vitest/ui` | ^2.1.0 | Visual test UI (optional) |
| `happy-dom` | ^15.0.0 | DOM environment (lighter than jsdom) |

### Future Testing Packages (Not This Iteration)

| Package | Purpose | When to Add |
|---------|---------|-------------|
| `@testing-library/react` | Component testing | Component test iteration |
| `@testing-library/jest-dom` | DOM matchers | Component test iteration |
| `msw` | API mocking | Integration test iteration |

---

## Pre-commit Hooks

### Husky + lint-staged

**Decision:** Husky 9.x + lint-staged 15.x

**Rationale:**
1. Industry standard for Git hooks
2. Ensures code quality before commit
3. Prevents broken code from entering repository
4. lint-staged runs only on staged files (fast)

**Configuration:**

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

### Husky Hooks

| Hook | Action |
|------|--------|
| `pre-commit` | Run lint-staged |

---

## CI/CD Pipeline

### GitHub Actions

**Decision:** GitHub Actions for CI

**Rationale:**
1. Native GitHub integration
2. Free for public repositories
3. Simple YAML configuration
4. Exploration found no existing CI - start fresh

**Workflow Triggers:**
- Pull request to main
- Push to main

**Jobs:**
1. **Lint** - Run ESLint
2. **Typecheck** - Run TypeScript compiler
3. **Test** - Run Vitest with coverage

### CI Configuration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run
```

---

## TypeScript Enhancements

### Additional Strict Options

**Decision:** Add safety-focused compiler options

**Options to Add:**
```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Rationale:**
- `noUncheckedIndexedAccess`: Safer array/object access, catches undefined bugs
- `noImplicitReturns`: All code paths must return, prevents logic errors
- `noFallthroughCasesInSwitch`: Explicit break/return in switch cases

**Risk Mitigation:**
These options may surface new type errors. If errors are extensive:
1. Fix critical errors
2. Add `// @ts-expect-error` with TODO comment for non-critical
3. Plan cleanup in future iteration

---

## Package.json Scripts

### New Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "prepare": "husky"
  }
}
```

### Script Descriptions

| Script | Purpose |
|--------|---------|
| `lint` | Check for lint errors |
| `lint:fix` | Auto-fix lint errors |
| `format` | Format all files |
| `format:check` | Check formatting (CI) |
| `typecheck` | Type-only checking |
| `test` | Run tests in watch mode |
| `test:run` | Run tests once (CI) |
| `test:coverage` | Run with coverage report |
| `test:ui` | Visual test interface |
| `prepare` | Setup Husky hooks |

---

## Environment Variables

### Test Environment

Create `.env.test` or use vitest.setup.ts:

```typescript
// vitest.setup.ts
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
// Add other required env vars with test values
```

### CI Environment

GitHub Actions will use repository secrets for any required variables. For this iteration, tests should not require real API keys.

---

## Dependencies Summary

### New devDependencies

```bash
npm install -D \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-import \
  eslint-plugin-jsx-a11y \
  prettier \
  eslint-config-prettier \
  prettier-plugin-tailwindcss \
  vitest \
  @vitest/coverage-v8 \
  @vitest/ui \
  happy-dom \
  husky \
  lint-staged
```

### Version Constraints

All packages should use latest stable versions as of iteration date:
- ESLint ecosystem: ^9.x (flat config)
- TypeScript ESLint: ^8.x
- Prettier: ^3.x
- Vitest: ^2.x
- Husky: ^9.x
- lint-staged: ^15.x

---

## Performance Targets

### Lint Performance
- Full codebase lint: < 30 seconds
- Staged files lint: < 5 seconds

### Test Performance
- Full test suite: < 60 seconds
- Watch mode startup: < 3 seconds

### CI Performance
- Full CI pipeline: < 3 minutes
- Target: Fast feedback on PRs

---

## Security Considerations

### Dependency Security
- All new packages are well-maintained with active security patches
- No packages with known vulnerabilities at time of selection

### Code Quality Security
- ESLint rules catch common security issues
- TypeScript strict mode prevents type-related bugs
- Pre-commit hooks prevent accidentally committing sensitive data

---

*Technology decisions for Iteration 29: Code Quality & Testing Foundation*
