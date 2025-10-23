# Builder Task Breakdown - Iteration 3

## Overview

**2 primary builders** will work in **parallel** to complete the Secondary Pages & Polish iteration.

**Builder-1:** Evolution & Visualizations Pages (14-18 hours)
**Builder-2:** Global Polish (6-8 hours)

**Total wall clock time:** ~14-18 hours (parallel execution)

**Complexity distribution:**
- Builder-1: MEDIUM-HIGH (page migration, multiple components)
- Builder-2: MEDIUM (component enhancements, new file creation)

**Parallel work feasible:** YES - completely isolated work streams, minimal conflicts.

---

## Builder-1: Evolution & Visualizations Pages

### Scope

Migrate Evolution and Visualizations pages from basic Tailwind styling to the glass design system. Replace all inline `bg-white/10 backdrop-blur-md` with glass components (`GlassCard`, `GlowButton`, `CosmicLoader`, `GradientText`, `GlowBadge`).

**Pages to migrate:**
1. `/app/evolution/page.tsx` - Evolution reports page
2. `/app/visualizations/page.tsx` - Visualizations page

**Preserve:**
- All tRPC query/mutation logic
- All state management
- All business logic
- All data structures

**Change:**
- Visual components only
- Loading states → CosmicLoader
- Containers → GlassCard
- Buttons → GlowButton
- Headings → GradientText
- Status indicators → GlowBadge

### Complexity Estimate

**MEDIUM-HIGH**

**Rationale:**
- Two pages to migrate (similar patterns)
- Multiple component types to replace
- Data visualization complexity (charts, graphs)
- Report generation state management
- Dream selection UI
- Mobile responsive layout

**Estimated effort:** 14-18 hours
- Evolution page: 8-10 hours
- Visualizations page: 6-8 hours

**Recommendation:** Single builder handles both pages (patterns reusable, consistency guaranteed).

### Success Criteria

- [x] Evolution page uses CosmicLoader for all loading states
- [x] Evolution page uses GlassCard for generation controls and report cards
- [x] Evolution page uses GlowButton for all buttons (generate, dream selection)
- [x] Evolution page uses GradientText for page title and section headers
- [x] Evolution page uses GlowBadge for report type indicators
- [x] Visualizations page uses CosmicLoader for all loading states
- [x] Visualizations page uses GlassCard for style selection and visualization display
- [x] Visualizations page uses GlowButton for all buttons
- [x] Visualizations page uses GradientText for headings
- [x] All hover effects work (cards lift on hover, glow expands)
- [x] No inline `backdrop-blur` remaining on either page
- [x] All tRPC queries/mutations unchanged and functional
- [x] Mobile responsive layout maintained (grid collapses properly)
- [x] Visual parity with Dashboard/Dreams/Reflection pages

### Files to Create/Modify

**Modify:**
- `/app/evolution/page.tsx` - Full glass component migration
- `/app/visualizations/page.tsx` - Full glass component migration

**No new files needed** - use existing glass components.

### Dependencies

**Depends on:** Iteration 1 & 2 (glass components exist)
**Blocks:** Builder-2 integration testing (page transitions need migrated pages)

**Internal dependencies:** None - pages are independent

### Implementation Notes

#### Evolution Page Migration

**Current structure (basic Tailwind):**
- Loading state: Basic "Loading..." text
- Generation controls: Manual `bg-white/10 backdrop-blur-md`
- Dream dropdown: HTML select element
- Generate buttons: Basic button elements
- Reports list: Basic div containers
- Tier warnings: Manual `bg-yellow-500/20` banners

**Target structure (glass components):**
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText,
  GlowBadge
} from '@/components/ui/glass';
import { cn } from '@/lib/utils';

