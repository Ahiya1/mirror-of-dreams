# PayPal Client Library API Reference

## Quick Reference

### Core Functions

```typescript
// Token Management (auto-cached, 5-min buffer)
getPayPalAccessToken(): Promise<string>

// Subscription Management
createSubscription(userId: string, planId: string): Promise<string>
cancelSubscription(subscriptionId: string): Promise<void>
getSubscriptionDetails(subscriptionId: string): Promise<PayPalSubscription>

// Webhook Security
verifyWebhookSignature(body: string, headers: PayPalWebhookHeaders): Promise<boolean>

// Plan ID Helpers
getPlanId(tier: 'pro' | 'unlimited', period: 'monthly' | 'yearly'): string
determineTierFromPlanId(planId: string): 'pro' | 'unlimited'
determinePeriodFromPlanId(planId: string): 'monthly' | 'yearly'
```

### Types

```typescript
interface PayPalSubscription {
  id: string;
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  plan_id: string;
  subscriber: {
    payer_id: string;
    email_address: string;
    name: { given_name: string; surname: string; };
  };
  billing_info: {
    next_billing_time: string;
    cycle_executions: Array<{
      tenure_type: 'REGULAR' | 'TRIAL';
      sequence: number;
      cycles_completed: number;
    }>;
  };
  custom_id?: string;
}

interface PayPalWebhookHeaders {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
}
```

## Environment Variables

```bash
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_ENVIRONMENT=sandbox  # or 'live'
PAYPAL_WEBHOOK_ID=your-webhook-id
PAYPAL_PRO_MONTHLY_PLAN_ID=P-1J978568T3651942HNEV3UBY
PAYPAL_PRO_YEARLY_PLAN_ID=P-75F57632AL403313DNEV3UCA
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=P-5U305295XW0926335NEV3UCA
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=P-0LP821695B8135248NEV3UCI
DOMAIN=http://localhost:3000
```

## Usage Examples

### Create Subscription (tRPC)
```typescript
import { createSubscription, getPlanId } from '@/server/lib/paypal';

const planId = getPlanId('pro', 'monthly');
const approvalUrl = await createSubscription(ctx.user.id, planId);
// Redirect user to approvalUrl
```

### Cancel Subscription (tRPC)
```typescript
import { cancelSubscription } from '@/server/lib/paypal';

await cancelSubscription(user.paypalSubscriptionId);
```

### Verify Webhook (API Route)
```typescript
import { verifyWebhookSignature } from '@/server/lib/paypal';

const body = await req.text();
const headers = {
  transmissionId: req.headers.get('paypal-transmission-id'),
  transmissionTime: req.headers.get('paypal-transmission-time'),
  certUrl: req.headers.get('paypal-cert-url'),
  authAlgo: req.headers.get('paypal-auth-algo'),
  transmissionSig: req.headers.get('paypal-transmission-sig'),
};

const isValid = await verifyWebhookSignature(body, headers);
if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
```

### Process Webhook Event
```typescript
import { determineTierFromPlanId, determinePeriodFromPlanId } from '@/server/lib/paypal';

const event = JSON.parse(body);
const subscription = event.resource;

const tier = determineTierFromPlanId(subscription.plan_id);
const period = determinePeriodFromPlanId(subscription.plan_id);
const userId = subscription.custom_id;

// Update database...
```

## Error Handling

All functions throw descriptive errors:

```typescript
try {
  const approvalUrl = await createSubscription(userId, planId);
} catch (error) {
  // Error includes: "PayPal API error: 400 - {details}"
  console.error('Subscription creation failed:', error);
}
```

## Testing

See `server/lib/__tests__/paypal.test.ts` for complete test suite (14 test cases).

## Implementation Notes

- Token is cached in memory and auto-refreshed 5 minutes before expiry
- All requests use native fetch (no SDK dependency)
- Base URL automatically selected based on PAYPAL_ENVIRONMENT
- Webhook verification uses PayPal's official verification endpoint
- All functions are type-safe with strict TypeScript
