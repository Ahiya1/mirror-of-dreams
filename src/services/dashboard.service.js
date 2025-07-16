// src/services/dashboard.service.js - Dashboard API service

import { apiClient } from "./api";
import { API_ENDPOINTS } from "../utils/constants";

class DashboardService {
  /**
   * Get comprehensive dashboard data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Dashboard data
   */
  async getDashboardData(userId) {
    try {
      // Parallel API calls to existing endpoints
      const [usage, eligibility, recentReports, recentReflections] =
        await Promise.allSettled([
          this.getUsageData(),
          this.getEvolutionEligibility(),
          this.getRecentEvolutionReports(),
          this.getRecentReflections(),
        ]);

      return {
        usage:
          usage.status === "fulfilled" ? usage.value : this.getDefaultUsage(),
        evolution:
          eligibility.status === "fulfilled"
            ? this.formatEvolutionData(eligibility.value, recentReports.value)
            : this.getDefaultEvolution(),
        reflections:
          recentReflections.status === "fulfilled"
            ? recentReflections.value
            : [],
        insights: this.generateDashboardInsights(
          usage.value,
          eligibility.value,
          recentReports.value
        ),
        isLoading: false,
      };
    } catch (error) {
      console.error("Dashboard data error:", error);
      throw error;
    }
  }

  /**
   * Get usage data from reflections API
   * @returns {Promise<Object>} - Usage information
   */
  async getUsageData() {
    try {
      const response = await apiClient.post(API_ENDPOINTS.REFLECTIONS, {
        action: "check-usage",
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to get usage data");
      }

      return response.usage;
    } catch (error) {
      console.error("Usage data error:", error);
      return this.getDefaultUsage();
    }
  }

  /**
   * Get evolution eligibility from evolution API
   * @returns {Promise<Object>} - Evolution eligibility
   */
  async getEvolutionEligibility() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EVOLUTION, {
        action: "check-eligibility",
      });

      if (!response.success) {
        throw new Error(
          response.error || "Failed to get evolution eligibility"
        );
      }

