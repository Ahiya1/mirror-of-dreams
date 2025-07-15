#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🪞 Setting up React for Mirror of Truth...");

// Create directories
const directories = [
  "src",
  "src/components",
  "src/components/mirror",
  "src/components/shared",
  "src/styles",
];

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Create main React entry point
const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mirror of Truth - React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

const mirrorQuestionnaireHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sacred Questions | Mirror of Truth</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/questionnaire.jsx"></script>
  </body>
</html>`;

const mirrorOutputHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Reflection | Mirror of Truth</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/output.jsx"></script>
  </body>
</html>`;

// Write HTML files
fs.writeFileSync("index.html", indexHtml);
fs.writeFileSync("mirror-questionnaire.html", mirrorQuestionnaireHtml);
fs.writeFileSync("mirror-output.html", mirrorOutputHtml);
console.log("📄 Created HTML entry points");

// Create main.jsx
const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import MirrorApp from './components/mirror/MirrorApp';
import './styles/mirror.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MirrorApp />
  </React.StrictMode>
);`;

// Create questionnaire.jsx
const questionnaireJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import Questionnaire from './components/mirror/Questionnaire';
import './styles/mirror.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Questionnaire />
  </React.StrictMode>
);`;

// Create output.jsx
const outputJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import Output from './components/mirror/Output';
import './styles/mirror.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Output />
  </React.StrictMode>
);`;

fs.writeFileSync("src/main.jsx", mainJsx);
fs.writeFileSync("src/questionnaire.jsx", questionnaireJsx);
fs.writeFileSync("src/output.jsx", outputJsx);
console.log("⚛️  Created React entry points");

// Create mirror.css with all the enhanced styles
const mirrorCss = `/* Enhanced Mirror Styles */
:root {
  --cosmic-bg: #020617;
  --cosmic-text: #ffffff;
  --cosmic-text-secondary: rgba(255, 255, 255, 0.8);
  --cosmic-text-muted: rgba(255, 255, 255, 0.6);
  
  --glass-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-hover-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
  --glass-hover-border: rgba(255, 255, 255, 0.2);
  
  --fusion-primary: rgba(251, 191, 36, 0.95);
  --fusion-bg: rgba(251, 191, 36, 0.08);
  --fusion-border: rgba(251, 191, 36, 0.3);
  
  --gentle-primary: rgba(255, 255, 255, 0.95);
  --gentle-bg: rgba(255, 255, 255, 0.1);
  --gentle-border: rgba(255, 255, 255, 0.3);
  
  --intense-primary: rgba(147, 51, 234, 0.95);
  --intense-bg: rgba(147, 51, 234, 0.08);
  --intense-border: rgba(147, 51, 234, 0.4);
  
  --transition-fast: all 0.3s ease;
  --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  --space-xs: clamp(0.5rem, 1vw, 0.75rem);
  --space-sm: clamp(0.75rem, 1.5vw, 1rem);
  --space-md: clamp(1rem, 2.5vw, 1.5rem);
  --space-lg: clamp(1.5rem, 3vw, 2rem);
  --space-xl: clamp(2rem, 4vw, 3rem);
  --space-2xl: clamp(3rem, 6vw, 4rem);
  
  --text-xs: clamp(0.7rem, 1.8vw, 0.85rem);
  --text-sm: clamp(0.9rem, 2.2vw, 1rem);
  --text-base: clamp(1rem, 2.5vw, 1.2rem);
  --text-lg: clamp(1.1rem, 3vw, 1.4rem);
  --text-xl: clamp(1.3rem, 4vw, 1.6rem);
  --text-2xl: clamp(1.6rem, 4vw, 2rem);
  --text-3xl: clamp(1.8rem, 5vw, 2.5rem);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}

body {
  background: var(--cosmic-bg);
  color: var(--cosmic-text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
  overflow-x: hidden;
  min-height: 100vh;
  position: relative;
  touch-action: manipulation;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cosmic-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.cosmic-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle at 20% 30%,
      rgba(59, 130, 246, 0.05) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 70%,
      rgba(147, 51, 234, 0.04) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 50% 50%,
      rgba(251, 191, 36, 0.03) 0%,
      transparent 70%
    );
  animation: cosmicShift 80s ease-in-out infinite;
}

