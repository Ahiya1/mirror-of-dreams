# Technology Stack - Iteration 12

## Core Framework

**Decision:** Next.js 14.2.0 with App Router

**Rationale:**
- Already in production with 9/10 stability (per Plan-6 completion)
- App Router architecture mature and Vercel-optimized
- Server Components + Client Components provide optimal performance
- Zero migration needed - all new pages follow existing patterns
- tRPC integration via HTTP adapter proven robust

**Alternatives Considered:**
- Remix: Not considered (would require full rewrite, breaking change)
- Next.js Pages Router: Not considered (App Router already implemented)
- Astro: Not suitable (app is highly interactive, not content-focused)

**Implementation Notes for Builders:**
- All new pages in `/app` directory (Profile, Settings, About, Pricing)
- Use `'use client'` directive only when React hooks needed (useState, useEffect)
- Prefer Server Components for static content (About page, Pricing page)
- Protected routes use `useAuth()` hook pattern (see patterns.md)

---

## Database

**Decision:** Supabase PostgreSQL (existing instance)

**Rationale:**
- 10+ migrations successfully applied in production
- JSONB support perfect for `preferences` column (flexible schema evolution)
- Row-level security (RLS) enforces user data isolation
- No ORM overhead - raw Supabase client provides direct SQL-like queries
- Local development via `supabase start` (consistent dev/prod environments)

**Schema Strategy:**
```sql
-- Additive changes only (no breaking migrations)
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_users_is_demo ON users(is_demo) WHERE is_demo = true;

-- Preferences schema (JSONB structure):
{
  "notification_email": true,
  "reflection_reminders": "off" | "daily" | "weekly",
  "evolution_email": true,
  "marketing_emails": false,
  "default_tone": "fusion" | "gentle" | "intense",
  "show_character_counter": true,
  "reduce_motion_override": null | true | false,
  "analytics_opt_in": true
}
```

**Why JSONB over separate preferences table:**
- Preferences always fetched with user profile (single query)
- Schema flexibility without migrations (add new preferences without ALTER TABLE)
- PostgreSQL JSONB indexing available if query performance needed later
- Simpler data model (fewer JOINs)

**Migration Pattern:**
- File: `/supabase/migrations/20251128_iteration_12_demo_infrastructure.sql`
- Test locally: `supabase db reset` → verify migration runs
- Deploy: `supabase db push --remote`

---

## API Layer

**Decision:** tRPC 11.6.0 with React Query

**Rationale:**
- Type-safe end-to-end (TypeScript types flow from server → client)
- 9 existing routers demonstrate mature architecture
- React Query integration provides 5-minute caching, optimistic updates
- Zero API boilerplate (no REST routes, no OpenAPI schemas)
- Error handling consistent via `TRPCError` with descriptive messages

**Router Extension Pattern:**
```typescript
// Existing: server/trpc/routers/auth.ts
export const authRouter = router({
  signin: publicProcedure.input(signinSchema).mutation(...),
  signup: publicProcedure.input(signupSchema).mutation(...),
  changePassword: protectedProcedure.input(changePasswordSchema).mutation(...),

  // NEW for Iteration 12:
  loginDemo: publicProcedure.mutation(async () => {
    const demoUser = await getDemoUser();
    const token = jwt.sign({ userId: demoUser.id, isDemo: true }, JWT_SECRET);
    return { user: demoUser, token };
  }),
});
```

**Validation Strategy:**
- All inputs validated via Zod schemas (defined in `/types/schemas.ts`)
- Example: `updateProfileSchema`, `changePasswordSchema`, `updatePreferencesSchema`
- Zod provides runtime validation + TypeScript type inference

**Caching Strategy:**
- React Query default: 5-minute `staleTime` (configured in TRPCProvider)
- Profile queries cached automatically (instant on revisit within 5 min)
- Mutations invalidate related queries via `utils.users.getProfile.invalidate()`

---

## Authentication

**Decision:** Custom JWT (jsonwebtoken + bcryptjs)

**Rationale:**
- Already implemented and production-tested
- Full control over token payload and expiration
- No third-party auth service costs or complexity
- JWT payload includes: `userId`, `email`, `tier`, `isCreator`, `isAdmin`, **`isDemo`** (new)
- HTTP-only cookies prevent XSS attacks

**Demo User Auth Flow:**
```typescript
// Landing page: "See Demo" button
const loginDemo = trpc.auth.loginDemo.useMutation();
const handleSeeDemoClick = async () => {
  const { token, user } = await loginDemo.mutateAsync();
  localStorage.setItem('token', token); // Or set HTTP-only cookie
  router.push('/dashboard'); // Redirect with demo session
};

// Backend: Generate demo JWT
loginDemo: publicProcedure.mutation(async () => {
  const demoUser = await supabase
    .from('users')
    .select('*')
    .eq('is_demo', true)
    .single();

  const token = jwt.sign(
    {
      userId: demoUser.id,
      email: demoUser.email,
      tier: demoUser.tier,
      isDemo: true // NEW flag
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return { user: userRowToUser(demoUser), token };
});
```

