# Builder Task Breakdown - Iteration 4

## Overview

**Total Builders:** 3 primary builders working in parallel
**Estimated Duration:** 10-15 hours total (2-3 days with parallel execution)
**Complexity Distribution:** All MEDIUM complexity
**Dependencies:** Minimal - all builders can work concurrently with coordination on shared files

---

## Builder Execution Strategy

### Parallel Group 1 (All builders start simultaneously)
- **Builder-1:** Dashboard Visual Hierarchy & Loading States
- **Builder-2:** Typography Enforcement
- **Builder-3:** Spacing Consistency & Empty States Enhancement

### Integration Order
1. Builder-2 (Typography) merges first → creates foundation
2. Builder-3 (Spacing) merges second → extends foundation
3. Builder-1 (Dashboard) merges last → uses updated typography/spacing

### Shared File Coordination

**styles/variables.css:**
- Builder-2 updates lines 1-50 (typography variables)
- Builder-3 reads lines 100+ (spacing variables, no changes)
- **Conflict Risk:** LOW (different sections)

**styles/globals.css:**
- Builder-2 adds typography utilities (@layer utilities)
- Builder-3 may add spacing utilities (same @layer)
- **Conflict Risk:** LOW (append-only, different utilities)

**tailwind.config.ts:**
- Builder-3 extends spacing mapping (theme.extend.spacing)
- **Conflict Risk:** NONE (only Builder-3 touches this)

---

## Builder-1: Dashboard Visual Hierarchy & Loading States

### Scope
Enhance dashboard visual hierarchy, upgrade "Reflect Now" CTA to hero element, and ensure 100% loading state coverage across Evolution and Visualizations pages. Replace custom spinners in dashboard cards with consistent CosmicLoader implementation.

### Complexity Estimate
**MEDIUM**
- Touches 6-8 files
- Requires understanding of tRPC loading patterns
- CSS updates to dashboard.css for hover states
- Testing across multiple pages

### Success Criteria
- [x] WelcomeSection uses personalized greeting with user's first name
- [x] Time-based greeting logic works (Good morning/afternoon/evening)
- [x] "Reflect Now" CTA uses GlowButton with cosmic variant (not generic purple button)
- [x] Dashboard cards use CosmicLoader (custom spinners removed from DreamsCard/ReflectionsCard)
- [x] Evolution page shows loading states for ALL 3 queries (dreamsData, reportsData, eligibility)
- [x] Visualizations page shows loading states for ALL 2 queries (dreamsData, visualizationsData)
- [x] All loading states have descriptive text ("Loading your dreams..." not just spinner)
- [x] Dashboard card hover states enhanced (lift + glow + border + scale)
- [x] No custom .cosmic-spinner CSS remains (removed from dashboard.css)
- [x] Manual QA passed on all pages (Dashboard, Evolution, Visualizations)

### Files to Create/Modify

**1. components/dashboard/shared/WelcomeSection.tsx** - Enhance greeting
```tsx
// Add personalized greeting with time-based logic
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good evening';
};

const firstName = user?.name?.split(' ')[0] || user?.name || 'there';
const greeting = getGreeting();
```

**2. app/dashboard/page.tsx** - Upgrade "Reflect Now" CTA
```tsx
// Replace generic button with GlowButton
<GlowButton
  variant="cosmic"
  size="lg"
  onClick={handleReflectNow}
  className="w-full sm:w-auto min-w-[280px] mb-xl"
>
  ✨ Reflect Now
</GlowButton>
```

**3. app/evolution/page.tsx** - Add loading states
```tsx
// Extract isLoading from ALL queries
const { data: dreamsData, isLoading: dreamsLoading } = trpc.dreams.list.useQuery();
const { data: reportsData, isLoading: reportsLoading } = trpc.evolution.list.useQuery();
const { data: eligibility, isLoading: eligibilityLoading } = trpc.evolution.checkEligibility.useQuery();

// Combine loading states
if (dreamsLoading || reportsLoading || eligibilityLoading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-md">
      <CosmicLoader size="lg" label="Loading evolution reports" />
      <p className="text-white/60 text-small">Loading your evolution reports...</p>
    </div>
  );
}
```

