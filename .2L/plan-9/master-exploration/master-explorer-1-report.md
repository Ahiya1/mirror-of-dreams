# Master Explorer 1 Report: Architecture & Complexity Analysis

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary
Replace the existing Stripe payment infrastructure with PayPal subscriptions, simplify from 4 tiers to 3 tiers (Free, Pro, Unlimited), implement daily reflection limits, and upgrade AI model from Claude Sonnet 4 to Sonnet 4.5 with extended thinking for premium tiers.

---

## Executive Summary

**Current State:** Mirror of Dreams is a complete, polished product with inactive Stripe payment infrastructure. The app uses Next.js 14 App Router, tRPC for API, Supabase for database, and Claude Sonnet 4 for AI generation.

**Gap:** Payment system exists but is non-functional. Stripe integration was scaffolded but never activated, blocking monetization.

**Transformation Required:** Replace Stripe with PayPal, simplify tier structure (4→3 tiers), add daily limits, upgrade AI model.

**Complexity Level:** MEDIUM-HIGH
- **Rationale:** Multiple interconnected systems (payment provider swap, tier restructuring, AI upgrade) but well-defined scope with existing patterns to follow
- **Estimated Total Work:** 18-24 hours across 3 iterations

---

## Current Architecture Analysis

### 1. Technology Stack (Well-Established)

**Frontend:**
- Next.js 14.2.0 (App Router architecture)
- React 18.3.1 with TypeScript
- TailwindCSS + Framer Motion for UI/animations
- tRPC client (@trpc/client 11.6.0, @trpc/react-query 11.6.0)
- React Query for state management

**Backend:**
- Next.js API routes (App Router)
- tRPC server (@trpc/server 11.6.0)
- Supabase PostgreSQL database (@supabase/supabase-js 2.50.4)
- Anthropic Claude API (@anthropic-ai/sdk 0.52.0)
- Node.js 18.x runtime

**Current AI Model:**
- Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) - ALREADY UPGRADED!
- Extended thinking ALREADY implemented for premium tier
- Located in: `server/trpc/routers/reflection.ts` (lines 93-105)

**Infrastructure:**
- Vercel deployment (inferred from vercel.json)
- Upstash Redis for sessions/receipts
- AWS S3 for visualization storage (@aws-sdk/client-s3)

### 2. Application Structure

```
mirror-of-dreams/
├── app/                      # Next.js 14 App Router
│   ├── api/
│   │   ├── trpc/[trpc]/     # tRPC handler
│   │   └── webhooks/
│   │       └── stripe/      # EXISTING Stripe webhook (TO BE REPLACED)
│   ├── auth/                 # Sign in/up pages
│   ├── dashboard/            # User dashboard
│   ├── pricing/              # Pricing page (needs 3-tier update)
│   ├── profile/              # User profile
│   ├── reflections/          # Reflections list
│   └── dreams/               # Dreams management
├── server/
│   ├── lib/
│   │   ├── supabase.ts      # DB client singleton
│   │   ├── prompts.ts       # AI system prompts
│   │   └── cost-calculator.ts
│   └── trpc/
│       ├── middleware.ts     # Auth, tier limits, usage tracking
│       ├── context.ts        # Request context
│       └── routers/
│           ├── _app.ts       # Root router
│           ├── auth.ts       # Authentication
│           ├── subscriptions.ts  # MINIMAL - Needs expansion
│           ├── reflection.ts  # AI generation (uses Sonnet 4.5)
│           ├── reflections.ts # CRUD operations
│           ├── dreams.ts      # Dreams management
│           ├── evolution.ts   # Evolution reports
│           ├── visualizations.ts
│           └── users.ts       # User management
├── types/
│   ├── user.ts              # User, Subscription types
│   └── schemas.ts           # Zod validation schemas
├── lib/
│   └── utils/
│       └── constants.ts     # TIER_LIMITS (needs update)
└── supabase/
    └── migrations/          # Database schema
```

### 3. Current Subscription Architecture

**Database Schema (from `20250121000000_initial_schema.sql`):**
- **users table** has subscription fields:
  - `tier`: ENUM ('free', 'essential', 'premium') - CHECK constraint
  - `subscription_status`: ENUM ('active', 'canceled', 'expired', 'trialing')
  - `subscription_id`: Generic external ID (currently Stripe)
  - `subscription_period`: 'monthly' | 'yearly'
  - `subscription_started_at`, `subscription_expires_at`: TIMESTAMP
  - `reflection_count_this_month`, `total_reflections`: INTEGER

