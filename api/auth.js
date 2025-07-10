// api/auth.js - Mirror of Truth Authentication System (Fixed JSON Parsing)
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JWT secret - fail fast if missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ CRITICAL: JWT_SECRET environment variable is not set!");
  throw new Error("JWT_SECRET environment variable is required");
}

console.log("✅ JWT_SECRET is set, length:", JWT_SECRET.length);

// Helper function to parse JSON body
async function parseBody(req) {
  if (req.body) {
    // Body already parsed (form data or Vercel auto-parsing)
    return req.body;
  }

  // Manual JSON parsing for edge cases
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        if (body.trim() === "") {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    // Parse request body
    console.log(`🔍 [${requestId}] Raw body type:`, typeof req.body);
    console.log(`🔍 [${requestId}] Content-Type:`, req.headers["content-type"]);

    let body;
    try {
      body = await parseBody(req);
      console.log(`🔍 [${requestId}] Parsed body:`, body);
    } catch (parseError) {
      console.log(`❌ [${requestId}] Body parsing failed:`, parseError.message);
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        debug: { requestId, parseError: parseError.message },
      });
    }

    const { action } = body;
    console.log(
      `🔍 [${requestId}] Action value:`,
      JSON.stringify(action),
      "Type:",
      typeof action
    );

    console.log(
      `🔍 [${requestId}] Auth Request: ${req.method} ${
        action || "no-action"
      } - ${new Date().toISOString()}`
    );

    switch (action) {
      case "signup":
        return await handleSignup({ ...req, body }, res, requestId);
      case "signup-with-subscription":
        return await handleSignupWithSubscription(
          { ...req, body },
          res,
          requestId
        );
      case "signin":
        return await handleSignin({ ...req, body }, res, requestId);
      case "signout":
        return await handleSignout({ ...req, body }, res, requestId);
      case "verify-token":
        return await handleVerifyToken({ ...req, body }, res, requestId);
      case "get-user":
        return await handleGetUser({ ...req, body }, res, requestId);
      case "update-profile":
        return await handleUpdateProfile({ ...req, body }, res, requestId);
      case "delete-account":
        return await handleDeleteAccount({ ...req, body }, res, requestId);
      default:
        console.log(`❌ [${requestId}] Invalid action: ${action}`);
        return res.status(400).json({
          success: false,
          error: "Invalid action",
          debug: {
            action,
            requestId,
            availableActions: [
              "signup",
              "signin",
              "verify-token",
              "signout",
              "get-user",
              "update-profile",
              "delete-account",
            ],
          },
        });
    }
  } catch (error) {
    console.error(`❌ [${requestId}] Auth API Error:`, error);
    return res.status(500).json({
      success: false,
      error: "Authentication service error",
      debug: {
        requestId,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    });
  }
};

// Regular signup
async function handleSignup(req, res, requestId) {
  const { email, password, name, tier = "free", language = "en" } = req.body;

  console.log(`🔍 [${requestId}] Signup attempt for: ${email}`);

  // Validation
  if (!email || !password || !name) {
    console.log(`❌ [${requestId}] Missing required fields`);
    return res.status(400).json({
      success: false,
      error: "Email, password, and name are required",
      debug: { requestId },
    });
  }

  if (password.length < 6) {
    console.log(`❌ [${requestId}] Password too short`);
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters",
      debug: { requestId },
    });
  }

  try {
    // Check if user already exists
    console.log(`🔍 [${requestId}] Checking if user exists...`);
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      console.log(`❌ [${requestId}] User already exists`);
      return res.status(400).json({
        success: false,
        error: "User already exists with this email",
        debug: { requestId },
      });
    }

    console.log(`🔍 [${requestId}] Creating user account...`);
    const user = await createUserAccount(
      {
        email: email.toLowerCase(),
        password,
        name,
        tier,
        language,
      },
      requestId
    );

    const token = generateJWT(user, requestId);

    console.log(
      `✅ [${requestId}] New user created: ${user.email} (${user.tier})`
    );

    return res.json({
      success: true,
      message: "Account created successfully",
      user: formatUserResponse(user),
      token,
      debug: { requestId },
    });
  } catch (error) {
    console.error(`❌ [${requestId}] Signup error:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to create account",
      debug: {
        requestId,
        message: error.message,
      },
    });
  }
}

// Signup with subscription
async function handleSignupWithSubscription(req, res, requestId) {
  const {
    email,
    password,
    name,
    tier,
    subscriptionId,
    language = "en",
  } = req.body;

  console.log(
    `🔍 [${requestId}] Subscription signup attempt for: ${email}, tier: ${tier}`
  );

  if (!email || !password || !name || !tier || !subscriptionId) {
    console.log(
      `❌ [${requestId}] Missing required fields for subscription signup`
    );
    return res.status(400).json({
      success: false,
      error: "Missing required fields for subscription signup",
      debug: { requestId },
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
      console.log(
        `❌ [${requestId}] User already exists for subscription signup`
      );
      return res.status(400).json({
        success: false,
        error: "User already exists with this email",
        debug: { requestId },
      });
    }

    const user = await createUserAccount(
      {
        email: email.toLowerCase(),
        password,
        name,
        tier,
        language,
        subscriptionId,
        subscriptionStatus: "active",
      },
      requestId
    );

    const token = generateJWT(user, requestId);

    console.log(
      `✅ [${requestId}] New subscriber created: ${user.email} (${user.tier})`
    );

    return res.json({
      success: true,
      message: "Account created and subscription activated",
      user: formatUserResponse(user),
      token,
      debug: { requestId },
    });
  } catch (error) {
    console.error(`❌ [${requestId}] Subscription signup error:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to create account with subscription",
      debug: {
        requestId,
        message: error.message,
      },
    });
  }
}

