// test/unit/server/lib/supabase.test.ts - Unit tests for Supabase client initialization
// Tests client creation with environment variables and placeholder fallback behavior

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Store original env for restoration
const originalEnv = { ...process.env };

// Use vi.hoisted to create mock before vi.mock runs
const { mockCreateClient, mockClient } = vi.hoisted(() => {
  const client = {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
    storage: { from: vi.fn() },
  };
  const createClientFn = vi.fn().mockReturnValue(client);
  return { mockCreateClient: createClientFn, mockClient: client };
});

// Mock createClient using hoisted mock
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('supabase client initialization', () => {
  beforeEach(() => {
    // Reset modules to re-execute module initialization with new env
    vi.resetModules();
    // Clear mock call history but keep implementation
    mockCreateClient.mockClear();
    mockCreateClient.mockReturnValue(mockClient);
    // Reset env to original state
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('environment variable handling', () => {
    it('TC-SB-01: should use environment variables when both are available', async () => {
      // Set environment variables
      process.env.SUPABASE_URL = 'https://test-project.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-123';

      // Import the module (this will execute the initialization code)
      const { supabase } = await import('@/server/lib/supabase');

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test-project.supabase.co',
        'test-service-role-key-123'
      );
      expect(supabase).toBeDefined();
    });

    it('TC-SB-02: should use placeholder URL when SUPABASE_URL is missing', async () => {
      // Remove SUPABASE_URL
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'some-service-key';

      await import('@/server/lib/supabase');

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://placeholder.supabase.co',
        'some-service-key'
      );
    });

    it('TC-SB-03: should use placeholder key when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      process.env.SUPABASE_URL = 'https://actual-project.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      await import('@/server/lib/supabase');

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://actual-project.supabase.co',
        'placeholder-key'
      );
    });

    it('TC-SB-04: should use placeholder values when both env vars are missing', async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      await import('@/server/lib/supabase');

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://placeholder.supabase.co',
        'placeholder-key'
      );
    });

    it('TC-SB-05: should use placeholder URL when SUPABASE_URL is empty string', async () => {
      process.env.SUPABASE_URL = '';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-key';

      await import('@/server/lib/supabase');

      // Empty string is falsy, so placeholder should be used
      expect(mockCreateClient).toHaveBeenCalledWith('https://placeholder.supabase.co', 'valid-key');
    });

    it('TC-SB-06: should use placeholder key when SUPABASE_SERVICE_ROLE_KEY is empty string', async () => {
      process.env.SUPABASE_URL = 'https://valid-project.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';

      await import('@/server/lib/supabase');

      // Empty string is falsy, so placeholder should be used
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://valid-project.supabase.co',
        'placeholder-key'
      );
    });
  });

  describe('client export', () => {
    it('TC-SB-07: should export a supabase client instance', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const { supabase } = await import('@/server/lib/supabase');

      expect(supabase).toBe(mockClient);
      expect(supabase.from).toBeDefined();
    });

    it('TC-SB-08: should call createClient exactly once (singleton pattern)', async () => {
      process.env.SUPABASE_URL = 'https://singleton-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'singleton-key';

      // Import the module
      await import('@/server/lib/supabase');

      // createClient should only be called once during module initialization
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });
  });
});
