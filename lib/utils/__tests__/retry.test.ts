// lib/utils/__tests__/retry.test.ts - Comprehensive tests for retry utility
// Tests exponential backoff, error classification, and retry behavior

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getErrorMessage,
  getErrorStatus,
  isRetryableError,
  withAIRetry,
  withRetry,
} from '../retry';

import { anthropicErrors } from '@/test/mocks/anthropic';

// =====================================================
// withRetry FUNCTION TESTS
// =====================================================

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------
  // Success Cases
  // -------------------------------------------------

  describe('success cases', () => {
    it('succeeds on first try without any retries', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('succeeds after first retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 100 });

      // Advance timers to complete the retry delay
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('succeeds after multiple retries', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 503, message: 'Service unavailable' })
        .mockRejectedValueOnce({ status: 503, message: 'Service unavailable' })
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 100 });

      // Advance timers to complete both retry delays
      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  // -------------------------------------------------
  // Retry Behavior
  // -------------------------------------------------

  describe('retry behavior', () => {
    it('retries on 429 (rate limit) error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 10 });
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on 529 (Anthropic overloaded) error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 529, message: 'API overloaded' })
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 10 });
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on 500 (internal server error)', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 500, message: 'Internal server error' })
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 10 });
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on 502 (bad gateway) error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 502, message: 'Bad gateway' })
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 10 });
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on 503 (service unavailable) error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 503, message: 'Service unavailable' })
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 10 });
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on 504 (gateway timeout) error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 504, message: 'Gateway timeout' })
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 10 });
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on network error', async () => {
      const networkError = new TypeError('Failed to fetch');
      const fn = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 10 });
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on ECONNRESET error', async () => {
      const connectionError = new Error('ECONNRESET');
      const fn = vi.fn().mockRejectedValueOnce(connectionError).mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 10 });
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------
  // Non-Retryable Errors (Permanent Failures)
  // -------------------------------------------------

  describe('non-retryable errors (permanent failures)', () => {
    it('does NOT retry on 400 (bad request) error', async () => {
      const error = { status: 400, message: 'Invalid request' };
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { baseDelayMs: 10 })).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on 401 (unauthorized) error', async () => {
      const error = { status: 401, message: 'Invalid API key' };
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { baseDelayMs: 10 })).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on 403 (forbidden) error', async () => {
      const error = { status: 403, message: 'Forbidden' };
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { baseDelayMs: 10 })).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on 404 (not found) error', async () => {
      const error = { status: 404, message: 'Not found' };
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { baseDelayMs: 10 })).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------
  // Max Retries
  // -------------------------------------------------

  describe('max retries', () => {
    it('throws after max retries exceeded', async () => {
      const error = { status: 429, message: 'Rate limited' };
      const fn = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

      // Advance timers to complete all retries
      await vi.advanceTimersByTimeAsync(1000);

      await expect(resultPromise).rejects.toEqual(error);
      // Initial call + 3 retries = 4 total calls
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('respects custom maxRetries value', async () => {
      const error = { status: 503, message: 'Service unavailable' };
      const fn = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(fn, { maxRetries: 2, baseDelayMs: 10 });

      await vi.advanceTimersByTimeAsync(500);

      await expect(resultPromise).rejects.toEqual(error);
      // Initial call + 2 retries = 3 total calls
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('handles maxRetries of 0 (no retries)', async () => {
      const error = { status: 429, message: 'Rate limited' };
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { maxRetries: 0 })).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------
  // Exponential Backoff Timing
  // -------------------------------------------------

  describe('exponential backoff timing', () => {
    it('applies exponential backoff (delays increase)', async () => {
      const error = { status: 429, message: 'Rate limited' };
      const fn = vi.fn().mockRejectedValue(error);
      const delays: number[] = [];

      const resultPromise = withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 100,
        backoffMultiplier: 2,
        jitterFactor: 0, // No jitter for predictable timing
        onRetry: (_attempt, _error, delay) => {
          delays.push(delay);
        },
      });

      await vi.advanceTimersByTimeAsync(10000);

      await expect(resultPromise).rejects.toEqual(error);

      // Verify exponential increase: 100ms, 200ms, 400ms
      expect(delays).toHaveLength(3);
      expect(delays[0]).toBe(100); // 100 * 2^0 = 100
      expect(delays[1]).toBe(200); // 100 * 2^1 = 200
      expect(delays[2]).toBe(400); // 100 * 2^2 = 400
    });

    it('respects maxDelayMs cap', async () => {
      const error = { status: 503, message: 'Service unavailable' };
      const fn = vi.fn().mockRejectedValue(error);
      const delays: number[] = [];

      const resultPromise = withRetry(fn, {
        maxRetries: 5,
        baseDelayMs: 1000,
        maxDelayMs: 2000, // Cap at 2 seconds
        backoffMultiplier: 2,
        jitterFactor: 0,
        onRetry: (_attempt, _error, delay) => {
          delays.push(delay);
        },
      });

      await vi.advanceTimersByTimeAsync(30000);

      await expect(resultPromise).rejects.toEqual(error);

      // All delays should be capped at 2000ms
      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(2000);
      });
    });
  });

  // -------------------------------------------------
  // Jitter
  // -------------------------------------------------

  describe('jitter', () => {
    it('adds randomness to delays when jitter factor > 0', async () => {
      const error = { status: 429, message: 'Rate limited' };
      const fn = vi.fn().mockRejectedValue(error);
      const delays: number[] = [];

      // Mock Math.random to return different values
      const mockRandom = vi.spyOn(Math, 'random');
      mockRandom.mockReturnValueOnce(0.5).mockReturnValueOnce(0.3).mockReturnValueOnce(0.8);

      const resultPromise = withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 100,
        backoffMultiplier: 2,
        jitterFactor: 0.5, // 50% jitter
        onRetry: (_attempt, _error, delay) => {
          delays.push(delay);
        },
      });

      await vi.advanceTimersByTimeAsync(10000);

      await expect(resultPromise).rejects.toEqual(error);

      // Delays should include jitter (not exactly exponential values)
      // Base: 100, 200, 400
      // With jitter: 100 + (100 * 0.5 * random), etc.
      expect(delays[0]).toBe(100 + 100 * 0.5 * 0.5); // 125
      expect(delays[1]).toBe(200 + 200 * 0.5 * 0.3); // 230
      expect(delays[2]).toBe(400 + 400 * 0.5 * 0.8); // 560

      mockRandom.mockRestore();
    });

    it('does not add jitter when jitter factor is 0', async () => {
      const error = { status: 429, message: 'Rate limited' };
      const fn = vi.fn().mockRejectedValue(error);
      const delays: number[] = [];

      const resultPromise = withRetry(fn, {
        maxRetries: 2,
        baseDelayMs: 100,
        backoffMultiplier: 2,
        jitterFactor: 0,
        onRetry: (_attempt, _error, delay) => {
          delays.push(delay);
        },
      });

      await vi.advanceTimersByTimeAsync(10000);

      await expect(resultPromise).rejects.toEqual(error);

      // Exact exponential values
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200);
    });
  });

  // -------------------------------------------------
  // Custom shouldRetry Function
  // -------------------------------------------------

  describe('custom shouldRetry function', () => {
    it('uses custom isRetryable function', async () => {
      const error = { status: 418, message: "I'm a teapot" };
      const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      // Custom function that makes 418 retryable
      const customIsRetryable = (err: unknown) => {
        const status = getErrorStatus(err);
        return status === 418;
      };

      const resultPromise = withRetry(fn, {
        baseDelayMs: 10,
        isRetryable: customIsRetryable,
      });

      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('custom function can prevent retries', async () => {
      const error = { status: 429, message: 'Rate limited' };
      const fn = vi.fn().mockRejectedValue(error);

      // Custom function that never retries
      const customIsRetryable = () => false;

      await expect(
        withRetry(fn, { baseDelayMs: 10, isRetryable: customIsRetryable })
      ).rejects.toEqual(error);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------
  // onRetry Callback
  // -------------------------------------------------

  describe('onRetry callback', () => {
    it('calls onRetry callback on each retry', async () => {
      const error = { status: 429, message: 'Rate limited' };
      const fn = vi.fn().mockRejectedValue(error);
      const onRetry = vi.fn();

      const resultPromise = withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 10,
        jitterFactor: 0,
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(1000);

      await expect(resultPromise).rejects.toEqual(error);

      expect(onRetry).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, error, 10);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, error, 20);
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, error, 40);
    });

    it('does not call onRetry on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const onRetry = vi.fn();

      await withRetry(fn, { onRetry });

      expect(onRetry).not.toHaveBeenCalled();
    });

    it('does not call onRetry for non-retryable errors', async () => {
      const error = { status: 400, message: 'Bad request' };
      const fn = vi.fn().mockRejectedValue(error);
      const onRetry = vi.fn();

      await expect(withRetry(fn, { onRetry })).rejects.toEqual(error);

      expect(onRetry).not.toHaveBeenCalled();
    });
  });
});

