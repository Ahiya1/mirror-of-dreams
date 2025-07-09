// API: Payment - Sacred PayPal Subscription Processing with Billing Agreements
// TRANSFORMED: From one-time payments to recurring subscriptions

// Main handler
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    if (req.method === "GET") {
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

      if (action === "create-subscription") {
        return await handleCreateSubscription(req, res);
      } else if (action === "webhook") {
        return await handlePayPalWebhook(req, res);
      } else {
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
    console.error("Payment API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Payment service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get PayPal configuration with subscription pricing
async function handleGetConfig(req, res) {
  try {
    const config = {
      clientId: process.env.PAYPAL_CLIENT_ID,
      currency: "USD",
      environment:
        process.env.NODE_ENV === "production" ? "production" : "sandbox",
      subscriptions: {
        essential: {
          monthly: {
            amount: "4.99",
            planId: process.env.PAYPAL_ESSENTIAL_MONTHLY_PLAN_ID,
          },
          yearly: {
            amount: "49.99",
            planId: process.env.PAYPAL_ESSENTIAL_YEARLY_PLAN_ID,
          },
        },
        premium: {
          monthly: {
            amount: "9.99",
            planId: process.env.PAYPAL_PREMIUM_MONTHLY_PLAN_ID,
          },
          yearly: {
            amount: "99.99",
            planId: process.env.PAYPAL_PREMIUM_YEARLY_PLAN_ID,
          },
        },
      },
      // Legacy one-time for gifts
      oneTime: {
        essential: "4.99",
        premium: "9.99",
      },
    };

    // Validate configuration
    if (!config.clientId) {
      console.error("🚨 PAYPAL_CLIENT_ID not found in environment variables");
      return res.status(500).json({
        success: false,
        error: "PayPal configuration missing",
      });
    }

    console.log(
      `💳 PayPal subscription config requested - Environment: ${config.environment}`
    );

    return res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("PayPal Config Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load PayPal configuration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Create PayPal subscription
async function handleCreateSubscription(req, res) {
  const {
    name,
    email,
    tier,
    period,
    language = "en",
    subscriptionId,
    planId,
  } = req.body;

  // Validation
  if (!name || !email || !tier || !period || !subscriptionId) {
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
    // Create user account with subscription
    const userResponse = await fetch(`${getBaseUrl()}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup",
        email: email,
        password: generateSecurePassword(), // Auto-generate secure password
        name: name,
        tier: tier,
        language: language,
      }),
    });

    const userData = await userResponse.json();

    if (!userData.success) {
      // Check if user exists - try sign in instead
      if (userData.error?.includes("already exists")) {
        const signinResponse = await fetch(`${getBaseUrl()}/api/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "signin",
            email: email,
            password: "temp", // This will fail but that's ok
          }),
        });

        // For existing users, we'll need them to sign in manually
        return res.status(400).json({
          success: false,
          error: "User already exists. Please sign in first.",
          requiresSignin: true,
        });
      }

      throw new Error(userData.error || "Failed to create user");
    }

    // Update user with subscription details
    const subscriptionResponse = await fetch(
      `${getBaseUrl()}/api/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData.token}`,
        },
        body: JSON.stringify({
          action: "create-subscription",
          tier: tier,
          period: period,
          paypalSubscriptionId: subscriptionId,
        }),
      }
    );

    const subscriptionData = await subscriptionResponse.json();

    if (!subscriptionData.success) {
      throw new Error(
        subscriptionData.error || "Failed to create subscription"
      );
    }

    // Send subscription confirmation email
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
      console.warn("Subscription confirmation email failed:", emailError);
      // Don't fail the whole process for email issues
    }

    console.log(
      `🚀 Subscription created: ${email} → ${tier} (${period}) → ${subscriptionId}`
    );

    return res.json({
      success: true,
      message: "Subscription created successfully",
      user: userData.user,
      token: userData.token,
      subscription: subscriptionData.subscription,
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create subscription",
    });
  }
}

// PayPal webhook handler for subscription events
async function handlePayPalWebhook(req, res) {
  try {
    const event = req.body;

    console.log(`📦 PayPal webhook received: ${event.event_type}`);

    // Verify webhook signature (implement in production)
    // const isValid = await verifyPayPalWebhook(req);
    // if (!isValid) {
    //   return res.status(400).json({ error: "Invalid webhook signature" });
    // }

    // Handle different webhook events
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(event);
        break;
      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(event);
        break;
      case "BILLING.SUBSCRIPTION.EXPIRED":
        await handleSubscriptionExpired(event);
        break;
      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentCompleted(event);
        break;
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        await handlePaymentFailed(event);
        break;
      default:
        console.log(`Unhandled PayPal event: ${event.event_type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

// Webhook event handlers
async function handleSubscriptionActivated(event) {
  try {
    const subscriptionId = event.resource.id;

    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("users")
      .update({
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
      })
      .eq("subscription_id", subscriptionId);

    if (error) {
      console.error("Error activating subscription:", error);
    } else {
      console.log(`✅ Subscription activated: ${subscriptionId}`);
    }
  } catch (error) {
    console.error("Error handling subscription activation:", error);
  }
}

async function handleSubscriptionCancelled(event) {
  try {
    const subscriptionId = event.resource.id;

    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("users")
      .update({ subscription_status: "canceled" })
      .eq("subscription_id", subscriptionId);

    if (error) {
      console.error("Error canceling subscription:", error);
    } else {
      console.log(`❌ Subscription canceled: ${subscriptionId}`);
    }
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}

async function handleSubscriptionExpired(event) {
  try {
    const subscriptionId = event.resource.id;

    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("users")
      .update({
        subscription_status: "expired",
        tier: "free", // Downgrade to free tier
      })
      .eq("subscription_id", subscriptionId);

    if (error) {
      console.error("Error expiring subscription:", error);
    } else {
      console.log(`⏰ Subscription expired: ${subscriptionId}`);
    }
  } catch (error) {
    console.error("Error handling subscription expiration:", error);
  }
}

async function handlePaymentCompleted(event) {
  console.log(`💰 Payment completed: ${event.resource.id}`);
  // Optional: Log successful payment, update payment history, etc.
}

async function handlePaymentFailed(event) {
  console.log(`💸 Payment failed: ${event.resource.id}`);
  // Optional: Send payment failure notification, retry logic, etc.
}

// Utility functions
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  return "http://localhost:3000";
}

function generateSecurePassword() {
  // Generate a secure random password for auto-created accounts
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
