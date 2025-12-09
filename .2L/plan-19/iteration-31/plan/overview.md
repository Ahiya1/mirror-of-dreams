# Iteration 31: Error Monitoring & Resilience - Overview

**Created:** 2025-12-10
**Plan:** 19
**Iteration:** 31
**Focus:** Error Boundaries, Retry Logic, Structured Logging

---

## Executive Summary

This iteration adds resilience and error monitoring infrastructure to the Mirror of Dreams application. The exploration phase identified critical gaps: zero error boundaries exist, 35+ console.error statements lack structure, and all 8 AI API call locations have no retry logic. Users currently see crashes or generic errors when transient failures occur.

This plan implements:
1. **Error Boundaries** - Graceful React error handling with recovery
2. **Retry Logic** - Exponential backoff for AI API calls
3. **Structured Logging** - Server-side logger replacing console.error
4. **Error UI** - Client-side error display improvements

**Scope Exclusion:** Sentry integration is excluded from this iteration (requires account setup and external configuration).

---

## Current State Analysis

### Critical Findings from Exploration

| Category | Current State | Risk Level |
|----------|---------------|------------|
| Error Boundaries | Zero exist | CRITICAL |
| AI Retry Logic | None implemented | HIGH |
| Console.error Usage | 35+ server, 8 client | MEDIUM |
| Error Recovery | No automatic retry | HIGH |
| Structured Logging | None | MEDIUM |

### AI API Calls Without Resilience

| Location | Purpose | Risk |
|----------|---------|------|
| `reflection.ts:create` | Generate reflections | HIGH - Core feature |
| `clarify.ts:createSession/sendMessage` | Clarify conversations | HIGH - Core feature |
| `evolution.ts:generateDreamEvolution` | Evolution reports | MEDIUM |
| `visualizations.ts:generate` | Narrative visualizations | MEDIUM |
| `lifecycle.ts:achieve` | Achievement ceremonies | LOW |
| `consolidation.ts:extractPatternsFromSession` | Pattern extraction | LOW |
| `api/clarify/stream/route.ts` | SSE streaming | HIGH - User-facing |

### Error Categories

1. **Transient (Retryable):**
   - 429: Rate limit exceeded
   - 529: API overloaded
   - 503: Service unavailable
   - Network timeouts
   - Connection errors

2. **Permanent (Non-retryable):**
   - 401: Invalid API key
   - 400: Bad request
   - 404: Resource not found
   - Validation errors

---

## Goals & Success Criteria

### Primary Goals

1. **Error Boundaries**
   - Global error boundary catches unhandled React errors
   - Route-level error boundaries for critical paths
   - Users see friendly error UI instead of blank screen
   - Recovery actions available (retry, go home)

2. **Retry Logic**
   - Exponential backoff for AI calls (base: 1s, max: 30s)
   - 3 retry attempts for transient errors
   - Jitter to prevent thundering herd
   - Clear error classification (retryable vs permanent)

3. **Structured Logging**
   - Server-side logger with log levels (error, warn, info)
   - Context-aware logging (operation, service, userId)
   - Replace console.error in tRPC routers
   - JSON format for future log aggregation

4. **Error UI Improvements**
   - Client-side error states in key components
   - Consistent error messaging patterns
   - Test coverage for retry utility

### Success Metrics

- [ ] `app/error.tsx` and `app/global-error.tsx` exist and function
- [ ] Route error boundaries for `/reflection`, `/clarify`, `/dashboard`
- [ ] Retry utility with exponential backoff implemented
- [ ] All 8 AI API call locations use retry wrapper
- [ ] Logger module with error/warn/info levels created
- [ ] 20+ console.error statements replaced in routers
- [ ] TypeScript compiles with no errors
- [ ] Unit tests for retry logic pass

---

## Architecture Decisions

### 1. Error Boundary Strategy

**Decision:** Use Next.js 14 App Router error boundary conventions

- `app/error.tsx` - Route segment error boundary
- `app/global-error.tsx` - Root layout error boundary
- Route-specific boundaries for critical paths

**Rationale:** Native Next.js pattern, automatic error catching, built-in reset mechanism.

### 2. Retry Implementation

**Decision:** Custom retry utility (no external dependencies)

**Location:** `lib/utils/retry.ts`

**Configuration:**
```typescript
{
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1
}
```

**Rationale:** Full control over behavior, matches existing patterns, no additional dependencies.

### 3. Logging Strategy

**Decision:** Use `pino` for server-side structured logging

**Location:** `server/lib/logger.ts`

**Why Pino:**
- Extremely fast (10x faster than Winston)
- JSON output by default
- Built-in log levels
- Minimal footprint
- Easy to integrate with future log services

### 4. Error Classification

**Decision:** Utility function to classify Anthropic errors

```typescript
function isRetryableError(error: unknown): boolean
function getErrorCode(error: unknown): string
function formatErrorMessage(error: unknown): string
```

---

## Builder Assignment

| Builder | Focus Area | Complexity |
|---------|------------|------------|
| Builder 1 | Error Boundaries | Medium |
| Builder 2 | Retry Logic | Medium |
| Builder 3 | Structured Logging | Medium |
| Builder 4 | Error UI + Tests | Low-Medium |

