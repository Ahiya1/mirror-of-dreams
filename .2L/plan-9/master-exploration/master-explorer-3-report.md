# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
User Experience & Integration Points

## Vision Summary
Transform Mirror of Dreams from free-only to monetizable SaaS by replacing Stripe with PayPal subscriptions, implementing a simplified 3-tier structure (Free, Pro, Unlimited), and upgrading to Claude Sonnet 4.5 with extended thinking for premium users.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 15 must-have features
- **User stories/acceptance criteria:** 48 acceptance criteria across all features
- **Estimated total work:** 20-30 hours (complex multi-phase integration)

### Complexity Rating
**Overall Complexity: COMPLEX**

**Rationale:**
- **15+ distinct features** spanning frontend UX, backend payments, and webhook automation
- **Multiple integration touchpoints:** Pricing page, dashboard, profile, settings, navigation, reflection flow
- **Real-time payment flow:** User clicks → PayPal redirect → webhook updates → UI state changes
- **Edge case handling required:** Payment failures, webhook delays, cancellations, tier transitions
- **Data flow spans 5+ boundaries:** Client → tRPC → PayPal API → Webhooks → Database → Client updates

---

## Current User Flows Analysis

### Pricing Page (`/app/pricing/page.tsx`)

**Current State:**
- **Structure:** 3 tiers displayed (Free, Premium, Pro)
- **Pricing:** Hardcoded ($0, $9.99, $29.99) - **MISMATCH with vision ($15, $29)**
- **CTAs:** Link to `/auth/signup?plan={tier}` - **NOT functional checkout**
- **Tier names:** Uses "Premium" for middle tier, "Pro" for top tier
- **Period toggle:** FAQ mentions annual billing but **no UI toggle present**
- **Current tier indication:** **NOT implemented** (no auth check)
- **Loading states:** **NOT implemented**

**What Needs to Change:**
1. **Rename tiers:** "Premium" → "Pro" ($15/mo), "Pro" → "Unlimited" ($29/mo)
2. **Update pricing:** Match vision ($15/$150/yr for Pro, $29/$290/yr for Unlimited)
3. **Add period toggle:** Monthly/Yearly switch with savings calculation
4. **Replace CTAs:** `/auth/signup?plan=X` → PayPal checkout flow
5. **Show current plan:** If logged in, disable "Current Plan" button
6. **Add loading states:** "Preparing checkout..." during redirect
7. **Update feature lists:** Add daily limits (1/day for Pro, 2/day for Unlimited)
8. **Add evolution/viz gates:** Show as locked for Free tier

**Integration Complexity:** **MEDIUM**
- Requires tRPC `subscriptions.createCheckout` mutation
- Must handle redirect to PayPal with return URLs
- Success/cancel handling with query params
- Optimistic UI updates before webhook confirmation

---

### Profile Page (`/app/profile/page.tsx`)

**Current State:**
- **Subscription section exists:** Lines 333-355
- **Shows:** Current tier, reflections this month, total reflections
- **Display:** Hardcoded limits (10 for free, 50 for essential, Unlimited for premium)
- **Subscription management:** **NOT IMPLEMENTED** (no cancel, no billing info)
- **Tier badge:** Simple text capitalization
- **No payment method link:** Missing

**What Needs to Change:**
1. **Add subscription details card:**
   - Billing period (Monthly/Yearly)
   - Next billing date (from `subscriptions.getStatus`)
   - PayPal subscription ID (for reference)
   - Subscription status (active, canceled, past_due)
2. **Add "Cancel Subscription" button:**
   - Shows modal with confirmation
   - "You'll keep access until [date]"
   - Calls `subscriptions.cancel` tRPC procedure
3. **Add "Reactivate" button:**
   - Shows if `status='canceled'` but `expiresAt` is in future
   - Calls PayPal API to reactivate
4. **Add "Change Plan" link:**
   - Redirects to `/pricing` with current tier highlighted
5. **Add "Manage Billing" link:**
   - Opens PayPal billing portal (if PayPal provides one)
   - Alternative: Link to PayPal.com to update payment method
6. **Update tier limits display:**
   - Use new 3-tier structure constants
   - Show daily limits (1/day, 2/day) for Pro/Unlimited
7. **Show cancellation notice:**
   - If `cancelAtPeriodEnd=true`, show "Access until [date]" banner

**Integration Complexity:** **MEDIUM-HIGH**
- Requires new tRPC procedures: `subscriptions.cancel`, `subscriptions.reactivate`
- Must fetch subscription details on page load
- Modal UX for destructive actions (cancel)
- Real-time status updates after mutations

---

### Dashboard (`/app/dashboard/page.tsx`)

