# Project Vision: Mirror of Dreams - PayPal Subscriptions + Sonnet 4.5 Upgrade

**Created:** 2025-11-30
**Plan:** plan-9
**Current State:** 9/10 - Beautiful, complete product with Stripe payment infrastructure (unused)
**Target State:** 9.5/10 - Production-ready with working PayPal subscription payments + upgraded AI
**Focus:** Replace Stripe with PayPal, implement 4-tier subscription structure, upgrade to Claude Sonnet 4.5

---

## Problem Statement

Mirror of Dreams has achieved aesthetic and functional completeness (Plans 1-8), but lacks a working payment system. The existing Stripe integration was scaffolded but never activated. The product owner (Ahiya) already has an active PayPal business account ready to receive payments.

**Current gaps preventing monetization:**

### 1. Payment Infrastructure Not Functional (P0 - BLOCKING)
- Stripe integration exists in code but was never completed
- Comment in `subscriptions.ts`: "Stripe temporarily disabled - will be replaced with PayPal"
- No working checkout flow for users to upgrade
- Pricing page CTAs lead nowhere
- **Result:** Cannot monetize users, product remains free-only

### 2. No PayPal Integration (P0 - CRITICAL)
- PayPal SDK not installed
- No PayPal webhook handler
- No subscription plan creation in PayPal
- No checkout/billing portal integration
- **Result:** Need to build PayPal integration from scratch

### 3. Subscription Management Incomplete (P1)
- `subscriptions.ts` router has placeholder comments
- Cancel, reactivate, upgrade procedures not implemented
- No customer billing portal access
- **Result:** Users can't manage their subscriptions

### 4. Tier Structure Needs Simplification (P1)
- Current codebase has: `free`, `essential`, `premium`
- New 3-tier structure: `free`, `pro`, `unlimited`
- Need to rename `essential` → `pro`, `premium` → `unlimited`
- Daily limits not implemented (need max 1/day for Pro, 2/day for Unlimited)
- Evolution/Visualization access not tied to tier
- **Result:** Tier logic needs updating for new structure

### 5. AI Model Outdated (P1)
- Currently using Claude Sonnet 4
- Claude Sonnet 4.5 available with improved quality (same pricing!)
- Extended thinking not implemented for higher tiers
- **Result:** Not delivering maximum AI value to premium users

---

## Subscription Tiers - 3-Tier Structure (Simplified)

### Free: "Dream Explorer" ($0/month)
- 2 dreams maximum
- 2 reflections/month
- **No daily limit** (only 2/month anyway)
- ❌ No evolution reports
- ❌ No visualizations
- **Claude Sonnet 4.5** (standard)
- **API Cost:** ~$0.06/month (loss leader)
- **Purpose:** Taste the magic, feel the limitation, upgrade for more

### Pro: "Dream Builder" ($15/month or $150/year)
- 5 dreams maximum
- 30 reflections/month
- **Max 1 reflection/day** (encourages daily ritual, prevents bingeing)
- ✅ Evolution reports unlocked
- ✅ Visualizations unlocked
- **Claude Sonnet 4.5** (standard)
- **API Cost:** ~$2.50/month | **Gross Margin: 83%**
- **Purpose:** Daily reflector, covers 95% of users

### Unlimited: "Dream Architect" ($29/month or $290/year)
- **Unlimited dreams**
- 60 reflections/month
- **Max 2 reflections/day** (for intense periods)
- ✅ Evolution reports unlocked
- ✅ Visualizations unlocked
- **Claude Sonnet 4.5 + Extended Thinking** (deeper insights)
- **API Cost:** ~$6.00/month | **Gross Margin: 79%**
- **Purpose:** Power users, coaches, serious dreamers

---

## Daily Limits Philosophy

**"Reflections are sacred currency"**

- Daily limits prevent binge-reflecting and encourage consistent practice
- Pro (1/day): Perfect for building a daily reflection habit
- Unlimited (2/day): For mornings AND evenings, or intense growth periods
- Spacing reflections = better insights, healthier relationship with the tool

