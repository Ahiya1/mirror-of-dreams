# Master Exploration Report

## Explorer ID
master-explorer-4

## Focus Area
Scalability & Performance Considerations

## Vision Summary
Plan-4 focuses on fixing broken core reflection functionality, removing excessive visual decoration, and establishing restraint while delivering genuine transformation through a working AI reflection system.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 6 must-have features
- **User stories/acceptance criteria:** 28 acceptance criteria across 6 features
- **Estimated total work:** 8-12 hours

### Complexity Rating
**Overall Complexity: MEDIUM**

**Rationale:**
- **Limited scope**: Plan-4 is intentionally restrained - fixing core issues, not adding features
- **Performance-critical fix**: Broken reflection API (400 errors) must be debugged and resolved
- **UI simplification**: Removing complexity rather than adding it
- **Single-user focus**: Ahiya is primary user; not optimizing for scale yet
- **Local development**: No production deployment concerns in this iteration

---

## Performance Bottlenecks Analysis

### 1. Anthropic API Integration (HIGH PRIORITY)

**Current Issue:**
- `reflection.create` mutation returns 400 errors
- Blocking core user flow (users cannot complete reflections)

**Performance Impact:**
- **User-facing latency**: Claude Sonnet 4.5 API calls take 3-8 seconds for 4000-6000 token responses
- **Timeout risk**: No explicit timeout configured in API calls
- **Failed requests**: Current 400 errors mean 100% failure rate
- **No retry logic**: Single-attempt API calls with no fallback

**Root Cause Hypotheses:**
```typescript
// server/trpc/routers/reflection.ts:91-104
const requestConfig: any = {
  model: 'claude-sonnet-4-5-20250929',
  temperature: 1,
  max_tokens: shouldUsePremium ? 6000 : 4000,
  system: systemPromptWithDate,
  messages: [{ role: 'user', content: userPrompt }],
};

if (shouldUsePremium) {
  requestConfig.thinking = {
    type: 'enabled' as const,
    budget_tokens: 5000,
  };
}
```

**Likely Issues:**
1. **Schema mismatch**: Input validation may not match database schema (has_date/dream_date fields)
2. **API key configuration**: ANTHROPIC_API_KEY may not be properly loaded in production
3. **Middleware error**: `usageLimitedProcedure` may be rejecting requests before they reach API
4. **Model name change**: Claude model identifiers may have changed

**Performance Recommendations:**
- **Add request timeout**: 30 seconds max for API calls
- **Implement retry logic**: 2 retries with exponential backoff (1s, 3s delays)
- **Add circuit breaker**: After 5 consecutive failures, pause and alert
- **Cache responses**: Consider caching system prompts (avoid regenerating on every request)
- **Monitor latency**: Track P50, P95, P99 response times
- **Streaming consideration**: For Plan-5+, implement streaming responses for better perceived performance

**Acceptance Criteria for Fix:**
- ✅ 100% success rate on reflection creation
- ✅ Response time P95 < 10 seconds
- ✅ Graceful error handling with user-friendly messages
- ✅ Proper logging of API failures for debugging

---

### 2. Database Query Performance (MEDIUM PRIORITY)

**Current State:**
- Supabase PostgreSQL (local instance on port 54331)
- 5 tables: users, dreams, reflections, evolution_reports, visualizations
- Proper indexes exist on frequently queried columns

**N+1 Query Issues Identified:**

```typescript
// server/trpc/routers/dreams.ts:241-264
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

**Performance Impact:**
- For 5 dreams: 5 + 5 = **10 separate queries**
- For 20 dreams (premium user): **40 queries** for a single dashboard load
- Each query has ~10-30ms latency (local), ~50-150ms latency (production)
- Dashboard load time: Currently ~200ms local, could be **2-6 seconds** in production with 20 dreams

**Optimization Strategy:**
```sql
-- Recommended: Single query with aggregation
SELECT
  d.*,
  COUNT(r.id) as reflection_count,
  MAX(r.created_at) as last_reflection_at
