# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary
Transform Mirror of Dreams from a "responsive desktop" experience into a truly mobile-native experience with bottom navigation, full-screen reflection flow, touch-optimized interactions, and mobile-first UX patterns.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 7 must-have MVP features
- **User stories/acceptance criteria:** 38 acceptance criteria across all features
- **Estimated total work:** 20-28 hours

### Complexity Rating
**Overall Complexity: COMPLEX**

**Rationale:**
- 7 distinct MVP features requiring coordinated changes across navigation, dashboard, reflection flow, and component library
- Requires modifying core navigation architecture (fixed bottom nav + hide/show on scroll)
- Full-screen reflection experience is a significant UI overhaul of existing MirrorExperience component (1000+ lines)
- New component patterns needed: Bottom sheets, swipe gestures, haptic feedback
- Must maintain desktop experience quality while adding mobile-specific behaviors

---

## Architectural Analysis

### Major Components Identified

1. **Navigation System**
   - **Purpose:** Controls app-wide navigation, currently uses desktop-first patterns
   - **Current Implementation:** `AppNavigation.tsx` - Fixed top bar with hamburger menu for mobile (lines 307-320)
   - **Complexity:** MEDIUM-HIGH
   - **Why critical:** Foundation for mobile-first UX; bottom nav is the most impactful visible change

2. **Dashboard Layout**
   - **Purpose:** Main hub with 6 cards in DashboardGrid, Hero section
   - **Current Implementation:** `dashboard/page.tsx` + `DashboardGrid.tsx` (2-column grid, collapses to 1-column)
   - **Complexity:** MEDIUM
   - **Why critical:** Needs reorganization for mobile: hero compaction, horizontal stats strip, card prioritization

3. **Reflection Experience**
   - **Purpose:** Core user flow for creating reflections (dream selection -> 4 questions -> tone -> AI response)
   - **Current Implementation:** `MirrorExperience.tsx` - Single-page form with all questions visible
   - **Complexity:** HIGH
   - **Why critical:** Vision calls for complete overhaul to one-question-per-screen, full-screen takeover

4. **Glass Component Library**
   - **Purpose:** Design system with GlassCard, GlowButton, GlassModal, GlassInput, etc.
   - **Current Implementation:** `components/ui/glass/` - 9+ components
   - **Complexity:** MEDIUM
   - **Why critical:** Touch interactions must be added to all interactive components; new BottomSheet component needed

5. **Modal System**
   - **Purpose:** Pop-up dialogs for various actions (create dream, upgrade, etc.)
   - **Current Implementation:** `GlassModal.tsx` - Centered modal with backdrop, not mobile-optimized
   - **Complexity:** LOW-MEDIUM
   - **Why critical:** Vision requires full-screen modals on mobile with slide-up animation

6. **Form Components**
   - **Purpose:** Input handling across reflection, dream creation, settings
   - **Current Implementation:** `GlassInput.tsx`, inline form styling in various components
   - **Complexity:** MEDIUM
   - **Why critical:** Keyboard handling, auto-scroll, larger touch targets needed

### Technology Stack Implications

**Animation Framework**
- **Current:** Framer Motion (already in use)
- **Assessment:** Fully capable of handling all requirements
- **No change needed:** Framer Motion can handle swipe gestures, page transitions, and all mobile animations

**CSS Architecture**
- **Current:** Tailwind CSS + CSS Modules + inline styled-jsx
- **Assessment:** Well-structured with responsive CSS variables in `variables.css`
- **Opportunity:** Existing responsive spacing (`--space-xs` through `--space-3xl`) uses clamp() - mobile-ready
- **Change needed:** Add mobile-first min-width breakpoints to components using max-width patterns

**State Management**
- **Current:** React hooks + tRPC for server state
- **Assessment:** No changes needed for this purely frontend transformation
- **Note:** Vision explicitly states "No changes to existing data model required"

---

## Current Navigation Architecture (Deep Dive)

### Desktop Navigation (`AppNavigation.tsx`)
```
Location: /components/shared/AppNavigation.tsx (468 lines)

Structure:
- Fixed top GlassCard container
- Left: Logo + desktop nav links (hidden below lg breakpoint)
- Right: Upgrade button + Refresh + User dropdown + Mobile hamburger
- Mobile: AnimatePresence-controlled sliding menu (lg:hidden)

Key CSS Classes:
- .dashboard-nav-link: Pill-shaped nav items
- Mobile menu slides down with height animation
```

### Mobile Menu (Current)
- Hamburger icon (Menu/X from lucide-react)
- Slides down from top nav
- Full-width links with large touch targets (px-4 py-3)
- Already has transition animations

