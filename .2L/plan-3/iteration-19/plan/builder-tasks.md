# Builder Task Breakdown

## Overview
2 primary builders will work in parallel on Iteration 19.
Estimated complexity is MEDIUM due to surgical database fixes and testing requirements.
No builder splits expected - tasks are focused and well-scoped.

## Builder Assignment Strategy
- Builder-1: Database schema fixes, admin user, tier alignment (backend)
- Builder-2: Dashboard refactoring, core flow testing (frontend + validation)
- Minimal dependencies between builders
- Each builder produces testing report documenting findings

---

## Builder-1: Database Schema & Admin Foundation

### Scope
Fix critical database schema issues, create admin user, align tier limits with vision, and ensure all database functions work correctly.

### Complexity Estimate
**MEDIUM**

### Success Criteria
- [ ] Usage tracking schema fixed (month_year TEXT → month DATE)
- [ ] Admin user created with correct permissions (ahiya.butman@gmail.com)
- [ ] Admin can sign in successfully
- [ ] Reflection tier limits corrected (Free: 4/month, not 1/month)
- [ ] Tier structure aligned (Free/Optimal only, or document 4-tier mapping)
- [ ] All database functions tested and working
- [ ] Testing report documents schema changes and admin access

### Files to Create/Modify

**Create:**
- `supabase/migrations/20251112000000_fix_usage_tracking.sql` - Schema fix migration
- `.2L/plan-3/iteration-19/build/builder-1-report.md` - Testing report

**Modify:**
- `server/trpc/routers/reflections.ts` - Fix tier limit constants
- `server/trpc/routers/dreams.ts` - Clarify tier structure (optional)
- `server/lib/cost-calculator.ts` - Update tier names if needed

**Test:**
- `scripts/create-admin-user.js` - Run to create admin user

### Dependencies
**Depends on:** None (can start immediately)
**Blocks:** None (Builder-2 can work in parallel)

### Implementation Notes

#### Task 1.1: Fix Usage Tracking Schema (Priority 1 - CRITICAL)

**Problem:** The `usage_tracking` table has `month_year` column (TEXT) but database functions expect `month` column (DATE). This breaks evolution report and visualization generation.

**Solution:** Create migration to rename and convert column type.

**Migration File:** `supabase/migrations/20251112000000_fix_usage_tracking.sql`

```sql
-- Fix usage_tracking table schema mismatch
-- This allows increment_usage_counter and limit check functions to work

-- Step 1: Rename column
ALTER TABLE usage_tracking RENAME COLUMN month_year TO month;

-- Step 2: Convert TEXT to DATE
-- Assumes existing data is in 'YYYY-MM' format
ALTER TABLE usage_tracking ALTER COLUMN month TYPE DATE
  USING to_date(month, 'YYYY-MM');

-- Step 3: Update unique constraint
ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_month_year_key;
ALTER TABLE usage_tracking ADD CONSTRAINT usage_tracking_user_id_month_key
  UNIQUE (user_id, month);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN usage_tracking.month IS 'Usage tracking month (first day of month, YYYY-MM-01 format)';

-- Verify schema
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'usage_tracking' AND column_name = 'month';
```

**Testing:**
```bash
# Run migration
supabase db reset  # Or apply migration manually

# Test increment function
psql "postgresql://postgres:postgres@127.0.0.1:54332/postgres" -c "
  SELECT increment_usage_counter(
    '875311d0-bc6b-46a3-bf98-bc29a387a978',
    '2025-11-01'::DATE,
    'reflections'
  );
"

# Verify data
psql "postgresql://postgres:postgres@127.0.0.1:54332/postgres" -c "
  SELECT * FROM usage_tracking;
"
```

**Success Indicator:** No SQL errors when calling increment_usage_counter or check_evolution_limit functions.

---

#### Task 1.2: Create Admin User (Priority 2)

**Goal:** Create admin user with email ahiya.butman@gmail.com, password dream_lake, and flags is_admin=true, is_creator=true.

**Script:** `scripts/create-admin-user.js` (already exists)

**Execution:**
```bash
cd /home/ahiya/mirror-of-dreams
node scripts/create-admin-user.js
```

