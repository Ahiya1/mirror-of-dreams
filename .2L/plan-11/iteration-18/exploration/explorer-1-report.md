# Explorer 1 Report: Touch Interactions & Card Components

## Executive Summary

The codebase has a solid foundation for touch interactions but lacks consistency across components. Key findings: GlassCard has basic `active:scale-[0.99]` states, DashboardCard uses Framer Motion `whileTap` via `cardPressVariants`, but many dashboard cards lack direct touch feedback. GlassModal uses desktop-centric centered positioning without mobile full-screen treatment or swipe-to-dismiss. GlassInput has standard sizing (py-3 = ~44px) without mobile-optimized 56px height or keyboard awareness. The dashboard has 6 cards on a 2-column grid that collapses to single column below 1024px but needs mobile-specific optimization.

## Discoveries

### 1. Card Components Audit

#### GlassCard (`/components/ui/glass/GlassCard.tsx`)
- **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassCard.tsx`
- **Lines:** 62 lines
- **Hover Effects:**
  - `hover:-translate-y-0.5` (subtle lift)
  - `hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)]` (purple glow)
  - `hover:border-purple-400/30` (border highlight)
- **Active/Tap States:**
  - `active:scale-[0.99]` (present when `interactive` prop is true)
- **Touch Targets:**
  - Uses `p-6` padding (24px)
  - No explicit minimum height constraint
- **Issues:**
  - Hover effects will apply on touch (no `@media (hover: hover)` guard)
  - CSS-only animation - no Framer Motion `whileTap`

#### DashboardCard (`/components/dashboard/shared/DashboardCard.tsx`)
- **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/DashboardCard.tsx`
- **Lines:** 209 lines
- **Hover Effects:**
  - Managed via CSS classes (`.dashboard-card:hover`)
  - `transform: translateY(-4px) scale(1.01)` on hover
  - `box-shadow: 0 20px 64px rgba(139, 92, 246, 0.4)` purple glow
- **Active/Tap States:**
  - Uses Framer Motion `whileTap` with `cardPressVariants`
  - `cardPressVariants.tap: { scale: 0.98 }` (line 288-294 in variants.ts)
  - Only applied when `onClick` handler exists
  - Respects `prefersReducedMotion`
- **Touch Targets:**
  - Minimum height: 280px (desktop), 200px (tablet), 180px (mobile 768px), 160px (mobile 480px)
  - These are card minimums, not touch target sizes
- **Issues:**
  - Hover scale (1.01) applies on touch without media query guard
  - Only cards with `onClick` get tap feedback

#### DreamCard (`/components/ui/glass/DreamCard.tsx`)
- **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/DreamCard.tsx`
- **Lines:** 75 lines
- **Hover Effects:**
  - Inherits from GlassCard
- **Active/Tap States:**
  - Framer Motion `whileTap={{ scale: 0.98 }}` when onClick exists (line 48)
  - Respects `prefersReducedMotion`
- **Issues:**
  - Good implementation - model for other cards

#### DreamCard (dreams version) (`/components/dreams/DreamCard.tsx`)
- **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dreams/DreamCard.tsx`
- **Lines:** 169 lines
- **Structure:** Uses GlassCard wrapper, no additional tap states
- **Issues:**
  - Relies solely on GlassCard's CSS `active:scale-[0.99]`

### 2. Current Touch Patterns

#### whileTap Animations in Codebase
Found 8 instances of `whileTap` usage:

| Component | File | Implementation |
|-----------|------|----------------|
| DashboardCard | `/components/dashboard/shared/DashboardCard.tsx:107` | `cardPressVariants` via variants prop |
| DreamCard (glass) | `/components/ui/glass/DreamCard.tsx:48` | `whileTap={{ scale: 0.98 }}` |
| ToneSelectionCard | `/components/reflection/ToneSelectionCard.tsx:100` | `whileTap={{ scale: 0.98 }}` |
| DreamBottomSheet | `/components/reflection/mobile/DreamBottomSheet.tsx:203,261` | `whileTap={{ scale: 0.98 }}` |
| ToneStep | `/components/reflection/mobile/ToneStep.tsx:94` | `whileTap={{ scale: 0.98 }}` |
| MobileReflectionFlow | `/components/reflection/mobile/MobileReflectionFlow.tsx:342` | `whileTap={{ scale: 0.98 }}` |

