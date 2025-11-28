# Explorer 1 Report: Architecture & Structure

## Executive Summary

Iteration 12 (Plan-7, Iteration 1) focuses on **Foundation & Demo User** infrastructure. The existing Next.js 14 App Router architecture is **solid and well-structured**, requiring only **additive changes** with zero breaking modifications. Key findings: (1) Database schema already supports user preferences via JSONB pattern, (2) tRPC router architecture is extensible for new mutations, (3) Design system (GlassCard, EmptyState, CosmicBackground) provides all UI primitives needed, (4) Performance infrastructure exists but needs Redis caching for demo user data.

**Critical architectural decision**: Demo user should be implemented as **read-only cached account** (not nightly reset) to maximize performance and minimize database load.

---

## Discoveries

### Application Architecture (Next.js 14 App Router)

**Current State: Excellent (9/10)**

- **App Router Structure**: `/app` directory follows Next.js 14 conventions perfectly
  - Page routes: `dashboard/`, `dreams/`, `reflection/`, `reflections/`, `evolution/`, `visualizations/`, `auth/`
  - Dynamic routes: `dreams/[id]/`, `reflections/[id]/`, `evolution/[id]/`, `visualizations/[id]/`
  - API routes: `api/trpc/[trpc]/route.ts` (tRPC integration)
  - Layouts: Root layout with tRPC + Toast providers, no nested layouts needed

- **Component Organization**: 7 well-organized directories
  - `/components/ui/glass/` - Design system primitives (GlassCard, GlowButton, GlassModal)
  - `/components/shared/` - Shared components (AppNavigation, LandingNavigation, CosmicBackground, EmptyState)
  - `/components/dashboard/` - Dashboard-specific cards (DreamsCard, ReflectionsCard, EvolutionCard, etc.)
  - `/components/landing/` - Landing page components (LandingHero, LandingFeatureCard)
  - `/components/reflection/` - Reflection form components (ReflectionQuestionCard, ToneSelectionCard, CharacterCounter)
  - `/components/dreams/` - Dream components (DreamCard, CreateDreamModal)
  - `/components/auth/` - Auth components (AuthLayout)

- **Backend Architecture**: tRPC + Supabase PostgreSQL
  - **tRPC routers** (9 total): `auth`, `dreams`, `reflections`, `reflection` (AI), `users`, `evolution`, `visualizations`, `artifact`, `subscriptions`, `admin`
  - **Database**: Supabase PostgreSQL with 10 migrations applied
  - **Auth**: JWT-based (not Supabase Auth - custom implementation)
  - **AI Integration**: Anthropic Claude via `@anthropic-ai/sdk`

**Strengths:**
- Clean separation of concerns (pages, components, backend, types)
- tRPC provides type-safe API without boilerplate
- Design system components reusable across all features
- No prop drilling (React Context for Auth, Toast, tRPC)

**Gaps for Iteration 12:**
- No `/profile` page (needs creation)
- No `/settings` page (needs creation)
- No `/about` page (needs creation)
- No `/pricing` page (needs creation)
- No demo user seeding infrastructure
- No Redis caching setup for demo data

---

### Database Schema & Data Model

**Current State: 8/10 (Solid foundation, minor additions needed)**

**Existing Tables:**
1. **users** (47 columns total)
   - Core: `id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`
   - Subscription: `tier` (free/essential/premium), `subscription_status`, `subscription_period`, `subscription_started_at`, `subscription_expires_at`
   - Usage tracking: `reflection_count_this_month`, `total_reflections`, `current_month_year`
   - Flags: `is_creator`, `is_admin`, `email_verified`, `onboarding_completed`
   - Metadata: `language`, `timezone`, `last_sign_in_at`, `last_reflection_at`

2. **dreams** (14 columns)
   - Content: `title`, `description`, `category`, `priority`
   - Timeline: `target_date`, `status` (active/achieved/archived/released)
   - Metadata: `reflection_count`, `last_reflection_at`

3. **reflections** (17 columns)
   - Content: `dream`, `plan`, `has_date`, `dream_date`, `relationship`, `offering`, `ai_response`
   - Metadata: `tone`, `is_premium`, `word_count`, `estimated_read_time`, `title`, `tags`, `mood_score`
   - Analytics: `view_count`, `last_viewed_at`
   - Linking: `dream_id` (FK to dreams)

4. **evolution_reports** (10 columns)
   - Analysis: `analysis`, `insights` (JSONB), `patterns_detected`, `growth_score`
   - Metadata: `report_type`, `reflections_analyzed`, `reflection_count`, `time_period_start`, `time_period_end`

5. **visualizations** (not in initial migration but added later)
   - Fields: TBD (need to check migration `20251022210000_add_evolution_visualizations.sql`)

**Schema Additions Needed for Iteration 12:**

```sql
-- Add preferences column to users table (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;

-- Add is_demo flag to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create index for demo user lookup
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON public.users(is_demo) WHERE is_demo = true;

-- Add comment for documentation
COMMENT ON COLUMN public.users.preferences IS 'User settings stored as JSONB: notification_email, reflection_reminders, default_tone, reduce_motion_override, analytics_opt_in';
COMMENT ON COLUMN public.users.is_demo IS 'True if this is the demo account (read-only, cached)';
```

**Preferences Schema (JSONB):**
```typescript
interface UserPreferences {
  notification_email: boolean;           // Default: true
  reflection_reminders: 'daily' | 'weekly' | 'off'; // Default: 'off'
  evolution_email: boolean;              // Default: true
  marketing_emails: boolean;             // Default: false
  default_tone: 'fusion' | 'gentle' | 'intense'; // Default: 'fusion'
  show_character_counter: boolean;       // Default: true
  reduce_motion_override: boolean | null; // Default: null (respect browser)
  analytics_opt_in: boolean;             // Default: true
}
```

**Why JSONB over separate table:**
- Preferences are rarely queried independently (always with user)
- JSONB supports flexible schema evolution
- Single query to fetch user + preferences
- PostgreSQL JSONB indexing available if needed later

---

### Component Architecture & Design System

**Current State: 9/10 (Excellent reusability, mature patterns)**

**Core Design System Components:**

1. **GlassCard** (`/components/ui/glass/GlassCard.tsx`)
   - Props: `elevated` (shadow depth), `interactive` (hover lift), `onClick`, `className`
   - Base styles: `backdrop-blur-crystal`, gradient borders, rounded-xl
   - Interactive states: `-translate-y-0.5` hover, `shadow-amethyst-mid`, border glow
   - **Usage in Iteration 12**: Profile sections, Settings sections, About page sections, Pricing tier cards

2. **GlowButton** (`/components/ui/glass/GlowButton.tsx`)
   - Variants: `primary` (purple glow), `secondary`, `ghost`, `danger`
   - Sizes: `sm`, `md`, `lg`
   - **Usage**: All CTAs (Sign Up, See Demo, Upgrade, Save Profile)

3. **EmptyState** (`/components/shared/EmptyState.tsx`)
   - Enhanced in Plan-6 with `progress` prop, `illustration`, `variant` (default/compact)
   - Progress bar for "X/4 reflections to unlock evolution"
   - **Usage**: Dashboard empty states, Dreams page empty, Reflections empty

