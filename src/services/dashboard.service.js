// src/services/dashboard.service.js - Complete dashboard API service with enhanced functionality

import { apiClient } from "./api";
import { API_ENDPOINTS } from "../utils/constants";
import { THEME_ICONS } from "../utils/dashboardConstants";

class DashboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive dashboard data with parallel API calls and error handling
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete dashboard data
   */
  async getDashboardData(userId) {
    try {
      console.log("🚀 Loading dashboard data for user:", userId);

      // Execute parallel API calls for better performance
      const [
        usageResult,
        eligibilityResult,
        recentReportsResult,
        recentReflectionsResult,
        userStatsResult,
      ] = await Promise.allSettled([
        this.getUsageData(),
        this.getEvolutionEligibility(),
        this.getRecentEvolutionReports(3),
        this.getRecentReflections(4),
        this.getUserStats(),
      ]);

      // Extract data with fallbacks
      const usage =
        usageResult.status === "fulfilled"
          ? usageResult.value
          : this.getDefaultUsage();

      const eligibility =
        eligibilityResult.status === "fulfilled"
          ? eligibilityResult.value
          : this.getDefaultEvolution();

      const recentReports =
        recentReportsResult.status === "fulfilled"
          ? recentReportsResult.value
          : [];

      const reflections =
        recentReflectionsResult.status === "fulfilled"
          ? recentReflectionsResult.value
          : [];

      const userStats =
        userStatsResult.status === "fulfilled" ? userStatsResult.value : {};

      // Process and format data
      const dashboardData = {
        usage: this.enhanceUsageData(usage, userStats),
        evolution: this.formatEvolutionData(eligibility, recentReports),
        reflections: this.processReflections(reflections),
        insights: this.generateDashboardInsights(
          usage,
          eligibility,
          recentReports,
          reflections
        ),
        performance: this.getPerformanceMetrics(),
        timestamp: Date.now(),
      };

      console.log("✅ Dashboard data loaded successfully");
      return dashboardData;
    } catch (error) {
      console.error("❌ Dashboard data error:", error);
      throw this.handleServiceError(error, "getDashboardData");
    }
  }

  /**
   * Get usage data from reflections API with enhanced metrics
   * @returns {Promise<Object>} - Enhanced usage information
   */
  async getUsageData() {
    try {
      const cacheKey = "usage_data";
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await apiClient.post(API_ENDPOINTS.REFLECTIONS, {
        action: "check-usage",
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to get usage data");
      }

      const result = response.usage;
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Usage data error:", error);
      return this.getDefaultUsage();
    }
  }

  /**
   * Get evolution eligibility with enhanced data
   * @returns {Promise<Object>} - Evolution eligibility and progress
   */
  async getEvolutionEligibility() {
    try {
      const cacheKey = "evolution_eligibility";
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await apiClient.get(API_ENDPOINTS.EVOLUTION, {
        action: "check-eligibility",
      });

      if (!response.success) {
        throw new Error(
          response.error || "Failed to get evolution eligibility"
        );
      }

      const result = response;
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Evolution eligibility error:", error);
      return this.getDefaultEvolution();
    }
  }

  /**
   * Get recent evolution reports with enhanced formatting
   * @param {number} limit - Number of reports to fetch
   * @returns {Promise<Array>} - Recent evolution reports
   */
  async getRecentEvolutionReports(limit = 3) {
    try {
      const cacheKey = `evolution_reports_${limit}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await apiClient.get(API_ENDPOINTS.EVOLUTION, {
        action: "get-reports",
        limit,
      });

      if (!response.success) {
        return [];
      }

      const result = (response.reports || []).map(this.formatEvolutionReport);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Recent evolution reports error:", error);
      return [];
    }
  }

  /**
   * Get recent reflections with enhanced formatting
   * @param {number} limit - Number of reflections to fetch
   * @returns {Promise<Array>} - Recent reflections
   */
  async getRecentReflections(limit = 4) {
    try {
      const cacheKey = `recent_reflections_${limit}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await apiClient.get(API_ENDPOINTS.REFLECTIONS, {
        action: "get-history",
        limit,
      });

      if (!response.success) {
        return [];
      }

      const result = (response.reflections || []).map(
        this.formatReflection.bind(this)
      );
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Recent reflections error:", error);
      return [];
    }
  }

  /**
   * Get user statistics and metrics
   * @returns {Promise<Object>} - User statistics
   */
  async getUserStats() {
    try {
      const cacheKey = "user_stats";
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // This would be a separate API endpoint in a real implementation
      // For now, we'll return empty stats
      const result = {
        joinDate: null,
        lastActiveDate: null,
        averageReflectionLength: 0,
        favoriteTone: null,
        totalWords: 0,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("User stats error:", error);
      return {};
    }
  }

  /**
   * Enhance usage data with computed properties
   * @param {Object} usage - Raw usage data
   * @param {Object} userStats - User statistics
   * @returns {Object} - Enhanced usage data
   */
  enhanceUsageData(usage, userStats = {}) {
    const enhanced = {
      ...usage,
      percentUsed: this.calculateUsagePercent(usage),
      status: this.getUsageStatus(usage),
      trend: this.calculateUsageTrend(usage, userStats),
      timeRemaining: this.calculateTimeRemaining(usage),
    };

    return enhanced;
  }

  /**
   * Calculate usage percentage
   * @param {Object} usage - Usage data
   * @returns {number} - Usage percentage
   */
  calculateUsagePercent(usage) {
    if (!usage || usage.limit === "unlimited") return 0;
    const current = usage.currentCount || 0;
    const limit = usage.limit || 1;
    return Math.min((current / limit) * 100, 100);
  }

  /**
   * Get usage status based on current usage
   * @param {Object} usage - Usage data
   * @returns {string} - Usage status
   */
  getUsageStatus(usage) {
    if (!usage) return "unknown";
    if (usage.limit === "unlimited") return "unlimited";

    const percent = this.calculateUsagePercent(usage);
    if (percent === 0) return "fresh";
    if (percent < 50) return "active";
    if (percent < 80) return "moderate";
    if (percent < 100) return "approaching";
    return "complete";
  }

  /**
   * Calculate usage trend (would require historical data)
   * @param {Object} usage - Current usage data
   * @param {Object} userStats - User statistics
   * @returns {string} - Trend direction
   */
  calculateUsageTrend(usage, userStats) {
    // This would calculate trend based on historical data
    // For now, return neutral
    return "stable";
  }

  /**
   * Calculate time remaining in current period
   * @param {Object} usage - Usage data
   * @returns {Object} - Time remaining info
   */
  calculateTimeRemaining(usage) {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const msRemaining = endOfMonth - now;
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
      days: daysRemaining,
      hours: Math.ceil(msRemaining / (1000 * 60 * 60)),
      percentage: (now.getDate() / endOfMonth.getDate()) * 100,
    };
  }

  /**
   * Format evolution data for dashboard display
   * @param {Object} eligibility - Evolution eligibility data
   * @param {Array} reports - Recent reports
   * @returns {Object} - Formatted evolution data
   */
  formatEvolutionData(eligibility, reports = []) {
    const themes = this.extractLatestThemes(reports);
    const progress = this.calculateEvolutionProgress(eligibility);

    return {
      eligible: eligibility.eligible || false,
      progress,
      themes,
      canGenerateNext: eligibility.eligible && !eligibility.upgradeRequired,
      upgradeRequired: eligibility.upgradeRequired || false,
      tier: eligibility.tier || "free",
      nextMilestone: this.calculateNextMilestone(progress),
      recentReports: reports.slice(0, 3),
    };
  }

  /**
   * Calculate evolution progress with enhanced metrics
   * @param {Object} eligibility - Evolution eligibility data
   * @returns {Object} - Progress information
   */
  calculateEvolutionProgress(eligibility) {
    const current = eligibility.currentReflections || 0;
    const threshold = eligibility.threshold || 4;
    const needed = Math.max(0, eligibility.needed || threshold - current);

    return {
      current,
      threshold,
      needed,
      percentage:
        threshold > 0 ? Math.min((current / threshold) * 100, 100) : 0,
      isComplete: current >= threshold,
      efficiency: this.calculateProgressEfficiency(current, threshold),
    };
  }

  /**
   * Calculate progress efficiency
   * @param {number} current - Current progress
   * @param {number} threshold - Target threshold
   * @returns {string} - Efficiency rating
   */
  calculateProgressEfficiency(current, threshold) {
    if (threshold === 0) return "unknown";
    const percentage = (current / threshold) * 100;

    if (percentage >= 100) return "complete";
    if (percentage >= 75) return "excellent";
    if (percentage >= 50) return "good";
    if (percentage >= 25) return "moderate";
    return "beginning";
  }

  /**
   * Calculate next milestone
   * @param {Object} progress - Progress data
   * @returns {Object} - Next milestone info
   */
  calculateNextMilestone(progress) {
    const milestones = [1, 5, 10, 25, 50, 100, 250, 500];
    const current = progress.current || 0;

    const nextMilestone = milestones.find((milestone) => milestone > current);

    if (!nextMilestone) {
      return null;
    }

    return {
      target: nextMilestone,
      remaining: nextMilestone - current,
      percentage: (current / nextMilestone) * 100,
    };
  }

  /**
   * Extract themes from recent reports with enhanced formatting
   * @param {Array} reports - Recent evolution reports
   * @returns {Array} - Formatted themes
   */
  extractLatestThemes(reports) {
    if (!reports?.length) return [];

    // Get themes from most recent report
    const latestReport = reports[0];
    const latestThemes = latestReport?.themes || [];

    return latestThemes.map((theme) => ({
      name: theme,
      icon: THEME_ICONS[theme] || "✨",
      displayName: theme,
      frequency: this.calculateThemeFrequency(theme, reports),
      isNew: this.isNewTheme(theme, reports),
    }));
  }

  /**
   * Calculate theme frequency across reports
   * @param {string} theme - Theme name
   * @param {Array} reports - Evolution reports
   * @returns {number} - Frequency count
   */
  calculateThemeFrequency(theme, reports) {
    return reports.reduce((count, report) => {
      return count + (report.themes?.includes(theme) ? 1 : 0);
    }, 0);
  }

  /**
   * Check if theme is new (appears only in latest report)
   * @param {string} theme - Theme name
   * @param {Array} reports - Evolution reports
   * @returns {boolean} - Whether theme is new
   */
  isNewTheme(theme, reports) {
    if (reports.length <= 1) return false;

    const appearsInLatest = reports[0]?.themes?.includes(theme);
    const appearsInPrevious = reports
      .slice(1)
      .some((report) => report.themes?.includes(theme));

    return appearsInLatest && !appearsInPrevious;
  }

  /**
   * Process reflections with enhanced formatting
   * @param {Array} reflections - Raw reflections
   * @returns {Array} - Processed reflections
   */
  processReflections(reflections) {
    return reflections.map(this.formatReflection.bind(this));
  }

  /**
   * Generate personalized dashboard insights
   * @param {Object} usage - Usage data
   * @param {Object} eligibility - Evolution eligibility
   * @param {Array} reports - Recent reports
   * @param {Array} reflections - Recent reflections
   * @returns {Array} - Dashboard insights
   */
  generateDashboardInsights(usage, eligibility, reports, reflections) {
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
        priority: "high",
      });
    } else if (eligibility?.needed === 0 && eligibility?.eligible) {
      insights.push({
        type: "ready",
        title: "Evolution Report Ready",
        message: "You can now generate your consciousness evolution report",
        icon: "🌟",
        action: "Generate Report",
        actionType: "generate-evolution",
        priority: "high",
      });
    }

    // Theme evolution insights
    if (reports?.length >= 2) {
      const themeInsight = this.generateThemeInsight(reports);
      if (themeInsight) {
        insights.push(themeInsight);
      }
    }

    // Usage pattern insights
    if (usage?.currentCount && usage?.limit && usage.limit !== "unlimited") {
      const usageInsight = this.generateUsageInsight(usage);
      if (usageInsight) {
        insights.push(usageInsight);
      }
    }

    // Reflection consistency insights
    if (reflections?.length > 0) {
      const consistencyInsight = this.generateConsistencyInsight(reflections);
      if (consistencyInsight) {
        insights.push(consistencyInsight);
      }
    }

    // Milestone insights
    const milestoneInsight = this.generateMilestoneInsight(usage, reports);
    if (milestoneInsight) {
      insights.push(milestoneInsight);
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1)
      );
    });
  }

  /**
   * Generate theme evolution insight
   * @param {Array} reports - Evolution reports
   * @returns {Object|null} - Theme insight
   */
  generateThemeInsight(reports) {
    const latest = reports[0]?.themes || [];
    const previous = reports[1]?.themes || [];

    // Find new themes
    const newThemes = latest.filter((theme) => !previous.includes(theme));

    if (newThemes.length > 0) {
      const themeName = newThemes[0];
      const themeIcon = THEME_ICONS[themeName] || "✨";

      return {
        type: "discovery",
        title: "New Theme Emerging",
        message: `${themeName} is becoming prominent in your journey`,
        icon: themeIcon,
        priority: "medium",
      };
    }

    return null;
  }

  /**
   * Generate usage pattern insight
   * @param {Object} usage - Usage data
   * @returns {Object|null} - Usage insight
   */
  generateUsageInsight(usage) {
    const usagePercent = this.calculateUsagePercent(usage);

    if (usagePercent >= 80) {
      return {
        type: "usage",
        title: "Active Reflection Journey",
        message: `You've used ${usage.currentCount} of ${usage.limit} reflections this month`,
        icon: "📊",
        priority: "medium",
      };
    }

    return null;
  }

  /**
   * Generate consistency insight
   * @param {Array} reflections - Recent reflections
   * @returns {Object|null} - Consistency insight
   */
  generateConsistencyInsight(reflections) {
    // Calculate days between reflections
    const dates = reflections
      .map((r) => new Date(r.created_at))
      .sort((a, b) => b - a);

    if (dates.length >= 2) {
      const daysBetween = Math.floor(
        (dates[0] - dates[1]) / (1000 * 60 * 60 * 24)
      );

      if (daysBetween <= 1) {
        return {
          type: "consistency",
          title: "Consistent Practice",
          message:
            "Your regular reflection practice is building powerful momentum",
          icon: "🔥",
          priority: "medium",
        };
      }
    }

    return null;
  }

  /**
   * Generate milestone insight
   * @param {Object} usage - Usage data
   * @param {Array} reports - Evolution reports
   * @returns {Object|null} - Milestone insight
   */
  generateMilestoneInsight(usage, reports) {
    const totalReflections = usage?.totalReflections || 0;
    const milestones = [1, 5, 10, 25, 50, 100];

    if (milestones.includes(totalReflections)) {
      return {
        type: "milestone",
        title: "Milestone Achieved! 🎉",
        message: `You've completed ${totalReflections} reflection${
          totalReflections === 1 ? "" : "s"
        }!`,
        icon: "🎯",
        priority: "high",
      };
    }

    return null;
  }

  /**
   * Generate evolution report
   * @param {string} tone - Tone for report generation
   * @returns {Promise<Object>} - Generated report
   */
  async generateEvolutionReport(tone = "fusion") {
    try {
      console.log("🦋 Generating evolution report with tone:", tone);

      const response = await apiClient.post(API_ENDPOINTS.EVOLUTION, {
        action: "generate-report",
        tone,
      });

      if (!response.success) {
        throw new Error(
          response.error || "Failed to generate evolution report"
        );
      }

      console.log("✅ Evolution report generated successfully");

      // Clear relevant caches
      this.clearCache();

      return response.report;
    } catch (error) {
      console.error("❌ Evolution report generation error:", error);
      throw this.handleServiceError(error, "generateEvolutionReport");
    }
  }

  /**
   * Format evolution report for display
   * @param {Object} report - Raw report data
   * @returns {Object} - Formatted report
   */
  formatEvolutionReport(report) {
    return {
      ...report,
      formattedDate: this.formatTimeAgo(report.created_at),
      themeCount: report.themes?.length || 0,
      wordCount: this.estimateWordCount(report.content),
    };
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
      preview: this.generatePreview(reflection),
      toneName: this.formatToneName(reflection.tone),
      wordCount: this.estimateWordCount(reflection.dream),
      readingTime: this.calculateReadingTime(reflection.dream),
    };
  }

  /**
   * Generate preview text for reflection
   * @param {Object} reflection - Reflection data
   * @returns {string} - Preview text
   */
  generatePreview(reflection) {
    const text = reflection.dream || reflection.content || "";
    if (!text) return "Your reflection content...";

    const maxLength = 80;
    const cleaned = text.replace(/\n+/g, " ").trim();

    return cleaned.length > maxLength
      ? cleaned.substring(0, maxLength) + "..."
      : cleaned;
  }

  /**
   * Calculate reading time for text
   * @param {string} text - Text content
   * @returns {number} - Reading time in minutes
   */
  calculateReadingTime(text) {
    if (!text) return 0;
    const wordsPerMinute = 200;
    const wordCount = this.estimateWordCount(text);
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Estimate word count
   * @param {string} text - Text content
   * @returns {number} - Estimated word count
   */
  estimateWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  /**
   * Format time ago string with enhanced precision
   * @param {string} date - Date string
   * @returns {string} - Time ago string
   */
  formatTimeAgo(date) {
    if (!date) return "Unknown";

    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffSecs < 30) return "just now";
    if (diffMins < 1) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;

    return then.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: diffDays > 365 ? "numeric" : undefined,
    });
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

  /**
   * Get performance metrics
   * @returns {Object} - Performance data
   */
  getPerformanceMetrics() {
    return {
      cacheHitRate: this.calculateCacheHitRate(),
      averageResponseTime: this.getAverageResponseTime(),
      lastRefresh: Date.now(),
    };
  }

  /**
   * Calculate cache hit rate
   * @returns {number} - Cache hit rate percentage
   */
  calculateCacheHitRate() {
    // This would track actual cache hits vs misses
    return 0;
  }

  /**
   * Get average response time
   * @returns {number} - Average response time in ms
   */
  getAverageResponseTime() {
    // This would track actual response times
    return 0;
  }

  /**
   * Handle service errors with enhanced context
   * @param {Error} error - Original error
   * @param {string} operation - Operation that failed
   * @returns {Error} - Enhanced error
   */
  handleServiceError(error, operation) {
    const enhancedError = new Error(
      `Dashboard service error in ${operation}: ${error.message}`
    );
    enhancedError.originalError = error;
    enhancedError.operation = operation;
    enhancedError.timestamp = Date.now();

    return enhancedError;
  }

  /**
   * Cache management methods
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get default usage data structure
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
      status: "fresh",
    };
  }

  /**
   * Get default evolution data structure
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
        isComplete: false,
      },
      themes: [],
      canGenerateNext: false,
      upgradeRequired: true,
      tier: "free",
    };
  }
}

// Create and export singleton instance
export const dashboardService = new DashboardService();

// Export class for testing
export default DashboardService;