export default function EvolutionPage() {
  // State management (preserve existing)
  const [selectedDream, setSelectedDream] = useState<string | null>(null);

  // tRPC queries (preserve existing)
  const { data: dreams } = trpc.dreams.list.useQuery();
  const { data: reports, isLoading } = trpc.evolution.getReports.useQuery();
  const generateMutation = trpc.evolution.generate.useMutation();

  // Loading state → CosmicLoader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading your evolution reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title → GradientText */}
        <GradientText gradient="cosmic" className="text-3xl sm:text-4xl font-bold mb-8">
          Evolution Reports
        </GradientText>

        {/* Generation Controls → GlassCard */}
        <GlassCard variant="elevated" className="mb-8">
          <GradientText gradient="primary" className="text-2xl font-bold mb-6">
            Generate New Report
          </GradientText>

          {/* Dream Selection → GlowButton grid */}
          <div className="mb-6">
            <label className="block text-white/80 mb-3 font-medium">
              Select Dream
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dreams?.map((dream) => (
                <GlowButton
                  key={dream.id}
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedDream(dream.id)}
                  className={cn(
                    'text-left justify-start',
                    selectedDream === dream.id && 'border-mirror-purple shadow-glow'
                  )}
                >
                  <span className="truncate">{dream.title}</span>
                </GlowButton>
              ))}
            </div>
          </div>

          {/* Generate Button → GlowButton with CosmicLoader */}
          <GlowButton
            variant="primary"
            size="lg"
            onClick={() => generateMutation.mutate({ dreamId: selectedDream! })}
            disabled={!selectedDream || generateMutation.isLoading}
            className="w-full"
          >
            {generateMutation.isLoading ? (
              <span className="flex items-center gap-2">
                <CosmicLoader size="sm" />
                Generating Report...
              </span>
            ) : (
              'Generate Evolution Report'
            )}
          </GlowButton>
        </GlassCard>

        {/* Report List → GlassCard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports?.map((report) => (
            <GlassCard
              key={report.id}
              variant="elevated"
              hoverable={true}
              glowColor="purple"
              className="cursor-pointer"
              onClick={() => router.push(`/evolution/${report.id}`)}
            >
              {/* Report Type Badge → GlowBadge */}
              <div className="flex items-start justify-between mb-4">
                <GradientText gradient="cosmic" className="text-xl font-bold">
                  {report.title}
                </GradientText>
                <GlowBadge variant="info" glowing={true}>
                  {report.reportType}
                </GlowBadge>
              </div>

              <p className="text-white/70 mb-4">{report.summary}</p>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">
                  Generated {new Date(report.createdAt).toLocaleDateString()}
                </span>
                <GlowButton variant="ghost" size="sm">
                  View Details
                </GlowButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Key implementation points:**
1. **Preserve all logic:** Don't change tRPC queries, state management, or event handlers
2. **Component mapping:**
   - `<div>Loading...</div>` → `<CosmicLoader size="lg" />`
   - `<div className="bg-white/10 backdrop-blur-md">` → `<GlassCard>`
   - `<button>` → `<GlowButton>`
   - `<h1>`, `<h2>` → `<GradientText>`
   - Status text → `<GlowBadge>`
3. **Hover effects:** Add `hoverable={true}` to all report cards
4. **Active states:** Use `cn()` to conditionally apply `border-mirror-purple shadow-glow` to selected items
5. **Responsive grid:** Maintain `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` patterns

#### Visualizations Page Migration

