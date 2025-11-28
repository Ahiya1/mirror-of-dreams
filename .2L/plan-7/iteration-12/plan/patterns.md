# Code Patterns & Conventions - Iteration 12

## File Structure

```
mirror-of-dreams/
├── app/                         # Next.js App Router pages
│   ├── page.tsx                 # Landing page (MODIFY in Iteration 12)
│   ├── dashboard/page.tsx       # Protected dashboard
│   ├── dreams/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── reflections/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── api/
│   │   └── trpc/[trpc]/route.ts # tRPC HTTP adapter
│   └── layout.tsx               # Root layout with providers
│
├── components/
│   ├── ui/glass/                # Design system (REUSE)
│   │   ├── GlassCard.tsx
│   │   ├── GlassInput.tsx
│   │   ├── GlowButton.tsx
│   │   └── GlassModal.tsx
│   ├── shared/                  # Shared components
│   │   ├── CosmicBackground.tsx
│   │   ├── AppNavigation.tsx
│   │   ├── EmptyState.tsx
│   │   └── DemoBanner.tsx       # NEW in Iteration 12
│   ├── landing/                 # Landing page components (MODIFY)
│   │   ├── LandingHero.tsx
│   │   └── LandingFeatureCard.tsx
│   └── providers/
│       └── TRPCProvider.tsx
│
├── server/
│   ├── trpc/
│   │   ├── routers/
│   │   │   ├── _app.ts          # Root router
│   │   │   ├── auth.ts          # EXTEND: Add loginDemo
│   │   │   ├── users.ts
│   │   │   ├── dreams.ts
│   │   │   └── reflections.ts
│   │   ├── context.ts
│   │   └── middleware.ts
│   └── lib/
│       ├── supabase.ts          # Database client
│       └── redis.ts             # NEW (optional): Redis cache
│
├── scripts/                     # NEW folder
│   ├── seed-demo-user.ts        # Demo user seeding
│   ├── generate-demo-content.ts # AI content generation
│   └── convert-to-webp.js       # Image optimization
│
├── supabase/
│   └── migrations/
│       └── 20251128_iteration_12_demo_infrastructure.sql  # NEW
│
├── types/
│   ├── user.ts                  # EXTEND: Add isDemo flag
│   └── schemas.ts               # Zod validation schemas
│
└── public/
    └── landing/                 # NEW folder
        ├── dashboard-demo.webp  # Screenshot 1
        ├── reflection-demo.webp # Screenshot 2
        └── evolution-demo.webp  # Screenshot 3
```

---

## Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|------------|---------|
| **React Components** | PascalCase, `.tsx` extension | `DemoBanner.tsx`, `AccountInfoForm.tsx` |
| **Pages** | lowercase, `page.tsx` | `app/profile/page.tsx` |
| **Utilities** | camelCase, `.ts` extension | `formatCurrency.ts`, `validateEmail.ts` |
| **Scripts** | kebab-case, `.ts` or `.js` | `seed-demo-user.ts`, `convert-to-webp.js` |
| **Types** | PascalCase, `.ts` extension | `User.ts`, `Reflection.ts` |
| **Constants** | SCREAMING_SNAKE_CASE | `TIER_LIMITS`, `MAX_RETRIES` |

### Variables & Functions

| Type | Convention | Example |
|------|------------|---------|
| **Functions** | camelCase | `calculateTotal()`, `getDemoUser()` |
| **React Components** | PascalCase | `function DemoBanner() {...}` |
| **Constants** | SCREAMING_SNAKE_CASE | `const MAX_REFLECTIONS = 10` |
| **Variables** | camelCase | `const userName = 'Demo User'` |
| **Boolean variables** | `is`, `has`, `should` prefix | `isDemo`, `hasReflections`, `shouldShowBanner` |
| **Event handlers** | `handle` prefix | `handleSubmit`, `handleSeeDemoClick` |
| **Hooks** | `use` prefix | `useAuth`, `useDemoUser`, `useReducedMotion` |

---

## Database Patterns

### Supabase Client Usage

**Pattern:** Direct Supabase client queries (no ORM)

