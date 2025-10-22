# Explorer 1 Report: Current Architecture & Migration Scope Analysis

## Executive Summary

**Current Stack:** Vite/React frontend with Express backend, fully operational JavaScript codebase with Supabase PostgreSQL database, Anthropic Claude AI integration, and comprehensive authentication/subscription system.

**Migration Complexity:** **MEDIUM** - Well-structured codebase with clear separation of concerns, but 13 API endpoints, complex component hierarchy with custom hooks, and existing database schema require careful planning. No TypeScript yet, but modern React patterns (hooks, functional components) will ease transition.

**Key Finding:** The codebase is production-ready and feature-complete. Migration should be incremental to avoid breaking existing functionality. The gifting feature (api/gifting.js) should be DELETED during migration as requested.

---

## Current Architecture Analysis

### Technology Stack Inventory

**Frontend (Vite + React 18.3.1)**
- Build tool: Vite 4.5.14 with React plugin
- React Router DOM 6.30.1 for client-side routing
- Proxy config for API routes: `/api/*` → `http://localhost:3001`
- Port: 3002 (frontend dev server)
- Entry point: `src/main.jsx`
- Static assets: `public/` directory

**Backend (Express 4.18.2)**
- Development server: `backend-server.js`
- Port: 3000/3001 (configurable via BACKEND_PORT)
- 13 API route handlers in `api/` directory
- CORS enabled
- Middleware: JSON body parser, CORS, logging

**API Endpoints (13 total)**
```javascript
[
  'auth',          // ✅ KEEP - Authentication (signup/signin/verify-token)
  'users',         // ✅ KEEP - User profile management
  'reflection',    // ✅ KEEP - AI reflection generation
  'reflections',   // ✅ KEEP - Reflection CRUD operations
  'subscriptions', // ✅ KEEP - Subscription management
  'payment',       // ✅ KEEP - Payment processing
  'gifting',       // ❌ DELETE - Gift subscriptions feature (deprecated)
  'evolution',     // ✅ KEEP - Evolution report generation
  'admin',         // ✅ KEEP - Admin operations
  'creator-auth',  // ✅ KEEP - Creator authentication
  'communication', // ✅ KEEP - Email/notifications
  'diagnostics',   // ✅ KEEP - System diagnostics
  'artifact'       // ✅ KEEP - Artifact generation
]
```

**Database (Supabase PostgreSQL)**
- Schema: `/supabase/migrations/20250121000000_initial_schema.sql`
- Tables:
  - `users` (with tier-based subscription system)
  - `reflections` (user reflections with AI responses)
  - `usage_tracking` (monthly usage by tier)
  - `evolution_reports` (growth analysis reports)
  - `subscription_gifts` (gifted subscriptions - DELETE THIS)
- Row-level security (RLS) enabled
- Functions: `reset_monthly_usage()`, `check_reflection_limit()`

**AI Integration**
- Anthropic Claude SDK 0.52.0
- Model: `claude-sonnet-4-20250514`
- Premium tier: Extended thinking with 5000 budget tokens
- Modular prompt system in `prompts/` directory

**Dependencies (Key)**
```json
{
  "runtime": {
    "@anthropic-ai/sdk": "^0.52.0",
    "@supabase/supabase-js": "^2.50.4",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2",
    "react": "^18.3.1",
    "react-router-dom": "^6.30.1"
  },
  "payments": {
    "stripe": "^18.3.0"
  },
  "infrastructure": {
    "@upstash/redis": "^1.35.0",
    "nodemailer": "^6.10.1",
    "cors": "^2.8.5"
  }
}
```

**Development Scripts**
```json
{
  "dev": "node dev-proxy.js",           // Proxy server
  "dev:react": "vite",                  // Frontend only
  "dev:backend": "node backend-server.js", // Backend only
  "dev:full": "concurrently ..."        // Both servers
}
```

---

## Application Structure

### Frontend Architecture

**Directory Structure**
```
src/
├── main.jsx                    # React Router setup, entry point
├── components/
│   ├── auth/                   # Authentication flows
│   │   ├── AuthApp.jsx
│   │   ├── SigninForm.jsx
│   │   └── SignupForm.jsx
│   ├── dashboard/              # User dashboard
│   │   ├── Dashboard.jsx       # Main dashboard component
│   │   ├── cards/              # Dashboard cards
│   │   │   ├── UsageCard.jsx
│   │   │   ├── ReflectionsCard.jsx
│   │   │   ├── EvolutionCard.jsx
│   │   │   └── SubscriptionCard.jsx
│   │   └── shared/             # Shared dashboard components
│   ├── mirror/                 # Reflection creation
│   │   ├── MirrorApp.jsx       # Route handler
│   │   ├── Questionnaire.jsx   # 5-question flow
│   │   ├── Output.jsx          # AI reflection display
│   │   ├── sections/           # Output sections
│   │   └── shared/             # Shared reflection components
│   ├── portal/                 # Landing page
│   │   ├── Portal.jsx
│   │   └── components/
│   └── shared/                 # Globally shared components
│       └── CosmicBackground.jsx
├── hooks/                      # Custom React hooks
│   ├── useAuth.js
│   ├── useDashboard.js
│   ├── useFormPersistence.js
│   ├── useStaggerAnimation.js
│   └── usePersonalizedGreeting.js
└── styles/                     # CSS files
    ├── auth.css
    ├── dashboard.css
    ├── mirror.css
    └── animations.css
```