**Pattern:** Standard is `scale: 0.98` with `duration: 0.1`

#### Haptic Feedback Usage
- **Utility:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/haptics.ts` (38 lines)
- **Styles:** `light` (10ms), `medium` (25ms), `heavy` (50ms), `success` ([15,50,30]ms), `warning` ([30,30,30]ms)
- **Implementation:** Uses `navigator.vibrate` with try-catch fallback

**Current Usage:**
| Component | File | Usage |
|-----------|------|-------|
| BottomSheet | `/components/ui/mobile/BottomSheet.tsx:97,150` | `haptic('light')` on dismiss |
| BottomNavigation | `/components/navigation/BottomNavigation.tsx:125` | `haptic('light')` on tab tap |
| DreamBottomSheet | `/components/reflection/mobile/DreamBottomSheet.tsx:109,115` | `haptic('light')` on selection |
| ToneStep | `/components/reflection/mobile/ToneStep.tsx:68` | `haptic('light')` on selection |
| MobileReflectionFlow | `/components/reflection/mobile/MobileReflectionFlow.tsx:214,222,312` | `haptic('light')` on navigation |
| ToneSelection | `/components/reflection/ToneSelection.tsx:21-23` | Raw `navigator.vibrate(50)` |

**Issues:**
- ToneSelection uses raw `navigator.vibrate` instead of the haptic utility
- Dashboard cards don't trigger haptic feedback
- GlassCard doesn't have haptic integration

#### @media (hover: hover) Patterns
Found usage in:
- `/public/shared/foundation.css:125,299,326,338,350` (5 instances)
- `/styles/mirror.css:677` (`@media (hover: none) and (pointer: coarse)`)
- `/styles/auth.css:49` (`@media (hover: none) and (pointer: coarse)`)

**Issues:**
- React components (GlassCard, GlowButton, DashboardCard) do NOT use `@media (hover: hover)` guards
- Hover transforms will trigger on touch devices causing "stuck hover" state

### 3. GlassModal Analysis

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassModal.tsx`
**Lines:** 117 lines

#### Current Animation
- **Overlay:** `modalOverlayVariants` - opacity fade (0.3s enter, 0.2s exit)
- **Content:** `modalContentVariants` - fade + slide up from `y: 20` (0.25s enter, 0.2s exit)
- **No scale animation** - content uses slide only

#### Mobile Treatment
- **Full-screen:** NO - uses `max-w-lg` with `p-4` padding
- **Position:** Centered (`flex items-center justify-center`)
- **Animation direction:** Desktop-style (fade + slide from above)

#### Swipe-to-Dismiss
- **Current:** NO - click backdrop only
- **Close button:** Top-right position (`top-4 right-4`)

#### Issues
- Not full-screen on mobile - feels like desktop popup
- No slide-up-from-bottom animation for mobile
- No swipe gesture support
- Content not scrollable within modal

### 4. GlassInput Analysis

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassInput.tsx`
**Lines:** 222 lines

#### Current Input Height
- Base: `px-4 py-3` (12px horizontal, 12px vertical padding)
- Estimated height: ~44px with base font size
- Textarea: `rows={5}` default

#### Focus States
- Border transitions: `border-2` from `border-white/10` to `border-mirror-purple/60`
- Focus glow via `inputFocusVariants`:
  - `boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.15)'`
- Subtle scale: `focus:scale-[1.01]`

#### Auto-scroll on Focus
- **Current:** NO - no keyboard-aware positioning
- No `scrollIntoView` implementation
- No visual keyboard detection

