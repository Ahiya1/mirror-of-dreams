// test/integration/clarify/clarify.test.ts
// Comprehensive integration tests for the Clarify router (server/trpc/routers/clarify.ts)

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, anthropicMock, cacheMock, supabaseMock } from '../setup';

import {
  createMockClarifySessionRow,
  createMockClarifyMessageRow,
  createMockClarifyPatternRow,
} from '@/test/factories/clarify.factory';
import {
  freeTierUser,
  proTierUser,
  unlimitedTierUser,
  creatorUser,
  adminUser,
  demoUser,
  createMockUser,
} from '@/test/factories/user.factory';

// =============================================================================
// CONSTANTS
// =============================================================================

const TEST_SESSION_ID = '12345678-1234-1234-1234-123456789012';
const TEST_MESSAGE_ID = 'abcdef12-3456-7890-abcd-ef1234567890';
const TEST_DREAM_ID = 'fedcba98-7654-3210-fedc-ba9876543210';
const TEST_CURSOR_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

// Set up environment variable for Anthropic API
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
});

// =============================================================================
// getLimits Tests (5 tests)
// Note: Demo users are blocked by checkClarifyAccess middleware since they have free tier
// =============================================================================

describe('clarify.getLimits', () => {
  describe('success cases', () => {
    it('TC-GL-01: should return correct limits for pro tier', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.clarify.getLimits();

      expect(result).toEqual({
        tier: 'pro',
        sessionsUsed: proTierUser.clarifySessionsThisMonth,
        sessionsLimit: 20, // Pro limit from CLARIFY_SESSION_LIMITS
        sessionsRemaining: 20 - proTierUser.clarifySessionsThisMonth,
        canCreateSession: true,
      });
    });

    it('TC-GL-02: should return correct limits for unlimited tier', async () => {
      const { caller } = createTestCaller(unlimitedTierUser);

      const result = await caller.clarify.getLimits();

      expect(result).toEqual({
        tier: 'unlimited',
        sessionsUsed: unlimitedTierUser.clarifySessionsThisMonth,
        sessionsLimit: 30, // Unlimited limit from CLARIFY_SESSION_LIMITS
        sessionsRemaining: 30 - unlimitedTierUser.clarifySessionsThisMonth,
        canCreateSession: true,
      });
    });

    it('TC-GL-03: should return canCreateSession=true when under limit', async () => {
      const proUnderLimit = createMockUser({
        ...proTierUser,
        clarifySessionsThisMonth: 5, // Under 20 limit
      });
      const { caller } = createTestCaller(proUnderLimit);

      const result = await caller.clarify.getLimits();

      expect(result.canCreateSession).toBe(true);
      expect(result.sessionsRemaining).toBe(15);
    });

    it('TC-GL-04: should return canCreateSession=false when at limit', async () => {
      const proAtLimit = createMockUser({
        ...proTierUser,
        clarifySessionsThisMonth: 20, // At pro limit
      });
      const { caller } = createTestCaller(proAtLimit);

      const result = await caller.clarify.getLimits();

      expect(result.canCreateSession).toBe(false);
      expect(result.sessionsRemaining).toBe(0);
    });

    it('TC-GL-05: should return canCreateSession=true for creator at limit', async () => {
      const creatorAtLimit = createMockUser({
        ...creatorUser,
        clarifySessionsThisMonth: 100, // Way over any limit
      });
      const { caller } = createTestCaller(creatorAtLimit);

      const result = await caller.clarify.getLimits();

      expect(result.canCreateSession).toBe(true);
    });
  });

  describe('authorization', () => {
    it('TC-GL-06: should reject free tier user (including demo)', async () => {
      // Note: clarifyReadProcedure blocks free tier users via checkClarifyAccess
      const { caller } = createTestCaller(freeTierUser);

      await expect(caller.clarify.getLimits()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('subscription'),
      });
    });
  });
});

// =============================================================================
// getPatterns Tests (4 tests)
// =============================================================================

