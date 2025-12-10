// test/fixtures/subscriptions.ts - Subscription test data factory
// Provides reusable subscription fixtures for testing

/**
 * Subscription status object
 */
export interface SubscriptionStatus {
  tier: 'free' | 'pro' | 'unlimited';
  status: string | null;
  period: 'monthly' | 'yearly' | null;
  isActive: boolean;
  isSubscribed: boolean;
  isCanceled: boolean;
  cancelAtPeriodEnd: boolean;
  nextBilling: string | null;
  subscriptionId: string | null;
  startedAt: string | null;
  expiresAt: string | null;
}

/**
 * User subscription database row type
 */
export interface UserSubscriptionRow {
  tier: 'free' | 'pro' | 'unlimited';
  subscription_status: string | null;
  subscription_period: 'monthly' | 'yearly' | null;
  subscription_id: string | null;
  paypal_subscription_id: string | null;
  paypal_payer_id: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  cancel_at_period_end: boolean;
}

/**
 * Creates a mock subscription status
 */
export const createMockSubscriptionStatus = (
  overrides: Partial<SubscriptionStatus> = {}
): SubscriptionStatus => ({
  tier: 'free',
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
  ...overrides,
});

/**
 * Creates a mock user subscription row
 */
export const createMockUserSubscriptionRow = (
  overrides: Partial<UserSubscriptionRow> = {}
): UserSubscriptionRow => ({
  tier: 'free',
  subscription_status: null,
  subscription_period: null,
  subscription_id: null,
  paypal_subscription_id: null,
  paypal_payer_id: null,
  subscription_started_at: null,
  subscription_expires_at: null,
  cancel_at_period_end: false,
  ...overrides,
});

// =============================================================================
// Pre-configured Subscription Status Scenarios
// =============================================================================

/**
 * Free tier subscription status
 */
export const freeSubscriptionStatus = createMockSubscriptionStatus();

/**
 * Free tier user row
 */
export const freeUserSubscriptionRow = createMockUserSubscriptionRow();

/**
 * Active pro monthly subscription
 */
