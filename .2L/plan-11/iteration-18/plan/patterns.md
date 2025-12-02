# Code Patterns & Conventions

## File Structure

```
/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/
├── app/                          # Next.js App Router pages
│   ├── dashboard/
│   │   └── page.tsx
│   └── ...
├── components/
│   ├── ui/
│   │   └── glass/
│   │       ├── GlassCard.tsx      # MODIFY: Add whileTap
│   │       ├── GlassModal.tsx     # MODIFY: Mobile full-screen
│   │       ├── GlassInput.tsx     # MODIFY: 56px height
│   │       └── GlowButton.tsx     # MODIFY: Add haptic
│   ├── dashboard/
│   │   └── shared/
│   │       ├── DashboardCard.tsx  # Reference only
│   │       └── DashboardGrid.module.css  # MODIFY: Mobile card order
├── lib/
│   ├── animations/
│   │   └── variants.ts            # MODIFY: Add mobileModalVariants
│   ├── hooks/
│   │   └── useIsMobile.ts         # Use existing
│   └── utils/
│       └── haptics.ts             # Use existing
└── styles/
    └── dashboard.css              # MODIFY: Hover guards
```

---

## Naming Conventions

- **Components:** PascalCase (`GlassCard.tsx`, `GlowButton.tsx`)
- **Hooks:** camelCase with `use` prefix (`useIsMobile.ts`)
- **Utilities:** camelCase (`haptics.ts`)
- **CSS Modules:** camelCase with `.module.css` suffix
- **Animation variants:** camelCase (`mobileModalVariants`)

---

## Touch Feedback Pattern (CRITICAL)

### Standard whileTap Animation

**When to use:** All interactive cards and buttons

**Code example:**

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function InteractiveCard({ children, onClick }: Props) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className="cursor-pointer"
    >
      {children}
    </motion.div>
  );
}
```

**Key points:**
- Always check `prefersReducedMotion` before applying animation
- Use `scale: 0.98` as standard (subtle but noticeable)
- Keep transition duration at `0.1` seconds for snappy feedback
- Only apply to elements with click handlers

---

## Haptic Feedback Pattern

### Adding Haptic to Button Clicks

**When to use:** Primary buttons, navigation taps, important selections

**Code example:**

```tsx
'use client';

import { haptic } from '@/lib/utils/haptics';

export function GlowButton({ onClick, children }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    haptic('light');  // Trigger haptic BEFORE action
    onClick?.(e);
  };

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
}
```

**Key points:**
- Call `haptic()` at the START of the click handler
- Use `'light'` for most interactions
- Use `'medium'` for button presses
- Use `'success'` for completion states
- Function fails silently on unsupported devices

---

## Hover Guard Pattern (CRITICAL)

### CSS Media Query for Hover-Only Effects

**When to use:** Any CSS hover effect that shouldn't trigger on touch

**Code example (CSS):**

```css
/* Guard hover effects to prevent touch "stuck hover" */
@media (hover: hover) {
  .dashboard-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 20px 64px rgba(139, 92, 246, 0.4);
  }
}

/* Alternative: Active state for touch feedback */
.dashboard-card:active {
  transform: scale(0.98);
}
```

**Code example (Tailwind with CSS):**

```css
/* In dashboard.css or component CSS */
.card-hover-guard {
  transition: all 0.2s ease;
}

@media (hover: hover) {
  .card-hover-guard:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(124, 58, 237, 0.15);
  }
}

/* Touch feedback always available */
.card-hover-guard:active {
  transform: scale(0.99);
}
```

**Key points:**
- `@media (hover: hover)` targets devices with hover capability
- Always provide `:active` fallback for touch feedback
- Do NOT use `@media (hover: none)` alone - it's less reliable
- Test on both desktop and mobile after adding guards

---

## Mobile Modal Pattern

### Full-Screen Modal on Mobile

**When to use:** GlassModal component for mobile viewport

**Code example:**

```tsx
'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { mobileModalVariants, modalContentVariants } from '@/lib/animations/variants';

