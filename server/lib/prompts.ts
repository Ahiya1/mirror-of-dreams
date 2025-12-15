// server/lib/prompts.ts - Prompt loading system for AI generation

import fs from 'fs';
import path from 'path';

const PROMPT_DIR = path.join(process.cwd(), 'prompts');

// Load a single prompt file
function loadPromptFile(filename: string): string {
  try {
    const filepath = path.join(PROMPT_DIR, filename);
    return fs.readFileSync(filepath, 'utf8');
  } catch (error) {
    console.error(`Failed to load prompt file: ${filename}`, error);
    return '';
  }
}

// Premium enhancement for reflections
const PREMIUM_REFLECTION_ENHANCEMENT = `

PREMIUM REFLECTION ENHANCEMENT:
You have extended thinking capabilities to go deeper - but deeper means more honest, more specific, not more flattering.

Premium Depth Guidelines:

**Look Deeper:**
- Notice patterns across all four answers - what themes keep appearing?
- Spot contradictions or tensions between what they say in different answers
- Pay attention to what they mention multiple times vs. what they avoid
- Look for the gap between the dream they describe and the plan they've made

**Be More Specific:**
- Reference exact phrases they used
- Point to specific patterns with evidence
- Name the tension precisely, not vaguely

**Ask Harder Questions:**
- What would you ask if you weren't worried about making them uncomfortable?
- What's the question they seem to be avoiding?
- What would a trusted friend who knows them well ask?

**Premium Does NOT Mean:**
- More flowery or mystical language
- More compliments
- More spiritual-sounding phrases
- Longer responses

Premium means: you've thought harder about what you're seeing and you're sharing more of that honest observation. The extra depth goes into honesty and specificity, not into validation.

Keep responses to 300-500 words. More specific is better than longer.`;

// Premium enhancement for evolution reports
const PREMIUM_EVOLUTION_ENHANCEMENT = `

PREMIUM EVOLUTION ANALYSIS:
You have extended thinking capabilities to provide deeper consciousness evolution recognition.

Focus on:
- Deeper pattern recognition across time
- More nuanced language evolution tracking
- Subtle identity shifts and consciousness development
- Integration of previous resistances and growth
- Archetypal and mythological dimensions of their journey
- Sophisticated recognition of consciousness development stages

Write with greater depth and sophistication while maintaining the same essential recognition approach.
Provide rich, multi-layered insights that honor the complexity of consciousness evolution.
`;

/**
 * Load and assemble system prompt for reflection generation
 */
export async function loadPrompts(
  tone: 'gentle' | 'intense' | 'fusion' = 'fusion',
  isPremium: boolean = false,
  isCreator: boolean = false
): Promise<string> {
  const parts: string[] = [];

  // Base instructions
  const base = loadPromptFile('base_instructions.txt');
  if (base) parts.push(base.trim());

  // Tone-specific instructions
  const toneFiles: Record<string, string> = {
    gentle: 'gentle_clarity.txt',
    intense: 'luminous_intensity.txt',
    fusion: 'sacred_fusion.txt',
  };

  const tonePrompt = loadPromptFile(toneFiles[tone] || toneFiles.fusion);
  if (tonePrompt) parts.push(tonePrompt.trim());

  // Creator context
  if (isCreator) {
    const creator = loadPromptFile('creator_context.txt');
    if (creator) parts.push(creator.trim());
  }

  // Premium enhancement
  if (isPremium) {
    parts.push(PREMIUM_REFLECTION_ENHANCEMENT.trim());
  }

  return parts.join('\n\n');
}

/**
 * Load evolution report prompt
 */
export async function loadEvolutionPrompt(isPremium: boolean = false): Promise<string> {
  const parts: string[] = [];

  // Base instructions
  const base = loadPromptFile('base_instructions.txt');
  if (base) parts.push(base.trim());

  // Evolution-specific instructions
  const evolution = loadPromptFile('evolution_instructions.txt');
  if (evolution) parts.push(evolution.trim());

  // Premium enhancement
  if (isPremium) {
    parts.push(PREMIUM_EVOLUTION_ENHANCEMENT.trim());
  }

  return parts.join('\n\n');
}

/**
 * Build user prompt for reflection from questionnaire data
 */
export function buildReflectionUserPrompt(data: {
  dream: string;
  plan: string;
  hasDate: string;
  dreamDate: string | null;
  relationship: string;
  offering: string;
}): string {
  const { dream, plan, hasDate, dreamDate, relationship, offering } = data;

  const dateContext = hasDate === 'yes' && dreamDate ? `\nDream Date: ${dreamDate}` : '';

  return `
SACRED REFLECTION REQUEST

What is your dream?
${dream}

What is your plan to manifest this dream?
${plan}${dateContext}

What is your relationship with this dream?
${relationship}

What are you willing to give in service of this dream?
${offering}

Please reflect back the truth of what I've shared, help me see what I may not yet see in my own words, and recognize the sovereignty that already exists in my choosing of this dream.
  `.trim();
}
