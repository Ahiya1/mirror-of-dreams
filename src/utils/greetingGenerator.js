// src/utils/greetingGenerator.js - Intelligent greeting and message generation

/**
 * Generate time-based greeting with personality
 * @param {Date} date - Current date (optional, defaults to now)
 * @returns {string} - Personalized greeting
 */
export const getTimeBasedGreeting = (date = new Date()) => {
  const hour = date.getHours();
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const month = date.getMonth();

  // Seasonal adjustments
  const isWinter = month === 11 || month === 0 || month === 1; // Dec, Jan, Feb
  const isSpring = month === 2 || month === 3 || month === 4; // Mar, Apr, May
  const isSummer = month === 5 || month === 6 || month === 7; // Jun, Jul, Aug
  const isAutumn = month === 8 || month === 9 || month === 10; // Sep, Oct, Nov

  // Deep night (12 AM - 5 AM)
  if (hour >= 0 && hour < 5) {
    const deepNightGreetings = [
      "Deep night wisdom",
      "Sacred midnight hours",
      "Quiet contemplation time",
      "Night owl greetings",
    ];
    return deepNightGreetings[
      Math.floor(Math.random() * deepNightGreetings.length)
    ];
  }

  // Early morning (5 AM - 6 AM)
  if (hour >= 5 && hour < 6) {
    const earlyMorningGreetings = [
      "Early morning clarity",
      "Dawn's first light",
      "Pre-sunrise wisdom",
    ];
    return earlyMorningGreetings[
      Math.floor(Math.random() * earlyMorningGreetings.length)
    ];
  }

  // Morning (6 AM - 12 PM)
  if (hour >= 6 && hour < 12) {
    if (isWeekend) {
      if (hour < 9) {
        const weekendEarlyGreetings = [
          "Peaceful morning",
          "Weekend serenity",
          "Restful morning",
        ];
        return weekendEarlyGreetings[
          Math.floor(Math.random() * weekendEarlyGreetings.length)
        ];
      } else {
        return "Good morning";
      }
    }

    if (hour < 8) {
      const earlyWorkdayGreetings = [
        "Rise and shine",
        "Morning energy",
        "Fresh start vibes",
      ];
      return earlyWorkdayGreetings[
        Math.floor(Math.random() * earlyWorkdayGreetings.length)
      ];
    }

    // Seasonal morning greetings
    if (isSpring) return "Spring morning greetings";
    if (isSummer) return "Bright morning";
    if (isAutumn) return "Crisp morning clarity";
    if (isWinter) return "Cozy morning";

    return "Good morning";
  }

  // Afternoon (12 PM - 5 PM)
  if (hour >= 12 && hour < 17) {
    if (hour < 14) {
      return "Good afternoon";
    }

    const afternoonGreetings = [
      "Afternoon light",
      "Midday reflections",
      "Golden hour approaching",
    ];
    return afternoonGreetings[
      Math.floor(Math.random() * afternoonGreetings.length)
    ];
  }

  // Evening (5 PM - 9 PM)
  if (hour >= 17 && hour < 21) {
    if (isWeekend) {
      const weekendEveningGreetings = [
        "Evening calm",
        "Weekend wind-down",
        "Peaceful evening",
      ];
      return weekendEveningGreetings[
        Math.floor(Math.random() * weekendEveningGreetings.length)
      ];
    }

    // Seasonal evening greetings
    if (isWinter) return "Cozy evening";
    if (isSummer) return "Warm evening";

    return "Good evening";
  }

  // Night (9 PM - 12 AM)
  if (hour >= 21) {
    const nightGreetings = [
      "Night reflections",
      "Evening contemplation",
      "Twilight wisdom",
    ];
    return nightGreetings[Math.floor(Math.random() * nightGreetings.length)];
  }

  return "Welcome";
};

/**
 * Generate personalized welcome message based on user state and activity
 * @param {Object} user - User object
 * @param {Object} dashboardData - Dashboard data
 * @param {Date} date - Current date (optional)
 * @returns {string} - Personalized welcome message
 */
