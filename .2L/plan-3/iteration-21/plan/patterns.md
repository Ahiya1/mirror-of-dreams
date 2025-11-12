# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── page.tsx                    # Landing page (portal)
│   ├── dashboard/
│   │   └── page.tsx                # Main dashboard (user hub)
│   ├── onboarding/
│   │   └── page.tsx                # NEW: 3-step onboarding wizard
│   ├── auth/
│   │   ├── signup/page.tsx
│   │   └── signin/page.tsx
│   ├── dreams/
│   │   ├── page.tsx                # Dreams list
│   │   └── [id]/page.tsx           # Dream detail
│   ├── evolution/
│   │   ├── page.tsx                # Evolution reports list
│   │   └── [id]/page.tsx           # Report detail
│   ├── visualizations/
│   │   ├── page.tsx                # Visualizations list
│   │   └── [id]/page.tsx           # Visualization detail
│   └── reflection/
│       └── MirrorExperience.tsx    # Immersive reflection flow
├── components/
│   ├── ui/glass/                   # Glass UI components
│   │   ├── GlassCard.tsx
│   │   ├── GlowButton.tsx
│   │   ├── GradientText.tsx
│   │   ├── CosmicLoader.tsx
│   │   ├── ProgressOrbs.tsx
│   │   └── index.ts
│   ├── shared/                     # NEW: Shared app-wide components
│   │   ├── AppNavigation.tsx       # NEW: Shared navigation
│   │   ├── Toast.tsx               # NEW: Toast notifications
│   │   ├── EmptyState.tsx          # NEW: Standardized empty states
│   │   └── CosmicBackground.tsx
│   ├── dashboard/
│   │   ├── cards/                  # Dashboard cards
│   │   └── shared/                 # Dashboard utilities
│   └── portal/                     # Landing page components
├── hooks/
│   ├── useAuth.ts                  # Authentication hook
│   ├── useDashboard.ts             # Dashboard data hook
│   ├── useToast.ts                 # NEW: Toast hook
│   └── useStaggerAnimation.ts      # Stagger animation hook
├── contexts/
│   └── ToastContext.tsx            # NEW: Toast provider
├── server/
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   └── prompts.ts              # AI prompts
│   └── trpc/
│       ├── routers/
│       │   ├── auth.ts
│       │   ├── users.ts            # MODIFIED: Add completeOnboarding
│       │   ├── dreams.ts
│       │   ├── reflection.ts
│       │   ├── evolution.ts
│       │   └── visualizations.ts
│       ├── trpc.ts
│       ├── context.ts
│       └── middleware.ts
├── lib/
│   ├── animations/
│   │   └── variants.ts             # Framer Motion variants
│   └── utils.ts                    # Utility functions (cn, etc.)
├── styles/
│   ├── globals.css                 # Global styles + Tailwind
│   └── dashboard.css               # Dashboard-specific styles
├── types/
│   ├── index.ts                    # Core types
│   ├── schemas.ts                  # Zod schemas
│   └── glass-components.ts         # Glass UI prop types
└── supabase/
    └── migrations/
        └── YYYYMMDD_add_onboarding_flag.sql  # NEW: Onboarding migration
```

---

## Naming Conventions

**Components:**
- PascalCase: `AppNavigation.tsx`, `ToastProvider.tsx`, `EmptyState.tsx`
- Suffix "Page" for page components: `OnboardingPage`, `DashboardPage`

**Files:**
- camelCase for utilities: `useToast.ts`, `formatCurrency.ts`
- PascalCase for components: `GlassCard.tsx`, `CosmicLoader.tsx`

**Types:**
- PascalCase: `User`, `Dream`, `Reflection`, `EvolutionReport`
- Suffix "Props" for component props: `GlassCardProps`, `ToastProps`

**Functions:**
- camelCase: `generateReflectionPrompt()`, `handleOnboardingComplete()`
- Prefix "handle" for event handlers: `handleNext()`, `handleSkip()`

**Constants:**
- SCREAMING_SNAKE_CASE: `JWT_SECRET`, `MAX_RETRIES`, `FREE_TIER_REFLECTIONS`

**CSS Classes:**
- Tailwind utilities (kebab-case): `backdrop-blur-xl`, `from-purple-600`
- Custom classes (kebab-case): `crystal-glass`, `mirror-corner`, `hover-glow`

---

## API Patterns

### Pattern 1: tRPC Mutation (Protected)

**When to use:** Any authenticated action (create, update, delete)

**Code example:**
```typescript
// server/trpc/routers/users.ts
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { z } from 'zod';

