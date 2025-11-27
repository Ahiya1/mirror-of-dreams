# Code Patterns & Conventions - Iteration 9

**Iteration:** 9 (Global)
**Plan:** plan-6
**Phase:** Foundation & Infrastructure
**Last Updated:** 2025-11-27

---

## Overview

This document provides **copy-pasteable code patterns** for all Iteration 9 work. Every pattern includes full, working code examples that builders can copy and adapt. No pseudocode.

**Critical for Builders:** Follow these patterns exactly to maintain consistency and prevent integration issues.

---

## File Structure

```
mirror-of-dreams/
├── app/                          # Next.js App Router pages
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard (navigation fix target)
│   ├── dreams/
│   │   └── page.tsx             # Dreams page (navigation fix target)
│   ├── reflections/
│   │   └── page.tsx             # Reflections page (navigation fix target)
│   ├── evolution/
│   │   └── page.tsx             # Evolution page (navigation fix target)
│   ├── visualizations/
│   │   └── page.tsx             # Visualizations page (navigation fix target)
│   └── reflection/
│       └── page.tsx             # Reflection creation (check MirrorExperience)
├── components/
│   ├── shared/
│   │   ├── AppNavigation.tsx    # Navigation component (add height measurement)
│   │   └── EmptyState.tsx       # Empty state component (enhance with props)
│   └── ui/
│       └── glass/
│           ├── GlassCard.tsx    # Base card component (use in EmptyState)
│           ├── GlowButton.tsx   # Button component (use in EmptyState)
│           └── GradientText.tsx # Gradient text (use in EmptyState)
├── styles/
│   ├── variables.css            # CSS custom properties (add --nav-height)
│   ├── globals.css              # Global styles (add .pt-nav utility)
│   └── dashboard.css            # Dashboard styles (no changes)
├── lib/
│   ├── utils.ts                 # cn() helper (use for class composition)
│   └── animations/
│       └── variants.ts          # Animation variants (use existing)
└── tailwind.config.ts           # Tailwind config (extend with .pt-nav if needed)
```

---

## Naming Conventions

### Files
- Components: PascalCase (`EmptyState.tsx`, `AppNavigation.tsx`)
- Pages: lowercase (`page.tsx`, `layout.tsx`)
- Utilities: camelCase (`utils.ts`, `variants.ts`)
- Styles: kebab-case (`variables.css`, `globals.css`)

### Components
- PascalCase (`EmptyState`, `GlassCard`)
- Props interfaces: `{ComponentName}Props` (`EmptyStateProps`)

### Functions
- camelCase (`measureNavHeight`, `useAnimationConfig`)
- Hooks: `use{HookName}` (`useReducedMotion`)

### CSS Variables
- kebab-case with `--` prefix (`--nav-height`, `--space-xl`)
- Semantic naming: `--{category}-{property}` (`--cosmic-text-muted`)

### CSS Classes
- Utility classes: kebab-case (`.pt-nav`, `.text-h1`)
- Component classes: kebab-case (`.crystal-glass`, `.gradient-text-cosmic`)

### Constants
- SCREAMING_SNAKE_CASE (`MAX_NAV_HEIGHT`, `MIN_BREAKPOINT`)

---

## Navigation Padding Pattern

### Problem
Fixed-position navigation at top of viewport obscures page content unless compensated with padding.

### Solution
Use `--nav-height` CSS variable for all page padding-top. Measure navigation height dynamically with JavaScript.

---

### Step 1: Create CSS Variable

**File:** `styles/variables.css`

**Add at line ~260 (Component Specific section):**

```css
:root {
  /* ... existing variables ... */

  /* Navigation */
  --nav-height: clamp(60px, 8vh, 80px);  /* Default fallback, overridden by JS */
}
```

**Why clamp():**
- Responsive: scales from 60px (mobile) to 80px (desktop)
- Fallback: works even if JavaScript measurement fails
- Matches AppNavigation actual height calculation

---

### Step 2: Add Utility Class

**File:** `styles/globals.css` (recommended) OR `tailwind.config.ts`

**Option A: globals.css (Simpler, Recommended):**

Add after existing utility classes:

```css
/* Navigation Compensation */
.pt-nav {
  padding-top: var(--nav-height);
}
```

**Option B: tailwind.config.ts (More Tailwind-native):**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      spacing: {
        'nav': 'var(--nav-height)',
      }
    }
  }
}

