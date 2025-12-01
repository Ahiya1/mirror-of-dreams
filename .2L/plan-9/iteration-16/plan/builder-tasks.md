# Builder Tasks for Iteration 16

## Builder 1: Database Schema & Types

### Priority: P0 (Blocking for all other builders)

### Files to Create/Modify
1. **NEW:** `supabase/migrations/20251130000000_paypal_integration.sql`
2. **MODIFY:** `types/user.ts` - Update SubscriptionTier type
3. **MODIFY:** `types/subscription.ts` - Add PayPal types, remove Stripe types
4. **MODIFY:** `lib/utils/constants.ts` - Update TIER_LIMITS, add DAILY_LIMITS

### Detailed Tasks

#### Task 1.1: Create Database Migration
Create comprehensive migration file at `supabase/migrations/20251130000000_paypal_integration.sql`:

**Schema Changes:**
- Add columns to users table:
  - `paypal_subscription_id TEXT`
  - `paypal_payer_id TEXT`
  - `reflections_today INTEGER DEFAULT 0`
  - `last_reflection_date DATE`
  - `cancel_at_period_end BOOLEAN DEFAULT FALSE`
- Update tier CHECK constraint: `'free' | 'pro' | 'unlimited'`
- Migrate existing data: `essential→pro`, `premium→unlimited`
- Create index on `paypal_subscription_id`
- Create `webhook_events` table for idempotency

**Database Functions to Update:**
- `check_reflection_limit()` - Update tier names and limits (2/30/60)
- `check_dream_limit()` - Update tier names (free:2, pro:5, unlimited:∞)
- `check_daily_limit()` - NEW function for daily limit checking

#### Task 1.2: Update TypeScript Types
**File: `types/user.ts`**
```typescript
// Change line 3 from:
export type SubscriptionTier = 'free' | 'essential' | 'premium';
// To:
export type SubscriptionTier = 'free' | 'pro' | 'unlimited';

// Add to User interface:
reflectionsToday: number;
lastReflectionDate: string | null;
cancelAtPeriodEnd: boolean;
```

**File: `types/subscription.ts`**
- Remove `stripeCustomerId` and `stripeSubscriptionId`
- Add `paypalSubscriptionId` and `paypalPayerId`
- Update `StripeConfig` to `PayPalConfig`

#### Task 1.3: Update Constants
**File: `lib/utils/constants.ts`**
```typescript
export const TIER_LIMITS = {
  free: 2,
  pro: 30,
  unlimited: 60,
} as const;

export const DAILY_LIMITS = {
  free: Infinity,  // No daily limit
  pro: 1,
  unlimited: 2,
} as const;

export const DREAM_LIMITS = {
  free: 2,
  pro: 5,
  unlimited: Infinity,
} as const;
```

#### Task 1.4: Run Migration
- Test migration locally: `supabase db push`
- Verify tier values migrated correctly
- Verify all functions updated

### Success Criteria
- [ ] Migration runs without errors
- [ ] Existing 'essential' users become 'pro'
- [ ] Existing 'premium' users become 'unlimited'
- [ ] TypeScript compiles with no tier-related errors
- [ ] All database functions work with new tier names

---

## Builder 2: PayPal Client Library

### Priority: P0 (Required by Builder 3 and Builder 4)

### Dependencies
- Builder 1 must complete types first

### Files to Create
1. **NEW:** `server/lib/paypal.ts`

### Detailed Tasks

#### Task 2.1: Create PayPal Client Module
Create `server/lib/paypal.ts` with:

**Token Management:**
```typescript
let cachedToken: { token: string; expiresAt: number } | null = null;
export async function getPayPalAccessToken(): Promise<string>
```

**API Helper:**
```typescript
async function paypalFetch<T>(endpoint: string, options?: RequestInit): Promise<T>
```

**Core Functions:**
```typescript
export async function createSubscription(userId: string, planId: string): Promise<string>
// Returns approval URL for redirect

export async function cancelSubscription(subscriptionId: string): Promise<void>
// Cancels subscription via PayPal API

export async function getSubscriptionDetails(subscriptionId: string): Promise<PayPalSubscription>
// Gets current subscription status

export async function verifyWebhookSignature(
  body: string,
  headers: PayPalWebhookHeaders
): Promise<boolean>
// Verifies webhook signature via PayPal API
```

**Helper Functions:**
```typescript
export function getPlanId(tier: 'pro' | 'unlimited', period: 'monthly' | 'yearly'): string
// Returns plan ID from environment variables

export function determineTierFromPlanId(planId: string): 'pro' | 'unlimited'
// Maps plan ID back to tier name

export function determinePeriodFromPlanId(planId: string): 'monthly' | 'yearly'
// Maps plan ID back to period
```

