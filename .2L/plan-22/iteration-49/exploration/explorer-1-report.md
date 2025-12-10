# Explorer 1 Report: Library Functions Analysis for Testing

## Executive Summary

This exploration analyzed all library files in the Mirror of Dreams codebase to identify testing gaps and document requirements for Iteration 49 (Library Tests). The codebase has **24 library files** across `/lib/` and `/server/lib/` directories. Current test coverage varies significantly: some libraries like `retry.ts`, `cache.ts`, and `rate-limiter.ts` have comprehensive tests (90%+ coverage), while others like `consolidation.ts`, `haptics.ts`, `dateRange.ts`, `wordCount.ts`, and all animation/voice libraries have **zero test coverage**.

**Key Finding:** 10 library files require new tests, with `lib/clarify/consolidation.ts` and `lib/utils/` utilities being the highest priority based on the vision.md requirements.

---

## Library Inventory

### Client Libraries (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/`)

| File | Lines | Functions/Exports | Has Tests | Priority |
|------|-------|-------------------|-----------|----------|
| `clarify/context-builder.ts` | 416 | 3 functions, 5 types | YES | High |
| `clarify/consolidation.ts` | 277 | 4 functions | NO | **Critical** |
| `reflection/index.ts` | 4 | Re-exports only | N/A | Low |
| `reflection/constants.ts` | 93 | 6 exports | NO | Medium |
| `reflection/types.ts` | 60 | 7 type exports | N/A | Low |
| `utils.ts` | 85 | 6 functions | NO | **High** |
| `utils/haptics.ts` | 39 | 2 functions, 1 type | NO | **High** |
| `utils/retry.ts` | 319 | 6 functions, 1 type | YES | Low |
| `utils/dateRange.ts` | 51 | 3 functions, 1 type | NO | **High** |
| `utils/wordCount.ts` | 37 | 3 functions | NO | **High** |
| `utils/limits.ts` | 53 | 1 function | YES | Low |
| `utils/constants.ts` | 177 | 20+ constants/types | NO | Medium |
| `anthropic/index.ts` | 41 | Re-exports | N/A | Low |
| `anthropic/type-guards.ts` | 116 | 6 functions | NO | **High** |
| `anthropic/types.ts` | 85 | 9 type exports | N/A | Low |
| `animations/config.ts` | 25 | 3 exports | NO | Low |
| `animations/variants.ts` | 527 | 25+ variants | NO | Low |
| `animations/hooks.ts` | 15 | 1 function | NO | Low |
| `voice/mirror-voice.ts` | 327 | 15+ exports, 3 functions | NO | Medium |
| `trpc.ts` | 8 | 1 export | N/A | Low |

### Server Libraries (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/`)

| File | Lines | Functions/Exports | Has Tests | Priority |
|------|-------|-------------------|-----------|----------|
| `cache.ts` | 262 | 8 functions, 2 types | YES | Low |
| `config.ts` | 328 | 4 functions, 2 types | YES | Low |
| `rate-limiter.ts` | 219 | 7 exports | YES | Low |
| `temporal-distribution.ts` | 139 | 4 functions, 1 type | YES | Low |
| `logger.ts` | 55 | 5 exports | YES | Low |
| `cookies.ts` | ~50 | Functions | YES | Low |
| `cost-calculator.ts` | ~100 | Functions | YES | Low |
| `paypal.ts` | ~200 | Functions | YES | Low |
| `email.ts` | ~100 | Functions | NO | Medium |
| `api-rate-limit.ts` | ~50 | Functions | NO | Medium |
| `supabase.ts` | ~20 | 1 export | N/A | Low |
| `prompts.ts` | ~300 | Prompt templates | NO | Medium |

---

## Current Test Coverage

### Libraries WITH Tests (Good Coverage)

1. **`lib/clarify/context-builder.ts`** - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/__tests__/context-builder.test.ts`
   - 1058 lines of tests
   - Covers: `estimateTokens`, `buildClarifyContext`
   - Tests: caching, parallelization, circuit breaker, edge cases
   - **Gap:** `getUserPatterns` function not tested

2. **`lib/utils/retry.ts`** - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts`
   - 869 lines of tests
   - Covers: `withRetry`, `withAIRetry`, `isRetryableError`, `getErrorStatus`, `getErrorMessage`
   - Excellent coverage of all functions and edge cases

3. **`lib/utils/limits.ts`** - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/limits.test.ts`
   - 444 lines of tests
   - Covers: `checkReflectionLimits` for all tiers
   - Comprehensive boundary and edge case testing

4. **`server/lib/cache.ts`** - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/cache.test.ts`
   - 962 lines of tests
   - Covers: All CRUD operations, circuit breaker, TTL, concurrent operations
   - Excellent fail-open behavior tests

