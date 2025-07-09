// api/subscriptions.js - Mirror of Truth Subscription Management with PayPal

const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");

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
    "3mo": 14.97, // 3 * 4.99
    "1yr": 49.99, // Annual price
  },
  premium: {
    "1mo": 9.99,
    "3mo": 29.97, // 3 * 9.99
    "1yr": 99.99, // Annual price
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
      case "gift-subscription":
        return await handleGiftSubscription(req, res);
      case "redeem-gift":
        return await handleRedeemGift(req, res);
      case "validate-gift":
        return await handleValidateGift(req, res);
      case "get-pricing":
        return await handleGetPricing(req, res);
      case "webhook":
        return await handlePayPalWebhook(req, res);
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
        tier, subscription_status, subscription_period, subscription_id,
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

// Create new subscription (for register flow - to be used later)
async function handleCreateSubscription(req, res) {
  try {
    const user = await authenticateRequest(req);
    const { tier, period, paypalSubscriptionId } = req.body;

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
        subscription_id: paypalSubscriptionId,
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

// Gift subscription
async function handleGiftSubscription(req, res) {
  const {
    giverName,
    giverEmail,
    recipientName,
    recipientEmail,
    subscriptionTier,
    subscriptionDuration,
    personalMessage,
    paymentMethod = "paypal",
    paymentId,
    amount,
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

  // Validate pricing
  const expectedAmount = GIFT_PRICING[subscriptionTier][subscriptionDuration];
  if (Math.abs(parseFloat(amount) - expectedAmount) > 0.01) {
    return res.status(400).json({
      success: false,
      error: "Invalid amount for selected gift",
    });
  }

  try {
    // Generate gift code
    const giftCode = generateGiftCode();

    // Convert duration to months
    const durationMonths =
      subscriptionDuration === "1mo"
        ? 1
        : subscriptionDuration === "3mo"
        ? 3
        : 12;

    // Create subscription gift
    const { data: gift, error } = await supabase
      .from("subscription_gifts")
      .insert({
        gift_code: giftCode,
        giver_name: giverName,
        giver_email: giverEmail,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        subscription_tier: subscriptionTier,
        subscription_duration: durationMonths,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_id: paymentId,
        personal_message: personalMessage || "",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Gift creation error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create subscription gift",
      });
    }

    console.log(
      `🎁 Subscription gift created: ${giftCode} - ${subscriptionTier} for ${durationMonths} months`
    );

    // Send gift invitation email
    await sendGiftInvitation(gift);

    // Send receipt to giver
    await sendGiftReceipt(gift);

    return res.json({
      success: true,
      message: "Subscription gift created successfully",
      giftCode: giftCode,
      gift: {
        tier: subscriptionTier,
        duration: subscriptionDuration,
        amount: amount,
      },
    });
  } catch (error) {
    console.error("Error creating subscription gift:", error);
    throw error;
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

// PayPal webhook handler (for subscription updates)
async function handlePayPalWebhook(req, res) {
  try {
    const event = req.body;

    console.log(`📦 PayPal webhook received: ${event.event_type}`);

    // Handle different PayPal events
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(event);
        break;
      case "BILLING.SUBSCRIPTION.EXPIRED":
        await handleSubscriptionExpired(event);
        break;
      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentCompleted(event);
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

// Helper functions
function generateGiftCode() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `SUB${timestamp.slice(-4)}${random}`;
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

// Webhook event handlers
async function handleSubscriptionCancelled(event) {
  try {
    const subscriptionId = event.resource.id;

    const { error } = await supabase
      .from("users")
      .update({ subscription_status: "canceled" })
      .eq("subscription_id", subscriptionId);

    if (error) {
      console.error("Error updating canceled subscription:", error);
    } else {
      console.log(`📵 Subscription canceled via webhook: ${subscriptionId}`);
    }
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}

async function handleSubscriptionExpired(event) {
  try {
    const subscriptionId = event.resource.id;

    const { error } = await supabase
      .from("users")
      .update({
        subscription_status: "expired",
        tier: "free",
      })
      .eq("subscription_id", subscriptionId);

    if (error) {
      console.error("Error updating expired subscription:", error);
    } else {
      console.log(`⏰ Subscription expired via webhook: ${subscriptionId}`);
    }
  } catch (error) {
    console.error("Error handling subscription expiration:", error);
  }
}

async function handlePaymentCompleted(event) {
  // Handle successful payment completion
  console.log(`💰 Payment completed: ${event.resource.id}`);
}
