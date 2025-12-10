// test/integration/lifecycle/lifecycle.test.ts - Lifecycle router integration tests
// Tests dream lifecycle operations: evolve, achieve (ceremony), release (ritual)

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock, anthropicMock } from '../setup';

import { createMockDream } from '@/test/fixtures/dreams';
import {
  createMockEvolutionEvent,
  createEvolutionHistory,
  createMockCeremony,
  createMockRitual,
  validEvolveInput,
  minimalEvolveInput,
  validAchieveInput,
  minimalAchieveInput,
  validReleaseInput,
  minimalReleaseInput,
  mockCeremonySynthesisResponse,
} from '@/test/fixtures/lifecycle';
import { createMockReflections } from '@/test/fixtures/reflections';
import { proTierUser, freeTierUser } from '@/test/fixtures/users';

// =============================================================================
// CONSTANTS
// =============================================================================

const TEST_DREAM_ID = '11111111-1111-4111-a111-111111111111';
const TEST_USER_ID = proTierUser.id;

// =============================================================================
// TESTS: lifecycle.evolve
// =============================================================================

describe('lifecycle.evolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('success cases', () => {
    it('TC-LC-01: should evolve dream with full input', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
        title: 'Original Title',
        category: 'personal_growth',
      });

      const evolutionEvent = createMockEvolutionEvent({
        user_id: proTierUser.id,
        dream_id: TEST_DREAM_ID,
      });

      const updatedDream = {
        ...activeDream,
        title: validEvolveInput.newTitle,
        description: validEvolveInput.newDescription,
        target_date: validEvolveInput.newTargetDate,
        category: validEvolveInput.newCategory,
      };

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch dream
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            // Second call: update dream
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: updatedDream, error: null }),
            });
          }
        }
        if (table === 'evolution_events') {
          return createPartialMock({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: evolutionEvent, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.evolve(validEvolveInput);

      expect(result.dream.title).toBe(validEvolveInput.newTitle);
      expect(result.evolutionEvent).toBeDefined();
      expect(result.message).toBe('Dream evolved successfully');
    });

    it('TC-LC-02: should evolve dream with minimal input', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
        category: 'creative',
      });

      const evolutionEvent = createMockEvolutionEvent();

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          if (callCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { ...activeDream, title: minimalEvolveInput.newTitle },
                error: null,
              }),
            });
          }
        }
        if (table === 'evolution_events') {
          return createPartialMock({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: evolutionEvent, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.evolve(minimalEvolveInput);

      expect(result.dream.title).toBe(minimalEvolveInput.newTitle);
      expect(result.evolutionEvent).toBeDefined();
    });

    it('TC-LC-03: should preserve category when not provided', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
        category: 'health',
      });

      const evolutionEvent = createMockEvolutionEvent();

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          if (callCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { ...activeDream, title: minimalEvolveInput.newTitle },
                error: null,
              }),
            });
          }
        }
        if (table === 'evolution_events') {
          return createPartialMock({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: evolutionEvent, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.evolve(minimalEvolveInput);

      // Category should be preserved from original dream
      expect(result.dream.category).toBe('health');
    });
  });

  // ===========================================================================
  // AUTHORIZATION
  // ===========================================================================

  describe('authorization', () => {
    it('TC-LC-04: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.lifecycle.evolve(validEvolveInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('TC-LC-05: should reject access to other user dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.evolve(validEvolveInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    });
  });

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('validation', () => {
    it('TC-LC-06: should reject non-active dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const achievedDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'achieved',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: achievedDream, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.evolve(validEvolveInput)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Only active dreams can be evolved',
      });
    });

    it('TC-LC-07: should reject evolution reflection too short', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.lifecycle.evolve({
          ...validEvolveInput,
          evolutionReflection: 'Short', // Less than 10 chars
        })
      ).rejects.toThrow();
    });

    it('TC-LC-08: should reject invalid category', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.lifecycle.evolve({
          ...validEvolveInput,
          newCategory: 'invalid_category' as any,
        })
      ).rejects.toThrow();
    });

    it('TC-LC-09: should reject empty new title', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.lifecycle.evolve({
          ...validEvolveInput,
          newTitle: '',
        })
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('TC-LC-10: should handle evolution event insert error', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
          });
        }
        if (table === 'evolution_events') {
          return createPartialMock({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.evolve(validEvolveInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record evolution',
      });
    });
  });
});

// =============================================================================
// TESTS: lifecycle.getEvolutionHistory
// =============================================================================

describe('lifecycle.getEvolutionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-LC-11: should return evolution history', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const dream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        title: 'Evolved Dream',
      });

      const events = createEvolutionHistory(3, TEST_DREAM_ID, proTierUser.id);

      const callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: dream, error: null }),
          });
        }
        if (table === 'evolution_events') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: events, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.getEvolutionHistory({ dreamId: TEST_DREAM_ID });

      expect(result.dreamId).toBe(TEST_DREAM_ID);
      expect(result.dreamTitle).toBe('Evolved Dream');
      expect(result.events).toHaveLength(3);
      expect(result.evolutionCount).toBe(3);
    });

    it('TC-LC-12: should return empty history for new dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const dream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: dream, error: null }),
          });
        }
        if (table === 'evolution_events') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.getEvolutionHistory({ dreamId: TEST_DREAM_ID });

      expect(result.events).toHaveLength(0);
      expect(result.evolutionCount).toBe(0);
    });
  });

  describe('authorization', () => {
    it('TC-LC-13: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.lifecycle.getEvolutionHistory({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('TC-LC-14: should reject access to other user dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(
        caller.lifecycle.getEvolutionHistory({ dreamId: TEST_DREAM_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    });
  });
});