FROM dreams d
LEFT JOIN reflections r ON d.id = r.dream_id
WHERE d.user_id = $1 AND d.status = $2
GROUP BY d.id
ORDER BY d.created_at DESC;
```

**Estimated Performance Gain:**
- **Before**: 40 queries @ 50ms = 2000ms
- **After**: 1 query @ 100ms = 100ms
- **Improvement**: 20x faster (95% reduction)

**Recommendation for Plan-4:**
- **DEFER to Plan-5+**: Current single-user scenario (Ahiya) with <10 dreams = acceptable performance
- **Add TODO comment**: Flag this for future optimization when multi-user or >10 dreams per user
- **Monitor**: Track query counts in development logs

---

### 3. Frontend Rendering Performance (LOW PRIORITY)

**Current State:**
- Next.js 14 App Router with React 18.3.1
- Framer Motion animations (plan-4 removing excessive animations)
- 2,482 lines of TSX code across 19 page components
- Dashboard renders 6 cards with stagger animations

**Potential Issues:**

**a) Animation Overhead:**
```typescript
// app/dashboard/page.tsx:50-54
const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 150,
  duration: 800,
  triggerOnce: true,
});
```

**Performance Impact:**
- Framer Motion bundle: ~50KB gzipped
- Animation calculations: ~5-10ms per frame during 800ms animation
- **Plan-4 removes excessive animations**, so this becomes LESS of a concern

**b) Reflection Content Rendering:**
```typescript
// app/reflection/MirrorExperience.tsx:520-523
<div
  className="reflection-text"
  dangerouslySetInnerHTML={{ __html: reflection.aiResponse }}
