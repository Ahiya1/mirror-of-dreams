// app/api/webhooks/stripe/route.ts - Stripe webhook handler (NOT tRPC)
// This MUST stay as a separate Next.js route handler for raw body signature verification

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/server/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-06-30.basil',
});

// Helper to get raw body as text
async function getRawBody(req: NextRequest): Promise<string> {
  return await req.text();
}

// Main webhook handler
export async function POST(req: NextRequest) {
  const webhookStart = Date.now();
  console.log('🪝 Stripe webhook received');

  const body = await getRawBody(req);
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook signature verified:', event.type);
  } catch (error: any) {
    console.error('❌ Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Route to appropriate handler based on event type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({
      received: true,
      eventType: event.type,
      processingTime: Date.now() - webhookStart,
    });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle checkout session completed
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};

  console.log('💳 Checkout completed:', session.id);
  console.log('💳 Metadata:', metadata);

  // Extract metadata
  const { userId, tier, period } = metadata;

  if (!userId || !tier || !period) {
    console.error('❌ Missing required metadata in checkout session');
    return;
  }

  // Update user subscription
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

  console.log(`✅ User ${userId} upgraded to ${tier} (${period})`);
}

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const metadata = paymentIntent.metadata || {};

  console.log('💳 Payment intent succeeded:', paymentIntent.id);

  const { type, userId, tier, period, priceId } = metadata;

  // Only process subscription upgrades
  if (type !== 'subscription_upgrade') {
    console.log('ℹ️ Not a subscription upgrade, skipping');
    return;
  }

  if (!userId || !tier || !period || !priceId) {
    console.error('❌ Missing required metadata in payment intent');
    return;
  }

  // Create Stripe subscription
  try {
    const subscription = await stripe.subscriptions.create({
      customer: paymentIntent.customer as string,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
      },
      metadata: {
        userId,
        tier,
        period,
      },
    });

    // Update user in database
    await supabase
      .from('users')
      .update({
        tier,
        subscription_status: 'active',
        subscription_period: period,
        subscription_started_at: new Date().toISOString(),
        stripe_customer_id: paymentIntent.customer as string,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    console.log(`✅ Subscription created for user ${userId}: ${tier} (${period})`);
  } catch (error: any) {
    console.error('❌ Failed to create subscription:', error.message);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const metadata = subscription.metadata || {};

  console.log('💳 Subscription updated:', subscription.id);

  const { userId } = metadata;

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata');
    return;
  }

  // Determine tier from price
  const priceId = subscription.items.data[0]?.price.id;
  const tier = determineTierFromPrice(priceId);

  await supabase
    .from('users')
    .update({
      tier: tier || 'free',
      subscription_status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`✅ User ${userId} subscription updated: ${subscription.status}`);
}

// Handle subscription deleted/cancelled
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const metadata = subscription.metadata || {};

  console.log('💳 Subscription deleted:', subscription.id);

  const { userId } = metadata;

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata');
    return;
  }

  // Downgrade to free tier
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

  console.log(`✅ User ${userId} downgraded to free tier`);
}

// Handle invoice payment succeeded
async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  console.log('💳 Invoice payment succeeded:', invoice.id);
  // Additional logic can be added here for invoice tracking
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  console.log('💳 Invoice payment failed:', invoice.id);

  const customerId = invoice.customer as string;

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    console.log(`✅ User ${user.id} marked as past_due`);
  }
}

// Helper function to determine tier from Stripe price ID
function determineTierFromPrice(priceId: string | undefined): string {
  if (!priceId) return 'free';

  const essentialPrices = [
    process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID,
    process.env.STRIPE_ESSENTIAL_YEARLY_PRICE_ID,
  ];

  const premiumPrices = [
    process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  ];

  if (essentialPrices.includes(priceId)) return 'essential';
  if (premiumPrices.includes(priceId)) return 'premium';

  return 'free';
}

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
