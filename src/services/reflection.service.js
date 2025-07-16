// services/reflection.service.js - Reflection API service with fixed artifact support

import { apiClient } from "./api";
import { API_ENDPOINTS } from "../utils/constants";

class ReflectionService {
  /**
   * Create a new reflection
   * @param {Object} reflectionData - Reflection form data
   * @returns {Promise<Object>} - Reflection response
   */
  async createReflection(reflectionData) {
    const {
      dream,
      plan,
      hasDate,
      dreamDate,
      relationship,
      offering,
      userName,
      userEmail,
      language = "en",
      isAdmin = false,
      isCreator = false,
      isPremium = false,
      tone = "fusion",
    } = reflectionData;

    const response = await apiClient.post(API_ENDPOINTS.REFLECTION, {
      dream,
      plan,
      hasDate,
      dreamDate,
      relationship,
      offering,
      userName,
      userEmail,
      language,
      isAdmin,
      isCreator,
      isPremium,
      tone,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to create reflection");
    }

    return response;
  }

  /**
   * Get a specific reflection by ID
   * @param {string} reflectionId - Reflection ID
   * @returns {Promise<Object>} - Reflection data
   */
  async getReflection(reflectionId) {
    const response = await apiClient.post(API_ENDPOINTS.REFLECTIONS, {
      action: "get-reflection",
      id: reflectionId,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to get reflection");
    }

    return response.reflection;
  }

  /**
   * Get user's reflection history
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Reflections with pagination
   */
  async getReflectionHistory(options = {}) {
    const {
      page = 1,
      limit = 20,
      tone = null,
      isPremium = null,
      search = null,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    const params = {
      action: "get-history",
      page,
      limit,
      sortBy,
      sortOrder,
    };

    if (tone) params.tone = tone;
    if (isPremium !== null) params.isPremium = isPremium;
    if (search) params.search = search;

    const response = await apiClient.get(API_ENDPOINTS.REFLECTIONS, params);

    if (!response.success) {
      throw new Error(response.error || "Failed to get reflection history");
    }

    return {
      reflections: response.reflections,
      pagination: response.pagination,
      filters: response.filters,
    };
  }

  /**
   * Update a reflection
   * @param {string} reflectionId - Reflection ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated reflection
   */
  async updateReflection(reflectionId, updates) {
    const response = await apiClient.post(API_ENDPOINTS.REFLECTIONS, {
      action: "update-reflection",
      id: reflectionId,
      ...updates,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to update reflection");
    }

    return response.reflection;
  }

  /**
   * Delete a reflection
   * @param {string} reflectionId - Reflection ID
   * @returns {Promise<Object>} - Delete response
   */
  async deleteReflection(reflectionId) {
    const response = await apiClient.post(API_ENDPOINTS.REFLECTIONS, {
      action: "delete-reflection",
      id: reflectionId,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to delete reflection");
    }

    return response;
  }

  /**
   * Check current usage status
   * @returns {Promise<Object>} - Usage information
   */
  async checkUsage() {
    const response = await apiClient.get(API_ENDPOINTS.REFLECTIONS, {
      action: "check-usage",
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to check usage");
    }

    return response.usage;
  }

  /**
   * Search reflections
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} - Search results
   */
  async searchReflections(query, limit = 10) {
    const response = await apiClient.get(API_ENDPOINTS.REFLECTIONS, {
      action: "search",
      query,
      limit,
    });

    if (!response.success) {
      throw new Error(response.error || "Search failed");
    }

    return response.results;
  }

  /**
   * Submit feedback for a reflection
   * @param {string} reflectionId - Reflection ID
   * @param {number} rating - Rating from 1-10
   * @param {string} feedback - Optional feedback text
   * @returns {Promise<Object>} - Feedback response
   */
  async submitFeedback(reflectionId, rating, feedback = "") {
    const response = await apiClient.post(API_ENDPOINTS.REFLECTIONS, {
      action: "submit-feedback",
      reflectionId,
      rating,
      feedback,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to submit feedback");
    }

    return response;
  }

  /**
   * Create artifact for reflection
   * @param {string} reflectionId - Reflection ID
   * @returns {Promise<Object>} - Artifact creation response
   */
  async createArtifact(reflectionId) {
    console.log(`🎨 Creating artifact for reflection: ${reflectionId}`);

    try {
      // Use the direct artifact endpoint (not action-based)
      const response = await apiClient.requestWithTimeout(
        "/api/artifact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reflectionId }),
        },
        60000 // 60 second timeout
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to create artifact");
      }

      console.log(`✨ Artifact created successfully:`, response.artifact);
      return response.artifact;
    } catch (error) {
      console.error("🔥 Artifact creation failed:", error);
      throw error;
    }
  }

  /**
   * Check for existing artifact
   * @param {string} reflectionId - Reflection ID
   * @returns {Promise<Object|null>} - Existing artifact or null
   */
  async checkExistingArtifact(reflectionId) {
    try {
      console.log(`🔍 Checking for existing artifact: ${reflectionId}`);

      // Try the direct check endpoint first
      try {
        const response = await apiClient.get(
          `/api/artifact/check/${reflectionId}`
        );

        if (response.success && response.artifact) {
          console.log(
            `✅ Found existing artifact via direct endpoint:`,
            response.artifact
          );
          return response.artifact;
        }
      } catch (directError) {
        console.log(
          `📝 Direct endpoint check failed, trying action-based:`,
          directError.message
        );
      }

      // Fallback to action-based approach if your backend uses that pattern
      const response = await apiClient.post(API_ENDPOINTS.ARTIFACT, {
        action: "check-existing",
        reflectionId,
      });

      if (response.success && response.artifact) {
        console.log(
          `✅ Found existing artifact via action:`,
          response.artifact
        );
        return response.artifact;
      }

      console.log(`📝 No existing artifact found`);
      return null;
    } catch (error) {
      console.log(`📝 No existing artifact found:`, error.message);
      return null;
    }
  }

  /**
   * Get artifact download URL (for CORS-friendly downloads)
   * @param {string} artifactId - Artifact ID
   * @returns {Promise<string>} - Download URL
   */
  async getArtifactDownloadUrl(artifactId) {
    try {
      const response = await apiClient.get(
        `/api/artifact/${artifactId}/download`
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to get download URL");
      }

      return response.downloadUrl;
    } catch (error) {
      console.error("Failed to get artifact download URL:", error);
      throw error;
    }
  }

  /**
   * Email reflection to user
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} - Email response
   */
  async emailReflection(emailData) {
    const {
      email,
      content,
      userName = "Friend",
      language = "en",
      isPremium = false,
    } = emailData;

    const response = await apiClient.post(API_ENDPOINTS.COMMUNICATION, {
      action: "send-reflection",
      email,
      content,
      userName,
      language,
      isPremium,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to send email");
    }

    return response;
  }

  /**
   * Generate evolution report
   * @param {string} tone - Tone for the report
   * @returns {Promise<Object>} - Evolution report
   */
  async generateEvolutionReport(tone = "fusion") {
    const response = await apiClient.post(API_ENDPOINTS.EVOLUTION, {
      action: "generate-report",
      tone,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to generate evolution report");
    }

    return response.report;
  }

  /**
   * Check evolution report eligibility
   * @returns {Promise<Object>} - Eligibility information
   */
  async checkEvolutionEligibility() {
    const response = await apiClient.get(API_ENDPOINTS.EVOLUTION, {
      action: "check-eligibility",
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to check eligibility");
    }

    return response;
  }

  /**
   * Get evolution reports
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Evolution reports with pagination
   */
  async getEvolutionReports(options = {}) {
    const { page = 1, limit = 20 } = options;

    const response = await apiClient.get(API_ENDPOINTS.EVOLUTION, {
      action: "get-reports",
      page,
      limit,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to get evolution reports");
    }

    return {
      reports: response.reports,
      pagination: response.pagination,
    };
  }

  /**
   * Get specific evolution report
   * @param {string} reportId - Report ID
   * @returns {Promise<Object>} - Evolution report
   */
  async getEvolutionReport(reportId) {
    const response = await apiClient.get(API_ENDPOINTS.EVOLUTION, {
      action: "get-report",
      id: reportId,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to get evolution report");
    }

    return response.report;
  }

  /**
   * Get reflection statistics
   * @returns {Promise<Object>} - Reflection statistics
   */
  async getReflectionStats() {
    try {
      const [usage, history] = await Promise.all([
        this.checkUsage(),
        this.getReflectionHistory({ limit: 5 }),
      ]);

      return {
        usage,
        recentReflections: history.reflections,
        totalReflections: usage.totalReflections || 0,
      };
    } catch (error) {
      throw new Error("Failed to get reflection statistics");
    }
  }

  /**
   * Test API connectivity and configuration
   * @returns {Promise<Object>} - Connection status and debug info
   */
  async testConnection() {
    try {
      const response = await apiClient.get("/api/debug");
      return response;
    } catch (error) {
      console.error("API connection test failed:", error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate artifact URL accessibility
   * @param {string} url - Artifact URL to validate
   * @returns {Promise<boolean>} - Whether the URL is accessible
   */
  async validateArtifactUrl(url) {
    try {
      if (!url) return false;

      const response = await fetch(url, {
        method: "HEAD",
        mode: "cors",
        credentials: "omit",
      });

      return response.ok;
    } catch (error) {
      console.warn("Artifact URL validation failed:", error);

      // Try no-cors as fallback
      try {
        await fetch(url, {
          method: "HEAD",
          mode: "no-cors",
        });
        // If no-cors doesn't throw, the URL probably exists
        return true;
      } catch (noCorsError) {
        return false;
      }
    }
  }

  /**
   * Validate reflection data before submission
   * @param {Object} reflectionData - Reflection data to validate
   * @returns {Object} - Validation result
   */
  validateReflectionData(reflectionData) {
    const required = ["dream", "plan", "hasDate", "relationship", "offering"];
    const missing = required.filter((field) => !reflectionData[field]?.trim());

    if (missing.length > 0) {
      return {
        isValid: false,
        errors: missing.map((field) => `${field} is required`),
      };
    }

    // Check if date is required but missing
    if (reflectionData.hasDate === "yes" && !reflectionData.dreamDate) {
      return {
        isValid: false,
        errors: ["Dream date is required when you have set a date"],
      };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Format reflection for display
   * @param {Object} reflection - Raw reflection data
   * @returns {Object} - Formatted reflection
   */
  formatReflection(reflection) {
    if (!reflection) return null;

    return {
      ...reflection,
      formattedDate: new Date(reflection.created_at).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
      timeAgo: this.getTimeAgo(reflection.created_at),
      preview:
        reflection.dream?.substring(0, 150) +
        (reflection.dream?.length > 150 ? "..." : ""),
    };
  }

  /**
   * Get time ago string
   * @param {string} date - Date string
   * @returns {string} - Time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    return then.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: diffDays > 365 ? "numeric" : undefined,
    });
  }

  /**
   * Clear any cached data
   */
  clearCache() {
    // Clear any cached reflection data
    if (typeof localStorage !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("reflection_") || key.startsWith("artifact_")) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}

// Create and export singleton instance
export const reflectionService = new ReflectionService();

// Export class for testing
export default ReflectionService;
