// API: Creator Authentication - Sacred Access Control

const { Redis } = require("@upstash/redis");

// Initialize Redis connection
const redis = Redis.fromEnv();

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }

  try {
    // Check against environment variable
    if (password === process.env.CREATOR_SECRET_KEY) {
      console.log("🔑 Creator access granted");

      return res.status(200).json({
        success: true,
        user: {
          name: "Ahiya",
          email: "ahiya.butman@gmail.com",
          language: "en",
          isCreator: true,
        },
      });
    }

    console.log("❌ Invalid creator access attempt");
    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error("Creator auth error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication service error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
