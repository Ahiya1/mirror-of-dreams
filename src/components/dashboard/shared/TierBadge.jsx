// src/components/dashboard/shared/TierBadge.jsx - Subscription tier badges with glow effects

import React from "react";
import PropTypes from "prop-types";

/**
 * Tier badge component with glow effects and animations
 * @param {Object} props - Component props
 * @param {string} props.tier - Tier name ('free', 'essential', 'premium', 'creator')
 * @param {string} props.size - Size variant ('sm', 'md', 'lg', 'xl')
 * @param {boolean} props.animated - Enable animations
 * @param {boolean} props.showGlow - Show glow effect
 * @param {boolean} props.showIcon - Show tier icon
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Tier badge component
 */
const TierBadge = ({
  tier = "free",
  size = "md",
  animated = true,
  showGlow = false,
  showIcon = true,
  className = "",
}) => {
  /**
   * Get tier configuration
   */
  const getTierConfig = () => {
    const configs = {
      free: {
        name: "Free",
        icon: "👤",
        background: "rgba(255, 255, 255, 0.1)",
        border: "rgba(255, 255, 255, 0.2)",
        color: "rgba(255, 255, 255, 0.9)",
        glow: "rgba(255, 255, 255, 0.15)",
      },
      essential: {
        name: "Essential",
        icon: "✨",
        background:
          "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))",
        border: "rgba(16, 185, 129, 0.3)",
        color: "rgba(110, 231, 183, 0.9)",
        glow: "rgba(16, 185, 129, 0.3)",
      },
      premium: {
        name: "Premium",
        icon: "💎",
        background:
          "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.15))",
        border: "rgba(245, 158, 11, 0.3)",
        color: "rgba(251, 191, 36, 0.9)",
        glow: "rgba(245, 158, 11, 0.4)",
      },
      creator: {
        name: "Creator",
        icon: "🌟",
        background:
          "linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.15))",
        border: "rgba(147, 51, 234, 0.3)",
        color: "rgba(196, 181, 253, 0.9)",
        glow: "rgba(147, 51, 234, 0.4)",
      },
    };

    return configs[tier] || configs.free;
  };

  /**
   * Get size configuration
   */
  const getSizeConfig = () => {
    const configs = {
      sm: {
        padding: "var(--space-1) var(--space-2)",
        fontSize: "10px",
        iconSize: "12px",
        borderRadius: "var(--radius-lg)",
        letterSpacing: "0.3px",
      },
      md: {
        padding: "var(--space-2) var(--space-4)",
        fontSize: "var(--text-xs)",
        iconSize: "var(--text-sm)",
        borderRadius: "var(--radius-xl)",
        letterSpacing: "0.5px",
      },
      lg: {
        padding: "var(--space-3) var(--space-5)",
        fontSize: "var(--text-sm)",
        iconSize: "var(--text-base)",
        borderRadius: "var(--radius-2xl)",
        letterSpacing: "0.8px",
      },
      xl: {
        padding: "var(--space-4) var(--space-6)",
        fontSize: "var(--text-base)",
        iconSize: "var(--text-lg)",
        borderRadius: "var(--radius-3xl)",
        letterSpacing: "1px",
      },
    };

    return configs[size] || configs.md;
  };

  const tierConfig = getTierConfig();
  const sizeConfig = getSizeConfig();

  return (
    <div
      className={`tier-badge tier-badge--${tier} tier-badge--${size} ${
        showGlow ? "tier-badge--glow" : ""
      } ${className}`}
    >
      {showIcon && <span className="tier-icon">{tierConfig.icon}</span>}

      <span className="tier-name">{tierConfig.name}</span>

      {/* Glow effect overlay */}
      {showGlow && <div className="tier-glow" />}

      {/* Component styles */}
      <style jsx>{`
        .tier-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: ${sizeConfig.padding};
          background: ${tierConfig.background};
          border: 1px solid ${tierConfig.border};
          border-radius: ${sizeConfig.borderRadius};
          color: ${tierConfig.color};
          font-size: ${sizeConfig.fontSize};
          font-weight: var(--font-medium);
          text-transform: uppercase;
          letter-spacing: ${sizeConfig.letterSpacing};
          position: relative;
          overflow: hidden;
          transition: var(--transition-elegant);
          opacity: 0;
          transform: scale(0.9);
          animation: ${animated
            ? "tierBadgeEntrance 0.8s ease-out forwards"
            : "none"};
        }

        @keyframes tierBadgeEntrance {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          60% {
            opacity: 0.8;
            transform: scale(1.05) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .tier-badge::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .tier-badge:hover::before {
          transform: translateX(100%);
        }

        .tier-badge:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 8px 25px ${tierConfig.glow};
          border-color: ${tierConfig.border.replace("0.3", "0.4")};
        }

        .tier-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: ${sizeConfig.iconSize};
          line-height: 1;
          animation: ${animated
            ? "tierIconFloat 3s ease-in-out infinite"
            : "none"};
        }

        @keyframes tierIconFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-2px) rotate(5deg);
          }
        }

        .tier-name {
          font-weight: var(--font-semibold);
          line-height: 1;
        }

        .tier-glow {
          position: absolute;
          inset: -2px;
          background: ${tierConfig.background};
          border-radius: ${sizeConfig.borderRadius};
          filter: blur(8px);
          opacity: 0.6;
          z-index: -1;
          animation: ${animated ? "tierGlow 2s ease-in-out infinite" : "none"};
        }

        @keyframes tierGlow {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        /* Tier-specific enhancements */
        .tier-badge--premium {
          background: linear-gradient(
            135deg,
            rgba(245, 158, 11, 0.25) 0%,
            rgba(217, 119, 6, 0.15) 50%,
            rgba(251, 191, 36, 0.1) 100%
          );
        }

        .tier-badge--creator {
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.25) 0%,
            rgba(99, 102, 241, 0.15) 50%,
            rgba(59, 130, 246, 0.1) 100%
          );
        }

        .tier-badge--essential {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.25) 0%,
            rgba(5, 150, 105, 0.15) 50%,
            rgba(110, 231, 183, 0.1) 100%
          );
        }

        /* Size-specific adjustments */
        .tier-badge--sm {
          gap: var(--space-1);
        }

        .tier-badge--lg,
        .tier-badge--xl {
          gap: var(--space-3);
        }

        .tier-badge--xl .tier-name {
          font-weight: var(--font-bold);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .tier-badge--lg {
            padding: var(--space-2) var(--space-4);
            font-size: var(--text-xs);
          }

          .tier-badge--xl {
            padding: var(--space-3) var(--space-5);
            font-size: var(--text-sm);
          }
        }

        @media (max-width: 480px) {
          .tier-badge {
            gap: var(--space-1);
          }

          .tier-badge--lg,
          .tier-badge--xl {
            gap: var(--space-2);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .tier-badge,
          .tier-icon,
          .tier-glow {
            animation: none !important;
          }

          .tier-badge {
            opacity: 1 !important;
            transform: none !important;
          }

          .tier-badge:hover {
            transform: none !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .tier-badge {
            border-width: 2px;
            background: ${tierConfig.background.replace(/0\.\d+/g, "0.3")};
          }

          .tier-name {
            color: rgba(255, 255, 255, 1);
          }
        }

        /* Focus visible for keyboard navigation */
        .tier-badge:focus-visible {
          outline: 2px solid ${tierConfig.border};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

TierBadge.propTypes = {
  tier: PropTypes.oneOf(["free", "essential", "premium", "creator"]),
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  animated: PropTypes.bool,
  showGlow: PropTypes.bool,
  showIcon: PropTypes.bool,
  className: PropTypes.string,
};

export default TierBadge;
