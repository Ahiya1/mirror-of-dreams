# Builder Tasks - Iteration 32

## Builder 1: Test Setup + Auth Tests

**Focus:** Create the integration test infrastructure and auth router tests

### Task 1.1: Cookie Mock

**File:** `test/mocks/cookies.ts`

Create a mock for the cookies module:

```typescript
// test/mocks/cookies.ts
import { vi } from 'vitest';

/**
 * Creates a mock for @/server/lib/cookies module
 */
export const createCookieMock = () => ({
  getAuthCookie: vi.fn().mockResolvedValue(null),
  setAuthCookie: vi.fn().mockResolvedValue(undefined),
  clearAuthCookie: vi.fn().mockResolvedValue(undefined),
});

export type CookieMock = ReturnType<typeof createCookieMock>;
```

### Task 1.2: Enhance Supabase Mock for Count

**File:** `test/mocks/supabase.ts`

Add count support to the query mock response:

```typescript
// Enhance SupabaseQueryResponse
export interface SupabaseQueryResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number;  // Add count support
}

// Update createSupabaseQueryMock to handle count
export const createSupabaseQueryMock = <T>(
  response: SupabaseQueryResponse<T>
) => {
  const mockChain = {
    // ... existing methods ...

    // Make the chain thenable with count support
    then: vi.fn((resolve: (value: SupabaseQueryResponse<T>) => void) =>
      resolve({ ...response })
    ),
  };
  return mockChain;
};
```

### Task 1.3: Test Caller Setup

**File:** `test/integration/setup.ts`

Create the main test helper:

```typescript
// test/integration/setup.ts
import { vi, beforeEach } from 'vitest';
import { appRouter } from '@/server/trpc/routers/_app';
import {
  createSupabaseMock,
  createSupabaseQueryMock,
  type SupabaseQueryResponse
} from '@/test/mocks/supabase';
import { createCookieMock } from '@/test/mocks/cookies';
import type { User } from '@/types';

// Create module-level mocks
const supabaseMock = createSupabaseMock();
const cookieMock = createCookieMock();

// Mock the modules BEFORE they're imported by other modules
vi.mock('@/server/lib/supabase', () => ({
  supabase: supabaseMock,
}));

vi.mock('@/server/lib/cookies', () => ({
  getAuthCookie: () => cookieMock.getAuthCookie(),
  setAuthCookie: (token: string, isDemo?: boolean) =>
    cookieMock.setAuthCookie(token, isDemo),
  clearAuthCookie: () => cookieMock.clearAuthCookie(),
}));

// Bypass rate limiting in tests
vi.mock('@/server/lib/rate-limiter', () => ({
  authRateLimiter: {},
  aiRateLimiter: {},
  writeRateLimiter: {},
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 999,
    remaining: 999,
    reset: 0
  }),
}));

/**
 * Creates a test caller with mocked dependencies
 */
export function createTestCaller(user: User | null = null) {
  // Reset mocks for each test
  vi.clearAllMocks();

  // Create fresh caller with mocked context
  const caller = appRouter.createCaller({
    user,
    req: new Request('http://localhost:3000'),
  });

  return {
    caller,
    supabase: supabaseMock,
    cookies: cookieMock,

    /**
     * Mock a single table response
     */
    mockQuery: <T>(
      table: string,
      response: SupabaseQueryResponse<T>
    ) => {
      supabaseMock.from.mockImplementation((t: string) => {
        if (t === table) {
          return createSupabaseQueryMock(response);
        }
        return createSupabaseQueryMock({ data: null, error: null });
      });
    },

    /**
     * Mock multiple table responses
     */
    mockQueries: (
      tableResponses: Record<string, SupabaseQueryResponse<any>>
    ) => {
      supabaseMock.from.mockImplementation((table: string) => {
        const response = tableResponses[table] || { data: null, error: null };
        return createSupabaseQueryMock(response);
      });
    },

    /**
     * Reset all mocks
     */
    resetMocks: () => {
      vi.clearAllMocks();
      supabaseMock.from.mockReset();
    },
  };
}

export { supabaseMock, cookieMock };
```

### Task 1.4: Auth Signup Tests

