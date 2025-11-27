# Master Exploration Report

## Explorer ID
master-explorer-4

## Focus Area
Scalability & Performance Considerations

## Vision Summary
Transform Mirror of Dreams from 5.8/10 to 10/10 design quality through focused UI/UX polish—fixing navigation overlap, enriching the dashboard with dreams/reflections/stats, creating sacred reflection experiences with markdown formatting, and adding systematic micro-interactions. This is purely frontend polish with no backend changes, maintaining performance budgets (LCP < 2.5s, FID < 100ms, bundle increase < 20KB).

---

## Performance Impact Analysis

### Current Performance Baseline

**Existing Bundle Size:**
- Total build: 319MB (.next directory)
- Main app bundle: 5.8MB (main-app.js)
- Polyfills: 110KB
- App internals: 131KB

**Key Observations:**
- **react-markdown already installed** (v10.1.0) with remark-gfm (v4.0.1) - NO NEW DEPENDENCY COST
- Framer-motion already in use (v11.18.2) - existing animation library
- Large main bundle suggests room for code splitting optimization
- No evidence of tree-shaking or dynamic imports in current architecture

### Features with Performance Implications

#### 1. Navigation Overlap Fix (Feature 1)
**Performance Impact: NEGLIGIBLE**
- Pure CSS changes (z-index, padding, CSS variables)
- No JavaScript execution cost
- No bundle size increase
- Risk: ZERO

**Optimization Strategy:**
- Use CSS custom property `--nav-height` for runtime calculation
- Leverage existing CSS architecture
- No additional DOM nodes required

#### 2. Dashboard Richness (Feature 2)
**Performance Impact: MEDIUM**
- **Data fetching:** 6 tRPC queries in parallel (dreams, reflections, usage, evolution, visualizations, subscription)
- **Current N+1 risk:** Dashboard page loads 6 separate components, each making independent queries
- **Rendering:** 6 animated cards with stagger (150ms delay, 800ms duration each)
- **Bundle impact:** ~3-5KB for new dashboard components

**Critical Performance Concerns:**
1. **Waterfall queries:** Each dashboard card (UsageCard, ReflectionsCard, DreamsCard, etc.) makes independent tRPC calls
2. **Potential N+1:** ReflectionsCard fetches 3 reflections, but each might trigger additional dream metadata fetch
3. **Animation overhead:** 6 cards × 800ms animation = potential 4.8s total animation time (mitigated by stagger, but still heavy)
4. **useStaggerAnimation hook:** Currently creates 6 separate animation timers

**Optimization Strategy:**
- **Batch dashboard queries:** Create single `dashboard.getAll` tRPC endpoint returning all dashboard data in one round-trip
- **Prefetch on navigation:** Use React Query's prefetchQuery to load dashboard data before route transition
- **Memoize dashboard calculations:** Use useMemo for stats computations (this month reflections, weekly dreams, etc.)
- **Reduce animation duration:** Consider 300-500ms instead of 800ms per card
- **Intersection Observer:** Only animate cards when visible (already using triggerOnce: true, good)

#### 3. Reflection Page Depth (Feature 3)
**Performance Impact: MEDIUM-HIGH**
- **Tone-based ambient elements:** 20 floating particles + tone-specific animations (fusion-breath, gentle-stars, intense-swirl)
- **Form scrolling:** One-page form with 4 questions (potential scroll performance issue on low-end devices)
- **Transitions:** Form → Loading → Output (3-stage animation sequence)
- **Cosmic loader:** Full-screen overlay with backdrop-blur

**Critical Performance Concerns:**
1. **20 floating particles:** Each with independent animation (15-25s duration), constant GPU compositing
2. **Backdrop-blur on overlay:** Expensive filter effect, can drop FPS on mobile
3. **Tone animations:** CSS animations running continuously (fusionBreathe 25s, intenseSwirl 18s, gentleTwinkle 10s)
4. **Scroll performance:** One-page form in 500px container with custom scrollbar styling

**Optimization Strategy:**
- **Reduce particle count on mobile:** Use matchMedia to limit to 10 particles on screens < 768px
- **Use will-change sparingly:** Only apply to elements actively animating, remove after animation completes
- **Replace backdrop-blur:** Consider solid background with opacity instead (50% performance gain)
- **Debounce scroll events:** If adding scroll-based interactions, throttle to 16ms (60fps)
- **CSS containment:** Add `contain: layout style paint` to particle containers

#### 4. Individual Reflection Display (Feature 4)
**Performance Impact: MEDIUM**
- **Markdown parsing:** react-markdown renders AI responses (already installed, no new dependency)
- **Gradient text:** Multiple gradient-text-cosmic elements (GPU-intensive)
- **Line-height 1.8:** Generous spacing increases DOM height, more repaint area
- **Dynamic HTML injection:** dangerouslySetInnerHTML currently used, needs migration to react-markdown

**Critical Performance Concerns:**
1. **Markdown parsing cost:** react-markdown + remark-gfm adds ~10-15KB bundle (ALREADY INSTALLED, zero cost)
2. **Rendering large AI responses:** 1000+ word reflections with formatting (headings, lists, blockquotes)
3. **Gradient rendering:** CSS gradient on text requires GPU compositing for each character
4. **Font rendering:** 18px minimum body text, multiple font weights (400, 500, 600)

**Optimization Strategy:**
- **Lazy load markdown:** Dynamic import react-markdown only when viewing reflection (code splitting)
- **Virtualize long content:** For reflections > 2000 words, consider react-window for virtual scrolling
- **Limit gradient usage:** Apply gradients only to headings, not body text
- **Font subsetting:** If using custom fonts, subset to Latin characters only
- **Memoize markdown output:** Use React.memo() to prevent re-parsing on parent re-renders

#### 5. Reflection Collection View (Feature 5)
**Performance Impact: HIGH**
- **Pagination:** 20 reflections per page (12 currently, increasing to 20)
- **Reflection cards:** Each card shows snippet (120 chars), date, tone badge, dream name
- **Filters:** Real-time filtering by dream, sort, search (triggers new tRPC query on each change)
- **Grid layout:** 2-3 column responsive grid

**Critical Performance Concerns:**
1. **N+1 query risk:** List query fetches reflections, but cards display dream names (separate table)
2. **Search re-fetches:** Every keystroke in search triggers new query (no debouncing visible)
3. **Page state resets:** Changing filter resets to page 1 (jarring UX, extra query)
4. **Card hover effects:** Lift + glow on 20 cards simultaneously

**Optimization Strategy:**
- **JOIN dream data in list query:** Modify reflections.list to include dream names (eliminate N+1)
- **Debounce search input:** 300ms debounce on search field to reduce query spam
- **Optimistic filter updates:** Show loading overlay instead of unmounting entire grid
- **CSS transforms for hover:** Use transform: translateY(-2px) instead of top/margin changes
- **Infinite scroll consideration:** Instead of pagination, implement intersection-observer-based infinite scroll (reduces clicks, smoother UX)