**Current Tier Limits (from `constants.ts`):**
```typescript
TIER_LIMITS = {
  free: 10,        // reflections/month
  essential: 50,   // reflections/month
  premium: Infinity // unlimited
}
```

**Tier Check Function (from `20251112000001_update_reflection_limits.sql`):**
- Database function: `check_reflection_limit(user_uuid UUID)`
- Supports tiers: 'free', 'essential', 'optimal', 'premium'
- **Mismatch Alert:** DB function has 4 tiers, but schema constraint only allows 3
- Creators and admins bypass all limits

**Existing Stripe Integration (INACTIVE):**
- Package: `stripe@18.3.0` installed
- Webhook handler: `app/api/webhooks/stripe/route.ts` (303 lines, fully implemented)
  - Handles: checkout completed, subscription updated/deleted, payment failures
  - Updates user tier/status based on events
  - Signature verification implemented
- tRPC router: `server/trpc/routers/subscriptions.ts` (80 lines, MINIMAL)
  - Only implements `getStatus` query
  - Comment line 2: "Stripe temporarily disabled - will be replaced with PayPal"
  - Cancel, upgrade, portal procedures commented out
- No frontend checkout integration found (CTAs likely point to placeholder)

### 4. AI Integration Architecture

**Current Implementation (ALREADY UPGRADED):**
- Model: `claude-sonnet-4-5-20250929` (line 93 in `reflection.ts`)
- Extended thinking: ALREADY implemented for premium tier
  ```typescript
  if (shouldUsePremium) {
    requestConfig.thinking = {
      type: 'enabled' as const,
      budget_tokens: 5000,
    };
  }
  ```
- Premium determination: `tier === 'premium' || isCreator`
- Token limits: 6000 for premium, 4000 for standard
- Temperature: 1.0 (creative mode)
- System prompt with date awareness

**AI Service Location:**
- Primary: `server/trpc/routers/reflection.ts` (reflection generation)
- Secondary: `server/trpc/routers/evolution.ts` (evolution reports)
- Secondary: `server/trpc/routers/visualizations.ts` (visualization generation)

### 5. Tier Enforcement Patterns

**Middleware-Based (server/trpc/middleware.ts):**
```typescript
checkUsageLimit = middleware(async ({ ctx, next }) => {
  // Creators/admins bypass
  if (ctx.user.isCreator || ctx.user.isAdmin) return next();

  const limit = TIER_LIMITS[ctx.user.tier]; // From constants.ts
  const usage = ctx.user.reflectionCountThisMonth;

  if (usage >= limit) throw TRPCError('FORBIDDEN', 'Monthly limit reached');
  return next();
});

export const usageLimitedProcedure = publicProcedure.use(isAuthed).use(checkUsageLimit);
```

**Applied to:**
- `reflection.create` (AI generation procedure)

**Counter Updates:**
- Reflection creation updates: `reflection_count_this_month`, `total_reflections`
- Monthly reset handled by `current_month_year` field comparison
- Database function `check_reflection_limit()` also validates

---

## PayPal Integration Architecture

### 1. Required New Files/Modules

**Server-side PayPal Client (`server/lib/paypal.ts`):**
- Initialize PayPal REST API client (no SDK needed, use fetch)
- Access token management with auto-refresh
- Helper functions:
  - `getAccessToken()` - OAuth2 token retrieval
  - `createSubscription(planId, userId, returnUrl, cancelUrl)`
  - `cancelSubscription(subscriptionId)`
  - `getSubscriptionDetails(subscriptionId)`
  - `reviseSubscription(subscriptionId, newPlanId)` - For upgrades/downgrades

**PayPal Webhook Handler (`app/api/webhooks/paypal/route.ts`):**
- Pattern: Follow existing Stripe webhook at `app/api/webhooks/stripe/route.ts`
- Signature verification (PayPal uses different algorithm than Stripe)
- Event handlers:
  - `BILLING.SUBSCRIPTION.ACTIVATED` → Update tier, set status='active'
  - `BILLING.SUBSCRIPTION.CANCELLED` → Set cancel_at_period_end flag
  - `BILLING.SUBSCRIPTION.EXPIRED` → Downgrade to free
  - `BILLING.SUBSCRIPTION.SUSPENDED` → Set status='past_due'
  - `PAYMENT.SALE.COMPLETED` → Log successful payment
- Database updates via Supabase client

**tRPC Subscription Procedures (expand `server/trpc/routers/subscriptions.ts`):**
- `createCheckout(tier, period)` - Returns PayPal approval URL
- `cancel()` - Cancel subscription at period end
- `reactivate()` - Undo cancellation before expiry
- `changePlan(newTier, newPeriod)` - Upgrade/downgrade
- `getStatus()` - ALREADY EXISTS, needs minor updates