**Expected Output:**
```
User already exists
OR
Admin user created successfully:
Email: ahiya.butman@gmail.com
ID: [uuid]
Tier: premium
```

**Verification:**
```bash
# Check user in database
psql "postgresql://postgres:postgres@127.0.0.1:54332/postgres" -c "
  SELECT email, tier, is_admin, is_creator, subscription_status
  FROM users
  WHERE email = 'ahiya.butman@gmail.com';
"
```

**Expected Result:**
```
email                    | tier    | is_admin | is_creator | subscription_status
------------------------|---------|----------|------------|-------------------
ahiya.butman@gmail.com  | premium | true     | true       | active
```

**Test Sign In:**
```bash
# Via tRPC endpoint (or use UI)
curl -X POST http://localhost:3000/api/trpc/auth.signin \
  -H "Content-Type: application/json" \
  -d '{"email":"ahiya.butman@gmail.com","password":"dream_lake"}'
```

**Success Indicator:** Returns JWT token without errors. User can access dashboard.

---

#### Task 1.3: Align Tier Limits with Vision (Priority 3)

**Problem:** Vision says Free tier gets 4 reflections/month, but code says 1 reflection/month.

**Decision Required:** Confirm tier structure:
- **Option A:** Use only Free/Optimal (2 tiers as per vision)
- **Option B:** Keep 4 tiers (free/essential/optimal/premium) and document mapping
- **Option C:** Map "optimal" in vision = "premium" in code

**Recommendation:** Option B (keep 4 tiers) with these limits:

```typescript
// Tier limits aligned with vision
const TIER_LIMITS = {
  free: {
    dreams: 2,
    reflections: 4,  // Changed from 1
    evolution: 1,
    visualizations: 1,
    context: 4,
    thinking: false
  },
  essential: {
    dreams: 5,
    reflections: 10,
    evolution: 3,
    visualizations: 3,
    context: 6,
    thinking: false
  },
  optimal: {
    dreams: 7,
    reflections: 30,
    evolution: 6,
    visualizations: 6,
    context: 9,
    thinking: true
  },
  premium: {
    dreams: 999999,
    reflections: 999999,
    evolution: 999999,
    visualizations: 999999,
    context: 12,
    thinking: true
  }
};
```

**Files to Update:**

1. **`server/trpc/routers/reflections.ts`** (Line ~238):
```typescript
// OLD:
const TIER_LIMITS = {
  free: 1,
  essential: 5,
  premium: 10
};

// NEW:
const TIER_LIMITS = {
  free: 4,        // Aligned with vision
  essential: 10,   // Between free and optimal
  optimal: 30,     // Aligned with vision
  premium: 999999  // Unlimited for admin
};
```

2. **`server/trpc/routers/dreams.ts`** (verify limits are correct):
```typescript
// Should already be:
const DREAM_LIMITS = {
  free: 2,
  essential: 5,
  optimal: 7,
  premium: 999999
};
```

3. **`server/lib/cost-calculator.ts`** (update thinking budget if needed):
```typescript
// Should be:
export function getThinkingBudget(tier: string): number {
  const budgets = {
    free: 0,
    essential: 0,
    optimal: 10000,
    premium: 10000
  };
  return budgets[tier] || 0;
}
```

**Testing:**
- Create test user with free tier
- Try creating 5 reflections in one month
- 4 should succeed, 5th should fail with "limit reached" error
- Verify error message is user-friendly

**Success Indicator:** Free tier users can create 4 reflections/month (not 1).

---

#### Task 1.4: Test All Database Functions (Priority 4)

**Goal:** Verify all database functions work after schema fix.

**Functions to Test:**
1. `check_dream_limit(user_uuid)`
2. `check_reflection_limit(user_uuid)`
3. `check_evolution_limit(p_user_id, p_user_tier, p_report_type)`
4. `check_visualization_limit(p_user_id, p_user_tier, p_viz_type)`
5. `increment_usage_counter(p_user_id, p_month, p_counter_name)`