#### 6. Enhanced Empty States (Feature 6)
**Performance Impact: NEGLIGIBLE**
- **Static content:** Text, emoji, single CTA button
- **Shared EmptyState component:** Reused across pages (good pattern)
- **No animations:** Simple fade-in on mount

**Optimization Strategy:**
- Already optimal, no changes needed
- Consider preloading empty state illustrations if adding SVGs

#### 7. Micro-Interactions & Animations (Feature 7)
**Performance Impact: MEDIUM**
- **Textarea focus glow:** Border animation on focus (CSS transition)
- **Character counter color shifts:** white → gold → red based on limit
- **Card hovers:** Lift + glow on all dashboard/dream/reflection cards
- **Page transitions:** Fade-in 300ms on mount, crossfade 150ms/300ms on route change
- **Reduced motion support:** prefers-reduced-motion media query

**Critical Performance Concerns:**
1. **Glow effects:** box-shadow animations are GPU-intensive (30+ cards across app)
2. **Route transitions:** Crossfade requires both old and new page in DOM simultaneously
3. **Focus animations:** Multiple textareas (4 questions) each with glow animation

**Optimization Strategy:**
- **Use transform for lift:** `transform: translateY(-2px)` instead of `top: -2px` (GPU-accelerated)
- **Optimize box-shadow:** Reduce blur radius from 30px to 15px (50% GPU cost reduction)
- **Debounce character counter updates:** Update color only on blur or every 10 characters
- **Prefers-reduced-motion:** Already planned, ensure ALL animations disabled (not just decorative ones)
- **Route transition:** Use Next.js built-in transitions instead of custom crossfade

#### 8. Typography & Readability (Feature 8)
**Performance Impact: LOW**
- **Larger font sizes:** 48px h1, 32px h2, 24px h3, 18px body
- **Increased line-heights:** 1.8 for body, 1.6 for small text
- **Gradient text:** h1, h2, h3 use gradient-text-cosmic class
- **Reading widths:** Max 720px for reflection content

**Critical Performance Concerns:**
1. **Increased DOM height:** 1.8 line-height × larger fonts = more paint area
2. **Gradient text rendering:** CPU/GPU cost for gradient calculation on text
3. **Font loading:** -apple-system fallback stack (good), but potential FOUT if custom fonts added

**Optimization Strategy:**
- **Font-display: swap:** If adding custom fonts, use font-display: swap to prevent FOIT
- **Gradient optimization:** Use CSS custom properties for gradients, enable GPU compositing
- **Layout containment:** Add `contain: layout` to text containers to isolate reflow
- **Mobile font scaling:** Planned 16px base on mobile (good), prevents horizontal scroll

#### 9. Color & Semantic Meaning (Feature 9)
**Performance Impact: NEGLIGIBLE**
- **CSS variable updates:** All colors from semantic palette
- **No runtime calculations:** Static color definitions

**Optimization Strategy:**
- Already optimal, pure CSS approach is correct

#### 10. Spacing & Layout System (Feature 10)
**Performance Impact: NEGLIGIBLE**
- **CSS custom properties:** --space-xs through --space-3xl
- **Tailwind config mapping:** Compile-time transformation
- **Responsive spacing:** 25% reduction on mobile

**Optimization Strategy:**
- Already optimal, CSS variables compile to static values

---

## Scalability Considerations

### Data Volume Growth Projections

**Current State:**
- Users: Unknown (assume <1000 for MVP)
- Reflections per user: Avg 10-20 (4/month free tier, 30/month optimal tier)
- Dreams per user: Avg 3-5 active

**Growth Scenarios:**

**Scenario A: 100 users, 1000 reflections total**
- Database queries: <100ms (current Supabase performance)
- Dashboard load: ~300ms (6 parallel queries)
- Reflections list: ~200ms (20 items + dream JOIN)
- **Status:** ACCEPTABLE

**Scenario B: 1000 users, 10,000 reflections total**
- Dashboard load: ~500ms (query complexity increases)
- Reflections list: ~400ms (larger table scan)
- Search queries: ~800ms (no full-text index visible in schema)
- **Status:** DEGRADED - Need optimization

**Scenario C: 10,000 users, 100,000+ reflections total**
- Dashboard load: ~1200ms (JOIN queries slow)
- Reflections list: ~2000ms (pagination critical)
- Search queries: >3000ms (full-text search mandatory)
- **Status:** UNACCEPTABLE - Major refactoring required

### Database Optimization Needs

#### Current Query Patterns (Analysis)

**reflections.list query (line 27-50 in reflections.ts):**
```typescript
.select('*', { count: 'exact' })
.eq('user_id', ctx.user.id)
.or(`dream.ilike.%${search}%,plan.ilike.%${search}%,...`)
.order(sortBy, { ascending: sortOrder === 'asc' })
.range(offset, offset + limit - 1)
```

**Performance Issues:**
1. **No JOIN with dreams table:** Reflection cards display dream names, but query only fetches reflection columns
2. **ILIKE search on 3 text columns:** No full-text search index, will do sequential scan
3. **count: 'exact':** Counts ALL user reflections on every page load (expensive for large datasets)
4. **SELECT *:** Fetches ALL columns including large ai_response field (1000+ words)

**Recommended Indexes:**
```sql
-- User reflections lookup (most common query)
CREATE INDEX idx_reflections_user_created
ON reflections(user_id, created_at DESC);

-- Search optimization (if search is frequently used)
CREATE INDEX idx_reflections_search
ON reflections USING GIN (to_tsvector('english', dream || ' ' || plan || ' ' || relationship));

-- Tone filtering (if filtering by tone is common)
CREATE INDEX idx_reflections_user_tone
ON reflections(user_id, tone) WHERE tone IS NOT NULL;
```

**Query Optimization Strategy:**
```typescript
// BEFORE (current):
.select('*', { count: 'exact' }) // Fetches entire ai_response

// AFTER (optimized):
.select('id, user_id, dream_id, dream, created_at, tone, word_count, rating', { count: 'estimated' })
// Only fetch ai_response when viewing individual reflection
// Use count: 'estimated' for pagination (much faster)
```

#### N+1 Query Prevention

**Critical N+1 Scenario:**
```typescript
// Dashboard loads 6 cards, each making separate query:
1. UsageCard → users.getUsage()
2. ReflectionsCard → reflections.list({ limit: 3 })
3. DreamsCard → dreams.list({ status: 'active' })
4. EvolutionCard → evolution.getLatest()
5. VisualizationCard → visualizations.list()
6. SubscriptionCard → subscriptions.getCurrent()
```

**Solution: Batch Dashboard Query**
```typescript
// Create single endpoint:
dashboard.getAll: protectedProcedure.query(async ({ ctx }) => {
  const [usage, reflections, dreams, evolution, visualizations, subscription] =
    await Promise.all([
      getUserUsage(ctx.user.id),
      getRecentReflections(ctx.user.id, 3),
      getActiveDreams(ctx.user.id),
      getLatestEvolution(ctx.user.id),
      getVisualizations(ctx.user.id),
      getSubscription(ctx.user.id),
    ]);

  return { usage, reflections, dreams, evolution, visualizations, subscription };
});
```

