# Code Patterns & Conventions

**Iteration:** 17 - Full-Screen Reflection Experience
**Created:** 2025-12-02

---

## File Structure

```
mirror-of-dreams/
├── app/
│   ├── layout.tsx                    # MODIFY: Wrap with NavigationProvider
│   └── reflection/
│       ├── page.tsx                  # MODIFY: (minor) ensure MirrorExperience handles mobile
│       └── MirrorExperience.tsx      # MODIFY: Add mobile conditional render
├── components/
│   ├── navigation/
│   │   ├── BottomNavigation.tsx      # MODIFY: Read from NavigationContext
│   │   └── index.ts
│   ├── reflection/
│   │   ├── mobile/                   # NEW DIRECTORY
│   │   │   ├── MobileReflectionFlow.tsx    # NEW: Main wizard container
│   │   │   ├── QuestionStep.tsx            # NEW: Individual question screen
│   │   │   ├── ToneStep.tsx                # NEW: Tone selection screen
│   │   │   ├── DreamBottomSheet.tsx        # NEW: Dream picker using BottomSheet
│   │   │   ├── GazingOverlay.tsx           # NEW: Enhanced loading state
│   │   │   ├── ExitConfirmation.tsx        # NEW: Exit prompt modal
│   │   │   └── index.ts                    # NEW: Barrel exports
│   │   ├── ToneSelectionCard.tsx     # EXISTING: Reuse
│   │   └── ReflectionQuestionCard.tsx # EXISTING: Reference for content
│   └── ui/
│       ├── glass/
│       │   └── ProgressOrbs.tsx      # EXISTING: Use for step indicator
│       └── mobile/                   # NEW DIRECTORY
│           ├── BottomSheet.tsx       # NEW: Reusable bottom sheet
│           └── index.ts              # NEW: Barrel exports
├── contexts/                         # NEW DIRECTORY
│   ├── NavigationContext.tsx         # NEW: Bottom nav visibility control
│   └── index.ts                      # NEW: Barrel exports
├── lib/
│   ├── animations/
│   │   └── variants.ts               # MODIFY: Add new animation variants
│   ├── hooks/
│   │   ├── useScrollDirection.ts     # EXISTING: Pattern reference
│   │   ├── useKeyboardHeight.ts      # NEW: Keyboard detection
│   │   ├── useIsMobile.ts            # NEW: Mobile breakpoint detection
│   │   └── index.ts                  # MODIFY: Export new hooks
│   └── utils/
│       └── haptics.ts                # EXISTING: Use for feedback
└── styles/
    └── variables.css                 # EXISTING: Safe area vars already defined
```

---

## Naming Conventions

- **Components:** PascalCase (`BottomSheet.tsx`, `MobileReflectionFlow.tsx`)
- **Hooks:** camelCase with `use` prefix (`useKeyboardHeight.ts`, `useIsMobile.ts`)
- **Contexts:** PascalCase with `Context` suffix (`NavigationContext.tsx`)
- **Types:** PascalCase (`BottomSheetProps`, `WizardStep`)
- **Functions:** camelCase (`handleDragEnd`, `navigateToStep`)
- **Constants:** SCREAMING_SNAKE_CASE (`SNAP_THRESHOLDS`, `WIZARD_STEPS`)
- **CSS Variables:** kebab-case (`--safe-area-bottom`, `--bottom-sheet-height`)

---

## Import Order Convention

```typescript
// 1. React/Next.js core
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// 3. Internal contexts
import { useNavigation } from '@/contexts/NavigationContext';

// 4. Internal hooks
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useKeyboardHeight } from '@/lib/hooks/useKeyboardHeight';

// 5. Internal utilities
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';

// 6. Internal components
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';

// 7. Animation variants
import { bottomSheetVariants, stepTransitionVariants } from '@/lib/animations/variants';

// 8. Types (last)
import type { FormData, ToneId, Dream } from '@/types';
```

