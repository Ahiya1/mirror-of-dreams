/* =========================================================================
   FILE: api/register.js
   PUBLIC REGISTRATION ENDPOINT (Vercel‑friendly)
   -------------------------------------------------------------------------
   Accepts a registration payload from the browser and forwards it to
   the secured /api/admin-data route WITH the CREATOR_SECRET_KEY so that
   the entry appears in the admin panel. Works both locally and on Vercel.
   ========================================================================= */

export default async function handler(req, res) {
  /*───────────────────────────────────────────────────────────────────────
      CORS pre‑flight support
    ───────────────────────────────────────────────────────────────────────*/
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only POST is allowed
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  /*───────────────────────────────────────────────────────────────────────
      Basic payload validation
    ───────────────────────────────────────────────────────────────────────*/
  const { name, email, language = "en" } = req.body || {};
  if (!name || !email) {
    return res
      .status(400)
      .json({ success: false, error: "Name and email are required" });
  }

  /*───────────────────────────────────────────────────────────────────────
      Utility: derive the base URL for the *same* deployment
        1. INTERNAL_BASE_URL (explicit override)
        2. VERCEL_URL (set by Vercel at runtime)
        3. req.headers.host   (fallback for other hosts)
        4. localhost fallback (dev)
    ───────────────────────────────────────────────────────────────────────*/
  const deriveBaseUrl = () => {
    if (process.env.INTERNAL_BASE_URL) return process.env.INTERNAL_BASE_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

    if (req.headers && req.headers.host) {
      const proto = req.headers["x-forwarded-proto"] || "https";
      return `${proto}://${req.headers.host}`;
    }

    return "http://localhost:3000";
  };

  const adminEndpoint = `${deriveBaseUrl()}/api/admin-data`;

  try {
    /*───────────────────────────────────────────────────────────────────
        Forward the registration to the secure admin endpoint
      ───────────────────────────────────────────────────────────────────*/
    const adminRes = await fetch(adminEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.CREATOR_SECRET_KEY,
      },
      body: JSON.stringify({
        action: "addRegistration",
        name,
        email,
        language,
        source: "website",
        timestamp: new Date().toISOString(),
      }),
    });

    const result = await adminRes.json();
    if (!adminRes.ok || !result.success) {
      throw new Error(
        result.error || `Admin insert failed (status ${adminRes.status})`
      );
    }

    // Success response for the browser
    return res.json({ success: true, message: "Registration recorded" });
  } catch (err) {
    console.error("Public register proxy error:", err);
    return res
      .status(500)
      .json({
        success: false,
        error: "Registration failed – please try again.",
      });
  }
}
