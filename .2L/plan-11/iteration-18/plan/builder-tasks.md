# Builder Task Breakdown

## Overview

**3 primary builders** will work in parallel.
**Estimated total time:** 4-5 hours (parallel execution)
**No splits recommended** - tasks are appropriately scoped.

## Builder Assignment Strategy

- Builders work on isolated component files
- Minimal file overlap (only `variants.ts` touched by one builder)
- Dependencies are minimal - all builders can work simultaneously
- CSS changes are additive, not conflicting

---

## Builder-1: Touch States & Haptics

### Scope

Add Framer Motion touch feedback to GlassCard, add haptic feedback to GlowButton, and guard DashboardCard hover effects with `@media (hover: hover)` in CSS.

### Complexity Estimate

**MEDIUM**

This task involves modifying 3 files with well-established patterns. No split needed.

### Success Criteria

- [ ] GlassCard has `whileTap={{ scale: 0.98 }}` animation with reduced motion support
- [ ] GlassCard is converted to use Framer Motion's `motion.div`
- [ ] GlowButton triggers `haptic('light')` on click
- [ ] DashboardCard CSS hover effects are wrapped in `@media (hover: hover)`
- [ ] Desktop hover behavior unchanged
- [ ] Touch feedback feels snappy (< 100ms perceived latency)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/components/ui/glass/GlassCard.tsx` | MODIFY | Add Framer Motion, whileTap |
| `/components/ui/glass/GlowButton.tsx` | MODIFY | Add haptic feedback |
| `/styles/dashboard.css` | MODIFY | Add hover guards |

### Dependencies

**Depends on:** None
**Blocks:** None (all builders can work in parallel)

### Implementation Notes

#### GlassCard Changes

```tsx
// BEFORE (line 23-59)
export function GlassCard({...}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(...)}
      ...
    >
      {children}
    </div>
  );
}

// AFTER
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GlassCardProps } from '@/types/glass-components';

export function GlassCard({
  elevated = false,
  interactive = false,
  onClick,
  className,
  children,
  ...props
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Determine if we should animate (interactive AND has onClick)
  const shouldAnimate = interactive && onClick && !prefersReducedMotion;

  return (
    <motion.div
      onClick={onClick}
      // Touch feedback animation
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.1 }}
      className={cn(
        // Base glass effect
        'backdrop-blur-crystal',
        'bg-gradient-to-br from-white/8 via-transparent to-purple-500/3',
        'border border-white/10',
        'rounded-xl p-6',
        'relative',
        // Elevated state
        elevated && 'shadow-lg border-white/15',
        // Interactive state (keep hover effects but guard in CSS if needed)
        interactive && [
          'cursor-pointer',
          'transition-all duration-250',
          'hover:-translate-y-0.5',
          'hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)]',
          'hover:border-purple-400/30',
          'active:scale-[0.99]',  // Keep CSS fallback
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2'
        ],
        className
      )}
      tabIndex={interactive ? 0 : props.tabIndex}
      role={interactive ? 'button' : props.role}
      onKeyDown={interactive && onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : props.onKeyDown}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

#### GlowButton Changes

```tsx
// Add import at top
import { haptic } from '@/lib/utils/haptics';

// Modify click handler (around line 85)
export function GlowButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  onClick,
  disabled = false,
}: GlowButtonProps) {

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      haptic('light');  // Add haptic feedback
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      onClick={handleClick}  // Use new handler
      disabled={disabled}
      className={cn(...)}
    >
      {children}
    </button>
  );
}
```

#### Dashboard CSS Hover Guards

Add at appropriate location in `/styles/dashboard.css`:

```css
/* Guard hover effects for touch devices */
/* Around line 680-720 where .dashboard-card:hover is defined */

/* REPLACE existing .dashboard-card:hover rules with: */
@media (hover: hover) {
  .dashboard-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow:
      0 20px 64px rgba(139, 92, 246, 0.4),
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border-color: rgba(147, 51, 234, 0.5);
  }
}

/* Touch feedback always available */
.dashboard-card:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}
```

### Patterns to Follow

- Use `whileTap={{ scale: 0.98 }}` pattern from `patterns.md`
- Use Haptic Feedback Pattern from `patterns.md`
- Use Hover Guard Pattern from `patterns.md`

### Testing Requirements

- [ ] Tap GlassCard on mobile - should see scale animation
- [ ] Tap GlowButton on Android - should feel haptic
- [ ] Hover DashboardCard on desktop - should lift and glow
- [ ] Touch DashboardCard on mobile - should NOT show hover effect
- [ ] Touch DashboardCard on mobile - should show active scale effect

---

## Builder-2: GlassModal Mobile Treatment

### Scope

Transform GlassModal to render full-screen on mobile with slide-up animation and swipe-to-dismiss gesture. Desktop behavior remains unchanged.

### Complexity Estimate

**MEDIUM-HIGH**

This task requires significant changes to GlassModal component and adding a new animation variant. The complexity is in getting the swipe gesture and conditional rendering right. No split needed but requires careful implementation.

### Success Criteria

- [ ] GlassModal renders full-screen on mobile (< 768px)
- [ ] Mobile modal slides up from bottom on open
- [ ] Mobile modal has drag handle indicator
- [ ] Swipe down past threshold (100px) dismisses modal
- [ ] Swipe down partially and release snaps back
- [ ] Desktop modal unchanged (centered, fade animation)
- [ ] Close button has 44px+ touch target
- [ ] Focus trapping still works on mobile

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/components/ui/glass/GlassModal.tsx` | MODIFY | Full-screen mobile treatment |
| `/lib/animations/variants.ts` | MODIFY | Add mobileModalVariants |

### Dependencies

**Depends on:** None
**Blocks:** None

### Implementation Notes

#### Add mobileModalVariants to variants.ts

Add after `bottomSheetBackdropVariants` (around line 423):

```typescript
/**
 * Mobile modal slide-up animation
 * Full-screen modal that slides up from bottom
 */
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
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};
```

#### GlassModal Complete Rewrite

```tsx
'use client';

