'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  /** Minimum scroll distance before detecting direction (default: 10) */
  threshold?: number;
  /** Throttle scroll events in milliseconds (default: 100) */
  throttleMs?: number;
}

/**
 * Hook to detect scroll direction for show/hide UI patterns
 * Returns 'up', 'down', or null (initial state / at top)
 *
 * @example
 * const scrollDirection = useScrollDirection();
 * const isNavVisible = scrollDirection !== 'down';
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): ScrollDirection {
  const { threshold = 10, throttleMs = 100 } = options;

  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const lastTimestamp = useRef(0);
  const ticking = useRef(false);

  const updateDirection = useCallback(() => {
    const currentY = window.scrollY;
    const diff = currentY - lastScrollY.current;

    // Only update if scroll exceeds threshold
    if (Math.abs(diff) >= threshold) {
      // At top of page, show nav
      if (currentY <= 0) {
        setDirection(null);
      } else {
        setDirection(diff > 0 ? 'down' : 'up');
      }
      lastScrollY.current = currentY;
    }

    ticking.current = false;
  }, [threshold]);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();

      // Throttle scroll events
      if (now - lastTimestamp.current < throttleMs) {
        return;
      }
      lastTimestamp.current = now;

      if (!ticking.current) {
        window.requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    // Set initial scroll position
    lastScrollY.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [throttleMs, updateDirection]);

  return direction;
}