**Routing (React Router 6.30.1)**
```javascript
Routes:
  /                        → Portal (landing page)
  /auth/*                  → AuthApp (signin/signup)
  /reflection              → MirrorApp (questionnaire)
  /reflection/output       → MirrorApp (output view)
  /dashboard               → Dashboard (user dashboard)
  /mirror/*                → Redirect to /reflection/* (legacy)
```

**Component Patterns**
- Functional components with hooks (no class components)
- Custom hooks for state management (`useAuth`, `useDashboard`)
- CSS-in-JS via `<style jsx>` in some components
- Separate CSS files for major sections
- PropTypes for type checking (not TypeScript yet)

### Backend Architecture

**Express Server Pattern**
```javascript
// backend-server.js
- Dynamic API route loading from api/ directory
- Each endpoint: app.all(`/api/${route}`, async (req, res) => {...})
- Error handling wrapper for each route
- Request logging middleware
```

**API Handler Pattern (Consistent Across All Endpoints)**
```javascript
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // OPTIONS preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Action-based routing
  const { action } = req.body || req.query;
  
  switch (action) {
    case 'action-1': return await handleAction1(req, res);
    case 'action-2': return await handleAction2(req, res);
    // ...
  }
}
```

**Authentication Pattern**
- JWT-based authentication (30-day expiry)
- `authenticateRequest(req)` utility in `api/auth.js`
- Exported and imported by other API handlers
- Bcrypt password hashing (12 rounds)