---

## Hook Patterns

### useIsMobile Hook

```typescript
// /lib/hooks/useIsMobile.ts
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Matches Tailwind md: breakpoint

/**
 * Hook to detect if viewport is mobile-sized
 * Returns false during SSR, then updates on client
 *
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) return <MobileView />;
 * return <DesktopView />;
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
```

### useKeyboardHeight Hook

```typescript
// /lib/hooks/useKeyboardHeight.ts
'use client';

import { useState, useEffect } from 'react';

const KEYBOARD_THRESHOLD = 150; // Minimum height to consider as keyboard

/**
 * Hook to detect virtual keyboard height using visualViewport API
 * Returns 0 when keyboard is hidden, positive number when visible
 *
 * @example
 * const keyboardHeight = useKeyboardHeight();
 * <div style={{ paddingBottom: keyboardHeight || 'var(--safe-area-bottom)' }}>
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Check for visualViewport support
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentViewportHeight = viewport.height;
      const diff = initialHeight - currentViewportHeight;

      // Only consider it a keyboard if difference exceeds threshold
      // This avoids false positives from address bar changes
      if (diff > KEYBOARD_THRESHOLD) {
        setKeyboardHeight(diff);
      } else {
        setKeyboardHeight(0);
      }
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  return keyboardHeight;
}
```

---

## Context Patterns

### NavigationContext

```typescript
// /contexts/NavigationContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface NavigationContextValue {
  showBottomNav: boolean;
  setShowBottomNav: (show: boolean) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
}

/**
 * Provider for controlling bottom navigation visibility
 * Wrap this around the app layout
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const [showBottomNav, setShowBottomNav] = useState(true);

  return (
    <NavigationContext.Provider value={{ showBottomNav, setShowBottomNav }}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to access navigation context
 * @throws Error if used outside NavigationProvider
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }

  return context;
}

/**
 * Hook to hide bottom nav while component is mounted
 * Automatically restores visibility on unmount
 *
 * @example
 * // In MobileReflectionFlow
 * useHideBottomNav();
 */
export function useHideBottomNav(): void {
  const { setShowBottomNav } = useNavigation();

  useEffect(() => {
    setShowBottomNav(false);
    return () => setShowBottomNav(true);
  }, [setShowBottomNav]);
}
```

### Using NavigationContext in Layout

```typescript
// app/layout.tsx (modification)
import { NavigationProvider } from '@/contexts/NavigationContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          <NavigationProvider>
            {/* ... existing layout content */}
            <BottomNavigation />
          </NavigationProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
```

### Using NavigationContext in BottomNavigation

```typescript
// components/navigation/BottomNavigation.tsx (modification)
import { useNavigation } from '@/contexts/NavigationContext';

export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const { showBottomNav } = useNavigation();

  // Hide nav on scroll down, show on scroll up (or at top)
  // Also hide when showBottomNav is false (e.g., during reflection)
  const isVisible = showBottomNav && scrollDirection !== 'down';

  // ... rest of component unchanged
}
```

---

## Animation Variants

### Add to /lib/animations/variants.ts

```typescript
/**
 * Bottom sheet slide-up animation
 * Use for modal-like bottom sheets
 */
export const bottomSheetVariants: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Bottom sheet backdrop animation
 */
export const bottomSheetBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * Step transition animation (horizontal slide)
 * Use custom prop for direction: positive = forward, negative = backward
 */
export const stepTransitionVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
};

/**
 * Gazing overlay animation
 * Full-screen immersive loading state
 */
export const gazingOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Status text fade transition
 * For cycling through gazing status messages
 */
export const statusTextVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};
```

---

## BottomSheet Component Pattern

