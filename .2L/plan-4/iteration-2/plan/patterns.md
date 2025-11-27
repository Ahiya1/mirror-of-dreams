# Code Patterns & Conventions - Restraint Edition

This document provides **copy-pasteable code patterns** for establishing restraint and substance throughout Mirror of Dreams.

---

## Earned Beauty Guidelines

### What Makes Beauty "Earned"?

**Earned Beauty (KEEP):**
- Serves a functional purpose (clarity, feedback, hierarchy)
- Aids user understanding or interaction
- Creates depth that improves readability
- Indicates system state or user action

**Decorative Flash (REMOVE):**
- Exists only for visual appeal
- Distracts from content
- Animates without purpose
- Adds noise instead of signal

### Decision Framework

When evaluating a visual element, ask:

1. **Does it communicate information?** (e.g., active state, progress)
2. **Does it aid recognition?** (e.g., category icons)
3. **Does it guide interaction?** (e.g., hover feedback)
4. **Does it improve readability?** (e.g., glass depth, contrast)

If YES to any: **Earned beauty - keep it.**
If NO to all: **Decorative flash - remove it.**

---

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── dashboard/
│   │   └── page.tsx                    # Dashboard main page
│   ├── auth/
│   │   ├── signin/page.tsx            # Sign-in page
│   │   └── signup/page.tsx            # Sign-up page
│   ├── reflection/
│   │   └── MirrorExperience.tsx       # Reflection flow
│   └── page.tsx                        # Landing page
├── components/
│   ├── dashboard/
│   │   ├── cards/                     # Dashboard card components
│   │   └── shared/
│   │       └── WelcomeSection.tsx     # Greeting component
│   ├── ui/
│   │   └── glass/                     # Glass component library
│   └── icons/
│       └── DreamCategoryIcon.tsx      # NEW: Icon component
├── lib/
│   └── animations/
│       └── variants.ts                # Framer Motion variants
├── styles/
│   ├── globals.css                    # Global styles
│   ├── animations.css                 # Animation utilities
│   └── mirror.css                     # Glass effects
└── types/
    └── schemas.ts                     # Type definitions
```

---

## Naming Conventions

**Components:** PascalCase (`WelcomeSection.tsx`, `DreamCard.tsx`)
**Files:** camelCase for utilities (`formatCurrency.ts`)
**Types:** PascalCase (`DreamCategory`, `ReflectionTone`)
**Functions:** camelCase (`calculateUsage()`, `formatGreeting()`)
**Constants:** SCREAMING_SNAKE_CASE (`MAX_EMOJIS_PER_PAGE`)
**CSS Classes:** kebab-case (`.crystal-glass`, `.button-primary`)

---

## Greeting Pattern (WelcomeSection)

### Simple Time-Based Greeting

**When to use:** Dashboard greeting, welcome messages

**BEFORE (Mystical - 258 lines):**
```typescript
const getGreeting = useMemo(() => {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  if (hour >= 4 && hour < 6) return 'Early morning wisdom';
  if (hour >= 6 && hour < 12) {
    if (isWeekend) return hour < 9 ? 'Peaceful morning' : 'Good morning';
    return hour < 8 ? 'Rise and shine' : 'Good morning';
  }
  // ... many more conditions
  return 'Deep night wisdom';
}, []);
```

**AFTER (Simple - 8 lines):**
```typescript
const getGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good evening'; // Late night defaults to evening
};
```

**Complete WelcomeSection Pattern:**
```typescript
// components/dashboard/shared/WelcomeSection.tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export default function WelcomeSection() {
  const { user } = useAuth();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || user?.name || 'there';

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-light text-white">
        {getGreeting()}, {firstName}
      </h1>
    </div>
  );
}
```

**Key points:**
- No mystical greetings ("Deep night wisdom")
- No weekend variations (unnecessary complexity)
- Simple fallback if no user name
- Clean, focused component (~15 lines vs 258)

---

## Button Patterns

### Primary Button (Restrained)

**When to use:** Main call-to-action (e.g., "Reflect Now")

**BEFORE (Decorative):**
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-glow"
>
  ✨ Reflect Now
</motion.button>
```

**AFTER (Restrained):**
```tsx
<button className="
  px-8 py-4
  text-xl font-medium
  bg-mirror-amethyst
  text-white
  rounded-lg
  transition-opacity duration-200
  hover:opacity-90
  active:opacity-85
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Reflect Now
</button>
```

