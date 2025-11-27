# Explorer 2 Report: Technology Patterns & Dependencies

## Executive Summary

Mirror of Dreams uses a **highly-structured, design-system-driven architecture** with Tailwind CSS, CSS custom properties, and framer-motion. The codebase follows **strict patterns** for component composition, responsive design, and animation. All Iteration 1 features can be implemented using **existing infrastructure** with zero new dependencies.

**Key Finding:** The navigation overlap issue exists because pages use `pt-nav` (80px) from Tailwind config, but AppNavigation is `fixed` with `z-[100]`. The fix requires CSS variable `--nav-height` + systematic application across all pages.

**Technology Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS 3.4, Framer Motion 11.18, react-markdown 10.1, tRPC 11.6

**Risk Level:** LOW - All patterns established, no new dependencies, systematic CSS work.

---

## Discoveries

### 1. CSS Methodology: Hybrid Tailwind + CSS Custom Properties

**Current Approach:**
- **Tailwind CSS 3.4** as primary styling framework
- **CSS Custom Properties** (variables.css) for design tokens
- **Utility-first** with semantic color system
- **CSS Modules** for component-specific styles (DashboardGrid, ReflectionItem, WelcomeSection)
- **Global CSS** (globals.css) for design system components (crystal-glass, amethyst-glow)

**Design System Structure:**

```css
/* variables.css - Design Tokens */
:root {
  /* Spacing Scale (Responsive via clamp) */
  --space-xs: clamp(0.5rem, 1vw, 0.75rem);      /* 8-12px */
  --space-sm: clamp(0.75rem, 1.5vw, 1rem);      /* 12-16px */
  --space-md: clamp(1rem, 2.5vw, 1.5rem);       /* 16-24px */
  --space-lg: clamp(1.5rem, 3vw, 2rem);         /* 24-32px */
  --space-xl: clamp(2rem, 4vw, 3rem);           /* 32-48px */
  --space-2xl: clamp(3rem, 6vw, 4rem);          /* 48-64px */
  --space-3xl: clamp(4rem, 8vw, 6rem);          /* 64-96px */

  /* Typography (Responsive via clamp) */
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
  --leading-relaxed: 1.75;
  --leading-loose: 2;

  /* Colors - Mirror Palette */
  --cosmic-bg: #020617;
  --cosmic-text: #ffffff;
  --cosmic-text-secondary: rgba(255, 255, 255, 0.8);
  --cosmic-text-muted: rgba(255, 255, 255, 0.6);
  --cosmic-text-faded: rgba(255, 255, 255, 0.4);

  /* Glass System */
  --glass-blur-sm: 8px;
  --glass-blur-md: 16px;
  --glass-blur-lg: 24px;
  --glass-bg-subtle: rgba(255, 255, 255, 0.03);
  --glass-bg-medium: rgba(255, 255, 255, 0.05);
  --glass-bg-strong: rgba(255, 255, 255, 0.08);

  /* Transitions */
  --mirror-transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --mirror-transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --mirror-transition-slow: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Tailwind Config Extensions:**

```typescript
// tailwind.config.ts
spacing: {
  'nav': '80px',  // Navigation bar height
  'xs': 'var(--space-xs)',
  'sm': 'var(--space-sm)',
  'md': 'var(--space-md)',
  'lg': 'var(--space-lg)',
  'xl': 'var(--space-xl)',
  '2xl': 'var(--space-2xl)',
  '3xl': 'var(--space-3xl)',
}

colors: {
  mirror: {
    // Semantic colors mapped to Tailwind
    'void-deep': '#0a0416',
    'amethyst': '#7c3aed',
    'gold-ambient': 'rgba(251, 191, 36, 0.05)',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#818cf8',
  }
}
```

**Global Component Styles (globals.css):**

```css
/* Design System Components */
.crystal-glass {
  backdrop-filter: blur(40px) saturate(150%);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 40%),
    rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.amethyst-breathing {
  box-shadow:
    inset 0 0 40px rgba(124, 58, 237, 0.4),
    0 0 60px rgba(124, 58, 237, 0.35);
}

