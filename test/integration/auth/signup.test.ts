// test/integration/auth/signup.test.ts - Auth signup integration tests
// Tests the signup flow including user creation, JWT generation, and cookie setting

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock } from '../setup';

import { createMockUserRow } from '@/test/fixtures/users';

describe('auth.signup', () => {
  const validInput = {
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    name: 'New User',
    language: 'en' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('should create a new user with valid credentials', async () => {
      const { caller, supabase, cookies } = createTestCaller(null);

      const newUserRow = createMockUserRow({
        email: validInput.email.toLowerCase(),
        name: validInput.name,
        language: validInput.language,
        tier: 'free',
        subscription_status: 'active',
        is_demo: false,
        is_admin: false,
        is_creator: false,
        email_verified: false,
      });

      // Mock sequence: first check for existing user (not found), then insert succeeds
      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            // First call: check for existing user - return not found
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          } else {
            // Second call: insert new user
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: newUserRow,
                error: null,
              }),
            };
          }
        }
        // Email verification token insert
        if (table === 'email_verification_tokens') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signup(validInput);

      expect(result.user.email).toBe(validInput.email.toLowerCase());
      expect(result.user.name).toBe(validInput.name);
      expect(result.user.tier).toBe('free');
      expect(result.token).toBeDefined();
      expect(result.message).toBe('Account created successfully');
      expect(cookies.setAuthCookie).toHaveBeenCalled();
    });

    it('should generate a valid JWT token', async () => {
      const { caller, supabase } = createTestCaller(null);

      const newUserRow = createMockUserRow({
        id: 'new-user-id-123',
        email: validInput.email.toLowerCase(),
        name: validInput.name,
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
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          } else {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: newUserRow,
                error: null,
              }),
            };
          }
        }
        if (table === 'email_verification_tokens') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signup(validInput);

      // Verify JWT structure
      const decoded = jwt.decode(result.token) as any;
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('new-user-id-123');
      expect(decoded.email).toBe(validInput.email.toLowerCase());
      expect(decoded.tier).toBe('free');
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('should set HTTP-only auth cookie', async () => {
      const { caller, supabase, cookies } = createTestCaller(null);

      const newUserRow = createMockUserRow({
        email: validInput.email.toLowerCase(),
        name: validInput.name,
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
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          } else {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: newUserRow,
                error: null,
              }),
            };
          }
        }
        if (table === 'email_verification_tokens') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signup(validInput);

      // setAuthCookie is called with token only (not isDemo flag for regular signup)
      expect(cookies.setAuthCookie).toHaveBeenCalled();
      expect(cookies.setAuthCookie.mock.calls[0][0]).toBe(result.token);
    });

    it('should convert email to lowercase', async () => {
      const { caller, supabase, cookies } = createTestCaller(null);

      const upperCaseEmail = 'NewUser@Example.COM';
      const newUserRow = createMockUserRow({
        email: upperCaseEmail.toLowerCase(),
        name: validInput.name,
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
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          } else {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: newUserRow,
                error: null,
              }),
            };
          }
        }
        if (table === 'email_verification_tokens') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signup({
        ...validInput,
        email: upperCaseEmail,
      });

      expect(result.user.email).toBe(upperCaseEmail.toLowerCase());
    });

    it('should set new users as unverified by default', async () => {
      const { caller, supabase } = createTestCaller(null);

      const newUserRow = createMockUserRow({
        email: validInput.email.toLowerCase(),
        name: validInput.name,
        email_verified: false,
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
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          } else {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: newUserRow,
                error: null,
              }),
            };
          }
        }
        if (table === 'email_verification_tokens') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const result = await caller.auth.signup(validInput);

      expect(result.user.emailVerified).toBe(false);
    });
  });

  describe('error cases', () => {
    it('should reject duplicate email addresses', async () => {
      const { caller, supabase } = createTestCaller(null);

      // Mock existing user found
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-user' },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await expect(caller.auth.signup(validInput)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('already exists'),
      });
    });

    it('should validate email format', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.signup({ ...validInput, email: 'invalid-email' })).rejects.toThrow();
    });

    it('should require minimum password length of 6 characters', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.signup({ ...validInput, password: '12345' })).rejects.toThrow();
    });

    it('should require a name', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.auth.signup({ ...validInput, name: '' })).rejects.toThrow();
    });

    it('should handle database insert errors', async () => {
      const { caller, supabase } = createTestCaller(null);

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          } else {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
              }),
            };
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await expect(caller.auth.signup(validInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
      });
    });
  });
});