---

## Target Users

**Primary user:** Ahiya (creator, business owner)
- Has active PayPal business account
- Needs working payment flow to monetize Mirror of Dreams
- Wants simple subscription management

**Secondary users:** Premium/Pro subscribers
- Want seamless checkout experience
- Need ability to manage subscriptions (cancel, upgrade)
- Expect professional billing experience

**Tertiary users:** Free tier users considering upgrade
- See pricing page with tier comparison
- Need clear value proposition to convert
- Expect smooth upgrade flow

---

## Core Value Proposition

**Enable Mirror of Dreams to generate revenue** through PayPal subscription billing - a complete payment integration that allows users to upgrade from Free to Essential/Premium tiers, manage their subscriptions, and receive professional billing experiences.

**The payment system must:**
1. **Work** - Users can actually pay and get upgraded
2. **Be Simple** - Checkout completes in <30 seconds
3. **Be Secure** - PayPal handles all sensitive payment data
4. **Be Manageable** - Users can cancel/upgrade via billing portal
5. **Be Reliable** - Webhooks handle all state changes automatically

---

## Feature Breakdown

### Must-Have (Plan-9 MVP)

#### 1. **PayPal Product & Plan Setup** - NEEDS RECREATION
- **Description:** Create subscription products and plans in PayPal for 3-tier structure
- **User story:** As the business owner, I want subscription plans configured in PayPal so users can subscribe
- **Status:** NEEDS RECREATION - New 3-tier structure with different pricing
- **Acceptance criteria:**
  - [ ] Create "Pro" product in PayPal (rename/recreate from Essential)
  - [ ] Create "Unlimited" product in PayPal (rename/recreate from Premium)
  - [ ] Create subscription plans with CORRECT pricing:
    - **Pro Monthly:** $15/month → TODO
    - **Pro Yearly:** $150/year → TODO
    - **Unlimited Monthly:** $29/month → TODO
    - **Unlimited Yearly:** $290/year → TODO
  - [ ] Store Plan IDs in environment variables
  - [ ] Verify plans visible in PayPal Dashboard (manual check)

**Note:** Previously created plans at wrong prices can be deactivated or ignored.

#### 2. **Environment Configuration** - COMPLETE
- **Description:** Configure all PayPal credentials and plan IDs
- **User story:** As a developer, I want all PayPal config in env variables so deployment is simple
- **Status:** DONE - All env variables configured in `.env.local` and `.env.example`
- **Acceptance criteria:**
  - [x] Add to `.env.local` and `.env.example`:
    ```
    PAYPAL_CLIENT_ID=AYZUnPSWX22-fy_ed2k_MfbiZPeefY9bw3e2FuR9nsCxe-1ZBENJLU-QM_ZrxKtuo9BhFBZvXrUjAIcv
    PAYPAL_CLIENT_SECRET=EAurh1D6v_FqNzArU4MqNS531xyGmQpkXaox5kVacxhSHKYjLJz04HDaoTyoe9pgx-PId-EibJbtAhRb
    PAYPAL_ENVIRONMENT=sandbox
    PAYPAL_ESSENTIAL_MONTHLY_PLAN_ID=P-95L64765VN180134HNEV27CQ
    PAYPAL_ESSENTIAL_YEARLY_PLAN_ID=P-1H364597N0782180RNEV27FY
    PAYPAL_PREMIUM_MONTHLY_PLAN_ID=P-09J126906Y482680TNEV27IY
    PAYPAL_PREMIUM_YEARLY_PLAN_ID=P-4NY30898FG7121930NEV27MA
    PAYPAL_WEBHOOK_ID=  # To be created when webhook is set up
    ```
  - [x] Remove/deprecate Stripe env variables from `.env.example`
  - [x] Update `.env.example` documentation

