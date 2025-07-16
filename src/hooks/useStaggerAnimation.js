// hooks/useStaggerAnimation.js - Coordinated entrance animations for dashboard elements

import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Custom hook for creating staggered entrance animations
 * @param {Array} elements - Array of elements to animate
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} staggerDelay - Delay between each element in milliseconds
 * @param {Object} options - Animation options
 * @returns {Array} - Elements with calculated animation delays
 */
export const useStaggerAnimation = (
  elements = [],
  baseDelay = 0,
  staggerDelay = 150,
  options = {}
) => {
  const {
    duration = 800,
    easing = "ease-out",
    threshold = 0.1,
    once = true,
    enabled = true,
  } = options;

  const [animationStates, setAnimationStates] = useState({});
  const [isInView, setIsInView] = useState(false);

  /**
   * Calculate staggered delays for elements
   */
  const staggeredElements = useMemo(() => {
    if (!enabled || !elements.length) {
      return elements.map((element) => ({
        ...element,
        delay: 0,
        shouldAnimate: false,
      }));
    }

    return elements.map((element, index) => ({
      ...element,
      delay: baseDelay + index * staggerDelay,
      shouldAnimate: isInView || !once,
      animationDuration: duration,
      animationEasing: easing,
    }));
  }, [
    elements,
    baseDelay,
    staggerDelay,
    isInView,
    once,
    enabled,
    duration,
    easing,
  ]);

  /**
   * Handle intersection observer for viewport detection
   */
  const handleIntersection = useCallback(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
        setIsInView(true);
      }
    },
    [threshold]
  );

  /**
   * Set up intersection observer
   */
  useEffect(() => {
    if (!enabled || !once) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: "50px",
    });

    // Observe the document body or a specific container
    const target = document.body;
    if (target) {
      observer.observe(target);
    }

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, threshold, enabled, once]);

  /**
   * Track animation completion for each element
   */
  const markAnimationComplete = useCallback((elementId) => {
    setAnimationStates((prev) => ({
      ...prev,
      [elementId]: "complete",
    }));
  }, []);

  /**
   * Check if all animations are complete
   */
  const allAnimationsComplete = useMemo(() => {
    return staggeredElements.every(
      (element) => animationStates[element.id] === "complete"
    );
  }, [staggeredElements, animationStates]);

  /**
   * Reset animations
   */
  const resetAnimations = useCallback(() => {
    setAnimationStates({});
    setIsInView(false);
  }, []);

  /**
   * Get animation styles for a specific element
   */
  const getAnimationStyles = useCallback(
    (elementId) => {
      const element = staggeredElements.find((el) => el.id === elementId);
      if (!element || !element.shouldAnimate) {
        return {
          opacity: 1,
          transform: "translateY(0)",
        };
      }

      const isComplete = animationStates[elementId] === "complete";

      return {
        opacity: isComplete ? 1 : 0,
        transform: isComplete ? "translateY(0)" : "translateY(20px)",
        transition: `opacity ${element.animationDuration}ms ${element.animationEasing} ${element.delay}ms, transform ${element.animationDuration}ms ${element.animationEasing} ${element.delay}ms`,
        animationFillMode: "forwards",
      };
    },
    [staggeredElements, animationStates]
  );

  /**
   * Get CSS animation class for a specific element
   */
  const getAnimationClass = useCallback(
    (elementId) => {
      const element = staggeredElements.find((el) => el.id === elementId);
      if (!element || !element.shouldAnimate) {
        return "";
      }

      const isComplete = animationStates[elementId] === "complete";
      const classes = ["stagger-animate"];

      if (isComplete) {
        classes.push("stagger-animate--complete");
      }

      return classes.join(" ");
    },
    [staggeredElements, animationStates]
  );

  /**
   * Create animation sequence for CSS animations
   */
  const createAnimationSequence = useCallback(() => {
    return staggeredElements.map((element) => ({
      elementId: element.id,
      delay: element.delay,
      duration: element.animationDuration,
      easing: element.animationEasing,
      keyframes: {
        from: {
          opacity: 0,
          transform: "translateY(20px) scale(0.95)",
        },
        to: {
          opacity: 1,
          transform: "translateY(0) scale(1)",
        },
      },
    }));
  }, [staggeredElements]);

  /**
   * Start animations manually
   */
  const startAnimations = useCallback(() => {
    if (!enabled) return;

    staggeredElements.forEach((element) => {
      setTimeout(() => {
        setAnimationStates((prev) => ({
          ...prev,
          [element.id]: "animating",
        }));

        // Mark as complete after animation duration
        setTimeout(() => {
          setAnimationStates((prev) => ({
            ...prev,
            [element.id]: "complete",
          }));
        }, element.animationDuration);
      }, element.delay);
    });
  }, [enabled, staggeredElements]);

  /**
   * Auto-start animations when in view
   */
  useEffect(() => {
    if (isInView && enabled) {
      startAnimations();
    }
  }, [isInView, enabled, startAnimations]);

  return {
    // Staggered elements with delays
    elements: staggeredElements,

    // Animation state
    isInView,
    allAnimationsComplete,
    animationStates,

    // Helper functions
    getAnimationStyles,
    getAnimationClass,
    createAnimationSequence,

    // Control functions
    startAnimations,
    resetAnimations,
    markAnimationComplete,

    // Configuration
    totalDuration:
      staggeredElements.length > 0
        ? Math.max(
            ...staggeredElements.map((el) => el.delay + el.animationDuration)
          )
        : 0,
  };
};

/**
 * Higher-order component for wrapping elements with stagger animation
 * @param {React.Component} Component - Component to wrap
 * @param {Object} animationOptions - Animation options
 * @returns {React.Component} - Wrapped component with stagger animation
 */
export const withStaggerAnimation = (Component, animationOptions = {}) => {
  return React.forwardRef((props, ref) => {
    const { elements = [], ...otherProps } = props;
    const animation = useStaggerAnimation(elements, 0, 150, animationOptions);

    return (
      <Component
        ref={ref}
        {...otherProps}
        staggerAnimation={animation}
        elements={animation.elements}
      />
    );
  });
};

/**
 * Preset animation configurations
 */
export const STAGGER_PRESETS = {
  // Fast entrance for dashboard cards
  dashboard: {
    baseDelay: 100,
    staggerDelay: 150,
    duration: 600,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Gentle entrance for content sections
  content: {
    baseDelay: 0,
    staggerDelay: 100,
    duration: 800,
    easing: "ease-out",
  },

  // Elegant entrance for menu items
  menu: {
    baseDelay: 0,
    staggerDelay: 50,
    duration: 400,
    easing: "ease-out",
  },

  // Smooth entrance for list items
  list: {
    baseDelay: 0,
    staggerDelay: 80,
    duration: 500,
    easing: "ease-out",
  },
};

/**
 * Utility function to create staggered CSS animations
 * @param {Array} elements - Elements to animate
 * @param {string} preset - Preset name
 * @returns {string} - CSS animation styles
 */
export const generateStaggerCSS = (elements, preset = "dashboard") => {
  const config = STAGGER_PRESETS[preset];
  if (!config) return "";

  return elements
    .map((element, index) => {
      const delay = config.baseDelay + index * config.staggerDelay;

      return `
      .stagger-${element.id} {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        animation: staggerEntrance ${config.duration}ms ${config.easing} ${delay}ms forwards;
      }
      
      @keyframes staggerEntrance {
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    })
    .join("\n");
};

export default useStaggerAnimation;
