# Explorer 1 Report: Error Handling & Monitoring Patterns Analysis

## Executive Summary

The Mirror of Dreams codebase has foundational error handling in place through TRPCError patterns on the server side and toast notifications on the client side. However, there are significant gaps: no error boundaries exist, console.error is used extensively without structured logging, AI API calls lack retry logic, and there is no centralized error monitoring (Sentry integration missing). This iteration should focus on adding Sentry, implementing error boundaries, adding AI retry logic, and replacing console.log/error with structured logging.

## Discoveries

### 1. Current tRPC Router Error Handling Patterns

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/*.ts`

**Pattern Used:** All routers consistently use `TRPCError` from `@trpc/server` with appropriate error codes:

```typescript
// Standard pattern found across all routers
if (error || !data) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Resource not found',
  });
}

// Internal errors with console.error before throwing
if (dbError) {
  console.error('Failed to create dream:', error);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to create dream',
  });
}
```

**Error Codes Used:**
- `NOT_FOUND` - Missing resources
- `INTERNAL_SERVER_ERROR` - Database/API failures
- `FORBIDDEN` - Tier/permission violations
- `BAD_REQUEST` - Validation failures
- `UNAUTHORIZED` - Auth failures
- `PRECONDITION_FAILED` - Threshold requirements not met

**Assessment:** The pattern is consistent but lacks:
1. Correlation IDs for tracing
2. Structured error metadata
3. Sentry capture calls

### 2. Client-Side Error Handling

**Location:** Components and pages in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/**/*.tsx` and `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/**/*.tsx`

**Pattern Used:** Toast notifications via `useToast()` context:

```typescript
// tRPC mutation error handling
const mutation = trpc.resource.action.useMutation({
  onError: (error) => {
    toast.error(error.message);
  },
  onSuccess: () => {
    toast.success('Action completed');
  },
});

// Manual try-catch with toast
try {
  await someAction();
} catch (error) {
  toast.error('Failed to perform action');
}
```

**Files with Error Handling:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx` - Multiple mutation error handlers
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/auth/signin/page.tsx` - Auth error handling
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx` - Reflection creation errors
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx` - Streaming error handling
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/PayPalCheckoutModal.tsx` - Payment errors

**Assessment:** Client error handling is good for user feedback but lacks:
1. Error boundary wrappers
2. Sentry client-side capture
3. Error recovery mechanisms

### 3. Console.log/error Usage Patterns

**Server-Side Console Statements Found:**

| File | Line | Statement | Context |
|------|------|-----------|---------|
| `server/trpc/routers/reflection.ts` | 124 | `console.error('Claude API error:', error)` | AI API failure |
| `server/trpc/routers/reflection.ts` | 158 | `console.error('Database error saving reflection:', reflectionError)` | DB failure |
| `server/trpc/routers/dreams.ts` | 192 | `console.error('Failed to create dream:', error)` | DB failure |
| `server/trpc/routers/auth.ts` | 75 | `console.error('Signup error:', error)` | Auth failure |
| `server/trpc/routers/auth.ts` | 264 | `console.error('Update profile error:', error)` | Profile update |
| `server/trpc/routers/auth.ts` | 325 | `console.error('Change password error:', error)` | Password change |
| `server/trpc/routers/auth.ts` | 372 | `console.error('Delete account error:', error)` | Account deletion |
| `server/trpc/routers/subscriptions.ts` | 36 | `console.error('Subscription status query error:', error)` | Subscription query |
| `server/trpc/routers/subscriptions.ts` | 104, 173, 187, 218 | Multiple PayPal errors | Payment processing |
| `server/trpc/routers/lifecycle.ts` | 170, 191, 373, 398, 416, 558, 576 | Multiple ceremony/ritual errors | Dream lifecycle |
| `server/trpc/context.ts` | 43, 66 | Context creation errors | Auth context |
| `server/lib/paypal.ts` | 219, 242 | PayPal webhook errors | Webhook processing |
| `server/lib/email.ts` | 18, 434, 465 | Email service errors | Email sending |
| `server/lib/rate-limiter.ts` | 28, 73 | Rate limiter errors | Redis |
| `lib/clarify/consolidation.ts` | 85, 92, 122, 196, 211, 221, 244 | Pattern extraction errors | AI consolidation |
| `lib/clarify/context-builder.ts` | 188 | Pattern fetch error | Context building |

**Client-Side Console Statements:**

