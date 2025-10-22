# Code Patterns & Conventions

## File Structure

```
/home/ahiya/mirror-of-dreams/
├── app/
│   ├── design-system/
│   │   └── page.tsx              # Component showcase page
│   └── [existing pages...]
├── components/
│   ├── ui/
│   │   └── glass/                # NEW: Design system components
│   │       ├── index.ts          # Barrel export
│   │       ├── GlassCard.tsx
│   │       ├── GlowButton.tsx
│   │       ├── CosmicLoader.tsx
│   │       ├── DreamCard.tsx
│   │       ├── GradientText.tsx
│   │       ├── GlassModal.tsx
│   │       ├── FloatingNav.tsx
│   │       ├── ProgressOrbs.tsx
│   │       ├── GlowBadge.tsx
│   │       └── AnimatedBackground.tsx
│   └── [existing components...]
├── lib/
│   ├── animations/               # NEW: Animation system
│   │   ├── variants.ts           # Framer Motion variants
│   │   ├── config.ts             # Animation configuration
│   │   └── hooks.ts              # Animation hooks
│   └── utils.ts                  # Existing utilities
├── types/
│   ├── glass-components.ts       # NEW: Glass component types
│   └── index.ts                  # Barrel export (extend)
├── styles/
│   ├── variables.css             # EXTEND: Add glass variables
│   ├── animations.css            # Keep existing
│   └── globals.css               # Keep existing
├── tailwind.config.ts            # EXTEND: Add mirror colors
└── package.json                  # ADD: framer-motion, lucide-react
```

---

## Naming Conventions

**Components:**
- PascalCase: `GlassCard.tsx`, `CosmicLoader.tsx`
- Prefix with purpose: `Glass*`, `Glow*`, `Cosmic*`

**Files:**
- Components: PascalCase matching component name
- Utilities: camelCase (`variants.ts`, `config.ts`)
- Types: kebab-case (`glass-components.ts`)

**Types/Interfaces:**
- PascalCase: `GlassCardProps`, `GlowButtonProps`
- Suffix with purpose: `*Props`, `*Config`, `*Variant`

**Functions:**
- camelCase: `useAnimationConfig()`, `getGlowIntensity()`
- Hooks prefix with `use`: `useReducedMotion()`

**Constants:**
- camelCase for objects: `easings`, `durations`
- SCREAMING_SNAKE_CASE for primitives: `MAX_BLUR_ELEMENTS`

**CSS Classes:**
- Tailwind utilities preferred
- Custom classes: kebab-case (`glass-card`, `glow-border`)

**Animation Variants:**
- camelCase: `cardVariants`, `glowVariants`
- Descriptive names: `staggerContainer`, `modalOverlayVariants`

---

## Component Structure Pattern

### Standard Glass Component Template

**When to use:** All design system components

**Code example:**

```typescript
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardVariants } from '@/lib/animations/variants';
import type { GlassCardProps } from '@/types/glass-components';

/**
 * GlassCard - A glass-morphism card with blur backdrop and glow effects
 *
 * @param variant - Visual style variant (default | elevated | inset)
 * @param glassIntensity - Blur intensity (subtle | medium | strong)
 * @param glowColor - Glow color theme (purple | blue | cosmic | electric)
 * @param hoverable - Enable hover animations
 * @param animated - Enable entrance animations
 * @param className - Additional Tailwind classes
 * @param children - Card content
 */
export function GlassCard({
  variant = 'default',
  glassIntensity = 'medium',
  glowColor = 'purple',
  hoverable = true,
  animated = true,
  className,
  children,
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  // Glass intensity mapping
  const blurClasses = {
    subtle: 'backdrop-blur-glass-sm',
    medium: 'backdrop-blur-glass',
    strong: 'backdrop-blur-glass-lg',
  };

  // Variant styling
  const variantClasses = {
    default: 'bg-white/5 border border-white/10',
    elevated: 'bg-white/8 border border-white/15 shadow-glow',
    inset: 'bg-white/3 border border-white/5 shadow-inner',
  };

  // Glow color mapping
  const glowClasses = {
    purple: 'hover:shadow-glow-lg hover:border-mirror-purple/30',
    blue: 'hover:shadow-glow-electric hover:border-mirror-blue/30',
    cosmic: 'hover:shadow-glow-lg hover:border-mirror-violet/30',
    electric: 'hover:shadow-glow-electric hover:border-mirror-cyan/30',
  };

  return (
    <motion.div
      variants={shouldAnimate ? cardVariants : undefined}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
      whileHover={hoverable && !prefersReducedMotion ? 'hover' : undefined}
      className={cn(
        // Base styles
        'rounded-xl p-6',
        // Glass effect
        blurClasses[glassIntensity],
        'backdrop-saturate-glass',
        // Variant
        variantClasses[variant],
        // Hover effects
        hoverable && glowClasses[glowColor],
        // Transitions
        'transition-all duration-300',
        // Custom classes
        className
      )}
    >
      {children}
    </motion.div>
  );
}
```

