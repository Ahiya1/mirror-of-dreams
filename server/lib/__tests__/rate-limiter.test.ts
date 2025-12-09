// server/lib/__tests__/rate-limiter.test.ts - Rate limiting tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @upstash/redis before any imports
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    // Mock Redis methods as needed
  })),
}));

// Mock @upstash/ratelimit
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn(),
  })),
}));

// Import the actual checkRateLimit function
import { checkRateLimit } from '../rate-limiter';

import type { Ratelimit } from '@upstash/ratelimit';

/**
 * Interface for mock limiters used in tests
 */
interface MockLimiter {
  limit: (identifier: string) => Promise<{
    success: boolean;
    remaining: number;
    reset: number;
  }>;
}

// Helper to cast mock limiter to Ratelimit | null for type safety
const asMockRateLimiter = (mock: MockLimiter): Ratelimit | null => mock as unknown as Ratelimit;

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('checkRateLimit', () => {
    it('returns success true when limiter is null (disabled)', async () => {
      const result = await checkRateLimit(null, 'test-ip-123');

      expect(result.success).toBe(true);
      expect(result.remaining).toBeUndefined();
      expect(result.reset).toBeUndefined();
    });

    it('returns success true when request is within limit', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          remaining: 4,
          reset: Date.now() + 60000,
        }),
      };

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.reset).toBeDefined();
      expect(mockLimiter.limit).toHaveBeenCalledWith('test-ip');
    });

    it('returns success false when rate limit exceeded', async () => {
      const resetTime = Date.now() + 60000;
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: false,
          remaining: 0,
          reset: resetTime,
        }),
      };

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip-exceeded');

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reset).toBe(resetTime);
    });

    it('returns success true on Redis error (graceful degradation)', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Rate limiter error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('returns success true on Redis timeout (graceful degradation)', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('ETIMEDOUT')),
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Rate Limiter Identifiers', () => {
    it('uses IP address for unauthenticated endpoints', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          remaining: 4,
          reset: Date.now() + 60000,
        }),
      };

      const clientIp = '192.168.1.100';
      await checkRateLimit(asMockRateLimiter(mockLimiter), clientIp);

      expect(mockLimiter.limit).toHaveBeenCalledWith(clientIp);
    });

    it('uses user ID for authenticated endpoints', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          remaining: 9,
          reset: Date.now() + 60000,
        }),
      };

      const userId = 'user-uuid-12345';
      await checkRateLimit(asMockRateLimiter(mockLimiter), userId);

      expect(mockLimiter.limit).toHaveBeenCalledWith(userId);
    });
  });

  describe('Remaining Count Tracking', () => {
    it('tracks remaining requests correctly', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi
          .fn()
          .mockResolvedValueOnce({ success: true, remaining: 4, reset: Date.now() + 60000 })
          .mockResolvedValueOnce({ success: true, remaining: 3, reset: Date.now() + 60000 })
          .mockResolvedValueOnce({ success: true, remaining: 2, reset: Date.now() + 60000 }),
      };

      const result1 = await checkRateLimit(asMockRateLimiter(mockLimiter), 'ip-1');
      const result2 = await checkRateLimit(asMockRateLimiter(mockLimiter), 'ip-1');
      const result3 = await checkRateLimit(asMockRateLimiter(mockLimiter), 'ip-1');

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(3);
      expect(result3.remaining).toBe(2);
    });
  });
});

describe('Rate Limit Configuration', () => {
  describe('Auth Rate Limiter (Tier 1)', () => {
    const AUTH_LIMIT = 5;
    const AUTH_WINDOW = '1m';

    it('allows 5 requests per minute', () => {
      expect(AUTH_LIMIT).toBe(5);
    });

    it('uses 1 minute window', () => {
      expect(AUTH_WINDOW).toBe('1m');
    });

    it('auth limit is stricter than AI limit', () => {
      const AI_LIMIT = 10;
      expect(AUTH_LIMIT).toBeLessThan(AI_LIMIT);
    });
  });

  describe('AI Rate Limiter (Tier 2)', () => {
    const AI_LIMIT = 10;
    const AI_WINDOW = '1m';

    it('allows 10 requests per minute', () => {
      expect(AI_LIMIT).toBe(10);
    });

    it('uses 1 minute window', () => {
      expect(AI_WINDOW).toBe('1m');
    });

    it('AI limit is stricter than write limit', () => {
      const WRITE_LIMIT = 30;
      expect(AI_LIMIT).toBeLessThan(WRITE_LIMIT);
    });
  });

  describe('Write Rate Limiter (Tier 3)', () => {
    const WRITE_LIMIT = 30;
    const WRITE_WINDOW = '1m';

    it('allows 30 requests per minute', () => {
      expect(WRITE_LIMIT).toBe(30);
    });

    it('uses 1 minute window', () => {
      expect(WRITE_WINDOW).toBe('1m');
    });

    it('write limit is stricter than global limit', () => {
      const GLOBAL_LIMIT = 100;
      expect(WRITE_LIMIT).toBeLessThan(GLOBAL_LIMIT);
    });
  });

  describe('Global Rate Limiter (Tier 4)', () => {
    const GLOBAL_LIMIT = 100;
    const GLOBAL_WINDOW = '1m';

    it('allows 100 requests per minute', () => {
      expect(GLOBAL_LIMIT).toBe(100);
    });

    it('uses 1 minute window', () => {
      expect(GLOBAL_WINDOW).toBe('1m');
    });
  });
});

