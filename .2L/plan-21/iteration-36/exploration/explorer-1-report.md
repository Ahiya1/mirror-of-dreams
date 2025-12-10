# Explorer 1 Report: Query Parallelization Analysis

## Executive Summary

The `buildClarifyContext()` function in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts` contains 5 sequential database queries that can all run in parallel using `Promise.all()`. This optimization will reduce context build time from approximately 250-500ms to 50-100ms, a 70-80% improvement. All queries are completely independent with no data dependencies between them.

## Discoveries

### Current Query Architecture

The function executes 5 sequential database queries between lines 37-136:

| Query | Table | Line Numbers | Fields Selected | Filters Applied |
|-------|-------|--------------|-----------------|-----------------|
| 1. User Data | `users` | 37-41 | name, tier, total_reflections, total_clarify_sessions | eq('id', userId) |
| 2. Active Dreams | `dreams` | 55-61 | id, title, description, status, category | eq('user_id', userId), eq('status', 'active') |
| 3. Patterns | `clarify_patterns` | 74-80 | * | eq('user_id', userId), gte('strength', 3) |
| 4. Recent Sessions | `clarify_sessions` | 100-107 | id, title, created_at, message_count | eq('user_id', userId), neq('id', currentSessionId), eq('status', 'active') |
| 5. Reflections | `reflections` | 120-125 | id, tone, created_at | eq('user_id', userId) |

### Query Independence Analysis

All 5 queries are **completely independent**:

1. **User Data (Query 1):** Only needs `userId` parameter - no dependencies
2. **Active Dreams (Query 2):** Only needs `userId` parameter - no dependencies
3. **Patterns (Query 3):** Only needs `userId` parameter - no dependencies
4. **Recent Sessions (Query 4):** Needs `userId` and `currentSessionId` (both input parameters) - no dependencies
5. **Reflections (Query 5):** Only needs `userId` parameter - no dependencies

**Key Finding:** None of these queries depend on the result of another query. They can all execute simultaneously.

### Current Sequential Timing

```
Time    Operation
0ms     Start
50ms    Query 1: User data complete
100ms   Query 2: Dreams complete
150ms   Query 3: Patterns complete
200ms   Query 4: Sessions complete
250ms   Query 5: Reflections complete
250ms+  Section assembly begins
```

Estimated total: 250-500ms depending on network latency and database load.

### Result Processing Pattern

Each query result is processed independently (lines 43-136):
- Query results are checked for existence (`if (data)` or `if (data && data.length > 0)`)
- Context sections are constructed from each result
- Sections are pushed to the `sections[]` array with priority and token count
- No query result is used to construct another query

## Patterns Identified

### Pattern 1: Sequential Await Anti-Pattern

**Description:** The code uses sequential `await` statements for independent async operations.

**Current Code (Lines 37-125):**
```typescript
// Query 1: User
const { data: user } = await supabase.from('users').select(...)...;

// Query 2: Dreams (awaits after Query 1 completes)
const { data: dreams } = await supabase.from('dreams').select(...)...;

// Query 3: Patterns (awaits after Query 2 completes)
const { data: patterns } = await supabase.from('clarify_patterns').select(...)...;

// ... and so on
```

**Recommendation:** Refactor to parallel execution pattern.

### Pattern 2: Existing Parallel Pattern in Codebase

**Description:** The codebase has established patterns for similar optimizations.

**Example from master-explorer-2-report.md:**
```typescript
const [userResult, dreamsResult, patternsResult, sessionsResult, reflectionsResult] =
  await Promise.all([
    supabase.from('users').select('...'),
    supabase.from('dreams').select('...'),
    supabase.from('clarify_patterns').select('...'),
    supabase.from('clarify_sessions').select('...'),
    supabase.from('reflections').select('...'),
  ]);
