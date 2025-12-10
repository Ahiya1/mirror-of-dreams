// test/integration/auth/signout.test.ts - Auth signout integration tests
// Tests the signout flow including cookie clearing

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { freeTierUser, proTierUser, adminUser, demoUser } from '@/test/fixtures/users';

describe('auth.signout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should clear auth cookie on signout for authenticated user', async () => {
      const { caller, cookies } = createTestCaller(freeTierUser);

      const result = await caller.auth.signout();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Signed out successfully');
      expect(cookies.clearAuthCookie).toHaveBeenCalled();
    });

    it('should work for pro tier users', async () => {
      const { caller, cookies } = createTestCaller(proTierUser);

      const result = await caller.auth.signout();

      expect(result.success).toBe(true);
      expect(cookies.clearAuthCookie).toHaveBeenCalled();
    });

    it('should work for admin users', async () => {
      const { caller, cookies } = createTestCaller(adminUser);

      const result = await caller.auth.signout();

      expect(result.success).toBe(true);
      expect(cookies.clearAuthCookie).toHaveBeenCalled();
    });

    it('should work for demo users', async () => {
      const { caller, cookies } = createTestCaller(demoUser);

      const result = await caller.auth.signout();

      expect(result.success).toBe(true);
      expect(cookies.clearAuthCookie).toHaveBeenCalled();
    });

    it('should work even when not authenticated (no user in context)', async () => {
      const { caller, cookies } = createTestCaller(null);

      const result = await caller.auth.signout();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Signed out successfully');
      expect(cookies.clearAuthCookie).toHaveBeenCalled();
    });

    it('should call clearAuthCookie exactly once', async () => {
      const { caller, cookies } = createTestCaller(freeTierUser);

      await caller.auth.signout();

      expect(cookies.clearAuthCookie).toHaveBeenCalledTimes(1);
    });
  });

  describe('response structure', () => {
    it('should return expected response structure', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.signout();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('should always return success true', async () => {
      const { caller: caller1 } = createTestCaller(freeTierUser);
      const { caller: caller2 } = createTestCaller(null);

      const result1 = await caller1.auth.signout();
      const result2 = await caller2.auth.signout();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});
