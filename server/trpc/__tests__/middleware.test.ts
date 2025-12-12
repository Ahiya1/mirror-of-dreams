// server/trpc/__tests__/middleware.test.ts
// Tests for authentication and permission middlewares

import { TRPCError } from '@trpc/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  isAuthed,
  isCreatorOrAdmin,
  isPremium,
  checkUsageLimit,
  notDemo,
  checkClarifyAccess,
  checkClarifySessionLimit,
  rateLimitByIp,
  rateLimitByUser,
} from '../middleware';

import { DAILY_LIMITS, TIER_LIMITS, CLARIFY_SESSION_LIMITS } from '@/lib/utils/constants';
import { authRateLimiter, aiRateLimiter } from '@/server/lib/rate-limiter';

// Mock rate limiter
const mockCheckRateLimit = vi.fn();
vi.mock('@/server/lib/rate-limiter', () => ({
  authRateLimiter: { name: 'authLimiter' },
  aiRateLimiter: { name: 'aiLimiter' },
  writeRateLimiter: { name: 'writeLimiter' },
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

// Create a simpler middleware mock that mirrors the real implementation
vi.mock('../trpc', () => {
  const middleware = (fn: unknown) => fn;
  const publicProcedure = {
    use: () => publicProcedure,
  };
  return {
    middleware,
    publicProcedure,
    router: vi.fn(),
  };
});

// Helper to run middleware
async function runMiddleware(middleware: any, ctx: any) {
  let result: any = null;
  let error: any = null;

  try {
    await middleware({
      ctx,
      next: (opts?: any) => {
        result = opts?.ctx || ctx;
        return Promise.resolve({ ok: true });
      },
    });
  } catch (e) {
    error = e;
  }

  return { result, error };
}

describe('Daily Limit Logic', () => {
  it('should have correct daily limits', () => {
    expect(DAILY_LIMITS.free).toBe(Infinity);
    expect(DAILY_LIMITS.pro).toBe(1);
    expect(DAILY_LIMITS.unlimited).toBe(2);
  });

  it('should check daily limit for pro users', () => {
    const tier = 'pro';
    const dailyLimit = DAILY_LIMITS[tier];
    const today = new Date().toISOString().split('T')[0];

    // Scenario 1: First reflection today (lastDate is different)
    const lastDate1 = '2025-11-29';
    const reflectionsToday1 = 0;
    const shouldAllow1 = lastDate1 !== today || reflectionsToday1 < dailyLimit;
    expect(shouldAllow1).toBe(true);

    // Scenario 2: Same day, under limit
    const lastDate2 = today;
    const reflectionsToday2 = 0;
    const shouldAllow2 = lastDate2 === today && reflectionsToday2 < dailyLimit;
    expect(shouldAllow2).toBe(true);

    // Scenario 3: Same day, at limit
    const lastDate3 = today;
    const reflectionsToday3 = 1;
    const shouldBlock3 = lastDate3 === today && reflectionsToday3 >= dailyLimit;
    expect(shouldBlock3).toBe(true);
  });

  it('should check daily limit for unlimited users', () => {
    const tier = 'unlimited';
    const dailyLimit = DAILY_LIMITS[tier];
    const today = new Date().toISOString().split('T')[0];

    // Scenario 1: Under limit
    const lastDate1 = today;
    const reflectionsToday1 = 1;
    const shouldAllow1 = lastDate1 === today && reflectionsToday1 < dailyLimit;
    expect(shouldAllow1).toBe(true);

    // Scenario 2: At limit
    const lastDate2 = today;
    const reflectionsToday2 = 2;
    const shouldBlock2 = lastDate2 === today && reflectionsToday2 >= dailyLimit;
    expect(shouldBlock2).toBe(true);
  });

  it('should not have daily limit for free users', () => {
    const tier = 'free';
    const dailyLimit = DAILY_LIMITS[tier];
    expect(dailyLimit).toBe(Infinity);

    const reflectionsToday = 100;
    const shouldAllow = reflectionsToday < dailyLimit;
    expect(shouldAllow).toBe(true);
  });
});

describe('Reflection Counter Update Logic', () => {
  it('should reset counter when new day', () => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = '2025-11-29';
    const currentCount = 5;

    const newCount = lastDate === today ? currentCount + 1 : 1;
    expect(newCount).toBe(1);
  });

  it('should increment counter when same day', () => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = today;
    const currentCount = 1;

    const newCount = lastDate === today ? currentCount + 1 : 1;
    expect(newCount).toBe(2);
  });
});

// ============================================
// MIDDLEWARE FUNCTION TESTS
// ============================================

describe('isAuthed middleware', () => {
  it('throws UNAUTHORIZED when user is null', async () => {
    const { error } = await runMiddleware(isAuthed, { user: null });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Authentication required. Please sign in.');
  });

  it('passes through when user exists', async () => {
    const user = { id: 'user-1', email: 'test@example.com' };
    const { result, error } = await runMiddleware(isAuthed, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });
});

describe('isCreatorOrAdmin middleware', () => {
  it('throws UNAUTHORIZED when user is null', async () => {
    const { error } = await runMiddleware(isCreatorOrAdmin, { user: null });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('throws FORBIDDEN when user is neither creator nor admin', async () => {
    const user = { id: 'user-1', isCreator: false, isAdmin: false };
    const { error } = await runMiddleware(isCreatorOrAdmin, { user });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('Creator or admin access required.');
  });

  it('passes through when user is creator', async () => {
    const user = { id: 'user-1', isCreator: true, isAdmin: false };
    const { result, error } = await runMiddleware(isCreatorOrAdmin, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through when user is admin', async () => {
    const user = { id: 'user-1', isCreator: false, isAdmin: true };
    const { result, error } = await runMiddleware(isCreatorOrAdmin, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });
});

describe('isPremium middleware', () => {
  it('throws UNAUTHORIZED when user is null', async () => {
    const { error } = await runMiddleware(isPremium, { user: null });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('throws FORBIDDEN when user is free tier', async () => {
    const user = { id: 'user-1', tier: 'free', isCreator: false, isAdmin: false };
    const { error } = await runMiddleware(isPremium, { user });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toContain('Premium tier required');
  });

  it('passes through when user is pro tier', async () => {
    const user = { id: 'user-1', tier: 'pro', isCreator: false, isAdmin: false };
    const { result, error } = await runMiddleware(isPremium, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through when user is unlimited tier', async () => {
    const user = { id: 'user-1', tier: 'unlimited', isCreator: false, isAdmin: false };
    const { result, error } = await runMiddleware(isPremium, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through for free tier creator', async () => {
    const user = { id: 'user-1', tier: 'free', isCreator: true, isAdmin: false };
    const { result, error } = await runMiddleware(isPremium, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through for free tier admin', async () => {
    const user = { id: 'user-1', tier: 'free', isCreator: false, isAdmin: true };
    const { result, error } = await runMiddleware(isPremium, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });
});

describe('checkUsageLimit middleware', () => {
  it('throws UNAUTHORIZED when user is null', async () => {
    const { error } = await runMiddleware(checkUsageLimit, { user: null });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('passes through for creators without checking limits', async () => {
    const user = { id: 'user-1', isCreator: true, isAdmin: false };
    const { result, error } = await runMiddleware(checkUsageLimit, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through for admins without checking limits', async () => {
    const user = { id: 'user-1', isCreator: false, isAdmin: true };
    const { result, error } = await runMiddleware(checkUsageLimit, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('throws FORBIDDEN when pro user hits daily limit', async () => {
    const today = new Date().toISOString().split('T')[0];
    const user = {
      id: 'user-1',
      tier: 'pro',
      isCreator: false,
      isAdmin: false,
      lastReflectionDate: today,
      reflectionsToday: DAILY_LIMITS.pro,
      reflectionCountThisMonth: 0,
    };
    const { error } = await runMiddleware(checkUsageLimit, { user });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toContain('Daily reflection limit reached');
  });

  it('throws FORBIDDEN when unlimited user hits daily limit', async () => {
    const today = new Date().toISOString().split('T')[0];
    const user = {
      id: 'user-1',
      tier: 'unlimited',
      isCreator: false,
      isAdmin: false,
      lastReflectionDate: today,
      reflectionsToday: DAILY_LIMITS.unlimited,
      reflectionCountThisMonth: 0,
    };
    const { error } = await runMiddleware(checkUsageLimit, { user });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toContain('Daily reflection limit reached');
  });

  it('throws FORBIDDEN when monthly limit reached', async () => {
    const user = {
      id: 'user-1',
      tier: 'free',
      isCreator: false,
      isAdmin: false,
      reflectionCountThisMonth: TIER_LIMITS.free,
    };
    const { error } = await runMiddleware(checkUsageLimit, { user });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toContain('Monthly reflection limit reached');
  });

  it('passes through when within limits', async () => {
    const user = {
      id: 'user-1',
      tier: 'free',
      isCreator: false,
      isAdmin: false,
      reflectionCountThisMonth: 1, // Under TIER_LIMITS.free (which is 2)
    };
    const { result, error } = await runMiddleware(checkUsageLimit, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('resets daily counter on new day for pro users', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const user = {
      id: 'user-1',
      tier: 'pro',
      isCreator: false,
      isAdmin: false,
      lastReflectionDate: yesterday,
      reflectionsToday: 10,
      reflectionCountThisMonth: 5,
    };
    const { result, error } = await runMiddleware(checkUsageLimit, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });
});

describe('notDemo middleware', () => {
  it('throws UNAUTHORIZED when user is null', async () => {
    const { error } = await runMiddleware(notDemo, { user: null });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Authentication required.');
  });

  it('throws FORBIDDEN when user is demo', async () => {
    const user = { id: 'demo-1', isDemo: true };
    const { error } = await runMiddleware(notDemo, { user });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toContain('Create a free account');
  });

  it('passes through when user is not demo', async () => {
    const user = { id: 'user-1', isDemo: false };
    const { result, error } = await runMiddleware(notDemo, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });
});

describe('checkClarifyAccess middleware', () => {
  it('throws UNAUTHORIZED when user is null', async () => {
    const { error } = await runMiddleware(checkClarifyAccess, { user: null });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('throws FORBIDDEN for free tier users', async () => {
    const user = { id: 'user-1', tier: 'free', isCreator: false, isAdmin: false };
    const { error } = await runMiddleware(checkClarifyAccess, { user });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toContain('Clarify requires a Pro or Unlimited subscription');
  });

  it('passes through for pro users', async () => {
    const user = { id: 'user-1', tier: 'pro', isCreator: false, isAdmin: false };
    const { result, error } = await runMiddleware(checkClarifyAccess, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through for unlimited users', async () => {
    const user = { id: 'user-1', tier: 'unlimited', isCreator: false, isAdmin: false };
    const { result, error } = await runMiddleware(checkClarifyAccess, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through for free tier creators', async () => {
    const user = { id: 'user-1', tier: 'free', isCreator: true, isAdmin: false };
    const { result, error } = await runMiddleware(checkClarifyAccess, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through for free tier admins', async () => {
    const user = { id: 'user-1', tier: 'free', isCreator: false, isAdmin: true };
    const { result, error } = await runMiddleware(checkClarifyAccess, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });
});

describe('checkClarifySessionLimit middleware', () => {
  it('throws UNAUTHORIZED when user is null', async () => {
    const { error } = await runMiddleware(checkClarifySessionLimit, { user: null });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('passes through for creators', async () => {
    const user = { id: 'user-1', isCreator: true, isAdmin: false };
    const { result, error } = await runMiddleware(checkClarifySessionLimit, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('passes through for admins', async () => {
    const user = { id: 'user-1', isCreator: false, isAdmin: true };
    const { result, error } = await runMiddleware(checkClarifySessionLimit, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });

  it('throws FORBIDDEN when session limit reached', async () => {
    const user = {
      id: 'user-1',
      tier: 'pro',
      isCreator: false,
      isAdmin: false,
      clarifySessionsThisMonth: CLARIFY_SESSION_LIMITS.pro,
    };
    const { error } = await runMiddleware(checkClarifySessionLimit, { user });
    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toContain('Monthly Clarify session limit reached');
  });

  it('passes through when within session limit', async () => {
    const user = {
      id: 'user-1',
      tier: 'pro',
      isCreator: false,
      isAdmin: false,
      clarifySessionsThisMonth: 5,
    };
    const { result, error } = await runMiddleware(checkClarifySessionLimit, { user });
    expect(error).toBeNull();
    expect(result.user).toEqual(user);
  });
});

describe('rateLimitByIp middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws TOO_MANY_REQUESTS when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, circuitOpen: false });

    const middleware = rateLimitByIp(authRateLimiter);
    const ctx = {
      user: null,
      req: {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      },
    };
    const { error } = await runMiddleware(middleware, ctx);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('TOO_MANY_REQUESTS');
    expect(error.message).toBe('Too many requests. Please try again later.');
  });

  it('shows circuit open message when circuit is open', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, circuitOpen: true });

    const middleware = rateLimitByIp(authRateLimiter);
    const ctx = {
      user: null,
      req: {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      },
    };
    const { error } = await runMiddleware(middleware, ctx);

    expect(error.message).toBe('Service temporarily unavailable. Please try again shortly.');
  });

  it('passes through when rate limit not exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: true });

    const middleware = rateLimitByIp(authRateLimiter);
    const ctx = {
      user: null,
      req: {
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1'),
        },
      },
    };
    const { error } = await runMiddleware(middleware, ctx);

    expect(error).toBeNull();
    expect(mockCheckRateLimit).toHaveBeenCalledWith(authRateLimiter, '192.168.1.1');
  });

  it('extracts IP from x-forwarded-for header', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: true });

    const middleware = rateLimitByIp(authRateLimiter);
    const ctx = {
      user: null,
      req: {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'x-forwarded-for') return '10.0.0.1, 192.168.1.1';
            return null;
          }),
        },
      },
    };
    const { error } = await runMiddleware(middleware, ctx);

    expect(error).toBeNull();
    expect(mockCheckRateLimit).toHaveBeenCalledWith(authRateLimiter, '10.0.0.1');
  });

  it('falls back to x-real-ip header', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: true });

    const middleware = rateLimitByIp(authRateLimiter);
    const ctx = {
      user: null,
      req: {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'x-real-ip') return '172.16.0.1';
            return null;
          }),
        },
      },
    };
    const { error } = await runMiddleware(middleware, ctx);

    expect(error).toBeNull();
    expect(mockCheckRateLimit).toHaveBeenCalledWith(authRateLimiter, '172.16.0.1');
  });

  it('uses unknown when no request present', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: true });

    const middleware = rateLimitByIp(authRateLimiter);
    const ctx = { user: null };
    const { error } = await runMiddleware(middleware, ctx);

    expect(error).toBeNull();
    expect(mockCheckRateLimit).toHaveBeenCalledWith(authRateLimiter, 'unknown');
  });
});

describe('rateLimitByUser middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws UNAUTHORIZED when user is null', async () => {
    const middleware = rateLimitByUser(aiRateLimiter);
    const { error } = await runMiddleware(middleware, { user: null });

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('skips rate limiting for creators', async () => {
    const middleware = rateLimitByUser(aiRateLimiter);
    const user = { id: 'user-1', isCreator: true, isAdmin: false };
    const { result, error } = await runMiddleware(middleware, { user });

    expect(error).toBeNull();
    expect(result.user).toEqual(user);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it('skips rate limiting for admins', async () => {
    const middleware = rateLimitByUser(aiRateLimiter);
    const user = { id: 'user-1', isCreator: false, isAdmin: true };
    const { result, error } = await runMiddleware(middleware, { user });

    expect(error).toBeNull();
    expect(result.user).toEqual(user);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it('throws TOO_MANY_REQUESTS when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, circuitOpen: false });

    const middleware = rateLimitByUser(aiRateLimiter);
    const user = { id: 'user-1', isCreator: false, isAdmin: false };
    const { error } = await runMiddleware(middleware, { user });

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('TOO_MANY_REQUESTS');
    expect(error.message).toBe('Rate limit exceeded. Please slow down.');
  });

  it('shows circuit open message for user rate limiting', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, circuitOpen: true });

    const middleware = rateLimitByUser(aiRateLimiter);
    const user = { id: 'user-1', isCreator: false, isAdmin: false };
    const { error } = await runMiddleware(middleware, { user });

    expect(error.message).toBe('Service temporarily unavailable. Please try again shortly.');
  });

  it('passes through when rate limit not exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: true });

    const middleware = rateLimitByUser(aiRateLimiter);
    const user = { id: 'user-1', isCreator: false, isAdmin: false };
    const { result, error } = await runMiddleware(middleware, { user });

    expect(error).toBeNull();
    expect(result.user).toEqual(user);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(aiRateLimiter, 'user-1');
  });
});
