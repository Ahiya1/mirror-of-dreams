# Technology Stack

## Core Framework
**Decision:** Next.js 14 (App Router)

**Rationale:**
- Already implemented with sophisticated App Router structure
- Server Components reduce bundle size for dashboard-heavy app
- Streaming and Suspense enable smooth loading states
- API Routes replaced by tRPC for type safety
- Vercel deployment is seamless
- React Server Actions not needed (using tRPC instead)

**Version:** Next.js ^14.2.0 with React ^18.3.1

**Alternatives Considered:**
- Remix: Rejected - Next.js already working well, no migration needed
- Vite + React: Rejected - Legacy files remain but Next.js is active framework

## Database
**Decision:** Supabase PostgreSQL with direct SQL client

**Rationale:**
- Supabase already configured with local development setup
- PostgreSQL supports advanced features (RLS, functions, triggers)
- Direct SQL queries via @supabase/supabase-js for complex operations
- Row Level Security enforces data isolation
- Supabase CLI enables local development with migrations
- No ORM overhead - type safety comes from tRPC schemas

**Version:** @supabase/supabase-js ^2.50.4

**Schema Strategy:**
- Migrations in `/supabase/migrations/` directory
- Database functions for business logic (check_dream_limit, increment_usage_counter)
- Triggers for automatic updates (update_dream_reflection_count)
- RLS policies on all user tables
- Admin bypass via service_role key for admin operations

**Critical Fix Needed:**
- usage_tracking.month_year (TEXT) → usage_tracking.month (DATE)
- This fix is Priority 1 for Iteration 19

## Authentication
**Decision:** Custom JWT authentication with bcrypt password hashing

**Rationale:**
- Full control over auth flow
- JWT tokens stored in localStorage (acceptable for MVP)
- bcrypt with 12 rounds for password security
- 30-day token expiry with automatic refresh on signin
- is_admin and is_creator flags for role-based access
- No third-party auth dependencies

**Implementation Notes:**
- JWT_SECRET environment variable required (32+ characters)
- Tokens verified via middleware in tRPC context
- Password change requires current password confirmation
- Account deletion requires password re-entry

**Post-MVP Considerations:**
- Add httpOnly cookies instead of localStorage
- Implement refresh token mechanism
- Add "forgot password" flow
- Consider OAuth providers (Google, GitHub)

## API Layer
**Decision:** tRPC v11 with TanStack Query

**Rationale:**
- End-to-end type safety from server to client
- No code generation needed (unlike GraphQL)
- Integrated with TanStack Query for caching and optimistic updates
- Middleware for auth checks and error handling
- Subscriptions via WebSocket (not needed for MVP)
- Better DX than REST API

**Version:** @trpc/server ^11.6.0, @trpc/client ^11.6.0, @trpc/react-query ^11.6.0

**Router Structure:**
```
server/trpc/routers/
├── _app.ts          # Root router
├── auth.ts          # Auth (signup, signin, signout)
├── dreams.ts        # Dreams CRUD
├── reflections.ts   # Reflections list
├── reflection.ts    # AI reflection generation
├── evolution.ts     # Evolution reports
├── visualizations.ts # Visualizations
├── subscriptions.ts # Usage tracking
├── users.ts         # User profile
├── admin.ts         # Admin operations
└── artifact.ts      # Artifact storage (bonus)
```

**Context Configuration:**
```typescript
// server/trpc/context.ts
export async function createContext({ req }): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = token ? await verifyToken(token) : null;
  return { user, supabase };
}
```

## Frontend
**Decision:** React 18 with TypeScript and App Router

**UI Component Library:** Custom cosmic glass components (no external UI library)

**Styling:** Tailwind CSS v3.4.1 with custom design system

**Rationale:**
- Custom components give unique "cosmic glass" aesthetic
- Tailwind enables rapid styling without CSS files
- No shadcn/ui or other generic component libraries
- Framer Motion for smooth animations
- Design system is cohesive and production-ready