**Target structure:**
```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText
} from '@/components/ui/glass';
import { cn } from '@/lib/utils';

const visualizationStyles = [
  { id: 'achievement', name: 'Achievement Spiral', icon: '🏔️' },
  { id: 'spiral', name: 'Dream Spiral', icon: '🌀' },
  { id: 'synthesis', name: 'Cosmic Synthesis', icon: '🌌' },
];

export default function VisualizationsPage() {
  const [selectedDream, setSelectedDream] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('achievement');

  const { data: dreams } = trpc.dreams.list.useQuery();
  const { data: visualizations, isLoading } = trpc.visualizations.list.useQuery();
  const generateMutation = trpc.visualizations.generate.useMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading visualizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
      <div className="max-w-7xl mx-auto">
        <GradientText gradient="cosmic" className="text-3xl sm:text-4xl font-bold mb-8">
          Dream Visualizations
        </GradientText>

        <GlassCard variant="elevated" className="mb-8">
          {/* Style Selection Cards → GlassCard grid */}
          <GradientText gradient="primary" className="text-2xl font-bold mb-6">
            Select Visualization Style
          </GradientText>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {visualizationStyles.map((style) => (
              <GlassCard
                key={style.id}
                variant={selectedStyle === style.id ? 'elevated' : 'default'}
                hoverable={true}
                glowColor="purple"
                className={cn(
                  'cursor-pointer text-center',
                  selectedStyle === style.id && 'border-mirror-purple shadow-glow-lg'
                )}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="text-4xl mb-3">{style.icon}</div>
                <GradientText
                  gradient={selectedStyle === style.id ? 'cosmic' : 'primary'}
                  className="text-lg font-bold"
                >
                  {style.name}
                </GradientText>
              </GlassCard>
            ))}
          </div>

          {/* Dream Selection (same as Evolution page) */}
          {/* Generate Button (same as Evolution page) */}
        </GlassCard>

        {/* Visualization Display → GlassCard with variant="inset" */}
        <div className="grid grid-cols-1 gap-6">
          {visualizations?.map((viz) => (
            <GlassCard
              key={viz.id}
              variant="inset"
              glassIntensity="subtle"
            >
              <GradientText gradient="cosmic" className="text-2xl font-bold mb-4">
                {viz.title}
              </GradientText>

              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 text-lg leading-relaxed">
                  {viz.narrative}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Key differences from Evolution page:**
- **Style selection cards:** Use nested `GlassCard` components with large icons
- **Active style:** Use `variant="elevated"` + `border-mirror-purple shadow-glow-lg`
- **Visualization display:** Use `variant="inset"` (lighter background for text content)
- **Dream selection:** Same pattern as Evolution page (reuse code)

#### Gotchas & Important Considerations

**1. Chart/Graph Rendering (Evolution page):**
- If reports contain charts/graphs (from existing implementation), apply glass effects to **containers only**, not chart elements
- Use `variant="inset"` for chart containers to ensure chart legibility
- Test chart contrast with glass backgrounds
- Example:
  ```tsx
  <GlassCard variant="inset" glassIntensity="subtle">
    {/* Chart component renders here */}
    <ChartComponent data={report.chartData} />
  </GlassCard>
  ```

**2. Image Rendering (Visualizations page):**
- If visualizations include images, use `variant="inset"` to prevent glass overlay obscuring images
- Test image contrast with various blur intensities
- Consider solid backgrounds if glass affects image quality

**3. Tier Upgrade Warnings:**
- Both pages may have tier restriction banners
- Replace with `GlassCard` + `GlowBadge` pattern:
  ```tsx
  {user?.tier === 'free' && reachedLimit && (
    <GlassCard
      variant="elevated"
      glowColor="purple"
      className="border-l-4 border-yellow-500 mb-6"
    >
      <div className="flex items-center gap-3">
        <GlowBadge variant="warning" glowing={true}>
          <Sparkles className="w-4 h-4" />
        </GlowBadge>
        <div className="flex-1">
          <p className="text-white/90 font-medium">Upgrade to Premium</p>
          <p className="text-white/70 text-sm">
            You've reached your monthly report limit. Upgrade for unlimited reports.
          </p>
        </div>
        <GlowButton variant="primary" size="sm" onClick={() => router.push('/subscription')}>
          Upgrade
        </GlowButton>
      </div>
    </GlassCard>
  )}
  ```

**4. Mobile Responsive:**
- Maintain existing responsive breakpoints:
  - `grid-cols-1` (mobile)
  - `sm:grid-cols-2` (tablet)
  - `lg:grid-cols-3` (desktop)
- Test grid collapse on mobile devices
- Ensure all buttons have adequate touch targets (GlowButton already has `py-3` minimum)

**5. Performance:**
- Don't render too many simultaneous glass effects (max 6 visible cards recommended)
- Use pagination or virtualization if report lists are very long
- Monitor frame rate in Chrome DevTools Performance tab

### Patterns to Follow

Reference `patterns.md`:
- **Pattern 6:** Evolution Page Migration (full example)
- **Pattern 7:** Visualizations Page Migration (full example)
- **Pattern 1:** GlassCard Usage
- **Pattern 2:** GlowButton Usage
- **Pattern 3:** CosmicLoader for Loading States
- **Pattern 4:** GradientText for Headings
- **Pattern 5:** GlowBadge for Status Indicators
- **Pattern 16:** Error State Display

### Testing Requirements

**Manual Testing Checklist:**

**Evolution Page:**
- [ ] Page loads with CosmicLoader
- [ ] Page title renders with gradient
- [ ] Generation controls use GlassCard
- [ ] Dream selection buttons use GlowButton
- [ ] Active dream has purple border and glow
- [ ] Generate button shows CosmicLoader when generating
- [ ] Report cards use GlassCard with hover effect
- [ ] Report cards lift on hover (4px)
- [ ] Report type badges use GlowBadge
- [ ] Click on report card navigates correctly
- [ ] Tier upgrade warning (if applicable) uses glass styling
- [ ] Mobile responsive: Grid collapses to 1 column
- [ ] No inline backdrop-blur remaining
- [ ] All tRPC queries functional

**Visualizations Page:**
- [ ] Page loads with CosmicLoader
- [ ] Page title renders with gradient
- [ ] Style selection cards use nested GlassCard
- [ ] Active style has elevated variant and purple border
- [ ] Style card icons render (🏔️ 🌀 🌌)
- [ ] Dream selection uses GlowButton (same as Evolution)
- [ ] Generate button shows CosmicLoader when generating
- [ ] Visualization display uses inset variant
- [ ] Visualization narrative renders with proper typography
- [ ] Mobile responsive: Style cards collapse to 1 column
- [ ] No inline backdrop-blur remaining
- [ ] All tRPC mutations functional

**Cross-Browser (Chrome only for Builder-1):**
- [ ] Chrome: Glass effects render correctly
- [ ] Chrome: Hover effects work smoothly
- [ ] Chrome: Animations respect reduced motion (test in DevTools)

**Validator will test Safari/Firefox after integration.**

### Potential Split Strategy

**If complexity proves too high (>18 hours), consider splitting:**

**Primary Builder-1 (Foundation):**
- Set up imports and page structure
- Implement loading states with CosmicLoader
- Migrate page titles to GradientText
- Implement generation controls (GlassCard + GlowButton)
- **Estimated:** 8-10 hours

**Sub-builder 1A (Evolution Reports):**
- Migrate Evolution report list to GlassCard grid
- Add hover effects and badges
- Test Evolution page functionality
- **Estimated:** 4-5 hours

**Sub-builder 1B (Visualizations):**
- Migrate Visualizations style selection and display
- Test Visualizations page functionality
- **Estimated:** 4-5 hours

**Recommendation:** Start as single builder. Only split if progress is slower than expected after 8 hours.

---

## Builder-2: Global Polish (Micro-Interactions, Accessibility, Page Transitions)

### Scope

Add global polish across the entire application:
1. **Page transitions:** Create `app/template.tsx` for fade + slide transitions
2. **Accessibility enhancements:** Add ARIA labels, roles, skip-to-content link
3. **Micro-interaction enhancements:** Enhanced hover/focus animations
4. **Component improvements:** Update existing glass components with accessibility attributes

**No new visual components** - enhance existing ones.

### Complexity Estimate

**MEDIUM**

**Rationale:**
- Create one new file (app/template.tsx)
- Enhance multiple existing components (10+ glass components)
- Test page transitions across all pages
- Verify accessibility with keyboard navigation
- Cross-browser testing

**Estimated effort:** 6-8 hours
- Page transitions: 1-2 hours
- Accessibility enhancements: 2-3 hours
- Micro-interactions: 2-3 hours
- Testing: 1 hour

**Recommendation:** Single builder handles all polish work (cohesive experience).

### Success Criteria

- [x] Page transitions implemented (fade + slide on all page changes)
- [x] Page transitions respect `prefers-reduced-motion` (instant transitions)
- [x] CosmicLoader has `role="status"` and `aria-label`
- [x] All icon-only buttons have `aria-label`
- [x] Skip-to-content link added to layout
- [x] GlassInput has enhanced focus animation (subtle scale)
- [x] All new features tested with keyboard navigation
- [x] Reduced motion verified (toggle OS setting, test all animations)
- [x] No console warnings or errors
- [x] No performance degradation (Lighthouse score maintained)

### Files to Create/Modify

**Create:**
- `/app/template.tsx` - Global page transitions

**Modify:**
- `/components/ui/glass/CosmicLoader.tsx` - Add ARIA attributes
- `/components/ui/glass/GlassInput.tsx` - Enhanced focus animation
- `/app/layout.tsx` - Add skip-to-content link
- Any components with icon-only buttons (add `aria-label` as needed)

### Dependencies

**Depends on:** Iteration 1 & 2 (glass components exist)
**Blocks:** None (can work in parallel with Builder-1)

**Conflicts:** Minimal - Builder-1 works on pages, Builder-2 works on shared components

### Implementation Notes

#### Task 1: Page Transitions (1-2 hours)

**Create `/app/template.tsx`:**

```tsx
'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Global page transition template
 *
 * Applies fade + slide animation to all page navigations
 * Respects prefers-reduced-motion for accessibility
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Testing:**
1. Navigate between pages (Dashboard → Dreams → Reflection → Evolution → Visualizations)
2. Verify smooth fade + slide transition
3. Toggle `prefers-reduced-motion` in Chrome DevTools (Cmd+Shift+P → "Emulate CSS prefers-reduced-motion")
4. Verify instant page changes with reduced motion enabled
5. Test on Dashboard (verify no conflict with existing stagger animation)

