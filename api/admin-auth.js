/* =========================================================================
   FILE: api/admin-auth.js
   Sacred authentication for Mirror of Truth admin panel
   ========================================================================= */

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "POST") {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Password required",
        });
      }

      // Use the same creator secret key for admin access
      if (password === process.env.CREATOR_SECRET_KEY) {
        return res.json({
          success: true,
          message: "Welcome to the sacred admin space",
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(401).json({
        success: false,
        error: "Invalid admin credentials",
      });
    }

    // GET method for checking auth status
    if (req.method === "GET") {
      const { key } = req.query;

      if (key === process.env.CREATOR_SECRET_KEY) {
        return res.json({
          success: true,
          authenticated: true,
        });
      }

      return res.status(401).json({
        success: false,
        authenticated: false,
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Admin Auth Error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
