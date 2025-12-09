// lib/utils/retry.ts - Retry utility with exponential backoff for AI API calls

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;

  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs: number;

  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs: number;

  /** Multiplier for exponential growth (default: 2) */
  backoffMultiplier: number;

  /** Jitter factor 0-1 to randomize delays (default: 0.1) */
  jitterFactor: number;

  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;

  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/**
 * HTTP status codes that indicate transient errors (should retry)
 */
const RETRYABLE_STATUS_CODES = new Set([
  429, // Rate limited
  500, // Internal server error
  502, // Bad gateway
  503, // Service unavailable
  504, // Gateway timeout
  529, // Anthropic overloaded
]);

/**
 * HTTP status codes that indicate permanent errors (should NOT retry)
 */
const NON_RETRYABLE_STATUS_CODES = new Set([
  400, // Bad request (validation)
  401, // Unauthorized
  403, // Forbidden
  404, // Not found
]);

/**
 * Determines if an error is transient and should be retried
 */
export function isRetryableError(error: unknown): boolean {
  // Network/fetch errors are retryable
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('connection')
    ) {
      return true;
    }
  }

  // Check for status code
  const status = getErrorStatus(error);

  // Explicitly non-retryable
  if (status !== null && NON_RETRYABLE_STATUS_CODES.has(status)) {
    return false;
  }

  // Explicitly retryable
  if (status !== null && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  // Anthropic-specific error types
  if (isAnthropicError(error)) {
    const type = (error as { type?: string }).type;
    return type === 'rate_limit_error' || type === 'api_error';
  }

  // ECONNRESET and similar network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('etimedout') ||
      message.includes('socket hang up') ||
      message.includes('network')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Extract status code from various error formats
 */
export function getErrorStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    // Standard status property
    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
      return (error as { status: number }).status;
    }
    // Alternative statusCode property
    if (
      'statusCode' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number'
    ) {
      return (error as { statusCode: number }).statusCode;
    }
    // Check for response.status (fetch errors)
    if (
      'response' in error &&
      typeof (error as { response: { status?: unknown } }).response === 'object' &&
      (error as { response: { status?: unknown } }).response !== null
    ) {
      const response = (error as { response: { status?: unknown } }).response;
      if (typeof response.status === 'number') {
        return response.status;
      }
    }
  }
  return null;
}

/**
 * Extract error message from various error formats
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    if ('error' in error && typeof (error as { error: unknown }).error === 'string') {
      return (error as { error: string }).error;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * Check if error is from Anthropic SDK
 */
function isAnthropicError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof (error as { type: unknown }).type === 'string'
  );
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitterFactor: number
): number {
  // Exponential backoff: baseDelay * multiplier^attempt
  const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);

  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * jitterFactor * Math.random();

  // Cap at maxDelayMs
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param config - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => client.messages.create(config),
 *   { maxRetries: 3, baseDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_CONFIG.maxRetries,
    baseDelayMs = DEFAULT_CONFIG.baseDelayMs,
    maxDelayMs = DEFAULT_CONFIG.maxDelayMs,
    backoffMultiplier = DEFAULT_CONFIG.backoffMultiplier,
    jitterFactor = DEFAULT_CONFIG.jitterFactor,
    isRetryable = isRetryableError,
    onRetry,
  } = config;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we've exhausted retries or error is not retryable
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = calculateDelay(
        attempt,
        baseDelayMs,
        maxDelayMs,
        backoffMultiplier,
        jitterFactor
      );

      // Notify of retry attempt
      onRetry?.(attempt + 1, error, delay);

      // Wait before retry
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Pre-configured retry wrapper for AI API calls
 *
 * Uses optimized defaults for Anthropic Claude API:
 * - 3 retries max
 * - 1s base delay, exponential backoff (1s -> 2s -> 4s)
 * - 30s max delay
 * - 10% jitter
 *
 * @param fn - The async AI API function to retry
 * @param options - Optional operation name for logging
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const response = await withAIRetry(
 *   () => client.messages.create(config),
 *   { operation: 'reflection.create' }
 * );
 * ```
 */
export async function withAIRetry<T>(
  fn: () => Promise<T>,
  options?: {
    operation?: string;
    onRetry?: (attempt: number, error: unknown) => void;
  }
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
    isRetryable: isRetryableError,
    onRetry: (attempt, error, delay) => {
      const operationName = options?.operation ?? 'AI API';
      const errorMessage = getErrorMessage(error);
      const status = getErrorStatus(error);

      console.warn(
        `[${operationName}] Retry ${attempt} after ${Math.round(delay)}ms:`,
        status ? `Status ${status} -` : '',
        errorMessage
      );

      options?.onRetry?.(attempt, error);
    },
  });
}
