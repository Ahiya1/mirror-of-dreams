# Explorer 1 Report: Clarify Router Analysis for Testing

## Executive Summary

The clarify router (`server/trpc/routers/clarify.ts`) is a 731-line file containing 10 procedures (3 queries, 7 mutations) that manage Clarify AI conversation sessions. The router handles Anthropic API integration with tool use capabilities (createDream tool), context building from user data, and session management. Current coverage is 15.97% - reaching the 85% target requires approximately 60-70 test cases covering all procedures, tool use flows, error handling, and edge cases.

## Router Analysis

### File Location
`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`

### Lines of Code
731 lines (most complex router in the codebase)

### Architecture Overview
```
clarifyRouter
├── createSession (mutation) - Creates new session with optional initial message
├── getSession (query) - Gets session with messages
├── listSessions (query) - Lists user's sessions with pagination
├── sendMessage (mutation) - Main conversation endpoint
├── archiveSession (mutation) - Archives session
├── restoreSession (mutation) - Restores archived session
├── updateTitle (mutation) - Updates session title
├── deleteSession (mutation) - Deletes session
├── getLimits (query) - Gets usage limits for user
└── getPatterns (query) - Gets user's extracted patterns
```

### Key Dependencies
1. **Anthropic SDK** - Claude API for AI responses
2. **Supabase** - Database operations
3. **Context Builder** (`lib/clarify/context-builder.ts`) - Builds user context for prompts
4. **Cache** (`server/lib/cache.ts`) - Caches sessions list
5. **withAIRetry** (`lib/utils/retry.ts`) - Retry logic for AI calls
6. **Middleware** - `clarifyProcedure`, `clarifyReadProcedure`, `clarifySessionLimitedProcedure`

## Procedures Inventory

### 1. createSession (Mutation)
**Lines:** 232-399 (167 lines)
**Middleware:** `clarifySessionLimitedProcedure`
**Input Schema:**
```typescript
z.object({
  initialMessage: z.string().min(1).max(4000).optional(),
})
```
**Complexity:** HIGH
**Key Logic:**
- Creates session in `clarify_sessions` table
- Increments user counters (`clarify_sessions_this_month`, `total_clarify_sessions`)
- Invalidates sessions cache
- If `initialMessage` provided:
  - Stores user message
  - Calls Anthropic API with context + tools
  - Handles tool_use (createDream) if triggered
  - Sends tool_result back for follow-up response
  - Stores AI response with optional `tool_use` record

**Tool Use Flow:**
1. Check for `tool_use` block in response
2. If `createDream` tool:
   - Execute `executeCreateDreamTool()`
   - Link session to dream via `dream_id`
   - Make follow-up API call with tool_result
   - Extract text from follow-up response
3. Return both `initialResponse` and `toolUseResult`

### 2. getSession (Query)
**Lines:** 401-427 (26 lines)
**Middleware:** `clarifyReadProcedure` (allows demo users)
**Input Schema:**
```typescript
z.object({
  sessionId: z.string().uuid(),
})
```
**Complexity:** LOW
**Key Logic:**
- Verifies session ownership via user_id
- Fetches session from `clarify_sessions`
- Fetches messages via `getSessionMessages()`
- Returns transformed session and messages

### 3. listSessions (Query)
**Lines:** 429-475 (46 lines)
**Middleware:** `clarifyReadProcedure`
**Input Schema:**
```typescript
z.object({
  status: z.enum(['active', 'archived']).optional(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
})
```
**Complexity:** MEDIUM
**Key Logic:**
- Cursor-based pagination using `last_message_at`
- Filters by status if provided
- Returns `sessions[]` + `nextCursor`

### 4. sendMessage (Mutation)
**Lines:** 477-635 (158 lines)
**Middleware:** `clarifyProcedure`
**Input Schema:**
```typescript
z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(4000),
})
```
**Complexity:** HIGH
**Key Logic:**
- Verifies session ownership
- Stores user message
- Fetches conversation history
- Builds context via `buildClarifyContext()`
- Calls Anthropic API with messages + tools
- Handles tool_use (createDream):
  - Execute tool
  - Make follow-up API call with tool_result
  - Sum token counts from both calls
