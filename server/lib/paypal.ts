// server/lib/paypal.ts - PayPal REST API client library

import { paymentLogger } from './logger';

/**
 * PayPal Subscription Interface
 * Matches PayPal REST API response structure
 */
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

/**
 * PayPal Webhook Headers
 */
export interface PayPalWebhookHeaders {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
}

/**
 * Cached access token with expiration
 */
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get PayPal configuration from environment
 */
function getPayPalConfig() {
  const required = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_ENVIRONMENT'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  return {
    clientId: process.env.PAYPAL_CLIENT_ID!,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
    environment: process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '', // Optional - only needed for webhook verification
    baseUrl:
      process.env.PAYPAL_ENVIRONMENT === 'sandbox'
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com',
  };
}

/**
 * Get PayPal access token with caching
 * Tokens are cached in memory and refreshed 5 minutes before expiry
 */
export async function getPayPalAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-minute buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const config = getPayPalConfig();
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal token error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5-min buffer
  };

  return cachedToken.token;
}

/**
 * Internal helper for making authenticated PayPal API requests
 */
async function paypalFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getPayPalAccessToken();
  const config = getPayPalConfig();

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

/**
 * Create a PayPal subscription
 * @param userId - User ID to store in custom_id field
 * @param planId - PayPal plan ID (e.g., P-1J978568T3651942HNEV3UBY)
 * @returns Approval URL for user to complete subscription
 */
export async function createSubscription(userId: string, planId: string): Promise<string> {
  const domain = process.env.DOMAIN || 'http://localhost:3000';

  const response = await paypalFetch<{
    id: string;
    status: string;
    links: Array<{ href: string; rel: string }>;
  }>('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      custom_id: userId, // Store user ID for webhook processing
      application_context: {
        brand_name: 'Mirror of Dreams',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: `${domain}/subscription/success`,
        cancel_url: `${domain}/subscription/cancel`,
      },
    }),
  });

  // Extract approval URL from links
  const approvalLink = response.links.find((link) => link.rel === 'approve');
  if (!approvalLink) {
    throw new Error('PayPal did not return approval URL');
  }

  return approvalLink.href;
}

/**
 * Cancel a PayPal subscription
 * @param subscriptionId - PayPal subscription ID
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await paypalFetch<void>(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({
      reason: 'User requested cancellation',
    }),
  });
}

/**
 * Get subscription details from PayPal
 * @param subscriptionId - PayPal subscription ID
 * @returns Full subscription object
 */
export async function getSubscriptionDetails(subscriptionId: string): Promise<PayPalSubscription> {
  return paypalFetch<PayPalSubscription>(`/v1/billing/subscriptions/${subscriptionId}`);
}

/**
 * Verify PayPal webhook signature
 * @param body - Raw request body as string
 * @param headers - PayPal webhook headers
 * @returns true if signature is valid
 */
export async function verifyWebhookSignature(
  body: string,
  headers: PayPalWebhookHeaders
): Promise<boolean> {
  const config = getPayPalConfig();

  // Check if all required headers are present
  if (
    !headers.transmissionId ||
    !headers.transmissionTime ||
    !headers.certUrl ||
    !headers.authAlgo ||
    !headers.transmissionSig
  ) {
    paymentLogger.error(
      { operation: 'webhook.verify', headers },
      'Missing required webhook headers'
    );
    return false;
  }

  try {
    const response = await paypalFetch<{ verification_status: string }>(
      '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        body: JSON.stringify({
          transmission_id: headers.transmissionId,
          transmission_time: headers.transmissionTime,
          cert_url: headers.certUrl,
          auth_algo: headers.authAlgo,
          transmission_sig: headers.transmissionSig,
          webhook_id: config.webhookId,
          webhook_event: JSON.parse(body),
        }),
      }
    );

    return response.verification_status === 'SUCCESS';
  } catch (error) {
    paymentLogger.error({ err: error, operation: 'webhook.verify' }, 'Webhook verification error');
    return false;
  }
}

/**
 * Get PayPal plan ID for a given tier and period
 * @param tier - Subscription tier (pro | unlimited)
 * @param period - Billing period (monthly | yearly)
 * @returns PayPal plan ID
 */
export function getPlanId(tier: 'pro' | 'unlimited', period: 'monthly' | 'yearly'): string {
  const planIdMap: Record<string, string | undefined> = {
    'pro-monthly': process.env.PAYPAL_PRO_MONTHLY_PLAN_ID,
    'pro-yearly': process.env.PAYPAL_PRO_YEARLY_PLAN_ID,
    'unlimited-monthly': process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID,
    'unlimited-yearly': process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID,
  };

  const key = `${tier}-${period}`;
  const planId = planIdMap[key];

  if (!planId) {
    throw new Error(`No plan ID found for ${tier}-${period}. Check environment variables.`);
  }

  return planId;
}

/**
 * Determine subscription tier from PayPal plan ID
 * @param planId - PayPal plan ID
 * @returns Subscription tier
 */
export function determineTierFromPlanId(planId: string): 'pro' | 'unlimited' {
  const proPlanIds = [
    process.env.PAYPAL_PRO_MONTHLY_PLAN_ID,
    process.env.PAYPAL_PRO_YEARLY_PLAN_ID,
  ];

  const unlimitedPlanIds = [
    process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID,
    process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID,
  ];

  if (proPlanIds.includes(planId)) {
    return 'pro';
  }

  if (unlimitedPlanIds.includes(planId)) {
    return 'unlimited';
  }

  throw new Error(`Unknown plan ID: ${planId}`);
}

/**
 * Determine billing period from PayPal plan ID
 * @param planId - PayPal plan ID
 * @returns Billing period
 */
export function determinePeriodFromPlanId(planId: string): 'monthly' | 'yearly' {
  const monthlyPlanIds = [
    process.env.PAYPAL_PRO_MONTHLY_PLAN_ID,
    process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID,
  ];

  const yearlyPlanIds = [
    process.env.PAYPAL_PRO_YEARLY_PLAN_ID,
    process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID,
  ];

  if (monthlyPlanIds.includes(planId)) {
    return 'monthly';
  }

  if (yearlyPlanIds.includes(planId)) {
    return 'yearly';
  }

  throw new Error(`Unknown plan ID: ${planId}`);
}
