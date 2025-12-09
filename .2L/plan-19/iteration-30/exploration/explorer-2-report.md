# Explorer 2 Report: Rate Limiting Analysis

## Executive Summary

Mirror of Dreams currently has **NO rate limiting implementation** on any endpoints. While Supabase Auth has built-in rate limits for its native auth operations, all custom endpoints (tRPC procedures and Next.js API routes) are completely unprotected against abuse. The codebase already has `@upstash/redis` installed, providing an ideal foundation for implementing rate limiting using their serverless Redis with zero infrastructure changes.

## Current State Assessment

### 1. Rate Limiting Status: NONE

**Files Examined:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` - Contains auth, tier, and usage middlewares, NO rate limiting
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts` - Does NOT exist
- All tRPC routers - No rate limiting middleware applied
- All API routes - No rate limiting checks

**Search Results for "rate.?limit":**
- `.env.example` has `RATE_LIMIT=60` placeholder (unused)
- `supabase/config.toml` has Supabase Auth rate limits (not application-level)
- Documentation mentions rate limiting as missing/deferred

### 2. Supabase Auth Built-in Rate Limits

From `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/config.toml`:

```toml
[auth.rate_limit]
email_sent = 2              # emails per hour
sign_in_sign_ups = 30       # per 5 minutes per IP
token_refresh = 150         # per 5 minutes per IP
token_verifications = 30    # per 5 minutes per IP
```

**Note:** These ONLY apply to Supabase Auth native operations. Our custom auth endpoints bypass these entirely.

### 3. Available Infrastructure

From `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/package.json`:

```json
"@upstash/redis": "^1.35.0"  // Already installed!
```

This is excellent - Upstash Redis provides:
- Serverless Redis (no infrastructure management)
- Built-in rate limiting utilities via `@upstash/ratelimit`
- Edge-compatible (works with Vercel Edge Functions)
- Free tier sufficient for MVP

## Endpoint Inventory Requiring Rate Limiting

### Critical Priority: Auth Endpoints (PUBLIC, brute-force targets)

| Endpoint | Type | Current Protection | Risk Level |
|----------|------|-------------------|------------|
| `auth.signup` | tRPC mutation | None | **CRITICAL** |
| `auth.signin` | tRPC mutation | None | **CRITICAL** |
| `auth.loginDemo` | tRPC mutation | None | HIGH |
| `admin.authenticate` | tRPC mutation | None | **CRITICAL** |
| `admin.checkAuth` | tRPC query | None | HIGH |
| `/api/auth/forgot-password` | Next.js POST | None | **CRITICAL** |
| `/api/auth/reset-password` | Next.js POST | None | **CRITICAL** |
| `/api/auth/send-verification` | Next.js POST | None | HIGH |
| `/api/auth/verify-email` | Next.js GET | None | MEDIUM |
| `/api/auth/verify-reset-token` | Next.js GET | None | MEDIUM |

### High Priority: AI/Expensive Endpoints (cost risk)

| Endpoint | Type | Current Protection | Cost Risk |
|----------|------|-------------------|-----------|
| `reflection.create` | tRPC mutation | usageLimitedProcedure (monthly) | **HIGH** - Claude API |
| `clarify.createSession` | tRPC mutation | clarifySessionLimitedProcedure | **HIGH** - Claude API |
| `clarify.sendMessage` | tRPC mutation | clarifyProcedure | **HIGH** - Claude API |
| `/api/clarify/stream` | Next.js POST | Auth only | **HIGH** - Claude API |
| `evolution.generateDreamEvolution` | tRPC mutation | protectedProcedure | **HIGH** - Claude API |
| `evolution.generateCrossDreamEvolution` | tRPC mutation | protectedProcedure | **HIGH** - Claude API |
| `lifecycle.achieve` | tRPC mutation | protectedProcedure | **HIGH** - Claude API |

### Medium Priority: Write Endpoints (spam/abuse risk)