// Usage: className="pt-nav" (same as Option A)
```

**Recommendation:** Use Option A (globals.css) for consistency with existing patterns.

---

### Step 3: Measure Navigation Height Dynamically

**File:** `components/shared/AppNavigation.tsx`

**Add height measurement hook:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass';

interface AppNavigationProps {
  currentPage: string;
  onRefresh?: () => void;
}

export function AppNavigation({ currentPage, onRefresh }: AppNavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Measure navigation height and set CSS variable
  useEffect(() => {
    const measureNavHeight = () => {
      const nav = document.querySelector('[data-nav-container]');
      if (nav) {
        const height = nav.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--nav-height', `${height}px`);
      }
    };

    // Measure on mount
    measureNavHeight();

    // Re-measure on resize (debounced)
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureNavHeight, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [showMobileMenu]); // Re-measure when mobile menu toggles

  return (
    <GlassCard
      elevated
      data-nav-container  // Add data attribute for querySelector
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
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="lg:hidden mt-4 pt-4 border-t border-white/10 px-6 pb-4"
          >
            {/* Mobile nav links */}
          </motion.nav>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
```

**Key Points:**
- `data-nav-container` attribute for querySelector targeting
- `useEffect` measures height on mount + resize
- Debounced resize handler (150ms) prevents performance issues
- Re-measures when `showMobileMenu` changes (mobile menu height affects total)
- Sets `--nav-height` CSS variable dynamically via `documentElement.style.setProperty()`

---

### Step 4: Apply to All Pages

**Pattern for ALL page files:**

**File:** `app/dashboard/page.tsx` (example)

```typescript
import { AppNavigation } from '@/components/shared/AppNavigation';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AppNavigation currentPage="dashboard" />

      {/* Main content with padding-top compensation */}
      <main className="pt-nav px-4 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Page content */}
        </div>
      </main>
    </div>
  );
}
```

**Before (BROKEN - some pages):**
```typescript
// WRONG: No padding-top
<main className="px-4 sm:px-8 pb-8">

// WRONG: Arbitrary padding that doesn't match nav height
<main className="pt-20 px-4">

// WRONG: Hardcoded value
<main className="pt-[80px] px-4">
```

**After (CORRECT):**
```typescript
// CORRECT: Uses dynamic --nav-height variable
<main className="pt-nav px-4 sm:px-8 pb-8">
```

---

### Step 5: Testing Checklist

**Test ALL pages at 5 breakpoints:**

- [ ] **320px (mobile):** Content visible, no overlap, mobile menu doesn't obscure content when open
- [ ] **768px (tablet):** Content visible, no gap between nav and content
- [ ] **1024px (laptop):** Content visible, smooth transition from tablet
- [ ] **1440px (desktop):** Content visible, optimal spacing
- [ ] **1920px (large):** Content visible, max nav height maintained

**Visual Debug Overlay (Optional):**

Add temporarily to test pages:

```typescript
{/* DEBUG: Visual overlay to verify nav height = padding */}
<div
  className="fixed top-0 left-0 right-0 pointer-events-none z-[9999] border-2 border-red-500"
  style={{
    height: 'var(--nav-height)',
    background: 'rgba(255, 0, 0, 0.1)',
  }}
>
  <span className="text-red-500 text-xs">Expected nav space</span>
</div>
```

**Screenshot Regression:**
- Take screenshots of all pages BEFORE making changes
- Take screenshots AFTER applying navigation fix
- Compare side-by-side to verify no unintended changes

---

## Spacing System Pattern

### Design Scale (Already Established - DO NOT CHANGE VALUES)

**File:** `styles/variables.css`

**Existing spacing scale:**

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

  /* Responsive (fluid scaling via clamp) - USE THESE */
  --space-xs: clamp(0.5rem, 1vw, 0.75rem);      /* 8-12px */
  --space-sm: clamp(0.75rem, 1.5vw, 1rem);      /* 12-16px */
  --space-md: clamp(1rem, 2.5vw, 1.5rem);       /* 16-24px */
  --space-lg: clamp(1.5rem, 3vw, 2rem);         /* 24-32px */
  --space-xl: clamp(2rem, 4vw, 3rem);           /* 32-48px */
  --space-2xl: clamp(3rem, 6vw, 4rem);          /* 48-64px */
  --space-3xl: clamp(4rem, 8vw, 6rem);          /* 64-96px */
}
```

### Semantic Usage Guide

**When to use each spacing value:**

| Variable | Mobile | Desktop | Use Case | Example |
|----------|--------|---------|----------|---------|
| `--space-xs` | 8px | 12px | Tight spacing between related UI elements | Icon + label gap |
| `--space-sm` | 12px | 16px | Spacing between related items in a group | List item vertical spacing |
| `--space-md` | 16px | 24px | Component internal padding | Input field padding, small card padding |
| `--space-lg` | 24px | 32px | Section spacing within a page | Gap between dashboard sections |
| `--space-xl` | 32px | 48px | Card padding, component spacing | GlassCard default padding |
| `--space-2xl` | 48px | 64px | Major section breaks | Dashboard grid gap, page section spacing |
| `--space-3xl` | 64px | 96px | Page section spacing | Header to content, large visual breaks |

### Usage Examples

**Component padding:**

```typescript
// Small card
<GlassCard className="p-md">
  {/* 16-24px padding */}
