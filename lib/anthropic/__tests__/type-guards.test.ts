// lib/anthropic/__tests__/type-guards.test.ts
// Tests for Anthropic SDK content block type guards

import { describe, expect, it } from 'vitest';

import {
  extractText,
  extractThinking,
  isTextBlock,
  isThinkingBlock,
  isToolResultBlock,
  isToolUseBlock,
} from '../type-guards';

import type Anthropic from '@anthropic-ai/sdk';

// =====================================================
// MOCK DATA FACTORIES
// =====================================================

/**
 * Create a mock TextBlock
 * Note: We cast to the type since we only need to match the shape for type guards
 */
const createTextBlock = (text: string) =>
  ({
    type: 'text' as const,
    text,
    citations: null,
  }) as Anthropic.TextBlock;

/**
 * Create a mock ThinkingBlock
 */
const createThinkingBlock = (thinking: string) =>
  ({
    type: 'thinking' as const,
    thinking,
    signature: 'test-signature',
  }) as Anthropic.ThinkingBlock;

/**
 * Create a mock ToolUseBlock
 */
const createToolUseBlock = (name: string, input: unknown) =>
  ({
    type: 'tool_use' as const,
    id: 'tool_123',
    name,
    input,
  }) as Anthropic.ToolUseBlock;

/**
 * Create a mock ToolResultBlockParam
 */
const createToolResultBlock = (toolUseId: string, content: string) =>
  ({
    type: 'tool_result' as const,
    tool_use_id: toolUseId,
    content,
  }) as Anthropic.ToolResultBlockParam;

/**
 * Create a mock Message response
 * Note: We cast to the type since we only need to match the shape for type guards
 */
const createMockMessage = (content: Anthropic.ContentBlock[]) =>
  ({
    id: 'msg_123',
    type: 'message' as const,
    role: 'assistant' as const,
    content,
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn' as const,
    stop_sequence: null,
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      server_tool_use: null,
      service_tier: null,
    },
  }) as Anthropic.Message;

// =====================================================
// isTextBlock TESTS
// =====================================================

describe('isTextBlock', () => {
  // -------------------------------------------------
  // Success Cases
  // -------------------------------------------------

  describe('success cases', () => {
    it('returns true for text blocks', () => {
      const block = createTextBlock('Hello world');
      expect(isTextBlock(block)).toBe(true);
    });

    it('returns true for empty text blocks', () => {
      const block = createTextBlock('');
      expect(isTextBlock(block)).toBe(true);
    });

    it('returns true for text blocks with multiline content', () => {
      const block = createTextBlock('Line 1\nLine 2\nLine 3');
      expect(isTextBlock(block)).toBe(true);
    });
  });

  // -------------------------------------------------
  // Negative Cases
  // -------------------------------------------------

  describe('negative cases', () => {
    it('returns false for thinking blocks', () => {
      const block = createThinkingBlock('Thinking...');
      expect(isTextBlock(block)).toBe(false);
    });

    it('returns false for tool_use blocks', () => {
      const block = createToolUseBlock('calculator', { num: 5 });
      expect(isTextBlock(block)).toBe(false);
    });
  });
});

// =====================================================
// isThinkingBlock TESTS
// =====================================================

describe('isThinkingBlock', () => {
  // -------------------------------------------------
  // Success Cases
  // -------------------------------------------------

  describe('success cases', () => {
    it('returns true for thinking blocks', () => {
      const block = createThinkingBlock('Analyzing the problem...');
      expect(isThinkingBlock(block)).toBe(true);
    });

    it('returns true for empty thinking blocks', () => {
      const block = createThinkingBlock('');
      expect(isThinkingBlock(block)).toBe(true);
    });

    it('returns true for thinking blocks with complex content', () => {
      const block = createThinkingBlock('Step 1: Understand\nStep 2: Analyze\nStep 3: Respond');
      expect(isThinkingBlock(block)).toBe(true);
    });
  });

  // -------------------------------------------------
  // Negative Cases
  // -------------------------------------------------

  describe('negative cases', () => {
    it('returns false for text blocks', () => {
      const block = createTextBlock('Hello world');
      expect(isThinkingBlock(block)).toBe(false);
    });

    it('returns false for tool_use blocks', () => {
      const block = createToolUseBlock('search', { query: 'test' });
      expect(isThinkingBlock(block)).toBe(false);
    });
  });
});

