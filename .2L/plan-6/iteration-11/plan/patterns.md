# Code Patterns & Conventions - Iteration 11

**Iteration:** 11 (Global)
**Plan:** plan-6
**Phase:** Systematic Polish & QA
**Created:** 2025-11-28

---

## File Structure

Mirror of Dreams follows Next.js 14 App Router conventions:

```
mirror-of-dreams/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (navigation, cosmic background)
│   ├── template.tsx              # Page transition wrapper (framer-motion)
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard (hero, dreams grid, recent reflections)
│   ├── reflection/
│   │   └── MirrorExperience.tsx  # Reflection form + output view
│   ├── reflections/
│   │   ├── page.tsx              # Collection view (all reflections)
│   │   └── [id]/page.tsx         # Individual reflection display
│   ├── dreams/page.tsx
│   ├── evolution/page.tsx
│   └── visualizations/page.tsx
├── components/
│   ├── shared/                   # Reusable UI components
│   │   ├── AppNavigation.tsx     # Fixed navigation (--nav-height)
│   │   ├── GlassCard.tsx         # Glassmorphic card component
│   │   ├── GlowButton.tsx        # Cosmic button with glow effect
│   │   └── EmptyState.tsx        # Empty state component
│   ├── dashboard/
│   │   └── cards/                # Dashboard-specific cards
│   └── reflection/               # Reflection-specific components
├── lib/
│   ├── animations/
│   │   ├── variants.ts           # Framer Motion variants (15+ variants)
│   │   └── hooks.ts              # Animation hooks (useAnimationConfig)
│   └── utils/                    # Utility functions
├── hooks/
│   ├── useStaggerAnimation.ts    # Grid entrance animations
│   ├── useReducedMotion.ts       # NEW - Accessibility preference detection
│   └── useDashboard.ts           # Dashboard data fetching
├── styles/
│   ├── variables.css             # CSS custom properties (design tokens)
│   ├── globals.css               # Global styles, utility classes
│   ├── dashboard.css             # Dashboard-specific styles
│   ├── reflection.css            # Reflection page styles
│   └── reflection-display.css    # Individual reflection display
├── prisma/
│   └── schema.prisma             # Database schema (not touched in Iteration 11)
└── public/
    └── images/                   # Static assets
```

---

## Naming Conventions

**Components:** PascalCase
- `DashboardHero.tsx`
- `ReflectionQuestionCard.tsx`
- `EmptyState.tsx`

**Files:** camelCase (non-component)
- `formatCurrency.ts`
- `useDashboard.ts`
- `variants.ts`

**Types/Interfaces:** PascalCase
- `Transaction`, `Account`, `Dream`, `Reflection`
- `DashboardProps`, `ReflectionFormData`

**Functions:** camelCase
- `calculateTotal()`
- `formatDate()`
- `useStaggerAnimation()`

**Constants:** SCREAMING_SNAKE_CASE
- `MAX_RETRIES`
- `API_TIMEOUT`
- `DEFAULT_ANIMATION_DURATION`

**CSS Classes:** kebab-case (BEM-style)
- `.card-container`
- `.reflection-form__input`
- `.button--primary`

---

## Animation Patterns

### Pattern 1: Framer Motion Variants

**When to use:** All interactive elements, page transitions, component entrances

**File:** `lib/animations/variants.ts`

**Existing Variant Example:**
```typescript
import type { Variants } from 'framer-motion';

export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // Cubic bezier easing
    },
  },
  hover: {
    y: -2,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
};
```

**Usage in Component:**
```tsx
import { motion } from 'framer-motion';
import { cardVariants } from '@/lib/animations/variants';

export function DreamCard({ dream }: { dream: Dream }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="dream-card"
    >
      <h3>{dream.title}</h3>
      <p>{dream.description}</p>
    </motion.div>
  );
}
```

**NEW Variants to Add (Feature 7):**