**File:** `test/integration/auth/signup.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { createTestCaller } from '../setup';
import { createMockUserRow } from '@/test/fixtures/users';

describe('auth.signup', () => {
  const validInput = {
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    name: 'New User',
    language: 'en' as const,
  };

  describe('success cases', () => {
    it('should create a new user with valid credentials', async () => {
      const { caller, mockQuery, cookies } = createTestCaller(null);

      const newUserRow = createMockUserRow({
        email: validInput.email,
        name: validInput.name,
        language: validInput.language,
      });

      // Mock: no existing user
      mockQuery('users', { data: null, error: { code: 'PGRST116' } as any });

      // Then mock successful insert
      // (Need to handle the sequence of calls)

      const result = await caller.auth.signup(validInput);

      expect(result.user.email).toBe(validInput.email);
      expect(result.token).toBeDefined();
      expect(result.message).toBe('Account created successfully');
      expect(cookies.setAuthCookie).toHaveBeenCalled();
    });

    it('should hash the password before storing', async () => {
      // Test that password_hash is not the plain password
    });

    it('should generate a valid JWT token', async () => {
      // Test JWT contains correct payload
    });
  });

  describe('error cases', () => {
    it('should reject duplicate email addresses', async () => {
      const { caller, mockQuery } = createTestCaller(null);

      // Mock existing user found
      mockQuery('users', {
        data: { id: 'existing-user' },
        error: null
      });

      await expect(caller.auth.signup(validInput)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('already exists'),
      });
    });

    it('should validate email format', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.auth.signup({ ...validInput, email: 'invalid-email' })
      ).rejects.toThrow();
    });

    it('should require minimum password length', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.auth.signup({ ...validInput, password: '123' })
      ).rejects.toThrow();
    });
  });
});
```

### Task 1.5: Auth Signin Tests

**File:** `test/integration/auth/signin.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { createTestCaller } from '../setup';
import { createMockUserRow } from '@/test/fixtures/users';

describe('auth.signin', () => {
  const validInput = {
    email: 'test@example.com',
    password: 'TestPass123!',
  };

  describe('success cases', () => {
    it('should sign in with valid credentials', async () => {
      const { caller, mockQuery, cookies } = createTestCaller(null);

      const hashedPassword = await bcrypt.hash(validInput.password, 10);
      const userRow = createMockUserRow({
        email: validInput.email,
        password_hash: hashedPassword,
      });

      mockQuery('users', { data: userRow, error: null });

      const result = await caller.auth.signin(validInput);

      expect(result.user.email).toBe(validInput.email);
      expect(result.token).toBeDefined();
      expect(cookies.setAuthCookie).toHaveBeenCalled();
    });

    it('should update last_sign_in_at on successful login', async () => {
      // Verify supabase.update is called with last_sign_in_at
    });

    it('should reset monthly counters if new month', async () => {
      // Test monthly reset logic
    });
  });

  describe('error cases', () => {
    it('should reject invalid email', async () => {
      const { caller, mockQuery } = createTestCaller(null);

      mockQuery('users', { data: null, error: { code: 'PGRST116' } as any });

      await expect(caller.auth.signin(validInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    });

    it('should reject invalid password', async () => {
      const { caller, mockQuery } = createTestCaller(null);

      const hashedPassword = await bcrypt.hash('DifferentPassword', 10);
      mockQuery('users', {
        data: createMockUserRow({ password_hash: hashedPassword }),
        error: null
      });

      await expect(caller.auth.signin(validInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    });
  });
});
```

### Task 1.6: Auth Signout Tests

**File:** `test/integration/auth/signout.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../setup';
import { freeTierUser } from '@/test/fixtures/users';

describe('auth.signout', () => {
  it('should clear auth cookie on signout', async () => {
    const { caller, cookies } = createTestCaller(freeTierUser);

    const result = await caller.auth.signout();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Signed out successfully');
    expect(cookies.clearAuthCookie).toHaveBeenCalled();
  });

  it('should work even when not authenticated', async () => {
    const { caller, cookies } = createTestCaller(null);

    const result = await caller.auth.signout();

    expect(result.success).toBe(true);
    expect(cookies.clearAuthCookie).toHaveBeenCalled();
  });
});
```

### Deliverables
- [ ] `test/mocks/cookies.ts`
- [ ] `test/mocks/supabase.ts` (enhanced with count)
- [ ] `test/integration/setup.ts`
- [ ] `test/integration/auth/signup.test.ts`
- [ ] `test/integration/auth/signin.test.ts`
- [ ] `test/integration/auth/signout.test.ts`

---

## Builder 2: Dreams Tests + Fixtures

**Focus:** Create dreams fixtures and dreams router tests

### Task 2.1: Dreams Fixtures

**File:** `test/fixtures/dreams.ts`