**Type Definitions (update `types/user.ts`, `types/subscription.ts`):**
- Replace Stripe-specific types with PayPal equivalents
- Add `PayPalConfig` interface
- Update `Subscription` interface with PayPal fields

### 2. Integration into Existing tRPC Structure

**Fits naturally into current patterns:**
- tRPC router already exists: `server/trpc/routers/subscriptions.ts`
- Root router already imports it: `server/trpc/routers/_app.ts` (line 11)
- Frontend already has tRPC client setup via `@trpc/react-query`

**Client-side integration:**
```typescript
// Frontend usage (example)
const { data: subscriptionStatus } = trpc.subscriptions.getStatus.useQuery();
const createCheckout = trpc.subscriptions.createCheckout.useMutation();

// On "Subscribe" button click
const { approvalUrl } = await createCheckout.mutateAsync({ tier: 'pro', period: 'monthly' });
window.location.href = approvalUrl; // Redirect to PayPal
```

### 3. Webhook Handling Pattern

**Must be separate Next.js route (NOT tRPC):**
- Reason: Need raw request body for signature verification
- Pattern: Copy `app/api/webhooks/stripe/route.ts` structure
- Location: `app/api/webhooks/paypal/route.ts`
- Export: `POST` async function
- Runtime: `export const runtime = 'nodejs'`
- Dynamic: `export const dynamic = 'force-dynamic'`

**Signature Verification (PayPal-specific):**
```typescript
// PayPal uses CERT-based verification
import crypto from 'crypto';

function verifyPayPalSignature(body: string, headers: Headers): boolean {
  const transmissionId = headers.get('PAYPAL-TRANSMISSION-ID');
  const transmissionTime = headers.get('PAYPAL-TRANSMISSION-TIME');
  const certUrl = headers.get('PAYPAL-CERT-URL');
  const signature = headers.get('PAYPAL-TRANSMISSION-SIG');
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  // Verification algorithm (to be implemented)
  // Reference: PayPal webhook signature verification docs
}
```

### 4. Database Schema Changes Required

**Add PayPal-specific columns to `users` table:**
```sql
ALTER TABLE users
  ADD COLUMN paypal_subscription_id VARCHAR(255),
  ADD COLUMN paypal_payer_id VARCHAR(255);

-- subscription_id column already exists (generic)
-- Can repurpose for PayPal ID or keep as-is
```

**Update tier constraint (3-tier structure):**
```sql
-- Current constraint: tier IN ('free', 'essential', 'premium')
-- New constraint: tier IN ('free', 'pro', 'unlimited')

ALTER TABLE users
  DROP CONSTRAINT users_tier_check,
  ADD CONSTRAINT users_tier_check CHECK (tier IN ('free', 'pro', 'unlimited'));
```

**Migration for existing data:**
```sql
-- Rename tiers (if any exist)
UPDATE users SET tier = 'pro' WHERE tier = 'essential';
UPDATE users SET tier = 'unlimited' WHERE tier = 'premium';
```

### 5. Environment Variables Required

**Already in `.env.example` (CONFIGURED):**
```bash
PAYPAL_CLIENT_ID=AYZUnPSWX22-fy_ed2k_MfbiZPeefY9bw3e2FuR9nsCxe-1ZBENJLU-QM_ZrxKtuo9BhFBZvXrUjAIcv
PAYPAL_CLIENT_SECRET=EAurh1D6v_FqNzArU4MqNS531xyGmQpkXaox5kVacxhSHKYjLJz04HDaoTyoe9pgx-PId-EibJbtAhRb
PAYPAL_ENVIRONMENT=sandbox

# NEEDS UPDATE - Wrong tier names
PAYPAL_PRO_MONTHLY_PLAN_ID=TODO
PAYPAL_PRO_YEARLY_PLAN_ID=TODO
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=TODO
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=TODO

PAYPAL_WEBHOOK_ID=  # To be created
```

**Action Required:**
- Create PayPal products/plans with correct names and pricing
- Update plan IDs in `.env.local` and `.env.example`

---

## 3-Tier Structure Implementation

### Current State (4 Tiers - INCONSISTENT)
- **constants.ts**: 3 tiers (free, essential, premium)
- **Database schema**: 3 tiers CHECK constraint
- **Database function**: 4 tiers (free, essential, optimal, premium)
- **Vision document**: 3 tiers (free, pro, unlimited)

