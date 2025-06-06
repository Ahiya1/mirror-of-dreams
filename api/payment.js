// API: Payment - Sacred Payment Processing with Premium Support

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

      if (action === "register") {
        return await handleRegister(req, res);
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

// Get PayPal configuration with pricing tiers
async function handleGetConfig(req, res) {
  try {
    const config = {
      clientId: process.env.PAYPAL_CLIENT_ID,
      currency: "USD",
      environment:
        process.env.NODE_ENV === "production" ? "production" : "sandbox",
      pricing: {
        basic: {
          amount: "2.99",
          name: "Essential Reflection",
          description: "Deep reflection using our core mirror technology",
        },
        premium: {
          amount: "4.99",
          name: "Premium Reflection",
          description:
            "Enhanced reflection with extended AI thinking and deeper insights",
        },
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
      `💳 PayPal config requested - Environment: ${config.environment}, Currency: ${config.currency}`
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

// Handle user registration with premium option
async function handleRegister(req, res) {
  // Check environment
  if (!process.env.CREATOR_SECRET_KEY) {
    console.error("🚨 register.js: CREATOR_SECRET_KEY is NOT defined!");
    return res.status(500).json({
      success: false,
      error: "Server mis-configuration",
    });
  }

  const { name, email, language = "en", isPremium = false } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: "Name and email are required",
    });
  }

  try {
    console.log(
      `🚀 Processing registration for: ${name} (${email}) - ${
        isPremium ? "Premium" : "Basic"
      }`
    );

    // For now, we'll just validate and return success
    // In the future, this could store registration data
    const registrationData = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name,
      email,
      language,
      isPremium,
      source: "website",
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Registration processed successfully:", registrationData.id);

    return res.json({
      success: true,
      message: "Registration recorded",
      id: registrationData.id,
      isPremium: isPremium,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
    });
  }
}