**Database Access Pattern**
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```
- Each API file creates its own Supabase client
- RLS policies handle authorization (currently disabled for service role)
- Manual user ID checks in API handlers

---

## Features Inventory

### Core Features (KEEP & MIGRATE)

#### 1. Authentication System (`api/auth.js`)
**Status:** ✅ FULLY FUNCTIONAL

**Actions:**
- `signup` - Email/password registration with bcrypt hashing
- `signin` - JWT token generation, monthly usage reset check
- `verify-token` - JWT verification with fresh user data fetch
- `get-user` - Full user profile retrieval
- `update-profile` - Name/language/timezone updates
- `change-password` - Password change with current password verification
- `delete-account` - Account deletion with password confirmation

**Database Operations:**
- User creation with tier assignment
- Monthly usage tracking (`current_month_year` comparison)
- Last sign-in timestamp updates

**Notes for Migration:**
- Well-structured with extensive logging
- Request ID tracking for debugging
- Should migrate to tRPC procedures with Zod validation
- JWT logic can move to Next.js middleware + server actions

#### 2. Reflection Generation (`api/reflection.js`)
**Status:** ✅ FULLY FUNCTIONAL

**Core Flow:**
1. Authenticate user
2. Check tier-based usage limits (free: 1, essential: 5, premium: 10)
3. Load modular prompts from `prompts/` directory
4. Call Claude API with tier-appropriate config:
   - Premium: Extended thinking (5000 tokens), max_tokens: 6000
   - Essential: Standard response, max_tokens: 4000
5. Store reflection in database
6. Update user usage counters
7. Check if evolution report should be triggered

**Modular Prompt System:**
```
prompts/
├── base_instructions.txt
├── gentle_clarity.txt
├── luminous_intensity.txt
├── sacred_fusion.txt
├── creator_context.txt
└── evolution_instructions.txt
```
- Assembled based on tone, premium status, creator status
- Date awareness injected (current date passed to Claude)

**Notes for Migration:**
- Should become tRPC mutation
- Prompt loading can stay file-based or move to database
- Claude SDK usage is fine for Next.js API routes
- Usage limit checks should be middleware/helper

#### 3. Reflection Management (`api/reflections.js`)
**Status:** ✅ FULLY FUNCTIONAL

**Actions:**
- `create` - Manual reflection creation (duplicate of reflection.js logic)
- `get-history` - Paginated reflection list with filters (tone, premium, search)
- `get-reflection` - Single reflection fetch (handles both GET/POST)
- `update-reflection` - Update title/tags
- `delete-reflection` - Delete with usage count decrement
- `check-usage` - Current usage status
- `search` - Full-text search across reflections
- `submit-feedback` - Rating (1-10) + optional text feedback

**Notes for Migration:**
- Should consolidate with `api/reflection.js` (avoid duplication)
- Search uses Supabase's `.ilike` - consider full-text search in PostgreSQL
- Feedback system is underutilized - consider removing or enhancing

#### 4. Dashboard (`src/components/dashboard/Dashboard.jsx`)
**Status:** ✅ FULLY FUNCTIONAL, COMPLEX COMPONENT

**Features:**
- Personalized greeting with dynamic call-to-actions
- 4-card grid layout:
  - Usage card (tier limits, monthly progress)
  - Recent reflections (last 5 with preview)
  - Evolution insights (report generation trigger)
  - Subscription card (tier status, upgrade CTA)
- Custom hooks:
  - `useDashboard` - Fetches usage/evolution/reflections
  - `usePersonalizedGreeting` - Dynamic messaging
  - `useStaggerAnimation` - Card animation sequencing
  - `useBreathingEffect` - Cosmic background animation
- Toast notifications
- User dropdown menu
- Auto-refresh on window focus

**Notes for Migration:**
- Complex component - consider splitting into smaller pieces
- Custom hooks are well-designed and reusable
- CSS-in-JS `<style jsx>` should migrate to Tailwind CSS or CSS modules
- Data fetching should use Next.js Server Components + React Query

#### 5. Subscription System (Stripe Integration)
**Status:** ✅ FUNCTIONAL (Payment/Subscriptions API)

**Components:**
- `api/payment.js` - Stripe checkout session creation
- `api/subscriptions.js` - Subscription management, webhook handling
- Webhook signature verification
- Tier-based pricing (essential: $4.99/mo, premium: $9.99/mo)

**Notes for Migration:**
- Stripe SDK v18.3.0 is compatible with Next.js
- Webhooks need proper endpoint in Next.js (`/api/webhooks/stripe`)
- Keep environment variable structure similar

---

### Features to DELETE During Migration

#### ❌ Gifting Feature (`api/gifting.js`)
**Reason for Deletion:** Requested by user, deprecated feature

**Scope of Deletion:**
1. **Backend:**
   - Delete `api/gifting.js` (763 lines)
   - Remove from `backend-server.js` API routes array
   
2. **Database:**
   - Drop `subscription_gifts` table from migration
   - Remove RLS policies for subscription_gifts
   
3. **Frontend:**
   - Check for references in `public/gifting/` directory (if exists)
   - Remove any gifting UI components
   - Remove navigation links to `/gifting`
   
4. **Environment Variables:**
   - Remove Stripe gift-specific price IDs if present

**Migration Strategy:**
- Delete before starting TypeScript conversion
- Verify no dependencies in other API routes
- Update database schema to remove table

---

### Features to FIX During Migration

#### 🔧 Missing `/reflections` Route
**Current Issue:** No frontend route exists to view past reflections

**Current State:**
- API endpoint exists: `GET /api/reflections?action=get-history`
- Dashboard shows last 5 reflections in `ReflectionsCard`
- Clicking a reflection might try to navigate to `/reflections/{id}` (not implemented)

**Fix Required:**
```javascript
// Add to routing in main.jsx or Next.js app/routes
/reflections              → ReflectionsList (new component)
/reflections/:id          → ReflectionDetail (new component)
```

**Implementation Plan:**
1. Create `ReflectionsList.jsx` component
   - Fetch paginated reflections from `api/reflections?action=get-history`
   - Display cards with title, date, tone badge, premium indicator
   - Search/filter UI
   - Pagination controls

2. Create `ReflectionDetail.jsx` component
   - Fetch single reflection from `api/reflections?action=get-reflection&id={id}`
   - Display full AI response
   - Show original questionnaire answers
   - Feedback submission form
   - Delete/edit controls

3. Update Dashboard `ReflectionsCard`
   - Change "View All" link to navigate to `/reflections`
   - Individual reflection cards navigate to `/reflections/{id}`

---

## Migration Complexity Assessment

### MEDIUM COMPLEXITY

**Reasons for Medium (Not High):**
- ✅ Modern React patterns (hooks, functional components)
- ✅ Well-organized file structure
- ✅ Consistent API patterns (action-based routing)
- ✅ No class components to convert
- ✅ Modular component design
- ✅ Existing environment variable management

**Reasons for Medium (Not Simple):**
- ⚠️ 13 API endpoints to migrate to tRPC
- ⚠️ Complex component hierarchy (30+ components)
- ⚠️ Custom hooks need type definitions
- ⚠️ No existing TypeScript - full codebase conversion
- ⚠️ CSS-in-JS mixed with CSS files (needs unification)
- ⚠️ Database schema already in production (migration risk)

### Migration Effort Breakdown

**Phase 1: TypeScript Foundation (Estimated: 2-3 days)**
- Install TypeScript + Next.js 14
- Configure `tsconfig.json`
- Migrate simple components first (shared components)
- Define core types (User, Reflection, Subscription)

**Phase 2: tRPC Setup (Estimated: 2 days)**
- Install tRPC + React Query
- Create tRPC router structure
- Define Zod schemas for validation
- Migrate 1-2 simple API endpoints (diagnostics, users)

**Phase 3: Core API Migration (Estimated: 5-7 days)**
- Migrate auth endpoints to tRPC procedures
- Migrate reflection endpoints
- Migrate subscriptions/payment
- Test each endpoint thoroughly

**Phase 4: Frontend Migration (Estimated: 7-10 days)**
- Convert components to TypeScript (.jsx → .tsx)
- Replace fetch calls with tRPC client
- Migrate routing to Next.js App Router
- Update CSS strategy (Tailwind or CSS modules)

**Phase 5: Database & Testing (Estimated: 3-4 days)**
- Verify Supabase integration with tRPC
- Update database schema (remove gifting)
- End-to-end testing
- Fix `/reflections` route

**Total Estimated Time:** 19-26 days (3-4 weeks for 1 developer)

---

## Critical Dependencies

### Database Schema (Supabase PostgreSQL)

**Users Table - Core Fields to Preserve:**
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
name TEXT NOT NULL
tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'essential', 'premium'))
subscription_status TEXT DEFAULT 'active'
reflection_count_this_month INTEGER DEFAULT 0
total_reflections INTEGER DEFAULT 0
current_month_year TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM')
is_creator BOOLEAN DEFAULT FALSE
is_admin BOOLEAN DEFAULT FALSE
language TEXT DEFAULT 'en'
```

