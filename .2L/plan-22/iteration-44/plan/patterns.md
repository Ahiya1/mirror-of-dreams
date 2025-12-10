# Code Patterns & Conventions

## File Structure

```
test/
├── fixtures/
│   ├── users.ts              # User scenarios (existing)
│   ├── reflections.ts        # Reflection factories (existing)
│   ├── evolution.ts          # Evolution report factories (NEW)
│   └── visualizations.ts     # Visualization factories (NEW)
└── integration/
    ├── setup.ts              # Test infrastructure (existing)
    ├── evolution/
    │   └── evolution.test.ts # Evolution router tests (NEW)
    └── visualizations/
        └── visualizations.test.ts # Visualization router tests (NEW)
```

## Naming Conventions

- Test files: `{feature}.test.ts`
- Test IDs: `TC-{PREFIX}-{NUMBER}` (e.g., TC-EV-01, TC-VG-01)
- Fixtures: `createMock{Entity}()` factories
- Constants: `TEST_{ENTITY}_ID` for UUIDs

## Import Patterns

### Standard Test File Imports

```typescript
// test/integration/evolution/evolution.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, anthropicMock, supabaseMock } from '../setup';

import {
  freeTierUser,
  proTierUser,
  unlimitedTierUser,
  demoUser,
  createMockUser,
} from '@/test/fixtures/users';
import { createMockReflections } from '@/test/fixtures/reflections';
import {
  createMockEvolutionReport,
  createMockCrossDreamReport,
} from '@/test/fixtures/evolution';
```

## Test Structure Patterns

### Standard Test File Structure

```typescript
// Valid UUIDs for test data
const TEST_DREAM_ID = '12345678-1234-1234-1234-123456789012';
const TEST_EVOLUTION_ID = 'abcdef12-3456-7890-abcd-ef1234567890';

// Set up environment variable
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
});

describe('evolution.generateDreamEvolution', () => {
  describe('success cases', () => {
    it('TC-EV-01: should generate with minimum reflections (4)', async () => {
      // Test implementation
    });
  });

  describe('authorization', () => {
    it('TC-EV-07: should reject unauthenticated user', async () => {
      // Test implementation
    });
  });

  describe('error handling', () => {
    it('TC-EV-12: should handle Anthropic API error', async () => {
      // Test implementation
    });
  });

  describe('edge cases', () => {
    it('TC-EV-16: should succeed after transient API error with retry', async () => {
      // Test implementation
    });
  });
});
```

## Fixture Patterns

### Evolution Report Fixture Factory

```typescript
// test/fixtures/evolution.ts
import type { Database } from '@/types/supabase';

type EvolutionReportRow = Database['public']['Tables']['evolution_reports']['Row'];

export const createMockEvolutionReport = (
  overrides: Partial<EvolutionReportRow> = {}
): EvolutionReportRow => ({
  id: 'evolution-uuid-1234',
  user_id: 'test-user-uuid-1234',
  dream_id: 'dream-uuid-1234',
  report_category: 'dream-specific',
  report_type: 'essential',
  analysis: 'Your journey with this dream reveals a pattern of growth and deepening understanding...',
  reflections_analyzed: ['ref-1', 'ref-2', 'ref-3', 'ref-4'],
  reflection_count: 4,
  time_period_start: '2024-01-01T00:00:00Z',
  time_period_end: '2024-06-01T00:00:00Z',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockCrossDreamReport = (
  overrides: Partial<EvolutionReportRow> = {}
): EvolutionReportRow => ({
  ...createMockEvolutionReport(),
  id: 'cross-evolution-uuid-1234',
  dream_id: null,
  report_category: 'cross-dream',
  reflections_analyzed: Array.from({ length: 12 }, (_, i) => `ref-${i + 1}`),
  reflection_count: 12,
  ...overrides,
});
```

### Visualization Fixture Factory

