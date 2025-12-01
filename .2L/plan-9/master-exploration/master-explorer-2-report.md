# Master Explorer 2 Report: Dependencies & Risk Assessment

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
Replace Stripe with PayPal subscriptions, implement 3-tier structure (free, pro, unlimited) with daily limits, and upgrade to Claude Sonnet 4.5 to enable monetization for Mirror of Dreams.

---

## Executive Summary

**Current State:** Mirror of Dreams has scaffolded Stripe infrastructure that was never activated. The product is functionally complete but cannot generate revenue.

**Migration Task:** Replace Stripe with PayPal while maintaining subscription features, simplify tier structure from 3 tiers to 3 tiers with NEW names (essential/premium → pro/unlimited), and upgrade AI model.

**Risk Level:** MEDIUM-HIGH
- Migration complexity: Stripe → PayPal requires complete rewrite of payment flow
- Data migration: Tier renaming affects database, types, and business logic
- No backward compatibility needed (Stripe never went live)
- AI upgrade: Low risk (same API, just model ID change)

**Recommended Approach:** Multi-iteration with careful validation at each step

---

## Current Dependencies Analysis

### 1. Payment Infrastructure (Currently Installed - UNUSED)

#### Stripe SDK
```json
"stripe": "^18.3.0"
```

**Status:** Installed but never activated
**Evidence:**
- Comment in `server/trpc/routers/subscriptions.ts`: "Stripe temporarily disabled - will be replaced with PayPal"
- Webhook handler exists at `app/api/webhooks/stripe/route.ts` (300 lines, comprehensive)
- No live Stripe credentials in `.env.example`

**Files affected by Stripe:**
- `app/api/webhooks/stripe/route.ts` (webhook handler - 300 lines)
- `server/trpc/routers/subscriptions.ts` (subscription router - minimal, mostly stubs)
- `types/subscription.ts` (TypeScript types with Stripe references)
- Database schema has NO stripe-specific columns (uses generic `subscription_id`)

**Key finding:** Clean migration path - Stripe code can be completely replaced without data migration issues.

---

### 2. AI Infrastructure (Currently Active)

#### Anthropic SDK
```json
"@anthropic-ai/sdk": "^0.52.0"
```

**Current Usage:**
- Model: `claude-sonnet-4-5-20250929` (ALREADY USING 4.5!)
- Location: `server/trpc/routers/reflection.ts` line 93
- Extended thinking: Already implemented for premium tier (line 100+)

**CRITICAL FINDING:** The codebase is ALREADY using Claude Sonnet 4.5 and extended thinking is ALREADY implemented. Vision assumption about Sonnet 4 is incorrect.

**Evidence from `reflection.ts`:**
```typescript
model: 'claude-sonnet-4-5-20250929',
temperature: 1,
max_tokens: shouldUsePremium ? 6000 : 4000,
```

**Implication:** AI upgrade is NOT needed - already done. Focus can be 100% on PayPal migration.

---

### 3. Database Layer

#### Supabase
```json
"@supabase/supabase-js": "^2.50.4"
```

**Current Schema (from `supabase/migrations/20250121000000_initial_schema.sql`):**

**Users table - Subscription columns:**
```sql
tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'essential', 'premium')),
subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trialing')),
subscription_id TEXT, -- Generic, works for both Stripe and PayPal
subscription_period TEXT DEFAULT 'monthly' CHECK (subscription_period IN ('monthly', 'yearly')),
subscription_started_at TIMESTAMP WITH TIME ZONE,
subscription_expires_at TIMESTAMP WITH TIME ZONE,
```

**CRITICAL:** No `stripe_customer_id` or `stripe_subscription_id` columns in schema!
- Schema uses generic `subscription_id`
- Webhook handler references `stripe_customer_id` and `stripe_subscription_id` but these columns DON'T EXIST in the schema
- This suggests Stripe was scaffolded but never actually used

**Migration requirement:**
- Update tier CHECK constraint: `('free', 'essential', 'premium')` → `('free', 'pro', 'unlimited')`
- Optionally add `paypal_customer_id`, `paypal_subscription_id` for clarity (not strictly necessary)
- Update all tier references in codebase

---

### 4. TypeScript Type System

**Current Tier Definition (types/user.ts line 3):**
```typescript
export type SubscriptionTier = 'free' | 'essential' | 'premium';
```

