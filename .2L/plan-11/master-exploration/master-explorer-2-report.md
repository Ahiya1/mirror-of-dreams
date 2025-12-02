# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
UI Patterns & Component Inventory

## Vision Summary
Transform Mirror of Dreams from a "responsive desktop" experience into a mobile-first experience with bottom navigation, full-screen reflection flow, touch-optimized interactions, and native mobile patterns while maintaining the cosmic glass aesthetic.

---

## Current UI Component Inventory

### Core Glass Components (`/components/ui/glass/`)

| Component | File | Purpose | Touch Support | Mobile Optimization |
|-----------|------|---------|---------------|---------------------|
| **GlassCard** | `GlassCard.tsx` | Base card component with glass morphism | Has `active:scale-[0.99]` tap feedback | Needs larger touch targets |
| **GlowButton** | `GlowButton.tsx` | Primary button with cosmic variants | Has `active:scale-[0.98]` and `:active` states | 200ms transition - snappy; needs 48px+ height |
| **GlassModal** | `GlassModal.tsx` | Modal dialog with overlay | Escape key support, focus trap | **Needs full-screen mobile treatment, swipe-to-dismiss** |
| **GlassInput** | `GlassInput.tsx` | Form inputs with validation | Focus glow animation, shake on error | **Needs keyboard-aware positioning** |
| **GlowBadge** | `GlowBadge.tsx` | Status badges (success/warning/error/info) | None | Adequate sizing |
| **DreamCard** | `DreamCard.tsx` | Dream entry display | `whileTap: scale(0.98)` via Framer Motion | Good - already has tap feedback |
| **FloatingNav** | `FloatingNav.tsx` | Bottom navigation prototype | Hover states only | **Exists but needs mobile adaptation** |
| **CosmicLoader** | `CosmicLoader.tsx` | Loading spinner | None needed | Works well |
| **GradientText** | `GradientText.tsx` | Gradient text styling | None needed | Works well |
| **ProgressOrbs** | `ProgressOrbs.tsx` | Step indicator | None | Could be reused for reflection steps |

### Dashboard Components (`/components/dashboard/`)

| Component | Touch Patterns | Mobile Issues |
|-----------|----------------|---------------|
| **DashboardCard** | Has ripple effect on click, `cardPressVariants` for tap feedback | Hover-dependent animations; **needs touch equivalents** |
| **WelcomeSection** | None | Module CSS exists |
| **DashboardGrid** | None | Switches to single column < 1024px |
| **UsageCard** | None | Works |
| **ReflectionsCard** | Click handlers | List items need swipe actions |
| **DreamsCard** | Click handlers | Works |
| **EvolutionCard** | Click handlers | Works |
| **SubscriptionCard** | Click handlers | Works |

### Reflection Components (`/components/reflection/`)

| Component | Mobile Status |
|-----------|---------------|
| **QuestionStep** | Vertical stacked form - **needs full-screen step-by-step treatment** |
| **ToneSelection** | Click-based selection | Touch targets adequate |
| **CharacterCounter** | Works | Uses Framer Motion color variants |
| **ProgressIndicator** | Works | Could enhance for step-based flow |
| **ProgressBar** | Works | - |

---

## Hover vs Touch State Analysis

### Current Hover Patterns Found

1. **GlassCard hover effects:**
   ```css
   hover:-translate-y-0.5
   hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)]
   hover:border-purple-400/30
   ```
   **Issue:** No `:active` equivalents for touch

2. **Dashboard card hover (dashboard.css):**
   ```css
   .dashboard-card:hover {
     transform: translateY(-4px) scale(1.01);
     box-shadow: 0 20px 64px rgba(139, 92, 246, 0.4);
   }
   ```
   **Issue:** Desktop-only transform; on touch this triggers briefly and looks janky

3. **Crystal glass hover (globals.css):**
   ```css
   .crystal-glass:hover::after {
     transform: translateX(100%) rotate(10deg);
   }
   .crystal-glass:hover {
     transform: translateY(-3px) scale(1.01);
   }
   ```
   **Issue:** Shimmer sweep is hover-only; needs touch alternative

