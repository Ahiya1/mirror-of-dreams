# Technology Stack

## Testing Framework

**Decision:** Vitest 2.x

**Rationale:**
- Already established in the project for all existing tests
- Native TypeScript support without additional configuration
- Fast execution with intelligent watch mode
- Compatible with existing `test/integration/setup.ts` infrastructure

**Configuration:**
- Config file: `vitest.config.ts` (existing)
- Test pattern: `test/integration/clarify/clarify.test.ts`

## Test Infrastructure

### Test Caller Setup

**Decision:** Use existing `createTestCaller` from `test/integration/setup.ts`

**Rationale:**
- Provides mocked Supabase, Anthropic, cache, and rate limiter
- Handles user context injection
- Returns mock utilities (`mockQuery`, `mockQueries`)
- Already proven in reflection and dream router tests

**Usage:**
```typescript
import { createTestCaller, anthropicMock, cacheMock } from '../setup';
const { caller, mockQueries } = createTestCaller(proTierUser);
```

### Database Mocking

**Decision:** Use `mockQueries` function from setup.ts

**Rationale:**
- Consistent with existing test patterns
- Supports multiple table responses in single mock
- Handles Supabase query chain automatically

**Tables to Mock:**
- `clarify_sessions` - Session CRUD operations
- `clarify_messages` - Message storage and retrieval
- `dreams` - Dream creation via tool execution
- `users` - Counter updates
- `clarify_patterns` - Pattern retrieval

### Anthropic API Mocking

**Decision:** Use `anthropicMock` from setup.ts with enhanced chained mock pattern

**Rationale:**
- Existing mock infrastructure handles standard responses
- Need to extend with `mockResolvedValueOnce` chaining for tool use flow
- Supports both text and tool_use response blocks

**Key Enhancement:**
```typescript
// Chained mock for tool use flow
anthropicMock.messages.create
  .mockResolvedValueOnce({ content: [{ type: 'tool_use', ... }] })
  .mockResolvedValueOnce({ content: [{ type: 'text', ... }] });
```

## Test Fixtures

### User Fixtures

**Decision:** Use existing user factories from `test/factories/user.factory.ts`

**Available Users:**
- `freeTierUser` - Should be rejected (Clarify is paid-only)
- `proTierUser` - 20 sessions/month limit
- `unlimitedTierUser` - 30 sessions/month limit
- `creatorUser` - Bypasses limits
- `adminUser` - Bypasses limits
- `demoUser` - Can read but not write

### Clarify Fixtures

**Decision:** Use existing factories from `test/factories/clarify.factory.ts`

**Available Factories:**
- `createMockClarifySession(overrides)` - Session objects
- `createMockClarifySessionRow(overrides)` - Database rows
- `createMockClarifyMessage(overrides)` - Message objects
- `createMockClarifyMessageRow(overrides)` - Database rows
- `createSessionWithMessages(count)` - Session with conversation history
- `createDreamToolUse(title, success)` - Tool use records

## Dependencies

### Production Dependencies (Already Installed)

- `@anthropic-ai/sdk` - Anthropic API client (mocked in tests)
- `@trpc/server` - tRPC server framework
- `zod` - Schema validation

### Test Dependencies (Already Installed)

- `vitest` - Test framework
- `@vitest/coverage-v8` - Coverage reporting

## Environment Variables

Required for tests (set in beforeEach):

```typescript
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
});
```

## File Structure

```
test/
  integration/
    setup.ts                 # Test caller setup (existing)
    clarify/
      clarify.test.ts        # New - all clarify router tests
  mocks/
    anthropic.ts             # Anthropic mock factories (existing)
  factories/
    clarify.factory.ts       # Clarify data factories (existing)
    user.factory.ts          # User data factories (existing)
```

## Coverage Configuration

**Target:** 85%+ for `server/trpc/routers/clarify.ts`

**Command:**
```bash
npm run test:coverage -- --reporter=text test/integration/clarify
```

## Test Execution

**Single File:**
```bash
npm run test test/integration/clarify/clarify.test.ts
```

**With Coverage:**
```bash
npm run test:coverage -- test/integration/clarify
```

**Watch Mode:**
```bash
npm run test -- --watch test/integration/clarify/clarify.test.ts
```
