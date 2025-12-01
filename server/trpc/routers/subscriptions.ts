// server/trpc/routers/subscriptions.ts - Subscription management with PayPal

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';

// Import PayPal client functions (Builder 2 dependency)
// TODO: These imports will be available after Builder 2 completes
// import { createSubscription, cancelSubscription, getPlanId } from '@/server/lib/paypal';

// Placeholder types until Builder 2 completes
let createSubscription: ((userId: string, planId: string) => Promise<string>) | undefined;
let cancelSubscription: ((subscriptionId: string) => Promise<void>) | undefined;
let getPlanId: ((tier: 'pro' | 'unlimited', period: 'monthly' | 'yearly') => string | null) | undefined;

// Try to import PayPal functions if available
try {
  const paypalModule = require('@/server/lib/paypal');
  createSubscription = paypalModule.createSubscription;
  cancelSubscription = paypalModule.cancelSubscription;
  getPlanId = paypalModule.getPlanId;
} catch (e) {
  console.warn('PayPal client not available yet (Builder 2 in progress)');
}

export const subscriptionsRouter = router({
  // Get current subscription status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { data: subscription, error } = await supabase
      .from('users')
      .select(
        `
        tier, subscription_status, subscription_period,
        subscription_id, paypal_subscription_id, paypal_payer_id,
        subscription_started_at, subscription_expires_at,
        cancel_at_period_end
      `
      )
      .eq('id', ctx.user.id)
      .single();

    if (error) {
      console.error('Subscription status query error:', error);
      // Return default free tier status for local development
      return {
        tier: 'free' as const,
        status: null,
        period: null,
        isActive: false,
        isSubscribed: false,
        isCanceled: false,
        cancelAtPeriodEnd: false,
        nextBilling: null,
        subscriptionId: null,
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
      tier: subscription.tier as 'free' | 'pro' | 'unlimited',
      status: subscription.subscription_status,
      period: subscription.subscription_period,
      isActive,
      isSubscribed,
      isCanceled,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      nextBilling,
      subscriptionId: subscription.paypal_subscription_id || subscription.subscription_id,
      startedAt: subscription.subscription_started_at,
      expiresAt: subscription.subscription_expires_at,
    };
  }),

  // Create PayPal checkout session
  createCheckout: protectedProcedure
    .input(z.object({
      tier: z.enum(['pro', 'unlimited']),
      period: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!createSubscription || !getPlanId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'PayPal integration not available yet (Builder 2 in progress)',
        });
      }

      // Get plan ID for the selected tier/period
      const planId = getPlanId(input.tier, input.period);

      if (!planId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid plan configuration',
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

  // Cancel subscription
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    if (!cancelSubscription) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'PayPal integration not available yet (Builder 2 in progress)',
      });
    }

    const { data: user } = await supabase
      .from('users')
      .select('paypal_subscription_id')
      .eq('id', ctx.user.id)
      .single();

    if (!user?.paypal_subscription_id) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No active subscription found',
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

export type SubscriptionsRouter = typeof subscriptionsRouter;
