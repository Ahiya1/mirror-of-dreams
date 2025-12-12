// test/unit/server/trpc/error-formatter.test.ts - tRPC error formatter tests
// Tests error formatting and Zod error flattening through the tRPC pipeline
// Note: Sentry capture tests are in server/trpc/__tests__/sentry-integration.test.ts

import { TRPCError } from '@trpc/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZodError } from 'zod';

// Import the test infrastructure
import { proTierUser, freeTierUser, demoUser } from '@/test/fixtures/users';
import { createTestCaller, createPartialMock } from '@/test/integration/setup';

describe('tRPC error formatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TRPCError code handling', () => {
    it('TC-EF-01: should throw INTERNAL_SERVER_ERROR on database failure', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      // Mock database error on updateProfile
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database connection failed'),
            }),
          });
        }
        return createPartialMock({});
      });

      let errorCaught = false;
      try {
        await caller.auth.updateProfile({ name: 'Test Update' });
        expect.fail('Expected error to be thrown');
      } catch (error: any) {
        errorCaught = true;
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error.message).toBe('Failed to update profile');
      }
      expect(errorCaught).toBe(true);
    });

    it('TC-EF-02: should throw UNAUTHORIZED for unauthenticated user', async () => {
      // Create caller without user (unauthenticated)
      const { caller } = createTestCaller(null);

      let errorCaught = false;
      try {
        await caller.auth.me();
        expect.fail('Expected UNAUTHORIZED error');
      } catch (error: any) {
        errorCaught = true;
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('UNAUTHORIZED');
      }
      expect(errorCaught).toBe(true);
    });

    it('TC-EF-03: should throw FORBIDDEN for demo user on write operations', async () => {
      const { caller } = createTestCaller(demoUser);

      let errorCaught = false;
      try {
        // Demo users are forbidden from deleteAccount (writeProcedure blocks demo)
        await caller.auth.deleteAccount({
          confirmEmail: demoUser.email,
          password: 'test-password',
        });
        expect.fail('Expected FORBIDDEN error');
      } catch (error: any) {
        errorCaught = true;
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('FORBIDDEN');
        expect(error.message).toContain('Create a free account');
      }
      expect(errorCaught).toBe(true);
    });
  });

  describe('Zod error flattening', () => {
    it('TC-EF-04: should have ZodError as cause for validation failures', async () => {
      const { caller } = createTestCaller(null);

      let errorCaught = false;
      try {
        await caller.auth.signup({
          email: 'not-an-email', // Invalid email format
          password: '123', // Too short and missing required characters
          name: '', // Empty name
          language: 'en',
        });
        expect.fail('Expected Zod validation error');
      } catch (error: any) {
        errorCaught = true;
        // Verify the error is a BAD_REQUEST from Zod
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('BAD_REQUEST');
        // The cause should be a ZodError
        expect(error.cause).toBeDefined();
        expect(error.cause).toBeInstanceOf(ZodError);
        expect(error.cause.name).toBe('ZodError');
      }
      expect(errorCaught).toBe(true);
    });

    it('TC-EF-05: should provide flattened Zod errors with field errors', async () => {
      const { caller } = createTestCaller(null);

      let errorCaught = false;
      try {
        await caller.auth.signup({
          email: 'not-an-email', // Invalid email format
          password: '123', // Too short and missing required characters
          name: '', // Empty name
          language: 'en',
        });
        expect.fail('Expected Zod validation error');
      } catch (error: any) {
        errorCaught = true;
        // The flatten method should be available on ZodError cause
        expect(typeof error.cause.flatten).toBe('function');
        const flattened = error.cause.flatten();
        expect(flattened.fieldErrors).toBeDefined();
        // Should have errors for email, password, and name
        expect(Object.keys(flattened.fieldErrors).length).toBeGreaterThan(0);
        // Specific field errors should exist
        expect(flattened.fieldErrors.email).toBeDefined();
        expect(flattened.fieldErrors.password).toBeDefined();
        expect(flattened.fieldErrors.name).toBeDefined();
      }
      expect(errorCaught).toBe(true);
    });

    it('TC-EF-06: should NOT have ZodError cause for non-validation errors', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      // Mock database error (not a Zod validation error)
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          });
        }
        return createPartialMock({});
      });

      let errorCaught = false;
      try {
        await caller.auth.updateProfile({ name: 'Valid Name' });
        expect.fail('Expected database error');
      } catch (error: any) {
        errorCaught = true;
        expect(error).toBeInstanceOf(TRPCError);
        // This is not a Zod error, so cause should not be a ZodError
        if (error.cause) {
          expect(error.cause).not.toBeInstanceOf(ZodError);
        }
      }
      expect(errorCaught).toBe(true);
    });
  });

  describe('error message preservation', () => {
    it('TC-EF-07: should preserve custom error messages', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      // Mock database error
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          });
        }
        return createPartialMock({});
      });

      let errorCaught = false;
      try {
        await caller.auth.updateProfile({ name: 'Test' });
        expect.fail('Expected error');
      } catch (error: any) {
        errorCaught = true;
        // Should have the message defined in the auth router
        expect(error.message).toBe('Failed to update profile');
      }
      expect(errorCaught).toBe(true);
    });

    it('TC-EF-08: should preserve UNAUTHORIZED message', async () => {
      const { caller } = createTestCaller(null);

      let errorCaught = false;
      try {
        await caller.auth.me();
        expect.fail('Expected UNAUTHORIZED error');
      } catch (error: any) {
        errorCaught = true;
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toContain('Authentication required');
      }
      expect(errorCaught).toBe(true);
    });
  });
});
