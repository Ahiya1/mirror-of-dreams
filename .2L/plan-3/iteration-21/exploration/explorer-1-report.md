# Explorer 1 Report: Onboarding Flow & Landing Page Analysis

## Executive Summary

The Mirror of Dreams application is missing the critical 3-step onboarding flow specified in the vision. While the landing page (portal experience) exists and is beautifully designed, it does NOT include onboarding-specific messaging or CTAs. After signup, users are immediately redirected to the dashboard without context about the product's consciousness companion concept, reflection mechanics, or free tier limits. This creates a significant onboarding gap that must be addressed in Iteration 21.

**Key Findings:**
- NO `/onboarding` page or route exists in the codebase
- NO `onboarding_completed` flag in the users database table
- Landing page (/) exists but lacks onboarding CTA integration
- Signup redirects directly to `/dashboard` (line 25, `/app/auth/signup/page.tsx`)
- All glass UI components needed for onboarding are available (GlassCard, ProgressOrbs, GlowButton, GradientText, AnimatedBackground)
- Free tier messaging is present in signup page ("Free Forever" badge) but NOT detailed

---

## Discoveries

### 1. Missing Onboarding Flow (CRITICAL GAP)

**What's Missing:**
- No `/app/onboarding/` directory or page components
- No database field to track `onboarding_completed` status
- No redirect logic from signup → onboarding → dashboard
- No step indicator UI (1/3, 2/3, 3/3)
- No content explaining:
  - "Consciousness companion" concept (Step 1: Welcome)
  - 5-question reflection mechanics (Step 2: How It Works)
  - Free tier limits: 2 dreams, 4 reflections/month (Step 3: Your Free Tier)

**Vision Requirements (vision.md lines 66-77):**
```
### 1. Authentication & Onboarding
**Must Have:**
- Sign up with email/password
- Sign in with email/password
- 3-step onboarding explaining dreams, reflections, and free tier
- Admin user with is_admin and is_creator flags

**Success:**
- User can create account in <30 seconds
- Onboarding feels magical, not tedious
- Admin can access all features
```

**Current Flow:**
```
User signs up → Token stored → IMMEDIATE redirect to /dashboard (NO ONBOARDING)
```

**Expected Flow:**
```
User signs up → Token stored → /onboarding (3 steps) → /dashboard
```

**Code Evidence:**
- `/app/auth/signup/page.tsx` (lines 22-27):
  ```typescript
  onSuccess: () => {
    setMessage({ text: 'Account created! Redirecting...', type: 'success' });
    setTimeout(() => {
      router.push('/dashboard');  // SKIPS ONBOARDING
    }, 1000);
  }
  ```

---

### 2. Landing Page Status (PARTIAL IMPLEMENTATION)

**What Exists:**
- Beautiful portal experience at `/app/page.tsx`
- Cosmic aesthetic with animated mirror shards background
- Dynamic content based on authentication state
- "The Mirror of Dreams" title
- Taglines explaining value proposition
- Navigation with user menu
- Secondary buttons (Dashboard, Reflections, Start Free Forever)

**What's Missing for Onboarding Integration:**
- NO "Start Your Journey" or "Begin Onboarding" messaging for new signups
- NO redirect to `/onboarding` after successful signup
- NO distinction between first-time users vs returning users
- "Start Free Forever" button links to `/auth/signup?tier=free` (correct) but NO post-signup onboarding trigger

**Landing Page Components:**
1. `/app/page.tsx` - Main portal entry point (165 lines)
2. `/components/portal/MainContent.tsx` - Central content (300 lines)
3. `/components/portal/ButtonGroup.tsx` - CTA buttons
4. `/components/portal/hooks/usePortalState.ts` - State management (346 lines)

