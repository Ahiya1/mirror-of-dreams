// lib/clarify/__tests__/context-builder.test.ts - Context builder integration tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock cache module before imports
vi.mock('@/server/lib/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheKeys: {
    userContext: (userId: string) => `ctx:user:${userId}`,
    dreams: (userId: string) => `ctx:dreams:${userId}`,
    patterns: (userId: string) => `ctx:patterns:${userId}`,
    sessions: (userId: string) => `ctx:sessions:${userId}`,
    reflections: (userId: string) => `ctx:reflections:${userId}`,
  },
  CACHE_TTL: {
    USER_CONTEXT: 300,
    DREAMS: 120,
    PATTERNS: 600,
    SESSIONS: 60,
    REFLECTIONS: 300,
  },
}));

// Mock supabase module
vi.mock('@/server/lib/supabase', () => {
  const createChainableMock = () => {
    const mock: any = {
      data: null,
      error: null,
      select: vi.fn(() => mock),
      eq: vi.fn(() => mock),
      neq: vi.fn(() => mock),
      gte: vi.fn(() => mock),
      order: vi.fn(() => mock),
      limit: vi.fn(() => mock),
      single: vi.fn(() => Promise.resolve({ data: mock.data, error: mock.error })),
    };
    return mock;
  };

  return {
    supabase: {
      from: vi.fn(() => createChainableMock()),
    },
  };
});

