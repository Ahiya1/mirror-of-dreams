# Explorer 2 Report: Rate Limiter Fail-Closed & Sentry Integration

## Executive Summary

The current rate limiter in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts` exhibits **fail-open behavior** at line 77, which is a security risk allowing unlimited requests when Redis is unavailable. Additionally, all 6 error boundary files contain placeholder comments like "future: integrate with Sentry" but no actual Sentry integration exists. This report provides exact code changes, circuit breaker implementation strategy, and Sentry integration steps for Next.js 14 App Router.

## Discoveries

### Rate Limiter Fail-Open Analysis

**Current Behavior (INSECURE):**
- File: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts`
- Lines 74-78:
```typescript
} catch (e) {
  logger.error({ service: 'rate-limiter', err: e, identifier }, 'Rate limiter error');
  // Graceful degradation - allow request if Redis fails
  return { success: true };  // <-- SECURITY ISSUE: Fail-open
}
```

**Usage Points:**
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` - Line 211: `rateLimitByIp()` middleware
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` - Line 237: `rateLimitByUser()` middleware
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/api-rate-limit.ts` - Line 29: `withRateLimit()` helper

### Error Boundary Sentry Integration Points

**All 6 error.tsx files have identical pattern:**
```typescript
useEffect(() => {
  // Log error to console (future: integrate with Sentry)
  console.error('[Error Boundary] Route error:', {
    message: error.message,
    digest: error.digest,
    stack: error.stack,
  });
}, [error]);
```

| File | Line | Comment |
|------|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx` | 27 | "future: integrate with Sentry" |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/global-error.tsx` | 23 | "future: integrate with Sentry" |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/error.tsx` | 23 | "future: integrate with Sentry" |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/error.tsx` | 23 | "future: integrate with Sentry" |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/error.tsx` | 23 | "future: integrate with Sentry" |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/error.tsx` | 23 | "future: integrate with Sentry" |

### Additional Sentry Integration Points Needed

**API Routes with Error Handling:**
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/paypal/route.ts` - Line 116
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts` - Line 401

**tRPC Routers with catch blocks:**
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` - Line 127
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` - Lines 377, 593
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts` - Lines 173, 407
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts` - Line 68

## Patterns Identified

### Pattern 1: Fail-Closed with Circuit Breaker

**Description:** Convert fail-open to fail-closed with circuit breaker to prevent cascading failures

**Implementation Strategy:**
```typescript
// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitState: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

// Configuration
const FAILURE_THRESHOLD = 5;  // Open circuit after 5 consecutive failures
const RECOVERY_TIMEOUT_MS = 30000;  // Try again after 30 seconds
```

**Use Case:** All rate limiting operations where Redis unavailability should block requests (security-first approach)

**Recommendation:** YES - Critical for security

### Pattern 2: Sentry Error Boundary Hook

**Description:** Create a reusable hook for error reporting in error boundaries

**Implementation:**
```typescript
// lib/hooks/useSentryCapture.ts
import * as Sentry from '@sentry/nextjs';

export function useSentryCapture(error: Error & { digest?: string }) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { digest: error.digest },
      extra: {
        componentStack: error.stack,
        digest: error.digest,
      },
    });
  }, [error]);
}
```

**Use Case:** All 6 error boundary files

**Recommendation:** YES - DRY principle

### Pattern 3: Sentry tRPC Error Handler

**Description:** Global error handler for tRPC that captures all unhandled errors

**Implementation:**
```typescript
// server/trpc/trpc.ts - Add to initTRPC
const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error, ctx }) => {
    if (error.code !== 'UNAUTHORIZED') {
      Sentry.captureException(error, {
        user: ctx?.user ? { id: ctx.user.id, email: ctx.user.email } : undefined,
        tags: { trpcCode: error.code },
      });
    }
    return shape;
  },
});
```

**Recommendation:** YES - Captures all tRPC errors automatically

## Complexity Assessment

### High Complexity Areas

**Rate Limiter Circuit Breaker Implementation:**
- Need to maintain state across requests (use Redis or in-memory with cluster awareness)
- Must handle race conditions in distributed environment
- Needs proper recovery logic and half-open state
- Estimated effort: 4-6 hours
- Builder splits needed: None (single focused task)

### Medium Complexity Areas

**Sentry Next.js 14 App Router Integration:**
- Must handle both client and server components
- Source maps configuration for production debugging
- Need to set up instrumentation.ts for server-side capture
- Estimated effort: 2-3 hours

**Error Boundary Sentry Updates:**
- 6 files to update with similar pattern
- Need to test each boundary type
- Estimated effort: 1-2 hours

### Low Complexity Areas

**tRPC Error Handler:**
- Single file change in trpc.ts
- Well-documented pattern
- Estimated effort: 30 minutes

## Technology Recommendations

### Primary Stack

**Sentry SDK:** `@sentry/nextjs` - Specific to Next.js with App Router support
  - Rationale: Official Sentry package with built-in Next.js integration
  - Version: Latest (^8.x as of 2025)
  - Features: Automatic error capture, source maps, performance monitoring

### Supporting Libraries

None needed - Sentry SDK handles everything

## Exact Code Changes Required

### 1. Rate Limiter Fail-Closed (server/lib/rate-limiter.ts)

**Before (Lines 54-79):**
```typescript
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  if (!limiter) {
    // Rate limiting disabled - allow request
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (e) {
    logger.error({ service: 'rate-limiter', err: e, identifier }, 'Rate limiter error');
    // Graceful degradation - allow request if Redis fails
    return { success: true };
  }
}
```

**After (Complete replacement):**
```typescript
// Circuit breaker configuration
const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 5,        // Open after 5 consecutive failures
  RECOVERY_TIMEOUT_MS: 30000,  // 30 seconds before half-open
  HALF_OPEN_REQUESTS: 3,       // Allow 3 test requests in half-open
};