#### 3. **PayPal SDK Integration**
- **Description:** Install and configure PayPal SDK for server-side operations
- **User story:** As a developer, I want PayPal SDK available for creating subscriptions
- **Acceptance criteria:**
  - [ ] Install `@paypal/checkout-server-sdk` or use REST API directly
  - [ ] Create `server/lib/paypal.ts` with:
    - PayPal client initialization
    - Access token management (refresh before expiry)
    - Helper functions for common operations
  - [ ] Environment-aware (sandbox vs live)
  - [ ] Error handling for API failures

#### 4. **Checkout Flow - Create Subscription**
- **Description:** Allow users to subscribe via PayPal checkout
- **User story:** As a free user, I want to upgrade to Premium so I can get more reflections
- **Acceptance criteria:**
  - [ ] Create tRPC procedure: `subscriptions.createCheckout`
    - Input: tier ('pro' | 'unlimited'), period ('monthly' | 'yearly')
    - Returns: PayPal approval URL
  - [ ] User clicks "Upgrade" on pricing page
  - [ ] Redirected to PayPal checkout
  - [ ] User approves subscription in PayPal
  - [ ] Redirected back to app with success/cancel status
  - [ ] Success: User tier updated, subscription active
  - [ ] Cancel: User returns to pricing page, no changes

#### 5. **PayPal Webhook Handler**
- **Description:** Handle PayPal webhook events for subscription lifecycle
- **User story:** As the system, I want to automatically update user tiers when PayPal events occur
- **Acceptance criteria:**
  - [ ] Create `app/api/webhooks/paypal/route.ts`
  - [ ] Verify webhook signatures (security)
  - [ ] Handle events:
    - `BILLING.SUBSCRIPTION.ACTIVATED` → Update user tier to subscribed plan
    - `BILLING.SUBSCRIPTION.CANCELLED` → Set subscription_status to 'canceled'
    - `BILLING.SUBSCRIPTION.EXPIRED` → Downgrade to free tier
    - `BILLING.SUBSCRIPTION.SUSPENDED` → Set status to 'past_due'
    - `PAYMENT.SALE.COMPLETED` → Log successful payment (optional)
  - [ ] Update user record in database on each event
  - [ ] Log all webhook events for debugging
  - [ ] Return 200 OK to PayPal (acknowledge receipt)

#### 6. **Subscription Status API**
- **Description:** Expose subscription status to frontend
- **User story:** As a user, I want to see my current subscription status and usage
- **Acceptance criteria:**
  - [ ] Update `subscriptions.getStatus` to return:
    - Current tier
    - Subscription status (active, canceled, expired)
    - Billing period (monthly/yearly)
    - Next billing date
    - PayPal subscription ID
    - Cancel at period end flag
  - [ ] Handle edge cases:
    - User with no subscription (free tier)
    - User with canceled subscription (access until period end)
    - User with expired subscription (downgraded)

#### 7. **Cancel Subscription**
- **Description:** Allow users to cancel their subscription
- **User story:** As a subscriber, I want to cancel my subscription while keeping access until period end
- **Acceptance criteria:**
  - [ ] Create tRPC procedure: `subscriptions.cancel`
  - [ ] Call PayPal API to cancel subscription
  - [ ] Set `cancel_at_period_end: true` in database
  - [ ] User keeps access until current period ends
  - [ ] Show "Your subscription will end on [date]" message
  - [ ] Webhook handles actual expiration

#### 8. **Upgrade/Downgrade Subscription**
- **Description:** Allow users to change their subscription tier
- **User story:** As an Essential subscriber, I want to upgrade to Premium for more features
- **Acceptance criteria:**
  - [ ] Create tRPC procedure: `subscriptions.changePlan`
  - [ ] Handle upgrade: Essential → Premium (immediate, prorated)
  - [ ] Handle downgrade: Premium → Essential (at period end)
  - [ ] Call PayPal API to revise subscription
  - [ ] Update user tier accordingly
  - [ ] Show confirmation message

