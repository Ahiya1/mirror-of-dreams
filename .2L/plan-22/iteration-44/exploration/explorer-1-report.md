# Explorer 1 Report: Evolution and Visualizations Router Analysis

## Executive Summary

The Evolution and Visualizations routers are AI-powered tRPC endpoints that generate personalized growth reports and narrative visualizations using the Anthropic Claude API with extended thinking support. Both routers follow similar patterns: tier-based authorization, temporal distribution for context selection, Anthropic API integration with retry logic, and comprehensive usage logging. Testing requires mocking Supabase database operations, Anthropic API calls, and RPC functions for limit checking.

## Evolution Router Analysis

### File Location
`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts`

### Procedures Overview

| Procedure | Type | Input Schema | Description |
|-----------|------|--------------|-------------|
| `generateDreamEvolution` | mutation | `{ dreamId: uuid }` | Generate dream-specific evolution report (threshold: >= 4 reflections) |
| `generateCrossDreamEvolution` | mutation | (none) | Generate cross-dream evolution report (threshold: >= 12 reflections, pro+ only) |
| `list` | query | `{ page, limit, dreamId? }` | List user's evolution reports with pagination |
| `get` | query | `{ id: uuid }` | Get specific evolution report by ID |
| `checkEligibility` | query | (none) | Check if user meets evolution report eligibility requirements |

### AI Integration Pattern

```typescript
// Request configuration with optional extended thinking
const requestConfig: ExtendedMessageCreateParams = {
  model: modelId,                    // 'claude-sonnet-4-5-20250929'
  max_tokens: 4000,
  temperature: 1,
  messages: [{ role: 'user', content: prompt }],
};

// Add extended thinking for unlimited tier
if (thinkingBudget > 0) {
  requestConfig.thinking = {
    type: 'enabled',
    budget_tokens: thinkingBudget,  // 5000 for unlimited tier
  };
}

// Execute with retry wrapper
response = await withAIRetry(() => anthropic.messages.create(requestConfig), {
  operation: 'evolution.generateDreamEvolution',
});
```

### Extended Thinking Handling

Both mutations use the same pattern for extracting content:

```typescript
// Extract text and thinking using type guards
const contentBlock = response.content.find(isTextBlock);
const thinkingBlock = response.content.find(isThinkingBlock);

if (!contentBlock) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'No text response from Claude',
  });
}

const evolutionText = contentBlock.text;

// Calculate cost including thinking tokens
const costBreakdown = calculateCost({
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
  thinkingTokens: thinkingBlock
    ? ((response.usage as ExtendedUsage).thinking_tokens ?? 0)
    : 0,
});
```

### Database Operations

| Operation | Tables/RPCs | Purpose |
|-----------|-------------|---------|
| Fetch dream | `dreams.select().eq('id', dreamId).eq('user_id', userId)` | Validate dream ownership |
| Fetch reflections | `reflections.select().eq('dream_id', dreamId).eq('user_id', userId)` | Get reflections for analysis |
| Cross-dream reflections | `reflections.select('*, dreams!inner(title, category)')` | Get all user reflections with dream info |
| Check limit | `supabase.rpc('check_evolution_limit', { p_user_id, p_user_tier, p_report_type })` | Verify monthly limit |
| Insert report | `evolution_reports.insert()` | Store generated report |
| Log usage | `api_usage_log.insert()` | Track API costs |
| Update counter | `supabase.rpc('increment_usage_counter', { p_user_id, p_month, p_counter_name })` | Increment usage counters |

### Authorization Patterns

1. **Authentication**: Uses `protectedProcedure` middleware (requires authenticated user)
2. **Tier Restrictions**:
   - `generateDreamEvolution`: Available to all tiers (but evolution reports feature gated by eligibility check)
   - `generateCrossDreamEvolution`: Pro+ only (explicit check: `userTier === 'free'` throws FORBIDDEN)
3. **Monthly Limits**: RPC function `check_evolution_limit` enforces per-tier monthly caps
4. **Ownership**: All queries filter by `user_id` to ensure data isolation

### Input Validation Schemas

```typescript
const generateDreamEvolutionSchema = z.object({
  dreamId: z.string().uuid(),
});

const listEvolutionReportsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  dreamId: z.string().uuid().optional(),
});

const getEvolutionReportSchema = z.object({
  id: z.string().uuid(),
});
```

