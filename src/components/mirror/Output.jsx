// components/mirror/Output.jsx - Clean and Spacious

import React, { useState, useEffect } from "react";
import CosmicBackground from "../shared/CosmicBackground";
import ArtifactSection from "./sections/ArtifactSection";
import FeedbackSection from "./sections/FeedbackSection";
import MarkdownRenderer from "./sections/MarkdownRenderer";
import { useAuth } from "../../hooks/useAuth";
import { reflectionService } from "../../services/reflection.service";

const Output = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [reflection, setReflection] = useState(null);
  const [reflectionId, setReflectionId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState(null);
  const [reflectionVisible, setReflectionVisible] = useState(false);

  useEffect(() => {
    initializeComponent();
  }, [user]);

  useEffect(() => {
    if (reflection && !reflectionVisible) {
      const timer = setTimeout(() => {
        setReflectionVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reflection, reflectionVisible]);

  const initializeComponent = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");

      if (!id) {
        throw new Error("No reflection ID provided");
      }

      setReflectionId(id);

      if (isAuthLoading) return;

      await loadReflection(id);
    } catch (error) {
      console.error("Component initialization failed:", error);
      setError(error.message || "Failed to load reflection");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReflection = async (id) => {
    try {
      const reflectionData = await reflectionService.getReflection(id);
      setReflection(reflectionData);
    } catch (error) {
      console.error("Failed to load reflection:", error);
      throw new Error("Unable to load reflection");
    }
  };

  const copyReflection = async () => {
    if (!reflection?.ai_response) {
      alert("No reflection to copy.");
      return;
    }

    try {
      // Remove HTML tags for clean text copy
      const cleanText = reflection.ai_response.replace(/<[^>]*>/g, "");
      await navigator.clipboard.writeText(cleanText);
      alert("✅ Reflection copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);

      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = reflection.ai_response.replace(/<[^>]*>/g, "");
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("✅ Reflection copied to clipboard!");
    }
  };

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

  const handleFeedbackToggle = () => {
    setShowFeedback(!showFeedback);
  };

  const startNewReflection = () => {
    window.location.href = "/mirror/questionnaire?fresh=true";
  };

  const viewReflectionHistory = () => {
    window.location.href = "/reflections/history";
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div className="loading-state">
          <div className="mirror-frame">
            <div className="mirror-surface loading">
              <div className="loading-spinner"></div>
              <div className="loading-text">Surfacing your reflection...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div className="error-state">
          <div className="mirror-frame">
            <div className="mirror-surface error">
              <div className="error-content">
                <span className="error-icon">⚠</span>
                <span className="error-message">{error}</span>
                <button className="simple-button" onClick={startNewReflection}>
                  Try New Reflection
                </button>
              </div>
            </div>
          </div>
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

      <div className="content-wrapper">
        {/* Square Mirror */}
        <div className="mirror-frame">
          <div className="mirror-surface">
            {/* Mirror reflections */}
            <div className="mirror-glow-top"></div>
            <div className="mirror-glow-center"></div>

            {/* Reflection content - NO BACKGROUND */}
            <div
              className={`reflection-text ${
                reflectionVisible ? "visible" : ""
              }`}
            >
              <MarkdownRenderer
                content={reflection?.ai_response}
                options={{
                  cleanGold: true,
                  noBackground: true,
                }}
              />
            </div>

            {/* Subtle shimmer */}
            <div className="mirror-shimmer"></div>
          </div>
        </div>

        {/* Artifact Section */}
        <ArtifactSection
          reflectionId={reflectionId}
          authToken={user?.token || null}
          simple={true}
        />

        {/* Action Buttons */}
        <div className="action-grid">
          <button
            className="action-button"
            onClick={copyReflection}
            title="Copy reflection"
          >
            <span className="button-icon">📋</span>
            <span>Copy Text</span>
          </button>

          <button
            className="action-button"
            onClick={emailReflection}
            disabled={!user?.email}
            title="Email reflection"
          >
            <span className="button-icon">📧</span>
            <span>Send Email</span>
          </button>

          <button
            className="action-button"
            onClick={startNewReflection}
            title="New reflection"
          >
            <span className="button-icon">✨</span>
            <span>New Reflection</span>
          </button>

          <button
            className="action-button"
            onClick={viewReflectionHistory}
            title="View history"
          >
            <span className="button-icon">📖</span>
            <span>Your Journey</span>
          </button>

          <button
            className="action-button"
            onClick={handleFeedbackToggle}
            title="Feedback"
          >
            <span className="button-icon">💭</span>
            <span>Feedback</span>
          </button>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <FeedbackSection
            reflectionId={reflectionId}
            authToken={user?.token || null}
            onComplete={() => setShowFeedback(false)}
            clean={true}
          />
        )}
      </div>

      <style jsx>{`
        .mirror-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
        }

        .back-link {
          position: fixed;
          top: 2rem;
          left: 2rem;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 25px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .back-link:hover {
          background: rgba(255, 255, 255, 0.12);
          color: white;
          transform: translateY(-1px);
        }

        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4rem;
          width: 100%;
          max-width: 1000px;
        }

        .loading-state,
        .error-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
        }

        .mirror-frame {
          position: relative;
          width: clamp(500px, 60vw, 700px);
          height: clamp(500px, 60vw, 700px);
          aspect-ratio: 1;
          padding: 3rem;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(255, 215, 0, 0.08) 0%,
            rgba(255, 215, 0, 0.04) 40%,
            transparent 80%
          );
          border-radius: 20px;
          animation: frameGlow 6s ease-in-out infinite;
        }

        @keyframes frameGlow {
          0%,
          100% {
            box-shadow: 0 0 80px rgba(255, 215, 0, 0.15),
              0 0 160px rgba(255, 215, 0, 0.08);
          }
          50% {
            box-shadow: 0 0 100px rgba(255, 215, 0, 0.2),
              0 0 180px rgba(255, 215, 0, 0.12);
          }
        }

        .mirror-surface {
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.15) 20%,
            rgba(255, 255, 255, 0.08) 80%,
            rgba(255, 255, 255, 0.05) 100%
          );
          backdrop-filter: blur(25px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }

        .mirror-surface.loading {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
        }

        .mirror-surface.error {
          background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.08) 0%,
            rgba(239, 68, 68, 0.12) 50%,
            rgba(239, 68, 68, 0.08) 100%
          );
          border-color: rgba(239, 68, 68, 0.3);
        }

        .mirror-glow-top {
          position: absolute;
          top: 8%;
          left: 20%;
          width: 60%;
          height: 25%;
          background: radial-gradient(
            ellipse,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0.1) 60%,
            transparent 80%
          );
          border-radius: 50%;
          animation: glowShift 8s ease-in-out infinite;
        }

        .mirror-glow-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30%;
          height: 30%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.02) 50%,
            transparent 80%
          );
          border-radius: 50%;
          animation: breathe 12s ease-in-out infinite;
        }

        @keyframes glowShift {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes breathe {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.5;
          }
        }

        .mirror-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent 40%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 60%
          );
          animation: shimmer 8s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%) translateY(100%);
            opacity: 0;
          }
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 3px solid rgba(255, 215, 0, 0.3);
          border-top: 3px solid rgba(255, 215, 0, 0.8);
          border-radius: 50%;
          animation: spin 1.5s linear infinite;
          margin-bottom: 2rem;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loading-text {
          font-size: 1.1rem;
          color: rgba(255, 215, 0, 0.8);
          text-align: center;
        }

        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          text-align: center;
        }

        .error-icon {
          font-size: 2.5rem;
          color: rgba(239, 68, 68, 0.8);
        }

        .error-message {
          color: rgba(239, 68, 68, 0.9);
          font-size: 1.1rem;
        }

        .reflection-text {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 215, 0, 0.3) transparent;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease;
          z-index: 10;
          position: relative;
        }

        .reflection-text.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .reflection-text::-webkit-scrollbar {
          width: 6px;
        }

        .reflection-text::-webkit-scrollbar-track {
          background: transparent;
        }

        .reflection-text::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.3);
          border-radius: 3px;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1.5rem;
          width: 100%;
          max-width: 800px;
        }

        .action-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem 1rem;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 15px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }

        .action-button::before {
          content: "";
          position: absolute;
          top: 8%;
          left: 15%;
          width: 70%;
          height: 30%;
          background: radial-gradient(
            ellipse,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0.1) 60%,
            transparent 80%
          );
          border-radius: 50%;
          transform: rotate(-15deg);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .action-button:hover::before {
          opacity: 1;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
          color: white;
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .button-icon {
          font-size: 1.4rem;
        }

        .simple-button {
          padding: 1rem 2rem;
          background: rgba(255, 215, 0, 0.8);
          border: none;
          border-radius: 25px;
          color: rgba(15, 23, 42, 0.9);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .simple-button:hover {
          background: rgba(255, 215, 0, 0.9);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .mirror-container {
            padding: 2rem 1rem;
          }

          .content-wrapper {
            gap: 3rem;
          }

          .mirror-frame {
            width: clamp(350px, 85vw, 500px);
            height: clamp(350px, 85vw, 500px);
            padding: 2rem;
          }

          .mirror-surface {
            padding: 2rem;
          }

          .action-grid {
            grid-template-columns: 1fr 1fr;
          }

          .back-link {
            top: 1rem;
            left: 1rem;
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .mirror-frame {
            width: clamp(300px, 90vw, 400px);
            height: clamp(300px, 90vw, 400px);
            padding: 1.5rem;
          }

          .action-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mirror-frame,
          .mirror-glow-top,
          .mirror-glow-center,
          .mirror-shimmer,
          .loading-spinner {
            animation: none;
          }

          .action-button:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Output;
