# Code Patterns & Conventions - Reflection Router Tests

## File Structure

```
test/integration/
├── setup.ts                          # Shared test caller and mocks
├── reflections/
│   └── reflections.test.ts           # CRUD tests (list, getById, update, delete, feedback)
└── reflection/
    └── reflection-create.test.ts     # AI generation tests
```

## Naming Conventions

- Test files: `{feature}.test.ts` or `{feature}-{operation}.test.ts`
- Describe blocks: Feature name (e.g., `reflection.create`)
- Test names: Start with "should" + expected behavior
- Mock factories: `createMock{Entity}` or `create{Entity}Mock`
- Test IDs: Valid UUIDs (e.g., `'12345678-1234-1234-1234-123456789012'`)

## Test File Structure

```typescript
// test/integration/reflection/reflection-create.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, supabaseMock } from '../setup';

import {
  freeTierUser,
  proTierUser,
  unlimitedTierUser,
  creatorUser,
  demoUser,
  freeTierAtLimit,
  proTierAtDailyLimit,
} from '@/test/fixtures/users';
import { createReflectionForUser } from '@/test/fixtures/reflections';

// Valid UUIDs for test data
const TEST_DREAM_ID = '12345678-1234-1234-1234-123456789012';
const TEST_REFLECTION_ID = 'abcdef12-3456-7890-abcd-ef1234567890';

describe('reflection.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should create reflection with valid input', async () => {
      // Arrange
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // ... mock setup

      // Act
      const result = await caller.reflection.create(validInput);

      // Assert
      expect(result.reflection).toBeDefined();
      expect(result.reflectionId).toBeDefined();
    });
  });

  describe('authorization', () => {
    // Auth-related tests
  });

  describe('error cases', () => {
    // Error handling tests
  });
});
```

## Mock Patterns

### Anthropic SDK Mock Factory

Add this to `setup.ts` or a separate mock file:

```typescript
// Enhanced Anthropic mock scenarios
export type AnthropicMockScenario =
  | 'success'
  | 'premium'
  | 'error'
  | 'empty'
  | 'no-text-block'
  | 'overloaded';

export function createAnthropicResponse(scenario: AnthropicMockScenario) {
  switch (scenario) {
    case 'success':
      return {
        id: 'msg_test_12345',
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'text',
          text: 'Your journey speaks to the depths of your soul. This dream reflects your inner wisdom and courage to grow. The path you have chosen reveals your readiness for transformation.'
        }],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      };

    case 'premium':
      return {
        id: 'msg_premium_12345',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'thinking',
            thinking: 'Extended thinking content analyzing the dream deeply...'
          },
          {
            type: 'text',
            text: 'Premium deep reflection with extended thinking enabled. Your consciousness journey reveals profound patterns of growth and self-discovery.'
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 200, output_tokens: 150 },
      };

    case 'empty':
      return {
        id: 'msg_empty_12345',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 0 },
      };

    case 'no-text-block':
      return {
        id: 'msg_no_text_12345',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'thinking', thinking: 'Only thinking, no text' }],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 10 },
      };

    case 'error':
      throw new Error('Anthropic API error');

    case 'overloaded':
      const error = new Error('Overloaded');
      (error as any).status = 529;
      throw error;

    default:
      return createAnthropicResponse('success');
  }
}

// Helper to configure mock for specific scenario
export function setAnthropicMockScenario(scenario: AnthropicMockScenario) {
  const Anthropic = vi.mocked(await import('@anthropic-ai/sdk')).default;
  const mockClient = new Anthropic();

  if (scenario === 'error' || scenario === 'overloaded') {
    mockClient.messages.create.mockRejectedValue(
      scenario === 'overloaded'
        ? Object.assign(new Error('Overloaded'), { status: 529 })
        : new Error('Anthropic API error')
    );
  } else {
    mockClient.messages.create.mockResolvedValue(createAnthropicResponse(scenario));
  }
}
```