#### 9. **Pricing Page Integration**
- **Description:** Connect pricing page CTAs to checkout flow
- **User story:** As a visitor, I want to click "Subscribe" and complete payment
- **Acceptance criteria:**
  - [ ] Update `/pricing` page with 3 tiers:
    - **Free: "Dream Explorer"** → "Start Free" (signup flow)
    - **Pro: "Dream Builder"** → $15/mo PayPal checkout (highlight as "Most Popular")
    - **Unlimited: "Dream Architect"** → $29/mo PayPal checkout
    - Toggle for monthly/yearly billing (show savings: $150/yr saves $30, $290/yr saves $58)
    - Show daily limits clearly: Pro = 1/day, Unlimited = 2/day
  - [ ] Show current plan if user logged in
  - [ ] Disable button for current plan: "Current Plan"
  - [ ] Handle loading states during checkout creation

#### 10. **Profile/Settings Subscription Management**
- **Description:** Add subscription management to profile page
- **User story:** As a subscriber, I want to manage my subscription from my profile
- **Acceptance criteria:**
  - [ ] Profile page shows:
    - Current tier badge
    - Billing period (Monthly/Yearly)
    - Next billing date
    - "Cancel Subscription" button (if active)
    - "Reactivate" button (if canceled but not expired)
    - "Change Plan" link (to pricing page)
  - [ ] Settings page shows:
    - Billing history link (PayPal portal)
    - Update payment method link (PayPal portal)

#### 11. **Database Schema Updates**
- **Description:** Update user schema for PayPal subscription data
- **User story:** As the system, I want to store PayPal subscription details
- **Acceptance criteria:**
  - [ ] Add/update columns in `users` table:
    - `paypal_subscription_id` (replaces `stripe_subscription_id`)
    - `paypal_customer_id` (optional, for future use)
    - `subscription_id` (generic, points to PayPal ID)
    - Keep existing: `tier`, `subscription_status`, `subscription_period`, `subscription_started_at`, `subscription_expires_at`
  - [ ] Migration to rename/add columns
  - [ ] Remove unused Stripe columns (or deprecate)

#### 12. **Type Updates**
- **Description:** Update TypeScript types for PayPal
- **User story:** As a developer, I want type-safe PayPal integration
- **Acceptance criteria:**
  - [ ] Update `types/subscription.ts`:
    - Replace `StripeConfig` with `PayPalConfig`
    - Update `Subscription` interface for PayPal fields
    - Add PayPal-specific types (webhook events, etc.)
  - [ ] Update `types/user.ts` if needed
  - [ ] Ensure all tRPC procedures are properly typed

#### 13. **3-Tier Structure Implementation**
- **Description:** Simplify to 3 tiers with daily limits and feature gating
- **User story:** As the system, I want to enforce the 3-tier subscription structure with daily limits
- **Acceptance criteria:**
  - [ ] Update `types/user.ts`:
    - Change `SubscriptionTier = 'free' | 'essential' | 'premium'`
    - To: `SubscriptionTier = 'free' | 'pro' | 'unlimited'`
  - [ ] Update tier limits configuration:
    ```typescript
    const TIER_LIMITS = {
      free: {
        dreams: 2,
        reflectionsPerMonth: 2,
        reflectionsPerDay: 2, // doesn't matter, only 2/month
        evolutionReports: false,
        visualizations: false,
        extendedThinking: false
      },
      pro: {
        dreams: 5,
        reflectionsPerMonth: 30,
        reflectionsPerDay: 1,  // Max 1 per day
        evolutionReports: true,
        visualizations: true,
        extendedThinking: false
      },
      unlimited: {
        dreams: Infinity,
        reflectionsPerMonth: 60,
        reflectionsPerDay: 2,  // Max 2 per day
        evolutionReports: true,
        visualizations: true,
        extendedThinking: true
      }
    }
    ```
  - [ ] Implement daily limit check in reflection creation
  - [ ] Block evolution reports for free tier
  - [ ] Block visualizations for free tier
  - [ ] Update database schema: rename 'essential' → 'pro', 'premium' → 'unlimited'
  - [ ] Update all tier checks throughout codebase
  - [ ] Update pricing page to show 3 tiers
  - [ ] Update profile page tier badges

