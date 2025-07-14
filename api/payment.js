// API: Payment - Enhanced with In-Page Payment Intent Support

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

      // Add body to req for handlers
      req.body = body;

      switch (action) {
        case "create-upgrade-checkout":
          return await handleCreateUpgradeCheckout(req, res);
        case "create-payment-intent":
          return await handleCreatePaymentIntent(req, res);
        case "confirm-payment":
          return await handleConfirmPayment(req, res);
        default:
          console.log(`❌ Unknown POST action: ${action}`);
          return res.status(400).json({
            success: false,
            error: "Invalid action",
            availableActions: [
              "create-upgrade-checkout",
              "create-payment-intent",
              "confirm-payment",
            ],
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

// Create Stripe Checkout Session for existing user upgrade (Legacy)
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
        type: "upgrade",
        userId: user.id,
        email: user.email,
        tier: tier,
        period: period,
        upgradeExistingUser: "true",
      },
      success_url: `${getBaseUrl()}/dashboard?upgrade_success=true`,
      cancel_url: `${getBaseUrl()}/subscription?canceled=true`,
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

// NEW: Create Payment Intent for in-page payments
async function handleCreatePaymentIntent(req, res) {
  try {
    // Authenticate the user
    const user = await authenticateRequest(req);
    const { tier, period, amount } = req.body;

    console.log(
      `💳 Creating Payment Intent: ${user.email} → ${tier} (${period}) - $${amount}`
    );

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

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
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

    // Get the correct price ID for subscription creation
    const priceId = getPriceId(tier, period);

    if (!priceId) {
      return res.status(500).json({
        success: false,
        error: "Price configuration missing",
      });
    }

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
          tier: user.tier,
        },
      });

      customerId = customer.id;

      // Update user with customer ID
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      console.log(
        `👤 Created Stripe customer: ${customerId} for ${user.email}`
      );
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "subscription_upgrade",
        userId: user.id,
        email: user.email,
        tier: tier,
        period: period,
        priceId: priceId,
        upgradeExistingUser: "true",
      },
      description: `Mirror of Truth ${
        tier.charAt(0).toUpperCase() + tier.slice(1)
      } subscription (${period})`,
    });

    console.log(
      `✅ Payment Intent created: ${paymentIntent.id} for ${user.email}`
    );

    return res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
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

    console.error("Payment Intent creation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create payment intent",
    });
  }
}

