# Explorer 2 Report: PayPal Integration Requirements & Environment Setup

## Executive Summary

PayPal integration is well-positioned for implementation. Environment variables are already documented in `.env.example` with clear structure. Stripe webhook handler at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/stripe/route.ts` provides excellent template for PayPal webhook implementation. Current tier system uses `free | essential | premium` which needs updating to `free | pro | unlimited` across 8+ files. Daily limit tracking requires new database columns (`reflections_today`, `last_reflection_date`). PayPal SDK NOT currently installed - needs `@paypal/checkout-server-sdk` package.

## Discoveries

### Current Environment Configuration

**PayPal Variables Already Defined** (from `.env.example` lines 59-81):
- `PAYPAL_CLIENT_ID` - API credentials
- `PAYPAL_CLIENT_SECRET` - API credentials  
- `PAYPAL_ENVIRONMENT` - sandbox vs live
- `PAYPAL_PRO_MONTHLY_PLAN_ID` - P-xxxxxxxxxxxxxxxxxxxx format
- `PAYPAL_PRO_YEARLY_PLAN_ID` - P-xxxxxxxxxxxxxxxxxxxx format
- `PAYPAL_UNLIMITED_MONTHLY_PLAN_ID` - P-xxxxxxxxxxxxxxxxxxxx format
- `PAYPAL_UNLIMITED_YEARLY_PLAN_ID` - P-xxxxxxxxxxxxxxxxxxxx format
- `PAYPAL_WEBHOOK_ID` - For webhook verification

**Pricing Structure Documented**:
```
Pro: $15/mo, $150/yr - 5 dreams, 30 reflections/month (max 1/day)
Unlimited: $29/mo, $290/yr - unlimited dreams, 60 reflections/month (max 2/day)
```

**Note**: Comment says "5 dreams" but master plan says Pro should have existing dream limit. This needs clarification from planner.

### Database Schema Analysis

**Current Subscription Fields** (from `supabase/migrations/20250121000000_initial_schema.sql` lines 26-31):
```sql
tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'essential', 'premium')),
subscription_status TEXT NOT NULL DEFAULT 'active',
subscription_id TEXT, -- External subscription ID (Stripe/PayPal)
subscription_period TEXT DEFAULT 'monthly' CHECK (subscription_period IN ('monthly', 'yearly')),
subscription_started_at TIMESTAMP WITH TIME ZONE,
subscription_expires_at TIMESTAMP WITH TIME ZONE,
```

**Missing for PayPal**:
- `paypal_subscription_id` TEXT (for PayPal-specific ID)
- `paypal_payer_id` TEXT (for customer identification)
- `reflections_today` INTEGER DEFAULT 0 (for daily limits)
- `last_reflection_date` DATE (for daily reset logic)
- `cancel_at_period_end` BOOLEAN DEFAULT FALSE (for graceful cancellation)

**Current Usage Tracking** (lines 34-37):
```sql
last_reflection_at TIMESTAMP WITH TIME ZONE,
reflection_count_this_month INTEGER DEFAULT 0,
total_reflections INTEGER DEFAULT 0,
current_month_year TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
```

### Cost Calculator Tier Logic

**Current Implementation** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/cost-calculator.ts` lines 62-68):
```typescript
export function getThinkingBudget(tier: 'free' | 'essential' | 'optimal' | 'premium'): number {
  // Extended thinking available for Optimal and Premium tiers
  if (tier === 'optimal' || tier === 'premium') {
    return 5000; // 5K token budget for extended thinking
  }
  return 0;
}
```

**Issues Found**:
1. Uses `'optimal'` tier which doesn't exist in database schema
2. Should use `'free' | 'pro' | 'unlimited'` to match new tier names
3. Extended thinking should only be for `'unlimited'` tier per master plan

**Required Update**:
```typescript
export function getThinkingBudget(tier: 'free' | 'pro' | 'unlimited'): number {
  // Extended thinking available for Unlimited tier only
  if (tier === 'unlimited') {
    return 5000; // 5K token budget for extended thinking
  }
  return 0;
}
```

### Tier Limits Configuration

