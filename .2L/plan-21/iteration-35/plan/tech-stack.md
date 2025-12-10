# Technology Stack

## Core Framework

**Decision:** Next.js 14.2.x with App Router (existing)

**Rationale:**
- Already in use, no changes needed
- App Router required for Sentry's Next.js integration
- Server Components support for efficient error capture

## Error Monitoring

**Decision:** @sentry/nextjs ^8.x

**Rationale:**
- Official Sentry SDK specifically designed for Next.js
- Supports App Router, Server Components, and Edge Runtime
- Automatic source map upload for meaningful stack traces
- Built-in integration with Vercel deployment
- Replays and performance monitoring available but optional

**Alternatives Considered:**
- LogRocket: More expensive, less mature Next.js integration
- Bugsnag: Good but Sentry has better open-source ecosystem
- Custom logging: Insufficient for production error tracking

**Implementation Notes:**
- Client, server, and edge configs required (3 files)
- instrumentation.ts hook for server-side initialization
- next.config.js wrapper with withSentryConfig

## Rate Limiting

**Decision:** @upstash/ratelimit with circuit breaker pattern (existing + enhancement)

**Rationale:**
- Already implemented, proven reliable
- Circuit breaker pattern addresses fail-open security issue
- In-memory state acceptable for Vercel serverless

**Circuit Breaker Configuration:**
- Failure threshold: 5 consecutive failures
- Recovery timeout: 30 seconds
- Half-open requests: 3 test requests before full recovery

**Alternatives Considered:**
- Redis-stored circuit breaker state: More complex, cross-instance coordination
- Fail-open with alerting only: Security risk, rejected

## Configuration Validation

**Decision:** Zod schema validation with singleton pattern

**Rationale:**
- Zod already in dependencies (^3.25.76)
- Type-safe validation with inference
- Clear error messages for missing/invalid variables
- Graceful degradation for optional features (payments, email, etc.)

**Schema Organization:**
- Required variables: Must be valid or app fails to start
- Feature groups: PayPal, Email, Redis - validate as groups
- Optional variables: Have sensible defaults

## Authentication Enhancement

**Decision:** Explicit JWT error type handling

**Rationale:**
- `jwt.verify()` already checks expiry but errors are silently caught
- Distinguish between TokenExpiredError, JsonWebTokenError, NotBeforeError
- Improved logging helps debugging authentication issues

**Implementation Notes:**
- No changes to JWT creation (30-day expiry for users, 7-day for demo)
- Only enhanced error handling and logging in context.ts
- Same pattern applied to clarify stream route

## Testing

**Decision:** Vitest (existing) with expanded coverage

**Rationale:**
- Already configured with good coverage infrastructure
- Fast execution, good TypeScript support
- @vitest/coverage-v8 for coverage reporting

**Coverage Targets:**
| Module | Target |
|--------|--------|
| server/lib/config.ts | 90% |
| server/lib/rate-limiter.ts | 85% |
| JWT expiry handling | 80% |

## Dependencies to Add

```bash
npm install @sentry/nextjs
```

**Version:** Latest stable (^8.x as of 2025)

## Environment Variables

### New Required Variables (Production)

| Variable | Purpose | Example |
|----------|---------|---------|
| `SENTRY_DSN` | Server-side Sentry connection | `https://xxx@xxx.ingest.sentry.io/xxx` |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side Sentry connection | Same as SENTRY_DSN |
| `SENTRY_ORG` | Sentry organization slug | `your-org-slug` |
| `SENTRY_PROJECT` | Sentry project name | `mirror-of-dreams` |
| `SENTRY_AUTH_TOKEN` | For source map uploads | `sntrys_xxx` |

### Existing Variables (Now Validated)

| Variable | Validation | Required |
|----------|------------|----------|
| `SUPABASE_URL` | Must be valid URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Min 20 characters | Yes |
| `JWT_SECRET` | Min 32 characters | Yes |
| `ANTHROPIC_API_KEY` | Must start with `sk-ant-` | Yes |
| `PAYPAL_*` | Group validation | No (feature disabled if incomplete) |
| `GMAIL_*` | Group validation | No (feature disabled if incomplete) |
| `UPSTASH_*` | Group validation | No (rate limiting disabled if incomplete) |

## Dependencies Overview

**Existing (no changes):**
- `zod` ^3.25.76 - Schema validation
- `jsonwebtoken` ^9.0.2 - JWT handling
- `@upstash/ratelimit` ^2.0.7 - Rate limiting
- `@upstash/redis` ^1.35.0 - Redis client
- `pino` ^10.1.0 - Logging

**Adding:**
- `@sentry/nextjs` ^8.x - Error monitoring

## Build & Deploy

**Build Tool:** Next.js build (existing)

**Deployment Target:** Vercel (existing)

**Sentry Integration:**
- Source maps uploaded automatically during build
- Release tracking via VERCEL_GIT_COMMIT_SHA
- Hidden from client bundles (hideSourceMaps: true)

## Performance Targets

No changes to existing targets. Sentry additions:
- Client bundle increase: < 50KB gzipped
- Error capture latency: < 100ms (async, non-blocking)
- Sampling rate: 10% for traces in production

## Security Considerations

**Rate Limiter Fail-Closed:**
- All requests rejected when Redis unavailable
- Circuit breaker prevents cascade failures
- User-friendly error message ("Service temporarily unavailable")

**Config Validation:**
- Secrets never logged (only validation errors)
- JWT_SECRET minimum length enforced (32 chars)
- API key format validation (prefix checks)

**Sentry:**
- User PII limited to id and email
- Stack traces sanitized before upload
- Auth errors (401/403) not reported (not bugs)

## File Structure Changes

```
mirror-of-dreams/
├── server/
│   └── lib/
│       ├── config.ts           # NEW: Centralized config validation
│       └── rate-limiter.ts     # MODIFIED: Circuit breaker
├── sentry.client.config.ts     # NEW: Client-side Sentry
├── sentry.server.config.ts     # NEW: Server-side Sentry
├── sentry.edge.config.ts       # NEW: Edge runtime Sentry
├── instrumentation.ts          # NEW: Next.js instrumentation hook
├── next.config.js              # MODIFIED: Sentry wrapper
├── app/
│   ├── error.tsx               # MODIFIED: Sentry capture
│   ├── global-error.tsx        # MODIFIED: Sentry capture
│   ├── dashboard/error.tsx     # MODIFIED: Sentry capture
│   ├── dreams/error.tsx        # MODIFIED: Sentry capture
│   ├── clarify/error.tsx       # MODIFIED: Sentry capture
│   └── reflection/error.tsx    # MODIFIED: Sentry capture
└── .env.example                # MODIFIED: New variables
```