| Endpoint | Type | Current Protection |
|----------|------|-------------------|
| `dreams.create` | tRPC mutation | protectedProcedure |
| `dreams.update` | tRPC mutation | protectedProcedure |
| `dreams.updateStatus` | tRPC mutation | protectedProcedure |
| `dreams.delete` | tRPC mutation | protectedProcedure |
| `reflections.update` | tRPC mutation | protectedProcedure |
| `reflections.delete` | tRPC mutation | protectedProcedure |
| `reflections.submitFeedback` | tRPC mutation | protectedProcedure |
| `lifecycle.evolve` | tRPC mutation | protectedProcedure |
| `lifecycle.release` | tRPC mutation | protectedProcedure |
| `subscriptions.createCheckout` | tRPC mutation | protectedProcedure |
| `subscriptions.cancel` | tRPC mutation | protectedProcedure |
| `users.updateProfile` | tRPC mutation | protectedProcedure |
| `users.changeEmail` | tRPC mutation | writeProcedure |

### Low Priority: Read Endpoints (DDoS potential only)

| Endpoint | Type | Current Protection |
|----------|------|-------------------|
| `dreams.list` | tRPC query | protectedProcedure |
| `reflections.list` | tRPC query | protectedProcedure |
| `clarify.listSessions` | tRPC query | clarifyReadProcedure |
| Admin read endpoints | tRPC query | creatorProcedure |

## Recommended Rate Limits

### Tier 1: Auth Protection (5/min per IP)

```typescript
const AUTH_RATE_LIMIT = {
  endpoints: [
    'auth.signup',
    'auth.signin', 
    'auth.loginDemo',
    'admin.authenticate',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/send-verification',
  ],
  limit: 5,
  window: '1m',
  identifier: 'ip', // IP-based (no auth required)
};
```

### Tier 2: AI Protection (10/min per user)

```typescript
const AI_RATE_LIMIT = {
  endpoints: [
    'reflection.create',
    'clarify.createSession',
    'clarify.sendMessage',
    '/api/clarify/stream',
    'evolution.generateDreamEvolution',
    'evolution.generateCrossDreamEvolution',
    'lifecycle.achieve',
  ],
  limit: 10,
  window: '1m',
  identifier: 'userId', // User-based (authenticated)
};
```

### Tier 3: Write Protection (30/min per user)

```typescript
const WRITE_RATE_LIMIT = {
  endpoints: [
    'dreams.create',
    'dreams.update',
    'dreams.delete',
    'reflections.update',
    'reflections.delete',
    'lifecycle.evolve',
    'lifecycle.release',
  ],
  limit: 30,
  window: '1m',
  identifier: 'userId',
};
```

### Tier 4: Global Protection (100/min per IP)

```typescript
const GLOBAL_RATE_LIMIT = {
  endpoints: ['*'], // All endpoints
  limit: 100,
  window: '1m',
  identifier: 'ip',
};
```

## Implementation Approach

### Option A: Upstash Ratelimit (RECOMMENDED)

**Pros:**
- `@upstash/redis` already installed
- No Redis infrastructure to manage (serverless)
- Edge-compatible for Vercel deployment
- Built-in sliding window algorithm
- Automatic cleanup (no TTL management)

**Implementation:**

1. Install additional package:
```bash
npm install @upstash/ratelimit
```

2. Create rate limiter configuration:

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Auth endpoints: 5 requests per minute per IP
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1m'),
  prefix: 'rl:auth',
});

// AI endpoints: 10 requests per minute per user
export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1m'),
  prefix: 'rl:ai',
});

// Write endpoints: 30 requests per minute per user
export const writeRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1m'),
  prefix: 'rl:write',
});

// Global: 100 requests per minute per IP
export const globalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1m'),
  prefix: 'rl:global',
});
```

3. Create tRPC middleware:

**Add to:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`