**Potential issue:** Dashboard stagger animation may conflict with page transition.

**Mitigation:** If conflict occurs, disable page transition for Dashboard:
```tsx
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Skip transitions for Dashboard (has its own stagger animation)
  if (pathname === '/dashboard' || prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      {/* ... animation ... */}
    </AnimatePresence>
  );
}
```

#### Task 2: Accessibility Enhancements (2-3 hours)

**2A. Enhance CosmicLoader with ARIA:**

Modify `/components/ui/glass/CosmicLoader.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import { rotateVariants } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';

interface CosmicLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string; // NEW: Custom loading message
}

export function CosmicLoader({
  size = 'md',
  className,
  label = 'Loading content' // NEW: Default label
}: CosmicLoaderProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="status" // NEW: ARIA role
      aria-label={label} // NEW: ARIA label
    >
      <motion.div
        className={cn(
          'rounded-full border-4 border-mirror-purple/20 border-t-mirror-purple',
          sizeClasses[size]
        )}
        variants={rotateVariants}
        animate="animate"
      />
      <span className="sr-only">{label}</span> {/* NEW: Screen reader text */}
    </div>
  );
}
```

**Update type definition in `/types/glass-components.ts`:**
```tsx
export interface CosmicLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string; // NEW
}
```

**2B. Add Skip-to-Content Link:**

