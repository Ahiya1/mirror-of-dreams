// lib/clarify/__tests__/consolidation.test.ts
// Tests for pattern extraction and consolidation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock functions to track calls
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

// Mock dependencies first before importing the module
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '[]' }],
      }),
    },
  })),
}));

vi.mock('@/lib/utils/retry', () => ({
  withAIRetry: vi.fn((fn) => fn()),
}));

vi.mock('@/server/lib/logger', () => ({
  aiLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  dbLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/server/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table);
      return {
        select: (cols: string) => {
          mockSelect(cols);
          return {
            eq: (col: string, val: string) => {
              mockEq(col, val);
              // Return empty sessions
              return Promise.resolve({ data: [], error: null });
            },
            in: () => Promise.resolve({ data: [], error: null }),
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        },
        update: (data: any) => {
          mockUpdate(data);
          return {
            in: (col: string, vals: string[]) => {
              mockIn(col, vals);
              return Promise.resolve({ error: null });
            },
          };
        },
        insert: () => Promise.resolve({ error: null }),
      };
    },
  },
}));

vi.mock('@/lib/utils/constants', () => ({
  PATTERN_CONSOLIDATION: {
    minMessagesForConsolidation: 3,
    maxMessagesPerBatch: 50,
  },
}));

// Store original env
const originalEnv = process.env;

describe('Consolidation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // =====================================================
  // extractPatternsFromSession TESTS
  // =====================================================

  describe('extractPatternsFromSession', () => {
    it('should return empty array when fewer than minimum messages', async () => {
      const { extractPatternsFromSession } = await import('../consolidation');

      const messages = [
        { id: '1', content: 'message 1', role: 'user' },
        { id: '2', content: 'message 2', role: 'user' },
      ];

      const result = await extractPatternsFromSession('session-123', messages);

      expect(result).toEqual([]);
    });

    it('should return empty array when only assistant messages present', async () => {
      const { extractPatternsFromSession } = await import('../consolidation');

      const messages = [
        { id: '1', content: 'assistant message 1', role: 'assistant' },
        { id: '2', content: 'assistant message 2', role: 'assistant' },
        { id: '3', content: 'assistant message 3', role: 'assistant' },
      ];

      const result = await extractPatternsFromSession('session-123', messages);

      expect(result).toEqual([]);
    });

    it('should handle mixed role messages by filtering to user only', async () => {
      const { extractPatternsFromSession } = await import('../consolidation');

      // Only 2 user messages, below threshold
      const messages = [
        { id: '1', content: 'user message 1', role: 'user' },
        { id: '2', content: 'assistant response', role: 'assistant' },
        { id: '3', content: 'user message 2', role: 'user' },
        { id: '4', content: 'assistant response 2', role: 'assistant' },
      ];

      const result = await extractPatternsFromSession('session-123', messages);

      expect(result).toEqual([]);
    });

    it('should return empty array when no messages provided', async () => {
      const { extractPatternsFromSession } = await import('../consolidation');

      const result = await extractPatternsFromSession('session-123', []);

      expect(result).toEqual([]);
    });
  });

  // =====================================================
  // consolidateUserPatterns TESTS
  // =====================================================

  describe('consolidateUserPatterns', () => {
    it('should return success with 0 patterns when no sessions', async () => {
      const { consolidateUserPatterns } = await import('../consolidation');
      const result = await consolidateUserPatterns('user-123');

      expect(result.success).toBe(true);
      expect(result.patternsExtracted).toBe(0);
      expect(result.messagesProcessed).toBe(0);
    });

    it('should include userId in result', async () => {
      const { consolidateUserPatterns } = await import('../consolidation');
      const result = await consolidateUserPatterns('test-user-id');

      expect(result.userId).toBe('test-user-id');
    });

    it('should query the correct table', async () => {
      const { consolidateUserPatterns } = await import('../consolidation');
      await consolidateUserPatterns('user-xyz');

      expect(mockFrom).toHaveBeenCalledWith('clarify_sessions');
    });
  });

  // =====================================================
  // markMessagesConsolidated TESTS
  // =====================================================

  describe('markMessagesConsolidated', () => {
    it('should return true for empty array', async () => {
      const { markMessagesConsolidated } = await import('../consolidation');
      const result = await markMessagesConsolidated([]);

      expect(result).toBe(true);
    });

    it('should handle array with message IDs', async () => {
      const { markMessagesConsolidated } = await import('../consolidation');
      const result = await markMessagesConsolidated(['msg-1', 'msg-2']);

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('clarify_messages');
      expect(mockUpdate).toHaveBeenCalledWith({ consolidated: true });
      expect(mockIn).toHaveBeenCalledWith('id', ['msg-1', 'msg-2']);
    });
  });
});
