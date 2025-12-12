# Code Patterns & Conventions

## File Structure

```
test/
├── integration/           # Router/service integration tests
│   ├── auth/             # Auth router tests
│   │   ├── signin.test.ts
│   │   ├── signup.test.ts
│   │   ├── signout.test.ts
│   │   ├── demo.test.ts
│   │   ├── password-reset.test.ts
│   │   ├── verify-token.test.ts    # NEW
│   │   ├── me.test.ts               # NEW
│   │   ├── delete-account.test.ts   # NEW
│   │   └── update-profile.test.ts   # NEW
│   ├── clarify/
│   │   └── clarify.test.ts          # EXTEND
│   └── setup.ts                      # Shared test caller setup
├── unit/                  # Unit tests for isolated modules
│   └── server/
│       ├── lib/
│       │   ├── cookies.test.ts      # NEW
│       │   └── supabase.test.ts     # NEW
│       └── trpc/
│           └── trpc.test.ts         # NEW
├── mocks/                 # Mock factories
│   ├── anthropic.ts       # EXTEND with tool_use helpers
│   ├── supabase.ts
│   └── cookies.ts
└── factories/             # Test data factories
    ├── user.factory.ts
    ├── clarify.factory.ts
    └── dream.factory.ts
```

## Naming Conventions

- Test files: `{module}.test.ts` or `{feature}.test.ts`
- Test IDs: `TC-{MODULE}-{NUMBER}` (e.g., `TC-GL-01` for getLimits test 1)
- Describe blocks: Use actual procedure/function name
- It blocks: Should describe behavior, not implementation

## Import Order Convention

```typescript
// 1. Test framework imports
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 2. Test infrastructure imports (setup, mocks)
import { createTestCaller, anthropicMock, supabaseMock } from '../setup';

// 3. Test factories
import { proTierUser, createMockUser } from '@/test/factories/user.factory';
import { createMockClarifySessionRow } from '@/test/factories/clarify.factory';

// 4. Types (if needed)
import type { User } from '@/types';
```

---

## Integration Test Patterns

### Basic Router Test Structure

**When to use:** Testing tRPC router procedures

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from '../setup';
import { proTierUser, freeTierUser } from '@/test/factories/user.factory';

describe('router.procedureName', () => {
  describe('success cases', () => {
    it('TC-XX-01: should return expected result for valid input', async () => {
      // Arrange
      const { caller, mockQueries } = createTestCaller(proTierUser);
      mockQueries({
        table_name: { data: expectedData, error: null },
      });

      // Act
      const result = await caller.router.procedureName({ input: 'value' });

      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('authorization', () => {
    it('TC-XX-02: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.router.procedureName()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Authentication required'),
      });
    });
  });

  describe('error handling', () => {
    it('TC-XX-03: should throw on database error', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);
      mockQueries({
        table_name: { data: null, error: new Error('DB error') },
      });

      await expect(caller.router.procedureName()).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });
});
```

### Testing Protected Procedures

**When to use:** Procedures with `protectedProcedure` or custom middleware

```typescript
describe('auth.me', () => {
  it('should return current user for authenticated request', async () => {
    const { caller } = createTestCaller(proTierUser);

    const result = await caller.auth.me();

    expect(result).toEqual(proTierUser);
  });

  it('should throw UNAUTHORIZED for null user', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.auth.me()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
```

### Testing Public Procedures

**When to use:** Procedures with `publicProcedure` that may or may not have a user

```typescript
describe('auth.verifyToken', () => {
  it('should return user data when token is valid', async () => {
    const { caller } = createTestCaller(proTierUser);

    const result = await caller.auth.verifyToken();

    expect(result).toEqual({
      user: proTierUser,
      message: 'Token valid',
    });
  });

  it('should throw UNAUTHORIZED when no user in context', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.auth.verifyToken()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  });
});
```

---

## Mock Patterns

### Basic Supabase Query Mock

**When to use:** Single table with single response

```typescript
const { caller, mockQuery } = createTestCaller(proTierUser);

mockQuery('users', {
  data: { id: 'user-123', name: 'Test User' },
  error: null,
});
```

### Multiple Table Mock

**When to use:** Procedure queries multiple tables

```typescript
const { caller, mockQueries } = createTestCaller(proTierUser);

mockQueries({
  users: { data: mockUser, error: null },
  clarify_sessions: { data: mockSessions, error: null },
  clarify_messages: { data: mockMessages, error: null },
});
```

### Sequential Response Mock (NEW PATTERN)

**When to use:** Testing "ownership check succeeds, then operation fails" scenarios

```typescript
import { createTestCaller, supabaseMock, createPartialMock } from '../setup';
import { createSupabaseQueryMock } from '@/test/mocks/supabase';

it('should throw error when update fails after ownership check', async () => {
  const { caller } = createTestCaller(proTierUser);

  // Track call count for sequential responses
  let sessionCallCount = 0;

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'clarify_sessions') {
      sessionCallCount++;
      if (sessionCallCount === 1) {
        // First call: ownership check succeeds
        return createSupabaseQueryMock({
          data: { id: SESSION_ID, user_id: proTierUser.id },
          error: null,
        });
      } else {
        // Second call: update fails
        return createSupabaseQueryMock({
          data: null,
          error: new Error('Database error'),
        });
      }
    }
    return createSupabaseQueryMock({ data: null, error: null });
  });

  await expect(
    caller.clarify.archiveSession({ sessionId: SESSION_ID })
  ).rejects.toMatchObject({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to archive session',
  });
});
```

### Partial Mock Pattern

**When to use:** Fine-grained control over specific query chain methods

```typescript
supabaseMock.from.mockImplementation((table: string) => {
  if (table === 'users') {
    return createPartialMock({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'user-123', password_hash: 'hashed' },
        error: null,
      }),
    });
  }
  return createPartialMock({});
});
```

---

## Anthropic Mock Patterns

### Basic Text Response

**When to use:** Standard AI response without tool use

```typescript
import { anthropicMock } from '../setup';

