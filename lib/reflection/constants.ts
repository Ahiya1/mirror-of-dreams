// lib/reflection/constants.ts - Shared constants for reflection feature
import type { ReflectionQuestion } from './types';

import { QUESTION_LIMITS } from '@/lib/utils/constants';

// LocalStorage persistence
export const STORAGE_KEY = 'MIRROR_REFLECTION_DRAFT';
export const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Category emoji mapping for dreams
export const CATEGORY_EMOJI: Record<string, string> = {
  health: '\uD83C\uDFC3',
  career: '\uD83D\uDCBC',
  relationships: '\u2764\uFE0F',
  financial: '\uD83D\uDCB0',
  personal_growth: '\uD83C\uDF31',
  creative: '\uD83C\uDFA8',
  spiritual: '\uD83D\uDE4F',
  entrepreneurial: '\uD83D\uDE80',
  educational: '\uD83D\uDCDA',
  other: '\u2B50',
};

// Guiding text for each question - sets contemplative tone
const QUESTION_GUIDES = {
  dream: 'Take a moment to describe your dream in vivid detail...',
  plan: 'What concrete steps will you take on this journey?',
  relationship: 'How does this dream connect to who you are becoming?',
  offering: 'What are you willing to give, sacrifice, or commit?',
};

// Warm placeholder text - creates sacred, welcoming space
const WARM_PLACEHOLDERS = {
  dream: "Your thoughts are safe here... what's present for you right now?",
  plan: 'What step feels right to take next?',
  relationship: "How does this dream connect to who you're becoming?",
  offering: 'What gift is this dream offering you?',
};

/**
 * Questions array for reflection form
 */
export const QUESTIONS: ReflectionQuestion[] = [
  {
    id: 'dream',
    number: 1,
    text: 'What is your dream?',
    guide: QUESTION_GUIDES.dream,
    placeholder: WARM_PLACEHOLDERS.dream,
    limit: QUESTION_LIMITS.dream,
  },
  {
    id: 'plan',
    number: 2,
    text: 'What is your plan to bring it to life?',
    guide: QUESTION_GUIDES.plan,
    placeholder: WARM_PLACEHOLDERS.plan,
    limit: QUESTION_LIMITS.plan,
  },
  {
    id: 'relationship',
    number: 3,
    text: 'What is your relationship with this dream?',
    guide: QUESTION_GUIDES.relationship,
    placeholder: WARM_PLACEHOLDERS.relationship,
    limit: QUESTION_LIMITS.relationship,
  },
  {
    id: 'offering',
    number: 4,
    text: 'What are you willing to offer in service of this dream?',
    guide: QUESTION_GUIDES.offering,
    placeholder: WARM_PLACEHOLDERS.offering,
    limit: QUESTION_LIMITS.sacrifice,
  },
];

// Status messages for gazing overlay
export const GAZING_STATUS_MESSAGES = [
  'Gazing into the mirror...',
  'Reflecting on your journey...',
  'Crafting your insight...',
  'Weaving wisdom...',
];

// Empty form data constant
export const EMPTY_FORM_DATA = {
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
} as const;
