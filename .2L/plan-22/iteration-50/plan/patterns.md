# Code Patterns & Conventions - Integration Tests

## File Structure

```
test/
  integration/
    auth/
      signin.test.ts
      signup.test.ts
      signout.test.ts
      password-reset.test.ts    # NEW
      verification.test.ts      # NEW
      demo.test.ts              # NEW
    dreams/
      create.test.ts
      crud.test.ts
      list.test.ts
    lifecycle/
      lifecycle.test.ts         # NEW
    subscriptions/
      subscriptions.test.ts     # NEW
    journeys/
      user-journey.test.ts      # NEW
    reflection/
      reflection-create.test.ts
    reflections/
      reflections.test.ts
    users/
      users.test.ts
    clarify/
      clarify.test.ts
    evolution/
      evolution.test.ts
    visualizations/
      visualizations.test.ts
    setup.ts
  fixtures/
    users.ts
    dreams.ts
    reflections.ts
    evolution.ts
    visualizations.ts
    form-data.ts
    lifecycle.ts               # NEW
    subscriptions.ts           # NEW
```

## Naming Conventions

- Test files: `{feature}.test.ts` or `{feature}-{action}.test.ts`
- Fixture files: `{entity}.ts`
- Test IDs: `TC-{ROUTER}-{NUMBER}` (e.g., `TC-LC-01` for lifecycle)
- Describe blocks: Use router.procedure format (e.g., `lifecycle.evolve`)
- Variables: camelCase for all test variables

## Test File Structure Pattern

**When to use:** Every integration test file

```typescript
// test/integration/{router}/{feature}.test.ts
// {Description of what this file tests}

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock, supabaseMock, anthropicMock } from '../setup';

import { createMockDream } from '@/test/fixtures/dreams';
import { proTierUser, freeTierUser, demoUser } from '@/test/fixtures/users';

// =============================================================================
// CONSTANTS
// =============================================================================

const TEST_DREAM_ID = '12345678-1234-1234-1234-123456789012';
const TEST_USER_ID = proTierUser.id;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const createMockResponse = (data: any) => ({
  data,
  error: null,
});

// =============================================================================
// TESTS: router.procedure
// =============================================================================

describe('router.procedure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('success cases', () => {
    it('TC-XX-01: should handle normal case', async () => {
      // Arrange
      const { caller, mockQuery } = createTestCaller(proTierUser);
      mockQuery('table', { data: mockData, error: null });

      // Act
      const result = await caller.router.procedure(input);

      // Assert
      expect(result).toMatchObject({
        field: expect.any(String),
      });
    });
  });

  // ===========================================================================
  // AUTHORIZATION
  // ===========================================================================

  describe('authorization', () => {
    it('TC-XX-10: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.router.procedure(input)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('validation', () => {
    it('TC-XX-20: should reject invalid input', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(caller.router.procedure({ invalid: 'input' })).rejects.toThrow();
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('TC-XX-30: should handle database error', async () => {
      const { caller, mockQuery } = createTestCaller(proTierUser);
      mockQuery('table', { data: null, error: new Error('DB error') });

      await expect(caller.router.procedure(input)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });
});
```

## Mock Query Patterns

### Single Table Mock

**When to use:** Procedure queries only one table

```typescript
it('should fetch single item', async () => {
  const { caller, mockQuery } = createTestCaller(proTierUser);

  mockQuery('dreams', {
    data: createMockDream({ id: TEST_DREAM_ID, user_id: proTierUser.id }),
    error: null,
  });

  const result = await caller.dreams.getById({ dreamId: TEST_DREAM_ID });

  expect(result.id).toBe(TEST_DREAM_ID);
});
```

### Multiple Tables Mock

**When to use:** Procedure queries multiple tables

```typescript
it('should fetch with related data', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    dreams: {
      data: createMockDream({ id: TEST_DREAM_ID }),
      error: null,
    },
    reflections: {
      data: createMockReflections(5, proTierUser.id),
      error: null,
    },
    evolution_events: {
      data: [],
      error: null,
    },
  });

  const result = await caller.lifecycle.achieve({ dreamId: TEST_DREAM_ID });

  expect(result.reflectionCount).toBe(5);
});
```

### Sequential Calls Mock (Same Table)

**When to use:** Procedure calls same table multiple times