export const usersRouter = router({
  // NEW: Complete onboarding endpoint
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', ctx.user.id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete onboarding',
      });
    }

    return { success: true, user: data };
  }),

  // Example: Update profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      language: z.enum(['en', 'es', 'fr']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('users')
        .update(input)
        .eq('id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }

      return { success: true, user: data };
    }),
});
```

**Key points:**
- Use `protectedProcedure` for authenticated endpoints (ctx.user available)
- Always return `{ success: true, ...data }` for consistency
- Use TRPCError with descriptive messages
- Include `.select()` to get updated data back
- Input validation with Zod schemas

---

### Pattern 2: tRPC Query (Data Fetching)

**When to use:** Fetch data without mutations

**Code example:**
```typescript
// server/trpc/routers/dreams.ts
export const dreamsRouter = router({
  // List all user's dreams
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabase
      .from('dreams')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dreams',
      });
    }

    return data || [];
  }),

  // Get single dream by ID
  getById: protectedProcedure
    .input(z.object({ dreamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('id', input.dreamId)
        .eq('user_id', ctx.user.id) // Security: ensure user owns dream
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Dream not found',
        });
      }

      return data;
    }),
});
```

**Key points:**
- Use `.query()` instead of `.mutation()`
- Always filter by `user_id` for security (except admin endpoints)
- Return empty array `[]` for list queries if no data
- Use `.single()` for get-by-id queries
- NOT_FOUND error for missing resources

---

### Pattern 3: Client-Side tRPC Call

**When to use:** Frontend components calling backend APIs

**Code example:**
```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlowButton } from '@/components/ui/glass';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Mutation hook
  const completeOnboarding = trpc.users.completeOnboarding.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Failed to complete onboarding:', error);
      // Fallback: redirect anyway (user experience > data consistency)
      router.push('/dashboard');
    },
  });

  const handleComplete = () => {
    completeOnboarding.mutate();
  };

  return (
    <div>
      {/* ... onboarding steps ... */}
      <GlowButton
        onClick={handleComplete}
        disabled={completeOnboarding.isLoading}
      >
        {completeOnboarding.isLoading ? 'Completing...' : 'Continue to Dashboard'}
      </GlowButton>
    </div>
  );
}
```

**Key points:**
- Import `trpc` from `@/lib/trpc`
- Use `.useMutation()` for mutations, `.useQuery()` for queries
- Handle `onSuccess` and `onError` callbacks
- Show loading state with `isLoading` property
- Disable buttons during loading
- Always have error fallback (graceful degradation)

---

## Database Patterns

### Pattern 4: Supabase Migration

**When to use:** Adding columns, creating tables, altering schema

**Code example:**
```sql
-- supabase/migrations/20251113_add_onboarding_flag.sql

-- Add onboarding tracking columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Admin users skip onboarding (already know product)
UPDATE users
SET onboarding_completed = TRUE
WHERE is_admin = TRUE OR is_creator = TRUE;

-- Create index for frequent queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
ON users(onboarding_completed);

