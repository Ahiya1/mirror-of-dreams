# Technology Stack - Iteration 21

## Core Framework

**Decision:** Next.js 14.2.31+ (App Router) with TypeScript

**Rationale:**
- Already in use across the codebase - no migration needed
- App Router provides server components for optimal performance
- File-based routing simplifies page structure (app/onboarding/page.tsx pattern)
- Built-in API routes for tRPC integration
- Vercel deployment optimization (automatic edge functions, image optimization)
- Server components reduce client bundle size (critical for mobile)
- TypeScript ensures type safety across frontend/backend boundary

**Alternatives Considered:**
- Remix: Better data loading patterns, but migration would add 10+ hours of work
- Vite + React: Lighter build tool, but loses Next.js SSR benefits and Vercel optimizations

**Version Update Required:**
- Current: 14.2.31 (has critical cache poisoning vulnerability)
- Target: 14.2.32+ (npm audit fix will update automatically)
- Breaking changes: None expected (patch version update)

---

## Database

**Decision:** Supabase PostgreSQL with Supabase JS Client (v2.x)

**Rationale:**
- Already integrated and working across all features
- Row Level Security (RLS) provides user data isolation
- Real-time subscriptions available (not used in MVP, but ready for future)
- Generous free tier (500MB, 50K rows, unlimited API requests)
- Built-in authentication (not used - we use custom auth, but available)
- Dashboard for manual data inspection (Supabase Studio)
- Migration system via supabase/migrations/ directory

**Schema Strategy:**
- Users table: Add `onboarding_completed` and `onboarding_completed_at` columns
- No new tables needed for Iteration 21
- Existing tables (users, dreams, reflections, evolution_reports, visualizations, usage_tracking) sufficient

**Migration for Iteration 21:**
```sql
-- Add onboarding tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Admin users skip onboarding
UPDATE users SET onboarding_completed = TRUE
WHERE is_admin = TRUE OR is_creator = TRUE;

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
ON users(onboarding_completed);
```

---

## Authentication

**Decision:** Custom JWT-based authentication with Supabase storage

**Rationale:**
- Already implemented in server/trpc/routers/auth.ts
- JWT tokens stored in localStorage (client-side)
- Protected tRPC procedures verify token in context.ts
- Admin and creator flags supported (is_admin, is_creator)
- Simple and lightweight (no external auth provider needed for MVP)

**Implementation Notes for Builders:**
- Onboarding flow uses existing auth context (no new auth logic)
- After signup success, redirect to /onboarding instead of /dashboard
- Check `onboarding_completed` flag on signin to skip onboarding for returning users
- Admin users should skip onboarding automatically (is_admin OR is_creator flags)

**Onboarding Integration:**
```typescript
// In signup success handler (app/auth/signup/page.tsx)
onSuccess: (data) => {
  const { user, token } = data;
  localStorage.setItem('authToken', token);

  // NEW: Check onboarding status
  if (!user.onboarding_completed && !user.is_admin && !user.is_creator) {
    router.push('/onboarding'); // First-time regular user
  } else {
    router.push('/dashboard'); // Returning user or admin
  }
}
```

---

## API Layer

**Decision:** tRPC v10 for type-safe RPC

**Rationale:**
- Already integrated with @trpc/server, @trpc/client, @trpc/react-query
- Full TypeScript type inference from server to client (no API schema drift)
- React Query integration provides automatic caching, refetching, optimistic updates
- Protected procedures enforce authentication (ctx.user available in all mutations)
- Simple error handling with TRPCError
- No REST boilerplate (no manual fetch() calls, no API versioning)

**New Endpoints for Iteration 21:**
```typescript
// server/trpc/routers/users.ts (NEW ENDPOINT)
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

  if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to complete onboarding' });
  return { success: true, user: data };
});
```

**Updated Endpoints:**
```typescript
// server/trpc/routers/auth.ts (MODIFIED)
signup: publicProcedure.mutation(async ({ input }) => {
  // ... existing signup logic ...

  return {
    user: {
      ...userData,
      onboarding_completed: userData.onboarding_completed || false, // NEW: Include flag
    },
    token,
  };
});
```

---

## Frontend

**Decision:** React 18.x with TypeScript, Framer Motion, Tailwind CSS

