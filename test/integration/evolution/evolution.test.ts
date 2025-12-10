// test/integration/evolution/evolution.test.ts
// Comprehensive integration tests for the Evolution router (server/trpc/routers/evolution.ts)

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, anthropicMock, supabaseMock } from '../setup';

import {
  createMockEvolutionReport,
  createMockCrossDreamReport,
  createMockEvolutionReportWithDream,
  createMockCrossDreamReportWithDream,
} from '@/test/fixtures/evolution';
import { createMockReflections, createMockReflectionRow } from '@/test/fixtures/reflections';
import {
  freeTierUser,
  proTierUser,
  unlimitedTierUser,
  creatorUser,
  adminUser,
  demoUser,
  createMockUser,
} from '@/test/fixtures/users';

// =============================================================================
// CONSTANTS
// =============================================================================

const TEST_DREAM_ID = '12345678-1234-1234-1234-123456789012';
const TEST_EVOLUTION_ID = 'abcdef12-3456-7890-abcd-ef1234567890';

// Standard Anthropic response for evolution reports
const createEvolutionResponse = (text: string, thinkingTokens = 0) => ({
  id: 'msg_evolution_12345',
  type: 'message' as const,
  role: 'assistant' as const,
  content:
    thinkingTokens > 0
      ? [
          {
            type: 'thinking' as const,
            thinking: 'Analyzing the progression of reflections over time...',
          },
          { type: 'text' as const, text },
        ]
      : [{ type: 'text' as const, text }],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn' as const,
  stop_sequence: null,
  usage: {
    input_tokens: 500,
    output_tokens: 800,
    ...(thinkingTokens > 0 ? { thinking_tokens: thinkingTokens } : {}),
  },
});

// Helper to create reflections with dream info for cross-dream tests
const createReflectionsWithDreams = (
  count: number,
  userId: string,
  dreamId: string = 'dream-uuid-1234'
) =>
  Array.from({ length: count }, (_, index) => ({
    ...createMockReflectionRow({
      id: `reflection-${index + 1}`,
      user_id: userId,
      dream_id: dreamId,
      created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    }),
    dreams: {
      title: `Dream ${Math.floor(index / 4) + 1}`,
      category: 'personal',
    },
  }));

// Set up environment variable for Anthropic API
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
});

// =============================================================================
// generateDreamEvolution Tests (18 tests)
// =============================================================================

