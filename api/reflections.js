// api/reflections.js - Mirror of Truth Reflection Management with Usage Limits
// ENHANCED: Added feedback submission handler

const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Usage limits by tier
const TIER_LIMITS = {
  free: 1,
  essential: 5,
  premium: 10,
};

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
      case "create":
        return await handleCreateReflection(req, res);
      case "get-history":
        return await handleGetHistory(req, res);
      case "get-reflection":
        return await handleGetReflection(req, res);
      case "update-reflection":
        return await handleUpdateReflection(req, res);
      case "delete-reflection":
        return await handleDeleteReflection(req, res);
      case "check-usage":
        return await handleCheckUsage(req, res);
      case "search":
        return await handleSearchReflections(req, res);
      case "submit-feedback":
        return await handleSubmitFeedback(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
    }
  } catch (error) {
    console.error("Reflections API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Reflections service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create new reflection with usage limits
async function handleCreateReflection(req, res) {
  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    const {
      dream,
      plan,
      hasDate,
      dreamDate,
      relationship,
      offering,
      aiResponse,
      tone = "fusion",
      isPremium = false,
    } = req.body;

    // Validation
    if (
      !dream ||
      !plan ||
      !hasDate ||
      !relationship ||
      !offering ||
      !aiResponse
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required reflection fields",
      });
    }

    // Check usage limits (unless creator/admin)
    if (!user.is_creator && !user.is_admin) {
      const canReflect = await checkReflectionLimit(user);
      if (!canReflect) {
        const limit = TIER_LIMITS[user.tier];
        return res.status(403).json({
          success: false,
          error: "Reflection limit reached",
          message: `You've reached your limit of ${limit} reflection${
            limit === 1 ? "" : "s"
          } this month. Upgrade to continue your journey.`,
          currentUsage: user.reflection_count_this_month,
          limit: limit,
          tier: user.tier,
        });
      }
    }

    // Generate title from dream (first 50 characters)
    const title = dream.length > 50 ? dream.substring(0, 47) + "..." : dream;

    // Calculate word count and read time
    const wordCount = aiResponse.split(/\s+/).length;
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 WPM average

    // Create reflection
    const { data: reflection, error } = await supabase
      .from("reflections")
      .insert({
        user_id: user.id,
        dream,
        plan,
        has_date: hasDate,
        dream_date: hasDate === "yes" ? dreamDate : null,
        relationship,
        offering,
        ai_response: aiResponse,
        tone,
        is_premium: isPremium,
        title,
        word_count: wordCount,
        estimated_read_time: estimatedReadTime,
      })
      .select(
        "id, created_at, title, is_premium, word_count, estimated_read_time"
      )
      .single();

    if (error) {
      console.error("Reflection creation error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to save reflection",
      });
    }

    // Update user's usage count and stats (unless creator/admin)
    if (!user.is_creator && !user.is_admin) {
      await supabase
        .from("users")
        .update({
          reflection_count_this_month: user.reflection_count_this_month + 1,
          total_reflections: user.total_reflections + 1,
          last_reflection_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // Update/create usage tracking record
      const currentMonthYear = new Date().toISOString().slice(0, 7);
      await supabase.from("usage_tracking").upsert({
        user_id: user.id,
        month_year: currentMonthYear,
        reflection_count: user.reflection_count_this_month + 1,
        tier_at_time: user.tier,
      });
    }

    console.log(
      `✨ Reflection created: ${user.email} (${
        isPremium ? "Premium" : "Essential"
      })`
    );

    return res.json({
      success: true,
      message: "Reflection saved successfully",
      reflection: {
        id: reflection.id,
        createdAt: reflection.created_at,
        title: reflection.title,
        isPremium: reflection.is_premium,
        wordCount: reflection.word_count,
        estimatedReadTime: reflection.estimated_read_time,
      },
      updatedUsage: {
        currentCount: user.reflection_count_this_month + 1,
        limit: TIER_LIMITS[user.tier],
        tier: user.tier,
      },
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

// Get user's reflection history
async function handleGetHistory(req, res) {
  try {
    const user = await authenticateRequest(req);

    const {
      page = 1,
      limit = 20,
      tone = null,
      isPremium = null,
      search = null,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    let query = supabase
      .from("reflections")
      .select(
        `
        id, created_at, updated_at, title, tone, is_premium,
        word_count, estimated_read_time, view_count, tags,
        dream, plan, has_date, dream_date, relationship, offering,
        rating, user_feedback, feedback_submitted_at
      `
      )
      .eq("user_id", user.id);

    // Apply filters
    if (tone) {
      query = query.eq("tone", tone);
    }

    if (isPremium !== null) {
      query = query.eq("is_premium", isPremium === "true");
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,dream.ilike.%${search}%,ai_response.ilike.%${search}%`
      );
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: reflections, error, count } = await query;

    if (error) {
      console.error("Get history error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve reflection history",
      });
    }

    // Format dates and add relative times
    const formattedReflections = reflections.map((reflection) => ({
      ...reflection,
      createdAt: reflection.created_at,
      updatedAt: reflection.updated_at,
      timeAgo: getTimeAgo(reflection.created_at),
      formattedDate: new Date(reflection.created_at).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ),
    }));

    return res.json({
      success: true,
      reflections: formattedReflections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
      filters: {
        tone,
        isPremium,
        search,
      },
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

// Get single reflection
async function handleGetReflection(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Reflection ID required",
      });
    }

    const { data: reflection, error } = await supabase
      .from("reflections")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !reflection) {
      return res.status(404).json({
        success: false,
        error: "Reflection not found",
      });
    }

    // Increment view count
    await supabase
      .from("reflections")
      .update({
        view_count: (reflection.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Format response
    const formattedReflection = {
      ...reflection,
      createdAt: reflection.created_at,
      updatedAt: reflection.updated_at,
      timeAgo: getTimeAgo(reflection.created_at),
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
    };

    return res.json({
      success: true,
      reflection: formattedReflection,
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

// Update reflection (title, tags)
async function handleUpdateReflection(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { id, title, tags } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Reflection ID required",
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (tags !== undefined) updates.tags = tags;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    const { data: reflection, error } = await supabase
      .from("reflections")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, title, tags, updated_at")
      .single();

    if (error || !reflection) {
      return res.status(404).json({
        success: false,
        error: "Reflection not found or update failed",
      });
    }

    console.log(`📝 Reflection updated: ${id} by ${user.email}`);

    return res.json({
      success: true,
      message: "Reflection updated successfully",
      reflection,
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

// Delete reflection
async function handleDeleteReflection(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Reflection ID required",
      });
    }

    const { error } = await supabase
      .from("reflections")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return res.status(404).json({
        success: false,
        error: "Reflection not found or delete failed",
      });
    }

    // Update user's total reflection count
    await supabase
      .from("users")
      .update({
        total_reflections: Math.max(0, user.total_reflections - 1),
      })
      .eq("id", user.id);

    console.log(`🗑️ Reflection deleted: ${id} by ${user.email}`);

    return res.json({
      success: true,
      message: "Reflection deleted successfully",
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

// Check current usage status
async function handleCheckUsage(req, res) {
  try {
    const user = await authenticateRequest(req);

    const limit = TIER_LIMITS[user.tier];
    const canReflect =
      user.is_creator ||
      user.is_admin ||
      user.reflection_count_this_month < limit;

    return res.json({
      success: true,
      usage: {
        currentCount: user.reflection_count_this_month,
        limit: user.is_creator || user.is_admin ? "unlimited" : limit,
        canReflect,
        tier: user.tier,
        totalReflections: user.total_reflections,
        percentUsed:
          user.is_creator || user.is_admin
            ? 0
            : Math.round((user.reflection_count_this_month / limit) * 100),
      },
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

// Search reflections
async function handleSearchReflections(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { query: searchQuery, limit = 10 } = req.query;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: "Search query required",
      });
    }

    const { data: reflections, error } = await supabase
      .from("reflections")
      .select("id, created_at, title, tone, is_premium, dream, rating")
      .eq("user_id", user.id)
      .or(
        `title.ilike.%${searchQuery}%,dream.ilike.%${searchQuery}%,ai_response.ilike.%${searchQuery}%`
      )
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Search failed",
      });
    }

    const formattedResults = reflections.map((reflection) => ({
      ...reflection,
      timeAgo: getTimeAgo(reflection.created_at),
      preview:
        reflection.dream.length > 100
          ? reflection.dream.substring(0, 97) + "..."
          : reflection.dream,
    }));

    return res.json({
      success: true,
      results: formattedResults,
      query: searchQuery,
      count: reflections.length,
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

// NEW: Submit feedback for a reflection
async function handleSubmitFeedback(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { reflectionId, rating, feedback } = req.body;

    // Validation
    if (!reflectionId || !rating) {
      return res.status(400).json({
        success: false,
        error: "Reflection ID and rating are required",
      });
    }

    if (rating < 1 || rating > 10) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 10",
      });
    }

    // Verify the reflection belongs to the user
    const { data: reflection, error: verifyError } = await supabase
      .from("reflections")
      .select("id")
      .eq("id", reflectionId)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !reflection) {
      return res.status(404).json({
        success: false,
        error: "Reflection not found or access denied",
      });
    }

    // Update reflection with feedback
    const { error: updateError } = await supabase
      .from("reflections")
      .update({
        rating: rating,
        user_feedback: feedback || null,
        feedback_submitted_at: new Date().toISOString(),
      })
      .eq("id", reflectionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Feedback update error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to save feedback",
      });
    }

    console.log(
      `💫 Feedback submitted: ${user.email} rated ${rating}/10 for reflection ${reflectionId}`
    );

    return res.json({
      success: true,
      message: "Feedback saved successfully",
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

// Helper function to check reflection limits
async function checkReflectionLimit(user) {
  // Creators and admins have unlimited reflections
  if (user.is_creator || user.is_admin) {
    return true;
  }

  const limit = TIER_LIMITS[user.tier];
  return user.reflection_count_this_month < limit;
}

// Helper function to calculate time ago
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
