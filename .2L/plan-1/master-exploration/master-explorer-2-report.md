# Master Explorer 2 Report: Dependencies & Risk Assessment

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
Mirror of Dreams is a reflection-based personal development platform transforming life goals into achievable reality through AI-powered reflection with Claude Sonnet 4.5, featuring a freemium SaaS model (Free/Essential/Optimal/Premium tiers) with Supabase backend, PayPal subscriptions, and tiered AI context quality.

---

## Executive Summary

**Dependency Landscape:** The platform requires 4 critical external services (Supabase, Claude AI, PayPal, Email) with existing partial implementation. Current codebase has foundational auth and payment infrastructure but requires significant expansion to match vision scope.

**Risk Profile:** MEDIUM-HIGH. Primary risks include AI cost management ($0.04-$0.35 per operation), PayPal integration complexity with webhook reliability, data migration from existing schema to vision schema (missing dreams table, evolution reports structure differs), and scope expansion from current single-reflection model to multi-dream management.

**Critical Path:** Database schema migration → Dreams architecture → Reflection system refactor → Evolution reports → PayPal subscription flow → Admin dashboard

---

## External Dependencies

### Dependency 1: Supabase (PostgreSQL + Auth + Storage)
- **Type:** Backend-as-a-Service (Database, Authentication, Real-time, Storage)
- **Criticality:** CRITICAL
- **Risk Level:** MEDIUM
- **Current Status:** PARTIALLY IMPLEMENTED - Basic schema exists, needs significant expansion
- **Mitigation Strategy:**

**Existing Implementation:**
- Users table with basic subscription fields (tier: free/essential/premium)
- Reflections table with AI response storage
- Basic RLS policies in place
- Auth flow implemented in `/api/auth.js`

**Required Expansion:**
- Add `dreams` table (first-class entity for dream management)
- Add `visualizations` table (separate from evolution reports)
- Add `share_images` table (temporary storage for downloads)
- Add `monthly_usage_tracking` table (separate from users table)
- Add `api_usage_log` table (cost tracking)
- Add `user_feedback` table (quality metrics)
- Add `revenue_log` table (PayPal payment tracking)
- Migrate tier enum: Add 'optimal' tier (currently missing)
- Update RLS policies for new tables
- Add temporal distribution logic for context selection

**Migration Risk:**
- **Impact:** HIGH - Existing users and reflections must be preserved
- **Mitigation:**
  - Create migration script to add new tables without dropping existing data
  - Update existing reflections to reference first dream (auto-create from existing data)
  - Backfill monthly usage from existing reflection counts
  - Test migration on local instance before production

**Connection Reliability:**
- **Risk:** LOW - Supabase has 99.9% uptime SLA
- **Mitigation:** Implement connection pooling, retry logic, and graceful degradation

---

### Dependency 2: Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Type:** AI Model API
- **Criticality:** CRITICAL
- **Risk Level:** HIGH
- **Current Status:** IMPLEMENTED - Basic integration exists
- **Mitigation Strategy:**

**Cost Structure (March 2025 pricing):**
- Input: $3 per million tokens
- Output: $15 per million tokens
- Thinking (extended): $15 per million tokens (same as output)

**Estimated Costs Per Operation:**
- **Reflection (Free tier):** ~$0.04 (1,200 input + 850 output, no thinking)
- **Reflection (Optimal/Premium):** ~$0.06 (1,200 input + 850 output + 1,800 thinking)
- **Evolution Report (Free):** ~$0.18 (2,000 input + 1,500 output, 4 reflections context)
- **Evolution Report (Optimal):** ~$0.23 (3,500 input + 2,200 output + 1,800 thinking, 9 reflections)
- **Evolution Report (Premium):** ~$0.35 (5,000 input + 2,800 output + 2,500 thinking, 12 reflections)
- **Visualization:** ~$0.15-$0.30 (similar to evolution reports)

**Monthly Cost Projections (100 active users scenario):**

| Scenario | Free Users | Paid Users | Total Reflections | Evolution Reports | Visualizations | Monthly API Cost | MRR | Profit Margin |
|----------|-----------|------------|-------------------|-------------------|----------------|------------------|-----|---------------|
| Conservative | 50 | 50 (25 Essential, 20 Optimal, 5 Premium) | 450 | 50 | 25 | $487 | $2,340 | 79% |
| Aggressive | 30 | 70 (20 Essential, 35 Optimal, 15 Premium) | 850 | 120 | 60 | $892 | $3,590 | 75% |
| Power Users | 20 | 80 (10 Essential, 50 Optimal, 20 Premium) | 1,200 | 180 | 90 | $1,284 | $4,340 | 70% |

**Risk Factors:**
1. **Cost Spikes:** Premium users generating many evolution reports could spike costs
   - **Mitigation:** Enforce monthly limits strictly (6 dream-specific, 3 cross-dream for Optimal)
   - **Monitoring:** Admin dashboard tracks daily API costs with alert at $50/day threshold

2. **Rate Limits:** Anthropic API has rate limits (not publicly documented but exist)
   - **Mitigation:** Implement exponential backoff, queue system for non-urgent operations
   - **Plan B:** Cache common prompts, implement request throttling at app level

