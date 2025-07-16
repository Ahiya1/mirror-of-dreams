// src/components/dashboard/shared/ReflectionItem.jsx - Rich reflection preview with hover states

import React, { useState } from "react";
import PropTypes from "prop-types";

/**
 * Individual reflection item with rich preview and interactions
 * @param {Object} props - Component props
 * @param {Object} props.reflection - Reflection data
 * @param {number} props.index - Item index for stagger animation
 * @param {boolean} props.animated - Enable animations
 * @param {number} props.animationDelay - Base animation delay
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Reflection item component
 */
const ReflectionItem = ({
  reflection,
  index = 0,
  animated = true,
  animationDelay = 0,
  onClick,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Format reflection data with fallbacks
  const reflectionData = {
    id: reflection.id || index,
    title: reflection.title || "Sacred Reflection",
    preview: getReflectionPreview(reflection),
    timeAgo: reflection.timeAgo || formatTimeAgo(reflection.created_at),
    tone: reflection.tone || "fusion",
    isPremium: reflection.is_premium || false,
    createdAt: reflection.created_at,
  };

  /**
   * Format reflection preview text
   */
  function getReflectionPreview(reflection) {
    const text = reflection.dream || reflection.content || reflection.preview;
    if (!text) return "Your reflection content...";

    const maxLength = 80;
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  /**
   * Format time ago string
   */
  function formatTimeAgo(dateString) {
    if (!dateString) return "Recently";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: diffDays > 365 ? "numeric" : undefined,
    });
  }

  /**
   * Handle reflection click
   */
  const handleClick = () => {
    if (onClick) {
      onClick(reflection);
    } else {
      // Default navigation to reflection view
      window.location.href = `/reflections/view?id=${reflectionData.id}`;
    }
  };

  /**
   * Format tone name for display
   */
  const formatToneName = (tone) => {
    const toneNames = {
      gentle: "Gentle",
      intense: "Intense",
      fusion: "Fusion",
    };
    return toneNames[tone] || "Fusion";
  };

  return (
    <div
      className={`reflection-item ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: animated ? `${animationDelay + index * 100}ms` : "0ms",
      }}
    >
      {/* Reflection Header */}
      <div className="reflection-header">
        <div className="reflection-title" title={reflectionData.title}>
          {reflectionData.title}
        </div>
        <div className="reflection-date">{reflectionData.timeAgo}</div>
      </div>

      {/* Reflection Preview */}
      <div className="reflection-preview">{reflectionData.preview}</div>

      {/* Reflection Meta */}
      <div className="reflection-meta">
        <div
          className={`reflection-tone reflection-tone--${reflectionData.tone}`}
        >
          {formatToneName(reflectionData.tone)}
        </div>

        {reflectionData.isPremium && (
          <div className="reflection-premium">Premium</div>
        )}
      </div>

      {/* Hover indicator */}
      <div
        className={`reflection-hover-indicator ${isHovered ? "visible" : ""}`}
      >
        <span>→</span>
      </div>

      {/* Component styles */}
      <style jsx>{`
        .reflection-item {
          padding: var(--space-4);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: var(--transition-elegant);
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateX(-15px);
          animation: ${animated
            ? "reflectionSlide 0.6s ease-out forwards"
            : "none"};
        }

        @keyframes reflectionSlide {
          from {
            opacity: 0;
            transform: translateX(-15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .reflection-item::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.04) 0%,
            rgba(147, 51, 234, 0.02) 50%,
            rgba(255, 255, 255, 0.01) 100%
          );
          opacity: 0;
          transition: opacity var(--transition-smooth);
          border-radius: inherit;
        }

        .reflection-item:hover::before {
          opacity: 1;
        }

        .reflection-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateX(3px);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.04);
        }

        .reflection-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-2);
          gap: var(--space-md);
        }

        .reflection-title {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--cosmic-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          line-height: var(--leading-snug);
        }

        .reflection-date {
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
          flex-shrink: 0;
          opacity: 0.8;
          font-weight: var(--font-light);
        }

        .reflection-preview {
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-3);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-weight: var(--font-light);
        }

        .reflection-meta {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .reflection-tone {
          font-size: var(--text-xs);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-full);
          font-weight: var(--font-medium);
          text-transform: capitalize;
          transition: var(--transition-smooth);
        }

        .reflection-tone--fusion {
          background: rgba(251, 191, 36, 0.15);
          color: rgba(251, 191, 36, 0.9);
          border: 1px solid rgba(251, 191, 36, 0.2);
        }

        .reflection-tone--gentle {
          background: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .reflection-tone--intense {
          background: rgba(147, 51, 234, 0.15);
          color: rgba(196, 181, 253, 0.9);
          border: 1px solid rgba(147, 51, 234, 0.2);
        }

        .reflection-premium {
          font-size: var(--text-xs);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-lg);
          background: linear-gradient(
            135deg,
            rgba(245, 158, 11, 0.2),
            rgba(217, 119, 6, 0.15)
          );
          color: rgba(251, 191, 36, 0.9);
          font-weight: var(--font-medium);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .reflection-hover-indicator {
          position: absolute;
          top: 50%;
          right: var(--space-4);
          transform: translateY(-50%) translateX(10px);
          opacity: 0;
          transition: var(--transition-smooth);
          color: var(--cosmic-text-muted);
          font-size: var(--text-lg);
          pointer-events: none;
        }

        .reflection-hover-indicator.visible {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .reflection-item {
            padding: var(--space-3);
          }

          .reflection-header {
            margin-bottom: var(--space-2);
            gap: var(--space-sm);
          }

          .reflection-title {
            font-size: var(--text-xs);
          }

          .reflection-date {
            font-size: 10px;
          }

          .reflection-preview {
            font-size: var(--text-xs);
            margin-bottom: var(--space-2);
            -webkit-line-clamp: 3;
          }

          .reflection-meta {
            gap: var(--space-2);
          }

          .reflection-hover-indicator {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .reflection-item {
            padding: var(--space-2) var(--space-3);
          }

          .reflection-preview {
            -webkit-line-clamp: 2;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .reflection-item {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }

          .reflection-item:hover {
            transform: none !important;
          }

          .reflection-hover-indicator {
            transition: none !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .reflection-item {
            border-color: rgba(255, 255, 255, 0.3);
          }

          .reflection-item:hover {
            border-color: rgba(255, 255, 255, 0.5);
          }

          .reflection-title {
            color: rgba(255, 255, 255, 1);
          }
        }

        /* Focus visible for keyboard navigation */
        .reflection-item:focus-visible {
          outline: 2px solid rgba(147, 51, 234, 0.6);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

ReflectionItem.propTypes = {
  reflection: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    dream: PropTypes.string,
    content: PropTypes.string,
    preview: PropTypes.string,
    created_at: PropTypes.string,
    timeAgo: PropTypes.string,
    tone: PropTypes.string,
    is_premium: PropTypes.bool,
  }).isRequired,
  index: PropTypes.number,
  animated: PropTypes.bool,
  animationDelay: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default ReflectionItem;