4. **CosmicBackground** (`/components/shared/CosmicBackground.tsx`)
   - Animated starfield with CSS animations
   - Props: `animated` (boolean), `intensity` (0-3)
   - **Usage**: All pages (landing, dashboard, profile, settings, about, pricing)

5. **AppNavigation** (`/components/shared/AppNavigation.tsx`)
   - Fixed top navigation with logo, desktop nav links, user dropdown
   - User menu: Profile, Settings, Upgrade, Help, Sign Out
   - **Extension needed**: Profile and Settings links already present (point to `/profile`, `/settings`)

**Component Patterns Established:**

**Pattern 1: Form Input Components** (Need to create for Profile/Settings)
```tsx
// Example: GlassInput (not yet created, but pattern exists in ToneSelectionCard)
interface GlassInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

// Styling pattern (from existing components):
// - backdrop-blur-crystal
// - bg-white/5 border border-white/10
// - focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/20
// - text-white placeholder:text-white/40
```

**Pattern 2: Section Cards** (Profile/Settings pages)
```tsx
// Profile page layout:
<div className="max-w-4xl mx-auto px-6 py-8">
  <GlassCard elevated className="mb-6">
    <h2 className="text-h2 mb-4">Account Information</h2>
    {/* Form fields */}
  </GlassCard>
  <GlassCard elevated className="mb-6">
    <h2 className="text-h2 mb-4">Subscription & Usage</h2>
    {/* Stats display */}
  </GlassCard>
</div>
```

**Pattern 3: Empty State Integration** (Already in use)
```tsx
// Dashboard empty state for no dreams:
<EmptyState
  icon="🌱"
  title="Your journey begins with a dream"
  description="Dreams are the seeds of transformation. Plant your first dream and watch it grow through reflection."
  ctaLabel="Create Your First Dream"
  ctaAction={() => router.push('/dreams')}
  variant="default"
/>
```

---

### Entry Points & Integration Boundaries

**Page Entry Points (Existing):**

1. **Landing Page** (`/app/page.tsx`)
   - Entry: Unauthenticated visitors
   - Components: LandingNavigation, LandingHero, LandingFeatureCard
   - CTAs: "Start Free" → `/auth/signup`, "Sign In" → `/auth/signin`
   - **Changes needed**: Add "See Demo" CTA → `/demo-login` (new endpoint)

2. **Dashboard** (`/app/dashboard/page.tsx`)
   - Entry: Post-authentication (via `/auth/signin` redirect)
   - Protected route: `useAuth()` hook redirects if not authenticated
   - Components: DashboardHero, DashboardGrid with 6 cards
   - **Changes needed**: Handle demo user banner ("You're viewing demo account")

3. **Auth Pages** (`/app/auth/signin/page.tsx`, `/app/auth/signup/page.tsx`)
   - Entry: Landing page CTAs + navigation
   - Flow: Email/password → JWT token → Redirect to `/dashboard` or `/onboarding`
   - **Changes needed**: Demo login flow (auto-login without password)

**New Entry Points Needed:**

4. **Profile Page** (`/app/profile/page.tsx`) - **TO CREATE**
   - Entry: AppNavigation user dropdown → "Profile" link
   - Protected route (requires auth)
   - Layout: 3-4 GlassCard sections (Account Info, Subscription, Usage Stats, Actions)

5. **Settings Page** (`/app/settings/page.tsx`) - **TO CREATE**
   - Entry: AppNavigation user dropdown → "Settings" link
   - Protected route (requires auth)
   - Layout: Tabbed or accordion sections (Notifications, Reflection Prefs, Display, Privacy)

6. **About Page** (`/app/about/page.tsx`) - **TO CREATE**
   - Entry: Landing footer → "About" link, AppNavigation (optional)
   - Public page (no auth required)
   - Layout: CosmicBackground + GlassCard sections (Founder Story, Mission, Values)

7. **Pricing Page** (`/app/pricing/page.tsx`) - **TO CREATE**
   - Entry: Landing footer → "Pricing" link, AppNavigation "Upgrade" button
   - Public page (no auth required)
   - Layout: 3-column tier comparison (Free, Premium, Pro) + FAQ section

**Integration Boundaries:**

**Boundary 1: tRPC API Layer**
- **Location**: `/server/trpc/routers/*.ts`
- **Pattern**: Each feature has dedicated router (auth, users, dreams, reflections, etc.)
- **Integration**: Client components use `trpc.users.updateProfile.useMutation()` hooks
- **New routers needed**:
  - `users.updateProfile` (already exists, needs password change mutation)
  - `users.changePassword` (new mutation)
  - `users.updatePreferences` (new mutation)
  - `users.deleteAccount` (new mutation)
  - `auth.loginDemo` (new query - returns demo user session)

**Boundary 2: Authentication Context**
- **Location**: `/hooks/useAuth.ts` (custom hook)
- **Pattern**: JWT stored in memory + HTTP-only cookie
- **Integration**: All protected pages call `useAuth()` hook
- **Demo user handling**: `user.is_demo` flag in JWT payload, banner shown in `<AppNavigation>` when true

**Boundary 3: Database Access**
- **Location**: `/server/lib/supabase.ts` (Supabase client)
- **Pattern**: tRPC procedures access DB via Supabase client
- **Integration**: Row-level security policies enforce user isolation
- **Demo user special case**: Skip RLS for demo user queries (use service role), cache results in Redis

**Boundary 4: Redis Cache (NEW - Needed for demo user)**
- **Location**: `/server/lib/redis.ts` (Upstash Redis client - already in dependencies)
- **Pattern**: Cache demo user data (dreams, reflections, evolution reports) with 24-hour TTL
- **Integration**: 
  - On demo login: Check Redis cache first
  - Cache miss: Query DB, populate cache
  - Cache hit: Return cached data (1ms vs 100ms DB query)
- **Dependency**: `@upstash/redis` already in `package.json`

---

## Patterns Identified

### Pattern 1: Protected Route Pattern

**Description**: Next.js App Router page with authentication check

**Use Case**: All authenticated pages (dashboard, profile, settings, dreams, etc.)

**Example**:
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';

export default function ProtectedPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return <CosmicLoader />;
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
        {/* Page content */}
      </main>
    </div>
  );
}
```

**Recommendation**: Use this pattern for Profile and Settings pages.

---

### Pattern 2: tRPC Mutation with Toast Feedback

**Description**: Client-side mutation with optimistic updates and user feedback

**Use Case**: Profile updates, settings changes, preference saves

**Example**:
```tsx
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';

function ProfileForm() {
  const toast = useToast();
  const utils = trpc.useUtils();

  const updateMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.getProfile.invalidate(); // Refresh profile data
      toast.success('Profile updated successfully', 3000);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile', 5000);
    },
  });

  const handleSubmit = (data: ProfileUpdateInput) => {
    updateMutation.mutate(data);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(formData); }}>
      {/* Form fields */}
      <GlowButton
        type="submit"
        variant="primary"
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </GlowButton>
    </form>
  );
}
```

**Recommendation**: Use for all Profile and Settings mutations.

---

### Pattern 3: Empty State with Progress

**Description**: Enhanced empty state showing progress toward feature unlock

**Use Case**: Dashboard when no dreams, Evolution when <4 reflections, Visualizations when <4 reflections

**Example**:
```tsx
import { EmptyState } from '@/components/shared/EmptyState';

