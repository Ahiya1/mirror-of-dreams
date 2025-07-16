// components/shared/ToneSelector.jsx - Enhanced tone selector component

import React, { useCallback } from "react";
import { TONES } from "../../../utils/constants";

/**
 * Enhanced tone selector with improved accessibility and haptic feedback
 * @param {Object} props - Component props
 * @param {string} props.selectedTone - Currently selected tone
 * @param {Function} props.onToneChange - Callback when tone changes
 * @param {boolean} props.disabled - Whether selector is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Tone selector component
 */
const ToneSelector = ({
  selectedTone = "fusion",
  onToneChange,
  disabled = false,
  className = "",
}) => {
  /**
   * Handle tone selection with haptic feedback and validation
   * @param {string} toneId - Selected tone ID
   */
  const handleToneSelect = useCallback(
    (toneId) => {
      if (disabled || toneId === selectedTone) return;

      // Haptic feedback for mobile devices
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Call parent handler
      if (onToneChange) {
        onToneChange(toneId);
      }
    },
    [disabled, selectedTone, onToneChange]
  );

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   * @param {string} toneId - Tone ID for the button
   */
  const handleKeyDown = useCallback(
    (event, toneId) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToneSelect(toneId);
      }
    },
    [handleToneSelect]
  );

  /**
   * Get button class name based on selection state
   * @param {string} toneId - Tone ID
   * @returns {string} - CSS class name
   */
  const getToneButtonClassName = useCallback(
    (toneId) => {
      let className = "cosmic-button";

      if (selectedTone === toneId) {
        className += ` cosmic-button--${toneId}`;
      }

      if (disabled) {
        className += " cosmic-button--disabled";
      }

      return className;
    },
    [selectedTone, disabled]
  );

  /**
   * Get aria-label for tone button
   * @param {Object} tone - Tone object
   * @returns {string} - Aria label
   */
  const getAriaLabel = useCallback(
    (tone) => {
      const isSelected = selectedTone === tone.id;
      const status = isSelected ? "selected" : "not selected";
      return `${tone.label}: ${tone.description}. Currently ${status}`;
    },
    [selectedTone]
  );

  return (
    <div className={`tone-selector ${className}`}>
      <div className="tone-label">
        <span>Choose the voice of your reflection</span>
        <div className="tone-label-underline" aria-hidden="true" />
      </div>

      <div
        className="tone-buttons"
        role="radiogroup"
        aria-label="Reflection tone selection"
        aria-required="true"
      >
        {TONES.map((tone) => (
          <button
            key={tone.id}
            type="button"
            className={getToneButtonClassName(tone.id)}
            onClick={() => handleToneSelect(tone.id)}
            onKeyDown={(e) => handleKeyDown(e, tone.id)}
            disabled={disabled}
            aria-pressed={selectedTone === tone.id}
            aria-label={getAriaLabel(tone)}
            title={tone.description}
            role="radio"
            aria-checked={selectedTone === tone.id}
          >
            <span className="tone-button-text">{tone.label}</span>

            {/* Visual indicator for selected state */}
            {selectedTone === tone.id && (
              <span className="tone-button-indicator" aria-hidden="true">
                ✨
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Description for selected tone */}
      <div className="tone-description" aria-live="polite" aria-atomic="true">
        {(() => {
          const currentTone = TONES.find((t) => t.id === selectedTone);
          return currentTone ? currentTone.description : "";
        })()}
      </div>

      {/* Inline styles for enhanced visual elements */}
      <style jsx>{`
        .tone-label {
          position: relative;
          font-size: var(--text-lg);
          color: var(--cosmic-text-secondary);
          margin-bottom: var(--space-xl);
          font-weight: var(--font-light);
          letter-spacing: var(--tracking-wide);
          text-align: center;
        }

        .tone-label-underline {
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

        .tone-buttons {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-4);
        }

        .tone-buttons .cosmic-button {
          flex: 1;
          min-width: 140px;
          max-width: 220px;
          position: relative;
          transition: var(--transition-smooth);
        }

        .tone-buttons .cosmic-button[aria-pressed="true"] {
          transform: scale(1.05);
          box-shadow: var(--glow-md);
        }

        .tone-buttons .cosmic-button:focus-visible {
          outline: var(--focus-ring);
          outline-offset: var(--focus-ring-offset);
        }

        .tone-buttons .cosmic-button--disabled {
          opacity: var(--opacity-50);
          cursor: not-allowed;
          transform: none !important;
        }

        .tone-button-text {
          display: block;
          transition: var(--transition-fast);
        }

        .tone-button-indicator {
          position: absolute;
          top: var(--space-2);
          right: var(--space-2);
          font-size: var(--text-xs);
          opacity: var(--opacity-80);
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: var(--opacity-60);
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .tone-description {
          text-align: center;
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          font-style: italic;
          opacity: var(--opacity-70);
          min-height: 1.5em;
          transition: var(--transition-smooth);
        }

        .tone-description:empty {
          opacity: 0;
        }

        @media (max-width: 768px) {
          .tone-buttons {
            flex-direction: column;
            align-items: center;
          }

          .tone-buttons .cosmic-button {
            width: 100%;
            max-width: 280px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tone-button-indicator {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ToneSelector;