/>
```

**Security & Performance Notes:**
- **XSS risk**: Using `dangerouslySetInnerHTML` with AI-generated content
- **Recommendation**: Sanitize HTML using DOMPurify library before rendering
- **Performance**: HTML parsing is fast (<5ms), not a bottleneck

**c) Bundle Size Analysis:**
```json
// Major dependencies:
"@anthropic-ai/sdk": "^0.52.0",      // ~120KB (server-only)
"@tanstack/react-query": "^5.90.5",  // ~45KB gzipped
"framer-motion": "^11.18.2",         // ~50KB gzipped
"next": "^14.2.0",                   // ~200KB framework overhead
```

**Total Client Bundle Estimate:** ~400-500KB gzipped
- **Acceptable** for modern web apps
- **No code-splitting**: All routes load full bundle
- **Recommendation for Plan-5+**: Implement dynamic imports for heavy components

**Plan-4 Performance Impact:**
- **Removing animations**: -50KB from bundle (if Framer Motion tree-shaken)
- **Simplifying UI**: Fewer DOM nodes = faster initial render
- **Estimated improvement**: 10-15% faster Time to Interactive (TTI)

---

### 4. Context Creation Overhead (LOW-MEDIUM PRIORITY)

**Current Implementation:**
```typescript
// server/trpc/context.ts:13-66
export async function createContext(opts: FetchCreateContextFnOptions) {
  const { req } = opts;
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  let user: User | null = null;

  if (token) {
    // JWT verification
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as JWTPayload;

    // Fetch fresh user data from database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    // Check if monthly usage needs reset
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    if (data.current_month_year !== currentMonthYear) {
      await supabase.from('users').update({ /* ... */ });
    }
    // ...
  }
}
```

**Performance Analysis:**
- **JWT verification**: ~1-2ms (fast, cryptographic operation)
- **Database query**: ~10-30ms (local), ~50-150ms (production)
- **Conditional update**: ~10-30ms (only once per month per user)
- **Total overhead**: ~20-60ms per request

**Issues:**
1. **Fresh fetch on every request**: No caching of user data
2. **Potential race condition**: Monthly reset check not atomic
3. **Unnecessary DB query**: User data in JWT but re-fetching anyway

**Optimization Opportunities:**
```typescript
// Recommended: Cache user data in JWT
interface JWTPayload {
  userId: string;
  tier: string;
  reflectionCountThisMonth: number;
  currentMonthYear: string;
  // Refresh token on usage updates or monthly
}
```

**Estimated Performance Gain:**
- **Before**: 50ms per request
- **After**: 2ms per request (JWT decode only)
- **Improvement**: 25x faster (96% reduction)

**Recommendation for Plan-4:**
- **DEFER**: Current implementation acceptable for single user
- **Add monitoring**: Log context creation time
- **Plan-5 optimization**: Implement JWT-based caching with selective refresh

---

## Scalability Concerns Assessment

### 1. Concurrent User Capacity

**Current Architecture:**
- Next.js serverless functions (tRPC endpoints)
- Supabase PostgreSQL with connection pooling
- Anthropic API rate limits (external dependency)

**Single User (Current State - Plan-4):**
- **Load**: 1 user (Ahiya)
- **Concurrent requests**: <5 simultaneous
- **Database connections**: 1-2 active
- **API rate limit**: Anthropic allows ~50 requests/minute on standard tier
- **Verdict**: NO SCALABILITY CONCERNS for Plan-4

**Future Scale Projections:**

**100 Users (Plan-6+):**
- **Concurrent requests**: ~10-20 simultaneous
- **Database connections**: 10-15 active (Supabase handles this)
- **Anthropic API**: 50-100 requests/hour (well within limits)
- **Verdict**: ACCEPTABLE with current architecture

**1,000 Users (Plan-8+):**
- **Concurrent requests**: ~100-200 simultaneous
- **Database connections**: 50-100 active (may need connection pool tuning)
- **Anthropic API**: 500-1000 requests/hour (need rate limiting queue)
- **Bottlenecks**:
  - Anthropic API rate limits (need request queuing with Redis)
  - Database connection pool exhaustion (upgrade Supabase tier)
  - Cold start latency on serverless functions (consider dedicated instances)
- **Verdict**: REQUIRES OPTIMIZATION (implement queue, caching, CDN)

**10,000+ Users (Plan-10+):**
- **Architecture changes needed**:
  - Redis-based request queue for Anthropic API
  - Database read replicas for analytics queries
  - CDN for static assets (already via Vercel)
  - Horizontal scaling of Next.js instances
  - Implement caching layers (Redis) for user sessions
- **Estimated infrastructure cost**: $500-2000/month
- **Verdict**: SIGNIFICANT REFACTORING REQUIRED

**Plan-4 Recommendation:**
- **No scaling work needed** - focus on fixing core functionality
- **Instrument for future**: Add logging/metrics to understand usage patterns
- **Defer scaling**: Revisit when approaching 100 active users

---

### 2. Data Volume Growth Projections

**Current Schema:**
```sql
-- reflections table: ~5KB per reflection (4000-6000 token AI responses)
-- dreams table: ~1KB per dream
-- users table: ~2KB per user
-- evolution_reports: ~10KB per report
-- visualizations: ~8KB per visualization
```

**Single User (Ahiya - Plan-4):**
- 30 reflections/month × 12 months = 360 reflections/year
- 360 × 5KB = **1.8MB per user per year**
- **Verdict**: NEGLIGIBLE storage concerns

**100 Users (Plan-6+):**
- Assume 10 reflections/user/month average
- 100 users × 10 reflections × 5KB = **5MB per month**
- 60MB per year
- **Verdict**: ACCEPTABLE - standard Supabase free tier handles this

**1,000 Users (Plan-8+):**
- 1000 users × 10 reflections × 5KB = **50MB per month**
- 600MB per year
- **Database size**: ~2GB after 3 years (still within free tier limits)
- **Verdict**: ACCEPTABLE with current architecture

**10,000 Users (Plan-10+):**
- 10,000 users × 10 reflections × 5KB = **500MB per month**
- 6GB per year, 18GB after 3 years
- **Database size**: Exceeds Supabase free tier (8GB limit)
- **Cost**: Supabase Pro tier ($25/month) or custom hosting
- **Optimizations needed**:
  - Archive old reflections to cold storage (S3)
  - Compress AI responses (gzip can reduce by 70%)
  - Implement reflection TTL (archive after 2 years)
- **Verdict**: REQUIRES PLANNING at 10K users

**Plan-4 Recommendation:**
- **No data optimization needed**
- **Add created_at indexes**: Already exist
- **Consider**: Add soft-delete pattern for future archiving

---

### 3. API Rate Limiting Strategy

**Current State:**
- **No client-side rate limiting**: Users can spam API
- **Usage limits in middleware**:
  ```typescript
  // server/trpc/middleware.ts (implied)
  // Free: 1 reflection/month
  // Essential: 5 reflections/month
  // Premium: 10 reflections/month
  ```

**Security & Performance Risks:**
1. **No per-IP rate limiting**: Malicious user could DOS with signup spam
2. **No exponential backoff**: Failed requests retry immediately
3. **No queue system**: All Anthropic requests fire immediately
4. **No circuit breaker**: API failures cascade to all users

**Anthropic API Limits (External Dependency):**
- **Rate limit**: 50 requests/minute (standard tier)
- **Token limit**: 40,000 tokens/minute input + output
- **Current usage**: ~1 request/reflection × 6000 tokens = well within limits for single user
- **At scale (1000 users)**: Could hit rate limits during peak hours

**Recommended Rate Limiting Strategy:**

**Phase 1 (Plan-4 - OPTIONAL):**
- **Add request logging**: Track API call frequency
- **Monitor usage**: Understand baseline before optimization
- **Defer implementation**: Single user doesn't need rate limiting yet

**Phase 2 (Plan-6 - 100 users):**
```typescript
// Add per-user rate limiting with Redis
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 requests per hour
});

