# Iteration 31: Error Monitoring & Resilience - Tech Stack

**Created:** 2025-12-10
**Plan:** 19
**Iteration:** 31

---

## Overview

This document specifies the technologies, libraries, and tools used in Iteration 31 for error monitoring and resilience.

---

## Core Technologies

### Next.js 14 (Existing)

**Role:** Framework, Error Boundary System

**Features Used:**
- App Router error boundaries (`error.tsx`, `global-error.tsx`)
- Server Components
- Route Handlers

**Documentation:** https://nextjs.org/docs/app/building-your-application/routing/error-handling

### TypeScript 5.x (Existing)

**Role:** Type Safety

**Configuration:**
- Strict mode enabled
- Path aliases via `@/`

---

## New Dependencies

### Pino (To Add)

**Package:** `pino`
**Version:** `^9.0.0` (latest stable)
**Purpose:** Structured JSON logging

**Why Pino:**
1. **Performance:** 10x faster than Winston, minimal overhead
2. **JSON Native:** Outputs structured JSON by default
3. **Low Footprint:** ~1MB installed size
4. **Log Levels:** Built-in support (trace, debug, info, warn, error, fatal)
5. **Child Loggers:** Easy to create context-specific loggers
6. **Ecosystem:** Works with many transports and tools

**Installation:**
```bash
npm install pino
npm install -D pino-pretty  # For development pretty printing
```

**Basic Configuration:**
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
```

**Output Format (Production):**
```json
{
  "level": 50,
  "time": 1702224000000,
  "msg": "Failed to create reflection",
  "err": {
    "type": "TRPCError",
    "message": "Rate limit exceeded",
    "stack": "..."
  },
  "service": "anthropic",
  "userId": "user_123",
  "operation": "reflection.create"
}
```

### pino-pretty (Dev Dependency)

**Package:** `pino-pretty`
**Version:** `^11.0.0`
**Purpose:** Human-readable log output in development

**Dev Output:**
```
14:30:45 ERROR (anthropic): Failed to create reflection
    userId: "user_123"
    operation: "reflection.create"
    err: {
      "type": "TRPCError",
      "message": "Rate limit exceeded"
    }
```

---

## Existing Dependencies Used

### @anthropic-ai/sdk (Existing)

**Current Version:** Check `package.json`
**Purpose:** Claude API interactions

**Error Types Available:**
```typescript
import {
  APIError,
  RateLimitError,
  InternalServerError,
  APIConnectionError,
  AuthenticationError,
  BadRequestError,
} from '@anthropic-ai/sdk';
```

**Configuration Options:**
```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 90000, // 90 second timeout
  maxRetries: 0,  // Disable built-in retries (we handle our own)
});
```

### @trpc/server (Existing)

**Purpose:** API layer, error handling

**Error Codes Used:**
```typescript
import { TRPCError } from '@trpc/server';

// Error codes
'BAD_REQUEST'         // 400 - Invalid input
'UNAUTHORIZED'        // 401 - Not authenticated
'FORBIDDEN'           // 403 - Not authorized
'NOT_FOUND'          // 404 - Resource not found
'INTERNAL_SERVER_ERROR' // 500 - Server error
'PRECONDITION_FAILED' // 412 - Requirement not met
```

### @tanstack/react-query (Existing)

**Purpose:** Client-side data fetching

**Error Handling Config:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // We handle retries server-side
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: false,
    },
  },
});
```

### @upstash/ratelimit & @upstash/redis (Existing)

**Purpose:** Rate limiting

**Note:** Not modified in this iteration, but retry logic should respect rate limits.

### vitest (Existing Dev Dependency)

**Purpose:** Unit testing

**Test Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

---

## File Structure

### New Files

```
mirror-of-dreams/
├── app/
│   ├── error.tsx                    # Route error boundary
│   ├── global-error.tsx             # Global error boundary
│   ├── reflection/
│   │   └── error.tsx                # Reflection route boundary
│   ├── clarify/
│   │   └── error.tsx                # Clarify route boundary
│   └── dashboard/
│       └── error.tsx                # Dashboard route boundary
│
├── components/
│   └── error/
│       └── ErrorFallback.tsx        # Reusable error component
│
├── lib/
│   └── utils/
│       ├── retry.ts                 # Retry utility
│       └── __tests__/
│           └── retry.test.ts        # Retry tests
│
└── server/
    └── lib/
        ├── logger.ts                # Pino logger configuration
        └── __tests__/
            └── logger.test.ts       # Logger tests
```

