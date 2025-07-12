// api/gifting.js - Mirror of Truth Gift Subscription Management
// Clean API focused only on gifting consciousness experiences

const { createClient } = require("@supabase/supabase-js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to get raw body (for webhooks)
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

// Gift pricing structure
const GIFT_PRICING = {
  essential: {
    "1mo": 4.99,
    "3mo": 12.99, // Slight discount from 14.97
    "1yr": 49.99,
  },
  premium: {
    "1mo": 9.99,
    "3mo": 24.99, // Slight discount from 29.97
    "1yr": 99.99,
  },
};

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Stripe-Signature"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Check if this is a Stripe webhook (has signature header)
    const sig = req.headers["stripe-signature"];

    if (sig && req.method === "POST") {
      console.log(
        "🎁 Detected Stripe webhook for gifts - routing to webhook handler"
      );
      return await handleStripeWebhook(req, res);
    }

    // For non-webhook requests, parse the body manually if needed
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

    const { action } = req.method === "GET" ? req.query : body;

    console.log(`🎁 Gifting API - Action: ${action}`);

    switch (action) {
      case "create-gift-checkout":
        return await handleCreateGiftCheckout(body, res);
      case "validate-gift":
        return await handleValidateGift(req, res);
      case "redeem-gift":
        return await handleRedeemGift(body, res);
      case "get-gift-pricing":
        return await handleGetGiftPricing(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
          availableActions: [
            "create-gift-checkout",
            "validate-gift",
            "redeem-gift",
            "get-gift-pricing",
          ],
        });
    }
  } catch (error) {
    console.error("Gifting API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Gift service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create Stripe Checkout for gift subscription
async function handleCreateGiftCheckout(body, res) {
  const {
    giverName,
    giverEmail,
    recipientName,
    recipientEmail,
    subscriptionTier,
    subscriptionDuration,
    personalMessage,
  } = body;

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
      required: [
        "giverName",
        "giverEmail",
        "recipientName",
        "recipientEmail",
        "subscriptionTier",
        "subscriptionDuration",
      ],
    });
  }

  if (!["essential", "premium"].includes(subscriptionTier)) {
    return res.status(400).json({
      success: false,
      error: "Invalid subscription tier",
      validTiers: ["essential", "premium"],
    });
  }

  if (!["1mo", "3mo", "1yr"].includes(subscriptionDuration)) {
    return res.status(400).json({
      success: false,
      error: "Invalid subscription duration",
      validDurations: ["1mo", "3mo", "1yr"],
    });
  }

  // Validate email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(giverEmail) || !emailRegex.test(recipientEmail)) {
    return res.status(400).json({
      success: false,
      error: "Invalid email format",
    });
  }

  try {
    // Get the correct price ID for the gift
    const priceId = getGiftPriceId(subscriptionTier, subscriptionDuration);

    if (!priceId) {
      return res.status(500).json({
        success: false,
        error: "Gift price configuration missing",
        debug: `Missing price ID for ${subscriptionTier}-${subscriptionDuration}`,
      });
    }

    // Generate unique gift code
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
      `🎁 Gift checkout session created: ${giftCode} → ${subscriptionTier} (${subscriptionDuration}) by ${giverName}`
    );

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      giftCode: giftCode,
      amount: GIFT_PRICING[subscriptionTier][subscriptionDuration],
      currency: "USD",
    });
  } catch (error) {
    console.error("Error creating gift checkout:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create gift checkout",
    });
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
        redeemedAt: gift.redeemed_at,
      });
    }

    console.log(`🎁 Gift code validated: ${giftCode}`);

    return res.json({
      success: true,
      valid: true,
      gift: {
        giftCode: gift.gift_code,
        recipientName: gift.recipient_name,
        giverName: gift.giver_name,
        subscriptionTier: gift.subscription_tier,
        subscriptionDuration: gift.subscription_duration,
        personalMessage: gift.personal_message,
        amount: gift.amount,
        createdAt: gift.created_at,
        durationLabel: getDurationLabel(gift.subscription_duration),
        tierLabel: getTierLabel(gift.subscription_tier),
      },
    });
  } catch (error) {
    console.error("Error validating gift:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to validate gift code",
    });
  }
}

// Redeem subscription gift
async function handleRedeemGift(body, res) {
  const { giftCode, userEmail } = body;

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
        redeemedAt: gift.redeemed_at,
      });
    }

    // Use provided email or gift recipient email
    const targetEmail = userEmail || gift.recipient_email;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", targetEmail.toLowerCase())
      .single();

    let user = existingUser;

    // If user doesn't exist, create account
    if (!existingUser) {
      const bcrypt = require("bcryptjs");
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email: targetEmail.toLowerCase(),
          password_hash: passwordHash,
          name: gift.recipient_name,
          tier: "free",
          subscription_status: "active",
          language: "en",
          current_month_year: new Date().toISOString().slice(0, 7),
          email_verified: false,
        })
        .select("*")
        .single();

      if (createError) {
        console.error("Error creating user for gift:", createError);
        return res.status(500).json({
          success: false,
          error: "Failed to create user account",
        });
      }

      user = newUser;
      console.log(`🎁 New user created for gift: ${user.email}`);
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);

    // Convert duration to months
    const durationMonths =
      gift.subscription_duration === 1
        ? 1
        : gift.subscription_duration === 3
        ? 3
        : 12;

    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Update user with gift subscription
    const { error: updateError } = await supabase
      .from("users")
      .update({
        tier: gift.subscription_tier,
        subscription_status: "active",
        subscription_started_at: startDate.toISOString(),
        subscription_expires_at: endDate.toISOString(),
        subscription_period: durationMonths >= 12 ? "yearly" : "monthly",
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error applying gift subscription:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to apply gift subscription",
      });
    }

    // Mark gift as redeemed
    const { error: redeemError } = await supabase
      .from("subscription_gifts")
      .update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString(),
        recipient_user_id: user.id,
      })
      .eq("id", gift.id);

    if (redeemError) {
      console.error("Error marking gift as redeemed:", redeemError);
      // Continue anyway - subscription was applied
    }

    console.log(`🎁 Subscription gift redeemed: ${giftCode} by ${user.email}`);

    // Send welcome email for new users
    if (!existingUser) {
      try {
        await sendGiftWelcomeEmail(user, gift);
      } catch (emailError) {
        console.warn("Gift welcome email failed:", emailError);
      }
    }

    return res.json({
      success: true,
      message: "Subscription gift redeemed successfully",
      subscription: {
        tier: gift.subscription_tier,
        duration: durationMonths,
        durationLabel: getDurationLabel(gift.subscription_duration),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      user: {
        email: user.email,
        name: user.name,
        isNewAccount: !existingUser,
      },
      gift: {
        giverName: gift.giver_name,
        personalMessage: gift.personal_message,
      },
    });
  } catch (error) {
    console.error("Error redeeming gift:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to redeem gift",
    });
  }
}

