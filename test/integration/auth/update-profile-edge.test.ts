// test/integration/auth/update-profile-edge.test.ts - Auth updateProfile edge case tests
// Tests error handling and edge cases for updateProfile procedure

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock } from '../setup';

import { proTierUser, freeTierUser, demoUser, createMockUserRow } from '@/test/fixtures/users';

describe('auth.updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('TC-UP-01: should update user name successfully', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const updatedUserRow = createMockUserRow({
        ...proTierUser,
        name: 'Updated Name',
        updated_at: new Date().toISOString(),
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ name: 'Updated Name' });

      expect(result.user.name).toBe('Updated Name');
      expect(result.message).toBe('Profile updated successfully');
    });

    it('TC-UP-02: should update user language successfully', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const updatedUserRow = createMockUserRow({
        ...proTierUser,
        language: 'he',
        updated_at: new Date().toISOString(),
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ language: 'he' });

      expect(result.user.language).toBe('he');
      expect(result.message).toBe('Profile updated successfully');
    });

    it('TC-UP-03: should update both name and language', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const updatedUserRow = createMockUserRow({
        ...proTierUser,
        name: 'New Name',
        language: 'he',
        updated_at: new Date().toISOString(),
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({
        name: 'New Name',
        language: 'he',
      });

      expect(result.user.name).toBe('New Name');
      expect(result.user.language).toBe('he');
    });
  });

  describe('validation errors', () => {
    it('TC-UP-04: should reject empty name', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(caller.auth.updateProfile({ name: '' })).rejects.toThrow();
    });

    it('TC-UP-05: should reject invalid language', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(caller.auth.updateProfile({ language: 'invalid' as any })).rejects.toThrow();
    });

    it('TC-UP-06: should allow partial update (only name)', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const updatedUserRow = createMockUserRow({
        ...proTierUser,
        name: 'Only Name Updated',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ name: 'Only Name Updated' });

      expect(result.user.name).toBe('Only Name Updated');
      // Language should remain unchanged
      expect(result.user.language).toBe(proTierUser.language);
    });

    it('TC-UP-07: should allow partial update (only language)', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const updatedUserRow = createMockUserRow({
        ...proTierUser,
        language: 'he',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ language: 'he' });

      expect(result.user.language).toBe('he');
      // Name should remain unchanged
      expect(result.user.name).toBe(proTierUser.name);
    });
  });

  describe('error handling', () => {
    it('TC-UP-08: should throw INTERNAL_SERVER_ERROR on database error', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database connection failed'),
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.auth.updateProfile({ name: 'Test Name' })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    });

    it('TC-UP-09: should handle concurrent update scenario (database constraint)', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Row has been modified by another transaction'),
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.auth.updateProfile({ name: 'Concurrent Update' })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    });

    it('TC-UP-10: should handle timeout error', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Request timeout'),
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      await expect(caller.auth.updateProfile({ name: 'Timeout Test' })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    });
  });

  describe('authorization', () => {
    it('TC-UP-11: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.updateProfile({ name: 'Test' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('TC-UP-12: should allow free tier user to update profile', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      const updatedUserRow = createMockUserRow({
        ...freeTierUser,
        name: 'Free User Updated',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ name: 'Free User Updated' });

      expect(result.user.name).toBe('Free User Updated');
    });

    it('TC-UP-13: should allow demo user to update profile (protectedProcedure allows demo)', async () => {
      const { caller, supabase } = createTestCaller(demoUser);

      const updatedUserRow = createMockUserRow({
        ...demoUser,
        name: 'Demo User Updated',
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ name: 'Demo User Updated' });

      expect(result.user.name).toBe('Demo User Updated');
    });
  });

  describe('edge cases', () => {
    it('TC-UP-14: should handle very long name', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const longName = 'A'.repeat(200);
      const updatedUserRow = createMockUserRow({
        ...proTierUser,
        name: longName,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ name: longName });

      expect(result.user.name).toBe(longName);
    });

    it('TC-UP-15: should handle name with special characters', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const specialName = "John O'Brien-Smith Jr.";
      const updatedUserRow = createMockUserRow({
        ...proTierUser,
        name: specialName,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ name: specialName });

      expect(result.user.name).toBe(specialName);
    });

    it('TC-UP-16: should handle name with unicode characters', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      const unicodeName = 'Test User';
      const updatedUserRow = createMockUserRow({
        ...proTierUser,
        name: unicodeName,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.updateProfile({ name: unicodeName });

      expect(result.user.name).toBe(unicodeName);
    });
  });
});
