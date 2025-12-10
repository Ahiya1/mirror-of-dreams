// test/helpers/index.ts - Barrel export for test helpers
// Provides a single import point for all test utilities

/**
 * Test Helper Exports
 *
 * This module re-exports all test helpers from a single location,
 * allowing tests to import everything they need with one import:
 *
 * @example
 * ```typescript
 * import {
 *   // Render helpers
 *   renderWithProviders,
 *   createTestQueryClient,
 *
 *   // Testing library re-exports
 *   screen,
 *   waitFor,
 *   fireEvent,
 *   within,
 *
 *   // tRPC mock helpers
 *   createMockQueryResult,
 *   createMockLoadingResult,
 *   createMockErrorResult,
 *   createMockMutation,
 *   createMockInfiniteQueryResult,
 *   createMockContext,
 * } from '@/test/helpers';
 * ```
 */

// ============================================================================
// Render Helpers
// ============================================================================

export {
  /**
   * Render a component with all necessary providers for testing.
   * Returns extended result including QueryClient for cache manipulation.
   */
  renderWithProviders,
  /**
   * Create a QueryClient configured for testing (no retries, no cache).
   * Useful when you need to pre-populate cache before rendering.
   */
  createTestQueryClient,
  // Custom types
  type CustomRenderOptions,
  type CustomRenderResult,
} from './render';

// ============================================================================
// Testing Library Re-exports
// ============================================================================

// Re-export all testing library utilities for convenience
// This allows tests to import from a single location
export {
  // Core rendering
  render,
  cleanup,
  // Queries
  screen,
  within,
  // Async utilities
  waitFor,
  waitForElementToBeRemoved,
  // Events
  fireEvent,
  // Configuration
  configure,
  // Query helpers
  getByRole,
  getByText,
  getByTestId,
  getByLabelText,
  getByPlaceholderText,
  getByAltText,
  getByTitle,
  getByDisplayValue,
  queryByRole,
  queryByText,
  queryByTestId,
  queryByLabelText,
  queryByPlaceholderText,
  queryByAltText,
  queryByTitle,
  queryByDisplayValue,
  findByRole,
  findByText,
  findByTestId,
  findByLabelText,
  findByPlaceholderText,
  findByAltText,
  findByTitle,
  findByDisplayValue,
  getAllByRole,
  getAllByText,
  getAllByTestId,
  getAllByLabelText,
  getAllByPlaceholderText,
  getAllByAltText,
  getAllByTitle,
  getAllByDisplayValue,
  queryAllByRole,
  queryAllByText,
  queryAllByTestId,
  queryAllByLabelText,
  queryAllByPlaceholderText,
  queryAllByAltText,
  queryAllByTitle,
  queryAllByDisplayValue,
  findAllByRole,
  findAllByText,
  findAllByTestId,
  findAllByLabelText,
  findAllByPlaceholderText,
  findAllByAltText,
  findAllByTitle,
  findAllByDisplayValue,
} from './render';

// ============================================================================
// tRPC Mock Helpers
// ============================================================================

export {
  /**
   * Create a mock query result in success state with data.
   */
  createMockQueryResult,
  /**
   * Create a mock query result in loading/pending state.
   */
  createMockLoadingResult,
  /**
   * Create a mock query result in error state with an error.
   */
  createMockErrorResult,
  /**
   * Create a mock mutation with configurable implementation and state.
   */
  createMockMutation,
  /**
   * Create a mock infinite query result for paginated data.
   */
  createMockInfiniteQueryResult,
  /**
   * Create a mock tRPC context for testing procedures directly.
   */
  createMockContext,
  // Types
  type MockQueryResult,
  type MockMutationResult,
  type MockInfiniteQueryResult,
  type MockTRPCContext,
  type AppRouter,
} from './trpc';