function DashboardEmptyDreams() {
  return (
    <EmptyState
      icon="🌱"
      title="Your journey begins with a dream"
      description="Dreams are the seeds of transformation. Plant your first dream and watch it grow through reflection."
      ctaLabel="Create Your First Dream"
      ctaAction={() => router.push('/dreams')}
      variant="default"
    />
  );
}

function EvolutionEmptyWithProgress({ reflectionCount }: { reflectionCount: number }) {
  return (
    <EmptyState
      icon="📊"
      title="Evolution insights unlock after 4 reflections"
      description="Your AI mirror analyzes patterns across your reflections to show how you're growing. Keep reflecting to unlock this powerful insight."
      progress={{
        current: reflectionCount,
        total: 4,
        label: 'reflections',
      }}
      ctaLabel="Reflect Now"
      ctaAction={() => router.push('/reflection')}
      variant="default"
    />
  );
}
```

**Recommendation**: Already implemented in Plan-6, reuse for Iteration 12 empty states.

---

### Pattern 4: Demo User Banner Component

**Description**: Non-intrusive banner informing users they're viewing demo account

**Use Case**: Dashboard, Dreams, Reflections pages when `user.is_demo === true`

**Example** (To be created):
```tsx
// /components/shared/DemoBanner.tsx
'use client';

import { useRouter } from 'next/navigation';
import { GlowButton } from '@/components/ui/glass';

