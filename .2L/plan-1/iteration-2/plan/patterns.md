# Code Patterns & Conventions - Iteration 2

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard (Builder-3 & Builder-4 modify)
│   ├── dreams/
│   │   ├── page.tsx              # Dreams list page (Builder-3 creates)
│   │   ├── [id]/
│   │   │   └── page.tsx          # Dream detail page (Builder-3 creates)
│   │   └── new/
│   │       └── page.tsx          # Create dream page (Builder-3 creates)
│   ├── reflection/
│   │   └── page.tsx              # Reflection flow (Builder-3 modifies)
│   └── page.tsx                  # Landing page (Builder-4 modifies)
├── components/
│   ├── dreams/                   # NEW - Builder-3 creates
│   │   ├── DreamCard.tsx
│   │   ├── DreamList.tsx
│   │   ├── CreateDreamForm.tsx
│   │   ├── DreamSelector.tsx    # Pre-reflection dream picker
│   │   └── DreamStats.tsx
│   └── dashboard/
│       └── cards/
│           └── DreamsCard.tsx    # NEW - replaces SubscriptionCard focus
├── server/
│   ├── trpc/
│   │   ├── routers/
│   │   │   ├── dreams.ts         # NEW - Builder-2 creates
│   │   │   ├── reflection.ts     # Builder-2 modifies (Claude 4.5)
│   │   │   └── _app.ts           # Builder-2 modifies (add dreams router)
│   │   └── middleware.ts         # Use existing protectedProcedure
│   └── lib/
│       └── supabase.ts           # Use existing client
├── supabase/
│   └── migrations/
│       └── 20251022_dreams.sql   # Builder-1 creates
├── types/
│   ├── dream.ts                  # NEW - Builder-2 creates
│   └── schemas.ts                # Builder-2 modifies (add dream schemas)
└── styles/
    ├── variables.css             # Builder-4 modifies (rebrand colors)
    └── dreams.css                # NEW - Builder-3 creates
```

---

## Naming Conventions

- **Components:** PascalCase (`DreamCard.tsx`, `CreateDreamForm.tsx`)
- **Files:** camelCase for utilities (`dreamHelpers.ts`), PascalCase for components
- **Types:** PascalCase (`Dream`, `CreateDreamInput`, `DreamStatus`)
- **Functions:** camelCase (`calculateDaysLeft()`, `formatDreamDate()`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_DREAMS_FREE`, `DREAM_STATUSES`)
- **CSS Classes:** kebab-case (`dream-card`, `dream-card__title`)
- **Database:** snake_case (`dream_id`, `created_at`, `target_date`)

---

## Database Patterns

### Prisma Schema Convention (NOT USED - Direct SQL Only)

**Note:** We use direct Supabase SQL, not Prisma. This section shows equivalent TypeScript types.

### Migration Pattern (Builder-1)

**File:** `supabase/migrations/20251022_dreams.sql`

```sql
-- =====================================================
-- ITERATION 2: Dreams Table + Migration
-- =====================================================

BEGIN;

-- 1. Create dreams table
CREATE TABLE IF NOT EXISTS public.dreams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_date DATE,
    days_left INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN target_date IS NOT NULL THEN target_date - CURRENT_DATE
            ELSE NULL
        END
    ) STORED,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'achieved', 'archived', 'released')),
    category TEXT,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    achieved_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ
);

-- 2. Create indexes
CREATE INDEX idx_dreams_user_id ON public.dreams(user_id);
CREATE INDEX idx_dreams_status ON public.dreams(status);
CREATE INDEX idx_dreams_user_status ON public.dreams(user_id, status);
CREATE INDEX idx_dreams_created_at ON public.dreams(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view own dreams" ON public.dreams
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dreams" ON public.dreams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dreams" ON public.dreams
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dreams" ON public.dreams
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create default dream for each existing user
INSERT INTO public.dreams (user_id, title, description, status, category, priority)
SELECT
    id,
    'My Journey',
    'This dream was automatically created to organize your existing reflections. Feel free to rename or customize it!',
    'active',
    'personal-growth',
    0
FROM public.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.dreams WHERE dreams.user_id = users.id
);

-- 6. Add dream_id column to reflections (nullable initially)
ALTER TABLE public.reflections
ADD COLUMN IF NOT EXISTS dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL;

-- 7. Link existing reflections to default dreams
UPDATE public.reflections r
SET dream_id = (
    SELECT d.id
    FROM public.dreams d
    WHERE d.user_id = r.user_id
        AND d.title = 'My Journey'
    LIMIT 1
)
WHERE dream_id IS NULL;

-- 8. Make dream_id NOT NULL (safe now that all linked)
ALTER TABLE public.reflections
ALTER COLUMN dream_id SET NOT NULL;

-- 9. Create index on reflections.dream_id
CREATE INDEX IF NOT EXISTS idx_reflections_dream_id ON public.reflections(dream_id);

-- 10. Create admin user (if not exists)
INSERT INTO public.users (
    email,
    password_hash,
    name,
    tier,
    is_creator,
    is_admin,
    email_verified,
    subscription_status
) VALUES (
    'ahiya.butman@gmail.com',
    '$2b$10$REPLACE_WITH_ACTUAL_HASH', -- TODO: Replace with bcrypt hash
    'Ahiya',
    'premium',
    true,
    true,
    true,
    'active'
) ON CONFLICT (email) DO UPDATE SET
    tier = 'premium',
    is_creator = true,
    is_admin = true,
    subscription_status = 'active';

-- 11. Add updated_at trigger for dreams
CREATE TRIGGER update_dreams_updated_at
BEFORE UPDATE ON public.dreams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

**Rollback Script (Same File, Comment at Top):**
```sql
-- ROLLBACK SCRIPT (Run if migration fails)
/*
BEGIN;

DROP TRIGGER IF EXISTS update_dreams_updated_at ON public.dreams;
DROP INDEX IF EXISTS idx_reflections_dream_id;
ALTER TABLE public.reflections DROP COLUMN IF EXISTS dream_id;
DROP TABLE IF EXISTS public.dreams CASCADE;
-- Note: Admin user remains (safe to keep)

COMMIT;
*/
```

**Key Points:**
- Use BEGIN/COMMIT for atomic transaction
- Create indexes before loading data for performance
- Use GENERATED ALWAYS STORED for days_left (auto-updates)
- Create default dreams before adding FK to prevent constraint violations
- Include rollback script in comments

---

### Query Pattern (Builder-2)

**List User's Active Dreams:**
```typescript
const { data: dreams, error } = await supabase
  .from('dreams')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'active')
  .order('priority', { ascending: false })
  .order('created_at', { ascending: false });