**Example: Fetch User with Preferences**
```typescript
import { supabase } from '@/server/lib/supabase';

async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      tier,
      preferences,
      is_demo,
      reflection_count_this_month,
      total_reflections,
      created_at
    `)
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data;
}
```

**Key Points:**
- Use template strings for multi-column selects (readability)
- Always check `error` before using `data`
- Use `.single()` when expecting one row (throws error if multiple)
- Prefer specific column selection over `.select('*')` (performance)

---

### Database Migration Pattern

**Pattern:** Single migration file for related schema changes

**File:** `/supabase/migrations/20251128_iteration_12_demo_infrastructure.sql`

```sql
-- Add preferences JSONB column for user settings
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;

-- Add is_demo flag for demo user identification
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create index for demo user lookup (WHERE clause optimization)
CREATE INDEX IF NOT EXISTS idx_users_is_demo
ON public.users(is_demo)
WHERE is_demo = true;

-- Add comments for documentation
COMMENT ON COLUMN public.users.preferences IS
  'User settings stored as JSONB: notification_email, reflection_reminders, default_tone, reduce_motion_override, analytics_opt_in';

COMMENT ON COLUMN public.users.is_demo IS
  'True if this is the demo account (read-only, cached for performance)';

-- Seed demo user (placeholder - actual content via script)
INSERT INTO public.users (
  email,
  password_hash,
  name,
  tier,
  is_demo,
  email_verified,
  preferences
) VALUES (
  'demo@mirrorofdreams.com',
  'demo-account-no-password', -- Special value, login via session token
  'Demo User',
  'premium', -- Show all premium features
  true,
  true,
  '{
    "notification_email": true,
    "reflection_reminders": "off",
    "default_tone": "fusion"
  }'::JSONB
) ON CONFLICT (email) DO NOTHING;
```

**Key Points:**
- Use `IF NOT EXISTS` for idempotent migrations (safe to re-run)
- Add comments to document JSONB schema
- Use `ON CONFLICT DO NOTHING` for seed data (prevents duplicates)
- Prefer partial indexes (`WHERE is_demo = true`) for performance

---

### JSONB Preferences Pattern

**Pattern:** Store flexible user settings in JSONB column

**Type Definition:**
```typescript
// types/user.ts
export interface UserPreferences {
  notification_email: boolean;
  reflection_reminders: 'off' | 'daily' | 'weekly';
  evolution_email: boolean;
  marketing_emails: boolean;
  default_tone: 'fusion' | 'gentle' | 'intense';
  show_character_counter: boolean;
  reduce_motion_override: boolean | null; // null = respect browser preference
  analytics_opt_in: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  notification_email: true,
  reflection_reminders: 'off',
  evolution_email: true,
  marketing_emails: false,
  default_tone: 'fusion',
  show_character_counter: true,
  reduce_motion_override: null,
  analytics_opt_in: true,
};
```

**Query Pattern:**
```typescript
// Fetch user with parsed preferences
async function getUserWithPreferences(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, email, name, preferences')
    .eq('id', userId)
    .single();

  return {
    ...data,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(data.preferences || {}), // Merge with defaults
    } as UserPreferences,
  };
}
```

**Update Pattern:**
```typescript
// Update specific preference (partial update)
async function updateUserPreference(
  userId: string,
  key: keyof UserPreferences,
  value: any
) {
  // Fetch current preferences
  const { data: user } = await supabase
    .from('users')
    .select('preferences')
    .eq('id', userId)
    .single();

  // Merge with new value
  const updatedPreferences = {
    ...(user?.preferences || {}),
    [key]: value,
  };

  // Update database
  const { error } = await supabase
    .from('users')
    .update({ preferences: updatedPreferences })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update preference: ${error.message}`);

  return updatedPreferences;
}
```

**Key Points:**
- Always merge with defaults (handle missing keys gracefully)
- Use typed interfaces for JSONB structure (TypeScript safety)
- Prefer partial updates (only modify changed keys)
- Validate preferences with Zod before database write

---

## tRPC Patterns

### Protected Procedure Pattern

**Pattern:** Authenticate user via JWT, inject into context

**Example: Demo Login Mutation**
```typescript
// server/trpc/routers/auth.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { supabase } from '@/server/lib/supabase';

export const authRouter = router({
  // Existing mutations (signin, signup, changePassword)

  // NEW: Demo login (no password required)
  loginDemo: publicProcedure.mutation(async () => {
    // Fetch demo user from database
    const { data: demoUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_demo', true)
      .single();

    if (error || !demoUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Demo user not found. Run seed-demo-user script.',
      });
    }

    // Generate JWT with is_demo flag
    const token = jwt.sign(
      {
        userId: demoUser.id,
        email: demoUser.email,
        tier: demoUser.tier,
        isDemo: true, // NEW flag for demo detection
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data + token
    return {
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        tier: demoUser.tier,
        isDemo: true,
      },
      token,
    };
  }),
});
```

**Client Usage:**
```typescript
// components/landing/LandingHero.tsx
'use client';

import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { GlowButton } from '@/components/ui/glass';
import { useToast } from '@/contexts/ToastContext';

export function LandingHero() {
  const router = useRouter();
  const toast = useToast();
  const loginDemo = trpc.auth.loginDemo.useMutation();

  const handleSeeDemoClick = async () => {
    try {
      const { token, user } = await loginDemo.mutateAsync();

      // Store token (or set HTTP-only cookie)
      localStorage.setItem('token', token);

      // Show success toast
      toast.success(`Welcome to the demo, ${user.name}!`, 3000);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to load demo. Please try again.', 5000);
      console.error('Demo login error:', error);
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-h1 mb-4">
        Transform Your Dreams into Reality Through AI-Powered Reflection
      </h1>
      <div className="flex gap-4 justify-center mt-8">
        <GlowButton
          variant="primary"
          size="lg"
          onClick={handleSeeDemoClick}
          disabled={loginDemo.isPending}
        >
          {loginDemo.isPending ? 'Loading Demo...' : 'See Demo'}
        </GlowButton>
        <GlowButton
          variant="secondary"
          size="lg"
          onClick={() => router.push('/auth/signup')}
        >
          Start Free
        </GlowButton>
      </div>
    </div>
  );
}
```

**Key Points:**
- Use `publicProcedure` for unauthenticated endpoints (login, signup)
- Use `protectedProcedure` for authenticated endpoints (profile, settings)
- Always include `isDemo` flag in JWT for demo user detection
- Return structured objects: `{ user, token }` or `{ success, message }`

---

### Mutation with Optimistic Update Pattern

**Pattern:** Update UI immediately, rollback on error

**Example: Update User Preferences**
```typescript
// server/trpc/routers/users.ts
import { z } from 'zod';

export const usersRouter = router({
  updatePreferences: protectedProcedure
    .input(
      z.object({
        notification_email: z.boolean().optional(),
        reflection_reminders: z.enum(['off', 'daily', 'weekly']).optional(),
        default_tone: z.enum(['fusion', 'gentle', 'intense']).optional(),
        reduce_motion_override: z.boolean().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch current preferences
      const { data: user } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', ctx.user.id)
        .single();

      // Merge with input (partial update)
      const updatedPreferences = {
        ...(user?.preferences || {}),
        ...input,
      };

      // Update database
      const { error } = await supabase
        .from('users')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update preferences: ${error.message}`,
        });
      }

      return {
        preferences: updatedPreferences,
        message: 'Preferences updated successfully',
      };
    }),
});
```

**Client Usage with Optimistic Update:**
```typescript
// app/settings/page.tsx (Iteration 13)
'use client';

