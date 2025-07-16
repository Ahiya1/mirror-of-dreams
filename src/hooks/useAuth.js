// hooks/useAuth.js - Authentication hook (FIXED)

import { useState, useEffect, useCallback } from "react";
import { authService } from "../services/auth.service";
import { ApiError } from "../services/api";
import { RESPONSE_MESSAGES } from "../utils/constants";

/**
 * Authentication hook that manages user state and auth operations
 * @returns {Object} - Auth state and methods
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    console.log("🔍 useAuth: Initializing authentication");
    setIsLoading(true);
    setError(null);

    try {
      // Check URL parameters for special modes first
      const urlParams = new URLSearchParams(window.location.search);
      const specialUser = authService.handleUrlAuthentication(urlParams);

      if (specialUser) {
        console.log(
          "✅ useAuth: Special user authenticated",
          specialUser.email
        );
        setUser(specialUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Check for existing token
      if (!authService.isAuthenticated()) {
        console.log("🔍 useAuth: No token found, user not authenticated");
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      console.log("🔍 useAuth: Token found, verifying...");

      // Verify existing token
      const userData = await authService.verifyToken();
      console.log(
        "✅ useAuth: Token verified, user authenticated",
        userData.email
      );
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.warn("❌ useAuth: Auth initialization failed:", error.message);
      authService.clearSession();
      setUser(null);
      setIsAuthenticated(false);

      if (error instanceof ApiError && error.isAuthError()) {
        setError(RESPONSE_MESSAGES.AUTH_REQUIRED);
      }
    } finally {
      setIsLoading(false);
      console.log("🔍 useAuth: Auth initialization complete");
    }
  }, []);

  /**
   * Sign in user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} - Sign in result
   */
  const signin = useCallback(async (credentials) => {
    console.log("🔍 useAuth: Starting signin");
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.signin(credentials);

      if (response.success && response.user) {
        console.log("✅ useAuth: Signin successful", response.user.email);
        setUser(response.user);
        setIsAuthenticated(true);
      }

      return response;
    } catch (error) {
      console.error("❌ useAuth: Signin failed:", error.message);
      const errorMessage =
        error instanceof ApiError ? error.getUserMessage() : "Sign in failed";

      setError(errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign up new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} - Sign up result
   */
  const signup = useCallback(async (userData) => {
    console.log("🔍 useAuth: Starting signup");
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.signup(userData);

      if (response.success && response.user) {
        console.log("✅ useAuth: Signup successful", response.user.email);
        setUser(response.user);
        setIsAuthenticated(true);
      }

      return response;
    } catch (error) {
      console.error("❌ useAuth: Signup failed:", error.message);
      const errorMessage =
        error instanceof ApiError ? error.getUserMessage() : "Sign up failed";

      setError(errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign out user
   * @returns {Promise<void>}
   */
  const signout = useCallback(async () => {
    console.log("🔍 useAuth: Starting signout");
    setIsLoading(true);

    try {
      await authService.signout();
    } catch (error) {
      console.warn("Sign out API call failed:", error);
      // Continue with local cleanup even if API fails
    } finally {
      // Always clear local state
      console.log("✅ useAuth: Signout complete");
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Updated user data
   */
  const updateProfile = useCallback(
    async (updates) => {
      if (!isAuthenticated) {
        throw new Error(RESPONSE_MESSAGES.AUTH_REQUIRED);
      }

      try {
        const updatedUser = await authService.updateProfile(updates);
        setUser((prevUser) => ({ ...prevUser, ...updatedUser }));
        return updatedUser;
      } catch (error) {
        if (error instanceof ApiError && error.isAuthError()) {
          await signout();
        }
        throw error;
      }
    },
    [isAuthenticated, signout]
  );

  /**
   * Change user password
   * @param {Object} passwordData - Current and new password
   * @returns {Promise<Object>} - Change password result
   */
  const changePassword = useCallback(
    async (passwordData) => {
      if (!isAuthenticated) {
        throw new Error(RESPONSE_MESSAGES.AUTH_REQUIRED);
      }

      try {
        const response = await authService.changePassword(passwordData);
        return response;
      } catch (error) {
        if (error instanceof ApiError && error.isAuthError()) {
          await signout();
        }
        throw error;
      }
    },
    [isAuthenticated, signout]
  );

  /**
   * Delete user account
   * @param {string} password - Password confirmation
   * @returns {Promise<Object>} - Delete result
   */
  const deleteAccount = useCallback(
    async (password) => {
      if (!isAuthenticated) {
        throw new Error(RESPONSE_MESSAGES.AUTH_REQUIRED);
      }

      try {
        const response = await authService.deleteAccount(password);

        if (response.success) {
          setUser(null);
          setIsAuthenticated(false);
        }

        return response;
      } catch (error) {
        if (error instanceof ApiError && error.isAuthError()) {
          await signout();
        }
        throw error;
      }
    },
    [isAuthenticated, signout]
  );

  /**
   * Refresh user data
   * @returns {Promise<Object|null>} - Current user data
   */
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.warn("User refresh failed:", error);

      if (error instanceof ApiError && error.isAuthError()) {
        await signout();
      }

      return null;
    }
  }, [isAuthenticated, signout]);

  /**
   * Check if user has specific permissions
   * @param {string} permission - Permission to check
   * @returns {boolean} - Whether user has permission
   */
  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;

      switch (permission) {
        case "creator":
          return user.isCreator || false;
        case "admin":
          return user.isAdmin || false;
        case "premium":
          return user.tier === "premium" || user.isCreator || false;
        case "essential":
          return (
            ["essential", "premium"].includes(user.tier) ||
            user.isCreator ||
            false
          );
        default:
          return false;
      }
    },
    [user]
  );

  /**
   * Get user's current tier information
   * @returns {Object} - Tier information
   */
  const getTierInfo = useCallback(() => {
    if (!user) {
      return {
        tier: "free",
        isSubscribed: false,
        canUpgrade: true,
        displayName: "Free",
      };
    }

    const isSubscribed = user.tier !== "free";
    const canUpgrade = user.tier !== "premium" && !user.isCreator;

    return {
      tier: user.tier,
      isSubscribed,
      canUpgrade,
      displayName: user.tier.charAt(0).toUpperCase() + user.tier.slice(1),
      isCreator: user.isCreator || false,
      isPremium: user.tier === "premium" || user.isCreator || false,
    };
  }, [user]);

  /**
   * Redirect to authentication page
   * @param {string} returnTo - URL to return to after auth
   */
  const redirectToAuth = useCallback((returnTo = null) => {
    const currentPath =
      returnTo || window.location.pathname + window.location.search;
    const redirectUrl = authService.getAuthRedirectUrl(currentPath);
    console.log("🔍 useAuth: Redirecting to auth:", redirectUrl);
    window.location.href = redirectUrl;
  }, []);

  /**
   * Clear any authentication errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    console.log("🔍 useAuth: Component mounted, initializing auth");
    initializeAuth();
  }, [initializeAuth]);

  // Set up token refresh schedule
  useEffect(() => {
    if (isAuthenticated && !user?.testMode && !user?.isCreator) {
      console.log("🔍 useAuth: Setting up token refresh");
      const cleanup = authService.scheduleTokenRefresh();
      return cleanup;
    }
  }, [isAuthenticated, user?.testMode, user?.isCreator]);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 useAuth: State update", {
        isAuthenticated,
        userEmail: user?.email,
        isLoading,
        error,
      });
    }
  }, [isAuthenticated, user, isLoading, error]);

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    error,

    // Actions
    signin,
    signup,
    signout,
    updateProfile,
    changePassword,
    deleteAccount,
    refreshUser,
    clearError,
    redirectToAuth,

    // Utilities
    hasPermission,
    getTierInfo,
    initializeAuth,
  };
};
