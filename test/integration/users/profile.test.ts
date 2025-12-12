// test/integration/users/profile.test.ts - User profile integration tests
// Tests for user profile, preferences, and usage statistics

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { proTierUser, freeTierUser, createMockUserRow } from '@/test/fixtures/users';

describe('users.completeOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete onboarding successfully', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    const mockUserRow = createMockUserRow({
      id: freeTierUser.id,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockUserRow,
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

    const result = await caller.users.completeOnboarding();

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });

  it('should throw error on database failure', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      }),
    }));

    await expect(caller.users.completeOnboarding()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('users.getProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user profile with metrics', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const mockProfile = {
      id: proTierUser.id,
      email: proTierUser.email,
      name: proTierUser.name,
      tier: proTierUser.tier,
      subscription_status: 'active',
      subscription_period: 'monthly',
      reflection_count_this_month: 5,
      reflections_today: 1,
      total_reflections: 25,
      clarify_sessions_this_month: 2,
      total_clarify_sessions: 10,
      cancel_at_period_end: false,
      is_creator: false,
      is_admin: false,
      is_demo: false,
      language: 'en',
      email_verified: true,
      preferences: {},
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
      last_sign_in_at: new Date().toISOString(),
      last_reflection_at: new Date().toISOString(),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
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

    const result = await caller.users.getProfile();

    expect(result.id).toBe(proTierUser.id);
    expect(result.email).toBe(proTierUser.email);
    expect(result).toHaveProperty('daysSinceJoining');
    expect(result).toHaveProperty('isSubscribed');
    expect(result).toHaveProperty('subscriptionActive');
    expect(result).toHaveProperty('averageReflectionsPerMonth');
    expect(result).toHaveProperty('memberSince');
    expect(result).toHaveProperty('lastActiveDate');
  });

  it('should throw NOT_FOUND for missing profile', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }));

    await expect(caller.users.getProfile()).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('users.updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update profile successfully', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const mockUpdatedUser = createMockUserRow({
      id: proTierUser.id,
      name: 'Updated Name',
    });

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

    const result = await caller.users.updateProfile({ name: 'Updated Name' });

    expect(result.user.name).toBe('Updated Name');
    expect(result.message).toBe('Profile updated successfully');
  });

  it('should throw error on update failure', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      }),
    }));

    await expect(caller.users.updateProfile({ name: 'Test' })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('users.changeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'test-jwt-secret');
  });

  // Note: Full change email tests require module-level bcrypt mocking
  // which conflicts with the existing test setup. Testing key scenarios only.

  it('should reject if email already in use', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'existing-user-id' }, // Email already exists
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

    await expect(
      caller.users.changeEmail({
        newEmail: 'existing@example.com',
        currentPassword: 'password',
      })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Email already in use',
    });
  });

  it('should reject if user not found', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            callCount++;
            // First call: check email (not found - OK)
            // Second call: get user with password (not found - error)
            if (callCount === 1) {
              return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await expect(
      caller.users.changeEmail({
        newEmail: 'newemail@example.com',
        currentPassword: 'password',
      })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('users.updatePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update preferences with partial data', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const existingPreferences = {
      notification_email: true,
      reflection_reminders: 'off',
      default_tone: 'fusion',
    };

    let selectCalled = false;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            if (!selectCalled) {
              selectCalled = true;
              return Promise.resolve({
                data: { preferences: existingPreferences },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await caller.users.updatePreferences({
      default_tone: 'gentle',
      show_character_counter: false,
    });

    expect(result.preferences.default_tone).toBe('gentle');
    expect(result.preferences.show_character_counter).toBe(false);
    expect(result.message).toBe('Preferences updated');
  });

  it('should throw NOT_FOUND if user not found', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }));

    await expect(caller.users.updatePreferences({ default_tone: 'gentle' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should throw error on update failure', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    let selectCalled = false;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            if (!selectCalled) {
              selectCalled = true;
              return Promise.resolve({
                data: { preferences: {} },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          then: vi.fn((resolve: any) => resolve({ data: null, error: new Error('Update failed') })),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await expect(caller.users.updatePreferences({ default_tone: 'gentle' })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('users.getUsageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return comprehensive usage statistics', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const mockReflections = [
      { created_at: new Date().toISOString(), tone: 'gentle', is_premium: false, word_count: 100 },
      { created_at: new Date().toISOString(), tone: 'intense', is_premium: true, word_count: 200 },
      { created_at: new Date().toISOString(), tone: 'fusion', is_premium: false, word_count: 150 },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: mockReflections,
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

    const result = await caller.users.getUsageStats();

    expect(result.totalReflections).toBe(3);
    expect(result.reflectionsByTone.gentle).toBe(1);
    expect(result.reflectionsByTone.intense).toBe(1);
    expect(result.reflectionsByTone.fusion).toBe(1);
    expect(result.premiumReflections).toBe(1);
    expect(result.averageWordCount).toBe(150);
    expect(result).toHaveProperty('monthlyBreakdown');
    expect(result.monthlyBreakdown).toHaveLength(6);
  });

  it('should handle zero reflections', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
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

    const result = await caller.users.getUsageStats();

    expect(result.totalReflections).toBe(0);
    expect(result.averageWordCount).toBe(0);
    expect(result.premiumReflections).toBe(0);
  });

  it('should throw error on fetch failure', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      }),
    }));

    await expect(caller.users.getUsageStats()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('users.getDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return comprehensive dashboard data', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const mockReflections = [
      { id: 'ref-1', dream: 'Dream 1', title: 'Title 1', tone: 'gentle', is_premium: false },
      { id: 'ref-2', dream: 'Dream 2', title: 'Title 2', tone: 'fusion', is_premium: true },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: mockReflections,
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

    const result = await caller.users.getDashboardData();

    expect(result.user.name).toBe(proTierUser.name);
    expect(result.user.tier).toBe(proTierUser.tier);
    expect(result).toHaveProperty('usage');
    expect(result.usage).toHaveProperty('limit');
    expect(result.usage).toHaveProperty('used');
    expect(result.usage).toHaveProperty('remaining');
    expect(result.usage).toHaveProperty('canReflect');
    expect(result.recentReflections).toHaveLength(2);
    expect(result).toHaveProperty('stats');
  });

  it('should throw error on fetch failure', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      }),
    }));

    await expect(caller.users.getDashboardData()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('authentication', () => {
  it('should reject unauthenticated requests', async () => {
    const { caller } = createTestCaller(null);

    await expect(caller.users.getProfile()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
