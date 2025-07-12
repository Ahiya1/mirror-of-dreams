// API: Payment - Simplified for Existing User Upgrades (Updated with Webhook Routing)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to get raw body
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      resolve(data);
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

// Main handler
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Stripe-Signature"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  console.log(`🔍 Payment API called: ${req.method} ${req.url}`);

  try {
    // Check if this is a Stripe webhook (has signature header)
    const sig = req.headers["stripe-signature"];

    if (sig && req.method === "POST") {
      console.log("🪝 Detected Stripe webhook - routing to webhook handler");
      return await handleStripeWebhook(req, res);
    }

    // For non-webhook requests, parse the body manually
    let body = {};
    if (req.method === "POST") {
      const rawBody = await getRawBody(req);
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: "Invalid JSON body",
        });
      }
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
      const { action } = body;
      console.log(`📝 POST request with action: ${action}`);

      if (action === "create-upgrade-checkout") {
        // Add body to req for handler
        req.body = body;
        return await handleCreateUpgradeCheckout(req, res);
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

// Create Stripe Checkout Session for existing user upgrade
async function handleCreateUpgradeCheckout(req, res) {
  try {
    // Authenticate the user
    const user = await authenticateRequest(req);
    const { tier, period } = req.body;

    // Validation
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

    // Check if user already has this tier or higher
    if (
      user.tier === tier ||
      (user.tier === "premium" && tier === "essential")
    ) {
      return res.status(400).json({
        success: false,
        error: "User already has this tier or higher",
      });
    }

    // Get the correct price ID
    const priceId = getPriceId(tier, period);

    if (!priceId) {
      return res.status(500).json({
        success: false,
        error: "Price configuration missing",
      });
    }

    // Create Stripe Checkout Session with user ID in metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        type: "upgrade", // Mark as upgrade webhook
        userId: user.id,
        email: user.email,
        tier: tier,
        period: period,
        upgradeExistingUser: "true",
      },
      success_url: `${getBaseUrl()}/dashboard?upgrade_success=true`,
      cancel_url: `${getBaseUrl()}/upgrade?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      tax_id_collection: {
        enabled: true,
      },
    });

    console.log(
      `🚀 Upgrade checkout session created: ${user.email} → ${tier} (${period}) → ${session.id}`
    );

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
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

    console.error("Stripe checkout session creation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create checkout session",
    });
  }
}

// Stripe webhook handler with routing (NEW: Added routing logic)
async function handleStripeWebhook(req, res) {
  console.log("🪝 Webhook received - Headers:", req.headers);

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    console.error("❌ No Stripe signature found in headers");
    return res.status(400).json({ error: "No signature" });
  }

  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event;
  let rawBody;

  try {
    // Get raw body for signature verification
    rawBody = await getRawBody(req);
    console.log("✅ Raw body retrieved, length:", rawBody.length);
  } catch (err) {
    console.error("❌ Failed to get raw body:", err.message);
    return res.status(400).json({ error: "Failed to read request body" });
  }

  try {
    // Verify webhook signature with raw body
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log("✅ Webhook signature verified successfully");
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log(`📦 Stripe webhook received: ${event.type}`);
  console.log(`📦 Event ID: ${event.id}`);

  try {
    // NEW: Route webhook based on session metadata
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const webhookType = session.metadata?.type;

      console.log(`🔀 Routing webhook type: ${webhookType}`);

      if (webhookType === "gift") {
        console.log("🎁 Routing to gift webhook handler");
        return await routeToGiftWebhook(event, res);
      } else if (
        webhookType === "upgrade" ||
        session.metadata?.upgradeExistingUser === "true"
      ) {
        console.log("🚀 Processing upgrade webhook");
        return await handleUpgradeWebhookEvents(event, res);
      } else {
        console.log("⚠️ Unknown webhook type, processing as upgrade");
        return await handleUpgradeWebhookEvents(event, res);
      }
    } else {
      // Handle other webhook events as upgrade-related
      return await handleUpgradeWebhookEvents(event, res);
    }
  } catch (error) {
    console.error("❌ Stripe webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

// NEW: Route gift webhooks to gifting API
async function routeToGiftWebhook(event, res) {
  try {
    console.log("🎁 Forwarding gift webhook to gifting API");

    // Forward to gifting API webhook handler
    const giftingWebhookUrl = `${getBaseUrl()}/api/gifting`;

    const response = await fetch(giftingWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": event.id, // Use event ID as signature for internal routing
      },
      body: JSON.stringify({
        type: "webhook_forward",
        event: event,
      }),
    });

    if (response.ok) {
      console.log("✅ Gift webhook forwarded successfully");
      return res.status(200).json({ received: true, forwarded: "gift" });
    } else {
      console.error("❌ Failed to forward gift webhook");
      return res.status(500).json({ error: "Failed to forward gift webhook" });
    }
  } catch (error) {
    console.error("❌ Error forwarding gift webhook:", error);

    // Fallback: Handle gift webhook directly
    if (event.type === "checkout.session.completed") {
      await handleGiftCheckoutCompleted(event);
    }

    return res.status(200).json({ received: true, handled: "fallback" });
  }
}

// Handle upgrade-related webhook events
async function handleUpgradeWebhookEvents(event, res) {
  try {
    // Handle different webhook events
    switch (event.type) {
      case "checkout.session.completed":
        console.log("🎉 Processing upgrade checkout.session.completed");
        await handleCheckoutSessionCompleted(event);
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

    console.log("✅ Upgrade webhook processed successfully");
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Upgrade webhook processing error:", error);
    return res.status(500).json({ error: "Upgrade webhook processing failed" });
  }
}

// Webhook event handlers (existing upgrade logic)
async function handleCheckoutSessionCompleted(event) {
  try {
    const session = event.data.object;
    const { userId, email, tier, period, upgradeExistingUser } =
      session.metadata;

    console.log(`🎉 Checkout completed: ${email} → ${tier} (${period})`);

    if (upgradeExistingUser === "true" && userId) {
      // Upgrade existing user
      console.log(`⬆️ Upgrading existing user: ${userId}`);
      await upgradeExistingUser(userId, tier, period, session);
    } else {
      console.log(`⚠️ No userId found in metadata or not an upgrade`);
      console.log(`📋 Session metadata:`, session.metadata);
    }

    console.log(`✅ Checkout processing completed for: ${email}`);
  } catch (error) {
    console.error("❌ Error handling checkout completion:", error);
  }
}

// Upgrade existing user (existing logic)
async function upgradeExistingUser(userId, tier, period, session) {
  try {
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (period === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const { data: updatedUser, error } = await supabase
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
      .eq("id", userId)
      .select("email, name")
      .single();

    if (error) {
      throw new Error(`Failed to upgrade user: ${error.message}`);
    }

    console.log(`✅ User upgraded successfully: ${updatedUser.email}`);

    // Send upgrade confirmation email
    try {
      await fetch(`${getBaseUrl()}/api/communication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-upgrade-confirmation",
          email: updatedUser.email,
          name: updatedUser.name,
          tier: tier,
          period: period,
        }),
      });
    } catch (emailError) {
      console.warn("Upgrade email failed:", emailError);
    }
  } catch (error) {
    console.error("Error upgrading user:", error);
    throw error;
  }
}

// NEW: Fallback gift checkout handler (simplified)
async function handleGiftCheckoutCompleted(event) {
  try {
    const session = event.data.object;
    console.log(
      `🎁 Fallback: Processing gift checkout completion for session ${session.id}`
    );

    // Basic logging - full processing should happen in gifting API
    if (session.metadata?.gift_code) {
      console.log(`🎁 Gift code: ${session.metadata.gift_code}`);
    }

    // This is a fallback - the gifting API should handle the full logic
    console.log("🎁 Gift checkout completed (fallback handler)");
  } catch (error) {
    console.error("❌ Error in fallback gift handler:", error);
  }
}

async function handleSubscriptionUpdated(event) {
  try {
    const subscription = event.data.object;
    const customerId = subscription.customer;

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
    return "https://www.mirror-of-truth.xyz";
  }
  // For development
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  return "http://localhost:3000";
}

// CRITICAL: Disable body parsing for webhooks
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