| File | Line | Statement |
|------|------|-----------|
| `components/landing/LandingHero.tsx` | 41 | `console.error('Demo login error:', error)` |
| `components/shared/AppNavigation.tsx` | 89 | `console.error('Signout error:', e)` |
| `components/subscription/PayPalCheckoutModal.tsx` | 73 | `console.error('PayPal error:', err)` |
| `app/auth/signin/page.tsx` | 49 | `console.error('Signin error:', error)` |
| `app/reflection/output/page.tsx` | 50 | `console.error('Copy failed:', error)` |
| `app/clarify/[sessionId]/page.tsx` | 240 | `console.error('Streaming error:', error)` |

**Total Count:**
- Server-side: ~35+ console.error statements
- Client-side: ~8 console.error statements
- console.warn: 2 (rate-limiter)
- console.log: Scripts only (seed, setup, etc.)

### 4. Missing Error Boundaries

**Current State:** NO error boundaries exist in the codebase.

**Files Checked:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx` - DOES NOT EXIST
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/global-error.tsx` - DOES NOT EXIST

**Impact:** 
- Unhandled React errors crash the entire app
- No graceful degradation for component failures
- No automatic error reporting to Sentry

**Recommended Error Boundary Locations:**
1. `app/error.tsx` - Root error boundary
2. `app/global-error.tsx` - Global error boundary (catches root layout errors)
3. Route-specific boundaries for critical paths:
   - `app/reflection/error.tsx`
   - `app/clarify/error.tsx`
   - `app/dashboard/error.tsx`

### 5. AI API Call Error Handling

**Routers Making AI Calls:**

| Router | Method | AI Service | Error Handling |
|--------|--------|------------|----------------|
| `reflection.ts` | `create` | Claude Sonnet 4.5 | try/catch, console.error, TRPCError |
| `clarify.ts` | `createSession`, `sendMessage` | Claude Sonnet 4.5 | try/catch, silent swallow |
| `evolution.ts` | `generateDreamEvolution`, `generateCrossDreamEvolution` | Claude Sonnet 4.5 | NO try/catch around API call |
| `visualizations.ts` | `generate` | Claude Sonnet 4.5 | NO try/catch around API call |
| `lifecycle.ts` | `achieve` | Claude Sonnet 4.5 | try/catch, continues without synthesis |

**Critical Finding - Unprotected AI Calls:**

```typescript
// evolution.ts - NO error handling around AI call
const response = await anthropic.messages.create(requestConfig);
// If this fails, unhandled exception propagates

// visualizations.ts - NO error handling around AI call
const response = await anthropic.messages.create(requestConfig);
// If this fails, unhandled exception propagates
```

**Current Retry Logic:** NONE EXISTS

**AI Errors to Handle:**
1. Rate limiting (429)
2. Overloaded service (529)
3. Network timeouts
4. Invalid responses (no text block)
5. Context window exceeded
6. API key invalid/expired

### 6. TRPCProvider Configuration

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/providers/TRPCProvider.tsx`

**Current Configuration:**
```typescript
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          refetchOnWindowFocus: true,
        },
      },
    })
);
```

**Missing:**
- No global error handler
- No retry configuration
- No onError callback

## Complexity Assessment

### High Complexity Areas

1. **Sentry Integration Setup**
   - Requires Next.js instrumentation
   - Server/client dual setup
   - Source map upload configuration
   - Environment-specific DSN
   - **Estimated effort:** 2-3 hours

2. **AI Retry Logic Implementation**
   - Multiple routers need updating
   - Exponential backoff strategy
   - Circuit breaker pattern consideration
   - Rate limit awareness
   - **Estimated effort:** 2-3 hours

### Medium Complexity Areas

1. **Error Boundary Implementation**
   - Standard Next.js 14 pattern
   - Recovery/retry functionality
   - Sentry integration
   - **Estimated effort:** 1-2 hours

2. **Console.error to Sentry Migration**
   - Many files to update
   - Context preservation
   - Log levels (error vs warning)
   - **Estimated effort:** 1-2 hours

### Low Complexity Areas

1. **Global Error Handler in TRPCProvider**
   - Add QueryClient `onError` callback
   - **Estimated effort:** 30 minutes

## Technology Recommendations

### Sentry Integration

**Package:** `@sentry/nextjs` (latest)

**Configuration Points:**
1. `sentry.client.config.ts` - Browser config
2. `sentry.server.config.ts` - Node.js config
3. `sentry.edge.config.ts` - Edge runtime config
4. `next.config.js` - withSentryConfig wrapper

**Key Settings:**
```typescript
// Recommended Sentry init
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% for performance
  beforeSend(event, hint) {
    // Filter sensitive data
    return event;
  },
});
```

### AI Retry Library

**Recommendation:** Custom exponential backoff utility

```typescript
// Suggested pattern for AI calls
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    retryOn: (error: unknown) => boolean;
  }
): Promise<T> {
  // Implementation with exponential backoff
}
```

**Retry Configuration:**
- Max retries: 3
- Base delay: 1000ms
- Max delay: 10000ms
- Retry on: 429, 529, network errors

## Recommendations for Implementation

### Priority 1: Error Boundaries (Essential)

Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx`:
```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Priority 2: Sentry Setup

1. Install: `npm install @sentry/nextjs`
2. Run: `npx @sentry/wizard@latest -i nextjs`
3. Configure environment variables
4. Update `next.config.js`

### Priority 3: AI Retry Logic

Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/ai-retry.ts`:
- Implement exponential backoff
- Handle Anthropic-specific errors
- Add circuit breaker for sustained failures