```typescript
// /components/ui/mobile/BottomSheet.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { bottomSheetVariants, bottomSheetBackdropVariants } from '@/lib/animations/variants';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Height mode:
   * - 'auto': Content height (max 90vh)
   * - 'half': 50% of viewport
   * - 'full': 90% of viewport (leaves room for status bar)
   */
  height?: 'auto' | 'half' | 'full';
  /** Optional title displayed at top with drag handle */
  title?: string;
  /** Content to render inside sheet */
  children: React.ReactNode;
  /** Additional classes for the sheet container */
  className?: string;
}

const HEIGHT_MAP = {
  auto: 'max-h-[90vh]',
  half: 'h-[50vh]',
  full: 'h-[90vh]',
};

const DISMISS_THRESHOLD_DISTANCE = 100; // px
const DISMISS_THRESHOLD_VELOCITY = 500; // px/s

export function BottomSheet({
  isOpen,
  onClose,
  height = 'auto',
  title,
  children,
  className,
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset y position when sheet opens
  useEffect(() => {
    if (isOpen) {
      y.set(0);
    }
  }, [isOpen, y]);

  // Handle drag end - dismiss or snap back
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldDismiss =
      info.offset.y > DISMISS_THRESHOLD_DISTANCE ||
      info.velocity.y > DISMISS_THRESHOLD_VELOCITY;

    if (shouldDismiss) {
      onClose();
    } else {
      // Snap back to original position
      animate(y, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  };

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={bottomSheetBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className={cn(
              // Positioning
              'fixed bottom-0 inset-x-0 z-50',

              // Height
              HEIGHT_MAP[height],

              // Styling
              'bg-mirror-void-deep/95 backdrop-blur-xl',
              'border-t border-white/10',
              'rounded-t-3xl',

              // Safe area
              'pb-[env(safe-area-inset-bottom)]',

              // Touch
              'touch-none',

              // Overflow
              'overflow-hidden',

              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Optional Title */}
            {title && (
              <div className="px-6 pb-4 border-b border-white/10">
                <h2
                  id="bottom-sheet-title"
                  className="text-lg font-semibold text-white"
                >
                  {title}
                </h2>
              </div>
            )}

            {/* Content - scrollable if needed */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## Step Navigation Pattern

```typescript
// Pattern for MobileReflectionFlow step navigation

const WIZARD_STEPS = ['dreamSelect', 'q1', 'q2', 'q3', 'q4', 'tone'] as const;
type WizardStep = typeof WIZARD_STEPS[number];

// State
const [currentStepIndex, setCurrentStepIndex] = useState(0);
const [direction, setDirection] = useState(0); // -1 back, 1 forward
const [isTextareaFocused, setIsTextareaFocused] = useState(false);

// Navigation helpers
const goToNextStep = useCallback(() => {
  if (currentStepIndex < WIZARD_STEPS.length - 1) {
    setDirection(1);
    setCurrentStepIndex(prev => prev + 1);
    haptic('light');
  }
}, [currentStepIndex]);

const goToPreviousStep = useCallback(() => {
  if (currentStepIndex > 0) {
    setDirection(-1);
    setCurrentStepIndex(prev => prev - 1);
    haptic('light');
  }
}, [currentStepIndex]);

// Swipe handler (horizontal)
const handleDragEnd = useCallback((_: any, info: PanInfo) => {
  // Don't process swipe if textarea is focused
  if (isTextareaFocused) return;

  const SWIPE_THRESHOLD = 50;
  const VELOCITY_THRESHOLD = 300;

  const shouldAdvance =
    info.offset.x < -SWIPE_THRESHOLD ||
    info.velocity.x < -VELOCITY_THRESHOLD;

  const shouldGoBack =
    info.offset.x > SWIPE_THRESHOLD ||
    info.velocity.x > VELOCITY_THRESHOLD;

  if (shouldAdvance) {
    goToNextStep();
  } else if (shouldGoBack) {
    goToPreviousStep();
  }
}, [isTextareaFocused, goToNextStep, goToPreviousStep]);

