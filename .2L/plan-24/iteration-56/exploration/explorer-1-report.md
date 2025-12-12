# Explorer 1 Report: Clarify Router Analysis

## Executive Summary

The clarify router at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` currently has 45.62% line coverage (38.46% branch, 46.15% function). The existing test suite covers basic CRUD operations, authorization checks, and input validation, but lacks coverage for the AI integration flows including tool_use handling, initial message processing with AI response, and error scenarios in AI calls.

## Current Test Inventory

### Tests by Endpoint (70 total tests)

| Endpoint | Test Count | Coverage Focus |
|----------|------------|----------------|
| `getLimits` | 6 | Tier limits, authorization |
| `getPatterns` | 4 | Success, authorization |
| `archiveSession` | 5 | Success, ownership, errors |
| `restoreSession` | 5 | Success, ownership, errors |
| `updateTitle` | 5 | Success, validation, authorization |
| `deleteSession` | 5 | Success, ownership, errors |
| `getSession` | 6 | Session retrieval, messages |
| `listSessions` | 7 | Pagination, filtering |
| `createSession` | 13 | Basic creation, authorization, limits |
| `sendMessage` | 9 | Authorization, validation, basic errors |
| Additional | 10 | Middleware, state transitions, edge cases |

### What IS Currently Tested

1. **Authorization flows** - All endpoints properly test:
   - Unauthenticated access rejection
   - Demo user restrictions
   - Free tier restrictions
   - Session ownership verification

2. **Input validation** - Schema validation for:
   - UUID formats
   - String length limits
   - Required fields

3. **Basic CRUD operations** - Without AI interactions:
   - Session creation (without initial message)
   - Session listing with pagination
   - Session archival/restoration/deletion
   - Title updates

4. **Limits enforcement** - Tier-based limits for:
   - Pro tier (20 sessions/month)
   - Unlimited tier (30 sessions/month)
   - Creator/Admin bypass

## Specific Coverage Gaps by Line Number

### Gap 1: Anthropic Client Initialization (Lines 37-47)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`
```typescript
// Lines 37-47 - getAnthropicClient()
function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {       // Line 39-40: UNTESTED
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropic = new Anthropic({...});           // Lines 42-44: UNTESTED
  }
  return anthropic;
}
```
**Mocking Required:** Delete `process.env.ANTHROPIC_API_KEY` before test

### Gap 2: System Prompt Loading (Lines 55-61)
```typescript
// Lines 55-61 - getClarifySystemPrompt()
function getClarifySystemPrompt(): string {
  if (!cachedSystemPrompt) {
    const promptPath = path.join(process.cwd(), 'prompts', 'clarify_agent.txt');
    cachedSystemPrompt = fs.readFileSync(promptPath, 'utf8');  // Line 58: UNTESTED
  }
  return cachedSystemPrompt;
}
```
**Mocking Required:** Mock `fs.readFileSync` or ensure prompts directory exists in test environment

### Gap 3: executeCreateDreamTool Function (Lines 120-155)
```typescript
// Lines 120-155 - executeCreateDreamTool()
async function executeCreateDreamTool(userId, sessionId, toolInput): Promise<ToolExecutionResult> {
  try {
    const { data: dream, error } = await supabase
      .from('dreams')
      .insert({...})
      .select('id, title')
      .single();

    if (error) {                                             // Lines 140-142: UNTESTED
      return { dreamId: '', dreamTitle: '', success: false };
    }

    await supabase.from('clarify_sessions').update({...});   // Line 145: UNTESTED

    return { dreamId: dream.id, ... };                       // Lines 147-151: UNTESTED
  } catch {
    return { dreamId: '', dreamTitle: '', success: false };  // Lines 152-154: UNTESTED
  }
}
```
**Mocking Required:** Mock dreams table insert success/failure, clarify_sessions update

