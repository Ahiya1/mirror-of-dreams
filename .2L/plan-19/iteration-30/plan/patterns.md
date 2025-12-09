# Iteration 30: Security Hardening - Patterns

**Created:** 2025-12-10
**Plan:** 19
**Iteration:** 30

---

## Cookie Patterns

### Cookie Configuration

```typescript
// server/lib/cookies.ts

import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'auth_token';

export const COOKIE_OPTIONS = {
  httpOnly: true,        // Prevents XSS access to token
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax' as const,       // CSRF protection while allowing navigation
  path: '/',             // Available on all routes
  maxAge: 60 * 60 * 24 * 30, // 30 days (matches JWT expiry)
};

export const DEMO_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 7, // 7 days for demo users
};
```

### Setting Cookies (Server-Side)

```typescript
// Pattern for auth mutations (signin, signup, loginDemo)
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, COOKIE_OPTIONS, DEMO_COOKIE_OPTIONS } from '@/server/lib/cookies';

// After generating JWT token
const cookieStore = await cookies();

// For regular users
cookieStore.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

// For demo users
cookieStore.set(AUTH_COOKIE_NAME, token, DEMO_COOKIE_OPTIONS);

// Return response (token can still be in body for backward compatibility)
return { user, token };
```

### Reading Cookies (Server-Side)

```typescript
// Pattern for context.ts and API routes
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/server/lib/cookies';

// Dual-read pattern for transition period
const cookieStore = await cookies();
const cookieToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

// Fallback to Authorization header for backward compatibility
const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');

// Prefer cookie, fallback to header
const token = cookieToken || headerToken;
```

### Clearing Cookies (Logout)

```typescript
// Pattern for signout mutation
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/server/lib/cookies';

const cookieStore = await cookies();
cookieStore.delete(AUTH_COOKIE_NAME);

return { success: true, message: 'Signed out successfully' };
```

### Client-Side Fetch with Cookies

```typescript
// Pattern for TRPCProvider.tsx
httpBatchLink({
  url: '/api/trpc',
  transformer: superjson,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: 'include', // Send cookies with requests
    });
  },
}),
```

---

## Rate Limiting Patterns

### Upstash Ratelimit Configuration

```typescript
// server/lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Auth endpoints: 5 requests per minute per IP (brute-force protection)
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1m'),
  prefix: 'rl:auth',
  analytics: true,
});

// AI endpoints: 10 requests per minute per user (cost protection)
export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1m'),
  prefix: 'rl:ai',
  analytics: true,
});

// Write endpoints: 30 requests per minute per user (spam protection)
export const writeRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1m'),
  prefix: 'rl:write',
  analytics: true,
});

// Global: 100 requests per minute per IP (DDoS protection)
export const globalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1m'),
  prefix: 'rl:global',
  analytics: true,
});
```

### tRPC Rate Limit Middleware

```typescript
// Pattern for middleware.ts
import { TRPCError } from '@trpc/server';
import { middleware } from './trpc';

// Rate limit by IP (for unauthenticated endpoints)
export const rateLimitByIp = (limiter: Ratelimit) =>
  middleware(async ({ ctx, next }) => {
    // Extract IP from headers (Vercel handles x-forwarded-for)
    const ip =
      ctx.req?.headers.get('x-forwarded-for')?.split(',')[0] ||
      ctx.req?.headers.get('x-real-ip') ||
      'unknown';

    try {
      const { success, remaining, reset } = await limiter.limit(ip);

      if (!success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        });
      }
    } catch (e) {
      // If it's our error, rethrow
      if (e instanceof TRPCError) throw e;
      // Redis error - log and allow request (graceful degradation)
      console.error('Rate limiter error:', e);
    }

    return next();
  });

// Rate limit by user ID (for authenticated endpoints)
export const rateLimitByUser = (limiter: Ratelimit) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Skip rate limiting for creators and admins
    if (ctx.user.isCreator || ctx.user.isAdmin) {
      return next();
    }

    try {
      const { success, remaining, reset } = await limiter.limit(ctx.user.id);

      if (!success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please slow down.',
        });
      }
    } catch (e) {
      if (e instanceof TRPCError) throw e;
      console.error('Rate limiter error:', e);
    }

    return next();
  });
```

### Rate-Limited Procedures

```typescript
// Pattern for creating rate-limited procedures
import { authRateLimiter, aiRateLimiter, writeRateLimiter } from '@/server/lib/rate-limiter';

// Auth rate-limited (5/min per IP)
export const authRateLimitedProcedure = publicProcedure.use(rateLimitByIp(authRateLimiter));

// AI rate-limited (10/min per user)
export const aiRateLimitedProcedure = protectedProcedure.use(rateLimitByUser(aiRateLimiter));

// Write rate-limited (30/min per user)
export const writeRateLimitedProcedure = protectedProcedure.use(rateLimitByUser(writeRateLimiter));
```