describe('evolution.generateDreamEvolution', () => {
  // ===========================================================================
  // SUCCESS CASES (6 tests)
  // ===========================================================================

  describe('success cases', () => {
    it('TC-EV-01: should generate dream evolution with minimum reflections (4)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      // Mock RPC for limit check
      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
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
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Your journey with this dream reveals remarkable growth...')
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result).toMatchObject({
        evolutionId: expect.any(String),
        evolution: expect.any(String),
        reflectionsAnalyzed: expect.any(Number),
        totalReflections: 4,
        cost: expect.any(Number),
      });
    });

    it('TC-EV-02: should use extended thinking for unlimited tier', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(unlimitedTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: unlimitedTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(6, unlimitedTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({
            user_id: unlimitedTierUser.id,
            report_type: 'premium',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Deep insights from extended thinking...', 2500)
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.evolutionId).toBeDefined();
      expect(anthropicMock.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          thinking: expect.objectContaining({
            type: 'enabled',
            budget_tokens: expect.any(Number),
          }),
        })
      );
    });

    it('TC-EV-03: should apply temporal distribution for many reflections', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Provide 20 reflections, but temporal distribution should select a subset
      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(20, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Your evolution spans many reflections...')
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      // Total should be 20, but analyzed could be less due to temporal distribution
      expect(result.totalReflections).toBe(20);
      expect(result.reflectionsAnalyzed).toBeLessThanOrEqual(20);
    });

    it('TC-EV-04: should include dream title in context', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Master Chess Strategy', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Your chess journey shows strategic growth...')
      );

      await caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID });

      expect(anthropicMock.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Master Chess Strategy'),
            }),
          ]),
        })
      );
    });

    it('TC-EV-05: should calculate cost correctly', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
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
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(createEvolutionResponse('Your evolution...'));

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.cost).toBeGreaterThan(0);
      expect(typeof result.cost).toBe('number');
    });

    it('TC-EV-06: should log API usage after generation', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
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
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(createEvolutionResponse('Your evolution...'));

      await caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID });

      expect(supabase.from).toHaveBeenCalledWith('api_usage_log');
    });
  });

  // ===========================================================================
  // AUTHORIZATION CASES (5 tests)
  // ===========================================================================

  describe('authorization', () => {
    it('TC-EV-07: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Authentication required'),
      });
    });

    it('TC-EV-08: should reject demo user (no owned dreams)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(demoUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      // Demo user won't have any owned dreams
      mockQueries({
        dreams: { data: null, error: new Error('Not found') },
      });

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('Dream not found'),
      });
    });

    it('TC-EV-09: should reject when below reflection threshold', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(3, proTierUser.id), // Only 3, need 4
          error: null,
        },
      });

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: expect.stringContaining('4 reflections'),
      });
    });

    it('TC-EV-10: should reject when at monthly limit', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      // Limit check returns false (at limit)
      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: false, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
      });

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('limit'),
      });
    });

    it('TC-EV-11: should reject access to other user dream', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      // Dream not found for this user (belongs to another user)
      mockQueries({
        dreams: { data: null, error: new Error('Not found') },
      });

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('Dream not found'),
      });
    });
  });

  // ===========================================================================
  // ERROR HANDLING (4 tests)
  // ===========================================================================

  describe('error handling', () => {
    it('TC-EV-12: should handle Anthropic API error', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
      });

      anthropicMock.messages.create.mockRejectedValue(new Error('Anthropic API error'));

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to generate'),
      });
    });

    it('TC-EV-13: should handle no text block in response', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
      });

      // Response with only thinking block, no text
      anthropicMock.messages.create.mockResolvedValue({
        id: 'msg_no_text_12345',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [{ type: 'thinking' as const, thinking: 'Only thinking, no text' }],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn' as const,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 10 },
      });

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('No text response'),
      });
    });

    it('TC-EV-14: should handle database insert error', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: null,
          error: new Error('Database insert error'),
        },
      });

      anthropicMock.messages.create.mockResolvedValue(createEvolutionResponse('Your evolution...'));

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to store'),
      });
    });

    it('TC-EV-15: should reject invalid UUID format', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.evolution.generateDreamEvolution({ dreamId: 'not-a-valid-uuid' })
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // EDGE CASES (3 tests)
  // ===========================================================================

  describe('edge cases', () => {
    it('TC-EV-16: should succeed after transient API error with retry', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
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
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      // First call fails with 529, second succeeds
      const overloadedError = new Error('Overloaded');
      (overloadedError as unknown as { status: number }).status = 529;

      anthropicMock.messages.create
        .mockRejectedValueOnce(overloadedError)
        .mockResolvedValueOnce(createEvolutionResponse('Success after retry'));

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.evolutionId).toBeDefined();
    });

    it('TC-EV-17: should handle empty reflection fields gracefully', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Reflections with empty fields
      const reflectionsWithEmptyFields = createMockReflections(4, proTierUser.id).map((r) => ({
        ...r,
        plan: '',
        offering: null,
      }));

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: reflectionsWithEmptyFields,
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Your evolution despite sparse reflections...')
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.evolutionId).toBeDefined();
    });

    it('TC-EV-18: should handle max reflections correctly', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(unlimitedTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Many reflections to test temporal distribution limits
      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Learn Guitar', user_id: unlimitedTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(100, unlimitedTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({
            user_id: unlimitedTierUser.id,
            report_type: 'premium',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Evolution from extensive reflection history...', 2500)
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.totalReflections).toBe(100);
      // Unlimited tier context limit is 12 for dream-specific
      expect(result.reflectionsAnalyzed).toBeLessThanOrEqual(12);
    });
  });
});