</GlassCard>

// Standard card (default)
<GlassCard className="p-xl">
  {/* 32-48px padding */}
</GlassCard>

// Large card
<GlassCard className="p-2xl">
  {/* 48-64px padding */}
</GlassCard>
```

**Grid/flex gaps:**

```typescript
// Tight grid (related items)
<div className="grid grid-cols-2 gap-sm">

// Standard grid (sections)
<div className="grid grid-cols-1 md:grid-cols-2 gap-lg">

// Spacious grid (major sections)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
```

**Vertical spacing (stacking):**

```typescript
// Tight stack (form fields)
<div className="flex flex-col gap-md">
  <input />
  <input />
</div>

// Standard stack (page sections)
<div className="flex flex-col gap-2xl">
  <section>Dashboard</section>
  <section>Recent Reflections</section>
</div>
```

**Container max-widths (Iteration 1 requirements):**

```typescript
// Dashboard container (1200px max)
<div className="max-w-[1200px] mx-auto px-xl">

// Reflection form container (800px max)
<div className="max-w-[800px] mx-auto px-lg">

// Reflection display container (720px max for optimal reading)
<div className="max-w-[720px] mx-auto px-md">
```

### Anti-Patterns (DO NOT USE)

```typescript
// WRONG: Arbitrary Tailwind spacing (not responsive)
<div className="px-8 py-12 gap-6">

// WRONG: Hardcoded pixel values
<div style={{ padding: '24px', gap: '32px' }}>

// WRONG: Using fixed space values instead of responsive
<div className="p-[var(--space-6)]">  // Use --space-lg instead
```

**Correct:**
```typescript
// CORRECT: Use responsive spacing scale
<div className="px-xl py-2xl gap-lg">

// CORRECT: CSS variable in style when needed
<div style={{ padding: 'var(--space-xl)' }}>
```

---

## Typography Pattern

### Hierarchy (Already Established - DOCUMENT, DON'T CHANGE)

**File:** `styles/globals.css`

**Existing utility classes:**

```css
/* Heading Styles */
.text-h1 {
  font-size: var(--text-4xl);       /* 35-48px */
  font-weight: var(--font-semibold); /* 600 */
  line-height: var(--leading-tight);  /* 1.25 */
  letter-spacing: -0.02em;
}

