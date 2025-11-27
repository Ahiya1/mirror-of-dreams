# Explorer 1 Report: Architecture & Structure Analysis

**Explorer ID:** Explorer-1  
**Iteration:** 11 (Global)  
**Plan:** plan-6  
**Focus Area:** Architecture & Structure  
**Created:** 2025-11-28  
**Status:** COMPLETE

---

## Executive Summary

Mirror of Dreams is **production-ready for systematic polish and validation**. Iteration 3 (global iteration 11) focuses on **micro-interactions, audits, and comprehensive QA** to achieve 10/10 product quality. The application has a mature architecture built on Iteration 1's design system foundation and Iteration 2's core experiences.

**Key Finding:** This is a **polish and validation iteration**, not a feature-building iteration. The architecture is stable, patterns are established, and the scope is systematic application of refinements.

**Architecture Readiness:**
1. **Micro-Interactions (Feature 7):** Framer Motion variants exist at `lib/animations/variants.ts` - extend with new interaction patterns
2. **Typography Audit (Feature 8):** Design system established in `styles/variables.css` and `styles/globals.css` - systematic review needed
3. **Color Audit (Feature 9):** Semantic color system defined in `styles/variables.css` - enforcement audit required
4. **Accessibility Validation:** No formal testing infrastructure - manual testing required
5. **Performance Validation:** No CI/CD performance monitoring - manual Lighthouse testing needed
6. **Cross-Browser Testing:** No automated browser matrix - manual testing required
7. **Final QA:** 3 critical user flows identified for end-to-end validation

---

## Discoveries

### Current Animation System

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/animations/variants.ts`

**Existing Variants (265 lines):**
- `cardVariants` - Card entrance + hover (y: -2px lift, no scale)
- `glowVariants` - Box-shadow transitions (purple glow on hover)
- `staggerContainer` + `staggerItem` - Sequential fade-in for lists
- `modalOverlayVariants` + `modalContentVariants` - Modal animations
- `fadeInVariants` - Simple fade-in
- `slideUpVariants` - Fade + slide up (y: 20)
- `buttonVariants` - DEPRECATED (use CSS transitions instead)
- `orbVariants` - Progress orb states (inactive/active/complete)
- `rotateVariants` - Infinite rotation for loaders
- `slideInLeftVariants` + `slideInRightVariants` - Directional slides

**Discovery:** Animation library is **mature and opinionated**. Deprecated patterns (scale effects, pulsing) have been removed. Focus on **restrained, purposeful animations**.

**Components Needing Micro-Interactions (Feature 7 Scope):**

1. **Reflection Form Inputs:**
   - Textarea focus: Subtle glow border animation (NEW variant needed)
   - Character counter: Color shift white → gold → red (NEW variant needed)
   - Submit button hover: Already exists (GlowButton component)

2. **Dashboard Cards:**
   - Hover: Lift + purple glow (EXISTING: `cardVariants.hover` + `glowVariants.hover`)
   - Click: Scale-down (0.98) then scale back (NEW variant needed: `cardPressVariants`)

3. **Navigation:**
   - Active page indicator: CSS-based (no Framer Motion needed)
   - Hover: Smooth color transitions 200ms (CSS-based)

4. **Page Transitions:**
   - All pages fade-in on mount (EXISTING: `fadeInVariants`)
   - Route crossfade: 150ms out, 300ms in (NEW: needs Next.js route transitions)

5. **Loading States:**
   - CosmicLoader fade-in (EXISTING: component handles internally)
   - Minimum 500ms display (NEW: logic needed, not variant)

**Missing Variants (Feature 7 Must Create):**
```typescript
// inputFocusVariants - Textarea focus glow
export const inputFocusVariants: Variants = {
  rest: { boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)' },
  focus: { 
    boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)',
    transition: { duration: 0.2 }
  }
};

// cardPressVariants - Card click feedback
export const cardPressVariants: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.98, transition: { duration: 0.1 } }
};

// characterCounterVariants - Dynamic color based on limit
// Note: This is state-driven, not animation variant. Use conditional className.
```

### Typography System Architecture

**Files:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/styles/variables.css` (Lines 170-233: Typography section)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/styles/globals.css` (Lines 487-556: Typography utilities)

**Design System Established (Iteration 1):**

**Font Sizes (Responsive via clamp):**
```css
--text-xs: clamp(0.85rem, 1.8vw, 0.9rem);     /* 14-15px - Captions */
--text-sm: clamp(0.9rem, 2.2vw, 1rem);        /* 14-16px - Metadata */
--text-base: clamp(1.05rem, 2.5vw, 1.15rem);  /* 17-18px - Body (WCAG AA) */
--text-lg: clamp(1.1rem, 3vw, 1.4rem);        /* 18-22px - Emphasized */
--text-xl: clamp(1.3rem, 4vw, 1.6rem);        /* 21-26px - h3 */
--text-2xl: clamp(1.6rem, 4vw, 2rem);         /* 26-32px - h2 */
--text-3xl: clamp(1.8rem, 5vw, 2.5rem);       /* 29-40px - Large */
--text-4xl: clamp(2.2rem, 6vw, 3rem);         /* 35-48px - h1 */
--text-5xl: clamp(2.8rem, 7vw, 3.5rem);       /* 45-56px - Hero */
```

**Semantic Utilities (globals.css):**
- `.text-h1` → `--text-4xl` + `--font-semibold` + `--leading-tight`
- `.text-h2` → `--text-2xl` + `--font-semibold` + `--leading-tight`
- `.text-h3` → `--text-xl` + `--font-medium` + `--leading-snug`
- `.text-body` → `--text-base` + `--font-normal` + `--leading-relaxed` (1.75 line-height)
- `.text-small` → `--text-sm` + `--font-normal` + `--leading-normal`
- `.text-tiny` → `--text-xs` + `--font-normal` + `--leading-snug`

**Line Heights:**
```css
--leading-tight: 1.25;      /* Headings */
--leading-snug: 1.375;      /* Subheadings */
--leading-normal: 1.5;      /* UI text */
--leading-relaxed: 1.75;    /* Body text - WCAG AA optimal */
--leading-loose: 2.0;       /* Long-form - maximum readability */
```

**Contrast Ratios (WCAG AA):**
```css
--cosmic-text: #ffffff;                             /* 100% - Primary */
--cosmic-text-secondary: rgba(255, 255, 255, 0.8);  /* 80% - Body (WCAG AA PASS) */
--cosmic-text-muted: rgba(255, 255, 255, 0.6);      /* 60% - Metadata (BORDERLINE) */
--cosmic-text-faded: rgba(255, 255, 255, 0.4);      /* 40% - Disabled (FAIL) */
```

**AUDIT REQUIRED (Feature 8):**
1. All headings use correct semantic class (.text-h1, .text-h2, .text-h3)
2. All body text has proper line-height (1.75 for readability)
3. Reading widths optimal (720px for reflection content, confirmed in variables.css line 323)
4. No arbitrary font-size values (use design system only)
5. Responsive scaling works (mobile reduces 20% per vision.md)

**Audit Locations:**
- `/app/dashboard/page.tsx` - Dashboard headings
- `/app/reflection/MirrorExperience.tsx` - Reflection form labels
- `/app/reflections/[id]/page.tsx` - Individual reflection content
- `/app/reflections/page.tsx` - Collection view headings
- `/app/dreams/page.tsx` - Dreams page headings
- `/app/evolution/page.tsx` - Evolution report headings
- `/app/visualizations/page.tsx` - Visualizations headings

### Color System Architecture

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/styles/variables.css` (Lines 4-99: Colors section)

**Semantic Color Palette (Iteration 1 Established):**

**Purple/Amethyst (Primary):**
```css
--intense-primary: rgba(147, 51, 234, 0.95);   /* Primary actions */
--intense-bg: rgba(147, 51, 234, 0.08);        /* Active states */
--intense-border: rgba(147, 51, 234, 0.4);     /* Emphasis */
```

**Gold (Success/Highlights):**
```css
--fusion-primary: rgba(251, 191, 36, 0.95);    /* Sacred Fusion tone */
--fusion-bg: rgba(251, 191, 36, 0.08);         /* Success moments */
--fusion-border: rgba(251, 191, 36, 0.3);      /* Highlights */
```

**Blue (Information):**
```css
--info-primary: rgba(59, 130, 246, 0.9);       /* Information */
--info-bg: rgba(59, 130, 246, 0.1);            /* Calm actions */
--info-border: rgba(59, 130, 246, 0.3);        /* Info borders */
```

**Red (Errors/Warnings):**
```css
--error-primary: rgba(239, 68, 68, 0.9);       /* Errors */
--error-bg: rgba(239, 68, 68, 0.1);            /* Error states */
--error-border: rgba(239, 68, 68, 0.3);        /* Warnings */
```

