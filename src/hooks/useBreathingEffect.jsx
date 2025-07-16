// hooks/useBreathingEffect.js - Subtle breathing animations for living interfaces

import { useState, useEffect, useCallback, useRef, forwardRef } from "react";

/**
 * Custom hook for creating subtle breathing animations that make elements feel alive
 * @param {number} duration - Animation duration in milliseconds (0 disables animation)
 * @param {Object} options - Animation options
 * @returns {Object} - Animation styles and controls
 */
export const useBreathingEffect = (duration = 4000, options = {}) => {
  const {
    intensity = 0.02, // Scale intensity (0.02 = 2% scale change)
    opacityChange = 0.1, // Opacity change amount
    easing = "ease-in-out", // CSS easing function
    delay = 0, // Initial delay
    pauseOnHover = true, // Pause animation on hover
    reduceMotion = true, // Respect prefers-reduced-motion
  } = options;

  const [isActive, setIsActive] = useState(duration > 0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef(null);
  const animationNameRef = useRef(
    `breathing-${Math.random().toString(36).substr(2, 9)}`
  );

  /**
   * Check if user prefers reduced motion
   */
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  /**
   * Inject CSS keyframes into document
   */
  const injectKeyframes = useCallback(() => {
    if (
      !isActive ||
      duration <= 0 ||
      (reduceMotion && prefersReducedMotion.current)
    ) {
      return;
    }

    const animationName = animationNameRef.current;
    const scaleMax = 1 + intensity;
    const scaleMin = 1 - intensity;
    const opacityMax = Math.min(1, 1 + opacityChange);
    const opacityMin = Math.max(0, 1 - opacityChange);

    const keyframes = `
      @keyframes ${animationName} {
        0%, 100% {
          transform: scale(${scaleMin});
          opacity: ${opacityMin};
        }
        50% {
          transform: scale(${scaleMax});
          opacity: ${opacityMax};
        }
      }
    `;

    // Check if keyframes already exist
    const existingStyle = document.getElementById(`breathing-${animationName}`);
    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = `breathing-${animationName}`;
      style.textContent = keyframes;
      document.head.appendChild(style);

      // Store reference for cleanup
      animationRef.current = style;
    }
  }, [isActive, duration, intensity, opacityChange, reduceMotion]);

  /**
   * Generate breathing animation styles
   */
  const getAnimationStyles = useCallback(() => {
    if (
      !isActive ||
      duration <= 0 ||
      (reduceMotion && prefersReducedMotion.current)
    ) {
      return {
        animation: "none",
        transform: "none",
        opacity: 1,
      };
    }

    const shouldPause = pauseOnHover && isHovered;
    const animationName = animationNameRef.current;
    const playState = shouldPause || isPaused ? "paused" : "running";

    return {
      animation: `${animationName} ${duration}ms ${easing} ${delay}ms infinite`,
      animationPlayState: playState,
      transformOrigin: "center center",
    };
  }, [
    isActive,
    duration,
    easing,
    delay,
    isPaused,
    isHovered,
    pauseOnHover,
    reduceMotion,
  ]);

  /**
   * Start breathing animation
   */
  const startBreathing = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  /**
   * Stop breathing animation
   */
  const stopBreathing = useCallback(() => {
    setIsActive(false);
  }, []);

  /**
   * Pause breathing animation
   */
  const pauseBreathing = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Resume breathing animation
   */
  const resumeBreathing = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * Toggle breathing animation
   */
  const toggleBreathing = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  /**
   * Handle mouse enter for hover pause
   */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  /**
   * Handle mouse leave for hover resume
   */
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  /**
   * Get event handlers for hover pause functionality
   */
  const getHoverHandlers = useCallback(() => {
    if (!pauseOnHover) return {};

    return {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    };
  }, [pauseOnHover, handleMouseEnter, handleMouseLeave]);

  /**
   * Update animation on duration change
   */
  useEffect(() => {
    if (duration > 0) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [duration]);

  /**
   * Inject keyframes when animation becomes active
   */
  useEffect(() => {
    if (isActive) {
      injectKeyframes();
    }
  }, [isActive, injectKeyframes]);

  /**
   * Listen for reduced motion preference changes
   */
  useEffect(() => {
    if (typeof window === "undefined" || !reduceMotion) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e) => {
      prefersReducedMotion.current = e.matches;
      // Force re-render to update animation
      setIsActive((prev) => prev);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [reduceMotion]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.remove();
      }
    };
  }, []);

  return {
    // Animation styles
    ...getAnimationStyles(),

    // Control functions
    startBreathing,
    stopBreathing,
    pauseBreathing,
    resumeBreathing,
    toggleBreathing,

    // Event handlers
    ...getHoverHandlers(),

    // State
    isActive,
    isPaused,
    isHovered,

    // Utilities
    prefersReducedMotion: prefersReducedMotion.current,
  };
};