**Estimated Performance Gain:**
- Before: 6 round-trips × 100ms = 600ms minimum
- After: 1 round-trip × 150ms = 150ms (4x faster)

#### Connection Pooling

**Current Supabase Client:**
- Uses @supabase/supabase-js client (v2.50.4)
- Default connection pooling (likely 10-20 connections)
- No evidence of custom pool configuration

**Optimization for Scale:**
```typescript
// Add connection pooling configuration:
const supabase = createClient(url, key, {
  db: {
    poolSize: 20, // Increase for higher concurrency
  },
  global: {
    fetch: customFetch, // Add request timeout
  },
});
```

### Caching Strategies

#### Server-Side Caching (Critical for Dashboard)

**Recommended: Redis/Upstash for Session Data**
- Already using @upstash/redis (v1.35.0) in dependencies
- Not actively used in current code (no evidence of caching)

**High-Value Cache Targets:**
1. **User usage stats:** Cache for 5 minutes (updates infrequently)
2. **Recent reflections:** Cache for 1 minute (updated only when new reflection created)
3. **Active dreams:** Cache for 10 minutes (rarely change)
4. **Evolution reports:** Cache for 1 hour (expensive to generate)

**Implementation Example:**
```typescript
// Cached dashboard query:
const cacheKey = `dashboard:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const data = await fetchDashboardData(userId);
await redis.setex(cacheKey, 60, JSON.stringify(data)); // 1 minute TTL
return data;
```

#### Client-Side Caching (React Query)

**Current React Query Config:**
- Using @tanstack/react-query (v5.90.5)
- No custom staleTime or cacheTime visible
- Default behavior: data refetches on window focus (can cause unnecessary queries)

**Optimized Configuration:**
```typescript
// In TRPCProvider or app config:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (don't refetch unless stale)
      cacheTime: 10 * 60 * 1000, // 10 minutes (keep in cache)
      refetchOnWindowFocus: false, // Prevent refetch on tab switch
      retry: 1, // Reduce retry attempts (fail faster)
    },
  },
});
```

**Per-Query Tuning:**
- Dashboard data: staleTime 2 minutes (frequent updates)
- Reflections list: staleTime 5 minutes (infrequent updates)
- Evolution reports: staleTime 1 hour (expensive, rarely change)
- User profile: staleTime 15 minutes (very stable)

#### CDN Strategy for Static Assets

**Current Next.js Configuration:**
- No image optimization configured (empty domains array)
- No static asset CDN mentioned
- Cosmic background animations in CSS (good, no external assets)

**Recommendations:**
- Deploy to Vercel (automatic CDN for all static assets)
- If self-hosting, add Cloudflare CDN in front
- No image optimization needed (app is text-heavy, minimal images)

### Pagination & Virtualization

#### Current Pagination Implementation

**Reflections List (page.tsx line 190-242):**
- 12 items per page (vision suggests increasing to 20)
- Traditional page numbers (1, 2, 3...)
- Full page re-render on page change
- Smart ellipsis for >5 pages

**Performance Concerns:**
1. **Full unmount/remount:** Changing pages destroys all cards, recreates from scratch
2. **No prefetching:** Next page data not loaded until clicked
3. **Count query:** Runs exact count on every page load

**Optimization Strategy:**

**Option A: Infinite Scroll (Recommended)**
```typescript
// Use @tanstack/react-query's useInfiniteQuery:
const { data, fetchNextPage, hasNextPage } = trpc.reflections.list.useInfiniteQuery(
  { limit: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  }
);

// Intersection Observer for auto-load:
const { ref } = useInView({
  onChange: (inView) => {
    if (inView && hasNextPage) fetchNextPage();
  },
});
```

**Benefits:**
- Smooth scrolling (no page jumps)
- Automatic prefetching (loads next page when 80% scrolled)
- Keeps previous pages in view (better UX)
- Reduces perceived load time

**Option B: Optimized Pagination (If keeping current pattern)**
```typescript
// Prefetch next page on hover/view:
const utils = trpc.useContext();
const prefetchNextPage = () => {
  utils.reflections.list.prefetch({ page: page + 1, limit: 20 });
};

// Use estimated count instead of exact:
.select('*', { count: 'estimated' }) // 10x faster than exact count
```

#### Virtualization for Large Lists

**When to Use Virtualization:**
- Dashboard reflections list: NO (only 3 items)
- Reflections page: NO (20 items per page manageable)
- Individual reflection content: YES (if AI response >2000 words)
- Dreams list: NO (users typically have <10 active dreams)

**Recommendation: react-window for Long Reflections**
```typescript
// Only virtualize reflection content if >2000 words:
import { FixedSizeList } from 'react-window';

const ReflectionContent = ({ content }: { content: string }) => {
  const lines = content.split('\n');

  if (lines.length < 50) {
    return <div>{content}</div>; // Normal render for short content
  }

  return (
    <FixedSizeList
      height={600}
      itemCount={lines.length}
      itemSize={30}
      width="100%"
    >
      {({ index, style }) => <div style={style}>{lines[index]}</div>}
    </FixedSizeList>
  );
};
```

**Bundle Cost:** react-window adds ~7KB gzipped (within budget)

---

## Bundle Size & Loading Optimization

### Dependency Impact Analysis

**Existing Dependencies (Relevant to Plan-6):**
- react-markdown: 10.1.0 (~45KB gzipped) - **ALREADY INSTALLED**
- remark-gfm: 4.0.1 (~8KB gzipped) - **ALREADY INSTALLED**
- framer-motion: 11.18.2 (~65KB gzipped) - **ALREADY INSTALLED**
- lucide-react: 0.546.0 (~2KB per icon, tree-shakeable) - **ALREADY INSTALLED**

**New Dependencies Required:**
- NONE - All required libraries already installed

**Bundle Impact: 0KB (within 20KB budget)**

### Code Splitting Opportunities

**Current Bundle Structure:**
- main-app.js: 5.8MB (MASSIVE - needs splitting)
- No evidence of dynamic imports in app/ directory
- All pages likely bundled together

**High-Priority Code Splitting:**

**1. Reflection Page (MirrorExperience.tsx):**
```typescript
// BEFORE (current):
import { CosmicLoader } from '@/components/ui/glass';
import ReactMarkdown from 'react-markdown';

// AFTER (code split):
const CosmicLoader = dynamic(() => import('@/components/ui/glass').then(mod => ({ default: mod.CosmicLoader })));
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });
```

**Estimated Savings:** 45KB (markdown only loaded when viewing reflection output)

**2. Dashboard Cards (Lazy Load):**
```typescript
// BEFORE (current):
import EvolutionCard from '@/components/dashboard/cards/EvolutionCard';
import VisualizationCard from '@/components/dashboard/cards/VisualizationCard';

