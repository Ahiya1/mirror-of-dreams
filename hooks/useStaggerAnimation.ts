'use client';

import { useRef, useState, useEffect, CSSProperties } from 'react';

interface StaggerOptions {
  delay?: number; // Delay between each item (ms)
  duration?: number; // Animation duration for each item (ms)
  triggerOnce?: boolean; // Only animate once on scroll into view
}

interface StaggerReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  getItemStyles: (index: number) => CSSProperties;
  isVisible: boolean;
}

/**
 * Hook for creating staggered entrance animations
 * @param itemCount - Number of items to animate
 * @param options - Stagger animation options
 */
export function useStaggerAnimation(
  itemCount: number,
  options: StaggerOptions = {}
): StaggerReturn {
  const { delay = 80, duration = 300, triggerOnce = true } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (triggerOnce && !hasAnimated) {
              setHasAnimated(true);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '50px', // Start animation slightly before entering viewport
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [triggerOnce, hasAnimated]);

  const getItemStyles = (index: number): CSSProperties => {
    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return {
        opacity: 1,
      };
    }

    const shouldAnimate = triggerOnce ? hasAnimated : isVisible;

    if (!shouldAnimate) {
      return {
        opacity: 0,
        transform: 'translateY(20px)',
      };
    }

    return {
      opacity: 1,
      transform: 'translateY(0)',
      transition: `opacity ${duration}ms ease-out ${index * delay}ms, transform ${duration}ms ease-out ${index * delay}ms`,
    };
  };

  return {
    containerRef,
    getItemStyles,
    isVisible: triggerOnce ? hasAnimated : isVisible,
  };
}
