# Test Factories

This guide documents all test data factories available in Mirror of Dreams. Factories provide consistent, reusable test data with override patterns for customization.

## Table of Contents

- [Overview](#overview)
- [User Factories](#user-factories)
- [Dream Factories](#dream-factories)
- [Reflection Factories](#reflection-factories)
- [Clarify Session Factories](#clarify-session-factories)
- [Usage Patterns](#usage-patterns)

## Overview

All factories are located in `test/factories/` and can be imported from `@/test/factories`:

```typescript
import {
  // User factories
  createMockUser,
  freeTierUser,
  proTierUser,

  // Dream factories
  createMockDream,
  activeDream,
  achievedDream,

  // Reflection factories
  createMockReflection,
  basicReflection,

  // Clarify factories
  createMockClarifySession,
  activeSession,
} from '@/test/factories';
```

### Factory Pattern

All factories follow the **override pattern**:

```typescript
// Base factory creates object with defaults
const user = createMockUser();

// Pass overrides to customize
const proUser = createMockUser({
  tier: 'pro',
  name: 'Pro User',
});

// Multiple levels of customization
const customUser = createMockUser({
  tier: 'unlimited',
  reflectionCountThisMonth: 50,
  preferences: {
    ...defaultTestPreferences,
    default_tone: 'gentle',
  },
});
```

## User Factories

### createMockUser

Creates a mock `User` object with sensible defaults:

```typescript
const user = createMockUser({
  id: 'custom-id',
  email: 'custom@example.com',
  tier: 'pro',
});
```

**Default values:**
| Field | Default Value |
|-------|---------------|
| `id` | `'test-user-uuid-1234'` |
| `email` | `'test@example.com'` |
| `name` | `'Test User'` |
| `tier` | `'free'` |
| `subscriptionStatus` | `'active'` |
| `reflectionCountThisMonth` | `0` |
| `reflectionsToday` | `0` |
| `totalReflections` | `0` |
| `language` | `'en'` |
| `emailVerified` | `true` |
| `isDemo` | `false` |
| `isAdmin` | `false` |
| `isCreator` | `false` |

### createMockUserRow

Creates a database-format `UserRow` object:

```typescript
const userRow = createMockUserRow({
  tier: 'pro',
  subscription_status: 'active',
});
```

### Pre-configured User Scenarios

#### Tier-based Users

```typescript
import {
  freeTierUser, // Fresh free account
  freeTierAtLimit, // Free user at 2 reflection limit
  proTierUser, // Active pro subscription
  proTierAtDailyLimit,
  unlimitedTierUser,
  unlimitedTierAtDailyLimit,
} from '@/test/factories';
```

#### Subscription States

```typescript
import {
  canceledSubscriptionUser, // Pro with cancelAtPeriodEnd: true
  expiredSubscriptionUser, // Downgraded to free
} from '@/test/factories';
```

#### Special Users

```typescript
import {
  creatorUser, // isCreator: true
  adminUser, // isAdmin: true
  demoUser, // isDemo: true, emailVerified: false
  hebrewUser, // language: 'he'
  customPreferencesUser,
  newUser, // Never signed in
} from '@/test/factories';
```

### Helper Functions

```typescript
// Create user with specific tier
const user = createUserWithTier('pro');
const canceledUser = createUserWithTier('pro', 'canceled');

// Create user with specific reflection counts
const userWithReflections = createUserWithReflections(5, 1, 20);
// (monthlyCount, dailyCount, totalCount)

// Create user with specific language
const hebrewUser = createUserWithLanguage('he');

// Create multiple users
const users = createMockUsers(5);
// Returns array of 5 users with unique IDs
```

## Dream Factories

### createMockDream

Creates a mock `DreamRow` object:

```typescript
const dream = createMockDream({
  title: 'Learn Guitar',
  category: 'creative',
  status: 'active',
});
```

**Default values:**
| Field | Default Value |
|-------|---------------|
| `id` | `'11111111-1111-4111-a111-111111111111'` |
| `user_id` | `'22222222-2222-4222-a222-222222222222'` |
| `title` | `'Learn to play guitar'` |
| `description` | `'Master basic chords...'` |
| `target_date` | `'2025-12-31'` |
| `category` | `'creative'` |
| `priority` | `5` |
| `status` | `'active'` |

### Pre-configured Dream Scenarios

```typescript
import {
  // Status-based
  activeDream,
  achievedDream,
  archivedDream,
  releasedDream,

  // Special cases
  openEndedDream, // No target date
  highPriorityDream, // Priority 10
  lowPriorityDream, // Priority 1
  overdueDream, // Past target date
  futureDream, // 2030 target
} from '@/test/factories';
```

### Helper Functions

```typescript
// Create multiple dreams
const dreams = createMockDreams(5, 'user-123');

// Create dream for specific user
const userDream = createDreamForUser('user-123', { title: 'My Dream' });

// Create dreams at tier limits
const freeDreams = createFreeTierDreams('user-id'); // 2 dreams
const proDreams = createProTierDreams('user-id'); // 5 dreams

// Create dream with specific category
const healthDream = createDreamWithCategory('health');

// Create dream with status and timestamp
const achieved = createDreamWithStatus('achieved');
// Sets achieved_at automatically

// Create dream with stats (for list views)
const dreamWithStats = createMockDreamWithStats({
  reflectionCount: 5,
  lastReflectionAt: new Date().toISOString(),
  daysLeft: 30,
});
```

### Dream Categories

```typescript
type DreamCategory =
  | 'health'
  | 'career'
  | 'relationships'
  | 'financial'
  | 'personal_growth'
  | 'creative'
  | 'spiritual'
  | 'entrepreneurial'
  | 'educational'
  | 'other';
```

### Tier Limits

```typescript
import { DREAM_TIER_LIMITS } from '@/test/factories';

// { free: 2, pro: 5, unlimited: 999999 }
```

## Reflection Factories

### createMockReflection

Creates a simplified mock reflection:

```typescript
const reflection = createMockReflection({
  tone: 'gentle',
  content: 'My reflection content',
});
```

### createMockReflectionRow

Creates a full database-format `ReflectionRow`:

```typescript
const reflectionRow = createMockReflectionRow({
  is_premium: true,
  word_count: 800,
  rating: 9,
});
```

**Default values:**
| Field | Default Value |
|-------|---------------|
| `id` | `'reflection-uuid-1234'` |
| `user_id` | `'test-user-uuid-1234'` |
| `dream_id` | `'dream-uuid-1234'` |
| `dream` | `'I want to learn guitar'` |
| `tone` | `'fusion'` |
| `is_premium` | `false` |
| `word_count` | `350` |
| `rating` | `null` |
| `view_count` | `0` |

### Pre-configured Reflection Scenarios

```typescript
import {
  // Tone variations
  basicReflection, // fusion tone
  gentleReflection,
  intenseReflection,
  fusionReflection,

  // Premium
  premiumReflection, // is_premium: true, word_count: 800

  // Special cases
  ratedReflection, // Has rating and feedback
  legacyReflection, // No dream_id
  noDateReflection, // has_date: 'no'
  popularReflection, // High view count
} from '@/test/factories';
```

### Helper Functions

```typescript
// Create multiple reflections
const reflections = createMockReflections(5, 'user-123');
// Automatically staggers created_at dates

// Create for specific user
const userReflection = createReflectionForUser('user-123', {
  tone: 'gentle',
});

// Create for specific dream
const dreamReflection = createReflectionForDream('dream-123');

// Create all three tones
const toneVariety = createToneVarietyReflections('user-123');
// Returns [gentle, intense, fusion]

// Create with specific tone
const gentle = createReflectionWithTone('gentle');

// Create paginated set (sorted by date desc)
const paginated = createPaginatedReflections(20, 'user-123');

// Create premium reflection
const premium = createPremiumReflection({
  word_count: 1000,
});
```

## Clarify Session Factories

### Session Factories

```typescript
// Create session
const session = createMockClarifySession({
  status: 'archived',
  messageCount: 10,
});

// Database format
const sessionRow = createMockClarifySessionRow({
  status: 'active',
});
```

**Default session values:**
| Field | Default Value |
|-------|---------------|
| `id` | `'session-uuid-1234'` |
| `userId` | `'test-user-uuid-1234'` |
| `title` | `'Test Clarify Session'` |
| `status` | `'active'` |
| `messageCount` | `0` |
| `dreamId` | `null` |

### Message Factories

```typescript
// Create message
const message = createMockClarifyMessage({
  role: 'assistant',
  content: 'Here is my response...',
});

// Database format
const messageRow = createMockClarifyMessageRow({
  role: 'user',
});
```

### Pattern Factories

```typescript
// Create pattern
const pattern = createMockClarifyPattern({
  patternType: 'tension',
  strength: 0.85,
});

// Database format
const patternRow = createMockClarifyPatternRow({
  pattern_type: 'recurring_theme',
});
```

### Pre-configured Scenarios

```typescript
import {
  // Sessions
  activeSession,
  archivedSession,
  sessionWithDream, // Has dreamId linked
  emptySession, // messageCount: 0

  // Messages
  userMessage,
  assistantMessage,
  messageWithToolUse,
  longMessage,

  // Patterns
  recurringThemePattern,
  tensionPattern,
  potentialDreamPattern,
  identitySignalPattern,
} from '@/test/factories';
```

### Helper Functions

```typescript
// Create session with messages
const { session, messages } = createSessionWithMessages(10, {
  title: 'Career Discussion',
});

// Create multiple sessions
const sessions = createMockClarifySessions(5, 'user-123');

// Create multiple messages
const messages = createMockClarifyMessages(20, 'session-123');
// Alternates user/assistant roles

// Create multiple patterns
const patterns = createMockClarifyPatterns(4, 'user-123');
// Cycles through all pattern types

// Create for specific user
const userSession = createSessionForUser('user-123', {
  title: 'My Session',
});

// Create with specific role
const assistantMsg = createMessageWithRole('assistant', {
  content: 'Response text',
});

// Create with specific pattern type
const tension = createPatternWithType('tension', {
  strength: 0.9,
});

// Create with specific status
const archived = createSessionWithStatus('archived');

// Create tool use object
const toolUse = createDreamToolUse('Start a Business', true);
```

### Pattern Types

```typescript
type PatternType = 'recurring_theme' | 'tension' | 'potential_dream' | 'identity_signal';
```

## Usage Patterns

### Basic Usage in Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/helpers';
import { createMockQueryResult } from '@/test/helpers';
import { freeTierUser, activeDream, achievedDream } from '@/test/factories';

describe('DreamsPage', () => {
  it('should display user dreams', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([activeDream, achievedDream])
    );

    renderWithProviders(<DreamsPage />, { user: freeTierUser });

    expect(screen.getByText(activeDream.title)).toBeInTheDocument();
    expect(screen.getByText(achievedDream.title)).toBeInTheDocument();
  });
});
```

### Customizing for Edge Cases

```typescript
describe('edge cases', () => {
  it('should handle dream with very long title', () => {
    const longTitleDream = createMockDream({
      title: 'A'.repeat(200),
    });

    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([longTitleDream])
    );

    renderWithProviders(<DreamsPage />);

    // Assert truncation or overflow handling
  });

  it('should handle user with null preferences', () => {
    const userWithNullPrefs = createMockUser({
      preferences: null as any,
    });

    renderWithProviders(<Settings />, { user: userWithNullPrefs });

    // Assert default preferences shown
  });
});
```

### Combining Factories

```typescript
describe('complex scenarios', () => {
  it('should handle user at limit with achieved dreams', () => {
    const user = createUserWithTier('free');
    const dreams = [
      createDreamWithStatus('achieved'),
      createDreamWithStatus('active'),
    ];

    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult(dreams)
    );
    vi.mocked(trpc.dreams.getLimits.useQuery).mockReturnValue(
      createMockQueryResult({
        dreamsUsed: 2,
        dreamsLimit: DREAM_TIER_LIMITS.free,
      })
    );

    renderWithProviders(<DreamsPage />, { user });

    expect(screen.getByText('2 / 2 dreams')).toBeInTheDocument();
  });
});
```

### Using with tRPC Router Tests

```typescript
import { createMockContext } from '@/test/helpers';
import { freeTierUser, createMockDream } from '@/test/factories';
import { appRouter } from '@/server/trpc/routers/_app';

describe('dreams router', () => {
  it('should create dream', async () => {
    const ctx = createMockContext(freeTierUser);
    const caller = appRouter.createCaller(ctx);

    // Mock DB to return new dream
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [createMockDream({ title: 'New Dream' })],
          error: null,
        }),
      }),
    } as any);

    const result = await caller.dreams.create({
      title: 'New Dream',
      category: 'career',
    });

    expect(result.title).toBe('New Dream');
  });
});
```

## Best Practices

1. **Use pre-configured scenarios** when they match your test case
2. **Override only what's relevant** to the test
3. **Create helper functions** for complex, repeated setups
4. **Keep factories simple** - complex logic belongs in test setup
5. **Document custom factories** in team-specific test files

## Related Documentation

- [Testing Patterns](./patterns.md) - How to use factories in tests
- [Mocking Guide](./mocking.md) - Combining factories with mocks
