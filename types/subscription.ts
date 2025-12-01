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
  paypalSubscriptionId: string | null;
  paypalPayerId: string | null;
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
 * PayPal configuration (client-facing)
 */
export interface PayPalConfig {
  clientId: string;
  planIds: {
    pro: {
      monthly: string;
      yearly: string;
    };
    unlimited: {
      monthly: string;
      yearly: string;
    };
  };
}

/**
 * Tier pricing structure
 */
export interface TierPricing {
  pro: {
    monthly: number;
    yearly: number;
  };
  unlimited: {
    monthly: number;
    yearly: number;
  };
}

/**
 * Subscription tier limits
 */
export interface TierLimits {
  free: number;
  pro: number;
  unlimited: number;
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