// =====================================================
// isToolUseBlock TESTS
// =====================================================

describe('isToolUseBlock', () => {
  // -------------------------------------------------
  // Success Cases
  // -------------------------------------------------

  describe('success cases', () => {
    it('returns true for tool_use blocks', () => {
      const block = createToolUseBlock('calculator', { operation: 'add', a: 1, b: 2 });
      expect(isToolUseBlock(block)).toBe(true);
    });

    it('returns true for tool_use blocks with empty input', () => {
      const block = createToolUseBlock('get_time', {});
      expect(isToolUseBlock(block)).toBe(true);
    });

    it('returns true for tool_use blocks with complex input', () => {
      const block = createToolUseBlock('search', {
        query: 'test query',
        filters: { date: '2024-01-01', category: 'news' },
        options: ['sort', 'limit'],
      });
      expect(isToolUseBlock(block)).toBe(true);
    });
  });

  // -------------------------------------------------
  // Negative Cases
  // -------------------------------------------------

  describe('negative cases', () => {
    it('returns false for text blocks', () => {
      const block = createTextBlock('Hello world');
      expect(isToolUseBlock(block)).toBe(false);
    });

    it('returns false for thinking blocks', () => {
      const block = createThinkingBlock('Thinking...');
      expect(isToolUseBlock(block)).toBe(false);
    });
  });
});

// =====================================================
// isToolResultBlock TESTS
// =====================================================