4. **Navigation links:**
   ```css
   .dashboard-nav__link:hover {
     transform: translateY(-1px);
     box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
   }
   ```
   **Issue:** On mobile, tapping nav link has no feedback until navigation occurs

### Components With Touch Support Already

1. **GlowButton** - Has `active:scale-[0.98] active:opacity-80`
2. **GlassCard** - Has `active:scale-[0.99]` but only when interactive
3. **DreamCard** - Uses `whileTap={{ scale: 0.98 }}`
4. **DashboardCard** - Uses `cardPressVariants` with Framer Motion

### Recommended Touch Pattern

```typescript
// Standard touch feedback pattern for all interactive elements
const touchFeedback = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 }
};

// For CSS:
.touch-feedback {
  @apply active:scale-[0.98] active:opacity-90;
  @apply transition-transform duration-100;
}
```

---

## Animation Patterns Analysis

### Framer Motion Variants (`/lib/animations/variants.ts`)

**Available & Mobile-Friendly:**
- `cardVariants` - Entrance fade + slide up (y: 20 -> 0)
- `modalOverlayVariants` - Fade in/out
- `modalContentVariants` - Slide up entrance (y: 20 -> 0)
- `fadeInVariants` - Simple opacity fade
- `slideUpVariants` - Slide from bottom
- `staggerContainer` / `staggerItem` - Staggered children
- `cardPressVariants` - `scale: 0.98` on tap

**Need Enhancement for Mobile:**
- `modalContentVariants` - Need `slideUp` from bottom (currently y: 20 only)
- No `drag` or gesture variants defined

**Deprecated/Not for Mobile:**
- `pulseGlowVariants` - Marked deprecated
- `floatVariants` - Marked deprecated
- `buttonVariants` - Opacity only, use CSS instead

### CSS Animations (`/styles/animations.css`)

**Entrance Animations (keep):**
- `fadeIn`, `slideInUp`, `slideInDown` - 0.6s ease-out
- `cardEntrance`, `cardFloat` - 0.8s ease-out with scale
- `staggerFade` - For lists

**Continuous Animations (use sparingly on mobile - battery drain):**
- `breathe`, `breatheSubtle` - 4-6s infinite
- `float`, `floatGentle` - 3-4s infinite
- `pulse`, `pulseGlow` - 2-3s infinite
- `shimmer` - Sweep effect

**Reduced Motion Support:** Fully implemented - all continuous animations disabled

### Recommended New Animations for Mobile

1. **Bottom Sheet Slide:**
   ```typescript
   export const bottomSheetVariants = {
     hidden: { y: '100%', opacity: 0 },
     visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 }},
     exit: { y: '100%', opacity: 0, transition: { duration: 0.2 }}
   };
   ```

2. **Page Swipe Transition:**
   ```typescript
   export const swipeVariants = {
     enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
     center: { x: 0, opacity: 1 },
     exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
   };
   ```

---

## Design System Analysis

### CSS Variables (`/styles/variables.css`)

**Color Tokens (Mobile-Ready):**
- `--cosmic-bg: #020617` (true black-ish - good for OLED)
- `--cosmic-text: #ffffff` with opacity variants (100%, 80%, 60%, 40%)
- Tone colors: `--fusion-*`, `--gentle-*`, `--intense-*`
- Semantic: `--success-*`, `--warning-*`, `--error-*`, `--info-*`

**Glass Morphism (Already Defined):**
- `--glass-bg` - Gradient with 8%-3% white opacity
- `--glass-border` - 10% white
- `--glass-blur-sm/md/lg` - 8px/16px/24px

**Spacing (Fluid - Mobile-Ready):**
```css
--space-xs: clamp(0.5rem, 1vw, 0.75rem);    /* 8-12px */
--space-sm: clamp(0.75rem, 1.5vw, 1rem);    /* 12-16px */
--space-md: clamp(1rem, 2.5vw, 1.5rem);     /* 16-24px */
--space-lg: clamp(1.5rem, 3vw, 2rem);       /* 24-32px */
--space-xl: clamp(2rem, 4vw, 3rem);         /* 32-48px */
```
**Great foundation - automatically scales on mobile.**

