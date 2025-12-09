# Builder-2 Report: Retry Logic with Exponential Backoff

## Status
COMPLETE

## Summary
Implemented exponential backoff retry utility for AI API calls and integrated it into all 6 AI-calling files (5 tRPC routers + 1 utility). The retry logic handles transient errors (rate limits, server errors, network issues) with configurable backoff, jitter, and logging, while immediately failing on permanent errors (validation, auth).

## Files Created

### Implementation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/retry.ts` - Core retry utility with exponential backoff

## Files Modified

### tRPC Routers
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` - Added `withAIRetry` to `create` mutation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` - Added `withAIRetry` to 4 AI calls (createSession initial, createSession followUp, sendMessage, sendMessage followUp)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts` - Added `withAIRetry` + try/catch to `generateDreamEvolution` and `generateCrossDreamEvolution`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/visualizations.ts` - Added `withAIRetry` + try/catch to `generate` mutation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/lifecycle.ts` - Added `withAIRetry` to `achieve` mutation

### Utilities
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/consolidation.ts` - Added `withAIRetry` to `extractPatternsFromSession`

## Success Criteria Met
- [x] `lib/utils/retry.ts` created with full implementation
- [x] `withRetry` function handles exponential backoff
- [x] `isRetryableError` correctly classifies errors
- [x] All 6 AI-calling files modified to use retry
- [x] TypeScript compiles without errors (in my files)
- [x] Jitter prevents thundering herd (randomized 10% factor)
- [x] Non-retryable errors fail immediately (400, 401, 403, 404)

## Implementation Details

### Retry Configuration (AI calls)
```typescript
{
  maxRetries: 3,
  baseDelayMs: 1000,      // 1 second base
  maxDelayMs: 30000,      // 30 second cap
  backoffMultiplier: 2,   // Exponential growth
  jitterFactor: 0.1       // 10% random variance
}
```

### Delay Progression
| Attempt | Base Delay | With Backoff | With Jitter (max) |
|---------|------------|--------------|-------------------|
| 1       | 1000ms     | 1000ms       | ~1100ms           |
| 2       | 1000ms     | 2000ms       | ~2200ms           |
| 3       | 1000ms     | 4000ms       | ~4400ms           |

### Retryable Status Codes
- 429: Rate limited
- 500: Internal server error
- 502: Bad gateway
- 503: Service unavailable
- 504: Gateway timeout
- 529: Anthropic overloaded

### Non-Retryable Status Codes
- 400: Bad request (validation)
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

## Exports

The retry utility exports:
```typescript
// Types
export interface RetryConfig { ... }

// Functions
export function withRetry<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>
export function withAIRetry<T>(fn: () => Promise<T>, options?: { operation?: string }): Promise<T>
export function isRetryableError(error: unknown): boolean
export function getErrorStatus(error: unknown): number | null
export function getErrorMessage(error: unknown): string
```

## Dependencies Used
- No external dependencies (pure TypeScript implementation)
- Uses native `setTimeout` for delays

## Patterns Followed
- Used lazy evaluation in arrow functions for retry calls
- Captured variables before closures to maintain TypeScript type narrowing
- Added try/catch blocks to files that were missing error handling (evolution.ts, visualizations.ts)
- Consistent operation naming: `{router}.{mutation}` format
- Follows existing import ordering (external, internal, relative)

## Integration Notes

### Exports for Other Builders
- `withAIRetry` - Pre-configured wrapper for Anthropic API calls
- `withRetry` - Generic retry for custom configurations
- `isRetryableError` - Error classification for custom handlers
- `getErrorStatus` - Status code extraction
- `getErrorMessage` - Error message extraction

### Import Pattern
```typescript
import { withAIRetry } from '@/lib/utils/retry';
```

### Usage Pattern
```typescript
const response = await withAIRetry(
  () => client.messages.create(config),
  { operation: 'operationName' }
);
```

### Logging
Retry attempts are logged via `console.warn` with:
- Operation name
- Retry attempt number
- Delay in milliseconds
- HTTP status code (if available)
- Error message

Example output:
```
[reflection.create] Retry 1 after 1050ms: Status 429 - Rate limit exceeded
[reflection.create] Retry 2 after 2180ms: Status 429 - Rate limit exceeded
```

### Coordination with Builder 3
Builder 3 is adding structured logging with Pino. The retry utility uses `console.warn` for retry logs. When integrated:
1. Integrator may optionally update retry logging to use `aiLogger.warn`
2. Current `console.warn` approach works and is non-blocking

### Potential Conflicts
None expected - retry wrapping is additive to existing code.

## Challenges Overcome

### TypeScript Type Narrowing in Closures
When wrapping API calls in arrow functions for `withAIRetry`, TypeScript's type narrowing doesn't persist inside closures. Solved by capturing narrowed values into local variables before the closure:

```typescript
// Before (TypeScript error)
if (input.initialMessage) {
  await withAIRetry(() =>
    client.messages.create({
      messages: [{ content: input.initialMessage }]  // Error: string | undefined
    })
  );
}

// After (works)
if (input.initialMessage) {
  const message = input.initialMessage;  // Capture narrowed value
  await withAIRetry(() =>
    client.messages.create({
      messages: [{ content: message }]  // OK: string
    })
  );
}
```

### Missing Error Handling
`evolution.ts` and `visualizations.ts` had no try/catch around AI calls. Added proper error handling with `TRPCError` to maintain consistent error responses.

## Testing Notes

### Manual Testing
To test retry behavior:
1. Temporarily lower rate limits or mock API errors
2. Check console for retry log messages
3. Verify backoff timing approximates expected delays

### Unit Tests
Builder 4 is responsible for creating unit tests at:
`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/retry.test.ts`

Test cases should cover:
- Success on first try
- Retry on 429, 500, 502, 503, 504, 529 errors
- No retry on 400, 401, 403, 404 errors
- Exponential backoff timing
- Jitter application
- Max retries exhaustion
- Network error handling

## MCP Testing Performed
N/A - This is server-side infrastructure code that doesn't require browser-based testing.

---

**Document Status:** COMPLETE
