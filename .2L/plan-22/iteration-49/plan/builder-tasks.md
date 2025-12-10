# Builder Task Breakdown

## Overview

2 primary builders will work in parallel.
No splits expected - all tasks are LOW to MEDIUM complexity.

## Builder Assignment Strategy

- **Builder-1:** Pure utility functions (no external dependencies)
- **Builder-2:** API utilities and browser API wrappers

Builders work on completely isolated test files with no shared dependencies.

---

## Builder-1: Pure Utility Functions

### Scope

Test coverage for pure utility functions that have no external dependencies beyond simple libraries (clsx, tailwind-merge).

**Files to test:**
- `lib/utils.ts` - Core utilities (cn, formatDate, timeAgo, truncate, formatReflectionDate)
- `lib/utils/wordCount.ts` - Word counting utilities
- `lib/utils/dateRange.ts` - Date range filtering utilities

### Complexity Estimate

**MEDIUM**

Rationale: Multiple functions to test, date mocking required, but all are pure functions with predictable behavior.

### Success Criteria

- [ ] `lib/__tests__/utils.test.ts` created with tests for all 5 exported functions
- [ ] `lib/utils/__tests__/wordCount.test.ts` created with tests for all 3 functions
- [ ] `lib/utils/__tests__/dateRange.test.ts` created with tests for all 2 functions + constant
- [ ] All tests pass
- [ ] Coverage >= 80% for each file
- [ ] No TypeScript errors

### Files to Create

1. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/__tests__/utils.test.ts`**
   - Tests for `cn()` (class merging, tailwind conflicts, conditional classes)
   - Tests for `formatDate()` (Date object, string date, locale)
   - Tests for `timeAgo()` (just now, minutes, hours, days, fallback to formatDate)
   - Tests for `truncate()` (under length, over length, exact boundary, empty)
   - Tests for `formatReflectionDate()` (ordinal suffixes, time of day)

2. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/wordCount.test.ts`**
   - Tests for `countWords()` (empty, single, multiple, whitespace handling)
   - Tests for `formatWordCount()` (0, 1, plural)
   - Tests for `getWordCountState()` (low, mid, high thresholds)

3. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/dateRange.test.ts`**
   - Tests for `getDateRangeFilter()` (all, 7d, 30d, 90d)
   - Tests for `filterByDateRange()` (each range, empty array, date formats)
   - Verification of `DATE_RANGE_OPTIONS` constant structure

### Dependencies

**Depends on:** Nothing (can start immediately)
**Blocks:** Nothing

### Implementation Notes

1. **Create `lib/__tests__/` directory** - This directory does not exist yet

2. **Date mocking is critical** for `timeAgo`, `formatReflectionDate`, `getDateRangeFilter`, and `filterByDateRange`:
   ```typescript
   beforeEach(() => {
     vi.useFakeTimers();
     vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
   });
   afterEach(() => {
     vi.useRealTimers();
   });
   ```

3. **For `formatDate` and `formatReflectionDate`**: Be aware of timezone differences. Use pattern matching for date components rather than exact string matching:
   ```typescript
   expect(formatDate(date)).toMatch(/June \d{1,2}, 2024/);
   ```

4. **For `cn()` Tailwind conflicts**: Test real Tailwind class conflicts like:
   - `p-4 p-2` -> `p-2`
   - `text-red-500 text-blue-500` -> `text-blue-500`
   - `bg-white bg-black` -> `bg-black`

5. **For `getWordCountState`**: Understand the calculation:
   - `estimatedMaxWords = maxChars / 5`
   - `percentage = count / estimatedMaxWords`
   - `low`: 0-50%, `mid`: 50-90%, `high`: 90%+

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Date Mocking Pattern** for all date-related tests
- Use **Pure Function Testing Pattern** for wordCount tests
- Use **Tailwind Class Merge Testing Pattern** for cn() tests
- Use **Date Formatting Testing Pattern** for formatDate/formatReflectionDate

### Testing Requirements

- Unit tests for all exported functions
- Edge case coverage (empty strings, boundary values)
- Coverage target: 80%+ per file

### Estimated Tests

| File | Estimated Tests |
|------|-----------------|
| `utils.test.ts` | ~25 tests |
| `wordCount.test.ts` | ~12 tests |
| `dateRange.test.ts` | ~15 tests |
| **Total** | ~52 tests |

---

## Builder-2: API Utilities (Type Guards & Haptics)

### Scope

Test coverage for Anthropic type guards and browser haptic feedback utilities.

**Files to test:**
- `lib/anthropic/type-guards.ts` - Anthropic SDK content block type guards
- `lib/utils/haptics.ts` - Haptic feedback utilities

### Complexity Estimate

**MEDIUM**

Rationale: Requires mocking browser navigator API for haptics, and creating mock Anthropic content blocks for type guards.

### Success Criteria

- [ ] `lib/anthropic/__tests__/type-guards.test.ts` created with tests for all 6 functions
- [ ] `lib/utils/__tests__/haptics.test.ts` created with tests for both functions
- [ ] All tests pass
- [ ] Coverage >= 80% for each file
- [ ] No TypeScript errors

### Files to Create

1. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/anthropic/__tests__/type-guards.test.ts`**
   - Tests for `isTextBlock()` (true for text, false for others)
   - Tests for `isThinkingBlock()` (true for thinking, false for others)
   - Tests for `isToolUseBlock()` (true for tool_use, false for others)
   - Tests for `isToolResultBlock()` (true for tool_result, false for others)
   - Tests for `extractText()` (single block, multiple blocks, no text blocks)
   - Tests for `extractThinking()` (present, absent, mixed content)

2. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/haptics.test.ts`**
   - Tests for `haptic()` (each style, default parameter, vibrate not available, vibrate throws)
   - Tests for `isHapticSupported()` (navigator present, navigator absent, vibrate missing)

### Dependencies

**Depends on:** Nothing (can start immediately)
**Blocks:** Nothing

### Implementation Notes

1. **Create `lib/anthropic/__tests__/` directory** - This directory does not exist yet

2. **For type-guards tests**: Create mock content blocks that match Anthropic SDK structure:
   ```typescript
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

   const createToolResultBlock = (toolUseId: string, content: string) => ({
     type: 'tool_result' as const,
     tool_use_id: toolUseId,
     content,
   });
   ```

3. **For extractText/extractThinking**: Create a mock Message object:
   ```typescript
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
   ```

4. **For haptics tests**: Use Object.defineProperty to mock navigator:
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
   ```

5. **Test haptic durations** from HAPTIC_DURATIONS constant:
   - `light`: 10
   - `medium`: 25
   - `heavy`: 50
   - `success`: [15, 50, 30]
   - `warning`: [30, 30, 30]

6. **Test SSR scenario** (navigator undefined) for haptics

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Type Guard Testing Pattern** for type-guards.ts
- Use **Browser API Mocking Pattern** for haptics.ts

### Testing Requirements

- Unit tests for all exported functions
- Edge case coverage (missing content blocks, navigator unavailable)
- Coverage target: 80%+ per file

### Estimated Tests

| File | Estimated Tests |
|------|-----------------|
| `type-guards.test.ts` | ~20 tests |
| `haptics.test.ts` | ~12 tests |
| **Total** | ~32 tests |

---

## Builder Execution Order

### Parallel Group 1 (No dependencies - can run simultaneously)

- **Builder-1:** Pure utility functions (utils.ts, wordCount.ts, dateRange.ts)
- **Builder-2:** API utilities (type-guards.ts, haptics.ts)

### Integration Notes

- No shared files between builders
- No conflicts expected
- Each builder creates independent test files in separate directories
- Tests can run in parallel via Vitest

### Verification

After both builders complete:
1. Run `npm run test` to verify all tests pass
2. Run `npm run test:coverage` to verify coverage targets met
3. Run `npx tsc --noEmit` to verify no type errors

---

## Summary

| Builder | Files | Estimated Tests | Complexity |
|---------|-------|-----------------|------------|
| Builder-1 | 3 test files | ~52 tests | MEDIUM |
| Builder-2 | 2 test files | ~32 tests | MEDIUM |
| **Total** | **5 test files** | **~84 tests** | - |

**Expected Deliverables:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/__tests__/utils.test.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/wordCount.test.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/dateRange.test.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/anthropic/__tests__/type-guards.test.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/haptics.test.ts`