#### Issues
- Input height (~44px) below mobile-recommended 56px
- No auto-scroll when keyboard appears
- No sticky submit button handling
- Label uses `text-sm` which is small for mobile

### 5. Dashboard Layout

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/page.tsx`
**Grid:** `/components/dashboard/shared/DashboardGrid.tsx` + `DashboardGrid.module.css`

#### Number of Cards
**6 cards total:**
1. DreamsCard - Primary
2. ReflectionsCard - Primary
3. ProgressStatsCard - Secondary
4. EvolutionCard - Secondary
5. VisualizationCard - Tertiary
6. SubscriptionCard - Tertiary

Plus:
- DashboardHero - Hero section with "Reflect Now" CTA
- UsageWarningBanner - Conditional banner

#### Grid Layout

| Breakpoint | Columns | Rows | Gap |
|------------|---------|------|-----|
| > 1200px | 3 | auto | `var(--space-xl)` |
| 1024-1200px | 2 | auto | `var(--space-xl)` |
| < 1024px | 1 | 4+ auto | `var(--space-lg)` |
| < 768px | 1 | auto | `var(--space-md)` |
| < 480px | 1 | auto | `var(--space-sm)` |

**From `DashboardGrid.module.css`:**
```css
.dashboardGrid {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, auto);
}
@media (max-width: 1024px) {
  grid-template-columns: 1fr;
}
```

#### Current Mobile Experience Issues
1. **6 cards = endless scroll** - All cards shown vertically with no prioritization
2. **No horizontal scroll stats** - Everything stacked vertically
3. **Card heights vary** - No consistent card sizing on mobile
4. **Bottom padding exists** - `padding-bottom: calc(64px + env(safe-area-inset-bottom))` for bottom nav
5. **No pull-to-refresh** - Standard refresh via navigation button only
6. **Hero still large on mobile** - Could be more compact

## Patterns Identified

### Touch Feedback Pattern (Established)
**Description:** Standard tap feedback using Framer Motion
**Use Case:** All interactive cards and buttons
**Implementation:**
```tsx
<motion.div
  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
  transition={{ duration: 0.1 }}
>
  {children}