#### Task 2.2: Environment Configuration
Ensure environment variables are properly typed and validated:
```typescript
function getPayPalConfig() {
  const required = [
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_ENVIRONMENT',
    'PAYPAL_WEBHOOK_ID',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  return {
    clientId: process.env.PAYPAL_CLIENT_ID!,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
    environment: process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live',
    webhookId: process.env.PAYPAL_WEBHOOK_ID!,
    baseUrl: process.env.PAYPAL_ENVIRONMENT === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com',
  };
}
```

### Success Criteria
- [ ] Token caching works (doesn't request new token on every call)
- [ ] createSubscription returns valid approval URL
- [ ] cancelSubscription successfully cancels in PayPal sandbox
- [ ] verifyWebhookSignature correctly validates PayPal signatures
- [ ] Plan ID mapping works for all 4 plans

---

## Builder 3: PayPal Webhook Handler

### Priority: P0 (Core payment processing)

### Dependencies
- Builder 2 must complete PayPal client library

### Files to Create
1. **NEW:** `app/api/webhooks/paypal/route.ts`

### Detailed Tasks

#### Task 3.1: Create Webhook Route Handler
Create `app/api/webhooks/paypal/route.ts`:

**Structure:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase';
import { verifyWebhookSignature, determineTierFromPlanId, determinePeriodFromPlanId } from '@/server/lib/paypal';

export async function POST(req: NextRequest) {
  // 1. Get raw body and headers
  // 2. Verify signature
  // 3. Check idempotency (webhook_events table)
  // 4. Log event before processing
  // 5. Handle event by type
  // 6. Return 200
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

#### Task 3.2: Implement Event Handlers

**BILLING.SUBSCRIPTION.ACTIVATED:**
```typescript
async function handleSubscriptionActivated(event: PayPalWebhookEvent) {
  const subscription = event.resource;
  const userId = subscription.custom_id;
  const tier = determineTierFromPlanId(subscription.plan_id);
  const period = determinePeriodFromPlanId(subscription.plan_id);

  await supabase
    .from('users')
    .update({
      tier,
      subscription_status: 'active',
      subscription_period: period,
      subscription_started_at: new Date().toISOString(),
      paypal_subscription_id: subscription.id,
      paypal_payer_id: subscription.subscriber.payer_id,
      subscription_id: subscription.id,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`[PayPal] Activated subscription for user ${userId}, tier: ${tier}`);
}
```

**BILLING.SUBSCRIPTION.CANCELLED:**
```typescript
async function handleSubscriptionCancelled(event: PayPalWebhookEvent) {
  const subscription = event.resource;

  // Find user by PayPal subscription ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('paypal_subscription_id', subscription.id)
    .single();

  if (!user) {
    console.error(`[PayPal] User not found for subscription ${subscription.id}`);
    return;
  }

  // Keep tier but mark as canceled at period end
  await supabase
    .from('users')
    .update({
      cancel_at_period_end: true,
      subscription_expires_at: subscription.billing_info?.next_billing_time,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  console.log(`[PayPal] Subscription cancelled for user ${user.id}`);
}
```

**BILLING.SUBSCRIPTION.EXPIRED:**
```typescript
async function handleSubscriptionExpired(event: PayPalWebhookEvent) {
  const subscription = event.resource;

  await supabase
    .from('users')
    .update({
      tier: 'free',
      subscription_status: 'expired',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_subscription_id', subscription.id);

  console.log(`[PayPal] Subscription expired, downgraded to free`);
}
```

**BILLING.SUBSCRIPTION.SUSPENDED:**
```typescript
async function handleSubscriptionSuspended(event: PayPalWebhookEvent) {
  const subscription = event.resource;

  await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_subscription_id', subscription.id);

  console.log(`[PayPal] Subscription suspended (payment failed)`);
}
```

#### Task 3.3: Implement Idempotency
Check webhook_events table before processing:
```typescript
const { data: existing } = await supabase
  .from('webhook_events')
  .select('id')
  .eq('event_id', event.id)
  .single();

if (existing) {
  console.log('[PayPal Webhook] Duplicate event:', event.id);
  return NextResponse.json({ received: true, duplicate: true });
}

// Insert before processing
await supabase.from('webhook_events').insert({
  event_id: event.id,
  event_type: event.event_type,
  payload: event,
});
```

### Success Criteria
- [ ] Webhook endpoint responds 200 for valid requests
- [ ] Signature verification rejects invalid signatures
- [ ] BILLING.SUBSCRIPTION.ACTIVATED upgrades user tier
- [ ] BILLING.SUBSCRIPTION.CANCELLED sets cancel_at_period_end
- [ ] BILLING.SUBSCRIPTION.EXPIRED downgrades to free
- [ ] BILLING.SUBSCRIPTION.SUSPENDED sets past_due status
- [ ] Duplicate events are skipped (idempotency works)
- [ ] All events logged to webhook_events table

---

## Builder 4: tRPC Procedures & Middleware

### Priority: P0 (Frontend integration point)

### Dependencies
- Builder 1 must complete types/constants
- Builder 2 must complete PayPal client

### Files to Modify
1. **MODIFY:** `server/trpc/routers/subscriptions.ts`
2. **MODIFY:** `server/trpc/middleware.ts`
3. **MODIFY:** `server/lib/cost-calculator.ts`

### Detailed Tasks

#### Task 4.1: Expand Subscriptions Router
Update `server/trpc/routers/subscriptions.ts`:

**Add createCheckout procedure:**
```typescript
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
```

**Add cancel procedure:**
```typescript
cancel: protectedProcedure.mutation(async ({ ctx }) => {
  const { data: user } = await supabase
    .from('users')
    .select('paypal_subscription_id')
    .eq('id', ctx.user.id)
    .single();

  if (!user?.paypal_subscription_id) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'No subscription' });
  }

  await cancelSubscription(user.paypal_subscription_id);
  await supabase
    .from('users')
    .update({ cancel_at_period_end: true })
    .eq('id', ctx.user.id);

  return { success: true };
}),
```

**Update getStatus to include new fields:**
- Add `cancelAtPeriodEnd` to return value
- Use new column names

#### Task 4.2: Add Daily Limit Check to Middleware
Update `server/trpc/middleware.ts`:

Add daily limit checking to `checkUsageLimit`:
```typescript
// Check daily limit first (Pro and Unlimited only)
if (ctx.user.tier === 'pro' || ctx.user.tier === 'unlimited') {
  const dailyLimit = DAILY_LIMITS[ctx.user.tier];
  const today = new Date().toISOString().split('T')[0];
  const lastDate = ctx.user.lastReflectionDate;

  if (lastDate === today && ctx.user.reflectionsToday >= dailyLimit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Daily reflection limit reached (${dailyLimit}/day). Try again tomorrow.`,
    });
  }
}
```

#### Task 4.3: Update Cost Calculator
Update `server/lib/cost-calculator.ts`:

**Change tier type:**
```typescript
// From:
export function getThinkingBudget(tier: 'free' | 'essential' | 'optimal' | 'premium'): number {
  if (tier === 'optimal' || tier === 'premium') {
// To:
export function getThinkingBudget(tier: 'free' | 'pro' | 'unlimited'): number {
  if (tier === 'unlimited') {  // Only unlimited gets extended thinking
```

#### Task 4.4: Update Reflection Counter Logic
Ensure reflection creation updates both daily and monthly counters:
```typescript
// After creating reflection, update counters
const today = new Date().toISOString().split('T')[0];

await supabase
  .from('users')
  .update({
    reflection_count_this_month: ctx.user.reflectionCountThisMonth + 1,
    reflections_today: ctx.user.lastReflectionDate === today
      ? ctx.user.reflectionsToday + 1
      : 1,
    last_reflection_date: today,
    last_reflection_at: new Date().toISOString(),
    total_reflections: ctx.user.totalReflections + 1,
  })
  .eq('id', ctx.user.id);
```

### Success Criteria
- [ ] createCheckout returns valid PayPal approval URL
- [ ] cancel successfully cancels and sets cancel_at_period_end
- [ ] getStatus returns all subscription fields correctly
- [ ] Daily limit check blocks excess reflections for Pro/Unlimited
- [ ] Monthly limit check works with new limits (2/30/60)
- [ ] Extended thinking only enabled for 'unlimited' tier
- [ ] Reflection counter updates both daily and monthly counts

---

## Pre-Build Setup: Create PayPal Products & Plans

### Before builders start, create PayPal products and plans via MCP tools:

**Step 1: Create Products**
```
1. Mirror of Dreams Pro (SERVICE product)
2. Mirror of Dreams Unlimited (SERVICE product)
```

**Step 2: Create Subscription Plans**
```
1. Pro Monthly: $15/month
2. Pro Yearly: $150/year
3. Unlimited Monthly: $29/month
4. Unlimited Yearly: $290/year
```

**Step 3: Store Plan IDs**
Update `.env.local` with the created plan IDs:
```
PAYPAL_PRO_MONTHLY_PLAN_ID=P-xxxxx
PAYPAL_PRO_YEARLY_PLAN_ID=P-xxxxx
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=P-xxxxx
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=P-xxxxx
```

---

## Execution Order

1. **Pre-Build:** Create PayPal products/plans via MCP
2. **Builder 1:** Database & Types (blocking)
3. **Builder 2:** PayPal Client Library (depends on Builder 1)
4. **Builder 3:** Webhook Handler (depends on Builder 2)
5. **Builder 4:** tRPC & Middleware (depends on Builder 1, 2)

Builders 2, 3, 4 can run in parallel after Builder 1 completes, but Builder 3 needs Builder 2's client library.
