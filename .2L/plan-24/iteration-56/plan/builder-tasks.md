# Builder Task Breakdown

## Overview

**4 primary builders** will work in parallel on isolated test modules.
No builder splits expected - tasks are scoped appropriately.

## Builder Assignment Strategy

- Each builder owns a distinct set of test files
- No shared file modifications except Builder-1's mock helper additions
- All builders use existing `createTestCaller()` infrastructure
- Integration after building should be straightforward merge

---

## Builder-1: Clarify Router AI Flow Tests

### Scope

Add comprehensive tests for AI interaction flows in the clarify router, focusing on:
- createSession with initial message (AI response generation)
- sendMessage with full AI conversation
- tool_use block handling (createDream tool)
- Error handling in AI calls
- Database error handling in CRUD operations

### Complexity Estimate

**HIGH**

Requires extending Anthropic mock with tool_use support before writing tests.

### Success Criteria

- [ ] Tool_use mock helper added to `test/mocks/anthropic.ts`
- [ ] createSession with initial message - text response tested
- [ ] createSession with initial message - tool_use response tested
- [ ] createSession with tool_use - dream creation success tested
- [ ] createSession with tool_use - dream creation failure tested
- [ ] createSession AI error handling tested
- [ ] sendMessage with text response tested
- [ ] sendMessage with tool_use response tested
- [ ] sendMessage "no text block" error tested
- [ ] sendMessage AI error throws INTERNAL_SERVER_ERROR tested
- [ ] archiveSession database error after ownership check tested
- [ ] restoreSession database error after ownership check tested
- [ ] updateTitle database error after ownership check tested
- [ ] deleteSession database error after ownership check tested
- [ ] listSessions query error tested
- [ ] getSession messages fetch error tested
- [ ] All tests pass with no flakiness
- [ ] Coverage of clarify.ts reaches 90%+ lines

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `test/mocks/anthropic.ts` | MODIFY | Add `mockAnthropicToolUse()` helper and `ToolUseContentBlock` type |
| `test/integration/clarify/clarify.test.ts` | MODIFY | Add new test sections for AI flows and error handling |

### Dependencies

**Depends on:** None (starts first)
**Blocks:** None (other builders work independently)

### Implementation Notes

1. **Add tool_use mock helper first** - Other tests in this builder depend on it:

```typescript
// Add to test/mocks/anthropic.ts
export interface ToolUseContentBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export function mockAnthropicToolUse(
  anthropicMock: AnthropicMock,
  toolInput: { title: string; category: string },
  followUpText: string
): void {
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
```

2. **Mock buildClarifyContext** - The clarify router imports this. Ensure it's mocked in setup:

```typescript
vi.mock('@/lib/clarify/context-builder', () => ({
  buildClarifyContext: vi.fn().mockResolvedValue('[User Context]\nMocked context'),
}));
```

3. **Sequential mock pattern for CRUD errors** - Use call-count tracking:

