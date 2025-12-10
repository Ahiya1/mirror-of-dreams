// test/helpers/trpc.ts - tRPC mock utilities
// Provides type-safe helpers for mocking tRPC query and mutation states
// in component tests

import { vi } from 'vitest';

import type { AppRouter } from '@/server/trpc/routers/_app';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Possible states for a tRPC query result
 */
type QueryStatus = 'pending' | 'success' | 'error';

/**
 * Possible states for a tRPC mutation
 */
type MutationStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Base query result fields common to all states
 */
interface BaseQueryResult<TData> {
  data: TData | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isPending: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  status: QueryStatus;
  refetch: ReturnType<typeof vi.fn>;
}

/**
 * Success state for a query result
 */
interface QuerySuccessResult<TData> extends BaseQueryResult<TData> {
  data: TData;
  error: null;
  isLoading: false;
  isError: false;
  isSuccess: true;
  isPending: false;
  status: 'success';
}

/**
 * Loading state for a query result
 */
interface QueryLoadingResult<TData> extends BaseQueryResult<TData> {
  data: undefined;
  error: null;
  isLoading: true;
  isError: false;
  isSuccess: false;
  isPending: true;
  status: 'pending';
}

/**
 * Error state for a query result
 */
interface QueryErrorResult<TData> extends BaseQueryResult<TData> {
  data: undefined;
  error: Error;
  isLoading: false;
  isError: true;
  isSuccess: false;
  isPending: false;
  status: 'error';
}

/**
 * Union type representing all possible query result states
 */
export type MockQueryResult<TData> =
  | QuerySuccessResult<TData>
  | QueryLoadingResult<TData>
  | QueryErrorResult<TData>;

/**
 * Mock function type for mutations
 */
type MockFn = ReturnType<typeof vi.fn>;

/**
 * Mutation result object returned by useMutation hooks
 */
export interface MockMutationResult<TInput, TOutput> {
  mutate: MockFn;
  mutateAsync: MockFn;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  error: Error | null;
  data: TOutput | undefined;
  status: MutationStatus;
  reset: MockFn;
  variables: TInput | undefined;
}

/**
 * Infinite query page structure
 */
interface InfiniteQueryPages<TData> {
  pages: TData[];
  pageParams: (number | undefined)[];
}

/**
 * Infinite query result object
 */
export interface MockInfiniteQueryResult<TData> {
  data: InfiniteQueryPages<TData> | undefined;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  error: Error | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: ReturnType<typeof vi.fn>;
  fetchPreviousPage: ReturnType<typeof vi.fn>;
  refetch: ReturnType<typeof vi.fn>;
}

// ============================================================================
// Query Result Factories
// ============================================================================

/**
 * Creates a mock tRPC query result in success state
 *
 * Use this when testing components that display loaded data.
 *
 * @typeParam TData - The data type returned by the query
 * @param data - The data to return from the query
 * @returns Mock query result object in success state
 *
 * @example Basic usage
 * ```typescript
 * import { createMockQueryResult } from '@/test/helpers';
 * import { activeDream, achievedDream } from '@/test/factories';
 *
 * vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
 *   createMockQueryResult([activeDream, achievedDream])
 * );
 * ```
 *
 * @example With user data
 * ```typescript
 * import { createMockQueryResult } from '@/test/helpers';
 * import { proTierUser } from '@/test/factories';
 *
 * vi.mocked(trpc.auth.me.useQuery).mockReturnValue(
 *   createMockQueryResult(proTierUser)
 * );
 * ```
 */
export function createMockQueryResult<TData>(data: TData): QuerySuccessResult<TData> {
  return {
    data,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true,
    isPending: false,
    isFetching: false,
    isRefetching: false,
    status: 'success',
    refetch: vi.fn().mockResolvedValue({ data }),
  };
}

/**
 * Creates a mock tRPC query result in loading state
 *
 * Use this when testing loading skeletons and pending states.
 *
 * @typeParam TData - The expected data type (for type consistency)
 * @returns Mock query result object in loading state
 *
 * @example
 * ```typescript
 * import { createMockLoadingResult } from '@/test/helpers';
 * import type { Dream } from '@/types/dream';
 *
 * vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
 *   createMockLoadingResult<Dream[]>()
 * );
 *
 * renderWithProviders(<DreamList />);
 * expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
 * ```
 */
export function createMockLoadingResult<TData>(): QueryLoadingResult<TData> {
  return {
    data: undefined,
    error: null,
    isLoading: true,
    isError: false,
    isSuccess: false,
    isPending: true,
    isFetching: true,
    isRefetching: false,
    status: 'pending',
    refetch: vi.fn(),
  };
}