### Dependencies

```
Builder 1 (Error Boundaries) - Independent
Builder 2 (Retry Logic) - Independent
Builder 3 (Structured Logging) - Independent
Builder 4 (Error UI + Tests) - Depends on Builder 2 (retry utility for tests)
```

**Execution Strategy:** Builders 1-3 can run in parallel. Builder 4 waits for Builder 2.

---

## Files to Create

| File | Builder | Purpose |
|------|---------|---------|
| `app/error.tsx` | 1 | Route segment error boundary |
| `app/global-error.tsx` | 1 | Root layout error boundary |
| `app/reflection/error.tsx` | 1 | Reflection route error boundary |
| `app/clarify/error.tsx` | 1 | Clarify route error boundary |
| `app/dashboard/error.tsx` | 1 | Dashboard route error boundary |
| `components/error/ErrorFallback.tsx` | 1 | Reusable error UI component |
| `lib/utils/retry.ts` | 2 | Retry utility with exponential backoff |
| `server/lib/logger.ts` | 3 | Pino logger configuration |
| `lib/utils/__tests__/retry.test.ts` | 4 | Unit tests for retry |
| `server/lib/__tests__/logger.test.ts` | 4 | Unit tests for logger |

## Files to Modify

| File | Builder | Changes |
|------|---------|---------|
| `server/trpc/routers/reflection.ts` | 2, 3 | Add retry wrapper, replace console.error |
| `server/trpc/routers/clarify.ts` | 2, 3 | Add retry wrapper, replace console.error |
| `server/trpc/routers/evolution.ts` | 2, 3 | Add retry wrapper, add try/catch |
| `server/trpc/routers/visualizations.ts` | 2, 3 | Add retry wrapper, add try/catch |
| `server/trpc/routers/lifecycle.ts` | 2, 3 | Add retry wrapper, replace console.error |
| `server/trpc/routers/auth.ts` | 3 | Replace console.error |
| `server/trpc/routers/subscriptions.ts` | 3 | Replace console.error |
| `server/trpc/routers/dreams.ts` | 3 | Replace console.error |
| `lib/clarify/consolidation.ts` | 2, 3 | Add retry wrapper, replace console.error |
| `server/trpc/context.ts` | 3 | Replace console.error |
| `server/lib/paypal.ts` | 3 | Replace console.error |
| `server/lib/email.ts` | 3 | Replace console.error |
| `package.json` | 3 | Add pino dependency |

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Retry storms during outage | Medium | High | Jitter + exponential backoff |
| Extended latency from retries | Medium | Medium | Max delay cap (30s) |
| Breaking AI call patterns | Low | High | Thorough testing |
| Logger import issues | Low | Low | Consistent import pattern |

### Integration Risks

| Risk | Mitigation |
|------|------------|
| Error boundary styling mismatch | Use existing design system (glass, cosmic) |
| Type conflicts with retry wrapper | Generic TypeScript implementation |
| Logger breaking existing flows | Wrapper that mimics console interface |

---

## Out of Scope

The following are explicitly excluded from this iteration:

1. **Sentry Integration** - Requires external account setup
2. **Circuit Breaker Pattern** - Can be added in future iteration
3. **Distributed Retry State** - Not needed at current scale
4. **PayPal Retry Logic** - Different error patterns, lower priority
5. **Client-Side Logging** - Focus on server-side first

---

## Timeline Estimate

| Phase | Estimated Duration |
|-------|-------------------|
| Builder 1 (Error Boundaries) | 1-2 hours |
| Builder 2 (Retry Logic) | 2-3 hours |
| Builder 3 (Structured Logging) | 1-2 hours |
| Builder 4 (Error UI + Tests) | 1-2 hours |
| Integration | 30 minutes |
| Validation | 30 minutes |

**Total Estimated:** 6-10 hours of builder work

---

## Validation Criteria

After all builders complete:

1. **TypeScript Compilation**
   - `npm run build` succeeds with no errors
   - No type warnings related to new code

2. **Runtime Verification**
   - Error boundaries render when errors thrown
   - Retry logic executes on simulated failures
   - Logger outputs structured JSON

3. **Test Coverage**
   - Retry utility tests pass
   - Logger tests pass
   - No regressions in existing tests

4. **Visual Verification**
   - Error UI matches design system
   - Recovery buttons function correctly

---

## Notes for Builders

1. **Design System Compliance**
   - Error UI must use cosmic/glass design patterns
   - Reference `styles/variables.css` for colors
   - Use existing GlowButton component for actions

2. **TypeScript Strict Mode**
   - All new files must be fully typed
   - No `any` types except where unavoidable
   - Explicit return types on functions

3. **Import Patterns**
   - Use `@/` alias for imports
   - Follow existing import ordering (external, internal, relative)

4. **Testing**
   - Use vitest (already configured in project)
   - Reference `test/mocks/anthropic.ts` for mock patterns

---

**Plan Status:** READY FOR BUILDING