- Stores AI response with optional `tool_use` record
- Returns message and `toolUseResult`

### 5. archiveSession (Mutation)
**Lines:** 637-654 (17 lines)
**Middleware:** `clarifyProcedure`
**Input Schema:**
```typescript
z.object({
  sessionId: z.string().uuid(),
})
```
**Complexity:** LOW
**Key Logic:**
- Verifies ownership
- Updates status to 'archived'
- Returns `{ success: true }`

### 6. restoreSession (Mutation)
**Lines:** 656-673 (17 lines)
**Middleware:** `clarifyProcedure`
**Input Schema:** Same as archiveSession
**Complexity:** LOW
**Key Logic:** Updates status to 'active'

### 7. updateTitle (Mutation)
**Lines:** 675-692 (17 lines)
**Middleware:** `clarifyProcedure`
**Input Schema:**
```typescript
z.object({
  sessionId: z.string().uuid(),
  title: z.string().min(1).max(100),
})
```
**Complexity:** LOW

### 8. deleteSession (Mutation)
**Lines:** 694-708 (14 lines)
**Middleware:** `clarifyProcedure`
**Input Schema:**
```typescript
z.object({
  sessionId: z.string().uuid(),
})
```
**Complexity:** LOW

### 9. getLimits (Query)
**Lines:** 710-722 (12 lines)
**Middleware:** `clarifyReadProcedure`
**Complexity:** LOW
**Key Logic:**
- Calculates remaining sessions based on tier
- Returns `canCreateSession` based on limits + creator/admin status

### 10. getPatterns (Query)
**Lines:** 724-728 (4 lines)
**Middleware:** `clarifyProcedure`
**Complexity:** LOW
**Key Logic:** Delegates to `getUserPatterns()` from context-builder

## Tool Use Analysis

### createDream Tool Definition
**Location:** Lines 67-102
```typescript
const createDreamTool = {
  name: 'createDream',
  description: '...',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: '...' },
      description: { type: 'string', description: '...' },
      category: { type: 'string', enum: [...10 categories...] }
    },
    required: ['title']
  }
}
```

### Tool Execution Function
**Location:** Lines 120-155
```typescript
async function executeCreateDreamTool(
  userId: string,
  sessionId: string,
  toolInput: CreateDreamToolInput
): Promise<ToolExecutionResult>
```
**Operations:**
1. Insert into `dreams` table
2. Update session `dream_id` to link
3. Return `{ dreamId, dreamTitle, success }`

### Tool Use Flow in Router
1. **Detection:** `response.content.find(block => block.type === 'tool_use')`
2. **Execution:** `executeCreateDreamTool(userId, sessionId, toolInput)`
3. **Follow-up:** Second API call with `tool_result` content block
4. **Storage:** Save `tool_use` record in message row

## Supporting Libraries Analysis

### context-builder.ts (416 lines)
**Key Exports:**
- `buildClarifyContext(userId, sessionId)` - Main context builder
- `getUserPatterns(userId)` - Fetches patterns for display
- `estimateTokens(text)` - Token estimation

**Key Features:**
- Cache-aside pattern (cache first, DB fallback)
- Parallel queries via Promise.all
- Token budget management (8000 max)
- Priority-based section inclusion

**Already Tested:** Yes, comprehensive tests in `lib/clarify/__tests__/context-builder.test.ts` (1057 lines)

### consolidation.ts (277 lines)
**Key Exports:**
- `extractPatternsFromSession(sessionId, messages)` - Pattern extraction using Haiku
- `consolidateUserPatterns(userId)` - Full consolidation pipeline
- `markMessagesConsolidated(messageIds)` - Mark messages as processed

**Not directly called by router** (called by cron/background jobs)

## Existing Test Infrastructure

### Integration Setup
**File:** `test/integration/setup.ts`
**Key Exports:**
- `createTestCaller(user)` - Creates tRPC caller with mocked dependencies
- `mockQuery(table, response)` - Mocks single table
- `mockQueries(tableResponses)` - Mocks multiple tables
- `supabaseMock` - Raw Supabase mock
- `anthropicMock` - Anthropic client mock