.starfield {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle at 20% 30%,
      rgba(255, 255, 255, 0.3) 0 1px,
      transparent 2px
    ),
    radial-gradient(
      circle at 60% 70%,
      rgba(255, 255, 255, 0.25) 0 1px,
      transparent 2px
    ),
    radial-gradient(
      circle at 80% 20%,
      rgba(255, 255, 255, 0.28) 0 1px,
      transparent 2px
    ),
    radial-gradient(
      circle at 40% 90%,
      rgba(255, 255, 255, 0.22) 0 1px,
      transparent 2px
    );
  background-size: 1200px 900px, 1600px 1100px, 900px 1300px, 1400px 1000px;
  opacity: 0.08;
  animation: starfieldDrift 180s linear infinite;
}

@keyframes cosmicShift {
  0%, 100% { transform: scale(1) rotate(0deg); }
  33% { transform: scale(1.05) rotate(120deg); }
  66% { transform: scale(0.98) rotate(240deg); }
}

@keyframes starfieldDrift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-60px, -60px); }
}

.tone-elements {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.fusion-breath {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(251, 191, 36, 0.3) 0%,
    rgba(245, 158, 11, 0.15) 30%,
    rgba(217, 119, 6, 0.08) 60%,
    transparent 80%
  );
  filter: blur(35px);
  animation: fusionBreathe 25s ease-in-out infinite;
}

@keyframes fusionBreathe {
  0%, 100% {
    opacity: 0;
    transform: scale(0.4) translate(0, 0);
  }
  25% {
    opacity: 0.6;
    transform: scale(1.1) translate(30px, -40px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.4) translate(-15px, 25px);
  }
  75% {
    opacity: 0.5;
    transform: scale(0.9) translate(40px, 15px);
  }
}

.gentle-star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.7), 0 0 15px rgba(255, 255, 255, 0.4);
  animation: gentleTwinkle 10s ease-in-out infinite;
}

@keyframes gentleTwinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.4);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

.intense-swirl {
  position: absolute;
  width: clamp(180px, 35vw, 240px);
  height: clamp(180px, 35vw, 240px);
  background: radial-gradient(
    circle at 30% 30%,
    rgba(147, 51, 234, 0.35) 0%,
    rgba(168, 85, 247, 0.18) 30%,
    rgba(139, 92, 246, 0.1) 60%,
    transparent 80%
  );
  filter: blur(30px);
  border-radius: 50%;
  animation: intenseSwirl 18s ease-in-out infinite;
}

@keyframes intenseSwirl {
  0%, 100% {
    opacity: 0;
    transform: rotate(0deg) scale(0.2);
  }
  25% {
    opacity: 0.7;
    transform: rotate(180deg) scale(1.1);
  }
  50% {
    opacity: 0.9;
    transform: rotate(360deg) scale(1.4);
  }
  75% {
    opacity: 0.6;
    transform: rotate(540deg) scale(0.8);
  }
}

.mirror-container {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.mirror-content {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.back-link {
  position: fixed;
  top: var(--space-lg);
  left: var(--space-lg);
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 50px;
  color: var(--cosmic-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 400;
  transition: var(--transition-fast);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.back-link:hover {
  background: var(--glass-hover-bg);
  border-color: var(--glass-hover-border);
  color: var(--cosmic-text);
  transform: translateY(-1px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(45px) saturate(130%);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  transition: var(--transition-slow);
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 25% 50%,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.6s ease;
}

.glass-card:hover::before {
  opacity: 1;
}

.glass-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-4px);
  box-shadow: 0 15px 50px rgba(255, 255, 255, 0.08);
}

.cosmic-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(25px);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  color: var(--cosmic-text-secondary);
  font-size: var(--text-base);
  font-weight: 500;
  letter-spacing: 0.4px;
  cursor: pointer;
  transition: var(--transition-smooth);
  overflow: hidden;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  min-height: 52px;
  text-decoration: none;
  border: none;
  font-family: inherit;
}

.cosmic-button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.cosmic-button:hover::before {
  transform: translateX(100%);
}

.cosmic-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--glass-hover-border);
  color: var(--cosmic-text);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
}

.cosmic-button:active {
  transform: translateY(-1px) scale(0.98);
}

.cosmic-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cosmic-button--primary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  border-color: var(--glass-hover-border);
  color: var(--cosmic-text);
}

.cosmic-button--fusion {
  background: var(--fusion-bg);
  border-color: var(--fusion-border);
  color: var(--fusion-primary);
}

.cosmic-button--fusion:hover {
  background: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.5);
  box-shadow: 0 15px 40px rgba(251, 191, 36, 0.25);
}

.cosmic-button--gentle {
  background: var(--gentle-bg);
  border-color: var(--gentle-border);
  color: var(--gentle-primary);
}

.cosmic-button--gentle:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 15px 40px rgba(255, 255, 255, 0.25);
}

.cosmic-button--intense {
  background: var(--intense-bg);
  border-color: var(--intense-border);
  color: var(--intense-primary);
}

