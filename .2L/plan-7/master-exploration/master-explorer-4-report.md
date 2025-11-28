# Master Exploration Report

## Explorer ID
master-explorer-4

## Focus Area
Scalability & Performance Considerations

## Vision Summary
Transform Mirror of Dreams from a functional reflection tool (6.5/10) into a complete, production-ready sanctuary (9/10) by adding critical missing pages (Profile, Settings, About, Pricing), creating a fully-populated demo user experience, and enhancing the reflection UX to feel beautiful and welcoming.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 10 must-have features across UX/content transformation
- **User stories/acceptance criteria:** 150+ acceptance criteria across all features
- **Estimated total work:** 60-80 hours (3-4 weeks at 20 hours/week)

### Complexity Rating
**Overall Complexity: MEDIUM-HIGH**

**Rationale:**
- **Primary focus is content/UX, not architectural changes:** 8 of 10 features are frontend-focused (landing page, forms, display enhancements, empty states)
- **Minimal backend changes required:** Only Profile/Settings need new tRPC mutations; existing API infrastructure sufficient
- **Demo user creation requires quality content generation:** 5 dreams, 12-15 realistic reflections with AI responses - content quality critical for stakeholder validation
- **Performance impact is low but critical to monitor:** Adding new pages/components increases bundle size; must stay within 30KB budget
- **Scalability concerns minimal for Plan-7:** This iteration focuses on completeness, not scale

---

## Performance Bottleneck Analysis

### Current Performance Baseline (from codebase analysis)

**Application Architecture:**
- **Stack:** Next.js 14 App Router, tRPC, React 18, Supabase PostgreSQL
- **Build size:** 361MB (.next directory) - CONCERN: Large build footprint
- **Component count:** 72 TypeScript components (app + components directories)
- **API endpoints:** 11 tRPC routers (3,092 total lines) - moderate complexity
- **Database:** PostgreSQL with 6 core tables (users, dreams, reflections, evolution_reports, visualizations, usage_tracking)

**Existing Performance Optimizations:**
- Server Components externalization for Anthropic SDK (reduces client bundle)
- Canvas module externalized (prevents client-side bundle bloat)
- React Query for client-side caching (@tanstack/react-query)
- Next.js automatic code splitting
- Framer Motion for animations (11.18.2) - 50KB+ overhead

**Known Performance Concerns:**
1. **Large dependency footprint:** Anthropic SDK, Canvas, Framer Motion, multiple UI libraries
2. **No caching layer:** No Redis/Upstash implementation detected in server code
3. **No CDN for static assets:** Package.json references Vercel deployment but no explicit CDN config
4. **Database queries not optimized:** No evidence of query optimization, connection pooling configuration
5. **Build size (361MB) suggests bloat:** Potential for optimization via dependency pruning

---

## Plan-7 Specific Performance Impacts

### 1. Landing Page Transformation (Feature #1)

**Performance Considerations:**
- **Screenshots/visuals of dashboard and reflections:**
  - Risk: Large image files (PNGs) could add 500KB-2MB to landing page
  - Recommendation: Use WebP format (70% smaller than PNG), lazy load below-fold images
  - Acceptance criteria requires <2s LCP - **implement with priority**
  - Mobile-first design requires responsive images (serve different sizes for mobile/desktop)

- **Responsive perfection requirement:**
  - Target: <2s LCP (Largest Contentful Paint)
  - Current concern: No baseline LCP measurement found in codebase
  - Action required: Implement Core Web Vitals monitoring (Next.js built-in or Vercel Analytics)

- **Bundle size impact:**
  - New landing page components: estimated +15-20KB (JSX + CSS)
  - Image optimization critical: use next/image with priority loading for hero
  - Social proof stats: fetch server-side (SSR) to avoid client-side hydration delay

**Specific Recommendations:**
```typescript
// Use Next.js Image component with priority
<Image
  src="/dashboard-screenshot.webp"
  alt="Dashboard"
  width={1200}
  height={800}
  priority
  quality={85}
  placeholder="blur"
/>

// Implement viewport-based lazy loading for below-fold images
<Image src="/reflection-output.webp" loading="lazy" />
```

---

### 2. Demo User Experience (Feature #4)

**Performance Considerations:**
- **Database seeding with 5 dreams, 12-15 reflections:**
  - Risk: Demo user queries could be slow without proper indexing
  - Current indexes: `idx_reflections_user_id`, `idx_dreams_user_id` exist (✓ GOOD)
  - Concern: Loading 12-15 reflections with full AI responses (each 500-2000 chars) on dashboard
  - Recommendation: Implement pagination on dashboard (show 3-5 most recent, not all 12-15)

- **Demo account auto-login performance:**
  - Session creation overhead: Supabase Auth + JWT generation
  - Recommendation: Pre-warm demo session (keep demo user session alive via cron job)
  - Alternative: Implement demo-specific lightweight auth bypass (no JWT for read-only demo)

- **Data reset mechanism:**
  - Vision allows for nightly reset OR read-only demo
  - Recommendation: **Read-only demo** (no reset overhead, simpler architecture)
  - Read-only = no writes to database, no session cleanup needed
  - Implementation: Frontend disables "Create Reflection" button, shows banner