#### 14. **Upgrade to Claude Sonnet 4.5**
- **Description:** Upgrade AI model from Sonnet 4 to Sonnet 4.5 for improved quality
- **User story:** As a user, I want the best AI insights powered by the latest Claude model
- **Acceptance criteria:**
  - [ ] Update model ID in AI service:
    - From: `claude-sonnet-4-20250514` (or similar)
    - To: `claude-sonnet-4-5-20250929`
  - [ ] Verify all prompts work correctly with new model
  - [ ] Test reflection generation quality
  - [ ] Test evolution report quality
  - [ ] Test visualization generation
  - [ ] No cost increase (same $3/$15 per million tokens)

#### 15. **Extended Thinking for Premium Tiers**
- **Description:** Enable extended thinking for Optimal and Premium subscribers
- **User story:** As an Optimal/Premium user, I want deeper AI analysis through extended thinking
- **Acceptance criteria:**
  - [ ] Implement extended thinking toggle based on tier:
    - Free/Essential: Standard thinking
    - Optimal: Extended thinking enabled
    - Premium: Extended thinking + enhanced context
  - [ ] Update AI service to pass extended thinking parameter
  - [ ] Test extended thinking output quality
  - [ ] Monitor token usage for cost tracking
  - [ ] Add "Extended Thinking" badge to Premium tier reflections

---

### Should-Have (Post-MVP)

1. **PayPal Billing Portal Link** - Direct users to PayPal to manage payment methods
2. **Subscription Analytics** - Track MRR, churn rate, conversion rate
3. **Promo Codes/Discounts** - Apply coupon codes during checkout
4. **Trial Period** - 14-day free trial for Premium
5. **Email Notifications** - Send emails for subscription events (welcome, renewal, cancellation)
6. **Invoice/Receipt Display** - Show payment history in app
7. **Annual Upsell** - Prompt monthly subscribers to save with annual

### Could-Have (Future)

1. **Multiple Payment Methods** - Add Stripe as alternative
2. **Crypto Payments** - Accept cryptocurrency
3. **Team/Family Plans** - Multiple users under one subscription
4. **Lifetime Deals** - One-time payment for lifetime access
5. **Referral Program** - Earn credits for referring users

---

## User Flows

### Flow 1: Free User → Premium Subscriber

**Steps:**
1. Free user on dashboard sees: "Upgrade to Premium for unlimited reflections"
2. Clicks "Upgrade" → Redirected to `/pricing`
3. **Pricing page shows:**
   - Free tier (current): 10 reflections/month
   - Essential: 50 reflections/month - $9.99/mo
   - Premium: Unlimited - $19.99/mo
   - Toggle: Monthly / Yearly (shows savings)
4. User clicks **"Subscribe to Premium - $19.99/mo"**
5. **Loading state:** "Preparing checkout..."
6. **Redirected to PayPal:**
   - PayPal checkout page shows subscription details
   - "Subscribe to Mirror of Dreams Premium - $19.99/month"
   - User logs into PayPal (or uses guest checkout)
   - Reviews and approves subscription
7. **PayPal redirects back to app:** `/dashboard?subscription=success`
8. **Success toast:** "Welcome to Premium! You now have unlimited reflections."
9. **Dashboard updated:**
   - Tier badge: "Premium ✨"
   - Reflection limit: "Unlimited"
   - Upgrade banner removed
10. **Webhook fires:** `BILLING.SUBSCRIPTION.ACTIVATED`
    - Database updated: tier='premium', status='active'

**Edge cases:**
- User cancels in PayPal: Redirected to `/pricing?canceled=true`, no changes
- PayPal error: Show error message, allow retry
- Webhook delayed: User sees upgrade immediately (optimistic), webhook confirms

### Flow 2: Subscriber Cancels Subscription

**Steps:**
1. Premium user goes to `/profile`
2. **Subscription section shows:**
   - "Premium Plan - $19.99/month"
   - "Next billing: December 30, 2025"
   - "Cancel Subscription" button
