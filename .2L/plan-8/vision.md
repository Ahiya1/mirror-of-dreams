# Project Vision: Mirror of Dreams - Final Polish & Demo Completeness (7.5/10 → 9/10)

**Created:** 2025-11-28
**Plan:** plan-8
**Current State:** 7.5/10 - Beautiful foundation with critical gaps
**Target State:** 9/10 - Complete, polished, demonstrable sanctuary
**Focus:** Fix layout bugs, complete demo user data, enhance reflection aesthetics

---

## Problem Statement

Mirror of Dreams has made remarkable progress (Plan-7 delivered demo user and core polish), but several critical issues prevent it from reaching the 9/10 aesthetic and functional vision. The user observed: "We are walking toward 9/10, but only at 7.5/10."

**Critical gaps identified from visual inspection:**

### 1. Navigation Layout Issues (P0 - BLOCKING)
- **Upper sidebar too close to content** - Content should be nudged lower
- **Demo notification banner hidden by navigation** - Banner appears behind/under the nav
- Root cause: `--demo-banner-height` CSS variable not defined; dynamic nav height measurement creates timing issues
- Affects ALL pages, not just dashboard
- **Evidence:** Screenshot shows demo banner text cut off/obscured by nav bar

### 2. Dashboard is COMPLETELY EMPTY (P0 - CRITICAL)
- Screenshot shows **blank void below navigation** - no content visible at all
- Dashboard should show: dreams grid, recent reflections, progress stats, evolution previews
- Possible causes identified:
  - Stagger animation not triggering (IntersectionObserver issue)
  - Grid layout mismatch (2x2 grid vs 7 items being rendered)
  - CSS visibility/opacity stuck at 0
- **Evidence:** Image #1 shows empty dashboard with just navigation

### 3. Dream Names Missing in Reflection Flow (P1 - UX BUG)
- When navigating to reflect, dream names don't appear
- Dream context header only renders if `selectedDream` is set
- Users lose context of which dream they're reflecting on
- **Evidence:** User reported "name of dreams do not appear as you go to reflect"

### 4. Demo User Incomplete - Missing Core Content (P0 - CRITICAL)
- Dreams exist (5 total)
- Reflections exist (15 total)
- **MISSING: Evolution Reports** - Script deletes but never creates them
- **MISSING: Visualizations** - Script deletes but never creates them
- Demo user cannot showcase the FULL product value without these features
- **Evidence:** Seed script (seed-demo-user.ts) only creates dreams and reflections

### 5. Reflection Space Aesthetics (P1 - UX POLISH)
- Current reflection experience is functional but not "beautiful and welcoming"
- User stated reflection space "could get a notch better"
- Form feels clinical, not sacred
- Visual hierarchy could be improved

---

## Root Cause Analysis

### Navigation/Layout Issue Deep Dive

**AppNavigation.tsx (Lines 85-110):**
- Uses `useLayoutEffect` to measure nav height dynamically
- Sets `--nav-height` CSS variable via JavaScript
- Problem: Measurement happens AFTER initial render, causing flash

**DemoBanner.tsx (Lines 1-47):**
- Uses fixed `z-index: 50`
- No CSS variable height definition
- AppNavigation references `--demo-banner-height` which doesn't exist in variables.css

**variables.css (Line 320):**
```css
--nav-height: clamp(60px, 8vh, 80px);
```
This is a fallback value that gets overwritten by JS measurement.

**Solution Required:**
1. Define `--demo-banner-height: 44px` in variables.css
2. Calculate total header height: `calc(var(--nav-height) + var(--demo-banner-height))`
3. Apply proper padding-top to all page content when demo banner is visible
4. Fix z-index stacking context

### Dashboard Empty Issue Deep Dive

**app/dashboard/page.tsx (Lines 104-151):**
- Uses `useStaggerAnimation` hook with 7 items
- Animation settings: 150ms delay, 800ms duration, triggerOnce
- If IntersectionObserver doesn't trigger, items remain invisible (opacity: 0)