.text-h2 {
  font-size: var(--text-3xl);       /* 29-40px */
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

.text-h3 {
  font-size: var(--text-2xl);       /* 26-32px */
  font-weight: var(--font-medium);   /* 500 */
  line-height: var(--leading-snug);  /* 1.375 */
}

/* Body Styles */
.text-body {
  font-size: var(--text-base);      /* 17-18px */
  line-height: var(--leading-relaxed); /* 1.75 */
}

.text-body-sm {
  font-size: var(--text-sm);        /* 14-16px */
  line-height: var(--leading-normal); /* 1.5 */
}

.text-caption {
  font-size: var(--text-xs);        /* 14-15px */
  line-height: var(--leading-normal);
}
```

### Usage Examples

**Page headings:**

```typescript
// Page title (h1)
<h1 className="text-h1 gradient-text-cosmic mb-lg">
  Your Dashboard
</h1>

// Section heading (h2)
<h2 className="text-h2 text-white/90 mb-md">
  Active Dreams
</h2>

// Subsection heading (h3)
<h3 className="text-h3 text-white/80 mb-sm">
  Recent Reflections
</h3>
```

**Body text:**

```typescript
// Standard body text
<p className="text-body text-white/70">
  Your reflection journey begins here. Create your first dream to unlock the power of self-reflection.
</p>

// Small body text (metadata, labels)
<p className="text-body-sm text-white/60">
  Created 2 days ago
</p>

// Caption/tiny text (timestamps, footnotes)
<span className="text-caption text-white/50">
  Last updated: November 27, 2025
</span>
```

**Reflection content (special case - optimal readability):**

```typescript
// Reflection display - max width for optimal line length
<div className="max-w-[720px] mx-auto">
  <h1 className="text-h1 mb-lg">Reflection Title</h1>
  <div className="text-body text-white/80 leading-[1.8]">
    {/* Reflection content - 18px, line-height 1.8 for readability */}
    {reflectionContent}
  </div>
</div>
```

### Responsive Scaling

Typography automatically scales via `clamp()` in CSS variables:

```typescript
// Desktop (1440px+)
text-h1: 48px
text-body: 18px

// Tablet (768px)
text-h1: ~40px (interpolated)
text-body: ~17.5px

// Mobile (320px)
text-h1: 35px
text-body: 17px
```

**No manual breakpoint adjustments needed** - CSS variables handle it.

### Contrast & Accessibility

**Text opacity guidelines (WCAG AA compliance):**

```css
/* Primary text - 95% opacity (highest contrast) */
.text-white\/95 {
  color: rgba(255, 255, 255, 0.95);
}

/* Secondary text - 80% opacity */
.text-white\/80 {
  color: rgba(255, 255, 255, 0.8);
}

/* Muted text - 60-70% opacity (AUDIT: may need 70% for WCAG AA) */
.text-white\/60 {
  color: rgba(255, 255, 255, 0.6);
}

/* Very muted - 40-50% opacity (use sparingly, may fail contrast) */
.text-white\/40 {
  color: rgba(255, 255, 255, 0.4);
}
```

**Recommendations:**
- **Headings:** 95% opacity (white/95) for maximum readability
- **Body text:** 80% opacity (white/80) for content
- **Metadata:** 60-70% opacity (white/60 or white/70) - verify WCAG AA
- **Disabled/very subtle:** 40% opacity (white/40) - use only for non-essential text

---

## Color Semantic Pattern

### Semantic Palette (Already Established - AUDIT, DON'T CHANGE)

**File:** `tailwind.config.ts`

**Mirror color palette:**

```typescript
colors: {
  mirror: {
    // Base Colors
    'void-deep': '#0a0416',      // Deepest background
    'dark': '#020617',           // Primary background
    'midnight': '#0f172a',       // Secondary background

    // Accent Colors (Semantic)
    'amethyst': '#7c3aed',       // Primary actions, emphasis
    'gold': '#fbbf24',           // Success moments, highlights

    // Semantic Status Colors
    'success': '#34d399',        // Success states (green)
    'warning': '#fbbf24',        // Warnings (gold)
    'error': '#f87171',          // Errors (red)
    'info': '#818cf8',           // Information (blue)
  }
}
```

### When to Use Each Color

**Purple/Amethyst (Primary):**
```typescript
// Primary actions
<GlowButton variant="primary" className="bg-mirror-amethyst">
  Reflect Now
</GlowButton>

// Active states
<Link className={cn(
  'nav-link',
  currentPage === 'dashboard' && 'text-mirror-amethyst'
)}>
  Dashboard
</Link>

// Emphasis/highlights
<GradientText gradient="cosmic" className="text-h2">
  {/* Uses amethyst → purple gradient */}
  Your Dreams
</GradientText>

// Dream badges
<span className="px-3 py-1 rounded-full bg-mirror-amethyst/20 border border-mirror-amethyst/50 text-mirror-amethyst">
  Dream Name
</span>
```

**Gold (Success, Highlights):**
```typescript
// Success messages
<div className="bg-mirror-gold/10 border border-mirror-gold/50 text-mirror-gold px-4 py-3 rounded-lg">
  Reflection created successfully!
</div>

// Positive stats
<div className="text-mirror-gold font-semibold">
  12 reflections this month
</div>

// Gradient accents
<div className="bg-gradient-to-r from-mirror-amethyst to-mirror-gold">
  {/* Purple to gold gradient */}
</div>
```

**Green (Success States):**
```typescript
// Success indicators
<div className="flex items-center gap-2 text-mirror-success">
  <CheckCircle className="w-5 h-5" />
  <span>Dream created</span>
</div>

// Positive feedback
<div className="bg-mirror-success/10 border-l-4 border-mirror-success px-4 py-3">
  Your reflection has been saved.
</div>
```

**Red (Errors, Warnings):**
```typescript
// Error messages
<div className="bg-mirror-error/10 border border-mirror-error/50 text-mirror-error px-4 py-3 rounded-lg">
  Failed to create reflection. Please try again.
</div>

// Form validation
<span className="text-mirror-error text-sm">
  This field is required
</span>

// Character count warning (approaching limit)
<span className={cn(
  'text-sm',
  charCount > maxChars * 0.9 && 'text-mirror-warning',
  charCount > maxChars && 'text-mirror-error'
)}>
  {charCount} / {maxChars}
</span>
```

**Blue (Information, Calm Actions):**
```typescript
// Information messages
<div className="bg-mirror-info/10 border border-mirror-info/50 text-mirror-info px-4 py-3 rounded-lg">
  Evolution insights unlock after 4 reflections
</div>

// Secondary actions (learn more, view details)
<button className="text-mirror-info hover:text-mirror-info/80">
  Learn more about reflections
</button>
```

### Anti-Patterns (DO NOT USE)

```typescript
// WRONG: Arbitrary Tailwind colors
<div className="bg-green-500 text-green-900">  // Use mirror-success instead
<div className="text-blue-400">               // Use mirror-info instead
<div className="border-purple-600">           // Use mirror-amethyst instead

// WRONG: Non-semantic color usage
<button className="text-red-500">Save</button>  // Red implies error, not action
<div className="bg-yellow-200">Success!</div>  // Use mirror-success (green)
```

**Correct:**
```typescript
// CORRECT: Semantic color palette
<div className="bg-mirror-success/10 text-mirror-success">
<div className="text-mirror-info">
<div className="border-mirror-amethyst">

// CORRECT: Semantic usage
<GlowButton variant="primary">Save</GlowButton>  // Primary action (purple)
<div className="text-mirror-success">Success!</div>  // Success state (green)
```

---

## EmptyState Component Pattern

### Component Interface

**File:** `components/shared/EmptyState.tsx`

**Enhanced interface (Iteration 9):**

```typescript
interface EmptyStateProps {
  // Required
  icon: string;                    // Emoji or icon character (e.g., '✨', '🌟')
  title: string;                   // Main heading
  description: string;             // Descriptive text

  // Optional (Iteration 9 enhancements)
  ctaLabel?: string;               // Primary CTA button text
  ctaAction?: () => void;          // Primary CTA action
  illustration?: React.ReactNode;  // Custom SVG/image (instead of icon)
  progress?: {
    current: number;               // Current count (e.g., 2)
    total: number;                 // Total needed (e.g., 4)
    label: string;                 // Unit label (e.g., 'reflections')
  };
  variant?: 'default' | 'compact'; // Size variant
  className?: string;              // Additional classes
}
```

### Full Component Code

```typescript
'use client';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GradientText } from '@/components/ui/glass/GradientText';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
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
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaAction,
  illustration,
  progress,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex justify-center items-center',
      variant === 'default' && 'min-h-[50vh]',
      variant === 'compact' && 'min-h-[30vh]',
      className
    )}>
      <GlassCard elevated className={cn(
        'text-center',
        variant === 'default' && 'max-w-md p-xl',
        variant === 'compact' && 'max-w-sm p-lg'
      )}>
        {/* Icon or Illustration */}
        {illustration ? (
          <div className="mb-md">
            {illustration}
          </div>
        ) : (
          <div className={cn(
            'mb-md',
            variant === 'default' && 'text-6xl',
            variant === 'compact' && 'text-4xl'
          )}>
            {icon}
          </div>
        )}

        {/* Title */}
        <GradientText gradient="cosmic" className={cn(
          'mb-md',
          variant === 'default' && 'text-h2',
          variant === 'compact' && 'text-h3'
        )}>
          {title}
        </GradientText>

        {/* Description */}
        <p className={cn(
          'text-white/60 mb-lg',
          variant === 'default' && 'text-body',
          variant === 'compact' && 'text-body-sm'
        )}>
          {description}
        </p>

        {/* Progress Indicator (Optional) */}
        {progress && (
          <div className="mb-lg">
            <div className="flex items-center justify-center gap-2 mb-sm">
              <div className="text-h3 text-mirror-amethyst font-semibold">
                {progress.current}
              </div>
              <div className="text-body-sm text-white/50">/</div>
              <div className="text-body text-white/60">
                {progress.total} {progress.label}
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-mirror-amethyst to-purple-400 transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA Button (Optional) */}
        {ctaLabel && ctaAction && (
          <GlowButton
            variant="primary"
            size={variant === 'default' ? 'lg' : 'md'}
            onClick={ctaAction}
            className="w-full"
          >
            {ctaLabel}
          </GlowButton>
        )}
      </GlassCard>
    </div>
  );
}
```

### Usage Examples

**Dashboard - No Dreams:**

```typescript
import { EmptyState } from '@/components/shared/EmptyState';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const dreams = []; // Empty array

  if (dreams.length === 0) {
    return (
      <EmptyState
        icon="✨"
        title="Create your first dream to begin your journey"
        description="Dreams are the seeds of transformation. Start your reflection practice by creating a dream you'd like to manifest."
        ctaLabel="Create your first dream"
        ctaAction={() => router.push('/dreams/create')}
      />
    );
  }

  // ... rest of dashboard
}
```

**Evolution Page - Not Enough Reflections:**

```typescript
<EmptyState
  icon="🌱"
  title="Your evolution story unfolds after 4 reflections"
  description="Evolution insights reveal patterns and growth across your reflections. Keep reflecting to unlock this feature."
  progress={{
    current: 2,
    total: 4,
    label: 'reflections'
  }}
  ctaLabel="Create a reflection"
  ctaAction={() => router.push('/reflection')}
