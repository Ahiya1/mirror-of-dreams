# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Integration Risk Assessment

## Vision Summary
Establish production-ready infrastructure for Mirror of Dreams by implementing Gmail SMTP email confirmation, seeding an admin user in production, creating a minimal admin dashboard, and verifying PayPal production integration end-to-end.

---

## Dependencies Analysis

### 1. Gmail SMTP Integration

#### Current State: FULLY IMPLEMENTED

**nodemailer is already installed:**
```json
// package.json line 65
"nodemailer": "^6.10.1",
"@types/nodemailer": "^7.0.4"  // devDependencies line 85
```

**Email service exists at:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/email.ts`

**Configuration:**
- Gmail SMTP transporter configured using `service: 'gmail'`
- Reads `GMAIL_USER` and `GMAIL_APP_PASSWORD` from environment variables
- Beautiful HTML email templates already exist for:
  - Email verification (`emailVerification`)
  - Password reset (`passwordReset`)

**Email Verification Flow Already Implemented:**
1. `/app/api/auth/send-verification/route.ts` - Sends verification emails
2. `/app/api/auth/verify-email/route.ts` - Verifies email tokens
3. `email_verification_tokens` table exists (migration: `20251202000001_email_verification_tokens.sql`)
4. Signup triggers verification email (lines 99-117 in `server/trpc/routers/auth.ts`)

**Required Environment Variables:**
```bash
GMAIL_USER=ahiya.butman@gmail.com
GMAIL_APP_PASSWORD=uurwgcbscdvtrbbi  # App Password (16-char)
```

**Risk Assessment: LOW**
- Email infrastructure is complete
- Only needs verification that env vars are set in Vercel production

---

### 2. Supabase Production Access

#### Current Configuration

**Supabase client:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/supabase.ts`
```typescript
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

**Service Role Key Usage:**
- Uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS
- Safe for server-side operations (webhooks, admin queries)

#### How to Connect to Production

**Option 1: Supabase CLI (Recommended)**
```bash
# Login to Supabase
supabase login

# Link to production project
supabase link --project-ref <project-id>

# Run SQL directly
supabase db sql "SELECT * FROM users WHERE email = 'ahiya.butman@gmail.com';"
```

**Option 2: Direct SQL via Supabase Dashboard**
- Navigate to SQL Editor in Supabase Dashboard
- Run queries directly

#### Admin User Seeding

**Existing script:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/scripts/create-admin.sql`
```sql
UPDATE public.users
SET
  is_admin = true,
  tier = 'premium',
  subscription_status = 'active'
WHERE email = 'ahiya.butman@gmail.com';
```

**Issue:** This script assumes user already exists. For production seeding:
1. User must sign up first through the app
2. Then run admin upgrade script
3. OR create idempotent seed that creates if not exists

**User Schema Fields for Admin:**
- `is_admin: BOOLEAN` - Admin flag
- `is_creator: BOOLEAN` - Creator flag (original owner)
- `tier: TEXT` - Must be 'free' | 'pro' | 'unlimited' (per migration `20251130000000`)
- `email_verified: BOOLEAN` - Mark as verified

**Risk Assessment: MEDIUM**
- Need to verify production Supabase project is accessible
- Admin script needs enhancement for idempotent operation
- Tier values changed from 'premium' to 'unlimited' in PayPal migration

---

### 3. PayPal Production Verification

#### Current Configuration

**PayPal library:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts`

**Webhook handler:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/paypal/route.ts`

**Supported Events:**
1. `BILLING.SUBSCRIPTION.ACTIVATED` - User subscribes, tier upgraded
2. `BILLING.SUBSCRIPTION.CANCELLED` - User cancels, `cancel_at_period_end = true`
3. `BILLING.SUBSCRIPTION.EXPIRED` - Subscription ends, downgrade to free
4. `BILLING.SUBSCRIPTION.SUSPENDED` - Payment failed, status = 'past_due'
5. `PAYMENT.SALE.COMPLETED` - Recurring payment success

**Webhook URL (must be configured in PayPal Dashboard):**
```
https://mirror-of-truth.com/api/webhooks/paypal
```