```typescript
let sessionCallCount = 0;
supabaseMock.from.mockImplementation((table: string) => {
  if (table === 'clarify_sessions') {
    sessionCallCount++;
    if (sessionCallCount === 1) {
      // ownership check succeeds
      return createSupabaseQueryMock({ data: session, error: null });
    } else {
      // update/delete fails
      return createSupabaseQueryMock({ data: null, error: new Error('DB error') });
    }
  }
  return createSupabaseQueryMock({ data: null, error: null });
});
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Tool Use Response" pattern for createDream tests
- Use "Sequential Response Mock" pattern for CRUD error tests
- Use "AI Error Response" pattern for AI failure tests
- Follow test ID convention: `TC-CS-XX` for createSession, `TC-SM-XX` for sendMessage

### Testing Requirements

- ~20 tests for AI flow paths
- ~12 tests for database error handling
- ~8 tests for edge cases
- Coverage target: 90%+ lines for clarify.ts

### Estimated Tests: ~40 tests

---

## Builder-2: Auth Router Gaps

### Scope

Add tests for uncovered auth router procedures:
- verifyToken (success + unauthorized paths)
- me (authenticated user retrieval)
- updateProfile error handling
- deleteAccount complete flow

### Complexity Estimate

**MEDIUM**

Straightforward test patterns, but deleteAccount requires bcrypt mocking.

### Success Criteria

- [ ] verifyToken returns user for valid token tested
- [ ] verifyToken throws UNAUTHORIZED for null user tested
- [ ] me returns current user tested
- [ ] me throws UNAUTHORIZED for unauthenticated tested
- [ ] updateProfile database error handling tested
- [ ] deleteAccount email mismatch rejection tested
- [ ] deleteAccount incorrect password rejection tested
- [ ] deleteAccount user not found handling tested
- [ ] deleteAccount successful deletion tested
- [ ] deleteAccount database deletion error tested
- [ ] All tests pass with no flakiness
- [ ] Coverage of auth.ts reaches 90%+ lines

### Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `test/integration/auth/verify-token.test.ts` | CREATE | verifyToken procedure tests |
| `test/integration/auth/me.test.ts` | CREATE | me procedure tests |
| `test/integration/auth/update-profile.test.ts` | CREATE | updateProfile error tests |
| `test/integration/auth/delete-account.test.ts` | CREATE | deleteAccount flow tests |

### Dependencies

**Depends on:** None
**Blocks:** None

### Implementation Notes

1. **Mock bcrypt for password verification:**

```typescript
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));
```

2. **verifyToken is a publicProcedure** - It checks `ctx.user` directly:

```typescript
// Test with user
const { caller } = createTestCaller(proTierUser);
const result = await caller.auth.verifyToken();
expect(result.user).toEqual(proTierUser);

// Test without user
const { caller: unauthCaller } = createTestCaller(null);
await expect(unauthCaller.auth.verifyToken()).rejects.toMatchObject({
  code: 'UNAUTHORIZED',
});
```

3. **deleteAccount has multiple validation steps:**
   - Email confirmation match
   - User exists check
   - Password verification via bcrypt
   - Actual deletion

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Testing Protected Procedures" for me procedure
- Use "Testing Public Procedures" for verifyToken
- Use "deleteAccount Procedure Tests" pattern for delete flow
- Follow test ID convention: `TC-VT-XX`, `TC-ME-XX`, `TC-UP-XX`, `TC-DA-XX`

### Testing Requirements

- 2 tests for verifyToken
- 2 tests for me
- 3 tests for updateProfile error handling
- 8 tests for deleteAccount flow
- Coverage target: 90%+ lines for auth.ts

### Estimated Tests: ~15 tests

---

## Builder-3: Cookies Module & Supabase Client Unit Tests

### Scope

Create unit tests for two isolated server modules:
- Cookies module (`server/lib/cookies.ts`) - all three functions
- Supabase client (`server/lib/supabase.ts`) - initialization and env handling

### Complexity Estimate

**MEDIUM**

Requires special mocking for Next.js headers API and module re-initialization.

### Success Criteria

- [ ] setAuthCookie with regular options tested
- [ ] setAuthCookie with demo options tested
- [ ] getAuthCookie returns value when cookie exists tested
- [ ] getAuthCookie returns undefined when missing tested
- [ ] clearAuthCookie deletes cookie tested
- [ ] Supabase uses env vars when available tested
- [ ] Supabase uses placeholders when env vars missing tested
- [ ] All tests pass with no flakiness
- [ ] Coverage of cookies.ts reaches 90%+ lines
- [ ] Coverage of supabase.ts reaches 90%+ lines

### Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `test/unit/server/lib/cookies.test.ts` | CREATE | Cookie function unit tests |
| `test/unit/server/lib/supabase.test.ts` | CREATE | Supabase initialization tests |

### Dependencies

**Depends on:** None
**Blocks:** None

### Implementation Notes

1. **Cookies module requires next/headers mock:**

```typescript
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));
```

2. **Supabase module requires module reset between tests:**

```typescript
beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});
```

3. **Must mock @supabase/supabase-js before importing:**

```typescript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: vi.fn() }),
}));
```

4. **Use dynamic imports for supabase tests:**

```typescript
const { supabase } = await import('@/server/lib/supabase');
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Testing Next.js Headers API (Cookies)" pattern
- Use "Testing Module Initialization (Supabase)" pattern
- Follow test ID convention: `TC-CK-XX` for cookies, `TC-SB-XX` for supabase

### Testing Requirements

- 5 tests for cookies module (3 functions, isDemo branch)
- 3 tests for supabase client (env vars, placeholders, client creation)
- Coverage target: 90%+ for both files

