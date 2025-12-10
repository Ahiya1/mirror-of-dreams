# Testing Overview

This document provides a comprehensive overview of the testing strategy, architecture, and practices for Mirror of Dreams.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Architecture](#test-architecture)
- [Directory Structure](#directory-structure)
- [Coverage Targets](#coverage-targets)
- [Quick Start Guide](#quick-start-guide)
- [Running Tests](#running-tests)

## Testing Philosophy

Mirror of Dreams follows a **testing pyramid** approach with emphasis on:

1. **Confidence over coverage**: Tests should give developers confidence to refactor and ship
2. **Fast feedback loops**: Unit tests run in milliseconds, integration tests in seconds
3. **Realistic testing**: Tests should mirror actual user behavior as closely as possible
4. **Maintainability**: Tests should be easy to understand, modify, and debug

### Testing Principles

- **Test behavior, not implementation**: Focus on what the code does, not how it does it
- **Arrange-Act-Assert**: Structure tests clearly with setup, action, and verification phases
- **One assertion focus**: Each test should verify one logical concept (may include multiple assertions)
- **Isolation**: Tests should not depend on each other or external state
- **Readability**: Tests serve as documentation; make them self-explanatory

## Test Architecture

### Test Pyramid

```
          /\
         /  \  E2E Tests (Playwright)
        /----\  - Full user flows
       /      \ - Cross-browser testing
      /--------\ - Visual regression
     /          \
    /  Integration \  Integration Tests (Vitest)
   /    Tests       \ - tRPC router tests
  /------------------\ - Component integration
 /                    \ - API contract tests
/     Unit Tests       \  Unit Tests (Vitest)
/------------------------\ - Utility functions
                          - Pure business logic
                          - Type validation
```

### Testing Layers

| Layer       | Tool                     | Purpose                    | Location                             |
| ----------- | ------------------------ | -------------------------- | ------------------------------------ |
| Unit        | Vitest                   | Pure functions, utilities  | `lib/**/__tests__/*.test.ts`         |
| Component   | Vitest + Testing Library | React components           | `components/**/__tests__/*.test.tsx` |
| Integration | Vitest                   | tRPC routers, server logic | `server/**/__tests__/*.test.ts`      |
| E2E         | Playwright               | Full user flows            | `e2e/**/*.spec.ts`                   |

## Directory Structure

```
mirror-of-dreams/
├── test/                           # Shared test infrastructure
│   ├── factories/                  # Test data factories
│   │   ├── index.ts               # Barrel export
│   │   ├── user.factory.ts        # User fixtures
│   │   ├── dream.factory.ts       # Dream fixtures
│   │   ├── reflection.factory.ts  # Reflection fixtures
│   │   └── clarify.factory.ts     # Clarify session fixtures
│   └── helpers/                    # Test utilities
│       ├── index.ts               # Barrel export
│       ├── render.tsx             # Custom render with providers
│       └── trpc.ts                # tRPC mock utilities
│
├── e2e/                           # End-to-end tests
│   ├── fixtures/                  # Playwright fixtures
│   │   ├── auth.fixture.ts       # Authentication helpers
│   │   └── test-data.fixture.ts  # Shared test constants
│   ├── pages/                     # Page Object Models
│   │   ├── signin.page.ts
│   │   ├── signup.page.ts
│   │   ├── dashboard.page.ts
│   │   ├── dreams.page.ts
│   │   ├── landing.page.ts
│   │   └── reflection.page.ts
│   ├── auth/                      # Auth flow tests
│   ├── dashboard/                 # Dashboard tests
│   ├── dreams/                    # Dreams feature tests
│   ├── landing/                   # Landing page tests
│   └── reflection/                # Reflection flow tests
│
├── components/
│   └── **/__tests__/              # Component tests (co-located)
│       └── *.test.tsx
│
├── lib/
│   └── **/__tests__/              # Library tests (co-located)
│       └── *.test.ts
│
├── server/
│   └── **/__tests__/              # Server tests (co-located)
│       └── *.test.ts
│
├── vitest.config.ts               # Vitest configuration
├── vitest.setup.ts                # Vitest global setup
└── playwright.config.ts           # Playwright configuration
```

### Test File Naming Conventions

| Type             | Pattern      | Example                 |
| ---------------- | ------------ | ----------------------- |
| Unit test        | `*.test.ts`  | `limits.test.ts`        |
| Component test   | `*.test.tsx` | `DreamsCard.test.tsx`   |
| Integration test | `*.test.ts`  | `auth-security.test.ts` |
| E2E test         | `*.spec.ts`  | `signin.spec.ts`        |

## Coverage Targets

Coverage thresholds are configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    statements: 29,
    branches: 55,
    functions: 44,
    lines: 29,
  },
}
```

### Coverage by Area

| Area                  | Target | Current  | Priority        |
| --------------------- | ------ | -------- | --------------- |
| `lib/**/*.ts`         | 80%    | Variable | High            |
| `server/**/*.ts`      | 70%    | Variable | High            |
| `components/**/*.tsx` | 60%    | Variable | Medium          |
| `types/**/*.ts`       | N/A    | N/A      | Low (type-only) |

### Coverage Exclusions

Files excluded from coverage:

- `**/*.d.ts` - Type definitions
- `**/__tests__/**` - Test files themselves
- `**/test/**` - Test utilities

## Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Unit/Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest lib/utils/__tests__/limits.test.ts
```

### 3. Run E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Run specific E2E test
npx playwright test e2e/auth/signin.spec.ts
```

### 4. View Coverage Report

```bash
npm run test:coverage
open coverage/index.html
```

## Running Tests

### Vitest Commands

```bash
# All tests once
npx vitest run

# Watch mode (default)
npx vitest

# Specific file
npx vitest path/to/test.ts

# Pattern matching
npx vitest --grep "DreamsCard"

# With coverage
npx vitest --coverage

# UI mode
npx vitest --ui
```

### Playwright Commands

```bash
# All E2E tests
npx playwright test

# Headed mode (see browser)
npx playwright test --headed

# Specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

### CI/CD Integration

Tests run automatically on:

- Pull requests to `main`
- Pushes to `main`

CI workflow stages:

1. **Quality**: TypeScript check + lint
2. **Test**: Vitest with coverage
3. **Build**: Next.js build

## Configuration Files

### vitest.config.ts

Key settings:

- Environment: `happy-dom`
- Global test utilities enabled
- Path aliases matching `tsconfig.json`
- V8 coverage provider

### vitest.setup.ts

Global setup includes:

- Jest DOM matchers (`@testing-library/jest-dom/vitest`)
- Environment variable mocks
- Global fetch mock
- Haptic feedback mock
- Mock reset between tests

### playwright.config.ts

Key settings:

- Base URL: `http://localhost:3000`
- Parallel execution enabled
- Retries on CI only
- Screenshot/video on failure
- HTML reporter

## Next Steps

- [Testing Patterns](./patterns.md) - Component and hook testing patterns
- [Mocking Guide](./mocking.md) - How to mock Anthropic, Supabase, and tRPC
- [Test Factories](./factories.md) - Creating test data
- [E2E Testing](./e2e.md) - Playwright setup and Page Object Model
- [Debugging Tests](./debugging.md) - Troubleshooting test failures