**Required Environment Variables:**
```bash
PAYPAL_CLIENT_ID=AYi3--5aZaMtxU36QcQgqzvyzN13xQv-N9HLGJWDDCsAki6gAXsr2HOxiLhZJXRVgeF9Mmu_vE-UgkEZ
PAYPAL_CLIENT_SECRET=<secret>
PAYPAL_ENVIRONMENT=live
PAYPAL_WEBHOOK_ID=16432009BD778541B
PAYPAL_PRO_MONTHLY_PLAN_ID=<plan-id>
PAYPAL_PRO_YEARLY_PLAN_ID=<plan-id>
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=<plan-id>
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=<plan-id>
```

**Signature Verification:**
```typescript
// server/lib/paypal.ts lines 213-248
export async function verifyWebhookSignature(
  body: string,
  headers: PayPalWebhookHeaders
): Promise<boolean>
```
- Uses PayPal's `/v1/notifications/verify-webhook-signature` API
- Requires `PAYPAL_WEBHOOK_ID` to be set

**Idempotency:**
- `webhook_events` table created in migration `20251130000000_paypal_integration.sql`
- Stores `event_id` as unique constraint
- Duplicate events return `{ received: true, duplicate: true }`

**Test Flow:**
1. Subscribe to a tier on production site
2. Pay via PayPal (your own account)
3. Webhook received at `/api/webhooks/paypal`
4. Check `webhook_events` table for logged event
5. Check `users` table for tier update
6. Visible in admin dashboard

**Risk Assessment: MEDIUM**
- Webhook signature verification depends on correct `PAYPAL_WEBHOOK_ID`
- Plan IDs must match what's configured in PayPal Dashboard
- Testing in production requires real money transaction (can refund)

---

### 4. Admin Dashboard

#### Current State

**Existing admin page:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/public/stewardship/admin.html`
- Uses `CREATOR_SECRET_KEY` for authentication
- Focuses on receipts and gifts (legacy features)
- Does NOT show users, reflections, or payments

**Admin tRPC router:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/admin.ts`

**Existing Endpoints:**
1. `admin.authenticate` - Authenticate with `CREATOR_SECRET_KEY`
2. `admin.checkAuth` - Verify session
3. `admin.getAllUsers` - Paginated user list with tier filter
4. `admin.getAllReflections` - Paginated reflections
5. `admin.getStats` - User counts by tier, total reflections
6. `admin.getUserByEmail` - Find user by email
7. `admin.updateUserTier` - Manual tier change
8. `admin.getApiUsageStats` - AI API usage tracking

**Gap Analysis:**
- No `/admin` Next.js route exists
- Existing `/stewardship/admin.html` is legacy HTML page
- Need new Next.js admin dashboard at `/app/admin/page.tsx`

**Required for M0:**
- Total users count (existing: `admin.getStats`)
- Admin's own record (need: `admin.getUserByEmail`)
- Last 10 users (existing: `admin.getAllUsers`)
- Last 5 payment events (NEW: need webhook_events query)

**Risk Assessment: LOW-MEDIUM**
- tRPC infrastructure exists
- Need to create new Next.js pages
- Access control exists (`creatorProcedure` middleware)

---

## Risk Assessment

### High Risks

**None identified** - All infrastructure is already in place.

---

### Medium Risks

#### 1. Production Environment Variables Not Set
**Impact:** Email won't send, PayPal webhooks will fail signature verification
**Mitigation:**
- Verify ALL required env vars are set in Vercel Dashboard
- Test email sending manually after deploy
- Check Vercel logs for errors

**Required Variables Checklist:**
```bash
# Email
GMAIL_USER=ahiya.butman@gmail.com
GMAIL_APP_PASSWORD=uurwgcbscdvtrbbi

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENVIRONMENT=live
PAYPAL_WEBHOOK_ID=16432009BD778541B
PAYPAL_PRO_MONTHLY_PLAN_ID=...
PAYPAL_PRO_YEARLY_PLAN_ID=...
PAYPAL_UNLIMITED_MONTHLY_PLAN_ID=...
PAYPAL_UNLIMITED_YEARLY_PLAN_ID=...

# Supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://mirror-of-truth.com
DOMAIN=https://mirror-of-truth.com
```

