// components/mirror/Questionnaire.jsx - Refactored with new architecture

import React, { useState, useEffect } from "react";
import CosmicBackground from "../shared/CosmicBackground";
import ToneElements from "../shared/ToneElements";
import ToneSelector from "../shared/ToneSelector";
import QuestionCard from "../shared/QuestionCard";
import { useAuth } from "../../hooks/useAuth";
import { useFormPersistence } from "../../hooks/useFormPersistence";
import { reflectionService } from "../../services/reflection.service";
import { validateReflectionForm } from "../../utils/validation";
import { RESPONSE_MESSAGES } from "../../utils/constants";

/**
 * Enhanced questionnaire component with clean architecture
 */
const Questionnaire = () => {
  // Authentication state
  const {
    user,
    isLoading: isAuthLoading,
    isAuthenticated,
    error: authError,
    redirectToAuth,
  } = useAuth();

  // UI state
  const [selectedTone, setSelectedTone] = useState("fusion");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Form state with persistence
  const {
    formData,
    isRestored,
    updateField,
    resetForm,
    getSubmissionData,
    handleSubmit: handleFormSubmit,
    hasUnsavedChanges,
  } = useFormPersistence(
    user?.id,
    {
      dream: "",
      plan: "",
      hasDate: "",
      dreamDate: "",
      relationship: "",
      offering: "",
    },
    {
      enablePersistence: true,
      clearOnSubmit: true,
      validateBeforeRestore: (state) => {
        // Validate restored state
        return state && typeof state === "object" && state.userId === user?.id;
      },
    }
  );

  /**
   * Handle tone change with haptic feedback
   */
  const handleToneChange = (tone) => {
    setSelectedTone(tone);
    // Add subtle haptic feedback on mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  /**
   * Handle form field updates
   */
  const handleFieldChange = (field, value) => {
    updateField(field, value);
    setSubmitError(null); // Clear any previous submission errors
  };

  /**
   * Handle choice selection (for hasDate field)
   */
  const handleChoiceSelect = (field, value) => {
    updateField(field, value);

    // Clear date if "no" is selected
    if (field === "hasDate" && value === "no") {
      updateField("dreamDate", "");
    }
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    const validation = validateReflectionForm({
      ...formData,
      selectedTone,
    });

    if (!validation.isValid) {
      setSubmitError(RESPONSE_MESSAGES.FORM_INCOMPLETE);

      // Focus on first invalid field if possible
      if (validation.field) {
        setTimeout(() => {
          const element = document.getElementById(
            `question-${getQuestionNumber(validation.field)}`
          );
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }

      return false;
    }

    return true;
  };

  /**
   * Get question number for field
   */
  const getQuestionNumber = (field) => {
    const fieldMap = {
      dream: 1,
      plan: 2,
      hasDate: 3,
      dreamDate: 3,
      relationship: 4,
      offering: 5,
    };
    return fieldMap[field] || 1;
  };

  /**
   * Handle reflection submission
   */
  const handleReflectionSubmit = async (submissionData) => {
    if (!user) {
      redirectToAuth();
      return;
    }

    const reflectionData = {
      ...submissionData,
      userName: user.name || "Friend",
      userEmail: user.email || "",
      language: "en",
      isAdmin: user.isAdmin || false,
      isCreator: user.isCreator || false,
      isPremium: user.tier === "premium" || user.isCreator || false,
      tone: selectedTone,
    };

    try {
      const response = await reflectionService.createReflection(reflectionData);

      // Redirect to output page
      window.location.href = `/mirror/output?id=${response.reflectionId}`;

      return response;
    } catch (error) {
      console.error("Reflection creation failed:", error);

      if (error.status === 403) {
        throw new Error(error.message || RESPONSE_MESSAGES.REFLECTION_LIMIT);
      }

      throw new Error(RESPONSE_MESSAGES.GENERIC_ERROR);
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate form
    if (!validateForm()) return;

    setIsSubmitting(true);
    setShowLoading(true);
    setSubmitError(null);

    try {
      await handleFormSubmit(handleReflectionSubmit);
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmitError(error.message || RESPONSE_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
      setShowLoading(false);
    }
  };

  /**
   * Handle page unload warning for unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges() && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  // Show loading while authenticating
  if (isAuthLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <ToneElements tone={selectedTone} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-2xl)",
          }}
        >
          <div className="loading-circle" />
          <div className="loading-text">Preparing your reflection space...</div>
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

  // Show loading during submission
  if (showLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <ToneElements tone={selectedTone} />
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
          <div className="loading-text">Reflecting your truth...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mirror-container">
      <CosmicBackground />
      <ToneElements tone={selectedTone} />

      {/* Back Navigation */}
      <a href="/" className="back-link">
        <span>←</span>
        <span>Return to Portal</span>
      </a>

      <div className="mirror-content">
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

        {/* Tone Selector */}
        <ToneSelector
          selectedTone={selectedTone}
          onToneChange={handleToneChange}
          disabled={isSubmitting}
        />

        {/* Form */}
        <form onSubmit={onSubmit} noValidate>
          {/* Question 1: Dream */}
          <QuestionCard
            questionNumber={1}
            title="What is your dream?"
            subtitle="Choose just one — the one that calls you most right now."
            type="textarea"
            value={formData.dream}
            onChange={(value) => handleFieldChange("dream", value)}
            maxLength={3200}
            placeholder="Write the dream that calls you..."
            required
          />

          {/* Question 2: Plan */}
          <QuestionCard
            questionNumber={2}
            title="What is your plan for achieving this dream?"
            subtitle="Write what you already know. It's okay if it's unclear."
            type="textarea"
            value={formData.plan}
            onChange={(value) => handleFieldChange("plan", value)}
            maxLength={4000}
            placeholder="Describe any plan (or absence of plan)..."
            required
          />

          {/* Question 3: Date */}
          <QuestionCard
            questionNumber={3}
            title="Have you set a definite date for fulfilling your dream?"
            type="choice"
            choices={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            selectedChoice={formData.hasDate}
            onChoiceSelect={(value) => handleChoiceSelect("hasDate", value)}
            showDateInput={formData.hasDate === "yes"}
            dateValue={formData.dreamDate}
            onDateChange={(value) => handleFieldChange("dreamDate", value)}
            required
          />

          {/* Question 4: Relationship */}
          <QuestionCard
            questionNumber={4}
            title="What is your current relationship with this dream?"
            subtitle="Do you believe you'll achieve it? Why or why not?"
            type="textarea"
            value={formData.relationship}
            onChange={(value) => handleFieldChange("relationship", value)}
            maxLength={4000}
            placeholder="How do you relate to this dream now?"
            required
          />

          {/* Question 5: Offering */}
          <QuestionCard
            questionNumber={5}
            title="What are you willing to give in return?"
            subtitle="Energy, focus, love, time — what will you offer to this dream?"
            type="textarea"
            value={formData.offering}
            onChange={(value) => handleFieldChange("offering", value)}
            maxLength={2400}
            placeholder="What will you offer in return?"
            required
          />

          {/* Submission Error */}
          {submitError && (
            <div className="submission-error" role="alert">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="cosmic-button cosmic-button--primary"
            disabled={isSubmitting}
            style={{
              width: "100%",
              marginTop: "var(--space-2xl)",
              padding: "var(--space-lg) var(--space-xl)",
              fontSize: "var(--text-lg)",
              fontWeight: 500,
              letterSpacing: "1px",
              textTransform: "uppercase",
              minHeight: "64px",
            }}
          >
            {isSubmitting
              ? "Creating your reflection..."
              : "Receive Your Reflection"}
          </button>
        </form>
      </div>

      {/* Component Styles */}
      <style jsx>{`
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

        .loading-text {
          font-size: var(--text-lg);
          font-weight: var(--font-light);
          opacity: 0.8;
          letter-spacing: 1px;
          color: var(--cosmic-text-secondary);
          animation: loadingPulse 3s ease-in-out infinite;
        }

        .submission-error {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-lg);
          margin-top: var(--space-lg);
          animation: errorSlideIn 0.3s ease-out;
        }

        .error-icon {
          flex-shrink: 0;
          font-size: var(--text-lg);
        }

        .error-text {
          color: var(--error-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
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

        @keyframes errorSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .mirror-container {
            padding: var(--space-md);
          }

          .cosmic-button {
            font-size: var(--text-base);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-text {
            animation: none;
          }

          .submission-error {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Questionnaire;