import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';
import { useState } from 'react';

export default function SettingsPage() {
  const toast = useToast();
  const utils = trpc.useUtils();

  const { data: profile } = trpc.users.getProfile.useQuery();
  const [preferences, setPreferences] = useState(profile?.preferences);

  const updateMutation = trpc.users.updatePreferences.useMutation({
    // Optimistic update: UI updates immediately
    onMutate: async (newPrefs) => {
      // Cancel outgoing queries
      await utils.users.getProfile.cancel();

      // Snapshot previous value
      const previousProfile = utils.users.getProfile.getData();

      // Optimistically update cache
      utils.users.getProfile.setData(undefined, (old) => ({
        ...old!,
        preferences: { ...old!.preferences, ...newPrefs },
      }));

      return { previousProfile };
    },

    // Success: Show toast
    onSuccess: () => {
      toast.success('Settings saved', 2000);
    },

    // Error: Rollback + show error
    onError: (error, variables, context) => {
      // Rollback to previous value
      utils.users.getProfile.setData(undefined, context?.previousProfile);
      toast.error(error.message || 'Failed to save settings', 5000);
    },

    // Always refetch after mutation settles
    onSettled: () => {
      utils.users.getProfile.invalidate();
    },
  });

  const handleToggle = (key: string, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    updateMutation.mutate({ [key]: value });
  };

  return (
    <div>
      <h1>Settings</h1>
      {/* Toggle switches */}
    </div>
  );
}
```

**Key Points:**
- Use `onMutate` for optimistic updates (instant UI feedback)
- Use `onError` to rollback on failure (UX resilience)
- Use `onSettled` to refetch and ensure consistency
- Always invalidate cache after mutation (`utils.users.getProfile.invalidate()`)

---

## Component Patterns

### Glass Morphism Card Pattern

**Pattern:** Reusable container with blur effect, gradient border, shadow

**Component:** `components/ui/glass/GlassCard.tsx` (EXISTING - REUSE)

**Usage Example:**
```tsx
import { GlassCard } from '@/components/ui/glass/GlassCard';

