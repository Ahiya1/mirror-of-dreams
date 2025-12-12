// server/trpc/__tests__/context.test.ts
// Tests for request context creation with JWT verification

import jwt from 'jsonwebtoken';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/server/lib/cookies', () => ({
  getAuthCookie: vi.fn(),
}));

vi.mock('@/server/lib/logger', () => ({
  authLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/server/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/types', () => ({
  userRowToUser: vi.fn((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    tier: row.tier,
    reflectionCountThisMonth: row.reflection_count_this_month,
    currentMonthYear: row.current_month_year,
  })),
}));

// Get mocked modules
import { getAuthCookie } from '@/server/lib/cookies';
import { authLogger } from '@/server/lib/logger';
import { supabase } from '@/server/lib/supabase';

// Store original env
const originalEnv = process.env;

describe('createContext', () => {
  const mockRequest = {
    headers: {
      get: vi.fn(),
    },
  } as unknown as Request;

  const mockOpts = {
    req: mockRequest,
    resHeaders: new Headers(),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // =====================================================
  // NO TOKEN SCENARIOS
  // =====================================================

  describe('when no token is present', () => {
    it('should return null user when no cookie or header token', async () => {
      vi.mocked(getAuthCookie).mockResolvedValue(undefined);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
      expect(context.req).toBe(mockRequest);
    });

    it('should return null user when cookie is empty string', async () => {
      vi.mocked(getAuthCookie).mockResolvedValue('');
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
    });
  });

  // =====================================================
  // COOKIE TOKEN SCENARIOS
  // =====================================================

  describe('when token is in cookie', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      tier: 'free',
      reflection_count_this_month: 5,
      current_month_year: new Date().toISOString().slice(0, 7),
    };

    it('should prefer cookie token over header token', async () => {
      const cookieToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(cookieToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue('Bearer different-token');

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).not.toBeNull();
      expect(context.user?.id).toBe('user-123');
    });

    it('should return user when valid cookie token', async () => {
      const validToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(validToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).not.toBeNull();
      expect(context.user?.email).toBe('test@example.com');
    });
  });

  // =====================================================
  // HEADER TOKEN SCENARIOS
  // =====================================================

  describe('when token is in Authorization header', () => {
    const mockUser = {
      id: 'user-456',
      email: 'header@example.com',
      name: 'Header User',
      tier: 'pro',
      reflection_count_this_month: 10,
      current_month_year: new Date().toISOString().slice(0, 7),
    };

    it('should use header token when no cookie present', async () => {
      const headerToken = jwt.sign(
        { userId: 'user-456', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(undefined);
      vi.mocked(mockRequest.headers.get).mockReturnValue(`Bearer ${headerToken}`);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).not.toBeNull();
      expect(context.user?.id).toBe('user-456');
    });

    it('should strip Bearer prefix from header', async () => {
      const token = jwt.sign(
        { userId: 'user-456', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(undefined);
      vi.mocked(mockRequest.headers.get).mockReturnValue(`Bearer ${token}`);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const { createContext } = await import('../context');
      await createContext(mockOpts as any);

      // Verify supabase was called with correct user ID
      expect(mockFrom).toHaveBeenCalledWith('users');
    });
  });

  // =====================================================
  // EXPIRED TOKEN SCENARIOS
  // =====================================================

  describe('when token is expired', () => {
    it('should return null user for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) - 3600 }, // Expired 1 hour ago
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(expiredToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
    });

    it('should log warning for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) - 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(expiredToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      await createContext(mockOpts as any);

      expect(authLogger.warn).toHaveBeenCalled();
    });
  });

  // =====================================================
  // INVALID TOKEN SCENARIOS
  // =====================================================

  describe('when token is invalid', () => {
    it('should return null user for malformed token', async () => {
      vi.mocked(getAuthCookie).mockResolvedValue('invalid-token-string');
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
    });

    it('should return null user for token with wrong secret', async () => {
      const tokenWithWrongSecret = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        'wrong-secret-key'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(tokenWithWrongSecret);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
    });

    it('should log warning for invalid token', async () => {
      vi.mocked(getAuthCookie).mockResolvedValue('invalid-token');
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      await createContext(mockOpts as any);

      expect(authLogger.warn).toHaveBeenCalled();
    });
  });

  // =====================================================
  // DATABASE ERROR SCENARIOS
  // =====================================================

  describe('when database query fails', () => {
    it('should return null user on database error', async () => {
      const validToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(validToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
    });

    it('should log error on database failure', async () => {
      const validToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(validToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection timeout' },
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const { createContext } = await import('../context');
      await createContext(mockOpts as any);

      expect(authLogger.error).toHaveBeenCalled();
    });

    it('should return null user when user not found in database', async () => {
      const validToken = jwt.sign(
        { userId: 'nonexistent-user', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(validToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
    });
  });

  // =====================================================
  // MONTHLY RESET SCENARIOS
  // =====================================================

  describe('monthly usage reset', () => {
    it('should reset monthly counters when month changes', async () => {
      const validToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      const oldMonth = '2025-01';
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Only test if we're not in January 2025
      if (oldMonth !== currentMonth) {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          tier: 'free',
          reflection_count_this_month: 15,
          current_month_year: oldMonth,
        };

        vi.mocked(getAuthCookie).mockResolvedValue(validToken);
        vi.mocked(mockRequest.headers.get).mockReturnValue(null);

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        });

        const mockFrom = vi.fn().mockImplementation((table) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
                }),
              }),
              update: mockUpdate,
            };
          }
          return {};
        });

        vi.mocked(supabase.from).mockImplementation(mockFrom);

        const { createContext } = await import('../context');
        const context = await createContext(mockOpts as any);

        // The user's reflection count should be reset to 0
        expect(context.user?.reflectionCountThisMonth).toBe(0);
      }
    });

    it('should not reset counters when month is current', async () => {
      const validToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      const currentMonth = new Date().toISOString().slice(0, 7);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tier: 'free',
        reflection_count_this_month: 5,
        current_month_year: currentMonth,
      };

      vi.mocked(getAuthCookie).mockResolvedValue(validToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user?.reflectionCountThisMonth).toBe(5);
    });
  });

  // =====================================================
  // CONTEXT SHAPE TESTS
  // =====================================================

  describe('context shape', () => {
    it('should always include req property', async () => {
      vi.mocked(getAuthCookie).mockResolvedValue(undefined);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.req).toBeDefined();
      expect(context.req).toBe(mockRequest);
    });

    it('should always include user property (even if null)', async () => {
      vi.mocked(getAuthCookie).mockResolvedValue(undefined);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect('user' in context).toBe(true);
    });
  });

  // =====================================================
  // JWT ERROR TYPE HANDLING
  // =====================================================

  describe('JWT error type handling', () => {
    it('should handle TokenExpiredError', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) - 1 },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(expiredToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
      expect(authLogger.warn).toHaveBeenCalled();
    });

    it('should handle JsonWebTokenError', async () => {
      vi.mocked(getAuthCookie).mockResolvedValue('not.a.valid.jwt');
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
      expect(authLogger.warn).toHaveBeenCalled();
    });

    it('should handle NotBeforeError', async () => {
      // Create a token that is not yet valid (nbf claim is in the future)
      const notYetValidToken = jwt.sign(
        {
          userId: 'user-123',
          exp: Math.floor(Date.now() / 1000) + 7200, // Expires in 2 hours
          nbf: Math.floor(Date.now() / 1000) + 3600, // Not valid until 1 hour from now
        },
        'test-jwt-secret-at-least-32-characters-long'
      );

      vi.mocked(getAuthCookie).mockResolvedValue(notYetValidToken);
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      expect(context.user).toBeNull();
      expect(authLogger.warn).toHaveBeenCalled();
    });

    it('should handle unexpected errors during verification', async () => {
      // Create a valid looking token but mock jwt.verify to throw an unexpected error
      vi.mocked(getAuthCookie).mockResolvedValue('some-token');
      vi.mocked(mockRequest.headers.get).mockReturnValue(null);

      // Temporarily mock jwt.verify to throw a non-JWT error
      const originalVerify = jwt.verify;
      (jwt as any).verify = () => {
        throw new Error('Unexpected database connection issue');
      };

      const { createContext } = await import('../context');
      const context = await createContext(mockOpts as any);

      // Restore original
      (jwt as any).verify = originalVerify;

      expect(context.user).toBeNull();
      expect(authLogger.error).toHaveBeenCalled();
    });
  });
});
