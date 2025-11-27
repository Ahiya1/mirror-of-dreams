# Code Patterns & Conventions - Iteration 5

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── layout.tsx              # Root layout (add skip link here)
│   ├── template.tsx            # Page transitions (already implemented)
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx
│   └── reflection/
│       └── MirrorExperience.tsx
├── components/
│   ├── ui/glass/               # Glass morphism components
│   │   ├── GlowButton.tsx      # MODIFY: Add semantic variants, 200ms transitions
│   │   ├── GlassCard.tsx       # MODIFY: Enhance hover states
│   │   ├── GlassInput.tsx      # MODIFY: Add error/success animations
│   │   ├── GlassModal.tsx      # MODIFY: Add focus trap
│   │   └── GlowBadge.tsx       # MODIFY: Use semantic colors
│   ├── shared/
│   │   └── AppNavigation.tsx   # MODIFY: Add ARIA labels, keyboard nav
│   └── ui/
│       └── PasswordToggle.tsx  # Already has aria-label
├── styles/
│   ├── globals.css             # ADD: Semantic utility classes
│   └── animations.css          # ADD: Shake, checkmark keyframes
├── lib/
│   └── animations/
│       └── variants.ts         # Existing Framer Motion variants
├── types/
│   └── glass-components.ts     # UPDATE: Add semantic variants
└── tailwind.config.ts          # Existing mirror.* colors
```

---

## Naming Conventions

- **Components:** PascalCase (`GlowButton.tsx`, `GlassModal.tsx`)
- **Files:** camelCase for utilities (`formatCurrency.ts`)
- **Types:** PascalCase (`GlowButtonProps`, `SemanticVariant`)
- **Functions:** camelCase (`handleUserDropdownToggle()`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- **CSS Classes:** kebab-case (`animate-shake`, `status-box-success`)
- **Tailwind Utilities:** kebab-case (`bg-semantic-success-light`)

---

## Button Micro-Interactions Pattern

### Pattern: Enhanced Button States (200ms transitions)

**When to use:** All GlowButton variants (primary, secondary, ghost, cosmic)

**Code Example:**

```tsx
// components/ui/glass/GlowButton.tsx

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cosmic' | 'success' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const buttonVariants = {
  primary: cn(
    'bg-mirror-amethyst text-white',
    'hover:bg-mirror-amethyst-bright hover:-translate-y-0.5',
    'active:scale-[0.98] active:bg-mirror-amethyst-deep',
    'transition-all duration-200', // CHANGED: 300ms → 200ms
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-amethyst focus-visible:ring-offset-2'
  ),

  secondary: cn(
    'text-mirror-amethyst border border-mirror-amethyst bg-transparent',
    'hover:bg-mirror-amethyst/10 hover:border-mirror-amethyst-bright hover:-translate-y-0.5',
    'active:scale-[0.98] active:bg-mirror-amethyst/20',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-amethyst focus-visible:ring-offset-2'
  ),

  ghost: cn(
    'text-gray-300 bg-transparent',
    'hover:text-mirror-amethyst-bright hover:bg-white/5',
    'active:scale-[0.98] active:bg-white/10',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2'
  ),

  cosmic: cn(
    'bg-gradient-to-br from-mirror-amethyst/15 via-mirror-amethyst-deep/12 to-mirror-amethyst/15',
    'border border-mirror-amethyst/30',
    'hover:from-mirror-amethyst/22 hover:via-mirror-amethyst-deep/18 hover:to-mirror-amethyst/22',
    'hover:border-mirror-amethyst/45 hover:-translate-y-0.5',
    'hover:shadow-[0_12px_35px_rgba(124,58,237,0.2)]',
    'active:scale-[0.98]',
    'before:absolute before:inset-0',
    'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
    'before:-translate-x-full before:transition-transform before:duration-500',
    'hover:before:translate-x-full',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-amethyst focus-visible:ring-offset-2'
  ),

  // NEW: Semantic variants
  success: cn(
    'bg-mirror-success text-white',
    'hover:bg-mirror-success/90 hover:-translate-y-0.5',
    'active:scale-[0.98] active:bg-mirror-success/80',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-success focus-visible:ring-offset-2'
  ),

  danger: cn(
    'bg-mirror-error text-white',
    'hover:bg-mirror-error/90 hover:-translate-y-0.5',
    'active:scale-[0.98] active:bg-mirror-error/80',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-error focus-visible:ring-offset-2'
  ),

  info: cn(
    'bg-mirror-info text-white',
    'hover:bg-mirror-info/90 hover:-translate-y-0.5',
    'active:scale-[0.98] active:bg-mirror-info/80',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-info focus-visible:ring-offset-2'
  ),
};

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ variant = 'primary', className, children, disabled, isLoading, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants[variant],
          'px-6 py-3 rounded-lg font-medium',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