3. User clicks **"Cancel Subscription"**
4. **Confirmation modal:**
   - "Are you sure you want to cancel?"
   - "You'll keep Premium access until December 30, 2025"
   - "After that, you'll be downgraded to Free (10 reflections/month)"
   - "Cancel Subscription" / "Keep Premium" buttons
5. User confirms cancellation
6. **API call:** `subscriptions.cancel`
7. **PayPal API:** Cancel subscription at period end
8. **Success toast:** "Subscription canceled. You'll have Premium access until December 30."
9. **Profile updated:**
   - "Premium Plan (Canceling)"
   - "Access until: December 30, 2025"
   - "Reactivate Subscription" button appears
10. **Webhook fires:** `BILLING.SUBSCRIPTION.CANCELLED`
    - Database: subscription_status='canceled', subscription_expires_at='2025-12-30'

**Edge cases:**
- Reactivate before expiry: Call PayPal to reactivate, status='active'
- Period ends: Webhook fires `BILLING.SUBSCRIPTION.EXPIRED`, downgrade to free

### Flow 3: Webhook Handles Payment Failure

**Steps:**
1. PayPal attempts to charge subscriber's payment method
2. Payment fails (insufficient funds, expired card)
3. **Webhook fires:** `BILLING.SUBSCRIPTION.SUSPENDED`
4. **Handler updates database:**
   - subscription_status='past_due'
5. **Next user login:**
   - Banner: "Your payment failed. Update your payment method to keep Premium access."
   - Link to PayPal to update payment
6. User updates payment method in PayPal
7. PayPal retries charge, succeeds
8. **Webhook fires:** `BILLING.SUBSCRIPTION.ACTIVATED` (or `PAYMENT.SALE.COMPLETED`)
9. **Database updated:** subscription_status='active'

---

## Data Model Overview

### User Table Updates

```sql
-- Add PayPal fields (or rename existing Stripe fields)
ALTER TABLE users
  ADD COLUMN paypal_subscription_id VARCHAR(255),
  ADD COLUMN paypal_payer_id VARCHAR(255);

-- Optionally rename or drop Stripe columns
-- stripe_customer_id → deprecated
-- stripe_subscription_id → deprecated
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `tier` | enum | 'free', 'essential', 'premium' |
| `subscription_status` | enum | 'active', 'canceled', 'expired', 'past_due', 'trialing' |
| `subscription_period` | enum | 'monthly', 'yearly', null |
| `subscription_id` | string | PayPal subscription ID (I-xxx) |
| `paypal_subscription_id` | string | Same as above (explicit PayPal) |
| `subscription_started_at` | timestamp | When subscription began |
| `subscription_expires_at` | timestamp | When access ends (for canceled) |

---

## Technical Requirements

**Must support:**
- Next.js 14 App Router (existing)
- tRPC for API endpoints (existing)
- Supabase PostgreSQL (existing)
- PayPal REST API v2
- PayPal Subscriptions API

**New dependencies:**
- None required - use PayPal REST API directly via fetch
- Optional: `@paypal/checkout-server-sdk` for typed SDK

**PayPal API Endpoints Used:**
- `POST /v2/checkout/orders` - Create order (one-time, not used for subscriptions)
- `POST /v1/billing/subscriptions` - Create subscription
- `POST /v1/billing/subscriptions/{id}/cancel` - Cancel subscription
- `POST /v1/billing/subscriptions/{id}/revise` - Change plan
- `GET /v1/billing/subscriptions/{id}` - Get subscription details
- Webhooks at `/api/webhooks/paypal`

**Constraints:**
- No breaking changes to existing features
- Subscription state always consistent between PayPal and database
- Webhook handler must be idempotent (handle duplicate events)
- Support both sandbox and live environments

**Security:**
- Never expose PayPal secret on client
- Verify webhook signatures
- Use HTTPS for all callbacks
- Store minimal PII (PayPal handles sensitive data)

---

## Success Criteria

**Plan-9 is successful when:**

1. **Users Can Subscribe: 10/10**
   - Metric: Complete checkout flow works end-to-end
   - Target: Free → Premium upgrade in <60 seconds
   - Measurement: Test with sandbox, then live

2. **Webhooks Handle All Events: 10/10**
   - Metric: All subscription lifecycle events update database
   - Target: Zero manual intervention needed
   - Measurement: Test all webhook event types

3. **Users Can Cancel: 10/10**
   - Metric: Cancel flow works, access preserved until period end
   - Target: Clear communication of what happens
   - Measurement: Test cancel + expiry flow

4. **Pricing Page Converts: 8/10**
   - Metric: CTAs work, checkout initiates
   - Target: No dead links, no errors
   - Measurement: Click every CTA, verify flow

5. **Profile Shows Status: 9/10**
   - Metric: Current tier, status, billing info visible
   - Target: User understands their subscription at a glance
   - Measurement: Visual inspection

6. **Production Ready: 10/10**
   - Metric: Live PayPal credentials work
   - Target: Real payments process successfully
   - Measurement: Test with small real transaction

---

## Out of Scope (For Plan-9)

**Explicitly not included:**

- Free trial period (can add later)
- Promo codes/discounts
- Multiple payment methods (Stripe backup)
- Email notifications for billing events
- Invoice display in app
- Subscription analytics dashboard
- Team/family plans
- Crypto payments

**Why:** Plan-9 is about **getting payments working**. Basic subscribe/cancel/manage flow is MVP. Advanced billing features come after revenue is flowing.

---

## Environment Variables Summary - NEEDS UPDATE

PayPal credentials configured, but plan IDs need recreation for 3-tier structure:

```bash
# PayPal Credentials (SANDBOX - configured)
PAYPAL_CLIENT_ID=AYZUnPSWX22-fy_ed2k_MfbiZPeefY9bw3e2FuR9nsCxe-1ZBENJLU-QM_ZrxKtuo9BhFBZvXrUjAIcv
PAYPAL_CLIENT_SECRET=EAurh1D6v_FqNzArU4MqNS531xyGmQpkXaox5kVacxhSHKYjLJz04HDaoTyoe9pgx-PId-EibJbtAhRb
PAYPAL_ENVIRONMENT=sandbox