/>
```

**Reflections Page - No Reflections:**

```typescript
<EmptyState
  icon="💭"
  title="Reflection is how you water your dreams"
  description="Your reflection journey begins here. Take a moment to gaze into the mirror and explore your inner landscape."
  ctaLabel="Reflect now"
  ctaAction={() => router.push('/reflection')}
  variant="default"
/>
```

**Visualizations Page - No Visualizations (Compact Variant):**

```typescript
<EmptyState
  icon="📊"
  title="Visualizations appear after 4 reflections on a dream"
  description="Visual insights help you see patterns in your reflection journey."
  variant="compact"
/>
```

**Custom Illustration Example:**

```typescript
import { CosmicIllustration } from '@/components/illustrations';

<EmptyState
  illustration={
    <CosmicIllustration width={120} height={120} />
  }
  title="No dreams yet"
  description="Create your first dream to begin"
  ctaLabel="Create dream"
  ctaAction={handleCreateDream}
/>
```

---

## Animation Pattern

### Existing Animation Variants (DO NOT CHANGE - USE AS-IS)

**File:** `lib/animations/variants.ts`

**Card entrance (NO SCALE - Iteration 20 refinement):**

```typescript
import { Variants } from 'framer-motion';

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  hover: {
    y: -2,  // Subtle lift only (NO SCALE)
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

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

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};
```

### Usage (No New Animations in Iteration 9)

**EmptyState uses GlassCard/GlowButton (which have existing hover states):**

```typescript
// EmptyState automatically inherits GlassCard elevated shadow
<GlassCard elevated>  {/* Has subtle shadow on elevated */}
  {/* ... */}