GlowButton.displayName = 'GlowButton';
```

**Key Points:**
- All variants have 200ms transitions (reduced from 300ms)
- Active states use `scale-[0.98]` for tactile feedback
- Hover states include `-translate-y-0.5` for subtle lift
- Focus states use `focus-visible:ring-2` for keyboard navigation
- Disabled state uses `opacity-50` and `cursor-not-allowed`
- Loading state prevents double-click and shows spinner

**Usage:**
```tsx
// Primary action
<GlowButton variant="primary" onClick={handleSubmit}>
  Create Reflection
</GlowButton>

// Success confirmation
<GlowButton variant="success" onClick={handleSave}>
  Save Changes
</GlowButton>

// Destructive action
<GlowButton variant="danger" onClick={handleDelete}>
  Delete Dream
</GlowButton>

// Loading state
<GlowButton variant="primary" isLoading={isSubmitting}>
  Submit
</GlowButton>
```

---

## Card Hover Pattern

### Pattern: Consistent Card Interactions

**When to use:** All interactive cards (DreamCard, ReflectionCard, GlassCard with onClick)

**Code Example:**

```tsx
// components/ui/glass/GlassCard.tsx

import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({
  elevated = false,
  interactive = false,
  children,
  className,
  onClick,
  ...props
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        'bg-white/5 backdrop-blur-crystal border border-white/10 rounded-2xl p-8',

        // Elevated variant
        elevated && 'shadow-amethyst-mid',

        // Interactive states
        interactive && [
          'cursor-pointer',
          'transition-all duration-250',
          'hover:-translate-y-0.5',
          'hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)]', // Subtle glow
          'hover:border-mirror-amethyst/30',
          'active:scale-[0.99]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-amethyst focus-visible:ring-offset-2'
        ],

        className
      )}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
```

**Key Points:**
- `interactive` prop enables hover/active states
- Hover includes lift (`-translate-y-0.5`) + glow + border highlight
- Active state uses `scale-[0.99]` for subtle press feedback
- Duration is 250ms (slightly longer than buttons for larger surface area)
- Focus state for keyboard navigation
- Semantic HTML: `role="button"` and `tabIndex={0}` when interactive

**Usage:**
```tsx
// Non-interactive card
<GlassCard>
  <h2>Static Content</h2>
</GlassCard>

// Interactive card
<GlassCard interactive onClick={() => navigate('/dreams/123')}>
  <h3>Dream Title</h3>
  <p>Dream description...</p>
</GlassCard>

// Elevated + interactive
<GlassCard elevated interactive onClick={handleSelect}>
  <h3>Select This Option</h3>
</GlassCard>
```

---

## Input Error/Success Animation Pattern

### Pattern: Error Shake + Success Checkmark

**When to use:** All form inputs that have validation (GlassInput)

**Step 1: Add Keyframes to animations.css**

```css
/* styles/animations.css */

/* Error shake animation */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-4px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

