// Hooks Barrel Export - Consolidated hooks from /hooks/ and /lib/hooks/

// Authentication & State
export { useAuth } from './useAuth';
export { useDashboard } from './useDashboard';
export { usePortalState } from './usePortalState';

// Animation & Effects
export { useBreathingEffect } from './useBreathingEffect';
export { useAnimatedCounter } from './useAnimatedCounter';
export { useStaggerAnimation } from './useStaggerAnimation';

// Accessibility
export { useReducedMotion } from './useReducedMotion';

// Viewport & Input (moved from /lib/hooks/)
export { useScrollDirection, type ScrollDirection } from './useScrollDirection';
export { useIsMobile } from './useIsMobile';
export { useKeyboardHeight } from './useKeyboardHeight';

// Reflection
export { useReflectionForm } from './useReflectionForm';
export { useReflectionViewMode } from './useReflectionViewMode';