### Anthropic Mock
**File:** `test/mocks/anthropic.ts`
**Key Exports:**
- `createMockMessageResponse(overrides)` - Standard response
- `createMockThinkingResponse(thinking, response)` - Extended thinking response
- `anthropicErrors` - Common error scenarios
- `mockResponses.clarify` - Pre-configured clarify response

### Clarify Factory
**File:** `test/factories/clarify.factory.ts`
**Key Exports:**
- `createMockClarifySession(overrides)`
- `createMockClarifySessionRow(overrides)`
- `createMockClarifyMessage(overrides)`
- `createMockClarifyMessageRow(overrides)`
- `createMockClarifyPattern(overrides)`
- `createSessionWithMessages(count, overrides)`
- `createDreamToolUse(title, success)`

### User Fixtures
**File:** `test/factories/user.factory.ts`
**Key Users for Clarify Tests:**
- `freeTierUser` - Cannot access Clarify (tier === 'free')
- `proTierUser` - Can access, 20 sessions/month limit
- `unlimitedTierUser` - Can access, 30 sessions/month limit
- `creatorUser` - Bypasses limits
- `adminUser` - Bypasses limits
- `demoUser` - Can read but not write

## Test Cases Required

### createSession Tests (15 tests)

#### Success Cases
1. **TC-CS-01:** Create session without initial message
2. **TC-CS-02:** Create session with initial message (no tool use)
3. **TC-CS-03:** Create session with initial message triggering createDream tool
4. **TC-CS-04:** Verify user counters updated after creation
5. **TC-CS-05:** Verify sessions cache invalidated after creation
6. **TC-CS-06:** Return correct usage stats in response

#### Authorization Cases
7. **TC-CS-07:** Reject unauthenticated user
8. **TC-CS-08:** Reject demo user
9. **TC-CS-09:** Reject free tier user (Clarify is paid-only)
10. **TC-CS-10:** Reject pro tier at session limit
11. **TC-CS-11:** Allow creator to bypass limits
12. **TC-CS-12:** Allow admin to bypass limits

#### Error Cases
13. **TC-CS-13:** Handle session creation database error
14. **TC-CS-14:** Handle Anthropic API error during initial message
15. **TC-CS-15:** Handle Anthropic returning no text response

### getSession Tests (6 tests)
1. **TC-GS-01:** Return session with messages for owner
2. **TC-GS-02:** Allow demo user to read session
3. **TC-GS-03:** Reject request for non-existent session
4. **TC-GS-04:** Reject request for other user's session
5. **TC-GS-05:** Handle session with no messages
6. **TC-GS-06:** Handle invalid session ID format

### listSessions Tests (8 tests)
1. **TC-LS-01:** Return user's sessions ordered by last_message_at
2. **TC-LS-02:** Filter by status (active)
3. **TC-LS-03:** Filter by status (archived)
4. **TC-LS-04:** Pagination with cursor
5. **TC-LS-05:** Respect limit parameter
6. **TC-LS-06:** Return nextCursor when more results exist
7. **TC-LS-07:** Handle empty results
8. **TC-LS-08:** Allow demo user to list sessions

### sendMessage Tests (18 tests)

#### Success Cases
1. **TC-SM-01:** Send message and receive text response
2. **TC-SM-02:** Send message triggering createDream tool
3. **TC-SM-03:** Verify user message stored before AI call
4. **TC-SM-04:** Verify AI response stored with token count
5. **TC-SM-05:** Verify tool_use record stored when tool triggered
6. **TC-SM-06:** Verify context built from user data
7. **TC-SM-07:** Verify conversation history included in API call
8. **TC-SM-08:** Return correct message structure

#### Tool Use Cases
9. **TC-SM-09:** Tool use success - dream created
10. **TC-SM-10:** Tool use failure - dream creation fails
11. **TC-SM-11:** Tool follow-up response extraction

#### Authorization Cases
12. **TC-SM-12:** Reject unauthenticated user
13. **TC-SM-13:** Reject demo user
14. **TC-SM-14:** Reject request for non-owned session

