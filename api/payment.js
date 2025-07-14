// API: Payment - COMPLETE Enhanced with Bulletproof Debugging and Error Handling

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enhanced logging function
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

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

  log("info", `🔍 Payment API called: ${req.method} ${req.url}`);
  log("info", `🔍 Headers: ${Object.keys(req.headers).join(", ")}`);

  try {
    // Check if this is a Stripe webhook (has signature header)
    const sig = req.headers["stripe-signature"];

    if (sig && req.method === "POST") {
      log("info", "🪝 Detected Stripe webhook - routing to webhook handler");
      return await handleStripeWebhook(req, res);
    }

    // For non-webhook requests, parse the body manually
    let body = {};
    if (req.method === "POST") {
      const rawBody = await getRawBody(req);
      try {
        body = JSON.parse(rawBody);
        log("info", `📝 Parsed request body: ${JSON.stringify(body, null, 2)}`);
      } catch (e) {
        log("error", "❌ Invalid JSON body", e);
        return res.status(400).json({
          success: false,
          error: "Invalid JSON body",
        });
      }
    }

    // Regular API calls
    if (req.method === "GET") {
      const { action } = req.query;
      log("info", `📝 GET request with action: ${action}`);
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
      log("info", `📝 POST request with action: ${action}`);

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
          log("error", `❌ Unknown POST action: ${action}`);
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
    log("error", "❌ Payment API Error", error);
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
    log("info", "💳 Stripe configuration requested");

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
      log(
        "error",
        "🚨 STRIPE_PUBLISHABLE_KEY not found in environment variables"
      );
      return res.status(500).json({
        success: false,
        error: "Stripe configuration missing",
      });
    }

    // Validate price IDs
    const missingPriceIds = [];
    Object.entries(config.subscriptions).forEach(([tier, periods]) => {
      Object.entries(periods).forEach(([period, data]) => {
        if (!data.priceId) {
          missingPriceIds.push(`${tier}-${period}`);
        }
      });
    });

    if (missingPriceIds.length > 0) {
      log("error", `🚨 Missing price IDs: ${missingPriceIds.join(", ")}`);
    }

    log(
      "info",
      `💳 Stripe config response - Environment: ${config.environment}`
    );
    log(
      "info",
      `💳 Available tiers: ${Object.keys(config.subscriptions).join(", ")}`
    );

    return res.json({
      success: true,
      config,
    });
  } catch (error) {
    log("error", "Stripe Config Error", error);
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
    log("info", "🚀 Creating upgrade checkout session");

    // Authenticate the user
    const user = await authenticateRequest(req);
    const { tier, period } = req.body;

    log("info", `👤 User: ${user.email} (${user.id})`);
    log("info", `🎯 Target: ${tier} ${period}`);

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
      log("error", `❌ Price ID missing for ${tier} ${period}`);
      return res.status(500).json({
        success: false,
        error: "Price configuration missing",
      });
    }

    log("info", `💰 Price ID: ${priceId}`);

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

    log("info", `✅ Checkout session created: ${session.id}`);

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

    log("error", "Stripe checkout session creation error", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create checkout session",
    });
  }
}

// ENHANCED: Create Payment Intent for in-page payments
async function handleCreatePaymentIntent(req, res) {
  try {
    log("info", "💳 Creating Payment Intent");

    // Authenticate the user
    const user = await authenticateRequest(req);
    const { tier, period, amount } = req.body;

    log("info", `👤 User: ${user.email} (${user.id})`);
    log("info", `🎯 Target: ${tier} ${period} - $${amount}`);
    log("info", `📋 Current user tier: ${user.tier}`);

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
      log("error", `❌ Price ID missing for ${tier} ${period}`);
      return res.status(500).json({
        success: false,
        error: "Price configuration missing",
      });
    }

    log("info", `💰 Price ID: ${priceId}`);

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      log("info", "👤 Creating new Stripe customer");
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
      const { error: updateError } = await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      if (updateError) {
        log("error", "❌ Failed to update user with customer ID", updateError);
      } else {
        log("info", `✅ User updated with customer ID: ${customerId}`);
      }
    } else {
      log("info", `👤 Using existing customer: ${customerId}`);
    }

    // Create Payment Intent with enhanced metadata
    const paymentIntentData = {
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
        originalAmount: amount.toString(),
        timestamp: new Date().toISOString(),
      },
      description: `Mirror of Truth ${
        tier.charAt(0).toUpperCase() + tier.slice(1)
      } subscription (${period})`,
    };

    log("info", "🔄 Creating Payment Intent with data", {
      amount: paymentIntentData.amount,
      currency: paymentIntentData.currency,
      customer: paymentIntentData.customer,
      description: paymentIntentData.description,
      metadata: paymentIntentData.metadata,
    });

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    log("info", `✅ Payment Intent created successfully: ${paymentIntent.id}`);
    log("info", `📋 Payment Intent details:`, {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      customer: paymentIntent.customer,
      metadataKeys: Object.keys(paymentIntent.metadata),
    });

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

    log("error", "Payment Intent creation error", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create payment intent",
    });
  }
}