5. **`server/lib/rate-limiter.ts`** - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/rate-limiter.test.ts`
   - 813 lines of tests
   - Covers: `checkRateLimit`, circuit breaker, half-open recovery
   - Comprehensive fail-closed behavior tests

6. **`server/lib/temporal-distribution.ts`** - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/temporal-distribution.test.ts`
   - 494 lines of tests
   - Covers: `selectTemporalContext`, `getContextLimit`, `meetsEvolutionThreshold`
   - Good integration tests

7. **`server/lib/config.ts`**, **`cookies.ts`**, **`cost-calculator.ts`**, **`logger.ts`**, **`paypal.ts`** - All have tests

---

## Priority Libraries for Testing

### Priority 1: Critical (Must Test - From Vision.md)

#### 1. `lib/clarify/consolidation.ts` (NO TESTS)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/consolidation.ts`

**Exports:**
```typescript
export async function extractPatternsFromSession(
  sessionId: string,
  messages: Array<{ id: string; content: string; role: string }>
): Promise<ExtractedPattern[]>

export async function consolidateUserPatterns(userId: string): Promise<ConsolidationResult>

export async function markMessagesConsolidated(messageIds: string[]): Promise<boolean>
```

**Dependencies:**
- `@anthropic-ai/sdk` - Anthropic client for pattern extraction
- `@/types/pattern` - Pattern types
- `@/lib/utils/constants` - PATTERN_CONSOLIDATION constants
- `@/lib/utils/retry` - withAIRetry
- `@/server/lib/logger` - aiLogger, dbLogger
- `@/server/lib/supabase` - Database client

**Test Cases Required:**
1. `extractPatternsFromSession`:
   - Returns empty array when messages < minMessagesForConsolidation (5)
   - Filters to user messages only (ignores assistant messages)
   - Calls Anthropic Haiku with correct prompt
   - Parses valid JSON response into ExtractedPattern[]
   - Handles invalid JSON gracefully
   - Handles non-array response
   - Validates pattern types (recurring_theme, tension, potential_dream, identity_signal)
   - Validates strength range (1-10)
   - Truncates content to 500 chars
   - Handles Anthropic API errors with retry

2. `consolidateUserPatterns`:
   - Returns empty result when no sessions exist
   - Returns empty result when no unconsolidated messages
   - Groups messages by session correctly
   - Inserts patterns into database
   - Marks messages as consolidated after processing
   - Handles partial failures (pattern insert failure)
   - Handles database errors gracefully
   - Returns correct ConsolidationResult

3. `markMessagesConsolidated`:
   - Returns true when messageIds is empty
   - Updates database correctly
   - Returns false on database error

**Mocking Requirements:**
- Mock Anthropic client (`@anthropic-ai/sdk`)
- Mock Supabase client
- Mock logger (aiLogger, dbLogger)
- Mock withAIRetry (or use real with mocked Anthropic)

---

### Priority 2: High (Vision.md Utilities)

#### 2. `lib/utils.ts` (NO TESTS)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils.ts`

**Exports:**
```typescript
export function cn(...inputs: ClassValue[]): string
export function formatDate(date: string | Date): string
export function timeAgo(date: string | Date): string
export function truncate(text: string, length: number): string
export function formatReflectionDate(date: string | Date): string
```

**Dependencies:**
- `clsx` - Class name merging
- `tailwind-merge` - Tailwind class merging

**Test Cases Required:**
1. `cn`:
   - Merges multiple class strings
   - Handles Tailwind conflicts (e.g., `p-4 p-2` -> `p-2`)
   - Handles conditional classes
   - Handles arrays and objects

2. `formatDate`:
   - Formats string date correctly
   - Formats Date object correctly
   - Uses correct locale (en-US)
   - Handles invalid dates

3. `timeAgo`:
   - Returns "just now" for < 60 seconds
   - Returns "X minutes ago" for < 1 hour
   - Returns "X hours ago" for < 1 day
   - Returns "X days ago" for < 30 days
   - Falls back to formatDate for > 30 days

4. `truncate`:
   - Returns original text if <= length
   - Truncates and adds "..." if > length
   - Handles empty string
   - Handles exact boundary length

5. `formatReflectionDate`:
   - Returns correct ordinal suffix (1st, 2nd, 3rd, 4th, 11th, 12th, 13th)
   - Returns correct time of day (Morning, Afternoon, Evening, Night)
   - Formats full date correctly

