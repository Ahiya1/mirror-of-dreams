// src/components/portal/Portal.jsx - Main portal component

import React, { useState, useCallback, useEffect } from "react";
import { usePortalState } from "./hooks/usePortalState";
import MirrorShards from "./components/MirrorShards";
import Navigation from "./components/Navigation";
import MainContent from "./components/MainContent";

/**
 * Portal component - The main landing page experience
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Portal component
 */
const Portal = ({ className = "" }) => {
  const {
    userState,
    isLoading,
    showUserDropdown,
    handleSignOut,
    toggleUserDropdown,
    closeUserDropdown,
    getReflectButtonConfig,
    getSecondaryButtonsConfig,
    getTaglinesConfig,
    getUsageConfig,
    getUserMenuConfig,
  } = usePortalState();

  const [mirrorHover, setMirrorHover] = useState(false);

  /**
   * Handle reflect button hover for mirror effect
   */
  const handleReflectHover = useCallback((isHovered) => {
    if (window.matchMedia("(hover: hover)").matches) {
      setMirrorHover(isHovered);
    }
  }, []);

  // Get configurations
  const reflectConfig = getReflectButtonConfig();
  const secondaryButtons = getSecondaryButtonsConfig();
  const taglines = getTaglinesConfig();
  const usageConfig = getUsageConfig();
  const userMenuConfig = getUserMenuConfig();

  // Loading state
  if (isLoading) {
    return (
      <div className={`portal portal--loading ${className}`}>
        <div className="portal-loading">
          <div className="loading-spinner" />
          <span>Preparing your sacred space...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`portal ${className}`}>
      {/* Mirror Shards Background */}
      <MirrorShards className={mirrorHover ? "hover" : ""} />

      {/* Navigation */}
      <Navigation
        userConfig={userMenuConfig}
        showUserDropdown={showUserDropdown}
        onToggleUserDropdown={toggleUserDropdown}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <MainContent
        reflectConfig={reflectConfig}
        secondaryButtons={secondaryButtons}
        taglines={taglines}
        usageConfig={usageConfig}
        isAuthenticated={userState?.authenticated}
        onReflectHover={handleReflectHover}
      />

      <style jsx>{`
        .portal {
          height: 100vh;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #0f0f23 0%,
            #1a1a2e 25%,
            #16213e 50%,
            #0f0f23 100%
          );
          color: #fff;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          position: fixed;
          width: 100vw;
          margin: 0;
          padding: 0;
        }

        .portal--loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .portal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          border-top-color: rgba(255, 255, 255, 0.8);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .portal-loading span {
          font-size: 0.9rem;
          font-weight: 300;
        }

        /* Remove all focus outlines - rely on hover states */
        * {
          outline: none !important;
          -webkit-tap-highlight-color: transparent;
        }

        /* Debug info for development */
        @media (max-width: 0px) {
          .portal::before {
            content: "Portal Debug - User: " attr(data-user-state);
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px;
            font-size: 12px;
            z-index: 9999;
          }
        }
      `}</style>
    </div>
  );
};

export default Portal;
