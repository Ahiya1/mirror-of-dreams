// src/hooks/useAnimatedCounter.js - Number count-up animations (0 → actual value)

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook for animated number counting with smooth easing
 * @param {number|string} endValue - Final value to count to
 * @param {Object} options - Animation configuration
 * @returns {Object} - Current display value and controls
 */
export const useAnimatedCounter = (endValue, options = {}) => {
  const {
    duration = 2000, // Animation duration in ms
    delay = 0, // Delay before starting animation
    easing = "easeOutQuart", // Easing function name
    decimals = 0, // Number of decimal places
    startValue = 0, // Starting value
    formatValue = null, // Custom formatting function
    trigger = "auto", // 'auto', 'manual', or 'visible'
    threshold = 0.3, // Intersection observer threshold for 'visible' trigger
    preserveValue = false, // Keep the final value after unmount
  } = options;

  const [currentValue, setCurrentValue] = useState(startValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const observerRef = useRef(null);
  const elementRef = useRef(null);
  const mountedRef = useRef(true);

  // Parse end value to number
  const numericEndValue =
    typeof endValue === "string"
      ? parseFloat(endValue.replace(/[^0-9.-]/g, "")) || 0
      : endValue || 0;

  // Parse start value to number
  const numericStartValue =
    typeof startValue === "string"
      ? parseFloat(startValue.replace(/[^0-9.-]/g, "")) || 0
      : startValue || 0;

  /**
   * Easing functions for smooth animations
   */
  const easingFunctions = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => --t * t * t + 1,
    easeInOutCubic: (t) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - --t * t * t * t,
    easeInOutQuart: (t) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
    easeInQuint: (t) => t * t * t * t * t,
    easeOutQuint: (t) => 1 + --t * t * t * t * t,
    easeInOutQuint: (t) =>
      t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
    easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
    easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    easeInOutExpo: (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
      return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
  };

  /**
   * Check if user prefers reduced motion
   */
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /**
   * Format the display value
   */
  const formatDisplayValue = useCallback(
    (value) => {
      if (formatValue && typeof formatValue === "function") {
        return formatValue(value);
      }

      // Handle special cases
      if (typeof endValue === "string") {
        if (endValue === "unlimited" || endValue === "∞") {
          return value >= numericEndValue ? endValue : Math.round(value);
        }
      }

      // Standard number formatting
      const rounded =
        decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value);

      // Add thousands separators for large numbers
      if (Math.abs(rounded) >= 1000) {
        return rounded.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }

      return decimals > 0 ? rounded.toFixed(decimals) : rounded.toString();
    },
    [endValue, numericEndValue, decimals, formatValue]
  );

  /**
   * Animation frame function
   */
  const animateValue = useCallback(
    (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      const easingFunction =
        easingFunctions[easing] || easingFunctions.easeOutQuart;
      const easedProgress = easingFunction(progress);

      // Calculate current value
      const range = numericEndValue - numericStartValue;
      const newValue = numericStartValue + range * easedProgress;

      if (mountedRef.current) {
        setCurrentValue(newValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateValue);
        } else {
          setCurrentValue(numericEndValue);
          setIsAnimating(false);
          setHasAnimated(true);
          animationRef.current = null;
          startTimeRef.current = null;
        }
      }
    },
    [duration, easing, numericEndValue, numericStartValue, easingFunctions]
  );

  /**
   * Start the counter animation
   */
  const startAnimation = useCallback(() => {
    if (isAnimating || hasAnimated || !mountedRef.current) return;

    // Skip animation if reduced motion is preferred
    if (prefersReducedMotion()) {
      setCurrentValue(numericEndValue);
      setHasAnimated(true);
      return;
    }

    // Skip if values are the same
    if (numericStartValue === numericEndValue) {
      setCurrentValue(numericEndValue);
      setHasAnimated(true);
      return;
    }

    setIsAnimating(true);
    setCurrentValue(numericStartValue);

    const startWithDelay = () => {
      if (mountedRef.current) {
        animationRef.current = requestAnimationFrame(animateValue);
      }
    };

    if (delay > 0) {
      setTimeout(startWithDelay, delay);
    } else {
      startWithDelay();
    }
  }, [
    isAnimating,
    hasAnimated,
    prefersReducedMotion,
    numericStartValue,
    numericEndValue,
    delay,
    animateValue,
  ]);

  /**
   * Reset the counter animation
   */
  const resetAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    startTimeRef.current = null;
    setCurrentValue(numericStartValue);
    setIsAnimating(false);
    setHasAnimated(false);
  }, [numericStartValue]);

  /**
   * Manually trigger animation
   */
  const triggerAnimation = useCallback(() => {
    resetAnimation();
    startAnimation();
  }, [resetAnimation, startAnimation]);

  // Handle automatic triggering
  useEffect(() => {
    if (trigger === "auto") {
      const timer = setTimeout(() => {
        startAnimation();
      }, 100); // Small delay to ensure component is mounted

      return () => clearTimeout(timer);
    }
  }, [trigger, startAnimation]);

  // Handle visibility-based triggering
  useEffect(() => {
    if (
      trigger === "visible" &&
      elementRef.current &&
      typeof IntersectionObserver !== "undefined"
    ) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              startAnimation();
            }
          });
        },
        {
          threshold,
          rootMargin: "50px",
        }
      );

      observerRef.current.observe(elementRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [trigger, threshold, hasAnimated, startAnimation]);

  // Handle value changes
  useEffect(() => {
    if (hasAnimated && !preserveValue) {
      // If end value changes and we've already animated, re-animate
      resetAnimation();
      startAnimation();
    }
  }, [
    numericEndValue,
    hasAnimated,
    preserveValue,
    resetAnimation,
    startAnimation,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    // Display value
    displayValue: formatDisplayValue(currentValue),
    rawValue: currentValue,

    // State
    isAnimating,
    hasAnimated,
    progress:
      duration > 0
        ? Math.min(
            (currentValue - numericStartValue) /
              (numericEndValue - numericStartValue),
            1
          )
        : 1,

    // Controls
    start: startAnimation,
    reset: resetAnimation,
    trigger: triggerAnimation,

    // Ref for intersection observer
    ref: elementRef,

    // Configuration
    endValue: numericEndValue,
    startValue: numericStartValue,

    // Utilities
    formatValue: formatDisplayValue,
  };
};