.cosmic-button--intense:hover {
  background: rgba(147, 51, 234, 0.15);
  border-color: rgba(147, 51, 234, 0.6);
  box-shadow: 0 15px 40px rgba(147, 51, 234, 0.25);
}

.cosmic-textarea {
  width: 100%;
  padding: var(--space-md);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.025));
  backdrop-filter: blur(25px) saturate(120%);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  color: var(--cosmic-text);
  font-size: var(--text-base);
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  min-height: clamp(140px, 25vw, 180px);
  transition: var(--transition-smooth);
  -webkit-appearance: none;
  appearance: none;
}

.cosmic-textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.cosmic-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  font-weight: 300;
}

.char-counter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-sm);
  padding: 0 var(--space-xs);
}

.char-count {
  font-size: var(--text-xs);
  color: var(--cosmic-text-muted);
  font-weight: 400;
  transition: var(--transition-fast);
}

.char-count--warning {
  color: rgba(251, 191, 36, 0.8);
  font-weight: 500;
}

.char-count--danger {
  color: rgba(239, 68, 68, 0.9);
  font-weight: 600;
  animation: charPulse 2s ease-in-out infinite;
}

@keyframes charPulse {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}

.char-progress {
  width: 60px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.char-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.8) 0%, rgba(251, 191, 36, 0.8) 70%, rgba(239, 68, 68, 0.9) 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
  width: 0%;
}

.loading-circle {
  width: clamp(140px, 30vw, 180px);
  height: clamp(140px, 30vw, 180px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 40%,
    rgba(255, 255, 255, 0.02) 70%,
    transparent 85%
  );
  animation: breatheLoading 4.5s ease-in-out infinite;
  position: relative;
  box-shadow: 0 0 60px rgba(255, 255, 255, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.05);
}

.loading-circle::after {
  content: "";
  position: absolute;
  inset: 25px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.03) 50%,
    transparent 75%
  );
  animation: breatheInner 4.5s ease-in-out infinite;
}

@keyframes breatheLoading {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
}

@keyframes breatheInner {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3) rotate(180deg);
    opacity: 0.9;
  }
}

/* Mirror Response Styles */
.mirror-response {
  background: rgba(255, 255, 255, 0.97);
  color: #1a1a2e;
  padding: var(--space-2xl) var(--space-xl);
  border-radius: 24px;
  box-shadow: 0 15px 60px rgba(0, 0, 0, 0.25);
  position: relative;
  font-size: var(--text-base);
  line-height: 1.7;
  font-weight: 300;
}

.mirror-response h1,
.mirror-response h2,
.mirror-response h3 {
  font-weight: 600;
  margin: 2rem 0 1rem 0;
  line-height: 1.3;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mirror-response h1 {
  font-size: var(--text-2xl);
  margin-top: 0;
  text-align: center;
  margin-bottom: 2rem;
}

.mirror-response h2 {
  font-size: var(--text-xl);
  margin-top: 2.5rem;
  padding-left: 1rem;
  border-left: 3px solid rgba(102, 126, 234, 0.3);
}

.mirror-response p {
  margin: 0 0 1.5rem 0;
  text-align: justify;
  hyphens: auto;
}

.mirror-response strong {
  font-weight: 600;
  color: #16213e;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mirror-response em {
  font-style: italic;
  color: #4a5568;
}

@media (max-width: 768px) {
  .mirror-container {
    padding: var(--space-md);
  }
  
  .cosmic-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .glass-card {
    border-radius: 18px;
    padding: var(--space-md);
  }
  
  .cosmic-textarea {
    padding: var(--space-md);
    min-height: clamp(120px, 22vw, 150px);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.cosmic-button:focus-visible,
.cosmic-textarea:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
}

/* Enhanced mobile touch targets */
@media (hover: none) and (pointer: coarse) {
  .cosmic-button {
    min-height: 48px;
    padding: var(--space-md) var(--space-lg);
  }
  
  .cosmic-button:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}
\`;

fs.writeFileSync('src/styles/mirror.css', mirrorCss);
console.log('🎨 Created mirror.css with enhanced styles');

console.log('✨ React setup complete!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Run: npm install');
console.log('2. Copy the React components to src/components/');
console.log('3. Run: npm run dev (static + proxy)');
console.log('4. Run: npm run dev:react (React dev server)');
console.log('5. Run: npm run build (build React for production)');
console.log('');
console.log('🌐 URLs:');
console.log('- http://localhost:3001 (main server with proxy)');
console.log('- http://localhost:3002 (React dev server)');
console.log('');

module.exports = { directories };`;
