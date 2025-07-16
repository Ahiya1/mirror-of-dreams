// services/auth.service.js - Authentication API service (CLEANED)

import { apiClient } from "./api";
import { storageService } from "./storage.service";
import { API_ENDPOINTS } from "../utils/constants";

class AuthService {
  /**
   * Sign up new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Auth response with user and token
   */
  async signup(userData) {
    const { email, password, name, tier = "free", language = "en" } = userData;

    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "signup",
      email,
      password,
      name,
      tier,
      language,
    });

    if (response.success && response.token) {
      storageService.setAuthToken(response.token);
    }

    return response;
  }

  /**
   * Sign in existing user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} - Auth response with user and token
   */
  async signin(credentials) {
    const { email, password } = credentials;

    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "signin",
      email,
      password,
    });

    if (response.success && response.token) {
      storageService.setAuthToken(response.token);
    }

    return response;
  }

  /**
   * Sign out current user
   * @returns {Promise<Object>} - Sign out response
   */
  async signout() {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH, {
        action: "signout",
      });

      // Clear local storage regardless of API response
      this.clearSession();

      return response;
    } catch (error) {
      // Clear session even if API call fails
      this.clearSession();
      throw error;
    }
  }

  /**
   * Verify JWT token and get user data
   * @returns {Promise<Object>} - User data if token is valid
   */
  async verifyToken() {
    const token = storageService.getAuthToken();

    if (!token) {
      throw new Error("No token found");
    }

    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "verify-token",
    });

    if (!response.success || !response.user) {
      this.clearSession();
      throw new Error("Token verification failed");
    }

    return response.user;
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} - Current user data
   */
  async getCurrentUser() {
    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "get-user",
    });

    if (!response.success || !response.user) {
      throw new Error("Failed to get user data");
    }

    return response.user;
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Updated user data
   */
  async updateProfile(updates) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "update-profile",
      ...updates,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to update profile");
    }

    return response.user;
  }

  /**
   * Change user password
   * @param {Object} passwordData - Current and new password
   * @returns {Promise<Object>} - Change password response
   */
  async changePassword(passwordData) {
    const { currentPassword, newPassword } = passwordData;

    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "change-password",
      currentPassword,
      newPassword,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to change password");
    }

    return response;
  }

  /**
   * Delete user account
   * @param {string} password - Password confirmation
   * @returns {Promise<Object>} - Delete account response
   */
  async deleteAccount(password) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "delete-account",
      password,
    });

    if (response.success) {
      this.clearSession();
    }

    return response;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - Whether user has valid token
   */
  isAuthenticated() {
    return !!storageService.getAuthToken();
  }

  /**
   * Get stored auth token
   * @returns {string|null} - JWT token or null
   */
  getToken() {
    return storageService.getAuthToken();
  }

  /**
   * Clear user session data
   */
  clearSession() {
    storageService.removeAuthToken();
    storageService.clearAllFormStates();
  }

  /**
   * Get authentication redirect URL
   * @param {string} returnTo - URL to return to after auth
   * @returns {string} - Auth redirect URL
   */
  getAuthRedirectUrl(returnTo = null) {
    const baseUrl = "/auth/signin";

    if (returnTo) {
      const encodedReturnTo = encodeURIComponent(returnTo);
      return `${baseUrl}?returnTo=${encodedReturnTo}`;
    }

    return baseUrl;
  }

  /**
   * Handle authentication errors
   * @param {Error} error - Authentication error
   * @returns {Object} - Formatted error response
   */
  handleAuthError(error) {
    this.clearSession();

    const errorResponse = {
      success: false,
      requiresAuth: true,
      message: "Authentication required",
    };

    if (error.status === 401) {
      errorResponse.message = "Please sign in to continue";
    } else if (error.status === 403) {
      errorResponse.message = "Access denied";
    } else if (error.status === 429) {
      errorResponse.message = "Too many requests. Please wait and try again.";
    } else if (error.isNetworkError()) {
      errorResponse.message = "Network error. Please check your connection.";
    }

    return errorResponse;
  }

  /**
   * Refresh authentication state
   * @returns {Promise<Object|null>} - Current user or null
   */
  async refreshAuth() {
    try {
      if (!this.isAuthenticated()) {
        return null;
      }

      const user = await this.verifyToken();
      return user;
    } catch (error) {
      this.clearSession();
      return null;
    }
  }

  /**
   * Schedule token refresh
   * @param {number} interval - Refresh interval in milliseconds
   * @returns {Function} - Cleanup function
   */
  scheduleTokenRefresh(interval = 15 * 60 * 1000) {
    // 15 minutes
    const refreshInterval = setInterval(async () => {
      try {
        await this.refreshAuth();
      } catch (error) {
        console.warn("Token refresh failed:", error);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(refreshInterval);
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Export class for testing
export default AuthService;