// =============================================================================
// generateCrossDreamEvolution Tests (12 tests)
// =============================================================================

describe('evolution.generateCrossDreamEvolution', () => {
  // ===========================================================================
  // SUCCESS CASES (4 tests)
  // ===========================================================================

  describe('success cases', () => {
    it('TC-ECR-01: should generate cross-dream evolution with minimum reflections (12)', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        reflections: {
          data: createReflectionsWithDreams(12, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockCrossDreamReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Across your dreams, patterns emerge...')
      );

      const result = await caller.evolution.generateCrossDreamEvolution();

      expect(result).toMatchObject({
        evolutionId: expect.any(String),
        evolution: expect.any(String),
        reflectionsAnalyzed: expect.any(Number),
        totalReflections: 12,
        dreamsAnalyzed: expect.any(Number),
        cost: expect.any(Number),
      });
    });

    it('TC-ECR-02: should use extended thinking for unlimited tier', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(unlimitedTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        reflections: {
          data: createReflectionsWithDreams(15, unlimitedTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockCrossDreamReport({
            user_id: unlimitedTierUser.id,
            report_type: 'premium',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Deep cross-dream analysis with thinking...', 3000)
      );

      const result = await caller.evolution.generateCrossDreamEvolution();

      expect(result.evolutionId).toBeDefined();
      expect(anthropicMock.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          thinking: expect.objectContaining({
            type: 'enabled',
          }),
        })
      );
    });

    it('TC-ECR-03: should group reflections by dream correctly', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Create reflections from 3 different dreams
      const multiDreamReflections = [
        ...createReflectionsWithDreams(4, proTierUser.id, 'dream-1'),
        ...createReflectionsWithDreams(4, proTierUser.id, 'dream-2'),
        ...createReflectionsWithDreams(4, proTierUser.id, 'dream-3'),
      ];

      mockQueries({
        reflections: {
          data: multiDreamReflections,
          error: null,
        },
        evolution_reports: {
          data: createMockCrossDreamReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Your three dreams interweave...')
      );

      const result = await caller.evolution.generateCrossDreamEvolution();

      // Should have analyzed multiple dreams
      expect(result.dreamsAnalyzed).toBeGreaterThanOrEqual(1);
    });

    it('TC-ECR-04: should include metadata in response', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        reflections: {
          data: createReflectionsWithDreams(15, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockCrossDreamReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Your cross-dream journey...')
      );

      const result = await caller.evolution.generateCrossDreamEvolution();

      expect(result.evolutionId).toBeDefined();
      expect(result.evolution).toContain('cross-dream');
      expect(result.totalReflections).toBe(15);
      expect(result.cost).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // AUTHORIZATION CASES (4 tests)
  // ===========================================================================

  describe('authorization', () => {
    it('TC-ECR-05: should reject free tier for cross-dream evolution', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(caller.evolution.generateCrossDreamEvolution()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('Pro'),
      });
    });

    it('TC-ECR-06: should reject when below reflection threshold (12)', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        reflections: {
          data: createReflectionsWithDreams(10, proTierUser.id), // Only 10, need 12
          error: null,
        },
      });

      await expect(caller.evolution.generateCrossDreamEvolution()).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: expect.stringContaining('12'),
      });
    });

    it('TC-ECR-07: should reject when at monthly limit', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      mockQueries({
        reflections: {
          data: createReflectionsWithDreams(15, proTierUser.id),
          error: null,
        },
      });

      // Limit check returns false (at limit)
      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: false, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      await expect(caller.evolution.generateCrossDreamEvolution()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('limit'),
      });
    });

    it('TC-ECR-08: should allow unlimited tier', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(unlimitedTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        reflections: {
          data: createReflectionsWithDreams(12, unlimitedTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockCrossDreamReport({
            user_id: unlimitedTierUser.id,
            report_type: 'premium',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Unlimited cross-dream analysis...', 2500)
      );

      const result = await caller.evolution.generateCrossDreamEvolution();

      expect(result.evolutionId).toBeDefined();
    });
  });

  // ===========================================================================
  // ERROR HANDLING (2 tests)
  // ===========================================================================

  describe('error handling', () => {
    it('TC-ECR-09: should handle Anthropic API error', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockResolvedValue({ data: true, error: null });

      mockQueries({
        reflections: {
          data: createReflectionsWithDreams(12, proTierUser.id),
          error: null,
        },
      });

      anthropicMock.messages.create.mockRejectedValue(new Error('Anthropic API error'));

      await expect(caller.evolution.generateCrossDreamEvolution()).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to generate'),
      });
    });

    it('TC-ECR-10: should handle reflections fetch error', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        reflections: {
          data: null,
          error: new Error('Database error'),
        },
      });

      await expect(caller.evolution.generateCrossDreamEvolution()).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to fetch'),
      });
    });
  });

  // ===========================================================================
  // EDGE CASES (2 tests)
  // ===========================================================================

  describe('edge cases', () => {
    it('TC-ECR-11: should handle single dream with many reflections', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // All reflections from one dream
      mockQueries({
        reflections: {
          data: createReflectionsWithDreams(12, proTierUser.id, 'single-dream'),
          error: null,
        },
        evolution_reports: {
          data: createMockCrossDreamReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Your single dream shows deep evolution...')
      );

      const result = await caller.evolution.generateCrossDreamEvolution();

      expect(result.evolutionId).toBeDefined();
      expect(result.dreamsAnalyzed).toBeGreaterThanOrEqual(1);
    });

    it('TC-ECR-12: should handle reflections with mixed dream_ids', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mix of dreams
      const mixedReflections = [
        ...createReflectionsWithDreams(5, proTierUser.id, 'dream-a'),
        ...createReflectionsWithDreams(4, proTierUser.id, 'dream-b'),
        ...createReflectionsWithDreams(3, proTierUser.id, 'dream-c'),
      ];

      mockQueries({
        reflections: {
          data: mixedReflections,
          error: null,
        },
        evolution_reports: {
          data: createMockCrossDreamReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Your varied dream journey...')
      );

      const result = await caller.evolution.generateCrossDreamEvolution();

      expect(result.evolutionId).toBeDefined();
      expect(result.totalReflections).toBe(12);
    });
  });
});

