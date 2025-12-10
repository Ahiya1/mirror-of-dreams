# Explorer 1 Report: Performance Analysis

## Executive Summary

Analysis of the codebase reveals a confirmed N+1 query pattern in dreams.list, several heavy components that could benefit from lazy loading (particularly PayPal), and opportunities to optimize React Query cache configuration. The most impactful quick wins are fixing the N+1 pattern and lazy loading the PayPal modal.

## Discoveries

### N+1 Query Pattern in Dreams Router

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts` (lines 242-265)

The `dreams.list` procedure has a clear N+1 pattern when `includeStats: true`:

```typescript
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

    return {
      ...dream,
      daysLeft: calculateDaysLeft(dream.target_date),
      reflectionCount: reflectionCount || 0,
      lastReflectionAt: lastReflection?.created_at || null,
    };
  })
);
```

**Impact:**
- For N dreams, this creates 2N database queries (one for count, one for last reflection per dream)
- Dashboard loads multiple DreamsCard instances that all call this endpoint
- Each query adds ~20-50ms of latency

**Solution:** Batch queries using SQL aggregation or Supabase's ability to get counts in a single query.

### Heavy Components for Lazy Loading

#### 1. PayPalCheckoutModal (HIGH PRIORITY)
**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/PayPalCheckoutModal.tsx`

- Imports `@paypal/react-paypal-js` (~45KB gzipped)
- Currently imported statically in `CheckoutButton.tsx` and `PricingCard.tsx`
- Only needed when user actually initiates checkout
- Only 1 file imports PayPal SDK: `PayPalCheckoutModal.tsx`

**Current import chain:**
- `PricingCard` -> `CheckoutButton` (triggers modal)
- Modal loads PayPal script when opened

**Recommendation:** Dynamically import `PayPalCheckoutModal` when needed.

#### 2. EvolutionModal (MEDIUM PRIORITY)
**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dreams/EvolutionModal.tsx`

- Multi-step form with complex state (344 lines)
- Only shown when user clicks "Evolve" on a dream
- Imported statically in `app/dreams/[id]/page.tsx`

#### 3. CreateDreamModal (MEDIUM PRIORITY)
**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dreams/CreateDreamModal.tsx`

- Form modal (~177 lines)
- Imported statically in `app/dreams/page.tsx`
- Only shown when user clicks "Create Dream"

#### 4. UpgradeModal (LOW PRIORITY)
**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/UpgradeModal.tsx`

- Simple modal (~160 lines)
- Shows tier comparison
- Imported in `MirrorExperience.tsx`

### React Query Cache Configuration

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/providers/TRPCProvider.tsx`

Current configuration:
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

**Observations:**
- Global 5-minute staleTime is applied to ALL queries
- No `gcTime` (garbage collection time) configured
- No query-specific configurations

**Issues:**
1. User data (tier, limits) may show stale values after subscription changes
2. No differentiation between frequently-changing data (reflections) and static data (user profile)
3. Dashboard makes multiple parallel queries that could potentially be batched

### Dashboard Query Patterns

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/page.tsx`

The dashboard renders 6-7 cards, each making independent queries:

| Card | Queries Made |
|------|--------------|
| DreamsCard | `dreams.list` + `dreams.getLimits` |
| ReflectionsCard | `reflections.list` |
| ProgressStatsCard | `reflections.list` |
| EvolutionCard | `evolution.list` + `evolution.checkEligibility` |
| VisualizationCard | `visualizations.list` |
| ClarifyCard | `clarify.getLimits` + `clarify.listSessions` |
| SubscriptionCard | (static user data) |
| DashboardHero | `dreams.list` |

**Observations:**
- `dreams.list` is called twice (DreamsCard + DashboardHero)
- React Query deduplication should handle this, but worth verifying
- Each card independently shows loading states, which is good UX

### Bundle Size Opportunities

**Heavy dependencies identified:**
1. `@paypal/react-paypal-js` (~45KB) - Only needed on checkout
2. `framer-motion` (~77 files using it) - Widely used, hard to lazy load
3. `react-markdown` (~28 files) - Used for AI response rendering
4. `canvas` - Server-side only, should not be in client bundle

## Patterns Identified

### Pattern: N+1 Query in List Operations

**Description:** Iterating over a list and making individual database calls for each item.

**Current Implementation:**
```typescript
// Bad: N+1 pattern
const dreamsWithStats = await Promise.all(
  data.map(async (dream) => {
    const { count } = await supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('dream_id', dream.id);
    // ...
  })
);
```

**Recommended Fix:**
```typescript
// Good: Single aggregation query
const dreamIds = data.map(d => d.id);

const { data: stats } = await supabase
  .from('reflections')
  .select('dream_id, created_at')
  .in('dream_id', dreamIds)
  .order('created_at', { ascending: false });