**White/Gray (Text):**
```css
--cosmic-text: #ffffff;                        /* 100% - Primary text */
--cosmic-text-secondary: rgba(255, 255, 255, 0.8);  /* 80% - Body */
--cosmic-text-muted: rgba(255, 255, 255, 0.6);      /* 60% - Secondary */
--cosmic-text-faded: rgba(255, 255, 255, 0.4);      /* 40% - Tertiary */
```

**Semantic Utilities (globals.css lines 609-647):**
```css
.text-semantic-success { @apply text-mirror-success; }
.text-semantic-error { @apply text-mirror-error; }
.bg-semantic-success-light { @apply bg-mirror-success/10; }
.border-semantic-success { @apply border-mirror-success/50; }
```

**AUDIT REQUIRED (Feature 9):**
1. All colors from semantic palette (no arbitrary Tailwind colors like `text-purple-500`)
2. Consistent usage across pages (purple for primary, gold for success, etc.)
3. Contrast ratios meet WCAG AA (95% white minimum on dark background)
4. No hardcoded hex colors (use CSS variables only)

**Common Violations to Find:**
- `className="text-purple-500"` → Should use `text-mirror-amethyst` or semantic class
- `style={{ color: '#8B5CF6' }}` → Should use `var(--intense-primary)`
- `className="bg-blue-900"` → Should use semantic background class

### Testing Infrastructure (Current State)

**Test Files Found:** ZERO
- No `.test.tsx` files
- No `.spec.tsx` files
- No Playwright tests
- No Cypress tests
- No Jest configuration

**Discovery:** Mirror of Dreams has **NO FORMAL TESTING INFRASTRUCTURE**. All testing in Iteration 3 will be **MANUAL**.

**Required Testing (Feature 10-13 Scope):**

1. **Accessibility Validation (Feature 10):**
   - **Keyboard Navigation:** Manual tab-through all pages
   - **Screen Reader:** Manual NVDA/VoiceOver testing
   - **Color Contrast:** Automated checks via Lighthouse
   - **Reduced Motion:** Manual browser setting test

2. **Performance Validation (Feature 11):**
   - **LCP Measurement:** Chrome DevTools Lighthouse
   - **FID Measurement:** Chrome DevTools Performance panel
   - **Bundle Size:** `npm run build` output analysis
   - **Animation Profiling:** 60fps validation via Chrome DevTools

3. **Cross-Browser Testing (Feature 12):**
   - **Browsers:** Chrome, Firefox, Safari, Edge (manual testing)
   - **Breakpoints:** 320px, 768px, 1024px, 1440px, 1920px (manual resize)
   - **User Flows:** 3 critical flows tested per browser

4. **Final QA (Feature 13):**
   - **Smoke Test:** All vision.md acceptance criteria (87 items from master plan)
   - **Regression Test:** Existing features still work (Dreams, Reflections, Evolution)
   - **Edge Cases:** Empty states, loading states, error states

**Recommendation:** Document manual testing checklist in iteration plan. No test automation infrastructure exists.

### Navigation Height System (Iteration 1 Fix)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx`

**Dynamic Height Measurement (Lines 85-109):**
```typescript
useEffect(() => {
  const measureNavHeight = () => {
    const nav = document.querySelector('[data-nav-container]');
    if (nav) {
      const height = nav.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    }
  };
  measureNavHeight();
  window.addEventListener('resize', handleResize);
}, [showMobileMenu]);
```

**CSS Variable (variables.css line 320):**
```css
--nav-height: clamp(60px, 8vh, 80px);  /* Fallback, JS sets actual */
```

**Padding Utility (globals.css line 654-656):**
```css
.pt-nav {
  padding-top: var(--nav-height);
}
```

**Discovery:** Navigation overlap fix implemented in Iteration 1. All pages should use `.pt-nav` class on main container.

**VALIDATION REQUIRED (Feature 13):**
- Confirm all pages have `.pt-nav` applied
- Test at mobile (hamburger menu open/closed)
- Test at all breakpoints (navigation height changes)

---

## Patterns Identified

### Pattern 1: Framer Motion Variants Pattern

**Description:** Reusable animation variants for consistent motion design

**File:** `lib/animations/variants.ts`

**Use Case:** All interactive elements (cards, buttons, modals, pages)

**Example:**
```tsx
import { motion } from 'framer-motion';
import { cardVariants, glowVariants } from '@/lib/animations/variants';

<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  whileHover="hover"
>
  <GlassCard>{/* content */}</GlassCard>
</motion.div>
```

**Recommendation:** **EXTEND** with new variants for Feature 7 (inputFocusVariants, cardPressVariants).

### Pattern 2: CSS Custom Properties

**Description:** Design tokens via CSS variables for consistent theming

**File:** `styles/variables.css`

**Use Case:** All spacing, typography, colors

**Example:**
```css
/* Define variable */
--space-xl: clamp(2rem, 4vw, 3rem);  /* 32-48px responsive */

/* Use in component */
.card {
  padding: var(--space-xl);
}
```

**Recommendation:** **REFERENCE** for all new styles. Never use hardcoded values.

### Pattern 3: Semantic Typography Classes

**Description:** Utility classes for consistent text hierarchy

**File:** `styles/globals.css` (lines 487-556)

**Use Case:** All headings, body text, metadata

**Example:**
```tsx
<h1 className="text-h1 gradient-text-cosmic">Dashboard</h1>
<p className="text-body text-white/80">Welcome back!</p>
<span className="text-small text-white/60">Created 2 days ago</span>
```

**Recommendation:** **AUDIT** all pages to ensure semantic classes used (Feature 8).

### Pattern 4: Stagger Animation

**Description:** Sequential fade-in for list items

**File:** `hooks/useStaggerAnimation.ts`

**Use Case:** Dashboard cards, reflection collection, dreams list

**Example:**
```tsx
const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 150,
  duration: 800,
  triggerOnce: true,
});

<div ref={containerRef}>
  {items.map((item, i) => (
    <div style={getItemStyles(i)}>{item}</div>
  ))}
</div>
```

**Recommendation:** **USE** for any new list/grid animations (already established).

### Pattern 5: Reduced Motion Respect

**Description:** Disable animations for users with motion sensitivity