**Database Query Optimization:**
```sql
-- Ensure demo user queries are indexed
CREATE INDEX IF NOT EXISTS idx_users_email_demo ON users(email) WHERE email = 'demo@mirrorofdreams.com';

-- Composite index for demo user dashboard query
CREATE INDEX IF NOT EXISTS idx_reflections_demo_recent
ON reflections(user_id, created_at DESC)
WHERE user_id = (SELECT id FROM users WHERE email = 'demo@mirrorofdreams.com');
```

---

### 3. Profile & Settings Pages (Features #2, #3)

**Performance Considerations:**
- **New tRPC mutations required:**
  - `updateUserProfile`, `changeEmail`, `changePassword`, `updatePreferences`, `deleteAccount`
  - Risk: Low - simple database UPDATE operations
  - Concern: No rate limiting detected in middleware
  - Recommendation: Add rate limiting to prevent abuse (especially `changePassword`)

- **Settings save immediately (no "Save" button):**
  - Risk: High mutation frequency if user toggles multiple settings
  - Recommendation: Implement debouncing (500ms delay) before firing mutation
  - Alternative: Optimistic UI updates with background sync (React Query supports this)

- **Usage statistics display:**
  - "This month: X/Y reflections created" requires query aggregation
  - Current schema: `users.reflection_count_this_month` (✓ GOOD - pre-calculated)
  - No additional query cost - already tracked via trigger

**Rate Limiting Implementation:**
```typescript
// Middleware for sensitive operations
import { rateLimit } from '@/server/lib/rate-limit';

export const rateLimitedProcedure = publicProcedure.use(async (opts) => {
  const identifier = opts.ctx.user?.id || opts.ctx.ip;
  const isAllowed = await rateLimit(identifier, {
    window: '15m',
    max: 10, // 10 password changes per 15 min
  });

  if (!isAllowed) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
  }

  return opts.next();
});
```

---

### 4. Enhanced Reflection Form (Feature #6)

**Performance Considerations:**
- **Auto-save indicator:** "Your words are safe"
  - Risk: Frequent auto-save mutations increase database writes
  - Current implementation: Not found in codebase (feature noted as "future")
  - Recommendation: Implement with 3-second debounce, localStorage fallback
  - Cost analysis: 1 reflection draft = ~2KB localStorage, no database write until submit

- **Character counter redesign:**
  - Current: Functional but not delightful (as per vision)
  - Performance impact: Negligible (pure client-side calculation)
  - Word count calculation: Use `text.split(/\s+/).length` (fast, <1ms for 4000 chars)

- **Tone selection enhancement:**
  - Hover states with cosmic glow (Framer Motion animations)
  - Risk: Low - CSS transforms + Framer Motion already in bundle
  - Recommendation: Respect `prefers-reduced-motion` (already in vision acceptance criteria ✓)

**No significant performance concerns for this feature.** Primarily CSS/animation enhancements.

---

### 5. Individual Reflection Display (Feature #7)

**Performance Considerations:**
- **AI response enhancement with highlighting:**
  - Pull quotes, key insights highlighted, action items bulleted
  - Risk: Markdown parsing overhead (react-markdown already in bundle from Plan-6)
  - Concern: Custom rendering for highlights requires additional parsing pass
  - Recommendation: Use remark plugins for efficient parsing (single-pass)

- **Reading experience optimizations:**
  - Max width 720px, line height 1.8 (CSS only - no performance impact)
  - Collapsed user reflections by default (reduces initial render size)
  - Good for performance: Lazy-load user's original Q&A (only render when expanded)

- **Metadata sidebar/footer:**
  - Word count: "342 thoughtful words"
  - Time spent reflecting: "12 minutes" (if tracked)
  - Concern: "Time spent" not currently tracked in database schema
  - Recommendation: Add `reflection_duration_seconds` column (future feature, skip for Plan-7)

**Markdown Parsing Optimization:**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkHighlights } from '@/lib/remark-highlights'; // Custom plugin

// Single-pass parsing with plugins
<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkHighlights]}
  components={{
    // Custom renderers for performance
    p: ({ children }) => <p className="mb-4">{children}</p>,
    strong: ({ children }) => <strong className="highlight-gold">{children}</strong>,
  }}
>
  {aiResponse}
</ReactMarkdown>
```

---

### 6. Empty State Enhancements (Feature #9)

**Performance Considerations:**
- **Illustrations:** Cosmic-themed SVG or subtle animations
  - Risk: Multiple SVG files add to bundle (each 5-15KB)
  - Recommendation: Inline critical SVGs (no HTTP request), lazy-load non-critical
  - Alternative: Use CSS-only cosmic effects (gradients, shadows) for zero bundle cost

- **Empty states across 5 pages:**
  - Dashboard (no dreams, no reflections)
  - Dreams page, Reflections page, Evolution page, Visualizations page
  - Impact: +10-15KB total (5 empty state components × 2-3KB each)

**No significant performance concerns.** Primarily static content and SVGs.

---

### 7. Reflection Collection Enhancements (Feature #10)

**Performance Considerations:**
- **Pagination:** 20 reflections per page
  - Current implementation: Already exists (as per Plan-6)
  - Database query: `LIMIT 20 OFFSET X` with `idx_reflections_created_at` index (✓ GOOD)
  - No optimization needed

- **Filters:** Dream, Tone, Date range
  - Risk: Multiple WHERE clauses without composite indexes
  - Current indexes: Separate indexes for `user_id`, `tone`, `created_at`
  - Recommendation: Add composite index for common filter combinations
  - Query pattern: `WHERE user_id = X AND tone = Y AND created_at > Z`

- **Search functionality (future enhancement noted):**
  - Full-text search across user answers and AI responses
  - Risk: HIGH - PostgreSQL full-text search on large text fields is slow without proper indexing
  - Recommendation: Implement GIN index with tsvector for search (not in Plan-7, defer to post-MVP)

**Composite Index for Filters:**
```sql
-- Optimize filtered queries
CREATE INDEX idx_reflections_user_filters
ON reflections(user_id, tone, created_at DESC);

