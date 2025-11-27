# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary
Plan-4 focuses on fixing broken core functionality (reflection AI returning 400 errors), redesigning the reflection flow from 5 questions across multiple pages to 4 questions on one page, removing excessive visual decoration, and establishing restraint and substance over style throughout the application.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 6 must-have features for Plan-4 MVP
- **User stories/acceptance criteria:** 31 specific acceptance criteria across 6 features
- **Estimated total work:** 18-24 hours

**Feature Breakdown:**
1. Working Reflection AI (5 criteria) - CRITICAL BLOCKER
2. 4-Question One-Page Reflection Flow (10 criteria) - HIGH PRIORITY
3. Simplified Engaging Dashboard (10 criteria) - HIGH PRIORITY
4. Remove Decorative Flash (6 criteria) - MEDIUM PRIORITY
5. Clear, Honest Copy (5 criteria) - MEDIUM PRIORITY
6. Simplified Auth Pages (6 criteria) - LOW PRIORITY

### Complexity Rating
**Overall Complexity: COMPLEX**

**Rationale:**
- **Existing Codebase Complexity**: 109 TypeScript files, 42 React components, mature Next.js 14 App Router architecture with tRPC, React Query, and Supabase integration
- **Critical Bug Fix Required**: Reflection AI mutation returns 400 errors - requires debugging tRPC router, schema validation, Anthropic API integration, and database insertion logic
- **Significant UX Refactor**: Multi-step reflection flow (781 lines in MirrorExperience.tsx) must be converted to single-page, reducing from 5 questions to 4, removing state management for steps
- **Widespread Design System Changes**: Remove decorative elements (emojis, gradients, animations) across 20+ page and component files
- **Multiple Architectural Layers**: Changes span frontend (React components), backend (tRPC routers), database schema (reflections table), and API integration (Anthropic Claude)
- **Restraint as Design Principle**: Not additive work - requires careful subtraction and judgment calls on what constitutes "earned" vs "decorative" design
- **Brownfield Project**: Extending and fixing plan-3's work, must understand existing patterns and maintain consistency while improving

---

## Architectural Analysis

### Major Components Identified

#### 1. **Authentication System**
- **Purpose:** User sign-in/sign-up with JWT tokens, session management via Supabase
- **Complexity:** LOW
- **Why critical:** Foundation for all user-specific features, already working
- **Current State:** Functional but needs simplified UI (remove gradient buttons, "Free Forever" badges)
- **Files Affected:** `app/auth/signin/page.tsx`, `app/auth/signup/page.tsx`, `server/trpc/routers/auth.ts`

#### 2. **Reflection Creation System (BROKEN - CRITICAL)**
- **Purpose:** Multi-step form for dream reflection + AI response generation via Anthropic Claude Sonnet 4.5
- **Complexity:** HIGH
- **Why critical:** Core value proposition of the app, currently non-functional (400 errors)
- **Current State:**
  - UI: 781-line MirrorExperience.tsx with multi-step state management (currentStep 0-6)
  - Backend: reflection.create mutation in `server/trpc/routers/reflection.ts` (253 lines)
  - Schema: createReflectionSchema validates 8 fields including dreamId, hasDate, dreamDate
  - Database: reflections table with dream_id foreign key, has_date, dream_date fields
- **Root Cause (Hypothesis):** Schema mismatch between frontend form submission and backend validation, or database constraint violation on reflections table
- **Files Affected:**
  - `app/reflection/MirrorExperience.tsx` (781 lines - MAJOR refactor needed)
  - `server/trpc/routers/reflection.ts` (253 lines - debug needed)
  - `types/schemas.ts` (createReflectionSchema)
  - Database: reflections table structure

#### 3. **Dreams Management System**
- **Purpose:** Create, list, and manage user dreams (first-class entities linked to reflections)
- **Complexity:** MEDIUM
- **Why critical:** Dreams are the organizing principle - reflections link to specific dreams
- **Current State:** Working, database has dreams table with id, title, description, target_date, status, category
- **Files Affected:** `server/trpc/routers/dreams.ts`, `app/dreams/page.tsx`, `components/dreams/DreamCard.tsx`

