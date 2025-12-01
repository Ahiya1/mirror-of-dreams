# Explorer 1 Report: Backend Architecture & Database Schema

## Executive Summary

PayPal integration requires **database schema updates** (add PayPal-specific columns, daily limit tracking), **replacement of Stripe patterns** with PayPal REST API, **tier renaming** (essential/premium → pro/unlimited), and **new daily limit enforcement logic**. The existing Stripe webhook handler at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/stripe/route.ts` provides an excellent template pattern to replicate for PayPal. **CRITICAL DISCOVERY:** Webhook handler references `stripe_customer_id` and `stripe_subscription_id` columns that DO NOT EXIST in the database schema - these will need to be added as `paypal_subscription_id` and `paypal_payer_id` for PayPal.

**Key Finding:** The database already has a generic `subscription_id` column (line 28 in initial schema: "External subscription ID (Stripe/PayPal)") which can store PayPal subscription IDs, but the webhook handler expects specific Stripe columns that don't exist. This mismatch must be resolved.

---

## Discoveries

### 1. Database Schema - Current State

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20250121000000_initial_schema.sql`

**Users Table (Lines 17-48):**
```sql
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    
    -- Subscription Management
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'essential', 'premium')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trialing')),
    subscription_id TEXT, -- External subscription ID (Stripe/PayPal) - GENERIC COLUMN
    subscription_period TEXT DEFAULT 'monthly' CHECK (subscription_period IN ('monthly', 'yearly')),
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Usage Tracking
    last_reflection_at TIMESTAMP WITH TIME ZONE,
    reflection_count_this_month INTEGER DEFAULT 0,
    total_reflections INTEGER DEFAULT 0,
    current_month_year TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
    
    -- Special Users
    is_creator BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- NEW (from iteration 12):
    preferences JSONB DEFAULT '{}'::JSONB,
    is_demo BOOLEAN DEFAULT FALSE,
    
    -- NEW (from iteration 13):
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'he')),
    timezone TEXT DEFAULT 'UTC',
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**MISSING Columns for PayPal:**
- ❌ `paypal_subscription_id` - PayPal subscription ID (for webhook lookups)
- ❌ `paypal_payer_id` - PayPal customer/payer ID
- ❌ `reflection_count_today` or `reflections_today` - Daily reflection counter
- ❌ `last_reflection_date` - Date of last reflection (for daily reset logic)

**MISSING for Stripe (referenced by webhook but not in schema):**
- ❌ `stripe_customer_id` - Referenced in webhook handler line 119, 172, 264
- ❌ `stripe_subscription_id` - Referenced in webhook handler line 120, 173

**Existing Tier Constraint (Line 26):**
```sql
tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'essential', 'premium'))
```

**NEEDS UPDATE TO:**
```sql
tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'unlimited'))
```

**Note:** Migration `20251022200000_add_dreams_feature.sql` (line 118) already updated the constraint to include 'optimal':
```sql
CHECK (tier IN ('free', 'essential', 'optimal', 'premium'))
```

This will need to be changed to the final 3-tier structure.

### 2. Dreams Table - Tier Limits

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251022200000_add_dreams_feature.sql`

**Function: `check_dream_limit` (Lines 176-205):**
```sql
CREATE OR REPLACE FUNCTION check_dream_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    active_dream_count INTEGER;
    max_dreams INTEGER;
BEGIN
    SELECT tier INTO user_tier FROM public.users WHERE id = user_uuid;
    SELECT COUNT(*) INTO active_dream_count
    FROM public.dreams WHERE user_id = user_uuid AND status = 'active';
    
    -- Current limits
    CASE user_tier
        WHEN 'free' THEN max_dreams := 2;
        WHEN 'essential' THEN max_dreams := 5;
        WHEN 'optimal' THEN max_dreams := 7;
        WHEN 'premium' THEN max_dreams := 999999; -- Unlimited
        ELSE max_dreams := 0;
    END CASE;
    
    RETURN active_dream_count < max_dreams;
END;
$$ LANGUAGE plpgsql;
```

**NEEDS UPDATE TO (Vision lines 56-83):**
```sql
CASE user_tier
    WHEN 'free' THEN max_dreams := 2;        -- NO CHANGE
    WHEN 'pro' THEN max_dreams := 5;         -- RENAMED from 'essential'
    WHEN 'unlimited' THEN max_dreams := 999999; -- RENAMED from 'premium'
    ELSE max_dreams := 0;
END CASE;
```

### 3. Reflection Limits - Monthly & Daily

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251112000001_update_reflection_limits.sql`

**Function: `check_reflection_limit` (Lines 13-45):**
```sql
CREATE OR REPLACE FUNCTION check_reflection_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    current_count INTEGER;
    max_reflections INTEGER;
    is_creator_user BOOLEAN;
    is_admin_user BOOLEAN;
BEGIN
    SELECT tier, reflection_count_this_month, is_creator, is_admin
    INTO user_tier, current_count, is_creator_user, is_admin_user
    FROM public.users WHERE id = user_uuid;

    -- Creators and admins have unlimited access
    IF is_creator_user = true OR is_admin_user = true THEN
        RETURN true;
    END IF;

    -- Current monthly limits
    CASE user_tier
        WHEN 'free' THEN max_reflections := 4;
        WHEN 'essential' THEN max_reflections := 10;
        WHEN 'optimal' THEN max_reflections := 30;
        WHEN 'premium' THEN max_reflections := 999999;
        ELSE max_reflections := 0;
    END CASE;

    RETURN current_count < max_reflections;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**NEEDS UPDATE TO (Vision lines 53-83):**
```sql
CASE user_tier
    WHEN 'free' THEN max_reflections := 2;      -- CHANGED from 4
    WHEN 'pro' THEN max_reflections := 30;      -- RENAMED from 'essential', CHANGED from 10
    WHEN 'unlimited' THEN max_reflections := 60; -- RENAMED from 'premium'
    ELSE max_reflections := 0;
END CASE;
```

**DAILY LIMITS (NEW FEATURE - NOT IMPLEMENTED):**

Vision requires (lines 67-78):
- **Free:** No daily limit (only 2/month total)
- **Pro:** Max 1 reflection per day
- **Unlimited:** Max 2 reflections per day

**Proposed Implementation:**
1. Add columns to `users` table:
   - `reflections_today INTEGER DEFAULT 0`
   - `last_reflection_date DATE`

