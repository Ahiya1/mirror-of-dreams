# Iteration 31: Error Monitoring & Resilience - Patterns

**Created:** 2025-12-10
**Plan:** 19
**Iteration:** 31

---

## 1. Error Boundary Patterns

### 1.1 Next.js App Router Error Boundaries

The App Router uses file-based error boundaries. Each `error.tsx` file creates an error boundary for its route segment.

**File Naming Convention:**
```
app/
  error.tsx           # Catches errors in app/* routes
  global-error.tsx    # Catches errors in root layout
  reflection/
    error.tsx         # Catches errors in /reflection/* routes
  clarify/
    error.tsx         # Catches errors in /clarify/* routes
  dashboard/
    error.tsx         # Catches errors in /dashboard/* routes
```

### 1.2 Error Boundary Component Pattern

```tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (when available)
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**Key Points:**
- Must be a Client Component (`'use client'`)
- Receives `error` and `reset` props
- `reset()` re-renders the route segment
- `error.digest` is a hash for server errors (can be used for support)

### 1.3 Global Error Boundary Pattern

The `global-error.tsx` catches errors in the root layout itself.

```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="global-error">
          <h1>Critical Error</h1>
          <p>The application encountered an unexpected error.</p>
          <button onClick={reset}>Reload Application</button>
        </div>
      </body>
    </html>
  );
}
```

**Key Points:**
- Must include its own `<html>` and `<body>` tags
- Used as last resort when root layout fails
- Should have minimal dependencies (could fail if imports fail)

### 1.4 Error Fallback Component Pattern

Create a reusable error display component for consistency:

```tsx
// components/error/ErrorFallback.tsx
'use client';

import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlassCard } from '@/components/ui/glass/GlassCard';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  errorDigest?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  variant?: 'default' | 'minimal' | 'full';
}

export function ErrorFallback({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error.',
  errorDigest,
  onRetry,
  onGoHome,
  variant = 'default',
}: ErrorFallbackProps) {
  return (
    <GlassCard className="error-fallback">
      <div className="error-icon">{/* Error icon */}</div>
      <h2 className="error-title">{title}</h2>
      <p className="error-message">{message}</p>
      {errorDigest && (
        <p className="error-digest">Error ID: {errorDigest}</p>
      )}
      <div className="error-actions">
        {onRetry && (
          <GlowButton onClick={onRetry} variant="primary">
            Try Again
          </GlowButton>
        )}
        {onGoHome && (
          <GlowButton onClick={onGoHome} variant="secondary">
            Go Home
          </GlowButton>
        )}
      </div>
    </GlassCard>
  );
}
```

### 1.5 Error UI Styling Pattern

Use existing design system tokens:

```css
/* Error states use --error-* variables */
.error-fallback {
  background: var(--error-bg);
  border-color: var(--error-border);
}

.error-title {
  color: var(--error-primary);
}

.error-message {
  color: var(--cosmic-text-secondary);
}

.error-digest {
  color: var(--cosmic-text-muted);
  font-family: monospace;
  font-size: 0.75rem;
}
```

---

## 2. Retry Logic Patterns

### 2.1 Exponential Backoff Configuration

```typescript
interface RetryConfig {
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
```

### 2.2 Retry Utility Implementation Pattern

```typescript
// lib/utils/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    jitterFactor = 0.1,
    isRetryable = defaultIsRetryable,
    onRetry,
  } = config;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
      const jitter = exponentialDelay * jitterFactor * Math.random();
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      // Notify of retry
      onRetry?.(attempt + 1, error, delay);

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 2.3 Error Classification Pattern

```typescript
// lib/utils/retry.ts

import type { APIError } from '@anthropic-ai/sdk';

/**
 * HTTP status codes that indicate transient errors
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
 * Determines if an error is transient and should be retried
 */
export function isRetryableError(error: unknown): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Check for status code
  const status = getErrorStatus(error);
  if (status && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  // Anthropic-specific error types
  if (isAnthropicError(error)) {
    const type = (error as any).type;
    return type === 'rate_limit_error' || type === 'api_error';
  }

  return false;
}

/**
 * Extract status code from various error formats
 */
export function getErrorStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    if ('status' in error && typeof (error as any).status === 'number') {
      return (error as any).status;
    }
    if ('statusCode' in error && typeof (error as any).statusCode === 'number') {
      return (error as any).statusCode;
    }
  }
  return null;
}

/**
 * Check if error is from Anthropic SDK
 */
function isAnthropicError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof (error as any).type === 'string'
  );
}
```