**Test Script:**
```bash
# Test check_dream_limit
psql "postgresql://postgres:postgres@127.0.0.1:54332/postgres" -c "
  SELECT check_dream_limit('875311d0-bc6b-46a3-bf98-bc29a387a978');
"

# Test check_reflection_limit
psql "postgresql://postgres:postgres@127.0.0.1:54332/postgres" -c "
  SELECT check_reflection_limit('875311d0-bc6b-46a3-bf98-bc29a387a978');
"

# Test increment_usage_counter
psql "postgresql://postgres:postgres@127.0.0.1:54332/postgres" -c "
  SELECT increment_usage_counter(
    '875311d0-bc6b-46a3-bf98-bc29a387a978',
    '2025-11-01'::DATE,
    'reflections'
  );
"

# Verify counter incremented
psql "postgresql://postgres:postgres@127.0.0.1:54332/postgres" -c "
  SELECT * FROM usage_tracking WHERE user_id = '875311d0-bc6b-46a3-bf98-bc29a387a978';
"

# Test evolution limit check
psql "postgresql://postgres:postgres@127.0.0.1:54332/postgres" -c "
  SELECT check_evolution_limit(
    '875311d0-bc6b-46a3-bf98-bc29a387a978',
    'premium',
    'dream_specific'
  );
"
```

**Success Indicator:** All functions return expected results without SQL errors.

---

### Patterns to Follow
Reference patterns from `patterns.md`:
- Use **Database Function Call Pattern** for testing RPC functions
- Use **Migration Pattern** for schema fix
- Follow **Naming Conventions** for SQL files
- Document all changes in testing report

### Testing Requirements
- All database functions execute without errors
- Admin user can sign in via API and UI
- Tier limits enforce correctly (test with free tier user)
- Schema migration is reversible (document rollback)
- Coverage: 100% of database functions tested

### Builder-1 Testing Report Template

Create file: `.2L/plan-3/iteration-19/build/builder-1-report.md`

```markdown
# Builder-1 Testing Report

## Schema Migration Results

### Usage Tracking Fix
- [ ] Migration file created
- [ ] Migration applied successfully
- [ ] Column renamed: month_year → month
- [ ] Column type converted: TEXT → DATE
- [ ] Unique constraint updated
- [ ] Existing data preserved

**SQL Output:**
\`\`\`
[Paste migration output here]
\`\`\`

**Issues Encountered:**
[Any problems during migration]

---

## Admin User Creation

- [ ] Script executed successfully
- [ ] User exists in database
- [ ] Email: ahiya.butman@gmail.com
- [ ] ID: [paste UUID]
- [ ] Tier: premium
- [ ] is_admin: true
- [ ] is_creator: true
- [ ] subscription_status: active

**Sign In Test:**
- [ ] Can sign in via API
- [ ] Receives valid JWT token
- [ ] Can access dashboard
- [ ] Has admin permissions

**Issues Encountered:**
[Any problems with admin user]

---

## Tier Limits Alignment

### Changes Made:
- Updated reflections.ts: free tier limit 1 → 4
- [List other files changed]

### Testing Results:
- [ ] Free tier user can create 4 reflections
- [ ] 5th reflection blocked with error
- [ ] Error message is user-friendly
- [ ] Optimal tier has 30 reflections limit

**Issues Encountered:**
[Any problems with tier limits]

---

## Database Functions Testing

### check_dream_limit
- [ ] Executed without errors
- [ ] Returns boolean correctly
- [ ] Enforces tier limits

### check_reflection_limit
- [ ] Executed without errors
- [ ] Returns boolean correctly
- [ ] Enforces monthly limits

### increment_usage_counter
- [ ] Executed without errors
- [ ] Increments counter correctly
- [ ] Creates row if not exists
- [ ] Handles month parameter (DATE type)

### check_evolution_limit
- [ ] Executed without errors
- [ ] Returns boolean correctly
- [ ] Enforces monthly limits

### check_visualization_limit
- [ ] Executed without errors
- [ ] Returns boolean correctly
- [ ] Enforces monthly limits

**All Test Output:**
\`\`\`
[Paste SQL test outputs here]
\`\`\`

---

## Rollback Plan

If migration fails:
\`\`\`sql
-- Rollback script
ALTER TABLE usage_tracking RENAME COLUMN month TO month_year;
ALTER TABLE usage_tracking ALTER COLUMN month_year TYPE TEXT;
-- [Complete rollback steps]
\`\`\`

---

## Summary

**Status:** [SUCCESS / PARTIAL / FAILED]

**What Works:**
- [List successful items]

**What's Broken:**
- [List any remaining issues]

**Next Steps:**
- [Recommendations for integration or fixes]

**Estimated Time:** [Actual time spent]
```