```typescript
it('should handle sequential table calls', async () => {
  const { caller, supabase } = createTestCaller(proTierUser);

  let callCount = 0;
  supabase.from.mockImplementation((table: string) => {
    if (table === 'dreams') {
      callCount++;
      if (callCount === 1) {
        // First call: fetch dream
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockDream({ status: 'active' }),
            error: null,
          }),
        });
      } else {
        // Second call: update dream
        return createPartialMock({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      }
    }
    return createPartialMock({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  await caller.lifecycle.evolve({
    dreamId: TEST_DREAM_ID,
    newTitle: 'Updated Dream',
    evolutionReflection: 'My journey has evolved...',
  });

  expect(callCount).toBe(2);
});
```

### RPC Mock Pattern

**When to use:** Procedure uses Supabase RPC functions

```typescript
it('should check limits via RPC', async () => {
  const { caller, supabase, mockQuery } = createTestCaller(proTierUser);

  // Mock RPC calls
  supabase.rpc.mockImplementation((funcName: string) => {
    if (funcName === 'check_evolution_limit') {
      return Promise.resolve({ data: true, error: null });
    }
    if (funcName === 'increment_usage_counter') {
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  mockQuery('dreams', { data: createMockDream(), error: null });

  const result = await caller.evolution.generate({ dreamId: TEST_DREAM_ID });

  expect(supabase.rpc).toHaveBeenCalledWith('check_evolution_limit', expect.any(Object));
});
```

## AI Mock Patterns

### Standard Anthropic Response

**When to use:** Procedure calls Anthropic API

```typescript
it('should generate AI synthesis', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    dreams: { data: createMockDream(), error: null },
    reflections: { data: createMockReflections(4), error: null },
    achievement_ceremonies: { data: createMockCeremony(), error: null },
  });

  anthropicMock.messages.create.mockResolvedValue({
    id: 'msg_test_12345',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: `---WHO_YOU_WERE---
When you began this journey, you were someone seeking change...

---WHO_YOU_BECAME---
Through dedication and growth, you became someone who...

---JOURNEY_SYNTHESIS---
Your path has been marked by moments of discovery...`,
      },
    ],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 500 },
  });

  const result = await caller.lifecycle.achieve({ dreamId: TEST_DREAM_ID });

  expect(result.hasSynthesis).toBe(true);
  expect(anthropicMock.messages.create).toHaveBeenCalled();
});
```

### Extended Thinking Response (Unlimited Tier)

**When to use:** Testing unlimited tier with extended thinking

```typescript
it('should use extended thinking for unlimited tier', async () => {
  const { caller, mockQueries } = createTestCaller(unlimitedTierUser);

  anthropicMock.beta.messages.create.mockResolvedValue({
    id: 'msg_test_extended',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'thinking',
        thinking: 'Analyzing the deeper patterns in the dream journey...',
      },
      {
        type: 'text',
        text: 'Your journey reveals profound transformation...',
      },
    ],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 800, thinking_tokens: 500 },
  });

  const result = await caller.evolution.generate({ dreamId: TEST_DREAM_ID });

  expect(anthropicMock.beta.messages.create).toHaveBeenCalled();
});
```

## Authorization Test Patterns

### Unauthenticated User Test

**When to use:** Every protected procedure

```typescript
it('should reject unauthenticated user', async () => {
  const { caller } = createTestCaller(null);

  await expect(
    caller.lifecycle.evolve({
      dreamId: TEST_DREAM_ID,
      newTitle: 'Test',
      evolutionReflection: 'Test reflection',
    })
  ).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
});
```

### Demo User Restriction Test

**When to use:** Procedures that block demo users

```typescript
it('should reject demo user', async () => {
  const { caller } = createTestCaller(demoUser);

  await expect(
    caller.lifecycle.achieve({ dreamId: TEST_DREAM_ID })
  ).rejects.toMatchObject({
    code: 'FORBIDDEN',
    message: expect.stringContaining('demo'),
  });
});
```

### Dream Ownership Test

**When to use:** Procedures that verify resource ownership

```typescript
it('should reject access to other user dream', async () => {
  const { caller, mockQuery } = createTestCaller(proTierUser);

  // Return dream owned by different user
  mockQuery('dreams', {
    data: null,
    error: { code: 'PGRST116' }, // Not found (ownership check failed)
  });

  await expect(
    caller.lifecycle.evolve({
      dreamId: 'other-user-dream-id',
      newTitle: 'Hijack attempt',
      evolutionReflection: 'Should not work',
    })
  ).rejects.toMatchObject({
    code: 'NOT_FOUND',
    message: 'Dream not found',
  });
});
```

### Tier-Based Access Test

**When to use:** Procedures with tier restrictions

