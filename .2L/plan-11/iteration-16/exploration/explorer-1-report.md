# Explorer 1 Report: Architecture & Structure

## Executive Summary

The current navigation system uses a top-fixed AppNavigation component with a hamburger menu for mobile (< 1024px breakpoint). The codebase has a well-structured CSS variable system in `variables.css` with existing spacing, z-index layers, and breakpoint definitions. However, there are no safe-area CSS variables defined in the Next.js app, and the existing viewport meta tag lacks `viewport-fit=cover`. A `FloatingNav` component already exists in the glass UI library which can serve as a reference pattern for the new BottomNavigation component.

## Discoveries

### Current Navigation Implementation

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx` (467 lines)

**Key Features:**
- Fixed top navigation using `GlassCard` with `z-index: 100`
- Desktop nav links hidden on mobile (`hidden lg:flex`)
- Mobile hamburger menu appears at `lg:hidden` (< 1024px)
- User dropdown menu with profile links
- Dynamic `--nav-height` CSS variable set via JavaScript
- Demo banner integration with `--demo-banner-height` variable

**Mobile Menu Behavior:**
- Triggered by hamburger button (Menu/X icons from lucide-react)
- Uses AnimatePresence + Framer Motion for slide animation
- Vertical stacked links with active state highlighting
- Auto-closes on page navigation

**Routes Available:**
```typescript
currentPage: 'dashboard' | 'dreams' | 'reflection' | 'reflections' | 'evolution' | 'visualizations' | 'admin' | 'profile' | 'settings'
```

**Nav Links:**
1. Journey (/dashboard) - Home icon
2. Dreams (/dreams) - Stars icon
3. Reflect (/reflection) - Mirror icon
4. Evolution (/evolution) - Chart icon
5. Visualizations (/visualizations) - Galaxy icon
6. Admin (/admin) - conditional based on user.isCreator/isAdmin

### Layout Structure

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/layout.tsx` (47 lines)

**Structure:**
```tsx
<html lang="en">
  <body>
    <a href="#main-content" className="sr-only">Skip to main content</a>
    <div className="cosmic-background">
      <div className="stars" />
    </div>
    <TRPCProvider>
      <ToastProvider>
        <main id="main-content" tabIndex={-1} className="relative z-10">
          {children}
        </main>
      </ToastProvider>
    </TRPCProvider>
  </body>
</html>
```

**Issues Identified:**
- No `<head>` section with viewport meta tag (Next.js handles this differently)
- Missing `viewport-fit=cover` for notched devices
- No safe area CSS variables defined

**Recommended Bottom Nav Placement:**
The bottom navigation should be added as a sibling to `<main>` within `ToastProvider`, or as a separate component rendered in each authenticated page layout.

### CSS Architecture

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/styles/variables.css` (407 lines)

**Relevant Variables:**

**Spacing (available for bottom nav):**
```css
--space-12: 3rem;      /* 48px - good for nav height */
--space-14: 3.5rem;    /* 56px - ideal touch target height */
--space-16: 4rem;      /* 64px - comfortable nav height */
```

**Z-Index Layers (critical for bottom nav):**
```css
--z-background: 0;
--z-tone-elements: 1;
--z-content: 10;
--z-navigation: 100;    /* Current top nav uses this */
--z-demo-banner: 110;
--z-modal: 1000;
--z-tooltip: 2000;
```

**Layout Variables:**
```css
--nav-height: clamp(60px, 8vh, 80px);  /* Dynamically set by JS */
--demo-banner-height: 0px;             /* Set by DemoBanner component */
--total-header-height: calc(var(--nav-height) + var(--demo-banner-height));
```

**Breakpoints:**
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;   /* Target for mobile bottom nav */
--breakpoint-lg: 1024px;  /* Current hamburger menu threshold */
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

**Missing Variables Needed:**
```css
/* Safe area insets for notched devices */
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);

/* Bottom navigation specific */
--bottom-nav-height: 64px;  /* Suggested: 64px base + safe area */
```

**Transitions:**
```css
--transition-fast: all 0.2s ease;
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

### File Structure

**Navigation Components:**
```
/components/shared/
├── AppNavigation.tsx      # Main app navigation (to modify)
├── DemoBanner.tsx         # Demo user banner
├── LandingNavigation.tsx  # Public page navigation
├── NavigationBase.tsx     # Base navigation component
├── Toast.tsx              # Toast notifications
└── EmptyState.tsx         # Empty state component
```

**Glass UI Components:**
```
/components/ui/glass/
├── FloatingNav.tsx        # Existing floating nav (reference pattern!)
├── GlassCard.tsx          # Glass card component
├── GlassInput.tsx         # Input component
├── GlassModal.tsx         # Modal component
├── GlowButton.tsx         # Button component
└── index.ts               # Exports
```

