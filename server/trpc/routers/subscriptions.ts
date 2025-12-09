// server/trpc/routers/subscriptions.ts - Subscription management with PayPal

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure } from '../middleware';
import { router } from '../trpc';

import {
  createSubscription,
  cancelSubscription,
  getPlanId,
  getSubscriptionDetails,
  determineTierFromPlanId,
  determinePeriodFromPlanId,
} from '@/server/lib/paypal';
import { supabase } from '@/server/lib/supabase';

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
    .input(
      z.object({
        tier: z.enum(['pro', 'unlimited']),
        period: z.enum(['monthly', 'yearly']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get plan ID for the selected tier/period
        const planId = getPlanId(input.tier, input.period);

        // Create PayPal subscription and get approval URL
        const approvalUrl = await createSubscription(ctx.user.id, planId);
        return { approvalUrl };
      } catch (error) {
        console.error('CreateCheckout error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create checkout session',
        });
      }
    }),

  // Get plan ID for embedded checkout (no redirect needed)
  getPlanId: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['pro', 'unlimited']),
        period: z.enum(['monthly', 'yearly']),
      })
    )
    .query(({ input }) => {
      try {
        const planId = getPlanId(input.tier, input.period);
        return { planId };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get plan ID',
        });
      }
    }),

  // Activate subscription after PayPal embedded checkout approval
  activateSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Fetch subscription details from PayPal
        const subscription = await getSubscriptionDetails(input.subscriptionId);

        // Verify subscription is active or approved
        if (!['ACTIVE', 'APPROVED'].includes(subscription.status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Subscription is not active. Status: ${subscription.status}`,
          });
        }

        // Determine tier and period from plan ID
        const tier = determineTierFromPlanId(subscription.plan_id);
        const period = determinePeriodFromPlanId(subscription.plan_id);

        // Update user subscription in database
        const { error } = await supabase
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
          .eq('id', ctx.user.id);

        if (error) {
          console.error('Failed to update user subscription:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to activate subscription',
          });
        }

        return {
          success: true,
          tier,
          period,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Activate subscription error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to activate subscription',
        });
      }
    }),

  // Cancel subscription
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
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
      await supabase.from('users').update({ cancel_at_period_end: true }).eq('id', ctx.user.id);

      return { success: true };
    } catch (error) {
      console.error('PayPal cancelSubscription error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel subscription',
      });
    }
  }),
});

export type SubscriptionsRouter = typeof subscriptionsRouter;
