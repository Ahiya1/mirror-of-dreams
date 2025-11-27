# Technology Stack - Plan-4 Iteration 1

## Core Framework

**Decision:** Next.js 14 (App Router)

**Rationale:**
1. **Already implemented and working** - App Router patterns established, changing frameworks would add 20+ hours
2. **Server Components for AI integration** - Reflection API runs server-side, leveraging Next.js API routes
3. **File-based routing simplifies structure** - `/app/reflection/MirrorExperience.tsx` pattern is clean
4. **Strong TypeScript support** - End-to-end type safety with tRPC integration
5. **Local development workflow established** - `npm run dev` works reliably with Supabase

**Alternatives Considered:**
- **Remix:** Better data loading patterns, but migration cost too high for iteration 1
- **Vite + React:** Lighter weight, but loses server-side API route benefits

**Version:** Next.js 14.x (check `package.json` for exact version)

**Key Features Used:**
- App Router (`/app` directory)
- Client Components (`'use client'` directive for stateful UI)
- API Routes (`/app/api/trpc/[trpc]/route.ts`)
- Metadata API (for page titles, OG tags)

---

## Database

**Decision:** Supabase PostgreSQL (Local Instance)

**Rationale:**
1. **Already configured and seeded** - Database running on port 54331/54322
2. **Type-safe Supabase client** - Auto-generated types from schema
3. **Real-time capabilities** (not used yet, but available for future)
4. **Row-level security** - User isolation already implemented
5. **Local development** - No cloud dependencies, fast iteration

**Schema Strategy:**
- **Migrations-first approach** - All changes via `.sql` files in `supabase/migrations/`
- **Versioned schema** - Migration timestamps ensure reproducible database state
- **Explicit relationships** - Foreign keys with ON DELETE behaviors defined
- **Check constraints** - Enums validated at database level (e.g., `status IN ('active', 'completed', 'archived')`)

**Connection Pattern:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Schema Changes for Iteration 1:**
- **Remove from new reflections:** `has_date`, `dream_date` fields (leave columns in DB as nullable)
- **No migration required** - Existing columns remain for historical data
- **Post-iteration cleanup:** Optional migration to drop columns (deferred to post-plan-4)

**Database Location:**
- Local: `postgresql://postgres:postgres@localhost:54322/postgres`
- Supabase Studio: `http://localhost:54323`

---

## Authentication

**Decision:** Supabase Auth (Email/Password)

**Rationale:**
1. **Already implemented** - Sign-in/sign-up flows working
2. **Session management** - JWT tokens with auto-refresh
3. **User context integration** - tRPC middleware extracts user from session
4. **Row-level security** - Database policies enforce user isolation

**Implementation Notes:**
- Auth context: `useAuth` hook provides user state
- Protected routes: Middleware checks `ctx.user` in tRPC procedures
- Session storage: HTTP-only cookies (secure by default)

**No changes needed for iteration 1** - Auth system stable and functional.

---

## API Layer

**Decision:** tRPC v10+ (Type-Safe APIs)

**Rationale:**
1. **End-to-end type safety** - TypeScript types shared between client/server
2. **No code generation** - Types inferred automatically
3. **React Query integration** - Built-in data fetching, caching, mutations
4. **Middleware support** - Usage limits, authentication already implemented
5. **Developer experience** - Autocomplete, inline errors, refactoring safety

**Router Structure:**
```
server/trpc/
├── routers/
│   ├── _app.ts              # Root router (combines all sub-routers)
│   ├── reflection.ts        # AI reflection generation (BUILDER 1)
│   ├── reflections.ts       # CRUD operations
│   ├── dreams.ts            # Dream management
│   ├── evolution.ts         # Evolution reports
│   └── visualizations.ts    # Visualization generation
├── context.ts               # Request context (user, session)
└── middleware.ts            # Auth, usage limits
```

**Schema Validation:**
- **Zod schemas** - Defined in `types/schemas.ts`
- **Input validation** - `.input(createReflectionSchema)` on procedures
- **Type inference** - `z.infer<typeof createReflectionSchema>` for TypeScript types

**Error Handling:**
- `TRPCError` with codes: `BAD_REQUEST`, `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR`
- Custom error messages for user-facing feedback
- Server-side logging for debugging

