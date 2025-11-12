# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Landing portal
│   ├── layout.tsx            # Root layout
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx    # Main hub
│   ├── dreams/
│   │   ├── page.tsx          # Dreams list
│   │   └── [id]/page.tsx     # Dream detail
│   ├── reflection/
│   │   ├── page.tsx          # Entry point
│   │   └── MirrorExperience.tsx
│   ├── reflections/
│   │   ├── page.tsx          # Reflections list
│   │   └── [id]/page.tsx     # Reflection detail
│   ├── evolution/
│   │   ├── page.tsx          # Evolution list
│   │   └── [id]/page.tsx     # Report view
│   └── visualizations/
│       ├── page.tsx          # Visualizations list
│       └── [id]/page.tsx     # Narrative view
├── components/
│   ├── ui/glass/             # Glass component system
│   ├── dashboard/cards/      # Dashboard cards
│   ├── dreams/               # Dream components
│   └── reflections/          # Reflection components
├── hooks/
│   ├── useAuth.ts            # Authentication hook
│   └── useDashboard.ts       # Dashboard data (to be simplified)
├── lib/
│   ├── trpc.ts               # tRPC client
│   └── utils.ts              # Utilities
├── server/
│   ├── trpc/
│   │   ├── context.ts        # tRPC context
│   │   ├── trpc.ts           # tRPC instance
│   │   └── routers/          # API routers
│   └── lib/
│       ├── supabase.ts       # Database client
│       ├── cost-calculator.ts
│       └── temporal-distribution.ts
├── supabase/
│   └── migrations/           # Database migrations
├── scripts/
│   └── create-admin-user.js  # Admin setup
├── styles/
│   └── globals.css           # Global styles + Tailwind
└── types/
    └── index.ts              # Shared types
```

## Naming Conventions

**Components:** PascalCase
```typescript
GlassCard.tsx
DreamCard.tsx
MirrorExperience.tsx
```

**Files (non-components):** camelCase
```typescript
useAuth.ts
formatCurrency.ts
supabase.ts
```

**Types/Interfaces:** PascalCase
```typescript
type User = { ... }
interface DreamWithStats { ... }
type TierName = 'free' | 'optimal'
```

**Functions:** camelCase
```typescript
function calculateDaysLeft() { ... }
const fetchUserData = async () => { ... }
```

**Constants:** SCREAMING_SNAKE_CASE
```typescript
const MAX_REFLECTIONS = 4;
const API_TIMEOUT = 60000;
```

**tRPC Routers:** camelCase
```typescript
dreams.create
auth.signin
evolution.generateDreamEvolution
```

## tRPC Patterns

### Router Definition Pattern

**When to use:** Creating a new tRPC router

**Code example:**
```typescript
// server/trpc/routers/dreams.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { createClient } from '@/server/lib/supabase';

export const dreamsRouter = router({
  // List dreams with filters
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['active', 'achieved', 'archived', 'released']).optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const supabase = createClient(ctx.user.id);

      let query = supabase
        .from('dreams')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (input.status) {
        query = query.eq('status', input.status);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      return data;
    }),

  // Create dream with tier limit check
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
      target_date: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createClient(ctx.user.id);

      // Check tier limit via database function
      const { data: canCreate, error: limitError } = await supabase
        .rpc('check_dream_limit', { user_uuid: ctx.user.id });

      if (limitError) throw new Error(limitError.message);
      if (!canCreate) throw new Error('Dream limit reached for your tier');

      // Insert dream
      const { data, error } = await supabase
        .from('dreams')
        .insert({
          user_id: ctx.user.id,
          title: input.title,
          description: input.description,
          target_date: input.target_date,
          category: input.category,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      return data;
    }),
});
```

**Key points:**
- Use `protectedProcedure` for authenticated routes
- Use `publicProcedure` for public routes (signin, signup)
- Always validate input with Zod schemas
- Use `ctx.user` to access authenticated user
- Throw errors with user-friendly messages
- Return typed data (TypeScript infers types)

### Client-Side tRPC Usage Pattern

**When to use:** Calling tRPC endpoints from React components

**Code example:**
```typescript
// app/dreams/page.tsx
'use client';

