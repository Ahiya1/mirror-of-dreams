# Explorer 2 Report: Forms, Modals & Mobile Optimization

## Executive Summary

This report analyzes form handling, modal behavior, and mobile optimization opportunities for Iteration 18 (Touch Polish & Dashboard Optimization). The codebase has a solid foundation with `GlassInput`, `GlassModal`, and `BottomSheet` components. However, CSS uses predominantly **desktop-first (max-width)** patterns, requiring a migration to mobile-first (min-width) breakpoints. Pull-to-refresh does not exist and would need custom implementation. Touch targets are mostly adequate but several buttons need 48px+ minimum sizing.

---

## Discoveries

### 1. Form Components Inventory

#### GlassInput (`/components/ui/glass/GlassInput.tsx`)
- **Line 91**: Height set via `py-3` (12px top + 12px bottom) = approximately 44-48px total height
- **Current styling**: `w-full px-4 py-3 rounded-xl`
- **Features**:
  - Supports `text`, `textarea`, and `password` types
  - Word/character counter with color shift animation
  - Error/success states with shake animation
  - Focus glow animation via Framer Motion
  - Password toggle support
- **Missing for mobile**:
  - No explicit `min-height: 56px` as per vision
  - No auto-scroll on focus for keyboard handling
  - No form persistence to localStorage

#### CreateDreamModal Form Inputs (`/components/dreams/CreateDreamModal.tsx`)
- **Lines 92-101**: Custom input styling (not using GlassInput)
- **Height**: `px-4 py-3` - approximately 44-48px
- **Styling**: `bg-white/5 backdrop-blur-glass-sm border-2 border-white/10`
- **Issue**: Inconsistent - uses inline styles instead of GlassInput component

#### ReflectionFilters (`/components/reflections/ReflectionFilters.tsx`)
- **Line 67**: Search input with `py-3 pl-10 pr-4`
- **Lines 86-114**: Filter buttons with `px-4 py-2`
- **Issue**: Filter buttons have small touch targets (~36px height)

### 2. Input Types Analysis

| Component | Input Type | Current Height | Target Height |
|-----------|------------|---------------|---------------|
| GlassInput | text/textarea | ~44-48px (py-3) | 56px |
| CreateDreamModal | text | ~44-48px (py-3) | 56px |
| ReflectionFilters | search | ~44px (py-3) | 56px |
| Date picker | date | ~44-48px (py-3) | 56px |
| Select | select | ~44-48px (py-3) | 56px |

### 3. Current Input Heights and Padding

```css
/* From GlassInput.tsx line 91 */
'w-full px-4 py-3 rounded-xl'
/* px-4 = 16px horizontal, py-3 = 12px vertical */
/* Total approx height: 12 + line-height + 12 = ~44-48px */

/* From variables.css line 310 */
--input-height: 52px;
--button-height: 52px;
/* Note: These CSS variables exist but are NOT used consistently */
```

---

## Mobile-First CSS Patterns Analysis

### Current Breakpoint Strategy: DESKTOP-FIRST (max-width)

The codebase **predominantly uses desktop-first `max-width` breakpoints**:

```css
/* dashboard.css - Lines 1727-1830 (35+ max-width media queries) */
@media (max-width: 1024px) { ... }
@media (max-width: 768px) { ... }
@media (max-width: 480px) { ... }

/* DashboardGrid.module.css - Lines 28-60 */
@media (max-width: 1024px) { ... }
@media (max-width: 768px) { ... }
@media (max-width: 480px) { ... }
```

**Files with desktop-first patterns:**
- `/styles/dashboard.css` - 35+ `max-width` queries
- `/styles/mirror.css` - 12+ `max-width` queries
- `/components/dashboard/shared/DashboardGrid.module.css` - 4 `max-width` queries
- `/components/dashboard/shared/WelcomeSection.module.css` - 2 `max-width` queries
- `/components/dashboard/shared/ReflectionItem.module.css` - 2 `max-width` queries
- `/styles/auth.css` - 3 `max-width` queries

**Minimal mobile-first patterns found:**
- `/styles/auth.css:238` - One hybrid query: `@media (max-width: 768px) and (min-width: 481px)`
- `/public/shared/foundation.css` - Some min-width queries for tablet/desktop

### Migration Required

To achieve mobile-first CSS:

