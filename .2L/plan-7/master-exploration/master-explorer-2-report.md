# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
Transform Mirror of Dreams from a functional 6.5/10 product to a complete 9/10 commercially viable sanctuary by adding critical missing pages (Profile, Settings, About, Pricing), creating a fully populated demo user experience, and enhancing the reflection UX to feel welcoming rather than clinical.

---

## Requirements Analysis

### Scope Assessment
- **Total must-have features identified:** 10 major feature groups
- **User stories/acceptance criteria:** 150+ detailed acceptance criteria across 10 features
- **Estimated total work:** 60-80 hours (3-4 weeks of focused development)

**Feature breakdown:**
1. Landing Page Transformation (18 criteria)
2. Profile Page (16 criteria)
3. Settings Page (15 criteria)
4. Demo User Experience (15 criteria)
5. About Page (11 criteria)
6. Enhanced Reflection Form (17 criteria)
7. Individual Reflection Display (15 criteria)
8. Pricing Page (13 criteria)
9. Empty State Enhancements (21 criteria)
10. Reflection Collection Enhancements (9 criteria)

### Complexity Rating
**Overall Complexity: COMPLEX**

**Rationale:**
- **10 distinct feature groups** requiring coordination across frontend, backend, and database
- **Requires both UI/UX transformation AND data infrastructure** (demo user population, settings storage)
- **Integration points span entire application** - Landing, Dashboard, Profile, Settings, Reflection flow, Collection views
- **Content creation dependency** - Demo user requires 5 dreams, 12-15 reflections, evolution reports, all with high-quality authentic content
- **No new technology requirements** - Uses existing Next.js 14, tRPC, Supabase stack (reduces risk)
- **Backward compatibility required** - Cannot break existing features from Plan-6 (9.2/10 technical quality)

---

## Dependency Graph Analysis

### Critical Path Dependencies

```
PHASE 1: Infrastructure & Demo Foundation
├── Demo User Database Setup (BLOCKING - enables all testing)
│   ├── Seed script: 5 dreams (varied categories)
│   ├── 12-15 reflections (realistic content, distributed dates)
│   ├── Evolution reports (4+ reflections per dream)
│   └── Visualizations (achievement narratives)
│       ↓
├── Profile/Settings Backend (BLOCKING - enables account management)
│   ├── Add preferences JSONB column to users table
│   ├── tRPC mutations: updateProfile, changeEmail, changePassword
│   ├── tRPC mutations: updatePreferences, deleteAccount
│   └── Settings validation schemas (Zod)
│       ↓
└── Landing Page Transformation (BLOCKING - first impression)
    ├── Hero section redesign (new headline, dual CTAs)
    ├── "See Demo" button → auto-login to demo@mirrorofdreams.com
    ├── Real value demonstration (replace emoji cards)
    └── Footer links → About, Pricing (must exist)

PHASE 2: Core Pages & Features
├── About Page (depends on: Landing footer)
│   ├── Founder story content (from Ahiya)
│   ├── Mission statement
│   └── Values & philosophy
│       ↓
├── Pricing Page (depends on: Landing footer, upgrade flows)
│   ├── Tier comparison table (uses existing tier limits)
│   ├── FAQ section
│   └── Stripe integration (already exists, minimal changes)
│       ↓
├── Profile Page (depends on: Backend mutations from Phase 1)
│   ├── Account info section (display + edit)
│   ├── Tier & subscription display (reads existing data)
│   ├── Usage statistics (reads reflection_count_this_month)
│   └── Account actions (change email/password, delete)
│       ↓
└── Settings Page (depends on: Backend mutations, preferences schema)
    ├── Notification preferences (stores in JSONB)
    ├── Reflection preferences (default_tone)
    ├── Display preferences (reduce_motion_override)
    └── Privacy settings (analytics opt-in/out)

PHASE 3: Experience Enhancements
├── Enhanced Reflection Form (depends on: Settings default_tone)
│   ├── Welcoming micro-copy (before/after dream selection)
│   ├── Character counter redesign (word count, color states)
│   ├── Tone selection enhancement (descriptions, hover states)
│   └── Encouragement throughout (progress indicator, checkmarks)
│       ↓
├── Individual Reflection Display (depends on: Existing markdown rendering)
│   ├── Visual header (dream, date, tone badge)
│   ├── AI response highlighting (key insights, pull quotes)
│   ├── User reflections section (collapsible)
│   └── Metadata sidebar (word count, time spent)
│       ↓
├── Reflection Collection Enhancements (depends on: Existing filters)
│   ├── Filter enhancement (dream, tone, date range)
│   ├── Reflection card redesign (hover states, visual hierarchy)
│   └── Pagination (20/page, already implemented)
│       ↓
└── Empty State Redesign (depends on: Design system components)
    ├── Dashboard empty states (no dreams, no reflections)
    ├── Dreams page empty (cosmic illustrations)
    ├── Reflections page empty (guidance)
    ├── Evolution page empty (progress indicator 0/4)
    └── Visualizations page empty (unlock messaging)
```