// Circuit breaker state (module-level singleton)
let circuitState = {
  failures: 0,
  lastFailure: 0,
  halfOpenRequests: 0,
};

/**
 * Check if circuit breaker should block requests
 */
function isCircuitOpen(): boolean {
  const now = Date.now();
  
  // Check if we're in recovery period (half-open)
  if (circuitState.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
    const timeSinceLastFailure = now - circuitState.lastFailure;
    
    if (timeSinceLastFailure < CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS) {
      return true; // Circuit is open, block requests
    }
    
    // Transition to half-open: allow limited test requests
    if (circuitState.halfOpenRequests < CIRCUIT_BREAKER.HALF_OPEN_REQUESTS) {
      circuitState.halfOpenRequests++;
      return false; // Allow test request
    }
    
    return true; // Half-open quota exhausted, stay open
  }
  
  return false; // Circuit is closed, allow requests
}

/**
 * Record successful request (reset circuit breaker)
 */
function recordSuccess(): void {
  if (circuitState.failures > 0) {
    logger.info(
      { service: 'rate-limiter', previousFailures: circuitState.failures },
      'Circuit breaker: Redis recovered, resetting'
    );
  }
  circuitState = { failures: 0, lastFailure: 0, halfOpenRequests: 0 };
}

/**
 * Record failed request (increment circuit breaker)
 */
function recordFailure(): void {
  circuitState.failures++;
  circuitState.lastFailure = Date.now();
  circuitState.halfOpenRequests = 0;
  
  if (circuitState.failures === CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
    logger.error(
      { 
        service: 'rate-limiter', 
        failureCount: circuitState.failures,
        recoveryTimeMs: CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS 
      },
      'Circuit breaker OPEN: Rate limiting will reject all requests'
    );
  }
}

/**
 * Check rate limit - returns true if allowed, false if blocked
 * FAIL-CLOSED: Rejects requests when Redis is unavailable
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number; circuitOpen?: boolean }> {
  // Rate limiting disabled via config - allow request
  if (!limiter) {
    return { success: true };
  }

  // Circuit breaker is open - reject request
  if (isCircuitOpen()) {
    logger.warn(
      { service: 'rate-limiter', identifier, circuitState },
      'Rate limit check rejected: Circuit breaker open'
    );
    return { success: false, circuitOpen: true };
  }

  try {
    const result = await limiter.limit(identifier);
    recordSuccess(); // Reset circuit breaker on success
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (e) {
    logger.error(
      { service: 'rate-limiter', err: e, identifier, failureCount: circuitState.failures + 1 },
      'Rate limiter error - FAIL-CLOSED: rejecting request'
    );
    recordFailure();
    // FAIL-CLOSED: Reject request when Redis fails
    return { success: false, circuitOpen: true };
  }
}

/**
 * Get current circuit breaker status (for monitoring/health checks)
 */