**Key points:**
- Always start with `'use client'` directive
- Import `useReducedMotion` for accessibility
- Use `cn()` utility for class merging
- Provide JSDoc comments for all props
- Support reduced motion with conditional animations
- Use semantic prop names (variant, intensity, etc.)
- Merge custom className last

---

## Animation Patterns

### Framer Motion Variants Pattern

**When to use:** Consistent animations across components

**Code example:**

```typescript
// lib/animations/variants.ts
import type { Variants } from 'framer-motion';

/**
 * Card entrance and hover animation
 */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1], // Custom easing
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Glow effect animation (box-shadow transition)
 */
export const glowVariants: Variants = {
  initial: {
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)',
  },
  hover: {
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
    transition: { duration: 0.3 },
  },
};

/**
 * Stagger children animation (for lists/grids)
 */
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

/**
 * Stagger child item
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/**
 * Modal overlay animation
 */
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Modal content animation (fade + scale)
 */
export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.2 },
  },
};

/**
 * Pulse glow animation (continuous)
 */
export const pulseGlowVariants: Variants = {
  initial: {
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
  },
  animate: {
    boxShadow: [
      '0 0 20px rgba(139, 92, 246, 0.3)',
      '0 0 40px rgba(139, 92, 246, 0.6)',
      '0 0 20px rgba(139, 92, 246, 0.3)',
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Rotate animation (for loaders)
 */
export const rotateVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
```

**Key points:**
- Export all variants from single file
- Use descriptive names
- Include JSDoc comments
- Use custom easing for branded feel
- Support reduced motion by conditionally applying variants

---

### Reduced Motion Pattern

**When to use:** All animated components (accessibility requirement)

**Code example:**

```typescript
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cardVariants } from '@/lib/animations/variants';

export function AnimatedComponent({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  // Disable animations if user prefers reduced motion
  const shouldAnimate = !prefersReducedMotion;

  return (
    <motion.div
      // Conditionally apply variants
      variants={shouldAnimate ? cardVariants : undefined}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
      whileHover={shouldAnimate ? 'hover' : undefined}
    >
      {children}
    </motion.div>
  );
}
```

**Key points:**
- Use `useReducedMotion()` hook from Framer Motion
- Set variants to `undefined` or `false` when motion is reduced
- Never force animations on users with motion sensitivity
- Test with Chrome DevTools (Cmd+Shift+P → "reduced motion")

---

### Stagger Animation Pattern

**When to use:** Lists, grids, multiple items appearing

**Code example:**

```typescript
'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';
import { GlassCard } from '@/components/ui/glass';

export function CardGrid({ items }: { items: Array<{ id: string; title: string }> }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-6"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={staggerItem}>
          <GlassCard>
            <h3>{item.title}</h3>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Key points:**
- Parent has `staggerContainer` variant
- Children have `staggerItem` variant
- No need to specify delay on children (handled by parent)
- Adjust `staggerChildren` value for timing

---

## Glass Effect Patterns

### Glass Card Pattern

**When to use:** Cards, containers, panels

**Code example:**

```typescript
// Basic glass card with Tailwind
<div className="
  bg-white/5
  backdrop-blur-glass
  backdrop-saturate-glass
  border border-white/10
  rounded-xl
  shadow-glow
  p-6
">
  {/* Content */}
</div>

// With hover effect
<div className="
  bg-white/5
  backdrop-blur-glass
  backdrop-saturate-glass
  border border-white/10
  rounded-xl
  shadow-glow
  hover:shadow-glow-lg
  hover:border-mirror-purple/30
  transition-all duration-300
  p-6
">
  {/* Content */}
</div>

// Strong glass effect
<div className="
  bg-white/8
  backdrop-blur-glass-lg
  backdrop-saturate-glass
  border border-white/15
  rounded-xl
  shadow-glow-lg
  p-6
">
  {/* Content */}