// Regular signin
async function handleSignin(req, res, requestId) {
  const { email, password } = req.body;

  console.log(`🔍 [${requestId}] Signin attempt for: ${email}`);

  if (!email || !password) {
    console.log(`❌ [${requestId}] Missing email or password`);
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
      debug: { requestId },
    });
  }

  try {
    // Get user from database
    console.log(`🔍 [${requestId}] Querying user from database...`);
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      console.log(`❌ [${requestId}] User not found or database error:`, error);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        debug: { requestId },
      });
    }

    console.log(`🔍 [${requestId}] User found, verifying password...`);

    // Verify password
    if (!user.password_hash) {
      console.log(`❌ [${requestId}] No password hash found for user`);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        debug: { requestId },
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log(`❌ [${requestId}] Invalid password`);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        debug: { requestId },
      });
    }

    console.log(
      `🔍 [${requestId}] Password verified, updating sign-in data...`
    );

    // Update last sign in and handle monthly usage reset
    await updateUserSignin(user, requestId);

    const token = generateJWT(user, requestId);

    console.log(
      `✅ [${requestId}] User signed in: ${user.email} (${user.tier})`
    );

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
      debug: { requestId },
    });
  } catch (error) {
    console.error(`❌ [${requestId}] Signin error:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to sign in",
      debug: {
        requestId,
        message: error.message,
      },
    });
  }
}

// Sign out
async function handleSignout(req, res, requestId) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  console.log(`🔍 [${requestId}] Signout request`);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`✅ [${requestId}] User signed out: ${decoded.email}`);
    } catch (error) {
      console.log(
        `🔍 [${requestId}] Invalid token on signout, but that's okay`
      );
    }
  }

  return res.json({
    success: true,
    message: "Signed out successfully",
    debug: { requestId },
  });
}