```typescript
import { TRPCError } from '@trpc/server';
import { authRateLimiter, aiRateLimiter, writeRateLimiter } from '@/server/lib/rate-limiter';

// Rate limit by IP (for unauthenticated endpoints)
export const rateLimitByIp = (limiter: Ratelimit) => 
  middleware(async ({ ctx, next }) => {
    // Get IP from headers (Vercel forwards this)
    const ip = ctx.req?.headers.get('x-forwarded-for')?.split(',')[0] 
      || ctx.req?.headers.get('x-real-ip') 
      || 'unknown';
    
    const { success, remaining, reset } = await limiter.limit(ip);
    
    if (!success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      });
    }
    
    return next();
  });

// Rate limit by user ID (for authenticated endpoints)
export const rateLimitByUser = (limiter: Ratelimit) => 
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    
    const { success, remaining, reset } = await limiter.limit(ctx.user.id);
    
    if (!success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please slow down.',
      });
    }
    
    return next();
  });

// Export rate-limited procedures
export const authRateLimitedProcedure = publicProcedure.use(rateLimitByIp(authRateLimiter));
export const aiRateLimitedProcedure = protectedProcedure.use(rateLimitByUser(aiRateLimiter));
export const writeRateLimitedProcedure = protectedProcedure.use(rateLimitByUser(writeRateLimiter));
```

4. Apply to routers by replacing base procedures.

### Option B: In-Memory Rate Limiting (Fallback)

**Use case:** Development environment or if Upstash not configured.

**Implementation:** Simple Map-based limiter with token bucket algorithm.

```typescript
// In-memory rate limiter (NOT for production with multiple instances)
const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string, 
  limit: number, 
  windowMs: number
): boolean {
  const now = Date.now();
  const record = requests.get(identifier);
  
  if (!record || now > record.resetAt) {
    requests.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}
```

**Warning:** In-memory does NOT work with multiple serverless instances (Vercel).

## Redis vs In-Memory Analysis

### Upstash Redis (RECOMMENDED for Production)

| Factor | Assessment |
|--------|------------|
| **Scalability** | Excellent - works across all serverless instances |
| **Persistence** | Built-in - survives deployments |
| **Cost** | Free tier: 10k commands/day (sufficient for MVP) |
| **Latency** | ~1-5ms (negligible) |
| **Infrastructure** | Zero management (serverless) |
| **Edge Support** | Full support (Vercel Edge) |
| **Already Installed** | Yes (`@upstash/redis` in package.json) |

### In-Memory (Development Only)

| Factor | Assessment |
|--------|------------|
| **Scalability** | Poor - per-instance only |
| **Persistence** | None - resets on redeploy |
| **Cost** | Free |
| **Latency** | 0ms |
| **Infrastructure** | None |
| **Edge Support** | No |
| **Use Case** | Local development fallback |

## Response Header Recommendations

Add rate limit info to responses for client awareness:

```typescript
// Headers to add
{
  'X-RateLimit-Limit': '10',
  'X-RateLimit-Remaining': '7',
  'X-RateLimit-Reset': '1702345678', // Unix timestamp
  'Retry-After': '30' // Only on 429 response
}
```

## Next.js API Route Rate Limiting

For non-tRPC routes, create middleware helper:

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/api-rate-limit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authRateLimiter } from './rate-limiter';