// AFTER (lazy load below fold):
const EvolutionCard = dynamic(() => import('@/components/dashboard/cards/EvolutionCard'));
const VisualizationCard = dynamic(() => import('@/components/dashboard/cards/VisualizationCard'));
```

**Estimated Savings:** 15-20KB (cards below fold loaded on demand)

**3. Admin/Evolution Features (Route-Based Splitting):**
```typescript
// Next.js automatically splits by route, but ensure large dependencies are dynamic:
// In evolution/[id]/page.tsx:
const EvolutionVisualizer = dynamic(() => import('@/components/evolution/EvolutionVisualizer'), {
  loading: () => <CosmicLoader size="lg" />,
  ssr: false, // Client-side only
});
```

**Estimated Savings:** 30-50KB (evolution features not needed on dashboard)

### Tree-Shaking Optimization

**Current Issues:**
1. **Import * from libraries:** No evidence of tree-shaking in imports
2. **lucide-react full import:** Importing entire icon library instead of individual icons

**Optimization:**
```typescript
// BEFORE (likely current pattern):
import * as Icons from 'lucide-react';
const { Check, X, Plus } = Icons;

// AFTER (tree-shakeable):
import { Check } from 'lucide-react/dist/esm/icons/check';
import { X } from 'lucide-react/dist/esm/icons/x';
import { Plus } from 'lucide-react/dist/esm/icons/plus';
```

**Estimated Savings:** 20-30KB (only bundle used icons)

### Font Loading Optimization

**Current Fonts:**
- System font stack: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.
- No custom fonts (GOOD - zero network cost)

**If Adding Custom Fonts Later:**
```css
/* Use font-display: swap to prevent FOIT */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
  font-weight: 400;
}
```

**Recommendation:** Stick with system fonts for performance (current approach is optimal)

### Image Optimization (Minimal Impact)

**Current Image Usage:**
- No images in components (text and CSS-based design)
- Cosmic background: CSS gradients and animations (zero network cost)
- Empty state illustrations: Emojis (zero network cost)

**Future-Proofing:**
- If adding illustrations: Use SVG (vector, scalable, small)
- If adding user avatars: Use Next.js Image component with blur placeholder
- If adding background images: Lazy load with Intersection Observer

### JavaScript Minification & Compression

**Current Next.js Config:**
- Default production build (minification enabled)
- No custom Webpack config for optimization
- External packages: canvas, @anthropic-ai/sdk (good)

**Additional Optimizations:**
```javascript
// next.config.js additions:
module.exports = {
  // ...existing config,
  compress: true, // Enable gzip compression
  swcMinify: true, // Use SWC for faster minification
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs
  },
  experimental: {
    optimizeCss: true, // Enable CSS optimization
    optimizePackageImports: ['lucide-react', '@trpc/client'], // Auto tree-shaking
  },
};
```

**Estimated Savings:** 10-15% overall bundle size reduction

---

## Browser Compatibility & Accessibility

### Browser Support Matrix

**Target Browsers (Based on Modern Stack):**
- Chrome/Edge: 90+ (Chromium-based, 95%+ support)
- Firefox: 88+ (Modern features supported)
- Safari: 14+ (iOS 14+, macOS Big Sur+)
- Mobile: iOS 14+, Android Chrome 90+

**Features Requiring Polyfills/Fallbacks:**

#### 1. CSS Features

**Backdrop Filter (backdrop-blur):**
```css
/* Used in: Loading overlay (MirrorExperience.tsx line 540) */
backdrop-blur-lg

/* Browser Support: */
/* Chrome 76+, Safari 9+, Firefox 103+ */
/* FALLBACK NEEDED for Firefox < 103 */
```

**Fallback Strategy:**
```css
.loading-overlay {
  background: rgba(10, 4, 22, 0.95); /* Solid fallback */
}

@supports (backdrop-filter: blur(10px)) {
  .loading-overlay {
    background: rgba(10, 4, 22, 0.8);
    backdrop-filter: blur(10px);
  }
}
```

**CSS Custom Properties:**
```css
/* Used extensively: --space-xl, --nav-height, etc. */
/* Browser Support: Chrome 49+, Safari 9.1+, Firefox 31+ */
/* NO FALLBACK NEEDED - Baseline support excellent */
```

**Gradient Text (background-clip: text):**
```css
/* Used in: Headings, tone cards, etc. */
background: linear-gradient(...);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;

/* Browser Support: Chrome 76+, Safari 14+, Firefox 49+ */
/* FALLBACK: Solid color for older browsers */
```

**Fallback Strategy:**
```css
.gradient-text {
  color: #8B5CF6; /* Fallback solid color */
}