// In middleware:
const { success } = await ratelimit.limit(ctx.user.id);
if (!success) {
  throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
}
```

**Phase 3 (Plan-8 - 1000 users):**
- **Implement queue system**: BullMQ with Redis for Anthropic API calls
- **Priority queue**: Premium users get faster processing
- **Retry logic**: Exponential backoff with jitter
- **Circuit breaker**: Pause queue on repeated API failures

**Plan-4 Recommendation:**
- **SKIP rate limiting** - single user, not a concern
- **ADD monitoring**: Log all Anthropic API calls with timestamps
- **Defer to Plan-6**: Implement rate limiting when approaching 50+ users

---

## Infrastructure Requirements

### Current Infrastructure

**Development Environment:**
- **Local machine**: Node.js 18.x
- **Supabase local**: PostgreSQL on port 54331
- **Environment variables**: ANTHROPIC_API_KEY, JWT_SECRET, Supabase config

**Production Environment (Not Yet Deployed):**
- **Hosting**: Vercel (implied from package.json)
- **Database**: Supabase cloud instance
- **API**: Anthropic cloud API
- **CDN**: Vercel Edge Network

**Plan-4 Infrastructure Needs:**
- ✅ **No changes required** - existing setup sufficient
- ⚠️ **Fix environment variable loading**: Ensure ANTHROPIC_API_KEY loads correctly
- ⚠️ **Add error logging**: Implement logging service (Sentry or LogRocket)

---

### Resource Sizing Recommendations

**Current State (Single User - Plan-4):**
```yaml
Database:
  Provider: Supabase (local dev, cloud prod)
  Tier: Free tier adequate
  Storage: <100MB
  Connections: 5-10 concurrent

API/Backend:
  Provider: Vercel Serverless
  Tier: Hobby (free) or Pro ($20/month)
  Memory: 1024MB per function
  Timeout: 10 seconds default (increase to 30s for Anthropic API)

External APIs:
  Anthropic: Standard tier ($0.003/1K input tokens, $0.015/1K output tokens)
  Estimated cost: $2-5/month for single user
```

**Future Scaling Projections:**

**100 Users (Plan-6):**
```yaml
Database:
  Tier: Supabase Free → Pro ($25/month)
  Storage: 1-5GB
  Connections: 50-100 concurrent
  Cost: $25/month

Backend:
  Tier: Vercel Pro ($20/month)
  Function executions: ~30K/month
  Cost: $20/month (included in tier)

Anthropic API:
  Usage: 1000 reflections/month × 6K tokens × $0.015/1K
  Cost: ~$90/month

Total: ~$135/month
```

**1,000 Users (Plan-8):**
```yaml
Database:
  Tier: Supabase Pro ($25/month) or Team ($599/month)
  Storage: 10-50GB
  Read replicas: 1 for analytics queries
  Cost: $25-599/month

Backend:
  Tier: Vercel Pro ($20/month)
  Function executions: ~300K/month
  Cost: $20/month + overages (~$50)

Anthropic API:
  Usage: 10K reflections/month × 6K tokens × $0.015/1K
  Cost: ~$900/month

Caching/Queue:
  Upstash Redis: ~$10-50/month