### Priority 4: Replace Console Statements

Pattern for replacement:
```typescript
// Before
console.error('Claude API error:', error);

// After
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  tags: { service: 'anthropic', operation: 'reflection' },
  extra: { input: sanitizedInput },
});
```

## Sentry Integration Points

### Server-Side Capture Points

| File | Context | Tags |
|------|---------|------|
| `reflection.ts:124` | AI API error | service:anthropic, op:reflection |
| `reflection.ts:158` | DB save error | service:supabase, op:save-reflection |
| `dreams.ts:192` | Dream creation | service:supabase, op:create-dream |
| `auth.ts:75` | Signup error | service:auth, op:signup |
| `subscriptions.ts:*` | PayPal errors | service:paypal, op:checkout |
| `lifecycle.ts:*` | Ceremony errors | service:lifecycle, op:ceremony |
| `clarify.ts:*` | Clarify AI errors | service:anthropic, op:clarify |
| `evolution.ts:*` | Evolution AI errors | service:anthropic, op:evolution |
| `visualizations.ts:*` | Viz AI errors | service:anthropic, op:visualization |

### Client-Side Capture Points

| File | Context |
|------|---------|
| Error boundaries | Unhandled React errors |
| `PayPalCheckoutModal.tsx` | Payment failures |
| `MirrorExperience.tsx` | Reflection creation |
| `[sessionId]/page.tsx` | Streaming errors |

## Resource Map

### Critical Files for Modification

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx` | CREATE: Root error boundary |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/global-error.tsx` | CREATE: Global error boundary |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.client.config.ts` | CREATE: Client Sentry |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.server.config.ts` | CREATE: Server Sentry |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/ai-retry.ts` | CREATE: Retry utility |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/next.config.js` | MODIFY: Add Sentry wrapper |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` | MODIFY: Add retry + Sentry |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts` | MODIFY: Add try/catch + retry |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/visualizations.ts` | MODIFY: Add try/catch + retry |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/providers/TRPCProvider.tsx` | MODIFY: Add global error handler |

### Files with Console Statements to Update

**Server (high priority):**
- `server/trpc/routers/reflection.ts`
- `server/trpc/routers/auth.ts`
- `server/trpc/routers/subscriptions.ts`
- `server/trpc/routers/lifecycle.ts`
- `server/trpc/context.ts`
- `server/lib/paypal.ts`
- `server/lib/email.ts`
- `lib/clarify/consolidation.ts`

**Client (medium priority):**
- `components/subscription/PayPalCheckoutModal.tsx`
- `app/auth/signin/page.tsx`
- `app/clarify/[sessionId]/page.tsx`

## Questions for Planner

1. **Sentry DSN:** Will a Sentry project be created, or should we use environment variable placeholders?
2. **Error Boundary Styling:** Should error boundaries match the cosmic/glass design system?
3. **AI Retry Scope:** Should retry logic apply to ALL AI calls or just critical paths (reflections)?
4. **Logging Level:** Should we preserve console.warn for non-critical warnings (like Redis not configured)?
5. **Performance Sampling:** What's the acceptable Sentry traces sample rate? (Recommended: 0.1)
6. **Source Maps:** Should source maps be uploaded to Sentry for production debugging?

## Summary Statistics

| Metric | Count |
|--------|-------|
| tRPC routers analyzed | 13 |
| Console.error locations (server) | 35+ |
| Console.error locations (client) | 8 |
| Missing error boundaries | 2 (root + global) |
| AI API calls without retry | 6 |
| AI API calls without try/catch | 2 |
| Estimated total files to modify | 15-20 |

