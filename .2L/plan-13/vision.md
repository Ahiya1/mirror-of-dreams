# Project Vision: Critical UX Fixes & Messaging Alignment

**Created:** 2025-12-03T19:15:00Z
**Plan:** plan-13

---

## Problem Statement

Mirror of Dreams has several critical issues that break user experience and misrepresent the product's value:

1. **Landing page promises the OPPOSITE of what the product delivers** - Claims to break dreams into "action plans" when the product actually provides reflective insights for self-recognition
2. **Users cannot upgrade** - The Upgrade button leads to a broken deprecated page
3. **Mobile layout is broken** - Content overflows horizontally on the homepage
4. **Free tier limits are not properly communicated** - New users don't see their actual limits (2 reflections, 2 dreams, no evolution/visualizations)

**Current pain points:**
- Users are misled by landing page messaging (expecting action plans, getting reflections)
- The Upgrade button in AppNavigation goes to `/subscription` which is a static HTML file using deprecated Stripe integration
- Homepage content slips to the right on mobile devices
- Free tier users aren't shown their actual feature limits in the onboarding/demo experience

---

## Target Users

**Primary user:** Free tier users exploring the product
- First-time visitors reading the landing page
- Demo users trying the product
- Free users wanting to upgrade to paid tiers

---

## Core Value Proposition

Mirror of Dreams provides **clarity through reflection** - an AI mirror that reflects your thoughts back to you for deeper self-understanding, NOT action plans.

**Key benefits:**
1. Self-discovery through reflective dialogue
2. Recognition of your own truth and inner wisdom
3. A gentle truth-telling companion that asks questions you haven't considered

---

## Feature Breakdown

### Must-Have (MVP)

1. **Fix Landing Page Messaging**
   - Description: Replace misleading "action plan" messaging with accurate "clarity through reflection" positioning
   - User story: As a visitor, I want to understand what Mirror of Dreams actually offers so I can decide if it's right for me
   - Location: `app/page.tsx` lines 25-50
   - Acceptance criteria:
     - [ ] Remove "From Vague Aspiration to Clear Action Plan" messaging
     - [ ] Replace with messaging about self-reflection and clarity
     - [ ] Update the SaaS example to something that fits the reflective nature
     - [ ] Ensure all 3 feature cards accurately represent the product

2. **Fix Upgrade Button & Subscription Flow**
   - Description: Route Upgrade button to working /pricing page instead of broken /subscription
   - User story: As a free user, I want to upgrade my subscription so I can access more features
   - Locations:
     - `components/shared/AppNavigation.tsx` line 205 (upgrade button)
     - `components/shared/AppNavigation.tsx` line 281 (dropdown upgrade link)
     - `public/subscription/index.html` (deprecated, should be deleted or redirected)
   - Acceptance criteria:
     - [ ] Change Upgrade button to route to `/pricing` instead of `/subscription`
     - [ ] Change dropdown "Upgrade" link to route to `/pricing`
     - [ ] Either delete `public/subscription/index.html` or add redirect to /pricing
     - [ ] Verify PayPal checkout flow works from /pricing page

3. **Fix Homepage Horizontal Overflow**
   - Description: Fix CSS issue causing content to slip right on mobile
   - User story: As a mobile user, I want to see the full dashboard without horizontal scrolling
   - Location: `styles/dashboard.css` and dashboard components
   - Acceptance criteria:
     - [ ] Identify the specific element(s) causing horizontal overflow
     - [ ] Fix CSS to prevent content from exceeding viewport width
     - [ ] Test on multiple mobile screen sizes (320px, 375px, 414px)
     - [ ] Ensure no horizontal scroll bar appears

4. **Show Correct Free Tier Limits**
   - Description: Ensure free users see accurate feature limits in the UI
   - User story: As a free user, I want to know my limits (2 reflections, 2 dreams) so I understand what I can do
   - Locations:
     - Dashboard subscription card
     - Onboarding flow
     - Demo user experience
   - Acceptance criteria:
     - [ ] Free users see "2 reflections per month" limit clearly
     - [ ] Free users see "2 active dreams" limit clearly
     - [ ] Evolution reports show as locked/unavailable for free tier
     - [ ] Visualizations show as locked/unavailable for free tier
     - [ ] Demo mode shows accurate free tier limitations

---

## Technical Requirements

**Files to modify:**
- `app/page.tsx` - Landing page messaging
- `components/shared/AppNavigation.tsx` - Upgrade button routing
- `styles/dashboard.css` - Horizontal overflow fix
- `components/dashboard/cards/SubscriptionCard.tsx` - Free tier limits display
- `public/subscription/index.html` - Delete or redirect

**Files to reference:**
- `lib/utils/constants.ts` - Contains TIER_LIMITS, DREAM_LIMITS definitions
- `app/pricing/page.tsx` - The working pricing page with PayPal checkout

**Constraints:**
- Must use PayPal for payments (not Stripe)
- Must not break existing authenticated user flows
- Must maintain mobile-first responsive design

---

## Success Criteria

**The plan is successful when:**

1. **Landing page is truthful**
   - Metric: All 3 feature cards accurately describe reflective (not action-planning) features
   - Target: Zero misleading claims about "action plans" or "concrete steps"

2. **Users can upgrade**
   - Metric: Clicking Upgrade button leads to functional checkout
   - Target: 100% of upgrade button clicks reach /pricing page with working PayPal

3. **No horizontal overflow**
   - Metric: Test on mobile viewports
   - Target: Zero horizontal scroll on viewports 320px and wider

4. **Free tier limits are visible**
   - Metric: Free/demo users can see their limits
   - Target: "2 reflections" and "2 dreams" limits visible in dashboard

---

## Out of Scope

**Explicitly not included:**
- Complete landing page redesign (just fix messaging)
- New subscription management page (just fix routing)
- Payment provider changes (keep PayPal)
- New features or tiers

**Why:** This is a focused bug-fix and alignment iteration, not a feature addition.

---

## Assumptions

1. The /pricing page with PayPal checkout is working correctly
2. The TIER_LIMITS in constants.ts are accurate (2 reflections, 2 dreams for free)
3. The horizontal overflow is a CSS issue, not a JavaScript rendering issue

---

## Open Questions

1. Should `public/subscription/index.html` be deleted entirely or converted to a redirect?
2. Are there other places in the app that link to /subscription that need updating?

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