---

## Builder-2: Dashboard Refactoring & Core Flow Testing

### Scope
Simplify dashboard data fetching, test all core user flows end-to-end, fix console errors, and document current state for Iteration 20.

### Complexity Estimate
**MEDIUM**

### Success Criteria
- [ ] Dashboard data consolidation refactored (remove dual fetching)
- [ ] Auth flow tested end-to-end (signup → signin → dashboard)
- [ ] Dreams CRUD tested (create → view → edit → archive)
- [ ] Reflection flow tested (5 questions → AI response → save)
- [ ] Dashboard loads without errors
- [ ] Zero critical console errors
- [ ] Testing report documents all flow results
- [ ] State documentation created for Iteration 20

### Files to Modify

**Modify:**
- `hooks/useDashboard.ts` - Simplify or remove (major refactoring)
- `app/dashboard/page.tsx` - Update to use simplified data fetching
- `components/dashboard/cards/*.tsx` - Ensure cards fetch independently
- `app/dreams/[id]/page.tsx` - Add dreamId filter to reflections query (minor fix)

**Create:**
- `.2L/plan-3/iteration-19/build/builder-2-report.md` - Testing report
- `.2L/plan-3/iteration-19/build/current-state.md` - State documentation

### Dependencies
**Depends on:** None (can start immediately)
**Blocks:** Iteration 20 planning (needs current state doc)

### Implementation Notes

#### Task 2.1: Dashboard Data Consolidation (Priority 1)

**Problem:** Dashboard has dual data fetching:
- `useDashboard` hook fetches data (739 lines, complex)
- Each card also fetches its own data via tRPC
- Two sources of truth → potential inconsistency

**Solution:** Remove `useDashboard` hook complexity, let cards fetch independently.

**Approach A (Recommended): Simplify useDashboard**

Keep useDashboard for computed values only (no data fetching):

```typescript
// hooks/useDashboard.ts (simplified)
export function useDashboard() {
  // Remove all tRPC queries from here
  // Keep only computed values and utilities

  return {
    // Utility functions only
    refreshAll: () => {
      // Trigger refetch on all queries
      utils.dreams.list.invalidate();
      utils.reflections.list.invalidate();
      utils.evolution.checkEligibility.invalidate();
    }
  };
}
```

**Approach B (Alternative): Remove useDashboard entirely**

Delete the hook and move refresh logic to dashboard page:

```typescript
// app/dashboard/page.tsx
'use client';

export default function DashboardPage() {
  const utils = trpc.useUtils();

  const handleRefresh = () => {
    utils.dreams.list.invalidate();
    utils.reflections.list.invalidate();
    utils.subscriptions.getStatus.invalidate();
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh All</button>

      {/* Cards fetch their own data */}
      <UsageCard />
      <ReflectionsCard />
      <DreamsCard />
      <EvolutionCard />
    </div>
  );
}
```

**Cards Already Fetch Independently:**
- UsageCard: `trpc.subscriptions.getStatus.useQuery()`
- ReflectionsCard: `trpc.reflections.list.useQuery()`
- DreamsCard: `trpc.dreams.list.useQuery()`
- EvolutionCard: `trpc.evolution.checkEligibility.useQuery()`

**Action:**
1. Choose Approach A or B (recommend B for simplicity)
2. Update dashboard page
3. Test that all cards load correctly
4. Verify loading states work
5. Check for console errors

**Success Indicator:** Dashboard loads with all cards showing correct data, no dual fetching.

---

#### Task 2.2: Test Auth Flow (Priority 2)

**Test Cases:**

1. **Sign Up:**
```
- Navigate to /auth/signup
- Enter: name, email, password, confirm password
- Submit form
- [ ] Redirects to /dashboard
- [ ] Token stored in localStorage
- [ ] User data appears in dashboard
- [ ] No console errors
```