</div>
```

**Key points:**
- Always combine `bg-white/[opacity]` with `backdrop-blur-*`
- Add `backdrop-saturate-glass` for color enhancement
- Use subtle border `border-white/10`
- Include glow shadow for depth
- Add hover states for interactive elements

---

### Gradient Background Pattern

**When to use:** Hero sections, backgrounds, accents

**Code example:**

```typescript
// Cosmic gradient background
<div className="bg-gradient-cosmic p-8 rounded-xl">
  {/* Content */}
</div>

// Animated gradient background
<div className="relative overflow-hidden">
  <div className="
    absolute inset-0
    bg-gradient-dream
    animate-pulse-slow
    opacity-30
  " />
  <div className="relative z-10">
    {/* Content appears above gradient */}
  </div>
</div>

// Multiple gradient layers
<div className="relative">
  <div className="absolute inset-0 bg-gradient-cosmic opacity-50" />
  <div className="absolute inset-0 bg-gradient-dream opacity-30" />
  <div className="relative z-10 p-8">
    {/* Content */}
  </div>
</div>
```

**Key points:**
- Use `bg-gradient-*` utilities from Tailwind config
- Layer gradients with `absolute` positioning
- Control intensity with `opacity-*`
- Always set `relative z-10` on content

---

### Glow Effect Pattern

**When to use:** Buttons, badges, emphasis

**Code example:**

```typescript
// Static glow
<button className="
  bg-mirror-purple
  text-white
  px-6 py-3
  rounded-lg
  shadow-glow
">
  Click Me
</button>

// Hover glow
<button className="
  bg-mirror-purple
  text-white
  px-6 py-3
  rounded-lg
  shadow-glow
  hover:shadow-glow-lg
  transition-shadow duration-300
">
  Hover Me
</button>

// Animated pulse glow (with Framer Motion)
<motion.button
  className="
    bg-mirror-purple
    text-white
    px-6 py-3
    rounded-lg
  "
  variants={pulseGlowVariants}
  initial="initial"
  animate="animate"
>
  Pulsing Glow
</motion.button>
```

**Key points:**
- Use `shadow-glow*` utilities from Tailwind config
- Combine with `transition-shadow` for smooth hover
- For continuous pulse, use Framer Motion variants
- Match glow color to component color

---

## Button Patterns

### Primary Button (Gradient + Glow)

**When to use:** Primary actions, CTAs

**Code example:**

```typescript
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GlowButtonProps } from '@/types/glass-components';

export function GlowButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  disabled = false,
}: GlowButtonProps) {
  const variants = {
    primary: 'bg-gradient-primary text-white shadow-glow hover:shadow-glow-lg',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/15',
    ghost: 'bg-transparent text-mirror-purple hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base styles
        'rounded-lg font-medium',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Variant
        variants[variant],
        // Size
        sizes[size],
        // Custom
        className
      )}
    >
      {children}
    </motion.button>
  );
}
```

**Key points:**
- Use `whileHover` and `whileTap` for micro-interactions
- Support disabled state
- Provide size variants
- Use gradient backgrounds for primary
- Glass effect for secondary

---

## Modal Patterns

### Glass Modal with AnimatePresence

**When to use:** Dialogs, overlays, popups

**Code example:**

```typescript
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalOverlayVariants, modalContentVariants } from '@/lib/animations/variants';
import { GlassCard } from '@/components/ui/glass';
import type { GlassModalProps } from '@/types/glass-components';

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
}: GlassModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="
              fixed inset-0 z-50
              bg-mirror-dark/80
              backdrop-blur-glass
            "
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GlassCard variant="elevated" className="relative">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="
                    absolute top-4 right-4
                    p-2 rounded-lg
                    bg-white/10 hover:bg-white/20
                    transition-colors
                  "
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Title */}
                {title && (
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {title}
                  </h2>
                )}

                {/* Content */}
                <div className="text-white/80">
                  {children}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Key points:**
- Wrap in `AnimatePresence` for exit animations
- Use overlay + content structure
- Stop propagation on content click
- Include close button with ARIA label
- Use fixed positioning for overlay
- Add backdrop-blur to overlay for depth

---

## Icon Patterns

### Lucide Icons with Framer Motion

**When to use:** Interactive icons, animated UI elements

**Code example:**