```typescript
// test/fixtures/dreams.ts

/**
 * Dream database row type
 */
export interface DreamRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  category: string;
  priority: number;
  status: 'active' | 'achieved' | 'archived' | 'released';
  achieved_at: string | null;
  archived_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a mock dream row with sensible defaults
 */
export const createMockDream = (overrides: Partial<DreamRow> = {}): DreamRow => ({
  id: 'dream-uuid-1234',
  user_id: 'test-user-uuid-1234',
  title: 'Learn to play guitar',
  description: 'Master basic chords and play my favorite songs',
  target_date: '2025-12-31',
  category: 'creative',
  priority: 5,
  status: 'active',
  achieved_at: null,
  archived_at: null,
  released_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// =============================================================================
// Pre-configured Dream Scenarios
// =============================================================================

/**
 * Active dream - default state
 */
export const activeDream = createMockDream({
  id: 'active-dream-001',
  title: 'Learn guitar',
  status: 'active',
});

/**
 * Achieved dream - completed successfully
 */
export const achievedDream = createMockDream({
  id: 'achieved-dream-001',
  title: 'Run a marathon',
  status: 'achieved',
  achieved_at: new Date().toISOString(),
});

/**
 * Archived dream - put on hold
 */
export const archivedDream = createMockDream({
  id: 'archived-dream-001',
  title: 'Write a novel',
  status: 'archived',
  archived_at: new Date().toISOString(),
});

/**
 * Released dream - let go intentionally
 */
export const releasedDream = createMockDream({
  id: 'released-dream-001',
  title: 'Become an astronaut',
  status: 'released',
  released_at: new Date().toISOString(),
});

/**
 * Dream with no target date
 */
export const openEndedDream = createMockDream({
  id: 'open-dream-001',
  title: 'Learn to meditate',
  target_date: null,
  description: null,
});

/**
 * High priority dream
 */
export const highPriorityDream = createMockDream({
  id: 'high-priority-001',
  title: 'Urgent career goal',
  priority: 10,
  category: 'career',
});

/**
 * Dream with past target date (overdue)
 */
export const overdueDream = createMockDream({
  id: 'overdue-dream-001',
  title: 'Finish project',
  target_date: '2024-01-01',
});

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates multiple dreams for a user
 */
export const createMockDreams = (
  count: number,
  userId: string = 'test-user-uuid-1234'
): DreamRow[] =>
  Array.from({ length: count }, (_, index) =>
    createMockDream({
      id: `dream-${index + 1}`,
      user_id: userId,
      title: `Dream ${index + 1}`,
      priority: (index % 10) + 1,
    })
  );

/**
 * Creates a dream for a specific user
 */
export const createDreamForUser = (
  userId: string,
  overrides: Partial<DreamRow> = {}
): DreamRow =>
  createMockDream({
    user_id: userId,
    ...overrides,
  });

/**
 * Creates dreams at tier limit (2 for free tier)
 */
export const createFreeTierDreams = (userId: string): DreamRow[] => [
  createMockDream({ id: 'dream-1', user_id: userId, title: 'Dream 1' }),
  createMockDream({ id: 'dream-2', user_id: userId, title: 'Dream 2' }),
];

/**
 * Creates dreams at pro tier limit (5 dreams)
 */
export const createProTierDreams = (userId: string): DreamRow[] =>
  createMockDreams(5, userId);
```

### Task 2.2: Dreams Create Tests