```typescript
// 1. Input Focus Variant (Textarea focus glow)
export const inputFocusVariants: Variants = {
  rest: {
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  focus: {
    boxShadow: [
      '0 0 0 2px rgba(139, 92, 246, 0.5)',        // Purple ring
      '0 0 20px rgba(139, 92, 246, 0.3)',         // Purple glow
      'inset 0 0 20px rgba(139, 92, 246, 0.15)',  // Inner glow
    ].join(', '),
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// 2. Card Press Variant (Click feedback)
export const cardPressVariants: Variants = {
  rest: { scale: 1 },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// 3. Character Counter Variant (Color shift based on length)
export const characterCounterVariants: Variants = {
  safe: {
    color: 'rgba(255, 255, 255, 0.7)', // White/70
    transition: { duration: 0.2 },
  },
  warning: {
    color: '#fbbf24', // Gold (approaching limit)
    transition: { duration: 0.2 },
  },
  danger: {
    color: '#f87171', // Red (over limit)
    transition: { duration: 0.2 },
  },
};

// 4. Page Transition Variant (Route changes)
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};
```

**Key Points:**
- All variants use easing functions (no linear transitions)
- Durations: 100ms (instant), 200-300ms (standard), 500ms (slow, dramatic)
- Always provide `rest`, `active`, or state-based variants

---

### Pattern 2: Reduced Motion Support

**When to use:** REQUIRED for all animations (WCAG AA compliance)

**File:** `hooks/useReducedMotion.ts` (NEW - Create this)

```typescript
'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect user's reduced motion preference
 * Returns true if user prefers reduced motion
 *
 * WCAG 2.1 Success Criterion 2.3.3: Animation from Interactions
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    // Listen for preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReduced;
}
```

**Usage Example (Disable Framer Motion Animations):**
```tsx
'use client';

import { motion } from 'framer-motion';
import { cardVariants } from '@/lib/animations/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function DreamCard({ dream }: { dream: Dream }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      // If reduced motion, skip animation variants
      variants={prefersReduced ? undefined : cardVariants}
      initial={prefersReduced ? false : 'hidden'}
      animate={prefersReduced ? false : 'visible'}
      whileHover={prefersReduced ? undefined : 'hover'}
      className="dream-card"
    >
      {/* Card content always renders (instant visibility) */}
      <h3>{dream.title}</h3>
    </motion.div>
  );
}
```

**CSS-Based Reduced Motion (Automatic):**
```css
/* styles/variables.css - Already implemented */
@media (prefers-reduced-motion: reduce) {
  :root {
    /* Disable all CSS transition durations */
    --transition-fast: none;
    --transition-smooth: none;
    --transition-slow: none;
    --transition-elegant: none;

    /* Set all durations to 1ms (instant) */
    --duration-75: 1ms;
    --duration-100: 1ms;
    --duration-150: 1ms;
    --duration-200: 1ms;
    --duration-300: 1ms;
    --duration-500: 1ms;
    --duration-700: 1ms;
  }

  /* Disable all animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Key Points:**
- **3-layer support:** CSS variables (automatic), media queries (component-specific), JS hook (custom logic)
- **Always preserve opacity fades** - Reduced motion doesn't mean no transitions
- **Test with DevTools:** Chrome DevTools → Rendering → Emulate prefers-reduced-motion

---

### Pattern 3: Stagger Animation (List Entrances)

**When to use:** Dashboard cards, reflection collection, dreams list

**File:** `hooks/useStaggerAnimation.ts` (Already exists)

```typescript
'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