```typescript
it('should reject free tier user', async () => {
  const { caller, supabase } = createTestCaller(freeTierUser);

  supabase.rpc.mockResolvedValue({ data: false, error: null }); // Limit exceeded

  await expect(
    caller.evolution.generate({ dreamId: TEST_DREAM_ID })
  ).rejects.toMatchObject({
    code: 'FORBIDDEN',
    message: expect.stringContaining('limit'),
  });
});
```

## Validation Test Patterns

### Missing Required Field

**When to use:** Testing Zod schema validation

```typescript
it('should reject missing required field', async () => {
  const { caller } = createTestCaller(proTierUser);

  await expect(
    caller.lifecycle.release({
      dreamId: TEST_DREAM_ID,
      whatILearned: 'Test',
      // Missing: whatImGratefulFor, whatIRelease
    } as any)
  ).rejects.toThrow();
});
```

### Input Too Short/Long

**When to use:** Testing string length validation

```typescript
it('should reject evolution reflection too short', async () => {
  const { caller } = createTestCaller(proTierUser);

  await expect(
    caller.lifecycle.evolve({
      dreamId: TEST_DREAM_ID,
      newTitle: 'Valid Title',
      evolutionReflection: 'Short', // Min 10 chars required
    })
  ).rejects.toThrow();
});
```

### Invalid Enum Value

**When to use:** Testing enum field validation

```typescript
it('should reject invalid category', async () => {
  const { caller } = createTestCaller(proTierUser);

  await expect(
    caller.lifecycle.evolve({
      dreamId: TEST_DREAM_ID,
      newTitle: 'Test',
      evolutionReflection: 'Valid reflection text here',
      newCategory: 'invalid_category' as any,
    })
  ).rejects.toThrow();
});
```

## Error Handling Patterns

### Database Error

**When to use:** Testing database failure scenarios

```typescript
it('should handle database error gracefully', async () => {
  const { caller, supabase } = createTestCaller(proTierUser);

  supabase.from.mockImplementation(() =>
    createPartialMock({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Connection timeout'),
      }),
    })
  );

  await expect(
    caller.lifecycle.getCeremony({ dreamId: TEST_DREAM_ID })
  ).rejects.toMatchObject({
    code: 'NOT_FOUND', // Or INTERNAL_SERVER_ERROR depending on router
  });
});
```

### AI Service Error

**When to use:** Testing AI API failure scenarios

```typescript
it('should handle AI service error', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    dreams: { data: createMockDream(), error: null },
    reflections: { data: createMockReflections(4), error: null },
    achievement_ceremonies: { data: null, error: null },
  });

  anthropicMock.messages.create.mockRejectedValue(new Error('API rate limited'));

  // Depending on router behavior - may still succeed without synthesis
  const result = await caller.lifecycle.achieve({ dreamId: TEST_DREAM_ID });

  // Ceremony created but without AI synthesis
  expect(result.hasSynthesis).toBe(false);
});
```

## Fixture Patterns

### Lifecycle Fixtures

**File:** `test/fixtures/lifecycle.ts`

