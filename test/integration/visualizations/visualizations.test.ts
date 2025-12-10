// test/integration/visualizations/visualizations.test.ts - Visualizations router integration tests
// Tests for visualizations.generate, visualizations.list, and visualizations.get
// Coverage target: 85%+ for visualizations.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, anthropicMock } from '../setup';

import { createMockReflections, createMockReflectionRow } from '@/test/fixtures/reflections';
import { freeTierUser, proTierUser, unlimitedTierUser, demoUser } from '@/test/fixtures/users';
import {
  createMockVisualization,
  createMockCrossDreamVisualization,
  createMockVisualizations,
  createVisualizationWithDream,
  createCrossDreamVisualizationWithRelation,
} from '@/test/fixtures/visualizations';

// Valid UUIDs for test data
const TEST_DREAM_ID = '12345678-1234-1234-1234-123456789012';
const TEST_VIZ_ID = 'abcdef12-3456-7890-abcd-ef1234567890';
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';
const OTHER_USER_VIZ_ID = '11111111-1111-1111-1111-111111111111';

// Set up environment variable
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
});

// =============================================================================
// Generate Tests (16 test cases)
// =============================================================================

describe('visualizations.generate', () => {
  describe('success cases', () => {
    it('TC-VG-01: should generate dream-specific visualization (achievement style)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      // Mock RPC for visualization limit check
      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mock table queries
      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(5, proTierUser.id),
          error: null,
        },
        visualizations: {
          data: createMockVisualization({ user_id: proTierUser.id, style: 'achievement' }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      const result = await caller.visualizations.generate({
        dreamId: TEST_DREAM_ID,
        style: 'achievement',
      });

      expect(result).toMatchObject({
        visualization: expect.objectContaining({
          id: expect.any(String),
          style: 'achievement',
          narrative: expect.any(String),
        }),
        message: 'Visualization generated successfully',
        cost: expect.any(Object),
      });
    });

    it('TC-VG-02: should generate dream-specific visualization (spiral style)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(5, proTierUser.id),
          error: null,
        },
        visualizations: {
          data: createMockVisualization({ user_id: proTierUser.id, style: 'spiral' }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      const result = await caller.visualizations.generate({
        dreamId: TEST_DREAM_ID,
        style: 'spiral',
      });

      expect(result.visualization.style).toBe('spiral');
      expect(result.message).toBe('Visualization generated successfully');
    });

    it('TC-VG-03: should generate dream-specific visualization (synthesis style)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(5, proTierUser.id),
          error: null,
        },
        visualizations: {
          data: createMockVisualization({ user_id: proTierUser.id, style: 'synthesis' }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      const result = await caller.visualizations.generate({
        dreamId: TEST_DREAM_ID,
        style: 'synthesis',
      });

      expect(result.visualization.style).toBe('synthesis');
      expect(result.message).toBe('Visualization generated successfully');
    });

    it('TC-VG-04: should generate cross-dream visualization (no dreamId, pro tier)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Create reflections with joined dream info for cross-dream query
      const crossDreamReflections = Array.from({ length: 15 }, (_, index) => ({
        ...createMockReflectionRow({
          id: `reflection-${index + 1}`,
          user_id: proTierUser.id,
          dream_id: `dream-${Math.floor(index / 5) + 1}`,
        }),
        dreams: {
          title: `Dream ${Math.floor(index / 5) + 1}`,
          category: 'personal',
        },
      }));

      mockQueries({
        reflections: {
          data: crossDreamReflections,
          error: null,
        },
        visualizations: {
          data: createMockCrossDreamVisualization({
            user_id: proTierUser.id,
            style: 'synthesis',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      const result = await caller.visualizations.generate({
        style: 'synthesis',
        // No dreamId = cross-dream
      });

      expect(result).toMatchObject({
        visualization: expect.objectContaining({
          dream_id: null,
        }),
        message: 'Visualization generated successfully',
      });
    });

    it('TC-VG-05: should use extended thinking for unlimited tier', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(unlimitedTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mock extended thinking response
      anthropicMock.messages.create.mockResolvedValue({
        id: 'msg_viz_thinking_12345',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'thinking',
            thinking:
              'Let me analyze the progression of reflections to craft a meaningful visualization narrative...',
          },
          {
            type: 'text',
            text: 'Your journey unfolds like a magnificent tapestry woven from countless threads of aspiration...',
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 500,
          output_tokens: 800,
          thinking_tokens: 2000,
        },
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Master Piano', user_id: unlimitedTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(6, unlimitedTierUser.id),
          error: null,
        },
        visualizations: {
          data: createMockVisualization({
            user_id: unlimitedTierUser.id,
            narrative:
              'Your journey unfolds like a magnificent tapestry woven from countless threads of aspiration...',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      const result = await caller.visualizations.generate({
        dreamId: TEST_DREAM_ID,
        style: 'achievement',
      });

      expect(result.visualization).toBeDefined();
      expect(result.visualization.narrative).toContain('tapestry');
      // Verify the API was called (extended thinking enables thinking budget)
      expect(anthropicMock.messages.create).toHaveBeenCalled();
    });

    it('TC-VG-06: should apply temporal distribution to reflections', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Create many reflections to trigger temporal distribution
      const manyReflections = createMockReflections(20, proTierUser.id);

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Long Journey', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: manyReflections,
          error: null,
        },
        visualizations: {
          data: createMockVisualization({
            user_id: proTierUser.id,
            reflection_count: 10, // Context limit applied
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      const result = await caller.visualizations.generate({
        dreamId: TEST_DREAM_ID,
        style: 'spiral',
      });

      expect(result).toMatchObject({
        visualization: expect.objectContaining({
          reflection_count: expect.any(Number),
        }),
        message: 'Visualization generated successfully',
      });
    });
  });

  describe('authorization', () => {
    it('TC-VG-07: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.visualizations.generate({
          dreamId: TEST_DREAM_ID,
          style: 'achievement',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('TC-VG-08: should reject cross-dream visualization for free tier', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.visualizations.generate({
          style: 'synthesis',
          // No dreamId = cross-dream, blocked for free tier
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('Pro'),
      });
    });

    it('TC-VG-09: should reject when below dream-specific threshold (< 4 reflections)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'New Dream', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(3, proTierUser.id), // Only 3, need 4
          error: null,
        },
      });

      await expect(
        caller.visualizations.generate({
          dreamId: TEST_DREAM_ID,
          style: 'achievement',
        })
      ).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: expect.stringContaining('4 reflections'),
      });
    });

    it('TC-VG-10: should reject when below cross-dream threshold (< 12 reflections)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      // Create reflections with joined dream info (only 8)
      const fewReflections = Array.from({ length: 8 }, (_, index) => ({
        ...createMockReflectionRow({
          id: `reflection-${index + 1}`,
          user_id: proTierUser.id,
        }),
        dreams: { title: 'Dream 1', category: 'personal' },
      }));

      mockQueries({
        reflections: {
          data: fewReflections,
          error: null,
        },
      });

      await expect(
        caller.visualizations.generate({
          style: 'synthesis',
          // No dreamId = cross-dream
        })
      ).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: expect.stringContaining('12 total reflections'),
      });
    });

    it('TC-VG-11: should reject when at monthly limit', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      // Mock RPC to return false (at limit)
      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: false, error: null }); // At limit
        }
        return Promise.resolve({ data: null, error: null });
      });

      await expect(
        caller.visualizations.generate({
          dreamId: TEST_DREAM_ID,
          style: 'achievement',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('limit reached'),
      });
    });
  });

  describe('error handling', () => {
    it('TC-VG-12: should handle Anthropic API error', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test Dream', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(5, proTierUser.id),
          error: null,
        },
      });

      // Mock API error
      anthropicMock.messages.create.mockRejectedValue(new Error('Anthropic API error'));

      await expect(
        caller.visualizations.generate({
          dreamId: TEST_DREAM_ID,
          style: 'achievement',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to generate'),
      });
    });

    it('TC-VG-13: should handle empty narrative response', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test Dream', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(5, proTierUser.id),
          error: null,
        },
      });

      // Mock response with only thinking block, no text
      anthropicMock.messages.create.mockResolvedValue({
        id: 'msg_empty_12345',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'thinking', thinking: 'Only thinking, no narrative' }],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 10 },
      });

      await expect(
        caller.visualizations.generate({
          dreamId: TEST_DREAM_ID,
          style: 'achievement',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to generate visualization narrative'),
      });
    });

    it('TC-VG-14: should reject invalid style enum', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.visualizations.generate({
          dreamId: TEST_DREAM_ID,
          style: 'invalid' as any,
        })
      ).rejects.toThrow(); // Zod validation error
    });
  });

  describe('edge cases', () => {
    it('TC-VG-15: should handle dream not found', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: null,
          error: { code: 'PGRST116', message: 'Not found' } as any,
        },
      });

      await expect(
        caller.visualizations.generate({
          dreamId: NON_EXISTENT_ID,
          style: 'achievement',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    });

    it('TC-VG-16: should retry and succeed on transient 529 error', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Retry Dream', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(5, proTierUser.id),
          error: null,
        },
        visualizations: {
          data: createMockVisualization({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      // First call fails with 529 (overloaded), second succeeds
      const overloadedError = new Error('Overloaded');
      (overloadedError as any).status = 529;

      anthropicMock.messages.create.mockRejectedValueOnce(overloadedError).mockResolvedValueOnce({
        id: 'msg_retry_success',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Success after retry - your journey continues...',
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const result = await caller.visualizations.generate({
        dreamId: TEST_DREAM_ID,
        style: 'achievement',
      });

      expect(result.visualization).toBeDefined();
      expect(result.message).toBe('Visualization generated successfully');
    });
  });
});