/**
 * Higher-order component for adding breathing effect to any component
 * @param {React.Component} Component - Component to wrap
 * @param {Object} breathingOptions - Breathing animation options
 * @returns {React.Component} - Wrapped component with breathing effect
 */
export const withBreathingEffect = (Component, breathingOptions = {}) => {
  return forwardRef((props, ref) => {
    const { duration = 4000, ...otherProps } = props;
    const breathing = useBreathingEffect(duration, breathingOptions);

    return (
      <Component
        ref={ref}
        {...otherProps}
        style={{
          ...props.style,
          animation: breathing.animation,
          animationPlayState: breathing.animationPlayState,
          transformOrigin: breathing.transformOrigin,
        }}
        {...breathing}
      />
    );
  });
};

/**
 * Preset breathing configurations for different use cases
 */
export const BREATHING_PRESETS = {
  // Subtle breathing for cards
  card: {
    duration: 4000,
    intensity: 0.015,
    opacityChange: 0.05,
    easing: "ease-in-out",
    pauseOnHover: true,
  },

  // Gentle breathing for backgrounds
  background: {
    duration: 8000,
    intensity: 0.01,
    opacityChange: 0.03,
    easing: "ease-in-out",
    pauseOnHover: false,
  },

  // Prominent breathing for focus elements
  focus: {
    duration: 3000,
    intensity: 0.03,
    opacityChange: 0.15,
    easing: "ease-in-out",
    pauseOnHover: true,
  },

  // Slow breathing for meditation-like elements
  meditation: {
    duration: 6000,
    intensity: 0.02,
    opacityChange: 0.1,
    easing: "ease-in-out",
    pauseOnHover: false,
  },

  // Fast breathing for active elements
  active: {
    duration: 2000,
    intensity: 0.025,
    opacityChange: 0.12,
    easing: "ease-in-out",
    pauseOnHover: true,
  },
};

/**
 * Utility function to create breathing animation with preset
 * @param {string} preset - Preset name
 * @param {Object} overrides - Options to override preset
 * @returns {Object} - Breathing animation hook result
 */
export const createBreathingEffect = (preset = "card", overrides = {}) => {
  const config = BREATHING_PRESETS[preset];
  if (!config) {
    console.warn(`Breathing preset "${preset}" not found. Using default.`);
    return useBreathingEffect(4000, overrides);
  }

  return useBreathingEffect(config.duration, { ...config, ...overrides });
};

/**
 * CSS class generator for breathing animations
 * @param {string} className - Base class name
 * @param {Object} options - Animation options
 * @returns {string} - CSS class definition
 */
export const generateBreathingCSS = (className, options = {}) => {
  const {
    duration = 4000,
    intensity = 0.02,
    opacityChange = 0.1,
    easing = "ease-in-out",
  } = options;

  const scaleMax = 1 + intensity;
  const scaleMin = 1 - intensity;
  const opacityMax = Math.min(1, 1 + opacityChange);
  const opacityMin = Math.max(0, 1 - opacityChange);

  return `
    .${className} {
      animation: ${className}-breathing ${duration}ms ${easing} infinite;
      transform-origin: center center;
    }

    .${className}:hover {
      animation-play-state: paused;
    }

    @keyframes ${className}-breathing {
      0%, 100% {
        transform: scale(${scaleMin});
        opacity: ${opacityMin};
      }
      50% {
        transform: scale(${scaleMax});
        opacity: ${opacityMax};
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .${className} {
        animation: none !important;
      }
    }
  `;
};

export default useBreathingEffect;