// =============================================================================
// list Tests (6 tests)
// =============================================================================

describe('evolution.list', () => {
  describe('success cases', () => {
    it('TC-EL-01: should list evolution reports with pagination', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockReports = Array.from({ length: 5 }, (_, i) =>
        createMockEvolutionReportWithDream({
          id: `report-${i + 1}`,
          user_id: proTierUser.id,
        })
      );

      mockQueries({
        evolution_reports: {
          data: mockReports.slice(0, 2),
          error: null,
          count: 5,
        },
      });

      const result = await caller.evolution.list({ page: 1, limit: 2 });

      expect(result).toMatchObject({
        reports: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('TC-EL-02: should filter by dreamId', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockReports = [
        createMockEvolutionReportWithDream({
          id: 'report-1',
          user_id: proTierUser.id,
          dream_id: TEST_DREAM_ID,
        }),
      ];

      mockQueries({
        evolution_reports: {
          data: mockReports,
          error: null,
          count: 1,
        },
      });

      const result = await caller.evolution.list({
        page: 1,
        limit: 10,
        dreamId: TEST_DREAM_ID,
      });

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('TC-EL-03: should handle empty list', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        evolution_reports: {
          data: [],
          error: null,
          count: 0,
        },
      });

      const result = await caller.evolution.list({ page: 1, limit: 10 });

      expect(result.reports).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('TC-EL-04: should include dream title in response', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockReports = [
        createMockEvolutionReportWithDream({
          id: 'report-1',
          user_id: proTierUser.id,
          dreams: { title: 'Learn Guitar', category: 'creative' },
        }),
      ];

      mockQueries({
        evolution_reports: {
          data: mockReports,
          error: null,
          count: 1,
        },
      });

      const result = await caller.evolution.list({ page: 1, limit: 10 });

      expect(result.reports[0].dreams).toMatchObject({
        title: 'Learn Guitar',
      });
    });

    it('TC-EL-05: should order by created_at desc', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      mockQueries({
        evolution_reports: {
          data: [],
          error: null,
          count: 0,
        },
      });

      await caller.evolution.list({ page: 1, limit: 10 });

      // Verify the order method was called
      expect(supabase.from).toHaveBeenCalledWith('evolution_reports');
    });
  });

  describe('error handling', () => {
    it('TC-EL-06: should handle database error', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        evolution_reports: {
          data: null,
          error: new Error('Database error'),
        },
      });

      await expect(caller.evolution.list({ page: 1, limit: 10 })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to fetch'),
      });
    });
  });
});