**Key points:**
- NO emoji decoration
- NO scale animations
- Simple opacity change for hover
- Large size (px-8 py-4, text-xl) establishes dominance
- Disabled state clearly indicated

### Secondary Button

**When to use:** Supporting actions (e.g., "View Reports")

```tsx
<button className="
  px-4 py-2
  text-base font-medium
  bg-transparent
  text-mirror-amethyst
  border border-mirror-amethyst
  rounded-lg
  transition-all duration-200
  hover:bg-mirror-amethyst/10
  active:bg-mirror-amethyst/20
">
  View Reports
</button>
```

**Key points:**
- Smaller than primary (px-4 py-2, text-base)
- Transparent background (less prominent)
- Border indicates interactivity
- Subtle background on hover (earned feedback)

### Ghost Button

**When to use:** Tertiary actions (e.g., navigation links)

```tsx
<button className="
  px-3 py-1.5
  text-sm font-normal
  bg-transparent
  text-gray-300
  rounded
  transition-colors duration-200
  hover:text-mirror-amethyst-light
">
  Cancel
</button>
```

---

## Glass Component Patterns

### GlassCard (Simplified)

**When to use:** Container with depth (dashboard cards, modals)

**BEFORE (Complex - 3 variants, 4 glow colors, breathing):**
```tsx
<GlassCard
  variant="elevated"
  glowColor="cosmic"
  hoverable={true}
  animated={true}
/>
```

