// api/subscriptions.js - Mirror of Truth Subscription Management
// Clean API focused only on subscription lifecycle management

const { createClient } = require("@supabase/supabase-js");
const { authenticateRequest } = require("./auth.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    console.log(`💳 Subscriptions API - Action: ${action}`);

    switch (action) {
      case "get-current":
        return await handleGetCurrent(req, res);
      case "cancel-subscription":
        return await handleCancelSubscription(req, res);
      case "get-customer-portal":
        return await handleGetCustomerPortal(req, res);
      case "reactivate":
        return await handleReactivateSubscription(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
          availableActions: [
            "get-current",
            "cancel-subscription",
            "get-customer-portal",
            "reactivate",
          ],
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

// Get current user subscription details
async function handleGetCurrent(req, res) {
  try {
    const user = await authenticateRequest(req);

    const { data: subscription, error } = await supabase
      .from("users")
      .select(
        `
        tier, subscription_status, subscription_period, 
        stripe_subscription_id, stripe_customer_id,
        subscription_started_at, subscription_expires_at
      `
      )
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Failed to get subscription details:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get subscription details",
      });
    }

    // Calculate subscription info
    const isActive = subscription.subscription_status === "active";
    const isSubscribed = subscription.tier !== "free";
    const isCanceled = subscription.subscription_status === "canceled";

    // Calculate next billing date (approximate)
    let nextBilling = null;
    if (
      subscription.subscription_started_at &&
      subscription.subscription_period &&
      isActive
    ) {
      const startDate = new Date(subscription.subscription_started_at);
      const nextDate = new Date(startDate);

      if (subscription.subscription_period === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (subscription.subscription_period === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      nextBilling = nextDate.toISOString();
    }

    // Calculate pricing
    const pricing = {
      essential: { monthly: 4.99, yearly: 49.99 },
      premium: { monthly: 9.99, yearly: 99.99 },
    };

    const currentPrice = isSubscribed
      ? pricing[subscription.tier]?.[subscription.subscription_period]
      : 0;

    console.log(
      `💳 Subscription details retrieved for: ${user.email} (${subscription.tier})`
    );

    return res.json({
      success: true,
      subscription: {
        tier: subscription.tier,
        status: subscription.subscription_status,
        period: subscription.subscription_period,
        startedAt: subscription.subscription_started_at,
        expiresAt: subscription.subscription_expires_at,
        nextBilling: nextBilling,
        currentPrice: currentPrice,
        currency: "USD",

        // Status flags
        isActive: isActive,
        isSubscribed: isSubscribed,
        isCanceled: isCanceled,
        canUpgrade: subscription.tier === "essential",
        canDowngrade: subscription.tier === "premium",
        canReactivate: isCanceled && isSubscribed,

        // Stripe integration flags
        hasStripeData: !!(
          subscription.stripe_subscription_id && subscription.stripe_customer_id
        ),
        stripeSubscriptionId: subscription.stripe_subscription_id,
        stripeCustomerId: subscription.stripe_customer_id,
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

// Cancel subscription (set to cancel at period end)
async function handleCancelSubscription(req, res) {
  try {
    const user = await authenticateRequest(req);

    // Get user's subscription details
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("stripe_subscription_id, stripe_customer_id, email, tier")
      .eq("id", user.id)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({
        success: false,
        error: "User subscription not found",
      });
    }

    if (userData.tier === "free") {
      return res.status(400).json({
        success: false,
        error: "No active subscription to cancel",
      });
    }

    if (!userData.stripe_subscription_id) {
      return res.status(400).json({
        success: false,
        error: "No Stripe subscription found",
      });
    }

    // Cancel subscription in Stripe (at period end)
    let stripeSuccess = false;
    try {
      const stripeSubscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );
      stripeSuccess = true;
      console.log(`💳 Stripe subscription canceled: ${stripeSubscription.id}`);
    } catch (stripeError) {
      console.error("Stripe cancellation error:", stripeError);
      // Continue with local update even if Stripe fails
    }

    // Update local subscription status
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        subscription_status: "canceled",
      })
      .eq("id", user.id)
      .select("email, tier, subscription_status")
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: "Failed to update subscription status",
      });
    }

    console.log(
      `❌ Subscription canceled: ${updatedUser.email} (${updatedUser.tier})`
    );

    return res.json({
      success: true,
      message: "Subscription canceled successfully",
      subscription: {
        status: "canceled",
        tier: updatedUser.tier,
        stripeUpdated: stripeSuccess,
        note: "Your subscription will remain active until the end of your current billing period",
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

// Get Stripe Customer Portal URL
async function handleGetCustomerPortal(req, res) {
  try {
    const user = await authenticateRequest(req);

    // Get user's Stripe customer ID
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({
        success: false,
        error: "User data not found",
      });
    }

    if (!userData.stripe_customer_id) {
      return res.status(400).json({
        success: false,
        error: "No Stripe customer account found. Please contact support.",
      });
    }

    // Create Stripe Customer Portal session
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: userData.stripe_customer_id,
        return_url: `${getBaseUrl()}/subscription`,
      });

      console.log(`💳 Customer portal created for: ${userData.email}`);

      return res.json({
        success: true,
        portalUrl: portalSession.url,
        message: "Customer portal URL generated successfully",
      });
    } catch (stripeError) {
      console.error("Stripe portal error:", stripeError);
      return res.status(500).json({
        success: false,
        error: "Failed to create customer portal session",
        details:
          process.env.NODE_ENV === "development"
            ? stripeError.message
            : undefined,
      });
    }
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

// Reactivate canceled subscription
async function handleReactivateSubscription(req, res) {
  try {
    const user = await authenticateRequest(req);

    // Get user's subscription details
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("stripe_subscription_id, subscription_status, tier, email")
      .eq("id", user.id)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({
        success: false,
        error: "User subscription not found",
      });
    }

    if (userData.subscription_status !== "canceled") {
      return res.status(400).json({
        success: false,
        error: "Subscription is not canceled",
      });
    }

    if (userData.tier === "free") {
      return res.status(400).json({
        success: false,
        error: "No subscription to reactivate",
      });
    }

    if (!userData.stripe_subscription_id) {
      return res.status(400).json({
        success: false,
        error: "No Stripe subscription found",
      });
    }

    // Reactivate in Stripe (remove cancel_at_period_end)
    let stripeSuccess = false;
    try {
      const stripeSubscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        {
          cancel_at_period_end: false,
        }
      );
      stripeSuccess = true;
      console.log(
        `💳 Stripe subscription reactivated: ${stripeSubscription.id}`
      );
    } catch (stripeError) {
      console.error("Stripe reactivation error:", stripeError);
      // Continue with local update even if Stripe fails
    }

    // Update local subscription status
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        subscription_status: "active",
      })
      .eq("id", user.id)
      .select("email, tier, subscription_status")
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: "Failed to reactivate subscription",
      });
    }

    console.log(
      `✅ Subscription reactivated: ${updatedUser.email} (${updatedUser.tier})`
    );

    return res.json({
      success: true,
      message: "Subscription reactivated successfully",
      subscription: {
        status: "active",
        tier: updatedUser.tier,
        stripeUpdated: stripeSuccess,
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

// Utility functions
function getBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return "https://www.mirror-of-truth.xyz";
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  return "http://localhost:3000";
}