-- Rollback script (comment out, keep for reference)
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed_at;
-- DROP INDEX IF EXISTS idx_users_onboarding_completed;
```

**Key points:**
- Use timestamp format for migration filenames: `YYYYMMDD_description.sql`
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Include rollback script as comments
- Update existing data if needed (admin users skip onboarding)
- Create indexes for frequently queried columns

---

### Pattern 5: Supabase Query Pattern

**When to use:** Every database interaction

**Code example:**
```typescript
import { supabase } from '@/server/lib/supabase';

// INSERT
const { data: newDream, error: insertError } = await supabase
  .from('dreams')
  .insert({
    user_id: userId,
    title: 'Launch Sustainable Fashion Brand',
    description: 'Create eco-friendly clothing line',
    target_date: '2025-12-31',
    status: 'active',
  })
  .select()
  .single();

// UPDATE
const { data: updatedDream, error: updateError } = await supabase
  .from('dreams')
  .update({ status: 'achieved' })
  .eq('id', dreamId)
  .eq('user_id', userId) // Security: ensure user owns resource
  .select()
  .single();

// SELECT (single)
const { data: dream, error: selectError } = await supabase
  .from('dreams')
  .select('*')
  .eq('id', dreamId)
  .eq('user_id', userId)
  .single();

// SELECT (list with filter)
const { data: dreams, error: listError } = await supabase
  .from('dreams')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10);

// SELECT (count)
const { count, error: countError } = await supabase
  .from('reflections')
  .select('*', { count: 'exact', head: true })
  .eq('dream_id', dreamId)
  .eq('user_id', userId);

// DELETE (soft delete preferred)
const { error: deleteError } = await supabase
  .from('dreams')
  .update({ status: 'archived' }) // Soft delete
  .eq('id', dreamId)
  .eq('user_id', userId);
```

**Key points:**
- Destructure `{ data, error }` from every query
- Always `.select()` after INSERT/UPDATE to get result
- Use `.single()` when expecting one row
- Always filter by `user_id` for security (except admin queries)
- Use `.order()` and `.limit()` for lists
- Prefer soft delete (update status) over hard delete

---

## Frontend Patterns

### Pattern 6: Glass UI Component Structure

**When to use:** Every page component

**Code example:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText,
  AnimatedBackground,
} from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

export default function ExamplePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // tRPC query
  const { data: items, isLoading: queryLoading } = trpc.example.list.useQuery();

  useEffect(() => {
    if (!queryLoading) setIsLoading(false);
  }, [queryLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <GradientText className="text-4xl font-bold mb-2">
            Page Title
          </GradientText>
          <p className="text-white/60">Page description</p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <GlassCard variant="default" hoverable>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/70 mb-4">{item.description}</p>
                <GlowButton onClick={() => router.push(`/example/${item.id}`)}>
                  View Details
                </GlowButton>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Key points:**
- Always use `'use client'` directive for interactive pages
- Import glass components from `@/components/ui/glass`
- Use CosmicLoader for loading states
- Use AnimatedBackground for cosmic aesthetic
- Use Framer Motion for entrance animations
- Use responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Stagger animations with delay (index * 0.1)

---

### Pattern 7: Onboarding Multi-Step Wizard

**When to use:** Multi-step flows (onboarding, forms, wizards)

**Code example:**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlassCard,
  GlowButton,
  ProgressOrbs,
  GradientText,
  AnimatedBackground,
} from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

interface OnboardingStep {
  title: string;
  content: string;
  visual: string; // Emoji
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const completeOnboarding = trpc.users.completeOnboarding.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Failed to complete onboarding:', error);
      // Graceful fallback
      router.push('/dashboard');
    },
  });

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to Mirror of Dreams',
      content:
        'This is not a productivity tool. This is a consciousness companion.\n\nYour dreams hold the mirror to who you\'re becoming. We reflect your journey back to you—soft, sharp, and true.',
      visual: '🌙',
    },
    {
      title: 'How Reflections Work',
      content:
        'Every few days, answer 5 deep questions about your dream:\n\n1. What is your dream?\n2. What is your plan?\n3. Have you set a date?\n4. What\'s your relationship with this dream?\n5. What are you willing to give in return?\n\nAfter 4 reflections, your Mirror reveals the patterns you couldn\'t see.',
      visual: '✨',
    },
    {
      title: 'Your Free Tier',
      content:
        'Your free tier includes:\n✓ 2 dreams to explore\n✓ 4 reflections per month\n✓ 1 evolution report per month (after 4 reflections)\n✓ 1 visualization per month\n\nStart free. Upgrade only if you fall in love.',
      visual: '🌱',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding.mutate();
    }
  };

  const handleSkip = () => {
    completeOnboarding.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-4">
      <AnimatedBackground />

      <GlassCard className="max-w-2xl w-full p-8" variant="elevated">
        {/* Progress Indicator */}
        <ProgressOrbs
          steps={steps.length}
          currentStep={step}
          className="mb-8 justify-center"
        />

        {/* Step Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            {/* Visual Emoji */}
            <div className="text-6xl mb-4">{steps[step].visual}</div>

            {/* Title */}
            <GradientText className="text-3xl font-bold mb-4">
              {steps[step].title}
            </GradientText>

            {/* Content */}
            <p className="text-lg text-white/80 whitespace-pre-line">
              {steps[step].content}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-center">
          <GlowButton
            variant="ghost"
            onClick={handleSkip}
            disabled={completeOnboarding.isLoading}
          >
            Skip
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={handleNext}
            disabled={completeOnboarding.isLoading}
          >
            {completeOnboarding.isLoading
              ? 'Completing...'
              : step < steps.length - 1
              ? 'Next'
              : 'Continue to Dashboard'}
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}
```