export function useStaggerAnimation(
  itemCount: number,
  options: {
    delay?: number;       // Delay between items (ms)
    duration?: number;    // Animation duration per item (ms)
    triggerOnce?: boolean; // Only animate once
  } = {}
) {
  const { delay = 150, duration = 800, triggerOnce = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const getItemStyles = (index: number): CSSProperties => {
    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return { opacity: 1 }; // Instant visibility, no animation
    }

    // Stagger animation logic
    return {
      opacity: 0,
      animation: `fadeInUp ${duration}ms ease-out ${index * delay}ms forwards`,
    };
  };

  return { containerRef, getItemStyles };
}
```

**Usage Example:**
```tsx
export function DreamsGrid({ dreams }: { dreams: Dream[] }) {
  const { containerRef, getItemStyles } = useStaggerAnimation(dreams.length, {
    delay: 150,    // 150ms between each card
    duration: 800, // 800ms animation duration
    triggerOnce: true,
  });

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dreams.map((dream, index) => (
        <div key={dream.id} style={getItemStyles(index)}>
          <DreamCard dream={dream} />
        </div>
      ))}
    </div>
  );
}
```

**CSS Animation (Required):**
```css
/* styles/globals.css - Already implemented */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Typography Patterns

### Pattern 4: Semantic Typography Classes

**When to use:** All text rendering (headings, body, metadata)

**File:** `styles/globals.css` (Lines 487-556)

**Semantic Classes:**
```css
/* Headings */
.text-h1 {
  font-size: var(--text-4xl);      /* 35-48px responsive */
  font-weight: var(--font-semibold); /* 600 */
  line-height: var(--leading-tight); /* 1.25 */
}

.text-h2 {
  font-size: var(--text-2xl);      /* 26-32px */
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

.text-h3 {
  font-size: var(--text-xl);       /* 21-26px */
  font-weight: var(--font-medium);  /* 500 */
  line-height: var(--leading-snug); /* 1.375 */
}

/* Body Text */
.text-body {
  font-size: var(--text-base);     /* 17-18px - WCAG AA optimized */
  font-weight: var(--font-normal);  /* 400 */
  line-height: var(--leading-relaxed); /* 1.75 - optimal readability */
}

.text-small {
  font-size: var(--text-sm);       /* 14-16px */
  font-weight: var(--font-normal);
  line-height: var(--leading-normal); /* 1.5 */
}

.text-tiny {
  font-size: var(--text-xs);       /* 14-15px */
  font-weight: var(--font-normal);
  line-height: var(--leading-snug);
}
```

**Usage Example (CORRECT):**
```tsx
export function DashboardHero({ userName }: { userName: string }) {
  return (
    <div className="dashboard-hero">
      {/* ✅ CORRECT: Semantic heading class */}
      <h1 className="text-h1 gradient-text-cosmic">
        Good evening, {userName}!
      </h1>

      {/* ✅ CORRECT: Semantic body class with semantic opacity */}
      <p className="text-body text-white/80">
        Ready for your next reflection?
      </p>

      {/* ✅ CORRECT: Semantic metadata class with semantic opacity */}
      <span className="text-small text-white/60">
        Created 2 days ago
      </span>
    </div>
  );
}
```

**INCORRECT Usage (Feature 8 Audit Will Fix):**
```tsx
// ❌ BAD: Arbitrary font-size
<h1 className="text-[48px] font-bold">Title</h1>

// ❌ BAD: Arbitrary Tailwind class (not responsive)
<h2 className="text-4xl font-semibold">Subtitle</h2>

// ❌ BAD: Hardcoded style
<p style={{ fontSize: '18px', lineHeight: '1.8' }}>Body text</p>

// ✅ GOOD: Semantic class
<h1 className="text-h1 gradient-text-cosmic">Title</h1>
<h2 className="text-h2">Subtitle</h2>
<p className="text-body text-white/80">Body text</p>
```

**Key Points:**
- **Always use semantic classes** - Never arbitrary values
- **Responsive by default** - `clamp()` scales typography automatically
- **Line-height matters** - 1.75 for body text (WCAG AA optimal readability)
- **Reading width limits** - Max 720px for long-form content (reflection display)

---

## Color Patterns

### Pattern 5: Semantic Color System

**When to use:** All text, backgrounds, borders, status indicators

**File:** `styles/variables.css` + `tailwind.config.ts` (`mirror.*` palette)

