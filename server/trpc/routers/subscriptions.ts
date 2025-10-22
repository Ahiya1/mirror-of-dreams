// server/trpc/routers/subscriptions.ts - Subscription management
// NOTE: Stripe temporarily disabled - will be replaced with PayPal in Iteration 4

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';

export const subscriptionsRouter = router({
  // Get current subscription status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { data: subscription, error } = await supabase
      .from('users')
      .select(
        `
        tier, subscription_status, subscription_period,
        stripe_subscription_id, stripe_customer_id,
        subscription_started_at, subscription_expires_at
      `
      )
      .eq('id', ctx.user.id)
      .single();

    if (error) {
      console.error('Subscription status query error:', error);
      // Return default free tier status for local development
      return {
        tier: 'free',
        status: null,
        period: null,
        isActive: false,
        isSubscribed: false,
        isCanceled: false,
        nextBilling: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        startedAt: null,
        expiresAt: null,
      };
    }

    const isActive = subscription.subscription_status === 'active';
    const isSubscribed = subscription.tier !== 'free';
    const isCanceled = subscription.subscription_status === 'canceled';

    // Calculate next billing date
    let nextBilling = null;
    if (subscription.subscription_started_at && subscription.subscription_period && isActive) {
      const startDate = new Date(subscription.subscription_started_at);
      const nextDate = new Date(startDate);

      if (subscription.subscription_period === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (subscription.subscription_period === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      nextBilling = nextDate.toISOString();
    }

    return {
      tier: subscription.tier,
      status: subscription.subscription_status,
      period: subscription.subscription_period,
      isActive,
      isSubscribed,
      isCanceled,
      nextBilling,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      stripeCustomerId: subscription.stripe_customer_id,
      startedAt: subscription.subscription_started_at,
      expiresAt: subscription.subscription_expires_at,
    };
  }),

  // Stripe-dependent procedures disabled until PayPal integration in Iteration 4
  // cancel, getCustomerPortal, reactivate, upgrade will be re-implemented with PayPal
});

export type SubscriptionsRouter = typeof subscriptionsRouter;
