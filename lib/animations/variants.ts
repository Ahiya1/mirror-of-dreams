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
      ease: [0.4, 0, 0.2, 1],
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

/**
 * Fade in animation
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

/**
 * Slide up animation
 */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Button animation with glow
 */
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
  },
};

/**
 * Progress orb animation
 */
export const orbVariants: Variants = {
  inactive: {
    scale: 1,
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  active: {
    scale: 1.2,
    opacity: 1,
    backgroundColor: 'rgba(139, 92, 246, 1)',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  complete: {
    scale: 1,
    opacity: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Badge glow pulse
 */
export const badgeGlowVariants: Variants = {
  rest: {
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
  },
  glow: {
    boxShadow: [
      '0 0 10px rgba(139, 92, 246, 0.3)',
      '0 0 20px rgba(139, 92, 246, 0.6)',
      '0 0 10px rgba(139, 92, 246, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Scale pulse animation (for loaders)
 */
export const scalePulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
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
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

/**
 * Slide in from right
 */
export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

/**
 * Float animation (for floating elements)
 */
export const floatVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