**Typography (Fluid - Mobile-Ready):**
```css
--text-base: clamp(1.05rem, 2.5vw, 1.15rem);  /* 17-18px body */
--text-4xl: clamp(2.2rem, 6vw, 3rem);         /* 35-48px h1 */
```

**Component Dimensions:**
- `--input-height: 52px` - Below 56px mobile target
- `--button-height: 52px` - Below 56px mobile target
- `--header-height: 64px` - **Needs dynamic for bottom nav**
- `--nav-height: clamp(60px, 8vh, 80px)` - Good

**Missing for Mobile:**
- `--bottom-nav-height` (suggest: 64px + safe-area-inset-bottom)
- `--safe-area-inset-*` - Need to add for notched devices
- `--touch-target-min: 48px` - Need to define

### Breakpoints (Tailwind Config)

```typescript
// From variables.css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;   // Primary mobile breakpoint
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

**Current Responsive Behavior (dashboard.css):**
- `< 1024px`: Grid becomes single column, nav links hidden
- `< 768px`: Smaller padding, logo text hidden, toast full-width
- `< 480px`: Minimal padding, some button text hidden

**Recommended Mobile-First Approach:**
```css
/* Mobile default (no media query) */
.component { /* mobile styles */ }

/* Then enhance for larger */
@media (min-width: 768px) { /* tablet+ */ }
@media (min-width: 1024px) { /* desktop */ }
```

---

## New Components Required for Mobile

### 1. Bottom Sheet Component (HIGH PRIORITY)

**Purpose:** Native-feeling modal from bottom with drag-to-dismiss

**Requirements:**
- Slide up from bottom with spring animation
- Drag handle at top
- Swipe down to dismiss (threshold: 100px or 30% height)
- Backdrop click dismisses
- Multiple height modes: `auto | half | full`
- Safe area padding for home indicator

**Suggested Location:** `/components/ui/mobile/BottomSheet.tsx`

**Implementation Approach:**
```typescript
import { motion, useDragControls, useMotionValue } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  height?: 'auto' | 'half' | 'full';
  children: React.ReactNode;
}
```

### 2. Bottom Navigation Component (HIGH PRIORITY)

**Purpose:** Fixed bottom navigation bar for mobile

**Requirements:**
- 5 items: Home, Dreams, Reflect (center/prominent), Evolution, Profile
- Active state with indicator (pill or underline)
- Auto-hide on scroll down, reveal on scroll up
- Safe area padding for home indicator
- Haptic feedback (via `navigator.vibrate` where supported)
- Hide on desktop (> 768px or 1024px)

**Suggested Location:** `/components/navigation/BottomNavigation.tsx`

**Note:** `FloatingNav.tsx` exists but is positioned `bottom-8` with pill styling. Need to adapt or replace with fixed bottom variant.

### 3. Full-Screen Reflection Flow (HIGH PRIORITY)

**Purpose:** Step-by-step reflection experience on mobile

**Requirements:**
- Full viewport height per question (minus keyboard)
- Swipe left/right or buttons to navigate
- Progress dots at top
- Keyboard-aware textarea positioning
- Exit confirmation if unsaved
- Immersive loading state

**Suggested Location:** `/components/reflection/mobile/MobileReflectionFlow.tsx`

**Integration:** Could wrap existing `QuestionStep` or replace for mobile viewport.

### 4. Touch-Optimized Card Wrapper (MEDIUM PRIORITY)

**Purpose:** Consistent touch feedback for all cards

**Requirements:**
- Wrap any card content
- Add `whileTap={{ scale: 0.98 }}`
- Disable hover transforms on touch devices
- Haptic feedback on tap (optional)

**Suggested Location:** `/components/ui/mobile/TouchCard.tsx`

### 5. Pull-to-Refresh Component (LOW PRIORITY - POST MVP)

**Purpose:** Native refresh gesture

**Suggested Library:** `react-pull-to-refresh` or custom with Framer Motion drag

---

## Existing Components Needing Touch Optimization

### Priority 1: Navigation

**AppNavigation.tsx**
- Current: Hamburger menu on mobile, dropdown user menu
- Needed:
  - Replace with bottom nav on mobile
  - Keep top bar minimal (logo + user avatar only)
  - User dropdown should become bottom sheet on mobile

### Priority 2: Cards

**GlassCard.tsx**
- Add `@media (hover: hover)` for hover-only effects
- Ensure `active:` states work on touch

**DashboardCard.tsx**
- Already has `cardPressVariants` - good
- Shimmer effect is hover-only - add touch alternative or remove on mobile

### Priority 3: Modals

**GlassModal.tsx**
- Current: Centered modal with fade
- Needed on mobile:
  - Full-screen treatment (`fixed inset-0` on mobile)
  - Slide up from bottom animation
  - Swipe down to dismiss
  - Close button in top-right always visible

**CreateDreamModal.tsx** (in `/components/dreams/`)
- Same treatment as GlassModal

**UpgradeModal.tsx** (in `/components/subscription/`)
- Same treatment

### Priority 4: Forms

**GlassInput.tsx**
- Current: Has focus glow, error shake
- Needed:
  - Input height 56px minimum on mobile
  - Auto-scroll into view when focused (likely needs page-level handling)
  - "Done" button in keyboard toolbar (iOS)

**QuestionStep.tsx** (reflection)
- Textarea rows may be too short for mobile
- Need keyboard-aware positioning

---

## Framer Motion Gesture Capabilities

**Currently Used:**
- `whileTap={{ scale: 0.98 }}` - In DreamCard, via cardPressVariants
- `AnimatePresence` - For modal enter/exit
- `motion.div` with variants - Everywhere

**Available but Not Used:**
- `drag` - For swipe gestures
- `onPan` / `onDrag` - For bottom sheet dismiss
- `useMotionValue` - For tracking drag position
- `useDragControls` - For programmatic drag control

**Recommended Usage for Mobile:**

1. **Bottom Sheet Drag:**
   ```typescript
   const y = useMotionValue(0);
   const controls = useDragControls();

   <motion.div
     drag="y"
     dragControls={controls}
     dragConstraints={{ top: 0 }}
     dragElastic={{ top: 0, bottom: 0.5 }}
     onDragEnd={(_, info) => {
       if (info.offset.y > 100) onClose();
     }}
   />
   ```

2. **Swipe Navigation:**
   ```typescript
   const [[page, direction], setPage] = useState([0, 0]);

   <motion.div
     drag="x"
     dragConstraints={{ left: 0, right: 0 }}
     onDragEnd={(_, info) => {
       if (info.offset.x > 100) paginate(-1);
       if (info.offset.x < -100) paginate(1);
     }}
   />
   ```

---

## Component Organization Recommendations

### Directory Structure

```
/components
  /ui
    /glass         # Existing - keep for desktop-first components
      GlassCard.tsx
      GlowButton.tsx
      GlassModal.tsx
      ...
    /mobile        # NEW - mobile-specific components
      BottomSheet.tsx
      TouchCard.tsx
      SwipeContainer.tsx
      index.ts
  /navigation      # NEW or refactor
    BottomNavigation.tsx      # NEW
    AppNavigation.tsx         # Exists - refactor
    FloatingNav.tsx           # May deprecate
  /reflection
    /mobile        # NEW - mobile reflection flow
      MobileReflectionFlow.tsx
      MobileQuestionStep.tsx