### Supabase Multi-Table Mock Pattern

```typescript
// Mock multiple tables with different responses
mockQueries({
  // Dream lookup for title
  dreams: {
    data: { id: TEST_DREAM_ID, title: 'Learn Guitar' },
    error: null
  },

  // Reflection insert
  reflections: {
    data: {
      id: TEST_REFLECTION_ID,
      user_id: freeTierUser.id,
      dream_id: TEST_DREAM_ID,
      ai_response: 'Your journey speaks to the depths...',
      tone: 'fusion',
      is_premium: false,
      word_count: 25,
      estimated_read_time: 1,
      title: 'Learn Guitar',
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    error: null
  },

  // User counter update
  users: {
    data: null,
    error: null
  },

  // Evolution report check
  evolution_reports: {
    data: null,
    error: null
  },
});
```

### Cache Mock Pattern

Add to `setup.ts`:

```typescript
// Cache mock - add to vi.hoisted block
const cacheMock = {
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheKeys: {
    reflections: (userId: string) => `ctx:reflections:${userId}`,
    userContext: (userId: string) => `ctx:user:${userId}`,
    dreams: (userId: string) => `ctx:dreams:${userId}`,
    patterns: (userId: string) => `ctx:patterns:${userId}`,
    sessions: (userId: string) => `ctx:sessions:${userId}`,
  },
};

// Add mock
vi.mock('@/server/lib/cache', () => ({
  cacheDelete: cacheMock.cacheDelete,
  cacheGet: cacheMock.cacheGet,
  cacheSet: cacheMock.cacheSet,
  cacheKeys: cacheMock.cacheKeys,
}));

// Export for test access
export { cacheMock };
```

### Prompts Mock Pattern

Add to `setup.ts`:

```typescript
// Prompts mock - add to vi.hoisted block
const promptsMock = {
  loadPrompts: vi.fn().mockResolvedValue('Mocked system prompt for reflection generation'),
  loadEvolutionPrompt: vi.fn().mockResolvedValue('Mocked evolution prompt'),
  buildReflectionUserPrompt: vi.fn().mockReturnValue('Mocked user prompt'),
};

// Add mock
vi.mock('@/server/lib/prompts', () => ({
  loadPrompts: promptsMock.loadPrompts,
  loadEvolutionPrompt: promptsMock.loadEvolutionPrompt,
  buildReflectionUserPrompt: promptsMock.buildReflectionUserPrompt,
}));

// Export for test access
export { promptsMock };
```

## Test Input Patterns

### Valid Create Reflection Input

```typescript
const validCreateInput = {
  dreamId: TEST_DREAM_ID,
  dream: 'I want to learn guitar and perform at open mic nights',
  plan: 'Practice 30 minutes daily, take lessons weekly, attend open mics monthly',
  relationship: 'This dream connects me to my creative side and childhood aspirations',
  offering: 'Time, dedication, and vulnerability to perform in public',
  tone: 'fusion' as const,
  isPremium: false,
};
```

### Valid Update Reflection Input

```typescript
const validUpdateInput = {
  id: TEST_REFLECTION_ID,
  title: 'Updated Title',
  tags: ['music', 'creativity', 'growth'],
};
```

### Valid Feedback Input

```typescript
const validFeedbackInput = {
  id: TEST_REFLECTION_ID,
  rating: 8,
  feedback: 'This reflection really helped me see my dream differently',
};
```

## Assertion Patterns

### Success Response Assertions

```typescript
// reflection.create success
expect(result).toMatchObject({
  reflection: expect.any(String),
  reflectionId: expect.any(String),
  isPremium: false,
  shouldTriggerEvolution: expect.any(Boolean),
  wordCount: expect.any(Number),
  estimatedReadTime: expect.any(Number),
  message: 'Reflection generated successfully',
});

// Check AI response content
expect(result.reflection).toContain('journey');
expect(result.wordCount).toBeGreaterThan(0);
```

