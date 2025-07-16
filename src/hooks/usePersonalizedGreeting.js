// src/hooks/usePersonalizedGreeting.js - Dynamic welcome messages and greetings

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getTimeBasedGreeting,
  getPersonalizedWelcomeMessage,
  getEncouragingMessage,
  getMotivationalCTA,
} from "../utils/greetingGenerator";
import { useAuth } from "./useAuth";

/**
 * Hook for generating personalized greetings and messages
 * @param {Object} dashboardData - Dashboard data for context
 * @param {Object} options - Configuration options
 * @returns {Object} - Greeting data and controls
 */
export const usePersonalizedGreeting = (dashboardData = null, options = {}) => {
  const {
    refreshInterval = 60000, // Update every minute
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    enableMilestones = true,
    enableStreaks = true,
    enableSeasons = true,
  } = options;

  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  /**
   * Update current time for time-based greetings
   */
  const updateTime = useCallback(() => {
    const now = new Date();
    setCurrentTime(now);
    setLastUpdate(Date.now());
  }, []);

  /**
   * Get current greeting based on time and context
   */
  const greeting = useMemo(() => {
    return getTimeBasedGreeting(currentTime);
  }, [currentTime]);

  /**
   * Get personalized welcome message
   */
  const welcomeMessage = useMemo(() => {
    return getPersonalizedWelcomeMessage(user, dashboardData, currentTime);
  }, [user, dashboardData, currentTime]);

  /**
   * Get user's display name
   */
  const displayName = useMemo(() => {
    if (!user) return "Sacred Soul";
    if (user.isCreator) return "Creator";

    const firstName = user.name?.split(" ")[0];
    return firstName || user.name || "Sacred Soul";
  }, [user]);

  /**
   * Get motivational call-to-action buttons
   */
  const callToActions = useMemo(() => {
    if (!user) {
      return {
        primary: {
          text: "Begin Journey",
          action: "/auth/signin",
          icon: "✨",
        },
        secondary: {
          text: "Learn More",
          action: "/about",
          icon: "🪞",
        },
      };
    }

    return getMotivationalCTA(user, dashboardData?.usage);
  }, [user, dashboardData]);

  /**
   * Detect milestones and special occasions
   */
  const specialContext = useMemo(() => {
    if (!user || !dashboardData || !enableMilestones) return null;

    const totalReflections = dashboardData.usage?.totalReflections || 0;
    const evolutionReports = dashboardData.evolution?.progress?.current || 0;

    // Check for milestone achievements
    const milestones = [1, 5, 10, 25, 50, 100, 250, 500];
    if (milestones.includes(totalReflections)) {
      return {
        type: "milestone",
        title: "🎉 Milestone Reached!",
        message: getEncouragingMessage("milestone", {
          count: totalReflections,
        }),
      };
    }

    // Check for first evolution report
    if (evolutionReports === 1) {
      return {
        type: "evolution_first",
        title: "🦋 First Evolution Report!",
        message: "Your consciousness patterns are beginning to emerge...",
      };
    }

    // Check for streak achievements (if streak data available)
    if (enableStreaks && dashboardData.streaks?.currentDays) {
      const streakDays = dashboardData.streaks.currentDays;
      const streakMilestones = [3, 7, 14, 30, 60, 100];

      if (streakMilestones.includes(streakDays)) {
        return {
          type: "streak",
          title: `🔥 ${streakDays}-Day Streak!`,
          message: getEncouragingMessage("streak", { days: streakDays }),
        };
      }
    }

    return null;
  }, [user, dashboardData, enableMilestones, enableStreaks]);

  /**
   * Get seasonal context if enabled
   */
  const seasonalContext = useMemo(() => {
    if (!enableSeasons) return null;

    const month = currentTime.getMonth();
    const day = currentTime.getDate();

    // Check for special dates
    const specialDates = {
      // New Year
      newYear: month === 0 && day === 1,
      // Spring Equinox (around March 20)
      springEquinox: month === 2 && day >= 19 && day <= 21,
      // Summer Solstice (around June 21)
      summerSolstice: month === 5 && day >= 20 && day <= 22,
      // Autumn Equinox (around September 22)
      autumnEquinox: month === 8 && day >= 21 && day <= 23,
      // Winter Solstice (around December 21)
      winterSolstice: month === 11 && day >= 20 && day <= 22,
    };

    for (const [event, isActive] of Object.entries(specialDates)) {
      if (isActive) {
        return {
          type: "seasonal",
          event,
          message: getSeasonalMessage(event),
        };
      }
    }

    return null;
  }, [currentTime, enableSeasons]);

  /**
   * Get encouraging message based on user state
   */
  const encouragingMessage = useMemo(() => {
    if (!user || !dashboardData) return null;

    const totalReflections = dashboardData.usage?.totalReflections || 0;
    const hasReflectedToday = checkIfReflectedToday(dashboardData.reflections);

    if (totalReflections === 0) {
      return getEncouragingMessage("empty");
    }

    if (!hasReflectedToday && totalReflections > 5) {
      return getEncouragingMessage("returning");
    }

    return null;
  }, [user, dashboardData]);

  /**
   * Get contextual subtitle based on various factors
   */
  const contextualSubtitle = useMemo(() => {
    // Priority order: special context > seasonal > encouraging > welcome message
    if (specialContext) return specialContext.message;
    if (seasonalContext) return seasonalContext.message;
    if (encouragingMessage) return encouragingMessage;
    return welcomeMessage;
  }, [specialContext, seasonalContext, encouragingMessage, welcomeMessage]);

  /**
   * Check if user has reflected today
   */
  function checkIfReflectedToday(reflections) {
    if (!reflections?.length) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reflections.some((reflection) => {
      const reflectionDate = new Date(reflection.created_at);
      reflectionDate.setHours(0, 0, 0, 0);
      return reflectionDate.getTime() === today.getTime();
    });
  }

  /**
   * Get seasonal message for special dates
   */
  function getSeasonalMessage(event) {
    const messages = {
      newYear: "A fresh year of consciousness exploration begins...",
      springEquinox: "Spring's balance brings new growth and awareness...",
      summerSolstice: "The longest day illuminates infinite possibilities...",
      autumnEquinox: "Autumn's wisdom guides deeper reflection...",
      winterSolstice: "Winter solstice invites profound inner contemplation...",
    };

    return messages[event] || "Seasonal wisdom flows through your journey...";
  }

  /**
   * Force refresh of greeting and messages
   */
  const refreshGreeting = useCallback(() => {
    updateTime();
  }, [updateTime]);

  /**
   * Get time until next greeting update
   */
  const timeUntilUpdate = useMemo(() => {
    const timeSinceUpdate = Date.now() - lastUpdate;
    const timeRemaining = Math.max(0, refreshInterval - timeSinceUpdate);
    return timeRemaining;
  }, [lastUpdate, refreshInterval]);

  // Set up time-based updates
  useEffect(() => {
    const timer = setInterval(updateTime, refreshInterval);
    return () => clearInterval(timer);
  }, [refreshInterval, updateTime]);

  // Update on significant data changes
  useEffect(() => {
    if (dashboardData) {
      // Small delay to ensure data is processed
      const timeout = setTimeout(updateTime, 100);
      return () => clearTimeout(timeout);
    }
  }, [dashboardData, updateTime]);

  return {
    // Primary greeting data
    greeting,
    displayName,
    welcomeMessage,
    contextualSubtitle,

    // Call-to-action buttons
    callToActions,

    // Special contexts
    specialContext,
    seasonalContext,
    encouragingMessage,

    // Time and date info
    currentTime,
    timeZone,
    timeUntilUpdate,

    // Controls
    refreshGreeting,
    updateTime,

    // Status
    hasSpecialContext: !!specialContext,
    hasSeasonalContext: !!seasonalContext,
    hasEncouragingMessage: !!encouragingMessage,

    // Configuration
    config: {
      refreshInterval,
      timeZone,
      enableMilestones,
      enableStreaks,
      enableSeasons,
    },

    // Debug info (development only)
    ...(process.env.NODE_ENV === "development" && {
      _debug: {
        lastUpdate,
        dashboardData,
        user: user?.email,
      },
    }),
  };
};

/**
 * Hook for simple time-based greeting without dashboard context
 * @param {Object} options - Configuration options
 * @returns {Object} - Simple greeting data
 */
export const useSimpleGreeting = (options = {}) => {
  const {
    refreshInterval = 300000, // Update every 5 minutes for simple greeting
  } = options;

  const [currentTime, setCurrentTime] = useState(new Date());

  const greeting = useMemo(() => {
    return getTimeBasedGreeting(currentTime);
  }, [currentTime]);

  const updateTime = useCallback(() => {
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    const timer = setInterval(updateTime, refreshInterval);
    return () => clearInterval(timer);
  }, [refreshInterval, updateTime]);

  return {
    greeting,
    currentTime,
    updateTime,
  };
};