#### 2. Admin User Creation Order of Operations
**Impact:** Cannot run admin SQL until user exists
**Mitigation:**
1. Sign up through app first (creates user with `email_verified: false`)
2. Then run SQL to upgrade to admin
3. OR create idempotent script that handles both cases

#### 3. Tier Value Mismatch
**Impact:** Admin script uses 'premium' but PayPal migration changed to 'unlimited'
**Mitigation:**
- Update `create-admin.sql` to use `tier = 'unlimited'`
- Current tier constraint: `tier IN ('free', 'pro', 'unlimited')`

---

### Low Risks

#### 1. Gmail Rate Limits
**Impact:** May hit rate limits with high volume
**Mitigation:**
- Gmail allows ~500 emails/day for personal accounts
- Low initial volume expected
- Can upgrade to Google Workspace or SendGrid later

**Current Config:**
- Supabase `config.toml` line 149: `email_sent = 2` (per hour for local)
- Production Gmail has higher limits

#### 2. PayPal Webhook Delivery Failures
**Impact:** Subscription updates may not process
**Mitigation:**
- PayPal retries failed webhooks
- All events logged to `webhook_events` table
- Manual reprocessing possible via admin dashboard
- Webhook handler returns 200 even on errors to prevent infinite retries

#### 3. RLS Policy Bypass
**Impact:** Service role key bypasses all RLS
**Mitigation:**
- Service role key only used server-side
- Never exposed to client
- All admin endpoints use `creatorProcedure` middleware for auth

---

## Dependency Graph

```
Environment Variables (Foundation)
|
+-- Gmail SMTP Credentials
|   +-- Email Service (server/lib/email.ts) [COMPLETE]
|       +-- Signup Verification Flow [COMPLETE]
|       +-- Password Reset Flow [COMPLETE]
|
+-- PayPal Credentials
|   +-- PayPal Library (server/lib/paypal.ts) [COMPLETE]
|       +-- Webhook Handler (app/api/webhooks/paypal/route.ts) [COMPLETE]
|           +-- webhook_events table [COMPLETE]
|           +-- User tier updates [COMPLETE]
|
+-- Supabase Credentials
    +-- Supabase Client (server/lib/supabase.ts) [COMPLETE]
        +-- Admin Router (server/trpc/routers/admin.ts) [COMPLETE]
            +-- Admin Dashboard UI [NEEDS CREATION]
        +-- Admin User Seed Script [NEEDS UPDATE]
```

---

## Critical Path Analysis

### Dependencies for Each Feature:

1. **Email Confirmation** (BLOCKED BY: Nothing)
   - All code exists
   - Just needs env vars in production
   - Estimated effort: 1-2 hours (verification + testing)

2. **Admin User in Production** (BLOCKED BY: Sign up first OR idempotent script)
   - User must exist before running upgrade SQL
   - OR script needs to handle user creation
   - Estimated effort: 1 hour (script update + execution)

3. **Admin Dashboard** (BLOCKED BY: Admin user)
   - Backend endpoints exist
   - Need Next.js UI at `/app/admin/page.tsx`
   - Estimated effort: 4-6 hours (UI + testing)

4. **PayPal Verification** (BLOCKED BY: Admin user, working dashboard)
   - Infrastructure complete
   - Need real test transaction
   - Estimated effort: 2-3 hours (test + verify + document)

---

## Integration Considerations

### Cross-Feature Integration Points

1. **User Table is Central:**
   - Email verification updates `email_verified`
   - PayPal webhooks update `tier`, `subscription_status`, `paypal_subscription_id`
   - Admin dashboard reads all user fields
   - All features share same `users` table

2. **Service Role Key Usage:**
   - Used by: Email API, PayPal webhook, Admin router
   - All bypass RLS by design
   - Consistent authentication pattern

3. **Event Logging Pattern:**
   - PayPal uses `webhook_events` table
   - Vision mentions new `events` table for operational logging
   - Consider unifying or keeping separate