// =============================================================================
// List Tests (5 test cases)
// =============================================================================

describe('visualizations.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-VL-01: should list with pagination (hasMore field)', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const visualizations = createMockVisualizations(5, proTierUser.id).map((v) => ({
        ...v,
        dreams: { title: 'Dream Title' },
      }));

      mockQueries({
        visualizations: {
          data: visualizations.slice(0, 2), // First page of 2
          error: null,
          count: 5,
        },
      });

      const result = await caller.visualizations.list({ page: 1, limit: 2 });

      expect(result).toMatchObject({
        items: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasMore: true,
      });
      expect(result.items).toHaveLength(2);
    });

    it('TC-VL-02: should filter by dreamId', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const visualization = createVisualizationWithDream({
        user_id: proTierUser.id,
        dream_id: TEST_DREAM_ID,
      });

      mockQueries({
        visualizations: {
          data: [visualization],
          error: null,
          count: 1,
        },
      });

      const result = await caller.visualizations.list({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].dream_id).toBe(TEST_DREAM_ID);
    });

    it('TC-VL-03: should include dream title in response', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const visualization = createVisualizationWithDream({
        user_id: proTierUser.id,
        dreams: { title: 'Guitar Mastery' },
      });

      mockQueries({
        visualizations: {
          data: [visualization],
          error: null,
          count: 1,
        },
      });

      const result = await caller.visualizations.list({});

      expect(result.items[0].dreams).toEqual({ title: 'Guitar Mastery' });
    });

    it('TC-VL-04: should handle empty list', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        visualizations: {
          data: [],
          error: null,
          count: 0,
        },
      });

      const result = await caller.visualizations.list({});

      expect(result).toMatchObject({
        items: [],
        page: 1,
        total: 0,
        totalPages: 0,
        hasMore: false,
      });
    });
  });

  describe('error handling', () => {
    it('TC-VL-05: should handle database error', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        visualizations: {
          data: null,
          error: new Error('Database connection failed'),
        },
      });

      await expect(caller.visualizations.list({})).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch visualizations',
      });
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.visualizations.list({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

// =============================================================================
// Get Tests (4 test cases)
// =============================================================================

describe('visualizations.get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-VGet-01: should get existing visualization with dream info', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const visualization = createVisualizationWithDream({
        id: TEST_VIZ_ID,
        user_id: proTierUser.id,
        dream_id: TEST_DREAM_ID,
        style: 'spiral',
        dreams: { title: 'Piano Journey', category: 'creative' },
      });

      mockQueries({
        visualizations: {
          data: visualization,
          error: null,
        },
      });

      const result = await caller.visualizations.get({ id: TEST_VIZ_ID });

      expect(result).toMatchObject({
        id: TEST_VIZ_ID,
        style: 'spiral',
        dream_id: TEST_DREAM_ID,
        dreams: { title: 'Piano Journey', category: 'creative' },
      });
    });

    it('TC-VGet-02: should get cross-dream visualization (null dream_id)', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const visualization = createCrossDreamVisualizationWithRelation({
        id: TEST_VIZ_ID,
        user_id: proTierUser.id,
        style: 'synthesis',
      });

      mockQueries({
        visualizations: {
          data: visualization,
          error: null,
        },
      });

      const result = await caller.visualizations.get({ id: TEST_VIZ_ID });

      expect(result).toMatchObject({
        id: TEST_VIZ_ID,
        dream_id: null,
        style: 'synthesis',
        dreams: null,
      });
    });
  });

  describe('authorization', () => {
    it('TC-VGet-03: should reject other user visualization', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Query filters by user_id, so another user's visualization returns null
      mockQueries({
        visualizations: {
          data: null,
          error: { code: 'PGRST116' } as any,
        },
      });

      await expect(caller.visualizations.get({ id: OTHER_USER_VIZ_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Visualization not found',
      });
    });
  });

  describe('error handling', () => {
    it('TC-VGet-04: should reject non-existent ID', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        visualizations: {
          data: null,
          error: { code: 'PGRST116' } as any,
        },
      });

      await expect(caller.visualizations.get({ id: NON_EXISTENT_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Visualization not found',
      });
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.visualizations.get({ id: TEST_VIZ_ID })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('input validation', () => {
    it('should reject invalid UUID format', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(caller.visualizations.get({ id: 'not-a-valid-uuid' })).rejects.toThrow();
    });
  });
});