.gradient-text-cosmic {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Pattern Identified:**
- **Utility-first** for layout (Tailwind)
- **CSS Variables** for responsive design tokens
- **Global classes** for complex visual effects (glass, gradients, glows)
- **CSS Modules** for component-specific overrides

---

### 2. Component Composition Patterns

**Glass Design System:**

All UI components follow a **strict composition pattern**:

```typescript
// components/ui/glass/index.ts - Barrel Export
export { GlassCard } from './GlassCard';
export { GlowButton } from './GlowButton';
export { GradientText } from './GradientText';
export { CosmicLoader } from './CosmicLoader';
export { EmptyState } from '@/components/shared/EmptyState';
```

**GlassCard Pattern (Base Component):**

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

**EmptyState Pattern (Iteration 1 Target):**

```typescript
// components/shared/EmptyState.tsx
export function EmptyState({ icon, title, description, ctaLabel, ctaAction }: EmptyStateProps) {
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
          <GlowButton variant="primary" size="lg" onClick={ctaAction} className="w-full">
            {ctaLabel}
          </GlowButton>
        )}
      </GlassCard>
    </div>
  );
}
```

**Key Pattern:**
- **Composition over inheritance**
- **Props-based variants** (elevated, interactive, variant, size)
- **Tailwind + cn()** for conditional styling
- **Accessibility built-in** (tabIndex, role, keyboard handlers)

---

### 3. Responsive Design Patterns

**Mobile-First Breakpoints:**

```css
/* variables.css */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Laptop */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Large desktop */
```

**Usage Pattern (from AppNavigation.tsx):**

```typescript
{/* Desktop nav links */}
<div className="hidden lg:flex gap-2">
  <Link href="/dashboard" className="dashboard-nav-link">
    Journey
  </Link>
</div>

{/* Mobile menu button */}
<button className="lg:hidden p-2 rounded-lg">
  <Menu className="w-5 h-5" />
</button>
```

**Responsive Spacing (via clamp):**

```css
/* All spacing scales automatically with viewport */
--space-xl: clamp(2rem, 4vw, 3rem);  /* 32px → 48px */

/* Applied via Tailwind */
<div className="px-xl py-2xl">  /* Responsive padding */
```

**Current Page Layout Pattern:**

```typescript
// All pages use this pattern (dreams, evolution, visualizations)
<div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-8">
  {/* Content */}
</div>
```

**Issue Identified:**
- `pt-nav` = 80px from Tailwind config
- But `--nav-height` CSS variable **does not exist**
- AppNavigation is `fixed top-0` with `z-[100]`
- **Result:** Content starts at correct padding BUT navigation obscures 80px of content when scrolling

---

### 4. Animation & Interaction Patterns

**Framer Motion Usage:**

```typescript
// lib/animations/variants.ts - Established Patterns

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

**Accessibility: Reduced Motion Support:**

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

```css
/* variables.css - Automatically disables animations */
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: none;
    --transition-smooth: none;
    --duration-300: 1ms;
  }
}
```

**Pattern Identified:**
- **NO scale effects** on cards (Iteration 20 refinement)
- **Subtle y-translation** on hover (-2px)
- **Stagger animations** for lists (0.1s delay)
- **Accessibility-first** (reduced motion support)
- **Duration standards:** 200-300ms for UI, 500ms+ for decorative

---

### 5. Navigation Architecture

**AppNavigation Component:**

```typescript
// components/shared/AppNavigation.tsx
<GlassCard
  elevated
  className="fixed top-0 left-0 right-0 z-[100] rounded-none border-b border-white/10"
>
  <div className="container mx-auto px-6 py-4">
    {/* Logo, nav links, user menu */}
  </div>

  {/* Mobile menu */}
  <AnimatePresence>
    {showMobileMenu && (
      <motion.nav
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="lg:hidden mt-4 pt-4 border-t border-white/10"
      >
        {/* Mobile nav links */}
      </motion.nav>
    )}
  </AnimatePresence>
</GlassCard>
```

**Current Issue:**
- Navigation is `fixed top-0 z-[100]`
- Pages use `pt-nav` (80px) for padding
- BUT: When mobile menu opens (`height: auto`), total nav height exceeds 80px
- **Mobile overlap:** Hamburger menu content can obscure page content

**Fix Required:**
1. Create `--nav-height` CSS variable
2. Measure actual nav height (desktop: ~70px, mobile closed: ~70px, mobile open: variable)
3. Update all pages to use `padding-top: var(--nav-height)`
4. Document pattern in patterns.md

---

## Patterns Identified

### Pattern 1: CSS Variable-Based Spacing System

**Description:** All spacing uses CSS custom properties with `clamp()` for responsive scaling

**Use Case:** Any layout spacing (padding, margin, gap)

**Example:**

```typescript
// CORRECT (Iteration 1 approach)
<div className="px-xl py-2xl gap-lg">
  {/* xl = 32-48px, 2xl = 48-64px, lg = 24-32px */}
