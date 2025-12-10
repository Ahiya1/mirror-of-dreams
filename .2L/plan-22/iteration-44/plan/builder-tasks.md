# Builder Task Breakdown

## Overview

2 primary builders will work in parallel:
- **Builder-1**: Evolution router tests (46 test cases) - FOUNDATION
- **Builder-2**: Visualizations router tests (25 test cases)

Builder-1 creates shared fixture files that Builder-2 will import.

---

## Builder-1: Evolution Router Tests

### Scope

Create comprehensive integration tests for the Evolution router (`server/trpc/routers/evolution.ts`). This includes all 5 procedures:
- `generateDreamEvolution` (18 tests)
- `generateCrossDreamEvolution` (12 tests)
- `list` (6 tests)
- `get` (4 tests)
- `checkEligibility` (6 tests)

Additionally, create fixture files that will be shared with Builder-2.

### Complexity Estimate

**HIGH**

This is a high-complexity task due to:
- 46 test cases to implement
- RPC mocking complexity for limit checks
- Extended thinking response handling
- Creates shared fixtures for both builders

### Success Criteria

- [ ] All 46 test cases implemented and passing
- [ ] `test/fixtures/evolution.ts` created with report factories
- [ ] `test/fixtures/visualizations.ts` created with visualization factories
- [ ] RPC mock patterns for `check_evolution_limit` and `increment_usage_counter` working
- [ ] Extended thinking path tested for unlimited tier
- [ ] Coverage target: 85%+ for evolution.ts

### Files to Create

1. `test/fixtures/evolution.ts` - Evolution report fixture factories
2. `test/fixtures/visualizations.ts` - Visualization fixture factories (for Builder-2)
3. `test/integration/evolution/evolution.test.ts` - Main test file

### Dependencies

**Depends on:** None (foundation builder)
**Blocks:** Builder-2 depends on fixture files

### Implementation Notes

#### Phase 1: Create Fixture Files (15 min)

Create `test/fixtures/evolution.ts`:
```typescript
export const createMockEvolutionReport = (overrides = {}) => ({...});
export const createMockCrossDreamReport = (overrides = {}) => ({...});
```

Create `test/fixtures/visualizations.ts`:
```typescript
export const createMockVisualization = (overrides = {}) => ({...});
export const createMockCrossDreamVisualization = (overrides = {}) => ({...});
```

#### Phase 2: generateDreamEvolution Tests (30 min)

18 test cases covering:
- **Success (6)**: Min reflections, extended thinking, temporal distribution, dream title, cost calculation, usage logging
- **Authorization (5)**: Unauthenticated, demo user, below threshold, at limit, wrong ownership
- **Error (4)**: API error, no text block, DB insert error, invalid UUID
- **Edge (3)**: API retry, empty fields, max reflections

Key test patterns:
```typescript
// Success with minimum reflections
mockQueries({
  dreams: { data: mockDream, error: null },
  reflections: { data: createMockReflections(4, userId), error: null },
  evolution_reports: { data: createMockEvolutionReport(), error: null },
  api_usage_log: { data: null, error: null },
});

// RPC mock for limit check
supabase.rpc.mockImplementation((funcName) => {
  if (funcName === 'check_evolution_limit') {
    return Promise.resolve({ data: true, error: null });
  }
  return Promise.resolve({ data: null, error: null });
});
```

#### Phase 3: generateCrossDreamEvolution Tests (25 min)

12 test cases covering:
- **Success (4)**: Min reflections (12), extended thinking, dream grouping, metadata
- **Authorization (4)**: Free tier rejection, below threshold, at limit, unlimited allowed
- **Error (2)**: API error, no reflections
- **Edge (2)**: Single dream with many reflections, mixed dream_id

Key differences from dream-specific:
- No input required (no dreamId)
- Requires 12 reflections instead of 4
- Free tier explicitly blocked
- Response includes `dreamsAnalyzed` count

#### Phase 4: Query Tests (15 min)