// =============================================================================
// Additional Tests for Edge Cases and Coverage
// =============================================================================

describe('visualizations - additional coverage', () => {
  describe('generate - database errors', () => {
    it('should handle reflections fetch error (dream-specific)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test Dream', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: null,
          error: new Error('Failed to fetch'),
        },
      });

      await expect(
        caller.visualizations.generate({
          dreamId: TEST_DREAM_ID,
          style: 'achievement',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch reflections',
      });
    });

    it('should handle reflections fetch error (cross-dream)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        reflections: {
          data: null,
          error: new Error('Failed to fetch'),
        },
      });

      await expect(
        caller.visualizations.generate({
          style: 'synthesis',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch reflections',
      });
    });

    it('should handle visualization save error', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test Dream', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(5, proTierUser.id),
          error: null,
        },
        visualizations: {
          data: null,
          error: new Error('Insert failed'),
        },
      });

      await expect(
        caller.visualizations.generate({
          dreamId: TEST_DREAM_ID,
          style: 'achievement',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save visualization',
      });
    });
  });

  describe('generate - unlimited tier cross-dream', () => {
    it('should allow cross-dream for unlimited tier', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(unlimitedTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_visualization_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Create reflections with joined dream info for cross-dream query
      const crossDreamReflections = Array.from({ length: 15 }, (_, index) => ({
        ...createMockReflectionRow({
          id: `reflection-${index + 1}`,
          user_id: unlimitedTierUser.id,
          dream_id: `dream-${Math.floor(index / 5) + 1}`,
        }),
        dreams: {
          title: `Dream ${Math.floor(index / 5) + 1}`,
          category: 'personal',
        },
      }));

      mockQueries({
        reflections: {
          data: crossDreamReflections,
          error: null,
        },
        visualizations: {
          data: createMockCrossDreamVisualization({ user_id: unlimitedTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      const result = await caller.visualizations.generate({
        style: 'synthesis',
      });

      expect(result.visualization.dream_id).toBeNull();
      expect(result.message).toBe('Visualization generated successfully');
    });
  });

  describe('list - pagination edge cases', () => {
    it('should return last page with hasMore false', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const visualizations = createMockVisualizations(2, proTierUser.id).map((v) => ({
        ...v,
        dreams: { title: 'Dream' },
      }));

      mockQueries({
        visualizations: {
          data: visualizations,
          error: null,
          count: 4, // Total 4, page 2 of limit 2 = last page
        },
      });

      const result = await caller.visualizations.list({ page: 2, limit: 2 });

      expect(result.hasMore).toBe(false);
      expect(result.totalPages).toBe(2);
    });
  });
});
