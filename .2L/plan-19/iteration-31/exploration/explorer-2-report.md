# Explorer 2 Report: Resilience Patterns & Error Handling

## Executive Summary

The Mirror of Dreams codebase has **no retry logic, exponential backoff, or circuit breaker patterns** for any AI API calls or external integrations. All Claude API calls (8 locations), PayPal API calls, and Supabase operations fail immediately without retry. This creates significant reliability issues for a user-facing application dependent on external services.

## Discoveries

### All AI API Call Locations (Anthropic Claude)

| File | Function/Endpoint | Model | Purpose | Has Retry | Has Timeout |
|------|------------------|-------|---------|-----------|-------------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` | `create` mutation | claude-sonnet-4-5-20250929 | Generate reflections | NO | NO |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` | `createSession`, `sendMessage` | claude-sonnet-4-5-20250929 | Clarify conversations | NO | NO |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts` | `generateDreamEvolution`, `generateCrossDreamEvolution` | claude-sonnet-4-5-20250929 | Evolution reports | NO | NO |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/visualizations.ts` | `generate` | claude-sonnet-4-5-20250929 | Narrative visualizations | NO | NO |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/lifecycle.ts` | `achieve` | claude-sonnet-4-5-20250929 | Achievement ceremonies | NO | NO |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts` | POST handler | claude-sonnet-4-5-20250929 | SSE streaming | NO | 60s (Next.js) |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/consolidation.ts` | `extractPatternsFromSession` | claude-3-5-haiku-20241022 | Pattern extraction | NO | NO |

### Current Error Handling Pattern (All Locations)

All AI API calls follow this anti-pattern:
```typescript
try {
  const response = await client.messages.create(requestConfig);
  // process response
} catch (error: unknown) {
  console.error('Claude API error:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Failed to generate reflection: ${message}`,
  });
}
```

**Problems:**
1. No differentiation between transient and permanent errors
2. No retry for recoverable errors (429, 529, 503)
3. No timeout configuration (defaults to infinite)
4. User sees generic error messages
5. No circuit breaker to prevent cascade failures

### Anthropic SDK Error Types (from node_modules)

Located at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/node_modules/@anthropic-ai/sdk/src/core/error.ts`:

| Error Class | Status Code | Retryable | Description |
|-------------|-------------|-----------|-------------|
| `RateLimitError` | 429 | YES | Rate limit exceeded |
| `InternalServerError` | 500+ | YES | Server errors |
| `APIConnectionError` | N/A | YES | Network issues |
| `APIConnectionTimeoutError` | N/A | YES | Request timeout |
| `AuthenticationError` | 401 | NO | Invalid API key |
| `BadRequestError` | 400 | NO | Malformed request |

### External API Failure Points

#### PayPal (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts`)

| Function | Purpose | Has Retry | Has Timeout |
|----------|---------|-----------|-------------|
| `getPayPalAccessToken()` | OAuth token | NO | NO |
| `paypalFetch()` | Generic API wrapper | NO | NO |
| `createSubscription()` | Create subscription | NO | NO |
| `cancelSubscription()` | Cancel subscription | NO | NO |
| `getSubscriptionDetails()` | Fetch subscription | NO | NO |
| `verifyWebhookSignature()` | Webhook verification | NO | NO |

**Token Caching:** Already implemented with 5-minute buffer expiration.

#### Supabase (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/supabase.ts`)

Currently a simple client singleton with no resilience configuration:
```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

**Database operations throughout codebase:** 100+ `.from()` calls with no retry logic.

### Network Failure Scenarios

| Scenario | Current Behavior | Impact |
|----------|------------------|--------|
| Claude API timeout (>60s) | Request hangs indefinitely | User waits forever |
| Claude rate limit (429) | Immediate failure | User sees error |
| Claude overload (529) | Immediate failure | User sees error |
| PayPal network error | Immediate failure | Subscription fails |
| Supabase connection drop | Immediate failure | Data operations fail |

### Existing Rate Limiting Infrastructure

Located at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/rate-limiter.ts`:

```typescript
// Auth endpoints: 5 requests per minute per IP
export const authRateLimiter = createRateLimiter(5, '1m', 'rl:auth');

// AI endpoints: 10 requests per minute per user
export const aiRateLimiter = createRateLimiter(10, '1m', 'rl:ai');

// Write endpoints: 30 requests per minute per user
export const writeRateLimiter = createRateLimiter(30, '1m', 'rl:write');

// Global: 100 requests per minute per IP
export const globalRateLimiter = createRateLimiter(100, '1m', 'rl:global');
```

