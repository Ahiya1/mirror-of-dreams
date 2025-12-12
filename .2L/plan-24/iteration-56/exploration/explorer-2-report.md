# Explorer 2 Report: Auth Router, Cookies Module, Supabase Client, tRPC Core Analysis

## Executive Summary

This analysis covers four critical server-side modules with coverage ranging from 0% to 70%. The auth router has existing tests but gaps in verifyToken, updateProfile error handling, and deleteAccount flows. The cookies and supabase modules are nearly untested due to reliance on Next.js runtime APIs. The tRPC error formatter has no test coverage for Sentry and Zod error handling. Existing mocking infrastructure is mature and can be extended to cover all gaps.

## Current Coverage Breakdown

| File | Lines | Branches | Functions | Uncovered Lines |
|------|-------|----------|-----------|-----------------|
| `server/trpc/routers/auth.ts` | 70.21% | 71.66% | 66.66% | 266-287, 359-401 |
| `server/lib/cookies.ts` | 33.33% | 0% | 0% | 24-41 |
| `server/lib/supabase.ts` | 0% | 0% | 100%* | 6-9 |
| `server/trpc/trpc.ts` | 57.14% | 0% | 0% | 13-30 |

*Note: Supabase shows 100% function coverage because it only exports a constant, but line coverage is 0%

## Detailed Analysis by File

### 1. Auth Router (`server/trpc/routers/auth.ts`)

**Covered Procedures:**
- `signup` - Comprehensive tests for success, duplicate email, validation, and DB errors
- `signin` - Tested for valid/invalid credentials, monthly reset, case-insensitive email
- `signout` - Tested for all user types
- `loginDemo` - JWT generation, demo flag, error handling
- `changePassword` - Validation, bcrypt hashing, error handling

**Uncovered Procedures/Branches:**

#### `verifyToken` (Lines 234-246)
```typescript
verifyToken: publicProcedure.query(async ({ ctx }) => {
  if (!ctx.user) {  // Untested: UNAUTHORIZED path
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
  return { user: ctx.user, message: 'Token valid' };  // Untested: success path
});
```

#### `me` (Line 260-262)
```typescript
me: protectedProcedure.query(async ({ ctx }) => {
  return ctx.user;  // Untested
});
```

#### `updateProfile` Error Handling (Lines 266-287)
```typescript
// Untested: Supabase error path
if (error) {
  authLogger.error(...);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to update profile',
  });
}
```

#### `deleteAccount` (Lines 359-401)
Entire procedure untested:
- Email confirmation mismatch
- User not found
- Password verification
- Actual deletion
- Database error handling

### 2. Cookies Module (`server/lib/cookies.ts`)

**Module Structure:**
```typescript
// Lines 5-18: Constants (tested indirectly)
export const AUTH_COOKIE_NAME = 'auth_token';
export const COOKIE_OPTIONS = { ... };
export const DEMO_COOKIE_OPTIONS = { ... };

// Lines 22-26: setAuthCookie (0% coverage)
export async function setAuthCookie(token: string, isDemo = false): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, isDemo ? DEMO_COOKIE_OPTIONS : COOKIE_OPTIONS);
}

// Lines 30-34: getAuthCookie (0% coverage)
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

// Lines 38-42: clearAuthCookie (0% coverage)
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
```

**Challenge:** These functions call `cookies()` from `next/headers`, which requires Next.js server component context. The functions are currently mocked in integration tests but the actual implementation is untested.

### 3. Supabase Client (`server/lib/supabase.ts`)