3. **API Reliability:** External service outage would break core functionality
   - **Mitigation:**
     - Implement retry logic (3 attempts with exponential backoff)
     - Show graceful error messages to users
     - Log failed attempts for later retry
     - Consider fallback to cheaper model (Claude Haiku) if Sonnet unavailable

4. **Model Updates:** Claude model changes could affect output quality
   - **Mitigation:**
     - Pin to specific model version (`claude-sonnet-4-5-20250929`)
     - Test new models before switching
     - Store model version in database for traceability

**Existing Implementation Gaps:**
- No cost tracking table (needs `api_usage_log`)
- No extended thinking implementation (vision requires this for Optimal/Premium)
- No temporal context distribution algorithm (vision's key innovation)
- No retry logic for failed API calls

---

### Dependency 3: PayPal Subscriptions API
- **Type:** Payment Processing / Subscription Management
- **Criticality:** CRITICAL (for revenue)
- **Risk Level:** HIGH
- **Current Status:** PARTIALLY IMPLEMENTED - Basic Stripe integration exists, needs PayPal migration
- **Mitigation Strategy:**

**Current State:**
- Existing code uses Stripe (`/api/payment.js`)
- Vision requires PayPal Subscriptions
- **Migration Required:** Replace Stripe with PayPal or support both

**PayPal Integration Requirements:**
1. **Subscription Plans:** Pre-create 3 plans in PayPal dashboard
   - Essential: $9/month (plan ID stored in env)
   - Optimal: $19/month (plan ID stored in env)
   - Premium: $39/month (plan ID stored in env)

2. **Subscription Flow:**
   - User clicks "Upgrade to [Tier]"
   - Backend creates PayPal subscription via API
   - Returns approval URL
   - User approves on PayPal site
   - PayPal redirects back with token
   - Backend captures subscription details
   - Webhook confirms activation

3. **Webhook Events to Handle:**
   - `BILLING.SUBSCRIPTION.CREATED` - Initial subscription
   - `BILLING.SUBSCRIPTION.ACTIVATED` - First payment success
   - `PAYMENT.SALE.COMPLETED` - Monthly recurring payment
   - `BILLING.SUBSCRIPTION.CANCELLED` - User cancels
   - `BILLING.SUBSCRIPTION.SUSPENDED` - Payment failure

**Risk Factors:**

1. **Webhook Reliability:** PayPal webhooks can fail or arrive out of order
   - **Impact:** HIGH - User pays but doesn't get access, or loses access despite paying
   - **Mitigation:**
     - Implement idempotency (check if event already processed)
     - Log all webhook events to database for debugging
     - Manual reconciliation tool in admin dashboard
     - Poll PayPal API daily to verify subscription status matches database
     - Send admin alerts for subscription status mismatches

2. **Payment Failures:** Credit card declines, insufficient funds
   - **Impact:** MEDIUM - User loses access, potential churn
   - **Mitigation:**
     - Grace period (3 days) before downgrading tier
     - Email notification before downgrade
     - Clear messaging about payment retry schedule

3. **Refunds & Chargebacks:** Users dispute charges
   - **Impact:** MEDIUM - Lost revenue, account abuse
   - **Mitigation:**
     - Clear refund policy (pro-rata for current month)
     - Track refund requests in database
     - Implement abuse detection (multiple refunds from same user)

4. **Currency & International Payments:** Vision targets US/UK/Canada/Australia
   - **Impact:** MEDIUM - PayPal handles currency conversion but fees vary
   - **Mitigation:**
     - Start with USD only, expand to GBP/CAD/AUD post-MVP
     - Display prices in local currency using exchange rates
     - Document international fees clearly

5. **Compliance & Regulations:** PCI-DSS, GDPR, local tax laws
   - **Impact:** HIGH - Legal liability
   - **Mitigation:**
     - PayPal handles PCI compliance (we never touch card details)
     - Store only PayPal subscription IDs, not payment methods
     - Implement GDPR-compliant data export/deletion
     - Consult with accountant for tax obligations

**Implementation Gaps:**
- No PayPal SDK installed (vision requires, current uses Stripe)
- No webhook signature verification for PayPal
- No revenue_log table for payment tracking
- No subscription_cancelled_at field in users table
- No grace period logic for failed payments

---

### Dependency 4: Email Service (Gmail / Nodemailer)
- **Type:** Transactional Email
- **Criticality:** MEDIUM (for notifications)
- **Risk Level:** LOW
- **Current Status:** IMPLEMENTED - Gmail with Nodemailer configured
- **Mitigation Strategy:**

**Current Implementation:**
- Gmail SMTP via Nodemailer
- Used for receipts, notifications

**Use Cases in Vision:**
- Welcome email (optional)
- Subscription confirmation
- Payment receipts
- Limit warnings (approaching monthly cap)
- Subscription expiry notices
- Reflection reminders (optional, not in MVP)

**Risk Factors:**

1. **Gmail Rate Limits:** 500 emails/day for free Gmail, 2,000/day for Google Workspace
   - **Impact:** LOW (100 users = ~10-20 emails/day)
   - **Mitigation:**
     - Monitor daily send count
     - Upgrade to Google Workspace if approaching limits
     - Implement email queue to throttle sends

2. **Spam Filters:** Transactional emails marked as spam
   - **Impact:** MEDIUM - Users miss important notifications
   - **Mitigation:**
     - Use proper SPF/DKIM/DMARC records
     - Keep emails transactional (no marketing)
     - Include unsubscribe links (optional notifications only)
     - Monitor bounce rates

3. **Service Reliability:** Gmail outages
   - **Impact:** LOW - Emails delayed but not lost
   - **Mitigation:**
     - Retry failed sends (3 attempts over 24 hours)
     - Log all email attempts for debugging
     - Admin dashboard shows recent email status

**Recommendation:**
- MVP: Keep Gmail (simple, low cost)
- Post-MVP: Consider Resend or SendGrid for better deliverability and analytics

---

### Dependency 5: Vercel (Hosting + Edge Functions)
- **Type:** Infrastructure / Deployment Platform
- **Criticality:** CRITICAL
- **Risk Level:** LOW
- **Current Status:** CONFIGURED (package.json has Vercel scripts)
- **Mitigation Strategy:**

**Why Vercel:**
- Next.js optimized
- Serverless functions for API routes
- Edge functions for low latency
- Blob storage for share images
- Built-in CI/CD from GitHub

**Risk Factors:**

1. **Cold Starts:** Serverless functions can be slow on first request
   - **Impact:** MEDIUM - User experiences delay
   - **Mitigation:**
     - Keep functions warm with periodic pings
     - Optimize bundle size (tree-shaking, code splitting)
     - Cache heavy dependencies

2. **Execution Timeouts:** Vercel serverless functions timeout at 10s (Hobby), 60s (Pro)
   - **Impact:** MEDIUM - Long-running AI operations might timeout
   - **Mitigation:**
     - Premium evolution reports (12 reflections) may need streaming
     - Implement streaming response for long operations
     - Upgrade to Pro plan ($20/month) for 60s timeout

3. **Bandwidth Limits:** Vercel Hobby: 100GB/month, Pro: 1TB/month
   - **Impact:** LOW (text-heavy app, minimal bandwidth)
   - **Mitigation:** Monitor usage, upgrade if needed

4. **Cost Scaling:** Pro plan ($20/month) + overages
   - **Impact:** MEDIUM - Need to factor into pricing
   - **Mitigation:**
     - Start on Hobby tier
     - Upgrade to Pro once MRR > $500
     - Monitor overage charges

**Alternative:** Self-hosted on AWS/DigitalOcean (more work, less vendor lock-in)

---

### Dependency 6: Vercel Blob Storage (Share Images)
- **Type:** Temporary File Storage
- **Criticality:** LOW (feature-specific)
- **Risk Level:** LOW
- **Current Status:** NOT IMPLEMENTED
- **Mitigation Strategy:**

**Use Case:**
- Store generated share images (1080x1080 PNG)
- 24-hour expiration
- Users download, we delete

**Cost:**
- Vercel Blob: $0.15/GB storage, $0.20/GB egress
- Estimate: 100 images/day × 500KB × 30 days = 1.5GB storage = $0.23/month
- Egress: 100 downloads/day × 500KB × 30 days = 1.5GB = $0.30/month
- **Total:** ~$0.50/month (negligible)

**Risk Factors:**

1. **Storage Cleanup:** Expired images not deleted
   - **Impact:** LOW - Storage costs increase
   - **Mitigation:**
     - Daily cron job to delete expired records
     - Vercel Blob TTL feature (auto-delete after 24h)

2. **Abuse:** User generates thousands of images
   - **Impact:** LOW - Only downloads, not stored long-term
   - **Mitigation:**
     - No limits on share image generation (encourage sharing!)
     - Monitor if single user generates >100/day, investigate

**Alternative:** Store in Supabase Storage (already paying for it)

---

## Feature Dependency Chains

### Critical Path: Core Reflection Flow

```
Authentication (WHO)
  ↓
Dreams Management (WHERE)
  ↓
5-Question Reflection (WHAT)
  ↓
AI Generation (HOW - Claude API)
  ↓
Usage Tracking (WHAT - Limits)
  ↓
Evolution Reports (After 4 reflections)
  ↓
Visualizations (After 4 reflections)
```

**Dependency Analysis:**

1. **Foundation Layer (Must Build First):**
   - Database schema migration (add dreams table)
   - Auth system expansion (token refresh, email verification)
   - Tier limits configuration (add Optimal tier)
   - WHO/WHERE/WHAT/HOW pattern implementation

2. **Core Layer (Depends on Foundation):**
   - Dreams CRUD operations
     - **Dependency:** Users table, tier limits
     - **Blocker:** Can't reflect without dreams

   - Reflection system refactor
     - **Dependency:** Dreams table, Claude API integration
     - **Blocker:** Current system doesn't link to dreams

   - Usage tracking
     - **Dependency:** Monthly usage table, tier limits
     - **Blocker:** Can't enforce limits without tracking

3. **Advanced Layer (Depends on Core):**
   - Evolution reports
     - **Dependency:** ≥4 reflections per dream, temporal distribution algorithm
     - **Blocker:** Needs reflection history

   - Visualizations
     - **Dependency:** Same as evolution reports
     - **Blocker:** Same threshold as evolution

   - Share images
     - **Dependency:** Evolution/visualization content, image generation library (canvas/sharp)
     - **Blocker:** Needs content to visualize

4. **Monetization Layer (Parallel to Advanced):**
   - PayPal subscription flow
     - **Dependency:** Tier system, user management
     - **Can build in parallel:** Doesn't block core features

   - Admin dashboard
     - **Dependency:** API usage log, revenue log, feedback table
     - **Can build in parallel:** Admin-only, not user-facing

### Cross-Feature Dependencies

```
Feature: Evolution Reports
├── DEPENDS ON:
│   ├── Reflections (minimum 4 for dream-specific)
│   ├── Dreams (to group reflections)
│   ├── Tier system (context quality varies by tier)
│   ├── Claude API (AI generation)
│   └── Usage limits (monthly caps per tier)
├── BLOCKS:
│   ├── Cross-dream analysis (needs evolution reports)
│   └── Pattern detection themes (feeds back to dashboard)
└── PARALLEL OPPORTUNITIES:
    └── Can build while users create reflections

Feature: PayPal Subscriptions
├── DEPENDS ON:
│   ├── User authentication
│   ├── Tier system
│   ├── Email service (receipts)
│   └── Revenue tracking (database table)
├── BLOCKS:
│   ├── Tier upgrades (users stuck on Free)
│   └── Revenue generation (no income until built)
└── PARALLEL OPPORTUNITIES:
    └── Can build independently of reflection features

Feature: Admin Dashboard
├── DEPENDS ON:
│   ├── API usage log (cost tracking)
│   ├── Revenue log (payment tracking)
│   ├── User feedback (quality metrics)
│   └── All features operational (data to aggregate)
├── BLOCKS:
│   └── Nothing (admin-only)
└── PARALLEL OPPORTUNITIES:
    └── Build incrementally as features launch

Feature: Share Images
├── DEPENDS ON:
│   ├── Evolution reports / Visualizations (content source)
│   ├── Image generation library (canvas/sharp)
│   └── Temporary storage (Vercel Blob or Supabase)
├── BLOCKS:
│   └── Nothing (optional feature)
└── PARALLEL OPPORTUNITIES:
    └── Build after evolution reports exist
```

---

## Risk Assessment

### High-Risk Areas

#### 1. Database Schema Migration (Existing → Vision)
- **Risk Level:** HIGH
- **Impact:** Data loss, downtime, user disruption
- **Probability:** MEDIUM (complex migration with user data)

**Current State vs. Vision Mismatches:**
- Missing `dreams` table (fundamental to vision)
- Missing `visualizations` table (separate from evolution_reports)
- Missing `share_images`, `api_usage_log`, `revenue_log`, `user_feedback` tables
- Tier enum missing 'optimal' (vision has 4 tiers, schema has 3)
- Evolution reports structure differs (no dream_id foreign key in existing schema)
- Reflections table needs dream_id foreign key (not in current schema)

**Migration Strategy:**
1. **Phase 1: Additive Changes (Zero Downtime)**
   - Add `dreams` table
   - Add new columns to existing tables (tier enum update)
   - Add new tables (visualizations, api_usage_log, etc.)
   - No data deletion yet

2. **Phase 2: Data Backfill**
   - Create default dream for each user ("My Journey")
   - Link existing reflections to default dream
   - Backfill monthly_usage_tracking from reflection counts

3. **Phase 3: Validation**
   - Verify all reflections have dream_id
   - Verify all users have at least one dream
   - Run data integrity checks

4. **Phase 4: Cleanup (Post-Validation)**
   - Add NOT NULL constraint to reflections.dream_id
   - Update RLS policies
   - Remove deprecated fields (if any)

**Rollback Plan:**
- Keep backup of pre-migration database (Supabase point-in-time recovery)
- Migration script includes rollback SQL
- Test migration on local database first
- Schedule migration during low-traffic window

---

#### 2. AI Cost Explosion Risk
- **Risk Level:** HIGH
- **Impact:** Financial loss, unsustainable unit economics
- **Probability:** MEDIUM (depends on user behavior)

**Cost Scenarios:**

| Scenario | Details | Monthly Cost | Revenue | Profit Margin |
|----------|---------|--------------|---------|---------------|
| **Worst Case** | 100 users, all Premium, heavy usage (45 reflections + 18 evolution reports + 18 viz) | $3,200 | $3,900 | 18% ⚠️ |
| **Realistic** | 100 users, mixed tiers, moderate usage (plan targets) | $892 | $3,590 | 75% ✅ |
| **Best Case** | 100 users, mostly Free (light usage, high conversion) | $487 | $2,340 | 79% ✅ |

**Warning Signs of Cost Issues:**
- Daily API costs >$100 (alert threshold)
- Single user generating >10 evolution reports/month (investigate)
- Average cost per user >$10/month (unsustainable for Essential tier)
- Premium users consistently maxing out limits (consider tier pricing adjustment)

**Mitigation Strategies:**

1. **Strict Limit Enforcement**
   - Hardcode tier limits in backend (not client-side)
   - Reject API calls over limit (don't trust frontend)
   - Monthly reset job runs reliably (cron or scheduled function)

2. **Cost Monitoring & Alerts**
   - Admin dashboard shows daily API costs
   - Email alert when daily cost >$50
   - Weekly cost reports
   - Per-user cost tracking (identify power users)

3. **Pricing Adjustments**
   - If profit margin <60%, increase tier prices 15-20%
   - If Premium users max out limits, consider "Ultra" tier ($59/month)
   - If Free users never convert, reduce free tier to 2 reflections/month

4. **Technical Optimizations**
   - Cache common AI prompts
   - Compress reflection context (remove redundant metadata)
   - Use cheaper model (Claude Haiku) for Free tier (if quality acceptable)
   - Batch evolution report generation (if possible)

---

#### 3. PayPal Webhook Failure / Race Conditions
- **Risk Level:** HIGH
- **Impact:** User pays but doesn't get access (revenue loss, support burden)
- **Probability:** MEDIUM (webhooks are inherently unreliable)

**Failure Scenarios:**

1. **Webhook Never Arrives:**
   - User completes payment on PayPal
   - Webhook gets lost (network issue, PayPal bug)
   - Database never updated
   - User stuck on Free tier despite paying

2. **Webhook Arrives Out of Order:**
   - `PAYMENT.SALE.COMPLETED` arrives before `BILLING.SUBSCRIPTION.ACTIVATED`
   - Logic assumes subscription exists, throws error
   - User's payment confirmed but subscription not activated

3. **Duplicate Webhooks:**
   - PayPal sends same event twice (retry mechanism)
   - Without idempotency, user credited twice
   - Database shows incorrect data

4. **Delayed Webhooks:**
   - Webhook arrives 30 minutes after payment
   - User complains they paid but no access
   - Support team manually intervenes

**Mitigation Strategies:**

1. **Webhook Reliability**
   - Log ALL webhook events to database (even duplicates)
   - Implement idempotency key (process each event ID only once)
   - Return 200 OK even if processing fails (log error, investigate later)
   - Retry failed webhook processing (background job)

2. **Polling Fallback**
   - Daily cron job polls PayPal API for active subscriptions
   - Compare PayPal state vs. database state
   - Auto-correct mismatches (log discrepancies for review)
   - Alert admin if >5% of users have mismatched status

3. **Manual Reconciliation Tool**
   - Admin dashboard: "Sync Subscription Status" button
   - Fetches latest status from PayPal API
   - Updates database
   - Shows audit log of changes

4. **User-Facing Status Check**
   - Settings page: "Verify Subscription Status" button
   - Polls PayPal in real-time
   - Updates user's tier immediately
   - Reduces support requests

5. **Grace Periods**
   - Payment failure: 3-day grace period before downgrade
   - New subscription: Activate immediately (optimistic), verify later
   - Webhook delay: Trust user's PayPal redirect token (short-lived access)

---

### Medium-Risk Areas

#### 4. Scope Expansion: Single Reflection → Multi-Dream Management
- **Risk Level:** MEDIUM
- **Impact:** Increased complexity, longer development time
- **Probability:** HIGH (vision requires significant expansion)

**Current Implementation:**
- Single reflection flow (no dreams concept)
- Reflections stored standalone
- No cross-reflection analysis

**Vision Requirements:**
- Multi-dream management (2 free, 5 essential, 7 optimal, unlimited premium)
- Dream-specific reflections
- Cross-dream analysis
- Dream status transitions (active → achieved → archived)

**Gap Analysis:**

| Feature | Current | Vision | Gap |
|---------|---------|--------|-----|
| Dream entity | ❌ None | ✅ First-class table | NEW architecture |
| Reflection grouping | ❌ Flat list | ✅ Per-dream | REFACTOR needed |
| Multi-dream UI | ❌ N/A | ✅ Dashboard grid | NEW components |
| Dream limits | ❌ None | ✅ Tier-based | NEW business logic |
| Cross-dream analysis | ❌ N/A | ✅ After 12 reflections | NEW feature |

**Implementation Risk:**
- Refactoring existing reflection flow (breaking changes)
- Migrating existing reflections to dream association
- Complex UI for dream management
- State management for multi-dream dashboard

**Mitigation:**
- Build dreams system alongside existing reflection flow (parallel paths)
- Create migration utility to associate old reflections with default dream
- Incremental rollout: Single-dream view first, multi-dream dashboard later
- Thorough testing with multiple dreams scenario

---

#### 5. Temporal Context Distribution Algorithm Complexity
- **Risk Level:** MEDIUM
- **Impact:** Poor evolution report quality, incorrect insights
- **Probability:** MEDIUM (novel algorithm, needs tuning)

**Vision's Key Innovation:**
Fixed thresholds (every 4 reflections) but tiered context quality (4 / 6 / 9 / 12 reflections analyzed).

**Algorithm Challenge:**
Distribute N reflections (4, 6, 9, or 12) across 3 time periods (Early / Middle / Recent) to show evolution.

**Example (9 reflections analyzed from 14 total):**
```
Timeline: Jan 15 ────────────────────────── Mar 18 (63 days)
          |                                 |
          Early (0-21d)  Middle (22-42d)  Recent (43-63d)

Selection: 3 reflections  3 reflections   3 reflections
Strategy:  Evenly spaced  Evenly spaced   Evenly spaced
```

**Risk Factors:**

1. **Edge Cases:**
   - User has exactly 4 reflections (no distribution needed, use all)
   - User has 100 reflections (need to sample smartly)
   - Reflections clustered in one period (uneven distribution)
   - User reflects daily then stops (recent period empty)

2. **Quality Issues:**
   - Selecting wrong reflections (miss key moments)
   - Temporal bias (too many recent, not enough early)
   - Context window too small (9 reflections may not capture evolution)

3. **Performance:**
   - Sorting/filtering large reflection sets
   - Complex SQL queries for temporal bucketing
   - Real-time calculation on report generation

**Mitigation:**

1. **Algorithm Design:**
   - Document algorithm clearly (comments in code)
   - Unit tests for edge cases (4, 9, 100 reflections)
   - Validate temporal distribution is actually even

2. **Fallback Logic:**
   - If reflections <context limit, use all (simple case)
   - If distribution fails, fall back to most recent N (degraded mode)

3. **Quality Validation:**
   - A/B test: Random selection vs. temporal distribution
   - User feedback: "Was this evolution report helpful?"
   - Iterate based on feedback

4. **Performance:**
   - Index reflections by created_at (already in schema)
   - Pre-calculate time buckets in application layer
   - Cache temporal distribution for 1 hour (if user generates multiple reports)

---

#### 6. Email Deliverability & Spam Filters
- **Risk Level:** MEDIUM
- **Impact:** Users miss important notifications (subscription confirmations, limit warnings)
- **Probability:** MEDIUM (email deliverability is always challenging)

**Critical Emails:**
- Subscription confirmation (user paid, needs confirmation)
- Payment receipt (legal requirement in some regions)
- Monthly limit warning (approaching cap)
- Subscription expiry notice (renewal failed)

**Risk Scenarios:**

1. **Spam Folder:**
   - Welcome emails marked as spam (new domain reputation)
   - PayPal receipts look promotional
   - Users think they never received confirmation

2. **Bounces:**
   - User enters wrong email
   - Email provider blocks our domain
   - Temporary delivery failure (mailbox full)

3. **Unsubscribes:**
   - User unsubscribes from transactional emails (shouldn't be possible)
   - Legal requirement to honor unsubscribe (even for receipts?)

**Mitigation:**

1. **Email Infrastructure:**
   - Set up SPF record (authorize Gmail to send for domain)
   - Set up DKIM (email signature verification)
   - Set up DMARC (policy for failed authentication)
   - Use dedicated sending domain (mail.mirrorofdreams.app)

2. **Content Optimization:**
   - Keep emails transactional (no marketing language)
   - Plain text + simple HTML (avoid spam triggers)
   - Include unsubscribe link (optional notifications only)
   - Clear subject lines ("Mirror of Dreams - Payment Receipt")

3. **Monitoring:**
   - Track bounce rate (>5% investigate)
   - Track open rate (if <30%, check spam)
   - Log all email attempts (success/failure)
   - Admin dashboard shows email health metrics

4. **Fallback Communication:**
   - In-app notifications (don't rely solely on email)
   - Dashboard banner: "Check your email for confirmation"
   - SMS notifications (future, if critical)

---

### Low-Risk Areas

#### 7. Share Image Generation Performance
- **Risk Level:** LOW
- **Impact:** Slow image generation (user waits 5-10 seconds)
- **Probability:** LOW (image generation is fast with canvas/sharp)

**Mitigation:**
- Generate images asynchronously (background job)
- Show loading spinner while generating
- Cache generated images (24-hour TTL)
- Limit image size (1080x1080 PNG, ~500KB)

---

#### 8. Admin Dashboard Data Accuracy
- **Risk Level:** LOW
- **Impact:** Incorrect revenue/cost metrics (misguided business decisions)
- **Probability:** LOW (simple aggregation queries)

**Mitigation:**
- Cross-check with PayPal dashboard monthly
- Automated reconciliation script
- Manual CSV export for accountant review
- Version control for dashboard queries

---

## Mitigation Strategies (Overall)

### 1. Database Migration & Schema Evolution
- **Strategy:** Additive migrations, comprehensive backfill, thorough testing
- **Timeline:** Week 1-2 of development
- **Owner:** Backend Engineer + Database Specialist
- **Success Criteria:** Zero data loss, <5 minutes downtime, all existing users preserved

### 2. AI Cost Management
- **Strategy:** Strict limits, real-time monitoring, pricing flexibility
- **Timeline:** Ongoing (start Week 3)
- **Owner:** Backend Engineer + Product Manager
- **Success Criteria:** 70%+ profit margin sustained, <$50/day API costs

### 3. PayPal Integration Reliability
- **Strategy:** Webhook logging, polling fallback, manual reconciliation, grace periods
- **Timeline:** Week 7-8 (monetization phase)
- **Owner:** Backend Engineer + Finance/Admin
- **Success Criteria:** <1% subscription status mismatches, <5 manual interventions/month

### 4. Email Deliverability
- **Strategy:** Proper DNS records, content optimization, monitoring, in-app fallbacks
- **Timeline:** Week 8-9 (polish phase)
- **Owner:** Backend Engineer + Marketing
- **Success Criteria:** >90% delivery rate, <5% bounce rate, <2% spam complaints

### 5. Scope Management
- **Strategy:** Phased rollout, MVP focus, post-launch iterations
- **Timeline:** All phases
- **Owner:** Product Manager + Engineering Lead
- **Success Criteria:** MVP shipped in 10 weeks, no scope creep blocking launch

---

## Iteration Strategy Recommendation

### Recommendation: MULTI-ITERATION (3 Phases)

**Rationale:**
- **Complexity:** 50+ features across multiple domains (auth, dreams, reflections, evolution, monetization, admin)
- **Risk:** Database migration, PayPal integration, AI cost management require careful implementation
- **Dependencies:** Clear critical path (dreams → reflections → evolution → monetization)
- **Existing Codebase:** Partial implementation requires refactoring, not greenfield

---

### Iteration 1: Foundation + Dreams (Weeks 1-4)

**Vision:** Establish solid foundation with multi-dream architecture

**Scope:**
- Database schema migration (add dreams table, update enums, add missing tables)
- Migrate existing reflections to default dream
- Dreams CRUD operations (create, edit, delete, archive, achieve)
- Update auth system (add email verification, Optimal tier support)
- Implement WHO/WHERE/WHAT/HOW pattern
- Basic dashboard with dream cards
- Tier limits configuration (add Optimal)

**Why First:**
- Dreams are foundational to everything else
- Can't build reflection system without dreams architecture
- Migration must happen before adding new features
- Establishes patterns for subsequent iterations

**Estimated Duration:** 30 hours (120 hour total project ÷ 4 phases ≈ 30/phase)

**Risk Level:** HIGH (migration risk, architectural changes)

**Success Criteria:**
- All existing users have at least one dream
- All existing reflections linked to dreams
- Dreams CRUD works reliably
- No data loss
- Tier system supports Free/Essential/Optimal/Premium

**Deliverables:**
- Migrated database schema
- Dreams API endpoints (create, list, get, update, delete, updateStatus)
- Dreams UI components (create form, dream card, dream list)
- Updated dashboard layout
- Tier limits configuration module

---

### Iteration 2: Reflections + Evolution (Weeks 5-7)

**Vision:** Core value loop - Reflect → Insights → Evolution

**Scope:**
- Refactor reflection system to work with dreams
- 5-question reflection flow (linked to specific dream)
- AI generation with Claude Sonnet 4.5
- Extended thinking for Optimal/Premium tiers
- Usage tracking and limit enforcement
- Evolution reports with temporal distribution algorithm
- Visualizations (achievement narrative style)
- Feedback collection system

**Dependencies:**
- Requires: Dreams architecture from Iteration 1
- Imports: Dream selection, tier limits, WHO/WHERE/WHAT/HOW pattern

**Why Second:**
- Core user value (reflection + insights)
- Natural progression from dreams foundation
- Can test with real users before monetization
- Establishes AI cost patterns for business model validation

**Estimated Duration:** 35 hours (core complexity)

**Risk Level:** MEDIUM (AI cost management, temporal distribution algorithm)

**Success Criteria:**
- Users can create reflections for specific dreams
- Evolution reports generate after 4 reflections
- Temporal distribution algorithm works correctly (Early/Middle/Recent)
- Extended thinking works for Optimal/Premium tiers
- AI costs within budget (<$1/user/month average)
- Feedback collection captures user sentiment

**Deliverables:**
- Refactored reflection API (dreamId parameter)
- 5-question flow UI
- AI integration with extended thinking
- Temporal context distribution service
- Evolution report generation API
- Visualization generation API
- Feedback submission API
- Usage tracking enforcement

---

### Iteration 3: Monetization + Admin (Weeks 8-10)

**Vision:** Sustainable business with admin visibility

**Scope:**
- PayPal subscription integration (create, activate, cancel, update)
- Webhook handling (all subscription events)
- Revenue tracking (revenue_log table, payment processing)
- Subscription upgrade/downgrade flows
- Share image generation (download for Instagram)
- Admin dashboard (revenue, costs, feedback, usage)
- CSV export functionality
- Email notifications (receipts, confirmations, warnings)

**Dependencies:**
- Requires: Reflections working, evolution reports generating
- Imports: Tier system, usage tracking, user management

**Why Third:**
- Revenue generation (can launch MVP after this)
- Admin needs data from reflections/evolution to be useful
- Share images need evolution reports to exist
- Can validate pricing before launch

**Estimated Duration:** 35 hours (PayPal complexity)

**Risk Level:** HIGH (PayPal webhooks, revenue accuracy)

**Success Criteria:**
- Users can upgrade from Free → Essential/Optimal/Premium
- PayPal webhooks process correctly (log all events)
- Subscription status syncs reliably (<1% mismatch rate)
- Revenue tracking matches PayPal dashboard
- Admin can view metrics (revenue, costs, profit margin)
- Share images generate and download

**Deliverables:**
- PayPal subscription API integration
- Webhook handler with idempotency
- Subscription management UI (upgrade/downgrade)
- Revenue tracking system
- Share image generation API (canvas/sharp)
- Admin dashboard UI (4-quadrant layout)
- Admin API endpoints (getMetrics, getFeedback, exportCSV)
- Email notifications (via existing Gmail setup)

---

### Post-Launch: Iteration 4 (Weeks 11-14)

**Vision:** Polish, optimize, iterate based on real user feedback

**Scope:**
- Cross-dream analysis (after 12 total reflections)
- PDF export (Optimal/Premium tiers)
- Dream categories and filtering
- Reflection search
- Mobile responsiveness improvements
- Performance optimization (caching, query optimization)
- Bug fixes from user reports
- A/B testing (temporal distribution, pricing)

**Why Fourth:**
- These are "nice-to-have" features (not blocking MVP launch)
- Requires real user data to validate value
- Can prioritize based on feedback
- Allows for rapid iteration post-launch

---

## Key Insights for Planning

### 1. Database Migration is Critical Path
The existing schema differs significantly from the vision. Migration must be first priority to avoid compounding technical debt. Recommend allocating 20% of Iteration 1 timeline to migration testing.

### 2. AI Costs Must Be Monitored from Day 1
With estimated $0.04-$0.35 per operation, costs can spiral quickly. Implement cost tracking in Iteration 2 (alongside AI features) and monitor daily. Target 70%+ profit margin.

### 3. PayPal Integration is Higher Risk Than Stripe
Existing code uses Stripe, but vision requires PayPal. Webhook reliability is lower with PayPal (based on industry reports). Implement robust logging, polling fallback, and manual reconciliation tools. Consider keeping Stripe as backup payment option.

### 4. Temporal Distribution Algorithm is Novel
The vision's key innovation (fixed thresholds, tiered context quality) requires custom algorithm. No off-the-shelf solution exists. Allocate time for testing edge cases and gathering user feedback on evolution report quality.

### 5. Scope is Larger Than Typical MVP
50+ features with 4 external dependencies is substantial. Recommend aggressive scope cutting if timeline slips:
- **Must Have:** Dreams, Reflections, Evolution (Iterations 1-2)
- **Should Have:** PayPal, Admin Dashboard (Iteration 3)
- **Nice to Have:** Share images, Cross-dream analysis, PDF export (post-launch)

---

## Dependency Graph

```
FOUNDATION (Iteration 1)
├── Database Migration
│   ├── Add dreams table
│   ├── Update tier enum (add 'optimal')
│   ├── Add missing tables (api_usage_log, revenue_log, etc.)
│   └── Backfill existing data
├── Dreams Architecture
│   ├── Dreams CRUD API
│   ├── Dreams UI components
│   └── Dashboard layout
├── Auth System Updates
│   ├── Email verification
│   └── Optimal tier support
└── WHO/WHERE/WHAT/HOW Pattern
    └── Service layer separation

    ↓

CORE FEATURES (Iteration 2)
├── Refactored Reflection System
│   ├── Link reflections to dreams
│   ├── 5-question flow
│   └── AI generation (Claude)
├── Usage Tracking
│   ├── Monthly limits
│   └── Tier enforcement
├── Evolution Reports
│   ├── Temporal distribution algorithm
│   ├── Extended thinking (Optimal/Premium)
│   └── Pattern detection
├── Visualizations
│   └── Achievement narratives
└── Feedback Collection

    ↓

MONETIZATION (Iteration 3)
├── PayPal Integration
│   ├── Subscription creation
│   ├── Webhook handling
│   ├── Revenue tracking
│   └── Grace periods
├── Share Images
│   ├── Canvas/sharp generation
│   └── Vercel Blob storage
├── Admin Dashboard
│   ├── Revenue metrics
│   ├── Cost tracking
│   ├── Feedback aggregation
│   └── CSV export
└── Email Notifications
    ├── Receipts
    ├── Confirmations
    └── Limit warnings
```

---

## External Service Status Matrix

| Service | Status | Priority | Risk | Mitigation | Owner |
|---------|--------|----------|------|------------|-------|
| Supabase | PARTIAL | P0 | MEDIUM | Migration testing, backups | Backend |
| Claude AI | ACTIVE | P0 | HIGH | Cost monitoring, rate limiting | Backend |
| PayPal | NOT STARTED | P0 | HIGH | Webhook logging, polling fallback | Backend + Finance |
| Gmail | ACTIVE | P1 | LOW | SPF/DKIM setup, monitoring | Backend |
| Vercel | ACTIVE | P0 | LOW | Upgrade to Pro if needed | DevOps |
| Vercel Blob | NOT STARTED | P2 | LOW | Use Supabase Storage as backup | Backend |

---

## Risk Heat Map

```
         LOW               MEDIUM              HIGH
         ───               ──────              ────
  HIGH │                    Database          AI Costs
       │                    Migration         PayPal Webhooks
       │
MEDIUM │  Email             Scope              Temporal
       │  Deliverability    Expansion          Distribution
       │  Share Images
       │
  LOW  │  Admin             Vercel
       │  Dashboard         Blob Storage
       │
       │
       └─────────────────────────────────────────────
                        PROBABILITY →
```

---

## Conclusion

**Primary Recommendation:** Execute 3-iteration plan with database migration as highest priority. Allocate 20% contingency time for PayPal integration complexity and AI cost tuning.

**Biggest Risks:**
1. Database migration (data loss, downtime)
2. AI cost management (profit margin erosion)
3. PayPal webhook reliability (revenue/access mismatches)

**Critical Success Factors:**
1. Thorough migration testing (local → staging → production)
2. Real-time cost monitoring from Iteration 2 onward
3. Robust webhook logging + polling fallback for PayPal
4. Aggressive scope management (cut features if timeline slips)

**Estimated Total Timeline:** 10 weeks (30h + 35h + 35h = 100 hours of development)

**Confidence Level:** MEDIUM-HIGH. Clear dependencies mapped, risks identified with mitigation strategies, but significant scope and external service complexity.

---

*Report completed: 2025-10-21*
*Analysis based on: Vision document (2908 lines), existing codebase (partial implementation)*
*Next step: Master Planner synthesizes Explorer 1 (Architecture) + Explorer 2 (Dependencies) reports*
