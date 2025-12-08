# Mirror of Dreams - Production Setup Guide

This document provides step-by-step instructions for setting up and verifying the production environment.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Admin User Seeding](#admin-user-seeding)
3. [Gmail SMTP Verification](#gmail-smtp-verification)
4. [PayPal Production Verification](#paypal-production-verification)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Environment Variables

### Required Variables for Production

Before deploying to production, ensure all of the following environment variables are set in Vercel:

#### Database (Supabase)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | Public anonymous key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (SECRET) | Supabase Dashboard > Settings > API |

#### Authentication

| Variable | Description | How to Get |
|----------|-------------|------------|
| `JWT_SECRET` | JWT signing secret | Generate: `openssl rand -base64 32` |

#### Email (Gmail SMTP)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `GMAIL_USER` | Gmail address | Your Gmail account |
| `GMAIL_APP_PASSWORD` | 16-character app password | Google Account > Security > App passwords |
| `NEXT_PUBLIC_APP_URL` | Production URL | e.g., `https://mirror-of-truth.com` |

#### Payments (PayPal)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `PAYPAL_CLIENT_ID` | PayPal client ID | PayPal Developer Dashboard |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | PayPal Developer Dashboard |
| `PAYPAL_WEBHOOK_ID` | Webhook ID for verification | PayPal Developer Dashboard > Webhooks |
| `PAYPAL_ENVIRONMENT` | `live` for production | Set to `live` |
| `PAYPAL_PRO_MONTHLY_PLAN_ID` | Pro monthly plan ID | Created via setup script |
| `PAYPAL_PRO_YEARLY_PLAN_ID` | Pro yearly plan ID | Created via setup script |
| `PAYPAL_UNLIMITED_MONTHLY_PLAN_ID` | Unlimited monthly plan ID | Created via setup script |
| `PAYPAL_UNLIMITED_YEARLY_PLAN_ID` | Unlimited yearly plan ID | Created via setup script |

#### AI (Anthropic)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `ANTHROPIC_API_KEY` | Claude API key | console.anthropic.com |

#### Redis (Upstash)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `UPSTASH_REDIS_REST_URL` | Redis REST URL | upstash.com dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token | upstash.com dashboard |

### Verifying Environment Variables

To check if variables are set correctly in Vercel:

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Verify each variable is present for the "Production" environment
3. Sensitive values will show as hidden - you can click "Show" to verify

---

## Admin User Seeding

### Prerequisites

1. The target admin user must sign up through the application first
2. You need access to Supabase Dashboard or CLI

### Option 1: Supabase Dashboard (Recommended)

1. Log into your Supabase project at https://supabase.com/dashboard
2. Select your production project
3. Navigate to **SQL Editor** in the left sidebar
4. Open the file `/scripts/seed-admin-production.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run**
8. Check the "Messages" tab for results

Expected output:
```
ADMIN SEEDING COMPLETE
Status: UPDATED (or NO CHANGES NEEDED)
User: ahiya.butman@gmail.com
```

### Option 2: Supabase CLI

```bash
# Link to your production project (first time only)
supabase link --project-ref <your-project-ref>

# Run the seeding script
supabase db execute --file scripts/seed-admin-production.sql
```

### Verification

After running the script, verify in Supabase Dashboard:

1. Go to **Table Editor** > **users**
2. Find the user `ahiya.butman@gmail.com`
3. Verify these fields:
   - `is_admin`: true
   - `is_creator`: true
   - `tier`: unlimited
   - `email_verified`: true
   - `subscription_status`: active

---

## Gmail SMTP Verification

### Checking Email Functionality

#### Step 1: Sign Up Test

1. Go to production site and sign up with a test email
2. Check the email inbox (and spam folder) for verification email
3. Click the verification link
4. Verify redirect to success page

#### Step 2: Check Vercel Function Logs

1. Go to Vercel Dashboard > Your Project > Logs
2. Filter by "Functions"
3. Look for logs from `/api/auth/send-verification`
4. Check for success or error messages

Expected success log:
```
Email sent successfully to: test@example.com
```

Possible error logs:
```
Failed to send email: Invalid login
Failed to send email: SMTP connection failed
```

#### Step 3: Troubleshooting Email Issues

If emails are not sending:

1. **Verify Gmail App Password**
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Generate a new app password if needed
   - Update `GMAIL_APP_PASSWORD` in Vercel

2. **Check Gmail Settings**
   - Ensure 2-Step Verification is enabled
   - Ensure "Less secure app access" is NOT your method (use App Passwords)

3. **Check Spam Folder**
   - Gmail-sent emails may land in spam for new senders
   - Ask users to check spam and mark as "Not Spam"

4. **SMTP Connection Test**
   ```javascript
   // You can test locally with:
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.GMAIL_USER,
       pass: process.env.GMAIL_APP_PASSWORD,
     },
   });
   await transporter.verify(); // Should resolve if connection works
   ```

---

## PayPal Production Verification

### Step 1: Verify Webhook Configuration

1. Go to https://developer.paypal.com/dashboard/applications/live
2. Select your production application
3. Scroll to "Webhooks" section
4. Verify webhook URL is: `https://mirror-of-truth.com/api/webhooks/paypal`
5. Verify these events are subscribed:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `PAYMENT.SALE.COMPLETED`

