# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Security & Observability Architecture

## Vision Summary
Transform Mirror of Dreams from "production-ready" (7.8/10) to "excellent" (9+/10) by fixing critical security vulnerabilities (JWT expiry enforcement, rate limiter fail-closed), adding production-grade error monitoring (Sentry), and implementing config validation at startup.

---

## Requirements Analysis

### Scope Assessment (Iteration 1 Focus)
- **Security fixes identified:** 2 (JWT expiry enforcement, rate limiter fail-closed)
- **Observability additions:** 2 (Sentry integration, config validation)
- **Error boundary locations to update:** 6 (app/error.tsx, app/global-error.tsx, app/clarify/error.tsx, app/dashboard/error.tsx, app/dreams/error.tsx, app/reflection/error.tsx)
- **Estimated total work:** 6-10 hours

### Complexity Rating
**Overall Complexity: MEDIUM**

**Rationale:**
- JWT expiry is a straightforward 3-line addition to existing code
- Rate limiter fail-closed requires circuit breaker pattern (moderate complexity)
- Sentry integration is well-documented for Next.js 14 but touches multiple files
- Config validation with Zod follows existing patterns in codebase

---

## Architectural Analysis

### Major Components Identified

1. **JWT Authentication Context (`server/trpc/context.ts`)**
   - **Purpose:** Creates request context with authenticated user from JWT token
   - **Current Issue:** Uses `jwt.verify()` but does NOT explicitly check `decoded.exp` against current time
   - **Complexity:** LOW
   - **Why Critical:** The `JWTPayload` type includes `exp: number` (line 75-76 in types/user.ts), tokens are issued with 30-day expiry (line 95 in auth.ts), but context.ts does not verify expiration before database lookup. While `jwt.verify()` should validate expiry by default, explicit check is missing.

2. **Rate Limiter (`server/lib/rate-limiter.ts`)**
   - **Purpose:** Upstash-based rate limiting for auth, AI, write, and global endpoints
   - **Current Issue:** Lines 74-78 show `catch` block returns `{ success: true }` on Redis failure (fail-open)
   - **Complexity:** MEDIUM
   - **Why Critical:** If Redis is unavailable, ALL rate limits are bypassed, allowing unlimited requests (brute-force attacks, cost attacks on AI endpoints)

3. **Error Boundaries (6 files in `app/` directory)**
   - **Purpose:** Catch unhandled errors in route segments
   - **Current Issue:** All error boundaries log to `console.error()` with comment "future: integrate with Sentry"
   - **Complexity:** LOW
   - **Why Critical:** Production errors only go to stdout, not visible in dashboard, no alerting

4. **Logging Infrastructure (`server/lib/logger.ts`)**
   - **Purpose:** Pino-based structured logging with service-specific child loggers
   - **Current State:** Good foundation - has authLogger, aiLogger, dbLogger, paymentLogger, emailLogger
   - **Complexity:** LOW (extension point for Sentry)
   - **Why Critical:** Sentry can integrate with existing logger for server-side error capture

5. **Config Validation (NOT YET EXISTS)**
   - **Purpose:** Validate all required env vars at startup
   - **Current State:** Scattered checks like `if (!JWT_SECRET) throw new Error(...)` in individual files
   - **Complexity:** MEDIUM
   - **Why Critical:** Missing env vars fail at runtime (first request) rather than deployment time

### Technology Stack Implications

**Sentry Integration**
- **Options:** @sentry/nextjs (official), @sentry/node + manual integration
- **Recommendation:** @sentry/nextjs via official wizard
- **Rationale:**
  - Native Next.js 14 App Router support
  - Automatic source map upload
  - Client + Server error capture
  - Performance monitoring built-in
  - Handles edge runtime

**Config Validation**
- **Options:** Zod (already in deps), manual validation, env-var library
- **Recommendation:** Zod schema in `server/lib/config.ts`
- **Rationale:**
  - Zod ^3.25.76 already installed
  - Consistent with existing schema patterns in `types/schemas.ts`
  - Type inference for config object

---

## Detailed Security Analysis

