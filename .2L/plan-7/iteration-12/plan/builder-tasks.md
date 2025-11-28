# Builder Task Breakdown - Iteration 12

## Overview

**Single builder** will execute all tasks sequentially. **No parallelization** needed due to tight dependencies (demo content → screenshots → landing page).

**Estimated total: 20-24 hours** (within master-plan.yaml estimate)

**Critical dependencies:**
1. Tier limits must be resolved BEFORE starting (decision from Ahiya)
2. Demo content quality gate: Ahiya reviews before seeding
3. Screenshots captured AFTER demo seeding complete

---

## Builder-1: Foundation & Demo User (FULL ITERATION)

### Scope

This builder handles **all tasks** for Iteration 12:
1. Database schema migration (add `preferences` JSONB, `is_demo` flag)
2. Demo user content creation (5 dreams, 12-15 reflections)
3. Demo seeding script implementation
4. Landing page transformation (hero, CTAs, use cases, screenshots)
5. Demo login flow (tRPC mutation, auto-authentication)
6. Demo banner component
7. Performance optimization (image conversion, Lighthouse testing)

**Rationale for single builder:**
- All work is tightly coupled (landing page depends on demo screenshots)
- No parallelization possible (seeding → screenshots → landing page)
- Total scope within single builder capacity (20-24 hours)

### Complexity Estimate

**MEDIUM-HIGH**

- Database migration: LOW complexity (2 SQL statements, 1 index)
- Demo content creation: **HIGH complexity** (quality critical, 6-8 hours with AI assistance)
- Seeding script: MEDIUM complexity (2 hours, standard database inserts)
- Landing page: MEDIUM complexity (3-4 hours, reuses existing components)
- Demo login: LOW complexity (1 hour, extends existing auth pattern)
- Performance: MEDIUM complexity (2 hours, WebP conversion + Lighthouse)

**Total estimated time: 20-24 hours**

### Success Criteria

- [x] Database migration applied successfully (no errors on `supabase db push`)
- [x] Demo user created with `is_demo = true` flag
- [x] 5 dreams seeded (SaaS, Marathon, Piano, Relationships, Financial Freedom)
- [x] 12-15 reflections seeded (authentic content, not lorem ipsum)
- [x] **Quality gate:** Ahiya approves demo reflection content
- [x] 2 evolution reports generated via actual AI analysis
- [x] 1-2 visualizations generated
- [x] Screenshots captured (dashboard, reflection, evolution) and optimized to WebP
- [x] Landing page hero redesigned with new headline and dual CTAs
- [x] 3 use case examples replace generic feature cards
- [x] Demo login flow functional ("See Demo" button → auto-login → dashboard)
- [x] Demo banner appears on all pages when `user.isDemo === true`
- [x] Footer links added (About, Pricing, Privacy placeholders)
- [x] Lighthouse score >90, LCP <2s on landing page
- [x] Bundle size increase <10KB from baseline

### Files to Create

**Database Migration:**
- `supabase/migrations/20251128_iteration_12_demo_infrastructure.sql`

**Scripts:**
- `scripts/seed-demo-user.ts` - Main seeding script
- `scripts/generate-demo-content.ts` - AI content generation helper (optional)
- `scripts/convert-to-webp.js` - Image optimization
- `scripts/baseline-bundle-size.sh` - Bundle size measurement

**Components:**
- `components/shared/DemoBanner.tsx` - Demo account warning banner

**Pages:**
- `app/page.tsx` - **MODIFY** landing page (hero, use cases, screenshots, footer)

**Backend:**
- `server/trpc/routers/auth.ts` - **EXTEND** with `loginDemo` mutation

**Types:**
- `types/user.ts` - **EXTEND** User interface to include `isDemo` flag

**Assets:**
- `public/landing/dashboard-demo.webp` - Screenshot 1
- `public/landing/reflection-demo.webp` - Screenshot 2
- `public/landing/evolution-demo.webp` - Screenshot 3