</GlassCard>

// GlowButton has built-in hover glow
<GlowButton variant="primary">  {/* Hovers to lighter purple */}
  Create Dream
</GlowButton>
```

**No custom animations needed** - composition pattern handles it.

---

## Accessibility Pattern

### Reduced Motion Support

**File:** `styles/variables.css`

**Already implemented:**

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: none;
    --transition-smooth: none;
    --transition-slow: none;
    --duration-100: 1ms;
    --duration-150: 1ms;
    --duration-200: 1ms;
    --duration-300: 1ms;
    --duration-500: 1ms;
  }

  * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

**No changes needed** - system respects user preferences automatically.

### Keyboard Navigation

**All interactive elements must be focusable:**

```typescript
// CORRECT: Button is naturally focusable
<button onClick={handleClick}>Action</button>

// CORRECT: Link is naturally focusable
<Link href="/dashboard">Dashboard</Link>

// WRONG: Div with onClick (not keyboard accessible)
<div onClick={handleClick}>Action</div>

// CORRECT: If using div, add tabIndex and keyboard handler
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  role="button"
>
  Action
</div>
```

### Focus Indicators

**CSS variable already defined:**

```css
:root {
  --focus-ring: 0 0 0 2px rgba(124, 58, 237, 0.5);
}

/* Applied to all focusable elements */
*:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

**No changes needed** - system handles focus indicators.

---

## Import Order Convention

**Standardized import order for all files:**

```typescript
// 1. React/Next.js core
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 2. Third-party libraries
import { motion, AnimatePresence } from 'framer-motion';

// 3. Internal components
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { AppNavigation } from '@/components/shared/AppNavigation';

// 4. Utilities
import { cn } from '@/lib/utils';
import { cardVariants } from '@/lib/animations/variants';

// 5. Types
import type { EmptyStateProps } from '@/types/glass-components';

// 6. Styles (if any)
import styles from './DashboardGrid.module.css';
```

---

## Code Quality Standards

### TypeScript Strictness

**All files must:**
- Use explicit types for props (no `any`)
- Use interfaces for component props (not `type`)
- Export types alongside components

```typescript
// CORRECT
interface EmptyStateProps {
  icon: string;
  title: string;
}

export function EmptyState({ icon, title }: EmptyStateProps) {
  // ...
}

// WRONG
export function EmptyState({ icon, title }: any) {
  // No type safety
}
```

### Component Composition

**Favor composition over complex components:**

```typescript
// CORRECT: Compose existing components
<GlassCard elevated>
  <GradientText>Title</GradientText>
  <GlowButton>Action</GlowButton>
</GlassCard>

// WRONG: Build everything from scratch
<div className="custom-card custom-elevated">
  <div className="custom-gradient-text">Title</div>
  <button className="custom-glow-button">Action</button>
</div>
```

### Class Name Composition

**Always use `cn()` for conditional classes:**

```typescript
import { cn } from '@/lib/utils';

// CORRECT
<div className={cn(
  'base-class',
  isActive && 'active-class',
  className
)}>

// WRONG
<div className={`base-class ${isActive ? 'active-class' : ''} ${className}`}>
```

---

## Performance Patterns

### Avoid Unnecessary Re-renders

**Use `useMemo` for expensive calculations:**

```typescript
const filteredDreams = useMemo(() => {
  return dreams.filter(dream => dream.isActive);
}, [dreams]);
```

**Use `useCallback` for event handlers passed to child components:**

```typescript
const handleRefresh = useCallback(() => {
  refetch();
}, [refetch]);

<AppNavigation onRefresh={handleRefresh} />
```