1. **Flip all media queries**:
   ```css
   /* BEFORE (desktop-first) */
   .element { width: 50%; }
   @media (max-width: 768px) { .element { width: 100%; } }
   
   /* AFTER (mobile-first) */
   .element { width: 100%; }
   @media (min-width: 768px) { .element { width: 50%; } }
   ```

2. **Priority files to migrate**:
   - `/styles/dashboard.css` - Highest impact
   - `/components/dashboard/shared/DashboardGrid.module.css` - Dashboard layout
   - Card-specific styles in each card component

3. **Tailwind already mobile-first**: 
   - Tailwind's `md:`, `lg:` etc. are min-width by default
   - Continue using Tailwind for new code

---

## Pull-to-Refresh Analysis

### Current State: NOT IMPLEMENTED

Searched for `pull-to-refresh`, `onPullDown`, `usePullToRefresh` - **no results** in codebase.

**Referenced in planning documents:**
- `vision.md:75` - Listed as acceptance criteria for dashboard
- `vision.md:140` - Listed as Should-Have feature
- `master-plan.yaml:184` - Listed for Iteration 3

### Implementation Approach

**Option 1: Framer Motion Custom Hook (Recommended)**
```typescript
// lib/hooks/usePullToRefresh.ts
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const handleDragEnd = useCallback(async (_: any, info: PanInfo) => {
    if (info.offset.y > 80 && info.velocity.y > 0) { // Threshold
      setIsPulling(true);
      await onRefresh();
      setIsPulling(false);
    }
    setPullDistance(0);
  }, [onRefresh]);
  
  return { isPulling, pullDistance, handleDragEnd };
}
```

**Option 2: Third-party library**
- `react-pull-to-refresh` - Simple, lightweight
- `react-use-gesture` + Framer Motion - More control

### Pages That Would Benefit

1. **Dashboard (`/app/dashboard/page.tsx`)** - Primary candidate
   - Already has `handleRefreshData` function (line 62)
   - Would refresh all dashboard cards

2. **Dreams List (`/app/dreams/page.tsx`)** - High value
   - Refresh active dreams list

3. **Reflections List (`/app/reflections/page.tsx`)** - Medium value
   - Refresh reflection history

---

## Touch Target Audit

### Minimum Touch Target Standards
- **iOS HIG**: 44x44pt minimum
- **Android Material**: 48x48dp recommended
- **WCAG 2.5.5**: 44x44 CSS pixels minimum

### Current Touch Target Analysis

#### Adequate Touch Targets (48px+)
| Component | Touch Target | Source |
|-----------|-------------|--------|
| BottomNavigation tabs | 64px height, flex-1 width | Line 130: `h-16` |
| GlowButton (lg) | ~56px | `py-4 text-lg` |
| MobileReflectionFlow dream items | 60px | Line 345: `min-h-[60px]` |
| GlowButton (md) | ~48px | `py-3 text-base` |

#### Undersized Touch Targets (Need 48px+)
| Component | Current Size | Location |
|-----------|-------------|----------|
| GlowButton (sm) | ~36px | `/components/ui/glass/GlowButton.tsx:79` `py-2` |
| Filter buttons | ~36px | `/components/reflections/ReflectionFilters.tsx:86` `px-4 py-2` |
| Dream "Reflect" button | ~32-36px | `/components/dashboard/cards/DreamsCard.tsx:140-143` `cosmic-button--sm` |
| Header action links | ~32px | `/styles/dashboard.css:688` `padding: var(--space-2) var(--space-3)` |
| Dropdown menu items | ~32px | `/styles/dashboard.css:476` `padding: var(--space-2) var(--space-3)` |
| Modal close button | ~36px | `/components/ui/glass/GlassModal.tsx:94` `p-2` |
| Toast close button | ~32px | `/styles/dashboard.css:1647` `padding: var(--space-1)` |

### Touch Target Fixes Required

```tsx
// GlowButton sizes - Update in GlowButton.tsx
const sizes = {
  sm: 'px-4 py-2.5 text-sm min-h-[44px]',  // was py-2
  md: 'px-6 py-3 text-base min-h-[48px]',   // keep
  lg: 'px-8 py-4 text-lg min-h-[56px]',     // keep
};

// Modal close button - GlassModal.tsx line 94
className="p-3 min-w-[44px] min-h-[44px]..."  // was p-2

// Dashboard card actions - dashboard.css
.dashboard-card__header-action {
  min-height: 44px;
  padding: var(--space-3);  // was space-2 space-3
}
```