export const proMonthlyStatus = createMockSubscriptionStatus({
  tier: 'pro',
  status: 'active',
  period: 'monthly',
  isActive: true,
  isSubscribed: true,
  subscriptionId: 'I-PRO-MONTHLY-123',
  startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  nextBilling: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Pro monthly user row
 */
export const proMonthlyUserRow = createMockUserSubscriptionRow({
  tier: 'pro',
  subscription_status: 'active',
  subscription_period: 'monthly',
  paypal_subscription_id: 'I-PRO-MONTHLY-123',
  paypal_payer_id: 'PAYER-123',
  subscription_started_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Active pro yearly subscription
 */
export const proYearlyStatus = createMockSubscriptionStatus({
  tier: 'pro',
  status: 'active',
  period: 'yearly',
  isActive: true,
  isSubscribed: true,
  subscriptionId: 'I-PRO-YEARLY-456',
  startedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  nextBilling: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Pro yearly user row
 */
export const proYearlyUserRow = createMockUserSubscriptionRow({
  tier: 'pro',
  subscription_status: 'active',
  subscription_period: 'yearly',
  paypal_subscription_id: 'I-PRO-YEARLY-456',
  paypal_payer_id: 'PAYER-456',
  subscription_started_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Active unlimited subscription
 */
export const unlimitedStatus = createMockSubscriptionStatus({
  tier: 'unlimited',
  status: 'active',
  period: 'yearly',
  isActive: true,
  isSubscribed: true,
  subscriptionId: 'I-UNLIMITED-789',
  startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  nextBilling: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Unlimited user row
 */
export const unlimitedUserRow = createMockUserSubscriptionRow({
  tier: 'unlimited',
  subscription_status: 'active',
  subscription_period: 'yearly',
  paypal_subscription_id: 'I-UNLIMITED-789',
  paypal_payer_id: 'PAYER-789',
  subscription_started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Canceled subscription (still active until period end)
 */
export const canceledStatus = createMockSubscriptionStatus({
  tier: 'pro',
  status: 'active',
  period: 'monthly',
  isActive: true,
  isSubscribed: true,
  isCanceled: false,
  cancelAtPeriodEnd: true,
  subscriptionId: 'I-CANCELED-ABC',
  startedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Canceled user row
 */
export const canceledUserRow = createMockUserSubscriptionRow({
  tier: 'pro',
  subscription_status: 'active',
  subscription_period: 'monthly',
  paypal_subscription_id: 'I-CANCELED-ABC',
  paypal_payer_id: 'PAYER-ABC',
  subscription_started_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  subscription_expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  cancel_at_period_end: true,
});

/**
 * Expired subscription
 */
export const expiredStatus = createMockSubscriptionStatus({
  tier: 'free',
  status: 'expired',
  period: null,
  isActive: false,
  isSubscribed: false,
  isCanceled: true,
});

/**
 * Expired user row
 */
export const expiredUserRow = createMockUserSubscriptionRow({
  tier: 'free',
  subscription_status: 'expired',
  subscription_period: null,
  paypal_subscription_id: null,
});

// =============================================================================
// PayPal Mock Data
// =============================================================================

/**
 * PayPal subscription details response
 */
export const createMockPayPalSubscription = (
  overrides: Partial<{
    id: string;
    status: string;
    plan_id: string;
    subscriber: { payer_id: string; email_address: string };
    billing_info: { next_billing_time: string };
  }> = {}
) => ({
  id: 'I-SUB123456',
  status: 'ACTIVE',
  plan_id: 'P-PRO-MONTHLY',
  subscriber: {
    payer_id: 'PAYER123',
    email_address: 'test@example.com',
  },
  billing_info: {
    next_billing_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  ...overrides,
});

/**
 * PayPal approved subscription (not yet active)
 */
export const approvedPayPalSubscription = createMockPayPalSubscription({
  status: 'APPROVED',
});

/**
 * PayPal canceled subscription
 */
export const canceledPayPalSubscription = createMockPayPalSubscription({
  status: 'CANCELLED',
});

/**
 * PayPal suspended subscription
 */
export const suspendedPayPalSubscription = createMockPayPalSubscription({
  status: 'SUSPENDED',
});

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a user row with specific subscription state
 */
export const createUserWithSubscription = (
  tier: 'free' | 'pro' | 'unlimited',
  status: string | null = 'active',
  period: 'monthly' | 'yearly' | null = 'monthly'
): UserSubscriptionRow =>
  createMockUserSubscriptionRow({
    tier,
    subscription_status: status,
    subscription_period: tier === 'free' ? null : period,
    paypal_subscription_id: tier === 'free' ? null : `I-${tier.toUpperCase()}-${Date.now()}`,
    paypal_payer_id: tier === 'free' ? null : `PAYER-${Date.now()}`,
    subscription_started_at: tier === 'free' ? null : new Date().toISOString(),
  });

/**
 * Creates a PayPal subscription for specific tier/period
 */
export const createPayPalSubscriptionForTier = (
  tier: 'pro' | 'unlimited',
  period: 'monthly' | 'yearly'
) =>
  createMockPayPalSubscription({
    plan_id: `P-${tier.toUpperCase()}-${period.toUpperCase()}`,
  });

// =============================================================================
// Plan ID Constants (matching PayPal configuration)
// =============================================================================

export const PLAN_IDS = {
  'pro-monthly': 'P-PRO-MONTHLY',
  'pro-yearly': 'P-PRO-YEARLY',
  'unlimited-monthly': 'P-UNLIMITED-MONTHLY',
  'unlimited-yearly': 'P-UNLIMITED-YEARLY',
} as const;

export type PlanKey = keyof typeof PLAN_IDS;
