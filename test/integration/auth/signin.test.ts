// test/integration/auth/signin.test.ts - Auth signin integration tests
// Tests the signin flow including password verification, JWT generation, and cookie setting

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller } from '../setup';

import { createMockUserRow } from '@/test/fixtures/users';

describe('auth.signin', () => {
  const validInput = {
    email: 'test@example.com',
    password: 'TestPass123!',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should sign in with valid credentials', async () => {
      const { caller, supabase, cookies } = createTestCaller(null);

      const hashedPassword = await bcrypt.hash(validInput.password, 10);
      const userRow = createMockUserRow({
        email: validInput.email,
        password_hash: hashedPassword,
        tier: 'free',
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch user for signin
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: userRow,
                error: null,
              }),
            };
          } else {
            // Second call: update last_sign_in_at
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signin(validInput);

      expect(result.user.email).toBe(validInput.email);
      expect(result.token).toBeDefined();
      expect(result.message).toBe('Signed in successfully');
      expect(cookies.setAuthCookie).toHaveBeenCalled();
    });

    it('should generate a valid JWT token with correct payload', async () => {
      const { caller, supabase } = createTestCaller(null);

      const hashedPassword = await bcrypt.hash(validInput.password, 10);
      const userRow = createMockUserRow({
        id: 'user-id-456',
        email: validInput.email,
        password_hash: hashedPassword,
        tier: 'pro',
        is_creator: true,
        is_admin: false,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: userRow,
                error: null,
              }),
            };
          } else {
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signin(validInput);

      const decoded = jwt.decode(result.token) as any;
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('user-id-456');
      expect(decoded.email).toBe(validInput.email);
      expect(decoded.tier).toBe('pro');
      expect(decoded.isCreator).toBe(true);
      expect(decoded.isAdmin).toBe(false);
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('should update last_sign_in_at on successful login', async () => {
      const { caller, supabase } = createTestCaller(null);

      const hashedPassword = await bcrypt.hash(validInput.password, 10);
      const userRow = createMockUserRow({
        email: validInput.email,
        password_hash: hashedPassword,
      });

      const updateMock = vi.fn().mockReturnThis();
      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: userRow,
                error: null,
              }),
            };
          } else {
            return {
              update: updateMock,
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await caller.auth.signin(validInput);

      expect(updateMock).toHaveBeenCalled();
    });

    it('should reset monthly counters if new month', async () => {
      const { caller, supabase } = createTestCaller(null);

      const hashedPassword = await bcrypt.hash(validInput.password, 10);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthYear = lastMonth.toISOString().slice(0, 7);

      const userRow = createMockUserRow({
        email: validInput.email,
        password_hash: hashedPassword,
        current_month_year: lastMonthYear,
        reflection_count_this_month: 5,
      });

      const updateMock = vi.fn().mockReturnThis();
      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: userRow,
                error: null,
              }),
            };
          } else {
            return {
              update: updateMock,
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signin(validInput);

      // Monthly counter should be reset in the returned user
      expect(result.user.reflectionCountThisMonth).toBe(0);
    });

    it('should handle case-insensitive email login', async () => {
      const { caller, supabase, cookies } = createTestCaller(null);

      const hashedPassword = await bcrypt.hash(validInput.password, 10);
      const userRow = createMockUserRow({
        email: validInput.email.toLowerCase(),
        password_hash: hashedPassword,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: userRow,
                error: null,
              }),
            };
          } else {
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signin({
        email: 'TEST@EXAMPLE.COM',
        password: validInput.password,
      });

      expect(result.user.email).toBe(validInput.email.toLowerCase());
      expect(cookies.setAuthCookie).toHaveBeenCalled();
    });
  });

  describe('error cases', () => {
    it('should reject non-existent email', async () => {
      const { caller, supabase } = createTestCaller(null);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await expect(caller.auth.signin(validInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    });

    it('should reject invalid password', async () => {
      const { caller, supabase } = createTestCaller(null);

      const hashedPassword = await bcrypt.hash('DifferentPassword', 10);
      const userRow = createMockUserRow({
        email: validInput.email,
        password_hash: hashedPassword,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: userRow,
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await expect(caller.auth.signin(validInput)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    });

    it('should validate email format', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.auth.signin({ email: 'invalid-email', password: 'password123' })
      ).rejects.toThrow();
    });

    it('should not reveal whether email exists in error message', async () => {
      const { caller, supabase } = createTestCaller(null);

      // Test with non-existent user
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      try {
        await caller.auth.signin({ email: 'nonexistent@example.com', password: 'password' });
      } catch (error: any) {
        // Error message should be generic
        expect(error.message).toBe('Invalid email or password');
        expect(error.message).not.toContain('not found');
        expect(error.message).not.toContain('does not exist');
      }
    });
  });
});