// NEW: Confirm payment and create subscription (Manual confirmation endpoint)
async function handleConfirmPayment(req, res) {
  try {
    log("info", "🔧 Manual payment confirmation requested");

    const user = await authenticateRequest(req);
    const { paymentIntentId } = req.body;

    log("info", `👤 User: ${user.email}`);
    log("info", `💳 Payment Intent: ${paymentIntentId}`);

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment Intent ID is required",
      });
    }

    // Retrieve the payment intent
    log("info", "🔄 Retrieving Payment Intent from Stripe");
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    log("info", `📋 Payment Intent status: ${paymentIntent.status}`);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: "Payment not completed",
        status: paymentIntent.status,
      });
    }

    // Extract metadata
    const { tier, period, priceId } = paymentIntent.metadata;

    if (!tier || !period || !priceId) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment metadata",
        metadata: paymentIntent.metadata,
      });
    }

    log("info", `🎯 Manual confirmation for: ${tier} ${period}`);

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: paymentIntent.customer,
      items: [{ price: priceId }],
      metadata: {
        userId: user.id,
        tier: tier,
        period: period,
        upgradeType: "manual_confirmation",
        paymentIntentId: paymentIntentId,
      },
    });

    // Update user in database
    await upgradeUserFromPaymentIntentEnhanced(
      user.id,
      tier,
      period,
      subscription,
      new Date().toISOString()
    );

    log("info", `✅ Manual subscription created: ${subscription.id}`);

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

    log("error", "Payment confirmation error", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
}