</motion.div>
```
**Recommendation:** Adopt as standard for all interactive elements

### Haptic Pattern (Established)
**Description:** Native vibration feedback on interactions
**Use Case:** Navigation taps, selections, confirmations
**Implementation:**
```typescript
import { haptic } from '@/lib/utils/haptics';
onClick={() => {
  haptic('light');
  // ...action
}}
```
**Recommendation:** Extend to all primary touch actions

### Hover Guard Pattern (Missing)
**Description:** Guard hover effects to prevent mobile issues
**Use Case:** All hover-only visual effects
**Implementation:**
```css
@media (hover: hover) {
  .card:hover {
    transform: translateY(-4px);
  }
}
```
**Recommendation:** Add to all components with hover transforms

## Complexity Assessment

### High Complexity Areas
- **GlassModal Mobile Treatment:** Requires complete restructure for full-screen, slide-up, swipe-to-dismiss
  - Estimated: 3-4 hours
  - May need new `MobileModal` component

### Medium Complexity Areas
- **GlassCard Touch Enhancement:** Add Framer Motion tap states, hover guards
  - Estimated: 1-2 hours
- **GlassInput Height/Keyboard:** Increase size, add scroll behavior
  - Estimated: 2-3 hours
- **Dashboard Mobile Layout:** Reorder cards, add horizontal scroll stats
  - Estimated: 3-4 hours

### Low Complexity Areas
- **Add haptic feedback to cards:** Just import and call
  - Estimated: 30 min
- **Add whileTap to buttons without it:** Pattern exists
  - Estimated: 30 min

## Technology Recommendations

### Framer Motion (Already Used)
- `whileTap={{ scale: 0.98 }}` - Standard tap feedback
- `AnimatePresence` - For modal/sheet transitions
- `useDragControls` - For swipe-to-dismiss (not yet implemented)

### CSS Approach
- Use `@media (hover: hover)` to guard hover effects
- Use `@media (hover: none) and (pointer: coarse)` for touch-specific styles
- Use Tailwind arbitrary values or CSS variables for touch target sizing

### Keyboard Handling
- Consider `visualViewport` API for keyboard detection
- Use `scrollIntoView({ behavior: 'smooth', block: 'center' })` on focus

## Integration Points

### Components Needing Touch Enhancement
1. **GlassCard** - Add whileTap, hover guards
2. **GlowButton** - Already has active states, add haptic
3. **DashboardCard** - Has whileTap, needs hover guards
4. **GlassModal** - Major mobile overhaul needed
5. **GlassInput** - Size increase, keyboard awareness

### Files to Modify
| File | Change |
|------|--------|
| `/components/ui/glass/GlassCard.tsx` | Add Framer Motion, hover guards |
| `/components/ui/glass/GlassModal.tsx` | Full-screen mobile, swipe dismiss |
| `/components/ui/glass/GlassInput.tsx` | 56px height, keyboard scroll |
| `/components/dashboard/DashboardHero.tsx` | Compact mobile version |
| `/components/dashboard/shared/DashboardGrid.tsx` | Mobile layout changes |
| `/styles/dashboard.css` | Hover guards, touch targets |

## Risks & Challenges

### Technical Risks
- **GlassModal Swipe:** Implementing pan gesture dismissal requires careful UX
- **Keyboard Detection:** Cross-browser visual keyboard API support varies
- **Hover Guard Regression:** Could affect desktop experience if not careful

### Complexity Risks
- **Dashboard Reorganization:** May affect user expectations if cards move
- **Modal Full-screen:** Could feel jarring if transition isn't smooth

## Recommendations for Planner

1. **Start with GlassCard touch enhancement** - Highest impact, lowest risk
   - Add `whileTap={{ scale: 0.98 }}` with Framer Motion
   - Wrap hover effects in `@media (hover: hover)` using Tailwind's `@apply` or custom CSS
   - Add optional haptic callback prop

2. **GlassInput size increase is quick win** - Change `py-3` to `py-4` for 56px height
   - Add keyboard scroll behavior in separate hook

3. **GlassModal mobile treatment should be separate builder** - Most complex
   - Consider creating `MobileModal` vs modifying GlassModal
   - Full-screen below 768px, slide-up animation, swipe dismiss

4. **Dashboard mobile optimization is iterative**
   - Phase 1: Compact hero, reorder cards (Dreams + Reflections first)
   - Phase 2: Horizontal scroll stats strip
   - Phase 3: Pull-to-refresh (optional, lower priority)

5. **Hover guard pattern should be added to design system**
   - Create Tailwind utility or CSS mixin for consistent application

## Resource Map

### Critical Files
| Path | Purpose |
|------|---------|
| `/components/ui/glass/GlassCard.tsx` | Base card component |
| `/components/ui/glass/GlassModal.tsx` | Modal component |
| `/components/ui/glass/GlassInput.tsx` | Input component |
| `/components/dashboard/shared/DashboardCard.tsx` | Dashboard-specific card |
| `/lib/animations/variants.ts` | Animation presets |
| `/lib/utils/haptics.ts` | Haptic utility |

### Key Dependencies
- `framer-motion` - Already installed, handles all gestures
- `react-focus-lock` - Used in GlassModal for accessibility
- `lucide-react` - Icon library

### Testing Infrastructure
- Manual testing on real devices (iOS Safari, Android Chrome)
- Chrome DevTools device emulation for basic validation
- No automated mobile interaction tests currently

## Questions for Planner

1. Should hover guards be applied globally via Tailwind config, or component-by-component?
2. Should GlassModal be refactored or should we create a new MobileModal component?
3. Is pull-to-refresh a must-have or nice-to-have for this iteration?
4. Should dashboard cards be reordered/hidden on mobile, or just restyled?
5. What's the minimum touch target size - 48px (WCAG AA) or 56px (iOS recommended)?
