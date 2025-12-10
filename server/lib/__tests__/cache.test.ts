// server/lib/__tests__/cache.test.ts - Cache utility unit tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeleteUserContext,
  cacheKeys,
  CACHE_TTL,
  getCacheCircuitStatus,
  resetCacheCircuitBreaker,
  isCacheEnabled,
} from '../cache';
import { logger as mockLogger } from '../logger';

import type { RedisClient } from '../cache';

// Mock logger module - must be inline because vi.mock is hoisted
vi.mock('../logger', () => {
  const mockLoggerInstance = {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => mockLoggerInstance),
  };
  return {
    logger: mockLoggerInstance,
  };
});

/**
 * Creates a mock Redis client for testing
 */
function createMockRedisClient(): RedisClient & {
  mockGet: ReturnType<typeof vi.fn>;
  mockSet: ReturnType<typeof vi.fn>;
  mockDel: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockDel = vi.fn();

  return {
    get: mockGet,
    set: mockSet,
    del: mockDel,
    mockGet,
    mockSet,
    mockDel,
  };
}

describe('Cache Utility', () => {
  let mockClient: ReturnType<typeof createMockRedisClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetCacheCircuitBreaker();
    mockClient = createMockRedisClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =====================================================
  // CACHE_TTL TESTS
  // =====================================================

  describe('CACHE_TTL', () => {
    it('has correct value for USER_CONTEXT (300)', () => {
      expect(CACHE_TTL.USER_CONTEXT).toBe(300); // 5 * 60
    });

    it('has correct value for DREAMS (120)', () => {
      expect(CACHE_TTL.DREAMS).toBe(120); // 2 * 60
    });

    it('has correct value for PATTERNS (600)', () => {
      expect(CACHE_TTL.PATTERNS).toBe(600); // 10 * 60
    });

    it('has correct value for SESSIONS (60)', () => {
      expect(CACHE_TTL.SESSIONS).toBe(60); // 1 * 60
    });

    it('has correct value for REFLECTIONS (300)', () => {
      expect(CACHE_TTL.REFLECTIONS).toBe(300); // 5 * 60
    });
  });

  // =====================================================
  // cacheKeys TESTS
  // =====================================================

  describe('cacheKeys', () => {
    const testUserId = 'user-uuid-12345';

    it('generates correct key for userContext', () => {
      expect(cacheKeys.userContext(testUserId)).toBe(`ctx:user:${testUserId}`);
    });

    it('generates correct key for dreams', () => {
      expect(cacheKeys.dreams(testUserId)).toBe(`ctx:dreams:${testUserId}`);
    });

    it('generates correct key for patterns', () => {
      expect(cacheKeys.patterns(testUserId)).toBe(`ctx:patterns:${testUserId}`);
    });

    it('generates correct key for sessions', () => {
      expect(cacheKeys.sessions(testUserId)).toBe(`ctx:sessions:${testUserId}`);
    });

    it('generates correct key for reflections', () => {
      expect(cacheKeys.reflections(testUserId)).toBe(`ctx:reflections:${testUserId}`);
    });

    it('generates unique keys for different users', () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      expect(cacheKeys.userContext(userId1)).not.toBe(cacheKeys.userContext(userId2));
      expect(cacheKeys.dreams(userId1)).not.toBe(cacheKeys.dreams(userId2));
    });
  });

  // =====================================================
  // cacheGet TESTS
  // =====================================================

  describe('cacheGet', () => {
    it('returns cached value when present', async () => {
      const mockData = { name: 'Test User', tier: 'free' };
      mockClient.mockGet.mockResolvedValue(mockData);

      const result = await cacheGet('ctx:user:123', mockClient);

      expect(result).toEqual(mockData);
      expect(mockClient.mockGet).toHaveBeenCalledWith('ctx:user:123');
    });

    it('returns null on cache miss', async () => {
      mockClient.mockGet.mockResolvedValue(null);

      const result = await cacheGet('ctx:user:nonexistent', mockClient);

      expect(result).toBeNull();
      expect(mockClient.mockGet).toHaveBeenCalledWith('ctx:user:nonexistent');
    });

    it('returns null when client is null', async () => {
      const result = await cacheGet('ctx:user:123', null);

      expect(result).toBeNull();
    });

    it('returns null when circuit is open', async () => {
      // Open circuit by simulating 3 failures
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      expect(getCacheCircuitStatus().isOpen).toBe(true);

      vi.clearAllMocks();

      // Create a new mock client for the test
      const freshClient = createMockRedisClient();

      // Next call should return null without calling Redis
      const result = await cacheGet('key4', freshClient);

      expect(result).toBeNull();
      expect(freshClient.mockGet).not.toHaveBeenCalled();
    });

    it('records success on successful get', async () => {
      mockClient.mockGet.mockResolvedValue({ data: 'test' });

      await cacheGet('test-key', mockClient);

      expect(getCacheCircuitStatus().failures).toBe(0);
    });

    it('records failure on get error', async () => {
      mockClient.mockGet.mockRejectedValue(new Error('Redis connection failed'));

      await cacheGet('test-key', mockClient);

      expect(getCacheCircuitStatus().failures).toBe(1);
    });

    it('logs warning on get error', async () => {
      const error = new Error('Redis timeout');
      mockClient.mockGet.mockRejectedValue(error);

      await cacheGet('test-key', mockClient);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          err: error,
          key: 'test-key',
          service: 'cache',
        }),
        'Cache get failed'
      );
    });

    it('returns correctly typed data', async () => {
      interface UserContext {
        name: string;
        tier: string;
        total_reflections: number;
      }

      const mockData: UserContext = {
        name: 'Test',
        tier: 'premium',
        total_reflections: 10,
      };
      mockClient.mockGet.mockResolvedValue(mockData);

      const result = await cacheGet<UserContext>('ctx:user:123', mockClient);

      expect(result).toEqual(mockData);
      expect(result?.name).toBe('Test');
    });
  });

  // =====================================================
  // cacheSet TESTS
  // =====================================================

  describe('cacheSet', () => {
    it('sets value with correct TTL', async () => {
      mockClient.mockSet.mockResolvedValue('OK');

      await cacheSet('ctx:dreams:123', [{ id: 'dream-1' }], { ttl: CACHE_TTL.DREAMS }, mockClient);

      expect(mockClient.mockSet).toHaveBeenCalledWith('ctx:dreams:123', [{ id: 'dream-1' }], {
        ex: 120,
      });
    });

    it('uses default TTL when not specified', async () => {
      mockClient.mockSet.mockResolvedValue('OK');

      await cacheSet('ctx:user:123', { name: 'Test' }, {}, mockClient);

      expect(mockClient.mockSet).toHaveBeenCalledWith(
        'ctx:user:123',
        { name: 'Test' },
        { ex: CACHE_TTL.USER_CONTEXT }
      );
    });

    it('does nothing when client is null', async () => {
      await cacheSet('test-key', { data: 'test' }, {}, null);
      // No error should be thrown
    });

    it('does nothing when circuit is open', async () => {
      // Open circuit
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      expect(getCacheCircuitStatus().isOpen).toBe(true);

      vi.clearAllMocks();

      const freshClient = createMockRedisClient();

      // cacheSet should not call Redis
      await cacheSet('test-key', { data: 'test' }, {}, freshClient);

      expect(freshClient.mockSet).not.toHaveBeenCalled();
    });

    it('records success on successful set', async () => {
      mockClient.mockSet.mockResolvedValue('OK');

      // First create some failures
      mockClient.mockGet.mockRejectedValue(new Error('Temp error'));
      await cacheGet('key1', mockClient);
      expect(getCacheCircuitStatus().failures).toBe(1);

      // Now successful set should reset failures
      vi.clearAllMocks();
      mockClient.mockSet.mockResolvedValue('OK');
      await cacheSet('test-key', { data: 'test' }, {}, mockClient);

      expect(getCacheCircuitStatus().failures).toBe(0);
    });

    it('records failure on set error', async () => {
      mockClient.mockSet.mockRejectedValue(new Error('Redis write failed'));

      await cacheSet('test-key', { data: 'test' }, {}, mockClient);

      expect(getCacheCircuitStatus().failures).toBe(1);
    });

    it('logs warning on set error', async () => {
      const error = new Error('Storage limit exceeded');
      mockClient.mockSet.mockRejectedValue(error);

      await cacheSet('test-key', { data: 'test' }, {}, mockClient);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          err: error,
          key: 'test-key',
          service: 'cache',
        }),
        'Cache set failed'
      );
    });
  });

  // =====================================================
  // cacheDelete TESTS
  // =====================================================

  describe('cacheDelete', () => {
    it('removes key from cache', async () => {
      mockClient.mockDel.mockResolvedValue(1);

      await cacheDelete('ctx:dreams:123', mockClient);

      expect(mockClient.mockDel).toHaveBeenCalledWith('ctx:dreams:123');
    });

    it('handles non-existent keys gracefully', async () => {
      mockClient.mockDel.mockResolvedValue(0); // Key did not exist

      await cacheDelete('ctx:nonexistent:123', mockClient);

      expect(mockClient.mockDel).toHaveBeenCalledWith('ctx:nonexistent:123');
      // Should not throw, should not log error
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('does nothing when client is null', async () => {
      await cacheDelete('test-key', null);
      // No error should be thrown
    });

    it('does nothing when circuit is open', async () => {
      // Open circuit
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      expect(getCacheCircuitStatus().isOpen).toBe(true);

      vi.clearAllMocks();

      const freshClient = createMockRedisClient();

      await cacheDelete('test-key', freshClient);

      expect(freshClient.mockDel).not.toHaveBeenCalled();
    });

    it('records success on successful delete', async () => {
      // Create some failures first
      mockClient.mockGet.mockRejectedValue(new Error('Temp error'));
      await cacheGet('key1', mockClient);
      expect(getCacheCircuitStatus().failures).toBe(1);

      vi.clearAllMocks();

      // Successful delete resets failures
      mockClient.mockDel.mockResolvedValue(1);
      await cacheDelete('test-key', mockClient);

      expect(getCacheCircuitStatus().failures).toBe(0);
    });

    it('records failure on delete error', async () => {
      mockClient.mockDel.mockRejectedValue(new Error('Redis delete failed'));

      await cacheDelete('test-key', mockClient);

      expect(getCacheCircuitStatus().failures).toBe(1);
    });

    it('logs warning on delete error', async () => {
      const error = new Error('Permission denied');
      mockClient.mockDel.mockRejectedValue(error);

      await cacheDelete('test-key', mockClient);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          err: error,
          key: 'test-key',
          service: 'cache',
        }),
        'Cache delete failed'
      );
    });
  });

  // =====================================================
  // cacheDeleteUserContext TESTS
  // =====================================================

  describe('cacheDeleteUserContext', () => {
    const userId = 'user-123';

    it('deletes all 5 context keys for user', async () => {
      mockClient.mockDel.mockResolvedValue(1);

      await cacheDeleteUserContext(userId, mockClient);

      // Should call del for all 5 keys
      expect(mockClient.mockDel).toHaveBeenCalledTimes(5);
      expect(mockClient.mockDel).toHaveBeenCalledWith(cacheKeys.userContext(userId));
      expect(mockClient.mockDel).toHaveBeenCalledWith(cacheKeys.dreams(userId));
      expect(mockClient.mockDel).toHaveBeenCalledWith(cacheKeys.patterns(userId));
      expect(mockClient.mockDel).toHaveBeenCalledWith(cacheKeys.sessions(userId));
      expect(mockClient.mockDel).toHaveBeenCalledWith(cacheKeys.reflections(userId));
    });

    it('does nothing when client is null', async () => {
      await cacheDeleteUserContext(userId, null);
      // No error should be thrown
    });

    it('handles partial failures gracefully', async () => {
      // First 3 succeed, last 2 fail
      mockClient.mockDel
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'));

      // Should not throw
      await cacheDeleteUserContext(userId, mockClient);

      // Should still have attempted all 5
      expect(mockClient.mockDel).toHaveBeenCalledTimes(5);

      // Should log warning for the aggregate failure
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          service: 'cache',
        }),
        'Cache user context delete failed'
      );
    });

    it('records success when all deletions succeed', async () => {
      // Create some failures first
      mockClient.mockGet.mockRejectedValue(new Error('Temp error'));
      await cacheGet('key1', mockClient);
      expect(getCacheCircuitStatus().failures).toBe(1);

      vi.clearAllMocks();

      // All deletions succeed
      mockClient.mockDel.mockResolvedValue(1);
      await cacheDeleteUserContext(userId, mockClient);

      expect(getCacheCircuitStatus().failures).toBe(0);
    });

    it('records failure when any deletion fails', async () => {
      mockClient.mockDel.mockRejectedValue(new Error('Redis down'));

      await cacheDeleteUserContext(userId, mockClient);

      expect(getCacheCircuitStatus().failures).toBe(1);
    });
  });

  // =====================================================
  // Circuit Breaker TESTS
  // =====================================================

  describe('Circuit Breaker', () => {
    it('opens after 3 consecutive failures', async () => {
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      expect(getCacheCircuitStatus().isOpen).toBe(false);

      await cacheGet('key1', mockClient);
      expect(getCacheCircuitStatus().failures).toBe(1);
      expect(getCacheCircuitStatus().isOpen).toBe(false);

      await cacheGet('key2', mockClient);
      expect(getCacheCircuitStatus().failures).toBe(2);
      expect(getCacheCircuitStatus().isOpen).toBe(false);

      await cacheGet('key3', mockClient);
      expect(getCacheCircuitStatus().failures).toBe(3);
      expect(getCacheCircuitStatus().isOpen).toBe(true);
    });

    it('resets on successful operation', async () => {
      mockClient.mockGet
        .mockRejectedValueOnce(new Error('Redis down'))
        .mockRejectedValueOnce(new Error('Redis down'))
        .mockResolvedValue({ data: 'success' });

      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);

      expect(getCacheCircuitStatus().failures).toBe(2);

      await cacheGet('key3', mockClient);

      expect(getCacheCircuitStatus().failures).toBe(0);
      expect(getCacheCircuitStatus().isOpen).toBe(false);
    });

    it('allows half-open request after 15s timeout', async () => {
      vi.useFakeTimers();

      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      // Open circuit with 3 failures
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      expect(getCacheCircuitStatus().isOpen).toBe(true);

      // Advance time past recovery timeout (15 seconds)
      vi.advanceTimersByTime(16000);

      // Replace mock to track calls
      const freshClient = createMockRedisClient();
      freshClient.mockGet.mockResolvedValue({ data: 'recovered' });

      const result = await cacheGet('test-key', freshClient);

      expect(result).toEqual({ data: 'recovered' });
      expect(freshClient.mockGet).toHaveBeenCalledWith('test-key');
    });

    it('logs when circuit opens', async () => {
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'cache',
          failureCount: 3,
          recoveryTimeMs: 15000,
        }),
        'Cache circuit breaker OPEN: Falling back to database'
      );
    });

    it('logs when circuit recovers', async () => {
      mockClient.mockGet
        .mockRejectedValueOnce(new Error('Redis down'))
        .mockRejectedValueOnce(new Error('Redis down'))
        .mockResolvedValue({ data: 'success' });

      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);

      vi.clearAllMocks();

      await cacheGet('key3', mockClient);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'cache',
          previousFailures: 2,
        }),
        'Cache circuit breaker: Redis recovered'
      );
    });

    it('does not log recovery when there were no previous failures', async () => {
      mockClient.mockGet.mockResolvedValue({ data: 'success' });

      await cacheGet('key1', mockClient);

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.anything(),
        'Cache circuit breaker: Redis recovered'
      );
    });
  });

  // =====================================================
  // getCacheCircuitStatus TESTS
  // =====================================================

  describe('getCacheCircuitStatus', () => {
    it('returns correct status when circuit is closed', () => {
      const status = getCacheCircuitStatus();

      expect(status.isOpen).toBe(false);
      expect(status.failures).toBe(0);
      expect(status.recoveryIn).toBeNull();
    });

    it('returns correct status when circuit is open', async () => {
      vi.useFakeTimers();

      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      // Open circuit
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      const status = getCacheCircuitStatus();

      expect(status.isOpen).toBe(true);
      expect(status.failures).toBe(3);
      expect(status.recoveryIn).not.toBeNull();
    });

    it('calculates recoveryIn correctly', async () => {
      vi.useFakeTimers();

      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      // Open circuit
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      // Advance 5 seconds
      vi.advanceTimersByTime(5000);

      const status = getCacheCircuitStatus();

      // Should have ~10 seconds remaining (15s - 5s)
      expect(status.recoveryIn).toBe(10000);
    });

    it('shows recoveryIn as 0 after timeout passes', async () => {
      vi.useFakeTimers();

      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      // Open circuit
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      // Advance past recovery timeout
      vi.advanceTimersByTime(20000);

      const status = getCacheCircuitStatus();

      expect(status.recoveryIn).toBe(0);
    });
  });

  // =====================================================
  // isCacheEnabled TESTS
  // =====================================================

  describe('isCacheEnabled', () => {
    it('returns true when client is provided and circuit is closed', () => {
      expect(isCacheEnabled(mockClient)).toBe(true);
    });

    it('returns false when client is null', () => {
      expect(isCacheEnabled(null)).toBe(false);
    });

    it('returns false when circuit is open', async () => {
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      // Open circuit
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      expect(isCacheEnabled(mockClient)).toBe(false);
    });
  });

  // =====================================================
  // resetCacheCircuitBreaker TESTS
  // =====================================================

  describe('resetCacheCircuitBreaker', () => {
    it('resets all circuit breaker state', async () => {
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      // Open circuit
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      expect(getCacheCircuitStatus().isOpen).toBe(true);

      resetCacheCircuitBreaker();

      const status = getCacheCircuitStatus();
      expect(status.isOpen).toBe(false);
      expect(status.failures).toBe(0);
      expect(status.recoveryIn).toBeNull();
    });
  });

  // =====================================================
  // Fail-Open Behavior TESTS
  // =====================================================

  describe('Fail-Open Behavior', () => {
    it('cacheGet returns null (not throws) on error', async () => {
      mockClient.mockGet.mockRejectedValue(new Error('Catastrophic failure'));

      const result = await cacheGet('test-key', mockClient);

      expect(result).toBeNull();
    });

    it('cacheSet completes (not throws) on error', async () => {
      mockClient.mockSet.mockRejectedValue(new Error('Write failed'));

      // Should not throw
      await expect(cacheSet('test-key', { data: 'test' }, {}, mockClient)).resolves.toBeUndefined();
    });

    it('cacheDelete completes (not throws) on error', async () => {
      mockClient.mockDel.mockRejectedValue(new Error('Delete failed'));

      // Should not throw
      await expect(cacheDelete('test-key', mockClient)).resolves.toBeUndefined();
    });

    it('cache failures never block the caller', async () => {
      mockClient.mockGet.mockRejectedValue(new Error('Redis completely down'));

      const startTime = Date.now();

      // Multiple failed operations should complete quickly
      await Promise.all([
        cacheGet('key1', mockClient),
        cacheGet('key2', mockClient),
        cacheGet('key3', mockClient),
      ]);

      const duration = Date.now() - startTime;

      // All operations should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });

  // =====================================================
  // Edge Cases
  // =====================================================

  describe('Edge Cases', () => {
    it('handles empty string keys', async () => {
      mockClient.mockGet.mockResolvedValue(null);

      const result = await cacheGet('', mockClient);

      expect(result).toBeNull();
      expect(mockClient.mockGet).toHaveBeenCalledWith('');
    });

    it('handles complex nested objects', async () => {
      const complexData = {
        user: {
          name: 'Test',
          preferences: {
            theme: 'dark',
            notifications: [1, 2, 3],
          },
        },
        metadata: {
          created: '2024-01-01',
          tags: ['a', 'b', 'c'],
        },
      };

      mockClient.mockGet.mockResolvedValue(complexData);

      const result = await cacheGet<typeof complexData>('complex-key', mockClient);

      expect(result).toEqual(complexData);
    });

    it('handles array values', async () => {
      const arrayData = [
        { id: '1', title: 'Dream 1' },
        { id: '2', title: 'Dream 2' },
      ];

      mockClient.mockGet.mockResolvedValue(arrayData);

      const result = await cacheGet<typeof arrayData>('ctx:dreams:123', mockClient);

      expect(result).toEqual(arrayData);
      expect(result?.length).toBe(2);
    });

    it('handles null values stored in cache', async () => {
      mockClient.mockGet.mockResolvedValue(null);

      const result = await cacheGet('key-with-null', mockClient);

      expect(result).toBeNull();
    });

    it('handles boolean values', async () => {
      mockClient.mockGet.mockResolvedValue(true);

      const result = await cacheGet<boolean>('bool-key', mockClient);

      expect(result).toBe(true);
    });

    it('handles numeric values', async () => {
      mockClient.mockGet.mockResolvedValue(42);

      const result = await cacheGet<number>('num-key', mockClient);

      expect(result).toBe(42);
    });
  });

  // =====================================================
  // Concurrent Operations
  // =====================================================

  describe('Concurrent Operations', () => {
    it('handles multiple concurrent get operations', async () => {
      mockClient.mockGet.mockImplementation(async (key: string) => {
        return { key, data: 'test' };
      });

      const results = await Promise.all([
        cacheGet('key1', mockClient),
        cacheGet('key2', mockClient),
        cacheGet('key3', mockClient),
        cacheGet('key4', mockClient),
        cacheGet('key5', mockClient),
      ]);

      expect(results).toHaveLength(5);
      expect(mockClient.mockGet).toHaveBeenCalledTimes(5);
    });

    it('handles mixed operations concurrently', async () => {
      mockClient.mockGet.mockResolvedValue({ data: 'test' });
      mockClient.mockSet.mockResolvedValue('OK');
      mockClient.mockDel.mockResolvedValue(1);

      await Promise.all([
        cacheGet('key1', mockClient),
        cacheSet('key2', { data: 'new' }, {}, mockClient),
        cacheDelete('key3', mockClient),
        cacheGet('key4', mockClient),
        cacheSet('key5', { data: 'another' }, {}, mockClient),
      ]);

      expect(mockClient.mockGet).toHaveBeenCalledTimes(2);
      expect(mockClient.mockSet).toHaveBeenCalledTimes(2);
      expect(mockClient.mockDel).toHaveBeenCalledTimes(1);
    });
  });
});

// =====================================================
// Performance-Related Tests
// =====================================================

describe('Cache Performance Characteristics', () => {
  let mockClient: ReturnType<typeof createMockRedisClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetCacheCircuitBreaker();
    mockClient = createMockRedisClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('TTL Values Alignment', () => {
    it('USER_CONTEXT has longer TTL than SESSIONS for stable data', () => {
      expect(CACHE_TTL.USER_CONTEXT).toBeGreaterThanOrEqual(CACHE_TTL.SESSIONS);
    });

    it('PATTERNS has longest TTL (consolidated infrequently)', () => {
      expect(CACHE_TTL.PATTERNS).toBe(
        Math.max(
          CACHE_TTL.USER_CONTEXT,
          CACHE_TTL.DREAMS,
          CACHE_TTL.PATTERNS,
          CACHE_TTL.SESSIONS,
          CACHE_TTL.REFLECTIONS
        )
      );
    });

    it('SESSIONS has shortest TTL (updates frequently)', () => {
      expect(CACHE_TTL.SESSIONS).toBe(
        Math.min(
          CACHE_TTL.USER_CONTEXT,
          CACHE_TTL.DREAMS,
          CACHE_TTL.PATTERNS,
          CACHE_TTL.SESSIONS,
          CACHE_TTL.REFLECTIONS
        )
      );
    });
  });

  describe('Circuit Breaker Timing', () => {
    it('has faster recovery than rate limiter (15s vs 30s)', async () => {
      // Cache circuit breaker recovery is 15 seconds
      vi.useFakeTimers();
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      const status = getCacheCircuitStatus();

      // Recovery time should be around 15000ms
      expect(status.recoveryIn).toBeLessThanOrEqual(15000);
      expect(status.recoveryIn).toBeGreaterThan(0);
    });

    it('has lower failure threshold than rate limiter (3 vs 5)', async () => {
      mockClient.mockGet.mockRejectedValue(new Error('Redis down'));

      // After 3 failures, circuit should be open
      await cacheGet('key1', mockClient);
      await cacheGet('key2', mockClient);
      await cacheGet('key3', mockClient);

      expect(getCacheCircuitStatus().isOpen).toBe(true);
      expect(getCacheCircuitStatus().failures).toBe(3);
    });
  });
});
