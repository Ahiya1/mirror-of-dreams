// src/hooks/useDashboard.js - Main dashboard orchestration hook

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { dashboardService } from "../services/dashboard.service";
import { ApiError } from "../services/api";

/**
 * Main dashboard hook that orchestrates all dashboard data and state
 * @returns {Object} - Dashboard state and actions
 */
export const useDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Refs for cleanup
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef(null);

  /**
   * Load dashboard data from API
   */
  const loadDashboardData = useCallback(async () => {
    // Don't load if not authenticated or user not loaded
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
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
        setDashboardData(data);
        setError(null);
      }
    } catch (error) {
      console.error("Dashboard load error:", error);

      if (mountedRef.current) {
        const errorMessage =
          error instanceof ApiError
            ? error.getUserMessage()
            : "Failed to load dashboard data";
        setError(errorMessage);
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, user]);

  /**
   * Generate evolution report
   * @param {string} tone - Tone for report generation
   * @returns {Promise<Object>} - Generated report
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
        await loadDashboardData();

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
   * Refresh dashboard data
   */
  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get time-based greeting
   * @returns {string} - Greeting message
   */
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();

    if (hour < 6) return "Deep night greetings";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Late night wisdom";
  }, []);

  /**
   * Get personalized welcome message
   * @returns {string} - Welcome message
   */
  const getWelcomeMessage = useCallback(() => {
    if (!user) return "Your journey awaits...";

    const messages = {
      free: "Your journey of self-discovery awaits...",
      essential: "Continue exploring your inner landscape...",
      premium: "Dive deeper into your consciousness evolution...",
      creator: "Welcome to your sacred creative space...",
    };

    return messages[user.tier] || messages.free;
  }, [user]);

  /**
   * Get dashboard statistics
   * @returns {Object} - Dashboard stats
   */
  const getStats = useCallback(() => {
    if (!dashboardData) {
      return {
        totalReflections: 0,
        currentMonthReflections: 0,
        evolutionReportsGenerated: 0,
        currentStreak: 0,
      };
    }

    return {
      totalReflections: dashboardData.usage?.totalReflections || 0,
      currentMonthReflections: dashboardData.usage?.currentCount || 0,
      evolutionReportsGenerated:
        dashboardData.evolution?.progress?.current || 0,
      currentStreak: 0, // TODO: Implement streak calculation
    };
  }, [dashboardData]);

  /**
   * Check if user can perform actions
   * @returns {Object} - Action permissions
   */
  const getPermissions = useCallback(() => {
    return {
      canReflect: dashboardData?.usage?.canReflect ?? true,
      canGenerateEvolution: dashboardData?.evolution?.canGenerateNext ?? false,
      canViewHistory: isAuthenticated,
      canUpgrade: user?.tier === "free" || user?.tier === "essential",
      isCreator: user?.isCreator ?? false,
    };
  }, [dashboardData, user, isAuthenticated]);

  /**
   * Get next action suggestions
   * @returns {Array} - Suggested actions
   */
  const getNextActions = useCallback(() => {
    const actions = [];

    if (!dashboardData) return actions;

    // Reflection suggestions
    if (dashboardData.usage?.canReflect) {
      actions.push({
        type: "reflection",
        title: "Create Reflection",
        description: "Continue your journey of self-discovery",
        icon: "✨",
        href: "/reflection",
        priority: "high",
      });
    }

    // Evolution report suggestions
    if (dashboardData.evolution?.canGenerateNext) {
      actions.push({
        type: "evolution",
        title: "Generate Evolution Report",
        description: "Unlock insights from your recent reflections",
        icon: "🦋",
        action: "generate-evolution",
        priority: "high",
      });
    }

    // Upgrade suggestions
    if (user?.tier === "free") {
      actions.push({
        type: "upgrade",
        title: "Upgrade Your Journey",
        description: "Unlock evolution reports and deeper insights",
        icon: "💎",
        href: "/subscription",
        priority: "medium",
      });
    }

    return actions;
  }, [dashboardData, user]);

  // Initialize dashboard data
  useEffect(() => {
    mountedRef.current = true;

    if (isAuthenticated) {
      loadDashboardData();
    }

    return () => {
      mountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isAuthenticated, loadDashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // User data
    user,
    isAuthenticated,

    // Dashboard data
    usage: dashboardData?.usage,
    evolution: dashboardData?.evolution,
    reflections: dashboardData?.reflections,
    insights: dashboardData?.insights,

    // State
    isLoading,
    error,
    isGeneratingReport,

    // Actions
    generateEvolutionReport,
    refreshData,
    clearError,

    // Computed values
    greeting: getGreeting(),
    welcomeMessage: getWelcomeMessage(),
    stats: getStats(),
    permissions: getPermissions(),
    nextActions: getNextActions(),

    // Status checks
    hasData: !!dashboardData,
    hasError: !!error,
    isEmpty: !isLoading && !dashboardData?.reflections?.length,

    // Debug info (development only)
    ...(process.env.NODE_ENV === "development" && {
      _debug: {
        dashboardData,
        mountedRef: mountedRef.current,
      },
    }),
  };
};
