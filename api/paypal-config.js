/* =========================================================================
   FILE: api/paypal-config.js
   PayPal configuration endpoint for Mirror of Truth - $5 USD
   ========================================================================= */

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Return PayPal configuration for $5 USD
    const config = {
      clientId: process.env.PAYPAL_CLIENT_ID,
      currency: "USD", // Changed from ILS to USD
      environment:
        process.env.NODE_ENV === "production" ? "production" : "sandbox",
    };

    // Validate that we have the required config
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

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("PayPal Config Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load PayPal configuration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