**Key points:**
- Use ProgressOrbs for step indicator
- AnimatePresence with mode="wait" for smooth transitions
- Store steps in array of objects
- Handle "Next" and "Skip" separately
- Call mutation on final step or skip
- Disable buttons during loading
- Graceful error handling (redirect anyway if fails)

---

### Pattern 8: Shared Navigation Component

**When to use:** Every authenticated app page (dashboard, dreams, evolution, etc.)

**Code example:**
```typescript
// components/shared/AppNavigation.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, RefreshCw, LogOut, User, Settings, HelpCircle, Crown } from 'lucide-react';
import { GlassCard, GlowButton, GlowBadge } from '@/components/ui/glass';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AppNavigationProps {
  currentPage: 'dashboard' | 'dreams' | 'evolution' | 'visualizations' | 'admin';
  onRefresh?: () => void;
}

export function AppNavigation({ currentPage, onRefresh }: AppNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Journey', href: '/dashboard', key: 'dashboard' },
    { label: 'Dreams', href: '/dreams', key: 'dreams' },
    { label: 'Evolution', href: '/evolution', key: 'evolution' },
    { label: 'Visualizations', href: '/visualizations', key: 'visualizations' },
  ];

  // Add admin link if user is admin
  if (user?.is_admin) {
    navLinks.push({ label: 'Admin', href: '/admin', key: 'admin' });
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <GlassCard variant="default" className="sticky top-0 z-50 mb-6">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="text-2xl">🌙</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-indigo-300 transition-all duration-300 hidden md:inline">
            Mirror of Dreams
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-lg transition-all duration-300',
                'border border-white/8',
                currentPage === link.key
                  ? 'bg-white/12 border-white/20 text-white'
                  : 'bg-white/4 text-white/70 hover:bg-white/8 hover:border-white/15 hover:text-white/90'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side: Refresh + User Menu */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          {onRefresh && (
            <GlowButton
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="hidden md:flex"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden lg:inline">Refresh</span>
            </GlowButton>
          )}

          {/* Upgrade Button (if free tier) */}
          {user?.tier === 'free' && (
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => router.push('/subscription')}
              className="hidden md:flex"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden lg:inline">Upgrade</span>
            </GlowButton>
          )}

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/8 hover:bg-white/12 transition-all duration-300 border border-white/10 hover:border-white/20"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-white/90 text-sm font-medium hidden sm:inline">
                {user?.name}
              </span>
              <GlowBadge variant={user?.tier === 'optimal' ? 'premium' : 'free'}>
                {user?.tier}
              </GlowBadge>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-mirror-dark/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
                >
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/8 transition-all text-white/80 hover:text-white"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/8 transition-all text-white/80 hover:text-white"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    {user?.tier === 'free' && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push('/subscription');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/8 transition-all text-purple-400 hover:text-purple-300"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Upgrade to Optimal</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/help');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/8 transition-all text-white/80 hover:text-white"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Help & Support</span>
                    </button>
                    <div className="h-px bg-white/10 my-2" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all text-red-400 hover:text-red-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-lg bg-white/8 hover:bg-white/12 transition-all"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    'px-4 py-3 rounded-lg transition-all duration-300',
                    currentPage === link.key
                      ? 'bg-white/12 text-white font-medium'
                      : 'bg-white/4 text-white/70 hover:bg-white/8 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
```