-- For dream filter
CREATE INDEX idx_reflections_user_dream_created
ON reflections(user_id, dream_id, created_at DESC);
```

---

### 8. About & Pricing Pages (Features #5, #8)

**Performance Considerations:**
- **Static content pages:** No dynamic data, pure SSR
- **Founder photos:** Use next/image with optimization
- **Pricing tier comparison table:** Static data (no API calls)
- **FAQ section:** Accordion UI (minimal JavaScript)

**Impact: Negligible.** These are static marketing pages.

**Bundle size estimate:** +8-12KB total (2 pages × 4-6KB each)

---

## Scalability Assessment

### Database Scalability (Current State)

**Schema Analysis:**
- **6 core tables:** users, dreams, reflections, evolution_reports, visualizations, usage_tracking
- **Row-level security (RLS) enabled:** All tables have RLS policies (✓ GOOD for security, potential performance cost)
- **Indexes:** Good coverage (13+ indexes across tables)
- **Connection pooling:** Not explicitly configured (Supabase handles this by default)

**Current Scale Limits (estimated):**
- **Users:** 10,000-50,000 (before RLS performance degrades)
- **Reflections:** 500,000-1M (with current indexing)
- **Concurrent users:** 100-500 (Next.js serverless functions scale well)
- **Database connections:** 60-100 (Supabase free tier limit: 60, paid: 200+)

**Scalability Concerns for Plan-7:**
- Plan-7 adds **minimal database load** (1 demo user, 2 new pages with simple queries)
- No new complex queries introduced
- Profile/Settings mutations are low-frequency operations

**Recommendation:** No scalability changes needed for Plan-7. Current architecture sufficient for 1,000-10,000 users.

---

### Infrastructure Scalability

**Deployment Platform:**
- **Vercel** (inferred from package.json homepage and vercel.json)
- **Serverless functions:** Auto-scaling (no manual intervention needed)
- **Edge network:** Vercel Edge CDN for static assets (automatic)
- **Database:** Supabase PostgreSQL (managed, auto-scaling storage)

**Plan-7 Infrastructure Impact:**
- **No infrastructure changes required**
- New pages deploy as serverless functions (automatic)
- Static assets (images, SVGs) cached via Vercel CDN (automatic)

**Cost Implications:**
- Landing page with screenshots: +2-5MB static assets (within free tier)
- Demo user: 1 additional database user (negligible cost)
- Profile/Settings mutations: Low frequency (negligible function invocation cost)

**Recommendation:** Current infrastructure scales to 10,000+ users with zero changes.

---

### API Performance & Rate Limiting

**Current API Structure:**
- **11 tRPC routers:** 3,092 lines total (moderate complexity)
- **Anthropic API calls:** Reflection generation (main cost center)
- **Rate limiting:** `usageLimitedProcedure` middleware exists (tier-based reflection limits)

**Plan-7 API Impact:**
- **New mutations:** 5-7 profile/settings mutations (low cost, simple DB updates)
- **No new AI calls:** Demo user pre-populated (AI responses generated once, reused)
- **Landing page:** Static data only (no API calls)

**Rate Limiting Gaps:**
- **Missing:** Email verification, password reset, profile updates
- **Recommendation:** Add rate limiting to sensitive operations (10 requests/15 min)

**Anthropic API Cost Analysis (Demo User):**
- **One-time cost:** Generate 12-15 reflections × ~4,000 tokens = 48,000-60,000 tokens
- **Claude Sonnet 4.5 pricing:** ~$0.003/1K input tokens, ~$0.015/1K output tokens
- **Estimated cost:** $1.50-$3.00 one-time to generate demo content
- **Ongoing cost:** $0 (demo user read-only, no new AI calls)

---

## Performance Monitoring & Observability

### Current State (Gaps Identified)

**Missing:**
- **No performance monitoring detected** in codebase
- **No Core Web Vitals tracking:** LCP, FID, CLS metrics not captured
- **No error tracking:** No Sentry, Bugsnag, or equivalent integration
- **No API latency monitoring:** tRPC calls not instrumented
- **No database query performance tracking**

**Vision Requirements:**
- Landing page: <2s LCP (Largest Contentful Paint)
- Performance budget: LCP <2.5s, FID <100ms, Bundle <30KB increase

**Recommendations for Plan-7:**

1. **Add Core Web Vitals Monitoring:**
   - Use Next.js built-in `reportWebVitals` in `app/layout.tsx`
   - Send metrics to Vercel Analytics (free tier available)
   - Alternative: Google Analytics 4 (free, easy integration)

2. **Bundle Size Monitoring:**
   - Run `next build --profile` to analyze bundle impact
   - Use `@next/bundle-analyzer` to identify bloat
   - Acceptance criteria: <30KB increase for Plan-7

3. **API Performance:**
   - Add request timing to tRPC middleware
   - Log slow queries (>500ms) to console
   - Future: Integrate Upstash Analytics or Datadog

**Implementation Example:**
```typescript
// app/layout.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === 'web-vital') {
    // Send to analytics
    console.log(metric);

    // Track in Vercel Analytics
    window.va?.track('web-vitals', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }
}
```

---

## Caching Strategy Recommendations

### Current State
- **No caching layer implemented:** No Redis/Upstash usage detected
- **React Query client-side caching:** Exists (@tanstack/react-query in package.json)
- **Next.js ISR/SSG:** Not utilized (all pages appear to use SSR or CSR)

### Caching Opportunities for Plan-7

**1. Demo User Data Caching (HIGH PRIORITY):**
- Problem: Demo user dashboard loaded on every "See Demo" click
- Solution: Cache demo user data (dreams, reflections, evolution reports) in memory or Redis
- Expected impact: Reduce database queries from 3-5 queries to 0 (cache hit)
- TTL: 24 hours (demo data static)

```typescript
// server/lib/demo-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getDemoUserData() {
  const cached = await redis.get('demo-user-data');
  if (cached) return cached;

  // Fetch from database
  const data = await fetchDemoUserFromDB();

  // Cache for 24 hours
  await redis.set('demo-user-data', data, { ex: 86400 });
  return data;
}
```

**2. Landing Page Stats Caching:**
- "X reflections created, Y dreams achieved" stats
- Update: Hourly (acceptable staleness)
- Implementation: Next.js `revalidate` with ISR

```typescript
// app/page.tsx (landing page)
export const revalidate = 3600; // 1 hour

