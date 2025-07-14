// API: Payment - FIXED with Enhanced Debugging and Error Handling

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

// ENHANCED: Create Payment Intent for in-page payments
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

    // Create Payment Intent with enhanced metadata
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
        originalAmount: amount.toString(),
        timestamp: new Date().toISOString(),
      },
      description: `Mirror of Truth ${
        tier.charAt(0).toUpperCase() + tier.slice(1)
      } subscription (${period})`,
    });

    console.log(
      `✅ Payment Intent created: ${paymentIntent.id} for ${user.email}`
    );
    console.log(`📋 Payment Intent metadata:`, paymentIntent.metadata);

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

// NEW: Confirm payment and create subscription (Optional - webhook handles this)
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
        upgradeType: "manual_confirmation",
        paymentIntentId: paymentIntentId,
      },
    });

    // Update user in database
    await upgradeUserFromPaymentIntent(user.id, tier, period, subscription);

    console.log(
      `✅ Manual subscription created: ${subscription.id} for ${user.email}`
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

// ENHANCED: Stripe webhook handler with better debugging and error handling
async function handleStripeWebhook(req, res) {
  console.log("🪝 Webhook received - Headers:", Object.keys(req.headers));

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
  console.log(
    `📦 Event created: ${new Date(event.created * 1000).toISOString()}`
  );

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
    console.error("❌ Error stack:", error.stack);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

// COMPLETELY REWRITTEN: Handle Payment Intent webhooks with bulletproof processing
async function handlePaymentIntentWebhook(event, res) {
  try {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata || {};

    console.log(`💳 Payment Intent succeeded: ${paymentIntent.id}`);
    console.log(`📋 Full Metadata:`, JSON.stringify(metadata, null, 2));
    console.log(`👤 Customer: ${paymentIntent.customer}`);
    console.log(`💰 Amount: $${paymentIntent.amount / 100}`);
    console.log(`🏷️ Type: ${metadata.type}`);

    // Validate this is a subscription upgrade
    const { type, userId, tier, period, priceId, email } = metadata;

    if (type !== "subscription_upgrade") {
      console.log(
        `ℹ️ Payment Intent not for subscription upgrade (type: ${type})`
      );
      return res.status(200).json({
        received: true,
        processed: "not_subscription_upgrade",
      });
    }

    // Validate required metadata
    const requiredFields = { userId, tier, period, priceId, email };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error(
        `❌ Missing required metadata fields: ${missingFields.join(", ")}`
      );
      return res.status(200).json({
        received: true,
        processed: "missing_metadata",
        missingFields: missingFields,
      });
    }

    console.log(
      `🚀 Processing subscription upgrade for user: ${userId} (${email})`
    );

    try {
      // Step 1: Check if subscription already exists for this payment intent
      console.log(`🔍 Checking for existing subscriptions...`);
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: paymentIntent.customer,
        status: "all",
        limit: 20, // Increased limit to catch more cases
      });

      const duplicateSubscription = existingSubscriptions.data.find(
        (sub) => sub.metadata.paymentIntentId === paymentIntent.id
      );

      if (duplicateSubscription) {
        console.log(
          `⚠️ Subscription already exists for payment intent: ${duplicateSubscription.id}`
        );
        return res.status(200).json({
          received: true,
          processed: "duplicate_subscription_exists",
          subscriptionId: duplicateSubscription.id,
        });
      }

      // Step 2: Verify user exists in database
      console.log(`🔍 Verifying user exists in database...`);
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id, email, name, tier, stripe_customer_id")
        .eq("id", userId)
        .single();

      if (fetchError || !existingUser) {
        console.error(`❌ User ${userId} not found in database:`, fetchError);
        return res.status(200).json({
          received: true,
          processed: "user_not_found",
          userId: userId,
          error: fetchError?.message,
        });
      }

      console.log(
        `✅ User verified: ${existingUser.email} (current tier: ${existingUser.tier})`
      );

      // Step 3: Create Stripe subscription
      console.log(`🔄 Creating Stripe subscription...`);
      const subscription = await stripe.subscriptions.create({
        customer: paymentIntent.customer,
        items: [{ price: priceId }],
        metadata: {
          userId: userId,
          tier: tier,
          period: period,
          upgradeType: "webhook_payment_intent",
          paymentIntentId: paymentIntent.id,
          originalEmail: email,
          createdAt: new Date().toISOString(),
        },
      });

      console.log(`✅ Stripe subscription created: ${subscription.id}`);

      // Step 4: Update user in database with retry mechanism
      console.log(`🔄 Updating user in database...`);
      let updateSuccess = false;
      let updateAttempts = 0;
      const maxUpdateAttempts = 3;

      while (!updateSuccess && updateAttempts < maxUpdateAttempts) {
        updateAttempts++;
        try {
          await upgradeUserFromPaymentIntent(
            userId,
            tier,
            period,
            subscription
          );
          updateSuccess = true;
          console.log(
            `✅ Database update successful on attempt ${updateAttempts}`
          );
        } catch (updateError) {
          console.error(
            `❌ Database update attempt ${updateAttempts} failed:`,
            updateError
          );
          if (updateAttempts >= maxUpdateAttempts) {
            throw updateError;
          }
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * updateAttempts)
          );
        }
      }

      console.log(
        `🎉 COMPLETE: Subscription created and user upgraded successfully!`
      );
      console.log(`   - User: ${userId} (${email})`);
      console.log(`   - Subscription: ${subscription.id}`);
      console.log(`   - Tier: ${tier} (${period})`);

      return res.status(200).json({
        received: true,
        processed: "subscription_created_successfully",
        subscriptionId: subscription.id,
        userId: userId,
        tier: tier,
        period: period,
      });
    } catch (subscriptionError) {
      console.error(
        `💥 Critical error processing subscription:`,
        subscriptionError
      );
      console.error(`💥 Error stack:`, subscriptionError.stack);

      // Still return 200 to prevent Stripe retries, but log the detailed error
      return res.status(200).json({
        received: true,
        processed: "subscription_creation_failed",
        error: subscriptionError.message,
        userId: userId,
        paymentIntentId: paymentIntent.id,
      });
    }
  } catch (error) {
    console.error("💥 Critical Payment Intent webhook error:", error);
    console.error("💥 Error stack:", error.stack);
    return res.status(500).json({
      error: "Payment Intent processing failed",
      details: error.message,
    });
  }
}

