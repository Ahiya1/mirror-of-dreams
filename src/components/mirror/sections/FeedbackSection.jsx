// components/mirror/sections/FeedbackSection.jsx - Optimized for speed

import React, { useState, useCallback, memo } from "react";

/**
 * Fast, optimized feedback section component
 * Minimal re-renders, instant loading, efficient state management
 */
const FeedbackSection = memo(
  ({
    reflectionId,
    authToken,
    onComplete,
    className = "",
    optimized = false,
  }) => {
    const [selectedRating, setSelectedRating] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Handle rating selection with immediate visual feedback
     */
    const handleRatingSelect = useCallback((rating) => {
      setSelectedRating(rating);
      setError(null); // Clear any errors

      // Haptic feedback for mobile
      if (navigator?.vibrate) {
        navigator.vibrate(30);
      }
    }, []);

    /**
     * Handle feedback text change (debounced)
     */
    const handleFeedbackChange = useCallback((e) => {
      const value = e.target.value;
      if (value.length <= 500) {
        setFeedbackText(value);
      }
    }, []);

    /**
     * Submit feedback with optimistic updates
     */
    const handleSubmit = useCallback(async () => {
      if (!selectedRating) {
        setError("Please select a rating");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // Optimistic update - assume success
        setIsSubmitted(true);

        // Actual API call (non-blocking for UX)
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            reflectionId,
            rating: selectedRating,
            feedback: feedbackText.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit feedback");
        }

        // Call completion handler after short delay for UX
        setTimeout(() => {
          onComplete?.();
        }, 1500);
      } catch (error) {
        console.error("Feedback submission failed:", error);
        // Revert optimistic update
        setIsSubmitted(false);
        setError("Failed to submit feedback. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }, [selectedRating, feedbackText, reflectionId, authToken, onComplete]);

    /**
     * Skip feedback with immediate completion
     */
    const handleSkip = useCallback(() => {
      onComplete?.();
    }, [onComplete]);

    /**
     * Get rating description for accessibility
     */
    const getRatingDescription = useCallback((rating) => {
      const descriptions = {
        1: "Not helpful at all",
        2: "Slightly helpful",
        3: "Somewhat helpful",
        4: "Moderately helpful",
        5: "Helpful",
        6: "Very helpful",
        7: "Quite helpful",
        8: "Extremely helpful",
        9: "Profoundly helpful",
        10: "Life-changing",
      };
      return descriptions[rating] || "";
    }, []);

    // Success state with minimal re-renders
    if (isSubmitted) {
      return (
        <div className={`feedback-section feedback-success ${className}`}>
          <div className="success-content">
            <div className="success-icon">✨</div>
            <h4>Thank you for your feedback</h4>
            <p>Your insights help us create deeper reflections</p>
          </div>

          <style jsx>{`
            .feedback-success {
              padding: 2rem;
              background: rgba(16, 185, 129, 0.1);
              border: 2px solid rgba(16, 185, 129, 0.3);
              border-radius: 20px;
              backdrop-filter: blur(20px);
              text-align: center;
              animation: successFadeIn 0.5s ease-out;
            }

            @keyframes successFadeIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            .success-icon {
              font-size: 2.5rem;
              margin-bottom: 1rem;
              animation: sparkle 2s ease-in-out infinite;
            }

            @keyframes sparkle {
              0%,
              100% {
                transform: scale(1) rotate(0deg);
                opacity: 0.8;
              }
              50% {
                transform: scale(1.1) rotate(180deg);
                opacity: 1;
              }
            }

            .success-content h4 {
              color: rgba(16, 185, 129, 0.9);
              font-size: 1.4rem;
              font-weight: 500;
              margin-bottom: 0.5rem;
            }

            .success-content p {
              color: rgba(255, 255, 255, 0.7);
              font-size: 1rem;
              margin: 0;
            }

            @media (prefers-reduced-motion: reduce) {
              .feedback-success,
              .success-icon {
                animation: none;
              }
            }
          `}</style>
        </div>
      );
    }

    return (
      <div className={`feedback-section ${className}`}>
        <div className="feedback-content">
          {/* Header */}
          <div className="feedback-header">
            <h4>How deeply did this reflection serve you?</h4>
          </div>

          {/* Rating Grid - Optimized for fast interaction */}
          <div
            className="rating-grid"
            role="radiogroup"
            aria-label="Reflection rating"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <button
                key={rating}
                type="button"
                className={`rating-button ${
                  selectedRating === rating ? "selected" : ""
                }`}
                onClick={() => handleRatingSelect(rating)}
                aria-pressed={selectedRating === rating}
                aria-label={`${rating} out of 10 - ${getRatingDescription(
                  rating
                )}`}
                title={getRatingDescription(rating)}
              >
                {rating}
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          <div className="rating-labels">
            <span>Not at all</span>
            <span>Deeply</span>
          </div>

          {/* Selected Rating Description */}
          {selectedRating && (
            <div className="rating-description">
              {getRatingDescription(selectedRating)}
            </div>
          )}

          {/* Optional Text Feedback */}
          <div className="text-feedback">
            <textarea
              className="feedback-textarea"
              value={feedbackText}
              onChange={handleFeedbackChange}
              placeholder="What emerged for you? (optional)"
              maxLength={500}
              rows={3}
              aria-label="Additional feedback"
            />
            <div className="char-count">{feedbackText.length}/500</div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="feedback-actions">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!selectedRating || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Feedback</span>
              )}
            </button>

            <button
              className="skip-button"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip
            </button>
          </div>
        </div>

        {/* Optimized styles with CSS variables for performance */}
        <style jsx>{`
          .feedback-section {
            width: 100%;
            max-width: 500px;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(25px);
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 2rem;
            animation: slideUp 0.3s ease-out;
            --primary-color: rgba(59, 130, 246, 0.9);
            --success-color: rgba(16, 185, 129, 0.9);
            --error-color: rgba(239, 68, 68, 0.9);
            --text-primary: rgba(255, 255, 255, 0.9);
            --text-secondary: rgba(255, 255, 255, 0.7);
            --text-muted: rgba(255, 255, 255, 0.5);
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .feedback-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .feedback-header h4 {
            color: var(--text-primary);
            font-size: 1.2rem;
            font-weight: 400;
            text-align: center;
            margin: 0;
            line-height: 1.4;
          }

          .rating-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 0.75rem;
            margin: 0 auto;
            max-width: 300px;
          }

          .rating-button {
            width: 48px;
            height: 48px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            color: var(--text-secondary);
            font-size: 1rem;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }

          .rating-button::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(
              45deg,
              transparent,
              rgba(255, 255, 255, 0.1),
              transparent
            );
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .rating-button:hover::before {
            transform: translateX(100%);
          }

          .rating-button:hover {
            border-color: var(--primary-color);
            background: rgba(59, 130, 246, 0.1);
            color: var(--text-primary);
            transform: translateY(-2px);
          }

          .rating-button.selected {
            border-color: var(--primary-color);
            background: rgba(59, 130, 246, 0.2);
            color: var(--primary-color);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
            transform: scale(1.05);
          }

          .rating-button:focus-visible {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
          }

          .rating-labels {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: var(--text-muted);
            max-width: 300px;
            margin: 0 auto;
          }

          .rating-description {
            text-align: center;
            font-size: 0.9rem;
            color: var(--primary-color);
            font-style: italic;
            animation: fadeIn 0.3s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .text-feedback {
            position: relative;
          }

          .feedback-textarea {
            width: 100%;
            background: rgba(255, 255, 255, 0.08);
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 1rem;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.95rem;
            line-height: 1.5;
            resize: vertical;
            min-height: 80px;
            transition: all 0.3s ease;
          }

          .feedback-textarea:focus {
            outline: none;
            border-color: var(--primary-color);
            background: rgba(255, 255, 255, 0.12);
          }

          .feedback-textarea::placeholder {
            color: var(--text-muted);
            font-style: italic;
          }

          .char-count {
            position: absolute;
            bottom: 0.5rem;
            right: 1rem;
            font-size: 0.75rem;
            color: var(--text-muted);
            pointer-events: none;
          }

          .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            padding: 0.75rem;
            color: var(--error-color);
            font-size: 0.9rem;
            text-align: center;
            animation: errorShake 0.5s ease-out;
          }

          @keyframes errorShake {
            0%,
            100% {
              transform: translateX(0);
            }
            25% {
              transform: translateX(-5px);
            }
            75% {
              transform: translateX(5px);
            }
          }

          .feedback-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }

          .submit-button,
          .skip-button {
            padding: 0.875rem 2rem;
            border-radius: 25px;
            font-family: inherit;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 120px;
            justify-content: center;
          }

          .submit-button {
            background: linear-gradient(
              135deg,
              var(--primary-color),
              rgba(59, 130, 246, 0.7)
            );
            color: white;
            border-color: var(--primary-color);
          }

          .submit-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          }

          .submit-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .skip-button {
            background: transparent;
            color: var(--text-secondary);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .skip-button:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-primary);
            transform: translateY(-2px);
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          /* Mobile optimizations */
          @media (max-width: 768px) {
            .feedback-section {
              padding: 1.5rem;
            }

            .rating-grid {
              grid-template-columns: repeat(5, 1fr);
              gap: 0.5rem;
              max-width: 280px;
            }

            .rating-button {
              width: 44px;
              height: 44px;
              font-size: 0.9rem;
            }

            .feedback-actions {
              flex-direction: column;
            }

            .submit-button,
            .skip-button {
              width: 100%;
            }
          }

          @media (max-width: 480px) {
            .rating-grid {
              grid-template-columns: repeat(5, 1fr);
              gap: 0.4rem;
              max-width: 250px;
            }

            .rating-button {
              width: 40px;
              height: 40px;
              font-size: 0.85rem;
            }
          }

          /* Performance optimizations */
          @media (prefers-reduced-motion: reduce) {
            .feedback-section,
            .rating-description,
            .error-message,
            .rating-button,
            .submit-button,
            .skip-button {
              animation: none;
              transition: none;
            }

            .rating-button:hover,
            .submit-button:hover,
            .skip-button:hover {
              transform: none;
            }
          }

          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .rating-button {
              border-width: 3px;
            }

            .rating-button.selected {
              background: var(--primary-color);
              color: white;
            }
          }
        `}</style>
      </div>
    );
  }
);

FeedbackSection.displayName = "FeedbackSection";

export default FeedbackSection;