**DashboardGrid.module.css:**
```css
.dashboardGrid {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr); /* Only 4 slots! */
}
```
But page renders 7 items (Hero + 6 cards), causing overflow.

**Solution Required:**
1. Fix grid to accommodate all items OR restructure layout
2. Ensure stagger animation triggers reliably (add fallback visibility)
3. Debug IntersectionObserver trigger conditions
4. Add fallback `opacity: 1` after timeout if animation fails

### Demo Data Missing Deep Dive

**seed-demo-user.ts (Lines 384-389):**
```typescript
// Script DELETES these:
await supabase.from('evolution_reports').delete().eq('user_id', demoUser.id);
await supabase.from('visualizations').delete().eq('user_id', demoUser.id);
// But NEVER CREATES them!
```

**Solution Required:**
1. Add evolution report generation to seed script (requires 4+ reflections per dream)
2. Add visualization generation to seed script
3. **Claude Code generates all content directly** - writes to database, NOT via app's API endpoints
4. Ensure demo user has: 5 dreams, 15 reflections, 2-3 evolution reports, 2-3 visualizations

**IMPORTANT - Content Generation Approach:**
- Claude Code writes reflections directly to database (already done in Plan-7)
- Claude Code writes evolution reports directly to database (to be added)
- Claude Code writes visualizations directly to database (to be added)
- We do NOT call the app's server/API endpoints - Claude generates the content itself
- This ensures high-quality, thoughtful content without API rate limits or timeouts

---

## Target Users

**Primary user:** Ahiya (creator, stakeholder, daily user)
- Currently at 7.5/10 satisfaction
- Needs: Layout bugs fixed, demo user complete, reflection space polished
- Frustrated by: Empty dashboard, hidden banner, incomplete demo

**Secondary users:** Demo visitors, stakeholders, investors
- Need to experience FULL product value via demo account
- Currently see: Dreams and reflections but NO evolution insights or visualizations
- This hides the most impressive features of the product

**Tertiary users:** New signups
- Experience navigation overlap issue
- Dashboard appears empty/broken
- First impression is critical - must feel polished

---

## Core Value Proposition

**Fix the broken, complete the incomplete, polish the functional** - Transform Mirror of Dreams from a product with visible bugs and missing demo content into a flawless 9/10 experience where every visitor sees the full value proposition immediately.

**The product must feel:**
1. **Bug-free** - No content hidden, no empty screens, no visual glitches
2. **Complete** - Demo user showcases ALL features (dreams, reflections, evolution, visualizations)
3. **Polished** - Reflection space feels sacred, not clinical
4. **Trustworthy** - Professional quality signals competence and care

---

## Feature Breakdown

### Must-Have (Plan-8 MVP)

#### 1. **Fix Navigation/Layout Stack (P0)**
- **Description:** Fix the navigation height calculation, demo banner visibility, and content spacing
- **User story:** As a user, I want all page content visible and properly spaced below the navigation so nothing is hidden or cut off
- **Acceptance criteria:**
  - [ ] Define `--demo-banner-height: 44px` in variables.css
  - [ ] Create `--total-header-height` variable: `calc(var(--nav-height) + var(--demo-banner-height, 0px))`
  - [ ] Demo banner appears ABOVE navigation, fully visible
  - [ ] All page content has proper `padding-top` accounting for both nav AND demo banner
  - [ ] Fix z-index stacking: demo banner > nav > page content
  - [ ] Test on dashboard, dreams, reflections, evolution, visualizations pages
  - [ ] Mobile: ensure hamburger menu doesn't overlap demo banner
  - [ ] No layout shift on initial load (CSS fallback values work before JS measurement)
- **Technical approach:**
  - Add CSS variables to variables.css
  - Update AppNavigation.tsx to position correctly relative to DemoBanner
  - Update all page layouts to use `--total-header-height` for padding
  - Consider using CSS `position: sticky` instead of `position: fixed` for simpler stacking