describe('clarify.getPatterns', () => {
  describe('success cases', () => {
    it('TC-GP-01: should return user patterns', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockPatterns = [
        createMockClarifyPatternRow({
          id: 'pattern-1',
          user_id: proTierUser.id,
          pattern_type: 'recurring_theme',
          content: 'User frequently mentions creative expression',
          strength: 0.85,
        }),
        createMockClarifyPatternRow({
          id: 'pattern-2',
          user_id: proTierUser.id,
          pattern_type: 'tension',
          content: 'Conflict between stability and adventure',
          strength: 0.7,
        }),
      ];

      mockQueries({
        clarify_patterns: { data: mockPatterns, error: null },
      });

      const result = await caller.clarify.getPatterns();

      expect(result.patterns).toHaveLength(2);
      expect(result.patterns[0]).toMatchObject({
        patternType: 'recurring_theme',
        content: 'User frequently mentions creative expression',
      });
    });

    it('TC-GP-02: should return empty array when no patterns', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_patterns: { data: [], error: null },
      });

      const result = await caller.clarify.getPatterns();

      expect(result.patterns).toEqual([]);
    });
  });

  describe('authorization', () => {
    it('TC-GP-03: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.clarify.getPatterns()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Authentication required'),
      });
    });

    it('TC-GP-04: should reject demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      await expect(caller.clarify.getPatterns()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('demo'),
      });
    });
  });
});

// =============================================================================
// archiveSession Tests (5 tests)
// =============================================================================

describe('clarify.archiveSession', () => {
  describe('success cases', () => {
    it('TC-AS-01: should archive owned session successfully', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Mock ownership check and update - both succeed
      mockQueries({
        clarify_sessions: { data: { id: TEST_SESSION_ID }, error: null },
      });

      const result = await caller.clarify.archiveSession({ sessionId: TEST_SESSION_ID });

      expect(result.success).toBe(true);
    });
  });

  describe('authorization', () => {
    it('TC-AS-02: should reject archiving non-owned session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Session not found (wrong owner)
      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(
        caller.clarify.archiveSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    });

    it('TC-AS-04: should reject demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      await expect(
        caller.clarify.archiveSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('demo'),
      });
    });
  });

  describe('error handling', () => {
    it('TC-AS-03: should reject archiving non-existent session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(
        caller.clarify.archiveSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    });

    // Note: Testing database update error requires more complex mock setup
    // The current mockQueries returns same response for all clarify_sessions calls
    // In practice, ownership check succeeds then update could fail
    it('TC-AS-05: should verify ownership check happens', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: { id: TEST_SESSION_ID }, error: null },
      });

      await caller.clarify.archiveSession({ sessionId: TEST_SESSION_ID });

      // Verify clarify_sessions was called
      expect(supabase.from).toHaveBeenCalledWith('clarify_sessions');
    });
  });
});

// =============================================================================
// restoreSession Tests (5 tests)
// =============================================================================

describe('clarify.restoreSession', () => {
  describe('success cases', () => {
    it('TC-RS-01: should restore archived session successfully', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: { id: TEST_SESSION_ID, status: 'archived' }, error: null },
      });

      const result = await caller.clarify.restoreSession({ sessionId: TEST_SESSION_ID });

      expect(result.success).toBe(true);
    });
  });

  describe('authorization', () => {
    it('TC-RS-02: should reject restoring non-owned session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(
        caller.clarify.restoreSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    });

    it('TC-RS-04: should reject demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      await expect(
        caller.clarify.restoreSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('demo'),
      });
    });
  });

  describe('error handling', () => {
    it('TC-RS-03: should reject restoring non-existent session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(
        caller.clarify.restoreSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    });

    it('TC-RS-05: should verify ownership check happens', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: { id: TEST_SESSION_ID }, error: null },
      });

      await caller.clarify.restoreSession({ sessionId: TEST_SESSION_ID });

      expect(supabase.from).toHaveBeenCalledWith('clarify_sessions');
    });
  });
});

// =============================================================================
// updateTitle Tests (5 tests)
// =============================================================================

describe('clarify.updateTitle', () => {
  describe('success cases', () => {
    it('TC-UT-01: should update title successfully', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: { id: TEST_SESSION_ID }, error: null },
      });

      const result = await caller.clarify.updateTitle({
        sessionId: TEST_SESSION_ID,
        title: 'New Session Title',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('authorization', () => {
    it('TC-UT-02: should reject updating non-owned session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(
        caller.clarify.updateTitle({ sessionId: TEST_SESSION_ID, title: 'New Title' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    });

    it('TC-UT-03: should reject demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      await expect(
        caller.clarify.updateTitle({ sessionId: TEST_SESSION_ID, title: 'New Title' })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('demo'),
      });
    });
  });

  describe('validation', () => {
    it('TC-UT-04: should reject empty title', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.clarify.updateTitle({ sessionId: TEST_SESSION_ID, title: '' })
      ).rejects.toThrow();
    });

    it('TC-UT-05: should reject title exceeding max length', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.clarify.updateTitle({ sessionId: TEST_SESSION_ID, title: 'x'.repeat(101) })
      ).rejects.toThrow();
    });
  });
});