### Target State (3 Tiers - SIMPLIFIED)

**Tier Renaming:**
- `free` → `free` (no change)
- `essential` → `pro`
- `premium` → `unlimited`
- Remove: `optimal` (from DB function)

**Updated Limits Configuration:**
```typescript
// lib/utils/constants.ts
export const TIER_LIMITS = {
  free: {
    dreams: 2,
    reflectionsPerMonth: 2,
    reflectionsPerDay: 2, // Effectively no limit since only 2/month
    evolutionReports: false,
    visualizations: false,
    extendedThinking: false
  },
  pro: {
    dreams: 5,
    reflectionsPerMonth: 30,
    reflectionsPerDay: 1,  // NEW: Daily limit
    evolutionReports: true,
    visualizations: true,
    extendedThinking: false
  },
  unlimited: {
    dreams: Infinity,
    reflectionsPerMonth: 60,
    reflectionsPerDay: 2,  // NEW: Daily limit
    evolutionReports: true,
    visualizations: true,
    extendedThinking: true
  }
} as const;
```

**Daily Limit Implementation (NEW REQUIREMENT):**
- Add to `users` table: `reflection_count_today`, `last_reflection_date`
- Update `middleware.ts` to check daily limit:
  ```typescript
  // Pseudo-code
  if (ctx.user.lastReflectionDate === today &&
      ctx.user.reflectionCountToday >= TIER_LIMITS[tier].reflectionsPerDay) {
    throw TRPCError('FORBIDDEN', 'Daily reflection limit reached');
  }
  ```
- Reset logic: Compare `last_reflection_date` to current date

**Feature Gating (Evolution Reports & Visualizations):**
- Add middleware: `requirePaidTier` for evolution/visualization routes
- Update tRPC procedures:
  - `evolution.generate` - Check tier !== 'free'
  - `visualizations.generate` - Check tier !== 'free'

---

## Complexity Assessment

### Overall Complexity: MEDIUM-HIGH

**Rationale:**

1. **Multiple Interconnected Systems (HIGH):**
   - Payment provider swap (Stripe → PayPal)
   - Tier structure refactor (4 → 3 tiers, renaming)
   - Daily limit implementation (new feature)
   - AI model upgrade (DONE - Sonnet 4.5 already deployed)
   - Extended thinking (DONE - already implemented)

2. **Well-Defined Patterns (REDUCES COMPLEXITY):**
   - Existing Stripe webhook provides template for PayPal webhook
   - tRPC architecture already established
   - Database schema supports subscriptions (minimal changes needed)
   - Middleware pattern exists for tier enforcement

3. **No Breaking Changes Required (REDUCES COMPLEXITY):**
   - Subscription infrastructure already in place
   - Frontend components exist (pricing page, profile)
   - AI upgrade already complete (unexpected simplification!)

4. **Risk Factors (INCREASES COMPLEXITY):**
   - Database migration needed (tier renaming)
   - Daily limit adds new state tracking requirement
   - PayPal webhook signature verification different from Stripe
   - Must ensure zero data loss during tier migration

**Estimated Total Work:** 18-24 hours

**Breakdown:**
- PayPal SDK & Infrastructure: 4-5 hours
- Database migration (3-tier + daily limits): 3-4 hours
- Webhook handler: 3-4 hours
- tRPC procedures (checkout, cancel, upgrade): 3-4 hours
- Frontend updates (pricing, profile): 2-3 hours
- Testing & QA: 3-4 hours

---

## Iteration Breakdown Recommendation

### Recommendation: MULTI-ITERATION (3 Iterations)

**Rationale:**
- Too many interdependent changes for single iteration
- Natural separation between backend foundation and frontend features
- Tier migration needs testing before payment activation
- Daily limits are complex enough to warrant separate phase

---

### Iteration 1: Foundation - Tier Restructure & PayPal Infrastructure

**Vision:** Prepare the database and backend for PayPal subscriptions with the new 3-tier structure.

**Scope:**
1. **Database Migration (3-tier structure)**
   - Update users table constraint: 'free' | 'pro' | 'unlimited'
   - Add daily limit columns: `reflection_count_today`, `last_reflection_date`
   - Migrate existing data (essential → pro, premium → unlimited)
   - Update DB function `check_reflection_limit()` to remove 'optimal'

2. **Update Type Definitions**
   - `types/user.ts`: SubscriptionTier = 'free' | 'pro' | 'unlimited'
   - Remove Stripe types, add PayPal types
   - Add PayPalConfig interface

3. **Update Constants**
   - `lib/utils/constants.ts`: New TIER_LIMITS with daily limits
   - Update all tier references across codebase

