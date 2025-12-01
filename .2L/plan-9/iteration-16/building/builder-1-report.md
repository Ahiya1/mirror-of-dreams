# Builder-1 Report: Database Schema & Types

## Status
COMPLETE

## Summary
Successfully created the comprehensive PayPal integration database migration and updated all TypeScript type definitions to transition from Stripe to PayPal and rename subscription tiers from 'essential'/'premium' to 'pro'/'unlimited'. The migration includes new columns for PayPal integration, daily reflection tracking, webhook event logging, and updated database functions with new tier limits.

## Files Created

### Migration
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251130000000_paypal_integration.sql` - Complete PayPal integration migration with:
  - PayPal columns (paypal_subscription_id, paypal_payer_id)
  - Daily limit tracking columns (reflections_today, last_reflection_date)
  - Subscription management (cancel_at_period_end)
  - Tier constraint update with data migration (essential→pro, premium→unlimited)
  - webhook_events table for idempotency
  - Updated database functions (check_reflection_limit, check_daily_limit, check_dream_limit)

## Files Modified

### Types
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts` - Updated:
  - SubscriptionTier: 'free' | 'essential' | 'premium' → 'free' | 'pro' | 'unlimited'
  - Added to User interface: reflectionsToday, lastReflectionDate, cancelAtPeriodEnd
  - Updated UserRow interface with new columns
  - Updated userRowToUser transformer to handle new fields

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/subscription.ts` - Updated:
  - Replaced stripeCustomerId/stripeSubscriptionId with paypalSubscriptionId/paypalPayerId
  - StripeConfig → PayPalConfig with plan IDs instead of price IDs
  - Updated TierPricing: essential/premium → pro/unlimited
  - Updated TierLimits: essential/premium → pro/unlimited

### Constants
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` - Updated:
  - TIER_LIMITS: { free: 2, pro: 30, unlimited: 60 }
  - DAILY_LIMITS: { free: Infinity, pro: 1, unlimited: 2 } (NEW)
  - DREAM_LIMITS: { free: 2, pro: 5, unlimited: Infinity } (NEW)

## Success Criteria Met
- [x] Migration file created with all schema changes
- [x] PayPal columns added (paypal_subscription_id, paypal_payer_id)
- [x] Daily tracking columns added (reflections_today, last_reflection_date)
- [x] cancel_at_period_end column added
- [x] Tier constraint updated with safe migration path
- [x] Data migration included (essential→pro, premium→unlimited)
- [x] webhook_events table created for idempotency
- [x] Indexes created for efficient PayPal lookups
- [x] check_reflection_limit() updated with new limits (2/30/60)
- [x] check_daily_limit() created as new function
- [x] check_dream_limit() updated with new limits (2/5/∞)
- [x] TypeScript types updated to use new tier names
- [x] Constants updated with new limits

## Database Migration Details

### Schema Changes
1. **New Columns Added:**
   - paypal_subscription_id TEXT - Stores PayPal subscription ID
   - paypal_payer_id TEXT - Stores PayPal payer ID
   - reflections_today INTEGER DEFAULT 0 - Daily reflection counter
   - last_reflection_date DATE - Date of last reflection (for daily limit reset)
   - cancel_at_period_end BOOLEAN DEFAULT FALSE - Subscription cancellation flag

2. **Tier Migration Strategy:**
   - Step 1: Drop old tier constraint
   - Step 2: Add temporary constraint allowing both old and new values
   - Step 3: Migrate data (UPDATE statements)
   - Step 4: Drop temporary constraint
   - Step 5: Add final constraint with only new values
   - This ensures zero-downtime migration

3. **Indexes Created:**
   - idx_users_paypal_subscription_id (partial index, only non-null)
   - idx_webhook_events_type (for efficient event type queries)
   - idx_webhook_events_event_id (for idempotency checks)

4. **webhook_events Table:**
   - id UUID PRIMARY KEY
   - event_id TEXT UNIQUE NOT NULL (for idempotency)
   - event_type TEXT NOT NULL (e.g., 'BILLING.SUBSCRIPTION.ACTIVATED')
   - processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   - payload JSONB (full event data)
   - user_id UUID REFERENCES users(id) (optional)

### Database Functions Updated