beforeEach(() => {
  anthropicMock.messages.create.mockResolvedValue({
    id: 'msg_test_123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: 'AI response text here' }],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 50 },
  });
});
```

### Tool Use Response (NEW PATTERN)

**When to use:** Testing createDream tool execution in clarify router

```typescript
// Helper function - add to test/mocks/anthropic.ts
export function mockAnthropicToolUse(
  toolInput: { title: string; category: string },
  followUpText: string
) {
  anthropicMock.messages.create
    .mockResolvedValueOnce({
      id: 'msg_tool_123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_test_123',
          name: 'createDream',
          input: toolInput,
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      stop_reason: 'tool_use',
      stop_sequence: null,
      usage: { input_tokens: 100, output_tokens: 30 },
    })
    .mockResolvedValueOnce({
      id: 'msg_followup_456',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: followUpText }],
      model: 'claude-sonnet-4-5-20250929',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 150, output_tokens: 40 },
    });
}

// Usage in test
it('should handle tool_use response and create dream', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  // Mock tool use response
  mockAnthropicToolUse(
    { title: 'My Dream', category: 'personal_growth' },
    "I've created that dream for you!"
  );

  // Mock database responses
  mockQueries({
    clarify_sessions: { data: mockSession, error: null },
    clarify_messages: { data: null, error: null },
    dreams: { data: { id: 'dream-123', title: 'My Dream' }, error: null },
  });

  const result = await caller.clarify.createSession({
    title: 'Test Session',
    initialMessage: 'Create a dream about personal growth',
  });

  expect(result.initialResponse).toContain("I've created that dream");
  expect(anthropicMock.messages.create).toHaveBeenCalledTimes(2);
});
```

### AI Error Response

**When to use:** Testing error handling when AI call fails

```typescript
import { anthropicErrors } from '@/test/mocks/anthropic';

it('should handle AI API error gracefully', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    clarify_sessions: { data: mockSession, error: null },
  });

  // Make AI call fail
  anthropicMock.messages.create.mockRejectedValue(anthropicErrors.serverError);

  await expect(
    caller.clarify.sendMessage({ sessionId: SESSION_ID, content: 'Hello' })
  ).rejects.toMatchObject({
    code: 'INTERNAL_SERVER_ERROR',
  });
});
```

---

## Unit Test Patterns

### Testing Module Initialization (Supabase)

**When to use:** Testing singleton modules with environment variable handling

```typescript
// test/unit/server/lib/supabase.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Store original env
const originalEnv = process.env;

// Mock createClient before importing the module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: vi.fn() }),
}));

describe('supabase client initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use environment variables when available', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    const { createClient } = await import('@supabase/supabase-js');
    const { supabase } = await import('@/server/lib/supabase');

    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-key'
    );
    expect(supabase).toBeDefined();
  });

  it('should use placeholder values when env vars missing', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createClient } = await import('@supabase/supabase-js');
    await import('@/server/lib/supabase');

    expect(createClient).toHaveBeenCalledWith(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  });
});
```

### Testing Next.js Headers API (Cookies)

**When to use:** Testing functions that use `cookies()` from `next/headers`

```typescript
// test/unit/server/lib/cookies.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Create mock cookie store
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

// Mock next/headers BEFORE importing the module under test
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

// Import after mock is set up
import {
  setAuthCookie,
  getAuthCookie,
  clearAuthCookie,
  AUTH_COOKIE_NAME,
  COOKIE_OPTIONS,
  DEMO_COOKIE_OPTIONS,
} from '@/server/lib/cookies';