/* Success checkmark animation */
@keyframes checkmark {
  0% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

.animate-checkmark {
  animation: checkmark 300ms ease-out forwards;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-shake,
  .animate-checkmark {
    animation: none !important;
  }
}
```

**Step 2: Update GlassInput Component**

```tsx
// components/ui/glass/GlassInput.tsx

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { Check } from 'lucide-react';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean; // NEW: Success state
  helperText?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, success, helperText, className, required, id, type, ...props }, ref) => {
    const [isShaking, setIsShaking] = useState(false);
    const [prevError, setPrevError] = useState<string | undefined>();

    // Trigger shake animation on error state change
    useEffect(() => {
      if (error && error !== prevError) {
        setIsShaking(true);
        const timer = setTimeout(() => setIsShaking(false), 400);
        setPrevError(error);
        return () => clearTimeout(timer);
      }
      if (!error) {
        setPrevError(undefined);
      }
    }, [error, prevError]);

    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="text-sm text-white/70 font-medium block">
            {label}
            {required && <span className="text-mirror-error ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-white/5 backdrop-blur-sm',
              'border',
              // Border states
              error ? 'border-mirror-error/50' : success ? 'border-mirror-success/50' : 'border-white/20',
              // Focus states
              'focus:outline-none',
              error
                ? 'focus:border-mirror-error focus:shadow-[0_0_30px_rgba(248,113,113,0.2)]'
                : success
                ? 'focus:border-mirror-success focus:shadow-[0_0_30px_rgba(52,211,153,0.2)]'
                : 'focus:border-mirror-amethyst/60 focus:shadow-[0_0_30px_rgba(124,58,237,0.2)]',
              'focus:scale-[1.01]',
              // Text
              'text-white placeholder:text-white/40',
              // Transition
              'transition-all duration-300',
              // Error shake animation
              isShaking && 'animate-shake'
            )}
            {...props}
          />

          {/* Success Checkmark */}
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="text-mirror-success"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                />
                <path
                  d="M6 10 L9 13 L14 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray="100"
                  className="animate-checkmark"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-mirror-error flex items-center gap-1">
            <span>⚠️</span>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="text-sm text-white/50">{helperText}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
```

**Key Points:**
- Shake animation triggers ONLY on error state change (not every render)
- Success checkmark uses SVG with stroke-dashoffset animation
- Error state has red border + glow
- Success state has green border + glow + checkmark
- Animation respects `prefers-reduced-motion`
- Helper text appears when no error present

**Usage:**
```tsx
// Basic input
<GlassInput
  label="Email"
  type="email"
  placeholder="you@example.com"
  required
/>

// Input with error (triggers shake)
<GlassInput
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// Input with success
<GlassInput
  label="Email"
  type="email"
  success={emailValidated}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Input with helper text
<GlassInput
  label="Username"
  helperText="Choose a unique username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

---

## Skip Navigation Pattern

### Pattern: Keyboard Accessibility - Skip to Main Content

**When to use:** Root layout (app/layout.tsx) - ALWAYS

**Code Example:**

```tsx
// app/layout.tsx

import { AppNavigation } from '@/components/shared/AppNavigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-mirror-void-deep text-white min-h-screen">
        {/* Skip Navigation Link (appears on first Tab press) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-mirror-amethyst focus:text-white focus:px-6 focus:py-3 focus:rounded-lg focus:shadow-amethyst-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2"
        >
          Skip to main content
        </a>

        {/* Navigation */}
        <AppNavigation />

        {/* Main Content */}
        <main id="main-content" tabIndex={-1} className="focus:outline-none pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
```

**Key Points:**
- `sr-only` hides link visually (screen readers still announce)
- `focus:not-sr-only` makes link visible when focused (Tab press)
- High z-index (200) ensures link appears above all content
- `href="#main-content"` jumps to main element
- `tabIndex={-1}` on main allows programmatic focus
- Styled like a button for visual consistency
- Positioned top-left for easy access

**Usage:**
- User presses Tab on page load
- Skip link appears at top-left
- User presses Enter
- Focus jumps to main content (bypassing navigation)

---

## ARIA Label Pattern

### Pattern: Icon-Only Buttons Need Labels

**When to use:** ALL buttons with only icons (no visible text)

