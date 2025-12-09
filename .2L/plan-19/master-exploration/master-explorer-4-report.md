# Master Exploration Report

## Explorer ID
master-explorer-4

## Focus Area
Scalability & Performance

## Vision Summary
Transform Mirror of Dreams from a 7.2/10 codebase to a production-hardened 9+/10 system, with specific focus on performance optimization, database scalability, and error handling patterns.

---

## Performance Analysis

### Current Performance Architecture

#### 1. React Query / tRPC Caching Strategy

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/providers/TRPCProvider.tsx`

**Current Implementation:**
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
    },
  },
})
```

**Assessment:**
- **GOOD:** 5-minute stale time reduces API calls
- **GOOD:** Window focus refetch ensures fresh data on tab return
- **CONCERN:** No `gcTime` (garbage collection time) configured - defaults to 5 minutes
- **CONCERN:** No query-specific cache configurations (AI responses could benefit from longer cache times)
- **RECOMMENDATION:** Configure operation-specific cache durations:
  - User profile: 5 minutes (current)
  - Reflections list: 10 minutes (stable data)
  - AI-generated content: 30+ minutes (expensive to regenerate)
  - Dashboard stats: 5 minutes

#### 2. Code Splitting Analysis

**Dynamic Imports:** NONE FOUND

**Current State:**
- Searched for `dynamic import` and `React.lazy` patterns - no results
- All 24 pages using Framer Motion import it directly
- Heavy components like `MirrorExperience.tsx`, `EvolutionModal.tsx`, `CreateDreamModal.tsx` are statically imported

**Bundle Impact Files Using Framer Motion (24 files):**
- `app/onboarding/page.tsx`
- `app/page.tsx` (landing)
- `components/landing/LandingHero.tsx`
- `components/ui/glass/AnimatedBackground.tsx`
- `components/ui/glass/GlassCard.tsx`
- `app/reflection/MirrorExperience.tsx`
- And 18 more components

**Concern:** Framer Motion (~45KB gzipped) is likely included in initial bundle for all routes.

**Recommendation Priority: MEDIUM**
- Implement route-based code splitting with Next.js dynamic imports
- Lazy load modals (CreateDreamModal, EvolutionModal, PayPalCheckoutModal)
- Consider `next/dynamic` with `ssr: false` for animation-heavy components

#### 3. Server vs Client Component Usage

**Assessment:**
- 32 files found with `'use client'` directive in `/app` directory
- All page components are client components (appropriate for interactive dashboard app)
- Root layout (`app/layout.tsx`) is correctly a server component

**Pattern:** Appropriate for the application type. No immediate concerns.

#### 4. Image Optimization

**Current State:**
- **NO** usage of `Image from 'next/image'` detected (grep returned 0 files)
- `next.config.js` has empty `images.domains` array
- Application appears to use CSS backgrounds and SVG illustrations primarily

**Recommendation:**
- If user-uploaded images are planned, implement Next.js Image optimization
- Current state is acceptable for illustration-based design

---

## Database Scalability Analysis

### Current Index Coverage

**Total Indexes Found:** 80+ indexes across migrations

**Well-Indexed Tables:**

| Table | Indexed Columns | Assessment |
|-------|-----------------|------------|
| users | email, tier, subscription_status, current_month_year, is_demo | GOOD |
| reflections | user_id, created_at, is_premium, tone, tags (GIN), dream_id, rating | GOOD |
| dreams | user_id, status, created_at, target_date, category, (user_id, status) composite | GOOD |
| clarify_sessions | user_id, status, updated_at, last_message_at | GOOD |
| clarify_messages | session_id, created_at | GOOD |
| evolution_reports | user_id, created_at, report_type, dream_id | GOOD |

**Missing Index Opportunities:**
1. `reflections.user_feedback` - No index for feedback queries in admin
2. `users.paypal_subscription_id` - Added in migration but verify existence
3. `clarify_patterns` - Has indexes for user_id, type, strength, session

### N+1 Query Pattern Analysis

**CRITICAL N+1 FOUND in `/server/trpc/routers/dreams.ts` (lines 240-263):**

```typescript
// If includeStats, get reflection counts for each dream
if (input.includeStats && data) {
  const dreamsWithStats = await Promise.all(
    data.map(async (dream) => {
      const { count: reflectionCount } = await supabase
        .from('reflections')
        .select('*', { count: 'exact', head: true })
        .eq('dream_id', dream.id);

      const { data: lastReflection } = await supabase
        .from('reflections')
        .select('created_at')
        .eq('dream_id', dream.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      // ...
    })
  );
}
```

**Impact:** For a user with 5 dreams, this executes:
- 1 query for dreams
- 5 queries for reflection counts
- 5 queries for last reflection
- **Total: 11 queries instead of 1-2**