// NEW: Confirm payment and create subscription
async function handleConfirmPayment(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment Intent ID is required",
      });
    }

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: "Payment not completed",
      });
    }

    // Extract metadata
    const { tier, period, priceId } = paymentIntent.metadata;

    if (!tier || !period || !priceId) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment metadata",
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: paymentIntent.customer,
      items: [{ price: priceId }],
      metadata: {
        userId: user.id,
        tier: tier,
        period: period,
        upgradeType: "payment_intent",
      },
    });

    // Update user in database
    await upgradeUserFromPaymentIntent(user.id, tier, period, subscription);

    console.log(
      `✅ Subscription created from Payment Intent: ${subscription.id} for ${user.email}`
    );

    return res.json({
      success: true,
      message: "Payment confirmed and subscription created",
      subscription: {
        id: subscription.id,
        tier: tier,
        period: period,
        status: subscription.status,
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

    console.error("Payment confirmation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
}

// Stripe webhook handler with routing (Enhanced with Payment Intent support)
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
    // Enhanced routing for different event types
    switch (event.type) {
      case "checkout.session.completed":
        return await handleCheckoutWebhook(event, res);
      case "payment_intent.succeeded":
        return await handlePaymentIntentWebhook(event, res);
      case "customer.subscription.updated":
        return await handleSubscriptionUpdated(event, res);
      case "customer.subscription.deleted":
        return await handleSubscriptionDeleted(event, res);
      case "invoice.payment_succeeded":
        return await handlePaymentSucceeded(event, res);
      case "invoice.payment_failed":
        return await handlePaymentFailed(event, res);
      default:
        console.log(`⚠️ Unhandled Stripe event: ${event.type}`);
        return res.status(200).json({ received: true, handled: false });
    }
  } catch (error) {
    console.error("❌ Stripe webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

// NEW: Handle Payment Intent webhooks
async function handlePaymentIntentWebhook(event, res) {
  try {
    const paymentIntent = event.data.object;
    const { type, userId, tier, period, priceId } = paymentIntent.metadata;

    console.log(`💳 Payment Intent succeeded: ${paymentIntent.id}`);
    console.log(`📋 Metadata:`, paymentIntent.metadata);

    // Check if this is a subscription upgrade
    if (
      type === "subscription_upgrade" &&
      userId &&
      tier &&
      period &&
      priceId
    ) {
      console.log(`🚀 Processing subscription upgrade for user: ${userId}`);

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: paymentIntent.customer,
        items: [{ price: priceId }],
        metadata: {
          userId: userId,
          tier: tier,
          period: period,
          upgradeType: "payment_intent",
          paymentIntentId: paymentIntent.id,
        },
      });

      // Update user in database
      await upgradeUserFromPaymentIntent(userId, tier, period, subscription);

      console.log(
        `✅ Subscription created: ${subscription.id} for user: ${userId}`
      );
    } else {
      console.log(`ℹ️ Payment Intent not for subscription upgrade, skipping`);
    }

    return res
      .status(200)
      .json({ received: true, processed: "payment_intent" });
  } catch (error) {
    console.error("❌ Payment Intent webhook error:", error);
    return res.status(500).json({ error: "Payment Intent processing failed" });
  }
}

// Enhanced: Handle Checkout Session webhooks with routing
async function handleCheckoutWebhook(event, res) {
  try {
    const session = event.data.object;
    const webhookType = session.metadata?.type;

    console.log(`🔀 Routing checkout webhook type: ${webhookType}`);

    if (webhookType === "gift") {
      console.log("🎁 Routing to gift webhook handler");
      return await routeToGiftWebhook(event, res);
    } else if (
      webhookType === "upgrade" ||
      session.metadata?.upgradeExistingUser === "true"
    ) {
      console.log("🚀 Processing upgrade checkout webhook");
      return await handleUpgradeCheckoutCompleted(event, res);
    } else {
      console.log("⚠️ Unknown checkout webhook type, processing as upgrade");
      return await handleUpgradeCheckoutCompleted(event, res);
    }
  } catch (error) {
    console.error("❌ Checkout webhook error:", error);
    return res.status(500).json({ error: "Checkout processing failed" });
  }
}

// Route gift webhooks to gifting API
async function routeToGiftWebhook(event, res) {
  try {
    console.log("🎁 Forwarding gift webhook to gifting API");

    // Forward to gifting API webhook handler
    const giftingWebhookUrl = `${getBaseUrl()}/api/gifting`;

    const response = await fetch(giftingWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": event.id,
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

// Handle upgrade checkout completion (Legacy)
async function handleUpgradeCheckoutCompleted(event, res) {
  try {
    const session = event.data.object;
    const { userId, email, tier, period, upgradeExistingUser } =
      session.metadata;

    console.log(`🎉 Checkout completed: ${email} → ${tier} (${period})`);

    if (upgradeExistingUser === "true" && userId) {
      console.log(`⬆️ Upgrading existing user: ${userId}`);
      await upgradeExistingUser(userId, tier, period, session);
    } else {
      console.log(`⚠️ No userId found in metadata or not an upgrade`);
      console.log(`📋 Session metadata:`, session.metadata);
    }

    console.log(`✅ Checkout processing completed for: ${email}`);
    return res
      .status(200)
      .json({ received: true, processed: "upgrade_checkout" });
  } catch (error) {
    console.error("❌ Error handling checkout completion:", error);
    return res.status(500).json({ error: "Checkout completion failed" });
  }
}

// NEW: Upgrade user from Payment Intent
async function upgradeUserFromPaymentIntent(
  userId,
  tier,
  period,
  subscription
) {
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
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        subscription_started_at: startDate.toISOString(),
        subscription_expires_at: expiryDate.toISOString(),
      })
      .eq("id", userId)
      .select("email, name")
      .single();

    if (error) {
      throw new Error(`Failed to upgrade user: ${error.message}`);
    }

    console.log(`✅ User upgraded via Payment Intent: ${updatedUser.email}`);

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
    console.error("Error upgrading user from Payment Intent:", error);
    throw error;
  }
}

// Upgrade existing user (Legacy)
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

// Fallback gift checkout handler (simplified)
async function handleGiftCheckoutCompleted(event) {
  try {
    const session = event.data.object;
    console.log(
      `🎁 Fallback: Processing gift checkout completion for session ${session.id}`
    );

    if (session.metadata?.gift_code) {
      console.log(`🎁 Gift code: ${session.metadata.gift_code}`);
    }

    console.log("🎁 Gift checkout completed (fallback handler)");
  } catch (error) {
    console.error("❌ Error in fallback gift handler:", error);
  }
}

// Existing webhook handlers (Enhanced with better response handling)
async function handleSubscriptionUpdated(event, res) {
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

    return res
      .status(200)
      .json({ received: true, processed: "subscription_updated" });
  } catch (error) {
    console.error("Error handling subscription update:", error);
    return res.status(500).json({ error: "Subscription update failed" });
  }
}

async function handleSubscriptionDeleted(event, res) {
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

    return res
      .status(200)
      .json({ received: true, processed: "subscription_deleted" });
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
    return res.status(500).json({ error: "Subscription deletion failed" });
  }
}

async function handlePaymentSucceeded(event, res) {
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

    return res
      .status(200)
      .json({ received: true, processed: "payment_succeeded" });
  } catch (error) {
    console.error("Error handling payment success:", error);
    return res.status(500).json({ error: "Payment success handling failed" });
  }
}

async function handlePaymentFailed(event, res) {
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

    return res
      .status(200)
      .json({ received: true, processed: "payment_failed" });
  } catch (error) {
    console.error("Error handling payment failure:", error);
    return res.status(500).json({ error: "Payment failure handling failed" });
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
