// API: Payment - Fixed Stripe Subscription Processing
// FIXED: Proper webhook routing and password preservation

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Main handler
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Stripe-Signature"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  console.log(`🔍 Payment API called: ${req.method} ${req.url}`);
  console.log(`🔍 Headers:`, req.headers);

  try {
    // Check if this is a Stripe webhook (has signature header)
    const sig = req.headers["stripe-signature"];

    if (sig && req.method === "POST") {
      console.log("🪝 Detected Stripe webhook - routing to webhook handler");
      // This is a Stripe webhook
      return await handleStripeWebhook(req, res);
    }

    // Regular API calls
    if (req.method === "GET") {
      const { action } = req.query;
      console.log(`📝 GET request with action: ${action}`);
      if (action === "config" || !action) {
        return await handleGetConfig(req, res);
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
      }
    }

    if (req.method === "POST") {
      const { action } = req.body;
      console.log(`📝 POST request with action: ${action}`);

      if (action === "create-checkout-session") {
        return await handleCreateCheckoutSession(req, res);
      } else {
        console.log(`❌ Unknown POST action: ${action}`);
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("❌ Payment API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Payment service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get Stripe configuration with subscription pricing
async function handleGetConfig(req, res) {
  try {
    const config = {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      currency: "USD",
      environment:
        process.env.NODE_ENV === "production" ? "production" : "test",
      subscriptions: {
        essential: {
          monthly: {
            amount: "4.99",
            priceId: process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID,
          },
          yearly: {
            amount: "49.99",
            priceId: process.env.STRIPE_ESSENTIAL_YEARLY_PRICE_ID,
          },
        },
        premium: {
          monthly: {
            amount: "9.99",
            priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
          },
          yearly: {
            amount: "99.99",
            priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
          },
        },
      },
    };

    // Validate configuration
    if (!config.publishableKey) {
      console.error(
        "🚨 STRIPE_PUBLISHABLE_KEY not found in environment variables"
      );
      return res.status(500).json({
        success: false,
        error: "Stripe configuration missing",
      });
    }

    console.log(
      `💳 Stripe subscription config requested - Environment: ${config.environment}`
    );

    return res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Stripe Config Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load Stripe configuration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Create Stripe Checkout Session for subscription
async function handleCreateCheckoutSession(req, res) {
  const { name, email, tier, period, password, language = "en" } = req.body;

  // Validation
  if (!name || !email || !tier || !period || !password) {
    return res.status(400).json({
      success: false,
      error: "Missing required subscription data",
    });
  }

  if (!["essential", "premium"].includes(tier)) {
    return res.status(400).json({
      success: false,
      error: "Invalid subscription tier",
    });
  }

  if (!["monthly", "yearly"].includes(period)) {
    return res.status(400).json({
      success: false,
      error: "Invalid subscription period",
    });
  }

  try {
    // Get the correct price ID
    const priceId = getPriceId(tier, period);

    if (!priceId) {
      return res.status(500).json({
        success: false,
        error: "Price configuration missing",
      });
    }

    // Store user data temporarily with a session token
    const sessionToken = generateSessionToken();
    await storeTemporaryUserData(sessionToken, {
      name,
      email,
      password,
      tier,
      period,
      language,
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        name: name,
        email: email,
        tier: tier,
        period: period,
        language: language,
        session_token: sessionToken, // 🔑 Key addition!
      },
      success_url: `${getBaseUrl()}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${getBaseUrl()}/commitment?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      tax_id_collection: {
        enabled: true,
      },
    });

    console.log(
      `🚀 Stripe checkout session created: ${email} → ${tier} (${period}) → ${session.id}`
    );

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout session creation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create checkout session",
    });
  }
}

// Stripe webhook handler for subscription events
async function handleStripeWebhook(req, res) {
  console.log("🪝 Webhook received - Headers:", req.headers);
  console.log("🪝 Request method:", req.method);
  console.log("🪝 Request URL:", req.url);

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log("🪝 Signature present:", !!sig);
  console.log("🪝 Webhook secret configured:", !!webhookSecret);

  if (!sig) {
    console.error("❌ No Stripe signature found in headers");
    return res.status(400).json({ error: "No signature" });
  }

  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log("✅ Webhook signature verified successfully");
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    console.error("❌ Signature:", sig);
    console.error("❌ Body length:", req.body?.length || 0);
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log(`📦 Stripe webhook received: ${event.type}`);
  console.log(`📦 Event ID: ${event.id}`);

  try {
    // Handle different webhook events
    switch (event.type) {
      case "checkout.session.completed":
        console.log("🎉 Processing checkout.session.completed");
        await handleCheckoutSessionCompleted(event);
        break;
      case "customer.subscription.created":
        console.log("✅ Processing customer.subscription.created");
        await handleSubscriptionCreated(event);
        break;
      case "customer.subscription.updated":
        console.log("🔄 Processing customer.subscription.updated");
        await handleSubscriptionUpdated(event);
        break;
      case "customer.subscription.deleted":
        console.log("❌ Processing customer.subscription.deleted");
        await handleSubscriptionDeleted(event);
        break;
      case "invoice.payment_succeeded":
        console.log("💰 Processing invoice.payment_succeeded");
        await handlePaymentSucceeded(event);
        break;
      case "invoice.payment_failed":
        console.log("💸 Processing invoice.payment_failed");
        await handlePaymentFailed(event);
        break;
      default:
        console.log(`⚠️ Unhandled Stripe event: ${event.type}`);
    }

    console.log("✅ Webhook processed successfully");
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Stripe webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

// Webhook event handlers
async function handleCheckoutSessionCompleted(event) {
  try {
    const session = event.data.object;
    const { name, email, tier, period, language, session_token } =
      session.metadata;

    console.log(`🎉 Checkout completed: ${email} → ${tier} (${period})`);

    // Retrieve the original user data including password
    const userData = await getTemporaryUserData(session_token);

    if (!userData) {
      console.error(
        "❌ Could not retrieve user data for session:",
        session_token
      );
      // Fallback: create user with random password and send reset email
      await createUserWithRandomPassword(
        session,
        name,
        email,
        tier,
        period,
        language
      );
      return;
    }

    // Create user account with the ORIGINAL password
    const userResponse = await fetch(`${getBaseUrl()}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup",
        email: userData.email,
        password: userData.password, // 🔑 Original password!
        name: userData.name,
        tier: userData.tier,
        language: userData.language,
      }),
    });

    const userResult = await userResponse.json();

    if (!userResult.success) {
      // Check if user exists - update their subscription instead
      if (userResult.error?.includes("already exists")) {
        await updateExistingUserSubscription(email, tier, period, session);
        return;
      }
      throw new Error(userResult.error || "Failed to create user");
    }

    // Update user with Stripe subscription details
    await updateUserSubscription(userResult.user.id, tier, period, session);

    // Clean up temporary data
    await cleanupTemporaryUserData(session_token);

    // Send welcome email
    try {
      await fetch(`${getBaseUrl()}/api/communication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-subscription-confirmation",
          email: email,
          name: name,
          tier: tier,
          period: period,
          language: language,
        }),
      });
    } catch (emailError) {
      console.warn("Welcome email failed:", emailError);
    }

    console.log(`✅ User account created successfully: ${email}`);
  } catch (error) {
    console.error("Error handling checkout completion:", error);
  }
}

// Fallback for when temporary data is lost
async function createUserWithRandomPassword(
  session,
  name,
  email,
  tier,
  period,
  language
) {
  try {
    const tempPassword = generateSecurePassword();

    const userResponse = await fetch(`${getBaseUrl()}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup",
        email: email,
        password: tempPassword,
        name: name,
        tier: tier,
        language: language,
      }),
    });

    const userResult = await userResponse.json();

    if (userResult.success) {
      await updateUserSubscription(userResult.user.id, tier, period, session);

      // Send password reset email
      await fetch(`${getBaseUrl()}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "forgot-password",
          email: email,
        }),
      });

      console.log(
        `⚠️ User created with temp password, reset email sent: ${email}`
      );
    }
  } catch (error) {
    console.error("Error in fallback user creation:", error);
  }
}

// Temporary data storage functions (using Redis or similar)
async function storeTemporaryUserData(sessionToken, userData) {
  try {
    // Store for 1 hour
    const { Redis } = require("@upstash/redis");
    const redis = Redis.fromEnv();

    await redis.setex(
      `temp_user:${sessionToken}`,
      3600,
      JSON.stringify(userData)
    );
    console.log(`💾 Stored temporary user data: ${sessionToken}`);
  } catch (error) {
    console.error("Error storing temporary user data:", error);
  }
}

async function getTemporaryUserData(sessionToken) {
  try {
    const { Redis } = require("@upstash/redis");
    const redis = Redis.fromEnv();

    const data = await redis.get(`temp_user:${sessionToken}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error retrieving temporary user data:", error);
    return null;
  }
}

async function cleanupTemporaryUserData(sessionToken) {
  try {
    const { Redis } = require("@upstash/redis");
    const redis = Redis.fromEnv();

    await redis.del(`temp_user:${sessionToken}`);
    console.log(`🗑️ Cleaned up temporary user data: ${sessionToken}`);
  } catch (error) {
    console.error("Error cleaning up temporary user data:", error);
  }
}

function generateSessionToken() {
  return Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// [Rest of the functions remain the same...]
async function handleSubscriptionCreated(event) {
  try {
    const subscription = event.data.object;
    console.log(`✅ Subscription created: ${subscription.id}`);
  } catch (error) {
    console.error("Error handling subscription creation:", error);
  }
}

async function handleSubscriptionUpdated(event) {
  try {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const status =
      subscription.status === "active"
        ? "active"
        : subscription.status === "canceled"
        ? "canceled"
        : subscription.status === "past_due"
        ? "past_due"
        : "inactive";

    const { error } = await supabase
      .from("users")
      .update({
        subscription_status: status,
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("Error updating subscription:", error);
    } else {
      console.log(`🔄 Subscription updated: ${subscription.id} → ${status}`);
    }
  } catch (error) {
    console.error("Error handling subscription update:", error);
  }
}

async function handleSubscriptionDeleted(event) {
  try {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("users")
      .update({
        subscription_status: "canceled",
        tier: "free",
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("Error canceling subscription:", error);
    } else {
      console.log(`❌ Subscription canceled: ${subscription.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
  }
}

async function handlePaymentSucceeded(event) {
  try {
    const invoice = event.data.object;
    console.log(`💰 Payment succeeded: ${invoice.id}`);

    if (invoice.subscription) {
      const customerId = invoice.customer;

      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "active",
        })
        .eq("stripe_customer_id", customerId);

      if (!error) {
        console.log(`✅ Subscription reactivated for payment: ${invoice.id}`);
      }
    }
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentFailed(event) {
  try {
    const invoice = event.data.object;
    console.log(`💸 Payment failed: ${invoice.id}`);

    if (invoice.subscription) {
      const customerId = invoice.customer;

      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "past_due",
        })
        .eq("stripe_customer_id", customerId);

      if (!error) {
        console.log(`⚠️ Subscription marked past due: ${invoice.subscription}`);
      }
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

// Helper functions
async function updateUserSubscription(userId, tier, period, session) {
  try {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (period === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const { error } = await supabase
      .from("users")
      .update({
        tier: tier,
        subscription_status: "active",
        subscription_period: period,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        subscription_started_at: startDate.toISOString(),
        subscription_expires_at: expiryDate.toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user subscription:", error);
    }
  } catch (error) {
    console.error("Error in updateUserSubscription:", error);
  }
}

async function updateExistingUserSubscription(email, tier, period, session) {
  try {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (period === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const { error } = await supabase
      .from("users")
      .update({
        tier: tier,
        subscription_status: "active",
        subscription_period: period,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        subscription_started_at: startDate.toISOString(),
        subscription_expires_at: expiryDate.toISOString(),
      })
      .eq("email", email);

    if (error) {
      console.error("Error updating existing user subscription:", error);
    } else {
      console.log(`🔄 Updated existing user subscription: ${email}`);
    }
  } catch (error) {
    console.error("Error in updateExistingUserSubscription:", error);
  }
}

function getPriceId(tier, period) {
  const priceMap = {
    essential: {
      monthly: process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_ESSENTIAL_YEARLY_PRICE_ID,
    },
    premium: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    },
  };

  return priceMap[tier]?.[period];
}

function getBaseUrl() {
  // Always use your custom domain in production
  if (process.env.NODE_ENV === "production") {
    return "https://mirror-of-truth.xyz";
  }
  // For development
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  return "http://localhost:3000";
}

function generateSecurePassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
