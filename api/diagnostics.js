// Create a new file: /api/diagnostic.js and run this to check your setup

const { createClient } = require("@supabase/supabase-js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not allowed in production" });
  }

  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: {},
    redis: {},
    stripe: {},
    supabase: {},
    webhookTest: {},
  };

  try {
    // 1. Check Environment Variables
    console.log("🔍 Checking environment variables...");
    diagnostic.environment = {
      NODE_ENV: process.env.NODE_ENV,
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      domain: process.env.DOMAIN || "Not set",
    };

    // 2. Test Redis Connection
    console.log("🔍 Testing Redis...");
    try {
      const { Redis } = require("@upstash/redis");
      const redis = Redis.fromEnv();

      const testKey = `diagnostic_${Date.now()}`;
      const testData = { test: true, timestamp: Date.now() };

      await redis.setex(testKey, 60, JSON.stringify(testData));
      const retrieved = await redis.get(testKey);
      await redis.del(testKey);

      diagnostic.redis = {
        status: "working",
        canStore: true,
        canRetrieve: !!retrieved,
        canDelete: true,
      };
    } catch (redisError) {
      diagnostic.redis = {
        status: "failed",
        error: redisError.message,
      };
    }

    // 3. Test Stripe Connection
    console.log("🔍 Testing Stripe...");
    try {
      const account = await stripe.accounts.retrieve();
      diagnostic.stripe = {
        status: "working",
        accountId: account.id,
        country: account.country,
      };
    } catch (stripeError) {
      diagnostic.stripe = {
        status: "failed",
        error: stripeError.message,
      };
    }

    // 4. Test Supabase Connection
    console.log("🔍 Testing Supabase...");
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      diagnostic.supabase = {
        status: error ? "failed" : "working",
        error: error?.message,
        canQuery: !error,
      };
    } catch (supabaseError) {
      diagnostic.supabase = {
        status: "failed",
        error: supabaseError.message,
      };
    }

    // 5. Test Recent Webhook Events
    console.log("🔍 Checking recent Stripe events...");
    try {
      const events = await stripe.events.list({
        limit: 10,
        types: ["checkout.session.completed"],
      });

      diagnostic.webhookTest = {
        recentEvents: events.data.length,
        lastEvent: events.data[0]
          ? {
              id: events.data[0].id,
              created: new Date(events.data[0].created * 1000).toISOString(),
              metadata: events.data[0].data.object.metadata,
            }
          : null,
      };
    } catch (webhookError) {
      diagnostic.webhookTest = {
        status: "failed",
        error: webhookError.message,
      };
    }

    // 6. Check for stuck users (paid but not created)
    console.log("🔍 Looking for potential stuck users...");
    try {
      const recentSessions = await stripe.checkout.sessions.list({
        limit: 20,
        status: "complete",
      });

      const stuckSessions = [];
      for (const session of recentSessions.data) {
        if (session.metadata?.email) {
          try {
            const supabase = createClient(
              process.env.SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            const { data: user } = await supabase
              .from("users")
              .select("id, email")
              .eq("email", session.metadata.email)
              .single();

            if (!user) {
              stuckSessions.push({
                sessionId: session.id,
                email: session.metadata.email,
                created: new Date(session.created * 1000).toISOString(),
                metadata: session.metadata,
              });
            }
          } catch (checkError) {
            // User might not exist, which is what we're looking for
          }
        }
      }

      diagnostic.stuckUsers = stuckSessions;
    } catch (stuckError) {
      diagnostic.stuckUsers = { error: stuckError.message };
    }

    res.json({
      success: true,
      diagnostic,
      summary: {
        redis: diagnostic.redis.status,
        stripe: diagnostic.stripe.status,
        supabase: diagnostic.supabase.status,
        stuckUsersFound: diagnostic.stuckUsers?.length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      diagnostic,
    });
  }
};

// Also add this test endpoint to manually trigger webhook processing
// Add to end of api/payment.js:

// Test endpoint to manually process a stuck session
if (process.env.NODE_ENV !== "production") {
  module.exports.testProcessSession = async function (req, res) {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.status !== "complete") {
        return res.status(400).json({ error: "Session not completed" });
      }

      // Manually trigger the webhook handler
      const fakeEvent = {
        type: "checkout.session.completed",
        data: { object: session },
      };

      await handleCheckoutSessionCompleted(fakeEvent);

      res.json({
        success: true,
        message: "Session processed manually",
        session: {
          id: session.id,
          metadata: session.metadata,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}
