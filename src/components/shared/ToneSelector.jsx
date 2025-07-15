import React from "react";

const ToneSelector = ({ selectedTone, onToneChange }) => {
  const tones = [
    {
      id: "fusion",
      label: "Let the Mirror Breathe",
      description: "Sacred Fusion - where all voices become one",
    },
    {
      id: "gentle",
      label: "Gentle Clarity",
      description: "Soft wisdom that illuminates gently",
    },
    {
      id: "intense",
      label: "Luminous Fire",
      description: "Piercing truth that burns away illusions",
    },
  ];

  const getToneButtonClassName = (toneId) => {
    let className = "cosmic-button";
    if (selectedTone === toneId) {
      className += ` cosmic-button--${toneId}`;
    }
    return className;
  };

  const handleToneSelect = (toneId) => {
    onToneChange(toneId);

    // Add haptic feedback for mobile devices
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="tone-selector" style={{ marginBottom: "var(--space-2xl)" }}>
      <div
        className="tone-label"
        style={{
          fontSize: "var(--text-lg)",
          color: "var(--cosmic-text-secondary)",
          marginBottom: "var(--space-xl)",
          fontWeight: 300,
          letterSpacing: "0.8px",
          position: "relative",
          textAlign: "center",
        }}
      >
        Choose the voice of your reflection
        <div
          style={{
            content: '""',
            position: "absolute",
            bottom: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60px",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
          }}
        />
      </div>

      <div
        className="tone-buttons"
        style={{
          display: "flex",
          gap: "var(--space-md)",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {tones.map((tone) => (
          <button
            key={tone.id}
            type="button"
            className={getToneButtonClassName(tone.id)}
            onClick={() => handleToneSelect(tone.id)}
            style={{
              flex: 1,
              minWidth: "140px",
              maxWidth: "220px",
              position: "relative",
            }}
            aria-pressed={selectedTone === tone.id}
            title={tone.description}
          >
            {tone.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ToneSelector;
