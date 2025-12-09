/**
 * Mirror of Dreams - Unified Voice System
 *
 * All user-facing copy in the companion voice.
 * Use these strings instead of inline text to ensure consistency.
 *
 * Voice principles (from /docs/voice-bible.md):
 * - Witness, don't diagnose
 * - Companion, not authority
 * - Warmth without performance
 * - Depth without heaviness
 */

// ============================================
// GREETINGS
// ============================================
export const greetings = {
  timeOfDay: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good evening',
  },

  dashboard: {
    withDreams: 'Your dreams are waiting to be heard',
    noDreams: 'When you\'re ready, name what you\'re holding',
  },

  returning: 'Welcome back',
  firstTime: 'Welcome, dreamer',
};

// ============================================
// NAVIGATION & PAGE TITLES
// ============================================
export const navigation = {
  dashboard: 'Home',
  dreams: 'Dreams',
  reflections: 'Reflections',
  evolution: 'Journey',
  settings: 'Settings',
  profile: 'Profile',
};

// ============================================
// LANDING PAGE
// ============================================
export const landing = {
  hero: {
    headline: 'Your dreams know things',
    subheadline: 'A companion for listening to what your inner life is trying to tell you',
  },

  features: [
    {
      id: 'witness',
      icon: '🌙',
      title: 'Be Witnessed, Not Fixed',
      description: 'Share your dreams and reflections with a presence that listens without judgment, advice, or agenda. Sometimes the most profound shifts come from simply being heard.',
    },
    {
      id: 'patterns',
      icon: '✨',
      title: 'Notice What\'s Emerging',
      description: 'Over time, patterns reveal themselves—not because someone points them out, but because you begin to see them for yourself through the mirror of your own words.',
    },
    {
      id: 'journey',
      icon: '🌸',
      title: 'Walk Your Own Path',
      description: 'This is your journey. Your companion walks alongside you, reflecting back what you share, celebrating where you\'ve been and where you\'re going.',
    },
  ],

  cta: {
    primary: 'Begin',
    secondary: 'Learn More',
    demo: 'Try It',
  },

  footer: {
    tagline: 'A sacred space for dreamers who want to listen more deeply to themselves.',
  },
};

// ============================================
// PRICING PAGE
// ============================================
export const pricing = {
  headline: 'Find Your Space',
  subheadline: 'Choose what feels right for where you are now',

  tiers: {
    free: {
      name: 'Wanderer',
      description: 'Perfect for beginning your journey',
    },
    pro: {
      name: 'Seeker',
      description: 'For those ready to go deeper',
    },
    unlimited: {
      name: 'Devoted',
      description: 'For the committed inner traveler',
    },
  },

  // Reframe SaaS language
  terms: {
    reflections: 'conversations',
    features: 'what you receive',
    upgrade: 'expand your space',
    limit: 'monthly conversations',
  },
};

// ============================================
// EMPTY STATES
// ============================================
export const emptyStates = {
  dreams: {
    title: 'No dreams yet',
    message: 'When you\'re ready, name something you\'re holding—a hope, a question, a longing.',
    cta: 'Name Your First Dream',
  },

  reflections: {
    title: 'Your reflections live here',
    message: 'Each conversation becomes a thread in the tapestry of your journey.',
    cta: 'Begin a Reflection',
  },

  evolution: {
    title: 'Your journey unfolds here',
    message: 'After a few reflections, patterns begin to emerge. Come back when you\'ve had some conversations.',
    cta: 'Reflect Now',
  },

  visualizations: {
    title: 'A map of your inner landscape',
    message: 'As you reflect, your themes and patterns become visible here.',
    cta: 'Begin Reflecting',
  },
};

// ============================================
// LOADING STATES
// ============================================
export const loading = {
  default: 'Holding space...',
  dashboard: 'Preparing your space...',
  reflection: 'The mirror is listening...',
  dreams: 'Gathering your dreams...',
  evolution: 'Tracing your journey...',
  saving: 'Holding your words safe...',
  generating: 'Listening to what wants to emerge...',
};