### Gap 4: createSession with Initial Message (Lines 270-388)
```typescript
// Lines 270-388 - createSession with initialMessage
if (input.initialMessage) {
  // Store user message                                       // Lines 275-279: UNTESTED
  const { error: msgError } = await supabase.from('clarify_messages').insert({...});

  try {
    const client = getAnthropicClient();                     // Line 283: UNTESTED
    const context = await buildClarifyContext(userId, session.id);  // Line 286: UNTESTED
    const systemPrompt = context + getClarifySystemPrompt(); // Line 287: UNTESTED

    const response = await withAIRetry(...);                 // Lines 289-299: UNTESTED

    // Check for tool_use                                    // Lines 305-369: UNTESTED (all tool_use paths)
    const toolUseBlock = response.content.find(...);
    if (toolUseBlock && toolUseBlock.name === 'createDream') {
      // Execute tool                                        // Lines 309-321: UNTESTED
      // Follow up API call                                  // Lines 327-360: UNTESTED
    } else {
      // Standard text response                              // Lines 362-368: UNTESTED
    }

    // Store AI response                                     // Lines 372-379: UNTESTED
    if (initialResponse) {
      await supabase.from('clarify_messages').insert({...});
    }
  } catch (error) {
    aiLogger.error({...});                                   // Lines 381-386: UNTESTED
  }
}
```
**Mocking Required:**
- Anthropic mock with text response
- Anthropic mock with tool_use response
- Anthropic mock with follow-up after tool_use
- buildClarifyContext mock
- Error scenarios

### Gap 5: sendMessage with AI Response and Tool Use (Lines 478-635)
```typescript
// Lines 498-606 - sendMessage AI flow
const messages = await getSessionMessages(input.sessionId);  // Line 499: UNTESTED
const anthropicMessages = messages.map(...);                 // Lines 502-505: UNTESTED
const context = await buildClarifyContext(...);              // Line 508: UNTESTED
const systemPrompt = context + getClarifySystemPrompt();     // Line 509: UNTESTED

try {
  const client = getAnthropicClient();                       // Line 517: UNTESTED
  const response = await withAIRetry(...);                   // Lines 518-528: UNTESTED

  // Check for tool_use                                      // Lines 531-595: UNTESTED
  const toolUseBlock = response.content.find(...);
  if (toolUseBlock && toolUseBlock.name === 'createDream') {
    // Execute tool and follow-up                            // Lines 535-585: UNTESTED
  } else {
    // Standard response                                     // Lines 587-595: UNTESTED
    const textBlock = response.content.find(...);
    if (!textBlock) {
      throw new Error('No text response from Claude');       // Line 592: UNTESTED
    }
  }
} catch (error) {
  aiLogger.error({...});                                     // Lines 598-601: UNTESTED
  throw new TRPCError({...});                                // Lines 602-605: UNTESTED
}
```
**Mocking Required:**
- Full Anthropic message flow mock
- Tool use block detection and execution
- Text block extraction
- Error handling paths

### Gap 6: Database Error Handling in CRUD (Lines 646, 666, 685, 701)
```typescript
// archiveSession error (Lines 646-650)
if (error) {
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to archive session' });
}

// restoreSession error (Lines 666-670)
if (error) {
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to restore session' });
}

// updateTitle error (Lines 685-689)
if (error) {
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update title' });
}

// deleteSession error (Lines 701-705)
if (error) {
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete session' });
}
```
**Mocking Required:** Sequential mock - first call succeeds (ownership check), second call fails (operation)

### Gap 7: listSessions Query Error (Lines 459-464)
```typescript
if (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to fetch sessions',
  });
}
```
**Mocking Required:** Return error from clarify_sessions query

### Gap 8: getSessionMessages Error Path (Lines 216-221)
```typescript
if (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to fetch messages',
  });
}
```
**Mocking Required:** Return error from clarify_messages query after successful session fetch

## Mocking Requirements Summary

### 1. Anthropic Mock Extensions Needed

The current `anthropicMock` in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts` only supports basic text responses. Need to add:

```typescript
// Required mock response types:

// Type 1: Standard text response (already supported)
{
  content: [{ type: 'text', text: 'Response text' }],
  usage: { output_tokens: 50 }
}

