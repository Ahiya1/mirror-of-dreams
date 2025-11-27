# Builder Task Breakdown - Iteration 9

**Iteration:** 9 (Global)
**Plan:** plan-6
**Phase:** Foundation & Infrastructure
**Last Updated:** 2025-11-27

---

## Overview

**3 primary builders** will work on Iteration 9 with a **SEQUENTIAL MERGE workflow** to prevent conflicts.

**Total Estimated Hours:** 18-24 hours (3-4 days)

**Builder Execution Order:**
1. **Builder-1** (Navigation + Spacing) - BLOCKING - Must merge first
2. **Builder-2** (Typography + Color) - Can work in parallel, merges second
3. **Builder-3** (Enhanced Empty States) - Depends on Builder-1 merge

**Merge Strategy:** Sequential (1 → 2 → 3) to prevent shared file conflicts (variables.css, patterns.md)

---

## Builder-1: Navigation Overlap Fix + Spacing System Foundation

### Scope

Fix the BLOCKING navigation overlap issue where AppNavigation (fixed position) obscures page content, and establish spacing system documentation as foundation for all future work.

**This is the highest-priority, most critical task in Iteration 9.** All subsequent dashboard richness and reflection depth work depends on navigation being fixed.

### Complexity Estimate

**HIGH** - Requires JavaScript measurement, CSS variable implementation, testing across 8+ pages at 5 breakpoints, mobile menu considerations.

**Recommend:** Single builder, no split (tightly coupled work). Estimated 6-8 hours.

### Success Criteria

- [ ] `--nav-height` CSS variable created in variables.css (matches AppNavigation actual height)
- [ ] `.pt-nav` utility class added to globals.css (uses `--nav-height` variable)
- [ ] JavaScript height measurement implemented in AppNavigation component
- [ ] Dashboard page: content fully visible below navigation (no overlap)
- [ ] Dreams page: content fully visible below navigation
- [ ] Reflections page: content fully visible below navigation
- [ ] Evolution page: content fully visible below navigation
- [ ] Visualizations page: content fully visible below navigation
- [ ] Reflection creation page: MirrorExperience component has proper padding
- [ ] Mobile (320px): Hamburger menu doesn't obscure content when open/closed
- [ ] Tablet (768px): Navigation spacing optimal (no gap, no overlap)
- [ ] Desktop (1440px+): Navigation spacing optimal
- [ ] Zero visual jump when scrolling (padding exactly matches nav height)
- [ ] Navigation padding pattern documented in patterns.md (with testing checklist)
- [ ] Spacing system semantic usage documented in patterns.md

### Files to Create

- `.2L/plan-6/iteration-9/plan/patterns.md` (navigation section) - ADD YOUR SECTION
- Test screenshots: `before-nav-fix/` and `after-nav-fix/` directories (for validation)

### Files to Modify

**Primary ownership:**

1. **`styles/variables.css`** (line ~260)
   - Add `--nav-height: clamp(60px, 8vh, 80px);` variable
   - Document spacing scale semantic usage (comment block)

2. **`styles/globals.css`** (after existing utilities)
   - Add `.pt-nav { padding-top: var(--nav-height); }` utility class

3. **`components/shared/AppNavigation.tsx`** (add height measurement)
   - Add `data-nav-container` attribute to root element
   - Add `useEffect` hook for height measurement
   - Re-measure on resize (debounced) and mobile menu toggle

4. **`app/dashboard/page.tsx`**
   - Update main content wrapper to use `.pt-nav` class

5. **`app/dreams/page.tsx`**
   - Update main content wrapper to use `.pt-nav` class (already has it, verify it works)

6. **`app/reflections/page.tsx`**
   - Update main content wrapper to use `.pt-nav` class

7. **`app/evolution/page.tsx`**
   - Update main content wrapper to use `.pt-nav` class (already has it, verify it works)

8. **`app/visualizations/page.tsx`**
   - Update main content wrapper to use `.pt-nav` class (already has it, verify it works)

9. **`app/reflection/page.tsx`**
   - Check if MirrorExperience component needs `.pt-nav` class (it delegates layout)
   - May need to modify MirrorExperience component (not examined by explorers)

### Dependencies

**Depends on:** None (first task, no blockers)

**Blocks:**
- Builder-3 (Enhanced Empty States) - needs navigation-fixed pages for proper testing
- Iteration 10 (Dashboard richness) - requires accurate page layouts

### Implementation Notes

#### Step 1: Add CSS Variable (FIRST)

```css
/* styles/variables.css - Add at line ~260 (Component Specific section) */

/* Navigation */
--nav-height: clamp(60px, 8vh, 80px);  /* Default fallback, dynamically set by JS */
```

**Why clamp():**
- Matches AppNavigation responsive height calculation
- Provides fallback if JavaScript fails
- Responsive: 60px (mobile) → 80px (desktop)

#### Step 2: Add Utility Class

```css
/* styles/globals.css - Add after existing utilities */

/* Navigation Compensation */
.pt-nav {
  padding-top: var(--nav-height);
}
```

**Alternative:** Add to tailwind.config.ts instead (see patterns.md for both options). Recommendation: globals.css for consistency.

#### Step 3: Implement JavaScript Height Measurement

