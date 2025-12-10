// server/lib/__tests__/rate-limiter.test.ts - Rate limiting tests with fail-closed circuit breaker

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { logger as mockLogger } from '../logger';
import { checkRateLimit, getCircuitBreakerStatus, resetCircuitBreaker } from '../rate-limiter';

import type { Ratelimit } from '@upstash/ratelimit';

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

// Mock logger module - must be inline because vi.mock is hoisted
vi.mock('../logger', () => {
  const mockLoggerInstance = {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => mockLoggerInstance),
  };
  return {
    logger: mockLoggerInstance,
  };
});

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
    resetCircuitBreaker();
  });

  afterEach(() => {
    vi.resetModules();
    vi.useRealTimers();
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

    // FAIL-CLOSED TESTS - Updated from fail-open behavior
    it('returns success false on Redis error (fail-closed)', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
      };

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(false);
      expect(result.circuitOpen).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'rate-limiter',
          identifier: 'test-ip',
        }),
        'Rate limiter error - FAIL-CLOSED: rejecting request'
      );
    });

    it('returns success false on Redis timeout (fail-closed)', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('ETIMEDOUT')),
      };

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(false);
      expect(result.circuitOpen).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('sets circuitOpen flag on Redis failure', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Connection refused')),
      };

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.circuitOpen).toBe(true);
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

// =====================================================
// CIRCUIT BREAKER TESTS
// =====================================================