</div>

// INCORRECT (arbitrary values)
<div className="px-8 py-12 gap-6">
  {/* Not responsive, breaks design system */}
</div>
```

**Recommendation:** **MUST use** for all Iteration 1 spacing work. Document new spacing patterns in patterns.md.

---

### Pattern 2: Typography Utility Classes

**Description:** Predefined text classes map to responsive CSS variables

**Use Case:** All text rendering (headings, body, small)

**Example:**

```typescript
// globals.css - Utility classes
.text-h1 {
  font-size: var(--text-4xl);       /* 35-48px */
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

.text-body {
  font-size: var(--text-base);      /* 17-18px */
  line-height: var(--leading-relaxed);
}

// Usage
<h1 className="text-h1 gradient-text-cosmic">
  Mirror of Dreams
</h1>

<p className="text-body text-white/60">
  Your reflection journey begins here
</p>
```

**Recommendation:** **MUST audit** all pages for typography consistency in Iteration 1.

---

### Pattern 3: Semantic Color System

**Description:** Colors map to semantic meaning via Tailwind classes

**Use Case:** Any color application (text, backgrounds, borders)

**Example:**

```typescript
// CORRECT (semantic)
<div className="text-mirror-success border-mirror-success/50 bg-mirror-success/10">
  Reflection created successfully
</div>

// INCORRECT (arbitrary)
<div className="text-green-400 border-green-500/50 bg-green-500/10">
  {/* Not part of mirror.* palette */}
</div>
```

**Semantic Palette:**

```typescript
// tailwind.config.ts
colors: {
  mirror: {
    success: '#34d399',  // Green - success states
    warning: '#fbbf24',  // Gold - warnings
    error: '#f87171',    // Red - errors
    info: '#818cf8',     // Blue - information
    amethyst: '#7c3aed', // Purple - primary actions
  }
}
```

**Recommendation:** **MUST audit** all color usage in Iteration 1 to ensure semantic consistency.

---

### Pattern 4: EmptyState Component Composition

**Description:** Standardized empty state across all pages

**Use Case:** No dreams, no reflections, no evolution reports

**Example:**

```typescript
import { EmptyState } from '@/components/shared/EmptyState';
import { useRouter } from 'next/navigation';

export default function DreamsPage() {
  const router = useRouter();

  if (dreams.length === 0) {
    return (
      <EmptyState
        icon="✨"
        title="Dreams are the seeds of transformation"
        description="Create your first dream to begin your journey of self-reflection"
        ctaLabel="Create your first dream"
        ctaAction={() => router.push('/dreams/create')}
      />
    );
  }

  // ... rest of page
}
```

**Current Usage (from grep):**
- `/app/visualizations/page.tsx`
- `/app/evolution/page.tsx`
- `/app/dreams/page.tsx`
- `/components/dashboard/cards/ReflectionsCard.tsx`
- `/components/dashboard/cards/DreamsCard.tsx`

**Recommendation:** **ENHANCE** EmptyState component with:
- Optional illustration prop (for SVG/image)
- Variant prop for different visual styles
- Better spacing (currently uses mb-md, mb-lg)

---

### Pattern 5: Framer Motion Stagger Animations

**Description:** Grid/list items animate in with stagger effect

**Use Case:** Dashboard cards, reflection lists, dream grids

**Example:**

```typescript
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

export function DashboardGrid({ children }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-lg"
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Recommendation:** Use for dashboard and reflection list animations in Iteration 2.

---

## Complexity Assessment

### High Complexity Areas

**1. Navigation Overlap Fix (Feature 1)**
- **Complexity:** HIGH - Affects ALL pages + mobile menu
- **Reason:** Requires CSS variable implementation + testing across 8+ pages at 5 breakpoints
- **Estimated splits:** None (single builder can handle)
- **Hours:** 4-6 hours
- **Risk:** Mobile menu height calculation, z-index conflicts

**2. Design System Audit (Features 2, 3, 4)**
- **Complexity:** MEDIUM - Systematic but tedious
- **Reason:** Must audit every page for spacing, typography, color consistency
- **Estimated splits:** None (systematic work)
- **Hours:** 6-8 hours
- **Risk:** Breaking existing styles, inconsistent application

---

### Medium Complexity Areas

**3. Enhanced Empty States (Feature 5)**
- **Complexity:** MEDIUM - Component enhancement + deployment
- **Reason:** Update EmptyState component + apply to 5+ pages
- **Estimated splits:** None
- **Hours:** 4-5 hours
- **Risk:** Breaking existing empty state usage

---

### Low Complexity Areas

None in Iteration 1 - all features require systematic application across multiple pages.

---

## Technology Recommendations

### Primary Stack (Already Established)

**Framework:** Next.js 14 (App Router)
- **Rationale:** Already in use, server components for data fetching
- **Version:** 14.2.0 (stable)
- **No changes needed**

**Styling:** Tailwind CSS 3.4 + CSS Custom Properties
- **Rationale:** Hybrid approach allows design tokens + utility-first
- **Version:** 3.4.1 (latest)
- **No changes needed**

**Animations:** Framer Motion 11.18
- **Rationale:** Mature animation library, reduced motion support
- **Version:** 11.18.2 (latest)
- **No changes needed**

**Markdown:** react-markdown 10.1 (for Iteration 2)
- **Rationale:** Already installed for reflection AI response rendering
- **Version:** 10.1.0 (latest)
- **No changes needed**

---

### Supporting Libraries

**Utility Functions:**
- `clsx` 2.1.0 - Conditional className composition
- `tailwind-merge` 2.2.1 - Merge Tailwind classes without conflicts
- `cn()` helper in `lib/utils.ts` - Combines clsx + tailwind-merge

**Icons:**
- `lucide-react` 0.546.0 - Icon library
- Currently used: Menu, X (hamburger menu)
- **Recommendation:** Use for any new icons (consistent with existing)

**Type Safety:**
- TypeScript 5.9.3
- Strict mode enabled
- Props interfaces in `@/types/glass-components`

---

### Build-Time Processing

**PostCSS Configuration:**

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Findings:**
- **No custom PostCSS plugins** - only Tailwind + Autoprefixer
- **No CSS preprocessing** - pure CSS with @layer directives
- **No linting** for CSS (ESLint only for TypeScript)

**Recommendation:** No changes needed for Iteration 1.

---

## Integration Points

### External Integrations

**None for Iteration 1** - purely UI/UX polish, no external APIs

### Internal Integrations

**1. Navigation → All Pages**
- **Connection:** AppNavigation component imported on every page
- **Dependency:** All pages must update padding when `--nav-height` changes
- **Risk:** If nav height variable is wrong, content will be obscured
- **Mitigation:** Test on ALL pages (dashboard, dreams, reflections, evolution, visualizations) at all breakpoints

**2. Design System → All Components**
- **Connection:** All components consume CSS variables from variables.css
- **Dependency:** Spacing, typography, color changes affect entire app
- **Risk:** Breaking existing styles if variables change
- **Mitigation:** Audit all variable usage before making changes

**3. EmptyState → Multiple Pages**
- **Connection:** EmptyState component used on 5+ pages
- **Dependency:** Component changes affect all pages simultaneously
- **Risk:** Breaking empty state display on any page
- **Mitigation:** Test all empty state locations after component updates

**4. Glass Components → Dashboard & Pages**
- **Connection:** GlassCard, GlowButton, GradientText used everywhere
- **Dependency:** Component API changes require updates across codebase
- **Risk:** LOW - no component changes planned in Iteration 1
- **Mitigation:** N/A

---

## Risks & Challenges

### Technical Risks

**Risk 1: Navigation Height Calculation on Mobile**
- **Impact:** HIGH - Could obscure content on mobile devices
- **Probability:** 60%
- **Root Cause:** Mobile menu height is dynamic (varies with number of nav items)
- **Mitigation Strategy:**
  1. Use JavaScript to measure nav height on mount + resize
  2. Set CSS variable dynamically via `document.documentElement.style.setProperty()`
  3. Fallback to static value (80px) if JS measurement fails
  4. Test on real devices (iPhone SE, iPad, Android)

**Risk 2: CSS Variable Browser Support**
- **Impact:** MEDIUM - Older browsers may not support CSS variables
- **Probability:** 10%
- **Root Cause:** CSS custom properties not supported in IE11
- **Mitigation Strategy:**
  - App already uses CSS variables extensively (variables.css)
  - If browser support is a concern, use PostCSS plugin to generate fallbacks
  - **Recommendation:** Ignore IE11 (not listed in supported browsers)

**Risk 3: Breaking Existing Spacing**
- **Impact:** MEDIUM - Could disrupt existing page layouts
- **Probability:** 40%
- **Root Cause:** Changing spacing scale values affects all components
- **Mitigation Strategy:**
  - DO NOT change existing CSS variable values
  - ADD new spacing patterns only
  - Test all pages visually after changes
  - Use git diff to verify only intended changes

**Risk 4: Typography Hierarchy Inconsistencies**
- **Impact:** LOW - Visual inconsistency, not functional breakage
- **Probability:** 50%
- **Root Cause:** Some components use arbitrary text sizes instead of utility classes
- **Mitigation Strategy:**
  - Audit all headings/text via grep: `className.*text-`
  - Create checklist of pages to update
  - Use Lighthouse/axe DevTools to verify heading hierarchy

---

### Complexity Risks

**Risk 5: Scope Creep During Design System Audit**
- **Impact:** HIGH - Could delay Iteration 1 completion
- **Probability:** 70%
- **Root Cause:** Easy to "improve" things beyond Iteration 1 scope
- **Mitigation Strategy:**
  - **Strict scope adherence:** Only spacing, typography, color audit
  - **Document improvements** for future iterations
  - **No component refactoring** unless absolutely necessary
  - **Time-box audit work:** 2 hours per feature area max

**Risk 6: Mobile Testing Overhead**
- **Impact:** MEDIUM - Could add 30-50% to timeline
- **Probability:** 60%
- **Root Cause:** Must test navigation fix on real mobile devices
- **Mitigation Strategy:**
  - Use Chrome DevTools device emulation for initial testing
  - Test on 3 real devices: iPhone (Safari), Android (Chrome), iPad
  - Create testing checklist with specific scenarios
  - Allocate 2-3 hours for mobile testing

---

## Recommendations for Planner

### 1. Navigation Fix: Use JavaScript for Dynamic Height Calculation

**Rationale:**
- Mobile menu height is dynamic (varies with # of nav items, admin/non-admin users)
- Static CSS variable will fail when menu opens
- JavaScript measurement ensures accuracy across all screen sizes

**Implementation:**

```typescript
// components/shared/AppNavigation.tsx
useEffect(() => {
  const nav = document.querySelector('[data-nav-container]');
  if (nav) {
    const height = nav.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--nav-height', `${height}px`);
  }
}, [showMobileMenu]); // Re-measure when menu opens/closes
```

**Alternative:** Use CSS `calc()` with fixed offsets, but less reliable.

---

### 2. Spacing System: DO NOT Change Existing Variables

**Rationale:**
- variables.css already defines responsive spacing scale
- Changing values would break existing layouts across entire app
- Iteration 1 scope is **application**, not **redefinition**

**Recommendation:**
- Use existing spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
- Document spacing patterns in patterns.md
- If new spacing needed, ADD new variables (e.g., --space-4xl)

---

### 3. Typography Audit: Create Page-by-Page Checklist

**Rationale:**
- Typography audit is systematic, tedious work
- Easy to miss pages or components
- Checklist ensures nothing is overlooked

**Checklist Template:**

```markdown
## Typography Audit Checklist

### Pages
- [ ] Dashboard (/app/dashboard/page.tsx)
- [ ] Dreams (/app/dreams/page.tsx)
- [ ] Reflections (/app/reflections/page.tsx)
- [ ] Evolution (/app/evolution/page.tsx)
- [ ] Visualizations (/app/visualizations/page.tsx)

### Criteria per Page
- [ ] All h1 use .text-h1 (or equivalent)
- [ ] All h2 use .text-h2 (or equivalent)
- [ ] All body text uses .text-body (or --text-base)
- [ ] Line heights appropriate (1.8 for reflection content)
- [ ] Reading widths optimal (max-w-[720px] for reflection content)
```

---

### 4. EmptyState Enhancement: Prioritize Visual Consistency

**Rationale:**
- Current EmptyState is functional but not visually polished
- Iteration 1 focuses on consistency across all empty states
- Enhancements should be minimal, focused on spacing + copy

**Recommended Props to Add:**

```typescript
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  // NEW PROPS
  illustration?: React.ReactNode;  // Optional SVG/image
  variant?: 'default' | 'compact';  // Size variants
  className?: string;  // Custom styling
}
```

**Do NOT add:**
- Multiple CTAs (keep single action focus)
- Complex animations (Iteration 1 is foundational)
- Custom layouts (maintain consistency)

---

### 5. Color Audit: Use Automated Tools First

**Rationale:**
- Manual color audit is error-prone
- Automated tools (grep, eslint) can catch most issues
- Human review only for edge cases

**Audit Process:**

```bash
# Find all color usages
grep -r "text-green" app/ components/  # Non-semantic colors
grep -r "bg-blue" app/ components/     # Non-semantic backgrounds
grep -r "border-red" app/ components/  # Non-semantic borders

# Find semantic color usages
grep -r "text-mirror-" app/ components/  # Correct pattern
```

**Expected Findings:**
- Some components use arbitrary Tailwind colors (text-green-400, bg-blue-500)
- Should migrate to mirror.* palette (text-mirror-success, bg-mirror-info)

---

### 6. Testing Strategy: Prioritize Navigation + Mobile

**Rationale:**
- Navigation fix is highest risk (affects all pages)
- Mobile experience is critical but often overlooked
- Other features (spacing, typography) are lower risk

**Testing Priorities:**

```markdown
## Testing Priority (High → Low)

1. **Navigation Fix (CRITICAL)**
   - Test ALL pages at 5 breakpoints (320px, 768px, 1024px, 1440px, 1920px)
   - Verify no content obscured by nav
   - Verify mobile menu doesn't overlap content when open
   - Test on real devices: iPhone, Android, iPad

2. **Spacing Consistency (HIGH)**
   - Verify all pages use spacing scale (no arbitrary px values)
   - Check responsive behavior (spacing scales down on mobile)

3. **Typography Consistency (MEDIUM)**
   - Verify heading hierarchy (h1 → h2 → h3)
   - Check line heights (1.8 for reflection content)
   - Verify reading widths (720px max for reflection text)

4. **Color Consistency (MEDIUM)**
   - Verify all colors from mirror.* palette
   - Check contrast ratios (WCAG AA)

5. **EmptyState Visual Polish (LOW)**
   - Verify consistent spacing across all empty states
   - Check copy consistency
```

---

### 7. Documentation: Patterns.md is Critical

**Rationale:**
- Iteration 1 establishes foundational patterns
- Future builders need clear guidance
- Lack of documentation leads to inconsistency

**Required Documentation:**

```markdown
## patterns.md Updates

1. **Navigation Height Pattern**
   - How to use --nav-height variable
   - When to remeasure (on resize, mobile menu toggle)
   - Fallback values for SSR

2. **Spacing Scale Application**
   - When to use each spacing value (xs, sm, md, lg, xl, 2xl, 3xl)
   - Examples of correct usage
   - Mobile responsive behavior

3. **Typography Utilities**
   - How to use .text-h1, .text-h2, .text-body
   - Line height guidelines
   - Reading width guidelines (720px max for reflection content)

4. **Semantic Color System**
   - mirror.* palette reference
   - When to use each semantic color
   - Contrast ratio requirements (WCAG AA)

5. **EmptyState Component**
   - When to use EmptyState
   - Prop examples for common scenarios
   - Copy tone guidelines
```

---

## Resource Map

### Critical Files/Directories

**Design System Foundation:**
- `/styles/variables.css` - CSS custom properties (spacing, typography, colors)
- `/styles/globals.css` - Design system components (crystal-glass, amethyst-glow, gradient-text)
- `/tailwind.config.ts` - Tailwind extensions (spacing, colors, animations)
- `/postcss.config.js` - Build configuration (Tailwind + Autoprefixer)

**Components:**
- `/components/ui/glass/` - Base UI components (GlassCard, GlowButton, GradientText)
- `/components/shared/EmptyState.tsx` - Empty state component (Iteration 1 target)
- `/components/shared/AppNavigation.tsx` - Navigation component (Iteration 1 fix target)

**Animation System:**
- `/lib/animations/variants.ts` - Framer Motion animation variants
- `/lib/animations/hooks.ts` - Animation utility hooks (useAnimationConfig)

**Pages (Navigation Fix Targets):**
- `/app/dashboard/page.tsx`
- `/app/dreams/page.tsx`
- `/app/reflections/page.tsx`
- `/app/evolution/page.tsx`
- `/app/visualizations/page.tsx`
- `/app/reflection/page.tsx` (Iteration 2 target)

**Documentation:**
- `/.2L/plan-3/iteration-20/plan/patterns.md` - Existing patterns reference
- `/.2L/plan-3/iteration-20/plan/tech-stack.md` - Existing tech stack reference

---

### Key Dependencies

**Already Installed (No Changes):**
- `next@14.2.0` - Framework
- `react@18.3.1` - UI library
- `tailwindcss@3.4.1` - Styling
- `framer-motion@11.18.2` - Animations
- `react-markdown@10.1.0` - Markdown rendering (Iteration 2)
- `remark-gfm@4.0.1` - GitHub Flavored Markdown (Iteration 2)
- `clsx@2.1.0` - Conditional classes
- `tailwind-merge@2.2.1` - Class merging

**Development Tools:**
- `typescript@5.9.3` - Type checking
- `autoprefixer@10.4.17` - CSS vendor prefixes
- `postcss@8.4.33` - CSS processing

**No New Dependencies Required for Iteration 1**

---

### Testing Infrastructure

**Current Testing Setup:**
- **No automated tests** - project uses manual testing
- **No E2E framework** - no Playwright/Cypress
- **No visual regression testing** - no Percy/Chromatic

**Recommendation for Iteration 1:**
- Manual testing checklist (navigation, spacing, typography, color)
- Browser DevTools for responsive testing
- Lighthouse for accessibility audit (WCAG AA contrast)
- Real device testing (iPhone, Android, iPad)

**Future Iteration Testing (Post-MVP):**
- Playwright for E2E navigation testing
- Chromatic for visual regression
- Jest + React Testing Library for component tests

---

## Questions for Planner

### Question 1: Navigation Height - JavaScript vs CSS-Only?

**Context:** Mobile menu height is dynamic, varies with number of nav items.

**Options:**
1. **JavaScript measurement** - Accurate but requires client-side JS
2. **CSS calc() with fixed offset** - SSR-friendly but less accurate

**Recommendation:** JavaScript measurement (more accurate, app already uses client-side JS extensively)

**Question:** Is SSR a concern for navigation height calculation?

---

### Question 2: CSS Variable Scope - Global vs Per-Page?

**Context:** --nav-height could be global (same for all pages) or per-page (different values).

**Options:**
1. **Global CSS variable** - Simpler, assumes nav height is consistent
2. **Per-page CSS variable** - More flexible, allows page-specific nav heights

**Recommendation:** Global CSS variable (nav height should be consistent)

**Question:** Are there any pages that need custom nav heights?

---

### Question 3: EmptyState Enhancements - Iteration 1 or Iteration 2?

**Context:** Current EmptyState is functional but could be enhanced (illustration, variants).

**Options:**
1. **Iteration 1** - Enhanced EmptyState with illustration + variant props
2. **Iteration 2** - Basic deployment in Iteration 1, enhancements in Iteration 2

**Recommendation:** Basic deployment in Iteration 1, enhancements in Iteration 2 (focus on consistency first)

**Question:** Should we enhance EmptyState component now or later?

---

### Question 4: Spacing Scale - Add New Values or Use Existing?

**Context:** variables.css already defines spacing scale (xs → 3xl).

**Options:**
1. **Use existing scale** - Simpler, consistent with current design
2. **Add new values** - More flexibility, but increases complexity

**Recommendation:** Use existing scale (xs → 3xl covers 99% of use cases)

**Question:** Are there spacing needs not covered by existing scale?

---

### Question 5: Color Audit - Strict Enforcement or Gradual Migration?

**Context:** Some components use arbitrary Tailwind colors instead of mirror.* palette.

**Options:**
1. **Strict enforcement** - Audit ALL color usage, migrate to mirror.* in Iteration 1
2. **Gradual migration** - Audit in Iteration 1, migrate in future iterations

**Recommendation:** Audit in Iteration 1, create migration plan for Iteration 2-3

**Question:** Should we migrate all colors to mirror.* palette in Iteration 1?

---

### Question 6: Mobile Testing Devices - Which Devices to Prioritize?

**Context:** Must test navigation fix on real mobile devices.

**Options:**
1. **Minimal testing** - iPhone (Safari), Android (Chrome) only
2. **Comprehensive testing** - iPhone, Android, iPad, various screen sizes

**Recommendation:** Comprehensive testing (navigation fix is critical)

**Question:** Which devices are most important for user base?

---

## Dependency Graph for Iteration 1 Changes

```
Iteration 1 Feature Dependencies
=================================

Feature 1: Navigation Overlap Fix
  ├─ CREATE: --nav-height CSS variable (variables.css)
  ├─ UPDATE: AppNavigation component (measure + set height)
  ├─ UPDATE: All pages (use pt-[var(--nav-height)])
  │   ├─ /app/dashboard/page.tsx
  │   ├─ /app/dreams/page.tsx
  │   ├─ /app/reflections/page.tsx
  │   ├─ /app/evolution/page.tsx
  │   ├─ /app/visualizations/page.tsx
  │   └─ /app/reflection/page.tsx
  └─ TEST: All pages at 5 breakpoints + real devices

Feature 2: Spacing & Layout System
  ├─ AUDIT: All pages for spacing consistency
  ├─ DOCUMENT: Spacing patterns (patterns.md)
  ├─ UPDATE: Components using arbitrary px values
  └─ TEST: Responsive spacing at mobile/tablet/desktop

Feature 3: Typography & Readability Polish
  ├─ AUDIT: All pages for typography usage
  ├─ UPDATE: Components using arbitrary text sizes
  ├─ VERIFY: Heading hierarchy (h1 → h2 → h3)
  ├─ VERIFY: Line heights (1.8 for reflection content)
  └─ TEST: Reading widths (max 720px for reflection content)

Feature 4: Color & Semantic Meaning
  ├─ AUDIT: All pages for color usage
  ├─ GREP: Find non-semantic colors (text-green, bg-blue, etc.)
  ├─ CREATE: Migration plan for mirror.* palette
  ├─ DOCUMENT: Color usage guide (patterns.md)
  └─ TEST: Contrast ratios (WCAG AA)

Feature 5: Enhanced Empty States Across App
  ├─ ENHANCE: EmptyState component (optional illustration, variant)
  ├─ UPDATE: All empty state locations (consistent copy + spacing)
  │   ├─ Dashboard (no dreams, no reflections)
  │   ├─ Dreams page
  │   ├─ Reflections page
  │   ├─ Evolution page
  │   └─ Visualizations page
  └─ TEST: All empty state scenarios

CRITICAL PATH:
Feature 1 (Navigation) → BLOCKING for all other features
All other features can proceed in parallel once Feature 1 complete
```

---

## Summary: Technology Stack for Iteration 1

### Confirmed Stack (No Changes)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Next.js | 14.2.0 | Framework | App Router, SSR/CSR |
| React | 18.3.1 | UI Library | Server/Client components |
| TypeScript | 5.9.3 | Type Safety | Strict mode enabled |
| Tailwind CSS | 3.4.1 | Styling | Utility-first + custom properties |
| Framer Motion | 11.18.2 | Animations | Reduced motion support |
| react-markdown | 10.1.0 | Markdown (Iteration 2) | Already installed |
| remark-gfm | 4.0.1 | GFM support | Already installed |
| clsx | 2.1.0 | Class composition | Combined with tailwind-merge |
| lucide-react | 0.546.0 | Icons | Menu, X icons |

### Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| PostCSS | 8.4.33 | CSS processing |
| Autoprefixer | 10.4.17 | Vendor prefixes |
| Tailwind CLI | 3.4.1 | CSS generation |

### Development Tools

| Tool | Purpose |
|------|---------|
| Chrome DevTools | Responsive testing |
| Lighthouse | Accessibility audit |
| Real Devices | Mobile testing (iPhone, Android, iPad) |

### NO NEW DEPENDENCIES REQUIRED

All Iteration 1 features can be implemented using existing infrastructure.

---

**END OF REPORT**

**Next Steps:**
1. Planner synthesizes this report with Explorer 1, 3, 4 findings
2. Planner creates builder task assignments
3. Builder 1 fixes navigation overlap
4. Builders 2-3 audit spacing, typography, color, deploy empty states
5. Integration validates across all pages

**Complexity Rating:** MEDIUM (systematic work, high test coverage required)
**Risk Level:** LOW (no new dependencies, established patterns)
**Confidence:** HIGH (all patterns documented, clear implementation path)