**Current Implementation** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` lines 3-7):
```typescript
export const TIER_LIMITS = {
  free: 10,
  essential: 50,
  premium: Infinity,
} as const;
```

**Required Update** (per master plan):
```typescript
export const TIER_LIMITS = {
  free: 2,        // 2 reflections/month total (no daily limit - they can do 2 in one day)
  pro: 30,        // 30/month with max 1/day
  unlimited: 60,  // 60/month with max 2/day
} as const;
```

### Reflection Middleware - Usage Limit Checking

**Current Implementation** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` lines 56-78):
```typescript
export const checkUsageLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Creators and admins have unlimited usage
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  const limit = TIER_LIMITS[ctx.user.tier];
  const usage = ctx.user.reflectionCountThisMonth;

  if (usage >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly reflection limit reached (${limit}). Please upgrade or wait until next month.`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**What Needs Updating**:
1. Add daily limit check BEFORE monthly check
2. Check `reflections_today` against daily limits:
   - Pro tier: max 1/day
   - Unlimited tier: max 2/day  
   - Free tier: no daily limit (only monthly)
3. Check if `last_reflection_date` is today (UTC)
4. If date changed, reset `reflections_today` to 0
5. Then check monthly limit as before

**New Daily Limit Logic**:
```typescript
// Check daily limits (Pro and Unlimited tiers only)
if (ctx.user.tier === 'pro' || ctx.user.tier === 'unlimited') {
  const dailyLimit = ctx.user.tier === 'pro' ? 1 : 2;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lastDate = ctx.user.lastReflectionDate;
  
  if (lastDate === today && ctx.user.reflectionsToday >= dailyLimit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Daily reflection limit reached (${dailyLimit}/day for ${ctx.user.tier}). Try again tomorrow.`,
    });
  }
}
```

### Stripe Webhook Handler Template

**Existing Pattern** (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/stripe/route.ts`):

**Key Patterns to Replicate for PayPal**:

1. **Raw Body Reading** (lines 13-15):
```typescript
async function getRawBody(req: NextRequest): Promise<string> {
  return await req.text();
}
```

