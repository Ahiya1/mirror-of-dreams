// test/mocks/cookies.ts - Cookie mock factory
// Provides mocks for the @/server/lib/cookies module

import { vi } from 'vitest';

/**
 * Creates a mock for @/server/lib/cookies module
 * All methods return promises to match the real implementation
 */
export const createCookieMock = () => ({
  getAuthCookie: vi.fn().mockResolvedValue(null),
  setAuthCookie: vi.fn().mockResolvedValue(undefined),
  clearAuthCookie: vi.fn().mockResolvedValue(undefined),
});

export type CookieMock = ReturnType<typeof createCookieMock>;

/**
 * Pre-configured cookie mock instance
 * Can be used directly or cloned for customization
 */
export const cookieMock = createCookieMock();