**Usage in pages:**
```typescript
// app/dreams/page.tsx
import { AppNavigation } from '@/components/shared/AppNavigation';

export default function DreamsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
      <AppNavigation currentPage="dreams" />
      {/* Page content */}
    </div>
  );
}
```

**Key points:**
- Extract navigation from dashboard
- Use currentPage prop for active state highlighting
- Support mobile menu with AnimatePresence
- User menu with dropdown (profile, settings, upgrade, signout)
- Admin link conditional on user.is_admin
- Refresh button optional (onRefresh prop)
- Close dropdown on outside click (useRef + useEffect)

---

## Testing Patterns

### Pattern 9: Manual End-to-End Test (Sarah's Journey)

**When to use:** Before marking iteration complete

**Checklist:**
```markdown
## Sarah's Journey Test (Day 0-8)

### Day 0: Discovery & Setup
- [ ] Visit landing page (/)
- [ ] Click "Start Free" button
- [ ] Fill signup form (name, email, password)
- [ ] Submit form
- [ ] See "Account created! Redirecting..." message
- [ ] Redirect to /onboarding (Step 1)
- [ ] See "Welcome to Mirror of Dreams" title
- [ ] See moon emoji (🌙)
- [ ] See ProgressOrbs (1/3 active)
- [ ] Click "Next" button
- [ ] See Step 2: "How Reflections Work"
- [ ] See ProgressOrbs (2/3 active)
- [ ] Click "Next" button
- [ ] See Step 3: "Your Free Tier"
- [ ] See ProgressOrbs (3/3 active)
- [ ] Click "Continue to Dashboard"
- [ ] Redirect to /dashboard
- [ ] See dashboard with navigation header
- [ ] See "Welcome, [Name]" greeting
- [ ] Click "Create Dream" button
- [ ] Fill dream form: "Launch Sustainable Fashion Brand"
- [ ] Submit dream
- [ ] See dream card in dashboard
- [ ] Click "Reflect Now" button
- [ ] Complete 5-question reflection
- [ ] See AI response (Sacred Fusion tone)
- [ ] Return to dashboard
- [ ] See dream card shows "1 reflection"

### Day 2: Building Rhythm
- [ ] Sign in with same user
- [ ] Should skip onboarding (go straight to dashboard)
- [ ] Click "Reflect" on fashion brand dream
- [ ] Complete second reflection
- [ ] See "2 more reflections to unlock evolution report" message

### Day 6: Breakthrough Moment
- [ ] Complete 3rd reflection
- [ ] See "1 more reflection to unlock" message
- [ ] Complete 4th reflection
- [ ] See "Evolution Report Available!" notification
- [ ] Click "Generate Evolution Report" button
- [ ] See CosmicLoader with "Generating evolution report..." message
- [ ] Wait 20-30 seconds
- [ ] See evolution report with markdown formatting
- [ ] Report has section headers, bold text, insights
- [ ] Report analyzes language evolution, consciousness shifts
- [ ] Click "Generate Visualization" button
- [ ] See CosmicLoader with "Generating visualization..." message
- [ ] Wait 15-25 seconds
- [ ] See achievement narrative: "December 31, 2025: I'm standing in..."
- [ ] Narrative feels immersive and emotional

### Day 8: Tier Decision
- [ ] Try to create 5th reflection in first month
- [ ] See toast notification: "You've reached Free tier limit (4/4 reflections)"
- [ ] See Optimal tier benefits in SubscriptionCard
- [ ] Understand upgrade path clearly

### Navigation Consistency
- [ ] From dashboard, click "Dreams" nav link
- [ ] See Dreams page with AppNavigation header
- [ ] Navigation shows "Dreams" as active
- [ ] Click "Evolution" nav link
- [ ] See Evolution page with AppNavigation header
- [ ] Click user menu dropdown
- [ ] See Profile, Settings, Upgrade, Help, Sign Out options
- [ ] Click "Sign Out"
- [ ] Redirect to landing page

### Error Handling
- [ ] No alert() dialogs anywhere (all replaced with toasts)
- [ ] All error messages use toast notifications
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Can manually dismiss toast with X button

### TypeScript & Build
- [ ] Run: npx tsc --noEmit (should pass with 0 errors)
- [ ] Run: npm run build (should succeed)
- [ ] Browser console: 0 errors during entire flow
```

