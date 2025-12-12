# Technology Stack

## Testing Framework

**Decision:** Vitest 2.x with V8 coverage provider

**Rationale:**
- Already configured and used throughout the project
- Fast execution with native ESM support
- Compatible with existing mock infrastructure
- V8 coverage provides accurate line/branch tracking

**Configuration:** `vitest.config.ts` already configured with:
- Coverage thresholds (78% lines, 71% branches)
- Parallel test execution
- TypeScript support via `@swc/core`

## Mocking Infrastructure

### Supabase Mock

**Decision:** Use existing `createSupabaseQueryMock` from `test/mocks/supabase.ts`

**Implementation:**
- Chainable query builder mock
- Supports all Supabase operations (select, insert, update, delete)
- Filter operations (eq, neq, gt, lt, etc.)
- Result modifiers (single, maybeSingle)

**Extension Needed:** Sequential response support for "ownership check succeeds, then operation fails" pattern:

```typescript
// Track call count per table
let callCounts: Record<string, number> = {};

supabaseMock.from.mockImplementation((table: string) => {
  callCounts[table] = (callCounts[table] || 0) + 1;
  const callNum = callCounts[table];

  if (table === 'clarify_sessions' && callNum === 1) {
    return createSupabaseQueryMock({ data: { id: sessionId }, error: null });
  } else if (table === 'clarify_sessions' && callNum === 2) {
    return createSupabaseQueryMock({ data: null, error: new Error('DB error') });
  }
  return createSupabaseQueryMock({ data: null, error: null });
});
```

### Anthropic Mock

**Decision:** Extend existing `anthropicMock` in `test/integration/setup.ts`

**Current Capability:**
- Basic text responses
- Streaming responses
- Error scenarios

**Extension Needed:** Tool use response sequences:

```typescript
// Type 1: Tool use response
{
  content: [
    { type: 'tool_use', id: 'toolu_123', name: 'createDream', input: { title: 'Dream', category: 'growth' } }
  ],
  usage: { output_tokens: 30 }
}

// Type 2: Follow-up after tool result
{
  content: [{ type: 'text', text: "I've created that dream for you." }],
  usage: { output_tokens: 40 }
}
```

### Cookie Mock

**Decision:** Create new Next.js headers mock for unit testing cookies module

**Implementation:**
```typescript
// test/mocks/next-headers.ts
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));
```

### Sentry Mock

**Decision:** Create simple Sentry mock for error formatter tests

**Implementation:**
```typescript
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  withScope: vi.fn((callback) => callback({ setTag: vi.fn(), setExtra: vi.fn() })),
}));
```

## Test File Organization

**Decision:** Follow existing project structure

```
test/
  integration/
    clarify/
      clarify.test.ts          # Extend existing file
    auth/
      verify-token.test.ts     # NEW
      me.test.ts               # NEW (or merge into existing)
      delete-account.test.ts   # NEW
      update-profile.test.ts   # NEW
  unit/
    server/
      lib/
        cookies.test.ts        # NEW
        supabase.test.ts       # NEW
      trpc/
        trpc.test.ts           # NEW
  mocks/
    anthropic.ts               # EXTEND with tool_use helpers
    next-headers.ts            # NEW
    sentry.ts                  # NEW (optional - can inline)
```

## Test Data Factories

**Decision:** Use existing factories from `test/factories/`

**Available Factories:**
- `user.factory.ts` - User fixtures (freeTierUser, proTierUser, etc.)
- `clarify.factory.ts` - Clarify session/message/pattern factories
- `dream.factory.ts` - Dream fixtures
- `reflection.factory.ts` - Reflection fixtures

**Usage Pattern:**
```typescript
import { proTierUser, createMockUser } from '@/test/factories/user.factory';
import { createMockClarifySessionRow } from '@/test/factories/clarify.factory';
```

## Coverage Targets

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| Clarify Router Lines | 45.62% | 90%+ | P0 |
| Clarify Router Branches | 38.46% | 85%+ | P0 |
| Clarify Router Functions | 46.15% | 95%+ | P0 |
| Auth Router Lines | 70.21% | 90%+ | P0 |
| Cookies Module Lines | 33.33% | 90%+ | P0 |
| Supabase Client Lines | 0% | 90%+ | P0 |
| tRPC Core Lines | 57.14% | 90%+ | P0 |

## Dependencies Overview

Key packages used in tests:

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner and assertions |
| `@vitest/coverage-v8` | Coverage collection |
| `bcrypt` | Password hashing (mocked in auth tests) |
| `jsonwebtoken` | JWT handling (mocked) |
| `@anthropic-ai/sdk` | AI client (mocked) |
| `@sentry/nextjs` | Error tracking (mocked) |
| `zod` | Schema validation (real, not mocked) |

## Environment Variables for Tests

Tests should not require real environment variables. All are mocked:

| Variable | Mock Approach |
|----------|---------------|
| `ANTHROPIC_API_KEY` | Set in `beforeEach` to 'test-api-key' |
| `SUPABASE_URL` | Mocked via `vi.mock('@/server/lib/supabase')` |
| `SUPABASE_SERVICE_ROLE_KEY` | Mocked via `vi.mock('@/server/lib/supabase')` |
| `JWT_SECRET` | Set in test fixtures or mocked |
| `SENTRY_DSN` | Not needed - Sentry fully mocked |

## Test Execution Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- test/integration/clarify/clarify.test.ts

# Run tests matching pattern
npm run test -- --grep "clarify.createSession"

# Watch mode for development
npm run test -- --watch
```

## Performance Considerations

- All external services mocked - no network calls
- Tests run in parallel by default
- Each test file runs in isolated environment
- `createTestCaller()` resets mocks per test for isolation