**Documentation:**
- `.2L/plan-7/iteration-12/build/demo-content.md` - Demo reflection content for review

### Dependencies

**Depends on:**
- **CRITICAL:** Tier limits resolved (free = 1 or 10 reflections/month)
  - **ACTION:** Ahiya must decide before builder starts
  - **BLOCKER:** Without resolution, cannot finalize Pricing page (Iteration 13)

**Blocks:**
- Iteration 13 (Profile, Settings, About, Pricing pages depend on demo user existing)

### Implementation Notes

#### Phase 1: Database Migration (30 minutes)

**Task:** Add `preferences` JSONB and `is_demo` flag to users table

**File:** `supabase/migrations/20251128_iteration_12_demo_infrastructure.sql`

```sql
-- Add preferences JSONB column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;

-- Add is_demo flag
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create index for demo user lookup
CREATE INDEX IF NOT EXISTS idx_users_is_demo
ON public.users(is_demo)
WHERE is_demo = true;

-- Add documentation comments
COMMENT ON COLUMN public.users.preferences IS
  'User settings: notification_email, reflection_reminders, default_tone, reduce_motion_override, analytics_opt_in';

COMMENT ON COLUMN public.users.is_demo IS
  'True if demo account (read-only, cached for performance)';

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
  'demo-account-no-password',
  'Demo User',
  'premium',
  true,
  true,
  '{
    "notification_email": true,
    "reflection_reminders": "off",
    "default_tone": "fusion"
  }'::JSONB
) ON CONFLICT (email) DO NOTHING;
```

**Commands:**
```bash
# Test locally
supabase db reset

# Deploy to production
supabase db push --remote
```

**Success criteria:**
- Migration runs without errors
- `users.preferences` column exists (type JSONB)
- `users.is_demo` column exists (type BOOLEAN)
- Index `idx_users_is_demo` created
- Demo user row inserted (check: `SELECT * FROM users WHERE is_demo = true`)

---

#### Phase 2: Demo Content Creation (6-8 hours)

**CRITICAL:** This phase determines product perception. Quality over speed.

**Approach: Hybrid (Recommended)**
1. Ahiya writes **1 exemplary dream + 4 reflections** (4 hours)
   - Dream: "Launch My SaaS Product" (entrepreneurial, specific obstacles)
   - 4 reflections: 200-400 words each, authentic struggles/insights
2. AI generates **remaining 8-9 reflections** using exemplar style (1 hour)
3. **Quality gate:** Ahiya reviews ALL content before seeding (1 hour)
4. Revisions if needed (1-2 hours buffer)

**File:** `.2L/plan-7/iteration-12/build/demo-content.md`

**Structure:**
```markdown
# Demo User Content - For Review

## Dream 1: Launch My SaaS Product (Ahiya-written)

**Title:** Launch My SaaS Product
**Description:** Build and launch a profitable SaaS product that solves a real problem and generates $10k MRR within 12 months.
**Category:** career
**Target Date:** 2025-03-15 (45 days from now)
**Priority:** high

### Reflection 1 (Fusion, Day 1)

**What is your dream?**
[Ahiya writes 100-150 words: vivid, specific description of SaaS vision]

**What is your plan?**
[Ahiya writes 100-150 words: concrete next steps, not vague "work hard"]

**What is your relationship with this dream?**
[Ahiya writes 100-150 words: emotional depth, past attempts, fears]

**What are you willing to offer?**
[Ahiya writes 100-150 words: sacrifice, commitment, trade-offs]

**Expected AI Response:**
[Leave blank - will be generated via actual AI API during seeding]

---

### Reflection 2 (Intense, Day 5)
[Ahiya writes similar structure]

---

[Repeat for reflections 3-4]

---

## Dream 2: Run a Marathon (AI-generated)

[AI generates using Ahiya's exemplar as style guide]

---

[Repeat for Dreams 3-5]
```