**File:** `styles/variables.css` (lines 354-371)

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: none;
    --transition-smooth: none;
    --transition-slow: none;
    --duration-300: 1ms;
    --duration-500: 1ms;
  }
}
```

**Discovery:** Design system already respects `prefers-reduced-motion`. Framer Motion variants need manual checks.

**Recommendation:** **VALIDATE** all new variants disable animations except opacity (Feature 7).

---

## Complexity Assessment

### Feature 7: Micro-Interactions & Animations (LOW COMPLEXITY)

**Components Affected:**
- `lib/animations/variants.ts` (add 2-3 new variants)
- `app/reflection/MirrorExperience.tsx` (textarea focus, character counter)
- `components/dashboard/cards/*.tsx` (card click feedback)
- `components/shared/AppNavigation.tsx` (active page indicator - CSS only)
- `styles/globals.css` (page transition styles)

**New Variants Needed:**
1. `inputFocusVariants` (Textarea focus glow)
2. `cardPressVariants` (Card click scale-down)

**CSS-Based Interactions:**
- Navigation hover: 200ms color transition (add to AppNavigation.tsx styles)
- Active page: underline or glow indicator (CSS pseudo-class)
- Character counter: Conditional className based on char count

**Reduced Motion:**
- Add `useReducedMotion()` hook (check `prefers-reduced-motion`)
- Wrap animations with condition: `const prefersReduced = useReducedMotion(); if (prefersReduced) return null;`

**Complexity Drivers:**
- **Simple:** Most interactions are CSS transitions (no complex state)
- **Testing:** Manual testing at 60fps (Chrome DevTools Performance)
- **Edge Cases:** Reduced motion must disable all except opacity

**Estimate:** 6-8 hours (0.75-1 day)

### Feature 8: Typography & Readability Polish - AUDIT (LOW COMPLEXITY)

**Scope:** AUDIT ONLY (design system already established in Iteration 1)

**Pages to Audit:**
1. `/app/dashboard/page.tsx` (3 headings, 12 text elements)
2. `/app/reflection/MirrorExperience.tsx` (4 question labels, 3 tone descriptions)
3. `/app/reflections/[id]/page.tsx` (AI response, metadata)
4. `/app/reflections/page.tsx` (header, filter labels)
5. `/app/dreams/page.tsx` (header, dream cards)
6. `/app/evolution/page.tsx` (report headings)
7. `/app/visualizations/page.tsx` (chart labels)

**Audit Checklist per Page:**
- [ ] All h1 use `.text-h1` class (not arbitrary `text-4xl`)
- [ ] All h2 use `.text-h2` class
- [ ] All h3 use `.text-h3` class
- [ ] Body text uses `.text-body` (with `leading-relaxed` line-height)
- [ ] Metadata uses `.text-small` or `.text-tiny`
- [ ] No hardcoded `font-size` or `line-height` values
- [ ] Reading width max 720px for long-form content (reflection content)
- [ ] Contrast ratios WCAG AA (95% white minimum for headings)

**Complexity Drivers:**
- **Simple:** Find-and-replace existing classes with semantic classes
- **Manual:** No automated linting for design system compliance
- **Edge Cases:** Reflection content already uses react-markdown (check custom renderers)

**Estimate:** 4-6 hours (0.5-0.75 day)

### Feature 9: Color & Semantic Meaning - AUDIT (LOW COMPLEXITY)

**Scope:** AUDIT ONLY (semantic palette already defined in Iteration 1)

**Audit Process:**
1. **Find Violations:** Search codebase for non-semantic color classes
   - `grep -r "text-purple-" app/ components/`
   - `grep -r "bg-blue-" app/ components/`
   - `grep -r "border-red-" app/ components/`
   - `grep -r "style={{ color:" app/ components/`

2. **Replace with Semantic:**
   - `text-purple-500` → `text-mirror-amethyst` or `.text-semantic-success`
   - `bg-blue-900` → `.bg-semantic-info-light`
   - `border-red-500` → `.border-semantic-error`

3. **Validate Contrast:**
   - Run Lighthouse accessibility audit
   - Check all text meets WCAG AA (4.5:1 for normal, 3:1 for large)
   - Fix violations by adjusting opacity (e.g., 60% → 70% per Iteration 1 findings)

**Known Issues (from Iteration 1):**
- 60% opacity borderline for WCAG AA (may need 70% for critical content)
- 40% opacity FAILS WCAG AA (use only for decorative text)

**Complexity Drivers:**
- **Simple:** Mostly find-and-replace
- **Testing:** Automated (Lighthouse contrast checks)
- **Edge Cases:** Gradient text classes already use semantic colors (no changes needed)

**Estimate:** 3-5 hours (0.5 day)

### Feature 10: Accessibility Validation (MEDIUM COMPLEXITY)

**Scope:** Manual testing + automated checks

**Testing Categories:**

1. **Keyboard Navigation (Manual):**
   - Tab through all pages (dashboard, reflection, dreams, evolution, visualizations)
   - All interactive elements focusable (buttons, links, inputs, cards)
   - Focus indicators visible (ring, outline, glow)
   - Tab order logical (top to bottom, left to right)
   - Escape key closes modals/dropdowns
   - Enter/Space activates buttons

2. **Screen Reader (Manual):**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - All icons have ARIA labels (e.g., `aria-label="Refresh data"`)
   - Semantic HTML (h1-h6, nav, main, article)
   - Form inputs have labels (`<label>` or `aria-label`)
   - Status messages announced (`role="status"`, `aria-live="polite"`)

3. **Color Contrast (Automated):**
   - Run Lighthouse accessibility audit on all pages
   - Fix violations (increase opacity, adjust colors)
   - Target: 100% WCAG AA compliance

4. **Reduced Motion (Manual):**
   - Set browser preference `prefers-reduced-motion: reduce`
   - Verify animations disabled (except opacity fades)
   - Test all pages with motion preference

**Complexity Drivers:**
- **Manual Testing:** No automation, requires human tester
- **Tools Needed:** NVDA/VoiceOver, Lighthouse, browser DevTools
- **Edge Cases:** Mobile screen reader (TalkBack, VoiceOver iOS)

**Estimate:** 6-8 hours (0.75-1 day)

### Feature 11: Performance Validation (MEDIUM COMPLEXITY)

**Scope:** Measure + validate performance budget

**Performance Budget (from master plan):**
- **LCP (Largest Contentful Paint):** <2.5s
- **FID (First Input Delay):** <100ms
- **Bundle Size:** Keep increase <20KB (currently -110KB under budget per Explorer 4)

**Testing Process:**

1. **LCP Measurement:**
   - Run Lighthouse CI on all pages
   - Identify slow pages (target: all <2.5s)
   - Check main-app.js size (currently 5.8MB per Iteration 2 reports - needs code splitting!)

2. **FID Measurement:**
   - Chrome DevTools Performance panel
   - Record page load + first interaction
   - Verify <100ms response time

3. **Animation Profiling:**
   - Chrome DevTools Performance → Record
   - Test all animations (dashboard stagger, card hover, page transitions)
   - Verify 60fps (green line in timeline)

4. **Bundle Size Analysis:**
   - `npm run build` → Check output
   - Analyze `main-app.js`, `dashboard.js`, `reflection.js` chunk sizes
   - Implement code splitting if needed

**Complexity Drivers:**
- **Manual Testing:** No CI/CD performance monitoring
- **Tools:** Lighthouse, Chrome DevTools, bundle analyzer
- **Code Splitting:** May need dynamic imports for large pages

**Estimate:** 6-10 hours (0.75-1.25 days)

### Feature 12: Cross-Browser & Responsive Testing (MEDIUM-HIGH COMPLEXITY)

**Scope:** Manual testing across browsers and breakpoints

**Browser Matrix:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest - Mac/iOS)
- Edge (latest)

**Breakpoints:**
- 320px (Mobile - iPhone SE)
- 768px (Tablet - iPad)
- 1024px (Laptop)
- 1440px (Desktop)
- 1920px (Large Desktop)

**Testing Process:**

1. **Per Browser:**
   - Load all pages (dashboard, reflection, dreams, evolution, visualizations)
   - Test 3 critical user flows (new user onboarding, returning user, evolution unlock)
   - Check CSS compatibility (backdrop-filter, grid, flexbox)
   - Verify animations smooth (Framer Motion, CSS transitions)

2. **Per Breakpoint:**
   - Resize browser to breakpoint width
   - Verify layout adapts (mobile stacks, desktop grids)
   - Check navigation (hamburger menu on mobile, desktop nav on laptop+)
   - Test touch targets (44px minimum on mobile)

3. **Browser-Specific Issues:**
   - Safari: backdrop-filter blur support
   - Firefox: CSS grid gap compatibility
   - Edge: Framer Motion performance
   - iOS Safari: Fixed positioning quirks

**Complexity Drivers:**
- **Manual Testing:** No automated browser matrix (no BrowserStack, no Playwright)
- **Time-Consuming:** 4 browsers × 5 breakpoints = 20 test scenarios
- **Edge Cases:** iOS Safari fixed nav, Firefox font rendering

**Estimate:** 8-12 hours (1-1.5 days)

### Feature 13: Final QA (HIGH COMPLEXITY)

**Scope:** Comprehensive end-to-end validation

**Testing Categories:**

1. **Smoke Test (87 Acceptance Criteria from vision.md):**
   - Feature 1: Navigation overlap (5 criteria)
   - Feature 2: Dashboard richness (7 sections × criteria)
   - Feature 3: Reflection page depth (6 criteria)
   - Feature 4: Individual reflection display (8 criteria)
   - Feature 5: Reflections collection (6 criteria)
   - Feature 6: Empty states (6 criteria)
   - Feature 7: Micro-interactions (6 criteria)
   - Feature 8: Typography (5 criteria)
   - Feature 9: Color semantics (5 criteria)
   - Feature 10: Spacing (4 criteria)

2. **Regression Test:**
   - Dreams: Create, edit, archive (existing features)
   - Reflections: Create, view, filter (existing features)
   - Evolution: Generate report, view insights (existing features)
   - Visualizations: View charts (existing features)

3. **User Flows (3 Critical Flows):**
   - **Flow 1: New User Onboarding**
     - Sign in → Dashboard (sees empty states) → Create dream → Reflect → View output
   - **Flow 2: Returning User Engagement**
     - Sign in → Dashboard (sees dreams + reflections) → Browse reflections → View one → Create new
   - **Flow 3: Evolution Unlock**
     - Complete 4th reflection → See unlock message → View evolution report → Return to dashboard

4. **Edge Cases:**
   - Empty states: 0 dreams, 0 reflections, 0 evolution reports
   - Loading states: Slow network (throttle to Slow 3G)
   - Error states: API failure, network timeout, 404 reflection

**Complexity Drivers:**
- **Comprehensive:** 87 acceptance criteria + 3 user flows + edge cases
- **Time-Consuming:** Manual testing, no automation
- **Documentation:** Must create QA checklist, track results
- **Bug Triage:** Must prioritize fixes (P0, P1, P2)

**Estimate:** 10-14 hours (1.25-1.75 days)

---

## Integration Points

### Animation System Integration

**Framer Motion Variants:**
- **File:** `lib/animations/variants.ts`
- **Integration:** Import variants in components, apply to motion elements

**New Variants (Feature 7):**
```typescript
// Add to lib/animations/variants.ts
export const inputFocusVariants: Variants = {
  rest: {
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  focus: {
    boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)',
    transition: { duration: 0.2 },
  },
};

export const cardPressVariants: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};
```

**Usage Example:**
```tsx
// In MirrorExperience.tsx (reflection form)
<motion.textarea
  variants={inputFocusVariants}
  initial="rest"
  whileFocus="focus"
  className="reflection-textarea"
/>

// In DashboardCard.tsx
<motion.div
  variants={cardPressVariants}
  initial="rest"
  whileTap="tap"
>
  <GlassCard>{/* content */}</GlassCard>
