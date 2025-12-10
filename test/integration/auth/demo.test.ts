// test/integration/auth/demo.test.ts - Demo account integration tests
// Tests demo login flow and demo user limitations

import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock } from '../setup';

import { createMockUserRow, demoUser } from '@/test/fixtures/users';

// =============================================================================
// TESTS: auth.loginDemo
// =============================================================================

describe('auth.loginDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('success cases', () => {
    it('TC-AD-01: should log in as demo user', async () => {
      const { caller, supabase, cookies } = createTestCaller(null);

      const demoUserRow = createMockUserRow({
        id: 'demo-user-001',
        email: 'demo@example.com',
        name: 'Demo User',
        tier: 'free',
        is_demo: true,
        email_verified: false,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: demoUserRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.loginDemo();

      expect(result.user.email).toBe('demo@example.com');
      expect(result.user.isDemo).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.message).toBe('Welcome to the demo!');
      expect(cookies.setAuthCookie).toHaveBeenCalled();
    });

    it('TC-AD-02: should set isDemo flag in JWT', async () => {
      const { caller, supabase } = createTestCaller(null);

      const demoUserRow = createMockUserRow({
        id: 'demo-user-001',
        email: 'demo@example.com',
        name: 'Demo User',
        tier: 'free',
        is_demo: true,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: demoUserRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.loginDemo();

      const decoded = jwt.decode(result.token) as any;
      expect(decoded).toBeDefined();
      expect(decoded.isDemo).toBe(true);
      expect(decoded.userId).toBe('demo-user-001');
    });

    it('TC-AD-03: should return demo user data', async () => {
      const { caller, supabase } = createTestCaller(null);

      const demoUserRow = createMockUserRow({
        id: 'demo-user-001',
        email: 'demo@example.com',
        name: 'Demo User',
        tier: 'free',
        is_demo: true,
        is_admin: false,
        is_creator: false,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: demoUserRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.loginDemo();

      expect(result.user.id).toBe('demo-user-001');
      expect(result.user.name).toBe('Demo User');
      expect(result.user.tier).toBe('free');
      expect(result.user.isAdmin).toBe(false);
      expect(result.user.isCreator).toBe(false);
    });

    it('TC-AD-04: should set demo cookie with isDemo flag', async () => {
      const { caller, supabase, cookies } = createTestCaller(null);

      const demoUserRow = createMockUserRow({
        id: 'demo-user-001',
        email: 'demo@example.com',
        is_demo: true,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: demoUserRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.loginDemo();

      // setAuthCookie is called with token and isDemo=true
      expect(cookies.setAuthCookie).toHaveBeenCalled();
      const callArgs = cookies.setAuthCookie.mock.calls[0];
      expect(callArgs[0]).toBe(result.token);
      expect(callArgs[1]).toBe(true); // isDemo flag
    });
  });

  // ===========================================================================
  // ERROR CASES
  // ===========================================================================

  describe('error cases', () => {
    it('TC-AD-05: should fail if demo user not found', async () => {
      const { caller, supabase } = createTestCaller(null);

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

      await expect(caller.auth.loginDemo()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Demo user not found. Please contact support.',
      });
    });

    it('TC-AD-06: should handle database error', async () => {
      const { caller, supabase } = createTestCaller(null);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
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

      await expect(caller.auth.loginDemo()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Demo user not found. Please contact support.',
      });
    });
  });

  // ===========================================================================
  // JWT EXPIRATION
  // ===========================================================================

  describe('JWT expiration', () => {
    it('TC-AD-07: should have 7-day expiration for demo token', async () => {
      const { caller, supabase } = createTestCaller(null);

      const demoUserRow = createMockUserRow({
        id: 'demo-user-001',
        email: 'demo@example.com',
        is_demo: true,
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: demoUserRow, error: null }),
          });
        }
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      });

      const result = await caller.auth.loginDemo();

      const decoded = jwt.decode(result.token) as any;
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 60 * 60 * 24 * 7;

      // Token expiration should be approximately 7 days from now
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + sevenDays + 60); // Allow 60s tolerance
    });
  });
});
