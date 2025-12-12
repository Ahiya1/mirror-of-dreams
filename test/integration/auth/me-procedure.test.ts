// test/integration/auth/me-procedure.test.ts - Auth me procedure tests
// Tests the me flow for retrieving current authenticated user

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import {
  proTierUser,
  freeTierUser,
  demoUser,
  adminUser,
  creatorUser,
  createMockUser,
} from '@/test/fixtures/users';

describe('auth.me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-ME-01: should return current user for authenticated pro user', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.auth.me();

      expect(result).toEqual(proTierUser);
    });

    it('TC-ME-02: should return current user for free tier user', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.me();

      expect(result).toEqual(freeTierUser);
    });

    it('TC-ME-03: should return current user for demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      const result = await caller.auth.me();

      expect(result).toEqual(demoUser);
    });

    it('TC-ME-04: should return current user for admin user', async () => {
      const { caller } = createTestCaller(adminUser);

      const result = await caller.auth.me();

      expect(result).toEqual(adminUser);
      expect(result.isAdmin).toBe(true);
    });

    it('TC-ME-05: should return current user for creator user', async () => {
      const { caller } = createTestCaller(creatorUser);

      const result = await caller.auth.me();

      expect(result).toEqual(creatorUser);
      expect(result.isCreator).toBe(true);
    });

    it('TC-ME-06: should include all user properties', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.auth.me();

      // Verify essential user properties are present
      expect(result.id).toBe(proTierUser.id);
      expect(result.email).toBe(proTierUser.email);
      expect(result.name).toBe(proTierUser.name);
      expect(result.tier).toBe(proTierUser.tier);
      expect(result.subscriptionStatus).toBe(proTierUser.subscriptionStatus);
      expect(result.reflectionCountThisMonth).toBe(proTierUser.reflectionCountThisMonth);
      expect(result.totalReflections).toBe(proTierUser.totalReflections);
      expect(result.language).toBe(proTierUser.language);
      expect(result.preferences).toEqual(proTierUser.preferences);
    });
  });

  describe('authorization', () => {
    it('TC-ME-07: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.me()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('session handling', () => {
    it('TC-ME-08: should handle user with different month year (potential session refresh)', async () => {
      // Simulate user logged in from previous month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthYear = lastMonth.toISOString().slice(0, 7);

      const userFromLastMonth = createMockUser({
        ...proTierUser,
        id: 'user-last-month',
        currentMonthYear: lastMonthYear,
        reflectionCountThisMonth: 5,
      });

      const { caller } = createTestCaller(userFromLastMonth);

      const result = await caller.auth.me();

      // me procedure returns user as-is from context
      // (monthly reset happens in signin, not me)
      expect(result.currentMonthYear).toBe(lastMonthYear);
      expect(result.reflectionCountThisMonth).toBe(5);
    });

    it('TC-ME-09: should return user with current month reflections', async () => {
      const currentMonthYear = new Date().toISOString().slice(0, 7);
      const userWithCurrentMonth = createMockUser({
        ...proTierUser,
        id: 'user-current-month',
        currentMonthYear,
        reflectionCountThisMonth: 10,
      });

      const { caller } = createTestCaller(userWithCurrentMonth);

      const result = await caller.auth.me();

      expect(result.currentMonthYear).toBe(currentMonthYear);
      expect(result.reflectionCountThisMonth).toBe(10);
    });
  });
});
