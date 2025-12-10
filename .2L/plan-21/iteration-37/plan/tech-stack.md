# Technology Stack

## Core Testing Framework (Existing)

**Decision:** Vitest 2.1.x with happy-dom environment

**Rationale:**
- Already configured and working in the project
- Excellent TypeScript support
- Fast execution with V8 coverage provider
- Compatible with React Testing Library patterns

**Current Configuration:**
- Environment: happy-dom
- Coverage: v8 provider with text/json/html reporters
- Setup file: vitest.setup.ts

## E2E Testing Framework (New)

**Decision:** Playwright Test (`@playwright/test`)

**Rationale:**
- Best-in-class support for Next.js applications
- Auto-waits for elements, reducing flaky tests
- Built-in web server management for development
- Excellent CI/CD integration with GitHub Actions
- Screenshot and video capture on failure
- Cross-browser testing capabilities

**Alternatives Considered:**
- Cypress: More popular but slower, requires separate server management
- Puppeteer: Lower-level, requires more boilerplate

**Version:** Latest stable (will be installed fresh)

## Test Infrastructure

### Unit Testing

**Framework:** Vitest 2.1.x (existing)
**Coverage Provider:** V8 (existing)
**Test Environment:** happy-dom (existing)

### E2E Testing

**Framework:** Playwright Test
**Primary Browser:** Chromium (for CI efficiency)
**Secondary Browsers:** Firefox, Mobile Safari (local development)

### Coverage Configuration

**Decision:** Add coverage thresholds to vitest.config.ts

**Thresholds:**
- Statements: 70%
- Branches: 65%
- Functions: 70%
- Lines: 70%

**Rationale:** Starting with achievable thresholds that can be increased over time. These percentages balance quality with practical development velocity.

## CI/CD Pipeline

### GitHub Actions Workflow

**Decision:** Extend existing ci.yml with E2E job

**Workflow Structure:**
1. `quality` job - TypeScript, ESLint, Prettier
2. `test` job - Unit tests with coverage (depends on quality)
3. `e2e` job - Playwright E2E tests (depends on test)
4. `build` job - Production build (depends on quality, test)

**E2E CI Configuration:**
- Browser: Chromium only (for speed)
- Workers: 1 (serial execution for reliability)
- Retries: 2 (handle flaky tests)
- Artifacts: HTML report uploaded on failure

## Test Data Strategy

### Unit Tests

**Approach:** Existing mock infrastructure in `/test/mocks/`
- `anthropic.ts` - Anthropic API mocks
- Test fixtures in `/test/fixtures/`

### E2E Tests

**Approach:** Use existing demo login functionality

The application already has a demo login feature (`auth.loginDemo`). For MVP E2E tests:
1. Use demo account for authenticated flows
2. Use fresh email addresses for signup tests
3. No database seeding required initially

**Future Enhancement:** Database seeding script for controlled test data

## Environment Variables

### Required for Unit Tests

None additional - existing mocks handle external dependencies

### Required for E2E Tests (Local)

```bash
# Standard development env vars are sufficient
# E2E tests run against local dev server
```

### Required for E2E Tests (CI)

```bash
# GitHub Actions secrets/variables
SUPABASE_URL        # Local Supabase URL (if using)
SUPABASE_ANON_KEY   # Local Supabase key (if using)
JWT_SECRET          # Test JWT secret
```

**Note:** For MVP, E2E tests will use the demo login flow which doesn't require database setup.

## Dependencies Overview

### Existing Dependencies (Testing)

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | ^2.1.0 | Unit test runner |
| @vitest/coverage-v8 | ^2.1.0 | Coverage provider |
| @vitest/ui | ^2.1.0 | Test UI |
| happy-dom | ^15.11.0 | DOM environment |

### New Dependencies (E2E)

| Package | Version | Purpose |
|---------|---------|---------|
| @playwright/test | latest | E2E test framework |

## File Structure Changes

### New Files to Create

```
e2e/
  fixtures/
    auth.fixture.ts       # Authenticated page fixture
  pages/
    signin.page.ts        # Sign in page object
    signup.page.ts        # Sign up page object
  auth/
    signin.spec.ts        # Sign in E2E tests
    signup.spec.ts        # Sign up E2E tests
playwright.config.ts      # Playwright configuration
```

### Files to Modify

```
package.json             # Add E2E scripts, @playwright/test
vitest.config.ts         # Add coverage thresholds
.github/workflows/ci.yml # Remove continue-on-error, add E2E job
.gitignore               # Add Playwright artifacts
lib/utils/__tests__/retry.test.ts           # Fix async patterns
lib/utils/__tests__/anthropic-retry.test.ts # Fix async patterns
```

## Performance Targets

### Unit Tests
- Total execution time: < 30 seconds
- Individual test: < 500ms

### E2E Tests
- Total execution time: < 3 minutes
- Individual test: < 30 seconds

### CI Pipeline
- Quality job: < 2 minutes
- Test job: < 3 minutes
- E2E job: < 5 minutes
- Build job: < 5 minutes
- Total pipeline: < 10 minutes

## Security Considerations

### Test Data
- Never use real user credentials in tests
- Demo account is specifically for testing
- Unique email addresses for signup tests prevent conflicts

### CI Environment
- Secrets stored in GitHub Actions secrets
- No hardcoded credentials in test files
- Environment variables validated at runtime