</motion.div>
```

### Design System Integration

**CSS Variables Usage:**
```tsx
// Typography (Feature 8 audit)
<h1 className="text-h1 gradient-text-cosmic">Dashboard</h1>
<p className="text-body text-white/80">Body text</p>

// Colors (Feature 9 audit)
<div className="text-semantic-success bg-semantic-success-light border-semantic-success">
  Success message
</div>

// Spacing (already established)
<div className="px-xl py-lg gap-md">
  <GlassCard className="p-xl">{/* content */}</GlassCard>
</div>
```

### Testing Tools Integration

**Lighthouse (Accessibility + Performance):**
```bash
# Run Lighthouse via Chrome DevTools
# 1. Open DevTools (F12)
# 2. Navigate to Lighthouse tab
# 3. Select: Performance, Accessibility, Best Practices
# 4. Click "Generate report"

# Check LCP, FID, WCAG AA compliance
```

**Chrome DevTools Performance:**
```bash
# 60fps animation profiling
# 1. Open DevTools → Performance tab
# 2. Click Record (red circle)
# 3. Trigger animation (hover card, submit form)
# 4. Stop recording
# 5. Verify FPS stays green (60fps)
```

**Manual Testing Checklist:**
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader (NVDA/VoiceOver)
- [ ] Reduced motion (browser preference)
- [ ] Cross-browser (Chrome, Firefox, Safari, Edge)
- [ ] Responsive (320px, 768px, 1024px, 1440px, 1920px)

---

## Risks & Challenges

### Technical Risks

**Risk 1: 60fps Animation Performance on Low-End Devices**
- **Impact:** MEDIUM (affects user experience)
- **Probability:** 40%
- **Details:** Framer Motion transitions + stagger animations could drop below 60fps
- **Mitigation:**
  1. Profile all animations with Chrome DevTools Performance
  2. Use `will-change: transform, opacity` CSS property
  3. Reduce particle count on mobile (conditional rendering)
  4. Respect `prefers-reduced-motion` (disable all except opacity)

**Risk 2: Cross-Browser CSS Compatibility (Safari backdrop-filter)**
- **Impact:** MEDIUM (visual degradation)
- **Probability:** 30%
- **Details:** Safari may not support `backdrop-filter: blur(40px)` on GlassCard
- **Mitigation:**
  1. Test backdrop-filter in Safari 14+ (should work)
  2. Add fallback: `background: rgba(255, 255, 255, 0.08)` (no blur)
  3. Progressive enhancement (blur if supported, solid if not)

**Risk 3: Manual Testing Coverage Gaps**
- **Impact:** HIGH (bugs slip to production)
- **Probability:** 50%
- **Details:** No automated tests, manual QA may miss edge cases
- **Mitigation:**
  1. Create comprehensive QA checklist (87 acceptance criteria)
  2. Prioritize 3 critical user flows (onboarding, engagement, evolution)
  3. Document test results (spreadsheet or markdown)
  4. Bug triage: P0 (blocking), P1 (important), P2 (polish)

### Complexity Risks

**Risk 4: Subjective Quality Assessment ("Feels Premium")**
- **Impact:** MEDIUM (perception vs. metrics)
- **Probability:** 40%
- **Details:** "Micro-interactions feel premium" is subjective, hard to measure
- **Mitigation:**
  1. 60fps profiling (objective metric)
  2. User feedback from Ahiya (creator testing)
  3. Compare to reference apps (Notion, Linear, Figma - smooth interactions)
  4. Iterate on feel (allow 2-3 rounds of polish)

**Risk 5: QA Scope Creep (87 Acceptance Criteria)**
- **Impact:** MEDIUM (timeline overrun)
- **Probability:** 60%
- **Details:** 87 criteria from vision.md could expand during testing
- **Mitigation:**
  1. Strict scope: Test criteria as-written (no new features)
  2. Bug triage: P0 fixes required, P1/P2 optional
  3. Time-box QA: 10-14 hours max, document remaining items
  4. Defer non-critical bugs to post-MVP backlog

---

## Recommendations for Planner

### 1. Feature 7 (Micro-Interactions) - Single Builder, Clear Scope

**Rationale:** Small, focused scope. Most interactions are CSS-based, not complex animations.

**Builder Tasks:**
1. Add 2 new Framer Motion variants (`inputFocusVariants`, `cardPressVariants`)
2. Apply textarea focus glow in MirrorExperience.tsx
3. Add character counter color logic (conditional className, not animation)
4. Apply card click feedback in DashboardCard.tsx
5. Add CSS-based navigation hover (200ms color transition)
6. Validate reduced motion support (test with browser preference)

**Estimate:** 6-8 hours (1 builder, 1 day)

### 2. Feature 8 (Typography Audit) - Single Builder, Systematic Review

**Rationale:** Audit only, no new design system. Find-and-replace semantic classes.

**Builder Tasks:**
1. Audit 7 pages (dashboard, reflection, dreams, evolution, visualizations, reflections, reflections/[id])
2. Replace arbitrary classes with semantic (`.text-4xl` → `.text-h1`)
3. Verify line-heights correct (1.75 for body, 1.25 for headings)
4. Check reading widths (720px max for reflection content)
5. Validate contrast ratios (Lighthouse audit)

**Estimate:** 4-6 hours (1 builder, 0.5-0.75 day)

### 3. Feature 9 (Color Audit) - Single Builder, Find-and-Replace

**Rationale:** Semantic palette established. Just find violations and fix.

**Builder Tasks:**
1. Search codebase for non-semantic colors (`grep -r "text-purple-" app/`)
2. Replace with semantic classes
3. Run Lighthouse contrast audit
4. Fix violations (adjust opacity 60% → 70%)

**Estimate:** 3-5 hours (1 builder, 0.5 day)

### 4. Features 10-13 (Validation + QA) - Single Builder, Manual Testing

**Rationale:** All validation tasks require manual testing, no automation. Assign to single builder for consistency.

**Builder Tasks:**
1. **Accessibility (6-8 hours):** Keyboard nav, screen reader, contrast, reduced motion
2. **Performance (6-10 hours):** LCP, FID, bundle size, animation profiling
3. **Cross-Browser (8-12 hours):** Chrome, Firefox, Safari, Edge × 5 breakpoints
4. **Final QA (10-14 hours):** 87 acceptance criteria, 3 user flows, edge cases

**Total Estimate:** 30-44 hours (1 builder, 4-5.5 days)

**Recommendation:** This is ONE builder role, but it's time-consuming. Consider splitting:
- **Sub-Builder A (Validation):** Accessibility + Performance (12-18 hours)
- **Sub-Builder B (QA):** Cross-browser + Final QA (18-26 hours)

### 5. Builder Allocation for Iteration 3

**Option A: 2 Builders (Recommended)**
- **Builder-1 (Polish):** Features 7, 8, 9 (Micro-interactions, Typography, Color) - 13-19 hours
- **Builder-2 (Validation + QA):** Features 10, 11, 12, 13 (Accessibility, Performance, Cross-browser, QA) - 30-44 hours

**Option B: 3 Builders (If Parallel Speed Needed)**
- **Builder-1 (Interactions):** Feature 7 only - 6-8 hours
- **Builder-2 (Audits):** Features 8, 9 - 7-11 hours
- **Builder-3 (Validation + QA):** Features 10, 11, 12, 13 - 30-44 hours

**Recommendation:** **Option A (2 builders)**. Feature 7-9 can be done by one builder sequentially (polish mindset). Feature 10-13 require dedicated tester mindset.

### 6. Document QA Checklist in Iteration Plan

**Recommendation:** Create `qa-checklist.md` with:
- 87 acceptance criteria from vision.md (checkbox format)
- 3 critical user flows (step-by-step validation)
- Edge cases (empty, loading, error states)
- Browser matrix (4 browsers × 5 breakpoints = 20 scenarios)
- Accessibility tests (keyboard, screen reader, contrast, reduced motion)
- Performance benchmarks (LCP <2.5s, FID <100ms, 60fps animations)

**Purpose:** Give builder-2 clear testing roadmap, prevent scope creep.

---

## Resource Map

### Critical Files for Iteration 3

**Micro-Interactions (Feature 7):**
- `lib/animations/variants.ts` (add inputFocusVariants, cardPressVariants)
- `app/reflection/MirrorExperience.tsx` (textarea focus, character counter)
- `components/dashboard/cards/DashboardCard.tsx` (card press feedback)
- `components/shared/AppNavigation.tsx` (navigation hover styles)
- `hooks/useReducedMotion.ts` (NEW - create hook for prefers-reduced-motion)

**Typography Audit (Feature 8):**
- `app/dashboard/page.tsx` (audit headings)
- `app/reflection/MirrorExperience.tsx` (audit labels)
- `app/reflections/[id]/page.tsx` (audit reflection content)
- `app/reflections/page.tsx` (audit collection headers)
- `app/dreams/page.tsx` (audit dream cards)
- `app/evolution/page.tsx` (audit report headings)
- `app/visualizations/page.tsx` (audit chart labels)

**Color Audit (Feature 9):**
- `app/**/*.tsx` (search for non-semantic color classes)
- `components/**/*.tsx` (search for hardcoded colors)
- `styles/globals.css` (verify semantic utilities used)

**Validation + QA (Features 10-13):**
- ALL pages (accessibility, performance, cross-browser, QA testing)
- Chrome DevTools (Lighthouse, Performance panel)
- Manual testing (keyboard, screen reader, browser matrix)

### Key Dependencies

**Animation System:**
- `framer-motion` v11.18.2 (already installed)
- `lib/animations/variants.ts` (extend with new variants)
- `lib/animations/hooks.ts` (useStaggerAnimation)

**Design System:**
- `styles/variables.css` (all CSS custom properties)
- `styles/globals.css` (semantic utilities: .text-h1, .text-body, etc.)
- `tailwind.config.ts` (Tailwind theme, mirrors CSS variables)

**Testing Tools:**
- Chrome DevTools (Lighthouse, Performance, Network)
- NVDA/VoiceOver (screen reader testing)
- Browser DevTools (Firefox, Safari, Edge)

### Testing Infrastructure

**Manual Testing (NO automation):**
- **Accessibility:** Keyboard nav, screen reader, contrast audit (Lighthouse)
- **Performance:** LCP, FID, bundle size, 60fps profiling
- **Cross-Browser:** Chrome, Firefox, Safari, Edge (manual load test)
- **Responsive:** 320px, 768px, 1024px, 1440px, 1920px (manual resize)

**Browser Targets:**
- Chrome 90+ (primary)
- Firefox 88+ (secondary)
- Safari 14+ (macOS/iOS)
- Edge 90+ (Windows)

**Device Targets:**
- Desktop: 1440px+ (primary)
- Laptop: 1024px (secondary)
- Tablet: 768px (tertiary)
- Mobile: 375px (iPhone 12/13/14)
- Small Mobile: 320px (iPhone SE)

---

## Questions for Planner

### 1. Should We Create Automated Test Infrastructure (Playwright)?

**Context:** Iteration 3 has NO automated tests. All validation is manual.

**Options:**
- **A. Manual only** (current scope - 30-44 hours)
- **B. Add Playwright E2E tests** (setup: +8 hours, 3 flows: +12 hours, total: +20 hours)

**Recommendation:** Manual only for Iteration 3. Defer test automation to post-MVP (separate iteration).

**Impact:** If automated: +20 hours setup + test writing.

### 2. Should We Set Up CI/CD Performance Monitoring (Lighthouse CI)?

**Context:** No continuous performance tracking. Builder runs Lighthouse manually.

**Options:**
- **A. Manual Lighthouse** (current scope - included in Feature 11)
- **B. Lighthouse CI in GitHub Actions** (setup: +4 hours, config: +2 hours)

**Recommendation:** Manual for Iteration 3. Defer CI/CD to post-MVP.

**Impact:** If automated: +6 hours setup.

### 3. What's the P0 Criteria for Iteration 3 Completion?

**Context:** 87 acceptance criteria is comprehensive. What's the minimum?

**Options:**
- **A. All 87 criteria must pass** (strict, may delay ship)
- **B. 3 critical user flows pass + P0 bugs fixed** (pragmatic, faster ship)

**Recommendation:** **Option B**. 3 user flows + P0 bugs = ship. P1/P2 bugs go to backlog.

**Impact:** Defines "done" for iteration. Option A adds unknown hours (bug fixes).

### 4. Should We Include Mobile Native Testing (iOS/Android)?

**Context:** Vision.md says "Mobile native apps" out of scope. But should we test mobile web?

**Options:**
- **A. Mobile web only** (iOS Safari, Chrome Android - responsive testing)
- **B. Skip mobile entirely** (desktop only)

**Recommendation:** **Option A**. Mobile web is in scope (responsive design). Test iOS Safari + Chrome Android.

**Impact:** Mobile web testing already included in cross-browser (no extra hours).

---

## Architecture Diagrams

### Iteration 3 Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   Iteration 3 Start                         │
│         (Design System Established, Core Features Done)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Builder-1: Visual Polish                      │
│                                                             │
│  Feature 7: Micro-Interactions (6-8 hours)                 │
│  - Add inputFocusVariants, cardPressVariants               │
│  - Apply to reflection form, dashboard cards               │
│  - Validate reduced motion support                         │
│                                                             │
│  Feature 8: Typography Audit (4-6 hours)                   │
│  - Audit 7 pages for semantic class usage                  │
│  - Replace arbitrary with .text-h1, .text-body, etc.       │
│  - Verify line-heights, reading widths                     │
│                                                             │
│  Feature 9: Color Audit (3-5 hours)                        │
│  - Find non-semantic color classes (grep search)           │
│  - Replace with semantic (text-semantic-success, etc.)     │
│  - Run Lighthouse contrast audit, fix violations           │
│                                                             │
│  Total: 13-19 hours (1.5-2.5 days)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│             Builder-2: Validation + QA                      │
│                                                             │
│  Feature 10: Accessibility (6-8 hours)                     │
│  - Keyboard navigation (Tab, Enter, Escape)                │
│  - Screen reader (NVDA/VoiceOver)                          │
│  - Contrast audit (Lighthouse)                             │
│  - Reduced motion (browser preference)                     │
│                                                             │
│  Feature 11: Performance (6-10 hours)                      │
│  - LCP measurement (Lighthouse, target <2.5s)              │
│  - FID measurement (Chrome DevTools, target <100ms)        │
│  - 60fps animation profiling (Performance panel)           │
│  - Bundle size analysis (npm run build)                    │
│                                                             │
│  Feature 12: Cross-Browser (8-12 hours)                    │
│  - Chrome, Firefox, Safari, Edge                           │
│  - 5 breakpoints (320px, 768px, 1024px, 1440px, 1920px)   │
│  - 3 critical user flows per browser                       │
│                                                             │
│  Feature 13: Final QA (10-14 hours)                        │
│  - 87 acceptance criteria from vision.md                   │
│  - 3 critical user flows (onboarding, engagement, evolution)│
│  - Regression testing (Dreams, Reflections, Evolution)     │
│  - Edge cases (empty, loading, error states)               │
│                                                             │
│  Total: 30-44 hours (4-5.5 days)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Iteration 3 Complete                       │
│              10/10 Product Quality Achieved                 │
└─────────────────────────────────────────────────────────────┘
```