---

## Error Handling Patterns

### Pattern 10: Toast Notification System

**When to use:** All user-facing errors, success messages, warnings

**Code example:**
```typescript
// contexts/ToastContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '@/components/shared/Toast';
import { AnimatePresence } from 'framer-motion';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: ToastMessage['type'], message: string, duration = 5000) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: ToastMessage = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              type={toast.type}
              message={toast.message}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return {
    success: (message: string, duration?: number) => context.showToast('success', message, duration),
    error: (message: string, duration?: number) => context.showToast('error', message, duration),
    warning: (message: string, duration?: number) => context.showToast('warning', message, duration),
    info: (message: string, duration?: number) => context.showToast('info', message, duration),
  };
}
```

```typescript
// components/shared/Toast.tsx
'use client';

import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
}

export function Toast({ type, message, onDismiss }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const colors = {
    success: 'border-green-500/30 bg-green-950/50',
    error: 'border-red-500/30 bg-red-950/50',
    warning: 'border-yellow-500/30 bg-yellow-950/50',
    info: 'border-blue-500/30 bg-blue-950/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl',
        'border backdrop-blur-xl shadow-2xl',
        'max-w-sm w-full',
        colors[type]
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>

      {/* Message */}
      <p className="flex-1 text-sm text-white/90 leading-relaxed">{message}</p>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-white/60" />
      </button>
    </motion.div>
  );
}
```

**Usage:**
```typescript
'use client';

import { useToast } from '@/contexts/ToastContext';
import { GlowButton } from '@/components/ui/glass';

export default function ExampleComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Dream created successfully!');
  };

  const handleError = () => {
    toast.error('Failed to generate evolution report', 7000); // Custom duration
  };

  return (
    <div>
      <GlowButton onClick={handleSuccess}>Success</GlowButton>
      <GlowButton onClick={handleError}>Error</GlowButton>
    </div>
  );
}
```

**Key points:**
- Replace ALL alert() calls with toast.success() / toast.error()
- Toast auto-dismisses after 5 seconds (customizable)
- Manual dismiss with X button
- AnimatePresence for smooth exit
- Bottom-right positioning
- 4 types: success (green), error (red), warning (yellow), info (blue)
- Glass morphism styling consistent with app

---

## Import Order Convention

