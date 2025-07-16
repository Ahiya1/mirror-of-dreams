// src/hooks/useStaggerAnimation.js - Coordinated entrance animations for dashboard cards

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook for coordinated stagger animations across multiple elements
 * @param {number} itemCount - Number of items to animate
 * @param {Object} options - Animation configuration
 * @returns {Object} - Animation state and controls
 */
export const useStaggerAnimation = (itemCount = 0, options = {}) => {
  const {
    delay = 100, // Base delay between items (ms)
    duration = 600, // Animation duration (ms)
    easing = "ease-out", // CSS easing function
    threshold = 0.1, // Intersection observer threshold
    triggerOnce = true, // Only trigger animation once
    enabled = true, // Enable/disable animations
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [animatedItems, setAnimatedItems] = useState(new Set());
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const timeoutsRef = useRef([]);
  const mountedRef = useRef(true);

  /**
   * Check if user prefers reduced motion
   */
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /**
   * Start stagger animation sequence
   */
  const startAnimation = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // If reduced motion, animate all at once
    if (prefersReducedMotion()) {
      const allItems = new Set();
      for (let i = 0; i < itemCount; i++) {
        allItems.add(i);
      }
      setAnimatedItems(allItems);
      return;
    }

    // Stagger animations
    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        if (mountedRef.current) {
          setAnimatedItems((prev) => new Set([...prev, i]));
        }
      }, i * delay);

      timeoutsRef.current.push(timeout);
    }
  }, [itemCount, delay, enabled, prefersReducedMotion]);

  /**
   * Reset animation state
   */
  const resetAnimation = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setAnimatedItems(new Set());
    setIsVisible(false);
  }, []);

  /**
   * Trigger animation manually
   */
  const triggerAnimation = useCallback(() => {
    if (!isVisible) {
      setIsVisible(true);
    }
    startAnimation();
  }, [isVisible, startAnimation]);

  /**
   * Get animation styles for an item
   */
  const getItemStyles = useCallback(
    (index) => {
      const isAnimated = animatedItems.has(index);
      const animationDelay =
        enabled && !prefersReducedMotion() ? index * delay : 0;

      const baseStyles = {
        transition: `all ${duration}ms ${easing}`,
        transitionDelay: `${animationDelay}ms`,
      };

      if (!enabled || prefersReducedMotion()) {
        return {
          ...baseStyles,
          opacity: 1,
          transform: "translateY(0) scale(1)",
        };
      }

      if (!isVisible || !isAnimated) {
        return {
          ...baseStyles,
          opacity: 0,
          transform: "translateY(30px) scale(0.95)",
        };
      }

      return {
        ...baseStyles,
        opacity: 1,
        transform: "translateY(0) scale(1)",
      };
    },
    [
      animatedItems,
      isVisible,
      delay,
      duration,
      easing,
      enabled,
      prefersReducedMotion,
    ]
  );

  /**
   * Get animation classes for an item
   */
  const getItemClasses = useCallback(
    (index) => {
      const classes = ["stagger-item"];

      if (isVisible && animatedItems.has(index)) {
        classes.push("stagger-item--visible");
      }

      return classes.join(" ");
    },
    [isVisible, animatedItems]
  );

  /**
   * Check if item is animated
   */
  const isItemAnimated = useCallback(
    (index) => {
      return animatedItems.has(index);
    },
    [animatedItems]
  );

  /**
   * Check if all items are animated
   */
  const areAllItemsAnimated = useCallback(() => {
    return animatedItems.size === itemCount;
  }, [animatedItems.size, itemCount]);

  /**
   * Get animation progress (0-1)
   */
  const getProgress = useCallback(() => {
    if (itemCount === 0) return 1;
    return animatedItems.size / itemCount;
  }, [animatedItems.size, itemCount]);

  // Set up intersection observer
  useEffect(() => {
    if (
      !enabled ||
      !containerRef.current ||
      typeof IntersectionObserver === "undefined"
    ) {
      // Fallback for environments without IntersectionObserver
      setIsVisible(true);
      startAnimation();
      return;
    }

    const container = containerRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);

            if (triggerOnce) {
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold,
        rootMargin: "50px",
      }
    );

    observerRef.current.observe(container);

    return () => {
      if (observerRef.current && container) {
        observerRef.current.unobserve(container);
      }
    };
  }, [enabled, threshold, triggerOnce, isVisible, startAnimation]);

  // Start animation when visible
  useEffect(() => {
    if (isVisible && enabled) {
      startAnimation();
    }
  }, [isVisible, enabled, startAnimation]);

  // Handle reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = () => {
      if (isVisible) {
        startAnimation();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isVisible, startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timeoutsRef.current.forEach(clearTimeout);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    // Refs
    containerRef,

    // State
    isVisible,
    animatedItems,
    isComplete: areAllItemsAnimated(),
    progress: getProgress(),

    // Item helpers
    getItemStyles,
    getItemClasses,
    isItemAnimated,

    // Controls
    triggerAnimation,
    resetAnimation,
    startAnimation,

    // Configuration
    delay,
    duration,
    enabled: enabled && !prefersReducedMotion(),
  };
};
