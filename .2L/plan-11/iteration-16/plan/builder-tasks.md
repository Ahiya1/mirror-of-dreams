# Builder Task Breakdown

## Overview

**3 primary builders** will work in parallel on isolated feature areas.

| Builder | Focus Area | Estimated Time |
|---------|------------|----------------|
| Builder-1 | Core Infrastructure | 1.5-2 hours |
| Builder-2 | BottomNavigation Component | 2-3 hours |
| Builder-3 | AppNavigation Integration | 1.5-2 hours |

**Total Parallel Time:** ~2-3 hours (builders work simultaneously)

---

## Builder Assignment Strategy

- **Builder-1** creates foundational infrastructure that Builder-2 depends on
- **Builder-2** creates the main component (can start hooks locally if needed)
- **Builder-3** modifies existing navigation (independent of Builder-1/2)
- No sub-builder splits expected (complexity is manageable)

---

## Builder-1: Core Infrastructure

### Scope

Create the foundational hooks, utilities, and CSS variables that support the bottom navigation feature. This includes scroll direction detection, haptic feedback utility, safe area CSS variables, and viewport metadata.

### Complexity Estimate

**MEDIUM**

- New hooks with scroll event handling
- CSS variable additions
- Layout metadata modification

### Success Criteria

- [ ] `useScrollDirection` hook correctly detects scroll direction
- [ ] Hook returns `'up'`, `'down'`, or `null` (at top)
- [ ] Scroll detection is throttled (no jank)
- [ ] `haptic()` utility works on Android Chrome
- [ ] `haptic()` silently fails on iOS Safari (no errors)
- [ ] Safe area CSS variables are defined in variables.css
- [ ] `viewport-fit: cover` is set in layout metadata
- [ ] TypeScript types are properly exported
- [ ] All files pass TypeScript compilation

### Files to Create

| File | Purpose |
|------|---------|
| `/lib/hooks/useScrollDirection.ts` | Scroll direction detection hook |
| `/lib/utils/haptics.ts` | Haptic feedback utility |
| `/lib/hooks/index.ts` | Barrel exports for hooks |

### Files to Modify

| File | Changes |
|------|---------|
| `/styles/variables.css` | Add safe area + bottom nav CSS variables |
| `/app/layout.tsx` | Add viewport export with viewportFit: 'cover' |
| `/lib/animations/variants.ts` | Add bottomNavVariants |

### Dependencies

**Depends on:** Nothing (first builder)
**Blocks:** Builder-2 (partially - can work around)

### Implementation Notes

1. **useScrollDirection Hook**
   - Initialize lastScrollY with 0 in useRef
   - Use `{ passive: true }` for scroll listener
   - Throttle to 100ms using timestamp comparison
   - Use 10px threshold to prevent jitter
   - Return `null` when `scrollY <= 0`
   - Use `requestAnimationFrame` for smooth updates

2. **Haptic Utility**
   - Check `typeof navigator !== 'undefined'` before access
   - Check `'vibrate' in navigator` for feature detection
   - Wrap vibrate call in try-catch
   - Export `HapticStyle` type

3. **CSS Variables**
   - Place safe area variables after existing navigation variables (~line 324)
   - Use `env()` with 0px fallback
   - Add `--bottom-nav-height: 64px`
   - Add `--bottom-nav-total: calc(...)` for computed height

4. **Layout Viewport**
   - Use Next.js 14 separate `export const viewport` pattern
   - Add `viewportFit: 'cover'` to enable safe area insets
   - Keep existing metadata export unchanged

5. **Animation Variants**
   - Add after existing variants (~line 352)
   - Use spring transition for visible state
   - Use ease transition for exit state

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **useScrollDirection Hook** pattern for implementation
- Use **Haptic Feedback Utility** pattern
- Use **CSS Variable Patterns** for safe area
- Use **Viewport Metadata Pattern** for layout
- Use **Animation Variants** pattern for bottomNavVariants

### Testing Requirements

- Unit test: Call `useScrollDirection()` in test component
- Manual test: Verify scroll direction changes on real scroll
- Manual test: Verify haptic on Android Chrome
- Manual test: Verify no errors on iOS Safari

### Code Template: useScrollDirection