**Rationale:**
- React 18: Already in use, concurrent features available (not used in MVP)
- TypeScript: Type safety prevents runtime errors, improves DX
- Framer Motion 11.x: Beautiful animations without CSS complexity
- Tailwind CSS 3.x: Utility-first styling, consistent design system, fast iteration

**UI Component Library:** Custom Glass UI System

**Components (Already Built):**
- GlassCard: Main container for content with glass morphism effect
- GlowButton: Interactive button with hover glow
- GradientText: Text with purple/indigo gradient
- AnimatedBackground: Cosmic background with floating mirror shards
- CosmicLoader: Loading spinner with breathing animation
- ProgressOrbs: Step indicator for multi-step flows (perfect for onboarding)

**New Components for Iteration 21:**
1. **AppNavigation** (components/shared/AppNavigation.tsx)
   - Extract from dashboard inline nav
   - Props: currentPage (for active state highlighting)
   - Includes: logo, nav links, user menu dropdown, upgrade button
   - Responsive: collapses on mobile, shows hamburger menu

2. **Toast** (components/shared/Toast.tsx)
   - Extract from dashboard toast state
   - Props: type (success/error/warning/info), message, duration, onDismiss
   - Position: bottom-right (consistent with dashboard)
   - Auto-dismiss: 5 seconds default, manual dismiss with X button

3. **EmptyState** (components/shared/EmptyState.tsx)
   - Standardized empty state for lists/grids
   - Props: icon (emoji), title, description, ctaLabel, ctaAction
   - Uses: GlassCard, GradientText, GlowButton

**Styling Approach:**
- Glass morphism: backdrop-blur-xl, rgba(255,255,255,0.05) backgrounds
- Color palette: Purple/indigo/violet gradients (from-purple-600 to-indigo-600)
- Dark theme: Background gradient from-mirror-dark via-mirror-midnight to-mirror-dark
- Animations: Framer Motion variants from lib/animations/variants.ts
- Responsive: Mobile-first with md:, lg:, xl: breakpoints

---

## External Integrations

### Anthropic Claude API

**Purpose:** Generate AI reflections, evolution reports, visualizations

**Library:** @anthropic-ai/sdk (v0.x)

**Implementation:**
- Server-side only (API key in environment variables)
- Model: claude-sonnet-4-20250514 (latest)
- Extended thinking: Enabled for Optimal tier evolution reports
- Token tracking: Usage stored in monthly_usage_tracking table

**Prompts:**
- Reflection: server/lib/prompts.ts → generateReflectionPrompt()
- Evolution: server/lib/prompts.ts → generateEvolutionPrompt()
- Visualization: server/lib/prompts.ts → generateVisualizationPrompt()

**No Changes for Iteration 21** (AI integration already working)

---

## Development Tools

### Testing

**Framework:** Manual testing only (MVP scope)

**No automated tests in Iteration 21:**
- Unit tests: Out of scope per vision.md
- Integration tests: Out of scope
- E2E tests: Out of scope

**Manual Testing Strategy:**
- Sarah's Journey walkthrough (Day 0-8)
- TypeScript compilation: `npx tsc --noEmit`
- Build test: `npm run build`
- Cross-browser: Chrome, Safari, Firefox (desktop focus)
- Mobile responsive: iPhone Safari, Android Chrome (acceptable, not optimized)

### Code Quality

**Linter:** ESLint with Next.js config

**Configuration:** .eslintrc.json (already configured)

**Key Rules:**
- react-hooks/rules-of-hooks: error
- react-hooks/exhaustive-deps: warn
- @next/next/no-html-link-for-pages: error
- @typescript-eslint/no-unused-vars: warn

**Formatter:** Prettier (implied by Tailwind formatting)

**Type Checking:** TypeScript strict mode

**tsconfig.json highlights:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### Build & Deploy

**Build Tool:** Next.js built-in (webpack + SWC)

**Deployment Target:** Vercel (automatic from GitHub)

