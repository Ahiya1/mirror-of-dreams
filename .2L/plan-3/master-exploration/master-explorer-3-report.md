# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
User Experience & Integration Points

## Vision Summary
Mirror of Dreams is a consciousness companion that helps users reflect on their dreams through a 5-question flow, generates AI-powered evolution reports after 4+ reflections, and provides visualizations—all delivered through a cohesive cosmic glass UI.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 8 major features (Auth, Dreams, Reflections, Dashboard, Evolution, Visualizations, Tier System, Cosmic UI)
- **User stories/acceptance criteria:** 1 critical user journey (Sarah's Journey) must work perfectly end-to-end
- **Estimated total work:** 20-30 hours across full integration

### Complexity Rating
**Overall Complexity: COMPLEX**

**Rationale:**
- **15+ user-facing features** spanning authentication, CRUD operations, AI generation flows, and dashboard orchestration
- **Multi-step reflection flow** (dream selection → 5 questions → tone selection → AI response) with state management complexity
- **4 distinct AI integration points** (reflections, evolution reports, visualizations) with tier-based feature gating
- **Real-time usage tracking** with monthly limits enforced across multiple resource types
- **Deep integration between frontend/backend** via tRPC with type-safe RPC calls spanning 10+ routers

---

## User Experience Flow Analysis

### Critical User Journeys Identified

#### 1. **Sarah's Journey (PRIMARY FLOW - MUST WORK)**
This is the golden path defined in the vision document:

**Day 0: Discovery & Setup (15 minutes)**
- Landing page → Sign up → Onboarding (3 steps) → Create first dream → Complete first reflection → View AI response → Dashboard

**Integration Complexity:** HIGH
- **Why:** 7 sequential steps spanning multiple pages, 4 API calls, state persistence across navigation, AI generation latency (30s), and form validation at each step
- **Risk:** If any step fails, entire onboarding experience breaks
- **Data flow:** User signup → Token storage → User profile fetch → Dream creation → Reflection form state → AI API call → Database insert → Dashboard redirect with updated usage

**Day 2-6: Building Rhythm (3x5 minutes each)**
- Dashboard return → Reflect button → Complete 2nd, 3rd, 4th reflections → Progress indicators update

**Integration Complexity:** MEDIUM
- **Why:** Requires persistent usage tracking, real-time limit checking, and progress feedback ("2 more reflections to unlock evolution")
- **Risk:** Usage counters out of sync, dashboard state stale after reflection creation
- **Data flow:** Dashboard load → Usage query → Reflect action → Form submission → Usage increment → Dashboard refresh

**Day 6: Breakthrough Moment (15 minutes)**
- Complete 4th reflection → "Evolution Report Available!" → Generate report → Wait 30s (beautiful loading) → Read report → Generate visualization → Feel the magic

**Integration Complexity:** VERY HIGH
- **Why:** Eligibility checking (≥4 reflections), temporal context distribution (1/3 early, 1/3 middle, 1/3 recent), AI extended thinking (Optimal tier), cost tracking, and dual AI calls (evolution + visualization) with different prompts
- **Risk:** Eligibility logic fails, temporal distribution incorrect, AI latency causes timeout, cost calculation errors, or reports not saved properly
- **Data flow:** Reflection count check → Temporal selection (4 or 9 reflections based on tier) → Claude API (thinking enabled for Optimal) → Cost calculation → Report storage → Usage counter increment → Dashboard refresh → Visualization generation (similar flow)

**Day 8: Tier Decision (2 minutes)**
- Attempt 5th reflection → Limit reached message → Upgrade prompt

**Integration Complexity:** LOW
- **Why:** Simple limit check with clear feedback
- **Risk:** Limit check bypassed, unclear messaging
- **Data flow:** Reflect attempt → Usage check → Tier limit validation → Error message or success

---

### 2. **Authentication & Onboarding Flow**

**Sign Up Journey:**
```
Landing → /auth/signup → Name/Email/Password → Submit → Token stored → Redirect to /onboarding
```

**Current State:** Partially implemented
- **Frontend:** Sign up page exists (`/auth/signup/page.tsx`) with form validation
- **Backend:** `auth.signup` tRPC mutation exists in `server/trpc/routers/auth.ts`
- **Integration:** Token storage in localStorage, redirect to dashboard (NO ONBOARDING FLOW DETECTED)

**Issues Found:**
- **Vision specifies 3-step onboarding** explaining dreams, reflections, and free tier—but no `/onboarding` page found in codebase
- **Onboarding is MISSING or incomplete**
- **Token-based auth flow works** but lacks session persistence validation

**Integration Complexity:** MEDIUM
- **Why:** Simple form → API → token storage → redirect, BUT missing onboarding step breaks Sarah's Journey
- **Risk:** Users skip understanding product mechanics, tier limits unclear
- **Data needed:** Onboarding step content (3 screens), "Skip" vs "Next" flow, final redirect to /dreams or /dashboard

---

### 3. **Dream Creation & Management Flow**

**Create Dream Journey:**
```
Dashboard/Dreams page → "Create Dream" button → Modal/Form → Title, Description, Target Date, Category → Submit → Dream card appears → Reflect action available
```

**Current State:** Implemented
- **Frontend:** `CreateDreamModal` component exists in `/components/dreams/CreateDreamModal.tsx`
- **Backend:** `dreams.create` mutation enforces tier limits (Free: 2 dreams, Optimal: 7 dreams)
- **Integration:** Modal opens on /dreams page, submits via tRPC, refetches dream list on success

**Issues Found:**
- **Tier limit enforcement works** but error messaging could be clearer
- **Dream cards show stats** (reflection count, days left) via `dreams.list` query with `includeStats: true`
- **No dream templates** (out of scope for MVP per vision)

**Integration Complexity:** MEDIUM
- **Why:** Modal state management, form validation (title required, date optional), tier limit checking, stats aggregation (reflection count per dream)
- **Risk:** Limit checks fail, stats calculation slow (N+1 query problem), modal doesn't close on success
- **Data flow:** Modal open → Form input → dreams.create mutation → Tier limit check → Database insert → Refetch dreams list → Modal close

---

### 4. **Reflection Creation Flow (CORE EXPERIENCE)**

**5-Question Reflection Journey:**
```
Dashboard/Dreams → "Reflect Now" button → Dream selection (if multiple dreams) → Question 1 (What is your dream?) → Question 2 (What is your plan?) → Question 3 (Do you have a date? Yes/No) → [If Yes] Question 4 (When?) → Question 5 (Relationship with dream?) → Question 6 (Offering?) → Tone selection (Sacred Fusion/Gentle/Intense) → Submit → AI generates response (30s) → Beautiful display → Return to dashboard
```

**Current State:** FULLY IMPLEMENTED
- **Frontend:** `MirrorExperience.tsx` handles entire flow as single-page component with view modes (questionnaire | output)
- **Components:** Uses `ProgressOrbs` for step tracking, `GlassInput` for text areas, `GlowButton` for actions
- **Backend:** `reflection.create` mutation in `server/trpc/routers/reflection.ts` (NOTE: distinct from `reflections` router)
- **AI Integration:** Calls Anthropic Claude Sonnet 4 API with 5 questions formatted into prompt

**Issues Found:**
- **Step 0 (Dream selection) implemented** with visual checkmark selection from user's active dreams
- **Form data persists** in component state across steps (React useState)
- **Back/Forward navigation** works between steps
- **Tone selection offers 3 choices** (Fusion, Gentle, Intense) but vision says "Sacred Fusion only in MVP"—contradiction exists
- **Question 3 conditional logic** (hasDate = yes/no) correctly shows/hides Question 4 (dreamDate input)
- **Character limits enforced** via `QUESTION_LIMITS` constants (imported from `lib/utils/constants`)
- **AI response formatted** with markdown dangerouslySetInnerHTML (potential XSS risk if not sanitized)

**Integration Complexity:** VERY HIGH
- **Why:** 7-step wizard (dream selection + 5 questions + tone), conditional logic (date question), form state management, AI latency handling (30s), real-time character counting, URL state (?dreamId pre-selection), output view rendering
- **Risk:** State loss on navigation, AI timeout, usage limit not enforced before submission, cost tracking fails, response not saved to database
- **Data flow:**
  1. Load dreams list → Select dream → Store dreamId
  2. Steps 1-6: Capture answers in formData state
  3. Submit → Validate all fields → Call reflection.create mutation
  4. Backend: Check usage limits → Format prompt → Call Claude API → Calculate cost → Store reflection → Increment usage counter
  5. Frontend: Transition to output view → Fetch reflection by ID → Display AI response
  6. Return to dashboard with updated counts

**Critical Integration Point:**
- **Usage tracking MUST happen before AI call** to prevent users bypassing limits if API call fails
- **Reflection ID must be returned** to enable /reflection?id=X URL for viewing output
- **AI response must be HTML-safe** or markdown-rendered without XSS vulnerabilities

---

### 5. **Dashboard Integration (CENTRAL HUB)**

**Dashboard Data Requirements:**
```
- User profile (name, tier, daysActive)
- Usage stats (reflections: X/Y, evolution reports: X/Y, visualizations: X/Y)
- Dreams list (active dreams with reflection counts, days left)
- Recent reflections (last 3 across all dreams)
- Evolution report eligibility (any dream with ≥4 reflections)
- Quick actions (Reflect Now, Create Dream, Generate Evolution, Generate Visualization)
```

**Current State:** FULLY IMPLEMENTED but data fetching is DECENTRALIZED
- **Frontend:** `/app/dashboard/page.tsx` orchestrates 5 cards (UsageCard, ReflectionsCard, DreamsCard, EvolutionCard, SubscriptionCard)
- **Architecture:** Each card fetches its own data via tRPC hooks (no central dashboard query)
- **Navigation:** Header with links to /dashboard, /dreams, /reflection, /admin (if creator/admin)
- **Animation:** Stagger animation with `useStaggerAnimation` hook (5 cards, 150ms delay)

**Issues Found:**
- **NO CENTRALIZED DASHBOARD QUERY:** Each card component independently calls tRPC (UsageCard calls `usage.getCurrent`, ReflectionsCard calls `reflections.list`, etc.)
- **Potential race conditions:** 5 parallel API calls on dashboard load could cause performance issues or stale data
- **Refresh button exists** but only refetches via `useDashboard` hook—unclear if all cards refresh in sync
- **"Reflect Now" button checks `usage.canReflect`** from dashboard hook
- **Greeting shows user name** via `useAuth` hook

**Integration Complexity:** HIGH
- **Why:** 5 independent data sources, state synchronization across cards, loading states, error handling per card, refresh coordination, usage limit validation
- **Risk:** Data inconsistency between cards (e.g., usage shows 3/4 but reflections card shows 4), loading states mismatched, refresh doesn't update all cards
- **Recommendation:** Consider creating a single `dashboard.getAll` tRPC query that returns all dashboard data in one call to ensure consistency and reduce network overhead

**Data Flow (Current Decentralized Approach):**
```
Dashboard mount →
  Parallel queries:
    1. useAuth → users.getProfile
    2. useDashboard → usage.getCurrent
    3. UsageCard → usage.getCurrent (duplicate?)
    4. ReflectionsCard → reflections.list (limit: 3)
    5. DreamsCard → dreams.list (status: active, includeStats: true)
    6. EvolutionCard → evolution.checkEligibility
    7. SubscriptionCard → subscriptions.getCurrentPlan (assumed)
  → Render cards with stagger animation
```

---

### 6. **Evolution Report Generation Flow**

**Evolution Report Journey:**
```
Dashboard → "Generate Evolution Report" button → Dream selection (which dream to analyze) → Click "Generate" → Loading state (30s) → Report displays → Option to generate visualization
```

**Current State:** IMPLEMENTED
- **Frontend:** `/app/evolution/[id]/page.tsx` displays generated reports
- **Backend:** `evolution.generateDreamEvolution` mutation with eligibility checks
- **Eligibility:** ≥4 reflections on a single dream
- **Context distribution:** Free tier: 4 reflections analyzed, Optimal tier: 9 reflections analyzed
- **AI Integration:** Claude Sonnet 4 with extended thinking enabled for Optimal/Premium tiers

**Issues Found:**
- **Temporal distribution implemented correctly:** 1/3 early, 1/3 middle, 1/3 recent reflections selected via `selectTemporalContext` function in `server/lib/temporal-distribution.ts`
- **Monthly limits enforced:** Supabase RPC function `check_evolution_limit` validates tier limits (Free: 1/month, Optimal: 6/month)
- **Cost tracking:** API usage logged to `api_usage_log` table with input/output/thinking token counts and USD cost
- **Cross-dream evolution exists** but vision marks as "out of scope for MVP"—consider removing to avoid confusion

**Integration Complexity:** HIGH
- **Why:** Eligibility checking (reflection count per dream), temporal selection algorithm, tier-based context limits, AI extended thinking logic, monthly limit validation, cost calculation, report storage
- **Risk:** Eligibility check bypassed, temporal distribution incorrect (e.g., selects wrong reflections), AI timeout, cost tracking fails, monthly limit not enforced
- **Data flow:**
  1. User clicks "Generate Evolution" on dream → dreamId passed
  2. Backend: dreams.get → reflections.list (for dreamId) → count check (≥4?)
  3. check_evolution_limit RPC (tier validation)
  4. selectTemporalContext (4 or 9 reflections based on tier)
  5. Format prompt with reflection excerpts
  6. Claude API call (with thinking if Optimal)
  7. Calculate cost → Store report → Log API usage → Increment usage counter
  8. Return evolutionId → Frontend displays report

**Critical Integration Point:**
- **Temporal distribution must sample chronologically:** Early reflections (first 1/3 of journey), middle (middle 1/3), recent (last 1/3)
- **Extended thinking adds significant value** for Optimal tier users (justifies $19/month pricing)
- **Reports must be re-readable:** User should access past reports at /evolution/[id] without regenerating

---

### 7. **Visualization Generation Flow**

**Visualization Journey:**
```
Dream detail page → "Visualize" button → Eligibility check (≥4 reflections) → Generate → Loading (30s) → Achievement narrative displayed ("December 31, 2025: I'm standing in my studio...")
```

**Current State:** LIKELY IMPLEMENTED (similar to evolution)
- **Frontend:** `/app/visualizations/[id]/page.tsx` exists
- **Backend:** `visualizations.generateDreamVisualization` mutation (assumed similar to evolution)
- **Narrative style:** Achievement perspective (future-self looking back)

**Issues Found:**
- **Vision says "Achievement narrative style (experience dream as achieved)"** but need to verify prompt engineering matches this
- **Monthly limits:** Free: 1/month, Optimal: 6/month (same as evolution reports)
- **Context reuse:** Should use same temporal distribution as evolution reports to ensure consistency

**Integration Complexity:** HIGH
- **Why:** Same complexity as evolution reports (eligibility, temporal distribution, AI generation, limits, cost tracking) but with different prompt engineering
- **Risk:** Prompt doesn't convey achievement perspective, narrative feels generic instead of personalized, user confuses visualization with evolution report
- **Recommendation:** Ensure visualization prompt explicitly instructs Claude to write from "December 31, 2025" perspective as if dream is already achieved, using specific details from reflections

---

### 8. **Tier System & Usage Tracking Integration**

**Tier Limits Enforcement Points:**
```
1. Dreams: Free (2), Optimal (7)
2. Reflections: Free (4/month), Optimal (30/month)
3. Evolution reports: Free (1/month), Optimal (6/month)
4. Visualizations: Free (1/month), Optimal (6/month)
5. Context depth: Free (4 reflections), Optimal (9 reflections)
6. Extended thinking: Free (disabled), Optimal (enabled)
```

**Current State:** IMPLEMENTED but enforcement is SCATTERED
- **Backend:** Tier limits defined in multiple places:
  - `dreams.ts`: TIER_LIMITS constant (dreams per tier)
  - `evolution.ts`: check_evolution_limit RPC (evolution reports per month per tier)
  - `visualizations.ts`: Assumed similar RPC function
  - `temporal-distribution.ts`: getContextLimit function (reflection count per tier)
  - `cost-calculator.ts`: getThinkingBudget function (extended thinking tokens per tier)
- **Frontend:** Dashboard shows usage bars, limit warnings on buttons

**Issues Found:**
- **No single source of truth for tier limits:** Limits spread across 5+ files increases risk of inconsistency
- **Usage tracking relies on Supabase RPC functions:** `check_evolution_limit`, `increment_usage_counter`—must verify these are atomic and race-condition safe
- **Monthly reset logic unclear:** Who resets counters on month boundary? Supabase cron job? API middleware?
- **Upgrade prompts exist** but no payment integration (vision says "no Stripe for MVP")—tier simulation only

**Integration Complexity:** MEDIUM
- **Why:** Multiple enforcement points, monthly reset logic, atomic counter increments, tier validation before each action, dashboard aggregation of limits
- **Risk:** Usage counters out of sync (e.g., reflection created but counter not incremented), limit bypass via race condition, monthly reset fails, tier upgrade doesn't immediately grant new limits
- **Recommendation:** Consolidate tier limits into single configuration file (`lib/tier-limits.ts`) imported by all routers to ensure consistency

**Data Flow (Usage Tracking):**
```
Action (Reflect/Generate) →
  Check current usage (query users table: reflection_count_this_month, etc.) →
  Validate against tier limit →
  If allowed: Perform action → Increment counter (atomic) → Return success
  If not: Return error with upgrade prompt
```

**Critical Integration Points:**
- **Atomic increments required:** Two simultaneous reflections shouldn't both succeed if user has 3/4 limit (race condition)
- **Usage displayed everywhere:** Dashboard, limits reached dialogs, upgrade prompts—all must show same counts
- **Tier changes propagate immediately:** If admin upgrades user tier, next API call should use new limits

---

## Frontend/Backend Integration Points

### tRPC Type-Safe RPC Architecture

**Router Structure (10 routers identified):**
```
server/trpc/routers/_app.ts:
  - auth (signup, signin, signout)
  - dreams (create, list, get, update, updateStatus, delete, getLimits)
  - reflections (list, getById, update, delete, submitFeedback, checkUsage)
  - reflection (create) ← Distinct from reflections!
  - users (getProfile, updateProfile)
  - evolution (generateDreamEvolution, generateCrossDreamEvolution, list, get, checkEligibility)
  - visualizations (generate, list, get)
  - artifact (unknown purpose—may be legacy)
  - subscriptions (getCurrentPlan, upgrade, cancel)
  - admin (getUsers, getStats, updateUser)
```

**Integration Complexity:** MEDIUM to HIGH
- **Why:** 10 routers with 40+ procedures, type inference across client/server, middleware chain (protectedProcedure, usageLimitedProcedure), error handling with TRPCError codes
- **Risk:** Type mismatches between client expectations and server responses, middleware not applied correctly, error codes not handled in frontend

**Critical Integration Points:**

#### 1. **Authentication Flow**
```
Frontend: useAuth hook → trpc.users.getProfile.useQuery (on mount)
Backend: protectedProcedure middleware → JWT validation → ctx.user populated
Risk: Token expiration not handled, refresh token logic missing
```

#### 2. **Data Fetching Patterns**
```
Frontend uses React Query via tRPC:
  - useQuery for reads (auto-caching, refetch on window focus disabled)
  - useMutation for writes (onSuccess/onError callbacks)
  - refetch() for manual refresh
Backend: Supabase queries with RLS (Row Level Security)
Risk: Stale cache, RLS policy conflicts, N+1 query problems
```

#### 3. **Error Handling**
```
Backend: throw new TRPCError({ code: 'FORBIDDEN', message: '...' })
Frontend: mutation.error or query.error → Display in UI
Codes seen: FORBIDDEN, NOT_FOUND, INTERNAL_SERVER_ERROR, PRECONDITION_FAILED
Risk: Generic error messages, no retry logic, user doesn't know what action to take
```

---

## External API Integration (Anthropic Claude)

### AI Generation Points (4 identified)

#### 1. **Reflection Creation (reflection.create)**
- **Prompt:** 5 questions formatted with tone instructions (Fusion/Gentle/Intense)
- **Model:** Claude Sonnet 4 (claude-sonnet-4-20250514 assumed)
- **Tokens:** max_tokens: 4000 (output), no extended thinking
- **Cost:** ~$0.015-0.03 per reflection (estimate based on token counts)
- **Latency:** 10-30 seconds
- **Risk:** API timeout, rate limits, prompt injection via user inputs, cost runaway if not tracked

#### 2. **Dream Evolution Report (evolution.generateDreamEvolution)**
- **Prompt:** Temporal context (4 or 9 reflections), dream title, instructions for evolution analysis
- **Model:** Claude Sonnet 4
- **Extended Thinking:** Enabled for Optimal tier (thinking_budget tokens specified)
- **Tokens:** max_tokens: 4000 (output), thinking varies (500-2000 tokens)
- **Cost:** ~$0.04-0.08 per report with thinking, ~$0.02-0.04 without
- **Latency:** 30-60 seconds (longer with thinking)
- **Risk:** Thinking doesn't improve quality enough to justify cost, prompt too generic

#### 3. **Cross-Dream Evolution (evolution.generateCrossDreamEvolution)**
- **Status:** OUT OF SCOPE for MVP per vision document
- **Recommendation:** Hide or disable UI for cross-dream evolution to avoid confusion

#### 4. **Visualization Generation (visualizations.generate)**
- **Prompt:** Achievement narrative ("December 31, 2025: I'm standing..."), uses same temporal context as evolution
- **Model:** Claude Sonnet 4
- **Extended Thinking:** Assumed enabled for Optimal tier (verify)
- **Tokens:** Similar to evolution
- **Cost:** Similar to evolution
- **Risk:** Narrative doesn't feel immersive, prompt engineering not optimized for "future-self" perspective

**Integration Complexity:** VERY HIGH
- **Why:** 4 distinct prompts, tier-based feature gating (thinking on/off), token budget management, cost tracking per call, rate limit handling, latency UX (loading states), error recovery
- **Risk:** API key leaked, costs explode, rate limits hit, prompts generate generic responses, latency causes user frustration

**Critical Integration Points:**
- **API Key Security:** Must be in environment variables, never exposed to frontend
- **Cost Tracking:** Every API call logged to `api_usage_log` table with input/output/thinking tokens and USD cost
- **Rate Limits:** Anthropic enforces rate limits (requests per minute, tokens per minute)—need exponential backoff retry logic
- **Prompt Injection:** User inputs (dream, plan, relationship, offering) concatenated into prompts—sanitize to prevent prompt injection attacks
- **Timeout Handling:** 30-60 second AI calls need timeout handling (show "Still generating..." message)

---

## Data Flow Patterns Across System

### 1. **User Authentication Data Flow**
```
Sign Up:
  Frontend form → auth.signup mutation → Backend: bcrypt hash password → Supabase insert user → JWT token generated → Frontend stores token in localStorage → Redirect to dashboard

Sign In:
  Frontend form → auth.signin mutation → Backend: bcrypt compare password → JWT token generated → Frontend stores token → Redirect to dashboard

Session Management:
  Page load → useAuth hook → users.getProfile query → Backend: Verify JWT → Return user data → Frontend stores in user state
```

**Issues:**
- **Token stored in localStorage:** Vulnerable to XSS attacks, consider httpOnly cookies
- **No token refresh logic:** If token expires mid-session, user must sign in again
- **No "Remember Me" option:** Users must sign in every session

---

### 2. **Dream → Reflection → Evolution Data Flow**
```
Create Dream:
  User fills form → dreams.create mutation → Check tier limit → Supabase insert dream → Return dream object → Frontend refetches dreams list → Dream card appears

Create Reflection:
  User selects dream → Fills 5 questions → Selects tone → reflection.create mutation →
    Backend: Check usage limit → Format prompt → Call Claude API → Calculate cost →
    Supabase insert reflection → Increment usage counter → Return reflection ID →
    Frontend redirects to /reflection?id=X → Display AI response

Generate Evolution:
  User clicks "Generate Evolution" → evolution.generateDreamEvolution mutation →
    Backend: Get dream reflections → Check ≥4 threshold → Check monthly limit →
    Select temporal context (4 or 9) → Format prompt → Call Claude API (with thinking if Optimal) →
    Calculate cost → Supabase insert evolution_report → Log API usage → Increment counter →
    Return evolution text → Frontend displays report → Option to generate visualization
```

**Critical Dependencies:**
- **Dreams exist before reflections:** Reflection form requires dreamId (either from URL ?dreamId=X or user selection)
- **Reflections accumulate before evolution:** Must have ≥4 reflections on single dream to unlock evolution
- **Temporal distribution depends on reflection timestamps:** Order matters (created_at ASC)

---

### 3. **Dashboard Data Aggregation Flow**
```
Dashboard Load (5 parallel queries):
  1. users.getProfile → User name, tier, daysActive, usage counters
  2. dreams.list (status: active, includeStats: true) → Active dreams with reflection counts, days left
  3. reflections.list (limit: 3, sortBy: created_at, sortOrder: desc) → Last 3 reflections
  4. evolution.checkEligibility → Check if any dream has ≥4 reflections
  5. subscriptions.getCurrentPlan → Current tier, renewal date, payment status

  → Render dashboard cards with aggregated data
```

**Issue:** No single query—risk of data inconsistency if one query succeeds and another fails

---

## Responsive Design & Accessibility

### Current State

**Responsive Breakpoints (from Tailwind config and component styles):**
- **Mobile:** < 480px (sm: prefix)
- **Tablet:** 768px (md: prefix)
- **Desktop:** 1024px (lg: prefix)
- **Large Desktop:** 1200px (xl: prefix)

**Responsive Patterns Observed:**
- Dashboard grid: 3 cols (desktop) → 2 cols (tablet) → 1 col (mobile)
- Forms: Full width on mobile, constrained max-width on desktop
- Navigation: Hamburger menu (assumed) on mobile, full nav on desktop
- Glass cards: Adjust padding/blur based on screen size

**Accessibility Findings:**
- **Form labels:** Present with htmlFor attributes
- **ARIA labels:** Some buttons have aria-label (e.g., "Toggle password visibility")
- **Keyboard navigation:** Modal/dropdown components support keyboard (Enter/Space to select)
- **Focus states:** Form inputs have :focus styles with border color changes
- **Color contrast:** White text on dark backgrounds generally passes WCAG AA, but some glass components with low opacity may fail (need audit)
- **Screen reader support:** No ARIA live regions for loading states, no announcements for AI response completion

**Integration Complexity:** MEDIUM
- **Why:** Responsive design mostly handled by Tailwind utility classes, glass components have viewport-based sizing (clamp() CSS), mobile UX acceptable but not optimized
- **Risk:** Mobile users have degraded experience (e.g., 5-question reflection on small screen is tedious), accessibility gaps for screen reader users

**Recommendations:**
- Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (verify exists)
- Test dashboard on 360px width (smallest common mobile)
- Add ARIA live regions for AI generation status ("Generating reflection, please wait...")
- Audit color contrast with tool like Axe DevTools
- Consider mobile-specific optimizations (e.g., swipe navigation for reflection steps)

---

## Error Handling & Edge Cases

### Error Scenarios Identified

#### 1. **Network Failures**
- **Scenario:** User loses internet mid-reflection submission
- **Current Handling:** tRPC mutation onError callback shows error message
- **Issue:** Form data lost if page refreshes, no retry logic, unclear error message
- **Recommendation:** Persist form data to localStorage during reflection flow, add automatic retry with exponential backoff

#### 2. **API Timeouts (AI Generation)**
- **Scenario:** Claude API takes >60 seconds or times out
- **Current Handling:** Loading spinner indefinitely? (need to verify)
- **Issue:** User doesn't know if still processing or hung
- **Recommendation:** Show "Still generating... this may take up to 60 seconds" message, implement timeout with clear error ("Generation timed out, please try again")

#### 3. **Usage Limit Reached**
- **Scenario:** User tries to create 5th reflection on Free tier (limit: 4/month)
- **Current Handling:** reflections.checkUsage returns canReflect: false → Dashboard button disabled → Upgrade prompt shown
- **Issue:** User might still access /reflection directly via URL and bypass check
- **Recommendation:** Enforce limit in backend reflections.create mutation with FORBIDDEN error code, frontend shows upgrade modal

#### 4. **Insufficient Reflections for Evolution**
- **Scenario:** User tries to generate evolution report with only 3 reflections on dream
- **Current Handling:** Backend throws PRECONDITION_FAILED error ("Need at least 4 reflections")
- **Issue:** Error message not actionable, user doesn't know how many more reflections needed
- **Recommendation:** Frontend checks reflection count before showing "Generate Evolution" button, show progress indicator ("3/4 reflections—1 more to unlock!")

#### 5. **Invalid Dream ID**
- **Scenario:** User navigates to /dreams/invalid-uuid or /reflection?dreamId=invalid-uuid
- **Current Handling:** Backend throws NOT_FOUND error
- **Issue:** Generic 404 page, user doesn't know what went wrong
- **Recommendation:** Catch NOT_FOUND errors in frontend, show friendly "Dream not found" message with link to dreams list

#### 6. **Duplicate Dream Selection**
- **Scenario:** User opens reflection flow in 2 tabs, selects same dream in both, submits reflections simultaneously
- **Current Handling:** Both reflections created, both increment usage counter
- **Issue:** User may exceed limit unintentionally if race condition occurs
- **Recommendation:** Implement optimistic locking or transaction isolation in Supabase to prevent duplicate submissions

---

## Integration Challenges & Recommendations

### Challenge 1: Decentralized Dashboard Data Fetching
**Problem:** Dashboard makes 5 parallel tRPC queries (users, dreams, reflections, evolution, subscriptions)—risk of data inconsistency and performance overhead

**Recommendation:** Create single `dashboard.getAll` tRPC query that returns all dashboard data in one optimized Supabase query with JOINs/aggregations

**Impact:** Reduced network overhead, guaranteed data consistency, simplified loading states

---

### Challenge 2: Onboarding Flow Missing
**Problem:** Vision specifies 3-step onboarding after signup, but no `/onboarding` page exists in codebase

**Recommendation:** Build onboarding flow with:
- Step 1: "Welcome! Mirror of Dreams helps you reflect on your life's dreams."
- Step 2: "Complete 5-question reflections regularly to track your growth."
- Step 3: "Free tier: 2 dreams, 4 reflections/month. Upgrade for unlimited magic."
- Skip button on each step, "Get Started" button on final step redirects to /dreams

**Impact:** Users understand product value before creating first dream, churn reduction

---

### Challenge 3: Tier Limit Configuration Scattered
**Problem:** Tier limits defined in 5+ files (dreams.ts, evolution.ts, cost-calculator.ts, etc.)—risk of inconsistency

**Recommendation:** Create `lib/tier-limits.ts`:
```typescript
export const TIER_LIMITS = {
  free: {
    dreams: 2,
    reflections: 4,
    evolution_reports: 1,
    visualizations: 1,
    context_reflections: 4,
    extended_thinking: false,
  },
  optimal: {
    dreams: 7,
    reflections: 30,
    evolution_reports: 6,
    visualizations: 6,
    context_reflections: 9,
    extended_thinking: true,
  },
} as const;
```
Import this in all routers to ensure single source of truth

**Impact:** Eliminates inconsistency risk, makes tier adjustments trivial (change one file)

---

### Challenge 4: AI Prompt Engineering Not Verified
**Problem:** Evolution report and visualization prompts exist in code, but unclear if they produce the "soft, glossy, sharp" tone described in vision

**Recommendation:**
- Test prompts with real user reflections to verify output quality
- Add explicit tone instructions to prompts: "Write with compassion (soft), precision (sharp), and beauty (glossy)"
- For visualizations, ensure prompt says "Write from December 31, 2025, as if the dream is already achieved"

**Impact:** AI responses align with brand voice, users feel understood and inspired

---

### Challenge 5: Mobile UX Not Optimized
**Problem:** 5-question reflection flow on mobile requires extensive scrolling, small touch targets, poor input experience

**Recommendation:**
- Use full-screen modals for reflection flow on mobile
- Increase button sizes (min 44x44px touch targets)
- Auto-advance after tone selection (no "Continue" button needed)
- Consider swipe gestures for step navigation

**Impact:** Mobile users have delightful experience, higher reflection completion rates

---

### Challenge 6: Cost Tracking Not Visible to Admins
**Problem:** API usage logged to `api_usage_log` table, but no admin dashboard to view costs

**Recommendation:** Build admin page at `/admin/costs` showing:
- Total API costs this month (USD)
- Cost per user (top 10 spenders)
- Cost per operation type (reflections vs evolution vs visualizations)
- Token usage trends (input/output/thinking)

**Impact:** Ahiya can monitor costs, identify abuse, optimize prompts to reduce token usage

---

## Recommendations for Master Plan

### 1. **Prioritize Onboarding Flow (HIGH PRIORITY)**
Missing onboarding breaks Sarah's Journey—should be Iteration 1 work to establish foundation

### 2. **Consolidate Dashboard Data Fetching (MEDIUM PRIORITY)**
Create `dashboard.getAll` query to reduce API calls from 5 to 1—improves performance and consistency

### 3. **Verify AI Prompt Quality (HIGH PRIORITY)**
Test evolution and visualization prompts with real data to ensure "soft, glossy, sharp" tone matches vision

### 4. **Enforce Usage Limits in Backend (HIGH PRIORITY)**
All usage checks must happen in backend mutations, not just frontend—prevents bypass via direct API calls

### 5. **Build Cost Monitoring Dashboard (MEDIUM PRIORITY)**
Admin needs visibility into AI API costs to avoid budget overruns

### 6. **Optimize Mobile UX (MEDIUM PRIORITY)**
Reflection flow is core experience—mobile users deserve first-class treatment

### 7. **Add Error Recovery Patterns (LOW PRIORITY)**
Persist reflection form data to localStorage, add retry logic for network failures

### 8. **Audit Accessibility (LOW PRIORITY)**
Run Axe DevTools, add ARIA live regions, ensure keyboard navigation works everywhere

---

## Technology Stack Assessment

### Frontend Stack (Next.js + tRPC + Framer Motion)
- **Next.js 14:** App router with React Server Components and client components mixed
- **tRPC 11:** Type-safe RPC with React Query integration
- **Framer Motion:** Animations for page transitions, card reveals, modal open/close
- **Tailwind CSS:** Utility-first styling with custom glass morphism components
- **Zustand:** Assumed for client state (not seen in files reviewed—may be unused)

**Strengths:**
- Type safety across full stack (TypeScript)
- Excellent DX with tRPC (auto-complete, type inference)
- Beautiful animations with Framer Motion
- Responsive design with Tailwind

**Weaknesses:**
- Next.js SSR/SSG not leveraged (all pages are client-side via 'use client')
- tRPC router structure could be more modular (10 routers in one _app.ts file)
- Zustand may be overkill if only using React Query for state

---

### Backend Stack (tRPC + Supabase + Anthropic)
- **tRPC Server:** Express-like middleware chain (protectedProcedure, usageLimitedProcedure)
- **Supabase:** PostgreSQL database with RLS (Row Level Security), RPC functions for complex logic
- **Anthropic Claude API:** AI generation via official SDK
- **bcryptjs:** Password hashing
- **jsonwebtoken:** JWT-based authentication

**Strengths:**
- Supabase RLS ensures data isolation per user
- RPC functions for atomic operations (limit checks, counter increments)
- Cost calculation and API usage logging built-in

**Weaknesses:**
- No connection pooling config seen (Supabase handles this?)
- No rate limiting middleware (could be exploited)
- JWT secret management unclear (must be in env vars)
- No Redis caching layer (all queries hit Supabase)

---

### Database Schema (Supabase PostgreSQL)
Tables identified from migration files:
- **users:** id, email, name, tier, subscription_status, reflection_count_this_month, total_reflections, is_creator, is_admin, created_at, last_sign_in_at
- **dreams:** id, user_id, title, description, target_date, category, priority, status, achieved_at, archived_at, released_at, created_at
- **reflections:** id, user_id, dream_id (nullable), dream, plan, has_date, dream_date, relationship, offering, tone, ai_response, rating, user_feedback, view_count, created_at
- **evolution_reports:** id, user_id, dream_id (nullable for cross-dream), report_category, evolution, reflections_analyzed (array), reflection_count, created_at
- **visualizations:** id, user_id, dream_id, visualization_text, style, reflections_analyzed, created_at
- **api_usage_log:** id, user_id, operation_type, model_used, input_tokens, output_tokens, thinking_tokens, cost_usd, dream_id, metadata (JSONB), created_at

**Strengths:**
- Proper foreign keys with ON DELETE SET NULL for dreams (reflections persist if dream deleted)
- RLS policies likely enforced (need to verify)
- JSONB metadata column for flexible evolution/visualization storage

**Weaknesses:**
- No indexes mentioned (e.g., index on user_id + created_at for reflections list queries)
- reflection_count_this_month in users table could become stale (needs monthly reset job)
- No monthly_usage_tracking table mentioned in vision (may exist in migrations)

---

## Notes & Observations

### Positive Findings
1. **tRPC integration is solid:** Type safety works well, mutations have proper onSuccess/onError handlers
2. **Glass UI components are beautiful:** GlassCard, GlowButton, CosmicLoader, ProgressOrbs all have consistent aesthetic
3. **Reflection flow is well-architected:** Single-page component with view modes (questionnaire | output) is elegant
4. **Cost tracking is comprehensive:** Every AI call logs tokens and USD cost to database
5. **Temporal distribution algorithm is thoughtful:** Selecting 1/3 early, 1/3 middle, 1/3 recent reflections ensures evolution reports show growth trajectory

### Areas of Concern
1. **Onboarding missing:** Critical gap in Sarah's Journey—users won't understand product without it
2. **Dashboard data fetching decentralized:** 5 parallel queries risk inconsistency and performance issues
3. **Tier limits scattered:** No single source of truth—risk of inconsistency across routers
4. **Mobile UX not optimized:** Reflection flow on small screens will frustrate users
5. **No admin cost dashboard:** Ahiya can't monitor AI spending without manual Supabase queries
6. **Token refresh logic missing:** Users kicked out mid-session if JWT expires

### Integration Surprises
- **Two reflection routers exist:** `reflections` (CRUD) vs `reflection` (AI generation)—confusing naming
- **Cross-dream evolution implemented:** But vision says out of scope—should be hidden/disabled
- **Three tones available:** But vision says "Sacred Fusion only in MVP"—UI shows Gentle and Intense options
- **Artifact router exists:** Purpose unknown—may be legacy code from previous iteration

---

*Exploration completed: 2025-11-12*
*This report informs master planning decisions with focus on user experience flows, frontend/backend integration points, and data flow patterns across the system.*
