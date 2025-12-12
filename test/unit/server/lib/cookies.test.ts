// test/unit/server/lib/cookies.test.ts - Unit tests for cookie management functions
// Tests setAuthCookie, getAuthCookie, and clearAuthCookie with mocked next/headers

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Use vi.hoisted to create mock before vi.mock runs (hoisted to top)
const { mockCookieStore, cookiesMock } = vi.hoisted(() => {
  const store = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };
  // The cookies() function that returns the store as a resolved promise
  const cookiesFn = vi.fn().mockResolvedValue(store);
  return { mockCookieStore: store, cookiesMock: cookiesFn };
});

// Mock next/headers using the hoisted mock
vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

// Import after mock is set up
import {
  setAuthCookie,
  getAuthCookie,
  clearAuthCookie,
  AUTH_COOKIE_NAME,
  COOKIE_OPTIONS,
  DEMO_COOKIE_OPTIONS,
} from '@/server/lib/cookies';

describe('cookies module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore the cookies mock return value after clearing
    cookiesMock.mockResolvedValue(mockCookieStore);
  });

  describe('AUTH_COOKIE_NAME', () => {
    it('TC-CK-01: should export the correct cookie name constant', () => {
      expect(AUTH_COOKIE_NAME).toBe('auth_token');
    });
  });

  describe('COOKIE_OPTIONS', () => {
    it('TC-CK-02: should have secure cookie settings for production', () => {
      expect(COOKIE_OPTIONS).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      // maxAge should be 30 days in seconds
      expect(COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 24 * 30);
    });
  });

  describe('DEMO_COOKIE_OPTIONS', () => {
    it('TC-CK-03: should have shorter expiration for demo users', () => {
      expect(DEMO_COOKIE_OPTIONS).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      // Demo maxAge should be 7 days in seconds
      expect(DEMO_COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 24 * 7);
      // Should be shorter than regular options
      expect(DEMO_COOKIE_OPTIONS.maxAge).toBeLessThan(COOKIE_OPTIONS.maxAge);
    });
  });

  describe('setAuthCookie', () => {
    it('TC-CK-04: should set cookie with regular options for normal users', async () => {
      const testToken = 'test-auth-token-12345';

      await setAuthCookie(testToken);

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.set).toHaveBeenCalledWith(AUTH_COOKIE_NAME, testToken, COOKIE_OPTIONS);
    });

    it('TC-CK-05: should set cookie with demo options when isDemo is true', async () => {
      const demoToken = 'demo-user-token-67890';

      await setAuthCookie(demoToken, true);

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        demoToken,
        DEMO_COOKIE_OPTIONS
      );
    });

    it('TC-CK-06: should use regular options when isDemo is false', async () => {
      const regularToken = 'regular-user-token';

      await setAuthCookie(regularToken, false);

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        regularToken,
        COOKIE_OPTIONS
      );
    });

    it('TC-CK-07: should use regular options when isDemo is undefined (default)', async () => {
      const token = 'default-token';

      await setAuthCookie(token);

      expect(mockCookieStore.set).toHaveBeenCalledWith(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
    });
  });

  describe('getAuthCookie', () => {
    it('TC-CK-08: should return token value when cookie exists', async () => {
      const storedToken = 'stored-auth-token-abc123';
      mockCookieStore.get.mockReturnValue({ value: storedToken });

      const result = await getAuthCookie();

      expect(mockCookieStore.get).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.get).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
      expect(result).toBe(storedToken);
    });

    it('TC-CK-09: should return undefined when cookie does not exist', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getAuthCookie();

      expect(mockCookieStore.get).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
      expect(result).toBeUndefined();
    });

    it('TC-CK-10: should return undefined when cookie value is null', async () => {
      mockCookieStore.get.mockReturnValue(null);

      const result = await getAuthCookie();

      expect(result).toBeUndefined();
    });

    it('TC-CK-11: should handle cookie with empty string value', async () => {
      mockCookieStore.get.mockReturnValue({ value: '' });

      const result = await getAuthCookie();

      expect(result).toBe('');
    });
  });

  describe('clearAuthCookie', () => {
    it('TC-CK-12: should delete the auth cookie', async () => {
      await clearAuthCookie();

      expect(mockCookieStore.delete).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.delete).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
    });

    it('TC-CK-13: should succeed even if cookie does not exist', async () => {
      // delete() doesn't throw even if cookie doesn't exist
      mockCookieStore.delete.mockReturnValue(undefined);

      await expect(clearAuthCookie()).resolves.toBeUndefined();

      expect(mockCookieStore.delete).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
    });
  });
});