// Get gift pricing information
async function handleGetGiftPricing(req, res) {
  const formattedPricing = {};

  Object.keys(GIFT_PRICING).forEach((tier) => {
    formattedPricing[tier] = {};
    Object.keys(GIFT_PRICING[tier]).forEach((duration) => {
      formattedPricing[tier][duration] = {
        amount: GIFT_PRICING[tier][duration],
        currency: "USD",
        label: `${getTierLabel(tier)} - ${getDurationLabel(duration)}`,
        savings: calculateSavings(tier, duration),
      };
    });
  });

  return res.json({
    success: true,
    pricing: formattedPricing,
    currency: "USD",
    note: "Prices in USD. Recipient can use gift immediately after redemption.",
  });
}

// Stripe webhook handler (for gift payment completion)
async function handleStripeWebhook(req, res) {
  console.log("🎁 Gift webhook received");

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
    console.log("✅ Raw body retrieved for gifts, length:", rawBody.length);
  } catch (err) {
    console.error("❌ Failed to get raw body:", err.message);
    return res.status(400).json({ error: "Failed to read request body" });
  }

  try {
    // Verify webhook signature with raw body
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log("✅ Gift webhook signature verified successfully");
  } catch (err) {
    console.error(
      "❌ Gift webhook signature verification failed:",
      err.message
    );
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log(`📦 Stripe gift webhook received: ${event.type}`);
  console.log(`📦 Event ID: ${event.id}`);

  try {
    // Handle different webhook events
    switch (event.type) {
      case "checkout.session.completed":
        console.log("🎁 Processing gift checkout.session.completed");
        await handleGiftCheckoutCompleted(event);
        break;
      default:
        console.log(`⚠️ Unhandled Stripe gift event: ${event.type}`);
    }

    console.log("✅ Gift webhook processed successfully");
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Stripe gift webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

// Handle completed gift checkout
async function handleGiftCheckoutCompleted(event) {
  try {
    const session = event.data.object;

    // Only process gift payments
    if (session.metadata.type !== "gift") {
      console.log("⚠️ Non-gift checkout session, skipping");
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
        payment_id: session.payment_intent,
        personal_message: personal_message || "",
        language: "en",
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

    // Send gift invitation email to recipient
    await sendGiftInvitation(gift);

    // Send receipt to giver
    await sendGiftReceipt(gift);
  } catch (error) {
    console.error("Error handling gift checkout completion:", error);
  }
}

// Utility functions
function generateGiftCode() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `GIFT${timestamp.slice(-4)}${random}`;
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

function getDurationLabel(duration) {
  const labels = {
    1: "1 Month",
    3: "3 Months",
    12: "1 Year",
    "1mo": "1 Month",
    "3mo": "3 Months",
    "1yr": "1 Year",
  };
  return labels[duration] || `${duration} Months`;
}

function getTierLabel(tier) {
  const labels = {
    essential: "Essential",
    premium: "Premium",
  };
  return labels[tier] || tier;
}

function calculateSavings(tier, duration) {
  if (duration === "3mo") {
    const monthlyPrice = GIFT_PRICING[tier]["1mo"];
    const threeMonthPrice = GIFT_PRICING[tier]["3mo"];
    const regularPrice = monthlyPrice * 3;
    const savings = regularPrice - threeMonthPrice;
    return savings > 0
      ? {
          amount: savings,
          percentage: Math.round((savings / regularPrice) * 100),
        }
      : null;
  }
  return null;
}

// Email functions
async function sendGiftInvitation(gift) {
  try {
    const response = await fetch(`${getBaseUrl()}/api/communication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-gift-invitation",
        gift,
      }),
    });

    if (response.ok) {
      console.log(`📧 Gift invitation sent to ${gift.recipient_email}`);
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
        action: "send-gift-receipt",
        gift,
      }),
    });

    if (response.ok) {
      console.log(`🧾 Gift receipt sent to ${gift.giver_email}`);
    }
  } catch (error) {
    console.error("Error sending gift receipt:", error);
  }
}

async function sendGiftWelcomeEmail(user, gift) {
  try {
    const response = await fetch(`${getBaseUrl()}/api/communication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-gift-welcome",
        user,
        gift,
      }),
    });

    if (response.ok) {
      console.log(`📧 Gift welcome email sent to ${user.email}`);
    }
  } catch (error) {
    console.error("Error sending gift welcome email:", error);
  }
}

function getBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return "https://www.mirror-of-truth.xyz";
  }
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
