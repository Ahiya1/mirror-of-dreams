import React from "react";
import CharacterCounter from "./CharacterCounter";

const QuestionCard = ({
  questionNumber,
  title,
  subtitle,
  children,
  type = "textarea",
  value = "",
  onChange,
  maxLength = 1000,
  minLength = 1,
  placeholder = "",
  choices = [],
  onChoiceSelect,
  selectedChoice = "",
  showDateInput = false,
  dateValue = "",
  onDateChange,
}) => {
  const handleTextareaChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const handleChoiceClick = (choiceValue) => {
    onChoiceSelect(choiceValue);

    // Add haptic feedback for mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        marginBottom: "var(--space-2xl)",
        padding: "var(--space-xl) var(--space-lg)",
      }}
    >
      <div
        className="question-number"
        style={{
          fontSize: "var(--text-xs)",
          opacity: 0.45,
          marginBottom: "var(--space-lg)",
          textTransform: "uppercase",
          letterSpacing: "2.5px",
          color: "var(--cosmic-text-muted)",
          fontWeight: 600,
          position: "relative",
        }}
      >
        Question {questionNumber}
        <div
          style={{
            content: '""',
            position: "absolute",
            left: 0,
            bottom: "-4px",
            width: "30px",
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(255, 255, 255, 0.3), transparent)",
          }}
        />
      </div>

      <h3
        className="question-title"
        style={{
          fontSize: "var(--text-xl)",
          marginBottom: "var(--space-sm)",
          lineHeight: 1.3,
          color: "var(--cosmic-text)",
          fontWeight: 300,
          letterSpacing: "0.3px",
          textShadow: "0 2px 15px rgba(255, 255, 255, 0.05)",
        }}
      >
        {title}
      </h3>

      {subtitle && (
        <p
          className="question-subtitle"
          style={{
            fontSize: "var(--text-base)",
            opacity: 0.6,
            marginBottom: "var(--space-xl)",
            fontStyle: "italic",
            color: "var(--cosmic-text-muted)",
            lineHeight: 1.4,
            fontWeight: 300,
            letterSpacing: "0.2px",
          }}
        >
          {subtitle}
        </p>
      )}

      {type === "textarea" && (
        <div className="input-group">
          <textarea
            className="cosmic-textarea"
            value={value}
            onChange={handleTextareaChange}
            placeholder={placeholder}
            required={minLength > 0}
            style={{
              borderColor:
                value.length === 0 && minLength > 0
                  ? "rgba(239, 68, 68, 0.4)"
                  : undefined,
            }}
          />
          <CharacterCounter
            value={value}
            maxLength={maxLength}
            minLength={minLength}
          />
        </div>
      )}

      {type === "choice" && (
        <>
          <div
            className="choice-buttons"
            style={{
              display: "flex",
              gap: "var(--space-md)",
              marginTop: "var(--space-lg)",
              flexWrap: "wrap",
            }}
          >
            {choices.map((choice) => (
              <button
                key={choice.value}
                type="button"
                className={`cosmic-button ${
                  selectedChoice === choice.value
                    ? "cosmic-button--primary"
                    : ""
                }`}
                onClick={() => handleChoiceClick(choice.value)}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  transform:
                    selectedChoice === choice.value ? "scale(1.05)" : undefined,
                  boxShadow:
                    selectedChoice === choice.value
                      ? "0 0 20px rgba(255, 255, 255, 0.12)"
                      : undefined,
                }}
                aria-pressed={selectedChoice === choice.value}
              >
                {choice.label}
              </button>
            ))}
          </div>

          {showDateInput && (
            <div
              className={`date-container ${showDateInput ? "is-visible" : ""}`}
              style={{
                opacity: showDateInput ? 1 : 0,
                visibility: showDateInput ? "visible" : "hidden",
                height: showDateInput ? "auto" : 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-md)",
                marginTop: "var(--space-xl)",
                padding: showDateInput ? "var(--space-md)" : 0,
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                transition: "var(--transition-smooth)",
                flexWrap: "wrap",
                position: "relative",
                zIndex: 10,
                transform: showDateInput ? "translateY(0)" : "translateY(15px)",
              }}
            >
              <label
                className="date-label"
                style={{
                  color: "var(--cosmic-text-secondary)",
                  fontWeight: 500,
                  fontSize: "var(--text-base)",
                  minWidth: "fit-content",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                What is the date?
              </label>
              <input
                type="date"
                className="cosmic-button"
                value={dateValue}
                onChange={(e) => onDateChange(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: "180px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "var(--cosmic-text)",
                  fontFamily: "inherit",
                  fontSize: "var(--text-base)",
                  position: "relative",
                  zIndex: 20,
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
                required={showDateInput}
              />
            </div>
          )}
        </>
      )}

      {children}
    </div>
  );
};

export default QuestionCard;
