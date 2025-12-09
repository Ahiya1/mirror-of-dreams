# Master Explorer 5: Component Architecture & Code Organization

## Executive Summary

The Mirror of Dreams codebase has grown organically through 17 plans, resulting in a component architecture with both well-designed patterns and areas needing consolidation. The glass design system (`/components/ui/glass/`) represents the most cohesive subsystem, while the reflection flow has parallel desktop/mobile implementations that could benefit from unification. There are several duplicate patterns (e.g., two DreamCard components, two QuestionStep components, two card base components) and a few orphaned components. The hooks are split between `/hooks/` and `/lib/hooks/` without clear rationale. Overall, the architecture is functional but would benefit from consolidation in Iteration 1.

---

## Component Inventory

### Total Component Count: 63 Components

### 1. UI Primitives (`/components/ui/`) - 13 Components

**Glass Design System (`/components/ui/glass/`):**
| Component | Purpose | Used By |
|-----------|---------|---------|
| `GlassCard.tsx` | Foundation glass-morphism card | 20+ components |
| `GlowButton.tsx` | Primary button with glow effects | 25+ components |
| `GlassInput.tsx` | Text input with glass styling | 10+ components |
| `GlassModal.tsx` | Modal with glass backdrop | 8+ components |
| `GradientText.tsx` | Text with gradient styling | 5+ components |
| `GlowBadge.tsx` | Status badges with variants | 5+ components |
| `CosmicLoader.tsx` | Loading spinner | 15+ components |
| `ProgressOrbs.tsx` | Step indicator orbs | 2 components |
| `DreamCard.tsx` | **DUPLICATE - glass-styled dream card** | **NOT USED** |
| `FloatingNav.tsx` | Navigation component | **NOT USED (orphaned)** |
| `AnimatedBackground.tsx` | Animated bg effects | **NOT USED (orphaned)** |
| `index.ts` | Barrel export | - |

**Mobile UI (`/components/ui/mobile/`):**
| Component | Purpose | Used By |
|-----------|---------|---------|
| `BottomSheet.tsx` | Slide-up sheet for mobile | 1 component |
| `index.ts` | Barrel export | - |

**Other UI:**
| Component | Purpose | Used By |
|-----------|---------|---------|
| `PasswordToggle.tsx` | Password visibility toggle | 1 component |

### 2. Shared Components (`/components/shared/`) - 11 Components

| Component | Purpose | Used By |
|-----------|---------|---------|
| `AppNavigation.tsx` | Main app navigation | 15+ pages |
| `NavigationBase.tsx` | Base navigation component | 2 components |
| `LandingNavigation.tsx` | Landing page navigation | 1 page |
| `CosmicBackground.tsx` | Animated background | 5+ pages |
| `EmptyState.tsx` | Empty list placeholder | 4+ pages |
| `MarkdownPreview.tsx` | Markdown renderer | 3 components |
| `Toast.tsx` | Toast notification | ToastContext |
| `DemoBanner.tsx` | Demo user banner | AppNavigation |

**Illustrations (`/components/shared/illustrations/`):**
| Component | Purpose | Used By |
|-----------|---------|---------|
| `BlankJournal.tsx` | SVG illustration | 1 component |
| `Constellation.tsx` | SVG illustration | 1 component |
| `CosmicSeed.tsx` | SVG illustration | 1 component |
| `CanvasVisual.tsx` | SVG illustration | 1 component |

### 3. Feature Components

**Dashboard (`/components/dashboard/`) - 14 Components:**

_Cards (`/components/dashboard/cards/`)_:
| Component | Purpose | Lines |
|-----------|---------|-------|
| `DreamsCard.tsx` | Dreams summary card | ~390 |
| `ReflectionsCard.tsx` | Recent reflections | ~207 |
| `ProgressStatsCard.tsx` | Progress statistics | ~316 |
| `EvolutionCard.tsx` | Evolution insights | ~449 |
| `VisualizationCard.tsx` | Visualization preview | ~342 |
| `SubscriptionCard.tsx` | Subscription status | ~477 |
| `UsageCard.tsx` | Usage tracking | ~121 |

_Shared (`/components/dashboard/shared/`)_:
| Component | Purpose | Used By |
|-----------|---------|---------|
| `DashboardCard.tsx` | Card base component | All dashboard cards |
| `DashboardGrid.tsx` | Grid layout | Dashboard page |
| `WelcomeSection.tsx` | Welcome message | **NOT USED (orphaned)** |
| `ProgressRing.tsx` | Circular progress | ProgressStatsCard |
| `ReflectionItem.tsx` | Reflection list item | ReflectionsCard |
| `TierBadge.tsx` | Subscription tier badge | SubscriptionCard |