import { AnimatePresence, motion, PanInfo, useReducedMotion } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { X } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';
import { modalOverlayVariants, modalContentVariants, mobileModalVariants } from '@/lib/animations/variants';
import { GlassCard } from './GlassCard';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';
import type { GlassModalProps } from '@/types/glass-components';

/**
 * GlassModal - Modal dialog with glass overlay
 * Mobile: Full-screen slide-up with swipe-to-dismiss
 * Desktop: Centered card with fade animation
 */
export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: GlassModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  // Auto-focus close button when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle swipe-to-dismiss gesture
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    // Dismiss if dragged down more than 100px with positive velocity
    if (info.offset.y > 100 && info.velocity.y > 0) {
      haptic('light');
      onClose();
    }
  }, [onClose]);

  // Handle close with haptic
  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock returnFocus>
          {/* Overlay */}
          <motion.div
            variants={prefersReducedMotion ? undefined : modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-mirror-dark/80 backdrop-blur-glass"
          />

          {/* Modal Container */}
          <div className={cn(
            'fixed z-50',
            isMobile
              ? 'inset-0'  // Full screen container on mobile
              : 'inset-0 flex items-center justify-center p-4'  // Centered on desktop
          )}>
            <motion.div
              variants={prefersReducedMotion ? undefined : (isMobile ? mobileModalVariants : modalContentVariants)}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                isMobile
                  ? 'h-full w-full flex flex-col'  // Full screen on mobile
                  : 'w-full max-w-lg'               // Card on desktop
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              // Enable swipe-to-dismiss on mobile only
              drag={isMobile && !prefersReducedMotion ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={isMobile ? handleDragEnd : undefined}
            >
              {isMobile ? (
                // Mobile: Full-screen glass container
                <div className={cn(
                  'flex-1 flex flex-col',
                  'bg-mirror-void-deep/95 backdrop-blur-xl',
                  'overflow-hidden',
                  className
                )}>
                  {/* Drag handle */}
                  <div className="flex justify-center py-3 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-white/30 rounded-full" />
                  </div>

                  {/* Close Button - Mobile */}
                  <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className={cn(
                      'absolute top-4 right-4 z-10',
                      'p-3 min-w-[44px] min-h-[44px]',
                      'flex items-center justify-center',
                      'rounded-lg bg-white/10 hover:bg-white/20',
                      'transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                    )}
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>

                  {/* Title - Mobile */}
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-2xl font-bold text-white px-6 pb-4 pr-16 flex-shrink-0"
                    >
                      {title}
                    </h2>
                  )}

                  {/* Scrollable Content - Mobile */}
                  <div className="flex-1 overflow-y-auto px-6 pb-6 pb-safe">
                    <div className="text-white/80">{children}</div>
                  </div>
                </div>
              ) : (
                // Desktop: GlassCard (existing behavior)
                <GlassCard elevated className={className}>
                  {/* Close Button - Desktop */}
                  <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className={cn(
                      'absolute top-4 right-4',
                      'p-3 min-w-[44px] min-h-[44px]',
                      'flex items-center justify-center',
                      'rounded-lg bg-white/10 hover:bg-white/20',
                      'transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                    )}
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>

                  {/* Title - Desktop */}
                  {title && (
                    <h2 id="modal-title" className="text-2xl font-bold text-white mb-4 pr-14">
                      {title}
                    </h2>
                  )}

                  {/* Content - Desktop */}
                  <div className="text-white/80">{children}</div>
                </GlassCard>
              )}
            </motion.div>
          </div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
}
```

### Patterns to Follow

- Use Mobile Modal Pattern from `patterns.md`
- Use Mobile Modal Animation Variant from `patterns.md`
- Use Close Button Touch Target Pattern from `patterns.md`

### Testing Requirements

- [ ] Open modal on mobile - slides up from bottom
- [ ] Drag modal down slowly on mobile - follows finger
- [ ] Drag down past 100px and release - modal dismisses
- [ ] Drag down 50px and release - modal snaps back
- [ ] Tap close button on mobile - modal closes
- [ ] Tap backdrop on mobile - modal closes
- [ ] Open modal on desktop - centered, fade animation
- [ ] Modal NOT draggable on desktop
- [ ] Escape key closes modal (both mobile and desktop)
- [ ] Focus returns to trigger element on close
- [ ] Tab key stays trapped within modal

---

## Builder-3: Form Polish & Dashboard

### Scope

Increase GlassInput height to 56px minimum and optimize dashboard card layout for mobile with Dreams and Reflections cards prioritized.

### Complexity Estimate

**LOW-MEDIUM**

These are primarily CSS changes with minimal logic. Straightforward implementation with clear patterns.

### Success Criteria

- [ ] GlassInput has minimum height of 56px
- [ ] GlassInput feels comfortable for thumb typing
- [ ] Dashboard: Dreams and Reflections cards appear first on mobile
- [ ] Dashboard: Secondary cards de-emphasized on mobile
- [ ] Dashboard: Desktop layout unchanged
- [ ] No visual regressions on desktop

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/components/ui/glass/GlassInput.tsx` | MODIFY | Increase height |
| `/components/dashboard/shared/DashboardGrid.module.css` | MODIFY | Mobile card ordering |
| `/styles/dashboard.css` | MODIFY | Secondary card styling |

### Dependencies

**Depends on:** None
**Blocks:** None

### Implementation Notes

#### GlassInput Height Increase

Modify `/components/ui/glass/GlassInput.tsx` around line 90-91:

```tsx
// BEFORE
const baseClasses = cn(
  'w-full px-4 py-3 rounded-xl',
  // ...
);

// AFTER
const baseClasses = cn(
  // Increased padding for 56px minimum height
  'w-full px-4 py-4 rounded-xl',  // Changed py-3 to py-4
  'min-h-[56px]',                  // Explicit minimum height
  'bg-white/5 backdrop-blur-sm',
  'border-2 transition-all duration-300',
  'text-white placeholder:text-white/40',
  'text-base',                     // Ensure readable text size
  'focus:outline-none',
  'focus:scale-[1.01]',
  'font-inherit',
  // ... rest of conditional classes
);
```

Also update textarea-specific styles if present. Ensure rows calculation accounts for new padding.

#### DashboardGrid Mobile Card Ordering

Modify `/components/dashboard/shared/DashboardGrid.module.css`:

```css
/* Base grid layout */
.dashboardGrid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, auto);
}

/* Mobile: Single column with primary cards first */
@media (max-width: 767px) {
  .dashboardGrid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  /* Ensure Dreams and Reflections are first */
  /* Card order in page.tsx: Dreams(1), Reflections(2), ProgressStats(3), Evolution(4), Visualization(5), Subscription(6) */
  /* Default order is already correct - Dreams and Reflections are children 1 and 2 */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  .dashboardGrid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-lg);
  }
}

/* Large desktop */
@media (min-width: 1024px) {
  .dashboardGrid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-xl);
  }
}

@media (min-width: 1200px) {
  .dashboardGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### Dashboard Secondary Card De-emphasis

Add to `/styles/dashboard.css`:

```css
/* Mobile: De-emphasize secondary cards */
@media (max-width: 767px) {
  /* Secondary cards: ProgressStats, Evolution, Visualization, Subscription */
  /* These are children 3-6 of the dashboard grid */
  .dashboard-grid > *:nth-child(n+3) {
    /* Slightly smaller and muted on mobile */
    transform: scale(0.98);
    opacity: 0.95;
  }

  /* Alternative approach: reduce card min-height on mobile for secondary cards */
  .dashboard-card {
    min-height: 160px;  /* More compact on mobile */
  }

  /* Primary cards (Dreams, Reflections) keep prominence */
  .dashboard-grid > *:nth-child(1),
  .dashboard-grid > *:nth-child(2) {
    transform: scale(1);
    opacity: 1;
  }
}
```

**Note:** The actual class names may vary - check the rendered HTML to confirm the correct selectors. The dashboard uses `.dashboardGrid` from the CSS module, not `.dashboard-grid`.

### Patterns to Follow

- Use Input Height Pattern from `patterns.md`
- Use Dashboard Card Ordering Pattern from `patterns.md`

### Testing Requirements

- [ ] GlassInput feels comfortable for thumb typing
- [ ] GlassInput height is at least 56px
- [ ] Textarea variant also has increased height
- [ ] Dashboard on mobile: Dreams and Reflections are prominent
- [ ] Dashboard on mobile: All 6 cards visible (none hidden)
- [ ] Dashboard on desktop: Layout unchanged
- [ ] Dashboard on tablet: 2-column layout works

---

## Builder Execution Order

### Parallel Group 1 (All builders - No dependencies)

All three builders can work simultaneously:

| Builder | Focus | Est. Time |
|---------|-------|-----------|
| Builder-1 | Touch States & Haptics | 1.5-2 hours |
| Builder-2 | GlassModal Mobile | 2-2.5 hours |
| Builder-3 | Forms & Dashboard | 1-1.5 hours |

### File Collision Matrix

| File | Builder-1 | Builder-2 | Builder-3 |
|------|-----------|-----------|-----------|
| GlassCard.tsx | MODIFY | - | - |
| GlowButton.tsx | MODIFY | - | - |
| GlassModal.tsx | - | MODIFY | - |
| GlassInput.tsx | - | - | MODIFY |
| variants.ts | - | MODIFY | - |
| dashboard.css | MODIFY | - | MODIFY |
| DashboardGrid.module.css | - | - | MODIFY |

**Potential Conflict:** Both Builder-1 and Builder-3 modify `dashboard.css`

**Resolution:**
- Builder-1 adds hover guards (around line 680-720)
- Builder-3 adds mobile card de-emphasis (new section at end)
- These are separate sections - no actual conflict

---

## Integration Notes

### Merge Strategy

1. All builders complete their tasks
2. Integration phase merges all changes
3. Run `npm run build` to verify no TypeScript errors
4. Run `npm run lint` to verify code quality

### Potential Conflict Areas

- **dashboard.css:** Both Builder-1 and Builder-3 modify, but different sections
- **Resolution:** Both changes are additive - merge both

### Shared Dependencies

- `framer-motion` - Already installed, no version conflicts
- `lib/utils/haptics.ts` - Used by Builder-1 and Builder-2 (read-only)
- `lib/hooks/useIsMobile.ts` - Used by Builder-2 (read-only)

### Post-Integration Testing

1. **GlassCard tap feedback** - Verify on mobile
2. **GlowButton haptic** - Verify on Android
3. **GlassModal mobile** - Verify slide-up and swipe
4. **GlassModal desktop** - Verify unchanged
5. **GlassInput height** - Verify 56px+
6. **Dashboard mobile** - Verify card order
7. **Dashboard desktop** - Verify no regressions

---

## Final Checklist

Before marking iteration complete:

- [ ] All 3 builders completed their tasks
- [ ] All success criteria met
- [ ] `npm run build` passes
- [ ] Manual testing on iOS Safari
- [ ] Manual testing on Android Chrome
- [ ] Manual testing on desktop Chrome
- [ ] No console errors
- [ ] No visual regressions on desktop
- [ ] Performance: Touch feedback < 100ms
- [ ] Performance: Modal animation 60fps
