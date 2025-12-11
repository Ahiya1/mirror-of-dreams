# Debugging Tests Guide

This guide covers common test failures, debugging techniques, and tips for resolving issues in both Vitest and Playwright tests.

## Table of Contents

- [Common Test Failures](#common-test-failures)
- [Debugging Vitest Tests](#debugging-vitest-tests)
- [Debugging Playwright Tests](#debugging-playwright-tests)
- [Coverage Reports](#coverage-reports)
- [Flaky Tests](#flaky-tests)
- [Troubleshooting Checklist](#troubleshooting-checklist)

## Common Test Failures

### Mock Not Applied

**Symptom**: Tests fail with "Cannot read property of undefined" or actual API calls being made.

**Cause**: Mock declaration order or module caching issues.

**Solution**:

```typescript
// Ensure mocks are declared BEFORE imports
vi.mock('@/lib/trpc');

// Then import the mocked module
import { trpc } from '@/lib/trpc';
import { MyComponent } from '../MyComponent';

// Setup mock implementation in test or beforeEach
beforeEach(() => {
  vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult([activeDream]));
});
```

### Act Warning in Component Tests

**Symptom**: Warning about state updates not wrapped in `act()`.

**Cause**: Async state updates happening outside test flow.

**Solution**:

```typescript
// Use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Or wrap async operations
await act(async () => {
  await userEvent.click(button);
});
```

### Element Not Found

**Symptom**: `Unable to find element` error.

**Solutions**:

```typescript
// 1. Check if element exists with query
const element = screen.queryByText('Text');
console.log('Element exists:', !!element);

// 2. Use findBy for async elements
const element = await screen.findByText('Text', {}, { timeout: 5000 });

// 3. Debug current DOM state
screen.debug();

// 4. Check container HTML
const { container } = renderWithProviders(<Component />);
console.log(container.innerHTML);
```

### Timeout in Async Tests

**Symptom**: Test times out waiting for condition.

**Solutions**:

```typescript
// 1. Increase timeout for specific assertion
await waitFor(() => expect(element).toBeVisible(), { timeout: 10000 });

// 2. Increase test timeout
test('slow test', async () => {
  // test code
}, 30000); // 30 second timeout

// 3. Check for unresolved promises
// Mock any pending API calls
vi.mocked(fetchData).mockResolvedValue(data);
```

### Mock Not Reset Between Tests

**Symptom**: Test passes in isolation but fails when run with others.

**Solution**:

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Clear call history
  // OR
  vi.resetAllMocks(); // Clear calls AND reset implementations
  // OR
  vi.restoreAllMocks(); // Restore original implementations
});

afterEach(() => {
  // Clean up any subscriptions or timers
  vi.clearAllTimers();
});
```

### Import Path Issues

**Symptom**: Module not found errors.

**Solution**:

```typescript
// Ensure path aliases are configured in vitest.config.ts
alias: {
  '@': path.resolve(__dirname, './'),
  '@/components': path.resolve(__dirname, './components'),
  '@/lib': path.resolve(__dirname, './lib'),
  '@/test': path.resolve(__dirname, './test'),
}
```

## Debugging Vitest Tests

### Interactive Debug Mode

```bash
# Run tests with Node inspector
npx vitest --inspect-brk

# Then open chrome://inspect in Chrome
```

### Using console.log

```typescript
test('debugging example', () => {
  const result = calculateValue(input);

  console.log('Input:', input);
  console.log('Result:', result);
  console.log('Expected:', expected);

  expect(result).toBe(expected);
});
```

### Using screen.debug()

```typescript
test('component debug', () => {
  renderWithProviders(<MyComponent />);

  // Print entire DOM
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole('button'));

  // Print with max length
  screen.debug(undefined, 30000);
});
```

### Vitest UI Mode

```bash
# Run with interactive UI
npx vitest --ui
```

Features:

- Visual test tree
- Click to run individual tests
- View console output per test
- Filter by status/pattern

### Using Test Snapshots

```typescript
// Create inline snapshot for debugging
expect(result).toMatchInlineSnapshot();

// After running, see the actual value:
expect(result).toMatchInlineSnapshot(`
  {
    "id": "123",
    "name": "Test",
  }
`);
```

### Debugging Specific Test

```bash
# Run single test file
npx vitest path/to/test.ts

# Run tests matching pattern
npx vitest --grep "should create dream"

# Run with verbose output
npx vitest --reporter=verbose
```

## Debugging Playwright Tests

### Debug Mode

```bash
# Interactive debug mode
npx playwright test --debug

# Debug specific test
npx playwright test e2e/auth/signin.spec.ts --debug
```

Debug mode features:

- Step through test line by line
- Inspect page state at each step
- Use browser DevTools
- Modify locators in real-time

### Headed Mode

```bash
# See browser during test
npx playwright test --headed

# Slow down execution
npx playwright test --headed --slow-mo=500
```

### Trace Viewer

```bash
# Run with trace on
npx playwright test --trace on

# View trace after test
npx playwright show-trace trace.zip
```

Trace includes:

- Screenshots at each step
- DOM snapshots
- Network requests
- Console logs
- Action timeline

### Page.pause()

```typescript
test('debug with pause', async ({ page }) => {
  await page.goto('/dashboard');

  // Pause here - opens Playwright Inspector
  await page.pause();

  // Continue test
  await page.click('button');
});
```

### Console Logs in Tests

```typescript
// Listen to console messages
page.on('console', (msg) => {
  console.log('Browser console:', msg.type(), msg.text());
});

// Or collect for assertions
const logs: string[] = [];
page.on('console', (msg) => logs.push(msg.text()));

await page.goto('/');

expect(logs).not.toContain('Error');
```

### Screenshot Debugging

```typescript
test('visual debug', async ({ page }) => {
  await page.goto('/dashboard');

  // Take screenshot
  await page.screenshot({ path: 'debug-screenshot.png' });

  // Full page screenshot
  await page.screenshot({ path: 'full-page.png', fullPage: true });

  // Screenshot specific element
  const card = page.locator('.dream-card');
  await card.screenshot({ path: 'card.png' });
});
```

### Network Debugging

```typescript
// Log all requests
page.on('request', (request) => {
  console.log('Request:', request.url());
});

page.on('response', (response) => {
  console.log('Response:', response.status(), response.url());
});

// Wait for specific request
const [response] = await Promise.all([page.waitForResponse('**/api/dreams'), page.click('button')]);
console.log('API response:', await response.json());
```

## Coverage Reports

### Generating Coverage

```bash
# Run tests with coverage
npm run test:coverage

# Or directly
npx vitest --coverage
```

### Understanding Coverage Output

```
------------|---------|----------|---------|---------|
File        | % Stmts | % Branch | % Funcs | % Lines |
------------|---------|----------|---------|---------|
All files   |   45.23 |   52.17  |   38.46 |   45.23 |
 limits.ts  |   100   |   100    |   100   |   100   |
 retry.ts   |   23.08 |   33.33  |   25    |   23.08 |
------------|---------|----------|---------|---------|
```

| Metric     | Description                |
| ---------- | -------------------------- |
| Statements | Lines of code executed     |
| Branches   | if/else/switch paths taken |
| Functions  | Functions called           |
| Lines      | Source lines covered       |

### HTML Coverage Report

```bash
# Generate and view
npm run test:coverage
open coverage/index.html
```

Features:

- Click through files
- See uncovered lines highlighted
- View coverage per function
- Filter by coverage level

### Improving Coverage

```typescript
// 1. Test edge cases
test('handles empty array', () => {
  expect(processDreams([])).toEqual([]);
});

test('handles null input', () => {
  expect(() => processDreams(null)).toThrow();
});

// 2. Test all branches
test('returns early for guest user', () => {
  const result = getDreams(null); // guest branch
  expect(result).toEqual([]);
});

test('fetches dreams for authenticated user', () => {
  const result = getDreams(user); // authenticated branch
  expect(result).toHaveLength(2);
});

// 3. Test error paths
test('handles API error', () => {
  vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
  expect(() => fetchDreams()).rejects.toThrow('Network error');
});
```

## Flaky Tests

### Identifying Flaky Tests

```bash
# Run tests multiple times
for i in {1..10}; do npx vitest run; done

# Or use Playwright's repeat
npx playwright test --repeat-each=5
```

### Common Causes and Fixes

#### 1. Timing Issues

```typescript
// Bad - arbitrary wait
await page.waitForTimeout(1000);

// Good - wait for condition
await expect(element).toBeVisible({ timeout: 5000 });
await page.waitForLoadState('networkidle');
```

#### 2. Race Conditions

```typescript
// Bad - assumes order
await page.click('button');
expect(screen.getByText('Done')).toBeInTheDocument();

// Good - wait for result
await page.click('button');
await expect(page.locator('text=Done')).toBeVisible();
```

#### 3. Test Isolation

```typescript
// Bad - shared state
let counter = 0;
test('test 1', () => {
  counter++;
});
test('test 2', () => {
  expect(counter).toBe(0);
}); // Fails!

// Good - isolated state
beforeEach(() => {
  counter = 0;
});
```

#### 4. Date/Time Dependencies

```typescript
// Bad - depends on current time
expect(greeting).toContain('Good morning');

// Good - mock time
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-01T09:00:00'));
expect(greeting).toContain('Good morning');
vi.useRealTimers();
```

#### 5. Network Dependencies

```typescript
// Bad - real API call
const data = await fetchFromAPI();

// Good - mock API
vi.mocked(fetch).mockResolvedValue({
  json: () => Promise.resolve({ data: [] }),
});
```

### Retry Strategy

```typescript
// For known flaky test in Playwright
test('sometimes flaky', async ({ page }) => {
  test.retry(2); // Retry up to 2 times
  // test code
});

// Or configure globally for CI
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
```

## Troubleshooting Checklist

### Test Won't Run

- [ ] Check file naming (`.test.ts`, `.test.tsx`, `.spec.ts`)
- [ ] Check file location (matches include patterns)
- [ ] Check for syntax errors
- [ ] Try running single test file

### Test Fails Unexpectedly

- [ ] Run in isolation: `npx vitest path/to/test.ts`
- [ ] Check mock setup order
- [ ] Add `console.log` statements
- [ ] Use `screen.debug()` for components
- [ ] Check for async issues (missing `await`)

### Mock Issues

- [ ] Mock declared before imports?
- [ ] `vi.clearAllMocks()` in `beforeEach`?
- [ ] Using `vi.mocked()` for type safety?
- [ ] Check module path matches exactly

### E2E Test Fails

- [ ] Is dev server running?
- [ ] Check baseURL in config
- [ ] Use `--headed` to watch test
- [ ] Add `await page.pause()` to inspect
- [ ] Check for element visibility before interaction

### Coverage Not Increasing

- [ ] File in coverage include pattern?
- [ ] Not in exclude pattern?
- [ ] Tests actually executing that code?
- [ ] Check HTML report for specific lines

### CI-Specific Failures

- [ ] Check for environment differences
- [ ] Verify env variables are set
- [ ] Check for timing issues (slower CI)
- [ ] Review CI logs for actual error
- [ ] Test with `CI=true` locally

## Quick Reference Commands

```bash
# Vitest
npx vitest                    # Run in watch mode
npx vitest run                # Run once
npx vitest --ui               # Interactive UI
npx vitest --coverage         # With coverage
npx vitest path/to/test.ts    # Specific file
npx vitest --grep "pattern"   # By test name

# Playwright
npx playwright test           # Run all
npx playwright test --headed  # See browser
npx playwright test --debug   # Debug mode
npx playwright test --ui      # Interactive UI
npx playwright show-report    # View HTML report
npx playwright codegen        # Generate tests
```

## Related Documentation

- [Testing Overview](./overview.md) - General testing setup
- [Testing Patterns](./patterns.md) - How to write tests
- [Mocking Guide](./mocking.md) - Mock configuration
- [E2E Testing](./e2e.md) - Playwright specifics