Modify `/app/layout.tsx`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-mirror-purple focus:text-white focus:rounded-lg focus:shadow-glow"
        >
          Skip to main content
        </a>

        {/* Existing navigation */}
        <nav>{/* ... */}</nav>

        {/* Main content */}
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
```

**Verify `sr-only` utility exists in `/styles/globals.css`:**
```css
@layer utilities {
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .focus\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
}
```

**2C. Add ARIA Labels to Icon-Only Buttons:**

Search for icon-only buttons across the codebase and add `aria-label`:

```bash
# Find icon-only buttons (manual review needed)
grep -r "<button" app/ components/ | grep -v "aria-label"
```

**Common patterns to update:**

```tsx
// Close buttons in modals
<button
  onClick={onClose}
  aria-label="Close modal" // ADD THIS
>
  <X className="w-6 h-6" />
</button>

// Refresh buttons
<GlowButton
  variant="ghost"
  size="sm"
  onClick={handleRefresh}
  aria-label="Refresh data" // ADD THIS
>
  <RefreshCw className="w-4 h-4" />
</GlowButton>

// Delete buttons
<GlowButton
  variant="ghost"
  size="sm"
  onClick={handleDelete}
  aria-label="Delete item" // ADD THIS
>
  <Trash2 className="w-4 h-4" />