Total: ~$1,005-1,624/month
```

**Plan-4 Recommendation:**
- **Stay on free tiers** for development
- **Budget $30-50/month** for initial production (Vercel Pro + Anthropic usage)
- **Monitor costs**: Set billing alerts at $25, $50, $100

---

### Caching Strategy

**Current State:**
- **No caching implemented**
- React Query provides client-side cache (default 5 minutes stale time)
- No server-side cache

**Cacheable Data:**

**1. User Sessions (High Value):**
```typescript
// Current: DB query on every request (50ms overhead)
// Cached: JWT + Redis (2ms overhead)
// Cache duration: 15 minutes
// Invalidation: On user updates, monthly reset
// Estimated savings: 48ms × 1000 requests/day = 48 seconds/day
```

**2. System Prompts (Medium Value):**
```typescript
// Current: File read + template on every reflection (5ms)
// Cached: In-memory Map with LRU eviction
// Cache duration: 1 hour
// Estimated savings: 5ms × 100 reflections/day = 500ms/day
```

**3. Dream Lists (Low-Medium Value):**
```typescript
// Current: DB query on dashboard load (100ms with N+1 issue)
// Cached: Redis with user-scoped keys
// Cache duration: 5 minutes
// Invalidation: On dream create/update/delete
// Estimated savings: Only helpful at scale (100+ users)
```

**Plan-4 Recommendation:**
- **SKIP caching** - single user, premature optimization
- **Fix N+1 queries instead** - bigger impact than caching
- **Plan-6+**: Implement Redis caching for user sessions and frequently accessed data

---

## Deployment Complexity

### CI/CD Pipeline Requirements

**Current State:**
- **No CI/CD configured**
- Manual deployment via `npm run build` + `next start`
- No automated testing

**Plan-4 Requirements:**
- ✅ **Manual deployment acceptable** for single-user development
- ⚠️ **Add deployment checklist**:
  1. Run `npm run build` locally to verify
  2. Check environment variables in Vercel dashboard
  3. Test Anthropic API key in production
  4. Verify database migrations applied
  5. Test critical path (sign-in → create reflection)

**Future CI/CD (Plan-6+):**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/actions/deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

**Recommended Deployment Strategy:**
- **Plan-4**: Manual deployment via Vercel CLI
- **Plan-6**: Automated CI/CD with GitHub Actions
- **Plan-8**: Blue-green deployment with staging environment

---

### Rollback Procedures

**Current State:**
- **No rollback strategy**
- Database migrations are one-way (no down migrations)

**Risks:**
1. **Breaking schema change**: Migration breaks production app
2. **API regression**: Reflection creation fails after deployment
3. **Configuration error**: Environment variable missing

**Recommended Rollback Strategy:**

**Immediate (Plan-4):**
```bash
# Vercel rollback
vercel rollback <deployment-url>

# Database rollback (manual)
# Keep previous migration state in Git
psql $DATABASE_URL < previous_migration.sql
```

**Automated (Plan-6+):**
- **Database**: Implement reversible migrations with `down` scripts
- **Application**: Git-based rollback via Vercel dashboard (1-click)
- **Monitoring**: Automatic rollback on error rate spike (Vercel monitors + webhook)

**Plan-4 Recommendation:**
- **Create manual rollback checklist**
- **Test rollback in local environment** before first production deployment
- **Keep last 3 database backups** (Supabase auto-backup daily)

---

### Monitoring and Observability

**Current State:**
- **Console.log only**: No structured logging
- **No error tracking**: Errors disappear in console
- **No performance metrics**: No visibility into response times

**Critical Metrics to Track:**

**1. Application Health:**
- API error rate (target: <1%)
- API response time (P50, P95, P99)
- Successful reflection creation rate (target: >99%)

**2. External Dependencies:**
- Anthropic API success rate
- Anthropic API latency
- Database query performance

**3. User Experience:**
- Time to first reflection (target: <60 seconds)
- Dashboard load time (target: <2 seconds)
- Reflection generation time (target: <10 seconds)

**Recommended Tools:**

**Plan-4 (Minimal Monitoring):**
```typescript
// Add structured logging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

// Log Anthropic API calls
logger.info({
  event: 'anthropic_api_call',
  userId: ctx.user.id,
  duration: endTime - startTime,
  success: true,
  tokens: response.usage.total_tokens,
});
```

**Plan-6 (Production Monitoring):**
- **Error tracking**: Sentry ($26/month)
- **Performance monitoring**: Vercel Analytics (included in Pro)
- **Database metrics**: Supabase built-in dashboard

**Plan-8 (Advanced Observability):**
- **APM**: New Relic or Datadog (~$100/month)
- **Logging**: LogRocket or Logtail (~$50/month)
- **Alerts**: PagerDuty (~$25/month)

**Plan-4 Recommendation:**
- **Add console logging** for all Anthropic API calls
- **Set up Vercel error tracking** (free tier)
- **Defer paid tools** until Plan-6+

---

## Resource Optimization Strategies

### 1. Database Query Optimization

**High-Impact Optimizations:**

**Fix N+1 Query (Dreams List):**
```typescript
// BEFORE: 10-40 queries
const dreamsWithStats = await Promise.all(
  data.map(async (dream) => {
    const { count } = await supabase.from('reflections')...
    const { data: lastReflection } = await supabase.from('reflections')...
  })
);

