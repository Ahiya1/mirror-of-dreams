// components/portal/hooks/usePortalState.ts - Portal state management (TypeScript)

"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  name: string;
  email: string;
  tier: string;
  isCreator?: boolean;
  isAdmin?: boolean;
}

interface Usage {
  currentCount: number;
  limit: number | "unlimited";
  canReflect: boolean;
}

interface UserState {
  authenticated: boolean;
  user?: User;
  usage?: Usage;
}

interface ReflectConfig {
  text: string;
  href: string;
}

interface SecondaryButton {
  href: string;
  className: string;
  icon: string;
  text: string;
}

interface Taglines {
  main: string;
  sub: string;
}

interface UsageConfig {
  text: string;
  percentage: number;
  className: string;
}

interface UserMenuConfig {
  name: string;
  avatar: string;
  showEvolution: boolean;
}

/**
 * Portal state management hook
 * Handles user authentication, usage data, and portal interface state
 */
export const usePortalState = () => {
  const [userState, setUserState] = useState<UserState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  /**
   * Detect user authentication state and usage data
   */
  const detectUserState = useCallback(async () => {
    // For now, assume not authenticated (will be replaced with actual auth check)
    setUserState({ authenticated: false });
    setIsLoading(false);

    // TODO: Replace with actual authentication check
    // const token = localStorage.getItem("authToken");
    // if (!token) {
    //   setUserState({ authenticated: false });
    //   setIsLoading(false);
    //   return;
    // }
    // ... fetch user data and usage
  }, []);

  /**
   * Handle sign out
   */
  const handleSignOut = useCallback(async () => {
    try {
      // TODO: Call actual signout API
      // await fetch("/api/auth/signout", { method: "POST" });
    } catch (error) {
      console.error("Sign out error:", error);
    }

    // Clear auth data
    localStorage.removeItem("authToken");
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
  const getReflectButtonConfig = useCallback((): ReflectConfig => {
    if (!userState?.authenticated) {
      return {
        text: "Reflect Me",
        href: "/auth/signup",
      };
    }

    const user = userState.user!;
    const usage = userState.usage;

    if (user.isCreator || user.isAdmin) {
      return {
        text: "✨ Creator Space",
        href: "/reflection?mode=creator",
      };
    }

    if (usage && usage.canReflect) {
      return {
        text: "Continue Journey",
        href: "/reflection",
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
  const getSecondaryButtonsConfig = useCallback((): SecondaryButton[] => {
    if (!userState?.authenticated) {
      return [
        {
          href: "/auth/signup?tier=free",
          className: "start-free-button",
          icon: "🌱",
          text: "Start Free Forever",
        },
        {
          href: "/subscription",
          className: "explore-button",
          icon: "💎",
          text: "Explore Plans",
        },
      ];
    }

    const user = userState.user!;
    const usage = userState.usage;

    const buttons: SecondaryButton[] = [
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
      // Show reflections button if user can still reflect or has unlimited
      buttons.push({
        href: "/reflections",
        className: "reflections-button",
        icon: "📚",
        text: "View Journey",
      });
    }

    return buttons;
  }, [userState]);

  /**
   * Get taglines configuration
   */
  const getTaglinesConfig = useCallback((): Taglines => {
    if (!userState?.authenticated) {
      return {
        main: "Your dreams hold the mirror<br />to who you're becoming.",
        sub: "<strong>Start completely free.</strong> 90-second guided setup.",
      };
    }

    const user = userState.user!;
    const usage = userState.usage;

    if (user.isCreator || user.isAdmin) {
      return {
        main: "Dream without limits.<br/>Reflect without bounds.",
        sub: "<strong>Unlimited access</strong> to craft your vision.",
      };
    }

    if (usage && usage.canReflect) {
      return {
        main: "Which dream calls to you<br/>in this moment?",
        sub: "<strong>Your next reflection awaits.</strong> Continue dreaming.",
      };
    }

    if (usage && !usage.canReflect) {
      return {
        main: "Your dreams deserve<br/>deeper exploration.",
        sub: "<strong>Upgrade to reflect</strong> again this month.",
      };
    }

    return {
      main: "See how your dreams<br/>have evolved.",
        sub: "<strong>Your reflections</strong> tell the story.",
    };
  }, [userState]);

  /**
   * Get usage display configuration
   */
  const getUsageConfig = useCallback((): UsageConfig | null => {
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

    const percentage = Math.min((currentCount / (limit as number)) * 100, 100);
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
  const getUserMenuConfig = useCallback((): UserMenuConfig | null => {
    if (!userState?.authenticated || !userState.user) {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showUserDropdown &&
        !(event.target as HTMLElement).closest(".user-menu")
      ) {
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