```typescript
// /lib/hooks/useScrollDirection.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  threshold?: number;
  throttleMs?: number;
}

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

    if (Math.abs(diff) >= threshold) {
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
      if (now - lastTimestamp.current < throttleMs) return;
      lastTimestamp.current = now;

      if (!ticking.current) {
        window.requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [throttleMs, updateDirection]);

  return direction;
}
```

### Code Template: CSS Variables Addition

```css
/* Add to /styles/variables.css after line ~324 (after --total-header-height) */

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

---

## Builder-2: BottomNavigation Component

### Scope

Create the main BottomNavigation component with all interactive features: 5 navigation tabs, active state indicator with animation, scroll-based show/hide behavior, safe area padding, and haptic feedback.

### Complexity Estimate

**MEDIUM-HIGH**

- Multiple interactive features
- Animation integration
- Responsive design
- Accessibility requirements

### Success Criteria

- [ ] Component renders fixed at bottom of screen
- [ ] Shows 5 tabs: Home, Dreams, Reflect, Evolution, Profile
- [ ] Uses lucide-react icons (not emojis)
- [ ] Active tab shows pill indicator with smooth animation
- [ ] Tab navigation works correctly (Next.js Link)
- [ ] Hides on scroll down, shows on scroll up
- [ ] Hidden on desktop (md:hidden)
- [ ] Safe area padding applied (env(safe-area-inset-bottom))
- [ ] Haptic feedback on tab tap
- [ ] Accessible: aria-labels, keyboard navigation
- [ ] Glass morphism styling consistent with design system

### Files to Create

| File | Purpose |
|------|---------|
| `/components/navigation/BottomNavigation.tsx` | Main component |
| `/components/navigation/index.ts` | Barrel exports |

### Dependencies

**Depends on:**
- Builder-1: useScrollDirection hook (can mock if not ready)
- Builder-1: haptic utility (can mock if not ready)
- Builder-1: bottomNavVariants (can inline if not ready)

**Blocks:** Nothing

### Implementation Notes

1. **Component Structure**
   - Use `'use client'` directive
   - Import icons from lucide-react
   - Define NAV_ITEMS constant at top
   - Use `usePathname()` for active detection

2. **Active State Detection**
   - Check exact match: `pathname === href`
   - Check nested routes: `pathname.startsWith(href)` (except dashboard)
   - Use `layoutId="bottomNavActiveTab"` for smooth indicator motion

3. **Glass Morphism**
   - `bg-white/5` or `bg-mirror-void-deep/90`
   - `backdrop-blur-lg`
   - `border-t border-white/10`
   - Reference FloatingNav.tsx for exact styling

4. **Show/Hide Animation**
   - Wrap in AnimatePresence
   - Use bottomNavVariants from variants.ts
   - Spring in, ease out

5. **Safe Area**
   - Use `pb-[env(safe-area-inset-bottom)]` Tailwind class
   - OR use CSS variable `pb-[var(--safe-area-bottom)]`

6. **Accessibility**
   - `aria-label` on nav element
   - `aria-current="page"` on active link
   - Keyboard navigation works by default with Link

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Standard Component Structure** pattern
- Use **Navigation Item Pattern** for tab rendering
- Use **AnimatePresence Show/Hide Pattern** for visibility
- Use **Glass Morphism Pattern** for styling
- Follow **Import Order Convention**

### Testing Requirements

- Visual test: Nav appears at bottom on mobile
- Visual test: Nav hidden on desktop
- Interaction test: Tabs navigate correctly
- Animation test: Smooth show/hide on scroll
- Animation test: Active indicator animates between tabs
- Accessibility test: Screen reader announces navigation

### Code Template: BottomNavigation

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
import { bottomNavVariants } from '@/lib/animations/variants';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dreams', icon: Sparkles, label: 'Dreams' },
  { href: '/reflection', icon: Layers, label: 'Reflect' },
  { href: '/evolution', icon: TrendingUp, label: 'Evolution' },
  { href: '/profile', icon: User, label: 'Profile' },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
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
            'bg-white/5 backdrop-blur-lg backdrop-saturate-150',
            'border-t border-white/10',
            'pb-[env(safe-area-inset-bottom)]',
            'md:hidden'
          )}
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-around h-16">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => haptic('light')}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center',
                    'flex-1 h-full',
                    'transition-colors duration-200'
                  )}
                >
                  <div className="relative flex flex-col items-center">
                    <Icon
                      className={cn(
                        'w-6 h-6 transition-colors duration-200',
                        isActive ? 'text-purple-400' : 'text-white/60'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs mt-1 transition-colors duration-200',
                        isActive ? 'text-white' : 'text-white/60'
                      )}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavActiveTab"
                        className="absolute -bottom-1 w-1 h-1 bg-purple-400 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
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

---

## Builder-3: AppNavigation Integration & Testing

### Scope

Modify the existing AppNavigation component to coexist with the new bottom navigation on mobile. Update page layouts to include the BottomNavigation component. Ensure desktop navigation remains unchanged.

### Complexity Estimate

**MEDIUM**

- Modifying existing component (care needed)
- Multiple file touches for integration
- Testing responsibility

### Success Criteria

- [ ] Desktop navigation (>= 1024px) completely unchanged
- [ ] Mobile top bar shows only: logo + user avatar
- [ ] Mobile hamburger menu button hidden on mobile (< 768px)
- [ ] Hamburger menu still works on tablet (768-1024px)
- [ ] BottomNavigation added to authenticated page layouts
- [ ] No layout shift when switching between viewports
- [ ] All existing tests pass (if any)
- [ ] Page content has bottom padding on mobile

### Files to Modify

| File | Changes |
|------|---------|
| `/components/shared/AppNavigation.tsx` | Hide hamburger on mobile, slim down mobile header |
| `/app/dashboard/page.tsx` | Add BottomNavigation, bottom padding |
| `/app/dreams/page.tsx` | Add BottomNavigation, bottom padding |
| `/app/reflection/page.tsx` | Add BottomNavigation (hidden during reflection) |
| `/app/evolution/page.tsx` | Add BottomNavigation, bottom padding |
| `/app/profile/page.tsx` | Add BottomNavigation, bottom padding |

### Dependencies

**Depends on:**
- Builder-2: BottomNavigation component (can stub if not ready)

**Blocks:** Nothing

### Implementation Notes

1. **AppNavigation Changes**
   - Change hamburger button from `lg:hidden` to `hidden md:block lg:hidden`
   - This shows hamburger only on tablet (768-1024px)
   - On mobile (< 768px), bottom nav handles navigation
   - Keep desktop nav links unchanged (`hidden lg:flex`)

2. **Mobile Header Simplification**
   - On mobile, top bar should show: logo + user avatar only
   - Hide "Upgrade" button on mobile (< 640px already hidden with `hidden sm:flex`)
   - Refresh button can stay (useful on mobile too)

3. **Adding BottomNavigation to Pages**
   - Import from `@/components/navigation`
   - Add as sibling to main content, after closing tag
   - Example placement:
     ```tsx
     <>
       <AppNavigation currentPage="dashboard" />
       <main className="pt-[var(--total-header-height)] pb-20 md:pb-0">
         {/* Page content */}
       </main>
       <BottomNavigation />
     </>
     ```

4. **Bottom Padding**
   - Add `pb-20` (80px) to main content on mobile
   - Use `pb-20 md:pb-0` to remove on desktop
   - This prevents content from being hidden behind bottom nav

5. **Reflection Page Special Case**
   - During active reflection, bottom nav should not interfere
   - Reflection is full-screen takeover (handled in future iteration)
   - For now, add BottomNavigation but it will be hidden when reflection is active

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Responsive Visibility Pattern** for hamburger hiding
- Follow **Import Order Convention**
- Maintain existing code style in AppNavigation

### Testing Requirements

- Desktop test: Verify navigation unchanged at > 1024px
- Tablet test: Verify hamburger menu works at 768-1024px
- Mobile test: Verify hamburger hidden at < 768px
- Mobile test: Verify bottom nav visible on all pages
- Layout test: No content hidden behind bottom nav
- Layout test: No layout shift on resize

### Code Template: AppNavigation Hamburger Change

```typescript
// In AppNavigation.tsx, change the mobile menu button className:

