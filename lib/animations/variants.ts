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