**Constants (lib/utils/constants.ts lines 3-7):**
```typescript
export const TIER_LIMITS = {
  free: 10,
  essential: 50,
  premium: Infinity,
} as const;
```

**NEW tier structure from vision:**
```typescript
// Must become:
free: { dreams: 2, reflections: 2, daily: 2 }
pro: { dreams: 5, reflections: 30, daily: 1 }
unlimited: { dreams: Infinity, reflections: 60, daily: 2 }
```

**Breaking change:** Tier limits structure needs complete redesign to support:
- Monthly reflection limits
- Daily reflection limits (NEW feature)
- Dream limits (already tracked)
- Feature gates (evolution reports, visualizations)

---

## New Dependencies Required

### 1. PayPal Integration - NO SDK NEEDED

**Recommendation:** Use PayPal REST API directly via `fetch`
- **Why:** PayPal's official SDK (`@paypal/checkout-server-sdk`) is dated and adds unnecessary complexity
- **Alternative:** Direct REST API calls (modern, lightweight, full control)

**PayPal REST API v2 Endpoints:**
```
POST /v1/oauth2/token - Get access token
POST /v1/billing/subscriptions - Create subscription
GET /v1/billing/subscriptions/{id} - Get subscription details
POST /v1/billing/subscriptions/{id}/cancel - Cancel subscription
POST /v1/billing/subscriptions/{id}/revise - Change plan (upgrade/downgrade)
```

**Environment Variables Required (NEW):**
```bash
# PayPal API Credentials
PAYPAL_CLIENT_ID=AYZUnPSWX22... (already configured)
PAYPAL_CLIENT_SECRET=EAurh1D6v... (already configured)
PAYPAL_ENVIRONMENT=sandbox (already configured)

# PayPal Plan IDs (NEED TO BE CREATED)
PAYPAL_PRO_MONTHLY_PLAN_ID=TODO
PAYPAL_PRO_YEARLY_PLAN_ID=TODO
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=TODO
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=TODO

# PayPal Webhook (NEED TO BE CREATED)
PAYPAL_WEBHOOK_ID=TODO
```

**Status:** Credentials exist in `.env.example`, but plan IDs need creation

---

### 2. No Additional NPM Packages Required

**All current dependencies are sufficient:**
- `zod` for validation ✓
- `@trpc/server` for API layer ✓
- `@supabase/supabase-js` for database ✓
- `next` for API routes (webhook handler) ✓

**Risk mitigation:** No new dependencies = no version conflicts, no security vulnerabilities, no learning curve

---

## Technical Risks

### Risk 1: Tier Structure Migration Complexity
- **Severity:** HIGH
- **Description:** Changing tier names from essential/premium to pro/unlimited affects 50+ files across database, types, constants, UI components, and business logic. High risk of missing references causing runtime errors.
- **Impact:**
  - Database CHECK constraint failures if tier names don't match
  - TypeScript compilation errors if types aren't updated
  - UI shows wrong tier names/limits
  - Logic gates fail (e.g., "if tier === 'essential'" breaks)
- **Mitigation:**
  1. Create comprehensive grep audit of all tier references
  2. Use database migration with TRANSACTION to update tier names atomically
  3. Update TypeScript types FIRST before any code changes
  4. Create tier mapping helper: `legacyToNew = { essential: 'pro', premium: 'unlimited' }`
  5. Test with real database before production migration
- **Recommendation:** Allocate 20% of development time to tier migration validation

---

### Risk 2: PayPal Webhook Reliability
- **Severity:** MEDIUM-HIGH
- **Description:** PayPal webhooks can be delayed, duplicated, or arrive out of order. If webhook processing fails, user's subscription status becomes inconsistent with PayPal reality.
- **Impact:**
  - User pays but doesn't get upgraded (revenue loss + support burden)
  - Subscription canceled but user retains access (revenue loss)
  - Duplicate webhook events cause race conditions
- **Mitigation:**
  1. Implement idempotency: Store webhook event IDs in database to detect duplicates
  2. Add webhook signature verification (security + authenticity)
  3. Graceful degradation: Optimistic UI updates, webhook confirms
  4. Polling fallback: Periodic sync with PayPal subscription API to catch missed webhooks
  5. Manual override: Admin panel to fix subscription state if needed
  6. Detailed logging: Log every webhook event with timestamp and payload
- **Recommendation:** Build webhook monitoring dashboard to track webhook health

---