// ============================================
// ERROR STATES
// ============================================
export const errors = {
  generic: {
    title: 'Something got tangled',
    message: 'Your words are safe. Take a breath and try again.',
    cta: 'Try Again',
  },

  network: {
    title: 'Connection lost',
    message: 'We\'ll find our way back. Check your connection and return when ready.',
    cta: 'Reconnect',
  },

  notFound: {
    title: 'This path leads elsewhere',
    message: 'We wandered somewhere unexpected. Let me guide you back.',
    cta: 'Return Home',
  },

  limitReached: {
    title: 'You\'ve filled this month\'s space',
    message: 'Your reflections are safe. Come back next month, or expand your space if you\'d like to continue.',
    cta: 'Expand Your Space',
  },
};

// ============================================
// SUCCESS STATES
// ============================================
export const success = {
  reflectionSaved: 'Your reflection is held safe',
  dreamCreated: 'Your dream has a name now',
  profileUpdated: 'Changes saved',
  subscription: 'Welcome to your expanded space',
};

// ============================================
// CALLS TO ACTION
// ============================================
export const cta = {
  reflect: 'Reflect',
  reflectNow: 'Reflect Now',
  begin: 'Begin',
  continue: 'Continue',
  save: 'Hold Safe',
  createDream: 'Name a Dream',
  viewJourney: 'See Your Journey',
  tryAgain: 'Try Again',
  goHome: 'Go Home',
  signIn: 'Welcome Back',
  signUp: 'Begin Your Journey',
};

// ============================================
// AUTH PAGES
// ============================================
export const auth = {
  signin: {
    title: 'Welcome Back',
    subtitle: 'Your dreams are waiting',
    cta: 'Enter',
    loading: 'Opening the door...',
    success: 'Welcome home',
    switchPrompt: 'New here?',
    switchCta: 'Begin your journey',
  },

  signup: {
    title: 'Begin Your Journey',
    subtitle: 'A companion awaits',
    cta: 'Create Your Space',
    loading: 'Preparing your space...',
    success: 'Your space is ready',
    switchPrompt: 'Already have a space?',
    switchCta: 'Welcome back',
  },

  forgotPassword: {
    title: 'Lost Your Way?',
    subtitle: 'We\'ll help you find it',
    cta: 'Send Reset Link',
  },

  verifyEmail: {
    title: 'One More Step',
    message: 'Check your email to complete the connection.',
  },
};

// ============================================
// DASHBOARD
// ============================================
export const dashboard = {
  hero: {
    withDreams: 'Your dreams await your presence',
    noDreams: 'When you\'re ready, name what you\'re holding',
    noDreamsCta: 'Name your first dream',
  },

  cards: {
    dreams: {
      title: 'Your Dreams',
      empty: 'Name something you\'re carrying',
    },
    reflections: {
      title: 'Recent Reflections',
      empty: 'Your conversations live here',
    },
    evolution: {
      title: 'Your Journey',
      empty: 'Patterns emerge over time',
    },
    subscription: {
      title: 'Your Space',
    },
  },
};

// ============================================
// REFLECTION FLOW
// ============================================
export const reflection = {
  intro: 'What would you like to explore?',
  placeholder: 'Share what\'s present for you...',
  submit: 'Send to Mirror',
  generating: 'The mirror is listening...',
  complete: 'Your reflection',
  savePrompt: 'Would you like to hold this reflection?',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get time-of-day greeting
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return greetings.timeOfDay.morning;
  if (hour >= 12 && hour < 18) return greetings.timeOfDay.afternoon;
  return greetings.timeOfDay.evening;
}

/**
 * Get personalized greeting
 */
export function getPersonalizedGreeting(name?: string): string {
  const timeGreeting = getTimeGreeting();
  const displayName = name?.split(' ')[0] || 'dreamer';
  return `${timeGreeting}, ${displayName}`;
}

/**
 * Format loading message with variety
 */
export function getLoadingMessage(context: keyof typeof loading = 'default'): string {
  return loading[context] || loading.default;
}
