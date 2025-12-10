# Builder Task Breakdown

## Overview

3 primary builders will work in parallel.
Estimated total: 4-6 hours of parallel work.

## Builder Assignment Strategy

- **Builder-1**: Foundation work (config + JWT) - Others may depend on patterns
- **Builder-2**: Rate limiter circuit breaker - Isolated feature
- **Builder-3**: Sentry integration - Can proceed independently

Dependencies noted explicitly below.

---

## Builder-1: Config Validation & JWT Expiry

### Scope

Create centralized configuration validation system using Zod schemas with startup-time validation. Enhance JWT error handling in `context.ts` and `clarify/stream/route.ts` to distinguish between error types with appropriate logging.

### Complexity Estimate

**MEDIUM**

Well-defined scope with clear patterns from exploration. No external dependencies.

### Success Criteria

- [ ] `server/lib/config.ts` created with complete Zod validation
- [ ] All 35+ environment variables validated with appropriate rules
- [ ] Required variables cause startup failure if missing/invalid
- [ ] Optional feature groups (PayPal, Email, Redis) gracefully degrade
- [ ] JWT errors distinguished: TokenExpiredError, JsonWebTokenError, NotBeforeError
- [ ] Appropriate log levels used (warn for expected, error for unexpected)
- [ ] `.env.example` updated with all variables documented
- [ ] Unit tests achieve 85%+ coverage for config.ts
- [ ] JWT expiry tests verify all error type handling

### Files to Create

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/config.ts` - Centralized config validation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/config.test.ts` - Config unit tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/__tests__/jwt-expiry.test.ts` - JWT tests

### Files to Modify

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts` - JWT error handling (lines 30-72)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts` - JWT error handling (lines 24-40)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.env.example` - Document new patterns

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (but establishes patterns others can reference)

### Implementation Notes

1. **Config singleton pattern**: Use lazy initialization to avoid module load issues
2. **Reset function**: Include `resetConfig()` for test isolation
3. **JWT error types**: Import from `jsonwebtoken` package - types are included
4. **Log levels**: Use `authLogger.warn()` for expected errors (expired token), `authLogger.error()` for unexpected
5. **Clarify route**: Apply same pattern but with simpler logging (console.warn)

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Centralized Config with Zod Validation" pattern exactly as specified
- Use "Explicit JWT Expiry Handling" pattern for context.ts
- Follow "Config Validation Tests" pattern for test structure

### Testing Requirements

- Unit tests for config validation (all branches)
- Unit tests for JWT error type handling
- Coverage target: 85%+ for config.ts

**Test Cases Required:**

Config Tests:
- Missing required variable (each one)
- Invalid format (URL, prefix, length)
- Partial feature group configuration
- Complete feature group configuration
- Default value application
- Warning generation for partial configs

JWT Tests:
- Valid token verification
- Expired token detection (both methods)
- Invalid token detection
- TokenExpiredError properties

---

## Builder-2: Rate Limiter Fail-Closed with Circuit Breaker

### Scope

Transform the rate limiter from fail-open to fail-closed behavior. Implement circuit breaker pattern to prevent cascade failures when Redis is unavailable. Update middleware error messages and existing tests.

### Complexity Estimate

**MEDIUM-HIGH**

Circuit breaker logic requires careful state management. Must update existing tests that expect fail-open behavior.

### Success Criteria

- [ ] Rate limiter rejects requests when Redis fails (fail-closed)
- [ ] Circuit breaker opens after 5 consecutive failures
- [ ] Circuit breaker allows half-open requests after 30 seconds
- [ ] Circuit breaker resets on successful request
- [ ] `getCircuitBreakerStatus()` exported for monitoring
- [ ] Middleware error messages distinguish circuit-open from rate-limited
- [ ] All existing rate limiter tests updated for fail-closed behavior
- [ ] New circuit breaker tests pass
- [ ] No regressions in normal rate limiting flow

### Files to Modify

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts` - Circuit breaker implementation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` - Error messages (lines ~213, ~239)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/rate-limiter.test.ts` - Update + add tests

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

### Implementation Notes

1. **State management**: Use module-level variable for circuit breaker state
2. **Return type**: Add `circuitOpen?: boolean` to return type
3. **Testing reset**: Export `resetCircuitBreaker()` for test isolation
4. **Timer mocking**: Use `vi.useFakeTimers()` for half-open tests
5. **Existing tests**: Lines 104-129 expect `success: true` on error - change to `false`

### Key Code Changes

**rate-limiter.ts:**
- Add CIRCUIT_BREAKER configuration constants
- Add circuitState module variable
- Add isCircuitOpen(), recordSuccess(), recordFailure() functions
- Modify checkRateLimit() to use circuit breaker
- Add getCircuitBreakerStatus() for monitoring
- Add resetCircuitBreaker() for testing

**middleware.ts:**
- Update error message in rateLimitByIp (line ~213)
- Update error message in rateLimitByUser (line ~239)

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Rate Limiter with Fail-Closed Behavior" pattern exactly
- Use "Circuit Breaker Tests" pattern for new tests

### Testing Requirements

- Update existing fail-open tests to expect fail-closed
- Add circuit breaker open/close tests
- Add half-open recovery tests with timer mocking
- Coverage target: 85%+ for rate-limiter.ts

**Test Cases Required:**

Fail-Closed Tests:
- Redis error returns success: false
- Redis timeout returns success: false
- circuitOpen flag set correctly

Circuit Breaker Tests:
- Opens after 5 failures
- Rejects requests when open
- Resets on success
- Half-open after recovery timeout
- Recovery on successful half-open request

---

## Builder-3: Sentry Integration

### Scope

Integrate Sentry error monitoring across the application. Create configuration files for client, server, and edge runtimes. Update all error boundaries to report to Sentry. Add tRPC error formatter integration.

### Complexity Estimate

**MEDIUM**

Multiple files to create/modify but patterns are well-documented. Main complexity is ensuring all runtime configurations work together.

### Success Criteria

- [ ] @sentry/nextjs package installed
- [ ] Client-side Sentry configuration working
- [ ] Server-side Sentry configuration working
- [ ] Edge runtime Sentry configuration working
- [ ] instrumentation.ts hook correctly initializes Sentry
- [ ] next.config.js wrapped with withSentryConfig
- [ ] All 6 error boundaries capture errors to Sentry
- [ ] tRPC errorFormatter captures non-auth errors
- [ ] Source maps configured for production builds
- [ ] Auth errors (401/403) NOT reported to Sentry
- [ ] Manual test confirms errors appear in Sentry dashboard

### Files to Create

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.client.config.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.server.config.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/sentry.edge.config.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/instrumentation.ts`

