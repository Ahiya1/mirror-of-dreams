// app/api/webhooks/paypal/route.ts - PayPal webhook handler
// This MUST stay as a separate Next.js route handler for raw body signature verification

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin Supabase client for webhook operations
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Import PayPal utilities (from Builder 2)
// Note: These imports will be available after Builder 2 completes
import {
  verifyWebhookSignature,
  determineTierFromPlanId,
  determinePeriodFromPlanId,
} from '@/server/lib/paypal';

// PayPal webhook event types
interface PayPalWebhookHeaders {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
}

interface PayPalSubscription {
  id: string;
  status: string;
  plan_id: string;
  custom_id?: string; // User ID
  subscriber: {
    payer_id: string;
    email_address: string;
  };
  billing_info?: {
    next_billing_time?: string;
  };
}

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: PayPalSubscription;
  create_time: string;
}

// Main webhook handler
export async function POST(req: NextRequest) {
  const webhookStart = Date.now();

  try {
    // 1. Get raw body and headers
    const body = await req.text();
    const headers: PayPalWebhookHeaders = {
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

    const event: PayPalWebhookEvent = JSON.parse(body);

    // 3. Check idempotency
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 4. Log event before processing
    await supabase.from('webhook_events').insert({
      event_id: event.id,
      event_type: event.event_type,
      payload: event,
    });

    // 5. Handle event by type
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
        await handlePaymentSaleCompleted(event);
        break;
    }

    // 6. Return 200
    return NextResponse.json({
      received: true,
      eventType: event.event_type,
      processingTime: Date.now() - webhookStart,
    });
  } catch (error: unknown) {
    console.error('[PayPal Webhook] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Return 200 to prevent PayPal retries - we logged the event
    return NextResponse.json({
      received: true,
      error: 'Processing error',
      details: message,
    });
  }
}

// Handle subscription activated
async function handleSubscriptionActivated(event: PayPalWebhookEvent) {
  const subscription = event.resource;
  const userId = subscription.custom_id;

  if (!userId) {
    console.error('[PayPal Webhook] Missing custom_id (userId) in subscription');
    return;
  }

  const tier = determineTierFromPlanId(subscription.plan_id);
  const period = determinePeriodFromPlanId(subscription.plan_id);

  // Update user subscription
  const { error } = await supabase
    .from('users')
    .update({
      tier,
      subscription_status: 'active',
      subscription_period: period,
      subscription_started_at: new Date().toISOString(),
      paypal_subscription_id: subscription.id,
      paypal_payer_id: subscription.subscriber.payer_id,
      subscription_id: subscription.id, // Generic subscription_id field
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[PayPal Webhook] Failed to update user:', error);
    throw error;
  }
}

// Handle subscription cancelled
async function handleSubscriptionCancelled(event: PayPalWebhookEvent) {
  const subscription = event.resource;

  // Find user by PayPal subscription ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('paypal_subscription_id', subscription.id)
    .single();

  if (!user) {
    console.error(`[PayPal Webhook] User not found for subscription ${subscription.id}`);
    return;
  }

  // Keep tier but mark as canceled at period end
  const expiresAt = subscription.billing_info?.next_billing_time
    ? new Date(subscription.billing_info.next_billing_time).toISOString()
    : undefined;

  const { error } = await supabase
    .from('users')
    .update({
      cancel_at_period_end: true,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[PayPal Webhook] Failed to update user:', error);
    throw error;
  }
}

// Handle subscription expired
async function handleSubscriptionExpired(event: PayPalWebhookEvent) {
  const subscription = event.resource;

  // Find user and downgrade to free
  const { error } = await supabase
    .from('users')
    .update({
      tier: 'free',
      subscription_status: 'expired',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_subscription_id', subscription.id);

  if (error) {
    console.error('[PayPal Webhook] Failed to update user:', error);
    throw error;
  }
}

// Handle subscription suspended (payment failed)
async function handleSubscriptionSuspended(event: PayPalWebhookEvent) {
  const subscription = event.resource;

  // Mark subscription as past_due
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_subscription_id', subscription.id);

  if (error) {
    console.error('[PayPal Webhook] Failed to update user:', error);
    throw error;
  }
}

// Handle payment sale completed
async function handlePaymentSaleCompleted(event: PayPalWebhookEvent) {
  const subscription = event.resource;

  // Optional: Update last payment timestamp
  const { error } = await supabase
    .from('users')
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_subscription_id', subscription.id);

  if (error) {
    console.error('[PayPal Webhook] Failed to update user:', error);
  }
}

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