```typescript
// 1. External libraries (React, Next.js, etc.)
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// 2. tRPC and API utilities
import { trpc } from '@/lib/trpc';

// 3. Hooks
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useToast } from '@/hooks/useToast';

// 4. Components (UI, shared, specific)
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText,
  AnimatedBackground,
} from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import WelcomeSection from '@/components/dashboard/shared/WelcomeSection';

// 5. Utilities and helpers
import { cn } from '@/lib/utils';

// 6. Types
import type { User, Dream, Reflection } from '@/types';

// 7. Styles (if any)
import '@/styles/custom.css';
```

---

## Code Quality Standards

**Standard: Error Boundaries**
- Wrap client components with error boundaries (future improvement)
- Current: Graceful fallbacks in onError callbacks

**Standard: Loading States**
- Always show CosmicLoader during data fetching
- Always disable buttons during mutations
- Always show loading text ("Generating...", "Saving...", "Loading...")

**Standard: Accessibility**
- Use semantic HTML (button, nav, main, section)
- Add ARIA labels to icons (aria-label="Close")
- Support keyboard navigation (Enter, Escape keys)
- Respect prefers-reduced-motion (Framer Motion handles automatically)

**Standard: Type Safety**
- Use TypeScript strict mode
- Define interfaces for all component props
- Use Zod schemas for all API inputs
- No `any` types (except unavoidable external libraries)

**Standard: Security**
- Always filter queries by user_id
- Validate all inputs with Zod
- Use protected procedures for authenticated endpoints
- Never trust client-side data

---

## Performance Patterns

### Pattern 11: React Query Caching

**When to use:** tRPC queries that fetch the same data repeatedly

**Code example:**
```typescript
// tRPC query with caching
const { data: dreams, isLoading } = trpc.dreams.list.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes (data considered fresh)
  cacheTime: 10 * 60 * 1000, // 10 minutes (data kept in cache)
  refetchOnWindowFocus: false, // Don't refetch when window regains focus
});
```

**Key points:**
- staleTime: How long data is considered fresh
- cacheTime: How long data stays in cache
- refetchOnWindowFocus: Prevent excessive API calls

---

### Pattern 12: Optimistic Updates

**When to use:** Mutations where success is likely (create, update)

**Code example:**
```typescript
const utils = trpc.useContext();

const createDream = trpc.dreams.create.useMutation({
  onMutate: async (newDream) => {
    // Cancel outgoing refetches
    await utils.dreams.list.cancel();

    // Snapshot previous value
    const previousDreams = utils.dreams.list.getData();

    // Optimistically update cache
    utils.dreams.list.setData(undefined, (old) => [
      ...(old || []),
      { id: 'temp-id', ...newDream, created_at: new Date().toISOString() },
    ]);

    return { previousDreams };
  },
  onError: (err, newDream, context) => {
    // Rollback on error
    utils.dreams.list.setData(undefined, context?.previousDreams);
    toast.error('Failed to create dream');
  },
  onSuccess: () => {
    toast.success('Dream created successfully!');
  },
  onSettled: () => {
    // Refetch to get real data
    utils.dreams.list.invalidate();
  },
});
```

---

## Security Patterns

### Pattern 13: User-Owned Resource Check

**When to use:** Every query/mutation that accesses user-specific data

**Code example:**
```typescript
// server/trpc/routers/dreams.ts
export const dreamsRouter = router({
  getById: protectedProcedure
    .input(z.object({ dreamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('id', input.dreamId)
        .eq('user_id', ctx.user.id) // CRITICAL: Verify ownership
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Dream not found or access denied',
        });
      }

      return data;
    }),
});
```

**Key points:**
- ALWAYS filter by ctx.user.id
- Use .eq('user_id', ctx.user.id) in every query
- Exception: Admin endpoints (check is_admin flag instead)

---

**Document Status:** COMPLETE
**Iteration:** 21 (Plan plan-3)
**Created:** 2025-11-13
**Next:** builder-tasks.md (task breakdown for 2 builders)
