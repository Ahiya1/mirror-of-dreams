// test/helpers/__tests__/helpers.test.tsx
// Tests for test helper utilities

import { describe, expect, test, vi, beforeEach } from 'vitest';

import {
  renderWithProviders,
  createTestQueryClient,
  createMockQueryResult,
  createMockLoadingResult,
  createMockErrorResult,
  createMockMutation,
  createMockInfiniteQueryResult,
  createMockContext,
  screen,
} from '../index';

describe('Test Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderWithProviders', () => {
    test('renders a simple component', () => {
      renderWithProviders(<div data-testid="test">Hello</div>);
      expect(screen.getByTestId('test')).toHaveTextContent('Hello');
    });

    test('returns queryClient in result', () => {
      const { queryClient } = renderWithProviders(<div>Test</div>);
      expect(queryClient).toBeDefined();
      expect(typeof queryClient.setQueryData).toBe('function');
    });

    test('accepts custom queryClient', () => {
      const customClient = createTestQueryClient();
      customClient.setQueryData(['test'], { value: 123 });

      const { queryClient } = renderWithProviders(<div>Test</div>, {
        queryClient: customClient,
      });

      expect(queryClient.getQueryData(['test'])).toEqual({ value: 123 });
    });

    test('accepts user context option', () => {
      // Just verify it doesn't throw
      const mockUser = {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        tier: 'free' as const,
        subscriptionStatus: 'active' as const,
        subscriptionPeriod: null,
        reflectionCountThisMonth: 0,
        reflectionsToday: 0,
        lastReflectionDate: null,
        totalReflections: 0,
        clarifySessionsThisMonth: 0,
        totalClarifySessions: 0,
        currentMonthYear: '2025-01',
        cancelAtPeriodEnd: false,
        isCreator: false,
        isAdmin: false,
        isDemo: false,
        language: 'en' as const,
        emailVerified: true,
        preferences: {
          notification_email: true,
          reflection_reminders: 'off' as const,
          evolution_email: true,
          marketing_emails: false,
          default_tone: 'fusion' as const,
          show_character_counter: true,
          reduce_motion_override: null,
          analytics_opt_in: true,
        },
        createdAt: new Date().toISOString(),
        lastSignInAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => {
        renderWithProviders(<div>Test</div>, { user: mockUser });
      }).not.toThrow();
    });
  });

  describe('createTestQueryClient', () => {
    test('creates a QueryClient instance', () => {
      const client = createTestQueryClient();
      expect(client).toBeDefined();
      expect(typeof client.getQueryData).toBe('function');
      expect(typeof client.setQueryData).toBe('function');
    });

    test('has retries disabled', () => {
      const client = createTestQueryClient();
      const options = client.getDefaultOptions();
      expect(options.queries?.retry).toBe(false);
      expect(options.mutations?.retry).toBe(false);
    });

    test('has caching disabled', () => {
      const client = createTestQueryClient();
      const options = client.getDefaultOptions();
      expect(options.queries?.staleTime).toBe(0);
      expect(options.queries?.gcTime).toBe(0);
    });
  });

  describe('createMockQueryResult', () => {
    test('returns success state with data', () => {
      const data = { id: '123', name: 'Test' };
      const result = createMockQueryResult(data);

      expect(result.data).toEqual(data);
      expect(result.isLoading).toBe(false);
      expect(result.isError).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.isPending).toBe(false);
      expect(result.status).toBe('success');
      expect(result.error).toBeNull();
    });

    test('includes refetch function', () => {
      const data = [1, 2, 3];
      const result = createMockQueryResult(data);

      expect(typeof result.refetch).toBe('function');
    });

    test('preserves data types', () => {
      const stringResult = createMockQueryResult('hello');
      expect(stringResult.data).toBe('hello');

      const arrayResult = createMockQueryResult([1, 2, 3]);
      expect(arrayResult.data).toEqual([1, 2, 3]);

      const objectResult = createMockQueryResult({ nested: { value: 42 } });
      expect(objectResult.data).toEqual({ nested: { value: 42 } });
    });
  });

  describe('createMockLoadingResult', () => {
    test('returns loading state', () => {
      const result = createMockLoadingResult<{ id: string }>();

      expect(result.data).toBeUndefined();
      expect(result.isLoading).toBe(true);
      expect(result.isError).toBe(false);
      expect(result.isSuccess).toBe(false);
      expect(result.isPending).toBe(true);
      expect(result.isFetching).toBe(true);
      expect(result.status).toBe('pending');
      expect(result.error).toBeNull();
    });
  });

  describe('createMockErrorResult', () => {
    test('returns error state with default error', () => {
      const result = createMockErrorResult<string>();

      expect(result.data).toBeUndefined();
      expect(result.isLoading).toBe(false);
      expect(result.isError).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Query failed');
    });

    test('returns error state with custom error', () => {
      const customError = new Error('Custom error message');
      const result = createMockErrorResult<number>(customError);

      expect(result.error).toBe(customError);
      expect(result.error?.message).toBe('Custom error message');
    });
  });

  describe('createMockMutation', () => {
    test('returns idle state by default', () => {
      const mutation = createMockMutation();

      expect(mutation.isIdle).toBe(true);
      expect(mutation.isPending).toBe(false);
      expect(mutation.isLoading).toBe(false);
      expect(mutation.isError).toBe(false);
      expect(mutation.isSuccess).toBe(false);
      expect(mutation.status).toBe('idle');
      expect(mutation.error).toBeNull();
    });

    test('includes mutate and mutateAsync functions', () => {
      const mutation = createMockMutation();

      expect(typeof mutation.mutate).toBe('function');
      expect(typeof mutation.mutateAsync).toBe('function');
    });

    test('can be configured with pending status', () => {
      const mutation = createMockMutation({ status: 'pending' });

      expect(mutation.isPending).toBe(true);
      expect(mutation.isLoading).toBe(true);
      expect(mutation.isIdle).toBe(false);
      expect(mutation.status).toBe('pending');
    });

    test('can be configured with success status and data', () => {
      const mutation = createMockMutation({
        status: 'success',
        data: { id: 'created-123' },
      });

      expect(mutation.isSuccess).toBe(true);
      expect(mutation.data).toEqual({ id: 'created-123' });
    });

    test('can be configured with error status', () => {
      const error = new Error('Mutation failed');
      const mutation = createMockMutation({
        status: 'error',
        error,
      });

      expect(mutation.isError).toBe(true);
      expect(mutation.error).toBe(error);
    });

    test('can be configured with custom implementation', async () => {
      const implementation = vi.fn().mockResolvedValue({ success: true });
      const mutation = createMockMutation({ implementation });

      const result = await mutation.mutateAsync({ input: 'test' });

      expect(implementation).toHaveBeenCalledWith({ input: 'test' });
      expect(result).toEqual({ success: true });
    });

    test('mutate can be tracked for calls', () => {
      const mutation = createMockMutation();

      mutation.mutate({ title: 'Test' });

      expect(mutation.mutate).toHaveBeenCalledWith({ title: 'Test' });
    });
  });

  describe('createMockInfiniteQueryResult', () => {
    test('returns success state with pages', () => {
      const pages = [
        [{ id: '1' }, { id: '2' }],
        [{ id: '3' }, { id: '4' }],
      ];
      const result = createMockInfiniteQueryResult(pages);

      expect(result.data?.pages).toEqual(pages);
      expect(result.isLoading).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.isError).toBe(false);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    test('can be configured with hasNextPage', () => {
      const result = createMockInfiniteQueryResult([[{ id: '1' }]], { hasNextPage: true });

      expect(result.hasNextPage).toBe(true);
    });

    test('includes fetchNextPage function', () => {
      const result = createMockInfiniteQueryResult([]);

      expect(typeof result.fetchNextPage).toBe('function');
      expect(typeof result.fetchPreviousPage).toBe('function');
    });

    test('can be configured with loading state', () => {
      const result = createMockInfiniteQueryResult([], { isLoading: true });

      expect(result.isLoading).toBe(true);
      expect(result.isPending).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.data).toBeUndefined();
    });

    test('can be configured with error state', () => {
      const error = new Error('Failed to load');
      const result = createMockInfiniteQueryResult([], { error });

      expect(result.isError).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe('createMockContext', () => {
    test('creates context with null user by default', () => {
      const ctx = createMockContext();

      expect(ctx.user).toBeNull();
      expect(ctx.req).toBeInstanceOf(Request);
    });

    test('creates context with provided user', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test',
        tier: 'free' as const,
        subscriptionStatus: 'active' as const,
        subscriptionPeriod: null,
        reflectionCountThisMonth: 0,
        reflectionsToday: 0,
        lastReflectionDate: null,
        totalReflections: 0,
        clarifySessionsThisMonth: 0,
        totalClarifySessions: 0,
        currentMonthYear: '2025-01',
        cancelAtPeriodEnd: false,
        isCreator: false,
        isAdmin: false,
        isDemo: false,
        language: 'en' as const,
        emailVerified: true,
        preferences: {
          notification_email: true,
          reflection_reminders: 'off' as const,
          evolution_email: true,
          marketing_emails: false,
          default_tone: 'fusion' as const,
          show_character_counter: true,
          reduce_motion_override: null,
          analytics_opt_in: true,
        },
        createdAt: new Date().toISOString(),
        lastSignInAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ctx = createMockContext(mockUser);

      expect(ctx.user).toBe(mockUser);
    });

    test('creates context with custom request', () => {
      const customReq = new Request('http://example.com/api/test');
      const ctx = createMockContext(null, customReq);

      expect(ctx.req).toBe(customReq);
    });
  });
});