**Code Examples:**

**Example 1: Mobile Menu Toggle**
```tsx
// components/shared/AppNavigation.tsx

import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function AppNavigation() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden p-2 rounded-lg bg-white/8 hover:bg-white/12 transition-all"
        aria-label={showMobileMenu ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={showMobileMenu}
        aria-controls="mobile-navigation"
      >
        {showMobileMenu ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div
          id="mobile-navigation"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {/* Menu items */}
        </div>
      )}
    </nav>
  );
}
```

**Example 2: User Dropdown Button**
```tsx
// components/shared/AppNavigation.tsx

import { useState } from 'react';

export function AppNavigation() {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleUserDropdownToggle = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleUserDropdownToggle();
    }
    if (e.key === 'Escape') {
      setShowUserDropdown(false);
    }
  };

  return (
    <button
      onClick={handleUserDropdownToggle}
      onKeyDown={handleKeyDown}
      className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
      aria-label="User menu"
      aria-expanded={showUserDropdown}
      aria-haspopup="true"
      aria-controls="user-dropdown-menu"
    >
      <span className="text-lg" aria-hidden="true">
        {user?.tier === 'premium' ? '💎' : '👤'}
      </span>
      <span className="hidden sm:inline text-sm text-white">
        {user?.name?.split(' ')[0] || 'Friend'}
      </span>
    </button>
  );
}
```

**Example 3: Close Modal Button**
```tsx
// components/ui/glass/GlassModal.tsx

import { X } from 'lucide-react';

export function GlassModal({ onClose, children }: GlassModalProps) {
  return (
    <div role="dialog" aria-modal="true">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 text-white" />
      </button>
      {children}
    </div>
  );
}
```

**Key Points:**
- `aria-label` provides text description for screen readers
- `aria-expanded` indicates dropdown/menu state (true/false)
- `aria-haspopup="true"` indicates element opens a menu
- `aria-controls` links button to controlled element (by ID)
- `aria-hidden="true"` on decorative emojis/icons
- Keyboard handlers for Enter, Space, Escape

---

## Modal Focus Trap Pattern

### Pattern: Keyboard Navigation Contained in Modal

**When to use:** All modals (GlassModal, CreateDreamModal)

**Step 1: Install Dependency**
```bash
npm install react-focus-lock
```

**Step 2: Implement Focus Trap**

```tsx
// components/ui/glass/GlassModal.tsx

import { AnimatePresence, motion } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { modalOverlayVariants, modalContentVariants } from '@/lib/animations/variants';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: GlassModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus close button when modal opens
  useEffect(() => {
    if (isOpen) {
      // Delay to allow modal animation to complete
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock returnFocus>
          {/* Overlay */}
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-mirror-dark/80 backdrop-blur-glass"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
            >
              <GlassCard elevated className={className}>
                {/* Close Button */}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Title */}
                {title && (
                  <h2 id="modal-title" className="text-2xl font-bold text-white mb-4 pr-10">
                    {title}
                  </h2>
                )}

                {/* Content */}
                <div className="text-white/80">{children}</div>
              </GlassCard>
            </motion.div>
          </div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
}
```

**Key Points:**
- `FocusLock` with `returnFocus` prop returns focus to trigger element on close
- `closeButtonRef` auto-focuses first interactive element
- Escape key handler closes modal
- `role="dialog"` and `aria-modal="true"` for screen readers
- `aria-labelledby` links title to dialog
- Click overlay to close (UX pattern)
- `stopPropagation()` prevents modal content clicks from closing

**Usage:**
```tsx
const [isOpen, setIsOpen] = useState(false);

<GlassModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create New Dream"
>
  <form onSubmit={handleSubmit}>
    <GlassInput label="Dream Title" />
    <GlowButton type="submit">Create</GlowButton>
  </form>
</GlassModal>
```

---

## Semantic Color Usage Pattern

### Pattern: Consistent Semantic Colors Across App

**When to use:** ALL status messages, buttons, badges, borders