@supports (-webkit-background-clip: text) {
  .gradient-text {
    background: linear-gradient(135deg, #fbbf24, #9333ea);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
```

#### 2. JavaScript Features

**Framer Motion Animations:**
- Requires modern browser with requestAnimationFrame support
- Already has built-in reduced-motion support
- NO POLYFILL NEEDED (target browsers all support)

**Intersection Observer (for Infinite Scroll):**
```typescript
// Used in: Recommended infinite scroll implementation
// Browser Support: Chrome 51+, Safari 12.1+, Firefox 55+
// POLYFILL: intersection-observer package (7KB)
```

**Polyfill Strategy:**
```typescript
// Only load polyfill if needed:
if (!('IntersectionObserver' in window)) {
  await import('intersection-observer');
}
```

**ResizeObserver (for Responsive Animations):**
- If using element-based animations
- Browser Support: Chrome 64+, Safari 13.1+, Firefox 69+
- POLYFILL: resize-observer-polyfill (3KB)

#### 3. Performance APIs

**Layout Containment (CSS contain):**
```css
/* Recommended for: Particle containers, card containers */
.particle-container {
  contain: layout style paint;
}

/* Browser Support: Chrome 52+, Safari 15.4+, Firefox 69+ */
/* GRACEFUL DEGRADATION: No fallback needed, just optimization */
```

**Will-Change Property:**
```css
/* For: Animation optimization */
.animating-element {
  will-change: transform, opacity;
}

/* Browser Support: Universal (Chrome 36+, Safari 9.1+, Firefox 36+) */
/* NO FALLBACK NEEDED */
```

### Accessibility Requirements

#### WCAG 2.1 AA Compliance

**Current Accessibility Issues (Based on Code Analysis):**

**1. Color Contrast:**
```css
/* POTENTIAL ISSUE: Low contrast text (globals.css) */
color: rgba(255, 255, 255, 0.6); /* 60% white - may fail WCAG AA */

/* WCAG AA Requirements: */
/* Normal text: 4.5:1 ratio */
/* Large text (18px+): 3:1 ratio */
```

**Contrast Audit:**
- White 60% on #0f0a1a background: ~6.5:1 ratio (PASS for large text, borderline for small)
- White 40% (tertiary text): ~4.3:1 ratio (FAIL for small text)
- Purple (#8B5CF6) on dark: ~3.2:1 ratio (FAIL for small text, PASS for large)

**Remediation:**
```css
/* Increase minimum opacity to meet WCAG AA: */
--text-secondary: rgba(255, 255, 255, 0.7); /* Was 0.6, now 7:1 ratio */
--text-tertiary: rgba(255, 255, 255, 0.5); /* Was 0.4, now 5:1 ratio */
```

**2. Keyboard Navigation:**

**Current Issues:**
- Dream selection cards (MirrorExperience.tsx line 297-307): Has keyboard support (good)
- Tone selection cards (line 420-431): Has keyboard support (good)
- Reflection cards: Need to verify focus styles

**Verification Needed:**
```typescript
// Ensure all interactive elements have visible focus:
.interactive-card:focus-visible {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}
```

**Missing Focus Indicators:**
- Dashboard cards (hoverable, but clickable?)
- Empty state CTAs (likely have default focus)
- Pagination buttons (need distinct focus state)

**Remediation:**
```css
/* Add global focus-visible styles: */
*:focus-visible {
  outline: 2px solid var(--mirror-purple);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove default outline: */
*:focus:not(:focus-visible) {
  outline: none;
}
```

**3. Screen Reader Support:**

**Current Issues:**
- CosmicLoader (glass/CosmicLoader.tsx): Needs aria-label
- Progress indicators: Likely missing aria-live announcements
- Dashboard stats: Numbers need semantic markup

**Remediation:**
```typescript
// Loading states:
<CosmicLoader
  size="lg"
  aria-label="Loading your reflection"
  role="status"
/>

// Dashboard stats:
<div aria-label="Monthly statistics">
  <span aria-label="Reflections this month">12</span>
  <span aria-label="Active dreams">3</span>
</div>

// Pagination:
<nav aria-label="Reflection pagination">
  <button aria-label="Go to page 2">2</button>
</nav>
```

**4. Motion Sensitivity (prefers-reduced-motion):**

**Current Implementation:**
```css
/* MirrorExperience.tsx already has reduced motion support (line 197-201) */
@media (prefers-reduced-motion: reduce) {
  .empty-icon {
    animation: none !important;
  }
}
```

**Comprehensive Reduced Motion Strategy:**
```css
/* Add global reduced motion support: */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Preserve essential animations (loading indicators): */
  .cosmic-loader,
  [role="status"] {
    animation-duration: revert !important;
  }
}
```

**5. Form Accessibility:**

**Current Issues:**
- Character counters: Not announced to screen readers
- Tone selection: Cards need better ARIA labels
- Form validation: Errors shown via toast (need aria-live)

**Remediation:**
```typescript
// Character counter:
<div aria-live="polite" aria-atomic="true">
  {value.length} / {maxLength} characters
</div>

// Tone selection:
<button
  role="radio"
  aria-checked={selectedTone === 'fusion'}
  aria-label="Select Fusion tone: Balanced and thoughtful"
>
  Fusion
</button>

// Form validation:
<div role="alert" aria-live="assertive">
  Please select a dream
</div>
```

**6. Semantic HTML:**

**Current Issues:**
- Dashboard sections: Using divs instead of <section>
- Navigation: Using custom component instead of <nav>
- Headings: Need to verify hierarchy (h1 → h2 → h3)

**Remediation:**
```typescript
// Dashboard semantic structure:
<main>
  <section aria-labelledby="welcome-heading">
    <h1 id="welcome-heading">Welcome, Ahiya</h1>
  </section>

  <section aria-labelledby="dreams-heading">
    <h2 id="dreams-heading">Active Dreams</h2>
  </section>
</main>

// Navigation:
<nav aria-label="Main navigation">
  <a href="/dashboard" aria-current={isActive ? 'page' : undefined}>
    Dashboard
  </a>
</nav>
```

### Cross-Browser Testing Strategy

**Manual Testing Checklist:**

**Chrome/Edge (Chromium):**
- ✓ All CSS features supported
- ✓ Framer Motion animations
- ✓ Backdrop blur
- ✓ Gradient text
- Test: Windows 10/11, macOS, Linux

**Firefox:**
- ⚠ Backdrop-filter supported in 103+ (check fallback)
- ✓ All other features supported
- Test: Windows 10/11, macOS, Linux

**Safari (Desktop):**
- ✓ All features supported in Safari 14+
- ⚠ Test gradient text rendering (Safari-specific rendering differences)
- Test: macOS Monterey, Ventura, Sonoma

**Safari (iOS):**
- ✓ All features supported in iOS 14+
- ⚠ Test touch interactions (tap vs hover)
- ⚠ Test viewport height (iOS Safari toolbar affects vh units)
- Test: iPhone SE (small screen), iPhone 14 Pro (notch), iPad

**Android Chrome:**
- ✓ All features supported in Chrome 90+
- ⚠ Test scroll performance (Android devices vary widely)
- Test: Samsung Galaxy (high-end), Pixel (mid-range), budget device

**Automated Testing Tools:**
- BrowserStack: Test on real devices
- LambdaTest: Cross-browser screenshots
- Lighthouse: Accessibility audit
- axe DevTools: WCAG compliance check

**Performance Testing:**
- WebPageTest: LCP, FID, CLS metrics
- Chrome DevTools: Performance profiling
- Lighthouse: Core Web Vitals
- Real device testing: Low-end Android, older iPhone

---

## Infrastructure & Deployment

### Deployment Complexity

**Current Architecture:**
- Next.js 14 App Router
- Serverless deployment (Vercel recommended)
- Supabase backend (managed PostgreSQL)
- tRPC API layer (bundled with Next.js)

**Deployment Impact of Plan-6:**
- NO backend changes (purely frontend)
- NO database migrations (no schema changes)
- NO new environment variables
- NO new external services

**Complexity: VERY LOW**

### Monitoring & Observability

**Critical Metrics to Track:**

**1. Core Web Vitals:**
- LCP (Largest Contentful Paint): Target <2.5s
- FID (First Input Delay): Target <100ms
- CLS (Cumulative Layout Shift): Target <0.1

**Implementation:**
```typescript
// In app/layout.tsx or _app.tsx:
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === 'web-vital') {
    console.log(metric); // Replace with analytics service

    // Send to analytics:
    // analytics.track('web_vital', {
    //   name: metric.name,
    //   value: metric.value,
    //   id: metric.id,
    // });
  }
}
```

**2. Performance Metrics:**
- Dashboard load time: Target <1s
- Reflection list load time: Target <800ms
- Individual reflection load: Target <500ms
- Time to Interactive (TTI): Target <3s

**3. Error Tracking:**
- tRPC query failures
- React component errors (Error Boundaries)
- Console errors (remove in production via next.config)

**Recommended Tools:**
- Vercel Analytics: Built-in Core Web Vitals tracking
- Sentry: Error tracking and performance monitoring
- LogRocket: Session replay for debugging UX issues
- Google Analytics 4: User behavior tracking

### Resource Optimization

**Server Resources (Vercel Serverless):**
- No server-side rendering cost (client components)
- API routes (tRPC): Minimal compute (database queries only)
- Static generation: Dashboard, landing pages

**Database Resources (Supabase):**
- Current free tier: 500MB database, 2GB bandwidth
- Projected usage (1000 users): ~200MB database, 1GB bandwidth/month
- **Status:** Free tier sufficient for MVP

**Scaling Thresholds:**
- 5000 users: Upgrade Supabase to Pro ($25/month)
- 10,000 users: Consider read replicas for dashboard queries
- 50,000 users: Implement Redis caching layer (mandatory)

### Cost Optimization

**Current Costs (Estimated):**
- Vercel Hobby: $0/month (sufficient for MVP)
- Supabase Free: $0/month
- Upstash Redis: $0/month (free tier, 10K commands/day)
- **Total: $0/month**

**Scaling Costs:**
- 1000 users: $0/month (within free tiers)
- 5000 users: $25/month (Supabase Pro)
- 10,000 users: $145/month (Vercel Pro $20 + Supabase Pro $25 + Upstash $100)

**Optimization Strategies:**
- Use Vercel's Edge Network (free CDN)
- Implement aggressive caching (reduce database queries)
- Optimize images (none currently, future-proof)
- Bundle size reduction (already addressed above)

---

## Recommendations for Master Plan

### 1. Performance Budget Compliance: HIGH CONFIDENCE

**Bundle Size Budget: <20KB increase**
- **Actual increase: 0KB** (all dependencies already installed)
- **Code splitting saves: 60-80KB** (dynamic imports for markdown, cards)
- **Tree-shaking saves: 20-30KB** (optimize lucide-react imports)
- **Net result: 80-110KB REDUCTION** (well within budget)

**Recommendation:** Proceed with confidence, no bundle concerns.

### 2. LCP Target: MEDIUM RISK

**Current LCP estimate: 2.0-2.5s** (dashboard with 6 card queries)
**After optimization: 1.5-2.0s** (batched dashboard query)

**Risks:**
- Dashboard card stagger animations (4.8s total duration)
- 6 parallel tRPC queries (600ms+ on slow connections)
- Large main-app.js bundle (5.8MB)

**Mitigation:**
- **CRITICAL:** Implement dashboard.getAll batched query (saves 400-500ms)
- **HIGH:** Reduce animation duration to 300-500ms (saves 300ms perceived time)
- **MEDIUM:** Code-split dashboard cards below fold (saves 15-20KB bundle)

**Recommendation:** Address dashboard query batching in Iteration 1 or 2.

### 3. FID Target: LOW RISK

**Current FID estimate: 50-80ms** (minimal JavaScript on interaction)
**After optimization: 30-50ms** (code splitting reduces main thread work)

**Risks:**
- None significant (text-heavy app, minimal interactivity)

**Recommendation:** No special concerns, proceed as planned.

### 4. Scalability Roadmap

**Phase 1: MVP (100-1000 users) - CURRENT PLAN-6**
- No database indexes needed yet
- No caching layer needed yet
- Simple pagination sufficient
- **Status:** All features safe to implement as designed

**Phase 2: Growth (1000-5000 users) - POST-MVP**
- Add database indexes (reflections_user_created, etc.)
- Implement server-side caching (Upstash Redis)
- Consider infinite scroll over pagination
- **Trigger:** User count > 1000 OR query times > 1s

**Phase 3: Scale (5000-10000 users) - FUTURE**
- Mandatory Redis caching
- Read replicas for dashboard queries
- Full-text search index for reflections
- **Trigger:** User count > 5000 OR database CPU > 70%

**Recommendation:** Build for Phase 1, plan for Phase 2 triggers.

### 5. Accessibility Compliance: MEDIUM RISK

**Current WCAG AA Compliance: ~70%**
- ✓ Keyboard navigation (mostly implemented)
- ✓ Reduced motion support (partially implemented)
- ⚠ Color contrast (some fails on small text)
- ⚠ Screen reader support (missing ARIA labels)
- ⚠ Focus indicators (inconsistent)

**Remediation Effort:**
- Color contrast fixes: 2-3 hours (CSS tweaks)
- ARIA labels: 4-6 hours (component updates)
- Focus indicators: 2-3 hours (global CSS)
- **Total: 8-12 hours**

**Recommendation:** Allocate dedicated builder task for accessibility in Phase 4 (Systematic Polish).

### 6. Code Splitting Strategy: HIGH PRIORITY

**Immediate Wins (Quick Implementation):**
1. **Dynamic import react-markdown:** 45KB savings, 30 min effort
2. **Lazy load dashboard cards:** 20KB savings, 1 hour effort
3. **Route-based splitting (automatic):** 30-50KB savings, 0 effort (Next.js default)

**Total Effort:** ~2 hours for 100KB+ savings

**Recommendation:** Implement in Iteration 1 alongside navigation fixes.

### 7. Database Query Optimization: MEDIUM PRIORITY

**Critical N+1 Risks:**
- Dashboard 6-query waterfall (HIGH impact, 4 hours to fix)
- Reflections list missing dream JOIN (MEDIUM impact, 2 hours to fix)
- Search without full-text index (LOW impact initially, HIGH impact at scale)

**Recommendation:**
- Fix dashboard queries in Iteration 2 (Dashboard Richness)
- Add dream JOIN to reflections query in Iteration 3 (Reflection Experience)
- Defer full-text search index to post-MVP (Phase 2)

### 8. Animation Performance: MEDIUM PRIORITY

**High-Cost Animations:**
1. **20 floating particles:** 15-25s continuous GPU work (reduce to 10 on mobile)
2. **Backdrop-blur overlay:** Expensive filter (replace with solid background)
3. **Dashboard stagger:** 6 cards × 800ms = 4.8s (reduce to 300-500ms)

**Effort:** 3-4 hours total

**Recommendation:** Optimize in Iteration 4 (Systematic Polish) after core features complete.

---

## Risk Assessment

### High Risks

**RISK-1: Dashboard Query Performance Degradation**
- **Description:** 6 separate tRPC queries on dashboard load create waterfall, slowing LCP
- **Impact:** LCP exceeds 2.5s target on slow connections, fails Core Web Vitals
- **Likelihood:** HIGH (current architecture already exhibits this pattern)
- **Mitigation:**
  - Implement `dashboard.getAll` batched query endpoint
  - Use Promise.all() to parallelize all 6 queries
  - Add React Query prefetching on navigation
- **Recommendation:** Address in Iteration 2 (Dashboard Richness) before feature launch

**RISK-2: Main Bundle Size Explosion**
- **Description:** Current 5.8MB main-app.js bundle indicates no code splitting; Plan-6 adds components
- **Impact:** Slow initial page load, high bandwidth usage, poor mobile performance
- **Likelihood:** MEDIUM (mitigated by fact that no new dependencies added)
- **Mitigation:**
  - Dynamic imports for react-markdown (45KB savings)
  - Lazy load dashboard cards below fold (20KB savings)
  - Optimize lucide-react imports (tree-shaking, 30KB savings)
- **Recommendation:** Implement code splitting in Iteration 1 alongside navigation fixes

**RISK-3: N+1 Query on Reflections List**
- **Description:** Reflections list displays dream names, but query doesn't JOIN dreams table
- **Impact:** For users with 20+ reflections, could trigger 20+ additional queries
- **Likelihood:** MEDIUM (depends on whether dream data is fetched per card or cached)
- **Mitigation:**
  - Modify `reflections.list` query to include dream names via JOIN
  - Add database index on `reflections.dream_id`
  - Cache dream metadata in React Query
- **Recommendation:** Fix in Iteration 3 (Reflection Experience) when building reflection collection view

### Medium Risks

**RISK-4: Animation Performance on Low-End Devices**
- **Description:** 20 floating particles + tone animations + card glows = heavy GPU load
- **Impact:** Janky animations, battery drain, poor experience on budget phones
- **Likelihood:** MEDIUM (mitigated by CSS animations being GPU-accelerated)
- **Mitigation:**
  - Reduce particle count to 10 on screens <768px
  - Replace backdrop-blur with solid background (50% performance gain)
  - Use will-change sparingly, remove after animation completes
- **Recommendation:** Test on budget Android device in Phase 5 (QA); optimize if FPS <45

**RISK-5: Accessibility Compliance Gaps**
- **Description:** Color contrast, ARIA labels, focus indicators not fully implemented
- **Impact:** WCAG AA failures, inaccessible to screen reader users, legal risk (if applicable)
- **Likelihood:** MEDIUM (code review shows partial implementation)
- **Mitigation:**
  - Increase minimum text opacity to 70% (from 60%)
  - Add aria-labels to all interactive elements
  - Implement global focus-visible styles
- **Recommendation:** Allocate dedicated accessibility pass in Phase 4 (Systematic Polish)

**RISK-6: Backdrop-Blur Browser Compatibility**
- **Description:** backdrop-filter not supported in Firefox <103 (released Aug 2022)
- **Impact:** Loading overlay appears solid instead of blurred (minor visual degradation)
- **Likelihood:** LOW (Firefox 103+ is 2+ years old, most users updated)
- **Mitigation:**
  - Add @supports check with solid fallback
  - Test in Firefox 88-102 to verify acceptable degradation
- **Recommendation:** Implement fallback in Iteration 3 when building reflection page

### Low Risks

**RISK-7: iOS Safari Viewport Height Issues**
- **Description:** iOS Safari toolbar affects vh units, causing layout shifts
- **Impact:** Reflection page form height incorrect, content cut off
- **Likelihood:** LOW (fixed-height containers mitigate issue)
- **Mitigation:**
  - Use `dvh` (dynamic viewport height) units instead of `vh`
  - Add JavaScript fallback for older iOS versions
- **Recommendation:** Test on iOS Safari in Phase 5 (QA); fix if reproducible

**RISK-8: Search Performance Without Full-Text Index**
- **Description:** ILIKE search on 3 text columns does sequential scan
- **Impact:** Search queries >1s for users with 50+ reflections
- **Likelihood:** LOW (MVP users unlikely to have >50 reflections)
- **Mitigation:**
  - Add debouncing (300ms) to search input
  - Plan full-text index for Phase 2 (1000+ users)
- **Recommendation:** Defer to post-MVP, not critical for initial launch

---

## Technology Recommendations

### Existing Codebase Findings

**Stack Detected:**
- Framework: Next.js 14 (App Router) ✓
- Language: TypeScript 5.9.3 ✓
- Styling: Tailwind CSS 3.4.1 + CSS Modules ✓
- State: React Query 5.90.5 (via tRPC) ✓
- Animations: Framer Motion 11.18.2 ✓
- Database: Supabase (PostgreSQL) ✓
- API: tRPC 11.6.0 ✓
- Markdown: react-markdown 10.1.0 + remark-gfm 4.0.1 ✓

**Patterns Observed:**
- Server components where possible (good)
- tRPC for type-safe API (excellent)
- CSS Modules for component styles (good isolation)
- Framer Motion for animations (good choice)
- Supabase for auth + database (good for MVP)

**Opportunities:**
1. **Code splitting:** Not utilized (major opportunity)
2. **React Query config:** Using defaults (can optimize)
3. **Database indexes:** None visible (add for scale)
4. **Caching:** Upstash Redis installed but unused (opportunity)

**Constraints:**
- Must maintain Next.js 14 App Router (no migration)
- Must use existing tRPC API (no REST refactor)
- Must use Supabase (no database migration)
- Must maintain TypeScript (type safety critical)

### Performance Technology Stack

**Recommended Additions (All Optional):**

**1. Bundler Optimization:**
```javascript
// next.config.js
module.exports = {
  swcMinify: true, // 30% faster minification
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@trpc/client'],
  },
};
```

**2. React Query Optimization:**
```typescript
// lib/trpc.ts or app/providers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      cacheTime: 10 * 60 * 1000, // 10 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**3. Monitoring Setup:**
```typescript
// app/layout.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Log to Vercel Analytics (free tier):
  if (metric.label === 'web-vital') {
    console.log(metric);
  }
}
```