## Visualizations Router Analysis

### File Location
`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/visualizations.ts`

### Procedures Overview

| Procedure | Type | Input Schema | Description |
|-----------|------|--------------|-------------|
| `generate` | mutation | `{ dreamId?: uuid, style: 'achievement'|'spiral'|'synthesis' }` | Generate narrative visualization |
| `list` | query | `{ page, limit, dreamId? }` | List user's visualizations with pagination |
| `get` | query | `{ id: uuid }` | Get specific visualization by ID |

### AI Integration Pattern

The visualization router uses the same core pattern with a helper function for prompt building:

```typescript
// Build visualization prompt based on style
const prompt = buildVisualizationPrompt(
  selectedReflections,
  input.style,
  isDreamSpecific,
  dreamTitle
);

const requestConfig: ExtendedMessageCreateParams = {
  model: modelId,
  max_tokens: 3000,                  // Lower than evolution (3000 vs 4000)
  temperature: 1,
  messages: [{ role: 'user', content: prompt }],
};

if (thinkingBudget > 0) {
  requestConfig.thinking = {
    type: 'enabled',
    budget_tokens: thinkingBudget,
  };
}
```

### Visualization Styles

The `buildVisualizationPrompt` function creates style-specific prompts:

| Style | Metaphor | Focus |
|-------|----------|-------|
| `achievement` | Linear journey (path, river, ascent) | Forward momentum, concrete progress |
| `spiral` | Growth spiral (seasons, orbit, helix) | Recurring patterns, evolving depth |
| `synthesis` | Network (stars, web, ecosystem) | Relationships, emergent patterns |

### Extended Thinking Handling

```typescript
// Extract narrative text using type guard
const narrativeBlock = response.content.find(isTextBlock);
const narrative = narrativeBlock?.text ?? '';

if (!narrative) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to generate visualization narrative',
  });
}

// Extract thinking tokens if present
const thinkingBlock = response.content.find(isThinkingBlock);
const thinkingTokens = thinkingBlock?.thinking?.length ?? 0;  // NOTE: Uses .length, not thinking_tokens
```

**Important Difference**: The visualizations router uses `thinkingBlock?.thinking?.length` instead of `response.usage.thinking_tokens`. This is inconsistent with the evolution router and may need verification in tests.

### Database Operations

| Operation | Tables/RPCs | Purpose |
|-----------|-------------|---------|
| Check limit | `supabase.rpc('check_visualization_limit', { p_user_id, p_user_tier, p_viz_type })` | Verify monthly limit |
| Fetch dream | `dreams.select().eq('id', dreamId).eq('user_id', userId)` | Validate dream ownership |
| Fetch reflections | `reflections.select()` | Get reflections for analysis |
| Insert visualization | `visualizations.insert()` | Store generated visualization |
| Log usage | `api_usage_log.insert()` | Track API costs |
| Update counter | `supabase.rpc('increment_usage_counter', { ... })` | Increment usage counters |

### Authorization Patterns

1. **Authentication**: Uses `protectedProcedure` middleware
2. **Tier Restrictions**:
   - Dream-specific: Available to all tiers (with threshold)
   - Cross-dream: Pro+ only (explicit check: `!isDreamSpecific && userTier === 'free'`)
3. **Monthly Limits**: RPC function `check_visualization_limit` enforces per-tier caps
4. **Ownership**: All queries filter by `user_id`

### Input Validation Schemas

```typescript
const generateVisualizationSchema = z.object({
  dreamId: z.string().uuid().optional(),  // null/undefined = cross-dream
  style: z.enum(['achievement', 'spiral', 'synthesis']),
});

const listVisualizationsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  dreamId: z.string().uuid().optional(),
});

const getVisualizationSchema = z.object({
  id: z.string().uuid(),
});
```

## Combined Test Cases Required

### Evolution Router Tests

#### generateDreamEvolution (18 test cases)

