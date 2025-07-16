// src/hooks/useDashboard.js - Complete dashboard orchestration with enhanced state management

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "./useAuth";
import { dashboardService } from "../services/dashboard.service";
import { ApiError } from "../services/api";
import {
  EVOLUTION_THRESHOLDS,
  MILESTONE_THRESHOLDS,
} from "../utils/dashboardConstants";
import {
  getTimeBasedGreeting,
  getPersonalizedWelcomeMessage,
  getMotivationalCTA,
} from "../utils/greetingGenerator";

/**
 * Enhanced dashboard hook with complete state orchestration and data management
 * @returns {Object} - Comprehensive dashboard state and actions
 */
export const useDashboard = () => {
  const { user, isAuthenticated } = useAuth();

  // Core state
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Action states
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cache and optimization
  const [cachedData, setCachedData] = useState(new Map());
  const [retryCount, setRetryCount] = useState(0);

  // Refs for cleanup and optimization
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  /**
   * Load dashboard data with enhanced error handling and caching
   */
  const loadDashboardData = useCallback(
    async (force = false) => {
      // Don't load if not authenticated or user not loaded
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      // Check cache if not forcing refresh
      if (!force && cachedData.has(user.id)) {
        const cached = cachedData.get(user.id);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cached data if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setDashboardData(cached.data);
          setLastRefresh(cached.timestamp);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      // Set loading timeout to prevent hanging
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setError("Loading timeout - please refresh the page");
          setIsLoading(false);
        }
      }, 30000); // 30 second timeout

      try {
        const data = await dashboardService.getDashboardData(user.id);

        if (mountedRef.current) {
          // Process and enhance the data
          const processedData = processRawDashboardData(data, user);

          setDashboardData(processedData);
          setError(null);
          setRetryCount(0);
          setLastRefresh(Date.now());

          // Cache the data
          setCachedData((prev) => {
            const newCache = new Map(prev);
            newCache.set(user.id, {
              data: processedData,
              timestamp: Date.now(),
            });

            // Keep only last 3 users in cache
            if (newCache.size > 3) {
              const oldestKey = Array.from(newCache.keys())[0];
              newCache.delete(oldestKey);
            }

            return newCache;
          });
        }
      } catch (error) {
        console.error("Dashboard load error:", error);

        if (mountedRef.current) {
          const errorMessage =
            error instanceof ApiError
              ? error.getUserMessage()
              : "Failed to load dashboard data";

          setError(errorMessage);

          // Implement exponential backoff for retries
          if (retryCount < 3) {
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);

            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                setRetryCount((prev) => prev + 1);
                loadDashboardData(force);
              }
            }, retryDelay);
          }
        }
      } finally {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [isAuthenticated, user, cachedData, retryCount]
  );

  /**
   * Process raw dashboard data and add computed properties
   */
  const processRawDashboardData = useCallback((rawData, userInfo) => {
    const processed = {
      ...rawData,

      // Add computed usage properties
      usage: {
        ...rawData.usage,
        percentUsed: calculateUsagePercent(rawData.usage),
        status: getUsageStatus(rawData.usage),
        canReflect: checkCanReflect(rawData.usage, userInfo),
      },

      // Add computed evolution properties
      evolution: {
        ...rawData.evolution,
        progress: calculateEvolutionProgress(rawData.evolution, userInfo),
        status: getEvolutionStatus(rawData.evolution, userInfo),
      },

      // Process reflections with time formatting
      reflections: (rawData.reflections || []).map((reflection) => ({
        ...reflection,
        timeAgo: dashboardService.formatTimeAgo(reflection.created_at),
        toneName: dashboardService.formatToneName(reflection.tone),
      })),

      // Add milestone detection
      milestones: detectMilestones(rawData, userInfo),

      // Add streaks if available
      streaks: calculateStreaks(rawData.reflections || []),

      // Enhance insights
      insights: enhanceInsights(rawData.insights || [], rawData, userInfo),
    };

    return processed;
  }, []);

  /**
   * Calculate usage percentage
   */
  const calculateUsagePercent = (usage) => {
    if (!usage || usage.limit === "unlimited") return 0;
    const current = usage.currentCount || 0;
    const limit = usage.limit || 1;
    return Math.min((current / limit) * 100, 100);
  };

  /**
   * Get usage status
   */
  const getUsageStatus = (usage) => {
    if (!usage) return "unknown";
    if (usage.limit === "unlimited") return "unlimited";

    const percent = calculateUsagePercent(usage);
    if (percent === 0) return "fresh";
    if (percent < 50) return "active";
    if (percent < 80) return "moderate";
    if (percent < 100) return "approaching";
    return "complete";
  };

  /**
   * Check if user can create reflections
   */
  const checkCanReflect = (usage, userInfo) => {
    if (userInfo?.isCreator || usage?.limit === "unlimited") return true;
    const current = usage?.currentCount || 0;
    const limit = usage?.limit || 1;
    return current < limit;
  };

  /**
   * Calculate evolution progress
   */
  const calculateEvolutionProgress = (evolution, userInfo) => {
    const tier = userInfo?.tier || "free";
    const threshold = EVOLUTION_THRESHOLDS[tier];

    if (!threshold) {
      return {
        current: 0,
        threshold: 0,
        needed: 0,
        percentage: 0,
        canGenerate: false,
      };
    }

    const current = evolution?.progress?.current || 0;
    const needed = Math.max(0, threshold - current);
    const percentage = Math.min((current / threshold) * 100, 100);

    return {
      current,
      threshold,
      needed,
      percentage,
      canGenerate: current >= threshold,
    };
  };

  /**
   * Get evolution status
   */
  const getEvolutionStatus = (evolution, userInfo) => {
    const tier = userInfo?.tier || "free";

    if (tier === "free") return "upgrade";
    if (evolution?.canGenerateNext) return "ready";
    if (evolution?.progress?.needed <= 2) return "close";
    return "progress";
  };

  /**
   * Detect milestone achievements
   */
  const detectMilestones = (data, userInfo) => {
    const milestones = [];
    const totalReflections = data.usage?.totalReflections || 0;
    const evolutionReports = data.evolution?.progress?.current || 0;

    // Reflection milestones
    if (MILESTONE_THRESHOLDS.REFLECTIONS.includes(totalReflections)) {
      milestones.push({
        type: "reflections",
        count: totalReflections,
        message: `${totalReflections} reflection${
          totalReflections === 1 ? "" : "s"
        } completed!`,
        icon: "🎉",
      });
    }

    // Evolution report milestones
    if (MILESTONE_THRESHOLDS.EVOLUTION_REPORTS.includes(evolutionReports)) {
      milestones.push({
        type: "evolution",
        count: evolutionReports,
        message: `${evolutionReports} evolution report${
          evolutionReports === 1 ? "" : "s"
        } generated!`,
        icon: "🦋",
      });
    }

    return milestones;
  };

  /**
   * Calculate streak information
   */
  const calculateStreaks = (reflections) => {
    if (!reflections?.length) {
      return { currentDays: 0, longestDays: 0, isActive: false };
    }

    // Sort reflections by date
    const sortedReflections = [...reflections].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (const reflection of sortedReflections) {
      const reflectionDate = new Date(reflection.created_at);
      reflectionDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
        lastDate = reflectionDate;
        continue;
      }

      const daysDiff = Math.floor(
        (lastDate - reflectionDate) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        tempStreak++;
      } else if (daysDiff === 0) {
        // Same day, continue streak
        continue;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }

      lastDate = reflectionDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if current streak is active (within last 2 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReflectionDate = new Date(sortedReflections[0].created_at);
    lastReflectionDate.setHours(0, 0, 0, 0);
    const daysSinceLastReflection = Math.floor(
      (today - lastReflectionDate) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastReflection <= 1) {
      currentStreak = tempStreak;
    }

    return {
      currentDays: currentStreak,
      longestDays: longestStreak,
      isActive: currentStreak > 0,
    };
  };

  /**
   * Enhance insights with additional context
   */
  const enhanceInsights = (insights, data, userInfo) => {
    const enhanced = [...insights];

    // Add personalized insights based on usage patterns
    const usage = data.usage || {};
    const evolution = data.evolution || {};

    // Usage pattern insights
    if (usage.currentCount && usage.limit !== "unlimited") {
      const usagePercent = (usage.currentCount / usage.limit) * 100;

      if (usagePercent >= 80) {
        enhanced.push({
          type: "usage_high",
          title: "Active Reflection Journey",
          message: `You've used ${usage.currentCount} of ${usage.limit} reflections this month`,
          icon: "📊",
          priority: "medium",
        });
      }
    }

    // Evolution readiness insights
    if (evolution.progress?.needed === 1) {
      enhanced.push({
        type: "evolution_ready",
        title: "Evolution Report Almost Ready!",
        message: "One more reflection to unlock your consciousness patterns",
        icon: "🦋",
        action: "Create Reflection",
        actionUrl: "/reflection",
        priority: "high",
      });
    }

    return enhanced.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1)
      );
    });
  };

  /**
   * Generate evolution report with enhanced error handling
   */
  const generateEvolutionReport = useCallback(
    async (tone = "fusion") => {
      if (!isAuthenticated || isGeneratingReport) {
        return null;
      }

      setIsGeneratingReport(true);
      setError(null);

      try {
        const report = await dashboardService.generateEvolutionReport(tone);

        // Refresh dashboard data to update evolution state
        await loadDashboardData(true);

        return report;
      } catch (error) {
        console.error("Evolution report generation error:", error);

        const errorMessage =
          error instanceof ApiError
            ? error.getUserMessage()
            : "Failed to generate evolution report";
        setError(errorMessage);

        throw error;
      } finally {
        if (mountedRef.current) {
          setIsGeneratingReport(false);
        }
      }
    },
    [isAuthenticated, isGeneratingReport, loadDashboardData]
  );

  /**
   * Refresh dashboard data with user feedback
   */
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await loadDashboardData(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loadDashboardData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  /**
   * Auto-refresh data periodically
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Refresh every 10 minutes when tab is active
    const refreshInterval = setInterval(() => {
      if (!document.hidden && !isLoading && !isRefreshing) {
        loadDashboardData();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user, isLoading, isRefreshing, loadDashboardData]);

  /**
   * Handle visibility change for smart refreshing
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && dashboardData && !isLoading) {
        const timeSinceLastRefresh = Date.now() - (lastRefresh || 0);

        // Refresh if data is older than 5 minutes
        if (timeSinceLastRefresh > 5 * 60 * 1000) {
          loadDashboardData();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [dashboardData, isLoading, lastRefresh, loadDashboardData]);

  // Initialize dashboard data
  useEffect(() => {
    mountedRef.current = true;

    if (isAuthenticated && user) {
      loadDashboardData();
    }

    return () => {
      mountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user, loadDashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Computed values for easy access
   */
  const computedValues = useMemo(() => {
    if (!dashboardData) {
      return {
        greeting: getTimeBasedGreeting(),
        welcomeMessage: "Your journey awaits...",
        stats: { totalReflections: 0, currentMonthReflections: 0 },
        permissions: { canReflect: false, canGenerateEvolution: false },
        nextActions: [],
        isEmpty: true,
        hasError: !!error,
        hasData: false,
      };
    }

    return {
      greeting: getTimeBasedGreeting(),
      welcomeMessage: getPersonalizedWelcomeMessage(user, dashboardData),
      stats: {
        totalReflections: dashboardData.usage?.totalReflections || 0,
        currentMonthReflections: dashboardData.usage?.currentCount || 0,
        evolutionReportsGenerated:
          dashboardData.evolution?.progress?.current || 0,
        currentStreak: dashboardData.streaks?.currentDays || 0,
      },
      permissions: {
        canReflect: dashboardData.usage?.canReflect ?? true,
        canGenerateEvolution: dashboardData.evolution?.canGenerateNext ?? false,
        canViewHistory: isAuthenticated,
        canUpgrade: user?.tier === "free" || user?.tier === "essential",
        isCreator: user?.isCreator ?? false,
      },
      nextActions: getMotivationalCTA(user, dashboardData.usage),
      isEmpty: !dashboardData.reflections?.length,
      hasError: !!error,
      hasData: true,
    };
  }, [dashboardData, user, isAuthenticated, error]);

  return {
    // User data
    user,
    isAuthenticated,

    // Dashboard data
    usage: dashboardData?.usage,
    evolution: dashboardData?.evolution,
    reflections: dashboardData?.reflections,
    insights: dashboardData?.insights,
    milestones: dashboardData?.milestones,
    streaks: dashboardData?.streaks,

    // State
    isLoading,
    error,
    isGeneratingReport,
    isRefreshing,
    lastRefresh,

    // Actions
    generateEvolutionReport,
    refreshData,
    clearError,
    loadDashboardData,

    // Computed values
    ...computedValues,

    // Cache info
    cacheSize: cachedData.size,
    retryCount,

    // Debug info (development only)
    ...(process.env.NODE_ENV === "development" && {
      _debug: {
        dashboardData,
        cachedData: Array.from(cachedData.keys()),
        mountedRef: mountedRef.current,
        retryCount,
      },
    }),
  };
};