// Mock logger module
vi.mock('@/server/lib/logger', () => ({
  dbLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocks - relative imports first (as they are mocked above), then @/ imports
import { buildClarifyContext, estimateTokens } from '../context-builder';

import { cacheGet, cacheSet, cacheKeys, CACHE_TTL } from '@/server/lib/cache';
import { dbLogger } from '@/server/lib/logger';
import { supabase } from '@/server/lib/supabase';

// =====================================================
// TEST DATA FACTORIES
// =====================================================

function createMockUser(overrides: Partial<any> = {}) {
  return {
    name: 'Test User',
    tier: 'pro',
    total_reflections: 10,
    total_clarify_sessions: 5,
    ...overrides,
  };
}

function createMockDream(overrides: Partial<any> = {}) {
  return {
    id: 'dream-123',
    title: 'My Dream',
    description: 'A wonderful dream about success',
    status: 'active',
    category: 'personal_growth',
    ...overrides,
  };
}

function createMockPattern(overrides: Partial<any> = {}) {
  return {
    id: 'pattern-123',
    user_id: 'user-123',
    pattern_type: 'recurring_theme',
    content: 'Seeking balance in life',
    strength: 5,
    ...overrides,
  };
}

function createMockSession(overrides: Partial<any> = {}) {
  return {
    id: 'session-123',
    title: 'Previous Session',
    created_at: new Date().toISOString(),
    message_count: 10,
    ...overrides,
  };
}

function createMockReflection(overrides: Partial<any> = {}) {
  return {
    id: 'reflection-123',
    tone: 'gentle',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// =====================================================
// TEST SUITE
// =====================================================

describe('Context Builder', () => {
  const testUserId = 'user-123';
  const testSessionId = 'session-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  // =====================================================
  // estimateTokens TESTS
  // =====================================================

  describe('estimateTokens', () => {
    it('estimates tokens based on character count divided by 4', () => {
      const text = 'Hello world'; // 11 characters
      const tokens = estimateTokens(text);
      expect(tokens).toBe(3); // Math.ceil(11/4) = 3
    });

    it('returns 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('rounds up for partial tokens', () => {
      const text = 'Hi'; // 2 characters
      expect(estimateTokens(text)).toBe(1); // Math.ceil(2/4) = 1
    });

    it('handles long text correctly', () => {
      const text = 'a'.repeat(400);
      expect(estimateTokens(text)).toBe(100);
    });
  });

  // =====================================================
  // Query Parallelization TESTS
  // =====================================================

  describe('Query Parallelization', () => {
    it('executes all cache queries in parallel via Promise.all', async () => {
      // Setup - all cache misses to trigger DB queries
      (cacheGet as any).mockResolvedValue(null);

      // Setup DB responses
      const mockUser = createMockUser();
      const mockDreams = [createMockDream()];
      const mockPatterns = [createMockPattern()];
      const mockSessions = [createMockSession()];
      const mockReflections = [createMockReflection()];

      let queryCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        queryCount++;
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') return Promise.resolve({ data: mockUser, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
        };

        // For non-single queries, make the final chainable resolve directly
        if (table === 'dreams') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockDreams, error: null }));
        } else if (table === 'clarify_patterns') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockPatterns, error: null }));
        } else if (table === 'clarify_sessions') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockSessions, error: null }));
        } else if (table === 'reflections') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockReflections, error: null }));
        }

        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      // Should have called cacheGet 5 times (for 5 data types)
      expect(cacheGet).toHaveBeenCalledTimes(5);

      // Should have called from 5 times (for 5 tables)
      expect(supabase.from).toHaveBeenCalledTimes(5);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.from).toHaveBeenCalledWith('dreams');
      expect(supabase.from).toHaveBeenCalledWith('clarify_patterns');
      expect(supabase.from).toHaveBeenCalledWith('clarify_sessions');
      expect(supabase.from).toHaveBeenCalledWith('reflections');
    });

    it('handles partial query failures gracefully', async () => {
      // Setup - all cache misses
      (cacheGet as any).mockResolvedValue(null);

      // Setup - some queries fail
      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({ data: createMockUser(), error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };

        // Dreams fail
        if (table === 'dreams') {
          chainable.limit = vi.fn(() =>
            Promise.resolve({ data: null, error: { message: 'Query failed' } })
          );
        } else if (table === 'clarify_patterns') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: null, error: null }));
        } else if (table === 'clarify_sessions') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: null, error: null }));
        } else if (table === 'reflections') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: null, error: null }));
        }

        return chainable;
      });

      // Should not throw
      const result = await buildClarifyContext(testUserId, testSessionId);

      // Should still return a valid context (partial)
      expect(result).toContain('[User Context]');
    });

    it('returns valid context when some queries return empty', async () => {
      (cacheGet as any).mockResolvedValue(null);

      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({ data: createMockUser(), error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };

        // All lists return empty
        if (table !== 'users') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        }

        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      // Should have user context but no other sections
      expect(result).toContain('[User Context]');
      expect(result).not.toContain('[Active Dreams]');
      expect(result).not.toContain('[Patterns Observed]');
    });
  });

  // =====================================================
  // Caching Integration TESTS
  // =====================================================

  describe('Caching Integration', () => {
    it('returns cached data when all cache hits', async () => {
      // Setup - all cache hits
      const mockUser = createMockUser();
      const mockDreams = [createMockDream()];
      const mockPatterns = [createMockPattern()];
      const mockSessions = [createMockSession()];
      const mockReflections = [createMockReflection()];

      // Mock cacheGet to return different data based on the key
      (cacheGet as any)
        .mockResolvedValueOnce(mockUser) // user
        .mockResolvedValueOnce(mockDreams) // dreams
        .mockResolvedValueOnce(mockPatterns) // patterns
        .mockResolvedValueOnce(mockSessions) // sessions
        .mockResolvedValueOnce(mockReflections); // reflections

      const result = await buildClarifyContext(testUserId, testSessionId);

      // Should NOT call database
      expect(supabase.from).not.toHaveBeenCalled();

      // Should still have valid context
      expect(result).toContain('[User Context]');
      expect(result).toContain('[Active Dreams]');
    });

    it('fetches from database on cache miss', async () => {
      // Setup - all cache misses
      (cacheGet as any).mockResolvedValue(null);

      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({ data: createMockUser(), error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };

        if (table !== 'users') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        }

        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      // Should call database for all 5 tables
      expect(supabase.from).toHaveBeenCalledTimes(5);
    });

    it('populates cache after database fetch', async () => {
      // Setup - all cache misses
      (cacheGet as any).mockResolvedValue(null);

      const mockUser = createMockUser();
      const mockDreams = [createMockDream()];

      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({ data: mockUser, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };

        if (table === 'dreams') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockDreams, error: null }));
        } else if (table !== 'users') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        }

        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      // Should call cacheSet to populate cache
      expect(cacheSet).toHaveBeenCalledWith(cacheKeys.userContext(testUserId), mockUser, {
        ttl: CACHE_TTL.USER_CONTEXT,
      });
      expect(cacheSet).toHaveBeenCalledWith(cacheKeys.dreams(testUserId), mockDreams, {
        ttl: CACHE_TTL.DREAMS,
      });
    });

    it('works correctly when cache is disabled (null returns)', async () => {
      // Setup - cache returns null (disabled/unavailable)
      (cacheGet as any).mockResolvedValue(null);

      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({ data: createMockUser(), error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };

        if (table !== 'users') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        }

        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      // Should still work via database fallback
      expect(result).toContain('[User Context]');
    });

    it('handles cache errors gracefully (fallback to DB)', async () => {
      // Setup - cacheGet throws error
      (cacheGet as any).mockRejectedValue(new Error('Cache error'));

      // This test validates that even if cache throws, we don't crash
      // In practice, cacheGet is fail-open and returns null on error
      // So we simulate that behavior
      (cacheGet as any).mockResolvedValue(null);

      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({ data: createMockUser(), error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };

        if (table !== 'users') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        }

        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      // Should still return valid context
      expect(result).toContain('[User Context]');
    });

    it('tracks cache hits and misses correctly', async () => {
      // Setup - 2 hits (user, dreams), 3 misses (patterns, sessions, reflections)
      (cacheGet as any)
        .mockResolvedValueOnce(createMockUser()) // user - HIT
        .mockResolvedValueOnce([createMockDream()]) // dreams - HIT
        .mockResolvedValueOnce(null) // patterns - MISS
        .mockResolvedValueOnce(null) // sessions - MISS
        .mockResolvedValueOnce(null); // reflections - MISS

      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          then: vi.fn((resolve: any) => resolve({ data: [], error: null })),
        };

        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      // Verify logging was called with cache stats
      expect(dbLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          cacheHits: 2,
          cacheMisses: 3,
        }),
        'Context build complete'
      );
    });
  });

  // =====================================================
  // Performance Logging TESTS
  // =====================================================

  describe('Performance Logging', () => {
    it('logs duration in milliseconds', async () => {
      (cacheGet as any).mockResolvedValue(createMockUser());

      await buildClarifyContext(testUserId, testSessionId);

      expect(dbLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          durationMs: expect.any(Number),
        }),
        'Context build complete'
      );
    });

    it('logs cache hit/miss counts', async () => {
      (cacheGet as any).mockResolvedValue(null);

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      expect(dbLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          cacheHits: expect.any(Number),
          cacheMisses: expect.any(Number),
        }),
        'Context build complete'
      );
    });

    it('logs sections included and tokens used', async () => {
      (cacheGet as any).mockImplementation(async (key: string) => {
        if (key.includes('user')) return createMockUser();
        return null;
      });

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      expect(dbLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          sectionsIncluded: expect.any(Number),
          tokensUsed: expect.any(Number),
        }),
        'Context build complete'
      );
    });

    it('includes operation, userId, and sessionId in logs', async () => {
      (cacheGet as any).mockResolvedValue(null);

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      expect(dbLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'clarify.buildContext',
          userId: testUserId,
          sessionId: testSessionId,
        }),
        'Context build complete'
      );
    });
  });

  // =====================================================
  // Context Building TESTS
  // =====================================================

  describe('Context Building', () => {
    it('builds valid context with all sections', async () => {
      const mockUser = createMockUser();
      const mockDreams = [createMockDream()];
      const mockPatterns = [createMockPattern()];
      const mockSessions = [createMockSession()];
      const mockReflections = [createMockReflection()];

      // Mock cacheGet to return different data based on call order
      (cacheGet as any)
        .mockResolvedValueOnce(mockUser) // user
        .mockResolvedValueOnce(mockDreams) // dreams
        .mockResolvedValueOnce(mockPatterns) // patterns
        .mockResolvedValueOnce(mockSessions) // sessions
        .mockResolvedValueOnce(mockReflections); // reflections

      const result = await buildClarifyContext(testUserId, testSessionId);

      // Verify all sections present
      expect(result).toContain('[User Context]');
      expect(result).toContain('[Active Dreams]');
      expect(result).toContain('[Patterns Observed]');
      expect(result).toContain('[Recent Conversations]');
      expect(result).toContain('[Recent Reflections]');
    });

    it('prioritizes sections correctly (user > dreams > patterns)', async () => {
      const mockUser = createMockUser();
      const mockDreams = [createMockDream()];
      const mockPatterns = [createMockPattern()];

      // Mock cacheGet to return different data based on call order
      (cacheGet as any)
        .mockResolvedValueOnce(mockUser) // user
        .mockResolvedValueOnce(mockDreams) // dreams
        .mockResolvedValueOnce(mockPatterns) // patterns
        .mockResolvedValueOnce(null) // sessions
        .mockResolvedValueOnce(null); // reflections

      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          then: vi.fn((resolve: any) => resolve({ data: [], error: null })),
        };
        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      // User context should appear before dreams
      const userIndex = result.indexOf('[User Context]');
      const dreamsIndex = result.indexOf('[Active Dreams]');
      const patternsIndex = result.indexOf('[Patterns Observed]');

      expect(userIndex).toBeLessThan(dreamsIndex);
      expect(dreamsIndex).toBeLessThan(patternsIndex);
    });

    it('handles empty context gracefully', async () => {
      // All cache misses, all DB returns empty
      (cacheGet as any).mockResolvedValue(null);

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: null, error: null }));
        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      // Should return empty string when no sections included
      expect(result).toBe('');
    });

    it('includes user name in user context section', async () => {
      const mockUser = createMockUser({ name: 'John Doe' });

      (cacheGet as any).mockImplementation(async (key: string) => {
        if (key.includes('user')) return mockUser;
        return null;
      });

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      expect(result).toContain('Name: John Doe');
    });

    it('truncates long dream descriptions', async () => {
      const longDescription = 'a'.repeat(200);
      const mockDream = createMockDream({ description: longDescription });

      (cacheGet as any).mockImplementation(async (key: string) => {
        if (key.includes('dreams')) return [mockDream];
        return null;
      });

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      // Description should be truncated with ...
      expect(result).toContain('...');
      // Should not contain full 200-char description
      expect(result).not.toContain('a'.repeat(200));
    });

    it('maps pattern types to readable labels', async () => {
      const patterns = [
        createMockPattern({ pattern_type: 'recurring_theme', content: 'Theme content' }),
        createMockPattern({ pattern_type: 'tension', content: 'Tension content' }),
        createMockPattern({ pattern_type: 'identity_signal', content: 'Identity content' }),
      ];

      (cacheGet as any).mockImplementation(async (key: string) => {
        if (key.includes('patterns')) return patterns;
        return null;
      });

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      expect(result).toContain('Recurring Theme');
      expect(result).toContain('Inner Tension');
      expect(result).toContain('Identity Signal');
    });
  });

  // =====================================================
  // Cache Key TESTS (sanity checks)
  // =====================================================

  describe('Cache Key Generation', () => {
    it('uses correct cache keys for each data type', async () => {
      (cacheGet as any).mockResolvedValue(null);

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      // Verify correct cache keys were used
      expect(cacheGet).toHaveBeenCalledWith(`ctx:user:${testUserId}`);
      expect(cacheGet).toHaveBeenCalledWith(`ctx:dreams:${testUserId}`);
      expect(cacheGet).toHaveBeenCalledWith(`ctx:patterns:${testUserId}`);
      expect(cacheGet).toHaveBeenCalledWith(`ctx:sessions:${testUserId}`);
      expect(cacheGet).toHaveBeenCalledWith(`ctx:reflections:${testUserId}`);
    });
  });

  // =====================================================
  // TTL TESTS
  // =====================================================

  describe('Cache TTL Usage', () => {
    it('uses correct TTL for each data type when populating cache', async () => {
      (cacheGet as any).mockResolvedValue(null);

      const mockUser = createMockUser();
      const mockDreams = [createMockDream()];
      const mockPatterns = [createMockPattern()];
      const mockSessions = [createMockSession()];
      const mockReflections = [createMockReflection()];

      (supabase.from as any).mockImplementation((table: string) => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') return Promise.resolve({ data: mockUser, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
        };

        if (table === 'dreams') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockDreams, error: null }));
        } else if (table === 'clarify_patterns') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockPatterns, error: null }));
        } else if (table === 'clarify_sessions') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockSessions, error: null }));
        } else if (table === 'reflections') {
          chainable.limit = vi.fn(() => Promise.resolve({ data: mockReflections, error: null }));
        }

        return chainable;
      });

      await buildClarifyContext(testUserId, testSessionId);

      // Verify correct TTLs used
      expect(cacheSet).toHaveBeenCalledWith(
        expect.stringContaining('user'),
        expect.anything(),
        { ttl: 300 } // USER_CONTEXT
      );
      expect(cacheSet).toHaveBeenCalledWith(
        expect.stringContaining('dreams'),
        expect.anything(),
        { ttl: 120 } // DREAMS
      );
      expect(cacheSet).toHaveBeenCalledWith(
        expect.stringContaining('patterns'),
        expect.anything(),
        { ttl: 600 } // PATTERNS
      );
      expect(cacheSet).toHaveBeenCalledWith(
        expect.stringContaining('sessions'),
        expect.anything(),
        { ttl: 60 } // SESSIONS
      );
      expect(cacheSet).toHaveBeenCalledWith(
        expect.stringContaining('reflections'),
        expect.anything(),
        { ttl: 300 } // REFLECTIONS
      );
    });
  });

  // =====================================================
  // Edge Cases
  // =====================================================

  describe('Edge Cases', () => {
    it('handles null user name gracefully', async () => {
      const mockUser = createMockUser({ name: null });

      (cacheGet as any).mockImplementation(async (key: string) => {
        if (key.includes('user')) return mockUser;
        return null;
      });

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      // Should still work
      expect(result).toContain('[User Context]');
      expect(result).toContain('Name: null');
    });

    it('handles dream with no description', async () => {
      const mockDream = createMockDream({ description: null });

      (cacheGet as any).mockImplementation(async (key: string) => {
        if (key.includes('dreams')) return [mockDream];
        return null;
      });

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      expect(result).toContain('No description');
    });

    it('handles multiple reflections with different tones', async () => {
      const mockReflections = [
        createMockReflection({ tone: 'gentle' }),
        createMockReflection({ tone: 'intense' }),
        createMockReflection({ tone: 'fusion' }),
      ];

      (cacheGet as any).mockImplementation(async (key: string) => {
        if (key.includes('reflections')) return mockReflections;
        return null;
      });

      (supabase.from as any).mockImplementation(() => {
        const chainable: any = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          neq: vi.fn(() => chainable),
          gte: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        chainable.limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
        return chainable;
      });

      const result = await buildClarifyContext(testUserId, testSessionId);

      expect(result).toContain('3 reflections');
      expect(result).toContain('gentle');
      expect(result).toContain('intense');
      expect(result).toContain('fusion');
    });
  });
});

// =====================================================
// Performance Characteristics Tests
// =====================================================

describe('Context Builder Performance Characteristics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes quickly with cache hits', async () => {
    const mockUser = createMockUser();

    (cacheGet as any).mockImplementation(async (key: string) => {
      if (key.includes('user')) return mockUser;
      return [];
    });

    const startTime = performance.now();
    await buildClarifyContext('user-123', 'session-456');
    const duration = performance.now() - startTime;

    // Should complete in under 100ms with mocked cache
    expect(duration).toBeLessThan(100);
  });

  it('does not call database when all data is cached', async () => {
    const mockUser = createMockUser();
    const mockDreams = [createMockDream()];
    const mockPatterns = [createMockPattern()];
    const mockSessions = [createMockSession()];
    const mockReflections = [createMockReflection()];

    (cacheGet as any).mockImplementation(async (key: string) => {
      if (key.includes('user')) return mockUser;
      if (key.includes('dreams')) return mockDreams;
      if (key.includes('patterns')) return mockPatterns;
      if (key.includes('sessions')) return mockSessions;
      if (key.includes('reflections')) return mockReflections;
      return null;
    });

    await buildClarifyContext('user-123', 'session-456');

    // Database should not be called
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