**Semantic Color Mapping:**
```tsx
// ✅ CORRECT: Semantic color usage

// Primary Actions (Purple/Amethyst)
<button className="bg-mirror-amethyst text-white">Reflect Now</button>
<div className="border-mirror-amethyst/50">Active dream</div>

// Success States (Gold)
<div className="text-mirror-success bg-mirror-success/10 border-mirror-success/50">
  Reflection created successfully
</div>

// Information (Blue)
<div className="text-mirror-info bg-mirror-info/10">
  Your evolution insights unlock after 4 reflections
</div>

// Errors/Warnings (Red)
<div className="text-mirror-error bg-mirror-error/10 border-mirror-error/50">
  Please fill out all required fields
</div>

// Text Hierarchy (White with semantic opacity)
<h1 className="text-white">Primary heading (100% opacity)</h1>
<p className="text-white/80">Body text (80% - WCAG AA ✓)</p>
<span className="text-white/70">Metadata (70% - WCAG AA ✓ for critical)</span>
<span className="text-white/60">Non-critical info (60% - borderline, use sparingly)</span>
<span className="text-white/40">Decorative only (40% - WCAG AA ✗)</span>
```

**INCORRECT Usage (Feature 9 Audit Will Fix):**
```tsx
// ❌ BAD: Arbitrary Tailwind colors
<div className="text-green-400 bg-green-100 border-green-500">
  Success message
</div>

// ❌ BAD: Non-semantic purple
<button className="bg-purple-500 text-white">Click me</button>

// ❌ BAD: Hardcoded hex color
<p style={{ color: '#8B5CF6' }}>Purple text</p>

// ✅ GOOD: Semantic palette
<div className="text-mirror-success bg-mirror-success/10 border-mirror-success/50">
  Success message
</div>
<button className="bg-mirror-amethyst text-white">Click me</button>
<p className="text-mirror-amethyst">Purple text</p>
```

**Semantic Utility Classes (globals.css lines 609-648):**
```css
/* Success */
.text-semantic-success { @apply text-mirror-success; }
.bg-semantic-success-light { @apply bg-mirror-success/10; }
.border-semantic-success { @apply border-mirror-success/50; }

/* Error */
.text-semantic-error { @apply text-mirror-error; }
.bg-semantic-error-light { @apply bg-mirror-error/10; }
.border-semantic-error { @apply border-mirror-error/50; }

/* Info */
.text-semantic-info { @apply text-mirror-info; }
.bg-semantic-info-light { @apply bg-mirror-info/10; }
.border-semantic-info { @apply border-mirror-info/50; }

/* Warning */
.text-semantic-warning { @apply text-mirror-warning; }
.bg-semantic-warning-light { @apply bg-mirror-warning/10; }
.border-semantic-warning { @apply border-mirror-warning/50; }
```

**Key Points:**
- **Zero arbitrary Tailwind colors** - All from `mirror.*` palette
- **Semantic naming** - Color communicates meaning (success = green, error = red)
- **Opacity standards** - 100%, 95%, 90%, 80%, 70%, 60%, 50%, 40% only (documented in variables.css)
- **WCAG AA compliance** - 80%+ opacity for body text, 70%+ for critical metadata

---

## Component Patterns

### Pattern 6: GlassCard Component

**When to use:** Dashboard cards, reflection cards, modal backgrounds

**File:** `components/shared/GlassCard.tsx`

```tsx
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils'; // tailwind-merge utility

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean; // Enable hover lift effect
  glow?: boolean;  // Enable glow on hover
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false
}: GlassCardProps) {
  return (
    <div
      className={cn(
        // Base glassmorphism styles
        'relative',
        'backdrop-blur-md',
        'bg-white/5',
        'border border-white/10',
        'rounded-2xl',
        'p-6',
        'shadow-lg',
        // Hover effects (optional)
        hover && 'transition-transform duration-300 hover:-translate-y-1',
        glow && 'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]',
        className
      )}
    >
      {children}
    </div>
  );
}
```