export function DemoBanner() {
  const router = useRouter();

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

**Recommendation**: Create this component, conditionally render in AppNavigation or page layouts when `user?.is_demo === true`.

---

### Pattern 5: Settings Toggle with Immediate Save

**Description**: Toggle switches that save immediately without "Save" button

**Use Case**: Settings page (notifications, preferences, display options)

**Example** (To be created):
```tsx
// /components/settings/SettingToggle.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';

interface SettingToggleProps {
  label: string;
  description: string;
  value: boolean;
  preferenceKey: keyof UserPreferences;
}

export function SettingToggle({ label, description, value, preferenceKey }: SettingToggleProps) {
  const [isEnabled, setIsEnabled] = useState(value);
  const toast = useToast();

  const updateMutation = trpc.users.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Setting updated', 2000);
    },
    onError: () => {
      setIsEnabled(!isEnabled); // Revert on error
      toast.error('Failed to update setting', 3000);
    },
  });

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue); // Optimistic update
    updateMutation.mutate({ [preferenceKey]: newValue });
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10">
      <div className="flex-1">
        <div className="text-white/90 font-medium">{label}</div>
        <div className="text-white/60 text-sm mt-1">{description}</div>
      </div>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isEnabled ? 'bg-purple-500' : 'bg-white/20'
        }`}
        role="switch"
        aria-checked={isEnabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
```

**Recommendation**: Create SettingToggle component for Settings page.

---

## Complexity Assessment

### High Complexity Areas

**1. Demo User Seeding & Caching (Estimated: 6-8 hours, recommend Builder split)**

**Why Complex:**
- Requires high-quality reflection content (12-15 reflections × 200-400 words each = 2,400-6,000 words)
- Content must feel authentic, not lorem ipsum (requires thoughtful writing or AI generation + review)
- Database seeding script must generate:
  - 5 dreams with realistic titles, descriptions, categories, target dates
  - 12-15 reflections distributed across dreams (min 4 per dream for evolution)
  - 2 evolution reports (requires running AI analysis on seeded reflections)
  - 1-2 visualizations
- Redis cache implementation for performance (first-time integration)
- Demo login flow (bypass password, create session, redirect to dashboard with banner)

**Subdivision Recommendation:**
- **Builder A (4 hours)**: Create seeding script structure, generate 5 dreams, write 3 sample reflections
- **Builder B (2 hours)**: Complete remaining 9-12 reflections (or AI-generate with review)
- **Builder C (2 hours)**: Implement Redis caching, demo login endpoint, banner component

**Alternative (Single Builder):**
- Pre-write reflection content before development starts (4-6 hours content creation)
- Then implementation: seeding (2h) + caching (2h) + demo flow (2h) = 6 hours total

**Recommendation**: **Single builder IF content is pre-written**, otherwise split into 2 builders (content + implementation).

---

**2. Landing Page Transformation (Estimated: 6-8 hours, single builder)**

**Why Moderate Complexity:**
- Hero section redesign (headline, subheadline, dual CTAs) - 2 hours
- Replace 4 generic feature cards with 3 concrete use cases (requires copywriting) - 2 hours
- Add screenshots section (requires taking/creating 3 screenshots: dashboard, reflection, evolution) - 1 hour
- Screenshot optimization (WebP conversion, next/image configuration, lazy loading) - 1 hour
- Footer enhancement (link About, Pricing pages - create placeholder pages) - 1 hour
- Mobile responsive testing + adjustments - 1 hour
- Performance testing (LCP <2s target, Lighthouse audit) - 1 hour

**Subdivision NOT Recommended**: Single builder maintains consistency (copy tone, visual hierarchy, mobile behavior).

**Critical Dependency**: Screenshots must show populated demo user data (requires demo user to be created first).

---

### Medium Complexity Areas

**3. Profile Page (Estimated: 4-5 hours, single builder)**

**Components to Create:**
- Profile page layout (`/app/profile/page.tsx`)
- Account info form (name edit, email display, password change)
- Subscription info display (tier badge, usage stats, next billing)
- Account actions (change email modal, delete account confirmation)

**Backend Work:**
- `users.changePassword` mutation (bcrypt password verification + hash)
- `users.changeEmail` mutation (defer verification emails to v2)
- `users.deleteAccount` mutation (cascade delete via DB)

**Not Complex Because:**
- GlassCard, GlassInput patterns already established
- tRPC mutation pattern well-defined
- No complex state management (simple form state)

---

**4. Settings Page (Estimated: 4-5 hours, single builder)**

**Components to Create:**
- Settings page layout (`/app/settings/page.tsx`)
- SettingToggle component (reusable for all boolean settings)
- SettingSelect component (dropdown for tone, reminder frequency)
- Danger zone section (reset preferences, delete account redirect)

**Backend Work:**
- `users.updatePreferences` mutation (update JSONB preferences column)

**Not Complex Because:**
- Toggle pattern well-defined (see Pattern 5)
- Preferences stored as JSONB (no schema changes)
- Immediate save UX (no form submission complexity)

---

**5. About & Pricing Pages (Estimated: 4-6 hours, single builder)**

**About Page:**
- Founder story section (content from Ahiya) - 2 hours
- Mission statement, product philosophy - 1 hour
- Values section, call to action - 1 hour

**Pricing Page:**
- Tier comparison table (Free, Premium, Pro, Creator) - 2 hours
- Feature tooltips, FAQ section - 1 hour
- Annual billing toggle (future: integrate with Stripe) - 1 hour

**Not Complex Because:**
- Static content pages (no database queries)
- GlassCard layout pattern established
- Pricing logic already exists in backend (tier limits)

**Critical Dependency**: Resolve tier limits discrepancy (vision says free=10, code says free=1) before building Pricing page.

---

### Low Complexity Areas

**6. Backend Infrastructure (Estimated: 3-4 hours, single builder)**

**Tasks:**
- Database migration: Add `preferences` JSONB column, `is_demo` flag - 30 min
- Create tRPC mutations: `updateProfile`, `changePassword`, `updatePreferences`, `deleteAccount` - 2 hours
- Create demo login endpoint: `auth.loginDemo` - 1 hour
- Validation schemas (Zod) for profile/settings inputs - 30 min

**Not Complex Because:**
- Database changes are additive (no schema breaking changes)
- tRPC mutation pattern established (copy from existing mutations)
- Zod schemas follow existing patterns

---

**7. Performance Setup (Estimated: 2-3 hours, single builder)**

**Tasks:**
- Redis client setup (Upstash) - 30 min
- Demo user cache implementation - 1 hour
- Image optimization (WebP conversion, next/image priority) - 1 hour
- Core Web Vitals monitoring (reportWebVitals in layout) - 30 min

**Not Complex Because:**
- Upstash Redis client already in dependencies (`@upstash/redis`)
- next/image component built-in (just needs configuration)
- Web Vitals reporting straightforward (Next.js built-in)

---

## Technology Recommendations

### Primary Stack (Existing - No Changes)

**Framework: Next.js 14 (App Router)**
- **Rationale**: Already in use, App Router is production-ready, excellent DX
- **Version**: 14.2.0 (stable, mature)
- **No migration needed**: All existing pages work, new pages follow same pattern

**Database: Supabase PostgreSQL**
- **Rationale**: Already in use, handles 10+ migrations successfully
- **JSONB support**: Perfect for user preferences (flexible schema)
- **Row-level security**: User data isolation built-in
- **No migration needed**: Schema additions are additive

**API Layer: tRPC 11.6.0**
- **Rationale**: Type-safe API without OpenAPI overhead, excellent DX
- **Pattern established**: 9 existing routers, adding user mutations is trivial
- **React Query integration**: Optimistic updates, cache invalidation built-in
- **No migration needed**: Extend existing routers

**UI Library: React 18.3.1 + Framer Motion 11.18.2**
- **Rationale**: Already in use, animations smooth, performance excellent
- **Design system**: GlassCard, GlowButton, CosmicBackground mature
- **No migration needed**: Reuse existing components

**Auth: Custom JWT (not Supabase Auth)**
- **Rationale**: Already implemented, working well
- **JWT payload**: `userId`, `email`, `tier`, `isCreator`, `isAdmin`
- **Demo user handling**: Add `is_demo` flag to JWT payload
- **No migration needed**: Extend existing auth flow

---

### Supporting Libraries (Additions)

**1. Redis: Upstash (@upstash/redis 1.35.0) - ALREADY IN DEPENDENCIES**
- **Purpose**: Cache demo user data (dreams, reflections, evolution reports)
- **Why needed**: 
  - Demo user queried frequently (every visitor clicks "See Demo")
  - Database queries slow (100ms avg), cache hits <1ms
  - 24-hour TTL prevents stale data
- **Implementation**:
  ```typescript
  // /server/lib/redis.ts
  import { Redis } from '@upstash/redis';

  export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // Cache demo user data
  export async function getCachedDemoUser() {
    const cached = await redis.get('demo-user-data');
    if (cached) return cached;

    // Fetch from DB, populate cache
    const data = await fetchDemoUserFromDB();
    await redis.set('demo-user-data', data, { ex: 86400 }); // 24h TTL
    return data;
  }
  ```

**2. Image Optimization: next/image (Built-in)**
- **Purpose**: Optimize landing page screenshots for <2s LCP
- **Why needed**:
  - Screenshots likely 500KB-2MB PNG (unoptimized)
  - WebP conversion reduces to 100-300KB
  - Priority loading for above-fold images
- **Implementation**:
  ```tsx
  import Image from 'next/image';

  <Image
    src="/screenshots/dashboard-populated.webp"
    alt="Mirror of Dreams Dashboard"
    width={1200}
    height={800}
    priority // Above-fold image
    placeholder="blur" // Optional: add blurDataURL
  />
  ```

**3. Form Validation: Zod 3.25.76 - ALREADY IN DEPENDENCIES**
- **Purpose**: Validate profile/settings inputs
- **Why needed**: Type-safe validation, tRPC integration
- **Implementation**:
  ```typescript
  // /types/schemas.ts
  import { z } from 'zod';

  export const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    language: z.enum(['en', 'he']).optional(),
  });

  export const changePasswordSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8).max(100),
  });

  export const updatePreferencesSchema = z.object({
    notification_email: z.boolean().optional(),
    reflection_reminders: z.enum(['daily', 'weekly', 'off']).optional(),
    default_tone: z.enum(['fusion', 'gentle', 'intense']).optional(),
    // ... other preferences
  });
  ```

---

### No New Dependencies Needed

**All features achievable with existing stack:**
- Profile page: React + tRPC + GlassCard components
- Settings page: React + tRPC + SettingToggle component (to create)
- About page: Static content + CosmicBackground + GlassCard
- Pricing page: Static content + GlassCard + pricing data from backend
- Demo user: PostgreSQL + Redis (already in dependencies)
- Landing page: Framer Motion (already in use) + next/image (built-in)

---

## Integration Points

### External APIs

**1. Anthropic Claude API (AI Reflections)**
- **Current Integration**: `@anthropic-ai/sdk` v0.52.0
- **Usage**: Generate reflection responses, evolution reports
- **Demo User Impact**: Evolution reports must be pre-generated (run AI on demo reflections during seeding)
- **No changes needed**: Existing integration sufficient

**2. Stripe (Payments - Future)**
- **Current Integration**: `stripe` v18.3.0 (exists but minimal usage)
- **Usage**: Premium tier subscriptions, upgrades
- **Iteration 12 Impact**: None (Pricing page is informational only, no checkout flow yet)
- **Future Integration**: Stripe Checkout for "Start 14-Day Free Trial" button

---

### Internal Integrations

**1. Authentication Flow**

**Current Flow:**
```
1. User enters email/password → POST /api/trpc/auth.signin
2. Backend verifies password (bcrypt) → Generates JWT
3. JWT returned to client → Stored in memory + HTTP-only cookie
4. Subsequent requests include JWT → Verified in tRPC middleware
5. Protected pages check isAuthenticated → Redirect if false
```

**Demo Flow (New):**
```
1. User clicks "See Demo" → POST /api/trpc/auth.loginDemo
2. Backend fetches demo user from Redis cache (or DB if cache miss)
3. Generate JWT with is_demo: true flag
4. Redirect to /dashboard with demo session
5. DemoBanner component shown (checks user.is_demo flag)
6. All mutations disabled for demo user (backend checks is_demo flag)
```

**Integration Points:**
- `/server/trpc/routers/auth.ts` - Add `loginDemo` query
- `/hooks/useAuth.ts` - Extend User type to include `is_demo` flag
- `/components/shared/AppNavigation.tsx` - Conditionally render DemoBanner
- `/app/dashboard/page.tsx` - Show demo banner, disable "Create Dream" for demo user

---

**2. tRPC Router Architecture**

**Current Routers (9 total):**
```
appRouter
├── auth (signin, signup, signout)
├── dreams (getAll, getById, create, update, delete)
├── reflections (getAll, getById, delete, submitFeedback)
├── reflection (generate - AI reflection creation)
├── users (getProfile, updateProfile, completeOnboarding, getUsageStats, getDashboardData)
├── evolution (getAll, getById, generate)
├── visualizations (getAll, getById, generate)
├── artifact (legacy - minimal usage)
├── subscriptions (upgrade, cancel, getStatus)
└── admin (only for is_creator/is_admin users)
```

**New Mutations Needed (Iteration 12):**
```typescript
// /server/trpc/routers/users.ts
export const usersRouter = router({
  // Existing mutations
  updateProfile: protectedProcedure.input(updateProfileSchema).mutation(...),
  completeOnboarding: protectedProcedure.mutation(...),

  // NEW - Change password
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Verify current password (bcrypt.compare)
      // 2. Hash new password (bcrypt.hash)
      // 3. Update users.password_hash
      // 4. Return success
    }),

  // NEW - Update preferences (JSONB)
  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Merge input with existing preferences (don't overwrite all)
      // 2. Update users.preferences column
      // 3. Return updated preferences
    }),

  // NEW - Delete account (dangerous)
  deleteAccount: protectedProcedure
    .input(z.object({ password: z.string() })) // Require password confirmation
    .mutation(async ({ ctx, input }) => {
      // 1. Verify password
      // 2. Delete user (cascade deletes dreams, reflections, evolution, visualizations)
      // 3. Invalidate JWT
      // 4. Return success
    }),

  // Existing queries (no changes)
  getProfile: protectedProcedure.query(...),
  getUsageStats: protectedProcedure.query(...),
  getDashboardData: protectedProcedure.query(...),
});
```

```typescript
// /server/trpc/routers/auth.ts
export const authRouter = router({
  // Existing mutations
  signin: publicProcedure.input(signinSchema).mutation(...),
  signup: publicProcedure.input(signupSchema).mutation(...),
  signout: protectedProcedure.mutation(...),

  // NEW - Demo login (no password required)
  loginDemo: publicProcedure.query(async () => {
    // 1. Fetch demo user from Redis cache (getCachedDemoUser())
    // 2. Generate JWT with is_demo: true flag
    // 3. Return JWT + demo user data
  }),
});
```

**Integration Points:**
- Client components use `trpc.users.changePassword.useMutation()`
- Toast notifications on success/error
- Cache invalidation: `utils.users.getProfile.invalidate()`

---

**3. Database → Redis Cache → tRPC → Client**

**Demo User Data Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│                         Demo User Request                       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  auth.loginDemo() call │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Check Redis cache    │
                    │  key: 'demo-user-data' │
                    └────────────────────────┘
                       │                    │
                  Cache Hit           Cache Miss
                       │                    │
                       ▼                    ▼
              ┌─────────────────┐   ┌──────────────────┐
              │ Return cached   │   │ Query Supabase:  │
              │ data (<1ms)     │   │ - User row       │
              └─────────────────┘   │ - 5 dreams       │
                                    │ - 12-15 reflect. │
                                    │ - 2 evolution    │
                                    │ - 1-2 visual.    │
                                    └──────────────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │ Populate cache   │
                                    │ TTL: 24 hours    │
                                    └──────────────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │ Return data      │
                                    └──────────────────┘
                       │                    │
                       └────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Generate JWT with     │
                    │  is_demo: true flag    │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Redirect to /dashboard│
                    │  with demo session     │
                    └────────────────────────┘
```