### Parallel Work Opportunities

**Can be built in parallel (no dependencies):**
- About Page ← Content writing
- Pricing Page ← Tier limits already defined
- Empty State Redesigns ← Component library exists
- Reflection Form Micro-copy ← Independent UI changes

**Sequential dependencies (must wait):**
- Profile Page MUST wait for backend mutations
- Settings Page MUST wait for preferences schema
- Demo User Experience MUST be first (enables testing all features)
- Landing Page "See Demo" MUST wait for demo user creation

---

## Feature Dependency Matrix

### Feature 1: Demo User Experience (P0 - BLOCKING)
**Dependencies:**
- Database access (Supabase)
- Existing dreams table schema
- Existing reflections table schema
- Evolution report generation (existing backend)
- Visualization generation (existing backend)

**Blocks:**
- Landing Page "See Demo" CTA
- Stakeholder validation testing
- User conversion flow testing

**Risk Level:** MEDIUM
- **Risk:** Demo content quality determines product perception
- **Mitigation:** Invest time in writing authentic, thoughtful reflections (not lorem ipsum)
- **Risk:** Demo account abuse (spam, offensive content)
- **Mitigation:** Read-only demo OR nightly reset mechanism

**Estimated effort:** 8-12 hours (including content creation)

---

### Feature 2: Landing Page Transformation (P0 - BLOCKING)
**Dependencies:**
- Demo user must exist (for "See Demo" auto-login)
- About page must exist (footer link)
- Pricing page must exist (footer link)
- Existing CosmicBackground component
- Existing LandingNavigation component

**Blocks:**
- First impression & conversion
- Demo user discovery flow
- About/Pricing navigation

**Risk Level:** MEDIUM
- **Risk:** Copy doesn't resonate (too marketing-speak)
- **Mitigation:** User (Ahiya) must review all copy for authenticity
- **Risk:** Screenshots quickly outdated as product evolves
- **Mitigation:** Use high-level visuals, not pixel-perfect screenshots

**Estimated effort:** 6-8 hours

---

### Feature 3: Profile Page (P0 - Core Product Completeness)
**Dependencies:**
- Backend tRPC mutations: updateProfile, changeEmail, changePassword, deleteAccount
- Existing users.getProfile query (already exists in users.ts)
- Existing GlassCard, GlassInput components (Plan-6)
- Email verification flow (if change email implemented)