**Mocking Requirements:**
- Mock Date.now() for timeAgo tests

---

#### 3. `lib/utils/haptics.ts` (NO TESTS)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/haptics.ts`

**Exports:**
```typescript
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning'
export function haptic(style: HapticStyle = 'light'): void
export function isHapticSupported(): boolean
```

**Test Cases Required:**
1. `haptic`:
   - Calls navigator.vibrate with correct duration for each style
   - Handles pattern arrays (success, warning)
   - Fails silently when navigator.vibrate not available
   - Fails silently when navigator.vibrate throws

2. `isHapticSupported`:
   - Returns true when navigator.vibrate exists
   - Returns false when navigator is undefined
   - Returns false when vibrate is not in navigator

**Mocking Requirements:**
- Mock `navigator.vibrate`
- Mock `navigator` object entirely for SSR tests

---

#### 4. `lib/utils/dateRange.ts` (NO TESTS)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/dateRange.ts`

**Exports:**
```typescript
export type DateRangeOption = 'all' | '7d' | '30d' | '90d'
export const DATE_RANGE_OPTIONS: readonly [...]
export function getDateRangeFilter(range: DateRangeOption): Date | undefined
export function filterByDateRange<T extends { createdAt: string | Date }>(items: T[], range: DateRangeOption): T[]
```

**Test Cases Required:**
1. `getDateRangeFilter`:
   - Returns undefined for 'all'
   - Returns Date 7 days ago for '7d'
   - Returns Date 30 days ago for '30d'
   - Returns Date 90 days ago for '90d'

2. `filterByDateRange`:
   - Returns all items for 'all'
   - Filters items older than 7 days for '7d'
   - Filters items older than 30 days for '30d'
   - Filters items older than 90 days for '90d'
   - Handles empty array
   - Handles string dates
   - Handles Date objects

**Mocking Requirements:**
- Mock Date.now() for deterministic tests

---

#### 5. `lib/utils/wordCount.ts` (NO TESTS)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/wordCount.ts`

**Exports:**
```typescript
export function countWords(text: string): number
export function formatWordCount(count: number): string
export function getWordCountState(count: number, maxChars: number): 'low' | 'mid' | 'high'
```

**Test Cases Required:**
1. `countWords`:
   - Returns 0 for empty string
   - Returns 0 for whitespace-only string
   - Counts single word
   - Counts multiple words
   - Handles multiple spaces between words
   - Handles line breaks
   - Handles tabs

2. `formatWordCount`:
   - Returns "Your thoughts await..." for 0
   - Returns "1 thoughtful word" for 1
   - Returns "X thoughtful words" for > 1

3. `getWordCountState`:
   - Returns 'low' for 0-50% of estimated max
   - Returns 'mid' for 50-90% of estimated max
   - Returns 'high' for 90-100% of estimated max
   - Uses 5 chars/word estimation correctly

---

#### 6. `lib/anthropic/type-guards.ts` (NO TESTS)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/anthropic/type-guards.ts`

**Exports:**
```typescript
export function isTextBlock(block: ContentBlock): block is TextBlock
export function isThinkingBlock(block: ContentBlock): block is ThinkingBlock
export function isToolUseBlock(block: ContentBlock): block is ToolUseBlock
export function isToolResultBlock(block: ContentBlockParam): block is ToolResultBlockParam
export function extractText(response: Message): string
export function extractThinking(response: Message): string | null
```

**Test Cases Required:**
1. `isTextBlock`:
   - Returns true for { type: 'text', text: '...' }
   - Returns false for thinking blocks
   - Returns false for tool_use blocks

2. `isThinkingBlock`:
   - Returns true for { type: 'thinking', thinking: '...' }
   - Returns false for text blocks

3. `isToolUseBlock`:
   - Returns true for { type: 'tool_use', ... }
   - Returns false for other types

4. `isToolResultBlock`:
   - Returns true for { type: 'tool_result', ... }
   - Returns false for other types

5. `extractText`:
   - Returns text from first TextBlock
   - Returns empty string when no TextBlock exists
   - Handles multiple content blocks

6. `extractThinking`:
   - Returns thinking from first ThinkingBlock
   - Returns null when no ThinkingBlock exists

**Mocking Requirements:**
- Create mock Anthropic content blocks (no SDK mocking needed)

---

### Priority 3: Medium

#### 7. `lib/voice/mirror-voice.ts`
**Test Cases:** Helper functions only (`getTimeGreeting`, `getPersonalizedGreeting`, `getLoadingMessage`)

#### 8. `lib/utils/constants.ts`
**Test Cases:** Validate constant values, type exports

