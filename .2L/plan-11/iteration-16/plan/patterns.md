# Code Patterns & Conventions

## File Structure

```
/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/
├── app/
│   └── layout.tsx                    # Root layout with viewport config
├── components/
│   ├── navigation/
│   │   ├── BottomNavigation.tsx      # Bottom navigation component
│   │   └── index.ts                  # Barrel exports
│   ├── shared/
│   │   └── AppNavigation.tsx         # Top navigation (modified)
│   └── ui/
│       └── glass/                    # Glass components (reference)
├── lib/
│   ├── hooks/
│   │   └── useScrollDirection.ts     # Scroll direction hook
│   ├── utils/
│   │   └── haptics.ts                # Haptic feedback utility
│   └── animations/
│       └── variants.ts               # Framer Motion variants
├── styles/
│   └── variables.css                 # CSS custom properties
└── hooks/
    └── useReducedMotion.ts           # Reference pattern for hooks
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `BottomNavigation.tsx` |
| Hooks | camelCase with "use" prefix | `useScrollDirection.ts` |
| Utilities | camelCase | `haptics.ts` |
| Types | PascalCase | `ScrollDirection`, `NavItem` |
| CSS Variables | kebab-case | `--bottom-nav-height` |
| Constants | SCREAMING_SNAKE_CASE | `NAV_ITEMS` |
| Functions | camelCase | `haptic()` |

---

## Component Patterns

### Standard Component Structure

All components follow this pattern:

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

// Constants at top
const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dreams', icon: Sparkles, label: 'Dreams' },
  { href: '/reflection', icon: Layers, label: 'Reflect' },
  { href: '/evolution', icon: TrendingUp, label: 'Evolution' },
  { href: '/profile', icon: User, label: 'Profile' },
] as const;

// Props interface (if needed)
interface BottomNavigationProps {
  className?: string;
}

// Component export
export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();

  // Derived state
  const isVisible = scrollDirection !== 'down';

  return (
    // JSX here
  );
}
```

**Key Points:**
- `'use client'` directive at top for client components
- Imports grouped: external libs, then internal imports
- Constants before component
- Props interface explicitly typed
- Named export (not default)

---

### Navigation Item Pattern

Pattern for rendering navigation items with active state:

```typescript
{NAV_ITEMS.map((item) => {
  const isActive = pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => haptic('light')}
      className={cn(
        'flex flex-col items-center justify-center',
        'flex-1 h-full min-w-[64px]',
        'transition-colors duration-200',
        isActive ? 'text-white' : 'text-white/60'
      )}
    >
      <div className="relative flex flex-col items-center">
        <Icon
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isActive && 'text-purple-400'
          )}
        />
        <span className={cn(
          'text-xs mt-1 transition-colors duration-200',
          isActive ? 'text-white' : 'text-white/60'
        )}>
          {item.label}
        </span>

        {/* Active indicator pill */}
        {isActive && (
          <motion.div
            layoutId="bottomNavActiveTab"
            className="absolute -bottom-1 w-1 h-1 bg-purple-400 rounded-full"
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </div>
    </Link>
  );
})}
```

**Key Points:**
- Use `layoutId` for smooth active indicator transitions
- Include both pathname exact match AND startsWith for nested routes
- Spring transition for natural motion feel
- Haptic feedback on click

---

### AnimatePresence Show/Hide Pattern

Pattern for animated visibility based on scroll:

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { bottomNavVariants } from '@/lib/animations/variants';

export function BottomNavigation() {
  const scrollDirection = useScrollDirection();
  const isVisible = scrollDirection !== 'down';

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.nav
          key="bottom-nav"
          variants={bottomNavVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'fixed bottom-0 inset-x-0 z-40',
            'md:hidden' // Hide on desktop
          )}
        >
          {/* Nav content */}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