import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export default function DreamsPage() {
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  // Query: Fetches and caches data
  const { data: dreams, isLoading, error, refetch } = trpc.dreams.list.useQuery({
    status,
    limit: 20,
  });

  // Mutation: Creates/updates data
  const createDream = trpc.dreams.create.useMutation({
    onSuccess: () => {
      // Refetch dreams list after creation
      refetch();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleCreate = async (data: { title: string; description: string }) => {
    createDream.mutate(data);
  };

  if (isLoading) return <CosmicLoader />;
  if (error) return <ErrorMessage>{error.message}</ErrorMessage>;

  return (
    <div>
      {dreams?.map(dream => (
        <DreamCard key={dream.id} dream={dream} />
      ))}
      <CreateDreamButton onCreate={handleCreate} />
    </div>
  );
}
```

**Key points:**
- Use `.useQuery()` for reads (GET-like)
- Use `.useMutation()` for writes (POST/PUT/DELETE-like)
- Queries auto-cache and refetch
- Mutations have onSuccess/onError callbacks
- Loading and error states are built-in
- Refetch queries after mutations

## Database Patterns

### Supabase Query Pattern

**When to use:** Querying database with RLS

**Code example:**
```typescript
// server/lib/supabase.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient(userId?: string) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = userId
    ? process.env.SUPABASE_ANON_KEY!  // User-level (RLS enforced)
    : process.env.SUPABASE_SERVICE_ROLE_KEY!;  // Admin-level (RLS bypassed)

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

// Usage in router:
const supabase = createClient(ctx.user.id);  // RLS enforced
const adminSupabase = createClient();  // RLS bypassed (admin only)
```

**Key points:**
- Use user ID for RLS-protected queries
- Use service role for admin operations
- Always check for errors
- Use `.single()` for single row queries
- Use `.select()` to return inserted data

### Database Function Call Pattern

**When to use:** Calling PostgreSQL functions for complex logic

**Code example:**
```typescript
// Check tier limit via database function
const { data: canCreate, error } = await supabase.rpc('check_dream_limit', {
  user_uuid: ctx.user.id
});

if (error) throw new Error(error.message);
if (!canCreate) throw new Error('Dream limit reached');

// Increment usage counter
const { error: counterError } = await supabase.rpc('increment_usage_counter', {
  p_user_id: ctx.user.id,
  p_month: new Date().toISOString().slice(0, 7), // 'YYYY-MM'
  p_counter_name: 'reflections'
});

if (counterError) throw new Error(counterError.message);
```

**Key points:**
- Database functions encapsulate business logic
- Use `.rpc()` for function calls
- Pass parameters as object
- Check errors after every call
- Functions can return boolean, json, or void

### Migration Pattern

**When to use:** Creating new database migrations

**Code example:**
```sql
-- supabase/migrations/20251112000000_fix_usage_tracking.sql

-- Fix usage_tracking table schema
ALTER TABLE usage_tracking RENAME COLUMN month_year TO month;
ALTER TABLE usage_tracking ALTER COLUMN month TYPE DATE
  USING to_date(month, 'YYYY-MM');

-- Update unique constraint
ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_month_year_key;
ALTER TABLE usage_tracking ADD CONSTRAINT usage_tracking_user_id_month_key
  UNIQUE (user_id, month);

-- Comment for documentation
COMMENT ON COLUMN usage_tracking.month IS 'Month for usage tracking (YYYY-MM-01 format)';
```

**Key points:**
- Name migrations: `YYYYMMDDHHMMSS_description.sql`
- Use IF EXISTS/IF NOT EXISTS for safety
- Add comments for documentation
- Test locally before deploying
- Always have rollback plan

## Frontend Patterns

### Page Component Structure Pattern

**When to use:** Creating new page components

**Code example:**
```typescript
// app/dreams/page.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

export default function DreamsPage() {
  // Local state
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  // Server state via tRPC
  const { data: dreams, isLoading, error } = trpc.dreams.list.useQuery({
    status: filter === 'active' ? 'active' : undefined,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CosmicLoader />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <GlassCard className="max-w-2xl mx-auto mt-20">
        <p className="text-red-400">{error.message}</p>
      </GlassCard>
    );
  }

  // Empty state
  if (dreams?.length === 0) {
    return (
      <GlassCard className="max-w-2xl mx-auto mt-20 text-center">
        <p className="text-gray-400 mb-4">No dreams yet</p>
        <GlowButton href="/dreams/create">Create Your First Dream</GlowButton>
      </GlassCard>
    );
  }

  // Success state
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter controls */}
      <div className="flex gap-4 mb-8">
        <GlowButton
          variant={filter === 'active' ? 'primary' : 'ghost'}
          onClick={() => setFilter('active')}
        >
          Active
        </GlowButton>
        <GlowButton
          variant={filter === 'all' ? 'primary' : 'ghost'}
          onClick={() => setFilter('all')}
        >
          All
        </GlowButton>
      </div>

      {/* Dreams grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dreams.map(dream => (
          <DreamCard key={dream.id} dream={dream} />
        ))}
      </div>
    </div>
  );
}
```

**Key points:**
- Always use 'use client' for interactive pages
- Handle loading, error, empty, and success states
- Use GlassCard for containers
- Use CosmicLoader for loading states
- Grid layout for cards (1/2/3 columns responsive)

### Glass Component Usage Pattern

**When to use:** Using the cosmic glass UI system

**Code example:**
```typescript
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GradientText } from '@/components/ui/glass/GradientText';
import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';

// Glass card with variants
<GlassCard variant="default" className="p-6">
  <h2>Title</h2>
</GlassCard>

<GlassCard variant="elevated" className="p-8">
  <p>Elevated card with more depth</p>
</GlassCard>

// Glow buttons with variants
<GlowButton variant="primary" onClick={handleClick}>
  Primary Action
</GlowButton>

<GlowButton variant="secondary" onClick={handleClick}>
  Secondary Action
</GlowButton>

<GlowButton variant="ghost" onClick={handleClick}>
  Subtle Action
</GlowButton>

// Glass input with character counter
<GlassInput
  label="Dream Title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  maxLength={200}
  showCounter
  placeholder="Enter your dream..."
/>

// Gradient text for emphasis
<GradientText className="text-4xl font-bold">
  Mirror of Dreams
</GradientText>

// Progress orbs for multi-step flows
<ProgressOrbs
  currentStep={2}
  totalSteps={5}
  completedSteps={[1, 2]}
/>
```

**Key points:**
- Always use glass components, never plain HTML elements for UI
- GlassCard is the base container
- GlowButton for all actions
- GlassInput for all text inputs
- GradientText for headings and emphasis
- Consistent cosmic aesthetic across all pages

### Form Handling Pattern

**When to use:** Creating forms with validation

**Code example:**
```typescript
'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { trpc } from '@/lib/trpc';

export default function CreateDreamForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const createDream = trpc.dreams.create.useMutation({
    onSuccess: (data) => {
      router.push(`/dreams/${data.id}`);
    },
    onError: (error) => {
      setErrors({ title: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit to API
    createDream.mutate({ title, description });
  };

  return (
    <GlassCard className="max-w-2xl mx-auto p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassInput
          label="Dream Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors(prev => ({ ...prev, title: undefined }));
          }}
          maxLength={200}
          showCounter
          error={errors.title}
          placeholder="Launch Sustainable Fashion Brand"
        />

        <GlassInput
          label="Description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setErrors(prev => ({ ...prev, description: undefined }));
          }}
          maxLength={2000}
          showCounter
          error={errors.description}
          placeholder="Describe your dream in detail..."
          multiline
          rows={6}
        />

        <GlowButton
          type="submit"
          variant="primary"
          disabled={createDream.isPending}
          className="w-full"
        >
          {createDream.isPending ? 'Creating...' : 'Create Dream'}
        </GlowButton>
      </form>
    </GlassCard>
  );
}
```

**Key points:**
- Controlled components (value + onChange)
- Client-side validation before submission
- Clear error messages
- Disable button during submission
- Clear errors on input change
- Use GlassInput error prop for error display

### API Client Usage Pattern

**When to use:** Calling external APIs (Anthropic)

**Code example:**
```typescript
// server/trpc/routers/reflection.ts
import Anthropic from '@anthropic-ai/sdk';
import { getThinkingBudget } from '@/server/lib/cost-calculator';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const reflectionRouter = router({
  create: protectedProcedure
    .input(z.object({
      dreamId: z.string(),
      answers: z.object({
        dream: z.string(),
        plan: z.string(),
        hasDate: z.string(),
        dreamDate: z.string().optional(),
        relationship: z.string(),
        willing: z.string(),
      }),
      tone: z.enum(['fusion', 'gentle', 'intense']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user tier for thinking budget
      const { data: user } = await supabase
        .from('users')
        .select('tier')
        .eq('id', ctx.user.id)
        .single();

      const thinkingBudget = getThinkingBudget(user.tier);

      // Build prompt from answers
      const prompt = `You are a consciousness companion...

Dream: ${input.answers.dream}
Plan: ${input.answers.plan}
Relationship: ${input.answers.relationship}
Willing to give: ${input.answers.willing}

Generate a reflective response in ${input.tone} tone.`;

      // Call Claude API
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        thinking: thinkingBudget > 0 ? {
          type: 'enabled',
          budget_tokens: thinkingBudget
        } : undefined,
      });

      const response = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Save to database
      const { data: reflection } = await supabase
        .from('reflections')
        .insert({
          user_id: ctx.user.id,
          dream_id: input.dreamId,
          content: response,
          tone: input.tone,
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens,
        })
        .select()
        .single();

      // Increment usage counter
      await supabase.rpc('increment_usage_counter', {
        p_user_id: ctx.user.id,
        p_month: new Date().toISOString().slice(0, 10),
        p_counter_name: 'reflections',
      });

      return { reflectionId: reflection.id, content: response };
    }),
});
```

**Key points:**
- Initialize Anthropic client once (module level)
- Use environment variables for API keys
- Handle thinking budget based on user tier
- Track token usage for cost calculation
- Save all data to database
- Increment usage counters
- Return minimal data to client

## Testing Patterns

### Manual Testing Checklist Pattern

**When to use:** Testing core flows in Iteration 19

**Code example:**
```typescript
// Testing report template (manual execution)

/**
 * CORE FLOW TESTING CHECKLIST
 *
 * Auth Flow:
 * [ ] Sign up with new user
 * [ ] Sign in with existing user
 * [ ] Token persists across refreshes
 * [ ] Sign out clears token
 * [ ] Invalid credentials show error
 *
 * Dreams Flow:
 * [ ] Create dream
 * [ ] View dream in dashboard
 * [ ] Edit dream details
 * [ ] Change dream status
 * [ ] Archive dream
 * [ ] Cannot create beyond tier limit
 *
 * Reflection Flow:
 * [ ] Start reflection from dashboard
 * [ ] Select dream
 * [ ] Answer 5 questions
 * [ ] Select tone
 * [ ] AI generates response (30s wait)
 * [ ] Reflection saved and viewable
 * [ ] Usage counter increments
 * [ ] Cannot create beyond tier limit
 *
 * Dashboard:
 * [ ] All cards load without errors
 * [ ] Data is consistent across cards
 * [ ] Refresh button works
 * [ ] Loading states appear
 * [ ] No console errors
 *
 * Admin User:
 * [ ] Admin can sign in
 * [ ] Admin has unlimited access
 * [ ] Admin can view all data
 */
```

**Key points:**
- Test each flow end-to-end
- Check console for errors
- Verify database updates
- Test tier limits
- Document results

## Error Handling

### API Error Pattern

**When to use:** Handling errors in tRPC routers

**Code example:**
```typescript
import { TRPCError } from '@trpc/server';

export const dreamsRouter = router({
  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check tier limit
        const { data: canCreate, error: limitError } = await supabase
          .rpc('check_dream_limit', { user_uuid: ctx.user.id });

        if (limitError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Database error: ${limitError.message}`,
          });
        }

        if (!canCreate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Dream limit reached for your tier. Upgrade to create more dreams.',
          });
        }

        // Insert dream
        const { data, error } = await supabase
          .from('dreams')
          .insert({ user_id: ctx.user.id, title: input.title })
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create dream: ${error.message}`,
          });
        }

        return data;
      } catch (error) {
        // Re-throw TRPCError as-is
        if (error instanceof TRPCError) throw error;

        // Wrap unknown errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
      }
    }),
});
```

**Key points:**
- Use TRPCError for user-facing errors
- Provide clear, actionable error messages
- Use appropriate error codes (FORBIDDEN, INTERNAL_SERVER_ERROR, etc.)
- Catch and wrap unknown errors
- Don't expose sensitive error details

### User-Facing Error Pattern

**When to use:** Displaying errors in UI

**Code example:**
```typescript
'use client';