**Component Structure:**
```
components/
├── ui/glass/           # Reusable glass components
│   ├── GlassCard.tsx
│   ├── GlowButton.tsx
│   ├── GlassInput.tsx
│   ├── GradientText.tsx
│   ├── CosmicLoader.tsx
│   ├── ProgressOrbs.tsx
│   └── AnimatedBackground.tsx
├── dashboard/cards/    # Dashboard-specific cards
├── dreams/             # Dream components
├── portal/             # Landing portal components
└── reflections/        # Reflection components
```

**State Management:**
- TanStack Query for server state (tRPC integration)
- React useState/useReducer for local UI state
- No Zustand/Redux needed for MVP
- URL state for reflection flow (`?dreamId=X`, `?id=Y`)

**Form Handling:**
- React Hook Form (not explicitly in package.json - manual forms)
- Zod for validation schemas
- Forms are controlled components with error states

## External Integrations

### Anthropic Claude API
**Purpose:** Generate AI reflections, evolution reports, and visualizations
**Library:** @anthropic-ai/sdk ^0.52.0
**Implementation:**
- Model: Claude Sonnet 4 (claude-sonnet-4-5-20250929)
- Extended thinking enabled for Optimal/Premium tiers (10,000 token budget)
- Token usage tracking (input, output, thinking tokens)
- Cost calculation per operation
- API usage logged to api_usage_log table
- Rate limiting handled by SDK
- Timeout: 60 seconds for long-form generation

**Environment Variable:** `ANTHROPIC_API_KEY`

**Usage Patterns:**
```typescript
// Reflection generation
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  messages: [{ role: 'user', content: prompt }],
  thinking: { type: 'enabled', budget_tokens: thinkingBudget }
});

// Token tracking
const usage = {
  input_tokens: message.usage.input_tokens,
  output_tokens: message.usage.output_tokens,
  thinking_tokens: message.usage.thinking_tokens || 0
};
```