**Changes for Iteration 1:**
- Update `createReflectionSchema` to remove `hasDate`, `dreamDate`
- Update `reflection.create` mutation to handle 4-question format
- Simplify AI prompt construction

---

## Frontend

**Decision:** React 18 with TypeScript

**UI Component Library:** Custom Glass Design System

**Styling:** Tailwind CSS 3.x + CSS-in-JS (styled-jsx)

**Rationale:**
1. **React 18:** Already in use, hooks-based patterns established
2. **Glass Components:** Consistent design language (GlassCard, GlowButton, GlassInput)
   - Soft/glossy/sharp aesthetic from plan-3 vision
   - Backdrop blur, subtle glows, restrained animations
3. **Tailwind CSS:** Utility-first styling, responsive design built-in
   - Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
   - Custom CSS variables: `--space-xl`, `--mirror-purple`, etc.
4. **styled-jsx:** Component-scoped styles for complex animations
   - Used in MirrorExperience for cosmic particles, tone-based animations

**Component Architecture:**
```
components/
├── ui/
│   ├── glass/
│   │   ├── GlassCard.tsx         # Main container component
│   │   ├── GlowButton.tsx        # Primary action button
│   │   ├── GlassInput.tsx        # Text input/textarea
│   │   ├── CosmicLoader.tsx      # Loading states
│   │   └── ProgressOrbs.tsx      # Multi-step indicator (REMOVE in iteration 1)
│   └── toast/
│       └── useToast.tsx          # Notification system
└── dashboard/
    ├── cards/                    # Dashboard feature cards
    └── shared/                   # Shared dashboard components
```

**State Management:**
- **React hooks** - `useState`, `useEffect` for local state
- **React Query (via tRPC)** - Server state, caching, optimistic updates
- **No global state library** - App complexity doesn't warrant Redux/Zustand

**Animation Library:** Framer Motion

**Animation Strategy for Iteration 1:**
- **Keep:** Smooth page transitions (200-300ms)
- **Remove:** Pop/scale animations on buttons (aligns with restraint principle)
- **Keep:** Ambient cosmic particles (subtle, not distracting)
- **Keep:** Tone-based background animations (fusion-breath, gentle-star, intense-swirl)

**Responsive Design:**
- Mobile-first approach
- Breakpoints tested: 375px (iPhone SE), 390px (iPhone 12), 768px (iPad), 1440px (Desktop)
- Touch-friendly targets (min 44px tap area)
- Smooth scrolling on iOS (`-webkit-overflow-scrolling: touch`)

---

## External Integrations

### Anthropic Claude API

**Purpose:** AI reflection generation (core feature)

**Library:** `@anthropic-ai/sdk`

**Model:** `claude-sonnet-4-5-20250929` (latest Sonnet 4.5)

**Implementation:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}
```

**Lazy initialization pattern** - Client created on first use (good practice for serverless)

**Premium vs Standard:**
- **Premium users:** Extended thinking enabled, longer context window
- **Standard users:** Base model, faster responses
- **Tier detection:** `ctx.user.tier === 'premium'`

**Prompt Structure (Iteration 1):**
```typescript
const userPrompt = `${intro}**My dream:** ${dream}

**My plan:** ${plan}

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see...`;
```

**Key Changes:**
- **Remove:** `hasDate` and `dreamDate` from prompt
- **Optional Enhancement:** Add dream object context (title, target_date) for richer responses

**Error Handling:**
- Rate limits: Retry with exponential backoff
- API errors: Log and return user-friendly message
- Timeout: 30-second limit, show "Taking longer than expected" message

**API Key Location:** `.env.local` (not committed to Git)

---

## Development Tools

### Testing

**Framework:** Manual testing (no automated tests yet)

**Coverage Target:** N/A (iteration 1 focuses on core functionality)

**Strategy:**
- Manual testing checklist (20+ scenarios)
- Mobile device testing (real devices preferred)
- End-to-end flow validation
- Database record verification

**Future Testing Stack (Post-MVP):**
- **Playwright:** E2E testing
- **Vitest:** Unit testing (faster than Jest for Vite projects)
- **Testing Library:** React component testing
- **MSW:** API mocking

### Code Quality

**Linter:** ESLint (Next.js config)

**Formatter:** Prettier

**Type Checking:** TypeScript strict mode

**Configuration:**
- `.eslintrc.json` - Next.js recommended rules
- `.prettierrc` - 2-space indent, single quotes, trailing commas
- `tsconfig.json` - `strict: true`, `noImplicitAny: true`

**Pre-commit Hooks:** Not configured (consider adding in post-MVP)

### Build & Deploy

**Build Tool:** Next.js built-in build system (Turbopack in dev, Webpack for production)

**Development Server:** `npm run dev` (port 3000)

**Build Command:** `npm run build`

**Deployment Target:** Local development only (no production deployment for plan-4)

**CI/CD:** Not configured (deferred to post-plan-4)

---

## Environment Variables

**Required Variables:**

```bash
# Supabase (Local Instance)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Where to Get Them:**
- **Supabase keys:** Run `npx supabase status` (shows local instance credentials)
- **Anthropic API key:** https://console.anthropic.com (requires account with credits)
- **App URL:** Local development uses `localhost:3000`

