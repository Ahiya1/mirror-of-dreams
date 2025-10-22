/**
 * Landing Page (Portal)
 *
 * Main entry point for Mirror of Dreams
 * Features cosmic background with floating mirror shards and dynamic content
 */

"use client";

import React, { useState, useCallback } from "react";
import { usePortalState } from "@/components/portal/hooks/usePortalState";
import MirrorShards from "@/components/portal/MirrorShards";
import Navigation from "@/components/portal/Navigation";
import MainContent from "@/components/portal/MainContent";
import "../styles/portal.css";

export default function HomePage() {
  const {
    userState,
    isLoading,
    showUserDropdown,
    handleSignOut,
    toggleUserDropdown,
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
  const handleReflectHover = useCallback((isHovered: boolean) => {
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
      <div className="portal portal--loading">
        <div className="portal-loading">
          <div className="loading-spinner" />
          <span>Preparing your sacred space...</span>
        </div>

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
        `}</style>
      </div>
    );
  }

  return (
    <div className="portal">
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
        isAuthenticated={userState?.authenticated || false}
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

        /* Remove all focus outlines - rely on hover states */
        :global(.portal *) {
          outline: none !important;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}
