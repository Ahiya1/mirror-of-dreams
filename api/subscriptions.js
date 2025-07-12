// api/subscriptions.js - Mirror of Truth Subscription Management with Stripe

const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Subscription pricing
const SUBSCRIPTION_PRICING = {
  essential: {
    monthly: 4.99,
    yearly: 49.99,
  },
  premium: {
    monthly: 9.99,
    yearly: 99.99,
  },
};

// Gift duration pricing (Essential/Premium for 1mo, 3mo, 1yr)
const GIFT_PRICING = {
  essential: {
    "1mo": 4.99,
    "3mo": 12.99, // Discounted from 14.97
    "1yr": 49.99,
  },
  premium: {
    "1mo": 9.99,
    "3mo": 24.99, // Discounted from 29.97
    "1yr": 99.99,
  },
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
      case "get-current":
        return await handleGetCurrentSubscription(req, res);
      case "create-subscription":
        return await handleCreateSubscription(req, res);
      case "cancel-subscription":
        return await handleCancelSubscription(req, res);
      case "create-gift-checkout":
        return await handleCreateGiftCheckout(req, res);
      case "redeem-gift":
        return await handleRedeemGift(req, res);
      case "validate-gift":
        return await handleValidateGift(req, res);
      case "get-pricing":
        return await handleGetPricing(req, res);
      case "webhook":
        return await handleStripeWebhook(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
    }
  } catch (error) {
    console.error("Subscriptions API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Subscription service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get current user subscription
async function handleGetCurrentSubscription(req, res) {
  try {
    const user = await authenticateRequest(req);

    const { data: subscription, error } = await supabase
      .from("users")
      .select(
        `
        tier, subscription_status, subscription_period, stripe_subscription_id,
        subscription_started_at, subscription_expires_at
      `
      )
      .eq("id", user.id)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to get subscription details",
      });
    }

    return res.json({
      success: true,
      subscription: {
        tier: subscription.tier,
        status: subscription.subscription_status,
        period: subscription.subscription_period,
        startedAt: subscription.subscription_started_at,
        expiresAt: subscription.subscription_expires_at,
        isActive: subscription.subscription_status === "active",
        canUpgrade: subscription.tier === "essential",
        canDowngrade: subscription.tier === "premium",
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

// Create new subscription (for register flow)
async function handleCreateSubscription(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { tier, period, stripeSubscriptionId, stripeCustomerId } = req.body;

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

    // Calculate expiry date
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (period === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // Update user subscription
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        tier: tier,
        subscription_status: "active",
        subscription_period: period,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        subscription_started_at: startDate.toISOString(),
        subscription_expires_at: expiryDate.toISOString(),
      })
      .eq("id", user.id)
      .select("id, email, tier, subscription_status")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to create subscription",
      });
    }

    console.log(
      `🚀 Subscription created: ${updatedUser.email} → ${tier} (${period})`
    );

    return res.json({
      success: true,
      message: "Subscription created successfully",
      subscription: {
        tier: updatedUser.tier,
        status: updatedUser.subscription_status,
        period: period,
        startedAt: startDate.toISOString(),
        expiresAt: expiryDate.toISOString(),
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

// Cancel subscription
async function handleCancelSubscription(req, res) {
  try {
    const user = await authenticateRequest(req);

    // Get user's Stripe subscription ID
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (fetchError || !userData.stripe_subscription_id) {
      return res.status(400).json({
        success: false,
        error: "No active subscription found",
      });
    }

    // Cancel the subscription in Stripe
    try {
      await stripe.subscriptions.update(userData.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } catch (stripeError) {
      console.error("Stripe cancellation error:", stripeError);
      // Continue with local update even if Stripe fails
    }

    // Update subscription status
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        subscription_status: "canceled",
      })
      .eq("id", user.id)
      .select("id, email, tier")
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to cancel subscription",
      });
    }

    console.log(`❌ Subscription canceled: ${updatedUser.email}`);

    return res.json({
      success: true,
      message: "Subscription canceled successfully",
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

// Create Stripe Checkout for gift subscription
async function handleCreateGiftCheckout(req, res) {
  const {
    giverName,
    giverEmail,
    recipientName,
    recipientEmail,
    subscriptionTier,
    subscriptionDuration,
    personalMessage,
  } = req.body;

  // Validation
  if (
    !giverName ||
    !giverEmail ||
    !recipientName ||
    !recipientEmail ||
    !subscriptionTier ||
    !subscriptionDuration
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing required gift information",
    });
  }

  if (!["essential", "premium"].includes(subscriptionTier)) {
    return res.status(400).json({
      success: false,
      error: "Invalid subscription tier",
    });
  }

  if (!["1mo", "3mo", "1yr"].includes(subscriptionDuration)) {
    return res.status(400).json({
      success: false,
      error: "Invalid subscription duration",
    });
  }

  try {
    // Get the correct price ID for the gift
    const priceId = getGiftPriceId(subscriptionTier, subscriptionDuration);

    if (!priceId) {
      return res.status(500).json({
        success: false,
        error: "Gift price configuration missing",
      });
    }

    // Generate gift code
    const giftCode = generateGiftCode();

    // Create Stripe Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", // One-time payment for gifts
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: giverEmail,
      metadata: {
        type: "gift",
        gift_code: giftCode,
        giver_name: giverName,
        giver_email: giverEmail,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        subscription_tier: subscriptionTier,
        subscription_duration: subscriptionDuration,
        personal_message: personalMessage || "",
      },
      success_url: `${getBaseUrl()}/gifting?session_id={CHECKOUT_SESSION_ID}&success=true&gift_code=${giftCode}`,
      cancel_url: `${getBaseUrl()}/gifting?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    console.log(
      `🎁 Gift checkout session created: ${giftCode} → ${subscriptionTier} (${subscriptionDuration})`
    );

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      giftCode: giftCode,
    });
  } catch (error) {
    console.error("Error creating gift checkout:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create gift checkout",
    });
  }
}

// Redeem subscription gift
async function handleRedeemGift(req, res) {
  const { giftCode, userEmail } = req.body;

  if (!giftCode) {
    return res.status(400).json({
      success: false,
      error: "Gift code required",
    });
  }

  try {
    // Get gift details
    const { data: gift, error: giftError } = await supabase
      .from("subscription_gifts")
      .select("*")
      .eq("gift_code", giftCode)
      .single();

    if (giftError || !gift) {
      return res.status(404).json({
        success: false,
        error: "Invalid gift code",
      });
    }

    if (gift.is_redeemed) {
      return res.status(400).json({
        success: false,
        error: "Gift has already been redeemed",
      });
    }

    // Check if user exists, create if not
    let user;
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", userEmail || gift.recipient_email)
      .single();

    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user account
      const bcrypt = require("bcryptjs");
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email: userEmail || gift.recipient_email,
          password_hash: passwordHash,
          name: gift.recipient_name,
          tier: "free",
          subscription_status: "active",
        })
        .select("*")
        .single();

      if (createError) {
        return res.status(500).json({
          success: false,
          error: "Failed to create user account",
        });
      }

      user = newUser;
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + gift.subscription_duration);

    // Update user with gift subscription
    const { error: updateError } = await supabase
      .from("users")
      .update({
        tier: gift.subscription_tier,
        subscription_status: "active",
        subscription_started_at: startDate.toISOString(),
        subscription_expires_at: endDate.toISOString(),
        subscription_period:
          gift.subscription_duration >= 12 ? "yearly" : "monthly",
      })
      .eq("id", user.id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: "Failed to apply gift subscription",
      });
    }

    // Mark gift as redeemed
    await supabase
      .from("subscription_gifts")
      .update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString(),
        recipient_user_id: user.id,
      })
      .eq("id", gift.id);

    console.log(`🎁 Subscription gift redeemed: ${giftCode} by ${user.email}`);

    return res.json({
      success: true,
      message: "Subscription gift redeemed successfully",
      subscription: {
        tier: gift.subscription_tier,
        duration: gift.subscription_duration,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error redeeming gift:", error);
    throw error;
  }
}

// Validate gift code
async function handleValidateGift(req, res) {
  const { giftCode } = req.query;

  if (!giftCode) {
    return res.status(400).json({
      success: false,
      error: "Gift code required",
    });
  }

  try {
    const { data: gift, error } = await supabase
      .from("subscription_gifts")
      .select("*")
      .eq("gift_code", giftCode)
      .single();

    if (error || !gift) {
      return res.json({
        success: false,
        valid: false,
        error: "Invalid gift code",
      });
    }

    if (gift.is_redeemed) {
      return res.json({
        success: false,
        valid: false,
        error: "Gift has already been redeemed",
      });
    }

    return res.json({
      success: true,
      valid: true,
      gift: {
        recipientName: gift.recipient_name,
        giverName: gift.giver_name,
        subscriptionTier: gift.subscription_tier,
        subscriptionDuration: gift.subscription_duration,
        personalMessage: gift.personal_message,
        createdAt: gift.created_at,
      },
    });
  } catch (error) {
    console.error("Error validating gift:", error);
    throw error;
  }
}

// Get pricing information
async function handleGetPricing(req, res) {
  return res.json({
    success: true,
    pricing: {
      subscriptions: SUBSCRIPTION_PRICING,
      gifts: GIFT_PRICING,
    },
  });
}

// Stripe webhook handler (for gift payment completion)
async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log(`📦 Stripe webhook received: ${event.type}`);

  try {
    // Handle different webhook events
    switch (event.type) {
      case "checkout.session.completed":
        await handleGiftCheckoutCompleted(event);
        break;
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

// Handle completed gift checkout
async function handleGiftCheckoutCompleted(event) {
  try {
    const session = event.data.object;

    // Only process gift payments
    if (session.metadata.type !== "gift") {
      return;
    }

    const {
      gift_code,
      giver_name,
      giver_email,
      recipient_name,
      recipient_email,
      subscription_tier,
      subscription_duration,
      personal_message,
    } = session.metadata;

    // Convert duration to months
    const durationMonths =
      subscription_duration === "1mo"
        ? 1
        : subscription_duration === "3mo"
        ? 3
        : 12;

    // Create subscription gift record
    const { data: gift, error } = await supabase
      .from("subscription_gifts")
      .insert({
        gift_code: gift_code,
        giver_name: giver_name,
        giver_email: giver_email,
        recipient_name: recipient_name,
        recipient_email: recipient_email,
        subscription_tier: subscription_tier,
        subscription_duration: durationMonths,
        amount: session.amount_total / 100, // Convert from cents
        payment_method: "stripe",
        stripe_session_id: session.id,
        personal_message: personal_message || "",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Gift creation error:", error);
      return;
    }

    console.log(
      `🎁 Subscription gift completed: ${gift_code} - ${subscription_tier} for ${durationMonths} months`
    );

    // Send gift invitation email
    await sendGiftInvitation(gift);

    // Send receipt to giver
    await sendGiftReceipt(gift);
  } catch (error) {
    console.error("Error handling gift checkout completion:", error);
  }
}

// Helper functions
function generateGiftCode() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `SUB${timestamp.slice(-4)}${random}`;
}

function getGiftPriceId(tier, duration) {
  const priceMap = {
    essential: {
      "1mo": process.env.STRIPE_ESSENTIAL_1MO_PRICE_ID,
      "3mo": process.env.STRIPE_ESSENTIAL_3MO_PRICE_ID,
      "1yr": process.env.STRIPE_ESSENTIAL_1YR_PRICE_ID,
    },
    premium: {
      "1mo": process.env.STRIPE_PREMIUM_1MO_PRICE_ID,
      "3mo": process.env.STRIPE_PREMIUM_3MO_PRICE_ID,
      "1yr": process.env.STRIPE_PREMIUM_1YR_PRICE_ID,
    },
  };

  return priceMap[tier]?.[duration];
}

async function sendGiftInvitation(gift) {
  try {
    const response = await fetch(`${getBaseUrl()}/api/communication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-subscription-gift-invitation",
        gift,
      }),
    });

    if (response.ok) {
      console.log(
        `📧 Subscription gift invitation sent to ${gift.recipient_email}`
      );
    }
  } catch (error) {
    console.error("Error sending gift invitation:", error);
  }
}

async function sendGiftReceipt(gift) {
  try {
    const response = await fetch(`${getBaseUrl()}/api/communication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate-subscription-gift-receipt",
        gift,
      }),
    });

    if (response.ok) {
      console.log(`🧾 Subscription gift receipt sent to ${gift.giver_email}`);
    }
  } catch (error) {
    console.error("Error generating gift receipt:", error);
  }
}

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  return "http://localhost:3000";
}