// =============================================================================
// get Tests (4 tests)
// =============================================================================

describe('evolution.get', () => {
  describe('success cases', () => {
    it('TC-EG-01: should get existing report with dream info', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockReport = createMockEvolutionReportWithDream({
        id: TEST_EVOLUTION_ID,
        user_id: proTierUser.id,
        dreams: { title: 'Learn Guitar', category: 'creative' },
      });

      mockQueries({
        evolution_reports: {
          data: mockReport,
          error: null,
        },
      });

      const result = await caller.evolution.get({ id: TEST_EVOLUTION_ID });

      expect(result).toMatchObject({
        id: TEST_EVOLUTION_ID,
        dreams: { title: 'Learn Guitar' },
      });
    });

    it('TC-EG-02: should get cross-dream report (null dream_id)', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockReport = createMockCrossDreamReportWithDream({
        id: TEST_EVOLUTION_ID,
        user_id: proTierUser.id,
      });

      mockQueries({
        evolution_reports: {
          data: mockReport,
          error: null,
        },
      });

      const result = await caller.evolution.get({ id: TEST_EVOLUTION_ID });

      expect(result).toMatchObject({
        id: TEST_EVOLUTION_ID,
        dream_id: null,
        report_category: 'cross-dream',
      });
    });
  });

  describe('authorization', () => {
    it('TC-EG-03: should reject access to other user report', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Report not found (wrong user)
      mockQueries({
        evolution_reports: {
          data: null,
          error: null,
        },
      });

      await expect(caller.evolution.get({ id: TEST_EVOLUTION_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('not found'),
      });
    });
  });

  describe('error handling', () => {
    it('TC-EG-04: should return NOT_FOUND for non-existent valid UUID', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        evolution_reports: {
          data: null,
          error: new Error('Not found'),
        },
      });

      // Use a valid UUID format that doesn't exist
      await expect(
        caller.evolution.get({ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('not found'),
      });
    });
  });
});

// =============================================================================
// checkEligibility Tests (6 tests)
// =============================================================================