# PayPal Plan IDs - 2 PAID TIERS × 2 PERIODS = 4 Plans needed
# Pro ($15/mo, $150/yr)
PAYPAL_PRO_MONTHLY_PLAN_ID=TODO
PAYPAL_PRO_YEARLY_PLAN_ID=TODO

# Unlimited ($29/mo, $290/yr)
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=TODO
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=TODO

# PayPal Webhook (to be created during implementation)
PAYPAL_WEBHOOK_ID=

# App URLs (for PayPal redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

**Note:** Initial plans created at wrong prices and tier names. Need to recreate with correct 3-tier pricing.

---

## Implementation Strategy

### Phase 1: PayPal Setup & Products - NEEDS RECREATION
**Priority:** P0 - Foundation
**Status:** NEEDS RECREATION - New 3-tier structure

1. **Create PayPal products:**
   - [ ] Product: "Mirror of Dreams Pro" → TODO
   - [ ] Product: "Mirror of Dreams Unlimited" → TODO
2. **Create subscription plans with 3-tier pricing:**
   - [ ] Pro Monthly: $15/mo → TODO
   - [ ] Pro Yearly: $150/yr → TODO
   - [ ] Unlimited Monthly: $29/mo → TODO
   - [ ] Unlimited Yearly: $290/yr → TODO
3. **Update env with correct Plan IDs:** TODO
4. **Create webhook endpoint in PayPal Dashboard:** TODO (during Phase 4)
5. **Update .env.example:** TODO (needs Pro/Unlimited var names)

### Phase 2: Server Infrastructure (Day 1-2)
**Priority:** P0 - Core

1. **Create `server/lib/paypal.ts`:**
   - Client initialization
   - Access token management
   - Helper functions
2. **Database migration:**
   - Add PayPal columns
   - Remove/deprecate Stripe columns
3. **Update types:**
   - PayPal-specific types
   - Update Subscription interface

