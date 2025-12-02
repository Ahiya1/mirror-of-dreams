# Explorer 2 Report: Technology Patterns & Dependencies

## Executive Summary

The Mirror of Dreams codebase has a solid foundation for mobile navigation implementation. Framer Motion 11.18.2 is already well-integrated with comprehensive animation variants including `modalContentVariants`, `slideUpVariants`, and `fadeInVariants`. The project uses lucide-react 0.546.0 for icons, with `Home`, `Menu`, `X`, and other icons already imported in existing navigation components. A key gap is the absence of scroll direction detection hooks and safe area CSS variables for notched devices. The existing `FloatingNav.tsx` component provides a starting point but needs significant adaptation for a fixed bottom navigation pattern.

---

## Discoveries

### Framer Motion Patterns

#### Animation Variants Available (`/lib/animations/variants.ts`)

| Variant | Purpose | Mobile Suitability |
|---------|---------|-------------------|
| `cardVariants` | Entrance fade + slide up (y: 20 -> 0) | Good for nav item entrance |
| `modalOverlayVariants` | Backdrop fade in/out | Reusable for overlay states |
| `modalContentVariants` | Slide up + fade (y: 20 -> 0) | Needs deeper slide (y: 100%) for bottom nav |
| `slideUpVariants` | Slide from bottom with fade | Good starting point |
| `fadeInVariants` | Simple opacity fade | Good for subtle transitions |
| `staggerContainer` / `staggerItem` | Staggered children | Useful for nav item entrance |
| `cardPressVariants` | `scale: 0.98` on tap | Perfect for nav tap feedback |

**Key File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/animations/variants.ts`

#### Animation Configuration (`/lib/animations/config.ts`)

```typescript
// Existing easings - use for consistent motion
export const easings = {
  easeOut: [0.4, 0, 0.2, 1] as const,
  spring: { type: 'spring' as const, damping: 15, stiffness: 100 },
};

// Duration presets - fast is ideal for mobile nav
export const durations = {
  fast: 0.15,    // Good for tap feedback
  normal: 0.3,  // Good for show/hide animations
  slow: 0.6,    // Too slow for nav
};
```

**Key File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/animations/config.ts`

#### AnimatePresence Usage Patterns

Found in 7 files. Key patterns:

**1. Page Transitions (`/app/template.tsx`):**
```typescript
<AnimatePresence mode="wait">
  <motion.div key={pathname} variants={pageTransitionVariants} ... />
</AnimatePresence>
```
- Uses `mode="wait"` for sequential transitions
- Respects `useReducedMotion`

**2. Dropdown Menus (`/components/shared/AppNavigation.tsx`):**
```typescript
<AnimatePresence>
  {showUserDropdown && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    />
  )}
</AnimatePresence>
```
- Inline animations (not variants)
- 200ms transition duration

**3. Modal Dialogs (`/components/ui/glass/GlassModal.tsx`):**
```typescript
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div variants={modalOverlayVariants} ... />
      <motion.div variants={modalContentVariants} ... />
    </>
  )}
</AnimatePresence>
```
- Uses predefined variants
- Separate overlay and content animations

---

### Scroll Detection

#### Current State: NO SCROLL HOOKS EXIST

Searched for `useScroll`, `scrollY`, `onScroll`, `scrollTop` - no scroll direction detection found in the codebase.

**Existing scroll-related code:**
- `useStaggerAnimation.ts` uses `IntersectionObserver` for visibility (not scroll direction)
- `MirrorExperience.tsx` has CSS scroll styling for form container

#### What useScrollDirection Hook Needs

Based on the iteration requirements (hide on scroll down, reveal on scroll up), the hook should:

```typescript
// Recommended implementation pattern
import { useState, useEffect, useRef } from 'react';

type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  threshold?: number;        // Minimum scroll distance before detecting (default: 10px)
  throttleMs?: number;       // Throttle scroll events (default: 100ms)
}

export function useScrollDirection(options?: UseScrollDirectionOptions): ScrollDirection {
  const { threshold = 10, throttleMs = 100 } = options ?? {};
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const lastTimestamp = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastTimestamp.current < throttleMs) return;
      
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      
      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? 'down' : 'up');
        lastScrollY.current = currentY;
        lastTimestamp.current = now;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, throttleMs]);

  return direction;
}
```

**Key considerations:**
- Use passive event listener for performance
- Throttle to ~100ms to avoid jank
- Threshold prevents jitter on small scrolls
- Return `null` initially (show nav by default)

---