export function getCircuitBreakerStatus(): {
  isOpen: boolean;
  failures: number;
  timeSinceLastFailure: number | null;
  recoveryIn: number | null;
} {
  const now = Date.now();
  const isOpen = circuitState.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD;
  const timeSinceLastFailure = circuitState.lastFailure ? now - circuitState.lastFailure : null;
  const recoveryIn = isOpen && timeSinceLastFailure 
    ? Math.max(0, CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS - timeSinceLastFailure)
    : null;
    
  return {
    isOpen,
    failures: circuitState.failures,
    timeSinceLastFailure,
    recoveryIn,
  };
}
```

### 2. Update Middleware Error Messages (server/trpc/middleware.ts)

**Lines 213-221 (rateLimitByIp):**
```typescript
if (!result.success) {
  const message = result.circuitOpen 
    ? 'Service temporarily unavailable. Please try again shortly.'
    : 'Too many requests. Please try again later.';
  throw new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message,
  });
}
```

**Lines 239-245 (rateLimitByUser):**
```typescript
if (!result.success) {
  const message = result.circuitOpen
    ? 'Service temporarily unavailable. Please try again shortly.'
    : 'Rate limit exceeded. Please slow down.';
  throw new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message,
  });
}
```

### 3. Sentry Integration Files

**Create /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.client.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Error filtering
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /^Network request failed$/,
    /^Load failed$/,
  ],
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking (set by Vercel)
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

**Create /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.server.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

**Create /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.edge.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
});
```

**Create /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/instrumentation.ts:**
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
```

**Update /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/next.config.js:**
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

// ... existing config ...

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry webpack plugin options
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    
    // Suppresses source map upload logs during build
    silent: true,
    
    // Routes browser source maps to Sentry
    widenClientFileUpload: true,
    
    // Hides source maps from generated client bundles
    hideSourceMaps: true,
    
    // Tree shaking for smaller bundles
    disableLogger: true,
  }
);
```

### 4. Error Boundary Sentry Integration

**Update /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx (Lines 26-33):**
```typescript
import * as Sentry from '@sentry/nextjs';

// ... existing imports ...

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Capture error in Sentry with context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'root',
        digest: error.digest,
      },
      extra: {
        componentStack: error.stack,
      },
    });
  }, [error]);

  // ... rest unchanged
}
```

**Same pattern for all 5 other error.tsx files:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/global-error.tsx` - tags: `{ errorBoundary: 'global' }`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/error.tsx` - tags: `{ errorBoundary: 'dashboard' }`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/error.tsx` - tags: `{ errorBoundary: 'dreams' }`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/error.tsx` - tags: `{ errorBoundary: 'clarify' }`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/error.tsx` - tags: `{ errorBoundary: 'reflection' }`

### 5. tRPC Sentry Integration

**Update /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/trpc.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

// Add to initTRPC configuration
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error, ctx }) => {
    // Don't report auth errors (not bugs)
    if (error.code !== 'UNAUTHORIZED' && error.code !== 'FORBIDDEN') {
      Sentry.captureException(error, {
        user: ctx?.user ? { 
          id: ctx.user.id, 
          email: ctx.user.email,
          username: ctx.user.name,
        } : undefined,
        tags: { 
          trpcCode: error.code,
          trpcPath: error.path,
        },
        extra: {
          input: error.input,
        },
      });
    }
    return shape;
  },
});
```

### 6. API Route Sentry Integration

**Update /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/paypal/route.ts (Line 115-124):**
```typescript
import * as Sentry from '@sentry/nextjs';

// ... in catch block ...
} catch (error: unknown) {
  Sentry.captureException(error, {
    tags: { 
      webhook: 'paypal',
      eventType: 'unknown', // If we can't parse the event
    },
  });
  console.error('[PayPal Webhook] Error:', error);
  // ... rest unchanged
}
```

**Update /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts (Line 400-403):**
```typescript
import * as Sentry from '@sentry/nextjs';

// ... in catch block ...
} catch (error) {
  Sentry.captureException(error, {
    tags: { 
      api: 'clarify-stream',
      sessionId: sessionId,
    },
    user: user ? { id: user.id, email: user.email } : undefined,
  });
  console.error('Streaming error:', error);
  sendEvent('error', { message: 'Failed to generate response' });
}
```

## Test Requirements

### Rate Limiter Tests to Update

**File: /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/rate-limiter.test.ts**

**Update existing test (Lines 104-119):**
```typescript
// CHANGE: This test currently expects success: true (fail-open)
// UPDATE to expect success: false (fail-closed)
it('returns success false on Redis error (fail-closed behavior)', async () => {
  const mockLimiter: MockLimiter = {
    limit: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
  };

  const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');

  expect(result.success).toBe(false);  // Changed from true to false
  expect(result.circuitOpen).toBe(true);  // New field
  expect(mockLogger.error).toHaveBeenCalled();
});
```

