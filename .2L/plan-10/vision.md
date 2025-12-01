# Project Vision: Production Readiness & Cleanup

**Created:** 2025-12-01
**Plan:** plan-10

---

## Problem Statement

Mirror of Dreams has core features implemented but needs final polish before production launch. There are several issues that need addressing:

1. **Stripe remnants** - We've moved to PayPal-only but Stripe code/dependencies remain
2. **Demo user bugs** - Reflections page throws errors, missing data fields
3. **Data integrity issues** - Seed script doesn't populate all required fields
4. **Code quality** - Null/undefined handling gaps, potential runtime errors

**Current pain points:**
- Demo user experience is broken (reflections error)
- Dead code (Stripe) adds confusion and bundle size
- Potential runtime errors from missing null checks
- Inconsistent data handling between seed script and type definitions

---

## Target Users

**Primary user:** Demo visitors exploring the app
- Need seamless experience to understand the product
- Should see fully populated, realistic data

**Secondary users:** Paying subscribers
- Need reliable, error-free experience
- Payment flow must work flawlessly (PayPal only)

---

## Core Value Proposition

Clean, stable, production-ready application with single payment provider (PayPal) and polished demo experience.

**Key benefits:**
1. Reduced codebase complexity (remove Stripe)
2. Bug-free demo user experience
3. Production-ready error handling

---

## Feature Breakdown

### Must-Have (MVP)

1. **Remove Stripe Completely**
   - Description: Remove all Stripe code, dependencies, types, webhooks, and references
   - User story: As a developer, I want a single payment provider so the codebase is simpler
   - Acceptance criteria:
     - [ ] Delete `app/api/webhooks/stripe/route.ts`
     - [ ] Remove `stripe` from `package.json` dependencies
     - [ ] Remove any Stripe-related types/interfaces
     - [ ] Remove Stripe environment variables from `.env.example`
     - [ ] Update any UI that references Stripe
     - [ ] Clean up database schema if Stripe columns exist
     - [ ] Run `npm install` to update lock file

2. **Fix Demo User Reflections**
   - Description: Fix the error when viewing reflections for demo user
   - User story: As a demo visitor, I want to view reflections without errors
   - Acceptance criteria:
     - [ ] Investigate and fix the specific error
     - [ ] Update seed script to populate ALL required fields:
       - `estimated_read_time` (calculate from word count)
       - `title` (generate from dream title)
       - `tags` (add relevant tags)
     - [ ] Re-run seed script to update demo data
     - [ ] Verify all reflection pages work without errors

3. **Fix Null/Undefined Display Issues**
   - Description: Fix components that display undefined values
   - User story: As a user, I don't want to see "undefined" or "null" in the UI
   - Acceptance criteria:
     - [ ] Fix `ReflectionCard.tsx:104` - `estimatedReadTime` null handling
     - [ ] Fix `app/reflections/[id]/page.tsx:290` - same issue
     - [ ] Audit all components for similar issues
     - [ ] Add fallback values or conditional rendering

4. **Update Reflection Type Definitions**
   - Description: Make optional fields properly typed
   - User story: As a developer, I want types to reflect reality
   - Acceptance criteria:
     - [ ] Update `Reflection` interface - make `title`, `tags`, `estimatedReadTime` optional or nullable
     - [ ] Update `reflectionRowToReflection` to handle nulls gracefully
     - [ ] Ensure TypeScript catches potential null access

### Should-Have (Post-MVP)

1. **Error Boundary Components** - Wrap major sections with error boundaries
2. **Loading State Audit** - Ensure all async operations have loading states
3. **PayPal Flow Testing** - End-to-end test of subscription flow

### Could-Have (Future)

1. **Automated E2E Tests** - Playwright tests for critical flows
2. **Performance Monitoring** - Add basic analytics/monitoring
3. **SEO Improvements** - Meta tags, Open Graph, etc.

---

## User Flows

### Flow 1: Demo User Viewing Reflections

**Steps:**
1. User logs in as demo user
2. User navigates to Reflections page
3. System displays list of reflections with proper data
4. User clicks on a reflection
5. System shows full reflection detail

**Edge cases:**
- Empty reflections: Show friendly empty state
- Missing fields: Display graceful fallbacks

**Error handling:**
- API error: Show error message with retry button
- Not found: Show "reflection not found" message

### Flow 2: Subscription with PayPal (existing)

**Steps:**
1. User clicks upgrade on pricing page
2. System redirects to PayPal
3. User completes payment
4. PayPal webhook updates user tier
5. User sees success page

**Edge cases:**
- Payment cancelled: Return to pricing
- Webhook delay: Show pending state

---

## Data Model Overview

**Key changes:**

1. **Reflections Table**
   - Ensure `estimated_read_time`, `title`, `tags` have proper defaults
   - Seed script must populate these fields

2. **Users Table**
   - Remove any Stripe-specific columns if present (`stripe_customer_id`, `stripe_subscription_id`)

3. **Subscriptions Table**
   - Should only have PayPal-related fields

---

## Technical Requirements

**Must support:**
- PayPal as sole payment provider
- Demo user with complete, viewable data
- Clean type definitions matching database reality

**Constraints:**
- No breaking changes to existing PayPal flow
- Maintain existing user data integrity

**Preferences:**
- Keep changes minimal and focused
- Test each fix individually

---

## Success Criteria

**The plan is successful when:**

1. **Stripe fully removed**
   - Metric: No files or dependencies reference Stripe
   - Target: 0 Stripe references in source code (excluding .2L docs)

2. **Demo reflections work**
   - Metric: Can view all demo reflections without errors
   - Target: 100% of reflection pages load successfully

3. **No undefined displays**
   - Metric: UI audit for undefined/null text
   - Target: 0 instances of "undefined" or "null" visible to users

4. **Clean build**
   - Metric: `npm run build` succeeds
   - Target: Build passes with no type errors

---

## Out of Scope

**Explicitly not included:**
- Adding new features
- Major refactoring beyond fixes
- Performance optimization
- New payment providers
- Mobile app considerations

**Why:** Focus is purely on stability and cleanup for production launch

---

## Assumptions

1. PayPal integration from plan-9 is working correctly
2. Demo user exists in database (seeded previously)
3. No other payment provider will be added soon

---

## Open Questions

1. Are there any Stripe-related database columns that need migration to remove?
2. Should we add a database migration to clean up Stripe columns?
3. Do we need to handle existing users who might have Stripe data?

---

## Files to Modify/Delete

### Delete:
- `app/api/webhooks/stripe/route.ts`

### Modify:
- `package.json` - remove stripe dependency
- `.env.example` - remove Stripe env vars
- `types/reflection.ts` - fix nullable types
- `scripts/seed-demo-user.ts` - add missing fields
- `components/reflections/ReflectionCard.tsx` - null handling
- `app/reflections/[id]/page.tsx` - null handling

### Verify:
- `supabase/migrations/*` - check for Stripe columns
- `types/subscription.ts` - remove Stripe types if any
- `types/user.ts` - remove Stripe fields if any

---

## Next Steps

- [ ] Review and refine this vision
- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
