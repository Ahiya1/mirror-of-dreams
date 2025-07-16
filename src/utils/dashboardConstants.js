// src/utils/dashboardConstants.js - Dashboard-specific configuration and constants

/**
 * Animation timing configurations
 */
export const ANIMATION_TIMINGS = {
  // Card entrance animations
  CARD_ENTRANCE_DURATION: 800,
  CARD_ENTRANCE_DELAY_BASE: 100,
  CARD_ENTRANCE_STAGGER: 100,

  // Counter animations
  COUNTER_DURATION_FAST: 1000,
  COUNTER_DURATION_NORMAL: 1500,
  COUNTER_DURATION_SLOW: 2000,

  // Progress animations
  PROGRESS_RING_DURATION: 2000,
  PROGRESS_BAR_DURATION: 1500,

  // Hover transitions
  HOVER_TRANSITION_FAST: 200,
  HOVER_TRANSITION_NORMAL: 300,
  HOVER_TRANSITION_SLOW: 500,

  // Breathing effects
  BREATHING_DURATION: 4000,
  BREATHING_DELAY: 2000,

  // Shimmer effects
  SHIMMER_DURATION: 2000,
  SHIMMER_DELAY: 8000,
};

/**
 * Evolution report thresholds per tier
 */
export const EVOLUTION_THRESHOLDS = {
  free: null, // No evolution reports for free tier
  essential: 4, // Need 4 reflections for first report
  premium: 6, // Need 6 reflections for first report
  creator: 3, // Lower threshold for creators
};

/**
 * Theme icon mappings for evolution themes
 */
export const THEME_ICONS = {
  "Entrepreneurial Vision": "🚀",
  "Creative Expression": "🎨",
  "Service & Impact": "🌟",
  "Connection & Love": "💕",
  "Freedom & Independence": "🦅",
  "Growth & Learning": "🌱",
  "Leadership & Authority": "👑",
  "Spiritual Development": "🕯️",
  "Adventure & Exploration": "🗺️",
  "Security & Stability": "🏠",
  "Personal Development": "✨",
  "Emotional Healing": "💙",
  "Creative Flow": "🌊",
  "Inner Wisdom": "🔮",
  Transformation: "🦋",
  "Family & Legacy": "🏡",
  "Health & Vitality": "🌿",
  "Knowledge & Wisdom": "📚",
  "Joy & Play": "🎈",
  "Peace & Harmony": "☮️",
};

/**
 * Milestone thresholds for celebrations
 */
export const MILESTONE_THRESHOLDS = {
  REFLECTIONS: [1, 5, 10, 25, 50, 100, 250, 500],
  EVOLUTION_REPORTS: [1, 3, 5, 10, 20],
  STREAK_DAYS: [3, 7, 14, 30, 60, 100],
  MONTHS_ACTIVE: [1, 3, 6, 12, 24],
};

/**
 * Color schemes for different dashboard elements
 */
export const DASHBOARD_COLORS = {
  // Tier colors
  TIERS: {
    free: {
      primary: "rgba(255, 255, 255, 0.9)",
      background: "rgba(255, 255, 255, 0.1)",
      border: "rgba(255, 255, 255, 0.2)",
      glow: "rgba(255, 255, 255, 0.15)",
    },
    essential: {
      primary: "rgba(110, 231, 183, 0.9)",
      background: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.3)",
      glow: "rgba(16, 185, 129, 0.3)",
    },
    premium: {
      primary: "rgba(251, 191, 36, 0.9)",
      background: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.3)",
      glow: "rgba(245, 158, 11, 0.4)",
    },
    creator: {
      primary: "rgba(196, 181, 253, 0.9)",
      background: "rgba(147, 51, 234, 0.15)",
      border: "rgba(147, 51, 234, 0.3)",
      glow: "rgba(147, 51, 234, 0.4)",
    },
  },

  // Tone colors
  TONES: {
    fusion: {
      primary: "rgba(251, 191, 36, 0.9)",
      background: "rgba(251, 191, 36, 0.15)",
      border: "rgba(251, 191, 36, 0.2)",
    },
    gentle: {
      primary: "rgba(255, 255, 255, 0.9)",
      background: "rgba(255, 255, 255, 0.12)",
      border: "rgba(255, 255, 255, 0.15)",
    },
    intense: {
      primary: "rgba(196, 181, 253, 0.9)",
      background: "rgba(147, 51, 234, 0.15)",
      border: "rgba(147, 51, 234, 0.2)",
    },
  },

  // Status colors
  STATUS: {
    success: {
      primary: "rgba(110, 231, 183, 0.9)",
      background: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.15)",
    },
    warning: {
      primary: "rgba(251, 191, 36, 0.9)",
      background: "rgba(245, 158, 11, 0.08)",
      border: "rgba(245, 158, 11, 0.15)",
    },
    error: {
      primary: "rgba(248, 113, 113, 0.9)",
      background: "rgba(239, 68, 68, 0.08)",
      border: "rgba(239, 68, 68, 0.15)",
    },
    info: {
      primary: "rgba(147, 197, 253, 0.9)",
      background: "rgba(59, 130, 246, 0.08)",
      border: "rgba(59, 130, 246, 0.15)",
    },
  },
};

/**
 * Dashboard card configurations
 */
export const CARD_CONFIGS = {
  usage: {
    icon: "📊",
    title: "This Month",
    animationDelay: 100,
    minHeight: 280,
  },
  reflections: {
    icon: "🌙",
    title: "Recent Reflections",
    animationDelay: 200,
    minHeight: 280,
  },
  evolution: {
    icon: "🦋",
    title: "Evolution Insights",
    animationDelay: 300,
    minHeight: 280,
  },
  subscription: {
    icon: "💎",
    title: "Your Plan",
    animationDelay: 400,
    minHeight: 280,
  },
};

