# Code Patterns & Conventions

## File Structure

```
test/integration/clarify/
  clarify.test.ts           # All clarify router tests (~77 test cases)
```

## Naming Conventions

- Test files: `{feature}.test.ts`
- Test IDs: `TC-{PREFIX}-{NUMBER}` (e.g., TC-CS-01 for createSession test 1)
- Mock helpers: `createMock{Type}Record()`
- Describe blocks: `clarify.{procedureName}`

## Import Pattern

```typescript
// test/integration/clarify/clarify.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, anthropicMock, cacheMock, supabaseMock } from '../setup';

import {
  createMockClarifySessionRow,
  createMockClarifyMessageRow,
  createSessionWithMessages,
  createDreamToolUse,
  createMockClarifyPatternRow,
} from '@/test/factories/clarify.factory';

import {
  freeTierUser,
  proTierUser,
  unlimitedTierUser,
  creatorUser,
  adminUser,
  demoUser,
  createMockUser,
} from '@/test/factories/user.factory';
```

## Test File Structure Pattern

```typescript
// Valid UUIDs for test data
const TEST_SESSION_ID = '12345678-1234-1234-1234-123456789012';
const TEST_MESSAGE_ID = 'abcdef12-3456-7890-abcd-ef1234567890';
const TEST_DREAM_ID = 'fedcba98-7654-3210-fedc-ba9876543210';

// Set up environment variables
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
});

describe('clarify.createSession', () => {
  describe('success cases', () => {
    // Success tests
  });

  describe('authorization', () => {
    // Auth tests
  });

  describe('error handling', () => {
    // Error tests
  });
});
```

## Basic Test Pattern

```typescript
it('TC-CS-01: should create session without initial message', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  const mockSession = createMockClarifySessionRow({
    id: TEST_SESSION_ID,
    user_id: proTierUser.id,
    title: 'New Clarify Session',
    status: 'active',
  });

  mockQueries({
    clarify_sessions: { data: mockSession, error: null },
    users: { data: null, error: null },
  });

  const result = await caller.clarify.createSession({});

  expect(result.session).toMatchObject({
    id: TEST_SESSION_ID,
    title: 'New Clarify Session',
    status: 'active',
  });
  expect(result.initialResponse).toBeNull();
  expect(result.usage).toBeDefined();
});
```

## Authorization Test Pattern

```typescript
it('TC-CS-07: should reject unauthenticated user', async () => {
  const { caller } = createTestCaller(null);

  await expect(caller.clarify.createSession({})).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
    message: expect.stringContaining('Authentication required'),
  });
});

it('TC-CS-08: should reject demo user', async () => {
  const { caller } = createTestCaller(demoUser);

  await expect(caller.clarify.createSession({})).rejects.toMatchObject({
    code: 'FORBIDDEN',
    message: expect.stringContaining('demo'),
  });
});

it('TC-CS-09: should reject free tier user', async () => {
  const { caller } = createTestCaller(freeTierUser);

  await expect(caller.clarify.createSession({})).rejects.toMatchObject({
    code: 'FORBIDDEN',
    message: expect.stringMatching(/Clarify.*requires.*subscription/i),
  });
});
```

## Session Limit Test Pattern

```typescript
it('TC-CS-10: should reject pro tier at session limit', async () => {
  const proAtLimit = createMockUser({
    ...proTierUser,
    clarifySessionsThisMonth: 20, // Pro limit is 20
  });
  const { caller } = createTestCaller(proAtLimit);

  await expect(caller.clarify.createSession({})).rejects.toMatchObject({
    code: 'FORBIDDEN',
    message: expect.stringMatching(/session.*limit/i),
  });
});

it('TC-CS-11: should allow creator to bypass limits', async () => {
  const creatorAtLimit = createMockUser({
    ...creatorUser,
    clarifySessionsThisMonth: 100, // Way over any limit
  });
  const { caller, mockQueries } = createTestCaller(creatorAtLimit);

  mockQueries({
    clarify_sessions: { data: createMockClarifySessionRow({ user_id: creatorAtLimit.id }), error: null },
    users: { data: null, error: null },
  });

  const result = await caller.clarify.createSession({});
  expect(result.session).toBeDefined();
});
```

## Anthropic Mock - Standard Text Response