// JSX with AnimatePresence
<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentStepIndex}
    custom={direction}
    variants={stepTransitionVariants}
    initial="enter"
    animate="center"
    exit="exit"
    drag={isTextareaFocused ? false : 'x'}
    dragConstraints={{ left: 0, right: 0 }}
    dragElastic={0.5}
    onDragEnd={handleDragEnd}
    className="absolute inset-0"
  >
    {renderCurrentStep()}
  </motion.div>
</AnimatePresence>
```

---

## Question Step Pattern

```typescript
// /components/reflection/mobile/QuestionStep.tsx
'use client';

import { useRef, useEffect } from 'react';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useKeyboardHeight } from '@/lib/hooks/useKeyboardHeight';
import { cn } from '@/lib/utils';

interface QuestionStepProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  guidingText: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export function QuestionStep({
  questionNumber,
  totalQuestions,
  questionText,
  guidingText,
  placeholder,
  value,
  onChange,
  maxLength,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  onFocus,
  onBlur,
}: QuestionStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const keyboardHeight = useKeyboardHeight();

  // Auto-scroll input into view when focused
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleFocus = () => {
      setTimeout(() => {
        textarea.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300); // Wait for keyboard animation
    };

    textarea.addEventListener('focus', handleFocus);
    return () => textarea.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'px-6 pt-4',
        // Dynamic bottom padding based on keyboard
        keyboardHeight > 0 ? `pb-[${keyboardHeight}px]` : 'pb-[var(--safe-area-bottom)]'
      )}
      style={{
        paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : undefined,
      }}
    >
      {/* Question Header */}
      <div className="mb-6">
        <p className="text-sm text-purple-400 mb-2">
          Question {questionNumber} of {totalQuestions}
        </p>
        <h2 className="text-2xl font-light text-white leading-relaxed mb-3">
          {questionText}
        </h2>
        <p className="text-white/60 text-sm leading-relaxed">
          {guidingText}
        </p>
      </div>

      {/* Textarea */}
      <div className="flex-1 min-h-0">
        <GlassInput
          ref={textareaRef}
          variant="textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          showCounter
          counterMode="words"
          rows={8}
          className="h-full"
          onFocus={() => onFocus()}
          onBlur={() => onBlur()}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <GlowButton
          variant="secondary"
          size="lg"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn(!canGoPrevious && 'opacity-0 pointer-events-none')}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </GlowButton>

        <GlowButton
          variant="primary"
          size="lg"
          onClick={onNext}
          disabled={!canGoNext || value.trim().length === 0}
        >
          Next
          <ChevronRight className="w-5 h-5 ml-1" />
        </GlowButton>
      </div>
    </div>
  );
}
```

---

## Dream Bottom Sheet Pattern

```typescript
// /components/reflection/mobile/DreamBottomSheet.tsx
'use client';

import { motion } from 'framer-motion';
import { Plus, Check, Sparkles } from 'lucide-react';
import { BottomSheet } from '@/components/ui/mobile/BottomSheet';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import type { Dream } from '@/types';

// Category emoji mapping
const CATEGORY_EMOJI: Record<string, string> = {
  career: '💼',
  health: '🏃',
  relationships: '💕',
  creativity: '🎨',
  finance: '💰',
  personal: '✨',
  spiritual: '🌙',
  education: '📚',
  default: '🌟',
};

interface DreamBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dreams: Dream[];
  selectedDreamId: string | null;
  onSelectDream: (dream: Dream) => void;
  onCreateDream: () => void;
}

