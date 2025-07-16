// utils/constants.js - Application constants

export const API_ENDPOINTS = {
  AUTH: "/api/auth",
  REFLECTION: "/api/reflection",
  REFLECTIONS: "/api/reflections",
  ARTIFACT: "/api/artifact",
  COMMUNICATION: "/api/communication",
  EVOLUTION: "/api/evolution",
  SUBSCRIPTIONS: "/api/subscriptions",
  USERS: "/api/users",
};

export const TIER_LIMITS = {
  free: 1,
  essential: 5,
  premium: 10,
};

export const TONES = [
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

export const QUESTION_LIMITS = {
  dream: 3200,
  plan: 4000,
  relationship: 4000,
  offering: 2400,
};

export const AUTH_MODES = {
  CREATOR: "creator",
  USER: "user",
  NORMAL: "normal",
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "mirror_auth_token",
  FORM_STATE: "mirror_form_state",
};

export const FORM_VALIDATION = {
  REQUIRED_FIELDS: ["dream", "plan", "hasDate", "relationship", "offering"],
  MIN_LENGTHS: {
    dream: 10,
    plan: 10,
    relationship: 10,
    offering: 10,
  },
};

export const CACHE_DURATION = {
  FORM_STATE: 2 * 60 * 60 * 1000, // 2 hours
  USER_SESSION: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const ROUTES = {
  HOME: "/",
  QUESTIONNAIRE: "/mirror/questionnaire",
  OUTPUT: "/mirror/output",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  AUTH: "/auth/signin",
};

export const DEFAULT_USER = {
  name: "Friend",
  tier: "free",
  language: "en",
  isCreator: false,
  isAdmin: false,
};

export const RESPONSE_MESSAGES = {
  AUTH_REQUIRED: "Authentication required for reflections",
  AUTH_FAILED: "Authentication failed, please sign in again",
  REFLECTION_LIMIT: "Reflection limit reached",
  FORM_INCOMPLETE:
    "Please fill in all required fields with your authentic response.",
  NETWORK_ERROR: "Network error - please try again",
  GENERIC_ERROR:
    "A moment of silence… Your reflection is being prepared. Please try again soon.",
};
