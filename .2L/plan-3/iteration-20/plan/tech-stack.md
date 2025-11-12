# Technology Stack - Iteration 20

## Core Framework

**Decision:** Next.js 14 (App Router) + TypeScript

**Rationale:**
- Already established in project (3 iterations complete with this stack)
- Server Components reduce bundle size for dashboard-heavy app
- tRPC integration is mature and type-safe
- File-based routing simplifies dream/evolution/visualization detail pages
- Vercel deployment is seamless (automatic on push to main)

**Alternatives Considered:**
- Remix: Excellent loader pattern but requires migration, tRPC integration less mature
- Plain React SPA: Would lose SSR benefits, larger client bundle, worse initial load

**Version:** Next.js 14.x (latest stable)

---

## Database

**Decision:** Supabase PostgreSQL with Row Level Security

**Rationale:**
- Already configured with complete schema for dreams, reflections, evolution_reports, visualizations
- Database functions handle complex logic (temporal distribution, usage limits)
- RLS policies isolate user data automatically
- Real-time subscriptions available (not used in MVP but future-ready)
- Generous free tier supports development and early users

**Schema Strategy:**
- `dreams` table: Core dream entity with target_date, days_left calculation, category, status
- `reflections` table: Links to dreams, stores 5-question responses and AI-generated reflection text
- `evolution_reports` table: Stores generated reports with report_type (dream_specific, cross_dream, dream_agnostic)
- `visualizations` table: Stores generated narratives with style (achievement, spiral, synthesis)
- `usage_tracking` table: Monthly usage counters per user (reflections_count, evolution_reports_count, visualizations_count)

**Critical Schema Note:**
- MUST verify `usage_tracking.month` is DATE type (not TEXT `month_year`)
- Migration `20251112000000_fix_usage_tracking.sql` should be applied from iteration 19
- Builder must test database functions before starting UI work

---

## Authentication

**Decision:** Supabase Auth (Email/Password)

**Rationale:**
- Already implemented and working
- JWT-based with automatic token refresh
- Built-in RLS integration (user_id from token)
- Supports future OAuth providers (Google, GitHub) without code changes
- Admin flags (`is_admin`, `is_creator`) in users table for privileged access

**Implementation Notes:**
- useAuth hook provides `user`, `isLoading`, `signIn`, `signUp`, `signOut`
- Protected routes check `user` before rendering
- tRPC context includes userId from Supabase token

---

## API Layer

**Decision:** tRPC for type-safe RPC

**Rationale:**
- Already implemented with comprehensive routers:
  - `dreams.ts`: CRUD operations for dreams
  - `reflections.ts`: Create/list reflections with AI generation
  - `evolution.ts`: Generate/list/get evolution reports with eligibility checking
  - `visualizations.ts`: Generate/list/get visualizations
  - `auth.ts`: Sign up/sign in
- End-to-end type safety (no manual API typing)
- Automatic request/response validation via Zod schemas
- TanStack Query integration (caching, optimistic updates, retries)
- No OpenAPI overhead (internal app, not public API)

**Endpoints Used in Iteration 20:**
```typescript
// Evolution
trpc.evolution.checkEligibility.useQuery() // Check if >= 4 reflections exist
trpc.evolution.generateDreamEvolution.useMutation({ dreamId }) // Generate report (45s)
trpc.evolution.list.useQuery({ page, limit, dreamId? }) // Get reports list
trpc.evolution.get.useQuery({ id }) // Get single report with metadata

// Visualizations
trpc.visualizations.generate.useMutation({ dreamId, style: 'achievement' }) // Generate viz (30s)
trpc.visualizations.list.useQuery({ page, limit, dreamId? }) // Get visualizations list
trpc.visualizations.get.useQuery({ id }) // Get single visualization

// Dreams
trpc.dreams.get.useQuery({ id }) // Get dream details for detail page
trpc.dreams.list.useQuery({ page, limit, status: 'active' }) // Get active dreams

// Reflections
trpc.reflections.list.useQuery({ page, limit, dreamId? }) // Get reflections for dream
```