### Mobile Detection

#### Current State: LIMITED

No `useMediaQuery` or `useIsMobile` hooks exist in the codebase.

**Current responsive patterns:**

1. **CSS Classes (Tailwind):**
   - `hidden sm:inline` - Hide on mobile, show on small+
   - `sm:hidden` - Show on mobile only
   - `lg:hidden` / `hidden lg:flex` - Breakpoint-based visibility

2. **Breakpoint Values (`/styles/variables.css`):**
   ```css
   --breakpoint-sm: 640px;
   --breakpoint-md: 768px;   /* Primary mobile breakpoint */
   --breakpoint-lg: 1024px;
   --breakpoint-xl: 1280px;
   ```

3. **Tailwind Defaults:**
   - `sm:` = 640px+
   - `md:` = 768px+ (recommended for bottom nav hide point)
   - `lg:` = 1024px+

#### What useIsMobile Hook Needs

```typescript
import { useState, useEffect } from 'react';

interface UseIsMobileOptions {
  breakpoint?: number;  // Default: 768 (md breakpoint)
}

export function useIsMobile(options?: UseIsMobileOptions): boolean {
  const { breakpoint = 768 } = options ?? {};
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check (avoid hydration mismatch)
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    
    // Check on mount
    checkMobile();
    
    // Listen for resize
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
```

**Alternative: CSS-only approach** (recommended for nav visibility):
```tsx
// Use Tailwind classes directly - no JS needed
<nav className="fixed bottom-0 md:hidden">
  {/* Bottom nav - hidden on 768px+ */}
</nav>
```

---

### Icon Library

#### Library: lucide-react v0.546.0

**Currently Used Icons (from grep):**
```typescript
// Navigation
import { Menu, X } from 'lucide-react';  // AppNavigation, LandingNavigation

// Actions
import { Check } from 'lucide-react';    // MirrorExperience
import { AlertTriangle } from 'lucide-react';  // Warnings

// Design system showcase
import { Sparkles, Moon, Star, Home, Settings } from 'lucide-react';

// Subscription
import { Lock, Zap, Infinity, Clock } from 'lucide-react';
import { TrendingUp, Ban } from 'lucide-react';

// UI
import { CheckCircle, XCircle, Info } from 'lucide-react';  // Toast
```

#### Icons Needed for Bottom Navigation

| Tab | Recommended Icon | lucide-react Name | Fallback Emoji |
|-----|------------------|-------------------|----------------|
| Home | Home icon | `Home` | "Home" already imported |
| Dreams | Star/sparkle | `Sparkles` or `Star` | Already imported |
| Reflect | Mirror-like | `Layers` or `RefreshCw` | No mirror icon available |
| Evolution | Chart/growth | `TrendingUp` or `BarChart2` | `TrendingUp` imported |
| Profile | User | `User` or `UserCircle` | Not yet imported |

**Icon Import Pattern:**
```typescript
import { 
  Home, 
  Sparkles,       // Dreams
  Layers,         // Reflect (or use custom mirror emoji)
  TrendingUp,     // Evolution
  User            // Profile
} from 'lucide-react';
```

**Current Navigation Uses Emojis:**
```typescript
// From AppNavigation.tsx
<span>Home</span>    // Uses text + emoji "Home"
<span>Dreams</span>   // Uses text + emoji "Dreams"
<span>Reflect</span>  // Uses text + emoji "Reflect"
<span>Evolution</span> // Uses text + emoji "Evolution"
```

**Recommendation:** For bottom nav, use lucide-react icons for cleaner look at small sizes. Emojis work for desktop nav but icons scale better.

---

### Haptic Feedback

#### Current Implementation

Found in 3 components:

**1. ToneSelection (`/components/reflection/ToneSelection.tsx`):**
```typescript
if (typeof navigator !== 'undefined' && navigator.vibrate) {
  navigator.vibrate(50);  // 50ms vibration
}
```

**2. Questionnaire (legacy JSX):**
```typescript
if (typeof navigator !== "undefined" && navigator.vibrate) {
  navigator.vibrate(50);  // 50ms vibration
}
```

**3. FeedbackSection (legacy JSX):**
```typescript
navigator.vibrate(30);  // 30ms vibration
```

#### Recommended Haptic Implementation Pattern