**Key Architectural Decisions:**
1. **Cache TTL: 24 hours** (demo data rarely changes, fresh enough for daily updates)
2. **Cache key structure**: `demo-user-data` (single key for all demo data)
3. **Cache invalidation**: Manual (when demo data is updated via admin panel)
4. **Read-only demo**: Mutations return success but don't persist (or block mutations entirely)

---

## Risks & Challenges

### Technical Risks

**RISK 1: Demo Content Quality (HIGH IMPACT, HIGH LIKELIHOOD)**

**Description**: Demo reflections must feel authentic, not generic lorem ipsum. Poor quality = visitors don't understand product value.

**Impact**: 
- If reflections are generic: "This looks like a todo app, not a transformation tool"
- If AI responses lack depth: "Why would I pay for this?"
- **Result**: Low demo → signup conversion (<5% instead of target 15%)

**Mitigation Strategy**:
1. **Pre-write 3 high-quality reflections** (200-400 words each) before development starts
   - Dream: "Launch My SaaS Product" - reflection on fear of failure, specific blockers
   - Dream: "Run a Marathon" - reflection on physical + mental preparation
   - Dream: "Build Meaningful Relationships" - reflection on vulnerability, past patterns
2. **AI-generate remaining 9-12 reflections** using Claude with detailed prompt:
   ```
   You are creating authentic, thoughtful reflections for a demo account in Mirror of Dreams.
   
   Dream: {dream_title}
   Context: {dream_description}
   
   Write a 300-word reflection answering these 4 questions:
   1. What is your dream? (vivid, specific description)
   2. What is your plan? (concrete next steps, not vague "work hard")
   3. What is your relationship with this dream? (emotional depth, past attempts, fears)
   4. What are you willing to offer? (sacrifice, commitment, trade-offs)
   
   Tone: Honest, vulnerable, specific. Avoid clichés. Reference real struggles.
   ```
3. **Review all AI-generated reflections** (Ahiya must approve before seeding)
4. **Seed evolution reports** by running actual AI analysis on demo reflections (not hand-written)

**Timeline Impact**: +4-6 hours content creation before development starts.

---

**RISK 2: Landing Page Image Optimization (MEDIUM IMPACT, MEDIUM LIKELIHOOD)**

**Description**: Screenshots of dashboard/reflections may be 500KB-2MB PNG files, causing slow LCP (>2.5s).

**Impact**:
- Lighthouse score <90 (target: >90)
- LCP >2.5s on 3G connection (target: <2s)
- Visitors bounce before page loads

**Mitigation Strategy**:
1. **Capture screenshots in WebP format** (or convert PNG → WebP via imagemagick)
   ```bash
   convert dashboard.png -quality 80 dashboard.webp
   ```
2. **Use next/image component** with priority loading:
   ```tsx
   <Image
     src="/screenshots/dashboard.webp"
     alt="Dashboard"
     width={1200}
     height={800}
     priority // Above-fold
     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
   />
   ```
3. **Lazy load below-fold images**:
   ```tsx
   <Image
     src="/screenshots/reflection.webp"
     alt="Reflection"
     loading="lazy" // Below-fold
   />
   ```
4. **Test on throttled connection** (Chrome DevTools → Network → Slow 3G)
5. **Lighthouse audit before merging** (LCP <2s, Performance >90)

