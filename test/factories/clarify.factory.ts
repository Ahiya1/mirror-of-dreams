// test/factories/clarify.factory.ts - Clarify Agent test data factory
// Provides reusable factories for ClarifySession, ClarifyMessage, and ClarifyPattern

import type {
  ClarifySession,
  ClarifySessionRow,
  ClarifyMessage,
  ClarifyMessageRow,
  ClarifyPattern,
  ClarifyPatternRow,
  ClarifySessionStatus,
  ClarifyMessageRole,
  PatternType,
  ClarifyToolUse,
} from '@/types/clarify';

// =============================================================================
// ClarifySession Factories
// =============================================================================

/**
 * Creates a mock ClarifySession with sensible defaults
 *
 * @param overrides - Partial session data to merge with defaults
 * @returns Complete ClarifySession object
 *
 * @example
 * ```typescript
 * const session = createMockClarifySession({ status: 'archived' });
 * ```
 */
export const createMockClarifySession = (
  overrides: Partial<ClarifySession> = {}
): ClarifySession => ({
  id: 'session-uuid-1234',
  userId: 'test-user-uuid-1234',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  title: 'Test Clarify Session',
  lastMessageAt: new Date().toISOString(),
  messageCount: 0,
  status: 'active',
  dreamId: null,
  ...overrides,
});

/**
 * Creates a mock ClarifySessionRow (database representation)
 *
 * @param overrides - Partial row data to merge with defaults
 * @returns Complete ClarifySessionRow object
 *
 * @example
 * ```typescript
 * const sessionRow = createMockClarifySessionRow({ status: 'archived' });
 * ```
 */
export const createMockClarifySessionRow = (
  overrides: Partial<ClarifySessionRow> = {}
): ClarifySessionRow => ({
  id: 'session-uuid-1234',
  user_id: 'test-user-uuid-1234',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  title: 'Test Clarify Session',
  last_message_at: new Date().toISOString(),
  message_count: 0,
  status: 'active',
  dream_id: null,
  ...overrides,
});

// =============================================================================
// ClarifyMessage Factories
// =============================================================================

/**
 * Creates a mock ClarifyMessage
 *
 * @param overrides - Partial message data to merge with defaults
 * @returns Complete ClarifyMessage object
 *
 * @example
 * ```typescript
 * const message = createMockClarifyMessage({ role: 'assistant' });
 * ```
 */
export const createMockClarifyMessage = (
  overrides: Partial<ClarifyMessage> = {}
): ClarifyMessage => ({
  id: 'message-uuid-1234',
  sessionId: 'session-uuid-1234',
  createdAt: new Date().toISOString(),
  role: 'user',
  content: 'Test message content',
  tokenCount: 50,
  toolUse: null,
  ...overrides,
});

/**
 * Creates a mock ClarifyMessageRow (database representation)
 *
 * @param overrides - Partial row data to merge with defaults
 * @returns Complete ClarifyMessageRow object
 *
 * @example
 * ```typescript
 * const messageRow = createMockClarifyMessageRow({ role: 'assistant' });
 * ```
 */
export const createMockClarifyMessageRow = (
  overrides: Partial<ClarifyMessageRow> = {}
): ClarifyMessageRow => ({
  id: 'message-uuid-1234',
  session_id: 'session-uuid-1234',
  created_at: new Date().toISOString(),
  role: 'user',
  content: 'Test message content',
  token_count: 50,
  tool_use: null,
  ...overrides,
});

// =============================================================================
// ClarifyPattern Factories
// =============================================================================

/**
 * Creates a mock ClarifyPattern
 *
 * @param overrides - Partial pattern data to merge with defaults
 * @returns Complete ClarifyPattern object
 *
 * @example
 * ```typescript
 * const pattern = createMockClarifyPattern({ patternType: 'tension' });
 * ```
 */
