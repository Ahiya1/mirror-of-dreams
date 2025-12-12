// test/mocks/anthropic.ts - Anthropic API mock factory
// Provides reusable mock factories for testing Claude API interactions

import { vi } from 'vitest';

/**
 * Content block types from Anthropic API
 */
export interface TextContentBlock {
  type: 'text';
  text: string;
}

export interface ThinkingContentBlock {
  type: 'thinking';
  thinking: string;
}

/**
 * Tool use content block from Anthropic API
 */
export interface ToolUseContentBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type ContentBlock = TextContentBlock | ThinkingContentBlock | ToolUseContentBlock;

/**
 * Usage information from API response
 */
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

/**
 * Anthropic message response structure
 */
export interface AnthropicMessageResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
  stop_sequence: string | null;
  usage: Usage;
}

/**
 * Creates a mock Anthropic message response
 *
 * @param overrides - Partial response to merge with defaults
 * @returns Complete mock message response
 *
 * Usage:
 * ```typescript
 * const response = createMockMessageResponse({
 *   content: [{ type: 'text', text: 'Hello!' }],
 * });
 * ```
 */
export const createMockMessageResponse = (
  overrides: Partial<AnthropicMessageResponse> = {}
): AnthropicMessageResponse => ({
  id: 'msg_test_12345',
  type: 'message',
  role: 'assistant',
  content: [{ type: 'text', text: 'This is a test response from Claude.' }],
  model: 'claude-sonnet-4-20250514',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: {
    input_tokens: 100,
    output_tokens: 50,
  },
  ...overrides,
});

/**
 * Creates a mock response with thinking (extended thinking)
 */
export const createMockThinkingResponse = (
  thinking: string,
  response: string,
  overrides: Partial<AnthropicMessageResponse> = {}
): AnthropicMessageResponse =>
  createMockMessageResponse({
    content: [
      { type: 'thinking', thinking },
      { type: 'text', text: response },
    ],
    ...overrides,
  });

/**
 * Creates the Anthropic messages.create mock function
 */
export const createMessagesCreateMock = () => {
  return vi.fn().mockResolvedValue(createMockMessageResponse());
};

/**
 * Creates a streaming mock for messages.stream
 * Returns an async iterator for streaming responses
 */
export const createMessagesStreamMock = () => {
  const mockStream = {
    on: vi.fn().mockReturnThis(),
    [Symbol.asyncIterator]: vi.fn().mockImplementation(async function* () {
      yield {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' },
      };
      yield {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: 'Test streaming response' },
      };
      yield {
        type: 'content_block_stop',
        index: 0,
      };
      yield {
        type: 'message_stop',
      };
    }),
    finalMessage: vi.fn().mockResolvedValue(createMockMessageResponse()),
  };

  return vi.fn().mockReturnValue(mockStream);
};

/**
 * Creates a full Anthropic client mock
 *
 * Usage:
 * ```typescript
 * vi.mock('@anthropic-ai/sdk', () => ({
 *   default: vi.fn().mockImplementation(() => createAnthropicMock()),
 * }));
 * ```
 */
export const createAnthropicMock = () => ({
  messages: {
    create: createMessagesCreateMock(),
    stream: createMessagesStreamMock(),
  },
  beta: {
    messages: {
      create: createMessagesCreateMock(),
      stream: createMessagesStreamMock(),
    },
  },
});

/**
 * Type for the Anthropic client mock
 */
export type AnthropicMock = ReturnType<typeof createAnthropicMock>;

/**
 * Pre-configured module mock for vi.mock()
 */
export const anthropicMock = createAnthropicMock();

/**
 * Helper to create an API error response
 */
export const createAnthropicError = (
  message: string,
  type:
    | 'invalid_request_error'
    | 'authentication_error'
    | 'rate_limit_error'
    | 'api_error' = 'api_error',
  status: number = 500
): Error => {
  const error = new Error(message);
  (error as any).status = status;
  (error as any).type = type;
  return error;
};

/**
 * Common error scenarios
 */
export const anthropicErrors = {
  unauthorized: createAnthropicError('Invalid API key', 'authentication_error', 401),
  rateLimited: createAnthropicError('Rate limit exceeded', 'rate_limit_error', 429),
  invalidRequest: createAnthropicError('Invalid request format', 'invalid_request_error', 400),
  serverError: createAnthropicError('Internal server error', 'api_error', 500),
  overloaded: createAnthropicError('API is overloaded', 'api_error', 529),
};

/**
 * Pre-built response scenarios for common test cases
 */