// =============================================================================
// deleteSession Tests (5 tests)
// =============================================================================

describe('clarify.deleteSession', () => {
  describe('success cases', () => {
    it('TC-DS-01: should delete owned session successfully', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: { id: TEST_SESSION_ID }, error: null },
      });

      const result = await caller.clarify.deleteSession({ sessionId: TEST_SESSION_ID });

      expect(result.success).toBe(true);
    });
  });

  describe('authorization', () => {
    it('TC-DS-02: should reject deleting non-owned session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(
        caller.clarify.deleteSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    });

    it('TC-DS-04: should reject demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      await expect(
        caller.clarify.deleteSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('demo'),
      });
    });
  });

  describe('error handling', () => {
    it('TC-DS-03: should reject deleting non-existent session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(
        caller.clarify.deleteSession({ sessionId: TEST_SESSION_ID })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    });

    it('TC-DS-05: should verify ownership check happens', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: { id: TEST_SESSION_ID }, error: null },
      });

      await caller.clarify.deleteSession({ sessionId: TEST_SESSION_ID });

      expect(supabase.from).toHaveBeenCalledWith('clarify_sessions');
    });
  });
});

// =============================================================================
// getSession Tests (6 tests)
// =============================================================================

describe('clarify.getSession', () => {
  describe('success cases', () => {
    it('TC-GS-01: should return session with messages for owner', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockSession = createMockClarifySessionRow({
        id: TEST_SESSION_ID,
        user_id: proTierUser.id,
        title: 'My Session',
        status: 'active',
        message_count: 2,
      });

      const mockMessages = [
        createMockClarifyMessageRow({
          id: 'msg-1',
          session_id: TEST_SESSION_ID,
          role: 'user',
          content: 'Hello',
        }),
        createMockClarifyMessageRow({
          id: 'msg-2',
          session_id: TEST_SESSION_ID,
          role: 'assistant',
          content: 'Hi there!',
        }),
      ];

      mockQueries({
        clarify_sessions: { data: mockSession, error: null },
        clarify_messages: { data: mockMessages, error: null },
      });

      const result = await caller.clarify.getSession({ sessionId: TEST_SESSION_ID });

      expect(result.session).toMatchObject({
        id: TEST_SESSION_ID,
        title: 'My Session',
        status: 'active',
      });
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[1].role).toBe('assistant');
    });

    it('TC-GS-05: should handle session with no messages', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockSession = createMockClarifySessionRow({
        id: TEST_SESSION_ID,
        user_id: proTierUser.id,
        message_count: 0,
      });

      mockQueries({
        clarify_sessions: { data: mockSession, error: null },
        clarify_messages: { data: [], error: null },
      });

      const result = await caller.clarify.getSession({ sessionId: TEST_SESSION_ID });

      expect(result.session).toBeDefined();
      expect(result.messages).toEqual([]);
    });
  });

  describe('authorization', () => {
    it('TC-GS-02: should reject free tier user (including demo)', async () => {
      // Note: clarifyReadProcedure blocks free tier via checkClarifyAccess
      const { caller } = createTestCaller(freeTierUser);

      await expect(caller.clarify.getSession({ sessionId: TEST_SESSION_ID })).rejects.toMatchObject(
        {
          code: 'FORBIDDEN',
          message: expect.stringContaining('subscription'),
        }
      );
    });

    it("TC-GS-04: should reject request for other user's session", async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Session not found for this user
      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(caller.clarify.getSession({ sessionId: TEST_SESSION_ID })).rejects.toMatchObject(
        {
          code: 'NOT_FOUND',
          message: 'Session not found',
        }
      );
    });
  });

  describe('error handling', () => {
    it('TC-GS-03: should reject request for non-existent session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(caller.clarify.getSession({ sessionId: TEST_SESSION_ID })).rejects.toMatchObject(
        {
          code: 'NOT_FOUND',
          message: 'Session not found',
        }
      );
    });

    it('TC-GS-06: should handle invalid session ID format', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(caller.clarify.getSession({ sessionId: 'not-a-valid-uuid' })).rejects.toThrow();
    });
  });
});

