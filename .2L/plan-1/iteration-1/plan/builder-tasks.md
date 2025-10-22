# Builder Task Breakdown - Iteration 1

## Overview

**4 primary builders** will work in parallel to migrate Mirror of Truth to TypeScript/tRPC/Next.js.

**Total Estimated Time:** 6-7 hours (parallel execution)

**Builder Assignment Strategy:**
- Builder 1: TypeScript foundation (creates types used by all others)
- Builder 2: tRPC setup + authentication migration (depends on Builder 1)
- Builder 3: Next.js migration + routing + /reflections route (works parallel to Builder 2)
- Builder 4: API migration - all remaining endpoints (depends on Builder 2)

**Complexity Estimates:**
- LOW: < 1 hour, straightforward migration
- MEDIUM: 1-2 hours, moderate complexity
- HIGH: 2-3 hours, complex logic or many files
- VERY HIGH: 3+ hours, may need split into sub-builders

---

## Builder-1: TypeScript Foundation + Gift Feature Deletion

### Scope

Create the TypeScript foundation for the entire project. This includes all shared type definitions, TypeScript configuration, and complete removal of the gifting feature (code + database).

### Complexity Estimate

**MEDIUM** (1.5-2 hours)

### Success Criteria

- [ ] `tsconfig.json` configured with strict mode enabled
- [ ] All shared types defined in `/types/` directory
- [ ] Type transformation functions created (database row → typed objects)
- [ ] Zod validation schemas created for all tRPC inputs
- [ ] Gift feature completely removed (code + database + references)
- [ ] No "gift" references remain in codebase (verified with grep)
- [ ] TypeScript compiles with 0 errors (empty project, just types)

### Files to Create

**TypeScript Configuration:**
- `tsconfig.json` - TypeScript configuration with strict mode
- `next-env.d.ts` - Next.js type definitions (auto-generated)

**Type Definitions:**
- `types/index.ts` - Re-export all types
- `types/user.ts` - User, JWTPayload, UserRow, transformation functions
- `types/reflection.ts` - Reflection, ReflectionCreateInput, ReflectionListParams
- `types/subscription.ts` - SubscriptionTier, SubscriptionStatus, billing types
- `types/evolution.ts` - EvolutionReport types
- `types/artifact.ts` - Artifact types
- `types/api.ts` - ApiResponse, PaginatedResponse, utility types
- `types/schemas.ts` - All Zod validation schemas

**Documentation:**
- `types/README.md` - Type usage guide for other builders

### Files to Delete (Gift Feature Removal)

**Backend Files:**
- `api/gifting.js` - Delete entire file (763 lines)

**Database Migration:**
- Create SQL script: `supabase/migrations/remove_gift_feature.sql`
  ```sql
  -- Backup existing data first (manual export to CSV)

  -- Drop subscription_gifts table
  DROP TABLE IF EXISTS public.subscription_gifts CASCADE;

  -- Remove any gift-related functions
  DROP FUNCTION IF EXISTS public.create_gift CASCADE;
  DROP FUNCTION IF EXISTS public.redeem_gift CASCADE;
  ```

**Code References to Remove:**
- `api/payment.js`: Remove lines 1508-1563 (routeToGiftWebhook function)
- `api/payment.js`: Remove lines 1646-1662 (handleGiftCheckoutCompleted function)
- `api/communication.js`: Remove gift email handlers
- `api/admin.js`: Remove gift-related functions

### Dependencies

**Depends on:** None (foundation builder)

**Blocks:** All other builders (they use types from this builder)