```typescript
it('TC-CS-02: should create session with initial message (no tool use)', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  const mockSession = createMockClarifySessionRow({
    id: TEST_SESSION_ID,
    user_id: proTierUser.id,
  });

  mockQueries({
    clarify_sessions: { data: mockSession, error: null },
    clarify_messages: { data: null, error: null },
    users: { data: null, error: null },
  });

  // Standard text response - no tool use
  anthropicMock.messages.create.mockResolvedValue({
    id: 'msg_test_12345',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Welcome! I would love to help you explore your dreams. What brings you here today?',
      },
    ],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 500, output_tokens: 50 },
  });

  const result = await caller.clarify.createSession({
    initialMessage: 'I want to explore my career goals',
  });

  expect(result.initialResponse).toBe(
    'Welcome! I would love to help you explore your dreams. What brings you here today?'
  );
  expect(result.toolUseResult).toBeNull();
});
```

## Anthropic Mock - Tool Use Flow (CRITICAL PATTERN)

This is the most important pattern for this iteration. The tool use flow requires **two sequential API calls**:

1. First call returns `tool_use` block (createDream tool)
2. Second call returns text response (follow-up after tool execution)

```typescript
it('TC-CS-03: should create session with initial message triggering createDream tool', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  const mockSession = createMockClarifySessionRow({
    id: TEST_SESSION_ID,
    user_id: proTierUser.id,
  });

  const mockDream = {
    id: TEST_DREAM_ID,
    title: 'Start a Creative Business',
  };

  mockQueries({
    clarify_sessions: { data: mockSession, error: null },
    clarify_messages: { data: null, error: null },
    users: { data: null, error: null },
    dreams: { data: mockDream, error: null },
  });

  // CHAINED MOCK - First call returns tool_use, second returns follow-up text
  anthropicMock.messages.create
    .mockResolvedValueOnce({
      id: 'msg_tool_12345',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01ABC123',
          name: 'createDream',
          input: {
            title: 'Start a Creative Business',
            description: 'Launch a business combining creativity with technology',
            category: 'entrepreneurial',
          },
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      stop_reason: 'tool_use',
      stop_sequence: null,
      usage: { input_tokens: 500, output_tokens: 80 },
    })
    .mockResolvedValueOnce({
      id: 'msg_followup_12345',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'I have created a dream for you called "Start a Creative Business". This captures your vision of combining creativity with technology. Shall we explore this further?',
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 600, output_tokens: 40 },
    });

  const result = await caller.clarify.createSession({
    initialMessage: 'I want to start a creative business combining art and tech',
  });

  // Verify tool use result
  expect(result.toolUseResult).toEqual({
    dreamId: TEST_DREAM_ID,
    success: true,
  });

  // Verify follow-up response
  expect(result.initialResponse).toContain('Start a Creative Business');

  // Verify Anthropic was called twice
  expect(anthropicMock.messages.create).toHaveBeenCalledTimes(2);
});
```

## Tool Use - Failed Dream Creation

```typescript
it('TC-SM-10: should handle tool use with dream creation failure', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  const mockSession = createMockClarifySessionRow({
    id: TEST_SESSION_ID,
    user_id: proTierUser.id,
  });

  mockQueries({
    clarify_sessions: { data: mockSession, error: null },
    clarify_messages: { data: [createMockClarifyMessageRow({ role: 'user' })], error: null },
    users: { data: null, error: null },
    dreams: { data: null, error: new Error('Database constraint violation') },
  });

  anthropicMock.messages.create
    .mockResolvedValueOnce({
      id: 'msg_tool_12345',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01ABC123',
          name: 'createDream',
          input: { title: 'My Dream' },
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      stop_reason: 'tool_use',
      usage: { input_tokens: 500, output_tokens: 80 },
    })
    .mockResolvedValueOnce({
      id: 'msg_followup_12345',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'I tried to create the dream but encountered an issue. Let us continue our conversation.',
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      stop_reason: 'end_turn',
      usage: { input_tokens: 600, output_tokens: 40 },
    });

  const result = await caller.clarify.sendMessage({
    sessionId: TEST_SESSION_ID,
    content: 'Create a dream for me',
  });

  expect(result.toolUseResult).toEqual({
    dreamId: '',
    success: false,
  });
});
```

## Session Ownership Verification Pattern

```typescript
it('TC-SM-14: should reject message to non-owned session', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  // Return no session for ownership check
  mockQueries({
    clarify_sessions: { data: null, error: null },
  });

  await expect(
    caller.clarify.sendMessage({
      sessionId: TEST_SESSION_ID,
      content: 'Hello',
    })
  ).rejects.toMatchObject({
    code: 'NOT_FOUND',
    message: 'Session not found',
  });
});
```

## Pagination Test Pattern (listSessions)