**Reflections Table - All Fields Required:**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id) ON DELETE CASCADE
dream TEXT NOT NULL
plan TEXT NOT NULL
has_date TEXT CHECK (has_date IN ('yes', 'no'))
dream_date DATE
relationship TEXT NOT NULL
offering TEXT NOT NULL
ai_response TEXT NOT NULL
tone TEXT DEFAULT 'fusion' CHECK (tone IN ('gentle', 'intense', 'fusion'))
is_premium BOOLEAN DEFAULT FALSE
word_count INTEGER
title TEXT
tags TEXT[]
rating INTEGER CHECK (rating BETWEEN 1 AND 10)
user_feedback TEXT
```

**Migration Notes:**
- Keep RLS policies but ensure service role bypasses them
- `reset_monthly_usage()` function needs scheduled execution
- Consider adding indexes on frequently queried fields
- `subscription_gifts` table should be dropped

### Claude API Integration

**Current Configuration:**
```javascript
{
  model: "claude-sonnet-4-20250514",
  temperature: 1,
  max_tokens: isPremium ? 6000 : 4000,
  system: systemPrompt, // Assembled from multiple files
  messages: [{ role: "user", content: userPrompt }],
  thinking: isPremium ? {
    type: "enabled",
    budget_tokens: 5000
  } : undefined
}
```

**Migration Considerations:**
- Anthropic SDK works seamlessly with Next.js API routes
- Keep modular prompt system (file-based or move to DB)
- Environment variable: `ANTHROPIC_API_KEY`
- Premium thinking feature depends on tier detection
- Consider rate limiting for free tier

### Authentication Patterns

**Current JWT Flow:**
```javascript
// Signup/Signin
1. Hash password with bcrypt (12 rounds)
2. Create/verify user in Supabase
3. Generate JWT with 30-day expiry:
   {
     userId, email, tier, isCreator, isAdmin
   }
4. Return token + user data

// Token Verification
1. Extract Bearer token from Authorization header
2. Verify with jwt.verify(token, JWT_SECRET)
3. Fetch fresh user data from Supabase
4. Check monthly usage reset needed
5. Return updated user data
```

**Migration to Next.js:**
- Use NextAuth.js or custom JWT middleware
- Move JWT logic to server-side middleware
- Keep bcrypt for password hashing
- Consider httpOnly cookies instead of localStorage tokens
- Maintain 30-day session duration

---

## Patterns Identified

### Pattern 1: Action-Based API Routing
**Description:** All API endpoints use `action` parameter for sub-routing

**Use Case:** Single endpoint handles multiple related operations
```javascript
// Frontend
fetch('/api/auth', {
  method: 'POST',
  body: JSON.stringify({ action: 'signup', email, password, name })
})