**Blocks:**
- User self-service account management
- Tier visibility (users see what tier they're on)
- Usage statistics transparency

**Risk Level:** MEDIUM
- **Risk:** Email change verification flow complex (send to both old/new)
- **Mitigation:** Start with simple in-place edit, add verification later if needed
- **Risk:** Password change requires current password validation
- **Mitigation:** Use existing bcrypt compare logic from auth.ts
- **Risk:** Delete account flow risky (accidental deletion)
- **Mitigation:** Scary confirmation modal + password required

**Estimated effort:** 8-10 hours

---

### Feature 4: Settings Page (P0 - Core Product Completeness)
**Dependencies:**
- Database schema: preferences JSONB column on users table
- Backend tRPC mutation: updatePreferences
- Existing user context (to read current settings)
- Plan-6 useReducedMotion hook (to respect reduce_motion_override)

**Blocks:**
- User preferences persistence
- Notification preferences (if email system added later)
- Default tone selection (impacts reflection form)

**Risk Level:** LOW
- **Risk:** JSONB column migration might affect existing users
- **Mitigation:** Add column with DEFAULT '{}', NULL-safe reads
- **Risk:** Settings changes not immediately reflected in UI
- **Mitigation:** Invalidate React Query cache on setting change

**Estimated effort:** 6-8 hours

---

### Feature 5: About Page (P1 - Trust & Conversion)
**Dependencies:**
- Content from founder (Ahiya): personal story, mission, values
- Existing CosmicBackground component
- Existing GlassCard component
- Landing page footer must link here

**Blocks:**
- Trust-building for new users
- Founder story visibility
- "Why this exists" messaging

**Risk Level:** LOW
- **Risk:** Content creation bottleneck (waiting for Ahiya's story)
- **Mitigation:** Create page structure first, content can be added incrementally
- **Risk:** Personal photos needed (humanizes the product)
- **Mitigation:** Placeholder with "coming soon" if photos not ready

**Estimated effort:** 4-6 hours (excluding content writing time)

---

### Feature 6: Pricing Page (P1 - Trust & Conversion)
**Dependencies:**
- Existing tier limits from users.ts (TIER_LIMITS: free=1, essential=5, premium=10)
- NOTE: Vision mentions different limits (free=10, premium=50, pro=unlimited)
- Stripe integration (already exists)
- Existing subscription types

**Blocks:**
- Tier upgrade flows
- Free → Premium conversion
- Pricing transparency

**Risk Level:** MEDIUM
- **Risk:** Tier limits MISMATCH between vision and current code
- **Mitigation:** Clarify with stakeholder (Ahiya) - update either code or vision
- **Risk:** Stripe price IDs must match tier definitions
- **Mitigation:** Verify Stripe dashboard matches pricing page

**CRITICAL FINDING:** Vision says free=10 reflections/month, code says free=1. This MUST be resolved before building Pricing page.

**Estimated effort:** 6-8 hours (+ time to resolve tier limit discrepancy)

---

### Feature 7: Enhanced Reflection Form (P1 - Experience Quality)
**Dependencies:**
- Existing reflection form components (QuestionCard, ToneSelectionCard)
- Settings page default_tone preference (optional, can default to 'fusion')
- Existing character counter logic
- Plan-6 design system (gradient text, Framer Motion variants)

**Blocks:**
- User perception of reflection experience
- Warmth vs. clinical feel

**Risk Level:** LOW
- **Risk:** Too much encouragement feels patronizing
- **Mitigation:** User (Ahiya) must test and provide feedback
- **Risk:** Micro-copy changes increase translation burden (if multi-language later)
- **Mitigation:** English-only for Plan-7 (vision confirms)

**Estimated effort:** 6-8 hours

---

### Feature 8: Individual Reflection Display (P1 - Experience Depth)
**Dependencies:**
- Existing markdown rendering (react-markdown from Plan-6)
- Existing reflection detail page (app/reflections/[id]/page.tsx)
- Plan-6 XSS security fixes (already implemented)

**Blocks:**
- Reflection revisit experience
- Demonstrating value of past reflections

**Risk Level:** LOW
- **Risk:** AI response highlighting complex (parsing markdown for key insights)
- **Mitigation:** Start with visual polish (header, typography), advanced highlighting later
- **Risk:** Pull quotes extraction requires NLP or manual tagging
- **Mitigation:** Defer pull quotes to post-MVP, focus on visual hierarchy

**Estimated effort:** 6-8 hours

---

### Feature 9: Pricing Page (Already covered above)

---

### Feature 10: Empty State Enhancements (P1 - Onboarding)
**Dependencies:**
- Existing EmptyState component (enhanced in Plan-6)
- Cosmic-themed SVG illustrations (can use existing cosmic theme or create simple SVGs)
- All pages that have empty states: Dashboard, Dreams, Reflections, Evolution, Visualizations

**Blocks:**
- First-time user guidance
- New user activation ("what do I do next?")

**Risk Level:** LOW
- **Risk:** Illustrations time-consuming to create
- **Mitigation:** Use CSS/SVG cosmic effects (stars, gradients) instead of complex illustrations
- **Risk:** Empty states shown to users with data (edge case)
- **Mitigation:** Conditional rendering already handles this

**Estimated effort:** 8-10 hours (across 5 pages)

---

### Feature 11: Reflection Collection Enhancements (P1 - Experience Depth)
**Dependencies:**
- Existing reflections collection page (app/reflections/page.tsx)
- Existing filters (dream, tone) - implemented in Plan-6
- Existing pagination (20/page) - implemented in Plan-6

**Blocks:**
- None (enhancement, not blocking)

**Risk Level:** LOW
- **Risk:** Filter logic complex (multiple simultaneous filters)
- **Mitigation:** Build incrementally - date range filter can be Phase 2

**Estimated effort:** 4-6 hours

---

## Technology Stack Risk Assessment

### Existing Stack (Plan-6 Foundation)
**Stack:**
- Next.js 14 (App Router)
- React 18.3.1
- TypeScript 5.9.3
- tRPC 11.6.0
- Supabase PostgreSQL (via @supabase/supabase-js 2.50.4)
- Framer Motion 11.18.2
- Tailwind CSS 3.4.1
- React Markdown 10.1.0 (added in Plan-6, XSS-safe)

**Risk Assessment:** LOW
- All dependencies up-to-date
- No breaking changes anticipated
- Plan-6 achieved 9.2/10 technical quality with this stack

### New Dependencies Required
**None!** All features achievable with existing stack.

**Risk Assessment:** VERY LOW
- No new npm packages
- No version upgrades
- No migration risk

### Database Schema Changes

**Required:**
1. Add `preferences` JSONB column to `users` table
2. Add `is_demo` boolean flag to `users` table (for demo account)
3. Create demo user seed script

**Migration SQL:**
```sql
-- Add preferences column (NULL-safe, default empty object)
ALTER TABLE public.users
  ADD COLUMN preferences JSONB DEFAULT '{}';

-- Add demo flag
ALTER TABLE public.users
  ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;

-- Create index on is_demo for demo login queries
CREATE INDEX idx_users_is_demo ON public.users(is_demo) WHERE is_demo = TRUE;
```

**Risk Assessment:** LOW
- Additive changes only (no column removal)
- Default values prevent NULL issues
- Backward compatible with existing users
- No data migration required (preferences start empty)

---

## Integration Risk Assessment

### Integration Point 1: Demo User Auto-Login
**Flow:** Landing "See Demo" → Auto-login → Dashboard (pre-populated)

**Integration Complexity:** MEDIUM
- Requires authentication bypass or known credentials
- Must handle session management (JWT token)
- Demo banner must appear (different from normal user)

**Risks:**
- **Security Risk:** Public demo credentials could be abused
- **Mitigation 1:** Read-only demo account (cannot create/edit)
- **Mitigation 2:** Nightly data reset (restore to pristine state)
- **Mitigation 3:** Rate limiting on demo login endpoint

**Dependencies:**
- auth.ts signin flow (existing)
- Demo user exists in database
- Demo banner component (new)

**Estimated Integration Effort:** 3-4 hours

---

### Integration Point 2: Settings → Reflection Form
**Flow:** User sets default_tone in Settings → Pre-selected in reflection form

**Integration Complexity:** LOW
- Settings stores preference in JSONB
- Reflection form reads from user context
- Fallback to 'fusion' if no preference

**Risks:**
- **Cache Invalidation:** Settings change not reflected until page refresh
- **Mitigation:** Invalidate React Query cache on preference update

**Dependencies:**
- User context provider (existing)
- tRPC client invalidation (existing pattern)

**Estimated Integration Effort:** 1-2 hours

---

### Integration Point 3: Profile → Subscription Management
**Flow:** User views tier in Profile → Clicks "Upgrade" → Pricing page → Stripe checkout

**Integration Complexity:** LOW
- Existing Stripe integration (webhooks in place)
- Profile reads subscription_status from database
- No new payment logic required

**Risks:**
- **None** - Using existing Stripe flow

**Estimated Integration Effort:** 2 hours (UI only)

---

### Integration Point 4: Landing → About/Pricing Pages
**Flow:** User clicks footer links → Navigate to About/Pricing

**Integration Complexity:** VERY LOW
- Simple Next.js routing (<a> or <Link>)
- No state to pass

**Estimated Integration Effort:** 30 minutes

---

## Timeline & Resource Estimation

### Recommended Iteration Breakdown: MULTI-ITERATION (3 phases)

**Total Estimated Duration:** 60-80 hours (15-20 days at 4 hours/day)

---

### Iteration 1: Foundation & Demo (20-24 hours)
**Priority:** P0 - BLOCKING (enables all subsequent testing)

**Scope:**
1. **Demo User Creation (8-12 hours)**
   - Write seed script (5 dreams, varied categories)
   - Create 12-15 authentic reflections (200-400 words each)
   - Generate evolution reports (run AI on demo data)
   - Generate visualizations
   - Test demo login flow

2. **Landing Page Transformation (6-8 hours)**
   - Hero section redesign (headline, subheadline, dual CTAs)
   - "See Demo" button implementation (auto-login)
   - Replace emoji feature cards with real value stories
   - Add screenshots/visuals (dashboard, reflection output, evolution)
   - Footer enhancement (About, Pricing, Privacy, Terms links)
   - Mobile responsive testing

3. **Backend Infrastructure (4-6 hours)**
   - Database migration: preferences JSONB, is_demo flag
   - tRPC mutations: updateProfile, changeEmail, changePassword
   - tRPC mutations: updatePreferences, deleteAccount
   - Settings validation schemas (Zod)

**Why First:**
- Demo user is CRITICAL for stakeholder validation and conversion
- Landing page is the gateway (first impression)
- Backend mutations needed before building Profile/Settings

**Risk Level:** MEDIUM
- Demo content quality critical
- Landing copy must resonate

**Success Criteria:**
- Demo account has 5 dreams, 12+ reflections, 2+ evolution reports
- Landing page "See Demo" auto-logs into demo account
- Backend mutations tested and working

---

### Iteration 2: Core Pages (18-24 hours)
**Priority:** P0 - Product Completeness

**Scope:**
1. **Profile Page (8-10 hours)**
   - Account information section (display + edit)
   - Tier & subscription info display
   - Usage statistics (reflections this month, total, active dreams)
   - Account actions (change email/password, delete account)
   - Visual design (GlassCard, GlassInput, toast confirmations)

2. **Settings Page (6-8 hours)**
   - Notification preferences (email toggles)
   - Reflection preferences (default tone, show character counter)
   - Display preferences (reduce motion override, theme)
   - Privacy settings (analytics opt-in/out)
   - Danger zone (clear drafts, reset preferences, delete account link)

3. **About Page (4-6 hours)**
   - Founder story section (content from Ahiya)
   - Mission statement
   - Product philosophy (why reflection + AI)
   - Values (privacy-first, substance over flash)
   - Call to action ("Start Your Free Account")

**Why Second:**
- Users need self-service account management (table stakes)
- About page builds trust (essential for commercial product)
- Depends on backend from Iteration 1

**Risk Level:** LOW-MEDIUM
- Content dependency (Ahiya's story)
- Email change verification flow complex

**Success Criteria:**
- Profile page shows all account info, allows editing
- Settings page persists all preferences
- About page tells compelling story

---

### Iteration 3: Experience Polish (22-32 hours)
**Priority:** P1 - Experience Quality

**Scope:**
1. **Pricing Page (6-8 hours)**
   - FIRST: Resolve tier limit discrepancy (vision vs code)
   - Tier comparison table (Free, Premium, Pro, Creator)
   - Feature details with tooltips
   - FAQ section (5-7 common questions)
   - CTA per tier (Start Free, Trial, Contact Sales)
   - Annual billing toggle

2. **Enhanced Reflection Form (6-8 hours)**
   - Welcoming introduction micro-copy
   - Character counter redesign (word count, color states)
   - Tone selection enhancement (descriptions, hover states)
   - Progress indicator ("You're doing great", checkmarks)
   - Test for warmth (Ahiya feedback)

3. **Individual Reflection Display (6-8 hours)**
   - Visual header (dream name, date, tone badge)
   - AI response enhancement (first paragraph larger, key insights highlighted)
   - User reflections section (collapsible)
   - Metadata sidebar/footer (word count, time spent)
   - Actions (Reflect Again, Share, Download)

4. **Empty State Redesign (8-10 hours)**
   - Dashboard empty states (no dreams, no reflections)
   - Dreams page empty (cosmic illustrations, examples)
   - Reflections page empty (journal opening illustration)
   - Evolution page empty (progress indicator 0/4)
   - Visualizations page empty (unlock messaging)

5. **Reflection Collection Enhancements (4-6 hours)**
   - Filter enhancement (dream dropdown, tone pills, date range)
   - Reflection card redesign (hover states, visual hierarchy)
   - Sort options (most recent, oldest, longest)

**Why Third:**
- Pricing page depends on About page (trust-building first)
- Experience polish depends on core features existing
- Empty states guide new users after Profile/Settings available

**Risk Level:** LOW
- Mostly UI/UX polish
- No complex backend logic

**Success Criteria:**
- Pricing page clarifies tier value
- Reflection form feels welcoming (6.5 → 9/10)
- Individual reflections beautiful (worth revisiting)
- Empty states guide action (<5 seconds to understand)

---

## Critical Risks & Mitigation Strategies

### Risk 1: Tier Limits Mismatch (HIGH PRIORITY)
**Severity:** HIGH
**Impact:** Pricing page, upgrade flows, user expectations all affected

**Current State:**
- Code (`users.ts`): free=1, essential=5, premium=10
- Vision: free=10, premium=50, pro=unlimited, creator=unlimited

**Root Cause:** Vision describes aspirational limits, code has conservative MVP limits

**Resolution Required:**
- [ ] Clarify with stakeholder (Ahiya): Which limits are correct?
- [ ] Option A: Update code to match vision (10/50/unlimited)
- [ ] Option B: Update vision to match code (1/5/10)
- [ ] Update Pricing page to reflect final decision
- [ ] Update database constants (TIER_LIMITS)

**Recommendation:** Use vision limits (10/50/unlimited) - more generous, better for growth

**Timeline Impact:** +2 hours if limits change (update code + testing)

---

### Risk 2: Demo User Content Quality (MEDIUM PRIORITY)
**Severity:** MEDIUM
**Impact:** First impression of product value

**Challenge:** Demo reflections must feel authentic, not lorem ipsum

**Mitigation:**
- Allocate 4-6 hours for writing quality reflections
- Use realistic dreams (Launch SaaS, Run Marathon, Learn Piano)
- Write 200-400 words per reflection (thoughtful, specific)
- Run actual AI prompts (don't fake AI responses)
- Get Ahiya feedback on demo content quality

**Quality Criteria:**
- Each reflection tells a mini-story of progress
- AI responses demonstrate genuine insight (not generic)
- Evolution reports show temporal growth
- Visualizations highlight achievement

---

### Risk 3: Email Verification Flow Complexity (MEDIUM PRIORITY)
**Severity:** MEDIUM
**Impact:** Profile page email change feature

**Challenge:** Email change requires verification to both old and new email

**Mitigation Options:**
- **Option A (MVP):** Skip email verification, allow direct email change
  - Risk: Email takeover if session compromised
  - Mitigation: Require current password for email change
- **Option B (Full):** Send verification to both emails
  - Requires: Email sending infrastructure (Nodemailer in package.json)
  - Requires: Verification token storage + expiry
  - Timeline: +6-8 hours

**Recommendation:** Start with Option A (password-protected), add verification post-MVP

---

### Risk 4: Demo Account Abuse (LOW-MEDIUM PRIORITY)
**Severity:** MEDIUM
**Impact:** Demo data quality, security

**Attack Vectors:**
- Spam reflections
- Offensive content
- Resource exhaustion (thousands of reflections)

**Mitigation:**
- **Option A (Preferred):** Read-only demo account
  - Users can browse, but NOT create/edit/delete
  - "Sign up to create your own reflections" banner
  - Zero abuse risk
- **Option B:** Nightly data reset
  - Cron job resets demo user to pristine state every night
  - Allows testing creation flows
  - Risk: Malicious content visible until reset
- **Option C:** Rate limiting
  - Max 5 reflections per IP per day for demo user
  - Risk: Sophisticated attackers use VPNs

**Recommendation:** Read-only demo (Option A) - safest, simplest

---

### Risk 5: Settings Not Immediately Reflected (LOW PRIORITY)
**Severity:** LOW
**Impact:** User experience confusion

**Scenario:** User changes default tone in Settings, goes to reflection form, old tone still selected

**Mitigation:**
- React Query cache invalidation on settings update
- Optimistic UI update (show change immediately, persist in background)
- Toast confirmation: "Setting saved" (clear feedback)

**Code Pattern:**
```typescript
const mutation = trpc.users.updatePreferences.useMutation({
  onSuccess: () => {
    utils.users.getProfile.invalidate(); // Refresh user data
    toast.success('Setting saved');
  }
});
```

---

### Risk 6: Performance Regression (LOW PRIORITY)
**Severity:** LOW
**Impact:** Bundle size, page load time

**Plan-6 Baseline:**
- Dashboard: 14.7 KB First Load JS
- Bundle increase: +2.1 KB total (1.3%, well under 20KB budget)

**Plan-7 Additions:**
- Profile page: ~6-8 KB (new route)
- Settings page: ~6-8 KB (new route)
- About page: ~4-6 KB (new route)
- Pricing page: ~6-8 KB (new route)
- Landing page enhancements: ~2-4 KB
- **Total:** ~24-36 KB additional (across new routes, not shared chunk)

**Mitigation:**
- All new pages lazy-loaded (Next.js App Router default)
- No new npm dependencies (zero bundle size increase from libs)
- Lighthouse audit after each iteration
- Target: All pages <100 KB First Load JS

**Risk Level:** VERY LOW (new pages don't affect existing page load)

---

## Recommendations for Master Plan

### 1. Three-Iteration Approach RECOMMENDED
**Rationale:**
- 10 features too complex for single iteration (80+ hour scope)
- Natural dependency phases (Foundation → Pages → Polish)
- Allows validation after each iteration (stakeholder can test incrementally)
- Reduces integration risk (smaller changes per iteration)

---

### 2. Iteration 1 MUST Include Demo User
**Rationale:**
- Demo user enables testing of ALL subsequent features
- Stakeholder validation requires populated account
- Landing page "See Demo" CTA depends on it
- Conversion flow testing impossible without demo

**BLOCKING PRIORITY:** If demo user fails, entire plan stalls

---

### 3. Resolve Tier Limits Discrepancy BEFORE Iteration 2
**Rationale:**
- Pricing page depends on correct limits
- Profile page displays tier benefits
- Upgrade flows reference limits
- Can't build 3 features without knowing correct numbers

**Action Required:** Stakeholder decision (Ahiya) in first 24 hours

---

### 4. Make Demo Account Read-Only
**Rationale:**
- Security risk too high for writable demo
- Nightly reset complex (cron job, backup/restore)
- Read-only achieves goal (show value) without abuse risk
- Users sign up to create their own reflections (desired outcome)

**Implementation:** Check `is_demo` flag in tRPC mutations, throw error if true

---

### 5. Defer Email Verification to Post-MVP
**Rationale:**
- Email change verification adds 6-8 hours
- Password-protected email change sufficient for MVP
- Most users don't change email frequently
- Can add verification later without breaking changes

**MVP Approach:** Require current password for email change, no verification emails

---

### 6. Content Creation Dependency - Flag Early
**Rationale:**
- About page needs Ahiya's founder story (2-3 hours writing)
- Demo reflections need quality content (4-6 hours writing)
- Pricing page FAQ needs thoughtful answers (1-2 hours writing)

**Total Content Creation:** 7-11 hours (outside development time)

**Recommendation:** Parallel track content creation during Iteration 1 backend work

---

### 7. Existing Plan-6 Work Must Not Regress
**Rationale:**
- Plan-6 achieved 9.2/10 technical quality
- 0 conflicts across 3 iterations
- XSS vulnerabilities fixed
- Design system established

**Quality Gate:** Zero regressions on:
- Navigation (--nav-height fix)
- Markdown rendering (XSS-safe)
- Dashboard 7 sections
- Reflection form depth
- Typography/color compliance

**Testing Required:** Full regression suite after each iteration

---

## Dependency Summary

### Iteration 1 Dependencies (Foundation)
**External:**
- Database access (Supabase)
- Existing auth system (JWT, bcrypt)
- Existing tRPC setup

**Internal:**
- Plan-6 design system (GlassCard, CosmicBackground)
- Plan-6 component library

**Content:**
- Demo reflection content (12-15 reflections, 3,000-6,000 words)
- Landing page copy (headline, value props)

**Timeline:** 20-24 hours

---

### Iteration 2 Dependencies (Core Pages)
**Blocks on:**
- Iteration 1 backend mutations (Profile/Settings need updateProfile, updatePreferences)
- Iteration 1 demo user (for testing)

**External:**
- None (all dependencies satisfied by Iteration 1)

**Content:**
- Ahiya's founder story (About page)
- Profile page copy
- Settings descriptions

**Timeline:** 18-24 hours

---

### Iteration 3 Dependencies (Polish)
**Blocks on:**
- Iteration 1 + 2 complete (requires all pages to exist for navigation)
- Tier limits resolution (Pricing page)

**External:**
- None

**Content:**
- Pricing page FAQ
- Empty state copy (warm, encouraging)
- Reflection form encouragement micro-copy

**Timeline:** 22-32 hours

---

## Open Questions for Master Planner

### Question 1: Tier Limits
**Decision needed:** Which tier limits are correct?
- **Option A:** Vision limits (free=10, premium=50, pro=unlimited)
- **Option B:** Code limits (free=1, essential=5, premium=10)

**Impact:** Pricing page, Profile page, upgrade flows
**Urgency:** HIGH (blocks Iteration 2)

---

### Question 2: Demo Account Type
**Decision needed:** Read-only or writable with nightly reset?
- **Option A:** Read-only (recommended)
- **Option B:** Writable with nightly reset

**Impact:** Demo user implementation complexity
**Urgency:** MEDIUM (impacts Iteration 1 scope)

---

### Question 3: Email Verification
**Decision needed:** Implement now or defer to post-MVP?
- **Option A:** Password-protected email change (MVP)
- **Option B:** Full verification flow (+6-8 hours)

**Impact:** Profile page scope
**Urgency:** MEDIUM (impacts Iteration 2 timeline)

---

### Question 4: Content Creation Ownership
**Decision needed:** Who writes content?
- Demo reflections (12-15 reflections)
- Founder story (About page)
- Pricing FAQ
- Empty state copy

**Options:**
- **Option A:** Ahiya writes all content (parallel to dev)
- **Option B:** Developer writes placeholder, Ahiya reviews/refines
- **Option C:** Collaborative (developer drafts, Ahiya enhances)

**Impact:** Timeline (7-11 hours of content creation)
**Urgency:** MEDIUM (must start during Iteration 1)

---

### Question 5: Pricing Page Complexity
**Decision needed:** How much detail on pricing page?
- **Option A:** Simple tier comparison table (6 hours)
- **Option B:** + FAQ section (8 hours)
- **Option C:** + Feature comparison matrix + testimonials (12 hours)

**Recommendation:** Option B (table + FAQ) - balances completeness with scope
**Impact:** Iteration 3 timeline

---

## Risk Level Summary

**Overall Project Risk: MEDIUM**

**Risk Breakdown:**
- **Technical Risk:** LOW (no new dependencies, existing stack proven)
- **Integration Risk:** LOW-MEDIUM (demo auto-login, settings → reflection form)
- **Content Risk:** MEDIUM (demo quality, founder story, copy authenticity)
- **Timeline Risk:** MEDIUM (60-80 hours is substantial, content dependency)
- **Scope Risk:** LOW (well-defined acceptance criteria, no unknowns)

**Confidence Level:** 85%
- High confidence in technical execution (Plan-6 success shows team capability)
- Medium confidence in timeline (content creation bottleneck)
- High confidence in user impact (clear value, addresses 6.5→9/10 gap)

---

## Final Recommendations

### DO:
1. **Start with Iteration 1 (Foundation & Demo)** - BLOCKING priority
2. **Resolve tier limits discrepancy immediately** - Before Iteration 2 starts
3. **Make demo account read-only** - Security and simplicity
4. **Parallel track content creation** - Don't let it block development
5. **Test demo user experience thoroughly** - It's the product's best salesperson
6. **Maintain Plan-6 quality standards** - Zero regressions

### DON'T:
1. **Don't skip demo user creation** - It's the foundation of product validation
2. **Don't underestimate content creation time** - 7-11 hours of writing
3. **Don't build Pricing page without tier limits clarity** - Will cause rework
4. **Don't add email verification in MVP** - Defer to post-MVP
5. **Don't build all 10 features in one iteration** - Too risky, split into 3

### WATCH:
1. **Demo content quality** - First impression determines conversion
2. **Landing page copy authenticity** - Must resonate, not feel marketing-speak
3. **Settings cache invalidation** - Ensure changes reflect immediately
4. **Bundle size** - Track Lighthouse scores after each iteration
5. **Regression testing** - Plan-6 work must not break

---

*Exploration completed: 2025-11-28*
*Dependencies mapped, risks assessed, iteration breakdown recommended*
*Ready for master planning synthesis*