**AFTER (Simplified - boolean props only):**
```tsx
// components/ui/glass/GlassCard.tsx
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  className?: string;
}

export function GlassCard({
  children,
  elevated = false,
  interactive = false,
  className = ''
}: GlassCardProps) {
  return (
    <div
      className={`
        backdrop-blur-crystal
        bg-gradient-to-br from-white/8 via-transparent to-purple-500/3
        border border-white/10
        rounded-xl
        ${elevated ? 'shadow-lg border-white/15' : ''}
        ${interactive ? 'transition-transform duration-250 hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

**Usage:**
```tsx
// Regular card
<GlassCard>
  <p>Content here</p>
</GlassCard>

// Elevated card (e.g., active dream)
<GlassCard elevated>
  <p>Active dream content</p>
</GlassCard>

// Interactive card (e.g., clickable)
<GlassCard interactive onClick={handleClick}>
  <p>Click me</p>
</GlassCard>
```

**Key points:**
- NO `variant` enum (just `elevated` boolean)
- NO `glowColor` prop (decorative)
- NO `breathe-slow` animation (decorative)
- Hover lift is subtle (-translate-y-0.5 = 2px, not 4px)
- NO scale effect

### Button Component (No Framer Motion)

**BEFORE (Decorative):**
```tsx
// components/ui/glass/GlowButton.tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="amethyst-breathing"
>
  {children}
</motion.button>
```

**AFTER (CSS-only):**
```tsx
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Button({
  variant,
  children,
  disabled = false,
  onClick,
  className = ''
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-opacity duration-200';

  const variantStyles = {
    primary: 'px-8 py-4 text-xl bg-mirror-amethyst text-white hover:opacity-90',
    secondary: 'px-4 py-2 text-base bg-transparent text-mirror-amethyst border border-mirror-amethyst hover:bg-mirror-amethyst/10',
    ghost: 'px-3 py-1.5 text-sm bg-transparent text-gray-300 hover:text-mirror-amethyst-light',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
```

**Usage:**
```tsx
import { Button } from '@/components/ui/Button';

// Primary action
<Button variant="primary" onClick={handleReflect}>
  Reflect Now
</Button>

// Secondary action
<Button variant="secondary" onClick={handleViewReports}>
  View Reports
</Button>

// Ghost action
<Button variant="ghost" onClick={handleCancel}>
  Cancel
</Button>
```

---

## Animation Patterns

### Page Transition (Framer Motion - KEEP)

**When to use:** Navigating between pages

```tsx
// app/dashboard/page.tsx
'use client';

import { motion } from 'framer-motion';

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Dashboard />
    </motion.div>
  );
}
```

**Key points:**
- Fade only (no scale, no y-offset)
- 300ms duration (fast but not instant)
- Use for page-level transitions only

### Card Entrance (Stagger - SIMPLIFIED)

**When to use:** Dashboard cards appearing on load

**BEFORE (Complex stagger):**
```tsx
const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 150,
  duration: 800,
  triggerOnce: true,
});
```

**AFTER (Simplified stagger):**
```tsx
// hooks/useStaggerAnimation.ts (updated)
const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 80,        // Reduced from 150ms
  duration: 300,    // Reduced from 800ms
  triggerOnce: true,
});
```

**Usage:**
```tsx
<div ref={containerRef}>
  {cards.map((card, index) => (
    <motion.div
      key={card.id}
      style={getItemStyles(index)}
      className="dashboard-card"
    >
      {card.content}
    </motion.div>
  ))}
</div>
```

**Key points:**
- Reduce delay: 150ms → 80ms
- Reduce duration: 800ms → 300ms
- Keep stagger pattern (legitimate page transition)

### Hover States (CSS Only - NO Framer Motion)

**When to use:** Button hover, card hover, link hover

```tsx
// Button hover (opacity change)
<button className="transition-opacity duration-200 hover:opacity-90">
  Click Me
</button>

// Card hover (subtle lift)
<div className="transition-transform duration-250 hover:-translate-y-0.5">
  Card content
</div>

// Link hover (color change)
<a className="transition-colors duration-200 hover:text-mirror-amethyst">
  View Details
</a>
```

**Key points:**
- Use CSS transitions, not Framer Motion
- Duration: 200-250ms
- NO scale effects
- Subtle changes only (opacity, position, color)

### Loading States (Spinner - KEEP)

**When to use:** Data fetching, form submission

```tsx
// components/ui/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="
        w-8 h-8
        border-4 border-mirror-amethyst/30
        border-t-mirror-amethyst
        rounded-full
        animate-spin
      " />
    </div>
  );
}
```

**Key points:**
- Simple CSS spinner (no complex animation library)
- Use `animate-spin` utility from Tailwind
- Functional animation (indicates loading state)

---

## Icon Patterns

### Functional Category Icons

**When to use:** Dream categories, dream status

```tsx
// components/icons/DreamCategoryIcon.tsx
import { DreamCategory } from '@/types/schemas';

const CATEGORY_ICONS: Record<DreamCategory, string> = {
  health: '🏃',
  career: '💼',
  relationships: '❤️',
  financial: '💰',
  personal_growth: '🌱',
  creative: '🎨',
  spiritual: '🙏',
  adventure: '🚀',
  learning: '📚',
  other: '⭐',
};

interface DreamCategoryIconProps {
  category: DreamCategory;
  className?: string;
}

export function DreamCategoryIcon({ category, className = '' }: DreamCategoryIconProps) {
  return (
    <span
      className={`text-xl ${className}`}
      role="img"
      aria-label={category}
    >
      {CATEGORY_ICONS[category]}
    </span>
  );
}
```

**Usage:**
```tsx
import { DreamCategoryIcon } from '@/components/icons/DreamCategoryIcon';

<div className="flex items-center gap-2">
  <DreamCategoryIcon category="health" />
  <span>Health & Fitness</span>
</div>
```

**Key points:**
- Centralized icon mapping
- Accessibility (role="img", aria-label)
- Easy to swap emoji for SVG later
- Functional only (aids recognition)

### Password Toggle (SVG - NOT Emoji)

**When to use:** Auth pages, password inputs

```tsx
// components/ui/PasswordToggle.tsx
interface PasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export function PasswordToggle({ visible, onToggle }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="
        p-2
        text-gray-400
        hover:text-gray-300
        transition-colors duration-200
      "
      aria-label={visible ? 'Hide password' : 'Show password'}
    >
      {visible ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}
```

**Usage:**
```tsx
const [showPassword, setShowPassword] = useState(false);

<div className="relative">
  <input
    type={showPassword ? 'text' : 'password'}
    className="pr-12 w-full"
  />
  <div className="absolute right-2 top-1/2 -translate-y-1/2">
    <PasswordToggle
      visible={showPassword}
      onToggle={() => setShowPassword(!showPassword)}
    />
  </div>
</div>
```

**Key points:**
- SVG icons, NOT emoji (👁️🙈)
- Accessible (aria-label)
- Simple hover feedback (color change)
- Professional appearance

---

## Copy Patterns

### Landing Page Taglines

**BEFORE (Flowery):**
```tsx
<h1>Your dreams hold the mirror to who you're becoming.</h1>
<p>Start completely free. 90-second guided setup.</p>
```

**AFTER (Direct):**
```tsx
<h1 className="text-5xl font-light text-white mb-4">
  Reflect. Understand. Evolve.
</h1>
<p className="text-xl text-gray-300">
  Free to start.
</p>
```

### Auth Page Copy

**BEFORE (Marketing):**
```tsx
<h2>Welcome Back</h2>
<p>Continue your journey of self-discovery</p>
<button>Continue Your Journey</button>
```

**AFTER (Clear):**
```tsx
<h2 className="text-3xl font-light text-white mb-2">
  Welcome Back
</h2>
{/* Remove subheading entirely OR */}
<p className="text-gray-400 mb-8">
  Sign in to your account
</p>
<button className="...">
  Sign In
</button>
```

### Dashboard Welcome Messages

**BEFORE (Mystical):**
```tsx
const getMessage = () => {
  if (reflectionCount === 0) {
    return "Your journey of consciousness awaits...";
  }
  return "Your consciousness journey deepens with each reflection...";
};
```

**AFTER (Specific):**
```tsx
const getMessage = (reflectionCount: number, limit: number) => {
  if (reflectionCount === 0) {
    return "Create your first reflection";
  }
  return `You have ${reflectionCount} reflection${reflectionCount !== 1 ? 's' : ''} this month`;
};
```

### Forbidden Words Pattern

**Create a validation helper:**
```typescript
// lib/utils/copyValidation.ts
const FORBIDDEN_WORDS = [
  'sacred',
  'journey',
  'consciousness',
  'transform',
  'unlock',
  'reveal',
  'embrace',
  'embark',
  'weaving',
  'mystical',
  'soul',
];

export function validateCopy(text: string): { valid: boolean; violations: string[] } {
  const violations = FORBIDDEN_WORDS.filter(word =>
    text.toLowerCase().includes(word)
  );

  return {
    valid: violations.length === 0,
    violations,
  };
}

// Usage in development
if (process.env.NODE_ENV === 'development') {
  const result = validateCopy("Start your sacred journey");
  if (!result.valid) {
    console.warn('Copy validation failed:', result.violations);
  }
}
```

---

## Form Patterns

### Reflection Question Placeholders

**BEFORE (Mystical):**
```tsx
<textarea placeholder="Describe the vision that calls to your soul..." />
```

**AFTER (Direct):**
```tsx
<textarea
  placeholder="Describe your dream in detail..."
  className="w-full p-4 bg-white/5 border border-white/10 rounded-lg"
/>
```

### Tone Selection (No Emojis)

**BEFORE (Emoji-based):**
```tsx
<button className={toneClass}>
  ⚡ Sacred Fusion
  <p>Balanced wisdom and warmth</p>
</button>
```

**AFTER (Color-coded):**
```tsx
<button className={`
  p-4 rounded-lg border-2
  transition-all duration-200
  ${tone === 'fusion'
    ? 'border-purple-500 bg-purple-500/10'
    : 'border-white/10 bg-white/5'
  }
  hover:border-purple-400
`}>
  <span className="text-lg font-medium">Fusion</span>
  <p className="text-sm text-gray-400 mt-1">Balanced and thoughtful</p>
</button>
```

**Key points:**
- NO emojis (⚡🌸🔥)
- Border color indicates selection (earned feedback)
- Descriptive text is direct ("thoughtful" not "wisdom and warmth")

---

## Usage Display Pattern

### Simple Monthly Usage

**BEFORE (Complex - progress ring, percentages, infinity symbols):**
```tsx
<ProgressRing percentage={usagePercent} />
<div>
  <span>{used}</span> / <span>{limit === 'unlimited' ? '∞' : limit}</span>
  <p>Building momentum beautifully</p>
</div>
```

**AFTER (Simple text):**
```tsx
<div className="text-center">
  <p className="text-2xl font-light text-white">
    {used} / {limit === 'unlimited' ? '∞' : limit} reflections this month
  </p>
</div>
```

**Key points:**
- NO progress ring (visual noise)
- NO percentage display (confusing)
- NO mystical messaging ("momentum beautifully")
- Simple count is clearest

---

## Import Order Convention

```typescript
// 1. React core
import { useState, useEffect, useMemo } from 'react';

// 2. Next.js
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 3. External libraries (alphabetical)
import { motion } from 'framer-motion';

// 4. Internal components (alphabetical)
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/glass/GlassCard';

// 5. Hooks
import { useAuth } from '@/lib/hooks/useAuth';

// 6. Utilities
import { formatGreeting } from '@/lib/utils/format';

// 7. Types
import type { Dream, Reflection } from '@/types/schemas';

// 8. Styles (last)
import styles from './Component.module.css';
```

---

## Code Quality Standards

### TypeScript Strictness

```typescript
// ALWAYS define prop types
interface ComponentProps {
  required: string;
  optional?: number;
  children?: ReactNode;
}

// NEVER use `any`
// BAD
const handleClick = (data: any) => { };

// GOOD
const handleClick = (data: ReflectionData) => { };

// Use union types for variants
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
```

### Accessibility

```tsx
// Images need alt text
<img src="..." alt="Descriptive text" />

// Interactive elements need labels
<button aria-label="Close modal" onClick={handleClose}>
  <XIcon />
</button>

// Form inputs need labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Use semantic HTML
<nav>...</nav>
<main>...</main>
<article>...</article>
```

---

## Testing Patterns (Manual Validation)

### Emoji Count Validation

```bash
# Count emojis in a file
rg -o "[\u{1F000}-\u{1F9FF}]" app/dashboard/page.tsx | wc -l

# Find decorative emojis in buttons
rg "✨|💎|🌱|🦋|🏔️" --type tsx

# List all emoji usage
rg "[\u{1F000}-\u{1F9FF}]" app/ -l
```

### Copy Validation

```bash
# Find forbidden words
rg -i "sacred|consciousness|journey|mystical|unlock|reveal|embrace|embark|weaving" --type tsx

# Find marketing phrases
rg "self-discovery|inner landscape|deep wisdom|transformation" --type tsx

# Verify vision tagline
rg "Reflect. Understand. Evolve." app/
```

### Animation Validation

```bash
# Find scale effects
rg "scale: 1\.|whileHover.*scale|whileTap.*scale" --type tsx

# Find continuous animations
rg "repeat: Infinity" --type tsx

# Find breathing classes
rg "breathe|pulse-glow|float|bob" --type tsx
```

---

## Performance Patterns

### Reduce Animation CPU Usage

**BEFORE (Continuous animation - high CPU):**
```tsx
<motion.div
  animate={{
    scale: [1, 1.15, 1.05],
    opacity: [0.9, 1, 0.95],
  }}
  transition={{ duration: 2.5, repeat: Infinity }}
/>
```

**AFTER (Static state - no CPU):**
```tsx
<div className="opacity-90">
  Content
</div>
```

**Key points:**
- Remove all `repeat: Infinity` from foreground elements
- Background atmospheric layers can keep slow animations (20s+)
- Prefer CSS transitions over JS animations for hover states

---

## Security Patterns

**No security changes needed for iteration 2.**

Focus is UI/UX only:
- No API changes
- No authentication logic changes
- No database queries changed
- Keep existing security patterns

---

## Summary of Key Patterns

**Button Pattern:**
- Primary: Large, solid color, opacity hover, NO emoji
- Secondary: Medium, border, background hover
- Ghost: Small, text-only, color hover

**Animation Pattern:**
- Framer Motion: Page transitions only (300ms fade)
- CSS Transitions: Hover states (200-250ms)
- NO scale effects anywhere
- NO continuous animations on foreground

**Copy Pattern:**
- Direct: "Reflections" not "journey"
- Specific: "8 reflections" not "weaving patterns"
- Honest: Only promise what you deliver

**Icon Pattern:**
- Functional emojis: Dream categories/status only
- UI controls: SVG icons (password toggle, navigation)
- NO decorative emojis in buttons/badges

**Glass Pattern:**
- Keep multi-layer gradients (functional depth)
- Remove decorative glows (breathing, pulsing)
- Simple boolean props (`elevated`, `interactive`)

**Import Pattern:**
- React → Next → Libraries → Components → Hooks → Utils → Types → Styles

---

**Use these patterns consistently across all builders to maintain cohesive restraint.**
