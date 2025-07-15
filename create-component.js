#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("⚛️  Creating React components...");

// Ensure directories exist
const dirs = ["src/components/shared", "src/components/mirror"];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// CosmicBackground component
const cosmicBackground = `import React from 'react';

const CosmicBackground = () => {
  return (
    <div className="cosmic-background">
      <div className="cosmic-gradient" />
      <div className="starfield" />
    </div>
  );
};

export default CosmicBackground;`;

// ToneElements component
const toneElements = `import React, { useEffect, useState } from 'react';

const ToneElements = ({ tone }) => {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const createElements = () => {
      const newElements = [];

      if (tone === 'fusion') {
        for (let i = 0; i < 6; i++) {
          newElements.push({
            id: \`fusion-\${i}\`,
            type: 'fusion-breath',
            style: {
              width: \`\${200 + Math.random() * 140}px\`,
              height: \`\${200 + Math.random() * 140}px\`,
              left: \`\${Math.random() * 100}%\`,
              top: \`\${Math.random() * 100}%\`,
              animationDelay: \`\${i * 4.2}s\`,
              animationDuration: \`\${20 + Math.random() * 10}s\`,
            },
          });
        }
      } else if (tone === 'gentle') {
        for (let i = 0; i < 35; i++) {
          newElements.push({
            id: \`gentle-\${i}\`,
            type: 'gentle-star',
            style: {
              left: \`\${Math.random() * 100}%\`,
              top: \`\${Math.random() * 100}%\`,
              animationDelay: \`\${Math.random() * 10}s\`,
              animationDuration: \`\${8 + Math.random() * 6}s\`,
            },
          });
        }
      } else if (tone === 'intense') {
        for (let i = 0; i < 7; i++) {
          newElements.push({
            id: \`intense-\${i}\`,
            type: 'intense-swirl',
            style: {
              left: \`\${Math.random() * 100}%\`,
              top: \`\${Math.random() * 100}%\`,
              animationDelay: \`\${i * 3.5}s\`,
              animationDuration: \`\${15 + Math.random() * 10}s\`,
            },
          });
        }
      }

      setElements(newElements);
    };

    createElements();
  }, [tone]);

  return (
    <div className="tone-elements">
      {elements.map((element) => (
        <div
          key={element.id}
          className={element.type}
          style={element.style}
        />
      ))}
    </div>
  );
};

export default ToneElements;`;

// CharacterCounter component
const characterCounter = `import React, { useMemo } from 'react';

const CharacterCounter = ({ value = '', maxLength = 1000, minLength = 0 }) => {
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
    let className = 'char-count';
    if (stats.isAtLimit) {
      className += ' char-count--danger';
    } else if (stats.isApproachingLimit) {
      className += ' char-count--warning';
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
          style={{ width: \`\${stats.percentage}%\` }}
        />
      </div>
    </div>
  );
};

export default CharacterCounter;`;

// ToneSelector component
const toneSelector = `import React from 'react';

const ToneSelector = ({ selectedTone, onToneChange }) => {
  const tones = [
    {
      id: 'fusion',
      label: 'Let the Mirror Breathe',
      description: 'Sacred Fusion - where all voices become one'
    },
    {
      id: 'gentle',
      label: 'Gentle Clarity',
      description: 'Soft wisdom that illuminates gently'
    },
    {
      id: 'intense',
      label: 'Luminous Fire',
      description: 'Piercing truth that burns away illusions'
    }
  ];

  const getToneButtonClassName = (toneId) => {
    let className = 'cosmic-button';
    if (selectedTone === toneId) {
      className += \` cosmic-button--\${toneId}\`;
    }
    return className;
  };

  const handleToneSelect = (toneId) => {
    onToneChange(toneId);
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div style={{ marginBottom: 'var(--space-2xl)' }}>
      <div 
        style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--cosmic-text-secondary)',
          marginBottom: 'var(--space-xl)',
          fontWeight: 300,
          letterSpacing: '0.8px',
          position: 'relative',
          textAlign: 'center'
        }}
      >
        Choose the voice of your reflection
        <div
          style={{
            content: '""',
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
          }}
        />
      </div>
      
      <div 
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
          justifyContent: 'center',
          flexWrap: 'wrap'
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
              minWidth: '140px',
              maxWidth: '220px',
              position: 'relative'
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

export default ToneSelector;`;

