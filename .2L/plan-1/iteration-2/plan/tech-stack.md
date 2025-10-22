# Technology Stack - Iteration 2

## Core Framework

**Decision:** Next.js 14 (App Router) + TypeScript 5.x

**Rationale:**
- Already established in Iteration 1 - no migration needed
- App Router provides excellent file-based routing for dream pages
- Server Components reduce bundle size for dreams dashboard
- Excellent TypeScript support for type-safe dream schemas
- Built-in API routes work seamlessly with tRPC

**Alternatives Considered:**
- Remix: Not chosen - would require complete rewrite, no benefit for this iteration
- SvelteKit: Not chosen - team already proficient with React/Next.js

**Version:** Next.js 14.2.x (current), TypeScript 5.3+

---

## Database

**Decision:** Supabase PostgreSQL + Direct SQL (No ORM)

**Rationale:**
- Already using Supabase in production from Iteration 1
- PostgreSQL GENERATED columns ideal for auto-calculating days_left
- Direct SQL via Supabase client gives full control for complex migrations
- No Prisma/ORM overhead - simpler for this small schema extension
- Supabase client handles connection pooling and security

**Schema Strategy:**

### New Dreams Table
```sql
CREATE TABLE dreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_date DATE,
  days_left INTEGER GENERATED ALWAYS AS (target_date - CURRENT_DATE) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'archived', 'released')),
  category TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  achieved_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);
```

**Key Design Decisions:**
- `days_left` as GENERATED ALWAYS STORED ensures always current without cron jobs
- `status` enum covers full dream lifecycle (not just active/inactive)
- `category` as TEXT (not enum) allows user-defined categories in future
- `priority` as INTEGER for flexible sorting (0 = lowest)
- Multiple timestamp fields track lifecycle events

### Reflections Table Extension
```sql
ALTER TABLE reflections
ADD COLUMN dream_id UUID REFERENCES dreams(id) ON DELETE SET NULL;
```

**Key Design Decisions:**
- `ON DELETE SET NULL` preserves reflections if dream deleted (user decision)
- Initially nullable for migration safety, made NOT NULL after data migration
- Index on dream_id for fast "reflections for this dream" queries

**Migration Strategy:**
1. Add dreams table
2. Create default dream for each existing user: "My Journey"
3. Add dream_id column to reflections (nullable)
4. Update all reflections to link to user's default dream
5. Make dream_id NOT NULL
6. Add foreign key constraint

**Rollback Strategy:**
- Keep migration SQL and rollback SQL in same file
- Test on database copy before production
- Atomic transaction for all migration steps

---

## API Layer

**Decision:** tRPC v10 + Next.js API Routes

**Rationale:**
- Already established pattern from Iteration 1
- End-to-end type safety from database to UI
- No code generation needed (unlike GraphQL)
- Excellent developer experience with autocomplete
- Built-in error handling with TRPCError codes

**Implementation Notes:**

### Dreams Router Structure
```typescript
// server/trpc/routers/dreams.ts
export const dreamsRouter = router({
  create: protectedProcedure.input(createDreamSchema).mutation(...),
  list: protectedProcedure.input(listDreamsSchema).query(...),
  get: protectedProcedure.input(dreamIdSchema).query(...),
  update: protectedProcedure.input(updateDreamSchema).mutation(...),
  updateStatus: protectedProcedure.input(updateStatusSchema).mutation(...),
  delete: protectedProcedure.input(dreamIdSchema).mutation(...),
});
```