### Error Assertions

```typescript
// UNAUTHORIZED
await expect(caller.reflection.create(input)).rejects.toMatchObject({
  code: 'UNAUTHORIZED',
  message: expect.stringContaining('Authentication required'),
});

// FORBIDDEN (demo user)
await expect(caller.reflection.create(input)).rejects.toMatchObject({
  code: 'FORBIDDEN',
  message: expect.stringContaining('demo'),
});

// FORBIDDEN (limit reached)
await expect(caller.reflection.create(input)).rejects.toMatchObject({
  code: 'FORBIDDEN',
  message: expect.stringMatching(/limit|reached/i),
});

// INTERNAL_SERVER_ERROR (API error)
await expect(caller.reflection.create(input)).rejects.toMatchObject({
  code: 'INTERNAL_SERVER_ERROR',
  message: expect.stringContaining('Failed to generate'),
});

// NOT_FOUND
await expect(caller.reflections.getById({ id: nonExistentId })).rejects.toMatchObject({
  code: 'NOT_FOUND',
  message: 'Reflection not found',
});

// Validation error (Zod)
await expect(caller.reflection.create(invalidInput)).rejects.toThrow();
```

### Mock Call Verification

```typescript
// Verify cache invalidation was called
expect(cacheMock.cacheDelete).toHaveBeenCalledWith(
  `ctx:reflections:${freeTierUser.id}`
);

// Verify Anthropic was called with correct config
expect(mockAnthropicCreate).toHaveBeenCalledWith(
  expect.objectContaining({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000, // Non-premium
  })
);

// Verify premium config
expect(mockAnthropicCreate).toHaveBeenCalledWith(
  expect.objectContaining({
    max_tokens: 6000, // Premium
    thinking: {
      type: 'enabled',
      budget_tokens: 5000,
    },
  })
);
```

## Testing Patterns by Category

### Authorization Tests

```typescript
describe('authorization', () => {
  it('should reject unauthenticated user', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.reflection.create(validInput)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('should reject demo user', async () => {
    const { caller } = createTestCaller(demoUser);

    await expect(caller.reflection.create(validInput)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('demo'),
    });
  });

  it('should allow creator to bypass limits', async () => {
    const { caller, mockQueries } = createTestCaller(creatorUser);
    // Setup mocks...

    const result = await caller.reflection.create(validInput);
    expect(result.reflectionId).toBeDefined();
  });
});
```

### Tier Limit Tests

```typescript
describe('tier limits', () => {
  it('should block free tier at monthly limit', async () => {
    const { caller } = createTestCaller(freeTierAtLimit);

    await expect(caller.reflection.create(validInput)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('Monthly'),
    });
  });

  it('should block pro tier at daily limit', async () => {
    const { caller } = createTestCaller(proTierAtDailyLimit);

    await expect(caller.reflection.create(validInput)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('Daily'),
    });
  });
});
```

### Premium Feature Tests

```typescript
describe('premium features', () => {
  it('should use extended thinking for unlimited tier', async () => {
    const { caller, mockQueries } = createTestCaller(unlimitedTierUser);
    // Setup mocks...

    const result = await caller.reflection.create({
      ...validInput,
      isPremium: false, // Even without explicit request
    });

    expect(result.isPremium).toBe(true); // Unlimited gets premium
  });

  it('should use extended thinking for creator', async () => {
    const { caller, mockQueries } = createTestCaller(creatorUser);
    // Setup mocks...

    const result = await caller.reflection.create(validInput);
    expect(result.isPremium).toBe(true);
  });

  it('should use extended thinking when explicitly requested by pro user', async () => {
    const { caller, mockQueries } = createTestCaller(proTierUser);
    // Setup mocks...

    const result = await caller.reflection.create({
      ...validInput,
      isPremium: true,
    });

    expect(result.isPremium).toBe(true);
  });
});
```

### Error Handling Tests

