# Iteration 33: Performance & Polish - Builder Tasks

## Builder 1: N+1 Query Fix + Cache Optimization

### Overview
Fix the N+1 query pattern in `dreams.list` and optimize React Query cache configuration.

### Task 1.1: Fix N+1 Pattern in dreams.list

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`

**Location:** Lines 241-268 (the `list` procedure's stats fetching)

**Current Implementation (lines 242-265):**
```typescript
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

      return {
        ...dream,
        daysLeft: calculateDaysLeft(dream.target_date),
        reflectionCount: reflectionCount || 0,
        lastReflectionAt: lastReflection?.created_at || null,
      };
    })
  );

  return dreamsWithStats;
}
```

**New Implementation:**
```typescript
if (input.includeStats && data && data.length > 0) {
  // Get all dream IDs
  const dreamIds = data.map(d => d.id);

  // Single query to get all reflections for all dreams (ordered by created_at desc)
  const { data: allReflections } = await supabase
    .from('reflections')
    .select('dream_id, created_at')
    .in('dream_id', dreamIds)
    .order('created_at', { ascending: false });

  // Group reflections by dream_id and calculate stats
  const statsByDream = (allReflections || []).reduce((acc, reflection) => {
    const dreamId = reflection.dream_id;
    if (!acc[dreamId]) {
      // First reflection we encounter is the most recent (ordered desc)
      acc[dreamId] = {
        count: 0,
        lastReflectionAt: reflection.created_at,
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

  return dreamsWithStats;
}

// Handle empty data array
if (input.includeStats && data && data.length === 0) {
  return [];
}
```

**Edge cases to handle:**
- Empty dreams array (no queries needed)
- Dreams with no reflections (return count: 0, lastReflectionAt: null)
- Null dream_id in reflections (filter out if needed)

**Verification:**
1. Load `/dreams` page with multiple dreams
2. Check Network tab - should see only 2 queries for dreams data
3. Verify reflection counts match actual reflection counts

---

### Task 1.2: Optimize Cache Configuration

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/providers/TRPCProvider.tsx`

**Current Implementation (lines 13-23):**
```typescript
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          refetchOnWindowFocus: true,
        },
      },
    })
);
```

**New Implementation:**
```typescript
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          // Data considered fresh for 5 minutes (no refetch during this time)
          staleTime: 1000 * 60 * 5,

          // Keep inactive query data in cache for 30 minutes
          // After this time, data is garbage collected to free memory
          gcTime: 1000 * 60 * 30,

          // Refetch stale data when window regains focus
          refetchOnWindowFocus: true,

          // Retry failed requests once before showing error
          retry: 1,
        },
      },
    })
);
```

**Why these values:**
- `staleTime: 5 min` - Current value, works well for most data
- `gcTime: 30 min` - Reasonable session length, prevents memory bloat
- `retry: 1` - Quick recovery from transient failures without long waits

---

### Task 1.3: (Optional) Add Query-Specific staleTime

**If time permits, consider adding per-query staleTime in frequently-used hooks:**

**For user profile data (rarely changes):**
```typescript
// In components that fetch user profile
trpc.users.getProfile.useQuery(undefined, {
  staleTime: 1000 * 60 * 10, // 10 minutes
});
```

**For reflection lists (changes more often):**
```typescript
// In ReflectionsCard or similar
trpc.reflections.list.useQuery({ ... }, {
  staleTime: 1000 * 60 * 2, // 2 minutes
});
```

**Note:** This is optional for this iteration. The default 5-minute staleTime is reasonable for most cases.

---

## Builder 2: Lazy Loading + Final Cleanup

### Overview
Implement dynamic imports for modal components to reduce initial bundle size.

### Task 2.1: Lazy Load CreateDreamModal

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/page.tsx`

**Current Import (line 8):**
```typescript
import { CreateDreamModal } from '@/components/dreams/CreateDreamModal';
```

**New Implementation:**
```typescript
import dynamic from 'next/dynamic';

// Add loading skeleton near imports
const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
    <div className="relative z-10 mx-4 w-full max-w-md">
      <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-6 h-8 w-48 rounded bg-white/10" />
        <div className="space-y-4">
          <div className="h-12 w-full rounded-xl bg-white/10" />
          <div className="h-32 w-full rounded-xl bg-white/10" />
          <div className="h-12 w-full rounded-xl bg-white/10" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <div className="h-10 w-24 rounded-lg bg-white/10" />
          <div className="h-10 w-32 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  </div>
);

// Dynamic import
const CreateDreamModal = dynamic(
  () => import('@/components/dreams/CreateDreamModal').then(mod => mod.CreateDreamModal),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);
```

**Usage:** No changes needed - component is used the same way (line 212-216).

---

### Task 2.2: Lazy Load EvolutionModal

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/[id]/page.tsx`

**Current Import (line 9):**
```typescript
import { EvolutionModal } from '@/components/dreams/EvolutionModal';
```

**New Implementation:**
```typescript
import dynamic from 'next/dynamic';

// Reuse or create similar skeleton
const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
    <div className="relative z-10 mx-4 w-full max-w-lg">
      <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-6 h-8 w-48 rounded bg-white/10" />
        <div className="space-y-4">
          <div className="h-24 w-full rounded-xl bg-white/10" />
          <div className="h-12 w-full rounded-xl bg-white/10" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <div className="h-10 w-24 rounded-lg bg-white/10" />
          <div className="h-10 w-32 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  </div>
);

const EvolutionModal = dynamic(
  () => import('@/components/dreams/EvolutionModal').then(mod => mod.EvolutionModal),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);
```

**Usage:** No changes needed (lines 445-458).

---

### Task 2.3: Lazy Load UpgradeModal

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx`

**Current Import (line 17):**
```typescript
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
```

**New Implementation:**
```typescript
import dynamic from 'next/dynamic';

// Simple skeleton for UpgradeModal (smaller modal)
const UpgradeModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
    <div className="relative z-10 mx-4 w-full max-w-md">
      <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 h-8 w-48 rounded bg-white/10" />
        <div className="mb-6 h-16 w-full rounded bg-white/10" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 rounded-lg bg-white/10" />
          <div className="h-48 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  </div>
);

const UpgradeModal = dynamic(
  () => import('@/components/subscription/UpgradeModal').then(mod => mod.UpgradeModal),
  {
    loading: () => <UpgradeModalSkeleton />,
    ssr: false,
  }
);
```

---

### Task 2.4: (Optional) Extract Shared Modal Skeleton

**If the skeleton components become repetitive, consider creating a shared component:**

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/ModalSkeleton.tsx`

```typescript
'use client';

interface ModalSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
}

export function ModalSkeleton({ size = 'md' }: ModalSkeletonProps) {
  const maxWidth = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={`relative z-10 mx-4 w-full ${maxWidth}`}>
        <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-6 h-8 w-48 rounded bg-white/10" />
          <div className="space-y-4">
            <div className="h-12 w-full rounded-xl bg-white/10" />
            <div className="h-24 w-full rounded-xl bg-white/10" />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <div className="h-10 w-24 rounded-lg bg-white/10" />
            <div className="h-10 w-32 rounded-lg bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Note:** This is optional. Inline skeletons are fine for 3 modals.

---

## Verification Checklist

### Builder 1 Verification
- [ ] `dreams.list` with 5 dreams makes only 2 DB queries
- [ ] Reflection counts are accurate
- [ ] Last reflection dates are accurate
- [ ] Empty dreams list returns empty array
- [ ] Dreams with no reflections show count: 0
- [ ] gcTime is set to 30 minutes
- [ ] No TypeScript errors

### Builder 2 Verification
- [ ] Initial page load does NOT include modal chunks
- [ ] Opening CreateDreamModal loads chunk dynamically
- [ ] Opening EvolutionModal loads chunk dynamically
- [ ] Opening UpgradeModal loads chunk dynamically
- [ ] Skeleton shows briefly while chunk loads
- [ ] Modal functions correctly after lazy load
- [ ] No TypeScript errors
- [ ] No console errors

---

## Files Summary

### Builder 1 Files
| File | Changes |
|------|---------|
| `server/trpc/routers/dreams.ts` | Replace N+1 with batch query |
| `components/providers/TRPCProvider.tsx` | Add gcTime, retry config |

### Builder 2 Files
| File | Changes |
|------|---------|
| `app/dreams/page.tsx` | Lazy load CreateDreamModal |
| `app/dreams/[id]/page.tsx` | Lazy load EvolutionModal |
| `app/reflection/MirrorExperience.tsx` | Lazy load UpgradeModal |
| (optional) `components/ui/glass/ModalSkeleton.tsx` | Shared skeleton component |

---

## Notes

1. **No conflicts expected** - Builders work on different files
2. **Test thoroughly** - N+1 fix is critical path for dashboard
3. **Keep skeletons simple** - They're shown briefly, don't over-engineer
4. **PayPalCheckoutModal** - NOT in scope (component exists but unused)