/**
 * Creates a mock tRPC query result in error state
 *
 * Use this when testing error handling and error display.
 *
 * @typeParam TData - The expected data type (for type consistency)
 * @param error - The error to return (defaults to generic Error)
 * @returns Mock query result object in error state
 *
 * @example With custom error message
 * ```typescript
 * import { createMockErrorResult } from '@/test/helpers';
 *
 * vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
 *   createMockErrorResult(new Error('Failed to fetch dreams'))
 * );
 *
 * renderWithProviders(<DreamList />);
 * expect(screen.getByText('Failed to fetch dreams')).toBeInTheDocument();
 * ```
 *
 * @example Testing error boundary
 * ```typescript
 * import { createMockErrorResult } from '@/test/helpers';
 *
 * vi.mocked(trpc.auth.me.useQuery).mockReturnValue(
 *   createMockErrorResult(new Error('Unauthorized'))
 * );
 * ```
 */
export function createMockErrorResult<TData>(
  error: Error = new Error('Query failed')
): QueryErrorResult<TData> {
  return {
    data: undefined,
    error,
    isLoading: false,
    isError: true,
    isSuccess: false,
    isPending: false,
    isFetching: false,
    isRefetching: false,
    status: 'error',
    refetch: vi.fn().mockRejectedValue(error),
  };
}

// ============================================================================
// Mutation Factories
// ============================================================================

/**
 * Options for creating a mock mutation
 */
interface MockMutationOptions<TInput, TOutput> {
  /**
   * Implementation for the async mutation function.
   * If not provided, mutateAsync resolves with undefined.
   */
  implementation?: (input: TInput) => Promise<TOutput>;

  /**
   * Initial status of the mutation.
   * @default 'idle'
   */
  status?: MutationStatus;

  /**
   * Pre-populated data (for success state).
   */
  data?: TOutput;

  /**
   * Pre-populated error (for error state).
   */
  error?: Error;
}

/**
 * Creates a mock tRPC mutation
 *
 * Use this when testing components that trigger mutations (create, update, delete).
 *
 * @typeParam TInput - The input type for the mutation
 * @typeParam TOutput - The output type returned by the mutation
 * @param options - Configuration options for the mock mutation
 * @returns Mock mutation result object
 *
 * @example Basic mutation mock
 * ```typescript
 * import { createMockMutation } from '@/test/helpers';
 *
 * vi.mocked(trpc.dreams.create.useMutation).mockReturnValue(
 *   createMockMutation()
 * );
 *
 * renderWithProviders(<CreateDreamForm />);
 * fireEvent.click(screen.getByText('Create Dream'));
 * ```
 *
 * @example With custom implementation
 * ```typescript
 * import { createMockMutation } from '@/test/helpers';
 * import { createMockDream } from '@/test/factories';
 *
 * const mockCreate = createMockMutation<CreateDreamInput, Dream>({
 *   implementation: async (input) => ({
 *     ...createMockDream(),
 *     title: input.title,
 *   }),
 * });
 *
 * vi.mocked(trpc.dreams.create.useMutation).mockReturnValue(mockCreate);
 * ```
 *
 * @example Testing mutation pending state
 * ```typescript
 * import { createMockMutation } from '@/test/helpers';
 *
 * vi.mocked(trpc.dreams.create.useMutation).mockReturnValue(
 *   createMockMutation({ status: 'pending' })
 * );
 *
 * renderWithProviders(<CreateDreamForm />);
 * expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
 * ```
 *
 * @example Verifying mutation was called
 * ```typescript
 * import { createMockMutation } from '@/test/helpers';
 *
 * const mockMutation = createMockMutation();
 * vi.mocked(trpc.dreams.create.useMutation).mockReturnValue(mockMutation);
 *
 * renderWithProviders(<CreateDreamForm />);
 * fireEvent.click(screen.getByText('Create'));
 *
 * expect(mockMutation.mutate).toHaveBeenCalledWith({
 *   title: 'My Dream',
 *   category: 'career',
 * });
 * ```
 */
export function createMockMutation<TInput = unknown, TOutput = unknown>(
  options: MockMutationOptions<TInput, TOutput> = {}
): MockMutationResult<TInput, TOutput> {
  const { implementation, status = 'idle', data, error } = options;

  const mutateAsync = implementation
    ? vi.fn().mockImplementation(implementation)
    : vi.fn().mockResolvedValue(data as TOutput);

  const mutate = vi
    .fn()
    .mockImplementation((input: TInput, callbacks?: { onSuccess?: () => void }) => {
      mutateAsync(input).then(() => callbacks?.onSuccess?.());
    });

  const isIdle = status === 'idle';
  const isPending = status === 'pending';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return {
    mutate,
    mutateAsync,
    isLoading: isPending,
    isPending,
    isError,
    isSuccess,
    isIdle,
    error: error ?? null,
    data: isSuccess ? data : undefined,
    status,
    reset: vi.fn(),
    variables: undefined,
  };
}

// ============================================================================
// Infinite Query Factories
// ============================================================================