#### 2. **Fix Empty Dashboard Display (P0)**
- **Description:** Ensure dashboard content is visible and properly rendered
- **User story:** As a user landing on dashboard, I want to see my dreams, activity, and progress immediately
- **Acceptance criteria:**
  - [ ] Dashboard renders all 7 sections visibly (Hero, Dreams, Reflections, Progress, Evolution, Visualization, Subscription)
  - [ ] Fix grid layout: either expand to accommodate all items OR restructure into proper sections
  - [ ] Stagger animation triggers reliably OR has fallback visibility after 2 seconds
  - [ ] Add `opacity: 1` CSS fallback for animation failure
  - [ ] Loading states visible while data fetches
  - [ ] Empty states display if user has no data
  - [ ] Demo user sees: 5 dream cards, 3 recent reflections, progress stats populated
  - [ ] Test: Navigate to dashboard, content appears within 500ms
- **Technical approach:**
  - Debug useStaggerAnimation hook - add console logs to verify IntersectionObserver triggers
  - Update DashboardGrid.module.css to use flexible grid (`auto-fit`, `minmax`)
  - Add CSS: `.dashboard-section { opacity: 1; }` as fallback
  - Add setTimeout fallback in useStaggerAnimation: if not triggered in 2s, force visible

#### 3. **Fix Dream Name Display in Reflection Flow (P1)**
- **Description:** Show dream name/context when user navigates to reflect on a specific dream
- **User story:** As a user reflecting on a dream, I want to see which dream I'm reflecting on so I have context
- **Acceptance criteria:**
  - [ ] When clicking "Reflect" from a dream card, dream name appears at top of reflection form
  - [ ] Dream context header shows: Dream title, category badge, days remaining
  - [ ] If dream is pre-selected (from URL param), show dream name immediately
  - [ ] Dream selection dropdown shows currently selected dream name prominently
  - [ ] After selecting dream, header updates to show: "Reflecting on: [Dream Title]"
  - [ ] Mobile: Dream name visible without scrolling
- **Technical approach:**
  - Update MirrorExperience.tsx: Show dream header even before form questions
  - Add URL param handling: `/reflection?dreamId=xxx` pre-selects and shows dream
  - Move dream context display outside of `{selectedDream && ...}` conditional
  - Add prominent dream title banner at top of reflection form

#### 4. **Complete Demo User Data - Evolution Reports (P0)**
- **Description:** Generate evolution reports for demo user's dreams that have 4+ reflections
- **User story:** As a visitor exploring the demo, I want to see evolution reports to understand how the product shows growth over time
- **Acceptance criteria:**
  - [ ] "Launch My SaaS Product" dream (4 reflections) has evolution report generated
  - [ ] Evolution report contains: temporal analysis, growth patterns, specific quotes from reflections
  - [ ] Report feels authentic - uses actual AI analysis of demo reflections
  - [ ] Evolution page shows report card with snippet
  - [ ] Click through to full report displays beautifully formatted content
  - [ ] Dashboard evolution preview shows insight from this report
- **Technical approach:**
  - **Claude Code generates the evolution report content directly** (NOT via app API)
  - Update seed-demo-user.ts to write evolution report to database
  - Claude analyzes the demo reflections and writes thoughtful evolution analysis
  - Content includes: temporal journey, growth patterns, specific quotes from reflections
  - Insert directly into `evolution_reports` table with proper foreign keys
  - Test: Demo user → Evolution page → See report for "Launch My SaaS Product"

#### 5. **Complete Demo User Data - Visualizations (P0)**
- **Description:** Generate visualizations for demo user's dreams that have 4+ reflections
- **User story:** As a visitor exploring the demo, I want to see visualizations to understand how the product creates visual representations of growth
- **Acceptance criteria:**
  - [ ] "Launch My SaaS Product" dream has 1-2 visualizations generated
  - [ ] Visualization contains: achievement narrative, progress imagery description, emotional journey
  - [ ] Visualizations page shows cards with previews
  - [ ] Click through to full visualization displays content beautifully
  - [ ] Dashboard visualization preview shows snippet