// =============================================================================
// listSessions Tests (7 tests)
// =============================================================================

describe('clarify.listSessions', () => {
  describe('success cases', () => {
    it("TC-LS-01: should return user's sessions ordered by last_message_at", async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockSessions = [
        createMockClarifySessionRow({
          id: 'session-1',
          user_id: proTierUser.id,
          title: 'Session 1',
          last_message_at: '2025-01-15T10:00:00Z',
        }),
        createMockClarifySessionRow({
          id: 'session-2',
          user_id: proTierUser.id,
          title: 'Session 2',
          last_message_at: '2025-01-14T10:00:00Z',
        }),
      ];

      mockQueries({
        clarify_sessions: { data: mockSessions, error: null },
      });

      const result = await caller.clarify.listSessions({});

      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].title).toBe('Session 1');
      expect(result.sessions[1].title).toBe('Session 2');
    });

    it('TC-LS-02: should filter by status (active)', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockSessions = [
        createMockClarifySessionRow({
          id: 'session-1',
          user_id: proTierUser.id,
          status: 'active',
        }),
      ];

      mockQueries({
        clarify_sessions: { data: mockSessions, error: null },
      });

      const result = await caller.clarify.listSessions({ status: 'active' });

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].status).toBe('active');
    });

    it('TC-LS-03: should filter by status (archived)', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockSessions = [
        createMockClarifySessionRow({
          id: 'session-1',
          user_id: proTierUser.id,
          status: 'archived',
        }),
      ];

      mockQueries({
        clarify_sessions: { data: mockSessions, error: null },
      });

      const result = await caller.clarify.listSessions({ status: 'archived' });

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].status).toBe('archived');
    });

    it('TC-LS-04: should handle pagination with valid UUID cursor', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const olderSessions = Array.from({ length: 3 }, (_, i) =>
        createMockClarifySessionRow({
          id: `1234567${i}-1234-1234-1234-123456789012`,
          user_id: proTierUser.id,
          last_message_at: `2025-01-${14 - i}T10:00:00Z`,
        })
      );

      mockQueries({
        clarify_sessions: { data: olderSessions, error: null },
      });

      const result = await caller.clarify.listSessions({
        cursor: TEST_CURSOR_ID,
        limit: 3,
      });

      expect(result.sessions.length).toBeLessThanOrEqual(3);
    });

    it('TC-LS-05: should respect limit parameter', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Return more items than limit to test pagination
      const mockSessions = Array.from({ length: 6 }, (_, i) =>
        createMockClarifySessionRow({
          id: `session-${i}-1234-1234-1234-123456789012`,
          user_id: proTierUser.id,
        })
      );

      mockQueries({
        clarify_sessions: { data: mockSessions, error: null },
      });

      const result = await caller.clarify.listSessions({ limit: 5 });

      expect(result.sessions.length).toBe(5);
      expect(result.nextCursor).toBeDefined();
    });

    it('TC-LS-07: should handle empty results', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: [], error: null },
      });

      const result = await caller.clarify.listSessions({});

      expect(result.sessions).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('authorization', () => {
    it('TC-LS-08: should reject free tier user (including demo)', async () => {
      // Note: clarifyReadProcedure blocks free tier via checkClarifyAccess
      const { caller } = createTestCaller(freeTierUser);

      await expect(caller.clarify.listSessions({})).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('subscription'),
      });
    });
  });
});

// =============================================================================
// createSession Tests (15 tests)
// =============================================================================

