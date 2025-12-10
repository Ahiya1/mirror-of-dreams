# Iteration 33: Performance & Polish - Patterns

## Query Optimization Patterns

### Pattern: Batch Aggregation Queries

**Problem:** N+1 query pattern - iterating over N items and making individual DB calls for each.

**Current Anti-Pattern:**
```typescript
// BAD: N+1 pattern - 2N queries for N dreams
const dreamsWithStats = await Promise.all(
  data.map(async (dream) => {
    // Query 1: Count reflections for this dream
    const { count: reflectionCount } = await supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('dream_id', dream.id);

    // Query 2: Get last reflection for this dream
    const { data: lastReflection } = await supabase
      .from('reflections')
      .select('created_at')
      .eq('dream_id', dream.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return { ...dream, reflectionCount, lastReflectionAt: lastReflection?.created_at };
  })
);
```

**Correct Pattern:**
```typescript
// GOOD: 2 queries total regardless of N dreams
const dreamIds = data.map(d => d.id);

// Single query to get all reflections for all dreams
const { data: allReflections } = await supabase
  .from('reflections')
  .select('dream_id, created_at')
  .in('dream_id', dreamIds)
  .order('created_at', { ascending: false });

// Group and aggregate in memory
const statsByDream = (allReflections || []).reduce((acc, reflection) => {
  const dreamId = reflection.dream_id;
  if (!acc[dreamId]) {
    acc[dreamId] = {
      count: 0,
      lastReflectionAt: reflection.created_at, // First one is most recent (ordered desc)
    };
  }
  acc[dreamId].count++;
  return acc;
}, {} as Record<string, { count: number; lastReflectionAt: string | null }>);

// Merge stats with dreams
const dreamsWithStats = data.map(dream => ({
  ...dream,
  daysLeft: calculateDaysLeft(dream.target_date),
  reflectionCount: statsByDream[dream.id]?.count || 0,
  lastReflectionAt: statsByDream[dream.id]?.lastReflectionAt || null,
}));
```

**When to use:**
- Loading list of items that need related data
- Dashboard/feed views
- Any `Promise.all(items.map(async ...)` with DB calls

---

## Lazy Loading Patterns

### Pattern: Next.js Dynamic Import for Modals

**Problem:** Heavy modal components loaded on initial page load even when rarely opened.

**Correct Pattern:**
```typescript
import dynamic from 'next/dynamic';

// Loading component (optional but recommended)
const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
    <div className="relative z-10 mx-4 w-full max-w-md animate-pulse rounded-xl bg-white/10 p-6 h-64" />
  </div>
);

// Dynamic import with loading state
const CreateDreamModal = dynamic(
  () => import('@/components/dreams/CreateDreamModal').then(mod => mod.CreateDreamModal),
  {
    loading: () => <ModalSkeleton />,
    ssr: false  // Modals don't need SSR
  }
);
```

**Usage (unchanged from static import):**
```typescript
// Component usage remains the same
<CreateDreamModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onSuccess={handleCreateSuccess}
/>
```

**Key points:**
- Use `ssr: false` for client-only modals
- Provide loading component for smooth UX
- Named exports require `.then(mod => mod.ComponentName)`
- Keep modal state management unchanged

### Pattern: Conditional Rendering with Lazy Loading

**For modals that are conditionally rendered:**
```typescript
const EvolutionModal = dynamic(
  () => import('@/components/dreams/EvolutionModal').then(mod => mod.EvolutionModal),
  { ssr: false }
);

// Only render when open (modal already handles this internally)
{dream && dream.status === 'active' && (
  <EvolutionModal
    isOpen={isEvolutionModalOpen}
    onClose={() => setIsEvolutionModalOpen(false)}
    onSuccess={() => refetch()}
    dream={dream}
  />
)}
```

---

## Cache Configuration Patterns

### Pattern: Tiered Stale Times

**Problem:** Single global staleTime doesn't match data volatility.

**Correct Pattern:**
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes default
      gcTime: 1000 * 60 * 30,         // 30 minutes garbage collection
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

**Per-query staleTime (in hooks):**
```typescript
// Frequently changing data - shorter staleTime
trpc.reflections.list.useQuery(
  { page: 1, limit: 10 },
  { staleTime: 1000 * 60 * 2 }  // 2 minutes
);

// Rarely changing data - longer staleTime
trpc.users.getProfile.useQuery(
  undefined,
  { staleTime: 1000 * 60 * 10 }  // 10 minutes
);

// Static data - infinite staleTime
trpc.config.getFeatureFlags.useQuery(
  undefined,
  { staleTime: Infinity }
);
```

### Pattern: gcTime Configuration

**What it does:**
- `gcTime` (formerly `cacheTime`) controls how long inactive query data stays in cache
- After this time, data is garbage collected
- Prevents memory bloat from unused queries

**Recommended values:**
```typescript
gcTime: 1000 * 60 * 30  // 30 minutes - good balance
```

**Reasoning:**
- Too short: Frequent refetches for returning users
- Too long: Memory usage grows for long sessions
- 30 minutes: Most users complete their session within this time

---

## Error Handling Patterns

### Pattern: Query Edge Cases

**Handle missing data gracefully:**
```typescript
// When no reflections exist for a dream
const statsByDream = (allReflections || []).reduce((acc, r) => { ... }, {});

// Provide defaults when accessing
reflectionCount: statsByDream[dream.id]?.count || 0,
lastReflectionAt: statsByDream[dream.id]?.lastReflectionAt || null,
```

### Pattern: Empty Array Handling

```typescript
// Safe handling of empty input
if (!dreamIds.length) {
  return data.map(dream => ({
    ...dream,
    daysLeft: calculateDaysLeft(dream.target_date),
    reflectionCount: 0,
    lastReflectionAt: null,
  }));
}
```

---

## Testing Patterns

### Verifying N+1 Fix

**Before:** Count database queries for dashboard load with 5 dreams
- Expected old: 1 (dreams) + 5*2 (stats per dream) = 11 queries

**After:** Same scenario
- Expected new: 1 (dreams) + 1 (all reflections) = 2 queries

### Verifying Lazy Loading

1. Open Network tab in DevTools
2. Load page (modal component should NOT appear in initial bundle)
3. Click to open modal
4. Observe chunk request (e.g., `CreateDreamModal-[hash].js`)
5. Subsequent opens should be instant (cached)

### Verifying Cache Config

1. Load dashboard
2. Wait 5 minutes (data becomes stale)
3. Focus window - should trigger refetch
4. Close tab, wait 31 minutes
5. Reopen - should fetch fresh (gcTime expired)