### Potential Integration Challenges

1. **Email Verification Blocking:**
   - Current flow sends email but user can proceed
   - Vision says "Unconfirmed users see blocking screen"
   - May need to add check in auth flow

2. **Admin Dashboard Authentication:**
   - Existing uses `CREATOR_SECRET_KEY`
   - Could also use `is_admin` flag from JWT
   - Need to decide on unified approach

---

## Recommendations for Master Plan

### 1. Single Iteration Approach

**Recommendation:** Execute as SINGLE ITERATION

**Rationale:**
- All backend infrastructure already exists
- No complex dependencies between features
- Primarily UI work and configuration
- Can be completed in 6-8 hours

### 2. Work Order

**Recommended sequence:**
1. Verify production environment variables (30 min)
2. Test email sending manually (30 min)
3. Create admin user via signup + SQL (30 min)
4. Create admin dashboard UI (4-5 hours)
5. Test PayPal end-to-end (1-2 hours)

### 3. Specific Technical Recommendations

**For Email:**
- No code changes needed
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` in Vercel
- Test by signing up a test account

**For Admin User:**
- Update `create-admin.sql`:
  ```sql
  -- Make idempotent
  INSERT INTO public.users (email, password_hash, name, tier, is_admin, is_creator, email_verified)
  VALUES ('ahiya.butman@gmail.com', 'placeholder-will-reset', 'Ahiya', 'unlimited', true, true, true)
  ON CONFLICT (email) DO UPDATE SET
    is_admin = true,
    is_creator = true,
    tier = 'unlimited',
    email_verified = true;
  ```
- Then sign in and reset password through app

**For Admin Dashboard:**
- Create `/app/admin/page.tsx`
- Use existing `admin.getStats`, `admin.getAllUsers` endpoints
- Add new endpoint for `webhook_events` query
- Use existing glass design system components

**For PayPal:**
- Verify `PAYPAL_WEBHOOK_ID` matches dashboard
- Test with $15 Pro Monthly subscription
- Can refund after verification

### 4. Risk Mitigations to Implement

1. **Add health check endpoint:**
   - `/api/health` that verifies all services connected
   - Check Supabase, PayPal API, Gmail connectivity

2. **Add admin visibility for email status:**
   - Log email send attempts
   - Show last email sent timestamp in admin

3. **Add webhook monitoring:**
   - Show recent webhook events in admin
   - Highlight failures for manual review

---

## Technology Recommendations

### Existing Stack (No Changes Needed)

- **Email:** nodemailer + Gmail SMTP (already configured)
- **Database:** Supabase PostgreSQL (already configured)
- **Payments:** PayPal REST API (already integrated)
- **Auth:** Custom JWT + bcrypt (already implemented)
- **UI:** Next.js + TailwindCSS + Glass components (already available)

### Minor Enhancements

1. **Consider Supabase Auth SMTP:**
   - Supabase can use custom SMTP for auth emails
   - Currently disabled in `config.toml`
   - Could simplify email verification if enabled

2. **Event Logging Table:**
   - Vision mentions `events` table
   - Consider creating for operational logging
   - Schema already defined in vision

---

## Open Questions Resolved

1. **Does Supabase Auth have email confirmation?**
   - Yes, but we're using custom JWT auth, not Supabase Auth
   - Custom email verification already implemented via `email_verification_tokens` table

2. **What's the current schema for subscriptions/payments?**
   - User subscription fields in `users` table
   - Webhook events in `webhook_events` table
   - No separate `subscriptions` or `payments` table

3. **Is there an existing events/logs table?**
   - `webhook_events` for PayPal events
   - No general operational events table
   - Recommend creating one in this plan

---

## Notes & Observations

1. **Code Quality:** Existing implementations are well-structured with good error handling
2. **Documentation:** PayPal webhook handler has comprehensive README
3. **Testing:** Manual testing recommended; automated tests exist for PayPal library
4. **Security:** Service role key properly isolated; auth middleware in place
5. **Design System:** Glass components available for consistent admin UI

---

*Exploration completed: 2025-12-08*
*This report informs master planning decisions*
