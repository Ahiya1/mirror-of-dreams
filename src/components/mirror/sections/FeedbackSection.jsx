// components/mirror/sections/FeedbackSection.jsx - Feedback collection section

import React from "react";
import { useFeedback } from "../../../hooks/useFeedback";
import CharacterCounter from "../shared/CharacterCounter";

/**
 * Feedback section component for collecting reflection feedback
 * @param {Object} props - Component props
 * @param {string} props.reflectionId - Reflection ID
 * @param {string} props.authToken - Authentication token
 * @param {Function} props.onComplete - Callback when feedback is completed
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Feedback section component
 */
const FeedbackSection = ({
  reflectionId,
  authToken,
  onComplete,
  className = "",
}) => {
  const {
    selectedRating,
    feedbackText,
    isSubmitting,
    isSubmitted,
    error,
    submitFeedback,
    updateRating,
    updateFeedbackText,
    skipFeedback,
    clearError,
    getRatingText,
    getCharacterInfo,
    getSubmitButtonText,
    canSubmit,
    hasRating,
  } = useFeedback(reflectionId, authToken);

  /**
   * Handle feedback submission
   */
  const handleSubmit = async () => {
    const success = await submitFeedback();
    if (success && onComplete) {
      onComplete();
    }
  };

  /**
   * Handle skip feedback
   */
  const handleSkip = async () => {
    const success = await skipFeedback();
    if (success && onComplete) {
      onComplete();
    }
  };

  /**
   * Handle rating selection
   */
  const handleRatingSelect = (rating) => {
    updateRating(rating);
    clearError();
  };

  /**
   * Handle feedback text change
   */
  const handleFeedbackChange = (e) => {
    updateFeedbackText(e.target.value);
  };

  /**
   * Handle keyboard navigation for rating buttons
   */
  const handleRatingKeyDown = (event, rating) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRatingSelect(rating);
    }
  };

  const characterInfo = getCharacterInfo();

  if (isSubmitted) {
    return (
      <div
        className={`glass-card feedback-section feedback-complete ${className}`}
      >
        <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
          <div className="feedback-complete-icon">✨</div>
          <h3 className="feedback-complete-title">
            Thank you for your feedback
          </h3>
          <p className="feedback-complete-message">
            Your insights help us create deeper reflections for everyone.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card feedback-section ${className}`}>
      <div style={{ padding: "var(--space-xl)" }}>
        {/* Section Header */}
        <div className="feedback-header">
          <h3 className="feedback-title">
            How deeply did this help you access your truth?
          </h3>
        </div>

        {/* Rating Selection */}
        <div className="rating-section">
          <div
            className="rating-buttons"
            role="radiogroup"
            aria-label="Reflection helpfulness rating from 1 to 10"
            aria-required="true"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <button
                key={rating}
                type="button"
                className={`cosmic-button rating-button ${
                  selectedRating === rating ? "cosmic-button--gentle" : ""
                }`}
                onClick={() => handleRatingSelect(rating)}
                onKeyDown={(e) => handleRatingKeyDown(e, rating)}
                aria-pressed={selectedRating === rating}
                aria-checked={selectedRating === rating}
                role="radio"
                tabIndex={selectedRating === rating ? 0 : -1}
                title={getRatingText(rating)}
              >
                {rating}
              </button>
            ))}
          </div>

          <div className="rating-scale-labels">
            <span>Not at all</span>
            <span>Deeply</span>
          </div>

          {/* Rating Description */}
          {hasRating && (
            <div className="rating-description" aria-live="polite">
              {getRatingText(selectedRating)}
            </div>
          )}
        </div>

        {/* Feedback Text */}
        <div className="feedback-text-section">
          <label htmlFor="feedback-text" className="sr-only">
            Additional feedback (optional)
          </label>
          <textarea
            id="feedback-text"
            className="cosmic-textarea"
            value={feedbackText}
            onChange={handleFeedbackChange}
            placeholder="What emerged for you? (optional)"
            maxLength={500}
            rows={3}
            aria-describedby="feedback-char-count"
          />

          <div id="feedback-char-count">
            <CharacterCounter
              value={feedbackText}
              maxLength={500}
              showProgress={true}
              showRemaining={true}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="feedback-error" role="alert">
            <span className="feedback-error-icon">⚠️</span>
            <span className="feedback-error-text">{error}</span>
            <button
              type="button"
              className="feedback-error-dismiss"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="feedback-actions">
          <button
            type="button"
            className="cosmic-button cosmic-button--gentle"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-describedby={!hasRating ? "rating-required-help" : undefined}
          >
            <span>{getSubmitButtonText()}</span>
          </button>

          <button
            type="button"
            className="cosmic-button"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip
          </button>
        </div>

        {/* Help Text */}
        {!hasRating && (
          <div id="rating-required-help" className="feedback-help">
            Please select a rating to submit feedback
          </div>
        )}
      </div>

      {/* Component Styles */}
      <style jsx>{`
        .feedback-section {
          margin: var(--space-2xl) 0;
          animation: feedbackAppear 0.8s ease-out;
        }

        .feedback-complete {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.08),
            rgba(16, 185, 129, 0.04)
          );
          border-color: rgba(16, 185, 129, 0.2);
        }

        .feedback-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .feedback-title {
          font-size: var(--text-lg);
          font-weight: var(--font-light);
          color: var(--cosmic-text);
          line-height: var(--leading-normal);
          margin: 0;
        }

        .feedback-complete-icon {
          font-size: var(--text-3xl);
          margin-bottom: var(--space-md);
        }

        .feedback-complete-title {
          font-size: var(--text-xl);
          font-weight: var(--font-medium);
          color: var(--success-primary);
          margin: 0 0 var(--space-md) 0;
        }

        .feedback-complete-message {
          font-size: var(--text-base);
          color: var(--cosmic-text-secondary);
          margin: 0;
          line-height: var(--leading-relaxed);
        }

        .rating-section {
          margin-bottom: var(--space-xl);
        }

        .rating-buttons {
          display: flex;
          justify-content: center;
          gap: var(--space-2);
          margin-bottom: var(--space-md);
          flex-wrap: wrap;
        }

        .rating-button {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          font-size: var(--text-base);
          font-weight: var(--font-medium);
          transition: var(--transition-smooth);
        }

        .rating-button[aria-pressed="true"] {
          transform: scale(1.1);
          box-shadow: var(--glow-md);
        }

        .rating-button:focus-visible {
          outline: var(--focus-ring);
          outline-offset: var(--focus-ring-offset);
        }

        .rating-scale-labels {
          display: flex;
          justify-content: space-between;
          max-width: 500px;
          margin: 0 auto var(--space-md);
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
        }

        .rating-description {
          text-align: center;
          font-size: var(--text-sm);
          color: var(--cosmic-text-secondary);
          font-style: italic;
          opacity: var(--opacity-80);
          animation: ratingDescriptionFade 0.3s ease-in;
        }

        .feedback-text-section {
          margin-bottom: var(--space-xl);
        }

        .feedback-text-section .cosmic-textarea {
          width: 100%;
          min-height: 80px;
          margin-bottom: var(--space-md);
        }

        .feedback-error {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-lg);
          animation: errorSlideIn 0.3s ease-out;
        }

        .feedback-error-icon {
          flex-shrink: 0;
          font-size: var(--text-lg);
        }

        .feedback-error-text {
          flex: 1;
          color: var(--error-primary);
          font-size: var(--text-sm);
        }

        .feedback-error-dismiss {
          flex-shrink: 0;
          background: none;
          border: none;
          color: var(--error-primary);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }

        .feedback-error-dismiss:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .feedback-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          flex-wrap: wrap;
        }

        .feedback-actions .cosmic-button {
          padding: var(--space-md) var(--space-xl);
        }

        .feedback-help {
          margin-top: var(--space-md);
          text-align: center;
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          font-style: italic;
        }

        @keyframes feedbackAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ratingDescriptionFade {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: var(--opacity-80);
            transform: translateY(0);
          }
        }

        @keyframes errorSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .rating-buttons {
            gap: var(--space-1);
          }

          .rating-button {
            width: 40px;
            height: 40px;
            font-size: var(--text-sm);
          }

          .feedback-actions {
            flex-direction: column;
            align-items: center;
          }

          .feedback-actions .cosmic-button {
            width: 100%;
            max-width: 280px;
          }
        }

        @media (max-width: 480px) {
          .rating-buttons {
            grid-template-columns: repeat(5, 1fr);
            display: grid;
            max-width: 300px;
            margin: 0 auto var(--space-md);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .feedback-section,
          .rating-description,
          .feedback-error {
            animation: none;
          }

          .rating-button[aria-pressed="true"] {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FeedbackSection;
