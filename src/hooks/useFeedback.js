// hooks/useFeedback.js - Feedback submission hook

import { useState, useCallback } from "react";
import { reflectionService } from "../services/reflection.service";
import { ApiError } from "../services/api";

/**
 * Feedback hook for managing reflection feedback submission
 * @param {string} reflectionId - Reflection ID
 * @param {string} authToken - Authentication token
 * @returns {Object} - Feedback state and methods
 */
export const useFeedback = (reflectionId, authToken) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Submit feedback for the reflection
   * @returns {Promise<boolean>} - Success status
   */
  const submitFeedback = useCallback(async () => {
    if (!selectedRating) {
      setError("Please select a rating from 1-10");
      return false;
    }

    if (!reflectionId) {
      setError("No reflection ID provided");
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reflectionService.submitFeedback(
        reflectionId,
        selectedRating,
        feedbackText.trim()
      );

      setIsSubmitted(true);
      console.log(
        `Feedback submitted: ${selectedRating}/10 for reflection ${reflectionId}`
      );
      return true;
    } catch (error) {
      console.error("Feedback submission error:", error);

      const errorMessage =
        error instanceof ApiError
          ? error.getUserMessage()
          : "Failed to submit feedback. Please try again.";

      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [reflectionId, selectedRating, feedbackText]);

  /**
   * Update rating selection
   * @param {number} rating - Rating from 1-10
   */
  const updateRating = useCallback((rating) => {
    if (rating >= 1 && rating <= 10) {
      setSelectedRating(rating);
      setError(null);
    }
  }, []);

  /**
   * Update feedback text
   * @param {string} text - Feedback text
   */
  const updateFeedbackText = useCallback((text) => {
    setFeedbackText(text);
  }, []);

  /**
   * Clear feedback form
   */
  const clearFeedback = useCallback(() => {
    setSelectedRating(null);
    setFeedbackText("");
    setError(null);
    setIsSubmitted(false);
  }, []);

  /**
   * Reset feedback state
   */
  const resetFeedback = useCallback(() => {
    clearFeedback();
    setIsSubmitting(false);
  }, [clearFeedback]);

  /**
   * Validate feedback before submission
   * @returns {Object} - Validation result
   */
  const validateFeedback = useCallback(() => {
    const errors = [];

    if (!selectedRating || selectedRating < 1 || selectedRating > 10) {
      errors.push("Please select a rating from 1-10");
    }

    if (feedbackText.length > 500) {
      errors.push("Feedback text cannot exceed 500 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [selectedRating, feedbackText]);

  /**
   * Get rating display text
   * @param {number} rating - Rating value
   * @returns {string} - Display text for rating
   */
  const getRatingText = useCallback((rating) => {
    const ratingTexts = {
      1: "Not helpful",
      2: "Slightly helpful",
      3: "Somewhat helpful",
      4: "Moderately helpful",
      5: "Helpful",
      6: "Very helpful",
      7: "Quite insightful",
      8: "Very insightful",
      9: "Deeply meaningful",
      10: "Profoundly transformative",
    };

    return ratingTexts[rating] || "";
  }, []);

  /**
   * Get character count info for feedback text
   * @returns {Object} - Character count information
   */
  const getCharacterInfo = useCallback(() => {
    const length = feedbackText.length;
    const maxLength = 500;
    const percentage = (length / maxLength) * 100;

    return {
      length,
      maxLength,
      remaining: maxLength - length,
      percentage: Math.min(percentage, 100),
      isApproachingLimit: length >= maxLength * 0.8,
      isAtLimit: length >= maxLength,
    };
  }, [feedbackText]);

  /**
   * Quick submit with just rating
   * @param {number} rating - Rating from 1-10
   * @returns {Promise<boolean>} - Success status
   */
  const quickSubmitRating = useCallback(
    async (rating) => {
      updateRating(rating);

      // Use a timeout to ensure state is updated
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await submitFeedback();
          resolve(result);
        }, 0);
      });
    },
    [updateRating, submitFeedback]
  );

  /**
   * Skip feedback submission
   * @returns {Promise<boolean>} - Always returns true
   */
  const skipFeedback = useCallback(async () => {
    setIsSubmitted(true);
    console.log("Feedback skipped for reflection", reflectionId);
    return true;
  }, [reflectionId]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get submit button text
   * @returns {string} - Submit button text
   */
  const getSubmitButtonText = useCallback(() => {
    if (isSubmitting) {
      return "Submitting...";
    }

    if (isSubmitted) {
      return "Submitted";
    }

    return "Submit Feedback";
  }, [isSubmitting, isSubmitted]);

  /**
   * Check if form can be submitted
   * @returns {boolean} - Whether form can be submitted
   */
  const canSubmit = useCallback(() => {
    return (
      !isSubmitting &&
      !isSubmitted &&
      selectedRating &&
      selectedRating >= 1 &&
      selectedRating <= 10
    );
  }, [isSubmitting, isSubmitted, selectedRating]);

  return {
    // State
    selectedRating,
    feedbackText,
    isSubmitting,
    isSubmitted,
    error,

    // Actions
    submitFeedback,
    updateRating,
    updateFeedbackText,
    clearFeedback,
    resetFeedback,
    quickSubmitRating,
    skipFeedback,
    clearError,

    // Utilities
    validateFeedback,
    getRatingText,
    getCharacterInfo,
    getSubmitButtonText,
    canSubmit,

    // Status checks
    hasRating: !!selectedRating,
    hasFeedback: feedbackText.trim().length > 0,
    isValid: canSubmit(),
  };
};