```typescript
describe('error handling', () => {
  it('should handle Anthropic API error', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    mockQueries({ dreams: { data: { title: 'Test' }, error: null } });

    // Configure Anthropic to throw
    const Anthropic = vi.mocked(await import('@anthropic-ai/sdk')).default;
    vi.mocked(new Anthropic().messages.create).mockRejectedValueOnce(
      new Error('API Error')
    );

    await expect(caller.reflection.create(validInput)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: expect.stringContaining('Failed to generate'),
    });
  });

  it('should handle empty AI response', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    // Setup to return empty content array

    await expect(caller.reflection.create(validInput)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('should handle database insert error', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    mockQueries({
      dreams: { data: { title: 'Test' }, error: null },
      reflections: { data: null, error: new Error('DB Error') },
    });

    await expect(caller.reflection.create(validInput)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: expect.stringContaining('Failed to save'),
    });
  });
});
```

### Validation Tests

```typescript
describe('input validation', () => {
  it('should reject invalid dreamId format', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.reflection.create({
      ...validInput,
      dreamId: 'not-a-uuid',
    })).rejects.toThrow();
  });

  it('should reject empty dream text', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.reflection.create({
      ...validInput,
      dream: '',
    })).rejects.toThrow();
  });

  it('should reject dream text exceeding max length', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.reflection.create({
      ...validInput,
      dream: 'x'.repeat(3201), // Max is 3200
    })).rejects.toThrow();
  });

  it('should reject invalid tone', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.reflection.create({
      ...validInput,
      tone: 'invalid' as any,
    })).rejects.toThrow();
  });
});
```

## CRUD Test Patterns

### Update Tests

```typescript
describe('reflections.update', () => {
  it('should update title successfully', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    const updatedReflection = createReflectionForUser(freeTierUser.id, {
      id: TEST_REFLECTION_ID,
      title: 'Updated Title',
    });

    mockQueries({
      reflections: { data: updatedReflection, error: null },
    });

    const result = await caller.reflections.update({
      id: TEST_REFLECTION_ID,
      title: 'Updated Title',
    });

    expect(result.reflection.title).toBe('Updated Title');
    expect(result.message).toBe('Reflection updated successfully');
  });

  it('should update tags successfully', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    const updatedReflection = createReflectionForUser(freeTierUser.id, {
      id: TEST_REFLECTION_ID,
      tags: ['new', 'tags'],
    });

    mockQueries({
      reflections: { data: updatedReflection, error: null },
    });

    const result = await caller.reflections.update({
      id: TEST_REFLECTION_ID,
      tags: ['new', 'tags'],
    });

    expect(result.reflection.tags).toEqual(['new', 'tags']);
  });

  it('should reject update of other user reflection', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    mockQueries({
      reflections: { data: null, error: { code: 'PGRST116' } as any },
    });

    await expect(caller.reflections.update({
      id: OTHER_USER_REFLECTION_ID,
      title: 'Hacked',
    })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
```

### Delete Tests

```typescript
describe('reflections.delete', () => {
  it('should delete own reflection', async () => {
    const { caller, mockQueries, supabase } = createTestCaller(freeTierUser);

    mockQueries({
      reflections: { data: { id: TEST_REFLECTION_ID }, error: null },
      users: { data: null, error: null },
    });

    const result = await caller.reflections.delete({ id: TEST_REFLECTION_ID });

    expect(result.message).toBe('Reflection deleted successfully');
  });

  it('should decrement user counters on delete', async () => {
    const { caller, mockQueries, supabase } = createTestCaller({
      ...freeTierUser,
      reflectionCountThisMonth: 2,
      totalReflections: 5,
    });

    mockQueries({
      reflections: { data: { id: TEST_REFLECTION_ID }, error: null },
      users: { data: null, error: null },
    });

    await caller.reflections.delete({ id: TEST_REFLECTION_ID });

    // Verify update was called with decremented values
    expect(supabase.from).toHaveBeenCalledWith('users');
  });

  it('should return NOT_FOUND for non-existent reflection', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    mockQueries({
      reflections: { data: null, error: null },
    });

    await expect(caller.reflections.delete({
      id: '00000000-0000-0000-0000-000000000000'
    })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
```