**Demo User Security:**
- Read-only recommended (mutations blocked or return success without persisting)
- Alternative: Allow mutations but reset demo data nightly (more complex)
- Demo banner warns: "Demo account is view-only. Sign up to save your reflections."

---

## AI Integration

**Decision:** Anthropic Claude Sonnet 4.5 (@anthropic-ai/sdk 0.52.0)

**Rationale:**
- Extended thinking for premium tier (5000 thinking tokens)
- Superior reasoning quality for reflections and evolution reports
- 6000 max tokens for premium responses (vs. 4000 standard)
- Already integrated with 3 tone prompts (fusion, gentle, intense)

**Demo User AI Generation:**
```typescript
// Generate demo reflections with PREMIUM quality
const reflection = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  temperature: 1,
  max_tokens: 6000, // Premium tier
  thinking: {
    type: 'enabled',
    budget_tokens: 5000, // Extended thinking for depth
  },
  system: fusionPrompt + PREMIUM_ENHANCEMENT,
  messages: [
    {
      role: 'user',
      content: `Dream: ${dream.title}\nReflection: ${userReflection}`
    }
  ]
});
```

**Cost Estimate for Demo Seeding:**
- Input: 12 reflections × 500 tokens = 6,000 tokens @ $3/MTok = $0.018
- Output: 12 reflections × 3,000 tokens = 36,000 tokens @ $15/MTok = $0.54
- Evolution: 2 reports × 10,000 tokens = 20,000 tokens @ $15/MTok = $0.30
- **Total: ~$0.86** (one-time cost for demo seeding)

**Implementation Notes:**
- All demo reflections use premium tier (showcase best possible output)
- Evolution reports generated via actual AI (not hand-written)
- Prompts stored in `/prompts` directory (fusion.txt, gentle.txt, intense.txt)

---

## Design System

**Decision:** Glass Morphism + Cosmic Theme (Tailwind CSS 3.4.0 + Framer Motion 11.18.2)

**Rationale:**
- Comprehensive component library already built (13 components in `/components/ui/glass/`)
- Production-tested with 9.2/10 quality score (Plan-6)
- Consistent visual language across all pages
- Tailwind custom theme includes cosmic colors, shadows, animations
- Framer Motion provides smooth page transitions and micro-interactions

**Core Components (Reuse in Iteration 12):**

1. **GlassCard** - Primary container for Profile/Settings sections
   ```tsx
   <GlassCard elevated className="mb-6">
     <h2 className="text-h2 mb-4">Account Information</h2>
     {/* Content */}
   </GlassCard>
   ```

2. **GlassInput** - Form inputs for Profile/Settings
   ```tsx
   <GlassInput
     label="Name"
     value={name}
     onChange={setName}
     placeholder="Your name"
     error={errors.name}
   />
   ```

3. **GlowButton** - CTAs with amethyst glow
   ```tsx
   <GlowButton
     variant="primary" // or "secondary", "ghost", "danger"
     size="md" // or "sm", "lg"
     onClick={handleSave}
   >
     Save Changes
   </GlowButton>
   ```

4. **CosmicBackground** - Animated starfield (used on all pages)
   ```tsx
   <CosmicBackground animated intensity={2} />
   ```

5. **EmptyState** - Guides new users (enhanced in Plan-6 with progress bars)
   ```tsx
   <EmptyState
     icon="🌱"
     title="Your journey begins with a dream"
     description="Plant your first dream and watch it grow..."
     ctaLabel="Create Your First Dream"
     ctaAction={() => router.push('/dreams')}
     progress={{ current: 0, total: 1, label: 'dreams' }}
   />
   ```

**Cosmic Theme Colors:**
- Amethyst: `#9333EA` (primary purple)
- Void: `#0A0A0F` (deep background)
- Gold Ambient: `#F59E0B` (accent gold)
- Glass effects: `backdrop-blur-crystal`, `bg-glass-triple`, `shadow-glass-refract`

**Animation Standards:**
- Respect `prefers-reduced-motion` (hook: `useReducedMotion()`)
- Slow ambient animations: 13-14s (cosmic shimmer, caustic effects)
- Fast interactions: 200-300ms (hover, focus states)
- Page transitions: 400ms (Framer Motion variants)

---

## Image Optimization

**Decision:** Next.js Image Component (Built-in) + WebP Conversion (sharp)

**Rationale:**
- Next.js Image component provides automatic optimization
- `sharp` already installed (bundled with `canvas@^3.1.2` dependency)
- WebP format reduces file size 60-70% vs. PNG (near-lossless quality)
- Priority loading for above-fold images (LCP optimization)
- Lazy loading for below-fold images (defer until scroll)