// BEFORE (line ~308):
<button
  onClick={() => setShowMobileMenu(!showMobileMenu)}
  className="lg:hidden p-2 rounded-lg bg-white/8 hover:bg-white/12 transition-all"
  // ...
>

// AFTER:
<button
  onClick={() => setShowMobileMenu(!showMobileMenu)}
  className="hidden md:block lg:hidden p-2 rounded-lg bg-white/8 hover:bg-white/12 transition-all"
  // ...
>
```

### Code Template: Page Integration

```typescript
// Example: /app/dashboard/page.tsx

import { AppNavigation } from '@/components/shared/AppNavigation';
import { BottomNavigation } from '@/components/navigation';

export default function DashboardPage() {
  return (
    <>
      <AppNavigation currentPage="dashboard" />

      {/* Main content with bottom padding for mobile nav */}
      <div className="min-h-screen pt-[var(--total-header-height)] pb-20 md:pb-0">
        {/* Existing dashboard content */}
      </div>

      {/* Bottom navigation - only visible on mobile */}
      <BottomNavigation />
    </>
  );
}
```

### Potential Split Strategy

If this task proves too complex:

**Foundation:** Modify AppNavigation only
- Change hamburger visibility
- Verify desktop unchanged

**Sub-builder 3A:** Dashboard + Dreams integration
- Add BottomNavigation to these pages
- Add bottom padding

**Sub-builder 3B:** Evolution + Profile integration
- Add BottomNavigation to these pages
- Add bottom padding

**Note:** This split is not expected to be necessary given the straightforward nature of the changes.

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

| Builder | Task | Can Start Immediately |
|---------|------|----------------------|
| Builder-1 | Core Infrastructure | Yes |
| Builder-2 | BottomNavigation Component | Yes (can mock dependencies) |
| Builder-3 | AppNavigation Integration | Yes (can stub BottomNavigation) |

All builders can work simultaneously. Dependencies are soft - builders can create local mocks/stubs if waiting for other builders.

### Integration Sequence

1. Merge Builder-1 first (infrastructure that others depend on)
2. Merge Builder-2 second (component uses infrastructure)
3. Merge Builder-3 last (integrates component into pages)

---

## Integration Notes

### How builder outputs will come together

1. **No file conflicts** - Each builder modifies different files
2. **Import paths must match** - Verify `@/lib/hooks/useScrollDirection` path
3. **CSS variables must be consistent** - All builders use `--bottom-nav-height`

### Shared files that need coordination

| File | Builder-1 | Builder-2 | Builder-3 |
|------|-----------|-----------|-----------|
| `/styles/variables.css` | Modifies | Uses | - |
| `/lib/animations/variants.ts` | Modifies | Uses | - |
| `/app/layout.tsx` | Modifies | - | - |
| `/components/shared/AppNavigation.tsx` | - | - | Modifies |

### Post-Integration Checklist

- [ ] All TypeScript errors resolved
- [ ] All imports resolve correctly
- [ ] CSS variables defined before use
- [ ] No duplicate exports
- [ ] Manual testing on mobile viewport
- [ ] Manual testing on desktop viewport
- [ ] Scroll behavior works correctly
- [ ] Tab navigation works correctly

---

## Complexity Summary

| Builder | Complexity | Estimated Hours | Split Needed? |
|---------|------------|-----------------|---------------|
| Builder-1 | MEDIUM | 1.5-2 hours | No |
| Builder-2 | MEDIUM-HIGH | 2-3 hours | No |
| Builder-3 | MEDIUM | 1.5-2 hours | Unlikely |

**Total Effort:** ~5-7 builder-hours
**Parallel Time:** ~2-3 hours (all builders work simultaneously)

---

## Quick Reference: Files by Builder

### Builder-1 Creates/Modifies
```
CREATE: /lib/hooks/useScrollDirection.ts
CREATE: /lib/utils/haptics.ts
CREATE: /lib/hooks/index.ts
MODIFY: /styles/variables.css
MODIFY: /app/layout.tsx
MODIFY: /lib/animations/variants.ts
```

### Builder-2 Creates
```
CREATE: /components/navigation/BottomNavigation.tsx
CREATE: /components/navigation/index.ts
```

### Builder-3 Modifies
```
MODIFY: /components/shared/AppNavigation.tsx
MODIFY: /app/dashboard/page.tsx
MODIFY: /app/dreams/page.tsx
MODIFY: /app/reflection/page.tsx
MODIFY: /app/evolution/page.tsx
MODIFY: /app/profile/page.tsx
```