describe('clarify.createSession', () => {
  describe('success cases', () => {
    it('TC-CS-01: should create session without initial message', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockSession = createMockClarifySessionRow({
        id: TEST_SESSION_ID,
        user_id: proTierUser.id,
        title: 'New Clarify Session',
        status: 'active',
      });

      mockQueries({
        clarify_sessions: { data: mockSession, error: null },
        users: { data: null, error: null },
      });

      const result = await caller.clarify.createSession({});

      expect(result.session).toMatchObject({
        id: TEST_SESSION_ID,
        title: 'New Clarify Session',
        status: 'active',
      });
      expect(result.initialResponse).toBeNull();
      expect(result.toolUseResult).toBeNull();
      expect(result.usage).toBeDefined();
    });

    it('TC-CS-04: should verify user counters updated after creation', async () => {
      const { caller, mockQueries, supabase } = createTestCaller(proTierUser);

      const mockSession = createMockClarifySessionRow({
        id: TEST_SESSION_ID,
        user_id: proTierUser.id,
      });

      mockQueries({
        clarify_sessions: { data: mockSession, error: null },
        users: { data: null, error: null },
      });

      await caller.clarify.createSession({});

      // Verify users table was called for update
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('TC-CS-05: should invalidate sessions cache after creation', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: {
          data: createMockClarifySessionRow({ user_id: proTierUser.id }),
          error: null,
        },
        users: { data: null, error: null },
      });

      await caller.clarify.createSession({});

      expect(cacheMock.cacheDelete).toHaveBeenCalledWith(`ctx:sessions:${proTierUser.id}`);
    });

    it('TC-CS-06: should return correct usage stats in response', async () => {
      const proWithUsage = createMockUser({
        ...proTierUser,
        clarifySessionsThisMonth: 5,
      });
      const { caller, mockQueries } = createTestCaller(proWithUsage);

      mockQueries({
        clarify_sessions: {
          data: createMockClarifySessionRow({ user_id: proWithUsage.id }),
          error: null,
        },
        users: { data: null, error: null },
      });

      const result = await caller.clarify.createSession({});

      expect(result.usage).toEqual({
        sessionsUsed: 6, // 5 + 1
        sessionsLimit: 20, // Pro limit
      });
    });
  });

  describe('authorization', () => {
    it('TC-CS-07: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.clarify.createSession({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Authentication required'),
      });
    });

    it('TC-CS-08: should reject demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      await expect(caller.clarify.createSession({})).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('demo'),
      });
    });

    it('TC-CS-09: should reject free tier user', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(caller.clarify.createSession({})).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringMatching(/Clarify.*requires.*subscription|tier/i),
      });
    });

    it('TC-CS-10: should reject pro tier at session limit', async () => {
      const proAtLimit = createMockUser({
        ...proTierUser,
        clarifySessionsThisMonth: 20, // Pro limit is 20
      });
      const { caller } = createTestCaller(proAtLimit);

      await expect(caller.clarify.createSession({})).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringMatching(/session.*limit/i),
      });
    });

    it('TC-CS-11: should allow creator to bypass limits', async () => {
      const creatorAtLimit = createMockUser({
        ...creatorUser,
        clarifySessionsThisMonth: 100, // Way over any limit
      });
      const { caller, mockQueries } = createTestCaller(creatorAtLimit);

      mockQueries({
        clarify_sessions: {
          data: createMockClarifySessionRow({ user_id: creatorAtLimit.id }),
          error: null,
        },
        users: { data: null, error: null },
      });

      const result = await caller.clarify.createSession({});
      expect(result.session).toBeDefined();
    });

    it('TC-CS-12: should allow admin to bypass limits', async () => {
      const adminAtLimit = createMockUser({
        ...adminUser,
        clarifySessionsThisMonth: 100, // Way over any limit
      });
      const { caller, mockQueries } = createTestCaller(adminAtLimit);

      mockQueries({
        clarify_sessions: {
          data: createMockClarifySessionRow({ user_id: adminAtLimit.id }),
          error: null,
        },
        users: { data: null, error: null },
      });

      const result = await caller.clarify.createSession({});
      expect(result.session).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('TC-CS-13: should handle session creation database error', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: { data: null, error: new Error('Database connection failed') },
      });

      await expect(caller.clarify.createSession({})).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create session',
      });
    });
  });
});

// =============================================================================
// sendMessage Tests (Basic - without tool use, which requires context building)
// Note: Full sendMessage tests require mocking the context builder which needs CACHE_TTL
// =============================================================================

