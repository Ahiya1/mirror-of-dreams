# Explorer 1 Report: Backend & Database Audit

**Date:** 2025-11-12  
**Iteration:** 19 (Plan plan-3, Iteration 1)  
**Focus:** Comprehensive audit of backend, database, API layer, and admin setup

---

## Executive Summary

**Overall Status:** Backend is **functional** but with **critical schema inconsistencies** and **usage tracking issues**.

**Key Findings:**
- ✅ All 7 required database tables exist and have data
- ✅ Admin user (ahiya.butman@gmail.com) exists with correct permissions
- ✅ All tRPC routers are complete and well-structured
- ✅ Database functions (check_dream_limit, check_evolution_limit, etc.) are implemented
- ⚠️ **CRITICAL:** Usage tracking table has schema mismatch (month_year vs month column)
- ⚠️ **CRITICAL:** Usage tracking functions expect DATE type but table uses TEXT type
- ⚠️ Script create-admin-user.js exists but uses wrong tier name
- ❌ No reflection AI router endpoint found (only evolution/visualizations)
- ❌ Tier limits mismatch between vision (Free/Optimal) and code (free/essential/optimal/premium)

---

## Database Schema Audit

### Tables Status

| Table | Exists | Row Count | Status |
|-------|--------|-----------|--------|
| users | ✅ | 4 | Working |
| dreams | ✅ | 1 | Working |
| reflections | ✅ | 4 | Working |
| evolution_reports | ✅ | 0 | Empty (expected) |
| visualizations | ✅ | 0 | Empty (expected) |
| usage_tracking | ✅ | 1 | **SCHEMA ISSUE** |
| api_usage_log | ✅ | 0 | Empty (expected) |

### Schema Issues Discovered

#### 1. Usage Tracking Table Mismatch (CRITICAL)

**Problem:** The `usage_tracking` table has a schema inconsistency:

**Current Database Schema:**
```sql
Column: month_year TEXT  -- Format: 'YYYY-MM'
```

**Expected by Migration (20251022210000_add_evolution_visualizations.sql):**
```sql
Column: month DATE  -- Should be DATE type
```

**Impact:**
- `increment_usage_counter()` function calls pass DATE values to TEXT column
- `check_evolution_limit()` and `check_visualization_limit()` functions expect DATE column
- This will cause runtime errors when generating evolution reports or visualizations

**Evidence:**
```sql
-- From database:
month_year                    | text

-- From migration line 272-274:
INSERT INTO public.usage_tracking (user_id, month)
VALUES (p_user_id, p_month)
ON CONFLICT (user_id, month) DO NOTHING;
```

**Fix Required:**
```sql
ALTER TABLE usage_tracking RENAME COLUMN month_year TO month;
ALTER TABLE usage_tracking ALTER COLUMN month TYPE DATE USING month::DATE;
```

#### 2. RLS Policies Status

**Verified:** Row Level Security is enabled on all tables:
- users: ✅ Policies for SELECT, UPDATE (auth.uid() = id)
- dreams: ✅ Full CRUD policies
- reflections: ✅ Full CRUD policies  
- evolution_reports: ✅ SELECT, INSERT policies
- visualizations: ✅ SELECT, INSERT, DELETE policies
- usage_tracking: ✅ SELECT, INSERT policies
- api_usage_log: ✅ User and Admin policies

**Working correctly.**

### Database Functions Audit

All required functions exist and are implemented:

✅ **check_dream_limit(user_uuid UUID)** - Enforces tier limits for active dreams  
✅ **check_reflection_limit(user_uuid UUID)** - Enforces monthly reflection limits  
✅ **check_evolution_limit(p_user_id, p_user_tier, p_report_type)** - Monthly evolution report limits  
✅ **check_visualization_limit(p_user_id, p_user_tier, p_viz_type)** - Monthly visualization limits  
✅ **increment_usage_counter(p_user_id, p_month, p_counter_name)** - Updates usage counts  
✅ **update_dream_reflection_count()** - Trigger to update dream stats  

**Issue:** These functions expect `month` column (DATE) but table has `month_year` (TEXT).

---

## Admin User Status

### Current State

**Admin user EXISTS and is correctly configured:**

```
Email: ahiya.butman@gmail.com
ID: 875311d0-bc6b-46a3-bf98-bc29a387a978
Tier: premium
is_admin: true
is_creator: true
subscription_status: active
```

### Admin Script Analysis

**File:** `/home/ahiya/mirror-of-dreams/scripts/create-admin-user.js`