// QuestionCard component
const questionCard = `import React from 'react';
import CharacterCounter from '../shared/CharacterCounter';

const QuestionCard = ({ 
  questionNumber,
  title,
  subtitle,
  children,
  type = 'textarea',
  value = '',
  onChange,
  maxLength = 1000,
  minLength = 1,
  placeholder = '',
  choices = [],
  onChoiceSelect,
  selectedChoice = '',
  showDateInput = false,
  dateValue = '',
  onDateChange
}) => {
  const handleTextareaChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const handleChoiceClick = (choiceValue) => {
    onChoiceSelect(choiceValue);
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <div 
      className="glass-card"
      style={{
        marginBottom: 'var(--space-2xl)',
        padding: 'var(--space-xl) var(--space-lg)',
      }}
    >
      <div 
        style={{
          fontSize: 'var(--text-xs)',
          opacity: 0.45,
          marginBottom: 'var(--space-lg)',
          textTransform: 'uppercase',
          letterSpacing: '2.5px',
          color: 'var(--cosmic-text-muted)',
          fontWeight: 600,
          position: 'relative'
        }}
      >
        Question {questionNumber}
        <div
          style={{
            content: '""',
            position: 'absolute',
            left: 0,
            bottom: '-4px',
            width: '30px',
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3), transparent)'
          }}
        />
      </div>

      <h3 
        style={{
          fontSize: 'var(--text-xl)',
          marginBottom: 'var(--space-sm)',
          lineHeight: 1.3,
          color: 'var(--cosmic-text)',
          fontWeight: 300,
          letterSpacing: '0.3px',
          textShadow: '0 2px 15px rgba(255, 255, 255, 0.05)'
        }}
      >
        {title}
      </h3>

      {subtitle && (
        <p 
          style={{
            fontSize: 'var(--text-base)',
            opacity: 0.6,
            marginBottom: 'var(--space-xl)',
            fontStyle: 'italic',
            color: 'var(--cosmic-text-muted)',
            lineHeight: 1.4,
            fontWeight: 300,
            letterSpacing: '0.2px'
          }}
        >
          {subtitle}
        </p>
      )}

      {type === 'textarea' && (
        <div>
          <textarea
            className="cosmic-textarea"
            value={value}
            onChange={handleTextareaChange}
            placeholder={placeholder}
            required={minLength > 0}
            style={{
              borderColor: value.length === 0 && minLength > 0 
                ? 'rgba(239, 68, 68, 0.4)' 
                : undefined
            }}
          />
          <CharacterCounter 
            value={value}
            maxLength={maxLength}
            minLength={minLength}
          />
        </div>
      )}

      {type === 'choice' && (
        <>
          <div 
            style={{
              display: 'flex',
              gap: 'var(--space-md)',
              marginTop: 'var(--space-lg)',
              flexWrap: 'wrap'
            }}
          >
            {choices.map((choice) => (
              <button
                key={choice.value}
                type="button"
                className={\`cosmic-button \${selectedChoice === choice.value ? 'cosmic-button--primary' : ''}\`}
                onClick={() => handleChoiceClick(choice.value)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  transform: selectedChoice === choice.value ? 'scale(1.05)' : undefined,
                  boxShadow: selectedChoice === choice.value 
                    ? '0 0 20px rgba(255, 255, 255, 0.12)' 
                    : undefined
                }}
                aria-pressed={selectedChoice === choice.value}
              >
                {choice.label}
              </button>
            ))}
          </div>

          {showDateInput && (
            <div 
              style={{
                opacity: showDateInput ? 1 : 0,
                visibility: showDateInput ? 'visible' : 'hidden',
                height: showDateInput ? 'auto' : 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                marginTop: 'var(--space-xl)',
                padding: showDateInput ? 'var(--space-md)' : 0,
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'var(--transition-smooth)',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 10,
                transform: showDateInput ? 'translateY(0)' : 'translateY(15px)'
              }}
            >
              <label 
                style={{
                  color: 'var(--cosmic-text-secondary)',
                  fontWeight: 500,
                  fontSize: 'var(--text-base)',
                  minWidth: 'fit-content',
                  pointerEvents: 'none',
                  userSelect: 'none'
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
                  minWidth: '180px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: 'var(--cosmic-text)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--text-base)',
                  position: 'relative',
                  zIndex: 20,
                  pointerEvents: 'auto',
                  cursor: 'pointer'
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

export default QuestionCard;`;

// MirrorApp component (main router)
const mirrorApp = `import React, { useState, useEffect } from 'react';
import Questionnaire from './Questionnaire';
import Output from './Output';

const MirrorApp = () => {
  const [currentPage, setCurrentPage] = useState('questionnaire');
  
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    if (path.includes('/output') || searchParams.get('id')) {
      setCurrentPage('output');
    } else {
      setCurrentPage('questionnaire');
    }
  }, []);

  return (
    <div id="mirror-app">
      {currentPage === 'questionnaire' && <Questionnaire />}
      {currentPage === 'output' && <Output />}
    </div>
  );
};

export default MirrorApp;`;

// Write all component files
const components = [
  ["src/components/shared/CosmicBackground.jsx", cosmicBackground],
  ["src/components/shared/ToneElements.jsx", toneElements],
  ["src/components/shared/CharacterCounter.jsx", characterCounter],
  ["src/components/shared/ToneSelector.jsx", toneSelector],
  ["src/components/shared/QuestionCard.jsx", questionCard],
  ["src/components/mirror/MirrorApp.jsx", mirrorApp],
];

components.forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created: ${filePath}`);
});

console.log("⚛️  Component files created!");
console.log("");
console.log("📋 Still need to create:");
console.log("- src/components/mirror/Questionnaire.jsx");
console.log("- src/components/mirror/Output.jsx");
console.log("");
console.log("These are complex components - create them separately.");

module.exports = components;