#### Error Cases
15. **TC-SM-15:** Handle Anthropic API error
16. **TC-SM-16:** Handle Anthropic returning no text response
17. **TC-SM-17:** Handle user message save failure
18. **TC-SM-18:** Handle AI response save failure

### archiveSession Tests (5 tests)
1. **TC-AS-01:** Archive owned session successfully
2. **TC-AS-02:** Reject archiving non-owned session
3. **TC-AS-03:** Reject archiving non-existent session
4. **TC-AS-04:** Reject demo user
5. **TC-AS-05:** Handle database update error

### restoreSession Tests (5 tests)
1. **TC-RS-01:** Restore archived session successfully
2. **TC-RS-02:** Reject restoring non-owned session
3. **TC-RS-03:** Reject restoring non-existent session
4. **TC-RS-04:** Reject demo user
5. **TC-RS-05:** Handle database update error

### updateTitle Tests (5 tests)
1. **TC-UT-01:** Update title successfully
2. **TC-UT-02:** Reject updating non-owned session
3. **TC-UT-03:** Reject demo user
4. **TC-UT-04:** Reject empty title
5. **TC-UT-05:** Reject title exceeding max length

### deleteSession Tests (5 tests)
1. **TC-DS-01:** Delete owned session successfully
2. **TC-DS-02:** Reject deleting non-owned session
3. **TC-DS-03:** Reject deleting non-existent session
4. **TC-DS-04:** Reject demo user
5. **TC-DS-05:** Handle database delete error

### getLimits Tests (6 tests)
1. **TC-GL-01:** Return correct limits for pro tier
2. **TC-GL-02:** Return correct limits for unlimited tier
3. **TC-GL-03:** Return canCreateSession=true when under limit
4. **TC-GL-04:** Return canCreateSession=false when at limit
5. **TC-GL-05:** Return canCreateSession=true for creator at limit
6. **TC-GL-06:** Allow demo user to query limits

### getPatterns Tests (4 tests)
1. **TC-GP-01:** Return user's patterns
2. **TC-GP-02:** Return empty array when no patterns
3. **TC-GP-03:** Reject unauthenticated user
4. **TC-GP-04:** Reject demo user

**Total Test Cases: ~77**

## Mocking Requirements

### Supabase Tables to Mock
1. **clarify_sessions** - Create, read, update, delete
2. **clarify_messages** - Create, read
3. **dreams** - Create (for tool execution)
4. **users** - Update counters
5. **clarify_patterns** - Read (for getPatterns)

### Mock Responses Needed

#### Anthropic Response - Standard Text
```typescript
{
  content: [{ type: 'text', text: 'Response text' }],
  usage: { input_tokens: 100, output_tokens: 50 }
}
```

#### Anthropic Response - Tool Use
```typescript
{
  content: [
    { type: 'text', text: 'Optional text before tool' },
    { 
      type: 'tool_use', 
      id: 'tool_123',
      name: 'createDream',
      input: { title: 'Dream Title', category: 'personal_growth' }
    }
  ]
}
```

#### Anthropic Response - Tool Follow-up
```typescript
{
  content: [{ type: 'text', text: 'Dream created successfully!' }],
  usage: { output_tokens: 30 }
}
```

### Cache Mock
- `cacheDelete(cacheKeys.sessions(userId))` - After session creation

### File System Mock
- `getClarifySystemPrompt()` reads from `prompts/clarify_agent.txt`
- Can mock `fs.readFileSync` or rely on file existing in test env

## Risk Assessment

### High Risk Areas
1. **Tool Use Flow** - Complex multi-step process with two API calls
2. **Session Ownership Verification** - Security-critical
3. **Tier Limit Enforcement** - Business logic critical

### Medium Risk Areas
1. **Context Building Integration** - Already tested separately
2. **Pagination Logic** - Cursor-based with edge cases
3. **Error Message Propagation** - User-facing errors

### Low Risk Areas
1. **Simple CRUD operations** - Standard patterns
2. **Input validation** - Zod handles most cases

