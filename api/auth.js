// api/auth.js - Mirror of Truth Authentication System

const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JWT secret for session tokens
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-here";

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { action } = req.body;

    switch (action) {
      case "signup":
        return await handleSignup(req, res);
      case "signin":
        return await handleSignin(req, res);
      case "signout":
        return await handleSignout(req, res);
      case "verify-token":
        return await handleVerifyToken(req, res);
      case "get-user":
        return await handleGetUser(req, res);
      case "update-profile":
        return await handleUpdateProfile(req, res);
      case "delete-account":
        return await handleDeleteAccount(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
    }
  } catch (error) {
    console.error("Auth API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Sign up new user
async function handleSignup(req, res) {
  const { email, password, name, tier = "free", language = "en" } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: "Email, password, and name are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters",
    });
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists with this email",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name,
        tier: tier,
        language: language,
        subscription_status: tier === "free" ? "active" : "trialing",
        subscription_started_at: new Date().toISOString(),
        current_month_year: new Date().toISOString().slice(0, 7), // YYYY-MM
        last_sign_in_at: new Date().toISOString(),
      })
      .select(
        "id, email, name, tier, subscription_status, created_at, is_creator, is_admin"
      )
      .single();

    if (error) {
      console.error("User creation error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create user account",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        isCreator: user.is_creator,
        isAdmin: user.is_admin,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log(`✅ New user created: ${user.email} (${user.tier})`);

    return res.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        subscriptionStatus: user.subscription_status,
        isCreator: user.is_creator,
        isAdmin: user.is_admin,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create account",
    });
  }
}

// Sign in existing user
async function handleSignin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  try {
    // Get user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Update last sign in time and reset monthly usage if needed
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    const shouldResetUsage = user.current_month_year !== currentMonthYear;

    await supabase
      .from("users")
      .update({
        last_sign_in_at: new Date().toISOString(),
        ...(shouldResetUsage && {
          reflection_count_this_month: 0,
          current_month_year: currentMonthYear,
        }),
      })
      .eq("id", user.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        isCreator: user.is_creator,
        isAdmin: user.is_admin,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log(`✅ User signed in: ${user.email} (${user.tier})`);

    return res.json({
      success: true,
      message: "Signed in successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        subscriptionStatus: user.subscription_status,
        reflectionCountThisMonth: shouldResetUsage
          ? 0
          : user.reflection_count_this_month,
        totalReflections: user.total_reflections,
        isCreator: user.is_creator,
        isAdmin: user.is_admin,
        language: user.language,
      },
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sign in",
    });
  }
}

// Sign out (mainly for clearing client-side data)
async function handleSignout(req, res) {
  // With JWT, signout is mainly client-side token removal
  // But we can optionally log it server-side

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`📤 User signed out: ${decoded.email}`);
    } catch (error) {
      // Invalid token, but that's okay for signout
    }
  }

  return res.json({
    success: true,
    message: "Signed out successfully",
  });
}

// Verify JWT token
async function handleVerifyToken(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user data
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, name, tier, subscription_status, reflection_count_this_month, total_reflections, is_creator, is_admin, language, current_month_year"
      )
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if monthly usage needs reset
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    if (user.current_month_year !== currentMonthYear) {
      await supabase
        .from("users")
        .update({
          reflection_count_this_month: 0,
          current_month_year: currentMonthYear,
        })
        .eq("id", user.id);

      user.reflection_count_this_month = 0;
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        subscriptionStatus: user.subscription_status,
        reflectionCountThisMonth: user.reflection_count_this_month,
        totalReflections: user.total_reflections,
        isCreator: user.is_creator,
        isAdmin: user.is_admin,
        language: user.language,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
}

// Get user profile
async function handleGetUser(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        id, email, name, tier, subscription_status, subscription_period,
        subscription_started_at, subscription_expires_at,
        reflection_count_this_month, total_reflections,
        is_creator, is_admin, language, timezone,
        last_reflection_at, created_at
      `
      )
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid authentication",
    });
  }
}

// Update user profile
async function handleUpdateProfile(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, language, timezone } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (language) updates.language = language;
    if (timezone) updates.timezone = timezone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid fields to update",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", decoded.userId)
      .select("id, email, name, language, timezone")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to update profile",
      });
    }

    console.log(`📝 Profile updated: ${user.email}`);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid authentication",
    });
  }
}

// Delete user account
async function handleDeleteAccount(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password confirmation required",
      });
    }

    // Get user and verify password
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("password_hash, email")
      .eq("id", decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
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
      .eq("id", decoded.userId);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete account",
      });
    }

    console.log(`🗑️ Account deleted: ${user.email}`);

    return res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid authentication",
    });
  }
}

// Utility function to authenticate requests (for other APIs)
async function authenticateRequest(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error("Invalid authentication");
  }
}

// Export utility function for other APIs
module.exports.authenticateRequest = authenticateRequest;
