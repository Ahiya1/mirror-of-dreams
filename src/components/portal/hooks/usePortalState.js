// src/components/portal/hooks/usePortalState.js - Portal state management (FIXED)

import { useState, useEffect, useCallback } from "react";
import { storageService } from "../../../services/storage.service"; // ADD THIS IMPORT

/**
 * Portal state management hook
 * Handles user authentication, usage data, and portal interface state
 */
export const usePortalState = () => {
  const [userState, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  /**
   * Detect user authentication state and usage data
   */
  const detectUserState = useCallback(async () => {
    // FIX: Use storageService instead of direct localStorage access
    const token = storageService.getAuthToken();

    if (!token) {
      setUserState({ authenticated: false });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "verify-token" }),
      });

      const result = await response.json();

      if (result.success && result.user) {
        // Get usage data
        const usageResponse = await fetch("/api/reflections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "check-usage" }),
        });

        const usageData = await usageResponse.json();

        setUserState({
          authenticated: true,
          user: result.user,
          usage: usageData.success ? usageData.usage : null,
        });

        console.log("✅ User authenticated:", result.user.email);
      } else {
        // FIX: Use storageService for cleanup
        storageService.removeAuthToken();
        localStorage.removeItem("mirrorVerifiedUser"); // Keep legacy cleanup
        setUserState({ authenticated: false });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUserState({ authenticated: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle sign out
   */
  const handleSignOut = useCallback(async () => {
    try {
      // FIX: Use storageService to get token
      const token = storageService.getAuthToken();
      if (token) {
        await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "signout" }),
        });
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }

    // FIX: Use storageService for cleanup
    storageService.removeAuthToken();
    localStorage.removeItem("mirrorVerifiedUser"); // Keep legacy cleanup
    window.location.reload();
  }, []);

  /**
   * Toggle user dropdown
   */
  const toggleUserDropdown = useCallback(() => {
    setShowUserDropdown((prev) => !prev);
  }, []);

  /**
   * Close user dropdown
   */
  const closeUserDropdown = useCallback(() => {
    setShowUserDropdown(false);
  }, []);

  /**
   * Get reflect button configuration
   */
  const getReflectButtonConfig = useCallback(() => {
    if (!userState?.authenticated) {
      return {
        text: "Reflect Me",
        href: "/auth/register",
      };
    }

    const user = userState.user;
    const usage = userState.usage;

    if (user.isCreator || user.isAdmin) {
      return {
        text: "✨ Creator Space",
        href: "/mirror/questionnaire?mode=creator",
      };
    }

    if (usage && usage.canReflect) {
      return {
        text: "Continue Journey",
        href: "/mirror/questionnaire",
      };
    }

    if (usage && !usage.canReflect) {
      return {
        text: "Upgrade for More",
        href: "/subscription",
      };
    }

    return {
      text: "View Reflections",
      href: "/dashboard",
    };
  }, [userState]);

  /**
   * Get secondary buttons configuration
   */
  const getSecondaryButtonsConfig = useCallback(() => {
    if (!userState?.authenticated) {
      return [
        {
          href: "/auth/register?tier=free",
          className: "start-free-button",
          icon: "🌱",
          text: "Start Free Forever",
        },
        {
          href: "/gifting",
          className: "gift-button",
          icon: "🎁",
          text: "Gift a Reflection",
        },
      ];
    }

    const user = userState.user;
    const usage = userState.usage;

    const buttons = [
      {
        href: "/dashboard",
        className: "dashboard-button",
        icon: "🏠",
        text: "Dashboard",
      },
    ];

    // Show upgrade button if user is out of limits (and not creator/admin)
    if (usage && !usage.canReflect && !user.isCreator && !user.isAdmin) {
      buttons.push({
        href: "/subscription",
        className: "upgrade-button",
        icon: "💎",
        text: "Upgrade Now",
      });
    } else {
      // Show gift button if user can still reflect or has unlimited
      buttons.push({
        href: "/gifting",
        className: "gift-button",
        icon: "🎁",
        text: "Gift a Reflection",
      });
    }

    return buttons;
  }, [userState]);

  /**
   * Get taglines configuration
   */
  const getTaglinesConfig = useCallback(() => {
    if (!userState?.authenticated) {
      return {
        main: "Stop asking what to do.<br />See who you already are.",
        sub: "<strong>Start completely free.</strong> Your truth awaits.",
      };
    }

    const user = userState.user;
    const usage = userState.usage;

    if (user.isCreator || user.isAdmin) {
      return {
        main: "Sacred creator space<br/>awaits your truth.",
        sub: "<strong>Unlimited reflections</strong> for the mirror maker.",
      };
    }

    if (usage && usage.canReflect) {
      return {
        main: "Ready for your next<br/>moment of truth?",
        sub: "<strong>Your reflection awaits.</strong> Continue your journey.",
      };
    }

    if (usage && !usage.canReflect) {
      return {
        main: "Your journey continues<br/>beyond limits.",
        sub: "<strong>Upgrade to reflect</strong> again this month.",
      };
    }

    return {
      main: "See how far<br/>you've traveled.",
      sub: "<strong>Your reflections</strong> hold your evolution.",
    };
  }, [userState]);

  /**
   * Get usage display configuration
   */
  const getUsageConfig = useCallback(() => {
    if (!userState?.authenticated || !userState.usage) {
      return null;
    }

    const usage = userState.usage;
    const currentCount = usage.currentCount || 0;
    const limit = usage.limit;

    if (limit === "unlimited") {
      return {
        text: "Unlimited reflections this month",
        percentage: 100,
        className: "",
      };
    }

    const percentage = Math.min((currentCount / limit) * 100, 100);
    let className = "";

    if (percentage >= 90) {
      className = "danger";
    } else if (percentage >= 70) {
      className = "warning";
    }

    return {
      text: `${currentCount} of ${limit} reflections used`,
      percentage,
      className,
    };
  }, [userState]);

  /**
   * Get user menu configuration
   */
  const getUserMenuConfig = useCallback(() => {
    if (!userState?.authenticated) {
      return null;
    }

    const user = userState.user;
    const firstName = user.name.split(" ")[0];

    let avatar = "👤";
    if (user.isCreator || user.isAdmin) {
      avatar = "🌟";
    } else if (user.tier === "premium") {
      avatar = "💎";
    } else if (user.tier === "essential") {
      avatar = "✨";
    }

    return {
      name: firstName,
      avatar,
      showEvolution: user.tier !== "free",
    };
  }, [userState]);

  // Initialize on mount
  useEffect(() => {
    detectUserState();
  }, [detectUserState]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest(".user-menu")) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown]);

  return {
    userState,
    isLoading,
    showUserDropdown,
    handleSignOut,
    toggleUserDropdown,
    closeUserDropdown,
    getReflectButtonConfig,
    getSecondaryButtonsConfig,
    getTaglinesConfig,
    getUsageConfig,
    getUserMenuConfig,
    refreshState: detectUserState,
  };
};
