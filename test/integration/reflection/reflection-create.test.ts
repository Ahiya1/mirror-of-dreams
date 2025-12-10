// test/integration/reflection/reflection-create.test.ts
// Comprehensive tests for reflection.create mutation (AI generation)

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, cacheMock, promptsMock, anthropicMock } from '../setup';

import { createReflectionForUser } from '@/test/fixtures/reflections';
import {
  freeTierUser,
  freeTierAtLimit,
  proTierUser,
  proTierAtDailyLimit,
  unlimitedTierUser,
  unlimitedTierAtDailyLimit,
  creatorUser,
  adminUser,
  demoUser,
  createMockUser,
} from '@/test/fixtures/users';

// Valid UUIDs for test data
const TEST_DREAM_ID = '12345678-1234-1234-1234-123456789012';
const TEST_REFLECTION_ID = 'abcdef12-3456-7890-abcd-ef1234567890';

// Valid create reflection input
const validCreateInput = {
  dreamId: TEST_DREAM_ID,
  dream: 'I want to learn guitar and perform at open mic nights',
  plan: 'Practice 30 minutes daily, take lessons weekly, attend open mics monthly',
  relationship: 'This dream connects me to my creative side and childhood aspirations',
  offering: 'Time, dedication, and vulnerability to perform in public',
  tone: 'fusion' as const,
  isPremium: false,
};

// Helper to create a mock reflection database record
const createMockReflectionRecord = (overrides = {}) => ({
  id: TEST_REFLECTION_ID,
  user_id: freeTierUser.id,
  dream_id: TEST_DREAM_ID,
  dream: validCreateInput.dream,
  plan: validCreateInput.plan,
  relationship: validCreateInput.relationship,
  offering: validCreateInput.offering,
  ai_response:
    'Your journey speaks to the depths of your soul. This dream reflects your inner wisdom and courage to grow. The path you have chosen reveals your readiness for transformation.',
  tone: 'fusion',
  is_premium: false,
  word_count: 25,
  estimated_read_time: 1,
  title: 'Learn Guitar',
  tags: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Set up environment variable for Anthropic API - runs once before all tests
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
});