**Module Structure:**
```typescript
// Lines 6-9: Client initialization (0% coverage)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

**Challenge:** This is a singleton initialization module. Testing requires:
1. Environment variable handling verification
2. Client creation validation
3. Placeholder fallback behavior

### 4. tRPC Core (`server/trpc/trpc.ts`)

**Uncovered: Error Formatter (Lines 11-40)**
```typescript
errorFormatter({ shape, error, ctx }) {
  // Lines 13-28: Sentry capture logic (untested)
  if (error.code !== 'UNAUTHORIZED' && error.code !== 'FORBIDDEN') {
    Sentry.captureException(error.cause ?? error, {
      user: ctx?.user ? { id: ctx.user.id, email: ctx.user.email } : undefined,
      tags: { trpcCode: error.code },
      extra: { trpcPath: shape.data?.path },
    });
  }

  // Lines 30-39: Zod error flattening (untested)
  return {
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof Error && error.cause.name === 'ZodError'
          ? (error.cause as any).flatten()
          : null,
    },
  };
}
```

## Existing Mocking Infrastructure

### Cookie Mock (`test/mocks/cookies.ts`)
```typescript
export const createCookieMock = () => ({
  getAuthCookie: vi.fn().mockResolvedValue(null),
  setAuthCookie: vi.fn().mockResolvedValue(undefined),
  clearAuthCookie: vi.fn().mockResolvedValue(undefined),
});
```

### Supabase Mock (`test/mocks/supabase.ts`)
Comprehensive mock with:
- `createSupabaseQueryMock<T>` - Chainable query builder
- `createSupabaseAuthMock` - Auth operations
- `createSupabaseStorageMock` - Storage operations
- `createSupabaseMock` - Full client mock
- `supabaseErrors` - Common error scenarios

### Integration Test Setup (`test/integration/setup.ts`)
- Pre-configured mocks via `vi.hoisted()`
- `createTestCaller(user)` helper for authenticated tests
- Rate limiter bypass
- Logger suppression
- Email mock

## Recommended Test Cases

### P0: Auth Router Gaps

#### 1. verifyToken Tests
```typescript
describe('auth.verifyToken', () => {
  it('should return user data for valid token', async () => {
    const { caller } = createTestCaller(freeTierUser);
    const result = await caller.auth.verifyToken();
    expect(result.user).toEqual(freeTierUser);
    expect(result.message).toBe('Token valid');
  });

  it('should throw UNAUTHORIZED for unauthenticated request', async () => {
    const { caller } = createTestCaller(null);
    await expect(caller.auth.verifyToken()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  });
});
```

#### 2. me Tests
```typescript
describe('auth.me', () => {
  it('should return current user for authenticated request', async () => {
    const { caller } = createTestCaller(proTierUser);
    const result = await caller.auth.me();
    expect(result).toEqual(proTierUser);
  });

  it('should throw UNAUTHORIZED for unauthenticated request', async () => {
    const { caller } = createTestCaller(null);
    await expect(caller.auth.me()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
```

#### 3. updateProfile Error Tests
```typescript
describe('auth.updateProfile error handling', () => {
  it('should throw INTERNAL_SERVER_ERROR on database error', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);
    supabase.from.mockImplementation(() => createPartialMock({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      }),
    }));

    await expect(caller.auth.updateProfile({ name: 'New Name' }))
      .rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
  });
});
```

#### 4. deleteAccount Tests
```typescript
describe('auth.deleteAccount', () => {
  it('should delete account with correct credentials', async () => {
    // Setup with mocked user and password hash
  });

  it('should reject mismatched email confirmation', async () => {
    const { caller } = createTestCaller(freeTierUser);
    await expect(caller.auth.deleteAccount({
      confirmEmail: 'wrong@email.com',
      password: 'password123',
    })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Email confirmation does not match',
    });
  });

  it('should reject incorrect password', async () => {
    // Setup with correct email but wrong password
  });

  it('should handle user not found', async () => {
    // Mock supabase to return null user
  });

  it('should handle deletion database error', async () => {
    // Mock supabase delete to return error
  });
});
```

### P1: Cookies Module Tests

**Approach:** Create unit tests that directly mock `next/headers` cookies()

```typescript
// test/unit/server/lib/cookies.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock next/headers at module level
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

import { setAuthCookie, getAuthCookie, clearAuthCookie, AUTH_COOKIE_NAME, COOKIE_OPTIONS, DEMO_COOKIE_OPTIONS } from '@/server/lib/cookies';

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

    it('should set cookie with demo options for demo users', async () => {
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

### P1: Supabase Client Tests

```typescript
// test/unit/server/lib/supabase.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Store original env
const originalEnv = process.env;

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
    
    // Dynamic import to get fresh module
    const { supabase } = await import('@/server/lib/supabase');
    
    // Verify client was created (mock createClient to capture args)
    expect(supabase).toBeDefined();
  });

  it('should use placeholder values when env vars missing', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const { supabase } = await import('@/server/lib/supabase');
    expect(supabase).toBeDefined();
  });
});
```

### P1: tRPC Error Formatter Tests

```typescript
// test/unit/server/trpc/trpc.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { ZodError, z } from 'zod';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('tRPC error formatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sentry capture', () => {
    it('should capture non-auth errors to Sentry', async () => {
      // Trigger an INTERNAL_SERVER_ERROR through a procedure
      const { caller, supabase } = createTestCaller(freeTierUser);
      supabase.from.mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      }));

      try {
        await caller.auth.updateProfile({ name: 'Test' });
      } catch {
        // Expected error
      }

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should NOT capture UNAUTHORIZED errors to Sentry', async () => {
      const { caller } = createTestCaller(null);
      
      try {
        await caller.auth.me();
      } catch {
        // Expected error
      }

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should NOT capture FORBIDDEN errors to Sentry', async () => {
      // Create free tier user and try to access premium feature
      const { caller } = createTestCaller(freeTierUser);
      
      try {
        await caller.clarify.createSession({ title: 'Test' });
      } catch {
        // Expected FORBIDDEN error
      }

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should include user context in Sentry capture', async () => {
      // Trigger error with authenticated user
      const { caller, supabase } = createTestCaller(proTierUser);
      // Setup error scenario...
      
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
        // Send invalid data that fails Zod validation
        await caller.auth.signup({
          email: 'not-an-email',
          password: '123', // too short
          name: '',
          language: 'invalid' as any,
        });
      } catch (error: any) {
        expect(error.data?.zodError).toBeDefined();
        expect(error.data.zodError.fieldErrors).toBeDefined();
      }
    });

    it('should return null zodError for non-Zod errors', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);
      supabase.from.mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      }));

      try {
        await caller.auth.updateProfile({ name: 'Test' });
      } catch (error: any) {
        expect(error.data?.zodError).toBeNull();
      }
    });
  });
});
```

## Priority Ordering

### P0 - Must Have (Critical Gaps)

1. **deleteAccount Tests** (Lines 359-401) - Destructive operation without tests
   - ~8 test cases
   - Uses existing mocking patterns

2. **verifyToken Tests** (Lines 234-246) - Auth validation untested
   - ~2 test cases
   - Simple to implement

3. **me Tests** (Line 260-262) - Basic auth query untested
   - ~2 test cases
   - Simple to implement

4. **updateProfile Error Tests** (Lines 266-287) - Error handling gaps
   - ~3 test cases
   - Extend existing patterns

### P1 - Should Have (Module Coverage)

5. **Cookies Module Tests** - Complete function coverage
   - ~5 test cases
   - Requires next/headers mock

6. **tRPC Error Formatter Tests** - Sentry and Zod handling
   - ~6 test cases
   - Requires Sentry mock

7. **Supabase Client Tests** - Initialization verification
   - ~3 test cases
   - Environment variable handling

### P2 - Nice to Have (Edge Cases)

8. **Signup email verification branch tests** - Token error handling
9. **Signin additional edge cases** - Database error handling

## Mocking Requirements

### Required New Mocks

#### 1. Sentry Mock
```typescript
// test/mocks/sentry.ts
import { vi } from 'vitest';

export const createSentryMock = () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setExtra: vi.fn(),
  withScope: vi.fn((callback) => callback({ setTag: vi.fn(), setExtra: vi.fn() })),
});

export const sentryMock = createSentryMock();
```

#### 2. Enhanced Next.js Headers Mock
```typescript
// test/mocks/next-headers.ts
import { vi } from 'vitest';

export const createCookieStoreMock = () => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
  getAll: vi.fn().mockReturnValue([]),
});

export const cookieStoreMock = createCookieStoreMock();

// Usage in vi.mock:
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(cookieStoreMock),
  headers: vi.fn().mockReturnValue(new Headers()),
}));
```

### Existing Mocks to Extend

The integration test setup already provides comprehensive mocking. The key patterns are:

1. **vi.hoisted()** for mock creation before module loading
2. **createTestCaller(user)** for authenticated test contexts
3. **createPartialMock()** for flexible Supabase query mocking

## Test File Structure

```
test/
  unit/
    server/
      lib/
        cookies.test.ts       # NEW - Direct cookie function tests
        supabase.test.ts      # NEW - Client initialization tests
      trpc/
        trpc.test.ts          # NEW - Error formatter tests
  integration/
    auth/
      verify-token.test.ts    # NEW - Token verification tests
      me.test.ts              # NEW - Current user tests
      delete-account.test.ts  # NEW - Account deletion tests
      update-profile.test.ts  # NEW - Profile update error tests
```

## Estimated Test Count

| Category | Tests |
|----------|-------|
| Auth Router Gaps | ~15 |
| Cookies Module | ~5 |
| Supabase Client | ~3 |
| tRPC Error Formatter | ~6 |
| **Total** | **~29** |

## Risks and Challenges

### Technical Risks

1. **Next.js Headers Mocking** - The `cookies()` function from `next/headers` is designed for server components. Mocking requires careful module isolation.
   - **Mitigation:** Use vi.mock at module level before imports

2. **Module Re-initialization** - Testing supabase.ts requires module reset between tests due to singleton pattern.
   - **Mitigation:** Use vi.resetModules() and dynamic imports

3. **Sentry Integration** - Error formatter tests need to verify Sentry calls without actual network requests.
   - **Mitigation:** Complete Sentry mock with all used methods

### Coverage Considerations

- Some lines may be unreachable in tests (environment checks at module load)
- Istanbul may report branches as uncovered due to short-circuit evaluation
- tRPC error formatter may need integration-style tests to trigger properly

## Questions for Planner

1. Should cookies module tests be unit tests (mocking next/headers directly) or integration tests (extending existing setup)?

2. For deleteAccount tests, should we test actual cascade deletion behavior or just the router logic?

3. Should Sentry mock be added to the global test setup or only for specific test files?