**4. app/visualizations/page.tsx** - Add loading states
```tsx
// Extract isLoading from ALL queries
const { data: dreamsData, isLoading: dreamsLoading } = trpc.dreams.list.useQuery();
const { data: visualizationsData, isLoading: visualizationsLoading } = trpc.visualizations.list.useQuery();

if (dreamsLoading || visualizationsLoading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-md">
      <CosmicLoader size="lg" label="Loading visualizations" />
      <p className="text-white/60 text-small">Loading visualizations...</p>
    </div>
  );
}
```

**5. components/dashboard/cards/DreamsCard.tsx** - Replace custom spinner
```tsx
// BEFORE
{isLoading ? (
  <div className="flex items-center justify-center py-8">
    <div className="cosmic-spinner"></div>
    <span className="text-white/60 text-sm ml-3">Loading your dreams...</span>
  </div>
) : (
  /* ... */
)}

// AFTER
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

{isLoading ? (
  <div className="flex flex-col items-center justify-center py-xl gap-md">
    <CosmicLoader size="md" label="Loading dreams" />
    <p className="text-white/60 text-small">Loading your dreams...</p>
  </div>
) : (
  /* ... */
)}
```

**6. components/dashboard/cards/ReflectionsCard.tsx** - Replace custom spinner
```tsx
// Same pattern as DreamsCard
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';

{isLoading ? (
  <div className="flex flex-col items-center justify-center py-xl gap-md">
    <CosmicLoader size="md" label="Loading reflections" />
    <p className="text-white/60 text-small">Loading reflections...</p>
  </div>
) : (
  /* ... */
)}
```

**7. styles/dashboard.css** - Enhance hover states, remove custom spinner
```css
/* Enhance card hover states */
.dashboard-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dashboard-card--hovered {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 64px rgba(139, 92, 246, 0.4);
  border-color: rgba(139, 92, 246, 0.3);
  backdrop-filter: blur(50px) saturate(140%);
}

/* DELETE: Remove custom cosmic-spinner */
/* .cosmic-spinner { ... } - REMOVE ENTIRE BLOCK */
```

**8. components/dashboard/cards/UsageCard.tsx** - Verify loading state
```tsx
// UsageCard likely doesn't need changes (uses DashboardCard's loading overlay)
// Verify that isLoading prop is passed correctly
```

### Dependencies
**Depends on:** None (can start immediately)
**Blocks:** None (all builders work in parallel)

**Coordination:**
- Uses CosmicLoader component (existing, no changes)
- Uses GlowButton component (existing, cosmic variant already implemented)
- CSS changes to dashboard.css (no conflicts with other builders)

### Implementation Notes

**Time-Based Greeting Logic:**
- 5am-12pm: "Good morning"
- 12pm-5pm: "Good afternoon"
- 5pm-10pm: "Good evening"
- 10pm-5am: "Good evening" (default)

