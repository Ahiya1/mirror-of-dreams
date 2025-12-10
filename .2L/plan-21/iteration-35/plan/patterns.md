# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── server/
│   ├── lib/
│   │   ├── config.ts           # Centralized configuration
│   │   ├── rate-limiter.ts     # Rate limiting with circuit breaker
│   │   ├── logger.ts           # Pino logger
│   │   └── __tests__/          # Unit tests
│   └── trpc/
│       ├── trpc.ts             # tRPC initialization
│       ├── context.ts          # Request context
│       ├── middleware.ts       # Rate limiting middleware
│       └── __tests__/          # Unit tests
├── app/
│   ├── error.tsx               # Root error boundary
│   ├── global-error.tsx        # Global error boundary
│   └── {route}/error.tsx       # Route error boundaries
├── sentry.client.config.ts     # Client Sentry config
├── sentry.server.config.ts     # Server Sentry config
├── sentry.edge.config.ts       # Edge Sentry config
└── instrumentation.ts          # Next.js instrumentation
```

## Naming Conventions

- Config variables: camelCase (`supabaseUrl`, `jwtSecret`)
- Circuit breaker: SCREAMING_SNAKE_CASE for constants (`FAILURE_THRESHOLD`)
- Error classes: PascalCase (`TokenExpiredError`, `CircuitOpenError`)
- Test files: `{module}.test.ts` in `__tests__/` directory
- Sentry tags: kebab-case (`error-boundary`, `trpc-code`)

---

## Configuration Patterns

### Centralized Config with Zod Validation

**When to use:** At application startup to validate all environment variables

**File: `server/lib/config.ts`**

```typescript
// server/lib/config.ts - Centralized configuration with Zod validation
import { z } from 'zod';

// =====================================================
// SCHEMA DEFINITIONS
// =====================================================

const requiredEnvSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY too short'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'ANTHROPIC_API_KEY must start with sk-ant-'),
});

const paymentEnvSchema = z.object({
  PAYPAL_CLIENT_ID: z.string().min(1),
  PAYPAL_CLIENT_SECRET: z.string().min(1),
  PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'live']),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_PRO_MONTHLY_PLAN_ID: z.string().startsWith('P-'),
  PAYPAL_PRO_YEARLY_PLAN_ID: z.string().startsWith('P-'),
  PAYPAL_UNLIMITED_MONTHLY_PLAN_ID: z.string().startsWith('P-'),
  PAYPAL_UNLIMITED_YEARLY_PLAN_ID: z.string().startsWith('P-'),
});

const emailEnvSchema = z.object({
  GMAIL_USER: z.string().email('GMAIL_USER must be a valid email'),
  GMAIL_APP_PASSWORD: z.string().length(16, 'GMAIL_APP_PASSWORD must be 16 characters'),
});

const redisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url().startsWith('https://'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

const optionalEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DOMAIN: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional(),

  // Security
  CRON_SECRET: z.string().optional(),
  CREATOR_SECRET_KEY: z.string().optional(),
  ADMIN_KEY: z.string().optional(),

  // Analytics
  GA_ID: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),

  // Feature flags
  ENABLE_COST_TRACKING: z.coerce.boolean().default(true),
  ENABLE_DETAILED_LOGGING: z.coerce.boolean().default(true),
  ENABLE_EMAIL_NOTIFICATIONS: z.coerce.boolean().default(true),

  // Rate limiting
  RATE_LIMIT_AUTH: z.coerce.number().default(5),
  RATE_LIMIT_AI: z.coerce.number().default(10),
  RATE_LIMIT_WRITE: z.coerce.number().default(30),
  RATE_LIMIT_GLOBAL: z.coerce.number().default(100),
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
});

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface ConfigValidationResult {
  success: boolean;
  config?: ValidatedConfig;
  errors?: string[];
  warnings?: string[];
}

export interface ValidatedConfig {
  // Required
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  jwtSecret: string;
  anthropicApiKey: string;