**Success Cases (6)**
| ID | Test Case | Tier | Setup | Assertion |
|----|-----------|------|-------|-----------|
| TC-EV-01 | Generate with minimum reflections (4) | free | 4 reflections on dream | Returns evolutionId, evolutionText |
| TC-EV-02 | Generate with extended thinking | unlimited | 6+ reflections | Response includes cost with thinking tokens |
| TC-EV-03 | Temporal distribution selection | pro | 20 reflections | selectedReflections <= contextLimit |
| TC-EV-04 | Dream title included in prompt | pro | Dream with title | Prompt contains dream title |
| TC-EV-05 | Cost calculation accuracy | pro | Standard request | Cost matches expected formula |
| TC-EV-06 | API usage logging | pro | Standard request | api_usage_log.insert called with correct data |

**Authorization Cases (5)**
| ID | Test Case | Tier | Setup | Expected Error |
|----|-----------|------|-------|----------------|
| TC-EV-07 | Reject unauthenticated | null | No user | UNAUTHORIZED |
| TC-EV-08 | Reject demo user | free | isDemo: true | FORBIDDEN |
| TC-EV-09 | Reject below threshold | free | 3 reflections | PRECONDITION_FAILED |
| TC-EV-10 | Reject at monthly limit | pro | Limit reached (via RPC) | FORBIDDEN |
| TC-EV-11 | Reject wrong dream ownership | pro | Dream belongs to other user | NOT_FOUND |

**Error Cases (4)**
| ID | Test Case | Setup | Expected Error |
|----|-----------|-------|----------------|
| TC-EV-12 | Handle Anthropic API error | API throws | INTERNAL_SERVER_ERROR |
| TC-EV-13 | Handle no text block in response | Response has only thinking | INTERNAL_SERVER_ERROR |
| TC-EV-14 | Handle database insert error | DB insert fails | INTERNAL_SERVER_ERROR |
| TC-EV-15 | Handle invalid dreamId format | Invalid UUID | Zod validation error |

**Edge Cases (3)**
| ID | Test Case | Setup | Assertion |
|----|-----------|-------|-----------|
| TC-EV-16 | API retry on 529 | First call fails with 529 | Succeeds on retry |
| TC-EV-17 | Empty reflection fields | Some reflections have null fields | Graceful handling |
| TC-EV-18 | Maximum reflections | 100+ reflections | Temporal distribution works |

#### generateCrossDreamEvolution (12 test cases)

**Success Cases (4)**
| ID | Test Case | Tier | Setup | Assertion |
|----|-----------|------|-------|-----------|
| TC-ECR-01 | Generate with minimum reflections (12) | pro | 12 reflections across dreams | Returns report with dreamsAnalyzed |
| TC-ECR-02 | Generate with extended thinking | unlimited | 15+ reflections | Response includes thinking tokens |
| TC-ECR-03 | Dream grouping in context | pro | Reflections on 3 dreams | Context shows dream titles |
| TC-ECR-04 | Cross-dream metadata | pro | Standard request | Report has null dream_id, category = 'cross-dream' |

**Authorization Cases (4)**
| ID | Test Case | Tier | Setup | Expected Error |
|----|-----------|------|-------|----------------|
| TC-ECR-05 | Reject free tier | free | Any | FORBIDDEN (tier restriction) |
| TC-ECR-06 | Reject below threshold | pro | 11 reflections | PRECONDITION_FAILED |
| TC-ECR-07 | Reject at monthly limit | pro | Limit reached | FORBIDDEN |
| TC-ECR-08 | Allow unlimited tier | unlimited | 12+ reflections | Success |

**Error Cases (2)**
| ID | Test Case | Setup | Expected Error |
|----|-----------|-------|----------------|
| TC-ECR-09 | Handle API error | API throws | INTERNAL_SERVER_ERROR |
| TC-ECR-10 | Handle no reflections | 0 reflections | PRECONDITION_FAILED |

**Edge Cases (2)**
| ID | Test Case | Setup | Assertion |
|----|-----------|-------|-----------|
| TC-ECR-11 | Single dream with many reflections | 15 reflections on 1 dream | Works correctly |
| TC-ECR-12 | Reflections without dream association | Mixed dream_id | Handles gracefully |

#### list (6 test cases)