#### 4. **Dashboard System**
- **Purpose:** Central hub showing active dreams, recent reflections, usage stats, and primary "Reflect Now" CTA
- **Complexity:** MEDIUM
- **Why critical:** Primary navigation and engagement point for users
- **Current State:** 236-line page.tsx with 6 card components, needs simplification and focus
- **Problems:**
  - Too many competing sections (Reflections, Dreams, Evolution, Visualizations, Usage, Subscription)
  - Confusing stats (100% Used, 0 Limit, infinity symbols)
  - Empty states with excessive emojis
  - No clear primary action
- **Files Affected:**
  - `app/dashboard/page.tsx` (236 lines)
  - `components/dashboard/cards/` (6 card components)
  - `components/dashboard/shared/WelcomeSection.tsx`

#### 5. **AI Response Generation Layer**
- **Purpose:** Anthropic Claude API integration for generating reflections, evolution reports, visualizations
- **Complexity:** MEDIUM
- **Why critical:** Core transformation mechanism - AI insights must be substantive, not generic
- **Current State:**
  - API: Anthropic SDK configured with API key from .env.local
  - Model: claude-sonnet-4-5-20250929
  - Premium features: Extended thinking (5000 budget tokens), higher max_tokens (6000 vs 4000)
  - Prompts: System prompts loaded from `server/lib/prompts.ts`, tone-specific (gentle/intense/fusion)
- **Files Affected:**
  - `server/trpc/routers/reflection.ts` (AI generation)
  - `server/trpc/routers/evolution.ts`
  - `server/lib/prompts.ts`

#### 6. **Database Layer (Supabase PostgreSQL)**
- **Purpose:** Local Supabase instance on port 54331 for development
- **Complexity:** LOW (already configured)
- **Why critical:** All data persistence, relationships between users/dreams/reflections
- **Current State:** Schema includes users, reflections (with has_date/dream_date), dreams, evolution_reports, visualizations tables
- **Schema Issue:** Reflection questions should NOT include "Have you set a date?" since date is already in dream.target_date - causes redundancy
- **Files Affected:** `lib/schema.sql`, all tRPC routers that query Supabase

#### 7. **UI Component Library (Glass Design System)**
- **Purpose:** Reusable components (GlassCard, GlowButton, CosmicLoader, etc.) with cosmic/glass aesthetic
- **Complexity:** MEDIUM
- **Why critical:** All visual elements derive from this system, need to establish "earned" vs "decorative" distinction
- **Current State:** 42 component files in `components/` directory
- **Problems:** Over-designed with excessive glows, gradients, emojis, pop-up animations
- **Files Affected:**
  - `components/ui/glass/` (10+ glass components)
  - `components/shared/CosmicBackground.tsx`
  - All page and card components using these primitives

#### 8. **tRPC API Layer**
- **Purpose:** Type-safe API with React Query integration, routers for auth, reflections, dreams, evolution, visualizations
- **Complexity:** LOW (architecture is solid)
- **Why critical:** All client-server communication flows through this
- **Current State:** Working well, just need to fix reflection.create mutation
- **Files Affected:**
  - `server/trpc/routers/_app.ts` (main router)
  - Individual routers (reflection, dreams, evolution, etc.)
  - `app/api/trpc/[trpc]/route.ts` (Next.js API handler)

---

### Technology Stack Implications

**Database: Supabase PostgreSQL (Local)**
- **Options:** Continue with Supabase local (port 54331), migrate to hosted Supabase, switch to Prisma + different DB
- **Recommendation:** Continue with Supabase local for development
- **Rationale:** Already configured, schema is solid, local instance provides fast iteration without costs, migration not needed for plan-4

**AI Provider: Anthropic Claude**
- **Options:** Anthropic Claude Sonnet 4.5, OpenAI GPT-4, local models
- **Recommendation:** Continue with Anthropic Claude Sonnet 4.5
- **Rationale:** API key already configured, premium extended thinking feature valuable for deep reflections, plan-4 just needs to fix the broken integration not replace it

**Frontend Framework: Next.js 14 App Router**
- **Options:** Continue with Next.js 14 App Router, migrate to Pages Router, switch to different framework
- **Recommendation:** Continue with Next.js 14 App Router
- **Rationale:** Modern architecture, server/client components well-organized, tRPC integration solid, no framework issues - problems are in implementation details not architecture

