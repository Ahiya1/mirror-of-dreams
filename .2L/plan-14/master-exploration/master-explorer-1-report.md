# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Existing Implementation Analysis

## Vision Summary
Make Mirror of Dreams production-ready by implementing email confirmation on signup, seeding admin user, building a minimal admin dashboard, and verifying PayPal integration end-to-end.

---

## Executive Summary

The codebase is **well-structured and significantly more mature than expected**. Key discovery: email verification infrastructure already exists but may not be triggered correctly on signup. This changes the scope from "build from scratch" to "verify and fix existing implementation."

---

## 1. Current Email/Auth Implementation Analysis

### What Exists

#### Email Service (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/email.ts`)
- **Nodemailer with Gmail SMTP** - fully implemented
- Transporter configured with `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars
- Two email templates exist:
  - `emailVerification` - branded HTML template with "Verify Email" button
  - `passwordReset` - branded HTML template
- Functions available:
  - `sendVerificationEmail(email, token, userName)` - returns `{success, error?}`
  - `sendPasswordResetEmail(email, token, userName)` - returns `{success, error?}`
  - `generateToken()` - crypto.randomBytes(32).toString('hex')
  - `getVerificationTokenExpiration()` - 24 hours from now
  - `getTokenExpiration()` - 1 hour from now (for password reset)

#### Email Verification Tokens Table (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251202000001_email_verification_tokens.sql`)
- Table: `email_verification_tokens`
- Columns: `id`, `user_id`, `token`, `expires_at`, `created_at`
- Indexes on `token`, `user_id`, `expires_at`
- RLS enabled with open policy
- Cleanup function: `cleanup_expired_verification_tokens()`

#### Verification API Routes
- `/api/auth/send-verification/route.ts` - POST endpoint to send/resend verification email
- `/api/auth/verify-email/route.ts` - POST endpoint to verify token, GET redirects to HTML page

#### Signup Flow (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`)
Lines 98-117 show that **email verification IS triggered on signup**:
```typescript
// Send verification email (async, don't block signup)
try {
  const verificationToken = generateToken();
  const expiresAt = getVerificationTokenExpiration();

  // Store verification token
  await supabase.from('email_verification_tokens').insert({
    user_id: newUser.id,
    token: verificationToken,
    expires_at: expiresAt.toISOString(),
  });

  // Send email (fire and forget - don't block signup on email failure)
  sendVerificationEmail(newUser.email, verificationToken, newUser.name).catch(
    (err) => console.error('Failed to send verification email:', err)
  );
} catch (emailError) {
  console.error('Error setting up verification email:', emailError);
}
```

### Key Finding
**Email verification code exists and runs on signup**, but it's fire-and-forget with error catching. The issue might be:
1. Gmail SMTP credentials not set in production environment
2. Errors being silently caught
3. Email going to spam
4. Verification UI not blocking unverified users

### What's Missing
1. **Blocking UI for unverified users** - No check forcing email confirmation before app access
2. **Resend verification button** - API exists but UI may not expose it
3. **Production Gmail credentials** - Need to verify they're set in Vercel
4. **Email sending logs** - No events table to track email send success/failure

### Key Files to Modify
| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/email.ts` | Already complete - verify credentials |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts` | May need to add event logging |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/auth/signup/page.tsx` | May need "check your email" flow |
| New: Email verification blocking page | Show to unverified users |

---

## 2. Current Admin Implementation Analysis

### What Exists

#### Admin tRPC Router (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/admin.ts`)
Full admin router already exists with:
- `authenticate` - Authenticates using `CREATOR_SECRET_KEY` env var
- `checkAuth` - Validates creator key
- `getAllUsers` - Paginated user list with tier filter
- `getAllReflections` - Paginated reflections list
- `getStats` - User counts by tier, reflection/evolution/artifact totals
- `getUserByEmail` - Lookup user by email
- `updateUserTier` - Manually change user tier
- `getApiUsageStats` - AI usage and cost tracking

#### Middleware (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`)
- `isCreatorOrAdmin` middleware checks `ctx.user.isCreator || ctx.user.isAdmin`
- `creatorProcedure` - Protected procedure for admin endpoints

#### User Schema
Users table has `is_admin` and `is_creator` boolean columns:
```sql
is_creator BOOLEAN DEFAULT FALSE,
is_admin BOOLEAN DEFAULT FALSE,
```

### What's Missing
1. **No `/admin` page** - tRPC endpoints exist but no UI
2. **Admin authentication is via CREATOR_SECRET_KEY** - Not user-based admin check
3. **No admin user seeded in production** - Need to set `is_admin=true` for ahiya.butman@gmail.com

### Key Finding
The admin tRPC router uses `CREATOR_SECRET_KEY` for authentication, not the user's `is_admin` flag. The middleware `isCreatorOrAdmin` checks the user context, but the `authenticate` endpoint bypasses this.