**WebP Conversion Workflow:**
```javascript
// Script: /scripts/convert-to-webp.js
const sharp = require('sharp');

await sharp('/public/landing/raw/dashboard.png')
  .webp({ quality: 80 }) // 80% quality, near-lossless
  .toFile('/public/landing/dashboard-demo.webp');

// Result: 2.4MB PNG → 320KB WebP (87% reduction)
```

**Next.js Image Usage:**
```tsx
import Image from 'next/image';

// Above-fold (hero image): Priority loading
<Image
  src="/landing/dashboard-demo.webp"
  alt="Mirror of Dreams dashboard with 5 active dreams"
  width={1920}
  height={1080}
  quality={90}
  priority // Preloads above-fold images
  className="rounded-lg shadow-amethyst-breath"
/>

// Below-fold: Lazy loading
<Image
  src="/landing/reflection-demo.webp"
  alt="AI-generated reflection output"
  width={1920}
  height={1080}
  loading="lazy" // Defers until scroll
  className="rounded-lg"
/>
```

**Performance Budget:**
- 3 screenshots × 100KB = 300KB total
- Target LCP: <2 seconds (Lighthouse score >90)
- Fallback: If LCP >2s, reduce dimensions or defer below-fold images

**Configuration:**
```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/webp'], // Serve WebP by default
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive breakpoints
  },
};
```

---

## Performance Monitoring

**Decision:** Core Web Vitals (Next.js Built-in) + Lighthouse (Manual Audits)

**Rationale:**
- Core Web Vitals critical for SEO and user experience
- Next.js provides `reportWebVitals` hook in `app/layout.tsx`
- Lighthouse audits validate performance before deployment
- Bundle size monitoring prevents bloat (30KB budget across 3 iterations)

**Core Web Vitals Setup:**
```typescript
// app/layout.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === 'web-vital') {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value}`);

    // Optional: Send to analytics
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(metric),
      });
    }
  }
}
```

**Lighthouse Audit Process:**
1. Run before merge: `npm run build && npx lighthouse http://localhost:3000 --view`
2. Target scores:
   - Performance: >90
   - Accessibility: 100
   - Best Practices: 100
   - SEO: >90 (landing page)
3. Focus metrics:
   - LCP (Largest Contentful Paint): <2.5s
   - FID (First Input Delay): <100ms
   - CLS (Cumulative Layout Shift): <0.1

**Bundle Size Monitoring:**
```bash
# Before Iteration 12 (baseline)
npm run build
du -sh .next/static/chunks/*.js | sort -h > baseline.txt

# After Iteration 12 (compare)
npm run build
du -sh .next/static/chunks/*.js | sort -h > iteration-12.txt
diff baseline.txt iteration-12.txt

# Budget: <10KB increase
```

---

## Caching Strategy (Optional)

**Decision:** Upstash Redis (Deferred Unless Needed)

**Rationale:**
- SDK already installed (`@upstash/redis@^1.35.0`)
- Free tier sufficient (10,000 commands/day, 256MB storage)
- Demo user caching could provide 10x speedup (200ms → 20ms)
- **BUT:** Implement only if demo dashboard >300ms load time

**Benchmarking First:**
```typescript
// Measure demo dashboard load time
console.time('demo-dashboard-query');
const data = await supabase
  .from('reflections')
  .select('*, dreams(*)')
  .eq('user_id', demoUserId)
  .order('created_at', { ascending: false })
  .limit(15);
console.timeEnd('demo-dashboard-query');

// If <200ms: Skip Redis (fast enough)
// If >300ms: Implement Redis caching
```

**Redis Implementation (If Needed):**
```typescript
// server/lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache demo user dashboard
export async function getCachedDemoData() {
  const cached = await redis.get<DashboardData>('demo-dashboard');
  if (cached) return cached;

  const data = await fetchDemoDataFromDB();
  await redis.setex('demo-dashboard', 86400, data); // 24h TTL
  return data;
}
```

**Decision:** **DEFER** to post-Iteration 12 unless benchmarks show >300ms.

---

## Environment Variables

**Required (Existing):**
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic (for AI reflections)
ANTHROPIC_API_KEY=sk-ant-api03-...

# JWT Auth
JWT_SECRET=your_random_secret_key_here

# Next.js
NEXT_PUBLIC_APP_URL=https://mirrorofdreams.com
```

**Optional (If Redis Implemented):**
```bash
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Local Development:**
- Copy `.env.example` to `.env.local`
- Run `supabase start` for local database
- Use local Supabase credentials for development

---

## Dependencies Overview

