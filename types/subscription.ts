// types/subscription.ts - Subscription and payment types

import { SubscriptionTier, SubscriptionStatus } from './user';

/**
 * Subscription details
 */
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  period: 'monthly' | 'yearly';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment intent creation input
 */
export interface PaymentIntentInput {
  tier: SubscriptionTier;
  period: 'monthly' | 'yearly';
  userId: string;
}

/**
 * Stripe configuration (client-facing)
 */
export interface StripeConfig {
  publishableKey: string;
  priceIds: {
    essential: {
      monthly: string;
      yearly: string;
    };
    premium: {
      monthly: string;
      yearly: string;
    };
  };
}

/**
 * Tier pricing structure
 */
export interface TierPricing {
  essential: {
    monthly: number;
    yearly: number;
  };
  premium: {
    monthly: number;
    yearly: number;
  };
}

/**
 * Subscription tier limits
 */
export interface TierLimits {
  free: number;
  essential: number;
  premium: number;
}

/**
 * Usage information
 */
export interface Usage {
  tier: SubscriptionTier;
  limit: number | 'unlimited';
  used: number;
  remaining: number;
  canReflect: boolean;
  isCreator: boolean;
  currentMonth: string;
}