### Implementation Notes

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"],
      "@/server/*": ["./server/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Key Type Definitions:**

Follow patterns in `patterns.md` exactly:
- User type with transformation from database row
- Reflection type with all fields
- Subscription types (tier, status, period)
- Zod schemas for all inputs

**Gift Deletion Checklist:**

1. Search entire codebase for "gift" (case-insensitive)
2. Remove all references found
3. Delete `api/gifting.js`
4. Remove gift functions from other API files
5. Drop database table (after backup)
6. Verify no broken references
7. Update `.env.example` if gift-related env vars exist

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use TypeScript strict mode conventions
- Follow naming conventions (PascalCase for types)
- Create transformation functions for database rows
- Use Zod for validation schemas
- Document all types with JSDoc comments

### Testing Requirements

- Verify TypeScript compiles with no errors
- Verify all types can be imported by other files
- Verify no "gift" references remain (grep verification)
- Verify database migration runs without errors (in development)

### Potential Split Strategy

This task is MEDIUM complexity and should NOT require splitting. If complexity arises:

**Foundation (Primary Builder 1):**
- Core types (User, Reflection)
- TypeScript configuration
- Zod schemas

**Sub-builder 1A (if needed):**
- Gift feature deletion
- Database migration
- Code cleanup

---

## Builder-2: tRPC Setup + Authentication Migration

### Scope

Set up the complete tRPC infrastructure and migrate all authentication endpoints from Express to tRPC. This creates the foundation for all other API migrations.

### Complexity Estimate

**HIGH** (2-2.5 hours)

### Success Criteria

- [ ] tRPC instance configured with context and error formatting
- [ ] Context creation with JWT verification working
- [ ] Protected procedure middleware functioning correctly
- [ ] Auth router fully migrated (signup, signin, verify, etc.)
- [ ] tRPC API route handler created in Next.js
- [ ] Client-side tRPC provider configured
- [ ] Authentication flow tested end-to-end
- [ ] All auth procedures have Zod validation
- [ ] JWT generation/verification working identically to Express version

### Files to Create

**tRPC Core:**
- `server/trpc/trpc.ts` - tRPC instance, router, publicProcedure
- `server/trpc/context.ts` - Request context creation with JWT verification
- `server/trpc/middleware.ts` - Authentication and permission middlewares
- `server/trpc/routers/_app.ts` - Root router (exports AppRouter type)

**Authentication Router:**
- `server/trpc/routers/auth.ts` - All auth procedures

**Next.js API Route:**
- `app/api/trpc/[trpc]/route.ts` - tRPC handler for Next.js

**Client Setup:**
- `lib/trpc.ts` - Client-side tRPC hooks
- `components/providers/TRPCProvider.tsx` - React Query + tRPC provider
- `app/layout.tsx` - Root layout with TRPCProvider

**Utilities:**
- `server/lib/supabase.ts` - Supabase client singleton
- `server/lib/jwt.ts` - JWT utilities (optional extraction from context)

### Dependencies

**Depends on:** Builder 1 (types and schemas)

**Blocks:** Builder 4 (API migrations need tRPC setup)

### Implementation Notes

**Key Steps:**

1. **Install dependencies:**
```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
npm install @tanstack/react-query zod superjson
npm install -D @types/jsonwebtoken @types/bcryptjs
```

2. **Create tRPC instance** (see `patterns.md` - tRPC Instance Setup)

3. **Create context with JWT verification:**
- Extract token from Authorization header
- Verify with jwt.verify()
- Fetch fresh user data from Supabase
- Check if monthly usage reset needed
- Return { req, res, user }

4. **Create middlewares:**
- `isAuthed` - Ensure user is authenticated
- `isCreatorOrAdmin` - Check creator/admin status
- `checkUsageLimit` - Verify tier limits

5. **Migrate auth procedures:**
- Reuse EXACT same logic from `api/auth.js`
- Keep bcrypt rounds at 12
- Keep JWT expiry at 30 days
- Preserve monthly usage reset logic
- Match error messages exactly

**Auth Router Procedures:**
- `signup` - Create new user with tier 'free'
- `signin` - Authenticate and return JWT + user
- `verifyToken` - Validate token and return user (uses context)
- `me` - Get current user (protected)
- `updateProfile` - Update name/language
- `changePassword` - Password change with verification
- `deleteAccount` - Account deletion with password confirmation

**Critical Preservation:**
- JWT_SECRET must match existing
- Password hashing logic identical (bcrypt, 12 rounds)
- Monthly usage reset logic preserved
- Error messages match Express version
- Token expiry 30 days

### Patterns to Follow

Reference patterns from `patterns.md`:
- tRPC Instance Setup
- Context Creation
- Protected Procedure Middleware
- Authentication Router Example
- Error Handling Patterns

### Testing Requirements

- Unit test: Context creation with valid/invalid tokens
- Unit test: Each auth procedure (signup, signin, etc.)
- Integration test: Full auth flow (signup → signin → verify)
- Test monthly usage reset logic
- Test password change and account deletion

### Potential Split Strategy

This is HIGH complexity. If it takes > 2.5 hours, consider splitting:

**Foundation (Primary Builder 2):**
- tRPC instance setup
- Context creation
- Middleware setup
- Root router structure

**Sub-builder 2A:**
- Auth router procedures (signup, signin, verify)
- JWT generation/verification
- Testing

**Sub-builder 2B:**
- Client-side tRPC provider
- Next.js API route handler
- Integration with frontend

---

## Builder-3: Next.js Migration + Routing + /reflections Route

### Scope

Migrate the frontend from Vite + React Router to Next.js 14 App Router. Convert all React components to TypeScript. Add the missing /reflections route for viewing reflection history.

### Complexity Estimate

**HIGH** (2-2.5 hours)

### Success Criteria

- [ ] Next.js 14 App Router structure created
- [ ] All components converted from .jsx to .tsx
- [ ] All routes migrated from React Router to file-based routing
- [ ] Landing page (/) works
- [ ] Auth pages (/auth/signin, /auth/signup) work
- [ ] Dashboard (/dashboard) works
- [ ] Reflection flow (/reflection, /reflection/output) works
- [ ] NEW: /reflections route created (list view)
- [ ] NEW: /reflections/[id] route created (detail view)
- [ ] Tailwind CSS configured and working
- [ ] Existing CSS preserved (cosmic theme, animations)
- [ ] TRPCProvider configured in root layout
- [ ] All components compile with TypeScript strict mode

### Files to Create

**Next.js Configuration:**
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `styles/globals.css` - Global styles + Tailwind imports

**App Router Structure:**
- `app/layout.tsx` - Root layout with TRPCProvider
- `app/page.tsx` - Landing page (Portal)
- `app/auth/signin/page.tsx` - Sign in page
- `app/auth/signup/page.tsx` - Sign up page
- `app/dashboard/page.tsx` - User dashboard
- `app/reflection/page.tsx` - Reflection questionnaire
- `app/reflection/output/page.tsx` - AI reflection output
- `app/reflections/page.tsx` - **NEW** Reflection list view
- `app/reflections/[id]/page.tsx` - **NEW** Reflection detail view

**Components (Convert to TypeScript):**
- `components/auth/SigninForm.tsx` - Convert from .jsx
- `components/auth/SignupForm.tsx` - Convert from .jsx
- `components/dashboard/Dashboard.tsx` - Convert from .jsx
- `components/dashboard/cards/*.tsx` - Convert all cards
- `components/mirror/Questionnaire.tsx` - Convert from .jsx
- `components/mirror/Output.tsx` - Convert from .jsx
- `components/portal/Portal.tsx` - Convert from .jsx
- `components/shared/CosmicBackground.tsx` - Convert from .jsx

**NEW Components (for /reflections route):**
- `components/reflections/ReflectionsList.tsx` - List view component
- `components/reflections/ReflectionCard.tsx` - Individual reflection card
- `components/reflections/ReflectionDetail.tsx` - Detail view component
- `components/reflections/SearchBar.tsx` - Search and filter component

### Files to Delete/Replace

- `vite.config.js` - Delete (replaced by next.config.js)
- `dev-proxy.js` - Delete (no longer needed)
- `backend-server.js` - Delete (replaced by Next.js API routes)
- `src/main.jsx` - Delete (replaced by app/layout.tsx)
- All `.jsx` files - Convert to `.tsx`

### Dependencies

**Depends on:**
- Builder 1 (types)
- Builder 2 (tRPC client setup) - for integration, can work in parallel initially

**Blocks:** None (works in parallel with Builder 4)

### Implementation Notes

**1. Install Next.js Dependencies:**
```bash
npm install next@14.2.0
npm install tailwindcss autoprefixer postcss
npm install -D @types/react @types/react-dom
```

**2. Create Next.js Config:**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
```

**3. Configure Tailwind:**
```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          gold: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**4. Route Mapping:**

| Old Route (React Router) | New Route (Next.js App Router) |
|--------------------------|--------------------------------|
| `/` | `app/page.tsx` |
| `/auth/*` → AuthApp | `app/auth/signin/page.tsx`, `app/auth/signup/page.tsx` |
| `/reflection` | `app/reflection/page.tsx` |
| `/reflection/output` | `app/reflection/output/page.tsx` |
| `/dashboard` | `app/dashboard/page.tsx` |
| **/reflections (NEW)** | **`app/reflections/page.tsx`** |
| **/reflections/:id (NEW)** | **`app/reflections/[id]/page.tsx`** |

**5. Component Conversion Pattern:**

```typescript
// Before (SigninForm.jsx)
import { useState } from 'react';

export default function SigninForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  // ...
}

// After (SigninForm.tsx)
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface SigninFormProps {
  onSuccess?: () => void;
}

export default function SigninForm({ onSuccess }: SigninFormProps) {
  const [email, setEmail] = useState<string>('');
  // ...
}
```

**6. NEW /reflections Route:**

**List View (`app/reflections/page.tsx`):**
- Fetch reflections using `trpc.reflections.getHistory`
- Implement pagination (20 per page)
- Add search bar (search by dream/plan/relationship)
- Add filters (tone, isPremium)
- Show reflection cards with:
  - Title (or first 50 chars of dream if no title)
  - Created date
  - Tone badge
  - Premium indicator
  - Word count
  - Preview (first 100 chars of dream)
- Click card → navigate to detail page

**Detail View (`app/reflections/[id]/page.tsx`):**
- Fetch reflection using `trpc.reflections.getById`
- Display full AI response
- Show original questionnaire answers
- Display metadata (created date, tone, word count, etc.)
- Add feedback form (rating 1-10, optional text)
- Add edit controls (title, tags)
- Add delete button (with confirmation)
- Back button → return to list

**7. Preserve Existing Styling:**
- Keep cosmic background animations
- Keep existing color scheme
- Gradually migrate to Tailwind (not all at once)
- Keep CSS files for complex animations

**8. Environment Variables:**
- Update all `VITE_*` to `NEXT_PUBLIC_*` in client components
- Server components can access all env vars directly

### Patterns to Follow

Reference patterns from `patterns.md`:
- Next.js App Router file structure
- Client Component patterns ('use client' directive)
- Server Component patterns (async components)
- tRPC usage in components
- Using tRPC in Components section

### Testing Requirements

- Test all routes load without errors
- Test navigation between routes
- Test /reflections pagination works
- Test /reflections search and filtering
- Test /reflections/[id] displays reflection correctly
- Test mobile responsiveness
- Test cosmic background animations work

### Potential Split Strategy

This is HIGH complexity. If > 2.5 hours, consider splitting:

**Foundation (Primary Builder 3):**
- Next.js setup and configuration
- App Router structure
- Root layout with TRPCProvider
- Landing page and auth pages

**Sub-builder 3A:**
- Dashboard migration
- Reflection flow migration
- Component TypeScript conversion

**Sub-builder 3B:**
- NEW /reflections route (list view)
- NEW /reflections/[id] route (detail view)
- Search and filter components

---

## Builder-4: API Migration (Reflections, Users, Evolution, Artifact, Subscriptions, Payment, Admin)

### Scope

Migrate all remaining Express API endpoints to tRPC procedures. This includes reflections, users, evolution reports, artifacts, subscriptions, payment operations, and admin functions. **Note:** Stripe webhooks remain as Express endpoint and are NOT migrated.

### Complexity Estimate

**HIGH** (2-2.5 hours)

### Success Criteria

- [ ] Reflections router fully migrated (CRUD operations)
- [ ] Reflection AI generation router migrated (Claude integration)
- [ ] Users router migrated (profile, usage, dashboard data)
- [ ] Evolution router migrated (report generation, history)
- [ ] Artifact router migrated (GPT-4o, canvas, R2 upload)
- [ ] Subscriptions router migrated (status, cancel, portal)
- [ ] Payment router migrated (payment intent creation, config) - NOT webhooks
- [ ] Admin router migrated (creator auth, data retrieval)
- [ ] Stripe webhooks remain as separate Express endpoint
- [ ] All routers use types from Builder 1
- [ ] All routers have Zod validation
- [ ] Modular prompt system preserved (prompts/ directory)
- [ ] Claude API integration working identically
- [ ] All procedures tested

### Files to Create

**tRPC Routers:**
- `server/trpc/routers/reflections.ts` - Reflection CRUD (see patterns.md example)
- `server/trpc/routers/reflection.ts` - AI generation with Claude
- `server/trpc/routers/users.ts` - User management
- `server/trpc/routers/evolution.ts` - Evolution reports
- `server/trpc/routers/artifact.ts` - Artifact generation
- `server/trpc/routers/subscriptions.ts` - Subscription management
- `server/trpc/routers/payment.ts` - Payment intent creation (NOT webhooks)
- `server/trpc/routers/admin.ts` - Admin operations

**Utilities:**
- `server/lib/claude.ts` - Claude API client wrapper
- `server/lib/prompts.ts` - Prompt loader (reads from prompts/ directory)
- `server/lib/canvas.ts` - Canvas generation for artifacts
- `server/lib/r2.ts` - Cloudflare R2 upload utilities
- `server/lib/email.ts` - Email sending utilities (Nodemailer)

**Webhooks (Express, NOT tRPC):**
- `app/api/webhooks/stripe/route.ts` - Stripe webhook handler

**Update Root Router:**
- `server/trpc/routers/_app.ts` - Add all new routers

### Files to Reference (Express APIs to Migrate)

- `api/reflections.js` → `server/trpc/routers/reflections.ts`
- `api/reflection.js` → `server/trpc/routers/reflection.ts`
- `api/users.js` → `server/trpc/routers/users.ts`
- `api/evolution.js` → `server/trpc/routers/evolution.ts`
- `api/artifact.js` → `server/trpc/routers/artifact.ts`
- `api/subscriptions.js` → `server/trpc/routers/subscriptions.ts`
- `api/payment.js` → `server/trpc/routers/payment.ts` (client-facing only)
- `api/payment.js` (webhooks) → `app/api/webhooks/stripe/route.ts`
- `api/admin.js` → `server/trpc/routers/admin.ts`
- `api/creator-auth.js` → Merge into `server/trpc/routers/admin.ts`

### Dependencies

**Depends on:**
- Builder 1 (types and schemas)
- Builder 2 (tRPC setup, context, middleware)

**Blocks:** None (final builder)

### Implementation Notes

**1. Reflection AI Generation Router:**

Key points:
- Preserve modular prompt system (load from `prompts/` directory)
- Keep Claude API configuration identical:
  - Model: `claude-sonnet-4-20250514`
  - Premium: max_tokens 6000, extended thinking 5000 tokens
  - Free/Essential: max_tokens 4000, no extended thinking
- Tier limit checks (free: 1, essential: 5, premium: 10)
- Update usage counters after generation
- Check evolution report eligibility

**Procedure:**
```typescript
create: usageLimitedProcedure
  .input(createReflectionSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Load prompts from files
    const systemPrompt = await loadPrompts(input.tone, ctx.user.tier === 'premium');

    // 2. Call Claude API
    const aiResponse = await generateReflection({
      systemPrompt,
      userPrompt: buildUserPrompt(input),
      isPremium: ctx.user.tier === 'premium',
    });

    // 3. Store reflection in database
    const reflection = await supabase.from('reflections').insert({...});

    // 4. Update user usage counters
    await supabase.from('users').update({
      reflection_count_this_month: ctx.user.reflectionCountThisMonth + 1,
      total_reflections: ctx.user.totalReflections + 1,
    });

    // 5. Check evolution report eligibility
    // ...

    return { reflection, message: 'Reflection generated successfully' };
  })
```

**2. Stripe Webhooks (CRITICAL - NOT tRPC):**

Create separate Next.js route handler:
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: NextRequest) {
  const body = await req.text(); // Raw body for signature
  const signature = req.headers.get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  // Handle events (same logic as api/payment.js webhooks)
  switch (event.type) {
    case 'payment_intent.succeeded':
      // ...
    case 'customer.subscription.updated':
      // ...
    case 'customer.subscription.deleted':
      // ...
  }

  return NextResponse.json({ received: true });
}
```

**3. Payment Router (Client-Facing Operations):**

Migrate ONLY client-facing operations:
- `config` (GET) - Stripe publishable key and price IDs
- `create-payment-intent` - Create PaymentIntent for in-page payment
- `confirm-payment` - Manual payment confirmation

Do NOT migrate webhooks to tRPC.

**4. Evolution Reports:**

Preserve logic:
- Eligibility checks (Essential: every 4 reflections, Premium: every 6)
- Claude analysis of reflection patterns
- Store report with reflections analyzed

**5. Artifacts:**

Preserve logic:
- GPT-4o analysis
- Canvas-based image generation
- Cloudflare R2 upload
- Store artifact metadata

**6. Admin Router:**

Combine `api/admin.js` and `api/creator-auth.js`:
- Creator authentication (secret key verification)
- Admin data retrieval
- Receipt management
- Gift-related code REMOVED (Builder 1 deletes it)

**7. Users Router:**

Migrate:
- `get-profile` - User profile retrieval
- `get-usage` - Detailed usage statistics
- `get-dashboard-data` - Complete dashboard data in one request
- `upgrade-tier` - Tier upgrade (placeholder)

**8. Subscriptions Router:**

Migrate:
- `get-current` - Current subscription status
- `cancel-subscription` - Cancel subscription (Stripe)
- `get-customer-portal` - Generate Stripe billing portal URL
- `reactivate` - Reactivate canceled subscription

**9. Preserve Utilities:**

Keep functionality from:
- `lib/storage.js` - May need for admin panel
- `lib/canvas-generators.js` - Artifact canvas generation
- `lib/cloudflare.js` - R2 uploads

Convert to TypeScript and move to `server/lib/`.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Reflection CRUD Router Example
- tRPC procedures with Zod validation
- Error handling patterns
- Stripe Webhook Pattern (Non-tRPC)

### Testing Requirements

- Test each router's procedures individually
- Test reflection creation with Claude API
- Test tier limit enforcement
- Test evolution report generation
- Test artifact generation
- Test Stripe payment intent creation
- Test Stripe webhooks (test mode)
- Integration test: Full reflection flow

### Potential Split Strategy

This is HIGH complexity with many routers. If > 2.5 hours, split:

**Foundation (Primary Builder 4):**
- Reflections router (CRUD)
- Reflection AI generation router
- Users router

**Sub-builder 4A:**
- Evolution router
- Artifact router

**Sub-builder 4B:**
- Payment router (client operations)
- Subscriptions router
- Stripe webhook handler

**Sub-builder 4C:**
- Admin router
- Utility libraries migration

---

## Builder Execution Order

### Parallel Group 1 (Start Immediately)

**Builder 1: TypeScript Foundation + Gift Deletion**
- No dependencies
- Creates foundation for all others
- Estimated: 1.5-2 hours

### Parallel Group 2 (Start After Builder 1 Types Available)

**Builder 2: tRPC Setup + Auth**
- Depends on: Builder 1 (types)
- Creates tRPC foundation
- Estimated: 2-2.5 hours

**Builder 3: Next.js Migration + /reflections Route**
- Depends on: Builder 1 (types)
- Can work in parallel with Builder 2 initially
- Full integration needs Builder 2 complete
- Estimated: 2-2.5 hours

### Parallel Group 3 (Start After Builder 2 Complete)

**Builder 4: API Migration**
- Depends on: Builder 1 (types), Builder 2 (tRPC setup)
- Migrates all remaining endpoints
- Estimated: 2-2.5 hours

### Timeline Visualization

```
Hour 0-2:
  Builder 1: TypeScript + Gift Deletion ████████████ (COMPLETE at 2h)

