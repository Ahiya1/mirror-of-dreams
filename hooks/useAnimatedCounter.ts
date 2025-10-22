'use client';

import { useState, useEffect, useRef } from 'react';

type EasingFunction = 'linear' | 'easeOut' | 'easeOutQuart' | 'easeInOut';

interface AnimatedCounterOptions {
  duration?: number; // Animation duration in ms
  easing?: EasingFunction; // Easing function
}

const easingFunctions: Record<EasingFunction, (t: number) => number> = {
  linear: (t) => t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

/**
 * Hook for creating animated number counters
 * @param targetValue - Target number to count to
 * @param options - Animation options
 */
export function useAnimatedCounter(
  targetValue: number,
  options: AnimatedCounterOptions = {}
): number {
  const { duration = 1000, easing = 'easeOutQuart' } = options;

  const [currentValue, setCurrentValue] = useState(0);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef(0);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If reduced motion or target is 0, set immediately
    if (prefersReducedMotion || targetValue === 0) {
      setCurrentValue(targetValue);
      return;
    }

    const easingFn = easingFunctions[easing];
    startValueRef.current = currentValue;
    startTimeRef.current = undefined;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);

      const newValue =
        startValueRef.current + (targetValue - startValueRef.current) * easedProgress;

      setCurrentValue(newValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [targetValue, duration, easing]);

  return currentValue;
}
