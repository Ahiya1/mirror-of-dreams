// components/mirror/Output.jsx - Refactored with new architecture

import React, { useState, useEffect } from "react";
import CosmicBackground from "../shared/CosmicBackground";
import ArtifactSection from "./sections/ArtifactSection";
import FeedbackSection from "./sections/FeedbackSection";
import MarkdownRenderer from "./sections/MarkdownRenderer";
import { useAuth } from "../../hooks/useAuth";
import { reflectionService } from "../../services/reflection.service";
import { RESPONSE_MESSAGES } from "../../utils/constants";

/**
 * Enhanced output component with clean architecture
 */
const Output = () => {
  // Authentication state
  const {
    user,
    isLoading: isAuthLoading,
    isAuthenticated,
    error: authError,
    redirectToAuth,
  } = useAuth();

  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [reflection, setReflection] = useState(null);
  const [reflectionId, setReflectionId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize component and load reflection
   */
  useEffect(() => {
    initializeComponent();
  }, [user]);

  /**
   * Show feedback after delay
   */
  useEffect(() => {
    if (reflection && !showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reflection, showFeedback]);

  /**
   * Initialize component
   */
  const initializeComponent = async () => {
    try {
      // Get reflection ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");

      if (!id) {
        throw new Error("No reflection ID provided");
      }

      setReflectionId(id);

      // Wait for authentication to complete
      if (isAuthLoading) return;

      // Load reflection data
      await loadReflection(id);
    } catch (error) {
      console.error("Component initialization failed:", error);
      setError(error.message || "Failed to load reflection");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load reflection data
   */
  const loadReflection = async (id) => {
    try {
      const reflectionData = await reflectionService.getReflection(id);
      setReflection(reflectionData);
    } catch (error) {
      console.error("Failed to load reflection:", error);
      throw new Error("Unable to load reflection");
    }
  };

  /**
   * Email reflection to user
   */
  const emailReflection = async () => {
    if (!user || !reflection) {
      alert("Unable to send email at this time.");
      return;
    }

    try {
      await reflectionService.emailReflection({
        email: user.email,
        content: reflection.ai_response,
        userName: user.name || "Friend",
        language: "en",
        isPremium: user.tier === "premium" || user.isCreator || false,
      });

      alert("✅ Reflection sent to your email!");
    } catch (error) {
      console.error("Email failed:", error);
      alert("❌ Failed to send email. Please try again.");
    }
  };

  /**
   * Handle feedback completion
   */
  const handleFeedbackComplete = () => {
    setShowFeedback(false);
  };

  /**
   * Navigate to new reflection
   */
  const startNewReflection = () => {
    window.location.href = "/mirror/questionnaire?fresh=true";
  };

  /**
   * Navigate to reflection history
   */
  const viewReflectionHistory = () => {
    window.location.href = "/reflections/history";
  };

  /**
   * Navigate to about page
   */
  const viewAbout = () => {
    window.location.href = "/about";
  };

  // Show loading while authenticating
  if (isAuthLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-2xl)",
            padding: "var(--space-2xl)",
            textAlign: "center",
          }}
        >
          <div className="loading-circle" />
          <div className="loading-text">Preparing your reflection...</div>
        </div>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            textAlign: "center",
            color: "var(--cosmic-text)",
            padding: "var(--space-2xl)",
          }}
        >
          <h1
            style={{
              fontSize: "var(--text-3xl)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Authentication Required
          </h1>
          <p style={{ marginBottom: "var(--space-xl)", opacity: 0.8 }}>
            {authError}
          </p>
          <button
            className="cosmic-button cosmic-button--primary"
            onClick={() => redirectToAuth()}
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // Show general error
  if (error) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            textAlign: "center",
            color: "var(--cosmic-text)",
            padding: "var(--space-2xl)",
          }}
        >
          <h1
            style={{
              fontSize: "var(--text-3xl)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Reflection Unavailable
          </h1>
          <p style={{ marginBottom: "var(--space-xl)", opacity: 0.8 }}>
            {error}
          </p>
          <button
            className="cosmic-button cosmic-button--primary"
            onClick={startNewReflection}
          >
            Try New Reflection
          </button>
        </div>
      </div>
    );
  }

  // Show loading
  if (isLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-2xl)",
            padding: "var(--space-2xl)",
            textAlign: "center",
          }}
        >
          <div className="loading-circle" />
          <div className="loading-text">Preparing your reflection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mirror-container">
      <CosmicBackground />

      {/* Back Navigation */}
      <a href="/" className="back-link">
        <span>←</span>
        <span>Return to Portal</span>
      </a>

      <div className="mirror-content">
        {/* Artifact Call-to-Action Banner */}
        <div className="artifact-cta-banner">
          <div className="artifact-cta-icon">✨</div>
          <div className="artifact-cta-title">
            Transform Your Truth Into Art
          </div>
          <div className="artifact-cta-subtitle">
            Create a beautiful visual artifact from your reflection
          </div>
          <div className="artifact-cta-description">
            See your personalized artwork below
          </div>
        </div>

        {/* Admin/Test Mode Notice */}
        {(user?.isCreator || user?.testMode) && (
          <div className="admin-notice">
            <span>
              ✨{" "}
              {user.isCreator
                ? "Creator mode — unlimited premium reflections"
                : `Test mode — ${user.tier} reflection`}
            </span>
          </div>
        )}

        {/* Reflection Content */}
        <div className="reflection-content-section">
          <MarkdownRenderer
            content={reflection?.ai_response}
            options={{
              enhanceAccessibility: true,
              sanitizeHtml: true,
            }}
          />
        </div>

        {/* Artifact Section */}
        <ArtifactSection
          reflectionId={reflectionId}
          authToken={user?.token || null}
        />

        {/* Action Buttons */}
        <div className="action-buttons-section">
          <button
            className="cosmic-button"
            onClick={emailReflection}
            disabled={!user?.email}
            title={
              !user?.email
                ? "Email address required"
                : "Email reflection to yourself"
            }
          >
            <span>📧</span>
            <span>Mail Reflection</span>
          </button>

          <button
            className="cosmic-button cosmic-button--gentle"
            onClick={startNewReflection}
          >
            <span>🆕</span>
            <span>New Reflection</span>
          </button>

          <button className="cosmic-button" onClick={viewReflectionHistory}>
            <span>📚</span>
            <span>Your Journey</span>
          </button>

          <button className="cosmic-button" onClick={viewAbout}>
            <span>🤲</span>
            <span>Who created this?</span>
          </button>
        </div>

        {/* Feedback Section */}
        {showFeedback && (
          <FeedbackSection
            reflectionId={reflectionId}
            authToken={user?.token || null}
            onComplete={handleFeedbackComplete}
          />
        )}
      </div>

      {/* Component Styles */}
      <style jsx>{`
        .artifact-cta-banner {
          margin-top: var(--space-2xl);
          margin-bottom: var(--space-xl);
          padding: var(--space-xl);
          background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0.08) 0%,
            rgba(245, 158, 11, 0.04) 100%
          );
          backdrop-filter: blur(25px);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
          animation: artifactGlow 4s ease-in-out infinite;
        }

        .artifact-cta-icon {
          font-size: var(--text-3xl);
          margin-bottom: var(--space-md);
        }

        .artifact-cta-title {
          font-size: var(--text-xl);
          font-weight: var(--font-medium);
          color: var(--fusion-primary);
          margin-bottom: var(--space-xs);
        }

        .artifact-cta-subtitle {
          font-size: var(--text-base);
          color: var(--cosmic-text-secondary);
          margin-bottom: var(--space-xs);
        }

        .artifact-cta-description {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          font-style: italic;
        }

        .admin-notice {
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.25);
          color: #d8b4fe;
          padding: var(--space-md) var(--space-lg);
          border-radius: var(--radius-xl);
          margin-bottom: var(--space-xl);
          font-size: var(--text-sm);
          font-weight: var(--font-normal);
          letter-spacing: 0.3px;
          text-align: center;
        }

        .reflection-content-section {
          margin-bottom: var(--space-xl);
        }

        .action-buttons-section {
          margin-top: var(--space-2xl);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-md);
        }

        .loading-text {
          font-size: var(--text-lg);
          font-weight: var(--font-light);
          opacity: 0.8;
          letter-spacing: 1px;
          color: var(--cosmic-text-secondary);
          animation: loadingPulse 3s ease-in-out infinite;
        }

        @keyframes artifactGlow {
          0%,
          100% {
            background: linear-gradient(
              135deg,
              rgba(251, 191, 36, 0.08) 0%,
              rgba(245, 158, 11, 0.04) 100%
            );
            border-color: rgba(251, 191, 36, 0.2);
          }
          50% {
            background: linear-gradient(
              135deg,
              rgba(251, 191, 36, 0.12) 0%,
              rgba(245, 158, 11, 0.06) 100%
            );
            border-color: rgba(251, 191, 36, 0.3);
          }
        }

        @keyframes loadingPulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .action-buttons-section {
            grid-template-columns: 1fr;
          }

          .artifact-cta-banner {
            padding: var(--space-lg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .artifact-cta-banner {
            animation: none;
          }

          .loading-text {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Output;