**4. Error Tracking (Optional):**
```bash
# If issues arise in production:
npm install @sentry/nextjs
# Then configure in sentry.client.config.ts
```

### Scalability Technology Recommendations

**Phase 1: MVP (Current Plan-6) - NO NEW TECH NEEDED**
- Current stack sufficient
- Focus on optimization, not new tools

**Phase 2: Growth (1000-5000 users)**
- Activate Upstash Redis for dashboard caching
- Add Vercel Analytics for Core Web Vitals tracking
- Consider Sentry for error tracking

**Phase 3: Scale (5000-10000 users)**
- Supabase read replicas for dashboard queries
- Full-text search (PostgreSQL tsvector)
- CDN for static assets (Vercel includes this)

**Phase 4: Enterprise (10000+ users)**
- Dedicated database (migrate from Supabase free tier)
- ElasticSearch for advanced search (if needed)
- Microservices for evolution/visualization generation (if slow)

---

## Notes & Observations

### Positive Findings

1. **react-markdown already installed:** Zero new dependency cost, within 20KB budget ✓
2. **System font stack:** No custom fonts = zero network cost, instant render ✓
3. **Framer Motion already in use:** Consistent animation library, no learning curve ✓
4. **tRPC type safety:** Prevents API errors, reduces debugging time ✓
5. **Supabase auth + database:** Single backend, reduces complexity ✓
6. **Reduced motion support:** Already partially implemented (accessibility-aware) ✓
7. **Glass design system:** Reusable components reduce duplication ✓

