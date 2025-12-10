// lib/utils/__tests__/anthropic-retry.test.ts - Tests for Anthropic-specific retry behavior
// Tests retry behavior with Anthropic SDK error types

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isRetryableError, withAIRetry, withRetry } from '../retry';

import {
  anthropicErrors,
  AnthropicMessageResponse,
  createAnthropicError,
  createMockMessageResponse,
} from '@/test/mocks/anthropic';

// =====================================================
// ANTHROPIC ERROR TYPE TESTS
// =====================================================

describe('Anthropic Error Classification', () => {
  describe('RateLimitError (429)', () => {
    it('classifies rate_limit_error as retryable', () => {
      const error = createAnthropicError('Rate limit exceeded', 'rate_limit_error', 429);
      expect(isRetryableError(error)).toBe(true);
    });

    it('classifies 429 status as retryable', () => {
      const error = { status: 429, message: 'Too many requests' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('mock rateLimited error is retryable', () => {
      expect(isRetryableError(anthropicErrors.rateLimited)).toBe(true);
    });
  });

  describe('InternalServerError (500)', () => {
    it('classifies 500 status as retryable', () => {
      const error = { status: 500, message: 'Internal server error' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('classifies api_error type as retryable', () => {
      const error = createAnthropicError('Internal server error', 'api_error', 500);
      expect(isRetryableError(error)).toBe(true);
    });

    it('mock serverError is retryable', () => {
      expect(isRetryableError(anthropicErrors.serverError)).toBe(true);
    });
  });

  describe('OverloadedError (529)', () => {
    it('classifies 529 status as retryable', () => {
      const error = { status: 529, message: 'API is overloaded' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('mock overloaded error is retryable', () => {
      expect(isRetryableError(anthropicErrors.overloaded)).toBe(true);
    });
  });

  describe('AuthenticationError (401)', () => {
    it('classifies authentication_error as NOT retryable', () => {
      const error = createAnthropicError('Invalid API key', 'authentication_error', 401);
      expect(isRetryableError(error)).toBe(false);
    });

    it('classifies 401 status as NOT retryable', () => {
      const error = { status: 401, message: 'Unauthorized' };
      expect(isRetryableError(error)).toBe(false);
    });

    it('mock unauthorized error is NOT retryable', () => {
      expect(isRetryableError(anthropicErrors.unauthorized)).toBe(false);
    });
  });

  describe('InvalidRequestError (400)', () => {
    it('classifies invalid_request_error as NOT retryable', () => {
      const error = createAnthropicError('Invalid request', 'invalid_request_error', 400);
      expect(isRetryableError(error)).toBe(false);
    });

    it('classifies 400 status as NOT retryable', () => {
      const error = { status: 400, message: 'Bad request' };
      expect(isRetryableError(error)).toBe(false);
    });

    it('mock invalidRequest error is NOT retryable', () => {
      expect(isRetryableError(anthropicErrors.invalidRequest)).toBe(false);
    });
  });
});

// =====================================================
// withAIRetry WITH ANTHROPIC ERRORS
// =====================================================

describe('withAIRetry with Anthropic Errors', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('retries on RateLimitError', () => {
    it('retries when rate limited and eventually succeeds', async () => {
      const mockResponse = createMockMessageResponse();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.rateLimited)
        .mockResolvedValue(mockResponse);

      const resultPromise = withAIRetry(fn, { operation: 'test.rateLimited' });

      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('logs retry attempts for rate limit errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const mockResponse = createMockMessageResponse();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.rateLimited)
        .mockResolvedValue(mockResponse);

      const resultPromise = withAIRetry(fn, { operation: 'reflection.create' });

      await vi.advanceTimersByTimeAsync(2000);

      await resultPromise;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[reflection.create]'),
        expect.stringContaining('429'),
        expect.stringContaining('Rate limit exceeded')
      );
    });
  });

  describe('retries on InternalServerError', () => {
    it('retries when server error and eventually succeeds', async () => {
      const mockResponse = createMockMessageResponse();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.serverError)
        .mockResolvedValue(mockResponse);

      const resultPromise = withAIRetry(fn, { operation: 'test.serverError' });

      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries multiple times on persistent server errors', async () => {
      const mockResponse = createMockMessageResponse();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.serverError)
        .mockRejectedValueOnce(anthropicErrors.serverError)
        .mockResolvedValue(mockResponse);

      const resultPromise = withAIRetry(fn);

      await vi.advanceTimersByTimeAsync(10000);

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('retries on OverloadedError', () => {
    it('retries when API is overloaded', async () => {
      const mockResponse = createMockMessageResponse();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.overloaded)
        .mockResolvedValue(mockResponse);

      const resultPromise = withAIRetry(fn);

      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('no retry on AuthenticationError', () => {
    it('fails immediately on authentication error', async () => {
      const fn = vi.fn().mockRejectedValue(anthropicErrors.unauthorized);

      await expect(withAIRetry(fn)).rejects.toThrow('Invalid API key');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not log retry attempts for auth errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const fn = vi.fn().mockRejectedValue(anthropicErrors.unauthorized);

      await expect(withAIRetry(fn)).rejects.toThrow();

      // Should not log retry attempts since no retry occurred
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('no retry on InvalidRequestError', () => {
    it('fails immediately on invalid request', async () => {
      const fn = vi.fn().mockRejectedValue(anthropicErrors.invalidRequest);

      await expect(withAIRetry(fn)).rejects.toThrow('Invalid request format');

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});

// =====================================================
// withRetry GENERIC FUNCTION WITH ANTHROPIC ERRORS
// =====================================================

describe('withRetry with Anthropic Errors', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('custom Anthropic error scenarios', () => {
    it('handles mixed error types correctly', async () => {
      const mockResponse = createMockMessageResponse();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.rateLimited)
        .mockRejectedValueOnce(anthropicErrors.serverError)
        .mockResolvedValue(mockResponse);

      const resultPromise = withRetry(fn, { baseDelayMs: 50 });

      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('stops retrying when max retries exceeded', async () => {
      const fn = vi.fn().mockRejectedValue(anthropicErrors.rateLimited);

      const resultPromise = withRetry(fn, { maxRetries: 2, baseDelayMs: 50 });

      // Attach rejection handler BEFORE advancing timers
      const assertion = expect(resultPromise).rejects.toThrow('Rate limit exceeded');

      await vi.advanceTimersByTimeAsync(1000);

      await assertion;

      // Initial call + 2 retries = 3 total
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('transitions from retryable to non-retryable error', async () => {
      // First get rate limited (retryable), then auth error (not retryable)
      const fn = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.rateLimited)
        .mockRejectedValue(anthropicErrors.unauthorized);

      const resultPromise = withRetry(fn, { baseDelayMs: 50 });

      // Attach rejection handler BEFORE advancing timers
      const assertion = expect(resultPromise).rejects.toThrow('Invalid API key');

      await vi.advanceTimersByTimeAsync(500);

      await assertion;

      // First call + retry that got auth error = 2 total
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('exponential backoff with Anthropic errors', () => {
    it('applies exponential backoff to rate limit errors', async () => {
      const fn = vi.fn().mockRejectedValue(anthropicErrors.rateLimited);
      const delays: number[] = [];

      const resultPromise = withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 100,
        backoffMultiplier: 2,
        jitterFactor: 0,
        onRetry: (_attempt, _error, delay) => {
          delays.push(delay);
        },
      });

      // Attach rejection handler BEFORE advancing timers
      const assertion = expect(resultPromise).rejects.toThrow();

      await vi.advanceTimersByTimeAsync(10000);

      await assertion;

      // Verify exponential increase
      expect(delays).toEqual([100, 200, 400]);
    });
  });
});

// =====================================================
// RETRY WRAPPER INTEGRATION TESTS
// =====================================================

describe('Retry Wrapper Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('simulated API call scenarios', () => {
    it('handles successful API call on first try', async () => {
      const mockResponse = createMockMessageResponse({
        content: [{ type: 'text', text: 'Your reflection reveals...' }],
      });

      const mockApiCall = vi.fn().mockResolvedValue(mockResponse);

      const result = await withAIRetry<AnthropicMessageResponse>(() => mockApiCall(), {
        operation: 'reflection.create',
      });

      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Your reflection reveals...',
      });
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('handles transient failure then success', async () => {
      const mockResponse = createMockMessageResponse();

      const mockApiCall = vi
        .fn()
        .mockRejectedValueOnce(
          createAnthropicError('Service temporarily unavailable', 'api_error', 503)
        )
        .mockResolvedValue(mockResponse);

      const resultPromise = withAIRetry(() => mockApiCall(), {
        operation: 'clarify.sendMessage',
      });

      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });

    it('handles complete API outage', async () => {
      const mockApiCall = vi
        .fn()
        .mockRejectedValue(createAnthropicError('Service unavailable', 'api_error', 503));

      const resultPromise = withAIRetry(() => mockApiCall(), {
        operation: 'evolution.generate',
      });

      // Attach rejection handler BEFORE advancing timers
      const assertion = expect(resultPromise).rejects.toThrow('Service unavailable');

      await vi.advanceTimersByTimeAsync(60000);

      await assertion;

      // Should have tried 4 times (initial + 3 retries)
      expect(mockApiCall).toHaveBeenCalledTimes(4);
    });

    it('handles invalid API key immediately', async () => {
      const mockApiCall = vi
        .fn()
        .mockRejectedValue(
          createAnthropicError('Invalid API key provided', 'authentication_error', 401)
        );

      await expect(
        withAIRetry(() => mockApiCall(), { operation: 'reflection.create' })
      ).rejects.toThrow('Invalid API key provided');

      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback behavior', () => {
    it('calls custom onRetry callback with error details', async () => {
      const mockResponse = createMockMessageResponse();
      const customOnRetry = vi.fn();

      const mockApiCall = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.rateLimited)
        .mockResolvedValue(mockResponse);

      const resultPromise = withAIRetry(() => mockApiCall(), {
        operation: 'test',
        onRetry: customOnRetry,
      });

      await vi.advanceTimersByTimeAsync(2000);

      await resultPromise;

      expect(customOnRetry).toHaveBeenCalledTimes(1);
      expect(customOnRetry).toHaveBeenCalledWith(1, anthropicErrors.rateLimited);
    });

    it('calls onRetry multiple times for multiple retries', async () => {
      const mockResponse = createMockMessageResponse();
      const customOnRetry = vi.fn();

      const mockApiCall = vi
        .fn()
        .mockRejectedValueOnce(anthropicErrors.rateLimited)
        .mockRejectedValueOnce(anthropicErrors.serverError)
        .mockResolvedValue(mockResponse);

      const resultPromise = withAIRetry(() => mockApiCall(), {
        operation: 'test',
        onRetry: customOnRetry,
      });

      await vi.advanceTimersByTimeAsync(10000);

      await resultPromise;

      expect(customOnRetry).toHaveBeenCalledTimes(2);
      expect(customOnRetry).toHaveBeenNthCalledWith(1, 1, anthropicErrors.rateLimited);
      expect(customOnRetry).toHaveBeenNthCalledWith(2, 2, anthropicErrors.serverError);
    });
  });
});

// =====================================================
// EDGE CASES AND ERROR FORMATS
// =====================================================

describe('Edge Cases and Error Formats', () => {
  describe('various error formats from Anthropic SDK', () => {
    it('handles error with status property', () => {
      const error = { status: 429, type: 'rate_limit_error', message: 'Rate limited' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('handles error with statusCode property', () => {
      const error = { statusCode: 503, message: 'Service unavailable' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('handles error with nested response.status', () => {
      const error = {
        message: 'Request failed',
        response: { status: 502, data: 'Bad gateway' },
      };
      expect(isRetryableError(error)).toBe(true);
    });

    it('handles error with only type property (Anthropic style)', () => {
      const error = { type: 'rate_limit_error', message: 'Rate limited' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('handles error with only type property (authentication)', () => {
      const error = { type: 'authentication_error', message: 'Invalid key' };
      // Should check type, not status - authentication_error is not retryable
      // Since there's no status, it falls through to type check
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('error message extraction', () => {
    it('extracts message from Error instance', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'warn');

      vi.useFakeTimers();

      const error = new Error('Custom error message');
      (error as Error & { status: number }).status = 500;

      const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const resultPromise = withAIRetry(fn, { operation: 'test' });

      await vi.advanceTimersByTimeAsync(2000);

      await resultPromise;

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[test]'),
        expect.stringContaining('500'),
        'Custom error message'
      );

      vi.useRealTimers();
      vi.restoreAllMocks();
    });
  });
});