### Phase 2.5: 4-Tier Structure & Sonnet 4.5 (Day 2)
**Priority:** P1 - Core upgrade

1. **Expand tier structure:**
   - Add `optimal` to `SubscriptionTier` type
   - Update all tier limit configurations
   - Update database enum/check constraints
   - Update pricing page for 4 tiers
2. **Upgrade to Claude Sonnet 4.5:**
   - Update model ID to `claude-sonnet-4-5-20250929`
   - Test all AI generation features
3. **Implement extended thinking:**
   - Add tier-based extended thinking toggle
   - Free/Essential: standard
   - Optimal/Premium: extended thinking enabled

### Phase 3: Checkout Flow (Day 2-3)
**Priority:** P0 - Revenue

1. **Create subscription tRPC procedure:**
   - `subscriptions.createCheckout`
   - Support all 3 paid tiers (essential, optimal, premium)
   - Returns PayPal approval URL
2. **Handle return URLs:**
   - Success: Update user tier (optimistic)
   - Cancel: Return to pricing
3. **Update pricing page:**
   - Show 4 tiers with correct pricing
   - Connect CTAs to checkout
   - Handle loading states

### Phase 4: Webhook Handler (Day 3)
**Priority:** P0 - Automation

1. **Create `/api/webhooks/paypal/route.ts`:**
   - Signature verification
   - Event routing
   - Database updates
2. **Handle all subscription events:**
   - ACTIVATED, CANCELLED, EXPIRED, SUSPENDED
3. **Test with PayPal webhook simulator**

### Phase 5: Subscription Management (Day 4)
**Priority:** P1 - User control

1. **Cancel subscription:**
   - tRPC procedure
   - PayPal API call
   - UI in profile
2. **Subscription status display:**
   - Profile page section
   - Dashboard indicator
3. **Reactivate flow (if time)**

### Phase 6: QA & Polish (Day 5)
**Priority:** P0 - Ship confidence

1. **End-to-end testing:**
   - Full subscribe flow
   - Cancel flow
   - Webhook handling
2. **Error handling:**
   - Network failures
   - PayPal errors
   - Edge cases
3. **Production preparation:**
   - Switch to live credentials
   - Test real transaction
   - Monitor webhook logs

---

## Assumptions

1. PayPal sandbox credentials already obtained
2. PayPal business account can receive payments
3. Existing database schema can be extended
4. tRPC infrastructure works for new procedures
5. Vercel deployment supports webhook endpoints
6. Users have PayPal accounts or can use guest checkout

---

## Open Questions

1. **Pricing:** $9.99/$19.99 correct? (Assumption: Yes, based on Plan-7 pricing page)
2. **Trial period:** Include 14-day trial? (Recommendation: Post-MVP)
3. **Yearly discount:** 17% savings enough? (Recommendation: Yes, standard)
4. **Webhook retry:** How to handle failed webhook processing? (Recommendation: Log and retry manually if needed)
5. **Currency:** USD only or multi-currency? (Recommendation: USD only for MVP)

---

## Next Steps

- [ ] Review vision with stakeholder
- [ ] Create PayPal products and plans (via MCP)
- [ ] Run `/2l-plan` for master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning & Execution
**Focus:** Get payments working. Enable monetization. Ship revenue.

---

## Design Philosophy

> "A product without payments is a hobby. Mirror of Dreams has achieved beauty and completeness - now it needs to sustain itself. PayPal integration is not about complexity; it's about the simplest path to revenue. Users click, PayPal handles payment, webhook updates state. Clean, reliable, done."

**Guiding principles:**
1. **Revenue first** - Get basic payments working before optimizing
2. **PayPal handles complexity** - Don't rebuild what PayPal provides
3. **Webhook-driven** - Automation over manual intervention
4. **User clarity** - Always show subscription status clearly
5. **Fail gracefully** - Payment errors shouldn't break the app

---

**This vision transforms Mirror of Dreams from a beautiful free product into a monetizable SaaS - ready to generate revenue and sustain its creator.**