```typescript
// /lib/utils/haptics.ts

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

const HAPTIC_DURATIONS: Record<HapticStyle, number | number[]> = {
  light: 10,           // Quick tap feedback
  medium: 25,          // Button press
  heavy: 50,           // Significant action
  success: [15, 50, 30], // Double-tap pattern for success
  warning: [30, 30, 30], // Triple-tap for warning
};

export function haptic(style: HapticStyle = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(HAPTIC_DURATIONS[style]);
    } catch {
      // Silently fail - vibration not critical
    }
  }
}

// Usage in bottom nav:
const handleTabPress = (tab: string) => {
  haptic('light');  // Quick feedback
  navigate(tab);
};
```

**Browser Support:**
- Chrome Android: Full support
- Safari iOS: **NOT SUPPORTED** (uses Taptic Engine via native API)
- Firefox: Partial support

**iOS Alternative:** No web API for iOS haptics. Rely on CSS `active` states for visual feedback instead.

---

## Patterns Identified

### Pattern 1: Motion Component with Variants

**Description:** Wrap elements in `motion.div` with predefined variants for consistent animations.

**Use Case:** Bottom nav show/hide animation.

**Example from codebase:**
```typescript
// From GlassModal.tsx
<motion.div
  variants={modalContentVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
/>
```

**Recommendation:** Create `bottomNavVariants` following this pattern.

### Pattern 2: Conditional Mobile Rendering

**Description:** Use responsive Tailwind classes instead of JS-based media queries when possible.

**Use Case:** Show bottom nav on mobile only.

**Example:**
```tsx
// Preferred: CSS-based (no hydration issues)
<nav className="fixed bottom-0 inset-x-0 md:hidden">
  {/* Bottom nav */}
</nav>

// Alternative: JS-based (for complex logic)
{isMobile && <BottomNavigation />}
```

**Recommendation:** Use `md:hidden` for bottom nav visibility toggle.

### Pattern 3: Haptic on User Action

**Description:** Trigger haptic feedback on intentional user interactions.

**Use Case:** Tab tap in bottom navigation.

**Example from ToneSelection:**
```typescript
const handleSelect = (option: string) => {
  if (navigator?.vibrate) {
    navigator.vibrate(50);
  }
  onSelect(option);
};
```

**Recommendation:** Use 10-25ms duration for nav taps (lighter than 50ms).

---

## Complexity Assessment

### Low Complexity Areas

| Component | Notes |
|-----------|-------|
| **useIsMobile hook** | Straightforward media query listener |
| **Haptic utility** | Simple wrapper for navigator.vibrate |
| **Icon selection** | lucide-react has all needed icons |
| **Safe area CSS** | Add CSS variables, minimal risk |

### Medium Complexity Areas

| Component | Notes |
|-----------|-------|
| **useScrollDirection hook** | Needs throttling and threshold logic |
| **Bottom nav show/hide** | Combine scroll direction with animation |
| **Active state indicator** | Animated pill/underline that moves between tabs |

### High Complexity Areas

| Component | Notes |
|-----------|-------|
| **Integration with AppNavigation** | Must not break desktop navigation |
| **Page content padding** | All pages need bottom padding when nav visible |

---

## Technology Recommendations

### Primary Stack (Already in Place)

| Technology | Version | Status |
|------------|---------|--------|
| Framer Motion | ^11.18.2 | Installed, well-used |
| lucide-react | ^0.546.0 | Installed, partially used |
| Tailwind CSS | Latest | Installed, breakpoints defined |

### New Hooks to Create

```
/lib/hooks/
  useScrollDirection.ts   # NEW - for nav hide/show
  useIsMobile.ts          # NEW - optional, CSS may suffice
```

### New Utilities to Create

```
/lib/utils/
  haptics.ts              # NEW - haptic feedback wrapper
```

### Animation Variants to Add (`/lib/animations/variants.ts`)

```typescript
// Bottom navigation show/hide
export const bottomNavVariants: Variants = {
  hidden: { 
    y: '100%', 
    opacity: 0 
  },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    y: '100%', 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Active tab indicator (pill that moves)
export const tabIndicatorVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
};
```

---

## Integration Points

### Internal Integrations

| Component A | Component B | Integration Notes |
|-------------|-------------|-------------------|
| BottomNavigation | AppNavigation | Bottom nav replaces hamburger menu on mobile |
| BottomNavigation | useScrollDirection | Nav hides/shows based on scroll |
| BottomNavigation | All page layouts | Pages need `pb-20` padding on mobile |

### External APIs

None required for this iteration. All functionality is client-side.

---

## Risks & Challenges

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hydration mismatch with isMobile | High | Use `useState(false)` initial, then update in useEffect |
| Scroll jank on low-end devices | Medium | Throttle scroll handler, use `passive: true` |
| iOS haptics not supported | Low | Fall back to visual feedback only |

