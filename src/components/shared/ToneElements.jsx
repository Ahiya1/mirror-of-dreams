// components/shared/ToneElements.jsx - Enhanced tone-specific visual elements

import React, { useEffect, useState, useMemo } from "react";

/**
 * Enhanced tone elements with accessibility support and performance optimization
 * @param {Object} props - Component props
 * @param {string} props.tone - Current tone ('fusion', 'gentle', 'intense')
 * @param {number} props.intensity - Animation intensity (0-1)
 * @param {boolean} props.animated - Whether to enable animations
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Tone elements component
 */
const ToneElements = ({
  tone = "fusion",
  intensity = 1,
  animated = true,
  className = "",
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Check for page visibility to pause animations when tab is not active
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Generate elements based on tone
  const elements = useMemo(() => {
    const shouldAnimate = animated && !prefersReducedMotion && isVisible;
    const newElements = [];

    if (tone === "fusion") {
      // Create fusion breath elements
      for (let i = 0; i < Math.ceil(6 * intensity); i++) {
        newElements.push({
          id: `fusion-${i}`,
          type: "fusion-breath",
          style: {
            width: `${(200 + Math.random() * 140) * intensity}px`,
            height: `${(200 + Math.random() * 140) * intensity}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 4.2}s`,
            animationDuration: `${20 + Math.random() * 10}s`,
            animationPlayState: shouldAnimate ? "running" : "paused",
            opacity: intensity,
          },
        });
      }
    } else if (tone === "gentle") {
      // Create gentle star elements
      for (let i = 0; i < Math.ceil(35 * intensity); i++) {
        newElements.push({
          id: `gentle-${i}`,
          type: "gentle-star",
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${8 + Math.random() * 6}s`,
            animationPlayState: shouldAnimate ? "running" : "paused",
            opacity: intensity * 0.8,
          },
        });
      }
    } else if (tone === "intense") {
      // Create intense swirl elements
      for (let i = 0; i < Math.ceil(7 * intensity); i++) {
        newElements.push({
          id: `intense-${i}`,
          type: "intense-swirl",
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 3.5}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
            animationPlayState: shouldAnimate ? "running" : "paused",
            opacity: intensity,
          },
        });
      }
    }

    return newElements;
  }, [tone, intensity, animated, prefersReducedMotion, isVisible]);

  // Don't render if intensity is too low or no elements
  if (intensity <= 0 || elements.length === 0) {
    return null;
  }

  return (
    <div
      className={`tone-elements ${className}`}
      aria-hidden="true"
      data-tone={tone}
    >
      {elements.map((element) => (
        <div key={element.id} className={element.type} style={element.style} />
      ))}

      {/* Accessibility: Screen reader description */}
      <div className="sr-only">
        {tone === "fusion" && "Sacred fusion visual elements active"}
        {tone === "gentle" && "Gentle clarity visual elements active"}
        {tone === "intense" && "Luminous intensity visual elements active"}
      </div>
    </div>
  );
};

export default ToneElements;