2. **Sign In:**
```
- Navigate to /auth/signin
- Enter: ahiya.butman@gmail.com, dream_lake
- Submit form
- [ ] Redirects to /dashboard
- [ ] Token stored in localStorage
- [ ] Dashboard shows admin user
- [ ] No console errors
```

3. **Token Persistence:**
```
- Sign in
- Refresh page
- [ ] Still signed in
- [ ] Dashboard loads without re-auth
- [ ] Token still in localStorage
```

4. **Sign Out:**
```
- Click sign out button
- [ ] Redirects to landing page
- [ ] Token removed from localStorage
- [ ] Cannot access /dashboard
- [ ] No console errors
```

5. **Invalid Credentials:**
```
- Try signing in with wrong password
- [ ] Shows error message
- [ ] Doesn't redirect
- [ ] No console errors
```

**Document Results:** Add pass/fail for each test in testing report.

---

#### Task 2.3: Test Dreams CRUD (Priority 2)

**Test Cases:**

1. **Create Dream:**
```
- Go to dashboard
- Click "Create Dream" button
- Fill: title, description, target date, category
- [ ] Dream appears in dashboard
- [ ] Reflection count shows 0
- [ ] Days left calculated correctly
- [ ] No console errors
```

2. **View Dream:**
```
- Click on dream card
- [ ] Navigates to /dreams/[id]
- [ ] Shows dream details
- [ ] Shows reflections list (filtered by dream)
- [ ] Shows actions: Reflect, Evolution, Visualize
- [ ] No console errors
```

3. **Edit Dream:**
```
- On dream detail page, edit title
- Save changes
- [ ] Title updates in UI
- [ ] Changes persist after refresh
- [ ] No console errors
```

4. **Change Status:**
```
- On dream detail page, click "Mark as Achieved"
- [ ] Status changes to "achieved"
- [ ] Dream shows in achieved filter
- [ ] No console errors
```

5. **Archive Dream:**
```
- Change status to "archived"
- [ ] Dream moves to archived section
- [ ] Not shown in active dreams
- [ ] No console errors
```

6. **Tier Limit:**
```
- As free tier user, create 2 dreams (max)
- Try creating 3rd dream
- [ ] Shows error: "Dream limit reached"
- [ ] Error is user-friendly
- [ ] No console errors
```

**Document Results:** Add pass/fail for each test in testing report.

---

#### Task 2.4: Test Reflection Flow (Priority 2)

**Test Cases:**

1. **Start Reflection from Dashboard:**
```
- Click "Reflect Now" button
- [ ] Navigates to /reflection
- [ ] Shows dream selection if no dreamId in URL
- [ ] CosmicLoader shows while loading dreams
- [ ] No console errors
```

2. **Select Dream:**
```
- Choose dream from list
- [ ] Dream selected
- [ ] Advances to question 1
- [ ] Progress orbs show step 1/5
- [ ] No console errors
```

3. **Answer 5 Questions:**
```
- Fill question 1: "What is your dream?"
- Fill question 2: "What is your plan?"
- Fill question 3: "Have you set a date?" (Yes/No)
- Fill question 4 (if Yes): "When?"
- Fill question 5: "What's your relationship?"
- Fill question 6: "What are you willing to give?"
- [ ] Character counters work
- [ ] Progress orbs update
- [ ] Can go back to previous questions
- [ ] No console errors
```

4. **Select Tone:**
```
- Choose tone: Fusion, Gentle, or Intense
- [ ] Tone selected visually
- [ ] Submit button enabled
- [ ] No console errors
```

5. **AI Generation:**
```
- Click "Generate Reflection"
- [ ] Shows CosmicLoader
- [ ] "Generating your reflection..." message
- [ ] Waits ~30 seconds
- [ ] Shows AI response
- [ ] Response is formatted nicely
- [ ] No console errors
```

6. **Save and View:**
```
- After AI response shows
- [ ] Redirects to /reflection?id=[reflectionId]
- [ ] Shows full reflection content
- [ ] Links back to dream
- [ ] Reflection appears in reflections list
- [ ] Usage counter incremented
- [ ] No console errors
```

7. **Tier Limit:**
```
- As free tier user, create 4 reflections
- Try creating 5th reflection
- [ ] Shows error: "Reflection limit reached"
- [ ] Suggests upgrading
- [ ] No console errors
```

