# Code Patterns & Conventions

## File Structure

```
lib/
  __tests__/
    utils.test.ts              # Tests for lib/utils.ts
  utils/
    __tests__/
      haptics.test.ts          # Tests for lib/utils/haptics.ts
      dateRange.test.ts        # Tests for lib/utils/dateRange.ts
      wordCount.test.ts        # Tests for lib/utils/wordCount.ts
  anthropic/
    __tests__/
      type-guards.test.ts      # Tests for lib/anthropic/type-guards.ts
```

## Naming Conventions

- Test files: `{module}.test.ts` (same directory pattern as module)
- Test descriptions: Use sentence case, describe behavior not implementation
- Mock functions: `mock{FunctionName}` (e.g., `mockVibrate`)
- Test data: Descriptive variable names (e.g., `recentDate`, `oldDate`)

## Test File Structure Pattern

```typescript
// lib/utils/__tests__/example.test.ts - Description of what tests cover
// Tests for [module name]

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { functionToTest, anotherFunction } from '../module';

// =====================================================
// FUNCTION_NAME TESTS
// =====================================================

describe('functionToTest', () => {
  // -------------------------------------------------
  // Setup/Teardown (if needed)
  // -------------------------------------------------

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  // -------------------------------------------------
  // Success Cases
  // -------------------------------------------------

  describe('success cases', () => {
    it('handles normal input correctly', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('handles empty input', () => {
      expect(functionToTest('')).toBe('');
    });
  });

  // -------------------------------------------------
  // Error Cases
  // -------------------------------------------------

  describe('error cases', () => {
    it('handles invalid input gracefully', () => {
      expect(() => functionToTest(null as any)).not.toThrow();
    });
  });
});
```

## Date Mocking Pattern

**When to use:** Testing functions that use `Date.now()` or `new Date()`

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('timeAgo', () => {
  // Fixed date for deterministic tests
  const NOW = new Date('2024-06-15T10:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for dates less than 60 seconds ago', () => {
    const thirtySecondsAgo = new Date(NOW.getTime() - 30 * 1000);
    expect(timeAgo(thirtySecondsAgo)).toBe('just now');
  });

  it('returns minutes ago for dates less than 1 hour ago', () => {
    const tenMinutesAgo = new Date(NOW.getTime() - 10 * 60 * 1000);
    expect(timeAgo(tenMinutesAgo)).toBe('10 minutes ago');
  });

  it('returns hours ago for dates less than 1 day ago', () => {
    const fiveHoursAgo = new Date(NOW.getTime() - 5 * 60 * 60 * 1000);
    expect(timeAgo(fiveHoursAgo)).toBe('5 hours ago');
  });
});
```

## Browser API Mocking Pattern (Navigator)

**When to use:** Testing browser APIs like `navigator.vibrate`

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { haptic, isHapticSupported } from '../haptics';

describe('haptics', () => {
  const mockVibrate = vi.fn().mockReturnValue(true);
  const originalNavigator = global.navigator;

  // -------------------------------------------------
  // Navigator Present Tests
  // -------------------------------------------------

  describe('when navigator.vibrate is available', () => {
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

    it('calls navigator.vibrate with correct duration', () => {
      haptic('light');
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('returns true for isHapticSupported', () => {
      expect(isHapticSupported()).toBe(true);
    });
  });

  // -------------------------------------------------
  // Navigator Absent Tests (SSR scenario)
  // -------------------------------------------------

  describe('when navigator is undefined', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
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
    });

    it('does not throw when calling haptic', () => {
      expect(() => haptic('light')).not.toThrow();
    });

    it('returns false for isHapticSupported', () => {
      expect(isHapticSupported()).toBe(false);
    });
  });
});
```

## Pure Function Testing Pattern

**When to use:** Testing functions with no side effects

```typescript
import { describe, expect, it } from 'vitest';

import { countWords, formatWordCount, getWordCountState } from '../wordCount';

// =====================================================
// countWords TESTS
// =====================================================

describe('countWords', () => {
  describe('basic counting', () => {
    it('returns 0 for empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('returns 0 for whitespace-only string', () => {
      expect(countWords('   ')).toBe(0);
      expect(countWords('\n\t')).toBe(0);
    });

    it('counts single word', () => {
      expect(countWords('hello')).toBe(1);
    });

    it('counts multiple words', () => {
      expect(countWords('hello world')).toBe(2);
      expect(countWords('one two three four')).toBe(4);
    });
  });

  describe('whitespace handling', () => {
    it('handles multiple spaces between words', () => {
      expect(countWords('hello    world')).toBe(2);
    });

    it('handles tabs', () => {
      expect(countWords('hello\tworld')).toBe(2);
    });

    it('handles line breaks', () => {
      expect(countWords('hello\nworld')).toBe(2);
    });

    it('handles mixed whitespace', () => {
      expect(countWords('  hello \n world  \t test  ')).toBe(3);
    });
  });
});
```

## Type Guard Testing Pattern

**When to use:** Testing Anthropic content block type guards

