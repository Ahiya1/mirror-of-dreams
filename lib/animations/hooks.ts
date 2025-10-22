import { useReducedMotion } from 'framer-motion';

/**
 * Hook to get animation configuration based on user preferences
 * @returns Object with animation settings
 */
export function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion();

  return {
    shouldAnimate: !prefersReducedMotion,
    variants: prefersReducedMotion ? {} : undefined,
  };
}