/**
 * Greeting templates for different contexts
 */
export const GREETING_TEMPLATES = {
  TIME_BASED: {
    EARLY_MORNING: [
      "Early morning clarity",
      "Dawn's first light",
      "Pre-sunrise wisdom",
    ],
    MORNING: ["Good morning", "Rise and shine", "Fresh start vibes"],
    AFTERNOON: ["Good afternoon", "Afternoon light", "Midday reflections"],
    EVENING: ["Good evening", "Evening calm", "Twilight wisdom"],
    NIGHT: ["Night reflections", "Evening contemplation", "Deep night wisdom"],
  },

  TIER_BASED: {
    free: [
      "Your monthly sacred space for deep reflection...",
      "One precious opportunity each month to see clearly...",
    ],
    essential: [
      "Continue exploring your inner landscape with intention...",
      "Five sacred opportunities this month to grow...",
    ],
    premium: [
      "Dive deeper into the mysteries of your consciousness...",
      "Premium insights await in your expanded journey...",
    ],
    creator: [
      "Your infinite creative space awaits...",
      "Welcome to your boundless journey of creation...",
    ],
  },

  MILESTONE_BASED: {
    first_reflection: "Take your first step into conscious self-discovery...",
    milestone_reached:
      "Beautiful milestones mark your evolving consciousness...",
    evolution_ready:
      "Your evolution report awaits — ready to reveal your growth patterns...",
    streak_active: "Your commitment to daily growth inspires...",
  },
};

/**
 * Usage status configurations
 */
export const USAGE_STATUS_CONFIG = {
  unlimited: {
    color: "success",
    message: "Unlimited reflections available",
    action: "Reflect Now",
    icon: "✨",
  },
  fresh: {
    color: "primary",
    message: "Your monthly journey awaits",
    action: "Start Journey",
    icon: "✨",
  },
  active: {
    color: "primary",
    message: (remaining) =>
      `${remaining} reflection${remaining === 1 ? "" : "s"} remaining`,
    action: "Continue Journey",
    icon: "✨",
  },
  moderate: {
    color: "warning",
    message: "Building momentum beautifully",
    action: "Keep Reflecting",
    icon: "✨",
  },
  approaching: {
    color: "warning",
    message: (remaining) =>
      `${remaining} reflection${remaining === 1 ? "" : "s"} left`,
    action: "Reflect Now",
    icon: "✨",
  },
  complete: {
    color: "success",
    message: "Monthly journey complete",
    action: "View Journey",
    icon: "📚",
  },
};

/**
 * Evolution status configurations
 */
export const EVOLUTION_STATUS_CONFIG = {
  upgrade: {
    title: "Evolution Reports",
    message: "Unlock deep insights into your consciousness patterns",
    action: "Unlock Evolution",
    icon: "💎",
    color: "fusion",
    type: "link",
    href: "/subscription",
  },
  ready: {
    title: "Report Ready",
    message: "Your evolution report is ready to be generated",
    action: "Generate Report",
    icon: "🦋",
    color: "success",
    type: "button",
  },
  close: {
    title: "Almost Ready",
    message: (needed) =>
      `${needed} more reflection${
        needed === 1 ? "" : "s"
      } to unlock your next evolution insight`,
    action: "Continue Journey",
    icon: "✨",
    color: "primary",
    type: "link",
    href: "/reflection",
  },
  progress: {
    title: "Building Insights",
    message: (needed) =>
      `Create ${needed} more reflections to unlock evolution patterns`,
    action: "Create Reflection",
    icon: "✨",
    color: "primary",
    type: "link",
    href: "/reflection",
  },
};

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Grid configurations for different screen sizes
 */
export const GRID_CONFIGS = {
  desktop: {
    columns: 2,
    rows: 2,
    gap: "var(--space-xl)",
    minHeight: "500px",
  },
  tablet: {
    columns: 2,
    rows: 2,
    gap: "var(--space-lg)",
    minHeight: "400px",
  },
  mobile: {
    columns: 1,
    rows: "auto",
    gap: "var(--space-md)",
    minHeight: "auto",
  },
};

/**
 * Loading state configurations
 */
export const LOADING_CONFIGS = {
  spinner: {
    size: {
      sm: "24px",
      md: "32px",
      lg: "40px",
      xl: "48px",
    },
    speed: {
      slow: "2s",
      normal: "1.5s",
      fast: "1s",
    },
  },
  skeleton: {
    lines: {
      title: 1,
      paragraph: 3,
      list: 4,
    },
    animation: {
      duration: "2s",
      easing: "ease-in-out",
    },
  },
};

/**
 * Accessibility configurations
 */
export const A11Y_CONFIGS = {
  reducedMotion: {
    respectPreference: true,
    fallbackDuration: "0.01ms",
  },
  highContrast: {
    borderWidth: "2px",
    backgroundOpacity: 0.3,
  },
  focusVisible: {
    outlineWidth: "2px",
    outlineOffset: "2px",
    outlineColor: "rgba(147, 51, 234, 0.6)",
  },
};

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  loading: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000,
  },
  animation: {
    fpsTarget: 60,
    frameDropThreshold: 5,
  },
  data: {
    cacheTimeout: 300000, // 5 minutes
    refreshInterval: 600000, // 10 minutes
  },
};