### 2.4 AI Call Retry Wrapper Pattern

```typescript
// lib/utils/retry.ts

/**
 * Pre-configured retry for Anthropic API calls
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
      console.warn(
        `[${options?.operation ?? 'AI'}] Retry ${attempt} after ${delay}ms:`,
        getErrorMessage(error)
      );
      options?.onRetry?.(attempt, error);
    },
  });
}
```

### 2.5 Usage in Router Pattern

```typescript
// server/trpc/routers/reflection.ts

import { withAIRetry } from '@/lib/utils/retry';

// Before (no retry):
const response = await client.messages.create(config);

// After (with retry):
const response = await withAIRetry(
  () => client.messages.create(config),
  { operation: 'reflection.create' }
);
```

---

## 3. Logging Patterns

### 3.1 Logger Configuration Pattern

```typescript
// server/lib/logger.ts

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Pretty print in development
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },

  // Base context included in all logs
  base: {
    env: process.env.NODE_ENV,
  },

  // Custom serializers
  serializers: {
    error: pino.stdSerializers.err,
  },
});

// Create child loggers for specific services
export const aiLogger = logger.child({ service: 'anthropic' });
export const dbLogger = logger.child({ service: 'supabase' });
export const authLogger = logger.child({ service: 'auth' });
export const paymentLogger = logger.child({ service: 'paypal' });
```

### 3.2 Logging Levels Usage

```typescript
// ERROR - Application errors that need attention
logger.error({ err: error, userId }, 'Failed to create reflection');

// WARN - Recoverable issues, degraded functionality
logger.warn({ retryCount: 2, delay: 2000 }, 'Retrying AI call');

// INFO - Significant events, audit trail
logger.info({ dreamId, userId }, 'Dream created successfully');

// DEBUG - Detailed debugging information (dev only)
logger.debug({ input, config }, 'AI request parameters');
```

### 3.3 Structured Error Logging Pattern

```typescript
// Replace console.error with structured logging

// Before:
console.error('Failed to create dream:', error);

// After:
logger.error(
  {
    err: error,
    operation: 'dreams.create',
    userId: ctx.user.id,
    input: { dreamTitle: input.title },
  },
  'Failed to create dream'
);
```

### 3.4 Context-Rich Logging Pattern

```typescript
// Include relevant context in logs

// In tRPC router
export const dreamRouter = router({
  create: protectedProcedure
    .input(createDreamSchema)
    .mutation(async ({ ctx, input }) => {
      const log = logger.child({
        userId: ctx.user.id,
        operation: 'dreams.create',
      });

      log.info('Creating dream');

      try {
        const result = await createDream(input);
        log.info({ dreamId: result.id }, 'Dream created');
        return result;
      } catch (error) {
        log.error({ err: error, input }, 'Failed to create dream');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create dream',
        });
      }
    }),
});
```

### 3.5 Replacing Console.error Pattern

Follow this pattern for all replacements:

```typescript
// PATTERN: console.error -> logger.error

// Step 1: Import logger
import { logger } from '@/server/lib/logger';
// Or use service-specific logger:
import { aiLogger } from '@/server/lib/logger';

// Step 2: Replace with structured call
// Before:
console.error('Claude API error:', error);

// After:
logger.error(
  {
    err: error,
    // Include relevant context:
    operation: 'reflection.create',
    userId: ctx.user.id,
    model: 'claude-sonnet-4-5-20250929',
  },
  'Claude API error'
);
```

---

## 4. Error Message Patterns

### 4.1 User-Facing Error Messages

Keep error messages helpful but not technical:

```typescript
const USER_ERROR_MESSAGES = {
  // AI errors
  'rate_limit': 'Our AI companion is resting. Please try again in a moment.',
  'api_error': 'Something unexpected happened. Please try again.',
  'timeout': 'This is taking longer than expected. Please try again.',

  // Database errors
  'db_connection': 'Unable to save your progress. Please try again.',
  'not_found': 'We could not find what you were looking for.',

  // Auth errors
  'unauthorized': 'Please sign in to continue.',
  'forbidden': 'You do not have access to this feature.',

  // Generic
  'unknown': 'Something went wrong. Please try again.',
};
```