### Submit Feedback Tests

```typescript
describe('reflections.submitFeedback', () => {
  it('should submit rating only', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    const updatedReflection = createReflectionForUser(freeTierUser.id, {
      id: TEST_REFLECTION_ID,
      rating: 8,
      user_feedback: null,
    });

    mockQueries({
      reflections: { data: updatedReflection, error: null },
    });

    const result = await caller.reflections.submitFeedback({
      id: TEST_REFLECTION_ID,
      rating: 8,
    });

    expect(result.reflection.rating).toBe(8);
    expect(result.message).toBe('Feedback submitted successfully');
  });

  it('should submit rating and feedback', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    const updatedReflection = createReflectionForUser(freeTierUser.id, {
      id: TEST_REFLECTION_ID,
      rating: 9,
      user_feedback: 'Very insightful',
    });

    mockQueries({
      reflections: { data: updatedReflection, error: null },
    });

    const result = await caller.reflections.submitFeedback({
      id: TEST_REFLECTION_ID,
      rating: 9,
      feedback: 'Very insightful',
    });

    expect(result.reflection.rating).toBe(9);
    expect(result.reflection.userFeedback).toBe('Very insightful');
  });

  it('should accept rating at min boundary (1)', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    const updatedReflection = createReflectionForUser(freeTierUser.id, {
      id: TEST_REFLECTION_ID,
      rating: 1,
    });

    mockQueries({
      reflections: { data: updatedReflection, error: null },
    });

    const result = await caller.reflections.submitFeedback({
      id: TEST_REFLECTION_ID,
      rating: 1,
    });

    expect(result.reflection.rating).toBe(1);
  });

  it('should accept rating at max boundary (10)', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);
    const updatedReflection = createReflectionForUser(freeTierUser.id, {
      id: TEST_REFLECTION_ID,
      rating: 10,
    });

    mockQueries({
      reflections: { data: updatedReflection, error: null },
    });

    const result = await caller.reflections.submitFeedback({
      id: TEST_REFLECTION_ID,
      rating: 10,
    });

    expect(result.reflection.rating).toBe(10);
  });

  it('should reject rating below min (0)', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.reflections.submitFeedback({
      id: TEST_REFLECTION_ID,
      rating: 0,
    })).rejects.toThrow();
  });

  it('should reject rating above max (11)', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.reflections.submitFeedback({
      id: TEST_REFLECTION_ID,
      rating: 11,
    })).rejects.toThrow();
  });
});
```

## Security Patterns

### Input Validation via Zod

All inputs are validated by Zod schemas before reaching the procedure:
- UUID format for IDs
- String length limits
- Enum validation for tones
- Number ranges for ratings

### Ownership Verification

All CRUD operations include `.eq('user_id', ctx.user.id)` to ensure users can only access their own data.

### Error Sanitization

Error messages are sanitized - database errors return generic messages, not raw error details.

## Import Order Convention

```typescript
// 1. Vitest imports
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 2. Test setup imports
import { createTestCaller, supabaseMock, cacheMock } from '../setup';

// 3. Fixture imports
import { freeTierUser, proTierUser } from '@/test/fixtures/users';
import { createReflectionForUser } from '@/test/fixtures/reflections';

// 4. Type imports (if needed)
import type { ReflectionRow } from '@/types/reflection';
```

## Code Quality Standards

- All tests must have clear Arrange/Act/Assert structure
- Use descriptive test names that explain expected behavior
- Group related tests with nested `describe` blocks
- Reset mocks in `beforeEach` to ensure test isolation
- Use TypeScript strict mode - no `any` except for error mocking
- Verify mock calls when testing side effects