**Step 1: Create Utility Classes**

```css
/* styles/globals.css */

@layer utilities {
  /* Text Colors */
  .text-semantic-success { @apply text-mirror-success; }
  .text-semantic-error { @apply text-mirror-error; }
  .text-semantic-info { @apply text-mirror-info; }
  .text-semantic-warning { @apply text-mirror-warning; }

  /* Background Colors (Light) */
  .bg-semantic-success-light { @apply bg-mirror-success/10; }
  .bg-semantic-error-light { @apply bg-mirror-error/10; }
  .bg-semantic-info-light { @apply bg-mirror-info/10; }
  .bg-semantic-warning-light { @apply bg-mirror-warning/10; }

  /* Border Colors */
  .border-semantic-success { @apply border-mirror-success/50; }
  .border-semantic-error { @apply border-mirror-error/50; }
  .border-semantic-info { @apply border-mirror-info/50; }
  .border-semantic-warning { @apply border-mirror-warning/50; }

  /* Status Box Patterns (Reusable) */
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

  .status-box-warning {
    @apply bg-semantic-warning-light border-semantic-warning text-semantic-warning;
    @apply border backdrop-blur-md rounded-lg p-4;
  }
}
```

**Step 2: Use Semantic Colors**

```tsx
// BEFORE (Tailwind defaults)
<div className="bg-green-500/10 border-green-500/50 text-green-200">
  ✅ Success!
</div>

// AFTER (Semantic utility class)
<div className="status-box-success">
  ✅ Success!
</div>

// BEFORE (Manual classes)
<div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
  ⚠️ Error occurred
</div>

// AFTER (Semantic utility class)
<div className="status-box-error">
  ⚠️ Error occurred
</div>
```

**Step 3: Update GlowBadge**

```tsx
// components/ui/glass/GlowBadge.tsx

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'error' | 'info' | 'warning';

interface GlowBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  default: {
    bg: 'bg-mirror-amethyst/20',
    text: 'text-mirror-amethyst-bright',
    border: 'border-mirror-amethyst/30',
  },
  success: {
    bg: 'bg-mirror-success/20',
    text: 'text-mirror-success',
    border: 'border-mirror-success/30',
  },
  error: {
    bg: 'bg-mirror-error/20',
    text: 'text-mirror-error',
    border: 'border-mirror-error/30',
  },
  info: {
    bg: 'bg-mirror-info/20',
    text: 'text-mirror-info',
    border: 'border-mirror-info/30',
  },
  warning: {
    bg: 'bg-mirror-warning/20',
    text: 'text-mirror-warning',
    border: 'border-mirror-warning/30',
  },
};

export function GlowBadge({ variant = 'default', children, className }: GlowBadgeProps) {
  const colors = badgeVariants[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        'border backdrop-blur-sm',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {children}
    </span>
  );
}
```

**Usage:**
```tsx
// Success badge
<GlowBadge variant="success">Completed</GlowBadge>

// Error badge
<GlowBadge variant="error">Failed</GlowBadge>

// Info badge
<GlowBadge variant="info">New Feature</GlowBadge>

// Warning badge
<GlowBadge variant="warning">Expiring Soon</GlowBadge>
```

---

## Import Order Convention

```tsx
// 1. React imports
import { useState, useEffect, useRef } from 'react';

// 2. External library imports (alphabetical)
import { motion, AnimatePresence } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { X, Menu, Check } from 'lucide-react';

// 3. Internal component imports (relative)
import { GlassCard } from './GlassCard';
import { GlowButton } from './GlowButton';

// 4. Internal utility imports
import { cn } from '@/lib/utils';
import { modalVariants } from '@/lib/animations/variants';

// 5. Type imports
import type { GlassModalProps } from '@/types/glass-components';

// 6. Style imports (if needed)
import styles from './Modal.module.css';
```

---

## Code Quality Standards

### TypeScript Type Safety
```tsx
// ✅ GOOD: Fully typed props
interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

// ❌ BAD: Using 'any'
const handleChange = (e: any) => { ... }

// ✅ GOOD: Proper event typing
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
```

