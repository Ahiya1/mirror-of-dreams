// src/components/dashboard/shared/LoadingStates.jsx - Cosmic-themed loading experiences

import React from "react";

/**
 * Cosmic spinner with breathing animation
 * @param {Object} props - Component props
 * @param {string} props.size - Size variant ('sm', 'md', 'lg', 'xl')
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Cosmic spinner component
 */
export const CosmicSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "cosmic-spinner--sm",
    md: "cosmic-spinner--md",
    lg: "cosmic-spinner--lg",
    xl: "cosmic-spinner--xl",
  };

  return (
    <div className={`cosmic-spinner ${sizeClasses[size]} ${className}`}>
      <div className="cosmic-spinner__outer" />
      <div className="cosmic-spinner__inner" />
      <div className="cosmic-spinner__core" />

      <style jsx>{`
        .cosmic-spinner {
          position: relative;
          display: inline-block;
          animation: cosmicBreath 3s ease-in-out infinite;
        }

        .cosmic-spinner--sm {
          width: 24px;
          height: 24px;
        }

        .cosmic-spinner--md {
          width: 40px;
          height: 40px;
        }

        .cosmic-spinner--lg {
          width: 60px;
          height: 60px;
        }

        .cosmic-spinner--xl {
          width: 80px;
          height: 80px;
        }

        .cosmic-spinner__outer,
        .cosmic-spinner__inner,
        .cosmic-spinner__core {
          position: absolute;
          border-radius: 50%;
          border: 2px solid transparent;
        }

        .cosmic-spinner__outer {
          inset: 0;
          border-top-color: rgba(147, 51, 234, 0.8);
          border-right-color: rgba(147, 51, 234, 0.4);
          animation: spin 2s linear infinite;
        }

        .cosmic-spinner__inner {
          inset: 25%;
          border-left-color: rgba(59, 130, 246, 0.7);
          border-bottom-color: rgba(59, 130, 246, 0.3);
          animation: spin 1.5s linear infinite reverse;
        }

        .cosmic-spinner__core {
          inset: 45%;
          border: 1px solid rgba(16, 185, 129, 0.6);
          border-top-color: transparent;
          border-bottom-color: transparent;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes cosmicBreath {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cosmic-spinner,
          .cosmic-spinner__outer,
          .cosmic-spinner__inner,
          .cosmic-spinner__core {
            animation: none;
          }

          .cosmic-spinner__outer {
            border-color: rgba(147, 51, 234, 0.6);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Skeleton loader for text content
 * @param {Object} props - Component props
 * @param {number} props.lines - Number of lines to show
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Skeleton text component
 */
export const SkeletonText = ({ lines = 3, className = "" }) => {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="skeleton-text__line"
          style={{
            width: index === lines - 1 ? "70%" : "100%",
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}

      <style jsx>{`
        .skeleton-text {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .skeleton-text__line {
          height: 16px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border-radius: var(--radius-sm);
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            opacity: 0.6;
            transform: translateX(-100%);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-text__line {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Loading state for usage card
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Usage card skeleton
 */
export const UsageCardSkeleton = ({ className = "" }) => {
  return (
    <div className={`usage-skeleton ${className}`}>
      <div className="usage-skeleton__header">
        <div className="skeleton-icon" />
        <div className="skeleton-title" />
      </div>

      <div className="usage-skeleton__content">
        <div className="usage-skeleton__chart">
          <div className="skeleton-circle" />
        </div>

        <div className="usage-skeleton__stats">
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
        </div>
      </div>

      <style jsx>{`
        .usage-skeleton {
          padding: var(--space-xl);
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .usage-skeleton__header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .skeleton-icon {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.1)
          );
          animation: shimmer 2s ease-in-out infinite;
        }

        .skeleton-title {
          width: 120px;
          height: 20px;
          border-radius: var(--radius-sm);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.1)
          );
          animation: shimmer 2s ease-in-out infinite 0.1s;
        }

        .usage-skeleton__content {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          flex: 1;
        }

        .usage-skeleton__chart {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .skeleton-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(147, 51, 234, 0.2) 0%,
            rgba(147, 51, 234, 0.1) 25%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(147, 51, 234, 0.1) 75%,
            rgba(147, 51, 234, 0.2) 100%
          );
          animation: rotateGlow 3s linear infinite;
          position: relative;
        }

        .skeleton-circle::after {
          content: "";
          position: absolute;
          inset: 20px;
          border-radius: 50%;
          background: var(--cosmic-bg);
        }

        .usage-skeleton__stats {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .skeleton-stat {
          height: 16px;
          border-radius: var(--radius-sm);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.1)
          );
          animation: shimmer 2s ease-in-out infinite;
        }

        .skeleton-stat:nth-child(1) {
          width: 90%;
          animation-delay: 0.2s;
        }

        .skeleton-stat:nth-child(2) {
          width: 75%;
          animation-delay: 0.3s;
        }

        .skeleton-stat:nth-child(3) {
          width: 85%;
          animation-delay: 0.4s;
        }

        @keyframes rotateGlow {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-circle,
          .skeleton-icon,
          .skeleton-title,
          .skeleton-stat {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Loading state for reflections card
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Reflections card skeleton
 */
export const ReflectionsCardSkeleton = ({ className = "" }) => {
  return (
    <div className={`reflections-skeleton ${className}`}>
      <div className="reflections-skeleton__header">
        <div className="skeleton-icon" />
        <div className="skeleton-title" />
      </div>

      <div className="reflections-skeleton__list">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="reflection-item-skeleton"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="reflection-item-skeleton__header">
              <div className="skeleton-reflection-title" />
              <div className="skeleton-reflection-date" />
            </div>
            <div className="skeleton-reflection-preview" />
            <div className="skeleton-reflection-meta">
              <div className="skeleton-tone" />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .reflections-skeleton {
          padding: var(--space-xl);
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .reflections-skeleton__header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .reflections-skeleton__list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .reflection-item-skeleton {
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          animation: fadeInSlide 0.6s ease-out;
        }

        .reflection-item-skeleton__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-2);
          gap: var(--space-md);
        }

        .skeleton-reflection-title {
          flex: 1;
          height: 16px;
          border-radius: var(--radius-sm);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.1)
          );
          animation: shimmer 2s ease-in-out infinite;
        }

        .skeleton-reflection-date {
          width: 60px;
          height: 12px;
          border-radius: var(--radius-sm);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.08),
            rgba(255, 255, 255, 0.15),
            rgba(255, 255, 255, 0.08)
          );
          animation: shimmer 2s ease-in-out infinite 0.1s;
        }

        .skeleton-reflection-preview {
          height: 14px;
          border-radius: var(--radius-sm);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.08),
            rgba(255, 255, 255, 0.15),
            rgba(255, 255, 255, 0.08)
          );
          margin-bottom: var(--space-2);
          animation: shimmer 2s ease-in-out infinite 0.2s;
        }

        .skeleton-reflection-meta {
          display: flex;
          gap: var(--space-sm);
        }

        .skeleton-tone {
          width: 60px;
          height: 20px;
          border-radius: var(--radius-full);
          background: linear-gradient(
            90deg,
            rgba(251, 191, 36, 0.1),
            rgba(251, 191, 36, 0.2),
            rgba(251, 191, 36, 0.1)
          );
          animation: shimmer 2s ease-in-out infinite 0.3s;
        }

        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reflection-item-skeleton,
          .skeleton-reflection-title,
          .skeleton-reflection-date,
          .skeleton-reflection-preview,
          .skeleton-tone {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Full-screen loading overlay
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message
 * @param {boolean} props.show - Whether to show the overlay
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Loading overlay component
 */
export const LoadingOverlay = ({
  message = "Preparing your sacred space...",
  show = false,
  className = "",
}) => {
  if (!show) return null;

  return (
    <div className={`loading-overlay ${className}`}>
      <div className="loading-overlay__content">
        <CosmicSpinner size="xl" />
        <div className="loading-overlay__message">{message}</div>
      </div>

      <style jsx>{`
        .loading-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.9);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }

        .loading-overlay__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xl);
          text-align: center;
          padding: var(--space-2xl);
        }

        .loading-overlay__message {
          font-size: var(--text-lg);
          color: var(--cosmic-text-secondary);
          font-weight: var(--font-light);
          letter-spacing: 0.5px;
          animation: breatheText 3s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes breatheText {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-overlay {
            animation: none;
          }

          .loading-overlay__message {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Generic card skeleton
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Generic card skeleton
 */
export const CardSkeleton = ({ className = "" }) => {
  return (
    <div className={`card-skeleton ${className}`}>
      <div className="card-skeleton__header">
        <div className="skeleton-icon" />
        <div className="skeleton-title" />
      </div>

      <div className="card-skeleton__content">
        <SkeletonText lines={4} />
      </div>

      <style jsx>{`
        .card-skeleton {
          padding: var(--space-xl);
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--card-radius);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-skeleton__header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .card-skeleton__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};