// ENHANCED: Stripe webhook handler with bulletproof debugging
async function handleStripeWebhook(req, res) {
  const webhookStart = Date.now();
  log("info", "🪝 ================================================");
  log("info", "🪝 STRIPE WEBHOOK RECEIVED");
  log("info", "🪝 ================================================");
  log("info", `🪝 Headers: ${Object.keys(req.headers).join(", ")}`);
  log("info", `🪝 Method: ${req.method}`);
  log("info", `🪝 URL: ${req.url}`);

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    log("error", "❌ No Stripe signature found in headers");
    return res.status(400).json({ error: "No signature" });
  }

  if (!webhookSecret) {
    log("error", "❌ STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event;
  let rawBody;

  try {
    // Get raw body for signature verification
    rawBody = await getRawBody(req);
    log("info", `✅ Raw body retrieved, length: ${rawBody.length}`);
  } catch (err) {
    log("error", "❌ Failed to get raw body", err);
    return res.status(400).json({ error: "Failed to read request body" });
  }

  try {
    // Verify webhook signature with raw body
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    log("info", "✅ Webhook signature verified successfully");
  } catch (err) {
    log("error", "❌ Webhook signature verification failed", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  log("info", `📦 Stripe webhook type: ${event.type}`);
  log("info", `📦 Event ID: ${event.id}`);
  log(
    "info",
    `📦 Event created: ${new Date(event.created * 1000).toISOString()}`
  );
  log("info", `📦 Event livemode: ${event.livemode}`);

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
        log("info", `⚠️ Unhandled Stripe event: ${event.type}`);
        return res.status(200).json({
          received: true,
          handled: false,
          eventType: event.type,
          processingTime: Date.now() - webhookStart,
        });
    }
  } catch (error) {
    log("error", "❌ Stripe webhook processing error", error);
    return res.status(500).json({
      error: "Webhook processing failed",
      details: error.message,
      processingTime: Date.now() - webhookStart,
    });
  }
}

// COMPLETELY BULLETPROOF: Handle Payment Intent webhooks with comprehensive debugging
async function handlePaymentIntentWebhook(event, res) {
  const timestamp = new Date().toISOString();
  const webhookId = `WHK_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  log("info", `🪝 [${webhookId}] ========================================`);
  log("info", `🪝 [${webhookId}] PAYMENT INTENT WEBHOOK STARTED`);
  log("info", `🪝 [${webhookId}] ========================================`);

  try {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata || {};

    log("info", `💳 [${webhookId}] Payment Intent Analysis:`);
    log("info", `💳 [${webhookId}]   ID: ${paymentIntent.id}`);
    log("info", `💳 [${webhookId}]   Status: ${paymentIntent.status}`);
    log(
      "info",
      `💳 [${webhookId}]   Amount: $${
        paymentIntent.amount / 100
      } ${paymentIntent.currency.toUpperCase()}`
    );
    log("info", `💳 [${webhookId}]   Customer: ${paymentIntent.customer}`);
    log(
      "info",
      `💳 [${webhookId}]   Created: ${new Date(
        paymentIntent.created * 1000
      ).toISOString()}`
    );
    log(
      "info",
      `💳 [${webhookId}]   Payment Method: ${paymentIntent.payment_method}`
    );

    log("info", `📋 [${webhookId}] Complete Metadata:`);
    if (Object.keys(metadata).length === 0) {
      log("warn", `📋 [${webhookId}]   ⚠️ NO METADATA FOUND`);
    } else {
      Object.entries(metadata).forEach(([key, value]) => {
        log("info", `📋 [${webhookId}]   ${key}: ${value}`);
      });
    }

    // Validate this is a subscription upgrade
    const { type, userId, tier, period, priceId, email } = metadata;

    log("info", `🔍 [${webhookId}] Metadata Validation:`);
    log(
      "info",
      `🔍 [${webhookId}]   Type: "${type}" (expected: "subscription_upgrade")`
    );
    log(
      "info",
      `🔍 [${webhookId}]   UserId: "${userId}" ${userId ? "✅" : "❌ MISSING"}`
    );
    log(
      "info",
      `🔍 [${webhookId}]   Email: "${email}" ${email ? "✅" : "❌ MISSING"}`
    );
    log(
      "info",
      `🔍 [${webhookId}]   Tier: "${tier}" ${tier ? "✅" : "❌ MISSING"}`
    );
    log(
      "info",
      `🔍 [${webhookId}]   Period: "${period}" ${period ? "✅" : "❌ MISSING"}`
    );
    log(
      "info",
      `🔍 [${webhookId}]   PriceId: "${priceId}" ${
        priceId ? "✅" : "❌ MISSING"
      }`
    );

    if (type !== "subscription_upgrade") {
      log(
        "info",
        `ℹ️ [${webhookId}] Not a subscription upgrade (type: "${type}"), skipping`
      );
      return res.status(200).json({
        received: true,
        processed: "not_subscription_upgrade",
        eventType: type,
        webhookId: webhookId,
        timestamp: timestamp,
      });
    }

    // Validate required metadata
    const requiredFields = { userId, tier, period, priceId, email };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      log(
        "error",
        `❌ [${webhookId}] Missing required metadata fields: ${missingFields.join(
          ", "
        )}`
      );
      return res.status(200).json({
        received: true,
        processed: "missing_metadata",
        missingFields: missingFields,
        webhookId: webhookId,
        timestamp: timestamp,
      });
    }

    log(
      "info",
      `🚀 [${webhookId}] ✅ All validations passed. Processing subscription upgrade...`
    );
    log("info", `👤 [${webhookId}] Target User: ${userId} (${email})`);
    log("info", `🎯 [${webhookId}] Target Subscription: ${tier} (${period})`);
    log("info", `💰 [${webhookId}] Price ID: ${priceId}`);

    try {
      // Step 1: Check for existing subscriptions to prevent duplicates
      log(
        "info",
        `🔍 [${webhookId}] Step 1: Checking for duplicate subscriptions...`
      );
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: paymentIntent.customer,
        status: "all",
        limit: 50, // Increased limit for thoroughness
      });

      log(
        "info",
        `📊 [${webhookId}] Found ${existingSubscriptions.data.length} existing subscriptions for customer`
      );

      // Check for duplicates by payment intent ID
      const duplicateByPaymentIntent = existingSubscriptions.data.find(
        (sub) => sub.metadata.paymentIntentId === paymentIntent.id
      );

      if (duplicateByPaymentIntent) {
        log(
          "warn",
          `⚠️ [${webhookId}] Duplicate subscription found by payment intent: ${duplicateByPaymentIntent.id}`
        );
        return res.status(200).json({
          received: true,
          processed: "duplicate_subscription_exists",
          subscriptionId: duplicateByPaymentIntent.id,
          webhookId: webhookId,
          timestamp: timestamp,
        });
      }

      // Also check for recent duplicates by metadata
      const recentDuplicates = existingSubscriptions.data.filter(
        (sub) =>
          sub.metadata.userId === userId &&
          sub.metadata.tier === tier &&
          sub.metadata.period === period &&
          Date.now() - sub.created * 1000 < 300000 // Created within last 5 minutes
      );

      if (recentDuplicates.length > 0) {
        log(
          "warn",
          `⚠️ [${webhookId}] Recent duplicate subscription found: ${recentDuplicates[0].id}`
        );
        return res.status(200).json({
          received: true,
          processed: "recent_duplicate_exists",
          subscriptionId: recentDuplicates[0].id,
          webhookId: webhookId,
          timestamp: timestamp,
        });
      }

      log("info", `✅ [${webhookId}] Step 1: No duplicates found`);

      // Step 2: Verify user exists in database
      log(
        "info",
        `🔍 [${webhookId}] Step 2: Verifying user exists in database...`
      );
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select(
          "id, email, name, tier, stripe_customer_id, subscription_status, created_at"
        )
        .eq("id", userId)
        .single();

      if (fetchError || !existingUser) {
        log(
          "error",
          `❌ [${webhookId}] User ${userId} not found in database`,
          fetchError
        );
        return res.status(200).json({
          received: true,
          processed: "user_not_found",
          userId: userId,
          error: fetchError?.message,
          webhookId: webhookId,
          timestamp: timestamp,
        });
      }

      log("info", `✅ [${webhookId}] Step 2: User verified successfully`);
      log("info", `👤 [${webhookId}] Current user state:`);
      log("info", `👤 [${webhookId}]   Email: ${existingUser.email}`);
      log("info", `👤 [${webhookId}]   Name: ${existingUser.name}`);
      log("info", `👤 [${webhookId}]   Current Tier: ${existingUser.tier}`);
      log("info", `👤 [${webhookId}]   Target Tier: ${tier}`);
      log(
        "info",
        `👤 [${webhookId}]   Subscription Status: ${existingUser.subscription_status}`
      );
      log(
        "info",
        `👤 [${webhookId}]   Stripe Customer: ${existingUser.stripe_customer_id}`
      );

      // Step 3: Create Stripe subscription
      log("info", `🔍 [${webhookId}] Step 3: Creating Stripe subscription...`);
      const subscriptionData = {
        customer: paymentIntent.customer,
        items: [{ price: priceId }],
        metadata: {
          userId: userId,
          tier: tier,
          period: period,
          upgradeType: "webhook_payment_intent",
          paymentIntentId: paymentIntent.id,
          originalEmail: email,
          createdAt: timestamp,
          webhookProcessedAt: timestamp,
          webhookId: webhookId,
        },
      };

      log("info", `📋 [${webhookId}] Subscription creation parameters:`);
      log("info", `📋 [${webhookId}]   Customer: ${subscriptionData.customer}`);
      log("info", `📋 [${webhookId}]   Price: ${priceId}`);
      log(
        "info",
        `📋 [${webhookId}]   Metadata count: ${
          Object.keys(subscriptionData.metadata).length
        }`
      );

      const subscription = await stripe.subscriptions.create(subscriptionData);

      log(
        "info",
        `✅ [${webhookId}] Step 3: Stripe subscription created successfully`
      );
      log("info", `🎫 [${webhookId}] Subscription Details:`);
      log("info", `🎫 [${webhookId}]   ID: ${subscription.id}`);
      log("info", `🎫 [${webhookId}]   Status: ${subscription.status}`);
      log("info", `🎫 [${webhookId}]   Customer: ${subscription.customer}`);
      log(
        "info",
        `🎫 [${webhookId}]   Current Period Start: ${new Date(
          subscription.current_period_start * 1000
        ).toISOString()}`
      );
      log(
        "info",
        `🎫 [${webhookId}]   Current Period End: ${new Date(
          subscription.current_period_end * 1000
        ).toISOString()}`
      );

      // Step 4: Update user in database with enhanced error handling and retries
      log("info", `🔍 [${webhookId}] Step 4: Updating user in database...`);

      let updateSuccess = false;
      let updateAttempts = 0;
      const maxUpdateAttempts = 5;
      let lastUpdateError = null;

      while (!updateSuccess && updateAttempts < maxUpdateAttempts) {
        updateAttempts++;
        log(
          "info",
          `🔄 [${webhookId}] Database update attempt ${updateAttempts}/${maxUpdateAttempts}`
        );

        try {
          await upgradeUserFromPaymentIntentEnhanced(
            userId,
            tier,
            period,
            subscription,
            timestamp,
            webhookId
          );
          updateSuccess = true;
          log(
            "info",
            `✅ [${webhookId}] Database update successful on attempt ${updateAttempts}`
          );
        } catch (updateError) {
          lastUpdateError = updateError;
          log(
            "error",
            `❌ [${webhookId}] Database update attempt ${updateAttempts} failed`,
            updateError
          );

          if (updateAttempts >= maxUpdateAttempts) {
            throw updateError;
          }

          // Exponential backoff for retries
          const waitTime = Math.min(
            1000 * Math.pow(2, updateAttempts - 1),
            5000
          );
          log(
            "info",
            `⏳ [${webhookId}] Waiting ${waitTime}ms before retry...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      log(
        "info",
        `🎉 [${webhookId}] ==========================================`
      );
      log(
        "info",
        `🎉 [${webhookId}] SUBSCRIPTION UPGRADE COMPLETED SUCCESSFULLY!`
      );
      log(
        "info",
        `🎉 [${webhookId}] ==========================================`
      );
      log("info", `✅ [${webhookId}] Summary:`);
      log("info", `✅ [${webhookId}]   User: ${userId} (${email})`);
      log("info", `✅ [${webhookId}]   Payment Intent: ${paymentIntent.id}`);
      log("info", `✅ [${webhookId}]   Subscription: ${subscription.id}`);
      log(
        "info",
        `✅ [${webhookId}]   Upgrade: ${existingUser.tier} → ${tier} (${period})`
      );
      log("info", `✅ [${webhookId}]   Status: ${subscription.status}`);
      log(
        "info",
        `✅ [${webhookId}]   Processing Time: ${
          Date.now() - new Date(timestamp).getTime()
        }ms`
      );

      return res.status(200).json({
        received: true,
        processed: "subscription_created_successfully",
        subscriptionId: subscription.id,
        userId: userId,
        tier: tier,
        period: period,
        webhookId: webhookId,
        timestamp: timestamp,
        processingTimeMs: Date.now() - new Date(timestamp).getTime(),
        updateAttempts: updateAttempts,
      });
    } catch (subscriptionError) {
      log(
        "error",
        `💥 [${webhookId}] CRITICAL ERROR in subscription processing:`,
        subscriptionError
      );
      log("error", `💥 [${webhookId}] Error name: ${subscriptionError.name}`);
      log(
        "error",
        `💥 [${webhookId}] Error message: ${subscriptionError.message}`
      );
      log("error", `💥 [${webhookId}] Error stack:`, subscriptionError.stack);

      // Still return 200 to prevent Stripe retries, but log the detailed error
      return res.status(200).json({
        received: true,
        processed: "subscription_creation_failed",
        error: subscriptionError.message,
        userId: userId,
        paymentIntentId: paymentIntent.id,
        webhookId: webhookId,
        timestamp: timestamp,
      });
    }
  } catch (error) {
    log(
      "error",
      `💥 [${webhookId}] CRITICAL Payment Intent webhook error:`,
      error
    );
    return res.status(500).json({
      error: "Payment Intent processing failed",
      details: error.message,
      webhookId: webhookId,
      timestamp: timestamp,
    });
  }
}

