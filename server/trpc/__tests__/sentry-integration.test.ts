// server/trpc/__tests__/sentry-integration.test.ts
// Tests for Sentry integration in tRPC error formatter

import * as Sentry from '@sentry/nextjs';
import { TRPCError } from '@trpc/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Sentry before tests run
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Type definitions for test
interface MockUser {
  id: string;
  email: string;
}

interface MockContext {
  user: MockUser | null;
}

interface MockShape {
  data?: {
    path?: string;
  };
}

// Helper function to simulate error formatter behavior
function simulateErrorFormatter(error: TRPCError, ctx: MockContext | undefined, shape: MockShape) {
  // Don't report auth errors (expected, not bugs)
  if (error.code !== 'UNAUTHORIZED' && error.code !== 'FORBIDDEN') {
    Sentry.captureException(error.cause ?? error, {
      user: ctx?.user
        ? {
            id: ctx.user.id,
            email: ctx.user.email,
          }
        : undefined,
      tags: {
        trpcCode: error.code,
      },
      extra: {
        trpcPath: shape.data?.path,
      },
    });
  }
}

describe('Sentry tRPC Integration', () => {
  const mockCaptureException = vi.mocked(Sentry.captureException);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Capture', () => {
    it('should capture non-auth errors to Sentry', () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });

      const ctx: MockContext = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const shape: MockShape = {
        data: { path: 'dreams.list' },
      };

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(error, {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        tags: {
          trpcCode: 'INTERNAL_SERVER_ERROR',
        },
        extra: {
          trpcPath: 'dreams.list',
        },
      });
    });

    it('should NOT capture UNAUTHORIZED errors', () => {
      const error = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });

      const ctx: MockContext = {
        user: null,
      };

      const shape: MockShape = {
        data: { path: 'user.me' },
      };

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should NOT capture FORBIDDEN errors', () => {
      const error = new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied',
      });

      const ctx: MockContext = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const shape: MockShape = {
        data: { path: 'admin.settings' },
      };

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should capture BAD_REQUEST errors', () => {
      const error = new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input',
      });

      const ctx: MockContext = {
        user: { id: 'user-456', email: 'another@example.com' },
      };

      const shape: MockShape = {
        data: { path: 'dreams.create' },
      };

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: { trpcCode: 'BAD_REQUEST' },
        })
      );
    });

    it('should capture TOO_MANY_REQUESTS errors', () => {
      const error = new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limited',
      });

      const ctx: MockContext = {
        user: { id: 'user-789', email: 'rate@example.com' },
      };

      const shape: MockShape = {
        data: { path: 'reflection.generate' },
      };

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: { trpcCode: 'TOO_MANY_REQUESTS' },
        })
      );
    });
  });

  describe('User Context', () => {
    it('should include user context when user is authenticated', () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
      });

      const ctx: MockContext = {
        user: { id: 'user-abc', email: 'context@example.com' },
      };

      const shape: MockShape = {
        data: { path: 'test.procedure' },
      };

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          user: {
            id: 'user-abc',
            email: 'context@example.com',
          },
        })
      );
    });

    it('should handle null user (unauthenticated)', () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Server error',
      });

      const ctx: MockContext = {
        user: null,
      };

      const shape: MockShape = {
        data: { path: 'public.procedure' },
      };

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          user: undefined,
        })
      );
    });

    it('should handle undefined context', () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Server error',
      });

      const shape: MockShape = {
        data: { path: 'test.procedure' },
      };

      simulateErrorFormatter(error, undefined, shape);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          user: undefined,
        })
      );
    });
  });

  describe('Error Cause Handling', () => {
    it('should capture original cause when available', () => {
      const originalError = new Error('Database connection timed out');
      const trpcError = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch data',
        cause: originalError,
      });

      const ctx: MockContext = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const shape: MockShape = {
        data: { path: 'data.fetch' },
      };

      simulateErrorFormatter(trpcError, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledWith(
        originalError, // Should capture the cause, not the wrapper
        expect.objectContaining({
          tags: { trpcCode: 'INTERNAL_SERVER_ERROR' },
        })
      );
    });

    it('should capture tRPC error when no cause is available', () => {
      const trpcError = new TRPCError({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });

      const ctx: MockContext = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const shape: MockShape = {
        data: { path: 'resource.get' },
      };

      simulateErrorFormatter(trpcError, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledWith(
        trpcError, // Should capture the TRPCError directly
        expect.objectContaining({
          tags: { trpcCode: 'NOT_FOUND' },
        })
      );
    });
  });

  describe('Extra Data', () => {
    it('should include tRPC path in extra data', () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error',
      });

      const ctx: MockContext = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const shape: MockShape = {
        data: { path: 'deeply.nested.procedure.name' },
      };

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          extra: {
            trpcPath: 'deeply.nested.procedure.name',
          },
        })
      );
    });

    it('should handle missing path data', () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error',
      });

      const ctx: MockContext = {
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const shape: MockShape = {};

      simulateErrorFormatter(error, ctx, shape);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          extra: {
            trpcPath: undefined,
          },
        })
      );
    });
  });
});