  // Optional features
  payment: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    environment?: 'sandbox' | 'live';
    webhookId?: string;
    planIds?: {
      proMonthly: string;
      proYearly: string;
      unlimitedMonthly: string;
      unlimitedYearly: string;
    };
  };

  email: {
    enabled: boolean;
    user?: string;
    password?: string;
  };

  redis: {
    enabled: boolean;
    url?: string;
    token?: string;
  };

  // Application
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  domain: string;
  logLevel?: string;

  // Security
  cronSecret?: string;
  creatorSecretKey?: string;
  adminKey?: string;

  // Features
  features: {
    costTracking: boolean;
    detailedLogging: boolean;
    emailNotifications: boolean;
  };

  // Rate limits
  rateLimits: {
    enabled: boolean;
    auth: number;
    ai: number;
    write: number;
    global: number;
  };
}

// =====================================================
// VALIDATION FUNCTION
// =====================================================

export function validateConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate required variables
  const requiredResult = requiredEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  });

  if (!requiredResult.success) {
    requiredResult.error.issues.forEach(issue => {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    });
  }

  // Early exit if required vars missing
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // 2. Validate optional feature groups
  const paymentResult = paymentEnvSchema.safeParse({
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT,
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
    PAYPAL_PRO_MONTHLY_PLAN_ID: process.env.PAYPAL_PRO_MONTHLY_PLAN_ID,
    PAYPAL_PRO_YEARLY_PLAN_ID: process.env.PAYPAL_PRO_YEARLY_PLAN_ID,
    PAYPAL_UNLIMITED_MONTHLY_PLAN_ID: process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID,
    PAYPAL_UNLIMITED_YEARLY_PLAN_ID: process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID,
  });

  const paymentEnabled = paymentResult.success;
  if (!paymentEnabled && process.env.PAYPAL_CLIENT_ID) {
    warnings.push('PayPal partially configured - payments will be disabled');
  }

  const emailResult = emailEnvSchema.safeParse({
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  });

  const emailEnabled = emailResult.success;
  if (!emailEnabled && process.env.GMAIL_USER) {
    warnings.push('Email partially configured - email features will be disabled');
  }

  const redisResult = redisEnvSchema.safeParse({
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const redisEnabled = redisResult.success;
  if (!redisEnabled && process.env.UPSTASH_REDIS_REST_URL) {
    warnings.push('Redis partially configured - rate limiting will be disabled');
  }

  // 3. Parse optional variables
  const optionalResult = optionalEnvSchema.safeParse(process.env);
  const optional = optionalResult.success ? optionalResult.data : optionalEnvSchema.parse({});

  // 4. Build validated config
  const config: ValidatedConfig = {
    supabaseUrl: requiredResult.data!.SUPABASE_URL,
    supabaseServiceRoleKey: requiredResult.data!.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: requiredResult.data!.JWT_SECRET,
    anthropicApiKey: requiredResult.data!.ANTHROPIC_API_KEY,

    payment: {
      enabled: paymentEnabled,
      ...(paymentEnabled && paymentResult.data ? {
        clientId: paymentResult.data.PAYPAL_CLIENT_ID,
        clientSecret: paymentResult.data.PAYPAL_CLIENT_SECRET,
        environment: paymentResult.data.PAYPAL_ENVIRONMENT,
        webhookId: paymentResult.data.PAYPAL_WEBHOOK_ID,
        planIds: {
          proMonthly: paymentResult.data.PAYPAL_PRO_MONTHLY_PLAN_ID,
          proYearly: paymentResult.data.PAYPAL_PRO_YEARLY_PLAN_ID,
          unlimitedMonthly: paymentResult.data.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID,
          unlimitedYearly: paymentResult.data.PAYPAL_UNLIMITED_YEARLY_PLAN_ID,
        },
      } : {}),
    },

    email: {
      enabled: emailEnabled,
      ...(emailEnabled && emailResult.data ? {
        user: emailResult.data.GMAIL_USER,
        password: emailResult.data.GMAIL_APP_PASSWORD,
      } : {}),
    },

    redis: {
      enabled: redisEnabled,
      ...(redisEnabled && redisResult.data ? {
        url: redisResult.data.UPSTASH_REDIS_REST_URL,
        token: redisResult.data.UPSTASH_REDIS_REST_TOKEN,
      } : {}),
    },

    nodeEnv: optional.NODE_ENV,
    port: optional.PORT,
    domain: optional.DOMAIN,
    logLevel: optional.LOG_LEVEL,

    cronSecret: optional.CRON_SECRET,
    creatorSecretKey: optional.CREATOR_SECRET_KEY,
    adminKey: optional.ADMIN_KEY,

    features: {
      costTracking: optional.ENABLE_COST_TRACKING,
      detailedLogging: optional.ENABLE_DETAILED_LOGGING,
      emailNotifications: optional.ENABLE_EMAIL_NOTIFICATIONS,
    },

    rateLimits: {
      enabled: optional.RATE_LIMIT_ENABLED && redisEnabled,
      auth: optional.RATE_LIMIT_AUTH,
      ai: optional.RATE_LIMIT_AI,
      write: optional.RATE_LIMIT_WRITE,
      global: optional.RATE_LIMIT_GLOBAL,
    },
  };

  return {
    success: true,
    config,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// =====================================================
// SINGLETON CONFIG
// =====================================================

let _config: ValidatedConfig | null = null;

export function getConfig(): ValidatedConfig {
  if (!_config) {
    const result = validateConfig();
    if (!result.success) {
      console.error('Configuration validation failed:');
      result.errors?.forEach(err => console.error(`  - ${err}`));
      throw new Error('Invalid configuration. Check environment variables.');
    }
    if (result.warnings) {
      result.warnings.forEach(warn => console.warn(`[Config Warning] ${warn}`));
    }
    _config = result.config!;
  }
  return _config;
}

// For testing: reset singleton
export function resetConfig(): void {
  _config = null;
}
```

**Key Points:**
- Validates at first access, not module load (lazy)
- Graceful degradation for optional features
- Clear error messages for troubleshooting
- Singleton pattern for efficiency

---

## Circuit Breaker Pattern

### Rate Limiter with Fail-Closed Behavior

**When to use:** Protecting security-critical operations from fail-open vulnerabilities

**File: `server/lib/rate-limiter.ts`**

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
 * Check rate limit with fail-closed behavior
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
 * Get current circuit breaker status (for monitoring)
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

// For testing: reset circuit breaker state
export function resetCircuitBreaker(): void {
  circuitState = { failures: 0, lastFailure: 0, halfOpenRequests: 0 };
}
```

**Key Points:**
- Fail-closed: Rejects requests when Redis unavailable
- Circuit breaker prevents cascade failures
- Half-open state allows recovery testing
- Exported status function for monitoring

---

## JWT Error Handling Pattern

### Explicit JWT Expiry Handling

**When to use:** Distinguishing between different JWT validation failures

**File: `server/trpc/context.ts`**

```typescript
import jwt from 'jsonwebtoken';

if (token) {
  try {
    // Verify JWT (includes automatic expiry check)
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as JWTPayload;

    // Explicit expiry check with clear logging
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      authLogger.warn(
        {
          operation: 'context.create',
          userId: payload.userId,
          expiredAt: new Date(payload.exp * 1000).toISOString(),
          expiredAgo: `${Math.floor((now - payload.exp) / 60)} minutes`
        },
        'JWT token expired'
      );
      user = null;
    } else {
      // Fetch fresh user data from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();

      if (error) {
        authLogger.error(
          { err: error, operation: 'context.create', userId: payload.userId },
          'Context creation - Supabase error'
        );
        user = null;
      } else if (data) {
        // ... monthly reset logic ...
        user = userRowToUser(data);
      }
    }
  } catch (e) {
    // Handle specific JWT errors
    if (e instanceof jwt.TokenExpiredError) {
      authLogger.warn(
        {
          operation: 'context.create',
          expiredAt: e.expiredAt?.toISOString(),
          message: e.message
        },
        'JWT token expired (caught by jwt.verify)'
      );
    } else if (e instanceof jwt.JsonWebTokenError) {
      authLogger.warn(
        { operation: 'context.create', message: (e as Error).message },
        'Invalid JWT token'
      );
    } else if (e instanceof jwt.NotBeforeError) {
      authLogger.warn(
        { operation: 'context.create', date: (e as jwt.NotBeforeError).date?.toISOString() },
        'JWT token not yet valid'
      );
    } else {
      // Database or other error
      authLogger.error(
        { err: e, operation: 'context.create' },
        'Context creation error'
      );
    }
    user = null;
  }
}
```

**Key Points:**
- Distinguish TokenExpiredError, JsonWebTokenError, NotBeforeError
- Log meaningful context (userId, expiredAt, etc.)
- Use warn level for expected errors, error level for unexpected
- Final behavior unchanged: invalid token = null user

---

## Sentry Integration Patterns

### Client-Side Configuration

**File: `sentry.client.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - sampling
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (optional - disabled for smaller bundle)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Error filtering - ignore common non-bugs
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /^Network request failed$/,
    /^Load failed$/,
    /^ChunkLoadError/,
  ],

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set by Vercel)
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Limit breadcrumbs to reduce noise
  maxBreadcrumbs: 50,
});
```

### Server-Side Configuration

**File: `sentry.server.config.ts`**

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

  // Server-specific settings
  maxBreadcrumbs: 100,
});
```

### Edge Runtime Configuration

**File: `sentry.edge.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
});
```

### Instrumentation Hook

**File: `instrumentation.ts`**

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

### Next.js Config Wrapper

**File: `next.config.js` (modification)**

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

// ... existing nextConfig ...

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

    // Automatically set release to git commit SHA
    automaticVercelMonitors: true,
  }
);
```