// BULLETPROOF: Enhanced user upgrade function with comprehensive error handling and verification
async function upgradeUserFromPaymentIntentEnhanced(
  userId,
  tier,
  period,
  subscription,
  timestamp,
  webhookId = "MANUAL"
) {
  log(
    "info",
    `🔄 [${webhookId}] Starting comprehensive database update for user: ${userId}`
  );
  log(
    "info",
    `📊 [${webhookId}] Update details: ${tier} ${period} subscription`
  );
  log("info", `🎫 [${webhookId}] Stripe subscription ID: ${subscription.id}`);
  log("info", `👤 [${webhookId}] Stripe customer ID: ${subscription.customer}`);

  try {
    // Step 1: Verify user exists and get current state
    log("info", `🔍 [${webhookId}] Step 1: Fetching current user state...`);
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError) {
      log(
        "error",
        `❌ [${webhookId}] Failed to fetch user ${userId}`,
        fetchError
      );
      throw new Error(`User fetch failed: ${fetchError.message}`);
    }

    if (!currentUser) {
      log(
        "error",
        `❌ [${webhookId}] User ${userId} does not exist in database`
      );
      throw new Error(`User ${userId} not found`);
    }

    log("info", `✅ [${webhookId}] Current user state retrieved:`);
    log("info", `👤 [${webhookId}]   Email: ${currentUser.email}`);
    log("info", `👤 [${webhookId}]   Name: ${currentUser.name || "N/A"}`);
    log("info", `👤 [${webhookId}]   Current Tier: ${currentUser.tier}`);
    log(
      "info",
      `👤 [${webhookId}]   Current Status: ${
        currentUser.subscription_status || "N/A"
      }`
    );
    log(
      "info",
      `👤 [${webhookId}]   Existing Customer ID: ${
        currentUser.stripe_customer_id || "N/A"
      }`
    );
    log(
      "info",
      `👤 [${webhookId}]   Existing Subscription ID: ${
        currentUser.stripe_subscription_id || "N/A"
      }`
    );

    // Step 2: Calculate subscription dates
    log("info", `🔍 [${webhookId}] Step 2: Calculating subscription dates...`);
    const startDate = new Date();
    const expiryDate = new Date(startDate);

    if (period === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (period === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      throw new Error(`Invalid period: ${period}`);
    }

    log("info", `📅 [${webhookId}] Subscription dates calculated:`);
    log("info", `📅 [${webhookId}]   Start: ${startDate.toISOString()}`);
    log("info", `📅 [${webhookId}]   Expiry: ${expiryDate.toISOString()}`);

    // Step 3: Prepare comprehensive update data
    log("info", `🔍 [${webhookId}] Step 3: Preparing update data...`);
    const updateData = {
      tier: tier,
      subscription_status: "active",
      subscription_period: period,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      subscription_started_at: startDate.toISOString(),
      subscription_expires_at: expiryDate.toISOString(),
      updated_at: new Date().toISOString(),
    };

    log("info", `📋 [${webhookId}] Complete update data:`);
    Object.entries(updateData).forEach(([key, value]) => {
      log("info", `📋 [${webhookId}]   ${key}: ${value}`);
    });

    // Step 4: Execute database update with comprehensive error handling
    log("info", `🔍 [${webhookId}] Step 4: Executing database update...`);
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select(
        "id, email, name, tier, subscription_status, stripe_subscription_id, stripe_customer_id"
      )
      .single();

    if (updateError) {
      log("error", `❌ [${webhookId}] Database update failed:`, updateError);
      log("error", `❌ [${webhookId}] Update error code: ${updateError.code}`);
      log(
        "error",
        `❌ [${webhookId}] Update error details: ${updateError.details}`
      );
      log("error", `❌ [${webhookId}] Update error hint: ${updateError.hint}`);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    if (!updatedUser) {
      log(
        "error",
        `❌ [${webhookId}] Update executed but no user data returned`
      );
      throw new Error("Update succeeded but no user data returned");
    }

    log("info", `✅ [${webhookId}] User successfully updated in database:`);
    log("info", `👤 [${webhookId}]   Email: ${updatedUser.email}`);
    log("info", `👤 [${webhookId}]   Name: ${updatedUser.name || "N/A"}`);
    log("info", `👤 [${webhookId}]   New Tier: ${updatedUser.tier}`);
    log(
      "info",
      `👤 [${webhookId}]   Status: ${updatedUser.subscription_status}`
    );
    log(
      "info",
      `👤 [${webhookId}]   Subscription ID: ${updatedUser.stripe_subscription_id}`
    );
    log(
      "info",
      `👤 [${webhookId}]   Customer ID: ${updatedUser.stripe_customer_id}`
    );

    // Step 5: Verification - Read back the updated data to ensure consistency
    log(
      "info",
      `🔍 [${webhookId}] Step 5: Verifying update with database read-back...`
    );
    const { data: verifiedUser, error: verifyError } = await supabase
      .from("users")
      .select(
        "tier, subscription_status, stripe_subscription_id, subscription_period, subscription_started_at"
      )
      .eq("id", userId)
      .single();

    if (verifyError) {
      log("warn", `⚠️ [${webhookId}] Could not verify update:`, verifyError);
    } else {
      log("info", `✅ [${webhookId}] Verification successful:`, verifiedUser);

      // Critical verification: Ensure the tier was actually updated
      if (verifiedUser.tier !== tier) {
        log("error", `❌ [${webhookId}] CRITICAL: Tier not updated correctly!`);
        log(
          "error",
          `❌ [${webhookId}] Expected: ${tier}, Got: ${verifiedUser.tier}`
        );
        throw new Error(
          `Tier update verification failed: expected ${tier}, got ${verifiedUser.tier}`
        );
      } else {
        log(
          "info",
          `✅ [${webhookId}] Tier update verified: ${verifiedUser.tier}`
        );
      }

      // Verify subscription ID
      if (verifiedUser.stripe_subscription_id !== subscription.id) {
        log(
          "error",
          `❌ [${webhookId}] CRITICAL: Subscription ID not updated correctly!`
        );
        log(
          "error",
          `❌ [${webhookId}] Expected: ${subscription.id}, Got: ${verifiedUser.stripe_subscription_id}`
        );
        throw new Error(`Subscription ID verification failed`);
      } else {
        log(
          "info",
          `✅ [${webhookId}] Subscription ID verified: ${verifiedUser.stripe_subscription_id}`
        );
      }
    }

    // Step 6: Send upgrade confirmation email (non-blocking)
    log(
      "info",
      `🔍 [${webhookId}] Step 6: Scheduling upgrade confirmation email...`
    );
    try {
      // Schedule email to send after a delay to avoid blocking the webhook
      setTimeout(async () => {
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
          log(
            "info",
            `📧 [${webhookId}] Upgrade confirmation email sent successfully`
          );
        } catch (emailError) {
          log(
            "warn",
            `⚠️ [${webhookId}] Upgrade email failed (non-critical):`,
            emailError
          );
        }
      }, 2000); // Send after 2 seconds

      log("info", `📧 [${webhookId}] Email scheduled successfully`);
    } catch (emailError) {
      log(
        "warn",
        `⚠️ [${webhookId}] Email scheduling failed (non-critical):`,
        emailError
      );
    }

    log("info", `🎉 [${webhookId}] ==========================================`);
    log(
      "info",
      `🎉 [${webhookId}] UPGRADE COMPLETE: User ${userId} successfully upgraded to ${tier} (${period})`
    );
    log("info", `🎉 [${webhookId}] ==========================================`);
  } catch (error) {
    log(
      "error",
      `💥 [${webhookId}] Critical error in upgradeUserFromPaymentIntentEnhanced:`,
      error
    );
    log("error", `💥 [${webhookId}] Error name: ${error.name}`);
    log("error", `💥 [${webhookId}] Error message: ${error.message}`);
    log("error", `💥 [${webhookId}] Error stack:`, error.stack);
    throw error; // Re-throw to be handled by caller
  }
}