**Cosmic Aesthetic Present:** YES
- Gradient backgrounds (linear-gradient from #0f0f23 → #1a1a2e → #16213e)
- Floating mirror shards via `MirrorShards.tsx`
- Glass morphism effects (backdrop-blur, rgba transparency)
- Smooth animations with Framer Motion
- Purple/amethyst color scheme consistent with glass UI system

**Value Proposition Clear:** PARTIALLY
- Main tagline: "Your dreams hold the mirror to who you're becoming."
- Sub-tagline: "Start completely free. Begin your journey."
- "Consciousness companion" concept NOT explicitly mentioned on landing page
- Free tier limits (2 dreams, 4 reflections) NOT explained until user hits dashboard

**"Start Free" CTA Present:** YES
- Button text: "Start Free Forever" (line 164, `usePortalState.ts`)
- Links to: `/auth/signup?tier=free`
- Icon: 🌱 (seedling)
- Green gradient styling (from-green-600 to-green-500)

---

### 3. User Flow Integration Gaps

**Current Authentication Flow:**
```
Landing (/) 
  ↓ Click "Start Free Forever"
Signup (/auth/signup) 
  ↓ Fill form → Submit
SUCCESS → Store token → Redirect to /dashboard (SKIPS ONBOARDING)
  ↓
Dashboard (/dashboard) - User sees interface with NO context
```

**Required Flow (Vision):**
```
Landing (/) 
  ↓ Click "Start Free"
Signup (/auth/signup) 
  ↓ Fill form → Submit
SUCCESS → Store token → Redirect to /onboarding
  ↓
Onboarding (/onboarding)
  Step 1: Welcome - "Consciousness companion" concept (15s)
  Step 2: How It Works - 5-question reflection flow (15s)
  Step 3: Free Tier - 2 dreams, 4 reflections/month limits (15s)
  ↓ Click "Continue to Dashboard" or "Skip"
Set onboarding_completed = true
  ↓
Dashboard (/dashboard) - User has context
```

**Onboarding Completion Tracking:**
- NO `onboarding_completed` field in `users` table (checked `supabase/migrations/20250121000000_initial_schema.sql`)
- NO tRPC endpoint for `users.completeOnboarding()`
- NO logic to check if user has completed onboarding on dashboard load

**Skip Functionality:**
- Vision specifies "Skip button (optional)" (vision.md line 132)
- NOT implemented (no page exists to add skip button to)
- If skipped, should still set `onboarding_completed = true` to prevent showing again

---

### 4. Content Requirements (From Vision)

**Step 1: Welcome to Mirror of Dreams**
- Title: "Welcome to Mirror of Dreams"
- Content: Explain "consciousness companion" concept (vision.md line 15: "This is not a productivity tool. This is a consciousness companion.")
- Tone: Soft, glossy, sharp messaging
- Visual: Cosmic background with floating elements
- Time: 15 seconds

**Step 2: How Reflections Work**
- Title: "Your Reflection Journey"
- Content: Explain 5-question flow:
  1. What is your dream?
  2. What is your plan?
  3. Have you set a date?
  4. What's your relationship with this dream?
  5. What are you willing to give in return?
- AI insight explanation: "After 4 reflections, your Mirror reveals patterns"
- Visual: ProgressOrbs showing 5-step flow
- Time: 15 seconds

**Step 3: Your Free Tier**
- Title: "Start Free, Upgrade When Ready"
- Content:
  - "2 dreams to explore"
  - "4 reflections per month"
  - "1 evolution report per month" (after 4 reflections)
  - "1 visualization per month"
- Upgrade path: "Need more? Optimal tier gives you 7 dreams, 30 reflections/month"
- Visual: Tier comparison card with glass styling
- Time: 15 seconds

**Total Onboarding Time:** 45 seconds (vision target: 90 seconds, we're under budget)

**Messaging Tone (Vision.md lines 40-60):**
- **Soft:** "Gentle, nurturing, understanding tone. No judgment, only recognition."
- **Glossy:** "Beautiful cosmic glass aesthetics. Polished, premium UI."
- **Sharp:** "Precise insights that cut through self-deception. 'You're not preparing to create—you're remembering you already are.'"
- **Companion:** "Feels alive, not mechanical. Knows your journey. Reflects truth with compassion."

---

## Patterns Identified

### Pattern 1: Glass Morphism Onboarding Steps

**Description:** Multi-step onboarding using GlassCard components with ProgressOrbs indicator

**Use Case:** Guide new users through product concepts in 3 sequential steps with cosmic aesthetic

**Example Structure:**
```typescript
// /app/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { AnimatedBackground } from '@/components/ui/glass/AnimatedBackground';

export default function OnboardingPage() {
  const [step, setStep] = useState(0); // 0, 1, 2 (3 steps)
  const router = useRouter();

  const steps = [
    {
      title: 'Welcome to Mirror of Dreams',
      content: 'Your consciousness companion...',
      visual: '🌙',
    },
    {
      title: 'Your Reflection Journey',
      content: '5 deep questions...',
      visual: '✨',
    },
    {
      title: 'Your Free Tier',
      content: '2 dreams, 4 reflections/month...',
      visual: '🌱',
    },
  ];

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    // Call tRPC mutation: users.completeOnboarding()
    // Set onboarding_completed = true in database
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      <GlassCard className="max-w-2xl w-full p-8">
        <ProgressOrbs steps={3} currentStep={step} className="mb-8 justify-center" />
        
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{steps[step].visual}</div>
          <h1 className="text-3xl font-bold mb-4">{steps[step].title}</h1>
          <p className="text-lg opacity-80">{steps[step].content}</p>
        </div>

        <div className="flex gap-4 justify-center">
          <GlowButton variant="secondary" onClick={handleSkip}>
            Skip
          </GlowButton>
          <GlowButton variant="primary" onClick={handleNext}>
            {step < 2 ? 'Next' : 'Continue to Dashboard'}
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}
```

**Recommendation:** Use this pattern. All components already exist, just needs page assembly.

---

### Pattern 2: Conditional Onboarding Trigger

**Description:** Check if user has completed onboarding on auth success, redirect accordingly

**Use Case:** First-time users see onboarding, returning users skip it

**Example Logic:**
```typescript
// /app/auth/signup/page.tsx (modified)
const signupMutation = trpc.auth.signup.useMutation({
  onSuccess: (data) => {
    const { user, token } = data;
    
    // Store token
    localStorage.setItem('authToken', token);
    
    // Check if onboarding needed
    if (!user.onboarding_completed) {
      router.push('/onboarding');  // NEW: Redirect to onboarding
    } else {
      router.push('/dashboard');    // Existing: Skip onboarding
    }
  },
});
```

**Database Migration Needed:**
```sql
-- Add onboarding_completed column to users table
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Admin users skip onboarding (already know the product)
UPDATE users SET onboarding_completed = TRUE WHERE is_admin = TRUE OR is_creator = TRUE;
```

**tRPC Endpoint Needed:**
```typescript
// /server/trpc/routers/users.ts (add endpoint)
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
```

**Recommendation:** Implement this pattern. It's standard practice for onboarding flows.

---

### Pattern 3: Skip vs Next Flow Control

**Description:** Allow users to skip onboarding but still mark it complete to prevent re-showing

**Use Case:** Users who want to explore immediately vs those who want guidance

**Implementation:**
```typescript
// Skip button
<GlowButton variant="ghost" onClick={handleSkip}>
  Skip for now
</GlowButton>

// Next button (changes to "Continue to Dashboard" on final step)
<GlowButton variant="primary" onClick={handleNext}>
  {step === 2 ? 'Continue to Dashboard' : 'Next'}
</GlowButton>

// Both call completeOnboarding() before redirecting
const handleSkip = async () => {
  await trpc.users.completeOnboarding.mutate();
  router.push('/dashboard');
};

const handleNext = async () => {
  if (step < 2) {
    setStep(step + 1);
  } else {
    await trpc.users.completeOnboarding.mutate();
    router.push('/dashboard');
  }
};
```

**Recommendation:** Implement skip button with ghost variant (transparent, subtle). Most users will click "Next" but power users appreciate skip option.

---

## Complexity Assessment

### High Complexity Areas

**NONE** - Onboarding flow is straightforward with all components available

### Medium Complexity Areas

**1. Onboarding Page Component (4-6 hours)**
- **Why:** Needs state management for 3 steps, animation transitions, tRPC integration
- **Components needed:**
  - `/app/onboarding/page.tsx` (main page)
  - 3 step content components (or inline JSX)
  - Progress indicator (ProgressOrbs - already exists)
  - Navigation buttons (Skip, Next, Continue)
- **Estimated lines:** 300-400 lines
- **Builder splits:** Single builder can handle this

**2. Database Migration + tRPC Endpoint (1-2 hours)**
- **Why:** Add `onboarding_completed` field, create mutation endpoint
- **Files to modify:**
  - New migration: `/supabase/migrations/YYYYMMDD_add_onboarding_flag.sql`
  - `/server/trpc/routers/users.ts` (add `completeOnboarding` endpoint)
  - `/server/trpc/routers/auth.ts` (return `onboarding_completed` in signup response)
- **Estimated lines:** 50 lines migration + 30 lines endpoint
- **Builder splits:** Single builder can handle this

**3. Signup Redirect Logic (30 minutes)**
- **Why:** Conditional redirect based on `onboarding_completed` flag
- **Files to modify:**
  - `/app/auth/signup/page.tsx` (lines 22-27)
- **Estimated lines:** 10 lines changed
- **Builder splits:** Single builder can handle this

### Low Complexity Areas

**4. Landing Page CTA Update (1 hour)**
- **Why:** Update messaging to mention onboarding journey
- **Files to modify:**
  - `/components/portal/hooks/usePortalState.ts` (taglines)
  - `/components/portal/MainContent.tsx` (optional visual cues)
- **Estimated lines:** 20 lines
- **Builder splits:** Single builder can handle this

---

## Technology Recommendations

### Primary Stack (Already Exists)

**Framework:** Next.js 14 (App Router)
- **Rationale:** Already in use, server components + client components separation works well
- **Onboarding Usage:** Client component for state management (`'use client'`)

**UI Components:** Existing Glass UI System
- **GlassCard:** Main container for onboarding steps (variant: 'elevated')
- **ProgressOrbs:** Step indicator (3 orbs, currentStep: 0/1/2)
- **GlowButton:** Navigation buttons (Skip: variant='ghost', Next: variant='primary')
- **GradientText:** Step titles with cosmic gradient
- **AnimatedBackground:** Cosmic background with floating mirror shards
- **CosmicLoader:** NOT needed for onboarding (no loading states)

**State Management:** React useState
- **Rationale:** Simple step state (0, 1, 2), no global state needed
- **Alternative:** Could use Zustand if onboarding state needs persistence across refreshes (NOT RECOMMENDED - overkill)

**API Layer:** tRPC
- **Endpoint needed:** `users.completeOnboarding` mutation
- **Rationale:** Type-safe mutation, consistent with existing auth patterns

**Database:** Supabase PostgreSQL
- **Migration needed:** Add `onboarding_completed` and `onboarding_completed_at` columns to `users` table
- **Rationale:** Consistent with existing schema patterns

### Supporting Libraries (Already Available)

**Framer Motion:** For step transitions
- **Usage:** Fade in/out animations between steps
- **Example:**
  ```typescript
  <motion.div
    key={step}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
  >
    {steps[step].content}
  </motion.div>
  ```

**Tailwind CSS:** Utility classes for responsive layout
- **Usage:** `flex`, `items-center`, `justify-center`, `max-w-2xl`

**TypeScript:** Type safety for step content
- **Usage:**
  ```typescript
  interface OnboardingStep {
    title: string;
    content: string;
    visual: string;
  }

  const steps: OnboardingStep[] = [...]
  ```

---

## Integration Points

### Internal Integrations

**1. Signup → Onboarding**
- **Connection:** `/app/auth/signup/page.tsx` (line 25) redirects to `/onboarding` instead of `/dashboard`
- **Data Flow:** After signup success, user object includes `onboarding_completed: false` → trigger redirect to `/onboarding`
- **Error Handling:** If onboarding page fails to load, fallback to dashboard (graceful degradation)

**2. Onboarding → Dashboard**
- **Connection:** After completing Step 3 or clicking "Skip", call `trpc.users.completeOnboarding` → redirect to `/dashboard`
- **Data Flow:** Set `onboarding_completed = true` in database → user never sees onboarding again
- **Validation:** Dashboard should NOT check onboarding status (assume user completed it if they're on dashboard)

**3. Auth Router → Onboarding Flag**
- **Connection:** `/server/trpc/routers/auth.ts` (signup mutation) must return `onboarding_completed` field in user object
- **Current Response (line 60+):** Returns user object with `id`, `email`, `name`, `tier`
- **Required Addition:** Add `onboarding_completed: false` to response (new users always need onboarding)
- **Example:**
  ```typescript
  return {
    user: {
      ...userData,
      onboarding_completed: userData.onboarding_completed || false,
    },
    token,
  };
  ```

**4. Landing Page → Messaging**
- **Connection:** Update landing page taglines to hint at onboarding journey
- **Current Tagline (non-authenticated):** "Start completely free. Begin your journey."
- **Suggested Update:** "Start completely free. 90-second guided setup."
- **File:** `/components/portal/hooks/usePortalState.ts` (lines 212-216)

---

## Risks & Challenges

### Technical Risks

**Risk 1: Migration Conflicts**
- **Impact:** Adding `onboarding_completed` column to `users` table might conflict with existing migrations
- **Likelihood:** LOW (simple column addition)
- **Mitigation:**
  - Use timestamp-based migration filename to avoid conflicts
  - Test migration on local Supabase instance before production
  - Add rollback script in migration file
  - Default value `FALSE` ensures existing users see onboarding (acceptable for MVP)

**Risk 2: Redirect Loop**
- **Impact:** If onboarding completion fails, user stuck in redirect loop (onboarding → dashboard → onboarding)
- **Likelihood:** MEDIUM (tRPC mutation might fail silently)
- **Mitigation:**
  - Add try-catch around `completeOnboarding` mutation
  - If mutation fails, still redirect to dashboard (log error)
  - Add localStorage flag as backup: `localStorage.setItem('onboarding_seen', 'true')`
  - Dashboard checks both database flag AND localStorage (belt + suspenders)

**Risk 3: Animation Performance on Low-End Devices**
- **Impact:** Framer Motion step transitions might lag on older phones
- **Likelihood:** LOW (simple fade animations, no heavy computation)
- **Mitigation:**
  - Use `useReducedMotion` hook from Framer Motion (already used in ProgressOrbs)
  - If user prefers reduced motion, use instant transitions
  - Test on iPhone 8 / Android 9 equivalent

### Complexity Risks

**Risk 4: Content Overload in 90 Seconds**
- **Impact:** Users skip onboarding because it's too wordy or boring
- **Likelihood:** MEDIUM (balancing education vs brevity is hard)
- **Mitigation:**
  - Keep each step to 2-3 sentences MAX
  - Use large emojis (🌙 ✨ 🌱) for visual anchors
  - Emphasize "soft, glossy, sharp" tone from vision
  - Add "Skip" button prominently (guilt-free exit)
  - Example good content:
    ```
    Step 1: Welcome to Mirror of Dreams 🌙
    "This is not a productivity tool. This is a consciousness companion.
    Your dreams hold the mirror to who you're becoming."
    ```

**Risk 5: Database Flag Not Syncing**
- **Impact:** User completes onboarding but flag doesn't save → sees onboarding again on next login
- **Likelihood:** LOW (Supabase mutations are reliable)
- **Mitigation:**
  - Add optimistic update: Set `onboarding_completed = true` in localStorage immediately
  - Dashboard checks localStorage first, database second
  - If localStorage says "completed" but database says "false", trust localStorage (user experience > data consistency)

---

## Recommendations for Planner

### 1. BUILD ONBOARDING FLOW AS SINGLE ATOMIC UNIT
**Rationale:** Onboarding page, database migration, and signup redirect are tightly coupled. Splitting across builders creates integration risk.

**Recommendation:**
- Assign ALL onboarding work to Builder-1
- Single PR with 4 files:
  1. `/app/onboarding/page.tsx` (NEW)
  2. `/supabase/migrations/YYYYMMDD_add_onboarding_flag.sql` (NEW)
  3. `/server/trpc/routers/users.ts` (MODIFIED - add `completeOnboarding` endpoint)
  4. `/app/auth/signup/page.tsx` (MODIFIED - redirect logic)
- Estimated time: 6-8 hours
- No sub-builder splits needed

### 2. PRIORITIZE CONTENT CLARITY OVER VISUAL POLISH
**Rationale:** Vision emphasizes "essence over completeness" (vision.md line 470). Users need to understand the product, not be dazzled by animations.

**Recommendation:**
- Write onboarding content FIRST (before coding)
- Review with product owner (ahiya) to ensure "soft, glossy, sharp" tone
- Test with 3 non-technical users: "After reading this, do you know what Mirror of Dreams does?"
- If >50% say "no", rewrite content

### 3. KEEP LANDING PAGE CHANGES MINIMAL
**Rationale:** Landing page is already beautiful and functional. Avoid scope creep.

**Recommendation:**
- ONLY update tagline to mention "90-second guided setup"
- NO visual changes to portal experience
- NO new components needed
- Estimated time: 30 minutes

### 4. ADD ANALYTICS TRACKING (OPTIONAL BUT RECOMMENDED)
**Rationale:** Measure onboarding drop-off to optimize conversion

**Recommendation:**
- Add event tracking for:
  - `onboarding_started` (user lands on /onboarding)
  - `onboarding_step_2_reached`
  - `onboarding_step_3_reached`
  - `onboarding_completed` (via "Continue to Dashboard")
  - `onboarding_skipped` (via "Skip" button)
- Use existing event logger: `$HOME/.claude/lib/2l-event-logger.sh` (if available for client-side)
- If event logger unavailable, use console.log for now (add proper analytics post-MVP)

### 5. TEST WITH SARAH'S JOURNEY END-TO-END
**Rationale:** Onboarding is the FIRST impression. Must be perfect.

**Recommendation:**
- Manual test checklist:
  1. Visit landing page → Click "Start Free"
  2. Complete signup form → Submit
  3. See "Account created! Redirecting..." message
  4. Land on `/onboarding` (Step 1 of 3)
  5. Click "Next" → See Step 2 of 3
  6. Click "Next" → See Step 3 of 3
  7. Click "Continue to Dashboard" → Land on `/dashboard`
  8. Sign out → Sign in → Should skip onboarding (go straight to dashboard)
  9. Verify browser console has ZERO errors
  10. Verify `onboarding_completed = true` in database
- If ANY step fails, onboarding is NOT ready for merge

---

## Resource Map

### Critical Files for Onboarding Implementation

**NEW FILES (Builder-1 to create):**
```
/app/onboarding/page.tsx                              (300-400 lines)
/supabase/migrations/YYYYMMDD_add_onboarding_flag.sql (30 lines)
```

**MODIFIED FILES (Builder-1 to update):**
```
/app/auth/signup/page.tsx                             (10 lines changed)
/server/trpc/routers/users.ts                          (30 lines added)
/server/trpc/routers/auth.ts                           (5 lines added)
/components/portal/hooks/usePortalState.ts             (2 lines changed - optional)
```

**EXISTING COMPONENTS (reuse as-is):**
```
/components/ui/glass/GlassCard.tsx                    (container)
/components/ui/glass/ProgressOrbs.tsx                 (step indicator)
/components/ui/glass/GlowButton.tsx                   (Skip, Next buttons)
/components/ui/glass/GradientText.tsx                 (step titles)
/components/ui/glass/AnimatedBackground.tsx           (cosmic background)
```

**DATABASE SCHEMA:**
```
users table (existing):
  - id UUID
  - email TEXT
  - name TEXT
  - tier TEXT (free, essential, optimal, premium)
  - created_at TIMESTAMP
  
users table (NEW COLUMNS):
  + onboarding_completed BOOLEAN DEFAULT FALSE
  + onboarding_completed_at TIMESTAMP WITH TIME ZONE
```

---

### Key Dependencies

**1. tRPC Mutation: `users.completeOnboarding`**
- **Purpose:** Mark user onboarding as complete
- **Input:** None (uses `ctx.user.id` from protected middleware)
- **Output:** `{ success: true, user: UserObject }`
- **Error Handling:** If mutation fails, still redirect to dashboard (user experience > data consistency)

**2. Signup Mutation Response Update**
- **Purpose:** Include `onboarding_completed` field in signup response
- **Current:** Returns `{ user: { id, email, name, tier }, token }`
- **Required:** Returns `{ user: { id, email, name, tier, onboarding_completed }, token }`
- **File:** `/server/trpc/routers/auth.ts`

**3. ProgressOrbs Component**
- **Purpose:** Visual indicator for 3-step flow
- **Props:** `steps: 3`, `currentStep: 0 | 1 | 2`
- **File:** `/components/ui/glass/ProgressOrbs.tsx` (ALREADY EXISTS)
- **Integration:** Import and use in onboarding page

---

### Testing Infrastructure

**Manual Testing Checklist:**
```
Onboarding Flow:
[ ] Navigate to /auth/signup
[ ] Fill form with test user (test@example.com / password123)
[ ] Click "Create Free Account"
[ ] Should redirect to /onboarding (NOT /dashboard)
[ ] Should see "Welcome to Mirror of Dreams" (Step 1)
[ ] Should see ProgressOrbs (1/3 active)
[ ] Click "Next"
[ ] Should see "Your Reflection Journey" (Step 2)
[ ] Should see ProgressOrbs (2/3 active)
[ ] Click "Next"
[ ] Should see "Your Free Tier" (Step 3)
[ ] Should see ProgressOrbs (3/3 active)
[ ] Click "Continue to Dashboard"
[ ] Should redirect to /dashboard
[ ] Sign out
[ ] Sign in with same user
[ ] Should skip onboarding and go straight to /dashboard
[ ] Check database: onboarding_completed = true
[ ] Check browser console: zero errors

Skip Flow:
[ ] Create new test user
[ ] Land on /onboarding Step 1
[ ] Click "Skip"
[ ] Should redirect to /dashboard immediately
[ ] Check database: onboarding_completed = true

Admin User Flow:
[ ] Sign up as admin user (is_admin = true)
[ ] Should skip onboarding (admins already know product)
[ ] Should land on /dashboard directly

Edge Cases:
[ ] Onboarding page refresh (stays on current step)
[ ] Back button from Step 2 → Step 1
[ ] Browser back button from /dashboard → /onboarding (should redirect to dashboard if completed)
[ ] Network error during completeOnboarding mutation (should still redirect)
```

**Database Validation:**
```sql
-- Check onboarding completion status
SELECT id, email, name, onboarding_completed, onboarding_completed_at, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Count users who completed onboarding
SELECT 
  COUNT(*) FILTER (WHERE onboarding_completed = true) as completed,
  COUNT(*) FILTER (WHERE onboarding_completed = false) as not_completed,
  COUNT(*) as total
FROM users;
```

---

## Questions for Planner

### 1. Should Admin Users See Onboarding?
**Context:** Admin user (ahiya.butman@gmail.com) and creator users already know the product. Showing them onboarding is redundant.

**Recommendation:** Skip onboarding for `is_admin = true` OR `is_creator = true`

**Implementation:**
```typescript
// In signup success handler
if (!user.onboarding_completed && !user.is_admin && !user.is_creator) {
  router.push('/onboarding');
} else {
  router.push('/dashboard');
}
```

**Question:** Confirm this approach?

---

### 2. What Happens if User Closes Browser Mid-Onboarding?
**Context:** User completes Step 1, closes browser, returns tomorrow. Do they start from Step 1 again or resume from Step 2?

**Option A (Recommended):** Always start from Step 1 (simpler, only 45 seconds total)
- **Pros:** No state persistence needed, consistent experience
- **Cons:** Slightly annoying if user saw Step 1 already

**Option B:** Store current step in localStorage and resume
- **Pros:** Better UX for interrupted users
- **Cons:** More complex, edge cases with localStorage clearing

**Question:** Which approach should Builder-1 implement?

---

### 3. Should Onboarding Content Be Hardcoded or Database-Driven?
**Context:** Currently planning to hardcode 3-step content in React component. Alternative: Store content in database for easy editing without code changes.

**Option A (Recommended):** Hardcoded in React component
- **Pros:** Simple, no database queries, fast load
- **Cons:** Changing content requires code deploy

**Option B:** Database-driven content (CMS-like)
- **Pros:** Non-technical users can update content
- **Cons:** Adds complexity, overkill for MVP

**Question:** Confirm hardcoded approach for MVP?

---

### 4. Should "Skip" Button Be Prominent or Subtle?
**Context:** Vision says "Skip button (optional)" but doesn't specify visual treatment. Two approaches:

**Option A:** Prominent (secondary button, same size as "Next")
- **Pros:** Clear option, respects user agency
- **Cons:** More users might skip

**Option B:** Subtle (small text link, bottom-right corner)
- **Pros:** Encourages users to complete onboarding
- **Cons:** Feels manipulative

**Recommendation:** Option A (prominent) - "soft, glossy, sharp" means honest and transparent

**Question:** Confirm prominent skip button?

---

### 5. Landing Page Update: Minor or Major Changes?
**Context:** Current landing page is beautiful but doesn't mention onboarding. Should we:

**Option A (Recommended):** Minor update - Change tagline only
- **Change:** "Start completely free. Begin your journey." → "Start completely free. 90-second guided setup."
- **File:** `/components/portal/hooks/usePortalState.ts` (line 215)
- **Time:** 30 minutes

**Option B:** Major update - Add onboarding section to landing page
- **Add:** New section explaining the 3 steps visually
- **Requires:** New components, layout changes
- **Time:** 3-4 hours

**Question:** Confirm minor update only for Iteration 21?

---

## Complexity Assessment Summary

| Component | Complexity | Estimated Time | Builder Split? |
|-----------|-----------|----------------|----------------|
| Onboarding page | Medium | 4-6 hours | No (single builder) |
| Database migration | Low | 1 hour | No (same builder) |
| tRPC endpoint | Low | 1 hour | No (same builder) |
| Signup redirect | Low | 30 minutes | No (same builder) |
| Landing page update | Low | 30 minutes | No (same builder) |
| **TOTAL** | **Medium** | **7-9 hours** | **Single builder** |

**Recommendation:** Assign entire onboarding feature to Builder-1 as atomic unit. No sub-builder splits needed.

---

## Final Recommendations

### For Builder-1 (Onboarding Implementation)

1. **Start with content writing** - Write all 3 step messages BEFORE coding
2. **Create migration file first** - Test database changes before UI work
3. **Build onboarding page incrementally:**
   - Step 1: Static 3-step layout (no state)
   - Step 2: Add useState for step navigation
   - Step 3: Add ProgressOrbs integration
   - Step 4: Add tRPC mutation call
   - Step 5: Add animations (optional polish)
4. **Test end-to-end before PR** - Complete Sarah's journey manually
5. **Add console.log breadcrumbs** - Track user flow through onboarding (for debugging)

### For Planner

1. **Prioritize onboarding BEFORE any other Iteration 21 work** - It's the critical path for user adoption
2. **Keep landing page changes minimal** - Avoid scope creep on already-functional page
3. **Validate content tone with product owner** - "Soft, glossy, sharp" messaging is crucial to brand
4. **Plan for analytics tracking post-MVP** - Track onboarding completion rates for optimization
5. **Budget 1 hour for manual testing** - Onboarding is first impression, must be perfect

### For Testing

1. **Test with 3 user personas:**
   - Persona A: Power user (will skip onboarding)
   - Persona B: Curious user (will read every step)
   - Persona C: Admin user (should skip automatically)
2. **Verify database state after each test** - Ensure `onboarding_completed` flag saves correctly
3. **Test on mobile device** - Ensure responsive layout works on small screens
4. **Check browser console** - Zero errors during entire flow

---

## Success Criteria for Iteration 21

### Onboarding Flow is Complete When:

- [ ] `/app/onboarding/page.tsx` exists and renders 3 steps
- [ ] ProgressOrbs shows 1/3, 2/3, 3/3 correctly
- [ ] "Skip" button works and redirects to dashboard
- [ ] "Next" button advances to next step
- [ ] "Continue to Dashboard" button completes onboarding
- [ ] `onboarding_completed` column added to `users` table
- [ ] `users.completeOnboarding` tRPC endpoint works
- [ ] Signup redirects to `/onboarding` for new users
- [ ] Signup redirects to `/dashboard` for returning users
- [ ] Admin users skip onboarding automatically
- [ ] Browser console shows zero errors during flow
- [ ] Content tone matches "soft, glossy, sharp" vision
- [ ] Total onboarding time <= 90 seconds
- [ ] Mobile responsive (tested on iPhone/Android)

### Landing Page is Updated When:

- [ ] Tagline mentions "90-second guided setup" (or similar)
- [ ] "Start Free" button still links to `/auth/signup`
- [ ] Cosmic aesthetic remains intact (no visual regressions)
- [ ] No new components added (minimal changes only)

### Integration is Complete When:

- [ ] Sarah's full journey works end-to-end: Landing → Signup → Onboarding → Dashboard
- [ ] User who skips onboarding never sees it again
- [ ] User who completes onboarding never sees it again
- [ ] Sign out → Sign in → Skips onboarding (checks database flag)
- [ ] Database query confirms `onboarding_completed = true` after completion

---

## Appendix: Example Onboarding Content

### Step 1: Welcome to Mirror of Dreams 🌙
**Title:** "Welcome to Mirror of Dreams"

**Content:**
```
This is not a productivity tool. 
This is a consciousness companion.

Your dreams hold the mirror to who you're becoming. 
We reflect your journey back to you—soft, sharp, and true.
```

**Visual:** Large moon emoji 🌙 with animated glow effect

---

### Step 2: Your Reflection Journey ✨
**Title:** "How Reflections Work"

**Content:**
```
Every few days, answer 5 deep questions about your dream:

1. What is your dream?
2. What is your plan?
3. Have you set a date?
4. What's your relationship with this dream?
5. What are you willing to give in return?

After 4 reflections, your Mirror reveals the patterns you couldn't see.
```

**Visual:** ProgressOrbs showing 5 orbs (representing 5 questions)

---

### Step 3: Your Free Tier 🌱
**Title:** "Start Free, Upgrade When Ready"

**Content:**
```
Your free tier includes:
✓ 2 dreams to explore
✓ 4 reflections per month
✓ 1 evolution report per month (after 4 reflections)
✓ 1 visualization per month

Need more? Optimal tier gives you:
✓ 7 dreams
✓ 30 reflections per month
✓ 6 evolution reports & visualizations

Start free. Upgrade only if you fall in love.
```

**Visual:** Seedling emoji 🌱 with growth animation

---

**End of Report**

---

**Document Status:** COMPLETE
**Iteration:** 21 (Plan plan-3)
**Date:** 2025-11-13
**Explorer:** Explorer-1
**Next Step:** Planner reviews report and creates builder tasks for onboarding implementation