// AFTER: 1 query
const { data: dreamsWithStats } = await supabase
  .rpc('get_dreams_with_stats', { user_id: userId, status: 'active' });

// Database function:
CREATE OR REPLACE FUNCTION get_dreams_with_stats(user_id UUID, status TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  -- ... all dream fields
  reflection_count BIGINT,
  last_reflection_at TIMESTAMPTZ
) AS $$
  SELECT
    d.*,
    COUNT(r.id) as reflection_count,
    MAX(r.created_at) as last_reflection_at
  FROM dreams d
  LEFT JOIN reflections r ON d.id = r.dream_id
  WHERE d.user_id = $1 AND d.status = $2
  GROUP BY d.id
  ORDER BY d.created_at DESC;
$$ LANGUAGE SQL STABLE;
```

**Performance Gain:** 20x faster (95% reduction in query time)

**Plan-4 Recommendation:** DEFER - Not critical for single user

---

**Add Missing Indexes:**
```sql
-- Check existing indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- Recommended indexes (most already exist from migrations)
CREATE INDEX CONCURRENTLY idx_reflections_user_created
  ON reflections(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_reflections_dream_created
  ON reflections(dream_id, created_at DESC);
```

**Plan-4 Recommendation:** VERIFY existing indexes are optimal

---

### 2. API Response Compression

**Current State:**
- Next.js automatically compresses responses (gzip/brotli)
- Anthropic API responses not compressed (plain text JSON)

**Optimization:**
```typescript
// Store compressed AI responses in database
import zlib from 'zlib';

// On save:
const compressed = zlib.gzipSync(aiResponse);
await supabase.from('reflections').insert({
  ai_response_compressed: compressed.toString('base64'),
  // ...
});

// On read:
const buffer = Buffer.from(data.ai_response_compressed, 'base64');
const aiResponse = zlib.gunzipSync(buffer).toString();
```

**Storage Savings:**
- Uncompressed: 5KB per reflection
- Compressed: ~1.5KB per reflection (70% reduction)
- For 1000 reflections: 3.5MB saved

**Plan-4 Recommendation:** DEFER - Storage not a concern yet

---

### 3. Lazy Loading & Code Splitting

**Current Bundle Analysis:**
```bash
# Run bundle analyzer
npm run build
# Check .next/static/chunks for bundle sizes
```

**Heavy Components to Split:**
```typescript
// app/reflection/MirrorExperience.tsx (large component)
// Recommendation: Dynamic import
import dynamic from 'next/dynamic';

const MirrorExperience = dynamic(
  () => import('@/components/reflection/MirrorExperience'),
  { loading: () => <CosmicLoader /> }
);
```

**Framer Motion Tree-Shaking:**
```typescript
// BEFORE: Import entire library
import { motion, AnimatePresence } from 'framer-motion';

// AFTER: Import only needed components
import { LazyMotion, domAnimation, m } from 'framer-motion';

// Use m instead of motion (smaller bundle)
<LazyMotion features={domAnimation}>
  <m.div>...</m.div>
</LazyMotion>
```

**Estimated Bundle Reduction:** 30-50KB (10% of total)

**Plan-4 Recommendation:** LOW PRIORITY - Plan-4 removes animations, reducing bundle naturally

---

### 4. Image & Asset Optimization

**Current State:**
- No user-uploaded images in Plan-4
- Static assets served via Vercel CDN
- No image optimization needed

**Future Considerations (Plan-6+):**
- User avatars: Use Next.js Image component with automatic optimization
- Dream images: Lazy load with blur placeholders
- Visualization assets: Generate on-demand, cache in CDN

**Plan-4 Recommendation:** NOT APPLICABLE

---

## Load Testing Requirements

### Performance Acceptance Criteria

**Plan-4 Targets (Single User):**

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Reflection creation (API call) | <10s P95 | Manual testing + console.time() |
| Dashboard load time | <2s | Chrome DevTools Network tab |
| Authentication | <1s | Manual testing |
| Page transitions | <500ms | Visual inspection |
| Error rate | <1% | Manual testing over 20 reflections |

**Testing Strategy for Plan-4:**
```bash
# Manual testing checklist
1. Sign in (measure time)
2. Load dashboard (check Network tab)
3. Create reflection with real API (measure time)
4. Verify reflection appears in dashboard
5. Repeat 10 times to check consistency
```

**Future Load Testing (Plan-6+):**
```javascript
// Using k6 load testing tool
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Sustain 10 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% of requests under 10s
    http_req_failed: ['rate<0.01'],     // Error rate <1%
  },
};