**Ahiya's Task:**
- Write Dream 1 + 4 reflections (high-quality, emotionally authentic)
- Review AI-generated content for Dreams 2-5
- Approve or request revisions
- **Quality bar:** "I would write this myself"

**Builder's Task:**
- Set up AI content generation script (`scripts/generate-demo-content.ts`)
- Generate reflections for Dreams 2-5 using Claude API
- Submit to Ahiya for review
- Iterate based on feedback

**Success criteria:**
- Ahiya approval email: "Demo content approved for seeding"
- All reflections 200-400 words (depth, not superficiality)
- Dreams represent diverse life areas (career, health, creative, relationships, financial)
- Emotional authenticity (vulnerable, not marketing speak)

---

#### Phase 3: Demo Seeding Script (2 hours)

**File:** `scripts/seed-demo-user.ts`

**Tasks:**
1. Create demo user (if not exists via migration)
2. Insert 5 dreams (SaaS, Marathon, Piano, Relationships, Financial Freedom)
3. Insert 12-15 reflections (dates spread over 30 days)
4. Generate AI responses for each reflection via Anthropic API
5. Generate 2 evolution reports (via `trpc.evolution.generate` mutation)
6. Generate 1-2 visualizations (via `trpc.visualizations.generate` mutation)

**Pattern:** See `patterns.md` "Seeding Patterns" section for full code example

**Commands:**
```bash
# Run locally (development database)
npx tsx scripts/seed-demo-user.ts

# Run on production (requires production env vars)
npx tsx scripts/seed-demo-user.ts --production
```

**Success criteria:**
- Script runs without errors
- Database queries:
  - `SELECT * FROM users WHERE is_demo = true` → 1 row
  - `SELECT * FROM dreams WHERE user_id = '<demo_user_id>'` → 5 rows
  - `SELECT * FROM reflections WHERE user_id = '<demo_user_id>'` → 12-15 rows
  - `SELECT * FROM evolution_reports WHERE user_id = '<demo_user_id>'` → 2 rows
- Dashboard loads with populated demo data (verify manually)

---

#### Phase 4: Screenshots & Image Optimization (2 hours)

**Task 1: Capture Screenshots (30 minutes)**

1. Login to demo account locally: `http://localhost:3000/auth/signin`
   - Email: `demo@mirrorofdreams.com`
   - Password: (use temporary password or auto-login mutation)

2. Capture 3 screenshots:
   - **Dashboard:** Full-screen (1920×1080), show 5 dreams + recent reflections
   - **Reflection detail:** Scroll to show full AI response, highlight insights
   - **Evolution report:** Show temporal analysis section

3. Save as PNG in `public/landing/raw/`:
   - `dashboard.png`
   - `reflection.png`
   - `evolution.png`

**Task 2: WebP Conversion (30 minutes)**