export const getPersonalizedWelcomeMessage = (
  user,
  dashboardData,
  date = new Date()
) => {
  if (!user) {
    return "Your journey of consciousness awaits...";
  }

  const { tier = "free", isCreator = false, name = "" } = user;

  const usage = dashboardData?.usage || {};
  const evolution = dashboardData?.evolution || {};
  const reflections = dashboardData?.reflections || [];

  const currentCount = usage.currentCount || 0;
  const limit = usage.limit;
  const totalReflections = usage.totalReflections || 0;

  // Time-based context
  const hour = date.getHours();
  const isEvening = hour >= 17;
  const isEarlyMorning = hour >= 5 && hour < 9;

  // Creator messages
  if (isCreator) {
    const creatorMessages = [
      "Your infinite creative space awaits...",
      "Welcome to your boundless journey of creation...",
      "The universe of reflection opens before you...",
    ];

    if (totalReflections === 0) {
      return "Welcome to your infinite creative space...";
    }

    if (totalReflections >= 100) {
      return "Your profound creative journey continues to inspire...";
    }

    return creatorMessages[Math.floor(Math.random() * creatorMessages.length)];
  }

  // First-time user messages
  if (totalReflections === 0) {
    const firstTimeMessages = {
      free: [
        "Take your first step into conscious self-discovery...",
        "Your sacred mirror awaits your first reflection...",
        "Begin your journey of authentic self-exploration...",
      ],
      essential: [
        "Begin your enhanced journey of 5 monthly reflections...",
        "Your deeper exploration path starts here...",
        "Welcome to your expanded consciousness journey...",
      ],
      premium: [
        "Embark on your premium path of deep consciousness exploration...",
        "Your advanced journey of self-discovery begins...",
        "Welcome to the depths of premium consciousness work...",
      ],
    };

    const messages = firstTimeMessages[tier] || firstTimeMessages.free;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Usage-based context
  if (limit !== "unlimited") {
    const usagePercent = (currentCount / limit) * 100;

    // No usage this month
    if (usagePercent === 0) {
      const renewalMessages = [
        "Your monthly reflection journey awaits renewal...",
        "A fresh month of self-discovery begins...",
        "Your consciousness path continues anew...",
      ];
      return renewalMessages[
        Math.floor(Math.random() * renewalMessages.length)
      ];
    }

    // Low usage (< 20%)
    if (usagePercent < 20) {
      const remaining = limit - currentCount;
      return `Continue your sacred journey with ${remaining} reflection${
        remaining === 1 ? "" : "s"
      } remaining...`;
    }

    // Moderate usage (20-50%)
    if (usagePercent < 50) {
      const moderateMessages = [
        "Your consciousness journey deepens with each reflection...",
        "Beautiful patterns of awareness are emerging...",
        "The mirror reveals new depths of understanding...",
      ];
      return moderateMessages[
        Math.floor(Math.random() * moderateMessages.length)
      ];
    }

    // High usage (50-80%)
    if (usagePercent < 80) {
      const highUsageMessages = [
        "You're weaving beautiful patterns of self-awareness...",
        "Your commitment to growth shines brilliantly...",
        "Deep currents of wisdom flow through your journey...",
      ];
      return highUsageMessages[
        Math.floor(Math.random() * highUsageMessages.length)
      ];
    }

    // Near limit (80-100%)
    if (usagePercent < 100) {
      const remaining = limit - currentCount;
      const nearLimitMessages = [
        `Almost at your monthly limit — ${remaining} reflection${
          remaining === 1 ? "" : "s"
        } left...`,
        `${remaining} more reflection${
          remaining === 1 ? "" : "s"
        } to complete this month's journey...`,
      ];
      return nearLimitMessages[
        Math.floor(Math.random() * nearLimitMessages.length)
      ];
    }

    // At limit
    const completionMessages = [
      "You've fully embraced this month's journey of self-discovery...",
      "Your monthly exploration reaches beautiful completion...",
      "This month's consciousness work shines with dedication...",
    ];
    return completionMessages[
      Math.floor(Math.random() * completionMessages.length)
    ];
  }

  // Evolution-based messages
  if (evolution.canGenerateNext) {
    const evolutionReadyMessages = [
      "Your evolution report awaits — ready to reveal your growth patterns...",
      "Deep insights from your journey are ready to emerge...",
      "Your consciousness evolution story is ready to unfold...",
    ];
    return evolutionReadyMessages[
      Math.floor(Math.random() * evolutionReadyMessages.length)
    ];
  }

  if (evolution.progress?.needed <= 2) {
    const needed = evolution.progress.needed;
    return `${needed} more reflection${
      needed === 1 ? "" : "s"
    } until your next evolution insight unfolds...`;
  }

  // Recent activity context
  if (reflections.length > 0) {
    const latestReflection = reflections[0];
    const timeSinceLatest = latestReflection?.created_at
      ? Math.floor(
          (date - new Date(latestReflection.created_at)) / (1000 * 60 * 60 * 24)
        )
      : 0;

    if (timeSinceLatest === 0) {
      const todayMessages = [
        "Your reflective energy flows beautifully today...",
        "Today's consciousness work adds new depth...",
        "Fresh insights bloom from today's exploration...",
      ];
      return todayMessages[Math.floor(Math.random() * todayMessages.length)];
    }

    if (timeSinceLatest === 1) {
      const yesterdayMessages = [
        "Yesterday's insights continue to illuminate your path...",
        "The ripples of yesterday's reflection still resonate...",
        "Building on yesterday's beautiful discoveries...",
      ];
      return yesterdayMessages[
        Math.floor(Math.random() * yesterdayMessages.length)
      ];
    }
  }

  // Time-aware general messages
  if (isEarlyMorning) {
    const morningMessages = [
      "Morning light illuminates new possibilities for growth...",
      "Fresh dawn energy awakens deeper understanding...",
      "The day opens with infinite potential for insight...",
    ];
    return morningMessages[Math.floor(Math.random() * morningMessages.length)];
  }

  if (isEvening) {
    const eveningMessages = [
      "Evening's gentle wisdom invites deeper contemplation...",
      "Twilight hours offer perfect space for reflection...",
      "The day's experiences await transformation into wisdom...",
    ];
    return eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
  }

  // General tier-based messages
  const tierMessages = {
    free: [
      "Your monthly sacred space for deep reflection...",
      "One precious opportunity each month to see clearly...",
      "Your essential reflection practice continues...",
    ],
    essential: [
      "Continue exploring your inner landscape with intention...",
      "Five sacred opportunities this month to grow...",
      "Your essential journey unfolds with each reflection...",
    ],
    premium: [
      "Dive deeper into the mysteries of your consciousness...",
      "Premium insights await in your expanded journey...",
      "Ten monthly paths to profound self-discovery...",
    ],
  };

  const messages = tierMessages[tier] || tierMessages.free;
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Get encouraging message for specific contexts
 * @param {string} context - Context type ('empty', 'milestone', 'streak', 'returning')
 * @param {Object} data - Additional context data
 * @returns {string} - Encouraging message
 */
export const getEncouragingMessage = (context, data = {}) => {
  const messages = {
    empty: [
      "Every journey begins with a single step...",
      "Your first reflection awaits your authentic voice...",
      "The mirror of truth is ready when you are...",
    ],
    milestone: [
      `Celebrating ${data.count || 10} reflections of authentic growth!`,
      "Your dedication to self-discovery shines brilliantly...",
      "Beautiful milestones mark your evolving consciousness...",
    ],
    streak: [
      `${data.days || 7} days of consistent reflection — remarkable!`,
      "Your commitment to daily growth inspires...",
      "Consistency creates the most beautiful transformations...",
    ],
    returning: [
      "Welcome back to your practice of self-discovery...",
      "Your reflective journey continues to unfold...",
      "The path of consciousness welcomes you home...",
    ],
  };

  const contextMessages = messages[context] || messages.empty;
  return contextMessages[Math.floor(Math.random() * contextMessages.length)];
};

/**
 * Get motivational call-to-action based on user state
 * @param {Object} user - User object
 * @param {Object} usage - Usage data
 * @returns {Object} - Call-to-action object with text and action
 */
export const getMotivationalCTA = (user, usage) => {
  const canReflect = usage?.canReflect !== false;
  const tier = user?.tier || "free";
  const isCreator = user?.isCreator || false;

  if (isCreator) {
    return {
      primary: {
        text: "Create Limitlessly",
        action: "/reflection?mode=creator",
        icon: "🌟",
      },
      secondary: {
        text: "Creator Dashboard",
        action: "/creator",
        icon: "🎯",
      },
    };
  }

  if (!canReflect) {
    return {
      primary: {
        text: "View Your Journey",
        action: "/reflections",
        icon: "📚",
      },
      secondary: {
        text: "Upgrade for More",
        action: "/subscription",
        icon: "💎",
      },
    };
  }

  if (tier === "free") {
    return {
      primary: {
        text: "Reflect Now",
        action: "/reflection",
        icon: "✨",
      },
      secondary: {
        text: "Upgrade Journey",
        action: "/subscription",
        icon: "💎",
      },
    };
  }

  return {
    primary: {
      text: "Reflect Now",
      action: "/reflection",
      icon: "✨",
    },
    secondary: {
      text: "Gift Reflection",
      action: "/gifting",
      icon: "🎁",
    },
  };
};