_Hero_:
| Component | Purpose | Used By |
|-----------|---------|---------|
| `DashboardHero.tsx` | Dashboard hero section | Dashboard page |

**Reflection (`/components/reflection/`) - 12 Components:**

_Desktop:_
| Component | Purpose | Used By |
|-----------|---------|---------|
| `ReflectionQuestionCard.tsx` | Question card (desktop) | MirrorExperience |
| `QuestionStep.tsx` | Question input (desktop) | **Uses old patterns** |
| `ToneSelection.tsx` | Tone picker | MirrorExperience |
| `ToneSelectionCard.tsx` | Tone card variant | MirrorExperience, MobileFlow |
| `ToneBadge.tsx` | Tone display badge | Reflection detail |
| `ProgressBar.tsx` | Progress indicator | MirrorExperience |
| `ProgressIndicator.tsx` | **DUPLICATE - progress display** | **NOT USED** |
| `CharacterCounter.tsx` | Character count display | QuestionStep (desktop) |

_Mobile (`/components/reflection/mobile/`)_:
| Component | Purpose | Used By |
|-----------|---------|---------|
| `MobileReflectionFlow.tsx` | Complete mobile wizard | MirrorExperience |
| `QuestionStep.tsx` | **DUPLICATE - mobile question step** | MobileReflectionFlow |
| `ToneStep.tsx` | Mobile tone selection | **Not directly used** |
| `DreamBottomSheet.tsx` | Dream selector sheet | MobileReflectionFlow |
| `ExitConfirmation.tsx` | Exit confirmation modal | MobileReflectionFlow |
| `GazingOverlay.tsx` | Loading/processing overlay | MobileReflectionFlow |
| `index.ts` | Barrel export | - |

**Reflections List (`/components/reflections/`) - 5 Components:**
| Component | Purpose | Used By |
|-----------|---------|---------|
| `ReflectionCard.tsx` | Reflection list card | Reflections page |
| `ReflectionFilters.tsx` | Filter controls | Reflections page |
| `FeedbackForm.tsx` | Reflection feedback | Reflection detail |
| `AIResponseRenderer.tsx` | AI response display | Multiple pages |
| `types.ts` | Type definitions | Internal |

**Dreams (`/components/dreams/`) - 4 Components:**
| Component | Purpose | Used By |
|-----------|---------|---------|
| `DreamCard.tsx` | Dream display card | Dreams page |
| `CreateDreamModal.tsx` | Create dream form | Dreams page |
| `EvolutionModal.tsx` | Evolution dialog | Dreams page |
| `EvolutionHistory.tsx` | Evolution timeline | Evolution page |

**Subscription (`/components/subscription/`) - 8 Components:**
| Component | Purpose | Used By |
|-----------|---------|---------|
| `SubscriptionStatusCard.tsx` | Subscription display | Profile page |
| `PricingCard.tsx` | Pricing tier card | Pricing page |
| `CheckoutButton.tsx` | Payment button | Pricing page |
| `PayPalCheckoutModal.tsx` | PayPal flow | Checkout |
| `UpgradeModal.tsx` | Upgrade prompt | Multiple pages |
| `CancelSubscriptionModal.tsx` | Cancel flow | Settings |
| `UsageWarningBanner.tsx` | Limit warning | Dashboard |
| `FeatureLockOverlay.tsx` | Premium lock | Dashboard cards |

**Other Feature Components:**
| Path | Component | Purpose |
|------|-----------|---------|
| `/components/navigation/BottomNavigation.tsx` | Bottom nav | Mobile navigation |
| `/components/auth/AuthLayout.tsx` | Auth page layout | Sign in/up pages |
| `/components/landing/LandingHero.tsx` | Landing hero | Home page |
| `/components/landing/LandingFeatureCard.tsx` | Feature cards | Home page |
| `/components/clarify/ClarifyCard.tsx` | Clarify feature | Dashboard |
| `/components/icons/DreamCategoryIcon.tsx` | Category icons | Dreams |
| `/components/icons/DreamStatusIcon.tsx` | Status icons | Dreams |
| `/components/providers/TRPCProvider.tsx` | tRPC setup | Root layout |

---

## Dependency Map

### Core Dependencies (Most Imported)

```
GlassCard (ui/glass)
├── GlowButton (15+ imports)
├── CosmicLoader (15+ imports)
├── All dashboard cards
├── All subscription components
├── MobileReflectionFlow
└── Multiple page components

useAuth (hooks)
├── Dashboard page
├── All pages requiring auth
├── Navigation components
└── DashboardHero

trpc (lib)
├── All feature components with data
├── useAuth hook
└── useDashboard hook
```