export function ProfileSection() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-h1 mb-8">Profile</h1>

      <GlassCard elevated className="mb-6">
        <h2 className="text-h2 mb-4">Account Information</h2>
        <div className="space-y-4">
          {/* Form fields */}
        </div>
      </GlassCard>

      <GlassCard elevated className="mb-6">
        <h2 className="text-h2 mb-4">Subscription & Usage</h2>
        <div className="space-y-2">
          <p className="text-white/70">Current Tier: <span className="text-purple-400">Premium</span></p>
          <p className="text-white/70">Reflections this month: <span className="text-white">32/50</span></p>
        </div>
      </GlassCard>
    </div>
  );
}
```

**Key Points:**
- Use `elevated` prop for more prominent shadow (hero cards)
- Use `className` to add spacing (`mb-6` for margin-bottom)
- Nest content in semantic HTML (`<h2>`, `<p>`, `<div>`)

---

### Demo Banner Pattern

**Pattern:** Conditional banner for demo users

**Component:** `components/shared/DemoBanner.tsx` (NEW - CREATE IN ITERATION 12)

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GlowButton } from '@/components/ui/glass';

export function DemoBanner() {
  const router = useRouter();
  const { user } = useAuth();

  // Only show for demo users
  if (!user?.isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-amber-500/30 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-amber-200">
          <span className="text-2xl">👁️</span>
          <span>
            You're viewing a demo account. Create your own to start reflecting and save your progress.
          </span>
        </div>
        <GlowButton
          variant="primary"
          size="sm"
          onClick={() => router.push('/auth/signup')}
          className="whitespace-nowrap"
        >
          Sign Up for Free
        </GlowButton>
      </div>
    </div>
  );
}
```

**Integration in AppNavigation:**
```tsx
// components/shared/AppNavigation.tsx
import { DemoBanner } from './DemoBanner';

export function AppNavigation({ currentPage }: { currentPage: string }) {
  return (
    <>
      <DemoBanner /> {/* Shows only for demo users */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-glass-triple backdrop-blur-glass border-b border-white/10">
        {/* Navigation content */}
      </nav>
    </>
  );
}
```

**Key Points:**
- Early return if not demo user (performance optimization)
- Use `useAuth()` hook to access current user
- Responsive layout: vertical on mobile, horizontal on desktop
- Use gradient background for visual distinction (amber/yellow = warning/info)

---

### Protected Route Pattern

**Pattern:** Redirect unauthenticated users to signin