---

## Dashboard Mobile Optimization Analysis

### Current Dashboard Layout

```
/app/dashboard/page.tsx - Lines 134-163

Dashboard Grid (6 cards in 3x2 on desktop):
1. DreamsCard (Primary)
2. ReflectionsCard (Primary)  
3. ProgressStatsCard (Secondary)
4. EvolutionCard (Secondary)
5. VisualizationCard (Tertiary)
6. SubscriptionCard (Tertiary)
```

### Mobile Prioritization Strategy

**Primary Cards (Always visible on mobile):**
1. **DreamsCard** - Core user data
2. **ReflectionsCard** - Core user data

**Secondary Cards (Collapsed or horizontal scroll):**
3. **ProgressStatsCard** - Convert to horizontal scroll stat strip
4. **EvolutionCard** - Collapse by default

**Tertiary Cards (Move to profile/dedicated pages):**
5. **VisualizationCard** - Move to /visualizations
6. **SubscriptionCard** - Move to /profile

### Horizontal Scroll Stats Strip Implementation

```tsx
// Proposed: components/dashboard/mobile/StatsStrip.tsx
<div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
  <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
    <StatCard icon="🔥" value={streak} label="Day Streak" />
    <StatCard icon="📝" value={reflections} label="This Month" />
    <StatCard icon="💭" value={dreams} label="Active Dreams" />
    <StatCard icon="🎯" value={completionRate} label="Completion" />
  </div>
</div>
```

### Hero Section Compacting

**Current DashboardHero** (`/components/dashboard/DashboardHero.tsx`):
- Desktop padding: `var(--space-3xl)` (64-96px)
- Mobile padding: `var(--space-xl)` (32-48px)

**Recommended mobile changes:**
```css
/* Mobile-first approach */
.dashboard-hero {
  padding: var(--space-lg) var(--space-sm);  /* Tighter on mobile */
}

@media (min-width: 768px) {
  .dashboard-hero {
    padding: var(--space-3xl) var(--space-lg);  /* Original desktop */
  }
}
```

---

## Modal Mobile Optimization

### Current GlassModal Behavior (`/components/ui/glass/GlassModal.tsx`)

```tsx
// Line 74-81 - Fixed centered positioning
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <motion.div className="w-full max-w-lg">
    // Content
  </motion.div>
</div>
```

**Issues:**
1. Uses centered positioning (desktop pattern)
2. No full-screen on mobile
3. No slide-up animation from bottom
4. No swipe-to-dismiss

### Required Mobile Modal Changes

```tsx
// Conditional mobile behavior
const isMobile = useIsMobile();

return (
  <motion.div
    className={cn(
      'fixed z-50',
      isMobile 
        ? 'inset-0' // Full screen on mobile
        : 'inset-0 flex items-center justify-center p-4'
    )}
    variants={isMobile ? mobileModalVariants : modalContentVariants}
  >
    <motion.div
      className={cn(
        'bg-mirror-void-deep/95 backdrop-blur-xl',
        isMobile
          ? 'h-full w-full rounded-none'
          : 'w-full max-w-lg rounded-xl'
      )}
      // Enable swipe-to-dismiss on mobile
      drag={isMobile ? 'y' : false}
      dragConstraints={{ top: 0 }}
      onDragEnd={handleSwipeDismiss}
    >
```

### New Animation Variant Needed

```typescript
// Add to lib/animations/variants.ts
export const mobileModalVariants: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};
```

---

## Form Persistence Patterns

### Current State: PARTIAL

**MobileReflectionFlow already has localStorage persistence** (lines 121-123):
```tsx
const STORAGE_KEY = 'MIRROR_REFLECTION_DRAFT';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
```

### Recommended General Form Persistence Hook

```typescript
// lib/hooks/useFormPersistence.ts
export function useFormPersistence<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    const stored = localStorage.getItem(key);
    if (!stored) return initialValue;
    
    try {
      const { data, expiry } = JSON.parse(stored);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(key);
        return initialValue;
      }
      return data;
    } catch {
      return initialValue;
    }
  });
  
  const persist = useCallback((newValue: T, expiryMs?: number) => {
    setValue(newValue);
    const toStore = expiryMs 
      ? { data: newValue, expiry: Date.now() + expiryMs }
      : { data: newValue };
    localStorage.setItem(key, JSON.stringify(toStore));
  }, [key]);
  
  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);
  
  return { value, persist, clear };
}
```