export function GlassModal({ isOpen, onClose, children }: Props) {
  const isMobile = useIsMobile();

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Dismiss if dragged down more than 100px
    if (info.offset.y > 100 && info.velocity.y > 0) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-mirror-dark/80 backdrop-blur-glass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Content Container */}
          <div className={cn(
            'fixed z-50',
            isMobile
              ? 'inset-x-0 bottom-0 top-0'  // Full screen mobile
              : 'inset-0 flex items-center justify-center p-4'  // Centered desktop
          )}>
            <motion.div
              variants={isMobile ? mobileModalVariants : modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'bg-mirror-void-deep/95 backdrop-blur-xl overflow-auto',
                isMobile
                  ? 'h-full w-full rounded-t-2xl pt-safe'  // Full screen
                  : 'w-full max-w-lg rounded-xl'           // Centered card
              )}
              // Enable swipe-to-dismiss on mobile
              drag={isMobile ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={isMobile ? handleDragEnd : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle for mobile */}
              {isMobile && (
                <div className="sticky top-0 flex justify-center py-3 bg-inherit">
                  <div className="w-12 h-1.5 bg-white/30 rounded-full" />
                </div>
              )}

              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Key points:**
- Use `useIsMobile()` for conditional rendering
- Mobile: full-screen with slide-up animation
- Desktop: centered card with fade animation
- Add drag handle visual indicator on mobile
- Swipe threshold: 100px + positive velocity

---

## Mobile Modal Animation Variant

### Add to variants.ts

**Code example:**

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

**Key points:**
- Use `y: '100%'` for percentage-based positioning
- Spring animation for natural bounce feel
- Faster exit (0.2s) than enter for responsive feel
- Damping 30 prevents excessive bounce

---

## Input Height Pattern

### GlassInput with 56px Minimum Height

**When to use:** All GlassInput instances

**Code example:**

```tsx
const baseClasses = cn(
  // Increase padding for 56px height
  'w-full px-4 py-4 rounded-xl',  // Changed from py-3 to py-4
  'min-h-[56px]',                  // Explicit minimum height
  'bg-white/5 backdrop-blur-sm',
  'border-2 transition-all duration-300',
  'text-white placeholder:text-white/40',
  'text-base',                     // Ensure readable font size
  'focus:outline-none',
  // ... rest of classes
);
```

**Calculation:**
- `py-4` = 16px top + 16px bottom = 32px vertical padding
- Base line height ~24px
- Total: 32 + 24 = 56px minimum

**Key points:**
- Change `py-3` to `py-4` in GlassInput
- Add `min-h-[56px]` as safety net
- Applies to both `input` and `textarea` types
- Label can stay `text-sm` but ensure adequate spacing

---

## Dashboard Card Ordering Pattern

### Mobile-First Card Priority

**When to use:** Dashboard grid on mobile

**Code example (CSS Module):**

```css
/* DashboardGrid.module.css */
.dashboardGrid {
  display: grid;
  gap: var(--space-lg);
}

/* Mobile: Stack all cards, primary first */
@media (max-width: 767px) {
  .dashboardGrid {
    grid-template-columns: 1fr;
  }

  /* Primary cards: Dreams and Reflections */
  .dashboardGrid > :nth-child(1),  /* DreamsCard */
  .dashboardGrid > :nth-child(2) { /* ReflectionsCard */
    order: -1;
  }

  /* Secondary cards: Smaller on mobile */
  .dashboardGrid > :nth-child(3),  /* ProgressStatsCard */
  .dashboardGrid > :nth-child(4),  /* EvolutionCard */
  .dashboardGrid > :nth-child(5),  /* VisualizationCard */
  .dashboardGrid > :nth-child(6) { /* SubscriptionCard */
    /* De-emphasize secondary cards */
    opacity: 0.9;
  }
}

/* Desktop: Original 2-column layout */
@media (min-width: 768px) {
  .dashboardGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .dashboardGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Key points:**
- Use `order: -1` to bring primary cards to top
- Do NOT hide secondary cards - just de-emphasize
- Maintain desktop layout unchanged
- Consider reducing padding on secondary cards for mobile

---

## Close Button Touch Target Pattern

### Ensuring 44px+ Touch Targets

**When to use:** Modal close buttons, action buttons

**Code example:**

```tsx
<button
  onClick={onClose}
  className={cn(
    'absolute top-4 right-4',
    'p-3',                         // Changed from p-2
    'min-w-[44px] min-h-[44px]',   // Explicit minimum size
    'flex items-center justify-center',
    'rounded-lg bg-white/10 hover:bg-white/20',
    'transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
  )}
  aria-label="Close modal"
>
  <X className="w-5 h-5 text-white" />
</button>
```

**Key points:**
- `p-3` provides 12px padding all around
- `min-w-[44px]` and `min-h-[44px]` ensure touch target size
- Icon size (20px) + padding (24px) = 44px
- Always include `aria-label` for accessibility

---

## Import Order Convention

```typescript
// 1. React and Next.js
'use client';
import { useState, useEffect, useRef } from 'react';

// 2. Third-party libraries
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// 3. Internal utilities
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';

// 4. Internal hooks
import { useIsMobile } from '@/lib/hooks/useIsMobile';

// 5. Internal animations
import { mobileModalVariants, modalContentVariants } from '@/lib/animations/variants';

// 6. Internal components
import { GlassCard } from './GlassCard';

// 7. Types
import type { GlassModalProps } from '@/types/glass-components';
```

---

## Testing Checklist Pattern

### Manual Mobile Testing Steps

**For touch feedback:**
1. Tap card/button - should see scale animation
2. Tap and hold - should stay scaled
3. Release - should spring back smoothly
4. Verify haptic vibration (Android only)

**For modal:**
1. Open modal on mobile - should slide up from bottom
2. Drag down slowly - should follow finger
3. Drag down past threshold - should dismiss
4. Drag down and release early - should snap back
5. Tap close button - should close smoothly

**For desktop regression:**
1. Hover on card - should lift and glow
2. Click card - should have active state
3. Open modal - should appear centered
4. Modal should NOT be full-screen on desktop

---

## Error Handling Pattern

### Graceful Degradation for Touch Features

**Code example:**

```typescript
// Haptic feedback fails silently
export function haptic(style: HapticStyle = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(HAPTIC_DURATIONS[style]);
    } catch {
      // Silent fail - haptic feedback is not critical
    }
  }
}

