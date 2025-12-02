# Technology Stack

## Overview

This iteration is purely frontend - no backend changes, database migrations, or API modifications. All changes are client-side React components, hooks, and CSS.

---

## Core Framework

**Decision:** Next.js 14 with App Router (existing)

**Rationale:**
- Already in use across the entire application
- App Router provides optimal layout composition for navigation
- No framework changes needed for this iteration

**Implementation Notes:**
- Use `'use client'` directive for all new components (navigation is interactive)
- Modify viewport metadata in root layout for safe area support

---

## Styling

**Decision:** Tailwind CSS + CSS Custom Properties (existing)

**Rationale:**
- Consistent with existing codebase patterns
- Tailwind responsive prefixes (`md:hidden`) provide clean mobile/desktop switching
- CSS custom properties enable dynamic values for safe areas

**Key Tailwind Classes for Bottom Nav:**
```
fixed bottom-0 inset-x-0       // Fixed positioning
z-40                            // Z-index layer
md:hidden                       // Hide on 768px+
pb-[env(safe-area-inset-bottom)] // Safe area padding
```

**CSS Variables to Add:**
```css
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--bottom-nav-height: 64px;
--bottom-nav-total: calc(var(--bottom-nav-height) + var(--safe-area-bottom));
```

---

## Animation Library

**Decision:** Framer Motion ^11.18.2 (existing)

**Rationale:**
- Already well-integrated throughout the application
- AnimatePresence handles show/hide animations cleanly
- layoutId enables smooth active tab indicator transitions
- Built-in reduced motion support

**Key Features Used:**
- `AnimatePresence` for nav show/hide
- `motion.nav` for animated container
- `layoutId="activeTab"` for pill indicator motion
- Spring transitions for natural feel

**Animation Variants to Create:**
```typescript
export const bottomNavVariants: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 }
};
```

---

## Icons

**Decision:** lucide-react ^0.546.0 (existing)

**Rationale:**
- Already installed and used throughout codebase
- Consistent 24px sizing scales well on mobile
- All required icons available: `Home`, `Sparkles`, `Layers`, `TrendingUp`, `User`

**Icons for Bottom Nav:**
| Tab | Icon | Import |
|-----|------|--------|
| Home | House | `Home` |
| Dreams | Sparkles | `Sparkles` |
| Reflect | Layers | `Layers` |
| Evolution | Trending Up | `TrendingUp` |
| Profile | User | `User` |

**Alternative Considered:**
- Emojis (used in current AppNavigation)
- Why not chosen: Icons scale better at 24px and have consistent stroke width

---

## State Management

**Decision:** React useState + useEffect (existing pattern)

**Rationale:**
- Local component state is sufficient for navigation
- No global state needed
- Matches existing hook patterns in codebase

**State Needed:**
- `scrollDirection: 'up' | 'down' | null` - Scroll direction for show/hide
- `isVisible: boolean` - Derived from scrollDirection

---

## Routing

**Decision:** Next.js App Router + usePathname (existing)

**Rationale:**
- Already in use for navigation
- `usePathname()` provides current route for active state

**Import:**
```typescript
import { usePathname } from 'next/navigation';
import Link from 'next/link';
```

---

## Haptic Feedback

**Decision:** Navigator.vibrate API with graceful fallback

**Rationale:**
- Native browser API, no additional dependencies
- Works on Android Chrome
- Silent failure on iOS Safari (no error, just no vibration)

**Implementation:**
```typescript
function haptic(style: 'light' | 'medium' = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 10 : 25);
  }
}
```

**Browser Support:**
- Chrome Android: Full support
- Safari iOS: NOT SUPPORTED (uses Taptic Engine via native API)
- Firefox: Partial support

**Alternative Considered:**
- Native iOS Taptic Engine
- Why not chosen: Requires native app bridge, out of scope for PWA

---

## Safe Area Support

**Decision:** CSS env() function + viewport-fit meta tag

**Rationale:**
- Standard CSS solution for notched devices
- No JavaScript required
- Automatic updates when device orientation changes