```typescript
import { motion } from 'framer-motion';
import { Sparkles, Moon, Star } from 'lucide-react';

// Static icon
<Sparkles className="w-6 h-6 text-mirror-purple" />

// Animated on hover
<motion.div whileHover={{ scale: 1.2, rotate: 15 }}>
  <Star className="w-8 h-8 text-yellow-400" />
</motion.div>

// Continuous rotation
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
>
  <Moon className="w-10 h-10 text-mirror-blue" />
</motion.div>

// With glow effect
<Sparkles className="w-6 h-6 text-mirror-purple drop-shadow-glow" />

// Icon button
<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  className="
    p-3 rounded-lg
    bg-white/10 hover:bg-white/20
    transition-colors
  "
>
  <Sparkles className="w-5 h-5 text-white" />
</motion.button>
```

**Key points:**
- Import only icons you need (tree-shaking)
- Use Tailwind for sizing (`w-*`, `h-*`)
- Wrap in `motion.div` for animations
- Add glow with `drop-shadow-*` utilities

---

## TypeScript Patterns

### Component Props Interface

**When to use:** All component prop definitions

**Code example:**

```typescript
// types/glass-components.ts
import { ReactNode } from 'react';

/**
 * Base props shared by all glass components
 */
export interface GlassBaseProps {
  /** Additional Tailwind classes */
  className?: string;
  /** Glass blur intensity */
  glassIntensity?: 'subtle' | 'medium' | 'strong';
  /** Glow color theme */
  glowColor?: 'purple' | 'blue' | 'cosmic' | 'electric';
  /** Enable entrance animations */
  animated?: boolean;
}

/**
 * Props for GlassCard component
 */
export interface GlassCardProps extends GlassBaseProps {
  /** Visual style variant */
  variant?: 'default' | 'elevated' | 'inset';
  /** Enable hover animations */
  hoverable?: boolean;
  /** Card content */
  children: ReactNode;
}

/**
 * Props for GlowButton component
 */
export interface GlowButtonProps extends GlassBaseProps {
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Button content */
  children: ReactNode;
}
```

**Key points:**
- Use JSDoc comments for all props
- Extend base interfaces for shared props
- Use union types for variants
- Mark optional props with `?`
- Always type `children` as `ReactNode`

---

## Import Order Convention

**Standard import order for all components:**

```typescript
// 1. React core
import { ReactNode, useState, useEffect } from 'react';

// 2. Next.js
import { useRouter } from 'next/navigation';

// 3. Third-party libraries
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// 4. Internal utilities
import { cn } from '@/lib/utils';

// 5. Internal animations
import { cardVariants, glowVariants } from '@/lib/animations/variants';

// 6. Internal components
import { GlassCard } from '@/components/ui/glass';

// 7. Types
import type { GlassCardProps } from '@/types/glass-components';

// 8. Styles (if needed, rarely)
import styles from './Component.module.css';
```

**Key points:**
- Group imports by source
- React first, styles last
- Use `type` keyword for type-only imports
- Alphabetize within groups (optional)

---

## Accessibility Patterns

### Keyboard Navigation

**When to use:** All interactive components

**Code example:**

```typescript
'use client';

import { useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';

export function AccessibleButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Activate on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        'px-6 py-3 rounded-lg cursor-pointer',
        'bg-mirror-purple text-white',
        'transition-all duration-300',
        // Focus visible (not on mouse click)
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-purple focus-visible:ring-offset-2',
        // Hover state
        'hover:shadow-glow-lg'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}
```

**Key points:**
- Add `role="button"` for semantic HTML
- Set `tabIndex={0}` for keyboard focus
- Handle `Enter` and `Space` keys
- Use `focus-visible:` for keyboard-only focus styles
- Include ARIA labels where needed

---

### ARIA Labels Pattern

**When to use:** Icon buttons, complex components

**Code example:**

```typescript
import { X, Menu } from 'lucide-react';

// Icon-only button needs label
<button
  onClick={onClose}
  aria-label="Close modal"
  className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
>
  <X className="w-5 h-5" />
</button>

// Menu button
<button
  onClick={toggleMenu}
  aria-label="Open menu"
  aria-expanded={isOpen}
  className="p-2 rounded-lg"
>
  <Menu className="w-6 h-6" />
</button>

// With aria-describedby
<button
  onClick={handleAction}
  aria-label="Delete dream"
  aria-describedby="delete-warning"
>
  Delete
</button>
<p id="delete-warning" className="sr-only">
  This action cannot be undone
</p>
```

**Key points:**
- All icon buttons need `aria-label`
- Use `aria-expanded` for toggles
- Use `aria-describedby` for additional context
- Use `sr-only` class for screen reader only text

---

## Performance Patterns

### Lazy Loading Heavy Components