4. **Daily Limit Middleware**
   - Update `server/trpc/middleware.ts`
   - Add daily limit check to `checkUsageLimit`
   - Reset logic for new day

5. **PayPal Client Library**
   - Create `server/lib/paypal.ts`
   - OAuth token management
   - Helper functions (no actual API calls yet)

6. **Environment Setup**
   - Create PayPal products & plans (via PayPal Dashboard)
   - Update .env with plan IDs

**Why First:**
- Database must be migrated before payment integration
- Daily limits need testing independently
- PayPal client is foundation for all payment operations

**Estimated Duration:** 6-8 hours

**Risk Level:** MEDIUM
- Database migration carries risk of data corruption
- Daily limit logic must be bulletproof (affects user experience)
- Mitigation: Thorough testing, rollback plan

**Success Criteria:**
- [ ] All database migrations applied successfully
- [ ] No existing user data lost
- [ ] Daily limit enforced correctly (test with creator account)
- [ ] All tier references updated (no 'essential'/'premium' in code)
- [ ] PayPal client initializes without errors

**Dependencies:**
- None (foundation work)

---

### Iteration 2: PayPal Payment Flow - Checkout & Webhooks

**Vision:** Enable users to subscribe and pay via PayPal with automatic tier updates.

**Scope:**
1. **PayPal Webhook Handler**
   - Create `app/api/webhooks/paypal/route.ts`
   - Implement signature verification
   - Handle subscription lifecycle events
   - Update user tier/status based on events
   - Logging and error handling

2. **tRPC Subscription Procedures**
   - `subscriptions.createCheckout` - Generate PayPal approval URL
   - `subscriptions.cancel` - Cancel subscription at period end
   - `subscriptions.reactivate` - Undo cancellation
   - Update `subscriptions.getStatus` for PayPal fields

3. **PayPal Integration Testing**
   - Test sandbox checkout flow
   - Verify webhook delivery
   - Test all subscription events (activated, canceled, expired)
   - Verify database updates

4. **Error Handling & Logging**
   - PayPal API error handling
   - Webhook retry logic
   - Comprehensive logging for debugging

**Why Second:**
- Requires foundation from Iteration 1
- Most critical for monetization
- Can test backend independently before frontend updates

**Estimated Duration:** 7-9 hours

**Risk Level:** HIGH
- Webhook signature verification must be correct (security)
- Payment errors could block user access
- Mitigation: Extensive sandbox testing, fallback to manual intervention

**Success Criteria:**
- [ ] PayPal checkout flow works end-to-end
- [ ] Webhooks trigger database updates correctly
- [ ] Subscription cancellation preserves access until period end
- [ ] Error states handled gracefully
- [ ] All webhook events logged

**Dependencies:**
- **Requires Iteration 1:** Database schema, tier structure, PayPal client
- **Imports from Iteration 1:** PayPal types, new tier constants

---

### Iteration 3: Frontend Integration - Pricing, Profile, Feature Gating

**Vision:** Connect the frontend to PayPal checkout and display subscription status.

**Scope:**
1. **Update Pricing Page (`app/pricing/page.tsx`)**
   - Show 3 tiers: Free, Pro ($15/mo), Unlimited ($29/mo)
   - Add monthly/yearly toggle (show savings)
   - Display daily limits prominently
   - Connect "Subscribe" CTAs to tRPC checkout
   - Show current plan if logged in

2. **Profile Page Subscription Management**
   - Display current tier, billing period, next billing date
   - "Cancel Subscription" button (if active)
   - "Reactivate" button (if canceled but not expired)
   - Link to PayPal billing portal

3. **Feature Gating (Evolution & Visualizations)**
   - Add `requirePaidTier` middleware
   - Apply to evolution.generate, visualizations.generate
   - Update UI to show "Upgrade to Pro" for free users
   - Disable evolution/visualization CTAs for free tier

4. **Dashboard Tier Indicators**
   - Update tier badges (Pro, Unlimited)
   - Show reflection limits: "1/30 today" (for Pro with daily limit)
   - Upgrade prompts for free users

5. **UX Polish**
   - Loading states during checkout creation
   - Success/error toasts
   - Subscription status banners (past_due, canceled)

**Why Third:**
- Backend must work before frontend can use it
- Visual changes are lower risk than payment logic
- Can iterate on UX without affecting payment flow

**Estimated Duration:** 5-7 hours

**Risk Level:** LOW
- Mostly UI updates, no payment logic
- Can rollback frontend without affecting backend
- Mitigation: Component-level testing, visual QA