### Component Prop Patterns
```tsx
// ✅ GOOD: Destructure with defaults
export function GlowButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  ...props
}: GlowButtonProps) { ... }

// ❌ BAD: Using props object
export function GlowButton(props: GlowButtonProps) {
  const variant = props.variant || 'primary';
  ...
}
```

### Accessibility Patterns
```tsx
// ✅ GOOD: Semantic HTML + ARIA
<button
  aria-label="Close modal"
  aria-expanded={isOpen}
  onClick={handleClose}
>
  <X />
</button>

// ❌ BAD: div with onClick (not keyboard accessible)
<div onClick={handleClose}>
  <X />
</div>
```

---

## Performance Patterns

### GPU-Accelerated Animations ONLY
```tsx
// ✅ GOOD: Transform and opacity
'transition-all duration-200'
'hover:-translate-y-0.5 hover:opacity-90'

// ❌ BAD: Layout-triggering properties
'hover:margin-top-2' // Causes layout recalculation
'hover:width-full'   // Causes layout recalculation
```

### Respect Reduced Motion
```tsx
// ✅ GOOD: Check prefers-reduced-motion in hooks
const prefersReducedMotion = useReducedMotion();
if (prefersReducedMotion) return { opacity: 1 };

// ✅ GOOD: CSS media query
@media (prefers-reduced-motion: reduce) {
  .animate-shake { animation: none !important; }
}
```

### Avoid Unnecessary Re-renders
```tsx
// ✅ GOOD: Memoize callbacks
const handleClose = useCallback(() => {
  setIsOpen(false);
}, []);

// ✅ GOOD: Memoize expensive computations
const filteredDreams = useMemo(() => {
  return dreams.filter(dream => dream.status === 'active');
}, [dreams]);
```

---

## Security Patterns

### Prevent XSS in ARIA Labels
```tsx
// ✅ GOOD: Static strings only
<button aria-label="Open menu">
  <Menu />
</button>

// ⚠️ CAUTION: Sanitize user input if dynamic
<button aria-label={sanitize(user.name)}>
  Profile
</button>
```

### Prevent Focus Trap Escape
```tsx
// ✅ GOOD: FocusLock with returnFocus
<FocusLock returnFocus>
  <Modal>{children}</Modal>
</FocusLock>

// ❌ BAD: No focus management
<Modal>{children}</Modal>
```

---

## Testing Patterns

### Manual Accessibility Testing Checklist

```bash
# 1. Keyboard Navigation
- [ ] Tab through entire page (all interactive elements reachable)
- [ ] Skip link appears on first Tab
- [ ] Modal focus trap works (Tab doesn't escape)
- [ ] Escape closes modals
- [ ] Enter/Space activates buttons

# 2. Screen Reader Testing
- [ ] All buttons have descriptive labels
- [ ] Form inputs have visible labels
- [ ] Error messages are announced
- [ ] Modal dialogs are announced
- [ ] Landmark regions are announced (nav, main)

# 3. Reduced Motion
- [ ] Enable "Reduce Motion" in browser
- [ ] Verify no animations play
- [ ] Page is still usable (no content hidden)

# 4. Color Contrast
- [ ] Run Lighthouse audit (95+ accessibility)
- [ ] All text meets 4.5:1 ratio
- [ ] Error states are distinguishable
```

### Lighthouse Testing
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=http://localhost:3000/auth/signin

# Check scores
# Accessibility: 95+
# Performance: 90+
```

---

**CRITICAL REMINDER:**
- ALL new animations must check `prefers-reduced-motion`
- ALL icon-only buttons must have `aria-label`
- ALL modals must have focus trap
- ALL semantic colors use `mirror.*` palette (NOT Tailwind defaults)
- ALL transitions use GPU-accelerated properties (transform, opacity)

**This patterns file is the SINGLE SOURCE OF TRUTH for iteration 5 implementation.**