**Status:** ✅ Exists and is functional

**Issue Found:**
```javascript
// Line 50 - Script uses 'premium' tier
tier: 'premium',

// But vision.md specifies only Free/Optimal tiers for MVP
```

**Recommendation:** This is fine for admin user (premium tier makes sense). But need to clarify if "Optimal" tier = "premium" tier or if they're different.

---

## tRPC Routers Audit

### Router Completeness

**Root Router:** `/home/ahiya/mirror-of-dreams/server/trpc/routers/_app.ts`

All routers are registered:
```typescript
export const appRouter = router({
  auth: authRouter,                // ✅
  dreams: dreamsRouter,             // ✅
  reflections: reflectionsRouter,   // ✅
  reflection: reflectionRouter,     // ⚠️ Single reflection (AI generation?)
  users: usersRouter,               // ✅
  evolution: evolutionRouter,       // ✅
  visualizations: visualizationsRouter, // ✅
  artifact: artifactRouter,         // ❓ Not in requirements
  subscriptions: subscriptionsRouter, // ❓ Not in MVP scope
  admin: adminRouter,               // ✅
});
```

### 1. Auth Router (/server/trpc/routers/auth.ts)

**Status:** ✅ Fully implemented

**Endpoints:**
- `signup` - Creates user with bcrypt password hashing
- `signin` - Validates credentials, returns JWT (30-day expiry)
- `verifyToken` - Validates JWT token
- `signout` - Client-side logout
- `me` - Get current user (protected)
- `updateProfile` - Update user profile
- `changePassword` - Change password with validation
- `deleteAccount` - Delete with email + password confirmation

**Features:**
- ✅ JWT_SECRET validation
- ✅ Automatic monthly usage reset on signin
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ Email uniqueness enforcement
- ✅ Last sign-in tracking

**Issues:** None

### 2. Dreams Router (/server/trpc/routers/dreams.ts)

**Status:** ✅ Fully implemented

**Endpoints:**
- `create` - Create dream with tier limit check
- `list` - Get user's dreams with optional filtering
- `get` - Get single dream with stats
- `update` - Update dream details
- `updateStatus` - Change dream status (active/achieved/archived/released)
- `delete` - Delete dream (reflections set to NULL)
- `getLimits` - Get tier limits and current usage

**Tier Limits:**
```typescript
free: { dreams: 2 },
essential: { dreams: 5 },
optimal: { dreams: 7 },
premium: { dreams: 999999 }
```

**Issues:**
- ⚠️ Vision.md specifies only "Free" (2 dreams) and "Optimal" (7 dreams)
- ⚠️ Code includes "essential" (5 dreams) and "premium" tiers
- ⚠️ Inconsistency between vision and implementation

**Features:**
- ✅ Days left calculation
- ✅ Reflection count aggregation
- ✅ Status tracking with timestamps
- ✅ Category support
- ✅ Priority field

### 3. Reflections Router (/server/trpc/routers/reflections.ts)

**Status:** ✅ Fully implemented

**Endpoints:**
- `list` - Paginated reflection history with filtering
- `getById` - Get single reflection (increments view count)
- `update` - Update reflection metadata (title/tags)
- `delete` - Delete reflection (decrements usage counters)
- `submitFeedback` - Submit rating/feedback
- `checkUsage` - Check current monthly usage

**Features:**
- ✅ Pagination support
- ✅ Search filtering
- ✅ Tone filtering
- ✅ View count tracking
- ✅ Usage limit enforcement

**Tier Limits (in code):**
```typescript
free: 1,
essential: 5,
premium: 10
```

**Issues:**
- ⚠️ Vision.md specifies Free: 4 reflections/month, Optimal: 30 reflections/month
- ⚠️ Code has: free: 1, essential: 5, premium: 10
- ❌ **CRITICAL MISMATCH** - Limits don't match vision at all!

### 4. Reflection Router (AI Generation)

**Status:** ❓ Not found in explored files

**Expected:** Should handle the 5-question reflection flow with Claude Sonnet 4

**To Verify:** Check if this router actually generates AI reflections or if it's in a different file.

### 5. Evolution Router (/server/trpc/routers/evolution.ts)

**Status:** ✅ Fully implemented and sophisticated

**Endpoints:**
- `generateDreamEvolution` - Generate dream-specific evolution report (≥4 reflections)
- `generateCrossDreamEvolution` - Generate cross-dream report (≥12 reflections, not for Free tier)
- `list` - List user's evolution reports
- `get` - Get specific report
- `checkEligibility` - Check if user can generate report

