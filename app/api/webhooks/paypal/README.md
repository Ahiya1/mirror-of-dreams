# PayPal Webhook Handler

## Overview

This webhook handler processes PayPal subscription events to manage user subscriptions and payment status.

## Supported Events

### 1. BILLING.SUBSCRIPTION.ACTIVATED

**Trigger:** When a user completes the subscription approval flow
**Action:**

- Upgrades user tier (pro or unlimited)
- Sets subscription status to 'active'
- Stores PayPal subscription ID and payer ID
- Records subscription start date
- Resets cancel_at_period_end flag

**Database Updates:**

```sql
UPDATE users SET
  tier = <tier from plan>,
  subscription_status = 'active',
  subscription_period = <period from plan>,
  subscription_started_at = NOW(),
  paypal_subscription_id = <subscription.id>,
  paypal_payer_id = <payer.id>,
  subscription_id = <subscription.id>,
  cancel_at_period_end = false
WHERE id = <user_id from custom_id>
```

### 2. BILLING.SUBSCRIPTION.CANCELLED

**Trigger:** When a user cancels their subscription
**Action:**

- Marks subscription for cancellation at period end
- Sets expiration date from billing info
- User retains tier until period ends

**Database Updates:**

```sql
UPDATE users SET
  cancel_at_period_end = true,
  subscription_expires_at = <next_billing_time>
WHERE paypal_subscription_id = <subscription.id>
```

### 3. BILLING.SUBSCRIPTION.EXPIRED

**Trigger:** When subscription period ends (after cancellation or non-payment)
**Action:**

- Downgrades user to free tier
- Sets status to 'expired'
- Resets cancel flag

**Database Updates:**

```sql
UPDATE users SET
  tier = 'free',
  subscription_status = 'expired',
  cancel_at_period_end = false
WHERE paypal_subscription_id = <subscription.id>
```

### 4. BILLING.SUBSCRIPTION.SUSPENDED

**Trigger:** When payment fails
**Action:**

- Marks subscription as past_due
- User may still have access until final expiration

**Database Updates:**

```sql
UPDATE users SET
  subscription_status = 'past_due'
WHERE paypal_subscription_id = <subscription.id>
```

### 5. PAYMENT.SALE.COMPLETED

**Trigger:** When recurring payment succeeds
**Action:**

- Logs successful payment
- Updates timestamp

**Database Updates:**

```sql
UPDATE users SET
  updated_at = NOW()
WHERE paypal_subscription_id = <subscription.id>
```

## Security

### Signature Verification

All webhooks are verified using PayPal's signature verification:

```typescript
const isValid = await verifyWebhookSignature(body, headers);
if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

Required headers:

- `paypal-transmission-id`
- `paypal-transmission-time`
- `paypal-cert-url`
- `paypal-auth-algo`
- `paypal-transmission-sig`

### Idempotency

Duplicate events are prevented using the `webhook_events` table:

```typescript
const { data: existing } = await supabase
  .from('webhook_events')
  .select('id')
  .eq('event_id', event.id)
  .single();

if (existing) {
  return NextResponse.json({ received: true, duplicate: true });
}
```

All events are logged before processing to ensure no event is processed twice.

## Error Handling

The webhook handler **always returns 200** to prevent PayPal retries, even on error:

```typescript
catch (error: any) {
  console.error('[PayPal Webhook] Error:', error);
  // Return 200 to prevent PayPal retries
  return NextResponse.json({
    received: true,
    error: 'Processing error',
    details: error.message,
  });
}
```

This is important because:

1. Event is already logged to database
2. We can manually reprocess if needed
3. Prevents infinite retry loops

## Configuration

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_WEBHOOK_ID` (for signature verification)
- `PAYPAL_PRO_MONTHLY_PLAN_ID`
- `PAYPAL_PRO_YEARLY_PLAN_ID`
- `PAYPAL_UNLIMITED_MONTHLY_PLAN_ID`
- `PAYPAL_UNLIMITED_YEARLY_PLAN_ID`

## Testing

### Using PayPal Sandbox

1. Create test subscription using sandbox credentials
2. Complete checkout flow
3. Check webhook_events table for BILLING.SUBSCRIPTION.ACTIVATED event
4. Verify user tier upgraded
5. Cancel subscription via PayPal
6. Verify BILLING.SUBSCRIPTION.CANCELLED event received
7. Wait for subscription to expire (or simulate)
8. Verify BILLING.SUBSCRIPTION.EXPIRED event received

### Manual Testing with curl

```bash
# Test webhook with mock event (signature verification will fail)
curl -X POST http://localhost:3000/api/webhooks/paypal \
  -H "Content-Type: application/json" \
  -H "paypal-transmission-id: test-123" \
  -H "paypal-transmission-time: 2025-01-01T00:00:00Z" \
  -H "paypal-cert-url: https://api.paypal.com/cert" \
  -H "paypal-auth-algo: SHA256withRSA" \
  -H "paypal-transmission-sig: test-sig" \
  -d '{
    "id": "WH-TEST-123",
    "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
    "resource": {
      "id": "I-TEST123",
      "plan_id": "P-TEST123",
      "custom_id": "user-uuid-here",
      "subscriber": {
        "payer_id": "PAYER123",
        "email_address": "test@example.com"
      }
    }
  }'
```

## Monitoring

Key metrics to track:

- Webhook processing time (logged in response)
- Event types received (check webhook_events table)
- Failed signature verifications (errors in logs)
- Duplicate events (check duplicate: true responses)
- Database update failures (errors in logs)

## Troubleshooting

### Issue: Webhook signature verification fails

**Solution:**

- Verify PAYPAL_WEBHOOK_ID is correct
- Check PayPal dashboard webhook configuration
- Ensure webhook URL is correct in PayPal dashboard

### Issue: User not found for subscription

**Solution:**

- Verify custom_id is set correctly in createSubscription
- Check subscription resource for valid custom_id
- Query users table by paypal_subscription_id

### Issue: Duplicate events processing

**Solution:**

- Check webhook_events table for event_id
- Verify unique constraint is enforced
- Check logs for duplicate: true responses

### Issue: Database update fails

**Solution:**

- Verify Supabase connection
- Check user exists
- Verify column names match schema
- Check RLS policies (webhook uses service role key)

## Dependencies

This handler depends on:

- **Builder 2**: PayPal client library (`server/lib/paypal.ts`)
  - `verifyWebhookSignature()` - Signature verification
  - `determineTierFromPlanId()` - Plan ID to tier mapping
  - `determinePeriodFromPlanId()` - Plan ID to period mapping

- **Builder 1**: Database schema
  - `webhook_events` table
  - User table columns: `paypal_subscription_id`, `paypal_payer_id`, `cancel_at_period_end`
  - Tier constraint: 'free' | 'pro' | 'unlimited'
