# Tech Stack for Iteration 16

## Core Technologies (No Changes)

### Frontend
- **Next.js 14** - App Router for pages and API routes
- **React 18** - UI components
- **TypeScript** - Type safety

### Backend
- **tRPC** - Type-safe API procedures
- **Supabase** - PostgreSQL database + auth
- **Next.js API Routes** - Webhook handlers (not tRPC - need raw body)

### AI
- **Anthropic Claude Sonnet 4.5** - Already implemented, no changes needed

## PayPal Integration Approach

### Decision: REST API via Fetch (No SDK)

**Rationale:**
1. Smaller bundle size (no SDK dependency)
2. More control over token caching
3. Easier debugging (can see exact requests)
4. Follows modern patterns (SDK adds unnecessary abstraction)
5. PayPal SDK is less mature than Stripe SDK

**Implementation:**
- Create `server/lib/paypal.ts` with helper functions
- Use native `fetch` for all API calls
- Implement in-memory token caching

### Environment Variables Required

```env
# PayPal API Credentials
PAYPAL_CLIENT_ID=AYZUnPSWX22...
PAYPAL_CLIENT_SECRET=EAurh1D6v...
PAYPAL_ENVIRONMENT=sandbox

# PayPal Plan IDs (to be created via MCP)
PAYPAL_PRO_MONTHLY_PLAN_ID=P-xxxx
PAYPAL_PRO_YEARLY_PLAN_ID=P-xxxx
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=P-xxxx
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=P-xxxx

# PayPal Webhook Verification
PAYPAL_WEBHOOK_ID=xxxx
```

## Database Schema Changes

### New Columns on users Table
```sql
paypal_subscription_id TEXT        -- PayPal subscription ID for webhook lookups
paypal_payer_id TEXT              -- PayPal customer ID
reflections_today INTEGER DEFAULT 0 -- Daily reflection counter
last_reflection_date DATE          -- For daily reset logic
cancel_at_period_end BOOLEAN DEFAULT FALSE -- Graceful cancellation flag
```

### New Table: webhook_events
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,    -- PayPal event ID for idempotency
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB,
  user_id UUID REFERENCES users(id)
);
```

### Updated Tier Constraint
```sql
-- OLD: CHECK (tier IN ('free', 'essential', 'premium'))
-- NEW: CHECK (tier IN ('free', 'pro', 'unlimited'))
```

## API Patterns

### PayPal Webhook Handler
Uses Next.js API route (not tRPC) because:
- Needs raw body for signature verification
- PayPal expects specific response format
- Cannot use tRPC middleware

```
Location: app/api/webhooks/paypal/route.ts
Method: POST
Auth: PayPal signature verification
```

### tRPC Subscription Procedures
```typescript
subscriptions.createCheckout({ tier, period }) → { approvalUrl }
subscriptions.cancel() → { success }
subscriptions.getStatus() → { tier, status, nextBilling, ... }
subscriptions.reactivate() → { success } // Optional
```

## Type System Updates

### SubscriptionTier Type
```typescript
// OLD: 'free' | 'essential' | 'premium'
// NEW: 'free' | 'pro' | 'unlimited'
```

### Tier Limits Constants
```typescript
export const TIER_LIMITS = {
  free: 2,        // 2/month
  pro: 30,        // 30/month
  unlimited: 60,  // 60/month
} as const;

export const DAILY_LIMITS = {
  free: Infinity, // No daily limit
  pro: 1,         // 1/day
  unlimited: 2,   // 2/day
} as const;
```

## Testing Strategy

### PayPal Sandbox
- All development uses sandbox environment
- Create test subscriptions via MCP tools
- Simulate webhook events via PayPal Dashboard
- Use ngrok for local webhook testing

### Database Testing
- Test migration on local Supabase first
- Verify tier constraint update works with existing data
- Test daily limit functions with edge cases

## Security Considerations

### Webhook Verification
PayPal requires server-side verification via API call:
```
POST /v1/notifications/verify-webhook-signature
```
- Must include all PayPal headers
- Requires valid access token
- Returns verification_status: "SUCCESS" or "FAILURE"

### Token Security
- Store in environment variables only
- Never log access tokens
- Refresh before expiry (5-minute buffer)