**Environment Variables (Required):**
```bash
# Database
DATABASE_URL=postgresql://...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Auth
JWT_SECRET=random-secret-key

# App
NEXT_PUBLIC_APP_URL=https://mirrorofdreams.app

# Optional (if using Stripe in future)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Build Command:** `npm run build`

**Start Command:** `npm start`

**Vercel Configuration:**
- Framework Preset: Next.js
- Build Command: (auto-detected)
- Output Directory: .next
- Install Command: npm install
- Node Version: 18.x

---

## Performance Targets

**First Contentful Paint:** < 1.5s (on 4G connection)
- Achieved via server components, optimized images, minimal client JS

**Bundle Size:** < 300KB gzipped (client bundle)
- Current: ~250KB (within target)
- Onboarding adds: ~5KB (ProgressOrbs, simple state)
- Navigation extraction: No size change (code moves, not added)

**API Response Time:** < 500ms (non-AI endpoints)
- Database queries optimized with indexes
- tRPC batching reduces request count

**AI Generation Time:** 10-30 seconds (expected, communicated via CosmicLoader)
- Reflection: 10-15s
- Evolution: 20-30s (extended thinking for Optimal tier)
- Visualization: 15-25s

**Lighthouse Scores (Target):**
- Performance: 85+ (desktop), 70+ (mobile)
- Accessibility: 90+
- Best Practices: 95+
- SEO: 90+ (with meta tags)

---

## Security Considerations

### Authentication Security
- JWT tokens: Short expiration (24 hours), HttpOnly cookies (future improvement)
- Password hashing: bcrypt with 10 rounds (already implemented)
- SQL injection: Protected via Supabase parameterized queries
- XSS: React auto-escapes, no dangerouslySetInnerHTML except for markdown (use react-markdown with sanitization)

**How It's Addressed:**
- All user input validated with Zod schemas
- Protected tRPC procedures verify JWT on every request
- Database RLS policies isolate user data
- Admin endpoints check is_admin flag

### npm Security Vulnerabilities

**Current State (Pre-Iteration 21):**
- 3 moderate (esbuild, nodemailer, tar-fs)
- 1 high (tar-fs symlink bypass)
- 1 critical (Next.js cache poisoning - CVE-2024-xxxxx)

**Resolution Plan:**
```bash
npm audit fix
```

**Expected Result:**
- Next.js: 14.2.31 → 14.2.32+ (fixes critical)
- tar-fs: 2.0.x → 2.1.4+ (fixes high)
- Remaining moderate vulnerabilities: Acceptable for MVP (esbuild, nodemailer are dev dependencies)

**Post-Fix Verification:**
```bash
npm audit
# Expected: 0 critical, 0 high, 2-3 moderate (acceptable)
```

### Content Security Policy (Future)

**Not Implemented in MVP:**
- CSP headers (add in next.config.js post-MVP)
- CORS restrictions (Vercel handles)
- Rate limiting (Vercel built-in)

---

## Dependencies Overview

### Core Production Dependencies (Already Installed)

**Framework & UI:**
- next: 14.2.31 → 14.2.32+ (UPDATE REQUIRED)
- react: 18.2.0
- react-dom: 18.2.0
- framer-motion: 11.0.8
- tailwindcss: 3.4.1

**API & Data:**
- @trpc/server: 10.45.1
- @trpc/client: 10.45.1
- @trpc/react-query: 10.45.1
- @tanstack/react-query: 5.25.0
- zod: 3.22.4

**Database & Auth:**
- @supabase/supabase-js: 2.39.8
- bcryptjs: 2.4.3
- jsonwebtoken: 9.0.2

**AI:**
- @anthropic-ai/sdk: 0.20.8

### New Dependencies for Iteration 21

**Markdown Rendering:**
```bash
npm install react-markdown remark-gfm
```

**Purpose:**
- react-markdown: Safe markdown rendering in React (no dangerouslySetInnerHTML)
- remark-gfm: GitHub Flavored Markdown support (tables, strikethrough, task lists)

**Usage:**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {evolutionReport.content}
</ReactMarkdown>
```

**Bundle Size Impact:** +15KB gzipped (acceptable)

### Dev Dependencies (No Changes)

- typescript: 5.3.3
- @types/react: 18.2.56
- @types/node: 20.11.20
- eslint: 8.56.0
- eslint-config-next: 14.1.0

---

## Iteration 21 Specific Decisions

### Onboarding Flow Technology

**State Management:** React useState (no global state needed)