**Loading State Pattern:**
- Always combine multiple queries with OR operator (dreamsLoading || reportsLoading)
- Show single loading state (don't show separate loaders per query)
- Use min-h-screen for full-page loading (center vertically)
- Use descriptive text that matches page context

**Custom Spinner Removal:**
- Search for `.cosmic-spinner` in dashboard.css
- Remove entire CSS block
- Verify no other files reference .cosmic-spinner
- Test dashboard cards after removal

**Dashboard Card Hover States:**
- Use GPU-accelerated transforms only (translateY, scale)
- Test on Safari (backdrop-filter performance)
- Ensure 60fps during hover (no jank)
- Verify hover states work on mobile (touch devices)

### Patterns to Follow

**Loading State Pattern (from patterns.md):**
- Section: "Loading State Pattern" → "Multiple Queries with Combined Loading State"
- Use CosmicLoader size="lg" for page-level loading
- Use CosmicLoader size="md" for card-level loading
- Always include descriptive text below loader

**Dashboard Enhancement Pattern (from patterns.md):**
- Section: "Dashboard Enhancement Pattern" → "Enhanced WelcomeSection with Personalization"
- Section: "Dashboard Enhancement Pattern" → "Enhanced 'Reflect Now' CTA"
- Section: "Dashboard Enhancement Pattern" → "Enhanced Dashboard Card Hover States"

### Testing Requirements

**Manual Testing:**
- Test WelcomeSection at different times of day (verify greeting changes)
- Test "Reflect Now" button hover state (verify cosmic glow)
- Test Evolution page loading state on slow network (3G throttle)
- Test Visualizations page loading state on slow network
- Test DreamsCard/ReflectionsCard loading states (verify CosmicLoader appears)
- Test dashboard card hover states on Chrome, Safari, Firefox

**Network Testing:**
- Use Chrome DevTools Network tab → Throttle to "Slow 3G"
- Verify loading states appear immediately
- Verify loading states persist for at least 300ms (no flash)
- Verify descriptive text is visible and helpful

**Cross-Browser Testing:**
- Chrome: Verify all hover states smooth (60fps)
- Safari: Verify backdrop-filter performance acceptable
- Firefox: Verify all loading states appear correctly

**Mobile Testing:**
- Test WelcomeSection on 320px (iPhone SE) - greeting should fit
- Test "Reflect Now" button full-width on mobile
- Test dashboard cards stack correctly on mobile (1-column layout)

### Potential Split Strategy
If this task proves too complex, split into:

**Foundation (Primary Builder):**
- Dashboard visual hierarchy (WelcomeSection, "Reflect Now" CTA)
- Dashboard card hover states
- Custom spinner removal from DreamsCard/ReflectionsCard
- **Estimate:** 2-3 hours

**Sub-builder 1A: Evolution/Visualizations Loading States**
- Add loading states to Evolution page (3 queries)
- Add loading states to Visualizations page (2 queries)
- Test on slow network
- **Estimate:** 2-3 hours

**Split Decision:** NOT RECOMMENDED - Task is cohesive, splitting adds overhead

---

## Builder-2: Typography Enforcement

### Scope
Create unified typography system by updating CSS variables, creating semantic utility classes, and systematically replacing Tailwind typography classes across all pages. Refactor mirror.css to use CSS variables instead of hardcoded rem values.

### Complexity Estimate
**MEDIUM**
- Touches 10+ files (all pages + CSS files)
- Requires careful variable adjustments (test mobile)
- Systematic replacement across entire codebase
- Risk of breaking reflection output styling (mirror.css refactor)

### Success Criteria
- [x] variables.css updated with 3 typography adjustments (--text-xs, --text-base, --leading-relaxed)
- [x] globals.css has new typography utilities (.text-h1, .text-h2, .text-h3, .text-body, .text-small, .text-tiny)
- [x] All pages use semantic typography classes (not Tailwind text-3xl, text-sm, etc.)
- [x] mirror.css typography uses CSS variables (no hardcoded rem values)
- [x] No text smaller than 0.85rem (13.6px) anywhere
- [x] All headings use correct font weights (600 for H1-H2, 500 for H3)
- [x] Body text line-height is 1.75 (improved readability)
- [x] Mobile typography readable at 320px width (test on iPhone SE)
- [x] Reflection output page tested thoroughly (mirror.css changes validated)
- [x] Manual QA on all pages (Dashboard, Dreams, Evolution, Visualizations, Reflection)

### Files to Create/Modify

**1. styles/variables.css** - Update typography variables (lines 1-50)
```css
/* ADJUSTMENT 1: Increase --text-xs minimum */
--text-xs: clamp(0.85rem, 1.8vw, 0.9rem);  /* Was: 0.7rem */

/* ADJUSTMENT 2: Fine-tune --text-base */
--text-base: clamp(1.05rem, 2.5vw, 1.15rem);  /* Was: 1rem */

/* ADJUSTMENT 3: Increase body line-height */
--leading-relaxed: 1.75;  /* Was: 1.625 */
```

**2. styles/globals.css** - Add typography utilities
```css
@layer utilities {
  .text-h1 {
    font-size: var(--text-4xl);
    font-weight: var(--font-semibold);
    line-height: var(--leading-tight);
  }

  .text-h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    line-height: var(--leading-tight);
  }

  .text-h3 {
    font-size: var(--text-xl);
    font-weight: var(--font-medium);
    line-height: var(--leading-snug);
  }

  .text-body {
    font-size: var(--text-base);
    font-weight: var(--font-normal);
    line-height: var(--leading-relaxed);
  }

  .text-small {
    font-size: var(--text-sm);
    font-weight: var(--font-normal);
    line-height: var(--leading-normal);
  }

  .text-tiny {
    font-size: var(--text-xs);
    font-weight: var(--font-normal);
    line-height: var(--leading-snug);
  }
}
```

**3. app/dreams/page.tsx** - Replace Tailwind typography
```tsx
// BEFORE
<GradientText className="text-3xl sm:text-4xl font-bold mb-2">
<p className="text-white/70 text-base sm:text-lg">

// AFTER
<GradientText className="text-h1 mb-2">
<p className="text-body text-white/70">
```

**4. app/evolution/page.tsx** - Replace Tailwind typography
```tsx
// BEFORE
<GradientText className="text-3xl sm:text-4xl font-bold mb-2">
<p className="text-white/70">

// AFTER
<GradientText className="text-h1 mb-2">
<p className="text-body text-white/70">
```

**5. app/visualizations/page.tsx** - Replace Tailwind typography
```tsx
// BEFORE
<GradientText className="text-3xl sm:text-4xl font-bold mb-2">
<p className="text-white/70 text-sm">

// AFTER
<GradientText className="text-h1 mb-2">
<p className="text-small text-white/70">
```

**6. app/dashboard/page.tsx** - Replace inline typography
```tsx
// BEFORE
<button className="px-8 py-4 text-xl font-medium">

// AFTER (after Builder-1 replaces with GlowButton, this is handled)
// Verify GlowButton uses correct typography internally
```

**7. styles/mirror.css** - Replace hardcoded typography
```css
/* BEFORE */
.matrix-header {
  font-size: 0.95rem;  /* Hardcoded */
  font-weight: 500;
}

.matrix-output {
  font-size: 1rem;  /* Hardcoded */
  line-height: 1.7;
}

.control-button {
  font-size: 0.9rem;  /* Hardcoded */
  font-weight: 500;
}

/* AFTER */
.matrix-header {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.matrix-output {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.control-button {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}
```

**8. app/reflection/output/page.tsx** - Verify no typography regressions
```tsx
// No direct changes - just test reflection output after mirror.css refactor
// Ensure text is still readable and properly sized
```

**9. components/shared/EmptyState.tsx** - Update to use new utilities
```tsx
// BEFORE
<GradientText gradient="cosmic" className="text-2xl font-bold mb-4">
<p className="text-white/60 text-base mb-6 leading-relaxed">

// AFTER
<GradientText gradient="cosmic" className="text-h2 mb-4">
<p className="text-body text-white/60 mb-6">
```

### Dependencies
**Depends on:** None (can start immediately)
**Blocks:** Builder-3 (spacing utilities extend globals.css)

**Coordination:**
- Builder-2 creates typography utilities in globals.css FIRST
- Builder-3 can then add spacing utilities to same file
- Merge Builder-2 before Builder-3 to avoid conflicts

### Implementation Notes

**CSS Variable Adjustments:**
- Test at 320px width after --text-xs change (verify 13.6px minimum)
- Test at 1920px width (verify max sizes don't overflow)
- Use browser DevTools to inspect computed font sizes
- Verify responsive scaling works (zoom in/out)

**Typography Utility Classes:**
- Add to globals.css under @layer utilities (Tailwind convention)
- Each utility combines size + weight + line-height
- Semantic names (h1, h2, body) are more maintainable than arbitrary (4xl, 2xl)
- Test that utilities override Tailwind defaults

**Systematic Replacement:**
- Search codebase for "text-3xl", "text-4xl", "text-2xl", "text-xl" (Tailwind classes)
- Replace with .text-h1, .text-h2, .text-h3 based on semantic meaning
- Search for "text-base", "text-lg" → replace with .text-body
- Search for "text-sm" → replace with .text-small
- Search for "text-xs" → replace with .text-tiny

**Mirror.css Refactor:**
- HIGH RISK FILE (reflection output is core user experience)
- Search for all hardcoded rem values (0.9rem, 0.95rem, 1rem, etc.)
- Map to closest CSS variable (--text-sm, --text-base)
- Test reflection output page before/after (screenshot comparison)
- Verify line-heights remain comfortable for reading

**Mobile Testing:**
- Test typography at 320px (iPhone SE) - smallest screen
- Verify no text is too small to read
- Verify headings don't overflow
- Verify line-height creates comfortable reading

### Patterns to Follow

**Typography Enforcement Pattern (from patterns.md):**
- Section: "Typography Enforcement Pattern" → All 4 subsections
- Follow exact variable adjustments
- Copy utility class CSS exactly
- Use replacement patterns for consistency

### Testing Requirements

**Variable Testing:**
- Open Chrome DevTools → Inspect <html> element → Computed styles
- Verify --text-xs: 0.85rem (at 320px width)
- Verify --text-base: 1.05rem (at 320px width)
- Verify --leading-relaxed: 1.75

**Utility Class Testing:**
- Apply .text-h1 to element → verify font-size, weight, line-height
- Apply .text-body to element → verify correct values
- Test all 6 utilities (.text-h1, .text-h2, .text-h3, .text-body, .text-small, .text-tiny)

**Page Testing:**
- Dreams page: Verify headlines use .text-h1
- Evolution page: Verify body text uses .text-body
- Visualizations page: Verify small text uses .text-small
- Dashboard page: Verify consistent typography

**Mirror.css Testing:**
- Reflection output page: Create test reflection
- Compare before/after screenshots
- Verify text is readable and well-sized
- Verify line-heights comfortable
- Test on mobile (320px)

**Cross-Browser Testing:**
- Chrome: Verify clamp() values work
- Safari: Verify CSS variables render correctly
- Firefox: Verify typography consistent

### Potential Split Strategy
If this task proves too complex, split into:

**Foundation (Primary Builder):**
- Update variables.css (3 adjustments)
- Create typography utilities in globals.css
- Update 2-3 pages (Dreams, Evolution)
- **Estimate:** 2-3 hours

**Sub-builder 2A: Systematic Replacement**
- Update remaining pages (Visualizations, Dashboard components)
- Refactor mirror.css typography
- Test reflection output page
- **Estimate:** 2-3 hours

**Split Decision:** RECOMMENDED if timeline is tight (splits CSS foundation from page updates)

---

## Builder-3: Spacing Consistency & Empty States Enhancement

### Scope
Extend Tailwind configuration to map CSS spacing variables, replace hardcoded spacing in mirror.css, update all EmptyState usage with personality-driven copy and emojis, and systematically replace Tailwind spacing classes across pages.

### Complexity Estimate
**MEDIUM**
- Touches 8-10 files (pages + EmptyState component + CSS)
- Requires Tailwind config extension
- EmptyState copy updates require stakeholder review
- Mirror.css refactor (spacing) complements Builder-2's work

### Success Criteria
- [x] tailwind.config.ts extended with spacing variables (xs, sm, md, lg, xl, 2xl, 3xl)
- [x] mirror.css spacing uses CSS variables (no hardcoded rem values)
- [x] EmptyState component updated with new typography utilities (text-h2, text-body)
- [x] All EmptyState usage includes emojis (Dreams: ✨, Evolution: 🌱, Visualizations: 🌌)
- [x] All EmptyState copy is personality-driven (8/10 personality level)
- [x] All pages use responsive spacing classes (gap-md, p-xl, mb-lg)
- [x] Card padding standardized to var(--space-xl) everywhere
- [x] Section spacing standardized to var(--space-8) or var(--space-12)
- [x] Mobile spacing comfortable at 320px width
- [x] Manual QA on all pages (Dreams, Evolution, Visualizations)

### Files to Create/Modify

**1. tailwind.config.ts** - Extend spacing mapping
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      spacing: {
        'xs': 'var(--space-xs)',   // 8-12px
        'sm': 'var(--space-sm)',   // 12-16px
        'md': 'var(--space-md)',   // 16-24px
        'lg': 'var(--space-lg)',   // 24-32px
        'xl': 'var(--space-xl)',   // 32-48px
        '2xl': 'var(--space-2xl)', // 48-64px
        '3xl': 'var(--space-3xl)', // 64-96px
      },
    },
  },
};