```

**Use Case:** When multiple async operations have no data dependencies.

**Recommendation:** Apply this pattern to `buildClarifyContext()`.

### Pattern 3: Error Handling Strategy

**Description:** Current code handles query errors gracefully by skipping failed sections.

**Current Pattern:**
```typescript
const { data: user } = await supabase...;
if (user) {
  // Process only if successful
}
```

**Recommendation:** Maintain this pattern with `Promise.all()` - if one query fails, the entire call fails. However, for graceful degradation, consider `Promise.allSettled()` which would allow partial results.

## Complexity Assessment

### Low Complexity Areas

- **Query 1 (User Data):** Simple single-row fetch, minimal transformation
- **Query 5 (Reflections):** Simple aggregation (count + unique tones)
- **Section Assembly (Lines 138-161):** Pure JavaScript, no async operations

### Medium Complexity Areas

- **Query 2 (Active Dreams):** Array mapping with string truncation
- **Query 3 (Patterns):** Array mapping with type label lookup
- **Query 4 (Recent Sessions):** Array mapping with formatting

### Refactoring Complexity: LOW

The refactoring is straightforward because:
1. All queries are structurally similar
2. Result processing is isolated per query
3. No cross-query dependencies exist
4. Existing code structure supports the change

## Technology Recommendations

### Primary Approach: Promise.all()

**Rationale:**
- All 5 queries are independent
- `Promise.all()` fails fast if any query fails (maintains current error behavior)
- Reduces latency by 70-80%
- No new dependencies required

### Alternative: Promise.allSettled()

**Use Case:** If graceful degradation is preferred over fail-fast.

**Trade-off:**
- Pro: Partial context can be built even if one query fails
- Con: More complex error handling code
- Con: Context might be missing critical data (e.g., user info)

**Recommendation:** Start with `Promise.all()` since the current code already handles missing data gracefully after individual queries.

### Performance Logging

**Approach:** Use existing `dbLogger` from `@/server/lib/logger`:

```typescript
import { dbLogger } from '@/server/lib/logger';

const start = performance.now();
// ... parallel queries ...
const duration = performance.now() - start;

dbLogger.info({
  operation: 'clarify.buildContext',
  userId,
  sessionId: currentSessionId,
  duration: Math.round(duration),
  sectionsBuilt: sections.length,
}, 'Context build complete');
```

## Integration Points

### Internal Integrations

1. **Supabase Client:** Already imported at line 6 - no changes needed
2. **Logger:** Import `dbLogger` from `@/server/lib/logger`
3. **Constants:** Already imported correctly at line 5

### Consumers of buildClarifyContext()

Two locations call this function:

1. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts`** (Line 215)
   - Used in SSE streaming endpoint
   - Called once per message

2. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`** (Lines 282, 504)
   - Used in `createSession` mutation
   - Used in `sendMessage` mutation

**Impact:** No signature changes required - only internal implementation changes.

## Risks & Challenges

### Technical Risks

1. **Database Connection Pooling**
   - Risk: Parallel queries might hit connection limits
   - Impact: LOW - Supabase handles pooling internally
   - Mitigation: Monitor for connection errors in production logs

2. **Error Propagation**
   - Risk: One failed query fails entire context build
   - Impact: MEDIUM - Could break Clarify for user if single table has issues
   - Mitigation: Either accept fail-fast (current behavior) or use `Promise.allSettled()`

### Complexity Risks

1. **Test Updates**
   - Risk: Existing tests may assume sequential execution
   - Impact: LOW - No existing tests for `buildClarifyContext()` found
   - Mitigation: Add new tests for parallel behavior

## Recommendations for Planner

### 1. Implement Promise.all() Parallelization

**Priority:** HIGH
**Effort:** 1-2 hours
**Impact:** 70-80% latency reduction

Refactor lines 37-136 to execute all 5 queries in parallel:

```typescript
// Lines 33-36 unchanged
const budget = CLARIFY_CONTEXT_LIMITS.maxContextTokens;
const sections: ContextSection[] = [];

// NEW: Parallel query execution
const start = performance.now();

