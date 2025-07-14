// lib/canvas-generators.js - Sacred Visual Artifact Creation
// Creates tone-specific 1080x1080 artwork from reflection analysis

const { createCanvas, loadImage, registerFont } = require("canvas");

// Constants for consistent design
const CANVAS_SIZE = 1080;
const PADDING = 80;
const CONTENT_WIDTH = CANVAS_SIZE - PADDING * 2;
const CONTENT_HEIGHT = CANVAS_SIZE - PADDING * 2;

/**
 * Main artifact generation function
 * @param {Object} analysis - GPT-4o analysis result
 * @param {string[]} analysis.selectedSentences - 3 powerful sentences
 * @param {Object} analysis.colorPalette - Color scheme
 * @param {string} analysis.tone - fusion/gentle/intense
 * @param {string} analysis.layout - flowing/geometric/organic
 * @param {string} analysis.typography - bold/elegant/dynamic
 * @returns {Canvas} - 1080x1080 PNG-ready canvas
 */
async function generateArtifact(analysis) {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext("2d");

  // Route to tone-specific generator
  switch (analysis.tone) {
    case "fusion":
      return generateFusionArt(canvas, ctx, analysis);
    case "gentle":
      return generateGentleArt(canvas, ctx, analysis);
    case "intense":
      return generateIntenseArt(canvas, ctx, analysis);
    default:
      return generateFusionArt(canvas, ctx, analysis); // Default fallback
  }
}

/**
 * FUSION: Golden flowing consciousness
 * Organic shapes, warm gradients, flowing text
 */
function generateFusionArt(canvas, ctx, analysis) {
  const { colorPalette, selectedSentences } = analysis;

  // Create flowing golden background
  createFusionBackground(ctx, colorPalette);

  // Add organic flowing elements
  drawFusionFlows(ctx, colorPalette);

  // Render text in flowing pattern
  drawFlowingText(ctx, selectedSentences, colorPalette);

  // Add sacred branding
  drawBranding(ctx, "fusion");

  return canvas;
}

/**
 * GENTLE: Soft starlight clarity
 * Minimal design, soft glows, centered text
 */
function generateGentleArt(canvas, ctx, analysis) {
  const { colorPalette, selectedSentences } = analysis;

  // Create gentle starfield background
  createGentleBackground(ctx, colorPalette);

  // Add soft constellation elements
  drawGentleStars(ctx, colorPalette);

  // Render text with gentle spacing
  drawCenteredText(ctx, selectedSentences, colorPalette);

  // Add sacred branding
  drawBranding(ctx, "gentle");

  return canvas;
}

/**
 * INTENSE: Purple fire energy
 * Bold geometrics, dynamic layouts, powerful text
 */
function generateIntenseArt(canvas, ctx, analysis) {
  const { colorPalette, selectedSentences } = analysis;

  // Create intense geometric background
  createIntenseBackground(ctx, colorPalette);

  // Add dynamic geometric elements
  drawIntenseGeometry(ctx, colorPalette);

  // Render text with dynamic positioning
  drawDynamicText(ctx, selectedSentences, colorPalette);

  // Add sacred branding
  drawBranding(ctx, "intense");

  return canvas;
}

// ═════════ FUSION GENERATORS ═════════

function createFusionBackground(ctx, colors) {
  // Create radial gradient from center
  const gradient = ctx.createRadialGradient(
    CANVAS_SIZE / 2,
    CANVAS_SIZE / 2,
    0,
    CANVAS_SIZE / 2,
    CANVAS_SIZE / 2,
    CANVAS_SIZE / 2
  );

  gradient.addColorStop(0, colors.background || "#0F0F23");
  gradient.addColorStop(0.3, addAlpha(colors.primary || "#F59E0B", 0.1));
  gradient.addColorStop(0.7, addAlpha(colors.secondary || "#D97706", 0.05));
  gradient.addColorStop(1, colors.background || "#0F0F23");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function drawFusionFlows(ctx, colors) {
  ctx.save();

  // Create flowing organic shapes
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();

    // Random flowing path
    const startX = Math.random() * CANVAS_SIZE;
    const startY = Math.random() * CANVAS_SIZE;

    ctx.moveTo(startX, startY);

    // Create bezier curve flow
    const cp1x = startX + (Math.random() - 0.5) * 400;
    const cp1y = startY + (Math.random() - 0.5) * 400;
    const cp2x = startX + (Math.random() - 0.5) * 400;
    const cp2y = startY + (Math.random() - 0.5) * 400;
    const endX = startX + (Math.random() - 0.5) * 600;
    const endY = startY + (Math.random() - 0.5) * 600;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);

    // Style the flow
    ctx.strokeStyle = addAlpha(colors.accent || "#FBBF24", 0.2);
    ctx.lineWidth = Math.random() * 8 + 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  ctx.restore();
}

// ═════════ GENTLE GENERATORS ═════════

