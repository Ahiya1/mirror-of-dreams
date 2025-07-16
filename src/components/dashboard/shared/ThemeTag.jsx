// src/components/dashboard/shared/ThemeTag.jsx - Evolution theme display with icons

import React from "react";
import PropTypes from "prop-types";

/**
 * Evolution theme tag component with icon and hover effects
 * @param {Object} props - Component props
 * @param {Object} props.theme - Theme object with name and icon
 * @param {boolean} props.animated - Enable animations
 * @param {number} props.animationDelay - Animation delay in ms
 * @param {string} props.size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} props.clickable - Enable click interactions
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Theme tag component
 */
const ThemeTag = ({
  theme,
  animated = true,
  animationDelay = 0,
  size = "md",
  clickable = false,
  onClick,
  className = "",
}) => {
  // Theme data with fallbacks
  const themeData = {
    name: theme?.name || theme?.displayName || "Unknown Theme",
    icon: theme?.icon || getDefaultIcon(theme?.name),
    displayName: theme?.displayName || theme?.name || "Unknown Theme",
  };

  /**
   * Get default icon for theme name
   */
  function getDefaultIcon(themeName) {
    const themeIcons = {
      "Entrepreneurial Vision": "🚀",
      "Creative Expression": "🎨",
      "Service & Impact": "🌟",
      "Connection & Love": "💕",
      "Freedom & Independence": "🦅",
      "Growth & Learning": "🌱",
      "Leadership & Authority": "👑",
      "Spiritual Development": "🕯️",
      "Adventure & Exploration": "🗺️",
      "Security & Stability": "🏠",
      "Personal Development": "✨",
      "Emotional Healing": "💙",
      "Creative Flow": "🌊",
      "Inner Wisdom": "🔮",
      Transformation: "🦋",
    };

    return themeIcons[themeName] || "✨";
  }

  /**
   * Handle click event
   */
  const handleClick = () => {
    if (clickable && onClick) {
      onClick(theme);
    }
  };

  /**
   * Get size classes
   */
  const getSizeClasses = () => {
    const sizeClasses = {
      sm: "theme-tag--sm",
      md: "theme-tag--md",
      lg: "theme-tag--lg",
    };
    return sizeClasses[size] || sizeClasses.md;
  };

  return (
    <div
      className={`theme-tag ${getSizeClasses()} ${
        clickable ? "theme-tag--clickable" : ""
      } ${className}`}
      onClick={handleClick}
      style={{
        animationDelay: animated ? `${animationDelay}ms` : "0ms",
      }}
      title={themeData.displayName}
    >
      <span className="theme-icon">{themeData.icon}</span>
      <span className="theme-name">{themeData.displayName}</span>

      {/* Component styles */}
      <style jsx>{`
        .theme-tag {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-xl);
          font-size: var(--text-xs);
          color: var(--cosmic-text-secondary);
          transition: var(--transition-smooth);
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(10px) scale(0.95);
          animation: ${animated
            ? "themeTagEntrance 0.6s ease-out forwards"
            : "none"};
        }

        @keyframes themeTagEntrance {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .theme-tag::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.1) 0%,
            rgba(59, 130, 246, 0.05) 50%,
            rgba(16, 185, 129, 0.03) 100%
          );
          opacity: 0;
          transition: opacity var(--transition-smooth);
          border-radius: inherit;
        }

        .theme-tag:hover::before {
          opacity: 1;
        }

        .theme-tag:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: var(--cosmic-text);
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.05);
        }

        .theme-tag--clickable {
          cursor: pointer;
        }

        .theme-tag--clickable:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.08);
        }

        .theme-tag--clickable:active {
          transform: translateY(0) scale(1.02);
        }

        .theme-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          line-height: 1;
          transition: transform var(--transition-smooth);
        }

        .theme-tag:hover .theme-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .theme-name {
          font-weight: var(--font-medium);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: var(--leading-none);
          letter-spacing: 0.2px;
        }

        /* Size variants */
        .theme-tag--sm {
          padding: var(--space-1) var(--space-2);
          gap: var(--space-1);
          font-size: 10px;
          border-radius: var(--radius-lg);
        }

        .theme-tag--sm .theme-icon {
          font-size: 12px;
        }

        .theme-tag--md {
          padding: var(--space-2) var(--space-3);
          gap: var(--space-2);
          font-size: var(--text-xs);
        }

        .theme-tag--md .theme-icon {
          font-size: var(--text-sm);
        }

        .theme-tag--lg {
          padding: var(--space-3) var(--space-4);
          gap: var(--space-3);
          font-size: var(--text-sm);
          border-radius: var(--radius-2xl);
        }

        .theme-tag--lg .theme-icon {
          font-size: var(--text-base);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .theme-tag {
            padding: var(--space-1) var(--space-2);
            gap: var(--space-1);
            font-size: 10px;
          }

          .theme-icon {
            font-size: 12px;
          }

          .theme-name {
            max-width: 80px;
          }
        }

        @media (max-width: 480px) {
          .theme-tag {
            padding: var(--space-1);
            gap: var(--space-1);
          }

          .theme-name {
            max-width: 60px;
            font-size: 9px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .theme-tag {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }

          .theme-tag:hover,
          .theme-tag--clickable:hover {
            transform: none !important;
          }

          .theme-tag:hover .theme-icon {
            transform: none !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .theme-tag {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
          }

          .theme-tag:hover {
            border-color: rgba(255, 255, 255, 0.5);
            background: rgba(255, 255, 255, 0.15);
          }

          .theme-name {
            color: rgba(255, 255, 255, 1);
          }
        }

        /* Focus visible for keyboard navigation */
        .theme-tag--clickable:focus-visible {
          outline: 2px solid rgba(147, 51, 234, 0.6);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

ThemeTag.propTypes = {
  theme: PropTypes.shape({
    name: PropTypes.string,
    displayName: PropTypes.string,
    icon: PropTypes.string,
  }).isRequired,
  animated: PropTypes.bool,
  animationDelay: PropTypes.number,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default ThemeTag;