### What Needs to Change
1. Add new `BottomNavigation.tsx` component (visible < 768px)
2. Modify `AppNavigation.tsx` to hide desktop nav above keyboard zone
3. Implement scroll-based show/hide for bottom nav
4. Add safe area padding for notched devices

---

## Component Structure Analysis

### Current Breakpoint Handling
```css
/* From DashboardGrid.module.css */
@media (max-width: 1024px) { grid-template-columns: 1fr; }
@media (max-width: 768px) { gap: var(--space-md); }
@media (max-width: 480px) { gap: var(--space-sm); }
```

**Pattern observed:** max-width breakpoints (desktop-first)
**Vision requirement:** min-width breakpoints (mobile-first)
**Impact:** Need to refactor CSS approach in new components

### Shared Component Library (`components/ui/glass/`)

| Component | Lines | Mobile Status | Changes Needed |
|-----------|-------|---------------|----------------|
| GlassCard | 62 | Responsive padding | Add touch active states |
| GlowButton | 109 | Size variants exist | Add haptic feedback, larger lg size |
| GlassModal | 117 | Centered only | Full-screen mobile variant |
| GlassInput | ~80 | Basic | Larger height, keyboard handling |
| CosmicLoader | ~50 | Responsive | No changes |
| GradientText | ~40 | Responsive | No changes |

### Missing Components (To Build)
1. **BottomNavigation** - Fixed bottom tabs with icons
2. **BottomSheet** - Slide-up panel for dream selection
3. **SwipeablePages** - Step-by-step reflection flow
4. **ProgressDots** - Step indicator for reflection

---

## Iteration Breakdown Recommendation

### Recommendation: MULTI-ITERATION (3 phases)

The work naturally divides into three distinct phases with clear dependencies.

### Suggested Iteration Phases

**Iteration 1: Navigation Foundation**
- **Vision:** Establish mobile-native navigation patterns
- **Scope:** Bottom navigation + desktop nav coexistence
  - Create `BottomNavigation.tsx` component
  - Implement 5-tab layout (Home, Dreams, Reflect, Evolution, Profile)
  - Add scroll-based hide/show behavior
  - Safe area padding for notched devices
  - Haptic feedback on tab tap
  - Hide bottom nav on desktop (md: hidden)
  - Update AppNavigation to hide appropriately
- **Why first:** Navigation is the most visible change and establishes mobile-native feel
- **Estimated duration:** 5-7 hours
- **Risk level:** LOW-MEDIUM
- **Success criteria:** Bottom nav visible on mobile, taps work, desktop unchanged

**Iteration 2: Reflection Flow Transformation**
- **Vision:** Create immersive, step-by-step reflection experience
- **Scope:** Full-screen mobile reflection with one question per screen
  - Create `BottomSheet.tsx` component for dream selection
  - Refactor MirrorExperience.tsx to use step-based navigation
  - One question per screen with swipe/tap to advance
  - Progress dots at top
  - Swipe back to previous question
  - Keyboard-aware textarea positioning
  - Exit confirmation if unsaved input
  - Gazing animation remains full-screen
- **Dependencies:** Can use bottom nav hide/show patterns from Iteration 1
  - Requires: Bottom nav hide during reflection (full-screen takeover)
  - Imports: useScroll patterns, safe area utilities
- **Estimated duration:** 8-10 hours
- **Risk level:** MEDIUM-HIGH (largest single component rewrite)
- **Success criteria:** Complete reflection on mobile feels native, not cramped

**Iteration 3: Polish & Components**
- **Vision:** Touch-native interactions throughout the app
- **Scope:** Mobile-optimized cards, modals, forms, and gestures
  - Touch feedback on GlassCard (scale on press)
  - GlassModal full-screen on mobile with slide-up
  - Form improvements (larger inputs, sticky submit)
  - Dashboard mobile optimization (compact hero, horizontal stats)
  - Swipe actions on list items
  - Pull-to-refresh on list views
- **Dependencies:** Navigation and reflection patterns established
  - Requires: Patterns from Iteration 1 & 2
  - Imports: Gesture handlers, animation utilities
- **Estimated duration:** 6-8 hours
- **Risk level:** LOW
- **Success criteria:** All interactions feel touch-native, forms work with keyboard

---

## Dependency Graph