**Add new circuit breaker tests:**
```typescript
describe('Circuit Breaker', () => {
  it('opens circuit after 5 consecutive failures', async () => {
    const mockLimiter: MockLimiter = {
      limit: vi.fn().mockRejectedValue(new Error('Redis down')),
    };

    // 5 failures should open circuit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
    }

    const status = getCircuitBreakerStatus();
    expect(status.isOpen).toBe(true);
    expect(status.failures).toBe(5);
  });

  it('resets circuit on successful request', async () => {
    const mockLimiter: MockLimiter = {
      limit: vi.fn()
        .mockRejectedValueOnce(new Error('Redis down'))
        .mockRejectedValueOnce(new Error('Redis down'))
        .mockResolvedValue({ success: true, remaining: 5, reset: Date.now() + 60000 }),
    };

    await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
    await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
    
    let status = getCircuitBreakerStatus();
    expect(status.failures).toBe(2);

    // Success resets circuit
    await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
    
    status = getCircuitBreakerStatus();
    expect(status.failures).toBe(0);
    expect(status.isOpen).toBe(false);
  });

  it('allows half-open requests after recovery timeout', async () => {
    // This test needs timer mocking
    vi.useFakeTimers();
    
    const mockLimiter: MockLimiter = {
      limit: vi.fn().mockRejectedValue(new Error('Redis down')),
    };

    // Open circuit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
    }

    // Advance time past recovery timeout
    vi.advanceTimersByTime(31000); // 31 seconds

    // Should allow half-open request
    mockLimiter.limit = vi.fn().mockResolvedValue({ 
      success: true, remaining: 5, reset: Date.now() + 60000 
    });
    
    const result = await checkRateLimit(asMockRateLimiter(mockLimiter), 'test-ip');
    expect(result.success).toBe(true);
    
    vi.useRealTimers();
  });
});
```

## Environment Variables Required

**Add to /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.env.example:**
```bash
# =======================
# SENTRY (Required for production)
# =======================
# Get these from https://sentry.io
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=mirror-of-dreams
SENTRY_AUTH_TOKEN=sntrys_xxx  # For source map uploads
```

## Dependencies to Install

```bash
npm install @sentry/nextjs
```

**Note:** The Sentry wizard (`npx @sentry/wizard@latest -i nextjs`) can automate much of this, but manual setup gives more control.

## Risks & Challenges

### Technical Risks

**Risk 1: Circuit Breaker State in Serverless**
- Impact: HIGH - Vercel serverless functions don't share memory
- Mitigation: Use Redis for circuit breaker state (ironic but necessary), or accept per-instance isolation
- Recommendation: Start with in-memory (acceptable for Vercel since instances are short-lived)

**Risk 2: Sentry Performance Overhead**
- Impact: LOW - Sentry is highly optimized
- Mitigation: Use sampling (0.1 for production traces)
- Recommendation: Monitor bundle size after integration

### Complexity Risks

**Risk 1: Test Updates Breaking CI**
- Likelihood: MEDIUM - Changing expected behavior in tests
- Mitigation: Update tests atomically with code changes
- Recommendation: Single PR with both changes

## Recommendations for Planner

1. **Implement circuit breaker FIRST** before any other rate limiter changes - it's the foundation for fail-closed behavior

2. **Use in-memory circuit breaker state** for initial implementation - simpler and acceptable for Vercel serverless

3. **Run Sentry wizard** (`npx @sentry/wizard@latest -i nextjs`) to generate initial config, then customize as documented

4. **Create reusable error capture hook** to avoid repetition in error boundaries

5. **Update tRPC errorFormatter** for automatic capture of all server-side errors

6. **Test circuit breaker recovery** with fake timers to ensure half-open state works correctly

## Resource Map

### Critical Files to Modify

| File | Changes |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts` | Circuit breaker + fail-closed |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` | Error message updates |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/trpc.ts` | Sentry errorFormatter |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx` | Sentry capture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/global-error.tsx` | Sentry capture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/error.tsx` | Sentry capture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/error.tsx` | Sentry capture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/error.tsx` | Sentry capture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/error.tsx` | Sentry capture |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/next.config.js` | Sentry webpack wrapper |

### Files to Create

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Client-side Sentry initialization |
| `sentry.server.config.ts` | Server-side Sentry initialization |
| `sentry.edge.config.ts` | Edge runtime Sentry initialization |
| `instrumentation.ts` | Next.js 14 instrumentation hook |

### Test Files to Update

| File | Changes |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/rate-limiter.test.ts` | Circuit breaker tests, fail-closed tests |

## Questions for Planner

1. Should the circuit breaker state be persisted to Redis (shared across instances) or kept in-memory (per-instance)?

2. What should be the alert threshold in Sentry for the rate limiter circuit breaker opening?

3. Should we add a health check endpoint that exposes circuit breaker status for monitoring?

4. Do we want Sentry performance monitoring (tracing) or just error monitoring initially?
