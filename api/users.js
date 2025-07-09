// api/users.js - Mirror of Truth User Management API
// Handles user profile operations, usage statistics, and account management

const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { action } = req.method === "GET" ? req.query : req.body;

    switch (action) {
      case "get-profile":
        return await handleGetProfile(req, res);
      case "update-profile":
        return await handleUpdateProfile(req, res);
      case "get-usage":
        return await handleGetUsage(req, res);
      case "get-dashboard-data":
        return await handleGetDashboardData(req, res);
      case "upgrade-tier":
        return await handleUpgradeTier(req, res);
      case "delete-account":
        return await handleDeleteAccount(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
    }
  } catch (error) {
    console.error("Users API Error:", error);
    return res.status(500).json({
      success: false,
      error: "User service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user profile with comprehensive data
async function handleGetProfile(req, res) {
  try {
    const user = await authenticateRequest(req);

    const { data: userProfile, error } = await supabase
      .from("users")
      .select(
        `
        id, email, name, tier, subscription_status, subscription_period,
        subscription_started_at, subscription_expires_at,
        reflection_count_this_month, total_reflections,
        is_creator, is_admin, language, timezone,
        last_reflection_at, created_at, last_sign_in_at
      `
      )
      .eq("id", user.id)
      .single();

    if (error || !userProfile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
      });
    }

    // Calculate additional metrics
    const profileData = {
      ...userProfile,
      // Time since joining
      memberSince: userProfile.created_at,
      daysSinceJoining: Math.floor(
        (new Date() - new Date(userProfile.created_at)) / (1000 * 60 * 60 * 24)
      ),
      // Subscription info
      isSubscribed: userProfile.tier !== "free",
      subscriptionActive: userProfile.subscription_status === "active",
      // Usage patterns
      averageReflectionsPerMonth: calculateAverageReflections(userProfile),
      lastActiveDate:
        userProfile.last_reflection_at || userProfile.last_sign_in_at,
    };

    return res.json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Update user profile information
async function handleUpdateProfile(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { name, language, timezone, preferences } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (language !== undefined) updates.language = language;
    if (timezone !== undefined) updates.timezone = timezone;

    // Validate updates
    if (updates.name && updates.name.length < 1) {
      return res.status(400).json({
        success: false,
        error: "Name cannot be empty",
      });
    }

    if (updates.language && !["en", "he"].includes(updates.language)) {
      return res.status(400).json({
        success: false,
        error: "Invalid language selection",
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid fields to update",
      });
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("id, email, name, language, timezone")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to update profile",
      });
    }

    console.log(`📝 Profile updated: ${updatedUser.email}`);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedUser,
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Get detailed usage statistics
async function handleGetUsage(req, res) {
  try {
    const user = await authenticateRequest(req);

    // Get current month usage
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const { data: currentUsage, error: usageError } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_year", currentMonthYear)
      .single();

    // Get tier limits
    const tierLimits = {
      free: 1,
      essential: 5,
      premium: 10,
    };

    const limit =
      user.is_creator || user.is_admin
        ? "unlimited"
        : tierLimits[user.tier] || 1;
    const currentCount =
      currentUsage?.reflection_count || user.reflection_count_this_month || 0;
    const canReflect = user.is_creator || user.is_admin || currentCount < limit;
    const percentUsed =
      limit === "unlimited" ? 0 : Math.round((currentCount / limit) * 100);

    // Get historical usage (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startMonth = sixMonthsAgo.toISOString().slice(0, 7);

    const { data: historicalUsage, error: historyError } = await supabase
      .from("usage_tracking")
      .select("month_year, reflection_count, tier_at_time")
      .eq("user_id", user.id)
      .gte("month_year", startMonth)
      .order("month_year", { ascending: true });

    const usageData = {
      current: {
        count: currentCount,
        limit: limit,
        canReflect: canReflect,
        percentUsed: percentUsed,
        tier: user.tier,
        monthYear: currentMonthYear,
      },
      total: {
        reflections: user.total_reflections || 0,
        memberSince: user.created_at,
        averagePerMonth: calculateAverageReflections(user),
      },
      history: historicalUsage || [],
      limits: tierLimits,
    };

    return res.json({
      success: true,
      usage: usageData,
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Get comprehensive dashboard data in one request
async function handleGetDashboardData(req, res) {
  try {
    const user = await authenticateRequest(req);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
      });
    }

    // Get recent reflections (last 5)
    const { data: recentReflections, error: reflectionsError } = await supabase
      .from("reflections")
      .select(
        `
        id, created_at, title, tone, is_premium, dream,
        word_count, estimated_read_time
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get usage statistics
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    const { data: currentUsage } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_year", currentMonthYear)
      .single();

    // Get evolution reports count
    const { count: evolutionReportsCount } = await supabase
      .from("evolution_reports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Calculate usage data
    const tierLimits = { free: 1, essential: 5, premium: 10 };
    const limit =
      user.is_creator || user.is_admin
        ? "unlimited"
        : tierLimits[profile.tier] || 1;
    const currentCount =
      currentUsage?.reflection_count ||
      profile.reflection_count_this_month ||
      0;

    // Format recent reflections with time ago
    const formattedReflections = (recentReflections || []).map(
      (reflection) => ({
        ...reflection,
        timeAgo: getTimeAgo(reflection.created_at),
        preview: reflection.dream
          ? reflection.dream.substring(0, 120)
          : "Reflection content...",
      })
    );

    const dashboardData = {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        tier: profile.tier,
        subscriptionStatus: profile.subscription_status,
        isCreator: profile.is_creator,
        isAdmin: profile.is_admin,
        language: profile.language,
        totalReflections: profile.total_reflections,
        memberSince: profile.created_at,
        lastActive: profile.last_reflection_at || profile.last_sign_in_at,
      },
      usage: {
        currentCount: currentCount,
        limit: limit,
        canReflect: user.is_creator || user.is_admin || currentCount < limit,
        percentUsed:
          limit === "unlimited" ? 0 : Math.round((currentCount / limit) * 100),
        tier: profile.tier,
      },
      reflections: {
        recent: formattedReflections,
        total: profile.total_reflections || 0,
      },
      evolution: {
        reportsGenerated: evolutionReportsCount || 0,
        canGenerateReport: checkEvolutionEligibility(profile),
        nextThreshold: getNextEvolutionThreshold(profile),
      },
      insights: generateUserInsights(profile, formattedReflections),
    };

    return res.json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Handle tier upgrades (placeholder for subscription system)
async function handleUpgradeTier(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { targetTier, subscriptionId } = req.body;

    if (!["essential", "premium"].includes(targetTier)) {
      return res.status(400).json({
        success: false,
        error: "Invalid target tier",
      });
    }

    if (user.tier === targetTier) {
      return res.status(400).json({
        success: false,
        error: "User already has this tier",
      });
    }

    // TODO: Integrate with Stripe subscription system
    // For now, this is a placeholder that would be called after successful payment

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        tier: targetTier,
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
        subscription_id: subscriptionId,
      })
      .eq("id", user.id)
      .select("id, email, tier, subscription_status")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to upgrade tier",
      });
    }

    console.log(`🚀 Tier upgraded: ${updatedUser.email} → ${targetTier}`);

    return res.json({
      success: true,
      message: "Tier upgraded successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// Delete user account
async function handleDeleteAccount(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Password confirmation required",
      });
    }

    // Get user to verify password
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("password_hash, email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify password
    const bcrypt = require("bcryptjs");
    const isValidPassword = await bcrypt.compare(
      confirmPassword,
      userData.password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid password",
      });
    }

    // Delete user (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete account",
      });
    }

    console.log(`🗑️ Account deleted: ${userData.email}`);

    return res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }
    throw error;
  }
}

// ╭─ UTILITY FUNCTIONS ───────────────────────────────────────╮

function calculateAverageReflections(user) {
  const joinDate = new Date(user.created_at);
  const now = new Date();
  const monthsSinceJoining = Math.max(
    1,
    (now.getFullYear() - joinDate.getFullYear()) * 12 +
      (now.getMonth() - joinDate.getMonth())
  );

  return (
    Math.round(((user.total_reflections || 0) / monthsSinceJoining) * 10) / 10
  );
}

function checkEvolutionEligibility(user) {
  if (user.tier === "free") return false;

  const thresholds = { essential: 4, premium: 6 };
  const requiredReflections = thresholds[user.tier] || 4;

  return (user.total_reflections || 0) >= requiredReflections;
}

function getNextEvolutionThreshold(user) {
  if (user.tier === "free") return { tier: "essential", reflections: 4 };

  const thresholds = { essential: 4, premium: 6 };
  const currentThreshold = thresholds[user.tier] || 4;
  const totalReflections = user.total_reflections || 0;

  if (totalReflections >= currentThreshold) {
    return { ready: true, reflections: currentThreshold };
  }

  return {
    tier: user.tier,
    reflections: currentThreshold,
    needed: currentThreshold - totalReflections,
  };
}

function generateUserInsights(profile, recentReflections) {
  const insights = [];

  // Reflection frequency insight
  const avgReflections = calculateAverageReflections(profile);
  if (avgReflections > 2) {
    insights.push({
      type: "frequency",
      message: "You're building a strong reflection practice",
      icon: "🌱",
    });
  }

  // Recent activity insight
  if (recentReflections.length > 0) {
    const daysSinceLastReflection = Math.floor(
      (new Date() - new Date(recentReflections[0].created_at)) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastReflection === 0) {
      insights.push({
        type: "activity",
        message: "Fresh insights from your recent reflection",
        icon: "✨",
      });
    } else if (daysSinceLastReflection > 30) {
      insights.push({
        type: "encouragement",
        message: "Your mirror awaits your return",
        icon: "🪞",
      });
    }
  }

  // Tier-specific insights
  if (profile.tier === "free" && profile.total_reflections >= 3) {
    insights.push({
      type: "upgrade",
      message: "Ready to unlock evolution reports?",
      icon: "🦋",
    });
  }

  // Milestone insights
  const milestones = [5, 10, 25, 50, 100];
  const nextMilestone = milestones.find(
    (m) => m > (profile.total_reflections || 0)
  );

  if (nextMilestone) {
    const needed = nextMilestone - (profile.total_reflections || 0);
    if (needed <= 2) {
      insights.push({
        type: "milestone",
        message: `${needed} more reflection${
          needed === 1 ? "" : "s"
        } to reach ${nextMilestone}!`,
        icon: "🎯",
      });
    }
  }

  return insights;
}

function getTimeAgo(date) {
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
