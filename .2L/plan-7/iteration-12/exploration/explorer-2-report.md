# Explorer 2 Report: Technology Patterns & Dependencies

**Explorer:** Explorer-2  
**Iteration:** 12 (Plan-7, Iteration 1 of 3)  
**Focus:** Demo user seeding, tRPC mutations, Redis caching, image optimization  
**Date:** 2025-11-28  

---

## Executive Summary

Mirror of Dreams has a **solid, production-ready technology foundation** built on Next.js 14, tRPC, Supabase PostgreSQL, and Anthropic Claude. The existing stack is well-architected, type-safe, and requires **minimal new dependencies** for iteration 12. 

**Key findings:**
- **Demo user seeding:** No existing infrastructure - needs custom script + AI-generated content
- **tRPC patterns:** Established and mature - extend `users` router for profile/settings mutations
- **Redis caching:** Upstash SDK installed but **not configured** - low-hanging performance optimization
- **Image optimization:** Next.js Image component ready, WebP conversion needed for landing page assets
- **Design system:** Comprehensive glass morphism components (`GlassCard`, `GlassInput`, `GlowButton`) ready for reuse

**Bottom line:** This iteration requires **thoughtful content creation** (demo reflections) and **smart infrastructure reuse** (existing tRPC patterns, design components). No breaking changes, no risky refactors.

---

## Discoveries

### 1. Existing Technology Stack (SOLID FOUNDATION)

#### Core Framework: Next.js 14 with App Router
- **Version:** `next@^14.2.0`
- **Architecture:** App Router (not Pages Router)
- **Rendering:** Server Components + Client Components (`'use client'`)
- **API:** tRPC via HTTP adapter (`/app/api/trpc/[trpc]/route.ts`)
- **Deployment:** Vercel-optimized (`vercel.json` present)

**Discovery:** Next.js 14 App Router is mature and stable. No migration needed.

#### Backend: tRPC + Supabase PostgreSQL
- **tRPC:** `@trpc/server@^11.6.0`, `@trpc/react-query@^11.6.0`
- **Database:** Supabase PostgreSQL (local instance at `http://127.0.0.1:54321`)
- **ORM:** Raw Supabase client (no Prisma/Drizzle - intentional simplicity)
- **Auth:** Custom JWT implementation (`jsonwebtoken`, `bcryptjs`)
- **Validation:** Zod schemas (`zod@^3.25.76`)

**Discovery:** tRPC architecture is **exceptionally clean**:
- Root router in `server/trpc/routers/_app.ts` combines 9 sub-routers
- `protectedProcedure` middleware enforces auth + injects `ctx.user`
- `usageLimitedProcedure` enforces tier limits (1/5/10 reflections per tier)
- Type-safe end-to-end (React client → API → Database)

#### AI: Anthropic Claude (Sonnet 4.5)
- **SDK:** `@anthropic-ai/sdk@^0.52.0`
- **Model:** `claude-sonnet-4-5-20250929` (extended thinking for premium tier)
- **Usage:**
  - Standard reflections: 4000 max tokens
  - Premium reflections: 6000 max tokens + 5000 thinking tokens
- **Prompt system:** File-based prompts in `/prompts` directory (fusion, gentle, intense)

**Discovery:** AI integration is **production-ready** with premium tier differentiation.

#### Design System: Glass Morphism + Cosmic Theme
- **Components:** `/components/ui/glass/` directory with 13 reusable components
  - `GlassCard.tsx`, `GlassInput.tsx`, `GlowButton.tsx`, `GlassModal.tsx`
  - `CosmicLoader.tsx`, `AnimatedBackground.tsx`, `ProgressOrbs.tsx`
- **Styling:** Tailwind CSS with custom cosmic theme
  - Color palette: `mirror.amethyst`, `mirror.void`, `mirror.gold-ambient`
  - Shadows: `shadow-amethyst-breath`, `shadow-glass-triple`
  - Animations: `animate-flicker`, `animate-caustic` (13-14s slow ambient)
- **Motion:** Framer Motion (`framer-motion@^11.18.2`) for page transitions

**Discovery:** Design system is **comprehensive and production-tested**. No new UI framework needed.

---

### 2. Database Schema & Tier Limits (CRITICAL DISCREPANCY FOUND)

#### Current Schema (as of migration `20251112000001_update_reflection_limits.sql`)

**Users Table:**
```sql
tier TEXT CHECK (tier IN ('free', 'essential', 'optimal', 'premium'))
subscription_status TEXT CHECK (status IN ('active', 'canceled', 'expired', 'trialing'))
reflection_count_this_month INTEGER DEFAULT 0
current_month_year TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM')
is_demo BOOLEAN (NOT YET IN SCHEMA - NEEDS MIGRATION)
preferences JSONB (NOT YET IN SCHEMA - NEEDS MIGRATION)
```

**Reflections Table:**
```sql
dream_id UUID REFERENCES dreams(id) ON DELETE SET NULL
tone TEXT CHECK (tone IN ('gentle', 'intense', 'fusion'))
is_premium BOOLEAN DEFAULT FALSE
word_count INTEGER
title TEXT (auto-generated from first 100 chars of dream)
```

**Dreams Table:**
```sql
status TEXT CHECK (status IN ('active', 'achieved', 'archived', 'released'))
category TEXT CHECK (category IN 'health', 'career', 'relationships', etc.)
target_date DATE
reflection_count INTEGER DEFAULT 0
last_reflection_at TIMESTAMP
```

**CRITICAL DISCOVERY: Tier Limits Mismatch**

| Source | Free Tier Limit | Premium Limit |
|--------|----------------|---------------|
| **Vision (plan-7)** | 10 reflections/month | 50/month (Premium), Unlimited (Pro) |
| **Code (`users.ts`)** | 1 reflection/month | 10/month |
| **Database function** | 1 reflection/month | 10/month |