### Risk 3: PayPal API Access Token Expiration
- **Severity:** MEDIUM
- **Description:** PayPal access tokens expire after ~9 hours. If token expires mid-request, API calls fail. Unlike Stripe SDK which handles this automatically, manual REST API requires custom token refresh logic.
- **Impact:**
  - Checkout creation fails → user can't subscribe
  - Subscription cancel fails → user stuck
  - Random failures during low-traffic periods (token expired between uses)
- **Mitigation:**
  1. Create `server/lib/paypal.ts` with token management:
     ```typescript
     let cachedToken: { token: string, expiresAt: number } | null = null;
     async function getAccessToken() {
       if (cachedToken && cachedToken.expiresAt > Date.now()) {
         return cachedToken.token;
       }
       // Fetch new token, cache it
     }
     ```
  2. Refresh token 5 minutes before expiry (safety buffer)
  3. Retry logic: If API call fails with 401, refresh token and retry once
  4. Store token in memory (not database - security risk)
- **Recommendation:** Create token manager as FIRST task before any PayPal integration

---

### Risk 4: Subscription State Synchronization
- **Severity:** MEDIUM
- **Description:** User's subscription state lives in TWO places: PayPal (source of truth) and local database (for app logic). If these get out of sync, chaos ensues.
- **Impact:**
  - User canceled in PayPal but database says active → User gets free access
  - User upgraded in PayPal but database says old tier → User can't use features they paid for
  - Webhook missed → Permanent desync until manual intervention
- **Mitigation:**
  1. Single source of truth: PayPal subscription status = primary, database = cache
  2. Webhook-driven updates: Never manually update subscription status without PayPal event
  3. Reconciliation job: Daily cron job to sync database with PayPal API
  4. Status check on critical operations: Before generating reflection, verify subscription with PayPal if database shows canceled
  5. User-visible status: Show "Subscription pending confirmation" during webhook delay
- **Recommendation:** Add `/admin/sync-subscriptions` endpoint to manually trigger reconciliation

---