### Animation System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              lib/animations/variants.ts                     │
│                                                             │
│  EXISTING VARIANTS:                                         │
│  - cardVariants (entrance + hover)                         │
│  - glowVariants (box-shadow transition)                    │
│  - staggerContainer + staggerItem (sequential fade)        │
│  - fadeInVariants, slideUpVariants                         │
│  - modalOverlayVariants, modalContentVariants              │
│                                                             │
│  NEW VARIANTS (Feature 7):                                  │
│  - inputFocusVariants (textarea focus glow) ← ADD          │
│  - cardPressVariants (card click scale-down) ← ADD         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Used by
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Components                              │
│                                                             │
│  MirrorExperience.tsx (reflection form)                    │
│  - Textarea: inputFocusVariants (focus glow)               │
│  - Character counter: Conditional className (no variant)   │
│                                                             │
│  DashboardCard.tsx (dashboard cards)                       │
│  - Card hover: cardVariants.hover + glowVariants.hover     │
│  - Card click: cardPressVariants.tap                       │
│                                                             │
│  All Pages (page transitions)                              │
│  - Page mount: fadeInVariants                              │
│  - Route change: CSS-based crossfade (Next.js)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Respects
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           hooks/useReducedMotion.ts (NEW)                   │
│                                                             │
│  export function useReducedMotion() {                       │
│    const [prefersReduced, setPrefersReduced] = useState(   │
│      window.matchMedia('(prefers-reduced-motion)').matches │
│    );                                                       │
│    return prefersReduced;                                   │
│  }                                                          │
│                                                             │
│  Usage:                                                     │
│  const prefersReduced = useReducedMotion();                 │
│  if (prefersReduced) return <StaticComponent />;            │
└─────────────────────────────────────────────────────────────┘
```

### Design System Audit Flow

```
┌─────────────────────────────────────────────────────────────┐
│                Typography Audit (Feature 8)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Identify Pages to Audit                                │
│  - app/dashboard/page.tsx                                  │
│  - app/reflection/MirrorExperience.tsx                     │
│  - app/reflections/[id]/page.tsx                           │
│  - app/reflections/page.tsx                                │
│  - app/dreams/page.tsx                                     │
│  - app/evolution/page.tsx                                  │
│  - app/visualizations/page.tsx                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Audit Checklist (Per Page)                             │
│  - [ ] h1 uses .text-h1 (not text-4xl)                     │
│  - [ ] h2 uses .text-h2 (not text-2xl)                     │
│  - [ ] h3 uses .text-h3 (not text-xl)                      │
│  - [ ] Body uses .text-body (leading-relaxed 1.75)         │
│  - [ ] Metadata uses .text-small or .text-tiny             │
│  - [ ] No hardcoded font-size/line-height                  │
│  - [ ] Reading width max 720px (long-form only)            │
│  - [ ] Contrast WCAG AA (95% white minimum)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Replace Violations                                     │
│  - Find: className="text-4xl font-bold"                    │
│  - Replace: className="text-h1"                            │
│                                                             │
│  - Find: style={{ fontSize: '32px' }}                      │
│  - Replace: className="text-h2"                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Validate with Lighthouse                                │
│  - Run accessibility audit                                  │
│  - Check contrast ratios (all text WCAG AA)                │
│  - Fix violations (increase opacity if needed)             │
└─────────────────────────────────────────────────────────────┘
```

### Color Audit Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Color Audit (Feature 9)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Search for Non-Semantic Colors                         │
│  $ grep -r "text-purple-" app/ components/                 │
│  $ grep -r "bg-blue-" app/ components/                     │
│  $ grep -r "border-red-" app/ components/                  │
│  $ grep -r "style={{ color:" app/ components/              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Map to Semantic Classes                                │
│  - text-purple-500 → text-mirror-amethyst                  │
│  - bg-blue-900 → bg-semantic-info-light                    │
│  - border-red-500 → border-semantic-error                  │
│  - style={{ color: '#8B5CF6' }} → className w/ var(--...)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Validate Semantic Usage                                │
│  - Purple/Amethyst: Primary actions, active states         │
│  - Gold: Success moments, positive stats                   │
│  - Blue: Information, calm actions                         │
│  - Red: Errors, warnings                                   │
│  - White/Gray: Text hierarchy (100%, 80%, 60%, 40%)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Run Lighthouse Contrast Audit                          │
│  - Check all text meets WCAG AA (4.5:1)                    │
│  - Fix violations: Increase opacity (60% → 70%)            │
│  - Document: 40% opacity FAILS WCAG (decorative only)      │
└─────────────────────────────────────────────────────────────┘
```

