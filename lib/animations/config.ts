/**
 * Animation configuration - Easing functions and duration presets
 */

// Easing functions
export const easings = {
  easeOut: [0.4, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.6, 1] as const,
  spring: { type: 'spring' as const, damping: 15, stiffness: 100 },
};

// Duration presets
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.6,
};

// Default transition
export const defaultTransition = {
  duration: durations.normal,
  ease: easings.easeOut,
};