export default config;
```

**2. styles/mirror.css** - Replace hardcoded spacing
```css
/* BEFORE */
.square-mirror-container {
  padding: 2rem;  /* Hardcoded */
}

.mirror-content {
  gap: 3rem;  /* Hardcoded */
}

.square-mirror-frame {
  padding: 2.5rem;  /* Hardcoded */
}

.mirror-controls {
  gap: 1.5rem;  /* Hardcoded */
}

/* AFTER */
.square-mirror-container {
  padding: var(--space-lg);  /* 24-32px responsive */
}

.mirror-content {
  gap: var(--space-2xl);  /* 48-64px responsive */
}

.square-mirror-frame {
  padding: var(--space-xl);  /* 32-48px responsive */
}

.mirror-controls {
  gap: var(--space-lg);  /* 24-32px responsive */
}
```

**3. components/shared/EmptyState.tsx** - Update typography utilities
```tsx
// BEFORE
<div className="text-6xl mb-4">{icon}</div>
<GradientText gradient="cosmic" className="text-2xl font-bold mb-4">
<p className="text-white/60 text-base mb-6 leading-relaxed">

// AFTER
<div className="text-6xl mb-md">{icon}</div>
<GradientText gradient="cosmic" className="text-h2 mb-md">
<p className="text-body text-white/60 mb-lg">
```

**4. app/dreams/page.tsx** - Update EmptyState with personality
```tsx
// BEFORE
<EmptyState
  icon=""
  title="No dreams yet"
  description="Create your first dream to start reflecting and growing."
  ctaLabel="Create Your First Dream"
  ctaAction={() => setIsCreateModalOpen(true)}
