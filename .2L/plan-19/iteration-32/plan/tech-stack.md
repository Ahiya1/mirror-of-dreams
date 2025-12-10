# Tech Stack - Integration Testing

## Testing Framework

### Vitest
- **Version:** Latest (configured in `vitest.config.ts`)
- **Environment:** happy-dom
- **Config:** `vitest.config.ts`
- **Setup:** `vitest.setup.ts`

```typescript
// vitest.config.ts key settings
{
  globals: true,
  environment: 'happy-dom',
  include: ['**/*.test.ts', '**/*.test.tsx'],
  exclude: ['node_modules', '.next', '.2L'],
  setupFiles: ['./vitest.setup.ts'],
}
```

### Test Environment Variables
Set in `vitest.setup.ts`:
- `JWT_SECRET` - Required for auth tests
- `SUPABASE_*` - Database mock URLs
- `ANTHROPIC_API_KEY` - AI mock key
- `PAYPAL_*` - Payment mock keys

## tRPC Testing Approach

### Direct Caller Pattern
Use `appRouter.createCaller()` for unit-style integration tests:

```typescript
import { appRouter } from '@/server/trpc/routers/_app';

const caller = appRouter.createCaller({
  user: mockUser,
  req: new Request('http://localhost:3000'),
});

const result = await caller.auth.signin(input);
```

**Benefits:**
- No HTTP layer overhead
- Direct TypeScript type checking
- Easier mocking of context
- Faster test execution

**Trade-offs:**
- Doesn't test HTTP transport
- Doesn't test middleware at HTTP level

### Context Type
```typescript
// From server/trpc/context.ts
type Context = {
  user: User | null;
  req: Request;
};
```

## Mocking Strategy

### Supabase (Existing Mock)
Location: `test/mocks/supabase.ts`

```typescript
import { createSupabaseMock, createSupabaseQueryMock } from '@/test/mocks/supabase';

// Full client mock
const supabase = createSupabaseMock();

// Chainable query mock
const queryMock = createSupabaseQueryMock({ data: mockData, error: null });
```

**Supported operations:**
- `select`, `insert`, `update`, `delete`, `upsert`
- Filters: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `is`
- Modifiers: `single`, `maybeSingle`, `order`, `limit`, `range`
- Auth: `getUser`, `getSession`, `signInWithPassword`, `signUp`, `signOut`
- Storage: `upload`, `download`, `remove`, `getPublicUrl`

**Enhancement Needed:**
Add `count` support for pagination queries:
```typescript
const mockChain = {
  // ... existing methods
  // Add count to response
  then: vi.fn((resolve) => resolve({ ...response, count: response.count })),
};
```

### Anthropic (Existing Mock)
Location: `test/mocks/anthropic.ts`

```typescript
import { createAnthropicMock, mockResponses } from '@/test/mocks/anthropic';

// Full client mock
const anthropic = createAnthropicMock();

// Pre-built responses
mockResponses.reflection;
mockResponses.clarify;
mockResponses.evolution;
mockResponses.withThinking;
```

### Cookies (New Mock)
Location: `test/mocks/cookies.ts`

```typescript
// To be created by Builder 1
export const createCookieMock = () => ({
  getAuthCookie: vi.fn().mockResolvedValue(null),
  setAuthCookie: vi.fn().mockResolvedValue(undefined),
  clearAuthCookie: vi.fn().mockResolvedValue(undefined),
});
```

## Fixtures

### Users (Existing)
Location: `test/fixtures/users.ts`

Pre-configured users:
- `freeTierUser`, `freeTierAtLimit`
- `proTierUser`, `proTierAtDailyLimit`
- `unlimitedTierUser`, `unlimitedTierAtDailyLimit`
- `canceledSubscriptionUser`, `expiredSubscriptionUser`
- `creatorUser`, `adminUser`, `demoUser`
- `hebrewUser`, `customPreferencesUser`, `newUser`

Factory functions:
- `createMockUser(overrides)`
- `createMockUserRow(overrides)`
- `createUserWithTier(tier, status)`
- `createUserWithReflections(monthly, daily, total)`

### Dreams (New)
Location: `test/fixtures/dreams.ts`

To be created by Builder 2:
- `createMockDream(overrides)`
- `activeDream`, `achievedDream`, `archivedDream`, `releasedDream`
- `dreamAtLimit`, `noDreams`

## Rate Limiting

### Current Implementation
Location: `server/lib/rate-limiter.ts`

Uses in-memory rate limiting for:
- `authRateLimiter` - 5/min per IP
- `aiRateLimiter` - 10/min per user
- `writeRateLimiter` - 30/min per user

### Test Bypass
Add environment check:
```typescript
export async function checkRateLimit(limiter, key) {
  // Bypass in test environment
  if (process.env.NODE_ENV === 'test') {
    return { success: true, limit: 999, remaining: 999, reset: 0 };
  }
  // ... normal logic
}
```

## File Structure

```
test/
  mocks/
    supabase.ts       # Database mock (existing)
    anthropic.ts      # AI mock (existing)
    cookies.ts        # Cookie mock (new)
    index.ts          # Re-exports (optional)
  fixtures/
    users.ts          # User fixtures (existing)
    dreams.ts         # Dream fixtures (new)
    index.ts          # Re-exports (optional)
  integration/
    setup.ts          # Test caller factory (new)
    auth/
      signup.test.ts
      signin.test.ts
      signout.test.ts
    dreams/
      create.test.ts
      list.test.ts
      crud.test.ts
    users/
      me.test.ts
    reflections/
      list.test.ts
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run integration tests only
pnpm test -- --run test/integration/

# Run specific test file
pnpm test -- --run test/integration/auth/signup.test.ts

# Watch mode
pnpm test -- --watch

# With coverage
pnpm test -- --coverage
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner |
| `@trpc/server` | tRPC caller |
| `bcryptjs` | Password hashing (real in tests) |
| `jsonwebtoken` | JWT handling (real in tests) |
| `zod` | Schema validation (real in tests) |

## Notes

- Use real bcrypt and JWT in tests (they're fast enough)
- Mock external services (Supabase, Anthropic)
- Keep tests isolated (no shared state between tests)
- Use `beforeEach` to reset mocks