**Resolution Required:** Before Pricing page can be built (Iteration 2), tier limits **must be aligned**. Recommendation:
1. Update `TIER_LIMITS` in `server/trpc/routers/users.ts` and `dreams.ts`
2. Update `check_reflection_limit()` PostgreSQL function
3. **Document decision:** Does Ahiya want higher limits (vision) or current conservative limits (code)?

---

### 3. Demo User Seeding Requirements

#### Current State: NO DEMO INFRASTRUCTURE EXISTS
- No `is_demo` flag in users table
- No demo user seeding scripts
- No demo data generation utilities
- No Redis caching for demo user data (despite Upstash SDK installed)

#### What Needs to Be Built:

**A. Database Migration (Add `is_demo` flag)**
```sql
ALTER TABLE public.users ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_users_is_demo ON public.users(is_demo);
```

**B. Demo User Creation Script** (`/scripts/seed-demo-user.ts`)
- Create user: `demo@mirrorofdreams.com` with known password OR auto-login token
- Flag: `is_demo = true`, `tier = 'premium'` (to showcase all features)
- Disable RLS (Row Level Security) policies for demo user OR use service role key

**C. Demo Content Generation Strategy (HIGH COMPLEXITY)**

**Option 1: Manual High-Quality Content (Recommended)**
- **Pros:** Authentic, compelling, demonstrates product value
- **Cons:** 4-6 hours of writing + Ahiya's review
- **Process:**
  1. Ahiya writes 3-4 high-quality reflections (200-400 words each) for 3 dreams
  2. Run through actual AI reflection API to generate responses
  3. Generate evolution reports via existing `trpc.evolution.generate` mutation
  4. Seed database with results

**Option 2: AI-Generated Demo Content**
- **Pros:** Fast (30 minutes), scalable, repeatable
- **Cons:** Risk of generic/inauthentic content
- **Process:**
  1. Use Claude API to generate realistic user reflections (in persona)
  2. Use same Claude API to generate AI responses (using actual prompts)
  3. Seed database programmatically
  4. **Quality gate:** Ahiya reviews before merging

**Hybrid Recommendation:**
- Ahiya writes 1 exemplary dream + 4 reflections (demonstrates depth)
- AI generates 2 additional dreams + 8 reflections (demonstrates breadth)
- Total: 3 dreams, 12 reflections (meets vision requirement)

**D. Demo Login Flow** (Choose ONE)

**Option A: Public Credentials (Simpler)**
- Email: `demo@mirrorofdreams.com`
- Password: Public (e.g., "DemoUser2025")
- Landing page: "See Demo" button → opens modal with credentials → user logs in
- **Pro:** Uses existing auth flow
- **Con:** User must manually type credentials

**Option B: Auto-Login (Better UX)**
- Create `trpc.auth.loginDemo` mutation
- Generates session token programmatically
- Landing page: "See Demo" button → auto-logs in via token
- **Pro:** One-click demo access
- **Con:** Needs new mutation (15 lines of code)

**Recommendation:** Option B (auto-login) for superior conversion UX.

---

### 4. tRPC Mutation Patterns (READY TO EXTEND)

#### Existing Pattern: Users Router (`server/trpc/routers/users.ts`)

**Current Mutations:**
1. `completeOnboarding` - Sets `onboarding_completed = true`
2. `updateProfile` - Updates name, language (validated by `updateProfileSchema`)
3. Returns: `{ user, message }` with type-safe user object

**Current Queries:**
1. `getProfile` - Returns comprehensive profile data + calculated metrics
2. `getUsageStats` - Returns reflection statistics + monthly breakdown
3. `getDashboardData` - Returns dashboard summary (5 recent reflections, usage limits)

#### Pattern for New Profile/Settings Mutations:

**Profile Mutations Needed (Iteration 1):**
```typescript
// server/trpc/routers/users.ts (extend existing)

updateEmail: protectedProcedure
  .input(z.object({ newEmail: z.string().email() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Check email not in use
    // 2. Update users.email
    // 3. Invalidate old JWT, issue new JWT
    // 4. Return { user, token, message }
  }),

updatePassword: protectedProcedure
  .input(z.object({ 
    currentPassword: z.string(), 
    newPassword: z.string().min(6) 
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Verify currentPassword via bcrypt.compare
    // 2. Hash newPassword via bcrypt.hash
    // 3. Update users.password_hash
    // 4. Return { message }
  }),

deleteAccount: protectedProcedure
  .input(z.object({ 
    confirmEmail: z.string().email(), 
    password: z.string() 
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Verify email matches ctx.user.email
    // 2. Verify password via bcrypt.compare
    // 3. Delete user (CASCADE deletes reflections, dreams)
    // 4. Return { message }
  }),
```

**Settings Mutations Needed (Iteration 2):**
```typescript
updatePreferences: protectedProcedure
  .input(z.object({
    emailNotifications: z.boolean().optional(),
    reflectionReminders: z.enum(['daily', 'weekly', 'off']).optional(),
    defaultTone: z.enum(['fusion', 'gentle', 'intense']).optional(),
    reduceMotion: z.boolean().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Update users.preferences JSONB column
    // Return { preferences, message }
  }),
```

**Discovery:** Existing `auth.ts` router **already has** `changePassword` and `deleteAccount` mutations!

**CRITICAL FINDING:** Check if `auth.changePassword` and `auth.deleteAccount` should be:
1. **Moved to `users` router** (more RESTful organization)
2. **Left in `auth` router** (auth-related operations)
3. **Duplicated** (accessible from both)

