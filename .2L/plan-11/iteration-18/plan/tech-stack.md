# Technology Stack

## Core Framework

**Decision:** Next.js 14 with App Router

**Rationale:**
- Already in use throughout the codebase
- Server Components optimize bundle size
- No changes needed for this iteration

---

## Animation & Gestures

**Decision:** Framer Motion (already installed)

**Rationale:**
- Handles all gesture interactions (`whileTap`, `drag`)
- Spring-based animations for natural feel
- Built-in reduced motion support via `useReducedMotion()`
- Consistent with existing animation patterns

**Key APIs for This Iteration:**
- `whileTap` - Touch feedback animations
- `drag` - Swipe-to-dismiss gestures
- `AnimatePresence` - Modal enter/exit animations
- `motion.div` - Animated containers

**Implementation Notes:**
- Standard tap scale: `{ scale: 0.98 }` with `duration: 0.1`
- Always check `prefersReducedMotion` before applying animations
- Use `type: 'spring'` for modal slide-up animations

---

## Haptic Feedback

**Decision:** Native `navigator.vibrate()` via existing utility

**Location:** `/lib/utils/haptics.ts`

**Available Styles:**
| Style | Duration | Use Case |
|-------|----------|----------|
| `light` | 10ms | Navigation, selections |
| `medium` | 25ms | Button presses |
| `heavy` | 50ms | Important actions |
| `success` | Pattern | Completion feedback |
| `warning` | Pattern | Error/warning states |

**Implementation Notes:**
- Fails silently on unsupported devices (iOS Safari)
- Call `haptic('light')` in click handlers
- Do not overuse - reserve for primary interactions

---

## Mobile Detection

**Decision:** Custom `useIsMobile()` hook

**Location:** `/lib/hooks/useIsMobile.ts`

**Breakpoint:** 768px (matches Tailwind `md:`)

**Implementation Notes:**
- Returns `false` during SSR to prevent hydration mismatch
- Updates on window resize
- Use for conditional mobile-specific rendering

---

## Styling Approach

**Decision:** Tailwind CSS + CSS Modules (existing pattern)

**CSS Strategy:**
- Use Tailwind for new component styles
- Use CSS Modules for dashboard-specific styles
- Add `@media (hover: hover)` guards in CSS for hover effects

**Key CSS Variables (from `/styles/variables.css`):**
```css
--input-height: 52px;        /* Current, will update to 56px */
--button-height: 52px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

**Touch Target Standard:** 48px minimum (WCAG AA compliant)

---

## Animation Variants

**Location:** `/lib/animations/variants.ts`

**Existing Variants to Use:**
- `cardPressVariants` - Card tap feedback
- `modalOverlayVariants` - Modal backdrop fade
- `modalContentVariants` - Desktop modal slide

**New Variant to Add:**
- `mobileModalVariants` - Mobile full-screen slide-up

---

## Component Architecture

**Glass Component System:**
- `GlassCard` - Base card with glass morphism
- `GlassModal` - Modal with glass overlay
- `GlassInput` - Input with glass styling
- `GlowButton` - Button with glow effects

**Dashboard Component System:**
- `DashboardCard` - Enhanced card with hover effects
- `DashboardGrid` - Grid layout for dashboard
- `DashboardHero` - Hero section with CTA

---

## Testing Infrastructure

**Manual Testing Required:**
- iOS Safari (real device preferred)
- Android Chrome (real device preferred)
- Chrome DevTools mobile emulation (development)

**Performance Targets:**
- Touch feedback: < 100ms perceived latency
- Modal animation: 60fps (16.67ms per frame)
- Lighthouse mobile score: >= 85

---

## Dependencies Overview

No new dependencies required. All features implemented with existing stack:

| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | ^10.x | Animations and gestures |
| `react-focus-lock` | ^2.x | Modal focus trapping |
| `tailwindcss` | ^3.x | Utility CSS |
| `lucide-react` | ^0.x | Icons |

---

## Environment Variables

No new environment variables required for this iteration.

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 2s | On target |
| Bundle size increase | < 5KB | Expected 0KB (no new deps) |
| Touch feedback latency | < 100ms | To measure |
| Animation frame rate | 60fps | To measure |
| Lighthouse mobile | >= 85 | On target |

---

## Security Considerations

No new security considerations for this iteration. All changes are frontend styling and interaction enhancements.

---

## Browser Support

**Primary:**
- iOS Safari 14+ (primary mobile browser)
- Android Chrome 90+ (secondary mobile browser)

**Secondary:**
- Desktop Chrome, Firefox, Safari (regression testing)

**Notes:**
- `navigator.vibrate()` not supported on iOS Safari - fails silently
- All gestures work in modern browsers
- Reduced motion preferences respected