**Usage Example:**
```tsx
import { GlassCard } from '@/components/shared/GlassCard';

export function DreamCard({ dream }: { dream: Dream }) {
  return (
    <GlassCard hover glow className="dream-card">
      <h3 className="text-h3 text-white">{dream.title}</h3>
      <p className="text-body text-white/80 mt-2">{dream.description}</p>
      <div className="flex gap-4 mt-4">
        <span className="text-small text-white/60">
          {dream.daysRemaining} days remaining
        </span>
        <span className="text-small text-white/60">
          {dream.reflectionCount} reflections
        </span>
      </div>
    </GlassCard>
  );
}
```

---

### Pattern 7: GlowButton Component

**When to use:** Primary actions (Reflect Now, Create Dream, Submit)

**File:** `components/shared/GlowButton.tsx`

```tsx
import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'cosmic' | 'gentle' | 'intense';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean; // Enable glow effect
}

export function GlowButton({
  children,
  variant = 'cosmic',
  size = 'md',
  glow = true,
  className,
  disabled,
  ...props
}: GlowButtonProps) {
  const variantClasses = {
    cosmic: 'bg-mirror-amethyst text-white',
    gentle: 'bg-mirror-gentle text-white',
    intense: 'bg-mirror-intense text-white',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        // Base styles
        'relative',
        'rounded-xl',
        'font-medium',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Variant and size
        variantClasses[variant],
        sizeClasses[size],
        // Glow effect
        glow && !disabled && 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
        glow && !disabled && 'hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

**Usage Example:**
```tsx
import { GlowButton } from '@/components/shared/GlowButton';

export function DashboardHero() {
  return (
    <div className="dashboard-hero">
      <h1 className="text-h1 gradient-text-cosmic">Ready to reflect?</h1>
      <GlowButton
        variant="cosmic"
        size="lg"
        onClick={() => router.push('/reflection')}
      >
        Reflect Now
      </GlowButton>
    </div>
  );
}
```

---

### Pattern 8: EmptyState Component

**When to use:** No dreams, no reflections, no evolution reports

**File:** `components/shared/EmptyState.tsx`

```tsx
import { type ReactNode } from 'react';
import { GlowButton } from './GlowButton';

interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: ReactNode; // Emoji or SVG
  ctaText?: string;
  ctaAction?: () => void;
}

export function EmptyState({
  title,
  description,
  illustration,
  ctaText,
  ctaAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Illustration */}
      {illustration && (
        <div className="text-6xl mb-6 opacity-60">
          {illustration}
        </div>
      )}

      {/* Title */}
      <h3 className="text-h3 text-white mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-body text-white/70 max-w-md mb-6">
        {description}
      </p>

      {/* CTA */}
      {ctaText && ctaAction && (
        <GlowButton variant="cosmic" onClick={ctaAction}>
          {ctaText}
        </GlowButton>
      )}
    </div>
  );
}
```

**Usage Example:**
```tsx
import { EmptyState } from '@/components/shared/EmptyState';

export function DreamsGrid({ dreams }: { dreams: Dream[] }) {
  if (dreams.length === 0) {
    return (
      <EmptyState
        illustration="✨"
        title="Dreams are the seeds of transformation"
        description="Create your first dream to begin your journey of self-reflection and growth."
        ctaText="Create Your First Dream"
        ctaAction={() => router.push('/dreams/create')}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dreams.map((dream) => (
        <DreamCard key={dream.id} dream={dream} />
      ))}
    </div>
  );
}
```

---

## Form Patterns

### Pattern 9: Reflection Form Input with Focus Glow

**When to use:** Reflection form textareas, input fields

**File:** `app/reflection/MirrorExperience.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { inputFocusVariants } from '@/lib/animations/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useState } from 'react';

