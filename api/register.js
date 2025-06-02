/* =========================================================================
   FILE: api/register.js      (Public endpoint → proxies to /api/admin-data)
   Purpose: accept a registration payload from the browser and forward it
            to the secured /api/admin-data route WITH the CREATOR_SECRET_KEY
            so that the entry appears in the admin panel.
   Updated: 2025‑06‑03 – switched to query‑param auth (Vercel strips custom
                      same‑origin Authorization headers).
   ========================================================================= */

export default async function handler(req, res) {
  /*───────────────────────────────────────────────────────────
      CORS & Pre‑flight
    ───────────────────────────────────────────────────────────*/
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  /*───────────────────────────────────────────────────────────
      Only POST is supported
    ───────────────────────────────────────────────────────────*/
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });

  /*───────────────────────────────────────────────────────────
      Basic validation – name + email are required
    ───────────────────────────────────────────────────────────*/
  const { name, email, language = "en" } = req.body || {};
  if (!name || !email)
    return res
      .status(400)
      .json({ success: false, error: "Name and email are required" });

  /*───────────────────────────────────────────────────────────
      Resolve the base URL that points back to *this* deployment
      Order of precedence:
        1. INTERNAL_BASE_URL (manual override)
        2. https://${VERCEL_URL} (set by Vercel at runtime)
        3. ${proto}://${hostHeader}            (generic hosts / local dev)
    ───────────────────────────────────────────────────────────*/
  const proto = (req.headers["x-forwarded-proto"] || "https")
    .split(",")[0]
    .trim();
  const hostHeader =
    req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";

  const baseURL =
    process.env.INTERNAL_BASE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    `${proto}://${hostHeader}`;

  // Append the secret as a query param because Vercel strips same‑origin
  // custom Authorization headers coming from serverless functions.
  const adminURL = `${baseURL}/api/admin-data?key=${encodeURIComponent(
    process.env.CREATOR_SECRET_KEY || ""
  )}`;

  try {
    /*─────────────────────────────────────────────────────────
        Forward the registration with the creator key (server‑side)
      ─────────────────────────────────────────────────────────*/
    const adminRes = await fetch(adminURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addRegistration",
        name,
        email,
        language,
        source: "website",
        timestamp: new Date().toISOString(),
      }),
    });

    /*─────────────────────────────────────────────────────────
        Handle JSON or non‑JSON responses gracefully
      ─────────────────────────────────────────────────────────*/
    let forwarded;
    const contentType = adminRes.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      forwarded = await adminRes.json();
    } else {
      const text = await adminRes.text();
      throw new Error(
        `Upstream non‑JSON (${adminRes.status}): ${text.slice(0, 120)}`
      );
    }

    if (!forwarded.success) {
      throw new Error(forwarded.error || "Admin insert failed");
    }

    return res.json({ success: true, message: "Registration recorded" });
  } catch (err) {
    console.error("Public register proxy error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Unknown error" });
  }
}
