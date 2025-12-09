// lib/utils/__tests__/limits.test.ts
// Tests for reflection limit checking logic

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { checkReflectionLimits } from '../limits';

import type { User } from '@/types';

/**
 * Helper to create mock user with defaults
 */
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-uuid-1234',
    email: 'test@example.com',
    name: 'Test User',
    tier: 'free',
    subscriptionStatus: 'active',
    subscriptionPeriod: null,
    reflectionCountThisMonth: 0,
    reflectionsToday: 0,
    lastReflectionDate: null,
    totalReflections: 0,
    clarifySessionsThisMonth: 0,
    totalClarifySessions: 0,
    currentMonthYear: '2024-06',
    cancelAtPeriodEnd: false,
    isCreator: false,
    isAdmin: false,
    isDemo: false,
    language: 'en',
    emailVerified: true,
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
    createdAt: '2024-01-01T00:00:00Z',
    lastSignInAt: '2024-06-15T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z',
    ...overrides,
  };
}

describe('checkReflectionLimits', () => {
  beforeEach(() => {
    // Fix the current date for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==================================================
  // Free Tier Tests
  // ==================================================

  describe('free tier', () => {
    describe('monthly limit', () => {
      test('should allow first reflection', () => {
        const user = createMockUser({
          tier: 'free',
          reflectionCountThisMonth: 0,
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      test('should allow second reflection (under limit)', () => {
        const user = createMockUser({
          tier: 'free',
          reflectionCountThisMonth: 1,
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      test('should deny third reflection (at limit)', () => {
        const user = createMockUser({
          tier: 'free',
          reflectionCountThisMonth: 2, // Free tier limit is 2
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(false);
        expect(result.reason).toBe('monthly_limit');
        expect(result.resetTime).toBeUndefined();
      });

      test('should deny when over monthly limit', () => {
        const user = createMockUser({
          tier: 'free',
          reflectionCountThisMonth: 5, // Over limit
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(false);
        expect(result.reason).toBe('monthly_limit');
      });
    });

    describe('daily limit', () => {
      test('should have no daily limit (free tier has Infinity daily limit)', () => {
        const user = createMockUser({
          tier: 'free',
          reflectionCountThisMonth: 0,
          reflectionsToday: 100, // Many reflections today
          lastReflectionDate: '2024-06-15', // Same day
        });

        const result = checkReflectionLimits(user);

        // Free tier has no daily limit, only monthly
        expect(result.canCreate).toBe(true);
      });
    });
  });

  // ==================================================
  // Pro Tier Tests
  // ==================================================

  describe('pro tier', () => {
    describe('monthly limit', () => {
      test('should allow reflection under monthly limit', () => {
        const user = createMockUser({
          tier: 'pro',
          reflectionCountThisMonth: 15,
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(true);
      });

      test('should deny when at monthly limit (30)', () => {
        const user = createMockUser({
          tier: 'pro',
          reflectionCountThisMonth: 30,
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(false);
        expect(result.reason).toBe('monthly_limit');
      });
    });

    describe('daily limit', () => {
      test('should allow first reflection of the day', () => {
        const user = createMockUser({
          tier: 'pro',
          reflectionCountThisMonth: 5,
          reflectionsToday: 0,
          lastReflectionDate: '2024-06-14', // Yesterday
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(true);
      });

      test('should allow reflection when last reflection was on different day', () => {
        const user = createMockUser({
          tier: 'pro',
          reflectionCountThisMonth: 5,
          reflectionsToday: 5, // Count from previous tracking
          lastReflectionDate: '2024-06-10', // Different day
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(true);
      });

      test('should deny second reflection today (pro daily limit is 1)', () => {
        const user = createMockUser({
          tier: 'pro',
          reflectionCountThisMonth: 5,
          reflectionsToday: 1,
          lastReflectionDate: '2024-06-15', // Today (same as mocked date)
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(false);
        expect(result.reason).toBe('daily_limit');
        expect(result.resetTime).toBeInstanceOf(Date);
      });

      test('should return reset time set to next midnight', () => {
        const user = createMockUser({
          tier: 'pro',
          reflectionCountThisMonth: 5,
          reflectionsToday: 1,
          lastReflectionDate: '2024-06-15',
        });

        const result = checkReflectionLimits(user);

        expect(result.resetTime).toBeDefined();
        // Reset time should be June 16, 2024 at 00:00:00
        const resetTime = result.resetTime!;
        expect(resetTime.getFullYear()).toBe(2024);
        expect(resetTime.getMonth()).toBe(5); // June (0-indexed)
        expect(resetTime.getDate()).toBe(16);
        expect(resetTime.getHours()).toBe(0);
        expect(resetTime.getMinutes()).toBe(0);
        expect(resetTime.getSeconds()).toBe(0);
      });
    });

    describe('edge cases', () => {
      test('should check monthly limit before daily limit', () => {
        const user = createMockUser({
          tier: 'pro',
          reflectionCountThisMonth: 30, // At monthly limit
          reflectionsToday: 0, // Under daily limit
          lastReflectionDate: '2024-06-14',
        });

        const result = checkReflectionLimits(user);

        // Monthly limit should be checked first
        expect(result.canCreate).toBe(false);
        expect(result.reason).toBe('monthly_limit');
      });

      test('should allow when today count is 0 but last date is today', () => {
        const user = createMockUser({
          tier: 'pro',
          reflectionCountThisMonth: 5,
          reflectionsToday: 0,
          lastReflectionDate: '2024-06-15', // Today
        });

        const result = checkReflectionLimits(user);

        // Under daily limit (0 < 1)
        expect(result.canCreate).toBe(true);
      });
    });
  });

  // ==================================================
  // Unlimited Tier Tests
  // ==================================================

  describe('unlimited tier', () => {
    describe('monthly limit', () => {
      test('should allow reflection under monthly limit', () => {
        const user = createMockUser({
          tier: 'unlimited',
          reflectionCountThisMonth: 30,
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(true);
      });

      test('should deny when at monthly limit (60)', () => {
        const user = createMockUser({
          tier: 'unlimited',
          reflectionCountThisMonth: 60,
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(false);
        expect(result.reason).toBe('monthly_limit');
      });
    });

    describe('daily limit', () => {
      test('should allow first reflection of the day', () => {
        const user = createMockUser({
          tier: 'unlimited',
          reflectionCountThisMonth: 10,
          reflectionsToday: 0,
          lastReflectionDate: '2024-06-14',
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(true);
      });

      test('should allow second reflection today (unlimited daily limit is 2)', () => {
        const user = createMockUser({
          tier: 'unlimited',
          reflectionCountThisMonth: 10,
          reflectionsToday: 1,
          lastReflectionDate: '2024-06-15',
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(true);
      });

      test('should deny third reflection today (at daily limit)', () => {
        const user = createMockUser({
          tier: 'unlimited',
          reflectionCountThisMonth: 10,
          reflectionsToday: 2,
          lastReflectionDate: '2024-06-15',
        });

        const result = checkReflectionLimits(user);

        expect(result.canCreate).toBe(false);
        expect(result.reason).toBe('daily_limit');
        expect(result.resetTime).toBeInstanceOf(Date);
      });
    });
  });

  // ==================================================
  // Date Boundary Tests
  // ==================================================

  describe('date boundary handling', () => {
    test('should handle null lastReflectionDate (new user)', () => {
      const user = createMockUser({
        tier: 'pro',
        reflectionCountThisMonth: 0,
        reflectionsToday: 0,
        lastReflectionDate: null,
      });

      const result = checkReflectionLimits(user);

      expect(result.canCreate).toBe(true);
    });

    test('should handle day change at midnight', () => {
      // Set time to just after midnight on June 16
      vi.setSystemTime(new Date('2024-06-16T00:00:01Z'));

      const user = createMockUser({
        tier: 'pro',
        reflectionCountThisMonth: 5,
        reflectionsToday: 1, // Had 1 reflection "yesterday"
        lastReflectionDate: '2024-06-15', // Yesterday
      });

      const result = checkReflectionLimits(user);

      // New day, so daily limit resets
      expect(result.canCreate).toBe(true);
    });

    test('should handle end of month correctly', () => {
      vi.setSystemTime(new Date('2024-06-30T23:59:59Z'));

      const user = createMockUser({
        tier: 'pro',
        reflectionCountThisMonth: 29,
        reflectionsToday: 0,
        lastReflectionDate: '2024-06-29',
      });

      const result = checkReflectionLimits(user);

      expect(result.canCreate).toBe(true);
    });
  });

  // ==================================================
  // Edge Cases
  // ==================================================

  describe('edge cases', () => {
    test('should handle reflectionsToday being undefined-like (0)', () => {
      const user = createMockUser({
        tier: 'pro',
        reflectionCountThisMonth: 5,
        reflectionsToday: 0,
        lastReflectionDate: '2024-06-15',
      });

      const result = checkReflectionLimits(user);

      expect(result.canCreate).toBe(true);
    });

    test('should handle high reflection counts', () => {
      const user = createMockUser({
        tier: 'unlimited',
        reflectionCountThisMonth: 59, // Just under limit
        reflectionsToday: 1,
        lastReflectionDate: '2024-06-15',
      });

      const result = checkReflectionLimits(user);

      expect(result.canCreate).toBe(true);
    });

    test('should handle exact monthly limit boundary', () => {
      const user = createMockUser({
        tier: 'pro',
        reflectionCountThisMonth: 29, // One under limit
        reflectionsToday: 0,
        lastReflectionDate: '2024-06-14',
      });

      const result = checkReflectionLimits(user);

      expect(result.canCreate).toBe(true);
    });

    test('should handle exact daily limit boundary', () => {
      const user = createMockUser({
        tier: 'unlimited',
        reflectionCountThisMonth: 10,
        reflectionsToday: 1, // One under limit
        lastReflectionDate: '2024-06-15',
      });

      const result = checkReflectionLimits(user);

      expect(result.canCreate).toBe(true);
    });
  });
});