describe('clarify.sendMessage', () => {
  describe('authorization', () => {
    it('TC-SM-12: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.clarify.sendMessage({
          sessionId: TEST_SESSION_ID,
          content: 'Hello',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Authentication required'),
      });
    });

    it('TC-SM-13: should reject demo user', async () => {
      const { caller } = createTestCaller(demoUser);

      await expect(
        caller.clarify.sendMessage({
          sessionId: TEST_SESSION_ID,
          content: 'Hello',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('demo'),
      });
    });

    it('TC-SM-14: should reject message to non-owned session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      // Return no session for ownership check
      mockQueries({
        clarify_sessions: { data: null, error: null },
      });

      await expect(
        caller.clarify.sendMessage({
          sessionId: TEST_SESSION_ID,
          content: 'Hello',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    });
  });

  describe('input validation', () => {
    it('should reject invalid sessionId format', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.clarify.sendMessage({
          sessionId: 'not-a-valid-uuid',
          content: 'Hello',
        })
      ).rejects.toThrow();
    });

    it('should reject empty content', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.clarify.sendMessage({
          sessionId: TEST_SESSION_ID,
          content: '',
        })
      ).rejects.toThrow();
    });

    it('should reject content exceeding max length', async () => {
      const { caller } = createTestCaller(proTierUser);

      await expect(
        caller.clarify.sendMessage({
          sessionId: TEST_SESSION_ID,
          content: 'x'.repeat(4001), // Max is 4000
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('TC-SM-17: should handle user message save failure', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      const mockSession = createMockClarifySessionRow({
        id: TEST_SESSION_ID,
        user_id: proTierUser.id,
      });

      mockQueries({
        clarify_sessions: { data: mockSession, error: null },
        clarify_messages: { data: null, error: new Error('Failed to save message') },
      });

      await expect(
        caller.clarify.sendMessage({
          sessionId: TEST_SESSION_ID,
          content: 'Hello',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save message',
      });
    });
  });
});

// =============================================================================
// Additional Coverage Tests
// =============================================================================

describe('clarify router - additional coverage', () => {
  describe('middleware behavior', () => {
    it('should allow admin to access patterns', async () => {
      const { caller, mockQueries } = createTestCaller(adminUser);

      mockQueries({
        clarify_patterns: { data: [], error: null },
      });

      const result = await caller.clarify.getPatterns();
      expect(result.patterns).toEqual([]);
    });

    it('should allow creator to access patterns', async () => {
      const { caller, mockQueries } = createTestCaller(creatorUser);

      mockQueries({
        clarify_patterns: { data: [], error: null },
      });

      const result = await caller.clarify.getPatterns();
      expect(result.patterns).toEqual([]);
    });

    it('should enforce free tier restriction', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.clarify.sendMessage({
          sessionId: TEST_SESSION_ID,
          content: 'Hello',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('session state transitions', () => {
    it('should handle archiving an active session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: {
          data: { id: TEST_SESSION_ID, status: 'active' },
          error: null,
        },
      });

      const result = await caller.clarify.archiveSession({ sessionId: TEST_SESSION_ID });
      expect(result.success).toBe(true);
    });

    it('should handle restoring an archived session', async () => {
      const { caller, mockQueries } = createTestCaller(proTierUser);

      mockQueries({
        clarify_sessions: {
          data: { id: TEST_SESSION_ID, status: 'archived' },
          error: null,
        },
      });

      const result = await caller.clarify.restoreSession({ sessionId: TEST_SESSION_ID });
      expect(result.success).toBe(true);
    });
  });

  describe('limits edge cases', () => {
    it('should handle unlimited tier at high usage', async () => {
      const unlimitedHighUsage = createMockUser({
        ...unlimitedTierUser,
        clarifySessionsThisMonth: 25,
      });
      const { caller } = createTestCaller(unlimitedHighUsage);

      const result = await caller.clarify.getLimits();

      expect(result.sessionsRemaining).toBe(5);
      expect(result.canCreateSession).toBe(true);
    });

    it('should handle admin at any usage level', async () => {
      const adminHighUsage = createMockUser({
        ...adminUser,
        clarifySessionsThisMonth: 1000,
      });
      const { caller } = createTestCaller(adminHighUsage);

      const result = await caller.clarify.getLimits();

      expect(result.canCreateSession).toBe(true);
    });

    it('should reject unlimited tier at session limit', async () => {
      const unlimitedAtLimit = createMockUser({
        ...unlimitedTierUser,
        clarifySessionsThisMonth: 30, // Unlimited limit
      });
      const { caller } = createTestCaller(unlimitedAtLimit);

      await expect(caller.clarify.createSession({})).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringMatching(/session.*limit/i),
      });
    });
  });
});