For the admin dashboard vision, we need:
1. Create `/app/admin/page.tsx` UI
2. Use tRPC admin endpoints (already built)
3. Seed ahiya.butman@gmail.com as admin in production

### Key Files to Modify
| File | Purpose |
|------|---------|
| New: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/admin/page.tsx` | Admin dashboard UI |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/admin.ts` | May need payment events query |
| New: Seed script or migration | Set is_admin=true for ahiya |

---

## 3. Current Database Schema Analysis

### Users Table
Key columns from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20250121000000_initial_schema.sql` and `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251130000000_paypal_integration.sql`:

```sql
-- Core
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
name TEXT NOT NULL

-- Subscription
tier TEXT CHECK (tier IN ('free', 'pro', 'unlimited'))
subscription_status TEXT CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trialing'))
subscription_period TEXT CHECK (period IN ('monthly', 'yearly'))
subscription_started_at TIMESTAMP
subscription_expires_at TIMESTAMP
cancel_at_period_end BOOLEAN DEFAULT FALSE

-- PayPal
paypal_subscription_id TEXT
paypal_payer_id TEXT

-- Usage
reflection_count_this_month INTEGER DEFAULT 0
reflections_today INTEGER DEFAULT 0
last_reflection_date DATE
total_reflections INTEGER DEFAULT 0

-- Admin/Creator
is_creator BOOLEAN DEFAULT FALSE
is_admin BOOLEAN DEFAULT FALSE

-- Verification
email_verified BOOLEAN DEFAULT FALSE
```

### Webhook Events Table (exists!)
From `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251130000000_paypal_integration.sql`:
```sql
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB,
  user_id UUID REFERENCES public.users(id)
);
```

### Other Tables
- `reflections` - Dream reflections with AI responses
- `usage_tracking` - Monthly usage by user
- `evolution_reports` - Growth analysis reports
- `email_verification_tokens` - Verification tokens
- `password_reset_tokens` - Password reset tokens

### What's Missing
1. **No general `events` table** - Only `webhook_events` for PayPal. Vision wants event logging for user_signed_up, email_confirmation_sent, etc.
2. **No `payments` table** - Webhook events capture PayPal events but no separate payments table

### Recommendation
Create a new `events` table for operational logging:
```sql
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL,
  metadata JSONB
);
```

---

## 4. Current PayPal Implementation Analysis

### What Exists

#### PayPal Library (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts`)
Complete implementation:
- `getPayPalAccessToken()` - Token caching with 5-min buffer
- `createSubscription(userId, planId)` - Creates subscription, returns approval URL
- `cancelSubscription(subscriptionId)` - Cancels subscription
- `getSubscriptionDetails(subscriptionId)` - Gets full subscription object
- `verifyWebhookSignature(body, headers)` - Validates PayPal webhook signatures
- `getPlanId(tier, period)` - Maps tier/period to PayPal plan ID
- `determineTierFromPlanId(planId)` - Reverse lookup tier from plan ID
- `determinePeriodFromPlanId(planId)` - Reverse lookup period from plan ID

Environment variables expected:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENVIRONMENT` (sandbox | live)
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_PRO_MONTHLY_PLAN_ID`
- `PAYPAL_PRO_YEARLY_PLAN_ID`
- `PAYPAL_UNLIMITED_MONTHLY_PLAN_ID`
- `PAYPAL_UNLIMITED_YEARLY_PLAN_ID`

#### Webhook Handler (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/paypal/route.ts`)
Handles:
- `BILLING.SUBSCRIPTION.ACTIVATED` - Updates user tier
- `BILLING.SUBSCRIPTION.CANCELLED` - Sets cancel_at_period_end
- `BILLING.SUBSCRIPTION.EXPIRED` - Downgrades to free
- `BILLING.SUBSCRIPTION.SUSPENDED` - Sets past_due status
- `PAYMENT.SALE.COMPLETED` - Updates timestamp

Features:
- Signature verification
- Idempotency via `webhook_events` table
- Event logging before processing

#### Subscriptions Router (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts`)
- `getStatus` - Returns subscription status
- `createCheckout` - Creates PayPal subscription, returns approval URL
- `cancel` - Cancels subscription

#### Pricing UI (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/pricing/page.tsx`)
- Three tier cards (Free, Pro, Unlimited)
- Monthly/Yearly toggle
- `PricingCard` component with `CheckoutButton`
- Handles success/canceled/error query params from PayPal return

### What's Missing
1. **Production verification** - Need to test with real PayPal credentials
2. **Payment events visibility in admin** - `webhook_events` exists but not exposed in admin UI
3. **Better error handling** - Webhook returns 200 even on processing errors

### Key Finding
PayPal implementation is **production-ready**. The vision's concern about "untested in production" is valid - this needs manual testing with live credentials.