      return response;
    } catch (error) {
      console.error("Evolution eligibility error:", error);
      return this.getDefaultEvolution();
    }
  }

  /**
   * Get recent evolution reports
   * @returns {Promise<Array>} - Recent evolution reports
   */
  async getRecentEvolutionReports() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EVOLUTION, {
        action: "get-reports",
        limit: 3,
      });

      if (!response.success) {
        return [];
      }

      return response.reports || [];
    } catch (error) {
      console.error("Recent evolution reports error:", error);
      return [];
    }
  }

  /**
   * Get recent reflections
   * @returns {Promise<Array>} - Recent reflections
   */
  async getRecentReflections() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REFLECTIONS, {
        action: "get-history",
        limit: 4,
      });

      if (!response.success) {
        return [];
      }

      return response.reflections || [];
    } catch (error) {
      console.error("Recent reflections error:", error);
      return [];
    }
  }

  /**
   * Format evolution data for dashboard
   * @param {Object} eligibility - Evolution eligibility data
   * @param {Array} reports - Recent reports
   * @returns {Object} - Formatted evolution data
   */
  formatEvolutionData(eligibility, reports = []) {
    const themes = this.extractLatestThemes(reports);
    const progress = this.calculateProgress(eligibility);

    return {
      eligible: eligibility.eligible || false,
      progress,
      themes,
      canGenerateNext: eligibility.eligible && !eligibility.upgradeRequired,
      upgradeRequired: eligibility.upgradeRequired || false,
      tier: eligibility.tier || "free",
    };
  }

  /**
   * Calculate evolution progress
   * @param {Object} eligibility - Evolution eligibility data
   * @returns {Object} - Progress information
   */
  calculateProgress(eligibility) {
    const current = eligibility.currentReflections || 0;
    const threshold = eligibility.threshold || 4;
    const needed = eligibility.needed || 0;

    return {
      current,
      threshold,
      needed,
      percentage:
        threshold > 0 ? Math.min((current / threshold) * 100, 100) : 0,
    };
  }

  /**
   * Extract themes from recent reports
   * @param {Array} reports - Recent evolution reports
   * @returns {Array} - Formatted themes
   */
  extractLatestThemes(reports) {
    if (!reports?.length) return [];

    // Get themes from most recent report
    const latestThemes = reports[0]?.themes || [];

    // Theme display mapping matching evolution API
    const themeIcons = {
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
    };

    return latestThemes.map((theme) => ({
      name: theme,
      icon: themeIcons[theme] || "✨",
      displayName: theme,
    }));
  }

  /**
   * Generate personalized dashboard insights
   * @param {Object} usage - Usage data
   * @param {Object} eligibility - Evolution eligibility
   * @param {Array} reports - Recent reports
   * @returns {Array} - Dashboard insights
   */
  generateDashboardInsights(usage, eligibility, reports) {
    const insights = [];

    // Evolution progress insights
    if (eligibility?.needed === 1) {
      insights.push({
        type: "progress",
        title: "Almost Ready!",
        message: "One more reflection to unlock your next evolution report",
        icon: "🦋",
        action: "Create Reflection",
        actionUrl: "/reflection",
      });
    } else if (eligibility?.needed === 0 && eligibility?.eligible) {
      insights.push({
        type: "ready",
        title: "Evolution Report Ready",
        message: "You can now generate your consciousness evolution report",
        icon: "🌟",
        action: "Generate Report",
        actionType: "generate-evolution",
      });
    }

    // Theme evolution insights
    if (reports?.length >= 2) {
      const themes = this.compareThemeEvolution(reports);
      if (themes.emerging) {
        insights.push({
          type: "discovery",
          title: "New Theme Emerging",
          message: `${themes.emerging} is becoming prominent in your journey`,
          icon: themes.icon || "✨",
        });
      }
    }

    // Usage pattern insights
    if (usage?.currentCount && usage?.limit) {
      const usagePercent = (usage.currentCount / usage.limit) * 100;

      if (usagePercent >= 80) {
        insights.push({
          type: "usage",
          title: "Active Reflection Journey",
          message: `You've used ${usage.currentCount} of ${usage.limit} reflections this month`,
          icon: "📊",
        });
      }
    }

    return insights;
  }

  /**
   * Compare theme evolution across reports
   * @param {Array} reports - Evolution reports
   * @returns {Object} - Theme comparison
   */
  compareThemeEvolution(reports) {
    if (reports.length < 2) return {};

    const latest = reports[0]?.themes || [];
    const previous = reports[1]?.themes || [];

    // Find new themes
    const emerging = latest.find((theme) => !previous.includes(theme));

    return {
      emerging,
      icon: emerging ? "🌟" : null,
    };
  }

  /**
   * Generate evolution report
   * @param {string} tone - Tone for report generation
   * @returns {Promise<Object>} - Generated report
   */
  async generateEvolutionReport(tone = "fusion") {
    try {
      const response = await apiClient.post(API_ENDPOINTS.EVOLUTION, {
        action: "generate-report",
        tone,
      });

      if (!response.success) {
        throw new Error(
          response.error || "Failed to generate evolution report"
        );
      }

      return response.report;
    } catch (error) {
      console.error("Evolution report generation error:", error);
      throw error;
    }
  }

  /**
   * Get default usage data
   * @returns {Object} - Default usage structure
   */
  getDefaultUsage() {
    return {
      currentCount: 0,
      limit: 1,
      tier: "free",
      canReflect: true,
      totalReflections: 0,
      percentUsed: 0,
    };
  }

  /**
   * Get default evolution data
   * @returns {Object} - Default evolution structure
   */
  getDefaultEvolution() {
    return {
      eligible: false,
      progress: {
        current: 0,
        threshold: 4,
        needed: 4,
        percentage: 0,
      },
      themes: [],
      canGenerateNext: false,
      upgradeRequired: true,
      tier: "free",
    };
  }

  /**
   * Format time ago string
   * @param {string} date - Date string
   * @returns {string} - Time ago string
   */
  formatTimeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return then.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: diffDays > 365 ? "numeric" : undefined,
    });
  }

  /**
   * Format reflection for dashboard display
   * @param {Object} reflection - Raw reflection data
   * @returns {Object} - Formatted reflection
   */
  formatReflection(reflection) {
    return {
      ...reflection,
      timeAgo: this.formatTimeAgo(reflection.created_at),
      preview:
        reflection.dream?.substring(0, 80) +
        (reflection.dream?.length > 80 ? "..." : ""),
      toneName: this.formatToneName(reflection.tone),
    };
  }

  /**
   * Format tone name for display
   * @param {string} tone - Tone identifier
   * @returns {string} - Formatted tone name
   */
  formatToneName(tone) {
    const toneNames = {
      gentle: "Gentle",
      intense: "Intense",
      fusion: "Fusion",
    };
    return toneNames[tone] || "Fusion";
  }
}

// Create and export singleton instance
export const dashboardService = new DashboardService();

// Export class for testing
export default DashboardService;
