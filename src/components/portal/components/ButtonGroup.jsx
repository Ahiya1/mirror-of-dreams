// src/components/portal/components/ButtonGroup.jsx - Main reflect button and secondary buttons

import React, { useRef } from "react";

/**
 * ButtonGroup component with main reflect button and secondary action buttons
 * @param {Object} props - Component props
 * @param {Object} props.reflectConfig - Reflect button configuration
 * @param {Array} props.secondaryButtons - Secondary buttons configuration
 * @param {Function} props.onReflectHover - Reflect button hover handler
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Button group component
 */
const ButtonGroup = ({
  reflectConfig,
  secondaryButtons,
  onReflectHover,
  className = "",
}) => {
  const reflectButtonRef = useRef(null);

  const handleReflectMouseEnter = () => {
    if (onReflectHover) {
      onReflectHover(true);
    }
  };

  const handleReflectMouseLeave = () => {
    if (onReflectHover) {
      onReflectHover(false);
    }
  };

  return (
    <div className={`button-group ${className}`}>
      {/* Main Reflect Button */}
      <a
        ref={reflectButtonRef}
        href={reflectConfig.href}
        className="reflect-button"
        onMouseEnter={handleReflectMouseEnter}
        onMouseLeave={handleReflectMouseLeave}
      >
        <span>{reflectConfig.text}</span>
      </a>

      {/* Secondary Buttons */}
      <div className="secondary-buttons">
        {secondaryButtons.map((button, index) => (
          <a
            key={index}
            href={button.href}
            className={`secondary-button ${button.className}`}
          >
            <span>{button.icon}</span>
            <span>{button.text}</span>
          </a>
        ))}
      </div>

      <style jsx>{`
        .button-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(0.8rem, 2vh, 1.2rem);
          margin: clamp(1rem, 3vh, 2rem) 0;
          width: 100%;
        }

        .reflect-button {
          width: clamp(140px, 25vw, 200px);
          height: clamp(140px, 25vw, 200px);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.03) 70%
          );
          backdrop-filter: blur(30px);
          border: 2px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          font-size: clamp(0.9rem, 2.5vw, 1.2rem);
          font-weight: 400;
          cursor: pointer;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          box-shadow: 0 15px 50px rgba(255, 255, 255, 0.08);
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
        }

        .reflect-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.06) 0%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .reflect-button::after {
          content: "";
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.02) 0%,
            transparent 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          opacity: 0;
          animation: magicalShimmer 3s ease-in-out infinite;
        }

        @keyframes magicalShimmer {
          0%,
          100% {
            opacity: 0;
            transform: rotate(0deg) scale(1);
          }
          50% {
            opacity: 0.3;
            transform: rotate(180deg) scale(1.02);
          }
        }

        .reflect-button:hover {
          transform: scale(1.03);
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 20px 60px rgba(255, 255, 255, 0.12);
        }

        .reflect-button:hover::before {
          opacity: 1;
        }

        .reflect-button:active {
          transform: scale(0.98);
          transition: transform 0.1s ease;
        }

        /* Secondary Buttons */
        .secondary-buttons {
          display: flex;
          gap: clamp(0.8rem, 2vw, 1rem);
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        /* Base button styles for all secondary buttons */
        .secondary-button {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: clamp(0.7rem, 1.5vh, 0.9rem) clamp(1.2rem, 3vw, 1.8rem);
          backdrop-filter: blur(25px);
          border-radius: 20px;
          font-size: clamp(0.8rem, 2vw, 0.95rem);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
          border: 1px solid;
        }

        .secondary-button:active {
          transform: scale(0.98);
          transition: transform 0.1s ease;
        }

        /* Dashboard button (green) */
        .dashboard-button {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.12),
            rgba(5, 150, 105, 0.08)
          );
          border-color: rgba(16, 185, 129, 0.25);
          color: rgba(255, 255, 255, 0.95);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.12);
        }

        .dashboard-button:hover {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.18),
            rgba(5, 150, 105, 0.12)
          );
          border-color: rgba(16, 185, 129, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.18);
        }

        /* Start free button (green) */
        .start-free-button {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.12),
            rgba(5, 150, 105, 0.08)
          );
          border-color: rgba(16, 185, 129, 0.25);
          color: rgba(255, 255, 255, 0.95);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.12);
        }

        .start-free-button:hover {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.18),
            rgba(5, 150, 105, 0.12)
          );
          border-color: rgba(16, 185, 129, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.18);
        }

        /* Upgrade button (purple) */
        .upgrade-button {
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.12),
            rgba(99, 102, 241, 0.08)
          );
          border-color: rgba(147, 51, 234, 0.25);
          color: rgba(255, 255, 255, 0.95);
          box-shadow: 0 6px 20px rgba(147, 51, 234, 0.12);
        }

        .upgrade-button:hover {
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.18),
            rgba(99, 102, 241, 0.12)
          );
          border-color: rgba(147, 51, 234, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(147, 51, 234, 0.18);
        }

        /* Gift button (orange) */
        .gift-button {
          background: linear-gradient(
            135deg,
            rgba(251, 146, 60, 0.08),
            rgba(251, 146, 60, 0.04)
          );
          border-color: rgba(251, 146, 60, 0.2);
          color: rgba(255, 255, 255, 0.9);
          box-shadow: 0 6px 20px rgba(251, 146, 60, 0.1);
        }

        .gift-button:hover {
          background: linear-gradient(
            135deg,
            rgba(251, 146, 60, 0.12),
            rgba(251, 146, 60, 0.06)
          );
          border-color: rgba(251, 146, 60, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(251, 146, 60, 0.15);
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
          .secondary-buttons {
            flex-direction: column;
            gap: 0.8rem;
            width: 100%;
          }

          .secondary-button {
            width: 100%;
            max-width: 280px;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .reflect-button {
            width: 120px;
            height: 120px;
            font-size: 0.85rem;
          }
        }

        /* Ultra small screens */
        @media (max-height: 600px) {
          .button-group {
            margin: 1rem 0;
            gap: 0.8rem;
          }

          .reflect-button {
            width: 100px;
            height: 100px;
          }
        }

        /* Landscape mobile */
        @media (max-height: 500px) and (orientation: landscape) {
          .button-group {
            margin: 0.5rem 0;
            gap: 0.6rem;
          }

          .reflect-button {
            width: 80px;
            height: 80px;
            font-size: 0.8rem;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .reflect-button,
          .secondary-button {
            animation: none;
            transition: none;
          }

          .reflect-button::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ButtonGroup;