export function DreamBottomSheet({
  isOpen,
  onClose,
  dreams,
  selectedDreamId,
  onSelectDream,
  onCreateDream,
}: DreamBottomSheetProps) {
  const handleSelect = (dream: Dream) => {
    haptic('light');
    onSelectDream(dream);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      height="half"
      title="Choose a Dream"
    >
      <div className="px-4 py-2 space-y-2">
        {/* Dream List */}
        {dreams.map((dream) => {
          const isSelected = dream.id === selectedDreamId;
          const emoji = CATEGORY_EMOJI[dream.category || 'default'] || CATEGORY_EMOJI.default;

          return (
            <motion.button
              key={dream.id}
              onClick={() => handleSelect(dream)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                // Layout
                'w-full flex items-center gap-4 p-4',
                // Touch target: minimum 60px height
                'min-h-[60px]',
                // Styling
                'rounded-2xl',
                'transition-colors duration-200',
                isSelected
                  ? 'bg-purple-500/20 border border-purple-500/50'
                  : 'bg-white/5 border border-white/10 active:bg-white/10'
              )}
            >
              {/* Emoji */}
              <span className="text-2xl" role="img" aria-label={dream.category || 'dream'}>
                {emoji}
              </span>

              {/* Dream Info */}
              <div className="flex-1 text-left">
                <h3 className="text-white font-medium truncate">
                  {dream.title}
                </h3>
                {dream.description && (
                  <p className="text-white/60 text-sm truncate mt-0.5">
                    {dream.description}
                  </p>
                )}
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.button>
          );
        })}

        {/* Create New Dream Option */}
        <motion.button
          onClick={() => {
            haptic('light');
            onCreateDream();
          }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full flex items-center gap-4 p-4',
            'min-h-[60px]',
            'rounded-2xl',
            'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
            'border border-purple-500/30',
            'active:opacity-80'
          )}
        >
          <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-purple-400 font-medium">
              Create New Dream
            </h3>
            <p className="text-white/60 text-sm">
              Start fresh with a new aspiration
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-purple-400/60" />
        </motion.button>
      </div>
    </BottomSheet>
  );
}
```

---

## Exit Confirmation Pattern

```typescript
// /components/reflection/mobile/ExitConfirmation.tsx
'use client';

import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';

interface ExitConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmation({
  isOpen,
  onConfirm,
  onCancel,
}: ExitConfirmationProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Leave reflection?"
    >
      <p className="text-white/80 mb-6 leading-relaxed">
        Your answers will be lost if you leave now. Are you sure you want to exit?
      </p>

      <div className="flex gap-3">
        <GlowButton
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Keep Writing
        </GlowButton>

        <GlowButton
          variant="primary"
          onClick={onConfirm}
          className="flex-1"
        >
          Leave
        </GlowButton>
      </div>
    </GlassModal>
  );
}
```

---

## Dirty Form Detection Pattern

```typescript
// In MobileReflectionFlow.tsx

const isDirty = useMemo(() => {
  return Object.values(formData).some(value => value.trim().length > 0);
}, [formData]);

// Browser back/refresh prevention
useEffect(() => {
  if (!isDirty) return;

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = ''; // Required for Chrome
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);

// In-app navigation prevention
const [showExitConfirm, setShowExitConfirm] = useState(false);

const handleCloseAttempt = useCallback(() => {
  if (isDirty) {
    setShowExitConfirm(true);
  } else {
    onClose();
  }
}, [isDirty, onClose]);
```

---

## LocalStorage Persistence Pattern

```typescript
const STORAGE_KEY = 'MIRROR_REFLECTION_DRAFT';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DraftData {
  formData: FormData;
  selectedDreamId: string;
  currentStepIndex: number;
  timestamp: number;
}

// Save draft on changes
useEffect(() => {
  if (!isDirty) return;

  const draft: DraftData = {
    formData,
    selectedDreamId,
    currentStepIndex,
    timestamp: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}, [formData, selectedDreamId, currentStepIndex, isDirty]);

// Restore draft on mount
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const draft: DraftData = JSON.parse(saved);

    // Only restore if less than 24 hours old
    if (Date.now() - draft.timestamp < EXPIRY_MS) {
      setFormData(draft.formData);
      setSelectedDreamId(draft.selectedDreamId);
      setCurrentStepIndex(draft.currentStepIndex);
    } else {
      // Clear expired draft
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Invalid data, clear it
    localStorage.removeItem(STORAGE_KEY);
  }
}, []); // Only on mount