</GlowButton>
```

**2D. Keyboard Navigation Testing:**

Test tab order and focus states:
1. Tab through entire page
2. Verify logical order (top to bottom, left to right)
3. Verify focus indicators visible (blue ring on focus)
4. Test Escape key closes modals
5. Test Enter/Space activates buttons

#### Task 3: Micro-Interaction Enhancements (2-3 hours)

**3A. Enhanced Focus Animation for GlassInput:**

Modify `/components/ui/glass/GlassInput.tsx`:

```tsx
'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function GlassInput({ className, ...props }: GlassInputProps) {
  return (
    <input
      className={cn(
        // Base styles
        'w-full px-4 py-3 rounded-lg',
        'bg-white/5 backdrop-blur-glass border border-white/10',
        'text-white placeholder:text-white/40',
        // Focus styles
        'focus:outline-none',
        'focus:border-mirror-purple/60',
        'focus:shadow-glow',
        'focus:scale-[1.01]', // NEW: Subtle scale on focus
        // Transition
        'transition-all duration-300',
        // Custom
        className
      )}
      {...props}
    />
  );
}
```

**3B. Test Enhanced Hover Effects:**

Verify existing hover effects work across all pages:
- GlassCard: `translateY(-4px)` + glow expansion
- GlowButton: `scale: 1.02` on hover, `scale: 0.98` on tap
- DreamCard: Hover lift + glow

**No code changes needed** - these are already implemented in Iteration 1 & 2.

**3C. (Optional) Scroll-Based Navbar Blur:**

**Recommendation:** SKIP for Iteration 3 (minimal impact, potential performance issues).

If time permits, add to FloatingNav component:
```tsx
const [scrollY, setScrollY] = useState(0);