| ID | Test Case | Setup | Assertion |
|----|-----------|-------|-----------|
| TC-EL-01 | List with pagination | 25 reports | Returns correct page/limit/total |
| TC-EL-02 | Filter by dreamId | Reports for multiple dreams | Returns only matching dream |
| TC-EL-03 | Empty list | No reports | Returns empty array, total: 0 |
| TC-EL-04 | Include dream title | Reports with dreams | Each report has dreams.title |
| TC-EL-05 | Order by created_at desc | Multiple reports | Newest first |
| TC-EL-06 | Handle database error | DB error | INTERNAL_SERVER_ERROR |

#### get (4 test cases)

| ID | Test Case | Setup | Assertion |
|----|-----------|-------|-----------|
| TC-EG-01 | Get existing report | Valid ID | Returns full report with dream info |
| TC-EG-02 | Get cross-dream report | Report with null dream_id | Returns report successfully |
| TC-EG-03 | Reject wrong user's report | Report belongs to other user | NOT_FOUND |
| TC-EG-04 | Reject invalid ID | Non-existent UUID | NOT_FOUND |

#### checkEligibility (6 test cases)

| ID | Test Case | Tier | Setup | Expected Result |
|----|-----------|------|-------|-----------------|
| TC-CE-01 | Free tier not eligible | free | Any | eligible: false, reason mentions upgrade |
| TC-CE-02 | Pro with dream-specific eligible | pro | 4+ reflections on one dream | eligible: true |
| TC-CE-03 | Pro with cross-dream eligible | pro | 12+ total reflections | eligible: true |
| TC-CE-04 | Pro below both thresholds | pro | 3 reflections | eligible: false |
| TC-CE-05 | Unlimited eligible | unlimited | 4+ on one dream | eligible: true |
| TC-CE-06 | Handle empty state | pro | 0 reflections | eligible: false |

### Visualizations Router Tests

#### generate (16 test cases)

**Success Cases (6)**
| ID | Test Case | Tier | Setup | Assertion |
|----|-----------|------|-------|-----------|
| TC-VG-01 | Generate dream-specific (achievement) | free | 4+ reflections, style: achievement | Returns visualization with narrative |
| TC-VG-02 | Generate dream-specific (spiral) | pro | 5+ reflections, style: spiral | Narrative uses spiral metaphor |
| TC-VG-03 | Generate dream-specific (synthesis) | pro | 6+ reflections, style: synthesis | Narrative uses network metaphor |
| TC-VG-04 | Generate cross-dream | pro | 12+ reflections, no dreamId | visualization.dream_id is null |
| TC-VG-05 | Generate with extended thinking | unlimited | 6+ reflections | Cost includes thinking tokens |
| TC-VG-06 | Temporal distribution applied | pro | 30 reflections | selectedReflections <= contextLimit |

**Authorization Cases (5)**
| ID | Test Case | Tier | Setup | Expected Error |
|----|-----------|------|-------|----------------|
| TC-VG-07 | Reject unauthenticated | null | No user | UNAUTHORIZED |
| TC-VG-08 | Reject cross-dream for free | free | No dreamId | FORBIDDEN |
| TC-VG-09 | Reject below dream-specific threshold | free | 3 reflections on dream | PRECONDITION_FAILED |
| TC-VG-10 | Reject below cross-dream threshold | pro | 11 total reflections | PRECONDITION_FAILED |
| TC-VG-11 | Reject at monthly limit | pro | Limit reached | FORBIDDEN |

**Error Cases (3)**
| ID | Test Case | Setup | Expected Error |
|----|-----------|-------|----------------|
| TC-VG-12 | Handle API error | API throws | INTERNAL_SERVER_ERROR |
| TC-VG-13 | Handle empty narrative response | No text block | INTERNAL_SERVER_ERROR |
| TC-VG-14 | Handle invalid style | Invalid enum value | Zod validation error |

**Edge Cases (2)**
| ID | Test Case | Setup | Assertion |
|----|-----------|-------|-----------|
| TC-VG-15 | Dream not found | Invalid dreamId | NOT_FOUND |
| TC-VG-16 | Retry on transient error | First call 529 | Succeeds on retry |

#### list (5 test cases)

| ID | Test Case | Setup | Assertion |
|----|-----------|-------|-----------|
| TC-VL-01 | List with pagination | 25 visualizations | Correct page/limit/total/hasMore |
| TC-VL-02 | Filter by dreamId | Multiple dreams | Only matching visualizations |
| TC-VL-03 | Include dream title | Visualizations linked to dreams | dreams.title present |
| TC-VL-04 | Empty list | No visualizations | items: [], total: 0 |
| TC-VL-05 | Handle database error | DB error | INTERNAL_SERVER_ERROR |