```

### Responsive Component Pattern

```typescript
// Pattern 1: Separate components
const DreamSelector = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <DreamSelectorSheet /> : <DreamSelectorDropdown />;
};

// Pattern 2: Responsive props
<GlassModal
  variant={isMobile ? 'fullscreen' : 'centered'}
  animation={isMobile ? 'slideUp' : 'scaleIn'}
/>
```

---

## Responsive Breakpoint Strategy

### Current Approach (Desktop-First)

```css
/* Base = desktop */
.component { desktop styles }

@media (max-width: 1024px) { tablet adjustments }
@media (max-width: 768px) { mobile styles }
@media (max-width: 480px) { small mobile styles }
```

### Recommended Approach (Mobile-First)

```css
/* Base = mobile */
.component { mobile styles }

@media (min-width: 768px) { tablet styles }
@media (min-width: 1024px) { desktop styles }
```

### Tailwind Mobile-First Classes

```html
<!-- Mobile-first example -->
<div class="p-4 md:p-6 lg:p-8">
  <!-- 16px mobile, 24px tablet, 32px desktop -->
</div>

<!-- Hide bottom nav on desktop -->
<nav class="fixed bottom-0 md:hidden">
  <!-- visible on mobile only -->
</nav>

<!-- Show top nav on desktop -->
<nav class="hidden md:flex">
  <!-- visible on tablet+ only -->