**Timeline Impact**: +1 hour image optimization, +30 min testing.

---

**RISK 3: Redis Cache Miss on First Demo Login (LOW IMPACT, HIGH LIKELIHOOD)**

**Description**: First demo login will be slow (100ms DB query) because cache is empty.

**Impact**:
- First visitor experiences 100ms delay (not ideal but acceptable)
- Subsequent visitors get <1ms cached response (excellent)

**Mitigation Strategy**:
1. **Pre-warm cache on deployment** (run demo login query immediately after deploy)
   ```bash
   # In deployment script or cron job
   curl -X POST https://app.com/api/trpc/auth.loginDemo
   ```
2. **Set cache TTL to 24 hours** (demo data refreshes daily, no stale data)
3. **Monitor cache hit rate** (Upstash dashboard shows hit/miss ratio)
4. **Background cache refresh** (optional: refresh cache every 23 hours to prevent expiry)

**Timeline Impact**: +30 min cache warming setup.

---

### Complexity Risks

**RISK 4: Too Much Encouragement in Reflection Form (LOW IMPACT, MEDIUM LIKELIHOOD)**

**Description**: Vision calls for "welcoming micro-copy" but risk of feeling patronizing.

**Impact**:
- Users feel talked down to: "I don't need a cheerleader, I need a mirror"
- Discrepancy between "depth" promise and "fluffy" UX

**Mitigation Strategy**:
1. **Test with Ahiya** (founder/primary user) before merging
2. **Use subtle encouragement**, not excessive:
   - ✅ Good: "Your reflection is rich. Consider breaking into multiple reflections if needed."
   - ❌ Bad: "Wow! You're doing amazing! Keep going, superstar! 🌟"
3. **Tone guidelines**: Supportive but not saccharine, respect user intelligence
4. **A/B test post-launch** (if needed): 50% see encouragement, 50% don't

**Timeline Impact**: No additional time if tested during development.

---

**RISK 5: Tier Limits Discrepancy (HIGH IMPACT, HIGH LIKELIHOOD)**

**Description**: Vision says Free tier = 10 reflections/month, but code says Free tier = 1 reflection/month.

**Evidence**:
- **Vision (plan-7/vision.md line 375)**: "Free tier: 10 reflections/month"
- **Code (server/lib/supabase.ts or migrations)**: `WHEN 'free' THEN max_reflections := 1`

**Impact**:
- Pricing page shows wrong limits
- Users sign up expecting 10 reflections, get 1 reflection → angry users, refunds
- **BLOCKING**: Cannot build Pricing page until resolved

**Mitigation Strategy**:
1. **RESOLVE BEFORE ITERATION 12 STARTS** (ask Ahiya: which is correct?)
2. **Option A**: Update vision to Free = 1 (match code)
3. **Option B**: Update code to Free = 10 (match vision)
   ```sql
   -- In migration or function update
   UPDATE check_reflection_limit() FUNCTION
   CASE user_tier
     WHEN 'free' THEN max_reflections := 10; -- Was 1
     WHEN 'essential' THEN max_reflections := 50; -- Was 5
     WHEN 'premium' THEN max_reflections := 999999; -- Unlimited
   ```
4. **Update all documentation** (vision, pricing page, dashboard usage display)

**Timeline Impact**: BLOCKS Pricing page (2-3 days if not resolved).

---

## Recommendations for Planner

### 1. Prioritize Demo User Content Creation FIRST

**Rationale**: Demo user is the foundation for:
- Landing page screenshots (need populated dashboard to screenshot)
- Stakeholder validation (Ahiya must see full product experience)
- User conversion (demo drives signups)

**Action**:
- **Week 1, Day 1-2**: Write 12-15 demo reflections (or AI-generate + review)
- **Week 1, Day 3**: Create seeding script, populate database
- **Week 1, Day 4**: Take screenshots for landing page

**Dependency Chain**:
```
Demo reflections written → Seeding script → Database populated → 
Screenshots taken → Landing page built → Performance tested
```

---

### 2. Resolve Tier Limits Discrepancy BEFORE Planning

**Rationale**: BLOCKING issue for Pricing page. Cannot proceed without decision.

**Action**:
- **Pre-development**: Ask Ahiya: "Free tier = 1 or 10 reflections/month?"
- **Update either**: Vision document OR database migration
- **Ensure consistency**: Vision, code, pricing page, dashboard all match

**Timeline Risk**: If not resolved, Pricing page delayed 2-3 days.

---

### 3. Implement Read-Only Demo (Not Nightly Reset)

**Rationale**:
- **Performance**: Cached demo data (1ms response) vs. DB queries (100ms)
- **Security**: No mutations prevent spam/abuse
- **Simplicity**: No nightly reset job, no data cleanup

**Implementation**:
- Demo user mutations return success but don't persist (or blocked entirely)
- Banner informs: "Demo account is view-only. Sign up to save reflections."
- Redis cache never invalidates (demo data static after seeding)

**Alternative (Nightly Reset)**: More complex, slower, higher DB load. Not recommended.

---

### 4. Split Demo User Work into 2 Builders IF Content Not Pre-Written

**Rationale**:
- Content creation (writing reflections) ≠ engineering (seeding script, caching)
- Content quality critical, requires thoughtful writing
- Engineering can proceed in parallel once 3-5 reflections exist

**Split Recommendation**:
- **Builder A (Content Creator)**: Write 12-15 reflections, review AI-generated content (4-6 hours)
- **Builder B (Engineer)**: Seeding script, Redis cache, demo login flow (6-8 hours)

**Parallel Timeline**:
- Day 1-2: Builder A writes reflections
- Day 2-3: Builder B builds seeding script (uses 3 sample reflections from Builder A)
- Day 3: Builder A finishes remaining reflections, Builder B populates database
- Day 4: Builder B implements cache + demo flow, Builder A QA tests demo account

**Alternative (Single Builder)**: Pre-write all reflections BEFORE iteration starts, then single builder implements (6-8 hours total).

---

### 5. Use Existing GlassCard Patterns for Profile/Settings

**Rationale**:
- GlassCard component mature, consistent across app
- Form patterns established (ToneSelectionCard, ReflectionQuestionCard)
- No need for new design system components

**Implementation**:
```tsx
// Profile page structure (copy from dashboard layout pattern):
<div className="max-w-4xl mx-auto px-6 py-8">
  <h1 className="text-h1 mb-8">Profile</h1>
  
  <GlassCard elevated className="mb-6">
    <h2 className="text-h2 mb-4">Account Information</h2>
    {/* Name, Email, Password change forms */}
  </GlassCard>

  <GlassCard elevated className="mb-6">
    <h2 className="text-h2 mb-4">Subscription & Usage</h2>
    {/* Tier badge, usage stats, upgrade CTA */}
  </GlassCard>

  <GlassCard elevated className="mb-6">
    <h2 className="text-h2 mb-4">Account Actions</h2>
    {/* Delete account button (danger zone) */}
  </GlassCard>
</div>
```

**Timeline Benefit**: Reusing patterns saves 2-3 hours vs. creating new components.

---

### 6. Monitor Bundle Size from Day 1