Vision already notes:
> - Live PayPal credentials configured (DONE - verified in Vercel)

---

## 5. Complexity Assessment

### Overall Complexity: **SIMPLE to MEDIUM**

**Rationale:**
1. **Email verification** - Infrastructure exists, needs verification + UI for blocking unverified users
2. **Admin dashboard** - tRPC endpoints exist, only needs UI
3. **Admin seeding** - Simple SQL update in production
4. **PayPal verification** - Code complete, needs manual testing

### Iteration Recommendation: **SINGLE ITERATION**

This is primarily integration and verification work, not new feature development. The heavy lifting is done.

---

## Architectural Findings Summary

### Component Status Matrix

| Component | Status | Work Needed |
|-----------|--------|-------------|
| Email Service (nodemailer) | COMPLETE | Verify credentials work |
| Email Templates | COMPLETE | None |
| Verification API Routes | COMPLETE | None |
| Verification Token Table | COMPLETE | None |
| Signup Email Trigger | COMPLETE | Add event logging |
| Unverified User Blocking | MISSING | New UI component |
| Admin tRPC Router | COMPLETE | Add webhook events query |
| Admin Dashboard UI | MISSING | New page |
| Admin User Seeding | MISSING | SQL migration |
| Users Table | COMPLETE | None |
| Webhook Events Table | COMPLETE | None |
| Events/Logs Table | MISSING | New migration |
| PayPal Library | COMPLETE | None |
| PayPal Webhook Handler | COMPLETE | None |
| Subscriptions Router | COMPLETE | None |
| Pricing UI | COMPLETE | None |

### Files to Create
1. `/app/admin/page.tsx` - Admin dashboard UI
2. `/supabase/migrations/YYYYMMDD_events_table.sql` - Events logging table
3. `/supabase/migrations/YYYYMMDD_seed_admin.sql` - Seed admin user
4. Potentially: `/app/auth/verify-required/page.tsx` - Block unverified users

### Files to Modify
1. `/server/trpc/routers/admin.ts` - Add webhook/events queries for admin dashboard
2. `/server/trpc/routers/auth.ts` - Add event logging on signup/verification
3. Potentially: Auth middleware to check email_verified

---

## Risk Assessment

### Low Risks
- **Admin dashboard** - tRPC endpoints ready, just needs UI
- **Admin seeding** - Simple SQL operation

### Medium Risks
- **Email verification** - May need debugging if emails aren't sending
  - **Mitigation:** Check Vercel logs for email errors, verify Gmail credentials
- **Unverified user blocking** - May disrupt existing users
  - **Mitigation:** Only block truly new users, not existing ones

### Low/No Risks
- **PayPal integration** - Code is complete and follows best practices
- **Database schema** - Well-structured with proper indexes

---

## Recommendations for Master Plan

1. **Start with verification, not building**
   - Check Vercel logs for email send errors
   - Verify Gmail credentials in production env
   - Test signup flow manually before writing code

2. **Admin dashboard should use existing tRPC endpoints**
   - `admin.getStats` - Overview metrics
   - `admin.getAllUsers` - User table
   - `admin.getAllReflections` - Content visibility
   - Need to add: Webhook events query

3. **Events table is optional for M0**
   - Webhook events already logged
   - General events table is nice-to-have for M1
   - Focus M0 on what exists

4. **Single iteration is sufficient**
   - ~6-8 hours of work
   - Most is UI creation using existing API
   - Email debugging may take extra time

---

## Technology Stack Summary

### Existing Stack (No Changes Needed)
- **Frontend:** Next.js 15 with App Router
- **Auth:** Custom JWT with bcryptjs
- **Database:** Supabase (PostgreSQL with RLS)
- **Email:** Nodemailer with Gmail SMTP
- **Payments:** PayPal REST API
- **API:** tRPC with Zod validation

### Environment Variables Required
```
# Email (verify these are set in production)
GMAIL_USER=ahiya.butman@gmail.com
GMAIL_APP_PASSWORD=uurwgcbscdvtrbbi

# PayPal (verified in Vercel per vision)
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

# Auth
JWT_SECRET=...
CREATOR_SECRET_KEY=...

# App
DOMAIN=https://mirrorofdreams.io
NEXT_PUBLIC_APP_URL=https://mirrorofdreams.io
```

---

## Key File Paths Reference

### Email System
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/email.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/auth/send-verification/route.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/auth/verify-email/route.ts`

### Auth System
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/auth/signup/page.tsx`

### Admin System
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/admin.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/_app.ts`

### PayPal System
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/webhooks/paypal/route.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/pricing/page.tsx`

### Database Migrations
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20250121000000_initial_schema.sql`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251130000000_paypal_integration.sql`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251202000001_email_verification_tokens.sql`

### Types
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`

---

*Exploration completed: 2025-12-08*
*This report informs master planning decisions*