```

**Key Points:**
- Use `mode="wait"` for clean exit before enter
- Include `key` prop for proper animation tracking
- Use variants from centralized variants file
- Always specify `initial`, `animate`, and `exit`

---

## Hook Patterns

### useScrollDirection Hook

Complete implementation pattern:

```typescript
// /lib/hooks/useScrollDirection.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  /** Minimum scroll distance before detecting direction (default: 10) */
  threshold?: number;
  /** Throttle scroll events in milliseconds (default: 100) */
  throttleMs?: number;
}

/**
 * Hook to detect scroll direction for show/hide UI patterns
 * Returns 'up', 'down', or null (initial state / at top)
 *
 * @example
 * const scrollDirection = useScrollDirection();
 * const isNavVisible = scrollDirection !== 'down';
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): ScrollDirection {
  const { threshold = 10, throttleMs = 100 } = options;

  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const lastTimestamp = useRef(0);
  const ticking = useRef(false);

  const updateDirection = useCallback(() => {
    const currentY = window.scrollY;
    const diff = currentY - lastScrollY.current;

    // Only update if scroll exceeds threshold
    if (Math.abs(diff) >= threshold) {
      // At top of page, show nav
      if (currentY <= 0) {
        setDirection(null);
      } else {
        setDirection(diff > 0 ? 'down' : 'up');
      }
      lastScrollY.current = currentY;
    }

    ticking.current = false;
  }, [threshold]);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();

      // Throttle scroll events
      if (now - lastTimestamp.current < throttleMs) {
        return;
      }
      lastTimestamp.current = now;

      if (!ticking.current) {
        window.requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    // Set initial scroll position
    lastScrollY.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [throttleMs, updateDirection]);

  return direction;
}
```

**Key Points:**
- Use `{ passive: true }` for scroll listener performance
- Throttle using timestamp comparison
- Use `requestAnimationFrame` for smooth updates
- Return `null` when at top of page (show nav by default)
- Store refs in useRef to avoid unnecessary re-renders

---

### useIsMobile Hook (Optional)

If JS-based mobile detection is needed:

```typescript
// /lib/hooks/useIsMobile.ts
'use client';

import { useState, useEffect } from 'react';

interface UseIsMobileOptions {
  /** Breakpoint in pixels (default: 768) */
  breakpoint?: number;
}

/**
 * Hook to detect mobile viewport
 * Prefer CSS md:hidden over this hook when possible
 *
 * @example
 * const isMobile = useIsMobile();
 * // Use for conditional logic, NOT for conditional rendering
 */
export function useIsMobile(options: UseIsMobileOptions = {}): boolean {
  const { breakpoint = 768 } = options;

  // Start with false to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return isMobile;
}
```

**Key Points:**
- Initialize to `false` to avoid hydration mismatch
- Use `matchMedia` for efficient viewport detection
- Prefer CSS `md:hidden` over this hook when possible

---

## Utility Patterns

### Haptic Feedback Utility

Complete implementation:

```typescript
// /lib/utils/haptics.ts

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

const HAPTIC_DURATIONS: Record<HapticStyle, number | number[]> = {
  light: 10,              // Quick tap feedback
  medium: 25,             // Button press
  heavy: 50,              // Significant action
  success: [15, 50, 30],  // Double-tap pattern
  warning: [30, 30, 30],  // Triple-tap pattern
};

/**
 * Trigger haptic feedback on supported devices
 * Fails silently on unsupported devices (iOS Safari)
 *
 * @example
 * // In click handler
 * onClick={() => {
 *   haptic('light');
 *   navigate('/dashboard');
 * }}
 */
export function haptic(style: HapticStyle = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(HAPTIC_DURATIONS[style]);
    } catch {
      // Silent fail - haptic feedback is not critical
    }
  }
}

/**
 * Check if haptic feedback is supported
 * Useful for conditional UI hints
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}
```

**Key Points:**
- Silent failure (no console errors)
- Type-safe style parameter
- Support for pattern vibrations
- Helper function for feature detection

---

## Animation Variants

### Bottom Navigation Variants

Add to `/lib/animations/variants.ts`:

```typescript
/**
 * Bottom navigation show/hide animation
 * Used with scroll direction detection
 */