describe('cookies module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setAuthCookie', () => {
    it('should set cookie with regular options for normal users', async () => {
      await setAuthCookie('test-token');

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        'test-token',
        COOKIE_OPTIONS
      );
    });

    it('should set cookie with demo options when isDemo is true', async () => {
      await setAuthCookie('demo-token', true);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        'demo-token',
        DEMO_COOKIE_OPTIONS
      );
    });
  });

  describe('getAuthCookie', () => {
    it('should return token value when cookie exists', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'stored-token' });

      const result = await getAuthCookie();

      expect(mockCookieStore.get).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
      expect(result).toBe('stored-token');
    });

    it('should return undefined when cookie does not exist', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getAuthCookie();

      expect(result).toBeUndefined();
    });
  });

  describe('clearAuthCookie', () => {
    it('should delete the auth cookie', async () => {
      await clearAuthCookie();

      expect(mockCookieStore.delete).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
    });
  });
});
```

---

## tRPC Error Formatter Tests

**When to use:** Testing error formatting, Sentry capture, Zod error handling

```typescript
// test/unit/server/trpc/trpc.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import { createTestCaller, supabaseMock } from '@/test/integration/setup';
import { proTierUser, freeTierUser } from '@/test/factories/user.factory';

describe('tRPC error formatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sentry capture behavior', () => {
    it('should capture INTERNAL_SERVER_ERROR to Sentry', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);
      mockQueries({
        users: { data: null, error: new Error('DB Error') },
      });

      try {
        await caller.auth.updateProfile({ name: 'Test' });
      } catch {
        // Expected to throw
      }

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should NOT capture UNAUTHORIZED errors to Sentry', async () => {
      const { caller } = createTestCaller(null);

      try {
        await caller.auth.me();
      } catch {
        // Expected to throw
      }

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should NOT capture FORBIDDEN errors to Sentry', async () => {
      const { caller } = createTestCaller(freeTierUser);

      try {
        await caller.clarify.getLimits();
      } catch {
        // Expected FORBIDDEN
      }

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should include user context in Sentry capture', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);
      mockQueries({
        users: { data: null, error: new Error('DB Error') },
      });

      try {
        await caller.auth.updateProfile({ name: 'Test' });
      } catch {
        // Expected
      }

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          user: {
            id: proTierUser.id,
            email: proTierUser.email,
          },
        })
      );
    });
  });

  describe('Zod error flattening', () => {
    it('should flatten ZodError in response data', async () => {
      const { caller } = createTestCaller(null);

      try {
        await caller.auth.signup({
          email: 'not-an-email',  // Invalid
          password: '123',        // Too short
          name: '',               // Empty
          language: 'en',
        });
      } catch (error: any) {
        expect(error.data?.zodError).toBeDefined();
        expect(error.data.zodError.fieldErrors).toBeDefined();
      }
    });

    it('should return null zodError for non-Zod errors', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);
      mockQueries({
        users: { data: null, error: new Error('DB Error') },
      });

      try {
        await caller.auth.updateProfile({ name: 'Test' });
      } catch (error: any) {
        expect(error.data?.zodError).toBeNull();
      }
    });
  });
});
```

---

## Auth Router Test Patterns

### deleteAccount Procedure Tests

**When to use:** Testing account deletion flow with password verification

```typescript
// test/integration/auth/delete-account.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { createTestCaller, supabaseMock, createPartialMock } from '../setup';
import { proTierUser, createMockUser } from '@/test/factories/user.factory';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe('auth.deleteAccount', () => {
  const userWithHash = createMockUser({
    ...proTierUser,
    password_hash: 'hashed_password',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should reject when email confirmation does not match', async () => {
      const { caller } = createTestCaller(userWithHash);

      await expect(
        caller.auth.deleteAccount({
          confirmEmail: 'wrong@email.com',
          password: 'password123',
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('Email confirmation'),
      });
    });
  });

  describe('password verification', () => {
    it('should reject incorrect password', async () => {
      const { caller } = createTestCaller(userWithHash);

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: userWithHash.id, password_hash: 'hashed_password' },
              error: null,
            }),
          });
        }
        return createPartialMock({});
      });

      // Password does not match
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        caller.auth.deleteAccount({
          confirmEmail: userWithHash.email,
          password: 'wrong_password',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('password'),
      });
    });
  });

  describe('successful deletion', () => {
    it('should delete account with correct credentials', async () => {
      const { caller } = createTestCaller(userWithHash);

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: userWithHash.id, password_hash: 'hashed_password' },
              error: null,
            }),
            delete: vi.fn().mockReturnThis(),
          });
        }
        return createPartialMock({});
      });

      // Password matches
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await caller.auth.deleteAccount({
        confirmEmail: userWithHash.email,
        password: 'correct_password',
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('error handling', () => {
    it('should handle user not found', async () => {
      const { caller } = createTestCaller(userWithHash);

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          });
        }
        return createPartialMock({});
      });

      await expect(
        caller.auth.deleteAccount({
          confirmEmail: userWithHash.email,
          password: 'password',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should handle database deletion error', async () => {
      const { caller } = createTestCaller(userWithHash);

      let userCallCount = 0;
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') {
          userCallCount++;
          if (userCallCount === 1) {
            // First call: get user succeeds
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: userWithHash.id, password_hash: 'hashed' },
                error: null,
              }),
            });
          } else {
            // Second call: delete fails
            return createPartialMock({
              delete: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Deletion failed'),
              }),
            });
          }
        }
        return createPartialMock({});
      });

      (bcrypt.compare as any).mockResolvedValue(true);

      await expect(
        caller.auth.deleteAccount({
          confirmEmail: userWithHash.email,
          password: 'correct_password',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });
});
```

---

## Testing Patterns: Production Mode Requirements

### Test Coverage Expectations

| Module Type | Minimum Coverage | Target Coverage |
|-------------|------------------|-----------------|
| Router Procedures | 85% | 90%+ |
| Utility Functions | 90% | 95%+ |
| Error Handlers | 80% | 90%+ |
| Module Initialization | 80% | 90%+ |

### Test ID Convention

Use format `TC-{MODULE}-{NUMBER}` for traceability:

- `TC-GL-01` - getLimits test 1
- `TC-CS-01` - createSession test 1
- `TC-SM-01` - sendMessage test 1
- `TC-VT-01` - verifyToken test 1
- `TC-DA-01` - deleteAccount test 1
- `TC-CK-01` - cookies test 1
- `TC-SB-01` - supabase test 1
- `TC-EF-01` - error formatter test 1

### Assertion Patterns

```typescript
// For successful operations
expect(result).toEqual(expectedValue);
expect(result).toMatchObject({ key: value });