// Enhanced: Handle Checkout Session webhooks with routing
async function handleCheckoutWebhook(event, res) {
  try {
    const session = event.data.object;
    const webhookType = session.metadata?.type;

    log("info", `🔀 Routing checkout webhook type: ${webhookType}`);

    if (webhookType === "gift") {
      log("info", "🎁 Routing to gift webhook handler");
      return await routeToGiftWebhook(event, res);
    } else if (
      webhookType === "upgrade" ||
      session.metadata?.upgradeExistingUser === "true"
    ) {
      log("info", "🚀 Processing upgrade checkout webhook");
      return await handleUpgradeCheckoutCompleted(event, res);
    } else {
      log("info", "⚠️ Unknown checkout webhook type, processing as upgrade");
      return await handleUpgradeCheckoutCompleted(event, res);
    }
  } catch (error) {
    log("error", "❌ Checkout webhook error", error);
    return res.status(500).json({ error: "Checkout processing failed" });
  }
}

// Route gift webhooks to gifting API
async function routeToGiftWebhook(event, res) {
  try {
    log("info", "🎁 Forwarding gift webhook to gifting API");

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
      log("info", "✅ Gift webhook forwarded successfully");
      return res.status(200).json({ received: true, forwarded: "gift" });
    } else {
      log("error", "❌ Failed to forward gift webhook");
      return res.status(500).json({ error: "Failed to forward gift webhook" });
    }
  } catch (error) {
    log("error", "❌ Error forwarding gift webhook", error);

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

    log("info", `🎉 Checkout completed: ${email} → ${tier} (${period})`);

    if (upgradeExistingUser === "true" && userId) {
      log("info", `⬆️ Upgrading existing user: ${userId}`);
      await upgradeExistingUser(userId, tier, period, session);
    } else {
      log("warn", `⚠️ No userId found in metadata or not an upgrade`);
      log("warn", `📋 Session metadata:`, session.metadata);
    }

    log("info", `✅ Checkout processing completed for: ${email}`);
    return res
      .status(200)
      .json({ received: true, processed: "upgrade_checkout" });
  } catch (error) {
    log("error", "❌ Error handling checkout completion", error);
    return res.status(500).json({ error: "Checkout completion failed" });
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

    log("info", `✅ User upgraded successfully: ${updatedUser.email}`);

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
      log("warn", "Upgrade email failed", emailError);
    }
  } catch (error) {
    log("error", "Error upgrading user", error);
    throw error;
  }
}