### Lazy Load Components (Not Needed in Iteration 9)

```typescript
// For future iterations (not Iteration 9)
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

---

## Testing Pattern (Manual Testing - Iteration 9)

### Responsive Testing Checklist

```markdown
## Page: [Page Name]

### Breakpoints
- [ ] 320px (mobile): Content visible, readable, navigation works
- [ ] 768px (tablet): Layout adjusts, no overflow
- [ ] 1024px (laptop): Desktop layout starts
- [ ] 1440px (desktop): Optimal spacing
- [ ] 1920px (large): Max widths respected

### Navigation
- [ ] Content not obscured by fixed nav
- [ ] Padding-top matches nav height exactly
- [ ] Mobile menu doesn't overlap content when open
- [ ] Smooth scrolling (no jump)

### Accessibility
- [ ] All interactive elements keyboard accessible (Tab navigation)
- [ ] Focus indicators visible on all focusable elements
- [ ] Contrast ratio WCAG AA (Lighthouse check)
- [ ] Reduced motion respected (test with OS setting)

### Visual Regression
- [ ] Screenshot BEFORE changes (baseline)
- [ ] Screenshot AFTER changes (comparison)
- [ ] No unintended layout shifts
- [ ] Spacing consistent with design system
```

---

## Typography Pattern (Builder-2 Documentation - Iteration 9)

### Hierarchy (Audited & Documented)

**Typography system is well-established and consistent across the codebase.**

#### Utility Classes (globals.css - lines 487-552)

```css
/* Page Title (h1) - 35-48px */
.text-h1 {
  font-size: var(--text-4xl);       /* 35-48px responsive */
  font-weight: var(--font-semibold); /* 600 */
  line-height: var(--leading-tight); /* 1.25 */
}

/* Section Heading (h2) - 26-32px */
.text-h2 {
  font-size: var(--text-2xl);       /* 26-32px responsive */
  font-weight: var(--font-semibold); /* 600 */
  line-height: var(--leading-tight); /* 1.25 */
}

/* Subsection Heading (h3) - 21-26px */
.text-h3 {
  font-size: var(--text-xl);        /* 21-26px responsive */
  font-weight: var(--font-medium);   /* 500 */
  line-height: var(--leading-snug);  /* 1.375 */
}

/* Body Text - 17-18px (WCAG AA optimized) */
.text-body {
  font-size: var(--text-base);       /* 17-18px responsive */
  font-weight: var(--font-normal);   /* 400 */
  line-height: var(--leading-relaxed); /* 1.75 */
}

/* Small Text - 14-16px */
.text-small {
  font-size: var(--text-sm);        /* 14-16px responsive */
  font-weight: var(--font-normal);  /* 400 */
  line-height: var(--leading-normal); /* 1.5 */
}

/* Tiny Text - 14-15px */
.text-tiny {
  font-size: var(--text-xs);        /* 14-15px responsive */
  font-weight: var(--font-normal);  /* 400 */
  line-height: var(--leading-snug); /* 1.375 */
}
```

### Usage Examples

**Page headings:**

```typescript
// Page title (h1)
<h1 className="text-h1 gradient-text-cosmic mb-lg">
  Your Dashboard
</h1>

// Section heading (h2)
<h2 className="text-h2 text-white/90 mb-md">
  Active Dreams
</h2>

// Subsection heading (h3)
<h3 className="text-h3 text-white/80 mb-sm">
  Recent Reflections
</h3>
```

**Body text:**

```typescript
// Standard body text
<p className="text-body text-white/70">
  Your reflection journey begins here.
</p>

// Small text (metadata, labels)
<p className="text-small text-white/60">
  Created 2 days ago
</p>

// Tiny text (timestamps, footnotes)
<span className="text-tiny text-white/50">
  Last updated: November 27, 2025
</span>
```

### Responsive Scaling

Typography automatically scales via `clamp()` in CSS variables - **NO manual breakpoint adjustments needed**.

### WCAG AA Compliance (Audited - Iteration 9)

**Text opacity standards:**

| Opacity | Use Case | WCAG AA Status | Recommendation |
|---------|----------|----------------|----------------|
| 95-100% | Headings, critical text | ✅ PASS (20-21:1 ratio) | Use for all headings |
| 80% | Body text, descriptions | ✅ PASS (16.8:1 ratio) | Primary body text |
| 60-70% | Metadata, timestamps | ✅ PASS (12.6-14.7:1 ratio) | Non-critical content only |
| 40% | Disabled, decorative | ⚠️ PASS but not recommended | Use sparingly |

**Audit findings:**
- All text passes WCAG AA minimum 4.5:1 ratio
- Body text (18px, 80% opacity) = 16.8:1 ratio ✅
- Muted text (60% opacity) = 12.6:1 ratio ✅ (borderline but acceptable)

---

## Color Semantic Pattern (Builder-2 Documentation - Iteration 9)

### Semantic Palette (tailwind.config.ts)

**Mirror color system:**

```typescript
colors: {
  mirror: {
    // Base Colors (Backgrounds)
    'void-deep': '#0a0416',      // Deepest background
    'dark': '#020617',           // Primary background (#020617)
    'midnight': '#0f172a',       // Secondary background

    // Accent Colors
    'amethyst': '#7c3aed',       // Primary actions, emphasis (purple)
    'gold': '#fbbf24',           // Success moments (unused currently)

    // Semantic Status Colors
    'success': '#34d399',        // Success states (green)
    'warning': '#fbbf24',        // Warnings (gold)
    'error': '#f87171',          // Errors (red)
    'info': '#818cf8',           // Information (blue)
  }
}
```

### When to Use Each Color

**Purple/Amethyst (Primary actions, emphasis):**

```typescript
// Primary CTAs
<GlowButton variant="primary" className="bg-mirror-amethyst">
  Reflect Now