**Current State:**
- **Hero section:** Generic greeting, no upgrade prompt
- **SubscriptionCard:** Lines 144-146, shows tier + upgrade CTA
- **Upgrade CTA:** Links to `/subscription` (doesn't exist) - **BROKEN**
- **No limit warnings:** When approaching monthly limit
- **No tier-gated features:** Evolution/viz cards show for all tiers

**What Needs to Change:**
1. **Hero section upgrade prompt:**
   - If `tier='free'` and `reflectionCountThisMonth >= 2`: "You've used all 2 reflections. Upgrade to Pro for 30/month."
   - If `tier='pro'` and approaching limit: "You've used 28/30 reflections. Upgrade to Unlimited for no limits."
   - CTA button → `/pricing`
2. **SubscriptionCard updates:**
   - Fix broken link: `/subscription` → `/pricing`
   - Show correct tier benefits from vision
   - Update tier limits: Pro (5 dreams, 30/month, 1/day), Unlimited (∞ dreams, 60/month, 2/day)
3. **Evolution/Visualization cards:**
   - Show "Locked" state for free tier
   - "Upgrade to Pro to unlock" message
   - Click → `/pricing` with tier pre-selected
4. **Usage warnings:**
   - When 80% of monthly limit: "You've used 8/10 reflections this month"
   - When 100%: "Limit reached. Upgrade or wait until next month."
5. **Past due banner:**
   - If `subscriptionStatus='past_due'`: "Payment failed. Update billing to keep access."
   - Link to PayPal or profile page

**Integration Complexity:** **MEDIUM**
- Conditional rendering based on tier + usage
- Gated feature states (locked icons, upgrade prompts)
- Banner system for warnings/errors
- Links to pricing page with context

---

### Settings Page (`/app/settings/page.tsx`)

**Current State:**
- **Preferences only:** Notifications, reflection defaults, display, privacy
- **No billing section:** Missing entirely
- **No subscription management:** Should be in profile, not here (good separation)

**What Needs to Change:**
1. **Add "Billing" section (optional):**
   - Could add link to profile page billing section
   - OR keep billing entirely in profile (recommended)
2. **No major changes needed:** Settings is for preferences, not subscriptions
3. **Possible addition:** "Subscription renewal reminders" toggle

**Integration Complexity:** **LOW**
- Minimal changes required
- Settings stays focused on preferences
- Billing lives in profile page

---

## PayPal UX Integration Plan

### Checkout Flow (Detailed)

**Step-by-Step User Journey:**

1. **User clicks "Upgrade to Pro" on pricing page**
   - Button shows loading spinner: "Preparing checkout..."
   - Frontend calls `trpc.subscriptions.createCheckout.mutate({ tier: 'pro', period: 'monthly' })`

2. **Backend creates PayPal subscription**
   - `server/trpc/routers/subscriptions.ts` → `createCheckout` procedure
   - Calls PayPal API: `POST /v1/billing/subscriptions`
   - Includes metadata: `{ userId, tier, period }`
   - PayPal returns approval URL: `https://www.paypal.com/checkoutnow?token=XXX`

3. **User redirected to PayPal**
   - Frontend: `window.location.href = approvalUrl`
   - PayPal checkout page loads with subscription details
   - User sees: "Subscribe to Mirror of Dreams Pro - $15/month"
   - User logs into PayPal (or uses guest checkout)
   - User reviews and clicks "Subscribe"

4. **PayPal redirects back to app**
   - **Success:** `https://mirror-of-dreams.com/dashboard?subscription=success&token=XXX`
   - **Cancel:** `https://mirror-of-dreams.com/pricing?subscription=canceled`

5. **Success page handling**
   - Dashboard checks query params: `subscription=success`
   - Shows toast: "Welcome to Pro! You now have 30 reflections/month."
   - **Optimistic update:** Immediately update UI tier badge (before webhook)
   - Background: PayPal webhook fires `BILLING.SUBSCRIPTION.ACTIVATED`

6. **Webhook confirms activation**
   - `app/api/webhooks/paypal/route.ts` receives event
   - Verifies signature
   - Updates database: `tier='pro'`, `subscription_status='active'`
   - User sees updated tier badge (if webhook arrives after page load)

7. **Cancel page handling**
   - Pricing page shows: "Checkout canceled. No changes made."
   - User can retry or leave

**Edge Cases:**
- **Webhook arrives before redirect:** User sees updated tier immediately
- **Webhook delayed (>5 seconds):** Optimistic update shows Pro tier, webhook confirms later
- **Webhook fails:** Database not updated, user sees old tier - needs manual intervention
- **User refreshes during redirect:** Query params lost, no success message shown
- **PayPal error:** Show error toast: "Payment failed. Please try again or contact support."

**Integration Points:**
- **Frontend:** Pricing page, dashboard success handler
- **tRPC:** `subscriptions.createCheckout` procedure
- **PayPal API:** `POST /v1/billing/subscriptions`, `GET /v1/billing/subscriptions/{id}`
- **Webhook:** `BILLING.SUBSCRIPTION.ACTIVATED` event handler
- **Database:** Update `tier`, `subscription_status`, `subscription_id`, `subscription_started_at`

---

### Success/Error States

**Success States:**

1. **Checkout Success (Immediate)**
   - **Trigger:** User returns from PayPal with `?subscription=success`
   - **UI:** Toast notification: "Welcome to Pro! Your subscription is active."
   - **Display:** Tier badge updates to "Pro"
   - **Action:** Redirect to `/dashboard` if on pricing page

2. **Webhook Confirmation (Background)**
   - **Trigger:** PayPal webhook `BILLING.SUBSCRIPTION.ACTIVATED`
   - **UI:** No visible change (already optimistically updated)
   - **Action:** Database updated, user can refresh to confirm

3. **Cancellation Success**
   - **Trigger:** User cancels subscription via profile page
   - **UI:** Toast: "Subscription canceled. You'll have Pro access until [date]."
   - **Display:** Show "Canceling" badge, "Reactivate" button appears
   - **Action:** Profile page updates subscription status

4. **Upgrade Success**
   - **Trigger:** Pro → Unlimited upgrade
   - **UI:** Toast: "Upgraded to Unlimited! You now have 60 reflections/month."
   - **Display:** Tier badge updates immediately
   - **Action:** Dashboard cards update with new limits

**Error States:**

1. **Payment Failed (During Checkout)**
   - **Trigger:** PayPal returns error or user's payment method declined
   - **UI:** Toast: "Payment failed. Please check your payment method and try again."
   - **Display:** Stay on pricing page, tier unchanged
   - **Action:** User can retry checkout

2. **Webhook Signature Invalid**
   - **Trigger:** Malformed webhook or wrong secret
   - **UI:** No user-facing change (backend logs error)
   - **Action:** Admin notification, manual database update needed

3. **Subscription Past Due**
   - **Trigger:** PayPal webhook `BILLING.SUBSCRIPTION.SUSPENDED`
   - **UI:** Banner on dashboard: "Payment failed. Update billing to keep Pro access."
   - **Display:** Tier remains "Pro" but status shows "past_due"
   - **Action:** Link to PayPal or profile billing section

4. **Subscription Expired**
   - **Trigger:** PayPal webhook `BILLING.SUBSCRIPTION.EXPIRED`
   - **UI:** Toast on next login: "Your Pro subscription has ended. Upgrade to continue."
   - **Display:** Tier downgrades to "Free"
   - **Action:** Dashboard shows upgrade prompts

5. **Network Error (API Call Failed)**
   - **Trigger:** tRPC mutation fails due to network/server error
   - **UI:** Toast: "Connection error. Please try again."
   - **Display:** Loading state removed, button re-enabled
   - **Action:** User can retry

6. **User Canceled Checkout**
   - **Trigger:** User clicks "Cancel" in PayPal modal
   - **UI:** Redirect to `/pricing?subscription=canceled`
   - **Display:** Toast: "Checkout canceled. No changes made."
   - **Action:** User can restart checkout

**Error Recovery Strategies:**

- **Retry Logic:** Allow users to retry failed payments
- **Manual Intervention:** Admin dashboard to manually update subscriptions if webhooks fail
- **Grace Period:** Keep access for 3-7 days if payment fails (configurable)
- **Email Notifications:** Send email when payment fails or subscription expires
- **Support Link:** Provide "Contact Support" button on error states

---

## User Journey Touchpoints

**Complete list of UI elements requiring updates:**

### 1. Navigation (`/components/shared/AppNavigation.tsx`)
**Changes:**
- Add tier badge next to user name in nav
- Show "Upgrade" link in dropdown if tier='free'
- Add "Billing" link to profile dropdown

### 2. Pricing Page (`/app/pricing/page.tsx`)
**Changes:**
- Rename tiers: Premium → Pro, Pro → Unlimited
- Update prices: $15/$150 (Pro), $29/$290 (Unlimited)
- Add monthly/yearly toggle with savings display
- Replace signup CTAs with PayPal checkout buttons
- Show "Current Plan" badge if logged in
- Add daily limit indicators (1/day, 2/day)
- Update feature lists (evolution/viz locked for free)
- Add loading states during checkout creation
- Handle `?subscription=success|canceled` query params

### 3. Dashboard Hero (`/components/dashboard/DashboardHero.tsx`)
**Changes:**
- Add upgrade prompt for free tier near limit
- Show usage warning at 80% monthly limit
- Add "past_due" banner if payment failed
- Link all prompts to `/pricing`

### 4. Dashboard Cards
**SubscriptionCard (`/components/dashboard/cards/SubscriptionCard.tsx`):**
- Update tier info for 3-tier structure
- Fix broken `/subscription` link → `/pricing`
- Update benefits lists (daily limits, evolution, viz)
- Add "Manage Billing" button linking to profile

**EvolutionCard (`/components/dashboard/cards/EvolutionCard.tsx`):**
- Show "Locked" overlay if tier='free'
- "Upgrade to Pro to unlock evolution reports"
- Click → `/pricing?feature=evolution`

**VisualizationCard (`/components/dashboard/cards/VisualizationCard.tsx`):**
- Show "Locked" overlay if tier='free'
- "Upgrade to Pro to unlock visualizations"
- Click → `/pricing?feature=visualization`

**ProgressStatsCard (`/components/dashboard/cards/ProgressStatsCard.tsx`):**
- Update reflection limits display (2/2 free, 30/30 pro, 60/60 unlimited)
- Show daily limit indicator (1/day, 2/day)
- Add progress bar with tier-based colors

### 5. Profile Page (`/app/profile/page.tsx`)
**Changes:**
- Expand "Tier & Subscription" section with:
  - Billing period (Monthly/Yearly)
  - Next billing date
  - Subscription status (active, canceled, past_due)
  - PayPal subscription ID (for reference)
- Add "Cancel Subscription" button with confirmation modal
- Add "Reactivate Subscription" button if canceled
- Add "Change Plan" link → `/pricing`
- Add "Manage Billing" link → PayPal portal
- Show cancellation notice if `cancelAtPeriodEnd=true`

### 6. Reflection Creation Flow (`/app/reflection/page.tsx`)
**Changes:**
- Check daily limit before allowing reflection
- Show error if daily limit reached: "You've reached your daily limit (1 reflection). Try again tomorrow or upgrade to Unlimited for 2/day."
- Check monthly limit: "You've used all 30 reflections this month. Upgrade to Unlimited or wait until next month."
- Add "Upgrade" button on limit error screens

### 7. Onboarding (`/app/onboarding/page.tsx`)
**Changes (Optional):**
- Show tier comparison during onboarding
- "Start with Pro for just $15/month" prompt
- Skip button to start with free tier

### 8. Settings Page (`/app/settings/page.tsx`)
**Changes:**
- Minimal: Add link to billing section in profile
- OR add "Subscription renewal reminders" toggle

### 9. Toast Notifications (`/contexts/ToastContext.tsx`)
**Changes:**
- Add subscription-specific toast variants:
  - Success: "Welcome to Pro!"
  - Error: "Payment failed. Please try again."
  - Warning: "Subscription canceled. Access until [date]."
  - Info: "Checkout canceled. No changes made."

### 10. Modals
**New Modals Needed:**
- **Cancel Subscription Modal:**
  - Title: "Cancel Subscription?"
  - Warning: "You'll lose access on [date]"
  - Buttons: "Keep Pro" / "Cancel Subscription"
- **Payment Failed Modal:**
  - Title: "Payment Failed"
  - Message: "Update your payment method to keep access"
  - Button: "Update Billing" → PayPal portal

---

## Edge Cases & Error States

**Comprehensive list with handling recommendations:**

### Payment Flow Edge Cases

1. **User refreshes during PayPal redirect**
   - **Issue:** Loses checkout state, returns to pricing page
   - **Handling:** Save checkout intent in session storage, restore on return
   - **Alternative:** Idempotent checkout creation - safe to recreate

2. **PayPal returns success but webhook never arrives**
   - **Issue:** Database not updated, user stuck on old tier
   - **Handling:**
     - Optimistic update: Show new tier immediately
     - Background job: Poll PayPal API every 5 min for 1 hour to confirm
     - Manual intervention: Admin can manually activate subscription
   - **Prevention:** Use PayPal webhook retry mechanism

3. **Webhook arrives before user redirect completes**
   - **Issue:** Database updated, but user sees old tier on dashboard
   - **Handling:**
     - Force refresh after redirect: `router.refresh()` in Next.js
     - Real-time: Use WebSocket or polling to detect tier changes
   - **Best practice:** Optimistic update prevents this issue

4. **User clicks "Upgrade" multiple times (double submission)**
   - **Issue:** Multiple PayPal subscriptions created
   - **Handling:**
     - Disable button after first click (loading state)
     - Backend: Check if user already has active subscription before creating
     - PayPal: Cancel duplicate subscriptions via API

5. **User has active subscription, tries to upgrade again**
   - **Issue:** Creates second subscription instead of upgrading
   - **Handling:**
     - Frontend: Disable "Upgrade" button if already subscribed
     - Backend: Reject checkout if subscription exists, return upgrade flow instead
     - Use PayPal subscription revision API for upgrades

### Webhook Edge Cases

6. **Duplicate webhook events (PayPal retries)**
   - **Issue:** Database updated twice, potential data corruption
   - **Handling:**
     - Idempotent webhook handler: Check if event already processed
     - Store `paypal_event_id` in database, skip if exists
     - Use database transactions to prevent race conditions

7. **Webhook signature verification fails**
   - **Issue:** Malicious webhook or wrong secret configured
   - **Handling:**
     - Reject with 400 status code
     - Log security incident
     - Alert admin via email/Slack
     - Never update database on invalid signatures

8. **Webhook arrives for unknown user**
   - **Issue:** PayPal subscription metadata has invalid userId
   - **Handling:**
     - Log error with PayPal subscription ID
     - Store in "unmatched webhooks" table for manual review
     - Email admin for investigation

9. **Out-of-order webhook events**
   - **Issue:** `SUBSCRIPTION.CANCELLED` arrives before `SUBSCRIPTION.ACTIVATED`
   - **Handling:**
     - Use `event.timestamp` to determine order
     - Always apply most recent event
     - Query PayPal API for current subscription state if conflicting

### Subscription Management Edge Cases

10. **User cancels then immediately reactivates**
    - **Issue:** Unclear which state wins
    - **Handling:**
      - Show loading state during reactivation
      - Wait for webhook confirmation before showing "Active" status
      - Use PayPal API to verify current state

11. **Subscription expires while user is mid-session**
    - **Issue:** User completes reflection but tier downgraded
    - **Handling:**
      - Grace period: Allow completing current action
      - Next page load: Show "Subscription expired" message
      - Background job: Check expiry every 5 minutes, log user out if needed

12. **Payment fails mid-billing cycle**
    - **Issue:** User loses access immediately vs. grace period
    - **Handling:**
      - PayPal webhook: `SUBSCRIPTION.SUSPENDED`
      - Set status to `past_due`, keep tier active for 7 days
      - Show banner: "Payment failed. Update billing by [date] to avoid downgrade."
      - After 7 days: Downgrade to free tier

13. **User downgrades from Unlimited to Pro mid-month**
    - **Issue:** Already used 45 reflections, Pro limit is 30
    - **Handling:**
      - Apply downgrade at period end (not immediately)
      - Show message: "Downgrade takes effect on [date]. You'll start with 30/month."
      - Alternative: Prorate and apply immediately with overage forgiveness

14. **User upgrades from Pro to Unlimited mid-month**
    - **Issue:** Charged full price but only gets partial month
    - **Handling:**
      - PayPal handles proration automatically
      - Apply upgrade immediately (optimistic)
      - Show message: "Upgraded! You now have 60 reflections/month. Prorated charge applied."

### Tier Limit Edge Cases

15. **User reaches daily limit (Pro: 1/day)**
    - **Issue:** User wants second reflection today
    - **Handling:**
      - Show error: "You've reached your daily limit (1 reflection). Upgrade to Unlimited for 2/day or try again tomorrow."
      - Countdown timer: "Next reflection available in 14 hours"
      - Upgrade CTA button

16. **User reaches monthly limit (Free: 2/month)**
    - **Issue:** User wants more reflections this month
    - **Handling:**
      - Show error: "You've used all 2 reflections this month. Upgrade to Pro for 30/month."
      - Show next month reset date: "Free reflections reset on [date]"
      - Upgrade CTA button

17. **User tries to access evolution report (free tier)**
    - **Issue:** Feature locked for free tier
    - **Handling:**
      - Show locked overlay on evolution card
      - Message: "Evolution reports are available for Pro and Unlimited tiers"
      - "Upgrade to Pro" button → `/pricing?feature=evolution`

18. **User tries to create visualization (free tier)**
    - **Issue:** Feature locked for free tier
    - **Handling:**
      - Show locked overlay on visualization card
      - Message: "Visualizations are available for Pro and Unlimited tiers"
      - "Upgrade to Pro" button → `/pricing?feature=visualization`

### Database Edge Cases

19. **Database write fails during webhook processing**
    - **Issue:** Webhook processed but database not updated
    - **Handling:**
      - Webhook handler returns 500 error to PayPal
      - PayPal retries webhook (with exponential backoff)
      - Log error for manual investigation
      - Use database transactions to ensure atomicity

20. **User row doesn't exist when updating subscription**
    - **Issue:** User deleted account but subscription still active
    - **Handling:**
      - Webhook handler checks if user exists before updating
      - If not found, cancel subscription via PayPal API
      - Log orphaned subscription for cleanup

### UI/UX Edge Cases

21. **User on slow connection, checkout takes >30 seconds**
    - **Issue:** User thinks checkout failed, clicks back button
    - **Handling:**
      - Show persistent loading spinner: "Creating checkout... This may take up to 30 seconds."
      - Timeout after 45 seconds: "Checkout is taking longer than expected. Please try again."
      - Allow retry without duplicate subscriptions

22. **User closes browser tab during PayPal checkout**
    - **Issue:** Checkout abandoned, unclear state
    - **Handling:**
      - PayPal checkout persists in PayPal account
      - User can complete later from PayPal dashboard
      - App shows no subscription change (correct state)

23. **User receives "past_due" webhook but payment auto-retries and succeeds**
    - **Issue:** User sees "Payment failed" banner briefly
    - **Handling:**
      - Show banner: "Payment issue detected. Retrying..."
      - When `SUBSCRIPTION.ACTIVATED` webhook arrives, hide banner
      - Toast: "Payment successful! Your subscription is active."

24. **User cancels subscription, then tries to upgrade to higher tier**
    - **Issue:** Unclear if this reactivates old tier or creates new subscription
    - **Handling:**
      - Check subscription status before upgrade
      - If `canceled`, create new subscription (not upgrade)
      - Show message: "Creating new subscription for Unlimited tier"

---

## UI Component Changes Required

**Specific components needing modification:**

### 1. Pricing Page (`/app/pricing/page.tsx`)
**Changes:**
- Add `useState` for monthly/yearly toggle
- Add `useMutation` for `createCheckout`
- Add query param handler for `?subscription=success|canceled`
- Update tier data structure (3 tiers, new pricing)
- Add loading states to CTA buttons
- Add current tier check (fetch user via `useAuth`)

**New Components Needed:**
- `<BillingPeriodToggle />` - Monthly/Yearly switch
- `<SavingsBadge />` - "Save $30/year" indicator
- `<CheckoutButton />` - Handles loading + PayPal redirect

### 2. Profile Page (`/app/profile/page.tsx`)
**Changes:**
- Add `useQuery` for `subscriptions.getStatus`
- Add `useMutation` for `subscriptions.cancel`
- Add cancel confirmation modal state
- Expand subscription section with billing details

**New Components Needed:**
- `<SubscriptionDetailsCard />` - Full billing info display
- `<CancelSubscriptionModal />` - Confirmation dialog
- `<BillingActions />` - Cancel/Reactivate/Manage buttons

### 3. Dashboard (`/app/dashboard/page.tsx`)
**Changes:**
- Add conditional banner for upgrade prompts
- Update SubscriptionCard props with new tier data

**New Components Needed:**
- `<UpgradeBanner />` - Contextual upgrade prompts
- `<UsageWarning />` - "Approaching limit" messages
- `<PastDueBanner />` - Payment failure alert

### 4. SubscriptionCard (`/components/dashboard/cards/SubscriptionCard.tsx`)
**Changes:**
- Update tier data structure (3 tiers)
- Fix link: `/subscription` → `/pricing`
- Add daily limit display
- Update benefit lists

### 5. EvolutionCard / VisualizationCard
**Changes:**
- Add locked state overlay
- Add tier check: `if (user.tier === 'free') showLockedState()`
- Add upgrade CTA: "Unlock with Pro"

**New Components Needed:**
- `<FeatureLockedOverlay />` - Reusable locked state component

### 6. TierBadge (`/components/dashboard/shared/TierBadge.tsx`)
**Changes:**
- Update tier colors/icons for 3-tier structure
- Add status indicators (active, canceled, past_due)
- Add animation for tier upgrades

### 7. Navigation (`/components/shared/AppNavigation.tsx`)
**Changes:**
- Add tier badge to user dropdown
- Add "Upgrade" link if free tier
- Add "Billing" link to profile dropdown

### 8. Toast System (`/contexts/ToastContext.tsx`)
**Changes:**
- Add subscription-specific toast variants
- Add auto-dismiss for success states (5 seconds)
- Add persistent toasts for errors (manual dismiss)

### 9. Reflection Form (`/app/reflection/page.tsx`)
**Changes:**
- Add limit check before form submission
- Show daily limit error with countdown
- Show monthly limit error with upgrade CTA

**New Components Needed:**
- `<LimitReachedModal />` - Displays limit type + upgrade option
- `<NextReflectionCountdown />` - Shows time until next daily reset

---

## Data Flow Maps

### Checkout Flow Data Journey

```
User Action (Click "Subscribe to Pro")
  ↓
Frontend: pricing/page.tsx
  ↓
tRPC Mutation: subscriptions.createCheckout({ tier: 'pro', period: 'monthly' })
  ↓
Backend: server/trpc/routers/subscriptions.ts
  ↓
PayPal API: POST /v1/billing/subscriptions
  - Request: { plan_id: PRO_MONTHLY_PLAN_ID, return_url, cancel_url, metadata: { userId, tier } }
  - Response: { id: "I-XXX", links: [{ rel: "approve", href: "https://paypal.com/checkout..." }] }
  ↓
Frontend: Redirect to approval URL
  ↓
PayPal Checkout Page (external)
  - User logs in
  - User approves subscription
  ↓
PayPal Redirects Back: /dashboard?subscription=success&token=XXX
  ↓
Frontend: Dashboard detects query param
  - Optimistic Update: Set user.tier = 'pro' in local state
  - Toast: "Welcome to Pro!"
  ↓
Background: PayPal Webhook Fires
  ↓
Webhook Handler: /app/api/webhooks/paypal/route.ts
  - Verify signature
  - Parse event: BILLING.SUBSCRIPTION.ACTIVATED
  - Extract metadata: { userId, tier }
  ↓
Database Update: Supabase
  - UPDATE users SET tier='pro', subscription_status='active', subscription_id='I-XXX'
  ↓
User Refreshes: Dashboard queries new tier from DB
  - Confirms tier='pro' (webhook confirmed optimistic update)
```

### Cancellation Flow Data Journey

```
User Action (Click "Cancel Subscription" in Profile)
  ↓
Frontend: Confirmation Modal Opens
  - "Are you sure? You'll lose access on [date]"
  ↓
User Confirms
  ↓
tRPC Mutation: subscriptions.cancel()
  ↓
Backend: server/trpc/routers/subscriptions.ts
  - Fetch user's paypal_subscription_id from DB
  ↓
PayPal API: POST /v1/billing/subscriptions/{id}/cancel
  - Request: { reason: "User requested cancellation" }
  - Response: 204 No Content (success)
  ↓
Backend: Update Database (Optimistic)
  - UPDATE users SET subscription_status='canceled', subscription_expires_at=[current_period_end]
  ↓
Frontend: Profile Page Updates
  - Toast: "Subscription canceled. Access until [date]"
  - Show "Reactivate" button
  ↓
Background: PayPal Webhook Fires
  ↓
Webhook Handler: BILLING.SUBSCRIPTION.CANCELLED
  - Confirm cancellation in DB (already updated optimistically)
  - Log event for audit trail
  ↓
On Expiry Date: PayPal Webhook Fires
  ↓
Webhook Handler: BILLING.SUBSCRIPTION.EXPIRED
  - UPDATE users SET tier='free', subscription_status='expired'
  ↓
User Next Login: Dashboard shows free tier
  - Upgrade prompts appear
```

### Payment Failure Flow Data Journey

```
PayPal Auto-Billing (Monthly/Yearly Renewal)
  - Attempt to charge payment method
  - Payment Fails (insufficient funds, expired card)
  ↓
PayPal Webhook Fires
  ↓
Webhook Handler: BILLING.SUBSCRIPTION.SUSPENDED
  - Parse event
  - Extract subscription_id
  ↓
Database Update: Supabase
  - UPDATE users SET subscription_status='past_due'
  ↓
User Next Login: Dashboard detects status
  - Banner: "Payment failed. Update billing to keep Pro access."
  - Link to PayPal portal
  ↓
User Updates Payment Method (in PayPal)
  ↓
PayPal Auto-Retries Payment
  - Payment Succeeds
  ↓
PayPal Webhook Fires
  ↓
Webhook Handler: BILLING.SUBSCRIPTION.ACTIVATED (or PAYMENT.SALE.COMPLETED)
  - UPDATE users SET subscription_status='active'
  ↓
User Refreshes: Dashboard banner disappears
  - Toast: "Payment successful! Your subscription is active."
```

---

## API Integration Points

### Frontend → Backend (tRPC)

**Required tRPC Procedures:**

1. **`subscriptions.createCheckout`**
   - **Input:** `{ tier: 'pro' | 'unlimited', period: 'monthly' | 'yearly' }`
   - **Output:** `{ approvalUrl: string, subscriptionId: string }`
   - **Purpose:** Create PayPal subscription and return checkout URL

2. **`subscriptions.getStatus`**
   - **Input:** None (uses ctx.user)
   - **Output:** `{ tier, status, period, nextBilling, subscriptionId, startedAt, expiresAt, cancelAtPeriodEnd }`
   - **Purpose:** Fetch current subscription details

3. **`subscriptions.cancel`**
   - **Input:** None (uses ctx.user)
   - **Output:** `{ success: boolean, message: string, expiresAt: string }`
   - **Purpose:** Cancel subscription at period end

4. **`subscriptions.reactivate`**
   - **Input:** None (uses ctx.user)
   - **Output:** `{ success: boolean, message: string }`
   - **Purpose:** Reactivate canceled subscription

5. **`subscriptions.changePlan`** (optional for MVP)
   - **Input:** `{ newTier: 'pro' | 'unlimited', newPeriod: 'monthly' | 'yearly' }`
   - **Output:** `{ success: boolean, message: string }`
   - **Purpose:** Upgrade/downgrade subscription

### Backend → PayPal API

**Required PayPal API Calls:**

1. **Create Subscription**
   - **Endpoint:** `POST /v1/billing/subscriptions`
   - **Purpose:** Start checkout flow
   - **Request Body:**
     ```json
     {
       "plan_id": "P-XXX",
       "application_context": {
         "brand_name": "Mirror of Dreams",
         "return_url": "https://app.com/dashboard?subscription=success",
         "cancel_url": "https://app.com/pricing?subscription=canceled"
       },
       "custom_id": "user-{userId}"
     }
     ```
   - **Response:** `{ id: "I-XXX", links: [...] }`

2. **Get Subscription Details**
   - **Endpoint:** `GET /v1/billing/subscriptions/{id}`
   - **Purpose:** Verify subscription state
   - **Response:** Full subscription object with status, billing info

3. **Cancel Subscription**
   - **Endpoint:** `POST /v1/billing/subscriptions/{id}/cancel`
   - **Purpose:** User-initiated cancellation
   - **Request Body:** `{ reason: "User requested cancellation" }`

4. **Suspend Subscription** (not for user-initiated)
   - **Endpoint:** `POST /v1/billing/subscriptions/{id}/suspend`
   - **Purpose:** Admin-only, payment failure handling

5. **Activate Subscription**
   - **Endpoint:** `POST /v1/billing/subscriptions/{id}/activate`
   - **Purpose:** Reactivate suspended subscription

6. **Revise Subscription** (upgrade/downgrade)
   - **Endpoint:** `POST /v1/billing/subscriptions/{id}/revise`
   - **Purpose:** Change plan mid-cycle
   - **Request Body:** `{ plan_id: "P-NEW-PLAN-ID" }`

### PayPal → Backend (Webhooks)

**Required Webhook Events to Handle:**

1. **`BILLING.SUBSCRIPTION.ACTIVATED`**
   - **When:** Subscription starts or reactivates
   - **Action:** Set tier, status='active', store subscription_id
   - **Data:** `{ id, plan_id, status, subscriber, create_time }`

2. **`BILLING.SUBSCRIPTION.CANCELLED`**
   - **When:** User cancels or admin cancels
   - **Action:** Set status='canceled', calculate expires_at
   - **Data:** `{ id, status, status_update_time }`

3. **`BILLING.SUBSCRIPTION.EXPIRED`**
   - **When:** Subscription period ends (after cancellation)
   - **Action:** Downgrade to free tier, status='expired'
   - **Data:** `{ id, status }`

4. **`BILLING.SUBSCRIPTION.SUSPENDED`**
   - **When:** Payment failure
   - **Action:** Set status='past_due', show banner
   - **Data:** `{ id, status }`

5. **`PAYMENT.SALE.COMPLETED`** (optional)
   - **When:** Successful payment
   - **Action:** Log payment, update last_billing_date
   - **Data:** `{ id, amount, create_time }`

6. **`BILLING.SUBSCRIPTION.UPDATED`** (optional)
   - **When:** Plan change or modification
   - **Action:** Update tier/period if changed
   - **Data:** `{ id, plan_id, status }`

### Database Updates (Supabase)

**User Table Columns to Update:**

- `tier` - 'free' | 'pro' | 'unlimited'
- `subscription_status` - 'active' | 'canceled' | 'expired' | 'past_due'
- `subscription_id` - PayPal subscription ID (I-XXX)
- `subscription_period` - 'monthly' | 'yearly'
- `subscription_started_at` - Timestamp when subscription began
- `subscription_expires_at` - Timestamp when access ends (for canceled)
- `paypal_subscription_id` - Explicit PayPal field (or reuse subscription_id)
- `updated_at` - Auto-update timestamp

**Migration Required:**
- Rename tier values: 'essential' → 'pro', 'premium' → 'unlimited'
- Add `paypal_subscription_id` column (or rename from stripe_subscription_id)
- Remove/deprecate `stripe_customer_id`, `stripe_subscription_id`

---

## Recommendations for Master Plan

1. **Prioritize Webhook Reliability**
   - Webhook handler is critical - must be idempotent and robust
   - Implement retry logic and error logging from day 1
   - Test thoroughly with PayPal webhook simulator before going live
   - Consider webhook event database table for audit trail

2. **Implement Optimistic UI Updates**
   - Don't wait for webhooks to update tier badges
   - Show new tier immediately after PayPal redirect
   - Reduces perceived latency and improves UX
   - Webhook confirmation validates optimistic update

3. **Plan for Edge Cases Early**
   - Payment failures, webhook delays, duplicate events are common
   - Build error recovery flows before MVP launch
   - Grace periods for past_due subscriptions prevent user frustration
   - Manual admin intervention tools needed for production

4. **Simplify Tier Structure**
   - 3 tiers (Free, Pro, Unlimited) is correct scope
   - Daily limits are unique differentiator (1/day vs 2/day)
   - Evolution/visualization gating is clear value proposition
   - Avoid 4th tier until user demand proves need

5. **Phase the Implementation**
   - **Phase 1:** Core checkout flow (pricing → PayPal → webhook → dashboard)
   - **Phase 2:** Subscription management (cancel, reactivate, status display)
   - **Phase 3:** Tier gating (evolution/viz locks, daily limits)
   - **Phase 4:** Polish (upgrade prompts, usage warnings, error states)
   - Don't try to build everything in one iteration

6. **Test with Real PayPal Sandbox**
   - Don't mock PayPal API - use real sandbox from start
   - Test full redirect flow (not just API calls)
   - Verify webhook signature validation works
   - Test edge cases: failed payments, cancellations, upgrades

7. **Design for Payment Provider Flexibility**
   - Abstract payment logic behind `subscriptions` router
   - Use generic `subscription_id` field (not hardcoded to PayPal)
   - Makes future Stripe/crypto integration easier
   - PayPal-specific logic isolated to `lib/paypal.ts` and webhook handler

8. **User Communication is Critical**
   - Clear messaging on every state: success, error, pending
   - Show "what happens next" guidance after actions
   - Countdown timers for daily limit resets
   - Email notifications for billing events (post-MVP but important)

9. **Monitor Conversion Funnel**
   - Track: pricing page views → checkout clicks → PayPal redirects → successful subscriptions
   - Identify drop-off points (e.g., too many clicks to checkout?)
   - A/B test pricing display (monthly vs yearly default)
   - Use analytics to optimize upgrade prompts

10. **Plan for Scale from Day 1**
    - Webhook handler must handle 100s of events/minute
    - Use database connection pooling
    - Cache subscription status queries (5-minute TTL)
    - Consider background job queue for webhook processing (overkill for MVP but good to know)

---

## Technology Recommendations

### PayPal Integration Approach

**Recommended:** Direct REST API calls (no SDK)
- **Pros:** Full control, no dependency bloat, latest API features
- **Cons:** More boilerplate, manual type definitions
- **Implementation:** `lib/paypal.ts` with `fetch` wrappers

**Alternative:** `@paypal/checkout-server-sdk`
- **Pros:** Typed SDK, handles auth token refresh
- **Cons:** Outdated (last updated 2021), limited subscription API support
- **Verdict:** Avoid for subscriptions API

### State Management

**Recommended:** Server state (tRPC + React Query) + Local state (useState)
- **Tier data:** Fetched via tRPC `subscriptions.getStatus`, cached by React Query
- **UI state:** Modal open/close, loading states - local useState
- **Optimistic updates:** React Query mutations with `onMutate`
- **No need for:** Redux, Zustand, Jotai (overkill for this scope)

### Error Handling

**Recommended:** Centralized error boundary + toast notifications
- **API errors:** tRPC error codes mapped to user-friendly messages
- **Network errors:** Retry button + "Check your connection" message
- **Webhook errors:** Log to database + admin alert (email/Slack)
- **User errors:** Inline validation + helpful guidance

### Testing Strategy

**Phase 1 - Manual Testing (MVP):**
- Full checkout flow in PayPal sandbox
- Test all webhook events with PayPal webhook simulator
- Edge case testing: double-click, refresh, back button

**Phase 2 - Automated Testing (Post-MVP):**
- Unit tests: Webhook handler logic (idempotency, signature verification)
- Integration tests: tRPC procedures with mocked PayPal API
- E2E tests: Playwright for full checkout flow (with PayPal sandbox)

---

## Notes & Observations

### Existing Stripe Infrastructure
- **Current state:** Stripe SDK installed, webhook handler exists but disabled
- **Comment in code:** "Stripe temporarily disabled - will be replaced with PayPal"
- **Opportunity:** Use Stripe webhook handler as template for PayPal
- **Action:** Delete Stripe code or keep as reference? Recommend **keep commented** for future multi-provider support

### Database Schema is Subscription-Ready
- **User table:** Already has `subscription_status`, `subscription_period`, `subscription_id` columns
- **No migration needed:** Can rename `subscription_id` to point to PayPal instead of Stripe
- **Optional:** Add explicit `paypal_subscription_id` column for clarity
- **Tier enum:** Needs migration to rename 'essential' → 'pro', 'premium' → 'unlimited'

### Tier Limits Mismatch in Codebase
- **Vision:** Free (2/month), Pro (30/month, 1/day), Unlimited (60/month, 2/day)
- **Current constants.ts:** Free (10), Essential (50), Premium (Infinity)
- **Pricing page display:** Free (10), Premium (50), Pro (Unlimited)
- **Action Required:** Update `TIER_LIMITS` constant to match vision exactly

### Daily Limit Implementation Missing
- **Vision requirement:** Pro (1/day), Unlimited (2/day)
- **Current code:** No daily limit tracking in database or logic
- **Implementation needed:**
  - Add `last_reflection_date` column to users table
  - Check `reflection_count_today` before allowing new reflection
  - Reset counter at midnight UTC (or user's timezone)

### Evolution/Visualization Gating Partially Implemented
- **Evolution reports:** Code exists but no tier check visible
- **Visualizations:** Code exists but no tier check visible
- **Needs:** Add `if (user.tier === 'free') return <LockedState />` to both cards
- **Opportunity:** Create reusable `<TierGate>` component for all gated features

### Demo User Flag Exists
- **Observation:** `user.isDemo` flag in types and profile page
- **Purpose:** Likely for demo account that can't modify settings
- **Question:** Should demo user be able to access checkout? Probably **no** (show "Sign up for real account" instead)

### UX Friction Point: No Logged-In State on Pricing Page
- **Current:** Pricing page doesn't check auth, shows generic CTAs
- **Better UX:** If logged in, show "Current Plan" badge and disable that tier's button
- **Even better:** Pre-fill PayPal checkout with user's email
- **Action:** Add `useAuth()` hook to pricing page

### Yearly Billing Savings Not Prominent
- **Vision:** $150/yr saves $30 (Pro), $290/yr saves $58 (Unlimited)
- **Current:** FAQ mentions annual billing but no UI toggle
- **Recommendation:** Add prominent toggle above tier cards: "Monthly / **Yearly (Save 17%)**"
- **Design:** Make yearly the default (higher LTV, lower churn)

### PayPal Plan IDs Need Creation
- **Vision:** 4 plan IDs needed (Pro Monthly/Yearly, Unlimited Monthly/Yearly)
- **Current:** `.env.example` has placeholders for Essential/Premium (wrong names)
- **Action:** Use PayPal dashboard or MCP to create 4 new subscription plans
- **Store:** Plan IDs in environment variables (sandbox + production)

### Webhook Security Critical
- **PayPal provides:** Webhook signature verification
- **Must implement:** Signature validation in webhook handler
- **Reference:** Stripe webhook handler has good signature verification pattern
- **Action:** Copy signature verification logic, adapt for PayPal format

### Grace Period for Past Due Subscriptions
- **Not in vision:** But important for UX
- **Recommendation:** 7-day grace period after payment failure
- **Implementation:**
  - `SUBSCRIPTION.SUSPENDED` webhook → Set `subscription_grace_until = NOW() + 7 days`
  - Show banner: "Payment issue. Update billing by [date] to avoid downgrade."
  - After 7 days: Downgrade to free tier
- **PayPal behavior:** Check if PayPal auto-retries payments (they usually do)

### Mobile Responsiveness of Pricing Page
- **Current:** Responsive grid for tier cards
- **Concern:** PayPal checkout modal on mobile?
- **PayPal behavior:** Opens in-app or redirects to mobile PayPal app
- **Action:** Test on real mobile device in sandbox before launch

### Analytics Needed
- **Track:** Conversion rate (pricing views → checkouts → successful subscriptions)
- **Track:** Drop-off points (checkout clicks vs PayPal returns)
- **Track:** Churn rate (cancellations per month)
- **Track:** Upgrade paths (Free → Pro → Unlimited progression)
- **Implementation:** Add event tracking to checkout flow (PostHog, Mixpanel, or custom)

---

**Exploration completed:** 2025-11-30

**This report informs master planning decisions for PayPal subscription integration with focus on user experience, integration complexity, and edge case handling.**