// Type 2: Tool use response (NEW)
{
  content: [
    { type: 'tool_use', id: 'toolu_123', name: 'createDream', input: { title: 'Dream Title', category: 'personal_growth' } }
  ],
  usage: { output_tokens: 30 }
}

// Type 3: Follow-up after tool result (NEW)
{
  content: [{ type: 'text', text: "I've created that dream for you." }],
  usage: { output_tokens: 40 }
}
```

**Implementation:** Add a helper to configure `anthropicMock.messages.create` with sequence of responses:

```typescript
// Example helper to add to setup.ts
export function mockAnthropicToolUse(toolInput: object, followUpText: string) {
  const calls: any[] = [];
  anthropicMock.messages.create
    .mockResolvedValueOnce({
      content: [{
        type: 'tool_use',
        id: 'toolu_test_123',
        name: 'createDream',
        input: toolInput
      }],
      usage: { output_tokens: 30 }
    })
    .mockResolvedValueOnce({
      content: [{ type: 'text', text: followUpText }],
      usage: { output_tokens: 40 }
    });
}
```

### 2. Context Builder Mock

The `buildClarifyContext` function from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts` needs mocking:

```typescript
vi.mock('@/lib/clarify/context-builder', () => ({
  buildClarifyContext: vi.fn().mockResolvedValue('[User Context]\nMocked context'),
  getUserPatterns: vi.fn().mockResolvedValue([]),
}));
```

### 3. System Prompt Mock

The `fs.readFileSync` call in `getClarifySystemPrompt()` needs handling:

```typescript
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue('Mocked clarify system prompt'),
}));
```

**OR** ensure the prompts directory exists in the test environment.

### 4. Sequential Supabase Mock

Current `mockQueries` returns same response for all calls to a table. Need sequential mock capability:

```typescript
// Example: ownership check succeeds, then update fails
supabase.from.mockImplementation((table) => {
  if (table === 'clarify_sessions') {
    // Track call count
    const callCount = sessionCallCount++;
    if (callCount === 0) {
      return createQueryMock({ data: { id: sessionId }, error: null }); // ownership check
    } else {
      return createQueryMock({ data: null, error: new Error('DB error') }); // update fails
    }
  }
  return createQueryMock({ data: null, error: null });
});
```

## Recommended Test Cases to Add

### Priority 1 (Critical - Core AI Flow): ~20 tests

| Test ID | Endpoint | Scenario | Lines Covered |
|---------|----------|----------|---------------|
| CS-AI-01 | createSession | With initial message, text response | 270-388, 362-368 |
| CS-AI-02 | createSession | With initial message, tool_use response | 305-360 |
| CS-AI-03 | createSession | Tool_use with dream creation success | 309-321 |
| CS-AI-04 | createSession | Tool_use with dream creation failure | 140-142 |
| CS-AI-05 | createSession | AI call failure (catch block) | 381-386 |
| SM-AI-01 | sendMessage | Success with text response | 498-595 |
| SM-AI-02 | sendMessage | Success with tool_use response | 531-585 |
| SM-AI-03 | sendMessage | Tool_use with successful dream | 535-546 |
| SM-AI-04 | sendMessage | Tool_use with failed dream | 140-142 |
| SM-AI-05 | sendMessage | No text block in response | 591-592 |
| SM-AI-06 | sendMessage | AI error triggers INTERNAL_SERVER_ERROR | 598-605 |
| SM-AI-07 | sendMessage | Follow-up after tool result | 552-579 |
| SM-AI-08 | sendMessage | Message history built correctly | 502-505 |

### Priority 2 (Important - Error Paths): ~12 tests

| Test ID | Endpoint | Scenario | Lines Covered |
|---------|----------|----------|---------------|
| AS-ERR-01 | archiveSession | DB update error after ownership check | 646-650 |
| RS-ERR-01 | restoreSession | DB update error after ownership check | 666-670 |
| UT-ERR-01 | updateTitle | DB update error after ownership check | 685-689 |
| DS-ERR-01 | deleteSession | DB delete error after ownership check | 701-705 |
| LS-ERR-01 | listSessions | Query error | 459-464 |
| GS-ERR-01 | getSession | Messages fetch error | 216-221 |
| CS-ERR-01 | createSession | User message save error | 275-279 |
| CS-ERR-02 | createSession | AI message save error | 372-379 |
| SM-ERR-01 | sendMessage | AI message save error | 609-619 |

