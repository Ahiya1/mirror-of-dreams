// components/shared/QuestionCard.jsx - Enhanced question card component

import React, { useCallback, useMemo } from "react";
import CharacterCounter from "./CharacterCounter";
import { validateField } from "../../../utils/validation";
import { QUESTION_LIMITS } from "../../../utils/constants";

/**
 * Enhanced question card component with validation and accessibility
 * @param {Object} props - Component props
 * @param {number} props.questionNumber - Question number
 * @param {string} props.title - Question title
 * @param {string} props.subtitle - Question subtitle/description
 * @param {string} props.type - Input type ('textarea', 'choice')
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {Array} props.choices - Choice options for choice type
 * @param {string} props.selectedChoice - Selected choice value
 * @param {Function} props.onChoiceSelect - Choice selection handler
 * @param {boolean} props.showDateInput - Whether to show date input
 * @param {string} props.dateValue - Date input value
 * @param {Function} props.onDateChange - Date change handler
 * @param {number} props.maxLength - Maximum character length
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Question card component
 */
const QuestionCard = ({
  questionNumber,
  title,
  subtitle,
  type = "textarea",
  value = "",
  onChange,
  choices = [],
  selectedChoice,
  onChoiceSelect,
  showDateInput = false,
  dateValue = "",
  onDateChange,
  maxLength,
  placeholder = "",
  required = true,
  className = "",
}) => {
  /**
   * Handle textarea change with validation
   */
  const handleTextareaChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  /**
   * Handle choice selection
   */
  const handleChoiceSelect = useCallback(
    (choiceValue) => {
      if (onChoiceSelect) {
        onChoiceSelect(choiceValue);
      }
    },
    [onChoiceSelect]
  );

  /**
   * Handle date input change
   */
  const handleDateChange = useCallback(
    (e) => {
      const newDate = e.target.value;
      if (onDateChange) {
        onDateChange(newDate);
      }
    },
    [onDateChange]
  );

  /**
   * Handle keyboard navigation for choices
   */
  const handleChoiceKeyDown = useCallback(
    (event, choiceValue) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleChoiceSelect(choiceValue);
      }
    },
    [handleChoiceSelect]
  );

  /**
   * Get validation state for current value
   */
  const validationState = useMemo(() => {
    if (type === "textarea" && value) {
      return validateField("dream", value); // Generic validation
    }
    return { isValid: true };
  }, [type, value]);

  /**
   * Get character limit for this question
   */
  const characterLimit = useMemo(() => {
    if (maxLength) return maxLength;

    // Default limits based on question number or title
    if (title.toLowerCase().includes("dream")) return QUESTION_LIMITS.dream;
    if (title.toLowerCase().includes("plan")) return QUESTION_LIMITS.plan;
    if (title.toLowerCase().includes("relationship"))
      return QUESTION_LIMITS.relationship;
    if (title.toLowerCase().includes("offering"))
      return QUESTION_LIMITS.offering;

    return 2000; // Default fallback
  }, [maxLength, title]);

  /**
   * Generate unique IDs for accessibility
   */
  const inputId = `question-${questionNumber}`;
  const titleId = `${inputId}-title`;
  const subtitleId = `${inputId}-subtitle`;

  return (
    <div className={`glass-card question-card ${className}`}>
      <div style={{ padding: "var(--space-xl)" }}>
        {/* Question Number */}
        <div className="question-number">Question {questionNumber}</div>

        {/* Question Title */}
        <h2 id={titleId} className="question-title">
          {title}
          {required && <span className="sr-only"> (required)</span>}
        </h2>

        {/* Question Subtitle */}
        {subtitle && (
          <p id={subtitleId} className="question-subtitle">
            {subtitle}
          </p>
        )}

        {/* Textarea Input */}
        {type === "textarea" && (
          <div>
            <textarea
              id={inputId}
              className="cosmic-textarea"
              value={value}
              onChange={handleTextareaChange}
              placeholder={placeholder}
              maxLength={characterLimit}
              rows={6}
              required={required}
              aria-labelledby={titleId}
              aria-describedby={subtitle ? subtitleId : undefined}
              aria-invalid={!validationState.isValid}
            />

            {/* Character Counter */}
            <CharacterCounter
              value={value}
              maxLength={characterLimit}
              showProgress={true}
            />

            {/* Validation Error */}
            {!validationState.isValid && validationState.error && (
              <div
                className="validation-error"
                role="alert"
                style={{
                  marginTop: "var(--space-2)",
                  color: "var(--error-primary)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {validationState.error}
              </div>
            )}
          </div>
        )}

        {/* Choice Input */}
        {type === "choice" && (
          <div>
            <div
              className="choice-buttons"
              role="radiogroup"
              aria-labelledby={titleId}
              aria-describedby={subtitle ? subtitleId : undefined}
              aria-required={required}
            >
              {choices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  className={`cosmic-button ${
                    selectedChoice === choice.value
                      ? "cosmic-button--gentle"
                      : ""
                  }`}
                  onClick={() => handleChoiceSelect(choice.value)}
                  onKeyDown={(e) => handleChoiceKeyDown(e, choice.value)}
                  aria-pressed={selectedChoice === choice.value}
                  aria-checked={selectedChoice === choice.value}
                  role="radio"
                  tabIndex={selectedChoice === choice.value ? 0 : -1}
                >
                  {choice.label}
                </button>
              ))}
            </div>

            {/* Date Input (conditional) */}
            {showDateInput && (
              <div
                className={`date-container ${
                  showDateInput ? "is-visible" : ""
                }`}
                style={{
                  opacity: showDateInput ? 1 : 0,
                  visibility: showDateInput ? "visible" : "hidden",
                  height: showDateInput ? "auto" : 0,
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }}
              >
                <label htmlFor={`${inputId}-date`} className="date-label">
                  Target Date:
                </label>
                <input
                  id={`${inputId}-date`}
                  type="date"
                  value={dateValue}
                  onChange={handleDateChange}
                  required={showDateInput && required}
                  aria-labelledby={titleId}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced styles */}
      <style jsx>{`
        .question-card {
          margin-bottom: var(--space-2xl);
          animation: questionReveal 0.6s ease-out;
        }

        @keyframes questionReveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .validation-error {
          animation: errorShake 0.5s ease-in-out;
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

        .choice-buttons .cosmic-button:focus-visible {
          outline: var(--focus-ring);
          outline-offset: var(--focus-ring-offset);
        }

        .date-container.is-visible {
          margin-top: var(--space-lg);
        }

        @media (max-width: 768px) {
          .question-card {
            margin-bottom: var(--space-xl);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .question-card {
            animation: none;
          }

          .date-container {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QuestionCard;