**File:** `test/integration/dreams/create.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../setup';
import { freeTierUser, proTierUser, unlimitedTierUser } from '@/test/fixtures/users';
import { createMockDream, createFreeTierDreams } from '@/test/fixtures/dreams';

describe('dreams.create', () => {
  const validInput = {
    title: 'Learn Spanish',
    description: 'Become conversational in 6 months',
    targetDate: '2025-12-31',
    category: 'educational' as const,
    priority: 7,
  };

  describe('success cases', () => {
    it('should create a dream for authenticated user', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Mock: user has 0 active dreams
      // Mock: insert succeeds
      const newDream = createMockDream({
        title: validInput.title,
        user_id: freeTierUser.id,
      });

      mockQueries({
        dreams: { data: newDream, error: null, count: 0 },
      });

      const result = await caller.dreams.create(validInput);

      expect(result.dream.title).toBe(validInput.title);
      expect(result.usage.dreamsUsed).toBeDefined();
    });

    it('should return usage statistics after creation', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: createMockDream(), error: null, count: 1 },
      });

      const result = await caller.dreams.create(validInput);

      expect(result.usage).toMatchObject({
        dreamsUsed: expect.any(Number),
        dreamsLimit: expect.any(Number),
        dreamLimitReached: expect.any(Boolean),
      });
    });

    it('should allow unlimited tier to create many dreams', async () => {
      const { caller, mockQueries } = createTestCaller(unlimitedTierUser);

      mockQueries({
        dreams: { data: createMockDream(), error: null, count: 100 },
      });

      const result = await caller.dreams.create(validInput);

      expect(result.dream).toBeDefined();
      expect(result.usage.dreamLimitReached).toBe(false);
    });
  });

  describe('tier limits', () => {
    it('should enforce 2-dream limit for free tier', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Mock: user already has 2 active dreams
      mockQueries({
        dreams: { data: null, error: null, count: 2 },
      });

      await expect(caller.dreams.create(validInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('limit reached'),
      });
    });

    it('should enforce 5-dream limit for pro tier', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        dreams: { data: null, error: null, count: 5 },
      });

      await expect(caller.dreams.create(validInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('limit reached'),
      });
    });

    it('should allow pro tier to create when under limit', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        dreams: { data: createMockDream(), error: null, count: 3 },
      });

      const result = await caller.dreams.create(validInput);
      expect(result.dream).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should require a title', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.dreams.create({ ...validInput, title: '' })
      ).rejects.toThrow();
    });

    it('should limit title length to 200 characters', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.dreams.create({ ...validInput, title: 'x'.repeat(201) })
      ).rejects.toThrow();
    });

    it('should validate category enum', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.dreams.create({ ...validInput, category: 'invalid' as any })
      ).rejects.toThrow();
    });

    it('should clamp priority between 1 and 10', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.dreams.create({ ...validInput, priority: 11 })
      ).rejects.toThrow();
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.dreams.create(validInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
```

### Task 2.3: Dreams List Tests

**File:** `test/integration/dreams/list.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../setup';
import { freeTierUser } from '@/test/fixtures/users';
import {
  activeDream,
  achievedDream,
  archivedDream,
  createMockDreams
} from '@/test/fixtures/dreams';

describe('dreams.list', () => {
  describe('success cases', () => {
    it('should list all dreams for user', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const dreams = createMockDreams(3, freeTierUser.id);
      mockQueries({
        dreams: { data: dreams, error: null },
        reflections: { data: [], error: null, count: 0 },
      });

      const result = await caller.dreams.list({});

      expect(result).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: [achievedDream], error: null },
        reflections: { data: [], error: null, count: 0 },
      });

      const result = await caller.dreams.list({ status: 'achieved' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('achieved');
    });

    it('should include stats when requested', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: [activeDream], error: null },
        reflections: { data: [], error: null, count: 5 },
      });

      const result = await caller.dreams.list({ includeStats: true });

      expect(result[0]).toHaveProperty('reflectionCount');
      expect(result[0]).toHaveProperty('lastReflectionAt');
      expect(result[0]).toHaveProperty('daysLeft');
    });

    it('should calculate daysLeft correctly', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const dreamWithDate = {
        ...activeDream,
        target_date: futureDate.toISOString().split('T')[0],
      };

      mockQueries({
        dreams: { data: [dreamWithDate], error: null },
        reflections: { data: [], error: null, count: 0 },
      });

      const result = await caller.dreams.list({ includeStats: true });

      expect(result[0].daysLeft).toBeGreaterThan(25);
      expect(result[0].daysLeft).toBeLessThanOrEqual(30);
    });

    it('should return null daysLeft for dreams without target date', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: [{ ...activeDream, target_date: null }], error: null },
        reflections: { data: [], error: null, count: 0 },
      });

      const result = await caller.dreams.list({});

      expect(result[0].daysLeft).toBeNull();
    });
  });

  describe('ordering', () => {
    it('should order by created_at descending', async () => {
      // Test default ordering
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.dreams.list({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
```

### Task 2.4: Dreams CRUD Tests