- **Technical approach:**
  - **Claude Code generates the visualization content directly** (NOT via app API)
  - Update seed-demo-user.ts to write visualization to database
  - Claude creates achievement narrative and progress imagery descriptions
  - Insert directly into `visualizations` table with proper foreign keys
  - Test: Demo user → Visualizations page → See visualizations for "Launch My SaaS Product"

#### 6. **Enhance Reflection Space Aesthetics (P1)**
- **Description:** Elevate the reflection form from functional to beautiful and welcoming
- **User story:** As a user creating a reflection, I want the space to feel sacred and inviting so I enter a contemplative mindset
- **Acceptance criteria:**
  - [ ] **Visual atmosphere enhancement:**
    - Darker, more focused background (subtle vignette effect)
    - Centered content area with generous breathing room
    - Soft ambient glow behind form container
  - [ ] **Form presentation:**
    - Each question card has subtle glass effect with gradient border
    - Question text uses gradient styling (purple to gold)
    - Placeholder text is warm and inviting: "Your thoughts are safe here..."
    - Generous spacing between questions (min 32px gap)
  - [ ] **Tone selection enhancement:**
    - Tone cards feel like sacred choices, not buttons
    - Selected tone has prominent glow + scale effect
    - Unselected tones are subtly muted
  - [ ] **Progress indication:**
    - Step indicator: "Question 1 of 4" with cosmic dots
    - Completed questions show subtle checkmark
    - Progress feels like a journey, not a form
  - [ ] **Submit moment:**
    - "Gaze into the Mirror" button has breathing animation on hover
    - Click triggers cosmic expansion effect
    - Transition to loading feels intentional, not abrupt
  - [ ] **Micro-copy warmth:**
    - Introduction text: "Welcome to your sacred space for reflection..."
    - After dream selection: "Let's explore [Dream Name] together..."
    - Error messages are gentle, not harsh
- **Technical approach:**
  - Update MirrorExperience.tsx and related CSS
  - Add ambient glow container behind form
  - Update question card styling in reflection.css
  - Add breathing animation to submit button
  - Review and update all copy for warmth

#### 7. **Layout Consistency Audit (P1)**
- **Description:** Ensure all pages have consistent spacing and no content overlap issues
- **User story:** As a user navigating the app, I want every page to feel cohesive and professional
- **Acceptance criteria:**
  - [ ] ALL pages properly account for nav + demo banner height
  - [ ] Page list to verify:
    - Dashboard (/dashboard)
    - Dreams (/dreams)
    - Dreams detail (/dreams/[id])
    - Reflect (/reflection)
    - Reflections list (/reflections)
    - Reflection detail (/reflections/[id])
    - Evolution (/evolution)
    - Visualizations (/visualizations)
    - Profile (/profile)
    - Settings (/settings)
    - About (/about)
    - Pricing (/pricing)
  - [ ] No content hidden behind navigation on any page
  - [ ] Demo banner visible and not overlapped on any page
  - [ ] Consistent padding-top across all authenticated pages
  - [ ] Mobile responsive: content visible below collapsed nav
- **Technical approach:**
  - Create shared layout component or CSS class for authenticated pages
  - Add `.page-content` class with proper padding-top
  - Audit each page file and ensure padding applied
  - Test each page in demo mode (with demo banner)

---

### Should-Have (Post-MVP)

1. **Additional Evolution Reports** - Generate for "Run a Marathon" dream (3 reflections - need 1 more, or adjust threshold)
2. **Additional Visualizations** - Generate 1-2 more for variety in demo
3. **Reflection Response Highlighting** - AI responses have key insights visually highlighted
4. **Dashboard Animation Debugging** - Comprehensive fix for stagger animation reliability
5. **Mobile Reflection Experience** - Optimize reflection form for mobile touch input
6. **Demo Banner Dismiss** - Allow demo users to temporarily hide the banner (localStorage)

### Could-Have (Future)

1. **Dark/Light Theme Toggle** - Currently cosmic dark only
2. **Reflection Templates** - Pre-written question sets for specific dream types
3. **Guided Onboarding** - Interactive tutorial for new users
4. **Reflection Streaks** - Gamification of consistent practice