**Success Criteria:**
- [ ] Pricing page displays 3 tiers correctly
- [ ] "Subscribe" button initiates PayPal checkout
- [ ] Profile shows accurate subscription status
- [ ] Cancel/reactivate buttons work
- [ ] Evolution/visualizations blocked for free tier
- [ ] Tier badges updated throughout app

**Dependencies:**
- **Requires Iteration 2:** Working PayPal checkout, subscription procedures
- **Imports from Iteration 2:** tRPC procedures, subscription status API

---

## Dependency Graph

```
Iteration 1: Foundation (Tier Restructure & PayPal Infrastructure)
├── Database Migration (3-tier structure)
├── Daily Limit Columns & Logic
├── Type Updates (remove Stripe, add PayPal)
├── Constants Updates (new TIER_LIMITS)
├── PayPal Client Library (server/lib/paypal.ts)
└── Environment Setup (PayPal products/plans)
    ↓
Iteration 2: PayPal Payment Flow (Checkout & Webhooks)
├── PayPal Webhook Handler (uses PayPal client from Iter 1)
├── tRPC Subscription Procedures (uses new tier types from Iter 1)
├── Webhook Event Handlers (updates DB with new tier names)
└── Sandbox Testing (verifies Iteration 1 migrations work)
    ↓
Iteration 3: Frontend Integration (Pricing, Profile, Feature Gating)
├── Pricing Page (calls tRPC checkout from Iter 2, shows new tiers)
├── Profile Page (displays status from Iter 2 API)
├── Feature Gating (uses tier middleware from Iter 1)
└── Dashboard Updates (shows daily limits from Iter 1)
```

**Critical Path:**
1. Database migration MUST complete before any payment testing
2. PayPal checkout MUST work before frontend can use it
3. Webhook handler MUST verify signatures before processing events

**Parallelization Opportunities:**
- Within Iteration 1: Types, constants, PayPal client can be developed in parallel with DB migration
- Within Iteration 2: tRPC procedures and webhook handler can be developed in parallel (both use PayPal client)
- Within Iteration 3: All frontend components are independent

---

## Risk Assessment

### High Risks

**1. Database Migration Data Loss**
- **Impact:** Existing user tiers could be corrupted, breaking access control
- **Mitigation:**
  - Create full database backup before migration
  - Test migration on staging environment
  - Write rollback script
  - Verify data integrity with queries before/after
- **Recommendation:** Tackle in Iteration 1, allocate extra time for testing

**2. PayPal Webhook Signature Verification**
- **Impact:** Invalid verification could allow fake webhook events, compromising security
- **Mitigation:**
  - Follow PayPal documentation exactly
  - Test signature verification independently
  - Log all verification failures
  - Use sandbox environment extensively before production
- **Recommendation:** Implement early in Iteration 2, test thoroughly

**3. Daily Limit Logic Edge Cases**
- **Impact:** Users could be incorrectly blocked or allowed unlimited reflections
- **Mitigation:**
  - Test timezone edge cases (midnight boundary)
  - Test counter reset logic extensively
  - Add comprehensive logging
  - Creator account bypass for emergencies
- **Recommendation:** Build into Iteration 1 with extensive testing

### Medium Risks

**4. Tier Renaming Breaks Existing Code**
- **Impact:** References to 'essential'/'premium' could cause runtime errors
- **Mitigation:**
  - Grep entire codebase for tier references
  - Update all hardcoded strings
  - TypeScript will catch most type mismatches
- **Recommendation:** Use TypeScript enum for tier names

**5. PayPal API Rate Limits**
- **Impact:** Checkout creation could fail during traffic spikes
- **Mitigation:**
  - Implement retry logic with exponential backoff
  - Cache access tokens (valid for 9 hours)
  - Monitor API usage
- **Recommendation:** Build into PayPal client (Iteration 1)

**6. Webhook Delivery Delays**
- **Impact:** User tier might not update immediately after payment
- **Mitigation:**
  - Implement optimistic UI updates
  - Poll subscription status after checkout
  - Display "Processing..." state
- **Recommendation:** Handle in Iteration 3 frontend

### Low Risks

**7. Pricing Page Confusion (3 tiers vs 4)**
- **Impact:** Users might expect 4 tiers based on old materials
- **Mitigation:** Clear tier naming, obvious feature differences
- **Recommendation:** Simple UX update in Iteration 3

**8. AI Upgrade Already Complete**
- **Impact:** POSITIVE - Removes complexity from plan
- **Finding:** Claude Sonnet 4.5 already deployed, extended thinking already implemented
- **Recommendation:** Remove from implementation tasks, update vision document