### Testing Challenges
1. **Anthropic Mock Complexity** - Need to mock chained API calls for tool use
2. **File System Dependencies** - System prompt loading
3. **Integration with Context Builder** - Already tested, but integration needs verification

## Recommendations for Builder

### Test File Structure
```
test/integration/clarify/
├── clarify-create-session.test.ts (~15 tests)
├── clarify-send-message.test.ts (~18 tests)
├── clarify-session-management.test.ts (~20 tests for archive/restore/update/delete)
├── clarify-queries.test.ts (~18 tests for getSession/listSessions/getLimits/getPatterns)
└── clarify-tool-use.test.ts (~6 tests focused on tool use scenarios)
```

### Mock Setup Pattern
```typescript
// Example test setup
import { createTestCaller, anthropicMock } from '../setup';
import { proTierUser } from '@/test/fixtures/users';
import { createMockClarifySessionRow } from '@/test/factories/clarify.factory';

describe('clarify.createSession', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  it('should create session with initial message', async () => {
    const { caller, mockQueries } = createTestCaller(proTierUser);
    
    mockQueries({
      clarify_sessions: { data: createMockClarifySessionRow(), error: null },
      clarify_messages: { data: null, error: null },
      users: { data: null, error: null },
    });

    anthropicMock.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello! How can I help?' }],
      usage: { output_tokens: 50 }
    });

    const result = await caller.clarify.createSession({
      initialMessage: 'I want to explore my dreams'
    });

    expect(result.session).toBeDefined();
    expect(result.initialResponse).toBe('Hello! How can I help?');
  });
});
```

### Tool Use Test Pattern
```typescript
it('should handle createDream tool use', async () => {
  // First API call returns tool_use
  anthropicMock.messages.create
    .mockResolvedValueOnce({
      content: [
        { 
          type: 'tool_use', 
          id: 'tool_123',
          name: 'createDream',
          input: { title: 'My Dream', category: 'personal_growth' }
        }
      ]
    })
    // Second API call (follow-up) returns text
    .mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Created your dream!' }],
      usage: { output_tokens: 30 }
    });

  mockQueries({
    dreams: { data: { id: 'dream-123', title: 'My Dream' }, error: null },
    clarify_sessions: { data: mockSession, error: null },
  });

  const result = await caller.clarify.sendMessage({ sessionId, content: 'Create a dream' });
  
  expect(result.toolUseResult).toEqual({
    dreamId: 'dream-123',
    success: true
  });
});
```

### Priority Order for Implementation
1. **sendMessage tests** - Most complex, highest value
2. **createSession tests** - Session lifecycle foundation
3. **Session management tests** - CRUD operations
4. **Query tests** - Read operations
5. **Tool use focused tests** - Edge cases

### Coverage Target Breakdown
| Procedure | Lines | Target Tests | Expected Coverage |
|-----------|-------|--------------|-------------------|
| createSession | 167 | 15 | 90%+ |
| sendMessage | 158 | 18 | 90%+ |
| archiveSession | 17 | 5 | 95%+ |
| restoreSession | 17 | 5 | 95%+ |
| updateTitle | 17 | 5 | 95%+ |
| deleteSession | 14 | 5 | 95%+ |
| getSession | 26 | 6 | 95%+ |
| listSessions | 46 | 8 | 90%+ |
| getLimits | 12 | 6 | 100% |
| getPatterns | 4 | 4 | 100% |
| Helper functions | 70 | (covered by above) | 85%+ |

## Questions for Planner

1. Should tool use tests be in a separate file or integrated with sendMessage tests?
2. Should we mock the file system for system prompt loading or ensure the file exists?
3. Should we test the streaming endpoint (`app/api/clarify/stream/route.ts`) separately or consider it out of scope?
4. Should we add tests for the consolidation.ts functions even though they're not directly called by the router?

## Appendix: Key File Paths

- Router: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`
- Context Builder: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts`
- Consolidation: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/consolidation.ts`
- Test Setup: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts`
- Anthropic Mock: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`
- Clarify Factory: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/factories/clarify.factory.ts`
- User Factory: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/factories/user.factory.ts`
- Constants: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`
- Middleware: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`
- Types: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/clarify.ts`
