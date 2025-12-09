import type { Variants } from 'framer-motion';

/**
 * Card entrance and hover animation (restrained - no scale)
 */
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
      ease: [0.4, 0, 0.2, 1],
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
 * Modal content animation (fade + slide, no scale)
 */
export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

/**
 * Pulse glow animation (DEPRECATED - use static glow for active states)
 * Kept for backwards compatibility but should not be used for new code
 */
export const pulseGlowVariants: Variants = {
  initial: {
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
  },
  animate: {
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
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

/**
 * Fade in animation
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

/**
 * Slide up animation
 */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Button animation (DEPRECATED - use CSS transitions instead)
 * NO scale effects - use opacity changes only
 */
export const buttonVariants: Variants = {
  rest: {
    opacity: 1,
  },
  hover: {
    opacity: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    opacity: 0.85,
  },
};

/**
 * Progress orb animation (no scale)
 */
export const orbVariants: Variants = {
  inactive: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  active: {
    opacity: 1,
    backgroundColor: 'rgba(139, 92, 246, 1)',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  complete: {
    opacity: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Badge glow (DEPRECATED - use static glow for active states, no pulsing)
 */
export const badgeGlowVariants: Variants = {
  rest: {
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
  },
  glow: {
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
  },
};

/**
 * Pulse animation for loaders (opacity only, no scale)
 */
export const scalePulseVariants: Variants = {
  animate: {
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Slide in from left
 */
export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Slide in from right
 */
export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Float animation (DEPRECATED - decorative, remove from foreground elements)
 * Kept for backwards compatibility only
 */
export const floatVariants: Variants = {
  animate: {
    y: 0,
  },
};

/**
 * Input focus animation (textarea/input focus glow)
 * Apply to reflection form inputs for premium feel
 */
export const inputFocusVariants: Variants = {
  rest: {
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  focus: {
    boxShadow: [
      '0 0 0 2px rgba(139, 92, 246, 0.5)', // Purple ring
      '0 0 20px rgba(139, 92, 246, 0.3)', // Purple glow
      'inset 0 0 20px rgba(139, 92, 246, 0.15)', // Inner glow
    ].join(', '),
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

/**
 * Card press animation (click feedback for interactive cards)
 * Subtle scale-down on tap for tactile feedback
 */
export const cardPressVariants: Variants = {
  rest: { scale: 1 },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

/**
 * Character counter color shift (visual feedback for input length)
 * Transitions: safe (white) → warning (gold) → high (purple, NOT red)
 * Note: No red "danger" state - we celebrate depth, not limit expression
 */
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
    color: '#a855f7', // Purple (changed from red - almost complete)
    transition: { duration: 0.2 },
  },
};

/**
 * Word counter color shift (for word-based counting in reflection form)
 * Same color progression as character counter but semantic naming
 */
export const wordCounterVariants: Variants = {
  low: {
    color: 'rgba(255, 255, 255, 0.7)', // White/70 (0-50%)
    transition: { duration: 0.3 },
  },
  mid: {
    color: '#fbbf24', // Gold (50-90%)
    transition: { duration: 0.3 },
  },
  high: {
    color: '#a855f7', // Purple (90-100%)
    transition: { duration: 0.3 },
  },
};

/**
 * Page transition animation (route changes)
 * 150ms exit, 300ms enter for smooth crossfades
 */
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

/**
 * Bottom navigation show/hide animation
 * Used with scroll direction detection
 */
export const bottomNavVariants: Variants = {
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

/**
 * Mobile modal slide-up animation
 * Full-screen modal that slides up from bottom on mobile devices
 * Uses spring physics for natural, responsive feel
 */
export const mobileModalVariants: Variants = {
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