**Tier Limits Enforcement Pattern:**
```typescript
// In create procedure, before insert
const { data: dreamCount } = await supabase
  .from('dreams')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', ctx.user.id)
  .eq('status', 'active');

const limits = { free: 2, essential: 5, optimal: 7, premium: Infinity };
const limit = ctx.user.isAdmin ? Infinity : limits[ctx.user.tier];

if ((dreamCount?.count || 0) >= limit) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: `You've reached your ${ctx.user.tier} tier limit of ${limit} dreams. Upgrade to create more!`
  });
}
```

**Error Handling Pattern:**
- Use specific TRPCError codes: FORBIDDEN (tier limits), NOT_FOUND (dream doesn't exist), BAD_REQUEST (validation)
- Include actionable messages with upgrade CTAs
- Log all errors for monitoring

---

## Frontend Framework

**Decision:** React 18 (Server + Client Components)

**Rationale:**
- Next.js 14 requires React 18
- Server Components reduce JavaScript sent to client (important for mobile)
- Client Components only where needed (forms, interactive UI)
- Excellent ecosystem for UI components

**UI Component Library:** None (Custom Components)

**Rationale:**
- Existing custom component library from Iteration 1 (CosmicBackground, DashboardCard)
- Full control over purple/blue rebrand styling
- No bloat from unused components
- Consistent with Mirror of Dreams aesthetic

**Styling:** CSS Modules + CSS Custom Properties

**Rationale:**
- CSS Modules prevent style conflicts (scoped by default)
- CSS Custom Properties in `styles/variables.css` for theme consistency
- Easy to update color palette globally for rebrand
- No Tailwind overhead for this small iteration

**New CSS Variables for Rebrand:**
```css
:root {
  /* Mystic Purple */
  --dream-purple-light: #A78BFA;
  --dream-purple-base: #8B5CF6;
  --dream-purple-dark: #7C3AED;
  --dream-purple-glow: rgba(139, 92, 246, 0.3);

  /* Deep Blue */
  --dream-blue-light: #3B82F6;
  --dream-blue-base: #1E3A8A;
  --dream-blue-dark: #1E40AF;
  --dream-blue-glow: rgba(30, 58, 138, 0.3);

  /* Gradients */
  --dream-gradient-primary: linear-gradient(135deg, var(--dream-purple-base), var(--dream-blue-base));
  --dream-gradient-glow: radial-gradient(circle, var(--dream-purple-glow), transparent);
}
```

---

## Authentication

**Decision:** JWT + Supabase Auth (Already Established)

**Rationale:**
- No changes needed from Iteration 1
- JWT stored in httpOnly cookie
- tRPC middleware extracts user from token
- Works seamlessly with new dreams feature

**Implementation Notes:**
- No changes to auth flow
- Admin user created via direct database insert (see migration)
- Admin user has `is_admin: true` and `is_creator: true` flags

---

## AI Integration

**Decision:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) via Anthropic SDK

**Rationale:**
- Upgraded from Claude Sonnet 4 (claude-sonnet-4-20250514)
- Latest model with improved reasoning and creativity
- Same API interface, minimal code changes
- Better reflection quality expected (to be validated)

**Implementation Changes:**

```typescript
// server/trpc/routers/reflection.ts (line 91)
// OLD:
model: 'claude-sonnet-4-20250514',