### Component Composition Hierarchy

```
Layout
├── TRPCProvider (root)
│   └── ToastProvider
│       └── NavigationProvider
│           └── Page Content
│
├── AppNavigation
│   ├── GlassCard
│   ├── GlowButton
│   ├── DemoBanner
│   └── User dropdown (inline)
│
└── BottomNavigation
    └── useNavigation context
```

### Page-to-Component Dependencies

```
Dashboard Page
├── AppNavigation
├── BottomNavigation
├── CosmicBackground
├── DashboardHero
├── DashboardGrid
│   ├── DreamsCard (uses DashboardCard)
│   ├── ReflectionsCard (uses DashboardCard)
│   ├── ProgressStatsCard (uses DashboardCard)
│   ├── EvolutionCard (uses DashboardCard)
│   ├── VisualizationCard (uses DashboardCard)
│   ├── ClarifyCard (uses DashboardCard)
│   └── SubscriptionCard (uses DashboardCard)
└── UsageWarningBanner
```

### Circular Dependencies: None Detected

The codebase appears free of circular dependencies. Components follow a unidirectional flow from primitives to composed components.

---

## Pattern Analysis

### Pattern 1: Card Base Components (INCONSISTENT)

**Issue:** Two competing card base patterns exist:
1. `GlassCard` (ui/glass) - Modern, typed, minimal
2. `DashboardCard` (dashboard/shared) - Legacy, feature-rich, CSS classes

**Current Usage:**
- Dashboard cards use `DashboardCard` with CSS classes
- Non-dashboard components use `GlassCard` directly
- Both provide similar functionality differently

**Recommendation:** CONSOLIDATE
- Keep `GlassCard` as the canonical base
- Migrate `DashboardCard` features into composition pattern
- Create `CardHeader`, `CardTitle`, `CardActions` as separate components

### Pattern 2: QuestionStep Components (DUPLICATE)

**Issue:** Two completely separate implementations:
- `/components/reflection/QuestionStep.tsx` (desktop, 176 lines, older patterns)
- `/components/reflection/mobile/QuestionStep.tsx` (mobile, 154 lines, modern patterns)

**Key Differences:**
| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Styling | CSS classes (`glass-card`, `cosmic-textarea`) | GlassInput component |
| Character Counter | Separate CharacterCounter component | GlassInput `showCounter` prop |
| Navigation | None | Built-in with GlowButton |
| Props | Different interface | Different interface |

**Recommendation:** CONSOLIDATE
- Create unified `QuestionStep` with responsive behavior
- Use GlassInput for both (already has counter built-in)
- Pass navigation as optional render props

### Pattern 3: DreamCard Components (DUPLICATE)

**Issue:** Two DreamCard components exist:
- `/components/dreams/DreamCard.tsx` - Actually used, feature-rich
- `/components/ui/glass/DreamCard.tsx` - Never imported, orphaned

**Recommendation:** DELETE orphaned glass/DreamCard

### Pattern 4: Navigation Components (FRAGMENTED)