```typescript
// test/fixtures/visualizations.ts
import type { Database } from '@/types/supabase';

type VisualizationRow = Database['public']['Tables']['visualizations']['Row'];

export const createMockVisualization = (
  overrides: Partial<VisualizationRow> = {}
): VisualizationRow => ({
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

export const createMockCrossDreamVisualization = (
  overrides: Partial<VisualizationRow> = {}
): VisualizationRow => ({
  ...createMockVisualization(),
  id: 'cross-viz-uuid-1234',
  dream_id: null,
  reflection_count: 12,
  reflections_analyzed: Array.from({ length: 12 }, (_, i) => `ref-${i + 1}`),
  ...overrides,
});
```

### Reflections with Dream Info (for cross-dream queries)

```typescript
// Create reflections with joined dream info for cross-dream tests
export const createReflectionsWithDreams = (
  count: number,
  userId: string,
  dreamId: string = 'dream-uuid-1234'
) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `reflection-${index + 1}`,
    user_id: userId,
    dream_id: dreamId,
    dream: `Dream content ${index + 1}`,
    plan: `Plan ${index + 1}`,
    relationship: `Relationship ${index + 1}`,
    offering: `Offering ${index + 1}`,
    ai_response: `AI Response ${index + 1}`,
    tone: 'fusion',
    is_premium: false,
    created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    // Joined dream data for cross-dream queries
    dreams: {
      title: `Dream Title ${Math.floor(index / 4) + 1}`,
      category: 'personal',
    },
  }));
};
```

## RPC Mock Patterns

### Evolution Limit Check RPC

```typescript
// Mock check_evolution_limit RPC - returns true (can generate) or false (at limit)
supabase.rpc.mockImplementation((funcName: string, params: any) => {
  if (funcName === 'check_evolution_limit') {
    // Default: allow generation
    return Promise.resolve({ data: true, error: null });
  }
  if (funcName === 'increment_usage_counter') {
    return Promise.resolve({ data: null, error: null });
  }
  return Promise.resolve({ data: null, error: null });
});

// To test limit reached scenario:
supabase.rpc.mockImplementation((funcName: string) => {
  if (funcName === 'check_evolution_limit') {
    return Promise.resolve({ data: false, error: null }); // At limit
  }
  return Promise.resolve({ data: null, error: null });
});
```

### Visualization Limit Check RPC

```typescript
// Mock check_visualization_limit RPC
supabase.rpc.mockImplementation((funcName: string, params: any) => {
  if (funcName === 'check_visualization_limit') {
    return Promise.resolve({ data: true, error: null }); // Can generate
  }
  if (funcName === 'increment_usage_counter') {
    return Promise.resolve({ data: null, error: null });
  }
  return Promise.resolve({ data: null, error: null });
});
```

## Anthropic Mock Patterns

### Standard Evolution Response (No Extended Thinking)

```typescript
anthropicMock.messages.create.mockResolvedValue({
  id: 'msg_evolution_12345',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Your journey with this dream reveals a pattern of growth and deepening understanding. Over the course of your reflections, you have shown remarkable evolution in how you approach and embody this aspiration...',
    },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 500, output_tokens: 800 },
});
```

### Extended Thinking Response (Unlimited Tier)

```typescript
anthropicMock.messages.create.mockResolvedValue({
  id: 'msg_evolution_thinking_12345',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'thinking',
      thinking: 'Let me analyze the progression of reflections over time to identify key patterns and growth moments...',
    },
    {
      type: 'text',
      text: 'Your evolution shows remarkable depth and growth...',
    },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: {
    input_tokens: 500,
    output_tokens: 800,
    thinking_tokens: 2500, // Extended thinking tokens
  },
});
```

### No Text Block Response (Error Case)

```typescript
anthropicMock.messages.create.mockResolvedValue({
  id: 'msg_no_text_12345',
  type: 'message',
  role: 'assistant',
  content: [
    { type: 'thinking', thinking: 'Only thinking block, no text' },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  usage: { input_tokens: 100, output_tokens: 10 },
});
```

