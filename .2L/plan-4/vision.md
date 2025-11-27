# Mirror of Dreams: Plan-4 Vision - Restraint, Substance, Transformation

**Created:** 2025-11-27
**Plan:** plan-4
**Focus:** Fix broken core, remove flash, deliver genuine transformation

---

## Problem Statement

Mirror of Dreams currently has solid technical foundation but suffers from:
- **Broken reflection AI** (400 errors - users can't complete reflections)
- **Wrong UX flow** (5 questions across multiple pages instead of 4 on one page)
- **Excessive decoration** (emojis, gradients, pop-ups) covering lack of substance
- **Non-engaging dashboard** even when populated
- **Generic spiritual language** without delivering actual insights
- **No restraint** - everything is flashy, nothing breathes

**The core issue**: We built an app that **looks spiritual** but doesn't **deliver spiritual depth**.

---

## Target Users

**Primary user:** Ahiya (creator, testing the experience)
- Premium tier, creator access
- Needs: Genuine transformation through reflection
- Values: Substance over style, restraint, authentic insight
- Frustrated by: Empty spiritual promises, excessive decoration

**Future users:** People seeking genuine self-understanding through dream pursuit
- NOT looking for productivity hacks
- Want: Deep pattern recognition and authentic growth insights
- Need: Soft/glossy/sharp companion, not flashy motivational app

---

## Core Value Proposition

**Mirror of Dreams is a soft, glossy, sharp AI companion that helps you see how you connect to your dreams and helps you connect to them better.**

**Key benefits:**
1. **Genuine insight** - AI reveals authentic patterns from your actual reflections
2. **Restrained beauty** - Polished UI that serves understanding, not decoration
3. **Real transformation** - Growth shown through specific examples, not generic praise
4. **Dream-focused** - All reflections link to specific dreams you're pursuing

**The transformation comes from genuine self-understanding, not from purple glows.**

---

## Feature Breakdown

### Must-Have (Plan-4 MVP)

#### 1. **Working Reflection AI**
- **Description**: Fix broken reflection creation - currently returns 400 errors
- **User story**: As a user, I want to complete a reflection and receive AI insights so that I can understand my relationship with my dream
- **Acceptance criteria**:
  - [ ] Reflection creation mutation succeeds (no 400 errors)
  - [ ] ANTHROPIC_API_KEY properly utilized
  - [ ] AI generates meaningful response based on user's answers
  - [ ] Response saved to database
  - [ ] User sees their reflection output
- **Technical details**:
  - Debug `server/trpc/routers/reflection.ts`
  - Ensure createReflection mutation works end-to-end
  - Test with actual Anthropic API

#### 2. **4-Question One-Page Reflection Flow**
- **Description**: Change from 5 questions across multiple pages to 4 questions on one page
- **User story**: As a user, I want to answer all reflection questions on one page so that I can contemplate them together without clicking through steps
- **Acceptance criteria**:
  - [ ] All 4 questions visible on one page (scroll to view all)
  - [ ] Questions refer to THE SPECIFIC DREAM selected
  - [ ] Question 1: "What is your dream?" (elaborate on THIS dream)
  - [ ] Question 2: "What is your plan?" (for THIS dream)
  - [ ] Question 3: "What's your relationship with this dream?" (with THIS dream)
  - [ ] Question 4: "What are you willing to give?" (for THIS dream)
  - [ ] NO "Have you set a date?" question (already in dream object)
  - [ ] Tone selection at bottom (Gentle/Intense/Fusion)
  - [ ] Single submit button: "Gaze into the Mirror"
- **Technical details**:
  - File: `app/reflection/MirrorExperience.tsx`
  - Remove multi-step navigation
  - Display all 4 text areas simultaneously
  - Pre-fill dream context from selected dream object

#### 3. **Simplified Engaging Dashboard**
- **Description**: Fix dashboard to show one clear action and simple progress
- **User story**: As a user, I want to see my next action and recent progress so that I know what to do and feel momentum
- **Acceptance criteria**:
  - [ ] Greeting: "Good evening, [Name]" (no "Deep night wisdom")
  - [ ] Primary action: Large "Reflect Now" button (most prominent)
  - [ ] Active Dreams section: Simple cards with title, days left, reflection count
  - [ ] Each dream card: Clear action buttons (Reflect, Evolution, Visualize)
  - [ ] Recent Reflections (3): List with dream name and time
  - [ ] Plan section: Simple "8/30 reflections this month" (no confusing percentages)
  - [ ] NO competing sections all visible at once
  - [ ] Maximum 2 emojis total on entire page
- **Technical details**:
  - File: `app/dashboard/page.tsx`
  - Simplify layout to single column
  - Remove usage percentage bars and infinity symbols
  - Consolidate sections

#### 4. **Remove Decorative Flash**
- **Description**: Strip excessive emojis, gradients, and pop-up animations
- **User story**: As a user, I want a clean, focused interface so that I can concentrate on reflection without distraction
- **Acceptance criteria**:
  - [ ] Maximum 2 emojis per page (use only for recognition, like dream category icons)
  - [ ] NO pop-up or bounce animations on buttons
  - [ ] NO decorative gradients (solid colors or functional gradients only)
  - [ ] NO "Free Forever" badges
  - [ ] NO marketing taglines ("journey of self-discovery")
  - [ ] Transitions only for page changes (smooth 200-300ms)
  - [ ] Button interactions: simple state changes (hover, active, disabled)
- **Technical details**:
  - Remove framer-motion pop/scale animations
  - Simplify button component (no glow effects unless functional)
  - Clean up all page components for emoji usage
  - Update copy throughout

#### 5. **Clear, Honest Copy**
- **Description**: Replace marketing speak with direct, clear language
- **User story**: As a user, I want to understand what the app does so that I trust it delivers what it promises
- **Acceptance criteria**:
  - [ ] Landing page: "Reflect. Understand. Evolve." (not "Transform your consciousness")
  - [ ] Auth pages: "Welcome Back" and "Create Account" (no spiritual taglines)
  - [ ] Dashboard: Clear instructions (not mystical greetings)
  - [ ] All copy: Direct and respectful, not trying to sound spiritual
  - [ ] Promises match delivery (don't say "transform" unless it actually transforms)
- **Technical details**:
  - Update all user-facing strings
  - Review prompts for AI (ensure "soft/glossy/sharp" but not flowery)

#### 6. **Simplified Auth Pages**
- **Description**: Make sign-in and sign-up consistent and functional
- **User story**: As a user, I want to sign in or create account simply so that I can start reflecting
- **Acceptance criteria**:
  - [ ] Both pages use identical layout and styling
  - [ ] Simple button (no gradient decorations)
  - [ ] Clear labels and inputs
  - [ ] NO "Free Forever" badge
  - [ ] NO marketing taglines
  - [ ] Consistent error handling
- **Technical details**:
  - Files: `app/auth/signin/page.tsx`, `app/auth/signup/page.tsx`
  - Use same component structure
  - Simple solid button with clear hover state

### Should-Have (Post-Plan-4)

1. **Real Evolution Insights** - AI analysis that includes specific quotes from user's reflections and shows temporal growth (early vs recent)
2. **Immersive Visualizations** - Achievement narratives that pull from actual reflection content
3. **About Page** - Currently 404, should explain what Mirror of Dreams is
4. **Examples Page** - Show anonymized reflection examples so users understand value

### Could-Have (Future Plans)

1. **Multiple tones working** - Currently only Fusion tone; add real Gentle and Intense
2. **Cross-dream analysis** - Patterns across all dreams (threshold: 12 reflections)
3. **PDF export** - For reflections and evolution reports
4. **Mobile optimizations** - Better responsive design

---

## User Flows

### Flow 1: Complete First Reflection (Primary Critical Path)

**Steps:**
1. User signs in (email: ahiya.butman@gmail.com, password: mirror-creator)
2. User sees dashboard with "Reflect Now" button
3. User clicks "Reflect Now"
4. User selects dream from list (e.g., "Test Dream for Plan-4")
5. User sees one-page form with 4 questions pre-contextualized to their dream
6. User fills all 4 text areas (can scroll, all visible)
7. User selects tone (Fusion default)
8. User clicks "Gaze into the Mirror"
9. **System calls Anthropic API** (must succeed - currently fails with 400)
10. **System saves reflection** to database linked to dream
11. **System shows AI response** (formatted, readable)
12. User reads reflection, feels seen
13. User returns to dashboard, sees "1 reflection" on their dream

**Edge cases:**
- No dreams created yet: Show "Create your first dream" prompt
- API fails: Show clear error message, allow retry
- Network timeout: Show loading state with timeout message
- Empty answers: Validate before submission

**Error handling:**
- 400 error: "We couldn't generate your reflection. Please try again or contact support."
- 500 error: "Something went wrong on our end. Please try again in a moment."
- Network error: "Connection issue. Check your internet and try again."

### Flow 2: Create Dream (Supporting Flow)

**Steps:**
1. User clicks "Create Dream" from dashboard
2. User sees simple form:
   - Title (required)
   - Description (required)
   - Target Date (optional)
   - Category (dropdown)
3. User fills form
4. User clicks "Create Dream"
5. System validates and saves
6. User returns to dashboard, sees new dream card
7. User can now reflect on this dream

**Edge cases:**
- Tier limit reached: Show upgrade prompt with clear limits
- Duplicate title: Allow (user might want similar dreams)
- Invalid date: Validate (must be future)

### Flow 3: View Dashboard (Core Engagement)

**Steps:**
1. User logs in
2. User sees dashboard with:
   - Clear greeting
   - Primary action (Reflect Now)
   - Active dreams (2 simple cards)
   - Recent reflections (shows last 3)
   - Plan info (simple usage)
3. User can:
   - Click Reflect Now → goes to dream selection
   - Click Reflect on specific dream → goes directly to that dream's reflection
   - Click Evolution (if 4+ reflections) → generates evolution report
   - Click Visualize (if 4+ reflections) → generates visualization

**Edge cases:**
- No dreams: Show "Create your first dream"
- No reflections: Show "Create your first reflection"
- Tier limits reached: Show clear upgrade path

---

## Data Model Overview

**Key entities:**

1. **users**
   - Fields: id, email, password_hash, name, tier, is_creator, is_admin
   - Relationships: has many dreams, has many reflections
   - Notes: tier affects limits and AI quality

2. **dreams**
   - Fields: id, user_id, title, description, target_date, days_left (computed), status, category
   - Relationships: belongs to user, has many reflections
   - Notes: days_left auto-calculated from target_date

3. **reflections**
   - Fields: id, user_id, dream_id, dream (Q1), plan (Q2), relationship (Q3), offering (Q4), has_date (removed), dream_date (removed), ai_response, tone, created_at
   - Relationships: belongs to user, belongs to dream
   - Notes: **NO has_date or dream_date fields** (redundant with dream.target_date)

4. **evolution_reports**
   - Fields: id, user_id, dream_id, report_type, analysis, context_reflections_used, reflections_analyzed, created_at
   - Relationships: belongs to user, optionally belongs to dream
   - Notes: Can be dream-specific or dream-agnostic

5. **visualizations**
   - Fields: id, user_id, dream_id, visualization_type, style, generated_content, created_at
   - Relationships: belongs to user, optionally belongs to dream
   - Notes: Achievement narrative style primary

---

## Technical Requirements

**Must support:**
- Next.js 14 App Router (already implemented)
- tRPC for type-safe API (already implemented)
- Supabase PostgreSQL (local instance running)
- Anthropic Claude API (Sonnet 4.5) - **MUST FIX**
- TypeScript throughout
- React with hooks
- Framer Motion (but restrained - NO pop-ups)

**Constraints:**
- Local development first (not deployed yet)
- Supabase local instance on port 54331
- Admin user: ahiya.butman@gmail.com / mirror-creator
- Premium tier with creator access

**Preferences:**
- Restraint over flash
- Function before form
- Substance over style
- Clear over clever
- Simple transitions only (200-300ms)

**Design System:**
- Colors: Deep navy background, white/light gray text, one accent (subtle purple)
- Typography: Line-height 1.7-1.8, generous spacing, clear hierarchy
- Components: Simple buttons (no glows), clean forms, minimal cards
- Emojis: Maximum 2 per page, only where they aid recognition
- Animations: NO pop-ups, NO bounces, smooth transitions only

---

## Success Criteria

**The Plan-4 MVP is successful when:**

1. **Reflection works end-to-end**
   - Metric: User can complete reflection without errors
   - Target: 100% success rate (no 400 errors)
   - Test: Ahiya completes 3 reflections successfully

2. **UX feels focused and clear**
   - Metric: User understands what to do immediately
   - Target: No confusion about next action
   - Test: Ahiya says "I know what to do" when seeing dashboard

3. **Design shows restraint**
   - Metric: Visual elements serve function
   - Target: Maximum 2 emojis per page, no pop-ups, no decorative gradients
   - Test: Pages feel clean and focused, not busy

4. **Copy is honest and clear**
   - Metric: No marketing speak or false promises
   - Target: Every sentence is direct and meaningful
   - Test: Ahiya feels copy is grounded and trustworthy

5. **Substance over style**
   - Metric: AI insights reference user's actual answers
   - Target: User feels "seen" by specific feedback
   - Test: Ahiya says reflection insights feel authentic

---

## Out of Scope (For Plan-4)

**Explicitly not included in this plan:**
- Cross-dream evolution reports (need 12+ reflections)
- Multiple working tones (focus on Fusion only)
- About page content (just note it's 404)
- Example reflections page
- Mobile-specific optimizations
- PDF exports
- Payment/subscription flow (tier already set)
- Email notifications
- Social features
- Advanced visualizations (focus on fixing core first)

**Why:** Plan-4 is about **fixing what's broken** and **establishing restraint**. Get the core reflection loop working with substance and simplicity. Future plans can add depth.

---

## Assumptions

1. Supabase local instance continues running on port 54331
2. ANTHROPIC_API_KEY is valid and has sufficient credits
3. Database schema is correct (from plan-3)
4. Admin user exists with correct password
5. Basic tRPC infrastructure works (just reflection mutation broken)
6. Dreams can be created successfully (focus is on reflections)

---

## Open Questions

1. **Should we migrate existing reflections to remove has_date field?**
   - Decision: Yes, but optional - add migration for clean schema

2. **What's causing the 400 error in reflection.create?**
   - Must debug during implementation
   - Likely: schema mismatch or middleware issue

3. **How much purple glow is "earned" vs decorative?**
   - Guideline: If it aids focus or state (like active card), it's earned
   - If it's just decoration, remove it

4. **Should existing plan-3 code be archived or integrated?**
   - Decision: Keep in place, fix in-place (not rebuild)
   - Learn from plan-3's overreach

---

## Implementation Strategy

### Phase 1: Fix Broken Core (Days 1-2)
**Priority: URGENT**
1. Debug and fix `reflection.create` mutation (400 error)
2. Test reflection flow end-to-end
3. Ensure AI response generation works

### Phase 2: Change Reflection UX (Days 2-3)
**Priority: HIGH**
1. Convert to 4-question one-page flow
2. Remove has_date question
3. Update all questions to reference "this dream"
4. Test flow with multiple dreams

### Phase 3: Simplify Dashboard (Days 3-4)
**Priority: HIGH**
1. Redesign dashboard layout (one primary action)
2. Remove confusing stats
3. Simplify dream cards
4. Add recent reflections section

### Phase 4: Remove Flash (Days 4-5)
**Priority: MEDIUM**
1. Strip excessive emojis (max 2 per page)
2. Remove pop-up animations
3. Simplify buttons (no decorative gradients)
4. Update all copy to be clear and direct

### Phase 5: Test & Refine (Days 5-6)
**Priority: VALIDATION**
1. Ahiya tests complete flow
2. Gather feedback on substance vs style
3. Iterate on restraint
4. Verify all success criteria met

---

## Next Steps

- [x] Vision created (this document)
- [ ] Review with Ahiya
- [ ] Run `/2l-mvp` to auto-plan and execute
- [ ] OR run `/2l-plan` for interactive iteration breakdown

---

**Vision Status:** VISIONED
**Ready for:** Master Planning & Execution
**Focus:** Restraint. Substance. Transformation.

---

## Reference Documents

For 2L implementation, refer to:
- `SYNTHESIZED_VISION.md` - Complete UX and design system
- `CURRENT_STATE_ASSESSMENT.md` - Problem diagnosis
- `2L_VISION_RESTRAINED_DEPTH.md` - Detailed implementation guide
- `.2l/plan-1/vision.md` - Original detailed UX flow
- `.2l/plan-3/vision.md` - Soft/glossy/sharp essence

**Core Principle**: The mirror shows truth through clarity, not decoration.