---

## Frontend

**Decision:** React 18 + TypeScript + Tailwind CSS + Custom Glass Components

**UI Component Library:** Custom Glass System (no external library)

**Styling:** Tailwind CSS 3.x + Custom CSS modules for cosmic effects

**Rationale:**

### React 18
- Concurrent features support (not heavily used but future-ready)
- Already established as framework choice
- Excellent ecosystem for markdown rendering, animations

### TypeScript
- End-to-end type safety with tRPC
- Catches errors at compile-time (dream.status typos, missing props)
- Excellent IDE autocomplete for component props
- Required for tRPC integration

### Tailwind CSS
- Rapid styling with utility classes
- Custom theme colors already defined (mirror-purple, mirror-indigo, mirror-violet)
- Custom utilities for glass effects (`backdrop-blur-crystal`, `crystal-glass`)
- Responsive design with `sm:`, `md:`, `lg:` prefixes
- No unused CSS (automatic purging)

### Custom Glass Components
- **Why not Shadcn/Radix/Material-UI:** Vision requires unique "soft, glossy, sharp" aesthetic that external libraries don't provide. Custom components give full control over cosmic glass morphism look.
- **Existing Components:**
  - `GlassCard`: Base card with blur backdrop, variants (default, elevated, inset)
  - `GlowButton`: Button with glow effects on hover
  - `CosmicLoader`: Animated gradient ring loader (used during AI generation)
  - `GradientText`: Text with purple-to-indigo gradient
  - `AnimatedBackground`: Floating cosmic particles
  - `ProgressOrbs`: Circular progress indicators
- **Usage in Iteration 20:**
  - Wrap evolution report content in `GlassCard variant="elevated"`
  - Use `CosmicLoader` during 30-45s AI generation
  - Apply `GradientText` to achievement narrative "I am..." statements
  - Style markdown headers with gradient text

---

## Markdown Rendering

**Decision:** react-markdown + remark-gfm

**Rationale:**
- Evolution reports contain markdown (headers, bold, italics, lists)
- Lightweight library (12KB gzipped)
- Customizable component renderers (can apply cosmic styling to headers, bold, etc.)
- 13K stars on GitHub, actively maintained
- GitHub Flavored Markdown support via remark-gfm plugin

**Installation:**
```bash
npm install react-markdown remark-gfm
```

**Usage Pattern:**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({node, ...props}) => <GradientText className="text-4xl font-bold mb-4" {...props} />,
    h2: ({node, ...props}) => <GradientText className="text-3xl font-bold mb-3" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-2xl font-semibold text-mirror-purple mb-2" {...props} />,
    strong: ({node, ...props}) => <strong className="text-mirror-purple font-semibold" {...props} />,
    em: ({node, ...props}) => <em className="text-mirror-indigo italic" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 ml-4" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 ml-4" {...props} />,
  }}
>
  {report.evolution}
</ReactMarkdown>
```

**Alternatives Considered:**
- Marked + DOMPurify: More control but heavier, requires manual sanitization
- Remark + Rehype: Lower-level, more complex, overkill for MVP needs
- Plain text with CSS: Loses semantic structure, harder to style

---

## External Integrations

### Anthropic Claude API

**Purpose:** Generate evolution reports and visualizations using AI

**Library:** `@anthropic-ai/sdk` (already installed)

**Implementation:**
- **Model:** Claude Sonnet 4 (`claude-sonnet-4-5-20250929`)
- **Extended Thinking:** Enabled for Optimal/Premium tiers (10,000 token budget)
- **Max Tokens:** 4,000 output
- **Temperature:** 1.0 (creative, varied responses)
- **Generation Time:** 30-45 seconds (longer with extended thinking)

**Backend Integration:**
- Evolution reports: `server/trpc/routers/evolution.ts` handles all AI calls
- Visualizations: `server/trpc/routers/visualizations.ts` handles narrative generation
- Cost tracking: `server/lib/cost-calculator.ts` logs input/output/thinking tokens
- Temporal distribution: `server/lib/temporal-distribution.ts` selects reflections evenly across timeline

**Frontend Considerations:**
- 30-45 second wait requires excellent UX (CosmicLoader + message)
- Error handling for rate limits (unlikely with Anthropic but possible)
- Retry logic handled by tRPC (automatic retries with exponential backoff)

**Environment Variable:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-... # Must be set in Vercel
```