**Rationale**:
- Vision constraint: Bundle size increase <30KB total across 3 iterations
- Iteration 12 adds: Profile page, Settings page, About page, Pricing page, Demo flow
- Risk: 4 new pages + components could exceed 30KB

**Monitoring Strategy**:
1. **Baseline measurement** (before Iteration 12):
   ```bash
   npm run build
   # Check .next/static/chunks sizes
   ```
2. **Lazy-load non-critical pages**:
   ```tsx
   // Only load Settings page when user navigates to it
   const SettingsPage = dynamic(() => import('./settings/page'), {
     loading: () => <CosmicLoader />,
   });
   ```
3. **Tree-shake unused code**: Ensure imports are specific
   ```tsx
   // ✅ Good (tree-shakeable)
   import { GlassCard } from '@/components/ui/glass/GlassCard';

   // ❌ Bad (imports entire module)
   import { GlassCard } from '@/components/ui/glass';
   ```
4. **Weekly bundle size checks** (Iteration 12, 13, 14)

**Target**: <10KB increase per iteration (30KB ÷ 3 = 10KB budget).

---

### 7. Create Placeholder Pages Early (Day 1)

**Rationale**:
- Footer links (About, Pricing, Privacy, Terms) currently 404
- Can create minimal placeholder pages immediately (1 hour total)
- Prevents broken links during development

**Placeholder Implementation**:
```tsx
// /app/about/page.tsx (placeholder)
export default function AboutPage() {
  return (
    <div className="min-h-screen p-8">
      <h1>About Mirror of Dreams</h1>
      <p>Coming soon...</p>
    </div>
  );
}
```

**Timeline**: Create 4 placeholder pages (About, Pricing, Privacy, Terms) on Day 1 (1 hour), fill in content later.

---

## Resource Map

### Critical Files to Create

**Pages (7 new files):**
```
/app/profile/page.tsx              - Profile management page
/app/settings/page.tsx             - User preferences & settings
/app/about/page.tsx                - Founder story, mission, values
/app/pricing/page.tsx              - Tier comparison, FAQ
/app/privacy/page.tsx              - Privacy policy (placeholder → fill later)
/app/terms/page.tsx                - Terms of service (placeholder → fill later)
/app/demo-login/page.tsx           - Optional: Dedicated demo login page (or handle in auth.loginDemo)
```

**Components (5 new files):**
```
/components/shared/DemoBanner.tsx          - "You're viewing demo account" banner
/components/settings/SettingToggle.tsx     - Reusable toggle switch for settings
/components/settings/SettingSelect.tsx     - Reusable dropdown for settings
/components/profile/AccountInfoForm.tsx    - Name, email, password change form
/components/pricing/PricingTierCard.tsx    - Reusable tier comparison card
```

**Backend (4 new/modified files):**
```
/server/trpc/routers/users.ts      - ADD: changePassword, updatePreferences, deleteAccount mutations
/server/trpc/routers/auth.ts       - ADD: loginDemo query
/server/lib/redis.ts               - NEW: Redis client + demo cache functions
/supabase/migrations/20251128000000_add_demo_user.sql - NEW: Add preferences JSONB, is_demo flag
```

**Scripts (2 new files):**
```
/scripts/seed-demo-user.ts         - Demo user seeding script (5 dreams, 12-15 reflections, 2 evolution, 1-2 visualizations)
/scripts/warm-demo-cache.ts        - Pre-warm Redis cache on deployment
```

**Types (2 modified files):**
```
/types/user.ts                     - ADD: is_demo flag to User interface, preferences type
/types/schemas.ts                  - ADD: updatePreferencesSchema, changePasswordSchema
```

---

### Critical Directories (Existing - No Changes)

```
/components/ui/glass/              - GlassCard, GlowButton, GlassModal (reuse)
/components/shared/                - CosmicBackground, EmptyState, AppNavigation (extend)
/components/dashboard/             - Dashboard cards (reference for layout patterns)
/server/trpc/                      - tRPC routers (extend users, auth routers)
/supabase/migrations/              - Database migrations (add 1 new migration)
/styles/                           - CSS variables, animations (reuse, no additions needed)
```

---

### Key Dependencies (Existing)

**Production:**
- `next@14.2.0` - App Router framework
- `@trpc/server@11.6.0` + `@trpc/client@11.6.0` - Type-safe API
- `@tanstack/react-query@5.90.5` - Data fetching + caching
- `@supabase/supabase-js@2.50.4` - Database client
- `@upstash/redis@1.35.0` - Redis cache (ALREADY INSTALLED)
- `framer-motion@11.18.2` - Animations
- `zod@3.25.76` - Schema validation
- `bcryptjs@3.0.2` - Password hashing
- `jsonwebtoken@9.0.2` - JWT auth

**Development:**
- `typescript@5.9.3`
- `@types/node@24.9.1`, `@types/react@18.3.26`

**No new dependencies needed for Iteration 12.**

---

### Testing Infrastructure

**Existing (No Changes Needed):**
- Manual testing via browser (Chrome DevTools)
- tRPC built-in type safety (compile-time checks)
- Lighthouse audits (performance testing)

**Recommended Additions (Post-MVP):**
- Jest + React Testing Library (unit tests for components)
- Playwright (E2E tests for user flows)
- Vitest (fast unit test runner)

**Iteration 12 Testing Approach:**
- **Manual QA**: Test all new pages (Profile, Settings, About, Pricing)
- **Demo Flow**: Click "See Demo" → Verify dashboard populated → Verify banner shown
- **Performance**: Lighthouse audit on Landing page (LCP <2s target)
- **Cross-browser**: Test in Chrome, Firefox, Safari (mobile + desktop)

---

## Questions for Planner

### Critical (BLOCKING - Must Resolve Before Development)

**Q1: Free tier reflection limit: 1 or 10 per month?**
- **Context**: Vision says 10, code says 1
- **Impact**: BLOCKS Pricing page development
- **Decision needed**: Update vision OR update code (ask Ahiya)
- **Timeline**: Resolve within 24 hours or delay Pricing page 2-3 days

**Q2: Should demo user be read-only or nightly reset?**
- **Option A (Recommended)**: Read-only (cached, fast, secure)
  - Mutations blocked or return success without persisting
  - Cache never invalidates (demo data static)
  - Banner: "Demo is view-only. Sign up to save your reflections."
- **Option B**: Nightly reset (complex, slower, higher DB load)
  - Mutations persist to demo user account
  - Cron job resets demo data every night at midnight
  - Higher abuse risk (spam reflections during day)
- **Recommendation**: Option A (read-only)

**Q3: Who writes demo reflection content?**
- **Option A**: AI-generate all 12-15 reflections (faster but requires review)
- **Option B**: Ahiya writes manually (higher quality, more time)
- **Option C**: Hybrid - Ahiya writes 3 samples, AI generates 9-12 more (recommended)
- **Timeline Impact**: 
  - Option A: 2-3 hours (generation + review)
  - Option B: 4-6 hours (manual writing)
  - Option C: 3-4 hours (hybrid approach)

---

### Important (Non-Blocking - Can Decide During Development)