```typescript
it('TC-LS-04: should handle pagination with cursor', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  const cursorSession = createMockClarifySessionRow({
    id: 'cursor-session-id',
    last_message_at: '2025-01-15T10:00:00Z',
  });

  const olderSessions = Array.from({ length: 3 }, (_, i) =>
    createMockClarifySessionRow({
      id: `session-${i}`,
      user_id: proTierUser.id,
      last_message_at: `2025-01-${14 - i}T10:00:00Z`,
    })
  );

  // First query for cursor session's last_message_at
  // Then query for sessions older than cursor
  mockQueries({
    clarify_sessions: { data: [...olderSessions, createMockClarifySessionRow()], error: null },
  });

  const result = await caller.clarify.listSessions({
    cursor: 'cursor-session-id',
    limit: 3,
  });

  expect(result.sessions.length).toBeLessThanOrEqual(3);
  expect(result.nextCursor).toBeDefined();
});

it('TC-LS-07: should handle empty results', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    clarify_sessions: { data: [], error: null },
  });

  const result = await caller.clarify.listSessions({});

  expect(result.sessions).toEqual([]);
  expect(result.nextCursor).toBeUndefined();
});
```

## Error Handling Patterns

### Database Error

```typescript
it('TC-CS-13: should handle session creation database error', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    clarify_sessions: { data: null, error: new Error('Database connection failed') },
  });

  await expect(caller.clarify.createSession({})).rejects.toMatchObject({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to create session',
  });
});
```

### Anthropic API Error

```typescript
it('TC-CS-14: should handle Anthropic API error during initial message', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    clarify_sessions: { data: createMockClarifySessionRow({ user_id: proTierUser.id }), error: null },
    clarify_messages: { data: null, error: null },
    users: { data: null, error: null },
  });

  anthropicMock.messages.create.mockRejectedValue(new Error('API rate limit exceeded'));

  // createSession catches the error and continues without AI response
  const result = await caller.clarify.createSession({
    initialMessage: 'Hello',
  });

  expect(result.session).toBeDefined();
  expect(result.initialResponse).toBeNull();
});
```

### No Text Response

```typescript
it('TC-SM-16: should handle Anthropic returning no text response', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    clarify_sessions: { data: createMockClarifySessionRow({ user_id: proTierUser.id }), error: null },
    clarify_messages: { data: [createMockClarifyMessageRow()], error: null },
  });

  // Response with empty content
  anthropicMock.messages.create.mockResolvedValue({
    id: 'msg_empty_12345',
    type: 'message',
    role: 'assistant',
    content: [], // No text block
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    usage: { input_tokens: 100, output_tokens: 0 },
  });

  await expect(
    caller.clarify.sendMessage({
      sessionId: TEST_SESSION_ID,
      content: 'Hello',
    })
  ).rejects.toMatchObject({
    code: 'INTERNAL_SERVER_ERROR',
    message: expect.stringContaining('Failed to generate'),
  });
});
```

## getLimits Test Pattern

```typescript
it('TC-GL-03: should return canCreateSession=true when under limit', async () => {
  const proUnderLimit = createMockUser({
    ...proTierUser,
    clarifySessionsThisMonth: 5, // Under 20 limit
  });
  const { caller } = createTestCaller(proUnderLimit);

  const result = await caller.clarify.getLimits();

  expect(result).toEqual({
    tier: 'pro',
    sessionsUsed: 5,
    sessionsLimit: 20,
    sessionsRemaining: 15,
    canCreateSession: true,
  });
});

it('TC-GL-04: should return canCreateSession=false when at limit', async () => {
  const proAtLimit = createMockUser({
    ...proTierUser,
    clarifySessionsThisMonth: 20,
  });
  const { caller } = createTestCaller(proAtLimit);

  const result = await caller.clarify.getLimits();

  expect(result).toEqual({
    tier: 'pro',
    sessionsUsed: 20,
    sessionsLimit: 20,
    sessionsRemaining: 0,
    canCreateSession: false,
  });
});

it('TC-GL-05: should return canCreateSession=true for creator at limit', async () => {
  const creatorAtLimit = createMockUser({
    ...creatorUser,
    clarifySessionsThisMonth: 100,
  });
  const { caller } = createTestCaller(creatorAtLimit);

  const result = await caller.clarify.getLimits();

  expect(result.canCreateSession).toBe(true);
});
```

## getPatterns Test Pattern