export const mockResponses = {
  /**
   * Standard reflection response
   */
  reflection: createMockMessageResponse({
    content: [
      {
        type: 'text',
        text: 'Your reflection reveals a deep sense of searching. You speak of uncertainty, yet there is wisdom in acknowledging what you do not know.',
      },
    ],
    usage: { input_tokens: 500, output_tokens: 150 },
  }),

  /**
   * Clarify session response
   */
  clarify: createMockMessageResponse({
    content: [
      {
        type: 'text',
        text: 'I understand you want to explore this further. Let me ask: what does this feeling remind you of from your past?',
      },
    ],
    usage: { input_tokens: 300, output_tokens: 80 },
  }),

  /**
   * Evolution summary response
   */
  evolution: createMockMessageResponse({
    content: [
      {
        type: 'text',
        text: 'Over the past month, your reflections show a journey from uncertainty to emerging clarity. Key themes include self-discovery and acceptance.',
      },
    ],
    usage: { input_tokens: 2000, output_tokens: 500 },
  }),

  /**
   * Response with extended thinking
   */
  withThinking: createMockThinkingResponse(
    'Let me consider the emotional undertones and deeper meaning in this reflection...',
    'Your words carry a weight of both hope and hesitation. This tension is not weakness - it is the space where growth happens.'
  ),

  /**
   * Empty/short response (edge case)
   */
  minimal: createMockMessageResponse({
    content: [{ type: 'text', text: '' }],
    usage: { input_tokens: 50, output_tokens: 0 },
    stop_reason: 'max_tokens',
  }),
};

// =============================================================================
// TOOL USE HELPERS
// =============================================================================

/**
 * Input schema for createDream tool
 */
export interface CreateDreamToolInput {
  title: string;
  description?: string;
  category?: string;
}

/**
 * Creates a mock tool_use response for createDream
 *
 * @param toolInput - The input that Claude would pass to the tool
 * @param toolUseId - Optional custom tool use ID (defaults to 'toolu_test_123')
 * @returns AnthropicMessageResponse with tool_use content block
 *
 * @example
 * ```typescript
 * const response = createMockToolUseResponse({
 *   title: 'My Dream',
 *   category: 'personal_growth',
 * });
 * ```
 */
export const createMockToolUseResponse = (
  toolInput: CreateDreamToolInput,
  toolUseId: string = 'toolu_test_123'
): AnthropicMessageResponse => ({
  id: 'msg_tool_123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'tool_use',
      id: toolUseId,
      name: 'createDream',
      input: toolInput as unknown as Record<string, unknown>,
    },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'tool_use',
  stop_sequence: null,
  usage: { input_tokens: 100, output_tokens: 30 },
});

/**
 * Creates a mock follow-up text response after tool execution
 *
 * @param text - The text response from Claude after tool execution
 * @returns AnthropicMessageResponse with text content block
 *
 * @example
 * ```typescript
 * const followUp = createMockToolFollowUpResponse("I've created that dream for you!");
 * ```
 */
export const createMockToolFollowUpResponse = (text: string): AnthropicMessageResponse => ({
  id: 'msg_followup_456',
  type: 'message',
  role: 'assistant',
  content: [{ type: 'text', text }],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 150, output_tokens: 40 },
});

/**
 * Type for the mock function from vi.fn()
 */
type MockFunction = ReturnType<typeof vi.fn>;

/**
 * Configures an Anthropic mock to return a tool_use response followed by a text follow-up.
 * This simulates the two-step tool use flow:
 * 1. First API call returns tool_use block
 * 2. After tool execution, second API call returns acknowledgment text
 *
 * @param messagesCreateMock - The messages.create mock function to configure
 * @param toolInput - The tool input for createDream
 * @param followUpText - The text response after tool execution
 *
 * @example
 * ```typescript
 * mockAnthropicToolUse(
 *   anthropicMock.messages.create,
 *   { title: 'My Dream', category: 'personal_growth' },
 *   "I've created that dream for you!"
 * );
 * ```
 */
export function mockAnthropicToolUse(
  messagesCreateMock: MockFunction,
  toolInput: CreateDreamToolInput,
  followUpText: string
): void {
  messagesCreateMock
    .mockResolvedValueOnce(createMockToolUseResponse(toolInput))
    .mockResolvedValueOnce(createMockToolFollowUpResponse(followUpText));
}

/**
 * Creates a mock response with no text block (edge case for error handling)
 * This simulates a response that has only tool_use but no text content
 */
export const createMockNoTextBlockResponse = (): AnthropicMessageResponse => ({
  id: 'msg_no_text_123',
  type: 'message',
  role: 'assistant',
  content: [], // Empty content array
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 100, output_tokens: 0 },
});