```typescript
// test/fixtures/lifecycle.ts - Lifecycle test data factory

/**
 * Evolution event database row type
 */
export interface EvolutionEventRow {
  id: string;
  user_id: string;
  dream_id: string;
  old_title: string;
  old_description: string | null;
  old_target_date: string | null;
  old_category: string;
  new_title: string;
  new_description: string | null;
  new_target_date: string | null;
  new_category: string;
  evolution_reflection: string;
  created_at: string;
}

/**
 * Achievement ceremony database row type
 */
export interface AchievementCeremonyRow {
  id: string;
  user_id: string;
  dream_id: string;
  dream_title: string;
  dream_description: string | null;
  dream_category: string;
  who_you_were: string | null;
  who_you_became: string | null;
  journey_synthesis: string | null;
  personal_note: string | null;
  reflections_analyzed: string[];
  reflection_count: number;
  created_at: string;
}

/**
 * Release ritual database row type
 */
export interface ReleaseRitualRow {
  id: string;
  user_id: string;
  dream_id: string;
  dream_title: string;
  dream_description: string | null;
  dream_category: string;
  what_i_learned: string;
  what_im_grateful_for: string;
  what_i_release: string;
  final_message: string | null;
  reason: string | null;
  reflection_count: number;
  created_at: string;
}

/**
 * Creates a mock evolution event
 */
export const createMockEvolutionEvent = (
  overrides: Partial<EvolutionEventRow> = {}
): EvolutionEventRow => ({
  id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
  user_id: 'test-user-uuid-1234',
  dream_id: '11111111-1111-4111-a111-111111111111',
  old_title: 'Original Dream Title',
  old_description: 'Original description',
  old_target_date: '2025-06-30',
  old_category: 'personal_growth',
  new_title: 'Evolved Dream Title',
  new_description: 'Updated description after evolution',
  new_target_date: '2025-12-31',
  new_category: 'personal_growth',
  evolution_reflection: 'My dream has evolved because I have grown...',
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a mock achievement ceremony
 */
export const createMockCeremony = (
  overrides: Partial<AchievementCeremonyRow> = {}
): AchievementCeremonyRow => ({
  id: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
  user_id: 'test-user-uuid-1234',
  dream_id: '11111111-1111-4111-a111-111111111111',
  dream_title: 'Achieved Dream',
  dream_description: 'A dream that was achieved',
  dream_category: 'personal_growth',
  who_you_were: '<div class="mirror-reflection">When you began...</div>',
  who_you_became: '<div class="mirror-reflection">You became someone...</div>',
  journey_synthesis: '<div class="mirror-reflection">Your journey...</div>',
  personal_note: null,
  reflections_analyzed: ['ref-1', 'ref-2', 'ref-3', 'ref-4'],
  reflection_count: 4,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a mock release ritual
 */
export const createMockRitual = (
  overrides: Partial<ReleaseRitualRow> = {}
): ReleaseRitualRow => ({
  id: 'rrrrrrrr-rrrr-4rrr-rrrr-rrrrrrrrrrrr',
  user_id: 'test-user-uuid-1234',
  dream_id: '11111111-1111-4111-a111-111111111111',
  dream_title: 'Released Dream',
  dream_description: 'A dream that was released',
  dream_category: 'career',
  what_i_learned: 'I learned that some dreams need to transform into new ones...',
  what_im_grateful_for: 'I am grateful for the journey and lessons...',
  what_i_release: 'I release attachment to this specific outcome...',
  final_message: 'Thank you for the growth you brought me.',
  reason: 'evolved_beyond',
  reflection_count: 3,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates multiple evolution events for a dream
 */
export const createEvolutionHistory = (
  count: number,
  dreamId: string,
  userId: string
): EvolutionEventRow[] =>
  Array.from({ length: count }, (_, index) =>
    createMockEvolutionEvent({
      id: `evolution-${index + 1}`,
      dream_id: dreamId,
      user_id: userId,
      old_title: `Version ${index}`,
      new_title: `Version ${index + 1}`,
      created_at: new Date(Date.now() - (count - index) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  );
```

### Subscriptions Fixtures

**File:** `test/fixtures/subscriptions.ts`

```typescript
// test/fixtures/subscriptions.ts - Subscription test data factory

/**
 * Subscription status object
 */
export interface SubscriptionStatus {
  tier: 'free' | 'pro' | 'unlimited';
  status: string | null;
  period: 'monthly' | 'yearly' | null;
  isActive: boolean;
  isSubscribed: boolean;
  isCanceled: boolean;
  cancelAtPeriodEnd: boolean;
  nextBilling: string | null;
  subscriptionId: string | null;
  startedAt: string | null;
  expiresAt: string | null;
}

/**
 * Creates a mock subscription status
 */
export const createMockSubscriptionStatus = (
  overrides: Partial<SubscriptionStatus> = {}
): SubscriptionStatus => ({
  tier: 'free',
  status: null,
  period: null,
  isActive: false,
  isSubscribed: false,
  isCanceled: false,
  cancelAtPeriodEnd: false,
  nextBilling: null,
  subscriptionId: null,
  startedAt: null,
  expiresAt: null,
  ...overrides,
});

/**
 * Free tier subscription status
 */
export const freeSubscriptionStatus = createMockSubscriptionStatus();

/**
 * Active pro monthly subscription
 */
export const proMonthlyStatus = createMockSubscriptionStatus({
  tier: 'pro',
  status: 'active',
  period: 'monthly',
  isActive: true,
  isSubscribed: true,
  subscriptionId: 'I-PRO-MONTHLY-123',
  startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  nextBilling: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Active pro yearly subscription
 */
export const proYearlyStatus = createMockSubscriptionStatus({
  tier: 'pro',
  status: 'active',
  period: 'yearly',
  isActive: true,
  isSubscribed: true,
  subscriptionId: 'I-PRO-YEARLY-456',
  startedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  nextBilling: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Active unlimited subscription
 */
export const unlimitedStatus = createMockSubscriptionStatus({
  tier: 'unlimited',
  status: 'active',
  period: 'yearly',
  isActive: true,
  isSubscribed: true,
  subscriptionId: 'I-UNLIMITED-789',
  startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  nextBilling: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Canceled subscription (still active until period end)
 */
export const canceledStatus = createMockSubscriptionStatus({
  tier: 'pro',
  status: 'active',
  period: 'monthly',
  isActive: true,
  isSubscribed: true,
  isCanceled: false,
  cancelAtPeriodEnd: true,
  subscriptionId: 'I-CANCELED-ABC',
  startedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * PayPal subscription details response
 */
export const createMockPayPalSubscription = (overrides: Partial<any> = {}) => ({
  id: 'I-SUB123456',
  status: 'ACTIVE',
  plan_id: 'P-PRO-MONTHLY',
  subscriber: {
    payer_id: 'PAYER123',
    email_address: 'test@example.com',
  },
  billing_info: {
    next_billing_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  ...overrides,
});
```

