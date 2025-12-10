// test/integration/dreams/crud.test.ts - Dreams CRUD integration tests
// Tests for dreams.get, dreams.update, dreams.updateStatus, dreams.delete, dreams.getLimits

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { activeDream, createMockDream, DREAM_TIER_LIMITS } from '@/test/fixtures/dreams';
import { freeTierUser, proTierUser, unlimitedTierUser } from '@/test/fixtures/users';

describe('dreams.get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get a single dream by ID', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: table === 'dreams' ? activeDream : { created_at: '2025-01-01' },
          error: null,
        }),
        then: vi.fn((resolve: any) => {
          if (table === 'reflections') {
            resolve({ data: null, error: null, count: 0 });
          } else {
            resolve({ data: activeDream, error: null });
          }
        }),
      };
      return mock;
    });

    const result = await caller.dreams.get({ id: activeDream.id });

    expect(result.id).toBe(activeDream.id);
    expect(result.title).toBe(activeDream.title);
  });

  it('should include stats in get response', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: table === 'dreams' ? activeDream : { created_at: '2025-06-01T10:00:00Z' },
          error: null,
        }),
        then: vi.fn((resolve: any) => {
          if (table === 'reflections') {
            resolve({ data: null, error: null, count: 5 });
          } else {
            resolve({ data: activeDream, error: null });
          }
        }),
      };
      return mock;
    });

    const result = await caller.dreams.get({ id: activeDream.id });

    expect(result).toHaveProperty('reflectionCount');
    expect(result.reflectionCount).toBe(5);
    expect(result).toHaveProperty('lastReflectionAt');
    expect(result).toHaveProperty('daysLeft');
  });

  it('should throw NOT_FOUND for non-existent dream', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      return mock;
    });

    await expect(
      caller.dreams.get({ id: '99999999-9999-4999-9999-999999999999' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should not return other users dreams', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    // Dream belongs to another user, so the query should return null
    supabase.from.mockImplementation((table: string) => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      return mock;
    });

    await expect(
      caller.dreams.get({ id: '88888888-8888-4888-8888-888888888888' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should require authentication', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.dreams.get({ id: activeDream.id })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('should validate id as UUID', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.dreams.get({ id: 'not-a-uuid' })).rejects.toThrow();
  });
});

describe('dreams.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update dream fields', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    const updatedDream = { ...activeDream, title: 'Updated Title' };

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        callCount++;
        const mock = {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: callCount === 1 ? { id: activeDream.id } : updatedDream,
            error: null,
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.dreams.update({
      id: activeDream.id,
      title: 'Updated Title',
    });

    expect(result.title).toBe('Updated Title');
  });

  it('should update multiple fields at once', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    const updatedDream = {
      ...activeDream,
      title: 'New Title',
      description: 'New Description',
      priority: 8,
    };

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        callCount++;
        const mock = {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: callCount === 1 ? { id: activeDream.id } : updatedDream,
            error: null,
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.dreams.update({
      id: activeDream.id,
      title: 'New Title',
      description: 'New Description',
      priority: 8,
    });

    expect(result.title).toBe('New Title');
    expect(result.description).toBe('New Description');
    expect(result.priority).toBe(8);
  });

  it('should verify ownership before update', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      return mock;
    });

    await expect(
      caller.dreams.update({ id: '77777777-7777-4777-7777-777777777777', title: 'Hacked' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should allow clearing target date', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    const updatedDream = { ...activeDream, target_date: null };

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        callCount++;
        const mock = {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: callCount === 1 ? { id: activeDream.id } : updatedDream,
            error: null,
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.dreams.update({
      id: activeDream.id,
      targetDate: null,
    });

    expect(result.target_date).toBeNull();
  });

  it('should require authentication', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.dreams.update({ id: activeDream.id, title: 'Test' })).rejects.toMatchObject(
      {
        code: 'UNAUTHORIZED',
      }
    );
  });
});

