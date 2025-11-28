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
    // Fallback timer ensures content becomes visible even if IntersectionObserver fails
    const fallbackTimer = setTimeout(() => {
      if (!isVisible && !hasAnimated) {
        console.warn('[useStaggerAnimation] Fallback triggered - observer may have failed');
        setIsVisible(true);
        if (triggerOnce) setHasAnimated(true);
      }
    }, 2000);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasAnimated(true);
          }
          clearTimeout(fallbackTimer);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.01,  // Lower threshold for earlier triggering
        rootMargin: '100px',  // Larger margin to trigger before element is in view
      }
    );

    const currentRef = containerRef.current;
    if (currentRef && !hasAnimated) {
      observer.observe(currentRef);
    }

    return () => {
      clearTimeout(fallbackTimer);
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [triggerOnce, hasAnimated, isVisible]);

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
