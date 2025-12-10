// test/integration/auth/password-reset.test.ts - Password change integration tests
// Tests the changePassword flow for authenticated users

import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock } from '../setup';

import { proTierUser, createMockUserRow } from '@/test/fixtures/users';

// =============================================================================
// CONSTANTS
// =============================================================================

const CURRENT_PASSWORD = 'CurrentPass123!';
const NEW_PASSWORD = 'NewSecurePass456!';

// =============================================================================
// TESTS: auth.changePassword
// =============================================================================

describe('auth.changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('success cases', () => {
    it('TC-AR-01: should change password with valid current password', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch user with password hash
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
            });
          } else {
            // Second call: update password
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.changePassword({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      expect(result.message).toBe('Password changed successfully');
    });

    it('TC-AR-02: should hash the new password before storing', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      const updateMock = vi.fn().mockReturnThis();
      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
            });
          } else {
            return createPartialMock({
              update: updateMock,
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await caller.auth.changePassword({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      // Verify update was called with hashed password
      expect(updateMock).toHaveBeenCalled();
      const updateCall = updateMock.mock.calls[0][0];
      expect(updateCall.password_hash).toBeDefined();
      // New password hash should be different from original
      expect(updateCall.password_hash).not.toBe(hashedCurrentPassword);
      // Should start with bcrypt prefix
      expect(updateCall.password_hash).toMatch(/^\$2[aby]\$/);
    });

    it('TC-AR-03: should update the updated_at timestamp', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      const updateMock = vi.fn().mockReturnThis();
      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
            });
          } else {
            return createPartialMock({
              update: updateMock,
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await caller.auth.changePassword({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      expect(updateMock).toHaveBeenCalled();
      const updateCall = updateMock.mock.calls[0][0];
      expect(updateCall.updated_at).toBeDefined();
    });
  });

  // ===========================================================================
  // AUTHORIZATION
  // ===========================================================================

  describe('authorization', () => {
    it('TC-AR-04: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.auth.changePassword({
          currentPassword: CURRENT_PASSWORD,
          newPassword: NEW_PASSWORD,
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('validation', () => {
    it('TC-AR-05: should reject incorrect current password', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(
        caller.auth.changePassword({
          currentPassword: 'WrongPassword123!',
          newPassword: NEW_PASSWORD,
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Current password is incorrect',
      });
    });

    it('TC-AR-06: should reject same password as new password', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(
        caller.auth.changePassword({
          currentPassword: CURRENT_PASSWORD,
          newPassword: CURRENT_PASSWORD, // Same as current
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'New password must be different from current password',
      });
    });

    it('TC-AR-07: should validate new password minimum length', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      // New password too short (less than 6 characters)
      await expect(
        caller.auth.changePassword({
          currentPassword: CURRENT_PASSWORD,
          newPassword: '12345',
        })
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('TC-AR-08: should handle user not found in database', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(
        caller.auth.changePassword({
          currentPassword: CURRENT_PASSWORD,
          newPassword: NEW_PASSWORD,
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });

    it('TC-AR-09: should handle database update error', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
            });
          } else {
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database update failed'),
              }),
            });
          }
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(
        caller.auth.changePassword({
          currentPassword: CURRENT_PASSWORD,
          newPassword: NEW_PASSWORD,
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to change password',
      });
    });
  });

  // ===========================================================================
  // SECURITY EDGE CASES
  // ===========================================================================

  describe('security edge cases', () => {
    it('TC-AR-10: should not expose password hash in error messages', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      try {
        await caller.auth.changePassword({
          currentPassword: 'WrongPassword123!',
          newPassword: NEW_PASSWORD,
        });
      } catch (error: any) {
        // Error message should not contain hash
        expect(error.message).not.toContain('$2');
        expect(error.message).not.toContain(hashedCurrentPassword);
        // Should be generic error message
        expect(error.message).toBe('Current password is incorrect');
      }
    });

    it('TC-AR-11: should use strong hashing (bcrypt cost factor 12)', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedCurrentPassword = await bcrypt.hash(CURRENT_PASSWORD, 10);
      const userRow = createMockUserRow({
        id: proTierUser.id,
        password_hash: hashedCurrentPassword,
      });

      const updateMock = vi.fn().mockReturnThis();
      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
            });
          } else {
            return createPartialMock({
              update: updateMock,
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await caller.auth.changePassword({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      const updateCall = updateMock.mock.calls[0][0];
      // bcrypt hash should use cost factor 12 (router uses bcrypt.hash(password, 12))
      // This is indicated by "$2b$12$" prefix
      expect(updateCall.password_hash).toMatch(/^\$2[aby]\$12\$/);
    });
  });
});