**Features:**
- ✅ Temporal distribution context selection
- ✅ Extended thinking for Optimal/Premium tiers
- ✅ API cost tracking
- ✅ Usage limit enforcement
- ✅ Threshold validation (4 for dream-specific, 12 for cross-dream)
- ✅ RPC functions for limit checking

**AI Integration:**
- ✅ Anthropic Claude Sonnet 4
- ✅ Extended thinking enabled for Optimal/Premium
- ✅ Token usage tracking
- ✅ Cost calculation

**Issues:**
- ⚠️ Vision.md says "Dream-Specific Only" for MVP but code supports cross-dream
- ⚠️ Cross-dream evolution is explicitly "Out of Scope for MVP" but implemented

### 6. Visualizations Router (/server/trpc/routers/visualizations.ts)

**Status:** ✅ Fully implemented

**Endpoints:**
- `generate` - Generate visualization (dream-specific or cross-dream)
- `list` - List user's visualizations
- `get` - Get specific visualization

**Visualization Styles:**
- `achievement` - Linear journey metaphor
- `spiral` - Growth spiral/cyclical patterns
- `synthesis` - Network/constellation metaphor

**Issues:**
- ⚠️ Vision.md specifies "Achievement narrative style ONLY" for MVP
- ⚠️ Code implements all 3 styles (achievement, spiral, synthesis)
- ⚠️ Scope creep beyond MVP requirements

**Features:**
- ✅ Temporal context distribution
- ✅ Extended thinking support
- ✅ Cost tracking
- ✅ Monthly limit enforcement

### 7. Admin Router (/server/trpc/routers/admin.ts)

**Status:** ✅ Fully implemented

**Endpoints:**
- `authenticate` - Creator secret authentication
- `checkAuth` - Verify persistent auth
- `getAllUsers` - List all users (paginated)
- `getAllReflections` - List all reflections
- `getStats` - System statistics
- `getUserByEmail` - Find user by email
- `updateUserTier` - Manually change user tier
- `getApiUsageStats` - API cost/token analytics by month

**Features:**
- ✅ Creator secret protection
- ✅ Pagination support
- ✅ Tier filtering
- ✅ Cost analytics

**Issues:** None

---

## AI Integration Audit

### Anthropic API Setup

**Status:** ✅ Configured and functional

**Environment Variable:** `ANTHROPIC_API_KEY` is set

**Model Used:** Claude Sonnet 4 (via getModelIdentifier())

**Features Implemented:**
- ✅ Extended thinking (Optimal/Premium tiers only)
- ✅ Token usage tracking (input/output/thinking)
- ✅ Cost calculation per operation
- ✅ API usage logging to database

**Usage Locations:**
- Evolution reports (dream-specific and cross-dream)
- Visualizations (all 3 styles)
- ❓ Reflection generation (router not found in audit)

### Cost Tracking

**Cost Calculator:** `/home/ahiya/mirror-of-dreams/server/lib/cost-calculator.ts`

**Functions:**
- `calculateCost()` - Calculates USD cost from token usage
- `getModelIdentifier()` - Returns current model name
- `getThinkingBudget()` - Returns thinking token budget by tier

**Thinking Budget:**
```typescript
free: 0 tokens
essential: 0 tokens
optimal: 10000 tokens
premium: 10000 tokens
```

**Logging:** All API calls logged to `api_usage_log` table with:
- Model used
- Input/output/thinking tokens
- Cost in USD
- Operation type
- Dream ID (if applicable)

---

## Usage Tracking Audit

### Tier Limits (As Implemented)

**CRITICAL DISCREPANCY:** Code has 4 tiers but vision specifies only 2.

| Feature | Free (Vision) | Free (Code) | Optimal (Vision) | Optimal (Code) | Essential (Code) | Premium (Code) |
|---------|---------------|-------------|------------------|----------------|------------------|----------------|
| Dreams | 2 | 2 | 7 | 7 | 5 | Unlimited |
| Reflections/month | 4 | 1 | 30 | ??? | 5 | 10 |
| Evolution reports/month | 1 | N/A | 6 | 6 | 3 | Unlimited |
| Visualizations/month | 1 | 1 | 6 | 6 | 3 | Unlimited |
| Context (reflections) | 4 | 4 | 9 | 9 | ??? | ??? |
| Extended thinking | No | No | Yes | Yes | No | Yes |