</nav>
```

---

## Touch Interaction Patterns to Implement

### 1. Tap Feedback
```typescript
// Apply to all interactive elements
whileTap={{ scale: 0.98 }}
transition={{ duration: 0.1 }}
```

### 2. Swipe Actions on Lists
```typescript
// For reflection items, dream items
<SwipeableListItem
  onSwipeLeft={() => openMenu()}
  onSwipeRight={() => archive()}
  leftAction={<EditIcon />}
  rightAction={<ArchiveIcon />}
/>
```

### 3. Pull-to-Refresh
```typescript
// Dashboard, list pages
<PullToRefresh onRefresh={handleRefresh}>
  <DashboardContent />
</PullToRefresh>
```

### 4. Long Press
```typescript
// For context menus (optional)
const longPress = useLongPress(() => openContextMenu(), { threshold: 500 });
<DreamCard {...longPress} />
```

### 5. Haptic Feedback
```typescript
const haptic = (type: 'light' | 'medium' | 'heavy') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(type === 'light' ? 10 : type === 'medium' ? 20 : 30);
  }
};
```

---

## Safe Area Handling

### CSS Solution

```css
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}

.bottom-nav {
  padding-bottom: calc(16px + var(--safe-area-bottom));
}

.full-screen-modal {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
}
```

### Viewport Meta Tag

Ensure `app/layout.tsx` has:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

---

## Risk Assessment

### Low Risk
- Adding touch feedback to existing components (additive change)
- Creating new mobile components in `/components/ui/mobile/`
- Adding CSS variables for safe areas

### Medium Risk
- Refactoring `AppNavigation` to conditionally render bottom nav
- Modifying `GlassModal` to support full-screen mobile variant
- Changing reflection flow to step-by-step on mobile

### High Risk
- None - this is primarily additive/CSS changes

---

## Implementation Recommendations

### Phase 1: Foundation (Estimated 6-8 hours)
1. Create `BottomNavigation.tsx` component
2. Create `BottomSheet.tsx` component
3. Add safe area CSS variables
4. Add touch feedback utility classes
5. Modify `AppNavigation` to hide on mobile, show bottom nav

### Phase 2: Reflection Flow (Estimated 5-7 hours)
1. Create `MobileReflectionFlow.tsx` - step-by-step experience
2. Dream selection via `BottomSheet`
3. Keyboard-aware textarea handling
4. Immersive loading state

### Phase 3: Polish (Estimated 4-5 hours)
1. Touch-optimize all modals (full-screen treatment)
2. Add swipe-to-dismiss to modals
3. Review all hover effects, add touch alternatives
4. Pull-to-refresh on dashboard
5. Larger touch targets on all CTAs

---

## Summary

**Strengths of Current Codebase:**
- Well-structured glass component library
- Framer Motion already in use with good patterns
- Fluid spacing and typography - scales well
- Reduced motion support implemented
- Clean separation of concerns

**Gaps for Mobile:**
1. No bottom navigation component
2. No bottom sheet component
3. Modals are centered, not full-screen on mobile
4. Hover effects dominate, touch feedback is secondary
5. Reflection flow is not step-by-step
6. No safe area handling for notched devices

**Key Files to Modify:**
- `/components/shared/AppNavigation.tsx` - Add bottom nav condition
- `/components/ui/glass/GlassModal.tsx` - Add mobile variant
- `/styles/variables.css` - Add safe area, touch target variables
- `/app/reflection/page.tsx` - Conditionally render mobile flow

**Key Files to Create:**
- `/components/navigation/BottomNavigation.tsx`
- `/components/ui/mobile/BottomSheet.tsx`
- `/components/reflection/mobile/MobileReflectionFlow.tsx`
- `/lib/hooks/useMediaQuery.ts` (if not exists)

---

*Exploration completed: 2025-12-02*
*This report informs master planning decisions*
