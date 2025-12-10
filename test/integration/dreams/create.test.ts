// test/integration/dreams/create.test.ts - Dreams create integration tests
// Tests for the dreams.create tRPC procedure

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { createMockDream, DREAM_TIER_LIMITS } from '@/test/fixtures/dreams';
import { freeTierUser, proTierUser, unlimitedTierUser } from '@/test/fixtures/users';

describe('dreams.create', () => {
  const validInput = {
    title: 'Learn Spanish',
    description: 'Become conversational in 6 months',
    targetDate: '2025-12-31',
    category: 'educational' as const,
    priority: 7,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should create a dream for authenticated user', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const newDream = createMockDream({
        title: validInput.title,
        description: validInput.description,
        user_id: freeTierUser.id,
        category: validInput.category,
        priority: validInput.priority,
      });

      // Mock sequential calls:
      // 1. Check dream limit (count query)
      // 2. Insert dream
      // 3. Get active count for usage response
      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1) {
                // First call: count check (0 dreams)
                resolve({ data: null, error: null, count: 0 });
              } else if (callCount === 3) {
                // Third call: get active count for response
                resolve({ data: null, error: null, count: 1 });
              } else {
                // Second call: insert
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create(validInput);

      expect(result.dream.title).toBe(validInput.title);
      expect(result.dream.description).toBe(validInput.description);
      expect(result.usage).toBeDefined();
      expect(result.usage.dreamsUsed).toBe(1);
    });

    it('should return usage statistics after creation', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const newDream = createMockDream({
        title: validInput.title,
        user_id: freeTierUser.id,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1) {
                resolve({ data: null, error: null, count: 0 });
              } else if (callCount === 3) {
                resolve({ data: null, error: null, count: 1 });
              } else {
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create(validInput);

      expect(result.usage).toMatchObject({
        dreamsUsed: expect.any(Number),
        dreamsLimit: expect.any(Number),
        dreamLimitReached: expect.any(Boolean),
      });
      expect(result.usage.dreamsLimit).toBe(DREAM_TIER_LIMITS.free);
    });

    it('should allow unlimited tier to create many dreams', async () => {
      const { caller, supabase } = createTestCaller(unlimitedTierUser);

      const newDream = createMockDream({
        title: validInput.title,
        user_id: unlimitedTierUser.id,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1) {
                // 100 existing dreams - still under unlimited tier limit
                resolve({ data: null, error: null, count: 100 });
              } else if (callCount === 3) {
                resolve({ data: null, error: null, count: 101 });
              } else {
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create(validInput);

      expect(result.dream).toBeDefined();
      expect(result.usage.dreamLimitReached).toBe(false);
    });

    it('should set default priority when not provided', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const inputWithoutPriority = {
        title: 'New Dream',
      };

      const newDream = createMockDream({
        title: inputWithoutPriority.title,
        user_id: freeTierUser.id,
        priority: 5, // Default
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1 || callCount === 3) {
                resolve({ data: null, error: null, count: 0 });
              } else {
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create(inputWithoutPriority);

      expect(result.dream.priority).toBe(5);
    });
  });

  describe('tier limits', () => {
    it('should enforce 2-dream limit for free tier', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      // Mock: user already has 2 active dreams
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((resolve: any) => {
              resolve({ data: null, error: null, count: 2 });
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      await expect(caller.dreams.create(validInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('limit reached'),
      });
    });

    it('should enforce 5-dream limit for pro tier', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      // Mock: user already has 5 active dreams
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((resolve: any) => {
              resolve({ data: null, error: null, count: 5 });
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      await expect(caller.dreams.create(validInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('limit reached'),
      });
    });

    it('should allow pro tier to create when under limit', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const newDream = createMockDream({
        title: validInput.title,
        user_id: proTierUser.id,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1) {
                // 3 existing dreams - under pro limit of 5
                resolve({ data: null, error: null, count: 3 });
              } else if (callCount === 3) {
                resolve({ data: null, error: null, count: 4 });
              } else {
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create(validInput);
      expect(result.dream).toBeDefined();
    });

    it('should allow free tier to create first dream', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const newDream = createMockDream({
        title: validInput.title,
        user_id: freeTierUser.id,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1) {
                // No existing dreams
                resolve({ data: null, error: null, count: 0 });
              } else if (callCount === 3) {
                resolve({ data: null, error: null, count: 1 });
              } else {
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create(validInput);
      expect(result.dream).toBeDefined();
      expect(result.usage.dreamsUsed).toBe(1);
      expect(result.usage.dreamsLimit).toBe(2);
    });
  });

  describe('validation', () => {
    it('should require a title', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(caller.dreams.create({ ...validInput, title: '' })).rejects.toThrow();
    });

    it('should limit title length to 200 characters', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.dreams.create({ ...validInput, title: 'x'.repeat(201) })
      ).rejects.toThrow();
    });

    it('should accept title at max length (200 characters)', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const longTitle = 'x'.repeat(200);
      const newDream = createMockDream({
        title: longTitle,
        user_id: freeTierUser.id,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1 || callCount === 3) {
                resolve({ data: null, error: null, count: 0 });
              } else {
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create({ ...validInput, title: longTitle });
      expect(result.dream.title).toBe(longTitle);
    });

    it('should validate category enum', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.dreams.create({ ...validInput, category: 'invalid' as any })
      ).rejects.toThrow();
    });

    it('should reject priority below minimum (1)', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(caller.dreams.create({ ...validInput, priority: 0 })).rejects.toThrow();
    });

    it('should reject priority above maximum (10)', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(caller.dreams.create({ ...validInput, priority: 11 })).rejects.toThrow();
    });

    it('should accept priority at minimum (1)', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const newDream = createMockDream({
        title: validInput.title,
        user_id: freeTierUser.id,
        priority: 1,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1 || callCount === 3) {
                resolve({ data: null, error: null, count: 0 });
              } else {
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create({ ...validInput, priority: 1 });
      expect(result.dream.priority).toBe(1);
    });

    it('should accept priority at maximum (10)', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const newDream = createMockDream({
        title: validInput.title,
        user_id: freeTierUser.id,
        priority: 10,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'dreams') {
          callCount++;
          const mock = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
            then: vi.fn((resolve: any) => {
              if (callCount === 1 || callCount === 3) {
                resolve({ data: null, error: null, count: 0 });
              } else {
                resolve({ data: newDream, error: null });
              }
            }),
          };
          return mock;
        }
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      });

      const result = await caller.dreams.create({ ...validInput, priority: 10 });
      expect(result.dream.priority).toBe(10);
    });

    it('should limit description length to 2000 characters', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.dreams.create({ ...validInput, description: 'x'.repeat(2001) })
      ).rejects.toThrow();
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.dreams.create(validInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