// For errors
await expect(asyncCall()).rejects.toMatchObject({
  code: 'ERROR_CODE',
  message: expect.stringContaining('partial message'),
});

// For mock verification
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(expectedArgs);
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Common Edge Cases to Test

1. **Empty results:** Query returns `[]` or `null`
2. **Boundary values:** Max length strings, limit boundaries
3. **Invalid UUIDs:** Malformed identifiers
4. **Concurrent state:** Multiple operations on same resource
5. **Missing optional fields:** Partial input objects

---

## Security Testing Patterns

### Auth Boundary Tests

```typescript
// Always test these for protected procedures:

it('should reject unauthenticated user', async () => {
  const { caller } = createTestCaller(null);
  await expect(caller.router.procedure()).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  });
});

it('should reject demo user', async () => {
  const { caller } = createTestCaller(demoUser);
  await expect(caller.router.procedure()).rejects.toMatchObject({
    code: 'FORBIDDEN',
  });
});

it('should reject free tier user (if premium feature)', async () => {
  const { caller } = createTestCaller(freeTierUser);
  await expect(caller.router.procedure()).rejects.toMatchObject({
    code: 'FORBIDDEN',
  });
});
```

### Ownership Verification Tests

```typescript
it('should reject access to another user\'s resource', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);
  mockQueries({
    resource_table: {
      data: { id: 'resource-1', user_id: 'different-user-id' },
      error: null,
    },
  });

  await expect(
    caller.router.procedure({ resourceId: 'resource-1' })
  ).rejects.toMatchObject({
    code: 'NOT_FOUND', // Or FORBIDDEN depending on implementation
  });
});
```

---

## Error Handling Test Patterns

### Database Error Recovery

```typescript
it('should throw INTERNAL_SERVER_ERROR on database error', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);
  mockQueries({
    table_name: { data: null, error: new Error('Database connection failed') },
  });

  await expect(caller.router.procedure()).rejects.toMatchObject({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to perform operation', // Match actual message
  });
});
```

### Input Validation Error

```typescript
it('should reject invalid input format', async () => {
  const { caller } = createTestCaller(proTierUser);

  await expect(
    caller.router.procedure({ id: 'not-a-uuid' })
  ).rejects.toMatchObject({
    code: 'BAD_REQUEST',
  });
});
```

---

## Performance Testing Patterns

### Mock Reset Pattern

Always reset mocks to prevent test pollution:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### Parallel Test Execution

Tests within a file run in parallel by default. Ensure:
- No shared mutable state between tests
- Each test uses fresh `createTestCaller()` instance
- Environment variables set in `beforeEach`, not at module level