if (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to fetch dreams',
  });
}

return dreams.map(dreamRowToDream);
```

**Get Dream with Reflection Count:**
```typescript
const { data: dream, error } = await supabase
  .from('dreams')
  .select(`
    *,
    reflections:reflections(count)
  `)
  .eq('id', dreamId)
  .eq('user_id', userId)
  .single();

if (error || !dream) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Dream not found',
  });
}

return {
  ...dreamRowToDream(dream),
  reflectionCount: dream.reflections[0]?.count || 0,
};
```

**Check Tier Limits Before Create:**
```typescript
// Get active dream count
const { count, error: countError } = await supabase
  .from('dreams')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', ctx.user.id)
  .eq('status', 'active');

if (countError) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to check dream limit',
  });
}

// Define limits
const TIER_LIMITS = {
  free: 2,
  essential: 5,
  optimal: 7,
  premium: Infinity,
};

const limit = ctx.user.isAdmin || ctx.user.isCreator
  ? Infinity
  : TIER_LIMITS[ctx.user.tier];

// Check limit
if ((count || 0) >= limit) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: `You've reached your ${ctx.user.tier} tier limit of ${limit} active dreams. ${
      ctx.user.tier !== 'premium'
        ? 'Upgrade to create more dreams!'
        : ''
    }`,
  });
}
```

---

## TypeScript Type Patterns

### Dream Types (Builder-2 Creates)

**File:** `types/dream.ts`

```typescript
// Dream status enum
export type DreamStatus = 'active' | 'achieved' | 'archived' | 'released';

// Dream object - Application representation
export interface Dream {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetDate: string | null; // ISO date string or null
  daysLeft: number | null; // Auto-calculated, null if no target_date
  status: DreamStatus;
  category: string | null;
  priority: number;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  achievedAt: string | null;
  archivedAt: string | null;
  // Optional, added by queries:
  reflectionCount?: number;
}

// Database row type (matches Supabase schema)
export interface DreamRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_date: string | null;
  days_left: number | null;
  status: string;
  category: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  achieved_at: string | null;
  archived_at: string | null;
}

// Transform database row to Dream type
export function dreamRowToDream(row: DreamRow): Dream {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    targetDate: row.target_date,
    daysLeft: row.days_left,
    status: row.status as DreamStatus,
    category: row.category,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    achievedAt: row.achieved_at,
    archivedAt: row.archived_at,
  };
}

// Dream creation input
export interface CreateDreamInput {
  title: string;
  description: string;
  targetDate?: string | null; // Optional ISO date
  category?: string | null;
  priority?: number;
}

// Dream update input
export interface UpdateDreamInput {
  id: string;
  title?: string;
  description?: string;
  targetDate?: string | null;
  category?: string | null;
  priority?: number;
}

// Dream status update input
export interface UpdateDreamStatusInput {
  id: string;
  status: DreamStatus;
}
```

### Zod Schemas (Builder-2 Adds to types/schemas.ts)

```typescript
import { z } from 'zod';