**Example:** Profile page (Iteration 13)

```tsx
// app/profile/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { CosmicLoader } from '@/components/ui/glass';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/signin?redirect=/profile');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CosmicLoader />
      </div>
    );
  }

  // Not authenticated (redirect in progress)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      <AppNavigation currentPage="profile" />
      <main className="pt-[var(--nav-height)] px-6 py-8">
        <h1 className="text-h1 mb-8">Profile</h1>
        {/* Page content */}
      </main>
    </div>
  );
}
```

**Key Points:**
- Use `useAuth()` hook for authentication state
- Show loader while authentication is loading
- Return `null` during redirect (prevents flash of unauthenticated content)
- Include `redirect` query param to return user after login

---

### Image Optimization Pattern

**Pattern:** Use Next.js Image component with WebP format

**Example: Landing Page Screenshots**

```tsx
// app/page.tsx (Landing page)
import Image from 'next/image';

export default function LandingPage() {
  return (
    <section className="py-16">
      <h2 className="text-h2 text-center mb-12">See Mirror of Dreams in Action</h2>

      <div className="max-w-6xl mx-auto grid gap-8">
        {/* Screenshot 1: Dashboard (above-fold, priority) */}
        <div className="relative">
          <Image
            src="/landing/dashboard-demo.webp"
            alt="Mirror of Dreams dashboard showing 5 active dreams and recent reflections"
            width={1920}
            height={1080}
            quality={90}
            priority // Preload for LCP optimization
            className="rounded-lg shadow-amethyst-breath"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
          <p className="text-center text-white/60 mt-2 text-sm">
            Your command center: Track all dreams, recent reflections, and progress at a glance
          </p>
        </div>

        {/* Screenshot 2: Reflection (below-fold, lazy load) */}
        <div className="relative">
          <Image
            src="/landing/reflection-demo.webp"
            alt="AI-generated reflection output with highlighted insights"
            width={1920}
            height={1080}
            loading="lazy" // Defer until scroll
            className="rounded-lg shadow-amethyst-breath"
          />
          <p className="text-center text-white/60 mt-2 text-sm">
            Deep AI insights: Your mirror reveals patterns and guides your evolution
          </p>
        </div>

        {/* Screenshot 3: Evolution (below-fold, lazy load) */}
        <div className="relative">
          <Image
            src="/landing/evolution-demo.webp"
            alt="Evolution report showing growth patterns across reflections"
            width={1920}
            height={1080}
            loading="lazy" // Defer until scroll
            className="rounded-lg shadow-amethyst-breath"
          />
          <p className="text-center text-white/60 mt-2 text-sm">
            See your growth: Evolution reports track your transformation over time
          </p>
        </div>
      </div>
    </section>
  );
}
```

**WebP Conversion Script:**
```javascript
// scripts/convert-to-webp.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './public/landing/raw';
const outputDir = './public/landing';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert all PNG/JPG files to WebP
fs.readdirSync(inputDir)
  .filter((file) => /\.(png|jpg|jpeg)$/i.test(file))
  .forEach((file) => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(
      outputDir,
      file.replace(/\.(png|jpg|jpeg)$/i, '.webp')
    );

    sharp(inputPath)
      .webp({ quality: 80, effort: 6 }) // 80% quality, max compression effort
      .toFile(outputPath)
      .then((info) => {
        const inputSize = fs.statSync(inputPath).size;
        const reduction = ((1 - info.size / inputSize) * 100).toFixed(1);
        console.log(
          `✅ ${file} → ${path.basename(outputPath)} (${reduction}% smaller)`
        );
      })
      .catch((err) => console.error(`❌ Failed: ${file}`, err));
  });
```

**Key Points:**
- Use `priority` prop on above-fold images (LCP optimization)
- Use `loading="lazy"` on below-fold images (defer until scroll)
- Use `sizes` prop for responsive image sizing (bandwidth optimization)
- WebP quality 80% is near-lossless, 60-70% file size reduction
- Run conversion script before deployment: `node scripts/convert-to-webp.js`

---

## Import Order Convention