**File:** `test/integration/dreams/crud.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../setup';
import { freeTierUser } from '@/test/fixtures/users';
import { activeDream, createMockDream } from '@/test/fixtures/dreams';

describe('dreams.get', () => {
  it('should get a single dream by ID', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    mockQueries({
      dreams: { data: activeDream, error: null },
      reflections: { data: [], error: null, count: 0 },
    });

    const result = await caller.dreams.get({ id: activeDream.id });

    expect(result.id).toBe(activeDream.id);
    expect(result.title).toBe(activeDream.title);
  });

  it('should throw NOT_FOUND for non-existent dream', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    mockQueries({
      dreams: { data: null, error: { code: 'PGRST116' } as any },
    });

    await expect(
      caller.dreams.get({ id: 'non-existent-id' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should not return other users dreams', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    const otherUserDream = createMockDream({ user_id: 'other-user-id' });
    mockQueries({
      dreams: { data: null, error: { code: 'PGRST116' } as any },
    });

    await expect(
      caller.dreams.get({ id: otherUserDream.id })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('dreams.update', () => {
  it('should update dream fields', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    const updatedDream = { ...activeDream, title: 'Updated Title' };
    mockQueries({
      dreams: { data: updatedDream, error: null },
    });

    const result = await caller.dreams.update({
      id: activeDream.id,
      title: 'Updated Title',
    });

    expect(result.title).toBe('Updated Title');
  });

  it('should verify ownership before update', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    mockQueries({
      dreams: { data: null, error: { code: 'PGRST116' } as any },
    });

    await expect(
      caller.dreams.update({ id: 'other-user-dream', title: 'Hacked' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('dreams.updateStatus', () => {
  it('should update status to achieved', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    const achievedDream = {
      ...activeDream,
      status: 'achieved',
      achieved_at: expect.any(String),
    };
    mockQueries({
      dreams: { data: achievedDream, error: null },
    });

    const result = await caller.dreams.updateStatus({
      id: activeDream.id,
      status: 'achieved',
    });

    expect(result.status).toBe('achieved');
  });

  it('should set timestamp for status changes', async () => {
    // Test achieved_at, archived_at, released_at
  });
});

describe('dreams.delete', () => {
  it('should delete a dream', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    mockQueries({
      dreams: { data: { id: activeDream.id }, error: null },
    });

    const result = await caller.dreams.delete({ id: activeDream.id });

    expect(result.success).toBe(true);
  });

  it('should verify ownership before delete', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    mockQueries({
      dreams: { data: null, error: { code: 'PGRST116' } as any },
    });

    await expect(
      caller.dreams.delete({ id: 'other-user-dream' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('dreams.getLimits', () => {
  it('should return correct limits for free tier', async () => {
    const { caller, mockQueries } = createTestCaller(freeTierUser);

    mockQueries({
      dreams: { data: null, error: null, count: 1 },
    });

    const result = await caller.dreams.getLimits();

    expect(result.tier).toBe('free');
    expect(result.dreamsLimit).toBe(2);
    expect(result.dreamsUsed).toBe(1);
    expect(result.dreamsRemaining).toBe(1);
    expect(result.canCreate).toBe(true);
  });
});
```

### Deliverables
- [ ] `test/fixtures/dreams.ts`
- [ ] `test/integration/dreams/create.test.ts`
- [ ] `test/integration/dreams/list.test.ts`
- [ ] `test/integration/dreams/crud.test.ts`

---

## Builder 3: Additional Router Tests

**Focus:** Create tests for users.me and reflections.list (simple cases)

### Task 3.1: Users Me Tests

**File:** `test/integration/users/me.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../setup';
import {
  freeTierUser,
  proTierUser,
  adminUser,
  demoUser
} from '@/test/fixtures/users';

describe('users.me', () => {
  describe('success cases', () => {
    it('should return current user for authenticated request', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.me();

      expect(result.id).toBe(freeTierUser.id);
      expect(result.email).toBe(freeTierUser.email);
      expect(result.tier).toBe(freeTierUser.tier);
    });

    it('should return pro tier user data', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.auth.me();

      expect(result.tier).toBe('pro');
      expect(result.subscriptionPeriod).toBe('monthly');
    });

    it('should include admin flag for admin users', async () => {
      const { caller } = createTestCaller(adminUser);

      const result = await caller.auth.me();

      expect(result.isAdmin).toBe(true);
    });

    it('should include demo flag for demo users', async () => {
      const { caller } = createTestCaller(demoUser);

      const result = await caller.auth.me();

      expect(result.isDemo).toBe(true);
    });
  });

  describe('user properties', () => {
    it('should include usage statistics', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.me();

      expect(result).toHaveProperty('reflectionCountThisMonth');
      expect(result).toHaveProperty('totalReflections');
      expect(result).toHaveProperty('clarifySessionsThisMonth');
    });

    it('should include preferences', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.me();

      expect(result.preferences).toBeDefined();
      expect(result.preferences).toHaveProperty('default_tone');
      expect(result.preferences).toHaveProperty('notification_email');
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.me()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
```

