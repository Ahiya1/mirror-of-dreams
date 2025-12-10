// test/integration/setup.ts - Integration test caller setup
// Creates test callers with mocked dependencies for tRPC router testing

import { vi } from 'vitest';

import type { User } from '@/types';

// Use vi.hoisted to create mocks before vi.mock runs
const {
  supabaseMock,
  createSupabaseQueryMock,
  cookieMock,
  createMockLogger,
  rateLimitMock,
  cacheMock,
  promptsMock,
  anthropicMock,
} = vi.hoisted(() => {
  const createQueryMock = <T>(response: {
    data: T | null;
    error: Error | null;
    count?: number;
  }) => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(response),
      maybeSingle: vi.fn().mockResolvedValue(response),
      then: vi.fn((resolve: (value: typeof response) => void) => resolve(response)),
    };
    return mockChain;
  };

  const supabase: { from: ReturnType<typeof vi.fn>; auth: any; storage: any; rpc: any } = {
    from: vi.fn((_table: string) => createQueryMock({ data: null, error: null })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://example.com/public-url' } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed-url' },
          error: null,
        }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const cookie = {
    getAuthCookie: vi.fn().mockResolvedValue(null),
    setAuthCookie: vi.fn().mockResolvedValue(undefined),
    clearAuthCookie: vi.fn().mockResolvedValue(undefined),
  };

  // Helper to create a mock logger
  const mockLogger = () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  });

  // Rate limit bypass mock - always allows requests
  const rateLimit = {
    checkRateLimit: vi.fn().mockImplementation(() =>
      Promise.resolve({
        success: true,
        limit: 999,
        remaining: 999,
        reset: 0,
      })
    ),
  };

  // Cache mock - fail-open behavior (returns null by default)
  const cache = {
    cacheDelete: vi.fn().mockResolvedValue(undefined),
    cacheGet: vi.fn().mockResolvedValue(null),
    cacheSet: vi.fn().mockResolvedValue(undefined),
    cacheKeys: {
      reflections: (userId: string) => `ctx:reflections:${userId}`,
      userContext: (userId: string) => `ctx:user:${userId}`,
      dreams: (userId: string) => `ctx:dreams:${userId}`,
      patterns: (userId: string) => `ctx:patterns:${userId}`,
      sessions: (userId: string) => `ctx:sessions:${userId}`,
    },
  };

  // Prompts mock - eliminates filesystem dependencies
  const prompts = {
    loadPrompts: vi.fn().mockResolvedValue('Mocked system prompt for reflection generation'),
    loadEvolutionPrompt: vi.fn().mockResolvedValue('Mocked evolution prompt'),
    buildReflectionUserPrompt: vi.fn().mockReturnValue('Mocked user prompt'),
  };

  // Enhanced Anthropic mock with configurable responses
  const anthropicMessagesCreate = vi.fn().mockResolvedValue({
    id: 'msg_test_12345',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Your journey speaks to the depths of your soul. This dream reflects your inner wisdom and courage to grow. The path you have chosen reveals your readiness for transformation.',
      },
    ],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 50 },
  });

  const anthropicClient = {
    messages: {
      create: anthropicMessagesCreate,
      stream: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        [Symbol.asyncIterator]: vi.fn().mockImplementation(async function* () {
          yield { type: 'message_stop' };
        }),
        finalMessage: anthropicMessagesCreate,
      }),
    },
    beta: {
      messages: {
        create: anthropicMessagesCreate,
        stream: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          [Symbol.asyncIterator]: vi.fn().mockImplementation(async function* () {
            yield { type: 'message_stop' };
          }),
          finalMessage: anthropicMessagesCreate,
        }),
      },
    },
  };

  return {
    supabaseMock: supabase,
    createSupabaseQueryMock: createQueryMock,
    cookieMock: cookie,
    createMockLogger: mockLogger,
    rateLimitMock: rateLimit,
    cacheMock: cache,
    promptsMock: prompts,
    anthropicMock: anthropicClient,
  };
});

// Mock the modules using the hoisted mocks
vi.mock('@/server/lib/supabase', () => ({
  supabase: supabaseMock,
}));

vi.mock('@/server/lib/cookies', () => ({
  getAuthCookie: () => cookieMock.getAuthCookie(),
  setAuthCookie: (token: string, isDemo?: boolean) => cookieMock.setAuthCookie(token, isDemo),
  clearAuthCookie: () => cookieMock.clearAuthCookie(),
}));

// Bypass rate limiting in tests - use hoisted mock
vi.mock('@/server/lib/rate-limiter', () => ({
  authRateLimiter: null,
  aiRateLimiter: null,
  writeRateLimiter: null,
  globalRateLimiter: null,
  checkRateLimit: rateLimitMock.checkRateLimit,
}));

// Mock logger to suppress output in tests
vi.mock('@/server/lib/logger', () => ({
  logger: createMockLogger(),
  authLogger: createMockLogger(),
  dbLogger: createMockLogger(),
  aiLogger: createMockLogger(),
  paymentLogger: createMockLogger(),
  emailLogger: createMockLogger(),
  reflectionLogger: createMockLogger(),
  subscriptionLogger: createMockLogger(),
  evolutionLogger: createMockLogger(),
}));

