// components/mirror/sections/ArtifactSection.jsx - Simple Create & Download Only

import React, { useState } from "react";
import { useArtifact } from "../../../hooks/useArtifact";

/**
 * Simple artifact section - Create and Download only
 * No auto-creation, no sharing, no regeneration
 */
const ArtifactSection = ({
  reflectionId,
  authToken,
  className = "",
  elegant = false,
  simpleMode = false,
}) => {
  const [userRequestedCreation, setUserRequestedCreation] = useState(false);

  const {
    artifactState,
    artifactData,
    error,
    isLoading,
    createArtifact,
    clearError,
    retryCreation,
    getStatusText,
    canCreate,
    isCreating,
    hasArtifact,
    hasError,
  } = useArtifact(reflectionId, authToken, {
    autoCheck: false, // Never auto-check
    autoCreate: false, // Never auto-create
  });

  /**
   * Handle manual artifact creation request
   */
  const handleCreateArtifact = async () => {
    if (!reflectionId) {
      alert("No reflection found to create artifact from.");
      return;
    }

    setUserRequestedCreation(true);
    try {
      await createArtifact();
    } catch (error) {
      console.error("Failed to create artifact:", error);
    }
  };

  /**
   * Handle artifact download - FIXED to actually download
   */
  const handleDownloadArtifact = async () => {
    if (!artifactData?.image_url) {
      alert("No artifact image available to download.");
      return;
    }

    try {
      // Create a temporary link element for download
      const link = document.createElement("a");

      // Try to fetch the image as a blob first for better download handling
      try {
        const response = await fetch(artifactData.image_url, {
          mode: "cors",
          credentials: "omit",
        });

        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);

          link.href = blobUrl;
          link.download = `sacred-artifact-${Date.now()}.jpg`;
          link.style.display = "none";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the blob URL
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
          return;
        }
      } catch (fetchError) {
        console.warn(
          "Blob download failed, falling back to direct link:",
          fetchError
        );
      }

      // Fallback: direct download link
      link.href = artifactData.image_url;
      link.download = `sacred-artifact-${Date.now()}.jpg`;
      link.target = "_blank"; // Fallback for browsers that don't support download
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);

      // Final fallback: open in new tab with instructions
      const newWindow = window.open(artifactData.image_url, "_blank");
      if (newWindow) {
        // Add a small delay to let the window open
        setTimeout(() => {
          alert(
            'Download may not have started automatically. Right-click the image and select "Save image as..." to download.'
          );
        }, 1000);
      } else {
        alert(
          "Popup blocked. Please allow popups and try again, or copy this URL to download: " +
            artifactData.image_url
        );
      }
    }
  };

  /**
   * Handle error retry
   */
  const handleRetry = async () => {
    clearError();
    await retryCreation();
  };

  // Don't show anything until user requests creation
  if (!userRequestedCreation && !hasArtifact) {
    return (
      <div className={`artifact-section simple-artifact ${className}`}>
        <div className="artifact-cta">
          <div className="cta-content">
            <div className="cta-icon">🎨</div>
            <h3>Transform Into Sacred Art</h3>
            <p>Create a visual artifact from your reflection</p>
            <button
              className="create-artifact-button"
              onClick={handleCreateArtifact}
              disabled={isLoading}
            >
              <span>Create Artifact</span>
            </button>
          </div>
        </div>

        <style jsx>{`
          .artifact-section {
            width: 100%;
            max-width: 500px;
            margin: 1.5rem 0;
          }

          .artifact-cta {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s ease;
          }

          .artifact-cta:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(251, 191, 36, 0.2);
          }

          .cta-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .cta-icon {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            animation: gentleFloat 3s ease-in-out infinite;
          }

          @keyframes gentleFloat {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-5px);
            }
          }

          .cta-content h3 {
            font-size: 1.4rem;
            font-weight: 400;
            color: rgba(251, 191, 36, 0.9);
            margin: 0;
            letter-spacing: 0.5px;
          }

          .cta-content p {
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
            font-size: 1rem;
            line-height: 1.5;
          }

          .create-artifact-button {
            padding: 0.875rem 2rem;
            background: linear-gradient(
              135deg,
              rgba(251, 191, 36, 0.8),
              rgba(251, 191, 36, 0.6)
            );
            border: 1px solid rgba(251, 191, 36, 0.4);
            border-radius: 25px;
            color: rgba(15, 23, 42, 0.9);
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            letter-spacing: 0.3px;
            margin-top: 0.5rem;
          }

          .create-artifact-button:hover {
            background: linear-gradient(
              135deg,
              rgba(251, 191, 36, 0.9),
              rgba(251, 191, 36, 0.7)
            );
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
          }

          .create-artifact-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          @media (max-width: 768px) {
            .artifact-cta {
              padding: 1.5rem;
            }

            .cta-content h3 {
              font-size: 1.2rem;
            }

            .create-artifact-button {
              width: 100%;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .cta-icon {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`artifact-section ${className}`}>
      {/* Creating State */}
      {isCreating && (
        <div className="artifact-creating">
          <div className="creating-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-dot"></div>
          </div>
          <div className="creating-text">{getStatusText()}</div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="artifact-error">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-message">
              {error || "Failed to create artifact"}
            </div>
            <div className="error-actions">
              <button className="retry-button" onClick={handleRetry}>
                Try Again
              </button>
              <button className="dismiss-button" onClick={clearError}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {hasArtifact && artifactData && (
        <div className="artifact-success">
          <div className="artifact-display">
            <div className="artifact-frame">
              <img
                src={artifactData.image_url}
                alt="Your Sacred Artifact"
                className="artifact-image"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                className="artifact-error-fallback"
                style={{ display: "none" }}
              >
                <span>🖼️</span>
                <span>Image could not be displayed</span>
              </div>
            </div>

            {/* Simple Action - Download Only */}
            <div className="artifact-action">
              <button
                className="download-button"
                onClick={handleDownloadArtifact}
                title="Download your artifact"
              >
                <span className="download-icon">⬇️</span>
                <span>Download Artifact</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .artifact-section {
          width: 100%;
          max-width: 500px;
          margin: 1.5rem 0;
        }

        .artifact-creating {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 2.5rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          animation: deepBreathe 4s ease-in-out infinite;
        }

        @keyframes deepBreathe {
          0%,
          100% {
            transform: scale(1);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(251, 191, 36, 0.2);
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.1);
          }
          50% {
            transform: scale(1.02);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(251, 191, 36, 0.4);
            box-shadow: 0 0 50px rgba(251, 191, 36, 0.3);
          }
        }

        .creating-spinner {
          position: relative;
          width: 80px;
          height: 80px;
          animation: spinnerBreathe 3s ease-in-out infinite;
        }

        @keyframes spinnerBreathe {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        .spinner-ring {
          position: absolute;
          width: 80px;
          height: 80px;
          border: 3px solid rgba(251, 191, 36, 0.2);
          border-top: 3px solid rgba(251, 191, 36, 0.8);
          border-radius: 50%;
          animation: spin 2s linear infinite, ringPulse 4s ease-in-out infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes ringPulse {
          0%,
          100% {
            border-color: rgba(251, 191, 36, 0.2);
            border-top-color: rgba(251, 191, 36, 0.8);
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
          }
          50% {
            border-color: rgba(251, 191, 36, 0.4);
            border-top-color: rgba(251, 191, 36, 1);
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.5);
          }
        }

        .spinner-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: rgba(251, 191, 36, 0.9);
          border-radius: 50%;
          animation: dotBreathe 3s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
        }

        @keyframes dotBreathe {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 1;
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.9);
          }
        }

        .creating-text {
          font-size: 1.1rem;
          color: rgba(251, 191, 36, 0.9);
          font-weight: 400;
          text-align: center;
          letter-spacing: 0.5px;
          animation: textBreathe 4s ease-in-out infinite;
        }

        @keyframes textBreathe {
          0%,
          100% {
            opacity: 0.8;
            text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
          }
          50% {
            opacity: 1;
            text-shadow: 0 0 40px rgba(251, 191, 36, 0.6);
          }
        }

        .artifact-error {
          padding: 2rem;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(20px);
        }

        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }

        .error-icon {
          font-size: 2rem;
          color: rgba(239, 68, 68, 0.8);
        }

        .error-message {
          color: rgba(239, 68, 68, 0.9);
          font-size: 1rem;
          font-weight: 400;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .retry-button,
        .dismiss-button {
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          font-weight: 400;
          font-size: 0.9rem;
        }

        .retry-button {
          background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0.8),
            rgba(251, 191, 36, 0.6)
          );
          border: 1px solid rgba(251, 191, 36, 0.4);
          color: rgba(15, 23, 42, 0.9);
        }

        .dismiss-button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.8);
        }

        .retry-button:hover,
        .dismiss-button:hover {
          transform: translateY(-1px);
        }

        .artifact-success {
          animation: successFade 0.6s ease-out;
        }

        @keyframes successFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .artifact-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(20px);
        }

        .artifact-frame {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(251, 191, 36, 0.2);
          max-width: 100%;
        }

        .artifact-image {
          display: block;
          max-width: 100%;
          height: auto;
          transition: transform 0.3s ease;
        }

        .artifact-image:hover {
          transform: scale(1.02);
        }

        .artifact-error-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
        }

        .artifact-action {
          display: flex;
          justify-content: center;
        }

        .download-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0.8),
            rgba(251, 191, 36, 0.6)
          );
          border: 1px solid rgba(251, 191, 36, 0.4);
          border-radius: 25px;
          color: rgba(15, 23, 42, 0.9);
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .download-button:hover {
          background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0.9),
            rgba(251, 191, 36, 0.7)
          );
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
        }

        .download-icon {
          font-size: 1.2rem;
        }

        @media (max-width: 768px) {
          .artifact-display {
            padding: 1.5rem;
          }

          .error-actions {
            flex-direction: column;
            width: 100%;
          }

          .retry-button,
          .dismiss-button,
          .download-button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .creating-spinner .spinner-ring,
          .creating-spinner .spinner-dot,
          .artifact-success,
          .artifact-creating,
          .creating-spinner,
          .creating-text {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ArtifactSection;