useEffect(() => {
  const handleScroll = () => setScrollY(window.scrollY);
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

const blurIntensity = scrollY > 50 ? 'backdrop-blur-glass-lg' : 'backdrop-blur-glass';
```

#### Task 4: Cross-Browser Testing (1 hour)

**Test in Chrome (primary):**
- [ ] Page transitions smooth
- [ ] All hover effects work
- [ ] Focus indicators visible
- [ ] Glass effects render correctly
- [ ] Reduced motion works (toggle in DevTools)

**Test in Safari (if available):**
- [ ] Backdrop-filter rendering quality
- [ ] Glass borders visible
- [ ] Purple/blue gradients correct
- [ ] Touch interactions work (iOS Safari if testing on device)

**Test in Firefox (if available):**
- [ ] Backdrop-filter performance acceptable
- [ ] Animations smooth
- [ ] Focus states visible

**Accessibility Testing:**
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces loading states (test with VoiceOver/NVDA)
- [ ] Skip-to-content link works (Tab on page load, press Enter)
- [ ] Reduced motion respected (toggle OS setting)

**Performance Testing:**
- [ ] Run Lighthouse audit on all pages
- [ ] Verify scores >85 (Performance, Accessibility, Best Practices)
- [ ] Check bundle sizes: `npm run build`
- [ ] Verify no performance regression

### Patterns to Follow

Reference `patterns.md`:
- **Pattern 8:** Global Page Transitions
- **Pattern 11:** ARIA Labels for Loaders
- **Pattern 12:** Icon Button ARIA Labels
- **Pattern 13:** Skip to Content Link
- **Pattern 10:** Enhanced Focus Animations
- **Pattern 14:** Keyboard Navigation

### Testing Requirements

**Manual Testing Checklist:**

**Page Transitions:**
- [ ] Dashboard → Dreams (smooth transition)
- [ ] Dreams → Reflection (smooth transition)
- [ ] Reflection → Evolution (smooth transition)
- [ ] Evolution → Visualizations (smooth transition)
- [ ] Reduced motion: Instant transitions

**Accessibility:**
- [ ] Tab through Dashboard (logical order)
- [ ] Tab through Dreams page (logical order)
- [ ] Press Tab on page load → Skip-to-content link appears
- [ ] Press Enter on skip link → Focus jumps to main content
- [ ] Screen reader announces "Loading content" when CosmicLoader visible
- [ ] All icon buttons announce their purpose

**Micro-Interactions:**
- [ ] Input fields scale slightly on focus
- [ ] All hover effects work (cards, buttons)
- [ ] All animations smooth at 60fps (Chrome DevTools Performance)

**Cross-Browser:**
- [ ] Chrome: All features work
- [ ] Safari: Glass effects render correctly
- [ ] Firefox: Animations smooth

### Potential Issues & Mitigations

**Issue 1: Page Transition Conflicts with Dashboard Stagger**
- **Symptom:** Dashboard cards animate twice (page transition + stagger)
- **Mitigation:** Exclude Dashboard from template.tsx transitions (see implementation notes)

**Issue 2: Safari Focus Ring Visibility**
- **Symptom:** Blue focus ring not visible on Safari
- **Mitigation:** Add explicit `outline` style:
  ```css
  focus-visible:outline-2 focus-visible:outline-mirror-purple
  ```

**Issue 3: Screen Reader Announcement Timing**
- **Symptom:** Screen reader announces "Loading content" after content has loaded
- **Mitigation:** Use `aria-live="polite"` region for loading states (defer to post-MVP if complex)

---

## Builder Execution Order

### Parallel Execution (Recommended)

**Phase 1: Parallel Work (14-18 hours wall clock time)**
- **Builder-1:** Evolution & Visualizations page migration
- **Builder-2:** Global polish (page transitions, accessibility, micro-interactions)

**Both builders can work simultaneously:**
- Builder-1 works on isolated pages (no shared file modifications)
- Builder-2 works on shared components and creates new file (template.tsx)
- Minimal conflicts: Builder-1 uses existing glass components, Builder-2 enhances them

**Phase 2: Integration (30 minutes)**
- Merge Builder-1 and Builder-2 work
- Verify page transitions work on Evolution/Visualizations pages
- Verify accessibility enhancements apply to all pages
- Test end-to-end user flows

**Phase 3: Validation (4 hours)**
- Cross-browser testing (Chrome, Safari, Firefox)
- Accessibility audit (keyboard nav, screen reader, contrast)
- Performance validation (Lighthouse, bundle sizes)
- User acceptance testing

---

## Integration Notes

### Merge Strategy

**Step 1: Builder-1 completes first**
- Evolution and Visualizations pages migrated
- All tRPC queries functional
- Pages tested independently

**Step 2: Builder-2 completes**
- Page transitions implemented (template.tsx)
- Glass components enhanced with ARIA
- Accessibility features added

**Step 3: Integration testing**
- Verify page transitions work on Evolution/Visualizations
- Verify CosmicLoader ARIA labels work on all pages
- Verify no visual regressions

### Conflict Areas (Low Risk)

**Shared files:**
- `/components/ui/glass/CosmicLoader.tsx` (Builder-2 modifies)
  - Builder-1 uses existing version
  - No conflict: Builder-1 just imports component
- `/components/ui/glass/GlassInput.tsx` (Builder-2 modifies)
  - Builder-1 doesn't use this component
  - No conflict

**New files:**
- `/app/template.tsx` (Builder-2 creates)
  - Builder-1 doesn't touch this file
  - No conflict

**Coordination needed:**
- None - completely isolated work streams

### Testing Coordination

**During building:**
- Builder-1 tests Evolution/Visualizations in Chrome
- Builder-2 tests page transitions in Chrome

**After integration:**
- Validator performs comprehensive cross-browser testing
- Validator performs accessibility audit
- Validator performs performance validation

---

## Success Metrics

**Visual Consistency:**
- All pages use glass design system
- No inline backdrop-blur remaining
- Consistent hover effects across all pages
- Consistent loading states (CosmicLoader everywhere)

**Accessibility:**
- All interactive elements keyboard accessible
- Logical tab order on all pages
- Screen reader announces loading states
- Skip-to-content link works
- Reduced motion respected

**Performance:**
- Lighthouse scores >85 on all pages
- Bundle sizes <200 kB per page
- Animations smooth at 60fps (desktop)
- No console warnings or errors

**User Experience:**
- Smooth page transitions
- Delightful micro-interactions
- Consistent magical feel across entire app
- No jarring visual inconsistencies

---

## Final Checklist

**Before marking iteration complete:**

- [ ] Builder-1 completed Evolution page migration
- [ ] Builder-1 completed Visualizations page migration
- [ ] Builder-2 completed page transitions (template.tsx)
- [ ] Builder-2 completed accessibility enhancements
- [ ] Builder-2 completed micro-interaction enhancements
- [ ] Integration testing passed
- [ ] Cross-browser testing complete (Chrome, Safari, Firefox)
- [ ] Accessibility audit complete (keyboard nav, screen reader)
- [ ] Performance validation complete (Lighthouse >85)
- [ ] User acceptance testing complete
- [ ] No critical bugs remaining
- [ ] Documentation updated (if needed)

**Estimated total time:** 24-30 hours (wall clock time with parallel builders)

**Result:** Complete, polished, accessible magical frontend experience across all pages of Mirror of Dreams.
