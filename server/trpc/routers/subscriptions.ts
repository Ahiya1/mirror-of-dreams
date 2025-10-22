// server/trpc/routers/subscriptions.ts - Subscription management

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { subscriptionCancelSchema } from '@/types/schemas';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

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
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get subscription status',
      });
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

  // Cancel subscription
  cancel: protectedProcedure
    .input(subscriptionCancelSchema)
    .mutation(async ({ ctx, input }) => {
      const { reason } = input;

      // Get user's Stripe subscription ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('stripe_subscription_id, tier')
        .eq('id', ctx.user.id)
        .single();

      if (userError || !user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.stripe_subscription_id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription to cancel',
        });
      }

      // Cancel Stripe subscription (at period end)
      try {
        await stripe.subscriptions.update(user.stripe_subscription_id, {
          cancel_at_period_end: true,
          metadata: {
            cancellation_reason: reason || 'User requested',
          },
        });
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to cancel subscription: ${error.message}`,
        });
      }

      // Update database
      await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id);

      return {
        message: 'Subscription canceled successfully. Access continues until end of billing period.',
      };
    }),

  // Get Stripe customer portal URL
  getCustomerPortal: protectedProcedure.query(async ({ ctx }) => {
    const { data: user, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', ctx.user.id)
      .single();

    if (error || !user || !user.stripe_customer_id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No Stripe customer found',
      });
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
      });

      return {
        url: session.url,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create portal session: ${error.message}`,
      });
    }
  }),

  // Reactivate canceled subscription
  reactivate: protectedProcedure.mutation(async ({ ctx }) => {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_subscription_id, subscription_status')
      .eq('id', ctx.user.id)
      .single();

    if (userError || !user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    if (user.subscription_status !== 'canceled') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Subscription is not canceled',
      });
    }

    if (!user.stripe_subscription_id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No subscription to reactivate',
      });
    }

    // Reactivate Stripe subscription
    try {
      await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to reactivate subscription: ${error.message}`,
      });
    }

    // Update database
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.user.id);

    return {
      message: 'Subscription reactivated successfully',
    };
  }),

  // Upgrade tier (placeholder for frontend payment flow)
  upgrade: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['essential', 'premium']),
        period: z.enum(['monthly', 'yearly']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would typically create a Stripe checkout session
      // For now, return a message that this should be done via payment flow
      return {
        message: 'Please use the payment flow to upgrade your subscription',
        tier: input.tier,
        period: input.period,
      };
    }),
});

export type SubscriptionsRouter = typeof subscriptionsRouter;