export function ReflectionQuestionInput({
  label,
  placeholder,
  value,
  onChange,
  maxLength = 500,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const prefersReduced = useReducedMotion();
  const currentLength = value.length;

  // Character counter color logic
  const counterColor =
    currentLength > maxLength * 0.9
      ? 'text-mirror-error'      // Red: Over 90%
      : currentLength > maxLength * 0.7
        ? 'text-mirror-warning'  // Gold: Over 70%
        : 'text-white/70';       // White: Safe

  return (
    <div className="reflection-question">
      {/* Label */}
      <label className="block text-body text-white/90 mb-2">
        {label}
      </label>

      {/* Textarea with focus glow animation */}
      <motion.textarea
        variants={prefersReduced ? undefined : inputFocusVariants}
        initial="rest"
        animate={isFocused ? 'focus' : 'rest'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`
          w-full
          min-h-[120px]
          p-4
          bg-white/5
          border border-white/10
          rounded-xl
          text-white/90
          placeholder:text-white/40
          resize-vertical
          focus:outline-none
          transition-colors duration-200
        `}
      />

      {/* Character counter */}
      <div className="flex justify-end mt-2">
        <span className={`text-small ${counterColor} transition-colors duration-200`}>
          {currentLength} / {maxLength}
        </span>
      </div>
    </div>
  );
}
```

---

### Pattern 10: Character Counter Color Shift

**When to use:** Any input with character limits (reflection form, dream creation)

```tsx
import { motion } from 'framer-motion';
import { characterCounterVariants } from '@/lib/animations/variants';

export function CharacterCounter({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  // Determine color state
  const getColorState = () => {
    if (current > max * 0.9) return 'danger';   // Over 90%
    if (current > max * 0.7) return 'warning';  // Over 70%
    return 'safe';                              // Under 70%
  };

  return (
    <motion.span
      variants={characterCounterVariants}
      animate={getColorState()}
      className="text-small"
    >
      {current} / {max}
    </motion.span>
  );
}
```

---

## Page Transition Pattern

### Pattern 11: Next.js App Router Page Transitions

**When to use:** All route changes (automatic via `template.tsx`)

**File:** `app/template.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { pageTransitionVariants } from '@/lib/animations/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function Template({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      variants={prefersReduced ? undefined : pageTransitionVariants}
      initial={prefersReduced ? false : 'initial'}
      animate={prefersReduced ? false : 'enter'}
      exit={prefersReduced ? false : 'exit'}
    >
      {children}
    </motion.div>
  );
}
```

**Key Points:**
- Automatic for ALL route changes (Next.js App Router magic)
- 300ms fade-in on enter, 150ms fade-out on exit
- Respects reduced motion preference
- No per-page configuration needed

---

## Validation Patterns

### Pattern 12: Grep-Based Audit (Typography & Color)

**When to use:** Feature 8 (Typography Audit) and Feature 9 (Color Audit)

**Typography Audit Commands:**
```bash
# Find arbitrary font-size values (should return ZERO matches after audit)
grep -r "text-\[[0-9]" app/ components/ --include="*.tsx"

# Find arbitrary line-height values
grep -r "leading-\[[0-9]" app/ components/ --include="*.tsx"

# Find hardcoded font-size in style props
grep -r "fontSize:" app/ components/ --include="*.tsx"

# Verify all h1 use .text-h1 (or text-4xl if not refactored yet)
grep -r "<h1" app/ components/ --include="*.tsx" -A 1
```

**Color Audit Commands:**
```bash
# Find arbitrary Tailwind colors (should return ZERO matches after audit)
grep -r "text-\(red\|blue\|green\|yellow\|purple\)-[0-9]\{3\}" app/ components/ --include="*.tsx"
grep -r "bg-\(red\|blue\|green\|yellow\|purple\)-[0-9]\{3\}" app/ components/ --include="*.tsx"
grep -r "border-\(red\|blue\|green\|yellow\|purple\)-[0-9]\{3\}" app/ components/ --include="*.tsx"

# Find hardcoded hex colors in style props
grep -r "color: '#" app/ components/ --include="*.tsx"
grep -r "backgroundColor: '#" app/ components/ --include="*.tsx"

# Find non-semantic opacity values (should only see 100, 95, 90, 80, 70, 60, 50, 40)
grep -r "text-white/[0-9]" app/ components/ --include="*.tsx" | \
  grep -v "text-white/\(100\|95\|90\|80\|70\|60\|50\|40\)"