// =============================================================================
// TESTS: lifecycle.achieve
// =============================================================================

describe('lifecycle.achieve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  describe('success cases', () => {
    it('TC-LC-15: should create ceremony with AI synthesis', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
      });

      const reflections = createMockReflections(4, proTierUser.id);
      const ceremony = createMockCeremony({ dream_id: TEST_DREAM_ID, user_id: proTierUser.id });

      // Mock AI response for ceremony synthesis
      anthropicMock.messages.create.mockResolvedValue(mockCeremonySynthesisResponse);

      let dreamsCallCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          dreamsCallCount++;
          if (dreamsCallCount === 1) {
            // First call: fetch dream
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            // Second call: update status
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        if (table === 'achievement_ceremonies') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: vi.fn().mockReturnThis(),
          });
        }
        if (table === 'reflections') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: reflections, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      // Override achievement_ceremonies for insert
      const insertMock = vi.fn().mockReturnThis();
      const originalFrom = supabase.from;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'achievement_ceremonies') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: vi.fn().mockReturnThis(),
          });
        }
        return originalFrom(table);
      });

      // Recreate the mock with proper ceremony insert handling
      let ceremoniesCallCount = 0;
      dreamsCallCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          dreamsCallCount++;
          if (dreamsCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        if (table === 'achievement_ceremonies') {
          ceremoniesCallCount++;
          if (ceremoniesCallCount === 1) {
            // First call: check existing
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            });
          } else {
            // Second call: insert
            return createPartialMock({
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: ceremony, error: null }),
            });
          }
        }
        if (table === 'reflections') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: reflections, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.achieve(validAchieveInput);

      expect(result.ceremonyId).toBeDefined();
      expect(result.hasSynthesis).toBe(true);
      expect(result.reflectionCount).toBe(4);
      expect(result.message).toBe('Achievement ceremony created successfully');
    });

    it('TC-LC-16: should create ceremony without reflections', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
      });

      const ceremonyWithoutSynthesis = createMockCeremony({
        dream_id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        who_you_were: null,
        who_you_became: null,
        journey_synthesis: null,
        reflection_count: 0,
        reflections_analyzed: [],
      });

      let dreamsCallCount = 0;
      let ceremoniesCallCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          dreamsCallCount++;
          if (dreamsCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        if (table === 'achievement_ceremonies') {
          ceremoniesCallCount++;
          if (ceremoniesCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            });
          } else {
            return createPartialMock({
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: ceremonyWithoutSynthesis, error: null }),
            });
          }
        }
        if (table === 'reflections') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.achieve(minimalAchieveInput);

      expect(result.hasSynthesis).toBe(false);
      expect(result.reflectionCount).toBe(0);
    });

    it('TC-LC-17: should handle AI service error gracefully', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
      });

      const reflections = createMockReflections(4, proTierUser.id);
      const ceremonyWithoutSynthesis = createMockCeremony({
        dream_id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        who_you_were: null,
        who_you_became: null,
        journey_synthesis: null,
        reflection_count: 4,
      });

      // Mock AI error
      anthropicMock.messages.create.mockRejectedValue(new Error('API rate limited'));

      let dreamsCallCount = 0;
      let ceremoniesCallCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          dreamsCallCount++;
          if (dreamsCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        if (table === 'achievement_ceremonies') {
          ceremoniesCallCount++;
          if (ceremoniesCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            });
          } else {
            return createPartialMock({
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: ceremonyWithoutSynthesis, error: null }),
            });
          }
        }
        if (table === 'reflections') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: reflections, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.achieve(minimalAchieveInput);

      // Ceremony should be created without synthesis
      expect(result.ceremonyId).toBeDefined();
      expect(result.hasSynthesis).toBe(false);
    });
  });

  describe('authorization', () => {
    it('TC-LC-18: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.lifecycle.achieve(validAchieveInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('TC-LC-19: should reject access to other user dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.achieve(validAchieveInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    });
  });

  describe('validation', () => {
    it('TC-LC-20: should reject non-active dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const achievedDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'achieved',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: achievedDream, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.achieve(validAchieveInput)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Only active dreams can be marked as achieved',
      });
    });

    it('TC-LC-21: should reject if ceremony already exists', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
      });

      const existingCeremony = createMockCeremony();

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
          });
        }
        if (table === 'achievement_ceremonies') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: existingCeremony, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.achieve(validAchieveInput)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Achievement ceremony already exists for this dream',
      });
    });
  });
});

// =============================================================================
// TESTS: lifecycle.getCeremony
// =============================================================================