#### 9. `lib/reflection/constants.ts`
**Test Cases:** Validate QUESTIONS array, CATEGORY_EMOJI mapping

#### 10. `server/lib/prompts.ts`, `email.ts`, `api-rate-limit.ts`
**Test Cases:** Basic function tests

---

## Test Cases Required (Summary)

### New Test Files to Create

| File | Test File Path | Estimated Tests |
|------|---------------|-----------------|
| `consolidation.ts` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/__tests__/consolidation.test.ts` | ~30 tests |
| `utils.ts` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/__tests__/utils.test.ts` | ~25 tests |
| `haptics.ts` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/haptics.test.ts` | ~10 tests |
| `dateRange.ts` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/dateRange.test.ts` | ~15 tests |
| `wordCount.ts` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/wordCount.test.ts` | ~15 tests |
| `type-guards.ts` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/anthropic/__tests__/type-guards.test.ts` | ~20 tests |
| `mirror-voice.ts` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/voice/__tests__/mirror-voice.test.ts` | ~10 tests |

**Total New Tests Estimated:** ~125 tests

### Existing Test Gaps to Fill

| File | Missing Coverage |
|------|-----------------|
| `context-builder.ts` | `getUserPatterns` function |

---

## Mocking Requirements

### 1. Anthropic SDK Mock
**Location:** Use existing `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`

**Required for:** `consolidation.ts`

**Mock Pattern:**
```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn()
    }
  }))
}));
```

### 2. Supabase Mock
**For:** `consolidation.ts`, `context-builder.ts`

**Mock Pattern:**
```typescript
vi.mock('@/server/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => chainableMock)
  }
}));
```

### 3. Navigator Mock (for haptics)
**Mock Pattern:**
```typescript
const mockVibrate = vi.fn();
Object.defineProperty(global, 'navigator', {
  value: { vibrate: mockVibrate },
  writable: true
});
```

### 4. Date Mock
**For:** `utils.ts`, `dateRange.ts`

**Mock Pattern:**
```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
```

### 5. Logger Mock
**Existing pattern from cache.test.ts:**
```typescript
vi.mock('@/server/lib/logger', () => ({
  aiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  dbLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));
```

---

## Recommendations for Planner

1. **Start with Pure Functions:** Begin with `utils.ts`, `wordCount.ts`, `dateRange.ts`, `type-guards.ts` as they have no external dependencies and are easiest to test.

2. **Use Existing Mock Patterns:** The codebase has excellent mock patterns in `cache.test.ts`, `rate-limiter.test.ts`, and `context-builder.test.ts`. Reuse these patterns for `consolidation.ts`.

3. **`consolidation.ts` is Complex:** This file requires mocking Anthropic SDK, Supabase, and logger. Consider splitting into 2 sub-builders:
   - Sub-builder A: `extractPatternsFromSession` tests (Anthropic mocking)
   - Sub-builder B: `consolidateUserPatterns` + `markMessagesConsolidated` tests (DB mocking)

4. **Test Factory Pattern:** Create test factories for Pattern, ExtractedPattern, ConsolidationResult similar to existing factories in `context-builder.test.ts`.

5. **Prioritization Order:**
   1. `consolidation.ts` - Critical per vision.md
   2. `type-guards.ts` - High value, simple tests
   3. `utils.ts` - Core utilities used everywhere
   4. `wordCount.ts` + `dateRange.ts` - Pure functions
   5. `haptics.ts` - Requires browser API mocking
   6. `mirror-voice.ts` - Helper functions only

---

## Resource Map

### Critical Files to Test
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/consolidation.ts` (277 lines)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils.ts` (85 lines)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/haptics.ts` (39 lines)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/dateRange.ts` (51 lines)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/wordCount.ts` (37 lines)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/anthropic/type-guards.ts` (116 lines)

### Existing Test Files for Reference
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/__tests__/context-builder.test.ts` (1058 lines)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts` (869 lines)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/cache.test.ts` (962 lines)

### Mock Files
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`

### Test Setup
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/setup.ts`

---

## Questions for Planner

1. Should animation variants (`lib/animations/variants.ts`) be tested? They are pure configuration objects with no logic.

2. Should type-only files (`lib/anthropic/types.ts`, `lib/reflection/types.ts`) have schema validation tests?

3. For `haptics.ts` - should we test actual vibration patterns or just that the API is called correctly?

4. Should `mirror-voice.ts` copy strings be tested for regression, or just the helper functions?

---

**Report Generated:** 2025-12-10
**Explorer:** Explorer-1
**Focus Area:** Library Functions Analysis for Testing