---

## User Flows

### Flow 1: Demo Visitor Experiences Complete Product

**Steps:**
1. Visitor clicks "See Demo" on landing page
2. **Auto-logged into demo account (Alex Chen)**
3. **Demo banner appears at TOP, fully visible:**
   - "You're viewing a demo account. Create your own to start reflecting."
   - Banner clearly visible, not hidden by navigation
4. **Dashboard loads with ALL content visible:**
   - Greeting: "Good afternoon, Alex!"
   - 5 dream cards in grid (Launch SaaS, Marathon, Piano, Relationships, Financial)
   - Recent 3 reflections with snippets
   - Progress: "15 reflections total"
   - Evolution insight preview: "See your growth on 'Launch My SaaS Product'"
   - Visualization preview: "Your journey visualized"
5. Visitor clicks on **"Launch My SaaS Product"** dream
6. **Dream detail page shows:**
   - Dream description, 4 reflections listed
   - **Evolution report badge: "Evolution Insights Available"**
   - **Visualization badge: "Journey Visualization Ready"**
7. Visitor clicks **"View Evolution"**
8. **Evolution report page loads:**
   - Full evolution analysis for this dream
   - Temporal journey: how thinking evolved over 4 reflections
   - Key quotes highlighted
   - Growth patterns identified
   - Visitor thinks: "Wow, this actually shows real insight"
9. Visitor returns to dream, clicks **"View Visualization"**
10. **Visualization page loads:**
    - Beautiful narrative of achievement journey
    - Progress imagery description
    - Emotional arc
11. Visitor impressed, clicks **"Sign Up for Free"** in demo banner
12. **Signup flow, then empty dashboard with their own account**
13. Visitor creates first dream, motivated by what they saw in demo

**Why this matters:**
- Demo visitor sees FULL product value in <3 minutes
- Evolution reports and visualizations are the differentiating features
- Currently these are MISSING - visitor only sees dreams/reflections
- **This flow is broken today - must be fixed**

### Flow 2: User Creates Reflection with Dream Context

**Steps:**
1. User clicks "Reflect" on dashboard OR specific dream card
2. **If from dream card:** Dream is pre-selected, shows at top
3. **Reflection page loads:**
   - Dream context banner: "Reflecting on: Launch My SaaS Product"
   - Dream badge with category
   - Beautiful, sacred atmosphere
4. User sees 4 questions with warm placeholder text
5. Fills each question, sees character counter
6. Selects tone (Fusion highlighted by default)
7. Clicks "Gaze into the Mirror"
8. **Loading state:** Cosmic loader with status text
9. **Reflection output appears:**
   - User's questions/answers collapsible
   - AI response beautifully formatted
   - Actions: "Reflect Again", "View All Reflections"

**Edge cases:**
- **No dream pre-selected:** Dream selection dropdown appears first with list of dreams
- **Dream name missing:** FIXED - Dream context banner always shows selected dream
- **API error:** Clear message, retry button, user input preserved

---

## Data Model Overview

**No schema changes required** - This is primarily bug fixes, content seeding, and UI polish.

**Demo data to be created:**

| Entity | Current | Target | Gap |
|--------|---------|--------|-----|
| Dreams | 5 | 5 | None |
| Reflections | 15 | 15 | None |
| Evolution Reports | 0 | 1-2 | **CREATE** |
| Visualizations | 0 | 1-2 | **CREATE** |

---

## Technical Requirements