describe('lifecycle.getCeremony', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-LC-22: should return ceremony for dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const ceremony = createMockCeremony({
        dream_id: TEST_DREAM_ID,
        user_id: proTierUser.id,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'achievement_ceremonies') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: ceremony, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.getCeremony({ dreamId: TEST_DREAM_ID });

      expect(result.id).toBe(ceremony.id);
      expect(result.dream_title).toBe(ceremony.dream_title);
      expect(result.who_you_were).toBe(ceremony.who_you_were);
    });
  });

  describe('authorization', () => {
    it('TC-LC-23: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.lifecycle.getCeremony({ dreamId: TEST_DREAM_ID })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('TC-LC-24: should reject not found ceremony', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'achievement_ceremonies') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.getCeremony({ dreamId: TEST_DREAM_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Ceremony not found',
      });
    });
  });
});

// =============================================================================
// TESTS: lifecycle.updateCeremonyNote
// =============================================================================

describe('lifecycle.updateCeremonyNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-LC-25: should update ceremony personal note', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const updatedCeremony = createMockCeremony({
        dream_id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        personal_note: 'My updated personal note',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'achievement_ceremonies') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedCeremony, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.updateCeremonyNote({
        dreamId: TEST_DREAM_ID,
        personalNote: 'My updated personal note',
      });

      expect(result.personal_note).toBe('My updated personal note');
    });
  });

  describe('authorization', () => {
    it('TC-LC-26: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.lifecycle.updateCeremonyNote({
          dreamId: TEST_DREAM_ID,
          personalNote: 'Test',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('error handling', () => {
    it('TC-LC-27: should handle database error', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'achievement_ceremonies') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(
        caller.lifecycle.updateCeremonyNote({
          dreamId: TEST_DREAM_ID,
          personalNote: 'Test note',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update ceremony note',
      });
    });
  });
});

// =============================================================================
// TESTS: lifecycle.release
// =============================================================================

describe('lifecycle.release', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-LC-28: should create release ritual with full input', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
      });

      const ritual = createMockRitual({ dream_id: TEST_DREAM_ID, user_id: proTierUser.id });

      let dreamsCallCount = 0;
      let ritualsCallCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          dreamsCallCount++;
          if (dreamsCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        if (table === 'release_rituals') {
          ritualsCallCount++;
          if (ritualsCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            });
          } else {
            return createPartialMock({
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: ritual, error: null }),
            });
          }
        }
        if (table === 'reflections') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null, count: 3 }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.release(validReleaseInput);

      expect(result.ritualId).toBeDefined();
      expect(result.ritual).toBeDefined();
      expect(result.message).toBe('Release ritual completed successfully');
    });

    it('TC-LC-29: should create release ritual with minimal input', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
      });

      const ritual = createMockRitual({
        dream_id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        final_message: null,
        reason: null,
      });

      let dreamsCallCount = 0;
      let ritualsCallCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          dreamsCallCount++;
          if (dreamsCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
            });
          } else {
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        if (table === 'release_rituals') {
          ritualsCallCount++;
          if (ritualsCallCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            });
          } else {
            return createPartialMock({
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: ritual, error: null }),
            });
          }
        }
        if (table === 'reflections') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.release(minimalReleaseInput);

      expect(result.ritualId).toBeDefined();
    });
  });

  describe('authorization', () => {
    it('TC-LC-30: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.lifecycle.release(validReleaseInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('TC-LC-31: should reject access to other user dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.release(validReleaseInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    });
  });

  describe('validation', () => {
    it('TC-LC-32: should reject non-active dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const releasedDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'released',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: releasedDream, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.release(validReleaseInput)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Only active dreams can be released',
      });
    });

    it('TC-LC-33: should reject if ritual already exists', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const activeDream = createMockDream({
        id: TEST_DREAM_ID,
        user_id: proTierUser.id,
        status: 'active',
      });

      const existingRitual = createMockRitual();

      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: activeDream, error: null }),
          });
        }
        if (table === 'release_rituals') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: existingRitual, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.release(validReleaseInput)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Release ritual already exists for this dream',
      });
    });

    it('TC-LC-34: should reject text too short for required fields', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.lifecycle.release({
          ...validReleaseInput,
          whatILearned: 'Short', // Less than 10 chars
        })
      ).rejects.toThrow();
    });
  });
});

// =============================================================================
// TESTS: lifecycle.getRitual
// =============================================================================

describe('lifecycle.getRitual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-LC-35: should return ritual for dream', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const ritual = createMockRitual({
        dream_id: TEST_DREAM_ID,
        user_id: proTierUser.id,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'release_rituals') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: ritual, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.lifecycle.getRitual({ dreamId: TEST_DREAM_ID });

      expect(result.id).toBe(ritual.id);
      expect(result.what_i_learned).toBe(ritual.what_i_learned);
    });
  });

  describe('authorization', () => {
    it('TC-LC-36: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.lifecycle.getRitual({ dreamId: TEST_DREAM_ID })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('TC-LC-37: should reject not found ritual', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'release_rituals') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.lifecycle.getRitual({ dreamId: TEST_DREAM_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Ritual not found',
      });
    });
  });
});