---

## File & Folder Structure Recommendations

### New Files Needed

**Feature 7 (Micro-Interactions):**
```
lib/animations/
  variants.ts                     ← EXTEND (add inputFocusVariants, cardPressVariants)
  
hooks/
  useReducedMotion.ts             ← NEW (check prefers-reduced-motion)
```

**Features 8-9 (Audits):**
```
(No new files - audit existing code)
```

**Features 10-13 (Validation + QA):**
```
.2L/plan-6/iteration-11/validation/
  qa-checklist.md                 ← NEW (87 acceptance criteria)
  accessibility-report.md         ← NEW (keyboard, screen reader, contrast results)
  performance-report.md           ← NEW (LCP, FID, bundle size, 60fps)
  cross-browser-report.md         ← NEW (Chrome, Firefox, Safari, Edge results)
  regression-report.md            ← NEW (Dreams, Reflections, Evolution validation)
```

### Directory Structure (Post-Iteration 3)

```
mirror-of-dreams/
├── lib/animations/
│   ├── variants.ts              ← ENHANCED (inputFocusVariants, cardPressVariants added)
│   ├── hooks.ts                 ← EXISTING (useStaggerAnimation)
│   └── config.ts                ← EXISTING
├── hooks/
│   ├── useReducedMotion.ts      ← NEW (Feature 7)
│   ├── useStaggerAnimation.ts
│   ├── useAuth.ts
│   └── useDashboard.ts
├── styles/
│   ├── variables.css            ← VALIDATED (typography, color audits)
│   ├── globals.css              ← VALIDATED (semantic utilities)
│   ├── dashboard.css
│   ├── reflection.css
│   └── reflection-display.css
├── app/
│   ├── dashboard/page.tsx       ← AUDITED (typography, color)
│   ├── reflection/
│   │   └── MirrorExperience.tsx ← ENHANCED (micro-interactions) + AUDITED
│   ├── reflections/
│   │   ├── page.tsx             ← AUDITED
│   │   └── [id]/page.tsx        ← AUDITED
│   ├── dreams/page.tsx          ← AUDITED
│   ├── evolution/page.tsx       ← AUDITED
│   └── visualizations/page.tsx  ← AUDITED
└── .2L/plan-6/iteration-11/validation/
    ├── qa-checklist.md          ← NEW (comprehensive QA)
    ├── accessibility-report.md  ← NEW
    ├── performance-report.md    ← NEW
    ├── cross-browser-report.md  ← NEW
    └── regression-report.md     ← NEW
```

---

## Entry Points and Boundaries

### Critical User Flows (QA Scope)

**Flow 1: New User Onboarding (First-Time Experience)**

**Entry:** `/auth/signin` (user signs in for first time)

**Steps:**
1. User signs in → Redirects to `/dashboard`
2. Dashboard shows empty states:
   - "Create your first dream" (no dreams)
   - "Your first reflection awaits" (no reflections)
   - Usage stats: 0 reflections this month
3. User clicks "Create Dream" → Modal/page opens
4. User creates dream → Returns to dashboard
5. Dashboard now shows 1 dream card (with 0 reflections)
6. User clicks "Reflect Now" → `/reflection` page
7. User fills 4 questions + selects tone → Clicks "Gaze into the Mirror"
8. Loading state: CosmicLoader (min 500ms, max 30s)
9. Success: Reflection output page shows AI response
10. User returns to dashboard → Sees 1 reflection in "Recent Reflections"

**Exit:** `/dashboard` (feels sense of progress)

**Validation Criteria:**
- Empty states inviting (not broken-looking)
- "Reflect Now" button disabled until dream created
- Reflection form smooth (no jarring transitions)
- Loading min 500ms (feels intentional, not rushed)
- Dashboard updates after reflection created

**Flow 2: Returning User Engagement (Daily Use)**

**Entry:** `/dashboard` (user signs in, has existing data)

**Steps:**
1. User sees personalized greeting: "Good evening, Ahiya!"
2. Dashboard shows:
   - Progress: "This month: 12 reflections, 3 dreams"
   - Active dreams: 3 dream cards (title, days remaining, reflection count)
   - Recent reflections: Last 3 with snippets (120 chars)
   - Evolution insights preview (if available)
3. User browses recent reflections
4. Clicks reflection card → `/reflections/[id]` page
5. Reads full reflection (centered 720px, markdown rendered)
6. Clicks "Back to Reflections" → `/reflections` collection page
7. Filters by specific dream (dropdown)
8. Sees only reflections for that dream
9. Clicks "Reflect on this dream" → `/reflection` (dreamId pre-filled)
10. Creates new reflection → Returns to dashboard

**Exit:** `/dashboard` (updated stats, new reflection in "Recent")

**Validation Criteria:**
- Dashboard feels complete (not empty)
- Reflection snippets visible (120 chars)
- Markdown renders correctly (headings, bold, lists)
- Filters work (show correct reflections)
- Dashboard updates after new reflection

**Flow 3: Evolution Unlock (4th Reflection Milestone)**

**Entry:** `/reflection` (user about to complete 4th reflection on a dream)

**Steps:**
1. User submits 4th reflection → Loading state
2. Reflection output appears (AI response)
3. Special message: "✨ You've unlocked Evolution Insights for [Dream Name]!"
4. CTA button: "View Your Evolution"
5. User clicks → `/evolution/[id]` page
6. Evolution report generates (loading state)
7. Report appears: Temporal analysis, growth patterns, quotes
8. User reads report (feels seen and understood)
9. Clicks "Back to Dashboard" → `/dashboard`
10. Dashboard shows evolution insights preview (snippet)

**Exit:** `/dashboard` (evolution badge on dream card)