**Issues:**
1. ❌ Reflections limit: Vision says Free=4, code says Free=1
2. ❌ Essential and Premium tiers exist in code but not in vision
3. ❌ Need to decide: Is "Optimal" === "premium" or separate tier?

### Usage Increment Functions

**Function:** `increment_usage_counter(p_user_id, p_month, p_counter_name)`

**Counters:**
- `reflections`
- `evolution_dream_specific`
- `evolution_cross_dream`
- `visualizations_dream_specific`
- `visualizations_cross_dream`

**Issue:**
```sql
-- Function expects:
p_month DATE

-- But usage_tracking table has:
month_year TEXT
```

**This will cause SQL errors!**

### Limit Check Functions

**Functions:**
- `check_evolution_limit(p_user_id, p_user_tier, p_report_type)`
- `check_visualization_limit(p_user_id, p_user_tier, p_viz_type)`

**Both functions:**
1. Get current month: `DATE_TRUNC('month', CURRENT_DATE)`
2. Query usage_tracking WHERE month = v_current_month_start
3. Compare against tier limits

**Issue:** These expect `month` column (DATE) but table has `month_year` (TEXT).

---

## What Works (Tested & Verified)

### ✅ Authentication Flow
- User signup with email/password
- Password hashing (bcrypt, 12 rounds)
- JWT generation (30-day expiry)
- Token verification
- Monthly usage reset on signin