2. Create new function: `check_daily_limit(user_uuid UUID) RETURNS BOOLEAN`
3. Check if `last_reflection_date` != `CURRENT_DATE`:
   - If different day: Reset `reflections_today = 0`, update `last_reflection_date = CURRENT_DATE`
   - If same day: Check `reflections_today < DAILY_LIMIT[tier]`

4. Update reflection creation to call BOTH:
   - `check_reflection_limit()` - Monthly limit
   - `check_daily_limit()` - Daily limit (NEW)

### 4. tRPC Subscription Router - Current State

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts`

**Current Implementation (77 lines total):**
```typescript
// Line 2: NOTE: Stripe temporarily disabled - will be replaced with PayPal in Iteration 4

export const subscriptionsRouter = router({
  // ONLY IMPLEMENTED PROCEDURE:
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { data: subscription, error } = await supabase
      .from('users')
      .select(`
        tier, subscription_status, subscription_period,
        subscription_id,
        subscription_started_at, subscription_expires_at
      `)
      .eq('id', ctx.user.id)
      .single();

    // Returns subscription status object
    return {
      tier: subscription.tier,
      status: subscription.subscription_status,
      period: subscription.subscription_period,
      isActive,
      isSubscribed,
      isCanceled,
      nextBilling,
      subscriptionId: subscription.subscription_id,
      startedAt: subscription.subscription_started_at,
      expiresAt: subscription.subscription_expires_at,
    };
  }),

  // Line 75-76: Comment
  // Stripe-dependent procedures disabled until PayPal integration in Iteration 4
  // cancel, getCustomerPortal, reactivate, upgrade will be re-implemented with PayPal
});
```

**MISSING PROCEDURES:**
- ❌ `createCheckout` - Create PayPal subscription, return approval URL
- ❌ `cancel` - Cancel subscription via PayPal API
- ❌ `reactivate` - Reactivate canceled subscription
- ❌ `upgrade` / `changePlan` - Modify subscription tier

**NEEDS TO BE ADDED:**
All missing procedures need to call PayPal REST API endpoints (no SDK - use fetch directly per Explorer-2 recommendation).

### 5. Webhook Handler Pattern - Stripe Template

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/stripe/route.ts` (303 lines)

**Architecture Pattern (Lines 1-93):**
```typescript
// Next.js Route Handler (NOT tRPC)
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/server/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-06-30.basil',
});

async function getRawBody(req: NextRequest): Promise<string> {
  return await req.text();
}

export async function POST(req: NextRequest) {
  const body = await getRawBody(req);
  const signature = req.headers.get('stripe-signature');
  
  // Verify signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Route to handlers
  switch (event.type) {
    case 'checkout.session.completed': await handleCheckoutCompleted(event); break;
    case 'payment_intent.succeeded': await handlePaymentIntentSucceeded(event); break;
    case 'customer.subscription.updated': await handleSubscriptionUpdated(event); break;
    case 'customer.subscription.deleted': await handleSubscriptionDeleted(event); break;
    case 'invoice.payment_succeeded': await handleInvoicePaymentSucceeded(event); break;
    case 'invoice.payment_failed': await handleInvoicePaymentFailed(event); break;
  }
  
  return NextResponse.json({ received: true, eventType: event.type });
}
```

**Event Handlers:**

**1. handleCheckoutCompleted (Lines 96-126):**
```typescript
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const { userId, tier, period } = session.metadata || {};
  
  await supabase
    .from('users')
    .update({
      tier,
      subscription_status: 'active',
      subscription_period: period,
      subscription_started_at: new Date().toISOString(),
      stripe_customer_id: session.customer as string,  // ❌ COLUMN DOESN'T EXIST
      stripe_subscription_id: session.subscription as string, // ❌ COLUMN DOESN'T EXIST
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}
```

**2. handleSubscriptionDeleted (Lines 215-244):**
```typescript
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const { userId } = subscription.metadata || {};
  
  const expiresAt = (subscription as any).current_period_end
    ? new Date((subscription as any).current_period_end * 1000).toISOString()
    : new Date().toISOString();
  
  await supabase
    .from('users')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}
```

**3. handleInvoicePaymentFailed (Lines 254-278):**
```typescript
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = invoice.customer as string;
  
  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId) // ❌ COLUMN DOESN'T EXIST
    .single();
  
  if (user) {
    await supabase
      .from('users')
      .update({ subscription_status: 'past_due' })
      .eq('id', user.id);
  }
}
```

**CRITICAL ISSUE:** Webhook handler references `stripe_customer_id` and `stripe_subscription_id` columns that DO NOT EXIST in the database schema. This code would fail if Stripe webhooks were ever enabled.

**PayPal Equivalent Events:**
- `BILLING.SUBSCRIPTION.ACTIVATED` → handleCheckoutCompleted
- `BILLING.SUBSCRIPTION.CANCELLED` → handleSubscriptionDeleted
- `BILLING.SUBSCRIPTION.EXPIRED` → handleSubscriptionDeleted
- `BILLING.SUBSCRIPTION.SUSPENDED` → handleInvoicePaymentFailed (past_due)
- `PAYMENT.SALE.COMPLETED` → handleInvoicePaymentSucceeded

**PayPal Signature Verification:**
PayPal uses different verification:
1. Get headers: `transmission_id`, `transmission_time`, `cert_url`, `auth_algo`, `transmission_sig`
2. Call PayPal API: `POST /v1/notifications/verify-webhook-signature`
3. PayPal returns `verification_status: "SUCCESS"` or "FAILURE"