export default function() {
  // Test reflection creation
  const payload = JSON.stringify({
    dreamId: 'test-dream-id',
    dream: 'Test dream content...',
    // ...
  });

  const res = http.post('https://app.com/api/trpc/reflection.create', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 10000,
  });

  sleep(1);
}
```

**Plan-4 Recommendation:**
- **Manual testing sufficient** for single user
- **Document baseline metrics** for future comparison
- **Defer automated load testing** to Plan-6+

---

## Cost Optimization Opportunities

### Current Estimated Costs

**Plan-4 (Single User - Development):**
```
Vercel Hobby: $0/month (free tier)
Supabase Free: $0/month
Anthropic API: ~$3-5/month (30 reflections × $0.09 per reflection)
Total: ~$5/month
```

**Plan-6 (100 Users - Initial Launch):**
```
Vercel Pro: $20/month
Supabase Pro: $25/month
Anthropic API: ~$90/month (1000 reflections)
Upstash Redis: $10/month (caching)
Sentry: $26/month (error tracking)
Total: ~$171/month
Revenue needed: $171 / 100 users = $1.71/user/month to break even
```

**Plan-8 (1,000 Users - Growth Phase):**
```
Vercel Pro: $70/month (with overages)
Supabase Team: $599/month (or Pro $25 + read replica $100)
Anthropic API: ~$900/month (10,000 reflections)
Upstash Redis: $50/month
Sentry: $80/month
Total: ~$1,699/month
Revenue needed: $1.699/user/month to break even
```

### Cost Optimization Strategies

**1. Anthropic API (Largest Cost Driver):**

**Optimization Ideas:**
```typescript
// a) Token reduction - optimize prompts
// BEFORE: ~6000 tokens per reflection
const systemPrompt = `${basePrompt}\n\n${dateAwareness}\n\n${toneInstructions}`;

// AFTER: ~4000 tokens per reflection (33% reduction)
// Compress system prompt, remove redundancy
// Estimated savings: $900 → $600/month at 1K users (33% reduction)

// b) Tiered quality - use cheaper models for free tier
const model = shouldUsePremium
  ? 'claude-sonnet-4-5-20250929'  // $0.003/$0.015 per 1K tokens
  : 'claude-haiku-20250305';      // $0.0003/$0.0015 per 1K tokens (10x cheaper)
// Estimated savings: 50% of users on free tier = 45% cost reduction

// c) Caching - reuse system prompts
// Anthropic offers prompt caching (beta)
// Saves 90% on repeated system prompt tokens
// Estimated savings: 30-40% on total API costs
```

**2. Database Costs:**
```
Strategy: Stay on Supabase Pro ($25/month) as long as possible
- Optimize queries to reduce compute
- Archive old reflections to S3 ($0.023/GB/month)
- Use database functions to reduce round trips
Savings: Delay Team tier ($599) until 5K+ users = $574/month saved
```

**3. Infrastructure Costs:**
```
Strategy: Maximize free tiers and optimize resource usage
- Keep <100GB bandwidth on Vercel (included in Pro)
- Use Vercel Edge Functions for authentication (faster, cheaper)
- Implement aggressive caching to reduce database queries
Savings: Avoid overages = $50-100/month saved
```

**Plan-4 Recommendation:**
- **Track baseline costs** during development
- **Set billing alerts** at $10, $25, $50 thresholds
- **Optimize API usage** in Plan-5+ when costs matter

---

## Recommendations for Master Plan

### 1. **Prioritize Core Functionality Over Performance**
Plan-4 is correctly focused on **fixing broken reflection creation**, not on premature optimization. The 400 error blocking users is a functional bug, not a performance issue. Recommendation: Debug and fix reflection.create mutation as Priority 1.

### 2. **Instrument Before Optimizing**
Add basic logging to understand baseline performance:
```typescript
// Add to all critical paths
console.time('reflection_creation');
const result = await createReflection.mutate(...);
console.timeEnd('reflection_creation');