export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<Response>,
  limiter = authRateLimiter
): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
    || request.headers.get('x-real-ip') 
    || 'unknown';
    
  const { success, remaining, reset } = await limiter.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: reset },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }
  
  const response = await handler();
  
  // Add rate limit headers to successful response
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(reset));
  
  return response;
}
```

## Environment Variables Required

```bash
# Add to .env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Optional: Enable/disable rate limiting per environment
RATE_LIMIT_ENABLED=true
```

## Testing Strategy

### Unit Tests

```typescript
// test/rate-limiter.test.ts
describe('Rate Limiter', () => {
  it('allows requests within limit', async () => {
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
    // Next should fail
    const result = await authRateLimiter.limit('test-ip-2');
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests

```typescript
// Test actual endpoint behavior
describe('Auth Rate Limiting', () => {
  it('returns 429 after 5 failed login attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await trpc.auth.signin.mutate({ 
        email: 'test@test.com', 
        password: 'wrong' 
      });
    }
    
    await expect(
      trpc.auth.signin.mutate({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow('TOO_MANY_REQUESTS');
  });
});
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/server/lib/rate-limiter.ts` | CREATE | Rate limiter configuration |
| `/server/lib/api-rate-limit.ts` | CREATE | Next.js API route helper |
| `/server/trpc/middleware.ts` | MODIFY | Add rate limit middlewares |
| `/server/trpc/routers/auth.ts` | MODIFY | Apply auth rate limiting |
| `/server/trpc/routers/reflection.ts` | MODIFY | Apply AI rate limiting |
| `/server/trpc/routers/clarify.ts` | MODIFY | Apply AI rate limiting |
| `/server/trpc/routers/evolution.ts` | MODIFY | Apply AI rate limiting |
| `/server/trpc/routers/dreams.ts` | MODIFY | Apply write rate limiting |
| `/app/api/auth/forgot-password/route.ts` | MODIFY | Wrap with rate limit |
| `/app/api/auth/reset-password/route.ts` | MODIFY | Wrap with rate limit |
| `/app/api/auth/send-verification/route.ts` | MODIFY | Wrap with rate limit |
| `/app/api/clarify/stream/route.ts` | MODIFY | Wrap with rate limit |
| `.env.example` | MODIFY | Add Upstash env vars |

## Risks and Mitigations

### Risk 1: Legitimate User Blocking
**Concern:** Normal users hit rate limits during heavy usage.
**Mitigation:** 
- Generous limits for authenticated users
- Skip rate limiting for creator/admin users
- Add bypass for CI/testing

### Risk 2: IP Spoofing
**Concern:** Attacker spoofs IP to bypass limits.
**Mitigation:** 
- Vercel handles `x-forwarded-for` correctly
- Use user ID for authenticated endpoints
- Consider device fingerprinting for sensitive ops

### Risk 3: Redis Unavailability
**Concern:** Upstash Redis goes down.
**Mitigation:** 
- Graceful fallback: allow request if Redis fails
- Monitor Redis health in Sentry

```typescript
try {
  const { success } = await limiter.limit(identifier);
  if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
} catch (e) {
  if (e instanceof TRPCError) throw e;
  // Redis error - log and allow request
  console.error('Rate limiter error:', e);
}
```

## Implementation Order

1. **Phase 1: Foundation** (~1 hour)
   - Create `/server/lib/rate-limiter.ts`
   - Add rate limit middlewares to `/server/trpc/middleware.ts`
   - Configure Upstash environment variables

2. **Phase 2: Auth Endpoints** (~1 hour)
   - Apply to `auth.signup`, `auth.signin`, `auth.loginDemo`
   - Apply to `admin.authenticate`
   - Apply to Next.js auth routes

3. **Phase 3: AI Endpoints** (~1 hour)
   - Apply to `reflection.create`
   - Apply to `clarify.createSession`, `clarify.sendMessage`
   - Apply to `/api/clarify/stream`
   - Apply to evolution endpoints

4. **Phase 4: Write Endpoints** (~30 min)
   - Apply to dreams mutations
   - Apply to lifecycle mutations

5. **Phase 5: Testing** (~1 hour)
   - Write unit tests
   - Write integration tests
   - Manual testing

## Summary

**Current State:** Zero rate limiting, high vulnerability to abuse.

**Recommended Solution:** Upstash Ratelimit with Redis backend.

**Key Benefits:**
- Already have `@upstash/redis` installed
- Zero infrastructure management
- Works across all serverless instances
- Free tier sufficient for MVP
- ~4 hours total implementation time

**Priority Endpoints:**
1. Auth endpoints (brute-force protection) - CRITICAL
2. AI endpoints (cost protection) - HIGH
3. Write endpoints (spam protection) - MEDIUM