export const createMockClarifyPattern = (
  overrides: Partial<ClarifyPattern> = {}
): ClarifyPattern => ({
  id: 'pattern-uuid-1234',
  userId: 'test-user-uuid-1234',
  sessionId: 'session-uuid-1234',
  patternType: 'recurring_theme',
  content: 'Test pattern content about recurring themes',
  strength: 0.75,
  extractedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a mock ClarifyPatternRow (database representation)
 *
 * @param overrides - Partial row data to merge with defaults
 * @returns Complete ClarifyPatternRow object
 *
 * @example
 * ```typescript
 * const patternRow = createMockClarifyPatternRow({ pattern_type: 'tension' });
 * ```
 */
export const createMockClarifyPatternRow = (
  overrides: Partial<ClarifyPatternRow> = {}
): ClarifyPatternRow => ({
  id: 'pattern-uuid-1234',
  user_id: 'test-user-uuid-1234',
  session_id: 'session-uuid-1234',
  pattern_type: 'recurring_theme',
  content: 'Test pattern content about recurring themes',
  strength: 0.75,
  extracted_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// =============================================================================
// Pre-configured Session Scenarios
// =============================================================================

/**
 * Active session - currently in use
 */
export const activeSession = createMockClarifySession({
  id: 'active-session-001',
  title: 'Exploring Career Goals',
  status: 'active',
  messageCount: 5,
});

/**
 * Archived session - completed conversation
 */
export const archivedSession = createMockClarifySession({
  id: 'archived-session-001',
  title: 'Past Conversation',
  status: 'archived',
  messageCount: 20,
});

/**
 * Session linked to a dream
 */
export const sessionWithDream = createMockClarifySession({
  id: 'dream-session-001',
  title: 'Dream Exploration',
  dreamId: 'dream-uuid-linked',
  messageCount: 8,
});

/**
 * Empty session - just created
 */
export const emptySession = createMockClarifySession({
  id: 'empty-session-001',
  title: 'New Conversation',
  messageCount: 0,
});

// =============================================================================
// Pre-configured Message Scenarios
// =============================================================================

/**
 * User message - question from user
 */
export const userMessage = createMockClarifyMessage({
  id: 'user-message-001',
  role: 'user',
  content: 'What should I focus on for my career goals?',
});

/**
 * Assistant message - response from Clarify
 */
export const assistantMessage = createMockClarifyMessage({
  id: 'assistant-message-001',
  role: 'assistant',
  content:
    'Based on what you have shared, it seems like you value creativity and autonomy. Let us explore what career paths might align with these values.',
  tokenCount: 150,
});

/**
 * Message with tool use - dream creation
 */
export const messageWithToolUse = createMockClarifyMessage({
  id: 'tool-message-001',
  role: 'assistant',
  content: 'I have created a dream for you based on our conversation.',
  toolUse: {
    name: 'createDream',
    input: {
      title: 'Start a Creative Business',
      description: 'Launch a business that combines creativity with technology',
      category: 'entrepreneurial',
    },
    result: {
      dreamId: 'created-dream-001',
      success: true,
    },
  },
});

/**
 * Long message - detailed response
 */
export const longMessage = createMockClarifyMessage({
  id: 'long-message-001',
  role: 'assistant',
  content: 'This is a detailed response '.repeat(50),
  tokenCount: 500,
});

// =============================================================================
// Pre-configured Pattern Scenarios
// =============================================================================

/**
 * Recurring theme pattern
 */
export const recurringThemePattern = createMockClarifyPattern({
  id: 'recurring-theme-001',
  patternType: 'recurring_theme',
  content: 'User consistently mentions desire for creative expression',
  strength: 0.85,
});

/**
 * Tension pattern
 */
export const tensionPattern = createMockClarifyPattern({
  id: 'tension-001',
  patternType: 'tension',
  content: 'Conflict between stability needs and desire for adventure',
  strength: 0.7,
});

/**
 * Potential dream pattern
 */
export const potentialDreamPattern = createMockClarifyPattern({
  id: 'potential-dream-001',
  patternType: 'potential_dream',
  content: 'User shows interest in starting a creative business',
  strength: 0.9,
});

/**
 * Identity signal pattern
 */
export const identitySignalPattern = createMockClarifyPattern({
  id: 'identity-signal-001',
  patternType: 'identity_signal',
  content: 'Strong identification with being a creative problem solver',
  strength: 0.8,
});

// =============================================================================
// Factory Functions for Dynamic Generation
// =============================================================================

/**
 * Creates a session with pre-populated messages
 *
 * @param messageCount - Number of messages to create
 * @param overrides - Additional session overrides
 * @returns Object containing session and its messages
 *
 * @example
 * ```typescript
 * const { session, messages } = createSessionWithMessages(10);
 * ```
 */
export const createSessionWithMessages = (
  messageCount: number,
  overrides: Partial<ClarifySession> = {}
): { session: ClarifySession; messages: ClarifyMessage[] } => {
  const session = createMockClarifySession({
    messageCount,
    ...overrides,
  });

  const messages = Array.from({ length: messageCount }, (_, index) =>
    createMockClarifyMessage({
      id: `message-${index + 1}`,
      sessionId: session.id,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${index + 1} content`,
      createdAt: new Date(Date.now() - (messageCount - index) * 60000).toISOString(),
    })
  );

  return { session, messages };
};

/**
 * Creates multiple sessions for a user
 *
 * @param count - Number of sessions to create
 * @param userId - User ID for all sessions
 * @returns Array of ClarifySession objects
 *
 * @example
 * ```typescript
 * const sessions = createMockClarifySessions(5, 'user-123');
 * ```
 */
export const createMockClarifySessions = (
  count: number,
  userId: string = 'test-user-uuid-1234'
): ClarifySession[] =>
  Array.from({ length: count }, (_, index) =>
    createMockClarifySession({
      id: `session-${index + 1}`,
      userId,
      title: `Session ${index + 1}`,
      messageCount: (index + 1) * 2,
      createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    })
  );

/**
 * Creates multiple messages for a session
 *
 * @param count - Number of messages to create
 * @param sessionId - Session ID for all messages
 * @returns Array of ClarifyMessage objects
 *
 * @example
 * ```typescript
 * const messages = createMockClarifyMessages(10, 'session-123');
 * ```
 */
export const createMockClarifyMessages = (
  count: number,
  sessionId: string = 'session-uuid-1234'
): ClarifyMessage[] =>
  Array.from({ length: count }, (_, index) =>
    createMockClarifyMessage({
      id: `message-${index + 1}`,
      sessionId,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${index + 1} content`,
      createdAt: new Date(Date.now() - (count - index) * 60000).toISOString(),
    })
  );

/**
 * Creates multiple patterns for a user
 *
 * @param count - Number of patterns to create
 * @param userId - User ID for all patterns
 * @returns Array of ClarifyPattern objects
 *
 * @example
 * ```typescript
 * const patterns = createMockClarifyPatterns(4, 'user-123');
 * ```
 */
export const createMockClarifyPatterns = (
  count: number,
  userId: string = 'test-user-uuid-1234'
): ClarifyPattern[] => {
  const patternTypes: PatternType[] = [
    'recurring_theme',
    'tension',
    'potential_dream',
    'identity_signal',
  ];

  return Array.from({ length: count }, (_, index) =>
    createMockClarifyPattern({
      id: `pattern-${index + 1}`,
      userId,
      patternType: patternTypes[index % patternTypes.length],
      content: `Pattern ${index + 1} content`,
      strength: 0.5 + (index % 5) * 0.1,
    })
  );
};

/**
 * Creates a session for a specific user
 *
 * @param userId - User ID for the session
 * @param overrides - Additional overrides
 * @returns ClarifySession object
 *
 * @example
 * ```typescript
 * const session = createSessionForUser('user-123', { title: 'My Session' });
 * ```
 */
export const createSessionForUser = (
  userId: string,
  overrides: Partial<ClarifySession> = {}
): ClarifySession =>
  createMockClarifySession({
    userId,
    ...overrides,
  });

/**
 * Creates a message with specific role
 *
 * @param role - Message role (user or assistant)
 * @param overrides - Additional overrides
 * @returns ClarifyMessage object
 *
 * @example
 * ```typescript
 * const msg = createMessageWithRole('assistant', { content: 'Hello!' });
 * ```
 */
export const createMessageWithRole = (
  role: ClarifyMessageRole,
  overrides: Partial<ClarifyMessage> = {}
): ClarifyMessage =>
  createMockClarifyMessage({
    role,
    ...overrides,
  });

/**
 * Creates a pattern with specific type
 *
 * @param patternType - Type of pattern
 * @param overrides - Additional overrides
 * @returns ClarifyPattern object
 *
 * @example
 * ```typescript
 * const pattern = createPatternWithType('tension', { strength: 0.9 });
 * ```
 */
export const createPatternWithType = (
  patternType: PatternType,
  overrides: Partial<ClarifyPattern> = {}
): ClarifyPattern =>
  createMockClarifyPattern({
    patternType,
    ...overrides,
  });

/**
 * Creates a tool use object for dream creation
 *
 * @param dreamTitle - Title for the dream
 * @param success - Whether the dream creation succeeded
 * @returns ClarifyToolUse object
 *
 * @example
 * ```typescript
 * const toolUse = createDreamToolUse('Start a Business', true);
 * ```
 */
export const createDreamToolUse = (
  dreamTitle: string,
  success: boolean = true
): ClarifyToolUse => ({
  name: 'createDream',
  input: {
    title: dreamTitle,
    description: `Description for ${dreamTitle}`,
    category: 'personal_growth',
  },
  result: success
    ? {
        dreamId: `created-dream-${Date.now()}`,
        success: true,
      }
    : undefined,
});

// =============================================================================
// Session Status Helper
// =============================================================================

/**
 * Creates a session with specific status
 *
 * @param status - Session status (active or archived)
 * @param overrides - Additional overrides
 * @returns ClarifySession object
 *
 * @example
 * ```typescript
 * const archived = createSessionWithStatus('archived');
 * ```
 */
export const createSessionWithStatus = (
  status: ClarifySessionStatus,
  overrides: Partial<ClarifySession> = {}
): ClarifySession =>
  createMockClarifySession({
    status,
    ...overrides,
  });