### Next.js API Route Rate Limiting

```typescript
// server/lib/api-rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { authRateLimiter } from './rate-limiter';

export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<Response>,
  limiter = authRateLimiter
): Promise<Response> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    const { success, remaining, reset } = await limiter.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((reset - Date.now()) / 1000) },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const response = await handler();

    // Add rate limit headers to successful response
    if (response instanceof Response) {
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-RateLimit-Remaining', String(remaining));
      newResponse.headers.set('X-RateLimit-Reset', String(reset));
      return newResponse;
    }

    return response;
  } catch (e) {
    console.error('Rate limiter error:', e);
    // Graceful degradation - allow request if rate limiter fails
    return handler();
  }
}
```

### Using Rate Limit in API Routes

```typescript
// Pattern for Next.js API routes
import { withRateLimit } from '@/server/lib/api-rate-limit';
import { authRateLimiter } from '@/server/lib/rate-limiter';

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      // Your actual handler logic here
      const body = await request.json();
      // ... process request
      return NextResponse.json({ success: true });
    },
    authRateLimiter
  );
}
```

---

## Security Header Patterns

### Next.js Config Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    // Prevent XSS attacks
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    // Prevent MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Prevent clickjacking
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Control referrer information
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Permissions policy (formerly Feature Policy)
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    // HSTS - Force HTTPS (production only)
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

module.exports = {
  // ... existing config
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Error Handling Patterns

### Rate Limit Error Response

```typescript
// Standard rate limit error for tRPC
throw new TRPCError({
  code: 'TOO_MANY_REQUESTS',
  message: 'Too many requests. Please try again later.',
});

// Standard rate limit error for API routes
return NextResponse.json(
  {
    error: 'Too many requests',
    retryAfter: 60, // seconds
  },
  {
    status: 429,
    headers: {
      'Retry-After': '60',
    },
  }
);
```

### Auth Error Response

```typescript
// Invalid/expired token
throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'Invalid or expired session. Please sign in again.',
});

// Missing authentication
throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'Authentication required. Please sign in.',
});
```

---

## Testing Patterns

### Cookie Auth Test Pattern

```typescript
// tests/auth-cookies.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Cookie Authentication', () => {
  it('sets HTTP-only cookie on successful login', async () => {
    const response = await trpc.auth.signin.mutate({
      email: 'test@example.com',
      password: 'password123',
    });

    // Check response
    expect(response.user).toBeDefined();

    // In integration test, verify cookie was set
    // (requires test helper to access response cookies)
  });

  it('clears cookie on logout', async () => {
    // Login first
    await trpc.auth.signin.mutate({ email: 'test@example.com', password: 'password123' });

    // Logout
    const response = await trpc.auth.signout.mutate();
    expect(response.success).toBe(true);

    // Verify cookie was cleared (in integration test)
  });
});
```

### Rate Limit Test Pattern

```typescript
// tests/rate-limiting.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Rate Limiting', () => {
  it('allows requests within limit', async () => {
    // Make 5 requests (at limit)
    for (let i = 0; i < 5; i++) {
      const result = await authRateLimiter.limit('test-ip');
      expect(result.success).toBe(true);
    }
  });

  it('blocks requests exceeding limit', async () => {
    // Fill up limit
    for (let i = 0; i < 5; i++) {
      await authRateLimiter.limit('test-ip-2');
    }

    // Next request should fail
    const result = await authRateLimiter.limit('test-ip-2');
    expect(result.success).toBe(false);
  });

  it('skips rate limiting for admin users', async () => {
    // Test that admin users bypass rate limits
    // (requires mock context with admin user)
  });
});
```

---

## Import Patterns

### Cookie Utilities Import

```typescript
// In auth router and context
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, COOKIE_OPTIONS, DEMO_COOKIE_OPTIONS } from '@/server/lib/cookies';
```

### Rate Limiter Import

```typescript
// In middleware
import { authRateLimiter, aiRateLimiter, writeRateLimiter } from '@/server/lib/rate-limiter';
import { rateLimitByIp, rateLimitByUser } from './middleware';

// In API routes
import { withRateLimit } from '@/server/lib/api-rate-limit';
```

---

## Type Patterns

### Rate Limit Result Type

```typescript
interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}
```

### Cookie Options Type

```typescript
interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
}
```
