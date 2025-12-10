# Integration Testing Patterns

## Test File Organization

```typescript
// test/integration/{router-name}/{procedure}.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCaller } from '../setup';
import { freeTierUser, proTierUser } from '@/test/fixtures/users';
import { createMockDream } from '@/test/fixtures/dreams';

describe('{router}.{procedure}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should {expected behavior}', async () => {
      // Arrange
      const { caller, mockQuery } = createTestCaller(freeTierUser);
      mockQuery('table', { data: expectedData, error: null });

      // Act
      const result = await caller.router.procedure(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });

  describe('error cases', () => {
    it('should throw {error} when {condition}', async () => {
      // ...
    });
  });
});
```

## Test Caller Pattern

```typescript
// test/integration/setup.ts

import { vi } from 'vitest';
import { appRouter } from '@/server/trpc/routers/_app';
import { createSupabaseMock, createSupabaseQueryMock } from '@/test/mocks/supabase';
import { createCookieMock } from '@/test/mocks/cookies';
import type { User } from '@/types';

/**
 * Creates a test caller with mocked dependencies
 *
 * @param user - User to inject into context (null for unauthenticated)
 * @returns Test caller and mock utilities
 */
export function createTestCaller(user: User | null = null) {
  const supabaseMock = createSupabaseMock();
  const cookieMock = createCookieMock();

  // Create caller with mocked context
  const caller = appRouter.createCaller({
    user,
    req: new Request('http://localhost:3000'),
  });

  return {
    caller,
    supabase: supabaseMock,
    cookies: cookieMock,

    // Helper to configure specific table responses
    mockQuery: (table: string, response: { data: any; error: any }) => {
      supabaseMock.from.mockImplementation((t: string) => {
        if (t === table) {
          return createSupabaseQueryMock(response);
        }
        return createSupabaseQueryMock({ data: null, error: null });
      });
    },

    // Helper for multi-table mocking
    mockQueries: (tableResponses: Record<string, { data: any; error: any }>) => {
      supabaseMock.from.mockImplementation((table: string) => {
        const response = tableResponses[table] || { data: null, error: null };
        return createSupabaseQueryMock(response);
      });
    },
  };
}
```

## Supabase Mock Usage

### Basic Query Mock
```typescript
const { caller, mockQuery } = createTestCaller(freeTierUser);

// Mock a successful query
mockQuery('users', {
  data: { id: 'user-1', email: 'test@example.com' },
  error: null
});
```

### Multiple Tables
```typescript
const { caller, mockQueries } = createTestCaller(freeTierUser);

mockQueries({
  dreams: { data: [activeDream], error: null },
  reflections: { data: [], error: null },
});
```

### Count Queries (Enhanced)
```typescript
// For queries using { count: 'exact', head: true }
const queryMock = createSupabaseQueryMock({
  data: null,
  error: null,
  count: 5  // Add count support
});
```

### Error Scenarios
```typescript
import { supabaseErrors } from '@/test/mocks/supabase';

mockQuery('users', {
  data: null,
  error: supabaseErrors.notFound
});
```

## Cookie Mock Pattern

```typescript
// test/mocks/cookies.ts

import { vi } from 'vitest';

export const createCookieMock = () => ({
  getAuthCookie: vi.fn().mockResolvedValue(null),
  setAuthCookie: vi.fn().mockResolvedValue(undefined),
  clearAuthCookie: vi.fn().mockResolvedValue(undefined),
});

// Usage in setup module mock
vi.mock('@/server/lib/cookies', () => ({
  getAuthCookie: cookieMock.getAuthCookie,
  setAuthCookie: cookieMock.setAuthCookie,
  clearAuthCookie: cookieMock.clearAuthCookie,
}));
```

## Fixture Factory Pattern

```typescript
// test/fixtures/dreams.ts

export interface DreamRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  category: string;
  priority: number;
  status: 'active' | 'achieved' | 'archived' | 'released';
  // ... other fields
}

/**
 * Creates a mock dream with sensible defaults
 */
export const createMockDream = (overrides: Partial<DreamRow> = {}): DreamRow => ({
  id: 'dream-uuid-1234',
  user_id: 'test-user-uuid-1234',
  title: 'Learn to play guitar',
  description: 'Master basic chords',
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

// Pre-configured scenarios
export const activeDream = createMockDream();
export const achievedDream = createMockDream({
  status: 'achieved',
  achieved_at: new Date().toISOString()
});
```

## Rate Limiter Bypass

```typescript
// server/lib/rate-limiter.ts (add this pattern)

export async function checkRateLimit(limiter: Limiter, key: string) {
  // Bypass in test environment
  if (process.env.NODE_ENV === 'test') {
    return { success: true, limit: 999, remaining: 999, reset: 0 };
  }

  // Normal rate limiting logic...
}
```

## Test Naming Conventions

```typescript
// Use descriptive test names that read like sentences
describe('auth.signup', () => {
  it('should create a new user with valid credentials', async () => {});
  it('should reject duplicate email addresses', async () => {});
  it('should hash the password before storing', async () => {});
  it('should generate a valid JWT token', async () => {});
  it('should set an HTTP-only auth cookie', async () => {});
});

describe('dreams.create', () => {
  it('should create a dream for authenticated user', async () => {});
  it('should enforce tier limits for free users', async () => {});
  it('should allow unlimited dreams for unlimited tier', async () => {});
  it('should return usage statistics after creation', async () => {});
});
```

## Error Testing Pattern

```typescript
import { TRPCError } from '@trpc/server';

it('should throw UNAUTHORIZED when not authenticated', async () => {
  const { caller } = createTestCaller(null); // No user

  await expect(caller.auth.me()).rejects.toThrow(TRPCError);
  await expect(caller.auth.me()).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
});

it('should throw FORBIDDEN when at tier limit', async () => {
  const { caller, mockQuery } = createTestCaller(freeTierUser);

  // Mock count at limit
  mockQuery('dreams', { data: null, error: null, count: 2 });

  await expect(
    caller.dreams.create({ title: 'New Dream' })
  ).rejects.toMatchObject({
    code: 'FORBIDDEN',
    message: expect.stringContaining('limit reached'),
  });
});
```

## Async/Await Pattern

```typescript
// Always use async/await, not .then()
it('should handle async operations', async () => {
  const { caller } = createTestCaller(proTierUser);

  const result = await caller.dreams.list({ status: 'active' });

  expect(result).toHaveLength(3);
});
```

## Module Mock Hoisting

```typescript
// Module mocks MUST be hoisted to top of file
vi.mock('@/server/lib/supabase', () => ({
  supabase: createSupabaseMock(),
}));

vi.mock('@/server/lib/cookies', () => ({
  getAuthCookie: vi.fn(),
  setAuthCookie: vi.fn(),
  clearAuthCookie: vi.fn(),
}));

// Then import the modules that use them
import { createTestCaller } from '../setup';
```

## Test Data Cleanup

```typescript
// Use beforeEach/afterEach for cleanup
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Assertions

```typescript
// Prefer specific assertions
expect(result.user.email).toBe('test@example.com');

// Not vague ones
expect(result).toBeTruthy();

// Use toMatchObject for partial matching
expect(result).toMatchObject({
  user: { email: 'test@example.com' },
  message: expect.any(String),
});

// Use toContain for arrays
expect(result.tags).toContain('creative');
```