**Environment File:** `.env.local` (gitignored, must be created manually)

**Validation:** App checks for required env vars on startup, throws clear errors if missing

---

## Dependencies Overview

**Key Packages with Versions:**

```json
{
  "@anthropic-ai/sdk": "^0.20.0",
  "@supabase/supabase-js": "^2.39.0",
  "@trpc/server": "^10.45.0",
  "@trpc/client": "^10.45.0",
  "@trpc/react-query": "^10.45.0",
  "@tanstack/react-query": "^5.17.0",
  "next": "^14.1.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.0",
  "zod": "^3.22.0",
  "framer-motion": "^11.0.0",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.314.0"
}
```

**Purpose of Each:**
- **Anthropic SDK:** Claude API integration
- **Supabase:** Database client and auth
- **tRPC:** Type-safe API layer
- **React Query:** Data fetching and caching
- **Next.js:** Framework and routing
- **Zod:** Schema validation
- **Framer Motion:** Animations (restrained usage)
- **Tailwind CSS:** Utility-first styling
- **Lucide React:** Icon library (minimal usage)

**Installation:** `npm install` (all dependencies in `package.json`)

---

## Performance Targets

**First Contentful Paint:** < 1.5s (local development)

**Bundle Size:** < 500KB (main bundle, gzipped)

**API Response Time:** < 3s for reflection generation (Claude API call)

**Lighthouse Score Goals (Post-MVP):**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

**Current Bottlenecks:**
- Anthropic API latency (2-5s depending on response length)
- Glass component animations (minimal impact, acceptable)

**Optimization Strategy:**
- **Defer:** Advanced optimizations to post-plan-4
- **Focus:** Functional correctness first, speed second
- **Monitor:** Network tab during testing for slow queries

---

## Security Considerations

**1. API Key Protection**
- **How addressed:** Environment variables (never committed to Git)
- **Pattern:** Server-side only (never exposed to client)
- **Validation:** App throws error if missing

**2. User Authentication**
- **How addressed:** Supabase Auth with JWT tokens
- **Pattern:** HTTP-only cookies, secure session storage
- **Row-level security:** Database policies enforce user isolation

**3. Input Validation**
- **How addressed:** Zod schemas on all tRPC inputs
- **Pattern:** Validate on server (never trust client)
- **Database constraints:** CHECK constraints as second layer

**4. SQL Injection Prevention**
- **How addressed:** Supabase client uses parameterized queries
- **Pattern:** No raw SQL in application code
- **ORM safety:** Supabase handles escaping

**5. XSS Protection**
- **How addressed:** React escapes user input by default
- **Pattern:** No `dangerouslySetInnerHTML` except for trusted AI responses
- **Sanitization:** AI responses rendered in controlled components

**6. Rate Limiting**
- **How addressed:** Usage limits per tier (middleware)
- **Pattern:** Check `user.tier` before expensive operations
- **Creator bypass:** Ahiya's account bypasses limits (for testing)

**7. Error Message Safety**
- **How addressed:** Generic messages to users, detailed logs server-side
- **Pattern:** Don't leak stack traces or database errors
- **Logging:** Console.log for development, structured logging for production

---

**Tech Stack Status:** STABLE AND PROVEN
**Changes for Iteration 1:** Schema updates only (no framework changes)
**Risk Level:** LOW (building on working foundation)
**Next Step:** Define code patterns for builders