```
Iteration 1: Navigation Foundation
├── BottomNavigation.tsx (new component)
├── AppNavigation.tsx (modified for mobile coexistence)
├── useScrollDirection.ts (new hook for hide/show)
└── Safe area utilities
    ↓
Iteration 2: Reflection Flow
├── BottomSheet.tsx (new component, uses safe area)
├── MirrorExperience.tsx (major refactor)
│   ├── StepNavigation (internal)
│   ├── SwipeHandler (uses gesture patterns)
│   └── KeyboardAwareTextarea (reusable)
├── ProgressDots.tsx (new component)
└── Uses bottom nav hide pattern from Iter 1
    ↓
Iteration 3: Polish & Components
├── GlassCard.tsx (add touch states)
├── GlassModal.tsx (full-screen mobile)
├── GlassInput.tsx (larger, keyboard-aware)
├── DashboardHero.tsx (compact mobile)
├── Dashboard cards (touch feedback)
└── List components (swipe actions, pull-to-refresh)
```

---

## Risk Assessment

### High Risks

- **MirrorExperience Refactor (Iteration 2)**
  - **Impact:** 1000+ line component with complex state, could introduce regressions
  - **Mitigation:** Keep existing flow logic, wrap in new step-based UI layer
  - **Recommendation:** Heavy testing before/after, consider feature flag for gradual rollout

### Medium Risks

- **Scroll-based nav visibility (Iteration 1)**
  - **Impact:** Could feel janky if not implemented smoothly
  - **Mitigation:** Use Framer Motion's useScroll hook, debounce threshold

- **Keyboard handling on iOS Safari (Iteration 2 & 3)**
  - **Impact:** iOS has notorious keyboard viewport issues
  - **Mitigation:** Use visualViewport API, test on real iOS devices

### Low Risks

- **Adding touch states to existing components (Iteration 3)**
  - **Impact:** Straightforward CSS/animation changes
  - **Mitigation:** Use Tailwind's active: and focus: pseudo-classes

---

## Integration Considerations

### Cross-Phase Integration Points

- **Safe Area Handling:** Shared utility for env(safe-area-inset-*) used in bottom nav, bottom sheets, and sticky form buttons
- **Gesture Patterns:** Swipe detection logic shared between step navigation and list swipe actions
- **Scroll Detection:** useScrollDirection hook used in bottom nav and potentially for header hide/show

### Potential Integration Challenges

- **Desktop/Mobile Coexistence:** Must ensure desktop experience remains unchanged
  - Solution: Use CSS media queries consistently, never remove desktop-only code
- **Animation Coordination:** Bottom nav + page content + keyboard all animating could cause jank
  - Solution: Use will-change hints, test on low-end devices

---

## Recommendations for Master Plan

1. **Start with Navigation (Iteration 1)**
   - Highest visibility, establishes mobile-native identity immediately
   - Low technical risk compared to reflection refactor

2. **Prioritize Reflection Flow (Iteration 2)**
   - This is the core differentiator for mobile UX
   - Should receive most time/attention
   - Consider shipping after Iteration 2 as viable MVP

3. **Polish Phase Can Be Incremental (Iteration 3)**
   - Touch states and modal improvements can be done incrementally
   - Dashboard mobile optimization is enhancement, not critical path
   - Could be split into smaller PRs if time-constrained

4. **Test on Real Devices**
   - Vision document emphasizes "Test on real devices, not just Chrome DevTools"
   - iOS Safari and Android Chrome have different behaviors
   - Safe area handling varies by device

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion, tRPC
- **Patterns observed:**
  - Glass morphism design system with consistent styling
  - CSS variables for spacing, colors, animations in `variables.css`
  - Styled-jsx for component-specific styles
  - CSS Modules for grid layouts
  - Framer Motion for all animations
- **Opportunities:**
  - Existing CosmicLoader, GlassCard patterns are highly reusable
  - Responsive spacing scale already uses clamp() for fluid sizing
  - Animation utilities in `lib/animations/variants.ts` can be extended
- **Constraints:**
  - Must maintain cosmic glass aesthetic
  - Performance budget: No additional JS bundle weight > 15KB gzipped
  - Must support iOS Safari 14+, Android Chrome 10+

### New Utilities Needed

1. **useScrollDirection.ts** - Hook for scroll-based UI visibility
2. **useSafeArea.ts** - Hook for safe area insets
3. **useHapticFeedback.ts** - Wrapper for vibration API (with graceful fallback)
4. **gesture utilities** - Framer Motion drag/swipe handlers (may already exist)

---

## Notes & Observations

- The vision document is exceptionally detailed with 38 specific acceptance criteria - this should translate to clear task definitions
- Current codebase already has excellent accessibility considerations (WCAG compliance, reduced motion support, skip links)
- The reflection experience is the emotional core of the app - mobile optimization here has highest user impact
- Vision mentions "Should-Have" features like haptic feedback and gesture navigation - these could be folded into Iteration 3 if time permits
- Bottom sheet pattern is becoming standard in modern mobile web (similar to native iOS/Android patterns)

---

*Exploration completed: 2025-12-02*
*This report informs master planning decisions*