// Clear draft on successful submit
const handleSubmitSuccess = () => {
  localStorage.removeItem(STORAGE_KEY);
};
```

---

## Gazing Overlay Pattern

```typescript
// /components/reflection/mobile/GazingOverlay.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { gazingOverlayVariants, statusTextVariants } from '@/lib/animations/variants';

const STATUS_MESSAGES = [
  'Gazing into the mirror...',
  'Reflecting on your journey...',
  'Crafting your insight...',
  'Weaving wisdom...',
];

const STATUS_INTERVAL = 3000; // ms

interface GazingOverlayProps {
  isVisible: boolean;
}

export function GazingOverlay({ isVisible }: GazingOverlayProps) {
  const [statusIndex, setStatusIndex] = useState(0);

  // Cycle through status messages
  useEffect(() => {
    if (!isVisible) {
      setStatusIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, STATUS_INTERVAL);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={gazingOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-mirror-void-deep/98 backdrop-blur-xl"
        >
          {/* Cosmic Loader */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <CosmicLoader size="lg" />
          </motion.div>

          {/* Status Text */}
          <div className="mt-8 h-16 flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                variants={statusTextVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-white/90 text-xl font-light text-center px-6"
              >
                {STATUS_MESSAGES[statusIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Subtle helper text */}
          <p className="text-white/50 text-sm mt-2">
            This may take a few moments
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Conditional Mobile Rendering Pattern

```typescript
// In MirrorExperience.tsx

import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { MobileReflectionFlow } from '@/components/reflection/mobile/MobileReflectionFlow';

export function MirrorExperience({ /* existing props */ }) {
  const isMobile = useIsMobile();

  // ... existing state and hooks ...

  // Mobile users get the step-by-step wizard
  if (isMobile && viewMode === 'questionnaire') {
    return (
      <MobileReflectionFlow
        dreams={dreams?.dreams || []}
        selectedDreamId={selectedDreamId}
        onDreamSelect={(dream) => {
          setSelectedDreamId(dream.id);
          setSelectedDream(dream);
        }}
        formData={formData}
        onFieldChange={handleFieldChange}
        selectedTone={selectedTone}
        onToneSelect={setSelectedTone}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onClose={() => router.push('/dashboard')}
      />
    );
  }

  // Desktop users get the existing experience (unchanged)
  return (
    // ... existing JSX ...
  );
}
```

---

## Testing Patterns

### Hook Testing Example

```typescript
// __tests__/hooks/useIsMobile.test.ts
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
  });

  it('returns true when viewport is mobile-sized', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('returns false when viewport is desktop-sized', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('updates when window resizes', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });
});
```

---

## Code Quality Standards

1. **TypeScript Strict Mode:** All components must have proper type annotations
2. **No `any` Types:** Use proper types or `unknown` with type guards
3. **Exhaustive Switch:** Use `never` for exhaustive switch statements
4. **Null Safety:** Check for null/undefined before accessing properties
5. **Cleanup Effects:** All useEffect hooks must return cleanup functions if they create listeners
6. **Memoization:** Use `useCallback` for handlers passed to children, `useMemo` for computed values
7. **Accessibility:** All interactive elements must have proper ARIA attributes

---

## Performance Guidelines

1. **Animation Performance:**
   - Use `transform` and `opacity` only (GPU-accelerated)
   - Add `will-change: transform` for complex animations
   - Respect `prefers-reduced-motion` media query

2. **Re-render Prevention:**
   - Memoize callbacks and computed values
   - Split large components to isolate re-renders
   - Use `AnimatePresence mode="wait"` to prevent layout thrashing

3. **Bundle Size:**
   - Import only needed icons from lucide-react: `import { X } from 'lucide-react'`
   - No new npm dependencies in this iteration
   - Total new code should be < 15KB gzipped
