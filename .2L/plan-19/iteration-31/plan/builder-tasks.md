# Iteration 31: Error Monitoring & Resilience - Builder Tasks

**Created:** 2025-12-10
**Plan:** 19
**Iteration:** 31

---

## Builder Overview

| Builder | Focus | Complexity | Dependencies |
|---------|-------|------------|--------------|
| Builder 1 | Error Boundaries | Medium | None |
| Builder 2 | Retry Logic | Medium | None |
| Builder 3 | Structured Logging | Medium | None |
| Builder 4 | Error UI + Tests | Low-Medium | Builder 2 |

**Execution Strategy:** Builders 1, 2, and 3 can run in parallel. Builder 4 waits for Builder 2.

---

## Builder 1: Error Boundaries

### Mission

Implement Next.js App Router error boundaries to gracefully handle React errors and provide recovery mechanisms.

### Files to Create

#### 1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx`

**Purpose:** Root route segment error boundary

**Requirements:**
- Client component (`'use client'`)
- Accepts `error` and `reset` props
- Displays error using design system (glass, cosmic theme)
- Provides "Try Again" button calling `reset()`
- Provides "Go Home" link/button
- Logs error to console (for now, Sentry later)
- Shows error digest if available

**Reference Design:**
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorFallback } from '@/components/error/ErrorFallback';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log to console (future: Sentry)
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ErrorFallback
        title="Something went wrong"
        message="We encountered an unexpected error while loading this page."
        errorDigest={error.digest}
        onRetry={reset}
        onGoHome={() => router.push('/')}
      />
    </div>
  );
}
```

#### 2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/global-error.tsx`

**Purpose:** Global error boundary for root layout errors

**Requirements:**
- Client component
- Must include its own `<html>` and `<body>` tags
- Minimal dependencies (layout might have failed)
- Inline styles (CSS might not load)
- "Reload" button using `reset()`