```typescript
import { describe, expect, it } from 'vitest';

import {
  isTextBlock,
  isThinkingBlock,
  isToolUseBlock,
  extractText,
  extractThinking,
} from '../type-guards';

// Mock content blocks matching Anthropic SDK types
const createTextBlock = (text: string) => ({
  type: 'text' as const,
  text,
});

const createThinkingBlock = (thinking: string) => ({
  type: 'thinking' as const,
  thinking,
});

const createToolUseBlock = (name: string, input: unknown) => ({
  type: 'tool_use' as const,
  id: 'tool_123',
  name,
  input,
});

const createMockMessage = (content: any[]) => ({
  id: 'msg_123',
  type: 'message' as const,
  role: 'assistant' as const,
  content,
  model: 'claude-sonnet-4-20250514',
  stop_reason: 'end_turn' as const,
  stop_sequence: null,
  usage: { input_tokens: 100, output_tokens: 50 },
});

// =====================================================
// isTextBlock TESTS
// =====================================================

describe('isTextBlock', () => {
  it('returns true for text blocks', () => {
    const block = createTextBlock('Hello world');
    expect(isTextBlock(block)).toBe(true);
  });

  it('returns false for thinking blocks', () => {
    const block = createThinkingBlock('Thinking...');
    expect(isTextBlock(block)).toBe(false);
  });

  it('returns false for tool_use blocks', () => {
    const block = createToolUseBlock('calculator', { num: 5 });
    expect(isTextBlock(block)).toBe(false);
  });
});

// =====================================================
// extractText TESTS
// =====================================================

describe('extractText', () => {
  it('extracts text from message with single text block', () => {
    const message = createMockMessage([createTextBlock('Hello')]);
    expect(extractText(message)).toBe('Hello');
  });

  it('extracts first text block when multiple exist', () => {
    const message = createMockMessage([
      createTextBlock('First'),
      createTextBlock('Second'),
    ]);
    expect(extractText(message)).toBe('First');
  });

  it('returns empty string when no text blocks exist', () => {
    const message = createMockMessage([createThinkingBlock('Thinking...')]);
    expect(extractText(message)).toBe('');
  });

  it('finds text block among mixed content', () => {
    const message = createMockMessage([
      createThinkingBlock('Thinking...'),
      createTextBlock('Response'),
    ]);
    expect(extractText(message)).toBe('Response');
  });
});
```

## Tailwind Class Merge Testing Pattern

**When to use:** Testing `cn()` utility function

```typescript
import { describe, expect, it } from 'vitest';

import { cn } from '../utils';

describe('cn', () => {
  describe('basic merging', () => {
    it('merges multiple class strings', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('handles undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('handles null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar');
    });

    it('handles false values', () => {
      expect(cn('foo', false, 'bar')).toBe('foo bar');
    });
  });

  describe('tailwind conflict resolution', () => {
    it('resolves padding conflicts (last wins)', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('resolves margin conflicts', () => {
      expect(cn('m-4', 'm-8')).toBe('m-8');
    });

    it('resolves text color conflicts', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('resolves background color conflicts', () => {
      expect(cn('bg-white', 'bg-black')).toBe('bg-black');
    });

    it('preserves non-conflicting classes', () => {
      expect(cn('p-4', 'text-red-500', 'p-2')).toBe('text-red-500 p-2');
    });
  });

  describe('conditional classes', () => {
    it('handles object syntax', () => {
      expect(cn({ foo: true, bar: false })).toBe('foo');
    });

    it('handles array syntax', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('handles mixed syntax', () => {
      expect(cn('base', { active: true, disabled: false }, ['extra'])).toBe(
        'base active extra'
      );
    });
  });
});
```

## Date Formatting Testing Pattern

**When to use:** Testing date formatting functions

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatDate, formatReflectionDate } from '../utils';

describe('formatDate', () => {
  it('formats Date object correctly', () => {
    const date = new Date('2024-06-15T10:00:00Z');
    // Note: Result depends on timezone, test the format structure
    const result = formatDate(date);
    expect(result).toMatch(/June \d{1,2}, 2024/);
  });

  it('formats string date correctly', () => {
    const result = formatDate('2024-06-15');
    expect(result).toMatch(/June \d{1,2}, 2024/);
  });

  it('handles ISO string dates', () => {
    const result = formatDate('2024-06-15T10:00:00Z');
    expect(result).toMatch(/June \d{1,2}, 2024/);
  });
});