**list (6 tests)**:
- Pagination (page/limit/total)
- Filter by dreamId
- Empty list handling
- Include dream title in response
- Order by created_at desc
- Database error handling

**get (4 tests)**:
- Get existing report with dream info
- Get cross-dream report (null dream_id)
- Reject other user's report
- Reject non-existent ID

#### Phase 5: checkEligibility Tests (15 min)

6 test cases:
- Free tier: not eligible
- Pro with dream-specific eligible (4+ on one dream)
- Pro with cross-dream eligible (12+ total)
- Pro below both thresholds
- Unlimited tier eligible
- Empty state (0 reflections)

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use `createTestCaller()` pattern from setup.ts
- Use test ID format `TC-{PREFIX}-{NUMBER}`
- Mock Anthropic responses with correct structure
- Use `mockQueries()` for table responses
- Mock RPC functions for limit checking

### Testing Requirements

- Integration tests covering all code paths
- Test extended thinking token extraction
- Test temporal distribution integration
- Coverage target: 85%+

### Estimated Time

Total: ~1.5 hours
- Fixtures: 15 min
- generateDreamEvolution: 30 min
- generateCrossDreamEvolution: 25 min
- Query tests: 15 min
- checkEligibility: 15 min
- Cleanup/validation: 10 min

---

## Builder-2: Visualizations Router Tests

### Scope

Create comprehensive integration tests for the Visualizations router (`server/trpc/routers/visualizations.ts`). This includes all 3 procedures:
- `generate` (16 tests)
- `list` (5 tests)
- `get` (4 tests)

### Complexity Estimate

**MEDIUM**

This is a medium-complexity task because:
- 25 test cases (fewer than Builder-1)
- Similar patterns to evolution tests
- Uses fixtures created by Builder-1
- Only 3 procedures to test

### Success Criteria

- [ ] All 25 test cases implemented and passing
- [ ] All 3 visualization styles tested (achievement, spiral, synthesis)
- [ ] Cross-dream visualization tier restriction tested
- [ ] RPC mock patterns for `check_visualization_limit` working
- [ ] Coverage target: 85%+ for visualizations.ts

### Files to Create

1. `test/integration/visualizations/visualizations.test.ts` - Main test file

### Dependencies

**Depends on:** Builder-1 (for `test/fixtures/visualizations.ts`)
**Blocks:** None

### Implementation Notes

#### Phase 1: Test Setup (10 min)

Set up test file structure:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestCaller, anthropicMock } from '../setup';
import { freeTierUser, proTierUser, unlimitedTierUser } from '@/test/fixtures/users';
import { createMockReflections } from '@/test/fixtures/reflections';
import { createMockVisualization, createMockCrossDreamVisualization } from '@/test/fixtures/visualizations';

const TEST_DREAM_ID = '12345678-1234-1234-1234-123456789012';
const TEST_VIZ_ID = 'abcdef12-3456-7890-abcd-ef1234567890';
```

#### Phase 2: generate Tests (35 min)

16 test cases covering:
- **Success (6)**:
  - TC-VG-01: Dream-specific with achievement style
  - TC-VG-02: Dream-specific with spiral style
  - TC-VG-03: Dream-specific with synthesis style
  - TC-VG-04: Cross-dream (no dreamId, pro tier)
  - TC-VG-05: Extended thinking for unlimited tier
  - TC-VG-06: Temporal distribution applied

- **Authorization (5)**:
  - TC-VG-07: Reject unauthenticated
  - TC-VG-08: Reject cross-dream for free tier
  - TC-VG-09: Reject below dream-specific threshold (< 4)
  - TC-VG-10: Reject below cross-dream threshold (< 12)
  - TC-VG-11: Reject at monthly limit

- **Error (3)**:
  - TC-VG-12: Handle Anthropic API error
  - TC-VG-13: Handle empty narrative response
  - TC-VG-14: Reject invalid style enum

- **Edge (2)**:
  - TC-VG-15: Dream not found
  - TC-VG-16: Retry on transient 529 error

Key visualization-specific patterns:
```typescript
// Style-specific test
const result = await caller.visualizations.generate({
  dreamId: TEST_DREAM_ID,
  style: 'spiral', // or 'achievement', 'synthesis'
});