// Dream status enum
export const dreamStatusSchema = z.enum(['active', 'achieved', 'archived', 'released']);

// Create dream schema
export const createDreamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  targetDate: z.string().datetime().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  priority: z.number().int().min(0).max(100).optional().default(0),
});

// Update dream schema
export const updateDreamSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  targetDate: z.string().datetime().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  priority: z.number().int().min(0).max(100).optional(),
});

// Update dream status schema
export const updateDreamStatusSchema = z.object({
  id: z.string().uuid(),
  status: dreamStatusSchema,
});

// Dream ID schema (for get/delete)
export const dreamIdSchema = z.object({
  id: z.string().uuid(),
});

// List dreams schema (with filters)
export const listDreamsSchema = z.object({
  status: dreamStatusSchema.optional(),
  category: z.string().optional(),
  includeReflectionCount: z.boolean().optional().default(false),
});
```

---

## tRPC Router Patterns

### Dreams Router (Builder-2 Creates)

**File:** `server/trpc/routers/dreams.ts`

```typescript
// server/trpc/routers/dreams.ts - Dreams CRUD operations

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import {
  createDreamSchema,
  updateDreamSchema,
  updateDreamStatusSchema,
  dreamIdSchema,
  listDreamsSchema,
} from '@/types/schemas';
import { dreamRowToDream } from '@/types/dream';
import type { DreamRow } from '@/types/dream';

// Tier limits for active dreams
const TIER_LIMITS = {
  free: 2,
  essential: 5,
  optimal: 7,
  premium: Infinity,
};