**Fix:** Use Supabase aggregate query or PostgreSQL window function:
```sql
SELECT d.*,
  COUNT(r.id) as reflection_count,
  MAX(r.created_at) as last_reflection_at
FROM dreams d
LEFT JOIN reflections r ON r.dream_id = d.id
WHERE d.user_id = $1
GROUP BY d.id
```

**Similar N+1 in `/server/trpc/routers/evolution.ts`:**
- `checkEvolutionEligibility` function (line 537-583) queries per dream
- Cross-dream evolution grouping could be optimized

### Write Pattern Analysis

**Usage Tracking Write Pattern:**
- Monthly counters on `users` table
- `usage_tracking` table for historical data
- `api_usage_log` for AI call tracking

**Concern:** Every reflection/AI call does:
1. Read user
2. Update `reflection_count_this_month`
3. Update `reflections_today`
4. Update `last_reflection_date`
5. Update `total_reflections`
6. Update `last_reflection_at`

**Potential Optimization:** Consider batching counter updates or using database triggers.

---

## Error Handling Patterns Analysis

### tRPC Error Handling

**Total Error Handlers:** 133 `catch/throw new TRPCError` occurrences across 12 router files

**Error Codes Used:**
- `UNAUTHORIZED` - Auth failures
- `FORBIDDEN` - Permission/limit violations
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Database/API failures
- `PRECONDITION_FAILED` - Threshold not met

**Pattern Assessment:**

**GOOD:**
- Consistent use of TRPCError with appropriate codes
- Custom error messages for user-facing errors
- Zod schema validation provides automatic input validation errors

**CONCERN - Swallowed Errors in Clarify Router:**

```typescript
// server/trpc/routers/clarify.ts lines 348-350
} catch {
  // Continue without AI response if generation fails
}
```

This silently swallows AI errors. While graceful degradation is good, no logging occurs.

**MISSING:**
- No global error boundary components (`app/error.tsx` does not exist)
- No route-level error boundaries
- No Sentry or error monitoring integration

### AI API Error Handling

**Location:** `/server/trpc/routers/reflection.ts`