#### get (4 test cases)

| ID | Test Case | Setup | Assertion |
|----|-----------|-------|-----------|
| TC-VGet-01 | Get existing visualization | Valid ID | Returns full visualization with dream |
| TC-VGet-02 | Get cross-dream visualization | null dream_id | Returns successfully |
| TC-VGet-03 | Reject other user's visualization | Different user_id | NOT_FOUND |
| TC-VGet-04 | Reject invalid ID | Non-existent UUID | NOT_FOUND |

## Mocking Requirements

### Supabase Mock Configuration

Based on the existing `test/integration/setup.ts` patterns:

```typescript
// Evolution router specific mocks
mockQueries({
  dreams: { data: { id: TEST_DREAM_ID, title: 'Test Dream' }, error: null },
  reflections: { 
    data: createMockReflections(6, userId), 
    error: null,
    count: 6  // For pagination
  },
  evolution_reports: { data: mockEvolutionReport, error: null },
  api_usage_log: { data: null, error: null },
});

// RPC mocks
supabase.rpc.mockImplementation((funcName: string) => {
  if (funcName === 'check_evolution_limit') {
    return Promise.resolve({ data: true, error: null });  // Can generate
  }
  if (funcName === 'check_visualization_limit') {
    return Promise.resolve({ data: true, error: null });
  }
  if (funcName === 'increment_usage_counter') {
    return Promise.resolve({ data: null, error: null });
  }
  return Promise.resolve({ data: null, error: null });
});
```

### Anthropic Mock Configuration

The existing `anthropicMock` from setup.ts needs enhancement for evolution/visualization responses:

```typescript
// Evolution-specific mock response
anthropicMock.messages.create.mockResolvedValue({
  id: 'msg_evolution_12345',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Your journey with this dream reveals a pattern of growth and deepening understanding...',
    },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  usage: { input_tokens: 500, output_tokens: 800 },
});

// With extended thinking
anthropicMock.messages.create.mockResolvedValue({
  id: 'msg_evolution_thinking_12345',
  type: 'message',
  role: 'assistant',
  content: [
    { type: 'thinking', thinking: 'Analyzing the progression of reflections...' },
    { type: 'text', text: 'Your evolution shows remarkable growth...' },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  usage: { 
    input_tokens: 500, 
    output_tokens: 800,
    thinking_tokens: 2500  // Extended usage field
  },
});
```

### Required Test Fixtures

#### New Evolution Fixtures Needed

```typescript
// test/fixtures/evolution.ts
export const createMockEvolutionReport = (overrides = {}) => ({
  id: 'evolution-uuid-1234',
  user_id: 'test-user-uuid-1234',
  dream_id: 'dream-uuid-1234',
  report_category: 'dream-specific',
  report_type: 'essential',
  analysis: 'Your journey shows growth...',
  reflections_analyzed: ['ref-1', 'ref-2', 'ref-3', 'ref-4'],
  reflection_count: 4,
  time_period_start: '2024-01-01T00:00:00Z',
  time_period_end: '2024-06-01T00:00:00Z',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockCrossDreamReport = (overrides = {}) => ({
  ...createMockEvolutionReport(),
  id: 'cross-evolution-uuid-1234',
  dream_id: null,
  report_category: 'cross-dream',
  reflections_analyzed: [...Array(12).keys()].map(i => `ref-${i}`),
  reflection_count: 12,
  ...overrides,
});
```

#### New Visualization Fixtures Needed

```typescript
// test/fixtures/visualizations.ts
export const createMockVisualization = (overrides = {}) => ({
  id: 'viz-uuid-1234',
  user_id: 'test-user-uuid-1234',
  dream_id: 'dream-uuid-1234',
  style: 'achievement',
  narrative: 'Your journey unfolds like a path through morning mist...',
  reflections_analyzed: ['ref-1', 'ref-2', 'ref-3', 'ref-4'],
  reflection_count: 4,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockCrossDreamVisualization = (overrides = {}) => ({
  ...createMockVisualization(),
  id: 'cross-viz-uuid-1234',
  dream_id: null,
  reflection_count: 12,
  reflections_analyzed: [...Array(12).keys()].map(i => `ref-${i}`),
  ...overrides,
});
```