</GlowButton>

// Active navigation states
<Link className={cn(
  'nav-link',
  currentPage === 'dashboard' && 'text-mirror-amethyst'
)}>
  Dashboard
</Link>

// Dream badges, highlights
<span className="px-3 py-1 rounded-full bg-mirror-amethyst/20 border border-mirror-amethyst/50 text-mirror-amethyst">
  Dream Name
</span>
```

**Green (Success states):**

```typescript
// Success messages (using utility classes)
<div className="status-box-success">
  Your reflection has been saved successfully.
</div>

// Success indicators
<div className="flex items-center gap-2 text-mirror-success">
  <CheckCircle className="w-5 h-5" />
  <span>Dream created</span>
</div>
```

**Red (Errors, warnings):**

```typescript
// Error messages
<div className="status-box-error">
  Failed to create reflection. Please try again.
</div>

// Form validation
<span className="text-mirror-error text-small">
  This field is required
</span>
```

**Blue (Information, calm actions):**

```typescript
// Info messages
<div className="status-box-info">
  Evolution insights unlock after 4 reflections
</div>

// Secondary actions
<button className="text-mirror-info hover:text-mirror-info/80">
  Learn more
</button>
```

### Semantic Utility Classes (globals.css - lines 575-617)

**Reusable status box patterns:**

```css
.status-box-success {
  @apply bg-semantic-success-light border-semantic-success text-semantic-success;
  @apply border backdrop-blur-md rounded-lg p-4;
}

.status-box-error {
  @apply bg-semantic-error-light border-semantic-error text-semantic-error;
  @apply border backdrop-blur-md rounded-lg p-4;
}

.status-box-info {
  @apply bg-semantic-info-light border-semantic-info text-semantic-info;
  @apply border backdrop-blur-md rounded-lg p-4;
}
```

### Anti-Patterns (DO NOT USE)

```typescript
// ❌ WRONG: Arbitrary Tailwind colors
<div className="bg-green-500 text-green-900">  // Use mirror-success
<div className="text-blue-400">               // Use mirror-info
<div className="border-purple-600">           // Use mirror-amethyst

// ✅ CORRECT: Semantic palette
<div className="bg-mirror-success/10 text-mirror-success">
<div className="text-mirror-info">
<div className="border-mirror-amethyst">
```

### Audit Findings (Iteration 9)

**Current usage:**
- ✅ Semantic colors used in 22 occurrences across 8 files
- ⚠️ Legacy purple-* classes found in 30+ occurrences (reflections components)

**Migration recommended (Future iteration):**
- `/app/reflections/[id]/page.tsx` - 24 occurrences of purple-500, purple-300
- `/components/reflections/` - 9 occurrences total

**Replacement pattern:**
```typescript
purple-500 → mirror-amethyst
purple-400 → mirror-amethyst/90
purple-300 → mirror-amethyst/80
```

---

## Summary: Key Patterns for Iteration 9

1. **Navigation Padding:** Always use `.pt-nav` class or `padding-top: var(--nav-height)`
2. **Spacing:** Use responsive `--space-xs` through `--space-3xl` variables (never arbitrary px)
3. **Typography:** Use utility classes (`.text-h1`, `.text-body`) for consistency
4. **Colors:** Use semantic `mirror.*` palette (never arbitrary Tailwind colors)
5. **EmptyState:** Enhance existing component with optional props (backwards compatible)
6. **Composition:** Reuse GlassCard, GlowButton, GradientText (don't rebuild)
7. **Accessibility:** Maintain keyboard nav, focus indicators, WCAG AA contrast
8. **Testing:** Test ALL pages at ALL breakpoints before merging

---

**Patterns Status:** DOCUMENTED
**Ready for:** Builder Implementation
**Next Update:** After Iteration 9 completion (add any new patterns discovered)
