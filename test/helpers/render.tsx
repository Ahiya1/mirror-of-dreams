// test/helpers/render.tsx - Custom render with providers
// Provides a test wrapper that includes necessary context providers
// for component testing

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

import type { User } from '@/types/user';

/**
 * Props for the test provider wrapper
 */
interface TestProviderProps {
  children: ReactNode;
  user?: User | null;
  queryClient?: QueryClient;
}

/**
 * Extended render options with custom fields for testing
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * User context to provide to the component.
   * Pass null for unauthenticated state, undefined to omit user context.
   */
  user?: User | null;

  /**
   * Custom QueryClient for React Query.
   * If not provided, a fresh client with test-optimized defaults is created.
   */
  queryClient?: QueryClient;
}

/**
 * Extended render result with additional utilities
 */
export interface CustomRenderResult extends RenderResult {
  /**
   * The QueryClient instance used in the render.
   * Useful for manual cache manipulation in tests.
   */
  queryClient: QueryClient;
}

/**
 * Creates a QueryClient configured for testing
 *
 * Test-optimized settings:
 * - Retries disabled (fail fast)
 * - Caching disabled (isolation between tests)
 * - Error logging suppressed
 *
 * @returns QueryClient configured for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster failure detection
        retry: false,
        // Disable caching to ensure test isolation
        staleTime: 0,
        gcTime: 0,
        // Disable refetch behaviors that could cause flaky tests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        // Disable retries for mutations as well
        retry: false,
      },
    },
  });
}

/**
 * Wrapper component that provides all necessary contexts for testing
 *
 * Currently provides:
 * - QueryClientProvider for React Query
 *
 * Future providers can be added here as needed:
 * - UserContext provider
 * - tRPC provider (for component tests that need it)
 * - Theme provider
 *
 * @internal
 */
function TestProviders({
  children,
  user: _user = null,
  queryClient,
}: TestProviderProps): ReactElement {
  const client = queryClient ?? createTestQueryClient();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * Custom render function that wraps components with test providers
 *
 * This is the main entry point for rendering components in tests.
 * It provides all necessary context providers and returns an extended
 * result that includes the QueryClient for cache manipulation.
 *
 * @param ui - React element to render
 * @param options - Render options including user context and custom QueryClient
 * @returns Render result with testing-library queries and QueryClient
 *
 * @example Basic usage
 * ```typescript
 * import { renderWithProviders, screen } from '@/test/helpers';
 *
 * test('renders component', () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 *
 * @example With user context
 * ```typescript
 * import { renderWithProviders } from '@/test/helpers';
 * import { freeTierUser } from '@/test/factories';
 *
 * test('renders for authenticated user', () => {
 *   renderWithProviders(<Dashboard />, { user: freeTierUser });
 * });
 * ```
 *
 * @example With custom QueryClient
 * ```typescript
 * import { renderWithProviders, createTestQueryClient } from '@/test/helpers';
 *
 * test('with pre-populated cache', () => {
 *   const queryClient = createTestQueryClient();
 *   queryClient.setQueryData(['user'], mockUser);
 *
 *   renderWithProviders(<UserProfile />, { queryClient });
 * });
 * ```
 *
 * @example Accessing QueryClient after render
 * ```typescript
 * import { renderWithProviders } from '@/test/helpers';
 *
 * test('manipulating cache after render', async () => {
 *   const { queryClient } = renderWithProviders(<Component />);
 *
 *   // Manually update cache
 *   queryClient.setQueryData(['key'], newData);
 *
 *   // Invalidate and refetch
 *   await queryClient.invalidateQueries({ queryKey: ['key'] });
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult {
  const { user, queryClient: providedQueryClient, ...renderOptions } = options;

  const queryClient = providedQueryClient ?? createTestQueryClient();

  const result = render(ui, {
    wrapper: ({ children }) => (
      <TestProviders user={user} queryClient={queryClient}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });

  return {
    ...result,
    queryClient,
  };
}

/**
 * Re-export everything from @testing-library/react for convenience
 *
 * This allows tests to import everything from a single location:
 * ```typescript
 * import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/helpers';
 * ```
 */
export * from '@testing-library/react';