**Why Not Zustand:**
- Onboarding is isolated (no state shared with dashboard)
- Simple step counter (0, 1, 2) doesn't justify global store
- localStorage backup for crash recovery is simple

**Animation Library:** Framer Motion (already used)

**Why:**
- Step transitions: fadeIn/fadeOut between steps
- ProgressOrbs already uses Framer Motion
- Consistent with rest of app

**Progress Indicator:** ProgressOrbs component (already exists)

**Why:**
- Built for this exact use case (multi-step flows)
- Supports active/inactive/complete states
- Accessible (ARIA labels, screen reader friendly)

### Navigation Component Architecture

**Pattern:** Shared component with conditional rendering

**Why Not:**
- Multiple navigation components (duplication, inconsistency)
- Portal navigation (landing page has different aesthetic)
- No navigation (current state, user confusion)

**Decision:**
```typescript
// components/shared/AppNavigation.tsx
export function AppNavigation({ currentPage }: { currentPage: string }) {
  // Uses useAuth hook for user state
  // Conditional rendering for admin links (if is_admin)
  // Active page highlighting via currentPage prop
  // Responsive: hamburger menu on mobile
}
```

**Usage:**
```typescript
// In every app page (dashboard, dreams, evolution, etc.)
<AppNavigation currentPage="dreams" />
```

### Toast Notification Architecture

**Pattern:** Context provider with hook

**Why:**
- Dashboard already has toast implementation (extract, don't rebuild)
- Context provider allows toast from any component
- Hook provides simple API: `toast.success('Message')`

**Implementation:**
```typescript
// contexts/ToastContext.tsx
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  // Add, remove, auto-dismiss logic
};

// hooks/useToast.ts
export const useToast = () => {
  const context = useContext(ToastContext);
  return {
    success: (message) => context.add({ type: 'success', message }),
    error: (message) => context.add({ type: 'error', message }),
    warning: (message) => context.add({ type: 'warning', message }),
    info: (message) => context.add({ type: 'info', message }),
  };
};
```

### Markdown Rendering for Evolution/Visualization

**Library Choice:** react-markdown

**Why Not:**
- marked: Produces HTML string, requires dangerouslySetInnerHTML (XSS risk)
- markdown-it: Same issue, manual HTML injection
- remark alone: Lower-level, more complexity

**Security:**
- react-markdown renders to React components (safe)
- remark-gfm adds GitHub features (tables, task lists)
- No custom HTML allowed (prevents XSS)

**Styling:**
```css
/* Markdown content styling */
.markdown-content h2 { @apply text-2xl font-bold mb-4 text-white; }
.markdown-content h3 { @apply text-xl font-semibold mb-3 text-white/90; }
.markdown-content p { @apply text-white/80 mb-4 leading-relaxed; }
.markdown-content ul { @apply list-disc list-inside mb-4 text-white/80; }
.markdown-content strong { @apply font-bold text-white; }
.markdown-content em { @apply italic text-purple-300; }
```

---

## Environment Variables

### Required for Development

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Authentication
JWT_SECRET=dev-secret-change-in-production

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Required for Production

```bash
# Database (Supabase Cloud)
DATABASE_URL=postgresql://postgres.[PROJECT-ID].supabase.co:5432/postgres

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-api03-[PRODUCTION-KEY]

# Authentication (STRONG SECRET)
JWT_SECRET=[CRYPTOGRAPHICALLY-RANDOM-STRING]

# App URL
NEXT_PUBLIC_APP_URL=https://mirrorofdreams.app

# Optional (future Stripe integration)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Where to Get Keys

**DATABASE_URL:**
- Supabase dashboard → Project Settings → Database → Connection string
- Use "Transaction" mode for serverless (Vercel)

**ANTHROPIC_API_KEY:**
- Anthropic Console → API Keys → Create key
- Use separate keys for dev/production

**JWT_SECRET:**
- Generate: `openssl rand -base64 32`
- Must be same across all Vercel instances

**STRIPE keys (future):**
- Stripe Dashboard → Developers → API keys
- Use test keys in development, live keys in production

---

**Document Status:** COMPLETE
**Iteration:** 21 (Plan plan-3)
**Created:** 2025-11-13
**Next:** patterns.md (code patterns and conventions)
