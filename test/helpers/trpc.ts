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
 * Fetch status for query results
 */
type FetchStatus = 'fetching' | 'paused' | 'idle';

/**
 * Possible states for a tRPC mutation
 */
type MutationStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * tRPC hook result metadata required by UseTRPCQueryResult
 */
interface TRPCHookMetadata {
  trpc: {
    path: string;
  };
}

/**
 * Base query result fields common to all states (TanStack Query v5 compatible)
 * These are the required properties from QueryObserverBaseResult
 * Using unknown/any for error types and functions to satisfy tRPC's complex type requirements
 */
interface BaseQueryResult<TData> extends TRPCHookMetadata {
  data: TData | undefined;
  error: unknown;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isPending: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  status: QueryStatus;

  refetch: any;
  // TanStack Query v5 additional required properties
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  failureCount: number;
  failureReason: unknown;
  errorUpdateCount: number;
  isFetched: boolean;
  isFetchedAfterMount: boolean;
  isLoadingError: boolean;
  isInitialLoading: boolean;
  isPaused: boolean;
  isPlaceholderData: boolean;
  isRefetchError: boolean;
  isStale: boolean;
  isEnabled: boolean;
  fetchStatus: FetchStatus;

  promise: Promise<any>;
}

/**
 * Success state for a query result
 */
interface QuerySuccessResult<TData> extends BaseQueryResult<TData> {
  data: TData;
  error: null;
  failureReason: null;
  isLoading: false;
  isError: false;
  isSuccess: true;
  isPending: false;
  status: 'success';
  isLoadingError: false;
  isRefetchError: false;
  isPlaceholderData: false;
}

/**
 * Loading state for a query result
 */
interface QueryLoadingResult<TData> extends BaseQueryResult<TData> {
  data: undefined;
  error: null;
  failureReason: null;
  isLoading: true;
  isError: false;
  isSuccess: false;
  isPending: true;
  status: 'pending';
  isLoadingError: false;
  isRefetchError: false;
  isPlaceholderData: false;
}

/**
 * Error state for a query result
 * Using 'any' for error type to satisfy tRPC's TRPCClientErrorLike requirements
 */
interface QueryErrorResult<TData> extends BaseQueryResult<TData> {
  data: undefined;

  error: any;

  failureReason: any;
  isLoading: false;
  isError: true;
  isSuccess: false;
  isPending: false;
  status: 'error';
  isLoadingError: true;
  isRefetchError: false;
  isPlaceholderData: false;
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
  error: unknown;
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
 * Infinite query result object (TanStack Query v5 compatible)
 */
export interface MockInfiniteQueryResult<TData> extends TRPCHookMetadata {
  data: InfiniteQueryPages<TData> | undefined;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  error: unknown;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  fetchNextPage: any;

  fetchPreviousPage: any;

  refetch: any;
  // TanStack Query v5 additional required properties
  status: QueryStatus;
  fetchStatus: FetchStatus;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  failureCount: number;
  failureReason: unknown;
  errorUpdateCount: number;
  isFetched: boolean;
  isFetchedAfterMount: boolean;
  isLoadingError: boolean;
  isInitialLoading: boolean;
  isPaused: boolean;
  isPlaceholderData: boolean;
  isRefetchError: boolean;
  isRefetching: boolean;
  isStale: boolean;
  isEnabled: boolean;

  promise: Promise<any>;
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
    trpc: { path: '' },
    // TanStack Query v5 properties
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isLoadingError: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isStale: false,
    isEnabled: true,
    fetchStatus: 'idle',
    promise: Promise.resolve(data),
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
    trpc: { path: '' },
    // TanStack Query v5 properties
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: false,
    isFetchedAfterMount: false,
    isLoadingError: false,
    isInitialLoading: true,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isStale: false,
    isEnabled: true,
    fetchStatus: 'fetching',
    promise: new Promise<TData>(() => {}), // Never resolves for loading state
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
    trpc: { path: '' },
    // TanStack Query v5 properties
    dataUpdatedAt: 0,
    errorUpdatedAt: Date.now(),
    failureCount: 1,
    failureReason: error,
    errorUpdateCount: 1,
    isFetched: true,
    isFetchedAfterMount: true,
    isLoadingError: true,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isStale: false,
    isEnabled: true,
    fetchStatus: 'idle',
    promise: (() => {
      const p = Promise.reject(error);
      p.catch(() => {}); // Prevent unhandled rejection in vitest 4.x
      return p;
    })(),
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
  const dataValue = isSuccess
    ? {
        pages,
        pageParams: pages.map((_, i) => (i === 0 ? undefined : i)),
      }
    : undefined;

  return {
    data: dataValue,
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
    trpc: { path: '' },
    // TanStack Query v5 properties
    status: isLoading ? 'pending' : isError ? 'error' : 'success',
    fetchStatus: isLoading ? 'fetching' : 'idle',
    dataUpdatedAt: isSuccess ? Date.now() : 0,
    errorUpdatedAt: isError ? Date.now() : 0,
    failureCount: isError ? 1 : 0,
    failureReason: error,
    errorUpdateCount: isError ? 1 : 0,
    isFetched: !isLoading,
    isFetchedAfterMount: !isLoading,
    isLoadingError: isError && !isSuccess,
    isInitialLoading: isLoading,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isEnabled: true,
    promise: isSuccess
      ? Promise.resolve(dataValue as InfiniteQueryPages<TData>)
      : isError
        ? (() => {
            const p = Promise.reject(error);
            p.catch(() => {}); // Prevent unhandled rejection in vitest 4.x
            return p;
          })()
        : new Promise<InfiniteQueryPages<TData>>(() => {}),
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
