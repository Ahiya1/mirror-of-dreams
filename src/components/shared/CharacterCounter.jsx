import React, { useMemo } from "react";

const CharacterCounter = ({ value = "", maxLength = 1000, minLength = 0 }) => {
  const stats = useMemo(() => {
    const length = value.length;
    const percentage = (length / maxLength) * 100;
    const isApproachingLimit = length >= maxLength * 0.8;
    const isAtLimit = length >= maxLength;
    const isValid = length >= minLength && length <= maxLength;

    return {
      length,
      percentage: Math.min(percentage, 100),
      isApproachingLimit,
      isAtLimit,
      isValid,
    };
  }, [value, maxLength, minLength]);

  const getCounterClassName = () => {
    let className = "char-count";
    if (stats.isAtLimit) {
      className += " char-count--danger";
    } else if (stats.isApproachingLimit) {
      className += " char-count--warning";
    }
    return className;
  };

  return (
    <div className="char-counter">
      <div className={getCounterClassName()}>
        {stats.length} / {maxLength} characters
      </div>
      <div className="char-progress">
        <div
          className="char-progress-bar"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>
    </div>
  );
};

export default CharacterCounter;