describe('isToolResultBlock', () => {
  // -------------------------------------------------
  // Success Cases
  // -------------------------------------------------

  describe('success cases', () => {
    it('returns true for tool_result blocks', () => {
      const block = createToolResultBlock('tool_123', 'Result: 42');
      expect(isToolResultBlock(block)).toBe(true);
    });

    it('returns true for tool_result blocks with empty content', () => {
      const block = createToolResultBlock('tool_456', '');
      expect(isToolResultBlock(block)).toBe(true);
    });

    it('returns true for tool_result blocks with multiline content', () => {
      const block = createToolResultBlock('tool_789', 'Line 1\nLine 2\nLine 3');
      expect(isToolResultBlock(block)).toBe(true);
    });
  });

  // -------------------------------------------------
  // Negative Cases
  // -------------------------------------------------

  describe('negative cases', () => {
    it('returns false for text blocks', () => {
      const block: Anthropic.ContentBlockParam = {
        type: 'text' as const,
        text: 'Hello world',
      };
      expect(isToolResultBlock(block)).toBe(false);
    });

    it('returns false for tool_use blocks', () => {
      const block: Anthropic.ContentBlockParam = {
        type: 'tool_use' as const,
        id: 'tool_123',
        name: 'calculator',
        input: { num: 5 },
      };
      expect(isToolResultBlock(block)).toBe(false);
    });

    it('returns false for image blocks', () => {
      const block: Anthropic.ContentBlockParam = {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/png' as const,
          data: 'base64data',
        },
      };
      expect(isToolResultBlock(block)).toBe(false);
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('returns false for objects without type property', () => {
      const block = {
        tool_use_id: 'tool_123',
        content: 'Result',
      } as unknown as Anthropic.ContentBlockParam;
      expect(isToolResultBlock(block)).toBe(false);
    });
  });
});

// =====================================================
// extractText TESTS
// =====================================================

describe('extractText', () => {
  // -------------------------------------------------
  // Success Cases
  // -------------------------------------------------

  describe('success cases', () => {
    it('extracts text from message with single text block', () => {
      const message = createMockMessage([createTextBlock('Hello world')]);
      expect(extractText(message)).toBe('Hello world');
    });

    it('extracts first text block when multiple exist', () => {
      const message = createMockMessage([
        createTextBlock('First response'),
        createTextBlock('Second response'),
      ]);
      expect(extractText(message)).toBe('First response');
    });

    it('preserves whitespace and special characters', () => {
      const message = createMockMessage([
        createTextBlock('  Spaced text\nWith newlines\tAnd tabs  '),
      ]);
      expect(extractText(message)).toBe('  Spaced text\nWith newlines\tAnd tabs  ');
    });

    it('extracts text from message with unicode content', () => {
      const message = createMockMessage([createTextBlock('Hello!!! Testing unicode')]);
      expect(extractText(message)).toBe('Hello!!! Testing unicode');
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('returns empty string when no text blocks exist', () => {
      const message = createMockMessage([createThinkingBlock('Thinking...')]);
      expect(extractText(message)).toBe('');
    });

    it('returns empty string for empty content array', () => {
      const message = createMockMessage([]);
      expect(extractText(message)).toBe('');
    });

    it('returns empty string from empty text block', () => {
      const message = createMockMessage([createTextBlock('')]);
      expect(extractText(message)).toBe('');
    });
  });

  // -------------------------------------------------
  // Mixed Content Cases
  // -------------------------------------------------

  describe('mixed content', () => {
    it('finds text block among thinking and tool_use blocks', () => {
      const message = createMockMessage([
        createThinkingBlock('Let me think...'),
        createToolUseBlock('search', { query: 'test' }),
        createTextBlock('Here is the response'),
      ]);
      expect(extractText(message)).toBe('Here is the response');
    });

    it('finds first text block in complex mixed content', () => {
      const message = createMockMessage([
        createThinkingBlock('Analyzing...'),
        createTextBlock('First text'),
        createToolUseBlock('calculator', { num: 42 }),
        createTextBlock('Second text'),
      ]);
      expect(extractText(message)).toBe('First text');
    });

    it('skips non-text blocks to find text', () => {
      const message = createMockMessage([
        createToolUseBlock('tool1', {}),
        createToolUseBlock('tool2', {}),
        createTextBlock('After tools'),
      ]);
      expect(extractText(message)).toBe('After tools');
    });
  });
});

// =====================================================
// extractThinking TESTS
// =====================================================

describe('extractThinking', () => {
  // -------------------------------------------------
  // Success Cases
  // -------------------------------------------------

  describe('success cases', () => {
    it('extracts thinking from message with thinking block', () => {
      const message = createMockMessage([
        createThinkingBlock('Let me analyze this problem...'),
        createTextBlock('Here is my response'),
      ]);
      expect(extractThinking(message)).toBe('Let me analyze this problem...');
    });

    it('extracts first thinking block when multiple exist', () => {
      const message = createMockMessage([
        createThinkingBlock('First thought'),
        createThinkingBlock('Second thought'),
        createTextBlock('Response'),
      ]);
      expect(extractThinking(message)).toBe('First thought');
    });

    it('preserves whitespace and special characters in thinking', () => {
      const message = createMockMessage([createThinkingBlock('  Indented\nMultiline\tThinking  ')]);
      expect(extractThinking(message)).toBe('  Indented\nMultiline\tThinking  ');
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('returns null when no thinking blocks exist', () => {
      const message = createMockMessage([createTextBlock('Just text')]);
      expect(extractThinking(message)).toBeNull();
    });

    it('returns null for empty content array', () => {
      const message = createMockMessage([]);
      expect(extractThinking(message)).toBeNull();
    });

    it('returns empty string from empty thinking block', () => {
      const message = createMockMessage([createThinkingBlock('')]);
      expect(extractThinking(message)).toBe('');
    });
  });

  // -------------------------------------------------
  // Mixed Content Cases
  // -------------------------------------------------

  describe('mixed content', () => {
    it('finds thinking block among text and tool_use blocks', () => {
      const message = createMockMessage([
        createTextBlock('Response'),
        createToolUseBlock('search', { query: 'test' }),
        createThinkingBlock('Hidden thinking'),
      ]);
      expect(extractThinking(message)).toBe('Hidden thinking');
    });

    it('finds first thinking block in complex mixed content', () => {
      const message = createMockMessage([
        createTextBlock('Before'),
        createThinkingBlock('First thinking'),
        createToolUseBlock('tool', {}),
        createThinkingBlock('Second thinking'),
        createTextBlock('After'),
      ]);
      expect(extractThinking(message)).toBe('First thinking');
    });

    it('returns null when only text and tool_use blocks exist', () => {
      const message = createMockMessage([
        createTextBlock('Text'),
        createToolUseBlock('tool1', {}),
        createToolUseBlock('tool2', {}),
      ]);
      expect(extractThinking(message)).toBeNull();
    });
  });
});