---

## Existing Touch Interaction Patterns

### Components with `whileTap` Already

| Component | Location | whileTap Value |
|-----------|----------|----------------|
| GlassCard | Line 42 | `active:scale-[0.99]` (CSS) |
| DreamCard | Line 48 | `{ scale: 0.98 }` |
| DashboardCard | Line 107 | `cardPressVariants.tap` |
| MobileReflectionFlow buttons | Line 342 | `{ scale: 0.98 }` |
| DreamBottomSheet items | Lines 203, 261 | `{ scale: 0.98 }` |
| ToneSelectionCard | Line 100 | `{ scale: 0.98 }` |
| ToneStep | Line 94 | `{ scale: 0.98 }` |

### Recommended Standard

```tsx
// Standard touch feedback pattern
whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
```

Apply this pattern to:
- All `GlowButton` variants
- All card components
- All list items that are tappable

---

## Recommendations for Builder

### Priority 1: Touch Target Fixes (HIGH)

1. **Update GlowButton sizes** to ensure 44px minimum
2. **Fix modal close button** padding from p-2 to p-3
3. **Fix dashboard header actions** to min-height 44px
4. **Fix filter buttons** in ReflectionFilters

### Priority 2: GlassModal Mobile Treatment (HIGH)

1. Add `useIsMobile()` hook usage
2. Implement full-screen on mobile
3. Add slide-up animation from bottom
4. Add swipe-to-dismiss gesture

### Priority 3: GlassInput Enhancement (MEDIUM)

1. Increase default height to 56px minimum
2. Add auto-scroll on focus (keyboard handling)
3. Apply to all forms consistently (including CreateDreamModal)

### Priority 4: Dashboard Mobile Layout (MEDIUM)

1. Create `StatsStrip` horizontal scroll component
2. Implement card prioritization (primary visible, secondary collapsed)
3. Compact hero section for mobile

### Priority 5: Pull-to-Refresh (LOW)

1. Create `usePullToRefresh` hook
2. Implement on dashboard first
3. Add to dreams and reflections lists

### Priority 6: CSS Migration (LOW for this iteration)

1. Document current max-width usage
2. Plan migration to min-width for future iteration
3. Use Tailwind mobile-first classes for new code

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `/components/ui/glass/GlowButton.tsx` | Update size padding, add min-height |
| `/components/ui/glass/GlassModal.tsx` | Add mobile full-screen, swipe dismiss |
| `/components/ui/glass/GlassInput.tsx` | Increase height to 56px, keyboard scroll |
| `/styles/dashboard.css` | Update touch target sizes |
| `/lib/animations/variants.ts` | Add mobileModalVariants |
| `/app/dashboard/page.tsx` | Integrate StatsStrip, card prioritization |

---

## Questions for Planner

1. Should we migrate dashboard.css from desktop-first to mobile-first in this iteration, or defer to a dedicated CSS refactoring iteration?

2. For dashboard card prioritization on mobile, should VisualizationCard and SubscriptionCard be:
   - Hidden entirely on mobile (moved to profile)?
   - Collapsed with expand button?
   - Moved to a "More" tab?

3. Pull-to-refresh priority: Should this be included in this iteration or deferred to a follow-up?

---

## Resource Map

### Critical Files/Directories
- `/components/ui/glass/` - GlassInput, GlassModal, GlowButton
- `/components/ui/mobile/BottomSheet.tsx` - Existing mobile pattern
- `/styles/dashboard.css` - Primary CSS file (1900+ lines)
- `/lib/animations/variants.ts` - Animation definitions
- `/lib/hooks/` - useIsMobile, useKeyboardHeight

### Key Dependencies
- `framer-motion` - Animation and gesture handling
- `react-focus-lock` - Modal accessibility
- `tailwindcss-animate` - CSS animations

### Testing Infrastructure
- Manual testing on iOS Safari and Android Chrome required
- Chrome DevTools mobile simulation for initial development
- Real device testing before merge