**Implementation:**

1. **Viewport Meta Tag** (in layout.tsx):
```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
```

2. **CSS Variables** (in variables.css):
```css
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);
```

---

## Scroll Detection

**Decision:** Custom useScrollDirection hook with passive scroll listener

**Rationale:**
- No existing scroll detection in codebase
- Simple implementation with throttling
- Passive listener for optimal performance

**Technical Approach:**
```typescript
// Throttled scroll detection (100ms)
// Threshold-based (10px minimum) to prevent jitter
// Returns: 'up' | 'down' | null
```

**Performance Considerations:**
- Use `{ passive: true }` for scroll listener
- Throttle to 100ms to avoid excessive state updates
- Store lastScrollY in useRef to avoid re-renders

---

## Development Tools

### TypeScript

**Decision:** Strict TypeScript (existing configuration)

**Types to Create:**
```typescript
type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  threshold?: number;
  throttleMs?: number;
}

type HapticStyle = 'light' | 'medium' | 'heavy';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}
```

### Testing

**Strategy:** Manual testing on real devices

**Test Matrix:**
| Device | Browser | Test Focus |
|--------|---------|------------|
| iPhone 12+ | Safari | Safe area padding, no haptics |
| iPhone SE | Safari | Small screen, safe area |
| Android (any) | Chrome | Haptic feedback |
| Desktop | Chrome | Nav hidden, desktop unchanged |
| Desktop | Firefox | Nav hidden |

**Automated Testing:** Deferred to future iteration (visual regression)

### Code Quality

**Linting:** ESLint (existing configuration)
**Formatting:** Prettier (existing configuration)

---

## Environment Variables

**No new environment variables required.**

All functionality is client-side and uses browser APIs.

---

## Dependencies Overview

No new dependencies to install. All required packages are already present:

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.x | Core React |
| next | ^14.x | Framework |
| framer-motion | ^11.18.2 | Animations |
| lucide-react | ^0.546.0 | Icons |
| tailwindcss | ^3.x | Styling |
| typescript | ^5.x | Type checking |

**Bundle Impact:** Estimated < 2KB gzipped (new code only)

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Lighthouse Mobile Score | >= 85 | Maintain current score |
| First Contentful Paint | < 2s | No regression |
| Bundle Size Increase | < 5KB gzipped | New component + hooks |
| Scroll Handler Performance | < 1ms per event | Throttled to 100ms |

---

## Security Considerations

1. **No user data handling** - Navigation is purely UI
2. **No API calls** - All functionality is client-side
3. **No external requests** - Icons are bundled
4. **Safe navigation** - Uses Next.js Link component (no raw href manipulation)

---

## File Structure

```
/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/
├── app/
│   └── layout.tsx                    # MODIFY: Add viewport metadata
├── components/
│   ├── navigation/
│   │   ├── BottomNavigation.tsx      # NEW: Bottom nav component
│   │   └── index.ts                  # NEW: Exports
│   └── shared/
│       └── AppNavigation.tsx         # MODIFY: Hide mobile menu on mobile
├── lib/
│   ├── hooks/
│   │   └── useScrollDirection.ts     # NEW: Scroll direction hook
│   ├── utils/
│   │   └── haptics.ts                # NEW: Haptic feedback utility
│   └── animations/
│       └── variants.ts               # MODIFY: Add bottomNavVariants
├── styles/
│   └── variables.css                 # MODIFY: Add safe area variables
└── hooks/
    └── (existing hooks)              # Reference for patterns
```

---

## Technology Summary

| Category | Technology | Status |
|----------|------------|--------|
| Framework | Next.js 14 | Existing |
| Styling | Tailwind CSS | Existing |
| Animation | Framer Motion | Existing |
| Icons | lucide-react | Existing |
| State | React hooks | Existing |
| Routing | Next.js App Router | Existing |
| Haptics | Navigator.vibrate | Native API |
| Safe Areas | CSS env() | Native CSS |

**Key Takeaway:** This iteration requires no new dependencies. All functionality is built on the existing technology stack.