6. Copy the **Webhook ID** and ensure it matches `PAYPAL_WEBHOOK_ID` env var

### Step 2: Test Subscription Flow

**IMPORTANT:** This will create a REAL charge on a REAL PayPal account.

1. Log into production with a test user (not admin)
2. Navigate to `/pricing`
3. Select a plan (recommend Pro Monthly for testing - $15)
4. Click the PayPal button
5. Complete payment with a real PayPal account
6. Wait for redirect back to the application

### Step 3: Verify Webhook Received

**Option A: Check Vercel Logs**

1. Go to Vercel Dashboard > Logs
2. Filter by path: `/api/webhooks/paypal`
3. Look for recent POST requests
4. Check for success log:
   ```
   PayPal webhook processed: BILLING.SUBSCRIPTION.ACTIVATED
   User tier updated to: pro
   ```

**Option B: Check Database**

1. Go to Supabase Dashboard > Table Editor > `webhook_events`
2. Look for recent entries
3. Verify `event_type` shows `BILLING.SUBSCRIPTION.ACTIVATED`
4. Verify `user_id` matches the test user

**Option C: Admin Dashboard**

1. Sign in as admin (ahiya.butman@gmail.com)
2. Navigate to `/admin`
3. Check "Recent Webhook Events" table
4. Verify the subscription activation event appears

### Step 4: Verify Tier Update

1. Go to Supabase Dashboard > Table Editor > `users`
2. Find the test user by email
3. Verify these fields updated:
   - `tier`: `pro` (or `unlimited` depending on plan)
   - `subscription_status`: `active`
   - `paypal_subscription_id`: Should have a value
   - `subscription_started_at`: Should have today's date

### Step 5: Verify User Experience

1. Sign in as the test user
2. Navigate to `/dashboard`
3. Verify the tier badge shows correctly
4. Verify reflection limits are updated

---

## Post-Deployment Checklist

### Pre-Deployment

- [ ] All code changes committed and pushed
- [ ] All environment variables set in Vercel
- [ ] Admin seeding SQL script ready

### Deployment

- [ ] Push to main branch
- [ ] Verify Vercel deployment succeeds (no build errors)
- [ ] Run admin seeding SQL in Supabase

### Post-Deployment Verification

- [ ] Production site loads correctly
- [ ] Admin user can sign in
- [ ] Admin dashboard (`/admin`) loads
- [ ] Stats display correctly
- [ ] Users table populates
- [ ] New user signup sends verification email
- [ ] Email verification flow works
- [ ] PayPal button appears on pricing page
- [ ] (Optional) Test PayPal subscription works

### First User Test