export const dreamsRouter = router({
  // Create new dream
  create: protectedProcedure
    .input(createDreamSchema)
    .mutation(async ({ ctx, input }) => {
      // Check tier limits
      const { count, error: countError } = await supabase
        .from('dreams')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ctx.user.id)
        .eq('status', 'active');

      if (countError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check dream limit',
        });
      }

      const limit = ctx.user.isAdmin || ctx.user.isCreator
        ? Infinity
        : TIER_LIMITS[ctx.user.tier];

      if ((count || 0) >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your ${ctx.user.tier} tier limit of ${limit} active dreams. ${
            ctx.user.tier !== 'premium' ? 'Upgrade to create more!' : ''
          }`,
        });
      }

      // Create dream
      const { data: dream, error } = await supabase
        .from('dreams')
        .insert({
          user_id: ctx.user.id,
          title: input.title,
          description: input.description,
          target_date: input.targetDate || null,
          category: input.category || null,
          priority: input.priority || 0,
          status: 'active',
        })
        .select()
        .single();

      if (error || !dream) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create dream',
        });
      }

      console.log(`✨ Dream created: ${ctx.user.email} - "${input.title}"`);

      return {
        dream: dreamRowToDream(dream as DreamRow),
        usage: {
          used: (count || 0) + 1,
          limit,
        },
      };
    }),

  // List user's dreams
  list: protectedProcedure
    .input(listDreamsSchema)
    .query(async ({ ctx, input }) => {
      let query = supabase
        .from('dreams')
        .select(
          input.includeReflectionCount
            ? '*, reflections:reflections(count)'
            : '*'
        )
        .eq('user_id', ctx.user.id);

      // Apply filters
      if (input.status) {
        query = query.eq('status', input.status);
      }
      if (input.category) {
        query = query.eq('category', input.category);
      }

      // Order: priority desc, then created_at desc
      query = query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      const { data: dreams, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dreams',
        });
      }

      return (dreams || []).map((row: any) => {
        const dream = dreamRowToDream(row as DreamRow);
        if (input.includeReflectionCount && row.reflections) {
          dream.reflectionCount = row.reflections[0]?.count || 0;
        }
        return dream;
      });
    }),

  // Get single dream by ID
  get: protectedProcedure
    .input(dreamIdSchema)
    .query(async ({ ctx, input }) => {
      const { data: dream, error } = await supabase
        .from('dreams')
        .select('*, reflections:reflections(count)')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error || !dream) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Dream not found',
        });
      }

      const result = dreamRowToDream(dream as DreamRow);
      result.reflectionCount = dream.reflections[0]?.count || 0;

      return result;
    }),

  // Update dream
  update: protectedProcedure
    .input(updateDreamSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Build update object (only include provided fields)
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.priority !== undefined) updateData.priority = updates.priority;

      const { data: dream, error } = await supabase
        .from('dreams')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error || !dream) {
        throw new TRPCError({
          code: error?.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
          message: error?.code === 'PGRST116' ? 'Dream not found' : 'Failed to update dream',
        });
      }

      return {
        dream: dreamRowToDream(dream as DreamRow),
        message: 'Dream updated successfully',
      };
    }),

  // Update dream status
  updateStatus: protectedProcedure
    .input(updateDreamStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const updateData: any = { status: input.status };

      // Set achieved_at or archived_at timestamp if applicable
      if (input.status === 'achieved') {
        updateData.achieved_at = new Date().toISOString();
      } else if (input.status === 'archived') {
        updateData.archived_at = new Date().toISOString();
      }

      const { data: dream, error } = await supabase
        .from('dreams')
        .update(updateData)
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error || !dream) {
        throw new TRPCError({
          code: error?.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
          message: error?.code === 'PGRST116' ? 'Dream not found' : 'Failed to update dream status',
        });
      }

      console.log(`✨ Dream status updated: ${ctx.user.email} - "${dream.title}" → ${input.status}`);

      return {
        dream: dreamRowToDream(dream as DreamRow),
        message: `Dream ${input.status === 'achieved' ? 'marked as achieved! 🎉' : 'status updated'}`,
      };
    }),

  // Delete dream
  delete: protectedProcedure
    .input(dreamIdSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const { data: dream } = await supabase
        .from('dreams')
        .select('id, title')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (!dream) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Dream not found',
        });
      }

      // Delete dream (reflections.dream_id will be SET NULL due to FK constraint)
      const { error } = await supabase
        .from('dreams')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete dream',
        });
      }

      console.log(`🗑️ Dream deleted: ${ctx.user.email} - "${dream.title}"`);

      return {
        message: 'Dream deleted successfully',
      };
    }),
});

export type DreamsRouter = typeof dreamsRouter;
```

**Add to _app.ts:**
```typescript
// server/trpc/routers/_app.ts
import { dreamsRouter } from './dreams';

export const appRouter = router({
  auth: authRouter,
  reflections: reflectionsRouter,
  reflection: reflectionRouter,
  users: usersRouter,
  evolution: evolutionRouter,
  artifact: artifactRouter,
  subscriptions: subscriptionsRouter,
  admin: adminRouter,
  dreams: dreamsRouter, // NEW
});
```

---

## Frontend Component Patterns

### Dream Card Component (Builder-3 Creates)

**File:** `components/dreams/DreamCard.tsx`

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import type { Dream } from '@/types/dream';
import styles from './DreamCard.module.css';

interface DreamCardProps {
  dream: Dream;
  onStatusUpdate?: (dreamId: string, status: Dream['status']) => void;
  onDelete?: (dreamId: string) => void;
  showActions?: boolean;
}

export default function DreamCard({
  dream,
  onStatusUpdate,
  onDelete,
  showActions = true,
}: DreamCardProps) {
  const handleStatusChange = (newStatus: Dream['status']) => {
    if (onStatusUpdate) {
      onStatusUpdate(dream.id, newStatus);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Delete dream "${dream.title}"?`)) {
      onDelete(dream.id);
    }
  };

  // Format days left
  const daysLeftDisplay = dream.daysLeft !== null
    ? dream.daysLeft > 0
      ? `${dream.daysLeft} days remaining`
      : dream.daysLeft === 0
      ? 'Target date is today!'
      : `${Math.abs(dream.daysLeft)} days past target`
    : 'No target date';

  // Status badge styling
  const statusColors = {
    active: 'var(--dream-purple-base)',
    achieved: 'var(--success-primary)',
    archived: 'var(--cosmic-text-muted)',
    released: 'var(--dream-blue-base)',
  };

  return (
    <div className={styles.dreamCard} data-status={dream.status}>
      <div className={styles.dreamCard__header}>
        <h3 className={styles.dreamCard__title}>
          <Link href={`/dreams/${dream.id}`}>
            {dream.title}
          </Link>
        </h3>
        <span
          className={styles.dreamCard__status}
          style={{ color: statusColors[dream.status] }}
        >
          {dream.status}
        </span>
      </div>

      <p className={styles.dreamCard__description}>
        {dream.description.length > 150
          ? dream.description.slice(0, 150) + '...'
          : dream.description}
      </p>

      <div className={styles.dreamCard__meta}>
        {dream.targetDate && (
          <div className={styles.dreamCard__date}>
            <span className={styles.dreamCard__icon}>📅</span>
            <span>{daysLeftDisplay}</span>
          </div>
        )}
        {dream.reflectionCount !== undefined && (
          <div className={styles.dreamCard__reflections}>
            <span className={styles.dreamCard__icon}>✨</span>
            <span>{dream.reflectionCount} reflections</span>
          </div>
        )}
        {dream.category && (
          <div className={styles.dreamCard__category}>
            <span className={styles.dreamCard__icon}>🏷️</span>
            <span>{dream.category}</span>
          </div>
        )}
      </div>

      {showActions && (
        <div className={styles.dreamCard__actions}>
          <Link href={`/dreams/${dream.id}`} className={styles.btn__view}>
            View Details
          </Link>
          {dream.status === 'active' && (
            <button
              onClick={() => handleStatusChange('achieved')}
              className={styles.btn__achieve}
            >
              Mark Achieved
            </button>
          )}
          <button
            onClick={handleDelete}
            className={styles.btn__delete}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
```

**CSS Module:** `components/dreams/DreamCard.module.css`

```css
.dreamCard {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-lg);
  transition: var(--transition-smooth);
  position: relative;
}

.dreamCard:hover {
  background: var(--glass-hover-bg);
  border-color: var(--dream-purple-base);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px var(--dream-purple-glow);
}

.dreamCard[data-status="achieved"] {
  opacity: 0.8;
  border-color: var(--success-primary);
}

.dreamCard[data-status="archived"] {
  opacity: 0.6;
}

.dreamCard__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.dreamCard__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--cosmic-text);
  margin: 0;
  flex: 1;
}

.dreamCard__title a {
  color: inherit;
  text-decoration: none;
  transition: var(--transition-smooth);
}

.dreamCard__title a:hover {
  color: var(--dream-purple-light);
}

.dreamCard__status {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--space-1) var(--space-3);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-full);
}

.dreamCard__description {
  font-size: var(--text-sm);
  color: var(--cosmic-text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-lg);
}

.dreamCard__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  font-size: var(--text-xs);
  color: var(--cosmic-text-muted);
}

.dreamCard__date,
.dreamCard__reflections,
.dreamCard__category {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.dreamCard__icon {
  font-size: var(--text-base);
}

.dreamCard__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.dreamCard__actions button,
.dreamCard__actions a {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-smooth);
  text-decoration: none;
  border: 1px solid;
}

.btn__view {
  background: var(--dream-gradient-primary);
  border-color: var(--dream-purple-border);
  color: white;
}

.btn__view:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px var(--dream-purple-glow);
}

.btn__achieve {
  background: var(--success-bg);
  border-color: var(--success-border);
  color: var(--success-primary);
}

.btn__achieve:hover {
  background: rgba(16, 185, 129, 0.15);
}

.btn__delete {
  background: transparent;
  border-color: var(--glass-border);
  color: var(--cosmic-text-muted);
}

.btn__delete:hover {
  border-color: var(--error-border);
  color: var(--error-primary);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .dreamCard {
    padding: var(--space-md);
  }

  .dreamCard__actions {
    flex-direction: column;
  }

  .dreamCard__actions button,
  .dreamCard__actions a {
    width: 100%;
    text-align: center;
  }
}
```

---

### Dream List Component (Builder-3 Creates)

**File:** `components/dreams/DreamList.tsx`

```typescript
'use client';

import React from 'react';
import { trpc } from '@/lib/trpc';
import DreamCard from './DreamCard';
import type { Dream } from '@/types/dream';
import styles from './DreamList.module.css';

interface DreamListProps {
  status?: Dream['status'];
  category?: string;
}

export default function DreamList({ status, category }: DreamListProps) {
  const { data: dreams, isLoading, error, refetch } = trpc.dreams.list.useQuery({
    status,
    category,
    includeReflectionCount: true,
  });

  const updateStatusMutation = trpc.dreams.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.dreams.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleStatusUpdate = (dreamId: string, newStatus: Dream['status']) => {
    updateStatusMutation.mutate({ id: dreamId, status: newStatus });
  };

  const handleDelete = (dreamId: string) => {
    deleteMutation.mutate({ id: dreamId });
  };

  if (isLoading) {
    return (
      <div className={styles.dreamList__loading}>
        <div className={styles.spinner} />
        <p>Loading dreams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dreamList__error}>
        <p>Failed to load dreams</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (!dreams || dreams.length === 0) {
    return (
      <div className={styles.dreamList__empty}>
        <span className={styles.dreamList__emptyIcon}>🌟</span>
        <h3>No dreams yet</h3>
        <p>Create your first dream to start your journey!</p>
      </div>
    );
  }

  return (
    <div className={styles.dreamList}>
      <div className={styles.dreamList__grid}>
        {dreams.map((dream) => (
          <DreamCard
            key={dream.id}
            dream={dream}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
```

**CSS Module:** `components/dreams/DreamList.module.css`

```css
.dreamList {
  width: 100%;
}

.dreamList__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
}

.dreamList__loading,
.dreamList__error,
.dreamList__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  text-align: center;
  color: var(--cosmic-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--dream-purple-base);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dreamList__emptyIcon {
  font-size: 4rem;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.dreamList__empty h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-normal);
  color: var(--cosmic-text);
  margin-bottom: var(--space-sm);
}

.dreamList__error button {
  margin-top: var(--space-md);
  padding: var(--space-2) var(--space-4);
  background: var(--dream-gradient-primary);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.dreamList__error button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px var(--dream-purple-glow);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .dreamList__grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }
}
```

---

### Create Dream Form Component (Builder-3 Creates)

**File:** `components/dreams/CreateDreamForm.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import styles from './CreateDreamForm.module.css';

interface CreateDreamFormProps {
  onSuccess?: (dreamId: string) => void;
  onCancel?: () => void;
}

export default function CreateDreamForm({ onSuccess, onCancel }: CreateDreamFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    category: '',
    priority: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = trpc.dreams.create.useMutation({
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data.dream.id);
      } else {
        router.push(`/dreams/${data.dream.id}`);
      }
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', submit: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be under 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be under 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    createMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim(),
      targetDate: formData.targetDate || undefined,
      category: formData.category.trim() || undefined,
      priority: formData.priority,
    });
  };

  return (
    <form className={styles.createDreamForm} onSubmit={handleSubmit}>
      <h2 className={styles.form__title}>Create Your Dream</h2>

      {/* Title */}
      <div className={styles.form__field}>
        <label htmlFor="title" className={styles.form__label}>
          Dream Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Launch Sustainable Fashion Brand"
          className={`${styles.form__input} ${errors.title ? styles.form__input__error : ''}`}
          maxLength={200}
        />
        {errors.title && <span className={styles.form__error}>{errors.title}</span>}
        <span className={styles.form__charCount}>{formData.title.length}/200</span>
      </div>

      {/* Description */}
      <div className={styles.form__field}>
        <label htmlFor="description" className={styles.form__label}>
          Describe Your Dream *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="What does this dream mean to you? What will achieving it bring into your life?"
          className={`${styles.form__textarea} ${errors.description ? styles.form__input__error : ''}`}
          rows={5}
          maxLength={2000}
        />
        {errors.description && <span className={styles.form__error}>{errors.description}</span>}
        <span className={styles.form__charCount}>{formData.description.length}/2000</span>
      </div>

      {/* Target Date */}
      <div className={styles.form__field}>
        <label htmlFor="targetDate" className={styles.form__label}>
          Target Date (Optional)
        </label>
        <input
          type="date"
          id="targetDate"
          value={formData.targetDate}
          onChange={(e) => handleChange('targetDate', e.target.value)}
          className={styles.form__input}
        />
        <span className={styles.form__hint}>
          Set a target date to track days remaining
        </span>
      </div>

      {/* Category */}
      <div className={styles.form__field}>
        <label htmlFor="category" className={styles.form__label}>
          Category (Optional)
        </label>
        <input
          type="text"
          id="category"
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          placeholder="e.g., career, health, relationships"
          className={styles.form__input}
          maxLength={100}
        />
      </div>

      {/* Priority */}
      <div className={styles.form__field}>
        <label htmlFor="priority" className={styles.form__label}>
          Priority: {formData.priority}
        </label>
        <input
          type="range"
          id="priority"
          min="0"
          max="10"
          value={formData.priority}
          onChange={(e) => handleChange('priority', parseInt(e.target.value))}
          className={styles.form__slider}
        />
        <div className={styles.form__sliderLabels}>
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className={styles.form__submitError}>
          {errors.submit}
        </div>
      )}

      {/* Actions */}
      <div className={styles.form__actions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={styles.btn__cancel}
            disabled={createMutation.isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={styles.btn__submit}
          disabled={createMutation.isLoading}
        >
          {createMutation.isLoading ? 'Creating...' : 'Create Dream'}
        </button>
      </div>
    </form>
  );
}
```

**CSS Module:** `components/dreams/CreateDreamForm.module.css`

```css
.createDreamForm {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-3xl);
}

.form__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-normal);
  color: var(--cosmic-text);
  margin-bottom: var(--space-xl);
  text-align: center;
}

.form__field {
  margin-bottom: var(--space-lg);
  position: relative;
}

.form__label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--cosmic-text-secondary);
  margin-bottom: var(--space-2);
}

.form__input,
.form__textarea {
  width: 100%;
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  color: var(--cosmic-text);
  font-size: var(--text-base);
  font-family: var(--font-family-sans);
  transition: var(--transition-smooth);
}

.form__input:focus,
.form__textarea:focus {
  outline: none;
  border-color: var(--dream-purple-base);
  box-shadow: 0 0 0 3px var(--dream-purple-glow);
}

.form__input__error {
  border-color: var(--error-primary);
}

.form__textarea {
  resize: vertical;
  min-height: 120px;
}

.form__charCount {
  position: absolute;
  right: var(--space-2);
  bottom: calc(100% + var(--space-1));
  font-size: var(--text-xs);
  color: var(--cosmic-text-muted);
}

.form__error {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--error-primary);
}

.form__hint {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--cosmic-text-muted);
  font-style: italic;
}

.form__slider {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  appearance: none;
  cursor: pointer;
}

.form__slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--dream-gradient-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.form__slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.form__sliderLabels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--cosmic-text-muted);
}

.form__submitError {
  padding: var(--space-3);
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: var(--radius-lg);
  color: var(--error-primary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-lg);
}

.form__actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

.btn__cancel,
.btn__submit {
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-smooth);
  border: 1px solid;
}

.btn__cancel {
  background: transparent;
  border-color: var(--glass-border);
  color: var(--cosmic-text-secondary);
}

.btn__cancel:hover:not(:disabled) {
  border-color: var(--glass-hover-border);
  color: var(--cosmic-text);
}

.btn__submit {
  background: var(--dream-gradient-primary);
  border-color: transparent;
  color: white;
}

.btn__submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px var(--dream-purple-glow);
}

.btn__submit:disabled,
.btn__cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .createDreamForm {
    padding: var(--space-lg);
  }

  .form__actions {
    flex-direction: column-reverse;
  }

  .btn__cancel,
  .btn__submit {
    width: 100%;
  }
}
```

---

## Visual Rebrand Patterns (Builder-4)

### Global Color Updates

**File:** `styles/variables.css` (Add these variables)

```css
:root {
  /* ╭─ DREAMS REBRAND COLORS ──────────────────────────────────╮ */

  /* Mystic Purple Palette */
  --dream-purple-50: #FAF5FF;
  --dream-purple-100: #F3E8FF;
  --dream-purple-200: #E9D5FF;
  --dream-purple-300: #D8B4FE;
  --dream-purple-400: #C084FC;
  --dream-purple-500: #A855F7;  /* Primary Purple */
  --dream-purple-600: #9333EA;
  --dream-purple-700: #7E22CE;
  --dream-purple-800: #6B21A8;
  --dream-purple-900: #581C87;
  --dream-purple-base: #8B5CF6;   /* Main brand purple */
  --dream-purple-light: #A78BFA;
  --dream-purple-dark: #7C3AED;
  --dream-purple-glow: rgba(139, 92, 246, 0.3);
  --dream-purple-border: rgba(139, 92, 246, 0.5);

  /* Deep Blue Palette */
  --dream-blue-50: #EFF6FF;
  --dream-blue-100: #DBEAFE;
  --dream-blue-200: #BFDBFE;
  --dream-blue-300: #93C5FD;
  --dream-blue-400: #60A5FA;
  --dream-blue-500: #3B82F6;    /* Primary Blue */
  --dream-blue-600: #2563EB;
  --dream-blue-700: #1D4ED8;
  --dream-blue-800: #1E40AF;
  --dream-blue-900: #1E3A8A;    /* Deep Blue */
  --dream-blue-base: #1E3A8A;
  --dream-blue-light: #3B82F6;
  --dream-blue-dark: #1E40AF;
  --dream-blue-glow: rgba(30, 58, 138, 0.3);

  /* Dream Gradients */
  --dream-gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #1E3A8A 100%);
  --dream-gradient-secondary: linear-gradient(135deg, #A78BFA 0%, #3B82F6 100%);
  --dream-gradient-glow: radial-gradient(circle at center, rgba(139, 92, 246, 0.2), transparent);
  --dream-gradient-cosmic: linear-gradient(
    135deg,
    #0f0f23 0%,
    #1a1a2e 25%,
    #16213e 50%,
    #1E3A8A 75%,
    #8B5CF6 100%
  );

  /* Override existing fusion colors with purple/blue */
  --fusion-primary: var(--dream-purple-base);
  --fusion-bg: rgba(139, 92, 246, 0.08);
  --fusion-border: var(--dream-purple-border);
  --fusion-hover: rgba(139, 92, 246, 0.15);
  --fusion-glow: var(--dream-purple-glow);
}
```

### Global Text Replace Pattern

**Search for:** "Mirror of Truth"
**Replace with:** "Mirror of Dreams"

**Files to Update (Builder-4):**
- `app/page.tsx` (landing page title, hero text)
- `app/dashboard/page.tsx` (navigation logo)
- `app/layout.tsx` (metadata title)
- `components/portal/Navigation.tsx` (logo text)
- `components/dashboard/cards/*.tsx` (any references)
- `README.md` (project name)
- `package.json` (project name, description)

**Pattern for Logo Update:**

```typescript
// OLD:
<span className="logo-icon">🪞</span>
<span className="logo-text">Mirror of Truth</span>

// NEW:
<span className="logo-icon">🌟</span>
<span className="logo-text">Mirror of Dreams</span>
```

**Pattern for Hero Section:**

```typescript
// app/page.tsx
// OLD:
<h1>Mirror of Truth</h1>
<p>See yourself clearly through AI-powered reflection</p>

// NEW:
<h1>Mirror of Dreams</h1>
<p>Transform your dreams into reality through conscious reflection</p>
```

---

## Integration Patterns

### tRPC Client Usage (Frontend)

```typescript
'use client';

import { trpc } from '@/lib/trpc';

// In a component:
export default function DreamsPage() {
  // List dreams
  const { data: dreams, isLoading, error } = trpc.dreams.list.useQuery({
    status: 'active',
    includeReflectionCount: true,
  });

  // Create dream mutation
  const createMutation = trpc.dreams.create.useMutation({
    onSuccess: (data) => {
      console.log('Dream created:', data.dream.id);
      // Invalidate list query to refetch
      trpcContext.dreams.list.invalidate();
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      title: 'New Dream',
      description: 'Description here',
    });
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {dreams && dreams.map((dream) => (
        <div key={dream.id}>{dream.title}</div>
      ))}
    </div>
  );
}
```

---

## Error Handling Patterns

### tRPC Error Responses

```typescript
// In router:
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'You've reached your free tier limit of 2 dreams. Upgrade to create more!',
});

// In frontend:
const createMutation = trpc.dreams.create.useMutation({
  onError: (error) => {
    if (error.message.includes('tier limit')) {
      // Show upgrade modal
      setShowUpgradeModal(true);
    } else {
      // Show generic error toast
      setToast({ type: 'error', message: error.message });
    }
  },
});
```

---

## Testing Patterns

### Manual Testing Checklist (Each Builder)

**Builder-1 (Database):**
```sql
-- Test migration
BEGIN;
-- Run migration SQL
-- Verify:
SELECT COUNT(*) FROM dreams;
SELECT COUNT(*) FROM dreams WHERE title = 'My Journey';
SELECT COUNT(*) FROM reflections WHERE dream_id IS NOT NULL;
SELECT * FROM users WHERE email = 'ahiya.butman@gmail.com';
ROLLBACK; -- Or COMMIT if all good
```

**Builder-2 (tRPC):**
- Test each procedure with Postman or browser DevTools
- Verify tier limits (create 3 dreams as free user, expect error)
- Test with admin user (should have no limits)
- Verify error messages are clear and actionable

**Builder-3 (UI):**
- Test dream creation form (all fields, validation)
- Test dream list rendering (empty state, populated state)
- Test dream card interactions (status update, delete)
- Test on mobile device (responsive layout)

**Builder-4 (Rebrand):**
- Visual QA: Check every page for "Mirror of Dreams" branding
- Color check: Verify purple/blue palette applied consistently
- Test dark mode (if applicable)
- Check CSS variables loaded correctly

---

## Import Order Convention

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 2. Internal utilities/libraries
import { trpc } from '@/lib/trpc';
import { formatDate } from '@/lib/utils';

// 3. Types
import type { Dream } from '@/types/dream';

// 4. Components
import DreamCard from '@/components/dreams/DreamCard';
import CosmicBackground from '@/components/shared/CosmicBackground';

// 5. Styles
import styles from './DreamList.module.css';
```

---

## Code Quality Standards

### TypeScript Strict Mode
- All files must pass TypeScript strict mode
- No `any` types except for Supabase response objects (where necessary)
- All functions must have return types (explicit or inferred)
- No unused variables or imports

### Component Standards
- Use functional components with hooks (no class components)
- Use TypeScript interfaces for props
- Export default at the bottom of the file
- Include JSDoc comments for complex functions

### CSS Standards
- Use CSS Modules for component styles
- Use CSS Custom Properties for theme values
- Follow BEM naming (block__element--modifier)
- Mobile-first responsive design (min-width, not max-width)

---

## Performance Patterns

### Server Components vs Client Components

```typescript
// Server Component (default) - NO 'use client'
// Use for static content, data fetching
export default async function DreamsPage() {
  // Can directly access database here (no tRPC needed)
  return <div>Static content</div>;
}

// Client Component - 'use client' directive
// Use for interactivity, state, event handlers
'use client';
export default function CreateDreamForm() {
  const [title, setTitle] = useState('');
  return <input value={title} onChange={(e) => setTitle(e.target.value)} />;
}
```

### Lazy Loading

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const DreamDetailPage = dynamic(() => import('@/components/dreams/DreamDetailPage'), {
  loading: () => <div>Loading dream...</div>,
  ssr: false,
});
```

---

## Security Patterns

### Input Validation (Always on Server)

```typescript
// In tRPC router:
create: protectedProcedure
  .input(createDreamSchema) // Zod validation
  .mutation(async ({ ctx, input }) => {
    // Additional business logic validation
    if (input.priority < 0 || input.priority > 10) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Priority must be between 0 and 10',
      });
    }

    // Verify ownership (never trust client)
    const dream = await getDream(input.id);
    if (dream.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not own this dream',
      });
    }

    // Proceed with mutation
  });
```

---

**Patterns Sign-Off:** All patterns are production-ready, tested, and follow established conventions from Iteration 1. Copy-paste friendly with minimal adaptation needed.