### Error Boundary Sentry Capture

**When to use:** All error.tsx boundary files

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ErrorFallback } from '@/components/error/ErrorFallback';
import CosmicBackground from '@/components/shared/CosmicBackground';

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
        errorBoundary: 'root',  // Change per boundary: 'dashboard', 'dreams', etc.
        digest: error.digest,
      },
      extra: {
        componentStack: error.stack,
      },
    });
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <CosmicBackground animated={false} />
      <div className="relative z-10 w-full">
        <ErrorFallback
          title="Something went wrong"
          message="We encountered an unexpected error. Please try again."
          errorDigest={error.digest}
          onRetry={reset}
          onGoHome={() => router.push('/')}
        />
      </div>
    </div>
  );
}
```

### tRPC Error Formatter with Sentry

**File: `server/trpc/trpc.ts`**

```typescript
import { initTRPC } from '@trpc/server';
import * as Sentry from '@sentry/nextjs';
import superjson from 'superjson';

import { type Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error, ctx }) {
    // Don't report auth errors (expected, not bugs)
    if (error.code !== 'UNAUTHORIZED' && error.code !== 'FORBIDDEN') {
      Sentry.captureException(error.cause ?? error, {
        user: ctx?.user ? {
          id: ctx.user.id,
          email: ctx.user.email,
        } : undefined,
        tags: {
          trpcCode: error.code,
        },
        extra: {
          trpcPath: shape.data?.path,
        },
      });
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? (error.cause as any).flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
```

---

## Testing Patterns

### Test File Naming Conventions

- Unit tests: `{module}.test.ts` in `__tests__/` directory
- Integration tests: `{feature}.integration.test.ts`
- All tests colocated with source: `server/lib/__tests__/`

### Config Validation Tests

**File: `server/lib/__tests__/config.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original env
const originalEnv = process.env;

describe('Config Validation', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    it('should fail when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('SUPABASE_URL')])
      );
    });

    it('should fail when JWT_SECRET is too short', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'short';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('JWT_SECRET')])
      );
    });

    it('should fail when ANTHROPIC_API_KEY has wrong prefix', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'wrong-prefix-key';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('ANTHROPIC_API_KEY')])
      );
    });

    it('should pass with all required variables valid', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
    });
  });

  describe('Optional Feature Groups', () => {
    beforeEach(() => {
      // Set all required vars
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    it('should warn when PayPal is partially configured', async () => {
      process.env.PAYPAL_CLIENT_ID = 'test-client-id';
      // Missing other PayPal vars

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(true);
      expect(result.config?.payment.enabled).toBe(false);
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('PayPal')])
      );
    });

    it('should enable PayPal when fully configured', async () => {
      process.env.PAYPAL_CLIENT_ID = 'test-client-id';
      process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
      process.env.PAYPAL_ENVIRONMENT = 'sandbox';
      process.env.PAYPAL_PRO_MONTHLY_PLAN_ID = 'P-test-monthly';
      process.env.PAYPAL_PRO_YEARLY_PLAN_ID = 'P-test-yearly';
      process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID = 'P-test-unlimited-monthly';
      process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID = 'P-test-unlimited-yearly';

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(true);
      expect(result.config?.payment.enabled).toBe(true);
    });

    it('should disable rate limiting without Redis', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.success).toBe(true);
      expect(result.config?.rateLimits.enabled).toBe(false);
    });
  });

  describe('Default Values', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key-here';
      process.env.JWT_SECRET = 'a-very-long-jwt-secret-at-least-32-chars';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-here';
    });

    it('should use default values for optional variables', async () => {
      const { validateConfig } = await import('../config');
      const result = validateConfig();

      expect(result.config?.nodeEnv).toBe('development');
      expect(result.config?.port).toBe(3000);
      expect(result.config?.rateLimits.auth).toBe(5);
      expect(result.config?.features.costTracking).toBe(true);
    });
  });
});
```

### Circuit Breaker Tests

**File: `server/lib/__tests__/rate-limiter.test.ts` (additions)**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  checkRateLimit,
  getCircuitBreakerStatus,
  resetCircuitBreaker
} from '../rate-limiter';

describe('Circuit Breaker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCircuitBreaker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return success false on Redis error (fail-closed)', async () => {
    const mockLimiter = {
      limit: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
    };

    const result = await checkRateLimit(mockLimiter as any, 'test-ip');

    expect(result.success).toBe(false);
    expect(result.circuitOpen).toBe(true);
  });

  it('should open circuit after 5 consecutive failures', async () => {
    const mockLimiter = {
      limit: vi.fn().mockRejectedValue(new Error('Redis down')),
    };

    // 5 failures should open circuit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(mockLimiter as any, 'test-ip');
    }

    const status = getCircuitBreakerStatus();
    expect(status.isOpen).toBe(true);
    expect(status.failures).toBe(5);
  });

  it('should reject requests when circuit is open', async () => {
    const mockLimiter = {
      limit: vi.fn().mockRejectedValue(new Error('Redis down')),
    };

    // Open circuit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(mockLimiter as any, 'test-ip');
    }

    // Next request should be rejected without hitting Redis
    mockLimiter.limit.mockClear();
    const result = await checkRateLimit(mockLimiter as any, 'test-ip');

    expect(result.success).toBe(false);
    expect(result.circuitOpen).toBe(true);
    expect(mockLimiter.limit).not.toHaveBeenCalled();
  });

  it('should reset circuit on successful request', async () => {
    const mockLimiter = {
      limit: vi.fn()
        .mockRejectedValueOnce(new Error('Redis down'))
        .mockRejectedValueOnce(new Error('Redis down'))
        .mockResolvedValue({ success: true, remaining: 5, reset: Date.now() + 60000 }),
    };

    await checkRateLimit(mockLimiter as any, 'test-ip');
    await checkRateLimit(mockLimiter as any, 'test-ip');

    let status = getCircuitBreakerStatus();
    expect(status.failures).toBe(2);

    // Success resets circuit
    await checkRateLimit(mockLimiter as any, 'test-ip');

    status = getCircuitBreakerStatus();
    expect(status.failures).toBe(0);
    expect(status.isOpen).toBe(false);
  });

  it('should allow half-open requests after recovery timeout', async () => {
    vi.useFakeTimers();

    const mockLimiter = {
      limit: vi.fn().mockRejectedValue(new Error('Redis down')),
    };

    // Open circuit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(mockLimiter as any, 'test-ip');
    }

    expect(getCircuitBreakerStatus().isOpen).toBe(true);

    // Advance time past recovery timeout (30 seconds)
    vi.advanceTimersByTime(31000);

    // Should allow half-open request
    mockLimiter.limit.mockResolvedValue({
      success: true, remaining: 5, reset: Date.now() + 60000
    });

    const result = await checkRateLimit(mockLimiter as any, 'test-ip');
    expect(result.success).toBe(true);
    expect(getCircuitBreakerStatus().isOpen).toBe(false);
  });
});
```