2. **Signature Verification** (lines 40-51):
```typescript
event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

3. **Event Routing** (lines 54-76):
```typescript
switch (event.type) {
  case 'checkout.session.completed':
    await handleCheckoutCompleted(event);
    break;
  // ... other cases
}
```

4. **Database Updates** (lines 112-123):
```typescript
await supabase
  .from('users')
  .update({
    tier,
    subscription_status: 'active',
    subscription_period: period,
    subscription_started_at: new Date().toISOString(),
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId);
```

## PayPal API Integration Requirements

### Required PayPal SDK

**Package NOT Currently Installed**:
- Current: `package.json` has `"stripe": "^18.3.0"` (line 75)
- Required: `@paypal/checkout-server-sdk` (official PayPal Node SDK)

**Installation Command**:
```bash
npm install @paypal/checkout-server-sdk
```

### PayPal REST API Endpoints Needed

#### 1. OAuth Token Management
**Endpoint**: `POST /v1/oauth2/token`  
**Purpose**: Get access token (expires in 9 hours)  
**Request**:
```bash
curl -v https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```
**Response**:
```json
{
  "access_token": "A21AAL...",
  "token_type": "Bearer",
  "expires_in": 32400
}
```

#### 2. Create Subscription
**Endpoint**: `POST /v1/billing/subscriptions`  
**Purpose**: Create new subscription for user  
**Request Body**:
```json
{
  "plan_id": "P-xxxxxxxxxxxxxxxxxxxx",
  "application_context": {
    "brand_name": "Mirror of Dreams",
    "return_url": "https://mirror-of-truth.com/subscription?status=success",
    "cancel_url": "https://mirror-of-truth.com/subscription?status=canceled",
    "user_action": "SUBSCRIBE_NOW"
  },
  "custom_id": "user_uuid_here"
}
```
**Response**:
```json
{
  "id": "I-BW452GLLEP1G",
  "status": "APPROVAL_PENDING",
  "links": [
    {
      "href": "https://www.paypal.com/webapps/billing/subscriptions?ba_token=...",
      "rel": "approve"
    }
  ]
}
```

#### 3. Cancel Subscription
**Endpoint**: `POST /v1/billing/subscriptions/{subscription_id}/cancel`  
**Purpose**: Cancel subscription at period end  
**Request Body**:
```json
{
  "reason": "User requested cancellation"
}
```

#### 4. Get Subscription Details
**Endpoint**: `GET /v1/billing/subscriptions/{subscription_id}`  
**Purpose**: Check subscription status, billing dates  
**Response**:
```json
{
  "id": "I-BW452GLLEP1G",
  "status": "ACTIVE",
  "status_update_time": "2025-11-30T12:00:00Z",
  "plan_id": "P-xxxxxxxxxxxxxxxxxxxx",
  "billing_info": {
    "next_billing_time": "2025-12-30T10:00:00Z",
    "cycle_executions": [
      {
        "tenure_type": "REGULAR",
        "sequence": 1,
        "cycles_completed": 0
      }
    ]
  },
  "subscriber": {
    "payer_id": "PAYERID123",
    "email_address": "user@example.com"
  }
}
```

### PayPal Webhook Events to Handle

#### Event 1: BILLING.SUBSCRIPTION.ACTIVATED
**When**: User completes checkout and approves subscription  
**Action**: Upgrade user tier to pro/unlimited
```typescript
await supabase.from('users').update({
  tier: determineTierFromPlanId(subscription.plan_id),
  subscription_status: 'active',
  subscription_period: determinePeriodFromPlanId(subscription.plan_id),
  paypal_subscription_id: subscription.id,
  paypal_payer_id: subscription.subscriber.payer_id,
  subscription_started_at: new Date().toISOString(),
}).eq('custom_id', subscription.custom_id); // custom_id = user_id
```

#### Event 2: BILLING.SUBSCRIPTION.CANCELLED
**When**: User or PayPal cancels subscription  
**Action**: Set cancel_at_period_end flag (keep access until expiry)
```typescript
const { data: subscription } = await getSubscriptionDetails(subscriptionId);
await supabase.from('users').update({
  cancel_at_period_end: true,
  subscription_expires_at: subscription.billing_info.next_billing_time,
}).eq('paypal_subscription_id', subscriptionId);
```

#### Event 3: BILLING.SUBSCRIPTION.EXPIRED
**When**: Subscription period ends (after cancellation or failed payment)  
**Action**: Downgrade to free tier
```typescript
await supabase.from('users').update({
  tier: 'free',
  subscription_status: 'expired',
  cancel_at_period_end: false,
}).eq('paypal_subscription_id', subscriptionId);
```

#### Event 4: BILLING.SUBSCRIPTION.SUSPENDED
**When**: Payment fails  
**Action**: Mark as past_due but keep tier access temporarily
```typescript
await supabase.from('users').update({
  subscription_status: 'past_due',
}).eq('paypal_subscription_id', subscriptionId);
```

#### Event 5: BILLING.SUBSCRIPTION.PAYMENT.FAILED
**When**: Renewal payment fails  
**Action**: Log failure, mark past_due if not already
```typescript
console.error(`Payment failed for subscription ${subscriptionId}`);
await supabase.from('users').update({
  subscription_status: 'past_due',
}).eq('paypal_subscription_id', subscriptionId);
```

### Webhook Signature Verification

PayPal uses **webhook signature verification** via verification API (NOT local computation like Stripe).

**Verification Endpoint**: `POST /v1/notifications/verify-webhook-signature`  
**Request Body**:
```json
{
  "transmission_id": "69cd13f0-d67a-11e5-baa3-a0369f3b7a4c",
  "transmission_time": "2025-11-30T19:01:01Z",
  "cert_url": "https://api.paypal.com/v1/notifications/certs/...",
  "auth_algo": "SHA256withRSA",
  "transmission_sig": "lmI95Jx3Y9...",
  "webhook_id": "1JE4291016473214C",
  "webhook_event": { /* full event object */ }
}
```
**Response**:
```json
{
  "verification_status": "SUCCESS"
}
```

**Implementation Pattern**:
```typescript
const verificationData = {
  transmission_id: req.headers.get('paypal-transmission-id'),
  transmission_time: req.headers.get('paypal-transmission-time'),
  cert_url: req.headers.get('paypal-cert-url'),
  auth_algo: req.headers.get('paypal-auth-algo'),
  transmission_sig: req.headers.get('paypal-transmission-sig'),
  webhook_id: process.env.PAYPAL_WEBHOOK_ID,
  webhook_event: JSON.parse(body),
};

const response = await fetch(
  `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(verificationData),
  }
);

const result = await response.json();
if (result.verification_status !== 'SUCCESS') {
  throw new Error('Invalid webhook signature');
}
```

## PayPal MCP Tool Usage

### Available MCP Tools

Based on the mission briefing, we have access to PayPal MCP tools for creating products and plans:

#### Tool 1: mcp__paypal__create_product
**Purpose**: Create product catalog entries  
**Usage**:
```typescript
// Create Pro product
const proProduct = await mcp__paypal__create_product({
  name: "Mirror of Dreams Pro",
  description: "Pro tier: 30 reflections/month, max 1/day, 5 dreams",
  type: "SERVICE",
  category: "SOFTWARE"
});

// Create Unlimited product
const unlimitedProduct = await mcp__paypal__create_product({
  name: "Mirror of Dreams Unlimited",
  description: "Unlimited tier: 60 reflections/month, max 2/day, unlimited dreams, extended thinking",
  type: "SERVICE",
  category: "SOFTWARE"
});
```

#### Tool 2: mcp__paypal__create_subscription_plan
**Purpose**: Create subscription plans with billing cycles  
**Usage**:
```typescript
// Pro Monthly - $15/month
const proMonthly = await mcp__paypal__create_subscription_plan({
  product_id: proProduct.id,
  name: "Pro Monthly",
  billing_cycles: [
    {
      frequency: { interval_unit: "MONTH", interval_count: 1 },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0, // infinite
      pricing_scheme: {
        fixed_price: { value: "15", currency_code: "USD" }
      }
    }
  ],
  payment_preferences: {
    auto_bill_outstanding: true,
    setup_fee_failure_action: "CONTINUE",
    payment_failure_threshold: 3
  }
});

// Pro Yearly - $150/year (save $30)
const proYearly = await mcp__paypal__create_subscription_plan({
  product_id: proProduct.id,
  name: "Pro Yearly",
  billing_cycles: [
    {
      frequency: { interval_unit: "YEAR", interval_count: 1 },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: {
        fixed_price: { value: "150", currency_code: "USD" }
      }
    }
  ],
  payment_preferences: {
    auto_bill_outstanding: true,
    setup_fee_failure_action: "CONTINUE",
    payment_failure_threshold: 3
  }
});

// Unlimited Monthly - $29/month
const unlimitedMonthly = await mcp__paypal__create_subscription_plan({
  product_id: unlimitedProduct.id,
  name: "Unlimited Monthly",
  billing_cycles: [
    {
      frequency: { interval_unit: "MONTH", interval_count: 1 },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: {
        fixed_price: { value: "29", currency_code: "USD" }
      }
    }
  ],
  payment_preferences: {
    auto_bill_outstanding: true,
    setup_fee_failure_action: "CONTINUE",
    payment_failure_threshold: 3
  }
});

// Unlimited Yearly - $290/year (save $58)
const unlimitedYearly = await mcp__paypal__create_subscription_plan({
  product_id: unlimitedProduct.id,
  name: "Unlimited Yearly",
  billing_cycles: [
    {
      frequency: { interval_unit: "YEAR", interval_count: 1 },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: {
        fixed_price: { value: "290", currency_code: "USD" }
      }
    }
  ],
  payment_preferences: {
    auto_bill_outstanding: true,
    setup_fee_failure_action: "CONTINUE",
    payment_failure_threshold: 3
  }
});
```

### Plan ID Storage

After creating plans via MCP, store the Plan IDs in environment variables:

```bash
# .env.local
PAYPAL_PRO_MONTHLY_PLAN_ID=P-xxxxxxxxxxxxxxxxxxxxx1
PAYPAL_PRO_YEARLY_PLAN_ID=P-xxxxxxxxxxxxxxxxxxxxx2
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=P-xxxxxxxxxxxxxxxxxxxxx3
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=P-xxxxxxxxxxxxxxxxxxxxx4
```

## Complexity Assessment

### High Complexity Areas

**Daily Limit Tracking with Date Resets (MEDIUM-HIGH)**
- **Challenge**: Atomic updates to prevent race conditions when checking/incrementing daily counter
- **Solution**: PostgreSQL transaction with row-level locking
- **Code Pattern**:
```typescript
// Use PostgreSQL UPDATE...RETURNING for atomic operation
const { data, error } = await supabase.rpc('increment_reflection_with_daily_check', {
  p_user_id: userId,
  p_today: new Date().toISOString().split('T')[0],
});
```
- **Database Function Needed**:
```sql
CREATE OR REPLACE FUNCTION increment_reflection_with_daily_check(
  p_user_id UUID,
  p_today DATE
) RETURNS TABLE (
  reflections_today INTEGER,
  reflection_count_this_month INTEGER,
  daily_limit_reached BOOLEAN
) AS $$
BEGIN
  UPDATE users SET
    reflections_today = CASE 
      WHEN last_reflection_date = p_today THEN reflections_today + 1
      ELSE 1
    END,
    last_reflection_date = p_today,
    reflection_count_this_month = reflection_count_this_month + 1,
    total_reflections = total_reflections + 1,
    last_reflection_at = NOW()
  WHERE id = p_user_id
  RETURNING 
    reflections_today,
    reflection_count_this_month,
    (tier = 'pro' AND reflections_today >= 1) OR
    (tier = 'unlimited' AND reflections_today >= 2) AS daily_limit_reached;
END;
$$ LANGUAGE plpgsql;
```

**PayPal Webhook Signature Verification (HIGH)**
- **Challenge**: PayPal requires API call to verify signatures (not local computation)
- **Risks**: Need valid access token, network latency, verification API might fail
- **Mitigation**: Cache access token, implement retry logic, fail open cautiously
- **Estimated Complexity**: 3-4 hours for robust implementation

**Tier Renaming Across Codebase (MEDIUM)**
- **Challenge**: `essential` → `pro`, `premium` → `unlimited` across 20+ files
- **Files to Update**:
  1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts` (line 3)
  2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` (lines 3-7)
  3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/cost-calculator.ts` (line 62)
  4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` (line 54)
  5. Database migration (tier CHECK constraint)
  6. All frontend components displaying tier names
- **Mitigation**: TypeScript will catch most type mismatches, but need careful grep for string literals

### Medium Complexity Areas

**Access Token Caching (MEDIUM)**
- **Pattern**: In-memory cache with expiry check
- **Implementation**:
```typescript
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5min buffer
  };
  
  return cachedToken.token;
}
```

**Webhook Idempotency (MEDIUM)**
- **Pattern**: Store processed webhook IDs in database
- **Table Schema**:
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB
);
```
- **Check Before Processing**:
```typescript
const { data: existing } = await supabase
  .from('webhook_events')
  .select('id')
  .eq('event_id', event.id)
  .single();

if (existing) {
  console.log('Webhook already processed:', event.id);
  return NextResponse.json({ received: true, status: 'duplicate' });
}
```

### Low Complexity Areas

**tRPC Subscription Procedures (LOW)**
- **Reason**: Clear API patterns to follow from Stripe implementation
- **Estimated Time**: 2-3 hours for all procedures

**Type System Updates (LOW)**
- **Reason**: Straightforward find-replace with TypeScript compiler validation
- **Estimated Time**: 1 hour

## Technology Recommendations

### Primary Stack (Already in Place)

**PayPal SDK**: `@paypal/checkout-server-sdk`
- **Why**: Official PayPal Node.js SDK
- **Version**: Latest (^1.0.0)
- **Installation**: `npm install @paypal/checkout-server-sdk`

**Alternatives Considered**:
- `paypal-rest-sdk` (deprecated, don't use)
- Raw REST API calls (more code, no type safety)

### Supporting Libraries (Already in Place)

All required libraries already installed:
- `@trpc/server` - tRPC backend procedures
- `@supabase/supabase-js` - Database access
- `zod` - Schema validation
- `next` - API route handlers

**No additional dependencies needed** besides PayPal SDK.

## Integration Points

### External APIs

**PayPal REST API**
- **Base URL (Sandbox)**: `https://api-m.sandbox.paypal.com`
- **Base URL (Live)**: `https://api-m.paypal.com`
- **Authentication**: OAuth 2.0 Client Credentials
- **Rate Limits**: Unknown - implement exponential backoff
- **Complexity**: MEDIUM-HIGH (webhook verification adds complexity)

**PayPal Webhook Verification API**
- **Endpoint**: `POST /v1/notifications/verify-webhook-signature`
- **Purpose**: Server-side signature verification
- **Dependency**: Requires valid access token
- **Challenge**: Additional network hop for every webhook

### Internal Integrations

**Database ↔ Webhook Handler**
- **Pattern**: Direct Supabase client usage in webhook route
- **Data Flow**: PayPal webhook → verify signature → update users table → respond 200
- **Error Handling**: Log failures but return 200 to prevent retries

**tRPC ↔ PayPal Client Library**
- **Pattern**: Import PayPal client functions in subscription router
- **Data Flow**: Frontend → tRPC mutation → PayPal API → return approval URL
- **Type Safety**: Zod schema for inputs, PayPal SDK types for responses

**Middleware ↔ Daily Limit Logic**
- **Pattern**: Call PostgreSQL function for atomic check + increment
- **Data Flow**: Reflection request → middleware → RPC call → allow/deny
- **Race Condition Prevention**: Database-level locking

## Risks & Challenges

### Technical Risks

**Webhook Signature Verification Failure (HIGH)**
- **Impact**: Could allow unauthorized webhook processing or block legitimate webhooks
- **Mitigation**: 
  1. Test extensively in sandbox with real webhooks
  2. Implement comprehensive logging
  3. Add manual verification fallback for support team
  4. Monitor verification success rate in production

**Daily Limit Race Conditions (MEDIUM)**
- **Impact**: Users might bypass 1/day or 2/day limits with concurrent requests
- **Mitigation**: Use PostgreSQL stored procedure with row-level locking (shown above)

**Access Token Expiry During Webhook Processing (LOW)**
- **Impact**: Webhook verification might fail if token expires mid-request
- **Mitigation**: Refresh token if within 5 minutes of expiry, retry once on 401

### Complexity Risks

**Tier Renaming Breaks Frontend (MEDIUM)**
- **Risk**: String literals like `"premium"` in UI components won't be caught by TypeScript
- **Mitigation**: 
  1. Grep for `essential`, `premium`, `Essential`, `Premium` across codebase
  2. Update all UI strings in components
  3. Test all tier-dependent UI (pricing page, profile, dashboard)

**Database Migration Affects Live Users (MEDIUM)**
- **Risk**: Changing tier CHECK constraint might fail if data inconsistent
- **Mitigation**:
  1. Backup database before migration
  2. Test migration on local database first
  3. Run migration during low-traffic period
  4. Have rollback plan ready

## Recommendations for Planner

### 1. Install PayPal SDK Before Builder 2 Starts
**Why**: Builder 2 (PayPal Client Library) needs SDK package installed  
**Command**: `npm install @paypal/checkout-server-sdk`  
**Timing**: Run this in Builder 1 task or pre-iteration setup

### 2. Create PayPal Products/Plans via MCP BEFORE Coding
**Why**: Need Plan IDs in environment variables before tRPC procedures can reference them  
**Process**:
1. Use `mcp__paypal__create_product` to create 2 products
2. Use `mcp__paypal__create_subscription_plan` to create 4 plans (Pro Monthly/Yearly, Unlimited Monthly/Yearly)
3. Store Plan IDs in `.env.local`
4. Commit Plan IDs to `.env.example` as comments for reference

### 3. Implement Database Function for Daily Limit Atomicity
**Why**: Prevents race conditions with concurrent reflection requests  
**Where**: Include in Builder 1's database migration  
**Code**: Provided in "Daily Limit Tracking" section above

### 4. Create webhook_events Table for Idempotency
**Why**: Prevents duplicate webhook processing  
**Where**: Include in Builder 1's database migration  
**Schema**: Provided in "Webhook Idempotency" section above

### 5. Clarify Dream Limit for Pro Tier
**Issue**: `.env.example` says "5 dreams" but master plan doesn't specify dream limits per tier  
**Question**: Should Pro tier have limited dreams? Or is that only for Free tier?  
**Impact**: Affects feature gating in Iteration 2

### 6. Consider Webhook Retry Strategy
**Recommendation**: PayPal will retry failed webhooks (typically 3-5 times over 24 hours)  
**Best Practice**: Return 200 quickly, process asynchronously if needed  
**Implementation**: Log webhook to database first, then process

### 7. Test Webhook Verification in Sandbox Extensively
**Why**: PayPal's verification API is the riskiest part of integration  
**Test Cases**:
- Valid signature → SUCCESS
- Invalid signature → FAILURE
- Missing headers → error handling
- Verification API timeout → retry logic
- Token expiry during verification → refresh and retry

### 8. Implement Graceful Tier Name Migration
**Strategy**: Support both old and new tier names during transition  
**Code Pattern**:
```typescript
function normalizeTier(tier: string): 'free' | 'pro' | 'unlimited' {
  if (tier === 'essential') return 'pro';
  if (tier === 'premium') return 'unlimited';
  return tier as 'free' | 'pro' | 'unlimited';
}
```
**Where**: Add to Builder 1 type utilities, remove in Builder 4

## Resource Map

### Critical Files to Create

**New Files**:
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts` - PayPal client library (Builder 2)
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/paypal/route.ts` - Webhook handler (Builder 3)
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251130_paypal_integration.sql` - Database changes (Builder 1)
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/paypal.ts` - PayPal type definitions (Builder 1)

### Critical Files to Modify

**Database Schema**:
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251130_paypal_integration.sql` - New migration

**Type Definitions**:
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts` - Update SubscriptionTier type (line 3)
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/subscription.ts` - Remove Stripe types, add PayPal types

**Business Logic**:
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` - Update TIER_LIMITS (lines 3-7)
5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/cost-calculator.ts` - Update getThinkingBudget (line 62)
6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` - Add daily limit check (lines 56-78)
7. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts` - Expand with PayPal procedures
8. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` - Update tier references (line 54)

**Configuration**:
9. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/package.json` - Add @paypal/checkout-server-sdk dependency

### Key Dependencies

**PayPal SDK** (`@paypal/checkout-server-sdk`):
- Purpose: Official PayPal API client
- Usage: Token management, subscription creation, API calls
- Installation: `npm install @paypal/checkout-server-sdk`

**Supabase Client** (already installed):
- Purpose: Database operations in webhooks and tRPC
- Usage: User updates, webhook event logging

**Zod** (already installed):
- Purpose: Validate webhook payloads and tRPC inputs
- Usage: Schema definitions for subscription procedures

### Testing Infrastructure

**PayPal Sandbox Environment**:
- **URL**: https://developer.paypal.com/dashboard/applications
- **Test Accounts**: Create buyer and seller accounts
- **Webhook Simulator**: Test webhook events without real subscriptions
- **Test Plan IDs**: Created via MCP tools in sandbox mode

**Local Testing Strategy**:
1. Set `PAYPAL_ENVIRONMENT=sandbox` in `.env.local`
2. Use sandbox Client ID and Secret
3. Create test subscription plans via MCP
4. Use PayPal's webhook simulator to send test events
5. Use ngrok or similar to expose local webhook endpoint

**Integration Testing Checklist**:
- [ ] Create subscription flow (tRPC → PayPal → approval URL)
- [ ] Complete checkout in sandbox (user approves subscription)
- [ ] Verify BILLING.SUBSCRIPTION.ACTIVATED webhook received
- [ ] Verify database updated (tier, subscription_id, status)
- [ ] Test daily limit enforcement (Pro: 1/day, Unlimited: 2/day)
- [ ] Test monthly limit enforcement
- [ ] Test cancellation flow (cancel_at_period_end flag)
- [ ] Test webhook signature verification with valid/invalid signatures
- [ ] Test access token refresh after 9 hours

## Environment Setup Checklist

### Phase 1: PayPal Developer Account Setup
- [ ] Sign up at https://developer.paypal.com
- [ ] Create sandbox app
- [ ] Copy Client ID → `PAYPAL_CLIENT_ID`
- [ ] Copy Client Secret → `PAYPAL_CLIENT_SECRET`
- [ ] Set `PAYPAL_ENVIRONMENT=sandbox`

### Phase 2: Product & Plan Creation (via MCP)
- [ ] Use `mcp__paypal__create_product` to create "Mirror of Dreams Pro"
- [ ] Use `mcp__paypal__create_product` to create "Mirror of Dreams Unlimited"
- [ ] Use `mcp__paypal__create_subscription_plan` for Pro Monthly ($15)
- [ ] Use `mcp__paypal__create_subscription_plan` for Pro Yearly ($150)
- [ ] Use `mcp__paypal__create_subscription_plan` for Unlimited Monthly ($29)
- [ ] Use `mcp__paypal__create_subscription_plan` for Unlimited Yearly ($290)
- [ ] Copy Plan IDs to `.env.local`:
  - `PAYPAL_PRO_MONTHLY_PLAN_ID`
  - `PAYPAL_PRO_YEARLY_PLAN_ID`
  - `PAYPAL_UNLIMITED_MONTHLY_PLAN_ID`
  - `PAYPAL_UNLIMITED_YEARLY_PLAN_ID`

### Phase 3: Webhook Configuration
- [ ] Deploy webhook endpoint to staging/production OR use ngrok for local testing
- [ ] Create webhook in PayPal Dashboard: https://developer.paypal.com/dashboard/webhooks
- [ ] Subscribe to events:
  - `BILLING.SUBSCRIPTION.ACTIVATED`
  - `BILLING.SUBSCRIPTION.CANCELLED`
  - `BILLING.SUBSCRIPTION.EXPIRED`
  - `BILLING.SUBSCRIPTION.SUSPENDED`
  - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- [ ] Copy Webhook ID → `PAYPAL_WEBHOOK_ID`

### Phase 4: Database Migration
- [ ] Backup production database (if applicable)
- [ ] Run migration locally: `supabase db push`
- [ ] Verify new columns exist: `paypal_subscription_id`, `reflections_today`, `last_reflection_date`
- [ ] Verify tier constraint updated to `free | pro | unlimited`
- [ ] Verify `webhook_events` table created
- [ ] Verify stored procedure `increment_reflection_with_daily_check` created

### Phase 5: Code Deployment
- [ ] Install PayPal SDK: `npm install @paypal/checkout-server-sdk`
- [ ] Verify build succeeds: `npm run build`
- [ ] Verify TypeScript compiles with no errors
- [ ] Deploy to staging
- [ ] Test complete checkout flow in sandbox
- [ ] Test all webhook events
- [ ] Deploy to production with live PayPal credentials

## Questions for Planner

### Question 1: Dream Limit Clarification
**Context**: `.env.example` line 72 says Pro tier has "5 dreams" limit  
**Question**: Should Pro tier have a dream limit? What about Unlimited tier?  
**Impact**: Affects feature gating implementation in Iteration 2

### Question 2: Free Tier Daily Limits
**Context**: Master plan specifies daily limits for Pro (1/day) and Unlimited (2/day)  
**Question**: Should Free tier have a daily limit, or can they use all 2 reflections in one day?  
**Current Assumption**: Free tier has no daily limit (only monthly limit of 2)

### Question 3: Extended Thinking for Pro Tier
**Context**: Cost calculator currently gives extended thinking to "premium" tier  
**Question**: Should Pro tier get extended thinking, or only Unlimited?  
**Current Assumption**: Only Unlimited tier (per master plan notes)

### Question 4: Webhook Retry Handling
**Question**: If webhook processing fails (database error), should we return 200 to prevent PayPal retries, or 500 to trigger retry?  
**Recommendation**: Return 200 always (log to webhook_events table first), process asynchronously

### Question 5: Stripe Code Removal
**Question**: Should we remove Stripe webhook handler and Stripe dependency in Iteration 1, or leave for backwards compatibility?  
**Recommendation**: Keep Stripe code until PayPal fully tested in production, remove in cleanup phase

### Question 6: Subscription Expiry Grace Period
**Question**: When subscription expires, should users get grace period (7 days?) or immediate downgrade to free?  
**Current Assumption**: Immediate downgrade on BILLING.SUBSCRIPTION.EXPIRED event

---

**Report Complete**: All PayPal integration requirements documented. Ready for planner to create detailed builder tasks.