---

## Development Tools

### Testing

**Framework:** Manual testing for MVP (automated tests post-MVP)

**Coverage target:** N/A (focus on end-to-end user journey testing)

**Strategy:**
- Manual smoke tests after each feature completion
- Sarah's Day 6 journey test before marking iteration complete
- Exploratory testing of edge cases (0 reflections, Free tier limits, etc.)
- No unit tests in iteration 20 (defer to post-MVP)

**Rationale:** Given 12-16 hour build timeline, manual testing is faster and catches UX issues better than automated tests. Automated tests valuable for regression prevention post-MVP but not critical for initial iteration.

---

### Code Quality

**Linter:** ESLint (Next.js default config)

**Formatter:** Prettier (already configured)

**Type Checking:** TypeScript strict mode

**Pre-commit Hooks:** None (manual checks before commit)

**Standards:**
- All components must have TypeScript types (no `any` except error handling)
- tRPC queries must use `.useQuery` (not `.fetch` in client components)
- Loading states required for all async operations (no blank screens)
- Error boundaries for mutation failures (try/catch with user-friendly messages)

---

### Build & Deploy

**Build tool:** Next.js built-in (Turbopack in dev, Webpack in production)

**Deployment target:** Vercel (automatic deployment on push to `main`)

**CI/CD:** Vercel automatic deployment pipeline
- Push to `main` → Vercel build → Deploy to production
- TypeScript compilation errors block deployment
- Build logs available in Vercel dashboard

**Build Command:**
```bash
npm run build # Next.js build + TypeScript check
```

**Deployment URL:** mirrorofdreams.vercel.app (or custom domain)

---

## Environment Variables