### Task 3.2: Reflections List Tests

**File:** `test/integration/reflections/list.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../setup';
import { freeTierUser, proTierUser } from '@/test/fixtures/users';

// Simple reflection fixture (inline for now)
const createMockReflection = (overrides = {}) => ({
  id: 'reflection-uuid-1234',
  user_id: 'test-user-uuid-1234',
  dream_id: 'dream-uuid-1234',
  dream: 'I want to learn guitar',
  plan: 'Practice 30 minutes daily',
  has_date: 'yes',
  dream_date: '2025-12-31',
  relationship: 'This dream connects me to my creative side',
  offering: 'Time and dedication',
  ai_response: 'Your journey with guitar speaks to...',
  tone: 'fusion',
  is_premium: false,
  word_count: 350,
  estimated_read_time: 2,
  title: 'Learning Guitar',
  tags: ['creativity', 'music'],
  rating: null,
  user_feedback: null,
  view_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('reflections.list', () => {
  describe('success cases', () => {
    it('should list reflections for authenticated user', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const reflections = [
        createMockReflection({ id: 'ref-1' }),
        createMockReflection({ id: 'ref-2' }),
      ];

      mockQueries({
        reflections: { data: reflections, error: null, count: 2 },
      });

      const result = await caller.reflections.list({});

      expect(result.reflections).toHaveLength(2);
    });

    it('should support pagination', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        reflections: { data: [createMockReflection()], error: null, count: 10 },
      });

      const result = await caller.reflections.list({
        page: 1,
        pageSize: 5
      });

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('reflections');
    });

    it('should filter by tone', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        reflections: {
          data: [createMockReflection({ tone: 'gentle' })],
          error: null,
          count: 1
        },
      });

      const result = await caller.reflections.list({ tone: 'gentle' });

      expect(result.reflections[0].tone).toBe('gentle');
    });

    it('should filter by isPremium', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        reflections: {
          data: [createMockReflection({ is_premium: true })],
          error: null,
          count: 1
        },
      });

      const result = await caller.reflections.list({ isPremium: true });

      expect(result.reflections[0].is_premium).toBe(true);
    });

    it('should support search by dream content', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        reflections: {
          data: [createMockReflection({ dream: 'guitar learning journey' })],
          error: null,
          count: 1
        },
      });

      const result = await caller.reflections.list({ search: 'guitar' });

      expect(result.reflections).toHaveLength(1);
    });
  });

  describe('sorting', () => {
    it('should sort by created_at descending by default', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const older = createMockReflection({
        id: 'old',
        created_at: '2024-01-01'
      });
      const newer = createMockReflection({
        id: 'new',
        created_at: '2025-01-01'
      });

      mockQueries({
        reflections: { data: [newer, older], error: null, count: 2 },
      });

      const result = await caller.reflections.list({});

      // Should be ordered newest first
      expect(result.reflections[0].id).toBe('new');
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.reflections.list({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
```

### Task 3.3: Auth verifyToken Tests

**File:** `test/integration/auth/verify-token.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../setup';
import { freeTierUser } from '@/test/fixtures/users';

describe('auth.verifyToken', () => {
  describe('success cases', () => {
    it('should return user for valid token', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.verifyToken();

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(freeTierUser.id);
      expect(result.message).toBe('Token valid');
    });
  });

  describe('error cases', () => {
    it('should throw UNAUTHORIZED for missing token', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.verifyToken()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Invalid'),
      });
    });
  });
});
```

### Deliverables
- [ ] `test/integration/users/me.test.ts`
- [ ] `test/integration/reflections/list.test.ts`
- [ ] `test/integration/auth/verify-token.test.ts`

---

## Summary

| Builder | Primary Files | Test Count (Est.) |
|---------|---------------|-------------------|
| Builder 1 | setup.ts, cookies mock, auth tests | ~15 tests |
| Builder 2 | dreams fixtures, dreams tests | ~20 tests |
| Builder 3 | users/reflections tests | ~12 tests |

**Total estimated tests:** ~47 integration tests

## Integration Notes

- Builder 1's `setup.ts` is required by Builder 2 and 3
- All builders can work in parallel once setup.ts is created
- Dreams fixtures (Builder 2) are self-contained
- Reflections fixtures can be inline in Builder 3's tests (simple cases only)