## Implementation Strategy

### Phase 1: Setup and Fixtures (30 min)

1. Create `/test/fixtures/evolution.ts` with evolution report factories
2. Create `/test/fixtures/visualizations.ts` with visualization factories
3. Add RPC mock helpers to `setup.ts` for `check_evolution_limit`, `check_visualization_limit`, `increment_usage_counter`

### Phase 2: Evolution Router Tests (2-3 hours)

1. Create `/test/integration/evolution/evolution-generate.test.ts`
   - `generateDreamEvolution` tests (18 cases)
   - `generateCrossDreamEvolution` tests (12 cases)
   
2. Create `/test/integration/evolution/evolution-queries.test.ts`
   - `list` tests (6 cases)
   - `get` tests (4 cases)
   - `checkEligibility` tests (6 cases)

### Phase 3: Visualizations Router Tests (1.5-2 hours)

1. Create `/test/integration/visualizations/visualizations.test.ts`
   - `generate` tests (16 cases)
   - `list` tests (5 cases)
   - `get` tests (4 cases)

### Phase 4: Integration and Cleanup (30 min)

1. Verify all tests pass
2. Check coverage report
3. Document any discovered issues

### Test File Structure

```
test/
├── fixtures/
│   ├── users.ts           # Existing
│   ├── reflections.ts     # Existing
│   ├── evolution.ts       # NEW
│   └── visualizations.ts  # NEW
└── integration/
    ├── evolution/
    │   ├── evolution-generate.test.ts   # NEW
    │   └── evolution-queries.test.ts    # NEW
    └── visualizations/
        └── visualizations.test.ts       # NEW
```

### Key Testing Patterns from Existing Tests

Based on `reflection-create.test.ts`:

```typescript
describe('evolution.generateDreamEvolution', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  describe('success cases', () => {
    it('TC-EV-01: should generate with minimum reflections (4)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      // Mock RPC for limit check
      supabase.rpc.mockResolvedValue({ data: true, error: null });

      // Mock table queries
      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflections(4, proTierUser.id), error: null },
        evolution_reports: { data: createMockEvolutionReport(), error: null },
        api_usage_log: { data: null, error: null },
      });

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result).toMatchObject({
        evolutionId: expect.any(String),
        evolution: expect.any(String),
        reflectionsAnalyzed: expect.any(Number),
        totalReflections: 4,
        cost: expect.any(Number),
      });
    });
  });
});
```

### Priority Considerations

1. **High Priority**: Generation mutations (most complex, AI integration)
2. **Medium Priority**: List/Get queries (simpler but important for coverage)
3. **Lower Priority**: Edge cases (retry logic, empty states)

### Estimated Total Test Count

| Router | Procedure | Test Count |
|--------|-----------|------------|
| Evolution | generateDreamEvolution | 18 |
| Evolution | generateCrossDreamEvolution | 12 |
| Evolution | list | 6 |
| Evolution | get | 4 |
| Evolution | checkEligibility | 6 |
| Visualizations | generate | 16 |
| Visualizations | list | 5 |
| Visualizations | get | 4 |
| **Total** | | **71** |

## Risks and Considerations

### Technical Risks

1. **RPC Mock Complexity**: The routers use multiple RPC functions that need coordinated mocking
2. **Temporal Distribution Testing**: Need to verify the algorithm works correctly with various input sizes
3. **Extended Thinking Token Extraction**: Visualizations router uses inconsistent pattern (`thinking?.length` vs `usage.thinking_tokens`)

### Potential Issues

1. **Test Isolation**: Ensure each test properly resets mocks to avoid state leakage
2. **UUID Validation**: Use consistent valid UUIDs in test data
3. **Date Handling**: Temporal distribution relies on `created_at` ordering; ensure consistent date mocking

## References

### Source Files
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/visualizations.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/reflection/reflection-create.test.ts`

### Supporting Modules
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/temporal-distribution.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/cost-calculator.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/anthropic/types.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/anthropic/type-guards.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/retry.ts`

### Test Fixtures
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/users.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/reflections.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`