### 4.2 Error Code Extraction Pattern

```typescript
// lib/utils/errors.ts

export function getUserFriendlyMessage(error: unknown): string {
  const status = getErrorStatus(error);
  const type = getErrorType(error);

  if (status === 429 || type === 'rate_limit_error') {
    return USER_ERROR_MESSAGES.rate_limit;
  }

  if (status && status >= 500) {
    return USER_ERROR_MESSAGES.api_error;
  }

  if (error instanceof Error && error.message.includes('timeout')) {
    return USER_ERROR_MESSAGES.timeout;
  }

  return USER_ERROR_MESSAGES.unknown;
}
```

---

## 5. Testing Patterns

### 5.1 Testing Retry Logic

```typescript
// lib/utils/__tests__/retry.test.ts

import { describe, it, expect, vi } from 'vitest';
import { withRetry, isRetryableError } from '../retry';

describe('withRetry', () => {
  it('succeeds on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on transient error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ status: 429, type: 'rate_limit_error' })
      .mockResolvedValue('success');

    const result = await withRetry(fn, {
      baseDelayMs: 10, // Fast for testing
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries', async () => {
    const error = { status: 429, type: 'rate_limit_error' };
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 10,
    })).rejects.toEqual(error);

    expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('does not retry non-retryable errors', async () => {
    const error = { status: 400, type: 'invalid_request_error' };
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('isRetryableError', () => {
  it('returns true for 429', () => {
    expect(isRetryableError({ status: 429 })).toBe(true);
  });

  it('returns true for 529', () => {
    expect(isRetryableError({ status: 529 })).toBe(true);
  });

  it('returns false for 400', () => {
    expect(isRetryableError({ status: 400 })).toBe(false);
  });

  it('returns false for 401', () => {
    expect(isRetryableError({ status: 401 })).toBe(false);
  });
});
```

### 5.2 Testing Error Boundaries

Error boundaries are best tested with integration tests, but component tests can verify rendering:

```typescript
// Test that ErrorFallback renders correctly
describe('ErrorFallback', () => {
  it('renders error message', () => {
    render(
      <ErrorFallback
        title="Test Error"
        message="Something went wrong"
        onRetry={() => {}}
      />
    );

    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onRetry when button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />);

    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalled();
  });
});
```

---

## 6. Import Patterns

### 6.1 Standard Import Order

```typescript
// 1. External packages
import Anthropic from '@anthropic-ai/sdk';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// 2. Internal absolute imports (aliased)
import { logger } from '@/server/lib/logger';
import { withAIRetry } from '@/lib/utils/retry';
import { supabase } from '@/server/lib/supabase';

// 3. Relative imports
import { router, protectedProcedure } from '../trpc';
```

### 6.2 Logger Import Pattern

```typescript
// Option 1: Base logger
import { logger } from '@/server/lib/logger';

// Option 2: Service-specific logger
import { aiLogger, dbLogger, authLogger } from '@/server/lib/logger';

// Option 3: Create child logger inline
import { logger } from '@/server/lib/logger';
const routerLogger = logger.child({ router: 'reflection' });
```

---

## 7. Design System Compliance

### 7.1 Error Colors

From `styles/variables.css`:

```css
--error-primary: rgba(239, 68, 68, 0.9);   /* Red for error text/icons */
--error-bg: rgba(239, 68, 68, 0.1);        /* Subtle red background */
--error-border: rgba(239, 68, 68, 0.3);    /* Red border */
```

### 7.2 Glass Card Pattern for Errors

```tsx
<div className="min-h-screen flex items-center justify-center p-4">
  <div className="max-w-md w-full">
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--error-border)',
        backdropFilter: 'blur(var(--glass-blur-md))',
      }}
    >
      {/* Error content */}
    </div>
  </div>
</div>
```

### 7.3 Typography for Errors

```tsx
// Error title
<h2 className="text-xl font-medium" style={{ color: 'var(--error-primary)' }}>
  Something went wrong
</h2>

// Error message
<p style={{ color: 'var(--cosmic-text-secondary)' }}>
  {error.message}
</p>

// Error code/digest
<code className="text-xs font-mono" style={{ color: 'var(--cosmic-text-muted)' }}>
  Error ID: {digest}
</code>
```

---

**Document Status:** COMPLETE