**Current Pattern:**
```typescript
try {
  const client = getAnthropicClient();
  const response = await client.messages.create(requestConfig);
  // ...
} catch (error: unknown) {
  console.error('Claude API error:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Failed to generate reflection: ${message}`,
  });
}
```

**Assessment:**
- Basic error logging with `console.error`
- Error message propagated to user
- **MISSING:** Retry logic for transient failures
- **MISSING:** Circuit breaker pattern
- **MISSING:** Rate limit detection from Anthropic API

### Retry Logic Assessment

**Current State:**
```typescript
// hooks/useAuth.ts:34
retry: 1,
```

**Only 1 retry configuration found** - in auth query.

**Missing Retry Patterns:**
1. AI API calls (Anthropic) - no retries
2. PayPal API calls - no retries
3. Database operations - no retries
4. Email sending - no retries

**Recommendation Priority: HIGH**
Implement exponential backoff for:
- AI API calls (important - can fail due to rate limits)
- Payment webhooks (critical - may fail due to network issues)

---

## Scalability Concerns

### AI Call Patterns

**Current Architecture:**
- Synchronous AI calls in request/response cycle
- No queuing mechanism
- No rate limiting on AI endpoint

**AI Operations Found:**

| Operation | Location | Max Tokens | Thinking Budget |
|-----------|----------|------------|-----------------|
| Reflection | reflection.ts | 4000-6000 | 5000 (premium) |
| Clarify Chat | clarify.ts | 1500 | 0 |
| Evolution | evolution.ts | 4000 | tier-based |
| Visualization | visualizations.ts | 3000 | tier-based |

**Concern:**
- Long-running AI calls (5-15 seconds) block user requests
- No queue for handling burst traffic
- No worker pattern for background processing

**Recommendation:**
- Consider implementing job queue (BullMQ + Redis) for AI operations
- Return immediate acknowledgment, poll for completion
- Alternatively: leverage Vercel's serverless function timeout (10s hobby, 60s pro)

### Rate Limiting Strategy

**Current State:**
- Rate limit configuration EXISTS in constants but NOT ACTIVATED
- Vision document explicitly mentions "Activate existing rate limit configuration"

**Location:** `/lib/utils/constants.ts` has tier limits but no rate limiting middleware

**What Exists:**
```typescript
export const DAILY_LIMITS = {
  free: Infinity,
  pro: 1,
  unlimited: 2,
} as const;
```

**What's Missing:**
- Per-IP rate limiting for auth endpoints
- Global API rate limiting middleware
- Rate limit headers in responses
- Rate limit detection in client

### Redis Usage

**Package installed:** `@upstash/redis` in package.json

**Current Usage:** NONE FOUND in codebase (grep returned no matches)

**Redis is available but unused.** Opportunity for:
- Session storage (instead of JWT in localStorage)
- Rate limiting state
- Queue backing store
- Cache layer for AI responses

### Multi-Region Considerations

**Current State:**
- Single Supabase database instance
- Vercel deployment (automatic edge routing)
- No explicit multi-region configuration

**For Scale:**
- Supabase supports read replicas (pro plan)
- Consider Edge Config for global rate limit coordination
- CDN caching for static assets (Vercel provides this)

---

## Complexity Assessment

### What Can Be Done Incrementally

**Quick Wins (1-2 hours each):**
1. Add `app/error.tsx` global error boundary
2. Configure query-specific cache durations
3. Add retry configuration to useAuth and other queries
4. Fix N+1 in dreams.list with JOIN query

**Medium Effort (4-8 hours each):**
1. Implement dynamic imports for heavy components
2. Add retry logic wrapper for AI API calls
3. Activate rate limiting middleware
4. Add Sentry integration for error monitoring

### What Requires Dedicated Iteration

**Iteration-Level Work:**

| Work Item | Complexity | Reason |
|-----------|------------|--------|
| Queue system for AI | HIGH | Requires BullMQ setup, worker pattern, UI polling |
| JWT to httpOnly cookies | MEDIUM-HIGH | Auth flow changes, CSRF tokens, testing |
| Comprehensive test suite | HIGH | Infrastructure setup + writing tests |
| Database query optimization | MEDIUM | N+1 fixes, new indexes, query batching |

---

## Performance Recommendations

### Priority 1: Quick Fixes (No iteration needed)

1. **Fix N+1 Query in Dreams List**
   - Replace Promise.all loop with single JOIN query
   - Impact: 5-10x reduction in queries for dreams page
   - Effort: 2-3 hours

2. **Add Global Error Boundary**
   - Create `app/error.tsx`
   - Graceful error recovery with retry option
   - Effort: 1-2 hours

3. **Configure React Query Per-Operation**
   - AI responses: 30 minute staleTime
   - User stats: 5 minute staleTime
   - Effort: 1 hour

### Priority 2: Incidental Improvements

4. **AI Retry Logic**
   - Wrap Anthropic calls with exponential backoff
   - Max 3 retries, 1s -> 2s -> 4s delays
   - Effort: 3-4 hours

5. **Dynamic Imports for Modals**
   - `CreateDreamModal`, `EvolutionModal`, `PayPalCheckoutModal`
   - Effort: 2-3 hours

### Priority 3: Iteration-Level Work

6. **Error Monitoring (Sentry)**
   - Full implementation with source maps
   - Performance monitoring
   - Effort: 4-6 hours (could be single task in iteration)

7. **Rate Limiting Activation**
   - Middleware implementation
   - Per-user and per-IP limits
   - Rate limit headers
   - Effort: 6-8 hours

8. **Queue System for AI**
   - BullMQ + Redis
   - Worker processes
   - UI polling/webhooks
   - Effort: 16-24 hours (likely own iteration)

---

## Test Coverage Analysis

### Current Tests Found

**Only 2 test files exist:**
1. `/server/lib/__tests__/paypal.test.ts` - PayPal client unit tests (Vitest)
2. `/server/trpc/__tests__/middleware.test.ts` - Middleware logic tests (Jest)

**No Tests For:**
- tRPC routers (integration)
- React components
- E2E flows
- AI generation mocks
- Database operations

**Test Infrastructure:**
- `package.json` has placeholder: `"test": "echo 'Tests would go here'"`
- Vitest and Jest both partially configured (mixed setup)

---

## Summary Metrics

| Category | Current State | Target | Gap |
|----------|---------------|--------|-----|
| Query Caching | Basic (5min global) | Per-operation | SMALL |
| Code Splitting | None | Route-based + modals | MEDIUM |
| Error Boundaries | None | Global + route-level | MEDIUM |
| AI Retry Logic | None | Exponential backoff | MEDIUM |
| N+1 Queries | Present in dreams.list | Fixed with JOINs | SMALL |
| Rate Limiting | Config exists, not active | Active middleware | MEDIUM |
| Error Monitoring | None | Sentry + alerts | MEDIUM |
| Queue System | None | BullMQ for AI | LARGE |
| Test Coverage | 2% | 70%+ | LARGE |

---

## Notes & Observations

1. **Redis is installed but unused** - Significant opportunity for caching and rate limiting
2. **Error handling is inconsistent** - Some routes swallow errors, others propagate with detail
3. **AI calls are synchronous** - Works for current scale but will become bottleneck
4. **Excellent index coverage** - Database schema is well-designed for queries
5. **Bundle size likely inflated** - Framer Motion in 24 files without code splitting
6. **No image optimization** - Acceptable for current CSS-based design

---

*Exploration completed: 2024-12-10*
*This report informs master planning decisions for performance, scalability, and error handling*