**Document Results:** Add pass/fail for each test in testing report.

---

#### Task 2.5: Test Dashboard Loading (Priority 3)

**Test Cases:**

1. **Full Dashboard Load:**
```
- Sign in and go to /dashboard
- [ ] WelcomeSection loads with user name
- [ ] UsageCard shows current usage
- [ ] ReflectionsCard shows recent reflections
- [ ] DreamsCard shows active dreams
- [ ] EvolutionCard shows eligibility status
- [ ] All cards have loading states
- [ ] No visual glitches
- [ ] No console errors
```

2. **Refresh Button:**
```
- Click refresh button
- [ ] All cards refetch data
- [ ] Loading states appear
- [ ] Data updates correctly
- [ ] No console errors
```

3. **Empty States:**
```
- Test with user who has no dreams
- [ ] Shows "No dreams yet" message
- [ ] Shows "Create Dream" button
- [ ] No broken UI
- [ ] No console errors
```

**Document Results:** Add pass/fail for each test in testing report.

---

#### Task 2.6: Fix Console Errors (Priority 4)

**Process:**
1. Open browser DevTools console
2. Navigate through all pages
3. Document all errors/warnings
4. Fix critical errors
5. Document any remaining warnings

**Common Issues to Check:**
- Hydration errors (server/client mismatch)
- Missing keys in lists
- Invalid prop types
- Network errors (tRPC failures)
- TypeScript errors in console

**Action:**
- Fix all errors that break functionality
- Document minor warnings for later
- Ensure TypeScript compilation passes

**Success Indicator:** Zero critical errors in console during normal user flows.

---

#### Task 2.7: Create Current State Documentation (Priority 5)

**File:** `.2L/plan-3/iteration-19/build/current-state.md`