```typescript
// components/shared/AppNavigation.tsx

'use client';

import { useEffect, useState } from 'react';

export function AppNavigation({ currentPage, onRefresh }: AppNavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Measure navigation height and set CSS variable
  useEffect(() => {
    const measureNavHeight = () => {
      const nav = document.querySelector('[data-nav-container]');
      if (nav) {
        const height = nav.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--nav-height', `${height}px`);
      }
    };

    // Measure on mount
    measureNavHeight();

    // Re-measure on resize (debounced)
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureNavHeight, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [showMobileMenu]); // Re-measure when mobile menu toggles

  return (
    <GlassCard
      elevated
      data-nav-container  // ADD THIS ATTRIBUTE
      className="fixed top-0 left-0 right-0 z-[100] rounded-none border-b border-white/10"
    >
      {/* Rest of navigation component */}
    </GlassCard>
  );
}
```

**Key Points:**
- `data-nav-container` attribute for querySelector
- Measure on mount + resize (debounced 150ms)
- Re-measure when mobile menu toggles (height changes)
- Use `documentElement.style.setProperty()` to set CSS variable

#### Step 4: Update All Pages

**Pattern for ALL pages:**

```typescript
// app/[page]/page.tsx

export default function PageName() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AppNavigation currentPage="page-name" />

      {/* Add pt-nav class to main content wrapper */}
      <main className="pt-nav px-4 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Page content */}
        </div>
      </main>
    </div>
  );
}
```

**Pages to update:**
- Dashboard, Dreams, Reflections, Evolution, Visualizations (all similar pattern)
- Reflection creation: check if MirrorExperience handles padding internally

#### Step 5: Document Spacing System

**Add to patterns.md (your section):**

```markdown
## Spacing System Pattern

### Semantic Usage Guide

| Variable | Mobile | Desktop | Use Case | Example |
|----------|--------|---------|----------|---------|
| `--space-xs` | 8px | 12px | Tight spacing | Icon + label gap |
| `--space-sm` | 12px | 16px | Related items | List item spacing |
| `--space-md` | 16px | 24px | Component padding | Input padding |
| `--space-lg` | 24px | 32px | Section spacing | Between sections |
| `--space-xl` | 32px | 48px | Card padding | GlassCard default |
| `--space-2xl` | 48px | 64px | Major breaks | Grid gaps |
| `--space-3xl` | 64px | 96px | Page sections | Header to content |

### Usage Examples

[Copy from patterns.md template - spacing section]
```

See full patterns.md file for complete documentation template.

### Testing Requirements

#### Automated Testing: None (manual testing only)

#### Manual Testing Checklist (CRITICAL - DO NOT SKIP)

**Test ALL 6+ pages at ALL 5 breakpoints:**

**Breakpoints:**
- 320px (mobile portrait)
- 768px (tablet portrait)
- 1024px (laptop)
- 1440px (desktop)
- 1920px (large desktop)

**Per Page Checklist:**

```markdown
## Page: Dashboard

### Visual Verification
- [ ] 320px: Content visible, no overlap, mobile menu works
- [ ] 768px: Content visible, smooth transition from mobile
- [ ] 1024px: Content visible, desktop layout starts
- [ ] 1440px: Content visible, optimal spacing
- [ ] 1920px: Content visible, max nav height maintained

### Navigation Behavior
- [ ] No gap between nav and content (padding exactly matches height)
- [ ] No content obscured by nav when scrolling
- [ ] Mobile menu doesn't overlap content when open
- [ ] Smooth scroll (no jump when nav becomes sticky)

### Screenshots
- [ ] BEFORE screenshot taken (baseline)
- [ ] AFTER screenshot taken (comparison)
- [ ] No unintended layout changes (git diff visual check)
```

**Repeat for:** Dreams, Reflections, Evolution, Visualizations, Reflection creation

#### Real Device Testing (HIGH PRIORITY)

**Test on actual devices:**
- [ ] iPhone SE (small mobile, iOS Safari)
- [ ] iPad (tablet, iOS Safari)
- [ ] Android phone (Chrome Mobile)

**Why real devices:**
- Browser DevTools emulation isn't perfect for mobile menu
- Actual touch interactions may reveal issues
- Mobile Safari sometimes handles fixed positioning differently

#### Visual Debug Overlay (Optional but Recommended)

Add temporarily to verify nav height = padding:

```typescript
{/* DEBUG: Visual overlay - REMOVE before merging */}
<div
  className="fixed top-0 left-0 right-0 pointer-events-none z-[9999] border-2 border-red-500"
  style={{
    height: 'var(--nav-height)',
    background: 'rgba(255, 0, 0, 0.1)',
  }}
>
  <span className="text-red-500 text-xs">Nav space (should align exactly)</span>
</div>
```

If red overlay exactly matches navigation height, padding is correct.

### Patterns to Follow

**From patterns.md:**
- Navigation Padding Pattern (full implementation guide)
- Spacing System Pattern (semantic usage)
- Responsive Design Pattern (breakpoint testing)

**Key Principles:**
- DRY: One source of truth (--nav-height variable)
- Responsive: Nav height adapts, padding follows automatically
- Maintainable: Change nav height in one place, all pages update

### Potential Issues & Gotchas

**Issue 1: Mobile Menu Height Calculation**

**Problem:** Mobile menu height is dynamic (varies when open/closed)