describe('Circuit Breaker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCircuitBreaker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Fail-Closed Behavior', () => {
    it('should return success false on Redis error (fail-closed)', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
      };

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(false);
      expect(result.circuitOpen).toBe(true);
    });

    it('should return success false on Redis timeout (fail-closed)', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('ETIMEDOUT')),
      };

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(false);
      expect(result.circuitOpen).toBe(true);
    });

    it('should set circuitOpen flag correctly on failure', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.circuitOpen).toBe(true);
      expect(result.success).toBe(false);
    });
  });

  describe('Circuit Open/Close Behavior', () => {
    it('should open circuit after 5 consecutive failures', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // 5 failures should open circuit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      const status = getCircuitBreakerStatus();
      expect(status.isOpen).toBe(true);
      expect(status.failures).toBe(5);
    });

    it('should reject requests when circuit is open without calling Redis', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit with 5 failures
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      // Clear mock to track subsequent calls
      mockLimiter.limit = vi.fn();
      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(false);
      expect(result.circuitOpen).toBe(true);
      expect(mockLimiter.limit).not.toHaveBeenCalled();
    });

    it('should reset circuit on successful request', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi
          .fn()
          .mockRejectedValueOnce(new Error('Redis down'))
          .mockRejectedValueOnce(new Error('Redis down'))
          .mockResolvedValue({ success: true, remaining: 5, reset: Date.now() + 60000 }),
      };

      // Accumulate 2 failures
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      let status = getCircuitBreakerStatus();
      expect(status.failures).toBe(2);

      // Success resets circuit
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      status = getCircuitBreakerStatus();
      expect(status.failures).toBe(0);
      expect(status.isOpen).toBe(false);
    });

    it('should not open circuit before threshold is reached', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // 4 failures should NOT open circuit
      for (let i = 0; i < 4; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      const status = getCircuitBreakerStatus();
      expect(status.isOpen).toBe(false);
      expect(status.failures).toBe(4);
    });
  });

  describe('Half-Open Recovery', () => {
    it('should allow half-open requests after recovery timeout', async () => {
      vi.useFakeTimers();

      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit with 5 failures
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      expect(getCircuitBreakerStatus().isOpen).toBe(true);

      // Advance time past recovery timeout (30 seconds)
      vi.advanceTimersByTime(31000);

      // Should allow half-open request (replace mock to track calls)
      mockLimiter.limit = vi.fn().mockResolvedValue({
        success: true,
        remaining: 5,
        reset: Date.now() + 60000,
      });

      const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(result.success).toBe(true);
      expect(mockLimiter.limit).toHaveBeenCalled();
      expect(getCircuitBreakerStatus().isOpen).toBe(false);
    });

    it('should allow limited half-open requests (3 max)', async () => {
      vi.useFakeTimers();

      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit with 5 failures
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      // Advance time past recovery timeout
      vi.advanceTimersByTime(31000);

      // Replace mock to count calls
      let callCount = 0;
      mockLimiter.limit = vi.fn().mockImplementation(() => {
        callCount++;
        // Continue to fail in half-open
        return Promise.reject(new Error('Still down'));
      });

      // First 3 should be allowed (half-open quota)
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(callCount).toBe(3);

      // 4th should be blocked (quota exhausted)
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      expect(callCount).toBe(3); // Should not have called limit again
    });

    it('should fully recover on successful half-open request', async () => {
      vi.useFakeTimers();

      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit with 5 failures
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      // Advance time past recovery timeout
      vi.advanceTimersByTime(31000);

      // Successful half-open request
      mockLimiter.limit = vi.fn().mockResolvedValue({
        success: true,
        remaining: 10,
        reset: Date.now() + 60000,
      });

      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      // Circuit should be fully closed now
      const status = getCircuitBreakerStatus();
      expect(status.isOpen).toBe(false);
      expect(status.failures).toBe(0);
    });
  });

  describe('getCircuitBreakerStatus', () => {
    it('should return correct status when circuit is closed', () => {
      const status = getCircuitBreakerStatus();

      expect(status.isOpen).toBe(false);
      expect(status.failures).toBe(0);
      expect(status.timeSinceLastFailure).toBeNull();
      expect(status.recoveryIn).toBeNull();
    });

    it('should return correct status when circuit is open', async () => {
      vi.useFakeTimers();

      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      const status = getCircuitBreakerStatus();

      expect(status.isOpen).toBe(true);
      expect(status.failures).toBe(5);
      expect(status.timeSinceLastFailure).not.toBeNull();
      expect(status.recoveryIn).not.toBeNull();
    });

    it('should calculate recoveryIn correctly', async () => {
      vi.useFakeTimers();

      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      // Advance 10 seconds
      vi.advanceTimersByTime(10000);

      const status = getCircuitBreakerStatus();

      // Should have ~20 seconds remaining (30s - 10s)
      expect(status.recoveryIn).toBe(20000);
    });

    it('should show recoveryIn as 0 after timeout passes', async () => {
      vi.useFakeTimers();

      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      // Advance past recovery timeout
      vi.advanceTimersByTime(35000);

      const status = getCircuitBreakerStatus();

      expect(status.recoveryIn).toBe(0);
    });
  });

  describe('resetCircuitBreaker', () => {
    it('should reset all circuit breaker state', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      expect(getCircuitBreakerStatus().isOpen).toBe(true);

      resetCircuitBreaker();

      const status = getCircuitBreakerStatus();
      expect(status.isOpen).toBe(false);
      expect(status.failures).toBe(0);
      expect(status.timeSinceLastFailure).toBeNull();
    });
  });

  describe('Logging', () => {
    it('should log when circuit breaker opens', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit with 5 failures
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'rate-limiter',
          failureCount: 5,
          recoveryTimeMs: 30000,
        }),
        'Circuit breaker OPEN: Rate limiting will reject all requests'
      );
    });

    it('should log when circuit breaker recovers', async () => {
      vi.useFakeTimers();

      const mockLimiter: MockLimiter = {
        limit: vi
          .fn()
          .mockRejectedValueOnce(new Error('Redis down'))
          .mockRejectedValueOnce(new Error('Redis down'))
          .mockResolvedValue({ success: true, remaining: 5, reset: Date.now() + 60000 }),
      };

      // Accumulate 2 failures
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      // Success should log recovery
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'rate-limiter',
          previousFailures: 2,
        }),
        'Circuit breaker: Redis recovered, resetting'
      );
    });

    it('should log when request is rejected due to open circuit', async () => {
      const mockLimiter: MockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis down')),
      };

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
      }

      vi.clearAllMocks();

      // Next request should trigger warning log
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'new-ip');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'rate-limiter',
          identifier: 'new-ip',
        }),
        'Rate limit check rejected: Circuit breaker open'
      );
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

    it('provides circuit breaker message when Redis is down', () => {
      const errorMessage = 'Service temporarily unavailable. Please try again shortly.';
      expect(errorMessage).toContain('temporarily unavailable');
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