**Note:** Rate limiting uses Upstash Redis with graceful degradation (allows request if Redis fails).

### Test Mock Infrastructure

Located at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`:

Already defines error scenarios for testing:
```typescript
export const anthropicErrors = {
  unauthorized: createAnthropicError('Invalid API key', 'authentication_error', 401),
  rateLimited: createAnthropicError('Rate limit exceeded', 'rate_limit_error', 429),
  invalidRequest: createAnthropicError('Invalid request format', 'invalid_request_error', 400),
  serverError: createAnthropicError('Internal server error', 'api_error', 500),
  overloaded: createAnthropicError('API is overloaded', 'api_error', 529),
};
```

## Recommended Retry Strategy

### Exponential Backoff Configuration

```typescript
interface RetryConfig {
  maxRetries: 3;
  baseDelayMs: 1000;
  maxDelayMs: 30000;
  backoffMultiplier: 2;
  jitterFactor: 0.1;
}
```

**Delay calculation:** `min(maxDelay, baseDelay * (multiplier ^ attempt)) + random(jitter)`

### Retryable Error Detection

```typescript
function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) return true;        // 429
  if (error instanceof InternalServerError) return true;   // 500+
  if (error instanceof APIConnectionError) return true;    // Network
  if (error instanceof APIConnectionTimeoutError) return true;
  
  // Check for overloaded (529)
  if (error instanceof APIError && error.status === 529) return true;
  
  return false;
}
```

### Recommended Timeouts

| Operation | Timeout | Rationale |
|-----------|---------|-----------|
| Reflection generation | 90s | Long-form content, thinking enabled |
| Clarify message | 45s | Conversational, shorter responses |
| Pattern extraction (Haiku) | 30s | Faster model, simpler task |
| Evolution report | 120s | Large context, complex analysis |
| PayPal API | 15s | Simple REST calls |
| Supabase queries | 10s | Database operations |

## Circuit Breaker Candidates

### High Priority (External APIs)

1. **Anthropic Claude API**
   - Threshold: 5 failures in 60 seconds
   - Half-open after: 30 seconds
   - Fallback: Queue request, show "AI is busy" message

2. **PayPal Subscription API**
   - Threshold: 3 failures in 60 seconds
   - Half-open after: 60 seconds
   - Fallback: Show "Payment processing delayed" message

### Medium Priority

3. **Supabase (if persistent issues)**
   - Threshold: 10 failures in 60 seconds
   - Consider read-replica failover

## Patterns Identified

### Pattern 1: Lazy Client Initialization
**Description:** Anthropic clients use lazy initialization singleton pattern
**Files:** reflection.ts, clarify.ts, lifecycle.ts, consolidation.ts
**Example:**
```typescript
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}
```
**Recommendation:** Good pattern, extend to include retry wrapper

### Pattern 2: Immediate Error Propagation
**Description:** All errors immediately thrown as TRPCError
**Impact:** No recovery opportunity for transient failures
**Recommendation:** Add retry middleware before error conversion

### Pattern 3: Silent Error Suppression
**Description:** Some locations swallow errors completely
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts:361-363`
```typescript
} catch {
  // Continue without AI response if generation fails
}
```
**Impact:** User doesn't know AI failed, receives incomplete response
**Recommendation:** Log error, show graceful degradation message

## Complexity Assessment

### High Complexity Areas

- **withRetry middleware for tRPC:** Needs to wrap AI-specific procedures, handle error classification, implement exponential backoff, log telemetry
  - Estimated effort: 2 builder sub-tasks

- **Circuit breaker implementation:** Requires state management, threshold tracking, half-open testing
  - Estimated effort: 1-2 builder sub-tasks

### Medium Complexity Areas

- **Timeout configuration:** Add AbortController to all fetch calls
  - Estimated effort: 1 builder sub-task

- **PayPal retry wrapper:** Enhance paypalFetch with retry logic
  - Estimated effort: 1 builder sub-task

### Low Complexity Areas

- **Error type classification:** Utility function to categorize errors
  - Estimated effort: Part of middleware

## Technology Recommendations

### Primary Implementation

