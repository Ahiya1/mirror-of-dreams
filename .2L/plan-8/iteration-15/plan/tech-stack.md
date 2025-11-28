# Technology Stack

## Core Framework
**Decision:** Next.js 14 App Router (Current Version)

**Rationale:**
- Already in use throughout the application
- App Router provides excellent layout support for navigation fixes
- Server Components reduce bundle size for dashboard-heavy app
- No breaking changes required - working within existing architecture
- Team familiarity with React ecosystem

**Alternatives Considered:**
- None - this is a bug fix iteration, not a framework migration

## Database
**Decision:** PostgreSQL via Supabase (Current)

**Rationale:**
- Existing schema well-defined for evolution_reports and visualizations
- UUID primary keys and array columns (UUID[]) perfect for our use case
- Service role key allows direct seed script writes bypassing API
- No schema changes needed for this iteration

**Schema Strategy:**
- Use existing `evolution_reports` table with `analysis` column (NOT `evolution` - migration is source of truth)
- Use existing `visualizations` table with `narrative` column
- Direct INSERT via Supabase client in seed script
- Foreign keys properly maintained (user_id, dream_id)

**CRITICAL SCHEMA NOTE:**
- Migration defines column as `analysis` TEXT NOT NULL
- Router code incorrectly uses `evolution` column (BUG - documented separately)
- Seed script MUST use `analysis` to match actual database schema

## Authentication
**Decision:** Supabase Auth (Current)

**Rationale:**
- Demo user already exists (alex.chen.demo@example.com)
- No auth changes needed for this iteration
- Demo banner conditional on `user.isDemo` flag

**Implementation Notes:**
- Demo user ID fetching already working in seed script
- No changes to auth flow required

## API Layer
**Decision:** tRPC (Current)

**Rationale:**
- Type-safe API calls for production usage
- NOT used for demo data generation (seed script writes directly to DB)
- No new tRPC endpoints needed this iteration

**Implementation Notes:**
- Seed script bypasses tRPC routers
- Uses Supabase service role client for direct database writes
- Avoids API rate limits and timeouts

## Frontend

**UI Framework:** React 18 with Next.js 14

**UI Component Library:** Custom components (GlassCard, GlowButton, etc.)

**Styling:** Tailwind CSS + CSS Modules + Global CSS

**Rationale:**
- CSS Variables in variables.css provide centralized design tokens
- Tailwind utility classes for rapid styling
- CSS Modules for component-scoped styles (DashboardGrid.module.css)
- Global CSS for shared utilities (.pt-nav class)
- Mix of approaches is working well - no need to consolidate this iteration

## External Integrations

### Anthropic Claude Sonnet 4.5
**Purpose:** Generate evolution report and visualization content for demo user
**Library:** @anthropic-ai/sdk
**Implementation:**
- Model: claude-sonnet-4-5-20250929
- Extended thinking enabled (5000 token budget for deep analysis)
- Temperature: 1 for creative narratives
- Max tokens: 4000 (evolution), 3000 (visualization)
- Used in seed script via generateAIResponse pattern (already exists)

**Content Generation Strategy:**
- Evolution report: 800-1200 word analysis of 4 reflections
- Visualization: 400-600 word achievement-style narrative
- Claude analyzes reflection content and generates insights
- No API calls from app - all generation in seed script

### Supabase
**Purpose:** Database access for demo data seeding
**Library:** @supabase/supabase-js
**Implementation:**
- Service role key for admin-level writes
- Direct table insertion bypassing Row Level Security
- UUID array serialization handled automatically
- Already configured in seed script

## Development Tools

### Testing
- **Framework:** Manual testing (no automated tests this iteration)
- **Coverage target:** N/A (bug fix iteration)
- **Strategy:** Test all 10 authenticated pages manually with demo banner visible

### Code Quality
- **Linter:** ESLint (current config)
- **Formatter:** Prettier (current config)
- **Type Checking:** TypeScript strict mode