(Unlike Stripe's local HMAC signature verification)

### 6. Type System - Current Definitions

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts`

**SubscriptionTier (Line 3):**
```typescript
export type SubscriptionTier = 'free' | 'essential' | 'premium';
```

**NEEDS UPDATE TO:**
```typescript
export type SubscriptionTier = 'free' | 'pro' | 'unlimited';
```

**SubscriptionStatus (Line 4):**
```typescript
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing';
```
✅ No changes needed (PayPal uses same statuses)

**User Interface (Lines 38-57):**
```typescript
export interface User {
  id: string;
  email: string;
  tier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriod: 'monthly' | 'yearly' | null;
  reflectionCountThisMonth: number;
  totalReflections: number;
  currentMonthYear: string; // "2025-01"
  // ... other fields
}
```

**NEEDS ADDITION:**
- `reflectionCountToday: number;` - Daily reflection counter
- `lastReflectionDate: string;` - Date of last reflection ("2025-11-30")

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/subscription.ts`

**Subscription Interface (Lines 8-21):**
```typescript
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  period: 'monthly' | 'yearly';
  stripeCustomerId: string | null;      // ❌ STRIPE-SPECIFIC
  stripeSubscriptionId: string | null;  // ❌ STRIPE-SPECIFIC
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**NEEDS UPDATE TO:**
```typescript
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  period: 'monthly' | 'yearly';
  paypalSubscriptionId: string | null;  // ✅ PAYPAL-SPECIFIC
  paypalPayerId: string | null;         // ✅ PAYPAL-SPECIFIC
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**StripeConfig (Lines 33-47):**
```typescript
export interface StripeConfig {
  publishableKey: string;
  priceIds: {
    essential: { monthly: string; yearly: string; };
    premium: { monthly: string; yearly: string; };
  };
}
```

**NEEDS REPLACEMENT WITH:**
```typescript
export interface PayPalConfig {
  clientId: string;
  environment: 'sandbox' | 'live';
  planIds: {
    pro: { monthly: string; yearly: string; };
    unlimited: { monthly: string; yearly: string; };
  };
}
```

### 7. Constants - Tier Limits

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`

**Current TIER_LIMITS (Lines 3-7):**
```typescript
export const TIER_LIMITS = {
  free: 10,
  essential: 50,
  premium: Infinity,
} as const;
```

**NEEDS UPDATE TO (Vision lines 56-83):**
```typescript
export const TIER_LIMITS = {
  free: 2,        // Monthly limit
  pro: 30,        // Monthly limit
  unlimited: 60,  // Monthly limit
} as const;

export const DAILY_LIMITS = {
  free: Infinity,    // No daily limit (only 2/month anyway)
  pro: 1,            // Max 1/day
  unlimited: 2,      // Max 2/day
} as const;

export const DREAM_LIMITS = {
  free: 2,
  pro: 5,
  unlimited: Infinity,
} as const;
```

**Type Update Needed (Line 9):**
```typescript
export type TierName = keyof typeof TIER_LIMITS;
```
✅ This will automatically update when TIER_LIMITS changes

---

## Patterns Identified

### Pattern 1: Generic Subscription ID Column

**Description:** Database uses a generic `subscription_id` column that can store any payment provider's subscription ID (Stripe, PayPal, etc.)

**Location:** `supabase/migrations/20250121000000_initial_schema.sql` (Line 28)

**Use Case:** Allows switching payment providers without schema changes

**Example:**
```sql
subscription_id TEXT, -- External subscription ID (Stripe/PayPal)
```

**Recommendation:** ✅ KEEP THIS PATTERN, but ADD provider-specific columns for webhook lookups:
- Add `paypal_subscription_id` for PayPal-specific queries
- Add `paypal_payer_id` for customer identification
- Keep generic `subscription_id` as primary reference

**Rationale:** Webhook handlers need to look up users by provider-specific IDs (e.g., PayPal sends `payer_id` in events), so provider-specific columns enable efficient queries with indexes.

### Pattern 2: Next.js Route Handler for Webhooks (NOT tRPC)

**Description:** Webhooks use Next.js API routes (`app/api/webhooks/*/route.ts`) instead of tRPC because they need raw request body access for signature verification.

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/stripe/route.ts`

**Use Case:** Signature verification requires access to raw request body before JSON parsing

**Example:**
```typescript
// app/api/webhooks/paypal/route.ts
export async function POST(req: NextRequest) {
  const body = await req.text(); // Raw body needed for signature
  const signature = req.headers.get('paypal-transmission-sig');
  
  // Verify signature with PayPal API
  const isValid = await verifyPayPalSignature(body, headers);
  
  // Parse and handle event
  const event = JSON.parse(body);
  // ...
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

**Recommendation:** ✅ USE THIS PATTERN for PayPal webhooks. Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/paypal/route.ts` following the same structure as Stripe handler.

### Pattern 3: Database Function for Limit Checking

**Description:** Limit enforcement logic lives in PostgreSQL functions (not application code) for consistency and performance.

**Location:** `supabase/migrations/20251112000001_update_reflection_limits.sql` (Lines 13-45)

**Use Case:** Centralized limit logic that can be called from multiple places (tRPC, triggers, cron jobs)

**Example:**
```sql
CREATE OR REPLACE FUNCTION check_reflection_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    current_count INTEGER;
    max_reflections INTEGER;
BEGIN
    -- Get tier and count
    SELECT tier, reflection_count_this_month 
    INTO user_tier, current_count
    FROM public.users WHERE id = user_uuid;
    
    -- Check against limit
    CASE user_tier
        WHEN 'free' THEN max_reflections := 2;
        WHEN 'pro' THEN max_reflections := 30;
        WHEN 'unlimited' THEN max_reflections := 60;
    END CASE;
    
    RETURN current_count < max_reflections;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Recommendation:** ✅ EXTEND THIS PATTERN for daily limits. Create `check_daily_limit(user_uuid UUID)` function following the same structure.

### Pattern 4: Metadata-Driven Webhook Processing

**Description:** Store user context in payment metadata (userId, tier, period) so webhooks can process events without additional lookups.

**Location:** Stripe webhook handler (Lines 98-108)

**Use Case:** Webhooks receive metadata from payment provider, use it to update database directly

**Example (Stripe):**
```typescript
// When creating subscription:
const session = await stripe.checkout.sessions.create({
  metadata: {
    userId: 'user-uuid',
    tier: 'pro',
    period: 'monthly'
  }
});

// Webhook receives metadata:
const { userId, tier, period } = event.data.object.metadata;
await supabase.from('users').update({ tier, subscription_status: 'active' }).eq('id', userId);
```

**PayPal Equivalent:**
```typescript
// When creating subscription:
const subscription = await paypal.createSubscription({
  custom_id: userId,  // PayPal's metadata field
  plan_id: PLAN_IDS[tier][period]
});

// Webhook receives custom_id:
const userId = event.resource.custom_id;
const planId = event.resource.plan_id;
const tier = determineTierFromPlanId(planId); // Map plan ID → tier
```

**Recommendation:** ✅ USE THIS PATTERN for PayPal. Store `userId` in `custom_id` field when creating subscriptions.

---

## Complexity Assessment

### High Complexity Areas

#### 1. Daily Limit Implementation (NEW FEATURE - 6-8 hours)
**Complexity:** HIGH - Timezone handling, race conditions, state management

**Why it's complex:**
- User timezones vary (Israel UTC+2/+3, USA UTC-5 to -8, etc.)
- Need to determine "today" in user's local timezone, not server timezone
- Race condition: 2 reflections submitted simultaneously at daily limit
- Monthly reset already exists, but daily reset is more frequent and complex

**Database Changes:**
```sql
-- Add to users table
ALTER TABLE public.users
ADD COLUMN reflections_today INTEGER DEFAULT 0,
ADD COLUMN last_reflection_date DATE;

-- Create daily limit function
CREATE OR REPLACE FUNCTION check_daily_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    user_timezone TEXT;
    today_user_tz DATE;
    last_date DATE;
    current_count INTEGER;
    max_daily INTEGER;
BEGIN
    -- Get user data
    SELECT tier, timezone, last_reflection_date, reflections_today
    INTO user_tier, user_timezone, last_date, current_count
    FROM public.users WHERE id = user_uuid;
    
    -- Calculate today in user's timezone
    today_user_tz := (NOW() AT TIME ZONE user_timezone)::DATE;
    
    -- Reset counter if new day
    IF last_date IS NULL OR last_date != today_user_tz THEN
        UPDATE public.users 
        SET reflections_today = 0, last_reflection_date = today_user_tz
        WHERE id = user_uuid;
        current_count := 0;
    END IF;
    
    -- Set daily limits
    CASE user_tier
        WHEN 'free' THEN max_daily := 999999; -- No daily limit
        WHEN 'pro' THEN max_daily := 1;
        WHEN 'unlimited' THEN max_daily := 2;
        ELSE max_daily := 0;
    END CASE;
    
    RETURN current_count < max_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Application Changes:**
```typescript
// server/trpc/routers/reflection.ts
// Before creating reflection:
const canReflectMonthly = await checkReflectionLimit(userId);
const canReflectDaily = await checkDailyLimit(userId); // NEW

if (!canReflectMonthly) {
  throw new TRPCError({ code: 'FORBIDDEN', message: 'Monthly reflection limit reached' });
}

if (!canReflectDaily) {
  const hoursUntilReset = calculateHoursUntilMidnight(userTimezone);
  throw new TRPCError({ 
    code: 'FORBIDDEN', 
    message: `Daily reflection limit reached. Resets in ${hoursUntilReset} hours.` 
  });
}

// After creating reflection:
await supabase
  .from('users')
  .update({ 
    reflections_today: reflections_today + 1,  // NEW
    reflection_count_this_month: reflection_count_this_month + 1,
    last_reflection_at: new Date().toISOString()
  })
  .eq('id', userId);
```

**Estimated Builder Splits:** 1 builder (can handle in single iteration with testing)

**Testing Requirements:**
- Test across timezones (UTC, EST, IST)
- Test at midnight boundary (23:59 → 00:01)
- Test race condition (2 simultaneous requests)
- Test reset logic (counter resets at midnight user time)

#### 2. PayPal Webhook Handler (8-10 hours)
**Complexity:** HIGH - Signature verification, event handling, error recovery

**Why it's complex:**
- PayPal signature verification requires calling PayPal API (not local HMAC like Stripe)
- Must handle event idempotency (webhooks can be retried/duplicated)
- Need to map PayPal plan IDs → tier names
- Error handling: what if database update fails but webhook was valid?
- Logging: must log all events for debugging subscription issues

**Implementation:**
```typescript
// app/api/webhooks/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = {
    'paypal-transmission-id': req.headers.get('paypal-transmission-id'),
    'paypal-transmission-time': req.headers.get('paypal-transmission-time'),
    'paypal-transmission-sig': req.headers.get('paypal-transmission-sig'),
    'paypal-cert-url': req.headers.get('paypal-cert-url'),
    'paypal-auth-algo': req.headers.get('paypal-auth-algo'),
  };
  
  // Verify signature with PayPal API
  const isValid = await verifyPayPalWebhook(body, headers);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  const event = JSON.parse(body);
  
  // Handle events
  switch (event.event_type) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      await handleSubscriptionActivated(event);
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      await handleSubscriptionCancelled(event);
      break;
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      await handleSubscriptionExpired(event);
      break;
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      await handleSubscriptionSuspended(event);
      break;
    case 'PAYMENT.SALE.COMPLETED':
      await handlePaymentCompleted(event);
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function verifyPayPalWebhook(body: string, headers: any): Promise<boolean> {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(
    `https://api-m.${process.env.PAYPAL_ENVIRONMENT}.paypal.com/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        transmission_id: headers['paypal-transmission-id'],
        transmission_time: headers['paypal-transmission-time'],
        cert_url: headers['paypal-cert-url'],
        auth_algo: headers['paypal-auth-algo'],
        transmission_sig: headers['paypal-transmission-sig'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    }
  );
  
  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}

async function handleSubscriptionActivated(event: any) {
  const subscriptionId = event.resource.id;
  const userId = event.resource.custom_id; // Metadata field
  const planId = event.resource.plan_id;
  const tier = determineTierFromPlanId(planId);
  const period = determinePeriodFromPlanId(planId);
  
  await supabase
    .from('users')
    .update({
      tier,
      subscription_status: 'active',
      subscription_period: period,
      subscription_started_at: new Date().toISOString(),
      paypal_subscription_id: subscriptionId,
      paypal_payer_id: event.resource.subscriber.payer_id,
      subscription_id: subscriptionId, // Generic column
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}
```

**Estimated Builder Splits:** 1 builder (webhook handler is contained, can be tested with PayPal sandbox)

#### 3. Tier Renaming Migration (4-6 hours)
**Complexity:** MEDIUM-HIGH - Data migration across multiple tables and functions

**Why it's complex:**
- Must update tier constraint in multiple places
- Data migration: existing users with 'essential'/'premium' → 'pro'/'unlimited'
- Update all database functions (check_reflection_limit, check_dream_limit)
- Update TypeScript types across codebase
- Zero-downtime requirement: must work during migration

**Database Migration:**
```sql
-- Migration: 20251201_001_rename_tiers_to_pro_unlimited.sql

-- Step 1: Update users table constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'pro', 'unlimited'));

-- Step 2: Migrate existing data
UPDATE public.users SET tier = 'pro' WHERE tier = 'essential';
UPDATE public.users SET tier = 'unlimited' WHERE tier = 'premium';

-- Step 3: Update check_reflection_limit function
CREATE OR REPLACE FUNCTION check_reflection_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
-- (function body with updated tier names)
$$;

-- Step 4: Update check_dream_limit function
CREATE OR REPLACE FUNCTION check_dream_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
-- (function body with updated tier names)
$$;

-- Step 5: Add indexes for PayPal columns (prepare for next migration)
CREATE INDEX IF NOT EXISTS idx_users_paypal_subscription_id 
ON public.users(paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_paypal_payer_id 
ON public.users(paypal_payer_id) WHERE paypal_payer_id IS NOT NULL;
```

**TypeScript Updates:**
```typescript
// types/user.ts
export type SubscriptionTier = 'free' | 'pro' | 'unlimited'; // UPDATED

// lib/utils/constants.ts
export const TIER_LIMITS = {
  free: 2,
  pro: 30,
  unlimited: 60,
} as const;

export const DAILY_LIMITS = {
  free: Infinity,
  pro: 1,
  unlimited: 2,
} as const;
```

**Estimated Builder Splits:** 1 builder (contained migration, well-defined scope)

### Medium Complexity Areas

#### 1. PayPal Client Library (server/lib/paypal.ts) - 4-5 hours
**Complexity:** MEDIUM - Token management, API abstraction

**Implementation:**
```typescript
// server/lib/paypal.ts
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

export async function getPayPalAccessToken(): Promise<string> {
  // Return cached token if still valid (expires in ~9 hours)
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }
  
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  
  const response = await fetch(
    `https://api-m.${process.env.PAYPAL_ENVIRONMENT}.paypal.com/v1/oauth2/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    }
  );
  
  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // Refresh 5 min early
  
  return cachedAccessToken;
}

export async function createSubscription(userId: string, planId: string) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(
    `https://api-m.${process.env.PAYPAL_ENVIRONMENT}.paypal.com/v1/billing/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: userId, // Store userId in metadata
        application_context: {
          brand_name: 'Mirror of Dreams',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.DOMAIN}/subscription/success`,
          cancel_url: `${process.env.DOMAIN}/subscription/cancel`,
        },
      }),
    }
  );
  
  const subscription = await response.json();
  return subscription.links.find(link => link.rel === 'approve').href; // Approval URL
}

export async function cancelSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();
  
  await fetch(
    `https://api-m.${process.env.PAYPAL_ENVIRONMENT}.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        reason: 'User requested cancellation',
      }),
    }
  );
}
```

#### 2. tRPC Subscription Procedures - 3-4 hours
**Complexity:** MEDIUM - API integration, error handling

**Implementation:**
```typescript
// server/trpc/routers/subscriptions.ts
export const subscriptionsRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    // ... existing implementation
  }),
  
  createCheckout: protectedProcedure
    .input(z.object({
      tier: z.enum(['pro', 'unlimited']),
      period: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      const planId = getPlanId(input.tier, input.period);
      const approvalUrl = await createSubscription(ctx.user.id, planId);
      
      return { approvalUrl };
    }),
  
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const { data: user } = await supabase
      .from('users')
      .select('paypal_subscription_id')
      .eq('id', ctx.user.id)
      .single();
    
    if (!user?.paypal_subscription_id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription' });
    }
    
    await cancelSubscription(user.paypal_subscription_id);
    
    // Update database (webhook will handle final status)
    await supabase
      .from('users')
      .update({ subscription_status: 'canceled' })
      .eq('id', ctx.user.id);
    
    return { success: true };
  }),
});
```

### Low Complexity Areas

#### 1. Constants Update (lib/utils/constants.ts) - 30 minutes
**Straightforward implementation:** Replace tier names and limits

#### 2. Environment Variables (.env.example) - 15 minutes
**Straightforward implementation:** Update PayPal plan IDs, remove Stripe variables

#### 3. Type Definitions (types/*.ts) - 1 hour
**Straightforward implementation:** Rename tier types, update interfaces

---

## Integration Points

### External APIs

#### 1. PayPal REST API v2
**Purpose:** Subscription creation, management, cancellation

**Complexity:** MEDIUM - Token management, webhook verification

**Considerations:**
- Access tokens expire every ~9 hours (need refresh logic)
- Sandbox vs Live environment switching
- Rate limiting: 50 requests/second per merchant
- Error handling: PayPal returns different error codes for different failures

**Key Endpoints:**
1. **OAuth Token:** `POST /v1/oauth2/token` - Get access token
2. **Create Subscription:** `POST /v1/billing/subscriptions` - Returns approval URL
3. **Cancel Subscription:** `POST /v1/billing/subscriptions/{id}/cancel`
4. **Get Subscription:** `GET /v1/billing/subscriptions/{id}` - Fetch current status
5. **Verify Webhook:** `POST /v1/notifications/verify-webhook-signature`

**Required Environment Variables:**
```env
PAYPAL_CLIENT_ID=AYZUnPSWX22... (ALREADY CONFIGURED)
PAYPAL_CLIENT_SECRET=EAurh1D6v... (ALREADY CONFIGURED)
PAYPAL_ENVIRONMENT=sandbox (ALREADY CONFIGURED)
PAYPAL_PRO_MONTHLY_PLAN_ID=P-xxxx (TODO - CREATE IN PAYPAL)
PAYPAL_PRO_YEARLY_PLAN_ID=P-xxxx (TODO - CREATE IN PAYPAL)
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=P-xxxx (TODO - CREATE IN PAYPAL)
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=P-xxxx (TODO - CREATE IN PAYPAL)
PAYPAL_WEBHOOK_ID=xxxx (TODO - CREATE IN PAYPAL DASHBOARD)
```

#### 2. Supabase Database
**Purpose:** Store subscription status, track usage limits

**Complexity:** LOW - Existing integration, just schema changes

**Considerations:**
- Row Level Security (RLS) policies already configured
- Need to add indexes for PayPal column lookups
- Ensure migrations run in correct order (tier rename before adding PayPal columns)

### Internal Integrations

#### 1. tRPC Router ↔ PayPal Client Library
**How they connect:**
```
User clicks "Upgrade" 
  → Frontend calls tRPC: subscriptions.createCheckout({ tier: 'pro', period: 'monthly' })
  → tRPC procedure calls PayPal client: createSubscription(userId, planId)
  → PayPal returns approval URL
  → tRPC returns URL to frontend
  → Frontend redirects to PayPal
  → User approves on PayPal site
  → PayPal redirects back to app
  → PayPal sends webhook: BILLING.SUBSCRIPTION.ACTIVATED
  → Webhook handler updates database
```

#### 2. Webhook Handler ↔ Database Functions
**How they connect:**
```
PayPal sends webhook
  → Webhook handler verifies signature
  → Parses event (e.g., BILLING.SUBSCRIPTION.ACTIVATED)
  → Calls Supabase to update users table
  → Database trigger may fire (e.g., update_updated_at_column)
  → Database functions remain available for limit checking (check_reflection_limit, check_daily_limit)
```

#### 3. Reflection Creation ↔ Limit Functions
**How they connect:**
```
User submits reflection
  → tRPC: reflection.create()
  → Middleware: checkUsageLimit()
  → Database: SELECT check_reflection_limit(user_id) AND check_daily_limit(user_id)
  → If TRUE: Allow reflection creation, increment counters
  → If FALSE: Throw TRPCError with limit message
```

---

## Risks & Challenges

### Technical Risks

#### Risk 1: PayPal Webhook Reliability
**Impact:** HIGH - If webhooks fail, user subscriptions become out of sync

**Mitigation Strategy:**
1. **Idempotency:** Store processed webhook IDs in database, skip duplicates
2. **Logging:** Log ALL webhook events to file/database for debugging
3. **Polling Fallback:** Daily cron job to sync subscription status with PayPal API
4. **Manual Reconciliation:** Admin dashboard to manually fix subscription mismatches

**Implementation:**
```typescript
// Create webhook_events table
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB NOT NULL
);

// In webhook handler:
const eventId = event.id;
const { data: existing } = await supabase
  .from('webhook_events')
  .select('id')
  .eq('event_id', eventId)
  .single();

if (existing) {
  console.log('Webhook already processed:', eventId);
  return NextResponse.json({ received: true, duplicate: true });
}

// Process event...

// Store event
await supabase.from('webhook_events').insert({
  event_id: eventId,
  event_type: event.event_type,
  payload: event,
});
```

#### Risk 2: Daily Limit Race Conditions
**Impact:** MEDIUM - Users could bypass daily limits with concurrent requests

**Mitigation Strategy:**
1. **Database-level locking:** Use PostgreSQL row-level locks (`SELECT ... FOR UPDATE`)
2. **Atomic increment:** Update counter in same transaction as reflection creation
3. **Optimistic locking:** Check limit again after reflection insert, rollback if exceeded

**Implementation:**
```sql
-- Add transaction to reflection creation
BEGIN;

-- Lock user row to prevent concurrent updates
SELECT reflections_today 
FROM users 
WHERE id = $1 
FOR UPDATE;

-- Check limit
SELECT check_daily_limit($1);

-- If limit OK, insert reflection and increment counter
INSERT INTO reflections (...) VALUES (...);
UPDATE users SET reflections_today = reflections_today + 1 WHERE id = $1;

COMMIT;
```

#### Risk 3: Timezone Handling Complexity
**Impact:** MEDIUM - Daily limit resets at wrong time for users

**Mitigation Strategy:**
1. **Store user timezone:** Use `timezone` column in users table (already exists!)
2. **Server-side calculation:** Convert `NOW()` to user's timezone before comparing dates
3. **Testing:** Test across multiple timezones (UTC, EST, IST, PST)
4. **Default fallback:** If timezone missing, default to UTC

**Implementation:**
```sql
-- In check_daily_limit function:
today_user_tz := (NOW() AT TIME ZONE user_timezone)::DATE;
```

### Complexity Risks

#### Risk 1: Migration Breaks Existing Users
**Impact:** HIGH - Existing subscribers lose access if migration fails

**Likelihood:** LOW (with proper testing)

**Mitigation:**
1. **Backup before migration:** `pg_dump` before running migration
2. **Test on staging:** Run migration on staging database first
3. **Rollback script:** Prepare rollback migration to undo changes
4. **Verify after migration:** Query users table to confirm tier values updated correctly

**Rollback Script:**
```sql
-- Rollback: Revert tier names
UPDATE public.users SET tier = 'essential' WHERE tier = 'pro';
UPDATE public.users SET tier = 'premium' WHERE tier = 'unlimited';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'essential', 'premium'));
```

#### Risk 2: PayPal Plan Creation Outside Codebase
**Impact:** MEDIUM - If plan IDs change, checkout breaks

**Likelihood:** MEDIUM (manual process in PayPal dashboard)

**Mitigation:**
1. **Document plan creation:** Write step-by-step guide for creating plans
2. **Validate plan IDs:** Check plan IDs exist before deploying
3. **Environment parity:** Use same plan IDs in .env.local and production
4. **Plan ID validation:** Add startup check to verify plan IDs are configured

**Validation:**
```typescript
// server/lib/paypal.ts
export function validatePlanIds() {
  const required = [
    'PAYPAL_PRO_MONTHLY_PLAN_ID',
    'PAYPAL_PRO_YEARLY_PLAN_ID',
    'PAYPAL_UNLIMITED_MONTHLY_PLAN_ID',
    'PAYPAL_UNLIMITED_YEARLY_PLAN_ID',
  ];
  
  for (const key of required) {
    if (!process.env[key] || process.env[key] === 'P-xxxxxxxxxxxxxxxxxxxx') {
      throw new Error(`Missing PayPal plan ID: ${key}`);
    }
  }
}
```

---

## Recommendations for Planner

### 1. Split PayPal Integration into 2 Iterations (HIGH PRIORITY)

**Rationale:** PayPal integration has 3 distinct phases with clear separation points. Attempting all at once increases risk and reduces testing time.

**Proposed Split:**

**Iteration 16 (Foundation):**
- Database schema updates (tier rename, add PayPal columns, daily limit tracking)
- PayPal client library (server/lib/paypal.ts)
- PayPal webhook handler (app/api/webhooks/paypal/route.ts)
- Update constants and types (tier rename throughout codebase)
- Success criteria: Webhooks process correctly, database updates work

**Iteration 17 (Frontend Integration):**
- tRPC subscription procedures (createCheckout, cancel)
- Update pricing page with PayPal checkout flow
- Daily limit enforcement in reflection creation
- Dashboard subscription management UI
- Success criteria: Users can subscribe, see status, cancel subscriptions

**Benefits:**
- Iteration 16 can be tested independently with PayPal sandbox + manual webhook triggers
- Iteration 17 builds on working backend, focusing on UX
- Reduces risk of cascade failures (backend issues won't block frontend work)

### 2. Implement Daily Limits AFTER Core Payment Flow Works (MEDIUM PRIORITY)

**Rationale:** Daily limits are a new feature with timezone complexity. If implemented alongside PayPal migration, debugging becomes difficult (is the issue PayPal or daily limits?).

**Proposed Approach:**
- Iteration 16: Add database columns for daily limits (reflections_today, last_reflection_date) but don't enforce
- Iteration 16: Create check_daily_limit function but don't call it
- Iteration 17: Enable daily limit enforcement after PayPal checkout tested
- Iteration 18 (optional): Polish daily limit UX (countdown timers, better error messages)

**Benefits:**
- Isolates risk - PayPal issues won't be confused with daily limit bugs
- Allows incremental testing - can toggle daily limits on/off with feature flag
- Gives more time to test timezone edge cases

### 3. Create Comprehensive Migration Checklist (HIGH PRIORITY)

**Database Schema Migration:**
```markdown
Migration Checklist:
- [ ] Backup production database
- [ ] Run migration on staging: 20251201_001_rename_tiers.sql
- [ ] Verify tier values: SELECT tier, COUNT(*) FROM users GROUP BY tier;
- [ ] Run migration on staging: 20251201_002_add_paypal_columns.sql
- [ ] Verify indexes created: \d users (in psql)
- [ ] Run migration on staging: 20251201_003_add_daily_limits.sql
- [ ] Test reflection limit function: SELECT check_reflection_limit('user-uuid');
- [ ] Test daily limit function: SELECT check_daily_limit('user-uuid');
- [ ] Run TypeScript build: npm run build
- [ ] Fix TypeScript errors (tier type mismatches)
- [ ] Test locally with updated schema
- [ ] Deploy to production (migration auto-runs)
- [ ] Monitor logs for errors
- [ ] Verify existing subscribers still have correct tier
```

### 4. Use No-SDK Approach for PayPal (HIGH PRIORITY)

**Rationale:** Explorer-2 recommends using PayPal REST API directly via `fetch` instead of `@paypal/checkout-server-sdk`. This aligns with modern best practices and reduces dependency bloat.

**Benefits:**
- Smaller bundle size (no SDK dependency)
- More control over token caching
- Easier debugging (can see exact requests)
- Follows existing pattern (Stripe SDK is only used for webhooks, not API calls)

**Implementation:** Create `server/lib/paypal.ts` with helper functions (getAccessToken, createSubscription, etc.) that use `fetch` directly.

### 5. Add Webhook Event Logging Table (MEDIUM PRIORITY)

**Rationale:** PayPal webhooks are notoriously unreliable. Having a complete audit trail makes debugging subscription issues 10x faster.

**Schema:**
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'paypal',
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  payload JSONB NOT NULL,
  error TEXT,
  user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_user_id ON webhook_events(user_id);
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at DESC);
```

**Benefits:**
- Idempotency: Skip duplicate webhooks by checking event_id
- Debugging: See exactly what PayPal sent and when
- Analytics: Track webhook delivery success rate
- Support: Help users debug subscription issues ("I paid but didn't get upgraded")

### 6. Remove Stripe Code Only After PayPal Proven Working (HIGH PRIORITY)

**Rationale:** Keep Stripe webhook handler as reference until PayPal integration is production-tested. This reduces risk and provides fallback if PayPal issues arise.

**Proposed Approach:**
1. Iteration 16: Keep Stripe code in codebase, rename to `route.stripe-backup.ts.old`
2. Iteration 17: Test PayPal in production for 1 week
3. Iteration 18: If no issues, delete Stripe code

**Benefits:**
- Safety net if PayPal fails in production
- Reference for webhook handler patterns
- Can revert to Stripe if business requirements change

---

## Resource Map

### Critical Files/Directories

#### Database Schema
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20250121000000_initial_schema.sql`
  - **Purpose:** Initial users table schema, defines tier constraint
  - **Changes Needed:** Add PayPal columns (paypal_subscription_id, paypal_payer_id), daily limit columns (reflections_today, last_reflection_date)

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251022200000_add_dreams_feature.sql`
  - **Purpose:** Dreams table, dream limit function
  - **Changes Needed:** Update check_dream_limit function to use 'pro'/'unlimited' tier names

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251112000001_update_reflection_limits.sql`
  - **Purpose:** Reflection limit function (monthly)
  - **Changes Needed:** Update check_reflection_limit to use new tier names and new monthly limits (2/30/60)

#### Backend API
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts`
  - **Purpose:** Subscription management tRPC router
  - **Changes Needed:** Add createCheckout, cancel, upgrade procedures

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/stripe/route.ts`
  - **Purpose:** Template for webhook handler pattern
  - **Changes Needed:** Create parallel PayPal webhook handler at app/api/webhooks/paypal/route.ts

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/` (NEW DIRECTORY)
  - **Purpose:** PayPal client library
  - **Changes Needed:** Create paypal.ts with token management, API helpers

#### Type Definitions
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts`
  - **Purpose:** User and subscription type definitions
  - **Changes Needed:** Update SubscriptionTier to 'free' | 'pro' | 'unlimited'

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/subscription.ts`
  - **Purpose:** Subscription interfaces
  - **Changes Needed:** Replace stripeCustomerId/stripeSubscriptionId with PayPal equivalents

#### Constants
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`
  - **Purpose:** Tier limits and app constants
  - **Changes Needed:** Update TIER_LIMITS (2/30/60), add DAILY_LIMITS (∞/1/2), add DREAM_LIMITS (2/5/∞)

#### Environment Configuration
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/.env.example`
  - **Purpose:** Environment variable template
  - **Changes Needed:** Update PayPal plan IDs (currently TODO), document new variables

### Key Dependencies

#### PayPal REST API v2
**Why it's needed:** Core payment provider, replaces Stripe

**Integration Points:**
- OAuth token endpoint (access token management)
- Subscription creation endpoint (checkout flow)
- Subscription cancellation endpoint (user-initiated cancel)
- Webhook verification endpoint (signature validation)

**Version:** v2 (current stable)
**Documentation:** https://developer.paypal.com/docs/api/subscriptions/v1/

#### Supabase PostgreSQL
**Why it's needed:** Database for user accounts, subscription status, usage tracking

**Integration Points:**
- Users table (subscription tier, status, PayPal IDs)
- Webhook events table (audit trail)
- Database functions (limit checking)

**Version:** PostgreSQL 15 (Supabase managed)

#### Next.js App Router
**Why it's needed:** Webhook handlers must be Next.js routes (not tRPC) for raw body access

**Integration Points:**
- app/api/webhooks/paypal/route.ts (webhook endpoint)

**Version:** Next.js 14

### Testing Infrastructure

#### PayPal Sandbox
**Purpose:** Test payment flows without real money

**Approach:**
1. Use sandbox credentials in .env.local (PAYPAL_ENVIRONMENT=sandbox)
2. Create test buyer account in PayPal developer dashboard
3. Trigger checkout flow, approve with test account
4. Verify webhook events received and processed
5. Test cancellation, suspension, reactivation flows

**Tools:**
- PayPal Developer Dashboard: https://developer.paypal.com/dashboard
- Webhook simulator: Trigger events manually to test handler
- Sandbox accounts: Test buyer/seller accounts with fake money

#### Database Testing
**Purpose:** Verify migrations don't break existing data

**Approach:**
1. Clone production database to staging
2. Run migrations on staging
3. Verify tier values updated correctly
4. Test limit functions with real user IDs
5. Rollback if issues found

**Tools:**
- `pg_dump` for backups
- `psql` for manual verification
- Supabase CLI for migration management

#### Integration Testing
**Purpose:** End-to-end payment flow testing

**Test Cases:**
1. **Subscribe:** User upgrades from Free → Pro
   - Verify redirect to PayPal
   - Approve subscription in PayPal sandbox
   - Verify webhook received
   - Verify user tier updated to 'pro'
   - Verify subscription_status = 'active'

2. **Cancel:** User cancels Pro subscription
   - Call tRPC cancel procedure
   - Verify PayPal subscription canceled
   - Verify user tier remains 'pro' (until period end)
   - Verify subscription_status = 'canceled'

3. **Expire:** Subscription period ends
   - Wait for webhook: BILLING.SUBSCRIPTION.EXPIRED
   - Verify user tier downgraded to 'free'
   - Verify subscription_status = 'expired'

4. **Daily Limit:** Pro user tries 2 reflections in one day
   - Create 1st reflection: Success
   - Create 2nd reflection: Error "Daily limit reached"
   - Wait 24 hours (or mock timezone)
   - Create reflection: Success (counter reset)

**Tools:**
- Playwright/Cypress for E2E tests (optional)
- Manual testing with creator account
- PayPal sandbox for payment simulation

---

## Questions for Planner

### 1. Should we keep generic `subscription_id` column or fully migrate to provider-specific columns?

**Context:** Database has `subscription_id TEXT` (generic) but webhook handler expects `stripe_customer_id` and `stripe_subscription_id` (provider-specific). These columns don't exist.

**Options:**
A) Keep generic `subscription_id`, add `paypal_subscription_id` and `paypal_payer_id` for webhook lookups
B) Replace generic column with provider-specific columns only
C) Keep both (generic for compatibility, specific for performance)

**Recommendation:** Option A - Keep generic for future flexibility (what if we add another payment provider?), add PayPal-specific for webhook efficiency.

### 2. How should we handle timezone for daily limit resets?

**Context:** Daily limits need to reset at midnight in user's timezone, not server timezone. Users table has `timezone` column but may be null for some users.

**Options:**
A) Require timezone during signup (block if missing)
B) Default to UTC if timezone missing
C) Use browser timezone from client (less secure)
D) Default to business timezone (Israel UTC+2)

**Recommendation:** Option B - Default to UTC if missing, allow users to update in profile settings. Most users won't notice difference, power users can customize.

### 3. Should daily limit implementation be in Iteration 16 or Iteration 17?

**Context:** Daily limits are complex (timezone handling, race conditions) and risk delaying PayPal integration if bundled together.

**Options:**
A) Iteration 16: Database + enforcement (all at once)
B) Iteration 16: Database schema only, Iteration 17: Enforcement
C) Iteration 17: Everything (after PayPal proven working)

**Recommendation:** Option B - Add database columns in Iteration 16 (low risk), enable enforcement in Iteration 17 after PayPal tested.

### 4. What should happen to existing 'essential' and 'premium' users during migration?

**Context:** Some users may currently have 'essential' or 'premium' tier. Migration will rename to 'pro'/'unlimited'.

**Options:**
A) Auto-migrate: essential → pro, premium → unlimited (seamless)
B) Email notification: "Your Essential plan is now Pro" (transparent)
C) Grandfather old plans: Keep essential/premium as legacy tiers (complex)

**Recommendation:** Option A + B - Auto-migrate in database, send email explaining name change but emphasizing "same benefits, new name."

### 5. Should we implement polling fallback for webhook failures?

**Context:** PayPal webhooks can fail/delay. Polling PayPal API daily to sync subscription status adds complexity but improves reliability.

**Options:**
A) Webhooks only (simpler, risk of missed events)
B) Webhooks + daily polling (more reliable, more complex)
C) Webhooks + on-demand sync (user can trigger "Refresh subscription status" button)

**Recommendation:** Option C for MVP (Iteration 16), Option B for production hardening (Iteration 18). This balances simplicity with reliability.

---

## Summary

PayPal integration requires:

1. **Database Schema Changes (CRITICAL PATH):**
   - Add PayPal columns: `paypal_subscription_id`, `paypal_payer_id`
   - Add daily limit tracking: `reflections_today`, `last_reflection_date`
   - Update tier constraint: 'free' | 'pro' | 'unlimited'
   - Migrate existing data: essential → pro, premium → unlimited
   - Update functions: `check_reflection_limit`, `check_dream_limit`, new `check_daily_limit`

2. **Backend Implementation:**
   - Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts` (token management, API helpers)
   - Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/paypal/route.ts` (signature verification, event handlers)
   - Update `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts` (add createCheckout, cancel procedures)

3. **Type System Updates:**
   - Update `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts` (SubscriptionTier type)
   - Update `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/subscription.ts` (PayPal interfaces)
   - Update `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` (TIER_LIMITS, DAILY_LIMITS)

4. **Testing Requirements:**
   - PayPal sandbox end-to-end testing
   - Timezone edge case testing for daily limits
   - Migration rollback testing
   - Webhook idempotency testing

**Estimated Total Effort:** 20-25 hours (1 builder, split across 2 iterations for risk mitigation)

**Critical Success Factors:**
- Database migration executes without data loss
- PayPal webhook signature verification works correctly
- Daily limit enforcement handles timezones properly
- Existing users retain access during migration