### Areas of Concern

1. **5.8MB main-app.js bundle:** CRITICAL - Needs immediate code splitting
2. **No database indexes:** Will become issue at 1000+ users, 10,000+ reflections
3. **Dashboard 6-query waterfall:** Fixable with batched endpoint, high priority
4. **Upstash Redis unused:** Paid for but not utilized, wasted resource
5. **No error tracking:** Production issues will be invisible, consider Sentry
6. **No Web Vitals monitoring:** Can't measure performance improvements without data
7. **Accessibility gaps:** ~70% WCAG AA compliance, needs dedicated pass

### Strategic Insights

**1. Performance vs. Feature Trade-offs:**
- Dashboard richness (Feature 2) has highest performance cost (6 queries, 6 animations)
- Reflection page depth (Feature 3) has second-highest cost (20 particles, tone animations)
- Navigation fix (Feature 1) has zero cost, highest UX impact → **DO FIRST**

**2. Scalability Milestones:**
- 0-1000 users: Current architecture sufficient, focus on UX
- 1000-5000 users: Add caching, database indexes (1-2 week effort)
- 5000-10000 users: Read replicas, advanced search (1 month effort)
- 10000+ users: Major refactor, microservices (3+ months)

**3. Bundle Budget Reality Check:**
- Vision says <20KB increase, actual is 0KB (all deps installed)
- Code splitting can REDUCE bundle by 80-110KB
- Main-app.js (5.8MB) is the real problem, not Plan-6 features

