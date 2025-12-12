// test/integration/admin/admin.test.ts - Admin router integration tests
// Tests for admin CRUD operations and statistics

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { creatorUser, freeTierUser, proTierUser } from '@/test/fixtures/users';

describe('admin.authenticate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set mock creator secret for tests
    vi.stubEnv('CREATOR_SECRET_KEY', 'test-creator-secret');
  });

  it('should authenticate with correct creator secret', async () => {
    const { caller } = createTestCaller(null);

    const result = await caller.admin.authenticate({
      creatorSecret: 'test-creator-secret',
    });

    expect(result.success).toBe(true);
    expect(result.authenticated).toBe(true);
    expect(result.message).toBe('Creator authenticated successfully');
  });

  it('should reject invalid creator secret', async () => {
    const { caller } = createTestCaller(null);

    await expect(
      caller.admin.authenticate({ creatorSecret: 'wrong-secret' })
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Invalid creator secret',
    });
  });
});

describe('admin.checkAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CREATOR_SECRET_KEY', 'test-creator-secret');
  });

  it('should return true for valid key', async () => {
    const { caller } = createTestCaller(null);

    const result = await caller.admin.checkAuth({ key: 'test-creator-secret' });

    expect(result.authenticated).toBe(true);
  });

  it('should return false for invalid key', async () => {
    const { caller } = createTestCaller(null);

    const result = await caller.admin.checkAuth({ key: 'wrong-key' });

    expect(result.authenticated).toBe(false);
  });
});