---

## Integration Considerations

### Cross-Phase Integration Points

**1. Tier Type Consistency**
- **Shared:** `SubscriptionTier` type from `types/user.ts`
- **Used in:** Database schema, TypeScript types, tRPC procedures, frontend components
- **Risk:** Any mismatch breaks type safety
- **Solution:** Single source of truth in types file, import everywhere

**2. PayPal Client Singleton**
- **Shared:** `server/lib/paypal.ts`
- **Used in:** tRPC procedures, webhook handler
- **Risk:** Token management must be thread-safe
- **Solution:** Lazy initialization, mutex for token refresh

**3. Subscription Status API**
- **Shared:** `subscriptions.getStatus` tRPC procedure
- **Used in:** Profile page, dashboard, pricing page (to show current plan)
- **Risk:** Must support both Stripe (legacy) and PayPal data
- **Solution:** Check which subscription_id exists, return normalized data

### Potential Integration Challenges

**1. Migration Overlap (Iteration 1 → 2)**
- **Challenge:** If Iteration 1 not fully tested, Iteration 2 might use wrong tier names
- **Solution:** Strict completion criteria for Iteration 1, integration tests

**2. Frontend/Backend Version Mismatch (Iteration 2 → 3)**
- **Challenge:** If frontend deploys before backend, checkout will fail
- **Solution:** Deploy backend first, verify health check, then deploy frontend

**3. Webhook Registration Timing**
- **Challenge:** Webhook endpoint must exist before registering with PayPal
- **Solution:** Deploy webhook handler in Iteration 2, then register in PayPal Dashboard

---

## Recommendations for Master Plan

1. **Prioritize Iteration 1 Testing**
   - Database migration is highest risk
   - Allocate 30% of Iteration 1 time to testing and rollback planning
   - Create staging environment if not already available

2. **AI Upgrade Already Complete - Remove from Scope**
   - Claude Sonnet 4.5 is already deployed (found in reflection.ts)
   - Extended thinking already implemented for premium tier
   - Update vision document to reflect this completion
   - Reallocate estimated time (originally 2-3 hours) to other tasks

3. **Daily Limits Need UX Consideration**
   - Philosophy is sound ("prevent bingeing, encourage consistency")
   - But need clear messaging when limit reached
   - Consider "Why daily limits?" help text on pricing page

4. **Consider Iteration 2/3 as Parallel After Iteration 1**
   - Webhook handler (backend) and pricing page (frontend) could be built in parallel
   - Both depend on Iteration 1, but not on each other
   - Could reduce total calendar time (not effort)

5. **PayPal Sandbox Testing Critical**
   - Allocate dedicated QA time in Iteration 2
   - Test all webhook events manually
   - Verify subscription lifecycle end-to-end
   - Don't go to production without 100% confidence

6. **Rollback Strategy Essential**
   - What if PayPal integration fails in production?
   - Keep Stripe code commented, not deleted
   - Have environment variable to toggle payment provider
   - Can revert to "payments disabled" state safely

---

## Technology Recommendations

### Existing Codebase Findings

**Stack Detected:**
- Next.js 14 App Router (modern, well-supported)
- tRPC 11.6.0 (latest stable, excellent TypeScript support)
- Supabase (managed PostgreSQL, good for rapid development)
- Anthropic Claude API (already on Sonnet 4.5, premium model)

**Patterns Observed:**
- Middleware-based authorization (clean separation of concerns)
- tRPC procedures follow consistent naming (create, get, update, delete)
- Database operations use Supabase client (not raw SQL)
- Error handling with TRPCError (standard pattern)

**Opportunities:**
- PayPal REST API can be used directly (no SDK needed, reduces dependencies)
- Existing Stripe webhook structure is excellent template
- Type system already strong, leverage for PayPal types

**Constraints:**
- Must maintain Next.js App Router structure (no mixing with Pages Router)
- Database schema changes require Supabase migrations
- tRPC procedures must use existing middleware patterns

### PayPal Integration Technology Choices

**1. PayPal SDK vs REST API**
- **Recommendation:** Use REST API directly (fetch)
- **Rationale:**
  - No additional dependencies
  - Full control over requests
  - PayPal SDK (@paypal/checkout-server-sdk) is not well-maintained
  - REST API documentation is excellent
- **Implementation:** `server/lib/paypal.ts` handles all API calls

**2. Webhook Signature Verification**
- **Recommendation:** Use PayPal's verification algorithm (webhook event verification API)
- **Rationale:**
  - PayPal recommends calling their verification endpoint
  - More secure than manual certificate validation
  - Simpler implementation