import { GlassCard } from '@/components/ui/glass/GlassCard';

export default function DreamsPage() {
  const { data: dreams, error } = trpc.dreams.list.useQuery();

  if (error) {
    return (
      <GlassCard className="max-w-2xl mx-auto mt-20 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Something Went Wrong
          </h2>
          <p className="text-gray-300 mb-6">
            {error.message}
          </p>
          <GlowButton onClick={() => window.location.reload()}>
            Try Again
          </GlowButton>
        </div>
      </GlassCard>
    );
  }

  // ... success state
}
```

**Key points:**
- Show error in GlassCard
- Display error.message
- Provide action (retry, go back)
- Use red color for error text
- Keep message user-friendly

## Import Order Convention

**Standard import order:**
```typescript
// 1. React and Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 2. External libraries
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. tRPC and API
import { trpc } from '@/lib/trpc';

// 4. Components
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { DreamCard } from '@/components/dreams/DreamCard';

// 5. Hooks
import { useAuth } from '@/hooks/useAuth';

// 6. Utilities and types
import { cn } from '@/lib/utils';
import type { Dream, User } from '@/types';

// 7. Styles (if any)
import styles from './page.module.css';
```

## Code Quality Standards

**TypeScript Strict Mode:**
- All code must pass `strict: true` checks
- No `any` types except in migration/legacy code
- Use type inference where possible
- Define explicit return types for exported functions

**Example:**
```typescript
// Good: Explicit return type, no any
export function calculateDaysLeft(targetDate: string | null): number | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Bad: Implicit return, uses any
export function calculateDaysLeft(targetDate: any) {
  if (!targetDate) return null;
  return Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));
}
```

**Component Best Practices:**
- Extract repeated JSX into components
- Keep components under 300 lines (exception: MirrorExperience)
- Use meaningful prop names
- Document complex props with JSDoc

**Example:**
```typescript
interface DreamCardProps {
  /** The dream object to display */
  dream: Dream;
  /** Callback when dream is clicked */
  onClick?: () => void;
  /** Show quick actions (Reflect, Evolution, etc.) */
  showActions?: boolean;
}