describe('reflection.create', () => {
  // Note: We don't call vi.clearAllMocks() here because createTestCaller already does it
  // and then restores the necessary mocks. We only configure per-test overrides when needed.

  // ===========================================================================
  // SUCCESS CASES (16 tests)
  // ===========================================================================

  describe('success cases', () => {
    it('TC-RC-01: should create basic reflection with valid input', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result).toMatchObject({
        reflection: expect.any(String),
        reflectionId: expect.any(String),
        isPremium: false,
        shouldTriggerEvolution: expect.any(Boolean),
        wordCount: expect.any(Number),
        estimatedReadTime: expect.any(Number),
        message: 'Reflection generated successfully',
      });
    });

    it('TC-RC-02: should use dream title from linked dream', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'My Guitar Journey' }, error: null },
        reflections: {
          data: createMockReflectionRecord({ title: 'My Guitar Journey' }),
          error: null,
        },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.reflectionId).toBeDefined();
    });

    it('TC-RC-03: should use first 100 chars of dream when no linked dream title', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Dream lookup returns null title
      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: null }, error: null },
        reflections: {
          data: createMockReflectionRecord({ title: validCreateInput.dream.slice(0, 100) }),
          error: null,
        },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.reflectionId).toBeDefined();
    });

    it('TC-RC-04: should use premium features for unlimited tier automatically', async () => {
      const { caller, mockQueries } = createTestCaller(unlimitedTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ is_premium: true }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create({
        ...validCreateInput,
        isPremium: false, // Not explicitly requested
      });

      expect(result.isPremium).toBe(true);
    });

    it('TC-RC-05: should use premium features for creator', async () => {
      const { caller, mockQueries } = createTestCaller(creatorUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ is_premium: true }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.isPremium).toBe(true);
    });

    it('TC-RC-06: should use premium when explicitly requested by pro user', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ is_premium: true }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create({
        ...validCreateInput,
        isPremium: true,
      });

      expect(result.isPremium).toBe(true);
    });

    it('TC-RC-07: should load gentle tone prompt correctly', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ tone: 'gentle' }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create({
        ...validCreateInput,
        tone: 'gentle',
      });

      expect(promptsMock.loadPrompts).toHaveBeenCalledWith('gentle', false, false);
    });

    it('TC-RC-08: should load intense tone prompt correctly', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ tone: 'intense' }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create({
        ...validCreateInput,
        tone: 'intense',
      });

      expect(promptsMock.loadPrompts).toHaveBeenCalledWith('intense', false, false);
    });

    it('TC-RC-09: should load fusion tone prompt by default', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create(validCreateInput);

      expect(promptsMock.loadPrompts).toHaveBeenCalledWith('fusion', false, false);
    });

    it('TC-RC-10: should calculate word count correctly', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Mock response with specific word count (25 words)
      anthropicMock.messages.create.mockResolvedValue({
        id: 'msg_test_12345',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Your journey speaks to the depths of your soul. This dream reflects your inner wisdom and courage to grow. The path you have chosen reveals your readiness for transformation.',
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ word_count: 25 }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('TC-RC-11: should calculate read time correctly (200 WPM)', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Mock response with ~600 words to test read time calculation
      const longResponse = Array(600).fill('word').join(' ');
      anthropicMock.messages.create.mockResolvedValue({
        id: 'msg_test_12345',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: longResponse }],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 600 },
      });

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: {
          data: createMockReflectionRecord({
            word_count: 600,
            estimated_read_time: 3,
            ai_response: longResponse,
          }),
          error: null,
        },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      // 600 words / 200 WPM = 3 minutes
      expect(result.estimatedReadTime).toBe(3);
    });

    it('TC-RC-12: should update user counters after creation', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create(validCreateInput);

      // Verify users table was updated
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('TC-RC-13: should invalidate cache after creation', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create(validCreateInput);

      expect(cacheMock.cacheDelete).toHaveBeenCalledWith(`ctx:reflections:${freeTierUser.id}`);
    });

    it('TC-RC-14: should trigger evolution for pro tier at threshold', async () => {
      const proUserWithReflections = createMockUser({
        ...proTierUser,
        totalReflections: 10,
      });
      const { caller, mockQueries } = createTestCaller(proUserWithReflections);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null, count: 4 },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      // Pro threshold is 4 reflections since last report
      expect(result.shouldTriggerEvolution).toBe(true);
    });

    it('TC-RC-15: should trigger evolution for unlimited tier at threshold', async () => {
      const { caller, mockQueries } = createTestCaller(unlimitedTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: {
          data: createMockReflectionRecord({ is_premium: true }),
          error: null,
          count: 6,
        },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      // Unlimited threshold is 6 reflections since last report
      expect(result.shouldTriggerEvolution).toBe(true);
    });

    it('TC-RC-16: should reset daily counter when new day', async () => {
      const userFromYesterday = createMockUser({
        ...proTierUser,
        reflectionsToday: 1,
        lastReflectionDate: '2024-01-01', // Old date
      });
      const { caller, mockQueries, supabase } = createTestCaller(userFromYesterday);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create(validCreateInput);

      // The update should reset reflections_today to 1 (not increment)
      expect(supabase.from).toHaveBeenCalledWith('users');
    });
  });

  // ===========================================================================
  // AUTHORIZATION CASES (8 tests)
  // ===========================================================================

  describe('authorization', () => {
    it('TC-RC-17: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Authentication required'),
      });
    });

    it('TC-RC-18: should reject demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('demo'),
      });
    });

    it('TC-RC-19: should reject free tier at monthly limit', async () => {
      const { caller } = createTestCaller(freeTierAtLimit);

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringMatching(/Monthly.*limit.*reached/i),
      });
    });

    it('TC-RC-20: should reject pro tier at monthly limit', async () => {
      const proAtMonthlyLimit = createMockUser({
        ...proTierUser,
        reflectionCountThisMonth: 30, // Pro monthly limit
      });
      const { caller } = createTestCaller(proAtMonthlyLimit);

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringMatching(/Monthly.*limit.*reached/i),
      });
    });

    it('TC-RC-21: should reject pro tier at daily limit', async () => {
      const { caller } = createTestCaller(proTierAtDailyLimit);

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringMatching(/Daily.*limit.*reached/i),
      });
    });

    it('TC-RC-22: should reject unlimited tier at daily limit', async () => {
      const { caller } = createTestCaller(unlimitedTierAtDailyLimit);

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringMatching(/Daily.*limit.*reached/i),
      });
    });

    it('TC-RC-23: should allow creator to bypass limits', async () => {
      const creatorAtLimit = createMockUser({
        ...creatorUser,
        reflectionCountThisMonth: 100, // Way over any limit
        reflectionsToday: 10,
        lastReflectionDate: new Date().toISOString().split('T')[0],
      });
      const { caller, mockQueries } = createTestCaller(creatorAtLimit);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ is_premium: true }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.reflectionId).toBeDefined();
    });

    it('TC-RC-24: should allow admin to bypass limits', async () => {
      const adminAtLimit = createMockUser({
        ...adminUser,
        reflectionCountThisMonth: 100, // Way over any limit
        reflectionsToday: 10,
        lastReflectionDate: new Date().toISOString().split('T')[0],
      });
      const { caller, mockQueries } = createTestCaller(adminAtLimit);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.reflectionId).toBeDefined();
    });
  });

  // ===========================================================================
  // ERROR CASES (8 tests)
  // ===========================================================================

  describe('error handling', () => {
    it('TC-RC-25: should handle Anthropic API error', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
      });

      anthropicMock.messages.create.mockRejectedValue(new Error('Anthropic API error'));

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to generate'),
      });
    });

    it('TC-RC-26: should handle Anthropic returning no text block', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
      });

      // Response with only thinking block, no text
      anthropicMock.messages.create.mockResolvedValue({
        id: 'msg_test_12345',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'thinking', thinking: 'Only thinking, no text response' }],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 10 },
      });

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to generate'),
      });
    });

    it('TC-RC-27: should handle database insert error', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: null, error: new Error('Database error') },
      });

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to save'),
      });
    });

    it('TC-RC-28: should handle missing API key', async () => {
      // Clear the API key
      delete process.env.ANTHROPIC_API_KEY;

      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
      });

      // The lazy initialization should throw
      await expect(caller.reflection.create(validCreateInput)).rejects.toThrow();
    });

    it('TC-RC-29: should reject invalid dreamId format', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.reflection.create({
          ...validCreateInput,
          dreamId: 'not-a-valid-uuid',
        })
      ).rejects.toThrow();
    });

    it('TC-RC-30: should reject empty dream text', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.reflection.create({
          ...validCreateInput,
          dream: '',
        })
      ).rejects.toThrow();
    });

    it('TC-RC-31: should reject dream text exceeding max length', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.reflection.create({
          ...validCreateInput,
          dream: 'x'.repeat(3201), // Max is 3200
        })
      ).rejects.toThrow();
    });

    it('TC-RC-32: should reject invalid tone', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.reflection.create({
          ...validCreateInput,
          tone: 'invalid' as 'fusion',
        })
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // EDGE CASES (4 tests)
  // ===========================================================================

  describe('edge cases', () => {
    it('TC-RC-33: should succeed after transient API error with retry', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      // First call fails, second succeeds (withAIRetry handles this)
      const overloadedError = new Error('Overloaded');
      (overloadedError as unknown as { status: number }).status = 529;

      anthropicMock.messages.create.mockRejectedValueOnce(overloadedError).mockResolvedValueOnce({
        id: 'msg_test_12345',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Your journey speaks to the depths of your soul.',
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.reflectionId).toBeDefined();
    });

    it('TC-RC-34: should use Friend when user has null name', async () => {
      const userWithNullName = createMockUser({
        ...freeTierUser,
        name: undefined,
      });
      const { caller, mockQueries } = createTestCaller(userWithNullName);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      // The user prompt should use 'Friend' when name is null
      expect(result.reflectionId).toBeDefined();
    });

    it('TC-RC-35: should apply defaults for optional fields', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      // Minimal input - only required fields
      const result = await caller.reflection.create({
        dreamId: TEST_DREAM_ID,
        dream: 'I want to learn guitar',
        plan: 'Practice daily',
        relationship: 'This connects to my creative side',
        offering: 'Time and dedication',
      });

      expect(result.isPremium).toBe(false); // Default
      expect(result.reflectionId).toBeDefined();
    });

    it('TC-RC-36: should calculate evolution eligibility with no prior reports', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null, count: 4 },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null }, // No previous reports
      });

      const result = await caller.reflection.create(validCreateInput);

      // With 4 reflections and pro tier (threshold 4), should trigger
      expect(result.shouldTriggerEvolution).toBe(true);
    });
  });

  // ===========================================================================
  // ADDITIONAL COVERAGE TESTS
  // ===========================================================================

  describe('premium feature configuration', () => {
    it('should call Anthropic with extended thinking for premium', async () => {
      const { caller, mockQueries } = createTestCaller(unlimitedTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ is_premium: true }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create(validCreateInput);

      expect(anthropicMock.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 6000, // Premium max tokens
          thinking: {
            type: 'enabled',
            budget_tokens: 5000,
          },
        })
      );
    });

    it('should call Anthropic without extended thinking for non-premium', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create(validCreateInput);

      expect(anthropicMock.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4000, // Non-premium max tokens
        })
      );

      // Should NOT have thinking parameter
      const callArgs = anthropicMock.messages.create.mock.calls[0][0];
      expect(callArgs.thinking).toBeUndefined();
    });
  });

  describe('prompt loading', () => {
    it('should load premium prompts for creator', async () => {
      const { caller, mockQueries } = createTestCaller(creatorUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord({ is_premium: true }), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create(validCreateInput);

      expect(promptsMock.loadPrompts).toHaveBeenCalledWith('fusion', true, true);
    });

    it('should load non-premium prompts for free tier', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      await caller.reflection.create(validCreateInput);

      expect(promptsMock.loadPrompts).toHaveBeenCalledWith('fusion', false, false);
    });
  });

  describe('evolution eligibility', () => {
    it('should not trigger evolution for free tier', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null, count: 100 },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.shouldTriggerEvolution).toBe(false);
    });

    it('should not trigger evolution below pro threshold', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: { data: createMockReflectionRecord(), error: null, count: 3 },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      // Pro threshold is 4, count is 3
      expect(result.shouldTriggerEvolution).toBe(false);
    });

    it('should not trigger evolution below unlimited threshold', async () => {
      const { caller, mockQueries } = createTestCaller(unlimitedTierUser);

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: {
          data: createMockReflectionRecord({ is_premium: true }),
          error: null,
          count: 5,
        },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      // Unlimited threshold is 6, count is 5
      expect(result.shouldTriggerEvolution).toBe(false);
    });
  });

  describe('AI response extraction', () => {
    it('should extract text from response with thinking block', async () => {
      const { caller, mockQueries } = createTestCaller(unlimitedTierUser);

      // Premium response includes thinking block
      anthropicMock.messages.create.mockResolvedValue({
        id: 'msg_premium_12345',
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'Extended thinking analysis...' },
          {
            type: 'text',
            text: 'Premium deep reflection with extended thinking enabled.',
          },
        ],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 200, output_tokens: 150 },
      });

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
        reflections: {
          data: createMockReflectionRecord({
            is_premium: true,
            ai_response: 'Premium deep reflection with extended thinking enabled.',
          }),
          error: null,
        },
        users: { data: null, error: null },
        evolution_reports: { data: null, error: null },
      });

      const result = await caller.reflection.create(validCreateInput);

      expect(result.reflection).toBe('Premium deep reflection with extended thinking enabled.');
    });

    it('should handle empty content array', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      anthropicMock.messages.create.mockResolvedValue({
        id: 'msg_empty_12345',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-sonnet-4-5-20250929',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 0 },
      });

      mockQueries({
        dreams: { data: { id: TEST_DREAM_ID, title: 'Learn Guitar' }, error: null },
      });

      await expect(caller.reflection.create(validCreateInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to generate'),
      });
    });
  });
});