### API Error Response

```typescript
anthropicMock.messages.create.mockRejectedValue(new Error('Anthropic API error'));
```

### Transient 529 Error (Retry Test)

```typescript
const overloadedError = new Error('Overloaded');
(overloadedError as any).status = 529;

anthropicMock.messages.create
  .mockRejectedValueOnce(overloadedError)
  .mockResolvedValueOnce({
    id: 'msg_retry_success',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: 'Success after retry' }],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    usage: { input_tokens: 100, output_tokens: 50 },
  });
```

## Complete Test Examples

### Evolution Generation Test (Success)

```typescript
it('TC-EV-01: should generate dream evolution with minimum reflections (4)', async () => {
  const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

  // Mock RPC for limit check
  supabase.rpc.mockImplementation((funcName: string) => {
    if (funcName === 'check_evolution_limit') {
      return Promise.resolve({ data: true, error: null });
    }
    if (funcName === 'increment_usage_counter') {
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  // Mock table queries
  mockQueries({
    dreams: {
      data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
      error: null,
    },
    reflections: {
      data: createMockReflections(4, proTierUser.id),
      error: null,
    },
    evolution_reports: {
      data: createMockEvolutionReport({ user_id: proTierUser.id }),
      error: null,
    },
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
```

### Evolution Generation Test (Authorization - Unauthenticated)

```typescript
it('TC-EV-07: should reject unauthenticated user', async () => {
  const { caller } = createTestCaller(null);

  await expect(
    caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
  ).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
});
```

### Evolution Generation Test (Error - Below Threshold)

```typescript
it('TC-EV-09: should reject when below reflection threshold', async () => {
  const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

  supabase.rpc.mockResolvedValue({ data: true, error: null });

  mockQueries({
    dreams: {
      data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
      error: null,
    },
    reflections: {
      data: createMockReflections(3, proTierUser.id), // Only 3, need 4
      error: null,
    },
  });

  await expect(
    caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
  ).rejects.toMatchObject({
    code: 'PRECONDITION_FAILED',
    message: expect.stringContaining('4 reflections'),
  });
});
```

### Cross-Dream Evolution Test (Tier Restriction)

```typescript
it('TC-ECR-05: should reject free tier for cross-dream evolution', async () => {
  const { caller } = createTestCaller(freeTierUser);

  await expect(
    caller.evolution.generateCrossDreamEvolution()
  ).rejects.toMatchObject({
    code: 'FORBIDDEN',
    message: expect.stringContaining('Pro'),
  });
});
```

### Visualization Generation Test

```typescript
it('TC-VG-01: should generate dream-specific visualization (achievement style)', async () => {
  const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

  supabase.rpc.mockImplementation((funcName: string) => {
    if (funcName === 'check_visualization_limit') {
      return Promise.resolve({ data: true, error: null });
    }
    if (funcName === 'increment_usage_counter') {
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  mockQueries({
    dreams: {
      data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
      error: null,
    },
    reflections: {
      data: createMockReflections(5, proTierUser.id),
      error: null,
    },
    visualizations: {
      data: createMockVisualization({ user_id: proTierUser.id }),
      error: null,
    },
    api_usage_log: { data: null, error: null },
  });

  const result = await caller.visualizations.generate({
    dreamId: TEST_DREAM_ID,
    style: 'achievement',
  });

  expect(result).toMatchObject({
    visualization: expect.objectContaining({
      id: expect.any(String),
      style: 'achievement',
      narrative: expect.any(String),
    }),
    message: 'Visualization generated successfully',
    cost: expect.any(Object),
  });
});
```

### List Query Test with Pagination