// Mobile detection with safe default
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);  // Default false for SSR

  useEffect(() => {
    // Only runs on client
    setIsMobile(window.innerWidth < 768);
  }, []);

  return isMobile;
}
```

**Key points:**
- All touch enhancements are progressive (enhance, don't break)
- SSR returns safe defaults
- Try-catch around browser APIs
- Features work without JavaScript (base functionality)

---

## Performance Pattern

### Avoiding Animation Jank

**Code example:**

```tsx
// Use transform and opacity only (GPU-accelerated)
const goodAnimation = {
  scale: 0.98,      // Uses transform
  opacity: 0.9,     // Uses opacity
  y: 0,             // Uses transform
};

// Avoid animating these (trigger reflow/repaint)
const badAnimation = {
  width: '100%',    // Triggers reflow
  height: 100,      // Triggers reflow
  top: 10,          // Triggers reflow
  padding: 20,      // Triggers reflow
};
```

**Key points:**
- Only animate `transform` and `opacity`
- Use `will-change: transform` for complex animations
- Keep transition durations under 300ms
- Use `type: 'spring'` instead of `type: 'tween'` for natural feel

---

## Code Quality Standards

- **TypeScript:** All components must be typed
- **Accessibility:** Include `aria-label` on icon-only buttons
- **Reduced Motion:** Always check `useReducedMotion()` before animating
- **Touch Targets:** Minimum 44px for all interactive elements
- **Comments:** Document non-obvious behavior (e.g., swipe threshold values)