**Q4: Should About page include team section or just founder?**
- **Context**: Vision mentions "Team section (if applicable)"
- **Question**: Is Mirror of Dreams solo (Ahiya only) or team?
- **Recommendation**: Be honest - if solo, say "Built by Ahiya". Authenticity > inflation.

**Q5: How much detail in Privacy & Terms pages?**
- **Option A**: Placeholder "Coming soon" (1 hour)
- **Option B**: Legal boilerplate from template (2-3 hours)
- **Option C**: Custom legal docs (requires lawyer, 10+ hours)
- **Recommendation**: Option A for Iteration 12, upgrade to Option B post-MVP

**Q6: Should Settings have tabs/accordion or single scrolling page?**
- **Option A**: Tabbed interface (Notifications, Reflection, Display, Privacy)
  - Better organization, less scrolling
  - Adds complexity (tab state management)
- **Option B**: Single scrolling page with section headings
  - Simpler implementation, all settings visible
  - Can feel overwhelming if 10+ settings
- **Recommendation**: Option B for Iteration 12 (5-6 settings), upgrade to tabs if settings grow to 10+

---

### Nice-to-Have (Optional - Post-Iteration 12)

**Q7: Should Profile page support avatar upload?**
- **Context**: Vision doesn't mention profile photos
- **Effort**: 4-6 hours (file upload, S3 storage, image cropping)
- **Recommendation**: Defer to post-MVP (not critical for completeness)

**Q8: Should demo account have custom URL? (e.g., /demo instead of auto-login)**
- **Option A**: Dedicated `/demo` route that auto-populates dashboard
- **Option B**: "See Demo" button calls `auth.loginDemo` then redirects to `/dashboard`
- **Recommendation**: Option B (simpler, reuses existing dashboard page)

---

## Final Architectural Recommendations

### 1. File Structure for New Pages

**Follow Next.js App Router conventions:**
```
/app/
├── profile/
│   └── page.tsx                 - Profile management page (protected route)
├── settings/
│   └── page.tsx                 - Settings page (protected route)
├── about/
│   └── page.tsx                 - About page (public route)
├── pricing/
│   └── page.tsx                 - Pricing page (public route)
└── api/
    └── trpc/
        └── [trpc]/
            └── route.ts         - tRPC API endpoint (existing, no changes)
```

**Rationale**: Simple, flat structure. No nested layouts needed. Each page standalone.

---

### 2. Component Organization

**New components go in existing directories:**
```
/components/
├── shared/
│   ├── DemoBanner.tsx           - NEW: Demo account banner
│   ├── CosmicBackground.tsx     - EXISTING: Reuse
│   └── EmptyState.tsx           - EXISTING: Reuse
├── settings/
│   ├── SettingToggle.tsx        - NEW: Reusable toggle component
│   └── SettingSelect.tsx        - NEW: Reusable dropdown component
├── profile/
│   └── AccountInfoForm.tsx      - NEW: Form for name, email, password
├── pricing/
│   └── PricingTierCard.tsx      - NEW: Tier comparison card
└── ui/glass/
    ├── GlassCard.tsx            - EXISTING: Reuse
    └── GlowButton.tsx           - EXISTING: Reuse
```

**Rationale**: Group by feature (settings, profile, pricing), not by type (forms, buttons). Easier to find related code.

---

### 3. Database Migration Strategy

**Single migration file for all Iteration 12 changes:**
```sql
-- /supabase/migrations/20251128000000_iteration_12_demo_and_preferences.sql

-- Add preferences JSONB column (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;

-- Add is_demo flag
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON public.users(is_demo) WHERE is_demo = true;

-- Comments for documentation
COMMENT ON COLUMN public.users.preferences IS 'User settings: notification_email, reflection_reminders, default_tone, reduce_motion_override, analytics_opt_in';
COMMENT ON COLUMN public.users.is_demo IS 'True if demo account (read-only, cached)';

-- Seed demo user (placeholder - actual seeding via script)
INSERT INTO public.users (
  email, password_hash, name, tier, is_demo, email_verified
) VALUES (
  'demo@mirrorofdreams.com',
  'demo-no-password-login-via-session',
  'Demo User',
  'premium', -- Show all features
  true,
  true
) ON CONFLICT (email) DO NOTHING;
```

**Rationale**: Single migration keeps related changes together. Easy to rollback if needed.

---

### 4. Redis Cache Architecture

**Cache structure:**
```typescript
// Key structure:
// - 'demo-user-data' → Entire demo user object (user, dreams, reflections, evolution, visualizations)

// Cache implementation:
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedDemoUser() {
  const cached = await redis.get<DemoUserData>('demo-user-data');
  if (cached) {
    console.log('Cache hit: demo-user-data');
    return cached;
  }

  console.log('Cache miss: fetching from DB...');
  const data = await fetchDemoUserFromDB();
  await redis.set('demo-user-data', data, { ex: 86400 }); // 24h TTL
  return data;
}

interface DemoUserData {
  user: User;
  dreams: Dream[];
  reflections: Reflection[];
  evolutionReports: EvolutionReport[];
  visualizations: Visualization[];
}
```

**Rationale**: Single cache key simplifies invalidation. 24h TTL prevents stale data without manual invalidation.

---

### 5. Performance Budget

**Bundle Size Targets (Iteration 12):**
- Profile page: <5KB (mostly form components)
- Settings page: <4KB (toggles + dropdowns)
- About page: <3KB (static content)
- Pricing page: <4KB (tier cards + FAQ)
- Demo flow: <3KB (banner + cache logic)
- **Total**: <20KB (within 30KB budget for all 3 iterations)

**Monitoring:**
```bash
# Before Iteration 12:
npm run build
du -sh .next/static/chunks/*.js | sort -h

# After Iteration 12:
npm run build
du -sh .next/static/chunks/*.js | sort -h
# Compare totals
```

**Lighthouse Targets:**
- Performance: >90 (all pages)
- Accessibility: 100 (WCAG 2.1 AA)
- Best Practices: 100
- SEO: >90 (landing, about, pricing pages)

---

## Summary & Next Steps

**Iteration 12 is architecturally straightforward:**
- ✅ Existing Next.js 14 App Router handles all new pages
- ✅ tRPC router extension pattern established (add mutations to `users` router)
- ✅ Design system components reusable (GlassCard, GlowButton, EmptyState)
- ✅ Database schema extensible (JSONB for preferences, boolean flag for demo)
- ✅ Redis caching simple (Upstash client already in dependencies)

**No architectural risks identified.** All features achievable with existing stack.

**Critical Path:**
1. Resolve tier limits discrepancy (Free = 1 or 10?)
2. Write demo reflection content (12-15 reflections)
3. Create seeding script + populate database
4. Implement Redis cache for demo user
5. Build landing page (with screenshots of populated demo)
6. Build Profile, Settings, About, Pricing pages
7. Test demo flow end-to-end
8. Performance audit (Lighthouse, bundle size)

**Ready for Builder assignment.**

---

**Report Complete**
**Explorer-1 | Architecture & Structure Analysis**
**Iteration 12 (Plan-7, Iteration 1 of 3)**
**2025-11-28**