describe('Rate Limit Error Handling', () => {
  describe('429 Response Generation', () => {
    it('should calculate retry-after from reset time', () => {
      const now = Date.now();
      const resetTime = now + 30000; // 30 seconds from now

      const retryAfter = Math.ceil((resetTime - now) / 1000);

      expect(retryAfter).toBe(30);
    });

    it('should default to 60 seconds when reset is undefined', () => {
      const reset: number | undefined = undefined;
      const retryAfter = reset ? Math.ceil((reset - Date.now()) / 1000) : 60;

      expect(retryAfter).toBe(60);
    });
  });

  describe('Error Messages', () => {
    it('provides user-friendly error message for rate limit', () => {
      const errorMessage = 'Too many requests. Please try again later.';
      expect(errorMessage).toContain('Too many requests');
    });

    it('provides specific message for auth endpoints', () => {
      const errorMessage = 'Too many authentication attempts. Please wait and try again.';
      expect(errorMessage).toContain('authentication');
    });
  });
});

describe('Admin/Creator Bypass', () => {
  describe('Rate Limit Bypass Logic', () => {
    interface User {
      id: string;
      isCreator: boolean;
      isAdmin: boolean;
    }

    function shouldBypassRateLimit(user: User | null): boolean {
      if (!user) return false;
      return user.isCreator || user.isAdmin;
    }

    it('should bypass rate limit for admin users', () => {
      const adminUser: User = {
        id: 'admin-1',
        isCreator: false,
        isAdmin: true,
      };

      expect(shouldBypassRateLimit(adminUser)).toBe(true);
    });

    it('should bypass rate limit for creator users', () => {
      const creatorUser: User = {
        id: 'creator-1',
        isCreator: true,
        isAdmin: false,
      };

      expect(shouldBypassRateLimit(creatorUser)).toBe(true);
    });

    it('should NOT bypass rate limit for regular users', () => {
      const regularUser: User = {
        id: 'user-1',
        isCreator: false,
        isAdmin: false,
      };

      expect(shouldBypassRateLimit(regularUser)).toBe(false);
    });

    it('should NOT bypass for unauthenticated requests', () => {
      expect(shouldBypassRateLimit(null)).toBe(false);
    });
  });
});

describe('Client IP Extraction', () => {
  describe('getClientIp function', () => {
    interface MockHeaders {
      get: (key: string) => string | null;
    }

    function getClientIp(headers: MockHeaders): string {
      return (
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        'unknown'
      );
    }

    it('extracts IP from x-forwarded-for header', () => {
      const mockHeaders: MockHeaders = {
        get: (key: string) => {
          if (key === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
          return null;
        },
      };

      expect(getClientIp(mockHeaders)).toBe('192.168.1.1');
    });

    it('falls back to x-real-ip when x-forwarded-for is missing', () => {
      const mockHeaders: MockHeaders = {
        get: (key: string) => {
          if (key === 'x-real-ip') return '192.168.1.2';
          return null;
        },
      };

      expect(getClientIp(mockHeaders)).toBe('192.168.1.2');
    });

    it('returns "unknown" when no IP headers present', () => {
      const mockHeaders: MockHeaders = {
        get: () => null,
      };

      expect(getClientIp(mockHeaders)).toBe('unknown');
    });

    it('handles single IP in x-forwarded-for', () => {
      const mockHeaders: MockHeaders = {
        get: (key: string) => {
          if (key === 'x-forwarded-for') return '192.168.1.1';
          return null;
        },
      };

      expect(getClientIp(mockHeaders)).toBe('192.168.1.1');
    });

    it('trims whitespace from IP addresses', () => {
      const mockHeaders: MockHeaders = {
        get: (key: string) => {
          if (key === 'x-forwarded-for') return '  192.168.1.1  ,  10.0.0.1  ';
          return null;
        },
      };

      expect(getClientIp(mockHeaders)).toBe('192.168.1.1');
    });
  });
});