// Backend
const { action } = req.body;
switch (action) {
  case 'signup': return handleSignup(req, res);
  case 'signin': return handleSignin(req, res);
}
```

**Recommendation for Migration:**
- Replace with tRPC procedures (type-safe, no string actions)
```typescript
// tRPC router
export const authRouter = router({
  signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {...}),
  signin: publicProcedure.input(signinSchema).mutation(async ({ input }) => {...}),
});

// Frontend (type-safe)
const { mutate: signup } = trpc.auth.signup.useMutation();
signup({ email, password, name });
```

### Pattern 2: Comprehensive Request Logging
**Description:** Request ID tracking for debugging

**Use Case:** Track requests across async operations
```javascript
const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
console.log(`🔍 [${requestId}] === AUTH REQUEST START ===`);
```

**Recommendation:**
- Keep pattern but improve with structured logging
- Consider Sentry or Datadog integration
- Use Next.js request context for ID tracking

### Pattern 3: Tier-Based Feature Gating
**Description:** Free/Essential/Premium tier checks throughout codebase

**Use Case:** Limit features based on subscription tier
```javascript
const TIER_LIMITS = { free: 1, essential: 5, premium: 10 };

if (!user.is_creator && !user.is_admin) {
  const canReflect = user.reflection_count_this_month < TIER_LIMITS[user.tier];
  if (!canReflect) {
    return res.status(403).json({ error: 'Reflection limit reached' });
  }
}
```

**Recommendation:**
- Create centralized tier configuration in tRPC context
- Use middleware for tier checks
```typescript
const premiumProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['premium', 'essential'].includes(ctx.user.tier)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Premium required' });
  }
  return next();
});
```

### Pattern 4: Monthly Usage Reset Logic
**Description:** Usage counters reset based on `current_month_year` comparison

**Use Case:** Automatic monthly quota resets without cron jobs
```javascript
function shouldResetUsage(user) {
  const currentMonthYear = new Date().toISOString().slice(0, 7); // "2025-10"
  return user.current_month_year !== currentMonthYear;
}

// On signin/verify-token
if (shouldResetUsage(user)) {
  await supabase.from('users').update({
    reflection_count_this_month: 0,
    current_month_year: currentMonthYear
  }).eq('id', user.id);
}
```

**Recommendation:**
- Keep pattern as it's stateless and reliable
- Add database function call for bulk resets (scheduled)
- Consider timezone handling for global users

---

## Integration Points

### External APIs

#### 1. Anthropic Claude API
**Purpose:** AI reflection generation
**Complexity:** LOW (well-documented SDK)
**Considerations:**
- Rate limiting for free tier (not implemented yet)
- Cost tracking for premium thinking tokens
- Error handling for API failures
- Fallback prompts if API down

**Example Call:**
```javascript
const resp = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  temperature: 1,
  max_tokens: 6000,
  system: systemPrompt,
  messages: [{ role: "user", content: userPrompt }],
  thinking: { type: "enabled", budget_tokens: 5000 }
});
```

#### 2. Stripe API
**Purpose:** Subscription payments and webhooks
**Complexity:** MEDIUM (webhook signature verification)
**Considerations:**
- Webhook endpoint security (signature verification)
- Idempotency for payment events
- Test mode vs. production mode
- Subscription lifecycle events (created, updated, canceled, expired)

**Webhook Handler Pattern:**
```javascript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