**Reference Design:**
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
    <html lang="en">
      <body style={{
        margin: 0,
        background: '#020617',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          textAlign: 'center',
          color: 'white',
        }}>
          <h1 style={{ color: 'rgba(239, 68, 68, 0.9)', margin: '0 0 16px' }}>
            Critical Error
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 24px' }}>
            The application encountered a critical error.
          </p>
          {error.digest && (
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
              fontFamily: 'monospace',
              margin: '0 0 24px',
            }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '8px',
              color: 'white',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
```

#### 3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/error.tsx`

**Purpose:** Error boundary for `/reflection/*` routes

**Requirements:**
- Similar to root `error.tsx`
- Custom message for reflection context
- Uses `ErrorFallback` component

#### 4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/error.tsx`

**Purpose:** Error boundary for `/clarify/*` routes

**Requirements:**
- Similar to root `error.tsx`
- Custom message for clarify context
- Uses `ErrorFallback` component

#### 5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/error.tsx`

**Purpose:** Error boundary for `/dashboard/*` routes

**Requirements:**
- Similar to root `error.tsx`
- Custom message for dashboard context
- Uses `ErrorFallback` component

#### 6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/error/ErrorFallback.tsx`

**Purpose:** Reusable error display component

**Requirements:**
- Client component
- Props: `title`, `message`, `errorDigest`, `onRetry`, `onGoHome`, `variant`
- Uses design system (GlassCard or glass styling)
- Uses GlowButton for actions
- Error icon (can be simple SVG or emoji placeholder)
- Responsive layout

**Interface:**
```typescript
interface ErrorFallbackProps {
  title?: string;
  message?: string;
  errorDigest?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  variant?: 'default' | 'minimal' | 'full';
}
```

### Success Criteria

- [ ] All 5 error boundary files created
- [ ] ErrorFallback component created
- [ ] Components follow design system
- [ ] TypeScript compiles without errors
- [ ] Error boundaries catch thrown errors
- [ ] Reset function recovers from errors
- [ ] Error digest displayed when available

---

## Builder 2: Retry Logic

### Mission

Implement exponential backoff retry utility for AI API calls and integrate it into all AI-calling routers.

### Files to Create

#### 1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/retry.ts`

**Purpose:** Retry utility with exponential backoff

**Requirements:**
- Generic `withRetry<T>` function
- Configurable: maxRetries, baseDelayMs, maxDelayMs, backoffMultiplier, jitterFactor
- Error classification: `isRetryableError(error)`
- Helper: `getErrorStatus(error)`, `getErrorMessage(error)`
- Pre-configured `withAIRetry<T>` wrapper for AI calls
- Callback support for retry events

**Interface:**
```typescript
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T>;

export async function withAIRetry<T>(
  fn: () => Promise<T>,
  options?: { operation?: string }
): Promise<T>;

export function isRetryableError(error: unknown): boolean;
export function getErrorStatus(error: unknown): number | null;
export function getErrorMessage(error: unknown): string;
```

**Default Configuration:**
```typescript
const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};
```

**Retryable Status Codes:**
- 429 (Rate Limited)
- 500 (Internal Server Error)
- 502 (Bad Gateway)
- 503 (Service Unavailable)
- 504 (Gateway Timeout)
- 529 (Anthropic Overloaded)

### Files to Modify

#### 2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`

**Changes:**
- Import `withAIRetry` from `@/lib/utils/retry`
- Wrap `anthropic.messages.create()` call with `withAIRetry`
- Keep existing error handling pattern

**Before:**
```typescript
const response = await client.messages.create(requestConfig);
```

**After:**
```typescript
import { withAIRetry } from '@/lib/utils/retry';

const response = await withAIRetry(
  () => client.messages.create(requestConfig),
  { operation: 'reflection.create' }
);
```

#### 3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`

**Changes:**
- Import `withAIRetry`
- Wrap AI calls in `createSession` and `sendMessage` mutations
- Add try/catch if missing

#### 4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts`

**Changes:**
- Import `withAIRetry`
- Add try/catch around AI calls (currently missing)
- Wrap AI calls with `withAIRetry`
- Handle errors with TRPCError

**Note:** This file currently has NO try/catch around AI calls - add error handling!

#### 5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/visualizations.ts`

**Changes:**
- Import `withAIRetry`
- Add try/catch around AI calls (currently missing)
- Wrap AI calls with `withAIRetry`

**Note:** This file currently has NO try/catch around AI calls - add error handling!

#### 6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/lifecycle.ts`

**Changes:**
- Import `withAIRetry`
- Wrap AI calls with retry logic

#### 7. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/consolidation.ts`

**Changes:**
- Import `withAIRetry`
- Wrap `extractPatternsFromSession` AI call with retry

### Success Criteria

- [ ] `lib/utils/retry.ts` created with full implementation
- [ ] `withRetry` function handles exponential backoff
- [ ] `isRetryableError` correctly classifies errors
- [ ] All 6 AI-calling files modified to use retry
- [ ] TypeScript compiles without errors
- [ ] Jitter prevents thundering herd
- [ ] Non-retryable errors fail immediately

---

## Builder 3: Structured Logging

### Mission

Implement Pino-based structured logging and replace all console.error statements in server-side code.

### Files to Create

#### 1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/logger.ts`

**Purpose:** Pino logger configuration and exports

**Requirements:**
- Configure Pino with JSON output (production) and pretty print (development)
- Create child loggers for services: `aiLogger`, `dbLogger`, `authLogger`, `paymentLogger`
- Include base context (env, timestamp)
- Configure log levels based on `LOG_LEVEL` env var

**Reference Implementation:**
```typescript
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
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
  base: {
    env: process.env.NODE_ENV,
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
});

// Service-specific loggers
export const aiLogger = logger.child({ service: 'anthropic' });
export const dbLogger = logger.child({ service: 'supabase' });
export const authLogger = logger.child({ service: 'auth' });
export const paymentLogger = logger.child({ service: 'paypal' });
export const emailLogger = logger.child({ service: 'email' });
```

### Files to Modify

#### 2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/package.json`

**Changes:**
- Add `pino` to dependencies
- Add `pino-pretty` to devDependencies

```json
{
  "dependencies": {
    "pino": "^9.0.0"
  },
  "devDependencies": {
    "pino-pretty": "^11.0.0"
  }
}
```

#### 3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`

**Changes:**
- Import `aiLogger` from `@/server/lib/logger`
- Replace `console.error('Claude API error:', error)` with structured logging

**Before:**
```typescript
console.error('Claude API error:', error);
```

**After:**
```typescript
import { aiLogger } from '@/server/lib/logger';

aiLogger.error(
  { err: error, operation: 'reflection.create', userId: ctx.user.id },
  'Claude API error'
);
```

#### 4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`

**Changes:**
- Import `authLogger`
- Replace all `console.error` statements (~4 locations)
- Add context: operation, userId (if available)

**Locations to replace:**
- Line ~75: Signup error
- Line ~264: Update profile error
- Line ~325: Change password error
- Line ~372: Delete account error

#### 5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts`

**Changes:**
- Import `paymentLogger`
- Replace all `console.error` statements (~5 locations)
- Add context: operation, subscriptionId

#### 6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`

**Changes:**
- Import `dbLogger`
- Replace `console.error` statement
- Add context: operation, dreamId

#### 7. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/lifecycle.ts`

**Changes:**
- Import `logger` or `aiLogger`
- Replace all `console.error` statements (~7 locations)
- Add context: operation, dreamId

#### 8. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`

**Changes:**
- Import `aiLogger`
- Replace any `console.error` statements
- Add context: sessionId, operation

#### 9. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts`

**Changes:**
- Import `authLogger`
- Replace `console.error` statements (~2 locations)
- Add context: operation

#### 10. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts`

**Changes:**
- Import `paymentLogger`
- Replace `console.error` statements (~2 locations)
- Add context: operation, webhookId

#### 11. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/email.ts`

**Changes:**
- Import `emailLogger`
- Replace `console.error` statements (~3 locations)
- Add context: operation, emailType

#### 12. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/consolidation.ts`

**Changes:**
- Import `aiLogger`
- Replace `console.error` statements (~7 locations)
- Add context: sessionId, operation

#### 13. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts`

**Changes:**
- Import `logger`
- Replace `console.warn` and `console.error` statements
- Use `logger.warn` for disabled rate limiter
- Use `logger.error` for rate limiter errors

### Success Criteria

- [ ] `server/lib/logger.ts` created
- [ ] `pino` and `pino-pretty` added to package.json
- [ ] All console.error statements in routers replaced (20+)
- [ ] All console.error in lib files replaced
- [ ] Console.warn in rate-limiter replaced
- [ ] Structured context included in all logs
- [ ] TypeScript compiles without errors
- [ ] Development logs are pretty-printed
- [ ] Production logs are JSON

---

## Builder 4: Error UI + Tests

### Mission

Improve client-side error handling and create unit tests for the retry utility and logger.

### Files to Create

#### 1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts`

**Purpose:** Unit tests for retry utility

**Test Cases:**
```typescript
describe('withRetry', () => {
  it('succeeds on first try');
  it('retries on 429 error');
  it('retries on 529 error');
  it('retries on network error');
  it('applies exponential backoff');
  it('applies jitter to delays');
  it('throws after max retries');
  it('does not retry 400 errors');
  it('does not retry 401 errors');
  it('calls onRetry callback');
  it('respects maxDelayMs cap');
});

describe('isRetryableError', () => {
  it('returns true for 429');
  it('returns true for 500');
  it('returns true for 502');
  it('returns true for 503');
  it('returns true for 504');
  it('returns true for 529');
  it('returns false for 400');
  it('returns false for 401');
  it('returns false for 404');
  it('handles errors without status');
});

describe('withAIRetry', () => {
  it('uses default AI configuration');
  it('logs retry attempts');
});
```

#### 2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/logger.test.ts`

**Purpose:** Unit tests for logger configuration

**Test Cases:**
```typescript
describe('logger', () => {
  it('exports base logger');
  it('exports aiLogger with service context');
  it('exports dbLogger with service context');
  it('exports authLogger with service context');
  it('exports paymentLogger with service context');
  it('exports emailLogger with service context');
  it('includes base context in logs');
});
```

### Files to Modify (Optional Improvements)

#### 3. Client-side error handling improvements

If time permits, improve error handling in these components:

**`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/providers/TRPCProvider.tsx`**

**Optional Changes:**
- Add global `onError` callback to QueryClient
- Log client-side errors consistently

**Example:**
```typescript
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: true,
          retry: false, // We handle retries server-side
        },
        mutations: {
          retry: false,
          onError: (error) => {
            console.error('Mutation error:', error);
          },
        },
      },
    })
);
```

### Test Setup

**Reference existing mocks:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`

**Use mock errors:**
```typescript
import { anthropicErrors } from '@/test/mocks/anthropic';

// In tests
mockFn.mockRejectedValueOnce(anthropicErrors.rateLimited);
mockFn.mockRejectedValueOnce(anthropicErrors.overloaded);
mockFn.mockRejectedValueOnce(anthropicErrors.serverError);
```

### Success Criteria

- [ ] `retry.test.ts` created with comprehensive tests
- [ ] `logger.test.ts` created with basic tests
- [ ] All tests pass
- [ ] Tests use vitest patterns
- [ ] Tests cover edge cases (no status, undefined errors)
- [ ] Tests verify backoff timing (approximately)
- [ ] Tests verify jitter is applied

---

## Coordination Notes

### Import Consistency

All builders should use consistent import patterns:

```typescript
// Logger import
import { logger, aiLogger, dbLogger } from '@/server/lib/logger';

// Retry import
import { withAIRetry, isRetryableError } from '@/lib/utils/retry';
```

### Error Handling Pattern

When both retry and logging are applied:

```typescript
import { withAIRetry } from '@/lib/utils/retry';
import { aiLogger } from '@/server/lib/logger';

try {
  const response = await withAIRetry(
    () => client.messages.create(config),
    { operation: 'reflection.create' }
  );
  // Process response
} catch (error) {
  aiLogger.error(
    { err: error, operation: 'reflection.create', userId: ctx.user.id },
    'Failed to create reflection after retries'
  );
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to generate reflection',
  });
}
```

### File Modification Overlap

Some files are modified by multiple builders:

| File | Builder 2 | Builder 3 |
|------|-----------|-----------|
| `reflection.ts` | Add retry | Replace console.error |
| `clarify.ts` | Add retry | Replace console.error |
| `evolution.ts` | Add retry | N/A |
| `visualizations.ts` | Add retry | N/A |
| `lifecycle.ts` | Add retry | Replace console.error |
| `consolidation.ts` | Add retry | Replace console.error |

**Integration Strategy:**
- Builders should both modify these files
- Integrator will merge changes
- No conflicts expected (different lines modified)

---

## Verification Checklist

After all builders complete:

### Build Verification
```bash
# Install new dependencies
npm install

# TypeScript compilation
npm run build

# Should complete with no errors
```

### Test Verification
```bash
# Run new tests
npm run test -- lib/utils/__tests__/retry.test.ts
npm run test -- server/lib/__tests__/logger.test.ts

# All tests should pass
```

### Runtime Verification

1. **Error Boundary Test:**
   - Temporarily throw error in a component
   - Verify error boundary renders
   - Verify reset recovers

2. **Retry Test:**
   - Monitor console for retry logs
   - Verify exponential backoff timing

3. **Logger Test:**
   - Verify structured output in development
   - Check context is included

---

**Document Status:** COMPLETE
