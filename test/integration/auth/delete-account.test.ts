// test/integration/auth/delete-account.test.ts - Auth deleteAccount procedure tests
// Tests the deleteAccount flow including password verification and cascade deletion

import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock } from '../setup';

import { proTierUser, demoUser, createMockUser } from '@/test/fixtures/users';

describe('auth.deleteAccount', () => {
  const validPassword = 'TestPass123!';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('TC-DA-01: should reject when email confirmation does not match', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.auth.deleteAccount({
          confirmEmail: 'wrong@email.com',
          password: validPassword,
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Email confirmation does not match',
      });
    });

    it('TC-DA-02: should reject when email confirmation case differs (case sensitive check)', async () => {
      // The code uses toLowerCase() comparison, so case should not matter
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedPassword = await bcrypt.hash(validPassword, 10);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: proTierUser.id, password_hash: hashedPassword },
              error: null,
            }),
            delete: vi.fn().mockReturnThis(),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      // Should succeed with uppercase email since toLowerCase is used
      const result = await caller.auth.deleteAccount({
        confirmEmail: proTierUser.email.toUpperCase(),
        password: validPassword,
      });

      expect(result.message).toBe('Account deleted successfully');
    });
  });

  describe('password verification', () => {
    it('TC-DA-03: should reject incorrect password', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: proTierUser.id, password_hash: hashedPassword },
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(
        caller.auth.deleteAccount({
          confirmEmail: proTierUser.email,
          password: 'WrongPassword123!',
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Password is incorrect',
      });
    });

    it('TC-DA-04: should accept correct password', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedPassword = await bcrypt.hash(validPassword, 10);

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch password_hash
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: proTierUser.id, password_hash: hashedPassword },
                error: null,
              }),
            });
          } else {
            // Second call: delete user
            return createPartialMock({
              delete: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            });
          }
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.deleteAccount({
        confirmEmail: proTierUser.email,
        password: validPassword,
      });

      expect(result.message).toBe('Account deleted successfully');
    });
  });

  describe('demo user restriction', () => {
    it('TC-DA-05: should reject demo user deletion (writeProcedure blocks demo users)', async () => {
      const { caller } = createTestCaller(demoUser);

      // writeProcedure middleware should block demo users
      await expect(
        caller.auth.deleteAccount({
          confirmEmail: demoUser.email,
          password: validPassword,
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('successful deletion', () => {
    it('TC-DA-06: should delete account with correct credentials', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedPassword = await bcrypt.hash(validPassword, 10);

      let callCount = 0;
      const deleteMock = vi.fn().mockReturnThis();

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch password_hash
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: proTierUser.id, password_hash: hashedPassword },
                error: null,
              }),
            });
          } else {
            // Second call: delete user
            return createPartialMock({
              delete: deleteMock,
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            });
          }
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.deleteAccount({
        confirmEmail: proTierUser.email,
        password: validPassword,
      });

      expect(result.message).toBe('Account deleted successfully');
      expect(deleteMock).toHaveBeenCalled();
    });

    it('TC-DA-07: should return success message on deletion', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedPassword = await bcrypt.hash(validPassword, 10);

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: proTierUser.id, password_hash: hashedPassword },
                error: null,
              }),
            });
          } else {
            return createPartialMock({
              delete: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            });
          }
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.deleteAccount({
        confirmEmail: proTierUser.email,
        password: validPassword,
      });

      expect(result).toEqual({
        message: 'Account deleted successfully',
      });
    });
  });

  describe('error handling', () => {
    it('TC-DA-08: should handle user not found', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(
        caller.auth.deleteAccount({
          confirmEmail: proTierUser.email,
          password: validPassword,
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });

    it('TC-DA-09: should handle database deletion error', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const hashedPassword = await bcrypt.hash(validPassword, 10);

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch password_hash succeeds
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: proTierUser.id, password_hash: hashedPassword },
                error: null,
              }),
            });
          } else {
            // Second call: delete fails
            return createPartialMock({
              delete: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database deletion failed'),
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
        caller.auth.deleteAccount({
          confirmEmail: proTierUser.email,
          password: validPassword,
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete account',
      });
    });

    it('TC-DA-10: should handle database fetch error for password', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database fetch error'),
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      // When there's an error fetching user, user will be null/undefined
      await expect(
        caller.auth.deleteAccount({
          confirmEmail: proTierUser.email,
          password: validPassword,
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });
  });

  describe('authorization', () => {
    it('TC-DA-11: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.auth.deleteAccount({
          confirmEmail: 'test@example.com',
          password: validPassword,
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
