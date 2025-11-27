# Technology Stack - Iteration 9

**Iteration:** 9 (Global)
**Plan:** plan-6
**Phase:** Foundation & Infrastructure
**Last Updated:** 2025-11-27

---

## Overview

Iteration 9 requires **ZERO new dependencies**. All features (navigation fix, spacing system, typography/color audit, enhanced empty states) can be implemented using the existing, well-established technology stack.

**Technology Philosophy:** Hybrid Tailwind CSS + CSS Custom Properties for responsive design tokens, component composition over inheritance, accessibility-first animations.

---

## Core Framework

### Next.js 14 (App Router)

**Decision:** Continue using Next.js 14 with App Router

**Rationale:**
- Already in production use throughout the application
- App Router (RSC) provides server-side rendering for initial page loads
- Client components handle dynamic navigation height measurement
- File-based routing matches project structure
- Built-in CSS import support for variables.css and globals.css
- Zero additional configuration needed for Iteration 9

**Version:** 14.2.0 (stable)

**Alternatives Considered:**
- Remix: Not considered (would require full migration)
- Pages Router: Already migrated to App Router in previous iterations

**Implementation Notes for Iteration 9:**
- Navigation height measurement uses client-side `useEffect` (client component)
- All pages already use App Router convention (`app/*/page.tsx`)
- No routing changes needed

**Environment Variables:** None required for Iteration 9

---

## Styling System

### Tailwind CSS 3.4 + CSS Custom Properties (Hybrid Approach)

**Decision:** Maintain hybrid Tailwind + CSS variables approach

**Rationale:**
- Existing architecture already established (variables.css + tailwind.config.ts)
- CSS custom properties provide responsive design tokens via `clamp()`
- Tailwind utilities provide consistent spacing/typography application
- Best of both worlds: design token flexibility + utility-first productivity
- Iteration 9 extends existing system, doesn't replace it

**Version:** Tailwind CSS 3.4.1

**CSS Architecture:**

```
Layer 1: CSS Custom Properties (variables.css)
  - Design tokens: spacing, typography, colors
  - Responsive via clamp() for fluid scaling
  - Single source of truth for values

Layer 2: Tailwind Utilities (globals.css + tailwind.config.ts)
  - Utility classes map to CSS variables
  - Example: .px-xl → padding-left/right: var(--space-xl)
  - Extended with mirror.* color palette

Layer 3: Component Styles (globals.css)
  - Complex visual effects (.crystal-glass, .gradient-text-cosmic)
  - Design system components (not pure utilities)

Layer 4: Component Overrides (CSS Modules)
  - Component-specific styles when needed
  - Example: dashboard.css, DashboardGrid.module.css
```

**Iteration 9 Changes:**
- Add `--nav-height` CSS variable to Layer 1 (variables.css)
- Document existing spacing/typography/color variables (no value changes)
- Add `.pt-nav` utility class to Layer 2 (globals.css or tailwind.config.ts)

**PostCSS Configuration:**
```javascript
// postcss.config.js (no changes needed)
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Alternatives Considered:**
- Pure Tailwind (no CSS variables): Rejected - loses responsive design token flexibility
- Pure CSS (no Tailwind): Rejected - loses utility-first productivity
- CSS-in-JS (styled-components, emotion): Rejected - unnecessary complexity

---

## Design System

### CSS Custom Properties (variables.css)

**Decision:** Extend existing CSS variable system for navigation height

**Current Variables (Already Established):**

#### Spacing Scale
```css
:root {
  /* Fixed Values (for precise control) */
  --space-px: 1px;
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
  --space-32: 128px;

  /* Responsive (fluid scaling via clamp) */
  --space-xs: clamp(0.5rem, 1vw, 0.75rem);      /* 8-12px */
  --space-sm: clamp(0.75rem, 1.5vw, 1rem);      /* 12-16px */
  --space-md: clamp(1rem, 2.5vw, 1.5rem);       /* 16-24px */
  --space-lg: clamp(1.5rem, 3vw, 2rem);         /* 24-32px */
  --space-xl: clamp(2rem, 4vw, 3rem);           /* 32-48px */
  --space-2xl: clamp(3rem, 6vw, 4rem);          /* 48-64px */
  --space-3xl: clamp(4rem, 8vw, 6rem);          /* 64-96px */
}
```

**Iteration 9 Addition:**
```css
:root {
  /* Navigation (NEW) */
  --nav-height: clamp(60px, 8vh, 80px);  /* Matches AppNavigation actual height */
}
```

**Usage Pattern:**
```css
/* Page layouts */
.page-container {
  padding-top: var(--nav-height);  /* Compensate for fixed nav */
}