```

**Fix Pattern (Typography):**
```tsx
// BEFORE (arbitrary values)
<h1 className="text-[48px] font-bold">Dashboard</h1>
<p className="text-lg leading-loose">Description</p>

// AFTER (semantic classes)
<h1 className="text-h1 gradient-text-cosmic">Dashboard</h1>
<p className="text-body text-white/80">Description</p>
```

**Fix Pattern (Color):**
```tsx
// BEFORE (arbitrary Tailwind colors)
<div className="text-green-400 bg-green-100 border-green-500">
  Success message
</div>

// AFTER (semantic palette)
<div className="text-mirror-success bg-mirror-success/10 border-mirror-success/50">
  Success message
</div>
```

---

### Pattern 13: Accessibility Testing Checklist

**When to use:** Feature 10 (Accessibility Validation)

**Keyboard Navigation Test:**
```markdown
## Keyboard Navigation Checklist

### Dashboard Page
- [ ] Tab to "Reflect Now" button (focus ring visible)
- [ ] Tab to each dream card (focus ring visible)
- [ ] Enter/Space activates "Reflect Now" button
- [ ] Tab to navigation links (Home, Reflections, Dreams)
- [ ] Arrow keys navigate if applicable

### Reflection Page
- [ ] Tab through all 4 question textareas (focus ring visible)
- [ ] Tab to tone selection cards (Gentle, Intense, Fusion)
- [ ] Enter/Space selects tone
- [ ] Tab to "Gaze into the Mirror" submit button
- [ ] Enter submits form
- [ ] No keyboard traps (can escape from all elements)

### Reflections Collection Page
- [ ] Tab through reflection cards
- [ ] Enter opens individual reflection
- [ ] Tab to filter dropdown
- [ ] Arrow keys navigate dropdown options
```

**Screen Reader Test:**
```markdown
## Screen Reader Checklist (macOS VoiceOver or NVDA)

### Headings
- [ ] h1 announces as "Heading level 1"
- [ ] h2 announces as "Heading level 2"
- [ ] Heading hierarchy logical (h1 → h2 → h3, no skips)

### Buttons
- [ ] "Reflect Now" announces button name and role
- [ ] All icon-only buttons have aria-label
- [ ] Disabled buttons announce "disabled"

### Form Inputs
- [ ] All textareas have associated labels (announces label text)
- [ ] Character counter announces current count
- [ ] Error messages announced when validation fails

### Dynamic Content
- [ ] Loading states announce "Loading..." (aria-live="polite")
- [ ] Success messages announce (role="status")
- [ ] Error messages announce (role="alert")
```

**Contrast Test (Chrome DevTools):**
```markdown
## Color Contrast Checklist

### Text Contrast (WCAG AA: 4.5:1 minimum for normal text)
- [ ] Primary headings (text-white): Check contrast vs background
- [ ] Body text (text-white/80): Verify 4.5:1+ contrast
- [ ] Metadata (text-white/70): Verify 4.5:1+ contrast (critical content only)
- [ ] Metadata (text-white/60): Document as borderline (non-critical only)
- [ ] Decorative text (text-white/40): Mark as decorative (WCAG AA exempt)

### Large Text (WCAG AA: 3:1 minimum for 18px+ or bold 14px+)
- [ ] h1 headings: Verify 3:1+ contrast
- [ ] h2 headings: Verify 3:1+ contrast

### Buttons
- [ ] Button text vs button background: 4.5:1+
- [ ] Button border vs page background: 3:1+

### How to Test:
1. Chrome DevTools → Elements panel
2. Select text element
3. Styles panel → Scroll to color property
4. Click color swatch → Contrast ratio displayed
5. Verify green checkmark (WCAG AA pass) or red X (fail)
```

---

### Pattern 14: Performance Testing (Chrome DevTools)

**When to use:** Feature 11 (Performance Validation)

**LCP Measurement:**
```markdown
## Largest Contentful Paint (LCP) Testing

### Target: <2.5s (Google Core Web Vitals)