export function DreamCard({ dream, onClick, showActions = true }: DreamCardProps) {
  // Component implementation
}
```

## Performance Patterns

**Lazy Loading Heavy Components:**
```typescript
import dynamic from 'next/dynamic';

const MirrorExperience = dynamic(
  () => import('./MirrorExperience'),
  {
    loading: () => <CosmicLoader />,
    ssr: false
  }
);
```

**TanStack Query Caching:**
```typescript
// Cache dreams list for 5 minutes
const { data: dreams } = trpc.dreams.list.useQuery(
  { status: 'active' },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);
```

**Optimistic Updates:**
```typescript
const updateDream = trpc.dreams.update.useMutation({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await utils.dreams.list.cancel();

    // Snapshot previous value
    const previousDreams = utils.dreams.list.getData();

    // Optimistically update
    utils.dreams.list.setData({ status: 'active' }, old =>
      old?.map(d => d.id === newData.id ? { ...d, ...newData } : d)
    );

    return { previousDreams };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    utils.dreams.list.setData({ status: 'active' }, context?.previousDreams);
  },
});
```

## Security Patterns

**Input Sanitization:**
```typescript
// Always validate with Zod
const schema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000).trim(),
});

const input = schema.parse(rawInput); // Throws if invalid
```

**Auth Check Pattern:**
```typescript
// In tRPC context
export async function createContext({ req }) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return { user: null };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return { user: decoded as User };
  } catch {
    return { user: null };
  }
}

// In protected procedure
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } });
});
```

---

**Patterns Status:** COMPLETE
**Usage:** Reference these patterns in all builder tasks
**Updates:** Add new patterns as they emerge during implementation
**Consistency:** ALL code must follow these patterns for cohesive codebase