**State Management: React Query + tRPC**
- **Options:** Continue with React Query + tRPC, add Zustand/Redux, use Next.js server actions
- **Recommendation:** Continue with React Query + tRPC
- **Rationale:** Type-safe, caching works well, pattern is consistent across codebase, no state management gaps identified

**Styling: Tailwind CSS + Custom Components**
- **Options:** Continue with Tailwind + custom glass components, migrate to different CSS framework, rebuild design system
- **Recommendation:** Continue with Tailwind but SIMPLIFY glass components
- **Rationale:** Tailwind provides utility-first foundation, glass components can be simplified in-place (remove gradients, glows), no need to rebuild from scratch

**Animation: Framer Motion**
- **Options:** Keep Framer Motion (restrained use), remove entirely, switch to CSS animations
- **Recommendation:** Keep Framer Motion for page transitions ONLY
- **Rationale:** Already installed, provides smooth transitions, just need to remove decorative animations (pop-ups, bounces, scale effects) and keep functional transitions (200-300ms page changes)

---

## Iteration Breakdown Recommendation

### Recommendation: MULTI-ITERATION (3 phases)

**Rationale:**
- **Too complex for single iteration:** 6 features spanning frontend refactor (781-line component), backend debugging, database schema considerations, and widespread design changes across 20+ files
- **Critical bug blocking user value:** Reflection AI must be fixed before any other work has meaning (users can't complete core flow)
- **Natural architectural phases:** (1) Fix broken core + change UX, (2) Remove flash + simplify UI, (3) Refine copy + validate substance
- **Risk mitigation:** Each iteration can be validated independently - fix core, then improve aesthetics, then polish content
- **Estimated 18-24 hours total:** Splitting into 3 iterations (6-8 hours each) allows for focused work and validation

---

### Suggested Iteration Phases

#### **Iteration 1: Fix Broken Core + Reflection UX Overhaul**
- **Vision:** Make reflection creation work end-to-end with new 4-question one-page flow
- **Scope:** Fix critical bugs and restructure reflection experience
  - **Debug and fix reflection.create mutation** (400 error)
    - Check schema validation (createReflectionSchema vs mutation input)
    - Verify database constraints (reflections table foreign keys, has_date/dream_date logic)
    - Test Anthropic API call (ensure API key works, request format correct)
    - Add detailed error logging to identify exact failure point
  - **Refactor MirrorExperience.tsx to one-page flow**
    - Remove multi-step state management (currentStep 0-6)
    - Display all 4 questions simultaneously on one page (scrollable)
    - Remove "Have you set a date?" question (redundant with dream.target_date)
    - Update questions to reference THE SPECIFIC DREAM selected
    - Simplify tone selection to simple buttons (no elaborate cards)
    - Single "Gaze into the Mirror" submit button
  - **Update database schema if needed**
    - Consider migration to remove has_date/dream_date from reflections table
    - Update reflection router to pull date from dream object instead
  - **Test complete reflection flow**
    - User selects dream → fills 4 questions → submits → AI generates → response displayed
    - Verify no 400 errors, response saves to database, user sees output

- **Why first:** CRITICAL BLOCKER - rest of plan-4 is cosmetic if users can't complete reflections
- **Estimated duration:** 8-10 hours
  - 3-4 hours: Debug reflection mutation and API integration
  - 4-5 hours: Refactor MirrorExperience.tsx to one-page flow
  - 1 hour: Testing and validation
- **Risk level:** HIGH (critical bug with unknown root cause, significant component refactor)
- **Success criteria:**
  - User can complete reflection without errors (100% success rate)
  - All 4 questions visible on one page
  - AI response generated and displayed
  - Reflection saved to database with dream linkage

---

#### **Iteration 2: Remove Flash + Simplify Dashboard**
- **Vision:** Strip decorative elements and focus dashboard on clear action
- **Scope:** Design simplification and restraint across key pages
  - **Simplify Dashboard (dashboard/page.tsx)**
    - Change greeting from "Deep night wisdom, Creator" to "Good evening, [Name]"
    - Make "Reflect Now" the most prominent action (large, clear button)
    - Simplify active dreams section (simple cards: title, days left, reflection count)
    - Add recent reflections section (list of 3 most recent)
    - Simplify plan/usage display ("8/30 reflections this month" not "100% Used, 0 Limit")
    - Remove competing sections or consolidate into single-column layout
  - **Remove decorative flash across components**
    - Strip excessive emojis (max 2 per page, only for recognition not decoration)
    - Remove pop-up/bounce animations from buttons (framer-motion scale/pop effects)
    - Remove decorative gradients (solid colors or functional gradients only)
    - Simplify button components (no glow effects unless functional)
    - Update GlassCard, GlowButton, and other glass components for restraint
  - **Simplify auth pages**
    - Remove gradient buttons ("Free Forever" badge, purple-blue gradients)
    - Make sign-in and sign-up pages identical in structure and styling
    - Simple solid button with clear hover state
    - Remove marketing taglines ("Continue your journey of self-discovery")

- **Dependencies:**
  - Requires: Iteration 1 complete (working reflection flow)
  - Imports: Existing component library (simplifying in-place, not rebuilding)
- **Estimated duration:** 6-8 hours
  - 3-4 hours: Dashboard simplification and layout changes
  - 2-3 hours: Remove flash (emojis, animations, gradients) across components
  - 1 hour: Auth page consistency
- **Risk level:** MEDIUM (aesthetic changes, risk of over-simplifying or removing "earned" beauty)
- **Success criteria:**
  - Dashboard shows ONE clear primary action ("Reflect Now")
  - Maximum 2 emojis per page throughout app
  - NO pop-up or bounce animations on buttons
  - Auth pages have identical styling and simple buttons
  - Visual elements serve function, not decoration

---

#### **Iteration 3: Clear Copy + Substance Validation**
- **Vision:** Replace marketing speak with honest language and validate AI substance
- **Scope:** Content refinement and transformation validation
  - **Update copy throughout application**
    - Landing page: "Reflect. Understand. Evolve." (not "Transform your consciousness")
    - Dashboard: Clear instructions, no mystical greetings
    - Auth pages: "Welcome Back" and "Create Account" (no spiritual taglines)
    - All buttons/CTAs: Direct language (not "✨ Create Your First Dream ✨")
    - Remove promises that don't align with delivery
  - **Validate AI response quality**
    - Test reflections with multiple users/dreams
    - Ensure AI references user's specific answers (not generic)
    - Verify tone selection works (gentle/intense/fusion feels different)
    - Check that responses avoid empty spiritual language
  - **Ensure substantive insights**
    - AI reflection should quote or reference user's actual words
    - Patterns should feel authentic and specific to user's journey
    - Avoid generic motivational speak or vague affirmations
  - **Polish reflection output display**
    - Clean, readable text formatting
    - Generous line-height (1.7-1.8)
    - Minimal decoration (let content be the star)
    - No distracting visual elements around AI response

- **Dependencies:**
  - Requires: Iteration 1 (working reflection AI) + Iteration 2 (simplified UI)
  - Imports: None (content changes only)
- **Estimated duration:** 4-6 hours
  - 2-3 hours: Copy updates across all pages
  - 1-2 hours: AI response quality testing and prompt refinement
  - 1 hour: Output display polish and validation
- **Risk level:** LOW (content changes, low technical risk)
- **Success criteria:**
  - Every user-facing string is direct and meaningful
  - No marketing speak or false promises
  - AI responses reference user's actual answers
  - User feels "seen" by specific feedback not generic praise
  - Copy is grounded and trustworthy

---

## Dependency Graph

```
ITERATION 1: Fix Broken Core + Reflection UX
├── Debug reflection.create mutation (CRITICAL PATH)
│   ├── Schema validation (createReflectionSchema)
│   ├── Database constraints (reflections table)
│   └── Anthropic API integration (Claude Sonnet 4.5)
├── Refactor MirrorExperience.tsx (MAJOR COMPONENT)
│   ├── Remove multi-step state (currentStep)
│   ├── One-page layout (4 questions visible)
│   ├── Update question text (dream-specific)
│   └── Simplify tone selection
└── Test complete flow
    ↓
ITERATION 2: Remove Flash + Simplify Dashboard
├── Dashboard simplification (depends on reflection working)
│   ├── Primary action prominence (Reflect Now)
│   ├── Recent reflections section (queries existing data)
│   └── Simplified stats display
├── Remove decorative flash (widespread changes)
│   ├── Glass component library updates
│   ├── Emoji audit and removal
│   └── Animation stripping (framer-motion)
└── Auth page consistency
    ↓
ITERATION 3: Clear Copy + Substance Validation
├── Copy updates (depends on UI being finalized)
├── AI quality validation (depends on reflection working)
└── Output display polish (depends on AI responses)
```

**Critical Path:**
Iteration 1 MUST complete first - broken reflection blocks all user value. Iteration 2 and 3 build on working foundation.

**Parallel Work Opportunities:**
Within Iteration 2, dashboard simplification and auth page updates can happen in parallel (different files, no dependencies).

---

## Risk Assessment

### High Risks

**Risk: Root cause of 400 error is unclear**
- **Impact:** Could spend hours debugging without finding issue, iteration 1 could fail or overrun
- **Mitigation:**
  - Start with comprehensive error logging (add try-catch blocks with detailed logging)
  - Test each layer independently (schema validation, API call, database insert)
  - Create minimal reproduction case (hardcode input values, test mutation directly)
  - If schema mismatch, update schema to match vision (4 questions, no has_date)
- **Recommendation:** Tackle in iteration 1 with 3-4 hour buffer for debugging

**Risk: MirrorExperience.tsx refactor introduces new bugs**
- **Impact:** 781-line component with complex state management, refactoring could break existing functionality
- **Mitigation:**
  - Create backup of current file before refactoring
  - Refactor incrementally (first remove steps, then update questions, then test)
  - Test thoroughly with multiple dream selections
  - Keep error handling and loading states intact
- **Recommendation:** Allocate 4-5 hours for refactor with thorough testing

### Medium Risks

**Risk: Removing flash causes app to feel too sterile**
- **Impact:** Over-correction from "too flashy" to "too bland", lose the "soft/glossy/sharp" companion feeling
- **Mitigation:**
  - Establish clear distinction between "earned" and "decorative" design
  - Keep functional glows (active state, focus indicators) but remove decoration
  - Test with user (Ahiya) to validate restraint feels right
  - Iterate based on "does this serve understanding?" principle
- **Recommendation:** Iteration 2 includes validation checkpoint with Ahiya

**Risk: AI responses still feel generic despite prompts**
- **Impact:** Substance over style principle fails if AI doesn't deliver authentic insights
- **Mitigation:**
  - Test prompts with actual user reflections (not just test data)
  - Refine system prompts to emphasize specificity and quoting user's words
  - Consider adding explicit instruction to reference user's language
  - Validate in iteration 3 with multiple real reflections
- **Recommendation:** Iteration 3 focuses on AI quality validation, adjust prompts if needed

### Low Risks

**Risk: Copy changes miss some files**
- **Impact:** Inconsistent messaging if some pages still have marketing speak
- **Mitigation:**
  - Grep for common phrases ("journey of self-discovery", "transform your consciousness")
  - Create checklist of all user-facing pages
  - Final pass review of all pages in iteration 3
- **Recommendation:** Low priority, easily fixed in iteration 3

**Risk: Dashboard simplification removes useful information**
- **Impact:** Users lose access to stats or features they want
- **Mitigation:**
  - Keep all data accessible, just reorganize/simplify presentation
  - "View All" links for detailed views (don't delete features, just deprioritize)
  - User testing with Ahiya to validate what's needed
- **Recommendation:** Iteration 2 includes user validation

---

## Integration Considerations

### Cross-Phase Integration Points

**Shared Component Library (components/ui/glass/)**
- **What it is:** Reusable glass design components (GlassCard, GlowButton, etc.) used across all pages
- **Why it spans iterations:** Iteration 2 will simplify these components, affecting all pages that use them
- **Consistency needed:**
  - Establish design tokens for "restrained" version (remove default glows, simplify animations)
  - Update all instances consistently (DashboardCard, CreateDreamModal, reflection output, etc.)
  - Document "earned beauty" guidelines for future components

**Reflection Data Schema**
- **What it is:** Database schema (reflections table) and tRPC schema (createReflectionSchema)
- **Why it spans iterations:** Iteration 1 may require schema changes (remove has_date/dream_date), affecting all queries
- **Consistency needed:**
  - If schema changes, update all tRPC routers that query reflections
  - Update TypeScript types to match new schema
  - Ensure backwards compatibility or create migration for existing data

**Navigation and User Flows**
- **What it is:** App navigation between dashboard → reflection → output → dashboard
- **Why it spans iterations:** Iteration 1 changes reflection flow, iteration 2 changes dashboard, both affect navigation
- **Consistency needed:**
  - Maintain clear breadcrumb trail (user knows where they are)
  - Consistent "back" and "next" actions across pages
  - Dashboard always shows accurate state (reflection count updates immediately)

### Potential Integration Challenges

**Challenge: Reflection mutation fix may require schema migration**
- **Description:** If has_date/dream_date removal is needed, existing reflections in database won't match new schema
- **Why it matters:** Could break existing reflection display pages or evolution reports that query old data
- **Solution:** Create database migration script, test with existing data, provide fallback for legacy schema

**Challenge: Simplified components may break existing page layouts**
- **Description:** If GlassCard or GlowButton behavior changes, pages using them may need layout adjustments
- **Why it matters:** Changes to shared components ripple across entire app
- **Solution:** Test all pages after component changes, adjust individual page layouts as needed in iteration 2

**Challenge: Copy changes across 20+ files require consistency**
- **Description:** Marketing speak vs honest copy needs consistent voice across all touchpoints
- **Why it matters:** Inconsistent copy undermines trust and clarity
- **Solution:** Create copy guidelines document, grep for old phrases, final review pass in iteration 3

---

## Recommendations for Master Plan

1. **Start with 3-iteration breakdown as proposed above**
   - Iteration 1 is CRITICAL PATH (8-10 hours) - fix reflection creation
   - Iteration 2 is SIMPLIFICATION (6-8 hours) - remove flash, focus dashboard
   - Iteration 3 is POLISH (4-6 hours) - copy updates, substance validation
   - Total: 18-24 hours estimated

2. **Allocate extra buffer for iteration 1 debugging**
   - Root cause of 400 error is unknown - could be schema, API, database, or middleware
   - Recommend 3-4 hour debugging budget with detailed logging strategy
   - Consider pair debugging if issue not resolved in 2 hours

3. **Establish "earned beauty" design guidelines early**
   - Before iteration 2 begins, document what constitutes "functional" vs "decorative"
   - Examples: Active state glow = functional, button decoration glow = decorative
   - Share guidelines with all builders to maintain consistency

4. **Test with Ahiya (creator user) after each iteration**
   - Iteration 1: Can you complete a reflection? Do insights feel authentic?
   - Iteration 2: Does dashboard guide you clearly? Does UI feel focused or sterile?
   - Iteration 3: Is copy honest and clear? Do promises match delivery?

5. **Consider database migration optional for iteration 1**
   - If has_date/dream_date removal is complex, defer to post-plan-4
   - Focus iteration 1 on getting mutation working with current schema
   - Schema cleanup can happen later if time allows

6. **Plan for iteration 2 to be most widespread in changes**
   - 20+ files affected (dashboard, auth, components, shared UI)
   - Use git branches for safety (easy rollback if over-simplified)
   - Validate with user before finalizing to avoid rework

---

## Technology Recommendations

### Existing Codebase Findings

**Stack detected:**
- **Frontend:** Next.js 14.2.0 (App Router), React 18.3.1, TypeScript 5.9.3
- **State Management:** React Query (@tanstack/react-query 5.90.5), tRPC 11.6.0
- **Styling:** Tailwind CSS 3.4.1, Framer Motion 11.18.2
- **Backend:** tRPC server with Supabase PostgreSQL
- **AI:** Anthropic SDK (@anthropic-ai/sdk 0.52.0)
- **Database:** Supabase local instance (port 54331)

**Patterns observed:**
- **tRPC routers:** Consistent pattern across auth, reflections, dreams, evolution
- **React Query hooks:** Mutations and queries follow standard pattern with onSuccess/onError
- **Component structure:** Server components for pages, client components for interactivity
- **Type safety:** Zod schemas for validation, TypeScript throughout
- **Error handling:** Toast notifications for user-facing errors

**Opportunities:**
- **Simplify glass component library:** Remove decorative gradients, consolidate glow variants
- **Standardize copy:** Create central copy/constants file for user-facing strings
- **Improve error logging:** Add structured logging for debugging (especially reflection mutation)
- **Database constraints:** Leverage Supabase foreign keys and triggers for data integrity

**Constraints:**
- **Local development only:** Not deployed yet, must work with local Supabase on port 54331
- **Supabase schema:** Changes require migrations via Supabase CLI
- **Next.js App Router:** Must follow server/client component patterns (can't use hooks in server components)
- **Framer Motion:** Already installed, removing would be costly - just restrain usage instead

---

## Notes & Observations

### Architectural Strengths

1. **Solid technical foundation:** tRPC + React Query provides type-safe, cacheable API layer with excellent DX
2. **Clear separation of concerns:** Server components for data fetching, client components for interactivity
3. **First-class dream entities:** Design decision to make dreams separate objects (not embedded in reflections) is correct and enables powerful features
4. **Premium tier infrastructure:** Already supports tiered features (extended thinking, deeper analysis) even if not fully utilized yet

### Architectural Gaps

1. **Schema redundancy:** Reflections table has has_date/dream_date but dreams table already has target_date - causes confusion and potential inconsistency
2. **Over-engineered UI components:** Glass design system has too many variants (GlowButton, GlassCard with multiple glow options) - simplification needed
3. **Missing error boundaries:** No React error boundaries visible - could improve error handling UX
4. **No structured logging:** Console.log statements exist but no structured logging framework for debugging production issues

### Design Philosophy Evolution

**Plan-3 (Previous):** Emphasis on "soft/glossy/sharp" aesthetic led to:
- Excessive decoration (emojis, gradients, cosmic backgrounds)
- Pop-up animations and visual effects
- Marketing language trying to sound spiritual
- Dashboard with too many competing sections

**Plan-4 (Current):** Pivot to "restraint, substance, transformation":
- Remove decoration, keep only functional design elements
- One clear action (Reflect Now) not six competing CTAs
- Honest copy that promises what it delivers
- Substance comes from AI insights, not purple glows

**This is a SUBTRACTION project, not an addition project** - harder to judge "enough" vs "too much" removal.

### Critical Success Factors

1. **Fix reflection mutation FIRST** - all other work is cosmetic if core flow broken
2. **Establish clear "earned beauty" guidelines** - prevent over-correction to sterile design
3. **Validate substance with real reflections** - AI must deliver authentic insights not generic praise
4. **Test with creator user (Ahiya) frequently** - external validation prevents echo chamber

### Future Considerations (Post-Plan-4)

- **About page** (currently 404) - explain what Mirror of Dreams is for new users
- **Example reflections page** - show anonymized examples so users understand value before signing up
- **Cross-dream evolution reports** - requires 12+ reflections, shows patterns across all dreams
- **Multiple tones working** - currently only Fusion tone fully developed
- **Mobile optimizations** - responsive design exists but could be improved

---

*Exploration completed: 2025-11-27*

*This report informs master planning decisions for Plan-4: Fix broken core, remove flash, deliver genuine transformation*

---

## Summary for Master Planner

**Complexity:** COMPLEX (brownfield refactor with critical bug, UX overhaul, widespread design changes)

**Recommended Approach:** 3 iterations (18-24 hours total)
1. Fix broken reflection + new UX (8-10 hours, HIGH RISK)
2. Remove flash + simplify dashboard (6-8 hours, MEDIUM RISK)
3. Clear copy + validate substance (4-6 hours, LOW RISK)

**Critical Path:** Iteration 1 MUST succeed - broken reflection blocks all user value

**Key Decisions Needed:**
- Database schema migration for has_date/dream_date removal (optional, can defer)
- "Earned beauty" design guidelines (needed before iteration 2)
- AI prompt refinement if responses lack substance (iteration 3)

**Architecture is Solid:** No framework or infrastructure changes needed, just fix mutation and improve UX/design

**Risk Mitigation:** Buffer time for iteration 1 debugging, user validation after each iteration, git branches for safety
