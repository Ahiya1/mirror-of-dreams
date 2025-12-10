// test/integration/dreams/list.test.ts - Dreams list integration tests
// Tests for the dreams.list tRPC procedure

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import {
  activeDream,
  achievedDream,
  archivedDream,
  createMockDreams,
  createMockDream,
} from '@/test/fixtures/dreams';
import { freeTierUser } from '@/test/fixtures/users';

describe('dreams.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should list all dreams for user', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const dreams = createMockDreams(3, freeTierUser.id);

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: dreams, error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 0 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({});

      expect(result).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [achievedDream], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 0 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({ status: 'achieved' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('achieved');
    });

    it('should include stats when requested (default)', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { created_at: '2025-01-01T00:00:00Z' },
            error: null,
          }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [activeDream], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 5 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({ includeStats: true });

      expect(result[0]).toHaveProperty('reflectionCount');
      expect(result[0]).toHaveProperty('lastReflectionAt');
      expect(result[0]).toHaveProperty('daysLeft');
    });

    it('should calculate daysLeft correctly for future date', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const dreamWithDate = createMockDream({
        ...activeDream,
        target_date: futureDate.toISOString().split('T')[0],
      });

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [dreamWithDate], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 0 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({ includeStats: true });

      expect(result[0].daysLeft).toBeGreaterThan(25);
      expect(result[0].daysLeft).toBeLessThanOrEqual(30);
    });

    it('should return null daysLeft for dreams without target date', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const dreamNoDate = createMockDream({
        ...activeDream,
        target_date: null,
      });

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [dreamNoDate], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 0 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({});

      expect(result[0].daysLeft).toBeNull();
    });

    it('should return negative daysLeft for overdue dreams', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const overdueDream = createMockDream({
        ...activeDream,
        target_date: pastDate.toISOString().split('T')[0],
      });

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [overdueDream], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 0 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({});

      expect(result[0].daysLeft).toBeLessThan(0);
    });

    it('should return empty array for user with no dreams', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => {
            resolve({ data: [], error: null });
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({});

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should filter by active status', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [activeDream], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 0 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({ status: 'active' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
    });

    it('should filter by archived status', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [archivedDream], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 0 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({ status: 'archived' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('archived');
    });
  });

  describe('stats calculation', () => {
    it('should include reflection count in stats', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { created_at: '2025-01-01T00:00:00Z' },
            error: null,
          }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [activeDream], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 10 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({ includeStats: true });

      expect(result[0].reflectionCount).toBe(10);
    });

    it('should include last reflection date in stats', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const lastReflectionDate = '2025-06-15T10:30:00Z';

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { created_at: lastReflectionDate },
            error: null,
          }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [activeDream], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 5 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({ includeStats: true });

      expect(result[0].lastReflectionAt).toBe(lastReflectionDate);
    });

    it('should return null for lastReflectionAt when no reflections', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          then: vi.fn((resolve: any) => {
            if (table === 'dreams') {
              resolve({ data: [activeDream], error: null });
            } else if (table === 'reflections') {
              resolve({ data: null, error: null, count: 0 });
            } else {
              resolve({ data: null, error: null });
            }
          }),
        };
        return mock;
      });

      const result = await caller.dreams.list({ includeStats: true });

      expect(result[0].lastReflectionAt).toBeNull();
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.dreams.list({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
