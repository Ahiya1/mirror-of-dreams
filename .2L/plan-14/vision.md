# Project Vision: Production Readiness - First User Battle Testing

**Created:** 2025-12-08
**Plan:** plan-14

---

## Problem Statement

Mirror of Dreams is feature-complete but lacks production-ready infrastructure for real users. Before the first user (you) can battle-test the product, four critical systems must work flawlessly:

1. Email confirmation doesn't trigger on signup
2. No admin user exists in production
3. No admin dashboard for operational visibility
4. PayPal integration untested in production

**Current pain points:**
- Users sign up but don't receive confirmation emails
- No way to manage or monitor production usage
- PayPal payments may fail silently without visibility
- No admin access for troubleshooting

---

## Target Users

**Primary user:** You (Ahiya) as first user and admin
- Battle-testing the product end-to-end
- Monitoring early adoption metrics
- Managing subscriptions and payments

**Secondary users:** Early adopters
- First real users after your validation
- Need reliable signup flow
- Need working payment processing

---

## Core Value Proposition

Establish a minimal but solid production baseline so Mirror of Dreams can be used by real people with confidence that core flows work.

**Key benefits:**
1. Every signup triggers a real confirmation email
2. Admin has full visibility into users, content, and payments
3. Payments work end-to-end with proper webhook handling
4. Operational issues are detectable and debuggable

---

## Technical Context

**Stack:**
- Frontend: Next.js with Supabase Auth
- Backend: Supabase (auth, database, RLS, Edge Functions)
- Email: Gmail SMTP via nodemailer
- Payments: PayPal (live credentials configured in Vercel)

**Credentials Available:**
- Gmail: `ahiya.butman@gmail.com` with App Password `uurwgcbscdvtrbbi`
- PayPal: Live credentials in Vercel production env
  - Client ID: `AYi3--5aZaMtxU36QcQgqzvyzN13xQv-N9HLGJWDDCsAki6gAXsr2HOxiLhZJXRVgeF9Mmu_vE-UgkEZ`
  - Webhook ID: `16432009BD778541B`
  - Environment: `live`
- Supabase: Production project accessible via Supabase CLI

---

## Feature Breakdown

### Must-Have (M0 - First User Ready)

#### 1. Email Confirmation via Gmail SMTP

**Description:** Every new signup receives a confirmation email via Gmail SMTP. User cannot access app until confirmed.

**User story:** As a new user, I want to receive a confirmation email so that I can verify my account and start using Mirror of Dreams.

**Technical approach:**
- Use nodemailer with Gmail SMTP (credentials already in env)
- Either configure Supabase Auth to use custom SMTP, OR
- Implement custom verification flow with `/api/verify-email` endpoint

**Acceptance criteria:**
- [ ] On signup, confirmation email is sent within 30 seconds
- [ ] Email contains branded "Confirm your account" button with secure link
- [ ] Clicking link confirms email and redirects to app
- [ ] Unconfirmed users see blocking screen with "Resend" option
- [ ] Email sending logged (user_id, email, timestamp, status)
- [ ] Failed sends show clear error message to user

**Email content:**
- Subject: `Confirm your Mirror of Dreams account`
- From: `Mirror of Dreams <ahiya.butman@gmail.com>`
- Simple HTML with product name, greeting, confirm button, fallback text link

#### 2. Admin User in Production

**Description:** Seed `ahiya.butman@gmail.com` as admin with highest tier in production Supabase.

**User story:** As the product owner, I want admin access in production so I can manage and monitor the system.

**Technical approach:**
- Use Supabase CLI to connect to production project
- Create idempotent seed script/migration
- Set role=admin and plan=founder (or highest tier)

**Acceptance criteria:**
- [ ] User exists with email `ahiya.butman@gmail.com`
- [ ] User metadata: `role = 'admin'`
- [ ] User tier: highest plan (founder/infinite)
- [ ] Email marked as confirmed
- [ ] Script is idempotent (safe to run multiple times)

#### 3. Minimal Admin Dashboard

**Description:** `/admin` route with essential metrics for day-one operations.

**User story:** As an admin, I want to see key metrics so I can monitor product health.

**Access control:**
- Client: Redirect non-admins to home or 404
- Server: All admin API endpoints validate `role = 'admin'`

**M0 Scope (minimal):**
- Total users count
- Your user record, tier, and latest payment
- Last 10 users with email, signup date, plan
- Last 5 payment events

**Acceptance criteria:**
- [ ] `/admin` route exists and loads fast
- [ ] Non-admins cannot access (redirect or 404)
- [ ] Shows total user count
- [ ] Shows admin's own record
- [ ] Shows recent users table
- [ ] Shows recent payments table

#### 4. PayPal Production Verification

**Description:** Prove PayPal integration works end-to-end in production.

**User story:** As the product owner, I want to verify payments work before inviting users.

**Test flow:**
1. You subscribe to a tier on production site
2. Pay via PayPal (your own account, no credit card sharing needed)
3. Webhook is received and processed
4. Your tier is updated in Supabase
5. Payment visible in `/admin`

**Acceptance criteria:**
- [ ] Live PayPal credentials configured (DONE - verified in Vercel)
- [ ] Webhook handler validates signature
- [ ] Successful subscription creates/updates record in Supabase
- [ ] Payment event logged and visible in admin
- [ ] Tier change reflected in user's account

---

### Should-Have (M1 - Early Adopters Ready)

#### 5. Full Admin Dashboard

**Description:** Comprehensive metrics for ongoing operations.

**Sections:**

**Overview cards:**
- Total users
- Active users (last 7 days)
- Total reflections
- Total revenue (lifetime)
- MRR estimate