**Recommendation:** Leave in `auth` router (don't break existing patterns), call from Profile page via `trpc.auth.changePassword.mutate()`.

---

### 5. Redis Caching Strategy (UPSTASH INSTALLED, NOT CONFIGURED)

#### Current State:
- **Package installed:** `@upstash/redis@^1.35.0` in `package.json`
- **Environment variables:** EMPTY in `.env.local`
  ```
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  ```
- **Usage:** NONE in codebase

#### Why Redis for Demo User:
- **Problem:** Demo user dashboard loads 12-15 reflections + dreams on every visit
  - Each reflection: ~500 words AI response (Markdown parsing)
  - Total query time: 200-400ms (acceptable but cacheable)
- **Solution:** Cache demo user's dashboard data in Redis
  - TTL: 24 hours (resets nightly with demo data)
  - Invalidation: On demo data reset script run
  - **Expected speedup:** 200ms → 20ms (10x faster)

#### Implementation Pattern:

**A. Upstash Setup (5 minutes)**
1. Create free Upstash Redis instance: https://upstash.com/
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Add to `.env.local`

**B. Redis Client Setup** (`/server/lib/redis.ts`)
```typescript
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Redis not configured - caching disabled');
    return null;
  }
  
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  
  return redis;
}
```

**C. Cache Pattern in `users.getDashboardData`:**
```typescript
getDashboardData: protectedProcedure.query(async ({ ctx }) => {
  const redis = getRedis();
  const cacheKey = `dashboard:${ctx.user.id}`;
  
  // Try cache (only for demo user)
  if (redis && ctx.user.isDemo) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit:', cacheKey);
      return cached;
    }
  }
  
  // Fetch from database
  const data = await fetchDashboardData(ctx.user.id);
  
  // Cache for demo user (24 hour TTL)
  if (redis && ctx.user.isDemo) {
    await redis.setex(cacheKey, 86400, data);
  }
  
  return data;
}),
```

**Discovery:** Redis caching is **optional** for MVP. If Upstash setup is skipped, app degrades gracefully (caching disabled, full database queries).

---

### 6. Image Optimization Workflow

#### Current State:
- **Next.js Image component:** Available (next/image)
- **Configuration:** `next.config.js` has empty `images.domains` array
- **Public assets:** `/public` directory with PNG favicons
- **Landing page images:** NONE FOUND (no hero images, no screenshots)

**Discovery:** Landing page currently has **NO IMAGES** - only cosmic background (CSS gradients). Vision requires:
- "Screenshots/visuals: Dashboard screenshot showing populated state (beautiful data)"
- "Reflection output screenshot showing formatted AI response"
- "Evolution report visualization example"

#### Image Optimization Strategy for Landing Page:

**A. Screenshot Creation (Iteration 1)**
1. **Take screenshots** of demo user dashboard (after seeding)
   - Dashboard view: 1920x1080 PNG
   - Reflection detail page: 1920x1080 PNG
   - Evolution report: 1920x1080 PNG
2. **Convert to WebP** (70-80% compression, near-lossless)
   - Tool: `sharp` (already installed for canvas module)
   - Target file size: <100KB per image
3. **Store in `/public/landing/`**
   - `dashboard-demo.webp`
   - `reflection-demo.webp`
   - `evolution-demo.webp`

**B. WebP Conversion Script** (`/scripts/convert-to-webp.js`)
```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './public/landing/raw';
const outputDir = './public/landing';

fs.readdirSync(inputDir)
  .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
  .forEach(file => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
    
    sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath)
      .then(() => console.log(`✅ Converted: ${file} → ${path.basename(outputPath)}`))
      .catch(err => console.error(`❌ Failed: ${file}`, err));
  });
```

**C. Next.js Image Usage Pattern:**
```tsx
import Image from 'next/image';

<Image
  src="/landing/dashboard-demo.webp"
  alt="Mirror of Dreams dashboard showing 5 active dreams and recent reflections"
  width={1920}
  height={1080}
  quality={90}
  priority // For above-fold images (LCP optimization)
  placeholder="blur" // Requires blurDataURL
  className="rounded-lg shadow-amethyst-breath"
/>
```

**D. Performance Budget:**
- **Target LCP (Largest Contentful Paint):** <2 seconds
- **Image size budget:** 3 images × 100KB = 300KB total
- **Optimization:** Use `priority` prop on hero image, lazy-load below-fold images

**Discovery:** `sharp` is already installed (dependency of `canvas@^3.1.2`), so WebP conversion requires **zero new dependencies**.

---

## Patterns Identified

### Pattern 1: tRPC Mutation Structure

**Description:** All mutations follow consistent request/response pattern with Zod validation

**Structure:**
```typescript
mutationName: protectedProcedure
  .input(zodSchemaFromTypes)
  .mutation(async ({ ctx, input }) => {
    // 1. Validate ownership/permissions (if needed)
    // 2. Execute database operation via Supabase client
    // 3. Handle errors with TRPCError + descriptive message
    // 4. Return { data, message } or { success, message }
  })
```

**Use Case:** Profile page mutations (updateProfile, changePassword, deleteAccount)

**Example:**
```typescript
// types/schemas.ts
export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  language: z.enum(['en', 'he']).optional(),
});

// server/trpc/routers/users.ts
updateProfile: protectedProcedure
  .input(updateProfileSchema)
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from('users')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', ctx.user.id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    }

    return { user: userRowToUser(data), message: 'Profile updated successfully' };
  }),
```

**Recommendation:** Follow this pattern exactly for new mutations (consistency = maintainability).

---

### Pattern 2: React Query Caching in tRPC Client

**Description:** tRPC Provider configures React Query with 5-minute stale time

**Configuration:**
```typescript
// components/providers/TRPCProvider.tsx
const [queryClient] = useState(() =>
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

**Use Case:** Profile/settings pages benefit from automatic caching
- User visits Profile → query runs, data cached for 5 minutes
- User navigates away and back → data served from cache (instant)
- After 5 minutes → query re-runs on next access

**Example:**
```tsx
// app/profile/page.tsx
const { data: profile, isLoading } = trpc.users.getProfile.useQuery();

// First load: Database query (~100ms)
// Subsequent loads within 5 min: Cache (~0ms)
// After 5 min: Re-fetch in background (optimistic UI)
```

**Recommendation:** No changes needed. Existing caching strategy is optimal for profile/settings UX.

---

### Pattern 3: Supabase Direct Queries (No ORM)

**Description:** All database access uses raw Supabase client (no Prisma/Drizzle abstraction)

**Why This Works:**
- **Type safety:** TypeScript types manually defined in `/types` directory
- **Simplicity:** No ORM learning curve, direct SQL-like syntax
- **Performance:** No query builder overhead
- **Flexibility:** Easy to write complex queries with JOINs

**Example:**
```typescript
// Get user profile with stats
const { data: userProfile, error } = await supabase
  .from('users')
  .select(`
    id, email, name, tier, subscription_status,
    reflection_count_this_month, total_reflections,
    created_at, last_sign_in_at
  `)
  .eq('id', ctx.user.id)
  .single();
```

**Use Case:** Demo user seeding script will use same pattern:
```typescript
// Seed demo reflections
const { data: reflections, error } = await supabase
  .from('reflections')
  .insert(demoReflectionsArray)
  .select();
```

**Recommendation:** Continue using Supabase client directly. No ORM needed (project size doesn't justify complexity).

---

### Pattern 4: AI Generation with Premium Differentiation

**Description:** Claude API calls differentiate between standard and premium tier via token limits + extended thinking

**Standard Tier:**
```typescript
{
  model: 'claude-sonnet-4-5-20250929',
  temperature: 1,
  max_tokens: 4000,
  system: baseSystemPrompt,
  messages: [{ role: 'user', content: userPrompt }]
}
```

**Premium Tier:**
```typescript
{
  model: 'claude-sonnet-4-5-20250929',
  temperature: 1,
  max_tokens: 6000, // +50% longer responses
  thinking: {
    type: 'enabled',
    budget_tokens: 5000, // Extended thinking enabled
  },
  system: baseSystemPrompt + PREMIUM_ENHANCEMENT,
  messages: [{ role: 'user', content: userPrompt }]
}
```

**Use Case:** Demo user seeding must use **premium tier** to showcase best possible output

**Process for Demo Content Generation:**
1. Create demo user with `tier = 'premium'`
2. Call `trpc.reflection.create` with `isPremium: true`
3. AI generates premium-quality reflections (6000 tokens, extended thinking)
4. Store in database with `is_premium = true` flag

**Recommendation:** All demo reflections should be premium tier (demonstrates product at its best).

---

### Pattern 5: Glass Morphism Component Composition

**Description:** All UI components use layered glass effects (depth via transparency)

**Base Component Structure:**
```tsx
// components/ui/glass/GlassCard.tsx
<div className={`
  backdrop-blur-glass
  bg-glass-triple
  shadow-glass-refract
  border border-white/10
  rounded-lg p-6
  hover:shadow-amethyst-breath
  transition-all duration-300
`}>
  {children}
</div>
```

**Composition Pattern:**
```tsx
<GlassCard>
  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
    Profile Settings
  </h2>
  <GlassInput 
    label="Name" 
    value={name} 
    onChange={setName} 
  />
  <GlowButton onClick={handleSave}>
    Save Changes
  </GlowButton>
</GlassCard>
```

**Use Case:** Profile page, Settings page, Demo banner all use same components

**Recommendation:** Reuse existing components. No custom UI needed.

---

## Complexity Assessment

### High Complexity Areas

#### 1. Demo User Content Generation (CRITICAL PATH)
**Complexity:** HIGH - Content quality determines product perception  
**Why Complex:**
- Must write 12-15 **authentic, compelling** reflections (not lorem ipsum)
- Each reflection: 200-400 words of thoughtful self-reflection
- AI responses must showcase premium tier quality (extended thinking)
- Dreams must represent diverse life areas (career, health, relationships)
- Evolution reports must demonstrate pattern recognition across time

**Estimated Effort:**
- Manual writing: 4-6 hours (Ahiya writes all reflections)
- AI-assisted: 1-2 hours (Ahiya writes 1 exemplary, AI generates rest) + 1 hour review
- Seeding script: 2 hours (database inserts, handling foreign keys)

**Recommendation:** Use AI-assisted approach with **strict quality review**.

**Builder Split Needed?** NO - Single builder can handle with Ahiya's content review.

---

#### 2. Redis Caching Implementation (OPTIONAL FOR MVP)
**Complexity:** MEDIUM - New infrastructure dependency  
**Why Complex:**
- Requires Upstash account setup (free tier available)
- Environment variable management (production vs. development)
- Cache invalidation strategy (when to clear demo user cache)
- Graceful degradation (app works without Redis)

**Estimated Effort:**
- Upstash setup: 15 minutes
- Redis client implementation: 30 minutes
- Dashboard caching: 45 minutes
- Testing: 30 minutes
- **Total:** 2 hours

**Recommendation:** **DEFER to post-MVP** unless demo dashboard is slow (>300ms load time).

**Builder Split Needed?** NO - Optional optimization.

---

### Medium Complexity Areas

#### 1. Image Optimization Workflow
**Complexity:** MEDIUM - Requires screenshot creation + conversion  
**Why Medium:**
- Manual screenshots of demo dashboard (after seeding)
- WebP conversion script (uses existing `sharp` dependency)
- Next.js Image component configuration (priority loading, blur placeholders)
- Design consideration: Screenshots must be visually compelling

**Estimated Effort:**
- Screenshots: 30 minutes (take, crop, annotate)
- WebP conversion: 30 minutes (script + batch conversion)
- Landing page integration: 1 hour (Image components + responsive sizing)
- **Total:** 2 hours

**Recommendation:** Take screenshots **after demo user seeding** (ensures beautiful populated data).

**Builder Split Needed?** NO - Straightforward workflow.

---

#### 2. Database Schema Migration (Add `is_demo` + `preferences`)
**Complexity:** MEDIUM - Schema changes always have risk  
**Why Medium:**
- New columns: `users.is_demo`, `users.preferences`
- Index creation for performance
- Migration testing (run on local Supabase first)
- RLS (Row Level Security) policy updates (demo user exemption)

**Estimated Effort:**
- Migration SQL: 30 minutes
- Testing: 30 minutes
- Documentation: 15 minutes
- **Total:** 1.25 hours

**Recommendation:** Run migration **before** seeding script (demo user needs `is_demo` flag).

**Builder Split Needed?** NO - Standard database migration.

---

### Low Complexity Areas

#### 1. tRPC Mutations for Profile/Settings
**Complexity:** LOW - Extends existing patterns  
**Why Low:**
- Mutations already exist in `auth.ts` router (`changePassword`, `deleteAccount`)
- Just needs UI integration (call existing mutations from Profile page)
- Zod schemas already defined in `/types/schemas.ts`
- Error handling pattern established

**Estimated Effort:**
- Profile page UI: 2 hours
- Settings page UI: 2 hours
- Toast notifications: 30 minutes
- Testing: 1 hour
- **Total:** 5.5 hours

**Recommendation:** Use existing mutations. No new backend code needed.

**Builder Split Needed?** NO - Frontend-focused work.

---

#### 2. Landing Page Transformation
**Complexity:** LOW - Existing components + content replacement  
**Why Low:**
- Landing page structure exists (`app/page.tsx`)
- Design components ready (`LandingHero`, `LandingFeatureCard`)
- Just needs: new copy, screenshot images, dual CTAs
- Responsive design already implemented

**Estimated Effort:**
- Copy writing: 1 hour (hero headline, subheadline, feature descriptions)
- Image integration: 1 hour (screenshots, Next.js Image)
- "See Demo" button: 30 minutes (auto-login flow)
- Footer links: 30 minutes (About, Pricing, Privacy)
- **Total:** 3 hours

**Recommendation:** Use existing landing page as template. Minimal refactoring.

**Builder Split Needed?** NO - Content swap + minor UI updates.

---

## Technology Recommendations

### Primary Stack (NO CHANGES)

✅ **Framework:** Next.js 14 with App Router  
**Rationale:** Mature, stable, Vercel-optimized. Already in production.

✅ **Database:** Supabase PostgreSQL (local + cloud)  
**Rationale:** Raw Supabase client provides flexibility without ORM overhead.

✅ **API Layer:** tRPC 11 with React Query  
**Rationale:** Type-safe, efficient batching, 5-min caching, React Query DevTools.

✅ **Auth:** Custom JWT (jsonwebtoken + bcryptjs)  
**Rationale:** Simple, no third-party dependencies, full control.

✅ **AI:** Anthropic Claude Sonnet 4.5  
**Rationale:** Extended thinking for premium tier, 6000 token max, superior reasoning.

✅ **Design:** Tailwind CSS + Framer Motion  
**Rationale:** Existing glass morphism design system is production-ready.

---

### Supporting Libraries (EXISTING)

✅ **Validation:** Zod (`zod@^3.25.76`)  
**Use:** Input validation for all tRPC mutations, type inference for TypeScript

✅ **Serialization:** SuperJSON (`superjson@^2.2.2`)  
**Use:** Serialize Date objects, undefined values in tRPC responses

✅ **Markdown:** React Markdown (`react-markdown@^10.1.0`) + Remark GFM  
**Use:** Render AI responses with tables, strikethrough, task lists

✅ **Icons:** Lucide React (`lucide-react@^0.546.0`)  
**Use:** Settings page icons (Bell, Lock, Eye, Shield)

---

### New Dependencies Required

#### Option 1: Upstash Redis (OPTIONAL - Recommended for Performance)

```json
{
  "@upstash/redis": "^1.35.0" // Already installed, needs configuration
}
```

**Why:** Cache demo user dashboard data for 10x faster load times  
**When:** Only if demo dashboard >300ms load time  
**Fallback:** App works without Redis (graceful degradation)

**Configuration:**
```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Estimated Setup Time:** 20 minutes (account + env vars)

---

#### Option 2: Sharp (ALREADY INSTALLED via canvas)

```json
{
  "sharp": "^0.33.0" // Bundled with canvas@^3.1.2
}
```

**Why:** WebP conversion for landing page screenshots  
**When:** During image optimization workflow (Iteration 1)  
**Note:** No installation needed - already available

**Usage:**
```javascript
const sharp = require('sharp');
await sharp('dashboard.png').webp({ quality: 80 }).toFile('dashboard.webp');
```

---

### Dependencies to AVOID

❌ **Prisma/Drizzle ORM:** Unnecessary abstraction for project size  
❌ **NextAuth.js:** Custom JWT is simpler for this use case  
❌ **Cloudinary/Uploadcare:** No user-uploaded images (only static screenshots)  
❌ **React Hook Form:** GlassInput components handle form state  
❌ **Storybook:** Design system is small, no visual regression testing needed

---

## Integration Points

### Internal Integrations

#### 1. tRPC Client ↔ Backend Mutations
**How They Connect:**
```tsx
// Frontend (Profile Page)
const updateProfile = trpc.users.updateProfile.useMutation({
  onSuccess: () => toast.success('Profile updated!'),
  onError: (error) => toast.error(error.message),
});

// Backend (users.ts router)
updateProfile: protectedProcedure
  .input(updateProfileSchema)
  .mutation(async ({ ctx, input }) => { ... });
```

**Type Safety:**
- Zod schema validates input at runtime
- TypeScript infers types from schema → frontend autocomplete
- `AppRouter` type exported for client import

**Consideration:** All mutations return `{ success?, user?, message }` structure for consistent toast notifications.

---

#### 2. Demo User ↔ Auto-Login Flow
**How They Connect:**
```tsx
// Landing Page "See Demo" Button
const loginDemo = trpc.auth.loginDemo.useMutation();

const handleSeeDemoClick = async () => {
  const { token, user } = await loginDemo.mutateAsync();
  localStorage.setItem('token', token);
  router.push('/dashboard');
};

// Backend (auth.ts router)
loginDemo: publicProcedure.mutation(async () => {
  const demoUser = await getDemoUser();
  const token = jwt.sign({ userId: demoUser.id, ... }, JWT_SECRET);
  return { user: demoUser, token };
});
```

**Consideration:** Demo banner must appear on all pages when `ctx.user.isDemo === true`.

---

#### 3. Redis Cache ↔ Dashboard Queries
**How They Connect:**
```typescript
// Dashboard query with caching
getDashboardData: protectedProcedure.query(async ({ ctx }) => {
  if (ctx.user.isDemo) {
    const cached = await redis.get(`dashboard:${ctx.user.id}`);
    if (cached) return cached;
  }
  
  const data = await fetchFromDatabase(ctx.user.id);
  
  if (ctx.user.isDemo) {
    await redis.setex(`dashboard:${ctx.user.id}`, 86400, data);
  }
  
  return data;
});
```

**Cache Invalidation:**
- TTL: 24 hours (automatic expiration)
- Manual: Demo reset script clears cache via `redis.del('dashboard:demo-user-id')`

**Consideration:** Cache only demo user (not all users - avoid stale data issues).

---

### External Integrations

#### 1. Anthropic API (Claude)
**Purpose:** Generate AI reflections and evolution reports  
**Complexity:** LOW - Already integrated  
**Configuration:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-... # In .env.local
```

**Rate Limits:**
- Tier 1 (default): 50 requests/min, 40,000 tokens/min
- Sufficient for demo user seeding (12-15 reflections = ~15 API calls)

**Cost Estimate:**
- Input: 12 reflections × 500 tokens = 6,000 tokens @ $3/MTok = $0.018
- Output: 12 reflections × 3,000 tokens = 36,000 tokens @ $15/MTok = $0.54
- **Total:** ~$0.56 to generate all demo content

**Consideration:** Run seeding script during development (not on every deployment).

---

#### 2. Upstash Redis (Optional)
**Purpose:** Cache demo user dashboard data  
**Complexity:** LOW - SDK installed, needs account  
**Configuration:**
```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Free Tier Limits:**
- 10,000 commands/day
- 256MB storage
- Sufficient for demo user cache (1 dashboard query = ~50KB JSON)

**Consideration:** If not configured, app defaults to database queries (no breaking change).

---

#### 3. Supabase Local + Cloud
**Purpose:** PostgreSQL database (local dev, cloud production)  
**Complexity:** LOW - Already configured  
**Configuration:**
```bash
# Local development
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Production (Vercel)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=... # From Supabase dashboard
```

**Migration Strategy:**
1. Develop migration locally (`supabase migration new add_demo_user_fields`)
2. Test on local instance
3. Push to production (`supabase db push --remote`)

**Consideration:** Demo user seeding script runs in local dev first, then production after testing.

---

## Risks & Challenges

### Technical Risks

#### Risk 1: Demo Content Quality (HIGH IMPACT)
**Impact:** If demo reflections are generic/inauthentic, visitors won't convert  
**Likelihood:** MEDIUM (AI-generated content can be generic without guidance)  
**Mitigation Strategy:**
1. **Ahiya writes 1 exemplary dream + 4 reflections** (sets quality bar)
2. **AI generates remaining 8 reflections** using Ahiya's style as example
3. **Quality gate:** Ahiya reviews all AI-generated content before seeding
4. **Fallback:** If AI content is poor, Ahiya writes 1-2 more manually (total 6-8 hours)

**Success Criteria:** Ahiya can say "I would write this myself" about demo reflections.

---

#### Risk 2: Tier Limits Mismatch (BLOCKING RISK)
**Impact:** Pricing page can't be built until limits are resolved  
**Likelihood:** CERTAIN (vision says 10/50, code says 1/10)  
**Mitigation Strategy:**
1. **Immediate decision:** Ahiya chooses final tier limits (before Iteration 1 starts)
2. **Code update:** Update `TIER_LIMITS` in 3 files:
   - `server/trpc/routers/users.ts`
   - `server/trpc/routers/dreams.ts` (if dream limits also change)
   - `supabase/migrations/xxx_update_tier_limits.sql` (PostgreSQL function)
3. **Documentation:** Update vision.md to match final decision

**Recommendation:** Use vision limits (10/50) to attract users, but grandfather existing users at current limits.

---

#### Risk 3: Landing Page LCP >2s (MEDIUM IMPACT)
**Impact:** Poor Core Web Vitals → lower SEO ranking  
**Likelihood:** MEDIUM (3 screenshots × 100KB = 300KB, could be slow on 3G)  
**Mitigation Strategy:**
1. **WebP conversion** (already planned): PNG → WebP saves 60-70% file size
2. **Next.js Image `priority` prop** on hero image (preloads above-fold)
3. **Lazy-load below-fold images** (defer loading until scroll)
4. **Blur placeholder** for instant perceived performance
5. **Test on 3G throttling** (Chrome DevTools Network tab)

**Success Criteria:** Lighthouse score >90, LCP <2s on Fast 3G.

---

### Complexity Risks

#### Risk 1: Builder Needs to Split Demo User Seeding (LOW LIKELIHOOD)
**Scenario:** If demo content generation takes >8 hours (quality issues, rework)  
**Sub-task Split:**
- Sub-builder A: Database migration + seed script infrastructure
- Sub-builder B: Content generation (manual writing + AI generation)
- Sub-builder C: Quality review + final seeding

**Recommendation:** Avoid split unless quality issues emerge in first 4 hours.

---

#### Risk 2: Redis Caching Adds Complexity Without Benefit (MEDIUM LIKELIHOOD)
**Scenario:** Demo dashboard already loads fast (<200ms) without caching  
**Mitigation:**
1. **Benchmark first:** Measure demo dashboard load time with 12-15 reflections
2. **If <200ms:** Skip Redis caching (unnecessary complexity)
3. **If >300ms:** Implement Redis caching (10x speedup worth it)

**Recommendation:** **Measure before implementing** (premature optimization is the root of all evil).

---

## Recommendations for Planner

### 1. Resolve Tier Limits Before Iteration 1 Starts
**Why:** Pricing page (Iteration 2) depends on accurate limits  
**Action:** Ahiya decides final limits (vision: 10/50, code: 1/10)  
**Effort:** 30 minutes (decision + code update)  
**Blocker:** Without resolution, Iteration 2 stalls

---

### 2. Prioritize Demo Content Quality Over Speed
**Why:** Demo user is highest-priority conversion tool (per vision: "Most importantly...")  
**Action:**
- Ahiya writes 1 exemplary dream + 4 reflections (4 hours)
- AI generates remaining 8 reflections using exemplar style (1 hour)
- Ahiya reviews all AI content (1 hour)
**Effort:** 6 hours total  
**Trade-off:** Slower than pure AI generation, but ensures authenticity

---

### 3. Defer Redis Caching to Post-MVP
**Why:** Unknown if demo dashboard will be slow (no benchmarks yet)  
**Action:**
- Build demo user seeding first
- Benchmark dashboard load time
- Only implement Redis if >300ms
**Effort Saved:** 2 hours if not needed  
**Risk:** None (app works without Redis)

---

### 4. Use Existing Auth Mutations (Don't Duplicate)
**Why:** `auth.changePassword` and `auth.deleteAccount` already exist  
**Action:** Profile page calls `trpc.auth.changePassword` (not `trpc.users.changePassword`)  
**Effort Saved:** 2 hours (no new backend code)  
**Trade-off:** Slightly less RESTful organization, but no breaking changes

---

### 5. Take Screenshots After Demo Seeding
**Why:** Landing page needs visually compelling populated dashboard  
**Action:**
- Seed demo user first (Iteration 1, days 1-2)
- Take screenshots of demo dashboard (day 3)
- Convert to WebP + integrate into landing page (day 3-4)
**Effort:** 2 hours  
**Benefit:** Screenshots showcase real product (not mockups)

---

### 6. No New UI Framework/Component Library Needed
**Why:** Existing glass morphism design system is comprehensive  
**Action:** Reuse `GlassCard`, `GlassInput`, `GlowButton` for Profile/Settings pages  
**Effort Saved:** 8-12 hours (no custom component design)  
**Benefit:** Visual consistency across app

---

### 7. Add `is_demo` and `preferences` Columns in Single Migration
**Why:** Reduces migration count, atomic change  
**Action:**
```sql
-- Migration: 20251128_iteration_12_schema_updates.sql
ALTER TABLE users ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
CREATE INDEX idx_users_is_demo ON users(is_demo);
```
**Effort:** 30 minutes  
**Benefit:** Clean migration history

---

## Resource Map

### Critical Files/Directories

#### Backend Infrastructure
- **tRPC Routers:** `/server/trpc/routers/`
  - `_app.ts` - Root router combining all sub-routers
  - `auth.ts` - Authentication mutations (signin, signup, changePassword, deleteAccount)
  - `users.ts` - User profile and usage queries (getProfile, getUsageStats, getDashboardData)
  - `reflection.ts` - AI reflection generation (create mutation with Claude API)
  - `dreams.ts` - Dream CRUD operations (create, list, update, delete)
  - `evolution.ts` - Evolution report generation

- **Database Migrations:** `/supabase/migrations/`
  - `20250121000000_initial_schema.sql` - Base schema (users, reflections, usage_tracking)
  - `20251022200000_add_dreams_feature.sql` - Dreams table + dream_id foreign key
  - `20251112000001_update_reflection_limits.sql` - Tier limit adjustments
  - **NEW:** `20251128_iteration_12_schema_updates.sql` - Add is_demo + preferences

- **Validation Schemas:** `/types/schemas.ts`
  - `updateProfileSchema`, `changePasswordSchema`, `deleteAccountSchema`
  - All Zod schemas for tRPC input validation

#### Frontend Components
- **Glass Design System:** `/components/ui/glass/`
  - `GlassCard.tsx` - Primary container (profile/settings sections)
  - `GlassInput.tsx` - Form inputs with glass effect
  - `GlowButton.tsx` - CTAs with amethyst glow
  - `GlassModal.tsx` - Modals (delete account confirmation)

- **Landing Page:** `/app/page.tsx`
  - Current structure with hero + 4 feature cards
  - Needs: new copy, screenshot images, "See Demo" button

- **Providers:** `/components/providers/`
  - `TRPCProvider.tsx` - React Query + tRPC client setup
  - Configured with 5-minute cache, automatic refetching

#### Scripts (NEW - To Be Created)
- `/scripts/seed-demo-user.ts` - Demo user creation + content seeding
- `/scripts/generate-demo-content.ts` - AI-assisted reflection generation
- `/scripts/convert-to-webp.js` - Image optimization for landing page

#### Configuration
- `/next.config.js` - Next.js configuration (image domains, webpack externals)
- `/tailwind.config.ts` - Cosmic theme colors, glass effects, animations
- `/.env.local` - Environment variables (Supabase, Anthropic, Upstash)

---

### Key Dependencies

#### Production Dependencies (Already Installed)
```json
{
  "@anthropic-ai/sdk": "^0.52.0",        // Claude API client
  "@supabase/supabase-js": "^2.50.4",    // Database client
  "@trpc/server": "^11.6.0",             // API framework
  "@trpc/react-query": "^11.6.0",        // tRPC client hooks
  "@upstash/redis": "^1.35.0",           // Redis cache (needs config)
  "bcryptjs": "^3.0.2",                  // Password hashing
  "framer-motion": "^11.18.2",           // Animations
  "jsonwebtoken": "^9.0.2",              // JWT auth
  "next": "^14.2.0",                     // Framework
  "react": "^18.3.1",
  "react-markdown": "^10.1.0",           // AI response rendering
  "superjson": "^2.2.2",                 // Serialization
  "zod": "^3.25.76"                      // Validation
}
```

#### Dev Dependencies (Already Installed)
```json
{
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.10",
  "@types/node": "^24.9.1",
  "@types/react": "^18.3.26",
  "typescript": "^5.9.3"
}
```

#### New Dependencies Required
**NONE** - All features achievable with existing stack

**Optional (Performance):**
- Upstash Redis account (free tier) - Configure existing `@upstash/redis` dependency

---

### Testing Infrastructure

#### Current Testing Strategy
- **Manual testing:** No automated tests found
- **Database testing:** Local Supabase instance (`supabase start`)
- **API testing:** tRPC DevTools (React Query DevTools)

#### Recommended Testing for Iteration 12
1. **Demo User Seeding:**
   - Manual test: Run seed script, verify 3 dreams + 12 reflections created
   - Quality test: Ahiya reviews all demo content for authenticity

2. **Profile Mutations:**
   - Manual test: Update name, change password, verify database updated
   - Error test: Wrong current password → error message displayed

3. **Landing Page LCP:**
   - Lighthouse audit: Target >90 score
   - Chrome DevTools Network tab: Throttle to Fast 3G, measure LCP <2s

4. **Demo Login Flow:**
   - Manual test: Click "See Demo" → auto-login → dashboard shows demo data
   - Banner test: Verify demo banner appears on all pages

**No automated testing framework needed** (project size doesn't justify overhead).

---

## Questions for Planner

### Question 1: Tier Limits - Vision vs. Code Mismatch
**Context:** Vision states free tier = 10 reflections/month, code implements 1 reflection/month  
**Question:** Which limit should be final?
- **Option A:** Vision limits (10/50/unlimited) - More generous, better for conversion
- **Option B:** Code limits (1/5/10) - More conservative, better for cost control
- **Option C:** Hybrid (5/25/unlimited) - Middle ground

**Impact:** Blocks Pricing page development (Iteration 2) until resolved

---

### Question 2: Demo User Auto-Login vs. Manual Credentials
**Context:** Two approaches for "See Demo" button UX  
**Question:** Which UX is preferred?
- **Option A:** Auto-login (one-click, better conversion, requires new mutation)
- **Option B:** Manual credentials (shows credentials modal, users type password)

**Recommendation:** Option A (auto-login) for superior conversion rate

---

### Question 3: Redis Caching - Build Now or Defer?
**Context:** Upstash Redis installed but not configured  
**Question:** Should caching be implemented in Iteration 1?
- **Option A:** Implement now (2 hours effort, 10x speedup if demo dashboard slow)
- **Option B:** Benchmark first, implement only if >300ms load time

**Recommendation:** Option B (measure before optimizing)

---

### Question 4: Demo Content Generation Strategy
**Context:** 12-15 high-quality reflections needed  
**Question:** How much should Ahiya write vs. AI generate?
- **Option A:** Ahiya writes all (6-8 hours, highest quality, most authentic)
- **Option B:** Ahiya writes 1 exemplar, AI generates rest (3 hours, needs review)
- **Option C:** AI generates all (1 hour, highest risk of generic content)

**Recommendation:** Option B (balanced approach with quality gate)

---

### Question 5: Profile/Settings Page Organization
**Context:** Settings could be on same page as Profile or separate  
**Question:** Single page or split?
- **Option A:** Combined Profile + Settings page (simpler navigation)
- **Option B:** Separate pages (cleaner information architecture)

**Recommendation:** Option B (matches vision: "Profile Page" and "Settings Page" as distinct features)

---

### Question 6: Demo User Data Reset Frequency
**Context:** Demo user needs data refresh to prevent spam  
**Question:** How often should demo data reset?
- **Option A:** Nightly (automated cron job, fresh data every day)
- **Option B:** Weekly (less maintenance, acceptable staleness)
- **Option C:** Read-only (no resets needed, users can't edit)

**Recommendation:** Option C (read-only) for simplicity + security

---

## Conclusion

Iteration 12 has a **solid technology foundation** and requires **minimal new dependencies**. The primary challenges are:

1. **Content quality** (demo reflections must be authentic)
2. **Tier limits resolution** (blocking Pricing page)
3. **Image optimization** (landing page performance)

**Technology stack is production-ready.** Focus effort on thoughtful content creation, not infrastructure work.

**Estimated Timeline:**
- Demo user seeding: 6-8 hours (content generation + script)
- Profile/Settings pages: 5-6 hours (UI only, backend exists)
- Landing page transformation: 3-4 hours (copy + images)
- Database migration: 1 hour
- Testing: 2-3 hours

**Total:** 18-22 hours (aligns with master-plan.yaml estimate of 20-24 hours)

**Builder split:** NOT NEEDED - Single builder can complete iteration with content review checkpoints from Ahiya.

---

**Report Status:** COMPLETE  
**Next Step:** Planner reviews findings → creates detailed task breakdown for Builder-12  
**Critical Path:** Resolve tier limits → seed demo user → take screenshots → rebuild landing page