describe('admin.getAllUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated users for creator', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockUsers = [
      { id: 'user-1', email: 'user1@test.com', tier: 'free' },
      { id: 'user-2', email: 'user2@test.com', tier: 'pro' },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
            count: 2,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getAllUsers({ page: 1, limit: 50 });

    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });

  it('should filter users by tier', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockUsers = [{ id: 'user-1', email: 'pro@test.com', tier: 'pro' }];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
            count: 1,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getAllUsers({ page: 1, limit: 50, tier: 'essential' });

    expect(result.items).toHaveLength(1);
  });

  it('should throw error on database failure', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
        count: 0,
      }),
    }));

    await expect(caller.admin.getAllUsers({ page: 1, limit: 50 })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('should reject non-creator users', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.admin.getAllUsers({ page: 1, limit: 50 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});

describe('admin.getAllReflections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated reflections for creator', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockReflections = [
      { id: 'ref-1', dream: 'Dream 1', user_id: 'user-1' },
      { id: 'ref-2', dream: 'Dream 2', user_id: 'user-2' },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockReflections,
            error: null,
            count: 2,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getAllReflections({ page: 1, limit: 50 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter reflections by userId', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockReflections = [{ id: 'ref-1', dream: 'Dream 1', user_id: 'user-1' }];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockReflections,
            error: null,
            count: 1,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getAllReflections({
      page: 1,
      limit: 50,
      userId: '11111111-1111-4111-8111-111111111111',
    });

    expect(result.items).toHaveLength(1);
  });

  it('should throw error on database failure', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
        count: 0,
      }),
    }));

    await expect(caller.admin.getAllReflections({ page: 1, limit: 50 })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('admin.getStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return system statistics for creator', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockUsers = [
      { tier: 'free', subscription_status: 'active' },
      { tier: 'essential', subscription_status: 'active' },
      { tier: 'premium', subscription_status: 'active' },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 10,
        }),
      };
    });

    const result = await caller.admin.getStats();

    expect(result.users.total).toBe(3);
    expect(result.users.free).toBe(1);
    expect(result.users.essential).toBe(1);
    expect(result.users.premium).toBe(1);
    expect(result.users.active).toBe(3);
    expect(result).toHaveProperty('reflections');
    expect(result).toHaveProperty('evolutionReports');
    expect(result).toHaveProperty('artifacts');
  });

  it('should throw error on users fetch failure', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      }),
    }));

    await expect(caller.admin.getStats()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('admin.getUserByEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find user by email', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test' };

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getUserByEmail({ email: 'test@example.com' });

    expect(result.id).toBe('user-1');
    expect(result.email).toBe('test@example.com');
  });

  it('should throw NOT_FOUND for non-existent email', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }));

    await expect(
      caller.admin.getUserByEmail({ email: 'notfound@example.com' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('admin.updateUserTier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update user tier successfully', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockUpdatedUser = { id: 'user-1', email: 'test@example.com', tier: 'premium' };

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedUser,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.updateUserTier({
      userId: '11111111-1111-4111-8111-111111111111',
      tier: 'premium',
    });

    expect(result.user.tier).toBe('premium');
    expect(result.message).toBe('User tier updated to premium');
  });

  it('should throw error on update failure', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      }),
    }));

    await expect(
      caller.admin.updateUserTier({
        userId: '11111111-1111-4111-8111-111111111111',
        tier: 'premium',
      })
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('admin.getWebhookEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return webhook events for creator', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockEvents = [
      { id: 'evt-1', event_id: 'ev_123', event_type: 'payment.completed' },
      { id: 'evt-2', event_id: 'ev_456', event_type: 'subscription.created' },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'webhook_events') {
        // Chain: select -> order -> limit -> then
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockEvents,
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getWebhookEvents({ limit: 20 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by event type', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockEvents = [{ id: 'evt-1', event_id: 'ev_123', event_type: 'payment.completed' }];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'webhook_events') {
        // Chain: select -> order -> limit -> eq -> then
        const limitResult = {
          eq: vi.fn().mockResolvedValue({
            data: mockEvents,
            error: null,
          }),
          then: vi.fn((resolve: any) =>
            resolve({
              data: mockEvents,
              error: null,
            })
          ),
        };
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(limitResult),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getWebhookEvents({
      limit: 20,
      eventType: 'payment.completed',
    });

    expect(result.items).toHaveLength(1);
  });

  it('should throw error on fetch failure', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('DB error'),
          }),
        }),
      }),
    }));

    await expect(caller.admin.getWebhookEvents({ limit: 20 })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('admin.getFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return feedback with statistics', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockFeedback = [
      { id: 'ref-1', rating: 8, user_feedback: 'Great!', users: { email: 'a@b.com' } },
      { id: 'ref-2', rating: 9, user_feedback: 'Amazing!', users: { email: 'c@d.com' } },
    ];

    const mockRatings = [{ rating: 8 }, { rating: 9 }, { rating: 10 }];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockFeedback,
            error: null,
            count: 2,
          }),
          then: vi.fn((resolve: any) =>
            resolve({
              data: mockRatings,
              error: null,
            })
          ),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getFeedback({ page: 1, limit: 50 });

    expect(result.items).toBeDefined();
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result).toHaveProperty('averageRating');
    expect(result).toHaveProperty('distribution');
  });

  it('should filter by rating range', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
          then: vi.fn((resolve: any) => resolve({ data: [], error: null })),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getFeedback({
      page: 1,
      limit: 50,
      minRating: 7,
      maxRating: 10,
    });

    expect(result.items).toBeDefined();
  });

  it('should throw error on fetch failure', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
        count: 0,
      }),
    }));

    await expect(caller.admin.getFeedback({ page: 1, limit: 50 })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('admin.getApiUsageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return API usage statistics', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    const mockLogs = [
      {
        operation_type: 'reflection',
        cost_usd: 0.05,
        input_tokens: 100,
        output_tokens: 200,
        thinking_tokens: 50,
      },
      {
        operation_type: 'evolution',
        cost_usd: 0.08,
        input_tokens: 150,
        output_tokens: 300,
        thinking_tokens: 100,
      },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'api_usage_log') {
        return {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockLogs,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getApiUsageStats({});

    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('summary');
    expect(result.summary.totalOperations).toBe(2);
    expect(result.summary.totalCost).toBeCloseTo(0.13);
    expect(result).toHaveProperty('byOperationType');
    expect(result.byOperationType).toHaveProperty('reflection');
    expect(result.byOperationType).toHaveProperty('evolution');
  });

  it('should handle specific month parameter', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'api_usage_log') {
        return {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.admin.getApiUsageStats({ month: '2025-06' });

    expect(result.month).toBe('2025-06');
    expect(result.summary.totalOperations).toBe(0);
  });

  it('should throw error on fetch failure', async () => {
    const { caller, supabase } = createTestCaller(creatorUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      }),
    }));

    await expect(caller.admin.getApiUsageStats({})).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