// BULLETPROOF: Upgrade user from Payment Intent with comprehensive error handling
async function upgradeUserFromPaymentIntent(
  userId,
  tier,
  period,
  subscription
) {
  console.log(`🔄 Starting comprehensive database update for user: ${userId}`);
  console.log(`📊 Update details: ${tier} ${period} subscription`);
  console.log(`🎫 Stripe subscription ID: ${subscription.id}`);
  console.log(`👤 Stripe customer ID: ${subscription.customer}`);

  try {
    // Step 1: Verify user exists and get current state
    console.log(`🔍 Step 1: Fetching current user state...`);
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error(`❌ Failed to fetch user ${userId}:`, fetchError);
      throw new Error(`User fetch failed: ${fetchError.message}`);
    }

    if (!currentUser) {
      console.error(`❌ User ${userId} does not exist in database`);
      throw new Error(`User ${userId} not found`);
    }

    console.log(`✅ Current user state:`, {
      email: currentUser.email,
      name: currentUser.name,
      tier: currentUser.tier,
      subscription_status: currentUser.subscription_status,
      stripe_customer_id: currentUser.stripe_customer_id,
    });

    // Step 2: Calculate subscription dates
    console.log(`🔍 Step 2: Calculating subscription dates...`);
    const startDate = new Date();
    const expiryDate = new Date(startDate);

    if (period === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (period === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      throw new Error(`Invalid period: ${period}`);
    }

    console.log(`📅 Subscription dates calculated:`);
    console.log(`   Start: ${startDate.toISOString()}`);
    console.log(`   Expiry: ${expiryDate.toISOString()}`);

    // Step 3: Prepare comprehensive update data
    console.log(`🔍 Step 3: Preparing update data...`);
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

    console.log(`📋 Complete update data:`, updateData);

    // Step 4: Execute database update with comprehensive error handling
    console.log(`🔍 Step 4: Executing database update...`);
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select(
        "id, email, name, tier, subscription_status, stripe_subscription_id"
      )
      .single();

    if (updateError) {
      console.error(`❌ Database update failed:`, updateError);
      console.error(`❌ Update error code:`, updateError.code);
      console.error(`❌ Update error details:`, updateError.details);
      console.error(`❌ Update error hint:`, updateError.hint);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    if (!updatedUser) {
      console.error(`❌ Update executed but no user data returned`);
      throw new Error("Update succeeded but no user data returned");
    }

    console.log(`✅ User successfully updated in database:`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   New Tier: ${updatedUser.tier}`);
    console.log(`   Status: ${updatedUser.subscription_status}`);
    console.log(`   Subscription ID: ${updatedUser.stripe_subscription_id}`);

    // Step 5: Verification - Read back the updated data
    console.log(`🔍 Step 5: Verifying update by reading back data...`);
    const { data: verifiedUser, error: verifyError } = await supabase
      .from("users")
      .select(
        "tier, subscription_status, stripe_subscription_id, subscription_period"
      )
      .eq("id", userId)
      .single();

    if (verifyError) {
      console.warn(`⚠️ Could not verify update:`, verifyError);
    } else {
      console.log(`✅ Verification successful:`, verifiedUser);

      // Double-check that the tier was actually updated
      if (verifiedUser.tier !== tier) {
        console.error(
          `❌ CRITICAL: Tier not updated correctly! Expected: ${tier}, Got: ${verifiedUser.tier}`
        );
        throw new Error(
          `Tier update verification failed: expected ${tier}, got ${verifiedUser.tier}`
        );
      } else {
        console.log(`✅ Tier update verified: ${verifiedUser.tier}`);
      }
    }

    // Step 6: Send upgrade confirmation email (non-blocking)
    console.log(`🔍 Step 6: Sending upgrade confirmation email...`);
    try {
      // Don't await this - let it run in the background
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
          console.log(`📧 Upgrade confirmation email sent successfully`);
        } catch (emailError) {
          console.warn(
            "⚠️ Upgrade email failed (non-critical):",
            emailError.message
          );
        }
      }, 1000); // Send after 1 second delay
    } catch (emailError) {
      console.warn(
        "⚠️ Email scheduling failed (non-critical):",
        emailError.message
      );
    }

    console.log(
      `🎉 UPGRADE COMPLETE: User ${userId} successfully upgraded to ${tier} (${period})`
    );
  } catch (error) {
    console.error("💥 Critical error in upgradeUserFromPaymentIntent:", error);
    console.error("💥 Error name:", error.name);
    console.error("💥 Error message:", error.message);
    console.error("💥 Error stack:", error.stack);
    throw error; // Re-throw to be handled by caller
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
