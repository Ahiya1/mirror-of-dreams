// lib/utils/constants.ts - Application constants

export const TIER_LIMITS = {
  free: 10,
  essential: 50,
  premium: Infinity,
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export const TONES = [
  {
    id: 'fusion' as const,
    label: 'Sacred Fusion',
    description: 'Balanced wisdom where all voices become one',
  },
  {
    id: 'gentle' as const,
    label: 'Gentle Clarity',
    description: 'Soft wisdom that illuminates gently',
  },
  {
    id: 'intense' as const,
    label: 'Luminous Intensity',
    description: 'Piercing truth that burns away illusions',
  },
] as const;

export type ToneId = (typeof TONES)[number]['id'];

export const QUESTION_LIMITS = {
  dream: 3200,
  plan: 4000,
  relationship: 4000,
  sacrifice: 2400,
} as const;

export type QuestionField = keyof typeof QUESTION_LIMITS;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'mirror_auth_token',
  FORM_STATE: 'mirror_form_state',
} as const;

export const FORM_VALIDATION = {
  REQUIRED_FIELDS: ['dream', 'plan', 'hasDate', 'relationship', 'sacrifice'] as const,
  MIN_LENGTHS: {
    dream: 10,
    plan: 10,
    relationship: 10,
    sacrifice: 10,
  } as const,
};

export const CACHE_DURATION = {
  FORM_STATE: 2 * 60 * 60 * 1000, // 2 hours
  USER_SESSION: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

export const ROUTES = {
  HOME: '/',
  REFLECTION: '/reflection',
  REFLECTION_OUTPUT: '/reflection/output',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  AUTH_SIGNIN: '/auth/signin',
  AUTH_SIGNUP: '/auth/signup',
} as const;

export const DEFAULT_USER = {
  name: 'Friend',
  tier: 'free' as TierName,
  language: 'en',
  isCreator: false,
  isAdmin: false,
} as const;

export const RESPONSE_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required for reflections',
  AUTH_FAILED: 'Authentication failed, please sign in again',
  REFLECTION_LIMIT: 'Reflection limit reached',
  FORM_INCOMPLETE: 'Please fill in all required fields with your authentic response.',
  NETWORK_ERROR: 'Network error - please try again',
  GENERIC_ERROR: 'A moment of silence… Your reflection is being prepared. Please try again soon.',
} as const;
