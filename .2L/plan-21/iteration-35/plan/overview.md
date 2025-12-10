# 2L Iteration Plan - Security & Observability (Iteration 35)

## Project Vision

Transform Mirror of Dreams from a functionally complete application into a production-hardened system with enterprise-grade security and observability. This iteration addresses critical security vulnerabilities (fail-open rate limiting, silent JWT expiry), adds centralized configuration validation, and integrates Sentry for comprehensive error monitoring.

## Success Criteria

Specific, measurable criteria for completion:

- [ ] Rate limiter rejects requests when Redis is unavailable (fail-closed with circuit breaker)
- [ ] JWT expiry errors are explicitly handled with distinct error types logged
- [ ] All environment variables validated at startup with clear error messages
- [ ] Sentry captures all unhandled errors with user context and route information
- [ ] All 6 error boundary files report errors to Sentry with appropriate tags
- [ ] Circuit breaker recovers automatically after Redis becomes available
- [ ] Test coverage maintained at 80%+ for all modified modules
- [ ] All existing tests pass (with updates for fail-closed behavior)
- [ ] No regressions in authentication flow

## MVP Scope

**In Scope:**
- Rate limiter fail-closed behavior with circuit breaker pattern
- Centralized configuration validation using Zod schemas
- Explicit JWT expiry handling with specific error types
- Sentry integration for Next.js 14 App Router (client, server, edge)
- Error boundary updates for Sentry reporting
- tRPC error formatter with Sentry capture
- Comprehensive test coverage for all changes

**Out of Scope (Post-MVP):**
- Redis-persisted circuit breaker state (using in-memory for initial implementation)
- Sentry performance monitoring/tracing (error monitoring only for now)
- Session replay features
- Custom Sentry dashboards and alerts
- Health check endpoint for circuit breaker status (can be added later)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - Estimated 4-6 hours (3 parallel builders)
4. **Integration** - Estimated 30 minutes
5. **Validation** - Estimated 30 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 4-6 hours (parallel builders)
- Integration: 30 minutes
- Validation: 30 minutes
- Total: ~5-7 hours

## Risk Assessment

### High Risks

**Risk: Fail-Closed Breaking User Experience**
- Impact: All requests blocked if Redis fails immediately after deployment
- Mitigation: Circuit breaker pattern with recovery timeout (30s), thorough testing, staged rollout
- Monitoring: Sentry alerts on circuit breaker events

**Risk: Sentry SDK Bundle Size Impact**
- Impact: Could increase client bundle significantly
- Mitigation: Tree shaking enabled, replays disabled initially, use sampling

### Medium Risks

**Risk: Test Updates Breaking CI**
- Impact: CI fails due to changed expected behavior (fail-open to fail-closed)
- Mitigation: Atomic commits with code + test updates together, thorough local testing

**Risk: Configuration Validation Breaking Deployment**
- Impact: Missing env vars in production could prevent startup
- Mitigation: Graceful degradation for optional features, clear error messages, .env.example updates

**Risk: Circuit Breaker State in Serverless**
- Impact: Per-instance state means each Vercel function instance has independent circuit breaker
- Mitigation: Acceptable for initial implementation - short-lived instances reset naturally

### Low Risks

**Risk: JWT Error Handling Affecting Auth Flow**
- Impact: Users could be logged out unexpectedly
- Mitigation: Only logging changes, actual behavior remains the same (invalid = null user)

## Integration Strategy

1. **Builder-1 (Config + JWT)** completes first as foundation
2. **Builder-2 (Rate Limiter)** and **Builder-3 (Sentry)** can work in parallel
3. All builders update tests atomically with code changes
4. Integration phase merges all changes and runs full test suite
5. Manual verification of key flows: auth, rate limiting, error capture

### Shared Dependencies
- `server/lib/config.ts` - New file, no conflicts expected
- `server/trpc/trpc.ts` - Builder-3 modifies errorFormatter
- `next.config.js` - Builder-3 adds Sentry wrapper

### Potential Conflict Areas
- `server/trpc/middleware.ts` - Builder-2 may modify error messages
- Test files - Each builder owns their test updates

## Deployment Plan

1. **Pre-deployment Checklist:**
   - All tests passing
   - Sentry DSN and tokens configured in Vercel environment
   - .env.example updated with all new variables
   - Manual smoke test in development

2. **Deployment Steps:**
   - Deploy to staging/preview environment first
   - Verify Sentry receives test errors
   - Verify rate limiting works with fail-closed
   - Monitor for any circuit breaker activations

3. **Post-deployment Verification:**
   - Check Sentry dashboard for initial errors
   - Verify no auth issues reported
   - Monitor rate limiter logs for circuit breaker events

4. **Rollback Plan:**
   - If critical issues: revert to previous deployment
   - If circuit breaker too aggressive: adjust thresholds via env vars (future enhancement)