// Group stats by dream_id
const statsByDream = stats?.reduce((acc, r) => {
  if (!acc[r.dream_id]) {
    acc[r.dream_id] = { count: 0, lastReflectionAt: r.created_at };
  }
  acc[r.dream_id].count++;
  return acc;
}, {} as Record<string, { count: number; lastReflectionAt: string }>);
```

### Pattern: Static Modal Import

**Description:** Importing heavy modal components statically even when they're rarely shown.

**Current Implementation:**
```typescript
import { CreateDreamModal } from '@/components/dreams/CreateDreamModal';
```

**Recommended Fix (Next.js dynamic import):**
```typescript
import dynamic from 'next/dynamic';

const CreateDreamModal = dynamic(
  () => import('@/components/dreams/CreateDreamModal').then(mod => mod.CreateDreamModal),
  { loading: () => <ModalSkeleton /> }
);
```

## Complexity Assessment

### High Complexity Areas

**N+1 Query Fix**
- Requires modifying Supabase queries
- Need to handle edge cases (no reflections, null counts)
- Affects DreamsCard, DashboardHero, dreams page
- **Estimated effort:** 1-2 hours
- **Risk:** Low - isolated change

### Medium Complexity Areas

**PayPal Modal Lazy Loading**
- Need to wrap in dynamic import
- Handle loading state during chunk load
- May need Suspense boundary
- **Estimated effort:** 30 minutes

**Query-specific Cache Config**
- Need to identify which queries need different staleTime
- May need to add `gcTime` for better memory management
- **Estimated effort:** 1 hour

### Low Complexity Areas

**Other Modal Lazy Loading**
- Straightforward dynamic imports
- **Estimated effort:** 15 minutes each

## Technology Recommendations

### For N+1 Fix

**Option A: SQL Aggregation (Recommended)**
- Use Supabase's ability to count in a single query
- Most performant solution

**Option B: Database View**
- Create a `dreams_with_stats` view
- More maintainable for complex stats

### For Lazy Loading

**Use Next.js `dynamic()`**
- Built-in code splitting
- SSR support with `ssr: false` option for client-only modals
- Loading component support

### For Cache Configuration

**Tiered Stale Times:**
```typescript
// Frequently changing data
const queryOptions = {
  reflections: { staleTime: 1000 * 60 * 2 },  // 2 minutes
  dreams: { staleTime: 1000 * 60 * 5 },       // 5 minutes (current)
  userProfile: { staleTime: 1000 * 60 * 10 }, // 10 minutes
  staticContent: { staleTime: Infinity },      // Never stale
}
```

## Risks & Challenges

### Technical Risks

**N+1 Fix Migration**
- Risk: Incorrect aggregation could show wrong counts
- Mitigation: Add unit tests for stats calculation
- Mitigation: Compare results with current implementation before deploying

**Lazy Loading Race Conditions**
- Risk: User clicks button before chunk loads
- Mitigation: Show loading state immediately
- Mitigation: Preload on hover for frequently used modals

### Performance Risks

**Cache Invalidation**
- Risk: Users see stale data after mutations
- Mitigation: Use `invalidateQueries` after mutations
- Current code already does this in most places

## Recommendations for Planner

### Quick Wins (Implement First)

1. **Fix N+1 in dreams.list** - Highest impact, affects dashboard performance
   - Single aggregation query instead of N queries
   - File: `server/trpc/routers/dreams.ts`

2. **Lazy load PayPalCheckoutModal** - Large bundle size savings
   - Dynamic import in `CheckoutButton.tsx`
   - Users rarely reach checkout

3. **Add `gcTime` to QueryClient** - Memory optimization
   - Prevents cache from growing indefinitely
   - Add `gcTime: 1000 * 60 * 30` (30 minutes)

### Complex Changes (Consider for Future)

1. **Query-specific cache configuration** - More granular control
2. **Lazy load all modals** - Incremental bundle size savings
3. **Dashboard data prefetching** - Better perceived performance

## Resource Map

### Critical Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `server/trpc/routers/dreams.ts` | Fix N+1 in list procedure | HIGH |
| `components/subscription/CheckoutButton.tsx` | Lazy load PayPal modal | HIGH |
| `components/providers/TRPCProvider.tsx` | Add gcTime, consider query-specific config | MEDIUM |
| `components/dreams/CreateDreamModal.tsx` | Lazy load target | LOW |
| `components/dreams/EvolutionModal.tsx` | Lazy load target | LOW |

### Key Dependencies

| Package | Size | Usage | Lazy Loadable? |
|---------|------|-------|----------------|
| @paypal/react-paypal-js | ~45KB | Checkout only | YES - High priority |
| framer-motion | ~35KB | Widespread | Difficult |
| react-markdown | ~15KB | AI responses | Possible |

### Testing Considerations

- Test dashboard load time before/after N+1 fix
- Verify PayPal checkout still works after lazy loading
- Monitor cache hit rates after config changes

## Questions for Planner

1. Should we implement a dashboard data aggregation endpoint that fetches all card data in one request, rather than individual queries per card?

2. Is there a requirement to show real-time updates on the dashboard? If so, we may need WebSocket subscriptions rather than polling with staleTime.

3. Should we add performance monitoring (e.g., Web Vitals) to track the impact of these optimizations?

4. Are there any upcoming features that would benefit from having the cache configuration refactored now?