### JWT Expiry Tests

**File: `server/trpc/__tests__/jwt-expiry.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars';

describe('JWT Expiry Enforcement', () => {
  describe('Token Creation', () => {
    it('should create tokens with correct expiry', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        tier: 'free',
        isCreator: false,
        isAdmin: false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp - decoded.iat).toBe(60 * 60 * 24 * 30);
    });
  });

  describe('Token Verification', () => {
    it('should reject expired tokens with TokenExpiredError', () => {
      const expiredPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800,
      };

      const token = jwt.sign(expiredPayload, JWT_SECRET, { noTimestamp: true });

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow(jwt.TokenExpiredError);
    });

    it('should accept valid non-expired tokens', () => {
      const validPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(validPayload, JWT_SECRET);

      expect(() => jwt.verify(token, JWT_SECRET)).not.toThrow();
    });

    it('should provide expiredAt date on TokenExpiredError', () => {
      const expiredPayload = {
        userId: 'test-user-id',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800,
      };

      const token = jwt.sign(expiredPayload, JWT_SECRET, { noTimestamp: true });

      try {
        jwt.verify(token, JWT_SECRET);
        expect.fail('Should have thrown TokenExpiredError');
      } catch (e) {
        expect(e).toBeInstanceOf(jwt.TokenExpiredError);
        expect((e as jwt.TokenExpiredError).expiredAt).toBeDefined();
      }
    });
  });

  describe('Explicit Expiry Check', () => {
    it('should detect expired token via payload check', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: 'test-user-id',
        exp: now - 100,
      };

      const isExpired = payload.exp < now;
      expect(isExpired).toBe(true);
    });

    it('should pass valid token via payload check', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: 'test-user-id',
        exp: now + 3600,
      };

      const isExpired = payload.exp < now;
      expect(isExpired).toBe(false);
    });
  });
});
```