**Template:**
```markdown
# Current State - Iteration 19 Complete

## What Works Fully

### Authentication
- [x] Sign up with email/password
- [x] Sign in with email/password
- [x] Token persistence (localStorage)
- [x] Sign out
- [x] Admin user access
- Details: [Any notes]

### Dreams Management
- [x] Create dreams
- [x] View dreams in dashboard
- [x] Edit dream details
- [x] Change dream status
- [x] Archive dreams
- [x] Tier limit enforcement
- Details: [Any notes]

### Reflections
- [x] 5-question reflection flow
- [x] Dream selection
- [x] Tone selection
- [x] AI generation (Claude Sonnet 4)
- [x] Save and view reflections
- [x] Usage tracking
- [x] Tier limit enforcement
- Details: [Any notes]

### Dashboard
- [x] Welcome section
- [x] Usage card
- [x] Reflections card
- [x] Dreams card
- [x] Evolution card (eligibility check)
- [x] Refresh functionality
- Details: [Any notes]

### Database
- [x] All 7 tables exist
- [x] RLS policies enabled
- [x] Database functions working
- [x] Usage tracking schema fixed
- [x] Migrations applied
- Details: [Any notes]

### Admin
- [x] Admin user exists
- [x] Admin can sign in
- [x] Admin has unlimited access
- [x] Admin router functional
- Details: [Any notes]

---

## What's Partially Implemented

### Evolution Reports
- [x] Backend router complete
- [x] Eligibility checks work
- [ ] Generation UI missing (dream detail page)
- [ ] Report display needs formatting
- [ ] Dashboard preview missing
- Gap: Iteration 20 will add generation UI and formatted display

### Visualizations
- [x] Backend router complete
- [x] Achievement narrative style implemented
- [ ] Generation UI missing (dream detail page)
- [ ] Narrative display needs immersive formatting
- [ ] Dashboard preview missing
- Gap: Iteration 20 will add generation UI and formatted display

---

## What's Missing Entirely

### Onboarding Flow
- [ ] 3-step onboarding pages
- [ ] Step indicator
- [ ] Onboarding_completed flag
- [ ] Auto-trigger after signup
- Gap: Iteration 21 will build onboarding flow

### Landing Page Enhancements
- [ ] Onboarding CTA for first-time users
- [ ] More prominent value proposition
- Gap: Iteration 21 will polish landing page

---

## Integration Gaps

### Dashboard → Evolution/Visualization
- Dream detail page has buttons but they don't check eligibility
- Need: Add eligibility check, show "Generate" button when ≥4 reflections
- Need: Loading state during generation
- Need: Preview in dashboard Evolution Card

### Recent Reflections Cross-Dream Query
- Dashboard needs to show last 3 reflections across ALL dreams
- Currently: Each card fetches separately
- Need: Cross-dream query in dashboard

---

## Technical Debt

### Dashboard Data Fetching
- ✅ FIXED: Removed dual fetching (useDashboard simplified)
- Cards now fetch independently
- TanStack Query handles caching

### Dream Reflections Filtering
- ✅ FIXED: Added dreamId filter to query
- No more client-side filtering

### Console Errors
- ✅ FIXED: [List fixed errors]
- Remaining warnings: [List any non-critical warnings]

---

## Tier System

### Current Structure
- Free: 2 dreams, 4 reflections/month, 1 evolution/month, 1 viz/month
- Essential: 5 dreams, 10 reflections/month, 3 evolution/month, 3 viz/month
- Optimal: 7 dreams, 30 reflections/month, 6 evolution/month, 6 viz/month
- Premium: Unlimited (admin only)

### Alignment with Vision
- Vision specifies Free/Optimal only (2 tiers)
- Code implements 4 tiers
- Decision: Keep 4 tiers, map "Optimal" in vision to "optimal" or "premium" in code
- Admin tier: premium (unlimited)

---

## Database Schema Status

### Tables
- users: ✅ Working
- dreams: ✅ Working
- reflections: ✅ Working
- evolution_reports: ✅ Working (backend only)
- visualizations: ✅ Working (backend only)
- usage_tracking: ✅ FIXED (month column now DATE type)
- api_usage_log: ✅ Working

### Functions
- check_dream_limit: ✅ Working
- check_reflection_limit: ✅ Working
- check_evolution_limit: ✅ Working
- check_visualization_limit: ✅ Working
- increment_usage_counter: ✅ FIXED (works with DATE type)
- update_dream_reflection_count: ✅ Working (trigger)

---

## Performance

### Load Times
- Dashboard: [X] seconds
- Reflection generation: ~30 seconds (AI)
- Evolution generation: ~45 seconds (AI with extended thinking)
- Page navigation: [X] seconds

### Bundle Size
- Main bundle: [X] KB
- [Other metrics]

---

## Recommendations for Iteration 20

### High Priority
1. Build Evolution Report generation UI
   - Add button to dream detail page
   - Show eligibility (≥4 reflections)
   - Add CosmicLoader during generation
   - Format report display with markdown

2. Build Visualization generation UI
   - Similar to evolution
   - Immersive narrative display
   - Achievement style explanation

3. Complete Dashboard Integration
   - Add recent reflections across all dreams
   - Add evolution/visualization previews
   - Quick action buttons on dream cards

### Medium Priority
4. Test Sarah's Journey Day 0-6
   - Create dream → 4 reflections → Evolution → Visualization
   - Verify magic moment works
   - Check all eligibility gates

---

## Iteration 19 Summary

**Status:** COMPLETE

**Time Spent:** [Actual time]

**Major Achievements:**
- Fixed usage tracking schema (critical)
- Created admin user
- Aligned tier limits with vision
- Refactored dashboard data fetching
- Tested all core flows
- Zero critical console errors

**Blockers Resolved:**
- Usage tracking DATE type issue
- Dashboard dual fetching
- Reflection tier limits mismatch

**Ready for Iteration 20:** YES
```

---

### Patterns to Follow
Reference patterns from `patterns.md`:
- Use **Page Component Structure Pattern** for dashboard updates
- Use **tRPC Client Usage Pattern** for data fetching
- Use **Glass Component Usage Pattern** for all UI
- Use **Manual Testing Checklist Pattern** for testing
- Follow **Import Order Convention**

### Testing Requirements
- All core flows tested manually
- Console checked for errors on every page
- Loading states verified
- Error states verified
- Tier limits enforced correctly
- Coverage: 100% of user flows (auth, dreams, reflections, dashboard)

### Builder-2 Testing Report Template

Create file: `.2L/plan-3/iteration-19/build/builder-2-report.md`