### Modified Files

```
server/trpc/routers/
├── reflection.ts    # Add retry, replace console.error
├── clarify.ts       # Add retry, replace console.error
├── evolution.ts     # Add retry, add try/catch
├── visualizations.ts # Add retry, add try/catch
├── lifecycle.ts     # Add retry, replace console.error
├── auth.ts          # Replace console.error
├── subscriptions.ts # Replace console.error
└── dreams.ts        # Replace console.error

server/
├── trpc/context.ts  # Replace console.error
└── lib/
    ├── paypal.ts    # Replace console.error
    └── email.ts     # Replace console.error

lib/clarify/
└── consolidation.ts # Add retry, replace console.error

package.json         # Add pino, pino-pretty
```

---

## Configuration Files

### package.json Updates

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

### Environment Variables

No new environment variables required for this iteration.

**Optional (for future):**
```env
# Log level (trace, debug, info, warn, error, fatal)
LOG_LEVEL=info
```

---

## Browser/Runtime Compatibility

### Server-Side Only

The following are server-side only:
- `pino` logger
- Retry logic (runs in tRPC routers)
- Error classification utilities

### Client-Side

The following run in the browser:
- Error boundaries (`'use client'`)
- ErrorFallback component
- Error UI styling

### Edge Runtime

Not used in this iteration. Error boundaries and logging are Node.js/browser only.

---

## Type Definitions

### Retry Types

```typescript
// lib/utils/retry.ts

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

export type RetryableFunction<T> = () => Promise<T>;
```

### Logger Types

```typescript
// server/lib/logger.ts

import type { Logger } from 'pino';

export type ServiceLogger = Logger & {
  service: string;
};

export interface LogContext {
  userId?: string;
  operation?: string;
  [key: string]: unknown;
}
```

### Error Types

```typescript
// lib/utils/retry.ts

export interface ErrorWithStatus {
  status?: number;
  statusCode?: number;
}

export interface AnthropicErrorLike {
  type?: string;
  status?: number;
  message?: string;
}
```

---

## Performance Considerations

### Retry Delays

| Attempt | Base Delay | With Backoff | With Jitter (max) |
|---------|------------|--------------|-------------------|
| 1 | 1000ms | 1000ms | ~1100ms |
| 2 | 1000ms | 2000ms | ~2200ms |
| 3 | 1000ms | 4000ms | ~4400ms |

**Maximum total wait time:** ~7.7 seconds (before giving up)

### Logging Performance

Pino is designed for minimal performance impact:
- Synchronous logging (non-blocking)
- JSON serialization is optimized
- Child loggers share config (minimal memory)

**Recommended:** Keep log level at `info` in production, `debug` only when needed.

---

## Security Considerations

### Sensitive Data in Logs

**DO NOT log:**
- API keys
- User passwords
- Full request/response bodies with personal data
- Payment information

**Safe to log:**
- User IDs
- Operation names
- Error types and codes
- Timestamps
- Request metadata (method, path)

### Error Messages to Users

**DO NOT expose:**
- Stack traces
- Internal error messages
- System paths
- Database error details

**Safe to expose:**
- Friendly error messages
- Error digest/ID for support
- Retry suggestions

---

## Testing Strategy

### Unit Tests

```bash
# Run retry tests
npm run test -- lib/utils/__tests__/retry.test.ts

# Run logger tests
npm run test -- server/lib/__tests__/logger.test.ts
```

### Mock Setup

Use existing mock from `test/mocks/anthropic.ts`:

```typescript
import { anthropicErrors } from '@/test/mocks/anthropic';

// Test retry with rate limit error
mockCreate.mockRejectedValueOnce(anthropicErrors.rateLimited);
```

---

## Future Considerations

### Sentry Integration (Not This Iteration)

When Sentry is added later:
```typescript
import * as Sentry from '@sentry/nextjs';

// In logger
logger.on('error', (err) => {
  Sentry.captureException(err);
});

// In error boundary
useEffect(() => {
  Sentry.captureException(error);
}, [error]);
```

### Circuit Breaker (Not This Iteration)

Could be added using:
- Custom implementation
- `cockatiel` library
- Upstash Redis for state

### Distributed Tracing (Not This Iteration)

Could be added using:
- OpenTelemetry
- Request correlation IDs
- Span context propagation

---

**Document Status:** COMPLETE