Hour 1-3.5:
  Builder 2: tRPC + Auth         ██████████████ (COMPLETE at 3.5h)
  Builder 3: Next.js + Routes    ██████████████ (COMPLETE at 3.5h)

Hour 2-4.5:
  Builder 4: API Migration                  ████████████ (COMPLETE at 4.5h)

Hour 4.5-5.5:
  Integration: Merge all builders, test together ████

Hour 5.5-6:
  Validation: End-to-end testing ███

Total: ~6 hours
```

---

## Integration Notes

### How Builder Outputs Come Together

**Step 1: Merge Builder 1**
- All type definitions available
- Other builders can reference types

**Step 2: Merge Builder 2**
- tRPC infrastructure ready
- Authentication works
- Test: Sign up, sign in, verify token

**Step 3: Merge Builder 3 and Builder 4 Simultaneously**
- Next.js frontend calls tRPC APIs
- Test reflection creation flow
- Test /reflections route

**Step 4: Full Integration Testing**
- End-to-end user flow: Sign up → Create reflection → View in /reflections
- Test authentication across all pages
- Test tier limits
- Test payment flow (staging only)
- Test Stripe webhooks (test mode)

### Potential Conflict Areas

**File:** `package.json`
- All builders may add dependencies
- **Solution:** Merge dependencies manually, avoid duplicates

**File:** `server/trpc/routers/_app.ts`
- Builder 2 creates structure, Builder 4 adds routers
- **Solution:** Builder 4 updates this file to import new routers

**File:** `app/layout.tsx`
- Builder 3 creates root layout
- Needs TRPCProvider from Builder 2
- **Solution:** Builder 3 imports from Builder 2's client setup

**File:** `.env.example`
- Update for Next.js environment variables
- **Solution:** Single source of truth, all builders reference it

### Shared Files - Ownership

| File | Owner | Notes |
|------|-------|-------|
| `types/*` | Builder 1 | Others import only |
| `server/trpc/trpc.ts` | Builder 2 | Others import only |
| `server/trpc/context.ts` | Builder 2 | Others import only |
| `server/trpc/routers/_app.ts` | Builder 2 creates, Builder 4 adds routers | Coordination needed |
| `app/layout.tsx` | Builder 3 | Imports TRPCProvider from Builder 2 |
| `lib/trpc.ts` | Builder 2 | Client-side tRPC setup |
| `components/providers/TRPCProvider.tsx` | Builder 2 | Used by Builder 3 |

---

## Post-Build Checklist

Before integration, each builder should verify:

**Builder 1:**
- [ ] All types compile without errors
- [ ] Grep shows no "gift" references remain
- [ ] Database migration script ready
- [ ] Type transformation functions tested

**Builder 2:**
- [ ] tRPC instance configured correctly
- [ ] Context creates user from JWT
- [ ] Auth router procedures work
- [ ] Client-side tRPC provider configured
- [ ] Test: Sign up and sign in work

**Builder 3:**
- [ ] All routes load without errors
- [ ] All components converted to TypeScript
- [ ] /reflections route displays correctly
- [ ] /reflections/[id] route works
- [ ] Tailwind CSS configured
- [ ] Cosmic background animations work

**Builder 4:**
- [ ] All routers created and exported
- [ ] Root router imports all sub-routers
- [ ] Stripe webhooks handler created (NOT tRPC)
- [ ] Modular prompts load correctly
- [ ] Claude API integration works
- [ ] Test: Create reflection generates AI response

---

## Final Integration Testing

After all builders merge:

1. **Authentication Flow:**
   - Sign up new user
   - Sign in
   - Verify token persists
   - Test protected routes

2. **Reflection Flow:**
   - Create reflection (AI generation)
   - View in /reflections list
   - Click to view detail in /reflections/[id]
   - Edit reflection (title, tags)
   - Delete reflection

3. **Tier Limits:**
   - Create reflections up to tier limit
   - Verify error when limit exceeded
   - Test creator/admin unlimited access

4. **Payment Flow (Staging):**
   - Create payment intent
   - Process test payment (Stripe test mode)
   - Verify webhook processes correctly
   - Verify tier upgrade

5. **Build and Deploy:**
   - Run `npm run build`
   - Verify 0 errors, 0 warnings
   - Deploy to Vercel staging
   - Test on staging environment

---

**All builders: Reference `patterns.md` for code examples and conventions. Follow the patterns exactly to ensure smooth integration.**