// Verify JWT token
async function handleVerifyToken(req, res, requestId) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  console.log(`🔍 [${requestId}] Token verification request`);
  console.log(`🔍 [${requestId}] Token exists: ${!!token}`);
  console.log(`🔍 [${requestId}] Token length: ${token?.length || 0}`);

  if (!token) {
    console.log(`❌ [${requestId}] No token provided`);
    return res.status(401).json({
      success: false,
      error: "No token provided",
      debug: { requestId, stage: "no_token" },
    });
  }

  try {
    console.log(`🔍 [${requestId}] Attempting JWT verification...`);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(
      `✅ [${requestId}] JWT verification successful, userId: ${decoded.userId}`
    );

    // Get fresh user data
    console.log(`🔍 [${requestId}] Querying Supabase for user...`);
    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        id, email, name, tier, subscription_status, subscription_period,
        reflection_count_this_month, total_reflections, 
        is_creator, is_admin, language, current_month_year,
        avatar_url, email_verified
      `
      )
      .eq("id", decoded.userId)
      .single();

    if (error) {
      console.log(`❌ [${requestId}] Supabase query error:`, error);
      return res.status(401).json({
        success: false,
        error: "User not found",
        debug: {
          requestId,
          stage: "supabase_query",
          supabaseError: error.message,
          userId: decoded.userId,
        },
      });
    }

    if (!user) {
      console.log(`❌ [${requestId}] User not found in database`);
      return res.status(401).json({
        success: false,
        error: "User not found",
        debug: {
          requestId,
          stage: "user_not_found",
          userId: decoded.userId,
        },
      });
    }

    console.log(`✅ [${requestId}] User found: ${user.email}`);

    // Check if monthly usage needs reset
    if (shouldResetUsage(user)) {
      console.log(`🔍 [${requestId}] Resetting monthly usage for user`);
      await resetMonthlyUsage(user);
      user.reflection_count_this_month = 0;
    }

    console.log(
      `✅ [${requestId}] Token verification successful for: ${user.email}`
    );

    return res.json({
      success: true,
      user: formatUserResponse(user),
      debug: { requestId },
    });
  } catch (error) {
    console.log(`❌ [${requestId}] JWT verification failed:`, error.message);
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      debug: {
        requestId,
        stage: "jwt_verification",
        jwtError: error.message,
        tokenPresent: !!token,
        secretPresent: !!JWT_SECRET,
      },
    });
  }
}

// Get user profile
async function handleGetUser(req, res, requestId) {
  console.log(`🔍 [${requestId}] Get user profile request`);

  try {
    const user = await authenticateRequest(req, requestId);

    const { data: fullUser, error } = await supabase
      .from("users")
      .select(
        `
        id, email, name, tier, subscription_status, subscription_period,
        subscription_started_at, subscription_expires_at, paypal_subscription_id,
        reflection_count_this_month, total_reflections,
        is_creator, is_admin, language, timezone,
        last_reflection_at, created_at,
        avatar_url, email_verified
      `
      )
      .eq("id", user.id)
      .single();

    if (error || !fullUser) {
      console.log(`❌ [${requestId}] User profile not found:`, error);
      return res.status(404).json({
        success: false,
        error: "User not found",
        debug: { requestId },
      });
    }

    console.log(
      `✅ [${requestId}] User profile retrieved for: ${fullUser.email}`
    );

    return res.json({
      success: true,
      user: fullUser,
      debug: { requestId },
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      console.log(
        `❌ [${requestId}] Authentication failed for get-user:`,
        error.message
      );
      return res.status(401).json({
        success: false,
        error: error.message,
        debug: { requestId },
      });
    }
    throw error;
  }
}

// Update user profile
async function handleUpdateProfile(req, res, requestId) {
  console.log(`🔍 [${requestId}] Update profile request`);

  try {
    const user = await authenticateRequest(req, requestId);
    const { name, language, timezone } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (language) updates.language = language;
    if (timezone) updates.timezone = timezone;

    if (Object.keys(updates).length === 0) {
      console.log(`❌ [${requestId}] No valid fields to update`);
      return res.status(400).json({
        success: false,
        error: "No valid fields to update",
        debug: { requestId },
      });
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("id, email, name, language, timezone, avatar_url")
      .single();

    if (error) {
      console.log(`❌ [${requestId}] Profile update failed:`, error);
      return res.status(500).json({
        success: false,
        error: "Failed to update profile",
        debug: { requestId },
      });
    }

    console.log(`✅ [${requestId}] Profile updated: ${updatedUser.email}`);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
      debug: { requestId },
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
        debug: { requestId },
      });
    }
    throw error;
  }
}

// Delete user account
async function handleDeleteAccount(req, res, requestId) {
  console.log(`🔍 [${requestId}] Delete account request`);

  try {
    const user = await authenticateRequest(req, requestId);
    const { password } = req.body;

    // If user has password, verify it
    if (user.password_hash) {
      if (!password) {
        console.log(`❌ [${requestId}] Password confirmation required`);
        return res.status(400).json({
          success: false,
          error: "Password confirmation required",
          debug: { requestId },
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        console.log(`❌ [${requestId}] Invalid password for account deletion`);
        return res.status(401).json({
          success: false,
          error: "Invalid password",
          debug: { requestId },
        });
      }
    }

    // Delete user (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (deleteError) {
      console.log(`❌ [${requestId}] Account deletion failed:`, deleteError);
      return res.status(500).json({
        success: false,
        error: "Failed to delete account",
        debug: { requestId },
      });
    }

    console.log(`✅ [${requestId}] Account deleted: ${user.email}`);

    return res.json({
      success: true,
      message: "Account deleted successfully",
      debug: { requestId },
    });
  } catch (error) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid authentication"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
        debug: { requestId },
      });
    }
    throw error;
  }
}

// Helper functions

async function createUserAccount(userData, requestId) {
  const {
    email,
    password,
    name,
    tier,
    language,
    subscriptionId,
    subscriptionStatus = tier === "free" ? "active" : "trialing",
  } = userData;

  console.log(`🔍 [${requestId}] Creating user account for: ${email}`);

  const userRecord = {
    email,
    name,
    tier,
    language,
    subscription_status: subscriptionStatus,
    subscription_started_at: new Date().toISOString(),
    current_month_year: new Date().toISOString().slice(0, 7),
    last_sign_in_at: new Date().toISOString(),
    email_verified: false,
  };

  // Add password hash
  if (password) {
    console.log(`🔍 [${requestId}] Hashing password...`);
    userRecord.password_hash = await bcrypt.hash(password, 12);
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
    console.error(`❌ [${requestId}] User creation error:`, error);
    throw new Error("Failed to create user account");
  }

  console.log(`✅ [${requestId}] User account created successfully`);
  return user;
}

function generateJWT(user, requestId) {
  console.log(`🔍 [${requestId}] Generating JWT for user: ${user.email}`);

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

async function updateUserSignin(user, requestId) {
  console.log(`🔍 [${requestId}] Updating user sign-in data`);

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
async function authenticateRequest(req, requestId) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  console.log(
    `🔍 [${requestId}] Authenticating request - token exists: ${!!token}`
  );

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
      console.log(
        `❌ [${requestId}] User not found in authenticateRequest:`,
        error
      );
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.log(`❌ [${requestId}] Authentication failed:`, error.message);
    throw new Error("Invalid authentication");
  }
}

// Export utility function for other APIs
module.exports.authenticateRequest = authenticateRequest;