// Fallback gift checkout handler (simplified)
async function handleGiftCheckoutCompleted(event) {
  try {
    const session = event.data.object;
    log(
      "info",
      `🎁 Fallback: Processing gift checkout completion for session ${session.id}`
    );

    if (session.metadata?.gift_code) {
      log("info", `🎁 Gift code: ${session.metadata.gift_code}`);
    }

    log("info", "🎁 Gift checkout completed (fallback handler)");
  } catch (error) {
    log("error", "❌ Error in fallback gift handler", error);
  }
}

// Enhanced webhook handlers with better response handling
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
      log("error", "Error updating subscription", error);
    } else {
      log("info", `🔄 Subscription updated: ${subscription.id} → ${status}`);
    }

    return res
      .status(200)
      .json({ received: true, processed: "subscription_updated" });
  } catch (error) {
    log("error", "Error handling subscription update", error);
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
      log("error", "Error canceling subscription", error);
    } else {
      log("info", `❌ Subscription canceled: ${subscription.id}`);
    }

    return res
      .status(200)
      .json({ received: true, processed: "subscription_deleted" });
  } catch (error) {
    log("error", "Error handling subscription deletion", error);
    return res.status(500).json({ error: "Subscription deletion failed" });
  }
}

async function handlePaymentSucceeded(event, res) {
  try {
    const invoice = event.data.object;
    log("info", `💰 Payment succeeded: ${invoice.id}`);

    if (invoice.subscription) {
      const customerId = invoice.customer;

      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "active",
        })
        .eq("stripe_customer_id", customerId);

      if (!error) {
        log("info", `✅ Subscription reactivated for payment: ${invoice.id}`);
      }
    }

    return res
      .status(200)
      .json({ received: true, processed: "payment_succeeded" });
  } catch (error) {
    log("error", "Error handling payment success", error);
    return res.status(500).json({ error: "Payment success handling failed" });
  }
}

async function handlePaymentFailed(event, res) {
  try {
    const invoice = event.data.object;
    log("info", `💸 Payment failed: ${invoice.id}`);

    if (invoice.subscription) {
      const customerId = invoice.customer;

      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "past_due",
        })
        .eq("stripe_customer_id", customerId);

      if (!error) {
        log("info", `⚠️ Subscription marked past due: ${invoice.subscription}`);
      }
    }

    return res
      .status(200)
      .json({ received: true, processed: "payment_failed" });
  } catch (error) {
    log("error", "Error handling payment failure", error);
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

  const priceId = priceMap[tier]?.[period];

  if (!priceId) {
    log("error", `❌ Price ID not found for ${tier} ${period}`);
    log("error", `❌ Available configurations:`, priceMap);
  }

  return priceId;
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
