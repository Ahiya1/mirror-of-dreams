# Code Patterns for Iteration 16

## Pattern 1: PayPal REST API Client

### Token Management with Caching
```typescript
// server/lib/paypal.ts

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-minute buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal token error: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5-min buffer
  };

  return cachedToken.token;
}
```

### API Helper Pattern
```typescript
async function paypalFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getPayPalAccessToken();
  const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`PayPal API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
```

## Pattern 2: Webhook Handler (Next.js Route)

### Structure
```typescript
// app/api/webhooks/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase';
import { verifyWebhookSignature, determineTierFromPlanId } from '@/server/lib/paypal';

export async function POST(req: NextRequest) {
  try {
    // 1. Get raw body and headers
    const body = await req.text();
    const headers = {
      transmissionId: req.headers.get('paypal-transmission-id'),
      transmissionTime: req.headers.get('paypal-transmission-time'),
      certUrl: req.headers.get('paypal-cert-url'),
      authAlgo: req.headers.get('paypal-auth-algo'),
      transmissionSig: req.headers.get('paypal-transmission-sig'),
    };

    // 2. Verify signature
    const isValid = await verifyWebhookSignature(body, headers);
    if (!isValid) {
      console.error('[PayPal Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // 3. Check idempotency
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .single();

    if (existing) {
      console.log('[PayPal Webhook] Duplicate event:', event.id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 4. Log event before processing
    await supabase.from('webhook_events').insert({
      event_id: event.id,
      event_type: event.event_type,
      payload: event,
    });

    // 5. Handle event
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
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[PayPal Webhook] Error:', error);
    // Return 200 to prevent PayPal retries - we logged the event
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

## Pattern 3: Database Migration

### Single Migration File Pattern
```sql
-- supabase/migrations/20251130000000_paypal_integration.sql

-- ============================================
-- PART 1: Add PayPal columns
-- ============================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT,
ADD COLUMN IF NOT EXISTS reflections_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reflection_date DATE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- ============================================
-- PART 2: Update tier constraint
-- ============================================
-- First drop old constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;

-- Add new constraint with both old and new values (for safe migration)
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'essential', 'premium', 'pro', 'unlimited'));

-- Migrate existing data
UPDATE public.users SET tier = 'pro' WHERE tier = 'essential';
UPDATE public.users SET tier = 'unlimited' WHERE tier = 'premium';

-- Drop and re-add constraint with only new values
ALTER TABLE public.users DROP CONSTRAINT users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'pro', 'unlimited'));

-- ============================================
-- PART 3: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_paypal_subscription_id
ON public.users(paypal_subscription_id)
WHERE paypal_subscription_id IS NOT NULL;

-- ============================================
-- PART 4: Create webhook_events table
-- ============================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB,
  user_id UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type
ON public.webhook_events(event_type);

-- ============================================
-- PART 5: Update database functions
-- ============================================
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

    IF is_creator_user = true OR is_admin_user = true THEN
        RETURN true;
    END IF;

    CASE user_tier
        WHEN 'free' THEN max_reflections := 2;
        WHEN 'pro' THEN max_reflections := 30;
        WHEN 'unlimited' THEN max_reflections := 60;
        ELSE max_reflections := 0;
    END CASE;

    RETURN current_count < max_reflections;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily limit checking function
CREATE OR REPLACE FUNCTION check_daily_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    user_timezone TEXT;
    today_date DATE;
    last_date DATE;
    current_count INTEGER;
    max_daily INTEGER;
    is_creator_user BOOLEAN;
    is_admin_user BOOLEAN;
BEGIN
    SELECT tier, timezone, last_reflection_date, reflections_today, is_creator, is_admin
    INTO user_tier, user_timezone, last_date, current_count, is_creator_user, is_admin_user
    FROM public.users WHERE id = user_uuid;

    -- Creators and admins have unlimited access
    IF is_creator_user = true OR is_admin_user = true THEN
        RETURN true;
    END IF;

    -- Use UTC if no timezone set
    IF user_timezone IS NULL OR user_timezone = '' THEN
        user_timezone := 'UTC';
    END IF;

    -- Calculate today in user's timezone
    today_date := (NOW() AT TIME ZONE user_timezone)::DATE;

    -- If new day, user can always create (will reset counter elsewhere)
    IF last_date IS NULL OR last_date != today_date THEN
        RETURN true;
    END IF;

    -- Set daily limits (Free has no daily limit)
    CASE user_tier
        WHEN 'free' THEN max_daily := 999999;  -- No daily limit
        WHEN 'pro' THEN max_daily := 1;
        WHEN 'unlimited' THEN max_daily := 2;
        ELSE max_daily := 0;
    END CASE;

    RETURN current_count < max_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update dream limit function
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

    CASE user_tier
        WHEN 'free' THEN max_dreams := 2;
        WHEN 'pro' THEN max_dreams := 5;
        WHEN 'unlimited' THEN max_dreams := 999999;
        ELSE max_dreams := 0;
    END CASE;

    RETURN active_dream_count < max_dreams;
END;
$$ LANGUAGE plpgsql;
```

## Pattern 4: tRPC Subscription Procedures

### Full Router Pattern
```typescript
// server/trpc/routers/subscriptions.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createSubscription,
  cancelSubscription,
  getSubscriptionDetails,
  getPlanId
} from '@/server/lib/paypal';
import { supabase } from '@/server/lib/supabase';

export const subscriptionsRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        tier, subscription_status, subscription_period,
        paypal_subscription_id, paypal_payer_id,
        subscription_started_at, subscription_expires_at,
        cancel_at_period_end
      `)
      .eq('id', ctx.user.id)
      .single();

    if (error || !user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    const isActive = user.subscription_status === 'active';
    const isSubscribed = user.tier !== 'free';

    return {
      tier: user.tier as 'free' | 'pro' | 'unlimited',
      status: user.subscription_status,
      period: user.subscription_period,
      isActive,
      isSubscribed,
      isCanceled: user.cancel_at_period_end,
      subscriptionId: user.paypal_subscription_id,
      startedAt: user.subscription_started_at,
      expiresAt: user.subscription_expires_at,
    };
  }),

  createCheckout: protectedProcedure
    .input(z.object({
      tier: z.enum(['pro', 'unlimited']),
      period: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get plan ID for the selected tier/period
      const planId = getPlanId(input.tier, input.period);

      if (!planId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid plan configuration'
        });
      }

      try {
        const approvalUrl = await createSubscription(ctx.user.id, planId);
        return { approvalUrl };
      } catch (error) {
        console.error('PayPal createSubscription error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }
    }),

  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const { data: user } = await supabase
      .from('users')
      .select('paypal_subscription_id')
      .eq('id', ctx.user.id)
      .single();

    if (!user?.paypal_subscription_id) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No active subscription found'
      });
    }

    try {
      await cancelSubscription(user.paypal_subscription_id);

      // Update local status (webhook will handle final state)
      await supabase
        .from('users')
        .update({ cancel_at_period_end: true })
        .eq('id', ctx.user.id);

      return { success: true };
    } catch (error) {
      console.error('PayPal cancelSubscription error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cancel subscription',
      });
    }
  }),
});
```

## Pattern 5: Daily Limit Middleware

### Updated Middleware Pattern
```typescript
// server/trpc/middleware.ts

