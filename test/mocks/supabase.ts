// test/mocks/supabase.ts - Supabase client mock factory
// Provides reusable mock factories for testing Supabase interactions

import { vi } from 'vitest';

/**
 * Response type for Supabase query mocks
 */
export interface SupabaseQueryResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number; // Add count support for pagination queries
}

/**
 * Creates a chainable Supabase query mock
 * Supports all common Supabase query builder methods
 *
 * Usage:
 * ```typescript
 * const queryMock = createSupabaseQueryMock({ data: mockUser, error: null });
 * supabaseMock.from.mockReturnValue(queryMock);
 * ```
 */
export const createSupabaseQueryMock = <T>(response: SupabaseQueryResponse<T>) => {
  const mockChain = {
    // Select operations
    select: vi.fn().mockReturnThis(),

    // Insert/Update/Delete operations
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),

    // Filter operations
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

    // Ordering and pagination
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),

    // Result modifiers
    single: vi.fn().mockResolvedValue(response),
    maybeSingle: vi.fn().mockResolvedValue(response),

    // Make the chain thenable (for await)
    then: vi.fn((resolve: (value: SupabaseQueryResponse<T>) => void) => resolve(response)),
  };

  return mockChain;
};

/**
 * Type for the Supabase query mock chain
 */
export type SupabaseQueryMock = ReturnType<typeof createSupabaseQueryMock>;

/**
 * Creates a Supabase auth mock
 */
export const createSupabaseAuthMock = () => ({
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signInWithPassword: vi
    .fn()
    .mockResolvedValue({ data: { user: null, session: null }, error: null }),
  signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
  updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
});

/**
 * Creates a Supabase storage mock
 */
export const createSupabaseStorageMock = () => ({
  from: vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
    download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    getPublicUrl: vi
      .fn()
      .mockReturnValue({ data: { publicUrl: 'https://example.com/public-url' } }),
    createSignedUrl: vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: 'https://example.com/signed-url' }, error: null }),
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
});

/**
 * Creates a full Supabase client mock
 * Default behavior returns null/empty responses - configure per test
 *
 * Usage:
 * ```typescript
 * vi.mock('@/server/lib/supabase', () => ({
 *   supabase: createSupabaseMock(),
 * }));
 * ```
 */
export const createSupabaseMock = () => ({
  from: vi.fn((table: string) => createSupabaseQueryMock({ data: null, error: null })),
  auth: createSupabaseAuthMock(),
  storage: createSupabaseStorageMock(),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
});

/**
 * Type for the full Supabase mock
 */
export type SupabaseMock = ReturnType<typeof createSupabaseMock>;

/**
 * Pre-configured module mock for vi.mock()
 * Can be imported and used directly or cloned for customization
 */
export const supabaseMock = createSupabaseMock();

/**
 * Helper to create an error response
 */
export const createSupabaseError = (message: string, code?: string): Error => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};

/**
 * Common error scenarios
 */
export const supabaseErrors = {
  notFound: createSupabaseError('Row not found', 'PGRST116'),
  unauthorized: createSupabaseError('JWT expired', '401'),
  conflict: createSupabaseError('Duplicate key violation', '23505'),
  serverError: createSupabaseError('Internal server error', '500'),
};
