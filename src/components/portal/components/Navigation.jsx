// src/components/portal/components/Navigation.jsx - Top navigation bar

import React from "react";
import UserMenu from "./UserMenu";

/**
 * Navigation component with examples link, about link, and user menu
 * @param {Object} props - Component props
 * @param {Object} props.userConfig - User configuration object
 * @param {boolean} props.showUserDropdown - Whether user dropdown is open
 * @param {Function} props.onToggleUserDropdown - Toggle user dropdown handler
 * @param {Function} props.onSignOut - Sign out handler
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Navigation component
 */
const Navigation = ({
  userConfig,
  showUserDropdown,
  onToggleUserDropdown,
  onSignOut,
  className = "",
}) => {
  return (
    <>
      {/* Examples Link - Top Left */}
      <a href="/examples" className="examples-link">
        <span>🪞</span>
        <span>See Real Reflections</span>
      </a>

      {/* Navigation - Top Right */}
      <div className={`nav-container ${className}`}>
        <a href="/about" className="about-link">
          <span>✨</span>
          <span>Discover The Experience</span>
        </a>

        {/* User Menu (shows when authenticated) */}
        <UserMenu
          userConfig={userConfig}
          isOpen={showUserDropdown}
          onToggle={onToggleUserDropdown}
          onSignOut={onSignOut}
        />
      </div>

      <style jsx>{`
        /* Examples Link - Top Left */
        .examples-link {
          position: absolute;
          top: clamp(1rem, 3vh, 2rem);
          left: clamp(1rem, 3vw, 2rem);
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: clamp(0.6rem, 2vh, 0.8rem) clamp(1rem, 3vw, 1.5rem);
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.12),
            rgba(5, 150, 105, 0.08)
          );
          backdrop-filter: blur(20px);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 50px;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-size: clamp(0.75rem, 2vw, 0.9rem);
          font-weight: 500;
          transition: all 0.3s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15);
          white-space: nowrap;
        }

        .examples-link:hover {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.18),
            rgba(5, 150, 105, 0.12)
          );
          border-color: rgba(16, 185, 129, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(16, 185, 129, 0.2);
        }

        /* Navigation Container - Top Right */
        .nav-container {
          position: absolute;
          top: clamp(1rem, 3vh, 2rem);
          right: clamp(1rem, 3vw, 2rem);
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .about-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: clamp(0.6rem, 2vh, 0.8rem) clamp(1rem, 3vw, 1.5rem);
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.12),
            rgba(99, 102, 241, 0.08)
          );
          backdrop-filter: blur(20px);
          border: 1px solid rgba(147, 51, 234, 0.25);
          border-radius: 50px;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-size: clamp(0.75rem, 2vw, 0.9rem);
          font-weight: 500;
          transition: all 0.3s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 25px rgba(147, 51, 234, 0.15);
          white-space: nowrap;
        }

        .about-link:hover {
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.18),
            rgba(99, 102, 241, 0.12)
          );
          border-color: rgba(147, 51, 234, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(147, 51, 234, 0.2);
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
          .nav-container {
            top: 1rem;
            right: 1rem;
          }

          .examples-link {
            top: 1rem;
            left: 1rem;
          }
        }

        @media (max-width: 480px) {
          .nav-container {
            top: 0.5rem;
            right: 0.5rem;
          }

          .examples-link {
            top: 0.5rem;
            left: 0.5rem;
          }

          .about-link,
          .examples-link {
            font-size: 0.75rem;
            padding: 0.6rem 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default Navigation;