**File:** `scripts/convert-to-webp.js`

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './public/landing/raw';
const outputDir = './public/landing';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(inputDir)
  .filter((file) => /\.(png|jpg|jpeg)$/i.test(file))
  .forEach((file) => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(
      outputDir,
      file.replace(/\.(png|jpg|jpeg)$/i, '.webp')
    );

    sharp(inputPath)
      .webp({ quality: 80, effort: 6 })
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

**Run:**
```bash
node scripts/convert-to-webp.js
```

**Success criteria:**
- 3 WebP files in `public/landing/`:
  - `dashboard-demo.webp` (<100KB)
  - `reflection-demo.webp` (<100KB)
  - `evolution-demo.webp` (<100KB)
- Total file size: <300KB (3 images combined)
- Visual quality: Near-lossless (compare side-by-side with PNG)

---

#### Phase 5: Landing Page Transformation (3-4 hours)

**File:** `app/page.tsx`

**Changes:**

**1. Hero Section Redesign (1 hour)**

**Before:**
```tsx
<h1>Your Dreams, Reflected</h1>
<p>Transform your dreams into reality with AI-powered reflection</p>
<button>Get Started</button>
```

**After:**
```tsx
<div className="text-center max-w-4xl mx-auto px-6 py-16">
  <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
    Transform Your Dreams into Reality Through AI-Powered Reflection
  </h1>
  <p className="text-xl text-white/70 mb-8 leading-relaxed">
    Your personal AI mirror analyzes your reflections, reveals hidden patterns,
    and guides your evolution - one dream at a time
  </p>
  <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
```

**2. Use Case Examples (1.5 hours)**

**Before:**
```tsx
<FeatureCard icon="✨" title="AI Insights" description="Get personalized insights" />
<FeatureCard icon="📖" title="Reflection" description="Journal your thoughts" />
<FeatureCard icon="📈" title="Growth" description="Track your progress" />
<FeatureCard icon="🌙" title="Dreams" description="Pursue your goals" />
```

**After:**
```tsx
<section className="py-16 px-6">
  <h2 className="text-4xl font-bold text-center mb-12">How Mirror of Dreams Transforms Your Life</h2>

  <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
    {/* Use Case 1 */}
    <GlassCard elevated className="p-6">
      <div className="text-4xl mb-4">🚀</div>
      <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        From Vague Aspiration to Clear Action Plan
      </h3>
      <p className="text-white/70 leading-relaxed mb-4">
        "I want to launch a SaaS product" becomes "Build MVP in 30 days, validate
        with 10 early users, iterate based on feedback." Your AI mirror breaks down
        dreams into concrete steps.
      </p>
      <p className="text-sm text-purple-400">
        Real example from demo: Launch My SaaS Product
      </p>
    </GlassCard>

    {/* Use Case 2 */}
    <GlassCard elevated className="p-6">
      <div className="text-4xl mb-4">📈</div>
      <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        See Your Growth Over Time
      </h3>
      <p className="text-white/70 leading-relaxed mb-4">
        Evolution reports analyze your reflections across weeks and months, revealing
        patterns you can't see day-to-day. Watch yourself shift from fear to confidence,
        from planning to execution.
      </p>
      <p className="text-sm text-purple-400">
        Unlocked after 4 reflections on a dream
      </p>
    </GlassCard>

    {/* Use Case 3 */}
    <GlassCard elevated className="p-6">
      <div className="text-4xl mb-4">💡</div>
      <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Break Through Mental Blocks
      </h3>
      <p className="text-white/70 leading-relaxed mb-4">
        Your AI mirror identifies recurring obstacles, asks questions you haven't
        considered, and challenges excuses. It's like having a coach available 24/7.
      </p>
      <p className="text-sm text-purple-400">
        Fusion tone: Gentle encouragement + direct truth
      </p>
    </GlassCard>
  </div>
</section>
```

**3. Screenshots Section (1 hour)**

```tsx
<section className="py-16 px-6 bg-gradient-to-b from-transparent to-purple-900/10">
  <h2 className="text-4xl font-bold text-center mb-4">See Mirror of Dreams in Action</h2>
  <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
    Explore a fully populated demo account with 5 active dreams, 12 reflections, and evolution insights.
  </p>

  <div className="max-w-6xl mx-auto space-y-12">
    {/* Screenshot 1: Dashboard */}
    <div className="relative">
      <Image
        src="/landing/dashboard-demo.webp"
        alt="Mirror of Dreams dashboard showing 5 active dreams and recent reflections"
        width={1920}
        height={1080}
        quality={90}
        priority
        className="rounded-lg shadow-2xl border border-white/10"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      />
      <p className="text-center text-white/60 mt-4">
        Your command center: Track all dreams, recent reflections, and progress at a glance
      </p>
    </div>

    {/* Screenshot 2: Reflection */}
    <div className="relative">
      <Image
        src="/landing/reflection-demo.webp"
        alt="AI-generated reflection with highlighted insights and action items"
        width={1920}
        height={1080}
        loading="lazy"
        className="rounded-lg shadow-2xl border border-white/10"
      />
      <p className="text-center text-white/60 mt-4">
        Deep AI insights: Your mirror reveals patterns and guides your evolution
      </p>
    </div>

    {/* Screenshot 3: Evolution */}
    <div className="relative">
      <Image
        src="/landing/evolution-demo.webp"
        alt="Evolution report showing growth patterns across reflections"
        width={1920}
        height={1080}
        loading="lazy"
        className="rounded-lg shadow-2xl border border-white/10"
      />
      <p className="text-center text-white/60 mt-4">
        See your growth: Evolution reports track your transformation over time
      </p>
    </div>
  </div>

  <div className="text-center mt-12">
    <GlowButton
      variant="primary"
      size="lg"
      onClick={handleSeeDemoClick}
    >
      Experience the Demo Now
    </GlowButton>
  </div>
</section>
```

**4. Footer Enhancement (30 minutes)**

```tsx
<footer className="border-t border-white/10 py-12 px-6 mt-24">
  <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
    <div>
      <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Mirror of Dreams
      </h3>
      <p className="text-white/60 text-sm">
        Transform your dreams into reality through AI-powered reflection.
      </p>
    </div>

    <div>
      <h4 className="font-semibold mb-3 text-white/90">Product</h4>
      <ul className="space-y-2 text-sm text-white/60">
        <li><a href="/pricing" className="hover:text-purple-400">Pricing</a></li>
        <li><a href="#demo" onClick={handleSeeDemoClick} className="hover:text-purple-400">See Demo</a></li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold mb-3 text-white/90">Company</h4>
      <ul className="space-y-2 text-sm text-white/60">
        <li><a href="/about" className="hover:text-purple-400">About</a></li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold mb-3 text-white/90">Legal</h4>
      <ul className="space-y-2 text-sm text-white/60">
        <li><a href="/privacy" className="hover:text-purple-400">Privacy Policy</a></li>
        <li><a href="/terms" className="hover:text-purple-400">Terms of Service</a></li>
      </ul>
    </div>
  </div>

  <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
    © {new Date().getFullYear()} Mirror of Dreams. All rights reserved.
  </div>
</footer>
```

**Success criteria:**
- Hero headline: "Transform Your Dreams into Reality Through AI-Powered Reflection"
- Dual CTAs visible: "See Demo" + "Start Free"
- 3 use case examples replace generic feature cards
- 3 screenshots displayed with WebP format
- Footer contains About, Pricing, Privacy, Terms links
- Mobile responsive (test on 375px, 768px, 1920px widths)

---

#### Phase 6: Demo Login Flow (1 hour)

**File 1:** `server/trpc/routers/auth.ts` (extend existing)

```typescript
import jwt from 'jsonwebtoken';
import { supabase } from '@/server/lib/supabase';

export const authRouter = router({
  // Existing mutations: signin, signup, changePassword

  // NEW: Demo login (no password required)
  loginDemo: publicProcedure.mutation(async () => {
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

    const token = jwt.sign(
      {
        userId: demoUser.id,
        email: demoUser.email,
        tier: demoUser.tier,
        isDemo: true,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

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

**File 2:** `types/user.ts` (extend User interface)

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'essential' | 'premium';
  isCreator: boolean;
  isAdmin: boolean;
  isDemo: boolean; // NEW field
}
```

**File 3:** `app/page.tsx` (add demo login handler)

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

export default function LandingPage() {
  const router = useRouter();
  const toast = useToast();
  const loginDemo = trpc.auth.loginDemo.useMutation();

  const handleSeeDemoClick = async () => {
    try {
      const { token, user } = await loginDemo.mutateAsync();
      localStorage.setItem('token', token);
      toast.success(`Welcome to the demo, ${user.name}!`, 3000);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load demo', 5000);
    }
  };

  return (
    <div>
      {/* Landing page content with handleSeeDemoClick */}
    </div>
  );
}
```

**Success criteria:**
- Click "See Demo" → auto-login without password prompt
- Redirected to `/dashboard`
- Dashboard shows demo user data (5 dreams, reflections)
- Toast notification: "Welcome to the demo, Demo User!"

---

#### Phase 7: Demo Banner Component (1 hour)

**File:** `components/shared/DemoBanner.tsx` (new file)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GlowButton } from '@/components/ui/glass';

export function DemoBanner() {
  const router = useRouter();
  const { user } = useAuth();

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

**Integration:** Modify `components/shared/AppNavigation.tsx`

```typescript
import { DemoBanner } from './DemoBanner';

export function AppNavigation({ currentPage }: { currentPage: string }) {
  return (
    <>
      <DemoBanner />
      <nav className="fixed top-0 left-0 right-0 z-50 bg-glass-triple backdrop-blur-glass border-b border-white/10">
        {/* Existing navigation */}
      </nav>
    </>
  );
}
```

**Success criteria:**
- Demo banner appears on all pages when logged in as demo user
- Banner does NOT appear for regular users
- "Sign Up for Free" button redirects to `/auth/signup`
- Banner is responsive (stacks vertically on mobile)

---

#### Phase 8: Performance Testing (2 hours)

**Task 1: Bundle Size Baseline (15 minutes)**

**Script:** `scripts/baseline-bundle-size.sh`

```bash
#!/bin/bash

# Build production bundle
npm run build

# Measure bundle sizes
echo "=== Bundle Size Baseline ===" > bundle-sizes.txt
du -sh .next/static/chunks/*.js | sort -h >> bundle-sizes.txt
echo "" >> bundle-sizes.txt
echo "Total .next/static size:" >> bundle-sizes.txt
du -sh .next/static >> bundle-sizes.txt

cat bundle-sizes.txt
```

**Run:**
```bash
chmod +x scripts/baseline-bundle-size.sh
./scripts/baseline-bundle-size.sh
```

**Success criteria:**
- Baseline recorded in `bundle-sizes.txt`
- After Iteration 12: Compare and verify <10KB increase

---

**Task 2: Lighthouse Audit (1 hour)**

**Commands:**
```bash
# Build production
npm run build

# Start production server
npm start

# Run Lighthouse (in separate terminal)
npx lighthouse http://localhost:3000 --view --preset=desktop
npx lighthouse http://localhost:3000 --view --preset=mobile
```

**Metrics to verify:**

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Performance | >90 | Optimize images, defer non-critical JS |
| LCP (Largest Contentful Paint) | <2s | Add `priority` to hero image, reduce image size |
| FID (First Input Delay) | <100ms | Code-split large components |
| CLS (Cumulative Layout Shift) | <0.1 | Add explicit width/height to images |
| Accessibility | 100 | Fix alt text, ARIA labels |

**Success criteria:**
- Performance score >90 (desktop and mobile)
- LCP <2 seconds
- All images have alt text
- No console errors

---

**Task 3: Cross-Browser Testing (30 minutes)**

**Browsers to test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest, if Mac available)
- Mobile Chrome (iOS/Android via DevTools)

**Test checklist:**
- [ ] Landing page loads correctly
- [ ] "See Demo" button works
- [ ] Demo login redirects to dashboard
- [ ] Demo banner appears
- [ ] Screenshots display correctly (WebP supported)
- [ ] Responsive layout (375px, 768px, 1920px)

**Success criteria:**
- Zero visual bugs across all browsers
- All functionality works on mobile

---

### Patterns to Follow

**Database:**
- Use `IF NOT EXISTS` in migrations (idempotent)
- Add comments to document JSONB schemas
- Use partial indexes for performance (`WHERE is_demo = true`)

**tRPC:**
- Use `publicProcedure` for `loginDemo` (no authentication required)
- Return structured objects: `{ user, token }`
- Use `TRPCError` with descriptive codes and messages

**React:**
- Use `'use client'` for components with hooks (useState, useRouter)
- Early return for conditional rendering (`if (!user?.isDemo) return null`)
- Use `loading` and `priority` props on Next.js Image component

**Image Optimization:**
- WebP quality 80% (near-lossless)
- Priority loading for above-fold images
- Lazy loading for below-fold images
- Explicit width/height to prevent CLS

**Code Quality:**
- Follow patterns.md conventions (import order, naming, TypeScript standards)
- Use design system components (GlassCard, GlowButton, CosmicBackground)
- Test on throttled 3G connection (Chrome DevTools)

---

### Testing Requirements

**Unit Testing:** Not required (manual testing sufficient for MVP)

**Integration Testing:**
1. Demo login flow: Landing → "See Demo" → Dashboard
2. Demo banner: Appears for demo user, hidden for regular user
3. Landing page: All CTAs functional, images load correctly

**Performance Testing:**
1. Lighthouse audit: Performance >90, LCP <2s
2. Bundle size: Increase <10KB from baseline
3. Cross-browser: Chrome, Firefox, Safari, Mobile Chrome

**Coverage Target:** 100% manual testing of user-facing features

---

### Potential Split Strategy

**IF** builder encounters issues (content quality low, time overruns), consider splitting:

**Foundation (Builder-1, 8 hours):**
- Database migration
- Demo seeding script infrastructure
- tRPC `loginDemo` mutation
- Demo banner component

**Quality Gate:** Ahiya reviews demo content

**Content & Polish (Sub-builder 1A, 6 hours):**
- AI content generation
- Screenshot capture and optimization
- Landing page transformation
- Performance testing

**Rationale for split:**
- Content quality requires iteration (AI-generated may need rework)
- Landing page depends on screenshots (must wait for seeding)
- Foundation work (database, tRPC) is independent

**Decision Point:** If demo content rejected by Ahiya after 2 iterations, split to unblock landing page work.

---

## Builder Execution Order

**Single builder, sequential execution:**

1. **Day 1-2:** Database migration + Demo content creation
   - Run migration locally
   - Ahiya writes exemplary dream + 4 reflections
   - Builder generates remaining reflections via AI
   - **Quality gate:** Ahiya reviews content (BLOCKING)

2. **Day 2-3:** Demo seeding + Screenshots
   - Run seeding script (after Ahiya approval)
   - Verify demo user in database
   - Capture 3 screenshots
   - Convert to WebP format

3. **Day 3-4:** Landing page transformation + Demo flow
   - Rebuild hero section, use cases, screenshots
   - Implement demo login mutation
   - Create demo banner component
   - Test full demo flow

4. **Day 4-5:** Performance testing + QA
   - Lighthouse audit
   - Bundle size measurement
   - Cross-browser testing
   - Fix any issues found
   - **Final validation:** Ahiya tests demo account

**Total: 4-5 working days (20-24 hours)**

---

## Integration Notes

**No integration complexity** (single builder, no merge conflicts)

**Handoff to Iteration 13:**
- Demo user exists and is populated
- Landing page links to About, Pricing (placeholders acceptable)
- Demo banner component ready for reuse in all pages

**Post-deployment checklist:**
1. Verify demo user accessible: `https://mirrorofdreams.com` → "See Demo"
2. Verify Lighthouse score >90 on production
3. Monitor analytics: Track "See Demo" click rate (target: >30%)

---

**Builder Tasks Status:** COMPLETE
**Estimated Effort:** 20-24 hours (single builder)
**Critical Dependencies:** Tier limits resolution, Ahiya content approval
**Next Step:** Builder begins execution after Ahiya resolves tier limits