/**
 * Options for creating a mock infinite query result
 */
interface MockInfiniteQueryOptions<TData> {
  /**
   * Whether there are more pages to load.
   * @default false
   */
  hasNextPage?: boolean;

  /**
   * Whether there are previous pages available.
   * @default false
   */
  hasPreviousPage?: boolean;

  /**
   * Whether the query is currently in loading state.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Error to include in the result.
   */
  error?: Error;
}

/**
 * Creates a mock tRPC infinite query result
 *
 * Use this when testing components with infinite scrolling or pagination.
 *
 * @typeParam TData - The data type for each page
 * @param pages - Array of page data
 * @param options - Configuration options
 * @returns Mock infinite query result object
 *
 * @example Basic infinite query
 * ```typescript
 * import { createMockInfiniteQueryResult } from '@/test/helpers';
 * import { createMockDreams } from '@/test/factories';
 *
 * vi.mocked(trpc.dreams.infinite.useInfiniteQuery).mockReturnValue(
 *   createMockInfiniteQueryResult([
 *     createMockDreams(10, 'user-1'),
 *     createMockDreams(10, 'user-1'),
 *   ])
 * );
 * ```
 *
 * @example With more pages available
 * ```typescript
 * import { createMockInfiniteQueryResult } from '@/test/helpers';
 *
 * vi.mocked(trpc.reflections.infinite.useInfiniteQuery).mockReturnValue(
 *   createMockInfiniteQueryResult([firstPage], { hasNextPage: true })
 * );
 *
 * renderWithProviders(<ReflectionList />);
 * expect(screen.getByText('Load More')).toBeEnabled();
 * ```
 *
 * @example Testing load more functionality
 * ```typescript
 * import { createMockInfiniteQueryResult } from '@/test/helpers';
 *
 * const mockResult = createMockInfiniteQueryResult([page1], {
 *   hasNextPage: true,
 * });
 *
 * vi.mocked(trpc.items.infinite.useInfiniteQuery).mockReturnValue(mockResult);
 *
 * renderWithProviders(<ItemList />);
 * fireEvent.click(screen.getByText('Load More'));
 *
 * expect(mockResult.fetchNextPage).toHaveBeenCalled();
 * ```
 */
export function createMockInfiniteQueryResult<TData>(
  pages: TData[],
  options: MockInfiniteQueryOptions<TData> = {}
): MockInfiniteQueryResult<TData> {
  const { hasNextPage = false, hasPreviousPage = false, isLoading = false, error = null } = options;

  const isError = error !== null;
  const isSuccess = !isLoading && !isError;

  return {
    data: isSuccess
      ? {
          pages,
          pageParams: pages.map((_, i) => (i === 0 ? undefined : i)),
        }
      : undefined,
    isLoading,
    isPending: isLoading,
    isError,
    isSuccess,
    isFetching: isLoading,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    error,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage: vi.fn().mockResolvedValue({ data: pages }),
    fetchPreviousPage: vi.fn().mockResolvedValue({ data: pages }),
    refetch: vi.fn().mockResolvedValue({ data: { pages, pageParams: [] } }),
  };
}

// ============================================================================
// Context Mock Factory
// ============================================================================

/**
 * tRPC context interface for server-side procedure calls
 */
export interface MockTRPCContext {
  user: import('@/types/user').User | null;
  req: Request;
}

/**
 * Creates a mock tRPC context for testing router procedures directly
 *
 * Note: For most component tests, use the mock helpers above.
 * This is primarily useful when testing tRPC procedures in isolation.
 *
 * @param user - User to include in context (null for unauthenticated)
 * @param req - Request object to include (defaults to localhost request)
 * @returns Mock tRPC context
 *
 * @example Testing a protected procedure
 * ```typescript
 * import { createMockContext } from '@/test/helpers';
 * import { freeTierUser } from '@/test/factories';
 * import { appRouter } from '@/server/trpc/routers/_app';
 *
 * const ctx = createMockContext(freeTierUser);
 * const caller = appRouter.createCaller(ctx);
 *
 * const result = await caller.dreams.list();
 * expect(result).toHaveLength(0);
 * ```
 *
 * @example Testing unauthenticated access
 * ```typescript
 * import { createMockContext } from '@/test/helpers';
 * import { appRouter } from '@/server/trpc/routers/_app';
 *
 * const ctx = createMockContext(null);
 * const caller = appRouter.createCaller(ctx);
 *
 * await expect(caller.auth.me()).rejects.toThrow('Unauthorized');
 * ```
 */
export function createMockContext(
  user: import('@/types/user').User | null = null,
  req: Request = new Request('http://localhost:3000')
): MockTRPCContext {
  return {
    user,
    req,
  };
}

// ============================================================================
// Type Exports for AppRouter
// ============================================================================

/**
 * Re-export AppRouter type for convenience in test files
 */
export type { AppRouter };