## User Journey Test Pattern

**When to use:** Testing cross-router flows

```typescript
// test/integration/journeys/user-journey.test.ts

describe('User Journey: Dream Lifecycle', () => {
  it('should complete full dream lifecycle from creation to achievement', async () => {
    const user = createMockUser({ tier: 'pro' });
    const { caller, supabase, mockQueries } = createTestCaller(user);

    // Step 1: Create dream
    const dreamId = 'new-dream-uuid';
    let dreamStatus = 'active';
    let reflectionCount = 0;

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        if (dreamStatus === 'active') {
          return createPartialMock({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: createMockDream({ id: dreamId, status: dreamStatus }),
              error: null,
            }),
          });
        }
      }
      if (table === 'reflections') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({ data: createMockReflections(reflectionCount, user.id), error: null })
          ),
        });
      }
      return createPartialMock({ /* ... */ });
    });

    // Create dream
    const dream = await caller.dreams.create({
      title: 'Learn Guitar',
      description: 'Master basic chords',
      category: 'creative',
    });
    expect(dream.id).toBeDefined();

    // Step 2: Generate reflections (simulate 4)
    reflectionCount = 4;

    // Step 3: Achieve dream
    anthropicMock.messages.create.mockResolvedValue({
      /* ceremony response */
    });
    dreamStatus = 'achieved';

    const ceremony = await caller.lifecycle.achieve({ dreamId });
    expect(ceremony.hasSynthesis).toBe(true);
    expect(ceremony.reflectionCount).toBe(4);
  });
});
```

## Import Order Convention

```typescript
// 1. Vitest imports
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 2. Test setup imports
import { createTestCaller, createPartialMock, supabaseMock, anthropicMock } from '../setup';

// 3. Fixture imports
import { createMockDream, activeDream } from '@/test/fixtures/dreams';
import { createMockReflections } from '@/test/fixtures/reflections';
import {
  freeTierUser,
  proTierUser,
  unlimitedTierUser,
  demoUser,
  createMockUser,
} from '@/test/fixtures/users';

// 4. Type imports (if needed)
import type { User } from '@/types';
```

## Code Quality Standards

- **Test naming**: Use `TC-{ROUTER}-{NUMBER}:` prefix followed by `should {action}`
- **Arrange-Act-Assert**: Clear separation in each test
- **One assertion focus**: Each test verifies one behavior (multiple expects OK if related)
- **Mock cleanup**: Always use `beforeEach` with `vi.clearAllMocks()`
- **No magic strings**: Use constants for repeated values like IDs

## Security Patterns in Tests

### Never Expose Sensitive Data

```typescript
// GOOD: Use generic test values
const TEST_PASSWORD = 'TestPassword123!';
const TEST_TOKEN = 'mock-jwt-token-12345';

// BAD: Real credentials
// const TEST_PASSWORD = 'my-real-password';
```

### Test Authorization Boundaries

```typescript
// Always test that users cannot access others' resources
it('should not access other user resources', async () => {
  const { caller, mockQuery } = createTestCaller(userA);

  // Mock returns null because ownership check fails
  mockQuery('dreams', { data: null, error: { code: 'PGRST116' } });

  await expect(caller.dreams.getById({ dreamId: userBDreamId })).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
});
```

## CI/CD Patterns

### Test Execution

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npx vitest test/integration/lifecycle/lifecycle.test.ts

# Run with coverage
npm run test:coverage
```

### GitHub Actions Integration

Tests automatically run on PR via existing workflow. No changes needed.
