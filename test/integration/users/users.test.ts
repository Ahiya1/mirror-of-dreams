// test/integration/users/users.test.ts - Users router integration tests
// Tests for users.me (via auth.me), users.getProfile, and users.updateProfile

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import {
  freeTierUser,
  proTierUser,
  adminUser,
  demoUser,
  customPreferencesUser,
  createMockUserRow,
} from '@/test/fixtures/users';

describe('auth.me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should return current user when authenticated', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.me();

      expect(result.id).toBe(freeTierUser.id);
      expect(result.email).toBe(freeTierUser.email);
      expect(result.name).toBe(freeTierUser.name);
      expect(result.tier).toBe(freeTierUser.tier);
    });

    it('should return pro tier user data', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.auth.me();

      expect(result.tier).toBe('pro');
      expect(result.subscriptionPeriod).toBe('monthly');
      expect(result.subscriptionStatus).toBe('active');
    });

    it('should include admin flag for admin users', async () => {
      const { caller } = createTestCaller(adminUser);

      const result = await caller.auth.me();

      expect(result.isAdmin).toBe(true);
    });

    it('should include demo flag for demo users', async () => {
      const { caller } = createTestCaller(demoUser);

      const result = await caller.auth.me();

      expect(result.isDemo).toBe(true);
    });
  });

  describe('user properties', () => {
    it('should include usage statistics', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.me();

      expect(result).toHaveProperty('reflectionCountThisMonth');
      expect(result).toHaveProperty('totalReflections');
      expect(result).toHaveProperty('clarifySessionsThisMonth');
    });

    it('should include preferences', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.me();

      expect(result.preferences).toBeDefined();
      expect(result.preferences).toHaveProperty('default_tone');
      expect(result.preferences).toHaveProperty('notification_email');
    });

    it('should include custom preferences when set', async () => {
      const { caller } = createTestCaller(customPreferencesUser);

      const result = await caller.auth.me();

      expect(result.preferences.default_tone).toBe('gentle');
      expect(result.preferences.notification_email).toBe(false);
      expect(result.preferences.reflection_reminders).toBe('weekly');
    });
  });

  describe('authentication', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.me()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

describe('users.getProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should return user profile with stats', async () => {
      const { caller, mockQuery } = createTestCaller(freeTierUser);

      // Mock the database query for the profile
      const userRow = createMockUserRow({
        id: freeTierUser.id,
        email: freeTierUser.email,
        name: freeTierUser.name,
        tier: freeTierUser.tier,
        total_reflections: 5,
        reflection_count_this_month: 2,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      });

      mockQuery('users', { data: userRow, error: null });

      const result = await caller.users.getProfile();

      expect(result.id).toBe(freeTierUser.id);
      expect(result.email).toBe(freeTierUser.email);
      expect(result.tier).toBe('free');
    });

    it('should calculate days since joining', async () => {
      const { caller, mockQuery } = createTestCaller(freeTierUser);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const userRow = createMockUserRow({
        id: freeTierUser.id,
        created_at: thirtyDaysAgo,
      });

      mockQuery('users', { data: userRow, error: null });

      const result = await caller.users.getProfile();

      expect(result.daysSinceJoining).toBeGreaterThanOrEqual(29);
      expect(result.daysSinceJoining).toBeLessThanOrEqual(31);
    });

    it('should calculate average reflections per month', async () => {
      const { caller, mockQuery } = createTestCaller(freeTierUser);

      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const userRow = createMockUserRow({
        id: freeTierUser.id,
        total_reflections: 6,
        created_at: sixtyDaysAgo, // 2 months
      });

      mockQuery('users', { data: userRow, error: null });

      const result = await caller.users.getProfile();

      // 6 reflections over ~2 months = ~3 per month
      expect(result.averageReflectionsPerMonth).toBeGreaterThanOrEqual(2);
      expect(result.averageReflectionsPerMonth).toBeLessThanOrEqual(4);
    });

    it('should indicate subscription status', async () => {
      const { caller, mockQuery } = createTestCaller(proTierUser);

      const userRow = createMockUserRow({
        id: proTierUser.id,
        tier: 'pro',
        subscription_status: 'active',
      });

      mockQuery('users', { data: userRow, error: null });

      const result = await caller.users.getProfile();

      expect(result.isSubscribed).toBe(true);
      expect(result.subscriptionActive).toBe(true);
    });
  });

  describe('error cases', () => {
    it('should throw NOT_FOUND when user profile not found', async () => {
      const { caller, mockQuery } = createTestCaller(freeTierUser);

      mockQuery('users', { data: null, error: { code: 'PGRST116' } as any });

      await expect(caller.users.getProfile()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.users.getProfile()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

describe('users.updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should update user name', async () => {
      const { caller, mockQuery } = createTestCaller(freeTierUser);

      const updatedUserRow = createMockUserRow({
        id: freeTierUser.id,
        name: 'Updated Name',
      });

      mockQuery('users', { data: updatedUserRow, error: null });

      const result = await caller.users.updateProfile({ name: 'Updated Name' });

      expect(result.user.name).toBe('Updated Name');
      expect(result.message).toBe('Profile updated successfully');
    });

    it('should update user language', async () => {
      const { caller, mockQuery } = createTestCaller(freeTierUser);

      const updatedUserRow = createMockUserRow({
        id: freeTierUser.id,
        language: 'he',
      });

      mockQuery('users', { data: updatedUserRow, error: null });

      const result = await caller.users.updateProfile({ language: 'he' });

      expect(result.user.language).toBe('he');
      expect(result.message).toBe('Profile updated successfully');
    });

    it('should update multiple fields at once', async () => {
      const { caller, mockQuery } = createTestCaller(freeTierUser);

      const updatedUserRow = createMockUserRow({
        id: freeTierUser.id,
        name: 'New Name',
        language: 'he',
      });

      mockQuery('users', { data: updatedUserRow, error: null });

      const result = await caller.users.updateProfile({
        name: 'New Name',
        language: 'he',
      });

      expect(result.user.name).toBe('New Name');
      expect(result.user.language).toBe('he');
    });
  });

  describe('error cases', () => {
    it('should handle database error', async () => {
      const { caller, mockQuery } = createTestCaller(freeTierUser);

      mockQuery('users', {
        data: null,
        error: new Error('Database error'),
      });

      await expect(caller.users.updateProfile({ name: 'New Name' })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.users.updateProfile({ name: 'New Name' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

describe('users.updatePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should update user preferences', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      // Mock fetching current preferences
      const userRow = createMockUserRow({
        id: freeTierUser.id,
        preferences: {
          notification_email: true,
          reflection_reminders: 'off',
          evolution_email: true,
          marketing_emails: false,
          default_tone: 'fusion',
          show_character_counter: true,
          reduce_motion_override: null,
          analytics_opt_in: true,
        },
      });

      mockQueries({
        users: { data: userRow, error: null },
      });

      const result = await caller.users.updatePreferences({
        default_tone: 'gentle',
        notification_email: false,
      });

      expect(result.preferences.default_tone).toBe('gentle');
      expect(result.preferences.notification_email).toBe(false);
      // Other preferences should be preserved
      expect(result.preferences.evolution_email).toBe(true);
    });

    it('should merge with existing preferences', async () => {
      const { caller, mockQueries } = createTestCaller(freeTierUser);

      const userRow = createMockUserRow({
        id: freeTierUser.id,
        preferences: {
          notification_email: true,
          reflection_reminders: 'weekly',
          evolution_email: false,
          marketing_emails: true,
          default_tone: 'intense',
          show_character_counter: false,
          reduce_motion_override: true,
          analytics_opt_in: false,
        },
      });

      mockQueries({
        users: { data: userRow, error: null },
      });

      const result = await caller.users.updatePreferences({
        reflection_reminders: 'daily',
      });

      // Updated preference
      expect(result.preferences.reflection_reminders).toBe('daily');
      // Existing preferences preserved
      expect(result.preferences.notification_email).toBe(true);
      expect(result.preferences.default_tone).toBe('intense');
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.users.updatePreferences({ default_tone: 'gentle' })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