### Priority 3 (Infrastructure - Initialization): ~6 tests

| Test ID | Function | Scenario | Lines Covered |
|---------|----------|----------|---------------|
| INIT-01 | getAnthropicClient | Missing API key | 39-41 |
| INIT-02 | getAnthropicClient | Successful initialization | 42-46 |
| INIT-03 | getClarifySystemPrompt | First load (cache miss) | 56-59 |
| INIT-04 | getClarifySystemPrompt | Second load (cache hit) | 56 |
| EXEC-01 | executeCreateDreamTool | Success path | 127-151 |
| EXEC-02 | executeCreateDreamTool | Catch block | 152-154 |

### Priority 4 (Edge Cases): ~8 tests

| Test ID | Endpoint | Scenario | Lines Covered |
|---------|----------|----------|---------------|
| CS-EDGE-01 | createSession | Initial message at max length (4000) | 270-388 |
| SM-EDGE-01 | sendMessage | Message at max length (4000) | 478-606 |
| SM-EDGE-02 | sendMessage | Empty tool_use result | 631-633 |
| LS-EDGE-01 | listSessions | Cursor points to deleted session | 446-454 |
| GS-EDGE-01 | getSession | Session with toolUse in messages | 420-426 |

## Estimated Coverage Impact

| Metric | Current | After Implementation |
|--------|---------|---------------------|
| Line Coverage | 45.62% | ~90% |
| Branch Coverage | 38.46% | ~85% |
| Function Coverage | 46.15% | ~95% |

## Risks & Challenges

### 1. Anthropic Mock Complexity
The tool_use flow requires mocking two sequential API calls with different response types. The current mock infrastructure does not support this pattern well.

**Mitigation:** Create dedicated helper functions for tool_use scenarios.

### 2. Context Builder Dependencies
`buildClarifyContext` has its own dependencies (cache, supabase queries). Need to either:
- Mock the entire function
- Ensure all its dependencies are mocked

**Recommendation:** Mock the entire function to isolate clarify router tests.

### 3. File System Access
`getClarifySystemPrompt` uses `fs.readFileSync`. Tests may fail if prompts directory is not in expected location.

**Mitigation:** Mock `fs` module or use test-specific prompts directory.

### 4. Sequential Mock State
Testing "ownership check succeeds, then operation fails" requires stateful mocks. Current `mockQueries` helper does not support this.

**Mitigation:** Create `mockSequentialQueries` helper or use call-count tracking.

## Resource Map

### Critical Files/Directories

| Path | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` | Router under test (732 lines) |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/clarify/clarify.test.ts` | Existing test file (1192 lines) |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts` | Test caller setup with mocks |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts` | Anthropic mock factories |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts` | Context builder to mock |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt` | System prompt file |

### Key Dependencies

| Dependency | Purpose |
|------------|---------|
| `@anthropic-ai/sdk` | AI API client (mocked) |
| `withAIRetry` from `@/lib/utils/retry` | Retry wrapper for AI calls |
| `buildClarifyContext` from `@/lib/clarify/context-builder` | User context for system prompt |
| `fs` (Node.js) | System prompt file reading |
| `path` (Node.js) | Path construction |

## Questions for Planner

1. Should the context builder (`buildClarifyContext`) be mocked entirely, or should its internal cache/db calls be mocked separately?

2. Is there a preference for where the tool_use mock helpers should live - in `test/integration/setup.ts` or `test/mocks/anthropic.ts`?

3. The existing `mockQueries` helper does not support sequential responses for the same table. Should we:
   - Extend the existing helper with sequential support?
   - Create a new `mockSequentialQueries` helper?
   - Use manual mock implementation in specific tests?

4. Should we test the actual system prompt loading from disk, or always mock `fs.readFileSync`?