export async function generateMetadata() {
  const stats = await getGlobalStats(); // Cached via ISR
  return { title: `${stats.reflections} reflections created` };
}
```

**3. Profile/Settings NOT Cached:**
- Reason: User-specific, must be fresh
- Use React Query with staleTime: 0 (always refetch)

---

## Database Optimization Recommendations

### Query Performance Analysis

**High-Frequency Queries (Plan-7 adds these):**

1. **Dashboard query (demo user):**
   - Fetch: User, 5 dreams, 3 recent reflections, stats
   - Current: 3-4 separate queries (inefficient)
   - Optimization: Single JOIN query with `LEFT JOIN` for reflections

```sql
-- Optimized dashboard query
SELECT
  u.*,
  d.id as dream_id, d.title as dream_title, d.reflection_count,
  r.id as reflection_id, r.created_at as reflection_date,
  LEFT(r.ai_response, 200) as reflection_snippet
FROM users u
LEFT JOIN dreams d ON d.user_id = u.id AND d.status = 'active'
LEFT JOIN LATERAL (
  SELECT * FROM reflections
  WHERE dream_id = d.id
  ORDER BY created_at DESC
  LIMIT 3
) r ON true
WHERE u.email = 'demo@mirrorofdreams.com';
```

2. **Profile page usage stats:**
   - "This month: X/Y reflections created"
   - Current: Pre-calculated in `users.reflection_count_this_month` (✓ OPTIMAL)
   - No optimization needed

3. **Settings page mutations:**
   - Simple UPDATE operations on `users` table
   - Indexed by `id` (primary key) - already optimal

**Index Recommendations (Plan-7 specific):**

```sql
-- For demo user dashboard (if demo account used frequently)
CREATE INDEX idx_dreams_demo_active
ON dreams(user_id, status)
WHERE status = 'active';