### Production Dependencies (Existing - No Changes)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.0 | Framework |
| `react` | 18.3.1 | UI library |
| `@trpc/server` | 11.6.0 | API framework |
| `@trpc/react-query` | 11.6.0 | tRPC client |
| `@tanstack/react-query` | 5.90.5 | Data fetching |
| `@supabase/supabase-js` | 2.50.4 | Database client |
| `@anthropic-ai/sdk` | 0.52.0 | AI integration |
| `zod` | 3.25.76 | Validation |
| `bcryptjs` | 3.0.2 | Password hashing |
| `jsonwebtoken` | 9.0.2 | JWT auth |
| `framer-motion` | 11.18.2 | Animations |
| `react-markdown` | 10.1.0 | AI response rendering |
| `superjson` | 2.2.2 | Serialization |
| `@upstash/redis` | 1.35.0 | Caching (optional) |

### Dev Dependencies (Existing - No Changes)

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.9.3 | Type checking |
| `@types/node` | 24.9.1 | Node.js types |
| `@types/react` | 18.3.26 | React types |
| `@types/bcryptjs` | 2.4.6 | bcryptjs types |
| `@types/jsonwebtoken` | 9.0.10 | JWT types |
| `tailwindcss` | 3.4.0 | CSS framework |
| `eslint` | 9.3.4 | Linting |

### New Dependencies Required

**NONE** - All features achievable with existing stack.

**Optional:**
- Upstash account (free tier) if Redis caching implemented

---

## Performance Targets

### Core Web Vitals

| Metric | Target | Current (Plan-6) | Iteration 12 Goal |
|--------|--------|------------------|-------------------|
| LCP (Largest Contentful Paint) | <2.5s | 1.8s | <2.0s (with images) |
| FID (First Input Delay) | <100ms | 45ms | <100ms |
| CLS (Cumulative Layout Shift) | <0.1 | 0.02 | <0.1 |

### Lighthouse Scores

| Category | Target | Current (Plan-6) | Iteration 12 Goal |
|----------|--------|------------------|-------------------|
| Performance | >90 | 94 | >90 |
| Accessibility | 100 | 100 | 100 |
| Best Practices | 100 | 100 | 100 |
| SEO | >90 | 92 | >90 |

### Bundle Size

| Asset | Baseline (Plan-6) | Iteration 12 Budget | Max Allowed |
|-------|-------------------|---------------------|-------------|
| Main bundle | ~450KB | +10KB | 460KB |
| Landing page chunk | ~80KB | +5KB | 85KB |
| Demo flow chunk | N/A | +3KB | 3KB (new) |
| **Total increase** | - | +10KB | +30KB (3 iterations) |

---

## Security Considerations

### Demo User Security

**Strategy:** Read-only demo account (recommended)
- Mutations blocked: `if (ctx.user.isDemo) throw new TRPCError({ code: 'FORBIDDEN' })`
- Alternative: Mutations succeed but don't persist (return success without DB write)
- Banner warning: "Demo account is view-only. Sign up to save your reflections."

**Benefits:**
- No spam/abuse (users can't create junk data)
- No nightly reset job needed (static demo data)
- Faster (cached demo data never changes)

**Drawback:**
- Users can't "try creating" a reflection (only view existing)
- **Mitigation:** Clear CTA on demo banner: "Sign up free to start reflecting"

### Data Isolation

- Row-level security (RLS) enforces user ownership
- Demo user exempt from RLS for performance (uses service role key)
- JWT validation on all protected routes
- Password hashing via bcrypt (10 rounds, 2^10 iterations)

### Environment Variables

- Never commit `.env.local` (gitignored)
- Use Vercel environment variables for production
- Rotate `JWT_SECRET` periodically (requires re-login for all users)

---

## Technology Decision Rationale Summary

| Decision | Why Not Alternatives? |
|----------|----------------------|
| **Next.js 14 App Router** | Remix requires rewrite, Pages Router already replaced |
| **Supabase PostgreSQL** | Prisma/Drizzle unnecessary for project size, raw SQL sufficient |
| **tRPC 11** | REST would require OpenAPI schemas, lose type safety |
| **Custom JWT** | NextAuth.js overkill for simple email/password auth |
| **Anthropic Claude** | OpenAI GPT-4 lacks extended thinking, Claude superior for reasoning |
| **Tailwind + Framer Motion** | CSS-in-JS (styled-components) adds bundle size, Tailwind already configured |
| **No ORM** | Direct Supabase client faster, simpler, no learning curve |
| **No UI library** | Glass morphism components already built, MUI/Chakra unnecessary |

---

**Tech Stack Status:** FINALIZED
**Breaking Changes:** NONE (all additive)
**New Dependencies:** NONE (optional: Upstash account for Redis)
**Migration Risk:** LOW (additive schema changes only)
**Performance Risk:** MEDIUM (mitigated by WebP conversion, lazy loading)
