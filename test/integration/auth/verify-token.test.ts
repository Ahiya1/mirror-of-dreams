// test/integration/auth/verify-token.test.ts - Auth verifyToken procedure tests
// Tests the verifyToken flow for validating JWT tokens

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { proTierUser, freeTierUser, demoUser } from '@/test/fixtures/users';

describe('auth.verifyToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-VT-01: should return user data for valid token (authenticated user)', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.auth.verifyToken();

      expect(result.user).toEqual(proTierUser);
      expect(result.message).toBe('Token valid');
    });

    it('TC-VT-02: should return user data for free tier user', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.auth.verifyToken();

      expect(result.user).toEqual(freeTierUser);
      expect(result.message).toBe('Token valid');
    });

    it('TC-VT-03: should return user data for demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      const result = await caller.auth.verifyToken();

      expect(result.user).toEqual(demoUser);
      expect(result.message).toBe('Token valid');
    });
  });

  describe('error cases', () => {
    it('TC-VT-04: should throw UNAUTHORIZED when no user in context (invalid token)', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.verifyToken()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    });

    it('TC-VT-05: should throw UNAUTHORIZED when user context is undefined', async () => {
      // createTestCaller with null simulates an invalid/expired token
      const { caller } = createTestCaller(null);

      try {
        await caller.auth.verifyToken();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Invalid or expired token');
      }
    });
  });
});
