// components/dashboard/shared/DashboardCard.jsx - Enhanced glass morphism base component

import React, { useState, useCallback, useRef } from "react";
import { useBreathingEffect } from "../../../hooks/useBreathingEffect";

/**
 * Enhanced dashboard card with luxury glass morphism and breathing animations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Card variant ('default', 'usage', 'evolution', 'reflections', 'subscription')
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.hasError - Error state
 * @param {boolean} props.isHoverable - Whether card should have hover effects
 * @param {boolean} props.breathe - Whether to apply breathing animation
 * @param {Function} props.onClick - Click handler
 * @param {number} props.animationDelay - Animation delay in milliseconds
 * @param {string} props.testId - Test ID for testing
 * @returns {JSX.Element} - Dashboard card component
 */
const DashboardCard = ({
  children,
  className = "",
  variant = "default",
  isLoading = false,
  hasError = false,
  isHoverable = true,
  breathe = false,
  onClick,
  animationDelay = 0,
  testId,
  ...rest
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const cardRef = useRef(null);

  // Apply breathing effect if enabled
  const breathingStyle = useBreathingEffect(breathe ? 4000 : 0);

  /**
   * Handle mouse enter with hover state
   */
  const handleMouseEnter = useCallback(() => {
    if (isHoverable && !isLoading) {
      setIsHovered(true);
    }
  }, [isHoverable, isLoading]);

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  /**
   * Handle mouse down for press effect
   */
  const handleMouseDown = useCallback(() => {
    if (isHoverable && !isLoading) {
      setIsPressed(true);
    }
  }, [isHoverable, isLoading]);

  /**
   * Handle mouse up
   */
  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  /**
   * Handle card click
   */
  const handleClick = useCallback(
    (e) => {
      if (onClick && !isLoading) {
        onClick(e);
      }
    },
    [onClick, isLoading]
  );

  /**
   * Get variant-specific styles
   */
  const getVariantStyles = useCallback(() => {
    const variants = {
      default: {
        background: "var(--glass-bg)",
        border: "var(--card-border)",
        accentColor: "rgba(255, 255, 255, 0.1)",
      },
      usage: {
        background:
          "linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(255, 255, 255, 0.03))",
        border: "1px solid rgba(59, 130, 246, 0.1)",
        accentColor: "rgba(59, 130, 246, 0.1)",
      },
      evolution: {
        background:
          "linear-gradient(135deg, rgba(147, 51, 234, 0.03), rgba(255, 255, 255, 0.03))",
        border: "1px solid rgba(147, 51, 234, 0.1)",
        accentColor: "rgba(147, 51, 234, 0.1)",
      },
      reflections: {
        background:
          "linear-gradient(135deg, rgba(251, 191, 36, 0.03), rgba(255, 255, 255, 0.03))",
        border: "1px solid rgba(251, 191, 36, 0.1)",
        accentColor: "rgba(251, 191, 36, 0.1)",
      },
      subscription: {
        background:
          "linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(255, 255, 255, 0.03))",
        border: "1px solid rgba(16, 185, 129, 0.1)",
        accentColor: "rgba(16, 185, 129, 0.1)",
      },
    };

    return variants[variant] || variants.default;
  }, [variant]);

  /**
   * Get combined styles
   */
  const getCardStyles = useCallback(() => {
    const variantStyles = getVariantStyles();
    const baseTransform = `translateY(${animationDelay ? "-20px" : "0"})`;
    const hoverTransform = isHovered
      ? "translateY(-8px) scale(1.02)"
      : "translateY(-4px)";
    const pressTransform = isPressed ? "translateY(-2px) scale(0.98)" : "";

    return {
      ...breathingStyle,
      background: variantStyles.background,
      border: variantStyles.border,
      transform: isHovered
        ? hoverTransform
        : isPressed
        ? pressTransform
        : baseTransform,
      opacity: animationDelay ? 0 : 1,
      animation: animationDelay
        ? `cardEntrance 0.8s ease-out ${animationDelay}ms forwards`
        : breathingStyle.animation,
      boxShadow: isHovered
        ? "0 25px 50px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)"
        : "0 8px 32px rgba(0, 0, 0, 0.12)",
      "--accent-color": variantStyles.accentColor,
    };
  }, [getVariantStyles, breathingStyle, animationDelay, isHovered, isPressed]);

  /**
   * Get card classes
   */
  const getCardClasses = useCallback(() => {
    const classes = ["dashboard-card", `dashboard-card--${variant}`, className];

    if (isLoading) classes.push("dashboard-card--loading");
    if (hasError) classes.push("dashboard-card--error");
    if (isHoverable) classes.push("dashboard-card--hoverable");
    if (isHovered) classes.push("dashboard-card--hovered");
    if (isPressed) classes.push("dashboard-card--pressed");
    if (breathe) classes.push("dashboard-card--breathing");
    if (onClick) classes.push("dashboard-card--clickable");

    return classes.filter(Boolean).join(" ");
  }, [
    variant,
    className,
    isLoading,
    hasError,
    isHoverable,
    isHovered,
    isPressed,
    breathe,
    onClick,
  ]);

  return (
    <div
      ref={cardRef}
      className={getCardClasses()}
      style={getCardStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid={testId}
      {...rest}
    >
      {/* Shimmer effect overlay */}
      <div className="dashboard-card__shimmer" />

      {/* Accent border */}
      <div className="dashboard-card__accent" />

      {/* Content container */}
      <div className="dashboard-card__content">{children}</div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="dashboard-card__loading">
          <div className="cosmic-spinner" />
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="dashboard-card__error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">Unable to load</div>
        </div>
      )}

      {/* Inline styles for card-specific animations */}
      <style jsx>{`
        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cardBreathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes shimmerMove {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(200%) translateY(200%) rotate(45deg);
            opacity: 0;
          }
        }

        .dashboard-card {
          position: relative;
          border-radius: var(--card-radius);
          backdrop-filter: blur(40px) saturate(130%);
          transition: all var(--transition-elegant);
          overflow: hidden;
          cursor: ${onClick ? "pointer" : "default"};
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .dashboard-card--breathing {
          animation: cardBreathe 4s ease-in-out infinite;
        }

        .dashboard-card--hoverable:hover .dashboard-card__shimmer {
          animation: shimmerMove 2s ease-out;
        }

        .dashboard-card--clickable:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.4);
          outline-offset: 2px;
        }

        .dashboard-card__shimmer {
          position: absolute;
          inset: -20%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          );
          pointer-events: none;
          opacity: 0;
        }

        .dashboard-card__accent {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            var(--accent-color) 0%,
            transparent 50%
          );
          border-radius: var(--card-radius);
          opacity: 0;
          transition: opacity var(--transition-smooth);
          pointer-events: none;
        }

        .dashboard-card--hovered .dashboard-card__accent {
          opacity: 1;
        }

        .dashboard-card__content {
          position: relative;
          z-index: 2;
          height: 100%;
          padding: var(--card-padding);
          display: flex;
          flex-direction: column;
        }

        .dashboard-card__loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 15, 35, 0.8);
          backdrop-filter: blur(20px);
          border-radius: var(--card-radius);
          z-index: 10;
        }

        .dashboard-card__error {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--card-radius);
          z-index: 10;
        }

        .error-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .error-message {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
        }

        .cosmic-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: rgba(147, 51, 234, 0.7);
          border-right-color: rgba(59, 130, 246, 0.5);
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .dashboard-card {
            border-radius: var(--radius-2xl);
          }

          .dashboard-card__content {
            padding: var(--space-4);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .dashboard-card {
            animation: none !important;
            transition: none !important;
          }

          .dashboard-card--breathing {
            animation: none !important;
          }

          .dashboard-card__shimmer {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardCard;