**Pattern:** Consistent import organization for readability

**Order:**
1. React & Next.js imports
2. Third-party libraries
3. Internal utilities & hooks
4. Components
5. Types
6. Styles (if any)

**Example:**
```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 2. Third-party libraries
import { z } from 'zod';

// 3. Internal utilities & hooks
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

// 4. Components
import { GlassCard, GlowButton } from '@/components/ui/glass';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { AppNavigation } from '@/components/shared/AppNavigation';

// 5. Types
import type { User, UserPreferences } from '@/types/user';

// 6. Styles (rare in Tailwind projects)
import './styles.css';
```

**Key Points:**
- Group related imports together
- Use absolute imports (`@/`) over relative (`../../`)
- Alphabetize within groups for consistency
- Separate groups with blank lines

---

## Error Handling Patterns

### tRPC Error Pattern

**Pattern:** Use `TRPCError` with descriptive codes and messages

**Example:**
```typescript
import { TRPCError } from '@trpc/server';

// Not Found Error
if (!user) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'User not found',
  });
}

// Unauthorized Error
if (!ctx.user) {
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'You must be logged in to perform this action',
  });
}

// Forbidden Error (authenticated but not allowed)
if (ctx.user.isDemo) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Demo account is read-only. Sign up to create reflections.',
  });
}

// Validation Error
if (input.password.length < 6) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Password must be at least 6 characters',
  });
}

// Server Error (fallback)
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'An unexpected error occurred. Please try again.',
});
```

**Error Codes:**
- `NOT_FOUND` - Resource doesn't exist (404)
- `UNAUTHORIZED` - Not authenticated (401)
- `FORBIDDEN` - Authenticated but not allowed (403)
- `BAD_REQUEST` - Invalid input (400)
- `INTERNAL_SERVER_ERROR` - Unexpected error (500)

---

### Client-Side Error Handling

**Pattern:** Display user-friendly toast notifications

**Example:**
```typescript
const createReflection = trpc.reflection.create.useMutation({
  onSuccess: (data) => {
    toast.success('Reflection created successfully!', 3000);
    router.push(`/reflections/${data.id}`);
  },
  onError: (error) => {
    // Display error message from server
    toast.error(error.message || 'Failed to create reflection', 5000);

    // Log full error for debugging
    console.error('Reflection creation error:', error);
  },
});
```