-- For reflection filtering (Feature #10)
CREATE INDEX idx_reflections_user_tone_created
ON reflections(user_id, tone, created_at DESC);
```

---

## Bundle Size Analysis & Optimization

### Current Bundle Concerns
- **Build size: 361MB** (likely includes source maps, dev artifacts)
- **Production bundle:** Not measured (Lighthouse audit needed)
- **Dependencies:** Heavy (Anthropic SDK, Canvas, Framer Motion)

### Plan-7 Bundle Impact Estimate

**New Components:**
1. Landing page: +15KB (hero, features, footer)
2. Profile page: +8KB (forms, stats display)
3. Settings page: +10KB (tabbed interface, toggles)
4. About page: +5KB (static content)
5. Pricing page: +6KB (tier table, FAQ)
6. Empty states (5 components): +10KB
7. Reflection form enhancements: +5KB (micro-copy, counter redesign)
8. Individual reflection display enhancements: +8KB (markdown plugins, highlights)
9. Reflection collection filters: +4KB
10. Demo user components: +3KB (banner, auto-login)

**Total estimate: +74KB (raw, uncompressed)**
**Compressed (gzip): ~25-30KB** (within 30KB budget ✓)

**Optimization Strategies:**

1. **Code splitting:**
   - Lazy-load Profile/Settings pages (not critical for landing)
   - Use `next/dynamic` for heavy components

```typescript
// Lazy-load Settings page
const SettingsPage = dynamic(() => import('./settings/SettingsContent'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Client-only if no SEO needed
});
```

2. **Tree-shaking unused Framer Motion features:**
   - Only import specific animations, not entire library
   - Use `framer-motion/dist/framer-motion.cjs` for smaller bundle

3. **Image optimization:**
   - Convert all screenshots to WebP (70% size reduction)
   - Use `next/image` with automatic optimization
   - Lazy-load below-fold images

4. **Remove unused dependencies:**
   - Audit with `depcheck` (find unused packages)
   - Consider removing `canvas` if not used (52KB)

---

## Load Testing & Performance Acceptance Criteria

### Plan-7 Success Metrics

**Vision Success Criteria (Performance-related):**

1. **Landing Page Converts: 8/10**
   - Metric: <2s LCP (Largest Contentful Paint)
   - Acceptance: Lighthouse Performance score >90
   - Test: Run Lighthouse on landing page (desktop + mobile)

2. **Demo User Shows Full Value: 10/10**
   - Metric: Dashboard loads in <1.5s (demo user cached)
   - Test: Measure TTFB (Time to First Byte) + Hydration time
   - Target: TTFB <500ms, Hydration <1s

3. **Profile & Settings Pages Complete: 9/10**
   - Metric: Mutation response time <300ms
   - Test: Measure tRPC mutation latency (updateProfile, changePassword)
   - Target: p95 latency <500ms

4. **Reflection Experience Welcoming: 8/10**
   - Metric: Form interactions feel instant (<100ms response)
   - Test: Measure character counter update latency
   - Target: <50ms (pure client-side, should be instant)

5. **Overall Product Quality: 9/10**
   - Metric: Zero pages with >3s LCP
   - Metric: FID (First Input Delay) <100ms across all pages
   - Test: Real User Monitoring (RUM) via Vercel Analytics

**Load Testing Recommendations:**

1. **Demo user stress test:**
   - Simulate 100 concurrent users clicking "See Demo"
   - Tools: k6, Artillery, or Vercel Load Testing
   - Success: <2s response time at p95

2. **Profile/Settings mutation stress test:**
   - 50 users updating preferences simultaneously
   - Success: No database connection errors, <500ms p95 latency

3. **Database connection limit test:**
   - Verify Supabase connection pooling under load
   - Monitor: Active connections during peak load
   - Alert if >80% of connection pool utilized

---

## Infrastructure Recommendations

### Current Infrastructure (Analysis)
- **Hosting:** Vercel (serverless, auto-scaling)
- **Database:** Supabase PostgreSQL (managed)
- **CDN:** Vercel Edge Network (automatic)
- **Caching:** None (React Query client-side only)

### Plan-7 Infrastructure Needs

**No changes required for MVP.** Current infrastructure scales to 10,000+ users.

**Future optimizations (post-Plan-7):**

1. **Add Redis caching layer:**
   - Provider: Upstash (serverless Redis, free tier: 10K requests/day)
   - Use cases: Demo user data, landing page stats, session storage
   - Cost: $0-$10/month (free tier sufficient for MVP)

2. **Implement CDN for images:**
   - Vercel Edge Network already handles this automatically
   - Ensure `next/image` used for all images (automatic optimization)

3. **Database read replicas (future):**
   - When: >50,000 users, >5M reflections
   - Provider: Supabase read replicas (paid feature)
   - Cost: ~$25/month for 1 replica

4. **API rate limiting (implement now):**
   - Use Upstash Rate Limit (serverless)
   - Protect: Password reset, email verification, profile updates
   - Cost: Included in Upstash Redis free tier

---

## Cost Optimization Analysis

### Current Cost Structure (Estimated)
- **Vercel hosting:** $0-$20/month (free tier → Hobby plan)
- **Supabase database:** $0-$25/month (free tier → Pro plan)
- **Anthropic API:** Variable ($0.50-$5.00/user/month depending on reflection frequency)
- **Total:** $0.50-$50/month (depends on scale)

### Plan-7 Cost Impact

**One-time costs:**
- Demo user AI generation: $1.50-$3.00 (12-15 reflections)
- Landing page images (if stock photos): $0-$50 (can use free alternatives)

**Recurring costs (monthly):**
- Additional serverless function invocations: +5-10% (negligible, within free tier)
- Database storage: +50KB (demo user data) - negligible
- CDN bandwidth: +2-5MB (landing page images) - within free tier

**Total Plan-7 cost impact: ~$2-$5 one-time, <$1/month recurring**

**Cost Optimization Recommendations:**

1. **Optimize Anthropic API usage:**
   - Demo user: Generate once, reuse (✓ already in vision)
   - Reflection generation: Use caching for similar prompts (future)
   - Monitor token usage via `api_usage_log` table (already exists ✓)

2. **Lazy-load heavy components:**
   - Profile/Settings pages (not needed on landing)
   - Evolution/Visualization pages (advanced features)
   - Saves serverless function invocations for unused routes

3. **Image optimization:**
   - Use WebP format (70% bandwidth savings)
   - Serve responsive images (mobile gets smaller version)
   - Estimated savings: 50-70% bandwidth reduction

---

## Monitoring & Alerting Setup

### Required Monitoring (Plan-7)

**1. Core Web Vitals (REQUIRED for acceptance criteria):**
- Metric: LCP <2.5s, FID <100ms, CLS <0.1
- Tool: Vercel Analytics (free) or Google Analytics 4
- Setup: 30 minutes (integrate `reportWebVitals`)

**2. Error Tracking (RECOMMENDED):**
- Tool: Sentry (free tier: 5K events/month)
- Monitor: API errors, client-side crashes, mutation failures
- Setup: 1 hour (install SDK, configure source maps)

**3. API Latency (RECOMMENDED):**
- Metric: p50, p95, p99 latency for tRPC mutations
- Tool: Custom logging → Vercel Logs or Datadog
- Setup: 2 hours (add middleware timing)

**4. Database Performance (NICE-TO-HAVE):**
- Metric: Query duration, connection pool utilization
- Tool: Supabase Dashboard (built-in)
- Setup: 0 minutes (already available)

**Alerting Thresholds:**
- LCP >3s on landing page → Slack alert
- API error rate >5% → Email alert
- Database connections >80% → PagerDuty alert (future)

---

## Risk Assessment

### High Risks

**RISK: Demo user dashboard slow to load (>2s)**
- **Impact:** Stakeholders/visitors abandon before seeing value
- **Likelihood:** MEDIUM (12-15 reflections with full AI responses = heavy payload)
- **Mitigation:**
  1. Implement caching (Redis or in-memory) for demo user data
  2. Paginate reflections on dashboard (show 3-5, not all 12-15)
  3. Lazy-load below-fold content (evolution reports, visualizations)
  4. Use `React.lazy` + `Suspense` for heavy components
- **Recommendation:** Implement caching in Iteration 1 (Demo User creation phase)

**RISK: Landing page images cause slow LCP (>3s on mobile)**
- **Impact:** Fails acceptance criteria, poor conversion rate
- **Likelihood:** HIGH (screenshots of dashboard = 500KB-2MB unoptimized)
- **Mitigation:**
  1. Convert all images to WebP format (use `cwebp` tool)
  2. Use `next/image` with `priority` flag for hero image
  3. Lazy-load screenshots below fold
  4. Serve responsive images (mobile gets 800px width, desktop gets 1600px)
  5. Test with Lighthouse on 3G throttling
- **Recommendation:** Implement image optimization in Phase 1 (Landing Page)

**RISK: Bundle size exceeds 30KB budget**
- **Impact:** Slower page loads, fails acceptance criteria
- **Likelihood:** MEDIUM (10 new features = potential for bloat)
- **Mitigation:**
  1. Run `next build --profile` after each phase
  2. Use `@next/bundle-analyzer` to identify heavy imports
  3. Lazy-load non-critical pages (Profile, Settings, About)
  4. Tree-shake Framer Motion (import specific features only)
  5. Remove unused dependencies (audit with `depcheck`)
- **Recommendation:** Monitor bundle size weekly during development

---

### Medium Risks

**RISK: Profile/Settings mutations slow (>500ms)**
- **Impact:** Poor user experience, perceived lag
- **Likelihood:** LOW (simple UPDATE queries, indexed by primary key)
- **Mitigation:**
  1. Add database query timing logs
  2. Monitor p95 latency via tRPC middleware
  3. Implement optimistic UI updates (React Query mutation)
  4. Add loading states to all mutation buttons
- **Recommendation:** Acceptable risk, monitor in QA phase

**RISK: Anthropic API timeout during demo user generation**
- **Impact:** Demo user incomplete, blocks stakeholder validation
- **Likelihood:** LOW (12-15 sequential API calls, each ~10-30s)
- **Mitigation:**
  1. Generate demo content in separate script (not during deployment)
  2. Implement retry logic with exponential backoff
  3. Use batch API if available (Anthropic Message Batches API)
  4. Pre-generate content locally, seed database manually
- **Recommendation:** Generate demo content via script in Phase 1

**RISK: Database connection pool exhaustion under load**
- **Impact:** API errors, failed mutations, user lockout
- **Likelihood:** LOW (Supabase handles pooling, Plan-7 adds minimal load)
- **Mitigation:**
  1. Monitor active connections in Supabase Dashboard
  2. Implement connection pooling in tRPC context (PgBouncer)
  3. Use read replicas for demo user queries (future)
  4. Alert if >80% pool utilization
- **Recommendation:** Monitor during load testing (Phase 7)

---

### Low Risks

**RISK: Empty state SVGs increase bundle size**
- **Impact:** Slight increase in page load time
- **Likelihood:** LOW (5 SVGs × 5-10KB each = 25-50KB total)
- **Mitigation:**
  1. Inline critical SVGs (no HTTP request overhead)
  2. Use CSS-only cosmic effects where possible (gradients, shadows)
  3. Lazy-load SVGs below fold
  4. Optimize SVGs with SVGO (30-50% size reduction)
- **Recommendation:** Acceptable, include in bundle size monitoring

**RISK: Reflection form enhancements cause animation jank**
- **Impact:** Poor user experience, feels sluggish
- **Likelihood:** LOW (Framer Motion well-optimized, respects reduced motion)
- **Mitigation:**
  1. Test on low-end devices (throttle CPU in Chrome DevTools)
  2. Respect `prefers-reduced-motion` (already in acceptance criteria)
  3. Use CSS transforms (GPU-accelerated) instead of JS animations
  4. Debounce character counter updates (every 100ms, not every keystroke)
- **Recommendation:** Test during Phase 4 (Reflection Form Enhancements)

---

## Recommendations for Master Plan

### 1. **Prioritize Performance from Day 1**
- **Action:** Set up Core Web Vitals monitoring in Phase 1 (before building features)
- **Reason:** Acceptance criteria requires <2s LCP - measure early, measure often
- **Implementation:** Add `reportWebVitals` to `app/layout.tsx`, integrate Vercel Analytics

### 2. **Implement Demo User Caching in Phase 1**
- **Action:** Add Redis caching (Upstash) for demo user data before building landing page
- **Reason:** Demo user is critical path for stakeholder validation - must load fast (<1.5s)
- **Implementation:** 2-3 hours to set up Redis, cache demo user dashboard query

### 3. **Image Optimization is Non-Negotiable**
- **Action:** Convert all landing page images to WebP, use `next/image` with `priority`
- **Reason:** Screenshots are largest performance risk (500KB-2MB unoptimized)
- **Implementation:** 1 hour to convert images, configure `next/image`

### 4. **Monitor Bundle Size Weekly**
- **Action:** Run `next build --profile` after each phase, track in spreadsheet
- **Reason:** 30KB budget is tight - early detection prevents costly refactoring
- **Implementation:** 15 minutes/week, automate with CI/CD (future)

### 5. **Lazy-Load Non-Critical Pages**
- **Action:** Use `next/dynamic` for Profile, Settings, About pages
- **Reason:** Landing page is critical path - defer loading heavy pages
- **Implementation:** 30 minutes per page, Phase 2 (Profile/Settings)

### 6. **Add Rate Limiting to Sensitive Operations**
- **Action:** Implement Upstash Rate Limit for password reset, email verification
- **Reason:** Prevent abuse, protect against brute force attacks
- **Implementation:** 2 hours (set up Upstash, add middleware)

### 7. **Generate Demo User Content via Script, Not Deployment**
- **Action:** Create `scripts/seed-demo-user.ts` to generate reflections
- **Reason:** Avoid Anthropic API timeout during deployment, reproducible seeding
- **Implementation:** 3-4 hours (script + content quality review)

### 8. **Test on 3G Mobile Before Launch**
- **Action:** Run Lighthouse audits with 3G throttling (mobile + desktop)
- **Reason:** 60% of traffic is mobile (per vision), must optimize for slow connections
- **Implementation:** 1 hour (Phase 7 - QA & Polish)

---

## Technology Recommendations

### Existing Stack Assessment
- **Next.js 14 App Router:** ✓ EXCELLENT - Modern, performant, automatic code splitting
- **tRPC:** ✓ GOOD - Type-safe API, minimal overhead, easy to extend for Profile/Settings
- **Supabase PostgreSQL:** ✓ GOOD - Managed, scalable, RLS for security
- **React Query:** ✓ EXCELLENT - Client-side caching, optimistic updates, perfect for mutations
- **Framer Motion:** ⚠️ ACCEPTABLE - Powerful but heavy (50KB+), consider CSS-only animations for Plan-7

### New Dependencies (Plan-7)

**REQUIRED:**
- **None** - All features achievable with existing stack ✓

**RECOMMENDED:**
- **@upstash/redis** (already in package.json ✓): Implement caching for demo user
- **@next/bundle-analyzer:** Monitor bundle size (dev dependency)
- **sharp:** Image optimization (automatically installed by next/image)

**OPTIONAL (Future):**
- **@sentry/nextjs:** Error tracking (post-MVP)
- **@vercel/speed-insights:** RUM monitoring (post-MVP)

---

## Implementation Phasing (Performance Lens)

### Phase 1: Demo User & Landing Page (Days 1-4)
**Performance priorities:**
1. Set up Core Web Vitals monitoring (30 min)
2. Implement demo user caching (2 hours)
3. Optimize landing page images to WebP (1 hour)
4. Configure `next/image` with priority loading (30 min)
5. Lighthouse audit on landing page (1 hour)

**Acceptance:**
- Landing page LCP <2s ✓
- Demo dashboard loads <1.5s ✓
- Lighthouse Performance score >90 ✓

---

### Phase 2: Profile & Settings (Days 4-7)
**Performance priorities:**
1. Lazy-load Profile/Settings pages (1 hour)
2. Implement optimistic UI updates for mutations (2 hours)
3. Add rate limiting to sensitive mutations (2 hours)
4. Monitor bundle size increase (15 min)

**Acceptance:**
- Profile mutations <300ms p95 ✓
- Bundle size increase <10KB ✓

---

### Phase 3-6: Remaining Features (Days 7-17)
**Performance priorities:**
1. Monitor bundle size after each phase (15 min/phase)
2. Lazy-load heavy components (1 hour total)
3. Optimize markdown parsing for reflection display (2 hours)
4. Test empty state SVG impact (30 min)

**Acceptance:**
- Total bundle size increase <30KB ✓
- No page with LCP >3s ✓

---

### Phase 7: QA & Polish (Days 17-20)
**Performance priorities:**
1. **CRITICAL:** Lighthouse audits on all pages (3 hours)
   - Landing, Dashboard, Profile, Settings, About, Pricing, Reflections, Dreams
   - Desktop + Mobile (3G throttling)
   - Target: Performance score >90 across all pages
2. Load testing: Demo user stress test (2 hours)
3. Bundle size final verification (<30KB) (30 min)
4. Database query performance review (1 hour)
5. Set up production monitoring alerts (1 hour)

**Acceptance:**
- All performance criteria met ✓
- Monitoring + alerting operational ✓

---

## Performance Acceptance Checklist

### Landing Page Performance
- [ ] LCP <2s on desktop (Lighthouse)
- [ ] LCP <2.5s on mobile 3G (Lighthouse)
- [ ] FID <100ms (Real User Monitoring)
- [ ] CLS <0.1 (no layout shift)
- [ ] Performance score >90 (Lighthouse)
- [ ] All images in WebP format
- [ ] Hero image uses `priority` flag
- [ ] Below-fold images lazy-loaded

### Demo User Performance
- [ ] Dashboard loads <1.5s (cached)
- [ ] Redis caching implemented
- [ ] Pagination on reflections (show 3-5, not all)
- [ ] Demo user query optimized (single JOIN)
- [ ] No N+1 queries detected

### Bundle Size
- [ ] Total increase <30KB (compressed)
- [ ] Bundle analyzer report reviewed
- [ ] No unused dependencies
- [ ] Lazy-loaded non-critical pages
- [ ] Tree-shaken Framer Motion

### API Performance
- [ ] Profile mutations <300ms p95
- [ ] Settings mutations <300ms p95
- [ ] Rate limiting implemented (10 req/15min)
- [ ] tRPC middleware timing logs added

### Database Performance
- [ ] All queries <500ms p95
- [ ] Composite indexes for filters
- [ ] Connection pool <80% utilized
- [ ] RLS policies performant (no full table scans)

### Monitoring & Alerting
- [ ] Core Web Vitals tracking live
- [ ] Vercel Analytics integrated
- [ ] Error tracking configured
- [ ] Alert thresholds set (LCP >3s, API errors >5%)

---

## Estimated Timeline (Performance Work)

**Total performance-specific work:** 18-22 hours across 7 phases

- **Phase 1 (Demo & Landing):** 5 hours performance work
- **Phase 2 (Profile & Settings):** 3 hours performance work
- **Phase 3-6 (Features):** 4 hours performance work (spread across phases)
- **Phase 7 (QA & Polish):** 8 hours performance work

**Performance work as % of total project:** ~25-30% (appropriate for production-ready app)

---

## Notes & Observations

### Strengths of Current Architecture (Performance Lens)
1. **Next.js App Router:** Automatic code splitting, server components reduce client bundle
2. **tRPC:** Type-safe, minimal runtime overhead, no GraphQL complexity
3. **Supabase:** Managed database, automatic backups, RLS for security
4. **React Query:** Client-side caching reduces API calls, optimistic updates
5. **Vercel deployment:** Edge CDN, serverless auto-scaling, zero config

### Weaknesses to Address in Plan-7
1. **No caching layer:** Demo user queries hit database every time (add Redis)
2. **Large build size (361MB):** Likely includes source maps, but audit needed
3. **No performance monitoring:** Can't validate acceptance criteria without metrics
4. **Missing rate limiting:** Sensitive operations (password reset) unprotected
5. **Unoptimized images:** Landing page screenshots could be 2MB+ unoptimized

### Plan-7 is Low-Risk from Scalability Perspective
- **Minimal backend changes:** 5-7 new mutations (simple UPDATE queries)
- **No new complex queries:** Dashboard query already exists, just extend
- **Static content heavy:** 4 of 10 features are static pages (About, Pricing, Landing, Empty States)
- **Demo user read-only:** No write load, can be aggressively cached
- **Current infrastructure sufficient:** No scaling changes needed for 1,000-10,000 users

### Critical Success Factors (Performance)
1. **Image optimization:** 70% of landing page LCP improvement
2. **Demo user caching:** 50% of stakeholder validation success
3. **Bundle size discipline:** Prevents performance regression
4. **Early monitoring:** Catch issues in development, not production

---

## Final Recommendation

**From a scalability and performance perspective, Plan-7 is LOW-MEDIUM COMPLEXITY.**

**Reasoning:**
- Minimal infrastructure changes (no new services, databases, or APIs)
- Primarily UX/content work (static pages, form enhancements, empty states)
- Largest performance risk is **image optimization** (easily mitigated)
- Second-largest risk is **demo user dashboard load time** (easily cached)
- Bundle size risk is **manageable** with monitoring and lazy-loading
- Current architecture **scales to 10,000+ users** with zero changes

**Recommended approach:**
- **Single iteration is feasible** IF performance priorities implemented early (Phase 1)
- **Estimated duration:** 3 weeks (60-80 hours total, 18-22 hours performance work)
- **Risk level:** LOW-MEDIUM (controllable risks, clear mitigation strategies)

**Success depends on:**
1. Implementing caching for demo user (Phase 1, non-negotiable)
2. Optimizing landing page images (Phase 1, non-negotiable)
3. Monitoring bundle size weekly (all phases)
4. Running Lighthouse audits before launch (Phase 7)

**If these 4 priorities are met, Plan-7 will achieve 9/10 product quality with excellent performance. ✓**

---

*Exploration completed: 2025-11-28*
*This report informs master planning decisions from a scalability and performance lens*