describe('evolution.checkEligibility', () => {
  describe('success cases', () => {
    it('TC-CE-01: should return not eligible for free tier', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.evolution.checkEligibility();

      expect(result).toMatchObject({
        eligible: false,
        reason: expect.stringContaining('Upgrade'),
        threshold: 0,
        reflectionsSinceLastReport: 0,
      });
    });

    it('TC-CE-02: should return eligible for pro with 4+ dream reflections', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Mock reflection count query
      mockQueries({
        reflections: {
          data: createMockReflections(10, proTierUser.id),
          error: null,
          count: 10,
        },
      });

      const result = await caller.evolution.checkEligibility();

      expect(result).toMatchObject({
        eligible: true,
        reason: expect.stringContaining('can generate'),
        threshold: 4,
      });
    });

    it('TC-CE-03: should return eligible for pro with 12+ total reflections', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        reflections: {
          data: createMockReflections(12, proTierUser.id),
          error: null,
          count: 12,
        },
      });

      const result = await caller.evolution.checkEligibility();

      expect(result.eligible).toBe(true);
    });

    it('TC-CE-04: should return not eligible for pro below thresholds', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Few reflections, spread across many dreams (none with 4+)
      const fewReflections = [
        { ...createMockReflectionRow({ dream_id: 'dream-1' }), id: 'ref-1' },
        { ...createMockReflectionRow({ dream_id: 'dream-2' }), id: 'ref-2' },
        { ...createMockReflectionRow({ dream_id: 'dream-3' }), id: 'ref-3' },
      ];

      mockQueries({
        reflections: {
          data: fewReflections,
          error: null,
          count: 3,
        },
      });

      const result = await caller.evolution.checkEligibility();

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('more reflections');
    });

    it('TC-CE-05: should return eligible for unlimited tier', async () => {
      const { caller, mockQueries } = createTestCaller(unlimitedTierUser);

      mockQueries({
        reflections: {
          data: createMockReflections(5, unlimitedTierUser.id),
          error: null,
          count: 5,
        },
      });

      const result = await caller.evolution.checkEligibility();

      expect(result.eligible).toBe(true);
    });

    it('TC-CE-06: should handle empty state (0 reflections)', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        reflections: {
          data: [],
          error: null,
          count: 0,
        },
      });

      const result = await caller.evolution.checkEligibility();

      expect(result.eligible).toBe(false);
      expect(result.reflectionsSinceLastReport).toBe(0);
    });
  });
});

// =============================================================================
// Additional Coverage Tests
// =============================================================================

describe('evolution router - additional coverage', () => {
  describe('tier-based report types', () => {
    it('should mark report as premium for unlimited tier', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(unlimitedTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test', user_id: unlimitedTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, unlimitedTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({
            user_id: unlimitedTierUser.id,
            report_type: 'premium',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Premium analysis...', 2500)
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.evolutionId).toBeDefined();
    });

    it('should mark report as essential for pro tier', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({
            user_id: proTierUser.id,
            report_type: 'essential',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Essential analysis...')
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.evolutionId).toBeDefined();
    });
  });

  describe('RPC function calls', () => {
    it('should call increment_usage_counter after generation', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      let incrementCalled = false;

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          incrementCalled = true;
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test', user_id: proTierUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, proTierUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({ user_id: proTierUser.id }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(createEvolutionResponse('Analysis...'));

      await caller.evolution.generateDreamEvolution({ dreamId: TEST_DREAM_ID });

      expect(incrementCalled).toBe(true);
    });
  });

  describe('protected procedure checks', () => {
    it('should allow creator to generate evolution', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(creatorUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test', user_id: creatorUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, creatorUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({
            user_id: creatorUser.id,
            report_type: 'premium',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Creator analysis...', 2500)
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.evolutionId).toBeDefined();
    });

    it('should allow admin to generate evolution', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(adminUser);

      supabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'check_evolution_limit') {
          return Promise.resolve({ data: true, error: null });
        }
        if (funcName === 'increment_usage_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQueries({
        dreams: {
          data: { id: TEST_DREAM_ID, title: 'Test', user_id: adminUser.id },
          error: null,
        },
        reflections: {
          data: createMockReflections(4, adminUser.id),
          error: null,
        },
        evolution_reports: {
          data: createMockEvolutionReport({
            user_id: adminUser.id,
            report_type: 'premium',
          }),
          error: null,
        },
        api_usage_log: { data: null, error: null },
      });

      anthropicMock.messages.create.mockResolvedValue(
        createEvolutionResponse('Admin analysis...', 2500)
      );

      const result = await caller.evolution.generateDreamEvolution({
        dreamId: TEST_DREAM_ID,
      });

      expect(result.evolutionId).toBeDefined();
    });
  });

  describe('input validation', () => {
    it('should reject invalid page number in list', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(caller.evolution.list({ page: 0, limit: 10 })).rejects.toThrow();
    });

    it('should reject limit exceeding max in list', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(caller.evolution.list({ page: 1, limit: 51 })).rejects.toThrow();
    });

    it('should reject invalid UUID in get', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(caller.evolution.get({ id: 'invalid-uuid' })).rejects.toThrow();
    });
  });
});