**Must support:**
- Existing Next.js 14 App Router architecture
- Existing tRPC API endpoints
- Existing Supabase PostgreSQL
- Existing design system (extend, don't replace)
- Existing seed script structure

**Bug fixes required:**
- CSS variable definitions (variables.css)
- Z-index stacking context (AppNavigation, DemoBanner)
- Grid layout fix (DashboardGrid.module.css)
- Animation fallbacks (useStaggerAnimation hook)

**Content creation required:**
- Update seed-demo-user.ts to generate evolution reports
- Update seed-demo-user.ts to generate visualizations
- OR create separate seed-demo-evolution.ts and seed-demo-visualizations.ts scripts

**Constraints:**
- No breaking changes to existing features
- No new dependencies
- Performance budget maintained
- Mobile responsiveness preserved

---

## Success Criteria

**Plan-8 is successful when:**

1. **Navigation Layout Fixed: 10/10**
   - Metric: Demo banner fully visible, no content hidden on any page
   - Target: Zero visual overlap issues
   - Measurement: Manual testing on all pages with demo user

2. **Dashboard Displays Content: 10/10**
   - Metric: All 7 dashboard sections render visibly within 500ms
   - Target: No empty dashboard, all cards populated for demo user
   - Measurement: Visual inspection + timing measurement

3. **Dream Names Visible: 9/10**
   - Metric: Dream context shows at top of reflection form
   - Target: User always knows which dream they're reflecting on
   - Measurement: Test reflection flow from dream card and direct URL

4. **Demo Evolution Reports: 10/10**
   - Metric: At least 1 evolution report exists for demo user
   - Target: Demo visitor can experience evolution feature fully
   - Measurement: Navigate to evolution page as demo user, see report

5. **Demo Visualizations: 10/10**
   - Metric: At least 1 visualization exists for demo user
   - Target: Demo visitor can experience visualization feature fully
   - Measurement: Navigate to visualizations page as demo user, see content

6. **Reflection Space Beauty: 8/10**
   - Metric: Reflection form feels sacred, not clinical
   - Target: User reports feeling contemplative when reflecting
   - Measurement: Qualitative assessment by stakeholder

7. **Overall Product Quality: 9/10**
   - Metric: Stakeholder (Ahiya) satisfaction score
   - Target: "This is ready to show anyone"
   - Measurement: Subjective assessment after full testing

---

## Out of Scope (For Plan-8)

**Explicitly not included:**

- New features (everything needed already exists)
- Backend API changes (frontend + seed scripts only)
- Database migrations
- Payment/subscription changes
- Email templates
- Marketing pages
- SEO optimization
- A/B testing
- Third-party integrations
- Mobile native apps

**Why:** Plan-8 is about **fixing bugs and completing existing content**. No new features, just polish and completion.

---

## Implementation Strategy

### Phase 1: Fix Layout Bugs (Day 1)
**Priority:** P0 - Blocking issues

1. **Fix navigation/demo banner stack:**
   - Add `--demo-banner-height` to variables.css
   - Update z-index values for proper stacking
   - Update AppNavigation positioning
   - Add `--total-header-height` calculation

2. **Fix all page padding:**
   - Create shared `.page-content` class
   - Apply to all authenticated pages
   - Test each page with demo banner visible

3. **Verify fixes:**
   - Test on: dashboard, dreams, reflections, evolution, visualizations
   - Mobile responsive testing
   - Demo banner fully visible everywhere

### Phase 2: Fix Dashboard Display (Day 1-2)
**Priority:** P0 - Critical UX bug

1. **Debug stagger animation:**
   - Add console logs to useStaggerAnimation
   - Verify IntersectionObserver triggers
   - Add fallback: force visible after 2s timeout

2. **Fix grid layout:**
   - Update DashboardGrid.module.css
   - Use flexible grid sizing
   - Ensure all 7 items fit properly

3. **Add CSS fallbacks:**
   - `.dashboard-section { opacity: 1 }` as safety net
   - Ensure content visible even if JS fails

4. **Verify:**
   - Dashboard loads with all sections visible
   - Demo user sees populated data
   - No empty void below navigation

### Phase 3: Complete Demo Data (Day 2-3)
**Priority:** P0 - Product demonstration

**IMPORTANT: Claude Code generates all content directly - NOT via app API endpoints**

1. **Generate evolution report:**
   - Update seed-demo-user.ts OR create separate script
   - **Claude Code writes the evolution report content** (analyzes reflections, writes analysis)
   - Insert directly into `evolution_reports` table
   - Content: temporal journey, growth patterns, specific quotes from demo reflections
   - Verify report appears in database
   - Test evolution page display

2. **Generate visualization:**
   - Update seed script
   - **Claude Code writes the visualization content** (achievement narrative, progress imagery)
   - Insert directly into `visualizations` table
   - Verify visualization appears in database
   - Test visualizations page display

3. **Verify demo flow:**
   - Login as demo user
   - Navigate to evolution → see report
   - Navigate to visualizations → see content
   - Dashboard previews show snippets

### Phase 4: Fix Reflection Dream Context (Day 3)
**Priority:** P1 - UX bug

1. **Update MirrorExperience.tsx:**
   - Add dream context banner at top (before questions)
   - Handle URL param for pre-selected dream
   - Show dream name prominently after selection

2. **Update routing:**
   - Support `/reflection?dreamId=xxx` for direct links
   - Pre-select and display dream from param

3. **Verify:**
   - Click "Reflect" from dream card → see dream name
   - Select dream from dropdown → see dream name
   - Dream context always visible during reflection

### Phase 5: Reflection Space Polish (Day 3-4)
**Priority:** P1 - Aesthetic enhancement

1. **Visual atmosphere:**
   - Add vignette/darker background to reflection page
   - Add ambient glow behind form container
   - Increase spacing between elements

2. **Form styling:**
   - Gradient text for question headers
   - Glass effect on question cards
   - Warm placeholder text

3. **Tone selection:**
   - Enhanced card styling
   - Prominent selected state
   - Sacred feeling, not button-like

4. **Micro-copy:**
   - Add welcome text
   - Update placeholders for warmth
   - Review all text for encouragement

### Phase 6: QA & Verification (Day 4)
**Priority:** P0 - Ship confidence

1. **Test all fixes:**
   - Navigation layout on all pages
   - Dashboard display with demo user
   - Dream context in reflection
   - Evolution report visibility
   - Visualization visibility
   - Reflection space aesthetics

2. **Cross-browser testing:**
   - Chrome, Firefox, Safari, Edge
   - Mobile responsive

3. **Bug fixes:**
   - Address any issues found
   - Final polish

4. **Stakeholder review:**
   - Ahiya tests complete flow
   - Feedback incorporated
   - Sign-off at 9/10

---

## Assumptions

1. Existing seed script structure can be extended
2. Evolution and visualization generation APIs exist and work
3. Database has correct schema for all entities
4. CSS variables propagate correctly to all components
5. No breaking changes needed to existing features

---

## Open Questions

1. **Evolution report generation:** Call real API or create static content? (Recommendation: Real API for authenticity)
2. **Multiple evolution reports:** Generate for just 1 dream or all eligible? (Recommendation: Start with 1, ensure quality)
3. **Animation fallback timing:** 2 seconds too long/short? (Recommendation: 2s feels intentional)
4. **Demo banner dismissal:** Add dismiss button? (Recommendation: Post-MVP, keep it visible for now)

---

## Next Steps

- [ ] Run `/2l-plan` for interactive master planning
- [ ] OR run `/2l-mvp` to auto-plan and execute

---

**Vision Status:** VISIONED
**Ready for:** Master Planning & Execution
**Focus:** Fix bugs. Complete demo. Polish reflection. Reach 9/10.

---

## Design Philosophy

> "A product is not complete when there's nothing left to add, but when there are no bugs left to fix, no content missing, and no interaction that feels unpolished. Mirror of Dreams at 9/10 means: every pixel in place, every feature demonstrable, every moment sacred."

**Guiding principles:**
1. **Fix before feature** - No new features until existing ones work perfectly
2. **Demo is the salesperson** - Demo user must showcase EVERYTHING
3. **Details matter** - Navigation overlap is a trust breaker
4. **Sacred over functional** - Reflection space deserves reverence
5. **Complete over clever** - Simple fixes that work > complex optimizations

---

**This vision transforms Mirror of Dreams from 7.5/10 (beautiful but buggy/incomplete) to 9/10 (polished, complete, demonstrable) - ready to impress anyone who experiences it.**