### Files to Modify

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/next.config.js` - Add Sentry wrapper
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/trpc.ts` - Add errorFormatter
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/error.tsx` - Add Sentry capture
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/global-error.tsx` - Add Sentry capture
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/error.tsx` - Add Sentry capture
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/error.tsx` - Add Sentry capture
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/error.tsx` - Add Sentry capture
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/error.tsx` - Add Sentry capture
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.env.example` - Add Sentry variables

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

### Implementation Notes

1. **Package installation**: Run `npm install @sentry/nextjs` first
2. **DSN variables**: SENTRY_DSN for server, NEXT_PUBLIC_SENTRY_DSN for client
3. **Error filtering**: Don't report UNAUTHORIZED/FORBIDDEN in tRPC
4. **Tag consistency**: Use same errorBoundary tag format across all boundaries
5. **Sampling**: 10% trace sampling in production to reduce costs
6. **Source maps**: hideSourceMaps: true prevents exposure to client

### Error Boundary Tags

| File | Tag Value |
|------|-----------|
| app/error.tsx | `root` |
| app/global-error.tsx | `global` |
| app/dashboard/error.tsx | `dashboard` |
| app/dreams/error.tsx | `dreams` |
| app/clarify/error.tsx | `clarify` |
| app/reflection/error.tsx | `reflection` |

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "Client-Side Configuration" pattern for sentry.client.config.ts
- Use "Server-Side Configuration" pattern for sentry.server.config.ts
- Use "Edge Runtime Configuration" pattern for sentry.edge.config.ts
- Use "Error Boundary Sentry Capture" pattern for all error.tsx files
- Use "tRPC Error Formatter with Sentry" pattern for trpc.ts

### Testing Requirements

- No automated tests for Sentry (external service)
- Manual verification required:
  1. Trigger client-side error, verify in Sentry dashboard
  2. Trigger server-side error, verify in Sentry dashboard
  3. Verify auth errors NOT appearing in Sentry
  4. Verify error boundary tags present
  5. Verify user context attached when available

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

All builders can start simultaneously:
- **Builder-1**: Config Validation & JWT Expiry
- **Builder-2**: Rate Limiter Circuit Breaker
- **Builder-3**: Sentry Integration

### Integration Notes

**Shared File Coordination:**
- `.env.example` - Builder-1 and Builder-3 both modify; merge changes
- No other file conflicts expected

**Integration Verification:**
1. Run full test suite after all builders complete
2. Verify TypeScript compilation succeeds
3. Manual smoke test of auth flow
4. Manual verification of Sentry error capture

**Potential Conflict Areas:**
- None significant - builders work on different files
- `.env.example` needs careful merge

---

## Environment Variables to Add

### Builder-1 (.env.example documentation)

Update existing variable documentation with validation requirements:

```bash
# =======================
# REQUIRED (Application will not start without these)
# =======================
SUPABASE_URL=https://xxx.supabase.co          # Must be valid URL
SUPABASE_SERVICE_ROLE_KEY=xxx                  # Min 20 characters
JWT_SECRET=xxx                                 # Min 32 characters
ANTHROPIC_API_KEY=sk-ant-xxx                   # Must start with sk-ant-
```

### Builder-3 (Sentry variables)

```bash
# =======================
# SENTRY (Required for production error monitoring)
# =======================
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=mirror-of-dreams
SENTRY_AUTH_TOKEN=sntrys_xxx   # For source map uploads during build
```

---

## Verification Checklist

### Builder-1 Completion

- [ ] config.ts created with all schemas
- [ ] validateConfig() returns correct structure
- [ ] getConfig() singleton works
- [ ] JWT error handling updated in context.ts
- [ ] JWT error handling updated in clarify stream route
- [ ] All config tests pass
- [ ] All JWT tests pass
- [ ] .env.example updated

### Builder-2 Completion

- [ ] Circuit breaker constants defined
- [ ] Circuit breaker state management working
- [ ] checkRateLimit() returns circuitOpen flag
- [ ] getCircuitBreakerStatus() exported
- [ ] Middleware error messages updated
- [ ] Existing tests updated (fail-closed)
- [ ] New circuit breaker tests pass
- [ ] All rate limiter tests pass

### Builder-3 Completion

- [ ] @sentry/nextjs installed
- [ ] All 4 Sentry config files created
- [ ] instrumentation.ts created
- [ ] next.config.js wrapped
- [ ] trpc.ts errorFormatter updated
- [ ] All 6 error boundaries updated
- [ ] .env.example updated
- [ ] Manual verification in Sentry dashboard

### Final Integration

- [ ] npm run typecheck passes
- [ ] npm run lint passes
- [ ] npm run test:run passes
- [ ] npm run build succeeds
- [ ] Manual auth flow test passes
- [ ] Sentry receives test errors