```typescript
it('TC-GP-01: should return user patterns', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  const mockPatterns = [
    createMockClarifyPatternRow({
      id: 'pattern-1',
      user_id: proTierUser.id,
      pattern_type: 'recurring_theme',
      content: 'User frequently mentions creative expression',
    }),
    createMockClarifyPatternRow({
      id: 'pattern-2',
      user_id: proTierUser.id,
      pattern_type: 'tension',
      content: 'Conflict between stability and adventure',
    }),
  ];

  mockQueries({
    clarify_patterns: { data: mockPatterns, error: null },
  });

  const result = await caller.clarify.getPatterns();

  expect(result.patterns).toHaveLength(2);
  expect(result.patterns[0]).toMatchObject({
    patternType: 'recurring_theme',
  });
});

it('TC-GP-02: should return empty array when no patterns', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    clarify_patterns: { data: [], error: null },
  });

  const result = await caller.clarify.getPatterns();

  expect(result.patterns).toEqual([]);
});
```

## Cache Invalidation Test Pattern

```typescript
it('TC-CS-05: should invalidate sessions cache after creation', async () => {
  const { caller, mockQueries } = createTestCaller(proTierUser);

  mockQueries({
    clarify_sessions: { data: createMockClarifySessionRow({ user_id: proTierUser.id }), error: null },
    users: { data: null, error: null },
  });

  await caller.clarify.createSession({});

  expect(cacheMock.cacheDelete).toHaveBeenCalledWith(`ctx:sessions:${proTierUser.id}`);
});
```

## Input Validation Test Pattern

```typescript
it('TC-SM-XX: should reject invalid sessionId format', async () => {
  const { caller } = createTestCaller(proTierUser);

  await expect(
    caller.clarify.sendMessage({
      sessionId: 'not-a-valid-uuid',
      content: 'Hello',
    })
  ).rejects.toThrow();
});

it('TC-SM-XX: should reject empty content', async () => {
  const { caller } = createTestCaller(proTierUser);

  await expect(
    caller.clarify.sendMessage({
      sessionId: TEST_SESSION_ID,
      content: '',
    })
  ).rejects.toThrow();
});

it('TC-SM-XX: should reject content exceeding max length', async () => {
  const { caller } = createTestCaller(proTierUser);

  await expect(
    caller.clarify.sendMessage({
      sessionId: TEST_SESSION_ID,
      content: 'x'.repeat(4001), // Max is 4000
    })
  ).rejects.toThrow();
});
```

## Demo User Read Access Pattern

```typescript
it('TC-GS-02: should allow demo user to read session', async () => {
  const { caller, mockQueries } = createTestCaller(demoUser);

  const mockSession = createMockClarifySessionRow({
    id: TEST_SESSION_ID,
    user_id: demoUser.id,
  });

  const mockMessages = [
    createMockClarifyMessageRow({ role: 'user', content: 'Hello' }),
    createMockClarifyMessageRow({ role: 'assistant', content: 'Hi there!' }),
  ];

  mockQueries({
    clarify_sessions: { data: mockSession, error: null },
    clarify_messages: { data: mockMessages, error: null },
  });

  const result = await caller.clarify.getSession({ sessionId: TEST_SESSION_ID });

  expect(result.session).toBeDefined();
  expect(result.messages).toHaveLength(2);
});

it('TC-LS-08: should allow demo user to list sessions', async () => {
  const { caller, mockQueries } = createTestCaller(demoUser);

  mockQueries({
    clarify_sessions: { data: [createMockClarifySessionRow({ user_id: demoUser.id })], error: null },
  });

  const result = await caller.clarify.listSessions({});

  expect(result.sessions).toBeDefined();
});
```

## Testing Patterns

### Test File Naming Convention
- Integration tests: `{feature}.test.ts` in `test/integration/{feature}/`

### Test Structure Convention
```typescript
describe('clarify.{procedureName}', () => {
  describe('success cases', () => {
    it('TC-XX-01: should {expected behavior}', async () => { /* ... */ });
  });

  describe('authorization', () => {
    it('TC-XX-XX: should reject {unauthorized case}', async () => { /* ... */ });
  });

  describe('error handling', () => {
    it('TC-XX-XX: should handle {error case}', async () => { /* ... */ });
  });
});
```

### Mocking Strategy
- Use `mockQueries` for multiple table responses
- Use chained `mockResolvedValueOnce` for sequential API calls
- Clear mocks automatically via `createTestCaller`
- Restore default mocks in `beforeEach` when needed

### Assertion Patterns
- Use `toMatchObject` for partial object matching
- Use `expect.stringContaining` for flexible string matching
- Use `toEqual` for exact object matching
- Use `rejects.toMatchObject` for error assertions