function createGentleBackground(ctx, colors) {
  // Simple gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_SIZE);
  gradient.addColorStop(0, colors.background || "#0F0F23");
  gradient.addColorStop(0.5, addAlpha(colors.primary || "#FFFFFF", 0.02));
  gradient.addColorStop(1, colors.background || "#0F0F23");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function drawGentleStars(ctx, colors) {
  ctx.save();

  // Create subtle starfield
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * CANVAS_SIZE;
    const y = Math.random() * CANVAS_SIZE;
    const size = Math.random() * 3 + 1;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = addAlpha(colors.accent || "#FFFFFF", 0.6);
    ctx.fill();

    // Add gentle glow
    ctx.beginPath();
    ctx.arc(x, y, size * 3, 0, Math.PI * 2);
    ctx.fillStyle = addAlpha(colors.accent || "#FFFFFF", 0.1);
    ctx.fill();
  }

  ctx.restore();
}

// ═════════ INTENSE GENERATORS ═════════

function createIntenseBackground(ctx, colors) {
  // Diagonal gradient with energy
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  gradient.addColorStop(0, colors.background || "#0F0F23");
  gradient.addColorStop(0.3, addAlpha(colors.primary || "#8B5CF6", 0.15));
  gradient.addColorStop(0.7, addAlpha(colors.secondary || "#A855F7", 0.1));
  gradient.addColorStop(1, colors.background || "#0F0F23");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function drawIntenseGeometry(ctx, colors) {
  ctx.save();

  // Create dynamic geometric shapes
  for (let i = 0; i < 8; i++) {
    const centerX = Math.random() * CANVAS_SIZE;
    const centerY = Math.random() * CANVAS_SIZE;
    const size = Math.random() * 100 + 30;
    const rotation = Math.random() * Math.PI * 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // Create polygon
    const sides = Math.floor(Math.random() * 4) + 3; // 3-6 sides
    ctx.beginPath();

    for (let j = 0; j < sides; j++) {
      const angle = (j / sides) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;

      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.strokeStyle = addAlpha(colors.accent || "#C084FC", 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

// ═════════ TEXT RENDERING ═════════

function drawFlowingText(ctx, sentences, colors) {
  ctx.save();

  const maxWidth = CONTENT_WIDTH - 100;
  let currentY = PADDING + 200;

  sentences.forEach((sentence, index) => {
    // Flowing curved path for each sentence
    const centerX = CANVAS_SIZE / 2;
    const offsetX = (index - 1) * 50; // Slight horizontal offset

    ctx.font = `${36 + index * 4}px Inter, sans-serif`;
    ctx.fillStyle = index === 1 ? colors.primary : colors.accent || "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Word wrap
    const words = sentence.split(" ");
    const lines = wrapText(ctx, words, maxWidth);

    lines.forEach((line, lineIndex) => {
      const y = currentY + lineIndex * 50;
      ctx.fillText(line, centerX + offsetX, y);
    });

    currentY += lines.length * 50 + 80;
  });

  ctx.restore();
}

function drawCenteredText(ctx, sentences, colors) {
  ctx.save();

  const maxWidth = CONTENT_WIDTH - 100;
  let currentY = CANVAS_SIZE / 2 - 100;

  sentences.forEach((sentence, index) => {
    ctx.font = `${32 + index * 6}px Inter, sans-serif`;
    ctx.fillStyle = colors.primary || "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Word wrap
    const words = sentence.split(" ");
    const lines = wrapText(ctx, words, maxWidth);

    lines.forEach((line, lineIndex) => {
      const y = currentY + lineIndex * 45;
      ctx.fillText(line, CANVAS_SIZE / 2, y);
    });

    currentY += lines.length * 45 + 60;
  });

  ctx.restore();
}

function drawDynamicText(ctx, sentences, colors) {
  ctx.save();

  const positions = [
    { x: CANVAS_SIZE * 0.2, y: CANVAS_SIZE * 0.3, align: "left" },
    { x: CANVAS_SIZE * 0.8, y: CANVAS_SIZE * 0.5, align: "right" },
    { x: CANVAS_SIZE * 0.5, y: CANVAS_SIZE * 0.8, align: "center" },
  ];

  sentences.forEach((sentence, index) => {
    const pos = positions[index] || positions[0];

    ctx.font = `bold ${38 + index * 2}px Inter, sans-serif`;
    ctx.fillStyle = index === 1 ? colors.primary : colors.accent || "#FFFFFF";
    ctx.textAlign = pos.align;
    ctx.textBaseline = "middle";

    // Word wrap with dynamic width
    const maxWidth = CONTENT_WIDTH / 2;
    const words = sentence.split(" ");
    const lines = wrapText(ctx, words, maxWidth);

    lines.forEach((line, lineIndex) => {
      const y = pos.y + lineIndex * 45;
      ctx.fillText(line, pos.x, y);
    });
  });

  ctx.restore();
}

// ═════════ BRANDING ═════════

function drawBranding(ctx, tone) {
  ctx.save();

  // Bottom branding
  ctx.font = "18px Inter, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const brandingY = CANVAS_SIZE - 30;
  ctx.fillText("mirror-of-truth.xyz", CANVAS_SIZE / 2, brandingY);

  // Small mirror icon
  ctx.font = "24px serif";
  ctx.fillText("🪞", CANVAS_SIZE / 2, brandingY - 25);

  ctx.restore();
}

// ═════════ UTILITIES ═════════

function wrapText(ctx, words, maxWidth) {
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function addAlpha(color, alpha) {
  // Simple hex to rgba conversion
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

module.exports = {
  generateArtifact,
};