### 1. JWT Expiry Enforcement

**Current Code (`server/trpc/context.ts:30-72`):**
```typescript
if (token) {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as JWTPayload;
    // ... database lookup proceeds without explicit expiry check
```

**Issue Analysis:**
- `jwt.verify()` from `jsonwebtoken` library DOES check expiry by default
- However, explicit check provides: (1) better error logging, (2) defense-in-depth, (3) code clarity
- The JWTPayload type has `exp: number` (types/user.ts:75)
- Tokens are issued with 30-day expiry (auth.ts:95, 218, 431; users.ts:183)

**Recommended Fix:**
```typescript
// After jwt.verify()
if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
  authLogger.warn({ userId: payload.userId }, 'Expired JWT token rejected');
  return { user: null, req };
}
```

**Test Coverage Needed:**
- Test that expired token returns null user
- Test that valid token within expiry returns user
- Test edge case: token at exact expiry time

### 2. Rate Limiter Fail-Closed

**Current Code (`server/lib/rate-limiter.ts:67-78`):**
```typescript
try {
  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining, reset: result.reset };
} catch (e) {
  logger.error({ service: 'rate-limiter', err: e, identifier }, 'Rate limiter error');
  // Graceful degradation - allow request if Redis fails
  return { success: true };  // <-- SECURITY ISSUE
}
```

**Risk Analysis:**
- If Upstash Redis is down, ALL requests bypass rate limiting
- Enables: Brute-force attacks on auth (5/min limit bypassed)
- Enables: Cost attacks on AI endpoints (10/min limit bypassed)
- Enables: DDoS (100/min global limit bypassed)

**Recommended Fix - Circuit Breaker Pattern:**
```typescript
// Track consecutive Redis failures
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_DURATION_MS = 60000; // 1 minute
let circuitOpenedAt: number | null = null;

export async function checkRateLimit(...) {
  // Circuit breaker: If open, reject immediately
  if (circuitOpenedAt && Date.now() - circuitOpenedAt < CIRCUIT_OPEN_DURATION_MS) {
    logger.warn({ service: 'rate-limiter' }, 'Circuit breaker open - rejecting request');
    return { success: false, reason: 'service_unavailable' };
  }

  try {
    const result = await limiter.limit(identifier);
    consecutiveFailures = 0; // Reset on success
    circuitOpenedAt = null;
    return { success: result.success, ... };
  } catch (e) {
    consecutiveFailures++;
    logger.error({ service: 'rate-limiter', err: e, failures: consecutiveFailures }, 'Rate limiter error');

    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      circuitOpenedAt = Date.now();
      logger.fatal({ service: 'rate-limiter' }, 'Circuit breaker opened due to repeated failures');
    }

    // FAIL-CLOSED: Reject request when Redis unavailable
    return { success: false, reason: 'redis_unavailable' };
  }
}
```

**Test Coverage Updates Needed:**
- Update existing test at line 104-119 from expecting `success: true` to `success: false`
- Add circuit breaker threshold tests
- Add circuit breaker recovery tests

### 3. Sentry Integration Architecture

**Files to Modify/Create:**

1. **`sentry.client.config.ts`** (NEW)
   - Client-side Sentry initialization
   - Browser error capture
   - Performance tracing

2. **`sentry.server.config.ts`** (NEW)
   - Server-side Sentry initialization
   - API route error capture
   - Server performance tracing

3. **`sentry.edge.config.ts`** (NEW)
   - Edge runtime Sentry initialization
   - Middleware error capture

4. **`next.config.js`** (MODIFY)
   - Wrap with `withSentryConfig()`
   - Enable source map upload

5. **Error Boundaries (6 files):**
   - `app/error.tsx`
   - `app/global-error.tsx`
   - `app/clarify/error.tsx`
   - `app/dashboard/error.tsx`
   - `app/dreams/error.tsx`
   - `app/reflection/error.tsx`

   **Change:** Replace `console.error(...)` with:
   ```typescript
   import * as Sentry from '@sentry/nextjs';

   useEffect(() => {
     Sentry.captureException(error, {
       extra: {
         digest: error.digest,
         route: '/clarify',  // route-specific
       },
     });
   }, [error]);
   ```