/* Or via Tailwind */
<div className="pt-[var(--nav-height)]">
```

#### Typography Scale
```css
:root {
  /* Responsive Typography (clamp for fluid scaling) */
  --text-xs: clamp(0.85rem, 1.8vw, 0.9rem);     /* 14-15px */
  --text-sm: clamp(0.9rem, 2.2vw, 1rem);        /* 14-16px */
  --text-base: clamp(1.05rem, 2.5vw, 1.15rem);  /* 17-18px */
  --text-lg: clamp(1.1rem, 3vw, 1.4rem);        /* 18-22px */
  --text-xl: clamp(1.3rem, 4vw, 1.6rem);        /* 21-26px */
  --text-2xl: clamp(1.6rem, 4vw, 2rem);         /* 26-32px */
  --text-3xl: clamp(1.8rem, 5vw, 2.5rem);       /* 29-40px */
  --text-4xl: clamp(2.2rem, 6vw, 3rem);         /* 35-48px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;    /* For reflection content */
  --leading-loose: 2;
}
```

**Iteration 9 Usage:** Document semantic meaning in patterns.md (no value changes)

#### Color Palette
```css
:root {
  /* Base Colors */
  --cosmic-bg: #020617;  /* Dark background */
  --cosmic-text: #ffffff;
  --cosmic-text-secondary: rgba(255, 255, 255, 0.8);  /* 80% opacity */
  --cosmic-text-muted: rgba(255, 255, 255, 0.6);      /* 60% - may need 70% for WCAG AA */
  --cosmic-text-faded: rgba(255, 255, 255, 0.4);      /* 40% */

  /* Glass Effects */
  --glass-bg-subtle: rgba(255, 255, 255, 0.03);
  --glass-bg-medium: rgba(255, 255, 255, 0.05);
  --glass-bg-strong: rgba(255, 255, 255, 0.08);
  --glass-blur-sm: 8px;
  --glass-blur-md: 16px;
  --glass-blur-lg: 24px;
}
```

**Iteration 9 Audit:** Verify WCAG AA contrast (may need to adjust muted from 60% → 70%)

**Tailwind Color Extensions:**
```typescript
// tailwind.config.ts
colors: {
  mirror: {
    // Semantic color palette
    'void-deep': '#0a0416',
    'dark': '#020617',
    'midnight': '#0f172a',
    'amethyst': '#7c3aed',      // Primary actions
    'gold': '#fbbf24',          // Success states
    'success': '#34d399',       // Positive feedback
    'warning': '#fbbf24',       // Warnings
    'error': '#f87171',         // Errors
    'info': '#818cf8',          // Information
  }
}
```

**Iteration 9 Audit:** Document when to use each semantic color

---

## Animation Library

### Framer Motion 11.18

**Decision:** Continue using Framer Motion for animations

**Rationale:**
- Already installed and used in AppNavigation (mobile menu animation)
- Mature library with excellent TypeScript support
- Built-in reduced motion support (accessibility)
- Declarative API matches React component model
- Iteration 9 doesn't add new animations (foundation work only)

**Version:** 11.18.2 (latest stable)

**Current Usage (No Changes in Iteration 9):**

```typescript
// AppNavigation.tsx - Mobile menu animation
<AnimatePresence>
  {showMobileMenu && (
    <motion.nav
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Mobile nav links */}
    </motion.nav>
  )}