1. **check_reflection_limit(user_uuid UUID) → BOOLEAN**
   - New limits: free=2, pro=30, unlimited=60
   - Creators/admins bypass check
   - Compares reflection_count_this_month to tier limit

2. **check_daily_limit(user_uuid UUID) → BOOLEAN** (NEW)
   - New limits: free=∞, pro=1, unlimited=2
   - Creators/admins bypass check
   - Timezone-aware date calculation
   - Resets counter on new day
   - Free tier has no daily limit

3. **check_dream_limit(user_uuid UUID) → BOOLEAN**
   - New limits: free=2, pro=5, unlimited=∞
   - Creators/admins bypass check
   - Counts active dreams only

## TypeScript Compilation Status

TypeScript compilation shows expected errors in files that reference old tier names:
- app/pricing/page.tsx (references 'essential')
- app/profile/page.tsx (references 'essential')
- components/shared/AppNavigation.tsx (references 'premium', 'essential')
- hooks/useAuth.ts (needs new User fields)
- server/trpc/routers/reflection.ts (references 'premium')
- server/trpc/routers/reflections.ts (old tier names in logic)

These errors are EXPECTED and will be resolved by:
- Builder 4 (tRPC routers and middleware)
- Integration phase (frontend components and pages)

## Dependencies for Other Builders

### For Builder 2 (PayPal Client Library):
- SubscriptionTier type: 'free' | 'pro' | 'unlimited'
- Database columns: paypal_subscription_id, paypal_payer_id available
- webhook_events table ready for idempotency checks

### For Builder 3 (Webhook Handler):
- webhook_events table schema defined
- User columns ready: paypal_subscription_id, cancel_at_period_end, tier
- Database functions ready to use

### For Builder 4 (tRPC & Middleware):
- TIER_LIMITS constant: { free: 2, pro: 30, unlimited: 60 }
- DAILY_LIMITS constant: { free: Infinity, pro: 1, unlimited: 2 }
- DREAM_LIMITS constant: { free: 2, pro: 5, unlimited: Infinity }
- User type includes: reflectionsToday, lastReflectionDate, cancelAtPeriodEnd
- check_daily_limit() function available in database

## Integration Notes

### Database Migration Execution
To apply this migration:
```bash
# Local development
supabase db push

# Production (via Supabase dashboard or CLI)
supabase db push --linked
```

### Type Safety
The TypeScript compiler will catch all uses of old tier names ('essential', 'premium'), ensuring complete migration. All type errors should be resolved during integration or by subsequent builders.

### Backward Compatibility
The migration is designed to be safe:
- Uses IF NOT EXISTS for all schema changes
- Handles null values appropriately
- Provides default values for new columns
- Migrates data before enforcing new constraints

## Testing Recommendations

### Database Testing
1. Test migration on empty database
2. Test migration with existing 'essential'/'premium' users
3. Verify constraint enforcement (tier must be free/pro/unlimited)
4. Test all three database functions with new tier values
5. Verify webhook_events uniqueness constraint works

### Type Testing
1. Verify userRowToUser handles all new fields
2. Test with null values for optional fields
3. Verify tier type safety across codebase

### Integration Testing
1. Test daily limit reset at midnight (timezone-aware)
2. Test monthly limit reset on month change
3. Verify webhook idempotency (duplicate events rejected)
4. Test PayPal column updates

## Patterns Followed

- Migration follows established pattern from 20250121000000_initial_schema.sql
- Used IF NOT EXISTS for idempotent migrations
- Proper indexing for query performance
- Security definer functions for permission control
- Type transformations follow existing userRowToUser pattern
- Constants exported as const assertions for type safety

## Notes

1. **Daily Limit Implementation**: The check_daily_limit() function is timezone-aware and resets at midnight in the user's timezone. Free tier users have no daily limit (Infinity).

2. **Creator/Admin Bypass**: All limit checks (monthly, daily, dream) are bypassed for users with is_creator=true or is_admin=true.

3. **Webhook Events**: The webhook_events table uses event_id as unique constraint for idempotency. PayPal webhooks may retry, so this prevents duplicate processing.

4. **Migration Safety**: The tier constraint migration uses a two-step process to ensure no downtime and safe data migration.

5. **Extended Thinking**: Based on patterns.md, extended thinking should only be enabled for 'unlimited' tier (Builder 4's responsibility).