**Users & Content:**
- Table: last 20 users with email, signup date, plan, last active, status
- Filters by plan and date range
- Total reflections per user
- Average reflections per active user

**Payments & System Health:**
- Table: last 20 payment events (timestamp, email, amount, type, status)
- Total revenue this month
- Active paying users count
- Latest error events (last 20)
- Health indicators: last webhook received, last email sent

**Backend endpoints:**
- `/api/admin/overview`
- `/api/admin/users`
- `/api/admin/payments`
- `/api/admin/events`

**Acceptance criteria:**
- [ ] All overview metrics display accurately
- [ ] User table paginated with filters
- [ ] Payment table shows all PayPal events
- [ ] Error logging captures auth, payment, reflection failures
- [ ] Health indicators show recent activity timestamps

#### 6. Event Logging System

**Description:** Centralized logging for operational debugging.

**Events to log:**
- `user_signed_up`
- `email_confirmation_sent`
- `email_confirmation_failed`
- `paypal_webhook_received`
- `subscription_updated`
- `reflection_created`

**Schema:**
- `id` (uuid)
- `timestamp` (timestamptz)
- `user_id` (uuid, nullable)
- `type` (text)
- `metadata` (jsonb)

**Acceptance criteria:**
- [ ] Events table exists in Supabase
- [ ] All listed events are logged with metadata
- [ ] Events visible in admin dashboard

#### 7. PayPal Failure Handling

**Description:** Graceful handling of payment failures.

**Acceptance criteria:**
- [ ] Failed webhooks logged with error details
- [ ] Subscription cancellations update user tier
- [ ] Failed payments don't break user experience
- [ ] Admin can see failed payment events

---

### Could-Have (Future)

- More admins management
- User impersonation for debugging
- Revenue graphs and trends
- Automated alerts on failures
- Backup restore documentation

---

## User Flows

### Flow 1: New User Signup

**Steps:**
1. User enters email and password
2. Supabase creates user record
3. System sends confirmation email via Gmail SMTP
4. User clicks confirm link in email
5. Email is marked confirmed in Supabase
6. User redirected to main app

**Edge cases:**
- Email already exists: Show "Email already registered" message
- Invalid email format: Prevent submission
- SMTP failure: Show error, offer retry

**Error handling:**
- Email send fails: User sees "Couldn't send email. Please try again."
- Link expired: Show "Link expired. Request new confirmation."

### Flow 2: Admin Views Dashboard

**Steps:**
1. Admin navigates to `/admin`
2. Server validates role = admin
3. Dashboard loads with metrics
4. Admin can view users, payments, events

**Edge cases:**
- Non-admin access: Redirect to home
- API error: Show error state with retry

### Flow 3: PayPal Subscription

**Steps:**
1. User clicks subscribe on pricing page
2. Redirected to PayPal checkout
3. User completes payment in PayPal
4. PayPal sends webhook to app
5. Webhook handler updates subscription in Supabase
6. User tier updated, redirected to app
7. Event logged, visible in admin

**Edge cases:**
- User cancels at PayPal: Return to pricing page
- Webhook fails: Log error, manual intervention needed

---

## Data Model Overview

**Key entities:**

1. **users** (Supabase auth.users + profiles)
   - email, role, plan/tier, email_confirmed_at
   - Relationships: has many reflections, subscriptions

2. **subscriptions** (or equivalent)
   - user_id, paypal_subscription_id, plan, status, created_at
   - Relationships: belongs to user

3. **events** (new table)
   - id, timestamp, user_id, type, metadata
   - For operational logging

4. **payments** (or webhook_events)
   - For PayPal webhook logging

---

## Success Criteria

**The MVP is successful when:**

1. **Email confirmation works**
   - Metric: New signups receive email within 30 seconds
   - Target: 100% of signups trigger email

2. **Admin access established**
   - Metric: ahiya.butman@gmail.com can access /admin
   - Target: Full admin privileges in production

3. **Admin dashboard functional**
   - Metric: Dashboard loads with real data
   - Target: All M0 metrics display correctly

4. **PayPal verified end-to-end**
   - Metric: Real payment processed and visible
   - Target: At least 1 successful production transaction

---

## Out of Scope

**Explicitly not included in this plan:**
- Multiple admin user management
- Advanced analytics/graphs
- Automated alerting
- User impersonation
- Detailed backup/restore procedures
- Email template customization beyond basic styling

**Why:** Focus is on minimal viable production baseline for first-user testing.

---

## Assumptions

1. Gmail SMTP credentials work for production volume (low volume expected initially)
2. Supabase CLI can connect to production project
3. PayPal live credentials are correctly configured
4. Existing auth flow can be extended for email confirmation
5. RLS policies allow admin queries

---

## Open Questions

1. Does Supabase Auth already have email confirmation flow we can enable, or need custom implementation?
2. What's the current schema for subscriptions/payments - need to verify table names?
3. Is there an existing events/logs table or need to create one?

---

## Definition of Done

Mirror of Dreams is ready for first-user battle testing when:

- [ ] New user signs up, receives confirmation email via Gmail SMTP, confirms, enters app
- [ ] `ahiya.butman@gmail.com` is admin with highest tier in production Supabase
- [ ] `/admin` shows: total users, user list with plans, payment events
- [ ] Real PayPal transaction executed and visible in admin
- [ ] All core flows logged to events table

---

## Milestones

### M0 - First User Ready (This Plan)
- Email confirmation working
- Admin user seeded
- Minimal admin view
- One real PayPal payment validated

### M1 - Early Adopters Ready (Future Plan)
- Full admin dashboard
- Error logging
- PayPal failure handling
- Operational guardrails

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