</AnimatePresence>
```

**Established Animation Variants (lib/animations/variants.ts):**
```typescript
// Card entrance (NO SCALE - Iteration 20 refinement)
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  hover: {
    y: -2,  // Subtle lift only
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

// Stagger container (for grids)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};
```

**Accessibility Support:**
```typescript
// lib/animations/hooks.ts
import { useReducedMotion } from 'framer-motion';

export function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion();
  return {
    shouldAnimate: !prefersReducedMotion,
    variants: prefersReducedMotion ? {} : undefined,
  };
}
```

**Iteration 9 Usage:** No new animations added (EmptyState uses existing GlassCard/GlowButton)

---

## Component Library

### Custom Glass Design System

**Decision:** Use existing component library (no new components in Iteration 9)

**Rationale:**
- Well-built component system already established
- GlassCard, GlowButton, GradientText provide consistent UI
- EmptyState component exists, just needs enhancement
- No UI components need to be built from scratch

**Core Components (Already Established):**

#### GlassCard
```typescript
// components/ui/glass/GlassCard.tsx
export function GlassCard({
  elevated = false,
  interactive = false,
  onClick,
  className,
  children,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-crystal',
        'bg-gradient-to-br from-white/8 via-transparent to-purple-500/3',
        'border border-white/10 rounded-xl p-6',
        elevated && 'shadow-lg border-white/15',
        interactive && [
          'cursor-pointer transition-all duration-250',
          'hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)]',
        ],
        className
      )}
    >
      {children}
    </div>
  );
}
```

#### GlowButton
```typescript
// components/ui/glass/GlowButton.tsx
export function GlowButton({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all',
        variant === 'primary' && [
          'bg-gradient-to-r from-purple-600 to-purple-500',
          'hover:from-purple-500 hover:to-purple-400',
          'shadow-[0_0_20px_rgba(124,58,237,0.3)]',
        ],
        size === 'md' && 'px-6 py-3 text-base',
        size === 'lg' && 'px-8 py-4 text-lg',
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### EmptyState (Target for Enhancement)
```typescript
// components/shared/EmptyState.tsx - CURRENT VERSION
export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaAction
}: EmptyStateProps) {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <GlassCard elevated className="text-center max-w-md">
        <div className="text-6xl mb-md">{icon}</div>
        <GradientText gradient="cosmic" className="text-h2 mb-md">
          {title}
        </GradientText>
        <p className="text-body text-white/60 mb-lg">
          {description}
        </p>
        {ctaLabel && ctaAction && (
          <GlowButton variant="primary" size="lg" onClick={ctaAction}>
            {ctaLabel}
          </GlowButton>
        )}
      </GlassCard>
    </div>
  );
}
```

**Iteration 9 Enhancement:**
```typescript
// Add optional props (backwards compatible)
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  // NEW (all optional)
  illustration?: React.ReactNode;  // For custom SVG/image
  progress?: {
    current: number;
    total: number;
    label: string;  // e.g., "reflections"
  };
  variant?: 'default' | 'compact';
}
```

**Why Not Build New Components:**
- Existing components cover all Iteration 9 needs
- Focus is on systematic application, not new UI patterns
- Builder-3 enhances EmptyState (adds props, not rebuild)

---

## Utilities & Helpers

### Class Name Composition

**clsx + tailwind-merge (cn utility)**

**Decision:** Continue using `cn()` helper for conditional classes

**Version:** clsx 2.1.0, tailwind-merge 2.2.1

**Implementation:**
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:**
```typescript
// Conditional styling with Tailwind class merging
<div className={cn(
  'px-xl py-2xl',  // Base spacing
  elevated && 'shadow-lg',  // Conditional elevation
  className  // User-provided overrides
)}>
```

**Why Important for Iteration 9:**
- Navigation padding classes need conditional logic
- EmptyState variants use conditional styling
- Prevents Tailwind class conflicts (e.g., `px-4 px-xl` → resolves to `px-xl`)

---

## Type Safety

### TypeScript 5.9

**Decision:** Maintain strict TypeScript configuration

**Version:** 5.9.3

**Configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Iteration 9 Type Definitions:**

```typescript
// types/design-system.ts (NEW for documentation)
export type SpacingScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type TypographyScale = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type SemanticColor = 'success' | 'warning' | 'error' | 'info' | 'amethyst' | 'gold';

// types/glass-components.ts (EXTEND for EmptyState)
export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  illustration?: React.ReactNode;
  progress?: {
    current: number;
    total: number;
    label: string;
  };
  variant?: 'default' | 'compact';
}
```

---

## Icons

### Lucide React

**Decision:** Continue using Lucide React for icons

**Version:** 0.546.0

**Current Usage:**
- Menu icon (hamburger menu)
- X icon (close menu)
- Navigation icons (if any)

**Iteration 9 Usage:**
- No new icons needed
- EmptyState uses emoji (✨, 🌟) for visual interest

**Rationale:**
- Lightweight icon library
- Tree-shakeable (only imports used icons)
- Consistent with existing codebase

---

## Development Tools

### Build Tools

**No Changes in Iteration 9:**

| Tool | Version | Purpose |
|------|---------|---------|
| PostCSS | 8.4.33 | CSS processing |
| Autoprefixer | 10.4.17 | Vendor prefix generation |
| Tailwind CLI | 3.4.1 | Utility class generation |

### Testing Tools

**Manual Testing Only (No Automation in Iteration 9):**

| Tool | Purpose |
|------|---------|
| Chrome DevTools | Responsive design testing (5 breakpoints) |
| Lighthouse | Accessibility audit (WCAG AA contrast) |
| Real Devices | Mobile testing (iPhone SE, iPad, Android) |

**Future Testing (Post-Iteration 9):**
- Playwright for E2E testing
- Chromatic for visual regression
- Jest + React Testing Library for component tests

---

## Performance Budget

### Bundle Size

**Current State:** No new dependencies in Iteration 9

**Impact:** Zero bundle size increase

**Why:**
- All features use existing libraries (Next.js, Tailwind, Framer Motion)
- Navigation fix is CSS-only (+ minimal JavaScript for height measurement)
- Design system documentation is zero-runtime (comments/docs only)
- EmptyState enhancement adds ~50 lines of code (negligible)

**Monitoring:** Use `next build` to verify bundle size unchanged

### Lighthouse Targets

**Maintained from Previous Iterations:**

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| LCP (Largest Contentful Paint) | < 2.5s | ~1.8s | Maintained |
| FID (First Input Delay) | < 100ms | ~40ms | Maintained |
| CLS (Cumulative Layout Shift) | < 0.1 | ~0.05 | Maintained |
| Accessibility Score | 100% | ~95% | May improve with contrast fixes |

**Iteration 9 Impact:**
- Navigation fix may slightly improve CLS (no content jump when scrolling)
- WCAG AA contrast improvements will increase accessibility score
- No performance degradation expected

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

**Decision:** Maintain WCAG AA compliance, improve where needed

**Current Compliance:** ~95% (some contrast issues)

**Iteration 9 Improvements:**

#### Contrast Ratios
```css
/* BEFORE (potential WCAG failures) */
--cosmic-text-muted: rgba(255, 255, 255, 0.6);  /* 60% - may fail */

/* AFTER (if audit reveals failure) */
--cosmic-text-muted: rgba(255, 255, 255, 0.7);  /* 70% - meets WCAG AA */
```

**Targets:**
- Normal text (18px): 4.5:1 contrast ratio
- Large text (24px+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

#### Keyboard Navigation
- All interactive elements focusable via Tab
- Focus indicators visible (--focus-ring CSS variable)
- Skip navigation link (if navigation adds significant tab stops)

#### Reduced Motion
```css
/* variables.css - Already implemented */
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: none;
    --transition-smooth: none;
    --duration-300: 1ms;
  }
}
```

**Iteration 9 Compliance:**
- Run Lighthouse accessibility audit on all pages
- Fix any contrast failures (bump opacity if needed)
- Verify keyboard navigation works after nav fix
- Document accessibility patterns in patterns.md

---

## Environment Configuration

### Environment Variables

**None Required for Iteration 9**

**Why:**
- Navigation fix is purely CSS/JavaScript (no external APIs)
- Design system is CSS variables (no secrets)
- EmptyState enhancement is UI-only (no backend changes)

**Existing Environment Variables (Unchanged):**
- Database connection (Supabase)
- Authentication (Clerk)
- OpenAI API (for reflections)

---

## Browser Support

### Target Browsers

**Decision:** Modern browsers only (no IE11 support)

**Supported:**
- Chrome 90+ (latest 2 versions)
- Firefox 88+ (latest 2 versions)
- Safari 14+ (latest 2 versions)
- Edge 90+ (latest 2 versions)

**Why No IE11:**
- CSS custom properties not supported in IE11
- App already uses CSS variables extensively (variables.css)
- IE11 market share < 1% globally

**Mobile Browsers:**
- iOS Safari 14+ (iPhone, iPad)
- Chrome Mobile 90+ (Android)

**Iteration 9 Testing:**
- Test navigation fix in all supported browsers
- Verify mobile menu works on iOS Safari + Chrome Mobile
- Check responsive breakpoints in Firefox (sometimes different from Chrome)

---

## Summary: Technology Decisions for Iteration 9

### Use Existing Stack (No New Dependencies)

| Technology | Version | Usage | Changes in Iteration 9 |
|------------|---------|-------|------------------------|
| Next.js | 14.2.0 | Framework | None (client useEffect for nav height) |
| React | 18.3.1 | UI Library | None |
| TypeScript | 5.9.3 | Type Safety | Add EmptyStateProps extensions |
| Tailwind CSS | 3.4.1 | Styling | Add .pt-nav utility class |
| CSS Variables | N/A | Design Tokens | Add --nav-height variable |
| Framer Motion | 11.18.2 | Animations | None (existing mobile menu animation) |
| clsx + twMerge | 2.1.0 + 2.2.1 | Class Utilities | None (existing cn() helper) |
| Lucide React | 0.546.0 | Icons | None (use emoji for EmptyState) |

### Zero Bundle Size Impact

All Iteration 9 features use existing infrastructure:
- Navigation fix: CSS variable + 10 lines JavaScript
- Spacing/typography/color: Documentation only (zero runtime)
- EmptyState enhancement: ~50 lines code (negligible)

### Performance Maintained

- LCP: < 2.5s (maintained)
- FID: < 100ms (maintained)
- CLS: < 0.1 (may improve with nav fix)
- Accessibility: 100% (improved with contrast fixes)

### Accessibility First

- WCAG AA contrast maintained/improved
- Keyboard navigation verified
- Reduced motion support maintained
- Screen reader compatibility (semantic HTML)

---

## Next Steps

1. **Builder-1:** Implement `--nav-height` CSS variable + JavaScript measurement
2. **Builder-2:** Document existing spacing/typography/color system (no value changes)
3. **Builder-3:** Enhance EmptyState component with optional props
4. **Integration:** Test all browsers at all breakpoints
5. **Validation:** Run Lighthouse, verify WCAG AA compliance

---

**Tech Stack Status:** ESTABLISHED
**New Dependencies:** ZERO
**Risk Level:** LOW (using proven, existing stack)
**Performance Impact:** ZERO (CSS + minimal JavaScript)