// Cross-dream (no dreamId)
const result = await caller.visualizations.generate({
  style: 'synthesis',
  // No dreamId = cross-dream
});

// RPC mock for visualization limit
supabase.rpc.mockImplementation((funcName) => {
  if (funcName === 'check_visualization_limit') {
    return Promise.resolve({ data: true, error: null });
  }
  return Promise.resolve({ data: null, error: null });
});
```

#### Phase 3: list Tests (10 min)

5 test cases:
- TC-VL-01: List with pagination (hasMore field)
- TC-VL-02: Filter by dreamId
- TC-VL-03: Include dream title in response
- TC-VL-04: Empty list handling
- TC-VL-05: Database error handling

Key differences from evolution.list:
- Response has `items` array (not `reports`)
- Includes `hasMore` boolean field

#### Phase 4: get Tests (10 min)

4 test cases:
- TC-VGet-01: Get existing visualization with dream info
- TC-VGet-02: Get cross-dream visualization (null dream_id)
- TC-VGet-03: Reject other user's visualization
- TC-VGet-04: Reject non-existent ID

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use same RPC mock pattern as evolution tests
- Test all 3 visualization styles explicitly
- Verify narrative text extraction from response
- Test the `hasMore` pagination field

### Testing Requirements

- Integration tests covering all 3 procedures
- Test all 3 visualization styles (achievement, spiral, synthesis)
- Test tier restrictions for cross-dream
- Coverage target: 85%+

### Important Note on Thinking Tokens

The visualizations router uses a different pattern for thinking tokens:
```typescript
// In visualizations.ts (line 212):
const thinkingTokens = thinkingBlock?.thinking?.length ?? 0;
```

This differs from evolution which uses `response.usage.thinking_tokens`. Tests should verify behavior with extended thinking enabled.

### Estimated Time

Total: ~1 hour
- Setup: 10 min
- generate tests: 35 min
- list tests: 10 min
- get tests: 10 min
- Cleanup/validation: 5 min

---

## Builder Execution Order

### Parallel Group 1 (Start Immediately)

- **Builder-1**: Evolution router tests
  - Creates fixtures first, then tests
  - Signals when fixtures are ready

- **Builder-2**: Visualizations router tests
  - Can start setup while waiting for fixtures
  - Full testing after fixtures available

### Integration Notes

**Shared Resources:**
- `test/fixtures/evolution.ts` - Created by Builder-1
- `test/fixtures/visualizations.ts` - Created by Builder-1
- `test/integration/setup.ts` - Existing, do not modify

**No Conflicts Expected:**
- Builders work on completely separate test files
- No shared state between test suites
- Each builder can run tests independently

### Final Validation

After both builders complete:
1. Run full test suite: `npm run test`
2. Verify no test conflicts
3. Check combined coverage for evolution.ts and visualizations.ts
4. Ensure all 71 tests pass

---

## Summary Table

| Builder | Procedure | Tests | Est. Time |
|---------|-----------|-------|-----------|
| Builder-1 | generateDreamEvolution | 18 | 30 min |
| Builder-1 | generateCrossDreamEvolution | 12 | 25 min |
| Builder-1 | list | 6 | 10 min |
| Builder-1 | get | 4 | 5 min |
| Builder-1 | checkEligibility | 6 | 15 min |
| Builder-1 | Fixtures | - | 15 min |
| **Builder-1 Total** | | **46** | **~1.5 hr** |
| Builder-2 | generate | 16 | 35 min |
| Builder-2 | list | 5 | 10 min |
| Builder-2 | get | 4 | 10 min |
| Builder-2 | Setup | - | 10 min |
| **Builder-2 Total** | | **25** | **~1 hr** |
| **Grand Total** | | **71** | **~2.5 hr** |