**Key Points:**
- Always show user-friendly error messages (not technical stack traces)
- Use toast notifications for non-blocking feedback
- Log errors to console for debugging (but don't show to users)
- Provide actionable guidance: "Password must be at least 6 characters" (not "Validation error")

---

## Seeding Patterns

### Demo User Seeding Script

**Pattern:** Programmatic database seeding with AI-generated content

**File:** `scripts/seed-demo-user.ts`

```typescript
import { supabase } from '../server/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Demo user data
const DEMO_USER_EMAIL = 'demo@mirrorofdreams.com';
const DEMO_USER = {
  email: DEMO_USER_EMAIL,
  password_hash: 'demo-account-no-password',
  name: 'Demo User',
  tier: 'premium',
  is_demo: true,
  email_verified: true,
  preferences: {
    notification_email: true,
    reflection_reminders: 'off',
    default_tone: 'fusion',
  },
};

// Demo dreams
const DEMO_DREAMS = [
  {
    title: 'Launch My SaaS Product',
    description:
      'Build and launch a profitable SaaS product that solves a real problem and generates $10k MRR within 12 months.',
    category: 'career',
    status: 'active',
    target_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    priority: 'high',
  },
  {
    title: 'Run a Marathon',
    description:
      'Complete a full marathon (42.195 km) in under 4 hours while maintaining healthy training habits.',
    category: 'health',
    status: 'active',
    target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
    priority: 'medium',
  },
  {
    title: 'Learn Piano',
    description:
      'Play Chopin's Nocturne in E-flat major fluently and perform it for friends and family.',
    category: 'creative',
    status: 'active',
    target_date: null, // No deadline, ongoing
    priority: 'low',
  },
  {
    title: 'Build Meaningful Relationships',
    description:
      'Cultivate 3-5 deep friendships based on mutual respect, vulnerability, and shared growth.',
    category: 'relationships',
    status: 'active',
    target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    priority: 'high',
  },
  {
    title: 'Achieve Financial Freedom',
    description:
      'Build passive income streams totaling $5k/month to cover living expenses and gain time freedom.',
    category: 'financial',
    status: 'active',
    target_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years
    priority: 'medium',
  },
];

async function seedDemoUser() {
  console.log('🌱 Seeding demo user...');

  // 1. Create demo user
  const { data: user, error: userError } = await supabase
    .from('users')
    .upsert([DEMO_USER], { onConflict: 'email' })
    .select()
    .single();

  if (userError) {
    console.error('❌ Failed to create demo user:', userError);
    process.exit(1);
  }

  console.log(`✅ Demo user created: ${user.email} (ID: ${user.id})`);

  // 2. Create demo dreams
  console.log('🌱 Creating demo dreams...');
  const { data: dreams, error: dreamsError } = await supabase
    .from('dreams')
    .upsert(
      DEMO_DREAMS.map((dream) => ({ ...dream, user_id: user.id })),
      { onConflict: 'id' }
    )
    .select();

  if (dreamsError) {
    console.error('❌ Failed to create dreams:', dreamsError);
    process.exit(1);
  }

  console.log(`✅ ${dreams.length} dreams created`);

  // 3. Generate demo reflections (AI-assisted)
  console.log('🌱 Generating demo reflections (this may take a few minutes)...');

  const reflections = [];
  for (const dream of dreams) {
    // Generate 3-4 reflections per dream (minimum 4 for evolution)
    const reflectionCount = dream.title.includes('SaaS') ? 4 : 3;

    for (let i = 0; i < reflectionCount; i++) {
      const reflection = await generateDemoReflection(dream, i);
      reflections.push({ ...reflection, user_id: user.id, dream_id: dream.id });
    }
  }

  const { error: reflectionsError } = await supabase
    .from('reflections')
    .insert(reflections);

  if (reflectionsError) {
    console.error('❌ Failed to insert reflections:', reflectionsError);
    process.exit(1);
  }

  console.log(`✅ ${reflections.length} reflections created`);

  // 4. Generate evolution reports (for dreams with 4+ reflections)
  console.log('🌱 Generating evolution reports...');
  // (Implementation omitted for brevity - call tRPC evolution.generate)

  console.log('🎉 Demo user seeding complete!');
  console.log(`   Email: ${DEMO_USER_EMAIL}`);
  console.log(`   Auto-login via: trpc.auth.loginDemo()`);
}

async function generateDemoReflection(dream: any, index: number) {
  // Load fusion prompt
  const fusionPrompt = fs.readFileSync(
    path.join(process.cwd(), 'prompts', 'fusion.txt'),
    'utf-8'
  );

  // User reflection content (template)
  const userContent = `
Dream: ${dream.title}
Plan: [Generated plan ${index + 1}]
Relationship: [Emotional relationship with dream]
Offering: [What I'm willing to sacrifice]
  `.trim();

  // Generate AI response using Anthropic
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    temperature: 1,
    max_tokens: 6000,
    thinking: { type: 'enabled', budget_tokens: 5000 },
    system: fusionPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    dream: userContent,
    ai_response: aiResponse,
    tone: 'fusion',
    is_premium: true,
    word_count: aiResponse.split(/\s+/).length,
    created_at: new Date(Date.now() - (15 - index) * 24 * 60 * 60 * 1000).toISOString(), // Spread over 15 days
  };
}

seedDemoUser();
```

**Run Script:**
```bash
# Local development
npx tsx scripts/seed-demo-user.ts

# Production (requires production env vars)
npx tsx scripts/seed-demo-user.ts --production
```

**Key Points:**
- Use `upsert` with `onConflict` for idempotent seeding
- Generate reflections via actual AI API (showcase real quality)
- Spread reflection dates over time (realistic temporal evolution)
- Use premium tier for all demo reflections (best quality)

---

## Testing Patterns

### Manual Testing Checklist

**Pattern:** Systematic manual testing for demo flow

**Checklist for Iteration 12:**

```markdown
## Demo User Flow Testing

- [ ] Visit landing page: `http://localhost:3000`
- [ ] Verify hero section displays new headline and dual CTAs
- [ ] Click "See Demo" button
- [ ] Verify auto-login (redirected to `/dashboard`)
- [ ] Verify demo banner appears at top: "You're viewing demo account..."
- [ ] Verify dashboard shows:
  - [ ] 5 active dreams
  - [ ] Recent 3 reflections with snippets
  - [ ] Progress stats (e.g., "12 reflections this month")
- [ ] Click on a dream card
- [ ] Verify dream detail page shows 3-4 reflections
- [ ] Click on a reflection
- [ ] Verify reflection detail page shows:
  - [ ] User's reflection answers
  - [ ] AI response (formatted, readable)
  - [ ] Tone badge (Fusion/Gentle/Intense)
- [ ] Navigate to Evolution page
- [ ] Verify evolution report exists for dreams with 4+ reflections
- [ ] Navigate back to dashboard
- [ ] Click "Sign Up for Free" in demo banner
- [ ] Verify redirected to signup page
- [ ] Sign up with new account
- [ ] Verify redirected to empty dashboard (not demo data)

## Performance Testing

- [ ] Run Lighthouse audit on landing page
  - [ ] Performance score > 90
  - [ ] LCP < 2 seconds
  - [ ] Accessibility score = 100
- [ ] Run bundle size check
  - [ ] Total increase < 10KB from baseline
- [ ] Test on throttled 3G connection
  - [ ] Landing page loads in < 5 seconds
  - [ ] Images load progressively (blur → full quality)
```

---

## Code Quality Standards

### TypeScript Standards

1. **Always use explicit return types** for functions
   ```typescript
   // Good
   function getDemoUser(): Promise<User> {
     return supabase.from('users').select('*').eq('is_demo', true).single();
   }

   // Bad
   function getDemoUser() {
     return supabase.from('users').select('*').eq('is_demo', true).single();
   }
   ```

2. **Use const for immutable values**
   ```typescript
   // Good
   const DEMO_USER_EMAIL = 'demo@mirrorofdreams.com';

   // Bad
   let DEMO_USER_EMAIL = 'demo@mirrorofdreams.com';
   ```

3. **Prefer interfaces over types** for object shapes
   ```typescript
   // Good
   interface UserPreferences {
     notification_email: boolean;
   }

   // Bad
   type UserPreferences = {
     notification_email: boolean;
   };
   ```

4. **Use optional chaining** for nested properties
   ```typescript
   // Good
   const tone = user?.preferences?.default_tone ?? 'fusion';

   // Bad
   const tone = user && user.preferences && user.preferences.default_tone || 'fusion';
   ```

### React Standards

1. **Use functional components** (no class components)
2. **Use hooks** instead of lifecycle methods
3. **Extract logic** into custom hooks when reused
4. **Memoize expensive computations** with `useMemo`
5. **Memoize callbacks** with `useCallback` when passed to children

### Tailwind CSS Standards

1. **Use design system classes** over arbitrary values
   ```tsx
   // Good
   <div className="bg-glass-triple backdrop-blur-glass shadow-amethyst-breath" />

   // Bad
   <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px] shadow-[0_0_20px_purple]" />
   ```

2. **Use responsive prefixes** for mobile-first design
   ```tsx
   // Good
   <div className="text-sm md:text-base lg:text-lg" />
   ```

3. **Group related classes** for readability
   ```tsx
   // Good
   <button className="
     px-6 py-3 rounded-lg
     bg-purple-500 hover:bg-purple-600
     text-white font-semibold
     transition-all duration-300
     shadow-amethyst-breath hover:shadow-amethyst-glow
   ">
   ```

---

**Patterns Status:** COMPLETE
**Builder Guidance:** Copy-paste examples, adapt to specific use cases
**Quality Gate:** All code must follow these patterns for consistency
**Next Step:** Builders execute tasks using these patterns as reference