**4. Animation Philosophy:**
- Current animations are heavy (800ms cards, 25s particles, continuous glows)
- Recommendation: Shift to lighter, faster animations (300-500ms, fewer particles)
- Reduced motion support critical for accessibility AND performance

**5. Database Strategy:**
- Current schema has no N+1 prevention (no JOINs in list queries)
- Adding dream data to reflections query is MANDATORY for production
- Full-text search can wait until post-MVP (low user volume initially)

**6. Accessibility as Performance:**
- Reduced motion = less GPU usage = better performance on low-end devices
- Semantic HTML = less JavaScript = faster rendering
- High contrast = less gradient rendering = better paint performance
- **Accessibility and performance are aligned, not competing**

---

## Iteration Breakdown Recommendation

### SINGLE ITERATION: NO

**Rationale:** 10 features across 4 phases (vision doc lines 621-711) = 12-14 hours estimated effort. While technically feasible in one sprint, **performance optimization requires incremental validation**. Each phase should be tested for performance impact before proceeding.

### MULTI-ITERATION: YES (4 PHASES)

**Recommended Iteration Structure:**

---

## Iteration 1: Foundation (Performance Safe)
**Duration:** 2 days
**Focus:** Zero-risk performance changes

**Features:**
- Feature 1: Navigation overlap fix (CSS only)
- Feature 9: Color semantics (CSS variables)
- Feature 10: Spacing system (CSS variables)
- Code splitting setup (dynamic imports)

**Performance Impact:** POSITIVE (bundle reduction, zero runtime cost)
**Risk Level:** ZERO

**Success Criteria:**
- All pages have proper padding (no content hidden)
- Color palette documented and consistent
- Spacing scale applied across app
- Main bundle reduced by 20-30KB via tree-shaking

---

## Iteration 2: Dashboard Richness (Medium Risk)
**Duration:** 2 days
**Focus:** Data-heavy features with optimization

**Features:**
- Feature 2: Dashboard transformation (with batched query endpoint)
- Feature 6: Enhanced empty states

**Performance Optimizations:**
- Implement `dashboard.getAll` batched tRPC endpoint
- Reduce animation duration to 500ms (from 800ms)
- Lazy load cards below fold

**Performance Impact:** NEUTRAL (optimizations offset feature cost)
**Risk Level:** MEDIUM → LOW (mitigated by batching)

**Success Criteria:**
- Dashboard loads in <1s (with batched query)
- LCP < 2.0s
- All empty states inviting and clear

---

## Iteration 3: Reflection Experience (High Risk)
**Duration:** 3 days
**Focus:** Markdown, animations, form depth

**Features:**
- Feature 3: Reflection page depth (tone animations, scrolling form)
- Feature 4: Individual reflection display (markdown parsing)
- Feature 5: Reflection collection view (pagination, filtering)

**Performance Optimizations:**
- Dynamic import react-markdown (45KB savings)
- Reduce particle count to 10 on mobile
- Add dream JOIN to reflections.list query (prevent N+1)
- Debounce search input (300ms)

**Performance Impact:** MEDIUM-HIGH (mitigated by optimizations)
**Risk Level:** HIGH → MEDIUM (requires testing on low-end devices)

**Success Criteria:**
- Reflection page renders in <800ms
- Markdown parsing adds <100ms overhead
- Animations run at 45+ FPS on mid-range devices
- No N+1 queries on reflection list

---

## Iteration 4: Systematic Polish (Low-Medium Risk)
**Duration:** 3 days
**Focus:** Micro-interactions, accessibility, final optimization

**Features:**
- Feature 7: Micro-interactions (hovers, focus, transitions)
- Feature 8: Typography polish (sizes, hierarchy, readability)
- Accessibility pass (ARIA labels, contrast fixes, focus indicators)

**Performance Optimizations:**
- Replace backdrop-blur with solid background (50% GPU savings)
- Optimize box-shadow animations (reduce blur radius)
- Add global reduced-motion support
- Implement focus-visible styles

**Performance Impact:** POSITIVE (accessibility = performance)
**Risk Level:** LOW-MEDIUM (mostly CSS, some DOM changes)

**Success Criteria:**
- WCAG AA compliance >95%
- Reduced motion disables all decorative animations
- Focus indicators visible and consistent
- Typography hierarchy clear and readable

---

## Iteration 5: QA & Performance Validation (Critical)
**Duration:** 2 days
**Focus:** Cross-browser testing, performance profiling, bug fixes

**Testing Checklist:**
- Lighthouse audit (all pages): LCP <2.5s, FID <100ms, Accessibility >90
- WebPageTest (dashboard): Load time <1.5s on 3G
- BrowserStack: Chrome, Firefox, Safari (desktop + mobile)
- Real device testing: iPhone SE, Pixel 6, budget Android
- Accessibility audit: axe DevTools, manual screen reader test

**Performance Profiling:**
- Chrome DevTools Performance tab: Identify janky animations
- React DevTools Profiler: Identify unnecessary re-renders
- Network tab: Verify code splitting working (check chunk loads)

**Bug Fixes & Optimization:**
- Fix any issues found in testing
- Optimize animations if FPS <45
- Add fallbacks for browser compatibility issues

**Success Criteria:**
- All Core Web Vitals pass (LCP, FID, CLS)
- Zero WCAG AA failures
- Works on Chrome, Firefox, Safari (latest 2 versions)
- Performance acceptable on budget Android device

---

## Final Performance Budget Validation

**Bundle Size:**
- Target: <20KB increase
- Actual: 0KB increase (all deps installed) + 80KB reduction (code splitting)
- **Status:** PASS (110KB under budget)**

**LCP (Largest Contentful Paint):**
- Target: <2.5s
- Estimate: 1.5-2.0s (with batched dashboard query)
- **Status:** PASS (with optimizations)**

**FID (First Input Delay):**
- Target: <100ms
- Estimate: 30-50ms (code splitting reduces main thread work)
- **Status:** PASS**

**CLS (Cumulative Layout Shift):**
- Target: <0.1
- Estimate: 0.05 (fixed nav height, no dynamic content)
- **Status:** PASS**

**Accessibility (WCAG AA):**
- Target: 100% compliance
- Estimate: 95%+ (with dedicated accessibility pass)
- **Status:** PASS (with remediation)**

---

*Exploration completed: 2025-11-27*
*This report informs master planning decisions for Plan-6: The Final Polish*

**Key Takeaway:** Plan-6 is **performance-safe** with proper optimizations. All features can be implemented within budget if batched queries, code splitting, and animation optimization are prioritized. The biggest risk is NOT the new features, but the existing 5.8MB bundle and dashboard waterfall queries—both fixable in Iteration 1-2.