**Validation Criteria:**
- Unlock message appears (not hidden)
- Evolution report generates successfully
- Report content meaningful (not generic)
- Dashboard shows evolution preview
- Dream card shows "Evolution available" badge

### Page Boundaries (All Pages)

**Common Boundaries (All Authenticated Pages):**
- **Authentication:** User must be signed in (redirects to `/auth/signin` if not)
- **Navigation:** AppNavigation fixed at top (z-index: 100, --nav-height)
- **Padding:** All pages use `.pt-nav` class (padding-top: var(--nav-height))
- **Background:** CosmicBackground component (fixed, z-index: -1)
- **Data:** tRPC queries (React Query caching, loading states)

**Dashboard (`/dashboard`):**
- **Entry:** User signs in OR clicks "Journey" nav link
- **Boundary:** Must be authenticated
- **Data:** 6 tRPC queries (dreams, reflections, usage stats, evolution, visualizations)
- **Exit:** Navigation to `/reflection`, `/dreams`, `/reflections`, `/evolution`, `/visualizations`

**Reflection Experience (`/reflection`):**
- **Entry:** "Reflect Now" button OR direct URL
- **URL Params:** `?dreamId={id}` (pre-select dream), `?id={id}` (view output)
- **Boundary:** Must be authenticated, must have at least 1 dream
- **Exit:** Submit → `/reflection?id={reflectionId}` (output view)

**Individual Reflection (`/reflections/[id]`):**
- **Entry:** Click reflection card from dashboard or collection
- **Boundary:** User must own reflection (403 if not)
- **Data:** Single reflection by ID (tRPC getById)
- **Exit:** "Back to Reflections" → `/reflections`

**Reflections Collection (`/reflections`):**
- **Entry:** Click "Reflections" nav link
- **Boundary:** Must be authenticated
- **URL Params:** `?page={n}`, `?search={query}`, `?tone={tone}`, `?sortBy={field}`
- **Exit:** Click card → `/reflections/[id]`, "New Reflection" → `/reflection`

---

## Builder Task Allocation (Recommendations)

### Iteration 3 Builder Breakdown

**Builder-1: Visual Polish & Audits (13-19 hours)**

**Feature 7: Micro-Interactions & Animations (6-8 hours)**
- Add `inputFocusVariants` to `lib/animations/variants.ts`
- Add `cardPressVariants` to `lib/animations/variants.ts`
- Create `hooks/useReducedMotion.ts` (check prefers-reduced-motion)
- Apply textarea focus glow in `app/reflection/MirrorExperience.tsx`
- Add character counter color logic (conditional className based on length)
- Apply card click feedback in `components/dashboard/cards/DashboardCard.tsx`
- Add CSS navigation hover transitions in `components/shared/AppNavigation.tsx`
- Validate reduced motion support (test with browser preference)

**Feature 8: Typography & Readability Audit (4-6 hours)**
- Audit 7 pages: dashboard, reflection, dreams, evolution, visualizations, reflections, reflections/[id]
- Replace arbitrary font classes with semantic (.text-h1, .text-h2, .text-body)
- Verify line-heights correct (1.75 for body, 1.25 for headings)
- Check reading widths (720px max for reflection content)
- Run Lighthouse accessibility audit (contrast validation)
- Fix any contrast violations (adjust opacity if needed)

**Feature 9: Color & Semantic Meaning Audit (3-5 hours)**
- Search codebase for non-semantic colors: `grep -r "text-purple-" app/`
- Replace with semantic classes (text-mirror-amethyst, text-semantic-success)
- Validate semantic usage (purple=primary, gold=success, blue=info, red=error)
- Run Lighthouse contrast audit
- Fix violations (increase opacity 60% → 70% if needed)
- Document: 40% opacity FAILS WCAG AA (decorative only)

**Builder-2: Validation & QA (30-44 hours)**

**Feature 10: Accessibility Validation (6-8 hours)**
- **Keyboard Navigation (2-3 hours):**
  - Tab through all pages (dashboard, reflection, dreams, evolution, visualizations)
  - Verify all interactive elements focusable (buttons, links, inputs, cards)
  - Check focus indicators visible (ring, outline, glow)
  - Validate tab order logical (top to bottom, left to right)
  - Test Escape key closes modals/dropdowns
  - Test Enter/Space activates buttons
- **Screen Reader (2-3 hours):**
  - Test with NVDA (Windows) or VoiceOver (Mac)
  - Verify all icons have ARIA labels
  - Check semantic HTML (h1-h6, nav, main, article)
  - Validate form inputs have labels
  - Test status messages announced (role="status", aria-live="polite")
- **Color Contrast (1 hour):**
  - Run Lighthouse accessibility audit on all pages
  - Fix violations (increase opacity, adjust colors)
  - Target: 100% WCAG AA compliance
- **Reduced Motion (1 hour):**
  - Set browser preference `prefers-reduced-motion: reduce`
  - Verify animations disabled (except opacity fades)
  - Test all pages with motion preference

**Feature 11: Performance Validation (6-10 hours)**
- **LCP Measurement (2-3 hours):**
  - Run Lighthouse on all pages
  - Identify slow pages (target: all <2.5s)
  - Check bundle sizes (analyze main-app.js, dashboard.js)
  - Implement code splitting if needed (dynamic imports)
- **FID Measurement (2-3 hours):**
  - Chrome DevTools Performance panel
  - Record page load + first interaction
  - Verify <100ms response time
  - Fix slow interactions (debounce, throttle)
- **Animation Profiling (2-3 hours):**
  - Record dashboard stagger animation
  - Record card hover animations
  - Record page transitions
  - Verify 60fps (green line in timeline)
  - Optimize slow animations (will-change CSS)
- **Bundle Size Analysis (1 hour):**
  - Run `npm run build`
  - Check output sizes
  - Verify -110KB budget maintained
  - Document any increases

**Feature 12: Cross-Browser & Responsive Testing (8-12 hours)**
- **Per Browser (2-3 hours each):**
  - Chrome (latest): Load all pages, test 3 user flows
  - Firefox (latest): Load all pages, test 3 user flows
  - Safari (latest): Load all pages, test 3 user flows (check backdrop-filter)
  - Edge (latest): Load all pages, test 3 user flows
- **Per Breakpoint (1-2 hours total):**
  - 320px (Mobile): Verify layout stacks, touch targets 44px min
  - 768px (Tablet): Verify grid adapts
  - 1024px (Laptop): Verify desktop nav, grid spacing
  - 1440px (Desktop): Verify content centered, max-widths
  - 1920px (Large): Verify no layout breakage
- **Edge Cases (2 hours):**
  - iOS Safari: Test fixed navigation, scroll behavior
  - Firefox: Test CSS grid gaps, font rendering
  - Edge: Test Framer Motion performance
  - Chrome Android: Test mobile web experience

**Feature 13: Final QA (10-14 hours)**
- **Smoke Test (4-6 hours):**
  - Test 87 acceptance criteria from vision.md
  - Use QA checklist: `.2L/plan-6/iteration-11/validation/qa-checklist.md`
  - Document results (pass/fail, screenshots if fail)
  - Prioritize bugs (P0, P1, P2)
- **3 Critical User Flows (3-4 hours):**
  - Flow 1: New user onboarding (create dream, first reflection)
  - Flow 2: Returning user engagement (browse reflections, create new)
  - Flow 3: Evolution unlock (4th reflection, view report)
  - Validate each step (no blockers, smooth transitions)
- **Regression Testing (2-3 hours):**
  - Dreams: Create, edit, archive (existing features)
  - Reflections: Create, view, filter (existing features)
  - Evolution: Generate report, view insights (existing features)
  - Visualizations: View charts (existing features)
- **Edge Cases (1-2 hours):**
  - Empty states: 0 dreams, 0 reflections, 0 evolution reports
  - Loading states: Slow network (throttle to Slow 3G)
  - Error states: API failure, network timeout, 404 reflection

---

## Success Criteria Validation

### How to Measure Success

**Feature 7: Micro-Interactions Feel Premium (9/10)**
- **Metric:** 60fps animations, <200ms perceived response time
- **Test:** Chrome DevTools Performance panel (record animations, verify green FPS line)
- **Pass:** All animations 60fps, no dropped frames, user reports "smooth"
- **Validation:** User feedback from Ahiya (creator): "Interactions feel polished"

**Feature 8: Typography is Beautiful (9/10)**
- **Metric:** WCAG AA contrast, optimal line lengths, clear hierarchy
- **Test:** Lighthouse accessibility audit (all pages 100% score), manual visual review
- **Pass:** All text readable, headings distinct, body text 1.75 line-height
- **Validation:** No arbitrary font-size values, all semantic classes used