describe('formatReflectionDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ordinal suffixes', () => {
    it('uses "st" for 1st, 21st, 31st', () => {
      const date = new Date('2024-06-01T10:00:00Z');
      vi.setSystemTime(date);
      expect(formatReflectionDate(date)).toContain('1st');
    });

    it('uses "nd" for 2nd, 22nd', () => {
      const date = new Date('2024-06-02T10:00:00Z');
      vi.setSystemTime(date);
      expect(formatReflectionDate(date)).toContain('2nd');
    });

    it('uses "rd" for 3rd, 23rd', () => {
      const date = new Date('2024-06-03T10:00:00Z');
      vi.setSystemTime(date);
      expect(formatReflectionDate(date)).toContain('3rd');
    });

    it('uses "th" for 4th-20th', () => {
      const date = new Date('2024-06-11T10:00:00Z');
      vi.setSystemTime(date);
      expect(formatReflectionDate(date)).toContain('11th');
    });

    it('uses "th" for 11th, 12th, 13th (special cases)', () => {
      expect(formatReflectionDate(new Date('2024-06-11T10:00:00Z'))).toContain('11th');
      expect(formatReflectionDate(new Date('2024-06-12T10:00:00Z'))).toContain('12th');
      expect(formatReflectionDate(new Date('2024-06-13T10:00:00Z'))).toContain('13th');
    });
  });

  describe('time of day', () => {
    it('returns "Night" for hours 0-5', () => {
      const date = new Date('2024-06-15T03:00:00');
      expect(formatReflectionDate(date)).toContain('Night');
    });

    it('returns "Morning" for hours 6-11', () => {
      const date = new Date('2024-06-15T09:00:00');
      expect(formatReflectionDate(date)).toContain('Morning');
    });

    it('returns "Afternoon" for hours 12-16', () => {
      const date = new Date('2024-06-15T14:00:00');
      expect(formatReflectionDate(date)).toContain('Afternoon');
    });

    it('returns "Evening" for hours 17-20', () => {
      const date = new Date('2024-06-15T19:00:00');
      expect(formatReflectionDate(date)).toContain('Evening');
    });

    it('returns "Night" for hours 21-23', () => {
      const date = new Date('2024-06-15T22:00:00');
      expect(formatReflectionDate(date)).toContain('Night');
    });
  });
});
```

## Generic Filter Testing Pattern

**When to use:** Testing generic filter functions like `filterByDateRange`

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { filterByDateRange, getDateRangeFilter, DateRangeOption } from '../dateRange';

describe('filterByDateRange', () => {
  const NOW = new Date('2024-06-15T10:00:00Z');

  // Test data factory
  const createItem = (daysAgo: number) => ({
    id: `item-${daysAgo}`,
    createdAt: new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('range: all', () => {
    it('returns all items', () => {
      const items = [createItem(0), createItem(100), createItem(365)];
      expect(filterByDateRange(items, 'all')).toHaveLength(3);
    });

    it('returns empty array for empty input', () => {
      expect(filterByDateRange([], 'all')).toHaveLength(0);
    });
  });

  describe('range: 7d', () => {
    it('includes items from last 7 days', () => {
      const items = [createItem(1), createItem(6), createItem(10)];
      const result = filterByDateRange(items, '7d');
      expect(result).toHaveLength(2);
    });

    it('excludes items older than 7 days', () => {
      const items = [createItem(8), createItem(30)];
      const result = filterByDateRange(items, '7d');
      expect(result).toHaveLength(0);
    });
  });

  describe('range: 30d', () => {
    it('includes items from last 30 days', () => {
      const items = [createItem(1), createItem(15), createItem(29), createItem(35)];
      const result = filterByDateRange(items, '30d');
      expect(result).toHaveLength(3);
    });
  });

  describe('range: 90d', () => {
    it('includes items from last 90 days', () => {
      const items = [createItem(1), createItem(45), createItem(89), createItem(100)];
      const result = filterByDateRange(items, '90d');
      expect(result).toHaveLength(3);
    });
  });

  describe('date format handling', () => {
    it('handles string dates', () => {
      const items = [{ id: '1', createdAt: '2024-06-14T10:00:00Z' }];
      expect(filterByDateRange(items, '7d')).toHaveLength(1);
    });

    it('handles Date objects', () => {
      const items = [{ id: '1', createdAt: new Date('2024-06-14T10:00:00Z') }];
      expect(filterByDateRange(items, '7d')).toHaveLength(1);
    });
  });
});
```

## Testing Patterns

### Test File Naming Conventions
- Unit tests: `{module}.test.ts` (in `__tests__/` directory)
- Co-located with source when in `__tests__/` subdirectory

### Test File Structure
Follow the pattern shown above with:
- Header comment explaining what tests cover
- Organized imports (vitest first, then module imports)
- Section comments using `// ===...===` for major sections
- Subsection comments using `// ---...---` for describe blocks
- Logical grouping: success cases, edge cases, error cases

### Coverage Expectations

| Module Type | Minimum Coverage | Target Coverage |
|-------------|------------------|-----------------|
| Pure utilities | 80% | 95% |
| Type guards | 80% | 100% |
| Browser API wrappers | 80% | 90% |

## Import Order Convention

```typescript
// 1. Vitest imports
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 2. Module under test (relative import)
import { functionToTest } from '../module';

// 3. Types (if needed)
import type { SomeType } from '@/types';

// 4. Test utilities/mocks (if needed)
import { createMockData } from '@/test/mocks/data';
```

## Code Quality Standards

- No `any` types in test files (use proper type assertions)
- All tests must be independent (no shared state)
- Use descriptive test names that explain the expected behavior
- Prefer multiple small tests over single large tests
- Clean up mocks and timers in afterEach
- Use `toHaveBeenCalledWith()` for mock assertions
- Use `toBe()` for primitives, `toEqual()` for objects/arrays