const [
  { data: user },
  { data: dreams },
  { data: patterns },
  { data: recentSessions },
  { data: reflections },
] = await Promise.all([
  // Query 1: User (lines 37-41)
  supabase
    .from('users')
    .select('name, tier, total_reflections, total_clarify_sessions')
    .eq('id', userId)
    .single(),
    
  // Query 2: Dreams (lines 55-61)
  supabase
    .from('dreams')
    .select('id, title, description, status, category')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxDreams),
    
  // Query 3: Patterns (lines 74-80)
  supabase
    .from('clarify_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('strength', PATTERN_CONSOLIDATION.minStrengthThreshold)
    .order('strength', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxPatterns),
    
  // Query 4: Sessions (lines 100-107)
  supabase
    .from('clarify_sessions')
    .select('id, title, created_at, message_count')
    .eq('user_id', userId)
    .neq('id', currentSessionId)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxCrossSessions),
    
  // Query 5: Reflections (lines 120-125)
  supabase
    .from('reflections')
    .select('id, tone, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxReflections),
]);

const queryDuration = performance.now() - start;
```

### 2. Add Performance Timing Logging

**Priority:** HIGH
**Effort:** 30 minutes

Add import at top of file:
```typescript
import { dbLogger } from '@/server/lib/logger';
```

Add logging at end of function (before return):
```typescript
dbLogger.info({
  operation: 'clarify.buildContext',
  userId,
  sessionId: currentSessionId,
  queryDurationMs: Math.round(queryDuration),
  totalDurationMs: Math.round(performance.now() - start),
  sectionsIncluded: includedSections.length,
  tokensUsed: usedTokens,
}, 'Clarify context built');
```

### 3. Maintain Section Processing Logic

**Priority:** HIGH

Keep existing section processing code (lines 43-136) intact, just ensure it processes the destructured results from Promise.all():

```typescript
// Section 1: User context (lines 43-52)
if (user) {
  // ... existing code unchanged
}

// Section 2: Dreams context (lines 63-71)
if (dreams && dreams.length > 0) {
  // ... existing code unchanged
}

// ... etc for each section
```

### 4. Add Unit Tests

**Priority:** MEDIUM
**Effort:** 1-2 hours

Create test file at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/__tests__/context-builder.test.ts`:

Test cases:
1. Verify all 5 queries execute
2. Verify context is built correctly with all data
3. Verify partial data handling (some queries return empty)
4. Verify timing is reasonable (< 200ms with mocked queries)
5. Verify error handling when a query fails

## Resource Map

### Critical Files to Modify

| File Path | Changes Needed |
|-----------|----------------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts` | Refactor to Promise.all(), add logging |

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/__tests__/context-builder.test.ts` | Unit tests for context builder |

### Key Dependencies

| Dependency | Purpose | Already Available |
|------------|---------|-------------------|
| `@/server/lib/supabase` | Database client | Yes (line 6) |
| `@/server/lib/logger` | Performance logging | Yes (need to import) |
| `@/lib/utils/constants` | Config values | Yes (line 5) |

### Testing Infrastructure

| Tool | Purpose | Status |
|------|---------|--------|
| Vitest | Unit testing | Available |
| Mock Supabase | Query mocking | Need to set up |

## Questions for Planner

1. **Error Handling Strategy:** Should we use `Promise.all()` (fail-fast, current behavior) or `Promise.allSettled()` (graceful degradation with partial context)?

2. **Performance Baseline:** Should we capture performance metrics in production BEFORE the change to establish a baseline?

3. **Test Priority:** Should the builder also create integration tests with a real (test) database, or are mocked unit tests sufficient?

4. **Logging Verbosity:** Should performance logging be:
   - Always on (info level)
   - Debug level only
   - Conditional (only log if duration > threshold)

## Code Changes Summary

### File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts`

**Line 6 - Add import:**
```typescript
import { dbLogger } from '@/server/lib/logger';
```

**Lines 33-136 - Replace sequential queries with Promise.all():**
- Move all 5 queries into a single Promise.all() call
- Destructure results
- Add timing measurement
- Keep section processing logic unchanged

**Before line 173 - Add logging:**
```typescript
dbLogger.info({
  operation: 'clarify.buildContext',
  userId,
  sessionId: currentSessionId,
  durationMs: Math.round(performance.now() - startTime),
  sectionsIncluded: includedSections.length,
  tokensUsed: usedTokens,
}, 'Context built');
```

---

*Exploration completed: 2025-12-10*
*Iteration: 36 | Plan: plan-21*
*Focus: Query Parallelization Analysis for buildClarifyContext()*