/>

// AFTER
<EmptyState
  icon="✨"
  title="Your Dream Journey Awaits"
  description="Every great journey begins with a single dream. What will yours be?"
  ctaLabel="Create My First Dream"
  ctaAction={() => setIsCreateModalOpen(true)}
/>
```

**5. app/evolution/page.tsx** - Update EmptyState with personality
```tsx
// BEFORE
<EmptyState
  icon=""
  title="No evolution reports yet"
  description="Generate your first evolution report to see your growth patterns over time."
  ctaLabel={user.tier !== 'free' ? 'Generate First Report' : undefined}
  ctaAction={user.tier !== 'free' ? () => window.scrollTo({ top: 0, behavior: 'smooth' }) : undefined}
/>

// AFTER
<EmptyState
  icon="🌱"
  title="Your Growth Story Awaits"
  description="With 12+ reflections, we can reveal the patterns in your transformation. Keep reflecting!"
  ctaLabel="Reflect Now"
  ctaAction={() => router.push('/reflection')}
/>
```

**6. app/visualizations/page.tsx** - Update EmptyState with personality
```tsx
// BEFORE
<EmptyState
  icon=""
  title="No visualizations yet"
  description="Create your first visualization to experience your dream as already achieved."
  ctaLabel="Generate First Visualization"
  ctaAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