export const checkUsageLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Creators and admins have unlimited usage
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // Check daily limit first (Pro and Unlimited only)
  if (ctx.user.tier === 'pro' || ctx.user.tier === 'unlimited') {
    const dailyLimit = DAILY_LIMITS[ctx.user.tier];
    const today = new Date().toISOString().split('T')[0];
    const lastDate = ctx.user.lastReflectionDate;

    // Check if already at daily limit
    if (lastDate === today && ctx.user.reflectionsToday >= dailyLimit) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Daily reflection limit reached (${dailyLimit}/day). Try again tomorrow.`,
      });
    }
  }

  // Check monthly limit
  const monthlyLimit = TIER_LIMITS[ctx.user.tier];
  const monthlyUsage = ctx.user.reflectionCountThisMonth;

  if (monthlyUsage >= monthlyLimit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly reflection limit reached (${monthlyLimit}). Please upgrade or wait until next month.`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

## Pattern 6: Type Definitions

### Updated User Types
```typescript
// types/user.ts
export type SubscriptionTier = 'free' | 'pro' | 'unlimited';

export interface User {
  id: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriod: 'monthly' | 'yearly' | null;
  reflectionCountThisMonth: number;
  reflectionsToday: number;           // NEW
  lastReflectionDate: string | null;  // NEW: "YYYY-MM-DD"
  totalReflections: number;
  currentMonthYear: string;
  isCreator: boolean;
  isAdmin: boolean;
  // ... other fields
}
```

### PayPal Types
```typescript
// types/paypal.ts
export interface PayPalSubscription {
  id: string;
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  plan_id: string;
  subscriber: {
    payer_id: string;
    email_address: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
  billing_info: {
    next_billing_time: string;
    cycle_executions: Array<{
      tenure_type: 'REGULAR' | 'TRIAL';
      sequence: number;
      cycles_completed: number;
    }>;
  };
  custom_id?: string; // User ID stored here
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: PayPalSubscription;
  create_time: string;
  resource_type: 'subscription';
}
```
