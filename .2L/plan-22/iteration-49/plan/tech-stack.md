# Technology Stack

## Testing Framework

**Decision:** Vitest 3.x

**Rationale:**
- Already established in the codebase with extensive patterns
- Fast execution with ESM support
- Compatible with existing `vi.mock()` patterns
- Integrated coverage reporting

**Configuration:**
- Test files: `**/__tests__/*.test.ts`
- Setup file: None required for these tests (using inline mocks)
- Coverage target: 80%+ per file

## Test Runner

**Decision:** Vitest with inline mock patterns

**Commands:**
```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- lib/__tests__/utils.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test -- --watch
```

## Mocking Strategy

### Date Mocking
**Decision:** `vi.useFakeTimers()` + `vi.setSystemTime()`

**Rationale:**
- Established pattern in `limits.test.ts` and `retry.test.ts`
- Provides deterministic date testing
- Clean setup/teardown in beforeEach/afterEach

**Implementation:**
```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

### Browser API Mocking (navigator.vibrate)
**Decision:** `Object.defineProperty()` for global navigator

**Rationale:**
- Required for testing haptics in Node.js environment
- Clean override/restore pattern
- Supports both present and absent navigator scenarios

**Implementation:**
```typescript
const mockVibrate = vi.fn().mockReturnValue(true);
const originalNavigator = global.navigator;

beforeEach(() => {
  Object.defineProperty(global, 'navigator', {
    value: { vibrate: mockVibrate },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(global, 'navigator', {
    value: originalNavigator,
    configurable: true,
    writable: true,
  });
  vi.clearAllMocks();
});
```

## Dependencies

No additional dependencies required. Using existing:
- `vitest` - Test framework
- `@vitest/coverage-v8` - Coverage reporting (if configured)

## File Structure

```
lib/
  __tests__/
    utils.test.ts              # NEW - Core utility tests
  utils/
    __tests__/
      retry.test.ts            # Existing
      limits.test.ts           # Existing
      haptics.test.ts          # NEW
      dateRange.test.ts        # NEW
      wordCount.test.ts        # NEW
      anthropic-retry.test.ts  # Existing
  anthropic/
    __tests__/
      type-guards.test.ts      # NEW
  clarify/
    __tests__/
      context-builder.test.ts  # Existing
```

## Coverage Targets

| File | Minimum Coverage | Target Coverage |
|------|------------------|-----------------|
| `lib/utils.ts` | 80% | 95% |
| `lib/utils/haptics.ts` | 80% | 95% |
| `lib/utils/dateRange.ts` | 80% | 95% |
| `lib/utils/wordCount.ts` | 80% | 95% |
| `lib/anthropic/type-guards.ts` | 80% | 95% |

## Testing Patterns Reference

Existing test files for reference:
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts` - Comprehensive mock patterns
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/limits.test.ts` - Date mocking, user factory
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts` - Anthropic type definitions

## Code Quality Standards

- All tests use `describe` blocks for logical grouping
- Each test has a clear, descriptive name
- Tests follow Arrange-Act-Assert pattern
- Mock functions cleared between tests
- No console.log in test files
- Type safety maintained (no `any` types)