All required env vars for iteration 20:

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Backend (Vercel environment variables):**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-... # Claude API key for AI generation
SUPABASE_URL=https://xyz.supabase.co # Same as frontend
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side auth
DATABASE_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres # Direct DB access
```

**How to Get Them:**
- Supabase: Project settings → API → URL and keys
- Anthropic: Console.anthropic.com → API keys → Create new key
- Database URL: Supabase project settings → Database → Connection string

---

## Dependencies Overview

Key packages with versions (from package.json):

**Core:**
- `next`: 14.x - Framework
- `react`: 18.x - UI library
- `typescript`: 5.x - Type checking

**Backend:**
- `@trpc/server`: 10.x - tRPC server
- `@trpc/client`: 10.x - tRPC client
- `@trpc/react-query`: 10.x - React integration
- `@anthropic-ai/sdk`: Latest - Claude API client
- `zod`: 3.x - Schema validation

**Database:**
- `@supabase/supabase-js`: 2.x - Supabase client
- `@supabase/auth-helpers-nextjs`: 0.x - Auth helpers

**UI:**
- `tailwindcss`: 3.x - Styling
- `framer-motion`: 11.x - Animations (already used in glass components)
- `react-markdown`: Latest - Markdown rendering (MUST INSTALL if not present)
- `remark-gfm`: Latest - GitHub Flavored Markdown (MUST INSTALL if not present)

**Utilities:**
- `date-fns`: 3.x - Date formatting (already used)
- `clsx`: 2.x - Conditional class names
- `@tanstack/react-query`: 5.x - Data fetching (via tRPC)

**Dev Dependencies:**
- `eslint`: 8.x - Linting
- `prettier`: 3.x - Formatting
- `@types/node`: 20.x - Node types
- `@types/react`: 18.x - React types

---

## Performance Targets

**First Contentful Paint:** < 1.5 seconds
- Next.js SSR provides fast initial render
- GlassCard components are lightweight (no heavy dependencies)
- Critical CSS inlined automatically

**Bundle Size:** < 300KB (main bundle)
- tRPC adds minimal overhead (type info stripped in production)
- react-markdown adds ~12KB gzipped
- Glass components use CSS-only effects (no heavy JS animations except Framer Motion)

**API Response Time:**
- Dream/reflection queries: < 200ms (Supabase is fast)
- Evolution generation: ~30-45 seconds (Claude API, acceptable for quality)
- Visualization generation: ~25-35 seconds (shorter than evolution)

**Database Query Performance:**
- Indexed foreign keys: `reflections.dream_id`, `evolution_reports.dream_id`
- Usage tracking uses composite primary key: `(user_id, month)`
- RLS policies optimized with `user_id = auth.uid()` filters

**Caching Strategy:**
- TanStack Query caches all tRPC responses (5 minute default)
- Dream list cached until mutation occurs (optimistic updates)
- Evolution reports list cached (rarely changes, refetch on generate)

---

## Security Considerations

### Row Level Security
**How it's addressed:** Supabase RLS policies enforce user isolation. Dreams/reflections/reports only accessible to owner. Admin users bypass RLS via service role key (backend only).

### API Key Protection
**How it's addressed:**
- Anthropic API key stored in Vercel environment variables (never in client code)
- Supabase anon key is public (safe, RLS policies protect data)
- Service role key only used in backend (never exposed to client)

### Input Validation
**How it's addressed:**
- All tRPC endpoints use Zod schemas for input validation
- Dream title/description sanitized (no HTML/script injection)
- Reflection answers treated as plain text (no markdown from user)

### Markdown Rendering XSS
**How it's addressed:**
- react-markdown sanitizes output by default (no raw HTML allowed)
- Evolution reports generated by AI (trusted source, not user input)
- User cannot edit evolution reports (read-only after generation)

### Rate Limiting
**How it's addressed:**
- Monthly usage limits enforced by database functions
- Anthropic SDK handles API rate limits automatically
- Vercel serverless functions have built-in concurrency limits

---

## Iteration 20 Specific Decisions

### 1. Use Client-Side Eligibility Calculation
**Decision:** Count `reflections.length >= 4` on dream detail page instead of new backend endpoint

**Rationale:** Dream detail page already fetches reflections. Counting is trivial and instant. No additional network latency.

**Implementation:**
```typescript
const dreamReflections = reflections?.items?.filter(r => r.dream_id === dreamId) || [];
const isEligibleForEvolution = dreamReflections.length >= 4;
```

### 2. Defer UsageCard Multi-Metric Display
**Decision:** Show reflections usage only, defer evolution/visualization metrics to iteration 21

**Rationale:** Requires date filtering logic (3-4 hours). Not blocking Sarah's journey. Saves time.

### 3. Defer Dream Card Quick Actions
**Decision:** Don't add Reflect/Evolution/Visualize buttons to dream cards in iteration 20

**Rationale:** Vision doesn't explicitly require it. Users can access via dream detail page. Saves 2-3 hours. Add in polish phase (iteration 21).

### 4. Create VisualizationCard Component
**Decision:** Add new dashboard card for latest visualization preview

**Rationale:** Evolution has EvolutionCard, visualizations deserve equivalent. Dashboard cohesion. Medium priority (3-4 hours) but worth including.

---

**Tech Stack Status:** FINALIZED
**Ready for:** Builder implementation
**Total New Dependencies:** 2 (react-markdown, remark-gfm)
**Infrastructure Changes:** 0 (use existing Next.js + Supabase + tRPC)