### Risk 5: Daily Limit Implementation Complexity (NEW Feature)
- **Severity:** MEDIUM
- **Description:** Vision introduces daily reflection limits (Pro: 1/day, Unlimited: 2/day) - a feature that doesn't currently exist. Requires new tracking mechanism beyond monthly limits.
- **Impact:**
  - Need to track "reflections created today" per user
  - Timezone handling: What is "today" for a user in Israel vs California?
  - Database schema change: Add `last_reflection_date` or create daily usage table
  - Reset logic: How to reset daily counter at midnight (user's timezone)
  - Potential for abuse: User could change timezone to bypass limits
- **Mitigation:**
  1. Use user's timezone (stored in `users.timezone` column) for "today" calculation
  2. Track last reflection timestamp, compare to current date in user's timezone
  3. Simple approach: Check if `last_reflection_at` is same calendar day as `now()` in user timezone
  4. Database function: `check_daily_limit(user_id, tier, timezone)` returns boolean
  5. No separate table needed - use existing `last_reflection_at` timestamp
- **Recommendation:** Implement daily limits in iteration 2 AFTER core payment flow works

---

### Risk 6: Breaking Changes to Existing Features
- **Severity:** LOW-MEDIUM
- **Description:** Payment migration shouldn't affect existing features (reflection creation, evolution reports, visualizations) but risky code changes could introduce regressions.
- **Impact:**
  - Reflection creation breaks due to tier name changes
  - Evolution reports fail to generate
  - Dashboard displays incorrect usage limits
  - Auth system breaks if tier validation fails
- **Mitigation:**
  1. Create feature flag: `ENABLE_PAYPAL_PAYMENTS=false` to test migration incrementally
  2. Keep Stripe code until PayPal proven working (rename file, don't delete)
  3. Comprehensive test suite: Test all existing features after tier migration
  4. Staged rollout: Test with demo accounts before real users
  5. Rollback plan: Database migration with DOWN script to revert tier names
- **Recommendation:** No breaking changes - make migration additive, not destructive

---

### Risk 7: PayPal Plan Creation (External Dependency)
- **Severity:** LOW-MEDIUM
- **Description:** Vision says plan IDs "TODO" - PayPal subscription plans must be created manually in PayPal Dashboard or via API before any checkout can work.
- **Impact:**
  - Can't create subscriptions without valid Plan IDs
  - Plan IDs are environment-specific (sandbox vs live)
  - Wrong pricing set in PayPal = revenue mismatch
  - Can't test end-to-end until plans exist
- **Mitigation:**
  1. Create plans via PayPal Dashboard (easier than API for first time)
  2. Document plan creation process in `.2L/plan-9/PAYPAL_SETUP.md`
  3. Store plan IDs in `.env.example` as documentation
  4. Verify plan pricing matches vision:
     - Pro Monthly: $15/month
     - Pro Yearly: $150/year
     - Unlimited Monthly: $29/month
     - Unlimited Yearly: $290/year
  5. Create sandbox plans first for testing, then live plans for production
- **Recommendation:** Make plan creation FIRST task in iteration 1 (blocking dependency)

---

## Migration Considerations

### 1. Database Schema Changes

#### Required Changes:
```sql
-- Update tier constraint (breaking change)
ALTER TABLE users
DROP CONSTRAINT users_tier_check;

ALTER TABLE users
ADD CONSTRAINT users_tier_check
CHECK (tier IN ('free', 'pro', 'unlimited'));

-- Optional: Add PayPal-specific columns for clarity
ALTER TABLE users
ADD COLUMN paypal_subscription_id TEXT,
ADD COLUMN paypal_customer_id TEXT;

-- Update existing data (if any test data exists)
UPDATE users SET tier = 'pro' WHERE tier = 'essential';
UPDATE users SET tier = 'unlimited' WHERE tier = 'premium';
```

#### Migration Strategy:
1. **Development:** Run migration locally first, test thoroughly
2. **Staging:** Run on staging database, verify app still works
3. **Production:** Run during low-traffic window (early morning)
4. **Rollback:** Keep rollback script ready:
   ```sql
   UPDATE users SET tier = 'essential' WHERE tier = 'pro';
   UPDATE users SET tier = 'premium' WHERE tier = 'unlimited';
   -- Restore old constraint
   ```

---

### 2. Type System Updates

#### Critical Files to Update:
1. `types/user.ts` - Update `SubscriptionTier` type
2. `types/subscription.ts` - Replace Stripe types with PayPal types
3. `lib/utils/constants.ts` - Update `TIER_LIMITS` structure
4. All components referencing tier names (50+ files)

#### Update Order (to avoid TypeScript errors):
1. Update types first: `SubscriptionTier = 'free' | 'pro' | 'unlimited'`
2. Update constants: New tier limit structure
3. Update database schema migration
4. Update business logic (tier checks)
5. Update UI components
6. Update tests

---

### 3. Stripe Code Removal Strategy

#### Option A: Complete Deletion (Recommended)
- Delete `app/api/webhooks/stripe/route.ts`
- Remove Stripe types from `types/subscription.ts`
- Uninstall Stripe package: `npm uninstall stripe`
- Remove Stripe env vars from `.env.example`

**Pros:** Clean codebase, no confusion
**Cons:** Can't reference old code if needed

#### Option B: Deprecation (Safer)
- Rename: `route.ts` → `route.ts.deprecated`
- Add comment: "// DEPRECATED: Stripe never went live, replaced by PayPal"
- Keep for 1-2 releases, then delete

**Pros:** Can reference if needed during migration
**Cons:** Code clutter

**Recommendation:** Option A (complete deletion) - Stripe never went live, no data to preserve

---

### 4. Environment Variables

#### Current State (from `.env.example`):
```bash
# PayPal (already present)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENVIRONMENT=sandbox

# OLD naming (essential/premium)
PAYPAL_ESSENTIAL_MONTHLY_PLAN_ID=P-xxxxxxxxxxxxxxxxxxxx
PAYPAL_ESSENTIAL_YEARLY_PLAN_ID=P-xxxxxxxxxxxxxxxxxxxx
PAYPAL_PREMIUM_MONTHLY_PLAN_ID=P-xxxxxxxxxxxxxxxxxxxx
PAYPAL_PREMIUM_YEARLY_PLAN_ID=P-xxxxxxxxxxxxxxxxxxxx
```

#### NEW naming (pro/unlimited):
```bash
# PayPal Plan IDs - 3-tier structure
PAYPAL_PRO_MONTHLY_PLAN_ID=TODO
PAYPAL_PRO_YEARLY_PLAN_ID=TODO
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=TODO
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=TODO
PAYPAL_WEBHOOK_ID=TODO
```

**Action Required:**
1. Update `.env.example` with new variable names
2. Create new plans in PayPal Dashboard with correct names
3. Update all code references from `ESSENTIAL` → `PRO`, `PREMIUM` → `UNLIMITED`

---

### 5. Pricing Page Updates

**Current State (from `app/pricing/page.tsx`):**
- 3 tiers: Free ($0), Premium ($9.99), Pro ($29.99)
- Limits from constants: `TIER_LIMITS.free`, `TIER_LIMITS.essential`, `TIER_LIMITS.premium`

**NEW State (from vision):**
- 3 tiers: Free ($0), Pro ($15), Unlimited ($29)
- NEW limits structure:
  - Free: 2 dreams, 2 reflections/month, no daily limit
  - Pro: 5 dreams, 30 reflections/month, 1/day max
  - Unlimited: Unlimited dreams, 60 reflections/month, 2/day max

**Breaking Changes:**
1. Pricing changes: $9.99 → $15 (Pro), $29.99 → $29 (Unlimited, slight decrease)
2. Tier names change
3. Limits display must show BOTH monthly AND daily limits
4. Feature gates: Free tier blocked from evolution reports and visualizations

**Migration Path:**
1. Update tier names in JSX
2. Update pricing numbers
3. Add daily limit display: "Max 1 reflection per day" for Pro
4. Update feature list to reflect gating rules

---

## Dependency Graph

```
Foundation Layer (MUST DO FIRST)
├── Create PayPal Products & Plans (blocking all checkout)
│   ├── Pro Monthly: $15/mo
│   ├── Pro Yearly: $150/yr
│   ├── Unlimited Monthly: $29/mo
│   └── Unlimited Yearly: $290/yr
└── Update Environment Variables
    └── Add plan IDs to .env.local

↓

Database Migration (BEFORE CODE CHANGES)
├── Update tier CHECK constraint
├── Optional: Add PayPal columns
└── Migrate test data (essential→pro, premium→unlimited)

↓

Type System Updates (BEFORE BUSINESS LOGIC)
├── types/user.ts - SubscriptionTier type
├── types/subscription.ts - Replace Stripe with PayPal types
└── lib/utils/constants.ts - TIER_LIMITS structure

↓

Core Payment Infrastructure (Iteration 1)
├── server/lib/paypal.ts (token management)
├── server/trpc/routers/subscriptions.ts (checkout, cancel)
└── app/api/webhooks/paypal/route.ts (webhook handler)

↓

Business Logic Updates (Iteration 2)
├── Daily limit implementation
├── Feature gating (evolution, visualizations)
└── Tier upgrade/downgrade logic

↓

UI Updates (Iteration 2-3)
├── Pricing page (new tiers, limits)
├── Dashboard (subscription status)
├── Profile page (manage subscription)
└── All tier badge displays
```

---

## Environment Variables

### Current State
```bash
# Anthropic (ACTIVE)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase (ACTIVE)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth (ACTIVE)
JWT_SECRET=...

# PayPal (CONFIGURED, NOT USED YET)
PAYPAL_CLIENT_ID=AYZUnPSWX22-fy_ed2k_MfbiZPeefY9bw3e2FuR9nsCxe-1ZBENJLU-QM_ZrxKtuo9BhFBZvXrUjAIcv
PAYPAL_CLIENT_SECRET=EAurh1D6v_FqNzArU4MqNS531xyGmQpkXaox5kVacxhSHKYjLJz04HDaoTyoe9pgx-PId-EibJbtAhRb
PAYPAL_ENVIRONMENT=sandbox

# PayPal Plans (OLD NAMING - NEEDS UPDATE)
PAYPAL_ESSENTIAL_MONTHLY_PLAN_ID=P-95L64765VN180134HNEV27CQ
PAYPAL_ESSENTIAL_YEARLY_PLAN_ID=P-1H364597N0782180RNEV27FY
PAYPAL_PREMIUM_MONTHLY_PLAN_ID=P-09J126906Y482680TNEV27IY
PAYPAL_PREMIUM_YEARLY_PLAN_ID=P-4NY30898FG7121930NEV27MA
PAYPAL_WEBHOOK_ID=  # Empty, needs creation
```

### Required Changes
```bash
# Replace old plan variable names
PAYPAL_PRO_MONTHLY_PLAN_ID=TODO  # Create new plan at $15/mo
PAYPAL_PRO_YEARLY_PLAN_ID=TODO   # Create new plan at $150/yr
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=TODO  # Create new plan at $29/mo
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=TODO   # Create new plan at $290/yr

# Create webhook endpoint in PayPal Dashboard
PAYPAL_WEBHOOK_ID=TODO

# App URL for PayPal redirects (likely already exists)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### What Needs to be Added
1. Create 4 new subscription plans in PayPal Dashboard (different pricing)
2. Create webhook endpoint pointing to `/api/webhooks/paypal`
3. Update `.env.example` to remove old plan names, add new ones

---

## Recommendations

### 1. Multi-Iteration Breakdown (STRONGLY RECOMMENDED)

**Why:** Too many moving parts to do safely in one iteration
- Tier migration alone touches 50+ files
- PayPal integration requires webhook testing
- Daily limits are a new feature with timezone complexity

**Suggested Breakdown:**

#### Iteration 1: PayPal Foundation (5-7 hours)
- Create PayPal plans (products, subscription plans)
- Build `server/lib/paypal.ts` (token manager)
- Implement basic checkout flow
- Build webhook handler (all events)
- Update env variables

**Success Criteria:** User can subscribe via PayPal, webhook updates database

#### Iteration 2: Tier Structure Migration (4-6 hours)
- Database migration (tier names)
- Type system updates
- Update all tier references in code
- Update pricing page
- Implement daily limits

**Success Criteria:** All tier names updated, daily limits work, no TypeScript errors

#### Iteration 3: Subscription Management (3-5 hours)
- Cancel subscription
- Reactivate subscription (if canceled)
- Upgrade/downgrade flows
- Profile page subscription UI
- Feature gating (evolution, visualizations)

**Success Criteria:** Users can manage their subscriptions

---

### 2. Create PayPal Products FIRST (Critical Path)

**Why:** Nothing works without valid Plan IDs
**When:** Before any code changes
**How:**
1. Log into PayPal Developer Dashboard
2. Create 2 products:
   - "Mirror of Dreams Pro"
   - "Mirror of Dreams Unlimited"
3. Create 4 subscription plans:
   - Pro Monthly: $15/mo
   - Pro Yearly: $150/yr
   - Unlimited Monthly: $29/mo
   - Unlimited Yearly: $290/yr
4. Copy Plan IDs to `.env.local`

---

### 3. Don't Delete Stripe Code Until PayPal Proven

**Why:** Safety net during migration
**When:** Keep for 1-2 weeks after PayPal goes live
**How:** Rename files to `.deprecated`, add comment

---

### 4. Implement Idempotency from Day 1

**Why:** Webhooks can be duplicated or delayed
**How:**
```typescript
// In webhook handler
const eventId = event.id;
const { data: existing } = await supabase
  .from('webhook_events')
  .select('id')
  .eq('event_id', eventId)
  .single();

if (existing) {
  return; // Already processed
}

// Process webhook...

// Mark as processed
await supabase.from('webhook_events').insert({ event_id: eventId });
```

---

### 5. Feature Flag the Migration

**Why:** Test incrementally without breaking production
**How:**
```typescript
// In .env
ENABLE_PAYPAL_PAYMENTS=false

// In code
if (process.env.ENABLE_PAYPAL_PAYMENTS === 'true') {
  // Use PayPal
} else {
  // Show "Coming soon" message
}
```

---

### 6. Comprehensive Testing Checklist

#### Before Production:
- [ ] Sandbox: Complete subscribe flow (all 4 plans)
- [ ] Sandbox: Cancel subscription (verify access until period end)
- [ ] Sandbox: Webhook testing (all event types)
- [ ] Sandbox: Token refresh after 9 hours
- [ ] Live: Small test transaction ($1 plan)
- [ ] Live: Cancel test subscription
- [ ] Load testing: 100 concurrent checkouts
- [ ] Security: Webhook signature verification
- [ ] Edge cases: Webhook arrives before redirect, duplicate webhooks

---

### 7. No AI Upgrade Needed (Already Done)

**Finding:** Code already uses `claude-sonnet-4-5-20250929` and implements extended thinking
**Action:** Remove AI upgrade from scope, focus 100% on payments
**Time Saved:** 2-3 hours

---

## Notes & Observations

### 1. Clean Slate Advantage
- Stripe never went live = no user data to migrate
- Can delete Stripe code completely without risk
- No backward compatibility constraints

### 2. Well-Architected Foundation
- Generic `subscription_id` column works for any provider
- Webhook handler pattern already established
- tRPC router structure ready for new procedures

### 3. Tier Limit Structure Needs Redesign
- Current: Simple number per tier
- Needed: Complex object with monthly, daily, feature gates
- Suggests creating `TierConfig` type with full feature matrix

### 4. Daily Limits - Timezone Complexity
- User timezone already stored in database
- Need to handle "today" correctly across timezones
- Recommend server-side timezone conversion (don't trust client)

### 5. PayPal Plan IDs Already Exist (Sort Of)
- `.env.example` shows plan IDs for essential/premium at OLD prices
- These can't be reused (wrong pricing, wrong names)
- Must create NEW plans with correct 3-tier pricing

### 6. Strong Type Safety
- Extensive use of Zod for validation
- TypeScript strict mode enabled
- Type errors will catch missed tier references

---

## Iteration Breakdown Recommendation

### Recommendation: 3 ITERATIONS

**Rationale:**
- Too complex for 1 iteration (15+ features, tier migration, new payment provider)
- Not complex enough for 4+ iterations (no external API integrations beyond PayPal)
- Natural separation: Foundation → Migration → Management

### Iteration 1: PayPal Foundation (Day 1-2, 6-8 hours)
**Focus:** Get basic PayPal checkout working

**Scope:**
- Create PayPal products & plans (manual, via Dashboard)
- Build `server/lib/paypal.ts` (token manager, API wrapper)
- Implement `subscriptions.createCheckout` (tRPC procedure)
- Build `app/api/webhooks/paypal/route.ts` (webhook handler)
- Handle core events: ACTIVATED, CANCELLED, EXPIRED
- Update env variables

**Success Criteria:**
- User can click "Upgrade to Pro" and complete PayPal checkout
- Webhook updates user's tier in database
- User sees new tier on dashboard

**Risk Level:** MEDIUM (new payment provider, webhook testing needed)

---

### Iteration 2: Tier Structure Migration (Day 3, 4-6 hours)
**Focus:** Migrate from essential/premium to pro/unlimited, implement daily limits

**Scope:**
- Database migration (update tier constraint)
- Update TypeScript types (`SubscriptionTier`, `TIER_LIMITS`)
- Implement daily limit logic
- Update pricing page (new tiers, pricing, limits)
- Update all UI components (tier badges, limit displays)
- Feature gating (evolution reports, visualizations for paid tiers only)
- Update `.env.example` with new plan variable names

**Success Criteria:**
- All tier names updated across codebase
- Daily limits prevent reflection creation after limit reached
- Free tier blocked from evolution/visualizations
- No TypeScript errors

**Risk Level:** MEDIUM-HIGH (touches many files, breaking changes)

---

### Iteration 3: Subscription Management (Day 4-5, 3-5 hours)
**Focus:** Users can manage their subscriptions

**Scope:**
- Cancel subscription (tRPC procedure)
- Reactivate subscription (if canceled)
- Upgrade/downgrade flows (change plan)
- Profile page subscription UI
- Subscription status display (dashboard card)
- Handle edge cases (past_due, trialing)

**Success Criteria:**
- User can cancel subscription and keep access until period end
- User can upgrade from Pro to Unlimited
- Profile page shows next billing date, cancel button

**Risk Level:** LOW-MEDIUM (builds on iteration 1 foundation)

---

## Critical Dependencies Between Iterations

**Iteration 1 → Iteration 2:**
- Must have working PayPal checkout before updating tier names
- Webhook handler must exist before tier migration (to test new tiers)

**Iteration 2 → Iteration 3:**
- Tier names must be updated before subscription management (upgrade/downgrade uses tier names)
- Daily limits must work before allowing plan changes

**No parallel work possible:** Each iteration depends on previous completion

---

## Final Risk Assessment

### Overall Project Risk: MEDIUM-HIGH

**Why:**
- Multiple breaking changes (tier migration)
- New payment provider (PayPal vs Stripe)
- New feature (daily limits with timezone handling)
- Webhook reliability concerns

**Risk Mitigation Success Factors:**
1. Multi-iteration approach (reduces scope per iteration)
2. Comprehensive testing at each stage
3. Feature flags for incremental rollout
4. No production users yet (can break things safely)
5. Clean slate (no Stripe data to migrate)

**Confidence Level:** 7/10
- Strong foundation (well-architected codebase)
- Clear vision (detailed requirements)
- No external blockers (PayPal account ready)
- But: Tier migration touches many files (risk of regressions)

---

**Exploration completed:** 2025-11-30
**This report informs master planning decisions for Plan-9 PayPal migration**