6. **AI API Error Paths:**
   - Search for `catch` blocks in AI-related files
   - Add `Sentry.captureException()` for API failures

7. **PayPal Webhook Error Paths:**
   - Similar treatment for payment webhook errors

**Environment Variables Needed:**
```bash
# .env.example additions
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx  # For source map upload
SENTRY_ORG=your-org
SENTRY_PROJECT=mirror-of-dreams
```

### 4. Config Validation at Startup

**Create: `server/lib/config.ts`**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Required
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),

  // Conditionally required in production
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // PayPal (required for subscriptions)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'live']).default('sandbox'),

  // Email (required for production)
  GMAIL_USER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),

  // Sentry (NEW)
  SENTRY_DSN: z.string().url().optional(),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DOMAIN: z.string().url().default('http://localhost:3000'),
});

// Validate on module load (server startup)
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment configuration:');
  console.error(result.error.format());
  throw new Error('Environment validation failed');
}

export const config = result.data;
```

**Integration Point:**
- Import `config` in `server/trpc/context.ts` to ensure validation runs early
- Replace individual `process.env.X` checks with `config.X` access

---

## Dependency Graph

```
Config Validation (server/lib/config.ts)
├── Validates at import time
├── Used by: context.ts, rate-limiter.ts
└── Must be created FIRST
    |
    v
JWT Expiry Enforcement (server/trpc/context.ts)
├── Simple 5-line addition
├── Uses: config.JWT_SECRET (if migrated)
└── Independent of other changes
    |
    v
Rate Limiter Fail-Closed (server/lib/rate-limiter.ts)
├── Circuit breaker pattern
├── Requires: Update tests (rate-limiter.test.ts)
└── Independent of Sentry
    |
    v
