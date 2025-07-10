// api/auth.js - Mirror of Truth Authentication System with Google OAuth
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JWT secret for session tokens
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-here";

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      case "signup-with-subscription":
        return await handleSignupWithSubscription(req, res);
      case "google-signup":
        return await handleGoogleSignup(req, res);
      case "google-signup-with-subscription":
        return await handleGoogleSignupWithSubscription(req, res);
      case "signin":
        return await handleSignin(req, res);
      case "google-signin":
        return await handleGoogleSignin(req, res);
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
      case "link-google":
        return await handleLinkGoogle(req, res);
      case "unlink-google":
        return await handleUnlinkGoogle(req, res);
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

// Regular signup
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
      .select("id, google_id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      if (existingUser.google_id) {
        return res.status(400).json({
          success: false,
          error:
            "An account with this email exists. Please sign in with Google.",
          requiresGoogleSignin: true,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "User already exists with this email",
        });
      }
    }

    const user = await createUserAccount({
      email: email.toLowerCase(),
      password,
      name,
      tier,
      language,
    });

    const token = generateJWT(user);

    console.log(`✅ New user created: ${user.email} (${user.tier})`);

    return res.json({
      success: true,
      message: "Account created successfully",
      user: formatUserResponse(user),
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

// Signup with subscription
async function handleSignupWithSubscription(req, res) {
  const {
    email,
    password,
    name,
    tier,
    subscriptionId,
    language = "en",
  } = req.body;

  if (!email || !password || !name || !tier || !subscriptionId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields for subscription signup",
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

    const user = await createUserAccount({
      email: email.toLowerCase(),
      password,
      name,
      tier,
      language,
      subscriptionId,
      subscriptionStatus: "active",
    });

    const token = generateJWT(user);

    console.log(`✅ New subscriber created: ${user.email} (${user.tier})`);

    return res.json({
      success: true,
      message: "Account created and subscription activated",
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error("Subscription signup error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create account with subscription",
    });
  }
}

// Google signup
async function handleGoogleSignup(req, res) {
  const { googleToken, userInfo, tier = "free", language = "en" } = req.body;

  if (!googleToken || !userInfo) {
    return res.status(400).json({
      success: false,
      error: "Google authentication data required",
    });
  }

  try {
    // Verify Google token
    const googleUser = await verifyGoogleToken(googleToken);
    if (!googleUser || googleUser.email !== userInfo.email) {
      throw new Error("Invalid Google token");
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, google_id, password_hash")
      .eq("email", userInfo.email.toLowerCase())
      .single();

    if (existingUser) {
      if (!existingUser.google_id) {
        // User exists with email/password, offer to link
        return res.status(400).json({
          success: false,
          error:
            "An account with this email already exists. Please sign in with your password first, then link your Google account in settings.",
          requiresPasswordSignin: true,
        });
      } else {
        // User already has Google linked, just sign them in
        const token = generateJWT(existingUser);
        return res.json({
          success: true,
          message: "Signed in successfully",
          user: formatUserResponse(existingUser),
          token,
        });
      }
    }

    // Create new user with Google
    const user = await createUserAccount({
      email: userInfo.email.toLowerCase(),
      name: userInfo.name || userInfo.given_name || "User",
      tier,
      language,
      googleId: googleUser.sub,
      avatarUrl: userInfo.picture,
      emailVerified: googleUser.email_verified,
    });

    const token = generateJWT(user);

    console.log(`✅ New Google user created: ${user.email} (${user.tier})`);

    return res.json({
      success: true,
      message: "Account created successfully with Google",
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error("Google signup error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create account with Google",
    });
  }
}

// Google signup with subscription
async function handleGoogleSignupWithSubscription(req, res) {
  const {
    googleToken,
    userInfo,
    tier,
    subscriptionId,
    language = "en",
  } = req.body;

  if (!googleToken || !userInfo || !tier || !subscriptionId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields for Google subscription signup",
    });
  }

  try {
    // Verify Google token
    const googleUser = await verifyGoogleToken(googleToken);
    if (!googleUser || googleUser.email !== userInfo.email) {
      throw new Error("Invalid Google token");
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", userInfo.email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists with this email",
      });
    }

    // Create new user with Google and subscription
    const user = await createUserAccount({
      email: userInfo.email.toLowerCase(),
      name: userInfo.name || userInfo.given_name || "User",
      tier,
      language,
      googleId: googleUser.sub,
      avatarUrl: userInfo.picture,
      emailVerified: true,
      subscriptionId,
      subscriptionStatus: "active",
    });

    const token = generateJWT(user);

    console.log(
      `✅ New Google subscriber created: ${user.email} (${user.tier})`
    );

    return res.json({
      success: true,
      message: "Account created and subscription activated with Google",
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error("Google subscription signup error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create account with Google subscription",
    });
  }
}

// Regular signin
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

    // Check if user signed up with Google only
    if (!user.password_hash && user.google_id) {
      return res.status(401).json({
        success: false,
        error: "This account uses Google Sign-In. Please sign in with Google.",
        requiresGoogleSignin: true,
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Update last sign in and handle monthly usage reset
    await updateUserSignin(user);

    const token = generateJWT(user);

    console.log(`✅ User signed in: ${user.email} (${user.tier})`);

    return res.json({
      success: true,
      message: "Signed in successfully",
      user: formatUserResponse({
        ...user,
        reflection_count_this_month: shouldResetUsage(user)
          ? 0
          : user.reflection_count_this_month,
      }),
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

// Google signin
async function handleGoogleSignin(req, res) {
  const { googleToken, userInfo } = req.body;

  if (!googleToken) {
    return res.status(400).json({
      success: false,
      error: "Google token required",
    });
  }

  try {
    // Verify Google token
    const googleUser = await verifyGoogleToken(googleToken);
    if (!googleUser) {
      throw new Error("Invalid Google token");
    }

    // Find user by email or Google ID
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(
        `email.eq.${googleUser.email.toLowerCase()},google_id.eq.${
          googleUser.sub
        }`
      )
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "No account found. Please sign up first.",
        requiresSignup: true,
      });
    }

    // If user exists but doesn't have Google linked, link it now
    if (!user.google_id) {
      await supabase
        .from("users")
        .update({
          google_id: googleUser.sub,
          avatar_url: userInfo?.picture || user.avatar_url,
          email_verified: true,
        })
        .eq("id", user.id);

      user.google_id = googleUser.sub;
      user.avatar_url = userInfo?.picture || user.avatar_url;
      user.email_verified = true;
    }

    // Update last sign in and handle monthly usage reset
    await updateUserSignin(user);

    const token = generateJWT(user);

    console.log(`✅ Google user signed in: ${user.email} (${user.tier})`);

    return res.json({
      success: true,
      message: "Signed in successfully with Google",
      user: formatUserResponse({
        ...user,
        reflection_count_this_month: shouldResetUsage(user)
          ? 0
          : user.reflection_count_this_month,
      }),
      token,
    });
  } catch (error) {
    console.error("Google signin error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sign in with Google",
    });
  }
}

// Sign out
async function handleSignout(req, res) {
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
        `
        id, email, name, tier, subscription_status, subscription_period,
        reflection_count_this_month, total_reflections, 
        is_creator, is_admin, language, current_month_year,
        google_id, avatar_url, email_verified
      `
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
    if (shouldResetUsage(user)) {
      await resetMonthlyUsage(user);
      user.reflection_count_this_month = 0;
    }

    return res.json({
      success: true,
      user: formatUserResponse(user),
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
  try {
    const user = await authenticateRequest(req);

    const { data: fullUser, error } = await supabase
      .from("users")
      .select(
        `
        id, email, name, tier, subscription_status, subscription_period,
        subscription_started_at, subscription_expires_at, paypal_subscription_id,
        reflection_count_this_month, total_reflections,
        is_creator, is_admin, language, timezone,
        last_reflection_at, created_at,
        google_id, avatar_url, email_verified
      `
      )
      .eq("id", user.id)
      .single();

    if (error || !fullUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.json({
      success: true,
      user: fullUser,
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

// Update user profile
async function handleUpdateProfile(req, res) {
  try {
    const user = await authenticateRequest(req);
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

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("id, email, name, language, timezone, avatar_url")
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
    const { password } = req.body;

    // If user has password, verify it
    if (user.password_hash) {
      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Password confirmation required",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid password",
        });
      }
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

    console.log(`🗑️ Account deleted: ${user.email}`);

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

// Link Google account to existing account
async function handleLinkGoogle(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { googleToken, userInfo } = req.body;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        error: "Google token required",
      });
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(googleToken);
    if (!googleUser) {
      throw new Error("Invalid Google token");
    }

    // Check if Google account is already linked to another user
    const { data: existingGoogleUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("google_id", googleUser.sub)
      .neq("id", user.id)
      .single();

    if (existingGoogleUser) {
      return res.status(400).json({
        success: false,
        error: "This Google account is already linked to another user",
      });
    }

    // Link Google account
    const { error } = await supabase
      .from("users")
      .update({
        google_id: googleUser.sub,
        avatar_url: userInfo?.picture || user.avatar_url,
        email_verified: true,
      })
      .eq("id", user.id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to link Google account",
      });
    }

    console.log(`🔗 Google account linked: ${user.email}`);

    return res.json({
      success: true,
      message: "Google account linked successfully",
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

// Unlink Google account
async function handleUnlinkGoogle(req, res) {
  try {
    const user = await authenticateRequest(req);

    // Make sure user has a password before unlinking Google
    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        error: "Please set a password before unlinking your Google account",
        requiresPasswordSetup: true,
      });
    }

    // Unlink Google account
    const { error } = await supabase
      .from("users")
      .update({
        google_id: null,
      })
      .eq("id", user.id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to unlink Google account",
      });
    }

    console.log(`🔗 Google account unlinked: ${user.email}`);

    return res.json({
      success: true,
      message: "Google account unlinked successfully",
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

// Helper functions

async function verifyGoogleToken(token) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    return ticket.getPayload();
  } catch (error) {
    console.error("Google token verification error:", error);
    return null;
  }
}

async function createUserAccount(userData) {
  const {
    email,
    password,
    name,
    tier,
    language,
    googleId,
    avatarUrl,
    emailVerified = false,
    subscriptionId,
    subscriptionStatus = tier === "free" ? "active" : "trialing",
  } = userData;

  const userRecord = {
    email,
    name,
    tier,
    language,
    subscription_status: subscriptionStatus,
    subscription_started_at: new Date().toISOString(),
    current_month_year: new Date().toISOString().slice(0, 7),
    last_sign_in_at: new Date().toISOString(),
    email_verified: emailVerified,
  };

  // Add password hash if password provided
  if (password) {
    userRecord.password_hash = await bcrypt.hash(password, 12);
  }

  // Add Google-specific fields
  if (googleId) {
    userRecord.google_id = googleId;
  }

  if (avatarUrl) {
    userRecord.avatar_url = avatarUrl;
  }

  // Add subscription fields
  if (subscriptionId) {
    userRecord.paypal_subscription_id = subscriptionId;
  }

  const { data: user, error } = await supabase
    .from("users")
    .insert(userRecord)
    .select("*")
    .single();

  if (error) {
    console.error("User creation error:", error);
    throw new Error("Failed to create user account");
  }

  return user;
}

function generateJWT(user) {
  return jwt.sign(
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
}

function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    subscriptionStatus: user.subscription_status,
    reflectionCountThisMonth: user.reflection_count_this_month || 0,
    totalReflections: user.total_reflections || 0,
    isCreator: user.is_creator || false,
    isAdmin: user.is_admin || false,
    language: user.language || "en",
    hasGoogle: !!user.google_id,
    avatarUrl: user.avatar_url,
    emailVerified: user.email_verified || false,
    createdAt: user.created_at,
  };
}

function shouldResetUsage(user) {
  const currentMonthYear = new Date().toISOString().slice(0, 7);
  return user.current_month_year !== currentMonthYear;
}

async function resetMonthlyUsage(user) {
  const currentMonthYear = new Date().toISOString().slice(0, 7);

  await supabase
    .from("users")
    .update({
      reflection_count_this_month: 0,
      current_month_year: currentMonthYear,
    })
    .eq("id", user.id);
}

async function updateUserSignin(user) {
  const updates = {
    last_sign_in_at: new Date().toISOString(),
  };

  // Reset monthly usage if needed
  if (shouldResetUsage(user)) {
    updates.reflection_count_this_month = 0;
    updates.current_month_year = new Date().toISOString().slice(0, 7);
  }

  await supabase.from("users").update(updates).eq("id", user.id);
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