// NEW:
model: 'claude-sonnet-4-5-20250929',
```

**Cost Tracking:**
- Monitor token usage with new model
- Log all reflection generations with model version
- Track cost per reflection for analytics

**Testing Strategy:**
1. Generate 5 test reflections with new model
2. Compare quality to previous model (human review)
3. Check for formatting consistency
4. Verify thinking tokens work correctly for premium users
5. Monitor first 20 production reflections closely

**Rollback Plan:**
- Change model string back to claude-sonnet-4-20250514
- No other code changes needed
- Keep version in environment variable for easy rollback

---

## External Integrations

### Anthropic Claude API
**Purpose:** AI reflection generation
**Library:** @anthropic-ai/sdk v0.x
**Implementation:**
- Lazy initialization of client (only when needed)
- Environment variable: ANTHROPIC_API_KEY
- Error handling for API failures (graceful degradation)
- Rate limiting handled by Anthropic SDK

**Configuration:**
```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  temperature: 1,
  max_tokens: isPremium ? 6000 : 4000,
  thinking: isPremium ? { type: 'enabled', budget_tokens: 5000 } : undefined,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
});
```

### Supabase Client
**Purpose:** Database access, file storage (future)
**Library:** @supabase/supabase-js v2.x
**Implementation:**
- Singleton client in server/lib/supabase.ts
- Environment variables: SUPABASE_URL, SUPABASE_ANON_KEY
- RLS policies enforce user-level security

**Configuration:**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

---

## Development Tools

### Testing
**Framework:** Manual testing + Browser DevTools
**Coverage target:** Not applicable for this iteration
**Strategy:**
- Builder self-testing (each builder tests their output)
- Integration testing (test full user journeys)
- Mobile device testing (real iOS/Android devices)

**No automated testing for MVP - focus on speed to market.**

### Code Quality
**Linter:** ESLint (Next.js default config)
**Formatter:** Prettier (default config)
**Type Checking:** TypeScript strict mode

**Configuration:**
- Use existing .eslintrc from Iteration 1
- Run `npm run lint` before commit
- TypeScript errors block build (as intended)

### Build & Deploy
**Build tool:** Next.js built-in (webpack under the hood)
**Deployment target:** Vercel (or similar Next.js host)
**CI/CD:** Not applicable for this iteration (manual deployment)

**Build Commands:**
```bash
npm run build    # Production build
npm run start    # Production server
npm run dev      # Development server
```

---

## Environment Variables

Required environment variables for production:

- `ANTHROPIC_API_KEY`: Claude API key (Anthropic dashboard)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key (public)
- `JWT_SECRET`: Secret for signing JWT tokens (generate with `openssl rand -hex 32`)
- `NODE_ENV`: 'production' for production, 'development' for local
- `NEXT_PUBLIC_API_URL`: Full URL of API endpoint (for client-side tRPC)

**Example .env.local:**
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=generated_random_string_32_chars
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Dependencies Overview

**Core Dependencies (Already Installed):**
- `next`: 14.2.x - Framework
- `react`: 18.x - UI library
- `typescript`: 5.x - Type safety
- `@trpc/server`: 10.x - API layer
- `@trpc/client`: 10.x - Client for tRPC
- `@trpc/react-query`: 10.x - React hooks for tRPC
- `@tanstack/react-query`: 5.x - Data fetching
- `@anthropic-ai/sdk`: 0.x - Claude API
- `@supabase/supabase-js`: 2.x - Database client
- `zod`: 3.x - Schema validation
- `bcrypt`: 5.x - Password hashing
- `jsonwebtoken`: 9.x - JWT handling

**New Dependencies (None Required):**
All features can be built with existing dependencies.

**Dev Dependencies:**
- `@types/node`: Type definitions
- `@types/react`: Type definitions
- `@types/bcrypt`: Type definitions
- `@types/jsonwebtoken`: Type definitions
- `eslint`: Code quality
- `prettier`: Code formatting

---

## Performance Targets

- **First Contentful Paint:** < 1.5s (dashboard load)
- **Dream Creation:** < 500ms (API call)
- **Reflection Generation:** < 8s (Claude API + database)
- **Dashboard Load:** < 2s (with 10 dreams + 20 reflections)
- **Mobile Performance:** Same as desktop (no separate targets)

**Optimization Strategies:**
- Server Components for static dream list (no JavaScript)
- Client Components only for forms and interactive UI
- Lazy load DreamDetailPage (only when user clicks dream)
- Index on dream_id in reflections table (fast joins)
- Limit dashboard to 10 most recent dreams by default

---

## Security Considerations

### Tier Limits Enforcement
**Threat:** User creates more dreams than tier allows via concurrent requests
**Solution:**
- Database transaction with SELECT FOR UPDATE lock
- Check count immediately before insert
- Atomic increment of dream count

### Dream Ownership
**Threat:** User accesses/modifies another user's dreams
**Solution:**
- All tRPC procedures verify dream.user_id === ctx.user.id
- Supabase RLS policies as backup layer
- Return 403 FORBIDDEN if ownership check fails

### SQL Injection
**Threat:** User input in dream title/description contains malicious SQL
**Solution:**
- Supabase client uses parameterized queries by default
- Never concatenate user input into SQL strings
- Zod schema validation before database operations

### Admin User Security
**Threat:** Admin credentials compromised
**Solution:**
- Strong password required during setup (manual entry)
- Password hashed with bcrypt (cost factor 10)
- Admin user email stored in environment variable (not hardcoded)
- Regular password rotation policy

---

## Mobile-First Design Considerations

**Target:** 60%+ of traffic from mobile devices

### Responsive Breakpoints
```css
/* Mobile: < 768px (default) */
/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */
```

### Mobile-Specific UI Adaptations
1. **Dream Cards:** Stack vertically on mobile (no grid)
2. **Dream Creation Form:** Full-screen modal on mobile
3. **Dashboard:** Single column layout for all cards
4. **Navigation:** Hamburger menu on mobile
5. **Touch Targets:** Minimum 44x44px for all buttons

### Performance for Mobile
- Minimize JavaScript bundle size (use Server Components)
- Lazy load images (if any dream covers added later)
- Reduce CSS payload (only load dream-related styles on dream pages)
- Test on slow 3G connection (lighthouse mobile audit)

---

## Technology Decisions Summary

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Framework | Next.js | 14.2+ | Established, App Router |
| Database | PostgreSQL (Supabase) | Latest | GENERATED columns support |
| API | tRPC | 10.x | Type safety, no codegen |
| AI Model | Claude Sonnet 4.5 | 2025-09-29 | Latest model, better quality |
| Styling | CSS Modules + Variables | - | Full control, easy rebrand |
| Auth | JWT + Supabase Auth | - | Already working |
| Deployment | Vercel | - | Next.js optimized |

---

**Tech Stack Sign-Off:** All technology decisions support rapid iteration while maintaining production quality. No new major dependencies required. Total risk: LOW.