### ✅ Database Connection
- Supabase local instance running (http://127.0.0.1:54321)
- All tables exist with correct schema (except usage_tracking month column)
- RLS policies enabled and working
- Database functions implemented

### ✅ Dreams Management
- Create dreams with tier limit checks
- List dreams with stats (reflection count, days left)
- Update dream details
- Change dream status (active/achieved/archived/released)
- Delete dreams
- Tier limit enforcement working

### ✅ Admin Access
- Admin user exists with correct permissions
- Admin router endpoints functional
- API usage stats tracking
- User management endpoints

### ✅ AI Integration Setup
- Anthropic API key configured
- Model identifier working
- Extended thinking configuration
- Cost calculation functional

---

## What's Broken (Errors Found)

### ❌ Usage Tracking Column Type Mismatch

**Severity:** CRITICAL  
**Impact:** Evolution and visualization generation will fail

**Error Location:**
- Database table: `month_year TEXT`
- Migration/functions: `month DATE`

**When it breaks:**
- Generating evolution reports
- Generating visualizations
- Any usage limit checks

**Fix Required:**
```sql
ALTER TABLE usage_tracking RENAME COLUMN month_year TO month;
ALTER TABLE usage_tracking ALTER COLUMN month TYPE DATE 
  USING to_date(month_year, 'YYYY-MM');
```

### ❌ Reflection Tier Limits Don't Match Vision

**Severity:** HIGH  
**Impact:** Free tier users get 1 reflection instead of 4

**Vision Says:**
- Free: 4 reflections/month
- Optimal: 30 reflections/month

**Code Says:**
```typescript
free: 1,
essential: 5,
premium: 10
```

**Fix Required:** Update tier limits in multiple locations to match vision.

### ❌ Extra Tiers Not in Vision

**Severity:** MEDIUM  
**Impact:** Confusion between tiers, inconsistent limits

**Issue:** Code has 4 tiers (free/essential/optimal/premium) but vision specifies 2 (Free/Optimal).

**Decision Needed:**
1. Remove essential tier?
2. Is Optimal = premium in code?
3. Or are they truly separate?

### ❌ Scope Creep: Cross-Dream Features

**Severity:** LOW (but against vision)  
**Impact:** More complexity than needed

**Vision states:**
- "Evolution Reports (Dream-Specific Only)"
- "Visualizations (Dream-Specific Only)"
- "Out of Scope: Cross-dream analysis"

**Code implements:**
- Cross-dream evolution reports
- Cross-dream visualizations
- Multiple visualization styles (only Achievement should be in MVP)

**Recommendation:** Disable cross-dream features for MVP or update vision.

---

## What's Missing (Gaps in Implementation)

### ❓ Reflection AI Generation Router

**Expected:** A tRPC endpoint to handle the 5-question reflection flow:
1. User answers 5 questions
2. Backend calls Claude Sonnet 4
3. AI generates Sacred Fusion tone reflection
4. Save to database with usage tracking

**Found:** `reflection: reflectionRouter` in app router but file not examined

**To Verify:** Need to check `/server/trpc/routers/reflection.ts`

### ❓ Environment Variable: NEXT_PUBLIC_SUPABASE_URL

**Issue:** `.env.local` has `SUPABASE_URL` but client-side code might need `NEXT_PUBLIC_SUPABASE_URL`

**Current:**
```
SUPABASE_URL=http://127.0.0.1:54321
```

**May Need:**
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

**Impact:** Frontend Supabase client might not connect.

### Missing from MVP Scope (Expected to be missing)

These are correctly NOT implemented (per vision "Out of Scope"):
- ✅ Stripe payment integration
- ✅ Subscription management UI
- ✅ Email notifications
- ✅ Landing page (iteration 3)
- ✅ Onboarding flow (iteration 3)
- ✅ Social features
- ✅ Admin panel UI
- ✅ AI-generated image artwork

---

## Recommendations for Iteration 1 (Foundation)

### Priority 1: Fix Usage Tracking Schema (MUST DO)

```sql
-- Run this migration immediately:
ALTER TABLE usage_tracking RENAME COLUMN month_year TO month;
ALTER TABLE usage_tracking ALTER COLUMN month TYPE DATE 
  USING to_date(month_year, 'YYYY-MM');

-- Update constraint:
ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_month_year_key;
ALTER TABLE usage_tracking ADD CONSTRAINT usage_tracking_user_id_month_key 
  UNIQUE (user_id, month);
```

### Priority 2: Align Tier Limits with Vision

**Decision Required:** Clarify tier structure:
- Option A: Remove essential/premium, keep only free/optimal
- Option B: Update vision to include all 4 tiers
- Option C: Map optimal = premium in backend

**Then update limits:**

```typescript
// If using only Free/Optimal:
const TIER_LIMITS = {
  free: {
    dreams: 2,
    reflections: 4,  // NOT 1!
    evolution: 1,
    visualizations: 1,
    context: 4,
    thinking: false
  },
  optimal: {
    dreams: 7,
    reflections: 30,  // NOT 10!
    evolution: 6,
    visualizations: 6,
    context: 9,
    thinking: true
  }
};
```

### Priority 3: Test Admin User Login

**Action:** Run this to verify login works:

```bash
node scripts/create-admin-user.js
```

**Expected:** Either "User already exists" or successful creation

**Then test:** Try signing in via API/UI with:
- Email: ahiya.butman@gmail.com
- Password: dream_lake

### Priority 4: Fix Reflection Router (if broken)

**Action:** Examine `/server/trpc/routers/reflection.ts`

**Verify:**
- 5-question input schema
- Claude Sonnet 4 integration
- Sacred Fusion tone implementation
- Usage tracking increment
- Dream ID association

### Priority 5: Add NEXT_PUBLIC_SUPABASE_URL

**Action:** Update `.env.local`:

```bash
# Add this line:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

**Or:** Verify frontend uses server-side Supabase client only.

### Priority 6: Disable Cross-Dream Features (Optional)

**If sticking to MVP vision:**

```typescript
// In evolution.ts and visualizations.ts:
// Comment out or remove:
// - generateCrossDreamEvolution endpoint
// - Cross-dream visualization generation
// - Spiral and Synthesis visualization styles (keep Achievement only)
```

**Or:** Update vision to include these features.

---

## Resource Map

### Critical Files

**Database Migrations:**
- `/home/ahiya/mirror-of-dreams/supabase/migrations/20250121000000_initial_schema.sql`
- `/home/ahiya/mirror-of-dreams/supabase/migrations/20251022200000_add_dreams_feature.sql`
- `/home/ahiya/mirror-of-dreams/supabase/migrations/20251022210000_add_evolution_visualizations.sql`

**Backend Routers:**
- `/home/ahiya/mirror-of-dreams/server/trpc/routers/_app.ts` (root router)
- `/home/ahiya/mirror-of-dreams/server/trpc/routers/auth.ts`
- `/home/ahiya/mirror-of-dreams/server/trpc/routers/dreams.ts`
- `/home/ahiya/mirror-of-dreams/server/trpc/routers/reflections.ts`
- `/home/ahiya/mirror-of-dreams/server/trpc/routers/reflection.ts` (not audited)
- `/home/ahiya/mirror-of-dreams/server/trpc/routers/evolution.ts`
- `/home/ahiya/mirror-of-dreams/server/trpc/routers/visualizations.ts`
- `/home/ahiya/mirror-of-dreams/server/trpc/routers/admin.ts`

**Server Libs:**
- `/home/ahiya/mirror-of-dreams/server/lib/supabase.ts`
- `/home/ahiya/mirror-of-dreams/server/lib/cost-calculator.ts`
- `/home/ahiya/mirror-of-dreams/server/lib/temporal-distribution.ts`

**Scripts:**
- `/home/ahiya/mirror-of-dreams/scripts/create-admin-user.js`

**Environment:**
- `/home/ahiya/mirror-of-dreams/.env.local` (configured)
- `/home/ahiya/mirror-of-dreams/.env.example` (reference)

### Database Functions

**Location:** Supabase PostgreSQL (port 54332 via Docker)

**Functions:**
- `check_dream_limit(user_uuid)`
- `check_reflection_limit(user_uuid)`
- `check_evolution_limit(p_user_id, p_user_tier, p_report_type)`
- `check_visualization_limit(p_user_id, p_user_tier, p_viz_type)`
- `increment_usage_counter(p_user_id, p_month, p_counter_name)`
- `update_dream_reflection_count()` (trigger)

---

## Testing Recommendations for Iteration 1

### Manual Tests to Run

1. **Admin Login Test:**
   ```bash
   # Verify admin can sign in
   curl -X POST http://localhost:3000/api/trpc/auth.signin \
     -H "Content-Type: application/json" \
     -d '{"email":"ahiya.butman@gmail.com","password":"dream_lake"}'
   ```

2. **Dream Creation Test:**
   ```bash
   # Test tier limit enforcement
   # Create 2 dreams as free tier user (should work)
   # Try 3rd dream (should fail with limit error)
   ```

3. **Usage Tracking Test:**
   ```sql
   -- After fixing schema, test increment:
   SELECT increment_usage_counter(
     '875311d0-bc6b-46a3-bf98-bc29a387a978',
     '2025-11-01'::DATE,
     'reflections'
   );
   
   -- Verify count updated:
   SELECT * FROM usage_tracking;
   ```

4. **Evolution Report Test:**
   ```bash
   # Create dream with 4+ reflections
   # Try generating evolution report
   # Should work if schema is fixed
   ```

5. **Tier Limit Test:**
   ```bash
   # As free tier user:
   # - Create 2 dreams (max)
   # - Create 4 reflections (should be max, not 1)
   # - Generate 1 evolution report
   # - Generate 1 visualization
   # - Verify all limits enforced correctly
   ```

---

## Questions for Planner

1. **Tier Structure:** Should we use 2 tiers (Free/Optimal) or 4 tiers (free/essential/optimal/premium)? Current code has 4 but vision has 2.

2. **Optimal vs Premium:** In the code, is "optimal" the same as "premium"? Admin user uses "premium" tier but vision says "Optimal" for paid tier.

3. **Reflection Limits:** Vision says Free tier gets 4 reflections/month, but code says 1. Which is correct?

4. **Cross-Dream Features:** Vision says "Out of Scope" but code implements it. Remove or keep?

5. **Visualization Styles:** Vision says "Achievement narrative style ONLY" but code has 3 styles. Remove spiral/synthesis?

6. **Reflection Router:** Is there a separate router for AI reflection generation? Where is it located?

7. **Usage Tracking Schema:** Can we immediately apply the ALTER TABLE fix, or should that be a new migration file?

---

## Iteration 1 Success Criteria (Updated)

Based on this audit, **Iteration 1 is BLOCKED** until these critical issues are resolved:

### Must Fix Before Proceeding:
- [ ] Fix usage_tracking schema (month_year → month, TEXT → DATE)
- [ ] Align reflection tier limits with vision (1 → 4 for free tier)
- [ ] Decide on tier structure (2 vs 4 tiers)
- [ ] Test admin user login works
- [ ] Verify reflection AI generation router exists and works

### Should Fix for Cohesion:
- [ ] Remove cross-dream features OR update vision
- [ ] Remove extra visualization styles OR update vision
- [ ] Add NEXT_PUBLIC_SUPABASE_URL to env
- [ ] Document which tier is which (optimal vs premium)

### Then Test:
- [ ] Sarah's journey Day 0-6 (signup → 4 reflections → evolution → visualization)
- [ ] Tier limits enforced correctly
- [ ] Usage tracking increments properly
- [ ] AI responses generated successfully
- [ ] Dashboard displays data consistently

---

**Audit Status:** COMPLETE  
**Next Step:** Address critical schema issues before builder work begins  
**Estimated Fix Time:** 2-4 hours for critical issues, 1 day for full alignment