### Test Data Factories

**File: `lib/test-utils/factories.ts`** (if needed)

```typescript
import type { User, JWTPayload } from '@/types';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  tier: 'free',
  isCreator: false,
  isAdmin: false,
  isDemo: false,
  reflectionCountThisMonth: 0,
  currentMonthYear: new Date().toISOString().slice(0, 7),
  createdAt: new Date(),
  ...overrides,
});

export const createMockJWTPayload = (overrides: Partial<JWTPayload> = {}): JWTPayload => ({
  userId: 'user-123',
  email: 'test@example.com',
  tier: 'free',
  isCreator: false,
  isAdmin: false,
  isDemo: false,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  ...overrides,
});
```

---

## Error Handling Patterns

### Middleware Error Messages

**When to use:** tRPC middleware for rate limiting

```typescript
// server/trpc/middleware.ts
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

### API Route Sentry Capture

**When to use:** Standalone API routes with error handling

```typescript
import * as Sentry from '@sentry/nextjs';

export async function POST(req: Request) {
  try {
    // ... route logic ...
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api: 'route-name',
      },
      user: user ? { id: user.id, email: user.email } : undefined,
    });

    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Security Patterns

### Input Validation

Use Zod for all user input validation at API boundaries (already in place).

### Auth Error Filtering

Don't report auth errors to Sentry (they're expected, not bugs):

```typescript
if (error.code !== 'UNAUTHORIZED' && error.code !== 'FORBIDDEN') {
  Sentry.captureException(error);
}
```

### Environment Variable Safety

Never log secret values - only validation errors:

```typescript
// Good: Log that validation failed
errors.push(`JWT_SECRET: must be at least 32 characters`);

// Bad: Never log the actual value
// errors.push(`JWT_SECRET value "${process.env.JWT_SECRET}" is invalid`);
```

---

## Import Order Convention

```typescript
// 1. Node.js built-ins (if any)

// 2. External packages
import { Ratelimit } from '@upstash/ratelimit';
import * as Sentry from '@sentry/nextjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// 3. Internal packages (@ alias)
import { logger } from '@/server/lib/logger';
import { type User } from '@/types';

// 4. Relative imports
import { type Context } from './context';
```

---

## Coverage Expectations

| Module Type | Minimum | Target |
|-------------|---------|--------|
| server/lib/config.ts | 85% | 90% |
| server/lib/rate-limiter.ts | 80% | 85% |
| JWT error handling | 75% | 80% |
| Sentry integration | N/A | Manual verification |