**Solution:**
- Re-measure height when `showMobileMenu` state changes (dependency in useEffect)
- Mobile menu is INSIDE the fixed nav container (shouldn't cause page shift)
- Test both states: menu closed, menu open

**Issue 2: SSR vs Client-Side Measurement**

**Problem:** JavaScript measurement only runs on client, SSR uses CSS fallback

**Solution:**
- CSS variable has fallback value (`clamp(60px, 8vh, 80px)`)
- Client-side measurement overrides with exact value
- Minimal flash on first render (acceptable)

**Issue 3: Resize Event Performance**

**Problem:** Measuring on every resize event can cause performance issues

**Solution:**
- Debounce resize handler (150ms delay)
- Cleanup timer in useEffect return function
- Only measure when necessary (not on scroll)

**Issue 4: Tailwind Purge Removing .pt-nav**

**Problem:** Tailwind may purge `.pt-nav` class if not detected in content

**Solution:**
- Add to `safelist` in tailwind.config.ts if needed:
  ```typescript
  safelist: ['pt-nav']
  ```
- OR ensure class is used in at least one scanned file

### Expected Output

**After completion:**
- All pages have visible content (no navigation overlap)
- Mobile menu works without obscuring content
- Padding exactly matches navigation height (no gap, no overlap)
- Pattern documented in patterns.md for future pages
- Screenshots captured (before/after) for validation
- Ready for Builder-2 and Builder-3 to start work

### Time Estimate

**6-8 hours:**
- CSS variable + utility class: 30 minutes
- JavaScript measurement implementation: 1 hour
- Update 6+ pages: 2 hours
- Testing (5 breakpoints × 6 pages): 2-3 hours
- Real device testing: 1 hour
- Documentation + screenshots: 1 hour

**Critical Path:** Testing is most time-consuming but CANNOT be skipped.

---

## Builder-2: Typography & Color Semantic Audit + Documentation

### Scope

Audit and document the existing typography hierarchy and color semantic system. NO value changes, purely systematic documentation and verification of WCAG AA compliance.

This establishes the design system foundation that Builder-3 (Empty States) and Iteration 10 (Dashboard/Reflection polish) will follow.

### Complexity Estimate

**MEDIUM** - Systematic but tedious work. Must review all pages for typography/color usage, verify contrast ratios, document patterns.

**Recommend:** Single builder (systematic audit work). Estimated 6-8 hours.

### Success Criteria

- [ ] Typography hierarchy documented in patterns.md (h1 → body, with examples)
- [ ] All pages use consistent heading hierarchy (h1 → h2 → h3)
- [ ] Line heights optimal for readability (1.75-1.8 for reflection content)
- [ ] Reading widths documented (720px max for reflection content)
- [ ] Responsive typography behavior documented (automatic scaling via clamp)
- [ ] Color semantic palette documented in patterns.md (mirror.* usage guide)
- [ ] All semantic colors audited (purple/amethyst, gold, success, warning, error, info)
- [ ] WCAG AA contrast verified on all pages (Lighthouse audit)
- [ ] Text opacity standards documented (95%, 80%, 60-70%, 40%)
- [ ] Muted text opacity adjusted if needed (60% → 70% for WCAG AA)
- [ ] Color usage patterns documented (when to use each semantic color)
- [ ] No arbitrary Tailwind colors found (all use mirror.* palette)

### Files to Create

- `.2L/plan-6/iteration-9/plan/patterns.md` (typography + color sections) - ADD YOUR SECTIONS
- `audit-report.md` - Document findings (optional but recommended)

### Files to Modify

**Primary ownership:**

1. **`styles/variables.css`** (DOCUMENT ONLY - no value changes unless WCAG fails)
   - Add comment blocks explaining typography scale
   - Add comment blocks explaining color palette
   - If WCAG AA fails: Adjust `--cosmic-text-muted` from 0.6 → 0.7

2. **`styles/globals.css`** (DOCUMENT ONLY)
   - Add comments explaining utility classes (.text-h1, .text-body, etc.)
   - Add comments explaining color classes (.text-mirror-success, etc.)

3. **`.2L/plan-6/iteration-9/plan/patterns.md`**
   - Add Typography Pattern section (copy from template + customize)
   - Add Color Semantic Pattern section (copy from template + customize)

4. **Page files (AUDIT ONLY - fix if inconsistencies found):**
   - `app/dashboard/page.tsx`
   - `app/dreams/page.tsx`
   - `app/reflections/page.tsx`
   - `app/evolution/page.tsx`
   - `app/visualizations/page.tsx`

### Dependencies

**Depends on:** None (can work in parallel with Builder-1)

**Blocks:** None (documentation work doesn't block other builders)

**Coordination:** Merges AFTER Builder-1 to avoid conflicts in patterns.md

### Implementation Notes

#### Step 1: Typography Hierarchy Audit

**Audit process:**

```bash
# Find all heading usage
grep -r "className.*text-h[123]" app/ components/

# Find all body text usage
grep -r "className.*text-body" app/ components/

# Find arbitrary text sizes (should use utility classes instead)
grep -r "className.*text-\[" app/ components/  # Custom sizes
grep -r "text-base\|text-lg\|text-xl" app/     # Tailwind defaults (should use utilities)
```

**Check each page:**
1. Does it have a h1 heading? (should use `.text-h1`)
2. Are section headings h2? (should use `.text-h2`)
3. Are subsection headings h3? (should use `.text-h3`)
4. Is body text using `.text-body`?
5. Is small text using `.text-body-sm` or `.text-caption`?

**Expected findings:**
- Most pages already use utility classes (established in previous iterations)
- Some pages may use arbitrary Tailwind classes (text-lg, text-xl)
- Dashboard may have inconsistencies (was built early)

**Fix process (if needed):**

```typescript
// BEFORE (inconsistent)
<h1 className="text-3xl font-bold">Title</h1>
<p className="text-base">Body text</p>

// AFTER (consistent with design system)
<h1 className="text-h1 gradient-text-cosmic">Title</h1>
<p className="text-body text-white/80">Body text</p>
```

#### Step 2: WCAG AA Contrast Audit

**Use Lighthouse:**

1. Open Chrome DevTools
2. Run Lighthouse audit on each page
3. Check "Accessibility" section
4. Look for contrast failures (target: 100% pass)

**Expected findings:**
- Muted text (60% opacity) may fail WCAG AA on dark background
- Very muted text (40% opacity) will definitely fail
- Headings (95% opacity) should pass

**Fix if needed:**

```css
/* styles/variables.css */

/* BEFORE */
--cosmic-text-muted: rgba(255, 255, 255, 0.6);  /* May fail WCAG AA */

/* AFTER (if audit reveals failure) */
--cosmic-text-muted: rgba(255, 255, 255, 0.7);  /* Should pass WCAG AA */
```

**Verify contrast ratios:**
- Normal text (18px): 4.5:1 minimum
- Large text (24px+): 3:1 minimum
- UI components: 3:1 minimum

**Online tools (if Lighthouse insufficient):**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Use #020617 (--cosmic-bg) as background color

#### Step 3: Color Semantic Audit

**Audit process:**

```bash
# Find all color usage
grep -r "text-mirror-" app/ components/   # Semantic usage (CORRECT)
grep -r "bg-mirror-" app/ components/     # Semantic usage (CORRECT)
grep -r "border-mirror-" app/ components/ # Semantic usage (CORRECT)

# Find non-semantic colors (should migrate to mirror.*)
grep -r "text-green\|text-blue\|text-red\|text-yellow" app/ components/
grep -r "bg-green\|bg-blue\|bg-red\|bg-yellow" app/ components/
grep -r "border-green\|border-blue\|border-red\|border-yellow" app/ components/
```

**Expected findings:**
- Most components already use mirror.* palette
- Some dashboard cards may use arbitrary Tailwind colors
- Some error messages may use text-red-500 instead of text-mirror-error

**Document findings (don't fix in Iteration 9 unless critical):**

```markdown
## Color Audit Findings

### Semantic Usage (CORRECT)
- Dashboard: Uses mirror-amethyst for primary actions ✓
- Success messages: Uses mirror-success (green) ✓
- Error messages: Uses mirror-error (red) ✓

### Non-Semantic Usage (NEEDS MIGRATION)
- ReflectionCard: Uses text-green-400 (should be text-mirror-success)
- DreamBadge: Uses bg-purple-600 (should be bg-mirror-amethyst)
- WarningMessage: Uses text-yellow-500 (should be text-mirror-warning)

### Migration Plan
- Create task for Iteration 10 to migrate non-semantic colors
- Priority: LOW (cosmetic, not blocking)
```

**Recommendation:** Document findings, create migration plan for future iteration. Only fix critical issues in Iteration 9.

#### Step 4: Document in patterns.md

**Add Typography Pattern section:**

```markdown
## Typography Pattern

### Hierarchy (Already Established - DOCUMENT, DON'T CHANGE)

**Existing utility classes:**

```css
.text-h1 {
  font-size: var(--text-4xl);       /* 35-48px */
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}
// ... etc
```

[Full template in patterns.md]
```

**Add Color Semantic Pattern section:**

```markdown
## Color Semantic Pattern

### Semantic Palette

**Mirror color palette:**

- Purple/Amethyst: Primary actions, emphasis
- Gold: Success moments, highlights
- Green: Success states
- Red: Errors, warnings
- Blue: Information, calm actions

[Full template in patterns.md]
```

See patterns.md file for complete documentation template.

### Testing Requirements

#### Automated Testing

**Lighthouse accessibility audit (CRITICAL):**

Run on ALL pages:
- [ ] Dashboard: 100% accessibility score (or document failures)
- [ ] Dreams: 100% accessibility score
- [ ] Reflections: 100% accessibility score
- [ ] Evolution: 100% accessibility score
- [ ] Visualizations: 100% accessibility score

**Command (if Lighthouse CLI available):**
```bash
npx lighthouse http://localhost:3000/dashboard --only-categories=accessibility --output=html --output-path=./lighthouse-dashboard.html
```

**Manual verification:**
- All contrast failures documented
- All heading hierarchy issues documented
- All ARIA issues documented (if any)

#### Manual Testing

**Typography consistency:**
- [ ] All h1 headings use `.text-h1` (or equivalent)
- [ ] All h2 headings use `.text-h2`
- [ ] All body text uses `.text-body`
- [ ] Reading widths optimal (max 720px for reflection content)

**Color consistency:**
- [ ] Primary actions use mirror-amethyst (purple)
- [ ] Success states use mirror-success (green)
- [ ] Errors use mirror-error (red)
- [ ] Information uses mirror-info (blue)

### Patterns to Follow

**From patterns.md:**
- Typography Pattern (hierarchy, usage examples)
- Color Semantic Pattern (when to use each color)
- Accessibility Pattern (WCAG AA compliance)

### Potential Issues & Gotchas

**Issue 1: WCAG AA Failures Not Obvious**

**Problem:** Text may look readable but fail automated contrast checks

**Solution:**
- Trust Lighthouse (automated tools are more accurate than human eye)
- Test on multiple monitors (some displays have better contrast)
- If unsure, use WebAIM Contrast Checker with exact hex codes

**Issue 2: Typography Inconsistencies Across Pages**

**Problem:** Different pages built at different times may use different patterns

**Solution:**
- Document findings, don't force-fix everything in Iteration 9
- Create consistency roadmap for future iterations
- Focus on documenting correct patterns, not enforcing everywhere

**Issue 3: Color Migration Scope Creep**

**Problem:** Easy to start "fixing" all non-semantic colors, expanding scope

**Solution:**
- DOCUMENT findings, don't migrate in Iteration 9
- Iteration 9 scope is FOUNDATION (documentation)
- Color migration is Iteration 10+ work (systematic polish)

### Expected Output

**After completion:**
- Typography hierarchy documented with examples
- Color semantic palette documented with usage guide
- WCAG AA compliance verified (or failures documented)
- All findings documented for future iterations
- Patterns.md sections complete (typography + color)
- Ready for Builder-3 to use patterns in EmptyState work

### Time Estimate

**6-8 hours:**
- Typography audit (all pages): 2 hours
- WCAG AA contrast audit (Lighthouse): 1 hour
- Color semantic audit (grep + review): 2 hours
- Fix critical issues (if any): 1-2 hours
- Documentation (patterns.md): 2 hours

---

## Builder-3: Enhanced Empty States Across App

### Scope

Enhance the existing EmptyState component with optional props (illustration, progress indicator, variant) and deploy consistent empty state variants across all app pages.

This creates inviting, informative empty states that guide users toward action when they have no data.

### Complexity Estimate

**MEDIUM** - Component enhancement is straightforward (add optional props), deployment across pages is systematic.

**Recommend:** Single builder. Estimated 4-6 hours.

### Success Criteria

- [ ] EmptyState component enhanced with new optional props (backwards compatible)
- [ ] Props added: `illustration?`, `progress?`, `variant?`, `className?`
- [ ] Dashboard empty state (no dreams): "Create your first dream to begin your journey"
- [ ] Dashboard empty state (no reflections): "Your first reflection awaits"
- [ ] Dreams page empty state: "Dreams are the seeds of transformation"
- [ ] Reflections page empty state: "Reflection is how you water your dreams"
- [ ] Evolution page empty state: "Evolution insights unlock after 4 reflections" with progress (0/4)
- [ ] Visualizations page empty state: "Visualizations appear after 4 reflections on a dream"
- [ ] All empty states use consistent spacing (p-xl for default, p-lg for compact)
- [ ] All empty states have cosmic emoji or illustration
- [ ] Copy is warm, inviting, and action-oriented (not demanding)
- [ ] EmptyState usage pattern documented in patterns.md

### Files to Create

- `.2L/plan-6/iteration-9/plan/patterns.md` (EmptyState section) - ADD YOUR SECTION

### Files to Modify

**Primary ownership:**

1. **`components/shared/EmptyState.tsx`** (enhance with new props)
   - Add optional props: `illustration?`, `progress?`, `variant?`, `className?`
   - Implement progress indicator rendering (if progress prop provided)
   - Implement variant sizing (default vs compact)
   - Maintain backwards compatibility (all new props optional)

2. **`app/dashboard/page.tsx`** (deploy empty states)
   - No dreams empty state
   - No reflections empty state

3. **`app/dreams/page.tsx`** (update existing empty state)
   - Verify existing empty state, update copy if needed

4. **`app/reflections/page.tsx`** (deploy empty state)
   - No reflections empty state

5. **`app/evolution/page.tsx`** (update existing empty state)
   - Add progress indicator (shows X/4 reflections)

6. **`app/visualizations/page.tsx`** (update existing empty state)
   - Verify existing empty state, update copy if needed

7. **`.2L/plan-6/iteration-9/plan/patterns.md`**
   - Add EmptyState Component Pattern section

### Dependencies

**Depends on:**
- Builder-1 (Navigation fix) - Needs navigation-fixed pages for accurate empty state positioning

**Blocks:** None (last builder in sequence)

**Coordination:** Merges AFTER Builder-1 and Builder-2

### Implementation Notes

#### Step 1: Enhance EmptyState Component

**File:** `components/shared/EmptyState.tsx`

**Add new props (OPTIONAL - backwards compatible):**

```typescript
interface EmptyStateProps {
  // Existing (keep as-is)
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;

  // NEW (all optional)
  illustration?: React.ReactNode;  // Custom SVG/image (instead of icon)
  progress?: {
    current: number;               // e.g., 2
    total: number;                 // e.g., 4
    label: string;                 // e.g., 'reflections'
  };
  variant?: 'default' | 'compact'; // Size variant
  className?: string;              // Additional classes
}
```

**Full implementation:**

See patterns.md → EmptyState Component Pattern section for complete code.

**Key changes:**
- Conditional rendering: `illustration` OR `icon` (not both)
- Progress indicator: Renders if `progress` prop provided (fraction + progress bar)
- Variant sizing: `default` (50vh min-height, max-w-md) vs `compact` (30vh, max-w-sm)
- Additional classes: Merge `className` prop with base classes (using `cn()` utility)

#### Step 2: Deploy to Dashboard

**File:** `app/dashboard/page.tsx`

**Empty state 1: No dreams**

```typescript
import { EmptyState } from '@/components/shared/EmptyState';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { data: dreams } = trpc.dreams.getAll.useQuery();

  if (!dreams || dreams.length === 0) {
    return (
      <main className="pt-nav px-4 sm:px-8 pb-8">
        <EmptyState
          icon="✨"
          title="Create your first dream to begin your journey"
          description="Dreams are the seeds of transformation. Start your reflection practice by creating a dream you'd like to manifest."
          ctaLabel="Create your first dream"
          ctaAction={() => router.push('/dreams/create')}
        />
      </main>
    );
  }

  // ... rest of dashboard
}
```

**Empty state 2: No reflections (within dashboard, different component)**

Check if dashboard has separate "Recent Reflections" section that needs empty state. If yes, deploy there as well.

#### Step 3: Deploy to Dreams Page

**File:** `app/dreams/page.tsx`

**Verify existing empty state, update copy if needed:**

```typescript
if (dreams.length === 0) {
  return (
    <EmptyState
      icon="🌟"
      title="Dreams are the seeds of transformation"
      description="Create your first dream to begin your journey of self-reflection and manifestation."
      ctaLabel="Create your first dream"
      ctaAction={() => router.push('/dreams/create')}
    />
  );
}
```

**Check:**
- Icon is cosmic-themed (✨, 🌟, 💫)
- Title is inspiring, not demanding
- Description explains what dreams are
- CTA is clear and action-oriented

#### Step 4: Deploy to Reflections Page

**File:** `app/reflections/page.tsx`

**No reflections empty state:**

```typescript
if (reflections.length === 0) {
  return (
    <EmptyState
      icon="💭"
      title="Reflection is how you water your dreams"
      description="Your reflection journey begins here. Take a moment to gaze into the mirror and explore your inner landscape."
      ctaLabel="Reflect now"
      ctaAction={() => router.push('/reflection')}
    />
  );
}
```

#### Step 5: Deploy to Evolution Page (WITH PROGRESS)

**File:** `app/evolution/page.tsx`

**Not enough reflections empty state:**

```typescript
const reflectionCount = 2; // Get from tRPC query
const minReflections = 4;

if (reflectionCount < minReflections) {
  return (
    <EmptyState
      icon="🌱"
      title="Your evolution story unfolds after 4 reflections"
      description="Evolution insights reveal patterns and growth across your reflections. Keep reflecting to unlock this feature."
      progress={{
        current: reflectionCount,
        total: minReflections,
        label: 'reflections'
      }}
      ctaLabel="Create a reflection"
      ctaAction={() => router.push('/reflection')}
    />
  );
}
```

**Key feature:** Progress indicator shows "2 / 4 reflections" with progress bar.

#### Step 6: Deploy to Visualizations Page

**File:** `app/visualizations/page.tsx`

**No visualizations empty state:**

```typescript
if (!hasEnoughReflections) {
  return (
    <EmptyState
      icon="📊"
      title="Visualizations appear after 4 reflections on a dream"
      description="Visual insights help you see patterns in your reflection journey. Keep reflecting to unlock visualizations."
      variant="compact"  // Compact variant for secondary pages
    />
  );
}
```

#### Step 7: Document in patterns.md

**Add EmptyState Component Pattern section:**

```markdown
## EmptyState Component Pattern

### Component Interface

**Enhanced interface (Iteration 9):**

[Full prop interface with examples]

### Usage Examples

**Dashboard - No Dreams:**
[Code example]

**Evolution Page - Not Enough Reflections:**
[Code example with progress]

[Full template in patterns.md]
```

See patterns.md file for complete documentation template.

### Testing Requirements

#### Visual Testing

**Test ALL empty state locations:**

- [ ] Dashboard (no dreams): Empty state renders correctly
- [ ] Dashboard (no reflections): Empty state renders correctly (if applicable)
- [ ] Dreams page: Empty state renders correctly
- [ ] Reflections page: Empty state renders correctly
- [ ] Evolution page: Empty state with progress (0/4) renders correctly
- [ ] Visualizations page: Empty state renders correctly

**Visual consistency checklist:**
- [ ] All icons are cosmic-themed (✨, 🌟, 💭, 🌱, 📊)
- [ ] All titles use GradientText (cosmic gradient)
- [ ] All descriptions are muted (text-white/60)
- [ ] All spacing is consistent (p-xl for default, p-lg for compact)
- [ ] All CTAs use GlowButton (variant="primary")

#### Interaction Testing

**CTA actions:**
- [ ] "Create your first dream" navigates to /dreams/create
- [ ] "Reflect now" navigates to /reflection
- [ ] "Create a reflection" navigates to /reflection
- [ ] All CTAs trigger correct action (no broken links)

#### Responsive Testing

**Test at all breakpoints:**
- [ ] 320px: EmptyState stacks vertically, text readable
- [ ] 768px: EmptyState centered, optimal width
- [ ] 1024px+: EmptyState maintains max-width (doesn't expand too wide)

#### Backwards Compatibility Testing

**Verify existing empty states still work:**

If any pages already use EmptyState without new props, verify they still render correctly (no breaking changes).

### Patterns to Follow

**From patterns.md:**
- EmptyState Component Pattern (props, usage examples)
- Component Composition Pattern (use GlassCard, GlowButton, GradientText)
- Spacing System Pattern (use p-xl, mb-md, etc.)

### Potential Issues & Gotcas

**Issue 1: Icon vs Illustration Priority**

**Problem:** If both `icon` and `illustration` props provided, which renders?

**Solution:**
- Prioritize `illustration` over `icon`
- If `illustration` provided, don't render `icon`
- Document in component JSDoc comment

```typescript
{/* Render illustration OR icon (not both) */}
{illustration ? (
  <div className="mb-md">{illustration}</div>
) : (
  <div className="text-6xl mb-md">{icon}</div>
)}
```

**Issue 2: Progress Bar Not Updating**

**Problem:** Progress prop changes but bar doesn't animate

**Solution:**
- Use CSS transition on width property:
  ```css
  transition: width 0.5s ease-out;
  ```
- Ensure progress.current changes trigger re-render

**Issue 3: Empty State Copy Too Long**

**Problem:** Description text wraps awkwardly on mobile

**Solution:**
- Keep descriptions under 150 characters
- Use line-height 1.6 for readability
- Test on 320px viewport (smallest mobile)

**Issue 4: CTA Action Not Working**

**Problem:** CTA button clicks but nothing happens

**Solution:**
- Verify `ctaAction` prop is passed correctly
- Check if router is available in context
- Use `useRouter()` from 'next/navigation' (not 'next/router')

### Expected Output

**After completion:**
- EmptyState component enhanced with optional props
- All empty states deployed across app (6+ locations)
- Copy is consistent, warm, and action-oriented
- Progress indicator works on Evolution page
- Pattern documented in patterns.md
- Backwards compatible (existing empty states still work)

### Time Estimate

**4-6 hours:**
- Component enhancement (add props): 1-2 hours
- Deploy to Dashboard: 1 hour
- Deploy to Dreams/Reflections: 1 hour
- Deploy to Evolution (with progress): 1 hour
- Deploy to Visualizations: 30 minutes
- Testing (visual + interaction): 1-2 hours
- Documentation (patterns.md): 30 minutes

---

## Integration & Validation (After All Builders Merge)

### Overview

After Builder-1, Builder-2, and Builder-3 have all merged, run comprehensive integration testing to verify:
1. No regressions (all existing features still work)
2. All success criteria met
3. Ready for production deployment

**Estimated time:** 2-3 hours

### Integration Testing Checklist

#### Smoke Test (CRITICAL - DO NOT SKIP)

**Test all major user flows:**

- [ ] **Flow 1: New user creates first dream**
  - Empty state appears on dashboard
  - "Create your first dream" CTA works
  - After creating dream, dashboard shows dream (no longer empty)

- [ ] **Flow 2: User creates first reflection**
  - Navigate to /reflection
  - Create reflection (form works, no nav overlap)
  - Reflection saves successfully
  - Returns to dashboard (reflection appears in recent reflections)

- [ ] **Flow 3: User views evolution (not enough reflections)**
  - Navigate to /evolution
  - Empty state shows "Your evolution story unfolds after 4 reflections"
  - Progress indicator shows correct count (e.g., 2/4)
  - Progress bar width correct (50% for 2/4)

- [ ] **Flow 4: User navigates all pages**
  - Dashboard → Dreams → Reflections → Evolution → Visualizations
  - All pages have correct padding (no nav overlap)
  - All page transitions smooth (no layout shift)

#### Visual Regression Testing

**Compare screenshots (BEFORE Iteration 9 vs AFTER):**

- [ ] Dashboard: No unintended layout changes
- [ ] Dreams: No unintended layout changes
- [ ] Reflections: No unintended layout changes
- [ ] Evolution: No unintended layout changes
- [ ] Visualizations: No unintended layout changes

**Verify:**
- Spacing consistent with design system
- Typography hierarchy maintained
- Color usage semantic and consistent
- Empty states visually appealing

#### Accessibility Validation

**Run Lighthouse on ALL pages:**

- [ ] Dashboard: 100% accessibility score (or document acceptable failures)
- [ ] Dreams: 100% accessibility score
- [ ] Reflections: 100% accessibility score
- [ ] Evolution: 100% accessibility score
- [ ] Visualizations: 100% accessibility score

**Manual keyboard navigation:**
- [ ] Tab through all pages (all interactive elements focusable)
- [ ] Focus indicators visible on all focusable elements
- [ ] No keyboard traps (can Tab in and out of all sections)
- [ ] Empty state CTAs keyboard accessible

#### Performance Validation

**Bundle size check:**

```bash
npm run build

# Verify bundle size unchanged (or minimal increase)
# Expected: ~0KB increase (CSS variables + small component enhancement)
```

**Lighthouse performance:**
- [ ] LCP < 2.5s (maintained)
- [ ] FID < 100ms (maintained)
- [ ] CLS < 0.1 (maintained or improved with nav fix)

#### Cross-Browser Testing

**Test on multiple browsers:**

- [ ] Chrome (latest): All features work
- [ ] Firefox (latest): All features work
- [ ] Safari (latest): All features work (especially navigation padding)
- [ ] Edge (latest): All features work

**Mobile browsers:**
- [ ] iOS Safari: Navigation padding correct, mobile menu works
- [ ] Chrome Mobile: Navigation padding correct, mobile menu works

### Success Criteria Validation

**Verify ALL success criteria from overview.md:**

**Navigation Never Hides Content:**
- [ ] All 6+ pages have proper padding
- [ ] Mobile menu doesn't obscure content
- [ ] No gap, no overlap at any breakpoint

**Design System Foundation:**
- [ ] Spacing documented in patterns.md
- [ ] Typography documented in patterns.md
- [ ] Color usage documented in patterns.md
- [ ] WCAG AA compliance maintained

**Enhanced Empty States:**
- [ ] 6+ empty state variants deployed
- [ ] All use consistent spacing
- [ ] All have inviting copy

**Zero Regressions:**
- [ ] All existing features work
- [ ] No visual breakage
- [ ] Performance maintained

### Final QA Report

**Create report documenting:**

1. **All tests run:** Smoke tests, visual regression, accessibility, performance, cross-browser
2. **All issues found:** List with severity (critical, high, medium, low)
3. **All issues fixed:** Document fixes applied
4. **Outstanding issues:** Any remaining issues (with mitigation plan)
5. **Sign-off:** Ready for production deployment (yes/no)

### Expected Output

**After integration & validation:**
- All builders merged successfully
- All tests passing
- All success criteria met
- No critical issues outstanding
- Ready for production deployment

---

## Builder Coordination Notes

### Shared Files (CONFLICT RISK)

**Files modified by multiple builders:**

1. **`.2L/plan-6/iteration-9/plan/patterns.md`**
   - Builder-1: Navigation + Spacing sections
   - Builder-2: Typography + Color sections
   - Builder-3: EmptyState section
   - **Mitigation:** Sequential merge (1 → 2 → 3), each builder adds their section

2. **`styles/variables.css`**
   - Builder-1: Adds `--nav-height` variable
   - Builder-2: Adds comments (documentation only)
   - **Mitigation:** Builder-1 merges first, Builder-2 pulls latest before committing

3. **`styles/globals.css`**
   - Builder-1: Adds `.pt-nav` utility class
   - Builder-2: Adds comments (documentation only)
   - **Mitigation:** Builder-1 merges first, Builder-2 pulls latest before committing

### Communication Protocol

**Daily standup (15 minutes):**
- What did you complete yesterday?
- What are you working on today?
- Any blockers or questions?

**Builder handoff notifications:**
- Builder-1 completes → Notify in Slack/Discord: "Builder-1 merged, Builder-2 and Builder-3 can pull latest"
- Builder-2 completes → Notify: "Builder-2 merged, Builder-3 can pull latest"

**Issue escalation:**
- Critical issue (navigation fix fails) → Escalate immediately to planner
- Medium issue (WCAG failure) → Document, create fix plan, continue
- Low issue (documentation gap) → Note in PR, fix in next iteration

### Merge Order

**STRICT SEQUENTIAL MERGE:**

```
Day 1-2: Builder-1 works
Day 2:   Builder-1 PR → Review → Merge → Tag commit

Day 2-3: Builder-2 works (pulls latest main)
Day 3:   Builder-2 PR → Review → Merge → Tag commit

Day 3-4: Builder-3 works (pulls latest main)
Day 4:   Builder-3 PR → Review → Merge → Tag commit

Day 4:   Integration & Validation
```

**Why sequential:**
- Prevents merge conflicts in shared files
- Builder-1 is BLOCKING (navigation fix required first)
- Adds 1 day but eliminates risk

**Alternative (if parallel needed):**
- File ownership: Builder-1 owns variables.css, Builder-2 documents only
- Coordination: Pair programming sessions to resolve conflicts
- Risk: Higher, not recommended unless timeline critical

---

## Summary

**Iteration 9 has 3 builders working sequentially:**

1. **Builder-1 (Navigation + Spacing):** 6-8 hours
   - Fix BLOCKING navigation overlap issue
   - Document spacing system foundation
   - Highest priority, must merge first

2. **Builder-2 (Typography + Color):** 6-8 hours
   - Audit typography hierarchy
   - Verify WCAG AA compliance
   - Document color semantic system
   - Can work in parallel, merges second

3. **Builder-3 (Enhanced Empty States):** 4-6 hours
   - Enhance EmptyState component
   - Deploy 6+ empty state variants
   - Depends on Builder-1 merge, merges last

**Total:** 18-24 hours (3-4 days with sequential workflow)

**Critical Success Factors:**
- Builder-1 navigation fix MUST be perfect (test thoroughly)
- Builder-2 WCAG AA compliance MUST be verified (Lighthouse)
- Builder-3 empty states MUST be consistent (use patterns)
- Integration testing MUST be comprehensive (no skips)

**Ready for:** Builder execution

---

**Task Breakdown Status:** COMPLETE
**Builder Count:** 3
**Workflow:** Sequential merge (1 → 2 → 3)
**Estimated Duration:** 3-4 days
**Risk Level:** MEDIUM (navigation fix is high-risk but well-scoped)