**Hooks Directory:**
```
/hooks/
├── useAnimatedCounter.ts
├── useAuth.ts
├── useBreathingEffect.ts
├── useDashboard.ts
├── usePortalState.ts
├── useReducedMotion.ts    # Existing! Can reuse for bottom nav
└── useStaggerAnimation.ts
```

**Missing Hooks to Create:**
- `useScrollDirection.ts` - For hide/show on scroll behavior
- `useIsMobile.ts` - For responsive component switching (could use matchMedia)

### Existing FloatingNav Pattern

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/FloatingNav.tsx`

This is an excellent reference! It already uses:
- Fixed bottom positioning
- Glass morphism styling
- Framer Motion animations
- Active state indicators
- Pill-shaped design

**Key Code Pattern:**
```tsx
<motion.nav
  className={cn(
    'fixed bottom-8 left-1/2 -translate-x-1/2 z-40',
    'bg-white/5 backdrop-blur-glass backdrop-saturate-glass',
    'border border-white/10 rounded-full',
    'shadow-glow-lg',
    'px-6 py-3',
  )}
>
```

This can be adapted for the bottom navigation bar.

## Patterns Identified

### Pattern 1: Fixed Navigation with Dynamic Height

**Description:** AppNavigation measures its own height and sets a CSS variable
**Use Case:** Allows content to compensate for navigation without hardcoding heights
**Example:**
```tsx
useEffect(() => {
  const nav = document.querySelector('[data-nav-container]');
  if (nav) {
    const height = nav.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--nav-height', `${height}px`);
  }
}, [showMobileMenu]);
```
**Recommendation:** Apply same pattern to bottom nav with `--bottom-nav-height`

### Pattern 2: Responsive Visibility Classes

**Description:** Tailwind's responsive prefixes for showing/hiding elements
**Use Case:** Different navigation experiences per viewport
**Example:**
```tsx
// Desktop nav links
<div className="hidden lg:flex gap-2">

// Mobile hamburger
<button className="lg:hidden p-2">
```
**Recommendation:** Bottom nav should use `md:hidden` (hidden above 768px)

### Pattern 3: Glass Morphism Cards

**Description:** Consistent glass styling across components
**Use Case:** All cards use similar backdrop blur + gradient + border
**Example:**
```css
backdrop-blur-crystal
bg-gradient-to-br from-white/8 via-transparent to-purple-500/3
border border-white/10
rounded-xl
```
**Recommendation:** Bottom nav should follow this aesthetic

### Pattern 4: Framer Motion Animations

**Description:** AnimatePresence with motion variants for enter/exit
**Use Case:** Smooth transitions for dynamic UI elements
**Example:**
```tsx
<AnimatePresence>
  {showMenu && (
    <motion.nav
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    />
  )}
</AnimatePresence>
```
**Recommendation:** Use for bottom nav hide/show on scroll

## Complexity Assessment

### Low Complexity Areas

1. **BottomNavigation Component** (NEW)
   - Straightforward fixed-bottom implementation
   - Can reference FloatingNav.tsx pattern
   - Standard active state handling
   - Estimated: 2-3 hours

2. **Safe Area CSS Variables** (ADD to variables.css)
   - Simple env() declarations
   - Well-documented pattern exists in `/public/` files
   - Estimated: 0.5 hours

3. **Viewport Meta Tag** (MODIFY layout.tsx)
   - Single line addition to metadata
   - Next.js handles this via export const metadata
   - Estimated: 0.25 hours

### Medium Complexity Areas

1. **useScrollDirection Hook** (NEW)
   - Requires scroll event throttling
   - State management for direction
   - Touch-friendly debouncing
   - Estimated: 1-2 hours

2. **AppNavigation Modification**
   - Need to slim down mobile header (logo + avatar only)
   - Hide hamburger menu on mobile when bottom nav active
   - Keep desktop unchanged
   - Estimated: 1-2 hours

3. **Content Padding Adjustment**
   - Dashboard and other pages need bottom padding
   - Must account for bottom nav height + safe area
   - Estimated: 1 hour

## Technology Recommendations

### Primary Stack (Already in Use)

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS + CSS custom properties
- **Animations:** Framer Motion (already imported)
- **Icons:** Lucide React (already imported)
- **State:** React useState/useEffect

### Supporting Approach

- **Viewport Detection:** `matchMedia` for responsive behavior
- **Scroll Detection:** `requestAnimationFrame` + scroll event
- **Haptic Feedback:** `navigator.vibrate()` where supported
- **Safe Areas:** CSS `env(safe-area-inset-*)` functions

## Integration Points

### Component Hierarchy

```
app/layout.tsx
└── TRPCProvider
    └── ToastProvider
        ├── AppNavigation (TOP - per-page)
        ├── main#main-content
        │   └── page content
        └── BottomNavigation (BOTTOM - NEW)