- [ ] Sign up new user
- [ ] Receive verification email (check spam)
- [ ] Click verification link
- [ ] Access dashboard after verification
- [ ] Verify `/auth/verify-required` blocks unverified users
- [ ] Verify admin bypass works (admins skip verification)

---

## Rollback Procedures

### If Email Verification Breaks

**Symptom:** Users cannot access the app after signup

**Quick Fix (Temporary):**
```typescript
// In /hooks/useAuth.ts, change line ~99 to:
emailVerified: true, // TEMPORARY: Bypass verification
```

**Proper Fix:**
1. Check Vercel logs for email sending errors
2. Verify Gmail credentials are correct
3. Redeploy with fixed credentials

### If Admin Dashboard Errors

**Symptom:** `/admin` page shows errors or doesn't load

**Quick Fix:**
1. Check browser console for specific error
2. Check Vercel function logs for tRPC errors
3. If persistent, disable route temporarily

**Database Fix (if needed):**
```sql
-- Ensure admin user has correct permissions
UPDATE public.users
SET is_admin = true, is_creator = true
WHERE email = 'ahiya.butman@gmail.com';
```

### If PayPal Webhook Fails

**Symptom:** Payments complete but tiers don't update

**Manual Tier Update:**
```sql
-- Find the user
SELECT id, email, tier, paypal_subscription_id FROM public.users WHERE email = 'user@example.com';

-- Manually update tier
UPDATE public.users
SET
  tier = 'pro',  -- or 'unlimited'
  subscription_status = 'active',
  subscription_started_at = NOW()
WHERE email = 'user@example.com';
```

**Check Webhook Configuration:**
1. Go to PayPal Developer Dashboard
2. Check webhook delivery logs
3. Verify webhook URL is correct
4. Verify `PAYPAL_WEBHOOK_ID` matches

### Full Rollback

If critical issues require complete rollback:

1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find the previous successful deployment
4. Click the three dots menu
5. Select "Promote to Production"

---

## Troubleshooting

### Common Issues

#### "User not found" during admin seeding

**Cause:** The user hasn't signed up yet

**Solution:**
1. Have the user sign up through the application
2. Run the seeding script again

#### Email goes to spam

**Cause:** Gmail reputation for new senders

**Solutions:**
1. Add clear "check spam" instructions on verification page
2. Ask users to mark email as "Not Spam"
3. Long-term: Set up SPF/DKIM records for custom domain

#### PayPal button doesn't appear

**Cause:** Missing or incorrect PayPal environment variables

**Solution:**
1. Verify all `PAYPAL_*` env vars are set
2. Verify `PAYPAL_ENVIRONMENT` is set to `live`
3. Check browser console for PayPal SDK errors

#### tRPC errors on admin page

**Cause:** Authorization issues or database connection problems

**Debug Steps:**
1. Check if user has `is_admin: true` in database
2. Check Vercel function logs for specific errors
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

#### Webhook events not appearing in database

**Cause:** Webhook verification failing or database insert error

**Debug Steps:**
1. Check Vercel logs for `/api/webhooks/paypal`
2. Verify `PAYPAL_WEBHOOK_ID` matches PayPal Dashboard
3. Check if `webhook_events` table exists

### Getting Help

1. **Vercel Logs:** First place to check for function errors
2. **Supabase Logs:** Database query errors and RLS issues
3. **PayPal Webhook Logs:** Payment processing issues
4. **Browser Console:** Frontend JavaScript errors

---

## Reference: File Locations

| Purpose | File |
|---------|------|
| Admin seeding script | `/scripts/seed-admin-production.sql` |
| PayPal setup script | `/scripts/setup-paypal-production.sh` |
| Environment template | `/.env.example` |
| Email configuration | `/server/lib/email.ts` |
| PayPal webhook handler | `/app/api/webhooks/paypal/route.ts` |
| Admin router | `/server/trpc/routers/admin.ts` |
| Auth hook | `/hooks/useAuth.ts` |