**When to use:** Large animations, heavy components

**Code example:**

```typescript
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load CosmicLoader (heavy animation)
const CosmicLoader = dynamic(
  () => import('@/components/ui/glass').then((mod) => mod.CosmicLoader),
  {
    ssr: false,
    loading: () => <div className="animate-pulse">Loading...</div>,
  }
);

export function HeavyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CosmicLoader />
    </Suspense>
  );
}
```

**Key points:**
- Use `dynamic()` from Next.js
- Set `ssr: false` for client-only components
- Provide loading fallback
- Wrap in Suspense for React 18 support

---

### Performance Optimization Tips

**Always:**
- Use `will-change: transform` during animations only
- Prefer `transform` and `opacity` over layout properties
- Limit simultaneous backdrop-filter elements (max 3-4)
- Test on mobile with CPU throttling

**Code example:**

```typescript
// Good: Transform and opacity
<motion.div
  animate={{ opacity: 1, y: 0 }}
  style={{ willChange: 'transform, opacity' }}
/>

// Avoid: Width/height animations (causes layout shift)
<motion.div
  animate={{ width: '100%', height: '200px' }} // ❌ Causes reflow
/>

// Better: Scale instead of width/height
<motion.div
  animate={{ scale: 1 }} // ✅ Uses transform
/>
```

---

## Testing Patterns

### Component Showcase Pattern

**When to use:** Testing all component variants

**Code example:**

```typescript
// app/design-system/page.tsx
'use client';

import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  GlowBadge,
} from '@/components/ui/glass';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-mirror-dark p-8 space-y-12">
      {/* Glass Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Glass Cards</h2>
        <div className="grid grid-cols-3 gap-6">
          <GlassCard variant="default">
            <h3 className="text-lg font-semibold text-white">Default</h3>
            <p className="text-white/70">Standard glass card</p>
          </GlassCard>

          <GlassCard variant="elevated">
            <h3 className="text-lg font-semibold text-white">Elevated</h3>
            <p className="text-white/70">Card with shadow glow</p>
          </GlassCard>

          <GlassCard variant="inset">
            <h3 className="text-lg font-semibold text-white">Inset</h3>
            <p className="text-white/70">Card with inner shadow</p>
          </GlassCard>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Glow Buttons</h2>
        <div className="flex gap-4">
          <GlowButton variant="primary">Primary</GlowButton>
          <GlowButton variant="secondary">Secondary</GlowButton>
          <GlowButton variant="ghost">Ghost</GlowButton>
        </div>
      </section>

      {/* Gradient Text */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Gradient Text</h2>
        <GradientText gradient="cosmic" className="text-4xl font-bold">
          Cosmic Gradient
        </GradientText>
      </section>

      {/* Loaders */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Cosmic Loader</h2>
        <CosmicLoader />
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Glow Badges</h2>
        <div className="flex gap-4">
          <GlowBadge variant="success">Success</GlowBadge>
          <GlowBadge variant="warning">Warning</GlowBadge>
          <GlowBadge variant="error">Error</GlowBadge>
          <GlowBadge variant="info">Info</GlowBadge>
        </div>
      </section>
    </div>
  );
}
```

**Key points:**
- Test all variants in one page
- Group by component type
- Use real content, not Lorem Ipsum
- Add headings for organization
- Test on multiple screen sizes

---

## Code Quality Standards

**Component Standards:**
- Every component has 'use client' directive (if using Framer Motion)
- All props have TypeScript interfaces
- JSDoc comments for all public props
- Reduced motion support via `useReducedMotion()`
- Keyboard navigation for interactive elements
- ARIA labels for icon buttons

**Styling Standards:**
- Use Tailwind utilities first
- Custom classes only when necessary
- Merge classes with `cn()` utility
- Support hover/focus states
- Use semantic color names (mirror-*, not #hex)

**Animation Standards:**
- Import variants from `lib/animations/variants.ts`
- Support reduced motion
- Use `will-change` sparingly
- Test performance on mobile
- Prefer transform/opacity over layout props

**Accessibility Standards:**
- WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- Keyboard navigation (Enter/Space activation)
- Screen reader support (ARIA labels)
- Reduced motion support
- Focus indicators visible

**File Organization Standards:**
- One component per file
- File name matches component name
- Barrel export from index.ts
- Types in types/glass-components.ts
- Animations in lib/animations/

---

This patterns document provides copy-pasteable examples for every major pattern builders will need. All code is production-ready and follows established conventions.