logger.info({
  event: 'reflection_created',
  duration: elapsed,
  userId: user.id,
  success: true,
});
```

### 3. **Defer Database Optimizations**
The N+1 query issue in dreams.list is real but not urgent:
- **Current**: 10 queries for 5 dreams = ~100ms (acceptable)
- **At scale**: 40 queries for 20 dreams = ~2s (problematic)
- **Recommendation**: Add TODO comment, fix in Plan-6 when approaching 50+ users

### 4. **Set Performance Budget**
Define acceptable thresholds to guide future optimization:
- Dashboard load: <2s
- Reflection creation: <10s
- API error rate: <1%
- Database query count: <20 per page load

### 5. **Plan for API Rate Limiting**
Anthropic API is external dependency with rate limits:
- **Plan-4**: Single user, no concerns
- **Plan-6**: Add monitoring and alerting
- **Plan-8**: Implement request queue with Redis

### 6. **Simplification Improves Performance**
Plan-4's focus on removing excessive animations and simplifying UI will naturally improve performance:
- Smaller bundle size (-50KB)
- Faster initial render (-10-15% TTI)
- Less JavaScript execution
- **This is the right approach** - simplify first, optimize later

---

## Technology Recommendations

### Monitoring & Observability (Plan-6+)

**Recommended Stack:**
```yaml
Error Tracking: Sentry ($26/month)
  - Captures all unhandled errors
  - Source maps for production debugging
  - User context and breadcrumbs

Performance Monitoring: Vercel Analytics (included in Pro)
  - Real User Monitoring (RUM)
  - Core Web Vitals tracking
  - API route performance

Logging: Pino + Axiom ($25/month)
  - Structured JSON logs
  - Fast, low overhead
  - Searchable in production

Alerting: Better Uptime ($10/month)
  - Uptime monitoring (1-minute checks)
  - API health checks
  - Slack/email notifications
```

**Total cost:** ~$61/month for production monitoring

---

### Caching Layer (Plan-7+)

**Recommended Stack:**
```yaml
Primary Cache: Upstash Redis ($10-50/month)
  - Serverless Redis (pay per request)
  - Low latency (<10ms)
  - Perfect for Vercel Edge

Cache Strategy:
  - User sessions: 15-minute TTL
  - Dream lists: 5-minute TTL
  - System prompts: 1-hour TTL
  - Invalidation: On mutations
```

---

### Database Optimization (Plan-8+)

**Recommended Approach:**
```sql
-- Read replica for analytics queries
-- Supabase Team tier: $599/month (includes 2 replicas)

-- Or DIY with separate Postgres instance
-- Fly.io Postgres: $50-100/month for dedicated instance

-- Query optimization tools
EXPLAIN ANALYZE <your-query>;
pg_stat_statements; -- Track slow queries
```

---

## Notes & Observations

### 1. Plan-4 Scope is Appropriately Restrained
The vision correctly focuses on **fixing broken functionality** rather than scaling for thousands of users. This is the right approach - build a working MVP for one user before optimizing for many.

### 2. Architecture is Fundamentally Sound
The Next.js + tRPC + Supabase + Anthropic stack is well-suited for this use case:
- **Pros**: Type-safe, serverless-friendly, modern, good DX
- **Cons**: Anthropic API latency, potential rate limits at scale
- **Verdict**: No architectural changes needed for Plan-4

### 3. Performance Bottlenecks are Known and Manageable
The primary performance issues (N+1 queries, no caching, context overhead) are well-understood and have clear solutions. None are urgent for Plan-4.

### 4. Biggest Risk is External Dependency
Anthropic API is a single point of failure:
- **Risk**: API downtime = no reflections possible
- **Mitigation**: Implement retry logic + circuit breaker
- **Future**: Consider fallback to OpenAI GPT-4 if Anthropic unavailable

### 5. Cost Structure is User-Friendly
At scale, primary cost is Anthropic API (~$0.09 per reflection). This aligns with value delivered:
- **Free tier**: 1 reflection/month = $0.09 cost (sustainable with ads/upgrades)
- **Premium tier**: 10 reflections/month = $0.90 cost (charge $5-10/month = profitable)

### 6. Simplification is a Performance Win
Plan-4's focus on removing animations and decorations will improve performance metrics across the board. This reinforces the vision's emphasis on restraint over flash.

### 7. Monitoring Gap is Biggest Risk
**Current**: No error tracking, no performance metrics, console.log only
**Risk**: Production issues invisible until users complain
**Recommendation**: Add basic Sentry integration before any production deployment

---

**Exploration completed:** 2025-11-27
**This report informs master planning decisions for Plan-4 scalability & performance**
