// components/mirror/sections/ArtifactSection.jsx - Artifact creation and management section

import React from "react";
import { useArtifact } from "../../../hooks/useArtifact";

/**
 * Artifact section component for creating and managing reflection artifacts
 * @param {Object} props - Component props
 * @param {string} props.reflectionId - Reflection ID
 * @param {string} props.authToken - Authentication token
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Artifact section component
 */
const ArtifactSection = ({ reflectionId, authToken, className = "" }) => {
  const {
    artifactState,
    artifactData,
    error,
    isLoading,
    createArtifact,
    regenerateArtifact,
    shareArtifact,
    downloadArtifact,
    clearError,
    retryCreation,
    getStatusText,
    canCreate,
    isCreating,
    hasArtifact,
    hasError,
  } = useArtifact(reflectionId, authToken);

  /**
   * Handle artifact creation
   */
  const handleCreateArtifact = async () => {
    if (!reflectionId) {
      alert("No reflection found to create artifact from.");
      return;
    }
    await createArtifact();
  };

  /**
   * Handle artifact regeneration
   */
  const handleRegenerateArtifact = async () => {
    await regenerateArtifact();
  };

  /**
   * Handle artifact sharing
   */
  const handleShareArtifact = async () => {
    await shareArtifact();
  };

  /**
   * Handle artifact download
   */
  const handleDownloadArtifact = async () => {
    await downloadArtifact();
  };

  /**
   * Handle error retry
   */
  const handleRetry = async () => {
    await retryCreation();
  };

  return (
    <div className={`glass-card artifact-section ${className}`}>
      <div style={{ padding: "var(--space-xl)" }}>
        {/* Section Header */}
        <h2 className="artifact-section-title">
          Your Sacred Artifact
          <div className="artifact-section-underline" aria-hidden="true" />
        </h2>

        {/* Create State */}
        {canCreate && (
          <div className="artifact-create-state">
            <button
              className="cosmic-button cosmic-button--fusion"
              onClick={handleCreateArtifact}
              disabled={isLoading}
              style={{
                padding: "var(--space-lg) var(--space-xl)",
                fontSize: "var(--text-base)",
                minHeight: "64px",
              }}
            >
              <span style={{ fontSize: "1.2em" }}>🎨</span>
              <span>Create Your Artifact</span>
            </button>
            <div className="artifact-description">
              Transform your reflection into a personalized visual that captures
              your essence and insights
            </div>
          </div>
        )}

        {/* Loading State */}
        {isCreating && (
          <div className="artifact-loading-state">
            <div className="artifact-loading-spinner">
              <div className="artifact-loading-inner" />
            </div>
            <div className="artifact-loading-text">{getStatusText()}</div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="artifact-error-state">
            <div className="artifact-error-icon">⚠️</div>
            <div className="artifact-error-message">
              {error || "Failed to create artifact"}
            </div>
            <div className="artifact-error-actions">
              <button
                className="cosmic-button cosmic-button--gentle"
                onClick={handleRetry}
                disabled={isLoading}
              >
                <span>🔄</span>
                <span>Try Again</span>
              </button>
              <button className="cosmic-button" onClick={clearError}>
                <span>✕</span>
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        )}

        {/* Preview State */}
        {hasArtifact && artifactData && (
          <div className="artifact-preview-state">
            <div className="artifact-image-container">
              <img
                src={artifactData.image_url}
                alt="Your Sacred Artifact"
                className="artifact-image"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <div className="artifact-image-error" style={{ display: "none" }}>
                <span>🖼️</span>
                <span>Image could not be loaded</span>
              </div>
            </div>

            <div className="artifact-actions">
              <button
                className="cosmic-button cosmic-button--gentle"
                onClick={handleDownloadArtifact}
                title="Download artifact image"
              >
                <span>⬇️</span>
                <span>Download</span>
              </button>
              <button
                className="cosmic-button"
                onClick={handleShareArtifact}
                title="Share artifact"
              >
                <span>🔗</span>
                <span>Share</span>
              </button>
              <button
                className="cosmic-button"
                onClick={handleRegenerateArtifact}
                title="Create a new artifact"
              >
                <span>🔄</span>
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Component Styles */}
      <style jsx>{`
        .artifact-section {
          margin-top: var(--space-2xl);
          animation: artifactSectionReveal 0.8s ease-out;
        }

        .artifact-section-title {
          font-size: var(--text-2xl);
          font-weight: var(--font-light);
          text-align: center;
          margin-bottom: var(--space-xl);
          color: var(--cosmic-text);
          position: relative;
        }

        .artifact-section-underline {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
        }

        .artifact-create-state {
          text-align: center;
        }

        .artifact-description {
          margin-top: var(--space-lg);
          font-size: var(--text-base);
          color: var(--cosmic-text-secondary);
          line-height: var(--leading-relaxed);
        }

        .artifact-loading-state {
          text-align: center;
          padding: var(--space-xl) 0;
        }

        .artifact-loading-spinner {
          width: 80px;
          height: 80px;
          margin: 0 auto var(--space-lg);
          border-radius: var(--radius-full);
          background: radial-gradient(
            circle,
            rgba(251, 191, 36, 0.2) 0%,
            rgba(251, 191, 36, 0.05) 70%,
            transparent 100%
          );
          animation: artifactSpin 2s linear infinite;
          position: relative;
        }

        .artifact-loading-inner {
          position: absolute;
          inset: 20%;
          border-radius: var(--radius-full);
          background: radial-gradient(
            circle,
            rgba(251, 191, 36, 0.4) 0%,
            transparent 70%
          );
          animation: artifactPulse 1.5s ease-in-out infinite;
        }

        .artifact-loading-text {
          font-size: var(--text-lg);
          color: var(--fusion-primary);
          font-weight: var(--font-medium);
        }

        .artifact-error-state {
          text-align: center;
          padding: var(--space-lg);
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-xl);
        }

        .artifact-error-icon {
          font-size: var(--text-2xl);
          margin-bottom: var(--space-md);
        }

        .artifact-error-message {
          font-size: var(--text-base);
          color: var(--error-primary);
          margin-bottom: var(--space-lg);
        }

        .artifact-error-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          flex-wrap: wrap;
        }

        .artifact-preview-state {
          animation: artifactReveal 1s ease-out;
        }

        .artifact-image-container {
          text-align: center;
          margin-bottom: var(--space-xl);
          position: relative;
        }

        .artifact-image {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          border: 2px solid rgba(251, 191, 36, 0.2);
          transition: transform var(--transition-smooth);
        }

        .artifact-image:hover {
          transform: scale(1.02);
        }

        .artifact-image-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-xl);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-xl);
          color: var(--cosmic-text-muted);
        }

        .artifact-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          flex-wrap: wrap;
        }

        @keyframes artifactSectionReveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes artifactSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes artifactPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes artifactReveal {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 768px) {
          .artifact-actions {
            flex-direction: column;
            align-items: center;
          }

          .artifact-actions .cosmic-button {
            width: 100%;
            max-width: 280px;
          }

          .artifact-error-actions {
            flex-direction: column;
            align-items: center;
          }

          .artifact-error-actions .cosmic-button {
            width: 100%;
            max-width: 200px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .artifact-section,
          .artifact-preview-state {
            animation: none;
          }

          .artifact-loading-spinner,
          .artifact-loading-inner {
            animation: none;
          }

          .artifact-image {
            transition: none;
          }

          .artifact-image:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ArtifactSection;