export const bottomNavVariants: Variants = {
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

**Key Points:**
- Use `y: '100%'` for percentage-based positioning
- Spring transition for natural show animation
- Faster exit (0.2s) than enter for snappy feel

---

## CSS Variable Patterns

### Safe Area Variables

Add to `/styles/variables.css` in the `:root` block:

```css
/* ============================================
   SAFE AREA INSETS (for notched devices)
   ============================================ */
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);

/* ============================================
   BOTTOM NAVIGATION
   ============================================ */
--bottom-nav-height: 64px;
--bottom-nav-total: calc(var(--bottom-nav-height) + var(--safe-area-bottom));
```

**Usage in Tailwind:**
```tsx
// Bottom nav padding
<nav className="pb-[env(safe-area-inset-bottom)]">

// Or using CSS variable
<nav style={{ paddingBottom: 'var(--safe-area-bottom)' }}>

// Page content padding
<main className="pb-[calc(var(--bottom-nav-total)+1rem)]">
```

---

## Viewport Metadata Pattern

### Next.js 14 Viewport Configuration

In `/app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Mirror of Dreams - Reflect, Discover, Transform',
  description: 'An AI-powered reflection experience for personal growth',
  // ... other metadata
};

// Separate viewport export (Next.js 14 pattern)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevent zoom on input focus
  viewportFit: 'cover', // Enable safe area insets
};
```

**Key Points:**
- Use separate `viewport` export (Next.js 14+ pattern)
- `viewportFit: 'cover'` enables safe area CSS variables
- `maximumScale: 1` prevents unwanted zoom (optional, for form-heavy pages)

---

## Glass Morphism Pattern

### Applying to Bottom Navigation

Reference the existing glass styling from `FloatingNav.tsx`:

```typescript
<motion.nav
  className={cn(
    // Positioning
    'fixed bottom-0 inset-x-0 z-40',

    // Glass morphism
    'bg-white/5 backdrop-blur-lg backdrop-saturate-150',
    'border-t border-white/10',

    // Safe area
    'pb-[env(safe-area-inset-bottom)]',

    // Responsive
    'md:hidden',

    // Optional: subtle shadow
    'shadow-lg shadow-black/20'
  )}
>
```

**Key Points:**
- `bg-white/5` - Very subtle background
- `backdrop-blur-lg` - Strong blur effect
- `backdrop-saturate-150` - Boost saturation behind blur
- `border-t border-white/10` - Top border only (bottom is edge)
- Use `shadow-lg shadow-black/20` for depth (optional)

---

## Import Order Convention

Follow this exact order in all files:

```typescript
// 1. React and framework imports
'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Metadata, Viewport } from 'next';

// 2. External library imports
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 3. Icon imports (grouped)
import { Home, Sparkles, Layers, TrendingUp, User } from 'lucide-react';

// 4. Internal component imports
import { GlassCard } from '@/components/ui/glass';

// 5. Internal utility imports
import { cn } from '@/lib/utils';

// 6. Internal hook imports
import { useScrollDirection } from '@/lib/hooks/useScrollDirection';
import { haptic } from '@/lib/utils/haptics';

// 7. Type imports (if not inline)
import type { NavItem } from '@/types/navigation';

// 8. Animation imports
import { bottomNavVariants } from '@/lib/animations/variants';
```

---

## Responsive Visibility Pattern

### CSS-First Approach (Preferred)

```typescript
// Show on mobile only
<nav className="md:hidden">
  {/* Mobile content */}
</nav>

// Show on desktop only
<div className="hidden md:flex">
  {/* Desktop content */}
</div>

// Show on tablet and up
<div className="hidden sm:block">
  {/* Tablet+ content */}
</div>
```

**Key Points:**
- Always prefer CSS visibility over JS conditional rendering
- Avoids hydration mismatches
- Better performance (no JS evaluation)

### JS-Based Approach (When Needed)

Only use for complex conditional logic, not visibility:

```typescript
const isMobile = useIsMobile();

// DO: Use for behavior changes
const handleClick = () => {
  if (isMobile) {
    haptic('light');
  }
  navigate(href);
};

// DON'T: Use for rendering
// This causes hydration mismatch:
// {isMobile && <BottomNav />}
```

---

## Error Handling Pattern

### Graceful Degradation

```typescript
// In haptics utility
export function haptic(style: HapticStyle = 'light'): void {
  // Check for browser environment
  if (typeof navigator === 'undefined') return;

  // Check for API support
  if (!('vibrate' in navigator)) return;

  // Try-catch for edge cases
  try {
    navigator.vibrate(HAPTIC_DURATIONS[style]);
  } catch {
    // Silent fail - not critical functionality
  }
}
```

**Key Points:**
- Always check `typeof window !== 'undefined'` or `typeof navigator !== 'undefined'`
- Use try-catch for browser APIs that may throw
- Silent failure for enhancement features (haptics, animations)

---

## Testing Patterns

### Manual Testing Checklist

Create this checklist for validation:

```markdown
## Mobile Navigation Testing

### iPhone Safari
- [ ] Bottom nav visible at < 768px
- [ ] Safe area padding on notched devices
- [ ] Tabs navigate correctly
- [ ] Active state shows pill indicator
- [ ] Nav hides on scroll down
- [ ] Nav shows on scroll up
- [ ] No haptic vibration (expected - not supported)

### Android Chrome
- [ ] Bottom nav visible at < 768px
- [ ] Tabs navigate correctly
- [ ] Active state shows pill indicator
- [ ] Nav hides on scroll down
- [ ] Nav shows on scroll up
- [ ] Haptic feedback on tap

### Desktop Chrome
- [ ] Bottom nav NOT visible
- [ ] Top navigation unchanged
- [ ] All existing functionality works
```

---

## Performance Patterns

### Scroll Handler Optimization

```typescript
// Good: Throttled, passive, using RAF
useEffect(() => {
  const handleScroll = () => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        updateDirection();
        ticking.current = false;
      });
      ticking.current = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Bad: Unthrottled, not passive
useEffect(() => {
  const handleScroll = () => {
    setDirection(window.scrollY > lastY ? 'down' : 'up');
    lastY = window.scrollY;
  };
  window.addEventListener('scroll', handleScroll); // Missing passive
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## Barrel Export Pattern

### Component Index Files

```typescript
// /components/navigation/index.ts
export { BottomNavigation } from './BottomNavigation';

// /lib/hooks/index.ts
export { useScrollDirection } from './useScrollDirection';
export type { ScrollDirection } from './useScrollDirection';

// /lib/utils/haptics.ts
// Single file, no index needed
```

**Key Points:**
- Use barrel exports for directories with multiple exports
- Export types alongside components
- Single-file utilities don't need barrel files

---

## Code Quality Standards

1. **No `any` types** - Always specify types explicitly
2. **No unused imports** - ESLint will flag these
3. **Consistent naming** - Follow conventions above
4. **Comments for non-obvious code** - Explain "why", not "what"
5. **Accessibility** - Include aria labels on interactive elements

```typescript
// Good: Descriptive aria-label
<Link
  href={item.href}
  aria-label={`Navigate to ${item.label}`}
  aria-current={isActive ? 'page' : undefined}
>

// Good: Explaining why
// Hide nav on scroll down to maximize content visibility
const isVisible = scrollDirection !== 'down';

// Bad: Explaining what (obvious from code)
// Set direction to down if diff is positive
setDirection(diff > 0 ? 'down' : 'up');
```

---

## Summary Checklist

Before submitting code, verify:

- [ ] `'use client'` directive present for client components
- [ ] Imports follow order convention
- [ ] Types explicitly declared (no `any`)
- [ ] CSS classes use `cn()` utility for merging
- [ ] Framer Motion variants imported from centralized file
- [ ] Safe area CSS uses `env()` with fallback
- [ ] Scroll listeners use `{ passive: true }`
- [ ] Haptic calls wrapped in try-catch
- [ ] Responsive visibility uses CSS classes, not JS
- [ ] aria-labels on all interactive elements