### Test Procedure:
1. Open Chrome DevTools (F12)
2. Navigate to Lighthouse tab
3. Select:
   - Mode: Navigation
   - Device: Desktop OR Mobile
   - Categories: Performance (only)
4. Throttling: Apply (Simulated Fast 3G)
5. Click "Analyze page load"

### Results:
- LCP Value: _____ ms (target: <2500ms)
- Element: _____ (usually h1 or hero image)
- PASS/FAIL: _____

### Pages to Test:
- [ ] Dashboard (`/dashboard`)
- [ ] Reflection page (`/reflection`)
- [ ] Individual reflection (`/reflections/[id]`)
- [ ] Dreams page (`/dreams`)
- [ ] Evolution page (`/evolution`)
```

**60fps Animation Profiling:**
```markdown
## Animation Performance Testing

### Target: 60fps (green line in timeline)

### Test Procedure:
1. Chrome DevTools → Performance panel
2. Click Record (red circle)
3. Trigger animation:
   - Hover over dashboard card
   - Open reflection form
   - Submit reflection (loading → output transition)
   - Navigate between pages (page transition)
4. Stop recording (3-5 seconds)
5. Analyze timeline:
   - FPS graph should be GREEN (60fps)
   - YELLOW = 30-60fps (acceptable on old devices)
   - RED = <30fps (FAIL - optimize required)

### Animations to Test:
- [ ] Dashboard card stagger (entrance animation)
- [ ] Dashboard card hover (lift + glow)
- [ ] Reflection textarea focus (glow animation)
- [ ] Page transition (fade crossfade)
- [ ] Loading → Output transition (CosmicLoader)

### Results:
- Dashboard stagger: _____fps (PASS/FAIL)
- Card hover: _____fps (PASS/FAIL)
- Textarea focus: _____fps (PASS/FAIL)
- Page transition: _____fps (PASS/FAIL)
```

---

## Import Order Convention

**File:** Any component file

```tsx
// 1. React imports
import { useState, useEffect, type ReactNode } from 'react';

// 2. Next.js imports
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 3. Third-party libraries
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// 4. Internal utilities
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// 5. Hooks
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDashboard } from '@/hooks/useDashboard';

// 6. Components
import { GlassCard } from '@/components/shared/GlassCard';
import { GlowButton } from '@/components/shared/GlowButton';

// 7. Animation variants
import { cardVariants, inputFocusVariants } from '@/lib/animations/variants';

// 8. Types
import type { Dream, Reflection } from '@/types';

// 9. Styles (if CSS modules used)
import styles from './Dashboard.module.css';
```

---

## Code Quality Standards

**1. TypeScript Strict Mode:**
- All components type-safe
- No `any` types (use `unknown` if truly unknown)
- Explicit return types for functions

**2. Accessibility:**
- All interactive elements keyboard accessible
- All images have `alt` text
- All icon-only buttons have `aria-label`
- Color not sole indicator of meaning

**3. Performance:**
- Lazy load non-critical components
- Use `next/image` for all images (automatic optimization)
- Avoid inline functions in render (memoize with `useCallback`)

**4. Naming:**
- Components: PascalCase
- Functions/variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Files: Match component name (PascalCase for components, camelCase for utilities)

---

## Summary: Key Patterns for Iteration 11

**Builders MUST follow these patterns:**

1. **Animation Variants:** Extend `lib/animations/variants.ts` with 4 new variants (inputFocus, cardPress, characterCounter, pageTransition)
2. **Reduced Motion:** Use `useReducedMotion()` hook for all new animations
3. **Semantic Typography:** Replace arbitrary values with `.text-h1`, `.text-body`, etc.
4. **Semantic Colors:** Replace arbitrary Tailwind with `mirror.*` palette
5. **Grep Audits:** Use provided commands to find violations
6. **Accessibility Testing:** Follow keyboard nav, screen reader, contrast checklists
7. **Performance Testing:** Use Chrome DevTools Lighthouse and Performance panel

**All patterns include working code examples - copy and adapt as needed.**