**Feature 9: Color Semantics Consistent (8/10)**
- **Metric:** All colors from semantic palette, consistent usage
- **Test:** Codebase search (grep for non-semantic), Lighthouse contrast audit
- **Pass:** Zero arbitrary Tailwind colors, all text meets WCAG AA
- **Validation:** Purple=primary, Gold=success, Blue=info, Red=error (documented)

**Feature 10: Accessibility Maintained (WCAG AA)**
- **Metric:** Keyboard nav, screen reader, contrast, reduced motion
- **Test:** Manual testing (keyboard, NVDA/VoiceOver), Lighthouse audit
- **Pass:** 100% Lighthouse accessibility score, all interactive elements focusable
- **Validation:** Reduced motion disables animations (except opacity)

**Feature 11: Performance Budget Met**
- **Metric:** LCP <2.5s, FID <100ms, bundle size -110KB
- **Test:** Lighthouse, Chrome DevTools, npm run build output
- **Pass:** All pages LCP <2.5s, all interactions FID <100ms, bundle under budget
- **Validation:** 60fps animations (green line in Performance timeline)

**Feature 12: Cross-Browser Compatible**
- **Metric:** All features work on Chrome, Firefox, Safari, Edge
- **Test:** Manual load testing (all pages, 3 user flows per browser)
- **Pass:** Zero critical bugs (P0), visual consistency 95%+
- **Validation:** backdrop-filter works in Safari 14+, grid gaps in Firefox

**Feature 13: Overall Product Quality 10/10**
- **Metric:** Holistic assessment of polish, completeness, emotional resonance
- **Test:** 87 acceptance criteria (vision.md), 3 user flows, regression tests
- **Pass:** All P0 bugs fixed, 3 user flows pass, zero regressions
- **Validation:** User feedback: "Product feels finished, not in-progress"

---

## Limitations & Constraints

### What This Iteration Does NOT Include

**Explicitly Out of Scope (from vision.md):**
- New features (all features already built in Iterations 1-2)
- Backend changes (purely frontend polish + validation)
- Database migrations
- Email templates
- Marketing pages
- Admin dashboard (separate feature)
- Mobile native apps
- SEO optimization
- A/B testing infrastructure
- Analytics beyond basic tracking
- Payment/subscription changes
- Third-party integrations

**Testing Infrastructure (Deferred to Post-MVP):**
- Automated E2E tests (Playwright, Cypress)
- Automated visual regression tests (Percy, Chromatic)
- CI/CD performance monitoring (Lighthouse CI)
- Automated accessibility testing (axe-core, Pa11y)
- Unit tests (Jest, React Testing Library)

**Why Manual Testing Only:**
- Iteration 3 scope is validation, not infrastructure
- Test automation is separate effort (20+ hours setup)
- Manual testing sufficient for MVP ship criteria
- Post-MVP: Create dedicated test automation iteration

### Technical Constraints

**Browser Support:**
- Chrome 90+ (primary - 60% users)
- Firefox 88+ (secondary - 15% users)
- Safari 14+ (macOS/iOS - 20% users)
- Edge 90+ (Windows - 5% users)
- NO IE11 support

**Device Support:**
- Desktop: 1440px+ (primary use case)
- Laptop: 1024px+ (secondary)
- Tablet: 768px (tertiary, mobile web)
- Mobile: 375px+ (mobile web, not native app)

**Performance Budget:**
- LCP (Largest Contentful Paint): <2.5s (Lighthouse target)
- FID (First Input Delay): <100ms (Chrome UX Report target)
- Bundle Size: Keep increase <20KB (currently -110KB under budget)
- Animations: 60fps minimum (Chrome DevTools Performance)

**Accessibility:**
- WCAG 2.1 AA compliance (maintained from Iterations 1-2)
- Keyboard navigation (all interactive elements focusable)
- Screen reader support (ARIA labels, semantic HTML)
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Reduced motion: Disable animations (except opacity fades)

**Existing Libraries (no new dependencies):**
- framer-motion v11.18.2 (animations)
- react-markdown v10.1.0 (markdown parsing)
- remark-gfm v4.0.1 (GitHub Flavored Markdown)
- Next.js 14 (App Router)
- tRPC v10 (type-safe APIs)

---

## Final Recommendations Summary

### For Planner

1. **Allocate 2 Builders (Recommended):**
   - Builder-1: Visual Polish & Audits (Features 7, 8, 9) - 13-19 hours
   - Builder-2: Validation & QA (Features 10, 11, 12, 13) - 30-44 hours
   - Total: 43-63 hours (5.5-8 days for 2 builders in parallel)

2. **Create QA Checklist BEFORE Builder-2 Starts:**
   - File: `.2L/plan-6/iteration-11/validation/qa-checklist.md`
   - Contents: 87 acceptance criteria (checkbox format)
   - Purpose: Give builder-2 clear testing roadmap

3. **Define "Done" Criteria (P0 Bugs Only):**
   - 3 critical user flows pass (onboarding, engagement, evolution)
   - P0 bugs fixed (blocking issues)
   - P1/P2 bugs documented (backlog for post-MVP)
   - Performance budget met (LCP <2.5s, FID <100ms)
   - Accessibility maintained (WCAG AA)

4. **Document Validation Reports:**
   - Accessibility: `.2L/plan-6/iteration-11/validation/accessibility-report.md`
   - Performance: `.2L/plan-6/iteration-11/validation/performance-report.md`
   - Cross-Browser: `.2L/plan-6/iteration-11/validation/cross-browser-report.md`
   - Regression: `.2L/plan-6/iteration-11/validation/regression-report.md`

5. **Defer Test Automation to Post-MVP:**
   - No Playwright setup in Iteration 3
   - No CI/CD performance monitoring
   - Create separate iteration for test infrastructure (20+ hours)

### For Builder-1 (Visual Polish)

**Feature 7: Micro-Interactions**
- Add `inputFocusVariants`, `cardPressVariants` to `lib/animations/variants.ts`
- Create `hooks/useReducedMotion.ts` (check prefers-reduced-motion)
- Apply to reflection form (textarea focus), dashboard cards (click feedback)
- Test all animations at 60fps (Chrome DevTools Performance)

**Feature 8: Typography Audit**
- Audit 7 pages, replace arbitrary with semantic classes
- Verify line-heights, reading widths, contrast ratios
- Run Lighthouse accessibility audit, fix violations

**Feature 9: Color Audit**
- Search for non-semantic colors (grep), replace with semantic
- Run Lighthouse contrast audit, fix violations (adjust opacity)

### For Builder-2 (Validation & QA)

**Feature 10: Accessibility**
- Manual keyboard nav (Tab, Enter, Escape), screen reader (NVDA/VoiceOver)
- Lighthouse contrast audit, reduced motion test
- Document results in `accessibility-report.md`

**Feature 11: Performance**
- Lighthouse LCP/FID, Chrome DevTools animation profiling
- Bundle size analysis, code splitting if needed
- Document results in `performance-report.md`

**Feature 12: Cross-Browser**
- Test Chrome, Firefox, Safari, Edge (manual load)
- Test 5 breakpoints, 3 user flows per browser
- Document results in `cross-browser-report.md`

**Feature 13: Final QA**
- Test 87 acceptance criteria (qa-checklist.md)
- Test 3 critical user flows, regression tests
- Prioritize bugs (P0, P1, P2), document in `qa-checklist.md`

---

## Conclusion

Mirror of Dreams is **production-ready for systematic polish and validation**. Iteration 3 (global iteration 11) is a **manual testing and refinement phase**, not a feature-building phase. The architecture is stable, patterns are established, and the scope is clear.

**Key Architectural Insights:**
1. **Animation System Mature:** Framer Motion variants established, need 2 new variants (inputFocus, cardPress)
2. **Design System Solid:** Typography and color systems defined, need systematic audit enforcement
3. **Testing Infrastructure Missing:** No automated tests, all validation is manual (30-44 hours)
4. **3 Critical User Flows:** Onboarding, Engagement, Evolution - these define QA success
5. **Performance Budget:** LCP <2.5s, FID <100ms, 60fps animations - all achievable

**Critical Path:**
1. Builder-1 polish (micro-interactions, typography, color) - 13-19 hours
2. Builder-2 validation (accessibility, performance, cross-browser, QA) - 30-44 hours
3. P0 bug fixes (unknown hours, likely 4-8 hours)
4. Ship when: 3 user flows pass, P0 bugs fixed, performance budget met

**Estimated Total Effort:** 43-63 hours (5.5-8 days for 2 builders in parallel)

The architecture is ready. The patterns are proven. The builders can execute with confidence. This is the **final polish to achieve 10/10 product quality**.

---

**Report Status:** COMPLETE  
**Next Step:** Planner synthesizes with Explorer-2 reports for master iteration plan  
**Builder Readiness:** HIGH (clear scope, established patterns, comprehensive QA checklist)