```

### State Sharing

- **Active Page:** Prop passed from each page to navigation
- **User Data:** via useAuth() hook
- **Scroll Direction:** Local state in BottomNavigation

### CSS Variable Dependencies

```
BottomNavigation needs:
├── --bottom-nav-height
├── --safe-area-bottom
├── --z-navigation (or dedicated --z-bottom-nav)
└── --transition-smooth

Dashboard/Pages need:
└── padding-bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom))
```

## Risks & Challenges

### Technical Risks

1. **iOS Safari Rubber-banding**
   - Impact: Bottom nav may bounce during overscroll
   - Mitigation: Use `position: fixed` + proper `bottom: 0` + safe area padding

2. **Keyboard Interference**
   - Impact: Virtual keyboard may push bottom nav up on some devices
   - Mitigation: Hide bottom nav when input focused (or detect keyboard)

3. **Z-Index Conflicts**
   - Impact: Toast notifications or modals may overlap
   - Mitigation: Ensure z-index hierarchy (bottom nav: 100, modals: 1000)

### Complexity Risks

1. **Scroll Direction Detection Jitter**
   - Likelihood: Medium
   - Mitigation: Threshold-based detection (10px minimum scroll)

2. **Responsive State Sync**
   - Likelihood: Low
   - Mitigation: Single source of truth for breakpoint detection

## Recommendations for Planner

### 1. Component Structure

Create the following file structure:
```
/components/navigation/
├── BottomNavigation.tsx       # Main bottom nav component
├── BottomNavigation.css       # Styles (or use Tailwind only)
└── index.ts                   # Exports

/lib/hooks/
├── useScrollDirection.ts      # Scroll direction detection
└── useIsMobile.ts             # Viewport detection (optional)
```

### 2. Modify Existing Files

- **variables.css:** Add safe area variables + bottom nav height
- **layout.tsx:** Add viewport-fit=cover to metadata
- **AppNavigation.tsx:** Hide mobile menu button when bottom nav active
- **Dashboard (and other pages):** Add bottom padding for bottom nav

### 3. Implementation Order

1. Add safe area CSS variables to `variables.css`
2. Update viewport meta in `layout.tsx`
3. Create `useScrollDirection` hook
4. Create `BottomNavigation` component
5. Integrate with pages (pass currentPage prop)
6. Update `AppNavigation` for coexistence
7. Add bottom padding to page layouts

### 4. Breakpoint Strategy

- **Mobile (< 768px):** Show bottom nav, hide top nav links
- **Tablet (768-1024px):** Hide bottom nav, show hamburger menu
- **Desktop (> 1024px):** Hide bottom nav, show full top nav

This aligns with the master plan's specification of `md:hidden` for the bottom nav.

### 5. Navigation Items for Bottom Nav

Based on vision requirements, the 5 tabs should be:
1. Home (/dashboard) - House icon
2. Dreams (/dreams) - Stars icon
3. Reflect (/reflection) - Mirror icon (center, primary)
4. Evolution (/evolution) - Chart icon
5. Profile (/profile) - User icon

Note: Visualizations and Admin are intentionally excluded (secondary pages).

## Resource Map

### Critical Files/Directories

| Path | Purpose |
|------|---------|
| `/components/shared/AppNavigation.tsx` | Modify for mobile coexistence |
| `/styles/variables.css` | Add safe area + bottom nav variables |
| `/app/layout.tsx` | Add viewport-fit=cover |
| `/components/ui/glass/FloatingNav.tsx` | Reference pattern for bottom nav |
| `/hooks/useReducedMotion.ts` | Reuse for accessibility |

### Key Dependencies

| Dependency | Purpose |
|------------|---------|
| framer-motion | Animations for show/hide |
| lucide-react | Navigation icons |
| next/navigation | Router hooks |
| @/lib/utils (cn) | Class name merging |

### Testing Infrastructure

- Manual testing on iOS Safari (notched devices)
- Chrome DevTools device simulation
- Verify z-index with toast notifications
- Test with virtual keyboard open

## Questions for Planner

1. Should the bottom nav hide completely on scroll, or slide down with spring animation?
2. Should the "Reflect" tab be styled differently (larger, centered) as a primary CTA?
3. Should haptic feedback be implemented now or deferred to post-MVP?
4. Should the bottom nav be visible during the reflection experience (currently full-screen takeover)?
5. Do we need a dedicated useIsMobile hook, or is Tailwind responsive classes sufficient?

---

**Report Generated:** 2025-12-02
**Explorer:** 1 (Architecture & Structure)
**Iteration:** 16 - Mobile Navigation Foundation