### Estimated Tests: ~8 tests

---

## Builder-4: tRPC Error Formatter Tests

### Scope

Create unit tests for tRPC error formatter including:
- Sentry capture logic (captures non-auth errors)
- Sentry exclusion for UNAUTHORIZED/FORBIDDEN
- User context in Sentry captures
- Zod error flattening in responses

### Complexity Estimate

**MEDIUM**

Requires Sentry mock and triggering actual errors through procedures.

### Success Criteria

- [ ] INTERNAL_SERVER_ERROR captured to Sentry tested
- [ ] UNAUTHORIZED not captured to Sentry tested
- [ ] FORBIDDEN not captured to Sentry tested
- [ ] User context included in Sentry capture tested
- [ ] Zod error flattened in response tested
- [ ] Non-Zod error has null zodError tested
- [ ] All tests pass with no flakiness
- [ ] Coverage of trpc.ts reaches 90%+ lines

### Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `test/unit/server/trpc/trpc.test.ts` | CREATE | Error formatter tests |

### Dependencies

**Depends on:** None
**Blocks:** None

### Implementation Notes

1. **Mock Sentry at module level:**

```typescript
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));
```

2. **Import Sentry to verify calls:**

```typescript
import * as Sentry from '@sentry/nextjs';
// Later in test:
expect(Sentry.captureException).toHaveBeenCalled();
```

3. **Trigger errors through actual procedures:**
   - INTERNAL_SERVER_ERROR: Mock database to return error
   - UNAUTHORIZED: Call protected procedure without user
   - FORBIDDEN: Call clarify procedure with free tier user

4. **Zod errors come from input validation:**

```typescript
await caller.auth.signup({
  email: 'not-an-email',  // Invalid email format
  password: '123',        // Too short
  name: '',               // Empty string
  language: 'en',
});
```

5. **Access error data through catch:**

```typescript
try {
  await caller.router.procedure();
} catch (error: any) {
  expect(error.data?.zodError).toBeDefined();
}
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "tRPC Error Formatter Tests" pattern
- Follow test ID convention: `TC-EF-XX` for error formatter

### Testing Requirements

- 4 tests for Sentry capture behavior
- 2 tests for Zod error flattening
- Coverage target: 90%+ for trpc.ts

### Estimated Tests: ~6 tests

---

## Builder Execution Order

### Parallel Group 1 (No dependencies - all start together)

| Builder | Focus | Est. Tests |
|---------|-------|------------|
| Builder-1 | Clarify Router AI Flows | ~40 |
| Builder-2 | Auth Router Gaps | ~15 |
| Builder-3 | Cookies + Supabase | ~8 |
| Builder-4 | tRPC Error Formatter | ~6 |

**Total Estimated: ~69 tests** (conservative; explorer estimate was ~110)

### Integration Notes

1. **No file conflicts expected:**
   - Builder-1 modifies `test/mocks/anthropic.ts` and `test/integration/clarify/`
   - Builder-2 creates new files in `test/integration/auth/`
   - Builder-3 creates new files in `test/unit/server/lib/`
   - Builder-4 creates new file in `test/unit/server/trpc/`

2. **Shared infrastructure:**
   - All builders use `createTestCaller()` from existing setup
   - All builders use existing mock factories
   - Builder-1's anthropic mock extensions may be used by future iterations

3. **Merge strategy:**
   - Each builder's output is a distinct set of files
   - Git merge should be automatic
   - Run `npm run test:coverage -- --run` after merge to verify

4. **Potential issues:**
   - If Builder-1 modifies `test/integration/setup.ts` (for buildClarifyContext mock), coordinate with others
   - Ensure all new test files follow import path conventions (`@/...`)

---

## Summary Table

| Builder | Module | Current | Target | Tests | Files |
|---------|--------|---------|--------|-------|-------|
| Builder-1 | Clarify Router | 45.62% | 90%+ | ~40 | 2 |
| Builder-2 | Auth Router | 70.21% | 90%+ | ~15 | 4 |
| Builder-3 | Cookies + Supabase | 33%/0% | 90%+ | ~8 | 2 |
| Builder-4 | tRPC Core | 57.14% | 90%+ | ~6 | 1 |
| **Total** | | | | **~69** | **9** |