### Build & Deploy
- **Build tool:** Next.js built-in (Turbopack for dev, webpack for prod)
- **Deployment target:** Vercel
- **CI/CD:** Auto-deploy on push to main branch

## Environment Variables

All required env vars already configured - no additions needed:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key for client-side
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for seed script
- `ANTHROPIC_API_KEY`: Claude API access for content generation

## Dependencies Overview

Key packages (no new dependencies needed):

- `next`: 14.x - App Router framework
- `react`: 18.x - UI library
- `@supabase/supabase-js`: ^2.x - Database client
- `@anthropic-ai/sdk`: ^0.x - AI content generation
- `tailwindcss`: ^3.x - Utility-first CSS
- `typescript`: ^5.x - Type safety
- `tsx`: ^4.x - TypeScript executor for seed scripts

## Performance Targets

- Dashboard First Contentful Paint: < 500ms (all content visible)
- Dashboard animation fallback: 2 seconds max
- Navigation layout shift: 0ms (CSS variables prevent FOUC)
- Seed script execution: < 3 minutes (including AI generation)

## Security Considerations

- **Service role key security:** Only used in seed script (not exposed to client)
- **Demo user isolation:** RLS policies prevent demo user affecting real users
- **Content sanitization:** Evolution/visualization content from Claude is text-only, no XSS risk
- **CSS injection prevention:** All CSS variables static or measured from DOM, no user input

## Animation Strategy

**Decision:** Single animation system (useStaggerAnimation hook) with CSS fallback

**Rationale:**
- Current triple animation conflict (useStaggerAnimation + DashboardCard animation + CSS animations) causes dashboard to appear empty
- Inline styles from JavaScript override CSS animations
- IntersectionObserver with fallback timeout provides reliability

**Implementation:**
- Remove DashboardCard internal animation (non-functional - missing CSS class)
- Remove CSS grid item animations (conflicting with inline styles)
- Keep useStaggerAnimation hook with enhancements:
  - Lower threshold: 0.01 (trigger at 1% visible instead of 10%)
  - Larger rootMargin: 100px (start animation before viewport)
  - Add 2-second fallback timeout (force visibility if IntersectionObserver fails)

## CSS Variable Architecture

**Decision:** Static demo banner height with calculated total header height

**Rationale:**
- DemoBanner has fixed content and styling (py-3 padding = 44px total)
- Static CSS variable is simpler than dynamic measurement
- Single calculation point for total header height reduces complexity

**Implementation:**
```css
/* variables.css */
--nav-height: clamp(60px, 8vh, 80px);  /* Existing - dynamic override via JS */
--demo-banner-height: 44px;            /* NEW - Static */
--total-header-height: calc(var(--nav-height) + var(--demo-banner-height)); /* NEW - Calculated */
```

**Z-Index Strategy:**
```css
--z-navigation: 100;      /* Existing */
--z-demo-banner: 110;     /* NEW - Above navigation */
```

## Grid Layout Strategy

**Decision:** Flexible 3-row grid instead of fixed 2-row

**Rationale:**
- Current 2x2 grid only has 4 slots but 6 cards need to render
- Items 5 and 6 overflow outside grid bounds
- Changing to 3 rows with `auto` height accommodates all cards

**Implementation:**
```css
/* DashboardGrid.module.css */
grid-template-columns: repeat(2, 1fr);  /* Keep 2 columns */
grid-template-rows: repeat(3, auto);    /* Change from repeat(2, 1fr) */
```

## Content Generation Approach

**Decision:** Claude Code generates all demo content directly in seed script

**Rationale:**
- Avoids API rate limits from calling app endpoints
- Full control over content quality via extended thinking
- No timeout issues from long-running API calls
- Pattern already established with reflection generation

**Implementation:**
- Create `generateEvolutionReport()` function in seed script
- Create `generateVisualization()` function in seed script
- Both use Anthropic API directly (not app's tRPC routers)
- Insert results directly into database with proper foreign keys

---

**Tech Stack Status:** APPROVED
**Ready for:** Builder Implementation
**Focus:** Use existing stack, no new dependencies, fix what's broken