- **Implementation:** Call `POST /v1/notifications/verify-webhook-signature`

**3. Subscription Plan Management**
- **Recommendation:** Create plans in PayPal Dashboard (manual), store IDs in env
- **Rationale:**
  - Plans rarely change (pricing updates are infrequent)
  - Dashboard provides better visibility
  - Reduces code complexity
- **Alternative:** Create plans via API in deployment script (for automation)

---

## Notes & Observations

### Positive Surprises

1. **AI Already Upgraded:** Claude Sonnet 4.5 + extended thinking already implemented! This removes 2-3 hours from estimated work and simplifies the plan significantly.

2. **Strong Foundation:** The existing tRPC + middleware architecture is well-designed. Adding PayPal procedures will be straightforward.

3. **Clean Separation:** Stripe code is already isolated, making removal/replacement clean.

### Concerns

1. **Tier Inconsistency:** Database function supports 4 tiers ('optimal' exists), but schema only allows 3. This needs cleanup in Iteration 1.

2. **Daily Limit Complexity:** Adding daily limits requires new state tracking (count + date). This is more complex than monthly limits and needs careful implementation.

3. **Migration Risk:** Renaming tiers from 'essential'/'premium' to 'pro'/'unlimited' affects database data, not just code. Must ensure existing subscriptions (if any) are migrated correctly.

### Strategic Insights

1. **Free Tier as Loss Leader:** Vision document mentions free tier costs ~$0.06/month in API usage. With 2 reflections max, this is acceptable acquisition cost.

2. **Daily Limits Philosophy:** "Reflections are sacred currency" - this is smart product design. Prevents abuse, encourages daily practice, aligns with app's meditative nature.

3. **PayPal Choice:** Given creator already has PayPal business account, this is pragmatic. Stripe would require new account setup, verification, etc.

4. **3-Tier Simplicity:** Reducing from 4 to 3 tiers is good UX. Clear value progression: Free (taste), Pro (serious user), Unlimited (power user).

---

## Critical Dependencies

**Between Iterations:**
- Iteration 2 CANNOT start until Iteration 1 database migration completes
- Iteration 3 CANNOT start until Iteration 2 checkout flow works in sandbox
- Webhook handler (Iteration 2) must be deployed before PayPal webhook registration

**Within Codebase:**
- `types/user.ts` → All routers, components (tier type definition)
- `lib/utils/constants.ts` → Middleware, frontend displays (tier limits)
- `server/lib/paypal.ts` → tRPC procedures, webhook handler (PayPal API client)
- `server/trpc/middleware.ts` → All protected procedures (tier enforcement)

**External Dependencies:**
- PayPal sandbox account (ready)
- PayPal products/plans created (TO DO in Iteration 1)
- PayPal webhook endpoint registered (TO DO in Iteration 2)
- Supabase database access (ready)

---

## Risks & Mitigations Summary

| Risk | Impact | Likelihood | Mitigation | Phase |
|------|--------|-----------|------------|-------|
| Database migration data loss | CRITICAL | LOW | Full backup, staging test, rollback script | Iteration 1 |
| Daily limit logic bugs | HIGH | MEDIUM | Extensive testing, logging, creator bypass | Iteration 1 |
| Webhook signature failure | CRITICAL | LOW | Follow PayPal docs, extensive sandbox testing | Iteration 2 |
| PayPal API errors | MEDIUM | MEDIUM | Retry logic, error handling, logging | Iteration 2 |
| Webhook delivery delays | MEDIUM | MEDIUM | Optimistic UI, polling, timeout handling | Iteration 3 |
| Tier renaming breaks code | MEDIUM | LOW | TypeScript types, codebase grep, testing | Iteration 1 |
| Frontend/backend version mismatch | HIGH | LOW | Deploy backend first, health checks | Iteration 3 |

---

*Exploration completed: 2025-11-30*
*This report informs master planning decisions for Plan-9*

---

## Key Takeaways for Master Planner

1. **Complexity is MEDIUM-HIGH** due to multiple interconnected changes, but existing patterns reduce risk
2. **3 iterations recommended** with clear separation: Foundation → Payment Flow → Frontend
3. **AI upgrade already complete** - removes work, simplifies scope
4. **Database migration is highest risk** - allocate extra testing time
5. **PayPal integration fits existing architecture well** - no major refactoring needed
6. **Daily limits add complexity** - new feature requiring careful state management
7. **Total estimated work: 18-24 hours** across 3 iterations