**Current State:**
- `NavigationBase` - Base component (only used by LandingNavigation)
- `AppNavigation` - Main app nav (doesn't use NavigationBase)
- `LandingNavigation` - Landing nav (uses NavigationBase)
- `BottomNavigation` - Mobile bottom nav
- `FloatingNav` - Orphaned, never used

**Issue:** AppNavigation doesn't extend NavigationBase despite similar structure.

**Recommendation:** 
- Either use NavigationBase consistently OR remove it
- Delete FloatingNav (orphaned)

### Pattern 5: Export Style (INCONSISTENT)

**Mixed Patterns Found:**
```typescript
// Named export (preferred for most components)
export function GlassCard(...) { }

// Default export (common in pages)
export default function DashboardPage() { }

// Both (creates confusion)
export function ToneSelectionCard(...) { }
export default ToneSelectionCard;
```

**Recommendation:** Standardize on named exports for components, default exports for pages only.

### Pattern 6: Animation Variants (WELL-ORGANIZED)

**Location:** `/lib/animations/variants.ts`
**Status:** Well-organized, central location, documented
**Usage:** Imported consistently by glass components

**Keep as canonical pattern.**

### Pattern 7: Type Definitions (MIXED)

**Locations:**
- `/types/` - Main types directory (good)
- `/types/glass-components.ts` - Component props (good)
- `/components/reflections/types.ts` - Local types (should consolidate)
- Inline interfaces in components (should extract)

**Recommendation:** Move all shared types to `/types/`, allow local types only for truly component-specific interfaces.

---

## File Organization Assessment

### Current Structure

```
/components/
├── auth/          (1 component - could inline)
├── clarify/       (1 component - could inline)
├── dashboard/
│   ├── cards/     (7 cards - GOOD separation)
│   └── shared/    (6 components - some orphaned)
├── dreams/        (4 components - GOOD)
├── icons/         (2 components - GOOD)
├── landing/       (2 components - GOOD)
├── navigation/    (1 component - sparse)
├── providers/     (1 component - could move to /lib)
├── reflection/    (8 components + mobile subfolder)
│   └── mobile/    (6 components - DUPLICATES desktop)
├── reflections/   (5 components - naming collision with reflection/)
├── shared/        (8 components + illustrations/)
│   └── illustrations/ (4 SVG components)
├── subscription/  (8 components - GOOD)
└── ui/
    ├── glass/     (12 components - GOOD, has index.ts)
    └── mobile/    (2 components - GOOD)
```

### Issues Identified

1. **Naming Collision:** `reflection/` vs `reflections/` is confusing
2. **Sparse Directories:** `auth/`, `clarify/`, `navigation/` have 1 component each
3. **Provider Location:** `providers/TRPCProvider.tsx` could be in `/lib/`
4. **Orphaned Components:** Several components never imported
5. **Desktop/Mobile Split:** Parallel implementations in `/reflection/mobile/`

### Ideal Structure (Proposed)

```
/components/
├── ui/                    # UI primitives
│   ├── glass/            # Glass design system (KEEP as is)
│   ├── mobile/           # Mobile-specific primitives
│   └── icons/            # Move icons here
│
├── layout/               # Layout components
│   ├── AppNavigation.tsx
│   ├── BottomNavigation.tsx
│   ├── LandingNavigation.tsx
│   ├── AuthLayout.tsx
│   └── CosmicBackground.tsx
│
├── features/             # Feature-specific
│   ├── dashboard/        # Dashboard feature
│   │   ├── cards/
│   │   └── DashboardHero.tsx
│   │
│   ├── reflection/       # Unified reflection flow
│   │   ├── ReflectionForm.tsx     # Responsive (desktop/mobile)
│   │   ├── QuestionStep.tsx       # Unified
│   │   ├── ToneSelection.tsx
│   │   └── ProgressIndicator.tsx
│   │
│   ├── reflections/      # Reflection history
│   │   ├── ReflectionCard.tsx
│   │   ├── ReflectionFilters.tsx
│   │   └── AIResponseRenderer.tsx
│   │
│   ├── dreams/           # Dreams feature
│   ├── subscription/     # Subscription feature
│   ├── clarify/          # Clarify feature
│   └── landing/          # Landing page
│
├── shared/               # Truly shared components
│   ├── EmptyState.tsx
│   ├── MarkdownPreview.tsx
│   ├── Toast.tsx
│   ├── DemoBanner.tsx
│   └── illustrations/
│
└── providers/            # Context providers (or move to /lib)
```

---

## Reusability Analysis

### Well-Reused Components

| Component | Import Count | Assessment |
|-----------|--------------|------------|
| `GlassCard` | 20+ | Excellent reuse |
| `GlowButton` | 25+ | Excellent reuse |
| `CosmicLoader` | 15+ | Good reuse |
| `AppNavigation` | 15+ | Good reuse |
| `useAuth` | 20+ | Excellent reuse |

### Components That Should Be Shared (Currently Duplicated)

1. **Relative Time Formatting:**
   - `ReflectionCard.tsx` has `getRelativeTime()`
   - `ReflectionItem.tsx` has `formatTimeAgo()`
   - `/lib/utils.ts` has `timeAgo()`
   
   **Action:** Use `timeAgo()` from lib/utils everywhere

2. **Tone Badge Styling:**
   - `ReflectionCard.tsx` has inline `getToneBadge()`
   - `ToneBadge.tsx` exists as component
   
   **Action:** Use ToneBadge component everywhere

3. **Preview Text Truncation:**
   - Multiple components implement 120-char truncation
   
   **Action:** Add to lib/utils as `truncatePreview(text, length = 120)`

### Over-Abstracted Components

| Component | Issue | Recommendation |
|-----------|-------|----------------|
| `DashboardCard` | Too many props, complex | Simplify or use GlassCard |
| `NavigationBase` | Only 2 uses | Inline or delete |

### Under-Abstracted Patterns

| Pattern | Location | Recommendation |
|---------|----------|----------------|
| Auth redirect logic | Every protected page | Create `useRequireAuth()` hook |
| Email verification check | 5+ pages | Include in auth redirect hook |
| Page loading skeleton | Multiple pages | Create `PageSkeleton` component |

---

## Orphaned Components (Not Imported Anywhere)

| Component | Location | Recommendation |
|-----------|----------|----------------|
| `FloatingNav` | ui/glass/ | DELETE |
| `AnimatedBackground` | ui/glass/ | DELETE or document |
| `DreamCard` | ui/glass/ | DELETE (duplicate) |
| `WelcomeSection` | dashboard/shared/ | DELETE (replaced by DashboardHero) |
| `ProgressIndicator` | reflection/ | DELETE (duplicate) |
| `ToneStep` | reflection/mobile/ | VERIFY usage or DELETE |

---

## Hooks Organization

### Current State

**Root `/hooks/` (7 hooks):**
- `useAuth.ts` - Authentication
- `useDashboard.ts` - Dashboard utilities
- `usePortalState.ts` - Portal management
- `useAnimatedCounter.ts` - Number animation
- `useBreathingEffect.ts` - Breathing animation
- `useReducedMotion.ts` - Motion preferences
- `useStaggerAnimation.ts` - Stagger timing

**`/lib/hooks/` (3 hooks):**
- `useScrollDirection.ts` - Scroll detection
- `useIsMobile.ts` - Viewport detection
- `useKeyboardHeight.ts` - Mobile keyboard

### Issue

Two hook locations without clear separation logic.

### Recommendation

Consolidate all hooks to `/hooks/` with barrel export:
```typescript
// /hooks/index.ts
export { useAuth } from './useAuth';
export { useDashboard } from './useDashboard';
export { useIsMobile } from './useIsMobile';
// ... etc
```

---

## Iteration 1 Recommendations

### Priority 1: Delete Orphaned Components (Quick Win)

1. Delete `/components/ui/glass/FloatingNav.tsx`
2. Delete `/components/ui/glass/AnimatedBackground.tsx`
3. Delete `/components/ui/glass/DreamCard.tsx`
4. Delete `/components/dashboard/shared/WelcomeSection.tsx`
5. Delete `/components/reflection/ProgressIndicator.tsx`
6. Verify and potentially delete `/components/reflection/mobile/ToneStep.tsx`

### Priority 2: Consolidate Hooks

1. Move `/lib/hooks/*` to `/hooks/`
2. Create barrel export `/hooks/index.ts`
3. Update all imports

### Priority 3: Create Missing Abstractions

1. Create `useRequireAuth()` hook for protected pages
2. Create `PageSkeleton` component for loading states
3. Add `truncatePreview()` to lib/utils

### Priority 4: Standardize Exports

1. Remove dual exports (named + default) from components
2. Use named exports for components
3. Use default exports only for pages

### Priority 5: Unify Duplicate Components (Higher Effort)

1. Unify QuestionStep (desktop/mobile)
2. Remove duplicate time formatting utilities
3. Standardize card base usage (GlassCard vs DashboardCard)

---

## Proposed Component Registration

For tracking and documentation:

```typescript
// /components/registry.ts (documentation purposes)
export const COMPONENT_REGISTRY = {
  ui: {
    glass: ['GlassCard', 'GlowButton', 'GlassInput', 'GlassModal', 'GradientText', 'GlowBadge', 'CosmicLoader', 'ProgressOrbs'],
    mobile: ['BottomSheet'],
    other: ['PasswordToggle']
  },
  layout: ['AppNavigation', 'BottomNavigation', 'LandingNavigation', 'AuthLayout', 'CosmicBackground'],
  shared: ['EmptyState', 'MarkdownPreview', 'Toast', 'DemoBanner'],
  features: {
    dashboard: ['DashboardHero', 'DashboardGrid', 'DashboardCard', ...cards],
    reflection: ['MobileReflectionFlow', 'QuestionStep', 'ToneSelectionCard', ...],
    // etc
  }
};
```

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Components | 63 |
| Orphaned Components | 6 |
| Duplicate Patterns | 4 |
| Hook Locations | 2 (should be 1) |
| Missing Abstractions | 3 |
| CSS Files | 7 |

---

## Appendix: File Paths Reference

All absolute paths for key files:

**Core UI:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassCard.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlowButton.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/index.ts`

**Dashboard:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/DashboardCard.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/DreamsCard.tsx`

**Reflection (duplicates):**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/QuestionStep.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/QuestionStep.tsx`

**Orphaned:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/FloatingNav.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/AnimatedBackground.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/DreamCard.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/WelcomeSection.tsx`

**Hooks (split locations):**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/` (7 files)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/hooks/` (3 files)

**Types:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/glass-components.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/index.ts`