// Mock email sending
vi.mock('@/server/lib/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
  generateToken: vi.fn().mockReturnValue('mock-verification-token'),
  getVerificationTokenExpiration: vi
    .fn()
    .mockReturnValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
}));

// Mock cache module
vi.mock('@/server/lib/cache', () => ({
  cacheDelete: cacheMock.cacheDelete,
  cacheGet: cacheMock.cacheGet,
  cacheSet: cacheMock.cacheSet,
  cacheKeys: cacheMock.cacheKeys,
}));

// Mock prompts module
vi.mock('@/server/lib/prompts', () => ({
  loadPrompts: promptsMock.loadPrompts,
  loadEvolutionPrompt: promptsMock.loadEvolutionPrompt,
  buildReflectionUserPrompt: promptsMock.buildReflectionUserPrompt,
}));

// Mock Anthropic SDK to prevent browser environment errors
// Note: We use a getter to return anthropicMock so that the mock survives vi.resetAllMocks()
// The factory function is called each time `new Anthropic()` is called
vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropicClass = function () {
    return anthropicMock;
  };
  return {
    default: MockAnthropicClass,
    Anthropic: MockAnthropicClass,
  };
});

// Import appRouter AFTER mocks are set up
import { appRouter } from '@/server/trpc/routers/_app';

/**
 * Response type for Supabase query mocks
 */
export interface SupabaseQueryResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

/**
 * Creates a test caller with mocked dependencies
 *
 * @param user - User to inject into context (null for unauthenticated)
 * @returns Test caller and mock utilities
 *
 * Usage:
 * ```typescript
 * const { caller, mockQuery } = createTestCaller(freeTierUser);
 * mockQuery('users', { data: mockUserData, error: null });
 * const result = await caller.auth.me();
 * ```
 */
export function createTestCaller(user: User | null = null) {
  // Reset mocks for each test
  vi.clearAllMocks();

  // Restore rate limit mock after clearing (it uses mockImplementation which gets cleared)
  rateLimitMock.checkRateLimit.mockImplementation(() =>
    Promise.resolve({
      success: true,
      limit: 999,
      remaining: 999,
      reset: 0,
    })
  );

  // Restore Anthropic mock after clearing
  anthropicMock.messages.create.mockResolvedValue({
    id: 'msg_test_12345',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Your journey speaks to the depths of your soul. This dream reflects your inner wisdom and courage to grow. The path you have chosen reveals your readiness for transformation.',
      },
    ],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 50 },
  });

  // Restore prompts mock after clearing
  promptsMock.loadPrompts.mockResolvedValue('Mocked system prompt for reflection generation');
  promptsMock.loadEvolutionPrompt.mockResolvedValue('Mocked evolution prompt');
  promptsMock.buildReflectionUserPrompt.mockReturnValue('Mocked user prompt');

  // Restore cache mock after clearing
  cacheMock.cacheDelete.mockResolvedValue(undefined);
  cacheMock.cacheGet.mockResolvedValue(null);
  cacheMock.cacheSet.mockResolvedValue(undefined);

  // Create fresh caller with mocked context
  const caller = appRouter.createCaller({
    user,
    req: new Request('http://localhost:3000'),
  });

  return {
    caller,
    supabase: supabaseMock,
    cookies: cookieMock,

    /**
     * Mock a single table response
     */
    mockQuery: <T>(table: string, response: SupabaseQueryResponse<T>) => {
      supabaseMock.from.mockImplementation((t: string) => {
        if (t === table) {
          return createSupabaseQueryMock(response);
        }
        return createSupabaseQueryMock({ data: null, error: null });
      });
    },

    /**
     * Mock multiple table responses
     */
    mockQueries: (tableResponses: Record<string, SupabaseQueryResponse<any>>) => {
      supabaseMock.from.mockImplementation((table: string) => {
        const response = tableResponses[table] || { data: null, error: null };
        return createSupabaseQueryMock(response);
      });
    },

    /**
     * Reset all mocks
     */
    resetMocks: () => {
      vi.clearAllMocks();
      supabaseMock.from.mockReset();
    },
  };
}

export { supabaseMock, cookieMock, cacheMock, promptsMock, anthropicMock };

/**
 * Type for the full query mock chain returned by supabase.from()
 * This is the complete type with all methods that TypeScript expects
 */
export type SupabaseQueryMock = ReturnType<typeof createSupabaseQueryMock>;

/**
 * Helper to create a partial query mock for use in mockImplementation.
 * This bypasses TypeScript's strict type checking when tests only need
 * to mock a subset of the Supabase query methods.
 *
 * Usage:
 * ```typescript
 * supabase.from.mockImplementation((table: string) => {
 *   if (table === 'users') {
 *     return createPartialMock({
 *       select: vi.fn().mockReturnThis(),
 *       eq: vi.fn().mockReturnThis(),
 *       single: vi.fn().mockResolvedValue({ data: user, error: null }),
 *     });
 *   }
 *   return createPartialMock({});
 * });
 * ```
 */
export function createPartialMock(partialMock: Record<string, unknown>): SupabaseQueryMock {
  return partialMock as SupabaseQueryMock;
}
