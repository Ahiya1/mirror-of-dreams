// services/auth.service.js - Authentication API service (FIXED)

import { apiClient } from "./api";
import { storageService } from "./storage.service";
import { API_ENDPOINTS } from "../utils/constants";

class AuthService {
  /**
   * Handle URL-based authentication (creator mode, test mode, etc.)
   * @param {URLSearchParams} urlParams - URL search parameters
   * @returns {Object|null} - Special user object or null
   */
  handleUrlAuthentication(urlParams) {
    console.log("🔍 AuthService: Checking URL authentication");

    // Creator mode authentication
    if (urlParams.get("mode") === "creator") {
      console.log("🔍 AuthService: Creator mode detected");
      return {
        id: "creator",
        name: "Creator",
        email: "creator@mirroroftruth.xyz",
        tier: "premium",
        isCreator: true,
        isAdmin: true,
        testMode: false,
        token: "creator_mode_token",
      };
    }

    // Test mode authentication
    const testTier = urlParams.get("test");
    if (testTier) {
      console.log(`🔍 AuthService: Test mode detected: ${testTier}`);
      return {
        id: `test_${testTier}`,
        name: `Test User (${testTier})`,
        email: `test-${testTier}@mirroroftruth.xyz`,
        tier: testTier,
        isCreator: false,
        isAdmin: false,
        testMode: true,
        token: `test_${testTier}_token`,
      };
    }

    return null;
  }

  /**
   * Sign up new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Auth response with user and token
   */
  async signup(userData) {
    console.log("🔍 AuthService: Starting signup for", userData.email);

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
      console.log("✅ AuthService: Signup successful, storing token");
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
    console.log("🔍 AuthService: Starting signin for", credentials.email);

    const { email, password } = credentials;

    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "signin",
      email,
      password,
    });

    if (response.success && response.token) {
      console.log("✅ AuthService: Signin successful, storing token");
      storageService.setAuthToken(response.token);
    }

    return response;
  }

  /**
   * Sign out current user
   * @returns {Promise<Object>} - Sign out response
   */
  async signout() {
    console.log("🔍 AuthService: Signing out user");

    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH, {
        action: "signout",
      });

      // Clear local storage regardless of API response
      this.clearSession();
      console.log("✅ AuthService: Signout complete, session cleared");

      return response;
    } catch (error) {
      // Clear session even if API call fails
      console.log(
        "⚠️ AuthService: Signout API failed, clearing session anyway"
      );
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

    console.log(
      "🔍 AuthService: Verifying token",
      token ? "exists" : "missing"
    );

    if (!token) {
      throw new Error("No token found");
    }

    const response = await apiClient.post(API_ENDPOINTS.AUTH, {
      action: "verify-token",
    });

    if (!response.success || !response.user) {
      console.log("❌ AuthService: Token verification failed");
      this.clearSession();
      throw new Error("Token verification failed");
    }

    console.log("✅ AuthService: Token verified for", response.user.email);
    return response.user;
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} - Current user data
   */
  async getCurrentUser() {
    console.log("🔍 AuthService: Getting current user");

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
    const token = storageService.getAuthToken();
    const isAuth = !!token;
    console.log("🔍 AuthService: isAuthenticated check:", isAuth);
    return isAuth;
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
    console.log("🔍 AuthService: Clearing session data");
    storageService.removeAuthToken();
    storageService.clearAllFormStates();

    // Also clear legacy storage
    try {
      localStorage.removeItem("mirrorVerifiedUser");
      localStorage.removeItem("mirror_auth_token");
    } catch (error) {
      console.warn("Failed to clear legacy storage:", error);
    }
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
    console.log("❌ AuthService: Handling auth error:", error.message);
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
    } else if (error.isNetworkError && error.isNetworkError()) {
      errorResponse.message = "Network error. Please check your connection.";
    }

    return errorResponse;
  }

  /**
   * Refresh authentication state
   * @returns {Promise<Object|null>} - Current user or null
   */
  async refreshAuth() {
    console.log("🔍 AuthService: Refreshing auth state");

    try {
      if (!this.isAuthenticated()) {
        return null;
      }

      const user = await this.verifyToken();
      console.log("✅ AuthService: Auth refresh successful");
      return user;
    } catch (error) {
      console.log("❌ AuthService: Auth refresh failed:", error.message);
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
    console.log("🔍 AuthService: Scheduling token refresh");

    const refreshInterval = setInterval(async () => {
      try {
        await this.refreshAuth();
      } catch (error) {
        console.warn("Token refresh failed:", error);
      }
    }, interval);

    // Return cleanup function
    return () => {
      console.log("🔍 AuthService: Cleaning up token refresh");
      clearInterval(refreshInterval);
    };
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Export class for testing
export default AuthService;
