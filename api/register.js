/* =========================================================================
   FILE: api/register.js  (Public endpoint → uses shared storage)
   ========================================================================= */

import { addRegistration } from "../lib/storage.js";

export default async function handler(req, res) {
  /*── Verify the secret is really available here ───────────────────────*/
  if (!process.env.CREATOR_SECRET_KEY) {
    console.error("🚨 register.js: CREATOR_SECRET_KEY is NOT defined!");
    return res
      .status(500)
      .json({ success: false, error: "Server mis-configuration" });
  }

  /*── CORS & pre-flight ────────────────────────────────────────────────*/
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  /*── Only POST is accepted ────────────────────────────────────────────*/
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  /*── Minimal validation ───────────────────────────────────────────────*/
  const { name, email, language = "en" } = req.body || {};
  if (!name || !email) {
    return res
      .status(400)
      .json({ success: false, error: "Name and email are required" });
  }

  try {
    // Use shared storage directly
    const newRegistration = addRegistration({
      name,
      email,
      language,
      source: "website",
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Registration added successfully:", newRegistration.id);

    return res.json({
      success: true,
      message: "Registration recorded",
      id: newRegistration.id,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Unknown error" });
  }
}
