/* =========================================================================
   FILE: api/register.js  (Public endpoint → proxies to /api/admin-data)
   ========================================================================= */

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

  /*── Build a reliable base URL for the same deployment ────────────────*/
  const proto = req.headers["x-forwarded-proto"] ? "https" : "http";
  const host =
    req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";

  // For Vercel, use the canonical URL or fallback to headers
  const baseURL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `${proto}://${host}`;

  const adminURL = `${baseURL}/api/admin-data`;

  console.log("🔗 Making internal request to:", adminURL);

  try {
    const adminRes = await fetch(adminURL, {
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

    console.log("📡 Admin response status:", adminRes.status);

    /*── Accept JSON only; treat anything else as an error ──────────────*/
    const ct = adminRes.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const txt = await adminRes.text();
      console.error("❌ Non-JSON response:", txt.slice(0, 200));
      throw new Error(
        `Upstream non-JSON (${adminRes.status}): ${txt.slice(0, 120)}`
      );
    }

    const payload = await adminRes.json();
    console.log("📋 Admin response payload:", payload);

    if (!payload.success) {
      throw new Error(payload.error || "Admin insert failed");
    }

    return res.json({ success: true, message: "Registration recorded" });
  } catch (err) {
    console.error("Public register proxy error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Unknown error" });
  }
}
