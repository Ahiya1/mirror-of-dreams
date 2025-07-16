// src/components/dashboard/shared/ProgressRing.jsx - Animated circular progress with breathing effects

import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";

/**
 * Animated circular progress ring with customizable styling
 * @param {Object} props - Component props
 * @param {number} props.percentage - Progress percentage (0-100)
 * @param {string} props.size - Size variant ('sm', 'md', 'lg', 'xl')
 * @param {number} props.strokeWidth - Width of the progress stroke
 * @param {boolean} props.animated - Enable animations
 * @param {string} props.color - Color theme ('primary', 'success', 'warning', 'error')
 * @param {boolean} props.showValue - Show percentage value in center
 * @param {string|number} props.valueFormatter - Custom formatted value or formatter function
 * @param {number} props.animationDelay - Animation delay in ms
 * @param {boolean} props.breathing - Enable breathing animation
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Progress ring component
 */
const ProgressRing = ({
  percentage = 0,
  size = "md",
  strokeWidth = 4,
  animated = true,
  color = "primary",
  showValue = false,
  valueFormatter = null,
  animationDelay = 0,
  breathing = false,
  className = "",
}) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Size configurations
  const sizeConfig = useMemo(() => {
    const configs = {
      sm: { radius: 30, viewBox: 80, fontSize: "12px" },
      md: { radius: 40, viewBox: 100, fontSize: "14px" },
      lg: { radius: 50, viewBox: 120, fontSize: "16px" },
      xl: { radius: 60, viewBox: 140, fontSize: "18px" },
    };
    return configs[size] || configs.md;
  }, [size]);

  // Color configurations
  const colorConfig = useMemo(() => {
    const configs = {
      primary: {
        stroke: "rgba(147, 51, 234, 0.8)",
        background: "rgba(255, 255, 255, 0.08)",
        glow: "rgba(147, 51, 234, 0.3)",
        text: "rgba(196, 181, 253, 0.9)",
      },
      success: {
        stroke: "rgba(16, 185, 129, 0.8)",
        background: "rgba(255, 255, 255, 0.08)",
        glow: "rgba(16, 185, 129, 0.3)",
        text: "rgba(110, 231, 183, 0.9)",
      },
      warning: {
        stroke: "rgba(245, 158, 11, 0.8)",
        background: "rgba(255, 255, 255, 0.08)",
        glow: "rgba(245, 158, 11, 0.3)",
        text: "rgba(251, 191, 36, 0.9)",
      },
      error: {
        stroke: "rgba(239, 68, 68, 0.8)",
        background: "rgba(255, 255, 255, 0.08)",
        glow: "rgba(239, 68, 68, 0.3)",
        text: "rgba(248, 113, 113, 0.9)",
      },
    };
    return configs[color] || configs.primary;
  }, [color]);

  // Calculate SVG path properties
  const { radius, viewBox } = sizeConfig;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (displayPercentage / 100) * circumference;

  // Animation entrance effect
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, animationDelay);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animated, animationDelay]);

  // Animate percentage change
  useEffect(() => {
    if (!isVisible) return;

    const targetPercentage = Math.min(Math.max(percentage, 0), 100);

    if (!animated) {
      setDisplayPercentage(targetPercentage);
      return;
    }

    const duration = 2000; // 2 seconds
    const steps = 60; // 60 FPS
    const stepDuration = duration / steps;
    const stepValue = (targetPercentage - displayPercentage) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setDisplayPercentage((prev) => {
        const newValue = prev + stepValue;
        if (currentStep >= steps) {
          clearInterval(timer);
          return targetPercentage;
        }
        return newValue;
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [percentage, animated, isVisible]);

  // Format display value
  const getDisplayValue = () => {
    if (valueFormatter) {
      if (typeof valueFormatter === "function") {
        return valueFormatter(displayPercentage);
      }
      return valueFormatter;
    }
    return `${Math.round(displayPercentage)}%`;
  };

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  return (
    <div
      className={`progress-ring progress-ring--${size} progress-ring--${color} ${className} ${
        breathing && !prefersReducedMotion ? "progress-ring--breathing" : ""
      }`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.9)",
        transition:
          animated && !prefersReducedMotion ? "all 0.6s ease-out" : "none",
      }}
    >
      <svg
        width={viewBox}
        height={viewBox}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        className="progress-ring__svg"
      >
        {/* Background circle */}
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.background}
          strokeWidth={strokeWidth}
          className="progress-ring__background"
        />

        {/* Progress circle */}
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-ring__progress"
          style={{
            transition:
              animated && !prefersReducedMotion
                ? "stroke-dashoffset 2s ease-out"
                : "none",
            filter: `drop-shadow(0 0 8px ${colorConfig.glow})`,
          }}
          transform={`rotate(-90 ${viewBox / 2} ${viewBox / 2})`}
        />

        {/* Animated glow effect */}
        {animated && !prefersReducedMotion && (
          <circle
            cx={viewBox / 2}
            cy={viewBox / 2}
            r={radius}
            fill="none"
            stroke={colorConfig.glow}
            strokeWidth={strokeWidth + 2}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-ring__glow"
            style={{
              transition: "stroke-dashoffset 2s ease-out",
              opacity: 0.6,
            }}
            transform={`rotate(-90 ${viewBox / 2} ${viewBox / 2})`}
          />
        )}
      </svg>

      {/* Center value display */}
      {showValue && (
        <div
          className="progress-ring__value"
          style={{
            fontSize: sizeConfig.fontSize,
            color: colorConfig.text,
          }}
        >
          {getDisplayValue()}
        </div>
      )}

      {/* Component styles */}
      <style jsx>{`
        .progress-ring {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .progress-ring__svg {
          display: block;
          max-width: 100%;
          height: auto;
        }

        .progress-ring__background {
          opacity: 0.3;
        }

        .progress-ring__progress {
          transition: stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-ring__glow {
          transition: stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1);
          animation: ringGlow 3s ease-in-out infinite;
        }

        .progress-ring__value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: 600;
          text-align: center;
          line-height: 1;
          pointer-events: none;
          text-shadow: 0 0 10px currentColor;
        }

        .progress-ring--breathing {
          animation: progressBreathing 4s ease-in-out infinite;
        }

        @keyframes ringGlow {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes progressBreathing {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        /* Size variations */
        .progress-ring--sm {
          width: 80px;
          height: 80px;
        }

        .progress-ring--md {
          width: 100px;
          height: 100px;
        }

        .progress-ring--lg {
          width: 120px;
          height: 120px;
        }

        .progress-ring--xl {
          width: 140px;
          height: 140px;
        }

        /* Hover effects */
        .progress-ring:hover .progress-ring__progress {
          filter: drop-shadow(0 0 12px ${colorConfig.glow});
        }

        .progress-ring:hover .progress-ring__value {
          transform: translate(-50%, -50%) scale(1.05);
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .progress-ring,
          .progress-ring__progress,
          .progress-ring__glow,
          .progress-ring__value {
            animation: none !important;
            transition: none !important;
          }

          .progress-ring--breathing {
            animation: none !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .progress-ring__background {
            opacity: 0.6;
            stroke-width: ${strokeWidth + 1}px;
          }

          .progress-ring__progress {
            stroke-width: ${strokeWidth + 1}px;
          }
        }
      `}</style>
    </div>
  );
};

ProgressRing.propTypes = {
  percentage: PropTypes.number,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  strokeWidth: PropTypes.number,
  animated: PropTypes.bool,
  color: PropTypes.oneOf(["primary", "success", "warning", "error"]),
  showValue: PropTypes.bool,
  valueFormatter: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.func,
  ]),
  animationDelay: PropTypes.number,
  breathing: PropTypes.bool,
  className: PropTypes.string,
};

export default ProgressRing;