switch (event.type) {
  case 'customer.subscription.created':
    // Activate subscription
  case 'customer.subscription.deleted':
    // Cancel subscription
  case 'invoice.payment_failed':
    // Handle failed payment
}
```

#### 3. Supabase API
**Purpose:** Database operations
**Complexity:** LOW (official SDK)
**Considerations:**
- RLS policies (currently bypassed with service role)
- Connection pooling for serverless environments
- Real-time subscriptions (not used currently)
- Proper error handling for network failures

### Internal Integrations

#### Frontend ↔ Backend API
**Connection:** Vite proxy config (`/api/*` → `http://localhost:3001`)
```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_TARGET || 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

**Migration to Next.js:**
- No proxy needed (API routes in same app)
- tRPC client configured once, used everywhere
- Type safety across client/server boundary

#### Dashboard ↔ Multiple APIs
**Data Flow:**
```
Dashboard Component
  ↓
useDashboard hook
  ↓
Parallel API calls:
  - /api/reflections?action=get-history (last 5)
  - /api/reflections?action=check-usage
  - /api/evolution (check if report needed)
  ↓
State updates → UI re-renders
```

**Migration Strategy:**
- Replace with tRPC queries
- Use React Query for caching/refetching
- Server Components for initial data fetch (Next.js)

#### Authentication ↔ Protected Routes
**Pattern:**
```javascript
// All protected API endpoints
const user = await authenticateRequest(req, requestId);
// user is guaranteed to exist or error thrown
```

**Migration:**
- tRPC context with user injection
```typescript
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const user = await authenticateRequest(ctx.req);
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user } });
});
```

---

## Risks & Challenges

### Technical Risks

#### Risk 1: TypeScript Conversion Errors
**Impact:** HIGH  
**Likelihood:** MEDIUM  
**Description:** Converting 30+ React components from JS to TS may introduce type errors that break runtime behavior

**Mitigation Strategy:**
1. Start with `strict: false` in tsconfig, gradually enable
2. Convert leaf components first (no dependencies)
3. Use `any` initially, refine types incrementally
4. Run existing code alongside TypeScript during transition
5. Write integration tests before conversion

#### Risk 2: tRPC Learning Curve
**Impact:** MEDIUM  
**Likelihood:** HIGH  
**Description:** Team unfamiliar with tRPC may struggle with router structure, procedures, and error handling

**Mitigation Strategy:**
1. Start with 1-2 simple endpoints (diagnostics, users)
2. Create boilerplate templates for common patterns
3. Document tRPC conventions in team wiki
4. Pair program on first few endpoints
5. Use tRPC CLI generators if available

#### Risk 3: Database Migration Conflicts
**Impact:** HIGH  
**Likelihood:** LOW  
**Description:** Removing `subscription_gifts` table while production data exists

**Mitigation Strategy:**
1. Backup database before migration
2. Check for any active unredeemed gifts
3. Export gift data for historical records
4. Drop table only after confirming no dependencies
5. Use Supabase migration rollback if needed

#### Risk 4: Next.js Routing Migration
**Impact:** MEDIUM  
**Likelihood:** MEDIUM  
**Description:** React Router 6 → Next.js App Router has different patterns (file-based, server components)

**Mitigation Strategy:**
1. Map current routes to Next.js file structure first
2. Use Next.js `<Link>` component for navigation
3. Migrate one route at a time (start with simple ones)
4. Test redirects from old routes to new ones
5. Keep React Router temporarily during transition

### Complexity Risks

#### Risk 1: Dashboard Component Splitting
**Impact:** MEDIUM  
**Likelihood:** HIGH  
**Description:** Dashboard.jsx is 930 lines with 5 custom hooks - may need sub-builder

**Mitigation Strategy:**
1. Split into smaller components first (pre-migration)
2. Extract hooks into separate files
3. Create shared component library
4. Use Next.js Server Components for data fetching
5. Consider using shadcn/ui for pre-built components

#### Risk 2: CSS Styling Migration
**Impact:** LOW  
**Likelihood:** HIGH  
**Description:** Mix of CSS-in-JS, CSS files, and inline styles needs unification

**Mitigation Strategy:**
1. Choose single approach: Tailwind CSS (recommended) or CSS Modules
2. Install Tailwind and configure for Next.js
3. Convert components one section at a time
4. Keep existing CSS files initially, migrate gradually
5. Use `clsx` or `classnames` for conditional styling

---

## Recommendations for Planner

### 1. Incremental Migration Strategy
**Rationale:** Production app with users cannot have downtime

**Approach:**
- Migrate in phases: Setup → API → Components → Routing
- Run Next.js alongside Vite during transition
- Use feature flags to toggle between old/new code
- Deploy incrementally (not big-bang release)

**Builder Task Split:**
- Builder 1: TypeScript setup + tRPC foundation
- Builder 2: API migration (auth + reflections)
- Builder 3: Component conversion + routing
- Builder 4: Testing + deployment

### 2. Delete Gifting BEFORE Migration
**Rationale:** Reduces migration surface area by 763 lines

**Action Items:**
1. Backup database first
2. Export any active gift data
3. Delete `api/gifting.js`
4. Remove from `backend-server.js` routes
5. Drop `subscription_gifts` table
6. Remove frontend references (if any)
7. Update environment variables
8. Commit as separate PR before migration starts

### 3. Fix `/reflections` Route in Iteration 1
**Rationale:** User-facing bug, easy win during migration

**Implementation:**
- Create `app/reflections/page.tsx` (list view)
- Create `app/reflections/[id]/page.tsx` (detail view)
- Use tRPC to fetch data (once API migrated)
- Update Dashboard links to point to new routes
- Add to navigation menu

### 4. Use Shadcn UI for Component Library
**Rationale:** Saves time on component styling, TypeScript-first

**Benefits:**
- Pre-built accessible components (buttons, cards, forms)
- Tailwind-based (easy customization)
- Copy-paste components (no dependency bloat)
- TypeScript definitions included
- Matches "cosmic glass" aesthetic with tweaks

**Components to Replace:**
- Buttons → shadcn/ui Button
- Cards → shadcn/ui Card
- Forms → shadcn/ui Form + React Hook Form
- Modals → shadcn/ui Dialog
- Toasts → shadcn/ui Toast

### 5. Adopt Drizzle ORM (Optional)
**Rationale:** Type-safe database access, better than raw Supabase queries

**Considerations:**
- Supabase SDK works fine, but Drizzle adds compile-time safety
- Schema definition in TypeScript (single source of truth)
- Migrations managed in code
- Works with Supabase PostgreSQL

**Decision:** Defer to Builder 2 preference (not critical for iteration 1)

### 6. Preserve Modular Prompt System
**Rationale:** File-based prompts are flexible and version-controllable

**Keep:**
```
prompts/
├── base_instructions.txt
├── gentle_clarity.txt
├── luminous_intensity.txt
├── sacred_fusion.txt
├── creator_context.txt
└── evolution_instructions.txt
```

**Enhancement Ideas:**
- Add prompt versioning (track changes over time)
- Store prompt metadata in database (usage stats)
- A/B test different prompts
- Admin UI to edit prompts (future feature)

### 7. Environment Variable Parity
**Rationale:** Minimize deployment surprises

**Required Variables (from `.env.example`):**
```bash
# Database
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Auth
JWT_SECRET

# AI
ANTHROPIC_API_KEY

# Email
GMAIL_USER
GMAIL_APP_PASSWORD

# Payments
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# Infrastructure
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Business
BUSINESS_NUMBER
BUSINESS_NAME
BIT_PHONE
```

**Migration Notes:**
- Next.js uses `NEXT_PUBLIC_` prefix for client-side variables
- Update all `process.env.VITE_*` → `process.env.NEXT_PUBLIC_*`
- Validate all variables in `env.mjs` (T3 Stack pattern)

---

## Resource Map

### Critical Files/Directories

**Must Preserve:**
```
prompts/                        # AI prompt templates
supabase/migrations/            # Database schema
.env.example                    # Environment template
api/auth.js                     # Authentication logic
api/reflection.js               # AI generation
src/hooks/useAuth.js            # Auth hook
src/hooks/useDashboard.js       # Dashboard data fetching
```

**Can Delete:**
```
api/gifting.js                  # Deprecated feature
public/gifting/                 # Gifting UI (if exists)
vite.config.js                  # Replaced by next.config.js
dev-proxy.js                    # No longer needed
backend-server.js               # Replaced by Next.js API routes
```

**Transform (JS → TS):**
```
src/components/**/*.jsx         → *.tsx
src/hooks/**/*.js               → *.ts
api/**/*.js                     → app/api/trpc/[trpc]/route.ts
```

### Key Dependencies

**Keep:**
```json
{
  "@anthropic-ai/sdk": "^0.52.0",
  "@supabase/supabase-js": "^2.50.4",
  "bcryptjs": "^3.0.2",
  "jsonwebtoken": "^9.0.2",
  "stripe": "^18.3.0",
  "nodemailer": "^6.10.1",
  "@upstash/redis": "^1.35.0"
}
```

**Add:**
```json
{
  "next": "^14.0.0",
  "@trpc/server": "^10.x",
  "@trpc/client": "^10.x",
  "@trpc/react-query": "^10.x",
  "@tanstack/react-query": "^5.x",
  "zod": "^3.x",
  "typescript": "^5.x",
  "@types/react": "^18.x",
  "@types/node": "^20.x"
}
```

**Remove:**
```json
{
  "vite": "^4.5.14",
  "@vitejs/plugin-react": "^4.6.0",
  "react-router-dom": "^6.30.1",
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "http-proxy-middleware": "^2.0.6"
}
```

### Testing Infrastructure

**Current State:** No tests exist (`"test": "echo 'Tests would go here'"`)

**Recommendation:**
- Set up Vitest (Vite-compatible, faster than Jest)
- Focus on API tests first (critical business logic)
- Component tests with React Testing Library
- E2E tests with Playwright (MCP available)

**Priority Testing:**
1. Authentication flows (signup, signin, token refresh)
2. Tier-based usage limits (free/essential/premium)
3. Reflection generation (Claude API integration)
4. Payment webhooks (Stripe subscription lifecycle)
5. Monthly usage reset logic

---

## Questions for Planner

### 1. Should we migrate database schema or keep as-is?
**Context:** Current schema has `subscription_gifts` table to delete and uses TEXT for enums (not PostgreSQL ENUMs)

**Options:**
- **A)** Keep schema identical, only drop `subscription_gifts`
- **B)** Refactor to use PostgreSQL ENUMs for `tier`, `subscription_status`, `tone`
- **C)** Add indexes for common queries (email, tier, created_at)

**Recommendation:** Option A for iteration 1 (minimize risk), defer optimizations

### 2. What CSS strategy for Next.js?
**Context:** Currently mix of CSS files, CSS-in-JS, inline styles

**Options:**
- **A)** Tailwind CSS (most popular with Next.js, utility-first)
- **B)** CSS Modules (scoped styles, similar to current approach)
- **C)** Styled-components (CSS-in-JS, requires server component setup)

**Recommendation:** Tailwind CSS + shadcn/ui (modern, type-safe, community standard)

### 3. Should we use NextAuth.js or custom JWT?
**Context:** Current custom JWT implementation works well

**Options:**
- **A)** Keep custom JWT with Next.js middleware (more control)
- **B)** Migrate to NextAuth.js (industry standard, more features)
- **C)** Hybrid (NextAuth for OAuth, keep JWT for email/password)

**Recommendation:** Option A for iteration 1 (proven code), consider NextAuth later

### 4. How to handle Stripe webhooks in Next.js?
**Context:** Need raw body for signature verification

**Options:**
- **A)** Next.js API route with `bodyParser: false` config
- **B)** Edge runtime with `Request.text()`
- **C)** Separate Express microservice for webhooks

**Recommendation:** Option A (standard Next.js pattern, well-documented)

### 5. Should builders work sequentially or parallel?
**Context:** Migration has dependencies (tRPC setup before API migration)

**Options:**
- **A)** Sequential: Setup → API → Frontend → Testing
- **B)** Parallel: Builder 1 (API), Builder 2 (Frontend) simultaneously
- **C)** Hybrid: Setup together, then parallel tracks

**Recommendation:** Option C (most efficient, requires coordination)

### 6. What's the rollback strategy if migration fails?
**Context:** Production app with users

**Options:**
- **A)** Keep old code running, deploy new code to staging first
- **B)** Feature flags to toggle between old/new implementations
- **C)** Blue-green deployment (old version always available)

**Recommendation:** Option A + C (staging first, blue-green on production)

### 7. Should we implement the missing `/reflections` route now or defer?
**Context:** User-facing bug, but adds scope to migration

**Options:**
- **A)** Build in iteration 1 with new Next.js stack
- **B)** Quick fix in old Vite app, then migrate in iteration 2
- **C)** Skip entirely (not critical)

**Recommendation:** Option A (good test of new stack, user value)

---

## Appendix: Code Deletion Checklist

### Files to Delete
- [ ] `api/gifting.js` (763 lines)
- [ ] `vite.config.js` (replaced by `next.config.js`)
- [ ] `backend-server.js` (replaced by Next.js API routes)
- [ ] `dev-proxy.js` (no longer needed)
- [ ] `public/gifting/` directory (if exists)

### Code References to Remove
- [ ] `apiRoutes` array in `backend-server.js` - remove `'gifting'`
- [ ] Any frontend links to `/gifting` route
- [ ] Environment variables: `STRIPE_*_GIFT_PRICE_ID` (if exist)

### Database Changes
- [ ] Backup `subscription_gifts` table data (export to CSV)
- [ ] Drop table: `DROP TABLE public.subscription_gifts CASCADE;`
- [ ] Remove RLS policies for `subscription_gifts`
- [ ] Remove from migration file: `supabase/migrations/20250121000000_initial_schema.sql`

### Verification Steps
- [ ] Grep codebase for "gift" or "gifting" (case-insensitive)
- [ ] Check `package.json` scripts for gifting references
- [ ] Verify no API endpoints call gifting internally
- [ ] Test signup/subscription flows still work after deletion

---

## Appendix: TypeScript Type Definitions (Starter)

```typescript
// types/user.ts
export type UserTier = 'free' | 'essential' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trialing';
export type Language = 'en' | 'he';

export interface User {
  id: string;
  email: string;
  name: string;
  tier: UserTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriod: 'monthly' | 'yearly' | null;
  reflectionCountThisMonth: number;
  totalReflections: number;
  isCreator: boolean;
  isAdmin: boolean;
  language: Language;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string;
}

// types/reflection.ts
export type ReflectionTone = 'gentle' | 'intense' | 'fusion';
export type HasDate = 'yes' | 'no';

export interface Reflection {
  id: string;
  userId: string;
  dream: string;
  plan: string;
  hasDate: HasDate;
  dreamDate: string | null;
  relationship: string;
  offering: string;
  aiResponse: string;
  tone: ReflectionTone;
  isPremium: boolean;
  wordCount: number;
  estimatedReadTime: number;
  title: string;
  tags: string[];
  rating: number | null;
  userFeedback: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// types/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

---

**End of Explorer 1 Report**

**Key Takeaway:** This is a well-architected JavaScript application ready for TypeScript/Next.js migration. The codebase follows modern React patterns, has clear separation of concerns, and uses consistent API patterns. Migration complexity is MEDIUM due to scope (13 APIs, 30+ components) but manageable with incremental approach. Delete gifting feature first, fix `/reflections` route during migration, and use tRPC for type-safe API layer.
