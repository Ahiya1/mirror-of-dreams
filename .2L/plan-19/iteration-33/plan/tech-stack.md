# Iteration 33: Performance & Polish - Tech Stack

## Core Technologies

### Supabase Client
- **Package:** `@supabase/supabase-js`
- **Usage:** Database queries in tRPC routers
- **Key Methods:**
  - `.in('column', array)` - Filter by array of values (for batch queries)
  - `.select('*', { count: 'exact', head: true })` - Count-only query
  - `.order('column', { ascending: false })` - Sort results

### Next.js Dynamic Imports
- **Package:** Built-in `next/dynamic`
- **Usage:** Lazy loading modal components

```typescript
import dynamic from 'next/dynamic';

const Component = dynamic(
  () => import('@/path/to/Component').then(mod => mod.Component),
  {
    loading: () => <LoadingState />,
    ssr: false  // Skip server-side rendering
  }
);
```

**Options:**
- `loading`: React component shown while chunk loads
- `ssr`: Whether to render on server (false for client-only components)
- `suspense`: Use React Suspense (alternative to `loading`)

### TanStack Query (React Query)
- **Package:** `@tanstack/react-query` (via tRPC)
- **Current version:** Configured in `TRPCProvider.tsx`

**Key Configuration Options:**
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: number,        // When data is considered stale
      gcTime: number,           // When inactive data is garbage collected
      refetchOnWindowFocus: boolean,
      retry: number | boolean,
    },
  },
});
```

## File Structure

### Files to Modify

```
server/
  trpc/
    routers/
      dreams.ts          # Builder 1: N+1 fix

components/
  providers/
    TRPCProvider.tsx     # Builder 1: Cache configuration

app/
  dreams/
    page.tsx             # Builder 2: CreateDreamModal lazy load
    [id]/
      page.tsx           # Builder 2: EvolutionModal lazy load
  reflection/
    MirrorExperience.tsx # Builder 2: UpgradeModal lazy load
```

## API Reference

### Supabase Batch Query

```typescript
// Fetch reflections for multiple dreams at once
const { data, error } = await supabase
  .from('reflections')
  .select('dream_id, created_at')
  .in('dream_id', dreamIds)  // WHERE dream_id IN (...)
  .order('created_at', { ascending: false });
```

**Result:** Array of all matching reflections

### Next.js Dynamic Import

```typescript
// For named exports (most common in our codebase)
const CreateDreamModal = dynamic(
  () => import('@/components/dreams/CreateDreamModal')
    .then(mod => mod.CreateDreamModal),
  { ssr: false }
);

// For default exports
const Component = dynamic(
  () => import('@/components/Component'),
  { ssr: false }
);
```

### QueryClient Configuration

```typescript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes
      staleTime: 1000 * 60 * 5,

      // Cached data kept for 30 minutes after last use
      gcTime: 1000 * 60 * 30,

      // Refetch when tab regains focus
      refetchOnWindowFocus: true,

      // Retry failed requests once
      retry: 1,
    },
  },
});
```

## Database Schema Reference

### dreams table
```sql
id            UUID PRIMARY KEY
user_id       UUID REFERENCES users(id)
title         TEXT
description   TEXT
target_date   DATE
category      TEXT
status        TEXT ('active', 'achieved', 'archived', 'released')
created_at    TIMESTAMP
```

### reflections table
```sql
id            UUID PRIMARY KEY
user_id       UUID REFERENCES users(id)
dream_id      UUID REFERENCES dreams(id) ON DELETE SET NULL
created_at    TIMESTAMP
-- other fields...
```

**Indexes relevant to this iteration:**
- `reflections.dream_id` - Used for JOIN and IN queries

## Performance Considerations

### N+1 Query Impact

| Scenario | Old (N+1) | New (Batch) | Savings |
|----------|-----------|-------------|---------|
| 2 dreams | 5 queries | 2 queries | 60% |
| 5 dreams | 11 queries | 2 queries | 82% |
| 10 dreams | 21 queries | 2 queries | 90% |

### Lazy Loading Impact

| Component | Size (estimated) | Load Condition |
|-----------|-----------------|----------------|
| CreateDreamModal | ~5KB | User clicks "Create Dream" |
| EvolutionModal | ~10KB | User clicks "Evolve" |
| UpgradeModal | ~4KB | User hits limit |

### Cache Configuration Impact

| Setting | Value | Effect |
|---------|-------|--------|
| staleTime: 5min | Default | Prevents refetch for 5 minutes |
| gcTime: 30min | New | Memory cleanup after 30 minutes idle |
| refetchOnWindowFocus | true | Fresh data when user returns |

## TypeScript Types

### Modal Component Props (existing)
```typescript
interface CreateDreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dream: {
    id: string;
    title: string;
    description?: string;
    target_date?: string;
    category?: string;
  };
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'monthly_limit' | 'daily_limit' | 'feature_locked' | 'dream_limit';
  featureName?: string;
  resetTime?: Date;
  currentTier?: string;
}
```

### Stats Aggregation Type (new)
```typescript
type ReflectionStats = Record<string, {
  count: number;
  lastReflectionAt: string | null;
}>;
```

## Dependencies

No new dependencies required. All features use:
- Built-in Next.js (`next/dynamic`)
- Existing Supabase client
- Existing React Query configuration