```typescript
it('TC-EL-01: should list evolution reports with pagination', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  const mockReports = Array.from({ length: 5 }, (_, i) =>
    createMockEvolutionReport({
      id: `report-${i + 1}`,
      user_id: proTierUser.id,
    })
  );

  mockQueries({
    evolution_reports: {
      data: mockReports.slice(0, 2), // First page
      error: null,
      count: 5,
    },
  });

  const result = await caller.evolution.list({ page: 1, limit: 2 });

  expect(result).toMatchObject({
    reports: expect.arrayContaining([
      expect.objectContaining({ id: expect.any(String) }),
    ]),
    page: 1,
    limit: 2,
    total: 5,
    totalPages: 3,
  });
});
```

### Get Query Test (Not Found)

```typescript
it('TC-EG-04: should return NOT_FOUND for invalid ID', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    evolution_reports: { data: null, error: new Error('Not found') },
  });

  await expect(
    caller.evolution.get({ id: 'non-existent-uuid-1234-5678-90ab' })
  ).rejects.toMatchObject({
    code: 'NOT_FOUND',
    message: expect.stringContaining('not found'),
  });
});
```

## Testing Patterns (Production Mode)

### Test Coverage Requirements

| Procedure | Success | Auth | Error | Edge | Total |
|-----------|---------|------|-------|------|-------|
| generateDreamEvolution | 6 | 5 | 4 | 3 | 18 |
| generateCrossDreamEvolution | 4 | 4 | 2 | 2 | 12 |
| evolution.list | 5 | 0 | 1 | 0 | 6 |
| evolution.get | 2 | 1 | 1 | 0 | 4 |
| checkEligibility | 6 | 0 | 0 | 0 | 6 |
| visualizations.generate | 6 | 5 | 3 | 2 | 16 |
| visualizations.list | 4 | 0 | 1 | 0 | 5 |
| visualizations.get | 2 | 1 | 1 | 0 | 4 |

### Error Handling Pattern

```typescript
describe('error handling', () => {
  it('should handle Anthropic API error gracefully', async () => {
    const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

    supabase.rpc.mockResolvedValue({ data: true, error: null });

    mockQueries({
      dreams: { data: { id: TEST_DREAM_ID, title: 'Test' }, error: null },
      reflections: { data: createMockReflections(4, proTierUser.id), error: null },
    });

    anthropicMock.messages.create.mockRejectedValue(new Error('API Error'));

    await expect(
      caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: expect.stringContaining('Failed to generate'),
    });
  });
});
```

### Input Validation Pattern

```typescript
describe('input validation', () => {
  it('should reject invalid UUID format for dreamId', async () => {
    const { caller } = createTestCaller(proTierUser);

    await expect(
      caller.evolution.generateDreamEvolution({ dreamId: 'not-a-uuid' })
    ).rejects.toThrow(); // Zod validation error
  });

  it('should reject invalid style enum for visualization', async () => {
    const { caller } = createTestCaller(proTierUser);

    await expect(
      caller.visualizations.generate({
        dreamId: TEST_DREAM_ID,
        style: 'invalid' as any,
      })
    ).rejects.toThrow();
  });
});
```

## Security Patterns

### Authorization Test Pattern

```typescript
describe('authorization', () => {
  it('should reject demo user', async () => {
    const { caller } = createTestCaller(demoUser);

    await expect(
      caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('should reject access to other user resources', async () => {
    const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

    supabase.rpc.mockResolvedValue({ data: true, error: null });

    // Dream belongs to different user
    mockQueries({
      dreams: { data: null, error: new Error('Not found') },
    });

    await expect(
      caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
```

## Import Order Convention

```typescript
// 1. Testing framework imports
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 2. Test infrastructure imports
import { createTestCaller, anthropicMock, supabaseMock } from '../setup';

// 3. Fixture imports
import { freeTierUser, proTierUser, unlimitedTierUser } from '@/test/fixtures/users';
import { createMockReflections } from '@/test/fixtures/reflections';
import { createMockEvolutionReport } from '@/test/fixtures/evolution';

// 4. Constants
const TEST_DREAM_ID = '12345678-1234-1234-1234-123456789012';
```