### Supabase Cloud (Production) / Local (Development)
**Purpose:** PostgreSQL database, future file storage
**Implementation:**
- Local development: Docker via Supabase CLI (http://127.0.0.1:54321)
- Production: Supabase Cloud (not deployed yet)
- Connection via @supabase/supabase-js
- Service role key for admin operations
- Anon key for RLS-protected user operations

**Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development Tools

### Testing
**Framework:** Manual testing for MVP (no automated tests yet)
**Coverage target:** Core user flows (auth, dreams, reflections)
**Strategy:**
- Manual testing of "Sarah's Journey" (vision.md)
- Builder testing reports document results
- Console error monitoring
- TypeScript compilation as first line of defense

**Post-MVP:**
- Add Vitest for unit tests
- Add Playwright for E2E tests
- Add React Testing Library for component tests

### Code Quality
**Linter:** ESLint (Next.js default config)
**Formatter:** Prettier (implicit via IDE)
**Type Checking:** TypeScript strict mode enabled

**TypeScript Config:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/server/*": ["./server/*"]
    }
  }
}
```

### Build & Deploy
**Build tool:** Next.js built-in (Turbopack in development, Webpack in production)
**Deployment target:** Vercel (not deployed yet in Iteration 19)
**CI/CD:** Manual deployment for MVP

**Build Commands:**
```bash
npm run dev      # Development with hot reload
npm run build    # Production build
npm run start    # Production server (after build)
npm run lint     # ESLint check
```

## Environment Variables

All required environment variables for Iteration 19:

- `SUPABASE_URL`: Local instance URL (http://127.0.0.1:54321)
- `SUPABASE_ANON_KEY`: Public anon key from `supabase status`
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key from `supabase status`
- `JWT_SECRET`: Random 32+ character string for JWT signing
- `ANTHROPIC_API_KEY`: Claude API key from console.anthropic.com
- `NODE_ENV`: development

**Optional (not needed for Iteration 19):**
- `NEXT_PUBLIC_SUPABASE_URL`: If frontend needs direct Supabase client
- `STRIPE_SECRET_KEY`: For payment integration (out of scope)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD`: For email notifications (out of scope)

**Generation Commands:**
```bash
# Generate JWT_SECRET:
openssl rand -base64 32

# Get Supabase keys:
supabase status
```

## Dependencies Overview

Key packages with versions and purposes:

**Core Framework:**
- `next@^14.2.0` - React framework with App Router
- `react@^18.3.1` - UI library
- `react-dom@^18.3.1` - React DOM rendering
- `typescript@^5.9.3` - Type safety

**Backend:**
- `@trpc/server@^11.6.0` - tRPC server
- `@trpc/client@^11.6.0` - tRPC client
- `@trpc/react-query@^11.6.0` - React integration
- `@tanstack/react-query@^5.90.5` - Query caching
- `zod@^3.25.76` - Schema validation
- `superjson@^2.2.2` - Serialization for tRPC

**Database:**
- `@supabase/supabase-js@^2.50.4` - Supabase client

**Auth:**
- `bcryptjs@^3.0.2` - Password hashing
- `jsonwebtoken@^9.0.2` - JWT token generation/verification

**AI:**
- `@anthropic-ai/sdk@^0.52.0` - Claude API client

**UI:**
- `tailwindcss@^3.4.1` - Utility-first CSS
- `framer-motion@^11.18.2` - Animation library
- `lucide-react@^0.546.0` - Icon library
- `clsx@^2.1.0` - Conditional class names
- `tailwind-merge@^2.2.1` - Merge Tailwind classes

**Utilities:**
- `dotenv@^17.2.3` - Environment variables
- `cors@^2.8.5` - CORS handling

**Development:**
- `@types/node@^24.9.1` - Node.js types
- `@types/react@^18.3.26` - React types
- `@types/bcryptjs@^2.4.6` - bcryptjs types
- `@types/jsonwebtoken@^9.0.10` - JWT types

## Performance Targets

**For MVP (not strictly enforced, but goals):**
- First Contentful Paint: < 2s
- Dashboard load time: < 1s
- Reflection creation: < 30s (AI generation)
- Evolution report generation: < 45s (AI generation with extended thinking)
- Client bundle size: < 500KB (main bundle)

**Current Performance:**
- Next.js App Router enables streaming and Suspense
- Code splitting via dynamic imports
- tRPC queries cached by TanStack Query
- CosmicLoader provides smooth loading states

**Optimization Strategy:**
- Use React Server Components for static content
- Lazy load heavy components (MirrorExperience)
- Cache tRPC queries with staleTime
- Optimize images with Next.js Image component (if images added)

## Security Considerations

**Authentication:**
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire after 30 days
- Tokens stored in localStorage (acceptable for MVP, move to httpOnly cookies post-MVP)
- Admin operations require is_admin flag

**Database:**
- Row Level Security on all user tables
- Users can only access their own data
- Admin bypasses RLS via service_role key
- SQL injection prevented by Supabase client parameterization

**API:**
- tRPC middleware checks auth on protected routes
- Rate limiting via Anthropic SDK (not custom implemented)
- Input validation via Zod schemas
- CORS configured for same-origin

**Environment Variables:**
- Never expose service_role key in frontend
- API keys in .env.local (gitignored)
- Production secrets in Vercel environment variables

**Tier Limits:**
- Enforced via database functions (check_dream_limit, check_reflection_limit)
- Monthly usage reset via current_month_year field
- Admin/creator users have unlimited access

## Critical Notes for Builders

1. **Database Migration Required:** Iteration 19 must fix usage_tracking schema before evolution/visualizations work
2. **Tier System:** Vision says 2 tiers (Free/Optimal), code has 4 (free/essential/optimal/premium) - align in this iteration
3. **Reflection Limits:** Vision says Free=4/month, code says Free=1/month - fix in tier constants
4. **No Rebuild Needed:** 80% of code works - this is surgical fixes only
5. **Local Development Only:** No deployment in Iteration 19, all testing local
6. **Admin User:** Must be created with is_admin=true, is_creator=true, tier=premium
7. **Console Errors:** Monitor and fix all TypeScript and runtime errors
8. **Dashboard Refactoring:** Remove useDashboard hook complexity, let cards fetch independently

---

**Tech Stack Status:** DEFINED
**Ready for:** Builder implementation
**Complexity:** LOW-MEDIUM (mostly configuration and fixes)
**Innovation:** Custom cosmic glass UI is unique strength