### Complexity Risks

| Risk | Likelihood | Notes |
|------|------------|-------|
| Bottom padding on all pages | High | Need to audit all page layouts |
| Interferes with fixed elements | Medium | Z-index conflicts with modals, toasts |

---

## Recommendations for Planner

1. **Use CSS `md:hidden` for bottom nav visibility** - avoids hydration issues and is simpler than JS media queries.

2. **Create useScrollDirection as standalone hook** - will be reused in Iteration 17 for bottom sheet and full-screen reflection.

3. **Start with simple opacity animation for nav hide/show** - can enhance to spring later. Keep MVP simple.

4. **Use lucide-react icons, not emojis** - icons scale better at 24px and have consistent styling.

5. **Add safe area CSS variables to variables.css** - needed for notched device support:
   ```css
   --safe-area-bottom: env(safe-area-inset-bottom, 0px);
   ```

6. **Audit all page layouts for bottom padding** - every page with scroll content needs `pb-20` or similar on mobile.

7. **Keep haptic feedback optional** - don't let haptic failures block navigation.

---

## Resource Map

### Critical Files to Modify

| File | Purpose |
|------|---------|
| `/styles/variables.css` | Add safe area CSS variables |
| `/app/layout.tsx` | Add viewport-fit=cover meta |
| `/components/shared/AppNavigation.tsx` | Hide desktop nav items on mobile |
| `/lib/animations/variants.ts` | Add bottomNavVariants |

### Key Files to Create

| File | Purpose |
|------|---------|
| `/components/navigation/BottomNavigation.tsx` | Main bottom nav component |
| `/lib/hooks/useScrollDirection.ts` | Scroll direction detection |
| `/lib/utils/haptics.ts` | Haptic feedback utility |

### Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| framer-motion | Animations, gestures | ^11.18.2 (installed) |
| lucide-react | Icons | ^0.546.0 (installed) |

### Testing Infrastructure

| Approach | Notes |
|----------|-------|
| Chrome DevTools device mode | Quick mobile preview |
| Real iOS device | Test Safari, haptics |
| Real Android device | Test Chrome, haptics |
| Reduced motion test | Toggle in system preferences |

---

## Questions for Planner

1. **Should the Reflect tab be center-prominent (larger)?** - Common pattern in mobile apps (Instagram, TikTok).

2. **Should nav hide immediately on scroll down or animate out?** - Immediate is snappier, animated is smoother.

3. **What z-index for bottom nav?** - Current modal is z-50, toast is higher. Suggest z-40 for bottom nav.

4. **Should emojis be used alongside icons?** - Current desktop nav uses emojis. Keep consistency or differentiate mobile?

5. **How to handle /reflection page?** - During active reflection, should bottom nav be hidden entirely?

---

## Code Snippets for Builder

### Recommended BottomNavigation Structure

```typescript
// /components/navigation/BottomNavigation.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Layers, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/lib/hooks/useScrollDirection';
import { haptic } from '@/lib/utils/haptics';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dreams', icon: Sparkles, label: 'Dreams' },
  { href: '/reflection', icon: Layers, label: 'Reflect' },
  { href: '/evolution', icon: TrendingUp, label: 'Evolution' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const isVisible = scrollDirection !== 'down';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-0 inset-x-0 z-40',
            'bg-mirror-void-deep/90 backdrop-blur-lg',
            'border-t border-white/10',
            'pb-[env(safe-area-inset-bottom)]',
            'md:hidden' // Hide on desktop
          )}
        >
          <div className="flex items-center justify-around h-16">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => haptic('light')}
                  className={cn(
                    'flex flex-col items-center justify-center',
                    'w-16 h-full',
                    'transition-colors duration-200',
                    isActive ? 'text-white' : 'text-white/60'
                  )}
                >
                  <Icon className={cn('w-6 h-6', isActive && 'text-purple-400')} />
                  <span className="text-xs mt-1">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-1 w-1 h-1 bg-purple-400 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
```

### Safe Area CSS Addition

```css
/* Add to /styles/variables.css */

/* Safe Area Insets (for notched devices) */
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);

/* Bottom Navigation */
--bottom-nav-height: 64px;
--bottom-nav-total: calc(var(--bottom-nav-height) + var(--safe-area-bottom));
```

---

*Exploration completed: 2025-12-02*
*Explorer: explorer-2*
*Focus Area: Technology Patterns & Dependencies*