```markdown
# Builder-2 Testing Report

## Dashboard Refactoring

### Changes Made:
- [ ] Removed/simplified useDashboard hook
- [ ] Updated dashboard page to use independent card fetching
- [ ] Verified all cards load correctly
- [ ] Tested loading states
- [ ] Tested refresh button

**Code Changes:**
\`\`\`typescript
[Paste key code changes]
\`\`\`

**Issues Encountered:**
[Any problems during refactoring]

---

## Auth Flow Testing

### Sign Up Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Sign In Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Token Persistence Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Sign Out Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Invalid Credentials Test:
- [ ] PASS / FAIL
- Details: [Notes]

**Issues Found:**
[List any auth issues]

---

## Dreams CRUD Testing

### Create Dream Test:
- [ ] PASS / FAIL
- Details: [Notes]

### View Dream Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Edit Dream Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Change Status Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Archive Dream Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Tier Limit Test:
- [ ] PASS / FAIL
- Details: [Notes]

**Issues Found:**
[List any dreams issues]

---

## Reflection Flow Testing

### Start Reflection Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Select Dream Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Answer Questions Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Select Tone Test:
- [ ] PASS / FAIL
- Details: [Notes]

### AI Generation Test:
- [ ] PASS / FAIL
- Duration: [X seconds]
- Details: [Notes]

### Save and View Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Tier Limit Test:
- [ ] PASS / FAIL
- Details: [Notes]

**Issues Found:**
[List any reflection issues]

---

## Dashboard Loading Testing

### Full Load Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Refresh Button Test:
- [ ] PASS / FAIL
- Details: [Notes]

### Empty States Test:
- [ ] PASS / FAIL
- Details: [Notes]

**Issues Found:**
[List any dashboard issues]

---

## Console Errors

### Critical Errors Found:
[List errors that break functionality]

### Warnings Found:
[List non-critical warnings]

### Errors Fixed:
- [Error 1: Description and fix]
- [Error 2: Description and fix]

### Remaining Issues:
[Any errors not fixed in this iteration]

---

## Summary

**Status:** [SUCCESS / PARTIAL / FAILED]

**Test Results:**
- Auth flows: X/Y passed
- Dreams CRUD: X/Y passed
- Reflection flow: X/Y passed
- Dashboard: X/Y passed

**What Works:**
- [List successful items]

**What's Broken:**
- [List any remaining issues]

**Next Steps:**
- [Recommendations for fixes or iteration 20]

**Estimated Time:** [Actual time spent]
```

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)
- Builder-1: Database schema & admin
- Builder-2: Dashboard & testing

**Both builders can start immediately and work in parallel.**

### Integration Phase (After both complete)
- Review both testing reports
- Merge all changes
- Run final smoke test (sign in as admin, create dream, reflect)
- Create consolidated current-state.md document
- Commit to git

---

## Integration Notes

### File Conflicts
**None expected** - builders work on different files:

**Builder-1 files:**
- `supabase/migrations/20251112000000_fix_usage_tracking.sql` (new)
- `server/trpc/routers/reflections.ts` (tier limits)
- `server/trpc/routers/dreams.ts` (verify limits)
- `scripts/create-admin-user.js` (execute only)

**Builder-2 files:**
- `hooks/useDashboard.ts` (simplify/remove)
- `app/dashboard/page.tsx` (update data fetching)
- `components/dashboard/cards/*.tsx` (verify independent fetching)
- `app/dreams/[id]/page.tsx` (add dreamId filter)

### Integration Checklist
- [ ] Builder-1 migration applied successfully
- [ ] Builder-2 dashboard refactoring complete
- [ ] Admin user can sign in
- [ ] Dashboard loads without errors
- [ ] All core flows work end-to-end
- [ ] TypeScript compilation passes
- [ ] Git commit with both changes
- [ ] Both testing reports reviewed

### Shared Files
**None** - no files modified by both builders.

### Potential Conflicts
**None expected** - builders work on separate layers (database vs frontend).

---

**Builder Tasks Status:** COMPLETE
**Ready for:** Builder execution
**Estimated Duration:** 2-4 hours per builder (parallel)
**Total Iteration Time:** ~4-6 hours (including integration + validation)
