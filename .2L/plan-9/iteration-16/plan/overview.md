# Iteration 16 Overview: Foundation & Backend - PayPal Integration Core

## Iteration Summary
Build the complete PayPal subscription backend infrastructure including database schema, API client, webhook handler, and tRPC procedures.

## Key Discoveries from Exploration

### Already Complete (No Work Needed)
- Claude Sonnet 4.5 already implemented (reflection.ts line 93)
- Extended thinking already implemented for premium tier
- Generic `subscription_id` column exists in database

### Critical Findings
1. **Stripe columns referenced but don't exist** - `stripe_customer_id` and `stripe_subscription_id` in webhook handler reference columns that don't exist
2. **Tier names need renaming** - essential→pro, premium→unlimited across 15+ files
3. **Daily limits not implemented** - New feature requiring new columns and middleware
4. **No PayPal SDK needed** - Use REST API directly via fetch (cleaner, smaller)

## Success Criteria

1. **Database Migration Complete**
   - All new columns added (paypal_subscription_id, reflections_today, etc.)
   - Tier constraint updated to free|pro|unlimited
   - Indexes created for PayPal lookups

2. **PayPal Client Library Working**
   - Token management with auto-refresh
   - createSubscription returns approval URL
   - cancelSubscription works
   - getSubscriptionDetails returns current status

3. **Webhook Handler Operational**
   - Signature verification passes
   - All 5 event types handled correctly
   - Idempotency via webhook_events table
   - Database updates for each event

4. **tRPC Procedures Ready**
   - createCheckout returns approval URL
   - cancel triggers PayPal cancellation
   - getStatus returns full subscription details

5. **Tier Limits Updated**
   - TIER_LIMITS: free=2, pro=30, unlimited=60
   - DAILY_LIMITS: free=Infinity, pro=1, unlimited=2
   - Extended thinking only for unlimited tier

## Builder Task Assignments

### Builder 1: Database Schema & Types
**Files:**
- supabase/migrations/20251130_paypal_integration.sql (NEW)
- types/user.ts (MODIFY)
- types/subscription.ts (MODIFY)
- lib/utils/constants.ts (MODIFY)

**Scope:**
- Create comprehensive migration with all schema changes
- Update TypeScript types for new tier names
- Update constants with new limits
- Create webhook_events table

### Builder 2: PayPal Client Library
**Files:**
- server/lib/paypal.ts (NEW)

**Scope:**
- Token management with caching
- createSubscription(userId, planId)
- cancelSubscription(subscriptionId)
- getSubscriptionDetails(subscriptionId)
- verifyWebhookSignature(body, headers)
- Plan ID mapping helper

### Builder 3: PayPal Webhook Handler
**Files:**
- app/api/webhooks/paypal/route.ts (NEW)

**Scope:**
- Signature verification
- BILLING.SUBSCRIPTION.ACTIVATED handler
- BILLING.SUBSCRIPTION.CANCELLED handler
- BILLING.SUBSCRIPTION.EXPIRED handler
- BILLING.SUBSCRIPTION.SUSPENDED handler
- PAYMENT.SALE.COMPLETED handler
- Idempotency checks
- Comprehensive logging

### Builder 4: tRPC Procedures & Middleware
**Files:**
- server/trpc/routers/subscriptions.ts (MODIFY)
- server/trpc/middleware.ts (MODIFY)
- server/lib/cost-calculator.ts (MODIFY)

**Scope:**
- createCheckout procedure
- cancel procedure
- reactivate procedure (bonus)
- Daily limit check in middleware
- Update extended thinking to unlimited-only

## Dependencies
- Builder 2 depends on Builder 1 (needs types)
- Builder 3 depends on Builder 2 (needs PayPal client)
- Builder 4 depends on Builder 1 (needs types/constants)

## Estimated Duration
10-12 hours total across all builders