/>

// AFTER
<EmptyState
  icon="🌌"
  title="See Your Dreams Come Alive"
  description="Visualizations paint your future as if it's already here. Ready to glimpse your destiny?"
  ctaLabel="Create First Visualization"
  ctaAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
/>
```

**7. app/dreams/page.tsx** - Update spacing classes
```tsx
// BEFORE
<GlassCard elevated className="mb-6">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <GradientText className="text-h1 mb-2">

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

// AFTER
<GlassCard elevated className="mb-lg">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
    <GradientText className="text-h1 mb-xs">

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md lg:gap-lg">
```

**8. app/evolution/page.tsx** - Update spacing classes
```tsx
// Similar pattern to Dreams page
// Replace mb-6 → mb-lg
// Replace gap-4 → gap-md
// Replace sm:gap-6 → lg:gap-lg (remove responsive breakpoint, use single responsive class)
```

**9. app/visualizations/page.tsx** - Update spacing classes
```tsx
// Similar pattern to Dreams page
```

### Dependencies
**Depends on:** Builder-2 (typography utilities in globals.css)
**Blocks:** None

**Coordination:**
- Wait for Builder-2 to create typography utilities
- Extend same globals.css file with spacing utilities (if needed)
- Merge after Builder-2 completes

### Implementation Notes

**Tailwind Config Extension:**
- Add spacing mapping under theme.extend.spacing
- Preserve existing Tailwind spacing (1, 2, 3, 4) for backward compatibility
- New spacing classes (xs, sm, md, lg, xl) reference CSS variables
- Run `npm run dev` to rebuild Tailwind after config changes

**Mirror.css Refactor:**
- Coordinate with Builder-2 (mirror.css touched by both builders)
- Builder-2 handles typography, Builder-3 handles spacing
- Both refactors independent (no conflicts)
- Test reflection output page after BOTH changes complete

**EmptyState Copy Updates:**
- Review all new copy for tone consistency
- Verify emojis render correctly (test on Windows, Mac, Linux)
- Get stakeholder approval on personality level before merging
- Test that longer descriptions don't break mobile layouts

**Spacing Class Replacement:**
- Search for "mb-6", "gap-4", "p-8" (common Tailwind spacing)
- Replace with mb-lg, gap-md, p-xl based on CSS variable mapping
- Remove responsive breakpoints (sm:gap-6) - clamp() handles responsiveness
- Keep layout breakpoints (sm:flex-row, lg:grid-cols-3)

**Card Padding Standardization:**
- Search all card components for padding values
- Standardize to var(--space-xl) (32-48px responsive)
- Verify DashboardCard, GlassCard, EmptyState all use consistent padding

### Patterns to Follow

**Spacing Consistency Pattern (from patterns.md):**
- Section: "Spacing Consistency Pattern" → All 4 subsections
- Follow Tailwind config extension exactly
- Use mirror.css replacement pattern
- Apply spacing class updates systematically

**Empty State Enhancement Pattern (from patterns.md):**
- Section: "Empty State Enhancement Pattern" → All 3 subsections
- Use provided copy examples (or improve upon them)
- Follow emoji selection guidance
- Test personality level (target 8/10)

### Testing Requirements

**Tailwind Config Testing:**
- Run `npm run dev` after config changes
- Apply gap-md to element → inspect computed style → verify uses var(--space-md)
- Test all new spacing classes (xs, sm, md, lg, xl, 2xl, 3xl)

**Mirror.css Testing:**
- Reflection output page: Create test reflection
- Verify spacing is comfortable (not cramped)
- Compare before/after screenshots
- Test on mobile (320px width)

**EmptyState Testing:**
- Dreams page: Navigate to empty state → verify emoji, copy, personality
- Evolution page: Navigate to empty state → verify correct emoji (🌱)
- Visualizations page: Navigate to empty state → verify correct emoji (🌌)
- Test CTAs work (buttons clickable, actions trigger)
- Test mobile layout (descriptions don't overflow)

**Spacing Class Testing:**
- Dreams page: Inspect gap classes → verify use CSS variables
- Verify card padding consistent (all cards ~32-48px)
- Verify section spacing consistent (~32-48px between major sections)
- Test mobile spacing (320px) - not cramped

**Emoji Rendering:**
- Test on Windows (Chrome, Edge)
- Test on Mac (Safari, Chrome)
- Test on Linux (Firefox)
- Test on mobile (iOS Safari, Android Chrome)
- Verify emojis render consistently (not boxes or question marks)

### Potential Split Strategy
If this task proves too complex, split into:

**Foundation (Primary Builder):**
- Extend Tailwind config with spacing
- Replace spacing in mirror.css
- Update EmptyState component typography
- **Estimate:** 2-3 hours

**Sub-builder 3A: EmptyState Enhancement**
- Update all EmptyState usage with emojis and copy
- Test personality level
- Get stakeholder approval
- **Estimate:** 2-3 hours

**Sub-builder 3B: Spacing Class Replacement**
- Systematically replace Tailwind spacing on Dreams/Evolution/Visualizations pages
- Verify card padding standardized
- Test mobile layouts
- **Estimate:** 2-3 hours

**Split Decision:** RECOMMENDED if Builder-3 feels overwhelmed (cleanly separates concerns)

---

## Integration Notes

### File Conflict Matrix

| File | Builder-1 | Builder-2 | Builder-3 | Conflict Risk |
|------|-----------|-----------|-----------|---------------|
| styles/variables.css | - | ✓ (typography) | - (read-only) | LOW |
| styles/globals.css | - | ✓ (typography utils) | ✓ (spacing utils) | LOW (append-only) |
| tailwind.config.ts | - | - | ✓ (spacing mapping) | NONE |
| styles/dashboard.css | ✓ (hover states) | - | - | NONE |
| styles/mirror.css | - | ✓ (typography) | ✓ (spacing) | LOW (different sections) |
| app/dashboard/page.tsx | ✓ (CTA upgrade) | ✓ (typography) | - | MEDIUM |
| app/dreams/page.tsx | - | ✓ (typography) | ✓ (spacing + EmptyState) | MEDIUM |
| app/evolution/page.tsx | ✓ (loading states) | ✓ (typography) | ✓ (EmptyState) | HIGH |
| app/visualizations/page.tsx | ✓ (loading states) | ✓ (typography) | ✓ (EmptyState) | HIGH |
| components/shared/EmptyState.tsx | - | ✓ (typography) | ✓ (spacing) | MEDIUM |

### Merge Order

**Sequence:**
1. **Builder-2 (Typography)** merges FIRST
   - Creates typography utilities in globals.css
   - Updates variables.css
   - Provides foundation for others

2. **Builder-3 (Spacing & EmptyState)** merges SECOND
   - Extends globals.css with spacing utilities (if needed)
   - Updates Tailwind config
   - Uses typography utilities from Builder-2

3. **Builder-1 (Dashboard)** merges LAST
   - Uses typography utilities from Builder-2
   - Uses spacing utilities from Builder-3
   - Final polish on dashboard

### Conflict Resolution

**High Conflict Files:**

**app/evolution/page.tsx:**
- Builder-1: Adds loading states (lines 40-50)
- Builder-2: Updates typography (lines 60-80)
- Builder-3: Updates EmptyState (lines 250-260)
- **Resolution:** Builders communicate on Slack, coordinate line numbers

**app/visualizations/page.tsx:**
- Builder-1: Adds loading states (lines 100-110)
- Builder-2: Updates typography (lines 120-140)
- Builder-3: Updates EmptyState (lines 260-270)
- **Resolution:** Same as Evolution page

**Medium Conflict Files:**

**app/dashboard/page.tsx:**
- Builder-1: Replaces "Reflect Now" button (lines 121-140)
- Builder-2: May update typography if button is inline
- **Resolution:** Builder-1's GlowButton component handles typography internally (no conflict)

**components/shared/EmptyState.tsx:**
- Builder-2: Updates className to use .text-h2, .text-body
- Builder-3: Updates className to use mb-md, mb-lg
- **Resolution:** Both update same lines - Builder-2 merges first, Builder-3 extends

### Testing After Integration

**Full Integration Test:**
1. Merge all feature branches to integration branch
2. Run `npm run dev` → verify app builds
3. Test ALL pages manually (Dashboard, Dreams, Evolution, Visualizations, Reflection)
4. Run Lighthouse audit (Performance + Accessibility)
5. Test mobile responsiveness (320px, 768px, 1024px)
6. Cross-browser testing (Chrome, Safari, Firefox)

**Smoke Test Checklist:**
- [ ] Dashboard loads without errors
- [ ] WelcomeSection shows personalized greeting
- [ ] "Reflect Now" CTA has cosmic glow
- [ ] Dashboard cards use CosmicLoader (no custom spinners)
- [ ] Evolution page shows loading state on all queries
- [ ] Visualizations page shows loading state on all queries
- [ ] All empty states have emojis and personality
- [ ] Typography consistent across all pages (no rogue text-3xl classes)
- [ ] Spacing consistent across all pages (no hardcoded mb-6 classes)
- [ ] Reflection output page renders correctly (mirror.css changes validated)

---

## Estimated Timeline

### Builder-1: Dashboard & Loading States
- **Minimum:** 4 hours (straightforward implementation)
- **Maximum:** 6 hours (if Safari performance issues with backdrop-filter)
- **Likely:** 5 hours

### Builder-2: Typography Enforcement
- **Minimum:** 4 hours (systematic but repetitive)
- **Maximum:** 6 hours (if mirror.css refactor breaks reflection output)
- **Likely:** 5 hours

### Builder-3: Spacing & EmptyState
- **Minimum:** 4 hours (config + copy updates)
- **Maximum:** 6 hours (if EmptyState copy requires multiple revisions)
- **Likely:** 5 hours

### Integration & Validation
- **Integration:** 30 minutes (merge + resolve conflicts)
- **Testing:** 2-3 hours (manual QA + Lighthouse + mobile + cross-browser)
- **Total:** 2.5-3.5 hours

### Grand Total
- **Minimum:** 14.5 hours (optimistic, everything smooth)
- **Maximum:** 21.5 hours (pessimistic, multiple issues)
- **Likely:** 17.5 hours (realistic with minor hiccups)

**Timeline:** 2-3 days with 3 builders working in parallel

---

## Success Validation

### Iteration 4 Complete When:
- [x] All builder tasks marked complete
- [x] All success criteria met (Dashboard, Loading, EmptyState, Typography, Spacing)
- [x] Integration successful (no merge conflicts remaining)
- [x] Manual QA passed on all pages
- [x] Lighthouse Performance: 90+ (maintained)
- [x] Lighthouse Accessibility: 95+ (improved)
- [x] Mobile testing passed (320px, 768px, 1024px)
- [x] Cross-browser testing passed (Chrome, Safari, Firefox)
- [x] Stakeholder approval on EmptyState personality
- [x] No regressions on reflection output page

---

*This task breakdown provides clear, actionable work for 3 builders to execute iteration 4 successfully in parallel with minimal coordination overhead.*