// =====================================================
// isRetryableError FUNCTION TESTS
// =====================================================

describe('isRetryableError', () => {
  describe('retryable status codes', () => {
    it('returns true for 429 (rate limited)', () => {
      expect(isRetryableError({ status: 429 })).toBe(true);
    });

    it('returns true for 500 (internal server error)', () => {
      expect(isRetryableError({ status: 500 })).toBe(true);
    });

    it('returns true for 502 (bad gateway)', () => {
      expect(isRetryableError({ status: 502 })).toBe(true);
    });

    it('returns true for 503 (service unavailable)', () => {
      expect(isRetryableError({ status: 503 })).toBe(true);
    });

    it('returns true for 504 (gateway timeout)', () => {
      expect(isRetryableError({ status: 504 })).toBe(true);
    });

    it('returns true for 529 (Anthropic overloaded)', () => {
      expect(isRetryableError({ status: 529 })).toBe(true);
    });
  });

  describe('non-retryable status codes', () => {
    it('returns false for 400 (bad request)', () => {
      expect(isRetryableError({ status: 400 })).toBe(false);
    });

    it('returns false for 401 (unauthorized)', () => {
      expect(isRetryableError({ status: 401 })).toBe(false);
    });

    it('returns false for 403 (forbidden)', () => {
      expect(isRetryableError({ status: 403 })).toBe(false);
    });

    it('returns false for 404 (not found)', () => {
      expect(isRetryableError({ status: 404 })).toBe(false);
    });
  });

  describe('network errors', () => {
    it('returns true for fetch TypeError', () => {
      const error = new TypeError('Failed to fetch');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for network TypeError', () => {
      const error = new TypeError('Network request failed');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for ECONNRESET error', () => {
      const error = new Error('ECONNRESET');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for ECONNREFUSED error', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:3000');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for ETIMEDOUT error', () => {
      const error = new Error('ETIMEDOUT');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for socket hang up error', () => {
      const error = new Error('socket hang up');
      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe('Anthropic error types', () => {
    it('returns true for rate_limit_error type', () => {
      expect(isRetryableError({ type: 'rate_limit_error', status: 429 })).toBe(true);
    });

    it('returns true for api_error type', () => {
      expect(isRetryableError({ type: 'api_error', status: 500 })).toBe(true);
    });

    it('returns false for invalid_request_error type', () => {
      expect(isRetryableError({ type: 'invalid_request_error', status: 400 })).toBe(false);
    });

    it('returns false for authentication_error type', () => {
      expect(isRetryableError({ type: 'authentication_error', status: 401 })).toBe(false);
    });
  });

  describe('mock Anthropic errors', () => {
    it('returns true for mock rateLimited error', () => {
      expect(isRetryableError(anthropicErrors.rateLimited)).toBe(true);
    });

    it('returns true for mock serverError', () => {
      expect(isRetryableError(anthropicErrors.serverError)).toBe(true);
    });

    it('returns true for mock overloaded error', () => {
      expect(isRetryableError(anthropicErrors.overloaded)).toBe(true);
    });

    it('returns false for mock unauthorized error', () => {
      expect(isRetryableError(anthropicErrors.unauthorized)).toBe(false);
    });

    it('returns false for mock invalidRequest error', () => {
      expect(isRetryableError(anthropicErrors.invalidRequest)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for null', () => {
      expect(isRetryableError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isRetryableError(undefined)).toBe(false);
    });

    it('returns false for plain string', () => {
      expect(isRetryableError('some error')).toBe(false);
    });

    it('returns false for number', () => {
      expect(isRetryableError(500)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isRetryableError({})).toBe(false);
    });

    it('handles errors without status', () => {
      const error = new Error('Something went wrong');
      expect(isRetryableError(error)).toBe(false);
    });
  });
});

// =====================================================
// getErrorStatus FUNCTION TESTS
// =====================================================

describe('getErrorStatus', () => {
  it('extracts status from status property', () => {
    expect(getErrorStatus({ status: 429 })).toBe(429);
  });

  it('extracts status from statusCode property', () => {
    expect(getErrorStatus({ statusCode: 500 })).toBe(500);
  });

  it('extracts status from response.status', () => {
    expect(getErrorStatus({ response: { status: 503 } })).toBe(503);
  });

  it('returns null for missing status', () => {
    expect(getErrorStatus({ message: 'error' })).toBe(null);
  });

  it('returns null for null input', () => {
    expect(getErrorStatus(null)).toBe(null);
  });

  it('returns null for undefined input', () => {
    expect(getErrorStatus(undefined)).toBe(null);
  });

  it('returns null for string input', () => {
    expect(getErrorStatus('error')).toBe(null);
  });

  it('returns null for non-numeric status', () => {
    expect(getErrorStatus({ status: 'error' })).toBe(null);
  });
});

// =====================================================
// getErrorMessage FUNCTION TESTS
// =====================================================

describe('getErrorMessage', () => {
  it('extracts message from Error instance', () => {
    expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
  });

  it('extracts message from message property', () => {
    expect(getErrorMessage({ message: 'Custom message' })).toBe('Custom message');
  });

  it('extracts message from error property', () => {
    expect(getErrorMessage({ error: 'Error string' })).toBe('Error string');
  });

  it('converts string to message', () => {
    expect(getErrorMessage('Plain string error')).toBe('Plain string error');
  });

  it('returns "Unknown error" for null', () => {
    expect(getErrorMessage(null)).toBe('Unknown error');
  });

  it('returns "Unknown error" for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Unknown error');
  });

  it('returns "Unknown error" for empty object', () => {
    expect(getErrorMessage({})).toBe('Unknown error');
  });
});

// =====================================================
// withAIRetry WRAPPER TESTS
// =====================================================

describe('withAIRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Suppress console.warn for cleaner test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses default AI configuration', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withAIRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on RateLimitError', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(anthropicErrors.rateLimited)
      .mockResolvedValue('success');

    const resultPromise = withAIRetry(fn);

    await vi.advanceTimersByTimeAsync(2000);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on InternalServerError', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(anthropicErrors.serverError)
      .mockResolvedValue('success');

    const resultPromise = withAIRetry(fn);

    await vi.advanceTimersByTimeAsync(2000);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on overloaded error', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(anthropicErrors.overloaded)
      .mockResolvedValue('success');

    const resultPromise = withAIRetry(fn);

    await vi.advanceTimersByTimeAsync(2000);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on AuthenticationError', async () => {
    const fn = vi.fn().mockRejectedValue(anthropicErrors.unauthorized);

    await expect(withAIRetry(fn)).rejects.toThrow('Invalid API key');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on invalid request error', async () => {
    const fn = vi.fn().mockRejectedValue(anthropicErrors.invalidRequest);

    await expect(withAIRetry(fn)).rejects.toThrow('Invalid request format');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('logs retry attempts with operation name', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    const fn = vi
      .fn()
      .mockRejectedValueOnce(anthropicErrors.rateLimited)
      .mockResolvedValue('success');

    const resultPromise = withAIRetry(fn, { operation: 'reflection.create' });

    await vi.advanceTimersByTimeAsync(2000);

    await resultPromise;

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[reflection.create]'),
      expect.any(String),
      expect.any(String)
    );
  });

  it('calls custom onRetry callback', async () => {
    const customOnRetry = vi.fn();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(anthropicErrors.rateLimited)
      .mockResolvedValue('success');

    const resultPromise = withAIRetry(fn, {
      operation: 'test.operation',
      onRetry: customOnRetry,
    });

    await vi.advanceTimersByTimeAsync(2000);

    await resultPromise;

    expect(customOnRetry).toHaveBeenCalledWith(1, anthropicErrors.rateLimited);
  });

  it('throws after 3 retries (maxRetries default)', async () => {
    const fn = vi.fn().mockRejectedValue(anthropicErrors.rateLimited);

    const resultPromise = withAIRetry(fn);

    await vi.advanceTimersByTimeAsync(60000);

    await expect(resultPromise).rejects.toThrow('Rate limit exceeded');

    // Initial call + 3 retries = 4 total calls
    expect(fn).toHaveBeenCalledTimes(4);
  });
});