describe('dreams.updateStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update status to achieved', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    const achievedDream = {
      ...activeDream,
      status: 'achieved',
      achieved_at: expect.any(String),
    };

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        callCount++;
        const mock = {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: callCount === 1 ? { id: activeDream.id } : achievedDream,
            error: null,
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.dreams.updateStatus({
      id: activeDream.id,
      status: 'achieved',
    });

    expect(result.status).toBe('achieved');
  });

  it('should update status to archived', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    const archivedDream = {
      ...activeDream,
      status: 'archived',
      archived_at: expect.any(String),
    };

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        callCount++;
        const mock = {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: callCount === 1 ? { id: activeDream.id } : archivedDream,
            error: null,
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.dreams.updateStatus({
      id: activeDream.id,
      status: 'archived',
    });

    expect(result.status).toBe('archived');
  });

  it('should update status to released', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    const releasedDream = {
      ...activeDream,
      status: 'released',
      released_at: expect.any(String),
    };

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        callCount++;
        const mock = {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: callCount === 1 ? { id: activeDream.id } : releasedDream,
            error: null,
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.dreams.updateStatus({
      id: activeDream.id,
      status: 'released',
    });

    expect(result.status).toBe('released');
  });

  it('should verify ownership before status update', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      return mock;
    });

    await expect(
      caller.dreams.updateStatus({ id: '66666666-6666-4666-6666-666666666666', status: 'achieved' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should validate status enum', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(
      caller.dreams.updateStatus({ id: activeDream.id, status: 'invalid' as any })
    ).rejects.toThrow();
  });

  it('should require authentication', async () => {
    const { caller } = createTestCaller(null);

    await expect(
      caller.dreams.updateStatus({ id: activeDream.id, status: 'achieved' })
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});

describe('dreams.delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a dream', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        callCount++;
        const mock = {
          select: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: activeDream.id },
            error: null,
          }),
          then: vi.fn((resolve: any) => {
            resolve({ data: null, error: null });
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.dreams.delete({ id: activeDream.id });

    expect(result.success).toBe(true);
  });

  it('should verify ownership before delete', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      return mock;
    });

    await expect(
      caller.dreams.delete({ id: '55555555-5555-4555-5555-555555555555' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should require authentication', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.dreams.delete({ id: activeDream.id })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('should validate id as UUID', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.dreams.delete({ id: 'not-a-uuid' })).rejects.toThrow();
  });
});

describe('dreams.getLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct limits for free tier', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => {
            resolve({ data: null, error: null, count: 1 });
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
      };
    });

    const result = await caller.dreams.getLimits();

    expect(result.tier).toBe('free');
    expect(result.dreamsLimit).toBe(DREAM_TIER_LIMITS.free);
    expect(result.dreamsUsed).toBe(1);
    expect(result.dreamsRemaining).toBe(1);
    expect(result.canCreate).toBe(true);
  });

  it('should return correct limits for pro tier', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => {
            resolve({ data: null, error: null, count: 3 });
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
      };
    });

    const result = await caller.dreams.getLimits();

    expect(result.tier).toBe('pro');
    expect(result.dreamsLimit).toBe(DREAM_TIER_LIMITS.pro);
    expect(result.dreamsUsed).toBe(3);
    expect(result.dreamsRemaining).toBe(2);
    expect(result.canCreate).toBe(true);
  });

  it('should return correct limits for unlimited tier', async () => {
    const { caller, supabase } = createTestCaller(unlimitedTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => {
            resolve({ data: null, error: null, count: 100 });
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
      };
    });

    const result = await caller.dreams.getLimits();

    expect(result.tier).toBe('unlimited');
    expect(result.dreamsUsed).toBe(100);
    expect(result.canCreate).toBe(true);
  });

  it('should show canCreate as false when at limit', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => {
            resolve({ data: null, error: null, count: 2 }); // At free tier limit
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
      };
    });

    const result = await caller.dreams.getLimits();

    expect(result.tier).toBe('free');
    expect(result.dreamsUsed).toBe(2);
    expect(result.dreamsRemaining).toBe(0);
    expect(result.canCreate).toBe(false);
  });

  it('should show 0 dreams used for new user', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        const mock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => {
            resolve({ data: null, error: null, count: 0 });
          }),
        };
        return mock;
      }
      return {
        select: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
      };
    });

    const result = await caller.dreams.getLimits();

    expect(result.dreamsUsed).toBe(0);
    expect(result.dreamsRemaining).toBe(2);
    expect(result.canCreate).toBe(true);
  });

  it('should require authentication', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.dreams.getLimits()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
