// components/shared/CharacterCounter.jsx - Enhanced character counter component

import React, { useMemo } from "react";
import { getCharacterStats } from "../../../utils/validation";

/**
 * Enhanced character counter with visual progress and warnings
 * @param {Object} props - Component props
 * @param {string} props.value - Current text value
 * @param {number} props.maxLength - Maximum character limit
 * @param {number} props.minLength - Minimum character requirement
 * @param {boolean} props.showProgress - Whether to show progress bar
 * @param {boolean} props.showRemaining - Whether to show remaining count
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Character counter component
 */
const CharacterCounter = ({
  value = "",
  maxLength = 1000,
  minLength = 0,
  showProgress = true,
  showRemaining = false,
  className = "",
}) => {
  const stats = useMemo(() => {
    return getCharacterStats(value, maxLength);
  }, [value, maxLength]);

  const getCounterClassName = () => {
    let className = "char-count";

    if (stats.isAtLimit) {
      className += " char-count--danger";
    } else if (stats.isApproachingLimit) {
      className += " char-count--warning";
    }

    return className;
  };

  const getStatusText = () => {
    if (showRemaining && stats.remaining > 0) {
      return `${stats.remaining} characters remaining`;
    }

    if (stats.isAtLimit) {
      return "Character limit reached";
    }

    if (stats.isApproachingLimit) {
      return "Approaching character limit";
    }

    return `${stats.length} / ${maxLength} characters`;
  };

  const getProgressColor = () => {
    if (stats.percentage >= 100) {
      return "var(--error-primary)";
    }

    if (stats.percentage >= 80) {
      return "var(--warning-primary)";
    }

    return "var(--success-primary)";
  };

  // Don't render if no meaningful data
  if (maxLength <= 0) {
    return null;
  }

  return (
    <div className={`char-counter ${className}`}>
      <div className={getCounterClassName()}>{getStatusText()}</div>

      {showProgress && (
        <div className="char-progress">
          <div
            className="char-progress-bar"
            style={{
              width: `${Math.min(stats.percentage, 100)}%`,
              backgroundColor: getProgressColor(),
            }}
            role="progressbar"
            aria-valuenow={stats.length}
            aria-valuemin={0}
            aria-valuemax={maxLength}
            aria-label={`Character count: ${stats.length} of ${maxLength}`}
          />
        </div>
      )}

      {/* Screen reader only status */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {stats.isAtLimit && "Character limit reached"}
        {stats.isApproachingLimit &&
          !stats.isAtLimit &&
          "Approaching character limit"}
      </div>
    </div>
  );
};

export default CharacterCounter;