1. **Custom retry wrapper** (no external dependencies)
   - Rationale: Full control, matches existing patterns
   - Location: `server/lib/resilience/`

2. **Use Anthropic SDK's built-in timeout**
   ```typescript
   const anthropic = new Anthropic({
     timeout: 90000, // 90 seconds
   });
   ```

### Alternative Libraries (if complexity grows)

- **p-retry:** Lightweight retry with exponential backoff
- **cockatiel:** Full resilience patterns (retry, circuit breaker, bulkhead)
- **@upstash/ratelimit:** Already in use for rate limiting

## Integration Points

### External APIs
- **Anthropic Claude API:** 8 call sites, critical path
- **PayPal REST API:** 6 functions in paypal.ts
- **Supabase PostgreSQL:** 100+ query locations

### Internal Integrations
- **Rate limiter** <-> **Retry logic:** Must coordinate to avoid retry during rate limit
- **Error monitoring** <-> **Circuit breaker:** Need metrics for breaker state
- **Logging** <-> **All resilience:** Must log attempts, failures, recoveries

## Risks & Challenges

### Technical Risks

1. **Retry storm:** Multiple retries on all users during outage
   - Mitigation: Jitter, circuit breaker, request queuing

2. **Extended latency:** Retries add to response time
   - Mitigation: Timeout caps, fast-fail for permanent errors

3. **Cost explosion:** Retried requests consume API credits
   - Mitigation: Only retry on transient errors, count retries

### Complexity Risks

1. **State management for circuit breaker:** Need distributed state if multiple instances
   - Consider: Upstash Redis (already available) for state

## Recommendations for Planner

1. **Create unified resilience module** at `server/lib/resilience/` with:
   - `retry.ts` - Exponential backoff utility
   - `circuit-breaker.ts` - Circuit breaker implementation
   - `errors.ts` - Error classification utilities
   - `index.ts` - Composable wrappers

2. **Implement tRPC middleware** that wraps AI procedures with retry logic:
   ```typescript
   export const withRetry = middleware(async (opts) => {
     return await retryWithBackoff(() => opts.next());
   });
   ```

3. **Add Anthropic timeout configuration** to all client instantiations

4. **Enhance PayPal wrapper** with retry for `paypalFetch`

5. **Add error monitoring** to track failure rates and trigger alerts

6. **Create graceful degradation UI states** for AI unavailability

## Resource Map

### Critical Files to Modify

| File | Change |
|------|--------|
| `server/lib/supabase.ts` | Add connection retry config |
| `server/lib/paypal.ts` | Add retry to paypalFetch |
| `server/trpc/routers/reflection.ts` | Add retry middleware |
| `server/trpc/routers/clarify.ts` | Add retry middleware |
| `server/trpc/routers/evolution.ts` | Add retry middleware |
| `server/trpc/routers/visualizations.ts` | Add retry middleware |
| `server/trpc/routers/lifecycle.ts` | Add retry middleware |
| `app/api/clarify/stream/route.ts` | Add streaming retry |
| `lib/clarify/consolidation.ts` | Add retry wrapper |

### New Files to Create

| File | Purpose |
|------|---------|
| `server/lib/resilience/retry.ts` | Exponential backoff utility |
| `server/lib/resilience/circuit-breaker.ts` | Circuit breaker pattern |
| `server/lib/resilience/errors.ts` | Error classification |
| `server/lib/resilience/index.ts` | Composable exports |
| `server/lib/resilience/__tests__/retry.test.ts` | Unit tests |
| `server/lib/resilience/__tests__/circuit-breaker.test.ts` | Unit tests |

### Key Dependencies

- `@anthropic-ai/sdk` - Has error classes for classification
- `@upstash/ratelimit` - For circuit breaker state (optional)

## Questions for Planner

1. Should circuit breaker state be local (in-memory) or distributed (Redis)?
   - Local: Simpler, but each instance has separate state
   - Distributed: Consistent, requires Redis calls

2. What's the acceptable maximum latency for AI operations including retries?
   - Current: No limit
   - Suggested: 2 minutes for reflections, 1 minute for clarify

3. Should we implement request queuing during circuit breaker open state?
   - Adds complexity but improves UX during outages

4. What monitoring/alerting system should receive failure metrics?
   - Options: Console logs, Supabase table, external service (Sentry, etc.)

5. Should streaming endpoints (clarify/stream) use different retry strategy?
   - Streaming has special considerations for partial responses