Sentry Integration (multiple files)
├── @sentry/nextjs package install
├── Config files (3 new)
├── next.config.js modification
├── Error boundaries (6 files)
└── Depends on: Config validation (SENTRY_DSN)
```

---

## Risk Assessment

### High Risks

- **Rate Limiter Test Breaking Changes:**
  - **Impact:** Existing tests expect `success: true` on Redis failure (line 104-119)
  - **Mitigation:** Update tests to expect `success: false` for fail-closed behavior
  - **Recommendation:** Handle in same PR to maintain test integrity

### Medium Risks

- **Sentry Source Map Upload in CI:**
  - **Impact:** Build might fail if SENTRY_AUTH_TOKEN not configured
  - **Mitigation:** Make source map upload optional (skip if token missing)
  - **Recommendation:** Add conditional logic in next.config.js

- **Circuit Breaker State in Serverless:**
  - **Impact:** Vercel serverless functions don't share memory between invocations
  - **Mitigation:** Use Redis for circuit breaker state OR use Vercel's Edge Config
  - **Recommendation:** Start with in-memory (acceptable for per-instance protection), document limitation

### Low Risks

- **Config Validation Breaking Existing Deployments:**
  - **Impact:** Stricter validation might catch previously-ignored missing vars
  - **Mitigation:** Start with `.optional()` for non-critical vars, tighten over time
  - **Recommendation:** Review .env.example against production Vercel env vars

---

## CI/CD Implications

### Current CI State (`/.github/workflows/ci.yml`)

**Critical Issue at Line 60:**
```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  continue-on-error: true  # <-- THIS ALLOWS FAILING TESTS TO PASS
```

**Implications for Security Changes:**
1. Rate limiter test changes WILL break if continue-on-error is removed
2. Need to update tests BEFORE removing continue-on-error
3. Sentry setup should not add new failing tests

### Recommended CI Updates

1. **Remove `continue-on-error: true`** after tests are fixed
2. **Add coverage threshold:**
   ```yaml
   - name: Check coverage threshold
     run: |
       COVERAGE=$(npm run test:coverage 2>&1 | grep "All files" | awk '{print $4}')
       if [ "${COVERAGE%.*}" -lt 70 ]; then
         echo "Coverage $COVERAGE is below 70% threshold"
         exit 1
       fi
   ```
3. **Add npm audit for security:**
   ```yaml
   - name: Security audit
     run: npm audit --audit-level=high
   ```

---

## Test Coverage Requirements

### Existing Tests to Update

**File: `server/lib/__tests__/rate-limiter.test.ts`**

| Line | Current Expectation | New Expectation |
|------|--------------------|--------------------|
| 104-119 | `success: true` on Redis error | `success: false` on Redis error |
| 120-130 | `success: true` on timeout | `success: false` on timeout |

### New Tests Needed

1. **JWT Expiry Tests (new file or add to existing auth tests):**
   - `rejects token with exp < current time`
   - `accepts token with exp > current time`
   - `handles token at exact expiry boundary`

2. **Circuit Breaker Tests:**
   - `opens circuit after N consecutive failures`
   - `rejects requests while circuit is open`
   - `closes circuit after duration expires`
   - `resets failure count on success`

3. **Config Validation Tests:**
   - `throws on missing JWT_SECRET`
   - `throws on invalid SUPABASE_URL`
   - `accepts valid configuration`
   - `provides helpful error messages`

4. **Sentry Integration Tests (optional):**
   - `captureException called on error boundary trigger`
   - `error context includes route information`

---

## Environment Variables Summary

### New Variables Required

| Variable | Purpose | Required |
|----------|---------|----------|
| `SENTRY_DSN` | Sentry project DSN | Production |
| `SENTRY_AUTH_TOKEN` | Source map upload | CI only |
| `SENTRY_ORG` | Sentry organization slug | CI only |
| `SENTRY_PROJECT` | Sentry project slug | CI only |

### Variables to Validate

All variables in `.env.example` should be validated by the new config schema, with appropriate `.optional()` flags for non-critical ones.

---

## Recommendations for Master Plan

1. **Config Validation FIRST**
   - Create `server/lib/config.ts` before other changes
   - This ensures all subsequent code can use validated config

2. **JWT Expiry is Quick Win**
   - 5-line change with high security impact
   - Can be done independently
   - Low risk, easy to test

3. **Rate Limiter Requires Coordinated Changes**
   - Code change + test updates must be in same PR
   - Consider circuit breaker state limitations in serverless
   - Document fail-closed behavior for ops team

4. **Sentry Last (Largest Scope)**
   - Touches 10+ files
   - Requires npm install
   - Requires Vercel env var setup
   - Can be done incrementally (error boundaries first, then API paths)

5. **CI Changes After Tests Pass**
   - Only remove `continue-on-error` after rate limiter tests updated
   - Add coverage threshold as separate step

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 14, TypeScript, tRPC, Supabase, Upstash Redis, Pino logging
- **Patterns observed:**
  - Zod for validation
  - Child loggers for service-specific logging
  - Error boundaries per route segment
- **Opportunities:**
  - Sentry integrates naturally with existing Pino logging
  - Config schema follows existing Zod patterns
- **Constraints:**
  - Must maintain backward compatibility with existing auth flows
  - Cannot break rate limiting for normal operations

### Dependencies to Add

```json
{
  "@sentry/nextjs": "^8.x"
}
```

No other new dependencies needed - Zod is already installed.

---

## Notes & Observations

- The existing rate limiter tests at lines 104-130 explicitly document the current fail-open behavior with comments like "graceful degradation" - this needs to be communicated to the team as a BREAKING CHANGE from security perspective

- The JWTPayload type already has `exp` and `iat` fields, indicating expiry was always intended to be enforced

- All 6 error boundaries have identical TODO comments about Sentry integration, suggesting this was always planned

- The CI workflow was likely set to `continue-on-error: true` temporarily during development and never reverted

- Circuit breaker state in serverless is a known limitation - consider using Vercel Edge Config or Redis for shared state in future iteration if needed

---

*Exploration completed: 2025-12-10*
*This report informs master planning decisions for Plan 21, Iteration 1: Critical Fixes (Security & Observability)*
